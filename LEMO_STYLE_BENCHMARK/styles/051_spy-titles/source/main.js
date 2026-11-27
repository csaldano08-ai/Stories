// 051 · 60s Spy Title Sequence — the first 10 s of "Last Train Home" as a cut-paper, four-ink opening
// (lemo-opuscar styles/spy-titles): ink, cream, one hot red and a mustard. AKI is a paper silhouette in profile, her pieces merged
// into one outline with slits at the joints, her one accent the red hem of her jacket streaming back; the gold of her watch and
// of the station clock is the mustard, the thing she is chasing (time). The words of the street are the set: each shop name is
// a row of giant cut letters she runs past. The cuts land on the stabs at 2.5 and 7.5 s; the watch's circle match-cuts to the
// station clock (same centre, same size) at 9.375 s, and the camera starts down a column of type that is the tower.
// Puppets, splashes and rain on twos (15 drawings a second, every drawing held two frames at 30 fps); camera on ones.
// Engine: engine/paper.js copied unchanged, engine/glyph.js with one marked edit (font file); opentype.js (MIT) in vendor/.
// Page contract: window.render(t), DUR, READY, RIGQA.
import { g, C, S, clear, piece, roughC, rough, smooth, circP, ellP, rectP, xf, silhouette, slit, paperFinish } from './engine/paper.js';
import { loadFonts, layout, drawLine } from './engine/glyph.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash, mulberry, TAU } from './shared/lib/util.js';

