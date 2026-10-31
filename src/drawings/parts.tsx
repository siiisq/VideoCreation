import { ANIM_FPS, useFrame } from "../time";
import React from "react";
import { interpolate, spring } from "remotion";

export const COFFEE = "#6f3d1f";
export const COFFEE_LIGHT = "#a0612f";
export const CREMA = "#d9a066";
export const CUP = "#f6f1ea";
export const CUP_SHADE = "#d8cfc4";
export const WATER = "#5ec8ff";

/** Molécula de cafeína estilizada: hexágono + pentágono brillantes. */
export const Molecule: React.FC<{ x: number; y: number; size?: number; color: string; delay?: number; float?: number }> = ({ x, y, size = 26, color, delay = 0, float = 6 }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const s = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 140 } });
  const dy = Math.sin((frame + x * 3) / 11) * float;
  const dx = Math.cos((frame + y * 2) / 13) * float * 0.6;
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${Math.cos(a) * size},${Math.sin(a) * size}`;
  }).join(" ");
  const pent = Array.from({ length: 5 }, (_, i) => {
    const a = ((2 * Math.PI) / 5) * i;
    return `${size * 1.55 + Math.cos(a) * size * 0.75},${Math.sin(a) * size * 0.75}`;
  }).join(" ");
  return (
    <g transform={`translate(${x + dx},${y + dy}) scale(${s}) rotate(${(frame + x) % 360 / 6})`} opacity={s}>
      <circle r={size * 1.9} fill={color} opacity={0.18} />
      <polygon points={hex} fill="none" stroke={color} strokeWidth={size * 0.28} strokeLinejoin="round" />
      <polygon points={pent} fill="none" stroke={color} strokeWidth={size * 0.28} strokeLinejoin="round" />
      <circle cx={0} cy={-size} r={size * 0.28} fill={color} />
      <circle cx={-size * 0.87} cy={size * 0.5} r={size * 0.28} fill={color} />
    </g>
  );
};

/** Vapor animado (líneas onduladas que suben). */
export const Steam: React.FC<{ x: number; y: number; width: number; color?: string; count?: number }> = ({ x, y, width, color = "#ffffff", count = 3 }) => {
  const frame = useFrame();
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const cx = x - width / 2 + ((i + 0.5) * width) / count;
        const t = ((frame + i * 17) % 60) / 60;
        const d = `M ${cx} ${y} q 18 -30 0 -60 q -18 -30 0 -60`;
        return <path key={i} d={d} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" opacity={(1 - t) * 0.55} transform={`translate(0 ${-t * 50})`} />;
      })}
    </g>
  );
};

/**
 * Taza dibujada. (x, y) = centro de la base. `fill` 0–1 nivel de líquido.
 * `molecules` = número de moléculas de cafeína dentro.
 */
export const Cup: React.FC<{
  x: number; y: number; w: number; h: number; fill: number; liquid?: string;
  molecules?: number; moleculeColor?: string; moleculeDelay?: number; steam?: boolean; id: string;
}> = ({ x, y, w, h, fill, liquid = COFFEE, molecules = 0, moleculeColor = "#ffcc00", moleculeDelay = 0, steam = true, id }) => {
  const frame = useFrame();
  const top = y - h;
  const inset = w * 0.12;
  const body = `M ${x - w / 2} ${top} L ${x + w / 2} ${top} L ${x + w / 2 - inset} ${y - 18} Q ${x + w / 2 - inset} ${y} ${x + w / 2 - inset - 20} ${y} L ${x - w / 2 + inset + 20} ${y} Q ${x - w / 2 + inset} ${y} ${x - w / 2 + inset} ${y - 18} Z`;
  const level = y - 14 - (h - 30) * fill;
  const wave = Math.sin(frame / 6) * 6;
  const liquidPath = `M ${x - w} ${level} Q ${x - w / 4} ${level - wave} ${x} ${level} T ${x + w} ${level} L ${x + w} ${y + 10} L ${x - w} ${y + 10} Z`;
  // posiciones pseudoaleatorias deterministas de las moléculas dentro del líquido
  const mols = Array.from({ length: molecules }, (_, i) => {
    const r1 = ((i * 7919) % 101) / 101;
    const r2 = ((i * 104729) % 97) / 97;
    const liquidH = y - 30 - level;
    return { mx: x - w * 0.32 + r1 * w * 0.64, my: level + 30 + r2 * Math.max(liquidH - 20, 10) };
  });
  const msize = Math.max(10, Math.min(20, w / 16));
  return (
    <g>
      <ellipse cx={x} cy={y + 14} rx={w * 0.75} ry={22} fill={CUP_SHADE} />
      <ellipse cx={x} cy={y + 6} rx={w * 0.7} ry={18} fill={CUP} />
      <path d={`M ${x + w / 2 - 10} ${top + h * 0.2} C ${x + w / 2 + w * 0.32} ${top + h * 0.15} ${x + w / 2 + w * 0.3} ${top + h * 0.7} ${x + w / 2 - inset * 0.6} ${top + h * 0.72}`} fill="none" stroke={CUP} strokeWidth={Math.max(16, w * 0.08)} strokeLinecap="round" />
      <clipPath id={`clip-${id}`}><path d={body} /></clipPath>
      <path d={body} fill={CUP} />
      <g clipPath={`url(#clip-${id})`}>
        {fill > 0.01 && <path d={liquidPath} fill={liquid} />}
        {fill > 0.01 && <path d={`M ${x - w} ${level} Q ${x - w / 4} ${level - wave} ${x} ${level} T ${x + w} ${level}`} stroke={CREMA} strokeWidth={10} fill="none" opacity={liquid === COFFEE ? 0.9 : 0.3} />}
        {mols.map((m, i) => <Molecule key={i} x={m.mx} y={m.my} size={msize} color={moleculeColor} delay={moleculeDelay + i * 4} float={4} />)}
        <rect x={x - w / 2} y={top} width={w * 0.14} height={h} fill="#ffffff" opacity={0.25} />
      </g>
      <path d={body} fill="none" stroke={CUP_SHADE} strokeWidth={6} />
      {steam && fill > 0.6 && <Steam x={x} y={top - 20} width={w * 0.6} />}
    </g>
  );
};

