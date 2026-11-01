import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { body, display } from "../fonts";
import { useT } from "../i18n";
import { Theme } from "../schema";
import { ANIM_FPS, useFrame } from "../time";
import { Sphere } from "./parts";

/* Dibujos para el reel "Me suben el sueldo y no lo noto" (inflación + tramos del IRPF). */

type D = Record<string, unknown>;
type DP = { data: D; theme: Theme };
const fps = ANIM_FPS;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

const GREEN = "#3ddc84";
const RED = "#ff5a5f";
const fmtEur = (v: number, locale: string) => Math.round(v).toLocaleString(locale);

const TaxDefs: React.FC = () => (
  <defs>
    <radialGradient id="txCoin" cx="35%" cy="30%" r="75%"><stop offset="0%" stopColor="#fff6c2" /><stop offset="45%" stopColor="#ffcf3f" /><stop offset="100%" stopColor="#b57f00" /></radialGradient>
    <linearGradient id="txCoinEdge" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d99c10" /><stop offset="100%" stopColor="#8a5f00" /></linearGradient>
    <radialGradient id="txPig" cx="38%" cy="30%" r="80%"><stop offset="0%" stopColor="#ffe1ea" /><stop offset="50%" stopColor="#f7a3bf" /><stop offset="100%" stopColor="#c9567f" /></radialGradient>
    <radialGradient id="txSnout" cx="40%" cy="35%" r="70%"><stop offset="0%" stopColor="#ffd0de" /><stop offset="100%" stopColor="#e07a9d" /></radialGradient>
    <linearGradient id="txPaper" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#dfe6ee" /></linearGradient>
    <linearGradient id="txGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ffffff" stopOpacity={0.22} /><stop offset="35%" stopColor="#ffffff" stopOpacity={0.06} /><stop offset="100%" stopColor="#ffffff" stopOpacity={0.16} /></linearGradient>
    <linearGradient id="txIce" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#e9fbff" stopOpacity={0.75} /><stop offset="50%" stopColor="#9fe3ff" stopOpacity={0.4} /><stop offset="100%" stopColor="#5fb8e6" stopOpacity={0.55} /></linearGradient>
    <linearGradient id="txMetal" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#8a97a6" /><stop offset="45%" stopColor="#eef3f8" /><stop offset="100%" stopColor="#6d7987" /></linearGradient>
    <linearGradient id="txBasket" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e3a35c" /><stop offset="100%" stopColor="#9c5d22" /></linearGradient>
    <linearGradient id="txGreenCol" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#9bf5c1" /><stop offset="55%" stopColor={GREEN} /><stop offset="100%" stopColor="#1f8f52" /></linearGradient>
    <linearGradient id="txRedCol" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ffb3b5" /><stop offset="55%" stopColor={RED} /><stop offset="100%" stopColor="#b8292e" /></linearGradient>
    <radialGradient id="txRedGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={RED} stopOpacity={0.6} /><stop offset="100%" stopColor={RED} stopOpacity={0} /></radialGradient>
    <radialGradient id="txGreenGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={GREEN} stopOpacity={0.55} /><stop offset="100%" stopColor={GREEN} stopOpacity={0} /></radialGradient>
  </defs>
);

