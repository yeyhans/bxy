/* "history of the olympics, i guess": every scene, timed to the words in build/timeline.json.
   Built for Shorts (every text through put()). Cold open on the 1904 marathon; the ending asks "and gold goes to..."
   and the loop answers it: the last frame is the first (the runner, his trainer, the bottle). */
const CX = G.CX, CY = G.CY;
const TITLE_BG = "#2f2bff", TITLE_FG = "#ffe14d";
const W_ = (id, w, n) => G.w(id, w, n);
const DUR = TIMELINE.duration;
const PL = { olympia: [37.64, 21.63], athens: [37.98, 23.73], paris: [48.86, 2.35], stlouis: [38.63, -90.2], antwerp: [51.22, 4.40] };
const E = [["#ff9a1f", "#1f6bff"], ["#ff4fd8", "#2bd94a"], ["#2fd9ff", "#ff3d7f"], ["#ffe94a", "#8a4dff"]];
const TINTS = [[1, 0.42, 0.95, 0.55], [0.35, 0.9, 1, 0.5], [1, 0.95, 0.3, 0.5], [0.4, 1, 0.5, 0.5]];
const GOLD = 0xe2b43c, SILVER = 0xc9ccd2, BRONZE = 0xb8743a;
const P_ = G.PAL, TOON = { look: "toon", stars: false }, NAVY = { kind: "flat", color: G.PAL.navy };
const STAMP_Y = 1330;
const SAFE = { l: 36, r: 1044, rLow: 916, yLow: 820 };
function put(txt, x, y, o) {
  o = Object.assign({ maxw: 1000 }, o || {});
  const R = y + (o.size || 90) * 0.6 > SAFE.yLow ? SAFE.rLow : SAFE.r;
  x = Math.min(Math.max(x, SAFE.l + 140), R - 140);
  o.maxw = Math.max(120, Math.min(o.maxw, 2 * Math.min(x - SAFE.l, R - x) * 0.86));
  G.text(txt, x, y, o);
}
function say(T, t0, txt, x, y, size, o) {
  if (T < t0) return;
  o = Object.assign({}, o || {}); const e = E[o.e || 0]; delete o.e;
  put(txt, x, y, Object.assign({ style: "edges", size: size, edges: e, scale: G.pop(T, t0, 0.12) }, o));
}
function holdWord(T, id, txt, x, y, o) { const h = G.held(id); if (!h) return; G.stretch(txt, x, y, T, h[0], h[1] + 0.15, Object.assign({ maxw: 800 }, o || {})); }
/* a rubber stamp: a coloured box and a word in it */
function rstamp(T, t0, word, x, y, rot, col, w, size) {
  if (T < t0) return;
  const k = G.pop(T, t0, 0.14);
  G.withT({ x: x, y: y, rot: rot, scale: k }, () => { const c = G.ctx(); c.fillStyle = "rgba(255,255,255,0.88)"; c.fillRect(-w / 2 - 8, -88, w + 16, 176); c.strokeStyle = col; c.lineWidth = 14; c.strokeRect(-w / 2, -80, w, 160); });
  put(word, x, y, { size: size || 120, color: col, rot: rot, scale: k, maxw: w - 40 });
}
function titleCard(T, t) {
  G.bg(TITLE_BG);
  const s = 1 + t * 0.015;
  G.text("history of the", CX, 560, { font: "casual", size: 120, color: TITLE_FG, scale: s });
  G.text("olympics", CX, 730, { font: "casual", size: 176, color: TITLE_FG, scale: s });
  put("i guess", 470, 920, { font: "casual", size: 132, color: TITLE_FG, scale: s });
}

