"""sound.py: the soundtrack, all synthesised: the voice, the sung jingles (snapped to their notes, with a small jazzy
band under them), and the few sound effects from PROJECT/sounds.json.

    PY sound.py [PROJECT]          -> PROJECT/build/mix.wav (48 kHz stereo, not yet loudness-normalised)

script.json "music": "bed" adds a quiet music bed in D major (e-piano, bass, soft kick and hats, 100 bpm) under the whole
video: ducked about 10 dB whenever the voice speaks, faded out under the sung jingles (so keys never clash), faded in and
out at the ends so a loop doesn't click. Leave it out for the original's dry voice.
    PY sound.py --demo OUT.wav     -> every sound effect and a jingle, one after another, to listen to

sounds.json: [[cue, sound, gain_db], ...]; cue = "L3" (line start), ["L6", "low"] (a word, as heard) or seconds.
Sounds: sting, blip, crash, thud, pop, swish, modem, ding, tick, ticks, disconnect, boing, shimmer, whoosh, cheer, beep, launch.
The format is mostly the dry voice: use a sound only where something happens (a crash, a pop, a year card).
"""
import json, os, re, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import load_audio, write_wav, norm_word, project_args  # noqa: E402
from timeline import trim  # noqa: E402

SR = 48000
RNG = np.random.default_rng(7)
SPEECH_RMS = 0.16      # the voice, measured over its words
JINGLE_RMS = 0.14      # a sung line with its band: about as loud as the talking around it


def tt(d):
    return np.arange(int(d * SR)) / SR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def ftom(f):
    return 69 + 12 * np.log2(f / 440.0)


def place(buf, x, t, gain=1.0):
    a = int(t * SR)
    if a < 0:
        x = x[-a:]; a = 0
    b = min(len(buf), a + len(x))
    if b > a:
        buf[a:b] += x[: b - a] * gain


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):          # short sounds only
        acc = (1 - a) * x[i] + a * acc; y[i] = acc
    return y


def lp_fast(x, cutoff):
    """one-pole lowpass via FFT magnitude shaping (for long noise)."""
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / cutoff) ** 2)
    return np.fft.irfft(X, len(x))


def hp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (f / cutoff) / np.sqrt(1 + (f / cutoff) ** 2)
    return np.fft.irfft(X, len(x))


# ---------------- instruments ----------------
def epiano(m, dur, vel=0.5):
    f = mtof(m); t = tt(dur + 0.8)
    I = 1.6 * np.exp(-t * 3.0) + 0.25
    y = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * t))
    y += 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 5)
    amp = np.exp(-t * 1.2) * (1 - np.exp(-t * 300))
    rel = np.clip((dur + 0.8 - t) / 0.8, 0, 1)
    return y * amp * rel * vel * (1 + 0.08 * np.sin(2 * np.pi * 4.6 * t))


def bass(m, dur, vel=0.6):
    f = mtof(m); t = tt(dur + 0.2)
    y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    amp = np.exp(-t * 2.2) * (1 - np.exp(-t * 400)) * np.clip((dur + 0.2 - t) / 0.2, 0, 1)
    return y * amp * vel


def bell(m, dur=0.9, vel=0.35):
    f = mtof(m); t = tt(dur)
    y = np.sin(2 * np.pi * f * t + 2.4 * np.exp(-t * 5) * np.sin(2 * np.pi * 3.5 * f * t))
    return y * np.exp(-t * 3.2) * (1 - np.exp(-t * 600)) * vel


def kick(vel=0.9):
    t = tt(0.35); f = 45 + 95 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) * vel


def snare(vel=0.5):
    t = tt(0.25); n = RNG.standard_normal(len(t))
    n = np.diff(n, prepend=0) * 0.5
    return (n * np.exp(-t * 22) + 0.5 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)) * vel


def hat(vel=0.18, open_=False):
    t = tt(0.3 if open_ else 0.08); n = RNG.standard_normal(len(t))
    n = np.diff(np.diff(n, prepend=0), prepend=0) * 0.25
    return n * np.exp(-t * (14 if open_ else 70)) * vel


def reverb(x, secs=0.9, wet=0.25, seed=3):
    r = np.random.default_rng(seed)
    t = tt(secs)
    ir = r.standard_normal((len(t), 2)) * np.exp(-t * 5.5)[:, None]
    ir[:, 0] = lp_fast(ir[:, 0], 5000); ir[:, 1] = lp_fast(ir[:, 1], 5000)
    n = len(x) + len(t)
    X = np.fft.rfft(x, n)
    out = np.stack([np.fft.irfft(X * np.fft.rfft(ir[:, c], n), n) for c in range(2)], 1)[: len(x)]
    out *= wet / (np.abs(out).max() + 1e-9) * (np.abs(x).max() + 1e-9)
    return np.stack([x, x], 1) * (1 - wet * 0.3) + out


