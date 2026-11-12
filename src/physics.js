import { clamp } from './utils.js';
export const PITCH={width:1050,height:660,goalTop:247,goalBottom:413,goalDepth:36,box:165,boxTop:165,boxBottom:495};
export function normalize(x,y) {const length=Math.hypot(x,y);return length>1e-6?{x:x/length,y:y/length}:{x:0,y:0};}
export function moveCircle(body,dt) {body.x+=body.vx*dt;body.y+=body.vy*dt;}
export function separateCircles(a,b,restitution=.3) {
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),minimum=a.radius+b.radius;
  if(d>=minimum)return false;
  const nx=d>.0001?dx/d:1,ny=d>.0001?dy/d:0,overlap=minimum-d;
  a.x-=nx*overlap*.5;a.y-=ny*overlap*.5;b.x+=nx*overlap*.5;b.y+=ny*overlap*.5;
  const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
  if(relative<0) {const impulse=-(1+restitution)*relative*.5;a.vx-=nx*impulse;a.vy-=ny*impulse;b.vx+=nx*impulse;b.vy+=ny*impulse;}
  return true;
}
export function reflectBall(ball,nx,ny,restitution=.78) {
  const speed=ball.vx*nx+ball.vy*ny;
  if(speed<0){ball.vx-=(1+restitution)*speed*nx;ball.vy-=(1+restitution)*speed*ny;}
}
export function integrateBall(ball,dt) {
  ball.previousX=ball.x;ball.previousY=ball.y;
  moveCircle(ball,dt);ball.spin=(ball.spin??0)+Math.hypot(ball.vx,ball.vy)*dt*.04;
  const friction=Math.exp(-(ball.z>2?.12:.83)*dt);ball.vx*=friction;ball.vy*=friction;
  ball.vz=(ball.vz??0)-240*dt;ball.z=Math.max(0,(ball.z??0)+ball.vz*dt);
  if(ball.z===0&&ball.vz<0)ball.vz=Math.abs(ball.vz)>35?-ball.vz*.34:0;
  if(Math.hypot(ball.vx,ball.vy)<2){ball.vx=0;ball.vy=0;}
}
export function collidePosts(ball) {
  let hit=false;
  for(const x of [0,PITCH.width])for(const y of [PITCH.goalTop,PITCH.goalBottom]) {
    const dx=ball.x-x,dy=ball.y-y,d=Math.hypot(dx,dy),r=ball.radius+5;
    if(d<r) {const nx=d>.001?dx/d:(x===0?1:-1),ny=d>.001?dy/d:0;ball.x=x+nx*r;ball.y=y+ny*r;reflectBall(ball,nx,ny,.82);hit=true;}
  }
  return hit;
}
// Whole-ball goal-line crossing; interpolate the crossing to avoid diagonal ghost goals.
export function boundaryEvent(ball) {
  const r=ball.radius;
  if(ball.y < -r || ball.y > PITCH.height+r)return {type:'throw',x:clamp(ball.x,25,PITCH.width-25),y:ball.y<0?8:PITCH.height-8};
  if(ball.x < -r || ball.x>PITCH.width+r) {
    const left=ball.x<0,plane=left?-r:PITCH.width+r;
    const dx=ball.x-(ball.previousX??ball.x);
    const t=dx?clamp((plane-(ball.previousX??ball.x))/dx,0,1):1;
    const y=(ball.previousY??ball.y)+(ball.y-(ball.previousY??ball.y))*t;
    if(y>PITCH.goalTop+r&&y<PITCH.goalBottom-r&&(ball.z??0)<70)return {type:'goal',left};
    return {type:'goalLine',left,y:ball.y};
  }
  return null;
}
