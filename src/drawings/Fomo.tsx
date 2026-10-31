import React from "react";
import { interpolate, spring, Easing } from "remotion";
import { body, display } from "../fonts";
import { useT } from "../i18n";
import { Theme } from "../schema";
import { ANIM_FPS, useFrame } from "../time";
import { Label, Sphere } from "./parts";

type D = Record<string, unknown>;
type DP = { data: D; theme: Theme };
const fps = ANIM_FPS;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const FomoDefs: React.FC = () => (
  <defs>
    <radialGradient id="fSkin" cx="40%" cy="35%" r="70%"><stop offset="0%" stopColor="#ffd9bd" /><stop offset="70%" stopColor="#f0b48e" /><stop offset="100%" stopColor="#d48d66" /></radialGradient>
    <linearGradient id="fHoodie" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7aa7ff" /><stop offset="100%" stopColor="#3555c9" /></linearGradient>
    <linearGradient id="fPants" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b4458" /><stop offset="100%" stopColor="#232a3a" /></linearGradient>
    <linearGradient id="fMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#dfe6ee" /><stop offset="100%" stopColor="#8a97a6" /></linearGradient>
    <linearGradient id="fBelt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3a3f4b" /><stop offset="100%" stopColor="#15181e" /></linearGradient>
    <linearGradient id="fScreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0d2a33" /><stop offset="100%" stopColor="#06141a" /></linearGradient>
    <linearGradient id="fCard" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.2} /><stop offset="100%" stopColor="#ffffff" stopOpacity={0.07} /></linearGradient>
    <radialGradient id="fBrain" cx="40%" cy="35%" r="75%"><stop offset="0%" stopColor="#ffd3e1" /><stop offset="55%" stopColor="#f59ab8" /><stop offset="100%" stopColor="#c9577f" /></radialGradient>
    <linearGradient id="fTube" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} /><stop offset="100%" stopColor="#ffffff" stopOpacity={0.08} /></linearGradient>
    <linearGradient id="fCloth" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ff6b4a" /><stop offset="100%" stopColor="#ffb14a" /></linearGradient>
  </defs>
);

