// 064 · Pen Plotter — the first 10 s of "Last Train Home" drawn by a pen plotter on a desk, at night, in the rain outside
// (lemo-opuscar styles/pen-plotter). A narrative adaptation: the sheet is a time chart of the run. Along a 0–10 s axis the black
// pen plots AKI at every other footfall, each figure traced from the shared rig at that instant (outlines with hidden lines
// removed, 1:26), so the chart is the run itself; the puddle and the splash are drawn on the footfall at 0.94 s. The plotter is
// honest: pen-down 90 mm/s, pen-up 260 mm/s with acceleration, drops, lifts and a real pen change; the film keeps time by
// jumping machine time on the beat (96 bpm) and the camera keeps moving through the jumps. Shots: S1 macro low across the paper
// on the nib as the splash is drawn at 0.94 s · S2 long lens following the chart along her run; the figure with the watch raised
// is drawn while she raises it · S3 insert at the rack, the red pen (the accent, kept for the finding), then the hero number
// 11:58 in single line, its last stroke landing at 8.4 s · S4 the red pen drops on the chime at 9.58 s on the axis and the camera
// pulls back to the desk. No font is loaded: every figure and digit is a stroke list built here (an original single-line digit set).
// Engine: engine/plot.js (one marked edit: per-stroke speed) and engine/rand.js from the demo; the desk, machine, paper and
// post code follow the demo's main.js. Page contract: window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { buildProgram, plotState, drawStroke, strokeBox, RACK, HOME, INK } from './engine/plot.js';
import { mulberry } from './engine/rand.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR as FILM, shotAt as clipShot, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { back, seg as segT } from './shared/lib/util.js';

const Q = new URLSearchParams(location.search);
const DUR = FILM, FPS = 30;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const s5 = x => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const eo = x => { x = clamp(x); return 1 - (1 - x) ** 3; };
const lerp = (a, b, f) => a + (b - a) * f;

