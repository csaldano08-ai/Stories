// 009 · Low-poly Isometric Island — the first 10 s of "Last Train Home" on a flat-shaded hex-tile island at night
// (lemo-opuscar styles/lowpoly-island): orthographic camera at an isometric angle, no perspective and no horizon (distance
// dissolves into a screen-space night gradient with stars), flat shading, no textures, GTAO in the seams, warm emissives
// as the only bright things, faceted sea, moves on ones with arrival curves (the splash ring, the clock's pop).
// Page contract: window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { makePost } from './post.js';
import { makeSea } from './sea.js';
import { buildIsland, hex2w, TOP, mat } from './island.js';
import { makeAki, K } from './aki_lp.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash } from './shared/lib/util.js';

const W = 1920, H = 1080, Q = new URLSearchParams(location.search), SSAA = +(Q.get('ssaa') ?? 1.5), DEG = Math.PI / 180;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-10, 10, 5, -5, 1, 1600);
const post = makePost(renderer, scene, camera, W, H, { ssaa: SSAA, aoRadius: .7, aoScale: 1.5, aoThickness: 1 });
post.bloom.strength = .5; post.bloom.threshold = .9; post.bloom.radius = .55;
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';

// ——— the run on the shared rig, placed so the splash contact lands on the centre of the puddle tile ———
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const X0 = RUN.pelvisAt(5)[0], SPLASH = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const xs = (SPLASH.x - X0) * K, QP = Math.round(xs / Math.sqrt(3)), XP = hex2w(QP, 0)[0], XOFF = XP - xs;
const X = t => (RUN.pelvisAt(t)[0] - X0) * K + XOFF;
function poseAt(t, raise = false) {
  const S = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  let w = clamp(up, 0, 1.1) * (1 - dn); if (raise) w = 1; S.watch = w;
  if (w > 0) { const J0 = solveProfile(S), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S.arms.f.sh *= 1 - .45 * wm; S.head += .26 * wm; S.neck += .08 * wm; }
  return S;
}

