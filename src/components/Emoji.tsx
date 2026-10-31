import { ANIM_FPS, useFrame } from "../time";
import React from "react";
import { Img, interpolate, spring, staticFile } from "remotion";
import { emojiFont } from "../fonts";
import index from "../emoji-index.generated.json";

const key = (e: string) => [...e.replace(/️/g, "")].map((c) => c.codePointAt(0)!.toString(16)).join("-");
const available = index as Record<string, string>;

/** Emoji estático: SVG 3D de Fluent si existe (ver scripts/emoji-assets.mjs), si no, fuente del sistema. */
export const EmojiGlyph: React.FC<{ e: string; size: number; style?: React.CSSProperties }> = ({ e, size, style }) => {
  const k = key(e);
  if (available[k]) {
    return <Img src={staticFile(`emoji/${k}.svg`)} style={{ width: size, height: size, display: "inline-block", verticalAlign: "middle", ...style }} />;
  }
  return <span style={{ fontFamily: emojiFont, fontSize: size * 0.9, lineHeight: 1, display: "inline-block", ...style }}>{e}</span>;
};

/** Emoji grande que entra con rebote, luego flota y se balancea. */
export const Emoji: React.FC<{ e?: string; size?: number; delay?: number }> = ({ e, size = 220, delay = 0 }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  if (!e) return null;
  const f = frame - delay;
  const s = spring({ frame: f, fps, config: { damping: 9, stiffness: 120 } });
  const float = Math.sin(f / (fps * 0.45)) * 12;
  const sway = Math.sin(f / (fps * 0.7)) * 5;
  const squash = 1 + Math.sin(f / (fps * 0.45)) * 0.025;
  return (
    <div style={{ transform: `translateY(${float}px) scale(${s * squash}, ${s / squash}) rotate(${interpolate(s, [0, 1], [-25, 0]) + sway}deg)`, filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.4))" }}>
      <EmojiGlyph e={e} size={size} />
    </div>
  );
};
