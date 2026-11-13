"""new_video.py: start a video's folder.

    PY new_video.py FOLDER --topic "coffee" [--slug coffee]

Makes FOLDER/ with script.json (the settings + placeholder lines), sources.md (the fact table), sounds.json and a
starter scenes.js (a cold open on the globe, the title card, the end card, and the helpers every scene uses).
Fill script.json and sources.md first, then the scenes. Nothing here is a finished video: check_script.py fails on the
placeholders until they're replaced.
"""
import datetime, json, os, re, sys

TEMPLATE_SCENES = r'''/* "%(title)s": every scene, timed to the words in build/timeline.json.
   at: "L3" = the line's first word, ["L6", "word"] = that word (as heard: numbers as digits, see timeline.json), or seconds.
   Read reference/library.md (the drawing library) and reference/style.md (the format) first; examples/internet/scenes.js
   is a finished 70 s video to borrow from. */
const CX = G.CX, CY = G.CY, TOP = G.TOP, BOT = G.BOT;
const TITLE_BG = "#2f2bff", TITLE_FG = "#ffe14d";
const W_ = (id, w, n) => G.w(id, w, n);
const LINES = TIMELINE.lines.map((l) => l.id).filter((id) => id !== "CTA"), LAST = LINES[LINES.length - 1];
/* the places on the globe: name: [lat, lon] (source them in sources.md) */
const PL = {};
/* colour-edge pairs for the plain text (up-left, down-right) and jingle tints */
const E = [["#ff9a1f", "#1f6bff"], ["#ff4fd8", "#2bd94a"], ["#2fd9ff", "#ff3d7f"], ["#ffe94a", "#8a4dff"]];
const TINTS = [[1, 0.42, 0.95, 0.55], [0.35, 0.9, 1, 0.5], [1, 0.95, 0.3, 0.5], [0.4, 1, 0.5, 0.5]];
/* the plain text: big, lowercase, in the picture, popping on its word */
function say(T, t0, txt, x, y, size, o) {
  if (T < t0) return;
  o = Object.assign({}, o || {}); const e = E[o.e || 0]; delete o.e;
  G.text(txt, x, y, Object.assign({ style: "edges", size: size, edges: e, scale: G.pop(T, t0, 0.12), maxw: 1010 }, o));
}
function titleCard(T, t, k) {
  G.bg(TITLE_BG);
  const m = TIMELINE.title.match(/^(history of(?: the)?|historia (?:del|de las|de los|de la|de))\s+(.+?),\s*(?:i guess|supongo)$/i) || [null, "history of", TIMELINE.title];
  const s = 1 + t * 0.015;
  G.text(m[1], CX, CY - 190, { font: "casual", size: 132, color: TITLE_FG, scale: s, maxw: 980 });
  G.text(m[2], CX, CY - 20, { font: "casual", size: 176, color: TITLE_FG, scale: s, maxw: 980 });
  G.text("i guess", CX, CY + 160, { font: "casual", size: 132, color: TITLE_FG, scale: s * (k === undefined ? 1 : k), rot: k !== undefined && k < 1.2 ? (1.2 - k) * 8 : 0 });
}

window.SCENES = [
  /* the cold open: the planet from frame 0, then a fast dive to the first place */
  { name: "cold open", at: TIMELINE.title_start === 0 ? "L1" : 0, draw: (T, t) => {
      const P = G.globe(T, G.fly(T, [[0, { lat: 18, lon: -30, r: 370 }], [G.Lend("L1"), { lat: 30, lon: -60, r: 900 }]]));
      say(T, G.L("L1"), "replace me", CX, CY - 300, 160, { e: 0, rot: -4 });
      G.stamp(2000, T, G.L("L1"));
    } },
  { name: "title", at: TIMELINE.title_start || 0, draw: (T, t) => titleCard(T, t) },
  { name: "end card", at: [LAST, "guess"], draw: (T, t) => titleCard(T, t, G.pop(T, W_(LAST, "guess"), 0.25)) },
  /* the optional call to action (script.json "cta"), then a beat of the last picture */
  ...(TIMELINE.lines.some((l) => l.id === "CTA") ? [{ name: "cta", at: "CTA", draw: (T, t) => G.cta(T) }] : []),
];
'''


def main():
    a = sys.argv[1:]
    if not a or a[0].startswith("--"):
        sys.exit(__doc__)
    folder = os.path.abspath(a[0])
    opt = lambda n, d=None: a[a.index(n) + 1] if n in a else d
    topic = opt("--topic")
    if not topic:
        sys.exit('give the topic: --topic "coffee"')
    import unicodedata                    # BxY: "café" -> "cafe", not "caf"
    plain = unicodedata.normalize("NFKD", topic.lower()).encode("ascii", "ignore").decode()
    slug = opt("--slug") or re.sub(r"[^a-z0-9]+", "_", plain).strip("_")
    lang = opt("--lang", "en")
    if lang not in ("en", "es"):
        sys.exit('--lang is "en" or "es"')
    title = ("historia de %s, supongo" if lang == "es" else "history of %s, i guess") % topic.lower()
    tag = "supongo" if lang == "es" else "guess"
    os.makedirs(folder, exist_ok=True)
    for d in ("build", "out", "qa", "voice"):
        os.makedirs(os.path.join(folder, d), exist_ok=True)
    sp = os.path.join(folder, "script.json")
    if os.path.exists(sp):
        sys.exit("%s already has a script.json: not touching it" % folder)
    voice = ({"engine": "edge", "voice": "es-CL-LorenzoNeural", "speed": 1.15, "sing_speed": 0.8} if lang == "es"
             else {"voice": "am_liam+am_puck", "speed": 1.25, "sing_speed": 0.75})
    S = {"title": title, "slug": slug, **({"lang": "es"} if lang == "es" else {}),
         "voice": voice,
         "gap": 0.06, "max_pause": 0.27, "lead": 0.15, "title_len": 0.9, "title_at": "L2", "tail": 1.2,
         "lines": [{"id": "L1", "say": "TODO the first date and the first fact, said fast"},
                   {"id": "L2", "say": "TODO the first joke lands here, then the title card"},
                   {"id": "J1", "sing": "TODO a jingle word, stretched: eee-maaail!"},
                   {"id": "L3", "say": "TODO ... and the last line ends on: %s." % ("supongo" if lang == "es" else "i guess")}]}
    json.dump(S, open(sp, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    today = datetime.date.today().isoformat()
    open(os.path.join(folder, "sources.md"), "w", encoding="utf-8").write(
        "# Sources: \"%s\" (read %s)\n\nEvery fact in the script and on screen, where it's used, and where it comes from.\n\n"
        "| Fact as said | Source (opened today) | Note |\n|---|---|---|\n\n## Places on the globe\n\n| Place | lat, lon | Source |\n|---|---|---|\n\n"
        "## Left out\n\n- \n" % (title, today))
    json.dump([["TITLE", "sting", -4]], open(os.path.join(folder, "sounds.json"), "w", encoding="utf-8"))
    open(os.path.join(folder, "scenes.js"), "w", encoding="utf-8").write((TEMPLATE_SCENES % {"title": title}).replace('"guess"', '"%s"' % tag))
    print("made %s: script.json, sources.md, sounds.json, scenes.js (title: %s)" % (folder, title))


if __name__ == "__main__":
    main()
