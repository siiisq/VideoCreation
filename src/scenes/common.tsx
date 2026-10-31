import { ANIM_FPS, useFrame } from "../time";
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { body, display } from "../fonts";
import { Theme } from "../schema";

export const SAFE = { top: 260, bottom: 380, side: 80 }; // zonas seguras de Reels/TikTok

export const Stage: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 50 }) => {
  const frame = useFrame();
  const { durationInFrames, fps: realFps } = useVideoConfig();
  // leve zoom continuo para que nunca esté quieto
  const scale = interpolate(frame, [0, (durationInFrames * ANIM_FPS) / realFps], [1, 1.04]);
  return (
    <AbsoluteFill
      style={{
        padding: `${SAFE.top}px ${SAFE.side}px ${SAFE.bottom}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap,
        transform: `scale(${scale})`,
        fontFamily: body,
        textAlign: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const Title: React.FC<{ children: React.ReactNode; theme: Theme; delay?: number; size?: number }> = ({ children, theme, delay = 0, size = 78 }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const s = spring({ frame: frame - delay, fps, config: { damping: 15 } });
  return (
    <div style={{ fontFamily: display, fontWeight: 900, fontSize: size, lineHeight: 1.05, color: theme.text, textTransform: "uppercase", letterSpacing: -1, opacity: s, transform: `translateY(${(1 - s) * -40}px)` }}>
      {children}
      <div style={{ margin: "22px auto 0", height: 10, borderRadius: 5, width: `${s * 160}px`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})` }} />
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode; theme: Theme; delay?: number; style?: React.CSSProperties; from?: "left" | "right" | "bottom" }> = ({ children, theme, delay = 0, style, from = "bottom" }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 140 } });
  const off = (1 - s) * 200;
  const t = from === "left" ? `translateX(${-off}px)` : from === "right" ? `translateX(${off}px)` : `translateY(${off}px)`;
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.09)",
        border: "2px solid rgba(255,255,255,0.16)",
        borderRadius: 36,
        padding: "34px 40px",
        boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
        color: theme.text,
        opacity: s,
        transform: t,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
