import { teamById } from './data.js';
import { buyPlayer, preserveLineupSlots, transferOpen, transferPrice, news, resolveScoutingMissions } from './career.js';
import { random } from './utils.js';

function locate(world,id) {
  const source=world.teams.find(t=>t.id!==world.userTeam&&t.roster.some(p=>p.id===id));
  return {source,player:source?.roster.find(p=>p.id===id)??world.freeAgents.find(p=>p.id===id)};
}
const freeNumber=team=>{for(let number=2;number<100;number++)if(!team.roster.some(player=>player.number===number))return number;return 99;};
export function submitOffer(world,playerId,fee,type='transfer') {
  if(!transferOpen(world))throw new Error('El mercado está cerrado.');
  const own=teamById(world,world.userTeam),{source,player}=locate(world,playerId);
  if(!player||player.loan)throw new Error('El jugador ya no está disponible.');
  if(!['transfer','loan'].includes(type))throw new Error('Tipo de oferta no válido.');
  if(type==='loan'&&!source)throw new Error('No se puede ceder a un jugador libre.');
  if(!Number.isSafeInteger(fee)||fee<0||fee>own.budget)throw new Error('Introduce una oferta válida dentro de tu presupuesto.');
  if(own.roster.length>=26)throw new Error('Tu plantilla está completa.');
  const offers=world.offers??(world.offers=[]);
  if(offers.some(o=>o.playerId===playerId&&['pending','accepted'].includes(o.status)))throw new Error('Ya tienes una negociación abierta por este jugador.');
  const asking=transferPrice(player,source,own);
  const o={id:`offer-${world.season}-${world.day??0}-${offers.length}`,playerId,name:player.name,sourceId:source?.id??null,type,fee,asking:type==='loan'?Math.max(10000,Math.round(asking*.12/10000)*10000):asking,status:'pending',due:(world.day??0)+2,unread:false};
  // A new proposal replaces the previous rejected one for this player.
  for(const previous of offers)if(previous.playerId===playerId&&previous.status==='rejected')previous.status='replaced';
  offers.unshift(o);offers.length= Math.min(offers.length,500);return o;
}
export function advanceDay(world) {
  if(world.seasonComplete)throw new Error('La temporada ha terminado.');
  if((world.weekDay??0)>=6)throw new Error('Ya es día de partido.');
  world.day=(world.day??0)+1;world.weekDay=(world.weekDay??0)+1;
  for(const o of world.offers??[])if(o.direction!=='incoming'&&o.status==='pending'&&o.due<=world.day) {
    const {source,player}=locate(world,o.playerId);
    if(!player||(o.sourceId??null)!==(source?.id??null)||player.loan){o.status='unavailable';}
    else if(source&&(source.roster.length<=8||(player.position==='POR'&&source.roster.filter(p=>p.position==='POR').length<=1))){o.status='unavailable';}
    else if(o.fee>=o.asking*.9)o.status='accepted';
    else {o.status='rejected';o.counter=Math.max(o.fee+10000,Math.round(o.asking*.94/10000)*10000);}
    o.unread=true;
  }
  for(const o of world.offers??[])if(o.direction==='incoming'&&o.status==='countered'&&o.due<=world.day) {
    const buyer=teamById(world,o.buyerId),player=teamById(world,world.userTeam)?.roster.find(p=>p.id===o.playerId);
    if(!buyer||!player||buyer.budget<o.counter){o.status='unavailable';}
    else if(o.counter<=o.asking*1.12){o.status='counter-accepted';o.fee=o.counter;}
    else {o.status='counter-rejected';o.buyerCounter=Math.min(o.counter,Math.round(Math.max(o.fee,o.asking*.97)/10_000)*10_000);}
    o.unread=true;
  }
  generateIncomingOffer(world);
  resolveScoutingMissions(world);
  return world.weekDay;
}
export function signOffer(world,id) {
  const o=(world.offers??[]).find(x=>x.id===id);
  if(!o||o.status!=='accepted')throw new Error('La oferta ya no está disponible.');
  const found=locate(world,o.playerId);
  if((found.source?.id??null)!==o.sourceId)throw new Error('El jugador ya no pertenece al club que aceptó.');
  const p=buyPlayer(world,o.playerId,o.fee,o.type==='loan');
  o.status='signed';o.unread=false;return p;
}
export function counterOffer(world,id) {
  const o=(world.offers??[]).find(x=>x.id===id);
  if(!o||o.status!=='rejected')throw new Error('No hay contraoferta disponible.');
  return o;
}

