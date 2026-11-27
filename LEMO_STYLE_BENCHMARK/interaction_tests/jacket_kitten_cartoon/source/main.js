// Interaction test (separate from the 10 s benchmark clip): AKI wraps the kitten in her jacket — cartoon (flat colours, bold outlines).
// 7 s, 1920×1080. The jacket never appears or swaps: it is one cloth (a simulated chain for the body of the jacket and one
// for a sleeve, 300 + 160 rig units long) that starts folded over her far forearm, and every state after that comes from
// the simulation: pinned only where a hand holds it, colliding with her forearm, her legs, the kitten and the ground.
//   0.0–1.6  she walks in with the jacket folded over her forearm; stops in front of the kitten
//   1.6–2.4  crouches (feet planted, the pelvis drops, the spine bends)
//   2.4–3.1  the near hand takes the collar; the far arm comes away, the jacket slides off it and falls open from her hands
//   3.1–4.3  she carries it over the kitten and lays it down on the far side: the cloth drapes over the kitten
//   4.3–4.95 the near hand lets go of the collar and takes the cloth on the near side; both hands slide under the kitten
//   4.95–6.3 she stands up holding the bundle; the kitten rides on her hands, the cloth wrapped over it; the head peeks out
// The simulation is precomputed at 240 Hz from t = 0 (deterministic); the picture interpolates the record.
import { solveProfile, drawProfile, handPath } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { path } from './shared/lib/cel.js';
import { celGroup, iline } from './shared/lib/celgroup.js';
import { clamp, lerp, seg, ss, eio, eo, hash, mulberry } from './shared/lib/util.js';

