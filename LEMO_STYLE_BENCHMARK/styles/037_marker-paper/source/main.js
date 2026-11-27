// 037 · Marker on Paper — the first 10 s of "Last Train Home" drawn with one bullet-tip black marker on matte white paper,
// a blue marker for what we know and a red one for what we want (lemo-opuscar styles/marker-paper). Stroke by stroke, no
// hand and no pen, drawings on twos (three boil drawings per sheet), letters written along their skeletons, never boiled.
//
// Four sheets, the style's only two transitions:
//   ① 0–2.5    the puddle: ground line, the puddle, "24H CAFE" upside down in it (its reflection), rain flicks; AKI's
//              legs drawn once per footfall (a motion study: ink cannot move), the boot lands in the puddle at 0.9375 s
//              (crown, droplets, ripples); a raindrop ring in the puddle → PUSH THROUGH (2.2–2.5)
//   ② 2.5–7.5  the street: arrives through the same ring (a puddle at her next footfall), pulls out, tracks the run.
//              AKI drawn once per footfall (15 drawings from the run rig), splash flicks at every footfall, the street
//              drawn ahead of her (ground, wet streaks, the shop signs). 6.05–7.15 she raises the wrist: the watch is
//              the given → BLUE circle on the wrist. PUSH THROUGH the blue watch (7.15–7.5)
//   ③ 7.5–9.2  the watch: arrives on the blue hub, pulls out; rim and ticks black, hands at 23:58 BLUE (the given),
//              the second hand drawn again at every tick (47 → 48 at 8.4 → 49 at 9.4), sleeve, strap, drops, light
//              streaks; the sheet's one question written top-left: "Last train?" → PEEL (9.17–9.62)
//   ④ 9.17–10  the city tops under a rainy sky and the station clock (hands 23:58 BLUE again: same colour, same
//              quantity); on the chime (9.575) the film's last stroke: THE LAST RED CIRCLE, round the station clock.
// Red is used once, and it is the last stroke. Camera: top-down over the paper only (strokes drawn through it, so they
// stay crisp when pushed in), the ②-track at the runner's speed, a run-cadence bob on ③, a slow crane-down drift on ④.
// Engine: engine/pen.js (the demo's marker brush, ink density, paper; one marked edit for sheets longer than the frame).
// Page contract: window.render(t), DUR, READY, RIGQA, EV (pen-down events for the native sound design).
import { W, H, Ink, line, poly, curve, circle, rect, makePaper, composeOn, paperCanvas, reseed, setBoil, setGlyphs } from './engine/pen.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, back, ss, eo, ei, mulberry, TAU } from './shared/lib/util.js';

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

const cv = document.getElementById('c'), CX = cv.getContext('2d');
const ink = new Ink();
const K = 'black', RD = 'red', BL = 'blue';
const TW = .0625;                       // phase of the twos: a drawing boundary falls on the splash (0.9375 s)

// ───────── sheets and pen actions (the demo's film.js grammar): E(t0, t1, kind, items) — strokes and/or letters drawn in order
const SHEETS = [];
let CUR = null, B = 0, NI = 0;
const lenOf = it => it.T ? it.T.L : it.len;
function E(t0, t1, kind, items) {
  items = [items].flat(4).filter(Boolean);
  if (B === 0) CUR.EL.push({ t0, t1, kind, color: items[0].T ? items[0].T.color : items[0].color });
  CUR.BUILD[B][NI++] = items;
}
const T = (s, x, y, o = {}) => { const L = ink.layout(s, x, y, { font: 'Kalam', ...o }); L.align = o.align; return { T: L }; };
function sheet(def) { const S = { EL: [], BUILD: [[], [], []], PW: W, PH: H, ...def }; SHEETS.push(S); return S; }

