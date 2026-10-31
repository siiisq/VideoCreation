import React from "react";
import { interpolate, spring, Easing } from "remotion";
import { RichText } from "../components/RichText";
import { body, display } from "../fonts";
import { useT } from "../i18n";
import { Scene, Theme } from "../schema";
import { ANIM_FPS, useFrame } from "../time";
import { Stage, Title } from "./common";

type P<T extends Scene["type"]> = { scene: Extract<Scene, { type: T }>; theme: Theme };
const fps = ANIM_FPS;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.out(Easing.cubic);
export const palette = (t: Theme) => [t.accent, t.accent2, "#f2c14e", "#9fb8d0", "#7be0b0", "#c48bff"];

const fmt = (v: number, decimals = 0, locale = "en-US") => v.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const Caption: React.FC<{ text?: string; theme: Theme; delay?: number }> = ({ text, theme, delay = 30 }) =>
  text ? <RichText text={text} accent={theme.accent} delay={delay} perWord={2} style={{ fontWeight: 700, fontSize: 46, lineHeight: 1.25, color: theme.text }} /> : null;

/* ---------- Panel de KPIs: fichas que cuentan hacia arriba con chip de variación ---------- */
export const Kpis: React.FC<P<"kpis">> = ({ scene, theme }) => {
  const f = useFrame();
  const t = useT();
  const cols = scene.tiles.length <= 2 ? 1 : 2;
  return (
    <Stage gap={34}>
      {scene.title && <Title theme={theme}>{scene.title}</Title>}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 26, width: "100%" }}>
        {scene.tiles.map((tile, i) => {
          const d = 8 + i * 10;
          const s = spring({ frame: f - d, fps, config: { damping: 14, stiffness: 140 } });
          const p = interpolate(f, [d, d + 45], [0, 1], { ...clamp, easing: ease });
          const chip = spring({ frame: f - d - 45, fps, config: { damping: 8 } });
          const color = palette(theme)[i % 2];
          return (
            <div key={i} style={{ position: "relative", overflow: "hidden", borderRadius: 30, padding: "30px 30px 26px", background: "rgba(255,255,255,0.07)", border: "2px solid rgba(255,255,255,0.12)", opacity: s, transform: `translateY(${(1 - s) * 60}px) scale(${0.9 + 0.1 * s})`, textAlign: "left" }}>
              <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, width: `${p * 100}%`, background: color }} />
              <div style={{ fontFamily: display, fontWeight: 900, fontSize: cols === 1 ? 120 : 88, lineHeight: 1, color, whiteSpace: "nowrap" }}>
                {tile.prefix}{fmt(tile.value * p, tile.decimals, t.locale)}{tile.suffix}
              </div>
              <div style={{ fontFamily: body, fontWeight: 700, fontSize: 34, color: theme.text, marginTop: 10, opacity: 0.9 }}>{tile.label}</div>
              {tile.delta && (
                <div style={{ display: "inline-block", marginTop: 16, padding: "6px 18px", borderRadius: 30, background: color, color: theme.bg1, fontFamily: display, fontWeight: 900, fontSize: 30, transform: `scale(${chip})`, transformOrigin: "left center" }}>{tile.delta}</div>
              )}
            </div>
          );
        })}
      </div>
      <Caption text={scene.text} theme={theme} delay={60} />
    </Stage>
  );
};

