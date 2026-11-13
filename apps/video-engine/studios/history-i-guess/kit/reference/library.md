# The drawing library (`renderer/guess.js` + `renderer/globe.js`)

A video's `scenes.js` sets `window.SCENES = [{name, at, draw(T, t)}, ...]`. Every frame, the renderer finds the scene whose `at` is the latest one not after the frame's time `T` and calls `draw(T, t)`, where `t` is the time since the scene started. **A frame is a pure function of time**: no state carried between frames, and every random choice is seeded (`G.rng(seed)`).

The frame is 1080x1920. **Keep everything that matters inside `G.TOP`..`G.BOT` (y 343-1577):** the X cut is that band. `G.CX`, `G.CY` are its centre.

## Time
| Call | Gives |
|---|---|
| `G.L("L3")` / `G.Lend("L3")` | a line's start / end, in seconds |
| `G.w("L6", "low")`, `G.w("L1", "the", 2)` | when a word is said, matched as heard: numbers come as digits ("1969", "10"), "2000" can come as "2" ",000". See `build/timeline.json` |
| `G.cue(x)` | seconds from 3.2, "L3" or ["L6", "low"] |
| `TIMELINE.title_start`, `TIMELINE.duration` | the title card's time, the length |
| `G.pop(T, t0, dur)` | 0 before t0, then a springy 0→1 (scale things in with it) |
| `G.prog(T, t0, dur)` | 0→1 linear; `G.ease.out/in/io/back(k)` shape it |
| `G.on(T, t0)` | T ≥ t0 |
| `G.step(T, t0, every)` | a counter that ticks every `every` s (colour flips in a jingle) |
| `G.fly(T, [[t, {lat, lon, r, cx, cy, roll, day, night}], ...])` | camera keyframes for the globe, eased; zoom eases in log space |

## The globe (the stage)
`const P = G.globe(T, o)` draws the star field and the planet, and returns a projector.