// ───────── AKI as marker lines, from the run rig (the same solve every style uses); M maps rig units → paper
function aki(J, M, k, o = {}) {
  const w = o.w ?? 6.5, jit = .35, out = { back: [], front: [] };
  const TT = (b, u, f) => M([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]);
  const hc = J.headC, HR = p => { const c = Math.cos(J.headA), s = Math.sin(J.headA); return M([hc[0] + p[0] * c - p[1] * s, hc[1] + p[0] * s + p[1] * c]); };
  const legOf = kk => {
    const l = J.leg[kk], c = Math.cos(l.pitch), s = Math.sin(l.pitch), F = ([u, v]) => M([l.ankle[0] + u * c - v * s, l.ankle[1] + u * s + v * c]);
    const sh = (u, v) => { const d = [l.knee[0] - l.ankle[0], l.knee[1] - l.ankle[1]], L = Math.hypot(...d) || 1; return M([l.ankle[0] + d[0] / L * u - d[1] / L * v, l.ankle[1] + d[1] / L * u + d[0] / L * v]); };
    const boot = [sh(46, 22), sh(0, 22), F([-20, 16]), F([62, 16]), F([64, 2]), F([20, -6]), sh(46, -20)];
    return [poly([M(l.hip), M(l.knee), M(l.ankle)], { w, jitter: jit }), poly([...boot, boot[0], boot[1]], { w: w * .9, jitter: .25 })];
  };
  const armOf = kk => {
    const a = J.arm[kk], hand = M([a.wr[0] + (a.wr[0] - a.el[0]) * .16, a.wr[1] + (a.wr[1] - a.el[1]) * .16]);
    return [poly([M(a.sh), M(a.el), M(a.wr)], { w: w * .95, jitter: jit }), circle(hand[0], hand[1], 11 * k, { w: w * .8, jitter: .15, lap: .15 })];
  };
  const coat = [TT(J.neckBase, 6, -26), TT(J.waist, 0, -42), TT(J.pelvis, -104, -62), TT(J.pelvis, -110, 54), TT(J.waist, 0, 36), TT(J.neckBase, -6, 28)];
  const cap = [HR([34, -34]), HR([8, -54]), HR([-30, -48]), HR([-54, -14]), HR([-52, 22]), HR([-38, 44])];
  const strands = [[HR([-50, -6]), HR([-84, 2]), HR([-112, -4]), HR([-136, 8])], [HR([-46, 18]), HR([-78, 30]), HR([-104, 26]), HR([-124, 40])]];
  const head = HR([4, 0]);
  const strokes = [
    ...legOf('f'), ...armOf('f'),
    poly([...coat, coat[0], coat[1]], { w, jitter: jit }),
    ...legOf('n'), ...armOf('n'),
    circle(head[0], head[1], 42 * k, { w, jitter: .2, a0: -2.4, lap: .2 }),
    curve(cap, { w: w * .95, jitter: .3, smooth: 2 }), ...strands.map(q => curve(q, { w: w * .8, jitter: .3, smooth: 2 })),
    line(...HR([24, -6]), ...HR([30, -6]), { w: w * 1.1, jitter: 0, bow: 0, over: 0, pool: 0 }),
  ];
  return strokes;
}
const contactsIn = (a, b) => RUN.contacts.filter(c => c.t0 >= a && c.t0 < b);
const flicks = (x, y, n, R, s = 1, o = {}) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / Math.max(1, n - 1) - .5) * 2.3 + (R() - .5) * .2, r0 = (10 + R() * 8) * s, l = (18 + R() * 22) * s;
    out.push(line(x + Math.cos(a) * r0, y + Math.sin(a) * r0 * .7, x + Math.cos(a) * (r0 + l), y + Math.sin(a) * (r0 + l) * .7, { w: o.w ?? 3.6, jitter: .15, pool: .4, bow: .03, over: 0 }));
  }
  return out;
};

