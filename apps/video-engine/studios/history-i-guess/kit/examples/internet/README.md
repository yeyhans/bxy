# Example: "history of the internet, i guess" (69.5 s)

The worked example: 28 spoken lines and 3 jingles, 31 scenes, made with this library.

- `script.json`: the lines, with the cold open (`title_at: "L7"`) and the voice settings.
- `sources.md`: every fact, place and number on screen, with sources.
- `scenes.js`: every scene. Borrow freely:
  - the cold open with the CRASH;
  - a dive per date;
  - email arcs between cities in a jingle;
  - cables on the sea floor;
  - night lights coming on by region;
  - a bubble round the planet;
  - a video card pinned to the map;
  - cats piling up on the planet.
- `sounds.json`: the effect cues.

To render it yourself: copy this folder somewhere, then run `PY <skill>/scripts/narrate.py` (the Kokoro voice), `PY <skill>/renderer/render.py stills`, `PY <skill>/renderer/render.py frames --workers 6`, `PY <skill>/scripts/sound.py`, `PY <skill>/scripts/encode.py` and `PY <skill>/scripts/check.py`. It renders in about 10 minutes on a 6-core CPU.
