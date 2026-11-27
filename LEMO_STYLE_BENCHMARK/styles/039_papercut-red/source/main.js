// 039 · Red Paper-cut — the first 10 s of "Last Train Home" as jointed red cut-outs on night papers (lemo-opuscar
// styles/papercut-red). Every visible thing is a piece of paper cut with scissors and laid flat on another sheet: detail
// comes only from what was cut away (inset yin contours, crescents, sawtooth, swirls at the joints); a paper shadow under each
// piece; at night the background is one family of indigo papers and only what matters is red (AKI, the café's window flower,
// the station tower). Front-lit paper × a night light map, warm pools; backlit pieces where light comes through the cuts
// (shop windows, signs whose letters are cut out, the puddle's reflection, the watch dial); gold foil saved for one moment.
//   S1 0–2.5    close and low on the puddle under the café: the reflected sign cut into the dark water paper (it glows), the
//               boot lands at 0.9375 s: a rice-paper splash crown and droplet pieces fly on ones, ripple rings swap at 12 fps.
//   ─ a cut through the frame: the sheet is cut across and its halves fly apart (2.40–2.75) ─
//   S2 2.5–7.5  a pan across paper layers (far city 0.35, shops 1.0, lamp posts 1.35): AKI runs, stepping at 12 fps on
//               a camera that moves on ones; splash pieces at every footfall; 6.05–7.15 she lifts the wrist to the watch.
//   ─ a sheet is pasted over the frame (7.38–7.5, a 1.04 pop on the hit) ─
//   S3 7.5–9.4  the watch: rice-paper dial lit from behind, red hour wedges, red hands at 23:58, the second hand stepping
//               once a second with a one-step pop (8.4, 9.4); the sleeve in crescent cuts; street lights slide past.
//   ─ the sheet flies off (9.30–9.62) ─
//   S4 9.4–10   the city tops and the station tower; on the chime (9.575) the clock face — gold foil, the film's one gold
//               — pops 1.15× for a step and flashes warm.
// Characters step at 12 fps (pose sampled on a grid that puts a step on the splash); camera, light, rain and flying pieces
// move on ones. Engine: engine/{paper,motifs,rig,light,tuanhua}.js copied unchanged. Page contract: render(t), DUR, READY, RIGQA.
import { PAL, canvas, piece, fill, cut, cutLine, cutTaper, inset, within, P as Pp, Pl, curve, ellipsePoly, trace, fillPaper } from './engine/paper.js';
import { sawRow, sawEdge, crescent, crescentRows, swirl, plum, coin, dots, strands, taper } from './engine/motifs.js';
import { mul, T as Tm, R as Rm, S as Sm, ap, put } from './engine/rig.js';
import { beginLight, pool, lightRect, applyLight, glowWindow, bloom, E as EG } from './engine/light.js';
import { tuanhua } from './engine/tuanhua.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, back, ss, eo, ei, vnoise, hash, mulberry, TAU } from './shared/lib/util.js';

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
const PH12 = EV.splash - Math.floor(EV.splash * 12) / 12;           // the 12 fps grid's phase: a step lands on the splash
const step12 = t => Math.floor((t - PH12) * 12 + 1e-6) / 12 + PH12;

const W = 1920, H = 1080;
const cv = document.getElementById('cv'), g = cv.getContext('2d');
await document.fonts.load('700 60px "Newsreader"');
const NIGHT = { far: '#1f2a55', mid: '#29356e', house: '#35457f', near: '#151c3c', water: '#121834', pale: '#9aa6d4', redFar: '#b51a1c', redDeep: '#9c1323', gold: PAL.gold };
const camM = ([cx, cy, z]) => [z, 0, 0, z, 960 - cx * z, 540 - cy * z];
const parC = (cam, k) => camM([960 + (cam[0] - 960) * k, 540 + (cam[1] - 540) * k, 1 + (cam[2] - 1) * k]);

