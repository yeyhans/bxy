// Copy a finished history-i-guess story (9:16 master + duration) from the studio
// into Remotion's public folder. Usage: pnpm history:sync <story>
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const story = process.argv[2];
if (!story || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(story)) {
  console.error("Usage: pnpm history:sync <story>   (story: lowercase kebab-case folder in studios/history-i-guess/stories)");
  process.exit(1);
}

const engineRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(engineRoot, "studios", "history-i-guess", "stories", story);
const target = join(engineRoot, "public", "history", story);
const outDir = join(source, "out");
const timelineFile = join(source, "build", "timeline.json");

const masters = existsSync(outDir) ? readdirSync(outDir).filter((file) => file.endsWith("_9x16.mp4")) : [];
if (masters.length !== 1 || !existsSync(timelineFile)) {
  console.error(`Expected exactly one out/*_9x16.mp4 (found ${masters.length}) and build/timeline.json in ${source}`);
  console.error("Run narrate.py, render.py frames, sound.py and encode.py first.");
  process.exit(1);
}

const { duration } = JSON.parse(readFileSync(timelineFile, "utf8"));
if (typeof duration !== "number" || duration <= 0) {
  console.error(`build/timeline.json has no valid "duration" (got ${duration})`);
  process.exit(1);
}

mkdirSync(target, { recursive: true });
copyFileSync(join(outDir, masters[0]), join(target, "video.mp4"));
writeFileSync(join(target, "meta.json"), `${JSON.stringify({ durationSeconds: duration })}\n`);
console.log(`Synced ${story} -> public/history/${story} (${duration} s)`);
