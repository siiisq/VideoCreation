import React from "react";
import { interpolate, spring, Easing } from "remotion";
import { display } from "../fonts";
import { useT } from "../i18n";
import { Theme } from "../schema";
import { ANIM_FPS, useFrame } from "../time";
import { Board, Label, Sphere } from "./parts";
import { Eye } from "./Eye";
import { Onion, ONION } from "./Onion";

type D = Record<string, unknown>;
type DP = { data: D; theme: Theme };
const fps = ANIM_FPS;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const GAS = "#9be15d";
const SULFUR = "#ffd23f";
const ENZYME = "#c06bff";

/** Cuchillo (punta a la izquierda). */
export const Knife: React.FC<{ x: number; y: number; rot?: number; scale?: number; shine?: number }> = ({ x, y, rot = 0, scale = 1, shine = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
    <defs>
      <linearGradient id="blade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f4f7fa" /><stop offset="100%" stopColor="#aab6c2" /></linearGradient>
      <clipPath id="bladeClip"><path d="M -220 0 Q -120 -48 0 -48 L 0 18 L -220 0 Z" /></clipPath>
    </defs>
    <path d="M -220 0 Q -120 -48 0 -48 L 0 18 L -220 0 Z" fill="url(#blade)" stroke="#7d8a96" strokeWidth={4} />
    <path d="M -214 1 Q -110 4 0 12" stroke="#ffffff" strokeWidth={3} fill="none" opacity={0.9} />
    <path d="M -200 -6 Q -110 -30 -4 -34" stroke="#8d99a5" strokeWidth={2} fill="none" opacity={0.6} />
    <rect x={-240 + shine * 300} y={-60} width={30} height={90} fill="#ffffff" opacity={0.7} transform="skewX(-25)" clipPath="url(#bladeClip)" />
    <rect x={-4} y={-50} width={18} height={70} rx={6} fill="#9aa6b2" stroke="#6b7783" strokeWidth={3} />
    <rect x={12} y={-42} width={150} height={48} rx={18} fill="#4a3226" stroke="#2a1a12" strokeWidth={3} />
    <rect x={20} y={-38} width={134} height={12} rx={6} fill="#7a5644" opacity={0.6} />
    {[50, 90, 130].map((cx) => <g key={cx}><circle cx={cx} cy={-18} r={7} fill="#d9c9a8" /><circle cx={cx - 2} cy={-20} r={2.5} fill="#fff" /></g>)}
  </g>
);

/** Gancho: cebolla llorando y cuchillo cortando al lado. */
export const OnionCry: React.FC<DP> = () => {
  const t = useFrame();
  const chop = Math.abs(Math.sin(t / 6));
  return (
    <>
      <Board x={150} y={690} w={700} />
      <Onion x={380} y={520} size={190} mood="crying" />
      <g transform={`translate(0 ${-chop * 90})`}><Knife x={880} y={660} rot={-8} scale={0.85} /></g>
      {[0, 1, 2].map((i) => {
        const s = spring({ frame: t - 20 - i * 8, fps, config: { damping: 7 } });
        const px = [160, 830, 880][i], py = [220, 180, 330][i];
        return <text key={i} x={px} y={py + Math.sin((t + i * 20) / 8) * 10} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={110} fill={i === 1 ? "#ff6b4a" : "#ffc23d"} opacity={s} transform={`rotate(${(i - 1) * 14} ${px} ${py})`}>?</text>;
      })}
    </>
  );
};

/** Una célula: pared + vacuola con enzima + azufre en el citoplasma. Si broken>0, se rompe y se mezclan. */
const Cell: React.FC<{ x: number; y: number; w: number; h: number; broken: number; t: number; seed: number }> = ({ x, y, w, h, broken, t, seed }) => {
  const dots = (n: number, color: "yellow" | "purple", inVac: boolean, k: number) => Array.from({ length: n }, (_, i) => {
    const r1 = ((i * 7919 + seed * 31 + k) % 101) / 101, r2 = ((i * 104729 + seed * 17 + k) % 97) / 97;
    let dx: number, dy: number;
    if (inVac) { const a = r1 * Math.PI * 2, rr = r2 * 0.24; dx = Math.cos(a) * w * rr; dy = Math.sin(a) * h * rr; }
    else { const a = r1 * Math.PI * 2, rr = 0.35 + r2 * 0.05; dx = Math.cos(a) * w * rr; dy = Math.sin(a) * h * rr; }
    const mx = (r2 - 0.5) * w * 0.7, my = (r1 - 0.5) * h * 0.7;
    const jitter = broken * Math.sin((t + i * 13) / 3) * 4;
    const drift = Math.sin((t + i * 17 + seed * 5) / 14) * 3;
    return <Sphere key={`${k}${i}`} x={x + dx + (mx - dx) * broken + jitter + drift} y={y + dy + (my - dy) * broken - jitter} r={inVac ? 9 : 8.5} color={color} />;
  });
  const wob = (k: number) => Math.sin(t / 10 + seed + k) * 3;
  const wall = `M ${x - w / 2 + 30} ${y - h / 2 + wob(1)} Q ${x} ${y - h / 2 - 10 + wob(2)} ${x + w / 2 - 30} ${y - h / 2 + wob(3)} Q ${x + w / 2 + 6} ${y - h / 2 + 4} ${x + w / 2 + wob(4)} ${y - h / 2 + 34} Q ${x + w / 2 + 10 + wob(5)} ${y} ${x + w / 2} ${y + h / 2 - 34} Q ${x + w / 2 + 4} ${y + h / 2 + 2} ${x + w / 2 - 30} ${y + h / 2 + wob(6)} Q ${x} ${y + h / 2 + 10 + wob(7)} ${x - w / 2 + 30} ${y + h / 2} Q ${x - w / 2 - 4} ${y + h / 2 + 2} ${x - w / 2 + wob(8)} ${y + h / 2 - 34} Q ${x - w / 2 - 10} ${y} ${x - w / 2} ${y - h / 2 + 34} Q ${x - w / 2 - 4} ${y - h / 2 - 2} ${x - w / 2 + 30} ${y - h / 2 + wob(1)} Z`;
  const dash = broken > 0.05 ? `${24 - broken * 10} ${8 + broken * 22}` : undefined;
  return (
    <g>
      <path d={wall} fill="url(#cellFill)" opacity={1 - broken * 0.4} />
      <path d={wall} fill="none" stroke="#d9f08a" strokeWidth={8} strokeDasharray={dash} strokeLinejoin="round" />
      <path d={wall} fill="none" stroke="#f7ffd6" strokeWidth={2.5} strokeDasharray={dash} opacity={0.8} transform={`translate(${x} ${y}) scale(0.93) translate(${-x} ${-y})`} />
      <ellipse cx={x} cy={y} rx={w * 0.29} ry={h * 0.29} fill="url(#vacuole)" opacity={1 - broken} />
      <ellipse cx={x} cy={y} rx={w * 0.29} ry={h * 0.29} fill="none" stroke="#d99bff" strokeWidth={4} strokeDasharray={broken > 0.05 ? "10 10" : undefined} strokeOpacity={1 - broken} />
      {dots(5, "purple", true, 1)}
      {dots(7, "yellow", false, 2)}
    </g>
  );
};

/** Molécula de gas irritante: tres esferas verdes con halo. */
const GasBlob: React.FC<{ x: number; y: number; s?: number; opacity?: number }> = ({ x, y, s = 1, opacity = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
    <circle r={34} fill="url(#glow-green)" />
    <Sphere x={0} y={0} r={12} color="green" />
    <Sphere x={17} y={-7} r={8} color="green" />
    <Sphere x={-13} y={-11} r={7} color="yellow" />
  </g>
);

const CellDefs: React.FC = () => (
  <defs>
    <radialGradient id="cellFill" cx="45%" cy="40%" r="70%"><stop offset="0%" stopColor="#f6ffd0" stopOpacity={0.32} /><stop offset="100%" stopColor="#c8e86a" stopOpacity={0.12} /></radialGradient>
    <radialGradient id="vacuole" cx="45%" cy="40%" r="60%"><stop offset="0%" stopColor="#e3b5ff" stopOpacity={0.45} /><stop offset="100%" stopColor="#8a3cc9" stopOpacity={0.18} /></radialGradient>
  </defs>
);

/** Células de cebolla. data.cut=true: el cuchillo las corta, se mezclan y sale gas. */
export const OnionCells: React.FC<DP> = ({ data }) => {
  const t = useFrame();
  const tr = useT();
  const cut = data.cut === true;
  const cols = 3, rows = 2, w = 270, h = 230;
  const knifeP = interpolate(t, [10, 34], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const gasStart = 40;
  return (
    <>
      <CellDefs />
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const cx = 210 + c * 290, cy = 260 + r * 250;
        const enter = spring({ frame: t - i * 3, fps, config: { damping: 13 } });
        // el corte va en diagonal: cada célula se rompe cuando pasa el cuchillo
        const when = 14 + (c + r) * 5;
        const broken = cut ? interpolate(t, [when, when + 16], [0, 1], clamp) : 0;
        return <g key={i} transform={`translate(${cx} ${cy}) scale(${enter}) translate(${-cx} ${-cy})`}><Cell x={cx} y={cy} w={w} h={h} broken={broken} t={t} seed={i} /></g>;
      })}
      {cut && (
        <>
          <g opacity={interpolate(knifeP, [0, 0.05, 0.9, 1], [0, 1, 1, 0])}>
            <Knife x={interpolate(knifeP, [0, 1], [1050, 100])} y={interpolate(knifeP, [0, 1], [80, 700])} rot={-35} scale={1.1} />
          </g>
          {/* destellos de reacción */}
          {Array.from({ length: 6 }, (_, i) => {
            const s = spring({ frame: t - 30 - i * 3, fps, config: { damping: 10 } });
            const px = 210 + (i % 3) * 290, py = 260 + Math.floor(i / 3) * 250;
            return <path key={i} d="M 0 -30 L 8 -8 L 30 0 L 8 8 L 0 30 L -8 8 L -30 0 L -8 -8 Z" fill="#fff" opacity={Math.max(0, 1 - s) * 0.9} transform={`translate(${px} ${py}) scale(${s * 1.6})`} />;
          })}
          {/* gas que sube */}
          {Array.from({ length: 16 }, (_, i) => {
            const p = ((t - gasStart + i * 6) % 50) / 50;
            if (t < gasStart + i * 2) return null;
            const gx = 120 + (i * 53) % 760 + Math.sin(p * 6 + i) * 25;
            const gy = 700 - p * 680;
            return <GasBlob key={i} x={gx} y={gy} s={0.9 + (i % 3) * 0.15} opacity={(1 - p) * 0.95} />;
          })}
          <Label x={500} y={810} text={tr.gas} color={GAS} size={48} font={display} delay={gasStart} />
        </>
      )}
      {!cut && (
        <>
          <Sphere x={45} y={790} r={15} color="yellow" /><Label x={320} y={803} text={tr.sulfur} color={SULFUR} size={38} font={display} delay={30} />
          <Sphere x={590} y={790} r={15} color="purple" /><Label x={710} y={803} text={tr.enzyme} color={ENZYME} size={38} font={display} delay={40} />
        </>
      )}
    </>
  );
};

