import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { body, display } from "../fonts";
import { useT } from "../i18n";
import { ANIM_FPS } from "../time";

/**
 * Hoja de compartir del cierre (opción D aprobada por el usuario): "Mándaselo a quien… / <línea dorada>" + 4 contactos
 * genéricos; uno se selecciona con ✓ y sale un avión de papel. UNA sola vez por vídeo, solo en el cierre.
 * `t` = fotograma de la escena (30 fps), `at` = fotograma en que aparece. Ocupa 600 × 360 unidades centradas en (x, y):
 * deja libre esa zona (atenúa lo que haya detrás) y que aparezca después de la tarjeta de "Seguir" de la capa.
 */
const fps = ANIM_FPS;
const GOLD = "#f2b84b", INK = "#e9ecf1", MUTED = "#8b93a1", PANEL = "#14161b";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const COLORS = ["#3a8dff", "#e2565a", "#3ddc84", "#9b6bff"];

export const ShareSheet: React.FC<{ x: number; y: number; t: number; at: number; line1: string; line2: string; scale?: number }> = ({ x, y, t, at, line1, line2, scale = 1 }) => {
  const tr = useT() as unknown as Record<string, string>;
  const names = [tr.shC1, tr.shC2, tr.shC3, tr.shC4];
  const up = spring({ frame: t - at, fps, config: { damping: 14 } });
  if (up <= 0.001) return null;
  const pick = 2;
  const check = spring({ frame: t - at - 26, fps, config: { damping: 8 } });
  const fly = interpolate(t, [at + 34, at + 56], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const W = 600, H = 360;
  return (
    <g transform={`translate(${x} ${y + (1 - up) * 160}) scale(${scale})`} opacity={Math.min(1, up * 1.4)}>
      <rect x={-W / 2 + 12} y={-H / 2 + 20} width={W} height={H} rx={40} fill="#000" opacity={0.5} />
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={40} fill={PANEL} stroke="#ffffff30" strokeWidth={3} />
      <rect x={-W / 2 + 14} y={-H / 2 + 10} width={W - 28} height={50} rx={24} fill="#fff" opacity={0.05} />
      <rect x={-50} y={-H / 2 + 18} width={100} height={10} rx={5} fill="#ffffff45" />
      <text x={0} y={-H / 2 + 92} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={34} fill={INK}>{line1}</text>
      <text x={0} y={-H / 2 + 134} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={34} fill={GOLD}>{line2}</text>
      {names.map((n, i) => {
        const cx = -W / 2 + 90 + i * 140, cy = 60;
        const s = spring({ frame: t - at - 6 - i * 4, fps, config: { damping: 10 } });
        const sel = i === pick;
        return (
          <g key={i} transform={`translate(${cx} ${cy}) scale(${s * (sel ? 1 + 0.06 * check : 1)})`}>
            <circle r={52} fill={COLORS[i]} />
            <ellipse cx={-16} cy={-22} rx={20} ry={11} fill="#fff" opacity={0.3} />
            <text y={15} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={42} fill={i === 2 ? "#0b0c0f" : "#fff"}>{n.charAt(0)}</text>
            <text y={92} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={24} fill={sel ? INK : MUTED}>{n}</text>
            {sel && (
              <g opacity={check}>
                <circle r={62} fill="none" stroke={GOLD} strokeWidth={6} />
                <g transform={`translate(40 -40) scale(${check})`}>
                  <circle r={20} fill={GOLD} />
                  <path d="M -9 0 l 6 7 l 12 -14" stroke="#1a1406" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </g>
            )}
          </g>
        );
      })}
      {/* avión de papel que sale del contacto elegido */}
      {fly > 0 && fly < 1 && (
        <g transform={`translate(${-W / 2 + 90 + pick * 140 + fly * 260} ${60 - fly * 330 - Math.sin(fly * Math.PI) * 40}) rotate(-30)`} opacity={1 - Math.max(0, fly - 0.7) * 3}>
          <path d="M -26 4 L 28 -20 L 10 26 L 2 10 Z" fill={GOLD} stroke="#b37a12" strokeWidth={3} strokeLinejoin="round" />
        </g>
      )}
      {fly > 0 && <path d={`M ${-W / 2 + 90 + pick * 140} 60 q 120 -60 ${260 * Math.min(1, fly)} ${-330 * Math.min(1, fly)}`} fill="none" stroke={GOLD} strokeWidth={3} strokeDasharray="8 10" opacity={0.5 * (1 - Math.max(0, fly - 0.8) * 5)} />}
    </g>
  );
};
