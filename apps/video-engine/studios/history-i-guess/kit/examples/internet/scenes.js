/* "history of the internet, i guess" (v3): the planet is the stage, and the words live IN the picture:
   big, lowercase, regular weight, thin colour edges, placed casually over the globe / map / object, one phrase at a time.
   at: "L3" = the line's first word, ["L6", "low"] = that word (as heard, see timeline.json), or seconds. */
const CX = G.CX, CY = G.CY, TOP = G.TOP, BOT = G.BOT;
const TITLE_BG = "#2f2bff", TITLE_FG = "#ffe14d";
const PL = { ucla: [34.07, -118.44], sri: [37.46, -122.18], bbn: [42.39, -71.15], cern: [46.23, 6.05], camb: [52.21, 0.09], sj: [37.33, -121.89], zoo: [32.735, -117.149] };
const W_ = (id, w, n) => G.w(id, w, n);
const TINTS = [[1, 0.42, 0.95, 0.55], [0.35, 0.9, 1, 0.5], [1, 0.95, 0.3, 0.5], [0.4, 1, 0.5, 0.5]];
const term = (lines, o) => G.term(lines, Object.assign({ size: 110, top: 60 }, o || {}));
/* colour edge pairs for the plain text (up-left, down-right) */
const E = [["#ff9a1f", "#1f6bff"], ["#ff4fd8", "#2bd94a"], ["#2fd9ff", "#ff3d7f"], ["#ffe94a", "#8a4dff"]];
/* the plain text: big, in the picture, pops on its word. o: {e: edge pair, rot, style, align, ...} */
function say(T, t0, txt, x, y, size, o) {
  if (T < t0) return;
  o = Object.assign({}, o || {});
  const e = E[o.e || 0]; delete o.e;
  G.text(txt, x, y, Object.assign({ style: "edges", size: size, edges: e, scale: G.pop(T, t0, 0.12), maxw: 1010 }, o));
}

function titleCard(T, t, k) {
  G.bg(TITLE_BG);
  const s = 1 + t * 0.015;
  G.text("history of the", CX, CY - 190, { font: "casual", size: 132, color: TITLE_FG, scale: s });
  G.text("internet", CX, CY - 20, { font: "casual", size: 176, color: TITLE_FG, scale: s });
  G.text("i guess", CX, CY + 160, { font: "casual", size: 132, color: TITLE_FG, scale: s * (k === undefined ? 1 : k), rot: k !== undefined && k < 1.2 ? (1.2 - k) * 8 : 0 });
}
function env(x, y, s, rot) { G.envelope(x, y, s, { rot: rot }); }
/* a beige computer standing on the planet at a place (ground = the place) */
function pcAt(P, place, size, o) { const p = P.pt(place[0], place[1], 0); if (!p.vis) return p; G.prop("crt", p.x + (o && o.dx || 0), p.y - size * 0.42, size, Object.assign({ shadow: 0.9, shadowY: 0.4 }, o || {})); return p; }
function along(pts, k) { const i = Math.min(pts.length - 1, Math.floor(G.clamp(k, 0, 1) * (pts.length - 1))); return pts[i]; }
function openCam(T) {
  return G.fly(T, [[0, { lat: 16, lon: -28, r: 370, cy: CY }], [W_("L1", "two"), { lat: 30, lon: -100, r: 680, cy: CY }], [W_("L1", "california") + 0.22, { lat: 35.8, lon: -120.3, r: 7000, cy: CY + 90 }], [W_("L5", "crashes"), { lat: 35.8, lon: -120.4, r: 7700, cy: CY + 90 }]]);
}
const DARK = { day: 0.13, halo: 0.7, haloFixed: true, haloColor: "125,135,170" };
const darkLon = (T) => -112 - (T - W_("L5", "crashes")) * 3;