// ═════════ AKI: a jointed red cut-out (pieces in rig units, near limbs PAL.red, far limbs one tone darker)
const K = .8, GROUND = 905, PX = 1400;
const Wp = p => [PX + (p[0] - SPL.x) * K, GROUND + p[1] * K];
const Xw = t => Wp([X(t), 0])[0];
const A = {};
function limb(L, w0, w1, col, seed, extra) {
  return piece([-w0 - 8, -w0 - 8, w0 + 8, L + w1 + 8], q => {
    const poly = Pp([[-w0, 0], [-w0 * .7, -w0 * .8], [0, -w0], [w0 * .7, -w0 * .8], [w0, 0], [w1, L], [w1 * .6, L + w1 * .8], [0, L + w1], [-w1 * .6, L + w1 * .8], [-w1, L]], true, .35, seed);
    fill(q, s => trace(s, poly), col); inset(q, poly, 3.4, 1.5, col);
    swirl(q, 0, 0, w0 * .5, 1.8, 2.6, seed, 1);
    extra && extra(q);
  }, { ss: 2, seed, col });
}
function buildAki() {
  const J0 = solveProfile(RUN.pose(3)), dWP = Math.hypot(J0.pelvis[0] - J0.waist[0], J0.pelvis[1] - J0.waist[1]), dWN = Math.hypot(J0.neckBase[0] - J0.waist[0], J0.neckBase[1] - J0.waist[1]);
  A.dWP = dWP; A.dWN = dWN;
  for (const [k, col] of [['n', PAL.red], ['f', NIGHT.redFar]]) {
    A['thigh' + k] = limb(150, 24, 18, col, 11, q => crescentRows(q, -14, 30, 14, 120, 8, 2.6));
    A['shin' + k] = limb(144, 18, 13, col, 12, q => { taper(q, [[-6, 24], [-5, 80], [-3, 118]], 4); sawRow(q, [[-12, 124], [12, 124]], 7, 5, -1); });
    A['upper' + k] = limb(108, 16, 13, col, 13, q => crescentRows(q, -10, 24, 10, 96, 7, 2.2));
    A['fore' + k] = limb(92, 13, 11, col, 14, q => { sawRow(q, [[-10, 74], [10, 74]], 6, 4, 1); if (k === 'n') { /* the watch: a rice-paper disc pasted on the near forearm */ } });
    A['boot' + k] = piece([-34, -44, 78, 26], q => {
      const b = Pl([[-14, -36], [14, -36], [16, -8], [42, -2], [68, 4], [72, 14], [22, 18], [-22, 16], [-26, 0]], true, .3, 15);
      fill(q, s => trace(s, b), k === 'n' ? NIGHT.redDeep : '#80101d'); inset(q, b, 3, 1.4, k === 'n' ? NIGHT.redDeep : '#80101d');
      sawRow(q, [[-20, 12], [64, 12]], 5, 6, 1); dots(q, [[-2, -26], [-2, -16]], 2.4);
    }, { ss: 2, seed: 16 });
    A['hand' + k] = piece([-18, -10, 18, 42], q => {
      const h = Pp([[-9, -2], [10, -2], [13, 18], [7, 32], [-4, 34], [-12, 20]], true, .3, 17);
      fill(q, s => trace(s, h), col); cutLine(q, 1.6, s => { s.moveTo(-2, 16); s.lineTo(-3, 28); s.moveTo(4, 16); s.lineTo(4, 28); });
    }, { ss: 2, seed: 17 });
  }
  A.watch = piece([-14, -14, 14, 14], q => { fill(q, s => s.arc(0, 0, 11, 0, TAU), PAL.rice); cut(q, s => { s.arc(0, 0, 6.5, 0, TAU); }); fill(q, s => { s.rect(-.9, -6, 1.8, 6); s.rect(0, -.9, 4.5, 1.8); }, PAL.red); }, { ss: 3, seed: 18, col: PAL.rice });
  const lc = Pp([[-34, 0], [30, 0], [40, dWP], [50, dWP + 92], [12, dWP + 104], [-30, dWP + 106], [-66, dWP + 88], [-46, dWP]], true, .4, 19);
  A.coatLo = piece([-82, -10, 66, dWP + 122], q => {
    fill(q, s => trace(s, sawEdge(lc, 5, 10, -1)), PAL.red); inset(q, lc, 4, 1.6, PAL.red);
    within(q, lc, () => crescentRows(q, -64, 14, 44, dWP + 60, 11, 3.4)); plum(q, -8, dWP + 78, 8);
  }, { ss: 2, seed: 19 });
  A.flap = piece([-46, -8, 24, 114], q => { const f = Pp([[0, 0], [14, 4], [8, 64], [-6, 104], [-34, 96], [-26, 40], [-14, 2]], true, .35, 20); fill(q, s => trace(s, f), NIGHT.redFar); inset(q, f, 3, 1.4, NIGHT.redFar); taper(q, [[-6, 16], [-10, 60], [-18, 92]], 4.5); }, { ss: 2, seed: 20 });
  const uc = Pp([[-36, 6], [34, 6], [40, -dWN * .5], [30, -dWN + 8], [10, -dWN - 6], [-26, -dWN - 4], [-42, -dWN * .5]], true, .4, 21);
  A.coatUp = piece([-52, -dWN - 18, 52, 18], q => {
    fill(q, s => trace(s, uc), PAL.red); inset(q, uc, 4, 1.6, PAL.red);
    within(q, uc, () => crescentRows(q, -30, -dWN + 18, 30, -4, 10, 3)); plum(q, 4, -dWN * .62, 11, 0); swirl(q, -14, -12, 8, 1.6, 2.6, 0, -1);
  }, { ss: 2, seed: 21 });
  // head (1.15×): profile, hair of the same red with cut strands, eye as two crescent lids leaving bridges + a pupil hole
  const HK = 1.15, hs = pts => pts.map(([x, y]) => [x * HK, y * HK]);
  const head = Pp(hs([[18, -42], [34, -18], [42, -2], [36, 7], [38, 15], [33, 21], [31, 33], [12, 44], [-10, 46], [-36, 36], [-52, 6], [-48, -26], [-24, -48]]), true, .3, 22);
  A.head = piece([-72, -70, 60, 64], q => {
    fill(q, s => trace(s, head), PAL.red); inset(q, head, 3.2, 1.4, PAL.red);
    for (const s of [[[-4, -42], [-26, -36], [-44, -14], [-46, 14]], [[6, -44], [-14, -42], [-36, -24], [-42, 4]], [[-12, -26], [-30, -6], [-32, 20], [-24, 34]]]) taper(q, hs(s), 3.4);
    crescent(q, 19 * HK, -6 * HK, 9 * HK, -2.6, -.6, 3);                 // upper lid
    crescent(q, 19 * HK, -15 * HK, 8 * HK, .7, 2.4, 2.2);               // lower lid
    cut(q, s => { s.arc(21 * HK, -10 * HK, 2.2 * HK, 0, TAU); });       // pupil
    crescent(q, 30 * HK, 6 * HK, 7 * HK, .5, 2.1, 1.8);                  // the mouth
    swirl(q, -6 * HK, -2 * HK, 7 * HK, 1.5, 2.2, 1, -1);                 // the ear
  }, { ss: 2, seed: 22 });
  A.tail = piece([-6, -14, 60, 14], q => { const f = Pp([[0, -9], [30, -11], [58, -2], [30, 10], [0, 8]], true, .3, 23); fill(q, s => trace(s, sawEdge(f, 4, 8, 1)), PAL.red); strands(q, [[6, -2], [28, -3], [52, -1]], 2, 5, 2.4); }, { ss: 2, seed: 23 });
}
const SIM = (() => {
  const dt = 1 / 240, n = Math.ceil(11 / dt), flap = new Float32Array(n), tail = [new Float32Array(n), new Float32Array(n)];
  let a = .3, va = 0; const th = [-.2, -.1], vt = [0, 0];
  const py = t => RUN.pelvisAt(t)[1], ay = t => (py(t + dt) - 2 * py(t) + py(t - dt)) / (dt * dt);
  for (let i = 0; i < n; i++) {
    const t = -.5 + i * dt, Ac = ay(t);
    va += (-46 * (a - .34) - 5.5 * va + .011 * Ac) * dt; a += va * dt; flap[i] = a;
    for (let k = 0; k < 2; k++) { const par = k ? th[0] : -.1; vt[k] += (-60 * (th[k] - (par + .18)) - 6 * vt[k] + .014 * Ac * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; }
  }
  const at = (arr, t) => arr[clamp(Math.round((t + .5) / dt), 0, n - 1)];
  return { flap: t => at(flap, t), tail: t => tail.map(a => at(a, t)) };
})();
const bone = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;
const boneUp = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
function drawAki(ctx, C, tq) {
  const S_ = poseAt(tq), J = solveProfile(S_);
  const Mw = mul(C, [K, 0, 0, K, PX - SPL.x * K, GROUND]);
  const at = (p, a) => mul(Mw, mul(Tm(p[0], p[1]), Rm(a)));
  const sh = { shadow: 1 };
  const legs = kk => { const l = J.leg[kk]; put(ctx, A['thigh' + kk], at(l.hip, bone(l.hip, l.knee)), sh); put(ctx, A['shin' + kk], at(l.knee, bone(l.knee, l.ankle)), sh); put(ctx, A['boot' + kk], at(l.ankle, l.pitch), sh); };
  const arm = kk => { const a = J.arm[kk], h = [a.wr[0] + (a.wr[0] - a.el[0]) * .02, a.wr[1] + (a.wr[1] - a.el[1]) * .02];
    put(ctx, A['upper' + kk], at(a.sh, bone(a.sh, a.el)), sh); const Mf = at(a.el, bone(a.el, a.wr)); put(ctx, A['fore' + kk], Mf, sh); put(ctx, A['hand' + kk], at(h, bone(a.el, a.wr)), sh);
    if (kk === 'n') put(ctx, A.watch, mul(Mf, mul(Tm(12, 62), Rm(-bone(a.el, a.wr)))), { shadow: .6 }); };
  // far side first, then body, then the near side
  const ta = SIM.tail(tq), MH = at(J.headC, J.headA);
  let MT = mul(MH, mul(Tm(-56, -10), Rm(Math.PI - .25 + ta[0])));
  put(ctx, A.tail, MT, sh); MT = mul(MT, mul(Tm(48, 0), Rm(ta[1] * .6 - ta[0] * .3))); put(ctx, A.tail, MT, sh);
  arm('f'); legs('f');
  const MLo = at(J.waist, bone(J.waist, J.pelvis));
  put(ctx, A.flap, mul(MLo, mul(Tm(-36, A.dWP - 4), Rm(SIM.flap(tq)))), sh);
  legs('n'); put(ctx, A.coatLo, MLo, sh); put(ctx, A.coatUp, at(J.waist, boneUp(J.waist, J.neckBase)), sh);
  put(ctx, A.head, MH, sh);
  arm('n');
  return J;
}

// ═════════ sets (street: S1, S2)
const SETS = {};
const SHOPS = [[700, 'CAFE', 1], [1950, '24H', 0], [3000, 'BAKERY', 0], [4100, 'BOOKS', 0], [5200, 'NOODLES', 0], [6300, 'BAR', 0], [7400, 'FLOWERS', 0], [8500, 'HOTEL', 0], [9600, 'RECORDS', 0]];
function letters(word, w, h, col, seed) {
  return piece([-w / 2 - 8, -h / 2 - 8, w / 2 + 8, h / 2 + 8], q => {
    const b = Pl([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], true, .4, seed);
    fill(q, s => trace(s, sawEdge(b, 4, 10, 1)), col); inset(q, b, 4, 1.6, col);
    q.save(); q.globalCompositeOperation = 'destination-out'; q.fillStyle = '#000'; q.font = `700 ${h * .58}px "Newsreader"`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.letterSpacing = '5px'; q.fillText(word, 0, h * .05); q.restore();
  }, { ss: 2, seed, col });
}
function shopPiece(w, h, seed) {
  return piece([-12, -h - 90, w + 12, 8], q => {
    const R = mulberry(seed);
    const roof = [[-10, -h + 40], [w / 2, -h - 80], [w + 10, -h + 40]];
    const body = Pl([[0, 0], [0, -h + 40], ...roof, [w, -h + 40], [w, 0]], true, .5, seed);
    fill(q, s => trace(s, body), NIGHT.house); inset(q, body, 4, 1.6, NIGHT.house);
    sawRow(q, [[10, -h + 46], [w - 10, -h + 46]], 12, 12, -1);                                  // tiles
    for (let x = 60; x < w - 40; x += 70) crescent(q, x, -h + 10, 22, .2 * Math.PI, .8 * Math.PI, 6);
    const ww = w - 220, wy = -h + 220, wh = h - 330;                                             // the shop window (a hole; light behind)
    cut(q, s => s.rect(110, wy, ww, wh));
    fill(q, s => { for (let x = 110 + ww / 4; x < 110 + ww - 10; x += ww / 4) s.rect(x - 3, wy, 6, wh); s.rect(110, wy + wh * .45, ww, 6); }, NIGHT.house);
    cut(q, s => s.rect(w - 90, -190, 60, 190));                                                  // the door (dark)
    fill(q, s => s.rect(w - 90, -190, 60, 190), '#0c1026');
    for (let k = 0; k < 3; k++) swirl(q, 50, -h + 120 + k * 60, 14, 1.6, 2.6, R() * 6, k % 2 ? 1 : -1);
  }, { ss: 1.5, seed, col: NIGHT.house });
}
function buildSets() {
  SETS.shops = SHOPS.map(([x, word, cafe], i) => { const w = 680 + (i % 3) * 50, h = 520 + (i % 2) * 40; return { x, w, h, word, cafe, p: shopPiece(w, h, 30 + i), s: letters(word, Math.max(220, word.length * 50 + 70), 96, NIGHT.mid, 40 + i) }; });
  SETS.flower = tuanhua(1.0);
  SETS.far = [0, 1].map(v => piece([0, -520, 2400, 10], q => {
    const R = mulberry(50 + v), pts = [[0, 0]]; let x = 0;
    while (x < 2400) { const w = 120 + R() * 200, h = 220 + R() * 300; pts.push([x, -h], [x + w, -h]); if (R() < .3) pts.push([x + w, -h - 60], [x + w + 20, -h - 60]); x += w; }
    pts.push([2400, 0]); const b = Pl(pts, true, .6, 50 + v);
    fill(q, s => trace(s, b), NIGHT.far);
    for (let yy = -480; yy < -30; yy += 44) for (let xx = 20; xx < 2380; xx += 52) if (R() < .22) cut(q, s => s.rect(xx, yy, 18, 22));
  }, { ss: 1, seed: 50 + v, col: NIGHT.far }));
  SETS.ground = piece([0, -6, 2000, 190], q => {
    const b = Pl([[0, 0], [2000, 0], [2000, 180], [0, 180]], true, .5, 60);
    fill(q, s => trace(s, sawEdge(b, 0, 10, 1)), NIGHT.mid);
    sawRow(q, [[0, 8], [2000, 8]], 10, 14, 1); crescentRows(q, 0, 50, 2000, 170, 22, 5, Math.PI);
  }, { ss: 1, seed: 60, col: NIGHT.mid });
  SETS.post = piece([-40, -560, 40, 10], q => {
    fill(q, s => { s.rect(-9, -470, 18, 470); s.rect(-30, -14, 60, 14); }, NIGHT.near);
    fill(q, s => trace(s, Pl([[-30, -470], [30, -470], [22, -540], [-22, -540]], true, .3, 61)), NIGHT.near);
    cut(q, s => s.rect(-18, -530, 36, 52)); sawRow(q, [[-9, -440], [-9, -20]], 6, 16, 1);
  }, { ss: 1.5, seed: 61, col: NIGHT.near });
  // the puddle: dark water paper with the café sign reflected (letters cut, mirrored top to bottom) and crescent ripples; 2 ripple states
  SETS.puddle = [0, 1].map(v => piece([-300, -46, 300, 46], q => {
    const b = Pp([[-290, -4], [-190, -30], [0, -38], [200, -30], [292, -2], [210, 26], [0, 34], [-210, 26]], true, .5, 62 + v);
    fill(q, s => trace(s, b), NIGHT.water); inset(q, b, 3, 1.4, NIGHT.water);
    within(q, b, () => {
      for (let x = -250 + v * 12; x < 260; x += 46) crescent(q, x, 22, 14, 1.15 * Math.PI, 1.85 * Math.PI, 3);
      q.save(); q.globalCompositeOperation = 'destination-out'; q.fillStyle = '#000'; q.font = '700 34px "Newsreader"'; q.textAlign = 'center';
      q.transform(1, 0, (v - .5) * .14, -1, 0, -6); q.letterSpacing = '6px'; q.fillText('24H  CAFE', 0, 0); q.restore();
    });
  }, { ss: 2, seed: 62 + v, col: NIGHT.water }));
  // water pieces (rice-pale paper): a splash crown in four swaps, droplets, ripple rings in three sizes
  SETS.crown = [.5, 1, 1.15, .75].map((s, i) => piece([-120, -160, 120, 14], q => {
    for (let k = -3; k <= 3; k++) { const h = (60 + 30 * Math.cos(k * .8)) * s, a = k * .3, bx = k * 20; const pts = Pp([[bx - 9, 0], [bx + Math.sin(a) * h * .5 - 6, -h * .55], [bx + Math.sin(a) * h, -h], [bx + Math.sin(a) * h * .5 + 6, -h * .55], [bx + 9, 0]], true, .3, 70 + k); fill(q, z => trace(z, pts), NIGHT.pale); }
    fill(q, z => trace(z, Pp([[-80, 0], [0, -14], [80, 0], [0, 10]], true, .3, 77)), NIGHT.pale); sawRow(q, [[-70, 2], [70, 2]], 6, 8, -1);
  }, { ss: 2, seed: 70 + i, col: NIGHT.pale }));
  SETS.drop = piece([-8, -12, 8, 10], q => fill(q, z => { z.moveTo(0, -10); z.quadraticCurveTo(7, 2, 0, 8); z.quadraticCurveTo(-7, 2, 0, -10); }, NIGHT.pale), { ss: 2, seed: 78, col: NIGHT.pale });
  SETS.ring = [60, 110, 160].map((r, i) => piece([-r - 8, -r * .25 - 8, r + 8, r * .25 + 8], q => { const o = ellipsePoly(0, 0, r, r * .22, 0, 48), n = ellipsePoly(0, 0, r - 7, r * .22 - 4, 0, 48).reverse(); fill(q, z => { trace(z, o); trace(z, n); }, NIGHT.pale, 'evenodd'); }, { ss: 1.5, seed: 79 + i, col: NIGHT.pale, edge: .8 }));
  SETS.sliver = piece([-3, -26, 3, 26], q => fill(q, z => { z.moveTo(0, -24); z.lineTo(1.6, 0); z.lineTo(0, 24); z.lineTo(-1.6, 0); z.closePath(); }, NIGHT.pale), { ss: 2, seed: 80, col: NIGHT.pale, tex: false, edge: 0 });
}
function rain(ctx, t, cam, n = 70, k = 1.2) {
  for (let i = 0; i < n; i++) {
    const sp = 900 + 500 * hash(i * 3.1), x0 = hash(i * 7.7) * 2400 - 240 - (cam[0] * k) % 2400, y = ((hash(i * 5.3) * 1300 + t * sp) % 1300) - 120;
    const x = ((x0 + t * 160) % 2400 + 2400) % 2400 - 240;
    put(ctx, SETS.sliver, [Math.cos(-.14), Math.sin(-.14), -Math.sin(-.14), Math.cos(-.14), x, y].map((v, j) => j < 4 ? v * (1.1 + hash(i) * .5) : v), { shadow: 0, alpha: .8 });
  }
}
const lampXs = [];
for (let x = 1400; x < 11000; x += 1500) lampXs.push(x);
function drawStreet(ctx, t, cam, tq) {
  const C = camM(cam), z = cam[2];
  beginLight('rgb(128,134,192)');
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); fillPaper(ctx, 'ink', 0, 0, W, H, parC(cam, .15)); ctx.restore();
  const Cf = parC(cam, .35);
  for (let i = -1; i < 6; i++) put(ctx, SETS.far[(i + 2) % 2], mul(Cf, Tm(i * 2400, GROUND - 120)), { shadow: .8 });
  pool(...ap(Cf, [960, 300]), 1100, 'rgba(120,130,220,1)', .25);
  const vx0 = (0 - C[4]) / C[0] - 200, vx1 = (W - C[4]) / C[0] + 200;
  for (const s of SETS.shops) if (s.x + s.w > vx0 && s.x < vx1) {
    const wy = -s.h + 220, ww = s.w - 220, wh = s.h - 330;
    const win = { x: s.x + 110 + ww / 2, y: GROUND + wy + wh / 2, w: ww, h: wh };
    const flower = s.cafe ? { p: SETS.flower, M: [ww / 1100, 0, 0, ww / 1100, win.x, win.y] } : null;
    glowWindow(ctx, C, win, .95, flower); glowWindow(EG, C, win, .6, flower);
    lightRect(q => { q.setTransform(...C); q.rect(win.x - ww / 2, win.y - wh / 2, ww, wh); });
    put(ctx, s.p, mul(C, Tm(s.x, GROUND)), { shadow: 1.1 });
    // the sign: light behind, letters cut out
    const sx = s.x + s.w / 2, sy = GROUND - s.h + 118, sw = s.s.w - 20, sh_ = s.s.h - 20;
    glowWindow(ctx, C, { x: sx, y: sy, w: sw, h: sh_ }, 1); glowWindow(EG, C, { x: sx, y: sy, w: sw, h: sh_ }, .7);
    lightRect(q => { q.setTransform(...C); q.rect(sx - sw / 2, sy - sh_ / 2, sw, sh_); });
    put(ctx, s.s, mul(C, Tm(sx, sy)), { shadow: 1.2 });
    pool(...ap(C, [win.x, GROUND - 60]), 520 * z, 'rgba(255,190,120,1)', .55);
  }
  for (let x = Math.floor(vx0 / 2000) * 2000; x < vx1; x += 2000) put(ctx, SETS.ground, mul(C, Tm(x, GROUND)), { shadow: 1 });
  // the puddle: its glow behind, the water paper over it; it trembles after the splash (two ripple states at 12 fps)
  const pc = [Wp([SPL.x, 0])[0] + 10, GROUND + 36];
  if (pc[0] > vx0 - 300 && pc[0] < vx1 + 300) {
    for (const [cx_, a] of [[ctx, .85], [EG, .4]]) {                    // the café light lying in the water, under the water paper
      cx_.save(); cx_.setTransform(...C); cx_.beginPath(); cx_.ellipse(pc[0], pc[1], 284, 36, 0, 0, TAU); cx_.clip();
      const gr = cx_.createRadialGradient(pc[0], pc[1] - 6, 0, pc[0], pc[1], 300); gr.addColorStop(0, `rgba(255,236,190,${a})`); gr.addColorStop(.6, `rgba(255,186,100,${a})`); gr.addColorStop(1, `rgba(220,110,40,${a * .8})`);
      cx_.fillStyle = gr; cx_.fillRect(pc[0] - 300, pc[1] - 60, 600, 120); cx_.restore();
    }
    lightRect(q => { q.setTransform(...C); q.ellipse(pc[0], pc[1], 280, 32, 0, 0, TAU); });
    const shake = t > SPL.t0 && t < SPL.t0 + 1.6 ? Math.floor((t - PH12) * 12) % 2 : 0;
    put(ctx, SETS.puddle[shake], mul(C, Tm(pc[0] + (shake ? 2 : 0), pc[1])), { shadow: .7 });
  }
  // AKI (12 fps) and the water she throws up (on ones)
  const J = drawAki(ctx, C, tq);
  for (const c of RUN.contacts) {
    const u = t - c.t0; if (u < 0 || u > .9) continue;
    const big = c === SPL, fx = Wp([c.x, 0])[0] + 28, s = big ? 1 : .45;
    if (big || u < .3) { const i = Math.min(3, Math.floor(u * 12)); if (u < (big ? .34 : .17)) put(ctx, SETS.crown[big ? i : i + 2], mul(C, mul(Tm(fx, GROUND + 4), Sm(s))), { shadow: .8 }); }
    if (big) {
      for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k / 8 - .5) * 2.4, v0 = 380 + 160 * hash(k * 3.3), x = fx + Math.cos(a) * v0 * u, y = GROUND - 10 + Math.sin(a) * v0 * u + 900 * u * u; if (u < .55) put(ctx, SETS.drop, mul(C, mul(Tm(x, y), Rm(a + Math.PI / 2))), { shadow: .6 }); }
      const ri = Math.floor((u - .1) * 6); if (ri >= 0 && ri < 3) put(ctx, SETS.ring[ri], mul(C, Tm(fx, GROUND + 30)), { shadow: .5 });
    }
  }
  // near layer: lamp posts (parallax 1.35) with glowing lanterns
  const Cn = parC(cam, 1.35);
  for (const lx of lampXs) {
    const p = ap(Cn, [lx, GROUND + 40]); if (p[0] < -200 || p[0] > W + 200) continue;
    const head = { x: lx, y: GROUND + 40 - 504, w: 36, h: 52 };
    glowWindow(ctx, Cn, head, 1); glowWindow(EG, Cn, head, 1); lightRect(q => { q.setTransform(...Cn); q.rect(lx - 18, head.y - 26, 36, 52); });
    put(ctx, SETS.post, mul(Cn, Tm(lx, GROUND + 40)), { shadow: 1.4 });
    pool(...ap(Cn, [lx, GROUND - 300]), 700, 'rgba(255,196,130,1)', .5);
  }
  rain(ctx, t, cam);
  applyLight(ctx); bloom(ctx, .55);
  return J;
}

