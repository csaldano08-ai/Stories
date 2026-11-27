// 038 · Shadow Puppetry — the first 10 s of "Last Train Home" played on a shadow-theatre cloth (lemo-opuscar styles/shadow-puppet).
// Translucent dyed-hide pieces, carved like lace, multiplied onto a white transmission canvas and lit from behind by oil
// lamps (engine/gl.js: lamp field × hide transmission × cloth weave, warm bloom and vignette). Night = few lamps.
//   S1 0–2.5    close on the cloth at the ground strip: a carved water piece (wave slits, the café sign cut into it upside
//               down: its reflection), a rain band of tapered slits swapped at 12 fps; AKI's puppet runs through, the boot
//               lands in the water at 0.9375 s: splash pieces swapped at 12 fps, the water piece shaken.
//   ─ a blurred foreground pillar wipes across the cut (2.5) ─
//   S2 2.5–7.5  lateral pan along a wide cloth, following the puppet with a slight zoom: carved shopfronts with sign plaques
//               whose letters are cut out (they glow), a lamp every ~2200 px; small splash pieces at every footfall;
//               6.05–7.15 the hand rod lifts her wrist to the watch, the head piece tips down (faces never change).
//   ─ a flash to warm white (7.5) ─
//   S3 7.5–9.4  close on a carved detail: the watch, pressed on to the cloth (large and blurred → sharp), riveted hands at
//               23:58, the second-hand piece turning on its rivet at each tick (8.4, 9.4); the whole piece trembles in the hand.
//   ─ the watch lifts off in light while the station set is pressed on (9.3–9.7) ─
//   S4 9.4–10   pull back to the audience seat: lacquered frame, heads below; city tops and the station clock; on the chime
//               (9.575) a new lamp flares behind the clock (with overshoot) and its carved face blazes.
// AKI is a jointed puppet of 15 pieces (thighs, shins, boots, two coat pieces, a coat flap, collar, head with an open-cut face,
// a three-piece ponytail, sleeves and hands), riveted, held on a neck rod and two hand rods, posed by the shared run rig
// (constant limb lengths, foot lock); the coat flap and the ponytail are pre-simulated loose parts; hand tremor on the upper body.
// Page contract: window.render(t), DUR, READY, RIGQA.
import { makeGL } from './engine/gl.js';
import { canvas, piece, drawPiece, fill, cut, cutLine, cutTaper, ink, within, smooth, poly, cloud, beads, beadLine, lattice, coin, meander, scalesOpen, flameTongue, rivet, DYE } from './engine/carve.js';
import { drawFrame, drawAudience, drawPillar, drawRods } from './engine/stage.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, back, ss, eo, ei, eio, vnoise, hash, mulberry, TAU } from './shared/lib/util.js';

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

const W = 1920, H = 1080;
const [trc, tr] = canvas(W, H), [frc, fr] = canvas(W, H);
const GL = makeGL(document.getElementById('gl'));
await document.fonts.load('600 60px "Cormorant Garamond"');
const E = (t, a, b) => ss(seg(t, a, b));

// ───────── affine helpers (canvas order [a b c d e f])
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const Tm = (x, y) => [1, 0, 0, 1, x, y], Rm = a => { const c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, 0, 0]; }, Sm = k => [k, 0, 0, k, 0, 0];
const ap = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const camM = ([cx, cy, z]) => [z, 0, 0, z, 960 - cx * z, 540 - cy * z];
function put(g, M, p, o = {}) {
  g.save(); g.globalCompositeOperation = 'multiply'; g.setTransform(...M);
  if (o.alpha != null) g.globalAlpha = o.alpha; if (o.blur) g.filter = `blur(${o.blur}px)`;
  drawPiece(g, p); g.restore();
}

