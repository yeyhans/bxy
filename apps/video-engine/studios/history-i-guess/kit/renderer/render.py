"""render.py: draws the video's frames in headless Chrome (CPU only; WebGL runs on SwiftShader) and saves them as PNGs.

    PY render.py [PROJECT] stills [--at 0.6]          one frame per scene (at 60 % of it) -> build/stills/ + build/stills_sheet.jpg
    PY render.py [PROJECT] stills --times 3.2,7.5     frames at exact seconds
    PY render.py [PROJECT] frames [--workers 6]       every frame at 30 fps -> build/frames/f00000.png ...
    PY render.py [PROJECT] zones --preset shorts [--every 2]   check every text against the platform's overlays (no pictures:
                                                         fast); presets: shorts (YouTube Shorts, TikTok, Reels), x (the 7:8 band)
    PY render.py [PROJECT] frames --only 1309-1363,1777-1795   re-draw just these frames after a change that only touches them
                                                         (keeps the rest; you are vouching that nothing else changed)
PROJECT defaults to the current folder.

It reads PROJECT/build/timeline.json (timeline.py) and PROJECT/scenes.js (your scenes), with renderer/guess.js,
renderer/globe.js, the skill's fonts/ and the globe textures setup.py made. Finished frames are kept while timeline.json, scenes.js and this folder are unchanged.
"""
import asyncio, base64, hashlib, json, os, shutil, subprocess, sys, tempfile, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "scripts"))
from common import env  # noqa: E402

W, H, FPS = 1080, 1920, 30


def find_browser():
    try:
        e = env()
    except SystemExit:
        e = {}
    cands = [e.get("chrome")] if e.get("chrome") else []
    cands += [r"C:\Program Files\Google\Chrome\Application\chrome.exe", r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
              r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
              "/Applications/Chromium.app/Contents/MacOS/Chromium"]
    for n in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge", "chrome"):
        p = shutil.which(n)
        if p:
            cands.append(p)
    for c in cands:
        if c and os.path.exists(c):
            return c
    sys.exit("No Chrome, Edge or Chromium found: install Google Chrome (free), or set \"chrome\" in env.json.")


def file_url(p):
    return "file:///" + os.path.abspath(p).replace("\\", "/").lstrip("/")


def fonts_dir():
    try:
        d = env().get("fonts")
        if d and os.path.isdir(d):
            return d
    except SystemExit:
        pass
    return os.path.join(HERE, "..", "fonts")


def textures_dir():
    d = os.environ.get("GLOBE_TEXTURES")
    if not d:
        try:
            d = env().get("textures")
        except SystemExit:
            d = None
    if not d:
        from common import HOME
        d = os.path.join(HOME, "textures")
    return d if os.path.exists(os.path.join(d, "day.jpg")) else None


def globe_tex():
    d = textures_dir()
    if not d:
        return None
    meta_p = os.path.join(d, "hi.json")
    meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
    hi = {k: {"day": file_url(os.path.join(d, "hi_%s_day.jpg" % k)), "night": file_url(os.path.join(d, "hi_%s_night.jpg" % k))} for k in meta}
    bodies = {k: file_url(os.path.join(d, k + ".jpg")) for k in ("moon",) if os.path.exists(os.path.join(d, k + ".jpg"))}
    return {"day": file_url(os.path.join(d, "day.jpg")), "night": file_url(os.path.join(d, "night.jpg")), "hi": hi, "meta": meta, "bodies": bodies}


def build_page(P):
    tl = json.load(open(os.path.join(P, "build", "timeline.json"), encoding="utf-8"))
    fd = fonts_dir()
    faces = ""
    for fam, fn, wt in (("Arimo", "Arimo.ttf", "100 900"), ("Comic Neue", "ComicNeue-Bold.ttf", "700"), ("VT323", "VT323.ttf", "400")):
        p = os.path.join(fd, fn)
        if os.path.exists(p):
            faces += "@font-face{font-family:'%s';src:url('%s');font-weight:%s}\n" % (fam, file_url(p), wt)
    html = """<!doctype html><html><head><meta charset="utf-8"><style>%s
html,body{margin:0;padding:0;background:#000;overflow:hidden;width:%dpx;height:%dpx}
#c{position:absolute;left:0;top:0}
</style></head><body><canvas id="c" width="%d" height="%d"></canvas>
<script>window.TIMELINE = %s; window.GLOBE_TEX = %s;</script>
<script src="%s"></script>
<script src="%s"></script>
<script src="%s"></script>
<script src="%s"></script>
<script>
window.READY = Promise.all([document.fonts.load("400 40px Arimo"), document.fonts.load("700 40px Arimo"), document.fonts.load("700 40px 'Comic Neue'"),
  document.fonts.load("400 40px VT323"), document.fonts.ready].concat(G.READY || []));
window.setFrame = function (f) { return G.render(f); };
</script></body></html>""" % (faces, W, H, W, H, json.dumps(tl), json.dumps(globe_tex()), file_url(os.path.join(HERE, "vendor", "three.min.js")),
                               file_url(os.path.join(HERE, "guess.js")), file_url(os.path.join(HERE, "globe.js")), file_url(os.path.join(P, "scenes.js")))
    out = os.path.join(P, "build", "page.html")
    open(out, "w", encoding="utf-8").write(html)
    return out, tl