/** Ojos pequeños de personaje con parpadeo real (párpado que baja) y brillo. */
const SmallEye: React.FC<{ x: number; y: number; r?: number; t: number; worried?: number }> = ({ x, y, r = 11, t, worried = 0 }) => {
  const ph = t % 70;
  const blink = ph > 65 ? Math.sin(((ph - 65) / 5) * Math.PI) : 0;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={r} ry={r * 1.2} fill="#fff" stroke="#6b3d2a" strokeWidth={2} />
      <circle cx={x + 1} cy={y + 1} r={r * 0.62} fill="#3a2a22" />
      <circle cx={x + 3} cy={y - 2} r={r * 0.22} fill="#fff" />
      <rect x={x - r - 2} y={y - r * 1.25 - 2} width={r * 2 + 4} height={(r * 2.4 + 4) * blink} fill="#f0b48e" />
      <path d={`M ${x - r} ${y - r * 1.5 - worried * 4} q ${r} ${-r * 0.5 + worried * 8} ${r * 2} ${worried * 6}`} stroke="#4a2c1c" strokeWidth={4} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** Personaje corriendo. speed = ciclos por segundo de zancada. */
export const Runner: React.FC<{ x: number; y: number; s?: number; speed?: number; worried?: number; sweat?: number }> = ({ x, y, s = 1, speed = 1.5, worried = 0, sweat = 0 }) => {
  const t = useFrame();
  const ph = (t / fps) * speed * Math.PI * 2;
  const leg = Math.sin(ph) * 38, arm = Math.sin(ph) * 45;
  const bob = Math.abs(Math.cos(ph)) * -10;
  const limb = (ang: number, len: number, w: number, fill: string, ox: number, oy: number, knee = 0) => (
    <g transform={`translate(${ox} ${oy}) rotate(${ang})`}>
      <rect x={-w / 2} y={0} width={w} height={len / 2 + 4} rx={w / 2} fill={fill} />
      <g transform={`translate(0 ${len / 2}) rotate(${knee})`}><rect x={-w / 2} y={0} width={w} height={len / 2} rx={w / 2} fill={fill} /></g>
    </g>
  );
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
      {/* pierna y brazo traseros (más oscuros) */}
      {limb(-leg, 130, 30, "#1b2130", -6, 40, Math.max(0, leg) * 0.9)}
      {limb(arm, 100, 24, "#2c45a8", -4, -70, -40)}
      {/* cuerpo */}
      <path d="M -42 -85 Q -50 -10 -36 45 L 36 45 Q 50 -10 42 -85 Q 0 -105 -42 -85 Z" fill="url(#fHoodie)" stroke="#26388a" strokeWidth={5} strokeLinejoin="round" />
      <path d="M -20 -40 h 40 v 30 q -20 8 -40 0 Z" fill="#2c45a8" opacity={0.6} />
      <rect x={-40} y={38} width={80} height={22} rx={10} fill="url(#fPants)" />
      {/* pierna y brazo delanteros */}
      {limb(leg, 130, 32, "url(#fPants)", 6, 40, Math.max(0, -leg) * 0.9)}
      <g transform={`translate(${6 + Math.sin(ph) * 60} ${168})`}><path d="M -18 0 h 44 q 10 0 10 12 h -54 Z" fill="#f4f7ff" stroke="#9aa6b8" strokeWidth={3} /></g>
      {limb(-arm, 100, 26, "url(#fHoodie)", 4, -70, -40)}
      {/* cabeza */}
      <circle cx={2} cy={-140} r={52} fill="url(#fSkin)" stroke="#c07a55" strokeWidth={4} />
      <path d="M -50 -150 Q -40 -205 10 -198 Q 58 -192 52 -140 Q 30 -170 -10 -165 Q -35 -162 -50 -150 Z" fill="#3a2418" />
      <ellipse cx={-22} cy={-118} rx={10} ry={6} fill="#ff8f8f" opacity={0.5} />
      <ellipse cx={30} cy={-118} rx={10} ry={6} fill="#ff8f8f" opacity={0.5} />
      <SmallEye x={-14} y={-140} t={t} worried={worried} />
      <SmallEye x={22} y={-140} t={t + 3} worried={worried} />
      <path d={`M -6 -108 q 10 ${worried > 0.5 ? -8 : 8} 20 0`} stroke="#6b3d2a" strokeWidth={4} fill={worried > 0.5 ? "none" : "#7a2f2f"} strokeLinecap="round" />
      {/* sudor */}
      {sweat > 0 && [0, 1].map((i) => {
        const p = ((t + i * 18) % 36) / 36;
        return <g key={i} transform={`translate(${-48 - p * 30 + i * 100} ${-170 + p * 60})`} opacity={sweat * (1 - p)}>
          <path d="M 0 -12 C 6 -4 9 2 9 6 A 9 9 0 0 1 -9 6 C -9 2 -6 -4 0 -12 Z" fill="#9fe3ff" stroke="#4fb7ea" strokeWidth={1.5} />
          <ellipse cx={-3} cy={3} rx={2} ry={3} fill="#fff" />
        </g>;
      })}
    </g>
  );
};