// ═════════ sheet ①  0–2.5: the puddle (insert at ground level)
const K1 = .9, GY1 = 860, PX1 = 1000;
const M1 = p => [PX1 + (p[0] - SPL.x) * K1, GY1 + p[1] * K1];
const RING1 = { x: 1252, y: 878, rx: 30, ry: 6.6, w: 2.6 };          // the raindrop ring the camera pushes through
const LASTF = 1 / 30;                      // a push ends on the last frame of its sheet; the next sheet's first frame is the same picture
const PUSH1 = [2.17, 2.5 - LASTF], Z1 = 1.8, Z1E = 12;
const S1 = sheet({
  id: 1, seed: 8,
  cam(t) {
    const base = [lerp(990, 1016, clamp(t / PUSH1[0])), 760, Z1];
    if (t <= PUSH1[0]) return base;
    const u = ei(clamp((t - PUSH1[0]) / (PUSH1[1] - PUSH1[0])));
    return [lerp(base[0], RING1.x, u), lerp(base[1], RING1.y, u), Math.exp(lerp(Math.log(Z1), Math.log(Z1E), u))];
  },
  build() {
    reseed(101); const R = mulberry(17);
    // the ground, broken where the water begins
    E(0.00, 0.20, 'line', line(300, GY1 + 2, PX1 - 352, GY1, { w: 9, wav: 500, jitter: .5, over: 0 }));
    E(0.14, 0.28, 'line', line(PX1 + 356, GY1 - 1, 1720, GY1 + 3, { w: 9, wav: 500, jitter: .5, over: 0 }));
    // the puddle: one irregular closed line lying on the ground
    const pp = []; for (let i = 0; i <= 26; i++) { const a = Math.PI + i / 26 * TAU * 1.04, n = 1 + .06 * Math.sin(a * 3 + 1.3) + .04 * Math.sin(a * 5); pp.push([PX1 + Math.cos(a) * 360 * n, GY1 + 12 + Math.sin(a) * 46 * n]); }
    E(0.24, 0.42, 'line', curve(pp, { w: 7, jitter: .4, smooth: 2 }));
    // its reflection: the café sign upside down in the water
    E(0.42, 1.18, 'write', T('24H CAFE', PX1 - 20, GY1 + 6, { size: 40, rot: Math.PI, align: 'center', jit: .5 }));
    // rain at three depths, in short bursts all through the shot
    const rain = n => { const o = []; for (let i = 0; i < n; i++) { const d = R(), l = 20 + d * 36, w = 2.8 + d * 3.4, x = 470 + R() * 1100, y = 480 + R() * 340; o.push(line(x, y, x + l * .24, y + l, { w, jitter: .15, pool: .3, bow: .02, over: 0 })); } return o; };
    [[0.02, .30], [.36, .62], [.66, .9], [1.12, 1.4], [1.46, 1.74], [1.8, 2.08], [2.1, 2.36]].forEach(([a, b]) => E(a, b, 'hatch', rain(7)));
    // her legs, once per footfall (.593 off the puddle, .9375 in it, 1.282 off it)
    for (const c of contactsIn(.4, 1.5)) {
      const J = solveProfile(poseAt(c.t0));
      E(c.t0 - .17, c.t0 - .003, 'line', aki(J, M1, K1, { w: 8 }));
      const fx = M1([c.x, 0])[0];
      if (c !== SPL) E(c.t0 + .005, c.t0 + .05, 'hatch', flicks(fx + 20, GY1 - 2, 4, R, 1.1));
    }
    // the splash: crown, droplets, ripples
    const sx = M1([SPL.x, 0])[0] + 26, crown = [], drops = [];
    for (let i = 0; i < 9; i++) { const a = -Math.PI + .25 + i / 8 * (Math.PI - .5), r0 = 26 + R() * 10, l = 42 + R() * 50; crown.push(line(sx + Math.cos(a) * r0, GY1 + Math.sin(a) * r0 * .9, sx + Math.cos(a) * (r0 + l), GY1 + Math.sin(a) * (r0 + l) * .9, { w: 4.6, jitter: .2, pool: .5, bow: .05, over: 0 })); }
    for (let i = 0; i < 10; i++) { const a = -Math.PI + .2 + i / 9 * (Math.PI - .4), r = 120 + R() * 70, x = sx + Math.cos(a) * r, y = GY1 - 30 + Math.sin(a) * r * .8; drops.push(line(x, y, x + 2, y + 5, { w: 7, jitter: 0, pool: 0, over: 0 })); }
    E(.92, .99, 'hatch', crown);
    E(.99, 1.10, 'hatch', drops);
    E(1.10, 1.24, 'line', circle(sx, GY1 + 10, 96, { ry: 21, w: 5, jitter: .3, a0: -2.6, lap: .2 }));
    E(1.40, 1.60, 'line', circle(sx, GY1 + 12, 148, { ry: 32, w: 4.4, jitter: .3, a0: -2.2, lap: .2 }));
    // rain rings on the water; the last one is the mark we push through
    for (const [t0, x, y] of [[.70, 720, 900], [1.66, 846, 906], [1.86, 760, 878]]) E(t0, t0 + .05, 'line', circle(x, y, 22, { ry: 4.8, w: 2.6, jitter: .2, lap: .22 }));
    E(1.96, 2.04, 'line', circle(RING1.x, RING1.y, RING1.rx, { ry: RING1.ry, w: RING1.w, jitter: .2, a0: -2.2, lap: .22 }));
  },
});

