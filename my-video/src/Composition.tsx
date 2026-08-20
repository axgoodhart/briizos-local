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
        from={0}
        style={{
          position: "absolute",
          translate: "-383px -704px",
          scale: 0.334,
        }}
      />
    </>
  );
};