/** Cinta de correr que acelera, con pantalla de velocidad. */
export const Treadmill: React.FC<DP> = ({ theme }) => {
  const t = useFrame();
  const speed = interpolate(t, [0, 120], [1.2, 4.2], { ...clamp, easing: Easing.in(Easing.quad) });
  const shift = (t * speed * 6) % 60;
  const kmh = interpolate(t, [0, 120], [6, 24], clamp);
  return (
    <>
      <FomoDefs />
      <ellipse cx={500} cy={760} rx={380} ry={26} fill="#000" opacity={0.3} />
      {/* consola */}
      <path d="M 760 700 L 800 330" stroke="url(#fMetal)" strokeWidth={26} strokeLinecap="round" />
      <rect x={700} y={250} width={210} height={110} rx={22} fill="#2a3140" stroke="#121620" strokeWidth={5} />
      <rect x={716} y={266} width={178} height={62} rx={10} fill="url(#fScreen)" />
      <text x={805} y={314} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={42} fill="#5ee6ff" style={{ filter: "drop-shadow(0 0 6px #5ee6ff)" }}>{kmh.toFixed(1)}</text>
      <text x={805} y={348} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={18} fill="#9fb3c8">km/h</text>
      {[0, 1, 2].map((i) => <circle key={i} cx={740 + i * 30} cy={344} r={6} fill={i === 2 && Math.floor(t / 6) % 2 ? theme.accent : "#55606f"} />)}
      {/* barandilla */}
      <path d="M 250 700 L 270 470 L 790 470" stroke="url(#fMetal)" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* base y cinta */}
      <path d="M 150 690 L 860 690 Q 900 690 900 715 L 900 735 L 120 735 Q 110 712 150 690 Z" fill="#4a5262" stroke="#1a1e27" strokeWidth={5} />
      <clipPath id="beltClip"><rect x={170} y={668} width={680} height={26} rx={10} /></clipPath>
      <rect x={170} y={668} width={680} height={26} rx={10} fill="url(#fBelt)" />
      <g clipPath="url(#beltClip)">{Array.from({ length: 14 }, (_, i) => <rect key={i} x={170 + i * 60 - shift} y={668} width={8} height={26} fill="#5a6070" />)}</g>
      {[0, 1].map((i) => <circle key={i} cx={i ? 860 : 160} cy={712} r={22} fill="url(#fMetal)" stroke="#5b6675" strokeWidth={4} />)}
      {/* líneas de velocidad */}
      {Array.from({ length: 6 }, (_, i) => {
        const p = ((t * speed + i * 10) % 30) / 30;
        return <line key={i} x1={120 - p * 120} y1={420 + i * 40} x2={200 - p * 120} y2={420 + i * 40} stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={(1 - p) * Math.min(1, (speed - 1.2) / 2)} />;
      })}
      <Runner x={470} y={480} s={1.05} speed={speed} worried={interpolate(t, [40, 110], [0, 1], clamp)} sweat={interpolate(t, [50, 100], [0, 1], clamp)} />
    </>
  );
};

/** Tarjetas de "novedades" que caen cada vez más rápido y se apilan. */
export const ReleaseFeed: React.FC<DP> = ({ theme }) => {
  const t = useFrame();
  const tr = useT();
  const titles = ["Modelo 4.1", "Nueva función", "Plugin viral", "Modelo 4.2", "Truco nuevo", "Agente 2.0", "Modelo 5", "Otra app", "Actualización", "Modelo 5.1"];
  // cada tarjeta llega antes que la anterior (aceleración)
  const arrivals: number[] = [];
  let acc = 4, gap = 22;
  for (let i = 0; i < titles.length; i++) { arrivals.push(acc); acc += gap; gap = Math.max(5, gap * 0.78); }
  return (
    <>
      <FomoDefs />
      {titles.map((title, i) => {
        const s = spring({ frame: t - arrivals[i], fps, config: { damping: 13, stiffness: 160 } });
        const newer = arrivals.filter((a) => t >= a).length - 1 - i; // cuántas han llegado después
        if (t < arrivals[i] - 1) return null;
        const k = Math.max(0, newer);
        const y = 130 + k * 100 + (1 - s) * -220;
        const sc = Math.max(0.6, 1 - k * 0.05);
        const op = Math.max(0, 1 - k * 0.17);
        const color = i % 2 ? theme.accent2 : theme.accent;
        return (
          <g key={i} transform={`translate(500 ${y}) scale(${sc})`} opacity={op * s}>
            <rect x={-330} y={-50} width={660} height={110} rx={26} fill="#0f1830" opacity={0.9} />
            <rect x={-330} y={-50} width={660} height={110} rx={26} fill="url(#fCard)" stroke="#ffffff30" strokeWidth={3} />
            <rect x={-300} y={-26} width={62} height={62} rx={16} fill={color} />
            <path d="M -290 20 l 14 -26 l 12 16 l 10 -10 l 14 20 Z" fill="#0f1830" opacity={0.5} />
            <text x={-216} y={0} fontFamily={display} fontWeight={800} fontSize={34} fill={theme.text}>{title}</text>
            <rect x={-216} y={16} width={260} height={12} rx={6} fill="#ffffff30" />
            <g transform={`translate(240 4) scale(${newer === 0 ? 1 + Math.sin(t / 3) * 0.06 : 1})`}>
              <rect x={-62} y={-24} width={124} height={48} rx={24} fill={theme.accent} />
              <text y={11} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={24} fill="#fff">{tr.newBadge}</text>
            </g>
          </g>
        );
      })}
      {/* contador de notificaciones */}
      {(() => {
        const n = arrivals.filter((a) => t >= a).length;
        const pop = spring({ frame: t - (arrivals[n - 1] ?? 0), fps, config: { damping: 6 } });
        return (
          <g transform={`translate(860 70) scale(${0.85 + 0.15 * pop})`}>
            <circle r={48} fill="#ff3b5c" stroke="#fff" strokeWidth={6} />
            <text y={16} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={44} fill="#fff">{n}</text>
          </g>
        );
      })()}
    </>
  );
};