// ═════════ sheet ②  2.5–7.5: the street (a long sheet; the camera tracks the run)
const K2 = .75, GY2 = 900, PW2 = 7100;
const C7 = RUN.contacts.find(c => c.t0 > 2.5);
const XA = 700, M2 = p => [XA + (p[0] - C7.x) * K2, GY2 + p[1] * K2];
const RING2 = { x: XA + 14, y: GY2 + 6, rx: RING1.rx * 2, ry: RING1.ry * 2 };
const Z2A = Z1E * RING1.rx / RING2.rx;                                 // the ring arrives at the size it left
RING2.w = RING1.w * Z1E / Z2A;
const Xs = t => M2([X(t), 0])[0];
const track = t => [Math.max(960, Xs(t) + 60), 540, 1];
const CW = contactsIn(6.6, 7.0)[0];                                    // the figure whose watch we push through (full raise)
const JW = solveProfile(poseAt(CW.t0)), WM = M2(JW.arm.n.wr), WR2 = 17, WW2 = 5, Z2E = 10;
const PUSH2 = [7.15, 7.5 - LASTF];
const S2 = sheet({
  id: 2, seed: 15, PW: PW2,
  cam(t) {
    if (t < 3.0) { const u = eo((t - 2.5) / .5), b = track(t); return [lerp(RING2.x, b[0], u), lerp(RING2.y, b[1], u), Math.exp(lerp(Math.log(Z2A), 0, u))]; }
    if (t < PUSH2[0]) return track(t);
    const u = ei(clamp((t - PUSH2[0]) / (PUSH2[1] - PUSH2[0]))), a = track(PUSH2[0]);
    return [lerp(a[0], WM[0], u), lerp(a[1], WM[1], u), Math.exp(lerp(0, Math.log(Z2E), u))];
  },
  build() {
    reseed(202); const R = mulberry(29);
    // the mark is already there when we arrive
    E(2.40, 2.41, 'line', circle(RING2.x, RING2.y, RING2.rx, { ry: RING2.ry, w: RING2.w, jitter: .2, a0: -2.2, lap: .22 }));
    // the street, drawn ahead of her: the ground is one long line whose pen runs ~900 px in front of her (just inside the
    // right edge of the frame), broken at the puddle; the wet streaks follow it; the shop signs are drawn as they come in
    const tA = x => { for (let t = 2.4; t < 7.6; t += .005) if (Xs(t) >= x) return t; return 7.6; };
    const rightAt = x => { for (let t = 2.5; t < 7.5; t += .01) if (track(t)[0] + 960 >= x) return t; return 7.5; };
    const LEAD = 900, streaks = (a, b) => { const o = []; for (let x = a + 30; x < b - 40; x += 90 + R() * 80) { const y = GY2 + 22 + R() * 46, l = 24 + R() * 70; o.push(line(x, y, x + l, y + (R() - .5) * 2, { w: 3.6, jitter: .2, pool: .3, bow: .02, over: 0 })); } return o; };
    E(2.44, 2.54, 'line', line(150, GY2 - 1, RING2.x - RING2.rx - 4, GY2 + 1, { w: 7, wav: 600, jitter: .5, over: 0 }));
    E(2.54, 2.68, 'line', line(RING2.x + RING2.rx + 4, GY2 + 1, 1600, GY2 - 1, { w: 7, wav: 600, jitter: .5, over: 0 }));
    E(2.70, 2.84, 'hatch', streaks(150, 1600));
    let tg = 2.68;
    for (let x = 1580, i = 0; x < PW2 - 120; x += 880, i++) {
      const b = Math.min(PW2 - 80, x + 900), t0 = Math.max(tg, tA(x - LEAD)), t1 = Math.max(t0 + .2, tA(b - LEAD));
      if (t0 > 7.5) break;
      E(t0, t1, 'line', line(x, GY2 + (i % 2 ? 1 : -1), b, GY2 + (i % 2 ? -1 : 2), { w: 7, wav: 600, jitter: .5, over: 0 }));
      E(t1 + .02, t1 + .16, 'hatch', streaks(x, b)); tg = t1;
    }
    for (const [x, word] of [[1150, 'CAFE'], [2380, 'BAKERY'], [3640, 'BOOKS'], [4880, 'NOODLES'], [6080, 'HOTEL']]) {
      const sz = 62, tw = ink.measure(word, { size: sz }), bw = tw + 68, y0 = 150, bh = 106, t0 = x < 1900 ? 2.86 : rightAt(x + 360);
      if (t0 > 7.3) break;
      E(t0, t0 + .14, 'line', [rect(x, y0, bw, bh, { w: 6.5, jitter: .3 }), line(x + 28, y0 - 4, x + 28, 70, { w: 5.5, over: 0 }), line(x + bw - 28, y0 - 4, x + bw - 28, 70, { w: 5.5, over: 0 })]);
      E(t0 + .16, t0 + .16 + word.length / 10, 'write', T(word, x + bw / 2, y0 + bh * .7, { size: sz, align: 'center', jit: .6 }));
    }
    // AKI, once per footfall: the drawing lands on the touch-down; splash flicks at the foot; the watch in blue
    for (const c of contactsIn(2.6, 7.6)) {
      const S_ = poseAt(c.t0), J = solveProfile(S_);
      E(c.t0 - .19, c.t0 - .004, 'line', aki(J, M2, K2, { w: 7.5 }));
      const fx = M2([c.x, 0])[0];
      E(c.t0, c.t0 + .06, 'hatch', flicks(fx + 20, GY2 - 2, 4, R, .9, { w: 3.8 }));
      if (S_.watch > .5) { const p = M2(J.arm.n.wr); E(c.t0 + .01, c.t0 + .045, 'line', circle(p[0], p[1], WR2, { color: BL, w: WW2, jitter: .1, a0: -2.2, lap: .25, pool: .3 })); }
    }
  },
});