// ═════════ the puppet: AKI (pieces in rig units; K maps rig units → cloth px)
const K = .85, GY = 930, PX = 1500;                                 // the water piece sits at PX on the street cloth
const Wp = p => [PX + (p[0] - SPL.x) * K, GY + p[1] * K];
const Xw = t => Wp([X(t), 0])[0];
const out = (g, w, f) => ink(g, w, f);                              // carved outline
const P = {};
function buildAki() {
  const J0 = solveProfile(RUN.pose(3)), dWP = Math.hypot(J0.pelvis[0] - J0.waist[0], J0.pelvis[1] - J0.waist[1]), dWN = Math.hypot(J0.neckBase[0] - J0.waist[0], J0.neckBase[1] - J0.waist[1]);
  P.dWP = dWP; P.dWN = dWN;
  const limb = (L, w0, w1, r0, r1, dye, extra) => piece([-w0 - 6, -r0 - 6, w0 + 6, L + r1 + 6], g => {
    const sh = q => { q.moveTo(-w0, 0); q.lineTo(-w1, L); q.lineTo(w1, L); q.lineTo(w0, 0); q.closePath(); q.moveTo(r0, 0); q.arc(0, 0, r0, 0, TAU); q.moveTo(r1, L); q.arc(0, L, r1, 0, TAU); };
    fill(g, dye, sh, 'nonzero');
    extra && extra(g, sh);
    out(g, 2.2, sh);
  }, { seed: L | 0 });
  P.thigh = limb(150, 25, 19, 26, 19, DYE.blue, g => { cutTaper(g, [[-9, 26], [-8, 80], [-6, 128]], 7); cutTaper(g, [[8, 30], [8, 84], [6, 124]], 6); });
  P.shin = limb(144, 19, 14, 19, 14, DYE.blue, g => { cutTaper(g, [[-5, 22], [-4, 70], [-3, 104]], 6); fill(g, DYE.gold, q => q.rect(-16, 112, 32, 18)); cutLine(g, 2, q => { q.moveTo(-12, 121); q.lineTo(12, 121); }); });
  P.boot = piece([-32, -42, 76, 24], g => {
    const sh = q => smooth(q, [[-14, -36], [14, -36], [16, -8], [40, -2], [66, 4], [70, 14], [20, 18], [-22, 16], [-26, 0]]);
    fill(g, '#3a2214', sh); beadLine(g, -4, -28, -4, -6, 2.6, 7); cutLine(g, 2.2, q => { q.moveTo(-18, 10); q.lineTo(62, 10); }); out(g, 2, sh);
  }, { seed: 3 });
  // lower coat: pivot at the waist, +y toward the pelvis, front = +x; scale rows and a fret border at the hem
  const lc = q => smooth(q, [[-34, 0], [30, 0], [40, dWP], [50, dWP + 92], [12, dWP + 104], [-30, dWP + 106], [-66, dWP + 88], [-46, dWP]]);
  P.coatLo = piece([-80, -10, 64, dWP + 120], g => { fill(g, DYE.red, lc); within(g, lc, () => { scalesOpen(g, -70, 18, 60, dWP + 56, 9); meander(g, -64, dWP + 86, 46, 7, 2); }); out(g, 2.2, lc); }, { seed: 5 });
  P.flap = piece([-44, -8, 22, 112], g => { const f = q => smooth(q, [[0, 0], [14, 4], [8, 64], [-6, 104], [-34, 96], [-26, 40], [-14, 2]]); fill(g, DYE.crim, f); cutTaper(g, [[-6, 16], [-10, 60], [-18, 92]], 7); out(g, 2, f); }, { seed: 6 });
  // upper coat: pivot at the waist, −y up to the neck base; a diamond lattice on the chest
  const uc = q => smooth(q, [[-36, 6], [34, 6], [40, -dWN * .5], [30, -dWN + 8], [10, -dWN - 6], [-26, -dWN - 4], [-42, -dWN * .5]]);
  P.coatUp = piece([-50, -dWN - 16, 50, 16], g => { fill(g, DYE.red, uc); within(g, q => smooth(q, [[-24, -8], [22, -8], [26, -dWN * .5], [18, -dWN + 18], [-18, -dWN + 18], [-28, -dWN * .5]]), () => lattice(g, -40, -dWN, 40, 0, 13, 3)); out(g, 2.2, uc); }, { seed: 7 });
  P.collar = piece([-40, -30, 34, 26], g => { const c = q => smooth(q, [[-30, -6], [10, -12], [26, 10], [-6, 20], [-34, 8]]); fill(g, DYE.crim, c); cloud(g, -8, 4, 9, .4, 1.6); out(g, 2, c); }, { seed: 8 });
  // head (1.2× natural, head frame: x forward, y down, origin at the head centre): an open-cut face — the profile is a thin strip
  const HKs = 1.2, hs = pts => pts.map(([x, y]) => [x * HKs, y * HKs]);
  const skull = hs([[18, -40], [34, -18], [42, -2], [36, 7], [38, 15], [33, 21], [31, 33], [12, 44], [-10, 46], [-36, 36], [-50, 6], [-46, -24], [-24, -46]]);
  const faceHole = hs([[14, -32], [28, -16], [34, -3], [29, 6], [30, 14], [26, 19], [24, 29], [10, 37], [0, 37], [-2, 0], [6, -26]]);
  const hair = hs([[30, -38], [12, -52], [-22, -50], [-48, -26], [-54, 6], [-42, 34], [-24, 44], [-14, 16], [-6, -14], [4, -30], [20, -30]]);
  P.head = piece([-72, -72, 60, 64], g => {
    fill(g, DYE.skin, q => smooth(q, skull));
    cut(g, q => smooth(q, faceHole));
    fill(g, DYE.skin, q => { q.ellipse(19 * HKs, -10 * HKs, 8.5 * HKs, 3.6 * HKs, -.12, 0, TAU); });       // the eye: an almond strip
    cut(g, q => { q.ellipse(19 * HKs, -10 * HKs, 6 * HKs, 1.7 * HKs, -.12, 0, TAU); });
    fill(g, DYE.skin, q => { q.moveTo(10 * HKs, -18 * HKs); q.quadraticCurveTo(20 * HKs, -22 * HKs, 30 * HKs, -17 * HKs); q.lineTo(29 * HKs, -15.5 * HKs); q.quadraticCurveTo(20 * HKs, -20 * HKs, 10 * HKs, -16.5 * HKs); q.closePath(); });
    fill(g, DYE.ink, q => smooth(q, hair));
    for (const s of [[[-6, -40], [-30, -30], [-44, -6]], [[4, -44], [-20, -40], [-40, -18]], [[-14, -22], [-34, 0], [-36, 24]]]) cutTaper(g, s.map(([x, y]) => [x * HKs, y * HKs]), 4.2);
    fill(g, DYE.ink, q => smooth(q, hs([[20, -38], [36, -24], [30, -22], [16, -30]])));
    out(g, 2.4, q => smooth(q, skull)); out(g, 1.6, q => smooth(q, faceHole));
  }, { seed: 9 });
  P.tail = piece([-6, -12, 58, 12], g => { const f = q => smooth(q, [[0, -9], [30, -10], [56, -2], [30, 9], [0, 8]]); fill(g, DYE.ink, f); cutTaper(g, [[6, -2], [28, -3], [50, -1]], 3.4); }, { seed: 10 });
  P.upper = limb(108, 17, 14, 18, 14, DYE.crim, g => { for (let y = 22; y < 96; y += 16) cutLine(g, 2.2, q => q.arc(0, y, 9, .2 * Math.PI, .8 * Math.PI)); });
  P.fore = limb(92, 14, 12, 14, 12, DYE.crim, g => { fill(g, DYE.gold, q => q.rect(-14, 70, 28, 14)); cutLine(g, 1.8, q => { q.moveTo(-10, 77); q.lineTo(10, 77); }); });
  P.foreW = limb(92, 14, 12, 14, 12, DYE.crim, g => { fill(g, DYE.gold, q => q.rect(-14, 70, 28, 14)); cutLine(g, 1.8, q => { q.moveTo(-10, 77); q.lineTo(10, 77); }); fill(g, DYE.gold, q => q.arc(13, 60, 11, 0, TAU)); coin(g, 13, 60, 7.5); });
  P.hand = piece([-16, -8, 16, 40], g => { const h = q => smooth(q, [[-9, -2], [10, -2], [13, 18], [7, 32], [-4, 34], [-12, 20]]); fill(g, DYE.skin, h); cutLine(g, 1.6, q => { q.moveTo(-2, 18); q.lineTo(-3, 30); q.moveTo(4, 18); q.lineTo(4, 30); }); out(g, 1.8, h); }, { seed: 11 });
}
// loose parts, pre-simulated at 240 Hz for determinism: the coat flap (damped pendulum driven by the pelvis bob) and the ponytail chain
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
const bone = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;           // local +y along a→b
const boneUp = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;         // local −y along a→b
function drawAki(g, C, t, o = {}) {
  const S_ = poseAt(t), J = solveProfile(S_), kC = Math.hypot(C[0], C[1]);
  const Mw = mul(C, [K, 0, 0, K, PX - SPL.x * K, GY]);                // rig units → viewport
  const tr0 = .012 * (vnoise(t * 1.7 + 3) - .5) * 2, trX = 1.6 * (vnoise(t * 1.3 + 9) - .5) * 2;   // hand tremor (upper body only: the feet stay locked)
  const at = (p, a, M = Mw) => mul(M, mul(Tm(p[0], p[1]), Rm(a)));
  const L = [], riv = [];
  // legs (far, then near)
  for (const kk of ['f', 'n']) {
    const l = J.leg[kk];
    L.push([at(l.hip, bone(l.hip, l.knee)), P.thigh], [at(l.knee, bone(l.knee, l.ankle)), P.shin], [at(l.ankle, l.pitch), P.boot]);
    riv.push(ap(Mw, ...l.hip), ap(Mw, ...l.knee), ap(Mw, ...l.ankle));
  }
  // body: a little tremor about the waist
  const Mu = mul(Mw, mul(Tm(J.waist[0] + trX, J.waist[1]), mul(Rm(tr0), Tm(-J.waist[0], -J.waist[1]))));
  const aLo = bone(J.waist, J.pelvis), aUp = boneUp(J.waist, J.neckBase);
  const MLo = at(J.waist, aLo), MUp = at(J.waist, aUp, Mu);
  L.push([mul(MLo, mul(Tm(-36, P.dWP - 4), Rm(SIM.flap(t)))), P.flap], [MLo, P.coatLo], [MUp, P.coatUp]);
  L.push([at(J.neckBase, aUp, Mu), P.collar]);
  const MH = at(J.headC, J.headA, Mu);
  const ta = SIM.tail(t); let MT = mul(MH, mul(Tm(-56, -8), Rm(Math.PI - .25 + ta[0])));
  for (let k = 0; k < 3; k++) { L.push([MT, P.tail]); MT = mul(MT, mul(Tm(46, 0), Rm(ta[(k + 1) % 3] * .6 - ta[k] * .3))); }
  L.push([MH, P.head]);
  riv.push(ap(Mw, ...J.waist), ap(Mu, ...J.neckTop));
  // arms (far, then near); the near forearm carries the watch
  const hands = {};
  for (const kk of ['f', 'n']) {
    const a = J.arm[kk], h = [a.wr[0] + (a.wr[0] - a.el[0]) * .02, a.wr[1] + (a.wr[1] - a.el[1]) * .02];
    L.push([at(a.sh, bone(a.sh, a.el), Mu), P.upper], [at(a.el, bone(a.el, a.wr), Mu), kk === 'n' ? P.foreW : P.fore], [at(h, bone(a.el, a.wr), Mu), P.hand]);
    riv.push(ap(Mu, ...a.sh), ap(Mu, ...a.el), ap(Mu, ...a.wr));
    hands[kk] = ap(Mu, a.wr[0] + (a.wr[0] - a.el[0]) * .25, a.wr[1] + (a.wr[1] - a.el[1]) * .25);
  }
  for (const [M, p] of L) put(g, M, p, o);
  if (o.alpha == null || o.alpha > .5) for (const q of riv) rivet(g, q[0], q[1], 3.4 * K * kC);
  return { J, rods: [ap(Mu, ...J.neckBase), hands.f, hands.n], kC };
}

