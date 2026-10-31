import React from "react";
import { CalculateMetadataFunction, Composition, getInputProps } from "remotion";
import { Reel, transitionFrames } from "./Reel";
import { Reel as ReelT, reelSchema } from "./schema";
import ejemplo from "../videos/cafe-aguado-cafeina.json";

const calculateMetadata: CalculateMetadataFunction<ReelT> = ({ props }) => {
  const reel = reelSchema.parse(props);
  const fps = reel.fps;
  const total = reel.scenes.reduce((a, s) => a + Math.round(s.duration * fps), 0) - transitionFrames(fps) * (reel.scenes.length - 1);
  return { durationInFrames: total, fps, props: reel };
};

export const RemotionRoot: React.FC = () => {
  const input = getInputProps() as Partial<ReelT>;
  const defaultProps = (input && input.scenes ? input : ejemplo) as ReelT;
  return (
    <Composition id="Reel" component={Reel} schema={reelSchema} width={1080} height={1920} fps={60} durationInFrames={3600} defaultProps={defaultProps} calculateMetadata={calculateMetadata} />
  );
};