const W = 1920, H = 1080, TAU = Math.PI * 2, DUR = 7; window.DUR = DUR;
const g = document.getElementById('c').getContext('2d');
// ═════════ the walk in, and the plan of the body
const WALK = runner({ t0: 0, t1: 4, x0: -420, v: 540, cadence: 1.85, duty: .64, lean: .05, armA: .32 });
const T_STOP = WALK.contacts.filter(c => c.t0 < 1.7).pop().t0;            // both feet planted (double support)
const lastBall = k => { const c = WALK.contacts.filter(c => c.foot === k && c.t0 <= T_STOP + 1e-6).pop(); return [c.x, 0]; };
const BALL = { n: lastBall('n'), f: lastBall('f') }, PEL0 = WALK.pelvisAt(T_STOP);
const FRONT = BALL.n[0] > BALL.f[0] ? 'n' : 'f', REAR = FRONT === 'n' ? 'f' : 'n', T_STEP = T_STOP + .5;   // a gathering step: the rear foot comes up beside the front one
const BALL2 = { [FRONT]: BALL[FRONT], [REAR]: [BALL[FRONT][0] - 70, 0] };
const XK = BALL[FRONT][0] + 225;                          // the kitten sits ahead of her toes
const KIT0 = [XK, 0];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k], L2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
// crouch amount over time (0 standing … 1 deep crouch) and the lean of the spine
const crouch = t => t < T_STOP ? 0 : t < 4.95 ? eio(seg(t, T_STEP - .05, 2.45)) : 1 - eio(seg(t, 4.95, 6.2));
function bodyAt(t) {
  if (t < T_STOP) return WALK.pose(t);
  const c = crouch(t), reach = ss(seg(t, 3.4, 3.95)) * (1 - ss(seg(t, 4.6, 5.0))), breath = Math.sin(t * 2.6) * 3 * seg(t, 6.2, 7);
  const us = seg(t, T_STOP, T_STEP), ue = eio(us), rearBall = [lerp(BALL[REAR][0], BALL2[REAR][0], ue), -46 * Math.sin(Math.PI * us)];
  const pel = [PEL0[0] + (BALL2[REAR][0] - BALL[REAR][0]) * .5 * ue + 45 * c + 38 * reach, PEL0[1] - 8 * Math.sin(Math.PI * us) + 160 * c + breath];
  return { pelvis: pel, tL: lerp(.04, .3, c) + .14 * reach, tU: lerp(.05, .55, c) + .42 * reach, neck: lerp(.02, .3, c) + .1 * ss(seg(t, 5.4, 6.4)), head: lerp(-.03, .78, c) + .45 * ss(seg(t, 5.4, 6.4)),
    legs: { [FRONT]: { ball: BALL[FRONT], pitch: .12 * c, planted: true }, [REAR]: { ball: us < 1 ? rearBall : BALL2[REAR], pitch: us < 1 ? .35 * Math.sin(Math.PI * us) : .5 * c, planted: us >= 1 } }, arms: { n: { sh: .1, el: .3, hand: 'relax' }, f: { sh: .1, el: .3, hand: 'relax' } } };
}
// hand targets (world) through the action, as eased keyframes (the first key of each path is where the hand already is)
const kf = (K, t) => { if (t <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (t < K[i][0]) return L2(K[i - 1][1], K[i][1], eio(seg(t, K[i - 1][0], K[i][0]))); return K[K.length - 1][1]; };
let GRIP0 = null, CARRY0 = null, SH0 = null;
function handsAt(t, J0) {
  if (t < 2.15) return { n: null, f: null };
  if (!GRIP0) { const Jg = solveProfile(bodyAt(2.45)); GRIP0 = stowShape(solveProfile(applyArms(bodyAt(2.45), 2.45, Jg, {})))[0]; const Jc = solveProfile(applyArms(bodyAt(2.6), 2.6, solveProfile(bodyAt(2.6)), {})); CARRY0 = Jc.arm.f.wr; SH0 = solveProfile(bodyAt(3.05)).sh.n; }
  const rest = solveProfile(applyArms(bodyAt(2.15), 2.15, solveProfile(bodyAt(2.15)), {})).arm.n.wr;
  const N_ = [[2.15, rest], [2.45, GRIP0], [2.95, add(SH0, [130, 30])], [3.5, [XK - 100, -230]], [4.05, [XK - 78, -96]], [4.4, [XK - 60, -6]], [4.85, [XK - 26, -6]]];
  const F_ = [[2.6, CARRY0], [2.95, add(SH0, [142, 255])], [3.5, [XK + 96, -230]], [4.05, [XK + 66, -96]], [4.4, [XK + 54, -6]], [4.85, [XK + 28, -6]]];
  let n = kf(N_, t), f = t >= 2.6 ? kf(F_, t) : null;
  if (t >= 4.85) { const chest = add(J0.neckBase, J0.uU, -150), front = add(chest, J0.fU, 95), u = eio(seg(t, 4.85, 6.2)), lift = [front[0] - 4, front[1] + 30];
    n = L2([XK - 26, -6], add(lift, [-24, 8]), u); f = L2([XK + 28, -6], add(lift, [28, 8]), u); }
  return { n, f };
}
const handRest = (J, k) => J.arm[k].wr;
const carryWrist = J => { const a = J.arm.f; return a.wr; };
// the far arm carries the jacket: upper arm a little forward, forearm level (until it lets go at 2.6 s)
function applyArms(S, t, J0, H) {
  if (t < 2.75) { const k = 1 - ss(seg(t, 2.6, 2.75)); S.arms.f = { sh: .28 * k + S.arms.f.sh * (1 - k), el: 1.3 * k + (S.arms.f.el || .3) * (1 - k), hand: 'grip', wr: .1 }; }
  if (H.n) S.arms.n = { tgt: H.n, bend: -1, hand: 'grip' };
  if (H.f && t >= 2.75) S.arms.f = { tgt: H.f, bend: -1, hand: 'grip' };
  return S;
}
// the kitten: sits, looks up; rides the hands from 4.8 s
function kittenAt(t) { return [XK, 0]; }
let KC = null;   // filled by the simulation record (the kitten's carried position)

// ═════════ the cloth: precomputed Verlet chains (jacket body + one sleeve), pinned only by the hands
const N = 22, LEN = 240, SEG = LEN / (N - 1), NS = 10, LS = 160, SEGS = LS / (NS - 1), HZ = 240, GRAV = 3600;
const FPS = 30, REC = [];
function stowShape(J) {   // folded over the far forearm: the collar half hangs on the inner side, the rest over and down the outer side
  const a = J.arm.f, el = a.el, wr = a.wr, mid = L2(el, wr, .55), u = [wr[0] - el[0], wr[1] - el[1]], l = Math.hypot(...u), fu = [u[0] / l, u[1] / l], nrm = [fu[1], -fu[0]];
  const top = add(mid, nrm, -16), pts = [];
  for (let i = 0; i < N; i++) { const s = i * SEG; let p;
    if (s < 110) p = add(add(top, fu, -14), [0, 110 - s]);                      // inner hanging half (collar end at the bottom)
    else if (s < 150) { const a2 = (s - 110) / 40 * Math.PI; p = add(top, [Math.cos(Math.PI + a2) * 14, -Math.sin(a2) * 18]); }
    else p = add(add(top, fu, 14), [0, s - 150]);                               // outer hanging half
    pts.push(p); }
  return pts;
}
function simulate() {
  const dt = 1 / HZ, steps = Math.round(DUR * HZ);
  let X = null, X0 = null, S = null, S0 = null, pinNear = 0, pinFar = 1, hemGrab = -1, kc = [...KIT0], kOff = null;
  const capsule = (p, a, b, r) => { const ab = [b[0] - a[0], b[1] - a[1]], L = ab[0] * ab[0] + ab[1] * ab[1] || 1, u = clamp(((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / L), c = [a[0] + ab[0] * u, a[1] + ab[1] * u], d = [p[0] - c[0], p[1] - c[1]], dl = Math.hypot(...d);
    if (dl < r && dl > 1e-6) { p[0] = c[0] + d[0] / dl * r; p[1] = c[1] + d[1] / dl * r; } };
  const ellipse = (p, c, rx, ry) => { const dx = (p[0] - c[0]) / rx, dy = (p[1] - c[1]) / ry, d = Math.hypot(dx, dy); if (d < 1 && d > 1e-6) { p[0] = c[0] + dx / d * rx; p[1] = c[1] + dy / d * ry; } };
  for (let k = 0; k <= steps; k++) {
    const t = k * dt, B0 = bodyAt(t), J0 = solveProfile(B0), Hn = handsAt(t, J0), J = solveProfile(applyArms(B0, t, J0, Hn));
    const st = stowShape(J), hand = kk => J.arm[kk].wr;
    // the kitten rides the hands once both are under it
    if (t >= 4.75) { const m = L2(hand('n'), hand('f'), .5), tgt = [m[0], m[1] - 4], u = ss(seg(t, 4.75, 4.95)); kc = L2(KIT0, tgt, u); }
    if (t < 2.45) { X = st.map(p => [...p]); X0 = st.map(p => [...p]); }
    else {
      for (let i = 0; i < N; i++) { const p = X[i], q = X0[i], vx = (p[0] - q[0]) * .985, vy = (p[1] - q[1]) * .985; X0[i] = [p[0], p[1]]; p[0] += vx; p[1] += vy + GRAV * dt * dt; }
      for (let it = 0; it < 24; it++) {
        // pins: the collar in the near hand (until 4.35), the collar's next point in the far hand (from 3.0), the near-side cloth after the re-grip
        X[0][0] = hand('n')[0]; X[0][1] = hand('n')[1];
        if (t >= 2.95) { if (hemGrab < 0) { let best = 1e9; for (let i = N - 6; i < N; i++) { const d = Math.hypot(X[i][0] - hand('f')[0], X[i][1] - hand('f')[1]); if (d < best) { best = d; hemGrab = i; } } }
          const s2 = ss(seg(t, 2.95, 3.05)); X[hemGrab][0] = lerp(X[hemGrab][0], hand('f')[0], s2); X[hemGrab][1] = lerp(X[hemGrab][1], hand('f')[1], s2); }
        for (let i = 0; i < N - 1; i++) { const a = X[i], b = X[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-6, df = (d - SEG) / d * .5;
          const pa = i === 0 || (i === hemGrab && t >= 3.05), pb = i + 1 === hemGrab && t >= 3.05;
          const wa = pa ? 0 : pb ? 1 : .5, wb = pb ? 0 : pa ? 1 : .5; a[0] += dx * df * 2 * wa; a[1] += dy * df * 2 * wa; b[0] -= dx * df * 2 * wb; b[1] -= dy * df * 2 * wb; }
        for (const p of X) {
          if (p[1] > -3) p[1] = -3;                                                     // the ground
          if (t < 2.9) capsule(p, J.arm.f.el, J.arm.f.wr, 15);                          // her forearm, until it is out from under the fold
          for (const k2 of ['n', 'f']) { capsule(p, J.leg[k2].hip, J.leg[k2].knee, 34); capsule(p, J.leg[k2].knee, J.leg[k2].ankle, 22); }
          if (t > 3.0) ellipse(p, [kc[0] - 4, kc[1] - 22], 32, 26);                     // the kitten (its body, with fur)
        }
      }
    }
    // the sleeve: hangs from the shoulder point of the jacket (chain index 3)
    if (!S) { S = Array.from({ length: NS }, (_, i) => [X[3][0] + 8, X[3][1] + i * SEGS * .4]); S0 = S.map(p => [...p]); }
    if (t < 2.45) { S = Array.from({ length: NS }, (_, i) => { const a = X[Math.min(N - 1, 3 + i * 2)]; return [a[0] + 5, a[1] - 3]; }); S0 = S.map(p => [...p]); }
    else { for (let i = 0; i < NS; i++) { const p = S[i], q = S0[i], vx = (p[0] - q[0]) * .985, vy = (p[1] - q[1]) * .985; S0[i] = [p[0], p[1]]; p[0] += vx; p[1] += vy + GRAV * dt * dt; }
      for (let it = 0; it < 16; it++) { S[0][0] = X[3][0] + 4; S[0][1] = X[3][1];
        for (let i = 0; i < NS - 1; i++) { const a = S[i], b = S[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-6, df = (d - SEGS) / d * .5, wa = i === 0 ? 0 : .5, wb = i === 0 ? 1 : .5; a[0] += dx * df * 2 * wa; a[1] += dy * df * 2 * wa; b[0] -= dx * df * 2 * wb; b[1] -= dy * df * 2 * wb; }
        for (const p of S) { if (p[1] > -3) p[1] = -3; if (t > 3.0) ellipse(p, [kc[0] - 4, kc[1] - 22], 32, 26); } } }
    if (k % (HZ / FPS) === 0) REC.push({ X: X.map(p => [...p]), S: S.map(p => [...p]), kc: [...kc] });
  }
}
simulate();
const recAt = t => REC[clamp(Math.round(t * FPS), 0, REC.length - 1)];

// ═════════ drawing: cartoon — flat colours, bold black outlines, rounded tube limbs (no stretching: the rig keeps every length),
// a big round head; our AKI and our kitten in a cartoon treatment; a flat night street with a warm lamp
const OUT = '#1a1420', COLS = { skin: '#ffd2b8', hair: '#4a2a5c', sweater: '#d9d2f2', sweaterD: '#a89ccc', trou: '#3d3d58', trouD: '#2a2a40', boot: '#8a5236', jacket: '#ef4b3a', jacketD: '#b52f2a', fur: '#9d9db0', furW: '#f2f0ee', eye: '#1a1420' };
const BGC = document.createElement('canvas'); BGC.width = W; BGC.height = H; { const b = BGC.getContext('2d'), r = mulberry(12);
  let gr = b.createLinearGradient(0, 0, 0, 800); gr.addColorStop(0, '#2b2f6e'); gr.addColorStop(1, '#5b4c9c'); b.fillStyle = gr; b.fillRect(0, 0, W, 800);
  b.fillStyle = '#fff6c8'; b.beginPath(); b.arc(1620, 170, 70, 0, TAU); b.fill();
  for (let i = 0; i < 9; i++) { const x = i * 230 - 40, w = 190, h = 260 + r() * 260; b.fillStyle = i % 2 ? '#3b3a78' : '#453f86'; b.strokeStyle = OUT; b.lineWidth = 6; b.beginPath(); b.roundRect(x, 800 - h, w, h + 20, 18); b.fill(); b.stroke();
    for (let k = 0; k < 8; k++) if (r() < .55) { b.fillStyle = r() < .5 ? '#ffd56e' : '#8fb0ff'; b.beginPath(); b.roundRect(x + 24 + (k % 3) * 52, 800 - h + 30 + Math.floor(k / 3) * 80, 34, 46, 8); b.fill(); b.stroke(); } }
  b.fillStyle = '#5a5a86'; b.fillRect(0, 800, W, H - 800); b.strokeStyle = OUT; b.lineWidth = 6; b.beginPath(); b.moveTo(0, 800); b.lineTo(W, 800); b.stroke();
  const lp = b.createRadialGradient(1260, 900, 0, 1260, 900, 420); lp.addColorStop(0, 'rgba(255,214,120,.45)'); lp.addColorStop(1, 'rgba(255,214,120,0)'); b.fillStyle = lp; b.fillRect(700, 800, 1200, 280); }
const SC = t => lerp(1.0, 1.38, eio(seg(t, .6, 2.5))) - .14 * eio(seg(t, 5.2, 6.6)), FOC = t => lerp(PEL0[0] - 200, XK - 170, ss(seg(t, 0, 2.4))), OY = 960;
// a tube with an outline (drawn as two passes of a thick round line: black, then colour)
function tube(pts, w, col) { for (const [lw, c] of [[w + 9, OUT], [w, col]]) { g.strokeStyle = c; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } }
function blob(x, y, rx, ry, col, rot = 0) { g.fillStyle = col; g.strokeStyle = OUT; g.lineWidth = 5; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); g.stroke(); }
function cartoonAki(J) {
  const L = J.leg.f, A = J.arm.f;
  tube([L.hip, L.knee, L.ankle], 40, COLS.trouD); blob(L.ankle[0] + 22, L.ankle[1] + 8, 34, 18, '#6a3e28', L.pitch);
  tube([A.sh, A.el, A.wr], 30, COLS.sweaterD); blob(A.wr[0], A.wr[1], 16, 14, '#e8b49c');
  tube([J.pelvis, J.waist], 74, COLS.trou); tube([J.waist, J.neckBase], 80, COLS.sweater);
  const Ln = J.leg.n; tube([Ln.hip, Ln.knee, Ln.ankle], 40, COLS.trou); blob(Ln.ankle[0] + 24 * Math.cos(Ln.pitch), Ln.ankle[1] + 8 + 24 * Math.sin(Ln.pitch), 34, 18, COLS.boot, Ln.pitch);
  const hc = J.headC, fa = J.headA, R = 62, fx = Math.cos(fa), fy = Math.sin(fa);
  tube([hc, [hc[0] - fx * 70 - 30, hc[1] + 30], [hc[0] - fx * 80 - 50, hc[1] + 80]], 22, COLS.hair);                // ponytail
  blob(hc[0], hc[1], R, R * 1.02, COLS.skin);
  g.fillStyle = COLS.hair; g.strokeStyle = OUT; g.lineWidth = 5; g.beginPath(); g.arc(hc[0] - fx * 14, hc[1] - 14, R + 2, Math.PI * 1.02 + fa, Math.PI * 1.92 + fa); g.quadraticCurveTo(hc[0] + fx * 10, hc[1] - 10, hc[0] - fx * 30, hc[1] + 6); g.closePath(); g.fill(); g.stroke();   // hair cap: crown and fringe only, the face stays open
  const ex = hc[0] + fx * 34 - fy * 4, ey = hc[1] + fy * 34 + 2; blob(ex, ey, 9, 14, '#ffffff'); g.fillStyle = COLS.eye; g.beginPath(); g.arc(ex + fx * 3, ey + 3 + fy * 4, 6, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,120,130,.45)'; g.beginPath(); g.ellipse(hc[0] + fx * 22, hc[1] + 30, 12, 7, 0, 0, TAU); g.fill();
}
function cartoonArmN(J) { const a = J.arm.n; tube([a.sh, a.el, a.wr], 30, COLS.sweater); blob(a.wr[0], a.wr[1], 17, 15, COLS.skin); }
function cartoonKitten(c, t, body = true, head = true) { const [x, y] = c, sh = Math.sin(t * 2 * Math.PI * 11) * (t < 5.6 ? 1.2 : .3);
  g.save(); g.translate(x + sh, y);
  if (body) { tube([[22, -14], [44, -24], [48, -44]], 9, COLS.fur); blob(-2, -22, 30, 22, COLS.fur); blob(-14, -16, 13, 12, COLS.furW); }
  if (head) { for (const s2 of [-1, 1]) { g.fillStyle = COLS.fur; g.strokeStyle = OUT; g.lineWidth = 4; g.beginPath(); g.moveTo(-14 + s2 * 12, -66); g.lineTo(-14 + s2 * 20, -88); g.lineTo(-14 + s2 * 2, -74); g.closePath(); g.fill(); g.stroke(); }
    blob(-14, -56, 24, 21, COLS.fur); for (const s2 of [-1, 1]) { blob(-14 + s2 * 9, -58, 6, 8, '#d8f08a'); g.fillStyle = OUT; g.beginPath(); g.arc(-14 + s2 * 9, -57, 3.2, 0, TAU); g.fill(); }
    g.fillStyle = '#ff9aa8'; g.beginPath(); g.arc(-14, -49, 3, 0, TAU); g.fill(); }
  g.restore(); }
function clothCartoon(pts, w) { tube(pts, w, COLS.jacket); g.strokeStyle = COLS.jacketD; g.lineWidth = w * .3; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1] + w * .25) : g.moveTo(p[0], p[1] + w * .25)); g.stroke(); }
window.render = t => {
  t = clamp(+t || 0, 0, DUR);
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(BGC, 0, 0);
  const R = recAt(t), B0 = bodyAt(t), J0 = solveProfile(B0), Hn = handsAt(t, J0), J = solveProfile(applyArms(B0, t, J0, Hn)), S_ = SC(t);
  g.save(); g.translate(960 - FOC(t) * S_, OY - 160 * (S_ - 1)); g.scale(S_, S_);
  g.fillStyle = 'rgba(20,16,40,.35)'; g.beginPath(); g.ellipse(J.pelvis[0] + 20, 6, 150, 16, 0, 0, TAU); g.fill();
  const kc = R.kc, wrapped = t > 4.0;
  if (!wrapped) cartoonKitten(kc, t);
  cartoonAki(J);
  if (wrapped) cartoonKitten(kc, t, true, false);
  clothCartoon(R.S, 16); clothCartoon(R.X, 24);
  if (wrapped) cartoonKitten(kc, t, false, true);
  cartoonArmN(J);
  g.restore();
  const rr = mulberry(Math.floor(t * 15)); g.strokeStyle = 'rgba(220,230,255,.35)'; g.lineWidth = 3; g.lineCap = 'round'; for (let i = 0; i < 50; i++) { const x = rr() * W, y = rr() * H * .8; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y + 26); g.stroke(); }
};
window.RIGQA = t => { const B0 = bodyAt(t), J0 = solveProfile(B0), J = solveProfile(applyArms(B0, t, J0, handsAt(t, J0))); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0); window.READY = true;