// ═════════ the run (shared by every style)
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const X = t => RUN.pelvisAt(t)[0];
function poseAt(t) {
  const S_ = RUN.pose(t);
  const up = back(segT(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(segT(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S_.watch = w;
  if (w > 0) { const J0 = solveProfile(S_), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S_.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S_.arms.f.sh *= 1 - .45 * wm; S_.head += .26 * wm; S_.neck += .08 * wm; }
  return S_;
}
const SIM = (() => {
  const dt = 1 / 240, n = Math.ceil(11 / dt), flap = new Float32Array(n), tail = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  let a = .3, va = 0; const th = [-.2, -.1, 0], vt = [0, 0, 0];
  const py = t => RUN.pelvisAt(t)[1], ay = t => (py(t + dt) - 2 * py(t) + py(t - dt)) / (dt * dt);
  for (let i = 0; i < n; i++) {
    const t = -.5 + i * dt, A = ay(t), wv = clamp((t - EV.watchUp) / .3) * (1 - clamp((t - EV.watchDown) / .3));
    va += (-46 * (a - (.34 + .06 * wv)) - 5.5 * va + .011 * A) * dt; a += va * dt; flap[i] = a;
    for (let k = 0; k < 3; k++) { const par = k ? th[k - 1] : -.1, rest = .16 + .05 * k; vt[k] += (-60 * (th[k] - (par + rest)) - 6 * vt[k] + .014 * A * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; }
  }
  const at = (arr, t) => arr[clamp(Math.round((t + .5) / dt), 0, n - 1)];
  return { flap: t => at(flap, t), tail: t => tail.map(a => at(a, t)) };
})();

// ═════════ the sheet (A2, 594 × 420 mm): a time chart, 0–10 s along the axis, AKI at every other footfall above it
const SHW = 594, SHH = 420, AXY = 300, GROUND = 272, TX0 = 40, TX1 = 560;
const tx = t => TX0 + t * (TX1 - TX0) / 10;
const RU = 2.8 / 26;                                                 // sheet mm per rig unit (figures at 1:26)
const PEN = { black: 0, brown: 1, grey: 2, red: 3 };
const FIGT = RUN.contacts.filter(c => c.t0 > 0 && c.t0 < 10).map(c => c.t0).filter((_, i) => i % 2 === 0);   // 0.248, 0.9375, 1.63 …
// geometry helpers (sheet mm)
const capsule = (a, b, ra, rb, n = 9) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, out = [];
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + i / n * Math.PI; out.push([a[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * ra, a[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * ra]); }
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + i / n * Math.PI; out.push([b[0] + (ux * Math.cos(t) + nx * Math.sin(t)) * rb, b[1] + (uy * Math.cos(t) + ny * Math.sin(t)) * rb]); }
  return out; };
const inside = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
function resample(poly, closed, step = .3) { const pts = closed ? [...poly, poly[0]] : poly, out = [pts[0]];
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / step)); for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
  return out; }
// hidden lines: parts are given front to back; each outline keeps only the runs outside every part in front of it
function hiddenLine(parts) {
  const occ = [], out = [];
  for (const { poly, closed = true } of parts) {
    const pts = resample(poly, closed); let run = [];
    for (const p of pts) { if (occ.some(o => inside(p, o))) { if (run.length > 2) out.push(run); run = []; } else run.push(p); }
    if (run.length > 2) out.push(run);
    if (closed) occ.push(poly);
  }
  // rejoin a closed outline's last run with its first when they meet
  return out.map(r => r.flatMap(p => [+p[0].toFixed(2), +p[1].toFixed(2)]));
}
// one figure of AKI at time t, pelvis on the chart at tx(t): every part of the rig, front to back
function figure(t) {
  const J = solveProfile(poseAt(t)), x0 = X(t), M = p => [tx(t) + (p[0] - x0) * RU, GROUND + p[1] * RU];
  const parts = [], cap = (a, b, ra, rb) => parts.push({ poly: capsule(M(a), M(b), ra * RU, rb * RU) });
  const arm = k => { const a = J.arm[k], h = [a.wr[0] + (a.wr[0] - a.el[0]) * .24, a.wr[1] + (a.wr[1] - a.el[1]) * .24];
    cap(a.wr, h, 9, 5); cap(a.el, a.wr, 13, 10); cap(a.sh, a.el, 16, 13); };
  const leg = k => { const l = J.leg[k], c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => M([l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c]);
    parts.push({ poly: [[-15, -34], [16, -34], [18, -8], [46, -2], [72, 6], [72, 16], [-24, 16], [-28, 0]].map(F) }); cap(l.knee, l.ankle, 18, 12); cap(l.hip, l.knee, 24, 18); };
  const TT = (b, u, f) => M([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  if (J.S.watch > .3) { const a = J.arm.n, w = [a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84], c = M(w);
    parts.push({ poly: Array.from({ length: 24 }, (_, i) => [c[0] + Math.cos(i / 24 * 6.2832) * 10 * RU, c[1] + Math.sin(i / 24 * 6.2832) * 10 * RU]) }); }
  arm('n');
  const hc = J.headC, HR = q => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return M([hc[0] + q[0] * c - q[1] * s, hc[1] + q[0] * s + q[1] * c]); };
  parts.push({ poly: [[16, -44], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-10, 48], [-36, 38], [-50, 8], [-46, -26], [-22, -48], [0, -60], [-36, -56]].map(HR) });
  { const ta = SIM.tail(t); let ang = Math.PI - .25 + ta[0] + J.headA, p = [hc[0] - Math.cos(J.headA) * 50, hc[1] - Math.sin(J.headA) * 50 - 10];
    for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i], q = [p[0] + Math.cos(ang) * Lk, p[1] + Math.sin(ang) * Lk]; cap(p, q, [14, 11, 8][i], [11, 8, 3][i]); p = q; ang += ta[(i + 1) % 3] * .6 - ta[i] * .3; } }
  cap(J.neckBase, J.neckTop, 12, 11);
  leg('n');
  const fa = SIM.flap(t), ha = fa + 1.75, hb = J.pelvis, hp = [hb[0] - 60 * J.uL[0] - 56 * J.fL[0], hb[1] - 60 * J.uL[1] - 56 * J.fL[1]];
  parts.push({ poly: [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)] });
  parts.push({ poly: [TT(J.pelvis, -40, -50), TT(J.pelvis, -96, -58), M([hp[0] + Math.cos(ha) * 72, hp[1] + Math.sin(ha) * 72]), M([hp[0] + Math.cos(ha) * 64 + 12, hp[1] + Math.sin(ha) * 64])] });
  leg('f'); arm('f');
  return hiddenLine(parts);
}
// an original single-line digit set on a unit cell (x 0–0.6, y 0–1, y down); curves are sampled arcs
const arc = (cx, cy, rx, ry, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const GLYPH = {
  '0': [arc(.3, .5, .27, .5, 0, 360, 40)],
  '1': [[[.1, .2], [.33, 0], [.33, 1]]],
  '2': [[...arc(.3, .28, .26, .27, 195, 380), [.04, 1], [.58, 1]]],
  '3': [[...arc(.29, .25, .24, .25, 205, 450), ...arc(.3, .74, .27, .26, 270, 520)]],
  '4': [[[.46, 1], [.46, 0], [.03, .7], [.6, .7]]],
  '5': [[[.55, 0], [.1, 0], [.07, .44], ...arc(.3, .68, .27, .32, 222, 500)]],
  '6': [[[.5, .03], [.28, .17], [.1, .42], ...arc(.3, .7, .27, .3, 180, 540)]],
  '7': [[[.02, 0], [.58, 0], [.22, 1]]],
  '8': [arc(.3, .25, .22, .24, 90, 450), arc(.3, .73, .27, .27, 270, 630)],
  '9': [[...arc(.3, .3, .27, .3, 0, 360), [.57, .32], [.5, .66], [.3, 1]]],
  ':': [arc(.15, .3, .045, .045, 0, 360, 10), arc(.15, .75, .045, .045, 0, 360, 10)],
};
const ADV = { ':': .42 };
function text(str, x, y, h, retrace = 0) {   // → stroke point lists (sheet mm); retrace: a second pass offset by that many mm
  const out = []; let cx = x;
  for (const ch of str) { for (const pl of GLYPH[ch] || []) { const pts = pl.flatMap(([u, v]) => [+(cx + u * h).toFixed(2), +(y + v * h).toFixed(2)]); out.push(pts);
      if (retrace) out.push(pl.flatMap(([u, v]) => [+(cx + u * h + retrace).toFixed(2), +(y + v * h + retrace * .5).toFixed(2)])); }
    cx += (ADV[ch] ?? .78) * h; }
  return out;
}
// ── the stroke list in plotting order
const strokes = [];
const add = (pts, p, sg, pre = false, extra = {}) => strokes.push({ pts, p, seg: pre ? 'pre' : sg, ...extra });
// already on the sheet when the film starts: the axis, its ticks and seconds, the ground line, the first figure
add([TX0 - 8, AXY, TX1 + 10, AXY], PEN.grey, 'axis', true);
for (let k = 0; k <= 20; k++) { const x = tx(k / 2), L = k % 2 ? 2.2 : 4.5; add([x, AXY, x, AXY + L], PEN.grey, 'axis', true); }
for (let s = 0; s <= 10; s++) for (const pl of text(String(s), tx(s) - (s >= 10 ? 4.2 : 1.6), AXY + 7.5, 5.5)) add(pl, PEN.grey, 'axis', true);
add([TX0 - 8, GROUND, TX1 + 10, GROUND], PEN.grey, 'ground', true);
for (const s of figure(FIGT[0])) add(s, PEN.black, 'fig0', true);
// figure 2 (0.94 s): the puddle under the far foot, the splash, then AKI
const SPX = tx(SPL.t0) + (SPL.x + 44 - X(SPL.t0)) * RU;
add(Array.from({ length: 31 }, (_, i) => { const u = i / 30 - .5; return [SPX + u * 1360 / 26, GROUND + 2.4 * Math.cos(u * Math.PI) - .2]; }).flat(), PEN.black, 'puddle');
{ const r = mulberry(64); for (let i = 0; i < 7; i++) { const a = (200 + i * 23 + r() * 8) * Math.PI / 180, r0 = 2.5, r1 = 5 + r() * 5; add([SPX + Math.cos(a) * r0, GROUND - .6 + Math.sin(a) * r0, SPX + Math.cos(a) * r1, GROUND - .6 + Math.sin(a) * r1].map(v => +v.toFixed(2)), PEN.black, 'splash'); } }
FIGT.slice(1).forEach((t, i) => { if (t > 7.4) return; for (const s of figure(t)) add(s, PEN.black, 'fig' + (i + 1)); });
// the finding, in the red pen: the watch time as the hero number above the watch figure, then the chime on the axis
const NUMX = 352, NUMY = 108, NUMH = 46;
for (const pl of text('11:58', NUMX, NUMY, NUMH, .28)) add(pl, PEN.red, 'number');
add([tx(EV.chime), GROUND - 86, tx(EV.chime), AXY + 6], PEN.red, 'chime');
add(arc(tx(EV.chime), GROUND - 90.5, 4.5, 4.5, 90, 450, 24).flat().map(v => +v.toFixed(2)), PEN.red, 'chime');
const G = buildProgram({ strokes });
const { S, PRE, PROG } = G;
const SW = G.swaps;
const firstK = sg => PROG.findIndex(i => S[i].seg === sg);
const lastK = sg => { let k = -1; PROG.forEach((i, kk) => { if (S[i].seg === sg) k = kk; }); return k; };
const dropOf = k => G.ops.find(o => o.type === 'drop' && o.k === k).t1;
const inkK = k => G.inkStart[k];

// ═════════ film time → machine time: real speed inside each stretch, jumps on the beat
const W_ = [], segW = (t0, p0) => W_.push([t0, p0]);
segW(0, dropOf(firstK('splash')) - EV.splash);                                       // the first splash stroke touches at 0.94 s
segW(1.875, inkK(firstK('fig1')) + .4);                                              // a jump: the figure of that footfall
{ const BEAT = .625, figK = name => firstK(name), figs = FIGT.map((t, i) => ({ t, i })).filter(f => f.i >= 1 && f.t < 7.4);
  let last = -1;
  for (let b = 2.5; b < 6.0; b += BEAT) {
    const f = figs.filter(q => q.t <= b + .25).pop(), k0 = figK('fig' + f.i), k1 = lastK('fig' + f.i);
    let p = inkK(Math.round(lerp(k0, k1, .35)));
    if (p <= last + .7) p = inkK(Math.round(lerp(k0, k1, .7)));
    segW(b, p); last = p;
  }
  const kw = firstK('fig' + figs.find(q => q.t > 6.3).i); segW(6.0, inkK(kw) - .05);   // the raised arm and its watch, drawn as she raises it
  const k11 = figs.find(q => q.t > 7).i; segW(7.15, inkK(Math.round(lerp(firstK('fig' + k11), lastK('fig' + k11), .25))));
}
segW(7.5, SW[1].tAt - .32);                                                         // insert: the holder comes down on the red pen
segW(8.0, G.inkEnd[lastK('number')] - .4);                                           // the hero number's last stroke lands at 8.4 s
segW(9.375, dropOf(firstK('chime')) - (EV.chime - 9.375));                           // the red pen touches the axis at the chime
const JUMPS = W_.slice(1).map(w => w[0]);
function warp(t) { let w = W_[0]; for (const x of W_) if (x[0] <= t) w = x; return w[1] + (t - w[0]); }
const SHOT = t => t < 2.5 ? 1 : t < 7.5 ? 2 : t < 8.0 ? 40 : t < 9.375 ? 3 : 4;

// ---------- page
const W = innerWidth, H = innerHeight, SS = +(Q.get('ss') || 1.5);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W * SS, H * SS, false);
renderer.domElement.style.cssText = `width:${W}px;height:${H}px;position:absolute;left:0;top:0`;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = Q.get('exp') ? +Q.get('exp') : .45;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const over = document.createElement('canvas'); over.width = W; over.height = H; over.style.cssText = `width:${W}px;height:${H}px;position:absolute;left:0;top:0`;
document.body.appendChild(over); const og = over.getContext('2d');
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07080b);
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .22;
const camera = new THREE.PerspectiveCamera(36, W / H, .005, 30);
const aniso = renderer.capabilities.getMaxAnisotropy();
const rnd = mulberry(5);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const wp = (sx, sy, h = 0) => V(sx / 1000 - .297, h / 1000, sy / 1000 - .21);   // sheet mm → world metres
const shadowAll = o => o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
const std = (color, roughness = .5, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

// ---------- drafting table (procedural wood) and the room
function woodCanvas(w, h, tone) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); const img = x.createImageData(w, h); const d = img.data;
  const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x0, y0) => { const i = Math.floor(x0), j = Math.floor(y0), f = x0 - i, g = y0 - j, u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g);
    return (hash(i, j) * (1 - u) + hash(i + 1, j) * u) * (1 - v) + (hash(i, j + 1) * (1 - u) + hash(i + 1, j + 1) * u) * v; };
  const plank = h / 6, off = [0, .37, .71, .13, .52, .88, .29];
  for (let j = 0; j < h; j++) { const pl = Math.floor(j / plank), pj = (j % plank) / plank;
    for (let i = 0; i < w; i++) { const u = i / w * 2.4 + off[pl] * 5;
      const warp = vn(u * 1.3, pl * 7.1 + pj * 1.5) * 2.2 + vn(u * 4, pj * 3 + pl) * .4, g = pj * 14 + warp;
      const ring = Math.pow(.5 + .5 * Math.sin(g * 6.283 * .55), 4), fib = vn(u * 60, pj * 700 + pl * 50) * .6 + vn(u * 8, pj * 220 + pl * 20) * .4;
      let t = .6 + .09 * ring + .22 * (fib - .5) + .14 * (vn(u * 2, pl * 3 + pj) - .5); if (Math.min(pj, 1 - pj) < .003) t *= .45;
      const k = (j * w + i) * 4; d[k] = tone[0] + tone[3] * t; d[k + 1] = tone[1] + tone[4] * t; d[k + 2] = tone[2] + tone[5] * t; d[k + 3] = 255; } }
  x.putImageData(img, 0, 0); return cv;
}
const woodTex = new THREE.CanvasTexture(woodCanvas(2048, 1280, [34, 20, 12, 74, 44, 26])); woodTex.colorSpace = THREE.SRGBColorSpace; woodTex.anisotropy = aniso;
const TABLE_Y = -.024;
const table = new THREE.Mesh(new RoundedBoxGeometry(1.9, .04, 1.15, 2, .006), std(0xffffff, .5, 0, { map: woodTex }));
table.position.set(0, TABLE_Y - .02, -.05); table.receiveShadow = true; table.castShadow = true; scene.add(table);
for (const [x, z] of [[-.9, -.58], [.9, -.58], [-.9, .48], [.9, .48]]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(.05, .74, .05), std(0x1b1410, .6)); leg.position.set(x, TABLE_Y - .41, z); scene.add(leg); }
const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), std(0x17130f, .9)); floor.rotation.x = -Math.PI / 2; floor.position.y = TABLE_Y - .78; floor.receiveShadow = true; scene.add(floor);
const wallMat = std(0x2a2824, .95);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), wallMat); wall.position.set(0, .9, -1.35); scene.add(wall);
const wallL = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), wallMat); wallL.rotation.y = Math.PI / 2; wallL.position.set(-2.1, .9, 0); scene.add(wallL);
// window with blinds on the back wall: city night outside
const win = new THREE.Group(); scene.add(win); win.position.set(-.55, .62, -1.34);
{ const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .9), new THREE.MeshBasicMaterial({ color: 0x1a2c4a })); win.add(glow);
  const frameM = std(0x3a3833, .7);
  for (const [w, h, x, y] of [[1.06, .04, 0, .47], [1.06, .05, 0, -.47], [.04, .98, -.52, 0], [.04, .98, .52, 0], [.03, .9, 0, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .04), frameM); b.position.set(x, y, .02); win.add(b); }
  const slat = std(0x8d8a82, .6);
  for (let k = 0; k < 26; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.0, .022, .004), slat); s.position.set(0, .43 - k * .034, .06); s.rotation.x = -.9; win.add(s); }
  const sill = new THREE.Mesh(new THREE.BoxGeometry(1.15, .03, .14), frameM); sill.position.set(0, -.5, .07); win.add(sill); }
