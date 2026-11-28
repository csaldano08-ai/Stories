// 084 · Glass Product Render — the first 10 s of "Last Train Home" as a launch film in glass, metal and light (lemo-opuscar styles/glass-product).
// A narrative adaptation: the hero objects are fictional glass objects in a black strip-light studio (the library's studio.js: the
// environment is a little scene of emissive strips baked to PMREM every frame; a glossy mirror floor with procedural caustics and rings).
//   S1–S2  AKI as a glass figurine, rebuilt every frame from the shared rig (clear-glass limbs over the rig's bones, a frosted coat lit
//          from inside, satin joints, constant lengths, a planted foot): a light guide inside each leg carries a comet pulse up from the
//          foot at every footfall, and each footfall leaves a ring spreading on the floor; at 0.94 s the far foot strikes the wet floor:
//          a caustic bursts under it. At 6.05 s she raises her wrist: the watch ring lights in the accent (ice blue → violet).
//   S3     cut on the beat: the glass watch alone, an exploded view at 40° to the lens (crystal, hands, dial, light-guide ring, movement,
//          case, strap): the parts drift apart, hover, and snap shut on the tick at 8.4 s, when the second hand steps to 48
//   S4     cut: straight-on, a glass clock tower; on the chime (9.58 s) a pulse climbs its light guide, its ring flares, a sweep crosses,
//          a ring runs over the floor; the number 11:58:49 is set in ultra-thin type with a glint that follows the sweep
// Page contract: window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { makeStudio } from './src/studio.js';
import { glass, frosted, metal, brushed, guideMat, setPulses, AURA_A, AURA_B } from './src/materials.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2, V = (x, y, z) => new THREE.Vector3(x, y, z);
await document.fonts.load('200 120px "Inter Tight"', '0123456789:');
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, canvas: document.getElementById('gl') });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#000000');
const camera = new THREE.PerspectiveCamera(28, W / H, 1, 4000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: false });
post.bloom.strength = .2; post.bloom.threshold = 1.1; post.bloom.radius = .4; post.vig.uniforms.amt.value = .3; post.vig.uniforms.contrast.value = .12;
const studio = makeStudio(renderer, scene), FY = studio.FLOOR.y;

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
const G = 95 / 578, X0 = X(0), P3 = (p, z = 0) => V((p[0] - X0) * G, FY - p[1] * G, z), herX = t => (X(t) - X0) * G;
const STEPS = RUN.contacts.filter(c => c.t0 > -.5 && c.t0 < 10.2);

