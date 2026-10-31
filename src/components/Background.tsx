import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Theme } from "../schema";

/** Fondo degradado con manchas de color que flotan y partículas. */
export const Background: React.FC<{ theme: Theme }> = ({ theme }) => {
  const f = useCurrentFrame();
  const blob = (x: number, y: number, size: number, color: string, speed: number, phase: number) => (
    <div
      style={{
        position: "absolute",
        left: x + Math.sin(f * speed + phase) * 120,
        top: y + Math.cos(f * speed * 0.8 + phase) * 160,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        filter: "blur(140px)",
        opacity: 0.45,
      }}
    />
  );
  const particles = Array.from({ length: 28 }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const x = (seed / 233280) * 1080;
    const speed = 0.6 + (i % 5) * 0.35;
    const y = 1920 - ((f * speed + i * 137) % 2100);
    const s = 4 + (i % 4) * 3;
    return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: theme.text, opacity: 0.12 + (i % 3) * 0.06 }} />;
  });
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${theme.bg1} 0%, ${theme.bg2} 100%)`, overflow: "hidden" }}>
      {blob(-200, 100, 700, theme.accent2, 0.012, 0)}
      {blob(500, 1100, 800, theme.accent, 0.009, 2)}
      {blob(300, 500, 500, theme.bg2, 0.015, 4)}
      {particles}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)" }} />
    </AbsoluteFill>
  );
};
