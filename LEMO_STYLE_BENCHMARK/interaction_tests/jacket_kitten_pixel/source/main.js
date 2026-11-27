// Interaction test (separate from the 10 s benchmark clip): AKI wraps the kitten in her jacket — native pixel art (320×180, 6× nearest).
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

// ═════════ drawing: native pixel art — everything is rasterised straight onto a 320×180 grid (hard pixels, a fixed 16-colour
// palette, ordered dithering for gradients), then scaled ×6 with nearest neighbour. Nothing is drawn at 1080p and reduced.
const PW = 320, PH = 180, PX = new Uint8Array(PW * PH);
const PALX = ['#0b0b1a', '#1a1c3a', '#2b2f5c', '#454d86', '#7b86c2', '#c9cff0', '#ffe6a8', '#f2b34c', '#e3432f', '#9e2433', '#f6c0a0', '#b77a5e', '#3b2547', '#6a4a78', '#8a8aa0', '#ffffff'];
const RGB = PALX.map(h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16)));
const C_ = { night: 0, sky: 1, sky2: 2, wall: 1, win: 6, winB: 4, road: 2, road2: 3, lamp: 6, lampH: 7, red: 8, redD: 9, skin: 10, skinD: 11, hair: 12, sweater: 5, sweaterD: 4, trou: 1, boot: 11, ink: 0, fur: 14, furD: 13, white: 15, rain: 4 };
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const pset = (x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < PW && y < PH) PX[y * PW + x] = c; };
const dith = (x, y, a, b, k) => (k * 16 > BAY[(y & 3) * 4 + (x & 3)] ? b : a);
function disc(cx, cy, r, c) { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x + .5 - cx) ** 2 + (y + .5 - cy) ** 2 <= r * r) pset(x, y, c); }
function line(a, b, w, c) { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2) + 1; for (let i = 0; i <= n; i++) { const u = i / n, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u; if (w <= 1) pset(Math.round(x), Math.round(y), c); else disc(x, y, w / 2, c); } }
const out = document.createElement('canvas'); out.width = PW; out.height = PH; const og = out.getContext('2d'), img = og.createImageData(PW, PH);
// the backdrop, rasterised once (a dithered night sky, blocks with lit windows, a lamp, the wet pavement)
const BGP = new Uint8Array(PW * PH); { const r = mulberry(3);
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) BGP[y * PW + x] = y < 120 ? dith(x, y, C_.night, C_.sky, y / 120) : dith(x, y, C_.road2, C_.road, (y - 120) / 60);
  let bx = -4; while (bx < PW) { const w = 26 + (r() * 22 | 0), h = 40 + (r() * 50 | 0); for (let y = 120 - h; y < 120; y++) for (let x = bx; x < bx + w; x++) if (x >= 0 && x < PW) BGP[y * PW + x] = C_.sky2;
    for (let wy = 120 - h + 5; wy < 114; wy += 8) for (let wx = bx + 3; wx < bx + w - 4; wx += 6) if (r() < .45) for (let y = wy; y < wy + 4; y++) for (let x = wx; x < wx + 3; x++) if (x >= 0 && x < PW) BGP[y * PW + x] = r() < .3 ? C_.win : C_.winB;
    bx += w + 2; }
  for (let y = 120; y < PH; y++) for (let x = 0; x < PW; x++) { const d = Math.hypot((x - 238) / 70, (y - 128) / 12); if (d < 1) BGP[y * PW + x] = dith(x, y, BGP[y * PW + x], C_.lampH, (1 - d) * .55); }   // the lamp's pool
  for (let y = 40; y < 120; y++) { BGP[y * PW + 256] = C_.ink; BGP[y * PW + 257] = C_.ink; } for (let x = 240; x < 258; x++) BGP[40 * PW + x] = C_.ink;
  for (let y = 36; y < 56; y++) for (let x = 226; x < 256; x++) { const d = Math.hypot((x - 241) / 15, (y - 43) / 10); if (d < 1) BGP[y * PW + x] = dith(x, y, BGP[y * PW + x], C_.lamp, (1 - d) * 1.3); }
  for (let x = 0; x < PW; x++) BGP[120 * PW + x] = C_.road2; }
