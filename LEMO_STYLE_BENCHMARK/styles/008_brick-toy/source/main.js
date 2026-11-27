// 008 · Brick Toy — the first 10 s of "Last Train Home" as a stop-motion brick film on a real walnut desk at night
// (lemo-opuscar styles/brick-toy): glossy ABS with clearcoat, studs, GTAO in the seams, softbox highlights, physical
// depth of field scaled to the shot, the brick figure stepping on twos while the camera glides on ones, rain, puddle and
// splash made of translucent bricks rebuilt per drawing, the watch a printed tile swapped once a second.
// Page contract: window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { COL, BRICK, PLATE, roundGeo, brickGeo, plastic } from './bricks.js';
import { buildStreet, Z_RUN } from './street.js';
import { makeAki, gait, runPose, HIP, ARM_L, STRIDE, AC } from './aki_brick.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, hash } from './shared/lib/util.js';

const W = 1920, H = 1080, Q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = .98;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, W / H, .5, 3000);
const SS = +(Q.get('ss') ?? 1.5);
const post = makePost(renderer, scene, camera, W, H, { ssaa: SS, ao: true, aoRadius: 3.5, aoThickness: 3, aoAmt: .9 });
post.bloom.strength = .32; post.bloom.threshold = .95;
const VG = post.vig.uniforms; VG.amt.value = .42; VG.warm.value = -.3; VG.contrast.value = .26; VG.sat.value = 1.1;
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
await document.fonts.load('700 44px Fredoka').catch(() => {});

const ST = await buildStreet(scene);
const Y0 = ST.TOPW, XP = -100;                                    // sidewalk top; the hero puddle's x
const G = gait(XP - 2 * STRIDE);                                  // contact k = 2 (t = 0.9375 s) lands at XP
const aki = makeAki(); scene.add(aki.root);
const twos = t => Math.floor(t * 15 + 1e-6) / 15;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// translucent-brick effects: rain (1×1 round plates), splash (1×1 round plates on arcs), the puddle (2×2 tiles)
const transM = new THREE.MeshPhysicalMaterial({ color: '#a8d0ff', roughness: .05, clearcoat: 1, transparent: true, opacity: .32, envMapIntensity: 2, depthWrite: false });
const rainIM = new THREE.InstancedMesh(roundGeo(.5, PLATE), transM, 160); rainIM.frustumCulled = false; scene.add(rainIM);
const splIM = new THREE.InstancedMesh(roundGeo(.5, PLATE), transM, 40); splIM.frustumCulled = false; scene.add(splIM);
const pudM = new THREE.MeshPhysicalMaterial({ color: '#bcd8f0', roughness: .03, clearcoat: 1, transparent: true, opacity: .55, envMapIntensity: 2.6 });
const puddles = [];
for (const [cx, cz, tiles] of [[XP, Z_RUN + .5, [[-1, -1], [1, -1], [-1, 1], [1, 1], [3, 1], [-3, -1]]], [XP + 34, Z_RUN - 1, [[0, 0], [2, 0], [2, 2]]], [XP + 61, Z_RUN + 1, [[0, 0], [-2, 0], [0, -2], [2, 0]]]])
  for (const [dx, dz] of tiles) { const m = new THREE.Mesh(brickGeo(2, 2, PLATE * .5, { tile: true }), pudM); m.position.set(cx + dx, Y0, cz + dz); m.receiveShadow = true; scene.add(m); puddles.push(m); }
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _e = new THREE.Euler();
function setRain(t, cx, cz, spanX = 60, spanZ = 40, top = 40) {
  const tq = twos(t);
  for (let i = 0; i < 160; i++) { const sp = 55 + hash(i * 1.3) * 25, y = top - ((hash(i * 2.1) * top + tq * sp) % top), x = cx + (hash(i * 3.7) - .5) * spanX - (top - y) * .15, z = cz + (hash(i * 4.9) - .5) * spanZ;
    _e.set(hash(i * 5.3) * .5, hash(i * 6.1) * 3, hash(i * 7.7) * .5); _q.setFromEuler(_e); _m.compose(V(x, y, z), _q, _s.set(.55, .55, .55)); rainIM.setMatrixAt(i, _m); }
  _s.set(1, 1, 1);
  rainIM.instanceMatrix.needsUpdate = true;
}
function setSplash(t) {   // every footfall throws a few trans-clear plates on arcs (on twos); the hero splash in the puddle throws more
  let n = 0;
  for (let k = 0; k < 40; k++) { const tc = FIRST_STEP + k * STEP, u = twos(t) - tc; if (u < 0 || u > .55) continue; const hero = k === 2, cnt = hero ? 14 : 3, fx = G.P(k) + .6;
    for (let j = 0; j < cnt && n < 40; j++, n++) { const a = (hash(k * 13 + j) - .5) * 2.6, sp = (hero ? 14 : 8) * (.6 + hash(k * 7 + j * 3) * .6), vx = Math.sin(a) * sp * .55, vz = Math.cos(a * 1.7) * sp * .3, vy = (hero ? 16 : 10) * (.6 + hash(k + j * 9) * .5);
      const y = Math.max(0, vy * u - 32 * u * u); _e.set(u * 9 * hash(j), u * 7, u * 5); _q.setFromEuler(_e); _m.compose(V(fx + vx * u, Y0 + y, Z_RUN + .4 + vz * u), _q, _s.set(.5, .5, .5)); splIM.setMatrixAt(n, _m); } }
  for (; n < 40; n++) { _m.makeScale(0, 0, 0); splIM.setMatrixAt(n, _m); }
  _s.set(1, 1, 1); splIM.instanceMatrix.needsUpdate = true;
}
// pose + placement; continuous = keep the root position on ones (used in the wrist macro so the insert does not judder)
function placeAki(t, o = {}) {
  const tq = twos(t), p = runPose(G, tq, Z_RUN);
  if (o.continuous) { const g = G.at(t); p.x = g.hipX; }
  if (o.raise) { p.armL = [1.45, -.55]; p.nod = .42; }
  p.y = Y0; p.blink = [3.6, 5.2].some(b => tq >= b && tq < b + .14);
  aki.pose(p); aki.root.visible = o.show !== false;
  return p;
}
function setCam(pos, look, fov, focus, aper, maxCoc = 16) {
  camera.position.copy(pos); camera.lookAt(look); camera.fov = fov; camera.updateProjectionMatrix();
  post.dof.focus = camera.position.distanceTo(focus); post.dof.aper = aper; post.dof.maxCoc = maxCoc;
}
const hipW = t => G.at(t).hipX;

