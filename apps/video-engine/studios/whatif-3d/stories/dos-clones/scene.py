"""Dos clones, dos mundos: two identical clone cuttings grown side by side in a split-screen room.
LEFT (x < 0): sterile tiled "bottle world" (inert coco, IV-fed nutrients, pH meter) -> fast growth, then collapse.
RIGHT (x > 0): warm "living soil" (mycorrhizal hyphae, microbes) -> slow start, flowering, induced resistance, terpenes.
Both pots are cut open at their centre plane (y = CY) so the substrate shows in cross-section."""
import math, random
from mathutils import Vector

R = random.Random(11)
CL, CR, CY = -0.62, 0.62, 0.55          # pot centres (x) and the cut plane (y)
SOIL_TOP = 0.33                          # substrate surface (z)
POT = [(0.0, 0.0), (0.17, 0.0), (0.205, 0.36), (0.19, 0.36), (0.155, 0.025), (0.0, 0.025)]   # (r, z) wall profile
FILL = [(0.0, 0.025), (0.154, 0.025), (0.187, SOIL_TOP), (0.0, SOIL_TOP)]                    # substrate profile


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


def tile_mat(W, name, plane, c1=(0.9, 0.93, 0.94), c2=(0.84, 0.87, 0.89), grout=(0.5, 0.53, 0.55), size=0.2):
    """glossy square ceramic tiles (procedural brick texture on a grid), mapped onto one plane."""
    m = W.bpy.data.materials.new(name); m.use_nodes = True
    N = m.node_tree.nodes; L = m.node_tree.links; b = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping")
    if plane == "XZ": mp.inputs["Rotation"].default_value = (math.radians(90), 0, 0)
    elif plane == "YZ": mp.inputs["Rotation"].default_value = (0, math.radians(90), 0)
    L.new(tc.outputs["Object"], mp.inputs["Vector"])
    br = N.new("ShaderNodeTexBrick"); br.offset = 0.0; br.squash = 1.0
    br.inputs["Scale"].default_value = 1.0; br.inputs["Brick Width"].default_value = size; br.inputs["Row Height"].default_value = size
    br.inputs["Mortar Size"].default_value = 0.0045; br.inputs["Mortar Smooth"].default_value = 0.3; br.inputs["Bias"].default_value = 0.0
    br.inputs["Color1"].default_value = (*c1, 1); br.inputs["Color2"].default_value = (*c2, 1); br.inputs["Mortar"].default_value = (*grout, 1)
    L.new(mp.outputs["Vector"], br.inputs["Vector"]); L.new(br.outputs["Color"], b.inputs["Base Color"])
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 30; L.new(tc.outputs["Object"], nz.inputs["Vector"])
    rr = N.new("ShaderNodeMapRange"); rr.inputs["To Min"].default_value = 0.08; rr.inputs["To Max"].default_value = 0.22
    L.new(nz.outputs["Fac"], rr.inputs["Value"]); L.new(rr.outputs["Result"], b.inputs["Roughness"])
    bump = N.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.35; bump.invert = True
    L.new(br.outputs["Fac"], bump.inputs["Height"]); L.new(bump.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Coat Weight"].default_value = 0.6; b.inputs["Coat Roughness"].default_value = 0.05
    return m


def leaf_mat(W, name, tint=(0.14, 0.40, 0.07), emit=None):
    m = W.tex_mat(name, "leafy_grass", 0.3, tint=tint, sat=1.7, bright=0.85, normal=0.6, rough=0.5)
    N = m.node_tree.nodes; L = m.node_tree.links; b = N["Principled BSDF"]
    src = N[m["base_color_node"]]
    out = src.outputs["Result"] if "Result" in src.outputs else src.outputs["Color"]
    hs = N.new("ShaderNodeHueSaturation"); hs.name = "WILT"
    L.new(out, hs.inputs["Color"]); L.new(hs.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Specular IOR Level"].default_value = 0.3
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


def strands(W, name, cx, n, starts, times, mat, r, seed, step=0.03, nsteps=(5, 9), down=False):
    """branching threads (roots or hyphae) drawn on the cut face of a pot, each growing over its (t0, t1)."""
    rr = random.Random(seed)

    def inside(x, z):
        if not (0.04 < z < SOIL_TOP - 0.015): return False
        rin = 0.154 + 0.033 * (z - 0.025) / 0.305
        return abs(x - cx) < rin - 0.014
    ends = []
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
        t0, t1 = times(i, rr)
        W.pipe(f"{name}{i}", pts, r, mat, t0=t0, t1=t1)
        ends.append((pts[-1], t1))
    return ends


def microbes(W, name, cx, n, t0, t1, mats, seed, stagger=0.7):
    rr = random.Random(seed)
    for i in range(n):
        while True:
            x, z = cx + rr.uniform(-0.15, 0.15), rr.uniform(0.055, SOIL_TOP - 0.03)
            if abs(x - cx) < 0.154 + 0.033 * (z - 0.025) / 0.305 - 0.025: break
        s = W.sphere(f"{name}{i}", rr.uniform(0.0035, 0.0055), (x, CY - 0.006, z), mats[i % len(mats)], squash=rr.choice((1.0, 1.8)), seg=8)
        a = t0 + stagger * rr.random()
        W.appear(s, a, "pop", 0.25)
        f1, fq, ph = W.fr(t1), [rr.uniform(1.2, 2.6) for _ in range(2)], [rr.random() * 6.28 for _ in range(2)]
        for f in range(W.fr(a + 0.26), f1 + 1, 2):
            tt = f / W.FPS
            s.location = (x + 0.01 * math.sin(fq[0] * tt + ph[0]), CY - 0.006, z + 0.008 * math.sin(fq[1] * tt + ph[1]))
            s.keyframe_insert("location", frame=f)


def area(W, name, loc, size, energy, color, rot=(0, 0, 0)):
    ld = W.bpy.data.lights.new(name, "AREA"); ld.size = size; ld.energy = energy; ld.color = color
    ob = W.bpy.data.objects.new(name, ld); W.bpy.context.scene.collection.objects.link(ob)
    ob.location = loc; ob.rotation_euler = tuple(math.radians(a) for a in rot)
    return ob


def key_light(W, ob, keys, what="energy"):
    for t, v in keys:
        setattr(ob.data, what, v); ob.data.keyframe_insert(what, frame=W.fr(t))


# ------------------------------------------------------------------ the scene

def build(W, T):
    s = lambda k: T[k]["start"]
    e = lambda k: T[k]["end"]
    wd = T.word
    bpy = W.bpy

    # ---- light: a dim sky through the open top, cold clinic light on the left, warm earth light on the right
    W.key_value(bpy.context.scene.world, "SKY", [(0, 0.35)])
    W.sun().data.energy = 0.8
    bpy.data.objects["fill"].data.energy = 0.5
    lampL = area(W, "lampL", (-1.0, 0.2, 3.0), 2.2, 260, (0.8, 0.9, 1.0))
    lampR = area(W, "lampR", (1.0, 0.2, 3.0), 2.2, 170, (1.0, 0.72, 0.45))
    area(W, "front", (0.0, -3.2, 2.2), 3.0, 320, (1.0, 0.97, 0.94), rot=(60, 0, 0))
    key_light(W, lampL, [(0, 260), (wd("bottle", "izquierda"), 260), (wd("bottle", "izquierda") + 0.4, 420)])
    key_light(W, lampR, [(0, 170), (wd("living", "vivo") - 0.2, 170), (wd("living", "vivo") + 0.4, 360)])
    key_light(W, lampR, [(0, (1.0, 0.72, 0.45)), (wd("stress", "floración"), (1.0, 0.72, 0.45)), (wd("stress", "floración") + 0.8, (1.0, 0.6, 0.3))], "color")

    # ---- the room: tiled clinic on the left, earth and rock on the right
    W.box("floorL", (2.6, 7.0, 0.1), (-1.3, -1.5, -0.1), tile_mat(W, "tileF", "XY", size=0.3))
    W.box("wallL", (2.6, 0.1, 4.5), (-1.3, 2.05, 0), tile_mat(W, "tileW", "XZ"))
    W.box("sideL", (0.1, 7.0, 4.5), (-2.65, -1.5, 0), tile_mat(W, "tileS", "YZ"))
    W.box("floorR", (2.6, 7.0, 0.1), (1.3, -1.5, -0.1), W.tex_mat("dirtF", "brown_mud", 1.2, tint=(0.8, 0.62, 0.46), normal=1.4))
    rockm = W.tex_mat("rockW", "excavated_soil_wall", 2.4, tint=(0.95, 0.78, 0.62), normal=1.4)
    W.box("wallR", (2.6, 0.1, 4.5), (1.3, 2.05, 0), rockm)
    W.box("sideR", (0.1, 7.0, 4.5), (2.65, -1.5, 0), rockm)
    for i, (x, y, sc) in enumerate(((1.55, 1.45, 3.2), (1.95, 0.9, 2.4), (1.25, 1.75, 2.0), (0.35, 1.6, 1.8))):
        W.instance("rock_09", (x, y, -0.01), sc, R.random() * 6, name=f"pebble{i}")
    moss = W.instance("rock_moss_set_01", (1.7, 1.55, -0.02), 0.07, 0.4)

    # ---- the divider: a steel wall with a lit edge, rising on "paralelos"
    t_div = wd("open", "paralelos") - 0.15
    div = W.box("divider", (0.03, 2.45, 4.5), (0, 0.82, 0), W.M("steel"))
    edge = W.box("divider_edge", (0.036, 0.012, 4.5), (0, -0.41, 0), W.flat("edge_m", (1, 1, 1), emit=6.0))
    W.appear(div, t_div, "grow_z", 0.55); W.appear(edge, t_div, "grow_z", 0.55)
    W.sfx("whoosh", t_div, 0.5)

    # ---- pots: identical black nursery pots, cut open; inert coco (left), living soil (right)
    potm = W.plastic_mat("pot_m", (0.03, 0.03, 0.032), 0.5)
    coco = W.tex_mat("coco_m", "dirt", 0.35, tint=(1.0, 0.56, 0.3), sat=1.3, bright=1.1, normal=1.4)
    live = W.tex_mat("live_m", "excavated_soil_wall", 0.55, tint=(0.55, 0.4, 0.3), normal=1.4)
    for nm, cx, fill in (("L", CL, coco), ("R", CR, live)):
        lathe(W, "pot" + nm, POT, cx, CY, potm)
        lathe(W, "fill" + nm, FILL, cx, CY, fill)

    # ---- the mother plant in a bigger pot, centre back; it sinks away on "mundos"
    leafM = leaf_mat(W, "leafM")
    mg = empty(W, "mother_grp")
    k = 1.25
    for nm, prof, mat in (("potM", POT, potm), ("fillM", FILL, W.M("mud"))):
        ob = lathe(W, nm, prof, 0.0, 1.15, mat, k=k); ob.parent = mg
    mom = plant(W, "mother", (0.0, 1.15, SOIL_TOP * k), leafM, seed=3, H=1.05); mom["root"].parent = mg
    W.vanish(mg, wd("open", "mundos") - 0.1, "sink", 0.6, dist=1.8)

    # ---- the two clones: cut from the mother, flown into their pots
    leafL = leaf_mat(W, "leafL")
    leafR = leaf_mat(W, "leafR", emit=(0.25, 1.0, 0.35))
    budm = dict(bud=W.tex_mat("bud_m", "leafy_grass", 0.2, tint=(0.38, 0.62, 0.24), sat=0.9, bright=1.25, normal=0.8, rough=0.45),
                pistil=W.flat("pistil_m", (0.85, 0.4, 0.1), rough=0.5),
                tri=W.flat("tri_m", (0.96, 0.96, 0.92), rough=0.06, coat=1.0))
    trib = budm["tri"].node_tree.nodes["Principled BSDF"]; trib.inputs["Emission Color"].default_value = (1, 1, 0.95, 1); trib.inputs["Emission Strength"].default_value = 0.0
    pL = plant(W, "clL", (0, 0, 0), leafL, seed=5)
    pR = plant(W, "clR", (0, 0, 0), leafR, seed=5, buds=True, mats=budm)
    t_cut = 0.35
    for p, cx, sx in ((pL, CL, -0.2), (pR, CR, 0.2)):
        rt = p["root"]; rt.scale = (0.28,) * 3
        a, b = Vector((sx, 0.98, 1.02)), Vector((cx, CY, SOIL_TOP))

        def arc(u, a=a, b=b):
            q = W.ease(u, "inout"); v = a.lerp(b, q); v.z += 0.45 * math.sin(math.pi * q); return tuple(v)
        rt.location = tuple(a); rt.keyframe_insert("location", frame=1)
        W.follow(rt, t_cut, t_cut + 1.15, arc, face=False)
    W.sfx("whoosh", t_cut + 0.1, 0.45)

    # ---- LEFT: the bottle world ---------------------------------------------------------------
    steel = W.M("steel")
    sx, sy = -1.12, 0.92
    W.cyl("iv_pole", 0.012, 1.78, (sx, sy, 0.04), steel, verts=16)
    W.box("iv_bar", (0.42, 0.016, 0.016), (sx + 0.2, sy, 1.76), steel)
    for j in range(5):
        a = j * 2 * math.pi / 5
        lg = W.box(f"iv_leg{j}", (0.26, 0.022, 0.022), (sx + 0.12 * math.cos(a), sy + 0.12 * math.sin(a), 0.03), steel); lg.rotation_euler = (0, 0, a)
        W.sphere(f"iv_wheel{j}", 0.022, (sx + 0.24 * math.cos(a), sy + 0.24 * math.sin(a), 0.022), "black_rubber", seg=12)
    tube = W.flat("tube_m", (0.85, 0.92, 0.95), rough=0.08, alpha=0.4)
    t_b = wd("bottle", "botellas")
    drip_paths = []
    for j, (bx, col) in enumerate(((-0.98, (0.9, 0.9, 0.87)), (-0.83, (0.42, 0.22, 0.08)))):
        g = empty(W, f"bottle{j}", (bx, sy, 0))
        bm_ = W.plastic_mat(f"bottle_m{j}", col, 0.3)
        for ob in (W.cyl(f"b{j}_body", 0.055, 0.2, (0, 0, 1.42), bm_, verts=32), W.cyl(f"b{j}_neck", 0.016, 0.06, (0, 0, 1.36), bm_, verts=24, r2=0.055),
                   W.cyl(f"b{j}_cap", 0.018, 0.022, (0, 0, 1.338), "black_rubber", verts=20), W.box(f"b{j}_strap", (0.008, 0.008, 0.14), (0, 0, 1.62), steel),
                   W.cyl(f"b{j}_drip", 0.012, 0.06, (0, 0, 1.2), tube, verts=20)):
            ob.parent = g
        W.appear(g, t_b - 0.1 + 0.18 * j, "drop", 0.6, dist=1.0)
        end = (-0.69 + 0.09 * j, 0.63 + 0.03 * j)
        path = [(bx, sy, 1.338), (bx, sy, 1.26)]
        W.pipe(f"tubeA{j}", path, 0.004, tube)
        low = [(bx, sy, 1.2), (bx + 0.02, sy - 0.05, 0.92), (-0.74 + 0.05 * j, 0.74, 0.58), (end[0], end[1], 0.42), (end[0], end[1], 0.3)]
        W.pipe(f"tubeB{j}", low, 0.004, tube, t0=t_b + 0.5, t1=t_b + 1.2)
        W.cyl(f"stake{j}", 0.006, 0.12, (end[0], end[1], 0.27), "white", verts=12)
        drip_paths.append(low[:-1] + [(end[0], end[1], SOIL_TOP)])
    t_feed, t_cutw = wd("bottle", "alimento"), wd("collapse", "corta") + 0.15
    for j, pth in enumerate(drip_paths):
        W.flow(f"drip{j}", pth, t_feed + 0.15 * j, t_cutw, n=9, size=0.006, speed=0.6)
        W.flow(f"chamber{j}", [(pth[0][0], sy, 1.255), (pth[0][0], sy, 1.205)], t_feed, t_cutw, n=2, size=0.005, stretch=1.0, speed=0.15)
    W.sfx("pour", t_feed, 0.12, dur=t_cutw - t_feed)
    brick = W.box("coco_brick", (0.26, 0.14, 0.09), (-1.38, 0.2, 0), coco, bevel=0.008)
    W.appear(brick, wd("bottle", "coco") - 0.1, "drop", 0.55, dist=0.9)

    # pH meter: probe in the coco, cable to an analog meter on the floor
    W.cyl("ph_probe", 0.007, 0.27, (-0.5, 0.65, 0.2), steel, verts=16)
    W.cyl("ph_grip", 0.011, 0.07, (-0.5, 0.65, 0.42), "black_rubber", verts=16)
    W.pipe("ph_cable", [(-0.5, 0.65, 0.49), (-0.55, 0.6, 0.56), (-0.75, 0.4, 0.4), (-0.9, 0.2, 0.15), (-0.98, 0.13, 0.22)], 0.004, "black_rubber")
    mx, my = -0.98, 0.12
    W.box("meter", (0.14, 0.05, 0.22), (mx, my, 0), W.plastic_mat("meter_m", (0.82, 0.62, 0.05), 0.4), bevel=0.01)
    W.cyl("dial", 0.047, 0.008, (mx, my - 0.033, 0.16), "white", axis="Y", verts=40)
    W.cyl("dial_rim", 0.052, 0.006, (mx, my - 0.031, 0.16), "black_rubber", axis="Y", verts=40)
    needle = W.box("needle", (0.004, 0.003, 0.042), (mx, my - 0.036, 0.16), "red")
    scr = W.bpy.data.materials.new("screen_m"); scr.use_nodes = True
    Nn = scr.node_tree.nodes; sb = Nn["Principled BSDF"]
    al = Nn.new("ShaderNodeMix"); al.data_type = "RGBA"; al.name = "ALARM"; al.inputs["A"].default_value = (0.2, 1.0, 0.35, 1); al.inputs["B"].default_value = (1.0, 0.12, 0.08, 1)
    al.inputs["Factor"].default_value = 0.0
    scr.node_tree.links.new(al.outputs["Result"], sb.inputs["Emission Color"]); sb.inputs["Emission Strength"].default_value = 3.0
    sb.inputs["Base Color"].default_value = (0.02, 0.02, 0.02, 1)
    W.box("screen", (0.08, 0.004, 0.03), (mx, my - 0.026, 0.035), scr)
    t_dc = wd("collapse", "descalibra")
    W.move(needle, t_dc - 0.05, t_dc + 0.55, rot=(0, 68, 0), kind="out")
    for i in range(6):
        W.move(needle, t_dc + 0.55 + 0.22 * i, t_dc + 0.77 + 0.22 * i, rot=(0, 68 + (6 if i % 2 == 0 else -4), 0))
    W.key_value(scr, "ALARM", [(t_dc + 0.1, 0.0), (t_dc + 0.4, 1.0)])
    W.sfx("click", t_dc, 0.6); W.sfx("click", t_dc + 0.3, 0.4)

    # left roots: fast, bare, no partners
    rootm = W.flat("root_m", (0.86, 0.76, 0.56), rough=0.6)
    t_f0 = s("fast")
    strands(W, "rootL", CL, 12, lambda i, rr: (CL + rr.uniform(-0.02, 0.02), SOIL_TOP - 0.02),
            lambda i, rr: (t_f0 + 0.25 * i, t_f0 + 0.25 * i + 1.3), rootm, 0.0026, 21, step=0.022, nsteps=(9, 14), down=True)

    # left growth: slow while the bottles go up, then very fast; energy arrows up the stem
    rL = pL["root"]
    W.move(rL, s("bottle") + 0.3, e("bottle"), scale=0.42)
    W.move(rL, wd("fast", "Crece") - 0.1, e("fast"), scale=1.0, kind="out")
    W.arrows("energyL", [(CL - 0.11, CY - 0.18, 0.42), (CL + 0.11, CY - 0.18, 0.42)], (0, 0, 1), wd("fast", "energía") - 0.2, wd("fast", "exudados") + 0.5, length=0.34, width=0.11,
             mat=W.flat("energy_m", (1.0, 0.62, 0.1), rough=0.3, alpha=0.92, emit=0.8))

    # collapse: fans droop, the stem leans, the green turns to straw
    t_col = wd("collapse", "colapsa")
    for i, f in enumerate(pL["fans"]):
        rx, ry, rz = f.rotation_euler
        d0 = t_col - 0.1 + 0.015 * i
        W.move(f, d0, d0 + 0.9, rot=(math.degrees(rx), math.degrees(ry) + 75 + 10 * R.random(), math.degrees(rz)), kind="out")
    W.move(rL, t_col, t_col + 1.0, rot=(0, -7, 0))
    W.move(rL, t_col, t_col + 1.0, scale=(1.0, 1.0, 0.9))
    W.key_value(leafL, "WILT", [(t_col - 0.1, 0.5), (t_col + 1.0, 0.43)], socket="Hue")
    W.key_value(leafL, "WILT", [(t_col - 0.1, 1.0), (t_col + 1.0, 0.7)], socket="Value")
    W.key_value(leafL, "WILT", [(t_col - 0.1, 1.0), (t_col + 1.0, 0.75)], socket="Saturation")
    W.sfx("thud", t_col + 0.3, 0.4)

    # ---- RIGHT: the living world -------------------------------------------------------------
    hyph = W.flat("hypha_m", (0.12, 0.68, 1.0), rough=0.4, emit=1.6)
    node_m = W.flat("hnode_m", (0.3, 0.85, 1.0), rough=0.3, emit=2.5)
    t_m, t_h = wd("living", "metrópolis"), wd("living", "hongos")
    strands(W, "rootR", CR, 10, lambda i, rr: (CR + rr.uniform(-0.02, 0.02), SOIL_TOP - 0.02),
            lambda i, rr: (s("living") + 0.3 + 0.35 * i, s("living") + 0.3 + 0.35 * i + 1.6) if i < 5 else (s("slow") + 0.3 * i, s("slow") + 0.3 * i + 1.8),
            rootm, 0.0026, 31, step=0.02, nsteps=(8, 12), down=True)

    def hstart(i, rr):
        return CR + rr.uniform(-0.12, 0.12), rr.uniform(0.07, SOIL_TOP - 0.05)
    ends = []
    ends += strands(W, "hyA", CR, 14, hstart, lambda i, rr: (t_m - 0.1 + 0.08 * i, t_m + 0.6 + 0.08 * i), hyph, 0.0011, 41, step=0.015, nsteps=(8, 14))
    ends += strands(W, "hyB", CR, 16, hstart, lambda i, rr: (t_h + 0.08 * i, t_h + 0.7 + 0.08 * i), hyph, 0.0011, 42, step=0.015, nsteps=(8, 14))
    ends += strands(W, "hyC", CR, 16, hstart, lambda i, rr: (wd("slow", "construyendo") - 0.2 + 0.09 * i, wd("slow", "construyendo") + 0.6 + 0.09 * i), hyph, 0.0011, 43, step=0.015, nsteps=(8, 14))
    for i, (p, t1) in enumerate(ends):
        nd = W.sphere(f"hnode{i}", 0.0035, (p[0], CY - 0.003, p[2]), node_m, seg=10)
        W.appear(nd, t1 - 0.05, "pop", 0.3)
    t_army = wd("slow", "ejército")
    W.key_value(hyph, "Principled BSDF", [(t_army - 0.2, 1.6), (t_army + 0.25, 5.0), (t_army + 1.0, 2.2)], socket="Emission Strength")
    W.key_value(node_m, "Principled BSDF", [(t_army - 0.2, 2.5), (t_army + 0.25, 7.0), (t_army + 1.0, 3.2)], socket="Emission Strength")
    W.sfx("bubble", t_m, 0.5); W.sfx("bubble", t_h, 0.4)
    micm = [W.flat("mic_g", (0.3, 1.0, 0.2), emit=1.4), W.flat("mic_o", (1.0, 0.5, 0.1), emit=1.4), W.flat("mic_p", (0.75, 0.35, 1.0), emit=1.4)]
    microbes(W, "micA", CR, 30, wd("living", "bacterias") - 0.1, T.end, micm, 51)
    microbes(W, "micB", CR, 50, wd("stress", "millones") - 0.1, T.end, micm, 52, stagger=0.9)
    W.sfx("bubble", wd("living", "bacterias"), 0.4)
    nettles = [W.instance("nettle_plant", (2.05, 1.5, 0), 0.9, 0.3, name="nettle0"), W.instance("nettle_plant", (1.25, 1.75, 0), 0.7, 2.0, name="nettle1")]
    for i, nt in enumerate(nettles): W.appear(nt, wd("living", "vivo") + 0.1 * i, "pop", 0.5)

    # right growth: waits, then slow, then catches up in flower
    rR = pR["root"]
    W.move(rR, wd("slow", "lento") - 0.3, e("slow"), scale=0.5, kind="linear")
    W.move(rR, s("stress"), e("isr") - 1.0, scale=1.05, kind="inout")
    t_fl = wd("stress", "floración")
    for i, b in enumerate(pR["buds"]):
        W.appear(b, t_fl + 0.1 * i, "pop", 0.5)
    W.sfx("pop", t_fl + 0.1, 0.4); W.sfx("pop", t_fl + 0.5, 0.35)
    # mild constant stress: a faint pulse in the leaves; induced defence: a strong glow, arrows and a shield
    t_es, t_def, t_ind = wd("stress", "estrés"), wd("isr", "defensas"), wd("isr", "inducida")
    keys, t = [(wd("stress", "microbios") - 0.3, 0.0)], wd("stress", "microbios")
    while t < t_def - 0.3:
        keys.append((t, 0.02 + 0.06 * (0.5 + 0.5 * math.sin((t - wd("stress", "microbios")) * 2 * math.pi * 1.2)))); t += 0.12
    keys += [(t_def - 0.1, 0.06), (t_def + 0.3, 0.32), (t_ind + 0.6, 0.26), (t_ind + 1.4, 0.03)]
    W.key_value(leafR, "Principled BSDF", keys, socket="Emission Strength")
    W.arrows("defR", [(CR - 0.12, CY - 0.2, 0.4), (CR + 0.12, CY - 0.2, 0.4), (CR, CY - 0.26, 0.6)], (0, 0, 1), wd("isr", "activa") - 0.1, t_def + 1.4, length=0.32, width=0.1)
    dome = W.sphere("shield", 0.5, (CR, CY + 0.05, 0.9), W.flat("shield_m", (0.45, 1.0, 0.75), rough=0.3, alpha=0.045, emit=0.3), squash=1.3, seg=48)
    W.appear(dome, t_def, "pop", 0.6); W.vanish(dome, t_ind + 0.9, "pop", 0.5)
    W.sfx("chime", t_def, 0.3); W.sfx("hum", wd("isr", "resistencia"), 0.2, dur=1.6)

    # trichomes light up, then terpenes and flavonoids rise from the buds
    t_tr, t_tp, t_fv = wd("terp", "tricomas"), wd("terp", "terpenos"), wd("terp", "flavonoides")
    W.key_value(budm["tri"], "Principled BSDF", [(t_tr - 0.2, 0.0), (t_tr + 0.3, 2.5), (t_tr + 1.2, 1.0)], socket="Emission Strength")
    W.sfx("chime", t_tr, 0.25)
    scl = 1.05
    srcs = [Vector((CR, CY, SOIL_TOP)) + Vector(p) * scl for p, _ in pR["bud_pts"]]
    cols = [((1.0, 0.62, 0.12), t_tp), ((0.65, 1.0, 0.2), t_tp), ((1.0, 0.4, 0.65), t_tp), ((0.62, 0.32, 1.0), t_fv), ((0.4, 0.55, 1.0), t_fv)]
    tmats = [(W.flat(f"terp_m{i}", c, emit=1.8), t0) for i, (c, t0) in enumerate(cols)]
    rr = random.Random(77)
    for i in range(60):
        m, t0 = tmats[i % len(tmats)]
        o = srcs[i % len(srcs)] + Vector((rr.uniform(-0.03, 0.03), rr.uniform(-0.03, 0.03), 0))
        pz = W.sphere(f"terp{i}", rr.uniform(0.005, 0.009), tuple(o), m, seg=8)
        st = t0 + 0.5 * rr.random()
        W.hide_until(pz, st)
        ph, per, dx = rr.random(), rr.uniform(1.8, 2.6), rr.uniform(-0.12, 0.12)
        for f in range(W.fr(st), W.fr(T.end) + 1, 2):
            u = ((f / W.FPS - st) / per + ph) % 1.0
            pz.location = (o.x + dx * u + 0.02 * math.sin(u * 9 + i), o.y - 0.06 * u, o.z + 0.5 * u)
            pz.keyframe_insert("location", frame=f)
            sz = max(0.001, math.sin(math.pi * u)); pz.scale = (sz, sz, sz); pz.keyframe_insert("scale", frame=f)
    W.sfx("whoosh", t_tp, 0.25)
    W.sfx("chime", wd("end", "Distinta"), 0.35)

    # ------------------------------------------------------------------ camera
    def at(cx, az, dist, h, lz):
        a = math.radians(az); return (cx + dist * math.sin(a), CY - dist * math.cos(a), h), (cx, CY, lz)

    def orbit(cx, az0, az1, dist, h, lz, lens=35, push=0.9, dh=0.0):
        (pa, la), (pb, lb) = at(cx, az0, dist, h, lz), at(cx, az1, dist * push, h + dh, lz)
        return dict(a=(pa, la), b=(pb, lb), lens=lens)

    def fixed(pa, la, pb, lb=None, lens=35):
        return dict(a=(pa, la), b=(pb, lb or la), lens=lens)

    plantv = lambda cx, a0, a1, lz=0.68: orbit(cx, a0, a1, 2.25, 0.98, lz, lens=40)
    soilv = lambda cx, a0, a1: orbit(cx, a0, a1, 1.1, 0.45, 0.41, lens=32, push=0.88)
    macro = lambda cx, a0, a1: orbit(cx, a0, a1, 0.62, 0.34, 0.31, lens=32, push=0.85)
    topv = lambda cx, a0, a1: orbit(cx, a0, a1, 0.75, 1.55, 0.72, lens=32, push=0.9, dh=-0.08)
    lowv = lambda cx, a0, a1: orbit(cx, a0, a1, 1.45, 0.2, 0.95, lens=30, push=0.9, dh=0.08)
    ivv = fixed((-0.68, -0.72, 1.32), (-0.9, 0.9, 1.24), (-0.6, -0.58, 1.27), lens=32)

    cuts = [
        (0.0, fixed((0.0, -2.4, 1.15), (0.0, 1.0, 0.82), (0.22, -2.0, 1.08), lens=35)),
        (1.7, fixed((-0.45, -1.85, 0.85), (0.0, 0.75, 0.6), (0.4, -1.7, 0.8), lens=32)),
        (3.4, fixed((0.0, -2.1, 1.0), (0.0, 0.8, 0.72), (0.0, -3.0, 1.15), (0.0, 0.8, 0.75), lens=32)),
        (s("bottle") - 0.1, orbit(CL, 12, -14, 1.6, 0.8, 0.5, lens=36)),
        (t_b - 0.3, ivv),
        (wd("bottle", "coco") - 0.05, fixed((-0.92, -1.15, 0.52), (-0.95, 0.45, 0.32), (-0.74, -1.0, 0.48), lens=32)),
        (wd("bottle", "digerido") - 0.2, fixed((-0.45, -0.36, 0.64), (-0.68, 0.62, 0.5), (-0.6, -0.25, 0.58), lens=35)),
        (s("fast") - 0.05, lowv(CL, -18, 2)),
        (wd("fast", "energía") - 0.4, plantv(CL, 10, -16)),
        (wd("fast", "exudados") + 0.1, soilv(CL, 8, -8)),
        (s("depend") - 0.05, fixed((-0.6, -0.62, 1.25), (-0.92, 0.9, 1.2), (-0.74, -0.5, 1.2), lens=34)),
        (s("collapse") - 0.05, fixed((-0.86, -0.36, 0.21), (mx, my, 0.095), (-1.06, -0.3, 0.19), lens=35)),
        (t_dc + 0.4, fixed((-0.45, -0.36, 0.64), (-0.68, 0.62, 0.5), (-0.62, -0.28, 0.6), lens=35)),
        (t_col - 0.35, plantv(CL, -16, 6)),
        (wd("living", "derecha") - 0.05, orbit(CR, 14, -6, 1.55, 0.72, 0.5, lens=38)),
        (t_m - 0.15, soilv(CR, -8, 8)),
        (wd("living", "bacterias") - 0.6, macro(CR, 6, -6)),
        (wd("slow", "lento") - 0.6, orbit(CR, 16, 0, 1.75, 0.85, 0.58, lens=38)),
        (wd("slow", "construyendo") + 0.1, soilv(CR, -6, 9)),
        (s("stress") - 0.05, topv(CR, -10, 8)),
        (wd("stress", "microbios") - 0.1, macro(CR, -6, 6)),
        (wd("stress", "estrés") + 0.15, plantv(CR, 18, 0)),
        (s("isr") - 0.05, lowv(CR, 16, -4)),
        (wd("isr", "naturales") + 0.5, topv(CR, 10, -10)),
        (wd("isr", "resistencia") + 0.2, plantv(CR, -8, 16)),
        (s("terp") - 0.1, fixed((0.8, 0.12, 1.5), (0.62, 0.55, 1.34), (0.7, 0.2, 1.47), lens=45)),
        (t_fv - 0.2, fixed((0.98, -0.4, 1.58), (0.62, 0.55, 1.26), (0.88, -0.25, 1.52), lens=38)),
        (wd("terp", "botella") - 0.2, plantv(CL, 4, -14)),
        (wd("terp", "fabricar") - 0.2, orbit(CR, 22, 6, 1.8, 1.4, 1.05, lens=38)),
        (s("end") - 0.05, fixed((0.0, -2.3, 0.95), (0.0, 0.6, 0.65), (0.15, -2.0, 0.9), lens=30)),
        (wd("end", "Distinto") - 0.05, fixed((0.0, -2.1, 0.95), (0.0, 0.7, 0.72), (0.0, -2.75, 1.1), (0.0, 0.7, 0.78), lens=30)),
        (wd("end", "Distinta") - 0.05, fixed((0.0, -2.9, 1.1), (0.0, 0.7, 0.78), (0.0, -2.15, 0.95), (0.0, 0.7, 0.72), lens=30)),
    ]
    shots = []
    for i, (t0, sh) in enumerate(cuts):
        t1 = cuts[i + 1][0] if i + 1 < len(cuts) else T.end
        shots.append(dict(t0=t0, t1=t1, **sh))
    return shots
