import test from 'node:test';import assert from 'node:assert/strict';
import {createCareer,buyPlayer,sellPlayer,renewPlayer,promoteYouth,upgrade,advance,nextSeason,transferPrice} from '../src/career.js';
import {teamById,overall,wage} from '../src/data.js';
import {exportSave,importSave,makeEnvelope,unpack,validatePayload,saveSlot,loadSlot,listSlots} from '../src/storage.js';

test('transfer funds balance, ownership moves and repeated purchases fail',()=>{
 const w=createCareer({seed:42}),own=teamById(w,w.userTeam),source=teamById(w,'en-1'),p=source.roster[8],fee=transferPrice(p,source,own),budget=own.budget,other=source.budget;
 buyPlayer(w,p.id);assert.equal(own.budget,budget-fee);assert.equal(source.budget,other+fee);assert.ok(own.roster.some(q=>q.id===p.id));assert.ok(!source.roster.some(q=>q.id===p.id));assert.throws(()=>buyPlayer(w,p.id),/disponible/);validatePayload({world:w});
 const before=own.budget,received=sellPlayer(w,p.id);assert.equal(own.budget,before+received);assert.ok(!own.roster.some(q=>q.id===p.id));validatePayload({world:w});
});
test('market enforces budget, window, squad limit and goalkeeper retention',()=>{
 const w=createCareer({seed:9}),own=teamById(w,w.userTeam);own.budget=0;assert.throws(()=>buyPlayer(w,'en-1-p4'),/Presupuesto/);own.budget=1e9;
 w.eventIndex=w.events.findIndex(e=>e.id==='league-8');assert.throws(()=>buyPlayer(w,'en-1-p4'),/cerrado/);
 w.eventIndex=0;own.roster=own.roster.slice(0,8).filter(p=>p.position!=='POR'||p.id===own.roster[0].id);assert.throws(()=>sellPlayer(w,own.roster[0].id),/ocho|portero/);
});
test('renewal and facility upgrade charge exactly once; youth is once per season',()=>{
 const w=createCareer({seed:42}),t=teamById(w,w.userTeam),p=t.roster.find(p=>p.contract<5),cost=wage(p)*12,before=t.budget,contract=p.contract;renewPlayer(w,p.id);assert.equal(p.contract,Math.min(5,contract+2));assert.equal(t.budget,before-cost);
 const start=t.budget;upgrade(w,'academy');assert.equal(t.academy,2);assert.equal(t.budget,start-1000000);const youth=promoteYouth(w);assert.equal(youth.age,17);assert.ok(youth.potential>=overall(youth));assert.throws(()=>promoteYouth(w),/temporada/);validatePayload({world:w});
});
test('growth never exceeds potential and veterans age and retire over seasons',()=>{
 const w=createCareer({seed:6}),t=teamById(w,w.userTeam);const veteran=t.roster[0];veteran.age=37;veteran.contract=3;const young=t.roster[3];young.age=18;young.contract=5;const before=overall(young);while(!w.seasonComplete)advance(w);assert.ok(overall(young)>=before);assert.ok(overall(young)<=young.potential);nextSeason(w);assert.ok(!t.roster.some(p=>p.id===veteran.id));assert.equal(young.age,19);
});
test('export and import retain a whole career; corruption is rejected',()=>{
 const w=createCareer({seed:69});advance(w);const data=exportSave(w);const restored=importSave(data);assert.deepEqual(restored.world,w);const envelope=makeEnvelope(w);envelope.data=envelope.data.replace('Biel','Otro');if(envelope.data===makeEnvelope(w).data)envelope.data+=' ';assert.throws(()=>unpack(envelope),/comprobación/);assert.throws(()=>importSave('{bad'),/JSON/);assert.throws(()=>importSave('x'.repeat(25*1024*1024)),/24 MB/);
});
test('import rejects invalid references, duplicate players and unsafe colors',()=>{
 const w=createCareer({seed:2});w.teams[0].colors[0]='<script>';assert.throws(()=>validatePayload({world:w}),/colores/);w.teams[0].colors[0]='#123456';w.teams[1].roster[0].id=w.teams[0].roster[0].id;assert.throws(()=>validatePayload({world:w}),/repetido/);
});
test('save slots are independent and preserve a recoverable previous generation',async()=>{
 const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
 const w=createCareer({seed:4,manager:'Primero'});await saveSlot(1,w);w.manager='Segundo';await saveSlot(1,w);await saveSlot(2,createCareer({seed:5,manager:'Otra carrera'}));assert.equal((await loadSlot(1)).world.manager,'Segundo');assert.equal((await loadSlot(1,{backup:true})).world.manager,'Primero');assert.equal((await loadSlot(2)).world.manager,'Otra carrera');assert.equal((await listSlots()).filter(s=>s.exists).length,2);
 const record=JSON.parse(memory.get('super-soccer-save-1'));record.current.checksum='broken';memory.set('super-soccer-save-1',JSON.stringify(record));const recovered=await loadSlot(1);assert.ok(recovered.recovered);assert.equal(recovered.world.manager,'Primero');
});
test('a mid-season transfer preserves season and career statistics',()=>{
 const w=createCareer({seed:42});advance(w);const source=teamById(w,'en-1'),own=teamById(w,w.userTeam),p=source.roster[4];const season=structuredClone(p.stats),career=structuredClone(p.career);own.budget=1_000_000_000;buyPlayer(w,p.id);assert.deepEqual(p.stats,season);assert.deepEqual(p.career,career);
});

test('fallback storage keeps the newest career when the previous generation exceeds quota',async()=>{
 const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,removeItem:k=>memory.delete(k),setItem:(k,v)=>{if(JSON.parse(v).backup)throw new Error('quota');memory.set(k,v);}};
 const w=createCareer({seed:91,manager:'Antes'});await saveSlot(1,w);w.manager='Después';const meta=await saveSlot(1,w);assert.equal(meta.backend,'localStorage-single');assert.equal((await loadSlot(1)).world.manager,'Después');assert.equal((await listSlots())[0].hasBackup,false);
});
test('a player whose contract expires ages once at the turn of the season',()=>{
 const w=createCareer({seed:12,mode:'league'}),own=teamById(w,w.userTeam),p=own.roster.find(p=>p.age<30),old=p.age;p.contract=1;w.seasonComplete=true;nextSeason(w);assert.equal(p.age,old+1);assert.ok(w.freeAgents.includes(p));
});
