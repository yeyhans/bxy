# Example: "history of coffee, i guess" (20.6 s)

The skill's test run, made from the README in one pass after a fresh setup. It has 7 spoken lines and 1 jingle, the free Kokoro voice, and 10 scenes:
- a cold open on the planet;
- a dive to Ethiopia with a dancing goat;
- Yemen at night;
- a jingle with the 3D pot;
- Mecca's ban with a flash frame;
- an arc from Cairo;
- London;
- pots piling up all over the planet.

It needs one extra close-up patch, which is the first command below.

    PY <skill>/scripts/textures.py crop redsea 2 36 24 52
    PY <skill>/scripts/narrate.py
    PY <skill>/renderer/render.py frames --workers 6
    PY <skill>/scripts/sound.py
    PY <skill>/scripts/encode.py
    PY <skill>/scripts/check.py

Machine time: 15 s for the voice, 2.5 min to render on 6 workers, under a minute for sound, encode and check.
