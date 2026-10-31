import React from "react";
import { CalculateMetadataFunction, Composition, getInputProps } from "remotion";
import { Reel, TRANSITION_FRAMES } from "./Reel";
import { Reel as ReelT, reelSchema } from "./schema";
import ejemplo from "../videos/agujeros-negros.json";

const FPS = 30;

const calculateMetadata: CalculateMetadataFunction<ReelT> = ({ props }) => {
  const reel = reelSchema.parse(props);
  const total = reel.scenes.reduce((a, s) => a + Math.round(s.duration * FPS), 0) - TRANSITION_FRAMES * (reel.scenes.length - 1);
  return { durationInFrames: total, props: reel };
};

export const RemotionRoot: React.FC = () => {
  const input = getInputProps() as Partial<ReelT>;
  const defaultProps = (input && input.scenes ? input : ejemplo) as ReelT;
  return (
    <Composition
      id="Reel"
      component={Reel}
      schema={reelSchema}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 60}
      defaultProps={defaultProps}
      calculateMetadata={calculateMetadata}
    />
  );
};
