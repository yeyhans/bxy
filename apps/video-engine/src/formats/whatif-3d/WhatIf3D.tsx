import type { BrandConfig } from "@bxy/shared-types";
import {
  AbsoluteFill,
  type CalculateMetadataFunction,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BrandTag } from "../../primitives/BrandTag";
import { type WhatIfTiming, activeCaption, captionSegments, whatIfTotalSeconds } from "./timing";

export type WhatIf3DProps = {
  brand: BrandConfig;
  /** Folder under public/whatif/ (synced with `pnpm whatif:sync <story>`). */
  story: string;
  /** Filled by calculateMetadata from public/whatif/<story>/timing.json. */
  timing?: WhatIfTiming;
};

const storyFile = (story: string, file: string) => staticFile(`whatif/${story}/${file}`);

export const calculateWhatIf3DMetadata: CalculateMetadataFunction<WhatIf3DProps> = async ({ props }) => {
  const response = await fetch(storyFile(props.story, "timing.json"));
  if (!response.ok) {
    throw new Error(`Missing public/whatif/${props.story}/timing.json. Run: pnpm whatif:sync ${props.story}`);
  }
  const timing = (await response.json()) as WhatIfTiming;
  return {
    durationInFrames: Math.ceil(whatIfTotalSeconds(timing) * 30),
    props: { ...props, timing },
  };
};

/** Caption band centre, same as the kit (scenes are framed to keep it clear). */
const CAPTION_Y = 0.52;

const Caption = ({ brand, timing }: { brand: BrandConfig; timing: WhatIfTiming }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const caption = activeCaption(captionSegments(timing), frame / fps);
  if (!caption) return null;

  const enter = spring({ frame: frame - Math.round(caption.from * fps), fps, config: { damping: 200, mass: 0.4 } });
  const scale = interpolate(enter, [0, 1], [0.92, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: height * CAPTION_Y,
          transform: `translateY(-50%) scale(${scale})`,
          padding: "12px 28px",
          maxWidth: "86%",
          backgroundColor: brand.palette.background,
          border: `1px solid ${brand.palette.border}`,
          color: brand.palette.foreground,
          fontFamily: brand.typography.mono,
          fontSize: 68,
          fontWeight: 700,
          letterSpacing: -1,
          lineHeight: 1,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {caption.text}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Brand-neutral Blender footage (no captions, voice + music already mixed)
 * with brand-specific captions and tag drawn on top.
 */
export const WhatIf3D = ({ brand, story, timing }: WhatIf3DProps) => (
  <AbsoluteFill style={{ backgroundColor: brand.palette.background }}>
    <OffthreadVideo src={storyFile(story, "footage.mp4")} />
    {timing ? <Caption brand={brand} timing={timing} /> : null}
    <BrandTag brand={brand} />
  </AbsoluteFill>
);
