import type { BrandConfig } from "@bxy/shared-types";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

// Latin covers Spanish (á, é, í, ó, ú, ñ, ¿, ¡). Only the weights the compositions use.
const options = (): { weights: ("400" | "700")[]; subsets: "latin"[] } => ({ weights: ["400", "700"], subsets: ["latin"] });

/**
 * Font families a BrandConfig may reference, keyed by the exact family name.
 * To support a new family: add its @remotion/google-fonts loader here.
 */
const loaders: Record<string, () => void> = {
  Geist: () => loadGeist("normal", options()),
  "Geist Mono": () => loadGeistMono("normal", options()),
  "JetBrains Mono": () => loadJetBrainsMono("normal", options()),
};

export const brandFontFamilies = (brand: BrandConfig) => [
  ...new Set([brand.typography.mono, brand.typography.display, brand.typography.body]),
];

/**
 * Loads every font the given brands declare. Remotion waits (delayRender) until they are ready,
 * so no frame renders with a fallback face. Throws on a family with no loader.
 */
export const loadBrandFonts = (brands: BrandConfig[]) => {
  const families = [...new Set(brands.flatMap(brandFontFamilies))];
  const unknown = families.filter((family) => !(family in loaders));
  if (unknown.length > 0) {
    throw new Error(
      `No font loader for: ${unknown.join(", ")}. Add it in src/fonts.ts. Supported: ${Object.keys(loaders).join(", ")}.`,
    );
  }
  for (const family of families) loaders[family]();
};
