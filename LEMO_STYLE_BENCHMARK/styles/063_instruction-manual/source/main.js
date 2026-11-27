// 063 · Instruction Manual Art — the first 10 s of "Last Train Home" as one printed manual page (lemo-opuscar styles/instruction-manual).
// A narrative adaptation: the procedure is the run to the last train, four numbered steps on one sheet, true isometric, faceless
// AKI at real proportions (162 cm, driven by the shared rig: the profile rig's points become her vertical plane in the world, near
// limbs toward the viewer, the far leg one shade darker). Yellow marks the one thing acted on in each step and turns white after:
// 1 · the puddle (her left foot lands in it at 0.94 s; drops, rings) — 2 · the route, flat arrows printed on the pavement ahead of her,
// a whip pan from step 1 and a tracking pan along the page; at the raise her watch turns yellow, a magnifier ring and leader grow from
// her wrist — 3 · the camera pushes through the magnifier circle: her hand in close-up at 12×, the yellow dial, a rotation arrow and a
// click as the seconds hand steps to 48 — 4 · a shape-matched cut from the round dial to the round station clock, a pull back to the
// tower; on the chime the clock face is the last part to turn yellow, with the manual's click marks. On the page: only step numbers.
// Engine: engine/iso.js, hand.js, rig.js, page.js copied unchanged. Page contract: window.render(t), DUR, READY, RIGQA.
import { PAL, makeView, box, cyl, blob, poly3, planeArrow, turnArrow, setLW, setGrow, clickMark, add3, sub3, mul3, norm3, lerp3 } from './engine/iso.js';
import { hand } from './engine/hand.js';
import { stepNum, magnifier, FONT } from './engine/page.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2;
const cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all([`700 150px ${FONT.num}`].map(f => document.fonts.load(f, '1234')));

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

// ═════════ world: centimetres, y up; she runs along +x on the pavement (top at y = 0), shopfronts behind her (z < 0)
const CM = .28, xw = rx => (rx - SPL.x) * CM, XH = t => xw(X(t));
const P3 = (p, z) => [xw(p[0]), -p[1] * CM, z];
const ZF = -170, KERB = 190, STREET = [-900, 5400];
const PUD = { x: 6, z: 20, rx: 66, rz: 60 };
const SPX = [xw(SPL.x) + 8, 0, -8.6];
const TOWER = { x0: 5500, x1: 6000, z0: -820, z1: -320, h: 2600, clk: [5750, 2050, -320], r: 115 };
const SHOPS = (() => { const r = mulberry(63), o = []; let x = -900; while (x < 5450) { const w = 420 + Math.round(r() * 4) * 45; o.push({ x, w: Math.min(w, 5480 - x), h: 380 + Math.round(r() * 3) * 55, awn: r() < .35 }); x += w; } return o; })();
const yel = k => k >= 1 ? PAL.neu : k <= 0 ? PAL.part : { top: mixc(PAL.part.top, PAL.neu.top, k), z: mixc(PAL.part.z, PAL.neu.z, k), x: mixc(PAL.part.x, PAL.neu.x, k) };
function mixc(a, b, k) { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), c = s => Math.round(lerp((A >> s) & 255, (B >> s) & 255, k)); return `rgb(${c(16)},${c(8)},${c(0)})`; }
const ring3 = (c, r, n = 48, y = 0) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU; return [c[0] + Math.cos(a) * r, (c[1] || 0) + y, c[2] + Math.sin(a) * r]; });

