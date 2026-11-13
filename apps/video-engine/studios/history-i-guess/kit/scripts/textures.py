"""textures.py: the globe's textures from NASA's public-domain Earth maps (Blue Marble Next Generation for the day side,
Black Marble 2016 for the night lights).

    PY textures.py fetch                 download the NASA maps into HOME/textures/raw (about 51 MB, once)
    PY textures.py make [--size 8192]    -> HOME/textures/day.jpg, night.jpg (equirectangular, 2:1)
    PY textures.py crop NAME LAT0 LAT1 LON0 LON1   -> HOME/textures/hi_NAME_day.jpg / _night.jpg, a sharp patch for close dives

Sources (NASA imagery is not copyrighted; credit "NASA Earth Observatory"):
  Blue Marble Next Generation w/ topography and bathymetry, July 2004 (Reto Stöckli, NASA Earth Observatory)
  Black Marble 2016 colour map (NASA Earth Observatory / Joshua Stevens, Suomi NPP VIIRS)
  The Moon: CGI Moon Kit, LRO colour map (NASA's Scientific Visualization Studio) -> moon.jpg, a second body for G.globe
"""
import json, os, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import HOME  # noqa: E402

A = "https://assets.science.nasa.gov/content/dam/science/esd/eo/images/"
SRC = {
    "day_big": A + "bmng/bmng-topography-bathymetry/july/world.topo.bathy.200407.3x21600x10800.jpg",
    "day_small": A + "bmng/bmng-topography-bathymetry/july/world.topo.bathy.200407.3x5400x2700.jpg",
    "night": A + "imagerecords/144000/144898/BlackMarble_2016_3km.jpg",
    "moon": "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_4k.tif",
}


def tdir(*p):
    d = os.path.join(os.environ.get("GLOBE_TEXTURES") or os.path.join(HOME, "textures"), *p)
    return d


def raw(name):
    return os.path.join(tdir("raw"), SRC[name].rsplit("/", 1)[1])


def fetch(big=True):
    os.makedirs(tdir("raw"), exist_ok=True)
    for k in (["day_big"] if big else ["day_small"]) + ["night", "moon"]:
        p = raw(k)
        if os.path.exists(p) and os.path.getsize(p) > 100000:
            print("have", os.path.basename(p)); continue
        print("downloading", SRC[k]); urllib.request.urlretrieve(SRC[k], p + ".part"); os.replace(p + ".part", p)


def fetch_one(k):
    os.makedirs(tdir("raw"), exist_ok=True)
    p = raw(k)
    if not (os.path.exists(p) and os.path.getsize(p) > 100000):
        print("downloading", SRC[k]); urllib.request.urlretrieve(SRC[k], p + ".part"); os.replace(p + ".part", p)


def open_big(p):
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
    return Image.open(p).convert("RGB")


def make(size=8192):
    from PIL import Image
    day = raw("day_big") if os.path.exists(raw("day_big")) else raw("day_small")
    im = open_big(day)
    im.resize((size, size // 2), Image.LANCZOS).save(tdir("day.jpg"), quality=90)
    nt = open_big(raw("night"))
    nt.resize((size, size // 2), Image.LANCZOS).save(tdir("night.jpg"), quality=90)
    print("day.jpg + night.jpg at %dx%d" % (size, size // 2))
    make_moon()


def make_moon():
    """the Moon's colour map (16-bit TIFF) -> moon.jpg, brightened a little so it reads as the bright grey we see"""
    from PIL import Image
    import numpy as np
    src = raw("moon")
    if not os.path.exists(src):
        return
    im = Image.open(src)
    a = np.asarray(im).astype(np.float32)
    if a.max() > 255:
        a = a / 257.0
    if a.ndim == 2:
        a = np.stack([a] * 3, -1)
    a = a[..., :3]
    a = np.clip(255 * (a / 255.0) ** 0.85 * 1.15, 0, 255).astype(np.uint8)
    Image.fromarray(a).save(tdir("moon.jpg"), quality=90)
    print("moon.jpg at %dx%d" % (a.shape[1], a.shape[0]))


def crop(name, lat0, lat1, lon0, lon1):
    """a sharp patch (the big map's own resolution) for close dives; the globe shader swaps it in inside the box"""
    from PIL import Image
    out = {}
    for kind, src in (("day", raw("day_big")), ("night", raw("night"))):
        im = open_big(src)
        W, H = im.size
        box = (int((lon0 + 180) / 360 * W), int((90 - lat1) / 180 * H), int((lon1 + 180) / 360 * W), int((90 - lat0) / 180 * H))
        c = im.crop(box)
        p = tdir("hi_%s_%s.jpg" % (name, kind))
        c.save(p, quality=92)
        out[kind] = [c.size[0], c.size[1]]
    meta_p = tdir("hi.json")
    meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
    meta[name] = dict(lat0=lat0, lat1=lat1, lon0=lon0, lon1=lon1, size=out)
    json.dump(meta, open(meta_p, "w"), indent=1)
    print("hi_%s: %s" % (name, out))


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        sys.exit(__doc__)
    os.makedirs(tdir(), exist_ok=True)
    if a[0] == "fetch":
        fetch(big="--small" not in a)
    elif a[0] == "moon":
        fetch_one("moon"); make_moon()
    elif a[0] == "make":
        make(int(a[a.index("--size") + 1]) if "--size" in a else 8192)
    elif a[0] == "crop":
        crop(a[1], *[float(x) for x in a[2:6]])
    else:
        sys.exit(__doc__)
