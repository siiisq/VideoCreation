import React from "react";
import { interpolate, spring } from "remotion";
import { body, display } from "../fonts";
import { useT } from "../i18n";
import { ANIM_FPS } from "../time";
import { atF, Cam, focus, prog, WorldProps } from "./World";

/*
 * Mundo "tae": dos ofertas de préstamo (A 6 % sin comisión, B 5 % con 3 % de apertura) → qué es el TIN → letra pequeña
 * → qué suma la TAE → tabla con el resultado → regla para comparar → cierre con las TAE en las tarjetas.
 * Cifras calculadas (cuota fija, TAE = tasa interna anual efectiva sobre lo que recibes):
 *   A: cuota 304,22 € · total 10.951,90 € · TAE 6,17 %      B: cuota 299,71 € · total 11.089,52 € (incl. 300 €) · TAE 7,28 %
 * Composición: el contenido de cada plano va entre 450 y 1600 px de pantalla (arriba, subtítulos).
 */
export const TAE_CAMS: Cam[] = [
  { x: 540, y: 960, w: 1080, rx: 6 },
  { x: 700, y: 1000, w: 980, rx: 7 },
  { x: 760, y: 1040, w: 1000, rx: 7 },
  { x: 540, y: 2350, w: 1080, rx: 6 },
  { x: 540, y: 3700, w: 1080, rx: 6 },
  { x: 540, y: 5050, w: 1080, rx: 6 },
  { x: 540, y: 980, w: 1160, rx: 6 },
];

const fps = ANIM_FPS;
const GOLD = "#f2b84b", GOLD2 = "#ffe2a3", RED = "#ff4d4f", GREEN = "#3ddc84", BLUE = "#6aa8ff", INK = "#e9ecf1", MUTED = "#8b93a1", PANEL = "#14161b";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const num = (v: number, locale: string, dec = 0) => {
  const [i, d] = Math.abs(v).toFixed(dec).split(".");
  const es = locale.startsWith("es");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, es ? "." : ",") + (d ? (es ? "," : ".") + d : "");
};
const eur = (v: number, locale: string, dec = 0) => (locale.startsWith("es") ? `${num(v, locale, dec)} €` : `€${num(v, locale, dec)}`);
const pct = (v: number, locale: string, dec = 0) => (locale.startsWith("es") ? `${num(v, locale, dec)} %` : `${num(v, locale, dec)}%`);

const Defs: React.FC = () => (
  <defs>
    <pattern id="tGrid" width={60} height={60} patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#fff" strokeOpacity={0.045} strokeWidth={1.5} /></pattern>
    <radialGradient id="tSpot" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#2a2f38" stopOpacity={0.9} /><stop offset="100%" stopColor="#0b0c0f" stopOpacity={0} /></radialGradient>
    <radialGradient id="tRedGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={RED} stopOpacity={0.5} /><stop offset="100%" stopColor={RED} stopOpacity={0} /></radialGradient>
    <radialGradient id="tGreenGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={GREEN} stopOpacity={0.4} /><stop offset="100%" stopColor={GREEN} stopOpacity={0} /></radialGradient>
    <radialGradient id="tGoldGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={GOLD} stopOpacity={0.5} /><stop offset="100%" stopColor={GOLD} stopOpacity={0} /></radialGradient>
    <linearGradient id="tCard" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor="#1d2027" /><stop offset="100%" stopColor="#121419" /></linearGradient>
    <linearGradient id="tMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#eef3f8" /><stop offset="50%" stopColor="#9aa4b1" /><stop offset="100%" stopColor="#5b6472" /></linearGradient>
    <radialGradient id="tLens" cx="40%" cy="35%" r="70%"><stop offset="0%" stopColor="#2a3240" /><stop offset="100%" stopColor="#11151c" /></radialGradient>
    <linearGradient id="tBlockGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffd98a" /><stop offset="100%" stopColor="#c98a1c" /></linearGradient>
    <linearGradient id="tBlockRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff8587" /><stop offset="100%" stopColor="#c62f33" /></linearGradient>
    <linearGradient id="tBlockBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9cc6ff" /><stop offset="100%" stopColor="#3b6fc4" /></linearGradient>
    <linearGradient id="tBlockGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7cf0ad" /><stop offset="100%" stopColor="#1f9d57" /></linearGradient>
  </defs>
);