// the south wall: shelves of map tubes and binders, only the lamp's spill reaches them
const shelf = new THREE.Group(); scene.add(shelf); shelf.position.set(.05, TABLE_Y - .78, 1.45);
{ const wallS = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), wallMat); wallS.rotation.y = Math.PI; wallS.position.set(0, 1.7, .25); shelf.add(wallS);
  const wood = std(0x3a2a1c, .7);
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, .025, .32), wood); b.position.set(0, .5 + k * .38, 0); shelf.add(b); }
  for (const x of [-.8, .8]) { const sd = new THREE.Mesh(new THREE.BoxGeometry(.025, 1.6, .32), wood); sd.position.set(x, 1.05, 0); shelf.add(sd); }
  const r2 = mulberry(31), cols = [0x2d3b52, 0x5a2a1c, 0x3c4a35, 0x6b5a3a, 0x1f2a2a, 0x7a6a50];
  for (let k = 0; k < 4; k++) { let x = -.76; const y = .5 + k * .38 + .0125;
    while (x < .74) { if (k % 2 === 0) { const w = .03 + r2() * .03, h = .22 + r2() * .1, bk = new THREE.Mesh(new THREE.BoxGeometry(w, h, .24), std(cols[Math.floor(r2() * cols.length)], .7)); bk.position.set(x + w / 2, y + h / 2, -.02); shelf.add(bk); x += w + .004; }
      else { const r = .03 + r2() * .012, tube = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .3, 20), std([0xd9cfb8, 0xe7dfcc, 0x8a7a5a][Math.floor(r2() * 3)], .8)); tube.rotation.x = Math.PI / 2; tube.position.set(x + r, y + r, 0); shelf.add(tube); x += r * 2 + .006; } } } }
