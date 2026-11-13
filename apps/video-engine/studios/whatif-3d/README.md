# whatif-3d-studio: How a Hole in Your Yard Becomes ___ (one 3D Short with Claude, free)

https://theoardley.orderly-oak.workers.dev/r/whatif-3d-studio/

## What you get
- **`whatif_guide.md`:** one paste. Saved as `CLAUDE.md` in an empty folder, it makes Claude Code produce one finished 60 to 75 s vertical 3D explainer, in the format that took a new page to 58.5M TikTok views in its first 19 days.
  - The format: a house and a striped lawn over a soil block cut open like a cake. A calm narrator "builds" an everyday thing: "If you dig a hole in your yard and fill it with a hose, you have a pond. But... So you... This is a liner."
  - It carries its own kit (8 Python files it unpacks itself) and a worked example (the pond).
- **The worked example, rendered** (the pond, 46 MB) is left out of this download to keep it small. It's on the page you downloaded this from.
- **`rater/`:** a blind rater (`RATER_PROMPT.md` + `rate_prep.py`) that scores any Short on 7 rows (hook, premise, look, motion, captions, voice and sound, pacing) and says GOOD or ASS.

## One-paste setup
1. Make an empty folder and save `whatif_guide.md` (from this download) in it as `CLAUDE.md`.
2. Open Claude Code there and say: *"Make one video. You pick the topic."* (or name one).
3. Claude does the rest itself:
   - creates a Python venv;
   - installs the free packages;
   - finds Blender, or downloads the portable build;
   - fetches about 570 MB of CC0 textures and models, the font and the voice model;
   - writes the script and the scene, renders, and runs the checks.

You need a **Claude subscription** (for Claude Code) and nothing else: no API keys, accounts or paid tools.
- 3D: Blender (EEVEE).
- Textures, models and sky: Poly Haven (CC0).
- Narrator: Kokoro-82M `am_michael`, which runs on your PC.
- Word timing: faster-whisper.
- Captions: Nunito.
- Music bed and sound effects: synthesized in code.

## How long one video takes (RTX 3070, Ryzen 5 5600X)
| step | time |
|---|---|
| setup (packages, assets) | about 10 min, once |
| premise, script, fact check, voice | about 15 min |
| scene + still checks (Claude writes and looks) | 45 to 90 min |
| final render, 1080x1920, ~2,200 frames | about 60 to 90 min (1.5 to 2.5 s a frame), unattended |
| sound, captions, encode, checks | about 3 min |

**Total: about 2.5 to 3 hours, mostly unattended.** Slower GPUs take longer, but every step works on any GPU.

## Proof
**Blind-rated 59/70.** The original page's own videos scored 55 and 61 on the same rater.
- Hook, premise, motion, captions, voice and pacing score 8 to 10.
- Look scores 6/10, the one row under the rater's 7 bar: the fish and lily pads are still simpler than the yard around them.
- Two fresh runs of the guide, in empty folders with a topic of their own choosing, scored 57 to 59.
See `PROOF.md` for every blind rating: calibration on the original page's own videos plus a deliberately bad render, the hero's versions, and two fresh runs in empty folders.

## Credits
The format comes from the "You Built It" page (TikTok, YouTube, Instagram). This is an independent rebuild with free tools; none of their videos or assets are included.