// ═════════ S3 and S4 sheets (each a full frame of its own paper)
const WC = [1000, 560], WR = 230, TX = 1330;
function buildClose() {
  SETS.sleeve = piece([-1300, -190, 40, 200], q => {
    const s = Pp([[-1300, -150], [-600, -140], [-200, -120], [0, -126], [26, 0], [0, 130], [-200, 130], [-600, 150], [-1300, 170]], true, .6, 90);
    fill(q, z => trace(z, s), PAL.red); inset(q, s, 5, 2, PAL.red);
    within(q, s, () => crescentRows(q, -1300, -150, -120, 170, 26, 7)); sawRow(q, [[-110, -120], [-110, 128]], 10, 14, 1); for (const y of [-70, 0, 70]) swirl(q, -60, y, 18, 1.6, 3.6, y, 1);
  }, { ss: 1, seed: 90 });
  SETS.palm = piece([-20, -150, 600, 160], q => {
    const h = Pp([[0, -116], [220, -132], [420, -110], [560, -40], [550, 30], [420, 96], [220, 128], [0, 112]], true, .6, 91);
    fill(q, z => trace(z, h), PAL.red); inset(q, h, 5, 2, PAL.red); for (const y of [-60, -10, 40]) taper(q, [[330, y], [430, y + 4], [530, y + 6]], 7);
  }, { ss: 1, seed: 91 });
  SETS.strap = piece([-130, -330, 130, 330], q => { const s = Pl([[-118, -330], [118, -330], [118, 330], [-118, 330]], true, .5, 92); fill(q, z => trace(z, s), NIGHT.redDeep); inset(q, s, 4, 1.6, NIGHT.redDeep); crescentRows(q, -110, -320, 110, -WR + 10, 14, 4); crescentRows(q, -110, WR - 10, 110, 320, 14, 4); }, { ss: 1, seed: 92 });
  SETS.case = piece([-WR - 30, -WR - 30, WR + 30, WR + 30], q => {
    const o = sawEdge(ellipsePoly(0, 0, WR + 14, WR + 14, 0, 120), 8, 18, 1), n = ellipsePoly(0, 0, WR - 26, WR - 26, 0, 120).reverse();
    fill(q, z => { trace(z, o); trace(z, n); }, PAL.red, 'evenodd');
    for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; crescent(q, Math.cos(a) * (WR - 6), Math.sin(a) * (WR - 6), 10, a + 1.2, a + 5.1, 3); }
  }, { ss: 1.5, seed: 93 });
  SETS.wedges = piece([-WR, -WR, WR, WR], q => {
    for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + k / 12 * TAU, r0 = k % 3 ? WR - 70 : WR - 96, w = k % 3 ? 7 : 12; const c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c;
      fill(q, z => { z.moveTo(c * r0, s * r0); z.lineTo(c * (WR - 36) + nx * w, s * (WR - 36) + ny * w); z.lineTo(c * (WR - 36) - nx * w, s * (WR - 36) - ny * w); z.closePath(); }, PAL.red); }
    plum(q, 0, 0, 1); fill(q, z => z.arc(0, 0, 16, 0, TAU), PAL.red); cut(q, z => z.arc(0, 0, 5, 0, TAU));
  }, { ss: 1.5, seed: 94 });
  const hand = (L, w, col) => piece([-w - 4, -L - 6, w + 4, 34], q => { const h = Pl([[-w, 24], [-w * .55, -L * .7], [0, -L], [w * .55, -L * .7], [w, 24]], true, .3, L | 0); fill(q, z => trace(z, h), col); if (w > 8) taper(q, [[0, 0], [0, -L * .4], [0, -L * .7]], w * .5); }, { ss: 1.5, seed: L | 0 });
  SETS.hHour = hand(120, 14, NIGHT.redDeep); SETS.hMin = hand(176, 11, NIGHT.redDeep); SETS.hSec = hand(190, 4, PAL.red);
  SETS.tower = piece([-190, -660, 190, 430], q => {
    const body = Pl([[-120, 430], [-120, -200], [120, -200], [120, 430]], true, .5, 95);
    fill(q, z => trace(z, body), PAL.red); inset(q, body, 5, 2, PAL.red);
    for (let y = 120; y < 400; y += 60) for (let x = -80; x <= 80; x += 54) cut(q, z => z.rect(x - 14, y, 28, 40));
    crescentRows(q, -100, -170, 100, 90, 16, 5);
    cut(q, z => z.arc(0, -40, 112, 0, TAU));
    const roof = Pl([[-160, -200], [0, -440], [160, -200]], true, .5, 96); fill(q, z => trace(z, sawEdge(roof, 6, 14, 1)), PAL.red); sawRow(q, [[-130, -214], [130, -214]], 14, 12, -1); swirl(q, 0, -300, 26, 1.8, 4, 0, 1);
    fill(q, z => { z.rect(-5, -640, 10, 200); }, PAL.red); plum(q, 0, -560, 12);
  }, { ss: 1.2, seed: 95 });
  SETS.face = piece([-110, -110, 110, 110], q => {
    fill(q, z => z.arc(0, 0, 104, 0, TAU), PAL.gold);
    for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + k / 12 * TAU; cutTaper(q, [[Math.cos(a) * 74, Math.sin(a) * 74], [Math.cos(a) * 84, Math.sin(a) * 84], [Math.cos(a) * 96, Math.sin(a) * 96]], k % 3 ? 5 : 9); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + .2; crescent(q, Math.cos(a) * 44, Math.sin(a) * 44, 14, a + 1, a + 4.2, 4); }
  }, { ss: 1.5, seed: 97, col: PAL.gold });
  SETS.roofs = [0, 1].map(v => piece([0, -360, 1000, 10], q => {
    const R = mulberry(98 + v), pts = [[0, 0]]; let x = 0;
    while (x < 1000) { const w = 110 + R() * 140, h = 150 + R() * 190; pts.push([x, -h], [x + w * .5, -h - 40], [x + w, -h]); x += w; }
    pts.push([1000, 0]); const b = Pl(pts, true, .5, 98 + v);
    fill(q, z => trace(z, b), NIGHT.house); inset(q, b, 4, 1.6, NIGHT.house);
    for (let yy = -300; yy < -20; yy += 50) for (let xx = 30; xx < 980; xx += 60) if (R() < .4) cut(q, z => z.rect(xx, yy, 20, 26));
  }, { ss: 1, seed: 98 + v, col: NIGHT.house }));
}
const AH = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, AM = -Math.PI / 2 + 58 / 60 * TAU;
function secAngle(t) {                                            // steps once a second at 8.4 and 9.4, a one-step 1.15 pop
  const s = t < 8.4 ? 47 : t < 9.4 ? 48 : 49, t0 = t < 8.4 ? -1 : t < 9.4 ? 8.4 : 9.4, popped = t - t0 < 1 / 12;
  return -Math.PI / 2 + (s + (popped ? .25 : 0)) / 60 * TAU;
}
function drawWatchSheet(ctx, t) {
  const bob = 10 * Math.sin(TAU * CADENCE * (t - 7.5)), cam = [960, 540 + bob, 1], C = camM(cam);
  beginLight('rgb(120,126,186)');
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); fillPaper(ctx, 'indigo', 0, 0, W, H, C, 'rgba(6,8,22,.35)'); ctx.restore();
  // street lights sliding past behind the arm (light pools on ones)
  for (let k = 0; k < 3; k++) { const x = ((k * 900 - (t - 7.5) * 1500) % 2700 + 2700) % 2700 - 400; pool(x, 220 + k * 260, 520, 'rgba(255,190,120,1)', .45); }
  const G = mul(C, mul(Tm(WC[0], WC[1]), Rm(-.08)));
  put(ctx, SETS.sleeve, mul(G, Tm(-150, 0)), { shadow: 1.4 }); put(ctx, SETS.palm, mul(G, Tm(140, 0)), { shadow: 1.4 });
  put(ctx, SETS.strap, G, { shadow: 1.3 });
  // the dial: rice paper lit from behind
  const dial = { x: 0, y: 0, r: WR - 22 };
  glowWindow(ctx, G, dial, 1); glowWindow(EG, G, dial, .55); lightRect(q => { q.setTransform(...G); q.arc(0, 0, WR - 22, 0, TAU); });
  put(ctx, SETS.case, G, { shadow: 1.5 }); put(ctx, SETS.wedges, G, { shadow: .8 });
  put(ctx, SETS.hHour, mul(G, Rm(AH + Math.PI / 2)), { shadow: 1 }); put(ctx, SETS.hMin, mul(G, Rm(AM + Math.PI / 2)), { shadow: 1.1 }); put(ctx, SETS.hSec, mul(G, Rm(secAngle(t) + Math.PI / 2)), { shadow: 1.2 });
  rain(ctx, t, cam, 40);
  applyLight(ctx); bloom(ctx, .5);
}
function drawStationSheet(ctx, t) {
  const cam = [960, lerp(540, 556, ss((t - 9.3) / .7)), 1], C = camM(cam);
  beginLight('rgb(122,128,190)');
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); fillPaper(ctx, 'ink', 0, 0, W, H, C); ctx.restore();
  for (let i = 0; i < 2; i++) put(ctx, SETS.far[i], mul(C, mul(Tm(-200 + i * 1400, 990), Sm(.8))), { shadow: .8 });
  put(ctx, SETS.roofs[0], mul(C, Tm(-60, 1000)), { shadow: 1.1 }); put(ctx, SETS.roofs[1], mul(C, Tm(1480, 1000)), { shadow: 1.1 });
  const chime = t >= EV.chime, popS = chime && t - EV.chime < 1 / 12 ? 1.15 : 1, flash = chime ? Math.exp(-(t - EV.chime) * 5) : 0;
  const MT = mul(C, Tm(TX, 620));
  put(ctx, SETS.tower, MT, { shadow: 1.3 });
  const Mf = mul(MT, mul(Tm(0, -40), Sm(popS)));
  put(ctx, SETS.face, Mf, { shadow: 1.2 });
  put(ctx, SETS.hHour, mul(Mf, mul(Rm(AH + Math.PI / 2), Sm(.5))), { shadow: .8 }); put(ctx, SETS.hMin, mul(Mf, mul(Rm(AM + Math.PI / 2), Sm(.5))), { shadow: .8 });
  pool(...ap(MT, [0, -40]), 600 + 500 * flash, 'rgba(255,214,140,1)', .35 + .9 * flash);
  if (chime) { lightRect(q => { q.setTransform(...Mf); q.arc(0, 0, 104, 0, TAU); }); ctx.save(); EG.save(); EG.setTransform(...Mf); EG.globalAlpha = .45 * flash + .1; EG.fillStyle = '#ffd890'; EG.beginPath(); EG.arc(0, 0, 104, 0, TAU); EG.fill(); EG.restore(); ctx.restore(); }
  rain(ctx, t, cam, 50);
  applyLight(ctx); bloom(ctx, .45 + .5 * flash);
}

