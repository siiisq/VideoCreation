import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { linearTiming, TransitionPresentation, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { Background } from "./components/Background";
import { body } from "./fonts";
import { Reel as ReelT, reelSchema } from "./schema";
import { SceneView } from "./scenes/Scenes";

export const TRANSITION_FRAMES = 12;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transitions: Array<() => TransitionPresentation<any>> = [
  () => slide({ direction: "from-bottom" }),
  () => fade(),
  () => wipe({ direction: "from-left" }),
  () => slide({ direction: "from-right" }),
];

const ProgressBar: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: "rgba(255,255,255,0.12)" }}>
      <div style={{ height: "100%", width: `${(frame / durationInFrames) * 100}%`, background: color }} />
    </div>
  );
};

export const Reel: React.FC<ReelT> = (props) => {
  const reel = reelSchema.parse(props);
  const { fps, durationInFrames } = useVideoConfig();
  const { theme } = reel;
  return (
    <AbsoluteFill style={{ background: theme.bg1 }}>
      <Background theme={theme} />
      <TransitionSeries>
        {reel.scenes.flatMap((scene, i) => {
          const items = [
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={Math.round(scene.duration * fps)}>
              <SceneView scene={scene} theme={theme} />
            </TransitionSeries.Sequence>,
          ];
          if (i < reel.scenes.length - 1) {
            items.push(
              <TransitionSeries.Transition key={`t${i}`} presentation={transitions[i % transitions.length]()} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />,
            );
          }
          return items;
        })}
      </TransitionSeries>
      <ProgressBar color={theme.accent} />
      {reel.handle && (
        <div style={{ position: "absolute", bottom: 300, width: "100%", textAlign: "center", fontFamily: body, fontWeight: 700, fontSize: 36, color: theme.text, opacity: 0.6 }}>{reel.handle}</div>
      )}
      {reel.music && (
        <Audio
          src={staticFile(reel.music)}
          volume={(f) => reel.musicVolume * interpolate(f, [0, fps, durationInFrames - fps * 1.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      )}
    </AbsoluteFill>
  );
};
