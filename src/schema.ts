import { z } from "zod";

export const SOUNDS = ["whoosh", "pop", "ding", "click", "rise", "boing", "sparkle"] as const;
const sfxItem = z.object({ sound: z.enum(SOUNDS), at: z.number().describe("segundos desde el inicio de la escena"), volume: z.number().optional() });
const base = {
  duration: z.number().min(1).max(30).describe("segundos (se alarga solo si la voz no cabe)"),
  sfx: z.array(sfxItem).optional().describe("efectos extra"),
  voice: z.string().optional().describe("frase que dice la voz en off en esta escena"),
  voiceFile: z.string().optional().describe("rellenado por scripts/tts.py"),
  voiceDuration: z.number().optional().describe("rellenado por scripts/tts.py"),
  overlay: z.string().optional().describe("vídeo con transparencia en public/ (p. ej. motion graphics de HyperFrames) encima de la escena"),
  transition: z.enum(["mix", "push", "iris", "whip", "flip", "clock"]).optional().describe("transición de entrada a esta escena (sobrescribe transitionStyle)"),
};

export const sceneSchema = z.discriminatedUnion("type", [
  // Gancho inicial: frase grande, palabra a palabra
  z.object({ type: z.literal("hook"), ...base, emoji: z.string().optional(), text: z.string(), highlight: z.array(z.string()).default([]),
    chart: z.array(z.number()).optional().describe("serie que se dibuja de fondo como línea ascendente") }),
  // Texto explicativo con título opcional
  z.object({ type: z.literal("text"), ...base, emoji: z.string().optional(), title: z.string().optional(), text: z.string(), highlight: z.array(z.string()).default([]) }),
  // Lista con viñetas que aparecen una a una
  z.object({ type: z.literal("list"), ...base, title: z.string(), items: z.array(z.object({ emoji: z.string().optional(), text: z.string() })).min(1).max(6) }),
  // Cifra grande que cuenta hacia arriba
  z.object({ type: z.literal("stat"), ...base, prefix: z.string().default(""), value: z.number(), suffix: z.string().default(""), decimals: z.number().default(0), label: z.string() }),
  // Comparación A vs B
  z.object({
    type: z.literal("compare"), ...base, title: z.string().optional(),
    left: z.object({ emoji: z.string().optional(), title: z.string(), text: z.string() }),
    right: z.object({ emoji: z.string().optional(), title: z.string(), text: z.string() }),
  }),
  // Pasos numerados
  z.object({ type: z.literal("steps"), ...base, title: z.string(), steps: z.array(z.string()).min(2).max(5) }),
  // Cita
  z.object({ type: z.literal("quote"), ...base, text: z.string(), author: z.string().optional() }),
  // Gráfico de barras animado
  z.object({ type: z.literal("bars"), ...base, title: z.string(), unit: z.string().default(""), bars: z.array(z.object({ label: z.string(), value: z.number(), emoji: z.string().optional() })).min(2).max(6) }),
  // Ilustración animada (ver src/drawings/Drawings.tsx) con título y texto
  z.object({
    type: z.literal("drawing"), ...base,
    drawing: z.string().describe("cups-vs | concentration | filter | beans | americano | mascot | energy | factories | code | queries | users | speed | bot"),
    data: z.record(z.unknown()).default({}),
    title: z.string().optional(),
    text: z.string().optional(),
    highlight: z.array(z.string()).default([]),
    bigTitle: z.boolean().default(false).describe("título enorme estilo gancho"),
    hideTitle: z.boolean().default(false).describe("reserva el hueco del título pero no lo pinta (p. ej. si lo pone un overlay)"),
    mascot: z.object({ mood: z.enum(["happy", "surprised", "wink", "thinking"]).optional(), say: z.string().optional(), side: z.enum(["left", "right"]).optional(), character: z.enum(["bean", "bot"]).optional() }).optional(),
  }),
  // ---- Gráficos de datos animados (src/scenes/Charts.tsx) ----
  z.object({ type: z.literal("kpis"), ...base, title: z.string().optional(), text: z.string().optional(),
    tiles: z.array(z.object({ value: z.number(), prefix: z.string().default(""), suffix: z.string().default(""), decimals: z.number().default(0), label: z.string(), delta: z.string().optional() })).min(1).max(6) }),
  z.object({ type: z.literal("waffle"), ...base, title: z.string().optional(), text: z.string().optional(), total: z.number().min(1).max(100), highlight: z.number(), decimals: z.number().default(0) }),
  z.object({ type: z.literal("dumbbell"), ...base, title: z.string().optional(), text: z.string().optional(), fromLabel: z.string(), toLabel: z.string(), showGrowth: z.boolean().default(true),
    rows: z.array(z.object({ label: z.string(), from: z.number(), to: z.number() })).min(1).max(7) }),
  z.object({ type: z.literal("linechart"), ...base, title: z.string().optional(), text: z.string().optional(), categories: z.array(z.string()),
    series: z.array(z.object({ name: z.string(), values: z.array(z.number()) })).min(1).max(3), unit: z.enum(["", "k", "M", "%"]).default(""), decimals: z.number().default(0),
    annotate: z.object({ index: z.number(), text: z.string() }).optional() }),
  z.object({ type: z.literal("columns"), ...base, title: z.string().optional(), text: z.string().optional(), categories: z.array(z.string()),
    series: z.array(z.object({ name: z.string(), values: z.array(z.number()) })).min(1).max(3), totals: z.array(z.object({ value: z.number(), label: z.string() })).optional() }),
  z.object({ type: z.literal("donut"), ...base, title: z.string().optional(), text: z.string().optional(), unit: z.string().default("%"), decimals: z.number().default(1),
    segments: z.array(z.object({ label: z.string(), value: z.number() })).min(1).max(6), center: z.object({ value: z.string(), label: z.string() }).optional() }),
  z.object({ type: z.literal("multibars"), ...base, title: z.string().optional(), text: z.string().optional(), metrics: z.array(z.string()).min(1).max(3),
    rows: z.array(z.object({ label: z.string(), values: z.array(z.number()) })).min(1).max(5) }),
  // Cierre / llamada a la acción
  z.object({ type: z.literal("outro"), ...base, emoji: z.string().optional(), text: z.string(), cta: z.string().optional(), confetti: z.boolean().default(false) }),
]);

