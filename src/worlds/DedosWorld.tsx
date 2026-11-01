import React, { useEffect, useState } from "react";
import { continueRender, delayRender, Easing, interpolate, spring, staticFile } from "remotion";
import { body, display } from "../fonts";
import { useT } from "../i18n";
import { ANIM_FPS } from "../time";
import { atF, Cam, focus, prog, WorldProps } from "./World";

/*
 * Mundo "dedos": por qué se arrugan los dedos en el agua.
 * gancho (dedo en el agua) → mito (esponja) → 1935 (nervio dañado = no se arruga) → corte de la yema (vasoconstricción)
 * → teoría del neumático (2011) → experimento de las canicas (2013, con matiz) → cierre (vuelta al dedo del gancho).
 * Composición: el contenido de cada plano va en la franja de pantalla 450–1600 px (cam.y − 510 … cam.y + 640).
 */
export const DEDOS_CAMS: Cam[] = [
  { x: 540, y: 960, w: 1080, rx: 6 },
  { x: 540, y: 2400, w: 1080, rx: 6 },
  { x: 540, y: 3880, w: 1080, rx: 6 },
  { x: 540, y: 5280, w: 1080, rx: 5 },
  { x: 540, y: 6720, w: 1080, rx: 6 },
  { x: 540, y: 8160, w: 1080, rx: 6 },
  { x: 540, y: 1010, w: 1180, rx: 7 },
];

const fps = ANIM_FPS;
const GOLD = "#f2b84b", GOLD2 = "#ffe2a3", RED = "#ff4d4f", GREEN = "#3ddc84", BLUE = "#4fc3ff", INK = "#e9ecf1", MUTED = "#8b93a1", PANEL = "#14161b";
const SKIN_LINE = "#8f5236";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Defs: React.FC = () => (
  <defs>
    <pattern id="dGrid" width={60} height={60} patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#fff" strokeOpacity={0.045} strokeWidth={1.5} /></pattern>
    <radialGradient id="dSpot" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#262c36" stopOpacity={0.9} /><stop offset="100%" stopColor="#0b0c0f" stopOpacity={0} /></radialGradient>
    <linearGradient id="dSkin" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#f6d2b6" /><stop offset="45%" stopColor="#eab090" /><stop offset="100%" stopColor="#bf7c5c" /></linearGradient>
    <linearGradient id="dSponge" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ffe98a" /><stop offset="50%" stopColor="#f5c842" /><stop offset="100%" stopColor="#c8961a" /></linearGradient>
    <linearGradient id="dFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity={0} /><stop offset="22%" stopColor="#fff" stopOpacity={1} /><stop offset="100%" stopColor="#fff" stopOpacity={1} /></linearGradient>
    <linearGradient id="dWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5fd0ff" stopOpacity={0.42} /><stop offset="100%" stopColor="#1f6fb0" stopOpacity={0.6} /></linearGradient>
    <linearGradient id="dGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fff" stopOpacity={0.16} /><stop offset="40%" stopColor="#fff" stopOpacity={0.03} /><stop offset="100%" stopColor="#fff" stopOpacity={0.12} /></linearGradient>
    <linearGradient id="dEpi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f3c9ab" /><stop offset="100%" stopColor="#d9997a" /></linearGradient>
    <linearGradient id="dDerm" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c7766a" /><stop offset="100%" stopColor="#7d3a3a" /></linearGradient>
    <linearGradient id="dVessel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff8a8a" /><stop offset="50%" stopColor="#d63a3f" /><stop offset="100%" stopColor="#8e1b22" /></linearGradient>
    <radialGradient id="dTyre" cx="40%" cy="35%" r="75%"><stop offset="0%" stopColor="#4a4f57" /><stop offset="100%" stopColor="#15171b" /></radialGradient>
    <radialGradient id="dPad" cx="38%" cy="32%" r="75%"><stop offset="0%" stopColor="#f8d8c0" /><stop offset="60%" stopColor="#e6a786" /><stop offset="100%" stopColor="#b8735a" /></radialGradient>
    <radialGradient id="dMarble" cx="35%" cy="30%" r="75%"><stop offset="0%" stopColor="#e6f8ff" /><stop offset="45%" stopColor="#58b8f0" /><stop offset="100%" stopColor="#1a4f8a" /></radialGradient>
    <radialGradient id="dGoldGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={GOLD} stopOpacity={0.55} /><stop offset="100%" stopColor={GOLD} stopOpacity={0} /></radialGradient>
    <radialGradient id="dRedGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={RED} stopOpacity={0.5} /><stop offset="100%" stopColor={RED} stopOpacity={0} /></radialGradient>
    <radialGradient id="dBlueGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={BLUE} stopOpacity={0.45} /><stop offset="100%" stopColor={BLUE} stopOpacity={0} /></radialGradient>
    <linearGradient id="dBowl" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#9aa4b2" /><stop offset="45%" stopColor="#e3e8ee" /><stop offset="100%" stopColor="#5d6672" /></linearGradient>
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

/** Etiqueta en pastilla. */
const Chip: React.FC<{ x: number; y: number; text: string; color: string; s?: number; dark?: boolean; size?: number; w?: number }> = ({ x, y, text, color, s = 1, dark, size = 34, w }) => {
  const W = w ?? text.length * size * 0.62 + 60;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, s * 1.5)}>
      <rect x={-W / 2 + 8} y={-size * 0.95 + 10} width={W} height={size * 1.9} rx={size * 0.95} fill="#000" opacity={0.4} />
      <rect x={-W / 2} y={-size * 0.95} width={W} height={size * 1.9} rx={size * 0.95} fill={dark ? PANEL : color} stroke={color} strokeWidth={3} />
      <rect x={-W / 2 + 14} y={-size * 0.8} width={W - 28} height={size * 0.45} rx={size * 0.22} fill="#fff" opacity={0.18} />
      <text y={size * 0.36} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={size} fill={dark ? color : "#14110a"}>{text}</text>
    </g>
  );
};

