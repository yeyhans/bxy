"""encode.py: the frames + the soundtrack -> the finished videos, both at -14 LUFS.

    PY encode.py [PROJECT] [--name NAME]

    out/<name>_9x16.mp4      1080x1920, 30 fps, H.264 + AAC (Shorts, Reels, TikTok)
    out/<name>_x_7x8.mp4     1008x1152 for X: the frame's middle band (y 343-1577, where the scenes keep everything) scaled
                             to X's 7:8 tile, under 10 MB
    out/<name>_cover.jpg, out/<name>_cover_7x8.jpg
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import ffmpeg, project_args  # noqa: E402

BAND = (343, 1577)            # renderer/guess.js G.TOP / G.BOT
X_W, X_H, X_MAX_MB = 1008, 1152, 9.6


def loudnorm(src, dst, target=-14.0):
    ff = ffmpeg()
    r = subprocess.run([ff, "-hide_banner", "-i", src, "-af", "loudnorm=I=%s:TP=-1.5:LRA=11:print_format=json" % target, "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    m = json.loads(r[r.rindex("{"):r.rindex("}") + 1])
    af = ("loudnorm=I=%s:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:offset=%s:linear=true"
          % (target, m["input_i"], m["input_tp"], m["input_lra"], m["input_thresh"], m["target_offset"]))
    af += ",aresample=192000,alimiter=limit=0.75:attack=1:release=60:level=disabled,aresample=48000"     # about -2.5 dBTP before the AAC encode (the upload copy re-encodes again)
    subprocess.run([ff, "-v", "error", "-y", "-i", src, "-af", af, "-ar", "48000", dst], check=True)


def lufs(path):
    r = subprocess.run([ffmpeg(), "-hide_banner", "-i", path, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1])


def main():
    P, opts = project_args()
    name = opts.get("--name")
    if not name:
        try:
            name = json.load(open(os.path.join(P, "script.json"), encoding="utf-8")).get("slug")
        except Exception:
            name = None
    name = name or os.path.basename(P)
    ff = ffmpeg()
    b = os.path.join(P, "build")
    if not os.path.exists(os.path.join(b, "render.json")):
        sys.exit("no build/render.json: run renderer/render.py frames first")
    rj = json.load(open(os.path.join(b, "render.json")))
    os.makedirs(os.path.join(P, "out"), exist_ok=True)
    norm = os.path.join(b, "mix_-14.wav")
    loudnorm(os.path.join(b, "mix.wav"), norm)
    dur = rj["frames"] / rj["fps"]
    frames = ["-framerate", str(rj["fps"]), "-i", os.path.join(b, "frames", "f%05d.png"), "-i", norm, "-t", "%.3f" % dur]
    color = ["-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]
    out = os.path.join(P, "out", name + "_9x16.mp4")
    subprocess.run([ff, "-v", "error", "-y", *frames, "-c:v", "libx264", "-preset", "medium", "-crf", "20", *color,
                    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
    # the X cut: crop the band, scale to 7:8, pick a bitrate that lands under the size limit
    xout = os.path.join(P, "out", name + "_x_7x8.mp4")
    vf = "crop=1080:%d:0:%d,scale=%d:%d:flags=lanczos,setsar=1" % (BAND[1] - BAND[0], BAND[0], X_W, X_H)
    kbps = int(min(6500, (X_MAX_MB * 8e3 / dur) - 160) * 0.94)
    subprocess.run([ff, "-v", "error", "-y", *frames, "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-b:v", "%dk" % kbps,
                    "-maxrate", "%dk" % int(kbps * 1.4), "-bufsize", "%dk" % (kbps * 2), *color,
                    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", xout], check=True)
    cov = os.path.join(b, "frames", "f%05d.png" % min(rj["frames"] - 1, int(rj["fps"] * 0.6)))
    subprocess.run([ff, "-v", "error", "-y", "-i", cov, "-q:v", "2", os.path.join(P, "out", name + "_cover.jpg")])
    subprocess.run([ff, "-v", "error", "-y", "-i", cov, "-vf", vf, "-q:v", "2", os.path.join(P, "out", name + "_cover_7x8.jpg")])
    for o in (out, xout):
        print("%s: %.1f s, %.1f MB, %.1f LUFS" % (o, dur, os.path.getsize(o) / 1e6, lufs(o)))


if __name__ == "__main__":
    main()