window.DUR = DUR;
await loadFonts();
const W = 1920, H = 1080;

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
const SIM = (() => {   // loose parts, pre-simulated at 240 Hz: the jacket hem and the ponytail chain
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
// twos at 30 fps: a new drawing every 1/15 s, one of them exactly on the splash
const twos = t => Math.floor((t - EV.splash) * 15 + 1e-6) / 15 + EV.splash;

// ═════════ AKI's paper pieces, each cut once in its own local space (bone along +y from the joint)
const J0 = solveProfile(RUN.pose(3));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const dWP = dist(J0.pelvis, J0.waist), dWN = dist(J0.neckBase, J0.waist);
const limbP = (L, a, b) => smooth([[-a, -a * .5], [0, -a * .8], [a, -a * .5], [b * 1.05, L * .55], [b, L], [0, L + b * .7], [-b, L], [-a * 1.05, L * .45]], 1);
const PCS = {
  thigh: () => limbP(150, 25, 19), shin: () => limbP(144, 19, 14), upper: () => limbP(108, 17, 14), fore: () => limbP(92, 14, 12),
  hand: () => [[-11, -4], [11, -4], [9, 18], [2, 44], [-6, 20]],                              // a sharp wedge
  boot: () => smooth([[-16, -36], [17, -36], [19, -8], [46, -2], [72, 6], [74, 17], [-25, 17], [-29, 0]], 1),
  coatLo: () => smooth([[-34, 0], [30, 0], [40, dWP], [50, dWP + 92], [12, dWP + 104], [-30, dWP + 106], [-66, dWP + 88], [-46, dWP]], 1),
  coatUp: () => smooth([[-36, 6], [34, 6], [40, -dWN * .5], [30, -dWN + 8], [10, -dWN - 6], [-26, -dWN - 4], [-42, -dWN * .5]], 1),
  flap: () => smooth([[0, 0], [16, 4], [10, 70], [-6, 116], [-40, 106], [-28, 44], [-14, 2]], 1),
  neck: () => limbP(34, 13, 12),
  head: () => smooth([[16, -44], [34, -20], [44, -3], [37, 8], [39, 16], [34, 23], [32, 35], [12, 46], [-10, 48], [-36, 38], [-50, 8], [-46, -26], [-22, -48]], 1),
  hair: () => smooth([[22, -44], [0, -60], [-36, -54], [-58, -22], [-60, 12], [-46, 40], [-22, 44], [-10, 18], [-2, -14], [8, -32]], 1),
  tail: () => smooth([[0, -12], [30, -11], [58, -2], [30, 10], [0, 11]], 1),
  watch: () => rectP(-15, 62, 30, 18),
};
const pc = (k, amp = 1.6) => roughC('aki_' + k + amp, PCS[k], k.length * 7 + 3, amp, 9);
const bone = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;
const boneUp = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
function put(k, x, y, rot, col = C.ink, amp) { g.save(); g.translate(x, y); g.rotate(rot); piece(pc(k, amp), col); g.restore(); }
// draw AKI (rig units under the current transform) as one silhouette with slits at the joints
function aki(t, amp = 1.6, opt = {}) {
  const S_ = poseAt(t), J = solveProfile(S_);
  silhouette(() => {
    const limbs = kk => { const l = J.leg[kk]; put('thigh', ...l.hip, bone(l.hip, l.knee), C.ink, amp); put('shin', ...l.knee, bone(l.knee, l.ankle), C.ink, amp); put('boot', ...l.ankle, l.pitch, C.ink, amp);
      slit(...l.knee, bone(l.hip, l.knee) + Math.PI / 2, 36, 1.8); };
    const arm = kk => { const a = J.arm[kk]; put('upper', ...a.sh, bone(a.sh, a.el), C.ink, amp); put(kk === 'n' ? 'fore' : 'fore', ...a.el, bone(a.el, a.wr), C.ink, amp); put('hand', ...a.wr, bone(a.el, a.wr), C.ink, amp);
      slit(...a.el, bone(a.sh, a.el) + Math.PI / 2, 26, 1.6); };
    arm('f'); limbs('f');
    // the red hem: the one accent, hinged at the back of the hip, streaming with the run
    const aLo = bone(J.waist, J.pelvis), aUp = boneUp(J.waist, J.neckBase);
    g.save(); g.translate(...J.waist); g.rotate(aLo); g.translate(-36, dWP - 4); g.rotate(SIM.flap(t)); piece(pc('flap', amp), C.red); g.restore();
    put('coatLo', ...J.waist, aLo, C.ink, amp); put('coatUp', ...J.waist, aUp, C.ink, amp);
    put('neck', ...J.neckBase, bone(J.neckBase, J.neckTop), C.ink, amp);
    // ponytail chain, then head and hair
    const ta = SIM.tail(t); g.save(); g.translate(...J.headC); g.rotate(J.headA); g.translate(-50, -14);
    for (let i = 0; i < 3; i++) { g.rotate(i ? ta[i] * .6 - ta[i - 1] * .3 : Math.PI - .25 + ta[0]); g.save(); g.scale(1 - i * .18, 1 - i * .18); piece(pc('tail', amp), C.ink); g.restore(); g.translate(44 * (1 - i * .18), 0); }
    g.restore();
    put('head', ...J.headC, J.headA, C.ink, amp); put('hair', ...J.headC, J.headA, C.ink, amp);
    slit(...J.leg.n.hip, aLo + Math.PI / 2, 40, 1.8);
    limbs('n'); arm('n');
    // the watch on the near wrist: the mustard
    const a = J.arm.n; put('watch', ...a.el, bone(a.el, a.wr), C.mus, amp);
    slit(...a.sh, bone(a.sh, a.el) + Math.PI / 2, 30, 1.6);
  }, { outline: opt.outline ?? 2.6, shA: .3 });
  return J;
}

// ═════════ set pieces
const R0 = mulberry(1);
function sliver(x, y, L, ang, col, seed) { const p = roughC('sl' + seed, () => [[-2.6, 0], [2.6, 0], [1.4, L], [-1.4, L]], seed, .6, 6); g.save(); g.translate(x, y); g.rotate(ang); piece(p, col, { shadow: false }); g.restore(); }
function rain(t, x0, x1, y0, y1, n, col, L = 60, seed = 1) {
  const td = twos(t), R = mulberry(seed);
  for (let i = 0; i < n; i++) { const x = lerp(x0, x1, R()), ph = R(), sp = 1500 + R() * 500, y = y0 + ((ph * (y1 - y0) + td * sp) % (y1 - y0)); sliver(x - (y - y0) * .2, y, L * (.7 + R() * .6), .2, col, seed * 100 + (i % 12)); }
}
// a splash of cut paper: a crown of shards and drops thrown on arcs (drawn on twos)
function splash(t, t0, x, y, k, col, n = 10) {
  const a = twos(t) - t0; if (a < 0 || a > .7) return;
  const R = mulberry(Math.round(t0 * 1000));
  for (let i = 0; i < n; i++) { const ang = -Math.PI / 2 + (R() - .5) * 2.2, v = (380 + R() * 520) * k, px = x + Math.cos(ang) * v * a, py = y + Math.sin(ang) * v * a + 1900 * k * a * a; if (py > y + 30 * k) continue;
    const s = (6 + R() * 9) * k, sh = roughC('dr' + (i % 6), () => circP(0, 0, 10, 9), i + 3, 1.2, 4); g.save(); g.translate(px, py); g.scale(s / 10, s / 10 * 1.2); piece(sh, col, { shadow: false }); g.restore(); }
  if (a < .3) for (let i = 0; i < 7; i++) { const sx = x + (i - 3) * 22 * k, hh = (60 + R() * 70) * k * Math.sin(a / .3 * Math.PI);
    const tri = roughC('cr' + i, () => [[-9, 0], [9, 0], [2, -40], [-2, -40]], i + 9, 1.2, 6); g.save(); g.translate(sx, y + 6 * k); g.rotate((i - 3) * .22); g.scale(k, hh / 40); piece(tri, col, { shadow: false }); g.restore(); }
}

// ═════════ S1 — the puddle (0–2.5): the shop front's lit words cut out of the night, upside down in the water; her legs, the splash
const K1 = 2.2, GY1 = 790, PX1 = 930;
const LAY_CAFE = layout('CAFE', 330, { track: .06 }), LAY_24 = layout('24H', 210, { track: .06 });
function shotS1(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); clear(C.paperD);
  // the night above the pavement: an ink sheet with a rough lower edge, the shop's words cut in cream
  piece(roughC('s1ink', () => [[-40, -40], [1960, -40], [1960, 452], [1400, 446], [700, 456], [-40, 448]], 4, 2.2, 14), C.ink, { gap: 0 });
  S.bg = C.ink;
  drawLine(LAY_CAFE, 150, 395, { col: C.paper, seed: 3, jit: 1, gap: 0 });
  piece(roughC('s1box', () => rectP(1330, 168, 400, 250), 5, 1.8, 12), C.paper, { gap: 0 });
  drawLine(LAY_24, 1380, 390, { col: C.ink, seed: 5, jit: 1, gap: 0 });
  S.bg = C.paperD;
  // the puddle: ink, the words hanging in it upside down and squashed, cream on ink
  const pud = roughC('pud', () => ellP(PX1, GY1 + 20, 560, 140, 64), 7, 2.4, 14);
  piece(pud, C.ink, { gap: 0, shadow: false });
  g.save(); g.beginPath(); g.moveTo(pud[0][0], pud[0][1]); for (const p of pud) g.lineTo(p[0], p[1]); g.closePath(); g.clip();
  S.bg = C.ink;
  const wob = Math.sin(twos(t) * 9) * 3 + (twos(t) > EV.splash ? 18 * Math.exp(-(twos(t) - EV.splash) * 3) * Math.sin(twos(t) * 40) : 0);
  g.save(); g.translate(wob, 936); g.scale(1, -.42); drawLine(LAY_CAFE, 150, 395, { col: C.paper, seed: 3, jit: 1, gap: 0, shadow: false }); drawLine(LAY_24, 1380, 390, { col: C.paper, seed: 5, jit: 1, gap: 0, shadow: false }); g.restore();
  // her reflection: the silhouette upside down in the water
  if (t > .35 && t < 1.95) { g.save(); g.translate(PX1 - SPL.x * K1, GY1); g.scale(K1, -K1 * .45); g.translate(0, 0); S.bg = C.ink; aki(twos(t), 2, { outline: 0 }); g.restore(); }
  g.restore();
  S.bg = C.paperD;
  // her legs (the frame holds her from the hips down), on twos
  if (t > .35 && t < 1.95) { g.save(); g.translate(PX1 - SPL.x * K1, GY1); g.scale(K1, K1); aki(twos(t), 2.2); g.restore(); }
  splash(t, EV.splash, PX1 + 10, GY1 + 10, 1.6, C.paper, 16);
  for (const c of RUN.contacts) if (c.t0 > EV.splash + .1 && c.t0 < 2) splash(t, c.t0, PX1 + (c.x - SPL.x) * K1, GY1 + 6, 1, C.paper, 6);
  rain(t, -100, 2100, -60, 1100, 46, C.ink, 70, 2);
  paperFinish(1);
}

// ═════════ S2 — the street as giant words (2.5–7.5): lateral tracking, one screen direction
const K2 = .9, GY2 = 930, X0 = X(2.5);
const WORDS = ['BAKERY', 'BOOKS', 'NOODLES', 'HOTEL', 'RECORDS'].map(w => ({ w, lay: layout(w, 920, { track: .05 }) }));
{ let x = -900; for (const Wd of WORDS) { Wd.x = x; x += Wd.lay.width + 330; } }
const ax2 = t => (X(t) - X0) * K2;
function windows(Wd, cam) {
  // lit windows: little cream panes cut into the letters, in rows (the letters are the buildings)
  for (const L of Wd.lay.letters) {
    const x0 = Wd.x + L.x + L.x0 + 22, x1 = Wd.x + L.x + L.x1 - 22; if (x1 < cam - 1100 || x0 > cam + 1100) continue;
    const R = mulberry(Math.round(Wd.x + L.x));
    for (let y = GY2 - 560; y < GY2 - 130; y += 92) for (let x = x0 + 10; x < x1 - 40; x += 74) if (R() < .32) piece(roughC('w' + (Math.round(x * 7 + y) % 997), () => rectP(0, 0, 34, 46), Math.round(x + y) % 97, 1, 8).map(p => [p[0] + x, p[1] + y]), C.paperD, { gap: 0, shadow: false });
  }
}
function shotS2(t) {
  const cam = ax2(t) + 160;                                         // on ones, at her speed
  g.setTransform(1, 0, 0, 1, 0, 0); clear(C.paper);
  g.setTransform(1, 0, 0, 1, W / 2 - cam, 0);
  // the pavement: shadow paper with a rough top, puddles in ink
  piece(roughC('pave', () => [[-1600, GY2 - 6], [9800, GY2 + 6], [9800, 1200], [-1600, 1200]], 11, 2.4, 16), C.paperD, { gap: 0, shadow: false });
  for (let i = 0; i < 9; i++) { const x = -600 + i * 1010; piece(roughC('pd' + i, () => ellP(x, GY2 + 70, 150 + (i % 3) * 40, 22, 24), i + 20, 1.6, 10), C.ink, { gap: 0, shadow: false }); }
  // the words: ink letters standing on the pavement, each a building with cut windows
  for (const Wd of WORDS) { if (Wd.x > cam + 1200 || Wd.x + Wd.lay.width < cam - 1200) continue; drawLine(Wd.lay, Wd.x, GY2 - 6, { col: C.ink, seed: Wd.w.length * 13, jit: 1.2, amp: 2.2 }); windows(Wd, cam); }
  // lamp posts in front: cut ink posts with a cream lamp on an ink backing
  for (let x = -400; x < 9800; x += 1700) { if (Math.abs(x - cam) > 1200) continue;
    piece(roughC('post', () => rectP(-11, 300, 22, GY2 - 300 + 40), 31, 1.4, 10).map(p => [p[0] + x, p[1]]), C.ink);
    piece(roughC('lampB', () => circP(0, 0, 40, 22), 32, 1.6, 8).map(p => [p[0] + x, p[1] + 290]), C.ink); piece(roughC('lamp', () => circP(0, 0, 28, 18), 33, 1.4, 8).map(p => [p[0] + x, p[1] + 290]), C.paper, { gap: 0 }); }
  // AKI on twos: pose and position from the same drawing time, so her planted foot never slides on the stone
  const td = twos(t);
  g.save(); g.translate(-X0 * K2, GY2); g.scale(K2, K2); aki(td, 1.6); g.restore();
  for (const c of RUN.contacts) if (c.t0 > 2.4) splash(t, c.t0, (c.x - X0) * K2 + 30, GY2 + 4, .8, C.ink, 7);
  rain(t, cam - 1100, cam + 1100, -80, 1100, 40, C.ink, 56, 3);
  paperFinish(1);
}

// ═════════ S3 — the watch on a red ground (7.5–9.375), the time cut big behind it
const AH = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, AMN = -Math.PI / 2 + 58 / 60 * TAU;
const CX = 1090, CY = 520, CR = 236;                                // the circle shared by the watch and the station clock
const LAY_T = layout('23:58', 1000, { track: .04 });
function dial(t, sec, lit = true) {
  // ink keyline backing, mustard bezel, cream face, ink hands
  piece(roughC('dialB', () => circP(CX, CY, CR + 14, 60), 41, 1.8, 10), C.ink);
  piece(roughC('dialM', () => circP(CX, CY, CR, 60), 42, 1.8, 10), C.mus, { gap: 0 });
  piece(roughC('dialF', () => circP(CX, CY, CR * .8, 54), 43, 1.6, 10), lit ? C.paper : C.paperD, { gap: 0 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r0 = CR * (i % 3 ? .66 : .58), r1 = CR * .76; g.save(); g.translate(CX + Math.cos(a) * (r0 + r1) / 2, CY + Math.sin(a) * (r0 + r1) / 2); g.rotate(a + Math.PI / 2);
    piece(roughC('tk' + (i % 3 ? 1 : 0), () => rectP(i % 3 ? -4 : -8, -(r1 - r0) / 2, i % 3 ? 8 : 16, r1 - r0), 44 + (i % 3 ? 1 : 0), .8, 6), C.ink, { gap: 0, shadow: false }); g.restore(); }
  const hand = (a, L, w, key) => { g.save(); g.translate(CX, CY); g.rotate(a + Math.PI / 2); piece(roughC(key, () => [[-w, 18], [w, 18], [w * .4, -L], [-w * .4, -L]], key.length * 5, 1, 8), C.ink, { gap: 0 }); g.restore(); };
  hand(AH, CR * .44, 11, 'hh'); hand(AMN, CR * .66, 8, 'hm'); if (sec != null) hand(-Math.PI / 2 + sec / 60 * TAU, CR * .7, 2.6, 'hs');
  piece(roughC('pin', () => circP(CX, CY, 14, 12), 45, .6, 4), C.red, { gap: 0 });
}
function shotS3(t) {
  const td = twos(t), bob = 10 * Math.sin((td - EV.splash) * TAU * CADENCE / 2);
  g.setTransform(1, 0, 0, 1, 0, bob); clear(C.red);
  // the time, cut big in the darker red behind (a background prop in a darker version of the ground)
  drawLine(LAY_T, 70, 860, { col: C.redD, seed: 21, jit: 1.2, amp: 2.4, shadow: false });
  // her forearm on a strong diagonal from the lower left: one ink silhouette with the strap and the wedge of the hand
  silhouette(() => {
    const ang = -.5, ax = [Math.cos(ang), Math.sin(ang)], at = (s, o) => [CX + ax[0] * s - ax[1] * o, CY + ax[1] * s + ax[0] * o];
    piece(roughC('arm', () => [at(-1500, -170), at(-80, -150), at(120, -140), at(120, 150), at(-80, 160), at(-1500, 190)], 51, 2.2, 14), C.ink);
    piece(roughC('handS', () => [at(110, -150), at(330, -120), at(430, -40), at(400, 60), at(300, 150), at(110, 150)], 52, 2.2, 12), C.ink);
    piece(roughC('thumb', () => [at(160, -150), at(330, -210), at(370, -180), at(260, -120)], 53, 2, 10), C.ink);
    for (const s of [330, 370]) slit(...at(s, 10), ang + Math.PI / 2, 120, 1.8);
  }, { outline: 2.6 });
  dial(t, 47 + (t >= 8.4 ? 1 : 0));
  // rain on the crystal: cream drops on ink keylines
  for (const [dx, dy, r] of [[-90, 60, 16], [70, -110, 12], [120, 80, 10], [-40, -60, 9]]) { piece(roughC('rd' + r, () => ellP(0, 0, r + 3, r * 1.2 + 3, 16), r, .8, 5).map(p => [p[0] + CX + dx, p[1] + CY + dy]), C.ink, { gap: 0 }); piece(roughC('rdi' + r, () => ellP(0, 0, r, r * 1.2, 14), r + 1, .6, 5).map(p => [p[0] + CX + dx, p[1] + CY + dy]), C.paperD, { gap: 0, shadow: false }); }
  if (td >= 8.1) { const k = clamp((td - 8.1) / .14 + .4, 0, 1); piece(roughC('rdN', () => ellP(0, 0, 22, 25, 16), 77, .8, 5).map(p => [p[0] * k + CX - 30, p[1] * k + CY + 120]), C.ink, { gap: 0 }); piece(roughC('rdNi', () => ellP(0, 0, 18, 21, 14), 78, .6, 5).map(p => [p[0] * k + CX - 30, p[1] * k + CY + 120]), C.paperD, { gap: 0, shadow: false }); }
  rain(t, -100, 2100, -80, 1160, 30, C.redD, 64, 4);
  g.setTransform(1, 0, 0, 1, 0, 0); paperFinish(1);
}

// ═════════ S4 — the station clock (9.375–10): the same circle on the night; the tower a column of type; the camera starts down it
const LAY_ST = 'STATION'.split('').map(ch => layout(ch, 240, { track: 0 }));
function shotS4(t) {
  const dn = 520 * eio(seg(t, 9.45, 10.8));                        // the crane down begins (on ones)
  g.setTransform(1, 0, 0, 1, 0, -dn); clear(C.ink);
  S.bg = C.ink;
  // the city's roofs in the darker ink, windows cut cream
  const R = mulberry(61);
  for (let i = 0; i < 12; i++) { const x = -60 + i * 170, h = 260 + R() * 280; if (Math.abs(x + 80 - CX) < 260) continue;
    piece(roughC('roof' + i, () => rectP(x, 1180 - h, 150, h + 300), 70 + i, 2, 12), C.inkL, { gap: 0 });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) if (R() < .45) piece(roughC('rw' + ((i + r + c) % 7), () => rectP(0, 0, 30, 40), 80 + ((i + r + c) % 7), .8, 6).map(p => [p[0] + x + 30 + c * 64, p[1] + 1210 - h + r * 80]), C.paperD, { gap: 0, shadow: false }); }
  // the tower: the word STATION stacked down from the clock, cream letters (type is the building)
  LAY_ST.forEach((L, i) => { const w = L.width; drawLine(L, CX - w / 2, CY + CR + 230 + i * 205, { col: C.paper, seed: 90 + i, jit: 1.4, amp: 2 }); });
  // the clock: the same circle as the watch, same centre, same size
  dial(t, null);
  // the chime: rings of red (danger: the last train) cut out around the clock, on twos
  const a = twos(t) - EV.chime;
  if (a >= 0) for (let k = 0; k < 3; k++) { const aa = a - k * .07; if (aa < 0) continue; const r = CR + 40 + aa * 900;
    const ring = roughC('ring' + k, () => [...circP(0, 0, 100, 64), ...circP(0, 0, 92, 64).reverse()], 100 + k, .6, 6);
    g.save(); g.translate(CX, CY); g.scale(r / 100, r / 100); piece([circP(0, 0, 100, 64), circP(0, 0, 100 - 900 / r, 64)], C.red, { gap: 0, shadow: false }); g.restore(); }
  rain(t, -100, 2100, -80 + dn, 1160 + dn, 34, C.paperD, 60, 5);
  g.setTransform(1, 0, 0, 1, 0, 0); paperFinish(1);
}

window.render = t => {
  if (t < 2.5) shotS1(t);
  else if (t < 7.5) shotS2(t);
  else if (t < 9.375) shotS3(t);
  else shotS4(t);
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(twos(t))); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0);
window.READY = true;