/* ---------- 2D things ---------- */
function bottle(c, x, y, s, rot) {
  c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s, s);
  c.fillStyle = "#5a3412"; c.strokeStyle = "#2a1606"; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-14, -110); c.lineTo(14, -110); c.lineTo(14, -70); c.quadraticCurveTo(48, -55, 48, -20); c.lineTo(48, 90); c.quadraticCurveTo(48, 104, 34, 104); c.lineTo(-34, 104); c.quadraticCurveTo(-48, 104, -48, 90); c.lineTo(-48, -20); c.quadraticCurveTo(-48, -55, -14, -70); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#c9a26b"; c.fillRect(-16, -124, 32, 18);
  c.fillStyle = "rgba(255,255,255,0.2)"; c.fillRect(-40, -30, 9, 110);
  c.fillStyle = "#f4efe2"; c.fillRect(-44, -8, 88, 92); c.strokeStyle = "#8a1010"; c.lineWidth = 3; c.strokeRect(-44, -8, 88, 92);
  c.fillStyle = "#111"; c.beginPath(); c.arc(0, 26, 15, 0, 7); c.fill(); c.fillRect(-9, 36, 18, 9);
  c.fillStyle = "#f4efe2"; c.beginPath(); c.arc(-6, 24, 4.5, 0, 7); c.arc(6, 24, 4.5, 0, 7); c.fill();
  c.strokeStyle = "#111"; c.lineWidth = 5; c.beginPath(); c.moveTo(-20, 50); c.lineTo(20, 62); c.moveTo(20, 50); c.lineTo(-20, 62); c.stroke();
  c.fillStyle = "#b01010"; c.font = "700 19px " + G.FONT.sans; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("RAT", 0, 4); c.fillText("POISON", 0, 74);
  c.restore();
}
function spoon(c, x0, y0, x1, y1) {
  c.save(); c.strokeStyle = "#b9bec6"; c.lineWidth = 9; c.lineCap = "round"; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0); c.translate(x1, y1); c.rotate(a);
  c.fillStyle = "#c9ced6"; c.strokeStyle = "#7d828a"; c.lineWidth = 3; c.beginPath(); c.ellipse(20, 0, 26, 15, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#7bdc3a"; c.beginPath(); c.ellipse(22, 0, 17, 9, 0, 0, 7); c.fill();
  c.restore();
}
function wreath(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (let i = 0; i < 18; i++) { const side = i < 9 ? -1 : 1, k = i % 9, a = Math.PI + side * (0.25 + k * 0.33) * -1 + (side > 0 ? 0 : 0); const aa = -Math.PI / 2 + side * (0.35 + k * 0.3); c.save(); c.translate(Math.cos(aa) * 40, Math.sin(aa) * 26); c.rotate(aa + side * 0.9); c.fillStyle = k % 2 ? "#5f8f2a" : "#7aa83a"; c.strokeStyle = "#2f4a12"; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, 15, 7, 0, 0, 7); c.fill(); c.stroke(); c.restore(); }
  c.restore();
}
function crown(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = "#ffd23a"; c.strokeStyle = "#7a5408"; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-34, 18); c.lineTo(-34, -8); c.lineTo(-17, 6); c.lineTo(0, -16); c.lineTo(17, 6); c.lineTo(34, -8); c.lineTo(34, 18); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#e0284a"; c.beginPath(); c.arc(0, 8, 5, 0, 7); c.fill(); c.restore();
}
function glint(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = "#fffbe0"; c.shadowColor = "#ffe14d"; c.shadowBlur = 18;
  c.beginPath(); c.moveTo(0, -30); c.quadraticCurveTo(4, -4, 30, 0); c.quadraticCurveTo(4, 4, 0, 30); c.quadraticCurveTo(-4, 4, -30, 0); c.quadraticCurveTo(-4, -4, 0, -30); c.fill(); c.restore();
}
function censor(c, x, y, w) {
  c.save(); c.fillStyle = "#000"; c.fillRect(x - w / 2, y - 20, w, 40);
  c.fillStyle = "#fff"; c.font = "700 20px " + G.FONT.sans; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("CENSORED", x, y + 1); c.restore();
}
function jug(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = "#c46a3a"; c.strokeStyle = "#5a2a12"; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-12, -60); c.lineTo(12, -60); c.lineTo(10, -42); c.quadraticCurveTo(44, -30, 40, 10); c.quadraticCurveTo(36, 50, 0, 58); c.quadraticCurveTo(-36, 50, -40, 10); c.quadraticCurveTo(-44, -30, -10, -42); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = "#1a1a1a"; c.lineWidth = 5; c.beginPath(); c.moveTo(-34, 0); c.lineTo(34, 0); c.stroke();
  c.beginPath(); c.strokeStyle = "#5a2a12"; c.lineWidth = 6; c.arc(-30, -30, 14, Math.PI * 0.5, Math.PI * 1.5); c.stroke(); c.restore();
}
function cart(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = "#a0703c"; c.strokeStyle = "#4a2e12"; c.lineWidth = 5;
  c.fillRect(-150, -70, 300, 60); c.strokeRect(-150, -70, 300, 60); for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 100, -70); c.lineTo(i * 100, -10); c.stroke(); }
  c.beginPath(); c.moveTo(150, -40); c.lineTo(270, -20); c.stroke();
  [-90, 90].forEach((wx) => { c.fillStyle = "#6a4420"; c.beginPath(); c.arc(wx, 10, 48, 0, 7); c.fill(); c.stroke(); c.fillStyle = "#c89a5c"; c.beginPath(); c.arc(wx, 10, 36, 0, 7); c.fill(); c.strokeStyle = "#4a2e12"; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; c.beginPath(); c.moveTo(wx, 10); c.lineTo(wx + Math.cos(a) * 36, 10 + Math.sin(a) * 36); c.stroke(); } c.fillStyle = "#4a2e12"; c.beginPath(); c.arc(wx, 10, 9, 0, 7); c.fill(); });
  c.restore();
}
function calendar(c, x, y, s, month) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "rgba(0,0,0,0.35)"; c.fillRect(-150, -170, 320, 360);
  c.fillStyle = "#ffffff"; c.fillRect(-160, -180, 320, 360); c.fillStyle = "#d8232a"; c.fillRect(-160, -180, 320, 90);
  c.fillStyle = "#fff"; c.font = "700 64px " + G.FONT.sans; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(month, 0, -135);
  c.fillStyle = "#c9c9c9"; for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) c.fillRect(-140 + k * 48, -60 + r * 52, 34, 34);
  c.restore();
}
function target(c, x, y, s, hole) {
  c.save(); c.translate(x, y); c.scale(s, s);
  ["#ffffff", "#1a1a1a", "#2a6bd9", "#d8232a", "#ffd23a"].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(0, 0, 100 - i * 20, 0, 7); c.fill(); });
  c.strokeStyle = "#5a3a1a"; c.lineWidth = 10; c.beginPath(); c.moveTo(-40, 90); c.lineTo(-70, 220); c.moveTo(40, 90); c.lineTo(70, 220); c.stroke();
  if (hole) { c.fillStyle = "#000"; c.beginPath(); c.arc(6, -4, 9, 0, 7); c.fill(); }
  c.restore();
}
function easel(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = "#7a4e22"; c.lineWidth = 16; c.lineCap = "round";
  c.beginPath(); c.moveTo(-150, 420); c.lineTo(0, -300); c.lineTo(150, 420); c.moveTo(0, -300); c.lineTo(0, 440); c.stroke();
  c.fillStyle = "#7a4e22"; c.fillRect(-190, 150, 380, 22);
  c.fillStyle = "#e9dcc0"; c.fillRect(-180, -250, 360, 400);
  const g = c.createLinearGradient(0, -230, 0, 0); g.addColorStop(0, "#7ec3f0"); g.addColorStop(1, "#f6e2b0"); c.fillStyle = g; c.fillRect(-165, -235, 330, 230);
  c.fillStyle = "#ffcf3a"; c.beginPath(); c.arc(90, -170, 30, 0, 7); c.fill();
  c.fillStyle = "#5f9a3a"; c.beginPath(); c.moveTo(-165, -40); c.quadraticCurveTo(-60, -130, 40, -50); c.quadraticCurveTo(110, -110, 165, -60); c.lineTo(165, 135); c.lineTo(-165, 135); c.closePath(); c.fill();
  c.fillStyle = "#c8a46a"; c.fillRect(-165, 40, 330, 40);
  c.strokeStyle = "#ffffff"; c.lineWidth = 5; c.beginPath(); c.arc(-30, -12, 9, 0, 7); c.moveTo(-30, -3); c.lineTo(-30, 25); c.lineTo(-45, 40); c.moveTo(-30, 25); c.lineTo(-15, 40); c.moveTo(-45, 5); c.lineTo(-15, 12); c.stroke();
  c.strokeStyle = "#b08a3a"; c.lineWidth = 12; c.strokeRect(-180, -250, 360, 400);
  c.restore();
}
/* a stick figure lying down (asleep) with z's */
function sleeper(T, x, y, s, t0) {
  G.withT({ x: x, y: y, rot: -90 }, () => G.stick(0, 0, s, { pose: "sad", head: "#000", face: "none" }));
  const c = G.ctx(); c.save(); c.fillStyle = "#ffffff"; c.font = "700 " + Math.round(64 * s) + "px " + G.FONT.casual; c.textAlign = "center";
  for (let i = 0; i < 3; i++) { const k = ((T - t0) * 0.8 + i / 3) % 1; c.globalAlpha = Math.sin(k * Math.PI); c.fillText("z", x - 200 * s + i * 34 * s + k * 40 * s, y - 70 * s - k * 150 * s); }
  c.restore();
}
/* an old man: a stick figure with a white beard and a cane */
function oldman(x, y, s) {
  G.stick(x, y, s, { pose: "stand", head: "#000", face: "smile" });
  const c = G.ctx(); c.save(); c.fillStyle = "#f2f2f2"; c.beginPath(); c.moveTo(x - 22 * s, y - 168 * s); c.quadraticCurveTo(x, y - 95 * s, x + 22 * s, y - 168 * s); c.closePath(); c.fill();
  c.strokeStyle = "#8a5a2b"; c.lineWidth = 8 * s; c.lineCap = "round"; c.beginPath(); c.moveTo(x + 34 * s, y - 88 * s); c.lineTo(x + 46 * s, y); c.moveTo(x + 34 * s, y - 88 * s); c.quadraticCurveTo(x + 30 * s, y - 108 * s, x + 18 * s, y - 100 * s); c.stroke(); c.restore();
}
/* the VHS rewind / fast-forward sign with scan lines */
function vhs(T, txt, dir) {
  const c = G.ctx(); c.save(); c.globalAlpha = 0.16; c.fillStyle = "#fff"; for (let y = (T * 900) % 40; y < G.H; y += 40) c.fillRect(0, y, G.W, 3); c.restore();
  c.save(); c.fillStyle = "#ffffff"; c.translate(90, 250);
  for (let i = 0; i < 2; i++) { const x0 = i * 44; c.beginPath(); if (dir < 0) { c.moveTo(x0 + 40, -26); c.lineTo(x0, 0); c.lineTo(x0 + 40, 26); } else { c.moveTo(x0, -26); c.lineTo(x0 + 40, 0); c.lineTo(x0, 26); } c.closePath(); c.fill(); }
  c.restore();
  put(txt, 205 + txt.length * 21, 250, { font: "term", size: 84, color: "#ffffff", maxw: 520 });
}
/* the ancient stadium: warm sky, sand track, two marble columns */
function stadium(T) {
  const c = G.ctx(); const g = c.createLinearGradient(0, 0, 0, 1150); g.addColorStop(0, "#5aa8e6"); g.addColorStop(1, "#f5d9a0"); c.fillStyle = g; c.fillRect(0, 0, G.W, 1150);
  G.sun(850, 300, 90, T);
  c.fillStyle = "#d8b47a"; c.fillRect(0, 1150, G.W, G.H - 1150);
  c.fillStyle = "#c9a066"; for (let i = 0; i < 4; i++) c.fillRect(0, 1190 + i * 70, G.W, 5);
  const img = G.propImg("column", { ry: 0.3 });
  c.drawImage(img, 60 - 350, 860 - 350, 700, 700); c.drawImage(img, 1020 - 350, 860 - 350, 700, 700);
}
/* the 1904 road: the planet as a dome under St. Louis, a dusty road along it */
function road(T, lon) {
  G.card("grad", T, { colors: ["#ff9f4a", "#ffe9b8"], angle: 90 });
  G.globe(T, Object.assign({ lat: 4, lon: lon, r: 1500, cy: CY + 1350, hi: "midwest", halo: 0.3 }, TOON));
  const c = G.ctx(); c.save(); c.fillStyle = "rgba(196,160,108,0.92)"; c.beginPath(); c.moveTo(-20, 1210); for (let x = 0; x <= G.W + 40; x += 60) c.lineTo(x, 1206 + Math.sin(x / 90) * 5); for (let x = G.W + 40; x >= -20; x -= 60) c.lineTo(x, 1262 + Math.sin(x / 70) * 6); c.closePath(); c.fill(); c.restore();
}
/* the opening picture: 1904, the trainer feeding the runner from a bottle marked RAT POISON */
function openView(T, tl) {
  road(T, -90.2 - tl * 0.5);
  const c = G.ctx();
  for (let i = 0; i < 5; i++) { const k = ((tl * 1.4 + i / 5) % 1 + 1) % 1; c.save(); c.globalAlpha = 0.5 * (1 - k); c.fillStyle = "#e8d2a8"; c.beginPath(); c.arc(600 - k * 170, 1225 - k * 30, 16 + k * 34, 0, 7); c.fill(); c.restore(); }
  bottle(c, 140, 1042, 1.9, -0.04);
  G.stick(300, 1240, 1.5, { pose: "point", head: "#000", face: "smile" });
  G.stick(700, 1240, 1.55, { pose: "walk", T: tl * 1.6, head: "#000", face: "shock" });
  spoon(c, 393, 1015, 628, 985);
  G.prop("medal", 700, 1087, 130, { tint: GOLD, ry: Math.sin(tl * 3) * 0.3 });
}

