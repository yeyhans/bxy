"""Shared helpers: the tools' paths (env.json from setup.py), the project folder, audio in/out, word normalising."""
import json, os, re, subprocess, sys, wave
import numpy as np

HOME = os.environ.get("HISTORY_GUESS_HOME") or os.path.join(os.path.expanduser("~"), ".cache", "history-guess")
ENV_FILE = os.path.join(HOME, "env.json")
SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def project_args(flags_with_value=("--name", "--workers", "--at", "--times", "--only", "--audio", "--size")):
    """(project folder, {flag: value or True}) from the command line; the folder defaults to the current one."""
    argv, opts, pos = sys.argv[1:], {}, []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a.startswith("--"):
            if a in flags_with_value and i + 1 < len(argv):
                opts[a] = argv[i + 1]; i += 2; continue
            opts[a] = True
        else:
            pos.append(a)
        i += 1
    return os.path.abspath(pos[0] if pos else "."), opts


def script_lines(S):
    """the script's lines, plus the optional call to action as a last line with id "CTA".
    script.json "cta": "subscribe for more, i guess." turns it on (leave it out for none). A word with its vowel spelled
    out ("suuubscribe") is the held word; otherwise the first word is held. "cta_voice" can carry a voice-only version."""
    lines = list(S.get("lines") or [])
    cta = S.get("cta")
    if cta:
        toks = cta.split()
        held = next((t for t in toks if re.search(r"([%s])\1\1" % LETTERS, t.lower())), toks[0] if toks else "")
        word = re.sub(r"([%s])\1{2,}" % LETTERS, r"\1", re.sub(r"[^%s']" % LETTERS, "", held.lower()))
        L = {"id": "CTA", "say": cta, "hold": word, "cta": True}
        if S.get("cta_voice"): L["voice_text"] = S["cta_voice"]
        lines.append(L)
    return lines


def env():
    if not os.path.exists(ENV_FILE):
        raise SystemExit("Run scripts/setup.py first (it writes %s)." % ENV_FILE)
    return json.load(open(ENV_FILE, encoding="utf-8"))


def ffmpeg():
    try:
        return env()["ffmpeg"]
    except SystemExit:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()


def load_audio(path, sr=48000):
    raw = subprocess.run([ffmpeg(), "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def write_wav(path, y, sr=48000):
    y = np.asarray(y, np.float32)
    if y.ndim == 1:
        y = y[:, None]
    pcm = (np.clip(y, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(pcm.shape[1]); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())


# BxY: letters that count as part of a word. Upstream matched a-z only, which cut Spanish words at every
# accent ("café" -> "caf"). English text is unaffected unless it carries accents.
LETTERS = "a-záéíóúüñ"

# BxY: script.json "lang" ("en" by default). "es" switches the voice engine default, the timing model,
# the number words and the script checks. See the studio CLAUDE.md.
LANG_DEFAULTS = {
    "en": {"tag": "guess", "wpm": 240, "pace": (210, 275)},
    "es": {"tag": "supongo", "wpm": 190, "pace": (165, 230)},
}


def lang_of(S):
    lang = (S.get("lang") or "en").lower()
    if lang not in LANG_DEFAULTS:
        raise SystemExit('script.json "lang" is %r: supported are %s' % (lang, ", ".join(LANG_DEFAULTS)))
    return lang


def tag_of(S):
    """the word the last line lands on ("guess" / "supongo"); script.json "tag" overrides it"""
    return (S.get("tag") or LANG_DEFAULTS[lang_of(S)]["tag"]).lower()


NUM = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine"}


def norm_word(w):
    w = w.lower().replace("’", "'")
    w = re.sub(r"[^%s0-9']" % LETTERS, "", w)
    return w.strip("'")
