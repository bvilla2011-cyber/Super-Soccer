// Original procedural sound design. No samples, tracking, downloads or third-party music.
export class Audio {
  constructor(settings){this.settings=settings;this.ctx=null;this.ambient=null;this.musicTimer=null;}
  async unlock(){
    try{if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);}await this.ctx.resume();this.master.gain.value=this.settings.volume;if(this.settings.music)this.startMusic();}catch(e){}
  }
  configure(settings){this.settings=settings;if(this.master)this.master.gain.value=settings.volume;if(!settings.music)this.stopMusic();else if(this.ctx)this.startMusic();if(!settings.sound)this.stopCrowd();}
  tone(freq,duration=.1,type='sine',volume=.12,delay=0,endFreq=null) {
    if(!this.ctx||!this.settings.sound)return;
    const t=this.ctx.currentTime+delay,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,t);if(endFreq)osc.frequency.exponentialRampToValueAtTime(endFreq,t+duration);gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(volume,t+.008);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain);gain.connect(this.master);osc.start(t);osc.stop(t+duration+.02);
  }
  play(type) {
    if(type==='kick')this.tone(95,.09,'triangle',.1,0,45);
    if(type==='post'){this.tone(650,.2,'triangle',.14);this.tone(980,.15,'sine',.08);}
    if(type==='whistle'){this.tone(2400,.17,'sine',.055);this.tone(2200,.22,'sine',.05,.22);}
    if(type==='goal'){[392,494,587,784].forEach((f,i)=>this.tone(f,.55,'triangle',.13,i*.12));this.noise(.8,.12);}
    if(type==='click')this.tone(420,.045,'sine',.035);
    if(type==='trophy')[523,659,784,1047].forEach((f,i)=>this.tone(f,.7,'triangle',.13,i*.17));
  }
  noise(duration,volume){
    if(!this.ctx||!this.settings.sound)return;
    const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*duration,this.ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.sin(i/data.length*Math.PI);
    const source=this.ctx.createBufferSource(),gain=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=750;gain.gain.value=volume;source.connect(filter);filter.connect(gain);gain.connect(this.master);source.start();
  }
  startCrowd(){
    if(!this.ctx||!this.settings.sound||this.ambient)return;
    const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate),d=buffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const source=this.ctx.createBufferSource(),gain=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=480;gain.gain.value=.035;source.connect(filter);filter.connect(gain);gain.connect(this.master);source.start();this.ambient={source,gain};
  }
  stopCrowd(){if(this.ambient){this.ambient.source.stop();this.ambient=null;}}
  startMusic(){
    if(this.musicTimer||!this.ctx)return;let bar=0;
    const play=()=>{if(!this.settings.music||!this.settings.sound)return;const chords=[[196,246.94,293.66],[164.81,196,246.94],[174.61,220,261.63],[146.83,196,220]];chords[bar++%4].forEach((f,i)=>this.tone(f,1.7,'sine',.018,i*.12));};play();this.musicTimer=setInterval(play,2400);
  }
  stopMusic(){if(this.musicTimer)clearInterval(this.musicTimer);this.musicTimer=null;}
}