const SC = t => lerp(.14, .235, eio(seg(t, .6, 2.5))) - .035 * eio(seg(t, 5.2, 6.6)), FOC = t => lerp(PEL0[0] - 200, XK - 170, ss(seg(t, 0, 2.4))), GY = 150;
window.render = t => {
  t = clamp(+t || 0, 0, DUR);
  PX.set(BGP);
  const R = recAt(t), B0 = bodyAt(t), J0 = solveProfile(B0), Hn = handsAt(t, J0), J = solveProfile(applyArms(B0, t, J0, Hn)), s = SC(t), fx = FOC(t);
  const T = p => [150 + (p[0] - fx) * s, GY + p[1] * s];   // world → pixel grid
  const kc = R.kc, wrapped = t > 4.0;
  const kitten = (body, head) => { const [x, y] = T(kc), sh = (Math.floor(t * 12) % 2) * (t < 5.6 ? 1 : 0), k = s / .15;
    if (body) { for (let yy = -5; yy <= 0; yy++) for (let xx = -4; xx <= 4; xx++) if ((xx / 4.5) ** 2 + ((yy + 2.5) / 3.2) ** 2 <= 1) pset(x + xx * k + sh, y + yy * k - 1, (xx + yy) % 3 ? C_.fur : C_.furD); line([x + 4 * k, y - 1], [x + 7 * k, y - 4 * k], 1, C_.furD); }
    if (head) { const hx = x - 2 * k + sh, hy = y - 7 * k; disc(hx, hy, 2.6 * k, C_.fur); pset(hx - 2 * k, hy - 3 * k, C_.fur); pset(hx + 1.5 * k, hy - 3 * k, C_.fur); pset(hx - 1 * k, hy, C_.ink); pset(hx + 1 * k, hy, C_.ink); } };
  if (!wrapped) kitten(true, true);
  // AKI from the rig: far limbs one shade darker, near limbs on top; 2–3 px thick at this scale
  const w = Math.max(2, Math.round(s * 22));
  { const l = J.leg.f; line(T(l.hip), T(l.knee), w, C_.trou); line(T(l.knee), T(l.ankle), w - 1, C_.trou); line(T(l.ankle), T([l.ankle[0] + 40, l.ankle[1]]), w - 1, C_.boot);
    const a = J.arm.f; line(T(a.sh), T(a.el), w - 1, C_.sweaterD); line(T(a.el), T(a.wr), w - 1, C_.sweaterD); disc(...T(a.wr), w / 2, C_.skinD); }
  line(T(J.pelvis), T(J.waist), w + 2, C_.trou); line(T(J.waist), T(J.neckBase), w + 3, C_.sweater);
  { const l = J.leg.n; line(T(l.hip), T(l.knee), w, C_.trou); line(T(l.knee), T(l.ankle), w - 1, C_.trou); line(T(l.ankle), T([l.ankle[0] + 40 * Math.cos(l.pitch), l.ankle[1] + 40 * Math.sin(l.pitch)]), w - 1, C_.boot); }
  { const hc = T(J.headC), r = Math.max(3, s * 42), fa = J.headA; disc(hc[0], hc[1], r, C_.skin); for (let a = Math.PI * .55; a < Math.PI * 1.9; a += .05) disc(hc[0] + Math.cos(a + fa) * r * .55, hc[1] - Math.abs(Math.sin(a)) * r * .5, r * .55, C_.hair);
    line([hc[0] - r * .8, hc[1] - r * .3], [hc[0] - r * 1.9, hc[1] + r * .9], Math.max(2, w - 1), C_.hair); pset(hc[0] + Math.cos(fa) * r * .55, hc[1] + Math.sin(fa) * r * .5 - 1, C_.ink); }
  if (wrapped) kitten(true, false);
  // the jacket (the simulated cloth): red, a darker underside row, a highlight row; the sleeve one pixel thinner
  const cloth = (pts, cw) => { for (let i = 0; i < pts.length - 1; i++) { line(T(pts[i]), T(pts[i + 1]), cw, C_.red); } for (let i = 0; i < pts.length - 1; i++) { const a = T(pts[i]), b = T(pts[i + 1]); line([a[0], a[1] + cw / 2 - .5], [b[0], b[1] + cw / 2 - .5], 1, C_.redD); line([a[0], a[1] - cw / 2 + .5], [b[0], b[1] - cw / 2 + .5], 1, C_.lampH); } };
  cloth(R.S, Math.max(2, w - 1)); cloth(R.X, w + 1);
  if (wrapped) kitten(false, true);
  { const a = J.arm.n; line(T(a.sh), T(a.el), w - 1, C_.sweater); line(T(a.el), T(a.wr), w - 1, C_.sweater); disc(...T(a.wr), w / 2 + .5, C_.skin); }
  // rain: one-pixel streaks on twos
  const rr = mulberry(Math.floor(t * 15)); for (let i = 0; i < 60; i++) { const x = rr() * PW | 0, y = rr() * 140 | 0; pset(x, y, C_.rain); pset(x - 1, y + 2, C_.rain); }
  for (let i = 0; i < PW * PH; i++) { const c = RGB[PX[i]]; img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255; }
  og.putImageData(img, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(out, 0, 0, W, H);
};
window.RIGQA = t => { const B0 = bodyAt(t), J0 = solveProfile(B0), J = solveProfile(applyArms(B0, t, J0, handsAt(t, J0))); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0); window.READY = true;
