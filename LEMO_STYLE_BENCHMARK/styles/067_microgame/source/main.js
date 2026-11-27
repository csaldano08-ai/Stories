// 067 · Microgame Frenzy — the first 10 s of "Last Train Home" as a rapid-fire party game show (lemo-opuscar styles/microgame).
// A narrative adaptation: each event of the 10 s is one microgame (a shouted command, one action, one result), each drawn in a
// different medium, with an original home stage between them: a sunburst studio, a chunky TV as the frame-within-the-frame, a
// station-master host with a hand bell, and the lives shown as three train tickets. The film starts inside a game and speeds up.
//   DODGE!  crayon on paper, 8 fps — she runs into the puddle anyway at 0.94 s: a wax splash, ✗, a ticket torn on the stage
//   RUN!    pixel street, 12 fps, a fuse timer on the beat — ✓
//   LOOK!   ink wash, 15 fps, one vermilion dot for her watch — she raises it at 6.05 s and lowers it at 7.15 s: ✓
//   READ!   amber terminal, hand-made glyph art of the dial; the seconds roll 47 → 48 at 8.4 s (inverse glyphs) — ✓
//   then the lights cut to one spot, the TV shows the station clock as a two-plate print, and the host rings the bell on the
//   chime (9.58 s): the final command slams in. AKI keeps three marks in every medium: the dark ponytail, the red coat, the watch.
// Page contract: window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, mulberry, hash } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const [GC, gg] = mk();                                                       // the current game, full frame
await Promise.all(['80px Titan', '50px Lilita', '40px VT'].map(f => document.fonts.load(f, 'AB09')));

// ═════════ the run (shared by every style)
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const X = t => RUN.pelvisAt(t)[0];
function poseAt(t) {
  const S_ = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S_.watch = w;
  if (w > 0) { const J0 = solveProfile(S_), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S_.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S_.arms.f.sh *= 1 - .45 * wm; S_.head += .26 * wm; S_.neck += .08 * wm; }
  return S_;
}
const SIM = (() => {
  const dt = 1 / 240, n = Math.ceil(11 / dt), tail = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const th = [-.2, -.1, 0], vt = [0, 0, 0], py = t => RUN.pelvisAt(t)[1], ay = t => (py(t + dt) - 2 * py(t) + py(t - dt)) / (dt * dt);
  for (let i = 0; i < n; i++) { const t = -.5 + i * dt, A = ay(t);
    for (let k = 0; k < 3; k++) { const par = k ? th[k - 1] : -.1, rest = .16 + .05 * k; vt[k] += (-60 * (th[k] - (par + rest)) - 6 * vt[k] + .014 * A * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; } }
  return { tail: t => tail.map(a => a[clamp(Math.round((t + .5) / dt), 0, n - 1)]) };
})();
// the figure's parts as polylines in screen space: M maps rig points; returns limbs (back to front) for each medium to draw its own way
function figure(t, M) {
  const J = solveProfile(poseAt(t)), out = [];
  const limb = (k, part) => { const a = J.arm[k], l = J.leg[k];
    if (part === 'arm') { const h = [a.wr[0] + (a.wr[0] - a.el[0]) * .25, a.wr[1] + (a.wr[1] - a.el[1]) * .25]; return [M(a.sh), M(a.el), M(a.wr), M(h)]; }
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch); return [M(l.hip), M(l.knee), M(l.ankle), M([l.ankle[0] + 62 * c, l.ankle[1] + 62 * s])]; };
  const TT = (b, u, f) => M([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  const coat = [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)];
  const hc = M(J.headC), hr = Math.hypot(...[0, 1].map(i => M([J.headC[0] + 46, J.headC[1]])[i] - hc[i]));
  const ta = SIM.tail(t); let an = Math.PI - .25 + ta[0] + J.headA, p = [J.headC[0] - Math.cos(J.headA) * 50, J.headC[1] - Math.sin(J.headA) * 50 - 10]; const tail = [M(p)];
  for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i]; p = [p[0] + Math.cos(an) * Lk, p[1] + Math.sin(an) * Lk]; tail.push(M(p)); an += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  const a = J.arm.n, watch = M([a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84]);
  return { J, armF: limb('f', 'arm'), legF: limb('f', 'leg'), coat, legN: limb('n', 'leg'), armN: limb('n', 'arm'), head: [hc, hr], tail, neck: [M(J.neckBase), M(J.neckTop)], watch, w: J.S.watch };
}
const stepT = (t, fps) => Math.floor(t * fps + 1e-6) / fps;                // characters step on their medium's frame rate (the ladder)

