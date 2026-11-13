---
name: history-i-guess
description: Make one fast, deadpan "history of <anything>, i guess" video. A textured spinning planet is the stage (NASA's public-domain maps) and the camera dives to every place the story goes. Big lowercase text with misprinted colour edges sits in the picture, with a few real-looking 3D objects, the narrator singing one word per jingle over a tiny synthesised band, and every fact sourced first. It renders on the CPU to a 1080x1920 master and a 7:8 X cut under 10 MB. Use when the user asks for a "history of X, i guess" video, a fast funny history of something on a globe, or types /history-i-guess.
---

# History, I Guess

You make ONE vertical video, 20-90 s, that tells the history of one thing as a string of tiny deadpan jokes.
- **The stage** is a real-looking planet on a black star field. It spins, dives to the place each line is about, and pulls back out.
- **On the planet:** name labels, glowing arcs, cables, city lights, stick figures, and things piling up.
- **The text** is big, lowercase and slightly misprinted, and sits in the picture one phrase at a time.
- **The years** sit in a small grey corner box.
- **The jingles:** one to three, where the narrator sings one word over a tiny band.

All of it is drawn in code. `renderer/guess.js` and `renderer/globe.js` hold the library, and the video's own `scenes.js` holds the scenes. Headless Chrome renders the frames on the CPU. The voice is a free local model (or your own recording), and every sound is synthesised.

**For a polished result** read `reference/style.md` section 5b (the professional bar): natural pacing with pauses before punchlines, the optional ducked music bed (`"music": "bed"`), cards that stay crisp at upload size, loop-safe code, a clean layout, and `scripts/check_cues.py` before every render.

**The three things that make it read as the real format** (measured on the originals):
- **Colour cards, not black space:** a new full-frame card or pattern every second or so, and the planet in its toon map colours.
- **Held words:** 3-5 a minute.
- **Phrases that build word by word.**

`check.py` measures the first two.

Read `reference/style.md` (the format and the checks) and `reference/library.md` (every drawing call) before writing anything. There are four worked examples, each with its sources, script, sound cues and `scenes.js`:
- `examples/internet/`: "history of the internet, i guess", 69.5 s, 31 scenes;
- `examples/coffee/`: "history of coffee, i guess", 20.6 s, 10 scenes, the skill's test run;
- `examples/space/`: "history of space travel, i guess", 52 s, 22 scenes. Built for Shorts: a 1 s hook, safe zones, the Moon, rockets, a station, and a loop where the last frame is the first.
- `examples/olympics/`: "history of the olympics, i guess", 59 s, 23 scenes. **The one to copy for the look:** colour cards and the toon map instead of black space, 5 held words, phrases building word by word; a cold open on the strangest fact, and an ending that asks "and gold goes toooo..." while the loop answers it.

## What comes out
- `out/<slug>_9x16.mp4`: 1080x1920, 30 fps, -14 LUFS (Shorts, Reels, TikTok).
- `out/<slug>_x_7x8.mp4`: 1008x1152 for X, under 10 MB. It is the frame's middle band, which is where every scene keeps its content.
- `out/<slug>_cover.jpg`, `out/<slug>_cover_7x8.jpg`.
- `sources.md`, `qa/report.md`, `qa/sheet.jpg`, `qa/sheet_open.jpg`, `qa/tiles.md`.

## Hard rules
1. **Facts first.** Every fact, date, place and number in the voice or the picture comes from a source you opened today, listed in `sources.md` with the read date. Where sources disagree, the line hedges ("apparently", "kind of", "legend says") or the fact stays out under "Left out".
2. **Your own jokes.** Write every line yourself, using the devices in `reference/style.md`. Never use another creator's lines, lyrics, melodies or voice, and never quote a script.
3. **Drawn and synthesised.** No footage, photos, stock art, downloaded music or effects, and no AI images or video. The one exception is the globe's surface and night lights, which are NASA's public-domain maps that setup downloads.
4. **No brands or logos** on anything drawn, and no real person's likeness. Use generic labels ("a physics lab", "the big video site", "a guy").
5. **English. No swearing, no gore.**
6. **Claude only.** It needs a Claude subscription and the free tools `setup.py` installs. No API keys, accounts or paid services.

## Setup (once per computer)
```
python <skill>/scripts/setup.py
```
`<skill>` is this skill's folder (e.g. `~/.claude/skills/history-i-guess`). Setup installs into `~/.cache/history-guess`:
- a Python venv (numpy, Pillow, imageio-ffmpeg, kokoro-onnx, soundfile, faster-whisper, websockets);
- the Kokoro voice and the faster-whisper timing model;
- the NASA maps, turned into 8K textures plus close-up patches for California, the north-east US and Europe.

It also finds Chrome or Edge. That's about 550 MB and a few minutes the first time. It ends with `PY=...`: **run every script with that Python** (below, `PY`). Python 3.10+ must be installed; if it's missing, give the user the python.org link and wait.

## The steps

**0. Ask, in one message**, what the history is of, and anything they want in it. If they say "you pick", choose something with a clear trail across the map (a food, an invention, a habit, a word), say which in one line, and don't wait at the checkpoints. Then:
```
PY <skill>/scripts/new_video.py <folder> --topic "coffee"
```
It makes `script.json` (the settings and placeholder lines), `sources.md`, `sounds.json` and a starter `scenes.js` (the cold open, the title card, the end card and the helpers). Work inside that folder from now on.

**1. Facts → `sources.md`.** Search and open pages (WebSearch / WebFetch). Prefer museums, universities, archives and agencies. Fill in:
- the fact table;
- **the places**, with latitude and longitude;
- "Left out".

Six to twelve dated beats is plenty for a Short.

**2. The script → `script.json` (checkpoint 1).** Follow `reference/style.md` sections 1-2:
- **Lines:** lowercase, short, fast, one picture per sentence. Most lines open with a year said as words ("nineteen seventy one."). Use a running joke, and land the last line on "i guess.".
- **Jingles:** 1-3, as `{"id": "J1", "sing": "eee-maaail!"}`; add `"sing_say": "email!"` when the stretched spelling reads badly.
- **Held words:** spell the vowel out in `say` ("suuupersonic") and add `"hold": "supersonic"` to the line; 3-5 a minute. Number words work too (`"hold": "eight"` finds a heard "8"). The hold goes to the first match in the line, so don't repeat that word earlier in it.
- **A call to action (optional, off unless asked):** `"cta": "subscribe for more, i guess."` in script.json adds one last spoken line, about 1.5-2 s, after the last joke and before the loop frame. Draw it with `G.cta(T)` in a scene at `"CTA"`; `new_video.py` adds that scene when the setting is there. Only add it when the person asks, since it's their channel. Keep it to one short line in the video's own voice, with no platform logos or button look-alikes.
- **The cold open:** set `"title_at"` to the line that lands the first joke, so the title card comes right after it, inside 5-8 s.

Show the user the lines and the key sources; on "you pick" or "go", carry on. Then run this and fix every FAIL:
```
PY <skill>/scripts/check_script.py
```

**3. The voice:**
```
PY <skill>/scripts/narrate.py
```
It reads every line with the free Kokoro voice, then builds `build/timeline.json`: it trims each line, squeezes pauses to `max_pause`, times every word with faster-whisper, lays the lines end to end with the title card, and finds the sung notes. It prints the length, the pace and what it heard. Aim for 220-260 words a minute while speaking; change `voice.speed` (1.25 by default) and run it again. To use your own voice, record each line as `takes/<id>.m4a` and run `PY <skill>/scripts/import_voice.py`.

**4. Close-ups.** Every place you dive into closer than about `r: 3000` needs a sharp patch unless California, the north-east US or Europe already covers it. Run this once per region and use it as `hi: "redsea"` in `G.globe`:
```
PY <skill>/scripts/textures.py crop redsea 5 35 25 50
```
The arguments are a name, then lat0 lat1 lon0 lon1, about 20° on a side.

**5. The style board (checkpoint 2).** Write the cold open and two other scenes in `scenes.js` with the patterns in `reference/library.md`:
- the planet from frame 0;
- a dive per date;
- plain lines as big `edges` text in the picture, one phrase at a time, tilted;
- one emphasis style per joke beat, never the same twice in a row;
- one real-looking thing per scene.

Then render one frame per scene (about 10 s):
```
PY <skill>/renderer/render.py stills
```
Open `build/stills_sheet.jpg`; the red lines mark the X band. For exact moments use `render.py stills --times 3.2,4.9`. Show the user the board; on "you pick" or "go", carry on.

**6. Every scene, the sound, the render.**
- **Write the other scenes**, and the effect cues in `sounds.json`: `[cue, sound, gain_db]` with the sounds listed in `scripts/sound.py`; `"TITLE"` is the title card.
- **Check the stills again:** look for text off the edge or over the year box, and for any flat stretch.
- **Then render, mix and encode:**
```
PY <skill>/renderer/render.py frames --workers 6
PY <skill>/scripts/sound.py
PY <skill>/scripts/encode.py
```
The frames take about 0.3 s each per worker (about 10 minutes for 70 s on 6 workers).

**For YouTube Shorts, TikTok or Reels:** the platforms draw over the bottom 20 %, the top 140 px and a button column on the right (x 930-1080, y 880-1520). Keep every text out of them, and check before the full render:
```
PY <skill>/renderer/render.py zones --preset shorts
```
It draws every 2nd frame without pictures (a minute for a 50 s video) and lists every text that touches a zone or leaves the frame, with times. `--preset x` checks the 7:8 band instead. A small `put(txt, x, y, o)` helper that narrows `maxw` to the room at that spot (see `examples/space/scenes.js`) makes this easy.

**A loop:** Shorts replay. If the last scene draws the first scene's picture at "loop time" `T - TIMELINE.duration` (the same planet angle and the same moving object), and its text fades out before the end, the last frame is the first frame.

**7. Check:**
```
PY <skill>/scripts/check.py
```
It checks loudness, the X size, the pace, a lit first frame and still stretches, and writes the two contact sheets. **Open both sheets and judge every tile**, one line each, in `qa/tiles.md` (for example "4.5 s: ok, giant LED 'lo' over the map, the year box clear"). Look for:
- a word on screen before it's said;
- text cut off at an edge, or over the year box;
- a flat stretch with no planet or 3D object;
- a scene where nothing moves;
- the same text style twice in a row;
- anything that contradicts `sources.md`.

Fix, then re-draw just the frames that changed with `render.py frames --only 300-360,800-840` (frame = seconds x 30), then encode and check again. Done means no FAIL, every LOOK explained and every tile ok.

**8. Deliver** both videos, the covers, the fact table with what was left out, `qa/report.md`, and how long the run took. Tell the user to listen once with sound on: you can't hear the mix.

## Gotchas
- **The years are said as words but heard as digits.** "nineteen seventy one" shows up in `timeline.json` as "1971.", so cue it as `G.w("L8", "1971")`. "two thousand" can come back as "2" and ",000"; cue `"2"`. Open `build/timeline.json` and copy the words exactly as heard.
- **A word said twice:** `G.w("L1", "the", 2)`.
- **The zoom `r` is pixels per radian at the facing spot,** not the planet's outline radius. 370 shows the whole planet; 9000 is a city.
- **The X band:** keep everything between `G.TOP` and `G.BOT` (y 343-1577). Big text needs `maxw: 1010` and a few degrees of tilt at most, or its corners leave the frame.
- **Stamps collide with bottom-row text:** move the year box (`G.stamp(year, T, t0, {x: G.W - 330, y: G.TOP + 10})`) when a phrase sits bottom-left.
- **A scene starting at the same time as another:** the later one in the list wins.
- **`G.flash` goes last** in a scene so it covers everything.
- **Frames are cached** while `scenes.js`, `timeline.json` and the renderer are unchanged. Any edit renders everything again unless you use `--only`.
- **Kokoro reads digits badly**, so `check_script.py` fails any digit in a spoken line.
- **Sung words from a speaking voice:** `timeline.py` treats the whole word as one note when it can't find held notes, so the band still plays its chord.
- **Windows long paths:** keep `HISTORY_GUESS_HOME` short (the default is fine).

## How long it takes
Measured on the test run, "history of coffee, i guess" (20.6 s, `examples/coffee/`), made after a fresh setup on a 6-core desktop CPU with no GPU:
- setup: 51 s on a fast connection (about 550 MB);
- facts and script: about 10 minutes;
- voice and timeline: 15 s;
- scenes and two stills rounds: about 10 minutes;
- render: 2.5 minutes (618 frames, 6 workers);
- sound, encode and check: under a minute;
- the tile review and one fix: 3 minutes (227 frames re-drawn with `--only` in 65 s).

That run came from a session that already knew the library. For a first video in a fresh session, budget 45-90 minutes for 20-30 s, and 2.5-4 hours for a 70 s video like the internet example, whose render alone is about 10 minutes.

## Credits
The format is a genre of internet history video: a deadpan, very fast history told over a spinning planet with big misprinted text and sung jingles. This skill describes that style and rebuilds it from scratch. Every line, drawing, melody and sound in it is new.
- Earth maps: NASA Earth Observatory, Blue Marble Next Generation and Black Marble 2016 (public domain).
- three.js (MIT), Kokoro-82M (Apache-2.0), faster-whisper (MIT).
- Arimo, Comic Neue and VT323 (SIL Open Font License, in `fonts/`).
