// 078 · 1-bit Dither — the first 10 s of "Last Train Home" in exactly two inks (lemo-opuscar styles/one-bit-dither).
// A real 3D world through the library's 1-bit pipeline (pipe.js: shading → surface-anchored Bayer threshold → outlines from depth and
// normal breaks, 960×540 scaled up nearest). Ink #15141a, paper #e8e3d3; no grey on screen. AKI is built in 3D from the shared rig
// every frame (bones as rods, constant lengths, joint limits, a planted foot); her coat is the lightest mass, the night sky solid ink.
//   S1  low glide beside her, centimetres above the pavement: the puddle with a lamp's reflection slides in; at 0.94 s her foot strikes
//       it: a white crown of droplets (emissive, no outline) and rings
//   S2  the camera cranes up and tracks her past shopfronts (printed signs) through the pools of the street lamps; her long shadow
//       swings as she passes each lamp; at 6.05 s she raises her wrist
//   S3  hard cut on the beat: macro locked to the watch dial (printed paper), hands throwing hard shadows; the second hand steps
//       to 48 at 8.4 s
//   S4  block dissolve (32 px cells, both pictures still) to the tower clock face in the same place; exponential pull-back up the tower,
//       a rim in the dark; on the chime (9.58 s) an inversion strike
// Page contract: window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { Pipe, Present, RW, RH, L_FLAT, L_SCREEN } from './pipe.js';
import { V, grey, glow, add, box, cyl, rod, canvasTex, printMat } from './kit.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const INK = '#15141a', PAPER = '#e8e3d3';
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(1920, 1080, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
const pipe = new Pipe(renderer), present = new Present(renderer, INK, PAPER), rtA = pipe.target(), rtB = pipe.target();
await Promise.all(['900 40px Archivo', '700 40px OldStd'].map(f => document.fonts.load(f, 'AB09')));

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
  const dt = 1 / 240, n = Math.ceil(11 / dt), tail = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const th = [-.2, -.1, 0], vt = [0, 0, 0], py = t => RUN.pelvisAt(t)[1], ay = t => (py(t + dt) - 2 * py(t) + py(t - dt)) / (dt * dt);
  for (let i = 0; i < n; i++) { const t = -.5 + i * dt, A = ay(t);
    for (let k = 0; k < 3; k++) { const par = k ? th[k - 1] : -.1, rest = .16 + .05 * k; vt[k] += (-60 * (th[k] - (par + rest)) - 6 * vt[k] + .014 * A * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; } }
  return { tail: t => tail.map(a => a[clamp(Math.round((t + .5) / dt), 0, n - 1)]) };
})();
const W_T = t => 11 * 3600 + 58 * 60 + 48 + (t - 8.4);
const UM = .0028, X0 = X(0), P3 = (p, z = 0) => V((p[0] - X0) * UM, -p[1] * UM, z), herX = t => (X(t) - X0) * UM, SPX = (SPL.x + 44 - X0) * UM;

// ═════════ printed signs and dials (ink 0 / paper 1 at a fixed pitch, read crisp when magnified)
function signTex(word, w = 1024, h = 256) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#000'; g.fillRect(10, 10, w - 20, h - 20); g.fillStyle = '#fff'; g.fillRect(26, 26, w - 52, h - 52);
  g.fillStyle = '#000'; g.font = '900 150px Archivo'; g.textAlign = 'center'; g.textBaseline = 'middle'; const m = g.measureText(word).width; if (m > w - 120) g.font = `900 ${Math.floor(150 * (w - 120) / m)}px Archivo`; g.fillText(word, w / 2, h / 2 + 8);
  return canvasTex(c); }
