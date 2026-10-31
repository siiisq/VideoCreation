import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { body } from "../fonts";

export type Mood = "happy" | "surprised" | "wink" | "thinking";

/** Mascota: grano de café con cara, brazos y piernas. Coordenadas: centro (x, y). */
export const Mascot: React.FC<{ x: number; y: number; size?: number; mood?: Mood; delay?: number; say?: string; accent?: string; flip?: boolean }> = ({ x, y, size = 120, mood = "happy", delay = 0, say, accent = "#ffcc00", flip = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - delay;
  const s = spring({ frame: f, fps, config: { damping: 8, stiffness: 120 } });
  const bounce = Math.abs(Math.sin(f / 7)) * -14;
  const blink = f % 75 > 70 ? 0.1 : 1;
  const wave = Math.sin(f / 4) * 25;
  const w = size * 0.62;
  const eyeY = -size * 0.18;
  const eye = (ex: number, wink: boolean) => (
    <g>
      {wink ? (
        <path d={`M ${ex - 14} ${eyeY} q 14 -12 28 0`} stroke="#1a0d05" strokeWidth={7} fill="none" strokeLinecap="round" />
      ) : (
        <g transform={`translate(${ex} ${eyeY}) scale(1 ${blink})`}>
          <ellipse rx={mood === "surprised" ? 20 : 17} ry={mood === "surprised" ? 24 : 20} fill="#fff" />
          <circle cx={mood === "thinking" ? 6 : 3} cy={mood === "thinking" ? -7 : 3} r={10} fill="#1a0d05" />
          <circle cx={mood === "thinking" ? 9 : 6} cy={mood === "thinking" ? -10 : -1} r={3.5} fill="#fff" />
        </g>
      )}
    </g>
  );
  const mouth =
    mood === "surprised" ? <ellipse cx={0} cy={size * 0.22} rx={14} ry={20} fill="#3b0d0d" /> :
    mood === "thinking" ? <path d={`M -16 ${size * 0.24} q 16 -8 32 0`} stroke="#1a0d05" strokeWidth={7} fill="none" strokeLinecap="round" /> :
    <path d={`M -26 ${size * 0.14} Q 0 ${size * 0.42} 26 ${size * 0.14} Z`} fill="#3b0d0d" stroke="#1a0d05" strokeWidth={4} strokeLinejoin="round" />;
  const bubbleS = spring({ frame: f - 12, fps, config: { damping: 11 } });
  const bw = say ? Math.min(560, 60 + say.length * 21) : 0;
  return (
    <g transform={`translate(${x} ${y + bounce}) scale(${s * (flip ? -1 : 1)} ${s})`}>
      <ellipse cx={0} cy={size * 1.12 - bounce} rx={w * 0.9} ry={14} fill="#000" opacity={0.25} />
      {/* piernas */}
      <path d={`M -${w * 0.35} ${size * 0.85} l -8 ${size * 0.25} h -22`} stroke="#2a1608" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${w * 0.35} ${size * 0.85} l 8 ${size * 0.25} h 22`} stroke="#2a1608" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* brazos */}
      <path d={`M -${w * 0.92} ${size * 0.1} q -40 10 -55 ${-30}`} stroke="#2a1608" strokeWidth={12} fill="none" strokeLinecap="round" />
      <g transform={`rotate(${wave} ${w * 0.92} ${size * 0.1})`}>
        <path d={`M ${w * 0.92} ${size * 0.1} q 40 -10 55 -55`} stroke="#2a1608" strokeWidth={12} fill="none" strokeLinecap="round" />
      </g>
      {/* cuerpo */}
      <ellipse rx={w} ry={size} fill="#7a4421" stroke="#2a1608" strokeWidth={8} />
      <ellipse rx={w} ry={size} fill="url(#beanShine)" />
      <path d={`M 0 ${-size * 0.92} C ${w * 0.45} ${-size * 0.55} ${-w * 0.2} ${-size * 0.45} ${w * 0.1} ${-size * 0.38}`} stroke="#2a1608" strokeWidth={8} fill="none" strokeLinecap="round" />
      <ellipse cx={-w * 0.6} cy={size * 0.08} rx={14} ry={9} fill="#ff7a8a" opacity={0.7} />
      <ellipse cx={w * 0.6} cy={size * 0.08} rx={14} ry={9} fill="#ff7a8a" opacity={0.7} />
      {eye(-w * 0.38, false)}
      {eye(w * 0.38, mood === "wink")}
      {mouth}
      {say && (
        <g transform={`translate(${flip ? -size * 0.2 : size * 0.2} ${-size * 1.25}) scale(${(flip ? -1 : 1) * bubbleS} ${bubbleS})`} opacity={interpolate(bubbleS, [0, 0.3], [0, 1], { extrapolateRight: "clamp" })}>
          <rect x={-bw / 2} y={-62} width={bw} height={84} rx={42} fill="#fff" />
          <path d="M -20 18 L -40 52 L 6 20 Z" fill="#fff" />
          <text x={0} y={-6} textAnchor="middle" fontFamily={body} fontWeight={800} fontSize={36} fill="#1a0d05">{say}</text>
        </g>
      )}
    </g>
  );
};
