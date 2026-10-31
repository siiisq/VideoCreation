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
      return <path key={i} d={`M ${tx} ${ty - 16} q 10 14 0 22 q -10 -8 0 -22 Z`} fill="#7fd6ff" opacity={1 - p * 0.6} />;
    })}
    <path d={`M ${x} ${y} q ${dir * 30} 20 ${dir * 55} 80`} stroke="#7fd6ff" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.7} />
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
      {/* cuerpo */}
      <path d={`M 0 ${-h * 0.95} C ${w * 0.25} ${-h * 0.6} ${w} ${-h * 0.35} ${w} ${h * 0.15} C ${w} ${h * 0.6} ${w * 0.5} ${h * 0.82} 0 ${h * 0.82} C ${-w * 0.5} ${h * 0.82} ${-w} ${h * 0.6} ${-w} ${h * 0.15} C ${-w} ${-h * 0.35} ${-w * 0.25} ${-h * 0.6} 0 ${-h * 0.95} Z`} fill={ONION.skin} stroke={ONION.line} strokeWidth={7} />
      {[-0.55, 0, 0.55].map((k, i) => <path key={i} d={`M 0 ${-h * 0.85} C ${w * k * 1.2} ${-h * 0.4} ${w * k * 1.3} ${h * 0.4} ${w * k * 0.5} ${h * 0.78}`} stroke={ONION.skinDark} strokeWidth={5} fill="none" opacity={0.6} />)}
      {/* brote */}
      <path d={`M 0 ${-h * 0.92} q -8 -40 -30 -60 M 0 ${-h * 0.92} q 10 -45 30 -70`} stroke="#5aa845" strokeWidth={10} fill="none" strokeLinecap="round" />
      {/* mejillas */}
      <ellipse cx={-w * 0.55} cy={h * 0.18} rx={18} ry={11} fill="#ff7a8a" opacity={0.6} />
      <ellipse cx={w * 0.55} cy={h * 0.18} rx={18} ry={11} fill="#ff7a8a" opacity={0.6} />
      {/* ojos */}
      {[-1, 1].map((d) => crying ? (
        <path key={d} d={`M ${d * w * 0.35 - 20} ${eyeY + 4} q 20 -16 40 0`} stroke="#3a1f05" strokeWidth={8} fill="none" strokeLinecap="round" />
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
