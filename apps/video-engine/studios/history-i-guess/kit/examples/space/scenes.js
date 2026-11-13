/* "history of space travel, i guess": every scene, timed to the words in build/timeline.json.
   Built for YouTube Shorts: no text in the top 140 px, the bottom 20 % (y > 1536) or the button column (x > 930, y 880-1520).
   The last frame is the first frame: the planet and the beeping ball come back to where they started, so the Short loops. */
const CX = G.CX, CY = G.CY;
const TITLE_BG = "#2f2bff", TITLE_FG = "#ffe14d";
const W_ = (id, w, n) => G.w(id, w, n);
const DUR = TIMELINE.duration;
const PL = { baikonur: [45.92, 63.34], moscow: [55.75, 37.62], dc: [38.9, -77.0], saratov: [51.27, 45.99], lz1: [28.486, -80.544], starbase: [25.997, -97.157] };
const E = [["#ff9a1f", "#1f6bff"], ["#ff4fd8", "#2bd94a"], ["#2fd9ff", "#ff3d7f"], ["#ffe94a", "#8a4dff"]];
const TINTS = [[1, 0.42, 0.95, 0.55], [0.35, 0.9, 1, 0.5], [1, 0.95, 0.3, 0.5], [0.4, 1, 0.5, 0.5]];
const STAMP_Y = 1330;
const D2R = Math.PI / 180;
/* Shorts-safe text: keep every text inside x 36-1044 (x 36-916 below y 820, the button column) and y 160-1500 */
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
/* a sung line, word by word at fixed safe spots: [x, y, style, rot, colours] */
function sing(T, words, t0, every, spots) {
  words.forEach((w, i) => { const t = t0 + i * every; if (T < t) return; const [x, y, st, rot, col] = spots[i]; put(w, x, y, { style: st, size: 200, colors: col, glow: "#ff4fd8", rot: rot, scale: G.pop(T, t, 0.14) }); });
}
function titleCard(T, t) {
  G.bg(TITLE_BG);
  const s = 1 + t * 0.015;
  G.text("history of", CX, 560, { font: "casual", size: 132, color: TITLE_FG, scale: s });
  G.text("space travel", CX, 730, { font: "casual", size: 150, color: TITLE_FG, scale: s, maxw: 900 });
  put("i guess", 470, 930, { font: "casual", size: 132, color: TITLE_FG, scale: s });
}
/* a point on an inclined circular orbit: node longitude, inclination, angle along the orbit (radians), height */
function orbit(P, lonN, inc, th, h) {
  const la = Math.asin(Math.sin(inc * D2R) * Math.sin(th)) / D2R;
  const lo = lonN + Math.atan2(Math.cos(inc * D2R) * Math.sin(th), Math.cos(th)) / D2R;
  return P.pt(la, lo, h);
}
function trail(P, lonN, inc, th1, len, h, col, w) {
  const c = G.ctx(); c.save(); c.lineCap = "round";
  const n = 40;
  for (let i = 0; i < n; i++) {
    const a = orbit(P, lonN, inc, th1 - (len * i) / n, h), b = orbit(P, lonN, inc, th1 - (len * (i + 1)) / n, h);
    if (!a.vis || !b.vis) continue;
    c.globalAlpha = 0.75 * (1 - i / n); c.strokeStyle = col || "#ffffff"; c.lineWidth = (w || 5) * (1 - i / n * 0.6);
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  }
  c.restore();
}
/* radio rings from a point, one set per beep time */
function rings(x, y, T, times) {
  const c = G.ctx(); c.save();
  times.forEach((t0) => { for (let j = 0; j < 3; j++) { const k = (T - t0 - j * 0.1) / 0.6; if (k <= 0 || k >= 1) continue; c.globalAlpha = 1 - k; c.strokeStyle = "#bff4ff"; c.lineWidth = 6; c.shadowColor = "#7fe0ff"; c.shadowBlur = 14; c.beginPath(); c.arc(x, y, 40 + k * 190, 0, 7); c.stroke(); } });
  c.restore();
}
/* the opening picture, a function of "loop time": 0 at the first frame, DUR at the end comes back to it exactly */
function openView(T, tl, o) {
  o = o || {};
  const P = G.globe(T, { lat: 22, lon: 62 + tl * 6, r: 430, sun: 0.3, drift: tl * 12 });
  const th = 2.2 + tl * 1.5;
  trail(P, 20, 65, th, 2.4, 0.33, "#e8f6ff", 5);
  const s = orbit(P, 20, 65, th, 0.33);
  if (s.vis) G.prop("sputnik", s.x, s.y, 250, { ry: th * 0.5 + 1.2, rz: 0.4, rx: 0.3 });
  if (!o.silent) rings(s.x, s.y, T, o.beeps || []);
  return { P, s };
}
/* a little stray dog (a 2D gag), sitting on (0, 0) */
function dog(c, s) {
  c.save(); c.scale(s, s); c.lineWidth = 5; c.strokeStyle = "#3a2a1a"; c.lineJoin = "round"; c.lineCap = "round";
  c.fillStyle = "#e6c89a";
  c.beginPath(); c.ellipse(0, -60, 54, 40, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-50, -60); c.quadraticCurveTo(-90, -80, -84, -112); c.stroke();
  [[-30, 1], [26, -1]].forEach(([x]) => { c.beginPath(); c.moveTo(x, -30); c.lineTo(x, 0); c.stroke(); });
  c.beginPath(); c.arc(46, -112, 38, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#fff"; c.beginPath(); c.ellipse(46, -98, 22, 16, 0, 0, 7); c.fill();
  c.fillStyle = "#c79a5e"; [[20, -150, -0.4], [72, -150, 0.4]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(x, y, 13, 26, r, 0, 7); c.fill(); c.stroke(); });
  c.fillStyle = "#1a1a1a"; [[34, -118], [58, -118]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); });
  c.beginPath(); c.ellipse(46, -102, 8, 6, 0, 0, 7); c.fill();
  c.restore();
}
/* a postage stamp with the dog on it */
function stamp(x, y, w, k, rot, col, yr) {
  if (k <= 0) return;
  G.withT({ x: x, y: y, scale: k, rot: rot }, () => {
    const c = G.ctx(), h = w * 1.25;
    c.fillStyle = "rgba(0,0,0,0.4)"; c.fillRect(-w / 2 + 10, -h / 2 + 12, w, h);
    c.fillStyle = "#fbf7ee"; c.fillRect(-w / 2, -h / 2, w, h);
    c.fillStyle = "#1a1a24"; for (let i = 0; i <= 10; i++) { [[-w / 2 + (i * w) / 10, -h / 2], [-w / 2 + (i * w) / 10, h / 2]].forEach(([px, py]) => { c.beginPath(); c.arc(px, py, w * 0.022, 0, 7); c.fill(); }); }
    for (let i = 0; i <= 12; i++) { [[-w / 2, -h / 2 + (i * h) / 12], [w / 2, -h / 2 + (i * h) / 12]].forEach(([px, py]) => { c.beginPath(); c.arc(px, py, w * 0.022, 0, 7); c.fill(); }); }
    c.fillStyle = col; c.fillRect(-w * 0.4, -h * 0.4, w * 0.8, h * 0.66);
    c.save(); c.translate(-w * 0.04, h * 0.18); dog(c, w / 330); c.restore();
    c.fillStyle = "#1a1a24"; c.font = "400 " + Math.round(w * 0.13) + "px " + G.FONT.sans; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(yr, 0, h * 0.4);
  });
}
/* a little capsule ball with someone in the window */
function capsule(x, y, s, rot) {
  G.withT({ x: x, y: y, scale: s, rot: rot || 0 }, () => {
    const c = G.ctx();
    const g = c.createRadialGradient(-18, -22, 6, 0, 0, 60); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#9aa0aa");
    c.fillStyle = g; c.strokeStyle = "#2a2d33"; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 56, 0, 7); c.fill(); c.stroke();
    c.fillStyle = "#13253f"; c.beginPath(); c.arc(14, -8, 22, 0, 7); c.fill(); c.stroke();
    c.strokeStyle = "#ffffff"; c.lineWidth = 3; c.beginPath(); c.arc(14, -12, 7, 0, 7); c.stroke(); c.beginPath(); c.moveTo(14, -5); c.lineTo(14, 6); c.stroke();
  });
}
/* a flag on a pole (no emblem), standing at (0, 0); fall 0..1 tips it over */
function flag(c, s, fall, T) {
  c.save(); c.scale(s, s); c.rotate(fall * 1.45);
  c.strokeStyle = "#d9dde3"; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -230); c.stroke();
  const w = 150, h = 92;
  for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? "#ffffff" : "#d22b37"; c.fillRect(3, -228 + (i * h) / 7, w, h / 7 + 0.5); }
  c.fillStyle = "#24346e"; c.fillRect(3, -228, w * 0.42, h * 0.55);
  c.fillStyle = "#ffffff"; for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(14 + i * 15, -218 + j * 15, 2.6, 0, 7); c.fill(); }
  c.restore();
}
/* the launch tower with its two catching arms; close 0..1 */
function tower(x, yBase, h, close) {
  const c = G.ctx(); c.save();
  c.strokeStyle = "#2e3138"; c.fillStyle = "#3a3e46"; c.lineWidth = 6;
  const w = 110, x0 = x - w / 2;
  c.fillRect(x0, yBase - h, w, h);
  c.strokeStyle = "#5c616b"; c.lineWidth = 4;
  for (let yy = yBase; yy > yBase - h; yy -= 70) { c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + w, yy - 70); c.moveTo(x0 + w, yy); c.lineTo(x0, yy - 70); c.stroke(); }
  const ay = yBase - h * 0.78;
  [[1, -1], [1, 1]].forEach(([_, side], i) => {
    const ang = side * (0.55 - 0.55 * G.clamp(close, 0, 1));
    c.save(); c.translate(x0 + w, ay + (i ? 70 : 0)); c.rotate(ang);
    c.fillStyle = "#4a4f59"; c.strokeStyle = "#20232a"; c.lineWidth = 4; c.fillRect(0, -16, 330, 32); c.strokeRect(0, -16, 330, 32);
    c.restore();
  });
  c.restore();
}

