/* "history of coffee, i guess": every scene, timed to the words in build/timeline.json. */
const CX = G.CX, CY = G.CY, TOP = G.TOP, BOT = G.BOT;
const TITLE_BG = "#2f2bff", TITLE_FG = "#ffe14d";
const W_ = (id, w, n) => G.w(id, w, n);
const LINES = TIMELINE.lines.map((l) => l.id), LAST = LINES[LINES.length - 1];
const PL = { kaffa: [7.3, 36.2], yemen: [15.37, 44.19], mecca: [21.42, 39.83], cairo: [30.04, 31.24], london: [51.513, -0.087] };
const E = [["#ff9a1f", "#1f6bff"], ["#ff4fd8", "#2bd94a"], ["#2fd9ff", "#ff3d7f"], ["#ffe94a", "#8a4dff"]];
const TINTS = [[1, 0.42, 0.95, 0.55], [0.35, 0.9, 1, 0.5], [1, 0.95, 0.3, 0.5], [0.4, 1, 0.5, 0.5]];
function say(T, t0, txt, x, y, size, o) {
  if (T < t0) return;
  o = Object.assign({}, o || {}); const e = E[o.e || 0]; delete o.e;
  G.text(txt, x, y, Object.assign({ style: "edges", size: size, edges: e, scale: G.pop(T, t0, 0.12), maxw: 1010 }, o));
}
function titleCard(T, t, k) {
  G.bg(TITLE_BG);
  const m = TIMELINE.title.match(/^(history of(?: the)?)\s+(.+?),\s*i guess$/i) || [null, "history of", TIMELINE.title];
  const s = 1 + t * 0.015;
  G.text(m[1], CX, CY - 190, { font: "casual", size: 132, color: TITLE_FG, scale: s, maxw: 980 });
  G.text(m[2], CX, CY - 20, { font: "casual", size: 176, color: TITLE_FG, scale: s, maxw: 980 });
  G.text("i guess", CX, CY + 160, { font: "casual", size: 132, color: TITLE_FG, scale: s * (k === undefined ? 1 : k), rot: k !== undefined && k < 1.2 ? (1.2 - k) * 8 : 0 });
}
/* a little white goat (a 2D gag), standing on (0, 0), facing right; dance = 0..1 */
function goat(c, s, T, dance) {
  const hop = dance ? Math.abs(Math.sin(T * 9)) * 30 * s : 0, tilt = dance ? Math.sin(T * 9) * 0.22 : 0;
  c.save(); c.translate(0, -hop); c.rotate(tilt); c.scale(s, s);
  c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = 9; c.strokeStyle = "#2a2a30"; c.fillStyle = "#f4f1ea";
  [[-46, 1], [-26, -1], [26, 1], [46, -1]].forEach(([x, d]) => { c.beginPath(); c.moveTo(x, -78); c.lineTo(x + (dance ? d * 16 * Math.sin(T * 9) : 0), 0); c.stroke(); });
  c.lineWidth = 6;
  c.beginPath(); c.ellipse(0, -100, 66, 36, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-62, -112); c.lineTo(-84, -136); c.stroke();
  c.beginPath(); c.moveTo(50, -118); c.lineTo(78, -168); c.stroke();
  c.beginPath(); c.ellipse(92, -182, 40, 30, -0.35, 0, 7); c.fill(); c.stroke();
  c.lineWidth = 8; c.beginPath(); c.moveTo(78, -206); c.quadraticCurveTo(60, -262, 32, -250); c.moveTo(96, -210); c.quadraticCurveTo(92, -268, 64, -262); c.stroke();
  c.lineWidth = 6; c.fillStyle = "#f4f1ea"; c.beginPath(); c.ellipse(62, -196, 16, 9, 0.6, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#2a2a30"; c.beginPath(); c.arc(102, -190, 6, 0, 7); c.fill();
  c.beginPath(); c.moveTo(112, -160); c.lineTo(104, -124); c.lineTo(122, -156); c.closePath(); c.fill();
  c.restore();
}
/* a cluster of red coffee berries on a twig */
function berries(c, s) {
  c.save(); c.scale(s, s); c.strokeStyle = "#3b5a1e"; c.lineWidth = 6; c.beginPath(); c.moveTo(-40, 0); c.lineTo(40, -70); c.stroke();
  [[0, -30], [16, -44], [-10, -16], [26, -60], [8, -14]].forEach(([x, y], i) => { c.fillStyle = i % 2 ? "#c81e2c" : "#e8323f"; c.beginPath(); c.arc(x, y, 13, 0, 7); c.fill(); c.fillStyle = "rgba(255,255,255,0.6)"; c.beginPath(); c.arc(x - 4, y - 4, 4, 0, 7); c.fill(); });
  c.fillStyle = "#3f8a2a"; c.beginPath(); c.ellipse(-22, -24, 22, 9, -0.6, 0, 7); c.ellipse(34, -40, 22, 9, 0.8, 0, 7); c.fill();
  c.restore();
}
const openCam = (T) => G.fly(T, [[0, { lat: 6, lon: 12, r: 370 }], [W_("L1", "ethiopia"), { lat: 7, lon: 30, r: 700 }], [W_("L1", "ethiopia") + 0.45, { lat: 7.9, lon: 36.2, r: 7200 }], [G.L("L3"), { lat: 7.9, lon: 36.2, r: 7800 }]]);

window.SCENES = [
  /* cold open: the planet, a dive to the wild coffee, a dancing goat */
  { name: "ethiopia, the goat", at: 0, draw: (T, t) => {
      const P = G.globe(T, Object.assign({ hi: "redsea", drift: T * 30 }, openCam(T)));
      const tl = W_("L1", "legend"), tg = W_("L1", "goat"), td = W_("L1", "dancing");
      if (T < W_("L1", "ethiopia")) G.text("coffee", CX + 10, CY - 20, { style: "emboss", size: 280, edges: E[1], rot: -4, scale: G.pop(T, G.L("L1"), 0.14) });
      if (G.on(T, W_("L1", "wild"))) {
        G.label(P, 10.1, 36.2, "ethiopia", G.pop(T, W_("L1", "ethiopia"), 0.16), { size: 86, style: "misprint", dy: 0 });
        G.onGlobe(P, PL.kaffa[0] + 0.35, PL.kaffa[1] + 0.7, 0.04, (c, s) => berries(c, (s / 120) * G.pop(T, W_("L1", "wild"), 0.16)));
      }
      say(T, tl, "legend says", CX - 40, TOP + 150, 140, { e: 0, rot: -5 });
      if (G.on(T, tg)) G.onGlobe(P, PL.kaffa[0] - 1.0, PL.kaffa[1] - 0.4, 0.05, (c, s) => goat(c, (s / 230) * G.pop(T, tg, 0.16), T, G.on(T, td)));
      if (G.on(T, td)) { G.text("♪", CX + 300, CY - 40 + Math.sin(T * 8) * 20, { style: "glow", size: 160, glow: "#ff4fd8", rot: 10 }); say(T, td, "dancing", CX + 170, BOT - 120, 150, { e: 1, rot: 4 }); }
    } },
  { name: "nobody asked the goat", at: "L2", draw: (T, t) => {
      const P = G.globe(T, Object.assign({ hi: "redsea" }, openCam(T)));
      G.label(P, 10.1, 36.2, "ethiopia", 1, { size: 86, style: "misprint", dy: 0 });
      G.onGlobe(P, PL.kaffa[0] + 0.35, PL.kaffa[1] + 0.7, 0.04, (c, s) => berries(c, s / 120));
      G.onGlobe(P, PL.kaffa[0] - 1.0, PL.kaffa[1] - 0.4, 0.05, (c, s) => goat(c, s / 230, T, true));
      say(T, G.L("L2"), "nobody asked", CX - 30, TOP + 150, 145, { e: 2, rot: -5 });
      say(T, W_("L2", "goat"), "the goat.", CX + 180, TOP + 320, 150, { e: 3, rot: 4 });
    } },
  { name: "title", at: TIMELINE.title_start, draw: (T, t) => titleCard(T, t) },

  /* the fourteen hundreds: yemen, all night */
  { name: "1400s yemen", at: "L3", draw: (T, t) => {
      const tn = W_("L3", "awake"), ty = W_("L3", "yemen");
      const night = G.ease.io(G.prog(T, tn, 0.4));
      const cam = G.fly(T, [[G.L("L3"), { lat: 11, lon: 39, r: 1600 }], [G.L("L3") + 0.5, { lat: 14.6, lon: 44.2, r: 7000 }], [G.L("J1"), { lat: 14.6, lon: 44.2, r: 7600 }]]);
      const P = G.globe(T, Object.assign({ hi: "redsea", day: 1 - night * 0.8, night: night * 1.2, sun: 0 }, cam));
      G.label(P, PL.yemen[0] + 0.6, PL.yemen[1], "yemen", G.pop(T, ty, 0.16), { size: 86, style: "misprint", dy: 0 });
      if (G.on(T, W_("L3", "drink"))) [[-0.5, -0.9], [-0.2, 0.2], [-0.6, 1.0]].forEach(([dl, dn], i) => {
        G.stander(P, PL.yemen[0] + dl - 0.5, PL.yemen[1] + dn, 0.02, { pose: "hold", head: "#000", face: G.on(T, tn) ? "shock" : "smile" });
        G.onGlobe(P, PL.yemen[0] + dl - 0.5, PL.yemen[1] + dn, 0.02, (c, s) => { c.fillStyle = "#f4efe6"; c.strokeStyle = "#5a3a1a"; c.lineWidth = 3; c.fillRect(-s * 0.07, -s * 0.66, s * 0.14, s * 0.12); c.strokeRect(-s * 0.07, -s * 0.66, s * 0.14, s * 0.12); });
      });
      say(T, tn, "stay awake", CX - 150, TOP + 160, 160, { e: 1, rot: -5 });
      say(T, W_("L3", "night"), "all night.", CX + 170, BOT - 140, 150, { e: 0, rot: 4 });
      G.stamp("1400s", T, G.L("L3"), { w: 300 });
    } },
  { name: "jingle: coffee!", at: "J1", draw: (T, t) => {
      const st = G.step(T, G.L("J1"), 0.24);
      G.globe(T, { lat: 18, lon: 30 - t * 60, r: 520, cy: CY - 80, tint: TINTS[st % 4], sun: 0.2, drift: T * 40 });
      G.prop("pot", CX, BOT - 210, 520, { ry: T * 2.2, coffee: 0.7, shadow: 0.6 });
      const n = G.line("J1").notes;
      G.lyric(["cooo-", "feeeee!"], T, G.L("J1") + (n[0] ? n[0][0] : 0.2), 0.45, { seed: 7, size: 190, styles: ["wordart", "glow"] });
    } },

  /* fifteen eleven: mecca bans it; cairo says no */
  { name: "1511 mecca bans it", at: "L4", draw: (T, t) => {
      const tb = W_("L4", "bans");
      const cam = G.fly(T, [[G.L("L4"), { lat: 18, lon: 40, r: 1400 }], [G.L("L4") + 0.45, { lat: 20.8, lon: 39.9, r: 7000 }]]);
      const P = G.globe(T, Object.assign({ hi: "redsea", drift: T * 10 }, cam));
      const d = G.dot(P, PL.mecca[0], PL.mecca[1], G.pop(T, G.L("L4") + 0.4), { size: 12 });
      G.label(P, PL.mecca[0] + 0.55, PL.mecca[1], "mecca", G.pop(T, G.L("L4") + 0.4, 0.16), { size: 86, style: "misprint", dy: 0 });
      if (G.on(T, G.L("L4") + 0.45)) G.prop("pot", d.x + 20, d.y + 180, 380, { ry: 0.4, coffee: 0.7, shadow: 0.8 });
      if (G.on(T, tb)) { G.xmark(d.x + 20, d.y + 170, 170, G.prog(T, tb, 0.25), { color: "#ff2d2d", width: 26 }); G.text("BANNED", CX - 10, TOP + 170, { style: "shout", size: 170, color: "#ff3d7f", rot: -6, scale: G.pop(T, tb, 0.12) }); }
      G.stamp(1511, T, G.L("L4"));
      G.flash(T, tb, "#ffffff", 0.07);
    } },
  { name: "cairo says no", at: "L5", draw: (T, t) => {
      const tc = W_("L5", "cairo"), tno = W_("L5", "no"), tov = W_("L5", "over");
      const cam = G.fly(T, [[G.L("L5"), { lat: 21.2, lon: 39.9, r: 7000 }], [G.L("L5") + 0.4, { lat: 25.8, lon: 35.6, r: 2600 }]]);
      const P = G.globe(T, Object.assign({ hi: "redsea", drift: T * 10 }, cam));
      const m = G.dot(P, PL.mecca[0], PL.mecca[1], 1, { size: 11 });
      G.label(P, PL.mecca[0] + 1.3, PL.mecca[1] + 0.8, "mecca", 1, { size: 70, style: "misprint", dy: 0 });
      G.dot(P, PL.cairo[0], PL.cairo[1], G.pop(T, tc, 0.15), { size: 12 });
      G.label(P, PL.cairo[0] + 1.6, PL.cairo[1], "cairo", G.pop(T, tc, 0.16), { size: 80, style: "misprint", dy: 0 });
      say(T, G.L("L5"), "the sultan", CX - 200, TOP + 140, 140, { e: 3, rot: -5 });
      if (G.on(T, W_("L5", "says"))) G.arc(P, PL.cairo, PL.mecca, G.ease.out(G.prog(T, W_("L5", "says"), 0.3)), { lift: 0.04, width: 9, glow: "#2fd9ff" });
      if (T < tov) G.xmark(m.x + 10, m.y + 60, 70, 1, { color: "#ff2d2d", width: 16 });
      say(T, tno, "no.", CX + 230, CY - 60, 240, { e: 1, rot: 6 });
      if (G.on(T, tov)) G.text("ban over.", CX - 40, BOT - 130, { style: "fuzzy", size: 170, color: "#2bd94a", glow: "#ff6fd8", rot: -4, scale: G.pop(T, tov, 0.14) });
      G.stamp(1511, T, 0, { x: G.W - 330, y: TOP + 10 });
    } },

  /* sixteen fifty two: london */
  { name: "1652 london", at: "L6", draw: (T, t) => {
      const th = W_("L6", "house");
      const cam = G.fly(T, [[G.L("L6"), { lat: 32, lon: 25, r: 600 }], [G.L("L6") + 0.55, { lat: 51.2, lon: -0.1, r: 9000 }], [G.L("L7"), { lat: 51.2, lon: -0.1, r: 9600 }]]);
      const P = G.globe(T, Object.assign({ hi: "europe", drift: T * 10 }, cam));
      const d = G.dot(P, PL.london[0], PL.london[1], G.pop(T, G.L("L6") + 0.5), { size: 12 });
      G.label(P, PL.london[0] + 0.45, PL.london[1], "london", G.pop(T, G.L("L6") + 0.5, 0.16), { size: 86, style: "misprint", dy: 0 });
      if (G.on(T, W_("L6", "coffee"))) {
        G.prop("pot", d.x + 40, d.y + 150, 380 * G.pop(T, W_("L6", "coffee"), 0.16), { ry: T * 0.6, coffee: 0.7, shadow: 0.9 });
        for (let i = 0; i < 5; i++) { const k = G.pop(T, th + i * 0.06, 0.14); if (k > 0) G.stick(d.x - 260 + i * 120 + (i > 1 ? 160 : 0), d.y + 380, 0.6 * k, { pose: i % 2 ? "up" : "point", head: "#000", face: "smile" }); }
      }
      say(T, th, "a coffee house", CX - 40, TOP + 160, 150, { e: 2, rot: -4 });
      G.stamp(1652, T, G.L("L6"));
    } },
  /* now: everywhere */
  { name: "everywhere", at: "L7", draw: (T, t) => {
      const te = W_("L7", "everywhere"), th = W_("L7", "holding");
      const P = G.globe(T, G.fly(T, [[G.L("L7"), { lat: 40, lon: 0, r: 2400 }], [G.L("L7") + 0.35, { lat: 22, lon: 10 - t * 10, r: 470 }]]));
      if (G.on(T, te)) {
        const img = G.propImg("pot", { ry: 0.5, coffee: 0.7 });
        G.scatter(52, 70).forEach(([la, lo], i) => { const k = G.pop(T, te + i * 0.01, 0.12); if (k > 0) G.onGlobe(P, la, lo, 0.3, (c, s) => { const z = s * 0.9 * k; c.drawImage(img, -z / 2, -z * 0.86, z, z); }); });
        G.text("everywhere", CX, TOP + 150, { style: "emboss", size: 200, edges: E[1], rot: -4, scale: G.pop(T, te, 0.14) });
      }
      say(T, th, "you're probably", CX - 40, BOT - 230, 120, { e: 0, rot: -4 });
      say(T, W_("L7", "one"), "holding one.", CX + 120, BOT - 100, 125, { e: 3, rot: 3 });
    } },
  { name: "end card", at: [LAST, "guess"], draw: (T, t) => titleCard(T, t, G.pop(T, W_(LAST, "guess"), 0.25)) },
];
