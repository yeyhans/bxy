"""check_cues.py [PROJECT]: every W_("L3", "word"[, n]) / G.w(...) cue in scenes.js and every word cue in sounds.json must
exist in build/timeline.json as heard (numbers as digits, "colours" may be heard "colors"), with the same prefix fallback
G.w uses. Run it after narrate.py / import_voice.py and before rendering: a missing word stops the render."""
import json, os, re, sys
d = sys.argv[1] if len(sys.argv) > 1 else "."
t = json.load(open(os.path.join(d, "build", "timeline.json"), encoding="utf-8")); L = {l["id"]: l for l in t["lines"]}
norm = lambda w: re.sub(r"[^a-záéíóúüñ0-9']", "", w.lower()).strip("'")
bad = 0
srcs = [("scenes.js", r'(?:W_\(|G\.w\(|heldAt\(|build\(T,\s*)\s*"(\w+)",\s*"([^"]+)"(?:,\s*(\d+))?'), ("sounds.json", r'\[\s*"(\w+)",\s*"([^"]+)"(?:,\s*(\d+))?\]\s*,\s*"')]
for src, rx in srcs:
    p = os.path.join(d, src)
    if not os.path.exists(p): continue
    for m in re.finditer(rx, open(p, encoding="utf-8").read()):
        lid, word, n = m.group(1), m.group(2), int(m.group(3) or 1)
        l = L.get(lid)
        if l is None: print("MISS line", lid, "in", src); bad += 1; continue
        if l.get("sing"): continue
        ws = [norm(w[2]) for w in l["words"]]; want = norm(word)
        hits = [w for w in ws if w == want] or [w for w in ws if w.startswith(want)]
        if len(hits) < n: print("MISS %s: %s %r (n=%d) heard: %s" % (src, lid, word, n, " ".join(ws))); bad += 1
print(d, "cues ok" if not bad else "%d misses" % bad)