function dialTex(roman, size = 1024) { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), R = size / 2;
  g.fillStyle = '#fff'; g.fillRect(0, 0, size, size); g.strokeStyle = '#000'; g.lineWidth = size * .018; g.beginPath(); g.arc(R, R, R * .97, 0, 7); g.stroke(); g.lineWidth = size * .006; g.beginPath(); g.arc(R, R, R * .9, 0, 7); g.stroke();
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, big = i % 5 === 0, r0 = R * (big ? .78 : .84); g.lineWidth = size * (big ? .02 : .008); g.beginPath(); g.moveTo(R + Math.sin(a) * r0, R - Math.cos(a) * r0); g.lineTo(R + Math.sin(a) * R * .9, R - Math.cos(a) * R * .9); g.stroke(); }
  g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${size * .1}px OldStd`;
  const N = roman ? ['XII', 'III', 'VI', 'IX'] : ['12', '3', '6', '9']; N.forEach((s, i) => { const a = i / 4 * Math.PI * 2; g.fillText(s, R + Math.sin(a) * R * .6, R - Math.cos(a) * R * .6 + size * .006); });
  return canvasTex(c); }

// ═════════ SET 1: the street at night
function buildStreet() {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(42, 16 / 9, .03, 400);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 12), glow(0)); sky.material.side = THREE.BackSide; sky.layers.set(L_FLAT); scene.add(sky);
  { const r = mulberry(7), g = new THREE.BufferGeometry(), pos = []; for (let i = 0; i < 160; i++) { const a = r() * Math.PI * 2, e = .25 + r() * .9; pos.push(Math.cos(a) * Math.cos(e) * 280, Math.sin(e) * 280, Math.sin(a) * Math.cos(e) * 280); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); const st = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false })); st.layers.set(L_FLAT); scene.add(st); }
  const pave = add(scene, new THREE.PlaneGeometry(90, 6).rotateX(-Math.PI / 2), grey(.3), { cast: false }); pave.position.set(20, 0, -.5); pave.layers.set(L_SCREEN);
  const road = add(scene, new THREE.PlaneGeometry(90, 14).rotateX(-Math.PI / 2), grey(.1), { cast: false }); road.position.set(20, -.12, 9.3); road.layers.set(L_SCREEN);
  box(scene, 90, .14, .22, 20, -.05, 2.4, grey(.55));                      // the kerb
  for (let x = -12; x < 64; x += 1.6) box(scene, .02, .004, 5.4, x, .002, -.4, grey(.2), { cast: false });   // paving joints: thick, few
  // shopfronts with printed signs and lit windows (emissive, no outline)
  const NAMES = ['HOTEL', 'BAR', 'PHARMACY', 'BOOKS', 'NOODLES', 'RECORDS', 'BAKERY', 'LAUNDRY', 'FLOWERS', 'TAILOR', 'KIOSK', 'CAFE', 'HOTEL'];
  NAMES.forEach((nm, i) => { const x = -10 + i * 6.4, fa = new THREE.Group(); fa.position.set(x, 0, -3.3); scene.add(fa);
    box(fa, 6.2, 5.2, .5, 0, 2.6, -.25, grey(.28)); box(fa, .3, 5.2, .7, -3.1, 2.6, -.1, grey(.3));
    const lit = hash(i * 3.7) > .25; box(fa, 3.2, 1.9, .06, -.9, 1.45, .05, lit ? glow(1.4) : grey(.06), { cast: false, flat: lit }); box(fa, 1.1, 2.4, .1, 1.95, 1.2, .02, grey(.08));
    for (const k of [0, 1]) box(fa, 1.2, 1, .06, -1.5 + k * 2.4, 3.95, .05, hash(i * 7 + k) > .55 ? glow(1.2) : grey(.07), { cast: false, flat: true });
    const s = add(fa, new THREE.PlaneGeometry(3.4, .85), new THREE.MeshBasicMaterial({ map: signTex(nm), color: new THREE.Color(1.3, 1.3, 1.3) }), { cast: false, flat: true }); s.position.set(-.4, 2.5, .12); });   // light-box signs: black letters on a lit panel
  // street lamps: poles, heads, glows; the three nearest cast hard shadows
  const LAMPS = []; for (let x = -4; x < 60; x += 9) { rod(scene, V(x, 0, 1.9), V(x, 4.6, 1.9), .06, grey(.2), 8); rod(scene, V(x, 4.6, 1.9), V(x, 4.6, 1.1), .05, grey(.2), 8); box(scene, .5, .16, .3, x, 4.55, 1.05, grey(.15));
    const gl = add(scene, new THREE.SphereGeometry(.13, 12, 8), glow(2), { cast: false, flat: true }); gl.position.set(x, 4.42, 1.05); LAMPS.push(x); }
  const SPOTS = [0, 1, 2].map(() => { const L = new THREE.SpotLight(0xffffff, 0, 16, .78, .5, 1.2); L.castShadow = true; L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -.0006; L.shadow.normalBias = .02; scene.add(L, L.target); return L; });
  scene.add(new THREE.AmbientLight(0xffffff, .05));
  // the puddle: a dark sheet a few millimetres proud of the pavement, a lamp's reflection in it
  const pud = add(scene, new THREE.CylinderGeometry(1, 1, .006, 40), grey(.04, { r: .2 }), { cast: false }); pud.scale.set(.95, 1, .5); pud.position.set(SPX, .003, -.05);
  const refl = add(scene, new THREE.CircleGeometry(1, 24).rotateX(-Math.PI / 2), glow(1.6), { cast: false, flat: true }); refl.scale.set(.32, 1, .1); refl.position.set(SPX + .25, .0075, -.12);
  const rings = [0, 1, 2].map(() => { const m = add(scene, new THREE.TorusGeometry(1, .012, 4, 48).rotateX(Math.PI / 2), glow(1.8), { cast: false, flat: true }); m.visible = false; return m; });
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), glow(1.8), 26); drops.layers.set(L_FLAT); drops.frustumCulled = false; scene.add(drops);
  // AKI: rods and spheres placed from the rig every frame (light coat: the lightest mass in the frame)
  const M = { coat: grey(.86), coatF: grey(.62), leg: grey(.13), legF: grey(.09), shoe: grey(.05), skin: grey(.78), hair: grey(.05) };
  const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 10), unitSph = new THREE.SphereGeometry(1, 14, 10), cone = new THREE.CylinderGeometry(1, 1, 1, 14);
  const pool = []; let pi = 0; const mesh = (geo, mat) => { let m = pool[pi]; if (!m) { m = add(scene, geo, mat); pool.push(m); } m.geometry = geo; m.material = mat; m.visible = true; pi++; return m; };
  const bone = (a, b, r, mat, r2 = r) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(), m = mesh(r2 === r ? unitCyl : cone, mat); if (r2 !== r) { m.geometry = new THREE.CylinderGeometry(r2, r, 1, 14); }
    m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); m.scale.set(r2 === r ? r : 1, L, r2 === r ? r : 1); };
  const ball = (p, r, mat) => { const m = mesh(unitSph, mat); m.position.copy(p); m.scale.setScalar(r); m.quaternion.identity(); };
  const coatGeo = new THREE.CylinderGeometry(.115, .205, 1, 16, 1);
  function poseAki(t) {
    pool.forEach(m => m.visible = false); pi = 0;
    const J = solveProfile(poseAt(t));
    for (const [k, z, mt, ms] of [['f', -.09, M.legF, M.coatF], ['n', .09, M.leg, M.coat]]) {
      const l = J.leg[k], c = Math.cos(l.pitch), s = Math.sin(l.pitch), toe = [l.ankle[0] + 70 * c, l.ankle[1] + 70 * s];
      bone(P3(l.hip, z), P3(l.knee, z), .062, mt); bone(P3(l.knee, z), P3(l.ankle, z), .046, mt); ball(P3(l.knee, z), .052, mt);
      bone(P3(l.ankle, z), P3(toe, z), .042, M.shoe); ball(P3(l.ankle, z), .045, M.shoe); }
    for (const [k, z, mt] of [['f', -.17, M.coatF], ['n', .17, M.coat]]) { const a = J.arm[k], hand = [a.wr[0] + (a.wr[0] - a.el[0]) * .25, a.wr[1] + (a.wr[1] - a.el[1]) * .25];
      bone(P3(a.sh, z), P3(a.el, z), .042, mt); ball(P3(a.el, z), .04, mt); bone(P3(a.el, z), P3(a.wr, z), .034, mt); bone(P3(a.wr, z), P3(hand, z), .028, M.skin); }
    const TT = (b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f], hemC = TT(J.pelvis, -98, -4), neck = P3(J.neckBase), hem = P3(hemC);
    { const d = new THREE.Vector3().subVectors(neck, hem), L = d.length(), m = mesh(coatGeo, M.coat); m.position.copy(hem).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); m.scale.set(1, L, .82); }
    bone(P3(J.neckBase), P3(J.neckTop), .045, M.skin);
    const hc = P3(J.headC), ca = Math.cos(J.headA), sa = Math.sin(J.headA); ball(hc, .118, M.skin);
    { const m = mesh(unitSph, M.hair); m.position.copy(hc).add(V(-ca * .03, .025, 0)); m.scale.set(.122, .118, .126); m.quaternion.identity(); }
    const ta = SIM.tail(t); let an = Math.PI - .25 + ta[0] + J.headA, p = [J.headC[0] - Math.cos(J.headA) * 50, J.headC[1] - Math.sin(J.headA) * 50 - 10]; let prev = P3(p);
    for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i]; p = [p[0] + Math.cos(an) * Lk, p[1] + Math.sin(an) * Lk]; const q = P3(p); bone(prev, q, [.04, .034, .026][i], M.hair); prev = q; an += ta[(i + 1) % 3] * .6 - ta[i] * .3; }
    const a = J.arm.n, wp = [a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84], w = P3(wp, .17), dd = new THREE.Vector3().subVectors(P3(a.wr, .17), P3(a.el, .17)).normalize();
    bone(w.clone().addScaledVector(dd, -.014), w.clone().addScaledVector(dd, .014), .04, J.S.watch > .3 ? glow(1.5) : M.shoe);
  }
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
  const lerpV = (a, b, u) => a.clone().lerp(b, u);
  function update(t) {
    poseAki(t);
    const hx = herX(t);
    // the three lamps around her cast shadows; their intensity fades with distance so nothing pops as the trio moves on
    const k = Math.floor((hx + 4) / 9); SPOTS.forEach((L, i) => { const lx = LAMPS[clamp(k - 1 + i, 0, LAMPS.length - 1)]; L.position.set(lx, 4.42, 1.05); L.target.position.set(lx, 0, .2);
      L.intensity = 42 * ss(1 - clamp((Math.abs(lx - hx) - 7) / 7)); });
    // the splash
    const a = t - SPL.t0; rings.forEach((r, i) => { const u = (a - i * .12) / .8; r.visible = a > 0 && u > 0 && u < 1; if (r.visible) { r.position.set(SPX + .05, .01, -.05); r.scale.set(.12 + .9 * eo(u), 1, .07 + .5 * eo(u)); } });
    refl.visible = !(a > 0 && a < .5);
    for (let i = 0; i < 26; i++) { let s = 0; if (a > 0 && a < .75) { const th = hash(i) * Math.PI * 2, sp = .5 + hash(i * 3.3) * .9, vy = 1.6 + hash(i * 7.7) * 1.6, y = vy * a - 4.9 * a * a; if (y > 0) { s = .016 + hash(i * 5.1) * .012; p4.set(SPX + Math.cos(th) * sp * a, y, -.09 + Math.sin(th) * sp * .6 * a); } }
      s4.setScalar(s); m4.compose(p4, q4, s4); drops.setMatrixAt(i, m4); } drops.instanceMatrix.needsUpdate = true;
    // camera: S1 low glide beside her (centimetres above the pavement), then a crane up into a tracking shot; velocity stays continuous
    const low = { p: V(hx - .25, .2, 1.55), tg: V(hx + .35, .32, 0) }, high = { p: V(hx + .9, 1.35, 4.9), tg: V(hx + .55, .92, -.2) };
    const u = eio(seg(t, 2.15, 3.35)), cp = lerpV(low.p, high.p, u), ct = lerpV(low.tg, high.tg, u); cp.x += .25 * Math.sin(t * .6) * u;
    camera.position.copy(cp); camera.lookAt(ct); camera.fov = lerp(48, 40, u); camera.updateProjectionMatrix();
    return { lo: .1, hi: .8, exp: 1.0, edgeK: .04, lineLum: .32 };
  }
  return { scene, camera, update };
}

// ═════════ SET 2: the watch, macro (dial printed paper, hands throwing hard shadows from a low key)
function buildWatch() {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 16 / 9, .005, 20);
  const bg = add(scene, new THREE.PlaneGeometry(4, 4), grey(.08), { cast: false }); bg.position.z = -.05; bg.layers.set(L_SCREEN);
  const sleeve = add(scene, new THREE.CylinderGeometry(.085, .09, .6, 24).rotateZ(Math.PI / 2), grey(.86)); sleeve.position.set(-.42, 0, -.07);
  const wrist = add(scene, new THREE.CylinderGeometry(.06, .07, .8, 24).rotateZ(Math.PI / 2), grey(.7)); wrist.position.set(0, 0, -.07);
  box(scene, .13, .5, .012, 0, 0, -.006, grey(.12));                                       // the strap
  const caseM = add(scene, new THREE.CylinderGeometry(.06, .062, .016, 48).rotateX(Math.PI / 2), grey(.55, { r: .4 })); caseM.position.z = .004;
  const bez = add(scene, new THREE.TorusGeometry(.058, .0045, 8, 64), grey(.75, { r: .35 })); bez.position.z = .013;
  box(scene, .012, .012, .01, .066, 0, .006, grey(.6));                                    // the crown
  const dial = add(scene, new THREE.CircleGeometry(.054, 64), printMat(dialTex(false), { text: true, bias: .55 }), { cast: false }); dial.position.z = .0125;
  const hand = (L, w, tail, z, mat) => { const g = new THREE.Group(); g.position.z = z; scene.add(g); const m = box(g, w, L + tail, .0016, 0, (L - tail) / 2, 0, mat); m.castShadow = true; return g; };
  const hH = hand(.03, .0052, .006, .0145, grey(.06)), hM = hand(.045, .0036, .008, .0158, grey(.06)), hS = hand(.05, .0012, .012, .0171, grey(.04));
  const cap = add(scene, new THREE.CylinderGeometry(.003, .003, .004, 16).rotateX(Math.PI / 2), grey(.1)); cap.position.z = .0178;
  const key = new THREE.SpotLight(0xffffff, 26, 3, .5, .3, 1); key.position.set(-.35, .45, .5); key.target.position.set(0, 0, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0002; key.shadow.normalBias = .0004; scene.add(key, key.target);
  scene.add(new THREE.AmbientLight(0xffffff, .03));
  function update(t) {
    const s = W_T(t), sec = Math.floor(s + 1e-6) % 60, mn = 58 + (s % 60) / 60, hr = 11 + mn / 60;
    hS.rotation.z = -sec / 60 * Math.PI * 2; hM.rotation.z = -mn / 60 * Math.PI * 2; hH.rotation.z = -hr / 12 * Math.PI * 2;
    const d = Math.exp(lerp(Math.log(.25), Math.log(.205), eio(seg(t, 7.5, 9.375))));   // a slow push, keyed in log distance
    camera.position.set(.012 * Math.sin(t * .4), -.03, d); camera.lookAt(0, 0, .01); camera.updateProjectionMatrix();
    return { lo: .08, hi: .8, exp: 1.2, edgeK: .03, lineLum: .3 };
  }
  return { scene, camera, update, dialR: () => .054 };
}

// ═════════ SET 3: the clock tower at night: face lit from the front, the body grazed from below, a rim against the sky
const FACE = V(0, 21.6, 2.62);
function buildTower() {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 16 / 9, .05, 600);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), glow(0)); sky.material.side = THREE.BackSide; sky.layers.set(L_FLAT); scene.add(sky);
  { const r = mulberry(19), g = new THREE.BufferGeometry(), pos = []; for (let i = 0; i < 220; i++) { const a = r() * Math.PI * 2, e = .1 + r() * 1.2; pos.push(Math.cos(a) * Math.cos(e) * 380, Math.sin(e) * 380, Math.sin(a) * Math.cos(e) * 380); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); const st = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false })); st.layers.set(L_FLAT); scene.add(st); }
  const ST = grey(.42);
  box(scene, 4.6, 19, 4.6, 0, 9.5, 0, ST); box(scene, 5.4, .5, 5.4, 0, 19.25, 0, grey(.5));
  box(scene, 5.2, 5, 5.2, 0, 22, 0, ST); box(scene, 5.6, .45, 5.6, 0, 24.7, 0, grey(.5));
  box(scene, 4.4, 3.4, 4.4, 0, 26.6, 0, grey(.3)); for (const x of [-1, 1]) box(scene, 1, 2.4, .2, x * 1.05, 26.5, 2.21, grey(.04), { cast: false });   // belfry openings
  const roof = add(scene, new THREE.ConeGeometry(3.4, 4.6, 4).rotateY(Math.PI / 4), grey(.22)); roof.position.y = 30.6; rod(scene, V(0, 32.8, 0), V(0, 35, 0), .08, grey(.3), 6);
  for (let y = 2; y < 19; y += 3.4) for (const x of [-1, 1]) box(scene, .7, 1.5, .1, x * 1.1, y + 1, 2.31, hash(y * 3 + x) > .5 ? glow(1.1) : grey(.05), { cast: false, flat: true });
  const ring = add(scene, new THREE.TorusGeometry(1.95, .14, 8, 64), grey(.6)); ring.position.copy(FACE).add(V(0, 0, .02));
  const face = add(scene, new THREE.CircleGeometry(1.9, 64), printMat(dialTex(true), { text: true, bias: .55 }), { cast: false }); face.position.copy(FACE);
  const hand = (L, w, z) => { const g = new THREE.Group(); g.position.copy(FACE).add(V(0, 0, z)); scene.add(g); box(g, w, L + .2, .04, 0, (L - .2) / 2, 0, glow(0)); return g; };
  const tH = hand(.95, .14, .06), tM = hand(1.45, .09, .1);
  // rooftops around the base: silhouettes
  for (let i = 0; i < 14; i++) { const x = -40 + i * 6, h = 6 + hash(i * 2.2) * 7, z = -6 - hash(i) * 10; if (Math.abs(x) < 5) continue; box(scene, 5.6, h, 6, x, h / 2, z, grey(.05)); }
  const g0 = add(scene, new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), grey(.06), { cast: false }); g0.layers.set(L_SCREEN);
  const faceL = new THREE.SpotLight(0xffffff, 520, 30, .2, .4, 1.2); faceL.position.copy(FACE).add(V(0, -.6, 11)); faceL.target.position.copy(FACE); scene.add(faceL, faceL.target);
  const graze = new THREE.SpotLight(0xffffff, 260, 60, .45, .5, 1.3); graze.position.set(-7, .5, 9); graze.target.position.set(0, 14, 0); graze.castShadow = true; graze.shadow.mapSize.set(1024, 1024); graze.shadow.bias = -.0005; scene.add(graze, graze.target);
  scene.add(new THREE.AmbientLight(0xffffff, .02));
  function update(t, faceR) {
    const s = W_T(t), mn = 58 + (s % 60) / 60, hr = 11 + mn / 60; tM.rotation.z = -mn / 60 * Math.PI * 2; tH.rotation.z = -hr / 12 * Math.PI * 2;
    // start: the face framed exactly like the watch dial (shape match); then an exponential pull-back, keyed in log distance from rest
    const d0 = 1.9 / faceR, d1 = 46, u = ei(seg(t, 9.42, 10.2)) * 1.0, d = Math.exp(lerp(Math.log(d0), Math.log(d1), u));
    const el = lerp(0, -.3, u), az = lerp(0, .28, u), tg = FACE.clone().add(V(0, -lerp(0, 8.5, u), 0));
    camera.position.set(tg.x + Math.sin(az) * d * Math.cos(el), tg.y + Math.sin(el) * d, tg.z + Math.cos(az) * d * Math.cos(el)); camera.lookAt(tg); camera.updateProjectionMatrix();
    return { lo: .08, hi: .8, exp: 1.2, edgeK: .04, lineLum: .3 };
  }
  return { scene, camera, update };
}

const SETS = { street: buildStreet(), watch: buildWatch(), tower: buildTower() };
// the watch dial's apparent size (tan of its half-angle) at the end of S3, so the tower face can start at the same size and place
const WATCH_FACE_R = .054 / (.205 - .0125);
function draw(name, t, out) { const S = SETS[name]; const o = name === 'tower' ? S.update(t, WATCH_FACE_R) : S.update(t); pipe.render(S.scene, S.camera, out, o); }
window.render = t => {
  t = clamp(+t || 0, 0, DUR);
  const inv = t >= EV.chime && t < EV.chime + 2 / 30;                        // the inversion strike: ink and paper swap for two frames on the chime
  if (t < 7.5) { draw('street', t, rtA); present.draw(rtA, null, 0, false); return; }
  if (t < 9.33) { draw('watch', t, rtA); present.draw(rtA, null, 0, false); return; }
  if (t < 9.42) { draw('watch', 9.33, rtA); draw('tower', 9.33, rtB); present.draw(rtA, rtB, seg(t, 9.33, 9.42), false, 1, 32); return; }   // block dissolve, both still
  draw('tower', t, rtA); present.draw(rtA, null, 0, inv);
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0);
window.READY = true;
