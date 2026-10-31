import React from "react";
import { interpolate, spring, Easing } from "remotion";
import { body, display } from "../fonts";
import { Theme } from "../schema";
import { ANIM_FPS, useFrame } from "../time";
import { Counter, Label } from "./parts";

type D = Record<string, unknown>;
type DP = { data: D; theme: Theme };
const str = (d: D, k: string, def = "") => (typeof d[k] === "string" ? (d[k] as string) : def);
const num = (d: D, k: string, def = 0) => (typeof d[k] === "number" ? (d[k] as number) : def);
const fps = ANIM_FPS;

/** Icono de fábrica (centro inferior en x,y). */
const Factory: React.FC<{ x: number; y: number; s: number; color: string; smoke?: boolean; t: number }> = ({ x, y, s, color, smoke, t }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-32} y={-34} width={64} height={34} rx={3} fill={color} />
    <path d="M -32 -34 L -32 -52 L -16 -42 L -16 -52 L 0 -42 L 0 -52 L 16 -42 L 16 -34 Z" fill={color} />
    <rect x={18} y={-66} width={11} height={32} fill={color} />
    <rect x={-24} y={-24} width={10} height={9} rx={2} fill="#0b1f36" opacity={0.55} />
    <rect x={-6} y={-24} width={10} height={9} rx={2} fill="#0b1f36" opacity={0.55} />
    <rect x={12} y={-24} width={10} height={9} rx={2} fill="#0b1f36" opacity={0.55} />
    {smoke && [0, 1, 2].map((i) => {
      const p = ((t + i * 12) % 36) / 36;
      return <circle key={i} cx={23 + p * 14} cy={-72 - p * 40} r={5 + p * 9} fill="#ffffff" opacity={(1 - p) * 0.5} />;
    })}
  </g>
);

/** Rejilla de fábricas: aparecen las existentes y luego "pop" de las nuevas en color acento. */
export const Factories: React.FC<DP> = ({ data, theme }) => {
  const t = useFrame();
  const from = num(data, "from", 32), to = num(data, "to", 44);
  const cols = 11;
  return (
    <>
      {Array.from({ length: to }, (_, i) => {
        const isNew = i >= from;
        const d = isNew ? 55 + (i - from) * 5 : 4 + i * 1.1;
        const s = spring({ frame: t - d, fps, config: { damping: isNew ? 7 : 14, stiffness: 160 } });
        const r = Math.floor(i / cols), c = i % cols;
        const x = 70 + c * 86, y = 200 + r * 120;
        return (
          <g key={i}>
            {isNew && s > 0.05 && <circle cx={x} cy={y - 30} r={interpolate(s, [0, 1], [10, 70])} fill={theme.accent} opacity={Math.max(0, 0.5 - s * 0.45)} />}
            <Factory x={x} y={y} s={s * 1.05} color={isNew ? theme.accent : "#9fb8d0"} smoke={isNew} t={t} />
          </g>
        );
      })}
      <Counter x={500} y={720} to={to} color={theme.accent} size={120} delay={50} dur={50} font={display} />
      <Label x={500} y={790} text={str(data, "label", `sites  (+${to - from} new)`)} color={theme.text} size={46} font={display} delay={60} />
    </>
  );
};