/** Moneda de euro con volumen (canto, cara con degradado, relieve y brillo). */
const Coin: React.FC<{ x: number; y: number; r?: number; rot?: number; opacity?: number }> = ({ x, y, r = 34, rot = 0, opacity = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
    <ellipse cx={3} cy={6} rx={r} ry={r} fill="url(#txCoinEdge)" />
    <circle r={r} fill="url(#txCoin)" stroke="#9a6a00" strokeWidth={Math.max(2.5, r * 0.1)} />
    <circle r={r * 0.72} fill="none" stroke="#c48d0a" strokeWidth={r * 0.07} opacity={0.8} />
    <text y={r * 0.36} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={r * 1.05} fill="#9a6a00">€</text>
    <ellipse cx={-r * 0.38} cy={-r * 0.42} rx={r * 0.3} ry={r * 0.16} fill="#fff" opacity={0.75} transform={`rotate(-30 ${-r * 0.38} ${-r * 0.42})`} />
  </g>
);

/** Moneda de canto (para pilas). */
const CoinFlat: React.FC<{ x: number; y: number; w?: number }> = ({ x, y, w = 110 }) => (
  <g>
    <rect x={x - w / 2} y={y - 6} width={w} height={20} fill="url(#txCoinEdge)" />
    <ellipse cx={x} cy={y + 14} rx={w / 2} ry={11} fill="#8a5f00" />
    <ellipse cx={x} cy={y - 6} rx={w / 2} ry={11} fill="url(#txCoin)" stroke="#9a6a00" strokeWidth={3} />
    <ellipse cx={x - w * 0.18} cy={y - 9} rx={w * 0.12} ry={3} fill="#fff" opacity={0.6} />
    {[0.2, 0.4, 0.6, 0.8].map((k) => <line key={k} x1={x - w / 2 + w * k} y1={y + 1} x2={x - w / 2 + w * k} y2={y + 15} stroke="#7a5200" strokeWidth={2} opacity={0.5} />)}
  </g>
);

/** Etiqueta tipo chapa (IPC / IRPF). */
const Tag: React.FC<{ x: number; y: number; text: string; color: string; s?: number; pulse?: number }> = ({ x, y, text, color, s = 1, pulse = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s * (1 + pulse * 0.08)})`}>
    <ellipse cx={0} cy={58} rx={70} ry={10} fill="#000" opacity={0.25} />
    <circle r={110} fill={color === RED ? "url(#txRedGlow)" : "url(#txGreenGlow)"} opacity={0.5 + pulse * 0.5} />
    <rect x={-80} y={-36} width={160} height={72} rx={36} fill={color} stroke="#00000040" strokeWidth={5} />
    <rect x={-66} y={-28} width={132} height={18} rx={9} fill="#fff" opacity={0.3} />
    <text y={14} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={40} fill="#fff">{text}</text>
  </g>
);

/** Ojo con párpado que parpadea y ceja (para la hucha). */
const PigEye: React.FC<{ x: number; y: number; t: number; worry: number }> = ({ x, y, t, worry }) => {
  const ph = t % 80;
  const blink = ph > 74 ? Math.sin(((ph - 74) / 6) * Math.PI) : 0;
  const lid = 0.18 + worry * 0.2 + blink * (1 - 0.18 - worry * 0.2);
  return (
    <g>
      <ellipse cx={x} cy={y} rx={22} ry={27} fill="#fff" stroke="#a8436a" strokeWidth={4} />
      <circle cx={x + 4} cy={y + 4} r={14} fill="#3a2230" />
      <circle cx={x + 4} cy={y + 4} r={7} fill="#140a10" />
      <circle cx={x + 9} cy={y - 2} r={4.5} fill="#fff" />
      <path d={`M ${x - 24} ${y - 28} L ${x + 24} ${y - 28} L ${x + 24} ${y - 28 + 56 * lid} Q ${x} ${y - 22 + 56 * lid} ${x - 24} ${y - 28 + 56 * lid} Z`} fill="#f4a0bd" stroke="#a8436a" strokeWidth={3} strokeLinejoin="round" />
      <path d={`M ${x - 26} ${y - 40 - worry * 6} Q ${x} ${y - 52 + worry * 14} ${x + 26} ${y - 36 + worry * 4}`} stroke="#7a2a4a" strokeWidth={6} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** Gancho: la nómina mete monedas en la hucha… y se escapan por abajo hacia IPC e IRPF. */
export const PiggyLeak: React.FC<DP> = () => {
  const t = useFrame();
  const tr = useT();
  const enter = spring({ frame: t, fps, config: { damping: 12 } });
  const worry = interpolate(t, [40, 110], [0, 1], clamp);
  const breathe = Math.sin(t / 14) * 4;
  const N = 12;
  const slot = { x: 470, y: 312 };
  const pay = { x: 190, y: 200 };
  const sideTag = (k: number) => (k % 2 ? 850 : 150);
  const pulses = [0, 1].map((side) =>
    Array.from({ length: N }, (_, k) => k).filter((k) => k % 2 === side).reduce((acc, k) => {
      const arrive = 26 + k * 13 + 50;
      return Math.max(acc, interpolate(t, [arrive, arrive + 4, arrive + 14], [0, 1, 0], clamp));
    }, 0),
  );
  const payPop = spring({ frame: t - 6, fps, config: { damping: 10 } });
  const amount = interpolate(t, [10, 40], [2000, 2100], clamp);
  return (
    <>
      <TaxDefs />
      {/* suelo */}
      <ellipse cx={500} cy={712} rx={300} ry={26} fill="#000" opacity={0.28} />
      {/* monedas que salen por la grieta y ruedan hacia IPC / IRPF */}
      {Array.from({ length: N }, (_, k) => {
        const born = 26 + k * 13 + 20;
        const p1 = interpolate(t, [born, born + 10], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
        const p2 = interpolate(t, [born + 10, born + 30], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
        if (t < born || p2 >= 1) return null;
        const tx = sideTag(k);
        const x = lerp(480, tx, p2);
        const y = p2 > 0 ? 690 - Math.sin(p2 * Math.PI) * 50 : lerp(640, 690, p1);
        return <Coin key={`o${k}`} x={x} y={y} r={24} rot={p2 * (tx > 500 ? 540 : -540)} opacity={1 - Math.max(0, p2 - 0.85) * 6} />;
      })}
      {/* hucha */}
      <g transform={`translate(500 ${470 + (1 - enter) * 60}) scale(${enter}) translate(-500 -470)`}>
        {/* patas */}
        {[330, 410, 560, 640].map((x, i) => (
          <g key={i}><rect x={x - 26} y={560} width={52} height={130} rx={22} fill="url(#txPig)" stroke="#a8436a" strokeWidth={5} /><rect x={x - 24} y={668} width={48} height={20} rx={10} fill="#c9567f" /></g>
        ))}
        {/* cola rizada */}
        <path d={`M 268 450 c -40 -10 -60 30 -34 44 c 22 12 32 -22 6 -24 c -26 -2 -40 20 -48 ${30 + Math.sin(t / 6) * 6}`} stroke="#c9567f" strokeWidth={10} fill="none" strokeLinecap="round" />
        {/* cuerpo */}
        <ellipse cx={490} cy={470} rx={235 + breathe} ry={172 + breathe * 0.6} fill="url(#txPig)" stroke="#a8436a" strokeWidth={7} />
        <ellipse cx={400} cy={380} rx={90} ry={40} fill="#fff" opacity={0.35} transform="rotate(-18 400 380)" />
        <ellipse cx={380} cy={372} rx={26} ry={12} fill="#fff" opacity={0.8} transform="rotate(-18 380 372)" />
        {/* oreja */}
        <path d="M 560 330 L 610 250 L 640 350 Z" fill="url(#txSnout)" stroke="#a8436a" strokeWidth={6} strokeLinejoin="round" />
        <path d="M 586 320 L 610 278 L 624 336 Z" fill="#c9567f" opacity={0.6} />
        {/* ranura */}
        <rect x={slot.x - 70} y={slot.y - 12} width={140} height={24} rx={12} fill="#5a1f38" stroke="#a8436a" strokeWidth={4} />
        <rect x={slot.x - 60} y={slot.y - 6} width={120} height={6} rx={3} fill="#000" opacity={0.4} />
        {/* hocico */}
        <ellipse cx={725} cy={478} rx={52} ry={64} fill="url(#txSnout)" stroke="#a8436a" strokeWidth={6} />
        <ellipse cx={712} cy={462} rx={9} ry={16} fill="#7a2a4a" />
        <ellipse cx={742} cy={462} rx={9} ry={16} fill="#7a2a4a" />
        <ellipse cx={712} cy={440} rx={14} ry={6} fill="#fff" opacity={0.5} />
        <PigEye x={640} y={410} t={t} worry={worry} />
        <ellipse cx={640} cy={470} rx={24} ry={11} fill="#ff6f91" opacity={0.45} />
        {/* boca preocupada */}
        <path d={`M 640 535 q 26 ${-14 * worry + 8 * (1 - worry)} 52 0`} stroke="#7a2a4a" strokeWidth={6} fill="none" strokeLinecap="round" />
        {/* grieta */}
        <path d="M 440 640 l 14 -26 l 12 18 l 14 -24 l 12 22 l 14 -16" stroke="#5a1f38" strokeWidth={6} fill="none" strokeLinejoin="round" strokeLinecap="round" opacity={interpolate(t, [30, 40], [0, 1], clamp)} />
      </g>
      {/* nómina */}
      <g transform={`translate(${pay.x} ${pay.y + Math.sin(t / 12) * 6}) rotate(${-8 + Math.sin(t / 16) * 2}) scale(${payPop})`}>
        <rect x={-104} y={-120} width={216} height={250} rx={18} fill="#000" opacity={0.25} transform="translate(8 10)" />
        <rect x={-104} y={-120} width={208} height={240} rx={18} fill="url(#txPaper)" stroke="#8fa0b3" strokeWidth={5} />
        <text x={0} y={-74} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={30} fill="#2b3a4d">{tr.payslip}</text>
        {[0, 1, 2].map((i) => <rect key={i} x={-76} y={-50 + i * 26} width={i === 1 ? 110 : 150} height={11} rx={5} fill="#c4cfdb" />)}
        <text x={0} y={70} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={42} fill="#1f8f52">{fmtEur(amount, tr.locale)} €</text>
        <g transform={`translate(112 -128) scale(${spring({ frame: t - 34, fps, config: { damping: 7 } })})`}>
          <circle r={40} fill={GREEN} stroke="#1f8f52" strokeWidth={5} />
          <path d="M -14 8 L 0 -12 L 14 8" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text y={30} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={18} fill="#fff">+5%</text>
        </g>
      </g>
      {/* monedas que entran en la hucha */}
      {Array.from({ length: N }, (_, k) => {
        const born = 26 + k * 13;
        const p = interpolate(t, [born, born + 20], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
        if (t < born || p >= 1) return null;
        const x = lerp(pay.x + 60, slot.x, p);
        const y = lerp(pay.y + 40, slot.y - 8, p) - Math.sin(p * Math.PI) * 150;
        return <Coin key={`i${k}`} x={x} y={y} r={30} rot={p * 360} opacity={p > 0.9 ? (1 - p) * 10 : 1} />;
      })}
      <Tag x={150} y={760} text={tr.ipc} color={RED} s={spring({ frame: t - 50, fps, config: { damping: 10 } })} pulse={pulses[0]} />
      <Tag x={850} y={760} text={tr.irpf} color={RED} s={spring({ frame: t - 58, fps, config: { damping: 10 } })} pulse={pulses[1]} />
    </>
  );
};

/** Balanza: sueldo +5 % frente a precios +5 % → se queda nivelada (mismo poder de compra). */
export const InflationScale: React.FC<DP> = () => {
  const t = useFrame();
  const tr = useT();
  const wob = Math.sin(t / 7) * 9 * Math.exp(-Math.max(0, t - 20) / 70) * (t > 20 ? 1 : 0);
  const a = (wob * Math.PI) / 180;
  const piv = { x: 500, y: 250 };
  const L = 300;
  const lx = piv.x - Math.cos(a) * L, ly = piv.y - Math.sin(a) * L;
  const rx = piv.x + Math.cos(a) * L, ry = piv.y + Math.sin(a) * L;
  const coins = Math.floor(interpolate(t, [10, 80], [3, 8], clamp));
  const items = Math.floor(interpolate(t, [18, 88], [1, 6], clamp));
  const eq = spring({ frame: t - 120, fps, config: { damping: 9 } });
  const Plate: React.FC<{ x: number; y: number; children?: React.ReactNode }> = ({ x, y, children }) => (
    <g>
      <line x1={x} y1={y} x2={x - 110} y2={y + 230} stroke="#c9d4df" strokeWidth={4} />
      <line x1={x} y1={y} x2={x + 110} y2={y + 230} stroke="#c9d4df" strokeWidth={4} />
      <circle cx={x} cy={y} r={10} fill="url(#txMetal)" stroke="#5b6675" strokeWidth={3} />
      {children}
      <path d={`M ${x - 140} ${y + 230} Q ${x} ${y + 290} ${x + 140} ${y + 230} Z`} fill="url(#txMetal)" stroke="#5b6675" strokeWidth={5} strokeLinejoin="round" />
      <ellipse cx={x} cy={y + 230} rx={140} ry={14} fill="#eef3f8" stroke="#5b6675" strokeWidth={4} />
      <ellipse cx={x - 60} cy={y + 248} rx={30} ry={6} fill="#fff" opacity={0.6} />
    </g>
  );
  const goods = [
    (x: number, y: number) => <g><rect x={x - 22} y={y - 70} width={44} height={70} rx={10} fill="#f4f7ff" stroke="#9aa6b8" strokeWidth={4} /><rect x={x - 22} y={y - 50} width={44} height={22} fill="#5ec8ff" /><rect x={x - 12} y={y - 84} width={24} height={16} rx={4} fill="#5ec8ff" stroke="#2f8fd0" strokeWidth={3} /></g>,
    (x: number, y: number) => <g><ellipse cx={x} cy={y - 26} rx={56} ry={28} fill="#e0a35a" stroke="#9c5d22" strokeWidth={4} />{[-26, 0, 26].map((d) => <path key={d} d={`M ${x + d - 8} ${y - 44} q 8 14 16 0`} stroke="#9c5d22" strokeWidth={4} fill="none" />)}</g>,
    (x: number, y: number) => <g><circle cx={x} cy={y - 30} r={30} fill="url(#sph-green)" stroke="#4c8f1f" strokeWidth={4} /><path d={`M ${x} ${y - 60} q 4 -14 16 -18`} stroke="#6b4a1e" strokeWidth={5} fill="none" strokeLinecap="round" /><ellipse cx={x - 10} cy={y - 42} rx={8} ry={5} fill="#fff" opacity={0.7} /></g>,
    (x: number, y: number) => <g><rect x={x - 34} y={y - 50} width={68} height={50} rx={8} fill="#ffd23f" stroke="#c98f00" strokeWidth={4} /><rect x={x - 34} y={y - 40} width={68} height={10} fill="#fff" opacity={0.4} /></g>,
    (x: number, y: number) => <g><circle cx={x} cy={y - 26} r={26} fill="url(#sph-yellow)" stroke="#c98f00" strokeWidth={4} /><ellipse cx={x - 8} cy={y - 36} rx={7} ry={4} fill="#fff" opacity={0.8} /></g>,
    (x: number, y: number) => <g><circle cx={x} cy={y - 24} r={24} fill="url(#sph-purple)" stroke="#6d24a8" strokeWidth={4} /><ellipse cx={x - 7} cy={y - 34} rx={6} ry={4} fill="#fff" opacity={0.8} /></g>,
  ];
  const slots = [[-60, 0], [10, 0], [70, 0], [-30, -50], [40, -54], [-80, -46]];
  return (
    <>
      <TaxDefs />
      <ellipse cx={500} cy={742} rx={200} ry={20} fill="#000" opacity={0.3} />
      {/* pie */}
      <path d="M 400 735 Q 500 690 600 735 Z" fill="url(#txMetal)" stroke="#5b6675" strokeWidth={5} />
      <rect x={488} y={piv.y} width={24} height={460} rx={12} fill="url(#txMetal)" stroke="#5b6675" strokeWidth={4} />
      {/* brazo */}
      <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="#5b6675" strokeWidth={22} strokeLinecap="round" />
      <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="url(#txMetal)" strokeWidth={14} strokeLinecap="round" />
      <path d={`M 500 ${piv.y - 46} L 486 ${piv.y - 10} L 514 ${piv.y - 10} Z`} fill="#ffd23f" stroke="#c98f00" strokeWidth={3} transform={`rotate(${wob} 500 ${piv.y})`} />
      <Sphere x={500} y={piv.y} r={20} color="white" />
      {/* platillo izquierdo: monedas */}
      <Plate x={lx} y={ly}>
        {Array.from({ length: coins }, (_, i) => {
          const s = spring({ frame: t - 10 - i * 10, fps, config: { damping: 12 } });
          return <g key={i} transform={`translate(0 ${(1 - s) * -120})`} opacity={s}><CoinFlat x={lx + (i % 2 ? 4 : -4)} y={ly + 212 - i * 22} /></g>;
        })}
      </Plate>
      {/* platillo derecho: cesta de la compra */}
      <Plate x={rx} y={ry}>
        {Array.from({ length: items }, (_, i) => {
          const s = spring({ frame: t - 18 - i * 14, fps, config: { damping: 10 } });
          const [dx, dy] = slots[i];
          return <g key={i} transform={`translate(${rx + dx} ${ry + 200 + dy}) scale(${s}) translate(${-(rx + dx)} ${-(ry + 200 + dy)})`}>{goods[i](rx + dx, ry + 200 + dy)}</g>;
        })}
        <path d={`M ${rx - 100} ${ry + 150} L ${rx + 100} ${ry + 150} L ${rx + 82} ${ry + 226} L ${rx - 82} ${ry + 226} Z`} fill="url(#txBasket)" stroke="#7a4a1e" strokeWidth={5} strokeLinejoin="round" />
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={rx - 70 + i * 35} y1={ry + 156} x2={rx - 60 + i * 30} y2={ry + 222} stroke="#7a4a1e" strokeWidth={3} opacity={0.6} />)}
        <rect x={rx - 96} y={ry + 160} width={192} height={10} rx={5} fill="#fff" opacity={0.25} />
      </Plate>
      {/* etiquetas */}
      {[{ x: 200, text: tr.salaryUp, color: GREEN, d: 8 }, { x: 800, text: tr.pricesUp, color: RED, d: 16 }].map((l, i) => {
        const s = spring({ frame: t - l.d, fps, config: { damping: 11 } });
        return (
          <g key={i} transform={`translate(${l.x} 80) scale(${s})`}>
            <rect x={-150} y={-38} width={300} height={76} rx={38} fill={l.color} stroke="#00000040" strokeWidth={4} />
            <rect x={-134} y={-30} width={268} height={16} rx={8} fill="#fff" opacity={0.3} />
            <text y={15} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={38} fill="#fff">{l.text}</text>
          </g>
        );
      })}
      {/* resultado */}
      <g transform={`translate(500 172) scale(${eq})`} opacity={eq}>
        <rect x={-260} y={-30} width={520} height={60} rx={30} fill="#ffffff" stroke="#c9d4df" strokeWidth={4} />
        <text y={11} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={30} fill="#203040">{tr.samePower}</text>
      </g>
    </>
  );
};

/* Escala general orientativa del IRPF (estatal + autonómica de referencia). */
const BRACKETS = [
  { hi: 12450, rate: 19, color: "#5be38a", dark: "#2a8a4f" },
  { hi: 20200, rate: 24, color: "#b6e35b", dark: "#6e9420" },
  { hi: 35200, rate: 30, color: "#ffd23f", dark: "#b88a00" },
  { hi: 60000, rate: 37, color: "#ff9f43", dark: "#b8601a" },
  { hi: 300000, rate: 45, color: "#ff6b5a", dark: "#b8352a" },
  { hi: Infinity, rate: 47, color: "#e0457b", dark: "#9c234f" },
];

/** Vasos por tramo: el sueldo "llena" cada tramo antes de pasar al siguiente. */
export const TaxJars: React.FC<DP> = () => {
  const t = useFrame();
  const tr = useT();
  const s1 = interpolate(t, [12, 110], [0, 30000], { ...clamp, easing: Easing.out(Easing.quad) });
  const s2 = interpolate(t, [140, 185], [0, 6000], { ...clamp, easing: ease });
  const salary = s1 + s2;
  const W = 120, H = 300, bottom = 600;
  const cx = (i: number) => 105 + i * 158;
  let lo = 0;
  const jars = BRACKETS.map((b, i) => {
    const hiVal = b.hi === Infinity ? 600000 : b.hi;
    const f = Math.max(0, Math.min(1, (salary - lo) / (hiVal - lo)));
    const r = { ...b, lo, f, i };
    lo = hiVal;
    return r;
  });
  const active = jars.reduce((acc, j) => (j.f > 0 ? j.i : acc), 0);
  const pouring = (t > 12 && t < 112) || (t > 140 && t < 187);
  const streamX = cx(active);
  const tip1 = spring({ frame: t - 112, fps, config: { damping: 10 } });
  const tip2 = spring({ frame: t - 190, fps, config: { damping: 10 } });
  const rangeLabel = (i: number) => (i === 0 ? `0–12.450` : BRACKETS[i].hi === Infinity ? `+300.000` : `–${BRACKETS[i].hi.toLocaleString("es-ES")}`);
  return (
    <>
      <TaxDefs />
      {/* contador del sueldo */}
      <g transform={`translate(500 70) scale(${spring({ frame: t, fps, config: { damping: 12 } })})`}>
        <rect x={-250} y={-44} width={500} height={88} rx={44} fill="#ffffff12" stroke="#ffffff40" strokeWidth={3} />
        <text x={-215} y={14} fontFamily={body} fontWeight={700} fontSize={32} fill="#cfe3d8">{tr.yourSalary}</text>
        <text x={225} y={16} textAnchor="end" fontFamily={display} fontWeight={900} fontSize={46} fill={GREEN}>{fmtEur(salary, tr.locale)} €</text>
      </g>
      {/* grifo y chorro */}
      <g transform={`translate(${streamX} 0)`}>
        <rect x={-30} y={128} width={60} height={34} rx={10} fill="url(#txMetal)" stroke="#5b6675" strokeWidth={4} />
        <rect x={-16} y={160} width={32} height={18} rx={6} fill="#8a97a6" />
        {pouring && <>
          <rect x={-9} y={176} width={18} height={bottom - 176 - H * jars[active].f} fill={GREEN} opacity={0.85} />
          <rect x={-5} y={176} width={5} height={bottom - 176 - H * jars[active].f} fill="#fff" opacity={0.5} />
          {[0, 1, 2].map((k) => { const p = ((t + k * 7) % 21) / 21; return <Coin key={k} x={Math.sin(k * 2) * 8} y={180 + p * (bottom - 200 - H * jars[active].f)} r={14} rot={p * 360} />; })}
        </>}
      </g>
      {jars.map((j) => {
        const x = cx(j.i);
        const top = bottom - H;
        const level = bottom - H * j.f;
        const wave = Math.sin(t / 5 + j.i) * 5 * (j.f > 0 && j.f < 1 ? 1 : 0.3);
        const enter = spring({ frame: t - j.i * 4, fps, config: { damping: 12 } });
        return (
          <g key={j.i} transform={`translate(0 ${(1 - enter) * 80})`} opacity={enter}>
            <ellipse cx={x} cy={bottom + 14} rx={W * 0.6} ry={10} fill="#000" opacity={0.25} />
            <clipPath id={`jar${j.i}`}><rect x={x - W / 2} y={top} width={W} height={H} rx={18} /></clipPath>
            <rect x={x - W / 2} y={top} width={W} height={H} rx={18} fill="#ffffff08" />
            <g clipPath={`url(#jar${j.i})`}>
              {j.f > 0.001 && <>
                <path d={`M ${x - W} ${level} Q ${x - W / 4} ${level - wave} ${x} ${level} T ${x + W} ${level} L ${x + W} ${bottom + 10} L ${x - W} ${bottom + 10} Z`} fill={j.color} />
                <rect x={x + W * 0.18} y={level} width={W * 0.32} height={H} fill={j.dark} opacity={0.35} />
                {[0, 1, 2].map((k) => { const p = ((t + k * 13 + j.i * 5) % 40) / 40; const by = bottom - p * (bottom - level); return by > level + 6 ? <circle key={k} cx={x - 30 + k * 26} cy={by} r={5} fill="#fff" opacity={0.45} /> : null; })}
              </>}
            </g>
            <rect x={x - W / 2} y={top} width={W} height={H} rx={18} fill="url(#txGlass)" stroke="#d6e4f0" strokeOpacity={0.7} strokeWidth={5} />
            <rect x={x - W / 2 + 12} y={top + 16} width={12} height={H - 40} rx={6} fill="#fff" opacity={0.35} />
            <text x={x} y={top - 18} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={22} fill="#cfe3d8">{rangeLabel(j.i)}</text>
            <text x={x} y={bottom + 64} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={44} fill={j.color}>{j.rate}%</text>
          </g>
        );
      })}
      {/* nota 1: el tramo del 30 % solo grava lo que cae en él */}
      <g transform={`translate(${cx(2)} 700) scale(${tip1})`} opacity={tip1 * (1 - tip2)}>
        <path d="M 0 -26 l -12 18 h 24 Z" fill="#fff" />
        <rect x={-175} y={-10} width={350} height={56} rx={28} fill="#fff" />
        <text y={28} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={26} fill="#203040">{tr.onlyThisPart}</text>
      </g>
      {/* nota 2: al subir a 36.000, solo 800 € pagan el 37 % */}
      <g transform={`translate(${cx(3)} 700) scale(${tip2})`}>
        <path d="M 0 -26 l -12 18 h 24 Z" fill="#ff9f43" />
        <rect x={-165} y={-10} width={330} height={60} rx={30} fill="#ff9f43" stroke="#b8601a" strokeWidth={4} />
        <text y={30} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={28} fill="#fff">{tr.only800}</text>
      </g>
    </>
  );
};