# ---------------- sound effects ----------------
def sfx(name):
    t = None
    if name == "sting":                         # title: a soft chord stab and a bell run up
        y = np.zeros(int(1.2 * SR))
        for m in (62, 66, 69, 73, 76):
            place(y, epiano(m, 0.6, 0.18), 0)
        for i, m in enumerate((74, 78, 81, 85)):
            place(y, bell(m, 0.6, 0.12), 0.05 + i * 0.07)
        return y
    if name == "blip":                          # year card
        t = tt(0.12); f = 700 + 900 * t / 0.12
        return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.08 * np.exp(-t * 18)
    if name == "crash":
        t = tt(0.9); n = RNG.standard_normal(len(t))
        y = lp_fast(n, 2500) * np.exp(-t * 4.5) * 0.6
        k = kick(1.0); y[: len(k)] += k
        return y
    if name == "thud":
        return np.pad(kick(1.0), (0, 2000)) * 0.9
    if name == "pop":
        t = tt(0.12); f = 1200 * np.exp(-t * 30) + 180
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * 0.7
    if name in ("swish", "whoosh"):
        d = 0.35 if name == "swish" else 0.6
        t = tt(d); n = RNG.standard_normal(len(t))
        env = np.sin(np.pi * t / d) ** 2
        return hp_fast(lp_fast(n, 3000 if name == "swish" else 1800), 300) * env * 0.35
    if name == "modem":                         # our own handshake: answer tone, warbles, hiss, chirps
        y = np.zeros(int(1.9 * SR)); t1 = tt(0.3)
        place(y, np.sin(2 * np.pi * 2100 * t1) * 0.18, 0)
        t2 = tt(0.4); place(y, np.sin(2 * np.pi * (1650 + 330 * np.sign(np.sin(2 * np.pi * 25 * t2))) * t2) * 0.15, 0.32)
        t3 = tt(0.9); n = RNG.standard_normal(len(t3))
        hiss = hp_fast(n, 900) * 0.12 * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 11 * t3)))
        chirp = np.sin(2 * np.pi * np.cumsum(1200 + 900 * np.sin(2 * np.pi * 3 * t3)) / SR) * 0.08
        place(y, hiss + chirp, 0.75)
        y[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))
        return y
    if name == "ding":
        return bell(88, 1.0, 0.3) + bell(95, 1.0, 0.12)
    if name == "beep":                          # a radio beep: a clean tone with a soft attack and a tiny echo
        t = tt(0.32); env = np.clip(t / 0.01, 0, 1) * np.clip((0.2 - t) / 0.02, 0, 1)
        y = np.sin(2 * np.pi * 1040 * t) * 0.22 * env
        y[int(0.09 * SR):] += y[: len(y) - int(0.09 * SR)] * 0.25
        return y
    if name == "launch":                        # a rocket: a low rumble that swells and fades, with crackle
        t = tt(2.4); n = RNG.standard_normal(len(t))
        env = np.clip(t / 0.25, 0, 1) * np.exp(-np.maximum(t - 0.6, 0) * 1.6)
        rum = lp_fast(n, 180) * 3.0 + lp_fast(n, 900) * 0.5
        crk = hp_fast(n, 2000) * (RNG.random(len(t)) < 0.004) * 1.5
        return (rum + crk) * env * 0.35
    if name == "tick":
        t = tt(0.03); return RNG.standard_normal(len(t)) * np.exp(-t * 250) * 0.15
    if name == "ticks":                          # a burst of typing
        y = np.zeros(int(0.9 * SR))
        for i in range(9):
            place(y, sfx("tick"), i * 0.09 + RNG.uniform(0, 0.02), RNG.uniform(0.6, 1.0))
        return y
    if name == "disconnect":                    # three falling tones
        y = np.zeros(int(1.0 * SR))
        for i, f in enumerate((1800, 1400, 950)):
            tt_ = tt(0.26); place(y, np.sin(2 * np.pi * f * tt_) * 0.12 * np.clip((0.26 - tt_) / 0.03, 0, 1), i * 0.28)
        return y
    if name == "boing":
        t = tt(0.5); f = 180 + 120 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 5)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * 0.4
    if name == "shimmer":                       # in D, like the bed, the sting and the cheer
        y = np.zeros(int(1.2 * SR))
        for i, m in enumerate((86, 90, 93, 98, 102)):
            place(y, bell(m, 0.7, 0.1), i * 0.06)
        return y
    if name == "drumroll":                      # a snare roll that speeds up and swells (1.5 s), for "and the winner is..."
        y = np.zeros(int(1.6 * SR)); t0 = 0.0; i = 0
        while t0 < 1.45:
            place(y, snare(0.22 + 0.3 * t0 / 1.45), t0, 1.0)
            t0 += max(0.035, 0.11 - 0.05 * t0); i += 1
        return y * 0.8
    if name == "whistle":                       # a referee's whistle: a trilled high tone
        t = tt(0.45); f = 2900 + 160 * np.sign(np.sin(2 * np.pi * 28 * t))
        env = np.clip(t / 0.02, 0, 1) * np.clip((0.45 - t) / 0.06, 0, 1)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) + hp_fast(RNG.standard_normal(len(t)), 2500) * 0.15) * env * 0.12
    if name == "cheer":                         # a small "ta-da"
        y = np.zeros(int(1.0 * SR))
        for m in (67, 71, 74, 79):
            place(y, epiano(m, 0.5, 0.15), 0.12)
        place(y, epiano(72, 0.1, 0.12), 0); place(y, epiano(76, 0.1, 0.12), 0)
        return y
    if name == "flush":                         # a toilet flush: a rush of water that swells, swirls and gurgles away (1.4 s)
        t = tt(1.4); n = RNG.standard_normal(len(t))
        env = np.clip(t / 0.08, 0, 1) * np.exp(-np.maximum(t - 0.35, 0) * 2.4)
        swirl = 0.75 + 0.25 * np.sin(2 * np.pi * (3 + 4 * t) * t)
        y = (lp_fast(n, 1400) * 0.8 + hp_fast(lp_fast(n, 4000), 1200) * 0.25) * env * swirl * 0.5
        for i in range(10):                      # bubbles at the end
            b = tt(0.06); f = RNG.uniform(500, 900) * np.exp(-b * 8)
            place(y, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-b * 50) * 0.05, 0.75 + i * 0.06 + RNG.uniform(0, 0.03))
        return y
    if name == "suck":                          # a vacuum pull: air that rises in pitch and stops with a small pop (0.7 s)
        d = 0.7; t = tt(d); n = RNG.standard_normal(len(t))
        lo = lp_fast(n, 900); hi = lp_fast(n, 3500)
        k = (t / d) ** 2
        y = hp_fast(lo * (1 - k) + hi * k, 250) * np.clip(t / 0.4, 0, 1) ** 1.5 * 0.4
        y[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
        return np.concatenate([y, sfx("pop") * 0.5])
    raise SystemExit("unknown sound: %s" % name)


def fades(x, a=0.003, b=0.012):
    """short fade in/out so nothing starts or stops mid-wave (no clicks)"""
    x = np.array(x, np.float32, copy=True); na, nb = min(len(x), int(a * SR)), min(len(x), int(b * SR))
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x


# ---------------- the music bed ----------------
BED_CHORDS = [(50, (62, 66, 69, 73, 76)), (47, (62, 66, 69, 71, 73)), (43, (62, 66, 67, 71, 74)), (45, (61, 64, 66, 69, 71))]   # Dmaj9 Bm9 Gmaj9 A6/9


def bed(dur, bpm=100):
    """a soft lo-fi loop in D major, 4 bars (I-vi-IV-V), tiled to `dur` seconds"""
    beat = 60.0 / bpm; bar = 4 * beat
    loop = np.zeros(int(4 * bar * SR) + SR, np.float32)
    for i, (root, notes) in enumerate(BED_CHORDS):
        t0 = i * bar
        for m in notes:
            place(loop, epiano(m, bar * 0.48, 0.05), t0)
            place(loop, epiano(m, bar * 0.4, 0.035), t0 + 2.5 * beat)
        place(loop, bass(root - 12, beat * 1.8, 0.3), t0); place(loop, bass(root - 12, beat * 1.6, 0.24), t0 + 2 * beat)
        for k in range(4):
            if k % 2 == 0: place(loop, kick(0.35), t0 + k * beat)
            place(loop, hat(0.06), t0 + k * beat + beat / 2)
    loop = loop[: int(4 * bar * SR)]
    reps = int(np.ceil(dur * SR / len(loop))) + 1
    return np.tile(loop, reps)[: int(dur * SR)]


def duck_gain(v, depth_db=-10.0, att=0.02, rel=0.3):
    """a gain curve that pulls the bed down while the voice speaks (a sidechain)"""
    hop = int(0.01 * SR); n = len(v) // hop + 1
    e = np.sqrt(np.convolve(v ** 2, np.ones(hop) / hop, "same"))[::hop][:n]
    on = (e > 0.02).astype(np.float32)
    g = np.ones(len(on), np.float32); low = 10 ** (depth_db / 20); cur = 1.0
    ka, kr = 1 - np.exp(-0.01 / att), 1 - np.exp(-0.01 / rel)
    for i, o in enumerate(on):
        tgt = low if o else 1.0
        cur += (tgt - cur) * (ka if tgt < cur else kr); g[i] = cur
    return np.interp(np.arange(len(v)) / hop, np.arange(len(g)), g).astype(np.float32)


# ---------------- the sung jingles ----------------
def snap_voice(x, notes):
    """Each held note pulled to the nearest semitone: the clip is split between notes and every piece is resampled by
    its own small ratio (< 3 %), joined with 15 ms crossfades. Returns the clip and the snapped MIDI notes."""
    if not notes:
        return x, []
    mids = [ftom(n[2]) for n in notes]
    targ = [int(round(m)) for m in mids]
    ratios = [2 ** ((tg - m) / 12) for m, tg in zip(mids, targ)]
    bounds = [0] + [int((notes[i][1] + notes[i + 1][0]) / 2 * SR) for i in range(len(notes) - 1)] + [len(x)]
    out = np.zeros(0, np.float32); xf = int(0.015 * SR)
    for i in range(len(notes)):
        seg = x[max(0, bounds[i] - (xf if i else 0)): bounds[i + 1]]
        n = int(len(seg) / ratios[i])
        seg = np.interp(np.linspace(0, len(seg) - 1, n), np.arange(len(seg)), seg).astype(np.float32)
        if len(out) and xf < len(seg):
            fade = np.linspace(0, 1, xf)
            out[-xf:] = out[-xf:] * (1 - fade) + seg[:xf] * fade
            out = np.concatenate([out, seg[xf:]])
        else:
            out = np.concatenate([out, seg])
    return out, targ


def jingle(sung, notes, length):
    """The band under one sung line: a pickup fill, a maj9 chord + bass on each held note (the sung note is the chord's
    5th), hats on eighths, and a bell run to close. Returns a stereo buffer `length` seconds long."""
    y = np.zeros(int((length + 1.0) * SR))
    starts = [n[0] for n in notes] or [0.25]
    beat = max(0.18, min(0.34, (starts[1] - starts[0]) / 2 if len(starts) > 1 else 0.27))
    # pickup: two snare hits before the first note
    place(y, snare(0.35), max(0, starts[0] - 2 * beat * 0.5)); place(y, snare(0.45), max(0, starts[0] - beat * 0.5))
    for i, (st, mt) in enumerate(zip(starts, sung)):
        root = mt - 7
        end = starts[i + 1] if i + 1 < len(starts) else length - 0.1
        for m in (root, root + 4, root + 7, root + 11, root + 14):
            place(y, epiano(m + 12, end - st, 0.11), st)
        place(y, bass(root - 12, end - st, 0.5), st)
        place(y, kick(0.7), st)
    t = starts[0]; k = 0
    while t < length - 0.05:
        place(y, hat(0.12 if k % 2 else 0.2), t); t += beat / 2; k += 1
    if sung:
        root = sung[-1] - 7
        for i, m in enumerate((root + 24, root + 28, root + 31, root + 35, root + 38)):
            place(y, bell(m, 0.6, 0.09), length - 0.55 + i * 0.07)
        place(y, hat(0.2, True), length - 0.15)
    return y[: int(length * SR)]


def resolve(cue, tl):
    if isinstance(cue, (int, float)):
        return float(cue)
    lines = {l["id"]: l for l in tl["lines"]}
    if cue == "TITLE":
        return float(tl.get("title_start") or 0.0)
    if isinstance(cue, str):
        return lines[cue]["start"]
    lid, word = cue[0], cue[1]; n = cue[2] if len(cue) > 2 else 1
    l = lines[lid]
    if l.get("sing"):
        return l["start"]
    want = norm_word(word)
    for same in (lambda h: h == want, lambda h: h.startswith(want)):     # exact first, then a prefix ("seat" in "seatbelt"), like G.w
        k = n
        for w in l["words"]:
            if same(norm_word(w[2])):
                k -= 1
                if k == 0:
                    return w[0]
    raise SystemExit('cue %s: word "%s" not heard in %s (%s)' % (cue, word, lid, l.get("heard")))


def main():
    if len(sys.argv) > 2 and sys.argv[1] == "--demo":
        out = sys.argv[2]
        names = ["sting", "blip", "crash", "thud", "pop", "swish", "whoosh", "modem", "ding", "ticks", "disconnect", "boing", "shimmer", "cheer", "beep", "launch"]
        y = np.zeros(int(len(names) * 2.2 * SR + 4 * SR))
        for i, n in enumerate(names):
            place(y, sfx(n), i * 2.2)
        j = jingle([62, 59], [[0.25, 0.8, 0], [0.9, 1.8, 0]], 2.0)
        place(y, j, len(names) * 2.2)
        write_wav(out, np.stack([y, y], 1) * 0.8)
        print("demo ->", out); return
    P, _ = project_args()
    tl = json.load(open(os.path.join(P, "build", "timeline.json"), encoding="utf-8"))
    dur = tl["duration"]
    voice = load_audio(os.path.join(P, "build", "voice_dry.wav"), SR)
    mix = np.zeros((int(dur * SR) + SR, 2), np.float32)
    v = np.zeros(len(mix), np.float32); v[: len(voice)] = voice[: len(mix)]
    v *= SPEECH_RMS / (np.sqrt(np.mean(v[np.abs(v) > 0.01] ** 2)) + 1e-9)
    mix += np.stack([v, v], 1)
    # jingles: the sung clip snapped to its notes, with the band, both with a little room
    for l in tl["lines"]:
        if not l.get("sing"):
            continue
        x = load_audio(os.path.join(P, "voice", l["id"] + ".wav"), SR)
        x, _ = trim(x, SR)
        x, sung = snap_voice(x, l["notes"])
        x = x * (0.11 / (np.sqrt(np.mean(x[np.abs(x) > 0.01] ** 2)) + 1e-9))
        band = jingle(sung, l["notes"], l["len"])
        band *= 0.32 / (np.abs(band).max() + 1e-9)
        wetv = reverb(np.pad(x, (0, int(0.6 * SR))), 0.8, 0.22)
        wetb = reverb(band, 0.8, 0.18, seed=5)
        jb = np.zeros((max(len(wetv), len(wetb)), 2), np.float32)
        jb[: len(wetv)] += wetv * 1.6; jb[: len(wetb)] += wetb       # the singer sits on top of the band
        body = jb[: int(l["len"] * SR)]
        jb *= JINGLE_RMS / (np.sqrt(np.mean(body ** 2)) + 1e-9)
        jb = np.tanh(jb * 1.4) / 1.4                                  # soft-limit the sung peaks
        place(mix, jb, l["start"])
        print("  jingle %s at %.2f s: notes %s -> %s" % (l["id"], l["start"], [round(n[2]) for n in l["notes"]], sung))
    # effects
    sp = os.path.join(P, "sounds.json")
    for cue, name, gdb in (json.load(open(sp, encoding="utf-8")) if os.path.exists(sp) else []):
        t = resolve(cue, tl)
        s_ = sfx(name)
        place(mix, np.stack([fades(s_), fades(s_)], 1), t, 10 ** (gdb / 20))
    # the music bed: ducked under the voice, out under the jingles, faded at both ends (the loop)
    S = json.load(open(os.path.join(P, "script.json"), encoding="utf-8"))
    if S.get("music") == "bed":
        b = bed(len(mix) / SR)[: len(mix)]
        b = b * (SPEECH_RMS * 10 ** (-10 / 20) / (np.sqrt(np.mean(b ** 2)) + 1e-9))
        g = duck_gain(v)
        for l in tl["lines"]:
            if l.get("sing"):
                a0, a1 = int((l["start"] - 0.2) * SR), int((l["start"] + l["len"] + 0.15) * SR)
                r = int(0.15 * SR)
                g[max(0, a0): max(0, a1)] = 0
                g[max(0, a0 - r): max(0, a0)] *= np.linspace(1, 0, len(g[max(0, a0 - r): max(0, a0)]))
                g[a1: a1 + r] *= np.linspace(0, 1, len(g[a1: a1 + r]))
        f_in, f_out = int(0.4 * SR), int(0.8 * SR)
        g[:f_in] *= np.linspace(0, 1, f_in); g[-f_out:] *= np.linspace(1, 0, f_out)
        b = b * g
        mix += np.stack([b, b], 1)
        print("  music bed: D major, ducked -10 dB under the voice")
    peak = np.abs(mix).max()
    if peak > 0.9:
        mix = np.tanh(mix)            # round off the few loud peaks instead of turning everything down
    write_wav(os.path.join(P, "build", "mix.wav"), mix, SR)
    print("mix.wav: %.1f s, peak %.2f" % (len(mix) / SR, peak))


if __name__ == "__main__":
    main()
