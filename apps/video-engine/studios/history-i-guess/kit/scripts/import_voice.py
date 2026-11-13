"""import_voice.py: use your own recordings instead of the Kokoro voice.

    PY import_voice.py [PROJECT] [--audio takes]

Record each line of script.json as its own file named after the line's id (takes/L1.m4a, takes/L2.wav, ... and the
jingle words too: takes/J1.m4a, sung). Any format ffmpeg reads works, phone memos included. Read fast and flat, the way
it's written. The files become voice/<id>.wav and the timeline is built from them (timeline.py times every word with
faster-whisper and finds the notes you sang).
"""
import glob, json, os, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import env, load_audio, write_wav, project_args, script_lines  # noqa: E402


def main():
    P, opts = project_args()
    src = os.path.join(P, opts.get("--audio", "takes"))
    S = json.load(open(os.path.join(P, "script.json"), encoding="utf-8"))
    os.makedirs(os.path.join(P, "voice"), exist_ok=True)
    missing = []
    for L in script_lines(S):
        hits = [f for f in glob.glob(os.path.join(src, L["id"] + ".*")) if not f.endswith(".txt")]
        if not hits:
            missing.append(L["id"]); continue
        a = load_audio(hits[0], 48000)
        if len(a) == 0:
            sys.exit("couldn't read %s" % hits[0])
        a = a * (0.5 / (np.abs(a).max() + 1e-9))
        write_wav(os.path.join(P, "voice", L["id"] + ".wav"), a)
        print("  %-4s %.2f s  <- %s" % (L["id"], len(a) / 48000, os.path.basename(hits[0])))
    if missing:
        sys.exit("no recording for: %s (expected %s/<id>.m4a or .wav)" % (", ".join(missing), src))
    r = subprocess.run([env()["python"], os.path.join(HERE, "timeline.py"), P])
    sys.exit(r.returncode)


if __name__ == "__main__":
    main()