/**
 * Barra de tramos con el sueldo marcado.
 * mode "frozen": tramos encerrados en hielo; el sueldo sube con la inflación y salta al tramo del 37 %.
 * mode "deflate": el hielo se rompe y los tramos se estiran al ritmo del IPC → el sueldo se queda en su tramo.
 */
export const BracketBar: React.FC<DP> = ({ data }) => {
  const t = useFrame();
  const tr = useT();
  const deflate = data.mode === "deflate";
  const X0 = 70, X1 = 930, MAX = 50000;
  const px = (v: number) => X0 + (v / MAX) * (X1 - X0);
  const grow = interpolate(t, [40, 130], [0, 1], { ...clamp, easing: ease });
  const k = deflate ? 1 + 0.16 * grow : 1;
  const salary = 32000 * (1 + 0.16 * grow);
  const y = 430, h = 110;
  const shiver = deflate ? 0 : Math.sin(t * 1.7) * 1.5;
  const crack = deflate ? interpolate(t, [10, 34], [0, 1], clamp) : 0;
  const bounds = BRACKETS.slice(0, 4).map((b) => b.hi * k);
  const sx = px(salary);
  const crossed = !deflate && salary > 35200;
  const crossPop = spring({ frame: t - 104, fps, config: { damping: 8 } });
  const hop = crossed ? Math.max(0, Math.sin(Math.min(1, (t - 100) / 14) * Math.PI)) * 50 : 0;
  const ipcPop = spring({ frame: t - 30, fps, config: { damping: 10 } });
  const result = spring({ frame: t - 140, fps, config: { damping: 9 } });
  let lo = 0;
  return (
    <>
      <TaxDefs />
      {/* IPC que sube */}
      <g transform={`translate(800 110) scale(${ipcPop})`}>
        <rect x={-130} y={-50} width={260} height={100} rx={26} fill={RED} stroke="#b8292e" strokeWidth={5} />
        <rect x={-114} y={-40} width={228} height={18} rx={9} fill="#fff" opacity={0.3} />
        <text x={-60} y={18} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={36} fill="#fff">{tr.ipc}</text>
        <text x={58} y={20} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={46} fill="#fff">+{Math.round(16 * grow)}%</text>
      </g>
      <text x={X0} y={130} fontFamily={display} fontWeight={900} fontSize={44} fill={deflate ? GREEN : "#9fe3ff"}>{deflate ? tr.deflated : tr.frozen}</text>
      {/* barra de tramos */}
      <ellipse cx={500} cy={y + h + 30} rx={440} ry={16} fill="#000" opacity={0.25} />
      <g transform={`translate(${shiver} 0)`}>
        <clipPath id="barClip"><rect x={X0} y={y} width={X1 - X0} height={h} rx={26} /></clipPath>
        <g clipPath="url(#barClip)">
          {BRACKETS.slice(0, 4).map((b, i) => {
            const a = px(lo), z = Math.min(X1, px(i === 3 ? 999999 : bounds[i]));
            lo = bounds[i];
            return (
              <g key={i}>
                <rect x={a} y={y} width={Math.max(0, z - a)} height={h} fill={b.color} />
                <rect x={a} y={y + h * 0.62} width={Math.max(0, z - a)} height={h * 0.38} fill={b.dark} opacity={0.35} />
                <rect x={a + 6} y={y + 10} width={Math.max(0, z - a - 12)} height={16} rx={8} fill="#fff" opacity={0.35} />
                {z - a > 90 && <text x={(a + z) / 2} y={y + 72} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={42} fill="#1b2a22">{b.rate}%</text>}
              </g>
            );
          })}
          {crossed && <rect x={px(35200)} y={y} width={Math.max(0, sx - px(35200))} height={h} fill={RED} opacity={0.55 + Math.sin(t / 3) * 0.2} />}
        </g>
        <rect x={X0} y={y} width={X1 - X0} height={h} rx={26} fill="none" stroke="#0b1a14" strokeOpacity={0.5} strokeWidth={6} />
        {/* límites */}
        {bounds.slice(0, 3).map((b, i) => (
          <g key={i}>
            <line x1={px(b)} y1={y - 8} x2={px(b)} y2={y + h + 8} stroke="#0b1a14" strokeWidth={4} opacity={0.6} />
            <text x={px(b)} y={y + h + 50} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={26} fill="#cfe3d8">{fmtEur(b, tr.locale)}</text>
          </g>
        ))}
        {/* hielo */}
        {(!deflate || crack < 1) && (
          <g opacity={deflate ? 1 - crack : 1}>
            <rect x={X0 - 22} y={y - 26} width={X1 - X0 + 44} height={h + 52} rx={20} fill="url(#txIce)" stroke="#e9fbff" strokeWidth={4} />
            {[[150, 0.2], [430, 0.5], [760, 0.3]].map(([x, o], i) => <path key={i} d={`M ${x} ${y - 20} l 40 ${h + 40}`} stroke="#fff" strokeWidth={10} opacity={o} strokeLinecap="round" />)}
            {[0, 1, 2, 3, 4].map((i) => {
              const fx = 120 + i * 180, fy = y - 40 + ((i * 37) % 30);
              return <g key={i} transform={`translate(${fx} ${fy}) rotate(${t * 2 + i * 30})`} opacity={0.8}>{[0, 60, 120].map((r) => <line key={r} x1={-12} y1={0} x2={12} y2={0} stroke="#e9fbff" strokeWidth={4} strokeLinecap="round" transform={`rotate(${r})`} />)}</g>;
            })}
          </g>
        )}
        {/* esquirlas al romperse */}
        {deflate && crack > 0 && crack < 1 && Array.from({ length: 12 }, (_, i) => {
          const ang = (i / 12) * Math.PI * 2;
          const d = crack * 260;
          return <path key={i} d="M 0 -18 L 16 6 L -12 14 Z" fill="#c9f1ff" stroke="#fff" strokeWidth={2} opacity={1 - crack} transform={`translate(${500 + Math.cos(ang) * d * 1.6} ${y + h / 2 + Math.sin(ang) * d}) rotate(${crack * 400 + i * 30})`} />;
        })}
        {deflate && grow > 0 && grow < 1 && [0, 1, 2].map((i) => <path key={i} d={`M ${px(bounds[i]) + 14} ${y - 40} l 30 0 m -12 -12 l 12 12 l -12 12`} stroke={GREEN} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
      </g>
      {/* marcador del sueldo */}
      <g transform={`translate(${sx} ${y - 30 - hop})`}>
        <path d="M 0 0 C -40 -40 -46 -70 -46 -96 A 46 46 0 0 1 46 -96 C 46 -70 40 -40 0 0 Z" fill={crossed ? RED : "#ffffff"} stroke={crossed ? "#b8292e" : "#9aa6b8"} strokeWidth={5} />
        <Coin x={0} y={-96} r={28} rot={Math.sin(t / 8) * 10} />
        <rect x={-110} y={-206} width={220} height={56} rx={28} fill="#0b1a14" stroke={crossed ? RED : "#ffffff60"} strokeWidth={3} />
        <text y={-167} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={32} fill={crossed ? RED : "#fff"}>{tr.yourSalary}</text>
      </g>
      {/* chispas al saltar de tramo */}
      {crossed && crossPop < 1.2 && Array.from({ length: 10 }, (_, i) => {
        const p = interpolate(t, [104, 130], [0, 1], clamp);
        const ang = (i / 10) * Math.PI * 2;
        return p < 1 ? <circle key={i} cx={px(35200) + Math.cos(ang) * p * 120} cy={y + h / 2 + Math.sin(ang) * p * 90} r={9 * (1 - p)} fill={i % 2 ? RED : "#ffd23f"} /> : null;
      })}
      {/* resultado */}
      {crossed && (
        <g transform={`translate(500 ${y + h + 150}) scale(${crossPop}) rotate(${Math.sin(t / 4) * 1.5})`}>
          <rect x={-250} y={-62} width={500} height={124} rx={36} fill={RED} stroke="#b8292e" strokeWidth={5} />
          <rect x={-232} y={-52} width={464} height={18} rx={9} fill="#fff" opacity={0.3} />
          <text y={-8} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={38} fill="#fff">{tr.richer1}</text>
          <text y={40} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={38} fill="#fff">{tr.richer2}</text>
        </g>
      )}
      {deflate && (
        <g transform={`translate(500 ${y + h + 130}) scale(${result})`}>
          <rect x={-200} y={-38} width={400} height={76} rx={38} fill={GREEN} />
          <path d="M -160 2 l 14 14 l 26 -30" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x={20} y={14} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={36} fill="#0b1a14">{tr.sameBracket}</text>
        </g>
      )}
    </>
  );
};

/** Ejemplo: sueldo +16 % frente a IRPF +24 % (columnas indexadas a la misma altura inicial). El IRPF siempre en rojo. */
export const TaxRace: React.FC<DP> = () => {
  const t = useFrame();
  const tr = useT();
  const g = interpolate(t, [40, 130], [0, 1], { ...clamp, easing: ease });
  const base = 300, bottom = 660, w = 200;
  const cols = [
    { x: 290, label: tr.grossSalary, from: 30000, to: 34800, pct: 16, fill: "url(#txGreenCol)", color: GREEN, dark: "#1f8f52", num: "#ffffff" },
    { x: 710, label: tr.irpf, from: 6111, to: 7551, pct: 24, fill: "url(#txRedCol)", color: RED, dark: "#b8292e", num: RED },
  ];
  const ref = bottom - base * 1.16;
  const over = spring({ frame: t - 150, fps, config: { damping: 8 } });
  const shake = t > 130 && t < 170 ? Math.sin(t * 2.2) * 4 * (1 - (t - 130) / 40) : 0;
  return (
    <>
      <TaxDefs />
      <rect x={60} y={bottom} width={880} height={10} rx={5} fill="#ffffff30" />
      {/* monedas que pasan del sueldo a Hacienda mientras crece */}
      {Array.from({ length: 7 }, (_, k) => {
        const born = 44 + k * 13;
        const p = interpolate(t, [born, born + 24], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
        if (t < born || p >= 1) return null;
        const yTop = bottom - base * (1 + 0.16 * g) - 40;
        return <Coin key={k} x={lerp(330, 680, p)} y={yTop - 60 - Math.sin(p * Math.PI) * 140} r={22} rot={p * 540} opacity={p > 0.88 ? (1 - p) * 8 : 1} />;
      })}
      {cols.map((c, i) => {
        const enter = spring({ frame: t - 6 - i * 8, fps, config: { damping: 13 } });
        const hgt = base * enter * (1 + (c.pct / 100) * g);
        const top = bottom - hgt;
        const chip = spring({ frame: t - 120 - i * 12, fps, config: { damping: 7 } });
        const red = i === 1;
        const glow = red ? 0.35 + 0.25 * Math.sin(t / 4) : 0;
        return (
          <g key={i} transform={`translate(${red ? shake : 0} 0)`}>
            {red && <ellipse cx={c.x} cy={top + hgt / 2} rx={190} ry={hgt / 2 + 90} fill="url(#txRedGlow)" opacity={glow * enter} />}
            <ellipse cx={c.x + 20} cy={bottom + 8} rx={w * 0.62} ry={14} fill="#000" opacity={0.3} />
            <path d={`M ${c.x + w / 2} ${top} l 30 -20 L ${c.x + w / 2 + 30} ${bottom - 20} L ${c.x + w / 2} ${bottom} Z`} fill={c.dark} />
            <path d={`M ${c.x - w / 2} ${top} l 30 -20 h ${w} l -30 20 Z`} fill={c.color} stroke={c.dark} strokeWidth={3} />
            <rect x={c.x - w / 2} y={top} width={w} height={hgt} fill={c.fill} stroke={c.dark} strokeWidth={4} />
            <rect x={c.x - w / 2 + 16} y={top + 12} width={18} height={Math.max(0, hgt - 24)} rx={9} fill="#fff" opacity={0.35} />
            {/* euros: el IRPF va en rojo */}
            <g transform={`translate(${c.x + 10} ${top - 46}) scale(${1 + (red ? 0.08 * Math.max(0, Math.sin(t / 5)) * g : 0)})`}>
              {red && <rect x={-150} y={-52} width={300} height={70} rx={20} fill="#2a0c0e" stroke={RED} strokeWidth={4} opacity={enter} />}
              <text y={0} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={red ? 52 : 50} fill={c.num} opacity={enter}>{fmtEur(lerp(c.from, c.to, g), tr.locale)} €</text>
            </g>
            <text x={c.x} y={bottom + 60} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={40} fill={c.color}>{c.label}</text>
            <g transform={`translate(${c.x} ${top + 80}) scale(${chip})`}>
              <rect x={-86} y={-36} width={172} height={72} rx={36} fill={red ? RED : "#0b1a14"} stroke="#fff" strokeWidth={4} />
              <path d={`M ${-58} 10 L -46 -10 L -34 10`} stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <text x={14} y={15} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={42} fill="#fff">+{c.pct}%</text>
            </g>
          </g>
        );
      })}
      {/* referencia: lo que sube el sueldo; lo que el IRPF sube de más, en rojo */}
      <g opacity={interpolate(t, [135, 150], [0, 1], clamp)}>
        <line x1={160} y1={ref} x2={860} y2={ref} stroke="#fff" strokeWidth={4} strokeDasharray="14 12" opacity={0.7} />
        <rect x={710 - w / 2} y={bottom - base * 1.24} width={w} height={base * 0.08} fill={RED} stroke="#fff" strokeWidth={3} opacity={0.6 + 0.4 * Math.sin(t / 3)} />
      </g>
      <g transform={`translate(500 ${ref - 205}) scale(${over})`}>
        <rect x={-210} y={-34} width={420} height={68} rx={34} fill={RED} stroke="#b8292e" strokeWidth={4} />
        <text y={13} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={32} fill="#fff">{tr.moreThanSalary}</text>
      </g>
      <text x={500} y={790} textAnchor="middle" fontFamily={body} fontWeight={600} fontSize={24} fill="#cfe3d8" opacity={0.7}>{tr.simplified}</text>
    </>
  );
};

/** Neto: lo que necesitas para comprar lo mismo vs lo que te queda → hueco rojo de −462 € (eje cortado). */
export const NetGap: React.FC<DP> = () => {
  const t = useFrame();
  const tr = useT();
  const bottom = 640, MIN = 25000, SC = 440 / 3000;
  const hOf = (v: number) => (v - MIN) * SC;
  const need = 27711, keep = 27249;
  const e1 = spring({ frame: t - 6, fps, config: { damping: 12 } });
  const e2 = spring({ frame: t - 30, fps, config: { damping: 14 } });
  const gap = spring({ frame: t - 70, fps, config: { damping: 8 } });
  const big = spring({ frame: t - 84, fps, config: { damping: 7 } });
  const count = interpolate(t, [84, 120], [0, 462], { ...clamp, easing: Easing.out(Easing.cubic) });
  const cx1 = 230, cx2 = 470, w = 170;
  const topNeed = bottom - hOf(need), topKeep = bottom - hOf(keep) * e2;
  const dash = interpolate(t, [6, 40], [1400, 0], clamp);
  const lost = spring({ frame: t - 110, fps, config: { damping: 9 } });
  const drop = interpolate(t, [118, 150], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <>
      <TaxDefs />
      <rect x={70} y={bottom} width={540} height={10} rx={5} fill="#ffffff30" />
      {/* corte de eje */}
      <path d={`M 90 ${bottom + 30} l 16 -14 l 16 14 l 16 -14 l 16 14`} stroke="#ffffff70" strokeWidth={4} fill="none" />
      {/* columna "necesitas" (contorno) */}
      <ellipse cx={cx1 + 10} cy={bottom + 8} rx={110} ry={12} fill="#000" opacity={0.25} />
      <rect x={cx1 - w / 2} y={topNeed} width={w} height={hOf(need)} rx={14} fill="#ffffff10" stroke="#ffffff" strokeWidth={5} strokeDasharray="18 12" strokeDashoffset={dash} opacity={e1} />
      <text x={cx1} y={topNeed - 26} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={42} fill="#fff" opacity={e1}>{fmtEur(need, tr.locale)} €</text>
      <text x={cx1} y={bottom + 64} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={36} fill="#fff" opacity={e1}>{tr.needed}</text>
      {/* columna "te queda" */}
      <ellipse cx={cx2 + 10} cy={bottom + 8} rx={110} ry={12} fill="#000" opacity={0.3} />
      <rect x={cx2 - w / 2} y={topKeep} width={w} height={bottom - topKeep} rx={14} fill="url(#txGreenCol)" stroke="#1f8f52" strokeWidth={5} />
      <rect x={cx2 - w / 2 + 14} y={topKeep + 12} width={16} height={Math.max(0, bottom - topKeep - 24)} rx={8} fill="#fff" opacity={0.35} />
      <text x={cx2} y={topKeep + 110} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={38} fill="#0b1a14" opacity={e2}>{fmtEur(keep, tr.locale)} €</text>
      <text x={cx2} y={bottom + 64} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={36} fill={GREEN} opacity={e2}>{tr.youKeep}</text>
      {/* hueco que falta */}
      <g opacity={gap}>
        <line x1={cx1 + w / 2} y1={topNeed} x2={cx2 + w / 2} y2={topNeed} stroke={RED} strokeWidth={4} strokeDasharray="10 8" />
        <rect x={cx2 - w / 2} y={topNeed} width={w} height={hOf(need) - hOf(keep)} rx={8} fill={RED} opacity={0.45 + 0.35 * Math.sin(t / 3)} stroke={RED} strokeWidth={4} />
      </g>
      {/* monedas que se escapan del hueco */}
      {Array.from({ length: 6 }, (_, k) => {
        const born = 80 + k * 14;
        const p = interpolate(t, [born, born + 30], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
        if (t < born || p >= 1) return null;
        return <Coin key={k} x={cx2 + w / 2 + 30 + k * 6 + p * 60} y={topNeed + 30 + p * 480} r={20} rot={p * 400} opacity={1 - p} />;
      })}
      {/* cifra grande en rojo */}
      <g transform={`translate(790 250) scale(${big})`}>
        <circle r={190} fill="url(#txRedGlow)" opacity={0.6 + 0.2 * Math.sin(t / 5)} />
        <text y={20} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={110} fill={RED} stroke="#2a0c0e" strokeWidth={4} paintOrder="stroke">−{Math.round(count)} €</text>
        <text y={80} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={36} fill="#fff">{tr.perYear}</text>
      </g>
      {/* cesta: un producto se cae */}
      <g transform={`translate(790 560) scale(${lost})`}>
        <ellipse cx={0} cy={92} rx={120} ry={14} fill="#000" opacity={0.28} />
        <circle cx={-30} cy={-10} r={30} fill="url(#sph-green)" stroke="#4c8f1f" strokeWidth={4} />
        <rect x={10} y={-50} width={44} height={66} rx={10} fill="#f4f7ff" stroke="#9aa6b8" strokeWidth={4} />
        <rect x={10} y={-30} width={44} height={20} fill="#5ec8ff" />
        <g transform={`translate(${-70 - drop * 90} ${-30 + drop * 200}) rotate(${-drop * 160})`} opacity={1 - drop * 0.6}>
          <circle r={26} fill="url(#sph-yellow)" stroke="#c98f00" strokeWidth={4} />
          <ellipse cx={-8} cy={-10} rx={7} ry={4} fill="#fff" opacity={0.8} />
        </g>
        <path d="M -100 10 L 100 10 L 82 86 L -82 86 Z" fill="url(#txBasket)" stroke="#7a4a1e" strokeWidth={5} strokeLinejoin="round" />
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={-70 + i * 35} y1={16} x2={-60 + i * 30} y2={82} stroke="#7a4a1e" strokeWidth={3} opacity={0.6} />)}
        <g transform={`translate(0 140) scale(${spring({ frame: t - 140, fps, config: { damping: 8 } })})`}>
          <rect x={-100} y={-26} width={200} height={52} rx={26} fill={RED} />
          <text y={11} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={30} fill="#fff">{tr.lessToBuy}</text>
        </g>
      </g>
    </>
  );
};
