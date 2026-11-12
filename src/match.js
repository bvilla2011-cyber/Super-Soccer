import { clone, random, hash, lerp, clamp, distance } from './utils.js';
import { simulateMatch, penaltySeries } from './simulation.js';
import { createPlayers, createBall, attackDirection } from './entities.js';
import { upgradeTeamRoster } from './data.js';
import { PITCH } from './physics.js';

const SHOTS=new Set(['goal','save','wide','post']);
const lerpPoint=(a,b,t)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)});
const ease=t=>t*t*(3-2*t);
export const STATE_LABELS={Kickoff:'Salida desde el túnel',InPlay:'En juego',Action:'Jugada destacada',HalfTime:'Descanso',FullTime:'Final del partido',Shootout:'Tanda de penaltis',Exit:'Vuelta al vestuario'};

// The director translates a statistical result into a compact animated broadcast.
export class MatchSimulation {
  constructor({home,away,fixtureId,userSide=0,knockout=false,difficulty='club',duration=180,seed=42,snapshot=null,onEvent=()=>{},onEnd=()=>{}}) {
    this.teams=[clone(home),clone(away)];this.fixtureId=fixtureId;this.userSide=userSide;this.knockout=knockout;this.difficulty=difficulty;this.duration=duration;
    this.onEvent=onEvent;this.onEnd=onEnd;this.finishedEmitted=false;this.paused=false;this.speed=1;
    this.rng=random(seed);this.visualRng=random(seed^0x58a74c);this.clock=0;this.half=1;this.elapsed=0;this.state='Kickoff';this.stateTime=0;this.ceremony='entrance';this.ceremonyTime=0;this.score=[0,0];this.visibleShots=[0,0];this.visibleEvents=[];this.ball=createBall();this.players=this.teams.flatMap((t,i)=>createPlayers(t,i));this.players.forEach(p=>{p.x=525+(p.side===0?-48:48)+(p.index%3)*7;p.y=685+Math.floor(p.index/3)*7;});this.activeAction=null;this.actionIndex=0;this.passTime=0;this.pass=null;this.banner={title:'SALTAN AL CÉSPED',subtitle:`${home.name} · ${away.name}`,time:5};this.pens=null;this.penaltyIndex=0;this.penaltyVisible=[0,0];this.firstHalf=null;this.secondHalf=null;this.substitutions=[0,0];this.subbedOut=[];
    if(snapshot) {
      for(const key of SNAPSHOT_KEYS)if(snapshot[key]!==undefined)this[key]=clone(snapshot[key]);
      this.teams=this.teams.map(team=>{
        upgradeTeamRoster(team);
        if(Number.isFinite(team.matchLimit))team.matchLimit=Math.max(1,11-team.roster.filter(p=>this.firstHalf?.players?.[p.id]?.red).length);
        return team;
      });
      if(this.players.length<22) {
        const previous=new Map(this.players.map(p=>[p.id,p]));
        this.players=this.teams.flatMap((team,side)=>createPlayers(team,side,this.half)).map(player=>{
          const old=previous.get(player.id);return old?{...player,...old,base:[...player.base],index:player.index,keeper:player.keeper}:player;
        });
      }
      this.rng=random(snapshot.rngState);this.visualRng=random(snapshot.visualRngState??42);this.paused=true;
    } else this.firstHalf=this.simulatePeriod(1);
    this.cues=this.buildCues();
  }
  simulatePeriod(half) {
    const copies=this.teams.map(t=>clone(t));
    if(half===2)for(const t of copies)t.matchLimit=11-t.roster.filter(p=>this.firstHalf?.players[p.id]?.red).length;
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
  buildCues(){
    let featuredShots=0;const events=(this.half===1?this.firstHalf:this.secondHalf)?.events??[];
    return events.filter(ev=>{
      if(ev.type==='goal'||['yellow','red','injury'].includes(ev.type))return true;
      if(ev.type==='foul')return ev.minute%4===0;
      if(SHOTS.has(ev.type)){featuredShots++;return ev.type==='post'||ev.type==='save'&&featuredShots%3===1||ev.type==='wide'&&featuredShots%4===1;}
      return false;
    });
  }
  setBanner(title,subtitle='',time=2.5){this.banner={title,subtitle,time};}
  emit(type,extra={}){this.onEvent({type,...extra});}
  setSpeed(value){this.speed=[1,2,4,8].includes(value)?value:1;}
  update(dt) {
    if(this.paused||this.state==='FullTime')return;
    dt=Math.min(dt,.05)*this.speed;this.elapsed+=dt;this.stateTime+=dt;
    if(this.banner)this.banner.time=Math.max(0,this.banner.time-dt);
    for(const p of this.players){p.kick=Math.max(0,p.kick-dt*3);p.fall=Math.max(0,p.fall-dt);p.celebrate=Math.max(0,p.celebrate-dt);}
    if(this.state==='HalfTime')return;
    if(this.state==='Exit'){this.updateExit(dt);return;}
    if(this.state==='Shootout'){this.updateShootout(dt);return;}
    if(this.state==='Action'){this.updateAction(dt);return;}
    if(this.state==='Kickoff') {
      if(this.ceremony==='entrance') {
        this.ceremonyTime+=dt;
        for(const p of this.players){const start={x:525+(p.side===0?-48:48)+(p.index%3)*7,y:685+Math.floor(p.index/3)*7},dir=attackDirection(p.side,1),target={x:(dir>0?p.base[0]:1-p.base[0])*PITCH.width,y:p.base[1]*PITCH.height};const stagger=(p.index%11)*.08,progress=clamp((this.ceremonyTime-stagger)/3.6,0,1),q=lerpPoint(start,target,ease(progress));this.movePlayer(p,q.x,q.y,dt,245);}
        if(this.ceremonyTime>5.2){this.ceremony=null;this.stateTime=0;this.setBanner('TODO LISTO','¡Comienza el partido!',1.8);}
        return;
      }
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
  continueSecondHalf(team=null) {
    if(this.state!=='HalfTime')return;
    if(team)this.teams[this.userSide]=clone(team);
    this.half=2;this.secondHalf=this.simulatePeriod(2);this.actionIndex=0;this.cues=this.buildCues();
    const was=new Map(this.players.map(p=>[p.id,p]));
    const removed=new Set(Object.entries(this.firstHalf.players).filter(([,s])=>s.red||s.injury).map(([id])=>id));
    const teams=this.teams.map(t=>clone(t));
    for(const t of teams)t.matchLimit=11-t.roster.filter(p=>this.firstHalf.players[p.id]?.red).length;
    for(const t of teams)for(const p of t.roster)if(removed.has(p.id))p.ban=1;
    this.players=teams.flatMap((t,i)=>createPlayers(t,i,2)).map(p=>({...p,x:was.get(p.id)?.x??525,y:was.get(p.id)?.y??330}));
    this.clock=2700;this.state='Kickoff';this.stateTime=0;this.paused=false;this.pass=null;this.setBanner('SEGUNDA PARTE','Los equipos cambian de campo.');
  }
  setHalfTimeTeam(team) {
    if(this.state!=='HalfTime')throw new Error('Los cambios se preparan en el descanso.');
    this.teams[this.userSide]=clone(team);
  }
  moveAmbient(dt,kickoff=false) {
    const owner=this.ball.owner?this.players.find(p=>p.id===this.ball.owner):null;
    const possessionSide=owner?.side??this.ball.lastSide??0;
    const progress=owner?clamp((owner.x-525)*attackDirection(owner.side,this.half)/430,-.65,.85):0;
    const pressers=kickoff?[]:this.players.filter(p=>p.side!==possessionSide&&!p.keeper&&!p.red).sort((a,b)=>distance(a,this.ball)-distance(b,this.ball)).slice(0,2);
    for(const p of this.players) {
      if(p.red)continue;
      const dir=attackDirection(p.side,this.half);let x=(dir>0?p.base[0]:1-p.base[0])*PITCH.width;
      let y=p.base[1]*PITCH.height;
      if(!kickoff&&!p.keeper){
        const inPossession=possessionSide===p.side,pressing=pressers.indexOf(p),lane=(p.index%3-1)*76;
        if(inPossession){
          const push=p.position==='DEL'?140:p.position==='MED'?92:42;
          x+=dir*(push+progress*(p.position==='DEL'?42:25));
          y=lerp(y,this.ball.y+lane,p.position==='DEL'?.43:.22);
          if(owner?.id===p.id){x+=dir*(p.position==='DEL'?60:p.position==='MED'?37:18);y=lerp(y,this.ball.y, .35);}
          else if(p.position==='DEL')x+=dir*(52+Math.sin(this.elapsed*.7+p.index)*24);
        }else{
          // A compact but staggered block: midfielders screen passing lanes while the back line tracks the ball.
          const blockX=this.ball.x-dir*(p.position==='DEF'?116:p.position==='MED'?245:390);
          x=lerp(x,blockX,p.position==='DEF'?.3:p.position==='MED'?.24:.12);
          y=lerp(y,this.ball.y+lane*.55,p.position==='DEF'?.34:.28);
          if(pressing>=0){const blend=pressing===0?.52:.32;x=lerp(x,this.ball.x-dir*23,blend);y=lerp(y,this.ball.y+(pressing?32:-25),blend);}
        }
        y+=Math.sin(this.elapsed*.28+p.index*1.8+p.side)*15;
      }
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
        if(t>=1){this.ball.owner=target.id;this.ball.lastSide=target.side;target.kick=.45;this.pass=null;}
      }else this.pass=null;
      return;
    }
    let owner=this.players.find(p=>p.id===this.ball.owner&&!p.red);
    if(!owner){owner=this.players.filter(p=>!p.keeper&&!p.red).sort((a,b)=>distance(a,this.ball)-distance(b,this.ball))[0];this.ball.owner=owner?.id;this.ball.lastSide=owner?.side??this.ball.lastSide;}
    if(owner) {
      this.ball.x=owner.x+owner.headingX*17;this.ball.y=owner.y+owner.headingY*10;this.ball.z=Math.abs(Math.sin(this.elapsed*10))*2;
      if(this.passTime<=0) {
        const teammates=this.players.filter(p=>p.side===owner.side&&p.id!==owner.id&&!p.red&&!p.keeper);
        const opponents=this.players.filter(p=>p.side!==owner.side&&!p.red).sort((a,b)=>distance(a,owner)-distance(b,owner));
        const pressure=opponents[0]?distance(opponents[0],owner):999;
        const forward=teammates.filter(p=>(p.x-owner.x)*owner.headingX>18);
        const options=(forward.length?forward:teammates).map(p=>({p,score:p.attributes.pass*.35+p.attributes.control*.18+(p.x-owner.x)*owner.headingX*.055-Math.abs(p.y-owner.y)*.12-Math.max(0,155-distance(p,owner))*.34+(p.position==='DEL'&&p.x*owner.headingX>700?18:0)})).sort((a,b)=>b.score-a.score);
        const next=options.length?options[Math.floor(this.visualRng()*Math.min(3,options.length))].p:null;
        const shouldPass=pressure<155?this.visualRng()<.9:this.visualRng()<.56;
        if(next&&shouldPass){const cross=Math.abs(next.y-owner.y)>105,loft=cross||next.position==='DEL'&&this.visualRng()<.24;this.pass={from:{x:this.ball.x,y:this.ball.y},to:next.id,t:0,duration:distance(owner,next)/470+.22,height:loft?38:7};owner.kick=1;this.emit('pass',{from:owner.id,to:next.id});this.passTime=3.8+this.visualRng()*2.4;}
        else {this.passTime=.65+this.visualRng()*.8;const steal=opponents[0]?clamp(.045+(opponents[0].attributes.defense-owner.attributes.control)/340,.015,.14):0;if(pressure<55&&this.visualRng()<steal&&opponents[0]){this.ball.owner=opponents[0].id;this.ball.lastSide=opponents[0].side;this.passTime=1.1;}}
      }
    }
  }
  startAction(event) {
    this.pass=null;this.state='Action';this.stateTime=0;
    const dir=attackDirection(event.side,this.half),goalX=dir>0?1050:0;
    const scorer=this.players.find(p=>p.id===event.player&&!p.red)??this.players.find(p=>p.side===event.side&&!p.keeper&&!p.red);
    const helpers=this.players.filter(p=>p.side===event.side&&p.id!==scorer?.id&&!p.keeper&&!p.red);
    const wing=helpers.filter(p=>p.position==='DEL').sort((a,b)=>Math.abs(b.y-330)-Math.abs(a.y-330))[0]??helpers[0]??scorer;
    const mid=helpers.filter(p=>p.position==='MED').sort((a,b)=>distance(a,this.ball)-distance(b,this.ball))[0]??helpers[0]??wing;
    const y=clamp(330+(this.visualRng()-.5)*200,245,415),finish=event.finish??['power','curled','volley'][Math.floor(this.visualRng()*3)];
    const longShot=finish==='longshot',shotY=event.type==='goal'&&['header','bicycle','chip'].includes(finish)?clamp(y+(finish==='header'?-35:finish==='bicycle'?26:-60),220,450):event.type==='goal'?285+this.visualRng()*90:event.type==='wide'?(this.visualRng()<.5?190:470):event.type==='post'?247:330+(this.visualRng()-.5)*60;
    this.activeAction={event,dir,goalX,finish,style:Math.floor(this.visualRng()*3),scorer:scorer?.id,wing:wing?.id,mid:mid?.id,shootY:y,shotY,lineStart:goalX-dir*(longShot?470:270),marked:false,startBall:{x:this.ball.x,y:this.ball.y}};
    if(SHOTS.has(event.type)){this.setBanner(event.side===this.userSide?'SE ACERCA TU EQUIPO':'PELIGRO RIVAL',`${event.minute}' · ${this.teams[event.side].name}`,1.5);this.emit('shot',{finish});}
    if(event.type==='foul')this.setBanner('FALTA',`${event.minute}' · ${event.name}`,1.5);
  }
  updateAction(dt) {
    const a=this.activeAction;if(!a){this.state='InPlay';return;}
    const e=a.event,t=this.stateTime,shot=SHOTS.has(e.type);
    const scorer=this.players.find(p=>p.id===a.scorer),wing=this.players.find(p=>p.id===a.wing),mid=this.players.find(p=>p.id===a.mid);
    if(!scorer){this.state='InPlay';return;}
    const ownGoal=a.lineStart??a.goalX-a.dir*270;
    for(const p of this.players) {
      if(p.red)continue;
      let x=(attackDirection(p.side,this.half)>0?p.base[0]:1-p.base[0])*1050,y=p.base[1]*660;
      if(shot) {
        if(p.id===scorer.id){const run=a.finish==='longshot'?65:105;x=ownGoal+a.dir*clamp(t/3.6,0,1)*run;y=a.shootY;p.actionPose=t>3.1&&t<4.55&&['bicycle','header','volley'].includes(a.finish)?a.finish:null;}
        else if(p.id===wing?.id){x=ownGoal-a.dir*110;y=190;}
        else if(p.id===mid?.id){x=ownGoal-a.dir*200;y=425;}
        else if(p.side!==e.side&&!p.keeper){const retreat=p.position==='DEF'?125:p.position==='MED'?260:410;const lane=(p.index%4-1.5)*46;x=a.goalX-a.dir*(retreat+(p.index%3)*26);y=lerp(p.base[1]*660,a.shootY,.52)+lane;}
        if(p.keeper&&p.side!==e.side){x=a.goalX-a.dir*20;y=t>3.8?lerp(330,a.shotY,clamp((t-3.8)*2.4,0,1)):clamp(330+(a.shootY-330)*.22,270,390);if(t>4.05&&t<4.8)p.fall=.22;}
      }else {x=scorer.x+(p.side===e.side?-a.dir*35:a.dir*35);y=clamp(scorer.y+(p.index-2)*43,60,600);}
      if(p.celebrate>0){x+=Math.cos(p.index)*30;y+=Math.sin(p.index)*30;}
      this.movePlayer(p,clamp(x,14,1036),clamp(y,30,630),dt,130);
    }
    if(shot) {
      let ballPos;
      if(a.finish==='longshot'&&t<3.5)ballPos=lerpPoint(a.startBall,scorer,ease(t/3.5));
      else if(t<.8)ballPos=lerpPoint(a.startBall,mid,ease(t/.8));
      else if(t<1.8)ballPos=lerpPoint(mid,wing,ease((t-.8)/1));
      else if(t<2.8)ballPos=lerpPoint(wing,scorer,ease(t-1.8));
      else if(t<3.8)ballPos={x:scorer.x+a.dir*15,y:scorer.y};
      else if(t<4.45) {
        const f=ease((t-3.8)/.65);ballPos=lerpPoint(scorer,{x:a.goalX+a.dir*(e.type==='goal'?27:0),y:a.shotY},f);const style=a.style??0,finish=a.finish;
        ballPos.y+=finish==='curled'?Math.sin(f*Math.PI)*a.dir*45:style===1?Math.sin(f*Math.PI)*a.dir*32:style===2?-Math.sin(f*Math.PI)*a.dir*23:0;
        this.ball.z=Math.sin(f*Math.PI)*(finish==='chip'?78:finish==='bicycle'?42:finish==='header'?28:finish==='volley'?33:style===2?46:style===1?25:12);scorer.kick=1;
      } else {
        const endX=e.type==='post'?a.goalX-a.dir*(t-4.45)*180:e.type==='save'?a.goalX-a.dir*25:a.goalX+a.dir*27;
        ballPos={x:endX,y:a.shotY};this.ball.z=e.type==='goal'?Math.max(0,7-Math.abs(t-4.45)*10):0;
      }
      this.ball.x=ballPos.x;this.ball.y=ballPos.y;this.ball.spin+=dt*20;this.ball.owner=null;
      if(t>=4.45&&!a.marked) {
        a.marked=true;this.visibleShots[e.side]++;
        if(e.type==='goal') {this.score[e.side]++;this.players.filter(p=>p.side===e.side&&!p.red).forEach(p=>p.celebrate=2.5);this.setBanner('¡GOOOOL!',`${e.minute}' · ${e.finishLabel??'Gran definición'} · ${e.name}${e.assist?' · Pase de '+e.assist:''}`,2.8);this.emit('goal',{side:e.side,finish:e.finish});}
        else {this.setBanner(e.type==='save'?'¡PARADÓN!':e.type==='post'?'¡AL PALO!':'FUERA',`${e.minute}' · ${e.name}`,1.7);if(e.type==='post')this.emit('post');else if(e.type==='save')this.emit('save');}
        this.visibleEvents.unshift(e);
      }
      if(t>(e.type==='goal'?7.2:5.8)){for(const p of this.players)p.actionPose=null;this.state=e.type==='goal'?'Kickoff':'InPlay';this.stateTime=0;this.passTime=1;this.ball.owner=null;this.activeAction=null;}
    }else {
      this.ball.x=scorer.x;this.ball.y=scorer.y;this.ball.z=0;
      if(t>=1.5&&!a.marked) {
        a.marked=true;
        if(e.type==='foul'){scorer.fall=e.severity==='heavy'?.85:.35;this.setBanner('FALTA',`${e.name} recibe la entrada.`,1.7);}
        if(e.type==='red'){scorer.red=true;this.setBanner('TARJETA ROJA',`${e.name} abandona el campo.`,2.5);}
        if(e.type==='yellow'){scorer.yellows++;this.setBanner('TARJETA AMARILLA',e.name,2);}
        if(e.type==='injury'){scorer.fall=3;this.setBanner('PROBLEMAS FÍSICOS',`${e.name} necesita atención.`,2.5);}
        this.visibleEvents.unshift(e);this.emit('whistle');
      }
      if(t>(e.type==='foul'?2:4)){this.state='InPlay';this.stateTime=0;this.activeAction=null;this.ball.owner=null;this.ball.lastSide=1-e.side;}
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
    if(this.state==='Exit'||this.state==='FullTime')return;
    this.state='Exit';this.ceremony='exit';this.ceremonyTime=0;this.clock=5400;this.stateTime=0;this.setBanner('FINAL DEL PARTIDO',this.score.join(' – '),4);this.emit('whistle');
  }
  updateExit(dt) {
    this.ceremonyTime+=dt;
    for(const p of this.players){const target={x:525+(p.side===0?-48:48)+(p.index%3)*7,y:690+Math.floor(p.index/3)*8};this.movePlayer(p,target.x,target.y,dt,250);}
    if(this.ceremonyTime>=4.8){this.ceremony=null;this.state='FullTime';if(!this.finishedEmitted){this.finishedEmitted=true;this.onEnd(this.result());}}
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
const SNAPSHOT_KEYS=['fixtureId','teams','userSide','knockout','difficulty','duration','clock','half','elapsed','state','stateTime','ceremony','ceremonyTime','score','visibleShots','visibleEvents','ball','players','activeAction','actionIndex','passTime','pass','banner','pens','penaltyIndex','penaltyVisible','firstHalf','secondHalf','substitutions','subbedOut','speed'];
export function matchSeed(world,fixtureId){return parseInt(hash(`${world.seed}-${world.season}-${fixtureId}-${world.eventIndex}`),16);}