/** Terminal con código que se escribe + contador de commits. */
export const Code: React.FC<DP> = ({ data, theme }) => {
  const t = useFrame();
  const lines = [[60, theme.accent2], [140, "#9fb8d0"], [100, theme.accent], [180, "#9fb8d0"], [80, theme.accent2], [150, "#9fb8d0"], [120, theme.accent]] as const;
  const enter = spring({ frame: t, fps, config: { damping: 14 } });
  return (
    <g>
      <g transform={`translate(0 ${(1 - enter) * 80})`} opacity={enter}>
        <rect x={120} y={60} width={760} height={470} rx={26} fill="#07121f" stroke="#2c4a6b" strokeWidth={4} />
        <rect x={120} y={60} width={760} height={56} rx={26} fill="#16304d" />
        {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => <circle key={c} cx={160 + i * 34} cy={88} r={11} fill={c} />)}
        <text x={500} y={98} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={26} fill="#9fb8d0">git log --oneline</text>
        {lines.map(([w, c], i) => {
          const p = interpolate(t, [10 + i * 9, 22 + i * 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const y = 160 + i * 50;
          return (
            <g key={i} opacity={p > 0 ? 1 : 0}>
              <rect x={160} y={y} width={90} height={22} rx={6} fill={theme.accent} opacity={0.85} />
              <rect x={270} y={y} width={(w * 2.6) * p} height={22} rx={6} fill={c} opacity={0.75} />
            </g>
          );
        })}
        <rect x={160 + ((t / 15) % 2 > 1 ? 0 : 0)} y={160 + 7 * 50} width={18} height={30} fill="#6ff3ff" opacity={(Math.floor(t / 10) % 2) ? 1 : 0} />
      </g>
      <Counter x={500} y={680} to={num(data, "value", 5063)} color={theme.accent} size={130} delay={30} dur={60} font={display} />
      <Label x={500} y={745} text={str(data, "label", "commits in 2026")} color={theme.text} size={46} font={display} delay={40} />
      {str(data, "badge") && (() => {
        const b = spring({ frame: t - 95, fps, config: { damping: 7 } });
        return (
          <g transform={`translate(790 515) scale(${b}) rotate(-8)`}>
            <rect x={-120} y={-50} width={240} height={90} rx={45} fill={theme.accent2} />
            <text x={0} y={12} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={46} fill="#0b1f36">{str(data, "badge")}</text>
          </g>
        );
      })()}
    </g>
  );
};

/** Paquetes de datos fluyendo hacia una base de datos + anillo de porcentaje. */
export const Queries: React.FC<DP> = ({ data, theme }) => {
  const t = useFrame();
  const enter = spring({ frame: t, fps, config: { damping: 12 } });
  const ring = num(data, "ring", 98);
  const rp = interpolate(t, [30, 90], [0, ring / 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const R = 80, C = 2 * Math.PI * R;
  return (
    <g>
      {Array.from({ length: 18 }, (_, i) => {
        const lane = i % 5;
        const p = ((t * 1.6 + i * 23) % 100) / 100;
        const x = interpolate(p, [0, 1], [-40, 470]);
        const y = 150 + lane * 70 + Math.sin(p * Math.PI * 2 + lane) * 12;
        return <rect key={i} x={x} y={y} width={46} height={30} rx={8} fill={i % 3 ? theme.accent2 : theme.accent} opacity={interpolate(p, [0, 0.1, 0.85, 1], [0, 1, 1, 0])} />;
      })}
      <g transform={`translate(600 310) scale(${enter})`}>
        {[90, 20, -50].map((dy, i) => (
          <g key={i}>
            <rect x={-120} y={dy - 40} width={240} height={80} fill={i === 0 ? "#123a5e" : i === 1 ? "#174a75" : "#1d5a8c"} />
            <ellipse cx={0} cy={dy + 40} rx={120} ry={30} fill={i === 0 ? "#123a5e" : i === 1 ? "#174a75" : "#1d5a8c"} />
          </g>
        ))}
        <ellipse cx={0} cy={-90} rx={120} ry={30} fill="#2a78b8" />
        <ellipse cx={0} cy={-90} rx={120} ry={30} fill="none" stroke={theme.accent2} strokeWidth={4} opacity={0.5 + Math.sin(t / 5) * 0.4} />
      </g>
      <g transform="translate(850 200)">
        <circle r={R} fill="none" stroke="#ffffff22" strokeWidth={22} />
        <circle r={R} fill="none" stroke={theme.accent} strokeWidth={22} strokeLinecap="round" strokeDasharray={`${C * rp} ${C}`} transform="rotate(-90)" />
        <text y={14} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={44} fill={theme.text}>{Math.round(rp * 100)}%</text>
        <text y={R + 50} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={30} fill={theme.text}>{str(data, "ringLabel", "automated")}</text>
      </g>
      <Counter x={500} y={680} to={num(data, "value", 14.2)} decimals={num(data, "decimals", 1)} suffix={str(data, "suffix", "M")} color={theme.accent} size={130} delay={20} dur={60} font={display} />
      <Label x={500} y={750} text={str(data, "label", "million queries")} color={theme.text} size={46} font={display} delay={30} />
    </g>
  );
};

/** Personitas: grupo "antes" vs grupo "después". */
const Person: React.FC<{ x: number; y: number; s: number; color: string }> = ({ x, y, s, color }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx={0} cy={-46} r={14} fill={color} />
    <path d="M -22 0 Q -22 -30 0 -30 Q 22 -30 22 0 Z" fill={color} />
  </g>
);

export const Users: React.FC<DP> = ({ data, theme }) => {
  const t = useFrame();
  const nb = num(data, "beforeIcons", 9), na = num(data, "afterIcons", 20);
  const group = (n: number, cx: number, color: string, d0: number) => Array.from({ length: n }, (_, i) => {
    const cols = 4;
    const r = Math.floor(i / cols), c = i % cols;
    const s = spring({ frame: t - d0 - i * 2.5, fps, config: { damping: 9, stiffness: 170 } });
    const bob = Math.sin((t + i * 7) / 8) * 3;
    return <Person key={i} x={cx - 105 + c * 70} y={540 - r * 80 + bob} s={s} color={color} />;
  });
  return (
    <g>
      {group(nb, 250, "#9fb8d0", 5)}
      {group(na, 750, theme.accent, 35)}
      <rect x={480} y={120} width={40} height={460} rx={20} fill="#ffffff10" />
      <Counter x={250} y={660} to={num(data, "before", 178)} color="#9fb8d0" size={90} delay={10} dur={40} font={display} />
      <Counter x={750} y={660} to={num(data, "after", 396)} color={theme.accent} size={110} delay={40} dur={50} font={display} />
      <Label x={250} y={720} text={str(data, "beforeLabel", "2025")} color={theme.text} size={40} font={display} delay={14} />
      <Label x={750} y={720} text={str(data, "afterLabel", "2026")} color={theme.text} size={40} font={display} delay={44} />
      <Label x={500} y={800} text={str(data, "label", "average monthly users")} color={theme.text} size={38} weight={700} font={body} delay={60} />
    </g>
  );
};

/** Velocímetro: la aguja va de lento a rápido + barras de reducción. */
export const Speed: React.FC<DP> = ({ data, theme }) => {
  const t = useFrame();
  const p = interpolate(t, [10, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
  const angle = -110 + p * 200 + Math.sin(t / 3) * (p > 0.95 ? 1.5 : 0);
  const cx = 500, cy = 400, R = 260;
  const arc = (a0: number, a1: number) => {
    const r = (a: number) => ((a - 90) * Math.PI) / 180;
    return `M ${cx + R * Math.cos(r(a0))} ${cy + R * Math.sin(r(a0))} A ${R} ${R} 0 0 1 ${cx + R * Math.cos(r(a1))} ${cy + R * Math.sin(r(a1))}`;
  };
  return (
    <g>
      <path d={arc(-110, -40)} stroke="#ff5f57" strokeWidth={34} fill="none" strokeLinecap="round" />
      <path d={arc(-35, 30)} stroke="#febc2e" strokeWidth={34} fill="none" />
      <path d={arc(35, 110)} stroke="#28c840" strokeWidth={34} fill="none" strokeLinecap="round" />
      {Array.from({ length: 11 }, (_, i) => {
        const a = ((-110 + i * 22 - 90) * Math.PI) / 180;
        return <line key={i} x1={cx + (R - 50) * Math.cos(a)} y1={cy + (R - 50) * Math.sin(a)} x2={cx + (R - 30) * Math.cos(a)} y2={cy + (R - 30) * Math.sin(a)} stroke="#ffffff88" strokeWidth={5} />;
      })}
      <g transform={`rotate(${angle} ${cx} ${cy})`}>
        <path d={`M ${cx - 12} ${cy} L ${cx} ${cy - R + 60} L ${cx + 12} ${cy} Z`} fill={theme.accent} style={{ filter: `drop-shadow(0 0 12px ${theme.accent})` }} />
      </g>
      <circle cx={cx} cy={cy} r={30} fill="#eef3f8" />
      {p > 0.9 && [0, 1, 2].map((i) => {
        const q = ((t + i * 6) % 18) / 18;
        return <line key={i} x1={760 + q * 60} y1={170 + i * 30} x2={820 + q * 60} y2={170 + i * 30} stroke={theme.accent2} strokeWidth={6} strokeLinecap="round" opacity={1 - q} />;
      })}
      <Counter x={300} y={600} to={num(data, "value", 89)} prefix="−" suffix="%" color={theme.accent} size={100} delay={40} dur={40} font={display} />
      <Label x={300} y={660} text={str(data, "label", "query runtime")} color={theme.text} size={36} weight={700} font={body} delay={46} />
      <Counter x={700} y={600} to={num(data, "value2", 96)} prefix="−" suffix="%" color={theme.accent2} size={100} delay={60} dur={40} font={display} />
      <Label x={700} y={660} text={str(data, "label2", "data scanned")} color={theme.text} size={36} weight={700} font={body} delay={66} />
    </g>
  );
};
