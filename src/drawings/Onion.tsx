import React from "react";
import { interpolate, spring } from "remotion";
import { body } from "../fonts";
import { ANIM_FPS, useFrame } from "../time";
import type { Mood } from "./Mascot";

export const ONION = { skin: "#e8b04a", skinDark: "#c98a2a", purple: "#a64ca6", line: "#7a4a12" };

/** Lágrimas que caen en chorro desde (x, y). */
export const TearStream: React.FC<{ x: number; y: number; dir?: number; t: number; amount?: number }> = ({ x, y, dir = 1, t, amount = 1 }) => (
  <g opacity={amount}>
    {Array.from({ length: 6 }, (_, i) => {
      const p = ((t * 1.4 + i * 9) % 54) / 54;
      const tx = x + dir * (p * 70 + Math.sin(p * 6) * 6);
      const ty = y + p * p * 260;
      return (
        <g key={i} transform={`translate(${tx} ${ty})`} opacity={1 - p * 0.5}>
          <path d="M 0 -18 C 7 -7 11 0 11 6 A 11 11 0 0 1 -11 6 C -11 0 -7 -7 0 -18 Z" fill="url(#tearGrad)" stroke="#4fb7ea" strokeWidth={1.5} />
          <ellipse cx={-3.5} cy={3} rx={2.6} ry={4} fill="#fff" opacity={0.9} />
        </g>
      );
    })}
    <path d={`M ${x} ${y} q ${dir * 30} 20 ${dir * 55} 80`} stroke="#bfeaff" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.55} />
  </g>
);