// ═════════ MEDIUM 1 · crayon on paper (DODGE!): wax colour drawn into a layer, then the paper's tooth bites holes into it
const [TOOTH] = mk(); { const q = TOOTH.getContext('2d'), r = mulberry(671); for (let i = 0; i < 26000; i++) { q.fillStyle = `rgba(255,255,255,${.4 + r() * .6})`; q.fillRect(r() * W, r() * H, 1 + r() * 2.5, 1 + r() * 1.5); } }
const [WAX, wx] = mk();
function crayonStroke(c, pts, w, col, seed, rough = 3) { const r = mulberry(seed); c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  for (let pass = 0; pass < 3; pass++) { c.lineWidth = w * (1 - pass * .18); c.beginPath(); pts.forEach((p, i) => { const x = p[0] + (r() - .5) * rough, y = p[1] + (r() - .5) * rough; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); } }
function crayonFill(c, poly, col, seed, ang = .6, gap = 7) { const r = mulberry(seed); c.save(); c.beginPath(); poly.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); c.clip();
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]), x0 = Math.min(...xs) - 40, x1 = Math.max(...xs) + 40, y0 = Math.min(...ys) - 40, y1 = Math.max(...ys) + 40;
  c.strokeStyle = col; c.lineWidth = gap * .95; c.lineCap = 'round'; c.beginPath();
  for (let k = x0 - (y1 - y0); k < x1; k += gap) { c.moveTo(k + (r() - .5) * 4, y1); c.lineTo(k + (y1 - y0) * ang + (r() - .5) * 4, y0); }
  c.stroke(); c.restore(); }
function gameCrayon(c, t) {
  c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, W, H);
  wx.clearRect(0, 0, W, H);
  const ts = stepT(t, 8), xc = X(ts), M = p => [760 + (p[0] - xc) * 1.2, 860 + p[1] * 1.2];
  // a scribbled night street: sky, a row of houses with lit windows, the pavement and the puddle
  crayonFill(wx, [[0, 0], [W, 0], [W, 520], [0, 520]], '#3b4a8c', 3, .5, 9);
  for (let i = 0; i < 7; i++) { const x = ((i * 330 - (xc - SPL.x) * .5) % 2310 + 2310) % 2310 - 200; crayonFill(wx, [[x, 560], [x + 260, 560], [x + 260, 250], [x + 130, 170], [x, 250]], ['#c98b5d', '#8d6db3', '#d0a24a'][i % 3], 10 + i); crayonFill(wx, [[x + 90, 330], [x + 170, 330], [x + 170, 420], [x + 90, 420]], '#ffd24a', 20 + i, .4, 5); }
  crayonFill(wx, [[0, 860], [W, 860], [W, H], [0, H]], '#8a8f99', 4, .7, 8);
  crayonStroke(wx, [[0, 860], [W, 862]], 9, '#2b2b2b', 5);
  const px = M([SPL.x + 44, 0])[0];
  crayonFill(wx, Array.from({ length: 24 }, (_, i) => { const a = i / 24 * TAU; return [px + Math.cos(a) * 230, 870 + Math.sin(a) * 34]; }), '#3d7fd6', 7, .3, 5);
  // AKI in wax: limbs as heavy strokes, a red coat, the black ponytail scribbled, a peach face
  const F = figure(ts, M);
  const lim = (pts, col, w, s) => crayonStroke(wx, pts, w, col, s, 4);
  lim(F.armF, '#9e2b25', 30, 31); lim(F.legF, '#2a3570', 38, 32); crayonFill(wx, F.coat, '#e0392e', 33, .8, 6); lim(F.coat.concat([F.coat[0]]), '#8c1e17', 7, 34);
  lim(F.legN, '#33408a', 40, 35); lim(F.neck, '#f2b48a', 22, 36);
  lim(F.tail, '#1b1b1b', 26, 37); crayonFill(wx, Array.from({ length: 18 }, (_, i) => [F.head[0][0] + Math.cos(i / 18 * TAU) * F.head[1], F.head[0][1] + Math.sin(i / 18 * TAU) * F.head[1]]), '#f2b48a', 38, .4, 5);
  crayonFill(wx, Array.from({ length: 12 }, (_, i) => { const a = Math.PI * .55 + i / 11 * Math.PI * 1.25; return [F.head[0][0] + Math.cos(a) * F.head[1] * 1.08, F.head[0][1] + Math.sin(a) * F.head[1] * 1.08]; }), '#1b1b1b', 39, .4, 5);
  lim(F.armN, '#e0392e', 30, 40); wx.fillStyle = '#ffcf2e'; wx.beginPath(); wx.arc(...F.watch, 11, 0, TAU); wx.fill();
  // the splash: wax drops and rings, scribbled
  const a = t - EV.splash;
  if (a > 0 && a < 1.3) { const r = mulberry(77); for (let i = 0; i < 16; i++) { const an = (200 + r() * 140) * Math.PI / 180, v = 700 + r() * 900, x = px + Math.cos(an) * v * a, y = 860 + Math.sin(an) * v * a + 1900 * a * a; if (y > 880) continue; crayonStroke(wx, [[x, y], [x + 6, y + 10]], 24 + r() * 16, '#3d7fd6', 50 + i, 6); }
    for (let j = 0; j < 2; j++) { const u = a - j * .2; if (u > 0) crayonStroke(wx, Array.from({ length: 30 }, (_, i) => { const an = i / 29 * TAU; return [px + Math.cos(an) * (120 + 300 * u), 872 + Math.sin(an) * (18 + 40 * u)]; }), 8, '#1f4f9c', 60 + j, 3); }
    if (a > .12) { wx.save(); wx.font = '150px Titan'; wx.fillStyle = '#3d7fd6'; wx.translate(Math.min(px + 200, 1350), 640); wx.rotate(-.15); wx.fillText('SPLAT', 0, 0); wx.restore(); } }
  wx.globalCompositeOperation = 'destination-out'; wx.drawImage(TOOTH, 0, 0); wx.globalCompositeOperation = 'source-over';
  c.drawImage(WAX, 0, 0);
}

