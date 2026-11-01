import React from "react";
import { interpolate, spring, staticFile } from "remotion";
import { body, display } from "../fonts";
import { useT } from "../i18n";
import { ANIM_FPS } from "../time";
import { Cam, focus, prog, WorldProps } from "./World";

/*
 * Mundo "irpf": nómina (arriba) → cesta de la compra → escalera de tramos → neto que falta (abajo).
 * Estética técnica oscura: casi negro, un acento dorado, rojo SOLO para lo que pagas de más, verde para "igual/bien".
 * Planos (scene.shot): 0 sube el bruto · 1 suben los precios · 2 tramos fijos · 3 IRPF en rojo · 4 neto que falta
 *                       5 deflactar · 6 sello final.
 * Ejemplo simplificado (escala general 19/24/30/37 % + mínimo personal 5.550 €):
 *   30.000 € → IRPF 6.111 € · neto 23.889 €;  34.800 € (+16 %) → IRPF 7.551 € (+24 %) · neto 27.249 €;
 *   mismo poder de compra que antes = 23.889 × 1,16 = 27.711 € → faltan 462 €.
 */
export const IRPF_CAMS: Cam[] = [
  { x: 540, y: 800, w: 1000, rx: 16 },
  { x: 540, y: 1330, w: 1500, rx: 4 },
  { x: 540, y: 2880, w: 1200, rx: 14 },
  { x: 560, y: 800, w: 900, rx: 12, rz: -1 },
  { x: 540, y: 3790, w: 1120, rx: 6 },
  { x: 560, y: 2880, w: 1160, rx: 12, rz: 1 },
  { x: 540, y: 860, w: 1220, rx: 8 },
];

const fps = ANIM_FPS;
const GOLD = "#f2b84b", GOLD2 = "#ffe2a3", RED = "#ff4d4f", GREEN = "#3ddc84", INK = "#e9ecf1", MUTED = "#8b93a1";
const PAPER_INK = "#26303b", PAPER_RED = "#d62f35", PAPER_GREEN = "#17914f";
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const fmt = (v: number, locale: string, dec = 0) => {
  const [i, d] = Math.abs(v).toFixed(dec).split(".");
  const sep = locale.startsWith("es") ? "." : ",", dsep = locale.startsWith("es") ? "," : ".";
  return (v < 0 ? "−" : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, sep) + (d ? dsep + d : "");
};
const eur = (v: number, locale: string, dec = 0) => (locale.startsWith("es") ? `${fmt(v, locale, dec)} €` : `€${fmt(v, locale, dec)}`);

const Defs: React.FC = () => (
  <defs>
    <linearGradient id="wPaper" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stopColor="#fbf8f2" /><stop offset="100%" stopColor="#e6e0d4" /></linearGradient>
    <linearGradient id="wThermal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fbfbf8" /><stop offset="100%" stopColor="#dedfdb" /></linearGradient>
    <linearGradient id="wMetalFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3a3f49" /><stop offset="100%" stopColor="#16191e" /></linearGradient>
    <linearGradient id="wMetalTop" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#5a606c" /><stop offset="100%" stopColor="#2e323a" /></linearGradient>
    <linearGradient id="wMetalSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#202329" /><stop offset="100%" stopColor="#0f1114" /></linearGradient>
    <linearGradient id="wBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f4f6f9" /><stop offset="55%" stopColor="#c3c9d2" /><stop offset="100%" stopColor="#8d95a1" /></linearGradient>
    <radialGradient id="wGold" cx="35%" cy="30%" r="75%"><stop offset="0%" stopColor="#fff6d8" /><stop offset="45%" stopColor={GOLD} /><stop offset="100%" stopColor="#8a5a00" /></radialGradient>
    <radialGradient id="wGoldGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={GOLD} stopOpacity={0.55} /><stop offset="100%" stopColor={GOLD} stopOpacity={0} /></radialGradient>
    <radialGradient id="wRedGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={RED} stopOpacity={0.5} /><stop offset="100%" stopColor={RED} stopOpacity={0} /></radialGradient>
    <radialGradient id="wGreenGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={GREEN} stopOpacity={0.45} /><stop offset="100%" stopColor={GREEN} stopOpacity={0} /></radialGradient>
    <radialGradient id="wSpot" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#2a2f38" stopOpacity={0.9} /><stop offset="100%" stopColor="#0b0c0f" stopOpacity={0} /></radialGradient>
    <pattern id="wGrid" width={60} height={60} patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" strokeOpacity={0.045} strokeWidth={1.5} /></pattern>
  </defs>
);

