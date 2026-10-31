import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { linearTiming, TransitionPresentation, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide as slideT } from "@remotion/transitions/slide";
import { Background } from "../components/Background";
import { RichText } from "../components/RichText";
import { body, display } from "../fonts";
import { LangProvider } from "../i18n";
import { Theme } from "../schema";
import { ANIM_FPS, useFrame } from "../time";
import { FORMATS, Presentation as PresT, presentationSchema, Slide } from "./schema";

export const P_TRANSITION = 0.5;
export const P_VOICE_DELAY = 0.3;

type Seg = { kind: "intro" | "slide" | "outro"; duration: number; voice: string; voiceFile?: string; voiceDuration?: number; slide?: Slide; index?: number };

export const segments = (p: PresT): Seg[] => [
  ...(p.intro ? [{ kind: "intro" as const, ...p.intro }] : []),
  ...p.slides.map((s, i) => ({ kind: "slide" as const, duration: s.duration, voice: s.voice, voiceFile: s.voiceFile, voiceDuration: s.voiceDuration, slide: s, index: i })),
  ...(p.outro ? [{ kind: "outro" as const, ...p.outro }] : []),
];

export const presentationDuration = (p: PresT) => {
  const segs = segments(p);
  const T = Math.round(P_TRANSITION * p.fps);
  return segs.reduce((a, s) => a + Math.round(s.duration * p.fps), 0) - T * (segs.length - 1);
};

/** Caja donde va la diapositiva y la zona de subtítulos según el formato. */
const layout = (format: PresT["format"], aspect: number) => {
  const { width: W, height: H } = FORMATS[format];
  if (format === "landscape") {
    const h = 860, w = Math.min(1800, h * aspect);
    return { slide: { x: (W - w) / 2, y: 40, w, h: w / aspect }, captionY: 935, titleY: null as number | null };
  }
  const w = 1000, h = w / aspect;
  if (format === "vertical") return { slide: { x: 40, y: 960 - h / 2 - 40, w, h }, captionY: 960 + h / 2 + 60, titleY: 960 - h / 2 - 300 };
  return { slide: { x: 40, y: 150, w, h }, captionY: 150 + h + 50, titleY: 30 };
};

/** Subtítulos: trozos de ≤7 palabras, sincronizados por proporción de caracteres sobre la duración de la voz. */
const Captions: React.FC<{ text: string; dur: number; y: number; theme: Theme; width: number }> = ({ text, dur, y, theme, width }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - P_VOICE_DELAY;
  if (!text || t < 0 || t > dur + 0.3) return null;
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= 7 || /[.!?;:]$/.test(w) || (cur.length >= 4 && /,$/.test(w))) { chunks.push(cur); cur = []; }
  }
  if (cur.length) chunks.push(cur);
  const total = words.reduce((a, w) => a + w.length + 1, 0);
  let acc = 0;
  const timed = chunks.map((c) => {
    const len = c.reduce((a, w) => a + w.length + 1, 0);
    const s = (acc / total) * dur; acc += len;
    return { c, s, e: (acc / total) * dur };
  });
  const idx = Math.max(0, timed.findIndex((x) => t >= x.s && t < x.e));
  const cur2 = timed[t >= dur ? timed.length - 1 : idx];
  const local = (t - cur2.s) / Math.max(0.01, cur2.e - cur2.s);
  const wi = Math.floor(local * cur2.c.length);
  const pop = spring({ frame: Math.round((t - cur2.s) * fps), fps, config: { damping: 14, stiffness: 200 } });
  return (
    <div style={{ position: "absolute", top: y, left: 0, width, display: "flex", justifyContent: "center", padding: "0 60px" }}>
      <div style={{ background: "rgba(0,0,0,0.55)", borderRadius: 24, padding: "14px 30px", fontFamily: body, fontWeight: 700, fontSize: width > 1500 ? 46 : 50, lineHeight: 1.25, color: theme.text, textAlign: "center", transform: `scale(${0.95 + 0.05 * pop})`, opacity: pop, maxWidth: width - 120 }}>
        {cur2.c.map((w, i) => (
          <span key={i} style={{ color: i === wi ? theme.accent : undefined }}>{w}{i < cur2.c.length - 1 ? " " : ""}</span>
        ))}
      </div>
    </div>
  );
};