// ——— world ———
const sea = makeSea(scene);
const isl = buildIsland(scene, { puddle: [QP, 0], avoid: XP });
sea.drawShallow(isl.tiles.map(t => [t.x, t.z, 2.2, 1]));
const hemi = new THREE.HemisphereLight('#5c5ea8', '#2a2640', .62); scene.add(hemi);
const moon = new THREE.DirectionalLight('#a9b0e8', .85); moon.castShadow = true; moon.shadow.mapSize.set(4096, 4096); moon.shadow.bias = -.0006; moon.shadow.normalBias = .02; moon.shadow.radius = 3;
Object.assign(moon.shadow.camera, { left: -24, right: 24, top: 14, bottom: -14, near: 1, far: 140 }); moon.shadow.camera.updateProjectionMatrix(); scene.add(moon, moon.target);
{ const se = 30 * DEG, sa = 300 * DEG; moon.position.set(Math.cos(se) * Math.sin(sa) * 60, Math.sin(se) * 60, Math.cos(se) * Math.cos(sa) * 60); }
const aki = makeAki(); scene.add(aki.group);
const front = new THREE.PointLight('#c8d0ff', 0, 3, 2); scene.add(front);
// rain: thin flat-shaded streaks (instanced), moving on ones
const RN = 260, rain = new THREE.InstancedMesh(new THREE.BoxGeometry(.008, .16, .008), new THREE.MeshStandardMaterial({ color: '#b8c4f0', emissive: new THREE.Color('#5a6090'), emissiveIntensity: .6, flatShading: true }), RN); rain.frustumCulled = false; scene.add(rain);
// splash: spray (icosahedra) for every footfall, and the hero splash's ring on the puddle
const SN = 40, spray = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.018, 0), new THREE.MeshStandardMaterial({ color: '#c8d4ff', emissive: new THREE.Color('#6a74b0'), emissiveIntensity: .5, flatShading: true }), SN); spray.frustumCulled = false; scene.add(spray);
const ring = new THREE.Mesh(new THREE.TorusGeometry(1, .02, 3, 18), new THREE.MeshStandardMaterial({ color: '#c8d4ff', emissive: new THREE.Color('#8890d0'), emissiveIntensity: .6, flatShading: true, transparent: true })); ring.rotation.x = -Math.PI / 2; scene.add(ring);
const pop = new THREE.Mesh(new THREE.TorusGeometry(1, .04, 3, 12), new THREE.MeshStandardMaterial({ color: '#fff0c0', emissive: new THREE.Color('#ffd890'), emissiveIntensity: 2, flatShading: true, transparent: true })); scene.add(pop);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
function setRain(t, c, span) {
  for (let i = 0; i < RN; i++) { const sp = 6 + hash(i * 1.3) * 3, hgt = span * .9, y = c[1] - .3 + hgt - ((hash(i * 2.1) * hgt + t * sp) % hgt), x = c[0] + (hash(i * 3.7) - .5) * span * 2.2 - (y - c[1]) * .15, z = c[2] + (hash(i * 4.9) - .5) * span * 1.4;
    _q.setFromAxisAngle(_v.set(0, 0, 1), .15); _m.compose(_v.set(x, y, z), _q, _s.set(1, span / 4, 1)); rain.setMatrixAt(i, _m); }
  _s.set(1, 1, 1); rain.instanceMatrix.needsUpdate = true;
}
function setSplash(t) {
  let n = 0;
  for (const c of RUN.contacts) { const u = t - c.t0; if (u < 0 || u > .5) continue; const hero = c === SPLASH, cnt = hero ? 18 : 5, fx = (c.x - X0) * K + XOFF + .04;
    for (let j = 0; j < cnt && n < SN; j++, n++) { const a = (hash(j * 7.1 + c.t0) - .5) * 2.6, sp = (hero ? 1.6 : 1) * (.5 + hash(j * 3.3 + c.t0) * .5), y = TOP + Math.max(0, sp * 1.6 * u - 4.9 * u * u);
      _m.compose(_v.set(fx + Math.sin(a) * sp * u * .8, y, Math.cos(a * 1.3) * sp * u * .4), _q.identity(), _s.set(1, 1, 1)); spray.setMatrixAt(n, _m); } }
  for (; n < SN; n++) { _m.makeScale(0, 0, 0); spray.setMatrixAt(n, _m); }
  spray.instanceMatrix.needsUpdate = true;
  const u = t - EV.splash; ring.visible = u > 0 && u < 1.2;
  if (ring.visible) { const r = .05 + .6 * eo(u / 1.2); ring.scale.set(r, r, r); ring.position.set(XP, TOP + .005, 0); ring.material.opacity = 1 - u / 1.2; }
}
// ——— camera: orthographic, target / azimuth / elevation / frustum height (the zoom) ———
function cam(tg, az, el, fh, hzA = .1, hzB = .52, tiltB = .3) {
  const D = Math.max(300, fh * 3), ce = Math.cos(el * DEG);
  camera.position.set(tg[0] + D * ce * Math.sin(az * DEG), tg[1] + D * Math.sin(el * DEG), tg[2] + D * ce * Math.cos(az * DEG));
  camera.up.set(0, 1, 0); camera.lookAt(tg[0], tg[1], tg[2]);
  const fw = fh * W / H; Object.assign(camera, { left: -fw / 2, right: fw / 2, top: fh / 2, bottom: -fh / 2, near: 1, far: D + fh * 5 + 800 }); camera.updateProjectionMatrix();
  const cot = 1 / Math.tan(el * DEG);
  post.comp.camDist.value = D; post.comp.hz0.value = hzA * fh * cot; post.comp.hz1.value = hzB * fh * cot;
  post.tilt.fy.value = .5; post.tilt.band.value = tiltB;
  const f = new THREE.Vector3(); camera.getWorldDirection(f); const fl = Math.hypot(f.x, f.z) || 1; sea.U.uFwd.value.set(f.x / fl, f.z / fl); sea.U.uTgt.value.set(tg[0], tg[2]); sea.U.uSpanF.value = fh * cot * .5;
  post.comp.starOff.value = az / 60;
}
function placeAki(t, raise = false) {
  const S = poseAt(t, raise), J = solveProfile(S), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, t);
  const r = aki.place(J, [-X0 * K + XOFF, TOP, 0], { hemB: sc.hemB, hairLag: sc.hair.back, blink: [3.6, 5.2].some(b => t >= b && t < b + .1) });
  front.position.set(X(t) + .6, TOP + .9, 1.6); front.intensity = 1.4;
  return r;
}
// ——— shots ———
function S1(t, lt) { placeAki(t); aki.group.visible = t > .25 && t < 1.9; cam([XP + .2, TOP + .3, 0], 6, 14, lerp(1.15, 1.05, eio(lt / 2.5)), .1, .55, .32); setRain(t, [XP, TOP, 0], 1.2); setSplash(t); }
function S2(t, lt) { placeAki(t); aki.group.visible = true; const x = X(t); cam([x + .55, TOP + .55, 0], 16, 24, 3.6, .1, .5, .3); setRain(t, [x + .5, TOP, 0], 2.4); setSplash(t); }
function S3(t, lt) {
  const r = placeAki(t, true); aki.group.visible = true;
  const sec = 41 + Math.floor(t - EV.watchHit); if (aki.watch.userData.sec !== sec) { aki.watch.userData.set(sec); aki.watch.userData.sec = sec; }
  const wp = r.watch.position; cam([wp.x, wp.y, wp.z], 4, 10, .2, .3, .9, .4); setRain(t, [wp.x, wp.y - .3, wp.z], .25); setSplash(-9);
  front.position.set(wp.x + .25, wp.y + .2, wp.z + .5); front.intensity = .9;
}
function S4(t, lt) {
  placeAki(t); aki.group.visible = true;
  const u = eio(seg(lt, 0, .625));
  cam([10, lerp(3.4, 2.7, u), -1.2], 24, lerp(17, 19, u), lerp(13.5, 12.8, u), -.02, .34, .5); setRain(t, [10, TOP, 0], 9); setSplash(-9);
  const c = t - EV.chime, k = c > 0 ? Math.exp(-c * 4) : 0;
  isl.faceM.emissiveIntensity = 1.2 + 2.6 * k; isl.clockL.intensity = 2 + 8 * k;
  pop.visible = c > 0 && c < .6; if (pop.visible) { const s = .3 + .55 * (1 - Math.exp(-c * 9) * Math.cos(c * 22)); pop.scale.set(s, s, s); pop.position.set(19.5, TOP + 3, -1.9); pop.material.opacity = 1 - c / .6; }
}
const SH = { S1, S2, S3, S4 };
window.DUR = DUR;
window.render = t => {
  const [t0, , id] = shotAt(t);
  // every frame sets everything it shows: no state carried from the previous frame
  isl.faceM.emissiveIntensity = 1.2; isl.clockL.intensity = 2; pop.visible = false; ring.visible = false;
  if (id !== 'S3' && aki.watch.userData.sec !== 41) { aki.watch.userData.set(41); aki.watch.userData.sec = 41; }
  sea.U.uTime.value = t; sea.U.uAmp.value = 1.3; sea.U.uDeep.value.set('#22254a'); sea.U.uShal.value.set('#353965'); sea.U.uFoam.value.set('#9fb0e0'); sea.U.uNight.value = 1;
  post.comp.zen.value.set('#11153a'); post.comp.hor.value.set('#4a4478'); post.comp.stars.value = 1; post.comp.time.value = t;
  const gd = post.grade; gd.sat.value = 1.1; gd.contrast.value = .12; gd.lift.value.setRGB(.012, .016, .045); gd.vig.value = .32;
  for (const L of isl.lamps) L.L.intensity = 1.6 * (1 + .05 * Math.sin(t * 9 + L.x));
  SH[id](t, t - t0);
  post.composer.render();
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; if (id === 'S1' && (t <= .25 || t >= 1.9)) return null;
  const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