// ═════════ sheet ③  7.5–9.4: the watch
const WC = [930, 600], RIM = 230, HUB = { r: 20 };
const Z3A = Z2E * WR2 / HUB.r; HUB.w = WW2 * Z2E / Z3A;                // the hub arrives at the size and weight it left
const PEEL = { a: 9.17, b: 9.62 };
const handDir = a => [Math.cos(a), Math.sin(a)];
const AH = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, AM = -Math.PI / 2 + 58 / 60 * TAU, AS = s => -Math.PI / 2 + s / 60 * TAU;
const S3 = sheet({
  id: 3, seed: 22,
  cam(t) {
    const end = [990 + 10 * (t - 7.95), 575, 1.22], u = eo((t - 7.5) / .45);
    const bob = 8 * Math.sin(TAU * CADENCE * (t - 7.5)) * ss((t - 7.5) / .5);
    if (t < 7.95) return [lerp(WC[0], end[0], u), lerp(WC[1], end[1], u) + bob, Math.exp(lerp(Math.log(Z3A), Math.log(end[2]), u))];
    return [end[0], end[1] + bob, end[2]];
  },
  build() {
    reseed(303); const R = mulberry(31);
    E(7.40, 7.41, 'line', circle(WC[0], WC[1], HUB.r, { color: BL, w: HUB.w, jitter: .1, a0: -2.2, lap: .25, pool: .3 }));
    E(7.52, 7.64, 'line', circle(WC[0], WC[1], RIM, { w: 10, jitter: .5, a0: -2.5, lap: .2 }));
    const ticks = []; for (let k = 0; k < 12; k++) { const d = handDir(-Math.PI / 2 + k / 12 * TAU), r0 = k % 3 ? 196 : 182; ticks.push(line(WC[0] + d[0] * r0, WC[1] + d[1] * r0, WC[0] + d[0] * 214, WC[1] + d[1] * 214, { w: k % 3 ? 5.5 : 8, jitter: .1, pool: .5, over: 0 })); }
    E(7.64, 7.78, 'hatch', ticks);
    // the given, in blue: 23:58
    const hand = (a, r, w) => { const d = handDir(a); return line(WC[0] - d[0] * 22, WC[1] - d[1] * 22, WC[0] + d[0] * r, WC[1] + d[1] * r, { color: BL, w, jitter: .2, over: 0, bow: .004 }); };
    E(7.80, 7.90, 'line', [hand(AH, 118, 10), hand(AM, 176, 8)]);
    // the second hand: ink cannot move, so it is drawn again at every tick
    const sec = s => { const d = handDir(AS(s)); return line(WC[0] - d[0] * 34, WC[1] - d[1] * 34, WC[0] + d[0] * 200, WC[1] + d[1] * 200, { w: 4.2, jitter: .1, over: 0, bow: 0, pool: .6 }); };
    E(7.91, 7.94, 'line', sec(47));
    // strap, cuff and sleeve on the left, the back of the hand on the right
    const sy = 118, sx = Math.sqrt(RIM * RIM - sy * sy);
    E(7.95, 8.16, 'line', [
      line(WC[0] - sx, WC[1] - sy, 452, WC[1] - sy + 4, { w: 7, over: 0 }), line(WC[0] - sx, WC[1] + sy, 448, WC[1] + sy - 2, { w: 7, over: 0 }),
      curve([[470, 408], [438, 520], [436, 680], [460, 800]], { w: 8, jitter: .4 }),
      line(470, 412, 140, 372, { w: 8, over: 0 }), line(460, 796, 140, 846, { w: 8, over: 0 }),
      line(WC[0] + sx, WC[1] - sy, 1330, WC[1] - sy - 2, { w: 7, over: 0 }), line(WC[0] + sx, WC[1] + sy, 1330, WC[1] + sy + 2, { w: 7, over: 0 }),
      curve([[1330, 470], [1520, 446], [1700, 432], [1840, 440]], { w: 8, jitter: .4 }), curve([[1330, 734], [1520, 760], [1700, 786], [1840, 800]], { w: 8, jitter: .4 }),
    ]);
    // the sheet's one question, top-left, written as it is asked
    E(8.16, 9.02, 'write', T('Last train?', 290, 256, { size: 80 }));
    E(8.38, 8.41, 'line', sec(48));
    // raindrops on the crystal; the street lights streaking past
    E(8.62, 8.78, 'line', [circle(862, 470, 12, { w: 4, jitter: .1, lap: .2 }), circle(1046, 694, 9, { w: 4, jitter: .1, lap: .2 }), circle(808, 690, 14, { w: 4, jitter: .1, lap: .2 })]);
    E(8.84, 9.10, 'hatch', [line(1360, 206, 1770, 200, { w: 6, over: 0 }), line(1440, 268, 1750, 265, { w: 4, over: 0 }), line(260, 930, 690, 936, { w: 5, over: 0 }), line(1290, 948, 1760, 942, { w: 6, over: 0 })]);
    E(9.38, 9.41, 'line', sec(49));
  },
});