const spill = new THREE.PointLight(0xffb878, .5, 2.6, 2); spill.position.set(0, .35, .9); scene.add(spill);

// ---------- the plotter: bed, rails, beam, carriage with a Z holder and gripper, a rack of four pens
const alu = std(0xb9bdc2, .32, 1), steel = std(0xdfe3e8, .14, 1), black = std(0x141416, .42, .15), matte = std(0x0c0c0d, .75), rubber = std(0x080808, .9);
const bed = new THREE.Mesh(new RoundedBoxGeometry(.8, .022, .62, 2, .003), std(0xcfcfc9, .7)); bed.position.set(0, -.011, 0); bed.receiveShadow = true; bed.castShadow = true; scene.add(bed);
const bedEdge = new THREE.Mesh(new THREE.BoxGeometry(.81, .012, .63), alu); bedEdge.position.set(0, -.018, 0); scene.add(bedEdge);
const RX = .375, RZ0 = -.3, RZ1 = .3;
for (const s of [-1, 1]) {
  const rail = new THREE.Mesh(new THREE.BoxGeometry(.03, .032, RZ1 - RZ0), alu); rail.position.set(s * RX, .016, 0); scene.add(rail);
  for (const yy of [.008, .024]) { const g = new THREE.Mesh(new THREE.BoxGeometry(.031, .003, RZ1 - RZ0 + .001), matte); g.position.set(s * RX, yy, 0); scene.add(g); }
  for (const zz of [RZ0 - .01, RZ1 + .01]) { const cap = new THREE.Mesh(new RoundedBoxGeometry(.04, .045, .02, 2, .003), black); cap.position.set(s * RX, .0225, zz); scene.add(cap); }
}
// control box at the front right corner with a small status window (no text on it)
const ctl = new THREE.Mesh(new RoundedBoxGeometry(.14, .045, .08, 2, .004), black); ctl.position.set(.31, .0225, -.37); scene.add(ctl);
const lcd = new THREE.Mesh(new THREE.PlaneGeometry(.06, .016), new THREE.MeshBasicMaterial({ color: 0x3b6e4f })); lcd.rotation.x = -Math.PI / 2 + .3; lcd.position.set(.29, .046, -.345); scene.add(lcd);
const led = new THREE.Mesh(new THREE.SphereGeometry(.0025, 12, 8), new THREE.MeshBasicMaterial({ color: 0x7cff9a })); led.position.set(.355, .046, -.35); scene.add(led);
const beam = new THREE.Group(); scene.add(beam);
for (const s of [-1, 1]) {
  const blk = new THREE.Mesh(new RoundedBoxGeometry(.055, .1, .07, 3, .004), black); blk.position.set(s * RX, .082, 0); beam.add(blk);
  for (let k = 0; k < 4; k++) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(.0028, .0028, .002, 12), steel); sc.rotation.x = Math.PI / 2; sc.position.set(s * RX + (k % 2 - .5) * .03, .06 + Math.floor(k / 2) * .045, .0355); beam.add(sc); }
}
const mot = new THREE.Mesh(new RoundedBoxGeometry(.044, .044, .044, 2, .003), matte); mot.position.set(RX, .155, 0); beam.add(mot);
for (const [y, z] of [[.098, -.012], [.128, -.012]]) { const rod = new THREE.Mesh(new THREE.CylinderGeometry(.0055, .0055, RX * 2, 24), steel); rod.rotation.z = Math.PI / 2; rod.position.set(0, y, z); beam.add(rod); }
const belt = new THREE.Mesh(new THREE.BoxGeometry(RX * 2, .006, .0016), rubber); belt.position.set(0, .113, -.026); beam.add(belt);
const chain = new THREE.Group(); beam.add(chain);
const linkGeo = new RoundedBoxGeometry(.016, .012, .018, 2, .002); const LINKS = 64; const links = [];
for (let k = 0; k < LINKS; k++) { const m = new THREE.Mesh(linkGeo, black); m.castShadow = true; chain.add(m); links.push(m); }
const buildChain = cx => {
  const A = V(cx + .012, .165, -.018), B = V(RX - .03, .2, -.005), mid = V((A.x + B.x) / 2 + .03, .215, -.02);
  const curve = new THREE.CatmullRomCurve3([A, V(A.x + .03, .2, -.02), mid, V(B.x - .04, .225, -.012), B]);
  const L = curve.getLength(), n = Math.min(LINKS, Math.floor(L / .0165));
  for (let k = 0; k < LINKS; k++) { const m = links[k]; m.visible = k < n; if (!m.visible) continue; const t = k / n; m.position.copy(curve.getPointAt(t)); m.quaternion.setFromUnitVectors(V(1, 0, 0), curve.getTangentAt(t)); }
};
// carriage: rides the rods; the pen axis sits PEN_DZ in front of the beam
const PEN_DZ = .03;
const car = new THREE.Group(); beam.add(car);
{ const cb = new THREE.Mesh(new RoundedBoxGeometry(.07, .075, .045, 3, .005), black); cb.position.set(0, .112, -.004); car.add(cb);
  for (let k = 0; k < 4; k++) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(.0025, .0025, .002, 12), steel); sc.rotation.x = Math.PI / 2; sc.position.set((k % 2 - .5) * .05, .095 + Math.floor(k / 2) * .035, .019); car.add(sc); }
  const servo = new THREE.Mesh(new RoundedBoxGeometry(.03, .022, .02, 2, .003), std(0x1d3f8a, .5)); servo.position.set(-.024, .158, .004); car.add(servo);
  const guide1 = new THREE.Mesh(new THREE.CylinderGeometry(.0022, .0022, .09, 12), steel); guide1.position.set(-.012, .1, PEN_DZ - .012); car.add(guide1);
  const guide2 = guide1.clone(); guide2.position.x = .012; car.add(guide2);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(.05, .07, .008, 2, .002), black); plate.position.set(0, .112, .02); car.add(plate); }