/* Ilustraciones realistas pre-renderizadas (public/dedos/, dibujadas en SVG y exportadas a PNG con alfa).
 * Coordenadas internas de la mano: 600x900, punta del dedo corazón en (268, 775). */
const IMG = {
  handDry: staticFile("dedos/mano-seca.png"), handWet: staticFile("dedos/mano-arrugada.png"),
  padDry: staticFile("dedos/yema-seca.png"), padWet: staticFile("dedos/yema-arrugada.png"),
};
const useDedosImages = () => {
  const [handle] = useState(() => delayRender("Imágenes de dedos"));
  useEffect(() => {
    Promise.all(Object.values(IMG).map((u) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = () => r(null); i.src = u; })))
      .then(() => continueRender(handle));
  }, [handle]);
};

/** Mano realista colgando hacia abajo (palma). `wr` 0–1 = se arruga (fundido seca → arrugada). */
const Hand: React.FC<{ id: string; x: number; tip: number; s: number; wr: number; g: number; nerve?: number; cut?: boolean; sx?: number }> = ({ id, x, tip, s, wr, g, nerve = 0, cut, sx = 1 }) => (
  <g transform={`translate(${x} ${tip}) scale(${s * sx} ${s}) translate(-268 -775)`}>
    <mask id={`hm${id}`}><rect x={0} y={0} width={600} height={900} fill="url(#dFade)" /></mask>
    <g mask={`url(#hm${id})`}>
      <image href={IMG.handDry} x={0} y={0} width={600} height={900} />
      {wr > 0.001 && <image href={IMG.handWet} x={0} y={0} width={600} height={900} opacity={wr} />}
      {nerve > 0 && (
        <g opacity={nerve}>
          <path d="M 262 120 C 262 300 266 420 266 560 L 268 735" fill="none" stroke="#5a4210" strokeWidth={10} strokeLinecap="round" opacity={0.8} />
          <path d="M 262 120 C 262 300 266 420 266 560 L 268 735" fill="none" stroke={GOLD} strokeWidth={5} strokeLinecap="round" />
          {Array.from({ length: 3 }, (_, i) => {
            const p = ((g * 7 + i * 120) % 360) / 360;
            const yy = 140 + p * 590;
            if (cut && yy > 560) return null;
            return <g key={i}><circle cx={265} cy={yy} r={22} fill="url(#dGoldGlow)" /><circle cx={265} cy={yy} r={7} fill={GOLD2} /></g>;
          })}
          {cut && <path d="M 248 548 l 36 30 M 284 548 l -36 30" stroke={RED} strokeWidth={8} strokeLinecap="round" />}
        </g>
      )}
    </g>
  </g>
);

