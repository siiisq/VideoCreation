import { z } from "zod";
import { SOUNDS, themeSchema } from "../schema";

const rect = { x: z.number().min(0).max(1), y: z.number().min(0).max(1), w: z.number().min(0).max(1), h: z.number().min(0).max(1) };

const voiced = {
  voice: z.string().default("").describe("narración"),
  voiceFile: z.string().optional(),
  voiceDuration: z.number().optional(),
  duration: z.number().min(1).max(600).default(5),
};

export const slideSchema = z.object({
  image: z.string().describe("ruta en public/, p.ej. slides/charla/slide-01.png"),
  ...voiced,
  title: z.string().optional().describe("titular encima de la diapositiva (formato vertical/cuadrado)"),
  // Zoom suave hacia una zona de la diapositiva (coordenadas 0–1 relativas a la diapositiva)
  focus: z.object({ ...rect, at: z.number().default(1), until: z.number().optional(), word: z.string().optional(), untilWord: z.string().optional() }).nullable().optional(),
  // Marcadores animados sobre la diapositiva
  highlights: z.array(z.object({ ...rect, at: z.number().default(1), word: z.string().optional().describe("aparece cuando la voz dice esta palabra"), style: z.enum(["box", "underline", "circle"]).default("box"), color: z.string().optional() })).default([]),
  sfx: z.array(z.object({ sound: z.enum(SOUNDS), at: z.number(), volume: z.number().optional() })).optional(),
});

export const presentationSchema = z.object({
  title: z.string(),
  lang: z.enum(["es", "en"]).default("es"),
  format: z.enum(["landscape", "vertical", "square"]).default("landscape"),
  fps: z.union([z.literal(30), z.literal(60)]).default(30),
  aspect: z.number().default(16 / 9).describe("ancho/alto de las diapositivas"),
  handle: z.string().optional(),
  theme: themeSchema.default({}),
  music: z.string().default("music/lofi.mp3"),
  musicVolume: z.number().default(0.12),
  sfx: z.boolean().default(true),
  sfxVolume: z.number().default(0.35),
  captions: z.boolean().default(true).describe("subtítulos de la narración"),
  narrator: z.object({ name: z.string().optional(), speed: z.number().default(1.05), volume: z.number().default(1) }).default({}),
  intro: z.object({ title: z.string(), subtitle: z.string().default(""), ...voiced, duration: z.number().default(3.5) }).nullable().optional(),
  slides: z.array(slideSchema).min(1),
  outro: z.object({ text: z.string().default(""), cta: z.string().default(""), ...voiced, duration: z.number().default(4) }).nullable().optional(),
});

export type Presentation = z.infer<typeof presentationSchema>;
export type Slide = z.infer<typeof slideSchema>;

export const FORMATS = {
  landscape: { width: 1920, height: 1080 },
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
} as const;
