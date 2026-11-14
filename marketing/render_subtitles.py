from pathlib import Path
import json,subprocess
root=Path('marketing'); vids=root/'videos'; manifest=json.loads((root/'manifest.json').read_text())
def srt_time(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
def ass_time(t):
 cs=round(t*100);return f'{cs//360000:01}:{cs//6000%60:02}:{cs//100%60:02}.{cs%100:02}'
header='''[Script Info]\nTitle: UniFormer Studio campaign captions\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,DejaVu Sans,46,&H00FFFFFF,&H000000FF,&H00101418,&HCC101820,-1,0,0,0,100,100,0,0,3,2,0,8,60,60,260,1\nStyle: Keyword,DejaVu Sans,46,&H0096E7A1,&H000000FF,&H00101418,&HCC101820,-1,0,0,0,100,100,0,0,3,2,0,8,60,60,260,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n'''
for it in manifest:
 slug=it['id'];words=it['script'].replace('\n',' ').split();groups=[' '.join(words[i:i+2]) for i in range(0,len(words),2)]
 vd=it['voice_seconds'];units=[sum(max(1,len(w)) for w in g.split()) for g in groups];total=sum(units);cur=0;ass=[header];srt=[]
 for j,(g,u) in enumerate(zip(groups,units),1):
  end=min(vd-.02,cur+vd*u/total)
  ww=g.split();keyword=ww[0].rstrip('.,:;!?')
  colored='{\\an8\\pos(540,540)}{\\rKeyword}'+keyword+'{\\rDefault} '+' '.join(ww[1:])
  ass.append(f'Dialogue: 0,{ass_time(cur)},{ass_time(end)},Default,,0,0,0,,{colored}\n')
  srt.append(f'{j}\n{srt_time(cur)} --> {srt_time(end)}\n{g}\n');cur=end
 (vids/f'{slug}.ass').write_text(''.join(ass),encoding='utf-8')
 (vids/f'{slug}.srt').write_text('\n'.join(srt),encoding='utf-8')
 no=vids/f'{slug}-video-SIN-SUBTITULOS.mp4';wav=vids/f'{slug}.wav';music=vids/f'{slug}-music.wav';out=vids/f'{slug}-video-FINAL.mp4'
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(no),'-i',str(wav),'-i',str(music),'-filter_complex','[1:a]volume=1.0[vo];[2:a]volume=0.35[mus];[vo][mus]amix=inputs=2:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[a]','-vf',f'ass={vids/f"{slug}.ass"}','-map','0:v:0','-map','[a]','-c:v','libx264','-preset','veryfast','-crf','26','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k',str(out)],check=True)
 print(slug)
