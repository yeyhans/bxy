"""El tsunami de fosforo: what a bottle of PK bloom booster does to living soil, seen on the cut face of a pot.
One flowering plant in a pot cut open at its centre plane (y = CY). Underground: roots, a glowing mycorrhizal
network trading phosphorus (magenta) for sugars (amber), protozoa and bacteria. Then a bottle is poured into the
watering: free phosphorus floods the soil, the plant stops paying carbon, the network greys out and breaks apart,
protozoa encyst and the soil drains to grey. Helpers (pot, plant, strands) follow stories/dos-clones/scene.py."""
import math, random
from mathutils import Vector

R = random.Random(23)
CX, CY = 0.0, 0.55                       # pot centre (x) and the cut plane (y)
SOIL_TOP = 0.33                          # substrate surface (z)
POT = [(0.0, 0.0), (0.17, 0.0), (0.205, 0.36), (0.19, 0.36), (0.155, 0.025), (0.0, 0.025)]   # (r, z) wall profile
FILL = [(0.0, 0.025), (0.154, 0.025), (0.187, SOIL_TOP), (0.0, SOIL_TOP)]                    # substrate profile
P_COL, SUGAR_COL, HYPHA_COL = (0.9, 0.02, 0.45), (1.0, 0.45, 0.0), (0.0, 0.45, 1.0)
GREY = (0.36, 0.36, 0.37)


# ------------------------------------------------------------------ helpers

def empty(W, name, loc=(0, 0, 0), parent=None):
    e = W.bpy.data.objects.new(name, None); W.bpy.context.scene.collection.objects.link(e)
    e.location = loc
    if parent: e.parent = parent
    return e


def lathe(W, name, prof, cx, cy, mat, seg=36, k=1.0):
    """the back half (y >= cy) of a solid of revolution, with flat caps on the cut plane y = cy."""
    bm = W.bmesh.new(); rings = []
    for i in range(seg + 1):
        a = math.pi * i / seg
        rings.append([bm.verts.new((cx + k * r * math.cos(a), cy + k * r * math.sin(a), k * z)) for r, z in prof])
    n = len(prof)
    for i in range(seg):
        for j in range(n):
            q = (j + 1) % n
            if prof[j][0] == 0 and prof[q][0] == 0: continue
            f = bm.faces.new((rings[i][j], rings[i][q], rings[i + 1][q], rings[i + 1][j])); f.smooth = True
    bm.faces.new(rings[0]); bm.faces.new(list(reversed(rings[-1])))
    W.bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    W.bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = W.bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = W.bpy.data.objects.new(name, me); W.bpy.context.scene.collection.objects.link(ob)
    me.materials.append(W.M(mat) if isinstance(mat, str) else mat)
    return ob


