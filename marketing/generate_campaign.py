from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, random, os, subprocess, json, textwrap
from pathlib import Path
OUT=Path('marketing'); AS=OUT/'assets'; VD=OUT/'videos'; W,H=540,960
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font=lambda s:ImageFont.truetype(FONT,s)
items=[
('01-ventana','Una pestaña puede ser un mundo','El navegador no es solo para buscar cosas. También puede ser el principio de una partida. En UniFormer Studio estamos preparando una web de juegos propios para abrir desde el navegador, sin instalar nada. La web todavía no está publicada. Síguenos y te contamos cuándo se abre esta ventana.','Descubre el estudio',18,'window'),
('02-sin-instalar','¿Instalar? Hoy no toca','Descargas, instaladores, espacio ocupado… pausa. UniFormer Studio prepara juegos propios para jugar desde el navegador, sin instalar nada. Pensamos también en equipos modestos, aunque cada centro decide qué permite y la compatibilidad final depende del equipo. La web aún no está publicada. Síguenos para descubrirla.','Descubre el estudio',19,'cursor'),
('03-super-soccer','Un partido desde el banquillo','SUPER SOCCER es nuestro primer proyecto. Es una beta en desarrollo: todavía no se puede jugar. El repositorio describe un juego de gestión donde preparas la plantilla y observas una simulación animada del partido. No controlas a los futbolistas. Próximamente te enseñamos más.','Próximamente',19,'pitch'),
('04-cinco','Cinco contra cinco, en pantalla','En la retransmisión descrita por el proyecto aparecen cinco jugadores por equipo: portero y cuatro jugadores de campo. La cámara sigue la jugada mientras la simulación calcula el encuentro. Esto es un avance del proyecto, no una invitación a jugar ya: SUPER SOCCER sigue en beta.','Próximamente',17,'players'),
('05-descanso','El descanso también cuenta','En SUPER SOCCER, el descanso sirve para preparar el cinco de la segunda parte. La simulación tiene en cuenta esos cambios al calcular el siguiente tramo. Es gestión y retransmisión animada, no control directo de cada futbolista. Sigue a UniFormer Studio para ver cómo evoluciona la beta.','Próximamente',18,'board'),
('06-ritmo','Un partido. Cuatro ritmos','El repositorio describe velocidades de retransmisión 1×, 2×, 4× y 8×, además de pausa y pantalla completa. Son controles del entrenador dentro del proyecto; la beta aún no está disponible para jugar. ¿Qué ritmo elegirías para ver una final? Síguenos y pronto habrá más.','Próximamente',18,'speed'),
('07-universo','188 clubes. Un universo ficticio','El README del proyecto describe 188 clubes y 2.256 jugadores iniciales en un universo ficticio inspirado en el fútbol europeo. Las plantillas y valoraciones son inventadas, no datos oficiales. SUPER SOCCER sigue en beta. Síguenos para descubrir los siguientes detalles.','Próximamente',18,'universe'),
('08-carrera','Una carrera que sigue','El proyecto incluye carrera multitemporada, mercado, cantera e historial. La idea es construir una trayectoria de entrenador temporada a temporada. Son funciones descritas en el repositorio; la beta todavía no es jugable. Guarda esta pista y sigue a UniFormer Studio para el siguiente avance.','Próximamente',18,'career'),
('09-guardados','Tu carrera, tres ranuras','El proyecto describe tres ranuras independientes para guardar carreras. Los datos se guardan en el navegador donde se crean, con opciones de exportación e importación. Ojo: borrar los datos del navegador puede eliminarlos. SUPER SOCCER está en beta. Síguenos para conocer cuándo habrá novedades.','Síguenos',20,'save'),
('10-hero','La ventana se abre','Hay juegos que empiezan con una descarga. Nosotros queremos empezar con una ventana. UniFormer Studio está preparando juegos propios para el navegador: abres, descubres y entras en otro mundo, sin instalar nada. Pensamos en equipos modestos y en jugar con teclado y ratón; la compatibilidad depende de cada dispositivo y de lo que permita cada centro.\n\nNuestro primer proyecto se llama SUPER SOCCER. Es una beta, todavía no jugable. En el proyecto preparas una plantilla y observas una retransmisión animada: pases, carreras, tiros, paradas y goles nacen de una simulación estadística. En el descanso puedes preparar el siguiente tramo. No manejas directamente a los futbolistas.\n\nDetrás hay clubes ficticios, temporadas, mercado, cantera y carreras que guardan su progreso. Estamos construyendo la web y puliendo el proyecto paso a paso. La fecha de lanzamiento aún no está confirmada.\n\nEsta ventana todavía no se ha abierto del todo. Síguenos y descubre UniFormer Studio. Próximamente.','Síguenos',70,'hero'),
]
# Branded 2D low-poly posters; each one uses a different framing motif.
def wrap(draw, text, f, maxw):
    words=text.split(); lines=[]; line=''
    for word in words:
        trial=(line+' '+word).strip()
        if draw.textbbox((0,0),trial,font=f)[2]<=maxw: line=trial
        else: lines.append(line); line=word
    if line: lines.append(line)
    return lines

