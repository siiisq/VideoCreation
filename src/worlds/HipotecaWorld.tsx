import React from "react";
import { interpolate, spring } from "remotion";
import { body, display } from "../fonts";
import { useT } from "../i18n";
import { ANIM_FPS } from "../time";
import { atF, Cam, focus, prog, WorldProps } from "./World";

/*
 * Mundo "hipoteca": casa (gancho) → cuota mensual y su reparto → por qué → 30 años de cuotas → total → amortizar pronto.
 * Ejemplo (sistema francés, el habitual en España): 200.000 € a 30 años al 3 % fijo.
 *   cuota 843,21 €/mes · 1.ª cuota: 500 € intereses + 343,21 € capital · el capital supera a los intereses en el mes 84 (año 7)
 *   total devuelto 303.555 € → 103.555 € de intereses.
 * Composición: cada zona ocupa la franja de pantalla 450–1600 px de su plano (arriba quedan libres los subtítulos).
 */
export const HIPOTECA_CAMS: Cam[] = [
  { x: 540, y: 960, w: 1080, rx: 6 },
  { x: 540, y: 2240, w: 1080, rx: 6 },
  { x: 540, y: 2290, w: 1040, rx: 6 },
  { x: 540, y: 3640, w: 1080, rx: 6 },
  { x: 540, y: 5040, w: 1080, rx: 6 },
  { x: 540, y: 6440, w: 1080, rx: 6 },
  { x: 540, y: 5060, w: 1100, rx: 7 },
];

const fps = ANIM_FPS;
const GOLD = "#f2b84b", GOLD2 = "#ffe2a3", RED = "#ff4d4f", GREEN = "#3ddc84", INK = "#e9ecf1", MUTED = "#8b93a1", PANEL = "#14161b";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const fmt = (v: number, locale: string, dec = 0) => {
  const [i, d] = Math.abs(v).toFixed(dec).split(".");
  const es = locale.startsWith("es");
  return (v < 0 ? "−" : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, es ? "." : ",") + (d ? (es ? "," : ".") + d : "");
};
const eur = (v: number, locale: string, dec = 0) => (locale.startsWith("es") ? `${fmt(v, locale, dec)} €` : `€${fmt(v, locale, dec)}`);

// ---- cuadro de amortización real (sistema francés) ----
const P = 200000, R = 0.03 / 12, N = 360;
const CUOTA = (P * R) / (1 - Math.pow(1 + R, -N));
const YEARS = (() => {
  let debt = P;
  const ys: { int: number; cap: number }[] = [];
  for (let y = 0; y < 30; y++) {
    let int = 0, cap = 0;
    for (let m = 0; m < 12; m++) { const i = debt * R; int += i; cap += CUOTA - i; debt -= CUOTA - i; }
    ys.push({ int, cap });
  }
  return ys;
})();
const TOTAL_INT = YEARS.reduce((a, y) => a + y.int, 0);