/** Cebolla con cara. mood "crying" añade lágrimas. */
export const Onion: React.FC<{ x: number; y: number; size?: number; mood?: Mood | "crying"; delay?: number; say?: string; flip?: boolean }> = ({ x, y, size = 150, mood = "happy", delay = 0, say, flip = false }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const f = frame - delay;
  const s = spring({ frame: f, fps, config: { damping: 8, stiffness: 120 } });
  const sob = mood === "crying" ? Math.abs(Math.sin(f / 4)) * 6 : 0;
  const bounce = mood === "crying" ? -sob : Math.abs(Math.sin(f / 7)) * -12;
  const blink = f % 75 > 70 ? 0.1 : 1;
  const w = size * 0.95, h = size;
  const eyeY = -h * 0.05;
  const bubbleS = spring({ frame: f - 12, fps, config: { damping: 11 } });
  const bw = say ? Math.min(560, 60 + say.length * 21) : 0;
  const crying = mood === "crying";
  return (
    <g transform={`translate(${x} ${y + bounce}) scale(${s * (flip ? -1 : 1)} ${s})`}>
      <ellipse cx={0} cy={h * 0.95 - bounce} rx={w * 0.8} ry={16} fill="#000" opacity={0.25} />
      {/* raíces */}
      {[-14, -5, 5, 14].map((dx, i) => <path key={i} d={`M ${dx} ${h * 0.78} q ${dx * 0.8} 20 ${dx * 1.4} 34`} stroke={ONION.line} strokeWidth={5} fill="none" strokeLinecap="round" />)}
      <defs>
        <radialGradient id="onionBody" cx="38%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#ffe3a3" /><stop offset="45%" stopColor="#f0b54e" /><stop offset="85%" stopColor="#c27a22" /><stop offset="100%" stopColor="#9a5a14" />
        </radialGradient>
        <linearGradient id="onionTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8a5a2b" /><stop offset="100%" stopColor="#c98a3a" stopOpacity={0} /></linearGradient>
        <linearGradient id="sprout" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#3f8a2e" /><stop offset="100%" stopColor="#9fe07a" /></linearGradient>
        <linearGradient id="tearGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} /><stop offset="100%" stopColor="#7fd6ff" /></linearGradient>
        <clipPath id="onionClip"><path d={`M 0 ${-h * 0.95} C ${w * 0.25} ${-h * 0.6} ${w} ${-h * 0.35} ${w} ${h * 0.15} C ${w} ${h * 0.6} ${w * 0.5} ${h * 0.82} 0 ${h * 0.82} C ${-w * 0.5} ${h * 0.82} ${-w} ${h * 0.6} ${-w} ${h * 0.15} C ${-w} ${-h * 0.35} ${-w * 0.25} ${-h * 0.6} 0 ${-h * 0.95} Z`} /></clipPath>
      </defs>
      {/* cuerpo */}
      <path d={`M 0 ${-h * 0.95} C ${w * 0.25} ${-h * 0.6} ${w} ${-h * 0.35} ${w} ${h * 0.15} C ${w} ${h * 0.6} ${w * 0.5} ${h * 0.82} 0 ${h * 0.82} C ${-w * 0.5} ${h * 0.82} ${-w} ${h * 0.6} ${-w} ${h * 0.15} C ${-w} ${-h * 0.35} ${-w * 0.25} ${-h * 0.6} 0 ${-h * 0.95} Z`} fill="url(#onionBody)" />
      <g clipPath="url(#onionClip)">
        {[-0.75, -0.4, 0, 0.4, 0.75].map((k, i) => <path key={i} d={`M 0 ${-h * 0.9} C ${w * k * 1.25} ${-h * 0.45} ${w * k * 1.35} ${h * 0.4} ${w * k * 0.55} ${h * 0.85}`} stroke={i % 2 ? "#fff1c9" : "#a8641c"} strokeWidth={i % 2 ? 4 : 5} fill="none" opacity={i % 2 ? 0.45 : 0.4} />)}
        <rect x={-w} y={-h} width={w * 2} height={h * 0.55} fill="url(#onionTop)" opacity={0.55} />
        <ellipse cx={-w * 0.45} cy={-h * 0.25} rx={w * 0.18} ry={h * 0.32} fill="#fff" opacity={0.28} transform={`rotate(20 ${-w * 0.45} ${-h * 0.25})`} />
        <path d={`M ${w * 0.95} ${-h * 0.1} C ${w * 0.95} ${h * 0.5} ${w * 0.5} ${h * 0.8} 0 ${h * 0.82}`} stroke="#7a3f0c" strokeWidth={18} fill="none" opacity={0.25} />
      </g>
      <path d={`M 0 ${-h * 0.95} C ${w * 0.25} ${-h * 0.6} ${w} ${-h * 0.35} ${w} ${h * 0.15} C ${w} ${h * 0.6} ${w * 0.5} ${h * 0.82} 0 ${h * 0.82} C ${-w * 0.5} ${h * 0.82} ${-w} ${h * 0.6} ${-w} ${h * 0.15} C ${-w} ${-h * 0.35} ${-w * 0.25} ${-h * 0.6} 0 ${-h * 0.95} Z`} fill="none" stroke={ONION.line} strokeWidth={6} />
      {/* brote con hojas */}
      <path d={`M -4 ${-h * 0.9} C -10 ${-h * 1.05} -30 ${-h * 1.15} -46 ${-h * 1.28} C -26 ${-h * 1.24} -8 ${-h * 1.1} 2 ${-h * 0.92} Z`} fill="url(#sprout)" stroke="#2f6b22" strokeWidth={3} />
      <path d={`M 2 ${-h * 0.9} C 8 ${-h * 1.1} 26 ${-h * 1.25} 40 ${-h * 1.4} C 30 ${-h * 1.2} 16 ${-h * 1.05} 8 ${-h * 0.9} Z`} fill="url(#sprout)" stroke="#2f6b22" strokeWidth={3} />
      {/* mejillas */}
      <ellipse cx={-w * 0.55} cy={h * 0.18} rx={18} ry={11} fill="#ff7a8a" opacity={0.6} />
      <ellipse cx={w * 0.55} cy={h * 0.18} rx={18} ry={11} fill="#ff7a8a" opacity={0.6} />
      {/* ojos */}
      {[-1, 1].map((d) => crying ? (
        <g key={d}>
          <path d={`M ${d * w * 0.35 - 22} ${eyeY + 2} q 22 -18 44 0`} stroke="#3a1f05" strokeWidth={8} fill="none" strokeLinecap="round" />
          <path d={`M ${d * w * 0.35 - 18} ${eyeY + 8} q 18 10 36 0`} stroke="#7fd6ff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.9} />
          <path d={`M ${d * w * 0.35 - 24} ${eyeY - 30} l ${d * 18} 8`} stroke="#3a1f05" strokeWidth={6} strokeLinecap="round" />
        </g>
      ) : mood === "wink" && d === 1 ? (
        <path key={d} d={`M ${d * w * 0.35 - 16} ${eyeY} q 16 -12 32 0`} stroke="#3a1f05" strokeWidth={7} fill="none" strokeLinecap="round" />
      ) : (
        <g key={d} transform={`translate(${d * w * 0.35} ${eyeY}) scale(1 ${blink})`}>
          <ellipse rx={mood === "surprised" ? 21 : 18} ry={mood === "surprised" ? 25 : 21} fill="#fff" />
          <circle cx={3} cy={3} r={10} fill="#3a1f05" />
          <circle cx={6} cy={-1} r={3.5} fill="#fff" />
        </g>
      ))}
      {/* boca */}
      {crying
        ? <path d={`M -28 ${h * 0.38} Q 0 ${h * 0.22} 28 ${h * 0.38}`} stroke="#3a1f05" strokeWidth={8} fill="#5a1414" strokeLinejoin="round" transform={`scale(1 ${1 + sob * 0.04})`} />
        : mood === "surprised"
          ? <ellipse cx={0} cy={h * 0.32} rx={14} ry={20} fill="#5a1414" />
          : <path d={`M -26 ${h * 0.24} Q 0 ${h * 0.5} 26 ${h * 0.24} Z`} fill="#5a1414" stroke="#3a1f05" strokeWidth={4} />}
      {crying && <>
        <TearStream x={-w * 0.35 - 10} y={eyeY + 10} dir={-1} t={f} />
        <TearStream x={w * 0.35 + 10} y={eyeY + 10} dir={1} t={f + 20} />
      </>}
      {say && (
        <g transform={`translate(${flip ? -size * 0.2 : size * 0.2} ${-h * 1.35}) scale(${(flip ? -1 : 1) * bubbleS} ${bubbleS})`} opacity={interpolate(bubbleS, [0, 0.3], [0, 1], { extrapolateRight: "clamp" })}>
          <rect x={-bw / 2} y={-62} width={bw} height={84} rx={42} fill="#fff" />
          <path d="M -20 18 L -40 52 L 6 20 Z" fill="#fff" />
          <text x={0} y={-6} textAnchor="middle" fontFamily={body} fontWeight={800} fontSize={36} fill="#3a1f05">{say}</text>
        </g>
      )}
    </g>
  );
};
