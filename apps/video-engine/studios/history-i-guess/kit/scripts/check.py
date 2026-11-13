"""check.py: check the finished video and make the contact sheets you judge it from.

    PY check.py [PROJECT]

Writes qa/report.md (PASS / LOOK / FAIL lines), qa/sheet.jpg (the X cut, one tile a second, time-stamped) and
qa/sheet_open.jpg (the first 6 seconds at 4 tiles a second: the hook). Then judge every tile of both sheets yourself,
one line each, in qa/tiles.md.
"""
import glob, json, os, re, subprocess, sys, tempfile
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import ffmpeg, project_args  # noqa: E402
from encode import lufs  # noqa: E402


def sheet(video, out, fps, cols, tw, t_to=None):
    from PIL import Image, ImageDraw
    d = tempfile.mkdtemp(prefix="hig_sheet_")
    cmd = [ffmpeg(), "-v", "error", "-i", video]
    if t_to:
        cmd += ["-t", str(t_to)]
    subprocess.run(cmd + ["-vf", "fps=%s,scale=%d:-2" % (fps, tw), os.path.join(d, "f%04d.jpg")], check=True)
    fs = sorted(glob.glob(os.path.join(d, "f*.jpg")))
    ims = [Image.open(f).convert("RGB") for f in fs]
    th = ims[0].height
    rows = (len(ims) + cols - 1) // cols
    S = Image.new("RGB", (cols * tw, rows * (th + 18)), (24, 24, 24))
    dr = ImageDraw.Draw(S)
    for i, im in enumerate(ims):
        x, y = (i % cols) * tw, (i // cols) * (th + 18)
        S.paste(im, (x, y + 18)); dr.text((x + 4, y + 3), "%.2f s" % (i / fps), fill=(255, 210, 90))
    S.save(out, quality=86)
    return len(ims)


def truepeak(path):
    r = subprocess.run([ffmpeg(), "-hide_banner", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.findall(r"Peak:\s+(-?[\d.]+|-inf) dBFS", r)
    return float(m[-1]) if m and m[-1] != "-inf" else -99.0


def main():
    P, _ = project_args()
    S = json.load(open(os.path.join(P, "script.json"), encoding="utf-8"))
    slug = S.get("slug") or os.path.basename(P)
    tl = json.load(open(os.path.join(P, "build", "timeline.json"), encoding="utf-8"))
    rows = []
    add = lambda lv, m: rows.append((lv, m))
    v916, vx = os.path.join(P, "out", slug + "_9x16.mp4"), os.path.join(P, "out", slug + "_x_7x8.mp4")
    for v in (v916, vx):
        if not os.path.exists(v):
            sys.exit("missing %s: run encode.py" % v)
    os.makedirs(os.path.join(P, "qa"), exist_ok=True)
    # loudness and size
    for v, name in ((v916, "9:16"), (vx, "X 7:8")):
        L = lufs(v)
        add("PASS" if abs(L + 14) <= 1 else "LOOK", "%s loudness %.1f LUFS (target -14)" % (name, L))
    tp = truepeak(v916)
    add("PASS" if tp <= -1.0 else "LOOK", "9:16 true peak %.1f dBTP (under -1)" % tp)
    mb = os.path.getsize(vx) / 1e6
    add("PASS" if mb < 10 else "FAIL", "X cut %.1f MB (X's limit is 10 MB on many accounts)" % mb)
    # pace
    spoken = [l for l in tl["lines"] if not l.get("sing")]
    words = sum(len(l.get("said", [])) for l in spoken)
    talk = sum(l["dur"] for l in spoken)
    wpm = words / talk * 60 if talk else 0
    from common import LANG_DEFAULTS, lang_of      # BxY: Spanish carries fewer words a minute at the same speed
    lo, hi = LANG_DEFAULTS[lang_of(S)]["pace"]
    add("PASS" if lo <= wpm <= hi else "LOOK", "pace %.0f words a minute while speaking (the window: %d-%d)" % (wpm, lo, hi))
    add("PASS" if tl["duration"] <= 90 else "LOOK", "length %.1f s (a Short: 20-90 s)" % tl["duration"])
    # the hook: something on screen from frame 0, the title card not first unless asked
    from PIL import Image
    fr = sorted(glob.glob(os.path.join(P, "build", "frames", "f*.png")))
    if fr:
        f0 = np.asarray(Image.open(fr[0]).convert("L"), np.float32)
        add("PASS" if f0.mean() > 6 else "LOOK", "frame 0 brightness %.0f (the planet should be on screen from the first frame)" % f0.mean())
        # still stretches: sampled at 6 a second, tiny greyscale, mean change between samples
        step = max(1, int(round(30 / 6)))
        smp = [np.asarray(Image.open(f).convert("L").resize((54, 96)), np.float32) for f in fr[::step]]
        diffs = [float(np.abs(smp[i] - smp[i - 1]).mean()) for i in range(1, len(smp))]
        run, worst = 0, []
        for i, d in enumerate(diffs):
            if d < 0.6:
                run += 1
            else:
                if run * step / 30 >= 2.0:
                    worst.append(((i - run) * step / 30, run * step / 30))
                run = 0
        if run * step / 30 >= 2.0:
            worst.append(((len(diffs) - run) * step / 30, run * step / 30))
        if worst:
            for t0, ln in worst:
                add("LOOK", "%.1f s: %.1f s with almost no motion (drift the camera, spin the planet, pop something)" % (t0, ln))
        else:
            add("PASS", "no still stretch of 2 s or more")
        # the colour scheme: how much is black space, how often the background changes (his: 10-42 % black,
        # 26-57 background changes a minute, a background lasts 0.2-1.0 s at the median)
        cls = []
        for f in fr[::6]:
            im = np.asarray(Image.open(f).convert("RGB").resize((54, 96)), np.float32) / 255
            q = (im * 7.999).astype(int); key = q[..., 0] * 64 + q[..., 1] * 8 + q[..., 2]
            vals, cnt = np.unique(key, return_counts=True); i = cnt.argmax(); share = cnt[i] / key.size
            col = im[key == vals[i]].mean(0); v = col.max(); sat = (v - col.min()) / (v + 1e-6)
            cls.append(("black" if v < 0.12 and share > 0.35 else "card" if share > 0.45 else "picture", tuple((col * 4).round())))
        dur_s = len(fr) / 30
        black = sum(c[0] == "black" for c in cls) / max(1, len(cls))
        changes = sum(1 for i in range(1, len(cls)) if cls[i][0] != cls[i - 1][0] or (cls[i][0] == "card" and cls[i][1] != cls[i - 1][1]))
        cpm = changes / dur_s * 60
        add("PASS" if black <= 0.45 else "LOOK", "black space %.0f %% of the time (his: 10-42 %%; use colour cards and the toon globe on a card)" % (black * 100))
        add("PASS" if cpm >= 20 else "LOOK", "background changes %.0f a minute (his: 26-57; change the card when the joke changes)" % cpm)
    held = sum(len(l.get("held", [])) for l in tl["lines"])
    hpm = held / tl["duration"] * 60
    add("PASS" if hpm >= 2.5 else "LOOK", "held words %d (%.1f a minute; his: 3-5 a minute; add \"hold\" to a line or spell the vowel out)" % (held, hpm))
    n1 = sheet(vx, os.path.join(P, "qa", "sheet.jpg"), 1, 10, 190)
    n2 = sheet(vx, os.path.join(P, "qa", "sheet_open.jpg"), 4, 8, 190, t_to=6)
    rep = ["# QA: %s" % S.get("title", slug), ""] + ["- **%s** %s" % r for r in rows] + [
        "", "Sheets: `qa/sheet.jpg` (%d tiles, 1 a second) and `qa/sheet_open.jpg` (%d tiles, the first 6 s)." % (n1, n2),
        "Now judge every tile, one line each, in `qa/tiles.md`: a word popping before it's said, text off the edge or over",
        "the year box, a flat stretch with no planet or real-looking object, a scene where nothing moves, anything that",
        "contradicts sources.md."]
    open(os.path.join(P, "qa", "report.md"), "w", encoding="utf-8").write("\n".join(rep) + "\n")
    for lv, m in rows:
        print("%-4s %s" % (lv, m))
    print("-> qa/report.md, qa/sheet.jpg, qa/sheet_open.jpg")
    sys.exit(1 if any(lv == "FAIL" for lv, _ in rows) else 0)


if __name__ == "__main__":
    main()