const Defs: React.FC = () => (
  <defs>
    <pattern id="hGrid" width={60} height={60} patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#fff" strokeOpacity={0.045} strokeWidth={1.5} /></pattern>
    <radialGradient id="hSpot" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#2a2f38" stopOpacity={0.9} /><stop offset="100%" stopColor="#0b0c0f" stopOpacity={0} /></radialGradient>
    <linearGradient id="hWall" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stopColor="#efe1c9" /><stop offset="100%" stopColor="#b99a74" /></linearGradient>
    <linearGradient id="hWallSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#9c7f5c" /><stop offset="100%" stopColor="#6e563b" /></linearGradient>
    <linearGradient id="hRoof" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8f3b2c" /><stop offset="100%" stopColor="#5a2018" /></linearGradient>
    <linearGradient id="hRoofSide" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6e2a1f" /><stop offset="100%" stopColor="#3e1610" /></linearGradient>
    <radialGradient id="hWindow" cx="40%" cy="35%" r="80%"><stop offset="0%" stopColor="#fff2c4" /><stop offset="60%" stopColor="#ffc95e" /><stop offset="100%" stopColor="#d98a1c" /></radialGradient>
    <radialGradient id="hWarm" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ffc95e" stopOpacity={0.45} /><stop offset="100%" stopColor="#ffc95e" stopOpacity={0} /></radialGradient>
    <radialGradient id="hRedGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={RED} stopOpacity={0.5} /><stop offset="100%" stopColor={RED} stopOpacity={0} /></radialGradient>
    <radialGradient id="hGreenGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={GREEN} stopOpacity={0.4} /><stop offset="100%" stopColor={GREEN} stopOpacity={0} /></radialGradient>
    <radialGradient id="hGoldGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={GOLD} stopOpacity={0.55} /><stop offset="100%" stopColor={GOLD} stopOpacity={0} /></radialGradient>
    <radialGradient id="hCoin" cx="35%" cy="30%" r="75%"><stop offset="0%" stopColor="#fff6d8" /><stop offset="45%" stopColor={GOLD} /><stop offset="100%" stopColor="#8a5a00" /></radialGradient>
    <radialGradient id="hCoinRed" cx="35%" cy="30%" r="75%"><stop offset="0%" stopColor="#ffd0d0" /><stop offset="45%" stopColor={RED} /><stop offset="100%" stopColor="#8a1518" /></radialGradient>
    <linearGradient id="hTank" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7d8794" /><stop offset="45%" stopColor="#c9d0d9" /><stop offset="100%" stopColor="#59616c" /></linearGradient>
    <linearGradient id="hGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fff" stopOpacity={0.16} /><stop offset="40%" stopColor="#fff" stopOpacity={0.04} /><stop offset="100%" stopColor="#fff" stopOpacity={0.12} /></linearGradient>
    <linearGradient id="hRedBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff7a7c" /><stop offset="100%" stopColor="#c62f33" /></linearGradient>
    <linearGradient id="hGreenBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7cf0ad" /><stop offset="100%" stopColor="#1f9d57" /></linearGradient>
    <linearGradient id="hBillG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5fd394" /><stop offset="100%" stopColor="#1b6b40" /></linearGradient>
    <linearGradient id="hBillR" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff8587" /><stop offset="100%" stopColor="#9c2427" /></linearGradient>
  </defs>
);

/** Panel oscuro con borde y brillo superior (cristal). */
const Panel: React.FC<{ x: number; y: number; w: number; h: number; stroke?: string; children?: React.ReactNode }> = ({ x, y, w, h, stroke = "#ffffff26", children }) => (
  <g>
    <rect x={x + 14} y={y + 20} width={w} height={h} rx={26} fill="#000" opacity={0.45} />
    <rect x={x} y={y} width={w} height={h} rx={26} fill={PANEL} stroke={stroke} strokeWidth={3} />
    <rect x={x + 10} y={y + 8} width={w - 20} height={Math.min(60, h * 0.18)} rx={18} fill="#fff" opacity={0.05} />
    {children}
  </g>
);

/** Fajo de billetes con volumen (ladrillo de dinero). */
const Bundle: React.FC<{ x: number; y: number; red?: boolean; w?: number }> = ({ x, y, red, w = 150 }) => {
  const h = 44, d = 16;
  return (
    <g>
      <path d={`M ${x} ${y} l ${d} ${-d} h ${w} l ${-d} ${d} Z`} fill={red ? "#ff9a9c" : "#8de6b4"} stroke={red ? "#7a1a1d" : "#14512f"} strokeWidth={2} />
      <path d={`M ${x + w} ${y} l ${d} ${-d} v ${h} l ${-d} ${d} Z`} fill={red ? "#7a1a1d" : "#14512f"} />
      <rect x={x} y={y} width={w} height={h} fill={red ? "url(#hBillR)" : "url(#hBillG)"} stroke={red ? "#7a1a1d" : "#14512f"} strokeWidth={2} />
      <rect x={x + w / 2 - 16} y={y} width={32} height={h} fill="#f3ead2" opacity={0.85} />
      {[0.3, 0.55, 0.8].map((k) => <line key={k} x1={x + 4} y1={y + h * k} x2={x + w - 4} y2={y + h * k} stroke="#fff" strokeOpacity={0.18} strokeWidth={1.5} />)}
    </g>
  );
};