// ═════════ MEDIUM 2 · pixel street (RUN!): a 320 × 180 indexed buffer, an auto outline on the sprite, scaled ×6
const PW = 320, PH = 180, [PB, pb] = mk(PW, PH), [PS, ps] = mk(PW, PH);
const PAL = ['#0f0e2a', '#25235a', '#3d3b8e', '#6a5fc1', '#f7d26a', '#ff9a3c', '#e3382f', '#7a1d22', '#f4c9a4', '#1a1a1a', '#5a6170', '#9aa3b5', '#2f8f6f', '#ffffff'];
function rasterCapsule(c, a, b, r, col) { c.fillStyle = col; const x0 = Math.floor(Math.min(a[0], b[0]) - r), x1 = Math.ceil(Math.max(a[0], b[0]) + r), y0 = Math.floor(Math.min(a[1], b[1]) - r), y1 = Math.ceil(Math.max(a[1], b[1]) + r);
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const u = clamp(((x + .5 - a[0]) * dx + (y + .5 - a[1]) * dy) / L2), qx = a[0] + dx * u - x - .5, qy = a[1] + dy * u - y - .5; if (qx * qx + qy * qy <= r * r) c.fillRect(x, y, 1, 1); } }
function rasterPoly(c, poly, col) { c.fillStyle = col; const ys = poly.map(p => p[1]); for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) { const xs = []; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; if ((p[1] <= y + .5) !== (q[1] <= y + .5)) xs.push(p[0] + (y + .5 - p[1]) / (q[1] - p[1]) * (q[0] - p[0])); } xs.sort((m, n) => m - n); for (let k = 0; k + 1 < xs.length; k += 2) c.fillRect(Math.round(xs[k]), y, Math.round(xs[k + 1]) - Math.round(xs[k]), 1); } }
function gamePixel(c, t) {
  const ts = stepT(t, 12), xc = X(ts), scroll = (xc - SPL.x) * .22;
  pb.fillStyle = PAL[0]; pb.fillRect(0, 0, PW, PH);
  for (let i = 0; i < 24; i++) { pb.fillStyle = PAL[13]; pb.fillRect(Math.floor((i * 53 - scroll * .1) % PW + PW) % PW, (i * 29) % 70, 1, 1); }
  for (let i = 0; i < 12; i++) { const x = Math.floor(((i * 61 - scroll * .4) % (12 * 61) + 12 * 61) % (12 * 61)) - 40, h = 50 + (i * 37) % 40; pb.fillStyle = PAL[1]; pb.fillRect(x, 140 - h, 54, h); pb.fillStyle = PAL[4]; for (let k = 0; k < 6; k++) if (hash(i * 7 + k) > .4) pb.fillRect(x + 6 + (k % 3) * 16, 140 - h + 8 + Math.floor(k / 3) * 14, 6, 6); }
  for (let i = 0; i < 9; i++) { const x = Math.floor(((i * 90 - scroll) % 810 + 810) % 810) - 60; pb.fillStyle = PAL[2]; pb.fillRect(x, 96, 80, 44); pb.fillStyle = PAL[5]; pb.fillRect(x + 8, 104, 40, 22); pb.fillStyle = PAL[6]; pb.fillRect(x, 92, 80, 4); }
  pb.fillStyle = PAL[10]; pb.fillRect(0, 140, PW, 40); pb.fillStyle = PAL[11]; for (let x = -((scroll * 1.0) % 16); x < PW; x += 16) pb.fillRect(Math.floor(x), 140, 1, 40); pb.fillRect(0, 140, PW, 1);
  // the sprite, rasterised from the rig without anti-aliasing, then an automatic one-pixel ink outline
  ps.clearRect(0, 0, PW, PH);
  const M = p => [120 + (p[0] - xc) * .19, 140 + p[1] * .19], F = figure(ts, M);
  const cap3 = (pts, r, col) => { for (let i = 1; i < pts.length; i++) rasterCapsule(ps, pts[i - 1], pts[i], r, col); };
  cap3(F.armF.slice(0, 3), 2.2, PAL[7]); cap3(F.legF.slice(0, 3), 2.8, PAL[2]); rasterCapsule(ps, F.legF[2], F.legF[3], 1.8, PAL[9]);
  rasterPoly(ps, F.coat, PAL[6]); cap3(F.legN.slice(0, 3), 2.9, PAL[3]); rasterCapsule(ps, F.legN[2], F.legN[3], 2, PAL[9]);
  cap3(F.tail, 2.2, PAL[9]); rasterCapsule(ps, F.head[0], F.head[0], F.head[1], PAL[8]); rasterCapsule(ps, [F.head[0][0] - 2, F.head[0][1] - 2], [F.head[0][0] - 3, F.head[0][1] - 3], F.head[1] * .85, PAL[9]);
  cap3(F.armN.slice(0, 3), 2.2, PAL[6]); rasterCapsule(ps, F.armN[2], F.armN[3], 1.6, PAL[8]); ps.fillStyle = PAL[4]; ps.fillRect(Math.round(F.watch[0]), Math.round(F.watch[1]), 2, 2);
  const id = ps.getImageData(0, 0, PW, PH), d = id.data, o = new Uint8ClampedArray(d);
  for (let y = 1; y < PH - 1; y++) for (let x = 1; x < PW - 1; x++) { const i = (y * PW + x) * 4; if (d[i + 3]) continue; if (d[i + 7] || d[i - 1] || d[i + PW * 4 + 3] || d[i - PW * 4 + 3]) { o[i] = 10; o[i + 1] = 10; o[i + 2] = 20; o[i + 3] = 255; } }
  ps.putImageData(new ImageData(o, PW, PH), 0, 0); pb.drawImage(PS, 0, 0);
  c.imageSmoothingEnabled = false; c.drawImage(PB, 0, 0, W, H); c.imageSmoothingEnabled = true;
}

