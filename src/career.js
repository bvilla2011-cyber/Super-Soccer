import { COUNTRIES, ECONOMY_VERSION, createTeams, teamById, countryById, teamRating, overall, makePlayer, playerValue, initialTransferBudget, wage, emptyStats, activePlayers } from './data.js';
import { random, shuffle, clamp, clone } from './utils.js';
import { roundRobin, standings, knockoutPairs, knockoutLabel } from './competitions.js';
import { simulateMatch, scorerTable } from './simulation.js';

export const SAVE_VERSION=1;
function withRandom(world,fn) { const rng=random(world.rngState);const value=fn(rng);world.rngState=rng.state();return value; }
export function news(world,title,body='',type='club') {
  world.news.unshift({id:`n-${world.season}-${world.eventIndex}-${world.news.length}-${world.rngState}`,title,body,type,season:world.season,event:world.eventIndex});
  world.news=world.news.slice(0,60);
}
export function createCareer({teamId='es-2',manager='Míster',difficulty='club',seed=Date.now(),mode='career'}={}) {
  const created=createTeams(seed);
  if(!created.teams.some(t=>t.id===teamId)) throw new Error('Club desconocido.');
  const world={version:SAVE_VERSION,economyVersion:ECONOMY_VERSION,seed:seed>>>0,rngState:created.rngState,season:2026,userTeam:teamId,manager:String(manager).slice(0,32)||'Míster',difficulty,mode,teams:created.teams,freeAgents:[],fixtures:[],competitions:[],events:[],eventIndex:0,day:0,weekDay:0,offers:[],seasonComplete:false,news:[],history:[],finance:[],transferLog:[],trophies:[],reputation:20,managerStats:{matches:0,wins:0,draws:0,losses:0,goals:0,against:0,simulated:0,played:0},trainingFocus:'balanced',created:Date.now(),updated:Date.now(),achievements:[],nextPlayerId:1};
  withRandom(world,rng=>{for(let i=0;i<30;i++)world.freeAgents.push(makePlayer(rng,`free-${world.nextPlayerId++}`,rng.int(58,82),rng.pick(['POR','DEF','MED','DEL'])));});
  setupSeason(world);
  news(world,`Empieza tu historia en ${teamById(world,teamId).name}`,`La directiva confía en ${world.manager}. Prepara el cinco titular, planifica los fichajes y dirige al equipo desde el banquillo.`);
  return world;
}
export function rebaseCareerEconomy(world) {
  if(!world||(world.economyVersion??0)>=ECONOMY_VERSION)return false;
  for(const team of world.teams??[]) {
    const rating=Math.max(50,teamRating(team));
    const legacyBudget=Math.max(100_000,(rating-50)**3*3_500);
    if(Number.isFinite(team.budget))team.budget=Math.round(team.budget*initialTransferBudget(team)/legacyBudget/10_000)*10_000;
  }
  world.economyVersion=ECONOMY_VERSION;
  return true;
}

function fixture(world,comp,event,round,home,away,stage='league',group=null) {
  const id=`${world.season}-${comp.id}-${stage}-${round}-${home}-${away??'bye'}`;
  const f={id,competition:comp.id,eventId:event.id,round,home,away,stage,group,score:away?null:[0,0],winner:away?null:home,pens:null,bye:!away};
  world.fixtures.push(f);return f;
}

