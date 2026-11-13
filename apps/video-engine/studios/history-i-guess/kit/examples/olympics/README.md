# Example: "history of the olympics, i guess" (59 s, built for Shorts, in the colour-card style)

A Short with a different shape from `space/`:
- **A cold open:** the strangest fact first. In 1904 the marathon winner is fed rat poison, on purpose. Then the title card, then "ok, from the start" with a VHS rewind back to 776 BC.
- **A callback:** at 1904 the story returns to that marathon for the rest of it: a man in a car, rotten apples and a nap.
- **Set-pieces:**
  - a stadium with marble columns and oiled runners;
  - a car driving past the runners to a finish banner;
  - a tug of war across the planet (the sung jingle);
  - a podium.
- **An ending that asks and doesn't answer:** "the podium for weirdest olympian: bronze, silver, and gold goes to..." Then the cut back to frame 0, so the loop gives the answer.

**The colour-card style:** this is the example to copy for the look. There is no black space: maps are in `look: "toon"`, and a new card (`G.card`: sunbursts, dots, checkerboards, rings, stripes, chevrons) comes in whenever the joke turns, 21 times a minute. Five held words ("naaaked", "nothiiing", "a naaap", "it's ouuut", "toooo...") are marked with `"hold"` in script.json and drawn with `G.stretch` while the voice holds them.

What it shows:
- **A cold open** with `title_at` set to the second line.
- **The year box counting:**
  - backwards while the globe rewinds: `G.count(T, t0, t1, 1904, -776, fmt)`;
  - forwards across a gap: `393` to `1896`.
- **The new props:**
  - `column`;
  - `car` (`roll` turns the wheels);
  - `medal` (`tint`: gold, silver, bronze);
  - `apple`;
  - `podium`.
- **New sounds:** `whistle` and `drumroll`.
- **A zoom into part of the picture:** two nested `G.withT` calls scale the podium around one point.

It needs two extra close-up patches (plus `europe` from the first setup):

    PY <skill>/scripts/textures.py crop greece 34 44 18 30
    PY <skill>/scripts/textures.py crop midwest 32 46 -100 -80

The original was recorded in a different voice and imported with `import_voice.py`. With `narrate.py` the timings change, so check the cue words in `build/timeline.json` first. Whisper heard "fourth" as "forth", and the cues use that spelling.

No footage, no stock art, no logos (no Olympic rings), no AI images or video. Every frame is drawn in code and every sound is synthesised. The only outside imagery is NASA's public-domain Earth maps on the globe.