function street(v, t, x0, x1) {
  box(v, [Math.max(STREET[0], x0), -14, ZF], [Math.min(STREET[1], x1), 0, KERB], PAL.part, { depth: -1e5 });
  box(v, [Math.max(STREET[0], x0), -26, KERB], [Math.min(STREET[1], x1), -10, KERB + 18], PAL.part, { depth: -1e5 + 1 });
  for (let x = -800; x < 5300; x += 800) { if (x + 30 < x0 || x - 30 > x1) continue;                 // lamp posts along the back edge
    cyl(v, [x, 0, ZF + 30], [x, 18, ZF + 30], 11, PAL.metal); cyl(v, [x, 18, ZF + 30], [x, 420, ZF + 30], 5, PAL.metal, { bias: .1 });
    box(v, [x - 13, 420, ZF + 17], [x + 13, 462, ZF + 43], PAL.part, { bias: .2 }); }
  // the station tower at the street's end, its clock face on the street side
  if (x1 > TOWER.x0 - 200) {
    box(v, [TOWER.x0, 0, TOWER.z0], [TOWER.x1, TOWER.h, TOWER.z1], PAL.part);
    box(v, [TOWER.x0 - 25, TOWER.h, TOWER.z0 - 25], [TOWER.x1 + 25, TOWER.h + 40, TOWER.z1 + 25], PAL.part);
    poly3(v, [[TOWER.x0 - 25, TOWER.h + 40, TOWER.z1 + 25], [TOWER.x1 + 25, TOWER.h + 40, TOWER.z1 + 25], [(TOWER.x0 + TOWER.x1) / 2, TOWER.h + 520, (TOWER.z0 + TOWER.z1) / 2]], PAL.part.z, { bias: 2 });
    poly3(v, [[TOWER.x1 + 25, TOWER.h + 40, TOWER.z1 + 25], [TOWER.x1 + 25, TOWER.h + 40, TOWER.z0 - 25], [(TOWER.x0 + TOWER.x1) / 2, TOWER.h + 520, (TOWER.z0 + TOWER.z1) / 2]], PAL.part.x, { bias: 2 });
    for (const y of [700, 1400]) box(v, [TOWER.x0 - 12, y, TOWER.z0 - 12], [TOWER.x1 + 12, y + 30, TOWER.z1 + 12], PAL.part);
    box(v, [TOWER.x0 + 170, 2280, TOWER.z1], [TOWER.x1 - 170, 2520, TOWER.z1 + 4], PAL.part);            // belfry opening
    const k = ss(seg(t, EV.chime, EV.chime + .12)), C = TOWER.clk;
    cyl(v, C, add3(C, [0, 0, 10]), TOWER.r, { top: yel(k).top, z: PAL.metal.z, x: PAL.metal.x }, { cap: yel(k).top, bias: 5 });
    v.add(v.depth(add3(C, [0, 0, 12])) + 6, gg => {
      gg.save(); gg.strokeStyle = PAL.ink; gg.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, p0 = v.P(add3(C, [Math.sin(a) * TOWER.r * .78, Math.cos(a) * TOWER.r * .78, 11])), p1 = v.P(add3(C, [Math.sin(a) * TOWER.r * .92, Math.cos(a) * TOWER.r * .92, 11])); gg.lineWidth = v.s * (i % 3 ? 3 : 6); gg.beginPath(); gg.moveTo(...p0); gg.lineTo(...p1); gg.stroke(); }
      const wt = W_T(t), hand_ = (fr, L, w) => { const a = fr * TAU, p0 = v.P(add3(C, [0, 0, 12])), p1 = v.P(add3(C, [Math.sin(a) * L, Math.cos(a) * L, 12])); gg.lineWidth = v.s * w; gg.beginPath(); gg.moveTo(...p0); gg.lineTo(...p1); gg.stroke(); };
      hand_((wt / 3600 % 12) / 12, TOWER.r * .5, 9); hand_((wt / 60 % 60) / 60, TOWER.r * .78, 6);
      gg.restore();
    }, 1);
  }
}
const W_T = t => 11 * 3600 + 58 * 60 + 48 + (t - 8.4);                    // the shared watch time: 11:58:47 on the cut, 48 at 8.4 s
const secShown = t => 47 + (t >= 8.4 ? 1 : 0) + (t >= 9.4 ? 1 : 0);

