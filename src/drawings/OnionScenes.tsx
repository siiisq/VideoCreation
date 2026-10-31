import React from "react";
import { interpolate, spring, Easing } from "remotion";
import { display } from "../fonts";
import { useT } from "../i18n";
import { Theme } from "../schema";
import { ANIM_FPS, useFrame } from "../time";
import { Label } from "./parts";
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
    <rect x={-240 + shine * 300} y={-60} width={30} height={90} fill="#ffffff" opacity={0.7} transform="skewX(-25)" clipPath="url(#bladeClip)" />
    <rect x={0} y={-40} width={150} height={44} rx={16} fill="#3b2a20" />
    {[40, 80, 120].map((cx) => <circle key={cx} cx={cx} cy={-18} r={6} fill="#c9b38f" />)}
  </g>
);

/** Gancho: cebolla llorando y cuchillo cortando al lado. */
export const OnionCry: React.FC<DP> = () => {
  const t = useFrame();
  const chop = Math.abs(Math.sin(t / 6));
  return (
    <>
      <rect x={160} y={690} width={680} height={60} rx={20} fill="#b07a46" />
      <rect x={160} y={690} width={680} height={14} rx={7} fill="#c99360" />
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
  const dots = (n: number, color: string, inVac: boolean, k: number) => Array.from({ length: n }, (_, i) => {
    const r1 = ((i * 7919 + seed * 31 + k) % 101) / 101, r2 = ((i * 104729 + seed * 17 + k) % 97) / 97;
    let dx: number, dy: number;
    if (inVac) { const a = r1 * Math.PI * 2, rr = r2 * 0.28; dx = Math.cos(a) * w * rr; dy = Math.sin(a) * h * rr; }
    else { const a = r1 * Math.PI * 2, rr = 0.36 + r2 * 0.06; dx = Math.cos(a) * w * rr; dy = Math.sin(a) * h * rr; }
    // al romperse, todo se mezcla hacia posiciones aleatorias y vibra
    const mx = (r2 - 0.5) * w * 0.7, my = (r1 - 0.5) * h * 0.7;
    const jitter = broken * Math.sin((t + i * 13) / 3) * 4;
    return <circle key={`${k}${i}`} cx={x + dx + (mx - dx) * broken + jitter} cy={y + dy + (my - dy) * broken - jitter} r={8} fill={color} />;
  });
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={34} fill="#f6f1c7" opacity={0.18} stroke="#d9f08a" strokeWidth={6} strokeDasharray={broken > 0.05 ? "18 14" : undefined} />
      <ellipse cx={x} cy={y} rx={w * 0.3} ry={h * 0.3} fill={ENZYME} opacity={0.15 * (1 - broken)} stroke={ENZYME} strokeWidth={4} strokeDasharray={broken > 0.05 ? "10 10" : undefined} strokeOpacity={1 - broken} />
      {dots(5, ENZYME, true, 1)}
      {dots(7, SULFUR, false, 2)}
    </g>
  );
};

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
            return <g key={i} opacity={(1 - p) * 0.9} transform={`translate(${gx} ${gy})`}><circle r={12} fill={GAS} /><circle cx={16} cy={-6} r={8} fill={GAS} /><circle cx={-12} cy={-10} r={7} fill={GAS} /></g>;
          })}
          <Label x={500} y={810} text={tr.gas} color={GAS} size={48} font={display} delay={gasStart} />
        </>
      )}
      {!cut && (
        <>
          <circle cx={70} cy={790} r={14} fill={SULFUR} /><Label x={290} y={803} text={tr.sulfur} color={SULFUR} size={38} font={display} delay={30} />
          <circle cx={590} cy={790} r={14} fill={ENZYME} /><Label x={710} y={803} text={tr.enzyme} color={ENZYME} size={38} font={display} delay={40} />
        </>
      )}
    </>
  );
};