/** Panel oscuro con sombra, borde y brillo de cristal. */
const Panel: React.FC<{ x: number; y: number; w: number; h: number; stroke?: string; sw?: number }> = ({ x, y, w, h, stroke = "#ffffff26", sw = 3 }) => (
  <g>
    <rect x={x + 14} y={y + 20} width={w} height={h} rx={28} fill="#000" opacity={0.45} />
    <rect x={x} y={y} width={w} height={h} rx={28} fill="url(#tCard)" stroke={stroke} strokeWidth={sw} />
    <rect x={x + 10} y={y + 8} width={w - 20} height={Math.min(56, h * 0.16)} rx={18} fill="#fff" opacity={0.05} />
  </g>
);

/** Icono de banco con volumen (frontón + columnas). */
const BankIcon: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -34 -6 L 0 -30 L 34 -6 Z" fill={color} stroke="#00000055" strokeWidth={2} />
    {[-22, -7, 8, 23].map((cx) => <rect key={cx} x={cx - 4} y={-2} width={8} height={26} rx={2} fill={color} opacity={0.85} />)}
    <rect x={-36} y={24} width={72} height={8} rx={3} fill={color} />
    <ellipse cx={-10} cy={-14} rx={8} ry={3} fill="#fff" opacity={0.5} />
  </g>
);

/** Bloque de la "fórmula" de la TAE. */
const Block: React.FC<{ x: number; y: number; w: number; h: number; fill: string; title: string; sub: string; s: number; dark?: boolean }> = ({ x, y, w, h, fill, title, sub, s, dark }) => (
  <g opacity={Math.min(1, s * 1.5)} transform={`translate(${x + w / 2} ${y + h / 2}) scale(${0.7 + 0.3 * s}) translate(${-(x + w / 2)} ${-(y + h / 2)}) translate(0 ${(1 - s) * -80})`}>
    <rect x={x + 10} y={y + 16} width={w} height={h} rx={24} fill="#000" opacity={0.45} />
    <rect x={x} y={y} width={w} height={h} rx={24} fill={fill} stroke="#00000040" strokeWidth={3} />
    <rect x={x + 12} y={y + 8} width={w - 24} height={20} rx={10} fill="#fff" opacity={0.3} />
    <text x={x + 36} y={y + h / 2 + 2} fontFamily={display} fontWeight={900} fontSize={52} fill={dark ? "#14161b" : "#fff"}>{title}</text>
    <text x={x + w - 36} y={y + h / 2 + 2} textAnchor="end" fontFamily={body} fontWeight={700} fontSize={30} fill={dark ? "#14161b" : "#fff"} opacity={0.9}>{sub}</text>
  </g>
);