// the Z holder: slides on the two guides, carries the gripper jaws
const holder = new THREE.Group(); car.add(holder);
{ const blk = new THREE.Mesh(new RoundedBoxGeometry(.04, .018, .028, 2, .003), alu); blk.position.set(0, .066, PEN_DZ - .006); holder.add(blk);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.0085, .002, 10, 32), alu); ring.rotation.x = Math.PI / 2; ring.position.set(0, .057, PEN_DZ); holder.add(ring);
  const spring = new THREE.Mesh(new THREE.TorusGeometry(.0035, .0008, 6, 16), steel); spring.position.set(.016, .075, PEN_DZ - .012); holder.add(spring); }
const jaws = [-1, 1].map(s => { const j = new THREE.Mesh(new RoundedBoxGeometry(.008, .014, .016, 2, .002), std(0x2a2a2c, .4, .3)); j.position.set(s * .01, .046, PEN_DZ); holder.add(j); return j; });
// pens: colour-coded barrels (black, brown, grey, red)
const PEN_COL = [0x1a1a1e, 0x6d3a1c, 0xa29f97, 0xc8261e];
const pens = PEN_COL.map(c => {
  const g = new THREE.Group(), m = new THREE.MeshPhysicalMaterial({ color: c, roughness: .32, clearcoat: .6, clearcoatRoughness: .25 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.0052, .0052, .085, 32), m); body.position.y = .061; g.add(body);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.0056, .0056, .022, 32), m); cap.position.y = .111; g.add(cap);
  const top = new THREE.Mesh(new THREE.SphereGeometry(.0056, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m); top.position.y = .122; g.add(top);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(.0054, .0054, .004, 32), std(0xe9e4d6, .5)); band.position.y = .093; g.add(band);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(.0058, .0058, .012, 32), black); grip.position.y = .046; g.add(grip);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(.0052, .0016, .014, 32), m); cone.position.y = .011; g.add(cone);
  const nib = new THREE.Mesh(new THREE.CylinderGeometry(.0011, .0006, .0045, 16), std(0xcfcfcf, .3, .7)); nib.position.y = .00225; g.add(nib);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.0006, 12, 8), m); tip.position.y = .0001; g.add(tip);
  scene.add(g); shadowAll(g); return g;
});
// rack: an aluminium bar with a rubber cup per stall, left of the sheet
const rack = new THREE.Group(); scene.add(rack);
{ const [x0, y0] = RACK(0), [, y3] = RACK(3); const c0 = wp(x0, (y0 + y3) / 2);
  const bar = new THREE.Mesh(new RoundedBoxGeometry(.022, .006, (y3 - y0) / 1000 + .03, 2, .002), alu); bar.position.set(c0.x, .003, c0.z); rack.add(bar);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(.03, .002, (y3 - y0) / 1000 + .04), black); foot.position.set(c0.x, .001, c0.z); rack.add(foot);
  for (let k = 0; k < 4; k++) { const p = wp(...RACK(k)); const cup = new THREE.Mesh(new THREE.CylinderGeometry(.0072, .0062, .012, 24, 1, true), rubber); cup.position.set(p.x, .006, p.z); rack.add(cup);
    const capTop = new THREE.Mesh(new THREE.TorusGeometry(.0068, .0012, 8, 24), rubber); capTop.rotation.x = Math.PI / 2; capTop.position.set(p.x, .012, p.z); rack.add(capTop);
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(.0022, .0022, .001, 16), std(PEN_COL[k], .5)); dot.position.set(p.x + .013, .0062, p.z); rack.add(dot); } }
shadowAll(beam); shadowAll(rack);
// tape at the sheet corners
{ const tapeMat = std(0xe6d8b0, .8, 0, { transparent: true, opacity: .9 });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const tp = new THREE.Mesh(new THREE.BoxGeometry(.05, .0004, .02), tapeMat); tp.position.set(sx * .297, .0011, sz * .21); tp.rotation.y = sx * sz * .78; scene.add(tp); } }
// desk props: a mug, a pencil, a field book, spare pens in a tray
const props = new THREE.Group(); scene.add(props);
{ const mugM = std(0xe8e2d6, .35); const mug = new THREE.Mesh(new THREE.CylinderGeometry(.04, .037, .095, 40, 1, true), mugM); mug.position.set(.62, TABLE_Y + .0475, -.38); props.add(mug);
  const mb = new THREE.Mesh(new THREE.CircleGeometry(.037, 32), mugM); mb.rotation.x = -Math.PI / 2; mb.position.set(.62, TABLE_Y + .002, -.38); props.add(mb);
  const tea = new THREE.Mesh(new THREE.CircleGeometry(.037, 32), std(0x3a1d0c, .15)); tea.rotation.x = -Math.PI / 2; tea.position.set(.62, TABLE_Y + .08, -.38); props.add(tea);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.024, .006, 12, 24, Math.PI), mugM); handle.rotation.z = -Math.PI / 2; handle.position.set(.66, TABLE_Y + .05, -.38); props.add(handle);
  const book = new THREE.Mesh(new RoundedBoxGeometry(.13, .016, .19, 2, .004), std(0x5b2a17, .6)); book.position.set(.64, TABLE_Y + .008, .1); book.rotation.y = -.3; props.add(book);
  const band = new THREE.Mesh(new THREE.BoxGeometry(.006, .017, .191), std(0x111111, .6)); band.position.set(.69, TABLE_Y + .0085, .085); band.rotation.y = -.3; props.add(band);
  const pencil = new THREE.Mesh(new THREE.CylinderGeometry(.0035, .0035, .17, 6), std(0x2c5b3a, .5)); pencil.rotation.set(0, .5, Math.PI / 2); pencil.position.set(.55, TABLE_Y + .0035, .3); props.add(pencil);
  const tray = new THREE.Mesh(new RoundedBoxGeometry(.06, .012, .16, 2, .003), black); tray.position.set(-.5, TABLE_Y + .006, .22); props.add(tray);
  for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.0045, .0045, .12, 16), new THREE.MeshPhysicalMaterial({ color: PEN_COL[k], roughness: .3, clearcoat: .6 })); p.rotation.x = Math.PI / 2; p.position.set(-.515 + k * .01, TABLE_Y + .016, .22); props.add(p); } }
