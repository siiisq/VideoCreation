import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { body, display } from "../fonts";
import { useT } from "../i18n";
import { ANIM_FPS } from "../time";
import { ShareSheet } from "./ShareSheet";
import { atF, Cam, focus, prog, WorldProps } from "./World";

/*
 * Mundo "inflación" (serie Finanzas para empezar, ~30 s): el dinero parado pierde valor.
 * Poder de compra = 10.000 / (1 + inflación)^años. 2 % = objetivo del BCE (ejemplo principal), 3 % como alternativa.
 *   2 %: 10 años → 8.203 € (−1.797 €) · 20 años → 6.730 € · 3 %: 20 años → 5.537 €. Cesta de 100 € → 121,90 € en 10 años al 2 %.
 * Planos: 0 gancho (cuenta con 10.000 € fijos) → 1 el billete se encoge en 10 años → 2 a 20 años (2 % y 3 %) → 3 cierre (vuelve a la cuenta).
 * Composición: contenido en la franja de pantalla 450–1600 px de cada plano.
 */
export const INFLACION_CAMS: Cam[] = [
  { x: 540, y: 960, w: 1080, rx: 6 },
  { x: 540, y: 1250, w: 1020, rx: 6 },
  { x: 540, y: 3320, w: 1080, rx: 6 },
  { x: 540, y: 1000, w: 1150, rx: 7 },
];

const fps = ANIM_FPS;
const GOLD = "#f2b84b", RED = "#ff4d4f", GREEN = "#3ddc84", INK = "#e9ecf1", MUTED = "#8b93a1", PANEL = "#14161b";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const eur = (v: number, dec = 0) => {
  const [i, d] = Math.abs(v).toFixed(dec).split(".");
  return (v < 0 ? "−" : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (d ? "," + d : "") + " €";
};
const power = (years: number, rate: number) => 10000 / Math.pow(1 + rate, years);

const Defs: React.FC = () => (
  <defs>
    <pattern id="iGrid" width={60} height={60} patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#fff" strokeOpacity={0.045} strokeWidth={1.5} /></pattern>
    <radialGradient id="iSpot" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#262c36" stopOpacity={0.9} /><stop offset="100%" stopColor="#0b0c0f" stopOpacity={0} /></radialGradient>
    <linearGradient id="iNote" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#9be3b0" /><stop offset="45%" stopColor="#4fb47a" /><stop offset="100%" stopColor="#1f6b45" /></linearGradient>
    <linearGradient id="iNoteRed" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffb0b2" /><stop offset="45%" stopColor="#e2565a" /><stop offset="100%" stopColor="#8a1d22" /></linearGradient>
    <radialGradient id="iRedGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={RED} stopOpacity={0.5} /><stop offset="100%" stopColor={RED} stopOpacity={0} /></radialGradient>
    <radialGradient id="iGreenGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={GREEN} stopOpacity={0.4} /><stop offset="100%" stopColor={GREEN} stopOpacity={0} /></radialGradient>
    <radialGradient id="iGoldGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={GOLD} stopOpacity={0.55} /><stop offset="100%" stopColor={GOLD} stopOpacity={0} /></radialGradient>
    <linearGradient id="iBarRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff7a7c" /><stop offset="100%" stopColor="#a8262b" /></linearGradient>
    <linearGradient id="iBarGrey" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9aa4b2" /><stop offset="100%" stopColor="#4b535e" /></linearGradient>
    <linearGradient id="iBasket" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e3a35c" /><stop offset="100%" stopColor="#9c5d22" /></linearGradient>
  </defs>
);

/** App del banco: el saldo NO cambia (verde), la línea del saldo es plana. */
const Account: React.FC<{ x: number; y: number; s: number; g: number; tr: Record<string, string> }> = ({ x, y, s, g, tr }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={260} rx={300} ry={36} fill="#000" opacity={0.45} />
    <rect x={-300} y={-230} width={600} height={470} rx={36} fill={PANEL} stroke="#ffffff30" strokeWidth={3} />
    <rect x={-290} y={-222} width={580} height={70} rx={28} fill="#fff" opacity={0.05} />
    <circle cx={-240} cy={-170} r={22} fill={GOLD} />
    <text x={-240} y={-161} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={24} fill="#1a1406">€</text>
    <text x={-200} y={-160} fontFamily={display} fontWeight={800} fontSize={30} fill={MUTED}>{tr.iAccount}</text>
    <text x={0} y={-40} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={104} fill={GREEN}>10.000,00 €</text>
    <ellipse cx={0} cy={-70} rx={300} ry={90} fill="url(#iGreenGlow)" opacity={0.35 + 0.15 * Math.sin(g / 9)} />
    <text x={0} y={20} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={30} fill={MUTED}>{tr.iRate}</text>
    {/* línea plana del saldo */}
    <line x1={-250} y1={140} x2={250} y2={140} stroke="#ffffff20" strokeWidth={2} />
    <path d="M -250 120 L 250 120" stroke={GREEN} strokeWidth={6} strokeLinecap="round" />
    <circle cx={250} cy={120} r={10 + 2 * Math.sin(g / 6)} fill={GREEN} />
    {[-250, 0, 250].map((xx, i) => <text key={i} x={xx} y={190} textAnchor="middle" fontFamily={body} fontWeight={600} fontSize={24} fill={MUTED}>{[tr.iToday, tr.i5y, tr.i10y][i]}</text>)}
  </g>
);

/** Billete genérico con volumen; `v` = valor que muestra. */
const Note: React.FC<{ x: number; y: number; s: number; v: number; red: number }> = ({ x, y, s, v, red }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-250 + 12} y={-130 + 18} width={500} height={260} rx={20} fill="#000" opacity={0.4} />
    <rect x={-250} y={-130} width={500} height={260} rx={20} fill="url(#iNote)" stroke="#14512f" strokeWidth={5} />
    {red > 0 && <rect x={-250} y={-130} width={500} height={260} rx={20} fill="url(#iNoteRed)" opacity={red} />}
    <rect x={-228} y={-108} width={456} height={216} rx={12} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={3} />
    {[0.25, 0.5, 0.75].map((k) => <path key={k} d={`M -228 ${-108 + 216 * k} q 114 -24 228 0 t 228 0`} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={3} />)}
    <circle cx={-150} cy={0} r={70} fill="#fff" opacity={0.14} />
    {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={-150 + Math.cos((i / 12) * Math.PI * 2) * 46} cy={Math.sin((i / 12) * Math.PI * 2) * 46} r={7} fill="#ffe27a" opacity={0.9} />)}
    <text x={70} y={22} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={66} fill="#fff">{eur(v)}</text>
    <rect x={-236} y={-120} width={472} height={28} rx={14} fill="#fff" opacity={0.18} />
  </g>
);

