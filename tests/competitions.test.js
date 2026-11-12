import test from 'node:test';import assert from 'node:assert/strict';
import {roundRobin,knockoutPairs,standings} from '../src/competitions.js';
import {random} from '../src/utils.js';
import {createCareer,advance,nextSeason,nextFixture} from '../src/career.js';
import {validatePayload} from '../src/storage.js';

test('round robin has exactly one home and away fixture per opponent and no duplicate within a round',()=>{
 for(const n of [7,8,18,20]){const ids=Array.from({length:n},(_,i)=>'t'+i),rounds=roundRobin(ids),pairs=new Map();
  for(const round of rounds){const seen=new Set();for(const [a,b]of round){assert.notEqual(a,b);assert.ok(!seen.has(a)&&!seen.has(b));seen.add(a);seen.add(b);pairs.set(`${a}:${b}`,(pairs.get(`${a}:${b}`)??0)+1);}}
  assert.equal([...pairs.values()].reduce((a,b)=>a+b,0),n*(n-1));assert.ok([...pairs.values()].every(n=>n===1));
 }
});
test('cup draws handle non-power-of-two fields without losing or repeating clubs',()=>{
 for(const n of [8,16,26,28,32]){const ids=Array.from({length:n},(_,i)=>'t'+i),pairs=knockoutPairs(ids,random(42)),flat=pairs.flat().filter(Boolean);assert.equal(flat.length,n);assert.equal(new Set(flat).size,n);assert.ok(pairs.every(([a])=>a));}
});
test('a complete European season awards every trophy and records valid tables',()=>{
 const w=createCareer({seed:1234,teamId:'es-2'});const snapshots=JSON.stringify(w);
 while(!w.seasonComplete)advance(w);
 assert.equal(w.events.length,54);assert.equal(w.competitions.length,31);assert.equal(w.competitions.filter(c=>c.winner).length,31);assert.ok(w.fixtures.every(f=>f.score));
 for(const c of w.competitions.filter(c=>c.kind==='league')){const rows=standings(w,c.id);assert.ok(rows.every(r=>r.p===2*(c.teamIds.length-1)));assert.equal(rows.reduce((n,r)=>n+r.gf,0),rows.reduce((n,r)=>n+r.ga,0));assert.ok(rows.every(r=>r.pts===r.w*3+r.d));}
 validatePayload({world:w});assert.notEqual(JSON.stringify(w),snapshots);
 const previous=w.history.at(-1);nextSeason(w);assert.equal(w.season,2027);
 for(const country of ['es','en','de','it','fr','pt','nl']){for(const row of previous.tables[`${country}-1`].slice(-2))assert.equal(w.teams.find(t=>t.id===row.id).division,2);for(const row of previous.tables[`${country}-2`].slice(0,2))assert.equal(w.teams.find(t=>t.id===row.id).division,1);}
 validatePayload({world:w});
});
test('five seasons preserve unique players, valid rosters and league sizes',()=>{
 const w=createCareer({seed:717,teamId:'en-1'});const counts=new Map(['es','en','de','it','fr','pt','nl'].map(c=>[c,w.teams.filter(t=>t.country===c&&t.division===1).length]));
 for(let year=0;year<5;year++){while(!w.seasonComplete)advance(w);nextSeason(w);validatePayload({world:w});const ids=w.teams.flatMap(t=>t.roster.map(p=>p.id)).concat(w.freeAgents.map(p=>p.id));assert.equal(ids.length,new Set(ids).size);for(const [c,n]of counts)assert.equal(w.teams.filter(t=>t.country===c&&t.division===1).length,n);}
 assert.equal(w.history.length,5);assert.equal(w.season,2031);
});
test('eight-team league and cup finish and can start another season',()=>{
 for(const mode of ['league','cup']){const w=createCareer({seed:9,mode});let n=0;while(!w.seasonComplete&&n++<20)advance(w);assert.ok(w.seasonComplete);assert.ok(w.competitions[0].winner);assert.equal(n,mode==='league'?14:3);nextSeason(w);assert.ok(nextFixture(w));validatePayload({world:w});}
});
