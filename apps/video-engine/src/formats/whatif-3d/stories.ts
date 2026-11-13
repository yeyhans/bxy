/**
 * What-if 3D videos to expose in the Studio. Each entry becomes the composition
 * `whatif-<brand>-<story>`. The same story can be listed under several brands:
 * the Blender footage is shared, only captions and tag change.
 *
 * Add an entry only after `pnpm whatif:sync <story>` copied its footage and timing.
 * Example: { story: "cistern", brand: "bxy" }
 */
export type WhatIfEntry = { story: string; brand: string };

export const whatIfStories: WhatIfEntry[] = [
  { story: "dos-clones", brand: "bxy" },
  { story: "pk-booster", brand: "bxy" },
];
