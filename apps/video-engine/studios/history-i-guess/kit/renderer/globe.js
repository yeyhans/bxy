/* globe.js: the stage. A textured 3D Earth (NASA Blue Marble day map, Black Marble night lights) drawn with three.js
   on its own full-frame WebGL canvas, then pasted into the 2D frame; plus the helpers that put flat things ON it
   (labels, glowing arcs, cables, dots, stick figures, cats) at a latitude / longitude.

   const P = G.globe(T, {lat, lon, r, ...})   draws the globe and returns a projector:
     P.pt(lat, lon, h)  -> {x, y, vis, s}   screen point (h = height above the ground in earth radii), vis = not hidden behind the planet,
                                            s = pixels per earth radius there (use it to scale things standing on the ground)
     P.up(lat, lon)     -> {x, y, vis, ang, s}   + the screen angle of "up" at that spot (radians, for things standing on the ground)
     P.c, P.r           the planet's centre and radius on screen
   options:
     lat, lon   the spot facing the camera (degrees)         r     zoom: pixels per radian at that spot (~ the planet's on-screen radius when far: 400;
                                                              a region 3000-6000; a city 8000-12000 = 140-210 px per degree)
     cx, cy     where the planet's centre sits on screen       roll  turn the whole view (degrees)
     day        0..1 daylight (0 = the planet goes dark)      night 0..1 city lights      regions [{lat, lon, deg, k}] = lights only there
     sun        0..1 day/night shading                        tint  [r, g, b, amount] a colour wash (pink / cyan / yellow planets in a jingle)
     sunDir     [x, y, z] where the light comes from, in screen space (default upper left, [-0.55, 0.45, 0.7]; spin it for fast days)
     hi         a close-up patch name from textures/hi.json   halo  0..1 the atmosphere glow      stars (default true), bg (default black)
     look       "toon": his flat map colours (bright land, one flat saturated sea colour, no night side); sea = the sea colour
                (default "#2236b4"). back = a G.card spec drawn behind the planet instead of space: {kind: "flat", color: "#d6247a"}
     body       "moon": draw another body with its own map (no lights, no oceans, no halo unless asked). Draw a second body in
                the same frame with stars: false so it lands on top of the first (draw the farther one first).
   G.fly(T, keys) eases between camera keyframes: keys = [[time, {lat, lon, r, cx, cy, roll}], ...] (radius zooms in log space). */