const Highlight: React.FC<{ h: Slide["highlights"][number]; w: number; hgt: number; theme: Theme }> = ({ h, w, hgt, theme }) => {
  const frame = useFrame();
  const p = interpolate(frame, [h.at * ANIM_FPS, h.at * ANIM_FPS + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  if (p <= 0) return null;
  const color = h.color ?? theme.accent;
  const x = h.x * w, y = h.y * hgt, rw = h.w * w, rh = h.h * hgt;
  const pad = 10;
  const common = { fill: "none", stroke: color, strokeWidth: 7, strokeLinecap: "round" as const, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p, style: { filter: `drop-shadow(0 0 10px ${color})` } };
  if (h.style === "underline") return <path d={`M ${x} ${y + rh + 8} q ${rw / 2} 10 ${rw} -4`} {...common} strokeWidth={10} />;
  if (h.style === "circle") return <ellipse cx={x + rw / 2} cy={y + rh / 2} rx={rw / 2 + pad * 2} ry={rh / 2 + pad * 2} {...common} />;
  return (
    <g>
      <rect x={x - pad} y={y - pad} width={rw + pad * 2} height={rh + pad * 2} rx={14} fill={color} opacity={0.12 * p} />
      <rect x={x - pad} y={y - pad} width={rw + pad * 2} height={rh + pad * 2} rx={14} {...common} />
    </g>
  );
};

const SlideView: React.FC<{ seg: Seg; p: PresT; total: number }> = ({ seg, p, total }) => {
  const frame = useFrame();
  const fps = ANIM_FPS;
  const { durationInFrames, fps: realFps } = useVideoConfig();
  const s = seg.slide!;
  const L = layout(p.format, p.aspect);
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const durA = (durationInFrames * ANIM_FPS) / realFps;
  // Ken Burns suave + zoom a la zona "focus"
  let scale = interpolate(frame, [0, durA], [1, 1.035]);
  let tx = 0, ty = 0;
  if (s.focus) {
    const f = s.focus;
    const end = f.until ?? Infinity;
    const z = interpolate(frame, [f.at * fps, f.at * fps + 30, end * fps, end * fps + 30], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
    const target = Math.min(2.5, 0.85 / Math.max(f.w, f.h * 0.9));
    scale *= 1 + (target - 1) * z;
    tx = (0.5 - (f.x + f.w / 2)) * L.slide.w * scale * z;
    ty = (0.5 - (f.y + f.h / 2)) * L.slide.h * scale * z;
  }
  return (
    <AbsoluteFill>
      {L.titleY !== null && s.title && (
        <div style={{ position: "absolute", top: L.titleY, left: 60, right: 60, height: 260, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <RichText text={s.title} accent={p.theme.accent} perWord={3} style={{ fontFamily: display, fontWeight: 900, fontSize: 70, lineHeight: 1.08, color: p.theme.text, textTransform: "uppercase" }} />
        </div>
      )}
      <div style={{ position: "absolute", left: L.slide.x, top: L.slide.y, width: L.slide.w, height: L.slide.h, borderRadius: 22, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.45)", opacity: enter, transform: `scale(${0.94 + 0.06 * enter}) translateY(${(1 - enter) * 40}px)`, background: "#fff" }}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: "center" }}>
          <Img src={staticFile(s.image)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          <svg width={L.slide.w} height={L.slide.h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {s.highlights.map((h, i) => <Highlight key={i} h={h} w={L.slide.w} hgt={L.slide.h} theme={p.theme} />)}
          </svg>
        </div>
      </div>
      {/* número de diapositiva */}
      <div style={{ position: "absolute", top: L.slide.y + 18, left: L.slide.x + L.slide.w - 150, width: 130, textAlign: "center", fontFamily: body, fontWeight: 800, fontSize: 26, color: "#fff", background: "rgba(0,0,0,0.55)", borderRadius: 30, padding: "6px 0", opacity: enter }}>
        {seg.index! + 1} / {total}
      </div>
      {p.captions && seg.voiceDuration && <Captions text={seg.voice} dur={seg.voiceDuration} y={L.captionY} theme={p.theme} width={FORMATS[p.format].width} />}
    </AbsoluteFill>
  );
};

const TitleCard: React.FC<{ title: string; subtitle?: string; cta?: string; p: PresT }> = ({ title, subtitle, cta, p }) => {
  const frame = useFrame();
  const s = spring({ frame: frame - 25, fps: ANIM_FPS, config: { damping: 12 } });
  const W = FORMATS[p.format].width;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 100, gap: 40, textAlign: "center" }}>
      <RichText text={title} accent={p.theme.accent} perWord={3} style={{ fontFamily: display, fontWeight: 900, fontSize: W > 1500 ? 100 : 84, lineHeight: 1.05, color: p.theme.text, textTransform: "uppercase", maxWidth: W - 200 }} />
      <div style={{ height: 10, width: 220 * s, borderRadius: 5, background: `linear-gradient(90deg, ${p.theme.accent}, ${p.theme.accent2})` }} />
      {subtitle && <div style={{ fontFamily: body, fontWeight: 600, fontSize: 48, color: p.theme.text, opacity: s * 0.85 }}>{subtitle}</div>}
      {cta && <div style={{ fontFamily: body, fontWeight: 800, fontSize: 50, color: p.theme.bg1, background: `linear-gradient(90deg, ${p.theme.accent}, ${p.theme.accent2})`, padding: "24px 54px", borderRadius: 60, transform: `scale(${s})` }}>{cta}</div>}
    </AbsoluteFill>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transitions: Array<() => TransitionPresentation<any>> = [() => fade(), () => slideT({ direction: "from-right" })];

export const Presentation: React.FC<PresT> = (props) => {
  const p = presentationSchema.parse(props);
  const { fps, durationInFrames, width } = useVideoConfig();
  const frame = useCurrentFrame();
  const segs = segments(p);
  const T = Math.round(P_TRANSITION * fps);
  const starts: number[] = [];
  segs.reduce((acc, s) => { starts.push(acc); return acc + Math.round(s.duration * fps) - T; }, 0);
  const spans = segs.flatMap((s, i) => (s.voiceFile && s.voiceDuration ? [[starts[i] + P_VOICE_DELAY * fps, starts[i] + (P_VOICE_DELAY + s.voiceDuration) * fps]] : []));
  return (
    <LangProvider lang={p.lang}>
      <AbsoluteFill style={{ background: p.theme.bg1 }}>
        <Background theme={p.theme} />
        <TransitionSeries>
          {segs.flatMap((seg, i) => {
            const el = seg.kind === "slide" ? <SlideView seg={seg} p={p} total={p.slides.length} />
              : seg.kind === "intro" ? <TitleCard title={p.intro!.title} subtitle={p.intro!.subtitle} p={p} />
              : <TitleCard title={p.outro!.text} cta={p.outro!.cta} p={p} />;
            const items = [<TransitionSeries.Sequence key={`s${i}`} durationInFrames={Math.round(seg.duration * fps)}>{el}</TransitionSeries.Sequence>];
            if (i < segs.length - 1) items.push(<TransitionSeries.Transition key={`t${i}`} presentation={transitions[i % 2]()} timing={linearTiming({ durationInFrames: T })} />);
            return items;
          })}
        </TransitionSeries>
        <div style={{ position: "absolute", top: 0, left: 0, height: 8, width: `${(frame / durationInFrames) * 100}%`, background: p.theme.accent }} />
        {p.handle && <div style={{ position: "absolute", bottom: p.format === "vertical" ? 300 : 12, right: p.format === "vertical" ? 0 : 30, width: p.format === "vertical" ? width : undefined, textAlign: p.format === "vertical" ? "center" : "right", fontFamily: body, fontWeight: 700, fontSize: 30, color: p.theme.text, opacity: 0.55 }}>{p.handle}</div>}

        {p.music && <Audio src={staticFile(p.music)} volume={(f) => {
          const fadeV = interpolate(f, [0, fps, durationInFrames - fps * 2, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const ramp = fps * 0.3;
          let duck = 0;
          spans.forEach(([a, b]) => { duck = Math.max(duck, interpolate(f, [a - ramp, a, b, b + ramp], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })); });
          return p.musicVolume * fadeV * (1 - duck * 0.65);
        }} loop />}
        {segs.map((seg, i) => seg.voiceFile ? (
          <Sequence key={`v${i}`} from={starts[i] + Math.round(P_VOICE_DELAY * fps)} layout="none"><Audio src={staticFile(seg.voiceFile)} volume={p.narrator.volume} /></Sequence>
        ) : null)}
        {p.sfx && segs.map((seg, i) => [
          ...(i > 0 ? [{ sound: "whoosh", at: -0.1, volume: 0.6 }] : []),
          ...(seg.slide?.highlights.map((h) => ({ sound: "pop", at: h.at, volume: 0.7 })) ?? []),
          ...(seg.slide?.sfx ?? []),
        ].map((c, j) => (
          <Sequence key={`x${i}-${j}`} from={Math.max(0, starts[i] + Math.round(c.at * fps))} durationInFrames={fps * 2} layout="none">
            <Audio src={staticFile(`sfx/${c.sound}.wav`)} volume={p.sfxVolume * (c.volume ?? 1)} />
          </Sequence>
        )))}
      </AbsoluteFill>
    </LangProvider>
  );
};
