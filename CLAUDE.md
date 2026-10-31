# VideoCreation — reels animados de ~1 minuto y vídeos de presentaciones

Este repo genera vídeos verticales (1080x1920, 30 fps, MP4) animados con **Remotion** (React).
El usuario pide un tema y Claude produce el vídeo.

**Cuenta del usuario: `@less_thanaminute`** → ponla siempre en `handle`.

## Flujo cuando el usuario pide "hazme un vídeo/reel sobre X"

1. **Guion**: crea `videos/<slug>.json` siguiendo `src/schema.ts`. Por defecto **español de España** (`"lang": "es"`,
   vocabulario y expresiones de España). Si el usuario pide inglés, crea `videos/<slug>.en.json` con `"lang": "en"`
   (traducción natural y adaptada, no literal; cifras escritas con letras en `voice`).
   - Duración total ≈ 55–60 s: suma de `duration` de las escenas, menos 0,4 s por transición.
   - Estructura de reel que retiene: `hook` (3–4 s, frase impactante) → 5–7 escenas de contenido variadas → `outro` con CTA.
   - Textos CORTOS: máx. ~25 palabras por escena `text`, ~8 palabras por item de `list`/`steps`. Calcula ~3 palabras/segundo de lectura.
   - Varía los tipos de escena (no repitas el mismo tipo seguido). Usa `highlight` para 1–3 palabras clave.
   - Elige un `theme` acorde al tema (bg1/bg2 oscuros, accent/accent2 vivos y contrastados).
   - Datos y cifras: solo hechos verificables; si no estás seguro, no inventes números.
   - **Voz en off obligatoria**: cada escena lleva `"voice"` con lo que dice el narrador (más completo que el texto en
     pantalla, tono cercano, frases cortas). Escribe los números y símbolos con letras ("sesenta y tres miligramos",
     no "63 mg") para que la voz los lea bien. Ritmo ≈ 2,8 palabras/s; el total no debe pasar de 60 s
     (`scripts/tts.py` alarga las escenas para que quepa la voz y avisa si te pasas).
2. **Render**: `npm run render -- videos/<slug>.json` → `out/<slug>.mp4` (~3-5 min a 60 fps; lanzar en background).
3. **Revisión**: extrae una tira de fotogramas con ffmpeg y míralos antes de entregar
   (`ffmpeg -i out/x.mp4 -vf "fps=1/6,scale=270:480,tile=10x1" -frames:v 1 contact.png`). Corrige textos que desborden.
4. **Entrega**: envía el MP4 al usuario (SendUserFile) y haz commit del JSON (los MP4 en `out/` no se versionan).

## Vídeos a partir de presentaciones (sin límite de duración)
Cuando el usuario aporte una presentación (PPTX, PPT, KEY, ODP o PDF; en `presentations/` o desde Google Drive):
1. **Importar**: `npm run import -- presentations/<archivo> [--lang es|en] [--format landscape|vertical|square]`
   → imágenes en `public/slides/<slug>/` + guion `videos/<slug>.slides.json` con `_text` y `_notes` de cada diapositiva.
   Formato por defecto `landscape` (1920x1080, YouTube/LinkedIn); `vertical` (1080x1920) para Reels/TikTok.
2. **Mirar las diapositivas** (Read de los PNG) para entender el contenido y medir zonas.
3. **Escribir el guion** en el JSON:
   - `voice` de cada diapositiva: narración natural basada en `_notes` (si hay) y `_text`; explica, no leas la diapositiva.
     Números con letras. Rellena `intro` (title, subtitle, voice) y `outro` (text, cta, voice), o ponlos a `null`.
   - `highlights`: marcadores animados (`box` | `underline` | `circle`) con coordenadas 0–1 relativas a la diapositiva
     y `"word"` = palabra de la narración en la que deben aparecer (el tiempo se calcula solo).
   - `focus`: zoom suave a una zona (`x,y,w,h`, `"word"` para empezar, `"untilWord"` para volver).
   - `title` (solo vertical/cuadrado): titular grande encima de la diapositiva.
   - Elige `theme` acorde a los colores de la presentación.
4. **Render**: `npm run render -- videos/<slug>.slides.json` → `out/<slug>.mp4` (30 fps por defecto; subtítulos automáticos
   con la palabra activa resaltada; `"captions": false` para quitarlos). Revisa capturas con
   `npx remotion still src/index.ts Presentation ... --props=out/<slug>.props.json` antes del render final.