shadowAll(props);
// architect's lamp clamped at the back left: the light of the scene
const lamp = new THREE.Group(); scene.add(lamp);
const LAMP_HEAD = V(-.31, .54, .2), LAMP_AIM = V(.02, 0, -.04);
{ const enamel = std(0x22352b, .38, .2);
  const base = V(-.68, TABLE_Y, .36), elbow = V(-.63, .44, .33);
  const clampB = new THREE.Mesh(new RoundedBoxGeometry(.05, .05, .05, 2, .004), enamel); clampB.position.copy(base).add(V(0, .025, 0)); lamp.add(clampB);
  const rod = (a, b, r) => { const d = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 12), steel); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); lamp.add(m); };
  for (const o of [-.012, .012]) { rod(base.clone().add(V(o, .05, 0)), elbow.clone().add(V(o, 0, 0)), .004); rod(elbow.clone().add(V(o, 0, 0)), LAMP_HEAD.clone().add(V(o, .03, 0)), .0035); }
  const knuckle = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .04, 16), enamel); knuckle.rotation.z = Math.PI / 2; knuckle.position.copy(elbow); lamp.add(knuckle);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.03, .085, .12, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x22352b, roughness: .35, metalness: .2, side: THREE.DoubleSide }));
  shade.position.copy(LAMP_HEAD); shade.quaternion.setFromUnitVectors(V(0, -1, 0), LAMP_AIM.clone().sub(LAMP_HEAD).normalize()); lamp.add(shade);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(.029, .084, .118, 40, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe2b8, side: THREE.BackSide })); inner.position.copy(shade.position); inner.quaternion.copy(shade.quaternion); lamp.add(inner);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.024, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff1d6 })); bulb.position.copy(LAMP_HEAD.clone().add(LAMP_AIM.clone().sub(LAMP_HEAD).normalize().multiplyScalar(.03))); lamp.add(bulb); }
