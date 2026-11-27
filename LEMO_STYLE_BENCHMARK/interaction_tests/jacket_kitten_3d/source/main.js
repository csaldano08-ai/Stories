import * as THREE from 'three';
// Interaction test (separate from the 10 s benchmark clip): AKI wraps the kitten in her jacket — 3D (three.js, capsule rig, cloth sheet).
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

// ═════════ drawing: 3D — three.js, a wet night pavement under a lamp, AKI from rig capsules, the jacket as a cloth sheet
// (the simulated chain extruded 42 cm across her body, its edges sagging), our kitten built from simple forms
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, W / H, .05, 200); scene.background = new THREE.Color('#0d1022'); scene.fog = new THREE.Fog('#0d1022', 8, 30);
const UM = .0028, V = (x, y, z = 0) => new THREE.Vector3(x * UM, -y * UM, z);
scene.add(new THREE.HemisphereLight('#5a6aa8', '#1a1420', 1.0)); { const k = new THREE.DirectionalLight('#ffd2a0', 1.6); k.position.set(XK * UM + 2.5, 2.4, 3.2); k.target.position.set(XK * UM - .4, .4, 0); k.castShadow = true; k.shadow.mapSize.set(2048, 2048); k.shadow.bias = -.0005; Object.assign(k.shadow.camera, { left: -3, right: 3, top: 3, bottom: -1, near: .5, far: 12 }); scene.add(k, k.target); }   // the shop light from the front right
const lamp = new THREE.SpotLight('#ffc98a', 60, 14, .75, .5, 1.6); lamp.position.set((XK - 60) * UM, 4.2, -1.3); lamp.target.position.set(XK * UM, 0, 0); lamp.castShadow = true; lamp.shadow.mapSize.set(2048, 2048); lamp.shadow.bias = -.0004; scene.add(lamp, lamp.target);
const rimL = new THREE.DirectionalLight('#7fa0ff', .9); rimL.position.set(-3, 2.5, -3); scene.add(rimL);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 30).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#232636', roughness: .28, metalness: .15 })); ground.receiveShadow = true; scene.add(ground);
const R0 = mulberry(9); for (let i = 0; i < 14; i++) { const w = 2 + R0() * 2.5, h = 4 + R0() * 6, b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2).translate(0, h / 2, 0), new THREE.MeshStandardMaterial({ color: '#1b1f38', roughness: .9, emissive: '#000' })); b.position.set(-12 + i * 2.9, 0, -7.5); scene.add(b);
  for (let k = 0; k < 10; k++) if (R0() < .5) { const wnd = new THREE.Mesh(new THREE.PlaneGeometry(.35, .5), new THREE.MeshBasicMaterial({ color: R0() < .4 ? '#ffcf8a' : '#6f8ad8' })); wnd.position.set(b.position.x - w / 2 + .5 + (k % 4) * (w - 1) / 3, 1 + Math.floor(k / 4) * 1.3, -6.49); scene.add(wnd); } }
{ const post = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 4.2, 10).translate(0, 2.1, 0), new THREE.MeshStandardMaterial({ color: '#202228', metalness: .6, roughness: .4 })); post.position.set((XK - 60) * UM, 0, -1.3); scene.add(post);
  const head_ = new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 10), new THREE.MeshBasicMaterial({ color: '#ffe2b0' })); head_.position.set((XK - 60) * UM, 4.25, -1.3); scene.add(head_); }
