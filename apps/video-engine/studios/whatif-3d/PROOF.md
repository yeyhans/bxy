# Proof: every blind rating

How the ratings were run:
- **Blind:** each rating is a fresh Claude agent that sees one video's frames and metrics (`rater/rate_prep.py`) plus `rater/RATER_PROMPT.md`. It isn't told who made the video.
- **Scale:** 7 rows (hook, premise, look, motion, captions, voice and sound, pacing), 0 to 10 each.
- **Verdict:** GOOD needs every row at 7 or more and 56+/70.

## 1. Calibration (can it tell good from bad?)
| video | total | verdict | lowest row |
|---|---|---|---|
| original page, "toilet" (1.5M YouTube / 6.1M TikTok) | 61 | GOOD | look 8 |
| original page, "fireplace" (2.9M YouTube / 1.6M TikTok) | 55 | ASS | look 6 (cartoon flame) |
| deliberately weak render (grey clay, one static shot, robot voice, huge captions) | 31 | ASS | look 0 |

**Read:** it separates them clearly, and it's strict on look: it even fails a real 2.9M-view video for a cartoon flame.

**Its blind spot is sound.** It can't hear, and it gave the robot voice full marks from the numbers alone. So `check.py` fails any video that isn't voiced by the Kokoro `am_michael` model.

## 2. The hero ("How a Hole in Your Yard Becomes a Pond"), two raters per version
| version | rater A | rater B | look A / B | what changed / what failed |
|---|---|---|---|---|
| v1 | 55 | 56 | 4 / 5 | toy fish clipping, tinted-box water, flat ice and filter |
| v2 | 59 | 58 | 6 / 6 | new water, ice, foam and plastic materials; still nose-up fish, a white-bead waterfall, flat leaves |
| v3 | 57 | 56 | 4 / 5 | level koi, stony floor, scum; still "reads as a swimming pool" |
| v5 | 57 | 57 | 5 / 5 | organic garden pond (natural outline, shelves, stones); box fins rendered as squares, a smooth clay pit at 0 s |
| v6 | 59 | 59 | 6 / 6 | fins in the mesh, soil-textured pit with loose clods, subtle caustics; no render faults found; fish, lily pads and the pit at 0 s still read as cheaper than the reference |

(v4 was replaced by v5 before it finished rendering.)

**In every version, every row except look scored 7 to 10:** hook 8-9, premise 8-9, motion 7-8, captions 8-9, voice and sound 9-10, pacing 8-9. The best total is v6 at 59/70: above the original page's own fireplace video (55) and just under its toilet video (61). Look is the one row that hasn't reached 7.

A real voice bug was found from the raters' transcripts ("liner" heard as "line"): lines were cut at the speech-to-text word end, which lands early. Fixed in the kit (the cut now follows the last audible sample) from v4 on.

## 3. Replication: fresh agents in empty folders, told only "you pick"
| run | guide | rater A | rater B | look | verdict |
|---|---|---|---|---|---|
| Rainwater Tank | v1 | 57 | | 6 | ASS (look) |
| French Drain | v1 | 57 | | 4 | ASS (look) |
| Rainwater Tank, look step redone with guide v2 | v2 | 57 | 58 | 5 / 5 | ASS (look): pipes ending in mid-soil, flat pit floor |
| French Drain, look step redone with guide v2 | v2 | 59 | 58 | 5 / 5 | ASS (look): a water plane clipping the cut face, glass-disc puddles |

Both runs rendered on the first try and passed `check.py`. Every row except look scored 7 to 10 in every rating. Each look failure became a "Look rule" in the guide (section 5.4).