Composición en `src/presentation/` (schema.ts + Presentation.tsx). Demo: `videos/ejemplo-presentacion.slides.json`.

## Tipos de escena (ver `src/schema.ts`)
`hook`, `text`, `list`, `stat` (cifra que cuenta), `compare` (A vs B), `steps`, `quote`, `bars` (gráfico), `outro`,
y `drawing`: ilustración SVG animada (`src/drawings/`), con `title`, `text`, `data` y una `mascot` opcional
(grano de café con cara, `mood`: happy/surprised/wink/thinking, `say`: bocadillo).

**El usuario prefiere vídeos con muchas animaciones y dibujos**: prioriza escenas `drawing`. Si el tema no encaja
con los dibujos existentes (`cups-vs`, `concentration`, `filter`, `beans`, `americano`, `mascot`, `energy`),
DIBUJA nuevos componentes SVG para ese tema en `src/drawings/Drawings.tsx` (regístralos en `registry`), reutilizando
`parts.tsx` (Molecule, Steam, Label, Counter…). viewBox 1000x820. Todo debe moverse: springs, llenados, partículas.
Duración: la necesaria, máximo 60 s.

Antes del render completo, revisa capturas sueltas con
`npx remotion still src/index.ts Reel out/f.png --frame=N --props=videos/x.json --scale=0.25` (en este contenedor
añade `--gl=egl --browser-executable=/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell`).
Si un tema necesita algo que no existe (mapa, línea temporal, diagrama…), crea un nuevo tipo en
`src/schema.ts` + componente en `src/scenes/Scenes.tsx`, manteniendo el estilo (springs, Title, Card, zonas seguras `SAFE`).

## Voz en off
- Kokoro TTS local (Apache-2.0) en `.venv` + `models/` (no versionados). `npm run render` los instala solo la primera vez
  (`scripts/setup-python.sh`, descarga ~350 MB de GitHub releases).
- **Voz masculina** por defecto: `em_alex` en español (pronunciación de España, con θ) y `am_michael` en inglés.
  Se cambia con `"narrator": {"name": "...", "speed": 1.1}`. Otras: `em_santa`, `am_adam`, `bm_george` (británico).
- Textos fijos de los dibujos traducidos en `src/i18n.tsx`; añade ahí cualquier texto nuevo de dibujos.
- La música baja automáticamente mientras habla la voz.

## Calidad y fluidez (ya configurado)
- **60 fps** por defecto (`"fps": 60` en el guion; 30 para renders rápidos). Las animaciones están escritas en
  unidades de 30 fps vía `useFrame()`/`ANIM_FPS` de `src/time.ts` → usa SIEMPRE `useFrame()` y `const fps = ANIM_FPS`
  en componentes de escena/dibujo, nunca `useCurrentFrame()` directamente.
- Render: H.264 CRF 17 preset slow, JPEG 95, `--gl=egl` (rápido). EVITA `filter: blur()` y `backdropFilter` (muy lentos
  en render); usa degradados radiales. Los efectos WebGL (`@remotion/effects`) no funcionan con egl en este contenedor.
- **Sonido**: música lo-fi (`public/music/lofi.mp3`) + efectos automáticos por escena (`src/sfx.ts`): whoosh en cada
  transición, pop/click/ding/sparkle/boing/rise según la escena. Añade extras con `"sfx": [{"sound": "ding", "at": 1.2}]`.
  Sonidos sintetizados por `scripts/make_sfx.py` (sin derechos). `"music": ""` desactiva la música.
- **Emojis 3D** (Fluent Emoji, MIT): cualquier emoji del guion se convierte en SVG en `public/emoji/` al renderizar.
- Fugas de luz en los cortes y grano de película sutil (`lightLeaks`, `grain`).
- Skills oficiales de Remotion en `.claude/skills/` (remotion-best-practices, etc.): consúltalas para técnicas nuevas.

## Notas técnicas
- Fuentes locales en `public/fonts` (Montserrat + Inter, OFL); emojis con la fuente del sistema (Noto Color Emoji).
- `npm run studio` abre el editor visual de Remotion para previsualizar.
- `npm run typecheck` antes de hacer commit si tocas código.