export const InflacionWorld: React.FC<WorldProps> = ({ shot, t, g, data }) => {
  const tr = useT() as unknown as Record<string, string>;
  const sp = (k: number, delay: number, damping = 11) => (shot > k ? 1 : shot < k ? 0 : spring({ frame: t - delay, fps, config: { damping } }));
  const at = (i: number, def: number) => atF(data, i, def);

  // tarjeta del banco: centrada (gancho y cierre) → a la izquierda y más pequeña en el plano 1
  const toSide = prog(shot, 1, t, 14, 40);
  const back = prog(shot, 3, t, 14, 40);
  const side = shot === 3 ? 1 - back : toSide;
  const cardX = lerp(540, 300, side), cardY = lerp(980, 960, side), cardS = lerp(1, 0.68, side);

  // plano 1: 10 años al 2 %
  const years = prog(shot, 1, t, at(0, 2.5), 110, Easing.inOut(Easing.quad)) * 10;
  const v10 = power(years, 0.02);
  const noteIn = sp(1, 30);
  const lossS = sp(1, at(0, 2.5) + 115, 9);
  // plano 2: 20 años
  const b1 = prog(shot, 2, t, 10, 30), b2 = prog(shot, 2, t, at(0, 1.5), 40), b3 = prog(shot, 2, t, at(1, 4.0), 40);
  // cierre
  const closeS = sp(3, at(0, 1.2), 9);
  const shareAt = Math.max(at(1, 3.4) - 4, 116); // después de que se vaya la tarjeta de "Seguir"
  const shareUp = shot === 3 ? spring({ frame: t - shareAt, fps, config: { damping: 14 } }) : 0;

  const fHook = 0.3 + 0.7 * (shot === 0 ? 1 : focus(shot, t, [0, 1, 3]));
  const f1 = 0.3 + 0.7 * focus(shot, t, [1]);
  const f2 = 0.3 + 0.7 * focus(shot, t, [2]);

  return (
    <g>
      <Defs />
      <rect x={-3000} y={-3000} width={7080} height={10000} fill="#0b0c0f" />
      <rect x={-3000} y={-3000} width={7080} height={10000} fill="url(#iGrid)" />
      {[1000, 1500, 3350].map((y, i) => <circle key={i} cx={540} cy={y} r={850} fill="url(#iSpot)" />)}
      {Array.from({ length: 70 }, (_, i) => {
        const sx = ((i * 7919) % 1500) - 210, sy = ((i * 104729) % 4400) - 200;
        return <circle key={i} cx={sx + Math.sin(g / 50 + i) * 12} cy={sy - ((g * (0.3 + (i % 4) * 0.15)) % 300)} r={1.5 + (i % 3)} fill="#fff" opacity={0.05 + (i % 5) * 0.03} />;
      })}

      {/* ================= gancho: texto visible desde el fotograma 1 (vuelve en el cierre) ================= */}
      <g opacity={shot === 0 || shot === 3 ? 1 : shot === 1 ? 1 - toSide : 0}>
        <text x={540} y={545} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={66} stroke="#0b0c0f" strokeWidth={14} strokeLinejoin="round" paintOrder="stroke" fill={INK}>{tr.iHook1}</text>
        <text x={540} y={625} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={66} stroke="#0b0c0f" strokeWidth={14} strokeLinejoin="round" paintOrder="stroke" fill={GOLD}>{tr.iHook2}</text>
      </g>

      {/* ================= cuenta del banco (siempre 10.000 €) ================= */}
      <g opacity={fHook * (1 - 0.75 * shareUp)}>
        <Account x={cardX} y={cardY + Math.sin(g / 40) * 5} s={cardS} g={g} tr={tr} />
        <g opacity={shot === 0 ? sp(0, at(0, 2.2), 9) : 0}>
          <rect x={300} y={1300} width={480} height={70} rx={35} fill={PANEL} stroke={GOLD} strokeWidth={3} />
          <text x={540} y={1347} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={34} fill={GOLD}>{tr.iUntouched}</text>
        </g>
      </g>

      {/* ================= plano 1: el billete se encoge (10 años al 2 %) ================= */}
      <g opacity={f1 * (shot >= 1 && shot <= 2 ? 1 : 0)}>
        <text x={780} y={840} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={26} letterSpacing={2} fill={MUTED} opacity={noteIn}>{tr.iCanBuy}</text>
        {/* contorno del tamaño original */}
        <rect x={790 - 250 * 0.82} y={1020 - 130 * 0.82} width={500 * 0.82} height={260 * 0.82} rx={18} fill="none" stroke="#ffffff50" strokeWidth={3} strokeDasharray="12 10" opacity={noteIn} />
        <g opacity={noteIn}>
          <Note x={790} y={1020} s={0.82 * (v10 / 10000)} v={v10} red={1 - v10 / 10000 > 0.01 ? Math.min(1, (10000 - v10) / 1797) : 0} />
        </g>
        {/* contador de años */}
        <g opacity={noteIn}>
          <text x={150} y={1300} fontFamily={display} fontWeight={900} fontSize={40} fill={INK}>{tr.iYear} {Math.floor(years)}</text>
          <rect x={150} y={1325} width={780} height={16} rx={8} fill="#ffffff18" />
          <rect x={150} y={1325} width={780 * years / 10} height={16} rx={8} fill={RED} />
          <rect x={500} y={1258} width={430} height={56} rx={28} fill={PANEL} stroke="#ffffff40" strokeWidth={2} />
          <text x={715} y={1296} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={25} fill={INK}>{tr.iInfl2}</text>
        </g>
        {/* cesta: el mismo carro cuesta más */}
        <g opacity={sp(1, at(0, 2.5) + 40)} transform="translate(210 1520)">
          <path d="M -90 -20 L 90 -20 L 74 50 L -74 50 Z" fill="url(#iBasket)" stroke="#7a4a1e" strokeWidth={5} strokeLinejoin="round" />
          {[0, 1, 2, 3].map((i) => <line key={i} x1={-62 + i * 40} y1={-14} x2={-56 + i * 37} y2={46} stroke="#7a4a1e" strokeWidth={3} opacity={0.6} />)}
          <circle cx={-40} cy={-44} r={26} fill="#5fbf4a" stroke="#2f6b22" strokeWidth={4} />
          <rect x={-6} y={-80} width={36} height={62} rx={8} fill="#f4f7ff" stroke="#9aa6b8" strokeWidth={4} />
          <circle cx={56} cy={-40} r={22} fill="#ffcf3f" stroke="#b88a00" strokeWidth={4} />
          <text x={120} y={-10} fontFamily={display} fontWeight={900} fontSize={30} fill={INK}>{tr.iBasket}</text>
          <text x={120} y={36} fontFamily={display} fontWeight={900} fontSize={40} fill={RED}>{eur(100 * Math.pow(1.02, years), 2)}</text>
        </g>
        {/* pérdida */}
        <g transform={`translate(790 1530) scale(${lossS})`} opacity={Math.min(1, lossS * 1.5)}>
          <ellipse cx={0} cy={0} rx={220} ry={90} fill="url(#iRedGlow)" opacity={0.7 + 0.2 * Math.sin(g / 6)} />
          <rect x={-150} y={-44} width={300} height={88} rx={44} fill={RED} />
          <text x={0} y={16} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={48} fill="#fff">−1.797 €</text>
        </g>
      </g>

      {/* ================= plano 2: a 20 años ================= */}
      <g opacity={f2}>
        <text x={540} y={2870} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={40} letterSpacing={4} fill={MUTED}>{tr.i20y}</text>
        {(() => {
          const base = 3720, H = 640;
          const bars = [
            { x: 220, v: 10000, p: b1, fill: "url(#iBarGrey)", c: INK, a: tr.iToday, b: "" },
            { x: 540, v: power(20, 0.02), p: b2, fill: "url(#iBarRed)", c: RED, a: tr.iAt2, b: tr.i20short },
            { x: 860, v: power(20, 0.03), p: b3, fill: "url(#iBarRed)", c: RED, a: tr.iAt3, b: tr.i20short },
          ];
          return (
            <g>
              <line x1={80} y1={base + 2} x2={1000} y2={base + 2} stroke={MUTED} strokeWidth={3} />
              {/* referencia: los 10.000 de hoy */}
              <line x1={80} y1={base - H} x2={1000} y2={base - H} stroke="#ffffff40" strokeWidth={3} strokeDasharray="12 10" opacity={b2} />
              {bars.map((bar, i) => {
                const h = H * (bar.v / 10000) * bar.p;
                return (
                  <g key={i} opacity={Math.min(1, bar.p * 2)}>
                    {i > 0 && <ellipse cx={bar.x} cy={base - h} rx={170} ry={80} fill="url(#iRedGlow)" opacity={0.5} />}
                    <ellipse cx={bar.x + 10} cy={base + 8} rx={120} ry={14} fill="#000" opacity={0.4} />
                    <rect x={bar.x - 100} y={base - h} width={200} height={h} rx={14} fill={bar.fill} />
                    <rect x={bar.x - 86} y={base - h + 10} width={16} height={Math.max(0, h - 20)} rx={8} fill="#fff" opacity={0.25} />
                    <text x={bar.x} y={base - h - 30} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={52} fill={bar.c}>{eur(bar.v)}</text>
                    <text x={bar.x} y={base + 56} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={34} fill={INK}>{bar.a}</text>
                    {bar.b && <text x={bar.x} y={base + 98} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={28} fill={MUTED}>{bar.b}</text>}
                  </g>
                );
              })}
            </g>
          );
        })()}
      </g>

      {/* ================= cierre ================= */}
      {shot === 3 && (
        <g>
          <ellipse cx={540} cy={1440} rx={420} ry={100} fill="url(#iGoldGlow)" opacity={closeS * (0.5 + 0.3 * Math.sin(g / 7)) * (1 - shareUp)} />
          <g transform={`translate(540 1440) scale(${closeS})`} opacity={Math.min(1, closeS * 1.5) * (1 - shareUp)}>
            <rect x={-390} y={-46} width={780} height={92} rx={46} fill={GOLD} />
            <text y={16} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={42} fill="#1a1406">{tr.iDontStop}</text>
          </g>
          <ShareSheet x={540} y={1350} t={t} at={shareAt} line1={tr.iShare1} line2={tr.iShare2} scale={1.12} />
        </g>
      )}
    </g>
  );
};