/** La meta se aleja: el personaje corre, la bandera huye y la barra de satisfacción se vacía. */
export const GoalMoves: React.FC<DP> = ({ theme }) => {
  const t = useFrame();
  const tr = useT();
  // dos ciclos: se acerca (llenando satisfacción) y la meta salta lejos con un "NUEVO"
  const cyc = 75;
  const u = (t % cyc) / cyc;
  const near = interpolate(u, [0, 0.7], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const jump = interpolate(u, [0.72, 0.85], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) });
  const flagX = 860 - near * 300 + jump * 300;
  const fill = near * (1 - jump);
  const wave = (k: number) => Math.sin(t / 4 + k) * 8;
  return (
    <>
      <FomoDefs />
      {/* suelo con pista */}
      <rect x={40} y={640} width={920} height={60} rx={20} fill="#1d2a45" />
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={((i * 110 - t * 8) % 1100 + 1100) % 1100 - 60} y={664} width={60} height={10} rx={5} fill="#ffffff40" />)}
      <ellipse cx={360} cy={650} rx={80} ry={13} fill="#000" opacity={0.3} />
      <Runner x={350} y={418} s={1.18} speed={2.2} worried={jump} sweat={0.6} />
      {/* bandera de meta */}
      <g transform={`translate(${flagX} 0)`}>
        <ellipse cx={0} cy={648} rx={40} ry={8} fill="#000" opacity={0.3} />
        <rect x={-6} y={300} width={12} height={350} rx={6} fill="url(#fMetal)" />
        <path d={`M 6 310 C 60 ${300 + wave(0)}, 100 ${330 + wave(1)}, 160 ${312 + wave(2)} L 160 ${402 + wave(2)} C 100 ${420 + wave(1)}, 60 ${390 + wave(0)}, 6 400 Z`} fill="url(#fCloth)" stroke="#c94a2a" strokeWidth={3} />
        {[0, 1, 2].map((r) => [0, 1, 2, 3].map((k) => (r + k) % 2 ? null : <rect key={`${r}${k}`} x={14 + k * 36} y={318 + r * 28 + wave(k) * 0.5} width={34} height={26} fill="#fff" opacity={0.85} />))}
        <circle cx={0} cy={296} r={12} fill="url(#sph-yellow)" />
      </g>
      {jump > 0.05 && jump < 0.99 && (
        <g transform={`translate(${flagX - 40} 250) scale(${jump})`}>
          <rect x={-70} y={-30} width={140} height={56} rx={28} fill={theme.accent} />
          <text y={10} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={28} fill="#fff">{tr.newBadge}</text>
        </g>
      )}
      {/* tubo de satisfacción */}
      <g transform="translate(110 150)">
        <rect x={0} y={0} width={70} height={380} rx={35} fill="#ffffff10" stroke="#ffffff50" strokeWidth={4} />
        <rect x={10} y={10 + (1 - fill) * 360} width={50} height={fill * 360} rx={25} fill={theme.accent2} style={{ filter: `drop-shadow(0 0 12px ${theme.accent2})` }} />
        <rect x={8} y={8} width={22} height={364} rx={11} fill="url(#fTube)" />
      </g>
      <Label x={145} y={580} text={tr.satisfaction} color={theme.accent2} size={30} font={display} delay={5} />
    </>
  );
};

