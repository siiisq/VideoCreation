import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** Texto que aparece palabra a palabra; las palabras en `highlight` se pintan con el acento. */
export const RichText: React.FC<{
  text: string;
  highlight?: string[];
  accent: string;
  delay?: number;
  perWord?: number;
  style?: React.CSSProperties;
}> = ({ text, highlight = [], accent, delay = 0, perWord = 3, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hl = new Set(highlight.flatMap((h) => h.split(/\s+/)).map(norm));
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: "0.28em", rowGap: "0.1em", ...style }}>
      {words.map((w, i) => {
        const s = spring({ frame: frame - delay - i * perWord, fps, config: { damping: 14, stiffness: 160 } });
        const isHl = hl.has(norm(w));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: interpolate(s, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px) scale(${interpolate(s, [0, 1], [0.8, 1])})`,
              color: isHl ? accent : undefined,
              textShadow: isHl ? `0 0 30px ${accent}88` : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};
