import type { BrandConfig, VideoStoryboardScene } from "@bxy/shared-types";
import { AbsoluteFill, Series } from "remotion";
import { FadeSlide } from "../primitives/FadeSlide";

export type ProductReelProps = {
  brand: BrandConfig;
  scenes: VideoStoryboardScene[];
};

export const productReelDuration = (scenes: VideoStoryboardScene[]) =>
  scenes.reduce((total, scene) => total + scene.durationInFrames, 0);

export const ProductReel = ({ brand, scenes }: ProductReelProps) => (
  <AbsoluteFill style={{ backgroundColor: brand.palette.background }}>
    <Series>
      {scenes.map((scene) => (
        <Series.Sequence key={scene.id} durationInFrames={scene.durationInFrames}>
          <AbsoluteFill
            style={{
              justifyContent: "center",
              padding: 96,
              border: `1px solid ${brand.palette.border}`,
              color: brand.palette.foreground,
              fontFamily: brand.typography.mono,
            }}
          >
            <FadeSlide>
              <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2, lineHeight: 1 }}>{scene.text}</div>
            </FadeSlide>
          </AbsoluteFill>
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
