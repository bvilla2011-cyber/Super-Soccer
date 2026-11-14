import { clamp, lerp } from './utils.js';
import { PITCH } from './physics.js';

const SKINS=['#f2c19b','#dca16e','#b8784d','#875236','#5d362a'];
const HAIR=['#2d2421','#593d2e','#b58a52','#1d2026','#aa6544','#c0b7a2'];
export class Renderer {
  constructor(canvas,settings){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.settings=settings;this.camera={x:525,y:330,zoom:1};this.particles=Array.from({length:120},()=>({life:0}));this.sortedPlayers=[];this.playerSort=(a,b)=>a.y-b.y;this.width=1;this.height=1;this.staticPitch=this.makePitch();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);this.resize();}
  resize(){const r=this.canvas.getBoundingClientRect();this.width=Math.max(1,r.width);this.height=Math.max(1,r.height);this.dpr=Math.min(window.devicePixelRatio||1,this.settings.quality==='low'?1:1.5);this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);}
  makePitch(){
    const c=document.createElement('canvas');c.width=1270;c.height=860;const ctx=c.getContext('2d');ctx.translate(110,100);
    ctx.fillStyle='#0b2027';ctx.fillRect(-110,-100,1270,860);
    for(let row=0;row<6;row++) {
      const y=-82+row*9;ctx.fillStyle=row%2?'#1b343b':'#203d42';ctx.fillRect(-78,y,1206,7);ctx.fillRect(-78,660-y-2,1206,7);
      for(let i=0;i<144;i++){ctx.fillStyle=['#61716c','#3f7979','#b0ac86','#2d4d58','#a26c5e'][(i*17+row*7)%5];ctx.globalAlpha=.65;ctx.fillRect(-66+i*8.2,y+1,4,3);ctx.fillRect(-66+i*8.2,660-y,4,3);ctx.globalAlpha=1;}
    }
    ctx.fillStyle='#153b38';ctx.fillRect(-36,-30,1122,720);
    ctx.strokeStyle='#426356';ctx.lineWidth=1;ctx.strokeRect(-30,-26,1110,712);
    for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#237d61':'#278568';ctx.fillRect(i*87.5,0,87.5,660);}
    const shade=ctx.createLinearGradient(0,0,1050,660);shade.addColorStop(0,'#c4ead309');shade.addColorStop(.7,'#001b2010');shade.addColorStop(1,'#031a302e');ctx.fillStyle=shade;ctx.fillRect(0,0,1050,660);
    ctx.strokeStyle='#dbe9cbb0';ctx.lineWidth=2.2;ctx.strokeRect(0,0,1050,660);ctx.beginPath();ctx.moveTo(525,0);ctx.lineTo(525,660);ctx.stroke();
    ctx.beginPath();ctx.arc(525,330,89,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#dbe9cb';ctx.beginPath();ctx.arc(525,330,3,0,Math.PI*2);ctx.fill();
    for(const side of [0,1]) {
      ctx.save();if(side){ctx.translate(1050,0);ctx.scale(-1,1);}
      ctx.strokeRect(0,165,165,330);ctx.strokeRect(0,250,55,160);ctx.beginPath();ctx.arc(110,330,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(110,330,89,-.94,.94);ctx.stroke();
      for(const y of [0,660]){ctx.beginPath();ctx.arc(0,y,14,y?Math.PI*1.5:0,y?Math.PI*2:Math.PI*.5);ctx.stroke();}
      ctx.restore();
    }
    ctx.fillStyle='#d9e9c420';ctx.font='900 49px Arial';ctx.textAlign='center';ctx.fillText('SUPER SOCCER',525,615);
    const ads=['TU CLUB. TU HISTORIA.','SUPER / SOCCER','EL FÚTBOL CONTINÚA','SIMULA LA GLORIA'];
    for(let i=0;i<8;i++){const x=2+i*132;ctx.fillStyle=i%2?'#cbea78':'#173840';ctx.fillRect(x,-24,127,15);ctx.fillStyle=i%2?'#173038':'#d1d9bc';ctx.font='bold 7px Arial';ctx.fillText(ads[i%4],x+63,-14);ctx.fillRect(x,674,127,15);}
    return c;
  }
  goalParticles(side){if(this.settings.reducedMotion)return;let count=0;for(const p of this.particles)if(p.life<=0&&count++<65){p.life=1.7+Math.random();p.x=side?950:100;p.y=100+Math.random()*460;p.vx=(Math.random()-.5)*200;p.vy=-70-Math.random()*100;p.color=['#d4f56a','#e5efe4','#f49b7a'][count%3];}}
  draw(game,dt){
    const ctx=this.ctx,w=this.width,h=this.height;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle='#0a1d24';ctx.fillRect(0,0,w,h);
    const action=game.state==='Action'&&game.activeAction;
    const zoom=this.settings.reducedMotion?1:action?1.075:1;
    this.camera.zoom=lerp(this.camera.zoom,zoom,Math.min(1,dt*2.8));
    this.camera.x=lerp(this.camera.x,this.settings.reducedMotion?525:525+(game.ball.x-525)*.12,Math.min(1,dt*2));
    this.camera.y=lerp(this.camera.y,this.settings.reducedMotion?330:330+(game.ball.y-330)*.07,Math.min(1,dt*2));
    const scale=Math.min(w/1230,h/840)*this.camera.zoom;this.scale=scale;
    this.offset={x:w/2-this.camera.x*scale,y:h/2-this.camera.y*scale};
    ctx.save();ctx.translate(this.offset.x,this.offset.y);ctx.scale(scale,scale);ctx.drawImage(this.staticPitch,-110,-100);
    this.drawGoals(ctx,game,false);
    const sorted=this.sortedPlayers;sorted.length=0;for(const p of game.players)if(!p.red)sorted.push(p);sorted.sort(this.playerSort);
    for(const p of sorted)this.drawPlayer(ctx,p,game.teams[p.side].colors,game.elapsed);
    this.drawReferee(ctx,game);
    if(!this.settings.reducedMotion&&game.state==='Action'&&game.activeAction){
      const ball=game.ball,pulse=.6+.4*Math.sin(game.elapsed*14);
      ctx.save();ctx.globalAlpha=.35*pulse;ctx.strokeStyle=['goal','save','wide','post'].includes(game.activeAction.event.type)?'#ffe25b':'#65eee6';ctx.lineWidth=4;
      for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(ball.x,ball.y-ball.z-5,13+i*7+pulse*3,0,Math.PI*2);ctx.stroke();}
      ctx.restore();
    }
    if(!this.settings.reducedMotion&&game.state==='Action'&&game.stateTime>3.8&&game.stateTime<4.45){ctx.save();ctx.globalAlpha=.35;ctx.strokeStyle='#fff2a8';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(game.ball.x-(game.activeAction?.dir??1)*24,game.ball.y-game.ball.z-5);ctx.lineTo(game.ball.x,game.ball.y-game.ball.z-5);ctx.stroke();ctx.restore();}
    this.drawBall(ctx,game.ball);
    this.drawGoals(ctx,game,true);
    for(const p of this.particles)if(p.life>0){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=130*dt;ctx.globalAlpha=clamp(p.life,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,5,3);ctx.globalAlpha=1;}
    ctx.restore();
    if(game.banner?.time>0&&game.state!=='HalfTime'&&game.state!=='FullTime')this.drawBanner(ctx,game,w,h);
    const shade=ctx.createLinearGradient(0,h-70,0,h);shade.addColorStop(0,'#091d2300');shade.addColorStop(1,'#091d23a0');ctx.fillStyle=shade;ctx.fillRect(0,h-70,w,70);
  }
  drawPlayer(ctx,p,colors,time){
    ctx.save();ctx.translate(p.x,p.y);const moving=Math.hypot(p.vx,p.vy)>12,run=moving?Math.sin(time*13+p.index*1.7):Math.sin(time*2+p.index)*.1;const celebrate=p.celebrate>0;
    if(this.settings.quality!=='low'){ctx.fillStyle='#082b2d50';ctx.beginPath();ctx.ellipse(4,4,14,6,0,0,Math.PI*2);ctx.fill();}
    if(p.fall>0){ctx.rotate(Math.PI*.35);ctx.scale(1,.65);}
    if(p.kick>0&&!this.settings.reducedMotion){ctx.strokeStyle='#fff598';ctx.globalAlpha=.8;ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(10,-7-i*5);ctx.lineTo(18+i*4,-10-i*6);ctx.stroke();}ctx.globalAlpha=1;}
    if(celebrate){ctx.translate(0,-Math.abs(Math.sin(time*7+p.index))*7);ctx.rotate(Math.sin(time*5+p.index)*.1);}
    const skin=SKINS[p.skin%5],hair=HAIR[p.hair%6],shirt=p.keeper?'#f0bd56':colors[0],trim=p.keeper?'#193b38':colors[1];
    const pose=p.celebrationStyle??0,leftHand=celebrate?(pose===1?-23:pose===2?-32:-31):-8+run*3,rightHand=celebrate?(pose===1?-23:pose===2?-9:-31):-8-run*3,leftArm=celebrate?(pose===1?-21:-13):-12,rightArm=celebrate?(pose===1?21:13):12;
    ctx.strokeStyle=skin;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-7,-18);ctx.lineTo(leftArm,leftHand);ctx.moveTo(7,-18);ctx.lineTo(rightArm,rightHand);ctx.stroke();
    ctx.strokeStyle=trim;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-4,-6);ctx.lineTo(-4-run*3,2+run*3);ctx.moveTo(4,-6);ctx.lineTo(4+run*3+(p.kick>0?10:0),2-run*3-(p.kick>0?5:0));ctx.stroke();
    ctx.strokeStyle='#15242a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-7-run*3,4+run*3);ctx.lineTo(-1-run*3,4+run*3);ctx.moveTo(2+run*3+(p.kick>0?10:0),4-run*3-(p.kick>0?5:0));ctx.lineTo(8+run*3+(p.kick>0?10:0),4-run*3-(p.kick>0?5:0));ctx.stroke();
    ctx.fillStyle=shirt;ctx.beginPath();ctx.moveTo(-8,-22);ctx.lineTo(8,-22);ctx.lineTo(9,-7);ctx.lineTo(-9,-7);ctx.closePath();ctx.fill();ctx.fillStyle=trim;ctx.fillRect(-7,-23,14,3);ctx.fillStyle='#fff';ctx.font='bold 8px Arial';ctx.textAlign='center';ctx.fillText(p.number,0,-11);
    ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(0,-29,7.6,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=hair;ctx.beginPath();ctx.ellipse(-.4,-33,8,5,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-8,-33,3,5);ctx.fillStyle='#32271f';ctx.fillRect(p.headingX>0?4:-5,-29,1.5,1.5);
    if(p.yellows){ctx.fillStyle='#f5cf54';ctx.fillRect(10,-29,4,6);}
    ctx.restore();
  }
  drawBall(ctx,b){
    ctx.save();ctx.translate(b.x,b.y);ctx.fillStyle='#08262c55';ctx.beginPath();ctx.ellipse(2,3,7+b.z*.02,4,0,0,Math.PI*2);ctx.fill();ctx.translate(0,-b.z-5);ctx.rotate(b.spin);ctx.fillStyle='#f6f4df';ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#293e45';ctx.beginPath();for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ctx.lineTo(Math.cos(a)*2.7,Math.sin(a)*2.7);}ctx.closePath();ctx.fill();for(let i=0;i<3;i++){const a=i/3*Math.PI*2;ctx.fillRect(Math.cos(a)*4.3-1,Math.sin(a)*4.3-1,2,2);}ctx.restore();
  }
  drawGoals(ctx,game,front){
    for(const side of [0,1]){ctx.save();ctx.translate(side?1050:0,247);if(side)ctx.scale(-1,1);const wave=game.activeAction?.event.type==='goal'&&game.activeAction.marked?Math.sin(game.stateTime*20)*2:0;
      if(!front){ctx.fillStyle='#cfddcf12';ctx.fillRect(-36,0,36,166);ctx.strokeStyle='#b8d4cb50';ctx.lineWidth=1;for(let i=0;i<=6;i++){ctx.beginPath();ctx.moveTo(-36+i*6,0);ctx.lineTo(-36+i*6+wave,166);ctx.stroke();}for(let j=0;j<=16;j++){ctx.beginPath();ctx.moveTo(-36,j*10);ctx.lineTo(0,j*10);ctx.stroke();}ctx.strokeRect(-36,0,36,166);}
      else{ctx.strokeStyle='#e3ece4';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-4,-9);ctx.lineTo(-4,157);ctx.lineTo(0,166);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-4,-9);ctx.lineTo(-36,-9);ctx.lineTo(-36,157);ctx.lineTo(-4,157);ctx.stroke();}
      ctx.restore();}
  }
  drawReferee(ctx,game){const action=game.activeAction,card=action&&['yellow','red'].includes(action.event.type),incident=action&&['foul','yellow','red','injury'].includes(action.event.type)?game.players.find(player=>player.id===action.event.player):null,approach=incident?clamp(game.stateTime/1.5,0,1):0;const p={x:incident?lerp(525,incident.x-24,approach):525+Math.sin(game.elapsed*.13)*150,y:incident?lerp(500,incident.y+12,approach):500+Math.cos(game.elapsed*.16)*40,vx:30,vy:10,index:15,number:'',skin:2,hair:3,headingX:1,keeper:false,kick:0,fall:0,celebrate:0,yellows:0};this.drawPlayer(ctx,p,['#e8ac50','#182d33'],game.elapsed);if(card&&game.stateTime>1.5){ctx.fillStyle=action.event.type==='red'?'#ee665b':'#e8d55d';ctx.fillRect(p.x+11,p.y-42,9,14);}}
  drawBanner(ctx,game,w,h){
    const title=game.banner.title,subtitle=game.banner.subtitle;const big=title.includes('GOOO')||game.state==='Shootout';ctx.save();ctx.textAlign='center';const boxW=Math.min(w-40,big?510:440),x=(w-boxW)/2,y=h-116;ctx.fillStyle='#09232aeb';ctx.fillRect(x,y,boxW,70);ctx.fillStyle=big?'#d7f77b':'#dfe9d5';ctx.fillRect(x,y,3,70);ctx.font=`900 ${big?27:16}px Arial`;ctx.fillText(title,w/2,y+29);ctx.font='12px Arial';ctx.fillStyle='#b2c4bb';ctx.fillText(subtitle.length>64?subtitle.slice(0,62)+'…':subtitle,w/2,y+51);ctx.restore();
  }
  destroy(){this.resizeObserver.disconnect();}
}