// ═════════ AKI, faceless, at real proportions: hulls of spheres on the shared rig's points
function aki(v, t, o = {}) {
  const J = solveProfile(poseAt(t));
  const L = (k, z, col, colShoe) => { const l = J.leg[k], hip = P3(l.hip, z), knee = P3(l.knee, z), ank = P3(l.ankle, z);
    blob(v, [[hip, 7.4], [knee, 5.6]], col); blob(v, [[knee, 5.4], [ank, 4.0]], col, { bias: .1 });
    const c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = (u, w) => P3([l.ankle[0] + u * c - w * s, l.ankle[1] + u * s + w * c], z);
    blob(v, [[F(-16, 6), 3.6], [F(52, 10), 3.0], [F(66, 9), 2.6]], colShoe, { bias: .2 }); };
  const A = (k, z, col, watch) => { const a = J.arm[k], sh = P3(a.sh, z), el = P3(a.el, z), wr = P3(a.wr, z), d = norm3(sub3(wr, el)), he = add3(wr, mul3(d, 9));
    blob(v, [[sh, 5.2], [el, 4.2]], col); blob(v, [[el, 4.1], [wr, 3.5]], col, { bias: .1 }); blob(v, [[wr, 3.2], [he, 2.6]], '#FFFFFF', { bias: .2 });
    if (watch) { const wp = lerp3(el, wr, .84); cyl(v, add3(wp, [0, 0, 2.6]), add3(wp, [0, 0, 4.2]), 2.4, watch, { cap: watch.top, bias: .3 }); } };
  const wk = ss(seg(t, EV.watchUp, EV.watchUp + .25)) * (1 - ss(seg(t, 7.9, 8.2)));
  A('f', -19, PAL.grey2, null); L('f', -8.6, PAL.grey3, PAL.grey3);
  // the coat: chest to mid-thigh, and the hem's back panel swinging (secondary motion)
  const TT = (b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f];
  const fa = SIM.flap(t), hemB = P3(TT(J.pelvis, -90, -40 - (fa - .3) * 60), 0);
  blob(v, [[P3(TT(J.neckBase, -14, 0), 0), 12.5], [P3(J.waist, 0), 12.0], [P3(TT(J.pelvis, -40, 4), 0), 13.2], [P3(TT(J.pelvis, -90, 14), 0), 12.0], [hemB, 11.5]], PAL.grey1);
  L('n', 8.6, PAL.grey2, PAL.grey3);
  blob(v, [[P3(J.neckBase, 0), 4.6], [P3(J.neckTop, 0), 4.2]], '#FFFFFF', { bias: -.5 });
  // head with its hair region and ponytail in the head's own frame
  const hc = P3(J.headC, 0), ha = J.headA, HR = (u, w) => { const c = Math.cos(ha), s = Math.sin(ha); return P3([J.headC[0] + u * c - w * s, J.headC[1] + u * s + w * c], 0); };
  blob(v, [[hc, 10.2], [HR(4, 10), 9.4]], '#FFFFFF', { bias: 1 });
  blob(v, [[HR(-9, -6), 9.6], [HR(-4, -14), 8.4]], PAL.grey3, { bias: 1.2 });
  const ta = SIM.tail(t); let ang = Math.PI - .25 + ta[0] + ha, p = [J.headC[0] - Math.cos(ha) * 50, J.headC[1] - Math.sin(ha) * 50 - 10]; const chain = [[P3(p, 0), 3.6]];
  for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i]; p = [p[0] + Math.cos(ang) * Lk, p[1] + Math.sin(ang) * Lk]; chain.push([P3(p, 0), [3.0, 2.2, 1.0][i]]); ang += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
  blob(v, chain, PAL.grey3, { bias: .9 });
  A('n', 19, PAL.grey1, wk > 0 ? yel(wk) : PAL.metal);
  return J;
}
// the splash: drops as small spheres in flight, rings on the water (line only)
const DROPS = (() => { const r = mulberry(631), o = []; for (let i = 0; i < 18; i++) { const az = r() * TAU, el = lerp(40, 72, r()) * Math.PI / 180, sp = lerp(110, 240, r()); o.push({ v: [Math.cos(az) * Math.cos(el) * sp, Math.sin(el) * sp, Math.sin(az) * Math.cos(el) * sp * .8], r: lerp(1.1, 2.4, r()) }); } return o; })();
function puddle(v, t) {
  const k = 1 - ss(seg(t, 1.5, 1.9)), pts = [];
  for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, r = 1 + .1 * Math.sin(a * 3 + 1.2) + .06 * Math.sin(a * 5 + .4); pts.push([PUD.x + Math.cos(a) * PUD.rx * r, .3, PUD.z + Math.sin(a) * PUD.rz * r]); }
  poly3(v, pts, yel(k).top, { depth: -9e4 });
  const a = t - EV.splash;
  if (a > 0) {
    for (let j = 0; j < 3; j++) { const u = a - j * .14; if (u <= 0 || u > 1.2) continue; poly3(v, ring3(SPX, 6 + 60 * Math.pow(u / 1.2, .6), 40, .6), null, { depth: -8.9e4, lw: 2.6 * (1 - u / 1.2) + .6 }); }
    for (const d of DROPS) { const y = 2 + d.v[1] * a - 490 * a * a; if (y < 0 || a > 1) continue; blob(v, [[[SPX[0] + d.v[0] * a, y, SPX[2] + d.v[2] * a], d.r]], '#FFFFFF'); }
  }
}
// the route arrows printed on the pavement ahead of her (arrow first, she follows it)
const ARROWS = [400, 900, 1400, 1900, 2400];
function arrows(v, t) {
  for (const ax of ARROWS) { const due = ax - 360, xh = XH(t); const p = clamp((xh - due) / 140); if (p <= 0) continue;
    setGrow(p); planeArrow(v, [ax, .4, 95], [1, 0, 0], [0, 0, 1], 160, 34, { depth: -8e4 }); setGrow(1); }
}