export function setupSeason(world) {
  world.fixtures=[];world.events=[];world.competitions=[];world.eventIndex=0;world.seasonComplete=false;
  if(world.mode!=='career') { setupPractice(world);return; }
  const superEvent={id:'super',kind:'super',label:'Supercopas · Apertura',round:0};world.events.push(superEvent);
  for(const c of COUNTRIES) {
    for(const div of [1,2,3]) {
      const ids=world.teams.filter(t=>t.country===c.id&&t.division===div).map(t=>t.id);
      if(ids.length<2)continue;
      const comp={id:`${c.id}-${div}`,name:div===1?c.league:div===2?c.second:`${c.second} · Tercera`,kind:'league',country:c.id,division:div,teamIds:ids};world.competitions.push(comp);
      roundRobin(ids).forEach((games,r)=>games.forEach(([a,b])=>fixture(world,comp,{id:`league-${r}`},r,a,b)));
    }
    const cup={id:`${c.id}-cup`,name:c.cup,kind:'cup',country:c.id,teamIds:world.teams.filter(t=>t.country===c.id&&t.division<=2).map(t=>t.id),rounds:5,prepared:[]};world.competitions.push(cup);
    const history=world.history.at(-1); const ranking=history?.tables?.[`${c.id}-1`]?.map(r=>r.id)??world.teams.filter(t=>t.country===c.id&&t.division===1).sort((a,b)=>teamRating(b)-teamRating(a)).map(t=>t.id);
    const formerCup=history?.winners?.[`${c.id}-cup`];
    const opponent=formerCup&&formerCup!==ranking[0]?formerCup:ranking[1];
    const superCup={id:`${c.id}-super`,name:`Supercopa · ${c.name}`,kind:'super',country:c.id,teamIds:[ranking[0],opponent],rounds:1,prepared:[0]};world.competitions.push(superCup);
    fixture(world,superCup,superEvent,0,ranking[0],opponent,'knockout');
  }
  withRandom(world,rng=>{
    const previous=world.history.at(-1);const taken=new Set();
    for(const [id,name,count,perCountry] of [['euro-crown','Copa de las Estrellas',32,4],['euro-union','Copa Unión Europea',32,4],['euro-horizon','Copa Horizonte',16,2]]) {
      const qualified=[];
      for(const c of COUNTRIES) {
        const sorted=(previous?.tables?.[`${c.id}-1`]?.map(r=>teamById(world,r.id))??world.teams.filter(t=>t.country===c.id&&t.division===1).sort((a,b)=>teamRating(b)-teamRating(a))).filter(t=>!taken.has(t.id));
        qualified.push(...sorted.slice(0,perCountry).map(t=>t.id));sorted.slice(0,perCountry).forEach(t=>taken.add(t.id));
      }
      const extras=world.teams.filter(t=>t.division===1&&!taken.has(t.id)).sort((a,b)=>teamRating(b)-teamRating(a)).slice(0,count-qualified.length);
      qualified.push(...extras.map(t=>t.id));extras.forEach(t=>taken.add(t.id));
      const mixed=shuffle(qualified,rng);const groups=[];for(let i=0;i<mixed.length;i+=4)groups.push(mixed.slice(i,i+4));
      const comp={id,name,kind:'europe',teamIds:qualified,groups,prepared:[],rounds:Math.log2(count/2)};world.competitions.push(comp);
      groups.forEach((ids,g)=>roundRobin(ids).forEach((games,r)=>games.forEach(([a,b])=>fixture(world,comp,{id:`europe-${r}`},r,a,b,'group',g))));
    }
  });
  const domestic=[4,10,18,27,36],europe=[2,5,8,11,14,17,21,25,30,35];
  for(let r=0;r<38;r++) {
    world.events.push({id:`league-${r}`,kind:'league',round:r,label:`Jornada ${r+1}`});
    if(domestic.includes(r)) world.events.push({id:`cup-${domestic.indexOf(r)}`,kind:'cup',round:domestic.indexOf(r),label:`Copas nacionales · ${knockoutLabel(16/2**domestic.indexOf(r))}`});
    if(europe.includes(r)) {const n=europe.indexOf(r);world.events.push({id:`europe-${n}`,kind:'europe',round:n,label:n<6?`Europa · Grupos ${n+1}/6`:`Europa · ${knockoutLabel(8/2**(n-6))}`});}
  }
}

