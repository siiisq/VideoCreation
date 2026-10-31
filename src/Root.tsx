import React from "react";
import { CalculateMetadataFunction, Composition, getInputProps } from "remotion";
import { Reel, transitionFrames } from "./Reel";
import { Reel as ReelT, reelSchema } from "./schema";
import { Presentation, presentationDuration } from "./presentation/Presentation";
import { FORMATS, Presentation as PresT, presentationSchema } from "./presentation/schema";
import ejemplo from "../videos/cafe-aguado-cafeina.json";
import ejemploPres from "../videos/ejemplo-presentacion.slides.json";

const reelMeta: CalculateMetadataFunction<ReelT> = ({ props }) => {
  const reel = reelSchema.parse(props);
  const fps = reel.fps;
  const total = reel.scenes.reduce((a, s) => a + Math.round(s.duration * fps), 0) - transitionFrames(fps) * (reel.scenes.length - 1);
  return { durationInFrames: total, fps, props: reel };
};

const presMeta: CalculateMetadataFunction<PresT> = ({ props }) => {
  const p = presentationSchema.parse(props);
  return { durationInFrames: presentationDuration(p), fps: p.fps, ...FORMATS[p.format], props: p };
};

export const RemotionRoot: React.FC = () => {
  const input = getInputProps() as Record<string, unknown>;
  const reelProps = (input && input.scenes ? input : ejemplo) as ReelT;
  const presProps = (input && input.slides ? input : ejemploPres) as unknown as PresT;
  return (
    <>
      <Composition id="Reel" component={Reel} schema={reelSchema} width={1080} height={1920} fps={60} durationInFrames={3600} defaultProps={reelProps} calculateMetadata={reelMeta} />
      <Composition id="Presentation" component={Presentation} schema={presentationSchema} width={1920} height={1080} fps={30} durationInFrames={900} defaultProps={presProps} calculateMetadata={presMeta} />
    </>
  );
};