window.SCENES = [
  /* ---------- cold open: 1969 ---------- */
  { name: "planet -> california", at: 0, draw: (T, t) => {
      const P = G.globe(T, Object.assign({ hi: "cal", drift: T * 30 }, openCam(T)));
      const t69 = G.L("L1"), ttwo = W_("L1", "two"), tcomp = W_("L1", "computers"), tcal = W_("L1", "california"), tcon = W_("L1", "connected");
      if (T < ttwo) G.text("1969", CX + 20, CY - 10, { style: "emboss", size: 300, edges: E[1], rot: -4, scale: G.pop(T, t69, 0.14) });
      G.dot(P, PL.ucla[0], PL.ucla[1], G.pop(T, ttwo, 0.15), { size: 12 });
      G.dot(P, PL.sri[0], PL.sri[1], G.pop(T, ttwo + 0.06, 0.15), { size: 12 });
      if (G.on(T, tcal)) G.label(P, 36.9, -119.0, "california", G.pop(T, tcal, 0.16), { size: 92, style: "misprint", dy: 0 });
      if (G.on(T, tcomp)) { const k = G.pop(T, tcomp + 0.12, 0.2); pcAt(P, PL.ucla, 300 * k, { ry: -0.55, screen: term(["_"]) }); pcAt(P, PL.sri, 300 * k, { ry: 0.55, screen: term(["_"]) }); }
      if (G.on(T, tcon)) G.arc(P, PL.ucla, PL.sri, G.ease.out(G.prog(T, tcon, 0.3)), { lift: 0.006, width: 10 });
      G.stamp(1969, T, ttwo);
    } },
  { name: "login, L, o", at: "L2", draw: (T, t) => {
      const P = G.globe(T, Object.assign({ hi: "cal" }, openCam(T)));
      G.arc(P, PL.ucla, PL.sri, 1, { lift: 0.006, width: 10 });
      const tl = G.L("L3"), to = G.L("L4");
      const sriScreen = T < tl ? ["_"] : T < to ? ["l_"] : ["lo_"];
      const a = pcAt(P, PL.ucla, 300, { ry: -0.55, screen: term(T < W_("L2", "log") ? ["_"] : ["login_"]) });
      pcAt(P, PL.sri, 300, { ry: 0.55, screen: term(sriScreen) });
      if (G.on(T, W_("L2", "log")) && T < tl) G.bubble(a.x + 120, a.y - 430, 400, 150, "login", { size: 92, tail: [a.x + 40, a.y - 300], font: "term" });
      if (G.on(T, tl)) {
        G.ctx().fillStyle = "rgba(0,0,10,0.45)"; G.ctx().fillRect(0, 0, G.W, G.H);
        const lo = G.on(T, to);
        G.text("l", lo ? CX - 230 : CX, CY - 40, { style: "led", size: 640, glow: "#bfe0ff", color: "#ffffff", scale: G.pop(T, tl, 0.12) });
        if (lo) G.text("o", CX + 230, CY - 40, { style: "led", size: 640, glow: "#ffd0ff", color: "#ffffff", scale: G.pop(T, to, 0.12) });
      }
      G.stamp(1969, T, 0);
    } },
  { name: "CRASH", at: ["L5", "crashes"], draw: (T, t) => {
      const tc = W_("L5", "crashes");
      const sh = t < 0.4 ? Math.sin(t * 95) * 18 * (1 - t / 0.4) : 0;
      const flick = t < 0.16 ? (Math.floor(t * 30) % 2 ? 1 : 0.1) : 0.13;
      G.globe(T, Object.assign({}, DARK, { lat: 30, lon: -112 - t * 3, r: 470, day: flick, cx: CX + sh, cy: CY + 60 + sh * 0.6 }));
      G.errorBox(CX + sh, CY - 10, 960, G.pop(T, tc + 0.05, 0.14), "CRASH", { size: 170 });
      G.stamp(1969, T, 0);
      G.flash(T, tc, "#ffffff", 0.08);
    } },
  { name: "first word: lo", at: "L6", draw: (T, t) => {
      const P = G.globe(T, Object.assign({}, DARK, { lat: 30, lon: darkLon(T), r: 470, cy: CY + 60 }));
      G.dot(P, PL.ucla[0], PL.ucla[1], 1, { size: 9, color: "#ff6060", glow: "#ff0000" });
      const tl = W_("L6", "low");
      say(T, W_("L6", "first"), "the first word", CX - 70, CY - 330, 150, { e: 0, rot: -4 });
      say(T, W_("L6", "internet"), "on the internet", CX + 90, CY + 400, 118, { e: 1, rot: 3 });
      const nd = Math.min(3, Math.floor((T - G.L("L6")) / 0.35));
      if (T < tl && nd > 0) G.text(".".repeat(nd), CX, CY + 40, { style: "led", size: 150, color: "#ffffff", glow: "#bfe0ff" });
      if (G.on(T, tl)) G.text("lo.", CX + 10, CY + 40, { style: "emboss", size: 470, edges: E[1], scale: G.pop(T, tl, 0.2), rot: -3 + Math.sin(T * 2) * 2 });
      G.stamp(1969, T, 0);
    } },
  { name: "great start", at: "L7", draw: (T, t) => {
      const P = G.globe(T, Object.assign({}, DARK, { lat: 30, lon: darkLon(T), r: 470, cy: CY + 60 }));
      G.stander(P, 50, -112, 0.32, { pose: "up", face: "smile", head: "#000" });
      say(T, G.L("L7"), "great start.", CX - 10, CY - 300, 180, { e: 2, rot: -5 });
    } },
  { name: "title", at: TIMELINE.title_start, draw: (T, t) => titleCard(T, t) },

  /* ---------- 1971: the first email (the corner box carries the year) ---------- */
  { name: "1971 -> massachusetts", at: "L8", draw: (T, t) => {
      const ta = W_("L8", "a"), te = W_("L8", "email"), tr = W_("L8", "right");
      const cam = G.fly(T, [[G.L("L8"), { lat: 28, lon: -40, r: 470 }], [ta, { lat: 36, lon: -64, r: 900 }], [ta + 0.5, { lat: 42.2, lon: -71.2, r: 9000 }], [G.L("L9"), { lat: 42.2, lon: -71.2, r: 9600 }]]);
      const P = G.globe(T, Object.assign({ hi: "neus", drift: T * 20 }, cam));
      const d = G.dot(P, PL.bbn[0], PL.bbn[1], G.pop(T, ta + 0.3, 0.15), { size: 12 });
      if (G.on(T, ta + 0.3) && T < tr) G.label(P, PL.bbn[0], PL.bbn[1], "massachusetts", G.pop(T, ta + 0.3, 0.16), { size: 74, dy: 80, style: "misprint" });
      if (G.on(T, te) && T < tr + 0.05) {
        const k = G.ease.io(G.prog(T, te, tr - te));
        const pts = []; for (let i = 0; i <= 80; i++) { const th = (95 - (350 * i) / 80) * Math.PI / 180; pts.push([d.x + 30 + 330 * Math.cos(th), d.y - 290 + 290 * Math.sin(th)]); }
        G.marker(pts, k, { color: "#fff7c2", width: 12, glow: "#ffcf4a" });
        const h = along(pts, k); env(h[0], h[1], 0.8, k * 40);
        say(T, te, "the first email", CX - 20, d.y + 330, 140, { e: 3, rot: -4 });
      }
      if (G.on(T, tr)) {
        const k = G.pop(T, tr, 0.16);
        G.prop("crt", d.x - 150, d.y - 120, 330 * k, { ry: 0.25, screen: term(["mail_"]), shadow: 0.9 });
        G.prop("crt", d.x + 180, d.y - 120, 330 * k, { ry: -0.25, screen: term(["_"]), shadow: 0.9 });
        G.arrow(d.x - 40, d.y + 110, d.x + 90, d.y + 110, G.prog(T, tr + 0.1, 0.2), { color: "#ffffff", width: 12, head: 28, glow: "#000" });
        say(T, tr + 0.1, "(this far)", d.x + 40, d.y + 240, 110, { e: 1, rot: 4 });
      }
      G.stamp(1971, T, G.L("L8"));
    } },
  { name: "forgot", at: "L9", draw: (T, t) => {
      G.globe(T, { lat: 42.2, lon: -71.2 - t * 0.2, r: 9600, hi: "neus", day: 0.45 });
      const tq = W_("L9", "said"), tp = W_("L9", "probably");
      const scr = T < tq ? term(["mail:", "_"]) : T < tp ? term(["mail:", "?"], { color: "#ffb35a" }) : term(["mail:", "qwertyuiop"]);
      G.prop("crt", CX, CY + 150, 880, { ry: Math.sin(T * 0.8) * 0.12, rx: 0.05, screen: scr, shadow: 1 });
      say(T, W_("L9", "forgot"), "he forgot", CX - 170, TOP + 140, 165, { e: 1, rot: -5 });
      say(T, W_("L9", "what"), "what it said", CX + 150, TOP + 300, 110, { e: 0, rot: 3 });
      if (G.on(T, tq) && T < tp) G.text("?", CX + 330, CY - 10, { style: "wordart", size: 300, scale: G.pop(T, tq), rot: 12 });
      say(T, tp, "(probably)", CX + 170, BOT - 70, 110, { e: 3, rot: -4 });
      G.stamp(1971, T, 0);
    } },
  { name: "@", at: "L10", draw: (T, t) => {
      const P = G.globe(T, { lat: 28, lon: -50 - t * 22, r: 470, drift: T * 10 });
      const ta = W_("L10", "ad"), tn = W_("L10", "now"), ty = W_("L10", "your");
      say(T, G.L("L10"), "but he picks", CX - 110, TOP + 150, 150, { e: 0, rot: -5 });
      if (G.on(T, tn)) G.scatter(42, 90).forEach(([la, lo], i) => { G.label(P, la, lo, "@", G.pop(T, tn + (i % 45) * 0.012, 0.12), { size: 54, style: "edges", edges: E[i % 4], dy: 0, shadow: false }); });
      if (G.on(T, ta)) { const s = G.on(T, tn) ? 1 - 0.55 * G.ease.out(G.prog(T, tn, 0.2)) : 1; G.text("@", CX, CY + 20 - (1 - s) * 260, { style: "extrude", size: 600 * s, colors: ["#fff6a8", "#ffb21c"], side: "#a33c00", outline: "#4a1a00", scale: G.pop(T, ta, 0.22), rot: Math.sin(T * 1.6) * 6, depth: Math.round(60 * s) }); }
      say(T, ty, "you@your.email", CX + 10, BOT - 120, 120, { e: 2, rot: -3 });
    } },
  { name: "jingle: e-mail", at: "J1", draw: (T, t) => {
      const st = G.step(T, G.L("J1"), 0.24);
      const P = G.globe(T, { lat: 25, lon: -60 - t * 60, r: 520, tint: TINTS[st % 4], sun: 0.2, drift: T * 40 });
      const cities = [[40.7, -74], [34, -118], [51.5, -0.1], [48.9, 2.35], [35.7, 139.7], [-33.9, 151.2], [-23.5, -46.6], [6.5, 3.4], [19.1, 72.9], [55.75, 37.6], [-33.9, 18.4], [19.4, -99.1], [41.9, -87.6], [52.5, 13.4], [37.6, 127], [30, 31.2], [-34.6, -58.4], [43.7, -79.4], [1.35, 103.8]];
      const r = G.rng(5);
      for (let i = 0; i < 40; i++) {
        const a = cities[Math.floor(r() * cities.length)], b = cities[Math.floor(r() * cities.length)]; if (a === b) continue;
        const t0 = G.L("J1") - 0.2 + r() * 1.7, k = G.prog(T, t0, 0.5);
        if (k <= 0 || k >= 1) continue;
        const head = G.arc(P, a, b, k, { from: Math.max(0, k - 0.35), lift: 0.12, width: 7, color: "#ffffff", glow: "#ff4fd8", head: false });
        if (head && head.vis) env(head.x, head.y, 0.42, 0);
      }
      const n = G.line("J1").notes;
      G.lyric(["eee-", "mail!"], T, G.L("J1") + (n[0] ? n[0][0] : 0.2), n[1] ? n[1][0] - n[0][0] : 0.6, { seed: 4, size: 230, styles: ["wordart", "glow"] });
    } },

  /* ---------- 1983: one language ---------- */
  { name: "1983: one language", at: "L11", draw: (T, t) => {
      const tall = W_("L11", "all"), tone = W_("L11", "one"), tday = W_("L11", "day");
      const P = G.globe(T, G.fly(T, [[G.L("L11"), { lat: 24, lon: -10, r: 430, cy: CY + 60 }], [tall, { lat: 40, lon: -45, r: 600, cy: CY + 60 }]], G.ease.out));
      const same = G.on(T, tone);
      const nodes = G.scatter(83, 26, [28, 50, -124, -72]).concat(G.scatter(84, 18, [40, 58, -8, 28]));
      const cols = ["#ff4fd8", "#ffb35a", "#2fd9ff", "#ffe94a", "#b04dff"];
      if (G.on(T, tall)) nodes.forEach(([la, lo], i) => {
        const k = G.pop(T, tall + i * 0.012, 0.12);
        const blink = !same && Math.floor(T * 8 + i) % 3 === 0;
        G.dot(P, la, lo, k * (blink ? 0.6 : 1), same ? { size: 11, color: "#d6ffe0", glow: "#3dff7a", ring: G.prog(T, tone, 0.5) } : { size: 11, color: cols[i % 5], glow: cols[i % 5] });
      });
      if (!same) say(T, tall, "all the computers", CX + 20, TOP + 150, 130, { e: 1, rot: -3 });
      if (same) G.text("one language", CX + 10, CY - 130, { style: "fuzzy", size: 165, color: "#2bd94a", glow: "#ff6fd8", rot: 4, scale: G.pop(T, tone, 0.14) });
      if (G.on(T, tday)) {
        const k = G.pop(T, tday, 0.16);
        G.withT({ x: CX + 150, y: BOT - 190, scale: k, rot: -4 }, () => {
          const c = G.ctx();
          c.fillStyle = "#ffffff"; G.rrect(c, -170, -120, 340, 240, 20); c.fill();
          c.fillStyle = "#e0182d"; G.rrect(c, -170, -120, 340, 80, 20); c.fill(); c.fillRect(-170, -70, 340, 30);
          c.fillStyle = "#fff"; c.font = "400 50px " + G.FONT.sans; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("jan", 0, -82);
          c.fillStyle = "#111"; c.font = "400 130px " + G.FONT.sans; c.fillText("1", 0, 45);
        });
      }
      G.stamp(1983, T, G.L("L11"));
    } },
  { name: "birthday", at: "L12", draw: (T, t) => {
      const P = G.globe(T, { lat: 30, lon: -40 - t * 8, r: 470, cy: CY + 250, sun: 0.25, drift: T * 6 });
      const tb = W_("L12", "birthday"), tn = W_("L12", "nobody"), tc = W_("L12", "cake");
      say(T, G.L("L12"), "the internet's", CX - 40, TOP + 110, 140, { e: 3, rot: -4 });
      say(T, tb, "birthday", CX - 250, TOP + 270, 150, { e: 0, rot: -6 });
      say(T, W_("L12", "kind"), "(kind of)", CX + 300, TOP + 270, 76, { e: 2, rot: 7 });
      if (G.on(T, tb)) { const k = G.ease.out(G.prog(T, tb, 0.22)); G.hat(P.c.x + 40, P.c.y - P.r * 0.95 - (1 - k) * 500, 260, 10); }
      if (G.on(T, tn)) {
        G.prop("cake", CX + 300, CY + 130, 380 * G.pop(T, tn, 0.16), { rx: 0.35, ry: T * 0.6, flame: T, shadow: 1 });
        if (G.on(T, tc)) G.xmark(CX + 300, CY + 120, 140, G.prog(T, tc, 0.25), { color: "#ff2d2d", width: 22 });
        say(T, tn, "nobody brings cake.", CX - 20, BOT - 100, 110, { e: 1, rot: -3 });
      }
    } },

  /* ---------- 1989: a physics lab ---------- */
  { name: "1989 -> a physics lab -> web", at: "L13", draw: (T, t) => {
      const ta = W_("L13", "a"), tp = W_("L13", "plans"), tw = W_("L13", "worldwide");
      const cam = G.fly(T, [[G.L("L13"), { lat: 30, lon: -20, r: 460 }], [ta, { lat: 40, lon: 0, r: 700 }], [ta + 0.45, { lat: 46.0, lon: 6.05, r: 9000 }], [tp, { lat: 46.0, lon: 6.05, r: 9500 }], [tw, { lat: 38, lon: 4, r: 520 }]]);
      const P = G.globe(T, Object.assign({ hi: "europe", drift: T * 10 }, cam));
      if (G.on(T, ta + 0.3)) {
        G.dot(P, PL.cern[0], PL.cern[1], G.pop(T, ta + 0.3), { size: 12 });
        if (T < tw) { G.label(P, 46.9, 6.05, "a physics lab", G.pop(T, W_("L13", "physics"), 0.16), { size: 80, dy: -30, style: "misprint" }); G.stander(P, PL.cern[0] - 0.3, PL.cern[1] + 0.7, 0.008, { pose: "point", face: "smile" }); }
        if (G.on(T, tp) && T < tw) say(T, tp, "plans a", CX - 200, CY + 300, 120, { e: 0, rot: -4 });
      }
      if (G.on(T, tw)) { G.sphereWeb(P, PL.cern[0], PL.cern[1], G.prog(T, tw, 0.7), { reach: 88 }); G.text("world wide web", CX + 10, TOP + 140, { style: "glow", size: 130, glow: "#2fd9ff", rot: -3, scale: G.pop(T, tw) }); }
      G.stamp(1989, T, G.L("L13"));
    } },
  { name: "vague but exciting", at: "L14", draw: (T, t) => {
      const P = G.globe(T, { lat: 38, lon: 4 - t * 6, r: 520, day: 0.55, drift: T * 6 });
      G.sphereWeb(P, PL.cern[0], PL.cern[1], 1, { reach: 88 });
      G.paper(CX + 30, CY + 140, 820, 880, { rot: -2, title: "a plan", lines: 14 });
      say(T, G.L("L14"), "his boss writes", CX - 120, TOP + 130, 130, { e: 3, rot: -5 });
      [["vague", W_("L14", "vague"), -100], ["but", W_("L14", "but"), 20], ["exciting", W_("L14", "exciting"), 160]].forEach(([wd, tw, dy]) => { if (G.on(T, tw)) G.text(wd, CX + 70, CY + 90 + dy, { font: "casual", size: 150, color: "#e0182d", rot: -8, scale: G.pop(T, tw, 0.12) }); });
      G.stamp(1989, T, 0);
    } },

  /* ---------- 1991: the first website, the coffee pot ---------- */
  { name: "1991 -> first website", at: "L15", draw: (T, t) => {
      const tt = W_("L15", "the"), tw = W_("L15", "websites");
      const cam = G.fly(T, [[G.L("L15"), { lat: 25, lon: -10, r: 460 }], [tt, { lat: 45, lon: 4, r: 1000 }], [tt + 0.4, { lat: 46.3, lon: 6.05, r: 6500 }], [W_("L15", "it's"), { lat: 46.3, lon: 6.05, r: 7000 }]]);
      const P = G.globe(T, Object.assign({ hi: "europe", drift: T * 10 }, cam));
      G.stamp(1991, T, G.L("L15"), { y: TOP + 10, x: G.W - 330 });
      if (T < tt) return;
      const d = G.dot(P, PL.cern[0], PL.cern[1], 1, { size: 12 });
      const k = G.ease.back(G.prog(T, tt + 0.25, 0.3));
      if (k > 0) {
        const w = 860 * k, h = 820 * k, x = G.lerp(d.x, 110, Math.min(k, 1)), y = G.lerp(d.y, CY - 380, Math.min(k, 1));
        const page = (depth) => (c, pw, ph) => {
          c.fillStyle = "#1a0dab"; c.font = "700 " + Math.round(pw * 0.075) + "px " + G.FONT.serif; c.textAlign = "left"; c.textBaseline = "top";
          c.fillText("World Wide Web", pw * 0.06, ph * 0.05);
          c.fillStyle = "#222"; c.font = Math.round(pw * 0.042) + "px " + G.FONT.serif;
          ["The WorldWideWeb (W3) is a", "wide-area hypermedia project.", "Everything there is online", "about W3 is linked from here."].forEach((s, i) => c.fillText(s, pw * 0.06, ph * 0.2 + i * pw * 0.055));
          c.fillStyle = "#1a0dab"; ["What is a website?", "How to make one", "People"].forEach((s, i) => { c.fillText(s, pw * 0.06, ph * 0.45 + i * pw * 0.06); c.fillRect(pw * 0.06, ph * 0.45 + i * pw * 0.06 + pw * 0.047, c.measureText(s).width, 3); });
          if (depth > 0 && G.on(T, tw + (2 - depth) * 0.18)) G.browser(pw * 0.42, ph * 0.5, pw * 0.54, ph * 0.46, page(depth - 1), {});
        };
        if (w > 220) G.browser(x, y, w, h, page(2), { url: "info.cern.ch" });
      }
      say(T, W_("L15", "it's"), "it's about", CX - 200, BOT - 190, 120, { e: 0, rot: -4 });
      say(T, tw, "websites.", CX + 170, BOT - 70, 140, { e: 2, rot: 3 });
    } },
  { name: "coffee pot", at: "L16", draw: (T, t) => {
      const tc = W_("L16", "camera"), te = W_("L16", "empty"), tw = W_("L16", "walks");
      const cam = G.fly(T, [[G.L("L16"), { lat: 46.3, lon: 6.05, r: 7000 }], [G.L("L16") + 0.45, { lat: 51.7, lon: 0.3, r: 9500 }], [te, { lat: 51.7, lon: 0.3, r: 10000 }]]);
      const P = G.globe(T, Object.assign({ hi: "europe" }, cam));
      G.dot(P, PL.camb[0], PL.camb[1], G.pop(T, G.L("L16") + 0.3), { size: 12 });
      G.label(P, 52.75, 0.09, "cambridge", G.pop(T, G.L("L16") + 0.3, 0.16), { size: 80, dy: -20, style: "misprint" });
      if (G.on(T, tc)) {
        const k = G.pop(T, tc, 0.18);
        const lvl = 0.75 * (1 - G.ease.io(G.prog(T, te, 0.35)));
        G.prop("pot", CX + 170, CY + 250, 560 * k, { ry: 0.3 + T * 0.15, coffee: lvl, shadow: 1 });
        G.prop("camera", CX - 250, CY - 110, 400 * k, { ry: 0.75, rx: -0.15, shadow: 0.7, shadowY: 0.47 });
        G.marker([[CX - 150, CY - 90], [CX + 70, CY + 140]], G.prog(T, tc + 0.15, 0.25), { color: "#fff36b", width: 7, glow: "#000" });
        G.marker([[CX - 150, CY - 70], [CX + 60, CY + 450]], G.prog(T, tc + 0.15, 0.25), { color: "#fff36b", width: 7, glow: "#000" });
      }
      if (G.on(T, tw)) { const kx = G.prog(T, tw, 0.45); G.stick(G.lerp(-60, 230, kx), BOT - 40, 1.0, { pose: kx < 1 ? "walk" : "sad", face: G.on(T, te) ? "sad" : "smile", T: T, head: "#000" }); }
      if (G.on(T, te)) G.text("EMPTY", CX + 190, BOT - 60, { style: "shout", size: 130, color: "#ff3d7f", scale: G.pop(T, te), rot: 5 });
      G.stamp(1991, T, 0, { y: TOP + 10, x: G.W - 330 });
    } },
  { name: "first webcam", at: "L17", draw: (T, t) => {
      G.globe(T, { lat: 50, lon: 2 - t * 4, r: 1400, cy: CY + 900, hi: "europe", day: 0.6, drift: T * 6 });
      const live = (c, w, h) => {
        c.fillStyle = "#b8b8b8"; c.fillRect(0, 0, w, h);
        const r = G.rng(Math.floor(T * 10));
        c.fillStyle = "#3a3a3a"; c.fillRect(w * 0.34, h * 0.25, w * 0.32, h * 0.62); c.fillStyle = "#555"; c.fillRect(w * 0.18, h * 0.85, w * 0.64, h * 0.08);
        c.fillStyle = "#2a2a2a"; c.fillRect(w * 0.38, h * 0.55, w * 0.26, h * 0.28);
        c.fillStyle = "#222"; c.fillRect(w * 0.4, h * 0.18, w * 0.22, h * 0.08);
        for (let i = 0; i < 900; i++) { c.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"; c.fillRect(r() * w, r() * h, 6, 6); }
        c.fillStyle = "#ff2a2a"; c.beginPath(); c.arc(40, 40, 16, 0, 7); c.fill(); c.fillStyle = "#fff"; c.font = "40px " + G.FONT.term; c.textBaseline = "middle"; c.textAlign = "left"; c.fillText("LIVE", 66, 42);
      };
      G.prop("crt", CX, CY + 80, 880, { ry: Math.sin(T) * 0.1, screen: live, shadow: 1 });
      const tw = W_("L17", "webcam"), tws = W_("L17", "watches"), ty = W_("L17", "10");
      say(T, W_("L17", "first"), "the first webcam", CX - 20, TOP + 130, 135, { e: 1, rot: -4 });
      if (G.on(T, tws)) {
        if (T < ty) say(T, tws, G.count(T, tws, ty, 0, 3650) + " days", CX + 60, BOT - 110, 120, { e: 2, rot: 2 });
        else G.text("10 years", CX + 60, BOT - 110, { style: "wordart", size: 160, colors: ["#ffffff", "#9fe8ff", "#2f8cff"], outline: "#0b2a5a", rot: 3, scale: G.pop(T, ty, 0.14) });
      }
    } },
  { name: "jingle: dial-up (cables)", at: "J2", draw: (T, t) => {
      const st = G.step(T, G.L("J2"), 0.24);
      const P = G.globe(T, { lat: 28, lon: -38 - t * 10, r: 600, cy: CY - 60, tint: TINTS[(st + 1) % 4], sun: 0.2, drift: T * 20 });
      const cables = [
        [[40.5, -74], [41, -60], [45, -40], [49, -20], [50.1, -5.5]],
        [[38.7, -9.1], [30, -20], [12, -26], [-3.7, -38.5]],
        [[38.7, -9.1], [28, -16], [14.7, -17.5], [5, -8], [6.4, 3.4]],
        [[26, -80], [18, -74], [10.6, -61.5]],
        [[43.3, 5.4], [37.5, 11], [34, 22], [31.2, 29.9]],
        [[34, -120], [26, -140], [21.3, -157.8]],
        [[44.6, -63.6], [50, -45], [53.5, -20], [53.3, -6.3]],
      ];
      cables.forEach((c, i) => G.cable(P, c, G.prog(T, G.L("J2") + i * 0.16, 0.7), { width: 6 }));
      G.prop("modem", CX, BOT - 170, 560, { rx: 0.45, ry: Math.sin(T * 3) * 0.3, leds: T * 3 });
      const n = G.line("J2").notes;
      G.lyric(["diaaal-", "up!"], T, G.L("J2") + (n[0] ? n[0][0] : 0.3), n[1] ? n[1][0] - n[0][0] : 0.5, { seed: 12, size: 220, styles: ["misprint", "wordart"] });
    } },

  /* ---------- the modem era ---------- */
  { name: "modem screams, online", at: "L18", draw: (T, t) => {
      const ts = W_("L18", "screams"), to = W_("L18", "you're");
      const regs = [[40, -97, 26], [50, 10, 18], [-15, -55, 22], [36, 128, 22], [22, 78, 18], [5, 20, 25], [55, 60, 25], [-28, 140, 18]];
      const sh = T > ts && T < to ? Math.sin(T * 70) * 12 : 0;
      G.globe(T, { lat: 32, lon: -55 - t * 10, r: 560, cy: CY - 60 + sh, cx: CX + sh, day: 0.2, sun: 0, night: 1.0, regions: regs.map(([la, lo, d], i) => ({ lat: la, lon: lo, deg: d, k: G.prog(T, to + i * 0.07, 0.2) })), drift: T * 8 });
      G.prop("modem", CX + sh, BOT - 160, 640, { rx: 0.45, ry: -0.3, leds: T * (T > ts ? 4 : 1), shadow: 0.6 });
      if (T < ts) { say(T, G.L("L18"), "everyone", CX - 170, TOP + 150, 160, { e: 0, rot: -5 }); say(T, W_("L18", "modem"), "gets a modem", CX + 110, TOP + 310, 125, { e: 2, rot: 3 }); }
      if (G.on(T, ts) && T < to) G.text("AAAAAAAA", CX + sh, CY - 130, { style: "shout", size: 160, color: "#ff3d7f", maxw: 1000 });
      say(T, to, "you're online.", CX + 20, TOP + 170, 150, { e: 1, rot: -3 });
      G.flash(T, ts, "#ff2d55", 0.07);
    } },
  { name: "phone: you're not", at: "L19", draw: (T, t) => {
      const tp = W_("L19", "picks"), tn = W_("L19", "you're");
      const regs = [[40, -97, 26], [50, 10, 18], [-15, -55, 22], [36, 128, 22], [22, 78, 18], [5, 20, 25], [55, 60, 25], [-28, 140, 18]];
      const off = G.on(T, tn);
      G.globe(T, { lat: 32, lon: -55 - (T - G.L("L18")) * 10, r: 560, cy: CY - 60, day: off ? 0.12 : 0.2, sun: 0, night: off ? 0 : 1, regions: regs.map(([la, lo, d]) => ({ lat: la, lon: lo, deg: d, k: 1 })), drift: T * 8 });
      const up = G.ease.out(G.prog(T, tp, 0.35));
      G.prop("handset", CX + 60, G.lerp(BOT + 300, CY + 330, up), 820, { rx: 0.5, ry: 0.3, rz: 0.15 - up * 0.3 });
      if (!off) { say(T, W_("L19", "someone"), "someone picks up", CX - 10, TOP + 140, 118, { e: 3, rot: -4, maxw: 940 }); say(T, W_("L19", "phone"), "the phone", CX + 170, TOP + 290, 125, { e: 0, rot: 4 }); }
      if (off) { say(T, tn, "you're not.", CX - 10, TOP + 180, 175, { e: 2, rot: -4 }); G.text("lo.", CX, CY - 40, { style: "led", size: 260, color: "#d8d8d8", glow: "#888" }); }
      G.flash(T, tn, "#000000", 0.07);
    } },

  /* ---------- 1995: a broken laser pointer ---------- */
  { name: "1995 (LED on blue) -> broken laser pointer", at: "L20", draw: (T, t) => {
      const ts = W_("L20", "someone"), tb = W_("L20", "broken");
      if (T < ts) { G.bg("#1f6bff"); G.text("1995", CX, CY, { style: "led", size: 340, color: "#ffffff", glow: "#bfe0ff" }); return; }
      const cam = G.fly(T, [[ts, { lat: 33, lon: -110, r: 800 }], [ts + 0.4, { lat: 37.0, lon: -121.6, r: 8500 }], [G.L("L21"), { lat: 37.0, lon: -121.6, r: 9000 }]]);
      const P = G.globe(T, Object.assign({ hi: "cal", drift: T * 10 }, cam));
      const d = G.dot(P, PL.sj[0], PL.sj[1], G.pop(T, ts + 0.3), { size: 12 });
      G.label(P, 36.2, -120.6, "california (again)", G.pop(T, W_("L20", "sells"), 0.16), { size: 66, dy: 0, style: "misprint" });
      const k = G.pop(T, ts + 0.32, 0.18);
      if (k > 0) {
        const lx = CX + 300, ly = TOP + 210, sz = 760;
        const beamOn = T < tb ? true : (Math.floor(T * 22) % 4 === 0);
        if (beamOn && k >= 0.99) { const c = G.ctx(); c.save(); c.strokeStyle = "#ff2020"; c.lineWidth = 8; c.shadowColor = "#ff0000"; c.shadowBlur = 26; c.beginPath(); c.moveTo(lx - 0.315 * sz, ly + 0.215 * sz); c.lineTo(d.x, d.y); c.stroke(); c.fillStyle = "#ffe0e0"; c.beginPath(); c.arc(d.x, d.y, 14, 0, 7); c.fill(); c.restore(); }
        G.prop("laser", lx, ly, sz * k, { rz: -0.6, ry: Math.PI, rx: 0.15 });
      }
      if (G.on(T, tb)) {
        const kb = G.pop(T, tb, 0.14);
        G.withT({ x: CX, y: BOT - 170, rot: -10, scale: kb }, () => { const c = G.ctx(); c.strokeStyle = "#ff1a3d"; c.lineWidth = 12; c.strokeRect(-270, -90, 540, 180); });
        G.text("broken", CX, BOT - 170, { size: 140, color: "#ff1a3d", rot: -10, scale: kb });
      }
      G.stamp(1995, T, ts, { y: TOP + 10 });
    } },
  { name: "collector", at: "L21", draw: (T, t) => {
      G.globe(T, { lat: 37.0, lon: -121.6 - t * 0.3, r: 9000, hi: "cal", day: 0.4 });
      const ts = W_("L21", "buys"), tc = W_("L21", "collects"), ta = W_("L21", "apparently");
      if (G.on(T, ts) && T < tc) G.text("sold!", CX, CY, { style: "wordart", size: 300, scale: G.pop(T, ts), rot: -6 });
      if (G.on(T, tc)) {
        const img = G.propImg("laser", { rz: 0.12, ry: 0.3, rx: 0.55 });
        const c = G.ctx();
        for (let row = 0; row < 3; row++) {
          const y = CY - 300 + row * 250;
          c.fillStyle = "#6b4423"; c.fillRect(110, y + 60, 860, 30); c.fillStyle = "#4a2d15"; c.fillRect(110, y + 90, 860, 10);
          for (let i = 0; i < 5; i++) { const k = G.pop(T, tc + (row * 5 + i) * 0.025, 0.12); if (k > 0) c.drawImage(img, 215 + i * 165 - 150 * k, y + 10 - 150 * k, 300 * k, 300 * k); }
        }
        G.stick(CX, BOT - 30, 1.15, { pose: "up", head: "#000", face: "smile" });
        say(T, tc, "he collects them", CX - 30, TOP + 120, 135, { e: 1, rot: -4 });
      }
      say(T, ta, "(apparently)", CX + 200, TOP + 260, 90, { e: 3, rot: 6 });
      G.stamp(1995, T, 0, { x: G.W - 330 });
    } },

  /* ---------- 2000: the bubble ---------- */
  { name: "2000 (WordArt) -> bubble around the planet", at: "L22", draw: (T, t) => {
      const te = W_("L22", "everyone"), tp = W_("L22", "pops");
      const P = G.globe(T, { lat: 25, lon: -60 - t * 12, r: T < te ? 420 : 340, sun: 0.25, drift: T * 8 });
      if (T < te) { G.text("2000", CX, CY, { style: "wordart", size: 300, colors: ["#c8ff9a", "#29e06a", "#0b8a3a"], outline: "#073a1a", rot: -4, scale: G.pop(T, G.L("L22"), 0.14) }); return; }
      if (T < tp) {
        G.scatter(2000, 40).forEach(([la, lo], i) => G.label(P, la, lo, ".com", G.pop(T, W_("L22", "websites") + i * 0.01, 0.12), { size: 40, style: "edges", edges: E[i % 4], dy: 0 }));
        G.bills(T, W_("L22", "throws"), CX, CY, 18, 3);
        const k = G.ease.io(G.prog(T, te, tp - te));
        G.prop("bubble", CX, CY, 340 * 2.2 * (1 + k * 0.32) * 1.42, { film: T });
        say(T, te, "everyone", CX - 230, TOP + 120, 140, { e: 0, rot: -6 });
        say(T, W_("L22", "throws"), "throws money", CX + 140, TOP + 270, 120, { e: 2, rot: 3 });
        say(T, W_("L22", "websites"), "at websites", CX - 120, BOT - 120, 125, { e: 1, rot: -3 });
      } else {
        G.burst(CX, CY, T, tp, { n: 46, r: 700 });
        say(T, tp, "pop.", CX + 20, CY - 20, 300, { e: 3, rot: -6 });
      }
      G.stamp(2000, T, te, { y: TOP + 10, x: G.W - 330 });
      G.flash(T, tp, "#ffffff", 0.08);
    } },

  /* ---------- 2005: the zoo video, a little card on the map ---------- */
  { name: "2005 -> zoo card on the map", at: "L23", draw: (T, t) => {
      const tt = W_("L23", "the"), tv = W_("L23", "video"), t19 = W_("L23", "19"), tz = W_("L23", "zoo"), te = W_("L24", "elephants"), ts = W_("L24", "still");
      const cam = G.fly(T, [[G.L("L23"), { lat: 26, lon: -85, r: 440 }], [tt, { lat: 30, lon: -108, r: 900 }], [tt + 0.45, { lat: 33.15, lon: -117.3, r: 9500 }], [ts, { lat: 33.15, lon: -117.3, r: 10800 }], [G.L("L25") + 0.02, { lat: 22, lon: -95, r: 470, cy: CY + 40 }]]);
      const P = G.globe(T, Object.assign({ hi: "cal", drift: T * 10 }, cam));
      const d = G.dot(P, PL.zoo[0], PL.zoo[1], G.pop(T, tt + 0.3), { size: 12 });
      // the little player, pinned to the zoo on the map
      const kp = G.ease.back(G.prog(T, tv, 0.3)), shrink = G.on(T, ts) ? 1 - 0.75 * G.ease.in(G.prog(T, ts, G.L("L25") - ts)) : 1;
      if (kp > 0 && d.vis) {
        const zoom = 0.5 * kp * shrink, cy = d.y - 260 * zoom / 0.5;
        G.marker([[d.x, d.y], [d.x, cy + 330 * zoom]], 1, { color: "#ffffff", width: 6 });
        zooPlayer(T, zoom, tv, d.x, cy - 40 * zoom, t19);
        if (G.on(T, te) && T < ts) G.bubble(d.x - 110, cy - 330 * zoom - 90, 430, 120, "long trunks!", { size: 66, tail: [d.x - 60, cy - 200 * zoom] });
      }
      if (G.on(T, tz) && T < ts) G.label(P, PL.zoo[0], PL.zoo[1], "a zoo", G.pop(T, tz, 0.16), { size: 72, dy: 70, style: "misprint" });
      if (T < te) say(T, t19, "19 seconds", CX + 150, BOT - 150, 120, { e: 0, rot: -4 });
      if (G.on(T, ts)) {
        say(T, ts, "it's still up.", CX + 80, CY + 230, 150, { e: 2, rot: -4 });
        say(T, ts + 0.05, "views: " + (T < ts + 0.4 ? G.count(T, ts, ts + 0.4, 19, 400000000) : "a lot"), CX, BOT - 250, 100, { e: 1, rot: 2 });
      }
      G.stamp(2005, T, G.L("L23"));
    } },

  /* ---------- phones, cats, computers that talk ---------- */
  { name: "phones: everyone online", at: "L25", draw: (T, t) => {
      const tph = W_("L25", "phones"), tn = W_("L25", "nobody"), t1 = tph + 0.95;
      const regs = [[40, -97, 30], [50, 10, 24], [-15, -55, 26], [36, 120, 26], [22, 78, 22], [5, 20, 30], [55, 60, 30], [-28, 140, 20]];
      const P = G.globe(T, { lat: 22, lon: -95 - t * 20, r: 470, cy: CY + 40, day: 0.22, sun: 0, night: 1.1, regions: regs.map(([la, lo, d], i) => ({ lat: la, lon: lo, deg: d * G.lerp(0.4, 1.4, G.prog(T, tph, 0.9)), k: G.prog(T, tph + i * 0.06, 0.3) })), drift: T * 8 });
      say(T, G.L("L25"), "people online", CX - 120, TOP + 80, 96, { e: 0, rot: -3 });
      G.text(G.count(T, tph, t1, 1000000000, 5500000000), CX, TOP + 210, { style: "led", size: 120, color: "#ffffff", glow: "#7fd8ff", maxw: 1000 });
      G.text(T < tph ? "2005" : T < t1 ? "2005 → 2024" : "2024", CX + 200, TOP + 320, { style: "edges", size: 64, edges: E[2], rot: 3 });
      if (T < tn) {
        const feed = (c, w, h) => { c.fillStyle = "#111"; c.fillRect(0, 0, w, h); const off = (T * 300) % 200; for (let i = -1; i < 6; i++) { c.fillStyle = ["#ff4fd8", "#2fd9ff", "#ffe94a", "#3dff7a"][(i + 8) % 4]; G.rrect(c, 24, i * 200 + off + 24, w - 48, 170, 20); c.fill(); } };
        G.prop("phone", CX + 230, BOT - 260, 560 * G.pop(T, tph, 0.18), { ry: -0.45 + Math.sin(T * 1.3) * 0.2, rx: 0.12, rz: 0.12, screen: feed });
      } else {
        for (let i = 0; i < 16; i++) {
          const la = -50 + (i % 8) * 14 + (i > 7 ? 7 : 0), lo = -95 - t * 20 + (i > 7 ? 38 : -38) + ((i * 13) % 20) - 10;
          const u = G.stander(P, la, lo, 0.17, { pose: "hold", head: "#000", face: "none" });
          if (u && u.vis) G.onGlobe(P, la, lo, 0.17, (c, s) => { c.fillStyle = "#cff6ff"; c.shadowColor = "#bff4ff"; c.shadowBlur = 16; c.fillRect(-s * 0.045, -s * 0.6, s * 0.09, s * 0.06); });
        }
        say(T, tn, "nobody looks up", CX - 50, BOT - 200, 125, { e: 1, rot: -3 });
        say(T, W_("L25", "again"), "again.", CX + 260, BOT - 70, 120, { e: 3, rot: 4 });
      }
    } },
  { name: "jingle: cats", at: "J3", draw: (T, t) => {
      const st = G.step(T, G.L("J3"), 0.22);
      const P = G.globe(T, { lat: 20, lon: -95 - (T - G.L("L25")) * 20, r: 470, cy: CY + 40, tint: TINTS[(st + 2) % 4], sun: 0.15, drift: T * 30 });
      const cols = ["#ff9a3c", "#ffffff", "#7a7a86", "#222222", "#f2c48a"];
      G.scatter(31, 160).forEach(([la, lo], i) => {
        const k = G.pop(T, G.L("J3") + i * 0.009, 0.12); if (k <= 0) return;
        G.onGlobe(P, la, lo, 0.13, (c, s) => { const sc = (s / 170) * k * (0.8 + (i % 5) * 0.1); G.cat(0, -64 * sc, sc, cols[i % 5], (i % 7 - 3) * 6); });
      });
      const r = G.rng(33);
      for (let i = 0; i < 10; i++) { const x = r() * G.W, sp = 700 + r() * 700, d = r() * 1.2 - 0.7, y = (t - d) * sp - 150; if (y > -200) G.cat(x, y, 0.7 + r() * 0.5, cols[i % 5], (r() - 0.5) * 50 + t * 60); }
      const n = G.line("J3").notes;
      G.lyric(["caaats!"], T, G.L("J3") + (n[0] ? n[0][0] : 0.4), 0.5, { seed: 31, size: 300, styles: ["wordart"] });
    } },
  { name: "talk back", at: "L26", draw: (T, t) => {
      G.globe(T, { lat: 22, lon: -60 - t * 6, r: 2000, cy: CY + 1250, day: 0.25, night: 1, sun: 0, drift: T * 4 });
      const tt = W_("L26", "talk");
      G.prop("crt", CX, CY + 110, 860, { ry: Math.sin(T * 0.9) * 0.1, screen: G.on(T, tt) ? term(["hi."], { size: 200, center: true, top: 140 }) : term(["_"]), shadow: 1 });
      say(T, W_("L26", "computers"), "computers", CX - 180, TOP + 120, 130, { e: 0, rot: -5 });
      if (G.on(T, tt)) G.text("talk back", CX + 120, TOP + 270, { style: "misprint", size: 165, rot: 3, scale: G.pop(T, tt) });
    } },
  { name: "the prompt", at: "L27", draw: (T, t) => {
      G.globe(T, { lat: 22, lon: -60 - (T - G.L("L26")) * 6, r: 2000, cy: CY + 1250, day: 0.25, night: 1, sun: 0, drift: T * 4 });
      const parts = [["ask", "> make a video"], ["about", "  about the"], ["history", "  history of"], ["internet", "  the internet"]];
      const lines = []; parts.forEach(([w, s]) => { if (G.on(T, W_("L27", w))) lines.push(s); });
      if (Math.floor(T * 3) % 2) lines.push("_");
      G.prop("crt", CX, CY + 120, 1000, { ry: -0.06, screen: G.term(lines, { size: 60, top: 40 }), shadow: 1 });
      say(T, G.L("L27"), "so you ask one", CX - 60, TOP + 130, 140, { e: 1, rot: -4 });
    } },
  { name: "this one", at: "L28", draw: (T, t) => {
      G.space(99, T * 4);
      const k = G.ease.in(G.prog(T, G.L("L28"), W_("L28", "one") - G.L("L28")));
      const card = (c, w, h) => { c.fillStyle = TITLE_BG; c.fillRect(0, 0, w, h); c.fillStyle = TITLE_FG; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "700 60px " + G.FONT.casual; c.fillText("history of the", w / 2, h * 0.3); c.font = "700 84px " + G.FONT.casual; c.fillText("internet", w / 2, h * 0.52); c.font = "700 60px " + G.FONT.casual; c.fillText("i guess", w / 2, h * 0.74); };
      G.prop("crt", CX, CY + 60 - k * 60, 1040 + k * 1700, { screen: card });
    } },
  { name: "end card", at: ["L28", "one"], draw: (T, t) => titleCard(T, t, G.pop(T, W_("L28", "guess"), 0.25)) },
];

/* the zoo video player (drawn): a fence, an elephant, a guy; zoom = size, centred at (x, y) */
function zooPlayer(T, zoom, t0, x0, y0, t19) {
  const w = 900 * zoom, h = 640 * zoom, x = x0 - w / 2, y = y0 - h / 2;
  const c = G.ctx();
  c.save(); c.fillStyle = "rgba(0,0,0,0.5)"; c.fillRect(x + 12, y + 16, w, h + 90 * zoom); c.restore();
  c.save(); c.fillStyle = "#ffffff"; c.fillRect(x - 6, y - 6, w + 12, h + 90 * zoom + 12); c.restore();
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.fillStyle = "#8fd3ff"; c.fillRect(x, y, w, h);
  c.fillStyle = "#79c25a"; c.fillRect(x, y + h * 0.66, w, h * 0.34);
  c.fillStyle = "#c9a26b"; c.fillRect(x, y + h * 0.6, w, h * 0.08);
  G.elephant(x + w * 0.62, y + h * 0.78, 0.95 * zoom, T);
  G.stick(x + w * 0.2, y + h * 0.95, 1.15 * zoom, { pose: "point", head: "#8fd3ff", color: "#222", face: "smile" });
  c.restore();
  c.fillStyle = "#111"; c.fillRect(x, y + h, w, 90 * zoom);
  const p = G.clamp((T - t0) / 4.5, 0, 1);
  c.fillStyle = "#555"; c.fillRect(x + 130 * zoom, y + h + 40 * zoom, w - 300 * zoom, 10 * zoom); c.fillStyle = "#ff2d2d"; c.fillRect(x + 130 * zoom, y + h + 40 * zoom, (w - 300 * zoom) * p, 10 * zoom);
  c.fillStyle = "#fff"; c.beginPath(); c.moveTo(x + 40 * zoom, y + h + 20 * zoom); c.lineTo(x + 90 * zoom, y + h + 45 * zoom); c.lineTo(x + 40 * zoom, y + h + 70 * zoom); c.closePath(); c.fill();
  const sec = Math.floor(p * 19);
  if (zoom > 0.3) G.text("0:" + String(sec).padStart(2, "0") + " / 0:19", x + w - 90 * zoom, y + h + 45 * zoom, { size: 40 * zoom, style: T >= t19 ? "glow" : "plain", glow: "#ff2d6f" });
}