// ═════════ MEDIUM 3 · ink wash (LOOK!): pale wet washes, dark dry structure, one vermilion dot for the watch
const [WET, wt] = mk();
function gameInk(c, t) {
  c.fillStyle = '#f1ead9'; c.fillRect(0, 0, W, H);
  const r = mulberry(91); c.globalAlpha = .06; c.strokeStyle = '#7a6a50'; for (let i = 0; i < 400; i++) { const x = r() * W, y = r() * H; c.beginPath(); c.moveTo(x, y); c.lineTo(x + r() * 18, y + r() * 6); c.stroke(); } c.globalAlpha = 1;
  const ts = stepT(t, 15), xc = X(ts), M = p => [880 + (p[0] - xc) * 1.25, 880 + p[1] * 1.25];
  // distant roofs in a pale wash, rain in dry hair strokes
  wt.clearRect(0, 0, W, H); wt.filter = 'blur(10px)'; wt.fillStyle = 'rgba(60,60,70,.22)';
  for (let i = 0; i < 6; i++) { const x = ((i * 380 - (xc - SPL.x) * .25) % 2280 + 2280) % 2280 - 300; wt.beginPath(); wt.moveTo(x, 560); wt.lineTo(x + 160, 420); wt.lineTo(x + 320, 560); wt.lineTo(x + 320, 760); wt.lineTo(x, 760); wt.fill(); }
  wt.filter = 'none'; c.drawImage(WET, 0, 0);
  c.strokeStyle = 'rgba(40,40,50,.25)'; c.lineWidth = 1.4; for (let i = 0; i < 70; i++) { const x = (hash(i) * W + t * 60) % W, y = ((hash(i + 9) * H + t * 900) % H); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 5, y + 26); c.stroke(); }
  c.fillStyle = 'rgba(30,30,35,.85)'; c.fillRect(0, 880, W, 6);
  // AKI: a wet grey body wash (blurred), then dry dark strokes for the structure; the ponytail as one dark brush stroke
  const F = figure(ts, M);
  wt.clearRect(0, 0, W, H); wt.filter = 'blur(6px)'; wt.lineCap = 'round'; wt.lineJoin = 'round';
  const brush = (cx, pts, w, col) => { cx.strokeStyle = col; cx.lineWidth = w; cx.beginPath(); pts.forEach((p, i) => i ? cx.lineTo(...p) : cx.moveTo(...p)); cx.stroke(); };
  brush(wt, F.armF.slice(0, 3), 52, 'rgba(70,70,80,.62)'); brush(wt, F.legF.slice(0, 3), 64, 'rgba(70,70,80,.62)');
  wt.fillStyle = 'rgba(60,60,70,.55)'; wt.beginPath(); F.coat.forEach((p, i) => i ? wt.lineTo(...p) : wt.moveTo(...p)); wt.fill();
  brush(wt, F.legN.slice(0, 3), 66, 'rgba(50,50,60,.7)'); brush(wt, F.armN.slice(0, 3), 52, 'rgba(50,50,60,.66)');
  wt.filter = 'none'; c.drawImage(WET, 0, 0);
  for (const [pts, w] of [[F.armF, 6], [F.legF, 8], [F.legN, 9], [F.armN, 7]]) brush(c, pts, w, 'rgba(20,20,24,.9)');
  c.strokeStyle = 'rgba(20,20,24,.9)'; c.lineWidth = 7; c.beginPath(); F.coat.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); c.stroke();
  brush(c, F.tail, 26, 'rgba(15,15,18,.95)');
  c.fillStyle = 'rgba(15,15,18,.95)'; c.beginPath(); c.arc(F.head[0][0], F.head[0][1], F.head[1], 0, TAU); c.fill();
  c.fillStyle = '#f1ead9'; c.beginPath(); c.arc(F.head[0][0] + F.head[1] * .35, F.head[0][1] + F.head[1] * .15, F.head[1] * .62, 0, TAU); c.fill();
  // the one accent: the watch, a vermilion seal dot; rings of attention while she reads it
  c.fillStyle = '#d9381e'; c.beginPath(); c.arc(...F.watch, 15, 0, TAU); c.fill();
  if (F.w > .5) { c.strokeStyle = 'rgba(217,56,30,.6)'; c.lineWidth = 3; for (let k = 0; k < 2; k++) { const ph = (t * 1.6 + k / 2) % 1; c.globalAlpha = 1 - ph; c.beginPath(); c.arc(...F.watch, 24 + ph * 70, 0, TAU); c.stroke(); } c.globalAlpha = 1; }
}

