# The style: "history of <x>, i guess"

A deadpan, very fast history of one thing, told as a string of tiny jokes over a spinning planet, a few real-looking objects and a lot of big, slightly broken-looking text. Rebuilt for vertical video: a 9:16 master and a 7:8 cut for X.

**The numbers to hit** (measured on six of the format's originals, 5 s to 19 min):
- **Held words:** 3-5 a minute, each 0.5-1.2 s (median 0.6 s).
- **Black space:** 10-42 % of the time.
- **Background changes:** 26-57 a minute. A background lasts 0.2-1.0 s at the median.
- **Colour cards** (flat or patterned): about a quarter of the frames.

`check.py` measures all of these on the finished video.

## 1. The shape of a video
- **20-90 s.** 6-30 short lines; one picture per sentence.
- **A cold open.** The planet is on screen from frame 0. Dive to the first place, land the first joke inside 5 seconds, then cut to the title card (0.9 s, silent but for a sting): `"title_at": "L2"` (or whichever line lands the first joke).
- **Dates drive it.** Most lines start with a year said out loud ("nineteen seventy one."). The year goes in the small grey corner box, and the camera flies to where it happened.
- **A running joke** comes back 2-3 times, a little different each time (in the example: "lo.", the first word on the internet, comes back as the dial-up drops).
- **1-3 jingles** at the turns: the narrator sings one word of the story ("eee-maaail!") over a tiny band, then talks on.
- **The end** circles back to the video itself and lands on "i guess.", then the title card again. For Shorts, the last frame can be the first one (a loop), and the ending can ask a question that frame 0 answers.
- **A call to action, only if wanted:** one short line after the last joke (`"cta"` in script.json, e.g. "subscribe for more, i guess."). It sits on a colour card with its first word held and stretched, lasts 1.5-2 s, and comes before the loop frame. It uses no platform logos and no button imitation.
- **Held words, 3-5 a minute:** one every 12-20 s.
  - **Which word:** the punch word of a joke ("suuupersonic", "spaaace"). About a third land at the end of a phrase, like a sing-song "...and that's it-iiit".
  - **How long:** 0.5-1.2 s, never more than one per line.
  - **In the script:** spell the vowel out for a voice that holds it, or add `"hold": "word"` (or `["word", 0.9]`) to the line. `timeline.py` then stretches that word's vowel for any voice, the free one included, and lists every held word for the scenes.

## 2. The writing
- **All lowercase, flat and fast:** 220-260 words a minute while speaking, with pauses inside a line squeezed to about a quarter of a second.
- **Short sentences.** One fact, then a shrug.
- **The joke devices (structure only; write your own lines):**
  1. Talk to the viewer like a friend: "you're online."
  2. Correct yourself mid-line ("that's the birthday, kind of.").
  3. The anticlimax after something big ("the bubble pops." then "pop.").
  4. Call things by what they literally are ("the big video site").
  5. Piles that speed up, then a flat last item.
  6. A serious fact, then something absurd in the same breath.
  7. A quote, then who said it, as the punchline.
  8. Dialogue with the subject: ask it, it answers, answer back.
  9. A product pitch for a historical event: a problem, a "revolutionary" fix, a side effect.
  10. Understatement: "great start."
- **Facts first.** Every fact is sourced in `sources.md`. Where sources disagree, the line hedges ("apparently", "kind of", "probably") or the fact stays out.
- **Held words are written out in the script** ("then: jeeets.") or marked with `"hold"`.
- **No names or logos needed.** Generic labels do the job: "a physics lab", "the big video site", "a guy". No swearing.

## 3. The picture
- **The stage is the planet:** a real-looking textured Earth (NASA's public-domain maps) on a black star field. It spins, eases into a dive, holds while labels change, and pulls back out. Most of the story happens ON it:
  - glowing arcs between places;
  - cables along the sea floor;
  - city lights coming on region by region;
  - small name labels on the spot;
  - white stick figures standing on it;
  - things piling up all over it.
- **One real-looking thing in every scene:** the planet, a map close-up, or a lit 3D object with some detail (a beige computer, a modem, a soap-film bubble, a phone, a handset, a laser pointer, a glass coffee pot, a cake). Flat drawings are only for text and quick gags (stick figures, envelopes, a party hat, an error dialog, a paper note, a little video player).
- **Colour, not black space.** The original's maps are bright green land on a flat royal-blue sea, and between them sit full-frame saturated cards, changed whenever the joke changes:
  - **Flat cards:** magenta, violet, royal blue, sky, salmon, orange, yellow, teal.
  - **Patterned cards:** chevrons, checkerboards, polka dots, rings, sunbursts, tilted panels, colour-cycling plasma, TV static.
  - **Rules:** use `G.globe(T, {look: "toon", ...})` for maps; put the whole planet on a card (`back: {kind: "chevron", ...}`) for "the whole world" beats; keep the realistic look for space and night scenes; use at least 4 different cards a minute, and never the same card twice in a row.
- **Never a long flat stretch.** A card holds 0.3-1.5 s, while a phrase builds on it. Only the globe holds longer, and only while labels change on it.
- **Cuts are hard and quick.** The picture changes about once a second (a new phrase, a pop, a dive), and 0.08 s flash frames punctuate the big beats (a crash, a pop, a scream).
- **Everything that matters stays inside the middle band** (y 343-1577 of 1080x1920), so the X cut loses nothing.

## 4. The text (the biggest part of the look)
- **Plain words are big and live IN the picture:** lowercase Arimo (Helvetica-type) at regular weight, half the frame wide or more, laid over the globe, map or object, a few degrees off level, one phrase at a time. Phrases can pile up across the map. Never small captions pinned to the top.
- **The edges** (`style: "edges"`): a white face, a thin dark outline, and two thin colour edges out of register, up-left and down-right. The pairs are orange/blue, pink/green, cyan/pink and yellow/purple; rotate them.
- **The emphasis styles rotate per joke beat.** Never the same one twice in a row:
  - `emboss`: a glossy white face over a grey bevel; the big reveal.
  - `fuzzy`: a green face in a soft pink halo; the "uh oh" line.
  - `misprint`: white with three thin colour outlines out of register; labels and lyrics.
  - `glow`: neon.
  - `wordart`: a gradient face; at most once or twice a video.
  - `shout`: CAPS at regular weight, pink with a thin white outline.
  - `led`: white dots on bright blue; for machines, and for one big year.
  - **sung words** scattered word by word (`G.lyric`).
  - small coloured **name labels** on the map (`G.label`).
- **Phrases build word by word** in one spot as they're said (`G.build`): "is it" → "is it a fruitful" → "is it a fruitful sales deal?". Change the card when the subject changes.
- **Held words on screen** (`G.stretch`): the word in its own colour while the voice holds it, its letters spreading apart (written with the vowel repeated: "spaaace"). For a shout, the card under it can cycle colours (`G.card("plasma", T)`).
- **Years:** the small grey corner box carries most of them (`G.stamp`). Use at most 2-3 big year cards per video, each in a different style.
- **Counters** that run up (`G.count`) never pair a number with the wrong year. Show the start year, then "2005 → 2024" while it runs, then the end year.
- **The title card:** Comic Neue Bold, yellow, on a saturated blue card, in three lines: "history of the" / "<thing>" / "i guess".

## 5. The sound
- **Mostly the dry voice, close and flat.** No music bed.
- **The jingles:** the sung word pulled onto a melody, with a little band of e-piano maj9 chords, bass, kick and hats. A bell run closes it. All synthesised.
- **A few effects where something happens:** sting (title), blip (year), pop, swish, whoosh (dives), thud, crash, boing, ding, ticks (counters), modem, disconnect, shimmer, beep, launch, cheer, drumroll (before a reveal), whistle, flush (water rushing away), suck (a vacuum pull with a pop).
- **-14 LUFS** for both cuts.

## 5b. The professional bar (learned on ten Shorts)
- **Pacing that breathes.** 210-240 words a minute while speaking, not faster.
  - Put a real pause before each punchline: `"gap_after": 0.38` on the set-up line.
  - Keep `max_pause` around 0.35.
  - A rushed punchline is a lost punchline.
- **A proper mix.**
  - The voice is always on top. `"music": "bed"` adds a quiet bed, ducked about 10 dB under every word and faded out under the jingles, so keys never clash.
  - Effects get short fades, so there are no clicks.
  - encode.py limits true peak to about -2.5 dB before the AAC encode, so the upload copy stays under -1 dBTP.
- **Crisp at upload size.** The upload copy runs around 1.3 Mbps, so prefer cards that compress cleanly:
  - **Use:** flat, gradients, sunbursts, rings, polka dots, chevrons.
  - **Avoid:** `static`, `plasma` and fine checkerboards for more than a beat. They blur and cost sharpness everywhere else (SSIM 0.985 against 0.993).
- **Smooth motion.** Pops have a small overshoot only. Cameras ease (`G.fly`). Nothing jitters.
- **Loop-safe code.** The last scene draws the opening at negative time (`T - DUR`), so every `%` on time must stay positive: `((x % n) + n) % n`.
- **A clean layout.**
  - Text sits in rows at the top (y 250 / 380 / 520), 2-4 words a row, built word by word.
  - The year box keeps the bottom-left corner (x 70-330, y 1330-1480), so keep props and text out of it.
  - Nothing goes in the button column or the bottom strip (`render.py zones`).
  - The year box stays in that one spot in every scene. When a prop is in the way, move the prop.
- **Text you can read on a phone.**
  - White `edges` text only works on mid or dark cards.
  - On cream, pale sky, yellow or near a sun, pass `color: "#1a1a2e"` with two bright edges (`build(..., e, { color })`, `holdWord(..., { color, edges })`).
  - Keep `G.sun` away from the text rows (below y 600).
  - A dark rounded box behind a small LED label (a speedometer reading) makes it read anywhere.
- **Cut on the words, not on a timer.** A card that flips every half second (`Math.floor(T * 2) % 2`) reads as flicker.
  - Switch the picture on the word that names it: `W_(id, word, n)` for the n-th time a word is said, `G.held(id)` for the held one.
  - The held word is the first match of `"hold"` in the line, so draw the stretched text where `G.held` says, not where you expected it.
- **Brand names in the voice only.** On screen, write the rest of the phrase ("moving" / "assembly line.") and let a map label carry the place. No logos, no brand text.
- **The 1-per-second sheet samples whole seconds**, so anything that alternates on the half second shows one side only. Check those moments with `render.py stills --times 12.5,13.0`.
- **The same opening and ending in every video of a series:**
  - frame 0 is the hook picture with no text, readable as a thumbnail;
  - the same title card;
  - an optional `"cta"` card;
  - then the loop frame.
- **The cover:** the hook frame about 1.5 s in, with a big subject and at most three words.
- **Facts:** two sources a fact in `sources.md`. Contested ones are hedged in the line itself ("probably", "apparently").
- **Before the render:**
  - `check_cues.py`, because a word cue the voice didn't say stops the render;
  - a stills sheet every 1-2 s, then fix every overlap you'd notice on a phone.
- **After the render:** `check.py` (loudness, true peak, black space, background changes, held words), the 1-per-second sheet, and the loop.

## 6. The checks a finished video must pass
1. The planet is on screen at 0 s and the first joke lands before 5 s.
2. Every scene has its one real-looking thing (the planet, a map, a 3D object) or is a colour card under 1.5 s; no still stretch over 2 s.
2b. Black space at most about 40 %, 25+ background changes a minute, 3+ held words a minute (`check.py` measures them).
3. Every plain line is big and in the picture, and the styles rotate.
4. No text off the edge, over the year box, or outside the middle band.
5. Every fact and every number matches `sources.md`.
6. 220-260 wpm, -14 LUFS, X cut under 10 MB.
