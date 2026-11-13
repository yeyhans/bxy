"""check_script.py: check script.json against the format before recording anything.

    PY check_script.py [PROJECT]

FAIL = fix before narrate.py. WARN = usually fix. The rules come from reference/style.md.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import LANG_DEFAULTS, lang_of, tag_of, project_args, script_lines  # noqa: E402

WPM = 240          # the format talks at 220-260 words a minute while speaking


def main():
    P, _ = project_args()
    S = json.load(open(os.path.join(P, "script.json"), encoding="utf-8"))
    out, fails = [], 0

    def say(level, msg):
        nonlocal fails
        out.append("%-4s %s" % (level, msg)); fails += level == "FAIL"
    lines = script_lines(S)
    lang, tag = lang_of(S), tag_of(S)
    wpm = LANG_DEFAULTS[lang]["wpm"]
    if lang == "en":
        if not S.get("title") or "i guess" not in S["title"].lower():
            say("WARN", 'title should read "history of <x>, i guess" (it\'s on the title card)')
    elif not S.get("title") or tag not in S["title"].lower():
        say("WARN", 'title should end on the tag word, e.g. "historia de <x>, %s" (it\'s on the title card)' % tag)
    ids = [L.get("id") for L in lines]
    if len(set(ids)) != len(ids):
        say("FAIL", "line ids repeat: %s" % ids)
    spoken = [L for L in lines if "say" in L and "sing" not in L]
    sung = [L for L in lines if "sing" in L]
    words = 0
    for L in lines:
        t = L.get("say") or L.get("sing") or ""
        if "TODO" in t or not t.strip():
            say("FAIL", "%s is still a placeholder" % L.get("id")); continue
        if "say" in L and "sing" not in L:
            n = len(t.split()); words += n
            if re.search(r"\d", t):
                say("FAIL", '%s has digits ("%s"): write numbers as words, "nineteen sixty nine", "two thousand five"' % (L["id"], re.search(r"\S*\d\S*", t).group()))
            if n > 18:
                say("WARN", "%s is %d words: split it, one picture per short sentence" % (L["id"], n))
            if t != t.lower():
                say("WARN", "%s has capitals: the format is all lowercase" % L["id"])
    if not sung:
        say("WARN", "no jingle: add 1-3 sung lines ({\"id\": \"J1\", \"sing\": \"eee-maaail!\"}) at the turns")
    if len(sung) > 3:
        say("WARN", "%d jingles: keep it to 1-3 (they're the treat)" % len(sung))
    if spoken and tag not in spoken[-1]["say"].lower():
        say("WARN", 'the last line usually lands on "%s."' % ("i guess" if tag == "guess" else tag))
    ta = S.get("title_at", "start")
    if ta != "start" and ta not in ids:
        say("FAIL", "title_at %s is not a line id" % ta)
    if ta == "start":
        say("WARN", 'title_at is "start": a cold open (the first joke, then the title card) hooks a vertical feed better')
    est = words / wpm * 60 + 1.9 * len(sung) + float(S.get("title_len", 0.9)) + 0.07 * len(lines) + 1.2
    print("%d spoken lines, %d sung, %d words, about %.0f s at %d wpm" % (len(spoken), len(sung), words, est, wpm))
    for o in out:
        print(o)
    if not out:
        print("PASS")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