// ═════════ MEDIUM 4 · amber terminal (READ!): hand-made glyph art of the dial and block digits; the seconds as inverse glyphs
const DIG = { '0': ['███', '█ █', '█ █', '█ █', '███'], '1': [' █ ', '██ ', ' █ ', ' █ ', '███'], '2': ['███', '  █', '███', '█  ', '███'], '3': ['███', '  █', ' ██', '  █', '███'], '4': ['█ █', '█ █', '███', '  █', '  █'],
  '5': ['███', '█  ', '███', '  █', '███'], '6': ['███', '█  ', '███', '█ █', '███'], '7': ['███', '  █', ' █ ', ' █ ', ' █ '], '8': ['███', '█ █', '███', '█ █', '███'], '9': ['███', '█ █', '███', '  █', '███'], ':': ['   ', ' ▪ ', '   ', ' ▪ ', '   '] };
const DIAL = ['      .-----------.      ', '   .-\'    12      \'-.   ', '  /   11        1     \\  ', ' |  10      |      2   | ', ' |          |          | ', '| 9         O         3 |', ' |                     | ', ' |  8               4  | ', '  \\   7          5    /  ', '   \'-.      6     .-\'   ', '      \'-----------\'      '];
function gameTerminal(c, t) {
  c.fillStyle = '#120a02'; c.fillRect(0, 0, W, H);
  const amber = '#ffb43c', dim = 'rgba(255,180,60,.45)', CW = 24, CH = 42;
  c.font = `${CH}px VT`; c.textBaseline = 'top';
  const row = (s, x, y, col = amber) => { c.fillStyle = col; c.fillText(s, x, y); };
  const lines = ['> WATCH.READ --live', '  wrist .... left arm raised', '  signal ... ok'];
  lines.forEach((s, i) => { const n = Math.floor(clamp((t - 7.62 - i * .12) * 40) * s.length); row(s.slice(0, n), 90, 250 + i * CH * 1.1, i ? dim : amber); });
  // the dial as glyph art, its hands drawn with line glyphs over it
  const dx = 1080, dy = 150; DIAL.forEach((s, i) => row(s, dx, dy + i * CH, dim));
  const cx = dx + 12 * CW + CW * .4, cy = dy + 5 * CH + CH * .5;
  const handG = (fr, L, ch) => { const a = fr * TAU; for (let k = 1; k <= L; k++) { const x = cx + Math.sin(a) * k * CW * 1.05, y = cy - Math.cos(a) * k * CH * .55; row(ch, x - CW * .4, y - CH * .5); } };
  const s = 47 + (t >= 8.4 ? 1 : 0);
  handG((11 + 58 / 60) / 12, 3, '#'); handG(58 / 60, 5, '*'); handG(s / 60, 6, '.');
  // the time in block digits; the seconds as inverse glyphs (the accent), rolling over on the tick
  const str = `11:58:${s}`, bx = 90, by = 500, cell = 30;
  let x = bx;
  for (let i = 0; i < str.length; i++) { const D = DIG[str[i]], inv = i >= 6, roll = inv && s === 48 ? eo(seg(t, 8.4, 8.5)) : 1;
    D.forEach((r_, ry) => [...r_].forEach((ch, rx) => { if (ch === ' ') return; const yy = by + ry * cell * 1.3 - (1 - roll) * 40; if (inv) { c.fillStyle = amber; c.fillRect(x + rx * cell, yy, cell - 3, cell * 1.3 - 3); } else { c.fillStyle = amber; c.fillRect(x + rx * cell + 3, yy + 3, cell - 8, cell * 1.3 - 9); } }));
    x += (str[i] === ':' ? 2.2 : 3.6) * cell; }
  row(`  ${120 - s} s to 12:00:00`, 90, 740, amber); if (Math.floor(t * 2.4) % 2) row('_', 90 + 22 * CW, 740);
  // phosphor: a soft glow and scanlines
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .35; c.filter = 'blur(6px)'; c.drawImage(c.canvas, 0, 0); c.restore(); c.filter = 'none';
  c.fillStyle = 'rgba(0,0,0,.28)'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2);
}

