import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { emojiFont } from "../fonts";

/** Emoji grande que entra con rebote y luego flota. */
export const Emoji: React.FC<{ e?: string; size?: number; delay?: number }> = ({ e, size = 220, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!e) return null;
  const s = spring({ frame: frame - delay, fps, config: { damping: 9, stiffness: 120 } });
  const float = Math.sin((frame - delay) / 14) * 12;
  return (
    <div
      style={{
        fontFamily: emojiFont,
        fontSize: size,
        lineHeight: 1,
        transform: `translateY(${float}px) scale(${s}) rotate(${interpolate(s, [0, 1], [-25, 0])}deg)`,
        filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.35))",
      }}
    >
      {e}
    </div>
  );
};
