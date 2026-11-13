# history-i-guess studio (BxY)

Code-drawn studio for fast, deadpan "history of ___, i guess" vertical videos (20-90 s): a spinning
planet, colour cards, big text in the picture, synthesised jingles. Frames are drawn in headless
Chrome on the CPU. Format rules, steps, drawing calls and checks come from the upstream kit (MIT,
see `LICENSE`):

- `kit/SKILL.md`: the steps and hard rules.
- `kit/reference/style.md`: the format (shape, writing, picture, text styles, sound, checks).
- `kit/reference/library.md`: every drawing call.
- `kit/examples/`: four worked examples (`olympics` is the one to copy for the look).

Follow them, **with the BxY overrides below. Overrides win.**

## BxY overrides

1. **Layout:** one folder per video in `stories/<story-slug>/` (lowercase kebab-case). The kit lives in
   `kit/` (it is not installed in `~/.claude/skills/`); wherever the kit says `<skill>`, read `kit`.
   Run every command from this studio folder.
2. **Local tooling:** `python kit/scripts/setup.py` installs outside the repo, in `~/.cache/history-guess`
   (venv, voice and timing models, NASA maps; about 550 MB). It prints `PY=...`: use that Python.
3. **Text is part of the picture.** Unlike whatif-3d, this format burns its text into the frames, so
   Remotion adds **no captions**: only the brand tag. Keep the footage brand-neutral (kit hard rule 4:
   no brands, no logos, no real person's likeness).
4. **Brand tag zone:** Remotion draws the tag at the top-left (x 56-420, y 72-130). Keep scene text and
   the year box out of it.
5. **Facts first still applies** (kit hard rule 1): every fact, date and place goes in
   `stories/<slug>/sources.md` with the read date. No commercial or product claims in the narration.
6. **Language: Spanish (es-CL) by default.** The kit carries a BxY port, opt-in per story through
   `script.json` (English stories and the upstream examples behave as before):
   - Start a story with `PY kit/scripts/new_video.py stories/<slug> --topic "<tema>" --lang es`. It sets
     `"lang": "es"`, the title `historia de <tema>, supongo` (fix the article by hand: `del café`) and the voice
     `{"engine": "edge", "voice": "es-CL-LorenzoNeural", "speed": 1.15, "sing_speed": 0.8}`.
   - **Voice:** `edge` is Microsoft Edge online TTS (free, needs network), the same fallback voice as
     whatif-3d. For ElevenLabs or a human read, save each line as `takes/<id>.mp3` and run
     `PY kit/scripts/import_voice.py stories/<slug>` instead of `narrate.py`.
   - **Timing:** word timing uses the multilingual `whisper-small` model, downloaded once into
     `~/.cache/history-guess/models` on the first Spanish run (`"whisper": "base"` in `script.json` picks a smaller one).
   - **Tag word:** the last line and the title land on `supongo` (the Spanish "i guess"); `"tag"` in
     `script.json` changes it. The end-card cue in `scenes.js` uses the same word.
   - **Writing:** lowercase, numbers as words (`mil novecientos setenta y uno`); heard years come back as
     digits (`1971`), so copy cue words from `build/timeline.json` as heard. Held words stretch a vowel
     (`suuupersónico` + `"hold": "supersónico"`). Pace window for Spanish: 165-230 words a minute.
   - **Spoken flow:** deadpan, but each line still follows from the previous one (`y entonces`, `pero`,
     `así que`, `mientras tanto`). No line may read as an isolated fact.
   - Changed kit files: `scripts/common.py`, `narrate.py`, `timeline.py`, `check_script.py`, `check.py`,
     `check_cues.py`, `new_video.py`, `setup.py`, `renderer/guess.js`. Word matching now keeps `áéíóúüñ`.
   - Not yet run end to end in Spanish: the first Spanish story is the test. Check accents in the three
     fonts on the style board before the full render.
7. **Master only:** the deliverable for Remotion is `out/<name>_9x16.mp4`. The 7:8 X cut and the covers
   stay in the story folder.

## Pipeline

```sh
PY kit/scripts/new_video.py stories/<slug> --topic "<topic>"   # script.json, sources.md, sounds.json, scenes.js
PY kit/scripts/check_script.py stories/<slug>
PY kit/scripts/narrate.py stories/<slug>                        # voice + build/timeline.json
PY kit/renderer/render.py stories/<slug> stills                 # style board, look before the full render
PY kit/scripts/check_cues.py stories/<slug>
PY kit/renderer/render.py stories/<slug> frames --workers 6
PY kit/scripts/sound.py stories/<slug>
PY kit/scripts/encode.py stories/<slug>                         # -> out/<name>_9x16.mp4
PY kit/scripts/check.py stories/<slug>                          # no FAIL, every LOOK explained
pnpm --filter @bxy/video-engine history:sync <slug>             # -> public/history/<slug>/
```

Then add `{ story: "<slug>", brand: "<brand-slug>" }` to `src/formats/history-i-guess/stories.ts` and open
`pnpm dev:video` → composition `history-<brand>-<slug>`.