/* ---------- Waffle: N cuadrados, K se iluminan en ola ---------- */
export const Waffle: React.FC<P<"waffle">> = ({ scene, theme }) => {
  const f = useFrame();
  const cols = Math.ceil(Math.sqrt(scene.total * 1.0));
  const size = Math.min(110, 860 / cols);
  const pct = interpolate(f, [30, 80], [0, scene.highlight / scene.total], { ...clamp, easing: ease });
  return (
    <Stage gap={36}>
      {scene.title && <Title theme={theme}>{scene.title}</Title>}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap: size * 0.14 }}>
        {Array.from({ length: scene.total }, (_, i) => {
          const r = Math.floor(i / cols), c = i % cols;
          const s = spring({ frame: f - 4 - (r + c) * 1.5, fps, config: { damping: 12 } });
          const on = i < scene.highlight;
          const lit = interpolate(f, [30 + (r + c) * 2, 40 + (r + c) * 2], [0, 1], clamp);
          return <div key={i} style={{ width: size, height: size, borderRadius: size * 0.22, transform: `scale(${s})`, background: on ? `color-mix(in srgb, ${theme.accent} ${lit * 100}%, rgba(255,255,255,0.12))` : "rgba(255,255,255,0.12)", boxShadow: on && lit > 0.9 ? `0 0 ${size * 0.3}px ${theme.accent}88` : "none" }} />;
        })}
      </div>
      <div style={{ fontFamily: display, fontWeight: 900, fontSize: 150, lineHeight: 1, color: theme.accent }}>{fmt(pct * 100, scene.decimals)}%</div>
      <Caption text={scene.text} theme={theme} delay={40} />
    </Stage>
  );
};