export const TaeWorld: React.FC<WorldProps> = ({ shot, t, g, data }) => {
  const tr = useT();
  const L = tr.locale;
  const sp = (k: number, delay: number, damping = 11) => (shot > k ? 1 : shot < k ? 0 : spring({ frame: t - delay, fps, config: { damping } }));
  const at = (i: number, def: number) => atF(data, i, def);

  // ---------- plano 0: las dos ofertas ----------
  const cardA = sp(0, 8), cardB = sp(0, 16);
  const numA = sp(0, at(0, 2.4), 8), numB = sp(0, at(1, 3.3), 8);
  const warn = sp(0, at(2, 5.5), 7);
  // ---------- plano 1: TIN ----------
  const tinS = sp(1, at(0, 1.6), 9), tinNote = sp(1, at(1, 4.5), 10);
  // ---------- plano 2: letra pequeña ----------
  const lens = prog(shot, 2, t, at(0, 1.0) - 4, 30);
  const feeS = sp(2, at(1, 3.0), 9), feeStamp = sp(2, at(2, 5.0), 8);
  // ---------- plano 3: la fórmula ----------
  const blocks = [0, 1, 2, 3].map((i) => sp(3, at(i, 1.2 + i * 1.3) - 3, 10));
  // ---------- plano 4: tabla ----------
  const rows = [0, 1, 2, 3].map((i) => sp(4, 20 + i * 14, 12));
  const taeA = sp(4, at(0, 4.0), 9), taeB = sp(4, at(1, 6.0), 9), extra = sp(4, at(2, 8.0), 8);
  // ---------- plano 5: regla ----------
  const rule = [sp(5, at(0, 1.2), 10), sp(5, at(1, 3.0), 10)];
  // ---------- plano 6: cierre ----------
  const finalTae = sp(6, at(0, 2.0), 9), finalStamp = sp(6, at(0, 2.0) + 18, 8);

  const fOffers = 0.3 + 0.7 * focus(shot, t, [0, 1, 2, 6]);
  const fFormula = 0.3 + 0.7 * focus(shot, t, [3]);
  const fTable = 0.3 + 0.7 * focus(shot, t, [4]);
  const fRule = 0.3 + 0.7 * focus(shot, t, [5]);

  const offers = [
    { k: "A", x: 70, color: BLUE, tin: 6, fee: false, cuota: 304.22, s: cardA, n: numA, tae: 6.17 },
    { k: "B", x: 570, color: GOLD, tin: 5, fee: true, cuota: 299.71, s: cardB, n: numB, tae: 7.28 },
  ];

  return (
    <g>
      <Defs />
      <rect x={-3000} y={-3000} width={7080} height={14000} fill="#0b0c0f" />
      <rect x={-3000} y={-3000} width={7080} height={14000} fill="url(#tGrid)" />
      {[1000, 2400, 3750, 5100].map((y, i) => <circle key={i} cx={540} cy={y} r={850} fill="url(#tSpot)" />)}
      {Array.from({ length: 80 }, (_, i) => {
        const sx = ((i * 7919) % 1500) - 210, sy = ((i * 104729) % 6200) - 200;
        return <circle key={i} cx={sx + Math.sin(g / 50 + i) * 12} cy={sy - ((g * (0.3 + (i % 4) * 0.15)) % 300)} r={1.5 + (i % 3)} fill="#fff" opacity={0.05 + (i % 5) * 0.03} />;
      })}

      {/* ================= A · LAS DOS OFERTAS ================= */}
      <g opacity={fOffers}>
        {offers.map((o) => {
          const isB = o.k === "B";
          const glowB = isB && shot === 0 ? numB * (1 - warn) : 0;
          return (
            <g key={o.k} opacity={Math.min(1, o.s * 1.4) * (!isB && (shot === 1 || shot === 2) ? 1 - 0.6 * focus(shot, t, [1, 2]) : 1)} transform={`translate(0 ${(1 - o.s) * 80 + Math.sin(g / 60 + (isB ? 1 : 0)) * 4})`}>
              {glowB > 0 && <ellipse cx={o.x + 220} cy={900} rx={330} ry={420} fill="url(#tGoldGlow)" opacity={glowB * (0.6 + 0.3 * Math.sin(g / 6))} />}
              <Panel x={o.x} y={520} w={440} h={980} stroke={isB && warn > 0.05 ? RED : o.color} sw={4} />
              <BankIcon x={o.x + 70} y={600} color={o.color} />
              <text x={o.x + 120} y={612} fontFamily={display} fontWeight={900} fontSize={40} fill={INK}>{isB ? tr.taeBankB : tr.taeBankA}</text>
              <text x={o.x + 40} y={700} fontFamily={body} fontWeight={700} fontSize={26} fill={MUTED}>{tr.taeLoan}</text>
              {/* chip TIN */}
              <g transform={`translate(${o.x + 220} 760) scale(${1 + (isB ? tinS * 0.15 * (1 + 0.15 * Math.sin(g / 5)) : 0)})`}>
                <rect x={-56} y={-26} width={112} height={52} rx={26} fill={isB && tinS > 0.05 ? GOLD : "#2a2e36"} />
                <text y={12} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={30} fill={isB && tinS > 0.05 ? "#1a1406" : INK}>TIN</text>
              </g>
              <text x={o.x + 220} y={940} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={170} fill={INK}
                opacity={o.n} transform={`translate(${o.x + 220} 880) scale(${0.6 + 0.4 * o.n}) translate(${-(o.x + 220)} -880)`}>{pct(o.tin, L)}</text>
              <line x1={o.x + 40} y1={1010} x2={o.x + 400} y2={1010} stroke="#ffffff20" strokeWidth={2} />
              <text x={o.x + 220} y={1058} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={26} fill={MUTED}>{tr.taeMonthly}</text>
              <text x={o.x + 220} y={1104} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={38} fill={INK}>{eur(o.cuota, L, 2)}</text>
              {/* TAE (aparece al final) */}
              {shot >= 6 && (
                <g opacity={finalTae} transform={`translate(${o.x + 220} 1215) scale(${0.7 + 0.3 * finalTae})`}>
                  <ellipse cx={0} cy={0} rx={220} ry={90} fill={isB ? "url(#tRedGlow)" : "url(#tGreenGlow)"} />
                  <rect x={-170} y={-50} width={340} height={100} rx={50} fill={isB ? RED : GREEN} />
                  <text y={17} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={46} fill={isB ? "#fff" : "#0b2a18"}>TAE {pct(o.tae, L, 2)}</text>
                </g>
              )}
              {/* letra pequeña */}
              {[0, 1, 2].map((i) => (
                <text key={i} x={o.x + 40} y={1330 + i * 34} fontFamily={body} fontWeight={600} fontSize={18} fill="#6c7482">
                  {isB && i === 1 ? tr.taeFinePrintB : tr.taeFinePrint}
                </text>
              ))}
            </g>
          );
        })}
        {/* ¿cuál es más barato? */}
        <g opacity={sp(0, at(1, 3.3) + 10) * (shot === 0 ? 1 : 0)}>
          <circle cx={540} cy={860} r={46} fill={PANEL} stroke={INK} strokeWidth={4} />
          <text x={540} y={882} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={60} fill={INK}>?</text>
        </g>
        {/* aviso */}
        {shot === 0 && warn > 0 && (
          <g transform={`translate(1010 540) scale(${warn}) rotate(${Math.sin(g / 4) * 4})`}>
            <path d="M 0 -52 L 50 36 L -50 36 Z" fill={RED} stroke="#7a1a1d" strokeWidth={5} strokeLinejoin="round" />
            <rect x={-5} y={-22} width={10} height={34} rx={4} fill="#fff" />
            <circle cx={0} cy={24} r={6} fill="#fff" />
          </g>
        )}
        {/* plano 1: qué es el TIN (dentro de la tarjeta B, bajo el número) */}
        {shot >= 1 && shot <= 2 && (
          <g opacity={tinNote * (shot === 2 ? 1 - lens : 1)}>
            <rect x={600} y={1140} width={380} height={130} rx={20} fill="#0b0c0f" stroke={GOLD} strokeWidth={3} />
            <text x={790} y={1192} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={34} fill={GOLD2}>{tr.taeTinIs}</text>
            <text x={790} y={1238} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={26} fill={INK}>{tr.taeTinIsB}</text>
          </g>
        )}
        {/* plano 2: lupa sobre la letra pequeña de B */}
        {shot >= 2 && shot < 6 && (
          <g opacity={lens} transform={`translate(${interpolate(lens, [0, 1], [1100, 790])} ${1300 + Math.sin(g / 20) * 6})`}>
            <line x1={150} y1={150} x2={260} y2={260} stroke="url(#tMetal)" strokeWidth={34} strokeLinecap="round" />
            <circle r={230} fill="url(#tLens)" stroke="url(#tMetal)" strokeWidth={22} />
            <circle r={230} fill="none" stroke="#000" strokeOpacity={0.4} strokeWidth={4} />
            <text y={-60} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={36} fill={MUTED}>{tr.taeFeeLabel}</text>
            <g opacity={feeS} transform={`scale(${0.7 + 0.3 * feeS})`}>
              <text y={30} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={84} fill={RED}>{pct(3, L)}</text>
              <text y={100} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={52} fill={RED}>= {eur(300, L)}</text>
            </g>
            <ellipse cx={-90} cy={-120} rx={70} ry={30} fill="#fff" opacity={0.08} transform="rotate(-30 -90 -120)" />
          </g>
        )}
        {false && feeStamp > 0 && (
          <g transform={`translate(790 760) rotate(-10) scale(${2 - feeStamp})`} opacity={Math.min(1, feeStamp * 1.5) * 0.95}>
            <rect x={-200} y={-46} width={400} height={92} rx={14} fill="none" stroke={RED} strokeWidth={9} />
            <text y={16} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={42} fill={RED}>{tr.taeFeeStamp}</text>
          </g>
        )}
        {/* cierre: sello */}
        {shot >= 6 && finalStamp > 0 && (
          <g transform={`translate(540 1610) rotate(-4) scale(${2.2 - 1.2 * finalStamp})`} opacity={Math.min(1, finalStamp * 1.5)}>
            <rect x={-300} y={-60} width={600} height={120} rx={18} fill="#0b0c0f" stroke={GOLD} strokeWidth={8} />
            <text y={20} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={58} fill={GOLD2}>{tr.taeLookTae}</text>
          </g>
        )}
      </g>

      {/* ================= B · LA FÓRMULA DE LA TAE ================= */}
      <g opacity={fFormula}>
        <text x={540} y={1890} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={38} letterSpacing={3} fill={MUTED}>{tr.taeFormulaTitle}</text>
        <Block x={140} y={1950} w={800} h={150} fill="url(#tBlockGold)" title="TIN" sub={tr.taeInterest} s={blocks[0]} dark />
        <text x={540} y={2178} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={60} fill={INK} opacity={blocks[1]}>+</text>
        <Block x={140} y={2210} w={800} h={150} fill="url(#tBlockRed)" title={tr.taeFees} sub={tr.taeFeesSub} s={blocks[1]} />
        <text x={540} y={2438} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={60} fill={INK} opacity={blocks[2]}>+</text>
        <Block x={140} y={2470} w={800} h={150} fill="url(#tBlockBlue)" title={tr.taeFreq} sub={tr.taeFreqSub} s={blocks[2]} />
        <text x={540} y={2700} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={60} fill={INK} opacity={blocks[3]}>=</text>
        {blocks[3] > 0 && <ellipse cx={540} cy={2830} rx={480} ry={170} fill="url(#tGreenGlow)" opacity={blocks[3] * (0.6 + 0.3 * Math.sin(g / 7))} />}
        <Block x={100} y={2740} w={880} h={180} fill="url(#tBlockGreen)" title="TAE" sub={tr.taeRealCost} s={blocks[3]} dark />
      </g>

      {/* ================= C · LA TABLA ================= */}
      <g opacity={fTable}>
        <text x={540} y={3230} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={32} fill={MUTED}>{tr.taeExample}</text>
        <Panel x={80} y={3270} w={920} h={760} />
        {[tr.taeBankA, tr.taeBankB].map((s, i) => (
          <text key={i} x={i ? 860 : 620} y={3350} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={36} fill={i ? GOLD2 : BLUE}>{s}</text>
        ))}
        {[
          { label: "TIN", a: pct(6, L), b: pct(5, L), bRed: false },
          { label: tr.taeFeeShort, a: eur(0, L), b: eur(300, L), bRed: true },
          { label: tr.taeMonthly, a: eur(304.22, L, 2), b: eur(299.71, L, 2), bRed: false },
          { label: tr.taeTotal, a: eur(10951.9, L, 0), b: eur(11089.52, L, 0), bRed: true },
        ].map((r, i) => (
          <g key={i} opacity={rows[i]} transform={`translate(${(1 - rows[i]) * -40} 0)`}>
            <line x1={120} y1={3390 + i * 110} x2={960} y2={3390 + i * 110} stroke="#ffffff18" strokeWidth={2} />
            <text x={130} y={3460 + i * 110} fontFamily={body} fontWeight={700} fontSize={32} fill={MUTED}>{r.label}</text>
            <text x={620} y={3462 + i * 110} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={38} fill={INK}>{r.a}</text>
            <text x={860} y={3462 + i * 110} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={38} fill={r.bRed ? RED : INK}>{r.b}</text>
          </g>
        ))}
        {/* fila de la TAE, grande */}
        <line x1={120} y1={3830} x2={960} y2={3830} stroke={GOLD} strokeWidth={3} opacity={Math.max(taeA, taeB)} />
        <text x={130} y={3930} fontFamily={display} fontWeight={900} fontSize={52} fill={GOLD2} opacity={Math.max(taeA, taeB)}>TAE</text>
        <g opacity={taeA} transform={`translate(620 3930) scale(${0.7 + 0.3 * taeA})`}>
          <ellipse cx={0} cy={-20} rx={140} ry={70} fill="url(#tGreenGlow)" />
          <text textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={60} fill={GREEN}>{pct(6.17, L, 2)}</text>
        </g>
        <g opacity={taeB} transform={`translate(860 3930) scale(${0.7 + 0.3 * taeB})`}>
          <ellipse cx={0} cy={-20} rx={140} ry={70} fill="url(#tRedGlow)" opacity={0.7 + 0.3 * Math.sin(g / 6)} />
          <text textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={60} fill={RED}>{pct(7.28, L, 2)}</text>
        </g>
        <g opacity={extra} transform={`translate(540 4180) scale(${0.8 + 0.2 * extra})`}>
          <rect x={-360} y={-62} width={720} height={124} rx={62} fill={PANEL} stroke={RED} strokeWidth={4} />
          <text y={-6} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={54} fill={RED}>+{eur(138, L)}</text>
          <text y={38} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={28} fill={INK}>{tr.taeExtra}</text>
        </g>
      </g>

      {/* ================= D · LA REGLA ================= */}
      <g opacity={fRule}>
        <text x={540} y={4600} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={38} letterSpacing={3} fill={MUTED}>{tr.taeRuleTitle}</text>
        {[
          { x: 80, title: tr.taeLoans, sub: tr.taeLower, up: false, s: rule[0] },
          { x: 560, title: tr.taeSavings, sub: tr.taeHigher, up: true, s: rule[1] },
        ].map((r, i) => {
          const bob = Math.sin(g / 8 + i) * 12;
          return (
            <g key={i} opacity={Math.min(1, r.s * 1.4)} transform={`translate(0 ${(1 - r.s) * 60})`}>
              <Panel x={r.x} y={4660} w={440} h={820} stroke={GREEN} />
              <text x={r.x + 220} y={4760} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={44} fill={INK}>{r.title}</text>
              <ellipse cx={r.x + 220} cy={5040} rx={150} ry={150} fill="url(#tGreenGlow)" />
              <g transform={`translate(${r.x + 220} ${5040 + (r.up ? -bob : bob)}) rotate(${r.up ? 0 : 180})`}>
                <path d="M 0 -130 L 90 -20 L 34 -20 L 34 120 L -34 120 L -34 -20 L -90 -20 Z" fill="url(#tBlockGreen)" stroke="#14512f" strokeWidth={5} strokeLinejoin="round" />
                <path d="M -20 -10 L -20 100" stroke="#fff" strokeOpacity={0.35} strokeWidth={10} strokeLinecap="round" />
              </g>
              <text x={r.x + 220} y={5300} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={46} fill={GREEN}>{r.sub}</text>
              <text x={r.x + 220} y={5360} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={30} fill={MUTED}>{tr.taeBetter}</text>
            </g>
          );
        })}
      </g>
    </g>
  );
};