/** Gota de agua con volumen. */
const Drop: React.FC<{ x: number; y: number; s?: number; rot?: number; o?: number }> = ({ x, y, s = 1, rot = 0, o = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <path d="M 0 -26 C 14 -6 20 4 20 12 A 20 20 0 0 1 -20 12 C -20 4 -14 -6 0 -26 Z" fill="url(#dMarble)" stroke="#1d5c94" strokeWidth={3} />
    <ellipse cx={-7} cy={8} rx={5} ry={8} fill="#fff" opacity={0.8} />
  </g>
);

/** Cubeta de cristal con agua (el dedo se dibuja entre `back` y `front`). */
const Tank: React.FC<{ x0: number; x1: number; top: number; water: number; bottom: number; g: number; part: "back" | "front" }> = ({ x0, x1, top, water, bottom, g, part }) => {
  if (part === "back") return (
    <g>
      <ellipse cx={(x0 + x1) / 2} cy={bottom + 24} rx={(x1 - x0) / 2 + 40} ry={30} fill="#000" opacity={0.5} />
      <rect x={x0} y={top} width={x1 - x0} height={bottom - top} rx={30} fill="#11161d" stroke="#5b6472" strokeWidth={5} />
    </g>
  );
  const wave = Array.from({ length: 25 }, (_, j) => { const xx = x0 + 6 + (j * (x1 - x0 - 12)) / 24; return `L ${xx} ${water + Math.sin(xx / 40 + g / 8) * 6}`; }).join(" ");
  return (
    <g>
      <path d={`M ${x0 + 6} ${water} ${wave} L ${x1 - 6} ${bottom - 6} L ${x0 + 6} ${bottom - 6} Z`} fill="url(#dWater)" />
      <path d={`M ${x0 + 6} ${water} ${wave}`} fill="none" stroke="#bfeaff" strokeOpacity={0.8} strokeWidth={4} />
      {Array.from({ length: 7 }, (_, i) => {
        const p = ((g * 1.4 + i * 37) % 120) / 120;
        return <circle key={i} cx={x0 + 50 + ((i * 131) % (x1 - x0 - 100)) + Math.sin(p * 9 + i) * 8} cy={bottom - 30 - p * (bottom - water - 50)} r={4 + (i % 3) * 3} fill="#dff6ff" opacity={0.5 * (1 - p)} />;
      })}
      <rect x={x0} y={top} width={x1 - x0} height={bottom - top} rx={30} fill="url(#dGlass)" stroke="#9fb0c3" strokeOpacity={0.6} strokeWidth={4} />
      <rect x={x0 + 18} y={top + 26} width={18} height={bottom - top - 60} rx={9} fill="#fff" opacity={0.18} />
    </g>
  );
};

export const DedosWorld: React.FC<WorldProps> = ({ shot, t, g, data }) => {
  const tr = useT();
  useDedosImages();
  const sp = (k: number, delay: number, damping = 11) => (shot > k ? 1 : shot < k ? 0 : spring({ frame: t - delay, fps, config: { damping } }));
  const at = (i: number, def: number) => atF(data, i, def);

  // ---------- A · gancho ----------
  const absorb = sp(0, 8);
  const strike = prog(shot, 0, t, at(0, 1.8), 14);
  const nerveA = prog(shot, 0, t, at(1, 3.2) - 6, 24);
  const wrA = prog(shot, 0, t, at(1, 3.2), 50, Easing.out(Easing.cubic));
  const closeS = sp(6, 30, 9);
  const fA = shot === 0 ? 1 : 0.3 + 0.7 * focus(shot, t, [0, 6]); // el gancho se ve entero desde el fotograma 1

  // ---------- B · mito ----------
  const soak = prog(shot, 1, t, 10, 70);
  const myth = sp(1, at(0, 4.2), 8);
  const fB = 0.3 + 0.7 * focus(shot, t, [1]);

  // ---------- C · 1935 ----------
  const year = sp(2, 4);
  const wrC = prog(shot, 2, t, at(0, 3.0), 60, Easing.out(Easing.cubic));
  const lblC = sp(2, at(0, 3.0) + 20);
  const testC = sp(2, at(1, 6.0), 10);
  const fC = 0.3 + 0.7 * focus(shot, t, [2]);

  // ---------- D · corte de la yema ----------
  const secIn = sp(3, 6);
  const signal = prog(shot, 3, t, at(0, 1.6), 30);
  const narrow = prog(shot, 3, t, at(1, 3.2), 45);
  const fold = prog(shot, 3, t, at(2, 5.2) - 4, 40, Easing.out(Easing.cubic));
  const fD = 0.3 + 0.7 * focus(shot, t, [3]);

  // ---------- E · neumático ----------
  const padIn = sp(4, 6);
  const tyreIn = sp(4, at(0, 3.0), 10);
  const flow = prog(shot, 4, t, at(1, 4.6) - 10, 20);
  const gripS = sp(4, at(1, 4.6) + 10, 9);
  const fE = 0.3 + 0.7 * focus(shot, t, [4]);

  // ---------- F · experimento ----------
  const expIn = sp(5, 4);
  const moveStart = 30, per = 26;
  const fasterS = sp(5, at(0, 3.6), 9);
  const unsureS = sp(5, at(1, 6.4), 10);
  const fF = 0.3 + 0.7 * focus(shot, t, [5]);

  return (
    <g>
      <Defs />
      <rect x={-3000} y={-3000} width={7080} height={16000} fill="#0b0c0f" />
      <rect x={-3000} y={-3000} width={7080} height={16000} fill="url(#dGrid)" />
      {[1050, 2500, 3950, 5350, 6800, 8250].map((y, i) => <circle key={i} cx={540} cy={y} r={850} fill="url(#dSpot)" />)}
      {Array.from({ length: 90 }, (_, i) => {
        const sx = ((i * 7919) % 1500) - 210, sy = ((i * 104729) % 8800) - 200;
        return <circle key={i} cx={sx + Math.sin(g / 50 + i) * 12} cy={sy - ((g * (0.3 + (i % 4) * 0.15)) % 300)} r={1.5 + (i % 3)} fill="#fff" opacity={0.05 + (i % 5) * 0.03} />;
      })}

      {/* ================= A · GANCHO: dedo en el agua ================= */}
      <g opacity={fA}>
        <Tank x0={230} x1={850} top={1190} water={1270} bottom={1560} g={g} part="back" />
        <g transform={`translate(0 ${Math.sin(g / 30) * 6})`}>
          <Hand id="a" x={540} tip={1400} s={1.15} wr={Math.max(wrA, shot >= 6 ? 1 : 0)} g={g} nerve={nerveA * (shot >= 6 ? 0.4 : 1)} />
        </g>
        <Tank x0={230} x1={850} top={1190} water={1270} bottom={1560} g={g} part="front" />
        {/* etiqueta "¿absorbe agua?" tachada */}
        <g opacity={shot >= 6 ? 0 : 1}>
          <line x1={330} y1={800} x2={440} y2={880} stroke={MUTED} strokeWidth={3} strokeDasharray="8 8" opacity={absorb} />
          <Chip x={250} y={760} text={tr.dAbsorb} color={BLUE} dark s={absorb} size={32} />
          <line x1={110} y1={760} x2={110 + 280 * strike} y2={760} stroke={RED} strokeWidth={9} strokeLinecap="round" />
          <line x1={640} y1={900} x2={760} y2={800} stroke={GOLD} strokeWidth={3} strokeDasharray="8 8" opacity={nerveA} />
          <Chip x={800} y={760} text={tr.dNerves} color={GOLD} s={sp(0, at(1, 3.2) + 8, 9)} size={30} />
        </g>
        {/* gancho escrito, visible desde el primer fotograma (mucha gente ve sin sonido); vuelve en el cierre (bucle) */}
        <g opacity={shot === 0 || shot >= 6 ? 1 : 0.4}>
          <text x={540} y={540} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={66} stroke="#0b0c0f" strokeWidth={14} strokeLinejoin="round" paintOrder="stroke" fill={INK}>{tr.dHook1}</text>
          <text x={540} y={620} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={66} stroke="#0b0c0f" strokeWidth={14} strokeLinejoin="round" paintOrder="stroke" fill={GOLD}>{tr.dHook2}</text>
        </g>
        {/* cierre: neumáticos de serie */}
        {shot >= 6 && (
          <g>
            <ellipse cx={540} cy={1640} rx={420} ry={110} fill="url(#dGoldGlow)" opacity={closeS * (0.6 + 0.3 * Math.sin(g / 7))} />
            <Chip x={540} y={1650} text={tr.dStock} color={GOLD} s={closeS} size={52} />
          </g>
        )}
      </g>

      {/* ================= B · MITO: la piel no es una esponja ================= */}
      <g opacity={fB}>
        <text x={540} y={1960} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={38} letterSpacing={4} fill={MUTED} opacity={shot === 0 || shot >= 6 ? 0 : 1}>{tr.dSponge}</text>
        <Hand id="b" x={540} tip={2860} s={1.05} wr={0} g={g} sx={1 + 0.08 * soak} />
        {Array.from({ length: 10 }, (_, i) => {
          const born = 10 + i * 7;
          const p = shot === 1 ? interpolate(t, [born, born + 22], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
          if (p <= 0 || p >= 1) return null;
          const left = i % 2 === 0;
          const sx = left ? 120 : 960, ex = left ? 430 : 650;
          const y0 = 2350 + (i * 61) % 380;
          return <Drop key={i} x={sx + (ex - sx) * p} y={y0 + Math.sin(p * Math.PI) * -60} rot={left ? -90 : 90} o={1 - Math.max(0, p - 0.8) * 5} />;
        })}
        {/* sello MITO */}
        <g transform={`translate(540 2560) rotate(-12) scale(${myth})`} opacity={Math.min(1, myth * 1.4)}>
          <ellipse cx={0} cy={0} rx={330} ry={160} fill="url(#dRedGlow)" />
          <rect x={-250} y={-90} width={500} height={180} rx={24} fill="#1a0c0d" fillOpacity={0.7} stroke={RED} strokeWidth={12} />
          <rect x={-232} y={-72} width={464} height={144} rx={16} fill="none" stroke={RED} strokeWidth={4} />
          <text y={44} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={128} letterSpacing={10} fill={RED}>{tr.dMyth}</text>
        </g>
      </g>

      {/* ================= C · 1935: nervio dañado = no se arruga ================= */}
      <g opacity={fC}>
        <g transform={`translate(540 3440) scale(${year})`}>
          <ellipse cx={0} cy={-30} rx={260} ry={110} fill="url(#dGoldGlow)" />
          <text y={20} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={140} fill={GOLD}>1935</text>
        </g>
        <Tank x0={90} x1={990} top={4110} water={4190} bottom={4410} g={g} part="back" />
        <Hand id="c1" x={300} tip={4330} s={0.72} wr={wrC} g={g} nerve={sp(2, 10)} />
        <Hand id="c2" x={760} tip={4330} s={0.72} wr={0} g={g} nerve={sp(2, 18)} cut />
        <Tank x0={90} x1={990} top={4110} water={4190} bottom={4410} g={g} part="front" />
        {[{ x: 300, a: tr.dNerveOk, b: tr.dWrinkled, c: GREEN }, { x: 760, a: tr.dNerveCut, b: tr.dSmooth, c: RED }].map((l, i) => (
          <g key={i} opacity={lblC} transform={`translate(0 ${(1 - lblC) * 20})`}>
            <text x={l.x} y={4470} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={40} fill={l.c}>{l.a}</text>
            <text x={l.x} y={4518} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={32} fill={INK}>→ {l.b}</text>
          </g>
        ))}
        <Chip x={540} y={3600} text={tr.dTest} color={GOLD} dark s={testC} size={30} />
      </g>

      {/* ================= D · CORTE DE LA YEMA: vasoconstricción ================= */}
      <g opacity={fD}>
        <g opacity={secIn} transform={`translate(0 ${(1 - secIn) * 40})`}>
          <Panel x={70} y={4790} w={940} h={1110} stroke="#ffffff30">
            <text x={540} y={4865} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={34} letterSpacing={4} fill={MUTED}>{tr.dSection}</text>
            {(() => {
              const X0 = 100, X1 = 980, base = 5000 + fold * 26;
              const surf = (x: number, amp: number) => base + Math.sin(((x - X0) / (X1 - X0)) * Math.PI * 9) * amp * fold;
              const line = (dy: number, amp: number) => Array.from({ length: 90 }, (_, j) => { const x = X0 + (j * (X1 - X0)) / 89; return `${j ? "L" : "M"} ${x} ${surf(x, amp) + dy}`; }).join(" ");
              const vessels = [5330, 5500, 5680];
              const rv = 46 - 24 * narrow;
              return (
                <g>
                  <clipPath id="dSecClip"><rect x={X0} y={4890} width={X1 - X0} height={990} rx={18} /></clipPath>
                  <g clipPath="url(#dSecClip)">
                    {/* dermis y epidermis */}
                    <path d={`${line(70, 20)} L ${X1} 5880 L ${X0} 5880 Z`} fill="url(#dDerm)" />
                    <path d={`${line(0, 46)} ${Array.from({ length: 90 }, (_, j) => { const x = X1 - (j * (X1 - X0)) / 89; return `L ${x} ${surf(x, 20) + 70}`; }).join(" ")} Z`} fill="url(#dEpi)" stroke={SKIN_LINE} strokeWidth={5} strokeLinejoin="round" />
                    <path d={line(-4, 46)} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={4} transform="translate(0 10)" />
                    {/* fibras */}
                    {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M ${X0 + i * 92} 5130 q 40 ${30 + (i % 3) * 10} 80 0`} fill="none" stroke="#f0b0a0" strokeOpacity={0.25} strokeWidth={3} />)}
                    {/* vasos sanguíneos */}
                    {vessels.map((vy, i) => {
                      const ry = rv * (i === 1 ? 1.1 : 1);
                      return (
                        <g key={i}>
                          <rect x={X0 - 20} y={vy - ry - 6} width={X1 - X0 + 40} height={(ry + 6) * 2} rx={ry + 6} fill="#5c1a1f" opacity={0.6} />
                          <rect x={X0 - 20} y={vy - ry} width={X1 - X0 + 40} height={ry * 2} rx={ry} fill="url(#dVessel)" />
                          <rect x={X0} y={vy - ry * 0.7} width={X1 - X0} height={Math.max(3, ry * 0.25)} rx={4} fill="#fff" opacity={0.3} />
                          {Array.from({ length: 9 }, (_, j) => {
                            const xx = X0 + ((g * (5 - narrow * 2.5) + j * 110 + i * 40) % (X1 - X0));
                            return <ellipse key={j} cx={xx} cy={vy + Math.sin(j + g / 9) * ry * 0.3} rx={Math.max(6, ry * 0.42)} ry={Math.max(5, ry * 0.3)} fill="#ff6f73" stroke="#8e1b22" strokeWidth={2} />;
                          })}
                          {/* flechas: se estrechan */}
                          {i === 1 && narrow > 0.05 && [-1, 1].map((sgn) => (
                            <path key={sgn} d={`M 720 ${vy + sgn * (ry + 62)} l 0 ${-sgn * 34} m -16 ${sgn * 16} l 16 ${-sgn * 16} l 16 ${sgn * 16}`} stroke={GOLD2} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={narrow} />
                          ))}
                        </g>
                      );
                    })}
                    {/* nervio con impulsos */}
                    <path d="M 100 5190 C 300 5190 360 5240 470 5290 S 640 5420 700 5450" fill="none" stroke="#5a4210" strokeWidth={14} strokeLinecap="round" />
                    <path d="M 100 5190 C 300 5190 360 5240 470 5290 S 640 5420 700 5450" fill="none" stroke={GOLD} strokeWidth={8} strokeLinecap="round" />
                    {signal > 0 && Array.from({ length: 3 }, (_, i) => {
                      const p = ((g * 2.2 + i * 33) % 100) / 100;
                      const px = 100 + p * 600, py = 5190 + (p < 0.6 ? p * 160 : 96 + (p - 0.6) * 410);
                      return <g key={i} opacity={signal}><circle cx={px} cy={py} r={34} fill="url(#dGoldGlow)" /><circle cx={px} cy={py} r={11} fill={GOLD2} /></g>;
                    })}
                  </g>
                  {/* etiquetas */}
                  <text x={130} y={5160} fontFamily={display} fontWeight={900} fontSize={38} fill={GOLD} opacity={sp(3, at(0, 1.6) - 4)}>{tr.dNerve}</text>
                  <text x={950} y={5262} textAnchor="end" fontFamily={display} fontWeight={900} fontSize={36} fill="#ffb3b5" opacity={sp(3, 20)}>{tr.dVessels}</text>
                  <g opacity={narrow}>
                    <rect x={760} y={5476} width={210} height={50} rx={25} fill={PANEL} stroke={GOLD2} strokeWidth={3} />
                    <text x={865} y={5511} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={28} fill={GOLD2}>{tr.dNarrow}</text>
                  </g>
                  <g transform={`translate(540 5800) scale(${sp(3, at(2, 5.2) + 10, 9)})`}>
                    <rect x={-380} y={-56} width={760} height={112} rx={30} fill={PANEL} stroke={GOLD} strokeWidth={4} />
                    <text y={-8} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={34} fill={INK}>{tr.dFold1}</text>
                    <text y={36} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={34} fill={GOLD}>{tr.dFold2}</text>
                  </g>
                </g>
              );
            })()}
          </Panel>
        </g>
      </g>

      {/* ================= E · TEORÍA DEL NEUMÁTICO ================= */}
      <g opacity={fE}>
        <text x={540} y={6330} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={36} letterSpacing={4} fill={MUTED}>{tr.dTheory}</text>
        {/* yema arrugada */}
        <g transform={`translate(290 6700) scale(${padIn})`}>
          <ellipse cx={14} cy={238} rx={190} ry={26} fill="#000" opacity={0.45} />
          <clipPath id="dPadClip"><circle r={206} /></clipPath>
          <g clipPath="url(#dPadClip)">
            <image href={IMG.padWet} x={-300 * 1.17} y={-520 * 1.17} width={600 * 1.17} height={900 * 1.17} />
          </g>
          <circle r={208} fill="none" stroke={SKIN_LINE} strokeWidth={6} />
          <ellipse cx={-80} cy={-110} rx={50} ry={26} fill="#fff" opacity={0.35} transform="rotate(-30 -80 -110)" />
        </g>
        {/* neumático */}
        <g transform={`translate(790 6700) scale(${tyreIn}) rotate(${g * 0.6})`}>
          <ellipse cx={14} cy={238} rx={190} ry={26} fill="#000" opacity={0.45} transform={`rotate(${-g * 0.6})`} />
          <circle r={210} fill="url(#dTyre)" stroke="#06070a" strokeWidth={7} />
          {Array.from({ length: 18 }, (_, i) => (
            <g key={i} transform={`rotate(${i * 20})`}>
              <path d="M -16 -206 L 16 -206 L 22 -150 L -10 -150 Z" fill="#0b0c0f" />
              <path d="M -6 -150 q 30 30 0 70" fill="none" stroke="#0b0c0f" strokeWidth={10} strokeLinecap="round" />
            </g>
          ))}
          <circle r={90} fill="#2b2f36" stroke="#5d6672" strokeWidth={6} />
          <circle r={90} fill="url(#dBowl)" opacity={0.6} />
          {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 50} cy={Math.sin((a * Math.PI) / 180) * 50} r={10} fill="#1a1d22" />)}
          <ellipse cx={-90} cy={-120} rx={40} ry={16} fill="#fff" opacity={0.12} transform="rotate(-35 -90 -120)" />
        </g>
        <text x={540} y={6725} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={90} fill={GOLD} opacity={tyreIn}>=</text>
        {/* agua evacuada por los surcos */}
        {[290, 790].map((cx, k) => Array.from({ length: 6 }, (_, i) => {
          const p = flow > 0 ? ((g * 1.6 + i * 20) % 120) / 120 : 0;
          if (flow <= 0) return null;
          const dir = i % 2 ? 1 : -1;
          return <Drop key={`${k}-${i}`} x={cx + dir * (60 + p * 260)} y={6700 - 120 + (i % 3) * 120 + Math.sin(p * 6) * 10} s={0.8} rot={dir * 90} o={flow * (1 - p)} />;
        }))}
        {[{ x: 290, s: tr.dPad }, { x: 790, s: tr.dTyre }].map((l, i) => (
          <text key={i} x={l.x} y={7010} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={42} fill={INK} opacity={i ? tyreIn : padIn}>{l.s}</text>
        ))}
        <Chip x={540} y={7160} text={tr.dGrip} color={BLUE} dark s={gripS} size={36} />
      </g>

      {/* ================= F · EXPERIMENTO DE LAS CANICAS (2013) ================= */}
      <g opacity={fF}>
        <text x={540} y={7760} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={36} letterSpacing={4} fill={MUTED} opacity={expIn}>{tr.dExp}</text>
        {(() => {
          const bowls = [{ x: 270 }, { x: 810 }];
          const by = 8330;
          const N = 6;
          const marbleAt = (i: number) => {
            const p = shot > 5 ? 1 : shot < 5 ? 0 : interpolate(t, [moveStart + i * per, moveStart + i * per + per * 0.85], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
            const slot = (b: number) => ({ x: bowls[b].x - 60 + (i % 3) * 60, y: by - 30 - Math.floor(i / 3) * 44 });
            const a = slot(0), z = slot(1);
            return { p, x: a.x + (z.x - a.x) * p, y: a.y + (z.y - a.y) * p - Math.sin(p * Math.PI) * 300 };
          };
          const moving = Array.from({ length: N }, (_, i) => marbleAt(i)).find((m) => m.p > 0 && m.p < 1);
          const fx = moving ? moving.x : 270, fy = moving ? moving.y - 26 : by - 150 + Math.sin(g / 12) * 10;
          return (
            <g>
              {/* cronómetro */}
              <g transform={`translate(540 7930) scale(${expIn})`}>
                <circle r={86} fill="url(#dGoldGlow)" opacity={0.6} />
                <rect x={-14} y={-104} width={28} height={22} rx={6} fill="url(#dBowl)" />
                <circle r={70} fill={PANEL} stroke={GOLD} strokeWidth={6} />
                {Array.from({ length: 12 }, (_, i) => <line key={i} x1={0} y1={-58} x2={0} y2={-48} stroke={MUTED} strokeWidth={4} transform={`rotate(${i * 30})`} />)}
                <line x1={0} y1={0} x2={0} y2={-52} stroke={GOLD2} strokeWidth={6} strokeLinecap="round" transform={`rotate(${(shot === 5 ? t : 0) * 9})`} />
                <circle r={8} fill={GOLD2} />
              </g>
              {bowls.map((b, k) => (
                <g key={k} opacity={expIn}>
                  <ellipse cx={b.x} cy={by + 70} rx={190} ry={24} fill="#000" opacity={0.5} />
                  <path d={`M ${b.x - 170} ${by - 40} Q ${b.x - 160} ${by + 70} ${b.x} ${by + 70} Q ${b.x + 160} ${by + 70} ${b.x + 170} ${by - 40} Z`} fill="url(#dBowl)" stroke="#4b535e" strokeWidth={5} strokeLinejoin="round" />
                  <ellipse cx={b.x} cy={by - 40} rx={170} ry={30} fill="#1d2430" stroke="#c9d0d9" strokeWidth={5} />
                  <ellipse cx={b.x} cy={by - 36} rx={150} ry={20} fill="url(#dWater)" />
                  <ellipse cx={b.x - 110} cy={by + 10} rx={14} ry={30} fill="#fff" opacity={0.35} />
                </g>
              ))}
              {Array.from({ length: N }, (_, i) => {
                const m = marbleAt(i);
                return (
                  <g key={i} opacity={expIn}>
                    <circle cx={m.x} cy={m.y} r={24} fill="url(#dMarble)" stroke="#123a66" strokeWidth={3} />
                    <ellipse cx={m.x - 8} cy={m.y - 9} rx={7} ry={4} fill="#fff" opacity={0.85} />
                    {m.p > 0 && m.p < 1 && <circle cx={m.x + 14} cy={m.y + 26} r={5} fill="#bfeaff" opacity={0.8} />}
                  </g>
                );
              })}
              <g opacity={expIn}>
                <Hand id="f" x={fx} tip={fy} s={0.32} wr={1} g={g} />
              </g>
              <Chip x={540} y={8560} text={tr.dFaster} color={GREEN} dark s={fasterS} size={32} />
              <Chip x={540} y={8680} text={tr.dUnsure} color={MUTED} dark s={unsureS} size={30} />
            </g>
          );
        })()}
      </g>
    </g>
  );
};