shadowAll(lamp); lamp.traverse(m => { if (m.isMesh && m.material.isMeshBasicMaterial) m.castShadow = false; });
const key = new THREE.SpotLight(0xffc68e, Q.get('key') ? +Q.get('key') : 3, 3, .8, .8, 1.6);
key.position.copy(LAMP_HEAD.clone().add(LAMP_AIM.clone().sub(LAMP_HEAD).normalize().multiplyScalar(.05))); key.target.position.copy(LAMP_AIM);
key.castShadow = true; key.shadow.mapSize.set(4096, 4096); key.shadow.bias = -.0001; key.shadow.normalBias = .0015; key.shadow.radius = 3; key.shadow.camera.near = .05; key.shadow.camera.far = 2;
scene.add(key, key.target);
scene.add(new THREE.HemisphereLight(0xc9d4ff, 0x1a120a, .08));
const moon = new THREE.DirectionalLight(0x6f8fd0, .35); moon.position.set(-.6, 1.4, -2); scene.add(moon);
const bounce = new THREE.PointLight(0xffb070, .25, 1.6, 2); bounce.position.set(.1, .25, .3); scene.add(bounce);

// ---------- paper: a whole-sheet texture plus high-resolution patches for close shots
const grainTile = document.createElement('canvas'); grainTile.width = grainTile.height = 512;
{ const x = grainTile.getContext('2d'); const img = x.createImageData(512, 512); const d = img.data; const r2 = mulberry(17);
  for (let k = 0; k < d.length; k += 4) { const n = (r2() - .5) * 9; d[k] = 241 + n; d[k + 1] = 236 + n; d[k + 2] = 223 + n * .9; d[k + 3] = 255; }
  x.putImageData(img, 0, 0); x.globalAlpha = .07; x.strokeStyle = '#8a7a60'; x.lineWidth = .6;
  for (let k = 0; k < 900; k++) { const a = r2() * 6.28, l = 4 + r2() * 16, px = r2() * 512, py = r2() * 512; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + .4) * l * .5, py + Math.sin(a + .4) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); } }
const bumpTile = new THREE.CanvasTexture(grainTile); bumpTile.wrapS = bumpTile.wrapT = THREE.RepeatWrapping;
const BOX = S.map(strokeBox);
const preSet = new Set(PRE);
function makeSheet(x0, y0, w, h, k, lift) {
  const cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
  const ctx = cv.getContext('2d'); const pat = ctx.createPattern(grainTile, 'repeat');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = aniso; tex.minFilter = THREE.LinearMipmapLinearFilter;
  const bump = bumpTile.clone(); bump.repeat.set(w / 40, h / 40); bump.needsUpdate = true;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w / 1000, h / 1000), new THREE.MeshStandardMaterial({ map: tex, roughness: .93, bumpMap: bump, bumpScale: .35 }));
  mesh.rotation.x = -Math.PI / 2; mesh.position.copy(wp(x0 + w / 2, y0 + h / 2, lift)); mesh.receiveShadow = true; scene.add(mesh);
  const hit = i => { const b = BOX[i]; return b[2] >= x0 - 1 && b[0] <= x0 + w + 1 && b[3] >= y0 - 1 && b[1] <= y0 + h + 1; };
  const pre = PRE.filter(hit), prog = []; for (let k2 = 0; k2 < PROG.length; k2++) if (hit(PROG[k2])) prog.push(k2);
  const st = { cv, ctx, tex, mesh, x0, y0, w, h, k, n: -1, saved: null };
  const begin = () => { ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalCompositeOperation = 'multiply'; };
  st.reset = () => { ctx.fillStyle = pat; ctx.fillRect(0, 0, cv.width, cv.height); begin(); for (const i of pre) drawStroke(ctx, S[i], k, x0, y0); ctx.restore(); st.n = 0; };
  st.update = (pst, withPartial) => {
    let changed = false;
    if (st.n < 0 || pst.n < st.n) { st.reset(); changed = true; }
    if (pst.n > st.n) { begin(); let lo = 0, hi = prog.length; while (lo < hi) { const m = (lo + hi) >> 1; if (prog[m] < st.n) lo = m + 1; else hi = m; }
      for (let q = lo; q < prog.length && prog[q] < pst.n; q++) drawStroke(ctx, S[PROG[prog[q]]], k, x0, y0);
      ctx.restore(); st.n = pst.n; changed = true; }
    if (withPartial && pst.cur && pst.cur.d > 0 && hit(pst.cur.i)) {
      const b = BOX[pst.cur.i], m = 1.5, rx = Math.max(0, Math.floor((b[0] - m - x0) * k)), ry = Math.max(0, Math.floor((b[1] - m - y0) * k));
      const rw = Math.min(cv.width, Math.ceil((b[2] + m - x0) * k)) - rx, rh = Math.min(cv.height, Math.ceil((b[3] + m - y0) * k)) - ry;
      if (rw > 0 && rh > 0) { st.saved = { img: ctx.getImageData(rx, ry, rw, rh), rx, ry }; begin(); drawStroke(ctx, S[pst.cur.i], k, x0, y0, pst.cur.d); ctx.restore(); changed = true; }
    }
    if (changed) tex.needsUpdate = true;
  };
  st.restore = () => { if (st.saved) { ctx.putImageData(st.saved.img, st.saved.rx, st.saved.ry); st.saved = null; tex.needsUpdate = true; } };
  return st;
}

