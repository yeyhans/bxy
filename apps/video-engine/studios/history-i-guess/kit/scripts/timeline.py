"""timeline.py: the recorded lines -> one voice track + the word timeline every scene is timed to.

    PY timeline.py [PROJECT]          (narrate.py and import_voice.py run it for you)

Reads PROJECT/script.json and PROJECT/voice/<id>.wav (one file per line; made by narrate.py, or your own recordings).
- trims the silence around every line;
- times every word with faster-whisper (so scenes can fire on a word);
- sung lines ("sing") are measured for their held notes; sound.py snaps them to the jingle's key;
- held words: a line's "hold": "word" (or ["word", seconds]) stretches that word's vowel to about 0.8 s (or the seconds
  given) if the voice didn't hold it already; any word the voice held on its own is found too. timeline.json lists them per
  line ("held": [[start, end, word]]) for G.held() and G.stretch();
- shortens pauses inside a line to script["max_pause"] seconds (a recorded "1969. ... two computers" gap of 0.8 s
  becomes 0.35 s: the format never waits);
- lays the lines end to end with script["gap"] seconds between them (the format is fast: 0.05-0.12 s), a jingle gets
  its full length, and the silent title card goes first or, with script["title_at"] = a line id, right after that line
  (a cold open: the first joke, then the title).
Writes PROJECT/build/timeline.json and PROJECT/build/voice_dry.wav (48 kHz mono, the spoken lines only).
"""
import json, os, re, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import HOME, LETTERS, lang_of, env, load_audio, write_wav, norm_word, project_args, script_lines  # noqa: E402

SR = 48000


def trim(x, sr, thr_db=-42, pad=0.03):
    if len(x) == 0:
        return x, 0.0
    hop = int(sr * 0.01)
    e = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-12) for i in range(0, len(x) - hop, hop)])
    db = 20 * np.log10(e + 1e-9)
    on = np.where(db > max(thr_db, db.max() - 38))[0]
    if len(on) == 0:
        return x, 0.0
    a = max(0, on[0] * hop - int(pad * sr))
    b = min(len(x), (on[-1] + 1) * hop + int(pad * sr))
    return x[a:b], a / sr


def squeeze_pauses(x, sr, max_pause, thr_db=-40):
    """cut every silence inside the line that is longer than max_pause down to max_pause (10 ms crossfades)"""
    hop = int(sr * 0.01)
    e = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-12) for i in range(0, len(x) - hop, hop)])
    if len(e) == 0:
        return x
    db = 20 * np.log10(e + 1e-9)
    quiet = db < max(thr_db, db.max() - 36)
    runs, i = [], 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j + 1 < len(quiet) and quiet[j + 1]:
                j += 1
            if i > 0 and j < len(quiet) - 1 and (j - i + 1) * 0.01 > max_pause:
                runs.append((i * hop, (j + 1) * hop))
            i = j + 1
        else:
            i += 1
    if not runs:
        return x
    keep = int(max_pause * sr); fade = int(0.01 * sr)
    out, pos = [], 0
    for a, b in runs:
        mid_a, mid_b = a + keep // 2, b - (keep - keep // 2)
        seg = x[pos:mid_a].copy()
        if out:
            seg[:fade] *= np.linspace(0, 1, fade)
        seg[-fade:] *= np.linspace(1, 0, fade)
        out.append(seg); pos = mid_b
    seg = x[pos:].copy(); seg[:fade] *= np.linspace(0, 1, fade); out.append(seg)
    return np.concatenate(out)