def poster(idx,title,kind,cta):
    random.seed(idx*41+7)
    im=Image.new('RGB',(W,H),(8,13,21)); d=ImageDraw.Draw(im)
    # soft graph and dramatic lower glow
    for x in range(0,W,40):d.line((x,0,x,H),fill=(13,25,34),width=1)
    for y in range(0,H,40):d.line((0,y,W,y),fill=(13,25,34),width=1)
    d.ellipse((-150,350,700,1120),fill=(7,37,40))
    # diagonal poly landscape
    colors=[(22,57,59),(23,73,67),(38,104,78),(62,145,90),(125,196,91),(255,116,89)]
    for i in range(16):
        x=random.randint(-100, W); y=random.randint(250,780)
        r=random.randint(50,150); c=random.choice(colors)
        pts=[(x,y-r),(x+r,y-r//2),(x+r//2,y+r),(x-r//2,y+r//2),(x-r,y-r//3)]
        d.polygon(pts,fill=c)
    # central icon scene
    cx,cy=270,470
    if kind in ('window','hero','cursor'):
        d.rounded_rectangle((65,330,475,670),radius=22,fill=(213,229,220),outline=(102,221,153),width=6)
        d.rectangle((80,350,460,397),fill=(29,55,64)); d.ellipse((95,365,108,378),fill=(255,116,89)); d.ellipse((118,365,131,378),fill=(255,201,116)); d.ellipse((141,365,154,378),fill=(122,220,157))
        d.polygon([(105,610),(190,476),(270,590),(340,454),(435,610)],fill=(31,103,78)); d.polygon([(105,610),(224,544),(292,610)],fill=(92,160,87))
        d.ellipse((395,420,427,452),fill=(255,205,116))
        if kind=='cursor':
            d.polygon([(220,490),(220,570),(242,550),(260,590),(280,580),(262,542),(295,542)],fill=(246,246,237),outline=(12,22,27))
    elif kind in ('pitch','players','board','speed'):
        d.polygon([(70,360),(460,360),(500,650),(40,650)],fill=(30,105,73),outline=(208,232,200))
        d.line((270,360,270,650),fill=(204,229,195),width=3);d.ellipse((226,485,314,573),outline=(204,229,195),width=3)
        for px,py,col in [(140,450,(103,224,146)),(200,575,(103,224,146)),(365,438,(248,119,95)),(400,565,(248,119,95)),(285,540,(103,224,146))]:
            d.ellipse((px-17,py-17,px+17,py+17),fill=col);d.polygon([(px-12,py+17),(px+12,py+17),(px+20,py+62),(px-20,py+62)],fill=col)
        d.ellipse((260,476,278,494),fill=(250,248,232))
        if kind=='speed':
            d.rounded_rectangle((110,700,430,765),radius=20,fill=(18,30,38),outline=(113,219,151),width=3);d.text((143,713),'1×   2×   4×   8×',font=font(24),fill=(228,241,227))
    elif kind in ('universe','career','save'):
        d.ellipse((90,330,450,690),fill=(20,40,53),outline=(112,220,151),width=5)
        for i in range(8):
            a=i*math.pi/4; x=cx+145*math.cos(a); y=cy+145*math.sin(a)
            d.polygon([(x,y-19),(x+22,y+12),(x-22,y+12)],fill=colors[(i%5)+1])
        d.ellipse((225,425,315,515),fill=(255,116,89));d.text((190,540),'SUPER SOCCER',font=font(19),fill=(232,243,232))
        if kind=='save':
            for j in range(3):
                d.rounded_rectangle((105+j*115,700,205+j*115,790),radius=9,fill=(20,38,45),outline=(118,222,151),width=3);d.text((137+j*115,730),str(j+1),font=font(34),fill=(230,245,230))
    else:
        d.ellipse((105,370,435,700),fill=(22,45,58),outline=(102,221,153),width=4)
        for i in range(8):
            a=i*math.pi/4;x=cx+130*math.cos(a);y=cy+130*math.sin(a)
            d.polygon([(cx,cy),(x,y),(x+16,y+25)],fill=colors[i%len(colors)])
        d.text((172,530),'UF',font=font(86),fill=(226,240,226))
    # top label and headline safely in viewport
    d.text((54,60),'UNIFORMER STUDIO',font=font(19),fill=(150,231,172))
    d.line((54,102,486,102),fill=(43,91,78),width=2)
    headline=font(37); lines=wrap(d,title,headline,430)
    y=145
    for ln in lines[:3]:d.text((54,y),ln,font=headline,fill=(246,247,232),stroke_width=1,stroke_fill=(8,13,21));y+=48
    d.rounded_rectangle((54,805,486,870),radius=20,fill=(16,33,40),outline=(104,222,151),width=2)
    d.text((78,823),cta.upper(),font=font(22),fill=(163,237,177))
    d.text((54,902),'PRÓXIMAMENTE  ·  ENLACE EN LA BIO',font=font(12),fill=(171,185,181))
    return im

# Generate narrative voice and vertical videos with local ffmpeg fallback. Use all source text in UTF-8 textfiles.
manifest=[]
for n,(slug,title,script,cta,dur,kind) in enumerate(items,1):
    img=poster(n,title,kind,cta); img_path=AS/f'{slug}.png'; img.save(img_path)
    txt_path=VD/f'{slug}.txt'; txt_path.write_text(script.replace('\n',' '),encoding='utf-8')
    wav=VD/f'{slug}.wav'
    # Local flite voice: fallback only (English model; Spanish pronunciation may be imperfect).
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',f"flite=textfile={txt_path}:voice=slt",'-ac','2','-ar','48000',str(wav)],check=True)
    probe=subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(wav)],text=True).strip(); voice_d=float(probe)
    # Keep a safe, fixed visual tail while narration remains the timing source.
    total=voice_d+2.2
    words=script.replace('\n',' ').split(); groups=[' '.join(words[i:i+3]) for i in range(0,len(words),3)]
    srt=[]; start=0.0
    for group in groups:
        share=sum(max(1,len(w)) for w in group.split())/max(1,sum(max(1,len(w)) for w in words))
        end=min(voice_d-0.02,start+max(.3,voice_d*share))
        def ts(t):
            ms=round(t*1000); return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
        srt.append(f'{len(srt)+1}\n{ts(start)} --> {ts(end)}\n{group}\n'); start=end
    sr=VD/f'{slug}.srt';sr.write_text('\n'.join(srt),encoding='utf-8')
    # Create very low original tonal bed. A synthetic pad avoids external music licenses.
    mus=VD/f'{slug}-music.wav'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i',f'sine=frequency=110:sample_rate=48000:duration={total}','-f','lavfi','-i',f'sine=frequency=164.81:sample_rate=48000:duration={total}','-filter_complex','[0:a]volume=0.035[a0];[1:a]volume=0.022[a1];[a0][a1]amix=inputs=2,afade=t=in:st=0:d=1,afade=t=out:st='+str(max(0,total-1)) + ':d=1,volume=0.7[m]','-map','[m]','-ac','2',str(mus)],check=True)
    # Slow continuous camera drift over polygon art; voice + original pad, normalize final mix.
    base=['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-framerate','30','-i',str(img_path),'-i',str(wav),'-i',str(mus),'-t',f'{total:.3f}']
    vf='scale=1080:1920,zoompan=z=\'min(zoom+0.00015,1.04)\':x=\'iw/2-(iw/zoom/2)+sin(on/85)*15\':y=\'ih/2-(ih/zoom/2)+cos(on/92)*12\':d=1:s=1080x1920:fps=30,format=yuv420p'
    for subs,tail in [(False,'video-SIN-SUBTITULOS.mp4'),(True,'video-FINAL.mp4')]:
        filt=vf
        if subs:filt += f",subtitles={sr}:force_style='FontName=DejaVu Sans,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00101418,BorderStyle=3,Outline=2,Shadow=0,Alignment=8,MarginV=340'"
        # -14 LUFS final target
        out=VD/f'{slug}-{tail}'
        cmd=base+['-filter_complex',f"[1:a]volume=1.0[vo];[2:a]volume=0.35[mus];[vo][mus]amix=inputs=2:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[a]",'-vf',filt,'-map','0:v:0','-map','[a]','-c:v','libx264','-preset','veryfast','-crf','27','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k',str(out)]
        subprocess.run(cmd,check=True)
    manifest.append({'id':slug,'title':title,'cta':cta,'voice_seconds':round(voice_d,2),'video_seconds':round(total,2),'script':script,'image':str(img_path),'video_subtitles':str(VD/f'{slug}-video-FINAL.mp4'),'video_no_subtitles':str(VD/f'{slug}-video-SIN-SUBTITULOS.mp4'),'srt':str(sr),'status':'REVIEW_REQUIRED_LANGUAGE_AND_CAPTIONS'})
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([(m['id'],m['voice_seconds'],m['video_seconds']) for m in manifest],ensure_ascii=False))