// ═════════ sheet ④  9.17–10: city tops under the rain, the station clock, the last red circle on the chime
const TX = 1480, TC = [TX, 560], TR = 52;
const S4 = sheet({
  id: 4, seed: 41,
  cam(t) { return [960, lerp(528, 552, ss((t - PEEL.a) / (DUR - PEEL.a))), 1.04]; },
  build() {
    reseed(404); const R = mulberry(43);
    // the station tower (revealed first: the peel lifts from the bottom-right)
    E(9.20, 9.34, 'line', [line(TX - 62, 900, TX - 62, 470, { w: 7, over: 0 }), line(TX + 62, 900, TX + 62, 470, { w: 7, over: 0 }),
      poly([[TX - 80, 476], [TX, 392], [TX + 80, 476]], { w: 7, jitter: .3 }), line(TX, 392, TX + 1, 346, { w: 5, over: 0 })]);
    E(9.34, 9.42, 'line', circle(TC[0], TC[1], TR, { w: 7, jitter: .3, a0: -2.4, lap: .2 }));
    const hd = (a, r, w) => { const d = handDir(a); return line(TC[0] - d[0] * 6, TC[1] - d[1] * 6, TC[0] + d[0] * r, TC[1] + d[1] * r, { color: BL, w, jitter: .1, over: 0, bow: 0 }); };
    E(9.43, 9.51, 'line', [hd(AH, 26, 6.5), hd(AM, 40, 5)]);
    // the city tops: one long line, drawn from the right
    const sk = [[1900, 846]]; let x = 1900;
    while (x > 60) { const wdt = 110 + R() * 170, h = 780 + R() * 90; if (x > TX + 62 && x - wdt < TX + 62) { sk.push([TX + 62, sk[sk.length - 1][1]]); x = TX - 62; sk.push([x, h]); continue; } sk.push([x, h]); x -= wdt; sk.push([x, h]); }
    sk.push([20, sk[sk.length - 1][1]]);
    const right = sk.filter(p => p[0] >= TX + 62), left = sk.filter(p => p[0] <= TX - 62);
    E(9.22, 9.34, 'line', poly(right, { w: 6.5, jitter: .3 }));
    E(9.34, 9.54, 'line', poly(left, { w: 6.5, jitter: .3 }));
    // the sky: two cloud edges, rain
    const cloud = (x0, x1, y, r) => { const p = []; for (let x = x0; x < x1; x += r * 1.7) for (let k = 0; k <= 8; k++) { const a = Math.PI + k / 8 * Math.PI; p.push([x + r * .85 + Math.cos(a) * r * .85, y + Math.sin(a) * r * .6]); } return curve(p, { w: 5, jitter: .3, smooth: 1 }); };
    E(9.40, 9.54, 'line', [cloud(180, 860, 240, 34), cloud(1040, 1720, 300, 30)]);
    const rain = []; for (let i = 0; i < 16; i++) { const d = R(), l = 20 + d * 30, x0 = 80 + R() * 1760, y0 = 120 + R() * 600; rain.push(line(x0, y0, x0 + l * .24, y0 + l, { w: 2.8 + d * 3, jitter: .15, pool: .3, over: 0 })); }
    E(9.26, 9.53, 'hatch', rain);
    // the last red circle: on the departure chime, round the station clock — the film's last stroke
    E(9.555, 9.78, 'line', circle(TC[0], TC[1], 92, { color: RD, w: 7.5, ry: 92, a0: -2.8, lap: .35 }));
  },
});

