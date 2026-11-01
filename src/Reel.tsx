import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { linearTiming, TransitionPresentation, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { pushCut } from "@remotion/transitions/push-cut";
import { iris } from "@remotion/transitions/iris";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { Background } from "./components/Background";
import { body } from "./fonts";
import { Reel as ReelT, reelSchema } from "./schema";
import { SceneView } from "./scenes/Scenes";
import { autoCues } from "./sfx";
import { LangProvider } from "./i18n";

export const TRANSITION_SECONDS = 0.4;
export const VOICE_DELAY = 0.3; // la voz entra cuando ha terminado la transición
export const transitionFrames = (fps: number) => Math.round(TRANSITION_SECONDS * fps);

/** Fotograma en el que empieza cada escena (las transiciones se solapan). */
export const sceneStarts = (reel: ReelT, fps: number) => {
  const T = transitionFrames(fps);
  let acc = 0;
  return reel.scenes.map((s) => {
    const start = acc;
    acc += Math.round(s.duration * fps) - T;
    return start;
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pickTransition = (style: string, i: number, w: number, h: number): TransitionPresentation<any> => {
  switch (style) {
    case "push": return pushCut();
    case "iris": return iris({ width: w, height: h });
    case "whip": return slide({ direction: i % 2 ? "from-left" : "from-right" });
    case "flip": return flip({ direction: i % 2 ? "from-left" : "from-right" });
    case "clock": return clockWipe({ width: w, height: h });
    default: return pickTransition(["iris", "whip", "flip", "clock"][i % 4], i, w, h); // mix: rota las aprobadas
  }
};

const ProgressBar: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: "rgba(255,255,255,0.12)" }}>
      <div style={{ height: "100%", width: `${(frame / durationInFrames) * 100}%`, background: color }} />
    </div>
  );
};

/** Fuga de luz cálida que barre la pantalla en los cortes (CSS puro → render rápido). */
const LightLeak: React.FC<{ seed: number; colors: [string, string] }> = ({ seed, colors }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = frame / (durationInFrames - 1);
  const intensity = Math.sin(Math.min(1, p) * Math.PI);
  const dir = seed % 2 ? 1 : -1;
  const x = interpolate(p, [0, 1], [-30, 130]) * (dir > 0 ? 1 : -1) + (dir > 0 ? 0 : 100);
  const y = 20 + ((seed * 37) % 60);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: intensity * 0.75, pointerEvents: "none",
      background: `radial-gradient(ellipse 70% 45% at ${x}% ${y}%, ${colors[0]}ee 0%, ${colors[0]}00 70%), radial-gradient(ellipse 50% 70% at ${100 - x}% ${100 - y}%, ${colors[1]}cc 0%, ${colors[1]}00 65%), radial-gradient(circle at ${x}% ${y}%, #ffffffaa 0%, #ffffff00 25%)` }} />
  );
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = Math.floor((frame * 12) / fps); // el grano cambia 12 veces por segundo
  const x = (k * 7919) % 540;
  const y = (k * 104729) % 960;
  return <AbsoluteFill style={{ backgroundImage: `url(${staticFile("fx/grain.png")})`, backgroundSize: "540px 960px", backgroundPosition: `${x}px ${y}px`, mixBlendMode: "overlay", opacity: 0.07, pointerEvents: "none" }} />;
};

export const Reel: React.FC<ReelT> = (props) => {
  const reel = reelSchema.parse(props);
  const { fps, durationInFrames } = useVideoConfig();
  const frameNow = useCurrentFrame();
  const { theme } = reel;
  const T = transitionFrames(fps);
  const starts = sceneStarts(reel, fps);
  const voiceSpans = reel.scenes.flatMap((s, i) => s.voiceFile && s.voiceDuration ? [[starts[i] + VOICE_DELAY * fps, starts[i] + (VOICE_DELAY + s.voiceDuration) * fps] as [number, number]] : []);
  return (
    <LangProvider lang={reel.lang}>
    <AbsoluteFill style={{ background: theme.bg1 }}>
      <Background theme={theme} />
      <TransitionSeries>
        {reel.scenes.flatMap((scene, i) => {
          const items = [
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={Math.round(scene.duration * fps)}>
              <SceneView scene={reel.captions && scene.type === "drawing" ? { ...scene, text: undefined } : reel.hideCtaAtEnd && scene.type === "outro" ? { ...scene, cta: undefined } : scene} theme={theme} />
            </TransitionSeries.Sequence>,
          ];
          if (i < reel.scenes.length - 1) {
            items.push(<TransitionSeries.Transition key={`t${i}`} presentation={pickTransition(reel.scenes[i + 1].transition ?? reel.transitionStyle, i, 1080, 1920)} timing={linearTiming({ durationInFrames: T })} />);
          }
          return items;
        })}
      </TransitionSeries>

      {reel.lightLeaks && starts.slice(1).filter((_, i) => i % 2 === 0).map((st, i) => (
        <Sequence key={`ll${i}`} from={Math.max(0, st - Math.round(fps * 0.3))} durationInFrames={Math.round(fps * 0.9)} layout="none">
          <LightLeak seed={i * 3 + 1} colors={[theme.accent, theme.accent2]} />
        </Sequence>
      ))}

      {reel.overlay && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <OffthreadVideo src={staticFile(reel.overlay)} transparent muted style={{ width: "100%", height: "100%" }} />
        </AbsoluteFill>
      )}
      {reel.grain && <Grain />}
      <ProgressBar color={theme.accent} />
      {reel.handle && !reel.captions && !(reel.hideHandleAtEnd && frameNow >= starts[starts.length - 1]) && (
        <div style={{ position: "absolute", bottom: 300, width: "100%", textAlign: "center", fontFamily: body, fontWeight: 700, fontSize: 36, color: theme.text, opacity: 0.6 }}>{reel.handle}</div>
      )}

      {reel.music && (
        <Audio src={staticFile(reel.music)} volume={(f) => {
          const fade = interpolate(f, [0, fps, durationInFrames - fps * 1.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          // "ducking": la música baja mientras habla la voz, con rampas suaves de 0,25 s
          const ramp = fps * 0.25;
          let duck = 0;
          voiceSpans.forEach(([a, b]) => { duck = Math.max(duck, interpolate(f, [a - ramp, a, b, b + ramp], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })); });
          return reel.musicVolume * fade * (1 - duck * 0.6);
        }} />
      )}
      {reel.scenes.map((scene, i) => scene.voiceFile ? (
        <Sequence key={`v${i}`} from={starts[i] + Math.round(VOICE_DELAY * fps)} layout="none">
          <Audio src={staticFile(scene.voiceFile)} volume={reel.narrator.volume} />
        </Sequence>
      ) : null)}
      {reel.sfx && reel.scenes.map((scene, i) => {
        const cues = [...(i > 0 ? [{ sound: "whoosh" as const, at: -0.1, volume: 0.45 }] : []), ...autoCues(scene), ...(scene.sfx ?? [])];
        return cues.map((c, j) => (
          <Sequence key={`sfx${i}-${j}`} from={Math.max(0, starts[i] + Math.round(c.at * fps))} durationInFrames={fps * 2} layout="none">
            <Audio src={staticFile(`sfx/${c.sound}.wav`)} volume={reel.sfxVolume * (c.volume ?? 1)} />
          </Sequence>
        ));
      })}
    </AbsoluteFill>
    </LangProvider>
  );
};