def one_note(x, sr):
    """A voice that can't hold a note (a speaking voice reading the sung word): the whole voiced stretch becomes one note
    at its median pitch, so the band still has a chord to play under it."""
    y = x[:: sr // 8000] if sr % 8000 == 0 else x
    s = 8000 if sr % 8000 == 0 else sr
    hop, win = int(s * 0.02), int(s * 0.04)
    lo, hi = int(s / 400), int(s / 70)
    F, on = [], []
    for k, i in enumerate(range(0, len(y) - win - hi, hop)):
        fr = y[i:i + win]
        if np.sqrt(np.mean(fr ** 2)) < 0.02:
            continue
        d = np.array([np.sum((fr - y[i + t:i + t + win]) ** 2) for t in range(lo, hi)])
        cm = d * np.arange(1, len(d) + 1) / (np.cumsum(d) + 1e-12)
        j = int(np.argmin(cm))
        if cm[j] < 0.35:
            F.append(s / (j + lo)); on.append(k * 0.02)
    if not F:
        return [[0.05, max(0.3, len(x) / sr - 0.05), 140.0]]
    return [[round(on[0], 2), round(on[-1] + 0.04, 2), round(float(np.median(F)), 1)]]


def held_notes(x, sr):
    """Held pitches (>= 0.18 s within 0.8 semitone) in a sung clip: [(start, end, hz)]."""
    y = x[:: sr // 8000] if sr % 8000 == 0 else x
    s = 8000 if sr % 8000 == 0 else sr
    hop, win = int(s * 0.02), int(s * 0.04)
    lo, hi = int(s / 600), int(s / 70)
    F = []
    for i in range(0, len(y) - win - hi, hop):
        fr = y[i:i + win]
        if np.sqrt(np.mean(fr ** 2)) < 0.01:
            F.append(np.nan); continue
        d = np.array([np.sum((fr - y[i + t:i + t + win]) ** 2) for t in range(lo, hi)])
        cm = d * np.arange(1, len(d) + 1) / (np.cumsum(d) + 1e-12)
        k = int(np.argmin(cm))
        F.append(s / (k + lo) if cm[k] < 0.35 else np.nan)
    F = np.array(F)
    st = 12 * np.log2(F / 110.0)
    notes, i = [], 0
    while i < len(F):
        if np.isnan(st[i]):
            i += 1; continue
        j = i
        while j + 1 < len(F) and not np.isnan(st[j + 1]) and abs(st[j + 1] - np.nanmedian(st[i:j + 1])) < 0.8:
            j += 1
        if (j - i + 1) * 0.02 >= 0.18:
            notes.append([round(i * 0.02, 2), round((j + 1) * 0.02, 2), round(float(np.nanmedian(F[i:j + 1])), 1)])
        i = j + 1
    return notes


def stretch_word(x, sr, s, e, want):
    """lengthen x[s:e] (one word) to `want` seconds by stretching its middle (the vowel), keeping the start and the end"""
    import subprocess, tempfile
    from common import ffmpeg
    a, b = int(s * sr), int(e * sr)
    w = x[a:b]; n = len(w)
    if n < int(0.08 * sr): return x, 0.0
    h, t = int(n * 0.3), int(n * 0.25)
    mid = w[h:n - t]
    need = want - (h + t) / sr
    if need <= len(mid) / sr: return x, 0.0
    f = (len(mid) / sr) / need                      # atempo factor (< 1 slows down)
    chain = []
    while f < 0.5: chain.append("atempo=0.5"); f /= 0.5
    chain.append("atempo=%.4f" % f)
    d = tempfile.mkdtemp()
    src, dst = os.path.join(d, "a.wav"), os.path.join(d, "b.wav")
    write_wav(src, mid, sr)
    subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", src, "-filter:a", ",".join(chain), "-ar", str(sr), "-ac", "1", dst], check=True)
    mid2 = load_audio(dst, sr)
    out = np.concatenate([x[:a + h], mid2, x[b - t:]])
    return out, (len(out) - len(x)) / sr


def voiced(x, sr, ws):
    """whisper squeezes a held word's end; extend each word through the sound that follows it, up to the next word"""
    hop = int(0.01 * sr); n = len(x) // hop
    e = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    thr = 0.3 * (np.median(e[e > np.percentile(e, 40)]) if n else 1)       # a held vowel is loud; breath and room noise are not
    out = []
    for i, w in enumerate(ws):
        lim = ws[i + 1][0] if i + 1 < len(ws) else len(x) / sr
        j = int(w[1] * 100)
        while j < min(n, int(lim * 100)) and e[j] > thr: j += 1
        end = max(w[1], j / 100)
        sounding = float((e[int(w[0] * 100): int(end * 100)] > thr).sum()) / 100    # seconds of actual sound in the span
        out.append([w[0], end, w[2], sounding])
    return out


def find_held(ws, spl):
    """words the voice held: longer than 0.5 s and 2.2x the usual time for their letters (ws = voiced spans)"""
    out = []
    for w in ws:
        if re.search(r"[0-9]", w[2]) or not re.search(r"[%s]" % LETTERS, w[2].lower()): continue      # numbers are read as several words
        k = max(1, len(re.sub(r"[^%s]" % LETTERS, "", w[2].lower())))
        if k < 3: continue                   # "BC", "I": too short to read as held
        d = w[3] if len(w) > 3 else w[1] - w[0]          # the sound inside the span (a pause whisper gave the word doesn't count)
        if d > 0.5 and d > 2.2 * spl * k:
            out.append(w[:3])
    return out


_ONES = ("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen "
         "sixteen seventeen eighteen nineteen").split()
_TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


_ES_ONES = ("cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis "
            "diecisiete dieciocho diecinueve veinte veintiuno veintidós veintitrés veinticuatro veinticinco veintiséis "
            "veintisiete veintiocho veintinueve").split()
_ES_TENS = "_ _ _ treinta cuarenta cincuenta sesenta setenta ochenta noventa".split()
LANG = "en"          # set in main() from script.json "lang"


def spelled(t):
    """whisper writes small numbers as digits ("8"); spell them so a hold on "eight" still finds its word"""
    if not t.isdigit() or int(t) >= 100: return t
    n = int(t)
    if LANG == "es":
        return _ES_ONES[n] if n < 30 else _ES_TENS[n // 10] + ("y" + _ES_ONES[n % 10] if n % 10 else "")
    return _ONES[n] if n < 20 else _TENS[n // 10] + (_ONES[n % 10] if n % 10 else "")


def match_word(ws, word):
    """the heard word (or two heard words in a row) closest to `word`: [start, end, text] or None"""
    import difflib
    want = norm_word(word); best = (0, None)
    for i in range(len(ws)):
        for k in (1, 2):
            if i + k > len(ws): continue
            txt = "".join(spelled(norm_word(w[2])) for w in ws[i:i + k])
            r = 1.0 if txt == want else difflib.SequenceMatcher(None, txt, want).ratio() - (0.05 if k == 2 else 0)
            if r > best[0]: best = (r, [ws[i][0], ws[i + k - 1][1], " ".join(w[2] for w in ws[i:i + k])])
    return best[1] if best[0] >= 0.6 else None


def main():
    P, _ = project_args()
    S = json.load(open(os.path.join(P, "script.json"), encoding="utf-8"))
    E = env()
    from faster_whisper import WhisperModel
    global LANG
    LANG = lang_of(S)
    wpath = E["whisper"]                     # base.en: English only
    if LANG != "en":
        # BxY: other languages need a multilingual model; fetched once into the shared cache
        size = S.get("whisper", "small")
        wpath = os.path.join(HOME, "models", "whisper-" + size)
        if not os.path.exists(os.path.join(wpath, "model.bin")):
            print("downloading the multilingual timing model whisper-%s (once)" % size, flush=True)
            from faster_whisper import download_model
            download_model(size, output_dir=wpath)
    model = WhisperModel(wpath, device="cpu", compute_type="int8")
    gap = float(S.get("gap", 0.08))
    title_len = float(S.get("title_len", 0.9))
    title_at = S.get("title_at", "start")
    max_pause = S.get("max_pause")
    t = title_len if title_at == "start" else float(S.get("lead", 0.2))
    title_start = 0.0 if title_at == "start" else None
    out_lines, words_all, track = [], [], []
    for L in script_lines(S):
        p = os.path.join(P, "voice", L["id"] + ".wav")
        if not os.path.exists(p):
            sys.exit("missing %s (run narrate.py, or record it)" % p)
        x = load_audio(p, SR)
        x, _ = trim(x, SR)
        if max_pause and "sing" not in L:
            x = squeeze_pauses(x, SR, float(max_pause))
        dur = len(x) / SR
        rec = dict(id=L["id"], start=round(t, 3), dur=round(dur, 3))
        if "sing" in L:
            rec["sing"] = True
            rec["notes"] = held_notes(x, SR) or one_note(x, SR)
            rec["len"] = round(max(dur + 0.25, float(L.get("min_len", 1.5))), 3)
            rec["text"] = re.sub(r"\[[^\]]*\]", "", L["sing"]).strip()
            t_next = t + rec["len"]
        else:
            def hear(x):
                a16 = x[::3].astype(np.float32)          # 48 kHz -> 16 kHz
                segs, _ = model.transcribe(a16, language=LANG, word_timestamps=True, beam_size=5,
                                           condition_on_previous_text=False)
                return [[w.start, w.end, w.word.strip()] for s_ in segs for w in s_.words]
            ws0 = hear(x)
            hold = L.get("hold")
            hw, stretched = None, None
            if hold:
                hw, hl = (hold, 0.8) if isinstance(hold, str) else (hold[0], float(hold[1]))
                hit = match_word([w[:3] for w in voiced(x, SR, ws0)], hw)
                if hit:
                    x, added = stretch_word(x, SR, hit[0], hit[1], hl)
                    if added > 0:
                        ws0 = hear(x)
                        stretched = [hit[0], hit[1] + added, hit[2]]     # where the held word is now (whisper squeezes it)
                else:
                    print("  %s: hold word %r not heard (heard: %s)" % (L["id"], hw, " ".join(w[2] for w in ws0)))
            dur = len(x) / SR
            rec["dur"] = round(dur, 3)
            ws = [[round(w[0] + t, 3), round(w[1] + t, 3), w[2]] for w in ws0]
            wv = [[round(w[0] + t, 3), round(w[1] + t, 3), w[2], w[3]] for w in voiced(x, SR, ws0)]
            letters = sum(max(1, len(re.sub(r"[^%s]" % LETTERS, "", w[2].lower()))) for w in ws) or 1
            spl = min(0.075, sum(w[1] - w[0] for w in ws) / letters)
            held = find_held(wv, spl)
            if stretched:
                mw = [round(stretched[0] + t, 3), round(stretched[1] + t, 3), stretched[2]]
                held = sorted([h for h in held if not (h[0] < mw[1] and mw[0] < h[1])] + [mw])
            elif hw:
                mw = match_word([w[:3] for w in wv], hw)
                if mw and not [h for h in held if h[0] <= mw[0] < h[1] or mw[0] <= h[0] < mw[1]]:
                    held = sorted(held + [mw])
            rec["held"] = held
            rec["heard"] = " ".join(w[2] for w in ws)
            rec["text"] = L["say"]
            rec["words"] = ws
            # map the script's words onto the heard ones in order, so cues use the script's spelling
            said = [norm_word(w) for w in L["say"].split() if norm_word(w)]
            rec["said"] = said
            words_all += [[w[0], w[1], norm_word(w[2]), L["id"]] for w in ws if norm_word(w[2])]
            t_next = t + dur + float(L.get("gap_after", gap))
        if "sing" not in L:
            fa, fb = min(len(x), int(0.004 * SR)), min(len(x), int(0.02 * SR))
            x = x.copy(); x[:fa] *= np.linspace(0, 1, fa); x[-fb:] *= np.linspace(1, 0, fb)
            track.append((t, x))          # sung lines are snapped and mixed by sound.py
        out_lines.append(rec)
        t = t_next
        if L["id"] == title_at:
            title_start = round(t, 3); t += title_len
    tail = float(S.get("tail", 1.2))
    total = t + tail
    y = np.zeros(int(total * SR) + SR, np.float32)
    for st, x in track:
        a = int(st * SR)
        y[a:a + len(x)] += x
    y = y[: int(total * SR)]
    os.makedirs(os.path.join(P, "build"), exist_ok=True)
    write_wav(os.path.join(P, "build", "voice_dry.wav"), y, SR)
    tl = dict(title=S.get("title", ""), title_len=title_len, title_start=title_start, duration=round(total, 3), lines=out_lines, words=words_all)
    json.dump(tl, open(os.path.join(P, "build", "timeline.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    n = sum(len(l.get("said", [])) for l in out_lines)
    spoken = sum(l["dur"] for l in out_lines if not l.get("sing"))
    print("%.1f s total, %d words, %.0f wpm over the whole video, %.0f wpm while speaking" % (total, n, n / total * 60, n / spoken * 60))
    for l in out_lines:
        if l.get("sing"):
            print("  %-4s %5.2f s  sung %-18s notes %s" % (l["id"], l["start"], l["text"], [n_[2] for n_ in l["notes"]]))
        else:
            flag = "" if [norm_word(w) for w in l["heard"].split()] == l["said"] else "   <- heard: " + l["heard"]
            hd = ("   held: " + ", ".join("%s %.2f s" % (h[2], h[1] - h[0]) for h in l["held"])) if l.get("held") else ""
            print("  %-4s %5.2f s  %s%s%s" % (l["id"], l["start"], l["text"][:60], flag, hd))
    nh = sum(len(l.get("held", [])) for l in out_lines)
    print("held words: %d (%.1f a minute; the format holds 3-5 a minute)" % (nh, nh / total * 60))


if __name__ == "__main__":
    main()