// ═════════ AKI in glass (S1–S2)
const M = { glass: glass({ thickness: 5, dispersion: 4 }), frost: frosted({ thickness: 9 }), chrome: metal('#d9dde2', .16), satin: metal('#b8bcc2', .3), dark: metal('#2a2c31', .22), core: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.6, 1.7) }) };
const guides = { f: guideMat(false), n: guideMat(false) }, wring = guideMat(true);
const aki = new THREE.Group(); scene.add(aki);
const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 24, 1), unitSph = new THREE.SphereGeometry(1, 28, 18), coatGeo = new THREE.CylinderGeometry(.62, 1, 1, 32, 1);
const pool = []; let pi = 0;
const mesh = (geo, mat) => { let m = pool[pi]; if (!m) { m = new THREE.Mesh(geo, mat); m.castShadow = false; aki.add(m); pool.push(m); } m.geometry = geo; m.material = mat; m.visible = true; pi++; return m; };
const bone = (a, b, r, mat) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(), m = mesh(unitCyl, mat); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); m.scale.set(r, L, r); };
const ball = (p, r, mat) => { const m = mesh(unitSph, mat); m.position.copy(p); m.scale.setScalar(r); m.quaternion.identity(); };
const guideMesh = { f: new THREE.Mesh(new THREE.BufferGeometry(), guides.f), n: new THREE.Mesh(new THREE.BufferGeometry(), guides.n) }; aki.add(guideMesh.f, guideMesh.n);
const watchRing = new THREE.Mesh(new THREE.TorusGeometry(2.6, .55, 10, 40), wring); aki.add(watchRing);
function buildAki(t) {
  pool.forEach(m => m.visible = false); pi = 0;
  const J = solveProfile(poseAt(t));
  for (const [k, z] of [['f', -5], ['n', 5]]) { const l = J.leg[k], c = Math.cos(l.pitch), s = Math.sin(l.pitch), toe = [l.ankle[0] + 70 * c, l.ankle[1] + 70 * s];
    bone(P3(l.hip, z), P3(l.knee, z), 3.6, M.glass); bone(P3(l.knee, z), P3(l.ankle, z), 2.9, M.glass); ball(P3(l.knee, z), 3.3, M.satin); ball(P3(l.ankle, z), 2.6, M.satin);
    bone(P3(l.ankle, z), P3(toe, z), 2.5, M.chrome);
    // the light guide inside the leg: an opaque rod, foot → hip (its uv.x runs along it)
    const curve = new THREE.CatmullRomCurve3([P3(l.ankle, z), P3(l.knee, z), P3(l.hip, z)]); guideMesh[k].geometry.dispose(); guideMesh[k].geometry = new THREE.TubeGeometry(curve, 24, .85, 6, false);
    const ps = STEPS.filter(c => c.foot === k && t >= c.t0 && t - c.t0 < 1.2).slice(-3).map(c => { const a = t - c.t0; return { p: a / .38, w: .14, a: 9 * Math.exp(-a / .55), h: clamp(a * 1.2) }; });
    setPulses(guides[k], ps, .012); }
  for (const [k, z] of [['f', -10], ['n', 10]]) { const a = J.arm[k], hand = [a.wr[0] + (a.wr[0] - a.el[0]) * .25, a.wr[1] + (a.wr[1] - a.el[1]) * .25];
    bone(P3(a.sh, z), P3(a.el, z), 2.4, M.glass); ball(P3(a.el, z), 2.3, M.satin); bone(P3(a.el, z), P3(a.wr, z), 2.0, M.glass); bone(P3(a.wr, z), P3(hand, z), 1.6, M.chrome); ball(P3(a.sh, z), 2.6, M.satin); }
  const TT = (b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f], hem = P3(TT(J.pelvis, -98, -4)), neck = P3(J.neckBase);
  { const d = new THREE.Vector3().subVectors(neck, hem), L = d.length(), m = mesh(coatGeo, M.frost); m.position.copy(hem).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); m.scale.set(12, L, 9.5);
    const c = mesh(unitCyl, M.core); c.position.copy(m.position); c.quaternion.copy(m.quaternion); c.scale.set(3.2, L * .7, 3.2); }   // the light inside the frosted coat
  ball(P3(J.pelvis), 4.2, M.satin); bone(P3(J.neckBase), P3(J.neckTop), 2.2, M.glass);
  const hc = P3(J.headC); ball(hc, 8.2, M.glass); { const m = mesh(unitSph, M.dark); m.position.copy(hc).add(V(-Math.cos(J.headA) * 2.2, 1.6, 0)); m.scale.set(8.0, 7.6, 8.4); }   // hair: dark polished metal
  const a = J.arm.n, wp = P3([a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84], 10), d = new THREE.Vector3().subVectors(P3(a.wr, 10), P3(a.el, 10)).normalize();
  watchRing.position.copy(wp); watchRing.quaternion.setFromUnitVectors(V(0, 0, 1), d);
  const wu = J.S.watch; setPulses(wring, wu > .05 ? [{ p: (t * .9) % 1, w: .08, a: 10 * clamp(wu), h: .2 }, { p: (t * .9 + .5) % 1, w: .08, a: 10 * clamp(wu), h: .7 }] : [], wu > .05 ? .05 : .004);
  return J;
}