// ═════════ the street cloth (S1, S2)
const CW = 10800;
const SETS = {};
function sign(word, w, h, seed) {
  return piece([-w / 2 - 8, -h / 2 - 8, w / 2 + 8, h / 2 + 8], g => {
    const b = q => { q.roundRect(-w / 2, -h / 2, w, h, 10); };
    fill(g, '#3a1a10', b); within(g, b, () => meander(g, -w / 2 + 10, -h / 2 + 14, w / 2 - 10, 5, 1.6));
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.font = `600 ${h * .56}px "Cormorant Garamond"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '4px'; g.fillText(word, 0, h * .08); g.restore();
    out(g, 2.2, b);
  }, { seed, ss: 2 });
}
function shop(w, h, word, dye, kind, seed) {
  return piece([-10, -h - 70, w + 10, 6], g => {
    const R = mulberry(seed);
    const body = q => { q.moveTo(0, 0); q.lineTo(0, -h + 60); q.lineTo(w, -h + 60); q.lineTo(w, 0); q.closePath(); };
    fill(g, DYE.hide, body);
    // windows and door: carved openings with their own lattice
    const ww = (w - 120) / 2 - 40;
    const wins = [[40, -h + 250, ww, h - 330], [w - 40 - ww, -h + 250, ww, h - 330]], door = [w / 2 - 50, -230, 100, 230];
    for (const [x, y, a, b] of wins) {
      cut(g, q => q.rect(x, y, a, b));
      fill(g, DYE.hide, q => { q.rect(x, y, a, b); q.rect(x + 7, y + 7, a - 14, b - 14); }, 'evenodd');
      within(g, q => q.rect(x + 7, y + 7, a - 14, b - 14), () => {
        g.save(); g.globalCompositeOperation = 'source-over';
        if (kind === 0) { fill(g, DYE.hide2, q => q.rect(x, y, a, b)); lattice(g, x, y, x + a, y + b, 22, 4); }
        else if (kind === 1) { fill(g, DYE.hide2, q => q.rect(x, y, a, b)); for (let yy = y + 26; yy < y + b; yy += 34) for (let xx = x + 26; xx < x + a; xx += 34) coin(g, xx, yy, 13); }
        else { fill(g, DYE.hide2, q => { for (let xx = x + 18; xx < x + a; xx += 30) q.rect(xx - 2.5, y, 5, b); q.rect(x, y + b / 2 - 3, a, 6); }); }
        g.restore();
      });
      out(g, 2, q => q.rect(x, y, a, b));
    }
    cut(g, q => q.rect(...door)); fill(g, DYE.hide, q => q.rect(door[0] + door[2] / 2 - 3, door[1] + 8, 6, door[3] - 8));
    // awning (dyed, scale-carved) and a cloud-scroll fringe
    const aw = q => { q.moveTo(-6, -h + 60); q.lineTo(w + 6, -h + 60); q.lineTo(w - 20, -h); q.lineTo(20, -h); q.closePath(); };
    fill(g, dye, aw); within(g, aw, () => scalesOpen(g, 0, -h + 6, w, -h + 58, 10));
    for (let x = 30; x < w - 20; x += 60) cloud(g, x, -h + 74, 10, R() * 6, 1.4);
    out(g, 2.2, aw); out(g, 2.2, body);
    // strata on the wall between the windows
    for (let k = 0; k < 4; k++) cutLine(g, 2, q => { q.moveTo(w / 2 - 30, -h + 270 + k * 40); q.quadraticCurveTo(w / 2, -h + 262 + k * 40, w / 2 + 30, -h + 270 + k * 40); });
  }, { seed, ss: 2 });
}
const SHOPS = [[960, 'CAFE', DYE.jade, 0], [2400, '24H', DYE.gold, 1], [3500, 'BAKERY', DYE.teal, 2], [4650, 'BOOKS', DYE.jade, 1], [5800, 'NOODLES', DYE.orange, 0], [6950, 'BAR', DYE.gold, 2], [8050, 'FLOWERS', DYE.teal, 1], [9200, 'HOTEL', DYE.jade, 0], [10250, 'RECORDS', DYE.gold, 2]];
function buildStreet() {
  SETS.shops = SHOPS.map(([x, word, dye, kind], i) => { const w = 640 + (i % 3) * 60, h = 700 + (i % 2) * 30; return { x, w, h, p: shop(w, h, '', dye, kind, 20 + i), s: sign(word, Math.max(220, word.length * 46 + 60), 92, 40 + i) }; });
  SETS.ground = piece([0, -6, 1800, 70], g => {
    const b = q => q.rect(0, 0, 1800, 62); fill(g, DYE.hide2, b);
    for (let x = 30; x < 1800; x += 60) coin(g, x, 31, 11);
    meander(g, 0, 12, 1800, 5, 1.6); out(g, 2.2, b);
  }, { seed: 12, ss: 2 });
  // rain band at the top of the cloth: dark hide with tapered slits, three variants swapped at 12 fps
  SETS.rain = [0, 1, 2].map(v => piece([0, -4, 1800, 200], g => {
    const R = mulberry(70 + v), b = q => { q.moveTo(0, 0); q.lineTo(1800, 0); q.lineTo(1800, 96); for (let x = 1800; x > 0; x -= 90) q.quadraticCurveTo(x - 45, 138, x - 90, 96); q.closePath(); };
    fill(g, '#5a3218', b);
    for (let k = 0; k < 90; k++) { const x = R() * 1800, y = 6 + ((R() * 70 + v * 24) % 70), l = 18 + R() * 20; cutTaper(g, [[x, y], [x + l * .12, y + l * .5], [x + l * .24, y + l]], 3.2); }
    for (let x = 45; x < 1800; x += 90) cloud(g, x, 108, 12, 1 + v, 1.6);
    out(g, 2.2, b);
  }, { seed: 13 + v, ss: 2 }));
  // the water piece by the café: wave slits and the café sign reflected (letters cut, mirrored top-to-bottom), two ripple states
  SETS.water = [0, 1, 2].map(v => piece([-320, -50, 320, 50], g => {
    const b = q => smooth(q, [[-300, -6], [-200, -34], [0, -40], [210, -32], [304, -4], [220, 30], [0, 38], [-220, 30]]);
    fill(g, DYE.blue, b);
    within(g, b, () => {
      for (let y = -26; y < 34; y += 12) for (let x = -300 + (y % 24 ? 0 : 14); x < 300; x += 28) cutLine(g, 1.8, q => q.arc(x + (v - 1) * 5, y, 9, 1.1 * Math.PI, 1.9 * Math.PI));
      g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.font = '600 36px "Cormorant Garamond"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.setTransform(g.getTransform().multiply(new DOMMatrix([1, 0, (v - 1) * .12, -1, (v - 1) * 4, 6]))); g.letterSpacing = '6px'; g.fillText('24H  CAFE', -10, 0); g.restore();
    });
    out(g, 2.2, b);
  }, { seed: 16 + v, ss: 2 }));
  // splash pieces (water tongues with fat bases and hooked tips, never particles): five swaps
  SETS.splash = [[.5, 0], [1, 0], [1.15, 1], [.85, 1], [.5, 1]].map(([s, drops], i) => piece([-140, -170, 140, 20], g => {
    const R = mulberry(90 + i);
    for (let k = -3; k <= 3; k++) {
      g.save(); g.translate(k * 26, 6); g.rotate(k * .32); const h = (70 + 30 * Math.cos(k * .7)) * s, w = 22 * Math.sqrt(s);
      fill(g, DYE.blue, q => flameTongue(q, h, w, k < 0 ? -1 : 1)); cutLine(g, 1.6, q => { q.moveTo(0, -4); q.lineTo(k * 1.5, -h * .6); }); out(g, 1.6, q => flameTongue(q, h, w, k < 0 ? -1 : 1)); g.restore();
    }
    if (drops) for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k / 6 - .5) * 2.6, r = (110 + R() * 30) * s, x = Math.cos(a) * r, y = Math.sin(a) * r * .8 - 20; fill(g, DYE.blue, q => { q.moveTo(x, y - 9); q.quadraticCurveTo(x + 7, y + 2, x, y + 7); q.quadraticCurveTo(x - 7, y + 2, x, y - 9); }); }
  }, { seed: 30 + i }));
}
const lampsStreet = t => [1500, 3700, 5900, 8100, 10300].map((x, k) => [x, 420 + (k % 2) * 30, 1 + .06 * (vnoise(t * 7 + k * 13) - .5) * 2 + .03 * Math.sin(t * 23 + k), .95]);
function drawStreet(g, C, t) {
  const kC = Math.hypot(C[0], C[1]), v12 = Math.floor(t * 12) % 3;
  const vx0 = (0 - C[4]) / C[0], vx1 = (W - C[4]) / C[0];
  for (let x = 0; x < CW; x += 1800) if (x + 1800 > vx0 && x < vx1) { put(g, mul(C, Tm(x, 0)), SETS.rain[v12]); put(g, mul(C, Tm(x, GY - 2)), SETS.ground); }
  for (const s of SETS.shops) if (s.x + s.w > vx0 - 20 && s.x < vx1 + 20) {
    const sway = .004 * Math.sin(t * 1.3 + s.x);
    put(g, mul(C, mul(Tm(s.x, GY + 2), Rm(sway))), s.p);
    put(g, mul(C, Tm(s.x + s.w / 2, GY - s.h + 128 + 3 * Math.sin(t * 2 + s.x))), s.s);
  }
  // the water piece, shaken after the splash; then the ripple states swap at 12 fps
  const sh = t > SPL.t0 ? Math.exp(-(t - SPL.t0) * 2.2) : 0, wv = t > SPL.t0 && t < SPL.t0 + 1.8 ? 1 + (Math.floor(t * 12) % 2 ? 1 : -1) : 1;
  put(g, mul(C, mul(Tm(PX + 60 + sh * 5 * Math.sin(t * 40), GY + 16), Rm(sh * .03 * Math.sin(t * 31)))), SETS.water[wv]);
  // splashes: the big one in the water, small ones at every other footfall
  for (const c of RUN.contacts) {
    const u = t - c.t0; if (u < 0 || u > .42) continue;
    const big = c === SPL, i = Math.min(4, Math.floor(u * 12)), fx = Wp([c.x, 0])[0] + 30;
    if (!big && i > 1) continue;
    const s = big ? 1 : .42; put(g, mul(C, mul(Tm(fx, GY + 6), Sm(s))), SETS.splash[big ? i : i + 3]);
  }
}

// ═════════ the watch, the station (S3, S4: a 1920 × 1080 cloth)
const WC = [1010, 560], WR = 210, TX = 1310, TC = [TX, 470];
function buildCloseSets() {
  SETS.sleeve = piece([-240, -230, 980, 240], g => {
    const s = q => smooth(q, [[-240, -170], [300, -150], [720, -118], [930, -120], [950, 0], [930, 126], [720, 128], [300, 160], [-240, 200]]);
    fill(g, DYE.red, s); within(g, s, () => scalesOpen(g, -240, -170, 700, 200, 18));
    fill(g, DYE.crim, q => q.rect(700, -140, 80, 290)); fill(g, DYE.gold, q => q.rect(780, -134, 60, 278)); within(g, q => q.rect(780, -134, 60, 278), () => beadLine(g, 810, -120, 810, 130, 6, 18));
    out(g, 3, s); out(g, 2.4, q => q.rect(700, -140, 140, 290));
  }, { seed: 50, ss: 1.5 });
  SETS.palm = piece([-20, -150, 560, 160], g => {
    const h = q => smooth(q, [[0, -116], [220, -132], [420, -110], [540, -40], [530, 30], [420, 96], [220, 128], [0, 112]]);
    fill(g, DYE.skin, h); for (const y of [-60, -10, 40]) cutTaper(g, [[330, y], [430, y + 4], [520, y + 6]], 7); out(g, 3, h);
  }, { seed: 51, ss: 1.5 });
  SETS.watch = piece([-WR - 70, -WR - 70, WR + 70, WR + 70], g => {
    fill(g, '#3a2214', q => q.rect(-WR * .52, -WR - 70, WR * 1.04, 2 * WR + 140)); beadLine(g, -WR * .3, -WR - 50, -WR * .3, -WR - 10, 5, 20); beadLine(g, WR * .3, WR + 10, WR * .3, WR + 50, 5, 20);
    fill(g, DYE.gold, q => q.arc(0, 0, WR, 0, TAU));
    for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; coin(g, Math.cos(a) * (WR - 15), Math.sin(a) * (WR - 15), 7); }
    fill(g, DYE.white, q => q.arc(0, 0, WR - 30, 0, TAU));
    for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + k / 12 * TAU, r0 = k % 3 ? WR - 70 : WR - 92; cutTaper(g, [[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * (r0 + 16), Math.sin(a) * (r0 + 16)], [Math.cos(a) * (WR - 42), Math.sin(a) * (WR - 42)]], k % 3 ? 9 : 15); }
    cloud(g, -60, 70, 18, .6, 2.2); cloud(g, 60, 70, 18, 2.4, 2.2, -1);
    out(g, 3, q => q.arc(0, 0, WR, 0, TAU)); out(g, 2.4, q => q.arc(0, 0, WR - 30, 0, TAU));
  }, { seed: 52, ss: 1.5 });
  const handP = (L, w) => piece([-w - 4, -L - 6, w + 4, 30], g => { const h = q => { q.moveTo(-w, 18); q.lineTo(-w * .55, -L * .7); q.lineTo(0, -L); q.lineTo(w * .55, -L * .7); q.lineTo(w, 18); q.closePath(); }; fill(g, DYE.ink, h); cutTaper(g, [[0, -10], [0, -L * .4], [0, -L * .72]], w * .5); }, { seed: L | 0, ss: 1.5 });
  SETS.hHour = handP(118, 13); SETS.hMin = handP(172, 10); SETS.hSec = handP(186, 4.5);
  SETS.drop = piece([-16, -16, 16, 16], g => { ink(g, 3, q => q.arc(0, 0, 11, 0, TAU)); }, { seed: 53, tex: false });
  // the station set: a clock tower (carved lattice, its face a big hole with a hide ring), city tops left and right
  SETS.tower = piece([-170, -620, 170, 520], g => {
    const body = q => { q.moveTo(-110, 520); q.lineTo(-110, -200); q.lineTo(110, -200); q.lineTo(110, 520); q.closePath(); };
    fill(g, DYE.hide2, body); within(g, q => q.rect(-90, -60, 180, 560), () => { lattice(g, -90, 160, 90, 500, 24, 4); });
    for (let k = 0; k < 5; k++) cutLine(g, 2.2, q => { q.moveTo(-100, 120 + k * 8); q.lineTo(100, 120 + k * 8); });
    const roof = q => { q.moveTo(-150, -190); q.lineTo(0, -420); q.lineTo(150, -190); q.closePath(); };
    fill(g, DYE.jade, roof); within(g, roof, () => scalesOpen(g, -150, -400, 150, -190, 12)); out(g, 2.4, roof);
    fill(g, DYE.ink, q => q.rect(-4, -600, 8, 190)); fill(g, DYE.gold, q => q.arc(0, -560, 14, 0, TAU)); coin(g, 0, -560, 9);
    cut(g, q => q.arc(0, -10, 96, 0, TAU)); fill(g, DYE.gold, q => { q.arc(0, -10, 108, 0, TAU); q.arc(0, -10, 92, 0, TAU); }, 'evenodd');
    for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + k / 12 * TAU; fill(g, DYE.ink, q => { q.save(); q.translate(Math.cos(a) * 80, -10 + Math.sin(a) * 80); q.rotate(a); q.rect(-7, -2.4, 14, 4.8); q.restore(); }); }
    out(g, 2.4, body); out(g, 2.4, q => q.arc(0, -10, 108, 0, TAU));
  }, { seed: 54, ss: 1.5 });
  SETS.roofs = [0, 1].map(v => piece([0, -320, 900, 20], g => {
    const R = mulberry(60 + v), pts = [[0, 0]]; let x = 0;
    while (x < 900) { const w = 110 + R() * 120, h = 140 + R() * 160; pts.push([x, -h], [x + w, -h]); x += w; }
    pts.push([900, 0]);
    fill(g, DYE.hide2, q => poly(q, pts));
    within(g, q => poly(q, pts), () => { for (let yy = -280; yy < -20; yy += 46) for (let xx = 30 + (yy % 92 ? 0 : 20); xx < 900; xx += 64) cut(g, q => q.rect(xx, yy, 22, 26)); });
    out(g, 2.2, q => poly(q, pts));
  }, { seed: 61 + v, ss: 1.5 }));
}
const AHh = -Math.PI / 2 + (11 + 58 / 60) / 12 * TAU, AMm = -Math.PI / 2 + 58 / 60 * TAU, ASs = s => -Math.PI / 2 + s / 60 * TAU;
const SECOND = t => { const s0 = t < 8.4 ? 47 : t < 9.4 ? 48 : 49, t0 = t < 8.4 ? -1 : t < 9.4 ? 8.4 : 9.4; const u = t - t0; return ASs(s0 - 1 + (u < .16 ? back(u / .16, 2.4) : 1)); };
function drawWatch(g, C, t, a = 1, k = 1, blur = 0) {
  // the arm group trembles in the hand and bobs at the run cadence
  const bob = 10 * Math.sin(TAU * CADENCE * (t - 7.5)), tw = .01 * (vnoise(t * 2.1 + 4) - .5) * 2;
  const G = mul(C, mul(Tm(WC[0], WC[1] + bob), mul(Rm(-.08 + tw), Sm(k))));
  const o = { alpha: a, blur };
  put(g, mul(G, Tm(-1150, 0)), SETS.sleeve, o); put(g, mul(G, Tm(150, 0)), SETS.palm, o); put(g, G, SETS.watch, o);
  for (const [x, y] of [[-70, -96], [92, 48], [-40, 110]]) put(g, mul(G, Tm(x, y)), SETS.drop, { ...o, alpha: a * .8 });
  put(g, mul(G, Rm(AHh + Math.PI / 2)), SETS.hHour, o); put(g, mul(G, Rm(AMm + Math.PI / 2)), SETS.hMin, o); put(g, mul(G, Rm(SECOND(t) + Math.PI / 2)), SETS.hSec, o);
  if (a > .5 && !blur) rivet(g, ...ap(G, 0, 0), 9 * Math.hypot(G[0], G[1]));
  return G;
}
const CHIME_LAMP = t => t < EV.chime ? 0 : (t - EV.chime < .3 ? lerp(0, 1, eo((t - EV.chime) / .3)) + .55 * Math.sin((t - EV.chime) / .3 * Math.PI) : 1) * (1 + .05 * (vnoise(t * 7) - .5) * 2);
function drawStation(g, C, t, press) {
  const k = 1 + (1 - press) * .5, bl = (1 - press) * 18, o = { alpha: .3 + .7 * press, blur: bl };
  const at = (x, y) => mul(C, mul(Tm(960, 540), mul(Sm(k), Tm(x - 960, y - 540))));
  for (let x = 0; x < W; x += 1800) put(g, mul(at(x, 0), Tm(0, 0)), SETS.rain[Math.floor(t * 12) % 3], o);
  put(g, at(0, GY - 2), SETS.ground, o); put(g, at(1800, GY - 2), SETS.ground, o);
  put(g, at(-40, GY), SETS.roofs[0], o); put(g, at(1500, GY), SETS.roofs[1], o);
  const Mt = at(TX, TC[1] + 10);
  put(g, Mt, SETS.tower, o);
  const Mc = mul(Mt, Tm(0, -10));
  put(g, mul(Mc, mul(Rm(AHh + Math.PI / 2), Sm(.42))), SETS.hHour, o); put(g, mul(Mc, mul(Rm(AMm + Math.PI / 2), Sm(.42))), SETS.hMin, o);
  if (press > .9) rivet(g, ...ap(Mc, 0, 0), 5 * Math.hypot(Mc[0], Mc[1]));
}

// ───────── shots: camera, lamps, transitions
const PILLAR = [2.28, 2.72], FLASH = 7.5, LIFT = [9.28, 9.7];
function camAt(t) {
  if (t < 2.5) return [PX + 60 + 10 * t, 845, 2.3];
  if (t < 7.5) { const z = lerp(1.0, 1.07, ss((t - 2.5) / 5)); return [Xw(t) + 140, 560, z]; }
  if (t < 9.375) return [960, 540, 1];
  const u = eo((t - 9.375) / .4); return [960, lerp(540, 556, u) + 14 * ss((t - 9.8) / .2), lerp(1, .9, u)];
}
function clampCam(c, rect) {
  const [x0, y0, x1, y1] = rect, hw = 960 / c[2], hh = 540 / c[2];
  if (2 * hw <= x1 - x0) c[0] = clamp(c[0], x0 + hw, x1 - hw);
  if (2 * hh <= y1 - y0) c[1] = clamp(c[1], y0 + hh, y1 - hh);
  return c;
}
function render(t) {
  fr.setTransform(1, 0, 0, 1, 0, 0); fr.clearRect(0, 0, W, H); fr.filter = 'none'; fr.globalAlpha = 1;
  tr.setTransform(1, 0, 0, 1, 0, 0); tr.fillStyle = '#fff'; tr.fillRect(0, 0, W, H);
  const base = { sigB: 700, sigC: 120, amb: .3, time: t, vign: .45, sat: 1.1, contrast: .15, bloom: .3, lcol: [1, .77, .46], hotcol: [1, .9, .62], fadeCol: [1, .92, .78] };
  let o;
  if (t < 7.5) {
    const rect = [0, 0, CW, 1080], cam = clampCam(camAt(t), rect), C = camM(cam);
    drawStreet(tr, C, t);
    const A = drawAki(tr, C, t);
    drawRods(tr, A.rods, A.rods.map((q, j) => [q[0] - (150 - j * 45) * A.kC, q[1] + 900 * A.kC]), 2.4 * A.kC, .7);
    if (t > PILLAR[0] && t < PILLAR[1]) drawPillar(fr, lerp(2900, -980, (t - PILLAR[0]) / (PILLAR[1] - PILLAR[0])));
    o = { ...base, cam, rect, lamps: lampsStreet(t), expo: 1.12, amb: .24, fade: .9 * ei(seg(t, FLASH - .1, FLASH)) };
  } else {
    const rect = [0, 0, 1920, 1080], cam = camAt(t), C = camM(cam);
    const lift = seg(t, LIFT[0], LIFT[1]), press = eo(seg(t, LIFT[0] + .05, LIFT[1]));
    if (t >= LIFT[0]) drawStation(tr, C, t, press);
    if (lift < 1) {
      const pin = eo(seg(t, FLASH, FLASH + .42));
      const k = (1 + (1 - pin) * .55) * (1 + ei(lift) * .6), bl = (1 - pin) * 22 + ei(lift) * 26;
      drawWatch(tr, C, t, (.35 + .65 * pin) * (1 - ei(lift)), k, bl);
    }
    const nL = 1 + CHIME_LAMP(t);
    const lamps = [[WC[0], WC[1], 1 + .05 * (vnoise(t * 7) - .5) * 2, .9]];
    if (t >= LIFT[0]) { lamps[0] = [lerp(WC[0], 620, ss(lift)), lerp(WC[1], 430, ss(lift)), lamps[0][2], .9]; lamps.push([TC[0], TC[1] - 10, CHIME_LAMP(t), 1.2]); }
    if (cam[2] < 1.02) { drawFrame(fr, C, clamp(nL, 0, 3) / 1.5); drawAudience(fr, ss((t - 9.45) / .4) * .95, t); }
    o = { ...base, cam, rect, lamps, expo: 1.22 / Math.sqrt(nL), amb: .26, fade: .9 * (1 - eo(seg(t, FLASH, FLASH + .14))), bloom: .3 + .25 * clamp(CHIME_LAMP(t) - .6, 0, 1) };
  }
  GL.render(trc, frc, o);
}

buildAki(); buildStreet(); buildCloseSets();
window.render = render;
window.DUR = DUR;
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
render(0);
window.READY = true;
