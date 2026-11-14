from PIL import Image,ImageDraw
from pathlib import Path
import json,math,subprocess,random
root=Path('marketing'); assets=root/'assets'; vids=root/'videos'
manifest=json.loads((root/'manifest.json').read_text())
kind_by_id={'01-ventana':'window','02-sin-instalar':'cursor','03-super-soccer':'pitch','04-cinco':'players','05-descanso':'board','06-ritmo':'speed','07-universo':'universe','08-carrera':'career','09-guardados':'save','10-hero':'hero'}
for item in manifest:
 slug=item['id']; base=Image.open(assets/f'{slug}.png').convert('RGB'); kind=kind_by_id[slug]
 wav=vids/f'{slug}.wav'; music=vids/f'{slug}-music.wav'; srt=vids/f'{slug}.srt'
 total=item['video_seconds']; nframes=round(total*30); w,h=base.size
 temp=vids/f'{slug}-moving-base.mp4'
 p=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r','30','-i','-','-an','-c:v','libx264','-preset','ultrafast','-crf','24','-pix_fmt','yuv420p',str(temp)],stdin=subprocess.PIPE)
 rng=random.Random(slug)
 shards=[(rng.randrange(w),rng.randrange(h),rng.randrange(5,17),rng.choice([(89,207,126),(252,124,91),(182,222,153)]),rng.uniform(.3,1.2),rng.random()*6.28) for _ in range(20)]
 for i in range(nframes):
  t=i/30; frame=base.copy(); d=ImageDraw.Draw(frame,'RGBA')
  # continuous drifting facets and small colored lights create independent motion in the scene
  for x,y,r,c,v,phase in shards:
   xx=(x+v*t*35)%w; yy=(y+math.sin(t*1.6+phase)*18)%h
   alpha=int(60+35*(.5+.5*math.sin(t*2+phase)))
   d.polygon([(xx,yy-r),(xx+r,yy+r//2),(xx-r,yy+r)],fill=(*c,alpha))
  pulse=.5+.5*math.sin(t*3.1)
  if kind in ('window','hero','cursor'):
   # cursor-like pointer moves into and across the browser window
   px=140+(w-280)*(.5+.5*math.sin(t*1.1)); py=500+45*math.cos(t*1.7)
   d.polygon([(px,py),(px,py+43),(px+12,py+32),(px+29,py+51),(px+38,py+45),(px+21,py+28),(px+39,py+24)],fill=(246,247,232,245),outline=(8,13,21,255))
   d.ellipse((px-13,py-13,px+13,py+13),outline=(112,231,151,200),width=3)
  elif kind in ('pitch','players','board','speed'):
   bx=100+(w-200)*(.5+.5*math.sin(t*1.5)); by=520+38*math.sin(t*2.4)
   d.ellipse((bx-13,by-13,bx+13,by+13),fill=(250,248,232,255),outline=(7,24,18,255),width=2)
   for j,px in enumerate([155,215,330,390]):
    py=477+(j%2)*92+int(7*math.sin(t*5+j))
    d.line((px,py+47,px-9*math.sin(t*5+j),py+66),fill=(245,246,233,220),width=4)
    d.line((px,py+47,px+9*math.sin(t*5+j),py+66),fill=(245,246,233,220),width=4)
   if kind=='speed':
    x=139+(int(t*1.8)%4)*64; d.rounded_rectangle((x,706,x+49,757),radius=13,outline=(139,255,171,230),width=4)
  elif kind in ('universe','career','save'):
   angle=t*1.1; cx,cy=270,500
   x=cx+155*math.cos(angle); y=cy+155*math.sin(angle)
   d.ellipse((x-9,y-9,x+9,y+9),fill=(255,207,119,240))
   if kind=='career':
    d.line((120,730,180,690,250,710,315,630,420,596),fill=(131,240,156,230),width=6)
    d.polygon([(420,596),(395,592),(412,617)],fill=(131,240,156,230))
   if kind=='save':
    j=int(t*1.3)%3; x0=105+j*115
    d.rounded_rectangle((x0-4,696,x0+104,795),radius=12,outline=(255,124,91,235),width=4)
  # continuous camera drift, very slight and smooth
  z=1+.012*pulse; frame=frame.resize((int(w*z),int(h*z)),Image.Resampling.BICUBIC)
  x=(frame.width-w)//2; y=(frame.height-h)//2; frame=frame.crop((x,y,x+w,y+h))
  p.stdin.write(frame.tobytes())
 p.stdin.close(); rc=p.wait()
 if rc: raise RuntimeError(f'frame encode failed for {slug}')
 for subs,tail in [(False,'video-SIN-SUBTITULOS.mp4'),(True,'video-FINAL.mp4')]:
  vf='scale=1080:1920:flags=lanczos,format=yuv420p'
  if subs: vf+=f",subtitles={srt}:force_style='FontName=DejaVu Sans,FontSize=46,PrimaryColour=&H00FFFFFF,OutlineColour=&H00101418,BorderStyle=3,Outline=2,Shadow=0,Alignment=8,MarginV=250'"
  out=vids/f'{slug}-{tail}'
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(temp),'-i',str(wav),'-i',str(music),'-filter_complex','[1:a]volume=1.0[vo];[2:a]volume=0.35[mus];[vo][mus]amix=inputs=2:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[a]','-vf',vf,'-map','0:v:0','-map','[a]','-c:v','libx264','-preset','veryfast','-crf','26','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k',str(out)],check=True)
 temp.unlink()
 print(slug,round(total,2),'s')