// ═════════ the 2D camera over the page: centre (page units at s = 1) and zoom (px per cm)
const V0 = makeView({ cx: 0, cy: 0, s: 1 });
const pageOf = p => V0.P(p);
function viewAt(c, z) { const v = makeView({ cx: W / 2 - c[0] * z, cy: H / 2 - c[1] * z, s: z }); setLW(2.6 * clamp(Math.pow(z / 2.6, .55), .55, 1.5)); return v; }
const herC = t => { const J = solveProfile(poseAt(t)); return pageOf(add3(P3(J.pelvis, 0), [60, 10, 0])); };
const WR_T = 6.7, wristPage = () => { const J = solveProfile(poseAt(WR_T)), a = J.arm.n; return pageOf(lerp3(P3(a.el, 19), P3(a.wr, 19), .84)); };
const MAGC = () => { const w = wristPage(); return [w[0] + 170, w[1] - 165]; }, MAGR = 78;   // the big circle, printed on the page (page units)
function camAt(t) {
  if (t < 2.5) { const c = pageOf([PUD.x - 10, 60, PUD.z]); return { c, z: lerp(3.0, 3.35, ss(seg(t, 0, 1.4))) }; }
  if (t < 7.5) {
    const whip = ss(seg(t, 2.5, 2.8)), c0 = pageOf([PUD.x - 10, 60, PUD.z]), c1 = herC(t);
    let c = [lerp(c0[0], c1[0], whip), lerp(c0[1], c1[1], whip)], z = lerp(3.35, 2.7, whip);
    const m = MAGC(), pu = ss(seg(t, 6.1, 6.75)), mid = [(c1[0] + m[0]) / 2, (c1[1] + m[1]) / 2];
    c = [lerp(c[0], mid[0], pu), lerp(c[1], mid[1], pu)]; z = lerp(z, 2.55, pu);
    const push = ei(seg(t, 7.05, 7.5)), pc = ss(seg(t, 6.95, 7.4)); c = [lerp(c[0], m[0], pc), lerp(c[1], m[1], pc)]; z = lerp(z, 15, push);
    return { c, z, whip: t > 2.5 && t < 2.8 ? [c1[0] - c0[0], c1[1] - c0[1]] : null };
  }
  if (t < 9.375) { const m = MAGC(); return { c: [m[0] + 6 * ss(seg(t, 7.5, 9.375)), m[1]], z: lerp(15, 16, ss(seg(t, 7.5, 9.375))) }; }
  const C = pageOf(TOWER.clk), u = eo(seg(t, 9.375, 10)), end = pageOf([TOWER.x0 - 700, 1550, -150]);
  return { c: [lerp(C[0], end[0], u), lerp(C[1], end[1], u)], z: lerp(2.6, .46, u) };
}
// paper: off-white stock with fine fibres that travel with the page and keep their size on a zoom
const PAPER = (() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const q = c.getContext('2d'); q.fillStyle = PAL.paper; q.fillRect(0, 0, 1024, 1024);
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 1300; i++) { const x = r() * 1024, y = r() * 1024, a = r() * Math.PI, l = 4 + r() * 16; q.strokeStyle = r() < .5 ? 'rgba(120,105,80,0.05)' : 'rgba(255,255,255,0.22)'; q.lineWidth = .6 + r() * .6;
    for (const [ox, oy] of [[0, 0], [-1024, 0], [0, -1024], [-1024, -1024]]) { q.beginPath(); q.moveTo(x + ox, y + oy); q.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l * .4); q.stroke(); } }
  for (let i = 0; i < 130; i++) { q.fillStyle = 'rgba(90,80,60,0.10)'; q.fillRect(r() * 1024, r() * 1024, 1 + r(), 1 + r()); }
  return c; })();