// ═════════ the glass watch (S3): parts on one axis, exploded and snapped
const watch = new THREE.Group(); scene.add(watch);
const WP = [];   // {obj, off}
const addW = (obj, off) => { watch.add(obj); WP.push({ obj, off, rest: obj.position.y }); return obj; };
{ const body = new THREE.Mesh(new THREE.CylinderGeometry(14.8, 14.8, 5, 64), frosted({ thickness: 6 })); body.position.y = -1.5; addW(body, -6);
  addW(new THREE.Mesh(new THREE.TorusGeometry(15.5, 2.2, 24, 96).rotateX(Math.PI / 2), M.chrome), 0);
  const mv = new THREE.Group(); const plate = new THREE.Mesh(new THREE.CylinderGeometry(13.5, 13.5, 1.2, 64), metal('#dfe3e8', .3, { roughnessMap: brushed })); const glowDisc = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, .6, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.3, 2.5) })); glowDisc.position.y = 1.0; mv.add(glowDisc); mv.add(plate);
  const gear = (r, n, x, z, y) => { const sh_ = new THREE.Shape(); for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * TAU, rr = i % 2 ? r : r * .86; i ? sh_.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh_.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    const g = new THREE.Mesh(new THREE.ExtrudeGeometry(sh_, { depth: .8, bevelEnabled: false }).rotateX(-Math.PI / 2), metal('#d8b46a', .25)); g.position.set(x, y, z); mv.add(g); return g; };
  WP.gears = [gear(6, 24, -3, -2, .8), gear(4, 16, 5, 4, 1.4), gear(3, 12, 4, -6, 2.0)]; mv.position.y = -1; addW(mv, -16);
  const guideR = new THREE.Mesh(new THREE.TorusGeometry(14, .7, 10, 96).rotateX(Math.PI / 2), guideMat(true)); guideR.position.y = 1.4; WP.guide = addW(guideR, 6);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(13.6, 13.6, 1.4, 64), frosted({ thickness: 3, transmission: .7, roughness: .3 })); dial.position.y = 2.2; addW(dial, 12);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, b = new THREE.Mesh(new THREE.BoxGeometry(1, .8, i % 3 ? 2.2 : 3.6), M.chrome); b.position.set(Math.sin(a) * 11.2, 3.2, -Math.cos(a) * 11.2); b.rotation.y = -a; dial.add(b); b.position.y = 1.0; }
  const hands = new THREE.Group(); hands.position.y = 4; const hnd = (L, w, y, mat) => { const p = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(w, .6, L), mat); b.position.z = -L / 2 + 1.5; p.add(b); p.position.y = y; hands.add(p); return p; };
  const HM = new THREE.MeshStandardMaterial({ color: '#e8ecf0', emissive: '#e8ecf0', emissiveIntensity: .35, metalness: .6, roughness: .25 }); WP.hH = hnd(7, 1.8, 0, HM); WP.hM = hnd(10.5, 1.2, .7, HM); WP.hS = hnd(12, .5, 1.4, new THREE.MeshStandardMaterial({ color: '#ff6a3d', emissive: '#ff6a3d', emissiveIntensity: .4, metalness: .2, roughness: .3 })); addW(hands, 22);
  const crystal = new THREE.Mesh(new THREE.SphereGeometry(16, 64, 24, 0, TAU, 0, .52), glass({ thickness: 4, dispersion: 6 })); crystal.position.y = -8.6; addW(crystal, 34); }
watch.rotation.set(.38, 0, .22);   // the axis ~40° to the lens, the dial turned toward it

// ═════════ the glass clock tower (S4)
const tower = new THREE.Group(); scene.add(tower);
const towerGuide = guideMat(false), faceRing = guideMat(true);
{ const shaft = new THREE.Mesh(new THREE.BoxGeometry(26, 86, 26), M.frost); shaft.position.y = FY + 43; tower.add(shaft);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 70, 16), M.core); core.position.y = FY + 40; tower.add(core);
  const gd = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(V(0, FY + 2, 9), V(0, FY + 84, 9)), 30, 1.1, 8, false), towerGuide); tower.add(gd);
  const bel = new THREE.Mesh(new THREE.BoxGeometry(24, 18, 24), M.glass); bel.position.y = FY + 95; tower.add(bel);
  const bell = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [5, .6], [6.4, 4], [5.5, 9], [2.4, 11.5], [0, 12]].map(([x, y]) => new THREE.Vector2(x, -y)), 40), M.chrome); bell.position.y = FY + 102; tower.add(bell); tower.userData.bell = bell;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(20, 26, 4).rotateY(Math.PI / 4), M.glass); roof.position.y = FY + 117; tower.add(roof);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 1.6, 64).rotateX(Math.PI / 2), glass({ thickness: 2 })); face.position.set(0, FY + 72, 13.6); tower.add(face);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(10.6, .8, 10, 80), faceRing); ring.position.copy(face.position).add(V(0, 0, .6)); tower.add(ring);
  const th = (L, w, a) => { const p = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(w, L, .6), M.chrome); b.position.y = L / 2 - 1; p.add(b); p.position.copy(face.position).add(V(0, 0, 1.4)); p.rotation.z = a; tower.add(p); };
  th(5.5, 1.3, -(11 + 58.8 / 60) / 12 * TAU); th(8, .9, -(58.8 / 60) * TAU); }

