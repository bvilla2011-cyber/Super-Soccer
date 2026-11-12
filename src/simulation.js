import { activePlayers, overall, FORMATIONS, DIFFICULTIES, TITLE_POINTS_PER_GAME } from './data.js';
import { clamp, poisson, weighted } from './utils.js';

export function strength(team) {
  const ps=activePlayers(team);
  const avg=key=>ps.length?ps.reduce((s,p)=>s+p.attributes[key]*(.68+.32*p.fitness/100)*(.94+.06*p.morale/100),0)/ps.length:25;
  const shape=FORMATIONS[team.formation]??FORMATIONS['4-4-2'];
  const tactic=team.tactic==='attacking'?5:team.tactic==='defensive'?-4:0;
  return {attack:avg('shot')*.48+avg('control')*.26+avg('pace')*.26+shape.attack+tactic,
    defense:avg('defense')*.5+avg('keeping')*.28+avg('stamina')*.22+shape.defense-tactic*.55,
    pass:avg('pass'),fitness:ps.length?ps.reduce((s,p)=>s+p.fitness,0)/ps.length:0};
}
export const GOAL_FINISHES=[
  {id:'power',label:'Disparo potente',weight:19},
  {id:'curled',label:'Disparo colocado',weight:17},
  {id:'longshot',label:'Gol desde fuera del área',weight:14},
  {id:'header',label:'Remate de cabeza',weight:13},
  {id:'volley',label:'Volea',weight:11},
  {id:'chip',label:'Vaselina',weight:9},
  {id:'tap-in',label:'Empuja a puerta vacía',weight:9},
  {id:'bicycle',label:'Gol de chilena',weight:4},
  {id:'nutmeg',label:'Regate y definición',weight:4}
];
export function penaltySeries(home,away,rng) {
  let score=[0,0],taken=[0,0];const kicks=[];
  const chance=team=>clamp(.68+(strength(team).attack-60)/230,.5,.9);
  for(let i=0;i<40;i++) {
    const side=i%2; taken[side]++;const goal=rng()<chance(side?away:home);if(goal)score[side]++;
    kicks.push({side,goal,direction:rng.int(-1,1)});
    if(taken[0]<=5&&taken[1]<=5) {
      if(score[0]>score[1]+5-taken[1]||score[1]>score[0]+5-taken[0]) break;
    }
    if(taken[0]===taken[1]&&taken[0]>=5&&score[0]!==score[1]) break;
  }
  if(score[0]===score[1]) {kicks.push({side:0,goal:true,direction:0},{side:1,goal:false,direction:1});score[0]++;}
  return {score,kicks};
}
export const resolvePenalties=(home,away,rng)=>penaltySeries(home,away,rng).score;
export function simulateMatch(home,away,rng,{knockout=false,difficulty='club',userTeam=null,minutes=90,startMinute=0}={}) {
  const powers=[strength(home),strength(away)];
  const bonus=DIFFICULTIES[difficulty]?.bonus??0;
  const leagueTarget=TITLE_POINTS_PER_GAME[home.country]??2.35,leagueScale=clamp(leagueTarget/2.35,.94,1.1);
  const expected=powers.map((p,i)=>clamp(1.18+(p.attack-powers[1-i].defense)*leagueScale/22+(i===0?.2:0)+((i===0?home:away).id===userTeam?bonus/28:0),.12,4.1));
  const score=expected.map(e=>poisson(e*minutes/90,rng)); const players={},events=[];
  const shots=score.map((g,i)=>g+Math.max(1,Math.round((rng.int(2,6)+Math.floor(expected[i]*1.1))*minutes/90)));
  const possession=clamp(Math.round(50+(powers[0].pass-powers[1].pass)*.5+rng.int(-7,7)),25,75);
  [home,away].forEach((team,side)=>{
    const active=activePlayers(team);
    for(const p of active) players[p.id]={minutes,goals:0,assists:0,shots:0,saves:p.position==='POR'?Math.max(0,shots[1-side]-score[1-side]-rng.int(0,2)):0,yellow:rng()<.09*minutes/90?1:0,red:rng()<.012*minutes/90?1:0,rating:0};
    for(let i=0;i<score[side];i++) {
      if(!active.length) break;
      const scorer=weighted(active,p=>p.position==='POR'?.01:p.attributes.shot*(p.position==='DEL'?2.2:1),rng);
      const helpers=active.filter(p=>p!==scorer&&p.position!=='POR');
      const assist=helpers.length&&rng()<.76?weighted(helpers,p=>p.attributes.pass,rng):null;
      players[scorer.id].goals++;players[scorer.id].shots++;
      if(assist) players[assist.id].assists++;
      const finish=weighted(GOAL_FINISHES,move=>move.weight,rng);
      events.push({minute:startMinute+rng.int(1,minutes),type:'goal',side,player:scorer.id,name:scorer.name,assist:assist?.name??null,finish:finish.id,finishLabel:finish.label});
    }
    for(const p of active) {
      const s=players[p.id];
      s.rating=clamp(6.2+s.goals*.9+s.assists*.6+s.saves*.1+(score[side]>score[1-side]?.6:-.2)-s.yellow*.25-s.red*1.4+rng()*.8,3,10);
      if(s.yellow) events.push({minute:startMinute+rng.int(5,minutes),type:'yellow',side,player:p.id,name:p.name});
      if(s.red) events.push({minute:startMinute+rng.int(8,minutes),type:'red',side,player:p.id,name:p.name});
      if(rng()<.018*minutes/90) {s.injury=rng.int(1,4);events.push({minute:startMinute+rng.int(10,minutes),type:'injury',side,player:p.id,name:p.name});}
    }
    for(let i=score[side];i<shots[side];i++) {
      const shooter=weighted(active,p=>p.position==='POR'?.01:p.attributes.shot,rng);if(!shooter)continue;
      players[shooter.id].shots++;
      events.push({minute:startMinute+rng.int(1,minutes),type:rng.pick(['save','save','wide','post']),side,player:shooter.id,name:shooter.name});
    }
  });
  // A small number of set-piece incidents enrich the broadcast without turning every attack into a foul cutscene.
  const fieldPlayers=[home,away].map(activePlayers).map(team=>team.filter(p=>p.position!=='POR'));
  const foulCount=rng.int(3,7);
  for(let i=0;i<foulCount;i++) {
    const side=rng.int(0,1),victim=weighted(fieldPlayers[side],p=>p.position==='DEL'?1.15:1,rng);
    if(victim)events.push({minute:startMinute+rng.int(4,minutes),type:'foul',side,player:victim.id,name:victim.name,severity:rng()<.14?'heavy':'normal'});
  }
  for(const ev of events)if(ev.type==='red'||ev.type==='injury'){
    const last=Math.max(startMinute,...events.filter(x=>x.player===ev.player&&['goal','save','wide','post'].includes(x.type)).map(x=>x.minute));
    ev.minute=Math.max(ev.minute,last);
  }
  const pens=knockout&&score[0]===score[1]?resolvePenalties(home,away,rng):null;
  const winner=score[0]>score[1]?home.id:score[1]>score[0]?away.id:pens?(pens[0]>pens[1]?home.id:away.id):null;
  return {score,pens,winner,players,events:events.sort((a,b)=>a.minute-b.minute||Number(['red','injury'].includes(a.type))-Number(['red','injury'].includes(b.type))),stats:{shots,possession:[possession,100-possession]},source:'simulation'};
}
export function scorerTable(world,competitionId=null) {
  const rows=new Map();
  for(const f of world.fixtures) {
    if(!f.score||(competitionId&&f.competition!==competitionId)) continue;
    for(const [id,s] of Object.entries(f.players??{})) {
      const row=rows.get(id)??{id,goals:0,assists:0,matches:0,rating:0};
      row.goals+=s.goals??0;row.assists+=s.assists??0;row.matches++;row.rating+=s.rating??6.5;rows.set(id,row);
    }
  }
  return [...rows.values()].sort((a,b)=>b.goals-a.goals||b.assists-a.assists||b.rating/b.matches-a.rating/a.matches);
}