// ═════════ the home stage: sunburst, a chunky TV (the frame-within-the-frame), the lives board (train tickets), the host
const HP = { ground: '#2a0f5c', ray: '#3a1878', mag: '#ff2e88', gold: '#ffc928', cyan: '#1fd1d1', ink: '#140a24', ok: '#2ecc71', fail: '#ff3b30', shade: '#1a0840' };
const TV = { x: 560, y: 230, w: 800, h: 600 }, SCR = { x: 600, y: 268, w: 640, h: 480 };   // screen = 1920 × 1080 scaled by 1/3 (exact 16:9 inside the TV's glass)
SCR.w = 640; SCR.h = 360; SCR.y = 330;
function toon(c, path, fill, sh = [16, 14]) { c.save(); c.translate(sh[0], sh[1]); c.fillStyle = HP.shade; path(c); c.fill(); c.restore(); c.fillStyle = fill; path(c); c.fill(); c.lineWidth = 7; c.strokeStyle = HP.ink; c.lineJoin = 'round'; c.stroke(); }
const rrect = (x, y, w, h, r) => c => { c.beginPath(); c.roundRect(x, y, w, h, r); };
function stage(c, t, o = {}) {
  c.fillStyle = HP.ground; c.fillRect(0, 0, W, H);
  c.save(); c.translate(W / 2, 600); c.rotate(t * .25); c.fillStyle = HP.ray; for (let i = 0; i < 16; i++) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 2000, i / 16 * TAU, (i + .5) / 16 * TAU); c.fill(); } c.restore();
  toon(c, rrect(-40, 860, 2000, 300, 0), '#6b2fb3', [0, 0]); c.fillStyle = 'rgba(255,255,255,.1)'; for (let x = -40; x < W; x += 120) c.fillRect(x, 860, 60, 240);
  // TV
  toon(c, rrect(TV.x, TV.y, TV.w, TV.h, 50), HP.mag); toon(c, rrect(TV.x + 20, TV.y + 70, TV.w - 40, TV.h - 140, 30), '#1b1038', [0, 0]);
  for (const [x, a] of [[TV.x + 300, -.5], [TV.x + 500, .5]]) { c.save(); c.translate(x, TV.y); c.rotate(a); toon(c, rrect(-6, -150, 12, 150, 6), HP.gold, [6, 6]); c.restore(); }
  toon(c, rrect(TV.x + 120, TV.y + TV.h - 50, 90, 30, 10), HP.gold, [6, 6]); toon(c, rrect(TV.x + TV.w - 210, TV.y + TV.h - 50, 90, 30, 10), HP.cyan, [6, 6]);
  // lives: train tickets, a torn one when a game was lost
  const lives = o.lives ?? 3;
  for (let i = 0; i < 3; i++) { const x = 70 + i * 150, y = 60, torn = i >= lives, crack = o.crack && i === lives ? o.crack : 0;
    c.save(); c.translate(x + (crack ? Math.sin(crack * 50) * 6 * (1 - crack) : 0), y); if (torn) { c.globalAlpha = .35; c.rotate(.12); }
    toon(c, rrect(0, 0, 130, 70, 8), torn ? '#8a7fa6' : HP.gold, [8, 8]); c.fillStyle = HP.ink; c.font = '34px Lilita'; c.fillText('TICKET', 14, 48); c.setLineDash([6, 6]); c.lineWidth = 3; c.beginPath(); c.moveTo(100, 6); c.lineTo(100, 64); c.stroke(); c.setLineDash([]);
    if (torn) { c.strokeStyle = HP.fail; c.lineWidth = 8; c.beginPath(); c.moveTo(-6, 76); c.lineTo(136, -6); c.stroke(); } c.restore(); }
  // stage badge
  c.save(); c.translate(1700, 100); c.rotate(.06); toon(c, rrect(-130, -50, 260, 100, 50), HP.cyan, [8, 8]); c.fillStyle = HP.ink; c.font = '54px Lilita'; c.textAlign = 'center'; c.fillText(`STAGE ${o.stage ?? 1}`, 0, 18); c.restore();
  host(c, t, o);
}
// the host: an original station master — round, navy coat, a flat cap, a hand bell; he ticks on every beat
function host(c, t, o) {
  const beat = (t / .625) % 1, tick = o.still ? 0 : Math.pow(1 - beat, 4) * 10, x = 1560, y = 860 - tick;
  toon(c, c => { c.beginPath(); c.ellipse(x, y - 190, 150, 190, 0, 0, TAU); }, '#26386b');
  toon(c, c => { c.beginPath(); c.arc(x - 10, y - 420, 90, 0, TAU); }, '#f2c29a');
  toon(c, rrect(x - 110, y - 530, 200, 50, 12), '#26386b'); toon(c, rrect(x - 140, y - 488, 230, 22, 10), '#1a2547', [6, 6]);
  c.fillStyle = HP.ink; c.beginPath(); c.arc(x - 45, y - 425, 9, 0, TAU); c.arc(x + 15, y - 425, 9, 0, TAU); c.fill();
  c.lineWidth = 7; c.strokeStyle = HP.ink; c.beginPath(); if (o.fail) c.arc(x - 15, y - 365, 26, Math.PI * 1.15, Math.PI * 1.85); else c.arc(x - 15, y - 390, 30, Math.PI * .15, Math.PI * .85); c.stroke();
  for (let k = 0; k < 4; k++) { c.fillStyle = HP.gold; c.beginPath(); c.arc(x - 10, y - 290 + k * 45, 9, 0, TAU); c.fill(); c.stroke(); }
  // the bell arm: raised and swinging on the chime
  const ring = o.ring ?? 0, armA = lerp(.4, -1.3, ss(o.raise ?? 0)) + Math.sin(ring * 40) * .25 * (ring > 0 ? Math.exp(-ring * 4) : 0);
  c.save(); c.translate(x - 130, y - 300); c.rotate(armA); toon(c, rrect(-24, -24, 48, 190, 24), '#26386b', [8, 8]);
  c.translate(0, 190); toon(c, c => { c.beginPath(); c.moveTo(-50, 70); c.quadraticCurveTo(-46, 0, 0, -6); c.quadraticCurveTo(46, 0, 50, 70); c.closePath(); }, HP.gold, [8, 8]); toon(c, rrect(-8, -40, 16, 36, 6), '#7a4a1a', [4, 4]); c.restore();
  if (ring > 0 && ring < .8) { c.strokeStyle = HP.gold; c.lineWidth = 9; c.lineCap = 'round'; for (let i = 0; i < 5; i++) { const a = -2.6 + i * .32, r0 = 170 + ring * 160, r1 = r0 + 60; c.globalAlpha = 1 - ring; c.beginPath(); c.moveTo(x - 130 + Math.cos(a) * r0, y - 160 + Math.sin(a) * r0); c.lineTo(x - 130 + Math.cos(a) * r1, y - 160 + Math.sin(a) * r1); c.stroke(); } c.globalAlpha = 1; }
}
// the command word: slams in over three frames, holds, then shrinks into a corner tag before the action
function command(c, t, t0, word, o = {}) {
  const u = t - t0; if (u < 0) return;
  const hold = o.hold ?? .32, tag = o.fly ? 0 : ss(seg(u, hold, hold + .18)), fly = o.fly ? ss(seg(u, hold, hold + .25)) : 0;
  const slam = u < .1 ? lerp(1.9, .88, u / .1) : lerp(.88, 1, ss(seg(u, .1, .16)));
  const x = lerp(W / 2, 250, tag), y = lerp(H / 2 - (o.up ?? 0), 120, tag) - fly * 900, k = slam * lerp(1, .34, tag);
  c.save(); c.translate(x, y); c.rotate(-.07); c.scale(k, k);
  c.fillStyle = HP.gold; c.beginPath(); for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, r = i % 2 ? 230 : 330; c.lineTo(Math.cos(a) * r * 1.6, Math.sin(a) * r * .8); } c.closePath(); c.fill(); c.lineWidth = 8; c.strokeStyle = HP.ink; c.stroke();
  c.font = `${o.size ?? 210}px Titan`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.fillStyle = HP.mag; c.fillText(word, 14, 16); c.lineWidth = 26; c.strokeStyle = HP.ink; c.strokeText(word, 0, 0); c.fillStyle = '#fff'; c.fillText(word, 0, 0);
  c.restore();
}
// the fuse timer: one knot per beat, the spark passing each knot on the beat
function fuse(c, t, t0, t1) {
  const n = Math.round((t1 - t0) / .625), x0 = 300, x1 = 1620, y = 1010, u = clamp((t - t0) / (t1 - t0));
  c.strokeStyle = '#3a2a10'; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(lerp(x0, x1, u), y); c.lineTo(x1, y); c.stroke();
  for (let k = 1; k < n; k++) { const kx = lerp(x0, x1, k / n); if (kx < lerp(x0, x1, u)) continue; c.fillStyle = '#3a2a10'; c.beginPath(); c.arc(kx, y, 12, 0, TAU); c.fill(); }
  const sx = lerp(x0, x1, u); c.fillStyle = '#ffe14a'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 20; c.beginPath(); c.moveTo(sx, y); c.lineTo(sx + Math.cos(a) * 26, y + Math.sin(a) * 26); c.lineWidth = 5; c.strokeStyle = '#ffe14a'; c.stroke(); }
  c.beginPath(); c.arc(sx, y, 12, 0, TAU); c.fill();
}
function stamp(c, t, t0, ok, x, y, k = 1) { const u = t - t0; if (u < 0) return; const s = k * (u < .08 ? lerp(2.2, .9, u / .08) : lerp(.9, 1, ss(seg(u, .08, .14))));
  c.save(); c.translate(x, y); c.rotate(-.18); c.scale(s, s); c.lineWidth = 46; c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [col, w] of [[HP.ink, 46], [ok ? HP.ok : HP.fail, 26]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); if (ok) { c.moveTo(-90, 0); c.lineTo(-25, 70); c.lineTo(110, -90); } else { c.moveTo(-80, -80); c.lineTo(80, 80); c.moveTo(80, -80); c.lineTo(-80, 80); } c.stroke(); } c.restore(); }

