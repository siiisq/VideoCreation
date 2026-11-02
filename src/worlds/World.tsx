import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { Theme } from "../schema";
import { useGlobalFrame } from "../sceneTime";
import { useFrame } from "../time";
import { IrpfWorld, IRPF_CAMS } from "./IrpfWorld";
import { HipotecaWorld, HIPOTECA_CAMS } from "./HipotecaWorld";
import { TaeWorld, TAE_CAMS } from "./TaeWorld";
import { DedosWorld, DEDOS_CAMS } from "./DedosWorld";

/**
 * "Mundos" a pantalla completa: un único escenario grande y una cámara que viaja entre planos (shots).
 * Cada escena del guion es un plano: la cámara va del plano anterior al actual al empezar la escena, así que
 * con transitionStyle "fade" el cambio de escena es invisible (los dos fotogramas son idénticos).
 * Las animaciones de cada plano usan `prog(...)`: valen 0 antes de su plano, 1 después, y se animan durante él.
 */
export type Cam = { x: number; y: number; w: number; rx?: number; rz?: number };
export type WorldProps = { shot: number; t: number; g: number; data: Record<string, unknown>; theme: Theme };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const MOVE = 54; // fotogramas (30 fps) que tarda la cámara en llegar al plano nuevo
// La cámara espera a que acabe el fundido entre escenas (0,4 s): si se moviera durante el fundido, se verían dos encuadres.
export const HOLD = 13;
const CAM_EASE = Easing.bezier(0.45, 0, 0.2, 1); // arranque y frenada suaves, sin tirones

/** Momento (en fotogramas de 30 fps) de la palabra `i` de data.atWords (tts.py lo convierte en data.at, en segundos). */
export const atF = (data: Record<string, unknown>, i: number, fallbackSec: number) => {
  const a = Array.isArray(data.at) ? (data.at as number[]) : [];
  return (typeof a[i] === "number" ? a[i] : fallbackSec) * 30;
};

/** Progreso 0–1 de una animación que pertenece al plano `k`. */
export const prog = (shot: number, k: number, t: number, delay = 0, dur = 30, ease = Easing.inOut(Easing.cubic)) =>
  shot > k ? 1 : shot < k ? 0 : interpolate(t, [delay, delay + dur], [0, 1], { ...clamp, easing: ease });

/** Cuánto está "en foco" un elemento visible en los planos `shots` (para atenuar lo que no importa ahora). */
export const focus = (shot: number, t: number, shots: number[]) => {
  const was = shots.includes(shot - 1), is = shots.includes(shot);
  if (was === is) return is ? 1 : 0;
  const p = interpolate(t, [HOLD, HOLD + MOVE], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return is ? p : 1 - p;
};

const worlds: Record<string, { C: React.FC<WorldProps>; cams: Cam[]; bg: string }> = {
  irpf: { C: IrpfWorld, cams: IRPF_CAMS, bg: "#0b0c0f" },
  hipoteca: { C: HipotecaWorld, cams: HIPOTECA_CAMS, bg: "#0b0c0f" },
  tae: { C: TaeWorld, cams: TAE_CAMS, bg: "#0b0c0f" },
  dedos: { C: DedosWorld, cams: DEDOS_CAMS, bg: "#0b0c0f" },
};

export const World: React.FC<{ name: string; shot: number; data: Record<string, unknown>; theme: Theme }> = ({ name, shot, data, theme }) => {
  const t = useFrame();
  const g = useGlobalFrame();
  const w = worlds[name];
  if (!w) return <AbsoluteFill style={{ color: "red", fontSize: 50 }}>Mundo desconocido: {name}</AbsoluteFill>;
  const to = w.cams[Math.min(shot, w.cams.length - 1)];
  // data.fromShot: plano del que viene la cámara (versiones cortas que se saltan planos)
  const prev = typeof data.fromShot === "number" ? (data.fromShot as number) : shot - 1;
  const from = shot === 0 ? { ...to, w: to.w * 1.3, rx: (to.rx ?? 0) + 8 } : w.cams[Math.max(0, prev)];
  const p = interpolate(t, [HOLD, HOLD + MOVE], [0, 1], { ...clamp, easing: CAM_EASE });
  const L = (a: number, b: number) => a + (b - a) * p;
  // deriva lenta continua (tiempo global → sin saltos entre escenas): la cámara nunca está quieta
  const drift = 1 + Math.sin(g / 95) * 0.012;
  const cw = L(from.w, to.w) * drift;
  const ch = (cw * 16) / 9;
  const cx = L(from.x, to.x) + Math.sin(g / 140) * 8;
  const cy = L(from.y, to.y) + Math.cos(g / 120) * 10;
  const rx = L(from.rx ?? 0, to.rx ?? 0);
  const rz = L(from.rz ?? 0, to.rz ?? 0) + Math.sin(g / 160) * 0.4;
  return (
    <AbsoluteFill style={{ background: w.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `perspective(1700px) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${1 + rx / 160})`, transformOrigin: "50% 55%" }}>
        <svg width={1080} height={1920} viewBox={`${cx - cw / 2} ${cy - ch / 2} ${cw} ${ch}`} style={{ position: "absolute", inset: 0 }}>
          <w.C shot={shot} t={t} g={g} data={data} theme={theme} />
        </svg>
      </div>
      {/* viñeteado: centra la mirada y da profundidad */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