function setupPractice(world) {
  const own=teamById(world,world.userTeam);
  const rest=world.teams.filter(t=>t.id!==own.id&&t.division===1).sort((a,b)=>Math.abs(teamRating(a)-teamRating(own))-Math.abs(teamRating(b)-teamRating(own))).slice(0,7);
  const comp={id:'practice',name:world.mode==='league'?'Liga de los Ocho':'Copa Arcade',kind:world.mode==='league'?'league':'cup',teamIds:[own.id,...rest.map(t=>t.id)],rounds:3,prepared:[]};world.competitions.push(comp);
  if(world.mode==='league')roundRobin(comp.teamIds).forEach((games,r)=>{const e={id:`league-${r}`,kind:'league',round:r,label:`Jornada ${r+1}/14`};world.events.push(e);games.forEach(([a,b])=>fixture(world,comp,e,r,a,b));});
  else for(let r=0;r<3;r++)world.events.push({id:`cup-${r}`,kind:'cup',round:r,label:knockoutLabel(4/2**r)});
}

export function prepareEvent(world) {
  const event=world.events[world.eventIndex];if(!event)return;
  withRandom(world,rng=>{
    const comps=world.competitions.filter(c=>c.kind===event.kind&&(c.kind==='cup'||c.kind==='europe'));
    for(const comp of comps) {
      const r=event.kind==='europe'?event.round-6:event.round;
      if(r<0||r>=comp.rounds||comp.prepared.includes(r))continue;
      let ids;
      if(r===0&&comp.kind==='europe')ids=comp.groups.flatMap((_,g)=>standings(world,comp.id,g).slice(0,2).map(row=>row.id));
      else if(r===0)ids=comp.teamIds;
      else ids=world.fixtures.filter(f=>f.competition===comp.id&&f.stage==='knockout'&&f.round===r-1).map(f=>f.winner).filter(Boolean);
      if(ids.length<2)continue;
      knockoutPairs(ids,rng).forEach(([a,b])=>fixture(world,comp,event,r,a,b,'knockout'));
      comp.prepared.push(r);
    }
  });
}
export function eventFixtures(world) {prepareEvent(world);const e=world.events[world.eventIndex];return e?world.fixtures.filter(f=>f.eventId===e.id&&!f.bye):[];}
export function nextFixture(world) {return eventFixtures(world).find(f=>f.home===world.userTeam||f.away===world.userTeam)??null;}
export function transferOpen(world) {
  if(world.mode!=='career')return true;
  const leagueRound=world.events.slice(0,world.eventIndex).filter(e=>e.kind==='league').length;
  return world.seasonComplete||leagueRound<5||(leagueRound>=18&&leagueRound<=22);
}

function addFinance(world,label,amount) {world.finance.unshift({label,amount,season:world.season,event:world.eventIndex});world.finance=world.finance.slice(0,40);}
export function award(world,comp,winner) {
  if(comp.winner)return;
  comp.winner=winner;const team=teamById(world,winner);
  const prize=comp.kind==='europe'?(comp.id==='euro-crown'?18000000:8000000):comp.kind==='league'?12000000:comp.kind==='super'?1500000:4500000;
  team.budget+=prize;team.honours.push({name:comp.name,season:world.season,kind:comp.kind});
  if(team.id===world.userTeam) {
    world.trophies.push({name:comp.name,season:world.season,kind:comp.kind,club:team.name});world.reputation=clamp(world.reputation+8,0,100);addFinance(world,`Premio: ${comp.name}`,prize);
    news(world,`¡Campeones de ${comp.name}!`,`${team.name} levanta el trofeo. Premio de competición ingresado.`, 'trophy');
  }
}

