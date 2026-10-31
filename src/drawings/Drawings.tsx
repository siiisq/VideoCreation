import { ANIM_FPS, useFrame } from "../time";
import React from "react";
import { interpolate, spring, Easing } from "remotion";
import { body, display } from "../fonts";
import { Theme } from "../schema";
import { Bean, COFFEE, Counter, Cup, Defs, Label, Molecule, WATER } from "./parts";
import { Mascot, Mood } from "./Mascot";

type D = Record<string, unknown>;
type DP = { data: D; theme: Theme };
const str = (d: D, k: string, def = "") => (typeof d[k] === "string" ? (d[k] as string) : def);
const num = (d: D, k: string, def = 0) => (typeof d[k] === "number" ? (d[k] as number) : def);
const bool = (d: D, k: string) => d[k] === true;

const useFill = (start = 0, dur = 40) => {
  const frame = useFrame();
  return interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
};

/** Taza pequeña (espresso) vs taza grande (filtro). Opcional: moléculas, mg, interrogantes. */
const CupsVs: React.FC<DP> = ({ data, theme }) => {
  const frame = useFrame();
  const fill = useFill(4, 36);
  const q = bool(data, "question");
  const showMg = typeof data.leftMg === "number";
  return (
    <>
      <Cup id="l" x={270} y={600} w={230} h={170} fill={fill} molecules={num(data, "leftMolecules")} moleculeColor={theme.accent} moleculeDelay={30} />
      <Cup id="r" x={690} y={600} w={330} h={430} fill={fill} liquid={str(data, "rightLiquid") === "light" ? "#8a5a35" : COFFEE} molecules={num(data, "rightMolecules")} moleculeColor={theme.accent} moleculeDelay={40} />
      <Label x={270} y={700} text={str(data, "leftLabel", "Espresso")} color={theme.text} font={display} delay={10} />
      <Label x={690} y={700} text={str(data, "rightLabel", "Café de filtro")} color={theme.text} font={display} delay={16} />
      {str(data, "leftSub") && <Label x={270} y={752} text={str(data, "leftSub")} color={theme.text} size={32} weight={600} font={body} delay={14} />}
      {str(data, "rightSub") && <Label x={690} y={752} text={str(data, "rightSub")} color={theme.text} size={32} weight={600} font={body} delay={20} />}
      {showMg && (
        <>
          <Counter x={270} y={330} to={num(data, "leftMg")} suffix=" mg" color={theme.accent2} size={80} delay={30} font={display} />
          <Counter x={690} y={110} to={num(data, "rightMg")} suffix=" mg" color={theme.accent} size={96} delay={55} font={display} />
        </>
      )}
      {q && [0, 1, 2].map((i) => {
        const s = spring({ frame: frame - 20 - i * 8, fps: 30, config: { damping: 7 } });
        const px = [140, 480, 880][i];
        const py = [260, 200, 130][i];
        return <text key={i} x={px} y={py + Math.sin((frame + i * 20) / 8) * 12} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={110} fill={i === 1 ? theme.accent2 : theme.accent} transform={`rotate(${(i - 1) * 14} ${px} ${py})`} opacity={s}>?</text>;
      })}
    </>
  );
};

/** Leyenda: molécula = cafeína. */
const Legend: React.FC<{ theme: Theme; y?: number; delay?: number }> = ({ theme, y = 60, delay = 20 }) => (
  <g>
    <Molecule x={340} y={y} size={20} color={theme.accent} delay={delay} float={2} />
    <Label x={500} y={y + 16} text="= cafeína" color={theme.accent} size={46} font={display} delay={delay + 4} />
  </g>
);

const Concentration: React.FC<DP> = ({ data, theme }) => (
  <>
    <Legend theme={theme} />
    <CupsVs data={data} theme={theme} />
  </>
);

