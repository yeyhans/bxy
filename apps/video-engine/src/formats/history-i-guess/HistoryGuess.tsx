import type { BrandConfig } from "@bxy/shared-types";
import { AbsoluteFill, type CalculateMetadataFunction, OffthreadVideo, staticFile } from "remotion";
import { BrandTag } from "../../primitives/BrandTag";

export type HistoryGuessProps = {
  brand: BrandConfig;
  /** Folder under public/history/ (synced with `pnpm history:sync <story>`). */
  story: string;
};

const storyFile = (story: string, file: string) => staticFile(`history/${story}/${file}`);

export const calculateHistoryGuessMetadata: CalculateMetadataFunction<HistoryGuessProps> = async ({ props }) => {
  const response = await fetch(storyFile(props.story, "meta.json"));
  if (!response.ok) {
    throw new Error(`Missing public/history/${props.story}/meta.json. Run: pnpm history:sync ${props.story}`);
  }
  const { durationSeconds } = (await response.json()) as { durationSeconds: number };
  return { durationInFrames: Math.ceil(durationSeconds * 30) };
};

/**
 * Brand-neutral studio master (text, voice and sound already in the picture)
 * with only the brand tag drawn on top. This format has no Remotion captions.
 */
export const HistoryGuess = ({ brand, story }: HistoryGuessProps) => (
  <AbsoluteFill style={{ backgroundColor: brand.palette.background }}>
    <OffthreadVideo src={storyFile(story, "video.mp4")} />
    <BrandTag brand={brand} />
  </AbsoluteFill>
);