function applyResult(world,f,result,rng) {
  if(f.score)throw new Error('El partido ya tiene resultado.');
  if(!validResult(result))throw new Error('Resultado inválido.');
  Object.assign(f,clone(result));
  [f.home,f.away].forEach((id,side)=>{
    const t=teamById(world,id);const win=f.score[side]>f.score[1-side];const draw=f.score[0]===f.score[1];
    t.form.push(win?'V':draw?'E':'D');t.form=t.form.slice(-5);
    const played=new Set(Object.keys(f.players??{}));
    for(const p of t.roster) {
      if(p.injury>0)p.injury--;if(p.ban>0)p.ban--;
      const s=f.players?.[p.id];
      p.fitness=clamp(p.fitness+(s?-rng.int(5,13):15),10,100);
      p.morale=clamp(p.morale+(win?4:draw?0:-3)+(s?1:-1),20,100);
      if(!s)continue;
      for(const key of ['minutes','goals','assists','shots','saves','yellow','red','rating']) {p.stats[key]+=(s[key]??0);p.career[key]+=(s[key]??0);}
      p.stats.matches++;p.career.matches++;p.form=Math.round((p.form*.65+(s.rating??6.5)*.35)*10)/10;
      p.yellows+=s.yellow??0;
      if(s.red)p.ban=2;
      if(p.yellows>=5) {p.ban=Math.max(1,p.ban);p.yellows-=5;}
      if(s.injury)p.injury=s.injury;
    }
    const wages=t.roster.reduce((sum,p)=>sum+wage(p),0);
    const attendanceScale={1:1,2:.4,3:.15}[t.division]??.15;
    const broadcast={1:180_000,2:60_000,3:20_000}[t.division]??20_000;
    const income=side===0?Math.round(t.capacity*(.5+rng()*.3)*23*attendanceScale)+broadcast:Math.round(broadcast*.75);
    const balance=income-Math.round(wages*.75);t.budget=Math.max(-10000000,t.budget+balance);
    if(id===world.userTeam) {
      addFinance(world,'Entradas y TV menos salarios',balance);
      const m=world.managerStats;m.matches++;m.goals+=f.score[side];m.against+=f.score[1-side];m[win?'wins':draw?'draws':'losses']++;m[result.source==='simulation'?'simulated':'played']++;
      for(const p of t.roster)if(f.players?.[p.id]?.injury)news(world,`${p.name}, en la enfermería`, `Baja durante ${p.injury} partidos.`,'injury');
    }
  });
  const comp=world.competitions.find(c=>c.id===f.competition);
  if(f.stage==='knockout'&&f.round===comp.rounds-1&&f.winner)award(world,comp,f.winner);
}
export function validResult(r) {
  return r&&Array.isArray(r.score)&&r.score.length===2&&r.score.every(n=>Number.isInteger(n)&&n>=0&&n<100)&&(!r.pens||(Array.isArray(r.pens)&&r.pens.length===2&&r.pens.every(n=>Number.isInteger(n)&&n>=0&&n<100)));
}

export function advance(world,manualResult=null) {
  if(world.seasonComplete)return null;
  const fixtures=eventFixtures(world);const own=fixtures.find(f=>f.home===world.userTeam||f.away===world.userTeam);
  if(manualResult&&(!own||manualResult.fixtureId!==own.id||!validResult(manualResult)))throw new Error('Este resultado no corresponde al partido pendiente.');
  const event=world.events[world.eventIndex];
  withRandom(world,rng=>{
    for(const f of fixtures) {
      if(f.score)continue;
      const result=f===own&&manualResult?manualResult:simulateMatch(teamById(world,f.home),teamById(world,f.away),rng,{knockout:f.stage==='knockout',difficulty:world.difficulty,userTeam:world.userTeam});
      applyResult(world,f,result,rng);
    }
    if(event.kind==='league') {
      developPlayers(world,rng);
      for(const t of world.teams)for(const p of t.roster)p.fitness=clamp(p.fitness+10,0,100);
    }
    if(world.eventIndex%7===6)aiTransfers(world,rng);
  });
  world.eventIndex++;world.weekDay=0;world.day=(world.day??0)+1;world.updated=Date.now();
  if(own) {
    const home=teamById(world,own.home),away=teamById(world,own.away);
    news(world,`${home.short} ${own.score[0]} – ${own.score[1]} ${away.short}`,`${world.competitions.find(c=>c.id===own.competition).name}${own.pens?` · Penaltis ${own.pens.join('–')}`:''}`,'result');
  }
  unlockAchievements(world);
  if(world.eventIndex>=world.events.length)finishSeason(world);
  return own??null;
}

