import { teamById } from './data.js';
import { buyPlayer, transferOpen, transferPrice } from './career.js';

function locate(world,id) {
  const source=world.teams.find(t=>t.id!==world.userTeam&&t.roster.some(p=>p.id===id));
  return {source,player:source?.roster.find(p=>p.id===id)??world.freeAgents.find(p=>p.id===id)};
}
export function submitOffer(world,playerId,fee,type='transfer') {
  if(!transferOpen(world))throw new Error('El mercado está cerrado.');
  const own=teamById(world,world.userTeam),{source,player}=locate(world,playerId);
  if(!player||player.loan)throw new Error('El jugador ya no está disponible.');
  if(type==='loan'&&!source)throw new Error('No se puede ceder a un jugador libre.');
  if(!Number.isSafeInteger(fee)||fee<0||fee>own.budget)throw new Error('Introduce una oferta válida dentro de tu presupuesto.');
  if(own.roster.length>=20)throw new Error('Tu plantilla está completa.');
  const offers=world.offers??(world.offers=[]);
  if(offers.some(o=>o.playerId===playerId&&['pending','accepted'].includes(o.status)))throw new Error('Ya tienes una negociación abierta por este jugador.');
  const asking=transferPrice(player,source,own);
  const o={id:`offer-${world.season}-${world.day??0}-${offers.length}`,playerId,name:player.name,sourceId:source?.id??null,type,fee,asking:type==='loan'?Math.max(10000,Math.round(asking*.12/10000)*10000):asking,status:'pending',due:(world.day??0)+2,unread:false};
  offers.unshift(o);return o;
}
export function advanceDay(world) {
  if(world.seasonComplete)throw new Error('La temporada ha terminado.');
  if((world.weekDay??0)>=6)throw new Error('Ya es día de partido.');
  world.day=(world.day??0)+1;world.weekDay=(world.weekDay??0)+1;
  for(const o of world.offers??[])if(o.status==='pending'&&o.due<=world.day) {
    const {source,player}=locate(world,o.playerId);
    if(!player||(o.sourceId??null)!==(source?.id??null)||player.loan){o.status='unavailable';}
    else if(o.fee>=o.asking*.9)o.status='accepted';
    else {o.status='rejected';o.counter=Math.max(o.fee+10000,Math.round(o.asking*.94/10000)*10000);}
    o.unread=true;
  }
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