const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: .7 }), MT = { sweater: M('#c9c3e0'), sweaterF: M('#9d97b8'), trou: M('#2f3044'), boot: M('#6b4430'), skin: M('#e9bfa6'), hair: M('#2f1d3a'), jacket: new THREE.MeshStandardMaterial({ color: '#c8402a', roughness: .85, side: THREE.DoubleSide }), lining: M('#7a1f2a'), fur: M('#8c8c9c'), furW: M('#e8e6e4'), eye: new THREE.MeshStandardMaterial({ color: '#1a1a12', roughness: .15 }) };
const akiG = new THREE.Group(); scene.add(akiG);
const uCyl = new THREE.CylinderGeometry(1, 1, 1, 12), uSph = new THREE.SphereGeometry(1, 16, 12); const pool = []; let pi = 0;
const pm = (geo, mt) => { let m = pool[pi]; if (!m) { m = new THREE.Mesh(geo, mt); m.castShadow = true; akiG.add(m); pool.push(m); } m.geometry = geo; m.material = mt; m.visible = true; pi++; return m; };
const bone = (a, b, r, mt) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(), m = pm(uCyl, mt); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.scale.set(r, L, r); };
const ball = (p, r, mt, sx = 1, sy = 1, sz = 1) => { const m = pm(uSph, mt); m.position.copy(p); m.scale.set(r * sx, r * sy, r * sz); m.quaternion.identity(); };
function buildAki(J) {
  pool.forEach(m => m.visible = false); pi = 0;
  for (const [k, z, mt] of [['f', -.1, MT.trou], ['n', .1, MT.trou]]) { const l = J.leg[k]; bone(V(...l.hip, z), V(...l.knee, z), .075, mt); bone(V(...l.knee, z), V(...l.ankle, z), .058, mt); ball(V(...l.knee, z), .068, mt);
    bone(V(...l.ankle, z), V(l.ankle[0] + 70 * Math.cos(l.pitch), l.ankle[1] + 70 * Math.sin(l.pitch), z), .055, MT.boot); }
  bone(V(...J.pelvis), V(...J.waist), .15, MT.trou); bone(V(...J.waist), V(...J.neckBase), .155, MT.sweater); ball(V(...J.waist), .155, MT.sweater, 1, .7, 1); ball(V(...J.neckBase), .13, MT.sweater, 1.2, .8, 1);
  for (const [k, z, mt] of [['f', -.19, MT.sweaterF], ['n', .19, MT.sweater]]) { const a = J.arm[k]; bone(V(...a.sh, z), V(...a.el, z), .05, mt); bone(V(...a.el, z), V(...a.wr, z), .043, mt); ball(V(...a.wr, z), .05, MT.skin, 1, 1.2, .7); }
  const hc = V(...J.headC); ball(hc, .115, MT.skin, 1, 1.1, .95); ball(hc.clone().add(new THREE.Vector3(-.03, .04, 0)), .125, MT.hair, 1, .85, 1.02);
  bone(hc.clone().add(new THREE.Vector3(-.09, .05, 0)), V(J.headC[0] - Math.cos(J.headA) * 95, J.headC[1] - 10), .035, MT.hair);
}
// the cloth sheet: the chain × a 42 cm width; the side edges sag (2 cm) where the chain hangs; a lining colour on the back faces
const CW = .42, NXs = 6;
function sheet(n, zc, wd) { const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * NXs * 3), idx = []; for (let i = 0; i < n - 1; i++) for (let j = 0; j < NXs - 1; j++) { const a = i * NXs + j, b = a + 1, c = a + NXs, d = c + 1; idx.push(a, c, b, b, c, d); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx); const m = new THREE.Mesh(geo, MT.jacket); m.castShadow = m.receiveShadow = true; scene.add(m); return { m, geo, n, zc, wd }; }
const SH1 = sheet(N, 0, CW), SH2 = sheet(NS, .2, .16);
function updSheet(Sx, pts) { const p = Sx.geo.attributes.position.array; for (let i = 0; i < Sx.n; i++) for (let j = 0; j < NXs; j++) { const u = j / (NXs - 1) - .5, sag = (u * u * 4) * .02 * (1 - Math.abs(Math.sin(i * .3)) * .3), q = V(pts[i][0], pts[i][1]); p.set([q.x, q.y + sag, Sx.zc + u * Sx.wd], (i * NXs + j) * 3); }
  Sx.geo.attributes.position.needsUpdate = true; Sx.geo.computeVertexNormals(); Sx.geo.computeBoundingSphere(); }
// our kitten in 3D: a loaf body, a round head, cone ears, a white bib, amber-green eyes, a curled tail
const kit = new THREE.Group(); scene.add(kit); { const add = (geo, mt, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; kit.add(m); return m; };
  add(uSph, MT.fur, 0, .055, 0, .085, .06, .065); add(uSph, MT.furW, .05, .05, 0, .04, .045, .045); const hd = add(uSph, MT.fur, .07, .12, 0, .052, .048, .05);
  for (const z of [-.028, .028]) { const e = add(new THREE.ConeGeometry(.018, .04, 8), MT.fur, .07, .175, z); e.rotation.x = z * 4; add(uSph, new THREE.MeshStandardMaterial({ color: '#b8e070', roughness: .1, emissive: '#2a3a10' }), .118, .127, z * .8, .009, .011, .006); }
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.08, .04, 0), new THREE.Vector3(-.13, .05, .03), new THREE.Vector3(-.14, .1, .05), new THREE.Vector3(-.11, .13, .04)]), 16, .012, 6), MT.fur, 0, 0, 0); }
window.render = t => {
  t = clamp(+t || 0, 0, DUR);
  const R = recAt(t), B0 = bodyAt(t), J0 = solveProfile(B0), Hn = handsAt(t, J0), J = solveProfile(applyArms(B0, t, J0, Hn));
  buildAki(J); updSheet(SH1, R.X); updSheet(SH2, R.S);
  const kc = V(R.kc[0], R.kc[1]); kit.position.set(kc.x - .01, kc.y, 0); kit.rotation.y = -.35; kit.position.x += Math.sin(t * 2 * Math.PI * 11) * .002 * (t < 5.6 ? 1 : .3);
  const fx = lerp(lerp(PEL0[0] - 120, XK - 130, ss(seg(t, 0, 2.4))), B0.pelvis[0] + 90, eio(seg(t, 5.0, 6.4))) * UM, zoom = eio(seg(t, .6, 2.5)) - .5 * eio(seg(t, 5.2, 6.6));
  const cr = crouch(t); cam.position.set(fx + .9, lerp(1.3, .95, cr), lerp(4.9, 3.0, cr)); cam.lookAt(fx + .35, lerp(.92, .5, cr), 0);   // the framing follows how low she is: never crops her head cam.updateProjectionMatrix();
  renderer.render(scene, cam);
};
window.RIGQA = t => { const B0 = bodyAt(t), J0 = solveProfile(B0), J = solveProfile(applyArms(B0, t, J0, handsAt(t, J0))); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0); window.READY = true;
