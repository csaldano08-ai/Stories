// 050 · Swiss Motion Graphics — the first 10 s of "Last Train Home" laid out as one typographic system on a grid
// (lemo-opuscar styles/swiss-motion): page, ink, light greys and one signal colour. The signal red is AKI alone, and she is the
// exception: everything else snaps on the beat of the film's 96 bpm with the one precise ease, she runs linearly and never snaps.
// S1: the puddle placed as a dot, the grid growing from it, the shop's type and its reflection; her legs cross and the splash is a
// ripple of cells ordered by distance. S2: the street as modules one beat wide; the camera snaps one module per beat while she
// drifts ahead and is caught again. S3: the camera pushes into the small "23:58" beside her raised wrist and lands on a spread:
// the numeral giant on the left, her red arm and the watch on the right, the seconds as sixty modules. S4: a knife cut, the
// station as bars and a circle; on the chime the grid answers in rings; the camera starts down one module.
// No rain: the style allows no particles. Engine: engine/ease.js copied unchanged. Page contract: window.render(t), DUR, READY, RIGQA.
import { clamp, lerp, seg, E, snap, lin } from './engine/ease.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { back, ss, TAU } from './shared/lib/util.js';

window.DUR = DUR;
const cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all(['500 40px Inter', '600 40px Inter', '700 40px Inter'].map(f => document.fonts.load(f)));
const W = 1920, H = 1080;
const C = { page: '#EAE9E5', paper: '#FFFFFF', ink: '#111111', red: '#E30613', grid: '#CFCEC9', pgrid: '#E2E1DC', mute: '#77766F', wall: '#DFDED9' };
const BEAT = .625, E8 = BEAT / 2, E16 = BEAT / 4;                     // 96 bpm, the tempo of the shared soundtrack
const FM = 96, FG = 24, FC = 122, fx = i => FM + i * (FC + FG);
function font(weight, size) { g.font = `${weight} ${size}px Inter`; g.letterSpacing = size >= 90 ? `${(-size * .022).toFixed(1)}px` : '0px'; }
// a run of text that rises out of a clip rect from below its baseline (p: 0→1 enters; q: 0→1 leaves upward)
function reveal(s, x, y, size, p, q = 0) {
  if (p <= 0 || q >= 1) return;
  const w = g.measureText(s).width + size * .1;
  g.save(); g.beginPath(); g.rect(x - 2, y - size * 1.02, w + 4, size * 1.3); g.clip();
  g.fillText(s, x, y + (1 - p) * size * 1.05 - q * size * 1.3); g.restore();
}

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
const SIM = (() => {   // the ponytail chain, pre-simulated at 240 Hz (her one loose part; the jacket is a flat sign)
  const dt = 1 / 240, n = Math.ceil(11 / dt), tail = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const th = [-.2, -.1, 0], vt = [0, 0, 0];
  const py = t => RUN.pelvisAt(t)[1], ay = t => (py(t + dt) - 2 * py(t) + py(t - dt)) / (dt * dt);
  for (let i = 0; i < n; i++) { const t = -.5 + i * dt, A = ay(t);
    for (let k = 0; k < 3; k++) { const par = k ? th[k - 1] : -.1, rest = .16 + .05 * k; vt[k] += (-60 * (th[k] - (par + rest)) - 6 * vt[k] + .014 * A * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; } }
  return { tail: t => tail.map(a => a[clamp(Math.round((t + .5) / dt), 0, n - 1)]) };
})();

// ═════════ the world: one street of modules, each one beat of her run wide (world units = px at scale 1)
const K = .9, GY = 860, X0 = X(2.5);
const xw = rx => (rx - X0) * K;
const MW = 1450 * K * BEAT;                                             // 815.6: what she covers in one beat
const NAMES = { '-5': 'FLOWERS', '-4': 'BAKERY', '-3': 'CAFE', '-2': 'NOODLES', '-1': 'BOOKS', 0: 'BAR', 1: 'PHARMACY', 2: 'BAKERY', 3: 'LAUNDRY', 4: 'HOTEL', 5: 'FLOWERS', 6: 'RECORDS', 7: 'CAFE', 8: 'BOOKS', 9: '24H', 10: 'HOTEL' };
const PUD = { x: xw(SPL.x), y: GY + 20, rx: 236, ry: 52 };
const RK = .3;                                                           // the puddle's reflection, foreshortened
const CAP = { x: 6 * MW + 330, y: 172, size: 72 };                     // the small "23:58" set above her as she lifts her wrist
const CAM1 = { x: PUD.x + 36, y: 790, s: 2.2 / K };

// AKI: one flat red sign, no outline; near limbs cut free from the rest by a hair of transparency
const AK = document.createElement('canvas'); AK.width = W; AK.height = H; const ak = AK.getContext('2d');
const capP = (P, a, b, r0, r1, n = 8) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + i / n * Math.PI; const x = a[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r0, y = a[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r0; i ? P.lineTo(x, y) : P.moveTo(x, y); }
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + i / n * Math.PI; P.lineTo(b[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * r1, b[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * r1); }
  P.closePath(); return P;
};
const polyP = (P, pts) => { pts.forEach((p, i) => i ? P.lineTo(p[0], p[1]) : P.moveTo(p[0], p[1])); P.closePath(); return P; };
function akiPaths(t) {
  const S_ = poseAt(t), J = solveProfile(S_), M = p => [xw(p[0]), GY + p[1] * K], k = K;
  const back_ = new Path2D(), near = new Path2D();
  const leg = (P, kk) => { const l = J.leg[kk]; capP(P, M(l.hip), M(l.knee), 24 * k, 19 * k); capP(P, M(l.knee), M(l.ankle), 19 * k, 14 * k);
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => M([l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c]);
    polyP(P, [F([-16, -36]), F([17, -36]), F([19, -8]), F([46, -2]), F([72, 6]), F([74, 17]), F([-25, 17]), F([-29, 0])]); };
  const arm = (P, kk) => { const a = J.arm[kk], h = [a.wr[0] + (a.wr[0] - a.el[0]) * .2, a.wr[1] + (a.wr[1] - a.el[1]) * .2]; capP(P, M(a.sh), M(a.el), 16 * k, 13 * k); capP(P, M(a.el), M(a.wr), 13 * k, 11 * k); capP(P, M(a.wr), M(h), 11 * k, 12 * k); };
  leg(back_, 'f'); arm(back_, 'f');
  const TT = (b, u, f) => M([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  polyP(back_, [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)]);
  capP(back_, M(J.neckBase), M(J.neckTop), 13 * k, 12 * k);
  const hc = J.headC, HR = q => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return M([hc[0] + q[0] * c - q[1] * s, hc[1] + q[0] * s + q[1] * c]); };
  polyP(back_, [[16, -44], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-10, 48], [-36, 38], [-50, 8], [-46, -26], [-22, -48]].map(HR));
  polyP(back_, [[22, -44], [0, -60], [-36, -54], [-58, -22], [-60, 12], [-46, 40], [-22, 44], [-10, 18], [-2, -14], [8, -32]].map(HR));
  const ta = SIM.tail(t); let ang = Math.PI - .25 + ta[0] + J.headA, p = HR([-50, -14]);
  for (let i = 0; i < 3; i++) { const L = [46, 42, 36][i] * k, q = [p[0] + Math.cos(ang) * L, p[1] + Math.sin(ang) * L]; capP(back_, p, q, [14, 11, 8][i] * k, [11, 8, 4][i] * k); p = q; ang += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  leg(near, 'n'); arm(near, 'n');
  return { back: back_, near, J };
}
// draw AKI with the current world→screen matrix m = [s, ox, oy]; flipY mirrors about the world line yMirror (for the puddle)
function drawAki(t, m, opts = {}) {
  const A = akiPaths(t);
  ak.setTransform(1, 0, 0, 1, 0, 0); ak.clearRect(0, 0, W, H);
  if (opts.flip != null) ak.setTransform(m[0], 0, 0, -RK * m[0], m[1], m[2] + (1 + RK) * opts.flip * m[0]); else ak.setTransform(m[0], 0, 0, m[0], m[1], m[2]);
  ak.fillStyle = opts.col || C.red; ak.fill(A.back);
  ak.save(); ak.globalCompositeOperation = 'destination-out'; ak.lineWidth = 3.2 / m[0]; ak.lineJoin = 'round'; ak.stroke(A.near); ak.restore();
  ak.fill(A.near);
  return A;
}

// ═════════ the street modules (drawn in world units under the camera matrix)
function street(t, view) {
  const k0 = Math.floor(view.x0 / MW) - 1, k1 = Math.floor(view.x1 / MW) + 1;
  // the sky: light-grey grid of the system (a second voice), 48 px cells
  g.strokeStyle = C.pgrid; g.lineWidth = 1 / view.s;
  for (let x = Math.floor(view.x0 / 48) * 48; x < view.x1; x += 48) { g.beginPath(); g.moveTo(x, view.y0); g.lineTo(x, 212); g.stroke(); }
  for (let y = 212; y > view.y0; y -= 48) { g.beginPath(); g.moveTo(view.x0, y); g.lineTo(view.x1, y); g.stroke(); }
  for (let k = k0; k <= k1; k++) {
    const x0 = k * MW, name = NAMES[k] || 'BAR';
    g.fillStyle = C.ink; g.fillRect(x0 + 24, 212, MW - 48, 1.5);                                         // the rule above the name
    font(700, 80); g.fillText(name, x0 + 24, 300);
    font(500, 19); g.fillStyle = C.mute; g.fillText(`${String(k + 6).padStart(2, '0')}`, x0 + MW - 64, 238);   // the module's number
    g.fillStyle = C.wall; g.fillRect(x0 + 24, 380, MW - 48 - 150, 380);                                    // the lit window: light grey
    g.fillStyle = C.ink; g.fillRect(x0 + MW - 24 - 110, 404, 110, GY - 404);                               // the door: a bar
    g.fillRect(x0 - 3, 140, 6, GY - 140); g.beginPath(); g.arc(x0, 140, 18, 0, TAU); g.fill();             // the lamp: a rule and a dot
    if (name === 'CAFE' && k === -3) {
      font(700, 96); g.fillStyle = C.ink; g.fillText('CAFE', x0 + 260, 700);
      g.fillStyle = C.paper; g.fillRect(x0 + MW - 24 - 100, 640, 90, 52); font(700, 40); g.fillStyle = C.ink; g.fillText('24H', x0 + MW - 24 - 94, 682);
    }
  }
  // the pavement: light grey, its edge an ink rule
  g.fillStyle = C.wall; g.fillRect(view.x0, GY, view.x1 - view.x0, view.y1 - GY);
  g.fillStyle = C.ink; g.fillRect(view.x0, GY - 1.5, view.x1 - view.x0, 3);
}
// her steps, ticked on the pavement edge like a scale (lines grow along their length)
function stepTicks(t) {
  g.fillStyle = C.ink;
  for (const c of RUN.contacts) { if (c.t0 > t) continue; const x = xw(c.x), L = 26 * lin(t, c.t0, c.t0 + E16); g.fillRect(x - 1.5, GY + 1.5, 3, L); }
}
// the puddle: a black ellipse; the café's type and AKI hang upside down in it
function puddle(t, m, p) {
  if (p <= 0) return;
  g.save(); g.beginPath(); g.ellipse(PUD.x, PUD.y, PUD.rx * p, PUD.ry, 0, 0, TAU); g.fillStyle = C.ink; g.fill(); g.clip();
  g.save(); g.translate(0, (1 + RK) * GY); g.scale(1, -RK);
  g.fillStyle = '#3a3a38'; g.fillRect(-3 * MW + 24, 380, MW - 48 - 150, 380);
  font(700, 96); g.fillStyle = C.paper; g.fillText('CAFE', -3 * MW + 260, 700);
  g.fillStyle = C.mute; g.fillRect(-3 * MW + MW - 24 - 110, 404, 110, GY - 404);
  g.restore();
  g.restore();
}
// the splash: cells of the pavement grid turn ink in order of distance from the foot, a couple of units per sixteenth
function ripple(t, cx, cy, t0, cell, x0, x1, y0, y1, skip) {
  const a = t - t0; if (a < 0 || a > 1.6) return;
  g.fillStyle = C.ink;
  for (let y = y0; y < y1; y += cell) for (let x = Math.floor(x0 / cell) * cell; x < x1; x += cell) {
    const d = Math.hypot((x + cell / 2 - cx) / cell, (y + cell / 2 - cy) / cell), on = t0 + d * E16 / 2;
    if (skip && skip(x + cell / 2, y + cell / 2)) continue;
    if (t >= on && t < on + E8) { const q = 1 - snap(t, on + E8, E8); g.fillRect(x + 6, y + 6, (cell - 12) * q, cell - 12); }
  }
}

// ═════════ captions (frame space): the rule and three notes on top, the bar counter below
function captions(t, mid) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const p = snap(t, E8, E8);
  g.fillStyle = C.ink; g.fillRect(fx(0), 36, (fx(5) + FC - fx(0)) * p, 1);
  font(500, 19); g.fillStyle = C.ink;
  reveal('Last Train Home', fx(0), 66, 19, p); reveal(mid, fx(2), 66, 19, p); reveal('♩ = 96', fx(4), 66, 19, p);
  const bar = Math.floor(t / (BEAT * 4)) + 1, beat = Math.floor((t % (BEAT * 4)) / BEAT) + 1;
  font(600, 18); g.fillStyle = C.ink; g.fillText(`bar ${String(bar).padStart(2, '0')}.${beat}`, fx(10), 1044);
}
const stepNo = t => RUN.contacts.filter(c => c.t0 <= t).length;

// ═════════ cameras
const BEATS = n => n * BEAT;
function camAt(t) {
  if (t < 1.875) return { x: CAM1.x, y: CAM1.y, s: CAM1.s };
  const camX2 = tt => { const u = (tt - 2.5) / BEAT, k = Math.floor(u), f = u - k; return 300 + MW * (k + E(seg(f, .5, 1))); };
  if (t < 2.5) { const p = snap(t, 2.5, BEAT); return { x: lerp(CAM1.x, 300, p), y: lerp(CAM1.y, 540, p), s: Math.exp(lerp(Math.log(CAM1.s), 0, p)) }; }
  const base = { x: camX2(t), y: 540, s: 1 };
  if (t < 7.5 - E8) return base;
  // the last half beat of S2 is the push into the small numeral (it becomes the giant numeral of the spread)
  const p = snap(t, 7.5, E8), b0 = { x: camX2(7.5 - E8), y: 540, s: 1 };
  const sEnd = NUM.size / CAP.size, tx = CAP.x + (960 - NUM.x) / sEnd, ty = CAP.y + (540 - NUM.y) / sEnd;
  return { x: lerp(b0.x, tx, p), y: lerp(b0.y, ty, p), s: Math.exp(lerp(0, Math.log(sEnd), p)) };
}
const NUM = { x: fx(0), y: 640, size: 430 };                          // the giant numeral of the spread (frame space)

function shotStreet(t) {
  const c = camAt(t), m = [c.s, W / 2 - c.x * c.s, H / 2 - c.y * c.s];
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = C.page; g.fillRect(0, 0, W, H);
  g.setTransform(c.s, 0, 0, c.s, m[1], m[2]);
  const view = { x0: c.x - W / 2 / c.s, x1: c.x + W / 2 / c.s, y0: c.y - H / 2 / c.s, y1: c.y + H / 2 / c.s, s: c.s };
  // S1 opening: the dot (the puddle) wipes in, the grid and the street grow from it on the first beats
  const open = t < 2.5;
  const gp = open ? lin(t, E8, BEAT * 1.5) : 1;
  if (!open || gp > 0) {
    g.save();
    if (open && gp < 1) { const r = 60 + gp * 1600; g.beginPath(); g.rect(PUD.x - r, view.y0 - 10, 2 * r, view.y1 - view.y0 + 20); g.clip(); }
    street(t, view);
    g.restore();
  } else { g.fillStyle = C.wall; g.fillRect(view.x0, GY, view.x1 - view.x0, view.y1 - GY); }
  ripple(t, PUD.x, GY + 24, EV.splash, 32, PUD.x - 900, PUD.x + 900, GY + 3, GY + 3 + 32 * 5, (x, y) => ((x - PUD.x) / (PUD.rx + 20)) ** 2 + ((y - PUD.y) / (PUD.ry + 14)) ** 2 < 1);
  puddle(t, m, open ? E(seg(t, 0, E8)) : 1);
  stepTicks(t);
  // her reflection in the puddle (clipped), then AKI
  if (t > .3) {
    drawAki(t, m, { flip: GY });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); g.ellipse(m[1] + PUD.x * c.s, m[2] + PUD.y * c.s, PUD.rx * c.s, PUD.ry * c.s, 0, 0, TAU); g.clip(); g.globalAlpha = 1; g.drawImage(AK, 0, 0); g.restore();
    drawAki(t, m); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(AK, 0, 0); g.restore();
  }
  // the numeral beside her raised wrist: clip-revealed on the beat after she lifts it
  g.setTransform(c.s, 0, 0, c.s, m[1], m[2]);
  if (t >= 6.25 - E8) { font(700, CAP.size); g.fillStyle = C.ink; reveal('23:58', CAP.x, CAP.y, CAP.size, snap(t, 6.25, E8)); }
  captions(t, t < 2.5 ? `step ${String(stepNo(t)).padStart(2, '0')}` : `step ${String(stepNo(t)).padStart(2, '0')} · module ${String(Math.floor((camAt(t).x - 300) / MW + .5) + 6).padStart(2, '0')}`);
}

