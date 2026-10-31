import { Scene, SOUNDS } from "./schema";

export type Cue = { sound: (typeof SOUNDS)[number]; at: number; volume?: number };

/** Efectos de sonido automáticos por tipo de escena (segundos desde el inicio de la escena). */
export const autoCues = (scene: Scene): Cue[] => {
  const f = (frames30: number) => frames30 / 30;
  switch (scene.type) {
    case "hook": return [{ sound: "pop", at: 0.15 }];
    case "text": return scene.emoji ? [{ sound: "pop", at: 0.1, volume: 0.7 }] : [];
    case "list": {
      const step = Math.min(36, (scene.duration * 30 - 30) / scene.items.length);
      return scene.items.map((_, i) => ({ sound: "pop" as const, at: f(14 + i * step), volume: 0.7 }));
    }
    case "steps": {
      const step = Math.min(45, (scene.duration * 30 - 30) / scene.steps.length);
      return scene.steps.map((_, i) => ({ sound: "click" as const, at: f(14 + i * step) }));
    }
    case "stat": return [{ sound: "rise", at: 0.1, volume: 0.5 }, { sound: "ding", at: 1.8 }];
    case "compare": return [{ sound: "pop", at: f(8) }, { sound: "boing", at: f(24), volume: 0.6 }, { sound: "pop", at: f(30) }];
    case "bars": return [{ sound: "rise", at: 0.3, volume: 0.6 }];
    case "outro": return [{ sound: "sparkle", at: 1.0 }];
    case "quote": return [];
    case "drawing": {
      const c: Cue[] = [];
      const d = scene.data as Record<string, unknown>;
      if (scene.mascot) c.push({ sound: "boing", at: f(25), volume: 0.6 });
      switch (scene.drawing) {
        case "cups-vs":
          if (d.question) c.push(...[20, 28, 36].map((x) => ({ sound: "pop" as const, at: f(x), volume: 0.7 })));
          if (typeof d.leftMg === "number") c.push({ sound: "ding", at: f(70), volume: 0.6 }, { sound: "ding", at: f(95) });
          break;
        case "concentration": c.push({ sound: "sparkle", at: 1.0, volume: 0.6 }); break;
        case "filter": c.push({ sound: "rise", at: 0.2, volume: 0.4 }); break;
        case "beans": c.push(...[10, 22, 30, 42, 54].map((x) => ({ sound: "click" as const, at: f(x), volume: 0.6 }))); break;
        case "americano": c.push({ sound: "whoosh", at: f(45), volume: 0.5 }, { sound: "ding", at: f(120) }); break;
        case "energy": c.push({ sound: "sparkle", at: f(20) }); break;
        case "mascot": c.push({ sound: "boing", at: 0.1 }); break;
      }
      return c;
    }
  }
};
