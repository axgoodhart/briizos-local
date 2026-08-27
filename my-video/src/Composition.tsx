import {
  CalculateMetadataFunction,
  Composition,
  staticFile,
  CanvasImage,
} from "remotion";

type Props = {};

const calculateMetadata: CalculateMetadataFunction<Props> = () => {
  return {};
};

export const MyComposition = () => {
  return (
    <Composition
      id="MyComp"
      component={MyComponent}
      durationInFrames={60}
      fps={30}
      width={1280}
      height={720}
      calculateMetadata={calculateMetadata}
    />
  );
};

export const MyComponent: React.FC<Props> = () => {
  return (
    <>
      <CanvasImage
        src={staticFile("Screenshot 2026-08-20 at 7.48.16 AM.png")}
        from={-46}
        style={{
          position: "absolute",
          translate: "-417.5px -702.8px",
          scale: 0.334,
        }}
      />
    </>
  );
};