/** Goteo: agua cae sobre el café molido en un filtro y arrastra cafeína hasta la jarra. */
const Filter: React.FC<DP> = ({ theme }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const fill = useFill(20, 200);
  const enter = spring({ frame, fps, config: { damping: 14 } });
  // gotas de agua desde la tetera
  const drops = Array.from({ length: 8 }, (_, i) => {
    const t = ((frame + i * 9) % 36) / 36;
    return <ellipse key={i} cx={500 + Math.sin(i * 3) * 30} cy={110 + t * 150} rx={9} ry={14} fill={WATER} opacity={frame > 8 ? 1 - t * 0.3 : 0} />;
  });
  // moléculas que viajan del café molido a la jarra
  const travellers = Array.from({ length: 6 }, (_, i) => {
    const start = 25 + i * 22;
    const p = interpolate(frame, [start, start + 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const settleX = 430 + (i % 3) * 70;
    const settleY = 650 - Math.floor(i / 3) * 40;
    return frame > start ? <Molecule key={i} x={interpolate(p, [0, 1], [500, settleX])} y={interpolate(p, [0, 1], [330, settleY])} size={16} color={theme.accent} delay={start} float={3} /> : null;
  });
  const grounds = Array.from({ length: 40 }, (_, i) => {
    const r1 = ((i * 7919) % 101) / 101;
    const r2 = ((i * 104729) % 97) / 97;
    const yy = 290 + r2 * 60;
    const half = interpolate(yy, [280, 360], [150, 55]);
    return <circle key={i} cx={500 - half + r1 * half * 2} cy={yy} r={7} fill={i % 3 ? "#4a2611" : "#6b3a1c"} />;
  });
  return (
    <g opacity={enter} transform={`translate(0 ${(1 - enter) * 60})`}>
      {/* tetera */}
      <g transform={`rotate(${interpolate(frame, [0, 15], [0, -18], { extrapolateRight: "clamp" })} 360 80)`}>
        <path d="M 240 20 h 180 q 20 0 20 20 v 90 q 0 30 -30 30 h -160 q -30 0 -30 -30 v -90 q 0 -20 20 -20 z" fill="#c9d6df" stroke="#8fa3b1" strokeWidth={6} />
        <path d="M 440 60 q 50 0 70 50" stroke="#c9d6df" strokeWidth={22} fill="none" strokeLinecap="round" />
        <path d="M 225 50 q -50 20 0 80" stroke="#8fa3b1" strokeWidth={14} fill="none" strokeLinecap="round" />
      </g>
      {drops}
      {/* filtro cónico */}
      <path d="M 330 270 L 670 270 L 560 400 L 440 400 Z" fill="#f2e6d0" stroke="#d1bf9c" strokeWidth={6} />
      {grounds}
      {/* goteo al fondo */}
      {Array.from({ length: 3 }, (_, i) => {
        const t = ((frame + i * 12) % 36) / 36;
        return <ellipse key={i} cx={500} cy={410 + t * 120} rx={7} ry={11} fill={COFFEE} />;
      })}
      {/* jarra */}
      <Cup id="jar" x={500} y={760} w={360} h={330} fill={fill} molecules={0} steam={false} />
      {travellers}
      <Label x={830} y={330} text="agua" color={WATER} font={display} size={48} delay={10} />
      <Label x={830} y={385} text="+ tiempo" color={theme.accent} font={display} size={48} delay={30} />
    </g>
  );
};

/** Granos que caen en dos montones (gramos de café). */
const Beans: React.FC<DP> = ({ data, theme }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const pile = (cx: number, n: number, delay: number) =>
    Array.from({ length: n }, (_, i) => {
      const s = spring({ frame: frame - delay - i * 3, fps, config: { damping: 11, stiffness: 160 } });
      const row = Math.floor(i / 4);
      const col = i % 4;
      const tx = cx - 135 + col * 90 + (row % 2) * 30;
      const ty = 550 - row * 85;
      return <Bean key={i} x={tx} y={interpolate(s, [0, 1], [-100, ty])} size={46} rot={(i * 47) % 360} />;
    });
  const ln = num(data, "leftBeans", 4);
  const rn = num(data, "rightBeans", 8);
  return (
    <>
      <Defs />
      {pile(260, ln, 10)}
      {pile(740, rn, 30)}
      <rect x={80} y={610} width={360} height={22} rx={11} fill="#ffffff33" />
      <rect x={560} y={610} width={360} height={22} rx={11} fill="#ffffff33" />
      <Counter x={260} y={720} to={num(data, "leftGrams", 8)} prefix="≈ " suffix=" g" color={theme.accent2} size={78} delay={20} font={display} />
      <Counter x={740} y={720} to={num(data, "rightGrams", 15)} prefix="≈ " suffix=" g" color={theme.accent} size={78} delay={45} font={display} />
      <Label x={260} y={790} text={str(data, "leftLabel", "Espresso")} color={theme.text} size={40} font={display} delay={14} />
      <Label x={740} y={790} text={str(data, "rightLabel", "Filtro")} color={theme.text} size={40} font={display} delay={34} />
    </>
  );
};

/** Americano: espresso + agua = mismas moléculas, más repartidas. */
const Americano: React.FC<DP> = ({ data, theme }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const n = num(data, "molecules", 6);
  const pour = interpolate(frame, [40, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eq = spring({ frame: frame - 120, fps, config: { damping: 8 } });
  const plus = spring({ frame: frame - 20, fps, config: { damping: 8 } });
  return (
    <>
      <Cup id="esp" x={170} y={520} w={200} h={150} fill={1} molecules={n} moleculeColor={theme.accent} moleculeDelay={6} steam={false} />
      <text x={360} y={470} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={110} fill={theme.text} transform={`translate(360 440) scale(${plus}) translate(-360 -440)`}>+</text>
      {/* jarra de agua inclinándose */}
      <g transform={`rotate(${interpolate(pour, [0, 0.15, 0.9, 1], [0, -35, -35, 0])} 520 420)`}>
        <path d="M 450 300 h 140 l -10 220 q -2 20 -22 20 h -76 q -20 0 -22 -20 z" fill={WATER} opacity={0.35} stroke={WATER} strokeWidth={6} />
        <rect x={455} y={interpolate(pour, [0, 1], [340, 480])} width={130} height={interpolate(pour, [0, 1], [180, 40])} fill={WATER} opacity={0.6} />
      </g>
      {pour > 0.15 && pour < 0.95 && <path d={`M 440 330 Q 520 330 760 ${330 + 40}`} stroke={WATER} strokeWidth={14} fill="none" strokeLinecap="round" strokeDasharray="30 18" strokeDashoffset={-frame * 6} />}
      <Cup id="ame" x={780} y={620} w={300} h={380} fill={interpolate(pour, [0, 1], [0.3, 1])} liquid="#7b4a28" molecules={n} moleculeColor={theme.accent} moleculeDelay={110} />
      <g opacity={eq} transform={`translate(500 760) scale(${eq}) translate(-500 -760)`}>
        <rect x={180} y={700} width={640} height={100} rx={50} fill={theme.accent} />
        <text x={500} y={770} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={52} fill="#1a0d05">{str(data, "equal", `${n} = ${n} ¡misma cafeína!`)}</text>
      </g>
    </>
  );
};

/** Mascota grande sola, con bocadillo. */
const MascotOnly: React.FC<DP> = ({ data, theme }) => (
  <>
    <Defs />
    <Mascot x={500} y={460} size={230} mood={(str(data, "mood", "happy") as Mood)} say={str(data, "say") || undefined} accent={theme.accent} />
  </>
);

/** Cerebro/persona con energía: la cafeína llega al cuerpo. */
const Energy: React.FC<DP> = ({ data, theme }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const bolts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + frame / 40;
    const s = spring({ frame: frame - 20 - i * 5, fps, config: { damping: 9 } });
    const r = 300;
    const bx = 500 + Math.cos(a) * r;
    const by = 420 + Math.sin(a) * r * 0.8;
    return <path key={i} d="M 0 -50 L -22 6 H 4 L -10 50 L 26 -12 H 0 Z" fill={i % 2 ? theme.accent : theme.accent2} transform={`translate(${bx} ${by}) scale(${s * 1.4})`} />;
  });
  return (
    <>
      <Defs />
      {bolts}
      <Mascot x={500} y={430} size={190} mood={(str(data, "mood", "surprised") as Mood)} say={str(data, "say") || undefined} accent={theme.accent} />
    </>
  );
};

const registry: Record<string, React.FC<DP>> = {
  "cups-vs": CupsVs,
  concentration: Concentration,
  filter: Filter,
  beans: Beans,
  americano: Americano,
  mascot: MascotOnly,
  energy: Energy,
};
export const DRAWINGS = Object.keys(registry);

export const Drawing: React.FC<{ name: string; data: D; theme: Theme; mascot?: { mood?: Mood; say?: string; side?: "left" | "right" } }> = ({ name, data, theme, mascot }) => {
  const C = registry[name];
  return (
    <svg viewBox="0 0 1000 820" style={{ width: "100%", overflow: "visible" }}>
      <Defs />
      {C ? <C data={data} theme={theme} /> : <text x={500} y={400} textAnchor="middle" fill="red" fontSize={40}>Dibujo desconocido: {name}</text>}
      {mascot && <Mascot x={mascot.side === "left" ? 120 : 880} y={150} size={90} mood={mascot.mood} say={mascot.say} delay={25} accent={theme.accent} flip={mascot.side !== "left"} />}
    </svg>
  );
};
