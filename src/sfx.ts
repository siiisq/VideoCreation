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
    case "outro": return scene.confetti ? [{ sound: "pop", at: 0.05 }, { sound: "sparkle", at: 0.3 }, { sound: "sparkle", at: 1.0 }] : [{ sound: "sparkle", at: 1.0 }];
    case "quote": return [];
    case "kpis": return scene.tiles.flatMap((_, i) => [{ sound: "pop" as const, at: f(8 + i * 10), volume: 0.5 }, ...(scene.tiles[i].delta ? [{ sound: "click" as const, at: f(53 + i * 10), volume: 0.5 }] : [])]);
    case "waffle": return [{ sound: "rise", at: f(20), volume: 0.5 }, { sound: "ding", at: f(80) }];
    case "dumbbell": return scene.rows.map((_, i): Cue => ({ sound: "click", at: f(22 + i * 7), volume: 0.5 })).concat([{ sound: "ding", at: f(52 + (scene.rows.length - 1) * 7), volume: 0.6 }]);
    case "linechart": return [{ sound: "rise", at: f(12), volume: 0.5 }, { sound: "ding", at: f(85), volume: 0.7 }];
    case "columns": return [{ sound: "rise", at: f(8), volume: 0.5 }, { sound: "ding", at: f(90), volume: 0.7 }];
    case "donut": return [{ sound: "whoosh", at: f(6), volume: 0.5 }, { sound: "pop", at: f(40), volume: 0.6 }];
    case "multibars": return scene.rows.map((_, i): Cue => ({ sound: "click", at: f(14 + i * 12), volume: 0.5 })).concat([{ sound: "ding", at: f(80), volume: 0.6 }]);
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
        case "mascot": case "bot": case "onion": c.push({ sound: "boing", at: 0.1 }); break;
        case "onion-cry": c.push(...[20, 28, 36].map((x): Cue => ({ sound: "pop", at: f(x), volume: 0.6 })), ...[0, 12, 24, 36].map((x): Cue => ({ sound: "click", at: f(x + 3), volume: 0.35 }))); break;
        case "onion-cells":
          if (d.cut) c.push({ sound: "whoosh", at: f(10), volume: 0.8 }, { sound: "sparkle", at: f(30), volume: 0.7 }, { sound: "rise", at: f(40), volume: 0.4 });
          else c.push({ sound: "pop", at: f(2), volume: 0.5 }, { sound: "pop", at: f(12), volume: 0.5 });
          break;
        case "gas-eye": c.push({ sound: "rise", at: 0.1, volume: 0.5 }, { sound: "boing", at: f(55), volume: 0.5 }); break;
        case "onion-tips": {
          const at = (Array.isArray(d.at) ? d.at : [0.3, 2.6, 5]) as number[];
          c.push(...at.map((x): Cue => ({ sound: "pop", at: x, volume: 0.7 })));
          break;
        }
        case "factories": {
          const n = Number(d.to ?? 44) - Number(d.from ?? 32);
          for (let j = 0; j < n; j += 2) c.push({ sound: "pop", at: f(55 + j * 5), volume: 0.5 });
          c.push({ sound: "ding", at: f(100) });
          break;
        }
        case "code": c.push(...[10, 19, 28, 37, 46, 55, 64].map((x) => ({ sound: "click" as const, at: f(x), volume: 0.5 })), { sound: "ding", at: f(95), volume: 0.7 }); break;
        case "queries": c.push({ sound: "whoosh", at: 0.1, volume: 0.4 }, { sound: "sparkle", at: f(85), volume: 0.6 }); break;
        case "users": c.push({ sound: "pop", at: f(5), volume: 0.5 }, { sound: "rise", at: f(35), volume: 0.4 }, { sound: "ding", at: f(90) }); break;
        case "speed": c.push({ sound: "rise", at: f(5), volume: 0.6 }, { sound: "whoosh", at: f(55), volume: 0.6 }, { sound: "ding", at: f(80) }); break;
      }
      return c;
    }
  }
};