// the station clock as a two-plate print (what the TV shows at the end): fluorescent pink and blue, halftone, misregistered
const [RISO, rq] = mk(); let RISO_DONE = false;
function risoClock() { if (RISO_DONE) return; RISO_DONE = true;
  const plate = (col, off, draw) => { const [p, q] = mk(); q.fillStyle = '#000'; draw(q); const [h, hq] = mk(); hq.fillStyle = col; for (let y = 0; y < H; y += 9) for (let x = (y / 9) % 2 ? 4.5 : 0; x < W; x += 9) { hq.beginPath(); hq.arc(x, y, 4.6, 0, TAU); hq.fill(); }
    hq.globalCompositeOperation = 'destination-in'; hq.drawImage(p, 0, 0); rq.globalCompositeOperation = 'multiply'; rq.drawImage(h, off[0], off[1]); rq.globalCompositeOperation = 'source-over'; };
  rq.fillStyle = '#f7f0e4'; rq.fillRect(0, 0, W, H);
  plate('#3255a4', [6, -4], q => { q.fillRect(0, 0, W, 760); q.clearRect(800, 80, 320, 900); });
  plate('#ff48b0', [-5, 5], q => { q.fillRect(800, 80, 320, 1000); q.beginPath(); q.moveTo(770, 90); q.lineTo(960, -60); q.lineTo(1150, 90); q.fill(); q.fillRect(0, 900, W, 180); });
  rq.fillStyle = '#f7f0e4'; rq.beginPath(); rq.arc(960, 420, 120, 0, TAU); rq.fill(); rq.strokeStyle = '#3255a4'; rq.lineWidth = 14; rq.stroke();
  rq.lineCap = 'round'; for (const [a, L, w] of [[(11 + 58 / 60) / 12, 60, 16], [58 / 60, 95, 10]]) { rq.lineWidth = w; rq.beginPath(); rq.moveTo(960, 420); rq.lineTo(960 + Math.sin(a * TAU) * L, 420 - Math.cos(a * TAU) * L); rq.stroke(); }
  rq.fillStyle = '#3255a4'; rq.beginPath(); rq.moveTo(900, 250); rq.quadraticCurveTo(900, 180, 960, 175); rq.quadraticCurveTo(1020, 180, 1020, 250); rq.fill();
}

