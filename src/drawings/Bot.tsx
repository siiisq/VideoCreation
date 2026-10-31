import React from "react";
import { interpolate, spring } from "remotion";
import { body } from "../fonts";
import { ANIM_FPS, useFrame } from "../time";
import type { Mood } from "./Mascot";

/** Mascota robot (para temas de tecnología/datos). Misma API que Mascot. */
export const Bot: React.FC<{ x: number; y: number; size?: number; mood?: Mood; delay?: number; say?: string; accent?: string; flip?: boolean }> = ({ x, y, size = 120, mood = "happy", delay = 0, say, accent = "#E97132", flip = false }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const f = frame - delay;
  const s = spring({ frame: f, fps, config: { damping: 8, stiffness: 120 } });
  const hover = Math.sin(f / 9) * 10;
  const blink = f % 80 > 75 ? 0.15 : 1;
  const wave = Math.sin(f / 4) * 28;
  const w = size * 1.25, h = size * 1.0;
  const light = (Math.floor(f / 8) % 2) ? accent : "#ffe9a8";
  const eyeH = mood === "surprised" ? 26 : mood === "thinking" ? 10 : 22;
  const bubbleS = spring({ frame: f - 12, fps, config: { damping: 11 } });
  const bw = say ? Math.min(600, 60 + say.length * 21) : 0;
  return (
    <g transform={`translate(${x} ${y + hover}) scale(${s * (flip ? -1 : 1)} ${s})`}>
      <ellipse cx={0} cy={h * 1.35 - hover} rx={w * 0.45} ry={12} fill="#000" opacity={0.25} />
      {/* antena */}
      <line x1={0} y1={-h * 0.55} x2={0} y2={-h * 0.85} stroke="#9fb3c8" strokeWidth={8} strokeLinecap="round" />
      <circle cx={0} cy={-h * 0.9} r={13} fill={light} style={{ filter: `drop-shadow(0 0 10px ${light})` }} />
      {/* brazos */}
      <path d={`M ${-w * 0.5} ${h * 0.25} q -45 15 -60 -25`} stroke="#9fb3c8" strokeWidth={14} fill="none" strokeLinecap="round" />
      <g transform={`rotate(${wave} ${w * 0.5} ${h * 0.25})`}>
        <path d={`M ${w * 0.5} ${h * 0.25} q 45 -15 60 -60`} stroke="#9fb3c8" strokeWidth={14} fill="none" strokeLinecap="round" />
      </g>
      {/* cuerpo */}
      <rect x={-w * 0.38} y={h * 0.4} width={w * 0.76} height={h * 0.75} rx={24} fill="#dfe8f1" stroke="#7f95ab" strokeWidth={6} />
      <circle cx={0} cy={h * 0.78} r={16} fill={accent} />
      {/* cabeza */}
      <rect x={-w * 0.5} y={-h * 0.55} width={w} height={h * 0.95} rx={36} fill="#eef3f8" stroke="#7f95ab" strokeWidth={6} />
      <rect x={-w * 0.4} y={-h * 0.42} width={w * 0.8} height={h * 0.68} rx={24} fill="#0e2841" />
      {/* ojos */}
      {[-1, 1].map((d) => (
        mood === "wink" && d === 1
          ? <path key={d} d={`M ${d * w * 0.17 - 16} ${-h * 0.1} q 16 -14 32 0`} stroke="#6ff3ff" strokeWidth={7} fill="none" strokeLinecap="round" />
          : <rect key={d} x={d * w * 0.17 - 13} y={-h * 0.1 - (eyeH * blink) / 2} width={26} height={eyeH * blink} rx={10} fill="#6ff3ff" style={{ filter: "drop-shadow(0 0 8px #6ff3ff)" }} />
      ))}
      {/* boca */}
      {mood === "surprised"
        ? <circle cx={0} cy={h * 0.12} r={10} fill="#6ff3ff" />
        : <path d={`M -22 ${h * 0.08} q 22 ${mood === "thinking" ? 0 : 18} 44 0`} stroke="#6ff3ff" strokeWidth={6} fill="none" strokeLinecap="round" />}
      {say && (
        <g transform={`translate(${flip ? -size * 0.2 : size * 0.2} ${-h * 1.35}) scale(${(flip ? -1 : 1) * bubbleS} ${bubbleS})`} opacity={interpolate(bubbleS, [0, 0.3], [0, 1], { extrapolateRight: "clamp" })}>
          <rect x={-bw / 2} y={-62} width={bw} height={84} rx={42} fill="#fff" />
          <path d="M -20 18 L -40 52 L 6 20 Z" fill="#fff" />
          <text x={0} y={-6} textAnchor="middle" fontFamily={body} fontWeight={800} fontSize={36} fill="#0e2841">{say}</text>
        </g>
      )}
    </g>
  );
};