// ═════════ S3 — the spread (7.5–9.375) and S4 — the station (9.375–10)
const AH = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, AMN = -Math.PI / 2 + 58 / 60 * TAU;
function bar(a, L, w) { g.save(); g.rotate(a); g.fillRect(-w * 2, -w / 2, L + w * 2, w); g.restore(); }
function shotSpread(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = C.page; g.fillRect(0, 0, W, H);
  // frame grid while the spread holds
  g.strokeStyle = C.pgrid; g.lineWidth = 1; for (let i = 0; i < 12; i++) { g.strokeRect(fx(i) + .5, 96.5, FC, 840); }
  const cutP = snap(t, 9.375, E8 * .6), sec = 47 + (t >= 8.4 ? 1 : 0);
  // the giant numeral, optically flush left; on the knife cut it collapses to its midline
  font(700, NUM.size); g.fillStyle = C.ink;
  const lb = g.measureText('23:58').actualBoundingBoxLeft;
  g.save(); g.translate(0, NUM.y - NUM.size * .36); g.scale(1, 1 - cutP); g.translate(0, -(NUM.y - NUM.size * .36)); g.fillText('23:58', NUM.x + lb, NUM.y); g.restore();
  if (t > 8.97 && t < 9.375) { const k = lin(t, 8.97, 9.17); g.fillRect(fx(0) - 40, NUM.y - NUM.size * .36 - 1, (fx(7) - fx(0) + 80) * k, 2); }
  // the right page: her arm, the exception: a red bar entering linearly off the grid, the watch at its end
  const ex = lin(t, 7.5, 9.375), out = lin(t, 9.2, 9.375);
  g.save(); g.translate(1530 - ex * 40 + out * 900, 640 + ex * 12); g.rotate(-.29);
  g.fillStyle = C.red; g.fillRect(-40, -88, 1200, 176); g.beginPath(); g.roundRect(-300, -80, 300, 160, 70); g.fill();
  // watch: ink ring, paper face, ink bars for the hands
  g.fillStyle = C.ink; g.fillRect(-60, -110, 120, 220);                                      // the strap
  g.beginPath(); g.arc(0, 0, 150, 0, TAU); g.fill(); g.fillStyle = C.paper; g.beginPath(); g.arc(0, 0, 134, 0, TAU); g.fill();
  g.fillStyle = C.ink; for (let i = 0; i < 12; i++) { g.save(); g.rotate(i / 12 * TAU); g.fillRect(104, -3, i % 3 ? 20 : 28, i % 3 ? 6 : 10); g.restore(); }
  g.rotate(.29);
  bar(AH, 70, 14); bar(AMN, 108, 9); const sa = -Math.PI / 2 + sec / 60 * TAU; bar(sa, 118, 3);
  g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.fill();
  g.restore();
  // the seconds: sixty modules along the base line; the current one snaps in on the tick
  const cw = (fx(11) + FC - fx(0)) / 60;
  for (let i = 0; i < 60; i++) {
    const on = i < 47 ? 1 : i === 47 ? snap(t, 7.5 + E8, E16) : i === 48 ? snap(t, 8.4 + E16, E16) : 0;
    g.fillStyle = C.grid; g.fillRect(fx(0) + i * cw + 1, 980, cw - 2, 4);
    if (on > 0) { g.fillStyle = C.ink; g.fillRect(fx(0) + i * cw + 1, 984 - 36 * on, cw - 2, 36 * on); }
  }
  font(500, 19); g.fillStyle = C.mute; reveal('seconds', fx(0), 1028, 19, snap(t, 7.5 + E8, E8)); g.fillStyle = C.ink; reveal(`${sec} / 60`, fx(2), 1028, 19, snap(t, 7.5 + E8, E8));
  captions(t, `23:58:${sec}`);
}
function shotStation(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = C.page; g.fillRect(0, 0, W, H);
  const dn = snap(t, 10, E8) * 96;                                                  // the crane down begins: one module, landing on the beat at 10.0
  g.translate(0, -dn);
  // the sky as the system's grid; on the chime the cells answer in rings from the clock
  g.strokeStyle = C.pgrid; g.lineWidth = 1; for (let x = 96; x <= 1824; x += 48) { g.beginPath(); g.moveTo(x, 96); g.lineTo(x, 1200); g.stroke(); } for (let y = 96; y <= 1200; y += 48) { g.beginPath(); g.moveTo(96, y); g.lineTo(1824, y); g.stroke(); }
  const CX = 1284, CY = 336;
  ripple(t, CX, CY, EV.chime, 48, 96, 1824, 96, 816);
  // the city: blocks of ink rising one module at a time, a light-grey row behind
  const rise = k => E(clamp((t - 9.375 - k * E16 / 2) / E8, 0, 1));
  const R = [5, 3, 7, 4, 6, 2, 5, 8, 3, 6, 4, 7, 5, 3, 6, 4, 5, 3];
  R.forEach((h, i) => { const x = 96 + i * 96; if (x > 1140 && x < 1420) return; g.fillStyle = C.wall; g.fillRect(x + 4, 1176 - (h + 2) * 48 * rise(i), 88, (h + 2) * 48 * rise(i)); });
  R.forEach((h, i) => { const x = 96 + i * 96; if (x > 1140 && x < 1420) return; g.fillStyle = C.ink; const hh = Math.max(1, h - 2) * 48 * rise(i + 3); g.fillRect(x + 12, 1176 - hh, 72, hh); });
  // the tower: a bar grown from the ground along its length, and the clock: a circle, two bars, 23:58
  const tw = lin(t, 9.375, 9.375 + E8);
  g.fillStyle = C.ink; g.fillRect(CX - 60, 1176 - (1176 - CY) * tw, 120, (1176 - CY) * tw);
  const cp = E(seg(t, 9.375 + E16, 9.375 + E8 + E16));
  if (cp > 0) { g.save(); g.translate(CX, CY); g.beginPath(); g.arc(0, 0, 132 * cp, 0, TAU); g.fill(); g.fillStyle = C.paper; g.beginPath(); g.arc(0, 0, 116 * cp, 0, TAU); g.fill();
    g.fillStyle = C.ink; for (let i = 0; i < 12; i++) { g.save(); g.rotate(i / 12 * TAU); g.fillRect(88 * cp, -2.5, (i % 3 ? 16 : 24) * cp, i % 3 ? 5 : 9); g.restore(); }
    bar(AH, 58 * cp, 12); bar(AMN, 92 * cp, 8); g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fill(); g.restore(); }
  font(500, 19); g.fillStyle = C.mute; reveal('the station clock', CX + 168, CY - 6, 19, snap(t, 9.375 + E8 + E16, E8)); g.fillStyle = C.ink; reveal('chime', CX + 168, CY + 22, 19, snap(t, EV.chime + E16, E16));
  captions(t, 'the station');
}

window.render = t => {
  if (t < 7.5) shotStreet(t);
  else if (t < 9.375) shotSpread(t);
  else shotStation(t);
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0);
window.READY = true;
