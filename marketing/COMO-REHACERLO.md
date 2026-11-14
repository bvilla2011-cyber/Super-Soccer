# Cómo rehacer las previsualizaciones

Requisitos comprobados en este entorno: Python 3.12, Pillow y FFmpeg 7 con `libass` y filtro `flite`. La descarga de HyperFrames no respondió desde el entorno; por eso se usa el render Python/FFmpeg.

Desde la raíz del repositorio:

```bash
python3 -m pip install Pillow
python3 marketing/generate_campaign.py
python3 marketing/animate_campaign.py
python3 marketing/render_subtitles.py
```

`generate_campaign.py` crea pósteres, WAV de voz local y música sintetizada y las primeras exportaciones; `animate_campaign.py` dibuja las capas geométricas móviles; `render_subtitles.py` genera SRT y ASS y vuelve a renderizar MP4 con subtítulos. Para rehacer un guion, edita `manifest.json` (texto, título, CTA y duración de voz objetivo) y vuelve a ejecutar los tres comandos.

Salidas por pieza en `marketing/videos/`:
- `{id}-video-FINAL.mp4`: versión con subtítulos quemados.
- `{id}-video-SIN-SUBTITULOS.mp4`: versión sin subtítulos.
- `{id}.srt`: subtítulos portables.
- `{id}.txt`: guion para voz.

La voz `flite/slt` es solo una voz local de emergencia y no un modelo español. Los tiempos de subtítulo son aproximados por duración/peso de caracteres. Antes de publicación, sustituye la voz por español natural, alinea palabra a palabra y vuelve a exportar. La pieza insignia requiere aprobación del cliente antes de programarla.
