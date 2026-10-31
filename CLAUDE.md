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
**Por defecto el usuario NO quiere ver las diapositivas**: quiere un vídeo animado al estilo de los reels (composición
`Reel`, escenas `drawing`, mascota, cifras animadas) que cuente el contenido de forma amena. Flujo por defecto:
1. Importa la presentación (paso 1 de abajo) solo para LEER texto, notas e imágenes.
2. Usa solo las diapositivas completas (descarta plantillas con [TBC], borradores, huecos por rellenar) y avisa cuáles.
3. Escribe un guion `videos/<slug>.json` tipo reel con `"longForm": true` (puede pasar de 60 s; ~2–3 min),
   narración cercana y datos fieles a la presentación (sin inventar; respeta matices de las notas).
   Crea dibujos SVG nuevos para el tema si hace falta. Mascota: `"character": "bot"` para temas técnicos/empresa.
4. Las presentaciones del usuario pueden ser confidenciales: nunca las subas a git (ya están en .gitignore; añade
   también el guion del reel si contiene datos internos).
Solo si el usuario pide expresamente ver las diapositivas, usa la composición `Presentation`:
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

## Calidad de los dibujos (PLANTILLA OBLIGATORIA para todos los vídeos)
El usuario pide **más calidad en todos los dibujitos**. Nada de formas planas de un color. Todo dibujo nuevo debe cumplir:
1. **Volumen**: degradados (radial/lineal) en cada forma importante, luz arriba-izquierda, sombra abajo-derecha,
   un **brillo** blanco (elipse pequeña, opacidad 0.3–0.9) y sombra proyectada en el suelo (elipse negra, opacidad ~0.25).
2. **Contornos** oscuros del mismo tono que el objeto (no negro puro), grosor 4–8, `strokeLinejoin="round"`.
3. **Detalle**: texturas sutiles (vetas, capas, fibras, remaches, reflejos de cristal). Mejor 2–3 detalles bien puestos
   que muchos.
4. **Vida**: todo se mueve un poco aunque esté "quieto" (flotar, respirar, parpadear, vibrar, partículas). Entradas con
   `spring`, nunca apariciones secas.
5. **Personajes y ojos**: párpados reales que parpadean (no escalar el ojo entero), iris con fibras y brillos,
   pestañas curvas que siguen el párpado, emociones con cejas y boca. Usa `Eye` (`src/drawings/Eye.tsx`) para ojos
   grandes y como referencia de nivel para cualquier personaje.
6. **Partículas y fluidos** con volumen: `Sphere` (esfera con degradado + brillo + halo opcional), gotas con degradado
   blanco→azul y reflejo, gas/humo con halo (`glow-*`).
7. **Composición**: nada debe tapar títulos ni textos (deja ~60 px de margen), leyendas separadas de sus marcadores,
   todo dentro de las zonas seguras.
8. **Revisión obligatoria**: antes del render final, captura cada escena con `remotion still` a escala ≥0.4, míralas y
   corrige solapamientos, formas toscas o zonas vacías.

Piezas reutilizables (`src/drawings/parts.tsx` y otros): `Defs` (degradados `sph-*` y `glow-*` en yellow/purple/green/
blue/white, `wood`), `Sphere`, `Board` (tabla de madera), `Eye`, `Onion`/`TearStream` (personaje con lágrimas),
`Knife` (`OnionScenes.tsx`), `Molecule`, `Steam`, `Cup`, `Counter`, `Label`, `Bean`.
Ejemplo de referencia de calidad: `videos/cebolla-lagrimas.json` y `src/drawings/OnionScenes.tsx`.

## Estilo para datos y empresa (preferencia del usuario)
**No quiere iconos típicos de IA** (emojis 3D, robots, mascotas) en vídeos de datos/empresa: quiere MÁS estadísticas y
animaciones visuales de datos. Usa los gráficos animados de `src/scenes/Charts.tsx`:
`kpis` (fichas que cuentan + chip de variación), `waffle` (K de N cuadrados), `dumbbell` (antes → después por fila con %),
`linechart` (líneas que se dibujan, área, valor en la punta, `annotate`), `columns` (columnas agrupadas + `totals`),
`donut` (segmentos + centro), `multibars` (varias métricas 0–1 por fila). `hook` admite `chart` (línea de fondo) y
`outro` admite `confetti`. Extrae datos reales de los gráficos nativos del PPTX con python-pptx (`chart.plots[].series`).

## Tipos de escena (ver `src/schema.ts`)
`hook`, `text`, `list`, `stat` (cifra que cuenta), `compare` (A vs B), `steps`, `quote`, `bars` (gráfico), `outro`,
y `drawing`: ilustración SVG animada (`src/drawings/`), con `title`, `text`, `data` y una `mascot` opcional
(grano de café con cara, `mood`: happy/surprised/wink/thinking, `say`: bocadillo). En escenas `drawing`,
`data.atWords: ["palabra", ...]` sincroniza apariciones con la voz (se convierte en `data.at` en segundos).

