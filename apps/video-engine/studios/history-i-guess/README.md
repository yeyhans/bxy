# History, I Guess: a free Claude Code skill for "history of <anything>, i guess" videos

Say **"make a history of coffee, i guess video"** and Claude makes a fast, deadpan, 20-90 second vertical video of the whole history of it:
- **a spinning planet as the stage:** NASA's Earth maps, in bright cartoon-map colours (green land, a flat royal-blue sea) or real-looking with city lights at night. The camera dives to every place the story goes and pulls back out;
- **saturated colour cards between the maps:** a new full-frame colour or pattern (sunbursts, chevrons, checkerboards, polka dots, rings, colour-cycling plasma, TV static) every time the joke turns, about 25 times a minute;
- **jokes on the map:** name labels, glowing arcs between cities, cables on the sea floor, lights coming on region by region, little stick figures, and things piling up all over the planet;
- **big lowercase text in the picture,** phrases building word by word as they're said, in misprinted colour edges, glossy emboss, neon, LED dots and loud pink caps;
- **held words:** 3-5 a minute the narrator drags one out ("suuupersonic"), and on screen its letters spread apart while it's held. Mark a word in the script and it works with any voice, the free one included;
- **real-looking 3D objects** where the story needs one: a beige 90s computer, a modem, a soap-film bubble, a phone, a coffee pot;
- **1-3 jingles:** the narrator sings one word of the story over a tiny band, all synthesised;
- **the facts first:** Claude searches the web, keeps a sources file with read dates, and leaves out or hedges anything it can't verify.

No footage, no stock art, no AI images or video, no downloaded music. Every frame is drawn in code and every sound is synthesised. The only outside imagery is NASA's public-domain Earth maps on the globe.

You get a 1080x1920 master for Shorts, Reels and TikTok, a 1008x1152 cut for X under 10 MB, two covers, the sources and a check report.

**Examples:** `examples/internet_cover.jpg` is from "history of the internet, i guess" (69.5 s), and `examples/coffee_cover_7x8.jpg` from "history of coffee, i guess" (20.6 s, the skill's test run). `examples/olympics_cover.jpg` is from "history of the olympics, i guess" (59 s), the example in the colour-card style. Their scripts, sources and scenes are in `history-i-guess/examples/`.

## What you need

A Claude subscription (Claude Code comes with Pro and Max). Nothing else: no other accounts, no API keys, no paid tools and no graphics card.

The first time you use it, Claude Code installs these free tools:
- **a Python environment** in `~/.cache/history-guess` with numpy, Pillow, imageio-ffmpeg (ffmpeg), kokoro-onnx, faster-whisper and websockets;
- **the Kokoro-82M voice** (Apache-2.0) and the faster-whisper base.en timing model (MIT);
- **NASA's Blue Marble and Black Marble Earth maps** (public domain), turned into 8K textures;
- **a browser to draw the frames in:** Google Chrome or Microsoft Edge if you have one, or else Playwright's free Chromium.

That's about 550 MB in all. Python 3.10 or newer must be on the computer (python.org).

## Install

Copy the `history-i-guess` folder into `~/.claude/skills/` (on Windows: `C:\Users\<you>\.claude\skills\`). That's all.

## Make a video

1. Make an empty folder and open Claude Code in it.
2. Say **"make a history of ..., i guess video"** with the thing, or "you pick".
3. Claude finds the facts and the places, writes the jokes and shows you the script. Say "go", or give notes.
4. Claude records the voice with the free local model (or you record the lines yourself) and draws three scenes for you to approve.
5. Claude draws every scene and renders on your CPU: about 2.5 minutes for a 20-second video, or 10 minutes for 70 seconds, on a normal 6-core computer. It mixes the sound and checks the result:
   - a contact sheet it judges tile by tile;
   - the first 6 seconds frame by frame;
   - still stretches;
   - the pace;
   - loudness;
   - the X file size.
6. You get `out/<name>_9x16.mp4`, `out/<name>_x_7x8.mp4`, two covers, `sources.md` and `qa/report.md`.

A 20-30 second video takes about 45-90 minutes end to end, almost all of it Claude's work. A 70-second one takes 2.5-4 hours.

## What's in it

- `history-i-guess/SKILL.md`: the steps and rules Claude follows.
- `history-i-guess/reference/style.md`: the format, which covers the shape of a video, the writing, the picture, the text styles, the sound and the checks.
- `history-i-guess/reference/library.md`: every drawing call, with the patterns that make it read right.
- `history-i-guess/renderer/`:
  - `guess.js`: text styles, 2D gags, lit 3D props;
  - `globe.js`: the planet and everything that sits on it;
  - `render.py`: headless Chrome, frame by frame, CPU only;
  - `vendor/three.min.js`: three.js r128, MIT.
- `history-i-guess/scripts/`:
  - `setup.py`, `new_video.py`, `check_script.py`;
  - `narrate.py`: the voice;
  - `import_voice.py`: your own voice instead;
  - `timeline.py`, `textures.py`;
  - `sound.py`: the jingles and effects;
  - `encode.py`: both cuts;
  - `check.py`: the checks and the contact sheets.
- `history-i-guess/fonts/`: Arimo, Comic Neue, VT323 (SIL OFL).
- `history-i-guess/examples/`: four worked examples (internet, coffee, space travel, the olympics).

## License

The code is MIT (see `LICENSE`). The fonts are SIL OFL 1.1 (`fonts/OFL.txt`) and three.js is MIT (`renderer/vendor/three.LICENSE.txt`). The Earth maps are NASA's, public domain; credit "NASA Earth Observatory".