const base = makeSheet(0, 0, SHW, SHH, 3584 / SHW, .4);   // the whole sheet at ≈ 6 px/mm (close shots use the patches below)
const PATCH = {   // shot → window (mm) and resolution (px/mm)
  1: [40, 190, 100, 100, 34], 2: [120, 170, 340, 140, 15], 40: null, 3: [330, 92, 230, 80, 22], 4: [470, 160, 110, 160, 16],
};
const patches = {}; for (const [k, w] of Object.entries(PATCH)) if (w) { patches[k] = makeSheet(w[0], w[1], w[2], w[3], w[4], .6); patches[k].mesh.visible = false; }

// ---------- post
const post = makePost(renderer, scene, camera, W, H, { ssaa: SS, ao: true, aoRadius: .018, aoScale: 1.4 });
post.bloom.strength = .12; post.vig.uniforms.amt.value = .62; post.vig.uniforms.warm.value = .35; post.vig.uniforms.contrast.value = .14;

// ---------- cameras (the camera keeps moving through the jumps; only the machine jumps)
const PS = t => { const st = plotState(G, warp(t)); return [st.x, st.y]; };
const segBounds = t => { let a = 0, b = DUR; for (const j of [...JUMPS, 2.5, 7.5, 8.0, 9.375]) { if (j <= t) a = Math.max(a, j); else b = Math.min(b, j); } return [a, b]; };
function penSmooth(t, half, n = 9) { const [lo, hi] = segBounds(t); let x = 0, y = 0, c = 0; for (let k = 0; k < n; k++) { const u = t + (k / (n - 1) - .5) * 2 * half; if (u < lo || u > hi - 1e-4) continue; const [px, py] = PS(u); x += px; y += py; c++; } return c ? [x / c, y / c] : PS(t); }
const look = (pos, at, fov, aper, focus) => ({ pos, look: at, fov, aper, focus: focus || at });
function cameraAt(t) {
  const sh = SHOT(t);
  if (sh === 1) {   // macro, low across the paper on the nib: the puddle, the splash at 0.94 s, the figure of that footfall
    const [px, py] = penSmooth(t, .25), f = ss(t / 2.5);
    const at = wp(lerp(px, SPX + 8, .45), lerp(py, GROUND - 14, .4), 2);
    const pos = at.clone().add(V(lerp(.05, .035, f), lerp(.045, .06, f), lerp(.11, .1, f)));
    return look(pos, at, lerp(30, 34, f), 1.7, wp(px, py, 1));
  }
  if (sh === 2) {   // long lens along the chart: the camera travels with 'now' on the axis, the pen jumps to each footfall
    const xNow = tx(t) + 6, hold = ss(segT(t, 6.0, 6.5)) * (1 - ss(segT(t, 7.1, 7.5)));
    const [px] = penSmooth(t, .3), cx = lerp(xNow, px, .35 + .3 * hold);
    const at = wp(cx, GROUND - 26 - 6 * hold), pos = at.clone().add(V(lerp(-.01, .02, (t - 2.5) / 5), .2 - .03 * hold, .26 - .03 * hold));
    return look(pos, at, 19, 1.0, at);
  }
  if (sh === 40) {   // insert at the rack: the holder comes down on the red pen
    const u = (t - 7.5) / .5, p = wp(...RACK(3), 30);
    return look(p.clone().add(V(.075 - .01 * u, .03 + .004 * u, .05)), p.clone().add(V(0, -.012, 0)), 30, 2.2, p.clone().add(V(0, -.012, 0)));
  }
  if (sh === 3) {   // on the red pen as it writes the hero number
    const [px, py] = penSmooth(t, .3), f = ss((t - 8.6) / .7);
    const at = wp(lerp(px, NUMX + 70, .4 + .4 * f), lerp(py, NUMY + 24, .5 + .3 * f));
    return look(at.clone().add(V(-.02, lerp(.13, .2, f), lerp(.1, .15, f))), at, lerp(24, 28, f), lerp(1.2, .7, f), at);
  }
  // S4: on the red pen at the chime, then out to the whole sheet and the desk
  const [px, py] = penSmooth(Math.min(t, 9.7), .2), f2 = s5((t - 9.5) / .5);
  const n0 = wp(px, py), p0 = n0.clone().add(V(.05, .12, .11));
  const pos = p0.clone().lerp(V(.26, .52, .66), f2), at = n0.clone().lerp(V(-.02, 0, -.02), f2);
  return look(pos, at, lerp(24, 40, f2), lerp(1.1, .35, f2), at);
}

// ---------- render
window.DUR = DUR;
window.render = t => {
  t = clamp(t, 0, DUR);
  const sh = SHOT(t), P = warp(t), st = plotState(G, P);
  base.update(st, !patches[sh]);                                     // the stroke under the pen is drawn on the patch when one is in use
  for (const [k, p] of Object.entries(patches)) { const on = String(sh) === k; p.mesh.visible = on; if (on) p.update(st, true); }
  const z = st.z / 1000, pw = wp(st.x, st.y);
  beam.position.z = pw.z - PEN_DZ; car.position.x = pw.x; holder.position.y = z; buildChain(pw.x);
  const g = st.grip; jaws[0].position.x = -.0066 - .004 * (1 - g); jaws[1].position.x = .0066 + .004 * (1 - g);
  pens.forEach((pn, k) => { if (k === st.held) pn.position.set(pw.x, z, pw.z); else { const r = wp(...RACK(k)); pn.position.set(r.x, 0, r.z); } });
  led.material.color.setHex(st.down ? 0x7cff9a : 0x2f6f40);
  const cam = cameraAt(t);
  camera.position.copy(cam.pos); camera.fov = cam.fov; camera.up.set(0, 1, 0); camera.lookAt(cam.look); camera.updateProjectionMatrix();
  post.dof.aper = cam.aper; post.dof.maxCoc = 14; post.dof.focus = camera.position.distanceTo(cam.focus);
  post.composer.render();
  base.restore(); for (const p of Object.values(patches)) p.restore();
};
window.RIGQA = t => { const id = clipShot(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