/* ---------- Dumbbell: antes → después por fila, con % de crecimiento ---------- */
export const Dumbbell: React.FC<P<"dumbbell">> = ({ scene, theme }) => {
  const f = useFrame();
  const t = useT();
  const max = Math.max(...scene.rows.flatMap((r) => [r.from, r.to]));
  const W = 720;
  return (
    <Stage gap={30}>
      {scene.title && <Title theme={theme}>{scene.title}</Title>}
      <div style={{ display: "flex", gap: 30, fontFamily: body, fontWeight: 700, fontSize: 30, color: theme.text }}>
        <span><span style={{ display: "inline-block", width: 22, height: 22, borderRadius: 11, background: "#9fb8d0", marginRight: 10 }} />{scene.fromLabel}</span>
        <span><span style={{ display: "inline-block", width: 22, height: 22, borderRadius: 11, background: theme.accent, marginRight: 10 }} />{scene.toLabel}</span>
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 34 }}>
        {scene.rows.map((r, i) => {
          const d = 10 + i * 7;
          const enter = spring({ frame: f - d, fps, config: { damping: 15 } });
          const grow = interpolate(f, [d + 12, d + 42], [0, 1], { ...clamp, easing: ease });
          const x0 = (r.from / max) * W, x1 = (r.to / max) * W;
          const xc = x0 + (x1 - x0) * grow;
          const g = r.from ? (r.to - r.from) / r.from : 0;
          const badge = spring({ frame: f - d - 42, fps, config: { damping: 8 } });
          return (
            <div key={i} style={{ opacity: enter, transform: `translateX(${(1 - enter) * -80}px)`, textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: body, fontWeight: 700, fontSize: 42, color: theme.text, marginBottom: 10 }}>
                <span>{r.label}</span>
                <span style={{ fontFamily: display, fontWeight: 900, color: theme.accent }}>{fmt(r.from, 0, t.locale)} → {fmt(r.from + (r.to - r.from) * grow, 0, t.locale)}</span>
              </div>
              <div style={{ position: "relative", height: 34 }}>
                <div style={{ position: "absolute", top: 15, left: 0, width: W + 20, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2 }} />
                <div style={{ position: "absolute", top: 9, left: x0, width: Math.max(0, xc - x0), height: 16, borderRadius: 8, background: `linear-gradient(90deg, #9fb8d0, ${theme.accent})` }} />
                <div style={{ position: "absolute", top: 3, left: x0 - 14, width: 28, height: 28, borderRadius: 14, background: "#9fb8d0" }} />
                <div style={{ position: "absolute", top: 0, left: xc - 17, width: 34, height: 34, borderRadius: 17, background: theme.accent, boxShadow: `0 0 20px ${theme.accent}` }} />
                {scene.showGrowth && (
                  <div style={{ position: "absolute", top: -4, right: 0, padding: "2px 14px", borderRadius: 20, background: g > 0 ? theme.accent2 : "rgba(255,255,255,0.2)", color: theme.bg1, fontFamily: display, fontWeight: 900, fontSize: 28, transform: `scale(${badge})` }}>
                    {g > 0 ? `+${fmt(g * 100, 0)}%` : "="}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Caption text={scene.text} theme={theme} delay={60} />
    </Stage>
  );
};

/* ---------- Ejes compartidos para gráficos de líneas y columnas ---------- */
const niceMax = (v: number) => {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil((v * 1.1) / p) * p;
};
const unitFmt = (v: number, unit: string, decimals: number, locale: string) =>
  unit === "M" ? `${fmt(v / 1e6, decimals, locale)}M` : unit === "k" ? `${fmt(v / 1e3, decimals, locale)}k` : unit === "%" ? `${fmt(v * 100, decimals, locale)}%` : fmt(v, decimals, locale);

const Legend: React.FC<{ names: string[]; theme: Theme }> = ({ names, theme }) => (
  <div style={{ display: "flex", gap: 34, justifyContent: "center", fontFamily: body, fontWeight: 700, fontSize: 32, color: theme.text }}>
    {names.map((n, i) => <span key={n}><span style={{ display: "inline-block", width: 34, height: 10, borderRadius: 5, background: i === names.length - 1 ? theme.accent : "#9fb8d0", marginRight: 12, verticalAlign: "middle" }} />{n}</span>)}
  </div>
);

/* ---------- Gráfico de líneas que se dibuja, con área y valor que sigue la punta ---------- */
export const LineChart: React.FC<P<"linechart">> = ({ scene, theme }) => {
  const f = useFrame();
  const t = useT();
  const W = 900, H = 620, L = 70, B = 60, T = 40;
  const all = scene.series.flatMap((s) => s.values);
  const max = niceMax(Math.max(...all));
  const n = scene.categories.length;
  const x = (i: number) => L + (i * (W - L - 20)) / (n - 1);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const grid = spring({ frame: f, fps, config: { damping: 18 } });
  return (
    <Stage gap={24}>
      {scene.title && <Title theme={theme}>{scene.title}</Title>}
      {scene.series.length > 1 && <Legend names={scene.series.map((s) => s.name)} theme={theme} />}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", overflow: "visible" }}>
        <defs>
          {scene.series.map((_, si) => (
            <linearGradient key={si} id={`area${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={si === scene.series.length - 1 ? theme.accent : "#9fb8d0"} stopOpacity={0.45} />
              <stop offset="100%" stopColor={si === scene.series.length - 1 ? theme.accent : "#9fb8d0"} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g} opacity={grid}>
            <line x1={L} x2={W - 10} y1={y(max * g)} y2={y(max * g)} stroke="#ffffff22" strokeWidth={2} strokeDasharray="6 8" />
            <text x={L - 12} y={y(max * g) + 9} textAnchor="end" fontFamily={body} fontWeight={600} fontSize={24} fill="#ffffff88">{unitFmt(max * g, scene.unit, max * g < 10 && scene.unit !== "M" ? 1 : scene.unit === "M" ? 1 : 0, t.locale)}</text>
          </g>
        ))}
        {scene.categories.map((c, i) => (
          <text key={c} x={x(i)} y={H - 18} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={24} fill="#ffffffaa" opacity={grid}>{c}</text>
        ))}
        {scene.series.map((s, si) => {
          const last = si === scene.series.length - 1;
          const color = last ? theme.accent : "#9fb8d0";
          const start = 12 + si * 25;
          const p = interpolate(f, [start, start + 70], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
          const head = p * (n - 1);
          const k = Math.floor(head), fr = head - k;
          const hx = k >= n - 1 ? x(n - 1) : x(k) + (x(k + 1) - x(k)) * fr;
          const hv = k >= n - 1 ? s.values[n - 1] : s.values[k] + (s.values[k + 1] - s.values[k]) * fr;
          const pts = s.values.slice(0, k + 1).map((v, i) => `${x(i)},${y(v)}`);
          pts.push(`${hx},${y(hv)}`);
          const line = `M ${pts.join(" L ")}`;
          const area = `${line} L ${hx},${y(0)} L ${x(0)},${y(0)} Z`;
          return (
            <g key={si}>
              <path d={area} fill={`url(#area${si})`} />
              <path d={line} fill="none" stroke={color} strokeWidth={last ? 8 : 5} strokeLinejoin="round" strokeLinecap="round" style={{ filter: last ? `drop-shadow(0 0 10px ${color})` : undefined }} />
              {s.values.slice(0, k + 1).map((v, i) => {
                const ps = spring({ frame: f - start - (i / (n - 1)) * 70, fps, config: { damping: 9 } });
                return <circle key={i} cx={x(i)} cy={y(v)} r={(last ? 9 : 6) * ps} fill={theme.bg1} stroke={color} strokeWidth={4} />;
              })}
              {p > 0 && p < 1.01 && last && (
                <g transform={`translate(${hx} ${y(hv) - 40})`}>
                  <rect x={-80} y={-34} width={160} height={50} rx={25} fill={color} />
                  <text y={2} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={30} fill={theme.bg1}>{unitFmt(hv, scene.unit, scene.decimals, t.locale)}</text>
                </g>
              )}
            </g>
          );
        })}
        {scene.annotate && (() => {
          const a = scene.annotate;
          const s = spring({ frame: f - 95, fps, config: { damping: 10 } });
          const last = scene.series[scene.series.length - 1];
          return (
            <g opacity={s}>
              <circle cx={x(a.index)} cy={y(last.values[a.index])} r={26 * s} fill="none" stroke={theme.accent2} strokeWidth={4} />
              <text x={Math.min(W - 160, Math.max(L + 120, x(a.index)))} y={y(last.values[a.index]) - 50} textAnchor="middle" fontFamily={body} fontWeight={800} fontSize={28} fill={theme.accent2}>{a.text}</text>
            </g>
          );
        })()}
      </svg>
      <Caption text={scene.text} theme={theme} delay={70} />
    </Stage>
  );
};

/* ---------- Columnas agrupadas por categoría (crecen escalonadas) ---------- */
export const Columns: React.FC<P<"columns">> = ({ scene, theme }) => {
  const f = useFrame();
  const t = useT();
  const W = 900, H = 560, B = 50, T = 20;
  const max = niceMax(Math.max(...scene.series.flatMap((s) => s.values)));
  const n = scene.categories.length, ns = scene.series.length;
  const slot = W / n, bw = (slot * 0.78) / ns;
  return (
    <Stage gap={24}>
      {scene.title && <Title theme={theme}>{scene.title}</Title>}
      {ns > 1 && <Legend names={scene.series.map((s) => s.name)} theme={theme} />}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", overflow: "visible" }}>
        <line x1={0} x2={W} y1={H - B} y2={H - B} stroke="#ffffff44" strokeWidth={3} />
        {scene.categories.map((c, i) => (
          <g key={c}>
            {scene.series.map((s, si) => {
              const d = 8 + i * 4 + si * 2;
              const p = spring({ frame: f - d, fps, config: { damping: 13, stiffness: 110 } });
              const h = (s.values[i] / max) * (H - B - T) * p;
              const last = si === ns - 1;
              return <rect key={si} x={i * slot + slot * 0.11 + si * bw} y={H - B - h} width={bw - 4} height={h} rx={6} fill={last ? theme.accent : "#9fb8d0"} opacity={last ? 1 : 0.75} />;
            })}
            <text x={i * slot + slot / 2} y={H - 12} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={24} fill="#ffffffaa">{c}</text>
          </g>
        ))}
      </svg>
      {scene.totals && (
        <div style={{ display: "flex", gap: 40, alignItems: "baseline", justifyContent: "center" }}>
          {scene.totals.map((tot, i) => {
            const p = interpolate(f, [40 + i * 15, 90 + i * 15], [0, 1], { ...clamp, easing: ease });
            const last = i === scene.totals!.length - 1;
            return (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: display, fontWeight: 900, fontSize: last ? 100 : 70, lineHeight: 1, color: last ? theme.accent : "#9fb8d0" }}>{fmt(tot.value * p, 0, t.locale)}</div>
                <div style={{ fontFamily: body, fontWeight: 700, fontSize: 30, color: theme.text, marginTop: 6 }}>{tot.label}</div>
              </div>
            );
          })}
        </div>
      )}
      <Caption text={scene.text} theme={theme} delay={70} />
    </Stage>
  );
};

/* ---------- Donut: segmentos que se barren en orden ---------- */
export const Donut: React.FC<P<"donut">> = ({ scene, theme }) => {
  const f = useFrame();
  const t = useT();
  const total = scene.segments.reduce((a, s) => a + s.value, 0);
  const R = 230, SW = 90, C = 2 * Math.PI * R;
  const cols = palette(theme);
  const p = interpolate(f, [6, 70], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  let acc = 0;
  const rot = interpolate(f, [0, 70], [-160, -90], { ...clamp, easing: ease });
  const center = spring({ frame: f - 40, fps, config: { damping: 10 } });
  return (
    <Stage gap={30}>
      {scene.title && <Title theme={theme}>{scene.title}</Title>}
      <svg viewBox="-300 -300 600 600" style={{ width: 640, overflow: "visible" }}>
        <circle r={R} fill="none" stroke="#ffffff14" strokeWidth={SW} />
        <g transform={`rotate(${rot})`}>
          {scene.segments.map((s, i) => {
            const frac = s.value / total;
            const shown = Math.max(0, Math.min(frac, p - acc));
            const off = acc;
            acc += frac;
            return <circle key={i} r={R} fill="none" stroke={cols[i % cols.length]} strokeWidth={SW} strokeDasharray={`${Math.max(0, shown * C - 4)} ${C}`} strokeDashoffset={-off * C} />;
          })}
        </g>
        <g transform={`scale(${center})`}>
          <text y={20} textAnchor="middle" fontFamily={display} fontWeight={900} fontSize={110} fill={theme.text}>{scene.center?.value ?? ""}</text>
          <text y={80} textAnchor="middle" fontFamily={body} fontWeight={700} fontSize={34} fill={theme.text} opacity={0.8}>{scene.center?.label ?? ""}</text>
        </g>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
        {scene.segments.map((s, i) => {
          const sp = spring({ frame: f - 20 - i * 8, fps, config: { damping: 12 } });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: body, fontWeight: 700, fontSize: 36, color: theme.text, opacity: sp, transform: `translateX(${(1 - sp) * 60}px)` }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: cols[i % cols.length], flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: "left" }}>{s.label}</span>
              <span style={{ fontFamily: display, fontWeight: 900, color: cols[i % cols.length] }}>{fmt(s.value, scene.decimals, t.locale)}{scene.unit}</span>
            </div>
          );
        })}
      </div>
      <Caption text={scene.text} theme={theme} delay={60} />
    </Stage>
  );
};