**Options:**
- `lat, lon`: the spot facing the camera.
- `r`: zoom in pixels per radian at that spot. 370-520 shows the whole planet, 900-2000 a region, 6000-12000 a city (140-210 px a degree).
- `cx, cy`: where the planet's centre sits on screen. Push `cy` far down (CY + 1250 with r 2000) for a horizon dome.
- `day` (0..1): 0.13 is "the planet went dark".
- `night` (0..1) with `regions: [{lat, lon, deg, k}]`: city lights by region, `k` 0..1.
- `sun` (0..1): day/night shading.
- `tint: [r, g, b, amount]`: a colour wash, for jingles.
- `hi: "cal"`: a sharp close-up patch (setup makes `cal`, `neus` and `europe`; make more with `textures.py crop NAME lat0 lat1 lon0 lon1`).
- `halo`, `haloFixed`, `haloColor`: the atmosphere rim. For a dark planet use `halo: 0.7, haloFixed: true, haloColor: "125,135,170"`.
- `drift`: star drift.
- `sunDir: [x, y, z]`: where the light comes from (spin it for "sixteen sunrises a day").
- `look: "toon"`: the original's map colours. Bright saturated land and one flat sea colour (`sea`, default `"#2236b4"`, royal blue); no day/night shading. Use it for most maps.
- `back: {kind, colors, ...}`: a colour card behind the planet instead of the star field (see Colour cards).
- `body: "moon"`: draw the Moon instead (NASA's map, no lights or oceans). Two bodies in one frame: draw the farther one first, and the second with `stars: false`.

**Things on the globe**, all at a latitude/longitude, hidden when they're behind the planet:

| Call | Draws |
|---|---|
| `P.pt(lat, lon, h)` | screen `{x, y, vis, s}` (`s` = pixels per earth radius there) |
| `G.dot(P, lat, lon, k, {size, color, glow, ring})` | a glowing place dot |
| `G.label(P, lat, lon, "a zoo", k, {size, dy, style})` | a name label on the spot (use `style: "misprint"` or `"edges"`, size 60-90) |
| `G.arc(P, [la, lo], [la, lo], k, {lift, width, color, glow, from})` | a glowing arc drawn on by k; `from` makes a travelling comet |
| `G.cable(P, [[la, lo], ...], k)` | a line along the sea floor |
| `G.stander(P, lat, lon, h, stickOpts)` | a white stick figure standing on the ground (h = height in earth radii) |
| `G.onGlobe(P, lat, lon, h, (ctx, s) => {...})` | any 2D drawing standing on the ground (cats piling up, phones) |
| `G.sphereWeb(P, lat, lon, k, {reach})` | a web wrapped round the planet |
| `G.scatter(seed, n, [lat0, lat1, lon0, lon1])` | seeded random places |
| `G.offset(lat, lon, dist, bearing)` | a place `dist` degrees away |
| `G.space(seed, drift)` | the star field alone |

## Colour cards (the backgrounds between globe shots)
`G.card(kind, T, o)` fills the whole frame. Draw it first in the scene; it's also what `G.globe`'s `back` draws.

| kind | o |
|---|---|
| `flat` | `color` |
| `grad` | `colors: [a, b]`, `angle` (degrees) |
| `sky` | a blue sky to pale with a sun (`sunX`, `sunY`) |
| `chevron`, `stripes`, `checker`, `dots` | `colors: [base, pattern]`, `size`, `scroll` (px a second) |
| `rings` | `colors`, `size`, `width`, `x`, `y`: circles pulsing out from a point |
| `burst` | `colors`, `n`, `spin`, `x`, `y`: turning rays |
| `plasma` | `speed`: colour-cycling noise, for a held shout ("HOT") |
| `static` | TV noise, for glitches and "the signal's gone" |
| `panels` | `colors: [base, slab, slab, ...]`, `seed`: tilted slabs over a base colour |

`G.PAL` holds the card colours: `magenta`, `violet`, `royal`, `navy`, `sky`, `salmon`, `orange`, `yellow`, `lime`, `green`, `teal`, `pink`, `purple`, `red`, `grey`, `white`.

## Held words and phrase builds
| Call | Does |
|---|---|
| `G.held("L5")`, `G.held("L5", 2)` | the line's held word, `[start, end, word]` as heard, or null; `timeline.py` finds them and stretches the ones marked `"hold"` in script.json |
| `G.stretch("spaaace", x, y, T, t0, t1, {size, color, glow, style, spread, wave})` | the held word in its own colour, letters spreading apart from t0 to t1 (pass the `G.held` times) |
| `G.cta(T, {card, colors, y, size, mascot})` | the optional call to action (script.json `"cta"`, the timeline's last line `"CTA"`): a colour card, the held word stretched, the rest building word by word; `mascot(T, k)` draws a character on top. Scene: `{at: "CTA", draw: (T) => { if (T > G.Lend("CTA") + 0.25) openView(T, T - DUR); else G.cta(T); }}` |
| `G.build(T, "L4", "is", "is it a fruitful sales deal?", x, y, {size, style, edges})` | a phrase that appears word by word as it's said, from that word on; left-aligned on its finished width so words don't shift |

## Text
`G.text(str, x, y, {style, size, color, rot, scale, maxw, align, edges, colors, glow, outline, font, weight, shadow})`. Lines split on `\n`; `maxw` shrinks to fit.

| style | Look | Use for |
|---|---|---|
| `edges` | white, thin dark outline, two thin colour edges out of register (`edges: [up-left, down-right]`) | **all plain lines**: big (110-180 px), in the picture, tilted 2-6° |
| `emboss` | glossy white over a grey bevel (+ optional `edges`) | the big reveal |
| `fuzzy` | colour face in a soft halo (`color`, `glow`) | the "uh oh" line |
| `misprint` | white with three thin colour outlines | labels, lyrics |
| `glow` | neon | a named thing |
| `wordart` | gradient face (`colors`) | once or twice a video |
| `shout` | CAPS, regular weight, pink | a shout |
| `led` | white dots (on a blue card: `G.bg("#1f6bff")`); digits, a-z and `. , ? ! : - ' % @ $ ~ + /` | machines, one big year, prices |
| `extrude` | a stacked fake-3D face | an object made of text (the @) |

The starter's `say(T, t0, text, x, y, size, {e, rot})` wraps `edges` with a pop on the word. **Plain lines go one phrase at a time, in the picture, never as small captions at the top.**

Also: `G.lyric(words, T, t0, every, {styles})` (a sung line, scattered word by word), `G.stamp(year, T, t0, {x, y})` (the corner year box), `G.count(T, t0, t1, a, b)` (a number that runs up), `G.measure(str, o)`.

## Objects
- **3D props** (lit, real materials, soft shadow): `G.prop(name, x, y, size, {rx, ry, rz, screen, shadow, ...})`. The names:
  - `crt`: a beige computer with a keyboard; `screen: (ctx, w, h) => ...` paints its screen, `G.term(lines, {size, color, center})` is a terminal painter;
  - `modem`: `leds: T` blinks the LEDs;
  - `bubble`: a soap film; `film: T` swirls it;
  - `phone`: has a `screen`;
  - `handset`, `laser`;
  - `pot`: `coffee: 0..1` sets the level;
  - `camera`;
  - `cake`: `flame: T` flickers the candles;
  - `sputnik` (a polished ball with four antennas);
  - `rocket`: generic, no markings; `thrust: 0..1` lights the flame (pass `T` for flicker), `legs: 0..1` unfolds landing legs;
  - `station`: a truss, modules and eight solar wings;
  - `lander`: gold descent stage and grey ascent stage; `ascent: 0..6` lifts the top off with its flame;
  - aircraft, all generic and unmarked, nose along +x (turn them with `ry`, pitch with `rz`): `balloon` (an 18th-century hot-air balloon), `biplane` (an early flyer; `spin: T` turns the propellers), `monoplane` (`spin: T`), `jumbo` (a four-engine airliner), `delta` (a supersonic delta-wing jet);
  - money things: `stone` (a stone money wheel), `coin` (gold, stamped), `pizza` (flat, top up), `card` (a plain payment card);
  - sport and old things: `column` (a Greek column), `car` (an early open motor car, `roll` turns the wheels), `medal` (on a ribbon; `tint` 0xe2b43c gold, 0xc9ccd2 silver, 0xb8743a bronze), `apple` (a rotten apple), `podium` (2 | 1 | 3);
  - games, food, chess, cars: `pawn`, `bishop`, `queen`, `king`, `rook` (`tint: 0x222226` for black), `chessboard`, `chocbar`, `microwave` (`glow` 0..1), `pizzabox` (with the little table), `pineapple`, `handheld` (`lcd` colour), `cartridge`, `arcade` (`lcd`), `tricycle` (an 1880s motor tricycle, `roll`), `toilet` (porcelain, lid up; `tint: 0x8a5a2b` for a wooden 1590s one, `0xc7ccd4` for steel).

  `G.propImg(name, o)` renders once to draw many copies. **Add a prop** by adding a builder to `BUILD` in `guess.js`: `M(colour, {rough, metal})`, `rbox`, `rframe`, `rplane`, `taper`, `canvasTex`.
- **2D gags**:
  - `G.stick(x, y, s, {pose, face, head, color})`: poses stand / up / point / hold / sad / walk / sit (on a bench: feet at the floor, hips about 70 px up);
  - `G.bubble(x, y, w, h, txt, {tail, font})`;
  - `G.envelope`, `G.paper`, `G.browser(x, y, w, h, body, {url})`;
  - `G.cat`, `G.elephant`, `G.bills`, `G.burst`, `G.hat`;
  - `G.errorBox(x, y, w, k, "CRASH")`;
  - `G.marker(points, k)`, `G.arrow`, `G.xmark`, `G.scribble`.
- **Moves**: `G.flash(T, t0, colour, 0.08)` (call it last in a scene: a flash frame).

## Patterns that make it read right
- **The cold open:** `G.fly` from `r: 370` to a city in under 2 s, things pop onto the spot on their words, the joke, then a `G.flash` on the punchline.
- **A dive per date:** the line's year goes in `G.stamp`, and the camera flies from the previous place to the new one during the year word.
- **Hold the globe and change the words:** a long line can sit on one view while phrases pop in one after another in different spots.
- **Pin flat drawings to the map** as small cards (the example's zoo player) instead of filling the frame.
- **A card per joke:** a new `G.card` (or a new `back` behind the planet) whenever the subject turns; a phrase builds on it with `G.build`; the punch word is held (`G.stretch`). Then back to the toon map for the next date.
- **The whole world on a card:** the planet small (`r: 380`) in the middle of a patterned card, tinted for a jingle.
- **Something moves in every frame:** the planet spins (`lon: x - t * 6`), stars drift, props turn slowly (`ry: Math.sin(T) * 0.1`).
- **Shake** a scene by offsetting `cx`/`cy` with `Math.sin(t * 90) * 14` for 0.3 s.