// ═════════ shots: cuts on the beat; product films need no spatial continuity
function camLook(pos, tgt, fov = 28) { camera.position.copy(pos); camera.fov = fov; camera.lookAt(tgt); camera.updateProjectionMatrix(); camera.updateMatrixWorld(); }
const azOf = () => Math.atan2(camera.position.x - camera.userData.tx, camera.position.z - camera.userData.tz);
function frame(t) {
  const shot = t < 7.5 ? 'aki' : t < 9.375 ? 'watch' : 'tower';
  aki.visible = shot === 'aki'; watch.visible = shot === 'watch'; tower.visible = shot === 'tower';
  const U = studio.U; for (const v of U.uC.value) v.set(0, 0, 0, 0); for (const v of U.uWave.value) v.set(0, 0, 0, 0);
  let envO = {}, sweep = { I: 0 }, focus = null, aper = 2, bg = .35, spot = .05;
  if (shot === 'aki') {
    const J = buildAki(t), hx = herX(t), u = eio(seg(t, 2.5, 3.6));
    // S1 low macro on the feet, slow orbit; S2 a high 3/4 orbit (a sweep crosses on the cut to S2)
    const a1 = lerp(.95, .8, seg(t, 0, 2.5)), a2 = lerp(.7, .25, seg(t, 3.6, 7.5)), az = lerp(a1, a2, u), d = lerp(150, 330, u), h = lerp(4, 110, u), ty = lerp(FY + 22, FY + 52, u);
    const tg = V(hx + lerp(18, 8, u), ty, 0); camera.userData.tx = tg.x; camera.userData.tz = tg.z;
    camLook(V(tg.x + Math.sin(az) * d, FY + h, Math.cos(az) * d), tg); focus = tg; aper = lerp(3.2, 1.4, u);
    if (t > 2.35 && t < 3.0) sweep = { x: seg(t, 2.35, 3.0) * 2 - 1, I: 7, az: azOf() + Math.PI, y: 0 };
    // floor: a ring from every footfall, a caustic burst at the splash
    let wi = 0; for (const c of STEPS) { const a = t - c.t0; if (a < 0 || a > 1.4 || wi >= 12) continue; const p = P3([c.x + 44, 0], c.foot === 'n' ? 5 : -5); U.uWave.value[wi++].set(p.x, p.z, 8 + a * 70, 1.4 * Math.exp(-a / .45)); }
    const sa = t - SPL.t0; if (sa > 0 && sa < 2) { const p = P3([SPL.x + 44, 0], -5); U.uC.value[0].set(p.x, p.z, 26 + sa * 30, 2.2 * Math.exp(-sa / .5)); for (let k = 0; k < 2 && wi < 12; k++) U.uWave.value[wi++].set(p.x, p.z, 6 + (sa - k * .12) * 120, 3 * Math.exp(-sa / .6)); }
    U.uCenter.value.set(hx, 0); const kk = lerp(1, 2.6, u); envO = { left: 1 * kk, right: 1 * kk, top: .8 * kk, front: .5 * kk, back: 1 * kk, key: .25 * lerp(1, 3, u) }; spot = lerp(.08, .22, u); bg = lerp(.35, .7, u);
  } else if (shot === 'watch') {
    // exploded view: drift apart (ease-out), hover, snap shut on the tick at 8.4 s (short ease-in)
    const e = eo(seg(t, 7.55, 8.05)) * (1 - ei(seg(t, 8.28, 8.4)));
    for (const p of WP) p.obj.position.y = p.rest + p.off * e * .8;
    const s = Math.floor(W_T(t) + 1e-6) % 60; WP.hS.rotation.y = -s / 60 * TAU; WP.hM.rotation.y = -(58 + s / 60) / 60 * TAU; WP.hH.rotation.y = -(11 + 58.8 / 60) / 12 * TAU;
    WP.gears.forEach((g, i) => g.rotation.y = (i % 2 ? -1 : 1) * Math.floor((t - 7.5) * 4) * .26 / (i + 1));
    const tick = t - (Math.floor(t - .4) + .4); setPulses(WP.guide.material, [{ p: (t * .5) % 1, w: .06, a: 6, h: .2 }, { p: .25, w: .5, a: tick < .3 ? 9 * Math.exp(-tick / .12) : 0, h: .5 }], .03);
    watch.position.set(0, FY + 30, 0);
    const az = lerp(.55, .15, seg(t, 7.5, 9.375)), d = lerp(140, 124, seg(t, 7.5, 9.375)), tg = V(0, FY + 34, 0); camera.userData.tx = 0; camera.userData.tz = 0;
    camLook(V(Math.sin(az) * d, FY + 70, Math.cos(az) * d), tg, 30); focus = tg; aper = 1.2;
    if (t < 7.95) sweep = { x: seg(t, 7.5, 7.95) * 2 - 1, I: 6, az: azOf() + Math.PI, y: 0 };
    const snap = t - 8.4; if (snap > 0 && snap < 1.2) U.uWave.value[0].set(0, 0, 8 + snap * 90, 2.2 * Math.exp(-snap / .45));
    U.uCenter.value.set(0, 0); envO = { left: 1.2, right: 1.2, top: 1.5, front: .6, back: 1, key: 1.6 }; spot = .14; bg = .5;
  } else {
    const c = t - EV.chime, push = seg(t, 9.375, 10), tg = V(0, FY + 72, 0); camera.userData.tx = 0; camera.userData.tz = 0;
    camLook(V(0, FY + 52, lerp(250, 228, push)), tg, 30); focus = tg; aper = .8;
    setPulses(towerGuide, c > 0 ? [{ p: c / .32, w: .12, a: 10 * Math.exp(-c / .6), h: clamp(c * 2) }] : [], .01);
    setPulses(faceRing, c > .2 ? [{ p: (c * .8) % 1, w: .1, a: 12 * Math.exp(-(c - .2) / .5), h: .3 }, { p: (c * .8 + .5) % 1, w: .1, a: 12 * Math.exp(-(c - .2) / .5), h: .8 }] : [{ p: 0, w: .5, a: .3, h: 0 }], .02);
    tower.userData.bell.rotation.z = c > 0 ? .35 * Math.sin(c * 14) * Math.exp(-c * 3) : 0;
    if (c > 0 && c < .55) sweep = { x: seg(c, 0, .55) * 2 - 1, I: 8, az: Math.PI, y: 0 };
    if (c > 0) { U.uWave.value[0].set(0, 0, 10 + c * 110, 2.6 * Math.exp(-c / .5)); U.uC.value[0].set(0, 0, 40, 1.4 * Math.exp(-c / .5)); }
    U.uCenter.value.set(0, 0); envO = { left: 1.3, right: 1.3, top: 1.2, front: 0, back: 1.4, key: .4 }; bg = .6;
  }
  scene.backgroundIntensity = bg; U.uBgI.value = bg; U.uTime.value = t * .6; U.uSpot.value = spot;
  studio.updateEnv(Object.assign(envO, { sweep, aura: { I: 0, col: AURA_A } }));
  post.dof.focus = focus ? camera.position.distanceTo(focus) : 100; post.dof.aper = aper; post.dof.maxCoc = 12;
  studio.reflect(camera); post.composer.render();
  // the number, ultra-thin, with a glint that follows the sweep (S4)
  const o = document.getElementById('ov').getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H);
  if (shot === 'aki' && t > 2.5) { // a lit studio sweep behind the walk (screen-blended, so black lifts to steel blue and the chrome is untouched)
    const k = eio(seg(t, 2.5, 3.6)); o.save(); o.globalAlpha = k;
    const g = o.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16222f'); g.addColorStop(.55, '#22344a'); g.addColorStop(.62, '#2b4159'); g.addColorStop(1, '#101a26'); o.fillStyle = g; o.fillRect(0, 0, W, H);
    const r = o.createRadialGradient(W * .5, H * .62, 20, W * .5, H * .62, W * .5); r.addColorStop(0, 'rgba(70,110,150,.35)'); r.addColorStop(1, 'rgba(70,110,150,0)'); o.fillStyle = r; o.fillRect(0, 0, W, H); o.restore(); }
  if (shot === 'tower') { const a = clamp((t - 9.42) / .2), c = t - EV.chime; o.globalAlpha = a; o.font = '200 132px "Inter Tight"'; o.letterSpacing = '26px'; o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#f4f6f8';
    o.fillText('11:58:49', W / 2 + 13, 150); if (c > 0 && c < .55) { const gx = lerp(W * .25, W * .75, seg(c, 0, .55)); o.globalCompositeOperation = 'source-atop'; const gr = o.createLinearGradient(gx - 120, 0, gx + 120, 0); gr.addColorStop(0, 'rgba(160,220,255,0)'); gr.addColorStop(.5, 'rgba(200,235,255,.95)'); gr.addColorStop(1, 'rgba(169,139,255,0)'); o.fillStyle = gr; o.fillRect(0, 60, W, 180); o.globalCompositeOperation = 'source-over'; }
    o.font = '400 19px "Inter Tight"'; o.letterSpacing = '9px'; o.fillStyle = 'rgba(230,236,242,.8)'; o.fillText('THE STATION CLOCK', W / 2 + 4, 250); o.globalAlpha = 1; o.letterSpacing = '0px'; }
}
window.render = t => frame(clamp(+t || 0, 0, DUR));
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
frame(0); window.READY = true;
