# VideoCreation — reels animados de ~1 minuto

Este repo genera vídeos verticales (1080x1920, 30 fps, MP4) animados con **Remotion** (React).
El usuario pide un tema y Claude produce el vídeo.

## Flujo cuando el usuario pide "hazme un vídeo/reel sobre X"

1. **Guion**: crea `videos/<slug>.json` siguiendo `src/schema.ts`. Idioma: el del usuario (por defecto español).
   - Duración total ≈ 55–60 s: suma de `duration` de las escenas, menos 0,4 s por transición.
   - Estructura de reel que retiene: `hook` (3–4 s, frase impactante) → 5–7 escenas de contenido variadas → `outro` con CTA.
   - Textos CORTOS: máx. ~25 palabras por escena `text`, ~8 palabras por item de `list`/`steps`. Calcula ~3 palabras/segundo de lectura.
   - Varía los tipos de escena (no repitas el mismo tipo seguido). Usa `highlight` para 1–3 palabras clave.
   - Elige un `theme` acorde al tema (bg1/bg2 oscuros, accent/accent2 vivos y contrastados).
   - Datos y cifras: solo hechos verificables; si no estás seguro, no inventes números.
2. **Render**: `npm run render -- videos/<slug>.json` → `out/<slug>.mp4` (tarda unos minutos; lanzar en background si hace falta).
3. **Revisión**: extrae una tira de fotogramas con ffmpeg y míralos antes de entregar
   (`ffmpeg -i out/x.mp4 -vf "fps=1/6,scale=270:480,tile=10x1" -frames:v 1 contact.png`). Corrige textos que desborden.
4. **Entrega**: envía el MP4 al usuario (SendUserFile) y haz commit del JSON (los MP4 en `out/` no se versionan).

## Tipos de escena (ver `src/schema.ts`)
`hook`, `text`, `list`, `stat` (cifra que cuenta), `compare` (A vs B), `steps`, `quote`, `bars` (gráfico), `outro`.
Si un tema necesita algo que no existe (mapa, línea temporal, diagrama…), crea un nuevo tipo en
`src/schema.ts` + componente en `src/scenes/Scenes.tsx`, manteniendo el estilo (springs, Title, Card, zonas seguras `SAFE`).

## Notas técnicas
- Fuentes locales en `public/fonts` (Montserrat + Inter, OFL); emojis con la fuente del sistema (Noto Color Emoji).
- Música opcional: pon un mp3 libre de derechos en `public/` y usa `"music": "archivo.mp3"`.
- `npm run studio` abre el editor visual de Remotion para previsualizar.
- `npm run typecheck` antes de hacer commit si tocas código.