/** Textura de grano (PNG estático) recortada a una forma: papel, tinta, metal. */
const Grain: React.FC<{ id: string; x: number; y: number; w: number; h: number; opacity?: number; children: React.ReactNode }> = ({ id, x, y, w, h, opacity = 0.22, children }) => (
  <g>
    <clipPath id={id}>{children}</clipPath>
    <image href={staticFile("fx/grain.png")} x={x} y={y} width={w} height={h} preserveAspectRatio="none" opacity={opacity} clipPath={`url(#${id})`} style={{ mixBlendMode: "multiply" }} />
  </g>
);

/** Chip de variación (+16 %, +24 %…). */
const Chip: React.FC<{ x: number; y: number; text: string; color: string; s: number; dark?: boolean }> = ({ x, y, text, color, s, dark }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, s)}>
    <rect x={-74} y={-30} width={148} height={60} rx={30} fill={color} />
    <rect x={-62} y={-24} width={124} height={14} rx={7} fill="#fff" opacity={0.28} />
    <text y={13} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={34} fill={dark ? "#111" : "#fff"}>{text}</text>
  </g>
);

/** Líneas de campo doradas que salen de un punto (como cargas eléctricas): vida constante. */
const FieldArcs: React.FC<{ x: number; y: number; g: number; color?: string; n?: number; r?: number }> = ({ x, y, g, color = GOLD, n = 6, r = 90 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const rr = r * (0.55 + (i % 3) * 0.28);
      const dir = i % 2 ? 1 : -1;
      const dash = (g * 2 + i * 13) % 40;
      return <path key={i} d={`M ${x} ${y} q ${dir * rr * 0.6} ${-rr * 1.1} ${dir * rr} 0`} fill="none" stroke={color} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-dash}
        opacity={0.35 + 0.4 * Math.abs(Math.sin(g / 18 + i))} strokeLinecap="round" />;
    })}
  </g>
);

