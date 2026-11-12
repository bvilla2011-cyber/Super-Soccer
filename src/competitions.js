import { shuffle } from './utils.js';

export function roundRobin(ids, homeAndAway = true) {
  const rotation = [...ids]; if (rotation.length % 2) rotation.push(null);
  const rounds = [];
  for(let r=0;r<rotation.length-1;r++) {
    const games=[];
    for(let i=0;i<rotation.length/2;i++) {
      let a=rotation[i],b=rotation[rotation.length-1-i];
      if((r+i)%2) [a,b]=[b,a];
      if(a&&b) games.push([a,b]);
    }
    rounds.push(games); rotation.splice(1,0,rotation.pop());
  }
  return homeAndAway ? [...rounds,...rounds.map(r=>r.map(([a,b])=>[b,a]))] : rounds;
}

export function standings(world, competitionId, group = null) {
  const comp=world.competitions.find(c=>c.id===competitionId);
  if(!comp) return [];
  const ids=group===null ? comp.teamIds : comp.groups[group];
  const rows=new Map(ids.map(id=>[id,{id,p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0,form:[]}]));
  for(const f of world.fixtures) {
    if(f.competition!==competitionId||!f.score||f.bye||f.stage==='knockout'||(group!==null&&f.group!==group)) continue;
    const a=rows.get(f.home),b=rows.get(f.away); if(!a||!b) continue;
    const [h,v]=f.score; a.p++; b.p++; a.gf+=h;a.ga+=v;b.gf+=v;b.ga+=h;
    if(h>v) {a.w++;b.l++;a.pts+=3;a.form.push('V');b.form.push('D');}
    else if(v>h) {b.w++;a.l++;b.pts+=3;b.form.push('V');a.form.push('D');}
    else {a.d++;b.d++;a.pts++;b.pts++;a.form.push('E');b.form.push('E');}
  }
  return [...rows.values()].map(r=>({...r,gd:r.gf-r.ga,form:r.form.slice(-5)})).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||a.id.localeCompare(b.id));
}

export function knockoutPairs(ids,rng) {
  const teams=shuffle(ids.filter(Boolean),rng); let slots=2;
  while(slots<teams.length) slots*=2;
  const byes=slots-teams.length;
  const pairs=[]; for(let i=0;i<byes;i++) pairs.push([teams.shift(),null]);
  while(teams.length) pairs.push([teams.shift(),teams.shift()]);
  return shuffle(pairs,rng);
}
export const knockoutLabel = n => ({1:'Final',2:'Semifinales',4:'Cuartos de final',8:'Octavos de final',16:'Dieciseisavos'})[n] ?? 'Eliminatoria';