function developPlayers(world,rng) {
  for(const t of world.teams)for(const p of t.roster) {
    if(p.injury)continue;
    const gap=p.potential-overall(p);
    if(gap<=0)continue;
    const focus=t.id===world.userTeam?world.trainingFocus:'balanced';
    p.training+=(p.age<23?.16:p.age<28?.07:.015)*(1+t.trainingLevel*.16)*(p.fitness/100)*(p.stats.matches?1.2:.8);
    if(p.training>=1) {
      p.training-=1;
      const keys=Object.keys(p.attributes).filter(k=>(p.position==='POR'?k!=='shot':k!=='keeping'));
      const key=keys.includes(focus)?focus:rng.pick(keys);
      p.attributes[key]=clamp(p.attributes[key]+1,1,97);
    }
  }
}
function aiTransfers(world,rng) {
  if(!transferOpen(world))return;
  for(let i=0;i<5;i++) {
    const target=rng.pick(world.teams.filter(t=>t.id!==world.userTeam&&t.roster.length<16));if(!target)continue;
    const source=rng.pick(world.teams.filter(t=>t.id!==world.userTeam&&t.id!==target.id&&t.roster.length>9));if(!source)continue;
    const p=rng.pick(source.roster.filter(p=>!p.loan&&!source.lineup.includes(p.id)&&p.position!=='POR'));
    if(!p)continue;const fee=transferPrice(p,source,target);
    if(target.budget<fee||overall(p)<teamRating(target)-7)continue;
    source.roster=source.roster.filter(x=>x!==p);target.roster.push(p);target.budget-=fee;source.budget+=fee;p.number=freeNumber(target);p.contract=3;
    world.transferLog.unshift({name:p.name,from:source.name,to:target.name,fee,season:world.season,event:world.eventIndex});
  }
  world.transferLog=world.transferLog.slice(0,80);
}
export function transferPrice(p,source,target) {
  if(!source)return Math.max(10_000,Math.round(playerValue(p,target)*.12/10_000)*10_000);
  return Math.round(playerValue(p,source)*(source.lineup.includes(p.id)?1.15:1)*(p.contract<=1?.83:1)*(target&&source.country!==target.country?1.03:1)/10_000)*10_000;
}
const freeNumber=t=>{for(let n=2;n<100;n++)if(!t.roster.some(p=>p.number===n))return n;return 99;};
export function buyPlayer(world,playerId,agreedFee=null,loan=false) {
  if(!transferOpen(world))throw new Error('El mercado está cerrado. Abre al inicio y a mitad de temporada.');
  const own=teamById(world,world.userTeam);if(own.roster.length>=20)throw new Error('La plantilla admite 20 jugadores. Vende o cede una plaza.');
  const source=world.teams.find(t=>t.id!==own.id&&t.roster.some(p=>p.id===playerId));
  const p=source?.roster.find(p=>p.id===playerId)??world.freeAgents.find(p=>p.id===playerId);
  if(!p)throw new Error('El jugador ya no está disponible.');
  if(p.loan)throw new Error('Este jugador ya está cedido.');
  if(loan&&!source)throw new Error('Los agentes libres no pueden llegar cedidos.');
  if(source&&(source.roster.length<=8||(p.position==='POR'&&source.roster.filter(x=>x.position==='POR').length<=1)))throw new Error('El club vendedor no acepta perder otro jugador en esa posición.');
  const fee=agreedFee??transferPrice(p,source,own);if(!Number.isFinite(fee)||fee<0||own.budget<fee)throw new Error('Presupuesto insuficiente para este fichaje.');
  if(source){source.roster=source.roster.filter(x=>x!==p);source.lineup=source.lineup.filter(id=>id!==p.id);source.budget+=fee;}
  else world.freeAgents=world.freeAgents.filter(x=>x!==p);
  own.budget-=fee;p.number=freeNumber(own);if(loan)p.loan={sourceId:source.id,season:world.season};else p.contract=4;p.morale=85;own.roster.push(p);
  const item={name:p.name,from:source?.name??'Libre',to:own.name,fee,season:world.season,event:world.eventIndex};world.transferLog.unshift(item);world.transferLog=world.transferLog.slice(0,80);
  addFinance(world,`Fichaje: ${p.name}`,-fee);news(world,`${p.name} ya es de ${own.name}`,loan?`Cesión hasta final de temporada. Refuerzo para ${p.position}.`:`Contrato de cuatro temporadas. Refuerzo para ${p.position}.`,'transfer');unlockAchievements(world);return p;
}
export function sellPlayer(world,playerId) {
  if(!transferOpen(world))throw new Error('El mercado está cerrado.');
  const own=teamById(world,world.userTeam),p=own.roster.find(p=>p.id===playerId);
  if(!p)throw new Error('Jugador desconocido.');
  if(p.loan)throw new Error('Un jugador cedido no se puede vender.');
  if(own.roster.length<=8)throw new Error('Necesitas al menos ocho jugadores.');
  if(p.position==='POR'&&own.roster.filter(x=>x.position==='POR').length<=1)throw new Error('Necesitas conservar un portero.');
  const fee=Math.round(playerValue(p,own)*.82/10000)*10000;
  const buyer=world.teams.filter(t=>t.id!==own.id&&t.roster.length<20&&t.budget>=fee).sort((a,b)=>Math.abs(teamRating(a)-overall(p))-Math.abs(teamRating(b)-overall(p)))[0];
  if(!buyer)throw new Error('No hay un club comprador con presupuesto.');
  own.roster=own.roster.filter(x=>x!==p);own.lineup=own.lineup.filter(id=>id!==p.id);own.budget+=fee;buyer.budget-=fee;buyer.roster.push(p);p.number=freeNumber(buyer);p.contract=3;
  world.transferLog.unshift({name:p.name,from:own.name,to:buyer.name,fee,season:world.season,event:world.eventIndex});world.transferLog=world.transferLog.slice(0,80);
  addFinance(world,`Venta: ${p.name}`,fee);news(world,`${p.name} ficha por ${buyer.name}`,'La operación se ha completado.','transfer');return fee;
}
export function renewPlayer(world,id) {
  const t=teamById(world,world.userTeam),p=t.roster.find(p=>p.id===id);if(!p)throw new Error('Jugador desconocido.');
  const fee=wage(p)*12;if(t.budget<fee)throw new Error('No hay presupuesto para la prima.');
  if(p.contract>=5)throw new Error('Ya tiene el contrato máximo.');t.budget-=fee;p.contract=Math.min(5,p.contract+2);p.morale=clamp(p.morale+8,0,100);addFinance(world,`Renovación: ${p.name}`,-fee);
}
export function upgrade(world,kind) {
  const t=teamById(world,world.userTeam);if(!['academy','trainingLevel'].includes(kind))throw new Error('Mejora desconocida.');
  if(t[kind]>=5)throw new Error('Instalación al máximo.');const cost=t[kind]*t[kind]*1000000;if(t.budget<cost)throw new Error('Presupuesto insuficiente.');t.budget-=cost;t[kind]++;addFinance(world,'Mejora de instalaciones',-cost);return cost;
}
export function promoteYouth(world) {
  const t=teamById(world,world.userTeam);if(t.youthSeason===world.season)throw new Error('Ya has ascendido a la promesa de esta temporada.');if(t.roster.length>=20)throw new Error('No quedan plazas en la plantilla.');
  const p=withRandom(world,rng=>{const p=makePlayer(rng,`youth-${world.nextPlayerId++}`,rng.int(45,58)+t.academy*3,rng.pick(['POR','DEF','MED','DEL']));p.age=17;p.potential=clamp(overall(p)+rng.int(10,19)+t.academy*2,overall(p),97);return p;});
  p.number=freeNumber(t);p.contract=5;t.roster.push(p);t.youthSeason=world.season;news(world,`La cantera presenta a ${p.name}`,`${p.age} años, posición ${p.position}. Su historia acaba de empezar.`,'youth');return p;
}

