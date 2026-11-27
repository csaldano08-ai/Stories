// 079 · Circuit Board — the first 10 s of "Last Train Home" as a printed circuit board seen from straight above (lemo-opuscar styles/circuit-board).
// A narrative adaptation in the board's own language (src/board.js): her run is current on the route trace (a DC stream behind a travelling
// head, at her real speed: 1 board unit = 1 cm); every footfall of the shared rig is a via that flashes when the foot lands (near foot south,
// far foot north), and at each near-foot contact her pose at that instant is plotted in silkscreen beside the route (constant bone lengths,
// joint limits: the rig's own drawing). Amber is energy; silver-cyan is the second flow, water.
//   S1  ride the pulse, macro: the lake (the puddle, a clearance in the copper) arrives; at 0.94 s her far foot lands in it: water light
//   S2  rise while following until the whole route is in frame; at 6.05 s the current taps into the watch module: its display lights
//   S3  crash zoom onto the display (the quartz crystal rocking at 32.768 kHz beside it): 11:58:47 → 48 at 8.4 s
//   S4  whip along the trace to the station clock U1: on the chime (9.58 s) it flashes and rings out as alternating current on its rays
// Engine: the library's demo render.js / post.js / font.js / geo.js / parts.js, unchanged. Page contract: render(t), DUR, READY, RIGQA, TEXTS.
import { Board, setSize, camFor, camMatrix, toScreen } from './src/render.js';
import { makePost } from './src/post.js';
import { at, sub, measure } from './src/geo.js';
import { PAL, rgb } from './src/palette.js';
import { makeWorld } from './src/board.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080; setSize(W, H);
const cv = document.getElementById('c'), ctx = cv.getContext('2d');

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
const W_T = t => 11 * 3600 + 58 * 60 + 48 + (t - 8.4);
const X0 = X(0), WD = makeWorld({ RUN, poseAt, X0, SPL, WATCH_T: EV.watchUp, X });
const board = new Board(cv, WD, { unit: 4 }), post = makePost(W, H);
const sAt = t => 200 + (X(t) - X0) * .28;            // her place along the route (it starts at x = −200)
const head = t => at(WD.route.m, sAt(t));

