---
name: bxy-video-director
description: Rules for producing Reels and videos in apps/video-engine with deterministic Remotion and ElevenLabs MCP voiceover. Use when creating or editing compositions, storyboards, primitives, brand configs, or generating voiceover audio for any BxY or client video.
---

# BxY Video Director

Engine: `apps/video-engine` (Remotion 4). Architecture: `docs/02-ARCHITECTURE.md`.

## Structure

- `src/brands/<slug>.brand.ts` — one `BrandConfig` per brand, registered in `src/brands/index.ts`.
- `src/primitives/` — reusable deterministic animated blocks.
- `src/storyboards/` — compositions built from `VideoStoryboardScene[]` (`@bxy/shared-types`).
- Product data: `GET <brand.storeApiUrl>/api/store/products` → `StoreProduct[]`.

## Formats

| Format | Where | Brand-specific part |
|--------|-------|---------------------|
| Product Reel | `src/storyboards/ProductReel.tsx` | everything (pure Remotion) |
| What-if 3D explainer | `studios/whatif-3d/` (Blender) + `src/formats/whatif-3d/` (Remotion) | captions + brand tag only |
| History, i guess | `studios/history-i-guess/` (code-drawn, headless Chrome) + `src/formats/history-i-guess/` (Remotion) | brand tag only |

A new format goes in `src/formats/<format>/` and is registered in `src/Root.tsx`. Never edit
`src/brands/*` to fit a format: brands are passed as props.

### What-if 3D

- Read `studios/whatif-3d/CLAUDE.md` first (BxY overrides of the upstream guide).
- Blender renders brand-neutral footage without captions (`finish.py --no-captions` → `footage.mp4`).
- `pnpm --filter @bxy/video-engine whatif:sync <story>` copies `footage.mp4` + `timing.json` to `public/whatif/<story>/`.
- Register `{ story, brand }` in `src/formats/whatif-3d/stories.ts` → composition `whatif-<brand>-<story>`.
  One story can be listed under several brands without re-rendering Blender.
- Pre-rendered footage via `<OffthreadVideo>` is allowed: it is already deterministic.

### History, i guess

- Read `studios/history-i-guess/CLAUDE.md` first (BxY overrides of the upstream kit).
- The studio renders a brand-neutral 9:16 master with its text already in the picture: Remotion adds no captions.
- `pnpm --filter @bxy/video-engine history:sync <story>` copies the master + duration to `public/history/<story>/`.
- Register `{ story, brand }` in `src/formats/history-i-guess/stories.ts` → composition `history-<brand>-<story>`.
- Spanish (es-CL) is the default: `new_video.py --lang es` (edge voice `es-CL-LorenzoNeural`, tag word `supongo`). See the studio `CLAUDE.md`, override 6.

## Determinism (hard rule)

Allowed: `useCurrentFrame()`, `useVideoConfig()`, `spring()`, `interpolate()`, `<Series>`,
`<Sequence>`, `flubber` (shape morphing), `@remotion/three`.

Forbidden: CSS `transition`/`animation`/`@keyframes`, framer-motion, anime.js, GSAP,
`Math.random()` (use `random(seed)` from remotion), `Date.now()`, timers.

## Audio-first workflow (ElevenLabs MCP)

1. Write each scene's `voiceover` first. Phonetic Spanish for numbers and acronyms:
   - `$350.000 + IVA` → `"trescientos cincuenta mil pesos más IVA"`
   - `BxY` → `"B por Y"`
   - Use `BrandConfig.voice.phonetics` for brand-specific replacements.
2. Add vocal direction: `[sighs]`, `[excited]`, `[confident]`, or SSML `<break time="0.4s"/>`.
3. Generate audio with the ElevenLabs MCP using `BrandConfig.voice.elevenLabsVoiceId`.
   Save to `apps/video-engine/public/audio/<brand>/<storyboard>/<scene-id>.mp3`.
4. Measure real duration and set `durationInFrames = Math.ceil(seconds * fps)` per scene.
   Never stretch audio to fit a fixed timeline.
5. Play audio with `<Audio src={staticFile(...)} />` inside the scene's sequence.

## Fonts

`BrandConfig.typography` families are loaded in `src/Root.tsx` via `loadBrandFonts(brands)` (`src/fonts.ts`,
`@remotion/google-fonts`, latin subset, weights 400/700). A family without a loader throws on startup:
add its loader in `src/fonts.ts` before using it in a brand. Never rely on system fonts.

## Visual defaults

Industrial/technical brutalist: monochrome high contrast, `JetBrains Mono`/`Geist Mono` +
display face, `1px solid` borders, no diffuse shadows, no emojis. Format 1080x1920 @ 30fps for Reels.
