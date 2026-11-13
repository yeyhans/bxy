// Copy a finished what-if story (footage.mp4 + timing.json) from the Blender studio
// into Remotion's public folder. Usage: pnpm whatif:sync <story>
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const story = process.argv[2];
if (!story || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(story)) {
  console.error("Usage: pnpm whatif:sync <story>   (story: lowercase kebab-case folder in studios/whatif-3d/stories)");
  process.exit(1);
}

const engineRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(engineRoot, "studios", "whatif-3d", "stories", story);
const target = join(engineRoot, "public", "whatif", story);
const files = ["footage.mp4", "timing.json"];

const missing = files.filter((file) => !existsSync(join(source, file)));
if (missing.length > 0) {
  console.error(`Missing in ${source}: ${missing.join(", ")}`);
  console.error("Run voice.py, build.py --final, sound.py and finish.py --no-captions first.");
  process.exit(1);
}

mkdirSync(target, { recursive: true });
for (const file of files) copyFileSync(join(source, file), join(target, file));
console.log(`Synced ${story} -> public/whatif/${story}`);