function paper(cam) { const ox = ((-cam.c[0] * cam.z) % 1024 + 1024) % 1024, oy = ((-cam.c[1] * cam.z) % 1024 + 1024) % 1024;
  for (let x = ox - 1024; x < W; x += 1024) for (let y = oy - 1024; y < H; y += 1024) g.drawImage(PAPER, x, y); }

// ═════════ the close-up in the magnifier: her right hand at 12×, palm down, the watch on the back of the wrist
const MAGK = 12;                                                    // page units per cm inside the circle
function closeUp(gg, cx, cy, rr, t) {
  // forearm along (1, 0, −1)/√2 (level on the page), so the dial's 12 points up the page and 3 toward the hand
  const E3 = norm3([1, 0, -1]), E12 = norm3([-1, 0, -1]), Wst = mul3(E3, 6), WC = add3(mul3(E3, 2.8), [0, 2.5, 0]);
  const sc = rr / MAGR * MAGK, D0 = makeView({ cx: 0, cy: 0, s: sc }).P(add3(WC, [0, .92, 0]));
  const v = makeView({ cx: cx - D0[0] + rr * .05, cy: cy - D0[1] + rr * .04, s: sc });
  hand(v, { wrist: Wst, dir: E3, palm: [0, -1, 0], side: 'r', pose: 'relaxed', sleeve: PAL.grey1, cuff: 7, frame: { cx, cy, r: rr } });
  const wc = WC, k = 1;
  cyl(v, add3(wc, add3(mul3(E3, -.9), [0, -2.6, 0])), add3(wc, add3(mul3(E3, .9), [0, -2.6, 0])), 2.62, { top: PAL.grey2, z: PAL.grey2, x: PAL.grey2 }, { bias: 2 });   // the strap round the wrist
  cyl(v, wc, add3(wc, [0, .9, 0]), 1.85, { top: yel(k).top, z: PAL.metal.z, x: PAL.metal.x }, { cap: yel(k).top, bias: 3 });
  const D = add3(wc, [0, .92, 0]);
  v.add(v.depth(D) + 10, q => {
    q.save(); q.strokeStyle = PAL.ink; q.lineCap = 'round';
    const at = (a, r) => v.P(add3(D, add3(mul3(E3, Math.sin(a) * r), mul3(E12, Math.cos(a) * r))));      // dial angle: 12 up the page, clockwise to 3 toward the hand
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, p0 = at(a, 1.35), p1 = at(a, 1.62); q.lineWidth = v.s * (i % 3 ? .07 : .14); q.beginPath(); q.moveTo(...p0); q.lineTo(...p1); q.stroke(); }
    const wt = W_T(t), s = secShown(t), tk = s === 48 ? 8.4 : 9.4, sp = s === 47 ? 1 : back(seg(t, tk, tk + .1), 3.2);
    const hnd = (a, L, w) => { q.lineWidth = v.s * w; q.beginPath(); q.moveTo(...v.P(D)); q.lineTo(...at(a, L)); q.stroke(); };
    hnd((wt / 3600 % 12) / 12 * TAU, .85, .16); hnd((wt / 60 % 60) / 60 * TAU, 1.3, .11); hnd((s - 1 + sp) / 60 * TAU, 1.5, .045);
    q.fillStyle = PAL.ink; q.beginPath(); const c0 = v.P(D); q.arc(c0[0], c0[1], v.s * .12, 0, TAU); q.fill(); q.restore();
  }, 2);
  // the manual's signs: a rotation arrow round the dial (clockwise), a click at the tick
  const ap = ss(seg(t, 7.85, 8.2));
  if (ap > 0) { setGrow(ap); turnArrow(v, add3(D, [0, .05, 0]), [0, -1, 0], E12, 2.45, -.9, .5, v.s * .22); setGrow(1); }
  v.flush(gg);
  const ck = seg(t, 8.4, 8.62); if (ck > 0 && ck < 1) { const s0 = (48 / 60) * TAU, p = v.P(add3(D, add3(mul3(E3, Math.sin(s0) * 1.62), mul3(E12, Math.cos(s0) * 1.62)))); gg.save(); gg.globalAlpha = 1 - ss(seg(ck, .6, 1)); clickMark(gg, p[0], p[1], 20 + 14 * eo(ck), -Math.PI * .75, 3.2); gg.restore(); }
}