// ───────── transitions (paper actions) and the frame
const [Ac, Ag] = canvas(W, H), [Bc, Bg] = canvas(W, H);
const CUT = [2.40, 2.75], PASTE = [7.38, 7.5], FLY = [9.30, 9.62];
function camS1(t) { return [PX + 70 + 10 * t, 805, 2.0]; }
function camS2(t) { return [Math.max(960, Xw(t) + 150), 540, 1]; }
function fresh(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.clearRect(0, 0, W, H); }
function renderStreet(ctx, t, cam) { fresh(ctx); EG.setTransform(1, 0, 0, 1, 0, 0); EG.clearRect(0, 0, W, H); return drawStreet(ctx, t, cam, step12(t)); }
function sheetShadow(ctx, M, poly, a = .45) { ctx.save(); ctx.setTransform(...M); ctx.shadowColor = `rgba(6,4,14,${a})`; ctx.shadowBlur = 26; ctx.shadowOffsetX = 10; ctx.shadowOffsetY = 14; ctx.fillStyle = '#000'; ctx.beginPath(); trace(ctx, poly); ctx.fill(); ctx.restore(); }
function render(t) {
  fresh(g);
  if (t < CUT[0]) { renderStreet(g, t, camS1(t)); return; }
  if (t < CUT[1]) {
    // a cut through the frame: the S1 sheet is cut along a wavy diagonal and its halves fly apart over S2
    renderStreet(Bg, t, camS2(Math.max(t, 2.5))); renderStreet(Ag, Math.min(t, 2.5), camS1(Math.min(t, 2.5)));
    g.drawImage(Bc, 0, 0);
    const u = clamp((t - CUT[0]) / (CUT[1] - CUT[0])), e = ei(u), line = curve([[-60, 1180], [560, 640], [1240, 470], [1990, -80]], false, 6);
    const halves = [[[-200, -200], ...line.slice().reverse(), [-200, 1300]], [[2200, 1300], ...line, [2200, -200]]];
    halves.forEach((poly, i) => {
      const s = i ? 1 : -1, M = mul(Tm(s * (8 + 1400 * e), s * (6 + 900 * e) * (i ? 1 : 1)), mul(Tm(960, 540), mul(Rm(s * .35 * e), Tm(-960, -540))));
      sheetShadow(g, M, poly, .5 * (1 - u * .5));
      g.save(); g.setTransform(...M); g.beginPath(); trace(g, poly); g.clip(); g.drawImage(Ac, 0, 0);
      g.strokeStyle = 'rgba(255,220,200,.5)'; g.lineWidth = 2; g.beginPath(); trace(g, line, false); g.stroke(); g.restore();
    });
    return;
  }
  if (t < PASTE[0]) { renderStreet(g, t, camS2(t)); return; }
  if (t < 7.5) {
    // a sheet pasted over the frame (on ones), with its shadow, landing on the hit
    renderStreet(g, t, camS2(t)); fresh(Ag); EG.setTransform(1, 0, 0, 1, 0, 0); EG.clearRect(0, 0, W, H); drawWatchSheet(Ag, 7.5);
    const u = eo((t - PASTE[0]) / (PASTE[1] - PASTE[0])), s = lerp(.62, 1, u), M = mul(Tm(960, 540), mul(Rm(lerp(-.12, 0, u)), mul(Sm(s), Tm(-960, -540))));
    const poly = [[0, 0], [W, 0], [W, H], [0, H]];
    sheetShadow(g, M, poly, .55); g.save(); g.setTransform(...M); g.drawImage(Ac, 0, 0); g.restore();
    return;
  }
  if (t < FLY[0]) {
    const pop = t - 7.5 < 1 / 12 ? 1.04 : 1;
    fresh(Ag); EG.setTransform(1, 0, 0, 1, 0, 0); EG.clearRect(0, 0, W, H); drawWatchSheet(Ag, t);
    g.save(); g.setTransform(pop, 0, 0, pop, 960 * (1 - pop), 540 * (1 - pop)); g.drawImage(Ac, 0, 0); g.restore();
    return;
  }
  // the station sheet underneath, the watch sheet flying off (up and to the left, turning)
  EG.setTransform(1, 0, 0, 1, 0, 0); EG.clearRect(0, 0, W, H); drawStationSheet(g, t);
  if (t < FLY[1]) {
    fresh(Ag); EG.setTransform(1, 0, 0, 1, 0, 0); EG.clearRect(0, 0, W, H); drawWatchSheet(Ag, t);
    const u = ei((t - FLY[0]) / (FLY[1] - FLY[0])), M = mul(Tm(-2100 * u, -1500 * u), mul(Tm(960, 540), mul(Rm(-.5 * u), mul(Sm(1 + .25 * u), Tm(-960, -540)))));
    sheetShadow(g, M, [[0, 0], [W, 0], [W, H], [0, H]], .5); g.save(); g.setTransform(...M); g.drawImage(Ac, 0, 0); g.restore();
  }
}

buildAki(); buildSets(); buildClose();
window.render = render;
window.DUR = DUR;
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(step12(t))); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
render(0);
window.READY = true;
