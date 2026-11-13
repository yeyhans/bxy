/* guess.js: the drawing library for "history of X, i guess" style videos.
   One 2D canvas (1080x1920) per frame, plus glossy three.js props rendered on a second, hidden WebGL canvas and pasted in.
   Every frame is a pure function of time: Guess.render(f) draws frame f from window.TIMELINE (build/timeline.json)
   and window.SCENES (the video's scenes.js). Nothing is random unless seeded. */
(function () {
  const G = {};
  window.G = G;
  const W = 1080, H = 1920;
  G.W = W; G.H = H; G.CX = W / 2;
  // everything that matters stays inside this band: the X cut crops 9:16 to 7:8 around the middle
  G.TOP = 343; G.BOT = 1577; G.CY = (G.TOP + G.BOT) / 2;
  G.FPS = 30;
  G.FONT = { sans: "Arimo, Arial, Helvetica, sans-serif", casual: "'Comic Neue', 'Comic Sans MS', cursive", term: "VT323, 'Courier New', monospace", serif: "'Times New Roman', Times, serif" };

  /* ---------- time ---------- */
  const TL = () => window.TIMELINE;
  const norm = (w) => String(w).toLowerCase().replace(/[’]/g, "'").replace(/[^a-záéíóúüñ0-9']/g, "").replace(/^'+|'+$/g, "");
  G.line = (id) => TL().lines.find((l) => l.id === id);
  /* the n-th held word of a line (timeline.py finds them): [start, end, word], or null */
  G.held = (id, n) => { const l = G.line(id); return l && l.held && l.held[(n || 1) - 1] ? l.held[(n || 1) - 1] : null; };
  G.L = (id) => { const l = G.line(id); if (!l) throw new Error("no line " + id); return l.start; };
  G.Lend = (id) => { const l = G.line(id); return l.start + (l.sing ? l.len : l.dur); };
  /* the start time of a word in a line: G.w("L6", "lo") or the 2nd one: G.w("L6", "the", 2). Numbers are matched as heard ("1969"). */
  G.w = (id, word, n) => {
    const l = G.line(id); if (!l) throw new Error("no line " + id);
    if (l.sing) return l.start;
    let k = n || 1; const want = norm(word);
    for (const x of l.words) { if (norm(x[2]) === want && --k === 0) return x[0]; }
    // fall back: a word that starts with it ("websites" for "website")
    k = n || 1;
    for (const x of l.words) { if (norm(x[2]).startsWith(want) && --k === 0) return x[0]; }
    throw new Error('word "' + word + '" not in ' + id + ": " + l.words.map((x) => x[2]).join(" "));
  };
  G.wend = (id, word, n) => { const l = G.line(id); const t = G.w(id, word, n); const x = l.words.find((q) => q[0] === t); return x ? x[1] : t; };
  G.cue = (c) => (typeof c === "number" ? c : Array.isArray(c) ? G.w(c[0], c[1], c[2]) : G.L(c));

  /* ---------- easing ---------- */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  G.clamp = clamp;
  G.lerp = (a, b, k) => a + (b - a) * k;
  G.prog = (T, t0, dur) => clamp((T - t0) / (dur || 0.0001), 0, 1);
  G.ease = {
    out: (k) => 1 - Math.pow(1 - k, 3),
    in: (k) => k * k * k,
    io: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    back: (k) => { const c1 = 1.15, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },   // a small overshoot: smooth, not springy
  };
  G.pop = (T, t0, dur) => (T < t0 ? 0 : G.ease.back(G.prog(T, t0, dur || 0.16)));
  G.on = (T, t0) => T >= t0;
  G.bob = (T, amp, speed, phase) => Math.sin((T * (speed || 2) + (phase || 0)) * Math.PI * 2) * (amp || 1);
  G.rng = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
  /* a value that steps (no tween) every `every` seconds: for jingle colour flips */
  G.step = (T, t0, every) => Math.floor(Math.max(0, T - t0) / every);

  /* ---------- canvas helpers ---------- */
  let C = null;            // the main 2D context
  G.ctx = () => C;
  function withT(o, fn) {
    C.save();
    if (o.alpha !== undefined) C.globalAlpha *= clamp(o.alpha, 0, 1);
    if (o.x !== undefined) C.translate(o.x, o.y);
    if (o.rot) C.rotate((o.rot * Math.PI) / 180);
    if (o.scale !== undefined) C.scale(o.scale, o.scale);
    fn();
    C.restore();
  }
  G.withT = withT;
  function rrect(c, x, y, w, h, r) {
    if (w <= 0 || h <= 0) { c.beginPath(); return; }
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  G.rrect = rrect;

  /* ---------- backgrounds ---------- */
  G.bg = (color) => { C.fillStyle = color; C.fillRect(0, 0, W, H); };
  G.bgGrad = (c1, c2) => { const g = C.createLinearGradient(0, G.TOP - 200, 0, G.BOT + 200); g.addColorStop(0, c1); g.addColorStop(1, c2); C.fillStyle = g; C.fillRect(0, 0, W, H); };
  G.stars = (seed, n, alpha) => {
    const r = G.rng(seed || 7); C.save(); C.fillStyle = "#fff";
    for (let i = 0; i < (n || 160); i++) { C.globalAlpha = (alpha || 0.5) * (0.3 + 0.7 * r()); const s = r() < 0.9 ? 2 : 3.5; C.fillRect(r() * W, r() * H, s, s); }
    C.restore();
  };
  G.rays = (x, y, color, T, o) => {
    o = o || {}; const n = o.n || 9, len = o.len || 1400;
    C.save(); C.translate(x, y); C.rotate(T * (o.spin || 0.05));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const g = C.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      g.addColorStop(0, color); g.addColorStop(1, "rgba(255,255,255,0)");
      C.fillStyle = g; C.globalAlpha = o.alpha || 0.35;
      C.beginPath(); C.moveTo(0, 0); C.arc(0, 0, len, a - 0.09, a + 0.09); C.closePath(); C.fill();
    }
    C.restore();
  };
  G.sun = (x, y, r, T) => {
    G.rays(x, y, "#fff6a0", T, { n: 11, alpha: 0.45, len: 900 });
    const g = C.createRadialGradient(x, y, 0, x, y, r * 1.6); g.addColorStop(0, "#fffbd0"); g.addColorStop(0.55, "#ffe94a"); g.addColorStop(1, "rgba(255,233,74,0)");
    C.fillStyle = g; C.beginPath(); C.arc(x, y, r * 1.6, 0, 7); C.fill();
  };
  /* cartoon ocean: flat water from y down, a wavy white crest line, a darker band */
  G.ocean = (y, T, color) => {
    C.save(); C.fillStyle = color || "#5ab4ff";
    C.beginPath(); C.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) C.lineTo(x, y + Math.sin(x / 38 + T * 3) * 9);
    C.lineTo(W, H); C.closePath(); C.fill();
    C.strokeStyle = "#ffffff"; C.lineWidth = 7; C.beginPath();
    for (let x = 0; x <= W; x += 10) { const yy = y + Math.sin(x / 38 + T * 3) * 9; x ? C.lineTo(x, yy) : C.moveTo(x, yy); }
    C.stroke(); C.restore();
  };

  /* ---------- text ---------- */
  function fontStr(o) { return (o.italic ? "italic " : "") + (o.weight || (o.font === "casual" ? 700 : o.font === "term" ? 400 : 400)) + " " + o.size + "px " + (G.FONT[o.font || "sans"] || o.font); }
  /* G.text(str, x, y, o): o = {size, font: sans|casual|term|serif, weight, color, style, align, alpha, rot, scale, maxw, lh, glow, colors}
     styles: plain | misprint | glow | wordart | shout | led | extrude | outline */
  G.text = (str, x, y, o) => {
    o = Object.assign({ size: 90, color: "#ffffff", style: "plain", align: "center", lh: 1.12 }, o || {});
    if (o.style === "shout") str = String(str).toUpperCase();
    if (o.style === "led") return G.led(str, x, y, o);
    const lines = String(str).split("\n");
    C.save();
    C.font = fontStr(o);
    // shrink to fit
    if (o.maxw) { const mw = Math.max(...lines.map((l) => C.measureText(l).width)); if (mw > o.maxw) { o = Object.assign({}, o, { size: o.size * (o.maxw / mw) }); C.font = fontStr(o); } }
    C.textAlign = o.align; C.textBaseline = "middle"; C.lineJoin = "round";
    if (o.shadow) { C.shadowColor = "rgba(0,0,0,0.8)"; C.shadowBlur = o.size * 0.2; C.shadowOffsetY = o.size * 0.03; }
    box(str, x, y, Math.max(...lines.map((l) => C.measureText(l).width)), lines.length * o.size * o.lh, o);
    withT({ x: x, y: y, rot: o.rot, scale: o.scale, alpha: o.alpha }, () => {
      const lh = o.size * o.lh, y0 = -((lines.length - 1) * lh) / 2;
      lines.forEach((ln, i) => drawStyled(ln, 0, y0 + i * lh, o));
    });
    C.restore();
  };
  /* the text styles, all Arimo (Helvetica-type) at regular weight unless o.weight says otherwise:
     edges    the plain text: white face, thin dark outline, two thin colour edges offset up-left / down-right (o.edges = [c1, c2])
     emboss   glossy white-to-grey face over a grey bevel (the big reveal)
     fuzzy    a coloured face in a soft halo of another colour (the "uh oh" line): o.color, o.glow
     misprint white face, three thin colour outlines out of register
     glow     neon: a soft glow, a thin coloured rim, a light face
     wordart  gradient face, thin outline, small hard shadow (o.colors)
     shout    CAPS, regular weight, coloured face, thin light outline (pink by default)
     extrude  a stacked fake-3D face (for objects like the @)
     outline  a face with one thin outline
     led      dot-matrix (G.led) */
  function drawStyled(s, x, y, o) {
    const sz = o.size;
    switch (o.style) {
      case "edges": case "his": {
        const e = o.edges || ["#ff9a1f", "#1f6bff"], d = sz * 0.03;
        C.lineWidth = sz * 0.06;
        C.strokeStyle = e[0]; C.strokeText(s, x - d, y - d * 0.7);
        C.strokeStyle = e[1]; C.strokeText(s, x + d, y + d * 0.8);
        C.lineWidth = sz * 0.05; C.strokeStyle = o.outline || "#0d0d14"; C.strokeText(s, x, y);
        C.fillStyle = o.color || "#ffffff"; C.fillText(s, x, y); break;
      }
      case "emboss": {
        const depth = Math.max(2, Math.round(sz * 0.05));
        for (let i = depth; i > 0; i--) { C.fillStyle = i > depth * 0.5 ? (o.side2 || "#4a4a56") : (o.side || "#8c8c9a"); C.fillText(s, x + i * 0.7, y + i); }
        C.lineWidth = sz * 0.035; C.strokeStyle = o.outline || "#1a1a22"; C.strokeText(s, x, y);
        const g = C.createLinearGradient(0, y - sz * 0.45, 0, y + sz * 0.45);
        (o.colors || ["#ffffff", "#f4f4f8", "#c9c9d4"]).forEach((c, i, A) => g.addColorStop(i / (A.length - 1), c));
        C.fillStyle = g; C.fillText(s, x, y);
        if (o.edges) { C.save(); C.globalAlpha = 0.85; C.lineWidth = sz * 0.025; C.strokeStyle = o.edges[0]; C.strokeText(s, x - sz * 0.012, y - sz * 0.012); C.strokeStyle = o.edges[1]; C.strokeText(s, x + sz * 0.014, y + sz * 0.012); C.restore(); }
        break;
      }
      case "fuzzy": {
        const gc = o.glow || "#ff4fd8";
        C.save(); C.shadowColor = gc; C.shadowBlur = sz * 0.32; C.lineWidth = sz * 0.1; C.strokeStyle = gc; C.globalAlpha = 0.9;
        C.strokeText(s, x, y); C.strokeText(s, x, y); C.restore();
        C.lineWidth = sz * 0.03; C.strokeStyle = o.outline || "#0b5a1c"; C.strokeText(s, x, y);
        C.fillStyle = o.color || "#2bd94a"; C.fillText(s, x, y); break;
      }
      case "misprint": {      // white face, colour outlines offset like a bad print
        const offs = [["#ff4fd8", -0.035, -0.03], ["#3dff7a", 0.03, 0.025], ["#2fd9ff", 0.012, -0.035]];
        C.lineWidth = sz * 0.035;
        for (const [c, dx, dy] of offs) { C.strokeStyle = c; C.strokeText(s, x + dx * sz, y + dy * sz); }
        C.strokeStyle = "rgba(20,10,30,0.85)"; C.lineWidth = sz * 0.03; C.strokeText(s, x, y);
        C.fillStyle = o.color || "#fff"; C.fillText(s, x, y); break;
      }
      case "glow": {          // neon: soft glow, a thin coloured rim, a light face
        const gc = o.glow || "#30e0ff";
        C.save(); C.shadowColor = gc; C.shadowBlur = sz * 0.3; C.lineWidth = sz * 0.06; C.strokeStyle = gc; C.strokeText(s, x, y); C.restore();
        C.lineWidth = sz * 0.025; C.strokeStyle = o.rim || "#fff6a0"; C.strokeText(s, x, y);
        C.fillStyle = o.color || "#ffffff"; C.fillText(s, x, y); break;
      }
      case "wordart": {       // gradient face, thin outline, a small hard shadow
        const cs = o.colors || ["#ffe94a", "#ff8a1c", "#ff2d6f"];
        const g = C.createLinearGradient(0, y - sz * 0.45, 0, y + sz * 0.45);
        cs.forEach((c, i) => g.addColorStop(i / (cs.length - 1), c));
        C.fillStyle = "rgba(25,10,40,0.6)"; C.fillText(s, x + sz * 0.04, y + sz * 0.04);
        C.lineWidth = sz * 0.035; C.strokeStyle = o.outline || "#2a0f3a"; C.strokeText(s, x, y);
        C.fillStyle = g; C.fillText(s, x, y);
        C.save(); C.globalAlpha = 0.45; C.lineWidth = sz * 0.015; C.strokeStyle = "#ffffff"; C.strokeText(s, x - sz * 0.01, y - sz * 0.015); C.restore();
        break;
      }
      case "shout": {         // CAPS, regular weight, coloured face, thin light outline
        C.lineWidth = sz * 0.07; C.strokeStyle = o.outline || "#ffffff"; C.strokeText(s, x, y);
        C.fillStyle = o.color === "#ffffff" ? "#ff3d7f" : o.color; C.fillText(s, x, y); break;
      }
      case "extrude": {       // fake 3D WordArt: the face stacked back in a darker colour
        const depth = o.depth || Math.round(sz * 0.14), dc = o.side || "#7a2a8a";
        const ang = o.angle === undefined ? 0.8 : o.angle;
        for (let i = depth; i > 0; i--) { C.fillStyle = dc; C.fillText(s, x + Math.cos(ang) * i * 0.8, y + Math.sin(ang) * i); }
        const cs = o.colors || ["#ffffff", "#ffd0f6"];
        const g = C.createLinearGradient(0, y - sz * 0.45, 0, y + sz * 0.45); cs.forEach((c, i) => g.addColorStop(i / (cs.length - 1), c));
        C.lineWidth = sz * 0.03; C.strokeStyle = o.outline || "#3a1048"; C.strokeText(s, x, y);
        C.fillStyle = g; C.fillText(s, x, y); break;
      }
      case "outline": {
        C.lineWidth = sz * 0.07; C.strokeStyle = o.outline || "#000"; C.strokeText(s, x, y);
        C.fillStyle = o.color; C.fillText(s, x, y); break;
      }
      default: C.fillStyle = o.color; C.fillText(s, x, y);
    }
  }
  /* every text drawn this frame, as screen boxes (render.py zones checks them against the platform's overlays) */
  G.boxes = [];
  function box(str, x, y, w, h, o) {
    const m = C.getTransform(), so = Math.hypot(m.a, m.b), k = o.scale === undefined ? 1 : o.scale, sc = k * so;
    if (sc < 0.25 || (o.alpha !== undefined && o.alpha < 0.2) || C.globalAlpha < 0.2) return;
    const px = m.a * x + m.c * y + m.e, py = m.b * x + m.d * y + m.f;
    const pad = (o.size || 90) * 0.06, hw = (w / 2 + pad) * sc, hh = (h / 2 + pad) * sc;
    const a = ((o.rot || 0) * Math.PI) / 180 + Math.atan2(m.b, m.a);
    const ex = Math.abs(hw * Math.cos(a)) + Math.abs(hh * Math.sin(a)), ey = Math.abs(hw * Math.sin(a)) + Math.abs(hh * Math.cos(a));
    const dx = o.align === "left" ? hw : o.align === "right" ? -hw : 0;
    G.boxes.push({ t: String(str).split(String.fromCharCode(10)).join(" ").slice(0, 40), x0: Math.round(px + dx - ex), y0: Math.round(py - ey), x1: Math.round(px + dx + ex), y1: Math.round(py + ey) });
  }
  G.measure = (str, o) => { C.save(); C.font = fontStr(Object.assign({ size: 90 }, o)); const w = C.measureText(str).width; C.restore(); return w; };

  /* LED / dot-matrix text: our own 5x7 dot font, one lit square per dot (no font file needed) */
  const DOTS = {"$": "..#...#####.#...###...#.#####...#..", "~": "...........#...#.#.#...#...........", "+": ".......#....#..#####..#....#.......", "/": "....#...#....#...#...#....#...#....", "0": ".###.#...##..###.#.###..##...#.###.", "1": "..#...##....#....#....#....#...###.", "2": ".###.#...#....#...#...#...#...#####", "3": "#####...#...#.....#.....##...#.###.", "4": "...#...##..#.#.#..#.#####...#....#.", "5": "######....####.....#....##...#.###.", "6": "..##..#...#....####.#...##...#.###.", "7": "#####....#...#...#...#....#....#...", "8": ".###.#...##...#.###.#...##...#.###.", "9": ".###.#...##...#.####....#...#..##..", "a": "...........###.....#.#####...#.####", "b": "#....#....#.##.##..##...##...#####.", "c": "...........###.#....#....#...#.###.", "d": "....#....#.##.##..###...##...#.####", "e": "...........###.#...#######.....###.", "f": "..##..#..#.#...###...#....#....#...", "g": "......#####...##...#.####....#.###.", "h": "#....#....#.##.##..##...##...##...#", "i": "..#........##....#....#....#...###.", "j": "...#........##....#....#.#..#..##..", "k": "#....#....#..#.#.#..##...#.#..#..#.", "l": ".##....#....#....#....#....#...###.", "m": "..........##.#.#.#.##.#.##...##...#", "n": "..........#.##.##..##...##...##...#", "o": "...........###.#...##...##...#.###.", "p": "..........####.#...#####.#....#....", "q": "...........##.##..##.####....#....#", "r": "..........#.##.##..##....#....#....", "s": "...........###.#.....###.....#####.", "t": ".#....#...###...#....#....#..#..##.", "u": "..........#...##...##...##..##.##.#", "v": "..........#...##...##...#.#.#...#..", "w": "..........#...##...##.#.##.#.#.#.#.", "x": "..........#...#.#.#...#...#.#.#...#", "y": "..........#...##...#.####....#.###.", "z": "..........#####...#...#...#...#####", ".": "..........................##...##..", ",": ".....................##....#...#...", "?": ".###.#...#....#...#...#.........#..", "!": "..#....#....#....#....#.........#..", ":": "......##...##........##...##.......", "-": "...............#####...............", "'": "..#....#...#.......................", "%": "##...##..#...#...#...#...#..##...##", "@": ".###.#...##.####.#.##.####.....###.", " ": "..................................."};
  G.led = (str, x, y, o) => {
    o = Object.assign({ size: 160, color: "#ffffff" }, o || {});
    const chars = String(str).toLowerCase().split("");
    const cols = chars.length * 6 - 1; let step = o.size / 7; if (cols * step > (o.maxw || 980)) step = (o.maxw || 980) / cols; const w = cols * step; o.size = step * 7;
    const r = step * 0.4;
    C.save(); if (o.alpha !== undefined) C.globalAlpha *= o.alpha;
    box(str, x, y, w, o.size, Object.assign({}, o, { scale: 1, rot: 0 }));
    C.translate(x - w / 2, y - o.size / 2);
    if (o.glow) { C.shadowColor = o.glow; C.shadowBlur = step * 0.9; }
    C.fillStyle = o.color;
    C.beginPath();
    chars.forEach((ch, ci) => {
      const g = (DOTS[ch] || "").padEnd(35, ".");
      for (let k = 0; k < 35; k++) if (g[k] === "#") { const i = k % 5, j = Math.floor(k / 5); C.rect(ci * 6 * step + i * step + step / 2 - r, j * step + step / 2 - r, r * 2, r * 2); }
    });
    C.fill(); C.restore();
  };

  /* a sung line: words scattered at different sizes / angles / colours, each landing on its beat */
  G.lyric = (words, T, t0, every, o) => {
    o = o || {};
    const r = G.rng(o.seed || 3);
    const pal = o.colors || ["#ffe94a", "#ff4fd8", "#3dff7a", "#2fd9ff", "#ffffff", "#ff8a1c"];
    const styles = ["wordart", "misprint", "glow", "extrude", "shout"];
    words.forEach((wd, i) => {
      const t = t0 + i * every; if (T < t) return;
      const k = G.pop(T, t, 0.14);
      const x = G.CX + (r() - 0.5) * 520, y = words.length === 1 ? G.CY + (r() - 0.5) * 120 : G.CY - 330 + i * (660 / (words.length - 1)) + (r() - 0.5) * 90;
      const st = (o.styles && o.styles[i]) || styles[Math.floor(r() * styles.length)];
      const c1 = pal[Math.floor(r() * pal.length)], c2 = pal[Math.floor(r() * pal.length)];
      G.text(wd, x, y, { size: (o.size || 150) * (0.75 + r() * 0.5), style: st, color: c1, glow: c2, colors: [c1, c2], rot: (r() - 0.5) * 22, scale: k, maxw: 960, font: o.font });
    });
  };

  /* ---------- colour cards: the full-frame backgrounds between globe shots ----------
     G.PAL: the saturated card colours. G.card(kind, T, o) fills the frame:
       flat (o.color) | grad (o.colors, o.angle) | sky (blue to pale, a sun) | chevron | checker | stripes | dots (o.colors, o.size, scroll)
       rings (pulsing circles from the middle) | burst (rays turning) | plasma (colour-cycling noise, for a held word or a shout)
       static (TV noise) | panels (tilted slabs over a base colour, o.colors) */
  G.PAL = { magenta: "#d6247a", violet: "#5b3bff", royal: "#2f2bff", navy: "#1c2a8f", sky: "#38b6ff", salmon: "#ff8a7a", orange: "#ff9a1f",
            yellow: "#ffd23a", lime: "#8ae234", green: "#1fbf4a", teal: "#12a6b8", pink: "#ff7ad9", purple: "#7a2ad6", red: "#e8262c", grey: "#8c8c8c", white: "#f4f4f4" };
  let PLASMA = null;
  G.card = (kind, T, o) => {
    o = o || {}; const P = G.PAL, c1 = (o.colors || [])[0] || o.color || P.violet, c2 = (o.colors || [])[1] || "#ffffff";
    C.save(); C.setTransform(1, 0, 0, 1, 0, 0); C.globalAlpha = 1;
    const sc = (o.scroll === undefined ? 40 : o.scroll) * (T || 0);
    if (kind === "flat") { C.fillStyle = c1; C.fillRect(0, 0, W, H); }
    else if (kind === "grad" || kind === "sky") {
      const a = ((o.angle || 90) * Math.PI) / 180, dx = Math.cos(a) * H / 2, dy = Math.sin(a) * H / 2;
      const g = C.createLinearGradient(W / 2 - dx, H / 2 - dy, W / 2 + dx, H / 2 + dy);
      const cs = kind === "sky" ? ["#1f8fff", "#bfe8ff"] : [c1, c2];
      g.addColorStop(0, cs[0]); g.addColorStop(1, cs[1]); C.fillStyle = g; C.fillRect(0, 0, W, H);
      if (kind === "sky") { C.restore(); G.sun(o.sunX || 820, o.sunY || 360, 80, T || 0); return; }
    }
    else if (kind === "chevron" || kind === "stripes") {
      C.fillStyle = c1; C.fillRect(0, 0, W, H); C.fillStyle = c2; const s = o.size || 90;
      for (let y = -2 * s + (sc % (2 * s)); y < H + 2 * s; y += 2 * s) {
        C.beginPath();
        if (kind === "chevron") { for (let x = 0; x <= W + s; x += s) C.lineTo(x, y + ((x / s) % 2 ? s * 0.6 : 0)); for (let x = Math.floor((W + s) / s) * s; x >= 0; x -= s) C.lineTo(x, y + s * 0.55 + ((x / s) % 2 ? s * 0.6 : 0)); }
        else { C.moveTo(-W, y); C.lineTo(W * 2, y + W * 0.6); C.lineTo(W * 2, y + W * 0.6 + s); C.lineTo(-W, y + s); }
        C.closePath(); C.fill();
      }
    }
    else if (kind === "checker") { const s = o.size || 120; for (let y = -s; y < H + s; y += s) for (let x = -s; x < W + s; x += s) { C.fillStyle = (((x + y) / s + (Math.floor(sc / s) % 2)) % 2 + 2) % 2 ? c1 : c2; C.fillRect(x + (sc % s), y, s, s); } }
    else if (kind === "dots") { C.fillStyle = c1; C.fillRect(0, 0, W, H); C.fillStyle = c2; const s = o.size || 110; for (let y = 0; y < H + s; y += s) for (let x = 0; x < W + s; x += s) { C.beginPath(); C.arc(x + ((y / s) % 2) * s / 2 + (sc % s), y, s * 0.22, 0, 7); C.fill(); } }
    else if (kind === "rings") { C.fillStyle = c1; C.fillRect(0, 0, W, H); C.strokeStyle = c2; C.lineWidth = o.width || 26; const s = o.size || 120; for (let r = (sc % s); r < H; r += s) { C.beginPath(); C.arc(o.x || W / 2, o.y || H / 2, r, 0, 7); C.stroke(); } }
    else if (kind === "burst") { C.fillStyle = c1; C.fillRect(0, 0, W, H); C.fillStyle = c2; const n = o.n || 16, a0 = (T || 0) * (o.spin || 0.3); for (let i = 0; i < n; i++) { const a = a0 + (i * 2 * Math.PI) / n; C.beginPath(); C.moveTo(o.x || W / 2, o.y || H / 2); C.arc(o.x || W / 2, o.y || H / 2, H * 1.5, a, a + Math.PI / n); C.closePath(); C.fill(); } }
    else if (kind === "plasma" || kind === "static") {
      const w = kind === "static" ? 135 : 54, h = kind === "static" ? 240 : 96;
      if (!PLASMA || PLASMA.width !== w) { PLASMA = document.createElement("canvas"); PLASMA.width = w; PLASMA.height = h; }
      const px = PLASMA.getContext("2d"), im = px.createImageData(w, h), t = (T || 0) * (o.speed || 3), r = G.rng(Math.floor((T || 0) * 30) + 1);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (kind === "static") { const v = 40 + r() * 200; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; }
        else {
          const v = Math.sin(x * 0.21 + t) + Math.sin(y * 0.13 - t * 1.3) + Math.sin((x + y) * 0.11 + t * 0.7) + Math.sin(Math.hypot(x - w / 2, y - h / 2) * 0.23 - t * 1.6);
          const hue = (v * 60 + t * 40) % 360, rgb = hsl2rgb(((hue % 360) + 360) % 360, 0.95, 0.6);
          im.data[i] = rgb[0]; im.data[i + 1] = rgb[1]; im.data[i + 2] = rgb[2];
        }
        im.data[i + 3] = 255;
      }
      px.putImageData(im, 0, 0); C.imageSmoothingEnabled = kind === "plasma"; C.drawImage(PLASMA, 0, 0, W, H); C.imageSmoothingEnabled = true;
    }
    else if (kind === "panels") {
      const cs = o.colors || [P.teal, P.green, P.violet]; C.fillStyle = cs[0]; C.fillRect(0, 0, W, H);
      const r = G.rng(o.seed || 5);
      for (let i = 1; i < cs.length; i++) { C.save(); C.translate(r() * W, r() * H); C.rotate((r() - 0.5) * 1.2 + (T || 0) * 0.05 * (i % 2 ? 1 : -1)); C.fillStyle = cs[i]; C.fillRect(-W * 0.45, -H * 0.18, W * 0.9, H * 0.36); C.restore(); }
    }
    C.restore();
  };
  function hsl2rgb(h, s, l) { const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0) * 255, f(8) * 255, f(4) * 255]; }

  /* a held word: the word in its own colour, its letters spreading apart while the voice holds it (t0..t1 = G.held()).
     o = {size, color, glow, style, spread (extra space per letter, in em, default 0.55), wave (px), maxw}. */
  G.stretch = (word, x, y, T, t0, t1, o) => {
    if (T < t0) return;
    o = Object.assign({ size: 150, color: "#ffe14d", glow: "#ff3d9a", style: "glow", spread: 0.55, wave: 10, maxw: 980 }, o || {});
    const k = G.ease.out(G.prog(T, t0, Math.max(0.1, t1 - t0)));
    C.save(); C.font = fontStr(o);
    const ws = [...word].map((ch) => C.measureText(ch).width);
    let gapw = o.spread * o.size * k, tot = ws.reduce((a, b) => a + b, 0) + gapw * (ws.length - 1), sz = o.size;
    if (tot > o.maxw) { const f = o.maxw / tot; sz *= f; gapw *= f; tot = o.maxw; }
    C.restore();
    const f = sz / o.size; let cx = x - tot / 2;
    [...word].forEach((ch, i) => {
      const w = ws[i] * f;
      G.text(ch, cx + w / 2, y + Math.sin(T * 9 + i * 0.9) * o.wave * k, Object.assign({}, o, { size: sz, maxw: null, scale: G.pop(T, t0, 0.12) }));
      cx += w + gapw;
    });
  };
  /* a phrase that builds word by word as it's said: the k-th word shows from the k-th spoken word after `from` in line id.
     Left-aligned on its finished width, so words don't shift as they arrive. */
  G.build = (T, id, from, text, x, y, o) => {
    const l = G.line(id); if (!l || !l.words) return;
    const t0 = from === undefined || from === null ? l.start : (typeof from === "number" ? from : G.w(id, from));
    const ws = l.words.filter((w) => w[0] >= t0 - 0.001), parts = String(text).split(" ");
    let n = 0; parts.forEach((p, i) => { const tw = ws[i] ? ws[i][0] : ws.length ? ws[ws.length - 1][0] + 0.15 * (i - ws.length + 1) : t0; if (T >= tw) n = i + 1; });
    if (!n) return;
    o = Object.assign({ size: 110, maxw: 980 }, o || {});
    C.save(); C.font = fontStr(o); let full = C.measureText(text).width; C.restore();
    const f = full > o.maxw ? o.maxw / full : 1;
    G.text(parts.slice(0, n).join(" "), x - (full * f) / 2, y, Object.assign({}, o, { size: o.size * f, align: "left", maxw: null }));
  };

  /* the optional call to action (script.json "cta"): the timeline adds it as the last line, id "CTA".
     G.cta(T, o) draws it on a colour card: the held word stretched big, the rest building word by word under it.
     o = {card, colors, y, size, mascot: (T, k) => {...} drawn last}. Returns false before the CTA starts.
     In scenes.js: { name: "cta", at: "CTA", draw: (T, t) => { if (T > G.Lend("CTA") + 0.25) openView(T, T - DUR); else G.cta(T); } } */
  G.cta = (T, o) => {
    const l = G.line("CTA"); if (!l || T < l.start) return false;
    o = Object.assign({ card: "burst", colors: [G.PAL.violet, G.PAL.magenta], y: 640, size: 150 }, o || {});
    G.card(o.card, T, { colors: o.colors, n: 16, spin: 0.35, y: 900, size: 110, scroll: 120 });
    const toks = String(l.text || "").split(" "), hi = Math.max(0, toks.findIndex((w) => /([a-z])\1\1/i.test(w)));
    const h = G.held("CTA"), ws = l.words || [];
    const t0 = hi === 0 ? l.start : (h ? h[0] : (ws[0] ? ws[0][0] : l.start)), t1 = Math.max(h ? h[1] : 0, t0 + 0.6);
    G.stretch(toks[hi] || "", 520, o.y, T, t0, t1 + 0.15, { size: o.size, style: "edges", edges: ["#ffe94a", "#8a4dff"], color: "#ffffff", spread: 0.22, maxw: 780 });
    const rest = toks.slice(hi + 1).join(" "), nxt = ws.find((w) => w[0] > t1 - 0.05);
    if (rest) G.build(T, "CTA", nxt ? nxt[0] : t1, rest, 520, o.y + 190, { style: "edges", size: 110, edges: ["#2fd9ff", "#ff3d7f"], maxw: 760, rot: -2 });
    if (o.mascot) o.mascot(T, G.prog(T, l.start, 0.3));
    return true;
  };

  /* ---------- small graphics ---------- */
  /* the date stamp: a translucent grey box with "year" over the number (top-left of the safe band) */
  G.stamp = (year, T, t0, o) => {
    o = o || {}; if (T < t0) return;
    const k = G.pop(T, t0, 0.14), x = o.x || 70, y = o.y || G.BOT - 180, w = o.w || 260, h = 150;
    if (k > 0.25) G.boxes.push({ t: "year " + year, x0: x, y0: y, x1: x + w, y1: y + h });
    withT({ x: x, y: y, scale: k }, () => {
      C.fillStyle = "rgba(110,110,120,0.62)"; rrect(C, 0, 0, w, h, 14); C.fill();
      C.fillStyle = "#ffffff"; C.font = "400 40px " + G.FONT.sans; C.textAlign = "left"; C.textBaseline = "middle"; C.fillText("year", 22, 38);
      C.fillStyle = "#cfe8ff"; C.font = "400 70px " + G.FONT.sans; C.fillText(String(year), 20, 100);
    });
  };
  /* a black time-jump card: small white text */
  G.jump = (txt) => { G.bg("#000"); G.text(txt, G.CX, G.CY, { size: 64 }); };
  /* the neon frame: offset red / green / blue rectangles */
  G.frame = (x, y, w, h, T) => {
    const offs = [["#ff2a2a", -10, -8], ["#28ff5a", 8, 6], ["#2a7bff", 2, 10]];
    C.save(); C.lineWidth = 12;
    offs.forEach(([c, dx, dy]) => { C.strokeStyle = c; C.shadowColor = c; C.shadowBlur = 18; C.strokeRect(x + dx, y + dy, w, h); });
    C.restore();
  };
  /* a marker stroke drawn on: pts = [[x,y],...], k = 0..1 */
  G.marker = (pts, k, o) => {
    o = o || {}; if (k <= 0) return;
    let total = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
    let left = total * clamp(k, 0, 1);
    C.save(); C.strokeStyle = o.color || "#ffffff"; C.lineWidth = o.width || 14; C.lineCap = "round"; C.lineJoin = "round";
    if (o.glow) { C.shadowColor = o.glow; C.shadowBlur = 16; }
    C.beginPath(); C.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && left > 0; i++) {
      const f = Math.min(1, left / seg[i - 1]);
      C.lineTo(G.lerp(pts[i - 1][0], pts[i][0], f), G.lerp(pts[i - 1][1], pts[i][1], f)); left -= seg[i - 1];
    }
    C.stroke(); C.restore();
  };
  G.wobble = (x1, y1, x2, y2, n, amp, seed) => {
    const r = G.rng(seed || 5), pts = [];
    for (let i = 0; i <= n; i++) { const k = i / n; pts.push([G.lerp(x1, x2, k) + (r() - 0.5) * amp, G.lerp(y1, y2, k) + (r() - 0.5) * amp]); }
    return pts;
  };
  G.arrow = (x1, y1, x2, y2, k, o) => {
    o = o || {};
    G.marker([[x1, y1], [x2, y2]], k, o);
    if (k >= 1) {
      const a = Math.atan2(y2 - y1, x2 - x1), L = o.head || 50;
      G.marker([[x2 + Math.cos(a + 2.5) * L, y2 + Math.sin(a + 2.5) * L], [x2, y2], [x2 + Math.cos(a - 2.5) * L, y2 + Math.sin(a - 2.5) * L]], 1, o);
    }
  };
  G.xmark = (x, y, s, k, o) => {
    o = Object.assign({ color: "#ff5a1f", width: 22 }, o || {});
    G.marker([[x - s, y - s], [x + s, y + s]], clamp(k * 2, 0, 1), o);
    G.marker([[x + s, y - s], [x - s, y + s]], clamp(k * 2 - 1, 0, 1), o);
  };
  G.scribble = (x1, x2, y, k, o) => G.marker(G.wobble(x1, y, x2, y + 6, 6, 10, 9), k, Object.assign({ color: "#2fb8ff", width: 16 }, o || {}));

  /* white stick figure: pose = stand | up | point | hold | sad | walk | sit; face = smile | sad | shock | none */
  G.stick = (x, y, s, o) => {
    o = o || {}; s = s || 1;
    const col = o.color || "#ffffff", lw = 9 * s, T = o.T || 0;
    C.save(); C.translate(x, y); if (o.flip) C.scale(-1, 1);
    C.strokeStyle = col; C.lineWidth = lw; C.lineCap = "round"; C.lineJoin = "round";
    const hr = 30 * s, neck = -150 * s, hip = -70 * s;
    const sw = o.pose === "walk" ? Math.sin(T * 9) * 0.5 : 0;
    // legs (sit: thighs forward, shins down)
    C.beginPath();
    if (o.pose === "sit") { C.moveTo(0, hip); C.lineTo(48 * s, hip + 4 * s); C.lineTo(44 * s, 0); C.moveTo(0, hip); C.lineTo(38 * s, hip + 8 * s); C.lineTo(30 * s, 0); }
    else { C.moveTo(0, hip); C.lineTo(-24 * s + sw * 30 * s, 0); C.moveTo(0, hip); C.lineTo(24 * s - sw * 30 * s, 0); }
    C.stroke();
    // body
    C.beginPath(); C.moveTo(0, hip); C.lineTo(0, neck); C.stroke();
    // arms
    const arm = { sit: [[26, -84], [44, -92]], stand: [[-34, -88], [34, -88]], up: [[-40, -205], [40, -205]], point: [[-30, -90], [62, -150]], hold: [[-40, -120], [40, -120]], sad: [[-22, -84], [22, -84]], walk: [[-30 + sw * 40, -88], [30 - sw * 40, -88]] }[o.pose || "stand"];
    C.beginPath(); C.moveTo(arm[0][0] * s, arm[0][1] * s); C.lineTo(0, neck + 14 * s); C.lineTo(arm[1][0] * s, arm[1][1] * s); C.stroke();
    // head
    C.fillStyle = o.head || "#111"; C.beginPath(); C.arc(0, neck - hr, hr, 0, 7); C.fill(); C.stroke();
    if (o.face !== "none") {
      C.fillStyle = col; const ey = neck - hr - 4 * s;
      C.beginPath(); C.arc(-10 * s, ey, 3.6 * s, 0, 7); C.arc(10 * s, ey, 3.6 * s, 0, 7); C.fill();
      C.lineWidth = 4 * s; C.beginPath();
      if (o.face === "sad") C.arc(0, ey + 22 * s, 9 * s, Math.PI * 1.15, Math.PI * 1.85);
      else if (o.face === "shock") { C.arc(0, ey + 15 * s, 6 * s, 0, 7); }
      else C.arc(0, ey + 6 * s, 10 * s, Math.PI * 0.2, Math.PI * 0.8);
      C.stroke();
    }
    C.restore();
  };
  G.bubble = (x, y, w, h, txt, o) => {
    o = o || {};
    C.save(); C.fillStyle = o.fill || "#ffffff"; C.strokeStyle = o.stroke || "#222"; C.lineWidth = 5;
    rrect(C, x - w / 2, y - h / 2, w, h, h * 0.4); C.fill(); C.stroke();
    const tx = o.tail ? o.tail[0] : x - w * 0.25, ty = o.tail ? o.tail[1] : y + h * 0.9;
    C.beginPath(); C.moveTo(x - w * 0.12, y + h / 2 - 3); C.lineTo(tx, ty); C.lineTo(x + w * 0.02, y + h / 2 - 3); C.closePath(); C.fill();
    C.beginPath(); C.moveTo(x - w * 0.12, y + h / 2); C.lineTo(tx, ty); C.lineTo(x + w * 0.02, y + h / 2); C.stroke();
    C.restore();
    G.text(txt, x, y, { size: o.size || 54, color: o.color || "#222", maxw: w * 0.86, font: o.font });
  };
  /* a browser window: grey title bar with three dots, white page; body(cx) draws inside (local coordinates 0..w, 0..h) */
  G.browser = (x, y, w, h, body, o) => {
    o = o || {};
    C.save(); C.translate(x, y);
    C.fillStyle = "rgba(0,0,0,0.35)"; rrect(C, 14, 18, w, h, 18); C.fill();
    C.fillStyle = "#d9d9de"; rrect(C, 0, 0, w, h, 18); C.fill();
    C.fillStyle = o.page || "#ffffff"; C.fillRect(14, 70, w - 28, h - 84);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => { C.fillStyle = c; C.beginPath(); C.arc(36 + i * 34, 36, 11, 0, 7); C.fill(); });
    if (o.url) { C.fillStyle = "#fff"; rrect(C, 150, 18, w - 180, 36, 10); C.fill(); C.fillStyle = "#555"; C.font = "400 26px " + G.FONT.sans; C.textBaseline = "middle"; C.textAlign = "left"; C.fillText(o.url, 166, 37); }
    C.save(); C.beginPath(); C.rect(14, 70, w - 28, h - 84); C.clip(); C.translate(14, 70); if (body) body(C, w - 28, h - 84); C.restore();
    C.restore();
  };
  G.envelope = (x, y, s, o) => {
    o = o || {};
    withT({ x: x, y: y, scale: s, rot: o.rot }, () => {
      C.fillStyle = "#ffffff"; C.strokeStyle = "#333"; C.lineWidth = 5; rrect(C, -80, -52, 160, 104, 8); C.fill(); C.stroke();
      C.beginPath(); C.moveTo(-80, -52); C.lineTo(0, 12); C.lineTo(80, -52); C.stroke();
    });
  };
  G.paper = (x, y, w, h, o) => {
    o = o || {};
    withT({ x: x, y: y, rot: o.rot || 0 }, () => {
      C.fillStyle = "rgba(0,0,0,0.3)"; C.fillRect(-w / 2 + 14, -h / 2 + 16, w, h);
      C.fillStyle = "#fbfbf4"; C.fillRect(-w / 2, -h / 2, w, h);
      C.fillStyle = "#9aa"; for (let i = 0; i < (o.lines || 12); i++) { const lw = (0.55 + 0.4 * ((i * 37) % 10) / 10) * (w - 120); C.fillRect(-w / 2 + 60, -h / 2 + 150 + i * 46, lw, 10); }
      if (o.title) { C.fillStyle = "#222"; C.font = "700 46px " + G.FONT.serif; C.textAlign = "center"; C.textBaseline = "middle"; C.fillText(o.title, 0, -h / 2 + 80); }
    });
  };
  /* a spider web (radials + spiral) drawn on by k */
  G.web = (x, y, r, k, o) => {
    o = Object.assign({ color: "#ffffff", width: 6 }, o || {});
    const n = 10;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; G.marker([[x, y], [x + Math.cos(a) * r, y + Math.sin(a) * r]], clamp(k * 2 - i * 0.05, 0, 1), o); }
    const pts = []; for (let a = 0; a < Math.PI * 12; a += 0.2) { const rr = (a / (Math.PI * 12)) * r * 0.95; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
    G.marker(pts, clamp(k * 2 - 1, 0, 1), o);
  };
  G.cat = (x, y, s, color, rot) => {
    withT({ x: x, y: y, scale: s, rot: rot }, () => {
      C.fillStyle = color; C.strokeStyle = "#222"; C.lineWidth = 6;
      C.beginPath(); C.moveTo(-70, -30); C.lineTo(-58, -110); C.lineTo(-18, -62); C.lineTo(18, -62); C.lineTo(58, -110); C.lineTo(70, -30);
      C.arc(0, -10, 74, -0.2, Math.PI + 0.2, false); C.closePath(); C.fill(); C.stroke();
      C.fillStyle = "#222"; C.beginPath(); C.ellipse(-26, -22, 8, 13, 0, 0, 7); C.ellipse(26, -22, 8, 13, 0, 0, 7); C.fill();
      C.fillStyle = "#ff8fb8"; C.beginPath(); C.moveTo(-9, 2); C.lineTo(9, 2); C.lineTo(0, 12); C.closePath(); C.fill();
      C.lineWidth = 3; C.beginPath(); [-1, 1].forEach((d) => { C.moveTo(d * 30, 10); C.lineTo(d * 95, 0); C.moveTo(d * 30, 18); C.lineTo(d * 95, 24); }); C.stroke();
    });
  };
  G.elephant = (x, y, s, T) => {
    withT({ x: x, y: y, scale: s }, () => {
      C.fillStyle = "#9aa3b5"; C.strokeStyle = "#2b2f3a"; C.lineWidth = 6;
      // legs
      [[-90, 0], [-40, 0], [40, 0], [90, 0]].forEach(([lx]) => { C.beginPath(); rrect(C, lx - 22, -40, 44, 110, 14); C.fill(); C.stroke(); });
      // body
      C.beginPath(); C.ellipse(0, -80, 150, 100, 0, 0, 7); C.fill(); C.stroke();
      // head + ear
      C.beginPath(); C.ellipse(140, -130, 72, 66, 0, 0, 7); C.fill(); C.stroke();
      C.beginPath(); C.ellipse(112, -130, 48, 62, -0.2, 0, 7); C.fillStyle = "#b9c0cf"; C.fill(); C.stroke();
      // the long trunk, swinging
      const sw = Math.sin(T * 2.4) * 0.25;
      C.lineWidth = 34; C.strokeStyle = "#9aa3b5"; C.lineCap = "round"; C.beginPath(); C.moveTo(195, -120);
      C.quadraticCurveTo(250 + sw * 60, -40, 225 + sw * 90, 40); C.stroke();
      C.lineWidth = 6; C.strokeStyle = "#2b2f3a"; C.fillStyle = "#222"; C.beginPath(); C.arc(162, -150, 7, 0, 7); C.fill();
    });
  };
  G.bills = (T, t0, x, y, n, seed) => {
    const r = G.rng(seed || 11);
    for (let i = 0; i < n; i++) {
      const t = t0 + i * 0.06, k = G.prog(T, t, 0.5); if (k <= 0) { r(); r(); continue; }
      const sx = r() < 0.5 ? -80 : W + 80, sy = G.CY + (r() - 0.5) * 700;
      const px = G.lerp(sx, x, G.ease.out(k)), py = G.lerp(sy, y, G.ease.out(k));
      withT({ x: px, y: py, rot: (r() - 0.5) * 80 + k * 200, scale: 1 - k * 0.6 }, () => { C.fillStyle = "#3fbf5a"; C.strokeStyle = "#1d5f2a"; C.lineWidth = 4; C.fillRect(-60, -30, 120, 60); C.strokeRect(-60, -30, 120, 60); C.fillStyle = "#1d5f2a"; C.beginPath(); C.arc(0, 0, 16, 0, 7); C.fill(); });
    }
  };
  G.burst = (x, y, T, t0, o) => {
    o = o || {}; const k = G.prog(T, t0, o.dur || 0.45); if (k <= 0 || k >= 1) return;
    const r = G.rng(o.seed || 21), n = o.n || 26;
    C.save(); C.globalAlpha = 1 - k;
    for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = (o.r || 420) * G.ease.out(k) * (0.4 + r() * 0.6); C.fillStyle = o.color || (["#ffffff", "#bff4ff", "#ffe94a"][i % 3]); C.beginPath(); C.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 10 + r() * 14, 0, 7); C.fill(); }
    C.restore();
  };

  /* ---------- 3D props (three.js: real materials, studio reflections, soft contact shadows) ---------- */
  let R3 = null;
  const PROPS = {};
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();
  /* a studio to reflect: bright sky, two softboxes, a warm floor (turned into an environment map once) */
  function studio(r) {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#fbfcff"); g.addColorStop(0.42, "#c7cbd6"); g.addColorStop(0.52, "#7d7468"); g.addColorStop(1, "#1c1916");
    x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
    x.filter = "blur(10px)"; x.fillStyle = "#ffffff";
    [[90, 70, 200, 130], [520, 40, 300, 100], [880, 140, 110, 170]].forEach(([a, b, w, h]) => x.fillRect(a, b, w, h));
    x.filter = "none";
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding;
    const pm = new THREE.PMREMGenerator(r); const e = pm.fromEquirectangular(t).texture; pm.dispose(); t.dispose();
    return e;
  }
  function three() {
    if (R3) return R3;
    const cv = document.createElement("canvas"); cv.width = 1100; cv.height = 1100;
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setClearColor(0x000000, 0);
    r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
    const scene = new THREE.Scene(); scene.environment = studio(r);
    const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 100); cam.position.set(0, 0, 9);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3f4a, 0.45));
    const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(-3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0xd6ecff, 1.0); rim.position.set(4, 2, -4); scene.add(rim);
    R3 = { r, cv, scene, cam };
    return R3;
  }
  /* M(colour, {rough, metal, ...}): a physically based material; colours are given as you see them (sRGB) */
  const M = (color, o) => {
    o = Object.assign({}, o || {});
    const rough = o.rough !== undefined ? o.rough : (o.shininess ? clamp(1 - o.shininess / 160, 0.08, 0.9) : 0.45);
    const metal = o.metal || 0;
    ["rough", "metal", "shininess", "specular"].forEach((k) => delete o[k]);
    return new THREE.MeshStandardMaterial(Object.assign({ color: lin(color), roughness: rough, metalness: metal, envMapIntensity: 1.0 }, o));
  };
  function canvasTex(w, h, paint, srgb) {
    const c = document.createElement("canvas"); c.width = w; c.height = h; paint(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c); if (srgb !== false) t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  function screenTex(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return { c, t }; }
  /* a box with rounded edges (w along x, h along y, d along z) */
  function rbox(w, h, d, r, seg) {
    const b = Math.min(r, d / 2, w / 2, h / 2) * 0.5;
    const sw = w - 2 * b, sh = h - 2 * b, rr = Math.max(Math.min(r - b, sw / 2, sh / 2), 0.001);
    const s = new THREE.Shape();
    s.moveTo(-sw / 2 + rr, -sh / 2); s.lineTo(sw / 2 - rr, -sh / 2); s.quadraticCurveTo(sw / 2, -sh / 2, sw / 2, -sh / 2 + rr);
    s.lineTo(sw / 2, sh / 2 - rr); s.quadraticCurveTo(sw / 2, sh / 2, sw / 2 - rr, sh / 2); s.lineTo(-sw / 2 + rr, sh / 2);
    s.quadraticCurveTo(-sw / 2, sh / 2, -sw / 2, sh / 2 - rr); s.lineTo(-sw / 2, -sh / 2 + rr); s.quadraticCurveTo(-sw / 2, -sh / 2, -sw / 2 + rr, -sh / 2);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(d - 2 * b, 0.001), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: seg || 4, curveSegments: 10 });
    g.translate(0, 0, -(d - 2 * b) / 2); g.computeVertexNormals();
    return g;
  }
  /* extruded shapes get their UVs from x, y (outside 0..1, so a map smears at the edges): map x, y across w x h instead */
  function planarUV(g, w, h) { const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5); uv.needsUpdate = true; return g; }
  /* a flat rounded rectangle with 0..1 UVs (screens) */
  function rplane(w, h, r) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const g = new THREE.ShapeGeometry(s, 12); const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
    return g;
  }
  /* a rounded box with a rounded window cut through it (the monitor's bezel) */
  function rrPath(P, w, h, r) {
    P.moveTo(-w / 2 + r, -h / 2); P.lineTo(w / 2 - r, -h / 2); P.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); P.lineTo(w / 2, h / 2 - r);
    P.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); P.lineTo(-w / 2 + r, h / 2); P.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    P.lineTo(-w / 2, -h / 2 + r); P.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return P;
  }
  function rframe(w, h, d, r, iw, ih, ir) {
    const b = Math.min(r, d / 2) * 0.4;
    const s = rrPath(new THREE.Shape(), w - 2 * b, h - 2 * b, Math.max(r - b, 0.001));
    s.holes.push(rrPath(new THREE.Path(), iw + 2 * b, ih + 2 * b, ir + b));
    const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 10 });
    g.translate(0, 0, -(d - 2 * b) / 2); g.computeVertexNormals(); return g;
  }
  /* a thin rod between two points (antennas, legs) */
  function rod(a, b, r, mat) { const d = b.clone().sub(a); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), mat); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.clone().normalize()); return m; }
  /* a box whose back (z < 0) is shrunk by k: the CRT's tube housing */
  function taper(w, h, d, k) {
    const g = new THREE.BoxGeometry(w, h, d); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getZ(i) < 0) { p.setX(i, p.getX(i) * k); p.setY(i, p.getY(i) * k - (1 - k) * h * 0.12); }
    g.computeVertexNormals(); return g;
  }
  const plasticBump = () => canvasTex(256, 256, (x, w, h) => { const r = G.rng(77); const im = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = 118 + r() * 20; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } x.putImageData(im, 0, 0); }, false);
  let BUMP = null;
  const beigeMat = (hex, rough) => { BUMP = BUMP || plasticBump(); BUMP.wrapS = BUMP.wrapT = THREE.RepeatWrapping; BUMP.repeat.set(3, 3); return M(hex, { rough: rough || 0.58, bumpMap: BUMP, bumpScale: 0.004 }); };

  /* a lathe-turned chess piece */
  function chessPiece(kind) {
    const g = new THREE.Group();
    const mat = M(0xf2efe6, { rough: 0.28 });
    const P = (pts) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 48);
    const base = [[0.001, -1.6], [0.78, -1.6], [0.8, -1.48], [0.68, -1.4], [0.7, -1.3], [0.52, -1.18]];
    if (kind === "pawn") {
      g.add(new THREE.Mesh(P(base.concat([[0.36, -0.6], [0.26, -0.15], [0.42, -0.05], [0.42, 0.02], [0.24, 0.1], [0.001, 0.1]])), mat));
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), mat); h.position.y = 0.45; g.add(h);
    } else if (kind === "bishop") {
      g.add(new THREE.Mesh(P(base.concat([[0.32, -0.2], [0.22, 0.45], [0.42, 0.55], [0.42, 0.62], [0.22, 0.7], [0.001, 0.7]])), mat));
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 24), mat); h.scale.set(1, 1.45, 1); h.position.y = 1.12; g.add(h);
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), mat); t.position.y = 1.72; g.add(t);
    } else if (kind === "rook") {
      g.add(new THREE.Mesh(P(base.concat([[0.46, -0.9], [0.42, 0.4], [0.6, 0.55], [0.6, 0.95], [0.001, 0.95]])), mat));
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const c = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.22), mat); c.position.set(Math.cos(a) * 0.48, 1.08, Math.sin(a) * 0.48); c.rotation.y = -a; g.add(c); }
    } else {
      g.add(new THREE.Mesh(P(base.concat([[0.36, -0.4], [0.24, 0.75], [0.46, 0.88], [0.46, 0.96], [0.28, 1.02], [0.5, 1.45], [0.001, 1.38]])), mat));
      if (kind === "queen") {
        for (let i = 0; i < 9; i++) { const a = i * 2 * Math.PI / 9; const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), mat); b.position.set(Math.cos(a) * 0.48, 1.5, Math.sin(a) * 0.48); g.add(b); }
        const t = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), mat); t.position.y = 1.62; g.add(t);
      } else {
        const v = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), mat); v.position.y = 1.72; g.add(v);
        const hz = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.12), mat); hz.position.y = 1.78; g.add(hz);
      }
    }
    g.userData.tint = [mat]; g.userData.tintBase = 0xf2efe6;
    g.scale.setScalar(0.95); g.position.y = -0.05;
    return g;
  }
  const BUILD = {
    /* the beige 90s computer: a CRT monitor with a curved glass screen on a desktop case, keyboard in front */
    crt() {
      const g = new THREE.Group();
      const beige = beigeMat(0xd9cdb0), beige2 = beigeMat(0xcbbd9c, 0.62), dark = M(0x1e1e20, { rough: 0.5 });
      const mon = new THREE.Group(); g.add(mon);
      const bezel = new THREE.Mesh(rframe(2.74, 2.3, 0.42, 0.2, 2.2, 1.76, 0.14), beige); bezel.position.z = 0.6; mon.add(bezel);
      const tube = new THREE.Mesh(taper(2.52, 2.1, 1.7, 0.58), beige2); tube.position.z = -0.42; mon.add(tube);
      const inset = new THREE.Mesh(rplane(2.4, 1.95, 0.16), dark); inset.position.z = 0.6; mon.add(inset);
      const sc = screenTex(640, 512);
      const geo = new THREE.PlaneGeometry(2.12, 1.7, 24, 18); const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const u = p.getX(i) / 1.06, v = p.getY(i) / 0.85; p.setZ(i, 0.07 * (1 - u * u) * (1 - v * v)); }
      geo.computeVertexNormals();
      const scr = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: sc.t, color: lin(0x222222), emissive: 0xffffff, emissiveMap: sc.t, emissiveIntensity: 1.0, roughness: 0.1, metalness: 0, envMapIntensity: 0.6 }));
      scr.position.z = 0.66; mon.add(scr);
      const btn = new THREE.Mesh(rbox(0.16, 0.1, 0.06, 0.03), beige2); btn.position.set(1.05, -1.02, 0.83); mon.add(btn);
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: 0x45ff6a })); led.position.set(0.86, -1.02, 0.84); mon.add(led);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 0.22, 32), beige2); neck.position.set(0, -1.22, -0.1); mon.add(neck);
      mon.position.y = 0.62;
      // the desktop case: floppy slot, a drive bay, a button, vent lines
      const cas = new THREE.Mesh(rbox(3.1, 0.72, 2.4, 0.07), beige); cas.position.set(0, -0.86, -0.15); g.add(cas);
      const fr = 1.06;
      [[0.78, -0.76, 0.86, 0.05], [0.78, -0.95, 0.86, 0.035]].forEach(([x, y, w, h]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), dark); m.position.set(x, y, fr); g.add(m); });
      const bay = new THREE.Mesh(rbox(0.95, 0.3, 0.05, 0.02), beige2); bay.position.set(-0.75, -0.84, fr); g.add(bay);
      const pw = new THREE.Mesh(rbox(0.22, 0.16, 0.06, 0.04), beige2); pw.position.set(1.32, -0.86, fr + 0.01); g.add(pw);
      for (let i = 0; i < 6; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.4, 0.03), M(0x8d8068, { rough: 0.7 })); v.position.set(-0.05 + i * 0.07, -0.86, fr); g.add(v); }
      // keyboard: a wedge and 4 x 13 keys
      const kb = new THREE.Group();
      kb.add(new THREE.Mesh(rbox(3.0, 0.14, 1.05, 0.05), beige2));
      const keyMat = beigeMat(0xece4cf, 0.5), keyGeo = rbox(0.17, 0.1, 0.17, 0.04, 2);
      const keys = new THREE.InstancedMesh(keyGeo, keyMat, 4 * 13 + 1); const mm = new THREE.Matrix4(); let n = 0;
      for (let rI = 0; rI < 4; rI++) for (let cI = 0; cI < 13; cI++) { mm.makeTranslation(-1.26 + cI * 0.21 + rI * 0.04, 0.1, -0.33 + rI * 0.21); keys.setMatrixAt(n++, mm); }
      mm.compose(V3(0.1, 0.1, 0.5), new THREE.Quaternion(), V3(6, 1, 1)); keys.setMatrixAt(n++, mm);       // the space bar
      kb.add(keys);
      kb.position.set(0, -1.32, 1.65); kb.rotation.x = 0.12; g.add(kb);
      g.userData.screen = sc; g.position.y = 0.2;
      return g;
    },
    cake() {
      const g = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.55, 0.1, 64), M(0xffffff, { rough: 0.15 })); plate.position.y = -0.98; g.add(plate);
      const a = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.8, 64), M(0xff8fc8, { rough: 0.55 })); a.position.y = -0.52; g.add(a);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.6, 64), M(0xfff1f6, { rough: 0.5 })); b.position.y = 0.18; g.add(b);
      // icing drips round the top edge of each layer
      [[1.3, -0.12, 0xfff1f6], [0.95, 0.48, 0xff8fc8]].forEach(([R, y, col]) => { for (let i = 0; i < 26; i++) { const an = (i / 26) * Math.PI * 2, len = 0.12 + ((i * 7) % 5) * 0.05; const mt = M(col, { rough: 0.35 }); const d = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, len, 10), mt); d.position.set(Math.cos(an) * (R + 0.01), y - len / 2, Math.sin(an) * (R + 0.01)); g.add(d); const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mt); e.position.set(d.position.x, y - len, d.position.z); g.add(e); } });
      g.userData.candles = [];
      for (let i = 0; i < 5; i++) {
        const an = (i / 5) * Math.PI * 2; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16), M([0x5ab4ff, 0xffe94a, 0x7dff8a, 0xff6fb0, 0xb38bff][i], { rough: 0.4 }));
        c.position.set(Math.cos(an) * 0.55, 0.73, Math.sin(an) * 0.55); g.add(c);
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd36a })); f.scale.set(1, 2, 1); f.position.set(c.position.x, 1.1, c.position.z); g.add(f); g.userData.candles.push(f);
      }
      return g;
    },
    pot() {
      const g = new THREE.Group();
      const prof = []; [[0.0, -1.1], [0.88, -1.1], [1.04, -0.92], [1.07, -0.2], [1.0, 0.2], [0.72, 0.62], [0.56, 0.92], [0.6, 1.02]].forEach(([x, y]) => prof.push(new THREE.Vector2(x, y)));
      const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), new THREE.MeshStandardMaterial({ color: lin(0xdff2ff), transparent: true, opacity: 0.22, roughness: 0.03, metalness: 0, envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false }));
      const cof = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.9, 1, 64), M(0x3a1d0b, { rough: 0.12 }));
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.6, 0.26, 48), M(0x161616, { rough: 0.35 })); collar.position.y = 0.88;
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.16, 48), M(0x161616, { rough: 0.3 })); lid.position.y = 1.08;
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), M(0x161616, { rough: 0.3 })); knob.position.y = 1.2;
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 16, 40, Math.PI * 1.15), M(0x161616, { rough: 0.35 })); handle.position.set(1.12, -0.1, 0); handle.rotation.z = -Math.PI * 0.58;
      g.add(cof); g.add(glass); g.add(collar); g.add(lid); g.add(knob); g.add(handle);
      g.userData.coffee = cof;
      return g;
    },
    camera() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(rbox(1.7, 1.15, 1.2, 0.18), M(0x3a3f4a, { rough: 0.4 })); g.add(body);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.52, 0.18, 48), M(0xb9bec8, { rough: 0.25, metal: 0.9 })); ring.rotation.x = Math.PI / 2; ring.position.z = 0.66; g.add(ring);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.55, 48), M(0x17191e, { rough: 0.3 })); lens.rotation.x = Math.PI / 2; lens.position.z = 0.98; g.add(lens);
      const glass = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.4), M(0x1b2a6a, { rough: 0.02, metal: 0.2, envMapIntensity: 2 })); glass.rotation.x = Math.PI / 2; glass.position.z = 1.18; g.add(glass);
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff2a2a })); led.position.set(0.6, 0.38, 0.62); g.add(led);
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 16), M(0x22252b, { rough: 0.4 })); stand.position.y = -1.0; g.add(stand);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.12, 32), M(0x22252b, { rough: 0.4 })); foot.position.y = -1.45; g.add(foot);
      return g;
    },
    /* an external dial-up modem: a flat case, a black front with a row of LEDs, vents, a coiled phone cord */
    modem() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(rbox(3.3, 0.66, 2.2, 0.14), beigeMat(0x3d4452, 0.42)); g.add(body);
      const panel = new THREE.Mesh(rbox(3.02, 0.36, 0.08, 0.05), M(0x0b0c0f, { rough: 0.12 })); panel.position.set(0, -0.02, 1.09); g.add(panel);
      const labels = canvasTex(1024, 96, (x, w, h) => { x.fillStyle = "#0b0c0f"; x.fillRect(0, 0, w, h); x.fillStyle = "#c9ccd6"; x.font = "28px Arimo, Arial"; x.textAlign = "center"; ["HS", "AA", "CD", "OH", "RD", "SD", "TR", "MR"].forEach((s, i) => x.fillText(s, 90 + i * 120, 82)); });
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 0.27), new THREE.MeshStandardMaterial({ map: labels, roughness: 0.2 })); lab.position.set(0, -0.03, 1.135); g.add(lab);
      g.userData.leds = [];
      for (let i = 0; i < 8; i++) { const l = new THREE.Mesh(rbox(0.13, 0.07, 0.04, 0.03, 2), new THREE.MeshBasicMaterial({ color: 0x33ff66 })); l.position.set(-1.15 + i * 0.34, 0.05, 1.16); g.add(l); g.userData.leds.push(l); }
      for (let i = 0; i < 9; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 0.05), M(0x1a1d24, { rough: 0.6 })); v.position.set(-0.3, 0.335, -0.75 + i * 0.13); g.add(v); }
      [[-1.35, -0.88], [1.35, -0.88], [-1.35, 0.88], [1.35, 0.88]].forEach(([x, z]) => { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), M(0x111111, { rough: 0.8 })); f.position.set(x, -0.36, z); g.add(f); });
      // the phone cord: a coil out of the back
      const pts = [];
      for (let i = 0; i <= 600; i++) { const t = i / 600; const base = V3(1.1 + t * 1.6, -0.1 - t * 0.9, -1.1 - t * 0.8); const a = t * Math.PI * 2 * 22; pts.push(base.add(V3(Math.cos(a) * 0.09, Math.sin(a) * 0.09, Math.sin(a + 1) * 0.05))); }
      const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 900, 0.025, 6, false), M(0xd9d6cc, { rough: 0.45 })); g.add(cord);
      return g;
    },
    laser() {
      const g = new THREE.Group();
      const knurl = canvasTex(64, 512, (x, w, h) => { for (let y = 0; y < h; y += 8) { x.fillStyle = y % 16 ? "#777" : "#bbb"; x.fillRect(0, y, w, 8); } }, false);
      const metal = M(0xc9ced8, { rough: 0.22, metal: 1.0 });
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 2.2, 48), metal); b.rotation.z = Math.PI / 2; b.position.x = -0.3; g.add(b);
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 48), M(0xaeb4bf, { rough: 0.35, metal: 1.0, bumpMap: knurl, bumpScale: 0.02 })); grip.rotation.z = Math.PI / 2; grip.position.x = 0.95; g.add(grip);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.21, 0.3, 48), metal); tip.rotation.z = Math.PI / 2; tip.position.x = 1.55; g.add(tip);
      const ap = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), new THREE.MeshBasicMaterial({ color: 0xff3030 })); ap.rotation.y = Math.PI / 2; ap.position.x = 1.71; g.add(ap);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.21, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), metal); cap.rotation.z = Math.PI / 2; cap.position.x = -1.4; g.add(cap);
      const clip = new THREE.Mesh(rbox(1.3, 0.05, 0.12, 0.02), metal); clip.position.set(-0.75, 0.27, 0); g.add(clip);
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.1, 24), M(0xe01818, { rough: 0.3 })); btn.position.set(0.3, 0.23, 0); g.add(btn);
      return g;
    },
    /* the dot-com bubble: a soap film (thin-film colours that swirl, bright window highlights, clear in the middle) */
    bubble() {
      const g = new THREE.Group();
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, uniforms: { time: { value: 0 } },
        vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform float time; varying vec3 vN; varying vec3 vV; varying vec3 vP;
          vec3 film(float t){ return 0.5 + 0.5 * cos(6.2832 * (vec3(0.0, 0.33, 0.67) + t)); }
          void main(){
            vec3 n = normalize(vN); float c = clamp(dot(n, vV), 0.0, 1.0);
            float fr = pow(1.0 - c, 2.2);
            float swirl = sin(vP.y * 3.0 + time * 1.3 + sin(vP.x * 4.0 + time) * 1.5) * 0.25 + vP.y * 0.25;
            vec3 col = film(c * 1.4 + swirl);
            vec3 r = reflect(-vV, n);
            float h1 = pow(max(dot(r, normalize(vec3(-0.5, 0.6, 0.62))), 0.0), 60.0);
            float h2 = pow(max(dot(r, normalize(vec3(0.6, -0.4, 0.7))), 0.0), 140.0);
            float a = 0.05 + fr * 0.75 + h1 * 0.9 + h2 * 0.6;
            gl_FragColor = vec4(col * (0.55 + fr * 0.6) + vec3(h1 + h2), clamp(a, 0.0, 1.0));
          }`,
      });
      const s = new THREE.Mesh(new THREE.SphereGeometry(1.5, 96, 64), mat); g.add(s);
      g.userData.film = mat;
      return g;
    },
    /* a smartphone: a metal frame, a glass screen with its own picture, a camera bump, side buttons */
    phone() {
      const g = new THREE.Group();
      const frame = new THREE.Mesh(rbox(1.32, 2.68, 0.17, 0.22), M(0x9aa1ab, { rough: 0.25, metal: 1.0 })); g.add(frame);
      const back = new THREE.Mesh(rplane(1.24, 2.6, 0.18), M(0x1f2430, { rough: 0.2 })); back.rotation.y = Math.PI; back.position.z = -0.087; g.add(back);
      const sc = screenTex(420, 880);
      const scr = new THREE.Mesh(rplane(1.22, 2.56, 0.17), new THREE.MeshStandardMaterial({ map: sc.t, color: lin(0x111111), emissive: 0xffffff, emissiveMap: sc.t, emissiveIntensity: 1.0, roughness: 0.06, envMapIntensity: 0.7 }));
      scr.position.z = 0.088; g.add(scr);
      const notch = new THREE.Mesh(rplane(0.32, 0.08, 0.04), new THREE.MeshBasicMaterial({ color: 0x000000 })); notch.position.set(0, 1.17, 0.09); g.add(notch);
      const bump = new THREE.Mesh(rbox(0.5, 0.5, 0.06, 0.12), M(0x2a2f3a, { rough: 0.2 })); bump.position.set(-0.32, 0.92, -0.11); g.add(bump);
      [[-0.43, 1.03], [-0.21, 0.81]].forEach(([x, y]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 24), M(0x0a0a0a, { rough: 0.05 })); l.rotation.x = Math.PI / 2; l.position.set(x, y, -0.14); g.add(l); });
      [[0.67, 0.6, 0.35], [-0.67, 0.75, 0.2], [-0.67, 0.45, 0.2]].forEach(([x, y, h]) => { const b = new THREE.Mesh(rbox(0.04, h, 0.06, 0.02), M(0x9aa1ab, { rough: 0.25, metal: 1 })); b.position.set(x, y, 0); g.add(b); });
      g.userData.screen = sc;
      return g;
    },
    /* the first satellite: a polished ball with a seam and four long antennas swept back */
    sputnik() {
      const g = new THREE.Group();
      const metal = M(0xdfe3e8, { rough: 0.1, metal: 1.0 });
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.72, 64, 48), metal));
      const seam = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.022, 12, 72), M(0x8f959e, { rough: 0.3, metal: 1 })); seam.rotation.y = Math.PI / 2; g.add(seam);
      const ant = M(0xcfd4dc, { rough: 0.2, metal: 1 });
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => {
        g.add(rod(V3(-0.5, 0.3 * a, 0.3 * b), V3(-3.0, 0.95 * a, 0.95 * b), 0.017, ant));
        const k = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), ant); k.position.set(-0.5, 0.3 * a, 0.3 * b); g.add(k);
      });
      g.position.x = 0.9;
      return g;
    },
    /* a generic rocket (no markings): white body, black roll bands, fins, an engine; o.thrust 0..1 lights the flame,
       o.legs 0..1 unfolds landing legs */
    rocket() {
      const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
      const white = M(0xf3f3f1, { rough: 0.35 }), black = M(0x18181b, { rough: 0.4 }), steel = M(0x8d929a, { rough: 0.3, metal: 0.85 });
      const cyl = (r0, r1, h, y, m, th) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, 48, 1, false, 0, th || Math.PI * 2), m); c.position.y = y; body.add(c); return c; };
      cyl(0.32, 0.32, 3.0, -0.3, white);
      cyl(0.323, 0.323, 0.14, 0.75, black); cyl(0.323, 0.323, 0.14, -1.25, black);
      cyl(0.324, 0.324, 0.55, -1.6, black, Math.PI / 2).rotation.y = 0.3; cyl(0.324, 0.324, 0.55, -1.6, black, Math.PI / 2).rotation.y = 0.3 + Math.PI;
      cyl(0.26, 0.32, 0.25, 1.32, white); cyl(0.26, 0.26, 0.6, 1.74, white); cyl(0.262, 0.262, 0.1, 1.5, black);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.75, 48), white); nose.position.y = 2.42; body.add(nose);
      for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.42), black); const a = i * Math.PI / 2 + Math.PI / 4; f.position.set(Math.cos(a) * 0.42, -1.55, Math.sin(a) * 0.42); f.rotation.y = -a; body.add(f); }
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.27, 0.32, 32, 1, true), steel); bell.position.y = -1.96; body.add(bell);
      const flameO = new THREE.Mesh(new THREE.ConeGeometry(0.27, 1.6, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xff8a1c, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
      flameO.rotation.x = Math.PI; flameO.position.y = -2.9; body.add(flameO);
      const flameI = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.0, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false }));
      flameI.rotation.x = Math.PI; flameI.position.y = -2.6; body.add(flameI);
      const legs = [];
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const L = new THREE.Group(); L.position.set(Math.cos(a) * 0.3, -1.3, Math.sin(a) * 0.3); L.rotation.y = -a; const leg = rod(V3(0, 0, 0), V3(0, -0.95, 0), 0.04, black); L.add(leg); body.add(L); legs.push(L); }
      g.userData.flame = [flameO, flameI]; g.userData.legs = legs;
      body.scale.setScalar(0.62); body.position.y = 0.15;
      return g;
    },
    /* a space station: a long truss, modules in the middle, eight solar wings, white radiators */
    station() {
      const g = new THREE.Group();
      const steel = M(0xb9bec6, { rough: 0.3, metal: 0.8 }), white = M(0xeeeeec, { rough: 0.4 });
      const cells = canvasTex(256, 1024, (x, w, h) => { x.fillStyle = "#c79a3a"; x.fillRect(0, 0, w, h); x.fillStyle = "#16244f"; for (let j = 0; j < 32; j++) for (let i = 0; i < 4; i++) x.fillRect(i * 64 + 4, j * 32 + 3, 56, 26); x.fillStyle = "rgba(120,150,255,0.25)"; for (let j = 0; j < 32; j++) x.fillRect(0, j * 32 + 3, w, 3); });
      const panel = M(0xffffff, { rough: 0.22, metal: 0.4, map: cells });
      const truss = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.14, 0.14), steel); g.add(truss);
      [[0, 0, 1.3], [0, 0, -0.3]].forEach(([x, y, l]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 1.6, 32), white); m.rotation.x = Math.PI / 2; m.position.set(x, -0.2, 0.2); g.add(m); });
      const node = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.0, 32), white); node.rotation.z = Math.PI / 2; node.position.set(0, -0.2, -0.55); g.add(node);
      [-2.25, -1.55, 1.55, 2.25].forEach((x) => [1, -1].forEach((s) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 1.9), panel); p.position.set(x, 0, s * 1.08); g.add(p); }));
      [-0.75, 0.75].forEach((x) => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.8), white); r.position.set(x, 0.12, -0.6); g.add(r); });
      g.scale.setScalar(0.82);
      return g;
    },
    /* a lunar lander: a gold-foil descent stage on four legs, a grey ascent stage on top; o.ascent lifts the top off */
    lander() {
      const g = new THREE.Group();
      const gold = M(0xd8a428, { rough: 0.32, metal: 1.0, bumpMap: plasticBump(), bumpScale: 0.03 }), grey = M(0xb8bcc2, { rough: 0.45, metal: 0.3 }), dark = M(0x26282c, { rough: 0.5 });
      const ds = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.62, 8), gold); ds.position.y = -0.2; g.add(ds);
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => {
        g.add(rod(V3(0.55 * a, -0.05, 0.55 * b), V3(1.25 * a, -1.15, 1.25 * b), 0.045, grey));
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.05, 24), grey); pad.position.set(1.25 * a, -1.17, 1.25 * b); g.add(pad);
      });
      const as = new THREE.Group(); g.add(as);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 0.95), grey); as.add(cab);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.35, 8), grey); top.position.y = 0.52; as.add(top);
      [-0.28, 0.28].forEach((x) => { const w = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.02), dark); w.position.set(x, 0.1, 0.48); w.rotation.z = x > 0 ? -0.3 : 0.3; as.add(w); });
      as.add(rod(V3(0.4, 0.45, 0), V3(0.75, 1.0, -0.2), 0.02, grey));
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
      flame.rotation.x = Math.PI; flame.position.y = -0.85; as.add(flame);
      as.position.y = 0.48;
      g.userData.ascent = as; g.userData.ascentFlame = flame;
      g.scale.setScalar(0.95);
      return g;
    },
    /* an 18th-century hot-air balloon: a blue envelope with gold bands and ornaments, a ring gallery underneath */
    balloon() {
      const g = new THREE.Group();
      const tex = canvasTex(1024, 512, (x, w, h) => {
        x.fillStyle = "#1f3f9a"; x.fillRect(0, 0, w, h);
        x.fillStyle = "#e3b23c"; [[0.18, 0.03], [0.46, 0.05], [0.72, 0.03], [0.86, 0.02]].forEach(([y, t]) => x.fillRect(0, h * y, w, h * t));
        for (let i = 0; i < 16; i++) { x.save(); x.translate((i + 0.5) * w / 16, h * 0.32); x.fillStyle = "#e3b23c"; x.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5, r = k % 2 ? 9 : 22; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); x.restore(); }
        for (let i = 0; i < 16; i++) { x.fillStyle = "#c23a2e"; x.beginPath(); x.arc((i + 0.5) * w / 16, h * 0.6, 12, 0, 7); x.fill(); }
        x.strokeStyle = "rgba(0,0,0,0.25)"; x.lineWidth = 3; for (let i = 0; i < 16; i++) { x.beginPath(); x.moveTo(i * w / 16, 0); x.lineTo(i * w / 16, h); x.stroke(); }
      });
      const prof = []; [[0.001, 2.1], [0.75, 2.0], [1.2, 1.65], [1.42, 1.1], [1.45, 0.5], [1.28, -0.15], [0.95, -0.75], [0.66, -1.2], [0.56, -1.5], [0.56, -1.62]].forEach(([r, y]) => prof.push(new THREE.Vector2(r, y)));
      const env = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), M(0xffffff, { rough: 0.6, map: tex, side: THREE.DoubleSide }));
      g.add(env);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.62, 0.26, 40, 1, true), M(0x8a5a2b, { rough: 0.8, side: THREE.DoubleSide })); ring.position.y = -1.85; g.add(ring);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.add(rod(V3(Math.cos(a) * 0.56, -1.6, Math.sin(a) * 0.56), V3(Math.cos(a) * 0.68, -1.75, Math.sin(a) * 0.68), 0.015, M(0x3a2a1a, { rough: 0.8 }))); }
      g.scale.setScalar(0.92); g.position.y = 0.1;
      return g;
    },
    /* an early biplane: two long muslin wings, struts, an elevator out front, twin rudders, two pusher propellers (o.spin) */
    biplane() {
      const g = new THREE.Group();
      const cloth = M(0xf1e9d6, { rough: 0.8 }), wood = M(0x8a6034, { rough: 0.6 });
      [0.32, -0.32].forEach((y) => { const w = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.025, 3.8), cloth); w.position.set(0, y, 0); g.add(w); });
      for (let i = -3; i <= 3; i++) g.add(rod(V3(0.25, -0.32, i * 0.6), V3(0.25, 0.32, i * 0.6), 0.012, wood)), g.add(rod(V3(-0.25, -0.32, i * 0.6), V3(-0.25, 0.32, i * 0.6), 0.012, wood));
      [0.12, -0.12].forEach((y) => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 1.1), cloth); e.position.set(1.35, y, 0); g.add(e); });
      g.add(rod(V3(0.3, -0.3, 0.3), V3(1.25, -0.1, 0.3), 0.012, wood)); g.add(rod(V3(0.3, -0.3, -0.3), V3(1.25, -0.1, -0.3), 0.012, wood));
      [0.25, -0.25].forEach((z) => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.02), cloth); r.position.set(-1.25, 0, z); g.add(r); });
      g.add(rod(V3(-0.3, 0, 0.3), V3(-1.1, 0, 0.25), 0.012, wood)); g.add(rod(V3(-0.3, 0, -0.3), V3(-1.1, 0, -0.25), 0.012, wood));
      const props = [];
      [0.75, -0.75].forEach((z) => { const pr = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.75, 0.07), wood); pr.position.set(-0.36, 0, z); g.add(pr); props.push(pr); });
      const skid = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 0.03), wood); skid.position.set(0.3, -0.5, 0.25); g.add(skid);
      const skid2 = skid.clone(); skid2.position.z = -0.25; g.add(skid2);
      g.userData.props = props;
      return g;
    },
    /* a single-engine monoplane, silver: high wing, round nose, propeller (o.spin) */
    monoplane() {
      const g = new THREE.Group();
      const silver = M(0xc9ccd2, { rough: 0.3, metal: 0.9 }), dark = M(0x2a2c30, { rough: 0.5 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.1, 2.6, 24), silver); body.rotation.z = Math.PI / 2; body.position.x = -0.2; g.add(body);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 16), silver); nose.position.x = 1.1; nose.scale.set(0.6, 1, 1); g.add(nose);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 4.0), silver); wing.position.set(0.35, 0.3, 0); g.add(wing);
      const tailH = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 1.1), silver); tailH.position.set(-1.4, 0.05, 0); g.add(tailH);
      const tailV = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.03), silver); tailV.position.set(-1.4, 0.25, 0); g.add(tailV);
      const pr = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.95, 0.09), dark); pr.position.set(1.27, 0, 0); g.add(pr);
      [0.35, -0.35].forEach((z) => { g.add(rod(V3(0.5, -0.15, 0), V3(0.55, -0.6, z), 0.02, dark)); const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 20), dark); wh.rotation.x = Math.PI / 2; wh.position.set(0.55, -0.62, z); g.add(wh); });
      g.add(rod(V3(0.1, 0.27, 1.2), V3(0.4, -0.15, 0.15), 0.015, dark)); g.add(rod(V3(0.1, 0.27, -1.2), V3(0.4, -0.15, -0.15), 0.015, dark));
      g.userData.props = [pr];
      return g;
    },
    /* a four-engine jumbo jet, plain white (no livery): a hump up front, swept wings, a tall fin */
    jumbo() {
      const g = new THREE.Group();
      const white = M(0xf4f5f7, { rough: 0.35 }), grey = M(0xa9aeb6, { rough: 0.4, metal: 0.5 }), dark = M(0x2a2e36, { rough: 0.3 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 3.4, 40), white); body.rotation.z = Math.PI / 2; g.add(body);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), white); nose.rotation.z = -Math.PI / 2; nose.position.x = 1.7; nose.scale.set(1, 1.6, 1); g.add(nose);
      const hump = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), white); hump.scale.set(3.4, 0.9, 0.95); hump.position.set(1.05, 0.16, 0); g.add(hump);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.9, 32), white); tail.rotation.z = Math.PI / 2; tail.position.x = -2.15; g.add(tail);
      const flat = (pts, th, m) => { const sh = new THREE.Shape(); pts.forEach(([a, b], i) => (i ? sh.lineTo(a, b) : sh.moveTo(a, b))); const geo = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); return new THREE.Mesh(geo, m); };
      [1, -1].forEach((sd) => {
        const w = flat([[0.55, 0], [-0.25, 2.2 * sd], [-0.6, 2.2 * sd], [-0.5, 0]], 0.04, white); w.rotation.x = Math.PI / 2; w.position.y = -0.08; g.add(w);
        const st = flat([[-1.6, 0], [-2.05, 0.75 * sd], [-2.25, 0.75 * sd], [-2.1, 0]], 0.03, white); st.rotation.x = Math.PI / 2; st.position.y = 0.05; g.add(st);
        [0.75, 1.45].forEach((d) => { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.42, 24), grey); e.rotation.z = Math.PI / 2; const x = 0.55 - d * 0.36 + 0.15; e.position.set(x, -0.22, d * sd); g.add(e); const ef = new THREE.Mesh(new THREE.CircleGeometry(0.085, 24), dark); ef.rotation.y = Math.PI / 2; ef.position.set(x + 0.211, -0.22, d * sd); g.add(ef); });
      });
      const fin = flat([[-1.45, 0], [-2.05, 0.95], [-2.3, 0.95], [-2.2, 0]], 0.04, white); fin.position.set(0, 0.18, -0.02); g.add(fin);
      g.rotation.order = "YXZ";
      return g;
    },
    /* a slim supersonic delta-wing jet, plain white (no livery): needle nose, ogival delta wing, four engines in two pods */
    delta() {
      const g = new THREE.Group();
      const white = M(0xf6f7f9, { rough: 0.3 }), grey = M(0x9aa0a8, { rough: 0.4, metal: 0.5 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 3.4, 32), white); body.rotation.z = Math.PI / 2; g.add(body);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.9, 32), white); nose.rotation.z = -Math.PI / 2; nose.position.x = 2.15; g.add(nose);
      const sh = new THREE.Shape(); sh.moveTo(0.9, 0); sh.bezierCurveTo(0.2, 0.25, -0.6, 1.0, -1.45, 1.25); sh.lineTo(-1.7, 1.2); sh.lineTo(-1.7, -1.2); sh.lineTo(-1.45, -1.25); sh.bezierCurveTo(-0.6, -1.0, 0.2, -0.25, 0.9, 0);
      const wing = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }), white); wing.rotation.x = Math.PI / 2; wing.position.y = -0.06; g.add(wing);
      const fin = new THREE.Shape(); fin.moveTo(-1.0, 0); fin.lineTo(-1.6, 0.75); fin.lineTo(-1.8, 0.75); fin.lineTo(-1.75, 0);
      const f = new THREE.Mesh(new THREE.ExtrudeGeometry(fin, { depth: 0.03, bevelEnabled: false }), white); f.position.set(0, 0.08, -0.015); g.add(f);
      [0.55, -0.55].forEach((z) => { const pod = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.32), grey); pod.position.set(-1.25, -0.15, z); g.add(pod); });
      g.rotation.order = "YXZ";
      return g;
    },
    /* a stone money wheel: a thick limestone disc with a hole in the middle (stands on its edge, faces +z) */
    stone() {
      const g = new THREE.Group();
      const tex = canvasTex(512, 512, (x, w, h) => { const r = G.rng(91); x.fillStyle = "#d8d0bd"; x.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const v = 150 + r() * 90; x.fillStyle = "rgba(" + v + "," + (v - 8) + "," + (v - 24) + ",0.5)"; x.fillRect(r() * w, r() * h, 2 + r() * 5, 2 + r() * 5); } for (let i = 0; i < 40; i++) { x.fillStyle = "rgba(90,80,60,0.25)"; x.beginPath(); x.arc(r() * w, r() * h, 3 + r() * 9, 0, 7); x.fill(); } });
      const stoneM = M(0xa79c84, { rough: 0.95, map: tex, bumpMap: tex, bumpScale: 0.08 });
      const sh = new THREE.Shape(); sh.absarc(0, 0, 1.6, 0, Math.PI * 2, false);
      const hole = new THREE.Path(); hole.absarc(0, 0, 0.36, 0, Math.PI * 2, true); sh.holes.push(hole);
      const disc = new THREE.Mesh(planarUV(new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.16, bevelSegments: 6, curveSegments: 64 }), 3.6, 3.6), stoneM);
      disc.position.z = -0.25; g.add(disc);
      return g;
    },
    /* a coin: gold (or o.metal), a raised rim, a stamped face (faces +z) */
    coin() {
      const g = new THREE.Group();
      const face = canvasTex(256, 256, (x, w, h) => { x.fillStyle = "#e2b43c"; x.fillRect(0, 0, w, h); x.strokeStyle = "#a07818"; x.lineWidth = 8; x.beginPath(); x.arc(128, 128, 104, 0, 7); x.stroke(); x.fillStyle = "#b8891e"; x.beginPath(); x.arc(118, 118, 44, 0, 7); x.fill(); x.fillStyle = "#c99a2a"; for (let i = 0; i < 10; i++) { const a = i * 0.63; x.beginPath(); x.ellipse(118 + Math.cos(a) * 52, 118 + Math.sin(a) * 52, 16, 9, a, 0, 7); x.fill(); } });
      const gold = M(0xffffff, { rough: 0.25, metal: 1.0, map: face, bumpMap: face, bumpScale: 0.03 });
      const edge = M(0xd9a830, { rough: 0.3, metal: 1.0 });
      const c = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.18, 64), [edge, gold, gold]); c.rotation.x = Math.PI / 2; g.add(c);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.06, 12, 64), edge); rim.position.z = 0.09; g.add(rim);
      return g;
    },
    /* a pizza: crust ring, red sauce, melted cheese, pepperoni (lies flat, top faces +y) */
    pizza() {
      const g = new THREE.Group();
      const top = canvasTex(512, 512, (x, w, h) => { const r = G.rng(12); x.fillStyle = "#c8341e"; x.fillRect(0, 0, w, h); for (let i = 0; i < 220; i++) { x.fillStyle = r() < 0.5 ? "rgba(255,226,140,0.85)" : "rgba(255,240,190,0.7)"; x.beginPath(); x.ellipse(r() * w, r() * h, 18 + r() * 30, 12 + r() * 18, r() * 3, 0, 7); x.fill(); } for (let i = 0; i < 14; i++) { const a = r() * Math.PI * 2, d = r() * 180; x.fillStyle = "#9e1f1a"; x.beginPath(); x.arc(256 + Math.cos(a) * d, 256 + Math.sin(a) * d, 26, 0, 7); x.fill(); x.fillStyle = "rgba(60,0,0,0.25)"; x.beginPath(); x.arc(256 + Math.cos(a) * d + 5, 256 + Math.sin(a) * d + 5, 8, 0, 7); x.fill(); } });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.12, 64), [M(0xd99a52, { rough: 0.8 }), M(0xffffff, { rough: 0.6, map: top }), M(0xd99a52, { rough: 0.8 })]); g.add(base);
      const crust = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.13, 16, 72), M(0xe0a35c, { rough: 0.85 })); crust.rotation.x = Math.PI / 2; crust.position.y = 0.05; g.add(crust);
      return g;
    },
    /* a plain payment card (no brand): rounded plastic, a chip, a stripe (faces +z) */
    card() {
      const g = new THREE.Group();
      const face = canvasTex(512, 320, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#2a4fd6"); gr.addColorStop(1, "#7a2ad6"); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = "rgba(255,255,255,0.85)"; x.font = "34px monospace"; x.fillText("1234  5678  9012  3456", 40, 230); });
      const body = new THREE.Mesh(planarUV(rbox(3.4, 2.15, 0.05, 0.18), 3.4, 2.15), M(0xffffff, { rough: 0.3, map: face })); g.add(body);
      const chip = new THREE.Mesh(rbox(0.5, 0.4, 0.02, 0.06), M(0xd8b04a, { rough: 0.25, metal: 1 })); chip.position.set(-1.0, 0.25, 0.035); g.add(chip);
      return g;
    },
    /* a Greek column (Doric): fluted marble shaft, a round cushion and a square slab on top, a plinth (stands up) */
    column() {
      const g = new THREE.Group();
      const tex = canvasTex(512, 512, (x, w, h) => {
        x.fillStyle = "#ece6d6"; x.fillRect(0, 0, w, h);
        for (let i = 0; i < 20; i++) { const gx = (i + 0.5) * w / 20, gr = x.createLinearGradient(gx - 13, 0, gx + 13, 0); gr.addColorStop(0, "rgba(80,70,50,0)"); gr.addColorStop(0.5, "rgba(80,70,50,0.38)"); gr.addColorStop(1, "rgba(80,70,50,0)"); x.fillStyle = gr; x.fillRect(gx - 13, 0, 26, h); }
        const r = G.rng(4); for (let i = 0; i < 1200; i++) { x.fillStyle = "rgba(120,105,80," + (r() * 0.16) + ")"; x.fillRect(r() * w, r() * h, 2 + r() * 5, 2 + r() * 5); }
      });
      const marble = M(0xffffff, { rough: 0.65, map: tex, bumpMap: tex, bumpScale: 0.05 }), plain = M(0xe4dccb, { rough: 0.7 });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 3.6, 48), marble); g.add(shaft);
      const ech = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.44, 0.26, 48), plain); ech.position.y = 1.93; g.add(ech);
      const ab = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.22, 1.36), plain); ab.position.y = 2.17; g.add(ab);
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 1.3), plain); base.position.y = -1.9; g.add(base);
      g.scale.setScalar(0.84); g.position.y = -0.05;
      return g;
    },
    /* an early open motor car: dark red body, a brass radiator, a black bench seat, a tiller wheel, four spoked wheels (o.roll turns them); faces +x */
    car() {
      const g = new THREE.Group();
      const red = M(0x8e1b1b, { rough: 0.35 }), black = M(0x1b1b1d, { rough: 0.55 }), brass = M(0xd9a83a, { rough: 0.25, metal: 1 }), wood = M(0xc89a5c, { rough: 0.6 }), tyre = M(0x222224, { rough: 0.85 });
      const body = new THREE.Mesh(rbox(2.3, 0.5, 1.15, 0.12), red); body.position.set(-0.1, 0.05, 0); g.add(body);
      const hood = new THREE.Mesh(rbox(0.75, 0.5, 0.95, 0.1), red); hood.position.set(1.15, 0.12, 0); g.add(hood);
      const rad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.85), brass); rad.position.set(1.55, 0.15, 0); g.add(rad);
      const seat = new THREE.Mesh(rbox(0.6, 0.7, 1.05, 0.15), black); seat.position.set(-0.55, 0.55, 0); g.add(seat);
      const cush = new THREE.Mesh(rbox(0.7, 0.16, 1.0, 0.07), black); cush.position.set(-0.2, 0.36, 0); g.add(cush);
      g.add(rod(V3(0.55, 0.3, 0.25), V3(0.35, 0.95, 0.25), 0.03, black));
      const sw = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 10, 32), black); sw.position.set(0.35, 0.97, 0.25); sw.rotation.set(Math.PI / 2, 0.5, 0); g.add(sw);
      [0.38, -0.38].forEach((z) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 20), brass); l.rotation.z = Math.PI / 2; l.position.set(1.62, 0.5, z); g.add(l); });
      const wheels = [];
      [[0.95, 0.66], [0.95, -0.66], [-0.85, 0.66], [-0.85, -0.66]].forEach(([wx, wz]) => {
        const w = new THREE.Group(); w.position.set(wx, -0.38, wz);
        w.add(new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.075, 14, 40), tyre));
        for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; w.add(rod(V3(0, 0, 0), V3(Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0), 0.022, wood)); }
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 16), brass); hub.rotation.x = Math.PI / 2; w.add(hub);
        g.add(w); wheels.push(w);
      });
      g.userData.wheels = wheels; g.userData.tint = [red]; g.userData.tintBase = 0x8e1b1b;   // o.tint repaints the body (black for a 1914 car)
      g.scale.setScalar(1.05); g.position.y = 0.05;
      return g;
    },
    /* a medal on a ribbon: a raised rim, a laurel ring, a star (o.tint = 0xe2b43c gold, 0xc9ccd2 silver, 0xb8743a bronze); faces +z */
    medal() {
      const g = new THREE.Group();
      const face = canvasTex(256, 256, (x, w, h) => {
        x.fillStyle = "#f2f2f2"; x.fillRect(0, 0, w, h);
        x.strokeStyle = "#9a9a9a"; x.lineWidth = 7; x.beginPath(); x.arc(128, 128, 106, 0, 7); x.stroke();
        x.fillStyle = "#a8a8a8"; for (let i = 0; i < 22; i++) { const a = Math.PI * 0.62 + i * 0.081 * (i < 11 ? 1 : 1); const side = i < 11 ? 1 : -1, k = i % 11, aa = Math.PI / 2 + side * (0.35 + k * 0.22); x.save(); x.translate(128 + Math.cos(aa) * 78, 128 + Math.sin(aa) * 78); x.rotate(aa + side * 0.6); x.beginPath(); x.ellipse(0, 0, 13, 6, 0, 0, 7); x.fill(); x.restore(); }
        x.fillStyle = "#b4b4b4"; x.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 18 : 42; x.lineTo(128 + Math.cos(a) * r, 120 + Math.sin(a) * r); } x.closePath(); x.fill();
      });
      const faceM = M(0xe2b43c, { rough: 0.28, metal: 1, map: face, bumpMap: face, bumpScale: 0.04 }), edgeM = M(0xe2b43c, { rough: 0.3, metal: 1 });
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.16, 64), [edgeM, faceM, faceM]); disc.rotation.x = Math.PI / 2; disc.position.y = -0.55; g.add(disc);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.06, 12, 64), edgeM); rim.position.set(0, -0.55, 0.08); g.add(rim);
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 10, 24), edgeM); loop.position.y = 0.52; g.add(loop);
      const rib = canvasTex(64, 256, (x, w, h) => { x.fillStyle = "#1f4fd1"; x.fillRect(0, 0, w, h); x.fillStyle = "#ffffff"; x.fillRect(w * 0.38, 0, w * 0.24, h); x.fillStyle = "#d42a2a"; x.fillRect(0, 0, w * 0.14, h); x.fillRect(w * 0.86, 0, w * 0.14, h); });
      const ribM = M(0xffffff, { rough: 0.7, map: rib, side: THREE.DoubleSide });
      [-1, 1].forEach((sd) => { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.2), ribM); r.position.set(sd * 0.36, 1.55, -0.04); r.rotation.z = sd * 0.32; g.add(r); });
      g.userData.tint = [faceM, edgeM];
      return g;
    },
    /* an apple gone bad: red with brown rot patches, a stem and a leaf (stands up) */
    apple() {
      const g = new THREE.Group();
      const tex = canvasTex(512, 256, (x, w, h) => {
        const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#b8261c"); gr.addColorStop(1, "#7a1810"); x.fillStyle = gr; x.fillRect(0, 0, w, h);
        const r = G.rng(31); for (let i = 0; i < 400; i++) { x.fillStyle = "rgba(255,214,120," + (r() * 0.35) + ")"; x.fillRect(r() * w, r() * h, 2, 5); }
        [[0.2, 0.5, 46], [0.55, 0.35, 34], [0.8, 0.62, 52], [0.42, 0.75, 26]].forEach(([u, v, rr]) => { const cx = u * w, cy = v * h, rg = x.createRadialGradient(cx, cy, 0, cx, cy, rr); rg.addColorStop(0, "#2e1c0c"); rg.addColorStop(0.65, "#5a3a16"); rg.addColorStop(1, "rgba(90,58,22,0)"); x.fillStyle = rg; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); });
      });
      const prof = [[0.001, -0.82], [0.3, -0.92], [0.72, -0.8], [0.98, -0.42], [1.05, 0.08], [0.96, 0.52], [0.66, 0.84], [0.3, 0.84], [0.001, 0.66]].map(([r, y]) => new THREE.Vector2(r, y));
      const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), M(0xffffff, { rough: 0.45, map: tex, bumpMap: tex, bumpScale: 0.03 })); g.add(body);
      g.add(rod(V3(0, 0.62, 0), V3(0.1, 1.15, 0), 0.04, M(0x5a3a1a, { rough: 0.8 })));
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 8), M(0x4f7a2a, { rough: 0.6 })); leaf.scale.set(1, 0.12, 0.45); leaf.position.set(0.32, 1.02, 0); leaf.rotation.z = 0.5; g.add(leaf);
      g.scale.setScalar(1.25);
      return g;
    },
    /* a winners' podium: three white blocks, 2 | 1 | 3, the numbers on the front (faces +z) */
    podium() {
      const g = new THREE.Group();
      const num = (n) => canvasTex(256, 256, (x, w, h) => { x.fillStyle = "#f4f4f2"; x.fillRect(0, 0, w, h); x.fillStyle = "#1f3fb8"; x.font = "700 170px Arimo, Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(String(n), w / 2, h / 2 + 8); });
      const side = M(0xe9e9e6, { rough: 0.5 }), top = M(0xd8d8d4, { rough: 0.5 });
      [[2, -1.22, 1.05], [1, 0, 1.6], [3, 1.22, 0.72]].forEach(([n, bx, bh]) => {
        const front = M(0xffffff, { rough: 0.5, map: num(n) });
        const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, bh, 1.1), [side, side, top, side, front, side]);
        b.position.set(bx, -1.3 + bh / 2, 0); g.add(b);
      });
      return g;
    },
    /* chess pieces (lathe-turned, glossy; o.tint 0x222226 for black): pawn, bishop, queen, king, rook. Stand up, about 3.3 tall. */
    pawn() { return chessPiece("pawn"); },
    bishop() { return chessPiece("bishop"); },
    queen() { return chessPiece("queen"); },
    king() { return chessPiece("king"); },
    rook() { return chessPiece("rook"); },
    /* a chessboard: 8x8 cream and walnut squares in a wooden frame (lies flat, top up) */
    chessboard() {
      const g = new THREE.Group();
      const top = canvasTex(512, 512, (x, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? "#6b4226" : "#efdcb4"; x.fillRect(i * 64, j * 64, 64, 64); } });
      const wood = M(0x4a2c17, { rough: 0.5 });
      const b = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.16, 4.0), [wood, wood, M(0xffffff, { rough: 0.35, map: top }), wood, wood, wood]); g.add(b);
      const fr = new THREE.Mesh(rframe(4.5, 4.5, 0.22, 0.08, 4.0, 4.0, 0.01), wood); fr.rotation.x = -Math.PI / 2; fr.position.y = -0.02; g.add(fr);
      return g;
    },
    /* a chocolate bar: 4 x 2 pieces, half out of a plain red paper sleeve with a silver foil edge (faces +z, lies like a slab) */
    chocbar() {
      const g = new THREE.Group();
      const choc = M(0x4a2512, { rough: 0.35 });
      const slab = new THREE.Mesh(rbox(3.4, 1.7, 0.16, 0.08), choc); g.add(slab);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const c = new THREE.Mesh(rbox(0.74, 0.72, 0.14, 0.08), choc); c.position.set(-1.25 + i * 0.83, -0.4 + j * 0.8, 0.12); g.add(c); }
      const sleeve = new THREE.Mesh(rbox(1.75, 1.82, 0.42, 0.06), M(0xc8202a, { rough: 0.55 })); sleeve.position.set(0.9, 0, 0.05); g.add(sleeve);
      const band = new THREE.Mesh(rbox(1.75, 0.3, 0.44, 0.03), M(0xf2d27a, { rough: 0.4 })); band.position.set(0.9, 0, 0.06); g.add(band);
      const foil = new THREE.Mesh(rbox(0.12, 1.86, 0.44, 0.03), M(0xd6d9de, { rough: 0.2, metal: 1 })); foil.position.set(0.0, 0, 0.05); g.add(foil);
      return g;
    },
    /* a microwave oven: white box, dark glass door, a control panel; o.glow 0..1 lights the inside (faces +z) */
    microwave() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(rbox(3.4, 2.0, 2.0, 0.12), M(0xeef0f2, { rough: 0.4 })); g.add(body);
      const door = new THREE.Mesh(rbox(2.35, 1.7, 0.08, 0.06), M(0x2a2d33, { rough: 0.3 })); door.position.set(-0.45, 0, 1.0); g.add(door);
      const win = new THREE.Mesh(rplane(1.9, 1.25, 0.08), new THREE.MeshBasicMaterial({ color: 0x1a1c20 })); win.position.set(-0.45, 0, 1.045); g.add(win);
      const panel = new THREE.Mesh(rbox(0.75, 1.7, 0.06, 0.05), M(0xd9dce0, { rough: 0.5 })); panel.position.set(1.18, 0, 1.0); g.add(panel);
      const disp = new THREE.Mesh(rplane(0.55, 0.22, 0.03), new THREE.MeshBasicMaterial({ color: 0x1fe07a })); disp.position.set(1.18, 0.58, 1.04); g.add(disp);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16), M(0x8a8f96, { rough: 0.4 })); k.rotation.x = Math.PI / 2; k.position.set(1.0 + i * 0.18, 0.15 - j * 0.22, 1.05); g.add(k); }
      g.userData.glow = win.material;
      return g;
    },
    /* an open pizza box with a pizza and the little white table in the middle (top up, lid open behind) */
    pizzabox() {
      const g = new THREE.Group();
      const card = M(0xc9a26b, { rough: 0.85 }), inside = M(0xe8d7b0, { rough: 0.9 });
      const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 3.2), [card, card, inside, card, card, card]); base.position.y = -0.15; g.add(base);
      const lid = new THREE.Group(); lid.position.set(0, 0, -1.6); g.add(lid);
      const lp = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 3.2), card); lp.position.set(0, 0, 1.6); lid.add(lp); lid.rotation.x = -1.9;
      const pz = BUILD.pizza(); pz.scale.setScalar(0.92); pz.position.y = 0.08; g.add(pz);
      const white = M(0xf4f4f2, { rough: 0.5 });
      const tab = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 24), white); tab.position.y = 0.42; g.add(tab);
      for (let i = 0; i < 3; i++) { const a = i * 2.094; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8), white); leg.position.set(Math.cos(a) * 0.17, 0.27, Math.sin(a) * 0.17); g.add(leg); }
      return g;
    },
    /* a pineapple: diamond-scaled body and a spiky crown (stands up) */
    pineapple() {
      const g = new THREE.Group();
      const tex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = "#c98f2a"; x.fillRect(0, 0, w, h); x.strokeStyle = "#7a4e12"; x.lineWidth = 6; for (let i = -10; i < 20; i++) { x.beginPath(); x.moveTo(i * 48, 0); x.lineTo(i * 48 + h, h); x.stroke(); x.beginPath(); x.moveTo(i * 48, h); x.lineTo(i * 48 + h, 0); x.stroke(); } for (let i = 0; i < 160; i++) { x.fillStyle = "rgba(240,200,90,0.5)"; x.beginPath(); x.arc((i * 97) % w, (i * 53) % h, 6, 0, 7); x.fill(); } });
      const prof = [[0.001, -1.4], [0.55, -1.35], [0.85, -0.9], [0.95, -0.2], [0.88, 0.5], [0.6, 0.95], [0.25, 1.1], [0.001, 1.12]].map(([r, y]) => new THREE.Vector2(r, y));
      g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 40), M(0xffffff, { rough: 0.6, map: tex, bumpMap: tex, bumpScale: 0.05 })));
      const leafM = M(0x3f8a2e, { rough: 0.55, side: THREE.DoubleSide });
      for (let i = 0; i < 14; i++) { const a = i * 2.4, tilt = 0.25 + (i % 3) * 0.2, len = 0.9 + (i % 4) * 0.18; const lf = new THREE.Mesh(new THREE.ConeGeometry(0.1, len, 4), leafM); lf.position.set(Math.cos(a) * 0.12, 1.1 + len / 2 - 0.1, Math.sin(a) * 0.12); lf.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt); g.add(lf); }
      g.scale.setScalar(0.85); g.position.y = -0.2;
      return g;
    },
    /* a handheld game console, generic: light grey, a green screen, a d-pad, two buttons, no markings (faces +z) */
    handheld() {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(rbox(2.0, 3.3, 0.45, 0.16), M(0xc7c5bd, { rough: 0.5 })));
      const bez = new THREE.Mesh(rplane(1.6, 1.3, 0.1), M(0x4a4e5a, { rough: 0.4 })); bez.position.set(0, 0.75, 0.235); g.add(bez);
      const scr = new THREE.Mesh(rplane(1.05, 0.95, 0.03), new THREE.MeshBasicMaterial({ color: 0x9bbc0f })); scr.position.set(0, 0.75, 0.24); g.add(scr);
      const dark = M(0x26262b, { rough: 0.4 });
      const dx = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.08), dark); dx.position.set(-0.5, -0.6, 0.25); g.add(dx);
      const dy = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.08), dark); dy.position.set(-0.5, -0.6, 0.25); g.add(dy);
      [[0.35, -0.68], [0.68, -0.48]].forEach(([x, y]) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 24), M(0x8b1e48, { rough: 0.35 })); b.rotation.x = Math.PI / 2; b.position.set(x, y, 0.24); g.add(b); });
      g.userData.screen = null; g.userData.lcd = scr.material;
      return g;
    },
    /* a game cartridge, generic: dark grey, ridged top, a plain label (faces +z) */
    cartridge() {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(rbox(2.3, 2.5, 0.45, 0.1), M(0x2b2b30, { rough: 0.45 })));
      for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.05), M(0x3a3a40, { rough: 0.5 })); r.position.set(0, 1.0 - i * 0.1, 0.24); g.add(r); }
      const lab = new THREE.Mesh(rplane(1.8, 1.3, 0.06), M(0xe9b84a, { rough: 0.6 })); lab.position.set(0, -0.25, 0.235); g.add(lab);
      return g;
    },
    /* an arcade cabinet, generic: a tall body, a slanted dark screen, a coloured marquee, a joystick and buttons (faces +z, a little to the side) */
    arcade() {
      const g = new THREE.Group();
      const side = M(0x23233a, { rough: 0.45 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.6, 1.3), side); body.position.y = -0.15; g.add(body);
      const mq = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.42, 0.2), new THREE.MeshBasicMaterial({ color: 0xff3d7f })); mq.position.set(0, 1.45, 0.62); g.add(mq);
      const scr = new THREE.Mesh(rplane(1.2, 0.95, 0.06), new THREE.MeshBasicMaterial({ color: 0x0b0d1a })); scr.position.set(0, 0.6, 0.66); scr.rotation.x = -0.15; g.add(scr);
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.6), M(0x34345a, { rough: 0.4 })); deck.position.set(0, -0.15, 0.85); deck.rotation.x = 0.25; g.add(deck);
      g.add(rod(V3(-0.35, -0.1, 0.9), V3(-0.35, 0.18, 0.95), 0.03, M(0x111111, {})));
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), M(0xe8262c, { rough: 0.3 })); ball.position.set(-0.35, 0.22, 0.96); g.add(ball);
      [0.15, 0.4].forEach((x) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16), M(0xffd23a, { rough: 0.3 })); b.position.set(x, -0.06, 0.92); b.rotation.x = 0.25; g.add(b); });
      g.userData.arcadeScreen = scr.material;
      g.scale.setScalar(0.9);
      return g;
    },
    /* an 1880s motor tricycle: two big spoked rear wheels, a small front wheel, a bench seat, a flywheel, a tiller (faces +x) */
    tricycle() {
      const g = new THREE.Group();
      const black = M(0x1c1c1e, { rough: 0.5 }), steel = M(0x9aa0a8, { rough: 0.3, metal: 0.9 }), brass = M(0xc9a03a, { rough: 0.3, metal: 1 }), wood = M(0x7a4a24, { rough: 0.6 });
      const wheel = (x, z, r) => { const w = new THREE.Group(); w.position.set(x, -0.9 + r, z); w.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 10, 48), black)); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; w.add(rod(V3(0, 0, 0), V3(Math.cos(a) * r, Math.sin(a) * r, 0), 0.012, steel)); } const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12), brass); hub.rotation.x = Math.PI / 2; w.add(hub); g.add(w); return w; };
      const wheels = [wheel(-0.7, 0.62, 0.68), wheel(-0.7, -0.62, 0.68), wheel(1.1, 0, 0.42)];
      g.add(rod(V3(-0.7, -0.22, 0.62), V3(-0.7, -0.22, -0.62), 0.03, steel));
      g.add(rod(V3(-0.7, -0.2, 0), V3(1.1, -0.45, 0), 0.035, steel));
      g.add(rod(V3(1.1, -0.45, 0), V3(0.85, 0.55, 0), 0.03, steel));
      g.add(rod(V3(0.85, 0.55, 0), V3(0.55, 0.55, 0), 0.025, black));
      const seat = new THREE.Mesh(rbox(0.7, 0.18, 1.0, 0.06), black); seat.position.set(-0.35, 0.3, 0); g.add(seat);
      const back = new THREE.Mesh(rbox(0.12, 0.45, 1.0, 0.05), black); back.position.set(-0.68, 0.5, 0); g.add(back);
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.9), wood); deck.position.set(-0.45, 0.12, 0); g.add(deck);
      const fly = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 32), brass); fly.position.set(-1.05, 0.05, 0); g.add(fly);
      const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.45, 16), steel); eng.position.set(-0.95, 0.2, 0.25); g.add(eng);
      g.userData.wheels = wheels;
      g.scale.setScalar(1.15);
      return g;
    },
    /* a toilet: porcelain bowl with a seat and the lid up, a tank with a chrome handle (faces +z, stands up, about 3 tall).
       o.tint recolours the porcelain (0x8a5a2b reads as a wooden 1590s privy, 0xb8bec6 as a steel space toilet). */
    toilet() {
      const g = new THREE.Group();
      const por = M(0xf4f5f2, { rough: 0.16 }), chrome = M(0xd6d9de, { rough: 0.15, metal: 1 }), seatM = M(0xf4f5f2, { rough: 0.3 });
      const prof = [[0.001, -1.3], [0.62, -1.3], [0.6, -1.18], [0.44, -0.95], [0.4, -0.62], [0.62, -0.25], [0.86, 0.02], [0.96, 0.2], [0.92, 0.3], [0.001, 0.3]].map(([r, y]) => new THREE.Vector2(r, y));
      const bowl = new THREE.Mesh(new THREE.LatheGeometry(prof, 56), por); bowl.scale.set(1, 1, 1.28); bowl.position.z = 0.25; g.add(bowl);
      const water = new THREE.Mesh(new THREE.CircleGeometry(0.62, 48), M(0x8fc4dc, { rough: 0.05 })); water.rotation.x = -Math.PI / 2; water.scale.set(1, 1.28, 1); water.position.set(0, 0.305, 0.3); g.add(water);
      const seat = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.12, 14, 56), seatM); seat.rotation.x = Math.PI / 2; seat.scale.set(1, 1.24, 0.7); seat.position.set(0, 0.36, 0.28); g.add(seat);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.07, 48), seatM); lid.scale.set(1, 1, 1.22); lid.rotation.x = Math.PI / 2 - 0.22; lid.position.set(0, 1.05, -0.58); g.add(lid);
      const tank = new THREE.Mesh(rbox(1.75, 1.15, 0.62, 0.1), por); tank.position.set(0, 0.95, -0.9); g.add(tank);
      const tlid = new THREE.Mesh(rbox(1.86, 0.14, 0.72, 0.05), por); tlid.position.set(0, 1.58, -0.9); g.add(tlid);
      const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16), chrome); hb.rotation.x = Math.PI / 2; hb.position.set(-0.62, 1.3, -0.57); g.add(hb);
      g.add(rod(V3(-0.62, 1.3, -0.56), V3(-0.3, 1.3, -0.5), 0.035, chrome));
      g.userData.tint = [por, seatM]; g.userData.tintBase = 0xf4f5f2;
      g.position.y = -0.1;
      return g;
    },
    /* a landline handset with a coiled cord */
    handset() {
      const g = new THREE.Group();
      const red = M(0xd8172b, { rough: 0.28 });
      const path = new THREE.CatmullRomCurve3([V3(-1.45, -0.3, 0), V3(-0.95, 0.12, 0), V3(0, 0.3, 0), V3(0.95, 0.12, 0), V3(1.45, -0.3, 0)]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(path, 60, 0.21, 20, false), red));
      [[-1.5, -0.42, 0.35], [1.5, -0.42, -0.35]].forEach(([x, y, rz]) => {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.38, 0.36, 40), red); cup.position.set(x, y, 0); cup.rotation.z = rz; g.add(cup);
        const face = new THREE.Mesh(new THREE.CircleGeometry(0.4, 40), M(0xb01020, { rough: 0.5 })); face.rotation.x = Math.PI / 2; face.position.set(0, -0.181, 0); cup.add(face);
      });
      const pts = [];
      for (let i = 0; i <= 500; i++) { const t = i / 500; const base = V3(1.5 + t * 0.6, -0.65 - t * 2.2, t * 0.4); const a = t * Math.PI * 2 * 18; pts.push(base.add(V3(Math.cos(a) * 0.1, Math.sin(a) * 0.04, Math.sin(a) * 0.1))); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 800, 0.03, 6, false), red));
      return g;
    },
  };
  /* G.prop(name, x, y, size, o): o = {rx, ry, rz (radians), screen: (ctx, w, h) => {}, coffee: 0..1, leds: T, flame: T, film: T,
     shadow: 0..1 (a soft contact shadow under it), alpha}. Draws the prop centred on (x, y) in a size x size box. */
  G.prop = (name, x, y, size, o) => {
    o = o || {};
    if (size <= 1 && !o.only) return;
    const R = three();
    if (!PROPS[name]) { PROPS[name] = BUILD[name](); }
    const g = PROPS[name];
    R.scene.children.filter((c) => c.isGroup).forEach((c) => R.scene.remove(c));
    R.scene.add(g);
    g.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
    if (g.userData.screen && o.screen) { const sc = g.userData.screen; const cx = sc.c.getContext("2d"); cx.save(); o.screen(cx, sc.c.width, sc.c.height); cx.restore(); sc.t.needsUpdate = true; }
    if (g.userData.coffee) { const lv = clamp(o.coffee === undefined ? 0.7 : o.coffee, 0.001, 1); g.userData.coffee.scale.y = lv * 1.6; g.userData.coffee.position.y = -1.06 + lv * 0.8; g.userData.coffee.visible = lv > 0.01; }
    if (g.userData.leds) g.userData.leds.forEach((l, i) => { l.material.color.setHex(Math.sin((o.leds || 0) * 14 + i * 1.7) > 0 ? 0x33ff66 : 0x0f3318); });
    if (g.userData.candles) g.userData.candles.forEach((f, i) => { f.scale.y = 2 + 0.4 * Math.sin((o.flame || 0) * 20 + i); });
    if (g.userData.film) g.userData.film.uniforms.time.value = o.film || 0;
    if (g.userData.props) g.userData.props.forEach((pr) => { pr.rotation.x = (o.spin || 0) * 25; });
    if (g.userData.wheels) g.userData.wheels.forEach((w) => { w.rotation.z = -(o.roll || 0); });
    if (g.userData.tint) g.userData.tint.forEach((m) => m.color.copy(lin(o.tint !== undefined ? o.tint : (g.userData.tintBase || 0xe2b43c))));
    if (g.userData.glow) g.userData.glow.color.setRGB(0.1 + 0.9 * (o.glow || 0), 0.11 + 0.75 * (o.glow || 0), 0.12 + 0.25 * (o.glow || 0));
    if (g.userData.lcd && o.lcd !== undefined) g.userData.lcd.color.set(o.lcd);
    if (g.userData.arcadeScreen && o.lcd !== undefined) g.userData.arcadeScreen.color.set(o.lcd);
    if (g.userData.flame) { const th = clamp(o.thrust || 0, 0, 1), fl = 0.85 + 0.15 * Math.sin((o.T || 0) * 47); g.userData.flame.forEach((f, i) => { f.visible = th > 0.01; f.scale.set(1, th * fl * (i ? 0.9 : 1), 1); }); }
    if (g.userData.legs) g.userData.legs.forEach((L) => { L.rotation.z = 0; L.rotation.x = 0; L.children[0].rotation.set(0, 0, 0); L.rotation.order = 'YXZ'; L.rotation.z = -clamp(o.legs || 0, 0, 1) * 0.55; });
    if (g.userData.ascent) { const up = Math.max(0, o.ascent || 0); g.userData.ascent.position.y = 0.48 + up; g.userData.ascentFlame.visible = up > 0.001 && up < 3; }
    R.r.render(R.scene, R.cam);
    if (o.only) return R.cv;
    C.save(); if (o.alpha !== undefined) C.globalAlpha *= o.alpha;
    if (o.shadow) {
      const sy = y + size * (o.shadowY || 0.36), sw = size * (o.shadowW || 0.42);
      const gr = C.createRadialGradient(x, sy, 0, x, sy, sw); gr.addColorStop(0, "rgba(0,0,0," + (0.55 * o.shadow) + ")"); gr.addColorStop(1, "rgba(0,0,0,0)");
      C.save(); C.translate(x, sy); C.scale(1, 0.16); C.translate(-x, -sy); C.fillStyle = gr; C.beginPath(); C.arc(x, sy, sw, 0, 7); C.fill(); C.restore();
    }
    C.drawImage(R.cv, x - size / 2, y - size / 2, size, size);
    C.restore();
  };
  /* render a prop once and get its canvas (1100 x 1100, transparent) to draw it many times: G.propImg("laser", {ry: 0.4}) */
  G.propImg = (name, o) => G.prop(name, 0, 0, 0, Object.assign({}, o || {}, { only: true }));

  /* ---------- the format's other moves ---------- */
  /* a flash frame: the whole picture one colour for `dur` seconds (0.08 = 2-3 frames). Call it last in a scene. */
  G.flash = (T, t0, color, dur) => { if (T >= t0 && T < t0 + (dur || 0.08)) { C.save(); C.setTransform(1, 0, 0, 1, 0, 0); C.globalAlpha = 1; C.fillStyle = color || "#ffffff"; C.fillRect(0, 0, W, H); C.restore(); return true; } return false; };
  /* a number that runs up from a to b between t0 and t1 (ease-in, like a ticking counter); fmt(n) makes the text */
  G.count = (T, t0, t1, a, b, fmt) => { const k = G.ease.in(G.prog(T, t0, t1 - t0)); const n = Math.round(a + (b - a) * k); return fmt ? fmt(n) : n.toLocaleString("en-US"); };
  /* an old-computer error dialog: grey box, blue title bar, red X, one big word, an ok button */
  G.errorBox = (x, y, w, k, msg, o) => {
    o = o || {}; if (k <= 0) return;
    const h = w * 0.58;
    withT({ x: x, y: y, scale: k, rot: o.rot || 0 }, () => {
      C.fillStyle = "rgba(0,0,0,0.5)"; C.fillRect(-w / 2 + 18, -h / 2 + 22, w, h);
      C.fillStyle = "#c3c3c3"; C.fillRect(-w / 2, -h / 2, w, h);
      const bev = (x0, y0, x1, y1, inset) => { C.lineWidth = 5; C.strokeStyle = inset ? "#404040" : "#ffffff"; C.beginPath(); C.moveTo(x0, y1); C.lineTo(x0, y0); C.lineTo(x1, y0); C.stroke(); C.strokeStyle = inset ? "#ffffff" : "#404040"; C.beginPath(); C.moveTo(x1, y0); C.lineTo(x1, y1); C.lineTo(x0, y1); C.stroke(); };
      bev(-w / 2 + 3, -h / 2 + 3, w / 2 - 3, h / 2 - 3);
      const g = C.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, "#08166e"); g.addColorStop(1, "#3c7fd8");
      C.fillStyle = g; C.fillRect(-w / 2 + 10, -h / 2 + 10, w - 20, 70);
      C.fillStyle = "#fff"; C.font = "700 42px " + G.FONT.sans; C.textAlign = "left"; C.textBaseline = "middle"; C.fillText(o.title || "error", -w / 2 + 30, -h / 2 + 46);
      C.fillStyle = "#c3c3c3"; C.fillRect(w / 2 - 70, -h / 2 + 20, 50, 50); bev(w / 2 - 70, -h / 2 + 20, w / 2 - 20, -h / 2 + 70);
      C.fillStyle = "#111"; C.font = "700 40px " + G.FONT.sans; C.textAlign = "center"; C.fillText("x", w / 2 - 45, -h / 2 + 43);
      const ix = -w / 2 + 120, iy = -h * 0.04;
      C.fillStyle = "#d80d0d"; C.beginPath(); C.arc(ix, iy, 64, 0, 7); C.fill(); C.strokeStyle = "#7a0000"; C.lineWidth = 4; C.stroke();
      C.strokeStyle = "#fff"; C.lineWidth = 15; C.lineCap = "round"; C.beginPath(); C.moveTo(ix - 28, iy - 28); C.lineTo(ix + 28, iy + 28); C.moveTo(ix + 28, iy - 28); C.lineTo(ix - 28, iy + 28); C.stroke();
      C.fillStyle = "#000"; C.textAlign = "left";
      let fs = o.size || 150; C.font = "700 " + fs + "px " + G.FONT.sans;
      const mw = w - 260; if (C.measureText(msg).width > mw) { fs *= mw / C.measureText(msg).width; C.font = "700 " + fs + "px " + G.FONT.sans; }
      C.fillText(msg, -w / 2 + 215, iy + 4);
      C.fillStyle = "#c3c3c3"; C.fillRect(-100, h / 2 - 118, 200, 76); bev(-100, h / 2 - 118, 100, h / 2 - 42);
      C.strokeStyle = "#000"; C.lineWidth = 2; C.setLineDash([4, 4]); C.strokeRect(-84, h / 2 - 106, 168, 52); C.setLineDash([]);
      C.fillStyle = "#000"; C.font = "400 44px " + G.FONT.sans; C.textAlign = "center"; C.fillText("ok", 0, h / 2 - 79);
    });
  };
  /* a party hat (for a planet's birthday): base centre (x, y), height h */
  G.hat = (x, y, h, rot) => {
    withT({ x: x, y: y, rot: rot || 0 }, () => {
      const w = h * 0.62;
      C.save(); C.beginPath(); C.moveTo(-w / 2, 0); C.lineTo(0, -h); C.lineTo(w / 2, 0); C.quadraticCurveTo(0, h * 0.12, -w / 2, 0); C.closePath(); C.clip();
      const cols = ["#ff3d7f", "#ffe94a", "#2fd9ff", "#3dff7a"];
      for (let i = -6; i < 8; i++) { C.fillStyle = cols[(i + 12) % 4]; C.beginPath(); C.moveTo(-w + i * h * 0.16, 0); C.lineTo(-w + i * h * 0.16 + h * 0.08, 0); C.lineTo(-w + i * h * 0.16 + h * 0.6, -h); C.lineTo(-w + i * h * 0.16 + h * 0.52, -h); C.closePath(); C.fill(); }
      C.restore();
      C.strokeStyle = "#222"; C.lineWidth = h * 0.025; C.beginPath(); C.moveTo(-w / 2, 0); C.lineTo(0, -h); C.lineTo(w / 2, 0); C.quadraticCurveTo(0, h * 0.12, -w / 2, 0); C.stroke();
      C.fillStyle = "#ffffff"; C.beginPath(); C.arc(0, -h, h * 0.09, 0, 7); C.fill(); C.stroke();
    });
  };

  /* a terminal screen painter for the crt / phone: bg colour + lines of VT323 text */
  G.term = (lines, o) => (cx, w, h) => {
    o = o || {};
    cx.fillStyle = o.bg || "#0b1a12"; cx.fillRect(0, 0, w, h);
    cx.fillStyle = o.color || "#5dff8a"; cx.font = (o.size || 64) + "px " + G.FONT.term; cx.textBaseline = "top"; cx.textAlign = o.center ? "center" : "left";
    lines.forEach((l, i) => cx.fillText(l, o.center ? w / 2 : 26, (o.top || 30) + i * (o.size || 64) * 1.05));
    // scanlines
    cx.fillStyle = "rgba(0,0,0,0.18)"; for (let y = 0; y < h; y += 4) cx.fillRect(0, y, w, 2);
  };

  /* ---------- the render loop ---------- */
  let SC = null;
  function scenes() {
    if (SC) return SC;
    SC = window.SCENES.map((s, i) => ({ i, s, t0: G.cue(s.at) })).sort((a, b) => a.t0 - b.t0);
    return SC;
  }
  G.render = (f) => {
    if (!C) { const cv = document.getElementById("c"); C = cv.getContext("2d"); }
    const T = f / G.FPS;
    const list = scenes();
    let cur = list[0];
    for (const s of list) if (s.t0 <= T + 1e-6) cur = s;
    const nxt = list[list.indexOf(cur) + 1];
    C.setTransform(1, 0, 0, 1, 0, 0); C.globalAlpha = 1; C.clearRect(0, 0, W, H); G.boxes = [];
    cur.s.draw(T, T - cur.t0, { start: cur.t0, end: nxt ? nxt.t0 : TL().duration });
    return cur.i;
  };
})();
