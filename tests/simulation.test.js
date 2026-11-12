import test from 'node:test';import assert from 'node:assert/strict';
import {random,clone} from '../src/utils.js';import {createCareer,advance,nextFixture} from '../src/career.js';
import {teamById,overall} from '../src/data.js';import {strength,simulateMatch,penaltySeries} from '../src/simulation.js';
import {MatchSimulation,matchSeed} from '../src/match.js';import {makeEnvelope,unpack} from '../src/storage.js';
const setup=()=>{const w=createCareer({seed:321});const f=nextFixture(w);return {w,f,home:teamById(w,f.home),away:teamById(w,f.away)};};
function play(g,dt=1/30){let steps=0;while(g.state!=='FullTime'&&steps++<100000){g.update(dt);if(g.state==='HalfTime')g.continueSecondHalf();}assert.equal(g.state,'FullTime');return g.result();}

test('simulations are deterministic with coherent goal, assist and shot totals',()=>{
 const {home,away}=setup();for(let seed=0;seed<80;seed++){const result=simulateMatch(home,away,random(seed),{knockout:true});assert.deepEqual(result,simulateMatch(home,away,random(seed),{knockout:true}));assert.ok(result.winner);assert.equal(result.events.filter(e=>e.type==='goal').length,result.score[0]+result.score[1]);assert.equal(Object.values(result.players).reduce((s,p)=>s+p.goals,0),result.score[0]+result.score[1]);for(let i=0;i<2;i++)assert.ok(result.stats.shots[i]>=result.score[i]);}
});
test('fatigue and missing players affect the statistical strength',()=>{
 const {home}=setup(),rested=strength(home);for(const p of home.roster)p.fitness=20;const tired=strength(home);assert.ok(rested.attack>tired.attack&&rested.defense>tired.defense);for(const p of home.roster)p.ban=2;assert.ok(strength(home).attack<tired.attack);
});
test('penalty series terminates with a unique winner and a reproducible kick sequence',()=>{
 const {home,away}=setup();for(let i=0;i<100;i++){const s=penaltySeries(home,away,random(i));assert.notEqual(...s.score);assert.equal(s.score[0],s.kicks.filter(k=>k.side===0&&k.goal).length);assert.equal(s.score[1],s.kicks.filter(k=>k.side===1&&k.goal).length);assert.ok(s.kicks.length<=42);}
});
test('animated director reveals the calculated goals, ends once and commits once',()=>{
 const {w,f,home,away}=setup();let ends=0;const g=new MatchSimulation({home,away,fixtureId:f.id,seed:matchSeed(w,f.id),duration:120,knockout:true,onEnd:()=>ends++});const result=play(g);assert.equal(ends,1);assert.deepEqual(g.score,result.score);for(let i=0;i<20;i++)g.update(.05);assert.equal(ends,1);advance(w,result);assert.equal(w.managerStats.matches,1);assert.equal(w.eventIndex,1);assert.throws(()=>advance(w,result),/corresponde/);
});
test('saving during an animation resumes at the same frame and produces the same match result',()=>{
 const {w,f,home,away}=setup(),opts={home,away,fixtureId:f.id,seed:5,duration:120,knockout:true};const original=new MatchSimulation(opts);
 for(let i=0;i<1500;i++)original.update(1/30);
 const match={fixtureId:f.id,snapshot:original.serialize()};const restoredPayload=unpack(makeEnvelope(w,match));const resumed=new MatchSimulation({...opts,snapshot:restoredPayload.match.snapshot});assert.equal(resumed.clock,original.clock);assert.equal(resumed.state,original.state);assert.ok(resumed.paused);resumed.paused=false;
 assert.deepEqual(play(resumed),play(original));
});
test('watch speed and frame rate do not change statistical results',()=>{
 const {home,away,f}=setup();const opts={home,away,fixtureId:f.id,seed:100,duration:120,knockout:true};const normal=new MatchSimulation(opts),fast=new MatchSimulation(opts);fast.setSpeed(8);assert.deepEqual(play(normal,1/60),play(fast,1/24));
});
test('halftime lineup changes are used to calculate the second period',()=>{
 const {home,away,f}=setup();const g=new MatchSimulation({home,away,fixtureId:f.id,seed:27,duration:120});while(g.state!=='HalfTime')g.update(.05);
 const replacement=clone(home);replacement.lineup=replacement.roster.slice(5,10).map(p=>p.id);g.teams[0]=replacement;g.continueSecondHalf();const selected=Object.keys(g.secondHalf.players);assert.ok(selected.includes(replacement.roster[5].id));assert.ok(!selected.includes(home.roster[0].id));
});
test('overall is independent of JSON attribute key ordering',()=>{const {home}=setup();const p=home.roster[0],copy=clone(p);copy.attributes=Object.fromEntries(Object.entries(copy.attributes).reverse());assert.equal(overall(p),overall(copy));});
test('a red card keeps the team short-handed after halftime',()=>{
 const {home,away,f}=setup(),g=new MatchSimulation({home,away,fixtureId:f.id,seed:1,duration:120});
 const sentOff=g.players.find(p=>p.side===0&&!p.keeper);g.firstHalf.players[sentOff.id].red=1;g.state='HalfTime';g.continueSecondHalf();
 assert.equal(g.players.filter(p=>p.side===0).length,4);assert.equal(g.players.filter(p=>p.side===1).length,5);assert.ok(!g.secondHalf.players[sentOff.id]);
});
