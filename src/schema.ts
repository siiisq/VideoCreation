import { z } from "zod";

const base = { duration: z.number().min(1).max(20).describe("segundos") };

export const sceneSchema = z.discriminatedUnion("type", [
  // Gancho inicial: frase grande, palabra a palabra
  z.object({ type: z.literal("hook"), ...base, emoji: z.string().optional(), text: z.string(), highlight: z.array(z.string()).default([]) }),
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
  // Cierre / llamada a la acción
  z.object({ type: z.literal("outro"), ...base, emoji: z.string().optional(), text: z.string(), cta: z.string().optional() }),
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
  handle: z.string().optional().describe("@usuario que aparece abajo"),
  theme: themeSchema.default({}),
  music: z.string().optional().describe("archivo en public/, p.ej. music.mp3"),
  musicVolume: z.number().default(0.25),
  scenes: z.array(sceneSchema).min(1),
});

export type Reel = z.infer<typeof reelSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Theme = z.infer<typeof themeSchema>;
