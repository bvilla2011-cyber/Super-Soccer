import { clone, random, hash, lerp, clamp, distance } from './utils.js';
import { simulateMatch, penaltySeries } from './simulation.js';
import { createPlayers, createBall, attackDirection } from './entities.js';
import { PITCH } from './physics.js';

const SHOTS=new Set(['goal','save','wide','post']);
const lerpPoint=(a,b,t)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)});
const ease=t=>t*t*(3-2*t);
export const STATE_LABELS={Entrance:'Entrada al campo',Kickoff:'Saque de centro',InPlay:'En juego',Action:'Jugada destacada',HalfTime:'Descanso',FullTime:'Final del partido',Shootout:'Tanda de penaltis'};

// The match director presents a statistical simulation. There are deliberately no
// player inputs, aiming controls, or instant-result shortcuts in the application.
export class MatchSimulation {
  constructor({home,away,fixtureId,userSide=0,knockout=false,difficulty='club',duration=180,seed=42,snapshot=null,onEvent=()=>{},onEnd=()=>{}}) {
    this.teams=[clone(home),clone(away)];this.fixtureId=fixtureId;this.userSide=userSide;this.knockout=knockout;this.difficulty=difficulty;this.duration=duration;
    this.onEvent=onEvent;this.onEnd=onEnd;this.finishedEmitted=false;this.paused=false;this.speed=1;
    this.rng=random(seed);this.visualRng=random(seed^0x58a74c);this.clock=0;this.half=1;this.elapsed=0;this.state='Entrance';this.stateTime=0;this.score=[0,0];this.visibleShots=[0,0];this.visibleEvents=[];this.ball=createBall();this.players=this.teams.flatMap((t,i)=>createPlayers(t,i));this.activeAction=null;this.actionIndex=0;this.passTime=0;this.pass=null;this.banner={title:'SALEN LOS EQUIPOS',subtitle:`${home.name} · ${away.name}`,time:4};this.pens=null;this.penaltyIndex=0;this.penaltyVisible=[0,0];this.firstHalf=null;this.secondHalf=null;this.substitutions=[0,0];this.subbedOut=[];
    if(snapshot) {
      for(const key of SNAPSHOT_KEYS)if(snapshot[key]!==undefined)this[key]=clone(snapshot[key]);
      this.rng=random(snapshot.rngState);this.visualRng=random(snapshot.visualRngState??42);this.paused=true;
    } else {
      for(const p of this.players){p.x=p.side===0?430+p.index*13:620+p.index*13;p.y=PITCH.height+48+p.index*3;p.headingX=0;p.headingY=-1;}
      this.firstHalf=this.simulatePeriod(1);
    }
    this.cues=this.buildCues();
  }
  simulatePeriod(half) {
    const copies=this.teams.map(t=>clone(t));
    if(half===2)for(const t of copies)t.matchLimit=5-t.roster.filter(p=>this.firstHalf?.players[p.id]?.red).length;
    for(const t of copies)for(const p of t.roster) {
      const earlier=this.firstHalf?.players[p.id];
      if(earlier?.red)p.ban=1;
      if(earlier?.injury)p.injury=1;
      if(half===2&&earlier)p.fitness=clamp(p.fitness-8,10,100);
    }
    const result=simulateMatch(copies[0],copies[1],this.rng,{minutes:45,startMinute:(half-1)*45,difficulty:this.difficulty,userTeam:this.teams[this.userSide]?.id});
    if(half===2)for(const [id,s] of Object.entries(result.players))if(s.yellow&&this.firstHalf?.players[id]?.yellow&&!s.red){s.red=1;const card=result.events.find(ev=>ev.player===id&&ev.type==='yellow');if(card)card.type='red';}
    return result;
  }
  buildCues(){return (this.half===1?this.firstHalf:this.secondHalf)?.events??[];}
  setBanner(title,subtitle='',time=2.5){this.banner={title,subtitle,time};}
  emit(type,extra={}){this.onEvent({type,...extra});}
  setSpeed(value){this.speed=[1,2,4,8].includes(value)?value:1;}
  update(dt) {
    if(this.paused||this.state==='FullTime')return;
    dt=Math.min(dt,.05)*this.speed;this.elapsed+=dt;this.stateTime+=dt;
    if(this.banner)this.banner.time=Math.max(0,this.banner.time-dt);
    for(const p of this.players){p.kick=Math.max(0,p.kick-dt*3);p.fall=Math.max(0,p.fall-dt);p.celebrate=Math.max(0,p.celebrate-dt);}
    if(this.state==='HalfTime')return;
    if(this.state==='Shootout'){this.updateShootout(dt);return;}
    if(this.state==='Action'){this.updateAction(dt);return;}
    if(this.state==='Entrance'){this.updateEntrance(dt);return;}
    if(this.state==='Kickoff') {
      this.moveAmbient(dt,true);this.ball.x=525;this.ball.y=330;this.ball.z=0;
      if(this.stateTime>2.8){this.state='InPlay';this.stateTime=0;this.passTime=0;this.emit('whistle');}
      return;
    }
    this.clock=Math.min(this.half*2700,this.clock+dt*5400/this.duration);
    const cue=this.cues[this.actionIndex];
    if(cue&&this.clock>=cue.minute*60) {this.actionIndex++;this.startAction(cue);return;}
    this.moveAmbient(dt);this.moveBall(dt);
    if(this.clock>=this.half*2700&&!cue) {
      if(this.half===1){this.state='HalfTime';this.stateTime=0;this.setBanner('DESCANSO','La pizarra también gana partidos.',99999);this.emit('halftime');}
      else this.endRegulation();
    }
  }
  updateEntrance(dt) {
    for(const p of this.players) {
      if(this.stateTime<p.index*.12)continue;
      const dir=attackDirection(p.side,this.half),x=(dir>0?p.base[0]:1-p.base[0])*PITCH.width,y=p.base[1]*PITCH.height;
      this.movePlayer(p,x,y,dt,120+p.attributes.pace*.25);
    }
    this.ball.x=PITCH.width/2;this.ball.y=PITCH.height/2;this.ball.z=0;
    if(this.stateTime>=4.2){this.state='Kickoff';this.stateTime=0;this.setBanner('SAQUE DE CENTRO','El árbitro da inicio al partido.',1.8);this.emit('whistle');}
  }
  continueSecondHalf(team=null) {
    if(this.state!=='HalfTime')return;
    if(team)this.teams[this.userSide]=clone(team);
    this.half=2;this.secondHalf=this.simulatePeriod(2);this.actionIndex=0;this.cues=this.buildCues();
    const was=new Map(this.players.map(p=>[p.id,p]));
    const removed=new Set(Object.entries(this.firstHalf.players).filter(([,s])=>s.red||s.injury).map(([id])=>id));
    const teams=this.teams.map(t=>clone(t));
    for(const t of teams)t.matchLimit=5-t.roster.filter(p=>this.firstHalf.players[p.id]?.red).length;
    for(const t of teams)for(const p of t.roster)if(removed.has(p.id))p.ban=1;
    this.players=teams.flatMap((t,i)=>createPlayers(t,i,2)).map(p=>({...p,x:was.get(p.id)?.x??525,y:was.get(p.id)?.y??330}));
    this.clock=2700;this.state='Kickoff';this.stateTime=0;this.paused=false;this.pass=null;this.setBanner('SEGUNDA PARTE','Los equipos cambian de campo.');this.emit('whistle');
  }
  setHalfTimeTeam(team) {
    if(this.state!=='HalfTime')throw new Error('Los cambios se preparan en el descanso.');
    this.teams[this.userSide]=clone(team);
  }
  moveAmbient(dt,kickoff=false) {
    const owner=this.ball.owner?this.players.find(p=>p.id===this.ball.owner):null;
    const possessionSide=owner?.side??(Math.floor(this.elapsed/15)%2);
    const surge=kickoff?0:Math.sin(this.elapsed*.14)*95;
    for(const p of this.players) {
      if(p.red)continue;
      const dir=attackDirection(p.side,this.half);let x=(dir>0?p.base[0]:1-p.base[0])*PITCH.width;
      let y=p.base[1]*PITCH.height;
      if(!kickoff&&!p.keeper){x+=dir*(possessionSide===p.side?85:-35)+surge;y+=Math.sin(this.elapsed*.34+p.index*1.8+p.side)*35;}
      if(p.keeper){x=dir>0?32:1018;y=clamp(330+(this.ball.y-330)*.35,270,390);}
      this.movePlayer(p,clamp(x,24,1026),clamp(y,35,625),dt,kickoff?80:100);
    }
  }
  movePlayer(p,x,y,dt,speed=160) {
    const dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy),step=Math.min(d,dt*(speed+p.attributes.pace*.3));
    p.vx=d>1?dx/d*step/Math.max(dt,.001):0;p.vy=d>1?dy/d*step/Math.max(dt,.001):0;
    if(d>.1){p.x+=dx/d*step;p.y+=dy/d*step;p.headingX=dx/d;p.headingY=dy/d;}
  }
  moveBall(dt) {
    this.passTime-=dt;
    if(this.pass) {
      this.pass.t+=dt/this.pass.duration;
      const t=clamp(this.pass.t,0,1),target=this.players.find(p=>p.id===this.pass.to);
      if(target) {
        const q=lerpPoint(this.pass.from,target,t);this.ball.x=q.x;this.ball.y=q.y;this.ball.z=Math.sin(t*Math.PI)*this.pass.height;this.ball.spin+=dt*15;
        if(t>=1){this.ball.owner=target.id;target.kick=.45;this.pass=null;}
      }else this.pass=null;
      return;
    }
    let owner=this.players.find(p=>p.id===this.ball.owner&&!p.red);
    if(!owner){const side=Math.floor(this.elapsed/15)%2;owner=this.players.filter(p=>p.side===side&&!p.keeper&&!p.red)[0];this.ball.owner=owner?.id;}
    if(owner) {
      this.ball.x=owner.x+owner.headingX*17;this.ball.y=owner.y+owner.headingY*10;this.ball.z=Math.abs(Math.sin(this.elapsed*10))*2;
      if(this.passTime<=0) {
        const teammates=this.players.filter(p=>p.side===owner.side&&p.id!==owner.id&&!p.red&&!p.keeper);
        const next=teammates[Math.floor(this.elapsed*7)%Math.max(1,teammates.length)];
        if(next){this.pass={from:{x:this.ball.x,y:this.ball.y},to:next.id,t:0,duration:distance(owner,next)/400+.3,height:12};owner.kick=1;this.emit('kick');}
        this.passTime=2.3+this.visualRng()*1.8;
      }
    }
  }
  startAction(event) {
    this.pass=null;this.state='Action';this.stateTime=0;
    const dir=attackDirection(event.side,this.half),goalX=dir>0?1050:0;
    const scorer=this.players.find(p=>p.id===event.player&&!p.red)??this.players.find(p=>p.side===event.side&&!p.keeper&&!p.red);
    const helpers=this.players.filter(p=>p.side===event.side&&p.id!==scorer?.id&&!p.keeper&&!p.red);
    const wing=helpers[0]??scorer,mid=helpers[1]??wing;
    const y=clamp(330+(this.visualRng()-.5)*200,245,415);
    this.activeAction={event,dir,goalX,style:Math.floor(this.visualRng()*3),scorer:scorer?.id,wing:wing?.id,mid:mid?.id,shootY:y,shotY:event.type==='goal'?285+this.visualRng()*90:event.type==='wide'?(this.visualRng()<.5?190:470):event.type==='post'?247:330+(this.visualRng()-.5)*60,marked:false,startBall:{x:this.ball.x,y:this.ball.y}};
    if(SHOTS.has(event.type))this.setBanner(event.side===this.userSide?'SE ACERCA TU EQUIPO':'PELIGRO RIVAL',`${event.minute}' · ${this.teams[event.side].name}`,1.5);
  }
  updateAction(dt) {
    const a=this.activeAction;if(!a){this.state='InPlay';return;}
    const e=a.event,t=this.stateTime,shot=SHOTS.has(e.type);
    const scorer=this.players.find(p=>p.id===a.scorer),wing=this.players.find(p=>p.id===a.wing),mid=this.players.find(p=>p.id===a.mid);
    if(!scorer){this.state='InPlay';return;}
    const ownGoal=a.goalX-a.dir*270;
    for(const p of this.players) {
      if(p.red)continue;
      let x=(attackDirection(p.side,this.half)>0?p.base[0]:1-p.base[0])*1050,y=p.base[1]*660;
      if(shot) {
        if(p.id===scorer.id){x=ownGoal+a.dir*clamp(t/3.6,0,1)*105;y=a.shootY;}
        else if(p.id===wing?.id){x=ownGoal-a.dir*110;y=190;}
        else if(p.id===mid?.id){x=ownGoal-a.dir*200;y=425;}
        else if(p.side!==e.side&&!p.keeper){x=a.goalX-a.dir*(80+p.index*33);y=225+p.index*50;}
        if(p.keeper&&p.side!==e.side){x=a.goalX-a.dir*20;y=t>3.8?lerp(330,a.shotY,clamp((t-3.8)*2.4,0,1)):clamp(330+(a.shootY-330)*.22,270,390);if(t>4.05&&t<4.8)p.fall=.22;}
      }else {x=scorer.x+(p.side===e.side?-a.dir*35:a.dir*35);y=clamp(scorer.y+(p.index-2)*43,60,600);}
      if(p.side===e.side&&p.celebrate>0){const angle=p.index/5*Math.PI*2;x=scorer.x-a.dir*28+Math.cos(angle)*34;y=scorer.y+Math.sin(angle)*26;}
      this.movePlayer(p,clamp(x,14,1036),clamp(y,30,630),dt,130);
    }
    if(shot) {
      let ballPos;
      if(t<.8)ballPos=lerpPoint(a.startBall,mid,ease(t/.8));
      else if(t<1.8)ballPos=lerpPoint(mid,wing,ease((t-.8)/1));
      else if(t<2.8)ballPos=lerpPoint(wing,scorer,ease(t-1.8));
      else if(t<3.8)ballPos={x:scorer.x+a.dir*15,y:scorer.y};
      else if(t<4.45) {
        const f=ease((t-3.8)/.65);ballPos=lerpPoint(scorer,{x:a.goalX+a.dir*(e.type==='goal'?27:0),y:a.shotY},f);const style=a.style??0;ballPos.y+=style===1?Math.sin(f*Math.PI)*a.dir*32:style===2?-Math.sin(f*Math.PI)*a.dir*23:0;this.ball.z=Math.sin(f*Math.PI)*(style===2?46:style===1?25:12);scorer.kick=1;
      } else {
        const endX=e.type==='post'?a.goalX-a.dir*(t-4.45)*180:e.type==='save'?a.goalX-a.dir*25:a.goalX+a.dir*27;
        ballPos={x:endX,y:a.shotY};this.ball.z=e.type==='goal'?Math.max(0,7-Math.abs(t-4.45)*10):0;
      }
      this.ball.x=ballPos.x;this.ball.y=ballPos.y;this.ball.spin+=dt*20;this.ball.owner=null;
      if(t>=4.45&&!a.marked) {
        a.marked=true;this.visibleShots[e.side]++;
        if(e.type==='goal') {this.score[e.side]++;this.players.filter(p=>p.side===e.side&&!p.red).forEach(p=>{p.celebrate=2.8;p.celebrationStyle=this.visualRng.int(0,2);});this.setBanner('¡GOOOOL!',`${e.minute}' · ${e.name}${e.assist?' · Pase de '+e.assist:''}`,2.8);this.emit('goal',{side:e.side});}
        else {this.setBanner(e.type==='save'?'¡PARADÓN!':e.type==='post'?'¡AL PALO!':'FUERA',`${e.minute}' · ${e.name}`,1.7);this.emit(e.type==='post'?'post':'kick');}
        this.visibleEvents.unshift(e);
      }
      if(t>(e.type==='goal'?7.2:5.8)){this.state=e.type==='goal'?'Kickoff':'InPlay';this.stateTime=0;this.passTime=1;this.ball.owner=null;this.activeAction=null;}
    }else {
      this.ball.x=scorer.x;this.ball.y=scorer.y;this.ball.z=0;
      if(t>=1.5&&!a.marked) {
        a.marked=true;
        if(e.type==='red'){scorer.red=true;this.setBanner('TARJETA ROJA',`${e.name} abandona el campo.`,2.5);}
        if(e.type==='yellow'){scorer.yellows++;this.setBanner('TARJETA AMARILLA',e.name,2);}
        if(e.type==='injury'){scorer.fall=3;this.setBanner('PROBLEMAS FÍSICOS',`${e.name} necesita atención.`,2.5);}
        if(e.type==='foul'){scorer.fall=1.1;this.setBanner('FALTA SEÑALADA',`${e.name} · el árbitro detiene el juego.`,2.2);}
        this.visibleEvents.unshift(e);this.emit('whistle');
      }
      if(t>4){this.state='InPlay';this.stateTime=0;this.activeAction=null;this.ball.owner=null;}
    }
  }
  endRegulation() {
    if(this.knockout&&this.score[0]===this.score[1]) {
      this.pens=penaltySeries(this.teams[0],this.teams[1],this.rng);this.state='Shootout';this.stateTime=0;this.penaltyIndex=0;this.penaltyVisible=[0,0];this.activeAction=null;this.setBanner('TODO SE DECIDE DESDE LOS ONCE METROS','Tanda de penaltis',3);this.emit('whistle');
    }else this.finish();
  }
  updateShootout(dt) {
    const index=Math.floor(this.stateTime/4.5),t=this.stateTime%4.5;
    if(index>=this.pens.kicks.length){this.finish();return;}
    const k=this.pens.kicks[index],dir=k.side===0?1:-1,goalX=dir>0?1050:0;
    const shooter=this.players.find(p=>p.side===k.side&&!p.keeper&&!p.red),keeper=this.players.find(p=>p.side!==k.side&&p.keeper);
    if(shooter){this.movePlayer(shooter,goalX-dir*120,330,dt,400);shooter.kick=t>1.7&&t<2.2?1:0;}
    if(keeper)this.movePlayer(keeper,goalX-dir*15,330+(t>1.8?k.direction*55:0),dt,350);
    this.ball.x=lerp(goalX-dir*110,goalX+(k.goal?dir*24:-dir*20),clamp((t-1.8)/.5,0,1));this.ball.y=lerp(330,330+k.direction*60,clamp((t-1.8)/.5,0,1));this.ball.z=0;
    if(index===this.penaltyIndex&&t>=2.3){this.penaltyIndex++;if(k.goal)this.penaltyVisible[k.side]++;this.setBanner(k.goal?'PENALTI CONVERTIDO':'¡NO ENTRA!',`${this.teams[k.side].short} · ${this.penaltyVisible.join(' – ')}`,1.8);this.emit(k.goal?'goal':'whistle');}
  }
  finish() {
    this.state='FullTime';this.clock=5400;this.stateTime=0;
    const result=this.result();this.setBanner('FINAL DEL PARTIDO',this.score.join(' – '),99999);this.emit('whistle');
    if(!this.finishedEmitted){this.finishedEmitted=true;this.onEnd(result);}
  }
  result() {
    const periods=[this.firstHalf,this.secondHalf].filter(Boolean),players={};
    for(const period of periods)for(const [id,s] of Object.entries(period.players)) {
      const old=players[id]??{minutes:0,goals:0,assists:0,shots:0,saves:0,yellow:0,red:0,rating:0,periods:0};
      for(const key of ['minutes','goals','assists','shots','saves','yellow','red'])old[key]+=s[key]??0;
      old.rating+=s.rating;old.periods++;old.injury=Math.max(old.injury??0,s.injury??0);players[id]=old;
    }
    for(const s of Object.values(players)){s.rating=clamp(s.rating/s.periods,3,10);delete s.periods;}
    const score=periods.reduce((s,p)=>[s[0]+p.score[0],s[1]+p.score[1]],[0,0]);
    const pens=this.pens?.score??null;const winner=score[0]===score[1]?(pens?(pens[0]>pens[1]?this.teams[0].id:this.teams[1].id):null):(score[0]>score[1]?this.teams[0].id:this.teams[1].id);
    const shots=periods.reduce((s,p)=>[s[0]+p.stats.shots[0],s[1]+p.stats.shots[1]],[0,0]);
    const possession=Math.round(periods.reduce((s,p)=>s+p.stats.possession[0],0)/periods.length);
    return {fixtureId:this.fixtureId,score,pens,winner,players,events:periods.flatMap(p=>p.events).sort((a,b)=>a.minute-b.minute),stats:{shots,possession:[possession,100-possession]},source:'animated'};
  }
  serialize() {const snapshot={rngState:this.rng.state(),visualRngState:this.visualRng.state(),version:1};for(const key of SNAPSHOT_KEYS)snapshot[key]=clone(this[key]);return snapshot;}
}
const SNAPSHOT_KEYS=['fixtureId','teams','userSide','knockout','difficulty','duration','clock','half','elapsed','state','stateTime','score','visibleShots','visibleEvents','ball','players','activeAction','actionIndex','passTime','pass','banner','pens','penaltyIndex','penaltyVisible','firstHalf','secondHalf','substitutions','subbedOut','speed'];
export function matchSeed(world,fixtureId){return parseInt(hash(`${world.seed}-${world.season}-${fixtureId}-${world.eventIndex}`),16);}