/* ---------- Barras múltiples: varias métricas (0–1) por fila ---------- */
export const MultiBars: React.FC<P<"multibars">> = ({ scene, theme }) => {
  const f = useFrame();
  const cols = [theme.accent, theme.accent2, "#f2c14e"];
  return (
    <Stage gap={28}>
      {scene.title && <Title theme={theme}>{scene.title}</Title>}
      <div style={{ display: "flex", gap: 26, justifyContent: "center", flexWrap: "wrap", fontFamily: body, fontWeight: 700, fontSize: 28, color: theme.text }}>
        {scene.metrics.map((m, i) => <span key={m}><span style={{ display: "inline-block", width: 22, height: 22, borderRadius: 6, background: cols[i], marginRight: 10, verticalAlign: "middle" }} />{m}</span>)}
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 30 }}>
        {scene.rows.map((r, i) => {
          const en = spring({ frame: f - 6 - i * 12, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{ textAlign: "left", opacity: en }}>
              <div style={{ fontFamily: display, fontWeight: 800, fontSize: 38, color: theme.text, marginBottom: 10 }}>{r.label}</div>
              {r.values.map((v, j) => {
                const p = interpolate(f, [14 + i * 12 + j * 5, 50 + i * 12 + j * 5], [0, 1], { ...clamp, easing: ease });
                return (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
                    <div style={{ flex: 1, height: 30, borderRadius: 15, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div style={{ width: `${Math.max(0, v) * 100 * p}%`, height: "100%", borderRadius: 15, background: cols[j], boxShadow: `0 0 18px ${cols[j]}66` }} />
                    </div>
                    <div style={{ width: 120, textAlign: "right", fontFamily: display, fontWeight: 900, fontSize: 32, color: cols[j] }}>−{Math.round(v * 100 * p)}%</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <Caption text={scene.text} theme={theme} delay={70} />
    </Stage>
  );
};
