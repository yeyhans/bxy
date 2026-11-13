# Example: "history of space travel, i guess" (51.9 s, built for Shorts)

A Short with:
- a 1 s hook (the first satellite just beeps, and that's it);
- the title card after the first joke;
- a dog, a capsule going once round the planet, and the camera flying from the Earth to the Moon;
- a flag that blows over, a fly-past of the Moon, a station lapping the planet sixteen times a day;
- a rocket landing standing up, giant chopsticks;
- a counter for the reveal;
- a loop: the last frame is the first.

What it shows:
- **`put()`**, which keeps every text out of the platforms' overlays. Check with `render.py zones --preset shorts`.
- **The Moon as a second body:** `G.globe(T, {body: "moon", ...})`.
- **The new props:** `sputnik`, `rocket` (`thrust`, `legs`), `station` and `lander` (`ascent`).
- **`sunDir`** for sixteen sunrises.
- **The loop:** `openView(T, T - DUR)`.

It needs two extra close-up patches:

    PY <skill>/scripts/textures.py crop russia 36 62 26 74
    PY <skill>/scripts/textures.py crop gulf 18 38 -108 -68

The original was recorded in a different voice and imported with `import_voice.py`. With `narrate.py` the free Kokoro voice reads the same script, and the timings change, so check the cue words in `build/timeline.json` first (whisper heard "laika" as "Lika" and "beep" as "beat").

Machine time: the render took 5.1 minutes on 6 workers (1,557 frames) and the zone check about a minute.