// ───────── camera → matrix (never past the paper's edge)
function matrix([cx, cy, z], S) {
  const hw = W / 2 / z, hh = H / 2 / z;
  if (2 * hw <= S.PW) cx = clamp(cx, hw, S.PW - hw);
  if (2 * hh <= S.PH) cy = clamp(cy, hh, S.PH - hh);
  return [z, 0, 0, z, W / 2 - z * cx, H / 2 - z * cy];
}
// ───────── one sheet at one moment (the demo's drawSheet; time held on twos, camera smooth)
const LIFT = 22;
const pcv = document.createElement('canvas'); pcv.width = W; pcv.height = H;
const px = pcv.getContext('2d', { willReadFrequently: true });
function drawSheet(S, t, out) {
  const f = Math.floor((t + TW) * 12 + 1e-6), tq = f / 12 - TW, boil = ((f % 3) + 3) % 3;
  const M = matrix(S.cam(t), S);
  ink.clear(); ink.setCamera(M);
  S.EL.forEach((e, i) => {
    const p = clamp((tq - e.t0) / (e.t1 - e.t0));
    if (p <= 0) return;
    const items = S.BUILD[boil][i], lens = items.map(lenOf), tot = lens.reduce((a, b) => a + b, 0) + LIFT * (items.length - 1);
    let left = p >= 1 ? Infinity : p * tot;
    for (let k = 0; k < items.length && left > 0; k++) {
      const it = items[k];
      if (it.T) ink.write(it.T, left); else ink.stroke(it, left);
      left -= lens[k] + LIFT;
    }
  });
  px.setTransform(1, 0, 0, 1, 0, 0); px.fillStyle = '#f8f7f3'; px.fillRect(0, 0, W, H);
  px.setTransform(...M); px.imageSmoothingQuality = 'high'; px.drawImage(S.paperC, 0, 0); px.setTransform(1, 0, 0, 1, 0, 0);
  composeOn(px.getImageData(0, 0, W, H).data, ink, out);
  return out;
}
// ───────── the peel (the demo's peelFrame): corner lifts, a fold line sweeps bottom-right → top-left, the sheet is pulled away
const imA = CX.createImageData(W, H), imB = CX.createImageData(W, H), IM = CX.createImageData(W, H);
const cA = document.createElement('canvas'); cA.width = W; cA.height = H;
const cB = document.createElement('canvas'); cB.width = W; cB.height = H;
const P = (o, u, s) => [o[0] + u[0] * s, o[1] + u[1] * s];
function peelFrame(t, SA, SB) {
  const u0 = clamp((t - PEEL.a) / (PEEL.b - PEEL.a)), u = u0 < .5 ? 4 * u0 * u0 * u0 : 1 - Math.pow(-2 * u0 + 2, 3) / 2;
  drawSheet(SA, t, imA); cA.getContext('2d').putImageData(imA, 0, 0);
  drawSheet(SB, t, imB); cB.getContext('2d').putImageData(imB, 0, 0);
  const l = Math.hypot(W, H), n = [-W / l, -H / l], BR = [W, H], s = lerp(-20, l + 260, u);
  const F = P(BR, n, s), tv = [-n[1], n[0]];
  const half = sign => { CX.beginPath(); const L = 4000; const a = P(F, tv, -L), b = P(F, tv, L); CX.moveTo(...a); CX.lineTo(...b); CX.lineTo(...P(b, n, sign * L)); CX.lineTo(...P(a, n, sign * L)); CX.closePath(); };
  CX.drawImage(cB, 0, 0);
  CX.save(); half(-1); CX.clip();
  const g = CX.createLinearGradient(...F, ...P(F, n, -46)); g.addColorStop(0, 'rgba(70,63,51,.14)'); g.addColorStop(1, 'rgba(70,63,51,0)');
  CX.fillStyle = g; CX.fillRect(0, 0, W, H); CX.restore();
  CX.save(); half(1); CX.clip(); CX.drawImage(cA, 0, 0); CX.restore();
  const refl = p => { const d = (p[0] - F[0]) * n[0] + (p[1] - F[1]) * n[1]; return P(p, n, -2 * d * .86); };
  const corners = [[0, 0], [W, 0], [W, H], [0, H]], poly2 = [];
  for (let i = 0; i < 4; i++) {
    const p = corners[i], q = corners[(i + 1) % 4], dp = (p[0] - F[0]) * n[0] + (p[1] - F[1]) * n[1], dq = (q[0] - F[0]) * n[0] + (q[1] - F[1]) * n[1];
    if (dp < 0) poly2.push(p);
    if ((dp < 0) !== (dq < 0)) { const r = dp / (dp - dq); poly2.push([lerp(p[0], q[0], r), lerp(p[1], q[1], r)]); }
  }
  if (poly2.length > 2) {
    const fl = poly2.map(refl);
    CX.save(); CX.beginPath(); fl.forEach((p, i) => i ? CX.lineTo(...p) : CX.moveTo(...p)); CX.closePath();
    CX.save(); CX.shadowColor = 'rgba(60,52,40,.16)'; CX.shadowBlur = 18; CX.shadowOffsetX = -4; CX.shadowOffsetY = -3;
    const g2 = CX.createLinearGradient(...F, ...P(F, n, 520)); g2.addColorStop(0, '#e2e0d9'); g2.addColorStop(.35, '#efede8'); g2.addColorStop(1, '#f7f6f2');
    CX.fillStyle = g2; CX.fill(); CX.restore();
    CX.strokeStyle = 'rgba(150,142,128,.35)'; CX.lineWidth = 1; CX.stroke(); CX.restore();
  }
}
function render(t) {
  if (t >= PEEL.a && t < PEEL.b) { peelFrame(t, S3, S4); return; }
  const S = t < 2.5 ? S1 : t < 7.5 ? S2 : t < PEEL.a ? S3 : S4;
  drawSheet(S, t, IM); CX.putImageData(IM, 0, 0);
}