export const IrpfWorld: React.FC<WorldProps> = ({ shot, t, g }) => {
  const tr = useT();
  const L = tr.locale;
  const sp = (k: number, delay: number, damping = 11) => (shot > k ? 1 : shot < k ? 0 : spring({ frame: t - delay, fps, config: { damping } }));

  // ---- progresos por plano ----
  const pRaise = prog(shot, 0, t, 28, 55);           // bruto 30.000 → 34.800
  const pPrices = prog(shot, 1, t, 34, 55);          // cesta 100 → 116
  const pFill = prog(shot, 2, t, 40, 70);            // escalera: el sueldo sube y entra más en el 30 %
  const pTax = prog(shot, 3, t, 34, 60);             // IRPF 6.111 → 7.551 (rojo)
  const pNet = prog(shot, 4, t, 30, 60);             // barras de neto
  const pDefl = prog(shot, 5, t, 38, 70);            // deflactar: los tramos se estiran
  const stamp = shot >= 6 ? spring({ frame: shot > 6 ? 999 : t - 40, fps, config: { damping: 9, stiffness: 180 } }) : 0;

  const gross = lerp(30000, 34800, pRaise);
  const tax = lerp(6111, 7551, pTax);
  const net = lerp(23889, 27249, pTax);

  // ---- foco (lo que no toca ahora se atenúa, como desenfoque de cámara) ----
  const fPay = 0.3 + 0.7 * focus(shot, t, [0, 1, 3, 6]);
  const fTicket = 0.3 + 0.7 * focus(shot, t, [1]);
  const fStairs = 0.3 + 0.7 * focus(shot, t, [2, 5]);
  const fNet = 0.3 + 0.7 * focus(shot, t, [4]);

  // ---- escalera de tramos ----
  const k = 1 + 0.16 * pDefl;                         // tramos deflactados (×1,16)
  const X = (v: number) => 130 + (v / 60000) * 820;
  const base = 3260;
  const steps = [
    { lo: 0, hi: 12450, rate: 19, h: 110 },
    { lo: 12450, hi: 20200, rate: 24, h: 180 },
    { lo: 20200, hi: 35200, rate: 30, h: 260 },
    { lo: 35200, hi: 60000, rate: 37, h: 350 },
  ];
  const stairSalary = lerp(30000, 34800, pFill);
  const redFrom = X(30000 * k), redTo = X(stairSalary);
  const markerStep = steps.findIndex((s) => stairSalary < s.hi * k);
  const markerY = base - steps[Math.max(0, markerStep)].h;
  const lockOpen = pDefl;

  // ---- barras de neto ----
  const NX = (v: number) => 150 + ((v - 25000) / 3000) * 760;
  const need = 27711, have = lerp(25000, 27249, pNet);
  const gapS = sp(4, 70, 8);

  return (
    <g>
      <Defs />
      {/* fondo infinito con rejilla técnica y focos bajo cada zona */}
      <rect x={-3000} y={-3000} width={7080} height={10500} fill="#0b0c0f" />
      <rect x={-3000} y={-3000} width={7080} height={10500} fill="url(#wGrid)" />
      {[[540, 830, 900], [540, 1900, 700], [540, 2950, 900], [540, 3820, 800]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="url(#wSpot)" />)}
      {/* polvo en suspensión (tiempo global → continuo entre escenas) */}
      {Array.from({ length: 60 }, (_, i) => {
        const sx = ((i * 7919) % 1500) - 210, sy = ((i * 104729) % 4600) - 200;
        const y = sy - ((g * (0.3 + (i % 4) * 0.15)) % 300);
        return <circle key={i} cx={sx + Math.sin(g / 50 + i) * 12} cy={y} r={1.5 + (i % 3)} fill="#ffffff" opacity={0.06 + (i % 5) * 0.03} />;
      })}

      {/* ================= NÓMINA ================= */}
      <g opacity={fPay} transform={`translate(0 ${Math.sin(g / 60) * 4})`}>
        <rect x={150} y={340} width={840} height={1060} rx={18} fill="#000" opacity={0.45} />
        <rect x={120} y={300} width={840} height={1060} rx={16} fill="url(#wPaper)" stroke="#b7b0a2" strokeWidth={3} />
        <Grain id="gPay" x={120} y={300} w={840} h={1060} opacity={0.2}><rect x={120} y={300} width={840} height={1060} rx={16} /></Grain>
        <path d="M 900 300 L 960 360 L 900 360 Z" fill="#c9c1b1" stroke="#b7b0a2" strokeWidth={2} />
        <text x={170} y={400} fontFamily={display} fontWeight={900} fontSize={42} fill={PAPER_INK} letterSpacing={2}>{tr.wPayslip}</text>
        <text x={170} y={442} fontFamily={body} fontWeight={600} fontSize={24} fill="#6a7380">{tr.wCompany}</text>
        {Array.from({ length: 22 }, (_, i) => <rect key={i} x={730 + i * 8} y={1210} width={i % 3 ? 3 : 5} height={56} fill={PAPER_INK} opacity={0.7} />)}
        <line x1={170} y1={480} x2={910} y2={480} stroke="#b9b2a4" strokeWidth={3} />
        {[
          { y: 600, label: tr.wGross, v: eur(gross, L), color: pRaise > 0.02 ? PAPER_GREEN : PAPER_INK, glow: "wGoldGlow", on: shot === 0 },
          { y: 790, label: tr.wTax, v: eur(tax, L), color: pTax > 0.02 ? PAPER_RED : PAPER_INK, glow: "wRedGlow", on: shot === 3 },
          { y: 980, label: tr.wNet, v: eur(net, L), color: PAPER_INK, glow: "wGoldGlow", on: false },
        ].map((r, i) => (
          <g key={i}>
            {r.on && <ellipse cx={540} cy={r.y - 18} rx={460} ry={110} fill={`url(#${r.glow})`} opacity={0.55 + 0.25 * Math.sin(g / 8)} />}
            <text x={170} y={r.y - 46} fontFamily={body} fontWeight={700} fontSize={30} fill="#5a6472">{r.label}</text>
            <text x={910} y={r.y + 16} textAnchor="end" fontFamily={display} fontWeight={900} fontSize={72} fill={r.color}>{r.v}</text>
            <line x1={170} y1={r.y + 60} x2={910} y2={r.y + 60} stroke="#c4bdaf" strokeWidth={2} strokeDasharray="6 8" />
          </g>
        ))}
        <Chip x={300} y={590} text="+16 %" color={PAPER_GREEN} s={sp(0, 80, 8)} />
        <Chip x={300} y={780} text="+24 %" color={PAPER_RED} s={sp(3, 90, 8)} />
        {/* comparación: el impuesto sube más que el sueldo */}
        {pTax > 0 && (
          <g opacity={sp(3, 110)}>
            <text x={540} y={1160} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={38} fill={PAPER_INK}>
              <tspan fill={PAPER_GREEN}>{tr.wSalary} +16 %</tspan>  ·  <tspan fill={PAPER_RED}>IRPF +24 %</tspan>
            </text>
          </g>
        )}
        <text x={540} y={1320} textAnchor="middle" fontFamily={body} fontWeight={600} fontSize={20} fill="#7c8490">{tr.wIllustrative}</text>
        {/* sello final */}
        {stamp > 0 && (
          <g transform={`translate(540 1150) rotate(-11) scale(${2.4 - 1.4 * stamp})`} opacity={Math.min(1, stamp * 1.6) * 0.92}>
            <rect x={-370} y={-74} width={740} height={148} rx={16} fill="none" stroke={PAPER_RED} strokeWidth={12} />
            <rect x={-350} y={-56} width={700} height={112} rx={10} fill="none" stroke={PAPER_RED} strokeWidth={4} />
            <text y={19} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={52} fill={PAPER_RED} letterSpacing={2}>{tr.wStamp}</text>
            <Grain id="gStamp" x={-380} y={-80} w={760} h={160} opacity={0.9}><rect x={-370} y={-74} width={740} height={148} /></Grain>
          </g>
        )}
      </g>

      {/* ================= CESTA / TICKET ================= */}
      <g opacity={fTicket}>
        <g transform={`rotate(${2 + Math.sin(g / 70) * 0.8} 540 1900)`}>
          <rect x={360} y={1560} width={420} height={720} fill="#000" opacity={0.4} transform="translate(18 22)" />
          <path d={`M 340 1540 H 760 V 2260 ${Array.from({ length: 14 }, (_, i) => `L ${760 - (i + 0.5) * 30} ${i % 2 ? 2260 : 2280}`).join(" ")} L 340 2260 Z`} fill="url(#wThermal)" stroke="#c7c9c4" strokeWidth={2} />
          <Grain id="gTicket" x={340} y={1540} w={420} h={740} opacity={0.3}><rect x={340} y={1540} width={420} height={740} /></Grain>
          <text x={550} y={1615} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={34} fill="#2b2f36" letterSpacing={3}>{tr.wReceipt}</text>
          <line x1={370} y1={1650} x2={730} y2={1650} stroke="#9aa0a8" strokeWidth={2} strokeDasharray="4 6" />
          {[[tr.wFood, 55], [tr.wHome, 20], [tr.wTransport, 15], [tr.wOther, 10]].map(([name, v], i) => (
            <g key={i}>
              <text x={375} y={1720 + i * 70} fontFamily={body} fontWeight={600} fontSize={30} fill="#3a3f47">{name as string}</text>
              <text x={725} y={1720 + i * 70} textAnchor="end" fontFamily={body} fontWeight={700} fontSize={30} fill="#2b2f36">{eur((v as number) * lerp(1, 1.16, pPrices), L, 2)}</text>
            </g>
          ))}
          <line x1={370} y1={2010} x2={730} y2={2010} stroke="#9aa0a8" strokeWidth={2} strokeDasharray="4 6" />
          <text x={375} y={2085} fontFamily={display} fontWeight={900} fontSize={40} fill="#2b2f36">{tr.wTotal}</text>
          <text x={725} y={2085} textAnchor="end" fontFamily={display} fontWeight={900} fontSize={46} fill={pPrices > 0.02 ? "#b0700a" : "#2b2f36"}>{eur(100 * lerp(1, 1.16, pPrices), L, 2)}</text>
          {Array.from({ length: 30 }, (_, i) => <rect key={i} x={400 + i * 10.5} y={2150} width={i % 4 ? 3 : 6} height={60} fill="#2b2f36" opacity={0.75} />)}
        </g>
        <Chip x={800} y={2075} text="+16 %" color={GOLD} s={sp(1, 95, 8)} dark />
        {/* igualdad: sueldo +16 % = precios +16 % */}
        <g transform={`translate(540 1460) scale(${sp(1, 125, 10)})`} opacity={sp(1, 125, 10)}>
          <rect x={-330} y={-44} width={660} height={88} rx={44} fill="#121418" stroke={GREEN} strokeWidth={4} />
          <text y={15} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={38} fill={GREEN}>{tr.wSamePower}</text>
        </g>
      </g>

      {/* ================= ESCALERA DE TRAMOS ================= */}
      <g opacity={fStairs}>
        <ellipse cx={560} cy={base + 30} rx={520} ry={40} fill="#000" opacity={0.5} />
        {steps.map((s, i) => {
          const x0 = X(s.lo * k), x1 = Math.min(1010, X(s.hi * k));
          const top = base - s.h, d = 34;
          const fill0 = X(s.lo * k), fill1 = Math.min(x1, X(stairSalary));
          return (
            <g key={i}>
              {/* cara superior y lateral (volumen) */}
              <path d={`M ${x0} ${top} l ${d} ${-d} H ${x1 + d} l ${-d} ${d} Z`} fill="url(#wMetalTop)" stroke="#6b717d" strokeWidth={2} />
              {i === steps.length - 1 && <path d={`M ${x1} ${top} l ${d} ${-d} V ${base - d} l ${-d} ${d} Z`} fill="url(#wMetalSide)" />}
              <rect x={x0} y={top} width={x1 - x0} height={s.h} fill="url(#wMetalFront)" stroke="#0a0b0d" strokeWidth={3} />
              <line x1={x0} y1={top + 1} x2={x1} y2={top + 1} stroke={GOLD} strokeWidth={3} opacity={0.6} />
              {/* euros de tu sueldo que caen en este tramo */}
              {fill1 > fill0 && <rect x={fill0} y={base - 46} width={fill1 - fill0} height={40} fill={GOLD} opacity={0.75} />}
              <text x={(x0 + x1) / 2} y={top + Math.min(90, s.h * 0.62)} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={i === 0 ? 40 : 52} fill={INK}>{s.rate}%</text>
              {i < steps.length - 1 && (
                <g>
                  <line x1={x1} y1={base + 10} x2={x1} y2={base + 60} stroke={MUTED} strokeWidth={2} />
                  <text x={x1} y={base + 92} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={26} fill={pDefl > 0.02 ? GREEN : MUTED}>{fmt(s.hi * k, L)}</text>
                </g>
              )}
            </g>
          );
        })}
        {/* parte que paga más por la inflación: ROJO */}
        {redTo > redFrom + 1 && (
          <g>
            <rect x={redFrom} y={base - 46} width={redTo - redFrom} height={40} fill={RED} opacity={0.8 + 0.2 * Math.sin(g / 5)} />
            <ellipse cx={(redFrom + redTo) / 2} cy={base - 26} rx={Math.max(40, redTo - redFrom)} ry={50} fill="url(#wRedGlow)" />
            <g opacity={interpolate(pFill, [0.5, 0.9], [0, 1], clamp) * (1 - pDefl)}>
              <line x1={(redFrom + redTo) / 2} y1={base - 4} x2={(redFrom + redTo) / 2 + 40} y2={base + 130} stroke={RED} strokeWidth={3} />
              <text x={(redFrom + redTo) / 2 + 40} y={base + 172} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={38} fill={RED}>{tr.wMorePct}</text>
            </g>
          </g>
        )}
        {/* tu sueldo: esfera dorada con líneas de campo */}
        <g>
          <circle cx={X(stairSalary)} cy={markerY - 40} r={90} fill="url(#wGoldGlow)" />
          <FieldArcs x={X(stairSalary)} y={markerY} g={g} />
          <circle cx={X(stairSalary)} cy={markerY - 40} r={34} fill="url(#wGold)" stroke="#8a5a00" strokeWidth={4} />
          <ellipse cx={X(stairSalary) - 11} cy={markerY - 53} rx={10} ry={6} fill="#fff" opacity={0.8} />
          <line x1={X(stairSalary)} y1={markerY - 80} x2={X(stairSalary)} y2={markerY - 150} stroke={GOLD} strokeWidth={2} />
          <rect x={X(stairSalary) - 120} y={markerY - 214} width={240} height={64} rx={32} fill="#121418" stroke={GOLD} strokeWidth={3} />
          <text x={X(stairSalary)} y={markerY - 170} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={34} fill={GOLD2}>{eur(stairSalary, L)}</text>
        </g>
        {/* candado: tramos fijos → deflactados */}
        <g transform={`translate(205 2640) scale(${sp(2, 10, 10)})`}>
          <rect x={-36} y={-6} width={72} height={60} rx={10} fill={lockOpen > 0.5 ? GREEN : "#c9ced6"} stroke="#2a2e35" strokeWidth={4} />
          <path d={`M -22 -6 V -30 a 22 22 0 0 1 44 0 V ${-6 - 34 * lockOpen}`} fill="none" stroke={lockOpen > 0.5 ? GREEN : "#c9ced6"} strokeWidth={9} strokeLinecap="round" transform={`translate(0 ${-26 * lockOpen})`} />
          <circle cx={0} cy={22} r={7} fill="#2a2e35" />
          <text x={58} y={36} fontFamily={display} fontWeight={900} fontSize={40} fill={lockOpen > 0.5 ? GREEN : INK}>{lockOpen > 0.5 ? tr.wDeflated : tr.wFrozen}</text>
        </g>
        {/* los precios suben: flecha dorada */}
        <g opacity={sp(2, 20)}>
          {(() => { const h = 120 + 200 * Math.max(pFill, prog(shot, 2, t, 15, 40)); return (
            <g transform="translate(930 2700)">
              <rect x={-14} y={-h} width={28} height={h} rx={6} fill={GOLD} opacity={0.85} />
              <path d={`M -38 ${-h} L 0 ${-h - 50} L 38 ${-h} Z`} fill={GOLD} />
              <text x={0} y={46} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={30} fill={GOLD2}>{tr.wPricesUp}</text>
            </g>); })()}
        </g>
        {/* deflactar: flechas que empujan los límites */}
        {shot === 5 && pDefl < 1 && pDefl > 0 && steps.slice(0, 3).map((s, i) => (
          <path key={i} d={`M ${X(s.hi * k) + 12} ${base - s.h - 70} h 44 m -16 -16 l 16 16 l -16 16`} stroke={GREEN} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {pDefl > 0.6 && (
          <g transform={`translate(560 ${base + 190}) scale(${sp(5, 115, 9)})`}>
            <rect x={-300} y={-42} width={600} height={84} rx={42} fill="#121418" stroke={GREEN} strokeWidth={4} />
            <path d="M -255 2 l 16 16 l 30 -34" stroke={GREEN} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x={25} y={14} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={36} fill={GREEN}>{tr.wSameBracket}</text>
          </g>
        )}
      </g>

      {/* ================= NETO QUE FALTA ================= */}
      <g opacity={fNet}>
        <text x={150} y={3560} fontFamily={display} fontWeight={900} fontSize={36} fill={MUTED} letterSpacing={2}>{tr.wNetTitle}</text>
        {/* objetivo: lo que necesitas (contorno dorado) */}
        <text x={150} y={3650} fontFamily={body} fontWeight={700} fontSize={32} fill={GOLD2}>{tr.wNeed}</text>
        <rect x={150} y={3670} width={NX(need) - 150} height={90} rx={14} fill="none" stroke={GOLD} strokeWidth={4} strokeDasharray="16 10" strokeDashoffset={-g % 26} />
        <text x={NX(need) - 20} y={3732} textAnchor="end" fontFamily={display} fontWeight={900} fontSize={44} fill={GOLD2}>{eur(need, L)}</text>
        {/* lo que tienes (metal) */}
        <text x={150} y={3850} fontFamily={body} fontWeight={700} fontSize={32} fill={INK}>{tr.wHave}</text>
        <rect x={150} y={3870} width={Math.max(0, NX(have) - 150)} height={90} rx={14} fill="url(#wBar)" />
        <rect x={160} y={3878} width={Math.max(0, NX(have) - 170)} height={16} rx={8} fill="#fff" opacity={0.5} />
        <Grain id="gBar" x={150} y={3870} w={760} h={90} opacity={0.25}><rect x={150} y={3870} width={Math.max(0, NX(have) - 150)} height={90} rx={14} /></Grain>
        {pNet > 0.05 && <text x={NX(have) - 20} y={3932} textAnchor="end" fontFamily={display} fontWeight={900} fontSize={44} fill="#1b1e24">{eur(have, L)}</text>}
        {/* el hueco: ROJO */}
        {gapS > 0 && (
          <g opacity={gapS}>
            <rect x={NX(27249)} y={3870} width={NX(need) - NX(27249)} height={90} rx={6} fill={RED} opacity={0.35 + 0.35 * Math.abs(Math.sin(g / 7))} />
            <ellipse cx={(NX(27249) + NX(need)) / 2} cy={3915} rx={140} ry={120} fill="url(#wRedGlow)" />
            <line x1={(NX(27249) + NX(need)) / 2} y1={3965} x2={(NX(27249) + NX(need)) / 2} y2={4030} stroke={RED} strokeWidth={3} />
            <text x={(NX(27249) + NX(need)) / 2} y={4120} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={96 * (0.8 + 0.2 * gapS)} fill={RED}>{eur(-462, L)}</text>
            <text x={(NX(27249) + NX(need)) / 2} y={4170} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={32} fill={RED}>{tr.wPerYear}</text>
          </g>
        )}
        <line x1={150} y1={3990} x2={910} y2={3990} stroke={MUTED} strokeWidth={2} opacity={0.5} />
        <text x={150} y={4024} fontFamily={body} fontWeight={600} fontSize={22} fill={MUTED}>≈ {eur(25000, L)}</text>
      </g>
    </g>
  );
};

