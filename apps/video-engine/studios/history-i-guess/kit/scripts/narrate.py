"""narrate.py: read every line of script.json with the free local Kokoro voice -> voice/<id>.wav, then build the
timeline (timeline.py: trims, squeezes the pauses, times every word, lays the lines end to end).

    PY narrate.py [PROJECT] [--only L3,L7]      (--only re-records just those lines)

script.json "voice": {"voice": "am_liam+am_puck", "speed": 1.25, "sing_speed": 0.75}
  voice       a Kokoro voice name, or a mix "a+b" / "a:0.6+b:0.4" (the default mix is a dry, flat young male read)
  speed       the format is fast and deadpan: 1.2-1.3 lands at 220-260 words a minute while speaking
  sing_speed  the jingle words are read slowly (0.7-0.8) so there's a vowel to hold; sound.py pulls it onto the
              melody and plays the band under it
A jingle line: {"id": "J1", "sing": "eee-maaail!", "sing_say": "email!"}: "sing" is what's shown on screen,
"sing_say" what the voice reads (left out, the stretched letters are squashed back: "eee-maaail!" -> "email!").
Your own voice instead: record each line and run import_voice.py.
"""
import json, os, re, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import LETTERS, lang_of, env, load_audio, write_wav, project_args, script_lines  # noqa: E402

_kok = None


def kokoro(text, voice, speed):
    global _kok
    from kokoro_onnx import Kokoro
    if _kok is None:
        e = env(); _kok = Kokoro(e["kokoro_model"], e["kokoro_voices"])
    style = voice
    if "+" in voice:
        parts = []
        for p in voice.split("+"):
            n, _, w = p.partition(":"); parts.append((n.strip(), float(w) if w else 1.0))
        tot = sum(w for _, w in parts)
        style = sum(_kok.get_voice_style(n) * (w / tot) for n, w in parts)
    a, sr = _kok.create(text, voice=style, speed=speed, lang="en-us")
    return np.asarray(a, np.float32), sr


EDGE_VOICES = {"es": "es-CL-LorenzoNeural", "en": "en-US-GuyNeural"}


def edge(text, voice, speed):
    """BxY: Microsoft Edge online TTS (free, needs network). script.json "voice": {"engine": "edge",
    "voice": "es-CL-LorenzoNeural", "speed": 1.15}. speed 1.25 becomes rate +25%. Returns 48 kHz mono."""
    import asyncio, tempfile
    try:
        import edge_tts
    except ImportError:
        raise SystemExit("edge-tts is not installed in this Python: run  PY -m pip install edge-tts")
    rate = "%+d%%" % round((speed - 1) * 100)
    fd, tmp = tempfile.mkstemp(suffix=".mp3"); os.close(fd)
    try:
        asyncio.run(edge_tts.Communicate(text, voice, rate=rate).save(tmp))
        a = load_audio(tmp, 48000)
    finally:
        os.remove(tmp)
    if len(a) == 0:
        raise SystemExit("edge-tts returned no audio for %r (voice %s)" % (text, voice))
    return a, 48000


def to48k(a, sr):
    if sr == 48000:
        return a
    n = int(len(a) * 48000 / sr)
    return np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a).astype(np.float32)


def speakable(text):
    """Kokoro reads a few things oddly: digits are kept out by check_script.py; here the jingle's stretched spelling
    ("eee-maaail!") is turned back into the word ("email!") with an exclamation so it comes out bright."""
    t = re.sub(r"\[[^\]]*\]", "", text).strip()
    t = re.sub(r"([%s])\1{2,}" % LETTERS, r"\1", t)
    return t.replace("-", "")


def plain(L):
    """what the free voice reads: a held word spelled out ("naaaked") is read as the plain word from "hold" (timeline.py
    stretches it afterwards); audio tags in brackets are dropped"""
    t = re.sub(r"\[[^\]]*\]", "", L["say"]).strip()
    hold = L.get("hold")
    if hold:
        hw = hold if isinstance(hold, str) else hold[0]
        import difflib
        toks = t.split()
        best = max(range(len(toks)), key=lambda i: difflib.SequenceMatcher(None, re.sub(r"[^%s]" % LETTERS, "", toks[i].lower()), hw.lower()).ratio()) if toks else None
        if best is not None:
            lead, trail = re.match(r"^\W*", toks[best]).group(0), re.search(r"\W*$", toks[best]).group(0)
            toks[best] = lead + hw + trail
        t = " ".join(toks)
    return t


def main():
    P, opts = project_args()
    S = json.load(open(os.path.join(P, "script.json"), encoding="utf-8"))
    v = S.get("voice") or {}
    lang = lang_of(S)
    engine = v.get("engine") or ("kokoro" if lang == "en" else "edge")      # Kokoro's read is tuned for English
    if engine not in ("kokoro", "edge"):
        sys.exit('script.json voice.engine is %r: use "kokoro" or "edge"' % engine)
    if engine == "edge":
        voice, speed, sspeed = v.get("voice", EDGE_VOICES[lang]), float(v.get("speed", 1.15)), float(v.get("sing_speed", 0.8))
        tts = edge
    else:
        voice, speed, sspeed = v.get("voice", "am_liam+am_puck"), float(v.get("speed", 1.25)), float(v.get("sing_speed", 0.75))
        tts = kokoro
    only = set(str(opts["--only"]).split(",")) if "--only" in opts else None
    os.makedirs(os.path.join(P, "voice"), exist_ok=True)
    for L in script_lines(S):
        if only and L["id"] not in only:
            continue
        if "sing" in L:
            a, sr = tts(L.get("sing_say") or speakable(L["sing"]), voice, sspeed)
        else:
            a, sr = tts(plain(L), voice, speed)
        a = to48k(a, sr)
        a *= 0.5 / (np.abs(a).max() + 1e-9)
        write_wav(os.path.join(P, "voice", L["id"] + ".wav"), a)
        print("  %-4s %.2f s  %s" % (L["id"], len(a) / 48000, (L.get("say") or L.get("sing"))[:70]), flush=True)
    e = env()
    r = subprocess.run([e["python"], os.path.join(HERE, "timeline.py"), P])
    sys.exit(r.returncode)


if __name__ == "__main__":
    main()