function finishSeason(world) {
  world.seasonComplete=true;const tables={},winners={};
  for(const comp of world.competitions) {
    if(comp.kind==='league') {
      const table=standings(world,comp.id);tables[comp.id]=table;
      if(table[0])award(world,comp,table[0].id);
      // Every club receives a placement reward, including clubs in the second division.
      table.forEach((row,i)=>{const prize=Math.round(300000+(table.length-i)*180000*(comp.division===3?.2:comp.division===2?.4:1));teamById(world,row.id).budget+=prize;if(row.id===world.userTeam)addFinance(world,'Premio por clasificación',prize);});
    }
    if(comp.winner)winners[comp.id]=comp.winner;
  }
  const own=teamById(world,world.userTeam),table=tables[`${own.country}-${own.division}`]??tables.practice;
  const rank=table?.findIndex(r=>r.id===own.id)??-1;
  world.reputation=clamp(world.reputation+(rank===0?12:rank>=0&&rank<4?6:rank>14?-3:1),0,100);
  const scorers=scorerTable(world).slice(0,10).map(s=>{const team=world.teams.find(t=>t.roster.some(p=>p.id===s.id));return {...s,name:team?.roster.find(p=>p.id===s.id)?.name??'Jugador',club:team?.name??'Libre'};});
  world.history.push({season:world.season,tables,winners,scorers,club:world.userTeam,managerRank:rank+1});world.history=world.history.slice(-30);
  news(world,`Temporada ${world.season}/${String(world.season+1).slice(2)} completada`,rank>=0?`${own.name} termina en el puesto ${rank+1}. Ya puedes preparar el siguiente curso.`:'La temporada termina. Revisa el palmarés y prepara la siguiente.','season');unlockAchievements(world);
}
export function nextSeason(world) {
  if(!world.seasonComplete)throw new Error('Todavía quedan partidos.');
  for(const t of world.teams)for(const p of [...t.roster])if(p.loan&&p.loan.season<=world.season){
    const source=teamById(world,p.loan.sourceId);
    if(source){t.roster=t.roster.filter(x=>x!==p);t.lineup=t.lineup.filter(id=>id!==p.id);p.number=freeNumber(source);source.roster.push(p);}
    delete p.loan;
  }
  world.weekDay=0;world.offers=[];
  const last=world.history.at(-1);
  if(world.mode==='career')for(const c of COUNTRIES) {
    const first=last.tables[`${c.id}-1`],second=last.tables[`${c.id}-2`];
    if(first&&second) {
      first.slice(-2).forEach(r=>teamById(world,r.id).division=2);second.slice(0,2).forEach(r=>teamById(world,r.id).division=1);
      const third=last.tables[`${c.id}-3`];
      if(third){second.slice(-2).forEach(r=>teamById(world,r.id).division=3);third.slice(0,2).forEach(r=>teamById(world,r.id).division=2);}
      if([...first.slice(-2),...second.slice(0,2)].some(r=>r.id===world.userTeam))news(world,teamById(world,world.userTeam).division===1?'¡Ascenso a Primera!':'Nueva etapa en la división de ascenso','El reto continúa.','season');
    }
  }
  world.season++;
  const existingFreeAgents=new Set(world.freeAgents.map(p=>p.id));
  withRandom(world,rng=>{
    for(const t of world.teams) {
      const leaving=[];
      for(const p of t.roster) {
        p.age++;p.contract--;p.stats=emptyStats();p.fitness=100;p.injury=0;p.ban=0;p.yellows=0;
        if(p.age>30)for(const k of Object.keys(p.attributes))p.attributes[k]=clamp(p.attributes[k]-rng.int(0,p.age>34?3:1),15,97);
        if(p.age>=38||(p.age>=35&&rng()<.15)) {leaving.push(p);if(t.id===world.userTeam)news(world,`${p.name} cuelga las botas`,'Una nueva generación toma el relevo.','retirement');}
        else if(p.contract<=0) {
          if(t.id!==world.userTeam)p.contract=rng.int(2,4);
          else {leaving.push(p);world.freeAgents.push(p);news(world,`${p.name} termina su contrato`,'Ha quedado libre. Puedes buscarle en el mercado.','transfer');}
        }
        p.potential=Math.max(overall(p),p.potential-(p.age>31?1:0));
      }
      t.roster=t.roster.filter(p=>!leaving.includes(p));t.lineup=t.lineup.filter(id=>t.roster.some(p=>p.id===id));
      while(t.roster.length<10||!t.roster.some(p=>p.position==='POR')) {
        const p=makePlayer(rng,`regen-${world.nextPlayerId++}`,rng.int(49,65)+t.academy*2,!t.roster.some(p=>p.position==='POR')?'POR':rng.pick(['DEF','MED','DEL']));p.age=rng.int(17,20);p.potential=clamp(overall(p)+rng.int(8,21),overall(p),97);p.number=freeNumber(t);t.roster.push(p);
      }
      t.budget+=t.division===1?4_000_000:t.division===2?900_000:450_000;t.form=[];
    }
    for(const p of world.freeAgents){if(existingFreeAgents.has(p.id))p.age++;p.contract=0;p.fitness=100;p.injury=0;p.ban=0;p.stats=emptyStats();if(p.age>30)for(const k of Object.keys(p.attributes))p.attributes[k]=clamp(p.attributes[k]-rng.int(0,2),15,97);p.potential=Math.max(overall(p),p.potential-(p.age>31?1:0));}
    world.freeAgents=world.freeAgents.filter(p=>p.age<36).slice(-60);
    for(let i=0;i<8;i++)world.freeAgents.push(makePlayer(rng,`free-${world.nextPlayerId++}`,rng.int(56,80),rng.pick(['POR','DEF','MED','DEL'])));
  });
  setupSeason(world);news(world,`Bienvenido a ${world.season}/${String(world.season+1).slice(2)}`,'Mercado abierto. Nuevas promesas, nuevas ambiciones.','season');
}
export function changeClub(world,id) {
  if(!world.seasonComplete)throw new Error('Puedes cambiar de club al final de la temporada.');
  const t=teamById(world,id);if(!t)throw new Error('Club desconocido.');if(teamRating(t)>65+world.reputation*.3)throw new Error('Tu reputación todavía no alcanza la exigencia del club.');
  world.userTeam=id;news(world,`${world.manager} firma por ${t.name}`,'Una nueva etapa en tu carrera.','transfer');
}
export const ACHIEVEMENTS=[
  ['first','Debut','Completa tu primer partido.',w=>w.managerStats.matches>=1],
  ['win','Primer triunfo','Gana un partido.',w=>w.managerStats.wins>=1],
  ['ten','En racha','Consigue diez victorias.',w=>w.managerStats.wins>=10],
  ['goals','Red caliente','Marca cincuenta goles.',w=>w.managerStats.goals>=50],
  ['transfer','Nuevo dorsal','Completa un fichaje.',w=>w.transferLog.some(t=>t.to===teamById(w,w.userTeam).name)],
  ['youth','La siguiente generación','Asciende una promesa de la cantera.',w=>w.teams.some(t=>t.youthSeason)],
  ['cup','Plata en las vitrinas','Levanta un trofeo.',w=>w.trophies.length>0],
  ['double','Doble celebración','Gana dos títulos.',w=>w.trophies.length>=2],
  ['europe','La cima de Europa','Gana la Copa de las Estrellas.',w=>w.trophies.some(t=>t.name==='Copa de las Estrellas')],
  ['season','Una vuelta al sol','Termina una temporada.',w=>w.history.length>0],
  ['veteran','Toda una carrera','Completa cinco temporadas.',w=>w.history.length>=5],
  ['legend','Míster leyenda','Alcanza reputación 80.',w=>w.reputation>=80]
];
export function unlockAchievements(world) {for(const [id,,,test] of ACHIEVEMENTS)if(!world.achievements.includes(id)&&test(world))world.achievements.push(id);}