/** El gas sube desde la tabla hasta un ojo detallado, que se irrita y llora. */
export const GasEye: React.FC<DP> = () => {
  const t = useFrame();
  const tr = useT();
  const irritation = interpolate(t, [35, 80], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <>
      <Eye x={500} y={300} w={520} irritation={irritation} lookY={0.25} />
      {/* chispazos de los nervios */}
      {irritation > 0.3 && [-1, 1].map((d) => (
        <g key={d} opacity={Math.abs(Math.sin(t / 3)) * irritation}>
          <path d={`M ${500 + d * 320} ${200} l ${d * 34} -24 l ${-d * 12} -8 l ${d * 44} -34`} stroke="#ffd23f" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={500 + d * 320} cy={200} r={22} fill="url(#glow-yellow)" />
        </g>
      ))}
      {/* tabla y media cebolla cortada */}
      <Board x={260} y={730} w={480} h={46} />
      <defs>
        <radialGradient id="onionCut" cx="50%" cy="100%" r="100%"><stop offset="0%" stopColor="#fffbe8" /><stop offset="70%" stopColor="#f5e3a8" /><stop offset="100%" stopColor="#e2b85a" /></radialGradient>
      </defs>
      <path d="M 380 730 A 120 100 0 0 1 620 730 Z" fill="url(#onionCut)" stroke="#a8641c" strokeWidth={6} />
      {[28, 52, 76, 98].map((r) => <path key={r} d={`M ${500 - r} 730 A ${r} ${r * 0.83} 0 0 1 ${500 + r} 730`} stroke="#e3c47a" strokeWidth={4} fill="none" />)}
      {/* gas subiendo hacia el ojo */}
      {Array.from({ length: 14 }, (_, i) => {
        const p = ((t + i * 7) % 60) / 60;
        const sx = 430 + (i * 37) % 140;
        const gx = interpolate(p, [0, 1], [sx, 500 + ((i % 3) - 1) * 140]) + Math.sin(p * 8 + i) * 22;
        const gy = interpolate(p, [0, 1], [700, 450]);
        return <GasBlob key={i} x={gx} y={gy} s={0.75 + (i % 3) * 0.12} opacity={interpolate(p, [0, 0.1, 0.85, 1], [0, 1, 1, 0])} />;
      })}
      <Label x={830} y={640} text={tr.gas} color={GAS} size={42} font={display} delay={10} />
      <Label x={170} y={640} text={tr.tears} color="#7fd6ff" size={42} font={display} delay={75} />
    </>
  );
};