(function () {
  const G = window.G, D = Math.PI / 180;
  const TEX = window.GLOBE_TEX || null;
  G.READY = G.READY || [];
  let RG = null;
  const LOADED = {};

  function loadTex(url) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const t = new THREE.Texture(img); t.needsUpdate = true; t.anisotropy = 8;
        t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true;
        t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
        res(t);
      };
      img.onerror = () => rej(new Error("texture failed: " + url));
      img.src = url;
    });
  }
  if (TEX) {
    const jobs = [["day", TEX.day], ["night", TEX.night]];
    Object.keys(TEX.hi || {}).forEach((k) => { jobs.push(["hi_" + k + "_day", TEX.hi[k].day]); jobs.push(["hi_" + k + "_night", TEX.hi[k].night]); });
    Object.keys(TEX.bodies || {}).forEach((k) => jobs.push(["body_" + k, TEX.bodies[k]]));
    G.READY.push(Promise.all(jobs.map(([k, u]) => loadTex(u).then((t) => { LOADED[k] = t; }))));
  }

  const VS = `varying vec2 vUv; varying vec3 vN; varying vec3 vP;
    void main(){ vUv = uv; vP = position; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const FS = `uniform sampler2D dayTex; uniform sampler2D nightTex; uniform sampler2D hiDay; uniform sampler2D hiNight;
    uniform vec4 hiRect; uniform float hiOn; uniform float dayAmt; uniform float nightAmt; uniform float sunAmt; uniform float useReg;
    uniform vec3 sunDir; uniform vec4 reg[8]; uniform float regK[8]; uniform vec4 tint; uniform float lift; uniform float toon; uniform vec3 seaCol;
    varying vec2 vUv; varying vec3 vN; varying vec3 vP;
    void main(){
      vec3 day = texture2D(dayTex, vUv).rgb;
      vec3 nt = texture2D(nightTex, vUv).rgb;
      if (hiOn > 0.5) {
        vec2 q = (vUv - hiRect.xy) / (hiRect.zw - hiRect.xy);
        if (q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0) {
          float e = smoothstep(0.0, 0.08, min(min(q.x, 1.0 - q.x), min(q.y, 1.0 - q.y)));
          day = mix(day, texture2D(hiDay, q).rgb, e);
          nt = mix(nt, texture2D(hiNight, q).rgb, e);
        }
      }
      // lift the deep navy oceans a little toward a brighter blue so the planet reads on black
      float sea = smoothstep(0.02, 0.10, day.b - max(day.r, day.g));
      if (toon > 0.0) {
        float l = dot(day, vec3(0.299, 0.587, 0.114));
        vec3 land = clamp(mix(vec3(l), day, 1.9) * 1.55 + 0.05, 0.0, 1.0);
        vec3 sc = seaCol * (0.9 + 0.2 * smoothstep(0.0, 0.3, day.b));
        day = mix(day, mix(land, sc, smoothstep(0.02, 0.07, day.b - max(day.r, day.g))), toon);
      }
      day = mix(day, day * 1.25 + vec3(0.03, 0.09, 0.17), sea * lift * (1.0 - toon));
      day = pow(day, vec3(0.92));
      vec3 n = normalize(vN);
      float lam = max(dot(n, normalize(sunDir)), 0.0);
      float shade = mix(1.0, 0.035 + 1.08 * lam, sunAmt);
      float limb = 0.8 + 0.2 * clamp(n.z, 0.0, 1.0);
      vec3 col = day * dayAmt * shade * limb;
      float m = 1.0;
      if (useReg > 0.5) {
        m = 0.0; vec3 p = normalize(vP);
        for (int i = 0; i < 8; i++) { m = max(m, regK[i] * smoothstep(reg[i].w - 0.02, reg[i].w + 0.02, dot(p, reg[i].xyz))); }
      }
      float dark = clamp(1.0 - shade * dayAmt, 0.0, 1.0);
      vec3 lights = pow(nt, vec3(1.25)) * vec3(1.35, 1.1, 0.78) * 2.1;
      col += lights * nightAmt * m * (0.2 + 0.8 * dark);
      col = mix(col, col * tint.rgb * 1.5 + tint.rgb * 0.1, tint.a);
      gl_FragColor = vec4(col, 1.0);
    }`;

  function vec(lat, lon, h) {
    const a = lat * D, b = lon * D, r = 1 + (h || 0);
    return new THREE.Vector3(Math.cos(a) * Math.cos(b) * r, Math.sin(a) * r, -Math.cos(a) * Math.sin(b) * r);
  }
  G.geo = vec;

  function setup() {
    if (RG) return RG;
    if (!TEX) throw new Error("no globe textures: run textures.py and pass them to render.py");
    const cv = document.createElement("canvas"); cv.width = G.W; cv.height = G.H;
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const fov = 36;
    const cam = new THREE.PerspectiveCamera(fov, G.W / G.H, 0.001, 200);
    const outer = new THREE.Group(), mid = new THREE.Group(), inner = new THREE.Group();
    outer.add(mid); mid.add(inner); scene.add(outer);
    const regs = []; for (let i = 0; i < 8; i++) regs.push(new THREE.Vector4(1, 0, 0, 2));
    const uni = {
      dayTex: { value: LOADED.day }, nightTex: { value: LOADED.night }, hiDay: { value: LOADED.day }, hiNight: { value: LOADED.night },
      hiRect: { value: new THREE.Vector4(0, 0, 1, 1) }, hiOn: { value: 0 }, dayAmt: { value: 1 }, nightAmt: { value: 0 }, sunAmt: { value: 0 },
      useReg: { value: 0 }, sunDir: { value: new THREE.Vector3(-0.55, 0.45, 0.7) }, reg: { value: regs }, regK: { value: [0, 0, 0, 0, 0, 0, 0, 0] },
      tint: { value: new THREE.Vector4(1, 1, 1, 0) }, lift: { value: 0.6 }, toon: { value: 0 }, seaCol: { value: new THREE.Vector3(0.13, 0.21, 0.71) },
    };
    const mat = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: VS, fragmentShader: FS });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 360, 180), mat);
    inner.add(mesh);
    const meta = TEX.meta || {};
    RG = { r, cv, scene, cam, outer, mid, inner, uni, mesh, fov, f: (G.H / 2) / Math.tan((fov / 2) * D), meta };
    return RG;
  }

  /* ---------- the starfield: lots of tiny dim stars, a few bright ones ---------- */
  G.space = (seed, drift) => {
    const C = G.ctx(); C.fillStyle = "#000"; C.fillRect(0, 0, G.W, G.H);
    const r = G.rng(seed || 99); const dx = (drift || 0) % G.W;
    for (let i = 0; i < 520; i++) {
      const x = (r() * G.W + dx + G.W) % G.W, y = r() * G.H, b = r();
      const a = b < 0.85 ? 0.18 + r() * 0.35 : 0.7 + r() * 0.3, s = b < 0.93 ? 1.6 : 2.6;
      C.fillStyle = "rgba(255,255,255," + a.toFixed(2) + ")"; C.fillRect(x, y, s, s);
    }
  };

  /* ---------- draw the globe ---------- */
  G.globe = (T, o) => {
    o = Object.assign({ lat: 20, lon: -40, r: 380, cx: G.CX, cy: G.CY, roll: 0, day: 1, night: 0, sun: 0.25, halo: 1, stars: true, lift: 0.6 }, o || {});
    if (o.body && o.halo === 1 && !o.haloFixed) o.halo = 0;
    const R = setup(), U = R.uni, C = G.ctx();
    if (o.look === "toon") { if (o.sun === 0.25) o.sun = 0; if (o.halo === 1) o.halo = 0.35; }
    if (o.back) G.card(o.back.kind || "flat", T, o.back);
    else if (o.bg) { C.fillStyle = o.bg; C.fillRect(0, 0, G.W, G.H); } else if (o.stars !== false) G.space(o.seed || 99, o.drift || 0);
    // camera: distance from the wanted zoom at the facing spot (pixels per radian = f / (d - 1))
    const d = 1 + R.f / o.r;
    R.cam.position.set(0, 0, d); R.cam.lookAt(0, 0, 0);
    R.cam.near = Math.max(0.0005, (d - 1) * 0.5); R.cam.far = d + 2;
    R.cam.setViewOffset(G.W, G.H, -(o.cx - G.CX), -(o.cy - G.H / 2), G.W, G.H);
    R.cam.updateProjectionMatrix();
    R.inner.rotation.set(0, -(o.lon + 90) * D, 0);
    R.mid.rotation.set(o.lat * D, 0, 0);
    R.outer.rotation.set(0, 0, (o.roll || 0) * D);
    R.scene.updateMatrixWorld(true);
    const body = o.body ? LOADED["body_" + o.body] : null;
    if (o.body && !body) throw new Error("no texture for body " + o.body + ": run textures.py moon");
    U.dayTex.value = body || LOADED.day; U.nightTex.value = LOADED.night;
    U.dayAmt.value = o.day; U.nightAmt.value = body ? 0 : o.night; U.sunAmt.value = o.sun; U.lift.value = body ? 0 : o.lift;
    const tn = o.tint || [1, 1, 1, 0]; U.tint.value.set(tn[0], tn[1], tn[2], tn[3]);
    U.toon.value = o.look === "toon" && !body ? 1 : 0;
    { const sc = new THREE.Color(o.sea || "#2236b4"); U.seaCol.value.set(sc.r, sc.g, sc.b); }
    const sd = o.sunDir || [-0.55, 0.45, 0.7]; U.sunDir.value.set(sd[0], sd[1], sd[2]);
    if (!body && o.hi && LOADED["hi_" + o.hi + "_day"]) {
      const m = R.meta[o.hi];
      U.hiOn.value = 1; U.hiDay.value = LOADED["hi_" + o.hi + "_day"]; U.hiNight.value = LOADED["hi_" + o.hi + "_night"];
      U.hiRect.value.set((m.lon0 + 180) / 360, (m.lat0 + 90) / 180, (m.lon1 + 180) / 360, (m.lat1 + 90) / 180);
    } else U.hiOn.value = 0;
    if (o.regions && !body) {
      U.useReg.value = 1;
      for (let i = 0; i < 8; i++) {
        const g = o.regions[i];
        if (g) { const v = vec(g.lat, g.lon, 0).normalize(); U.reg.value[i].set(v.x, v.y, v.z, Math.cos((g.deg || 15) * D)); U.regK.value[i] = G.clamp(g.k === undefined ? 1 : g.k, 0, 1); }
        else { U.reg.value[i].set(1, 0, 0, 2); U.regK.value[i] = 0; }
      }
    } else U.useReg.value = 0;
    R.r.render(R.scene, R.cam);
    // the projector
    const camPos = R.cam.position.clone();
    const proj = (lat, lon, h) => {
      const p = vec(lat, lon, h || 0).applyMatrix4(R.inner.matrixWorld);
      const s = p.clone().project(R.cam);
      // hidden: the line from the camera to the point passes through the planet first
      const dir = p.clone().sub(camPos), L = dir.length(); dir.divideScalar(L);
      const b = camPos.dot(dir), c = camPos.lengthSq() - 1, disc = b * b - c;
      let vis = s.z < 1;
      if (disc > 0) { const t1 = -b - Math.sqrt(disc); if (t1 > 0 && t1 < L - 1e-4) vis = false; }
      return { x: (s.x + 1) / 2 * G.W, y: (1 - s.y) / 2 * G.H, vis, s: R.f / L, z: L };
    };
    const ctr = new THREE.Vector3(0, 0, 0).project(R.cam);
    const P = {
      pt: proj,
      /* "up" on screen at a place: near the planet's edge things lean outward with the ground; looking straight down
         (a close-up, or the middle of the disc) "up" points at the camera, so they're stood upright on screen instead */
      up: (lat, lon) => {
        const a = proj(lat, lon, 0), b = proj(lat, lon, 0.02);
        const lean = Math.hypot(b.x - a.x, b.y - a.y) / (0.02 * a.s);
        const ang = Math.atan2(b.x - a.x, -(b.y - a.y)) * G.clamp((lean - 0.15) / 0.5, 0, 1);
        return Object.assign(a, { ang, lean });
      },
      c: { x: (ctr.x + 1) / 2 * G.W, y: (1 - ctr.y) / 2 * G.H }, r: R.f / Math.sqrt(d * d - 1), d,
    };
    // the atmosphere: a soft blue rim around the planet
    if (o.halo > 0) {
      const rr = R.f / Math.sqrt(d * d - 1), x = P.c.x, y = P.c.y;
      if (rr < 4000) {
        const g = C.createRadialGradient(x, y, rr * 0.985, x, y, rr * 1.075);
        const hc = o.haloColor || "140,190,255", ha = 0.55 * o.halo * (o.haloFixed ? 1 : Math.max(o.day, 0.15));
        g.addColorStop(0, "rgba(" + hc + "," + ha + ")"); g.addColorStop(1, "rgba(" + hc + ",0)");
        C.fillStyle = g; C.beginPath(); C.arc(x, y, rr * 1.08, 0, 7); C.fill();
      }
    }
    C.save(); if (o.alpha !== undefined) C.globalAlpha *= o.alpha; C.drawImage(R.cv, 0, 0); C.restore();
    return P;
  };

  /* ---------- camera keyframes ---------- */
  const lerpAng = (a, b, k) => { let d = ((b - a + 540) % 360) - 180; return a + d * k; };
  G.fly = (T, keys, ease) => {
    ease = ease || G.ease.io;
    const tt = keys.map((k) => (typeof k[0] === "number" ? k[0] : G.cue(k[0])));
    if (T <= tt[0]) return Object.assign({}, keys[0][1]);
    for (let i = 0; i < keys.length - 1; i++) {
      if (T < tt[i + 1]) {
        const a = keys[i][1], b = keys[i + 1][1], k = ease(G.prog(T, tt[i], tt[i + 1] - tt[i]));
        const o = Object.assign({}, a, b);
        ["lat", "cx", "cy", "roll", "day", "night", "sun", "halo"].forEach((n) => { if (a[n] !== undefined && b[n] !== undefined) o[n] = G.lerp(a[n], b[n], k); });
        if (a.lon !== undefined && b.lon !== undefined) o.lon = lerpAng(a.lon, b.lon, k);
        if (a.r !== undefined && b.r !== undefined) o.r = Math.exp(G.lerp(Math.log(a.r), Math.log(b.r), k));
        return o;
      }
    }
    return Object.assign({}, keys[keys.length - 1][1]);
  };

  /* ---------- things on the globe ---------- */
  /* a glowing arc between two places, drawn on by k (0..1); lift = height at the middle in earth radii */
  G.arc = (P, a, b, k, o) => {
    o = Object.assign({ color: "#fff7c2", glow: "#ffcf4a", width: 9, lift: 0.08, n: 72, head: true }, o || {});
    if (k <= 0) return null;
    const va = vec(a[0], a[1], 0).normalize(), vb = vec(b[0], b[1], 0).normalize();
    const om = Math.acos(G.clamp(va.dot(vb), -1, 1));
    const pts = [];
    const k0 = o.from || 0;
    for (let i = 0; i <= o.n; i++) {
      const t = k0 + (k - k0) * (i / o.n);
      const s = om < 1e-6 ? va.clone() : va.clone().multiplyScalar(Math.sin((1 - t) * om) / Math.sin(om)).add(vb.clone().multiplyScalar(Math.sin(t * om) / Math.sin(om)));
      s.normalize();
      const lat = Math.asin(s.y) / D, lon = Math.atan2(-s.z, s.x) / D;
      pts.push(P.pt(lat, lon, o.lift * Math.sin(Math.PI * t) + (o.base || 0.002)));
    }
    const C = G.ctx(); C.save(); C.lineCap = "round"; C.lineJoin = "round";
    const pass = (w, col, blur) => {
      C.strokeStyle = col; C.lineWidth = w; C.shadowColor = o.glow; C.shadowBlur = blur; C.beginPath();
      let pen = false;
      for (const p of pts) { if (!p.vis) { pen = false; continue; } if (!pen) { C.moveTo(p.x, p.y); pen = true; } else C.lineTo(p.x, p.y); }
      C.stroke();
    };
    if (o.glow) pass(o.width * 2.2, o.glow, 26);
    pass(o.width, o.color, o.glow ? 10 : 0);
    C.restore();
    const end = pts[pts.length - 1];
    if (o.head && k < 1 && end.vis) { C.save(); C.fillStyle = "#ffffff"; C.shadowColor = o.glow || "#fff"; C.shadowBlur = 30; C.beginPath(); C.arc(end.x, end.y, o.width * 1.3, 0, 7); C.fill(); C.restore(); }
    return end;
  };
  /* a glowing dot (a city, a computer) */
  G.dot = (P, lat, lon, k, o) => {
    o = Object.assign({ color: "#ffffff", glow: "#ffd34a", size: 14 }, o || {});
    const p = P.pt(lat, lon, 0.001); if (!p.vis || k <= 0) return p;
    const C = G.ctx(); C.save(); C.shadowColor = o.glow; C.shadowBlur = 28; C.fillStyle = o.color;
    C.beginPath(); C.arc(p.x, p.y, o.size * k, 0, 7); C.fill();
    if (o.ring) { C.strokeStyle = o.glow; C.lineWidth = 4; C.beginPath(); C.arc(p.x, p.y, o.size * (1.8 + o.ring) * k, 0, 7); C.globalAlpha = Math.max(0, 1 - o.ring); C.stroke(); }
    C.restore(); return p;
  };
  /* a label on the globe: text at a place (pops on with k) */
  G.label = (P, lat, lon, txt, k, o) => {
    o = Object.assign({ size: 64, dy: -50, shadow: true }, o || {});
    const p = P.pt(lat, lon, 0.002); if (!p.vis || k <= 0) return p;
    G.text(txt, p.x + (o.dx || 0), p.y + o.dy, Object.assign({}, o, { scale: (o.scale || 1) * k }));
    return p;
  };
  /* a white stick figure standing on the globe */
  G.stander = (P, lat, lon, h, o) => {
    const u = P.up(lat, lon); if (!u.vis) return u;
    const s = (h || 0.03) * u.s / 230;
    const C = G.ctx(); C.save(); C.translate(u.x, u.y); C.rotate(u.ang);
    G.stick(0, 0, s, Object.assign({ head: "#000", face: "none" }, o || {}));
    C.restore(); return u;
  };
  /* any 2D drawing standing on the globe: fn(ctx, scale) draws upward from (0, 0) */
  G.onGlobe = (P, lat, lon, h, fn) => {
    const u = P.up(lat, lon); if (!u.vis) return u;
    const C = G.ctx(); C.save(); C.translate(u.x, u.y); C.rotate(u.ang); fn(C, (h || 0.03) * u.s); C.restore(); return u;
  };
  /* the point `dist` degrees from (lat, lon) in compass direction `bearing` (degrees): [lat, lon] */
  G.offset = (lat, lon, dist, bearing) => {
    const a = lat * D, d = dist * D, b = bearing * D;
    const la = Math.asin(Math.sin(a) * Math.cos(d) + Math.cos(a) * Math.sin(d) * Math.cos(b));
    const lo = lon * D + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(a), Math.cos(d) - Math.sin(a) * Math.sin(la));
    return [la / D, ((lo / D + 540) % 360) - 180];
  };
  /* n seeded random places on the planet (even over the sphere), optionally inside a box [lat0, lat1, lon0, lon1] */
  G.scatter = (seed, n, box) => {
    const r = G.rng(seed), out = [];
    let guard = 0;
    while (out.length < n && guard++ < n * 2000) {
      const lat = Math.asin(2 * r() - 1) / D, lon = r() * 360 - 180;
      if (box && (lat < box[0] || lat > box[1] || lon < box[2] || lon > box[3])) continue;
      out.push([lat, lon]);
    }
    return out;
  };
  /* a spider web wrapped round the planet from (lat, lon): spokes out to `reach` degrees, rings between; k draws it on */
  G.sphereWeb = (P, lat, lon, k, o) => {
    o = Object.assign({ spokes: 12, rings: 7, reach: 85, color: "#ffffff", glow: "#7fd8ff", width: 4 }, o || {});
    if (k <= 0) return;
    const C = G.ctx(); C.save(); C.lineCap = "round"; C.lineJoin = "round"; C.strokeStyle = o.color; C.lineWidth = o.width; C.shadowColor = o.glow; C.shadowBlur = 14;
    const path = (pts) => { C.beginPath(); let pen = false; pts.forEach(([la, lo]) => { const p = P.pt(la, lo, 0.003); if (!p.vis) { pen = false; return; } if (!pen) { C.moveTo(p.x, p.y); pen = true; } else C.lineTo(p.x, p.y); }); C.stroke(); };
    const ks = G.clamp(k * 1.6, 0, 1), kr = G.clamp(k * 1.6 - 0.6, 0, 1);
    for (let i = 0; i < o.spokes; i++) { const b = (i / o.spokes) * 360, pts = []; for (let d = 0; d <= o.reach * ks; d += 2) pts.push(G.offset(lat, lon, d, b)); path(pts); }
    for (let j = 1; j <= o.rings; j++) {
      const d = (j / o.rings) * o.reach, pts = [];
      if (kr * o.rings < j - 1) break;
      const part = G.clamp(kr * o.rings - (j - 1), 0, 1);
      for (let b = 0; b <= 360 * part; b += 3) { const sag = Math.abs(Math.sin(((b % (360 / o.spokes)) / (360 / o.spokes)) * Math.PI)) * 1.5; pts.push(G.offset(lat, lon, d - sag, b)); }
      path(pts);
    }
    C.restore();
  };
  /* a cable along the sea floor: a polyline of [lat, lon] drawn on by k */
  G.cable = (P, path, k, o) => {
    o = Object.assign({ color: "#ffe680", glow: "#ffb000", width: 6 }, o || {});
    if (k <= 0) return;
    const segs = []; let tot = 0;
    for (let i = 1; i < path.length; i++) { const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); segs.push(d); tot += d; }
    let left = tot * G.clamp(k, 0, 1); const pts = [path[0]];
    for (let i = 1; i < path.length && left > 0; i++) { const f = Math.min(1, left / segs[i - 1]); pts.push([G.lerp(path[i - 1][0], path[i][0], f), G.lerp(path[i - 1][1], path[i][1], f)]); left -= segs[i - 1]; }
    // densify so it follows the curve of the planet
    const dense = []; for (let i = 1; i < pts.length; i++) for (let j = 0; j < 8; j++) { const f = j / 8; dense.push([G.lerp(pts[i - 1][0], pts[i][0], f), G.lerp(pts[i - 1][1], pts[i][1], f)]); }
    dense.push(pts[pts.length - 1]);
    const C = G.ctx(); C.save(); C.lineCap = "round"; C.lineJoin = "round";
    [[o.width * 2.4, o.glow, 22], [o.width, o.color, 6]].forEach(([w, col, bl]) => {
      C.strokeStyle = col; C.lineWidth = w; C.shadowColor = o.glow; C.shadowBlur = bl; C.beginPath(); let pen = false;
      dense.forEach(([la, lo]) => { const p = P.pt(la, lo, 0.001); if (!p.vis) { pen = false; return; } if (!pen) { C.moveTo(p.x, p.y); pen = true; } else C.lineTo(p.x, p.y); });
      C.stroke();
    });
    C.restore();
  };
})();