/** Cerebro saturado: pestañas que aparecen alrededor, termómetro que sube y vapor. */
export const BrainTabs: React.FC<DP> = ({ theme }) => {
  const t = useFrame();
  const heat = interpolate(t, [10, 110], [0.15, 1], clamp);
  const shake = heat > 0.7 ? Math.sin(t * 2.3) * 4 * heat : 0;
  const tabs = 14;
  return (
    <>
      <FomoDefs />
      {/* pestañas en órbita */}
      {Array.from({ length: tabs }, (_, i) => {
        const at = 6 + i * 7;
        const s = spring({ frame: t - at, fps, config: { damping: 11, stiffness: 170 } });
        if (t < at) return null;
        const a = (i / tabs) * Math.PI * 2 + t / 90;
        const r = 300 + (i % 3) * 40;
        const x = 500 + Math.cos(a) * r, y = 400 + Math.sin(a) * r * 0.75;
        const color = [theme.accent, theme.accent2, "#f2c14e", "#b98bff"][i % 4];
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s * 0.95}) rotate(${Math.sin(a) * 8})`}>
            <path d="M -80 -30 L -64 -50 L 4 -50 L 18 -30 Z" fill="#26324d" stroke="#ffffff40" strokeWidth={2} />
            <rect x={-90} y={-30} width={180} height={70} rx={12} fill="#16203a" stroke="#ffffff40" strokeWidth={3} />
            <rect x={-90} y={-30} width={180} height={70} rx={12} fill="url(#fCard)" />
            <circle cx={-66} cy={-40} r={6} fill={color} />
            <rect x={-74} y={-12} width={110} height={10} rx={5} fill="#ffffff50" />
            <rect x={-74} y={8} width={70} height={10} rx={5} fill="#ffffff30" />
            <text x={70} y={-33} textAnchor="middle" fontFamily={body} fontWeight={800} fontSize={18} fill="#ffffff90">×</text>
          </g>
        );
      })}
      {/* cerebro */}
      <g transform={`translate(${500 + shake} 400)`}>
        <clipPath id="brainClip"><path d="M -170 10 C -190 -90 -110 -160 -20 -150 C 40 -190 150 -150 165 -70 C 210 -30 195 70 140 95 C 120 150 30 160 -10 130 C -70 165 -160 130 -165 70 C -200 55 -195 25 -170 10 Z" /></clipPath>
        <ellipse cx={0} cy={190} rx={150} ry={18} fill="#000" opacity={0.25} />
        <path d="M -170 10 C -190 -90 -110 -160 -20 -150 C 40 -190 150 -150 165 -70 C 210 -30 195 70 140 95 C 120 150 30 160 -10 130 C -70 165 -160 130 -165 70 C -200 55 -195 25 -170 10 Z" fill="url(#fBrain)" stroke="#a8436a" strokeWidth={6} strokeLinejoin="round" />
        {["M -120 -60 C -80 -90 -40 -60 -60 -20 C -80 10 -40 40 -10 20", "M 20 -120 C 0 -80 40 -60 70 -80 C 100 -100 130 -60 110 -30", "M -20 -30 C 20 -40 40 0 20 30 C 0 60 40 80 80 60", "M -140 40 C -110 20 -80 50 -100 80", "M 60 0 C 100 -10 130 20 120 60", "M 0 -150 C 0 -60 -10 40 -10 130"].map((d, i) => (
          <path key={i} d={d} stroke="#b9507a" strokeWidth={6} fill="none" strokeLinecap="round" opacity={i === 5 ? 0.5 : 0.8} />
        ))}
        <ellipse cx={-80} cy={-90} rx={40} ry={20} fill="#fff" opacity={0.35} transform="rotate(-25 -80 -90)" />
        <rect x={-170} y={-160} width={340} height={320} fill="#ff3b3b" opacity={heat > 0.6 ? (heat - 0.6) * 0.6 : 0} style={{ mixBlendMode: "multiply" }} clipPath="url(#brainClip)" />
        {/* vapor */}
        {heat > 0.55 && [0, 1, 2].map((i) => {
          const p = ((t + i * 12) % 36) / 36;
          return <circle key={i} cx={-60 + i * 60 + Math.sin(p * 6) * 10} cy={-170 - p * 120} r={16 + p * 26} fill="#ffffff" opacity={(1 - p) * 0.35 * heat} />;
        })}
      </g>
      {/* termómetro */}
      <g transform="translate(880 520)">
        <rect x={-22} y={-200} width={44} height={230} rx={22} fill="#ffffff20" stroke="#ffffff70" strokeWidth={4} />
        <rect x={-12} y={-190 + (1 - heat) * 210} width={24} height={heat * 210} rx={12} fill={heat > 0.6 ? "#ff3b3b" : "#f2c14e"} />
        <circle cy={50} r={36} fill={heat > 0.6 ? "#ff3b3b" : "#f2c14e"} stroke="#fff" strokeWidth={6} />
        <Sphere x={-10} y={40} r={8} color="white" opacity={0.6} />
      </g>
    </>
  );
};