export const themeSchema = z.object({
  bg1: z.string().default("#0f0c29"),
  bg2: z.string().default("#302b63"),
  accent: z.string().default("#ffcc00"),
  accent2: z.string().default("#ff5e9c"),
  text: z.string().default("#ffffff"),
});

export const reelSchema = z.object({
  title: z.string(),
  lang: z.enum(["es", "en"]).default("es").describe("es = español de España, en = inglés"),
  longForm: z.boolean().default(false).describe("permite pasar de 60 s (p. ej. resúmenes de presentaciones)"),
  overlay: z.string().optional().describe("capa de motion graphics (HyperFrames, WebM con alfa) encima de TODO el reel"),
  captions: z.boolean().default(false).describe("la capa trae subtítulos karaoke: oculta los textos de apoyo de cada escena"),
  hideHandleAtEnd: z.boolean().default(false).describe("oculta el @usuario en la última escena (si la capa trae tarjeta de seguir)"),
  hideCtaAtEnd: z.boolean().default(false).describe("oculta el botón CTA del outro (si la capa trae tarjeta de seguir)"),
  handle: z.string().optional().describe("@usuario que aparece abajo"),
  theme: themeSchema.default({}),
  fps: z.union([z.literal(30), z.literal(60)]).default(60),
  music: z.string().default("music/lofi.mp3").describe("archivo en public/; cadena vacía = sin música"),
  musicVolume: z.number().default(0.22),
  sfx: z.boolean().default(true).describe("efectos de sonido automáticos"),
  narrator: z.object({
    provider: z.enum(["auto", "google", "gemini", "elevenlabs", "kokoro"]).default("auto"),
    name: z.string().optional().describe("voz Kokoro; por defecto em_alex (es) / am_michael (en)"),
    speed: z.number().default(1.1),
    volume: z.number().default(1),
  }).default({}),
  sfxVolume: z.number().default(0.55),
  transitionStyle: z.enum(["grid", "mix", "push", "iris", "whip", "flip", "clock"]).default("mix")
    .describe("mix (por defecto) = rota círculo/barrido/giro/reloj; grid = rejilla de colores (el usuario NO la quiere); push descartada por el usuario"),
  lightLeaks: z.boolean().default(true),
  grain: z.boolean().default(true).describe("grano de película sutil (evita bandas en degradados)"),
  scenes: z.array(sceneSchema).min(1),
});

export type Reel = z.infer<typeof reelSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Theme = z.infer<typeof themeSchema>;