/** El gas sube desde la tabla hasta un ojo, que se irrita y llora. */
export const GasEye: React.FC<DP> = () => {
  const t = useFrame();
  const tr = useT();
  const irritate = interpolate(t, [40, 70], [0, 1], clamp);
  const squint = 1 - 0.45 * irritate + (t % 50 > 46 ? -0.5 : 0) * irritate;
  const ex = 500, ey = 230;
  return (
    <>
      {/* ojo */}
      <g transform={`translate(${ex} ${ey}) scale(1 ${Math.max(0.15, squint)})`}>
        <path d="M -230 0 Q 0 -170 230 0 Q 0 170 -230 0 Z" fill="#fff" stroke="#3a1f05" strokeWidth={8} />
        {[-60, 0, 60].map((a, i) => <path key={i} d={`M ${a * 2.2} -55 q ${a * 0.4} -10 ${a * 0.8} 30`} stroke="#ff4d4d" strokeWidth={4} fill="none" opacity={irritate * 0.8} transform={`translate(0 ${i % 2 ? 60 : 0})`} />)}
        <circle r={78} fill="#4f8fd8" />
        <circle r={38} fill="#0b1726" />
        <circle cx={22} cy={-24} r={14} fill="#fff" />
      </g>
      {/* pestañas */}
      {Array.from({ length: 7 }, (_, i) => {
        const a = -150 + i * 20;
        const r = (a * Math.PI) / 180;
        return <line key={i} x1={ex + Math.cos(r) * 200} y1={ey + Math.sin(r) * 120 * squint} x2={ex + Math.cos(r) * 250} y2={ey + Math.sin(r) * 165 * squint} stroke="#3a1f05" strokeWidth={8} strokeLinecap="round" />;
      })}
      {/* rayos de nervio */}
      {irritate > 0.3 && [-1, 1].map((d) => (
        <path key={d} d={`M ${ex + d * 260} ${ey - 60} l ${d * 30} -20 l ${-d * 10} -10 l ${d * 40} -30`} stroke="#ffd23f" strokeWidth={8} fill="none" strokeLinecap="round" opacity={Math.abs(Math.sin(t / 3))} />
      ))}
      {/* lágrimas */}
      {irritate > 0.6 && Array.from({ length: 5 }, (_, i) => {
        const p = ((t + i * 11) % 40) / 40;
        const tx = ex + (i % 2 ? 190 : -190);
        return <path key={i} d={`M ${tx} ${ey + 40 + p * 200 - 18} q 12 16 0 26 q -12 -10 0 -26 Z`} fill="#7fd6ff" opacity={1 - p * 0.5} />;
      })}
      {/* tabla y media cebolla */}
      <rect x={250} y={720} width={500} height={44} rx={16} fill="#b07a46" />
      <path d="M 390 720 A 110 90 0 0 1 610 720 Z" fill={ONION.skin} stroke={ONION.line} strokeWidth={6} />
      {[30, 55, 80].map((r) => <path key={r} d={`M ${500 - r} 720 A ${r} ${r * 0.8} 0 0 1 ${500 + r} 720`} stroke="#fff6d6" strokeWidth={5} fill="none" />)}
      {/* gas subiendo hacia el ojo */}
      {Array.from({ length: 14 }, (_, i) => {
        const p = ((t + i * 7) % 60) / 60;
        const sx = 430 + (i * 37) % 140;
        const gx = interpolate(p, [0, 1], [sx, ex + ((i % 3) - 1) * 120]) + Math.sin(p * 8 + i) * 20;
        const gy = interpolate(p, [0, 1], [700, ey + 120]);
        return <g key={i} opacity={interpolate(p, [0, 0.1, 0.85, 1], [0, 1, 1, 0])} transform={`translate(${gx} ${gy})`}><circle r={11} fill={GAS} /><circle cx={14} cy={-6} r={7} fill={GAS} /></g>;
      })}
      <Label x={780} y={560} text={tr.gas} color={GAS} size={40} font={display} delay={10} />
      <Label x={220} y={560} text={tr.tears} color="#7fd6ff" size={40} font={display} delay={70} />
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
      {/* 1. frío: termómetro + copos */}
      <g transform={`translate(170 380) scale(${p0})`}>
        <rect x={-110} y={-260} width={220} height={440} rx={30} fill="#ffffff10" stroke="#ffffff30" strokeWidth={4} />
        <rect x={-18} y={-200} width={36} height={250} rx={18} fill="#fff" />
        <rect x={-10} y={-192 + (1 - temp) * 234} width={20} height={temp * 234} rx={10} fill={temp > 0.5 ? "#ff6b4a" : "#4fc3ff"} />
        <circle cy={80} r={40} fill={temp > 0.5 ? "#ff6b4a" : "#4fc3ff"} stroke="#fff" strokeWidth={8} />
        {[0, 1, 2, 3].map((i) => {
          const p = ((t + i * 15) % 60) / 60;
          return <g key={i} transform={`translate(${-70 + i * 45} ${-240 + p * 380}) rotate(${t * 3})`} opacity={(1 - p) * p0}>
            {[0, 60, 120].map((a) => <line key={a} x1={-12} x2={12} y1={0} y2={0} stroke="#cfefff" strokeWidth={4} transform={`rotate(${a})`} />)}
          </g>;
        })}
      </g>
      {/* 2. cuchillo afilado con brillo */}
      <g transform={`translate(500 380) scale(${p1})`}>
        <rect x={-130} y={-260} width={260} height={440} rx={30} fill="#ffffff10" stroke="#ffffff30" strokeWidth={4} />
        <g transform="rotate(-60)"><Knife x={90} y={10} scale={0.8} shine={((t - at[1] * fps) % 40) / 40} /></g>
      </g>
      {/* 3. ventilador que aparta el gas */}
      <g transform={`translate(830 380) scale(${p2})`}>
        <rect x={-110} y={-260} width={220} height={440} rx={30} fill="#ffffff10" stroke="#ffffff30" strokeWidth={4} />
        <g transform={`translate(0 -40) rotate(${t * 18})`}>
          {[0, 120, 240].map((a) => <ellipse key={a} cx={0} cy={-50} rx={26} ry={50} fill="#9fd3ff" transform={`rotate(${a})`} />)}
          <circle r={18} fill="#fff" />
        </g>
        <rect x={-6} y={0} width={12} height={130} fill="#9fb3c8" />
        <rect x={-50} y={130} width={100} height={20} rx={10} fill="#9fb3c8" />
        {Array.from({ length: 5 }, (_, i) => {
          const p = ((t + i * 9) % 40) / 40;
          return <circle key={i} cx={-60 + p * -60} cy={-140 + i * 40} r={9} fill={GAS} opacity={(1 - p) * p2} />;
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