/** Grano de café. */
export const Bean: React.FC<{ x: number; y: number; size?: number; rot?: number }> = ({ x, y, size = 40, rot = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    <ellipse rx={size * 0.62} ry={size} fill={COFFEE} />
    <ellipse rx={size * 0.62} ry={size} fill="url(#beanShine)" />
    <path d={`M 0 ${-size * 0.85} C ${size * 0.35} ${-size * 0.3} ${-size * 0.35} ${size * 0.3} 0 ${size * 0.85}`} stroke="#3b1f0e" strokeWidth={size * 0.14} fill="none" strokeLinecap="round" />
  </g>
);

export const Defs: React.FC = () => (
  <defs>
    <radialGradient id="beanShine" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
      <stop offset="60%" stopColor="#ffffff" stopOpacity={0} />
    </radialGradient>
  </defs>
);

/** Etiqueta de texto SVG con entrada animada. */
export const Label: React.FC<{ x: number; y: number; text: string; color: string; size?: number; delay?: number; weight?: number; font: string }> = ({ x, y, text, color, size = 44, delay = 0, weight = 800, font }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const s = spring({ frame: frame - delay, fps, config: { damping: 12 } });
  return (
    <text x={x} y={y + (1 - s) * 30} textAnchor="middle" fontFamily={font} fontWeight={weight} fontSize={size} fill={color} opacity={s}>
      {text}
    </text>
  );
};

/** Contador numérico SVG. */
export const Counter: React.FC<{ x: number; y: number; to: number; suffix?: string; prefix?: string; color: string; size?: number; delay?: number; dur?: number; font: string; decimals?: number }> = ({ x, y, to, suffix = "", prefix = "", color, size = 90, delay = 0, dur = 40, font, decimals = 0 }) => {
  const frame = useFrame();
  const p = interpolate(frame, [delay, delay + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eased = 1 - Math.pow(1 - p, 3);
  const fps = ANIM_FPS;
  const pop = spring({ frame: frame - delay - dur, fps, config: { damping: 6 } });
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily={font} fontWeight={900} fontSize={size} fill={color} opacity={p > 0 ? 1 : 0} transform={`translate(${x} ${y}) scale(${0.9 + 0.1 * pop}) translate(${-x} ${-y})`} style={{ filter: `drop-shadow(0 0 18px ${color}88)` }}>
      {prefix}{(to * eased).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </text>
  );
};
