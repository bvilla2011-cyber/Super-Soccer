import { activePlayers, FORMATIONS, formationCoordinates } from './data.js';
import { PITCH } from './physics.js';
import { clone } from './utils.js';
export const attackDirection=(side,half)=>((side===0?1:-1)*(half===1?1:-1));
export function createPlayers(team,side,half=1) {
  const squad=activePlayers(team),bases=formationCoordinates(team,squad);
  return squad.map((p,index)=>{
    const base=bases[index]??(FORMATIONS[team.formation]??FORMATIONS['4-4-2']).bases[index];const direction=attackDirection(side,half);
    return {id:p.id,name:p.name,number:p.number,position:p.position,attributes:clone(p.attributes),skin:p.skin,hair:p.hair,fitness:p.fitness,side,index,base:[...base],x:(direction===1?base[0]:1-base[0])*PITCH.width,y:base[1]*PITCH.height,vx:0,vy:0,radius:10.5,headingX:direction,headingY:0,aiState:'Posición',aiTimer:index*.11,tackleTimer:.8,energy:100,kick:0,fall:0,celebrate:0,actionPose:null,red:false,yellows:0,keeper:p.position==='POR'};
  });
}
export function createBall() {return {x:PITCH.width/2,y:PITCH.height/2,previousX:PITCH.width/2,previousY:PITCH.height/2,vx:0,vy:0,z:0,vz:0,radius:6,owner:null,lastTouch:null,lastSide:0,spin:0,pickupCooldown:0};}
export function positionPlayers(players,half) {
  for(const p of players) {
    const dir=attackDirection(p.side,half);p.x=(dir===1?p.base[0]:1-p.base[0])*PITCH.width;p.y=p.base[1]*PITCH.height;p.vx=0;p.vy=0;p.headingX=dir;p.headingY=0;
  }
}