**El usuario prefiere vídeos con muchas animaciones y dibujos de calidad** (ver "Calidad de los dibujos"): prioriza escenas `drawing`. Si el tema no encaja
con los dibujos existentes (`cups-vs`, `concentration`, `filter`, `beans`, `americano`, `mascot`, `energy`, `factories`, `code`,
`queries`, `users`, `speed`, `bot`, `onion-cry`, `onion-cells`, `gas-eye`, `onion-tips`, `onion`),
DIBUJA nuevos componentes SVG para ese tema en `src/drawings/Drawings.tsx` (regístralos en `registry`), reutilizando
`parts.tsx` (Molecule, Steam, Label, Counter…). viewBox 1000x820. Todo debe moverse: springs, llenados, partículas.
Duración: la necesaria, máximo 60 s.

Antes del render completo, revisa capturas sueltas con
`npx remotion still src/index.ts Reel out/f.png --frame=N --props=videos/x.json --scale=0.25` (en este contenedor
añade `--gl=egl --browser-executable=/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell`).
Si un tema necesita algo que no existe (mapa, línea temporal, diagrama…), crea un nuevo tipo en
`src/schema.ts` + componente en `src/scenes/Scenes.tsx`, manteniendo el estilo (springs, Title, Card, zonas seguras `SAFE`).

## Voz en off
El usuario quiere una voz **realista, masculina, de España** (rechazó Kokoro por sonar digital).
Proveedores (`scripts/tts_providers.py`), elegidos solos según la variable de entorno disponible:
1. `GOOGLE_TTS_API_KEY` → Google Cloud TTS **Chirp 3 HD** (`es-ES-Chirp3-HD-Charon`, nativa de España). Preferida.
2. `GEMINI_API_KEY` → Gemini TTS (voz `Charon`; el acento de España se pide en la instrucción de estilo).
3. `ELEVENLABS_API_KEY` → ElevenLabs (requiere permitir `api.elevenlabs.io` en la red; `narrator.name` = voice_id).
4. Sin claves → Kokoro local (`.venv` + `models/`), solo como reserva; avisa al usuario de que la calidad es baja.
Se fuerza con `"narrator": {"provider": "google", "name": "es-ES-Chirp3-HD-Orus", "speed": 1.05}`.
Otras voces masculinas Chirp 3 HD: Orus, Fenrir, Puck, Algenib, Iapetus. Nunca pidas claves por el chat.
La música baja automáticamente mientras habla la voz. Caché de audios en `public/voice/` (incluye proveedor y voz).
- Textos fijos de los dibujos traducidos en `src/i18n.tsx`; añade ahí cualquier texto nuevo de dibujos.

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

## Herramientas de apoyo
- **FFmpeg**: volumen (-14 LUFS), compresión, tiras de fotogramas para revisar.
- **Whisper** (`faster-whisper`, `scripts/transcribe.py`): tiempos exactos por palabra para sincronizar `atWords`,
  marcadores y subtítulos, y para comprobar que la voz dice el guion. Necesita `huggingface.co` permitido en la red
  (el modelo se guarda en `models/whisper/`). Si no está, se usa la estimación por caracteres.
- **yt-dlp** (`scripts/reference.sh <url>`): descarga vídeos de referencia SOLO para analizar ritmo y estilo
  (tira de fotogramas + transcripción en `references/`, no versionado). Nunca reutilizar su contenido.
  Necesita los dominios de YouTube/Instagram/TikTok permitidos.
- **HyperFrames** (HeyGen, `experiments/hyperframes/`, versión fijada 0.8.166): SOLO como complemento para
  motion graphics de texto (títulos del gancho, palabras destacadas, subtítulos animados). El usuario aprobó usarlo
  en los ganchos. Flujo: componer en `experiments/hyperframes/<proyecto>/index.html` con bloques del catálogo
  (`npx hyperframes catalog`, `add <bloque>`), GSAP y fuentes en local (este entorno no confía en los CDN),
  `--bg: transparent`, cajas altas (los componentes escalan con la altura de su caja), revisar con
  `npx hyperframes snapshot`, renderizar `npx hyperframes render --format webm --fps 60 -q delivery` (con alfa),
  copiar a `public/overlays/` y usar en la escena con `"overlay": "overlays/x.webm"` + `"hideTitle": true`.
  Usa `DO_NOT_TRACK=1`. Remotion sigue siendo el motor principal. Ejemplo: `experiments/hyperframes/hook-test`.

## Notas técnicas
- Fuentes locales en `public/fonts` (Montserrat + Inter, OFL); emojis con la fuente del sistema (Noto Color Emoji).
- `npm run studio` abre el editor visual de Remotion para previsualizar.
- `npm run typecheck` antes de hacer commit si tocas código.