window.SCENES = [
  { name: "1904: rat poison", at: 0, draw: (T, t) => {
      openView(T, T);
      G.stamp(1904, T, G.L("L1"), { y: STAMP_Y, x: 70 });
      say(T, W_("L1", "olympic"), "the olympic marathon", 540, 260, 110, { e: 0, rot: -3 });
      say(T, W_("L1", "trainers"), "his trainers:", 330, 750, 76, { e: 3, rot: -4 });
      if (G.on(T, W_("L1", "rat"))) put("rat poison.", 500, 520, { style: "wordart", size: 150, colors: ["#e4ff6a", "#5adb2b", "#1f6b12"], outline: "#0a2a06", rot: -5, scale: G.pop(T, W_("L1", "rat"), 0.14) });
      say(T, W_("L1", "during"), "(during the race)", 600, 1420, 72, { e: 1, rot: -2 });
    } },
  { name: "on purpose", at: "L2", draw: (T, t) => {
      openView(T, T);
      G.stamp(1904, T, 0, { y: STAMP_Y, x: 70 });
      rstamp(T, W_("L2", "purpose"), "ON PURPOSE", 520, 470, -10, "#ff1a3d", 640, 100);
      say(T, W_("L2", "supposed"), "it's supposed to help.", 540, 260, 96, { e: 2, rot: -3 });
    } },
  { name: "title", at: TIMELINE.title_start, draw: (T, t) => titleCard(T, t) },

  { name: "rewind to greece", at: "L3", draw: (T, t) => {
      const tg = W_("L3", "greece"), t0 = G.L("L3");
      const cam = G.fly(T, [[t0, { lat: 30, lon: -90, r: 520 }], [tg, { lat: 35, lon: 15, r: 560 }], [tg + 0.6, { lat: 37.4, lon: 21.8, r: 6000 }]]);
      const P = G.globe(T, Object.assign({ hi: "greece", back: NAVY }, TOON, cam));
      if (T < tg + 0.1) vhs(T, "rewind", -1);
      G.label(P, PL.olympia[0] + 0.4, PL.olympia[1], "olympia, greece", G.pop(T, tg + 0.5, 0.16), { size: 80, style: "misprint", dy: 0 });
      say(T, W_("L3", "start"), "ok, from the start.", 520, 520, 110, { e: 1, rot: -4 });
      const yr = T < tg + 0.1 ? G.count(T, t0, tg + 0.1, 1904, -776, (n) => (n < 0 ? -n + " bc" : n + "")) : "776 bc";
      G.stamp(yr, T, t0, { y: STAMP_Y, x: 70, w: 300 });
    } },
  { name: "one race, about 200 m", at: "L4", draw: (T, t) => {
      stadium(T);
      const tr = W_("L4", "race"), t2 = W_("L4", "200");
      for (let i = 0; i < 4; i++) { const x = -120 + ((t * 420 + i * 70) % 1300); G.stick(x, 1250 + (i % 2) * 40, 0.9, { pose: "walk", T: T * 1.8 + i, head: "#000", face: "smile" }); }
      say(T, G.L("L4"), "the first olympics:", 540, 260, 110, { e: 3, rot: -3 });
      if (G.on(T, tr)) put("one race.", 470, 470, { style: "emboss", size: 150, edges: E[0], rot: -4, scale: G.pop(T, tr, 0.14) });
      if (G.on(T, t2)) { const k = G.prog(T, t2, 0.4); G.arrow(540, 760, 540 + 440 * k, 760, k, { color: "#ffffff", width: 8, head: 26 }); G.arrow(540, 760, 540 - 440 * k, 760, k, { color: "#ffffff", width: 8, head: 26 }); say(T, t2, "about 200 m", 540, 690, 80, { e: 1 }); }
      G.stamp("776 bc", T, 0, { y: STAMP_Y, x: 70, w: 300 });
    } },
  { name: "naked, covered in olive oil", at: "L5", draw: (T, t) => {
      stadium(T);
      const tn = W_("L5", "naked"), to = W_("L5", "olive");
      const c = G.ctx();
      [[300, 1330, 1.5], [700, 1300, 1.3]].forEach(([x, y, s], i) => {
        c.save(); if (G.on(T, to)) { c.shadowColor = "#ffe14d"; c.shadowBlur = 40; }
        G.stick(x, y, s, { pose: "walk", T: T * 1.6 + i, head: "#000", face: "smile" }); c.restore();
        if (G.on(T, tn)) censor(c, x, y - 72 * s, 130 * s);
      });
      if (G.on(T, to)) { const r = G.rng(Math.floor(T * 12)); for (let i = 0; i < 6; i++) glint(c, 220 + r() * 600, 950 + r() * 360, 0.6 + r() * 0.8); }
      holdWord(T, "L5", "naaaked.", 520, 300, { size: 150, style: "shout", color: "#ff3d7f", spread: 0.25 });
      if (G.on(T, to)) put("covered in olive oil", 520, 520, { style: "glow", size: 100, color: "#fff6c0", glow: "#ffb000", rot: 3, scale: G.pop(T, to, 0.14) });
      G.stamp("776 bc", T, 0, { y: STAMP_Y, x: 70, w: 300 });
    } },
  { name: "first prize: a hat made of leaves", at: "L6", draw: (T, t) => {
      const c = G.ctx(); G.card("burst", T, { colors: ["#4f7a1f", "#6f9a2f"], n: 16, spin: 0.25, y: 1000 });
      const th = W_("L6", "hat"), ts = W_("L6", "second"), tn = W_("L6", "nothing");
      G.stick(430, 1300, 1.5, { pose: "up", head: "#000", face: "smile" });
      if (G.on(T, th)) wreath(c, 430, 1300 - 150 * 1.5 - 30 * 1.5 * 2 + 12, 1.5 * G.pop(T, th, 0.16));
      say(T, G.L("L6"), "first prize:", 540, 260, 120, { e: 0, rot: -3 });
      if (G.on(T, th)) put("a hat made of leaves.", 500, 450, { style: "edges", size: 100, edges: E[1], rot: -2, scale: G.pop(T, th, 0.14) });
      if (G.on(T, ts)) { G.stick(760, 1320, 1.0, { pose: "sad", head: "#000", face: "sad" }); say(T, ts, "second prize:", 640, 780, 80, { e: 2, rot: 3 }); }
      holdWord(T, "L6", "nothiiing.", 560, 900, { size: 120, style: "fuzzy", color: "#e6e9ee", glow: "#ff6fd8", spread: 0.3, maxw: 660 });
      G.stamp("776 bc", T, 0, { y: STAMP_Y, x: 70, w: 300 });
    } },
  { name: "a thousand years, then banned", at: "L7", draw: (T, t) => {
      const tt = W_("L7", "thousand"), te = W_("L7", "emperor"), tb = W_("L7", "bans");
      const P = G.globe(T, Object.assign({ lat: 37.8, lon: 22 + t * 0.4, r: G.lerp(6000, 1800, G.ease.io(G.prog(T, G.L("L7"), 1.6))), hi: "greece", back: NAVY, day: G.on(T, tb) ? 0.55 : 1 }, TOON));
      G.label(P, PL.olympia[0] + 0.4, PL.olympia[1], "olympia", 1, { size: 70, style: "misprint", dy: 0 });
      const yr = G.count(T, G.L("L7") + 0.1, te, -776, 393, (n) => (n < 0 ? -n + " bc" : n + " ad"));
      G.stamp(yr, T, 0, { y: STAMP_Y, x: 70, w: 300 });
      say(T, tt, "over 1,000 years", 540, 260, 110, { e: 3, rot: -3 });
      if (G.on(T, te)) { G.stick(760, 1270, 1.2, { pose: "point", head: "#000", face: "sad", flip: true }); crown(G.ctx(), 760, 1270 - 216 - 48, 1.3 * G.pop(T, te, 0.14)); say(T, te, "a roman emperor:", 470, 470, 96, { e: 0, rot: -3 }); }
      rstamp(T, tb, "BANNED", 470, 760, -12, "#ff1a3d", 480, 120);
      G.flash(T, tb, "#ffffff", 0.07);
    } },
  { name: "1,500 years later: athens", at: "L8", draw: (T, t) => {
      const t96 = W_("L8", "1896"), ta = W_("L8", "athens"), tb = W_("L8", "back");
      let cam;
      if (T < t96) cam = { lat: 34, lon: 23 - (t96 - T) * 260, r: 480 };
      else cam = G.fly(T, [[t96, { lat: 34, lon: 23, r: 480 }], [ta + 0.3, { lat: 37.9, lon: 23.7, r: 6500 }]]);
      const P = G.globe(T, Object.assign({ hi: "greece", back: { kind: "rings", colors: [P_.violet, "#7d63ff"], size: 130, scroll: 220 } }, TOON, cam));
      G.label(P, PL.athens[0] + 0.35, PL.athens[1], "athens", G.pop(T, ta, 0.16), { size: 86, style: "misprint", dy: 0 });
      if (G.on(T, W_("L8", "later"))) put("about 1,500 years later", 520, 280, { style: "wordart", size: 96, colors: ["#fff36b", "#ff9a1f", "#ff3d7f"], outline: "#2a0a2a", rot: -3, scale: G.pop(T, W_("L8", "later"), 0.14), maxw: 900 });
      const yr = T < t96 ? G.count(T, G.L("L8"), t96, 393, 1896, (n) => (n < 1000 ? n + " ad" : n + "")) : 1896;
      G.stamp(yr, T, 0, { y: STAMP_Y, x: 70, w: 300 });
      if (G.on(T, tb)) { G.prop("column", 760, 1180, 460 * G.pop(T, tb, 0.18), { ry: 0.3, shadow: 1 }); G.burst(760, 1100, T, tb, { n: 30, r: 420, color: "#ffe94a", dur: 0.5 }); say(T, tb, "it's back.", 520, 520, 120, { e: 2, rot: -4 }); }
    } },
  { name: "the marathon: a water guy", at: "L9", draw: (T, t) => {
      const tw = W_("L9", "won"), tr = W_("L9", "water");
      G.globe(T, Object.assign({ lat: 37.9, lon: 23.7 - t * 0.3, r: 6500, hi: "greece" }, TOON));
      const c = G.ctx();
      const x = G.lerp(-60, 430, G.ease.out(G.prog(T, G.L("L9"), tw - G.L("L9"))));
      c.save(); c.fillStyle = "#ffffff"; c.fillRect(640, 900, 14, 400); c.restore();
      const snap = G.prog(T, tw, 0.5);
      c.save(); c.strokeStyle = "#ff3d3d"; c.lineWidth = 10; c.beginPath();
      if (T < tw) { c.moveTo(Math.max(x + 40, 0), 1110); c.lineTo(647, 1100); } else { c.moveTo(647, 1100); c.quadraticCurveTo(640, 1180 + snap * 40, 600 - snap * 20, 1250); } c.stroke(); c.restore();
      G.stick(x, 1300, 1.3, { pose: G.on(T, tw) ? "up" : "walk", T: T * 1.8, head: "#000", face: "smile" });
      if (G.on(T, tr)) { jug(c, x - 110, 1170, 1.1 * G.pop(T, tr, 0.16)); jug(c, x + 110, 1170, 1.1 * G.pop(T, tr + 0.08, 0.16)); }
      say(T, G.L("L9"), "the marathon:", 540, 260, 110, { e: 0, rot: -3 });
      if (G.on(T, tw)) say(T, tw, "won by...", 520, 430, 100, { e: 3, rot: -3 });
      if (G.on(T, tr)) put("a water delivery guy.", 500, 600, { style: "emboss", size: 96, edges: E[2], rot: -3, scale: G.pop(T, tr, 0.14), maxw: 900 });
      G.stamp(1896, T, 0, { y: STAMP_Y, x: 70 });
    } },
  { name: "the king's gift: a cart", at: "L10", draw: (T, t) => {
      const tg = W_("L10", "gift"), tc = W_("L10", "cart"), tw = W_("L10", "water");
      G.card("dots", T, { colors: [P_.yellow, "#fff3a0"], size: 110, scroll: 30 });
      const c = G.ctx();
      G.stick(250, 1260, 1.25, { pose: "point", head: "#000", face: "smile" }); crown(c, 250, 1260 - 225 - 50, 1.25);
      G.stick(700, 1260, 1.25, { pose: G.on(T, tc) ? "up" : "stand", head: "#000", face: "smile" });
      if (G.on(T, tg) && T < tc) G.bubble(330, 850, 380, 120, "pick any gift.", { size: 54, tail: [270, 960] });
      if (G.on(T, tc)) { G.bubble(660, 850, 280, 120, "a cart.", { size: 60, tail: [690, 960] }); const k = G.ease.out(G.prog(T, tc, 0.5)); cart(c, G.lerp(-300, 560, k), 1420, 1.0); if (G.on(T, tw)) { jug(c, 490, 1300, 0.8); jug(c, 560, 1300, 0.8); jug(c, 630, 1300, 0.8); } }
      say(T, G.L("L10"), "the king offers a gift", 540, 260, 96, { e: 1, rot: -3 });
      if (G.on(T, tw)) put("(for the water)", 520, 470, { style: "edges", size: 90, edges: E[3], rot: -3, scale: G.pop(T, tw, 0.14) });
      G.stamp(1896, T, 0, { y: STAMP_Y, x: 70 });
    } },
  { name: "1900 paris: five months", at: "L11", draw: (T, t) => {
      const tp = W_("L11", "paris"), tf = W_("L11", "five"), tw = W_("L11", "winners"), tn = W_("L11", "find");
      const cam = G.fly(T, [[G.L("L11"), { lat: 40, lon: 15, r: 900 }], [tp + 0.2, { lat: 48.6, lon: 2.35, r: 7000 }]]);
      const P = G.globe(T, Object.assign({ hi: "europe", back: NAVY }, TOON, cam));
      G.label(P, PL.paris[0] + 0.25, PL.paris[1], "paris", G.pop(T, tp, 0.16), { size: 86, style: "misprint", dy: 0 });
      const c = G.ctx();
      if (G.on(T, tw)) G.card("checker", T, { colors: [P_.teal, "#5fd6e0"], size: 120, scroll: 40 });
      if (G.on(T, tf) && T < tw + 0.2) { const months = ["may", "jun", "jul", "aug", "sep", "oct"]; const i = Math.min(5, G.step(T, tf, 0.16)); calendar(c, 470, 1020, 1.25 * G.pop(T, tf, 0.14), months[i]); }
      if (G.on(T, tf) && T < tw) put("5 months", 470, 470, { style: "led", size: 130, color: "#ffffff", glow: "#bfe0ff", maxw: 700 });
      if (G.on(T, tw)) { G.stick(470, 1300, 1.35, { pose: "stand", head: "#000", face: G.on(T, tn) ? "shock" : "smile" }); G.prop("medal", 470, 1190, 170, { tint: GOLD, ry: Math.sin(T * 3) * 0.3 }); }
      if (G.on(T, tn)) G.bubble(560, 800, 560, 200, "wait, that was" + String.fromCharCode(10) + "the olympics?", { size: 64, tail: [490, 960] });
      if (T < tw) say(T, W_("L11", "last"), "the games last:", 540, 260, 110, { e: 0, rot: -3 });
      else say(T, tw, "some winners never find out", 540, 260, 86, { e: 2, rot: -3 });
      G.stamp(1900, T, G.L("L11"), { y: STAMP_Y, x: 70 });
    } },
  { name: "1904: back to that marathon", at: "L12", draw: (T, t) => {
      const tm = W_("L12", "marathon");
      const P = G.globe(T, Object.assign({ hi: "midwest", back: NAVY }, TOON, G.fly(T, [[G.L("L12"), { lat: 48, lon: 2, r: 1200 }], [G.L("L12") + 0.6, { lat: 30, lon: -45, r: 500 }], [tm + 0.2, { lat: 38.4, lon: -90.2, r: 6000 }]])));
      G.label(P, PL.stlouis[0] + 0.5, PL.stlouis[1], "st. louis, usa", G.pop(T, tm, 0.16), { size: 76, style: "misprint", dy: 0 });
      vhs(T, "back to it", 1);
      say(T, W_("L12", "back"), "back to that marathon.", 520, 520, 104, { e: 3, rot: -4 });
      G.stamp(1904, T, G.L("L12"), { y: STAMP_Y, x: 70 });
    } },
  { name: "the car", at: "L13", draw: (T, t) => {
      const t0 = G.L("L13"), tr = W_("L13", "rides"), tc = W_("L13", "car"), tx = W_("L13", "crosses"), tf = W_("L13", "first");
      road(T, -90.2 - T * 0.5);
      const c = G.ctx();
      G.stick(160 + t * 60, 1240, 0.9, { pose: "walk", T: T * 1.6, head: "#000", face: "sad" });
      /* the finish banner */
      c.save(); c.fillStyle = "#ffffff"; c.fillRect(760, 900, 10, 340); for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? "#111" : "#fff"; c.fillRect(770 + i * 24, 900 + j * 24, 24, 24); } c.restore();
      let cx;
      if (T < tc) cx = G.lerp(-320, 360, G.ease.out(G.prog(T, tr, tc - tr)));
      else cx = G.lerp(360, 1400, G.ease.in(G.prog(T, tc, tx - tc)));
      if (T < tx) {
        if (T < tc) G.stick(420, 1240, 1.0, { pose: G.on(T, tr) ? "point" : "walk", T: T * 1.6, head: "#000", face: "smile" });
        else G.stick(cx - 50, 1150, 0.75, { pose: "up", head: "#000", face: "smile" });
        if (G.on(T, tr)) G.prop("car", cx, 1150, 560, { ry: -0.25, rx: 0.08, roll: cx / 50 });
      } else {
        G.stick(G.lerp(640, 860, G.ease.out(G.prog(T, tx, 0.5))), 1240, 1.1, { pose: "up", head: "#000", face: "smile" });
      }
      say(T, t0, "one guy", 540, 260, 110, { e: 1, rot: -3 });
      if (G.on(T, tc)) put("rides in a car", 500, 440, { style: "misprint", size: 110, color: "#ffffff", rot: -3, scale: G.pop(T, tc, 0.14) });
      if (G.on(T, tf)) { put("1st!", 600, 700, { style: "led", size: 150, color: "#ffe94a", glow: "#ff9a1f", scale: G.pop(T, tf, 0.12), maxw: 360 }); say(T, tf + 0.3, "(they noticed)", 560, 1430, 68, { e: 2, rot: -2 }); }
      G.stamp(1904, T, 0, { y: STAMP_Y, x: 70 });
    } },
  { name: "rotten apples, a nap, fourth", at: "L14", draw: (T, t) => {
      const ta = W_("L14", "rotten"), tn = W_("L14", "nap"), tf = W_("L14", "forth");
      if (T < tn - 0.1) G.card("grad", T, { colors: ["#6f7f1f", "#c8d86a"], angle: 90 }); else road(T, -90.2 - T * 0.5);
      const c = G.ctx();
      if (T < tn) {
        G.stick(260, 1240, 1.1, { pose: "hold", head: "#000", face: G.on(T, ta) ? "sad" : "smile" });
        if (G.on(T, ta)) { G.prop("apple", 560, 900, 520 * G.pop(T, ta, 0.16), { ry: T * 0.9, rz: 0.15 }); c.save(); c.strokeStyle = "#8adf4a"; c.lineWidth = 6; for (let i = 0; i < 3; i++) { c.beginPath(); for (let k = 0; k <= 10; k++) { const y = 620 - k * 14 - ((T * 60) % 30), x = 480 + i * 80 + Math.sin(k * 0.9 + T * 6 + i) * 12; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } c.restore(); }
      } else {
        sleeper(T, 470, 1235, 1.1, tn);
        G.prop("apple", 650, 1205, 120, { rz: 1.4 });
      }
      say(T, W_("L14", "another"), "another guy", 540, 260, 110, { e: 0, rot: -3 });
      if (G.on(T, ta) && T < tn - 0.1) put("eats rotten apples", 500, 450, { style: "fuzzy", size: 100, color: "#8adf4a", glow: "#3a6a12", rot: -3, scale: G.pop(T, ta, 0.14) });
      if (G.on(T, tn - 0.1)) { say(T, tn - 0.1, "takes", 300, 440, 110, { e: 1, rot: -3 }); holdWord(T, "L14", "a naaap.", 560, 580, { size: 140, style: "glow", color: "#d6e4ff", glow: "#6a8aff", spread: 0.35, maxw: 700 }); }
      if (G.on(T, tf)) { put("still 4th.", 520, 720, { style: "led", size: 130, color: "#ffffff", glow: "#2fd9ff", scale: G.pop(T, tf, 0.12), maxw: 640 }); }
      G.stamp(1904, T, 0, { y: STAMP_Y, x: 70 });
    } },
  { name: "jingle: tug of war!", at: "J1", draw: (T, t) => {
      const st = G.step(T, G.L("J1"), 0.24), pull = Math.sin(t * 7) * 40;
      G.globe(T, Object.assign({ lat: 20, lon: 10 - pull * 0.6, r: 430, tint: TINTS[st % 4], back: { kind: "stripes", colors: [P_.red, "#ff8a8a"], size: 90, scroll: 200 } }, TOON));
      const c = G.ctx();
      c.save(); c.strokeStyle = "#c8a46a"; c.lineWidth = 16; c.lineCap = "round"; c.beginPath(); c.moveTo(40, 770); c.quadraticCurveTo(540 + pull, 790, 1040, 770); c.stroke(); c.restore();
      for (let i = 0; i < 3; i++) { G.withT({ x: 100 + i * 80 + pull, y: 860, rot: -14 }, () => G.stick(0, 0, 0.75, { pose: "hold", head: "#000", face: "smile" })); G.withT({ x: 980 - i * 80 + pull, y: 860, rot: 14 }, () => G.stick(0, 0, 0.75, { pose: "hold", head: "#000", face: "smile", flip: true })); }
      const n = G.line("J1").notes || [];
      const spots = [[300, 1150, -6, ["#fff36b", "#ff9a1f", "#9a4414"]], [560, 1170, 4, ["#7fe8ff", "#2f8aff", "#14306a"]], [470, 1320, -4, ["#ffb3e6", "#ff3d9a", "#6a0a3a"]]];
      ["tug", "of", "waaar!"].forEach((w, i) => { const tw = G.L("J1") + (n[i] ? n[i][0] : 0.3 + i * 0.4); if (T < tw) return; const [x, y, rot, col] = spots[i]; put(w, x, y, { style: "wordart", size: 200, colors: col, outline: "#1a0a1a", rot: rot, scale: G.pop(T, tw, 0.14) }); });
    } },
  { name: "tug of war, for 20 years", at: "L15", draw: (T, t) => {
      const ts = W_("L15", "sport"), t20 = W_("L15", "20");
      const pull = Math.sin(T * 3) * 30;
      G.globe(T, Object.assign({ lat: 20, lon: 10 - pull * 0.6, r: 430, back: { kind: "chevron", colors: [P_.orange, P_.yellow], size: 100, scroll: 60 } }, TOON));
      const c = G.ctx();
      c.save(); c.strokeStyle = "#c8a46a"; c.lineWidth = 16; c.lineCap = "round"; c.beginPath(); c.moveTo(40, 770); c.quadraticCurveTo(540 + pull, 790, 1040, 770); c.stroke(); c.restore();
      for (let i = 0; i < 3; i++) { G.withT({ x: 100 + i * 80 + pull, y: 860, rot: -14 }, () => G.stick(0, 0, 0.75, { pose: "hold", head: "#000", face: "sad" })); G.withT({ x: 980 - i * 80 + pull, y: 860, rot: 14 }, () => G.stick(0, 0, 0.75, { pose: "hold", head: "#000", face: "sad", flip: true })); }
      say(T, G.L("L15"), "tug of war:", 540, 260, 120, { e: 1, rot: -3 });
      if (G.on(T, ts)) put("an olympic sport.", 520, 450, { style: "edges", size: 100, edges: E[3], rot: -3, scale: G.pop(T, ts, 0.14) });
      if (G.on(T, t20)) put("for 20 years.", 470, 1150, { style: "outline", size: 110, color: "#ffffff", rot: -3, scale: G.pop(T, t20, 0.14) });
      G.stamp("1900-1920", T, t20, { y: STAMP_Y, x: 70, w: 400 });
    } },
  { name: "so is art: gold for a painting", at: "L16", draw: (T, t) => {
      const ta = W_("L16", "art"), tg = W_("L16", "gold"), tp = W_("L16", "painting");
      const c = G.ctx(); const g = c.createLinearGradient(0, 0, 0, G.H); g.addColorStop(0, "#3a2a22"); g.addColorStop(1, "#140c08"); c.fillStyle = g; c.fillRect(0, 0, G.W, G.H);
      c.save(); const sp = c.createRadialGradient(470, 820, 40, 470, 820, 620); sp.addColorStop(0, "rgba(255,240,200,0.35)"); sp.addColorStop(1, "rgba(255,240,200,0)"); c.fillStyle = sp; c.fillRect(0, 0, G.W, G.H); c.restore();
      easel(c, 470, 900, 1.15 * G.pop(T, G.L("L16"), 0.16));
      if (G.on(T, tg)) { G.prop("medal", 680, 760, 360 * G.pop(T, tg, 0.16), { tint: GOLD, ry: Math.sin(T * 3) * 0.35 }); G.burst(680, 800, T, tg, { n: 20, r: 280, color: "#ffe94a", dur: 0.4 }); }
      say(T, ta, "so is art.", 540, 260, 130, { e: 2, rot: -4 });
      if (G.on(T, tp)) put("gold, for a painting.", 470, 1250, { style: "wordart", size: 96, colors: ["#fff36b", "#e2b43c", "#9a7414"], outline: "#3a2a08", rot: -3, scale: G.pop(T, tp, 0.14), maxw: 820 });
      G.stamp("1912-1948", T, G.L("L16"), { y: STAMP_Y, x: 70, w: 400 });
    } },
  { name: "1920: a 72-year-old wins silver", at: "L17", draw: (T, t) => {
      const t72 = W_("L17", "72"), tsl = W_("L17", "silver"), tsh = W_("L17", "shooting");
      const cam = G.fly(T, [[G.L("L17"), { lat: 35, lon: 0, r: 800 }], [G.L("L17") + 0.6, { lat: 50.8, lon: 4.4, r: 7000 }]]);
      const P = G.globe(T, Object.assign({ hi: "europe", back: NAVY }, TOON, cam));
      G.label(P, PL.antwerp[0] + 0.2, PL.antwerp[1], "antwerp", G.pop(T, G.L("L17") + 0.6, 0.16), { size: 80, style: "misprint", dy: 0 });
      const c = G.ctx();
      if (G.on(T, t72)) oldman(360, 1290, 1.4);
      if (G.on(T, tsl)) G.prop("medal", 360, 1145, 210 * G.pop(T, tsl, 0.16), { tint: SILVER, ry: Math.sin(T * 3) * 0.3 });
      if (G.on(T, tsh)) target(c, 720, 1000, 1.1 * G.pop(T, tsh, 0.14), T > tsh + 0.25);
      say(T, t72, "a 72-year-old", 540, 260, 116, { e: 0, rot: -3 });
      if (G.on(T, tsl)) put("wins silver.", 480, 450, { style: "emboss", size: 120, edges: E[2], rot: -3, scale: G.pop(T, tsl, 0.14) });
      if (G.on(T, tsh)) say(T, tsh, "in shooting.", 520, 640, 90, { e: 3, rot: 3 });
      G.stamp(1920, T, G.L("L17"), { y: STAMP_Y, x: 70 });
    } },
  { name: "breakdancing: in, then out", at: "L18", draw: (T, t) => {
      const tb = W_("L18", "breakdancing"), ti = W_("L18", "in"), t28 = W_("L18", "2028"), to = W_("L18", "out");
      const cam = G.fly(T, [[G.L("L18"), { lat: 51, lon: 4.4, r: 7000 }], [G.L("L18") + 0.5, { lat: 48.6, lon: 2.35, r: 7000 }]]);
      const P = G.globe(T, Object.assign({ hi: "europe", back: NAVY }, TOON, cam));
      G.label(P, PL.paris[0] + 0.25, PL.paris[1], "paris (again)", G.pop(T, G.L("L18") + 0.4, 0.16), { size: 76, style: "misprint", dy: 0 });
      const c = G.ctx();
      if (G.on(T, tb)) G.card("rings", T, { colors: [P_.magenta, P_.pink], size: 100, scroll: 260, y: 1360 });
      if (G.on(T, tb)) {
        const fall = G.ease.in(G.prog(T, to, 0.35));
        if (fall < 1) G.withT({ x: 470, y: 1080 + fall * 260, rot: 180 - fall * 90, alpha: 1 - fall }, () => G.stick(0, 0, 1.3, { pose: "up", head: "#000", face: "smile", flip: Math.sin(T * 16) > 0 }));
        c.save(); c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 6; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(470, 1360, 90 + i * 30, T * 8 + i, T * 8 + i + 1.2); c.stroke(); } c.restore();
      }
      say(T, tb, "breakdancing", 540, 260, 120, { e: 1, rot: -3 });
      rstamp(T, ti, "IN", 300, 560, -10, "#1fae4a", 260, 130);
      rstamp(T, to, "OUT", 660, 560, 9, "#ff1a3d", 300, 130);
      holdWord(T, "L18", "it's ouuut.", 520, 820, { size: 130, style: "edges", edges: E[2], color: "#ffffff", spread: 0.3, maxw: 700 });
      if (T < t28) G.stamp(2024, T, G.L("L18"), { y: STAMP_Y, x: 70 }); else G.stamp(2028, T, t28, { y: STAMP_Y, x: 70 });
    } },
  { name: "the podium for weirdest olympian", at: "L19", draw: (T, t) => {
      const tb = W_("L19", "bronze"), ts = W_("L19", "silver");
      podiumStage(T);
      if (G.on(T, tb)) { sleeper(T, 830, 1150, 0.7, tb); G.prop("medal", 860, 1240, 110 * G.pop(T, tb, 0.16), { tint: BRONZE }); }
      if (G.on(T, ts)) { oldman(255, 1085, 0.85); G.prop("medal", 255, 1000, 120 * G.pop(T, ts, 0.16), { tint: SILVER }); }
      qmark(T, 540, 870);
      say(T, W_("L19", "podium"), "the podium for", 540, 250, 100, { e: 0, rot: -3 });
      say(T, W_("L19", "weirdest"), "weirdest olympian", 540, 380, 110, { e: 2, rot: 2 });
      if (G.on(T, tb) && T < ts) say(T, tb, "bronze: the nap guy", 470, 1430, 74, { e: 3, rot: -2 });
      if (G.on(T, ts)) say(T, ts, "silver: the 72-year-old", 470, 1430, 74, { e: 1, rot: -2 });
    } },
  { name: "and gold goes to...", at: "L20", draw: (T, t) => {
      const hh = G.held("L20"), back = (hh ? hh[1] : W_("L20", "to")) + 0.35;
      if (T >= back) { openView(T, T - DUR); return; }
      const zoom = G.ease.in(G.prog(T, W_("L20", "goes"), back - W_("L20", "goes")));
      G.withT({ x: 540, y: 980, scale: 1 + zoom * 1.6 }, () => G.withT({ x: -540, y: -980 }, () => {
        podiumStage(T);
        sleeper(T, 830, 1150, 0.7, W_("L19", "bronze")); G.prop("medal", 860, 1240, 110, { tint: BRONZE });
        oldman(255, 1085, 0.85); G.prop("medal", 255, 1000, 120, { tint: SILVER });
        qmark(T, 540, 870);
      }));
      if (T < W_("L20", "goes")) { say(T, W_("L19", "podium"), "the podium for", 540, 250, 100, { e: 0, rot: -3 }); say(T, W_("L19", "weirdest"), "weirdest olympian", 540, 380, 110, { e: 2, rot: 2 }); }
      say(T, W_("L20", "gold"), "and gold goes", 520, 520, 110, { e: 3, rot: -3 });
      holdWord(T, "L20", "toooo...", 520, 680, { size: 130, style: "edges", edges: E[0], color: "#ffffff", spread: 0.35, maxw: 640 });
    } },
];
/* the podium on a dark stage with a spotlight */
function podiumStage(T) {
  const c = G.ctx(); G.card("burst", T, { colors: ["#2a1f6a", "#3d2f95"], n: 14, spin: 0.2, y: 900 });
  c.fillStyle = "#2a2450"; c.fillRect(0, 1330, G.W, G.H - 1330);
  G.prop("podium", 540, 1080, 1000, { rx: 0.16, shadow: 0.8 });
}
function qmark(T, x, y) { put("?", x, y + Math.sin(T * 5) * 10, { style: "shout", size: 200, color: "#ffe94a", rot: Math.sin(T * 3) * 8, maxw: 200 }); }