function generateIncomingOffer(world) {
  if(!transferOpen(world)||![3,6].includes(world.weekDay))return null;
  const active=(world.offers??[]).filter(o=>o.direction==='incoming'&&['incoming','countered','counter-accepted','counter-rejected'].includes(o.status));
  if(active.length>=3)return null;
  const rng=random(world.rngState);if(rng()>.5){world.rngState=rng.state();return null;}
  const own=teamById(world,world.userTeam),reserved=new Set(active.map(o=>o.playerId));
  const players=own.roster.filter(p=>!p.loan&&!reserved.has(p.id)&&own.roster.length>9&&(p.position!=='POR'||own.roster.filter(q=>q.position==='POR').length>1));
  const buyers=world.teams.filter(t=>t.id!==own.id&&t.roster.length<20);
  const options=[];
  for(const player of players)for(const buyer of buyers){
    const asking=transferPrice(player,own,buyer),fee=Math.round(asking*(.88+rng()*.18)/10_000)*10_000;
    if(buyer.budget>=fee)options.push({player,buyer,asking,fee});
  }
  if(!options.length){world.rngState=rng.state();return null;}
  const picked=rng.pick(options),offers=(world.offers??=[]);
  const offer={id:`incoming-${world.season}-${world.day}-${offers.length}`,direction:'incoming',buyerId:picked.buyer.id,playerId:picked.player.id,name:picked.player.name,fee:picked.fee,asking:picked.asking,status:'incoming',due:null,unread:true,createdDay:world.day};
  offers.unshift(offer);offers.length=Math.min(offers.length,500);world.rngState=rng.state();return offer;
}

export function counterIncomingOffer(world,id,amount) {
  const offer=(world.offers??[]).find(o=>o.id===id);
  if(!offer||offer.direction!=='incoming'||!['incoming','counter-rejected'].includes(offer.status))throw new Error('Esta oferta ya no admite una contraoferta.');
  const buyer=teamById(world,offer.buyerId),player=teamById(world,world.userTeam)?.roster.find(p=>p.id===offer.playerId);
  if(!buyer||!player)throw new Error('El club o el jugador ya no están disponibles.');
  if(!Number.isSafeInteger(amount)||amount<=offer.fee||amount>buyer.budget)throw new Error('La contraoferta debe superar la oferta y caber en el presupuesto del club.');
  offer.counter=amount;offer.status='countered';offer.due=world.day+2;offer.unread=false;return offer;
}

export function answerIncomingOffer(world,id,decision) {
  const offer=(world.offers??[]).find(o=>o.id===id);
  if(!offer||offer.direction!=='incoming')throw new Error('No se encuentra la oferta recibida.');
  if(decision==='reject') {
    if(!['incoming','counter-accepted','counter-rejected'].includes(offer.status))throw new Error('Esta oferta ya tiene respuesta.');
    offer.status='declined';offer.unread=false;return null;
  }
  const fee=decision==='accept-original'&&offer.status==='incoming'?offer.fee:decision==='accept-counter'&&offer.status==='counter-accepted'?offer.counter:decision==='accept-final'&&offer.status==='counter-rejected'?offer.buyerCounter:null;
  if(!fee)throw new Error('La oferta ya no se puede aceptar.');
  const own=teamById(world,world.userTeam),buyer=teamById(world,offer.buyerId),player=own.roster.find(p=>p.id===offer.playerId);
  if(!buyer||!player||buyer.roster.length>=26||buyer.budget<fee)throw new Error('El comprador ya no puede completar el fichaje.');
  if(own.roster.length<=8||(player.position==='POR'&&own.roster.filter(p=>p.position==='POR').length<=1))throw new Error('Necesitas conservar al menos ocho jugadores y un portero.');
  preserveLineupSlots(own,new Set([player.id]));own.roster=own.roster.filter(p=>p.id!==player.id);own.lineup=own.lineup.filter(playerId=>playerId!==player.id);own.budget+=fee;buyer.budget-=fee;player.number=freeNumber(buyer);player.contract=3;buyer.roster.push(player);
  world.finance.unshift({label:`Venta: ${player.name}`,amount:fee,season:world.season,event:world.eventIndex});world.finance=world.finance.slice(0,40);
  world.transferLog.unshift({name:player.name,from:own.name,to:buyer.name,fee,season:world.season,event:world.eventIndex});world.transferLog=world.transferLog.slice(0,80);
  offer.status='sold';offer.saleFee=fee;offer.unread=false;news(world,`${player.name} ficha por ${buyer.name}`,`Oferta aceptada por ${moneyText(fee)}.`,'transfer');return player;
}
const moneyText=value=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value);