/** Tres trucos: frío, cuchillo afilado y ventilación. Aparecen al ritmo de la voz (data.at = segundos). */
export const OnionTips: React.FC<DP> = ({ data, theme }) => {
  const t = useFrame();
  const tr = useT();
  const at = (Array.isArray(data.at) ? data.at : [0.3, 2.6, 5]) as number[];
  const panel = (i: number) => spring({ frame: t - at[i] * fps, fps, config: { damping: 12 } });
  const p0 = panel(0), p1 = panel(1), p2 = panel(2);
  const temp = interpolate(t, [at[0] * fps + 10, at[0] * fps + 50], [0.85, 0.2], clamp);
  return (
    <>
      <defs>
        <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.16} /><stop offset="100%" stopColor="#ffffff" stopOpacity={0.04} /></linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} /><stop offset="100%" stopColor="#dfe8f1" /></linearGradient>
        <radialGradient id="fanBlade" cx="50%" cy="20%" r="80%"><stop offset="0%" stopColor="#d6f0ff" /><stop offset="100%" stopColor="#5fb3e8" /></radialGradient>
      </defs>
      {/* 1. frío: termómetro + copos */}
      <g transform={`translate(170 380) scale(${p0})`}>
        <rect x={-110} y={-260} width={220} height={440} rx={30} fill="url(#panel)" stroke="#ffffff40" strokeWidth={4} />
        <rect x={-22} y={-204} width={44} height={258} rx={22} fill="url(#glass)" stroke="#b9c6d3" strokeWidth={3} />
        {[-150, -110, -70, -30, 10].map((yy) => <line key={yy} x1={22} x2={36} y1={yy} y2={yy} stroke="#ffffff88" strokeWidth={3} />)}
        <rect x={-10} y={-192 + (1 - temp) * 234} width={20} height={temp * 234} rx={10} fill={temp > 0.5 ? "#ff6b4a" : "#4fc3ff"} />
        <circle cy={80} r={40} fill={temp > 0.5 ? "#ff6b4a" : "#4fc3ff"} stroke="#fff" strokeWidth={8} />
        <ellipse cx={-12} cy={66} rx={10} ry={7} fill="#fff" opacity={0.7} />
        <rect x={-14} y={-196} width={6} height={240} rx={3} fill="#fff" opacity={0.6} />
        {[0, 1, 2, 3].map((i) => {
          const p = ((t + i * 15) % 60) / 60;
          return <g key={i} transform={`translate(${-70 + i * 45} ${-240 + p * 380}) rotate(${t * 3})`} opacity={(1 - p) * p0}>
            {[0, 60, 120].map((a) => <line key={a} x1={-12} x2={12} y1={0} y2={0} stroke="#cfefff" strokeWidth={4} transform={`rotate(${a})`} />)}
          </g>;
        })}
      </g>
      {/* 2. cuchillo afilado con brillo */}
      <g transform={`translate(500 380) scale(${p1})`}>
        <rect x={-130} y={-260} width={260} height={440} rx={30} fill="url(#panel)" stroke="#ffffff40" strokeWidth={4} />
        <g transform="rotate(-60)"><Knife x={90} y={10} scale={0.8} shine={((t - at[1] * fps) % 40) / 40} /></g>
      </g>
      {/* 3. ventilador que aparta el gas */}
      <g transform={`translate(830 380) scale(${p2})`}>
        <rect x={-110} y={-260} width={220} height={440} rx={30} fill="url(#panel)" stroke="#ffffff40" strokeWidth={4} />
        <circle cx={0} cy={-40} r={92} fill="#ffffff0d" stroke="#cfe3f2" strokeWidth={4} />
        <g transform={`translate(0 -40) rotate(${t * 18})`}>
          {[0, 120, 240].map((a) => <path key={a} d="M 0 -8 C 30 -30 34 -78 6 -86 C -16 -80 -22 -40 0 -8 Z" fill="url(#fanBlade)" stroke="#3f8fc4" strokeWidth={2} transform={`rotate(${a})`} />)}
          <circle r={18} fill="#eef3f8" stroke="#9fb3c8" strokeWidth={3} />
        </g>
        {[30, 60, 90].map((a) => <line key={a} x1={0} y1={-40} x2={Math.cos((a * Math.PI) / 60) * 92} y2={-40 + Math.sin((a * Math.PI) / 60) * 92} stroke="#cfe3f2" strokeWidth={2} opacity={0.5} />)}
        <rect x={-6} y={0} width={12} height={130} fill="#9fb3c8" />
        <rect x={-50} y={130} width={100} height={20} rx={10} fill="#9fb3c8" />
        {Array.from({ length: 5 }, (_, i) => {
          const p = ((t + i * 9) % 40) / 40;
          return <GasBlob key={i} x={-70 - p * 70} y={-130 + i * 40} s={0.55} opacity={(1 - p) * p2} />;
        })}
      </g>
      <Label x={170} y={680} text={tr.cold} color="#4fc3ff" size={44} font={display} delay={at[0] * fps + 8} />
      <Label x={500} y={680} text={tr.sharp} color={theme.text} size={44} font={display} delay={at[1] * fps + 8} />
      <Label x={830} y={680} text={tr.airflow} color="#9fd3ff" size={44} font={display} delay={at[2] * fps + 8} />
    </>
  );
};

/** Cebolla grande sola (para cierre o mensajes). */
export const OnionMascot: React.FC<DP> = ({ data }) => (
  <Onion x={500} y={470} size={220} mood={(typeof data.mood === "string" ? data.mood : "happy") as "happy"} say={typeof data.say === "string" ? data.say : undefined} />
);