// ═════════ the running order
const SEGS = [
  { t0: 0, t1: 1.85, game: gameCrayon, cmd: 'DODGE!', ok: false },
  { t0: 2.72, t1: 4.92, game: gamePixel, cmd: 'RUN!', ok: true, fuse: true },
  { t0: 5.8, t1: 7.2, game: gameInk, cmd: 'LOOK!', ok: true, fuse: true },
  { t0: 7.6, t1: 9.15, game: gameTerminal, cmd: 'READ!', ok: true },
];
const inRect = (k) => ({ x: lerp(SCR.x, 0, k), y: lerp(SCR.y, 0, k), w: lerp(SCR.w, W, k), h: lerp(SCR.h, H, k) });
function frame(t) {
  // which game is on the TV now (the last one started), and how far the camera is inside it (1 = full frame)
  let cur = null, k = 0;
  for (const s of SEGS) { const pin = s.t0 === 0 ? 1 : eio(seg(t, s.t0 - (s.t0 < 3 ? .22 : .18), s.t0)), pout = 1 - ss(seg(t, s.t1, s.t1 + (s.t1 > 9 ? .22 : .3)));
    if (t >= s.t0 - .25 && t < s.t1 + .4) { cur = s; k = Math.min(pin, pout); } }
  const lives = t < 2.2 ? 3 : 2, stg = t < 2.6 ? 1 : t < 5.7 ? 2 : t < 7.5 ? 3 : 4;
  if (!cur || k < 1) {
    const end = t >= 9.375, spot = end ? ss(seg(t, 9.375, 9.5)) : 0;
    stage(g, t, { lives, crack: t > 2.2 && t < 2.6 ? seg(t, 2.2, 2.6) : 0, stage: stg, fail: t > 1.9 && t < 2.6, raise: end ? seg(t, 9.42, 9.55) : 0, ring: t > EV.chime ? (t - EV.chime) : 0, still: end && t < EV.chime });
    // the screen: the game being entered or left, or (at the end) the station clock as a print
    const r = cur ? inRect(k) : SCR;
    if (cur) { gg.save(); cur.game(gg, clamp(t, cur.t0, cur.t1)); gg.restore(); g.drawImage(GC, r.x, r.y, r.w, r.h); }
    else if (end) { risoClock(); g.drawImage(RISO, SCR.x, SCR.y, SCR.w, SCR.h); }
    else { const last = SEGS.filter(q => q.t1 < t).pop(); if (last) { gg.save(); last.game(gg, last.t1); gg.restore(); g.drawImage(GC, SCR.x, SCR.y, SCR.w, SCR.h); stamp(g, t, last.t1 + .04, last.ok, SCR.x + SCR.w / 2, SCR.y + SCR.h / 2, .9); } else { g.fillStyle = '#1b1038'; g.fillRect(SCR.x, SCR.y, SCR.w, SCR.h); } }
    if (cur && t > cur.t1) stamp(g, t, cur.t1 + .04, cur.ok, SCR.x + SCR.w / 2, SCR.y + SCR.h / 2, .9);
    if (t > 5.2 && t < 5.62) command(g, t, 5.2, 'SPEED UP!', { fly: true, hold: .2, size: 170, up: 120 });
    if (end) { g.fillStyle = `rgba(5,0,20,${.62 * spot})`; g.beginPath(); g.rect(0, 0, W, H); g.moveTo(1430 + 330, 700); g.ellipse(1430, 700, 330, 520, 0, 0, TAU); g.moveTo(960 + 470, 520); g.ellipse(960, 520, 470, 380, 0, 0, TAU); g.fill('evenodd');
      command(g, t, 9.7, 'LAST TRAIN!', { hold: 9, size: 150, up: 300 }); }
  } else {
    gg.save(); cur.game(gg, t); gg.restore(); g.drawImage(GC, 0, 0);
    if (cur.fuse) fuse(g, t, cur.t0, cur.t1);
    command(g, t, cur.t0 + .03, cur.cmd);
  }
}
window.render = t => frame(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
