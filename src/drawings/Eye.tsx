import React from "react";
import { interpolate } from "remotion";
import { useFrame } from "../time";

/** x de la curva de Bézier del párpado (P0=-W, P1=-0.55W, P2=0.55W, P3=W). */
const bez = (k: number, W: number) => -W * (1 - k) ** 3 - 3 * (1 - k) ** 2 * k * 0.55 * W + 3 * (1 - k) * k * k * 0.55 * W + k ** 3 * W;

/**
 * Ojo detallado: párpados que parpadean, iris con fibras, brillos, venitas al irritarse
 * y lágrimas que se acumulan en el párpado inferior y luego caen.
 * irritation 0–1 (enrojece, entrecierra y llora). (x, y) = centro.
 */
export const Eye: React.FC<{ x: number; y: number; w?: number; irritation?: number; iris?: string; lookX?: number; lookY?: number }> = ({ x, y, w = 520, irritation = 0, iris = "#3f8fd8", lookX = 0, lookY = 0 }) => {
  const t = useFrame();
  const W = w / 2;
  const H = W * 0.62;
  // parpadeo cada ~2,7 s; con irritación parpadea más y entrecierra
  const period = irritation > 0.5 ? 40 : 80;
  const ph = t % period;
  const blink = ph > period - 7 ? Math.sin(((ph - (period - 7)) / 7) * Math.PI) : 0;
  const open = Math.max(0.06, (1 - 0.42 * irritation) * (1 - blink * 0.95));
  const up = -H * 1.05 * open;         // control del párpado superior
  const low = H * 0.78 * Math.max(0.35, open);
  const lidTop = `M ${-W} 0 C ${-W * 0.55} ${up} ${W * 0.55} ${up} ${W} 0`;
  const lidBot = `C ${W * 0.55} ${low} ${-W * 0.55} ${low} ${-W} 0`;
  const almond = `${lidTop} ${lidBot} Z`;
  const R = H * 0.95; // radio del iris
  const ix = lookX * W * 0.25, iy = lookY * H * 0.2;
  const pupil = R * (0.38 - 0.06 * irritation);
  const red = irritation;
  const id = `eye${Math.round(x)}${Math.round(y)}`;
  const tearPool = interpolate(irritation, [0.35, 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${id}skin`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#f7c9a8" stopOpacity={0.95} /><stop offset="45%" stopColor="#eeb593" stopOpacity={0.75} /><stop offset="80%" stopColor="#e9a985" stopOpacity={0.2} /><stop offset="100%" stopColor="#e9a985" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}sclera`} cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor={red > 0.3 ? "#fff1ef" : "#ffffff"} /><stop offset="70%" stopColor={red > 0.3 ? "#f6d3cf" : "#eef1f5"} /><stop offset="100%" stopColor={red > 0.3 ? "#e9a9a3" : "#c7cfd9"} />
        </radialGradient>
        <radialGradient id={`${id}iris`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#b9f0ff" /><stop offset="38%" stopColor="#7cc7f2" /><stop offset="75%" stopColor={iris} /><stop offset="100%" stopColor="#123c6e" />
        </radialGradient>
        <linearGradient id={`${id}shadow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a3a3a" stopOpacity={0.45} /><stop offset="40%" stopColor="#5a3a3a" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}tear`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} /><stop offset="100%" stopColor="#7fd6ff" stopOpacity={0.85} />
        </linearGradient>
        <clipPath id={`${id}clip`}><path d={almond} /></clipPath>
      </defs>
      {/* piel alrededor + ceja */}
      <ellipse cx={0} cy={-H * 0.05} rx={W * 1.45} ry={H * 1.55} fill={`url(#${id}skin)`} />
      <path d={`M ${-W * 0.9} ${-H * 1.15 - red * 6} Q ${-W * 0.2} ${-H * 1.6 + red * 14} ${W * 0.85} ${-H * 1.25 - red * 12}`} stroke="#5b3a24" strokeWidth={H * 0.16} strokeLinecap="round" fill="none" />
      <path d={`M ${-W * 0.9} ${-H * 1.15 - red * 6} Q ${-W * 0.2} ${-H * 1.6 + red * 14} ${W * 0.85} ${-H * 1.25 - red * 12}`} stroke="#8a5a3a" strokeWidth={H * 0.05} strokeLinecap="round" fill="none" opacity={0.6} transform={`translate(0 ${-H * 0.03})`} />
      {/* pliegue del párpado */}
      <path d={`M ${-W * 0.85} ${-H * 0.45} C ${-W * 0.4} ${-H * 1.35} ${W * 0.4} ${-H * 1.35} ${W * 0.85} ${-H * 0.45}`} stroke="#c9826a" strokeWidth={5} fill="none" opacity={0.7} />
      {/* globo ocular recortado por los párpados */}
      <g clipPath={`url(#${id}clip)`}>
        <rect x={-W} y={-H * 1.2} width={W * 2} height={H * 2.4} fill={`url(#${id}sclera)`} />
        {/* venitas */}
        {red > 0.05 && [[-1, -0.2], [-1, 0.35], [1, -0.1], [1, 0.4], [-1, 0.05]].map(([side, yy], i) => (
          <path key={i} d={`M ${side * W} ${yy * H} q ${-side * W * 0.18} ${-H * 0.12} ${-side * W * 0.32} ${H * 0.05} m ${side * W * 0.12} ${-H * 0.03} l ${-side * W * 0.08} ${-H * 0.16}`} stroke="#d63b3b" strokeWidth={3} fill="none" opacity={red * 0.85} strokeLinecap="round" />
        ))}
        {/* iris */}
        <g transform={`translate(${ix} ${iy})`}>
          <circle r={R} fill={`url(#${id}iris)`} />
          {Array.from({ length: 40 }, (_, i) => {
            const a = (i / 40) * Math.PI * 2;
            const r0 = pupil * 1.05, r1 = R * (0.86 + (i % 3) * 0.04);
            return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a + 0.05) * r1} y2={Math.sin(a + 0.05) * r1} stroke={i % 2 ? "#ffffff" : "#0e3a66"} strokeWidth={i % 2 ? 1.6 : 2.4} opacity={i % 2 ? 0.35 : 0.45} />;
          })}
          <circle r={R * 0.62} fill="none" stroke="#f2c14e" strokeWidth={R * 0.07} opacity={0.35} />
          <circle r={R} fill="none" stroke="#0b2a4a" strokeWidth={R * 0.09} />
          <circle r={pupil} fill="#05080d" />
          <ellipse cx={R * 0.32} cy={-R * 0.36} rx={R * 0.2} ry={R * 0.15} fill="#fff" opacity={0.95} />
          <circle cx={-R * 0.3} cy={R * 0.32} r={R * 0.07} fill="#fff" opacity={0.8} />
        </g>
        {/* sombra del párpado superior sobre el ojo */}
        <rect x={-W} y={-H * 1.2} width={W * 2} height={H * 2.4} fill={`url(#${id}shadow)`} />
        {/* menisco de lágrima sobre el párpado inferior */}
        {tearPool > 0 && <path d={`M ${-W * 0.8} ${low * 0.42} C ${-W * 0.4} ${low * 0.8} ${W * 0.4} ${low * 0.8} ${W * 0.85} ${low * 0.4} L ${W * 0.85} ${low * 0.4 + 18 * tearPool} C ${W * 0.4} ${low * 0.8 + 22 * tearPool} ${-W * 0.4} ${low * 0.8 + 22 * tearPool} ${-W * 0.8} ${low * 0.42 + 16 * tearPool} Z`} fill={`url(#${id}tear)`} opacity={0.8 * tearPool} />}
      </g>
      {/* línea de agua rosada + contorno de párpados */}
      <path d={`M ${W} 0 ${lidBot}`} stroke="#e98b8b" strokeWidth={7} fill="none" />
      <path d={lidTop} stroke="#2b1a12" strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d={`M ${W} 0 ${lidBot}`} stroke="#b97864" strokeWidth={4} fill="none" opacity={0.8} />
      {/* lagrimal */}
      <ellipse cx={-W * 0.97} cy={2} rx={10} ry={8} fill="#f08f9a" />
      {/* pestañas superiores (siguen la curva del párpado) */}
      {Array.from({ length: 11 }, (_, i) => {
        const k = 0.1 + (i / 10) * 0.8;
        const bx = bez(k, W);
        const by = 3 * k * (1 - k) * up;
        const len = H * (0.16 + Math.sin(k * Math.PI) * 0.12) * Math.max(0.5, open + 0.3);
        const dir = (k - 0.5) * 2; // -1 izquierda … 1 derecha
        const ex = bx + dir * len * 0.9, ey = by - len;
        return <path key={i} d={`M ${bx} ${by} Q ${bx + dir * len * 0.1} ${by - len * 0.75} ${ex} ${ey}`} stroke="#1a0f08" strokeWidth={4.5} fill="none" strokeLinecap="round" />;
      })}
      {/* pestañas inferiores */}
      {Array.from({ length: 7 }, (_, i) => {
        const k = 0.25 + (i / 6) * 0.6;
        const bx = bez(k, W);
        const by = 3 * k * (1 - k) * low;
        return <line key={i} x1={bx} y1={by} x2={bx + (k - 0.5) * 24} y2={by + H * 0.1} stroke="#2b1a12" strokeWidth={3} strokeLinecap="round" opacity={0.7} />;
      })}
      {/* lágrimas que desbordan por la comisura exterior y ruedan */}
      {tearPool > 0.6 && Array.from({ length: 3 }, (_, i) => {
        const p = ((t + i * 16) % 48) / 48;
        const side = i === 1 ? -1 : 1;
        const tx = side * W * 0.8 + side * p * 25;
        const ty = low * 0.5 + p * p * H * 2.6;
        const s = 0.7 + Math.min(1, p * 4) * 0.5;
        return (
          <g key={i} transform={`translate(${tx} ${ty}) scale(${s})`} opacity={1 - p * 0.4}>
            <path d="M 0 -26 C 10 -10 16 0 16 9 A 16 16 0 0 1 -16 9 C -16 0 -10 -10 0 -26 Z" fill={`url(#${id}tear)`} stroke="#4fb7ea" strokeWidth={2} />
            <ellipse cx={-5} cy={4} rx={4} ry={6} fill="#fff" opacity={0.9} />
          </g>
        );
      })}
      {/* rastro húmedo en la mejilla */}
      {tearPool > 0.6 && <path d={`M ${W * 0.82} ${low * 0.5} q 30 ${H * 0.9} 0 ${H * 1.8}`} stroke="#bfeaff" strokeWidth={7} fill="none" opacity={0.18} strokeLinecap="round" />}
    </g>
  );
};