// ——— shots ———
function S1(t, lt) {   // extreme macro at the puddle, low; the boot lands in it at 0.9375 s
  placeAki(t, { show: t > .3 && t < 1.9 });
  const push = eio(lt / 2.5);
  setCam(V(XP - 6.5 + push * .6, Y0 + 1.5, Z_RUN + 11.5 - push * .5), V(XP + .5, Y0 + 2.0, Z_RUN - 1), 36, V(XP, Y0 + .4, Z_RUN + .5), 1000, 18);
  setRain(t, XP, Z_RUN - 3, 26, 12, 16); setSplash(t);
}
function S2(t, lt) {   // tracking alongside, destination (the station tower) ahead
  placeAki(t);
  const x = hipW(t);
  setCam(V(x + 7, Y0 + 7, Z_RUN + 40), V(x + 10, Y0 + 5, Z_RUN - 2), 34, V(aki.root.position.x, Y0 + 7.5, Z_RUN), 650, 16);
  setRain(t, x + 10, Z_RUN + 6, 70, 40, 34); setSplash(t);
}
function S3(t, lt) {   // extreme macro on the watch: the printed tile swapped once a second
  const p = placeAki(t, { continuous: true, raise: true });
  aki.root.updateMatrixWorld(true);
  const wp = new THREE.Vector3(); aki.watch.getWorldPosition(wp);
  const sec = 41 + Math.floor(t - EV.watchHit); if (aki.watch.userData.sec !== sec) { aki.drawWatch(sec); aki.watch.userData.sec = sec; }
  setCam(V(wp.x + 1.2, wp.y + 1.6, wp.z + 6.2), V(wp.x - .1, wp.y + .1, wp.z), 30, wp, 900, 22);
  setRain(t, wp.x, wp.z - 8, 24, 10, wp.y + 12); setSplash(-10);
}
function S4(t, lt) {   // high wide over the whole desk: the scale reveal; the crane down begins; the clock lights on the chime
  placeAki(t);
  const d = eio(seg(lt, 0, .625)) * .06;
  setCam(V(-10, 150 - d * 120, 250 - d * 60), V(10, 6, -30), 30, V(95, ST.by + 25 * BRICK, -20), 260, 12);
  const u = t - EV.chime, pulse = u > 0 ? Math.exp(-u * 4) : 0;
  ST.clockM.emissiveIntensity = 1.2 + 2.5 * pulse; ST.clockL.intensity = 40 + 120 * pulse;
  setRain(t, -40, 0, 220, 80, 60); setSplash(-10);
}
const SH = { S1, S2, S3, S4 };
window.DUR = DUR;
window.render = t => {
  const [t0, , id] = shotAt(t);
  ST.clockM.emissiveIntensity = 1.2; ST.clockL.intensity = 40;
  if (id !== 'S3' && aki.watch.userData.sec !== 41) { aki.drawWatch(41); aki.watch.userData.sec = 41; }   // frame-independent: no state carried between frames
  SH[id](t, t - t0);
  post.composer.render();
};
// rig QA: the compass gait in the shared format (rig units, y down, ground = 0): planted foot = the stance foot
window.RIGQA = t => {
  const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const tq = twos(t); if (id === 'S1' && (tq <= .3 || tq >= 1.9)) return null;
  const g = G.at(tq), U = 100, hip = [g.hipX * U, -(g.bob + HIP) * U], leg = (th, planted) => { const ft = [hip[0] + Math.sin(th) * HIP * U, hip[1] + Math.cos(th) * HIP * U]; return { hip, knee: [(hip[0] + ft[0]) / 2, (hip[1] + ft[1]) / 2], ankle: ft, ball: ft, planted, target: [planted ? g.footX * U : 0, 0] }; };
  const p = runPose(G, tq), sh = [hip[0], hip[1] - 2.8 * U], arm = a => { const wr = [sh[0] + Math.sin(a) * ARM_L * U, sh[1] + Math.cos(a) * ARM_L * U]; return { sh, el: [(sh[0] + wr[0]) / 2, (sh[1] + wr[1]) / 2], wr }; };
  return { t, leg: { n: leg(g.legL, g.stance === 'L'), f: leg(g.legR, g.stance === 'R') }, arm: { n: arm(p.armL[0]), f: arm(p.armR[0]) }, adjust: [] };
};
window.READY = true;
