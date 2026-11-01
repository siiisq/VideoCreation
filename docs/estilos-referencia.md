# Biblioteca de estilos de animación (referencias analizadas)

Patrones de ritmo y animación sacados de reels de referencia, para reutilizarlos en próximos reels.
Solo se guarda el **análisis del formato** (nunca el contenido, textos, logos ni imágenes del original).
Los vídeos descargados viven en `references/` (no versionado).

---

## 1. "Lista de cambios: de pago → gratis" (lista numerada con tachado)
Ref.: reel de Instagram de @heysansser (nov. 2026), 53,6 s, 9 elementos, 1080x1920 a 30 fps.

**Estructura y tiempos**
| Tramo | Duración | Qué pasa |
|---|---|---|
| Gancho | 0–4 s | Número enorme ("9") en caja de color + icono del tema + frase con la cifra de ahorro destacada en caja de color. El texto entra por partes. |
| Ítems ×9 | ~4,8 s cada uno | Misma plantilla repetida (ver abajo); la repetición hace de "ritmo". |
| Cierre | ~6 s | "Comenta PALABRA" con una caja de comentario simulada → PALABRA gigante en caja → "te mando los N enlaces" → cuadrícula con todos los iconos de la lista (resumen visual). |

**Plantilla de cada ítem** (todo dentro de una única animación continua, sin cortes secos)
1. Esquina superior izquierda: contador `#03` en etiqueta negra; superior derecha: píldora fija con la categoría ("OPEN SOURCE").
2. Fila central: icono A (lo viejo) → **tachado rojo + sello "CANCELLED"** que cae con rebote → flecha que se dibuja →
   icono B (lo nuevo) con insignia de color ("FREE") que entra con spring.
3. Nombre de B en negra muy gruesa sobre **subrayado de color tipo rotulador**; debajo una línea:
   "sustituye a ~~A~~ (tachado rojo) · beneficio en 3–5 palabras".
4. Mitad inferior: "prueba" visual (en el original, captura de la web) en ventana de navegador **inclinada** que entra
   deslizando desde abajo, cursor que hace clic y un sello "+1" que aparece.
5. Barra de progreso **segmentada** al pie (un segmento por ítem) que avanza con la lista.

**Estilo**
- Paleta mínima: fondo claro con cuadrícula suave + negro + UN color de acento (amarillo) + rojo solo para "cancelar".
- Garabatos decorativos pequeños (estrellitas, rayitas, círculos) flotando en los márgenes: dan vida sin tapar nada.
- Sin cortes: los elementos salen y entran; el contador y la píldora se quedan fijos (continuidad).
- Voz en off + música casi sin pausas; ritmo muy rápido (~5 s por ítem).
- CTA de interacción ("comenta X") en vez de "sígueme": tarjeta de comentario + palabra gigante.

**Cómo llevarlo a este repo**
- Nuevo tipo de escena `swap` (A tachado → B) o dibujo `drawing` con `data: {from, to, tagline, index, total}`
  respetando la plantilla de calidad (volumen, contornos, brillo, sombra).
- Contador `#N` + barra de progreso segmentada como capa fija en reels tipo lista ("top N").
- Tachado + sello que cae con `spring` (rebote), flecha con `strokeDashoffset`, subrayado de rotulador detrás del título.
- La "prueba" inferior puede ser una tarjeta o mini gráfico propio (no capturas de terceros).
- Cierre: cuadrícula resumen con todos los elementos + CTA "comenta PALABRA" (la capa de HyperFrames puede animar la palabra).
- Encaja con temas de listas: herramientas, hábitos, errores, trucos, comparativas "antes → después".

---

## 2. "Explicador ilustrado" (escenas por plano con fondos pictóricos)
Ref.: reel de Instagram de @menteshipoteticas, "¿Qué pasaría si no pones el modo avión…?" (nov. 2026), 1:42, 60 fps.
- Un plano por idea, cortes al ritmo de la voz; ilustración vectorial semiplana (avión, altavoz, móvil, antenas)
  sobre fondos pictóricos (nubes y cielos de mapa de bits) con paralaje; globo 3D casi fotográfico con arcos.
- Movimiento: zooms y paneos de cámara suaves, anillos de pulso, ondas en zigzag, haces de luz, contador grande.
- Subtítulos arriba: palabras ya dichas en gris, palabra clave con recuadro de selección y tiradores (→ `captionStyle: "select"`).

## 3. "Mundo técnico continuo" (el que adoptamos: estilo "mundo continuo")
Ref.: reel de Instagram de @speedy_devv, "How does the touchscreen really work?" (nov. 2026), 1:25, 60 fps.
Hecho con su herramienta propia (getkeyframes.com, según la descripción del post).
- Casi sin cortes: un único escenario y la cámara viaja de la sección del cristal a la rejilla de cables, a la rejilla
  en perspectiva y al móvil inclinado. Eso es lo que da la sensación de fluidez (no los fps).
- Realismo: materiales con textura (piel con huella, guante de punto, metal, cristal), paleta casi negra con un solo
  color de luz (dorado), brillos que se derraman, perspectiva 3D y viñeteado.
- Datos dentro de la escena (valores que cambian donde toca el dedo, "120 scans a second" con fuente), etiquetas con
  líneas guía, aviso "Magnified illustration".
- Implementación aquí: `src/worlds/` (escena `world`), `transitionStyle: "fade"`, `captionStyle: "select"`.
