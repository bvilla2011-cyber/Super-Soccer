import test from 'node:test';
import assert from 'node:assert/strict';
import {createCareer,advance,nextSeason,transferPrice} from '../src/career.js';
import {teamById} from '../src/data.js';
import {submitOffer,advanceDay,signOffer} from '../src/negotiations.js';
import {exportSave,importSave} from '../src/storage.js';

test('offers wait for a response, survive export and only transfer after signing',()=>{
 let w=createCareer({seed:42,mode:'league'}),own=teamById(w,w.userTeam),source=teamById(w,'en-1'),p=source.roster[8];
 const fee=transferPrice(p,source,own),offer=submitOffer(w,p.id,fee);
 assert.equal(offer.status,'pending');assert.ok(source.roster.some(q=>q.id===p.id));
 advanceDay(w);assert.equal(offer.status,'pending');w=importSave(exportSave(w)).world;
 advanceDay(w);const restored=w.offers[0];assert.equal(restored.status,'accepted');assert.equal(restored.unread,true);
 const before=teamById(w,w.userTeam).budget;signOffer(w,restored.id);assert.equal(teamById(w,w.userTeam).budget,before-fee);assert.ok(teamById(w,w.userTeam).roster.some(q=>q.id===p.id));assert.throws(()=>signOffer(w,restored.id));
});
test('rejected offers can be increased and loans return at the end of the season',()=>{
 const w=createCareer({seed:41,mode:'league'}),own=teamById(w,w.userTeam),source=teamById(w,'en-1'),p=source.roster[8];
 const rejected=submitOffer(w,p.id,0,'loan');advanceDay(w);advanceDay(w);assert.equal(rejected.status,'rejected');
 const accepted=submitOffer(w,p.id,rejected.counter,'loan');advanceDay(w);advanceDay(w);assert.equal(accepted.status,'accepted');signOffer(w,accepted.id);assert.ok(own.roster.some(q=>q.id===p.id));
 while(!w.seasonComplete)advance(w);nextSeason(w);assert.ok(source.roster.some(q=>q.id===p.id));assert.ok(!own.roster.some(q=>q.id===p.id));
});

test('a counteroffer replaces the rejected proposal and waits again',()=>{
 const w=createCareer({seed:17});const own=teamById(w,w.userTeam),source=teamById(w,'en-1'),p=source.roster[5];own.budget=1e9;
 const first=submitOffer(w,p.id,0);advanceDay(w);advanceDay(w);assert.equal(first.status,'rejected');const second=submitOffer(w,p.id,first.counter);assert.equal(first.status,'replaced');assert.equal(second.status,'pending');assert.equal(source.roster.includes(p),true);advanceDay(w);advanceDay(w);assert.equal(second.status,'accepted');
});