// ═════════ the scene the board draws at t
const DIGS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
const circ = (x, y, r, n = 40) => { const p = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; p.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return p; };
function scene(t) {
  const sc = { t, labels: {}, ac: [], dc: [], glow: [], flashes: [] }, L = sc.labels;
  L.aki = seg(t, -.3, .3); L.run = seg(t, -.1, .5); for (let i = 0; i < 8; i++) L['shop' + i] = 1;
  // her current: a lit stream behind the travelling head
  sc.dc.push({ trace: WD.route, head: sAt(t), s0: Math.max(0, sAt(t) - 1100), decay: 300, floor: .1, v: 420, minPx: 3.4, maxPx: 56 });
  // footfalls: a quick bloom when the foot lands, then a steady glow
  for (const s of WD.STEPS) { const a = t - s.t0; if (a < 0) continue; sc.flashes.push(a < .45 ? { p: [s.x, s.y], r: 30, a: .95 * (1 - a / .45) + .25, maxPx: 60 } : { p: [s.x, s.y], r: 9, a: .32, maxPx: 22 }); }
  for (const f of WD.FIGS) L[f.id] = seg(t, f.t0, f.t0 + .28);
  // the splash: water light from the far foot's via in the lake
  const a = t - SPL.t0, sp = WD.STEPS.find(s => Math.abs(s.t0 - SPL.t0) < .02);
  if (a >= 0) { L.wet = seg(t, SPL.t0 + .02, SPL.t0 + .3); L.wett = seg(t, SPL.t0 + .15, SPL.t0 + .4);
    if (a < 1.6) { sc.flashes.push({ p: [sp.x, sp.y], r: 60, a: .9 * Math.exp(-a * 2.6), c: PAL.water, maxPx: 120 });
      for (let k = 0; k < 3; k++) { const u = (a - k * .14) / 1.1; if (u > 0 && u < 1) sc.glow.push({ pts: circ(sp.x, sp.y, 10 + 92 * eo(u)), w: 2.4, a: .75 * (1 - u), c: PAL.water.g }); }
      if (a < .6) for (let i = 0; i < 14; i++) { const th = i / 14 * Math.PI * 2 + .2, r0 = 14 + a * 150, r1 = r0 + 10; sc.glow.push({ pts: [[sp.x + Math.cos(th) * r0, sp.y + Math.sin(th) * r0], [sp.x + Math.cos(th) * r1, sp.y + Math.sin(th) * r1]], w: 2.2, a: .9 * (1 - a / .6), c: PAL.water.h }); } }
    sc.glow.push({ pts: circ(WD.PX, -8, 70, 48), w: 1.2, a: .12 + .1 * Math.sin(t * 3), c: PAL.water.g }); }
  // the watch: the crystal always rocks (AC); the tap carries her current in at 6.05 s and the display lights
  sc.ac.push({ trace: WD.osc, a: .7, lam: 9, amp: .35, f: 3.1 });
  const tw = EV.watchUp; if (t >= tw - .06) { sc.dc.push({ trace: WD.tap, head: WD.tap.m.len * seg(t, tw - .06, tw + .1), s0: 0, decay: 60, floor: .5, minPx: 3, maxPx: 34 }); L.watch = seg(t, tw, tw + .35); }
  if (t >= tw + .08) { const s = Math.floor(W_T(t) + 1e-6), str = [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map(v => String(v).padStart(2, '0')).join(''), tick = (t - .4) - Math.floor(t - .4);
    const on = seg(t, tw + .08, tw + .2);
    [...str].forEach((ch, i) => { const S = WD.DIG[i], changed = tick < .14 && (i === 5 || (i === 4 && s % 10 === 0));
      for (const k of DIGS[ch]) sc.glow.push({ pts: S[k], w: 4.4, a: .95 * on, c: PAL.cur.g });
      if (changed && t > tw + .3) sc.flashes.push({ p: [S.g[0][0] + 7, S.g[0][1]], r: 34, a: .8 * (1 - tick / .14), maxPx: 90 }); });
    for (const [x, y] of WD.COL) sc.flashes.push({ p: [x, y], r: 4, a: .8 * on * (tick < .5 ? 1 : .55), maxPx: 16 }); }
  // the station clock: plotted as the camera arrives; on the chime it flashes and rings out on its rays
  L.station = seg(t, 9.36, 9.62); L.clock = seg(t, 9.46, 9.66);
  const c = t - EV.chime; if (c >= 0) { L.chime = seg(c, .02, .3);
    sc.flashes.push({ p: WD.UC, r: 140, a: .85 * Math.exp(-c * 3.2) + .18, maxPx: 170 });
    for (const r of WD.RAYS) sc.ac.push({ trace: r, s0: 0, s1: r.m.len * clamp(c / .25), a: Math.exp(-c * 1.2), lam: 26, amp: .45, f: 4 }); }
  return sc;
}

// ═════════ the camera: straight down always; ride → rise → crash zoom → whip
const logz = (a, b, u) => Math.exp(lerp(Math.log(a), Math.log(b), u));
const mixC = (A, B, u) => ({ x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), z: logz(A.z, B.z, u), r: 0 });
const DISP = [WD.DIG[0].a[0][0] + 96, WD.DIG[0].a[0][1] + 21];
const CA = t => camFor(head(t), [700, 700], lerp(2.15, 2.25, seg(t, 0, 2.5)));
const CB = () => camFor([2420, 40], [960, 540], .335);
const CE = t => camFor(DISP, [960, 520], lerp(5.0, 5.35, seg(t, 7.85, 9.375)));
const CF = t => camFor([WD.UC[0] - 160, 0], [1060, 560], lerp(1.3, 1.12, ss(seg(t, 9.56, 10))));
function camAt(t) {
  if (t < 7.5) return mixC(CA(t), CB(), ss(seg(t, 2.5, 5.9)));
  if (t < 9.375) return mixC(CB(), CE(t), eio(seg(t, 7.5, 7.84)));
  return mixC(CE(9.375), CF(t), eio(seg(t, 9.375, 9.56)));
}
const GROUP = t => t < 7.5 ? [0, 7.5] : t < 9.375 ? [7.5, 9.375] : [9.375, 10.01];
function drawAt(t) { board.frame(camAt(t), scene(t)); }
// motion blur from measured screen motion (sub-frames averaged), never across a shot boundary
const acc = new OffscreenCanvas(W, H), actx = acc.getContext('2d'), SHUT = 1 / 60;
function motionPx(t) { const [g0, g1] = GROUP(t), a = clamp(t - SHUT / 2, g0, g1 - 1e-4), b = clamp(t + SHUT / 2, g0, g1 - 1e-4), Ma = camMatrix(camAt(a)), Mb = camMatrix(camAt(b));
  const inv = (M, p) => { const det = M[0] * M[3] - M[1] * M[2], x = p[0] - M[4], y = p[1] - M[5]; return [(M[3] * x - M[2] * y) / det, (-M[1] * x + M[0] * y) / det]; };
  let m = 0; for (const p of [[0, 0], [W, 0], [0, H], [W, H], [W / 2, H / 2]]) { const q = toScreen(Mb, inv(Ma, p)); m = Math.max(m, Math.hypot(q[0] - p[0], q[1] - p[1])); } return m; }
window.render = t => {
  t = clamp(+t || 0, 0, DUR); const [g0, g1] = GROUP(t), N = Math.min(14, Math.max(1, Math.ceil(motionPx(t) / 2.6)));
  if (N <= 1) drawAt(t);
  else { for (let i = 0; i < N; i++) { const ti = clamp(t + (i / (N - 1) - .5) * SHUT, g0, g1 - 1e-4); drawAt(ti); actx.globalAlpha = 1 / (i + 1); actx.drawImage(cv, 0, 0); }
    actx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(acc, 0, 0); }
  const cam = camAt(t), dof = t < 2.5 ? .3 : t < 7.5 ? .3 * (1 - ss(seg(t, 2.5, 4.2))) : t < 9.375 ? .5 : .3;
  post(ctx, { t, dof, motes: .8, px: cam.x * cam.z * .2, py: cam.y * cam.z * .2 });
};
window.TEXTS = t => board.texts(camAt(t), scene(t));
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