def leaf_mat(W, name, tint=(0.14, 0.40, 0.07), emit=None):
    m = W.tex_mat(name, "leafy_grass", 0.3, tint=tint, sat=1.5, bright=0.6, normal=0.25, rough=0.95)
    N = m.node_tree.nodes; L = m.node_tree.links; b = N["Principled BSDF"]
    src = N[m["base_color_node"]]
    out = src.outputs["Result"] if "Result" in src.outputs else src.outputs["Color"]
    hs = N.new("ShaderNodeHueSaturation"); hs.name = "WILT"
    L.new(out, hs.inputs["Color"]); L.new(hs.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Specular IOR Level"].default_value = 0.0
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = 0.0
    return m


def leaflet(bm, bx, Ll, w, th, steps=22):
    """one serrated, lanceolate leaflet from (bx, 0, 0) along angle th in the XY plane (a shallow V, tip curling down)."""
    dx, dy = math.cos(th), math.sin(th); px, py = -dy, dx
    mid, lef, rig = [], [], []
    for i in range(steps + 1):
        u = i / steps
        hw = w * math.sin(math.pi * min(1.0, u ** 0.7)) ** 1.1
        if 0 < i < steps and i % 2: hw *= 0.74                         # saw teeth
        z = -0.22 * Ll * u * u
        cx, cy = bx + dx * Ll * u, dy * Ll * u
        mid.append(bm.verts.new((cx, cy, z)))
        lef.append(bm.verts.new((cx + px * hw, cy + py * hw, z + 0.3 * hw)))
        rig.append(bm.verts.new((cx - px * hw, cy - py * hw, z + 0.3 * hw)))
    for i in range(steps):
        bm.faces.new((mid[i], mid[i + 1], lef[i + 1], lef[i]))
        bm.faces.new((mid[i], rig[i], rig[i + 1], mid[i + 1]))


def fan(W, name, L, n, mat):
    """a palmate fan leaf: petiole along +x, then n serrated leaflets spread from its tip."""
    bm = W.bmesh.new()
    P = L * 0.5
    res = W.bmesh.ops.create_cube(bm, size=1.0)
    for v in res["verts"]:
        v.co.x = 0.006 + (v.co.x + 0.5) * (P - 0.006); v.co.y *= 0.005; v.co.z *= 0.004
    spec = {7: ([-84, -57, -29, 0, 29, 57, 84], [0.4, 0.68, 0.9, 1.0, 0.9, 0.68, 0.4]),
            5: ([-62, -31, 0, 31, 62], [0.55, 0.85, 1.0, 0.85, 0.55]),
            3: ([-34, 0, 34], [0.75, 1.0, 0.75])}[n]
    for th, f in zip(*spec):
        leaflet(bm, P, L * f, L * f * 0.13, math.radians(th))
    W.bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = W.bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = W.bpy.data.objects.new(name, me); W.bpy.context.scene.collection.objects.link(ob)
    me.materials.append(mat)
    return ob


def bud(W, name, parent, loc, size, rr, mats):
    """a flower cluster: calyxes, orange pistil hairs and glassy trichome heads."""
    e = empty(W, name, loc, parent)
    pts = []
    for i in range(42):
        u = rr.random(); z = (u - 0.3) * size * 1.15
        rad = size * 0.42 * (1 - abs(u - 0.45) * 0.9); a = rr.random() * 6.283
        p = (rad * math.cos(a) * 0.8, rad * math.sin(a) * 0.8, z); pts.append(p)
        c = W.sphere(f"{name}_c{i}", size * 0.13 * rr.uniform(0.75, 1.1), p, mats["bud"], squash=1.7, noise=0.25, seg=10)
        c.rotation_euler = (rr.uniform(-0.6, 0.6), rr.uniform(-0.6, 0.6), 0); c.parent = e
    for i in range(11):
        p = Vector(pts[i % len(pts)]); d = (Vector((p.x, p.y, 0.4 * size)) + Vector((0, 0, 0.01))).normalized()
        h = W.cyl(f"{name}_p{i}", 0.0014, size * 0.32, tuple(p * 1.05), mats["pistil"], verts=5); h.parent = e
        h.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    for i in range(70):
        p = Vector(pts[rr.randrange(len(pts))]); off = Vector((rr.uniform(-1, 1), rr.uniform(-1, 1), rr.uniform(-0.5, 1))).normalized()
        q = p + off * size * 0.14
        t = W.sphere(f"{name}_t{i}", 0.0028, tuple(q), mats["tri"], seg=6); t.parent = e
    return e


def plant(W, name, loc, mat, seed, H=1.0, buds=False, mats=None):
    """a stylised clone: tapered stem, 6 nodes of opposite fan leaves turning 90 degrees per node, a top crown.
    Everything is parented to one root empty at the substrate surface; scale the root to grow it."""
    rr = random.Random(seed)
    root = empty(W, name, loc)
    st = W.cyl(name + "_stem", 0.014, H + 0.04, (0, 0, -0.04), mat, verts=12, r2=0.005); st.parent = root
    fans, bud_pts, budobs = [], [], []
    sizes = [0.55, 0.8, 1.0, 1.0, 0.85, 0.65]
    for k in range(6):
        h = 0.07 + (H - 0.13) * k / 5
        yaw0 = math.radians(k * 90 + rr.uniform(-15, 15)); s = sizes[k]
        for side in (0, 1):
            yaw = yaw0 + math.pi * side + rr.uniform(-0.15, 0.15)
            elev = math.radians(22 + 5 * k + rr.uniform(-6, 6))
            f = fan(W, f"{name}_f{k}{side}", 0.27 * s, 7 if s > 0.7 else 5, mat); f.parent = root
            f.location = (0, 0, h); f.rotation_euler = (rr.uniform(-0.12, 0.12), -elev, yaw); fans.append(f)
            g = fan(W, f"{name}_g{k}{side}", 0.15 * s, 5, mat); g.parent = root
            g.location = (0, 0, h + 0.015); g.rotation_euler = (0, -elev - math.radians(18), yaw + math.pi / 2); fans.append(g)
        if buds and k >= 3:
            for side in (0, 1):
                a = yaw0 + math.pi * side + math.pi / 4
                bud_pts.append(((0.04 * math.cos(a), 0.04 * math.sin(a), h + 0.04), 0.05 + 0.006 * k))
    for j in range(3):
        f = fan(W, f"{name}_top{j}", 0.13, 5, mat); f.parent = root
        f.location = (0, 0, H - 0.01); f.rotation_euler = (0, -math.radians(58), math.radians(j * 120 + 20)); fans.append(f)
    if buds:
        bud_pts.append(((0, 0, H + 0.035), 0.1))
        for i, (p, sz) in enumerate(bud_pts):
            budobs.append(bud(W, f"{name}_bud{i}", root, p, sz, rr, mats))
    return dict(root=root, fans=fans, buds=budobs, bud_pts=bud_pts)

def area(W, name, loc, size, energy, color, rot=(0, 0, 0)):
    ld = W.bpy.data.lights.new(name, "AREA"); ld.size = size; ld.energy = energy; ld.color = color
    ob = W.bpy.data.objects.new(name, ld); W.bpy.context.scene.collection.objects.link(ob)
    ob.location = loc; ob.rotation_euler = tuple(math.radians(a) for a in rot)
    return ob


def key_light(W, ob, keys, what="energy"):
    for t, v in keys:
        setattr(ob.data, what, v); ob.data.keyframe_insert(what, frame=W.fr(t))


def no_normal(m):
    """drop the normal map: tangent-space normals on meshes without UVs shade thin leaves black on one side."""
    nt = m.node_tree
    for l in list(nt.nodes["Principled BSDF"].inputs["Normal"].links): nt.links.remove(l)
    return m


def rin(z):
    """inner half-width of the substrate at height z."""
    return 0.154 + 0.033 * (z - 0.025) / 0.305


def add_hs(m, name):
    """insert a named Hue/Saturation node before the base colour of a tex_mat material, to key its colour."""
    N = m.node_tree.nodes; L = m.node_tree.links; b = N["Principled BSDF"]
    src = N[m["base_color_node"]]
    out = src.outputs["Result"] if "Result" in src.outputs else src.outputs["Color"]
    hs = N.new("ShaderNodeHueSaturation"); hs.name = name
    L.new(out, hs.inputs["Color"]); L.new(hs.outputs["Color"], b.inputs["Base Color"])
    return m


def strands(W, name, n, starts, times, mat, r, seed, step=0.03, nsteps=(5, 9), down=False):
    """branching threads (roots or hyphae) drawn on the cut face of the pot. times(i, rr) -> (t0, t1) to grow a
    thread, or None for one that is there from the start. Returns [dict(pts=, t1=, ob=)]."""
    rr = random.Random(seed)

    def inside(x, z):
        return 0.04 < z < SOIL_TOP - 0.015 and abs(x - CX) < rin(z) - 0.014
    out = []
    for i in range(n):
        x, z = starts(i, rr)
        ang = (-math.pi / 2 + rr.uniform(-0.9, 0.9)) if down else rr.uniform(0, 6.283)
        pts = [(x, CY - 0.0022, z)]
        for _ in range(rr.randint(*nsteps)):
            for _try in range(6):
                a = ang + rr.uniform(-0.55, 0.55); nx, nz = x + step * math.cos(a), z + step * math.sin(a)
                if inside(nx, nz): break
                ang += 2.2
            else:
                break
            ang, x, z = a, nx, nz; pts.append((x, CY - 0.0022, z))
        if len(pts) < 3: continue
        t0, t1 = times(i, rr) if times else (None, None)
        ob = W.pipe(f"{name}{i}", pts, r, mat, t0=t0, t1=t1)
        out.append(dict(pts=pts, t1=t1 or 0.0, ob=ob))
    return out


def travel(W, name, pts, t0, t1, mat, size, period, phase, reverse=False):
    """one bead running along a thread again and again between t0 and t1 (a nutrient moving through a hypha)."""
    P = [Vector((p[0], CY - 0.0045, p[2])) for p in (pts[::-1] if reverse else pts)]
    seg = [(P[i + 1] - P[i]).length for i in range(len(P) - 1)]
    total = sum(seg)

    def at(u):
        d = u * total
        for i, L in enumerate(seg):
            if d <= L or i == len(seg) - 1: return P[i].lerp(P[i + 1], min(1.0, d / L))
            d -= L
    ob = W.sphere(name, size, tuple(P[0]), mat, seg=8)
    W.hide_until(ob, t0); W.hide_from(ob, t1)
    for f in range(W.fr(t0), W.fr(t1) + 1, 2):
        u = ((f / W.FPS - t0) / period + phase) % 1.0
        ob.location = at(u); ob.keyframe_insert("location", frame=f)
        s = max(0.001, math.sin(math.pi * u)) ** 0.6; ob.scale = (s, s, s); ob.keyframe_insert("scale", frame=f)
    return ob


def fragments(W, name, pts, mat, r, t, rr):
    """the dead version of a thread: short grey pieces with gaps, shown from t, sagging a little."""
    for j in range(0, len(pts) - 2, 3):
        ob = W.pipe(f"{name}_{j}", pts[j:j + 3], r, mat)
        W.hide_until(ob, t)
        W.move(ob, t, t + 0.7, loc=(rr.uniform(-0.007, 0.007), 0, -rr.uniform(0.004, 0.016)), kind="out")


def microbes(W, name, n, t1, mats, seed):
    """bacteria: small glowing dots drifting on the cut face until t1, then shrinking away."""
    rr = random.Random(seed)
    for i in range(n):
        while True:
            x, z = CX + rr.uniform(-0.17, 0.17), rr.uniform(0.055, SOIL_TOP - 0.03)
            if abs(x - CX) < rin(z) - 0.025: break
        s = W.sphere(f"{name}{i}", rr.uniform(0.003, 0.0045), (x, CY - 0.006, z), mats[i % len(mats)], squash=rr.choice((1.0, 1.8)), seg=8)
        end = t1 + 0.9 * rr.random()
        fq, ph = [rr.uniform(1.2, 2.6) for _ in range(2)], [rr.random() * 6.28 for _ in range(2)]
        for f in range(1, W.fr(end) + 1, 2):
            tt = f / W.FPS
            s.location = (x + 0.01 * math.sin(fq[0] * tt + ph[0]), CY - 0.006, z + 0.008 * math.sin(fq[1] * tt + ph[1]))
            s.keyframe_insert("location", frame=f)
        W.vanish(s, end, "pop", 0.4)


def bottle(W, name, loc, mats):
    """an unbranded booster bottle: white body, plain colour band, black cap. Origin at its base."""
    g = empty(W, name, loc)
    for ob in (W.cyl(name + "_body", 0.045, 0.16, (0, 0, 0), mats["body"], verts=32),
               W.cyl(name + "_sh", 0.045, 0.035, (0, 0, 0.16), mats["body"], verts=32, r2=0.019),
               W.cyl(name + "_neck", 0.019, 0.02, (0, 0, 0.195), mats["body"], verts=24),
               W.cyl(name + "_cap", 0.023, 0.03, (0, 0, 0.212), mats["cap"], verts=24),
               W.cyl(name + "_label", 0.0463, 0.08, (0, 0, 0.045), mats["label"], verts=32),
               W.cyl(name + "_band", 0.0466, 0.022, (0, 0, 0.074), mats["band"], verts=32)):
        ob.parent = g
    return g


# ------------------------------------------------------------------ the scene

def build(W, T):
    s = lambda k: T[k]["start"]
    e = lambda k: T[k]["end"]
    wd = T.word
    col4 = lambda c: (*c, 1.0)

    # ---- key moments
    t_dive = wd("hook", "microscópico") - 0.1
    t_net = wd("network", "red") - 0.2                    # the hyphae grow
    t_p = wd("network", "fósforo") - 0.35                 # phosphorus runs along them to the root
    t_sugar = wd("trade", "azúcares") - 0.3               # sugars run back out
    t_buy = wd("bottle", "compras") - 0.1
    t_pour = wd("bottle", "echas") - 0.25
    t_flood = wd("tsunami", "cae") - 0.1
    t_cut = wd("cut", "corta")                            # the plant stops paying carbon
    t_starve = wd("cut", "sin") - 0.1
    t_col = wd("cut", "colapsa") - 0.05
    t_ec = wd("encyst", "dispara") - 0.1
    t_cyst = wd("encyst", "enquistan") - 0.45
    t_off = wd("encyst", "apaga") - 0.55
    t_more = wd("name", "botellas") - 0.3

    # ---- light: dim sky, a warm grow light over the pot that turns cold when the soil dies
    W.key_value(W.bpy.context.scene.world, "SKY", [(0, 0.35)])
    W.sun().data.energy = 0.8
    W.bpy.data.objects["fill"].data.energy = 0.5
    warm, cold = (1.0, 0.74, 0.48), (0.72, 0.8, 0.95)
    lamp = area(W, "lamp", (0.3, 0.3, 3.0), 2.4, 380, warm)
    front = area(W, "front", (0.0, -3.2, 2.2), 3.0, 330, (1.0, 0.95, 0.9), rot=(60, 0, 0))
    key_light(W, lamp, [(0, warm), (t_off, warm), (t_off + 1.0, cold)], "color")
    key_light(W, lamp, [(0, 380), (t_off, 380), (t_off + 1.0, 250)])
    key_light(W, front, [(0, (1.0, 0.95, 0.9)), (t_off, (1.0, 0.95, 0.9)), (t_off + 1.0, (0.85, 0.9, 1.0))], "color")

    # ---- the room: plank floor, earth walls, a few rocks and weeds at the back
    W.box("floor", (5.3, 7.0, 0.1), (0, -1.5, -0.1), W.tex_mat("floor_m", "dark_wooden_planks", 1.6, tint=(0.7, 0.55, 0.42), normal=0.8))
    rockm = W.tex_mat("rockW", "excavated_soil_wall", 2.4, tint=(0.6, 0.48, 0.38), normal=1.4)
    W.box("wall", (5.3, 0.1, 9.0), (0, 2.05, 0), rockm)
    W.box("sideL", (0.1, 7.0, 9.0), (-2.65, -1.5, 0), rockm)
    W.box("sideR", (0.1, 7.0, 9.0), (2.65, -1.5, 0), rockm)
    for i, (x, y, sc) in enumerate(((1.55, 1.45, 3.2), (1.95, 0.9, 2.4), (-1.5, 1.6, 2.6), (-1.95, 1.1, 1.8))):
        W.instance("rock_09", (x, y, -0.01), sc, R.random() * 6, name=f"pebble{i}")
    W.instance("nettle_plant", (1.7, 1.6, 0), 0.9, 0.3, name="nettle0")
    W.instance("nettle_plant", (-1.35, 1.75, 0), 0.75, 2.0, name="nettle1")

    # ---- the pot, cut open, full of living soil
    potm = W.plastic_mat("pot_m", (0.03, 0.03, 0.032), 0.5)
    live = add_hs(W.tex_mat("live_m", "excavated_soil_wall", 0.55, tint=(0.55, 0.4, 0.3), normal=1.4), "DRAIN")
    lathe(W, "pot", POT, CX, CY, potm)
    lathe(W, "fill", FILL, CX, CY, live)
    W.key_value(live, "DRAIN", [(t_off, 1.0), (t_off + 1.1, 0.06)], socket="Saturation")
    W.key_value(live, "DRAIN", [(t_off, 1.0), (t_off + 1.1, 0.8)], socket="Value")

    # ---- the plant: week four of flower, fully opaque leaves
    leaf = no_normal(leaf_mat(W, "leaf_m", tint=(0.12, 0.36, 0.06)))
    lb = leaf.node_tree.nodes["Principled BSDF"]       # self-lit a little, so leaf undersides never go black
    leaf.node_tree.links.new(leaf.node_tree.nodes["WILT"].outputs["Color"], lb.inputs["Emission Color"])
    lb.inputs["Emission Strength"].default_value = 0.55
    budm = dict(bud=no_normal(W.tex_mat("bud_m", "leafy_grass", 0.2, tint=(0.3, 0.55, 0.14), sat=1.2, bright=1.1, normal=0.0, rough=0.7)),
                pistil=W.flat("pistil_m", (0.85, 0.4, 0.1), rough=0.5),
                tri=W.flat("tri_m", (0.96, 0.96, 0.92), rough=0.06, coat=1.0))
    pl = plant(W, "plant", (CX, CY, SOIL_TOP), leaf, seed=5, buds=True, mats=budm)
    pl["root"].scale = (1.05,) * 3

    # ---- underground: roots, the mycorrhizal network, the trade ------------------------------------
    rootm = W.flat("root_m", (0.86, 0.76, 0.56), rough=0.6)
    roots = strands(W, "root", 11, lambda i, rr: (CX + rr.uniform(-0.02, 0.02), SOIL_TOP - 0.02), None,
                    rootm, 0.0028, 31, step=0.02, nsteps=(8, 12), down=True)
    hyph = W.flat("hypha_m", HYPHA_COL, rough=0.6, emit=0.9)
    node_m = W.flat("hnode_m", (0.2, 0.8, 1.0), rough=0.5, emit=1.4)
    dead_m = W.flat("dead_m", (0.5, 0.5, 0.52), rough=0.8)
    pm = W.flat("p_m", P_COL, rough=0.5, emit=1.5)
    sugm = W.flat("sugar_m", SUGAR_COL, rough=0.5, emit=1.5)

    def hstart(i, rr):                                    # every hypha starts on a root
        p = rr.choice(rr.choice(roots)["pts"][2:])
        return p[0], p[2]
    hy = strands(W, "hy", 48, hstart, lambda i, rr: (t_net + 0.04 * i, t_net + 0.7 + 0.04 * i), hyph, 0.0012, 41, step=0.015, nsteps=(8, 14))
    rr = random.Random(7)
    for i, h in enumerate(hy):
        tip = h["pts"][-1]
        nd = W.sphere(f"hnode{i}", 0.0035, (tip[0], CY - 0.003, tip[2]), node_m, seg=10)
        W.appear(nd, h["t1"] - 0.05, "pop", 0.3)
        t_dead = t_col + 0.5 * rr.random()                # this thread breaks apart
        W.vanish(nd, t_dead - 0.3, "pop", 0.3)
        W.hide_from(h["ob"], t_dead)
        fragments(W, f"hfrag{i}", h["pts"], dead_m, 0.0012, t_dead, rr)
        # phosphorus in (tip -> root) until the thread dies; sugar out (root -> tip) until the plant cuts it
        travel(W, f"p{i}", h["pts"], max(t_p, h["t1"]) + 0.3 * rr.random(), t_starve + 0.8 * rr.random(), pm, 0.0034,
               rr.uniform(1.5, 2.3), rr.random(), reverse=True)
        travel(W, f"sug{i}", h["pts"], t_sugar + 0.5 * rr.random(), t_cut + 0.9 * rr.random(), sugm, 0.0034,
               rr.uniform(1.5, 2.3), rr.random())
    # the network starves: the glow fades and the threads go grey just before they break
    W.key_value(hyph, "Principled BSDF", [(t_starve, 0.9), (t_col, 0.0)], socket="Emission Strength")
    W.key_value(hyph, "Principled BSDF", [(t_starve, col4(HYPHA_COL)), (t_col, col4((0.5, 0.5, 0.52)))], socket="Base Color")
    W.key_value(node_m, "Principled BSDF", [(t_starve, 1.4), (t_col, 0.0)], socket="Emission Strength")
    W.sfx("bubble", t_net, 0.5); W.sfx("chime", t_p + 0.3, 0.3); W.sfx("chime", t_sugar + 0.3, 0.3)
    W.sfx("click", t_cut, 0.5); W.sfx("thud", t_col + 0.1, 0.45)

    micm = [W.flat("mic_g", (0.3, 1.0, 0.2), emit=0.5), W.flat("mic_o", (0.2, 0.9, 0.6), emit=0.5), W.flat("mic_p", (0.6, 0.9, 0.2), emit=0.5)]
    microbes(W, "mic", 45, t_off - 0.3, micm, 51)

    # protozoa: soft teal blobs grazing on the cut face; each one shrinks into a hard brown cyst
    protm = W.flat("proto_m", (0.08, 0.62, 0.5), rough=0.3, emit=0.25, coat=1.0)
    cystm = W.flat("cyst_m", (0.42, 0.26, 0.1), rough=0.35, coat=0.6)
    spots = [(0.055, 0.135), (0.085, 0.175), (0.035, 0.19), (-0.09, 0.2), (-0.06, 0.1), (0.11, 0.26), (-0.11, 0.27), (0.0, 0.07)]
    for i, (x, z) in enumerate(spots):
        fq, ph = [rr.uniform(0.9, 1.7) for _ in range(2)], [rr.random() * 6.28 for _ in range(2)]
        pos = lambda tt: (CX + x + 0.016 * math.sin(fq[0] * tt + ph[0]), CY - 0.012, z + 0.011 * math.sin(fq[1] * tt + ph[1]))
        tc = t_cyst + 0.07 * i
        pz = W.sphere(f"proto{i}", 0.011, pos(0), protm, squash=1.5, noise=0.25, seg=16)
        pz.rotation_euler = (0, rr.uniform(0, 3.1), 0)
        for f in range(1, W.fr(tc) + 1, 2):
            pz.location = pos(f / W.FPS); pz.keyframe_insert("location", frame=f)
        W.vanish(pz, tc, "pop", 0.35)
        cy = W.sphere(f"cyst{i}", 0.008, pos(tc), cystm, noise=0.2, seg=14)
        W.appear(cy, tc + 0.25, "pop", 0.3)
        W.sfx("pop", tc + 0.25, 0.3)

    # ---- above ground: the bottle, poured into the watering can ------------------------------------
    bm = dict(body=W.plastic_mat("bottle_m", (0.9, 0.9, 0.87), 0.3), cap=W.M("black_rubber"),
              label=W.flat("label_m", (0.97, 0.97, 0.95), rough=0.55), band=W.flat("band_m", P_COL, rough=0.45))
    canx, cany = 0.62, 0.42
    canm = W.plastic_mat("can_m", (0.09, 0.22, 0.11))
    W.cyl("can_body", 0.09, 0.2, (canx, cany, 0), canm, verts=40)
    W.cyl("can_rim", 0.094, 0.012, (canx, cany, 0.194), canm, verts=40)
    canw = W.flat("canwater_m", (0.1, 0.3, 0.5), rough=0.04, coat=1.0)
    W.cyl("can_water", 0.084, 0.004, (canx, cany, 0.204), canw, verts=40)
    W.pipe("can_spout", [(canx + 0.07, cany, 0.05), (canx + 0.2, cany, 0.17), (canx + 0.27, cany, 0.27)], 0.011, canm)
    W.sphere("can_rose", 0.022, (canx + 0.275, cany, 0.277), canm, squash=0.6, seg=16)
    W.pipe("can_handle", [(canx - 0.085, cany, 0.17), (canx - 0.15, cany, 0.2), (canx - 0.17, cany, 0.12), (canx - 0.088, cany, 0.05)], 0.008, canm)

    b0 = bottle(W, "bottle0", (0.34, 0.2, 0), bm)
    W.appear(b0, t_buy, "drop", 0.55, dist=1.0)
    W.move(b0, t_pour - 0.75, t_pour, loc=(canx - 0.2, cany, 0.37), kind="inout")
    W.move(b0, t_pour - 0.45, t_pour + 0.1, rot=(0, 122, 0), kind="inout")
    floodm = W.flat("flood_m", P_COL, rough=0.5, emit=1.6)
    W.flow("pour", [(canx - 0.005, cany, 0.245), (canx, cany, 0.207)], t_pour, s("math"), n=5, size=0.011, mat=floodm, speed=0.25, stretch=1.8)
    W.key_value(canw, "Principled BSDF", [(t_pour, (0.1, 0.3, 0.5, 1)), (t_pour + 0.8, (0.75, 0.12, 0.5, 1))], socket="Base Color")
    W.sfx("whoosh", t_pour - 0.5, 0.4); W.sfx("pour", t_pour, 0.3, dur=1.2)
    W.hide_from(b0, s("math"))

    # ---- the tsunami: free phosphorus washes down through the soil ---------------------------------
    wet = W.flat("wet_m", (0.6, 0.05, 0.35), rough=0.5, alpha=0.08)
    bmw = W.bmesh.new()
    vs = [bmw.verts.new(p) for p in ((-0.182, 0, 0), (0.182, 0, 0), (0.151, 0, -0.3), (-0.151, 0, -0.3))]
    bmw.faces.new(vs); mew = W.bpy.data.meshes.new("wetfront"); bmw.to_mesh(mew); bmw.free()
    front_ob = W.bpy.data.objects.new("wetfront", mew); W.bpy.context.scene.collection.objects.link(front_ob)
    mew.materials.append(wet); front_ob.location = (CX, CY - 0.0012, SOIL_TOP - 0.002)
    front_ob.scale = (1, 1, 0.001); front_ob.keyframe_insert("scale", frame=1)
    W.hide_until(front_ob, t_flood)
    W.move(front_ob, t_flood, t_flood + 1.5, scale=(1, 1, 1), kind="out")
    W.key_value(wet, "Principled BSDF", [(t_off, 0.08), (t_off + 1.1, 0.0)], socket="Alpha")
    rr = random.Random(77)
    for i in range(150):
        zt = rr.uniform(0.05, SOIL_TOP - 0.03)                         # where this particle ends up
        x0 = rr.uniform(-0.17, 0.17); xt = max(-rin(zt) + 0.02, min(rin(zt) - 0.02, x0 + rr.uniform(-0.03, 0.03)))
        ts = t_flood + 1.1 * rr.random() ** 1.5; fall = (SOIL_TOP - zt) / rr.uniform(0.28, 0.4)
        fq, ph = [rr.uniform(1.5, 3.0) for _ in range(2)], [rr.random() * 6.28 for _ in range(2)]
        pz = W.sphere(f"flood{i}", rr.uniform(0.0035, 0.006), (x0, CY - 0.008, SOIL_TOP - 0.01), floodm, seg=8)
        W.hide_until(pz, ts)
        for f in range(W.fr(ts), W.fr(T.end) + 1, 2):
            tt = f / W.FPS; u = min(1.0, (tt - ts) / fall); q = W.ease(u, "out")
            pz.location = (x0 + (xt - x0) * q + 0.006 * math.sin(fq[0] * tt + ph[0]), CY - 0.008,
                           SOIL_TOP - 0.01 + (zt - SOIL_TOP + 0.01) * q + 0.004 * math.sin(fq[1] * tt + ph[1]))
            pz.keyframe_insert("location", frame=f)
    # the plant drinks the free phosphorus straight up its roots
    for i, r_ in enumerate(roots):
        travel(W, f"rootp{i}", r_["pts"], s("math") + 0.4 * rr.random(), T.end, floodm, 0.0042, rr.uniform(1.3, 1.9), rr.random(), reverse=True)
    W.key_value(floodm, "Principled BSDF", [(t_off, 1.6), (t_off + 1.1, 0.0)], socket="Emission Strength")
    W.key_value(floodm, "Principled BSDF", [(t_off, col4(P_COL)), (t_off + 1.1, (0.4, 0.33, 0.37, 1))], socket="Base Color")
    W.sfx("splash", t_flood, 0.5); W.sfx("hum", t_flood + 0.2, 0.25, dur=3.0)

    # ---- conductivity spikes: salt crystals grow on the cut face
    saltm = W.flat("salt_m", (0.93, 0.93, 0.96), rough=0.12, coat=1.0)
    for i in range(34):
        z = rr.uniform(0.06, SOIL_TOP - 0.03); x = rr.uniform(-1, 1) * (rin(z) - 0.02)
        c = W.box(f"salt{i}", (0.007, 0.007, 0.007 * rr.uniform(0.8, 1.8)), (CX + x, CY - 0.007, z), saltm)
        c.rotation_euler = (rr.uniform(0, 1.5), rr.uniform(0, 1.5), rr.uniform(0, 1.5))
        W.appear(c, t_ec + 0.5 * rr.random(), "pop", 0.25)
    W.sfx("click", t_ec, 0.5); W.sfx("click", t_ec + 0.2, 0.4)
    W.sfx("hum", t_off, 0.2, dur=1.2)

    # ---- the end: more bottles around the plant
    for i, (x, y) in enumerate(((-0.36, 0.62), (0.34, 0.2), (-0.56, 0.4), (0.36, 0.72), (-0.74, 0.66), (0.8, 0.74), (-0.3, 0.2))):
        b = bottle(W, f"bottle{i + 1}", (x, y, 0), bm)
        b.rotation_euler = (0, 0, rr.uniform(0, 6.28))
        W.appear(b, t_more + 0.13 * i, "drop", 0.5, dist=1.0)

    # ------------------------------------------------------------------ camera
    def at(az, dist, h, lz, cx=CX):
        a = math.radians(az); return (cx + dist * math.sin(a), CY - dist * math.cos(a), h), (cx, CY, lz)

    def orbit(az0, az1, dist, h, lz, lens=35, push=0.9, dh=0.0, cx=CX):
        (pa, la), (pb, lb) = at(az0, dist, h, lz, cx), at(az1, dist * push, h + dh, lz, cx)
        return dict(a=(pa, la), b=(pb, lb), lens=lens)

    def fixed(pa, la, pb, lb=None, lens=35):
        return dict(a=(pa, la), b=(pb, lb or la), lens=lens)

    # the soil section sits in the lower 45% of the frame, under the caption band
    plantv = lambda a0, a1, lz=0.72: orbit(a0, a1, 2.3, 1.0, lz, lens=40)
    soilv = lambda a0, a1, push=0.88: orbit(a0, a1, 1.1, 0.45, 0.42, lens=32, push=push)
    macro = lambda a0, a1, cx=CX: orbit(a0, a1, 0.66, 0.36, 0.36, lens=32, push=0.86, cx=cx)
    lowv = lambda a0, a1: orbit(a0, a1, 1.5, 0.2, 0.98, lens=30, push=0.9, dh=0.08)
    budv = fixed((0.5, CY - 0.8, 1.56), (0.0, CY, 1.2), (0.36, CY - 0.7, 1.5), lens=40)

    cuts = [
        (0.0, fixed((0.45, -1.55, 1.1), (0.0, CY, 0.84), (0.15, -1.25, 1.02), lens=35)),
        (1.45, budv),
        (t_dive, dict(a=at(-10, 1.3, 0.5, 0.45), b=at(4, 0.6, 0.36, 0.34), lens=32)),
        (s("network") - 0.05, lowv(-16, 4)),
        (wd("network", "bajo") - 0.1, soilv(8, -8)),
        (wd("network", "trae") - 0.25, macro(-8, 6, cx=0.05)),
        (s("trade") - 0.05, plantv(14, -8)),
        (wd("trade", "paga") - 0.1, macro(8, -6, cx=-0.04)),
        (wd("trade", "carbono") - 0.1, fixed((0.1, CY - 0.4, 0.3), (0.03, CY, 0.3), (-0.06, CY - 0.34, 0.28), (-0.02, CY, 0.29), lens=35)),
        (wd("trade", "Un") - 0.1, soilv(-10, 6, push=1.12)),
        (s("bottle") - 0.05, fixed((0.75, -1.5, 0.85), (0.2, CY, 0.5), (0.6, -1.25, 0.75), lens=35)),
        (wd("bottle", "cogollos") - 0.1, fixed((0.6, -0.42, 0.3), (0.34, 0.2, 0.22), (0.42, -0.36, 0.28), lens=38)),
        (t_pour - 0.5, fixed((0.3, -0.5, 0.62), (canx - 0.06, cany, 0.36), (0.42, -0.36, 0.56), lens=35)),
        (wd("bottle", "pensando") - 0.1, plantv(-10, 8)),
        (s("tsunami") - 0.05, soilv(-6, 6)),
        (wd("tsunami", "tsunami") + 0.25, macro(6, -6)),
        (s("math") - 0.05, lowv(14, -6)),
        (wd("math", "saca") - 0.1, plantv(12, -6)),
        (wd("math", "para") - 0.1, macro(-8, 4, cx=0.04)),
        (wd("math", "si") - 0.1, dict(a=at(8, 1.0, 0.16, 0.5), b=at(-6, 0.85, 0.2, 0.46), lens=30)),
        (s("cut") - 0.05, fixed((-0.08, CY - 0.42, 0.3), (-0.02, CY, 0.3), (0.06, CY - 0.36, 0.28), (0.02, CY, 0.29), lens=35)),
        (wd("cut", "sin") - 0.1, soilv(8, -6)),
        (t_col - 0.2, macro(-6, 6, cx=-0.03)),
        (s("encyst") - 0.05, macro(8, -4, cx=0.03)),
        (wd("encyst", "los") - 0.05, fixed((0.12, CY - 0.36, 0.2), (0.058, CY, 0.215), (0.02, CY - 0.3, 0.19), (0.058, CY, 0.21), lens=35)),
        (wd("encyst", "y") - 0.1, soilv(-8, 4)),
        (s("factory") - 0.02, macro(-10, 2)),
        (wd("factory", "tu") - 0.05, soilv(6, -6, push=1.25)),
        (s("name") - 0.05, orbit(18, 2, 1.7, 0.8, 0.6, lens=36)),
        (wd("name", "ahora") - 0.15, fixed((-0.5, -1.7, 0.7), (0.0, CY, 0.5), (-0.3, -1.9, 0.8), lens=32)),
        (wd("name", "hasta") - 0.05, fixed((0.2, -1.5, 0.85), (0.0, CY, 0.62), (0.0, -1.95, 1.0), (0.0, CY, 0.7), lens=32)),
    ]
    shots = []
    for i, (t0, sh) in enumerate(cuts):
        t1 = cuts[i + 1][0] if i + 1 < len(cuts) else T.end
        shots.append(dict(t0=t0, t1=t1, **sh))
    return shots