// ═════════ one frame
function frame(t) {
  const cam = camAt(t), v = viewAt(cam.c, cam.z);
  paper(cam);
  const xh = XH(t), span = W / cam.z * 1.6;
  street(v, t, pageX(cam.c[0]) - span, pageX(cam.c[0]) + span);
  puddle(v, t); arrows(v, t);
  const J = aki(v, t);
  v.flush(g);
  // step numbers, printed on the page
  const S2s = q => [W / 2 + (q[0] - cam.c[0]) * cam.z, H / 2 + (q[1] - cam.c[1]) * cam.z], num = (n, q) => { const p = S2s(q); stepNum(g, n, p[0], p[1], 150 * cam.z / 3); };
  const c1 = pageOf([PUD.x - 10, 60, PUD.z]), h2 = herC(2.8), tw = pageOf([TOWER.x0 - 60, TOWER.h + 100, TOWER.z1]);
  num(1, [c1[0] - 262, c1[1] - 80]); num(2, [h2[0] - 250, h2[1] - 100]); num(4, [tw[0] - 330, tw[1] - 60]);
  // magnifier: the ring at her wrist (when she reads it), the leader, the big circle with the close-up; step number 3 beside it
  const mg = seg(t, 6.45, 6.9);
  if (mg > 0) {
    const a_ = J.arm.n, sp = pageOf(lerp3(P3(a_.el, 19), P3(a_.wr, 19), .84)), m = MAGC(), S = q => [W / 2 + (q[0] - cam.c[0]) * cam.z, H / 2 + (q[1] - cam.c[1]) * cam.z], spot = S(sp), mc = S(m), rr = MAGR * cam.z * eo(mg);
    if (t < 7.5) magnifier(g, spot, mc[0], mc[1], Math.max(2, rr), gg => closeUp(gg, mc[0], mc[1], Math.max(2, rr), t), { spotR: 7 * cam.z });
    else { g.save(); g.beginPath(); g.arc(mc[0], mc[1], rr, 0, TAU); g.fillStyle = '#FBF9F4'; g.fill(); g.clip(); closeUp(g, mc[0], mc[1], rr, t); g.restore(); g.save(); g.lineWidth = 3.4; g.strokeStyle = PAL.ink; g.beginPath(); g.arc(mc[0], mc[1], rr, 0, TAU); g.stroke(); g.restore(); }
    const n3 = S([m[0] - MAGR * .95, m[1] - MAGR * .55]); stepNum(g, 3, n3[0] - 40 * cam.z / 3, n3[1], 150 * cam.z / 3 * Math.min(1, eo(mg)));
  }
  // the chime: the manual's click marks round the clock face
  if (t > EV.chime && t < 10.5) { const C = v.P(add3(TOWER.clk, [0, 0, 12])), k = seg(t, EV.chime, EV.chime + .35);
    for (const a of [-2.4, -.75, .9]) { g.save(); g.globalAlpha = 1 - ss(seg(k, .7, 1)); clickMark(g, C[0], C[1], TOWER.r * v.s * (1.25 + .25 * eo(k)), a, Math.max(2.2, 3 * cam.z / 2)); g.restore(); } }
  // whip pan: the page smears along the camera path for a few frames
  if (cam.whip) { const sp = ss(seg(t, 2.5, 2.8)) - ss(seg(t - 1 / 30, 2.5, 2.8)), dx = -cam.whip[0] * cam.z * sp, dy = -cam.whip[1] * cam.z * sp;
    const snap = document.createElement('canvas'); snap.width = W; snap.height = H; snap.getContext('2d').drawImage(cv, 0, 0);
    g.save(); for (let k = 1; k <= 6; k++) { g.globalAlpha = .16; g.drawImage(snap, dx * k / 6, dy * k / 6); } g.restore(); }
  return J;
}
const pageX = cx => cx / Math.cos(Math.PI / 4);                     // page u → a world x near the view (for culling the street)
window.render = t => frame(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
