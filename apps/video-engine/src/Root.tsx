import { Composition } from "remotion";
import { brands } from "./brands";
import { loadBrandFonts } from "./fonts";
import { HistoryGuess, calculateHistoryGuessMetadata } from "./formats/history-i-guess/HistoryGuess";
import { historyGuessStories } from "./formats/history-i-guess/stories";
import { WhatIf3D, calculateWhatIf3DMetadata } from "./formats/whatif-3d/WhatIf3D";
import { whatIfStories } from "./formats/whatif-3d/stories";
import { ProductReel, productReelDuration } from "./storyboards/ProductReel";
import { sampleScenes } from "./storyboards/sample-scenes";

export const FPS = 30;

// Brand typography must be loaded before any frame renders, or text falls back to a serif face.
loadBrandFonts(brands);

const brandBySlug = (slug: string) => {
  const brand = brands.find((candidate) => candidate.slug === slug);
  if (!brand) throw new Error(`Unknown brand "${slug}". Register it in src/brands/index.ts.`);
  return brand;
};

export const RemotionRoot = () => (
  <>
    {/* Product Reels: vertical 9:16, one composition per registered brand. */}
    {brands.map((brand) => (
      <Composition
        key={brand.slug}
        id={`reel-${brand.slug}`}
        component={ProductReel}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={productReelDuration(sampleScenes)}
        defaultProps={{ brand, scenes: sampleScenes }}
      />
    ))}

    {/* What-if 3D: Blender footage from studios/whatif-3d + brand captions. */}
    {whatIfStories.map(({ story, brand }) => (
      <Composition
        key={`${brand}-${story}`}
        id={`whatif-${brand}-${story}`}
        component={WhatIf3D}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={FPS}
        calculateMetadata={calculateWhatIf3DMetadata}
        defaultProps={{ brand: brandBySlug(brand), story }}
      />
    ))}

    {/* History-i-guess: code-drawn master from studios/history-i-guess + brand tag. */}
    {historyGuessStories.map(({ story, brand }) => (
      <Composition
        key={`history-${brand}-${story}`}
        id={`history-${brand}-${story}`}
        component={HistoryGuess}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={FPS}
        calculateMetadata={calculateHistoryGuessMetadata}
        defaultProps={{ brand: brandBySlug(brand), story }}
      />
    ))}
  </>
);