window.SCENES = [
  /* 0-2 s: the hook. a ball that beeps, and that's it */
  { name: "beep beep", at: 0, draw: (T, t) => {
      const b1 = W_("L1", "beep"), b2 = W_("L1", "beep", 2);
      const { s } = openView(T, T, { beeps: [b1, b2] });
      say(T, b1, "beep.", 300, 420, 190, { e: 0, rot: -6 });
      say(T, b2, "beep.", 420, 1290, 190, { e: 2, rot: 5 });
      say(T, W_("L1", "it"), "that's it.", 330, 640, 110, { e: 3, rot: -3 });
      if (G.on(T, W_("L1", "first"))) put("that's the first\nsatellite.", 470, 1110, { style: "emboss", size: 120, edges: E[1], rot: -4, scale: G.pop(T, W_("L1", "first"), 0.14), maxw: 840 });
    } },
  { name: "title", at: TIMELINE.title_start, draw: (T, t) => titleCard(T, t) },

  /* 1957: thrown up from kazakhstan, it just beeps */
  { name: "1957 launch", at: "L2", draw: (T, t) => {
      const tt = W_("L2", "throw"), ts = W_("L2", "space"), tb = W_("L2", "beeps");
      const cam = G.fly(T, [[G.L("L2"), { lat: 44, lon: 60, r: 1800 }], [G.L("L2") + 0.4, { lat: 45.6, lon: 63.3, r: 8000 }], [tt + 0.2, { lat: 45.6, lon: 63.3, r: 8000 }], [ts, { lat: 22, lon: 62 + 3, r: 470 }]]);
      const P = G.globe(T, Object.assign({ hi: "russia", drift: T * 8 }, cam));
      const d = G.dot(P, PL.baikonur[0], PL.baikonur[1], G.pop(T, G.L("L2") + 0.35), { size: 11 });
      if (T < ts) G.label(P, PL.baikonur[0] + 0.7, PL.baikonur[1], "the soviets", G.pop(T, W_("L2", "soviets"), 0.16), { size: 84, style: "misprint", dy: 0 });
      if (T < ts && d.vis) { const up = G.ease.in(G.prog(T, tt, 0.7)); G.prop("rocket", d.x, d.y - 230 - up * 1400, 640, { thrust: G.on(T, tt) ? 1 : 0, T: T, shadow: up < 0.05 ? 0.8 : 0 }); }
      if (G.on(T, ts)) {
        const th = 2.2 + (T - ts) * 1.5;
        trail(P, 20, 65, th, Math.min(2.4, (T - ts) * 1.5), 0.33, "#e8f6ff", 5);
        const s = orbit(P, 20, 65, th, 0.33);
        if (s.vis) { G.prop("sputnik", s.x, s.y, 250, { ry: th * 0.5 + 1.2, rz: 0.4, rx: 0.3 }); rings(s.x, s.y, T, [tb, tb + 0.35]); }
        if (G.on(T, tb)) put("beep", 330, 760, { style: "led", size: 120, color: "#ffffff", glow: "#bfe0ff", maxw: 420 });
        say(T, ts, "a metal ball", 340, 420, 120, { e: 1, rot: -4 });
      }
      G.stamp(1957, T, G.L("L2"), { y: STAMP_Y, x: 70 });
    } },
  { name: "three weeks, then dead", at: "L3", draw: (T, t) => {
      const tw = W_("L3", "three"), td = W_("L3", "dies");
      const dead = G.on(T, td);
      const P = G.globe(T, { lat: 22, lon: 65 + t * 10, r: 470, sun: 0.3, drift: T * 6 });
      const th = 2.2 + (T - W_("L2", "space")) * 1.5 + G.prog(T, tw, td - tw) * 14;
      trail(P, 20, 65, th, 2.4, 0.33, dead ? "#7a808a" : "#e8f6ff", 5);
      const s = orbit(P, 20, 65, th, 0.33);
      if (s.vis) { G.prop("sputnik", s.x, s.y, 250, { ry: th * 0.5 + 1.2, rz: 0.4, rx: 0.3 }); if (!dead) rings(s.x, s.y, T, [tw, tw + 0.3, tw + 0.6, tw + 0.9]); }
      say(T, tw, "for three weeks", 380, 400, 125, { e: 3, rot: -4 });
      if (!dead) put("day " + G.count(T, tw, td - 0.05, 1, 21), 430, 1200, { style: "led", size: 100, color: "#ffffff", glow: "#bfe0ff", maxw: 700 });
      if (dead) { put("battery dies.", 450, 1110, { style: "fuzzy", size: 150, color: "#2bd94a", glow: "#ff6fd8", rot: -4, scale: G.pop(T, td, 0.14), maxw: 820 }); say(T, td + 0.2, "(still going around)", 430, 1250, 70, { e: 2, rot: 2 }); }
      G.stamp(1957, T, 0, { y: STAMP_Y, x: 70 });
    } },
  { name: "america, nervous", at: "L4", draw: (T, t) => {
      const tv = W_("L4", "very");
      const P = G.globe(T, G.fly(T, [[G.L("L4"), { lat: 30, lon: -40, r: 700 }], [G.L("L4") + 0.35, { lat: 39, lon: -96, r: 1700 }]]));
      G.label(P, 40, -100, "america", G.pop(T, G.L("L4") + 0.2, 0.16), { size: 90, style: "misprint", dy: 0 });
      [[37, -104], [41, -92], [35, -86], [43, -78], [33, -97]].forEach(([la, lo], i) => { G.stander(P, la, lo, 0.06, { pose: "point", head: "#000", face: G.on(T, tv) ? "shock" : "smile" }); });
      const k = G.prog(T, G.L("L4"), 1.1);
      G.prop("sputnik", G.lerp(-100, 1180, k), 420 + Math.sin(k * 3) * 30, 210, { ry: T * 2, rz: 0.4, rx: 0.3 });
      rings(G.lerp(-100, 1180, k), 420, T, [G.L("L4") + 0.2, G.L("L4") + 0.6]);
      if (G.on(T, tv)) { const sh = Math.sin(T * 80) * 6; put("VERY NERVOUS", 470 + sh, 1220, { style: "shout", size: 130, color: "#ff3d7f", rot: -4, scale: G.pop(T, tv, 0.12), maxw: 800 }); }
      G.stamp(1957, T, 0, { y: STAMP_Y, x: 70 });
    } },

  /* the dog */
  { name: "laika", at: "L5", draw: (T, t) => {
      const tg = W_("L5", "goes"), tn = W_("L5", "lika");
      const cam = G.fly(T, [[G.L("L5"), { lat: 45, lon: 40, r: 1600 }], [G.L("L5") + 0.4, { lat: 54.8, lon: 37.6, r: 7500 }], [tg, { lat: 54.8, lon: 37.6, r: 7500 }], [tg + 0.5, { lat: 30, lon: 45, r: 470 }]]);
      const P = G.globe(T, Object.assign({ hi: "russia", drift: T * 8 }, cam));
      if (T < tg + 0.2) {
        G.label(P, PL.moscow[0] + 1.9, PL.moscow[1] - 0.6, "moscow", G.pop(T, W_("L5", "moscow"), 0.16), { size: 84, style: "misprint", dy: 0 });
        if (G.on(T, W_("L5", "dog"))) G.onGlobe(P, PL.moscow[0] - 0.4, PL.moscow[1] + 0.2, 0.05, (c, s) => dog(c, (s / 170) * G.pop(T, W_("L5", "dog"), 0.16)));
        say(T, W_("L5", "stray"), "a stray dog", 380, 420, 130, { e: 1, rot: -4 });
      } else {
        const th = -0.45 + (T - tg) * 0.75;
        trail(P, 40, 60, th, 1.0, 0.3, "#ffe7b0", 6);
        const s = orbit(P, 40, 60, th, 0.3);
        if (s.vis) G.withT({ x: s.x, y: s.y, scale: 1.5 }, () => {
          const c = G.ctx(); c.fillStyle = "#c9ced6"; c.strokeStyle = "#2a2d33"; c.lineWidth = 5;
          c.beginPath(); c.moveTo(-70, 60); c.lineTo(0, -90); c.lineTo(70, 60); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = "#13253f"; c.beginPath(); c.arc(0, 10, 36, 0, 7); c.fill(); c.stroke();
          c.save(); c.beginPath(); c.arc(0, 10, 34, 0, 7); c.clip(); c.translate(-36, 70); dog(c, 0.55); c.restore();
        });
        if (G.on(T, tn) && s.vis) put("laika", s.x, s.y + 190, { style: "misprint", size: 100, scale: G.pop(T, tn, 0.14) });
      }
      G.stamp(1957, T, 0, { y: STAMP_Y, x: 70 });
    } },
  { name: "stamps", at: "L6", draw: (T, t) => {
      G.globe(T, { lat: 30, lon: 45 + t * 8, r: 470, day: 0.55, drift: T * 6 });
      const ts = W_("L6", "stamps");
      stamp(300, 780, 300, G.pop(T, G.L("L6") + 0.1, 0.16), -9, "#d9443a", "1957");
      stamp(620, 1020, 280, G.pop(T, G.L("L6") + 0.3, 0.16), 7, "#2f6fd6", "1959");
      stamp(330, 1250, 260, G.pop(T, ts, 0.16), -4, "#2e9c5a", "1987");
      say(T, ts, "she ends up on stamps.", 470, 450, 120, { e: 0, rot: -4, maxw: 860 });
    } },

  /* 1961: let's go, once round the planet, home in under two hours */
  { name: "gagarin", at: "L7", draw: (T, t) => {
      const tl = W_("L7", "let's"), ta = W_("L7", "around");
      const cam = G.fly(T, [[G.L("L7"), { lat: 40, lon: 60, r: 1400 }], [G.L("L7") + 0.35, { lat: 45.6, lon: 63.3, r: 7500 }], [tl + 0.3, { lat: 45.6, lon: 63.3, r: 7500 }], [ta - 0.1, { lat: 25, lon: 60, r: 470 }]]);
      const P = G.globe(T, Object.assign({ hi: "russia", drift: T * 8 }, cam));
      const d = G.dot(P, PL.baikonur[0], PL.baikonur[1], 1, { size: 11 });
      if (T < ta - 0.1 && d.vis) { const up = G.ease.in(G.prog(T, tl, 0.8)); G.prop("rocket", d.x, d.y - 230 - up * 1500, 640, { thrust: G.on(T, tl) ? 1 : 0, T: T, shadow: up < 0.05 ? 0.8 : 0 }); }
      G.label(P, PL.baikonur[0] + 0.8, PL.baikonur[1], "yuri gagarin", T < tl ? G.pop(T, W_("L7", "yuri"), 0.16) : 0, { size: 84, style: "misprint", dy: 0 });
      if (G.on(T, tl) && T < ta) put("let's go.", 470, 520, { style: "emboss", size: 190, edges: E[1], rot: -5, scale: G.pop(T, tl, 0.14), maxw: 860 });
      if (G.on(T, ta - 0.1)) {
        const k = G.prog(T, ta, W_("L7", "planet") + 0.4 - ta);
        const th0 = 0.6, th = th0 + k * Math.PI * 2;
        const c = G.ctx(); c.save(); c.strokeStyle = "#fff3a0"; c.lineWidth = 7; c.shadowColor = "#ffcf4a"; c.shadowBlur = 18; c.beginPath(); let pen = false;
        for (let i = 0; i <= 80; i++) { const p = orbit(P, 40, 65, th0 + (th - th0) * (i / 80), 0.18); if (!p.vis) { pen = false; continue; } if (!pen) { c.moveTo(p.x, p.y); pen = true; } else c.lineTo(p.x, p.y); }
        c.stroke(); c.restore();
        const p = orbit(P, 40, 65, th, 0.18); if (p.vis) capsule(p.x, p.y, 0.9, th * 40);
        say(T, ta, "the whole planet", 400, 420, 120, { e: 2, rot: -4 });
      }
      G.stamp(1961, T, G.L("L7"), { y: STAMP_Y, x: 70 });
    } },
  { name: "home in under two hours", at: "L8", draw: (T, t) => {
      const th = W_("L8", "home");
      const P = G.globe(T, G.fly(T, [[G.L("L8"), { lat: 25, lon: 60, r: 470 }], [G.L("L8") + 0.4, { lat: 50.6, lon: 46.0, r: 7000 }]]));
      const d = P.pt(PL.saratov[0], PL.saratov[1], 0);
      const k = G.ease.out(G.prog(T, G.L("L8") + 0.3, 0.9));
      const cy = G.lerp(250, d.y - 60, k);
      G.withT({ x: d.x, y: cy - 200 }, () => { const c = G.ctx(); c.fillStyle = "#ff7a2a"; c.strokeStyle = "#7a2a00"; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 150, Math.PI, 0); c.closePath(); c.fill(); c.stroke(); c.fillStyle = "#ffffff"; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 150, Math.PI + i * Math.PI / 3, Math.PI + i * Math.PI / 3 + Math.PI / 6); c.closePath(); c.fill(); } c.strokeStyle = "#e8e8e8"; c.lineWidth = 3; c.beginPath(); c.moveTo(-150, 0); c.lineTo(0, 145); c.lineTo(150, 0); c.moveTo(0, 0); c.lineTo(0, 145); c.stroke(); });
      capsule(d.x, cy, 0.9, 0);
      put(G.count(T, G.L("L8"), W_("L8", "hours") + 0.2, 0, 108, (n) => Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0")), 420, 520, { style: "led", size: 150, color: "#ffffff", glow: "#bfe0ff", maxw: 520 });
      say(T, th, "home.", 360, 1180, 170, { e: 0, rot: -5 });
      G.stamp(1961, T, 0, { y: STAMP_Y, x: 70 });
    } },
  { name: "jingle: space!", at: "J1", draw: (T, t) => {
      const st = G.step(T, G.L("J1"), 0.24);
      const P = G.globe(T, { lat: 20, lon: 60 - t * 50, r: 430, tint: TINTS[st % 4], sun: 0.2, drift: T * 40 });
      const img = G.propImg("rocket", { thrust: 1, T: T });
      const r = G.rng(61);
      for (let i = 0; i < 14; i++) { const a = r() * Math.PI * 2, t0 = G.L("J1") + r() * 1.4, k = G.ease.in(G.prog(T, t0, 0.8)); if (k <= 0 || k >= 1) continue; const dist = 430 + k * 700; const x = P.c.x + Math.cos(a) * dist, y = P.c.y + Math.sin(a) * dist; G.withT({ x: x, y: y, rot: (a * 180) / Math.PI + 90 }, () => G.ctx().drawImage(img, -110, -110, 220, 220)); }
      const n = G.line("J1").notes;
      sing(T, ["spaaace!"], G.L("J1") + (n[0] ? n[0][0] : 0.3), 0.5, [[470, 1250, "wordart", -6, ["#fff36b", "#ff9a2e", "#ff3d7f"]]]);
    } },

  /* 1969: the moon */
  { name: "1969 to the moon", at: "L9", draw: (T, t) => {
      const tl = W_("L9", "land"), tp = W_("L9", "plant");
      if (T < tl) {
        const k = G.ease.io(G.prog(T, G.L("L9"), tl - G.L("L9")));
        G.globe(T, { lat: 20, lon: -40, r: G.lerp(520, 150, k), cx: G.lerp(CX, 230, k), cy: G.lerp(CY, 360, k), drift: T * 10 });
        G.globe(T, { body: "moon", lat: 0, lon: 20, r: G.lerp(90, 900, k), cx: G.lerp(860, 600, k), cy: G.lerp(1450, 1400, k), sun: 0.6, stars: false });
        const c = G.ctx(); c.save(); c.strokeStyle = "#fff3a0"; c.lineWidth = 6; c.setLineDash([18, 14]); c.shadowColor = "#ffcf4a"; c.shadowBlur = 14;
        c.beginPath(); c.moveTo(G.lerp(CX, 230, k) + 100, G.lerp(CY, 360, k) + 80); c.quadraticCurveTo(900, 500, G.lerp(860, 600, k), G.lerp(1450, 1400, k) - G.lerp(90, 900, k) * 0.9 - 20); c.stroke(); c.restore();
        put("1969", 520, 760, { style: "emboss", size: 260, edges: E[2], rot: -4, scale: G.pop(T, G.L("L9"), 0.14), maxw: 760 });
        return;
      }
      const P = G.globe(T, { body: "moon", lat: 0.67, lon: 23.47, r: 3200, sun: 0.45, cy: CY + 200 });
      G.globe(T, { lat: 15, lon: -40, r: 90, cx: 230, cy: 330, stars: false });
      const kd = G.ease.out(G.prog(T, tl, 0.45));
      G.prop("lander", 520, G.lerp(400, 1000, kd), 560, { rx: 0.12, ry: 0.5, shadow: kd > 0.9 ? 1 : 0 });
      if (G.on(T, tp)) {
        G.stick(250, 1250, 0.9, { pose: "point", head: "#ddd", face: "none" }); G.stick(800, 1250, 0.9, { pose: "up", head: "#ddd", face: "none" });
        G.withT({ x: 380, y: 1270, scale: G.pop(T, tp, 0.16) }, () => flag(G.ctx(), 1.1, 0, T));
        say(T, tp, "plant a flag.", 470, 470, 130, { e: 3, rot: -4 });
      } else say(T, tl, "the moon.", 460, 470, 150, { e: 1, rot: -4 });
      G.stamp(1969, T, tl, { y: STAMP_Y, x: 70 });
    } },
  { name: "the flag blows over", at: "L10", draw: (T, t) => {
      const tl = W_("L10", "leave"), tb = W_("L10", "blows");
      G.globe(T, { body: "moon", lat: 0.67, lon: 23.47, r: 3200, sun: 0.45, cy: CY + 200 });
      G.globe(T, { lat: 15, lon: -40, r: 90, cx: 230, cy: 330, stars: false });
      const up = G.ease.in(G.prog(T, tl + 0.2, 1.8)) * 6;
      G.prop("lander", 520, 1000, 560, { rx: 0.12, ry: 0.5, ascent: up, shadow: 1 });
      if (up > 0.05) G.burst(520, 1130, T, tl + 0.25, { n: 30, r: 420, color: "#d8d2c4", dur: 0.8 });
      G.withT({ x: 380, y: 1270 }, () => flag(G.ctx(), 1.1, G.ease.back(G.prog(T, tb, 0.35)), T));
      if (T < tl + 0.3) { G.stick(250, 1250, 0.9, { pose: "stand", head: "#ddd", face: "none" }); G.stick(800, 1250, 0.9, { pose: "stand", head: "#ddd", face: "none" }); }
      say(T, tl, "when they leave,", 450, 440, 120, { e: 0, rot: -4 });
      if (G.on(T, tb)) put("the flag\nblows over.", 470, 640, { style: "misprint", size: 130, rot: 5, scale: G.pop(T, tb, 0.14), maxw: 800 });
      G.stamp(1969, T, 0, { y: STAMP_Y, x: 70 });
    } },
  { name: "twelve, then nobody", at: "L11", draw: (T, t) => {
      const t72 = W_("L11", "1972"), ts = W_("L11", "stops");
      /* one landing every 0.18 s, two people each: Apollo 11 + 12 (1969) -> 4, 14 + 15 (1971) -> 8, 16 + 17 (1972) -> 12 */
      const step = Math.min(5, Math.max(0, Math.floor((T - G.L("L11")) / 0.18)));
      const P = G.globe(T, { body: "moon", lat: 5, lon: 34 - t * 13, r: 470 + t * 40, sun: 0.55, cy: CY + 80 });
      const spots = [[0.67, 23.47], [-3.0, -23.4], [-3.6, -17.5], [26.1, 3.6], [-9.0, 15.5], [20.2, 30.8]];
      for (let i = 0; i < 12; i++) {
        const [la, lo] = spots[Math.floor(i / 2)], k = G.pop(T, G.L("L11") + Math.floor(i / 2) * 0.18, 0.12);
        if (T < ts) G.stander(P, la + (i % 2) * 2.5, lo + (i % 2) * 2.5, 0.22 * k * (1 + 0.06 * Math.sin(T * 9 + i)), { pose: Math.floor(T * 4 + i) % 2 ? "stand" : "up", head: "#ddd", face: "none" });
        else G.onGlobe(P, la, lo, 0.1, (c, s) => flag(c, s / 230, 0, T));
      }
      put(T < ts ? String(2 * (step + 1)) : "0", 450, 470, { style: "led", size: 200, color: "#ffffff", glow: "#bfe0ff", maxw: 400 });
      say(T, G.L("L11"), "people on the moon", 470, 640, 90, { e: 2, rot: -3 });
      say(T, ts, "everyone just stops.", 450, 1260, 120, { e: 1, rot: -4, maxw: 820 });
      G.stamp(T < ts ? [1969, 1969, 1971, 1971, 1972, 1972][step] : 1972, T, 0, { y: STAMP_Y, x: 70 });
    } },
  { name: "2026 drive past it", at: "L12", draw: (T, t) => {
      const tf = W_("L12", "fly"), td = W_("L12", "drive");
      G.globe(T, { lat: 20, lon: -40 - t * 6, r: 170, cx: 250, cy: 420, drift: T * 6 });
      const P = G.globe(T, { body: "moon", lat: 0, lon: 20 - t * 3, r: 330, cx: 600, cy: 1100, sun: 0.6, stars: false });
      const k = G.prog(T, tf, td + 0.6 - tf);
      const path = (u) => { if (u < 0.45) { const v = u / 0.45; return [G.lerp(330, 600 + 380 * 0.0, v) + Math.sin(v * Math.PI) * 280, G.lerp(500, 720, v)]; } if (u < 0.75) { const a = -Math.PI / 2 + ((u - 0.45) / 0.3) * Math.PI * 1.2; return [600 + Math.cos(a) * 400, 1100 + Math.sin(a) * 400]; } const v = (u - 0.75) / 0.25; return [G.lerp(600 + Math.cos(-Math.PI / 2 + Math.PI * 1.2) * 400, 330, v), G.lerp(1100 + Math.sin(-Math.PI / 2 + Math.PI * 1.2) * 400, 500, v)]; };
      const c = G.ctx(); c.save(); c.strokeStyle = "#fff3a0"; c.lineWidth = 6; c.shadowColor = "#ffcf4a"; c.shadowBlur = 14; c.beginPath();
      for (let i = 0; i <= 60; i++) { const p = path(k * i / 60); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); c.restore();
      if (k > 0 && k < 1) { const p = path(k); capsule(p[0], p[1], 0.7, k * 300); }
      if (G.on(T, td)) put("drive past it.", 470, 600, { style: "emboss", size: 150, edges: E[3], rot: -5, scale: G.pop(T, td, 0.14), maxw: 820 });
      say(T, W_("L12", "four"), "four people", 640, 330, 100, { e: 0, rot: 3, maxw: 560 });
      G.stamp(2026, T, G.L("L12"), { y: STAMP_Y, x: 70 });
    } },

  /* 2000: the station that's never empty */
  { name: "2000 station", at: "L13", draw: (T, t) => {
      const tm = W_("L13", "move"), tn = W_("L13", "never");
      G.globe(T, { lat: 18, lon: -60 - t * 6, r: 2000, cy: CY + 1250, drift: T * 4 });
      G.prop("station", CX, 820, 1000, { rx: 0.55, ry: 0.35 + t * 0.06, rz: -0.08 });
      for (let i = 0; i < 3; i++) { const k = G.prog(T, tm + i * 0.15, 0.6); if (k > 0 && k < 1) G.stick(G.lerp(120 + i * 60, 520, k), G.lerp(1300, 860, k), 0.45 * (1 - k * 0.5), { pose: "up", head: "#000", face: "smile" }); }
      if (G.on(T, tn)) put("never been\nempty since.", 450, 1250, { style: "glow", size: 120, glow: "#2fd9ff", rot: -4, scale: G.pop(T, tn, 0.14), maxw: 800 });
      say(T, W_("L13", "space"), "a space station", 470, 380, 120, { e: 1, rot: -3 });
      G.stamp(2000, T, G.L("L13"), { y: STAMP_Y, x: 70 });
    } },
  { name: "sixteen sunrises", at: "L14", draw: (T, t) => {
      const ta = W_("L14", "about"), t16 = W_("L14", "16", 2), tsl = W_("L14", "sleeping");
      const spin = G.prog(T, t16, tsl - t16) * Math.PI * 2 * 16;
      const sd = [Math.sin(spin) * 0.85, 0.3, Math.cos(spin) * 0.85];
      const P = G.globe(T, { lat: 20, lon: -40 - t * 8, r: 430, sun: G.on(T, t16) ? 0.95 : 0.3, sunDir: G.on(T, t16) && T < tsl ? sd : undefined, drift: T * 6 });
      const th = 0.5 + G.prog(T, ta, W_("L14", "day") + 0.2 - ta) * Math.PI * 2 * 3 + t * 0.6;
      trail(P, -60, 51.6, th, 2.0, 0.22, "#ffffff", 4);
      const s = orbit(P, -60, 51.6, th, 0.22);
      if (s.vis) G.prop("station", s.x, s.y, 300, { rx: 0.6, ry: th });
      if (T < t16) put("laps: " + G.count(T, ta, W_("L14", "day"), 1, 16), 420, 1300, { style: "led", size: 100, color: "#ffffff", glow: "#bfe0ff", maxw: 700 });
      else if (T < tsl) put("sunrises: " + G.count(T, t16, tsl - 0.1, 1, 16), 420, 1300, { style: "led", size: 100, color: "#ffe9a0", glow: "#ffb000", maxw: 760 });
      say(T, W_("L14", "16"), "16 times a day", 420, 420, 120, { e: 3, rot: -4 });
      if (G.on(T, tsl)) {
        G.withT({ x: 760, y: 820, rot: 20 }, () => { const c = G.ctx(); c.fillStyle = "#3d6fd6"; c.strokeStyle = "#16244f"; c.lineWidth = 6; G.rrect(c, -60, -200, 120, 330, 55); c.fill(); c.stroke(); c.fillStyle = "#f2e2c8"; c.beginPath(); c.arc(0, -150, 38, 0, 7); c.fill(); c.stroke(); c.fillStyle = "#222"; c.fillRect(-20, -154, 14, 4); c.fillRect(6, -154, 14, 4); });
        ["z", "z", "z"].forEach((z, i) => put(z, 830 + i * 30, 560 - i * 50 + Math.sin(T * 3 + i) * 8, { style: "edges", size: 60 + i * 15, edges: E[1] }));
        say(T, tsl, "sleeping is weird.", 430, 1250, 120, { e: 2, rot: -4, maxw: 820 });
      }
      G.stamp(2000, T, 0, { y: STAMP_Y, x: 70 });
    } },

  /* 2015: a rocket lands standing up; now: chopsticks */
  { name: "2015 rocket lands", at: "L15", draw: (T, t) => {
      const tl = W_("L15", "lands"), ts = W_("L15", "standing");
      const cam = G.fly(T, [[G.L("L15"), { lat: 32, lon: -86, r: 1500 }], [G.L("L15") + 0.45, { lat: 27.9, lon: -80.6, r: 9000 }]]);
      const P = G.globe(T, Object.assign({ hi: "gulf", drift: T * 6 }, cam));
      const d = G.dot(P, PL.lz1[0], PL.lz1[1], G.pop(T, G.L("L15") + 0.4), { size: 11 });
      G.label(P, PL.lz1[0] - 0.5, PL.lz1[1] - 0.9, "florida", G.pop(T, G.L("L15") + 0.4, 0.16), { size: 80, style: "misprint", dy: 0 });
      const k = G.ease.out(G.prog(T, W_("L15", "rocket"), tl - W_("L15", "rocket")));
      if (k > 0) G.prop("rocket", d.x, G.lerp(-300, d.y - 170, k), 640, { thrust: k < 1 ? 1 : 0, legs: G.prog(T, W_("L15", "down"), 0.4), T: T, shadow: k > 0.8 ? 0.9 : 0 });
      if (G.on(T, tl)) G.burst(d.x, d.y, T, tl, { n: 26, r: 300, color: "#e8e4dc", dur: 0.7 });
      say(T, W_("L15", "comes"), "comes back down", 450, 420, 120, { e: 0, rot: -4 });
      if (G.on(T, ts)) put("standing up.", 440, 1200, { style: "wordart", size: 140, colors: ["#ffffff", "#9fe8ff", "#2f8cff"], outline: "#0b2a5a", rot: -4, scale: G.pop(T, ts, 0.14), maxw: 760 });
      G.stamp(2015, T, G.L("L15"), { y: STAMP_Y, x: 70 });
    } },
  { name: "chopsticks", at: "L16", draw: (T, t) => {
      const tc = W_("L16", "catch"), tg = W_("L16", "giant");
      const P = G.globe(T, G.fly(T, [[G.L("L16"), { lat: 27, lon: -90, r: 2500 }], [G.L("L16") + 0.35, { lat: 25.3, lon: -97.4, r: 9000 }]]));
      const d = P.pt(PL.starbase[0], PL.starbase[1], 0);
      const base = Math.min(d.y + 260, 1500);
      tower(260, base, 1050, G.ease.out(G.prog(T, tg + 0.2, 0.35)));
      const k = G.ease.out(G.prog(T, tc - 0.2, W_("L16", "chopsticks") - tc + 0.4));
      G.prop("rocket", 560, G.lerp(-500, base - 1050 * 0.78 + 260, k), 1300, { thrust: k < 1 ? 1 : 0, T: T });
      say(T, tc, "they catch them", 520, 360, 110, { e: 3, rot: -3 });
      if (G.on(T, tg)) put("with giant\nchopsticks.", 520, 1200, { style: "edges", size: 120, edges: E[1], rot: -4, scale: G.pop(T, tg, 0.14), maxw: 760 });
      G.stamp(2024, T, G.L("L16"), { y: STAMP_Y, x: 70 });
    } },
  { name: "jingle: chopsticks!", at: "J2", draw: (T, t) => {
      const st = G.step(T, G.L("J2"), 0.24);
      G.globe(T, { lat: 25.3, lon: -97.4, r: 9000, hi: "gulf", tint: TINTS[st % 4] });
      const clack = Math.abs(Math.sin((T - G.L("J2")) * Math.PI * 4));
      tower(260, 1500, 1050, 0.55 + 0.45 * clack);
      G.prop("rocket", 560, 1500 - 1050 * 0.78 + 260 + Math.sin(T * 12) * 6, 1300, { T: T });
      const n = G.line("J2").notes;
      sing(T, ["chooop-", "stiiicks!"], G.L("J2") + (n[0] ? n[0][0] : 0.2), 0.55, [[560, 420, "glow", -5], [470, 1250, "wordart", 4, ["#c8ff9a", "#29e06a", "#0b8a3a"]]]);
    } },

  /* the reveal: never a day without people up there */
  { name: "never a day", at: "L17", draw: (T, t) => {
      const tu = W_("L17", "under"), tn = W_("L17", "never"), tsp = W_("L17", "space");
      const P = G.globe(T, { lat: 22, lon: -60 - t * 8, r: 360, cy: CY - 120, sun: 0.3, drift: T * 6 });
      const th = 0.5 + t * 1.3;
      trail(P, -60, 51.6, th, 2.0, 0.22, "#ffffff", 4);
      const s = orbit(P, -60, 51.6, th, 0.22);
      if (s.vis) G.prop("station", s.x, s.y, 280, { rx: 0.6, ry: th });
      say(T, tu, "under 26?", 400, 400, 150, { e: 0, rot: -5 });
      if (G.on(T, tn)) {
        put(G.count(T, tn, tsp + 0.1, 1, 9499), 470, 1170, { style: "led", size: 230, color: "#ffffff", glow: "#7fd8ff", maxw: 820 });
        put("days in a row with people in space", 440, 1330, { style: "edges", size: 54, edges: E[2], maxw: 780 });
        put("since nov 2, 2000", 440, 1400, { style: "edges", size: 44, edges: E[3], maxw: 600 });
      }
      if (G.on(T, W_("L17", "day"))) put("never been a day\nwithout people up there.", 520, 640, { style: "emboss", size: 92, edges: E[1], rot: -4, scale: G.pop(T, W_("L17", "day"), 0.14), maxw: 860 });
    } },
  /* back to the start: the loop */
  { name: "it all started with a beep", at: "L18", draw: (T, t) => {
      const tb = W_("L18", "beat");
      const fade = 1 - G.prog(T, DUR - 0.45, 0.3);
      const { s } = openView(T, T - DUR, { beeps: [tb] });
      if (fade > 0) {
        G.ctx().save(); G.ctx().globalAlpha = fade;
        say(T, W_("L18", "started"), "it all started", 380, 420, 120, { e: 3, rot: -4 });
        say(T, tb, "beep.", 300 + 400 * 0, 640, 190, { e: 0, rot: -6 });
        G.ctx().restore();
      }
    } },
];
