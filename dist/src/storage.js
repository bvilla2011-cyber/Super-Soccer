import { hash, clone } from './utils.js';
import { SAVE_VERSION, rebaseCareerEconomy } from './career.js';

const MAGIC='SUPER-SOCCER';
const MAX_FILE=24*1024*1024;
let dbPromise;
function openDB() {
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    if(!globalThis.indexedDB)return reject(new Error('IndexedDB no disponible'));
    const req=indexedDB.open('super-soccer-offline',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('saves',{keyPath:'id'});
    req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();dbPromise=null;};resolve(db);};req.onerror=()=>{dbPromise=null;reject(req.error);};
    req.onblocked=()=>{dbPromise=null;reject(new Error('Cierra otras pestañas del juego para actualizar el guardado.'));};
  });
  return dbPromise;
}
async function readRecord(id) {
  try {
    const db=await openDB();const record=await new Promise((resolve,reject)=>{const req=db.transaction('saves').objectStore('saves').get(id);req.onsuccess=()=>resolve(req.result??null);req.onerror=()=>reject(req.error);});
    let fallback=null;try{const raw=globalThis.localStorage?.getItem(`super-soccer-save-${id}`);fallback=raw?JSON.parse(raw):null;}catch(error){}
    return (fallback?.current?.date??0)>(record?.current?.date??0)?fallback:record;
  } catch(error) {
    const raw=globalThis.localStorage?.getItem(`super-soccer-save-${id}`);return raw?JSON.parse(raw):null;
  }
}
async function writeRecord(record) {
  let db;
  try { db=await openDB(); }catch(error){
    if(!globalThis.localStorage)throw new Error('El navegador no permite guardar. Exporta una copia de tu carrera.');
    return writeFallback(record);
  }
  try {
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('saves','readwrite');tx.objectStore('saves').put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });return 'IndexedDB';
  } catch(error) {
    return writeFallback(record);
  }
}
// Large careers can exceed localStorage's quota when a second full generation is kept.
// Prefer the latest complete save to failing every subsequent save in fallback mode.
function writeFallback(record) {
  try {
    const storage=globalThis.localStorage;if(!storage)throw new Error('unavailable');
    const key=`super-soccer-save-${record.id}`;
    try {storage.setItem(key,JSON.stringify(record));return 'localStorage';}
    catch (error) {
      if(!record.backup)throw error;
      storage.setItem(key,JSON.stringify({...record,backup:null}));
      return 'localStorage-single';
    }
  } catch(error) {throw new Error('No se ha podido guardar. Exporta tu carrera y comprueba el espacio disponible.');}
}
const assert=(condition,message)=>{if(!condition)throw new Error(`Partida incompatible o dañada: ${message}`);};
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
export function validatePayload(payload) {
  const w=payload?.world;
  assert(w&&w.version===SAVE_VERSION,'versión no reconocida.');
  assert(Array.isArray(w.teams)&&w.teams.length>=8&&w.teams.length<=350,'lista de clubes.');
  assert(typeof w.manager==='string'&&w.manager.length<=64,'entrenador.');
  assert(['career','league','cup'].includes(w.mode),'modo de juego.');
  assert(['rookie','club','legend'].includes(w.difficulty),'dificultad.');
  assert(integer(w.season,2026,9999)&&integer(w.rngState,0,4294967295),'temporada o semilla.');
  const teams=new Set(),players=new Set();
  for(const t of w.teams) {
    assert(typeof t.id==='string'&&/^[a-z0-9-]{1,100}$/i.test(t.id)&&!teams.has(t.id),'identificador de club.');teams.add(t.id);
    assert(typeof t.name==='string'&&t.name.length<100&&typeof t.code==='string'&&/^[a-z0-9]{1,8}$/i.test(t.code),'nombre de club.');
    assert(Array.isArray(t.colors)&&t.colors.length===2&&t.colors.every(c=>/^#[0-9a-f]{6}$/i.test(c)),'colores del club.');
    assert(finite(t.budget,-1e10,1e12)&&integer(t.division,1,3),'economía o división.');
    assert(Array.isArray(t.roster)&&t.roster.length>=1&&t.roster.length<=30,'plantilla.');
    assert(Array.isArray(t.lineup)&&t.lineup.length<=11&&new Set(t.lineup).size===t.lineup.length,'alineación.');
    assert(['2-1-1','1-2-1','1-1-2','4-4-2','4-3-3','4-2-3-1','3-5-2','3-4-3'].includes(t.formation)&&['balanced','attacking','defensive'].includes(t.tactic),'táctica.');
    if(t.kits)assert(['home','away'].every(side=>t.kits[side]&&/^#[0-9a-f]{6}$/i.test(t.kits[side].primary)&&/^#[0-9a-f]{6}$/i.test(t.kits[side].secondary)&&['solid','halves','stripes','sash','hoops','diamonds'].includes(t.kits[side].pattern)),'equipaciones.');
    assert(integer(t.academy,1,5)&&integer(t.trainingLevel,1,5)&&Array.isArray(t.honours)&&Array.isArray(t.form)&&t.form.length<=5&&t.form.every(f=>['V','E','D'].includes(f)),'instalaciones.');
    for(const p of t.roster)validatePlayer(p,players);
    assert(t.lineup.every(id=>t.roster.some(p=>p.id===id)),'alineación ajena a la plantilla.');
  }
  assert(teams.has(w.userTeam),'club del entrenador.');
  assert(Array.isArray(w.freeAgents)&&w.freeAgents.length<=200,'jugadores libres.');
  for(const p of w.freeAgents)validatePlayer(p,players);
  assert(Array.isArray(w.events)&&w.events.length>0&&w.events.length<=150&&integer(w.eventIndex,0,w.events.length),'calendario.');
  assert(w.events.every(e=>typeof e.id==='string'&&typeof e.label==='string'&&['league','cup','europe','super'].includes(e.kind)&&integer(e.round,0,100)),'eventos.');
  assert(Array.isArray(w.competitions)&&w.competitions.length<=100,'competiciones.');
  const comps=new Set(w.competitions.map(c=>c.id));assert(comps.size===w.competitions.length,'competiciones repetidas.');
  for(const c of w.competitions) {
    assert(typeof c.id==='string'&&/^[a-z0-9-]{1,100}$/i.test(c.id)&&typeof c.name==='string'&&['league','cup','europe','super'].includes(c.kind)&&Array.isArray(c.teamIds)&&c.teamIds.every(id=>teams.has(id)),'estructura de competición.');
    if(c.groups)assert(Array.isArray(c.groups)&&c.groups.length<=16&&c.groups.every(g=>Array.isArray(g)&&g.length===4&&g.every(id=>c.teamIds.includes(id))),'grupos.');
    if(c.kind==='cup'||c.kind==='europe')assert(Array.isArray(c.prepared)&&integer(c.rounds,1,8),'cuadro eliminatorio.');
  }
  assert(Array.isArray(w.fixtures)&&w.fixtures.length<=20000,'partidos.');const fixtureIds=new Set();
  for(const f of w.fixtures) {
    assert(typeof f.id==='string'&&/^[a-z0-9-]{1,200}$/i.test(f.id)&&!fixtureIds.has(f.id)&&teams.has(f.home)&&(f.away===null||teams.has(f.away))&&f.home!==f.away&&comps.has(f.competition),'referencia de partido.');fixtureIds.add(f.id);
    assert(f.score===null||(Array.isArray(f.score)&&f.score.length===2&&f.score.every(n=>integer(n,0,99))),'marcador.');
    if(f.players)assert(typeof f.players==='object'&&!Array.isArray(f.players)&&Object.values(f.players).every(s=>s&&finite(s.minutes,0,130)&&finite(s.goals,0,99)&&finite(s.rating,0,10)),'estadísticas del partido.');
  }
  for(const name of ['news','history','finance','transferLog','trophies','achievements'])assert(Array.isArray(w[name])&&w[name].length<=500,name);
  assert(w.managerStats&&Object.values(w.managerStats).every(n=>finite(n,0,1e9)),'estadísticas del entrenador.');
  assert(finite(w.reputation,0,100)&&integer(w.nextPlayerId,1,1e9),'progresión.');
  if(payload.match) {
    const m=payload.match;
    assert(typeof m.fixtureId==='string'&&fixtureIds.has(m.fixtureId)&&m.snapshot&&Array.isArray(m.snapshot.players)&&m.snapshot.players.length<=22,'partido en curso.');
    assert(Array.isArray(m.snapshot.score)&&m.snapshot.score.length===2&&m.snapshot.score.every(n=>integer(n,0,99))&&finite(m.snapshot.clock,0,6000),'marcador en curso.');
    assert(['Kickoff','InPlay','Action','HalfTime','FullTime','Shootout'].includes(m.snapshot.state),'estado de partido.');
    assert(m.snapshot.players.every(p=>p&&typeof p.id==='string'&&finite(p.x,-1000,3000)&&finite(p.y,-1000,3000)&&finite(p.vx,-3000,3000)&&finite(p.vy,-3000,3000)),'posiciones en curso.');
    assert(integer(m.snapshot.rngState,0,4294967295)&&integer(m.snapshot.half,1,2)&&finite(m.snapshot.duration,60,600)&&finite(m.snapshot.elapsed,0,1e7)&&finite(m.snapshot.stateTime,0,1e7),'reloj en curso.');
    assert(m.snapshot.firstHalf&&Array.isArray(m.snapshot.firstHalf.events)&&Array.isArray(m.snapshot.firstHalf.score)&&m.snapshot.firstHalf.players&&m.snapshot.firstHalf.stats,'primera parte en curso.');
    assert(m.snapshot.half!==2||m.snapshot.secondHalf&&Array.isArray(m.snapshot.secondHalf.events)&&m.snapshot.secondHalf.players,'segunda parte en curso.');
    assert(Array.isArray(m.snapshot.teams)&&m.snapshot.teams.length===2&&m.snapshot.teams.every(t=>teams.has(t.id))&&Array.isArray(m.snapshot.visibleEvents),'equipos en curso.');
    assert(m.snapshot.ball&&finite(m.snapshot.ball.x,-1000,3000)&&finite(m.snapshot.ball.y,-1000,3000),'balón en curso.');
  }
  return payload;
}
function validatePlayer(p,ids) {
  assert(typeof p.id==='string'&&/^[a-z0-9-]{1,100}$/i.test(p.id)&&!ids.has(p.id),'jugador repetido.');ids.add(p.id);
  assert(typeof p.name==='string'&&p.name.length<100&&['POR','DEF','MED','DEL'].includes(p.position)&&integer(p.age,10,90)&&integer(p.number,0,99),'ficha de jugador.');
  assert(p.attributes&&['pace','shot','pass','defense','control','stamina','keeping'].every(k=>finite(p.attributes[k],1,99)),'atributos.');
  assert(finite(p.potential,1,99)&&finite(p.fitness,0,100)&&finite(p.morale,0,100)&&integer(p.injury,0,100)&&integer(p.ban,0,100)&&integer(p.contract,0,10),'estado de jugador.');
  assert(p.stats&&p.career&&Object.values(p.stats).every(n=>finite(n,0,1e9))&&Object.values(p.career).every(n=>finite(n,0,1e9)),'estadísticas de jugador.');
}
export function makeEnvelope(world,match=null) {
  const payload=clone({world,match});const data=JSON.stringify(payload);
  return {format:MAGIC,version:SAVE_VERSION,date:Date.now(),checksum:hash(data),data};
}
export function unpack(envelope) {
  assert(envelope?.format===MAGIC&&envelope.version===SAVE_VERSION&&typeof envelope.data==='string','formato de archivo.');
  assert(envelope.data.length<=MAX_FILE&&hash(envelope.data)===envelope.checksum,'la suma de comprobación no coincide.');
  return validatePayload(JSON.parse(envelope.data));
}
let saveQueue=Promise.resolve();
export function saveSlot(id,world,match=null) {
  validatePayload({world,match});
  const envelope=makeEnvelope(world,match);
  const savedWorld=JSON.parse(envelope.data).world;
  const task=saveQueue.catch(()=>{}).then(async()=>{
    const record=await readRecord(id);
    let previous=null;
    try {if(record?.current){unpack(record.current);previous=record.current;}}catch(e){previous=record?.backup??null;}
    const team=savedWorld.teams.find(t=>t.id===savedWorld.userTeam);
    const metadata={manager:savedWorld.manager,club:team.name,teamId:team.id,colors:team.colors,code:team.code,season:savedWorld.season,event:savedWorld.eventIndex,total:savedWorld.events.length,mode:savedWorld.mode,date:envelope.date,match:!!match};
    const backend=await writeRecord({id,current:envelope,backup:previous,metadata});return {...metadata,backend};
  });saveQueue=task;return task;
}
export async function loadSlot(id,{backup=false}={}) {
  await saveQueue.catch(()=>{});
  const record=await readRecord(id);if(!record)return null;
  const restore=envelope=>{const payload=unpack(envelope);payload.economyMigrated=rebaseCareerEconomy(payload.world);return payload;};
  if(backup) {if(!record.backup)throw new Error('Esta ranura todavía no tiene una copia anterior.');return {...restore(record.backup),recovered:true};}
  try {return {...restore(record.current),recovered:false};}
  catch(error){if(record.backup)return {...restore(record.backup),recovered:true};throw error;}
}
export async function listSlots() {
  return Promise.all([1,2,3].map(async id=>{try {const record=await readRecord(id);return {id,...record?.metadata,exists:!!record,hasBackup:!!record?.backup};}catch(e){return {id,exists:true,broken:true};}}));
}
export async function deleteSlot(id) {
  await saveQueue.catch(()=>{});
  try {const db=await openDB();await new Promise((resolve,reject)=>{const tx=db.transaction('saves','readwrite');tx.objectStore('saves').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}catch(e){}
  globalThis.localStorage?.removeItem(`super-soccer-save-${id}`);
}
export function exportSave(world,match=null) {return JSON.stringify(makeEnvelope(world,match));}
export function importSave(text) {
  if(typeof text!=='string'||text.length>MAX_FILE)throw new Error('El archivo supera el límite de 24 MB.');
  try{const payload=unpack(JSON.parse(text));payload.economyMigrated=rebaseCareerEconomy(payload.world);return payload;}catch(error){if(error instanceof SyntaxError)throw new Error('El archivo no contiene una partida JSON válida.');throw error;}
}
export function getSettings() {
  const defaults={sound:true,music:false,volume:.45,duration:180,offside:false,quality:'high',reducedMotion:false,autoSwitch:true};
  try {const s=JSON.parse(localStorage.getItem('super-soccer-settings')??'{}');return {...defaults,...s,duration:[120,180,300].includes(s.duration)?s.duration:180,volume:Math.max(0,Math.min(1,Number(s.volume??.45)||0))};}catch(e){return defaults;}
}
export function setSettings(settings) {try {localStorage.setItem('super-soccer-settings',JSON.stringify(settings));}catch(e){}}