class Chrome:
    def __init__(self):
        self.prof = tempfile.mkdtemp(prefix="history_guess_chrome_")
        self.proc = subprocess.Popen([find_browser(), "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
                                      "--hide-scrollbars", "--force-device-scale-factor=1", "--allow-file-access-from-files",
                                      "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0",
                                      "--user-data-dir=" + self.prof, "--window-size=%d,%d" % (W, H), "about:blank"],
                                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        pf = os.path.join(self.prof, "DevToolsActivePort")
        for _ in range(300):
            try:
                self.port = int(open(pf).read().split()[0])
                tabs = json.load(urllib.request.urlopen("http://127.0.0.1:%d/json" % self.port, timeout=1))
                self.ws_url = [t for t in tabs if t["type"] == "page"][0]["webSocketDebuggerUrl"]
                return
            except Exception:
                time.sleep(0.1)
        raise RuntimeError("Chrome did not start")

    def close(self):
        self.proc.terminate()
        try:
            self.proc.wait(5)
        except Exception:
            self.proc.kill()
        shutil.rmtree(self.prof, ignore_errors=True)


async def session(ch, page, jobs, outdir, log_every=200):
    import websockets
    async with websockets.connect(ch.ws_url, max_size=300_000_000) as ws:
        n = 0

        async def call(method, params=None):
            nonlocal n
            n += 1
            await ws.send(json.dumps({"id": n, "method": method, "params": params or {}}))
            while True:
                m = json.loads(await ws.recv())
                if m.get("id") == n:
                    if "error" in m:
                        raise RuntimeError("%s: %s" % (method, m["error"]))
                    return m.get("result", {})
        await call("Emulation.setDeviceMetricsOverride", {"width": W, "height": H, "deviceScaleFactor": 1, "mobile": False})
        await call("Page.enable")
        await call("Page.navigate", {"url": file_url(page)})
        for _ in range(300):
            r = await call("Runtime.evaluate", {"expression": "typeof window.setFrame === 'function' && !!window.READY", "returnByValue": True})
            if r.get("result", {}).get("value"):
                break
            await asyncio.sleep(0.05)
        await call("Runtime.evaluate", {"expression": "window.READY", "awaitPromise": True})
        t0 = time.time()
        for k, (f, name) in enumerate(jobs):
            r = await call("Runtime.evaluate", {"expression": "setFrame(%d)" % f, "returnByValue": True})
            if "exceptionDetails" in r:
                raise RuntimeError("frame %d: %s" % (f, json.dumps(r["exceptionDetails"])[:900]))
            shot = await call("Page.captureScreenshot", {"format": "png"})
            tmp = os.path.join(outdir, name + ".tmp")
            open(tmp, "wb").write(base64.b64decode(shot["data"]))
            os.replace(tmp, os.path.join(outdir, name))
            if log_every and k % log_every == 0:
                print("  frame %d (%d of %d) %.1f s" % (f, k + 1, len(jobs), time.time() - t0), flush=True)


def run(page, jobs, outdir, workers=1):
    os.makedirs(outdir, exist_ok=True)
    workers = max(1, min(workers, len(jobs)))
    chs = [Chrome() for _ in range(workers)]
    try:
        parts = [jobs[i::workers] for i in range(workers)]

        async def main():
            await asyncio.gather(*[session(c, page, p, outdir) for c, p in zip(chs, parts)])
        asyncio.run(main())
    finally:
        for c in chs:
            c.close()


def code_key(P):
    h = hashlib.sha1()
    for p in [os.path.join(P, "build", "timeline.json"), os.path.join(P, "scenes.js")] + \
             [os.path.join(HERE, f) for f in sorted(os.listdir(HERE)) if f.endswith((".js", ".py"))] +              ([os.path.join(textures_dir(), "hi.json")] if textures_dir() and os.path.exists(os.path.join(textures_dir(), "hi.json")) else []):
        h.update(open(p, "rb").read())
    return h.hexdigest()[:16]


def sheet(paths, labels, out, cols=6, tw=240):
    from PIL import Image, ImageDraw
    ims = [Image.open(p).convert("RGB") for p in paths]
    th = int(tw * ims[0].height / ims[0].width)
    rows = (len(ims) + cols - 1) // cols
    S = Image.new("RGB", (cols * tw, rows * (th + 22)), (30, 30, 30))
    d = ImageDraw.Draw(S)
    for i, (im, lab) in enumerate(zip(ims, labels)):
        x, y = (i % cols) * tw, (i // cols) * (th + 22)
        S.paste(im.resize((tw, th)), (x, y + 22))
        d.text((x + 4, y + 4), lab[:40], fill=(255, 210, 90))
        # the X cut's band
        ty, by = int(343 / 1920 * th) + y + 22, int(1577 / 1920 * th) + y + 22
        d.line([(x, ty), (x + tw, ty)], fill=(255, 60, 60)); d.line([(x, by), (x + tw, by)], fill=(255, 60, 60))
    S.save(out, quality=88)


def main():
    pos = [a for i, a in enumerate(sys.argv[1:]) if not a.startswith("--") and not (i > 0 and sys.argv[i].startswith("--"))]
    if pos and pos[0] in ("stills", "frames", "zones"):
        P, mode = os.path.abspath("."), pos[0]
    elif len(pos) >= 2 and pos[1] in ("stills", "frames", "zones"):
        P, mode = os.path.abspath(pos[0]), pos[1]
    else:
        sys.exit(__doc__)
    arg = lambda name, d=None: sys.argv[sys.argv.index(name) + 1] if name in sys.argv else d
    page, tl = build_page(P)
    nframes = int(round(tl["duration"] * FPS))
    t0 = time.time()
    if mode == "zones":
        zones(page, nframes, arg("--preset", "shorts"), int(arg("--every", 2)))
        return
    if mode == "stills":
        out = os.path.join(P, "build", "stills")
        shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
        if arg("--times"):
            times = [float(x) for x in arg("--times").split(",")]
            labels = ["%.2fs" % t for t in times]
        else:
            # one per scene: ask the page for the scene starts
            js = os.path.join(P, "build", "scene_starts.json")
            starts = scene_starts(page)
            json.dump(starts, open(js, "w"))
            at = float(arg("--at", 0.6))
            times, labels = [], []
            for i, (s, e, name) in enumerate(starts):
                times.append(s + (e - s) * at); labels.append("%d %s %.1fs" % (i, name, s + (e - s) * at))
        jobs = [(int(round(t * FPS)), "s%03d.png" % i) for i, t in enumerate(times)]
        run(page, jobs, out, int(arg("--workers", 3)))
        paths = [os.path.join(out, j[1]) for j in jobs]
        sheet(paths, labels, os.path.join(P, "build", "stills_sheet.jpg"))
        print("%d stills in %.1f s -> build/stills_sheet.jpg" % (len(jobs), time.time() - t0))
    else:
        out = os.path.join(P, "build", "frames")
        key = code_key(P)
        kf = os.path.join(out, "KEY")
        only = arg("--only")
        if only:
            want = set()
            for part in only.split(","):
                a_, _, b_ = part.partition("-"); want.update(range(int(a_), int(b_ or a_) + 1))
            for f in want:
                fp = os.path.join(out, "f%05d.png" % f)
                if os.path.exists(fp):
                    os.remove(fp)
        elif os.path.exists(kf) and open(kf).read() != key:
            shutil.rmtree(out)
        os.makedirs(out, exist_ok=True)
        open(kf, "w").write(key)
        jobs = [(f, "f%05d.png" % f) for f in range(nframes) if not os.path.exists(os.path.join(out, "f%05d.png" % f))]
        print("%d frames to draw (%d total)" % (len(jobs), nframes), flush=True)
        if jobs:
            run(page, jobs, out, int(arg("--workers", 4)))
        json.dump(dict(frames=nframes, fps=FPS, size=[W, H]), open(os.path.join(P, "build", "render.json"), "w"))
        print("frames done in %.1f s" % (time.time() - t0))


ZONES = {
    # where a platform draws over the video (1080x1920): text must stay out of these
    "shorts": [("top bar", 0, 0, 1080, 140), ("bottom: title + channel", 0, 1536, 1080, 1920), ("right: buttons", 930, 880, 1080, 1520)],
    "x": [("above the 7:8 band", 0, 0, 1080, 343), ("below the 7:8 band", 0, 1577, 1080, 1920)],
}


def zones(page, nframes, preset, every):
    """Draw every `every`-th frame (no screenshots) and list each text whose box enters a zone or leaves the frame."""
    Z = ZONES[preset] + [("off the left edge", -9999, 0, 0, 1920), ("off the right edge", 1080, 0, 9999, 1920)]
    ch = Chrome()
    hits = {}
    try:
        async def go():
            import websockets
            async with websockets.connect(ch.ws_url, max_size=50_000_000) as ws:
                n = 0

                async def call(m, p=None):
                    nonlocal n
                    n += 1
                    await ws.send(json.dumps({"id": n, "method": m, "params": p or {}}))
                    while True:
                        r = json.loads(await ws.recv())
                        if r.get("id") == n:
                            return r.get("result", {})
                await call("Emulation.setDeviceMetricsOverride", {"width": W, "height": H, "deviceScaleFactor": 1, "mobile": False})
                await call("Page.enable")
                await call("Page.navigate", {"url": file_url(page)})
                for _ in range(300):
                    r = await call("Runtime.evaluate", {"expression": "typeof window.setFrame === 'function' && !!window.READY", "returnByValue": True})
                    if r.get("result", {}).get("value"):
                        break
                    await asyncio.sleep(0.05)
                await call("Runtime.evaluate", {"expression": "window.READY", "awaitPromise": True})
                for f in range(0, nframes, every):
                    r = await call("Runtime.evaluate", {"expression": "(setFrame(%d), JSON.stringify(G.boxes))" % f, "returnByValue": True})
                    if "exceptionDetails" in r:
                        raise RuntimeError("frame %d: %s" % (f, json.dumps(r["exceptionDetails"])[:600]))
                    for b in json.loads(r["result"]["value"]):
                        for name, x0, y0, x1, y1 in Z:
                            if b["x0"] < x1 and b["x1"] > x0 and b["y0"] < y1 and b["y1"] > y0:
                                k = (b["t"], name)
                                hits.setdefault(k, []).append(f / FPS)
        asyncio.run(go())
    finally:
        ch.close()
    if not hits:
        print("zones (%s): every text is clear" % preset)
        return
    print("zones (%s): %d texts touch an overlay" % (preset, len(hits)))
    for (t, name), ts in sorted(hits.items(), key=lambda kv: kv[1][0]):
        print("  %5.1f-%5.1f s  %-20s %s" % (ts[0], ts[-1], name, t))


def scene_starts(page):
    """[start, end, label] for every scene, read from the page itself."""
    ch = Chrome()
    try:
        async def go():
            import websockets
            async with websockets.connect(ch.ws_url, max_size=50_000_000) as ws:
                n = 0

                async def call(m, p=None):
                    nonlocal n
                    n += 1
                    await ws.send(json.dumps({"id": n, "method": m, "params": p or {}}))
                    while True:
                        r = json.loads(await ws.recv())
                        if r.get("id") == n:
                            return r.get("result", {})
                await call("Page.enable")
                await call("Page.navigate", {"url": file_url(page)})
                for _ in range(300):
                    r = await call("Runtime.evaluate", {"expression": "typeof window.setFrame === 'function'", "returnByValue": True})
                    if r.get("result", {}).get("value"):
                        break
                    await asyncio.sleep(0.05)
                r = await call("Runtime.evaluate", {"expression": """(function(){const L=window.SCENES.map((s,i)=>[G.cue(s.at), s.name||('scene '+i)]).sort((a,b)=>a[0]-b[0]);
                  return L.map((x,i)=>[x[0], i+1<L.length?L[i+1][0]:TIMELINE.duration, x[1]]);})()""", "returnByValue": True})
                if "exceptionDetails" in r:
                    raise RuntimeError(json.dumps(r["exceptionDetails"])[:900])
                return r["result"]["value"]
        return asyncio.run(go())
    finally:
        ch.close()


if __name__ == "__main__":
    main()
