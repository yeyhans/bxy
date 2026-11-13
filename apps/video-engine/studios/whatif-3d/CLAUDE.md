# whatif-3d studio (BxY)

Blender + Python studio for "How a ___ is built" 3D explainer Shorts. Scene craft, premise
scoring, script engine, animation, camera and look rules come from `whatif_guide.md`
(upstream kit, MIT, see `LICENSE`). Follow it, **with the BxY overrides below. Overrides win.**

## BxY overrides

1. **Layout:** one folder per video in `stories/<story-slug>/` (lowercase kebab-case), not `story/`.
   The kit is already unpacked in `kit/`; do not re-run the unpack snippet.
2. **Language:** scripts in Spanish (es-CL). In `script.json` set `"lang": "es"` and `"engine": "elevenlabs"`.
   The format engine stays: "Si haces…, tienes… Pero… Entonces… Esto es un ___."
   - **Spoken flow:** the narration must sound like one person talking, not a list of facts. Link every line
     to the previous one with a connector (`a cambio`, `es decir`, `pero entonces`, `sin embargo`, `y como`,
     `por eso`, `además`, `así que`, `en otras palabras`, `desde ahora`). Address the viewer in second person.
     Read the script aloud start to finish: no line may start cold.
3. **Voice: ElevenLabs MCP, not Kokoro.** Per line in `script.json`:
   - `text`: the exact spoken words, written phonetically (`"trescientos cincuenta mil pesos más IVA"`).
     It is used for word alignment and becomes the captions.
   - `say` (optional): the same line with vocal direction (`[confident]`, `[sighs]`, SSML `<break time="0.3s"/>`).
     This is what you send to ElevenLabs. Tags never go in `text`.
   - Save each line's audio as `stories/<slug>/vo/lineNN.mp3` (`line00.mp3`, `line01.mp3`…), then run
     `PY kit/voice.py stories/<slug>` to align and build `narration.wav` + `timing.json`.
   - The "free only" hard rule does not apply to the voice.
4. **No captions in the render.** The 3D footage is brand-neutral. Finish with
   `PY kit/finish.py stories/<slug> --no-captions` → `footage.mp4` (video + mix, no text).
   Captions, typography and brand tag are drawn by Remotion (`src/formats/whatif-3d/`).
5. **Caption band:** still keep key detail out of the band at 52% of the height (guide 5.4 rule 7):
   the Remotion captions sit there.
6. **Check:** `PY kit/check.py stories/<slug> footage.mp4` must PASS.
   - Length window defaults to 55-80 s; a short Reel declares its own in `script.json`: `"length": [40, 60]`.
   - A non-default voice engine passes only when declared explicitly in `script.json` (`"engine": "edge"`).
7. **Fallback voice (no ElevenLabs access):** `"engine": "edge"` with `"lang": "es"` uses
   `"edge_voice"` (default `es-CL-LorenzoNeural`). `timing.json` still labels `"voice"` with the kit default; ignore it.

8. **Hard cuts (kit fix):** `W.camera` forces `CONSTANT` interpolation on the camera keys. Blender 5.x ignored
   the preference, left them `BEZIER`, and the last frame of every shot smeared toward the next one;
   `check.py` does not catch that. After a camera change, `build.py -- stories/<slug> --cuts` re-renders the
   three frames around each cut (last of the shot, first two of the next), then re-run `finish.py`.
9. **Captions are chunks of 1-3 words** (max 18 characters), built in `src/formats/whatif-3d/timing.ts`.
   A chunk closes at punctuation, at a script line end or at a pause, so punctuate `text` where the
   caption should break.

## Pipeline

```sh
PY kit/voice.py  stories/<slug>                                         # align ElevenLabs audio -> timing.json
BLENDER -b --factory-startup --python kit/build.py -- stories/<slug> --stills 0.5,8,20
BLENDER -b --factory-startup --python kit/build.py -- stories/<slug> --final
PY kit/sound.py  stories/<slug>                                         # music + sfx + voice -> mix.wav
PY kit/finish.py stories/<slug> --no-captions                           # -> footage.mp4
PY kit/check.py  stories/<slug> footage.mp4
pnpm --filter @bxy/video-engine whatif:sync <slug>                      # -> public/whatif/<slug>/
```

Then add `{ story: "<slug>", brand: "<brand-slug>" }` to `src/formats/whatif-3d/stories.ts` and open
`pnpm dev:video` → composition `whatif-<brand>-<slug>`.