const Coin: React.FC<{ x: number; y: number; r?: number; red?: boolean; rot?: number }> = ({ x, y, r = 26, red, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <ellipse cx={3} cy={5} rx={r} ry={r} fill={red ? "#6d1012" : "#7a5200"} />
    <circle r={r} fill={red ? "url(#hCoinRed)" : "url(#hCoin)"} stroke={red ? "#6d1012" : "#9a6a00"} strokeWidth={3} />
    <text y={r * 0.36} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={r * 1.05} fill={red ? "#6d1012" : "#9a6a00"}>€</text>
    <ellipse cx={-r * 0.38} cy={-r * 0.42} rx={r * 0.28} ry={r * 0.15} fill="#fff" opacity={0.7} />
  </g>
);

export const HipotecaWorld: React.FC<WorldProps> = ({ shot, t, g, data }) => {
  const tr = useT();
  const L = tr.locale;
  const sp = (k: number, delay: number, damping = 11) => (shot > k ? 1 : shot < k ? 0 : spring({ frame: t - delay, fps, config: { damping } }));
  const at = (i: number, def: number) => atF(data, i, def);

  // ---------- progresos ----------
  const pOwe = prog(shot, 0, t, at(0, 2.2), 45);              // 200.000 → 303.555 (rojo)
  const pCuota = prog(shot, 1, t, at(0, 3.5) - 6, 30);        // aparece la cuota
  const pSplit = prog(shot, 2, t, at(0, 2.2) - 4, 30);        // la cuota se parte: intereses / capital
  const greenLbl = sp(2, at(1, 4.5));
  const fLines = [0, 1, 2, 3].map((i) => sp(3, 20 + i * 22));  // fórmula línea a línea
  const fResult = sp(3, at(0, 3.6), 9);
  const pBars = prog(shot, 4, t, 30, 75);                      // 30 años de cuotas
  const y7 = sp(4, at(0, 4.2), 10);
  const pileP = [prog(shot, 5, t, at(0, 2.5) - 6, 40), prog(shot, 5, t, at(1, 4.2) - 6, 30)];
  const totalS = sp(5, at(1, 4.2) + 30, 10);
  const coinP = prog(shot, 6, t, at(0, 3.4) - 18, 18);
  const shrink = prog(shot, 6, t, at(0, 3.4), 45);

  const fHouse = 0.3 + 0.7 * focus(shot, t, [0]);
  const fCuota = 0.3 + 0.7 * focus(shot, t, [1, 2]);
  const fWhy = 0.3 + 0.7 * focus(shot, t, [3]);
  const fBars = 0.3 + 0.7 * focus(shot, t, [4, 6]);
  const fTotal = 0.3 + 0.7 * focus(shot, t, [5]);

  return (
    <g>
      <Defs />
      <rect x={-3000} y={-3000} width={7080} height={14000} fill="#0b0c0f" />
      <rect x={-3000} y={-3000} width={7080} height={14000} fill="url(#hGrid)" />
      {[1100, 2200, 3600, 5000, 6400].map((y, i) => <circle key={i} cx={540} cy={y} r={850} fill="url(#hSpot)" />)}
      {Array.from({ length: 80 }, (_, i) => {
        const sx = ((i * 7919) % 1500) - 210, sy = ((i * 104729) % 7400) - 200;
        return <circle key={i} cx={sx + Math.sin(g / 50 + i) * 12} cy={sy - ((g * (0.3 + (i % 4) * 0.15)) % 300)} r={1.5 + (i % 3)} fill="#fff" opacity={0.05 + (i % 5) * 0.03} />;
      })}

      {/* ================= A · CASA + MARCADOR (gancho) ================= */}
      <g opacity={fHouse}>
        {/* marcador: pides → devuelves */}
        <g transform={`translate(540 590) scale(${0.9 + 0.1 * sp(0, 4)})`}>
          <rect x={-330} y={-118} width={660} height={236} rx={30} fill={PANEL} stroke={pOwe > 0.02 ? RED : GOLD} strokeWidth={4} />
          {pOwe > 0.02 && <ellipse cx={0} cy={10} rx={420} ry={190} fill="url(#hRedGlow)" opacity={0.6 + 0.3 * Math.sin(g / 6)} />}
          <rect x={-316} y={-108} width={632} height={40} rx={16} fill="#fff" opacity={0.05} />
          <text y={-50} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={34} letterSpacing={4} fill={pOwe > 0.02 ? RED : GOLD2}>{pOwe > 0.02 ? tr.hRepay : tr.hBorrow}</text>
          <text y={70} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={100} fill={pOwe > 0.02 ? RED : INK}>{eur(200000 + (P + TOTAL_INT - 200000) * pOwe, L)}</text>
        </g>
        {/* casa con volumen */}
        <g transform={`translate(0 ${Math.sin(g / 70) * 3})`}>
          <ellipse cx={560} cy={1545} rx={380} ry={40} fill="#000" opacity={0.5} />
          <path d="M 790 1100 L 900 1040 L 900 1470 L 790 1530 Z" fill="url(#hWallSide)" stroke="#4a3826" strokeWidth={4} strokeLinejoin="round" />
          <rect x={290} y={1100} width={500} height={430} fill="url(#hWall)" stroke="#6b5235" strokeWidth={5} />
          {[1180, 1260, 1340, 1420, 1500].map((y) => <line key={y} x1={292} y1={y} x2={788} y2={y} stroke="#8a6c4a" strokeOpacity={0.18} strokeWidth={3} />)}
          <path d="M 540 800 L 900 1040 L 790 1100 Z" fill="url(#hRoofSide)" stroke="#3a140e" strokeWidth={4} strokeLinejoin="round" />
          <path d="M 250 1110 L 540 800 L 830 1110 Z" fill="url(#hRoof)" stroke="#3a140e" strokeWidth={6} strokeLinejoin="round" />
          {[0.3, 0.55, 0.8].map((k) => <line key={k} x1={540 - 290 * k} y1={800 + 310 * k} x2={540 + 290 * k} y2={800 + 310 * k} stroke="#2d0f0a" strokeOpacity={0.45} strokeWidth={4} />)}
          <path d="M 400 900 L 470 860" stroke="#fff" strokeOpacity={0.25} strokeWidth={10} strokeLinecap="round" />
          {/* chimenea y humo */}
          <rect x={660} y={860} width={56} height={120} fill="#6e2a1f" stroke="#3a140e" strokeWidth={4} />
          {[0, 1, 2, 3].map((i) => { const p = ((g + i * 22) % 88) / 88; return <circle key={i} cx={688 + Math.sin(p * 5 + i) * 18 + p * 40} cy={840 - p * 110} r={18 + p * 40} fill="#cfd5dd" opacity={(1 - p) * 0.22} />; })}
          {/* ventanas con luz cálida */}
          {[[350, 1180], [610, 1180]].map(([x, y], i) => (
            <g key={i}>
              <ellipse cx={x + 60} cy={y + 60} rx={150} ry={130} fill="url(#hWarm)" opacity={0.8 + 0.2 * Math.sin(g / 9 + i)} />
              <rect x={x} y={y} width={120} height={120} rx={8} fill="url(#hWindow)" stroke="#5a4128" strokeWidth={6} />
              <line x1={x + 60} y1={y} x2={x + 60} y2={y + 120} stroke="#5a4128" strokeWidth={5} />
              <line x1={x} y1={y + 60} x2={x + 120} y2={y + 60} stroke="#5a4128" strokeWidth={5} />
              <rect x={x + 10} y={y + 8} width={18} height={44} rx={6} fill="#fff" opacity={0.5} />
            </g>
          ))}
          {/* puerta */}
          <rect x={490} y={1330} width={100} height={200} rx={10} fill="#5a3a22" stroke="#3a2414" strokeWidth={5} />
          <rect x={502} y={1342} width={76} height={80} rx={6} fill="#6b4529" />
          <circle cx={570} cy={1440} r={8} fill="url(#hCoin)" />
          {/* arbustos */}
          {[[270, 1505, 52], [330, 1520, 38], [830, 1500, 44]].map(([x, y, r], i) => (
            <g key={i}><circle cx={x} cy={y} r={r} fill="#2f7a46" stroke="#1d4d2c" strokeWidth={4} /><ellipse cx={x - r * 0.35} cy={y - r * 0.4} rx={r * 0.3} ry={r * 0.18} fill="#fff" opacity={0.3} /></g>
          ))}
        </g>
        {/* el dinero se va: monedas rojas que salen de la casa */}
        {pOwe > 0 && Array.from({ length: 10 }, (_, i) => {
          const born = at(0, 2.2) + 10 + i * 5;
          const p = shot === 0 ? interpolate(t, [born, born + 28], [0, 1], clamp) : 0;
          if (p <= 0 || p >= 1) return null;
          return <Coin key={i} x={560 + p * 700} y={1180 - Math.sin(p * Math.PI) * 260 + p * 60} r={26} red rot={p * 540} />;
        })}
      </g>

      {/* ================= B · CUOTA MENSUAL Y SU REPARTO ================= */}
      <g opacity={fCuota}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={170 + (8 - i) * 9} y={1780 + (8 - i) * 9} width={740} height={460} rx={26} fill={PANEL} stroke="#ffffff14" strokeWidth={2} opacity={pCuota * (0.25 + i * 0.06)} />
        ))}
        <g transform={`translate(0 ${(1 - sp(1, 10)) * 60})`} opacity={Math.max(0.15, sp(1, 10))}>
          <Panel x={170} y={1780} w={740} h={460} stroke={GOLD}>
            <text x={540} y={1880} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={36} letterSpacing={4} fill={MUTED}>{tr.hMonthly}</text>
            <text x={540} y={2030} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={130} fill={INK} opacity={Math.min(1, pCuota * 2)} transform={`translate(540 1990) scale(${0.85 + 0.15 * pCuota}) translate(-540 -1990)`}>{eur(CUOTA, L, 2)}</text>
            <text x={540} y={2130} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={34} fill={GOLD2}>{tr.hTerms}</text>
            <text x={540} y={2190} textAnchor="middle" fontFamily={body} fontWeight={600} fontSize={28} fill={MUTED}>{tr.hSame}</text>
          </Panel>
          <g transform={`translate(790 1780) scale(${sp(1, at(0, 3.5) + 25, 8)})`}>
            <rect x={-140} y={-36} width={280} height={72} rx={36} fill={GOLD} />
            <text y={13} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={34} fill="#1a1406">{tr.hTimes360}</text>
          </g>
        </g>
        {/* barra de la cuota: se parte en intereses (rojo) y capital (verde) */}
        {(() => {
          const x0 = 170, W = 740, y = 2330, h = 110;
          const xr = x0 + W * (500 / CUOTA);
          const sep = pSplit * 14;
          const show = sp(2, 6);
          return (
            <g opacity={show}>
              <rect x={x0} y={y} width={W} height={h} rx={18} fill="url(#hCoin)" opacity={1 - pSplit} />
              {pSplit > 0 && <>
                <rect x={x0 - sep} y={y} width={xr - x0} height={h} rx={18} fill="url(#hRedBar)" opacity={pSplit} />
                <ellipse cx={(x0 + xr) / 2} cy={y + h / 2} rx={300} ry={140} fill="url(#hRedGlow)" opacity={pSplit * (0.6 + 0.3 * Math.sin(g / 7))} />
                <rect x={xr + sep} y={y} width={x0 + W - xr} height={h} rx={18} fill="url(#hGreenBar)" opacity={pSplit * Math.max(0.35, greenLbl)} />
                <text x={(x0 + xr) / 2 - sep} y={y + 74} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={54} fill="#fff" opacity={pSplit}>{eur(500, L)}</text>
                <text x={(xr + x0 + W) / 2 + sep} y={y + 74} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={50} fill="#0b2a18" opacity={greenLbl}>{eur(343, L)}</text>
              </>}
              <rect x={x0 + 10} y={y + 8} width={W - 20} height={18} rx={9} fill="#fff" opacity={0.25} />
              {/* leyendas separadas de la barra */}
              <g opacity={pSplit}>
                <text x={x0} y={y + h + 70} fontFamily={display} fontWeight={900} fontSize={44} fill={RED}>{tr.hInterest}</text>
                <text x={x0} y={y + h + 116} fontFamily={body} fontWeight={700} fontSize={32} fill={MUTED}>{tr.hForBank}</text>
              </g>
              <g opacity={greenLbl}>
                <text x={x0 + W} y={y + h + 70} textAnchor="end" fontFamily={display} fontWeight={900} fontSize={44} fill={GREEN}>{tr.hCapital}</text>
                <text x={x0 + W} y={y + h + 116} textAnchor="end" fontFamily={body} fontWeight={700} fontSize={32} fill={MUTED}>{tr.hLowersDebt}</text>
              </g>
            </g>
          );
        })()}
      </g>

      {/* ================= C · POR QUÉ: INTERESES SOBRE LO QUE DEBES ================= */}
      <g opacity={fWhy}>
        <text x={320} y={3190} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={36} letterSpacing={3} fill={MUTED}>{tr.hYouOwe}</text>
        {/* depósito de deuda: cristal con volumen */}
        <ellipse cx={330} cy={3985} rx={190} ry={30} fill="#000" opacity={0.5} />
        <rect x={170} y={3230} width={300} height={740} rx={40} fill="#1b1e24" stroke="#5b6472" strokeWidth={5} />
        {(() => { const lvl = 3250 + 40 * (1 - sp(3, 8)); return (
          <g>
            <rect x={186} y={lvl} width={268} height={3954 - lvl} rx={30} fill="url(#hTank)" opacity={0.9} />
            <path d={`M 186 ${lvl + 6} q 67 ${-10 + Math.sin(g / 6) * 6} 134 0 t 134 0`} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={4} />
          </g>); })()}
        <rect x={170} y={3230} width={300} height={740} rx={40} fill="url(#hGlass)" />
        <rect x={192} y={3260} width={22} height={680} rx={11} fill="#fff" opacity={0.25} />
        <text x={320} y={3640} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={46} fill="#151a21">{eur(200000, L)}</text>
        {/* fórmula */}
        <Panel x={530} y={3260} w={400} h={680} stroke="#ffffff30">
          {[eur(200000, L), tr.hTimesRate, tr.hPerMonth].map((s, i) => (
            <text key={i} x={890} y={3380 + i * 120} textAnchor="end" fontFamily={display} fontWeight={900} fontSize={i === 0 ? 58 : 46} fill={INK} opacity={fLines[i]}
              transform={`translate(${(1 - fLines[i]) * 40} 0)`}>{s}</text>
          ))}
          <line x1={570} y1={3680} x2={890} y2={3680} stroke={INK} strokeWidth={4} opacity={fLines[3]} />
          <g transform={`translate(730 3800) scale(${0.6 + 0.4 * fResult})`} opacity={fResult}>
            <ellipse cx={0} cy={-20} rx={240} ry={120} fill="url(#hRedGlow)" />
            <text x={160} y={0} textAnchor="end" fontFamily={display} fontWeight={900} fontSize={80} fill={RED}>= {eur(500, L)}</text>
            <text x={160} y={56} textAnchor="end" fontFamily={body} fontWeight={700} fontSize={30} fill={RED}>{tr.hInterestMonth}</text>
          </g>
        </Panel>
      </g>

      {/* ================= D · 30 AÑOS DE CUOTAS ================= */}
      <g opacity={fBars}>
        {(() => {
          const x0 = 140, W = 800, base = 5380, H = 640, bw = W / 30;
          const yr7x = x0 + bw * 6.5;
          return (
            <g>
              {/* leyenda */}
              <g opacity={sp(4, 10)}>
                <rect x={x0} y={4560} width={30} height={30} rx={6} fill={RED} />
                <text x={x0 + 44} y={4586} fontFamily={body} fontWeight={700} fontSize={32} fill={INK}>{tr.hInterest}</text>
                <rect x={x0 + 300} y={4560} width={30} height={30} rx={6} fill={GREEN} />
                <text x={x0 + 344} y={4586} fontFamily={body} fontWeight={700} fontSize={32} fill={INK}>{tr.hCapital}</text>
              </g>
              <line x1={x0} y1={base + 2} x2={x0 + W} y2={base + 2} stroke={MUTED} strokeWidth={3} />
              {YEARS.map((y, i) => {
                const appear = interpolate(pBars, [i / 34, i / 34 + 0.12], [0, 1], clamp);
                const intK = i >= 2 ? 1 - 0.28 * shrink * Math.min(1, (i - 1) / 6) : 1;
                const hi = (H * y.int) / CUOTA / 12 * intK, hc = (H * y.cap) / CUOTA / 12;
                const x = x0 + i * bw + 3;
                return (
                  <g key={i} opacity={appear}>
                    <rect x={x} y={base - hc * appear} width={bw - 6} height={hc * appear} rx={4} fill="url(#hGreenBar)" />
                    <rect x={x} y={base - (hc + hi) * appear} width={bw - 6} height={hi * appear} rx={4} fill="url(#hRedBar)" />
                    <rect x={x + 2} y={base - (hc + hi) * appear + 3} width={4} height={(hc + hi) * appear - 6} rx={2} fill="#fff" opacity={0.25} />
                  </g>
                );
              })}
              {[[1, tr.hYear1], [15, tr.hYear15], [30, tr.hYear30]].map(([n, s]) => (
                <text key={n as number} x={x0 + bw * ((n as number) - 0.5)} y={base + 50} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={28} fill={MUTED}>{s as string}</text>
              ))}
              {/* año 7: el capital pasa a ser mayor que los intereses */}
              <g opacity={y7}>
                <line x1={yr7x + bw / 2} y1={4716} x2={yr7x + bw / 2} y2={base} stroke={GOLD} strokeWidth={4} strokeDasharray="12 10" strokeDashoffset={-g % 22} />
                <circle cx={yr7x + bw / 2} cy={base - H / 2} r={16 + 4 * Math.sin(g / 6)} fill={GOLD} />
                <circle cx={yr7x + bw / 2} cy={base - H / 2} r={60} fill="url(#hGoldGlow)" />
                <rect x={yr7x + bw / 2 + 24} y={4612} width={520} height={104} rx={22} fill={PANEL} stroke={GOLD} strokeWidth={3} />
                <text x={yr7x + bw / 2 + 50} y={4656} fontFamily={display} fontWeight={900} fontSize={38} fill={GOLD2}>{tr.hYear7}</text>
                <text x={yr7x + bw / 2 + 50} y={4698} fontFamily={body} fontWeight={700} fontSize={28} fill={INK}>{tr.hYear7b}</text>
              </g>
              {/* amortizar pronto (plano 6): moneda que cae al principio y los intereses siguientes encogen */}
              {shot >= 6 && (
                <g>
                  <Coin x={x0 + bw * 1.5} y={interpolate(coinP, [0, 1], [4420, base - H - 30])} r={34} rot={coinP * 360} />
                  <ellipse cx={x0 + bw * 1.5} cy={base - H - 10} rx={90} ry={40} fill="url(#hGoldGlow)" opacity={coinP} />
                  <g opacity={interpolate(shrink, [0.3, 0.8], [0, 1], clamp)}>
                    <rect x={x0 + 200} y={4612} width={600} height={104} rx={22} fill={PANEL} stroke={GREEN} strokeWidth={3} />
                    <text x={x0 + 230} y={4656} fontFamily={display} fontWeight={900} fontSize={36} fill={GREEN}>{tr.hEarly}</text>
                    <text x={x0 + 230} y={4698} fontFamily={body} fontWeight={700} fontSize={26} fill={MUTED}>{tr.hEarlyB}</text>
                  </g>
                </g>
              )}
            </g>
          );
        })()}
      </g>

      {/* ================= E · TOTAL ================= */}
      <g opacity={fTotal}>
        <text x={540} y={5990} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={36} letterSpacing={3} fill={MUTED}>{tr.hTotalTitle}</text>
        <text x={540} y={6110} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={110} fill={INK} opacity={totalS} transform={`translate(0 ${(1 - totalS) * 30})`}>{eur(P + TOTAL_INT, L)}</text>
        {(() => {
          const base = 6900, piles = [
            { x: 160, n: 20, red: false, label: tr.hHouse, v: P, p: pileP[0] },
            { x: 600, n: Math.round(TOTAL_INT / 10000), red: true, label: tr.hInterest, v: TOTAL_INT, p: pileP[1] },
          ];
          return piles.map((pl, k) => (
            <g key={k}>
              <ellipse cx={pl.x + 170} cy={base + 30} rx={220} ry={26} fill="#000" opacity={0.5} />
              {pl.red && <ellipse cx={pl.x + 170} cy={base - 140} rx={260} ry={200} fill="url(#hRedGlow)" opacity={pl.p * (0.5 + 0.3 * Math.sin(g / 7))} />}
              {Array.from({ length: pl.n }, (_, i) => {
                const col = i % 2, row = Math.floor(i / 2);
                const q = interpolate(pl.p, [i / pl.n, i / pl.n + 0.15], [0, 1], clamp);
                if (q <= 0) return null;
                return <g key={i} opacity={q} transform={`translate(0 ${(1 - q) * -200})`}><Bundle x={pl.x + col * 170} y={base - 46 - row * 46} red={pl.red} /></g>;
              })}
              <text x={pl.x + 170} y={base + 90} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={46} fill={pl.red ? RED : GREEN} opacity={pl.p > 0 ? 1 : 0}>{eur(pl.v * pl.p, L)}</text>
              <text x={pl.x + 170} y={base + 136} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={32} fill={MUTED} opacity={pl.p > 0 ? 1 : 0}>{pl.label}</text>
            </g>
          ));
        })()}
      </g>
    </g>
  );
};