(async () => {
  const f = new FontFace('Kalam', 'url(fonts/Kalam-Bold.ttf)', { weight: '700' });
  await f.load(); document.fonts.add(f);
  setGlyphs(await (await fetch('glyphs.json')).json());
  for (const S of SHEETS) {
    CUR = S;
    for (B = 0; B < 3; B++) { NI = 0; setBoil(B); S.build(); }
    setBoil(0);
    S.paperC = paperCanvas(makePaper(S.seed, [0, 0, 0], S.PW, S.PH));
  }
  // pen-down events (for the native sound design): one per element, its colour and its sheet
  const ev = [];
  for (const S of SHEETS) S.EL.forEach(e => { if (e.t1 - e.t0 > .02) ev.push({ t: +e.t0.toFixed(4), d: +(e.t1 - e.t0).toFixed(4), type: e.kind, col: e.color, sheet: S.id }); });
  ev.push({ t: PUSH1[0], d: PUSH1[1] - PUSH1[0], type: 'push' }, { t: PUSH2[0], d: PUSH2[1] - PUSH2[0], type: 'push' }, { t: PEEL.a, d: PEEL.b - PEEL.a, type: 'peel' });
  window.EV = ev.filter(e => e.t >= 0 && e.t < DUR).sort((a, b) => a.t - b.t);
  window.render = render;
  window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const c = RUN.contacts.filter(c => c.t0 - .2 <= t).pop(); if (!c) return null; const J = solveProfile(poseAt(c.t0)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
  window.READY = true;
})();
window.DUR = DUR;
