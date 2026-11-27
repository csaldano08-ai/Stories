// 012 · Tilt-Shift Miniature — the first 10 s of "Last Train Home" as a real-looking shopping street on a rainy night,
// photographed through a tilted lens so it reads as a tabletop model (lemo-opuscar styles/tilt-shift): a thin sharp band
// that follows the subject, everything above and below melting away, model-railway detail (shader windows with lit rooms,
// shopfronts, signs, lamps with light pools, umbrellas as tiny colour discs, cars with dark glass and contact shadows), a
// high vantage that dives toward AKI, the intimate exception at her height for the puddle and the watch. Real time (×1)
// throughout, so motion is silky (style: below ×2 the time-lapse stutter disappears). Night = the one low-saturation state;
// her vermilion coat is the one saturated thing in the sharp band. Engine: post.js (tilt-shift DoF + grade), geo.js and the
// facade material from city.js, copied unchanged from the style's demo. Page contract: window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { makePost } from './engine/post.js';
import { GB } from './engine/geo.js';
import { buildingMaterial, U, CURB } from './engine/facade.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { lerp, seg, ss, eio, eo, back, hash, clamp, mulberry } from './shared/lib/util.js';

const W = 1920, H = 1080, TAU = Math.PI * 2, V = (x, y, z) => new THREE.Vector3(x, y, z);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#0a0f1c'); scene.fog = new THREE.Fog('#0b1220', 120, 420);
const camera = new THREE.PerspectiveCamera(28, W / H, .05, 3000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, msaa: 4, ao: false });
post.bloom.strength = .3; post.bloom.threshold = 1.0; post.bloom.radius = .5;
const G = post.grade.uniforms; G.sat.value = 1.12; G.contrast.value = .28; G.warm.value = .25; G.amt.value = .38;   // night: the low-saturation state, warm lights
await Promise.all(['700 80px "Barlow SC"', '600 40px "Barlow SC"'].map(f => document.fonts.load(f)));
U.night.value = 1; U.lit.value = .55; U.sky.value.set('#2a3a5c');

// ——— the run (shared rig); AKI is a hero figure 25 % over life size so she reads (style rule) ———
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const KS = 1.3 * 1.65 / 600, LANE = -8.2, X0W = 0 - SPL.x * KS;   // her lane on the far pavement; the splash at x = 0
const wP = p => V(X0W + p[0] * KS, -p[1] * KS, LANE);
function poseAt(t, raise = 0) {
  const S = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  let w = clamp(up, 0, 1.1) * (1 - dn); w = Math.max(w, raise); S.watch = w;
  if (w > 0) { const J0 = solveProfile(S), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S.arms.f.sh *= 1 - .45 * wm; S.head += .26 * wm; S.neck += .08 * wm; }
  return S;
}

// ——— materials ———
const at = (m, p) => { m.position.copy(p); return m; };
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .8, ...o });
const glow = (c, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k) });
// a night environment for the wet sheen: dark sky, warm shop glow low on the horizon
{ const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#05080f'); g.addColorStop(.45, '#111a2c'); g.addColorStop(.52, '#5a4030'); g.addColorStop(.6, '#1a1410'); g.addColorStop(1, '#0a0807'); x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,${170 + (i % 3) * 30},${90 + (i % 4) * 30},.5)`; x.fillRect(hash(i) * 512, 118 + hash(i * 3) * 18, 6 + hash(i * 5) * 16, 4 + hash(i * 7) * 8); }
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(t).texture; scene.environmentIntensity = .55; }
scene.add(new THREE.HemisphereLight('#3a4a70', '#2a1c14', .55));
const moon = new THREE.DirectionalLight('#8ea2d0', .35); moon.position.set(-40, 80, 60); scene.add(moon);

// ——— the street (metres): road along x (z −6…6), the far pavement z −10…−6 with her lane, shops facing +z behind it ———
const R = mulberry(1212), XS0 = -90, XS1 = 140;
const gb = new GB(), gbPlain = new GB();
gbPlain.flat(XS0 - 60, XS1 + 60, -6, 6, 0, '#15161a');                               // asphalt (wet, glossy below)
gbPlain.flat(XS0 - 60, XS1 + 60, -10, -6, CURB, '#3a3a3e'); gbPlain.flat(XS0 - 60, XS1 + 60, 6, 10, CURB, '#3a3a3e');   // pavements
gbPlain.box(XS0 - 60, XS1 + 60, 0, CURB, -6.18, -6, '#56565a', '#56565a'); gbPlain.box(XS0 - 60, XS1 + 60, 0, CURB, 6, 6.18, '#56565a', '#56565a');
for (let x = XS0; x < XS1; x += 6) { gbPlain.flat(x, x + 3, -.08, .08, .005, '#bdb6a0'); }                               // worn centre line
for (let x = XS0; x < XS1; x += 1.2) gbPlain.flat(x, x + .03, -10, -6, CURB + .002, '#2e2e32');                          // paving joints
const SHOPS = []; const WORDS = ['24H', 'CAFE', 'BAKERY', 'BAR', 'BOOKS', 'PHARMACY', 'NOODLES', 'LAUNDRY', 'RECORDS', 'HOTEL', 'FLOWERS'];
const FACADE = ['#d9c3a0', '#c9784f', '#b85c45', '#e8c872', '#d8e2dc', '#a9c5c2', '#c8d0d8', '#9fb3c8', '#e3a58c', '#cfc6b8', '#8e9aa6', '#dcb67a'];
{ let x = XS0, i = 0; while (x < XS1) { const w = 8 + R() * 6, fl = 3 + Math.floor(R() * 3), h = CURB + fl * 3.2 + .6, col = FACADE[Math.floor(R() * FACADE.length)];
    gb.box(x, x + w, CURB, h, -22, -10, col, '#5f5c58', { facade: true, wp: [2.2 + R() * .6, 3.2, (Math.floor(R() * 4)) * 1000 + Math.floor(R() * 900)] });
    gbPlain.box(x + .2, x + w - .2, h, h + .5, -21.6, -10.4, '#4a4846', '#3e3c3a');                                     // parapet / roof clutter
    if (R() < .6) gbPlain.box(x + 1 + R() * (w - 4), x + 3 + R() * (w - 4), h + .5, h + 1.6, -18, -15, '#7a7672', '#6a6662');
    SHOPS.push({ x0: x, x1: x + w, h, word: WORDS[i % WORDS.length], i }); x += w + .05; i++; } }
// near side: low buildings, out of the band (they frame the bottom, blurred)
for (let x = XS0, i = 0; x < XS1; i++) { const w = 9 + R() * 6, h = CURB + 3.4 + R() * 3.2; gb.box(x, x + w, CURB, h, 10, 22, FACADE[(i * 5) % FACADE.length], '#5f5c58', { facade: true, wp: [2.4, 3.2, 1000 + i * 37] }); x += w + .05; }
const bmat = buildingMaterial(); scene.add(new THREE.Mesh(gb.build(), bmat));
const plain = new THREE.Mesh(gbPlain.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .38, metalness: .05 })); scene.add(plain);   // wet: low roughness
// shopfronts: warm lit interiors behind the ground-floor glass, awnings, a sign board with its word, a light pool on the paving
const canvasTex = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const poolTex = canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,190,120,.3)'); g.addColorStop(.5, 'rgba(255,170,100,.1)'); g.addColorStop(1, 'rgba(255,160,90,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const SIGNCOL = ['#ff5a3c', '#3cd0ff', '#ffd84a', '#ff4fa0', '#7cff6a', '#b48cff', '#ffffff'];
for (const s of SHOPS) {
  const w = s.x1 - s.x0, x0 = s.x0 + .6, x1 = s.x1 - 2.2, warm = new THREE.Color().setHSL(.08 + hash(s.i) * .05, .7, .62);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 2.4), new THREE.MeshBasicMaterial({ color: warm.clone().multiplyScalar(.72) })); win.position.set((x0 + x1) / 2, CURB + 1.4, -9.98); scene.add(win);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.3), new THREE.MeshBasicMaterial({ color: warm.clone().multiplyScalar(.42) })); door.position.set(s.x1 - 1.5, CURB + 1.15, -9.98); scene.add(door);
  const awn = new THREE.Mesh(new THREE.BoxGeometry(w - .4, .12, 1.3), M(['#2f5d50', '#7a2c2c', '#2c3e6a', '#6a5a2c'][s.i % 4], { roughness: .6 })); awn.position.set((s.x0 + s.x1) / 2, CURB + 3.05, -9.4); awn.rotation.x = -.25; scene.add(awn);
  const sc = SIGNCOL[s.i % SIGNCOL.length], tex = canvasTex(512, 128, (x, cw, ch) => { x.fillStyle = '#141418'; x.fillRect(0, 0, cw, ch); x.font = '700 92px "Barlow SC"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = sc; x.shadowColor = sc; x.shadowBlur = 18; x.fillText(s.word, cw / 2, ch / 2 + 6); });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(Math.min(w - 1.5, 5.2), 1.0, .2), [M('#222'), M('#222'), M('#222'), M('#222'), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.6, 1.6, 1.6) }), M('#222')]);
  sign.position.set((s.x0 + s.x1) / 2, CURB + 3.9, -9.85); scene.add(sign);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(w * .9, 4.4), poolMat); pool.rotation.x = -Math.PI / 2; pool.position.set((s.x0 + s.x1) / 2, CURB + .02, -7.9); scene.add(pool);
}
// street lamps on the pavement edge: dark poles, glowing heads, warm pools; the 4 nearest to the camera's subject light the scene
const LAMPS = []; for (let x = XS0 + 4; x < XS1; x += 17) LAMPS.push(x);
const poleG = new THREE.CylinderGeometry(.08, .1, 5.2, 8), headG = new THREE.SphereGeometry(.28, 12, 8), poleM = M('#1c1c20', { roughness: .4, metalness: .6 }), headM = glow('#ffd9a0', 2.2);
for (const x of LAMPS) { const p = new THREE.Mesh(poleG, poleM); p.position.set(x, CURB + 2.6, -6.6); scene.add(p); const hd = new THREE.Mesh(headG, headM); hd.position.set(x, CURB + 5.25, -6.6); scene.add(hd);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), poolMat); pool.rotation.x = -Math.PI / 2; pool.position.set(x, .03, -6.6); scene.add(pool); }
const PL = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight('#ffc98a', 55, 22, 2); scene.add(l); return l; });
// puddles: dark mirror-like patches; the hero puddle under her splash
const pudM = M('#0a0c12', { roughness: .04, metalness: .55, envMapIntensity: 1.6 });
const PUD = [[0, -7.7, 1.4, .7], [-14, -8.4, 1.0, .5], [21, -7.4, 1.6, .6], [38, -8.6, 1.1, .55], [9, -2.5, 2.4, 1.0], [-30, 1.8, 2.0, .9], [55, -3.2, 2.2, .9]];
for (const [x, z, rx, rz] of PUD) { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 36), pudM); m.rotation.x = -Math.PI / 2; m.scale.set(rx, rz, 1); m.position.set(x, (z < -6 ? CURB : 0) + .006, z); scene.add(m); }
// the clock tower at the end of the street (the last shot): plaster, a lit clock face showing 23:58
const TWX = 112, clockTex = canvasTex(512, 512, (x) => { x.fillStyle = '#fff4d8'; x.beginPath(); x.arc(256, 256, 250, 0, TAU); x.fill(); x.strokeStyle = '#1a1a1a'; x.lineCap = 'round';
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; x.lineWidth = k % 3 ? 8 : 16; x.beginPath(); x.moveTo(256 + Math.sin(a) * 200, 256 - Math.cos(a) * 200); x.lineTo(256 + Math.sin(a) * 236, 256 - Math.cos(a) * 236); x.stroke(); }
  const hh = (11 + 58 / 60) / 12 * TAU, mm = 58 / 60 * TAU; x.lineWidth = 22; x.beginPath(); x.moveTo(256, 256); x.lineTo(256 + Math.sin(hh) * 120, 256 - Math.cos(hh) * 120); x.stroke(); x.lineWidth = 14; x.beginPath(); x.moveTo(256, 256); x.lineTo(256 + Math.sin(mm) * 190, 256 - Math.cos(mm) * 190); x.stroke(); });
{ const t = new GB(); t.box(TWX - 4, TWX + 4, CURB, 34, -26, -18, '#d8cdb4', '#6a5a4a', { facade: true, wp: [2.6, 3.4, 2000 + 77] }); t.gable(TWX - 4.4, TWX + 4.4, -26.4, -17.6, 34, 4, '#7a4a3a', '#d8cdb4', false);
  scene.add(new THREE.Mesh(t.build(), bmat)); }
const clockM = new THREE.MeshBasicMaterial({ map: clockTex, color: new THREE.Color(1.3, 1.3, 1.3) }), clockFace = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), clockM); clockFace.position.set(TWX, 29, -17.95); scene.add(clockFace);
const CLOCKP = V(TWX, 29, -17.9);
// cars (real-time speed), with dark glass, head- and tail-lights and a soft contact shadow
const shadowTex = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
const shadowM = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
const CARS = [[-60, -3, 9.5, '#c8c8c8'], [10, -3, 9.5, '#2a4a7a'], [80, -3, 9.5, '#8a1c1c'], [40, 3, -10, '#e0d2a0'], [-20, 3, -10, '#3a3a3a'], [120, 3, -10, '#2f6a4a']].map(([x, z, v, col]) => {
  const g = new THREE.Group(); g.add(at(new THREE.Mesh(new THREE.BoxGeometry(4.3, .8, 1.8), M(col, { roughness: .25, metalness: .5 })), V(0, .62, 0)));
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.3, .6, 1.6), M('#0c1016', { roughness: .05, metalness: .7 })), V(-.2, 1.25, 0)));
  const dir = Math.sign(v), hl = glow('#fff2d0', 3), tl = glow('#ff2a1a', 2.4);
  for (const s of [-.6, .6]) { g.add(at(new THREE.Mesh(new THREE.BoxGeometry(.06, .16, .3), hl), V(2.16 * dir, .75, s))); g.add(at(new THREE.Mesh(new THREE.BoxGeometry(.06, .14, .3), tl), V(-2.16 * dir, .78, s))); }
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), shadowM); sh.rotation.x = -Math.PI / 2; sh.position.y = .02; g.add(sh);
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.2), poolMat); beam.rotation.x = -Math.PI / 2; beam.position.set(6.6 * dir, .03, 0); g.add(beam);
  scene.add(g); return { g, x, z, v }; });
// people under umbrellas (model-railway figures seen from above: a colour disc and a capsule)
const NP = 46, umbG = new THREE.ConeGeometry(.42, .22, 10), bodyG = new THREE.CapsuleGeometry(.15, .8, 4, 8);
const umb = new THREE.InstancedMesh(umbG, M('#ffffff', { roughness: .5 }), NP), bod = new THREE.InstancedMesh(bodyG, M('#3a3a44'), NP); scene.add(umb, bod);
const UCOL = ['#2c6ae8', '#f2c418', '#1a1a1e', '#2aa86a', '#f0f0f0', '#3a3a4a', '#8a9ab8'];   // no red: her coat is the one red in the band
const PEOPLE = Array.from({ length: NP }, (_, i) => ({ x: lerp(XS0, XS1, hash(i * 3.1)), z: hash(i * 5.7) < .5 ? lerp(-9.6, -6.6, hash(i * 7.3)) : lerp(6.6, 9.6, hash(i * 7.3)), v: (hash(i * 9.1) < .5 ? -1 : 1) * (1 + hash(i * 2.2) * .6), c: UCOL[i % UCOL.length] }));
PEOPLE.forEach((p, i) => umb.setColorAt(i, new THREE.Color(p.c)));
// rain: fine falling streaks in a box around the subject (real time: 7 m/s)
const NR = 5000, rainG = new THREE.BufferGeometry(), rainP = new Float32Array(NR * 6); rainG.setAttribute('position', new THREE.BufferAttribute(rainP, 3));
const rain = new THREE.LineSegments(rainG, new THREE.LineBasicMaterial({ color: '#b8c8e8', transparent: true, opacity: .42 })); rain.frustumCulled = false; scene.add(rain);
function rainAt(t, c, size) { for (let i = 0; i < NR; i++) { const x = c.x + (hash(i * 1.3) - .5) * size, z = c.z + (hash(i * 2.7) - .5) * size, y0 = hash(i * 4.1) * 30, y = ((y0 - t * 7) % 30 + 30) % 30, L = .5;
  rainP.set([x, y, z, x + .06, y + L, z], i * 6); } rainG.attributes.position.needsUpdate = true; }

// ——— AKI: soft capsules on the rig's joints (a hero figure with a gentle sheen) ———
const AK = {}, AM = { coat: M('#d8402a', { roughness: .5 }), coatD: M('#a83020', { roughness: .55 }), trou: M('#34343e', { roughness: .65 }), boot: M('#5a3a26', { roughness: .45 }), skin: M('#f0c2a0', { roughness: .55 }), hair: M('#4a2a48', { roughness: .4 }), knit: M('#efe3cc', { roughness: .8 }), gold: M('#e0b050', { roughness: .25, metalness: .8 }) };
const UPV = V(0, 1, 0), _d = new THREE.Vector3();
// each capsule is built at its bone's constant length (rig: thigh 150, shin 144, upper arm 108, forearm 92, neck 30), then only placed and oriented
function cap(r, Lu, mat) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Lu * KS, 4, 12), mat); scene.add(m); return m; }
function bone(m, a, b) { _d.subVectors(b, a); const L = _d.length() || 1; m.position.copy(a).addScaledVector(_d, .5); m.quaternion.setFromUnitVectors(UPV, _d.multiplyScalar(1 / L)); }
['thF', 'shF', 'thN', 'shN'].forEach((k, i) => AK[k] = cap(i % 2 ? .055 : .07, i % 2 ? 144 : 150, AM.trou));
['uaF', 'faF'].forEach((k, i) => AK[k] = cap(i ? .045 : .052, i ? 92 : 108, AM.coatD)); ['uaN', 'faN'].forEach((k, i) => AK[k] = cap(i ? .046 : .054, i ? 92 : 108, AM.coat));
AK.bootF = new THREE.Mesh(new THREE.BoxGeometry(.2, .09, .1), AM.boot); AK.bootN = new THREE.Mesh(new THREE.BoxGeometry(.2, .09, .1), AM.boot); scene.add(AK.bootF, AK.bootN);
AK.coat = new THREE.Mesh(new THREE.CylinderGeometry(.13, .2, 1, 14, 1), AM.coat); AK.hem = new THREE.Mesh(new THREE.CylinderGeometry(.2, .26, 1, 14, 1, true), AM.coat); AK.hem.material = AM.coat; scene.add(AK.coat, AK.hem);
AK.neck = cap(.035, 30, AM.skin); AK.collar = new THREE.Mesh(new THREE.TorusGeometry(.065, .03, 8, 16), AM.knit); scene.add(AK.collar);
AK.head = new THREE.Mesh(new THREE.SphereGeometry(.105, 20, 14), AM.skin); AK.hair = new THREE.Mesh(new THREE.SphereGeometry(.118, 20, 14, Math.PI * .85, Math.PI * 1.3, 0, Math.PI * .62), AM.hair); AK.bob = new THREE.Mesh(new THREE.CapsuleGeometry(.07, .12, 4, 10), AM.hair); scene.add(AK.head, AK.hair, AK.bob);
AK.handF = new THREE.Mesh(new THREE.SphereGeometry(.048, 10, 8), AM.skin); AK.handN = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), AM.skin); scene.add(AK.handF, AK.handN);
AK.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .8), shadowM); AK.shadow.rotation.x = -Math.PI / 2; scene.add(AK.shadow);
// the watch: a gold case and a dial canvas (23:58, the second hand ticking once a second)
const dialC = document.createElement('canvas'); dialC.width = dialC.height = 256; const dialT = new THREE.CanvasTexture(dialC); dialT.colorSpace = THREE.SRGBColorSpace;
let dialSec = -1; function drawDial(sec) { if (sec === dialSec) return; dialSec = sec; const x = dialC.getContext('2d'); x.fillStyle = '#fff6e0'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#1a1414'; x.lineCap = 'round';
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; x.lineWidth = k % 3 ? 4 : 9; x.beginPath(); x.moveTo(128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); x.lineTo(128 + Math.sin(a) * 116, 128 - Math.cos(a) * 116); x.stroke(); }
  x.fillStyle = '#1a1414'; x.font = '600 34px "Barlow SC"'; x.textAlign = 'center'; x.textBaseline = 'middle'; [['12', 0], ['3', 1], ['6', 2], ['9', 3]].forEach(([n, i]) => { const a = i / 4 * TAU; x.fillText(n, 128 + Math.sin(a) * 74, 130 - Math.cos(a) * 74); });
  const mm = 58 + sec / 60, hh = (11 + mm / 60) / 12 * TAU, ma = mm / 60 * TAU, sa = sec / 60 * TAU;
  x.lineWidth = 11; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(hh) * 52, 128 - Math.cos(hh) * 52); x.stroke(); x.lineWidth = 7; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(ma) * 84, 128 - Math.cos(ma) * 84); x.stroke();
  x.strokeStyle = '#d0402c'; x.lineWidth = 3; x.beginPath(); x.moveTo(128 - Math.sin(sa) * 20, 128 + Math.cos(sa) * 20); x.lineTo(128 + Math.sin(sa) * 100, 128 - Math.cos(sa) * 100); x.stroke(); x.fillStyle = '#1a1414'; x.beginPath(); x.arc(128, 128, 7, 0, TAU); x.fill(); dialT.needsUpdate = true; }
drawDial(41);
const watch = new THREE.Group(); watch.add(new THREE.Mesh(new THREE.CylinderGeometry(.034, .034, .016, 24), AM.gold)); const dial = new THREE.Mesh(new THREE.CircleGeometry(.028, 32), new THREE.MeshBasicMaterial({ map: dialT, color: new THREE.Color(.95, .95, .95) }));
dial.rotation.x = -Math.PI / 2; dial.position.y = .0085; watch.children[0].add(dial); watch.children[0].rotation.x = Math.PI / 2; scene.add(watch);
// a few raindrops sitting on the crystal (for the close-up)
for (const [u, v, r] of [[-.012, .01, .003], [.009, -.012, .0022], [.014, .012, .0016]]) { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 6), M('#dfe8ff', { roughness: .02, metalness: .1, transparent: true, opacity: .55 })); d.position.set(u, .011, v); d.scale.y = .5; watch.children[0].add(d); }
function placeAki(S, t, hide = false) {
  const J = solveProfile(S), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, t);
  for (const k in AK) { const o = AK[k]; o.visible = !hide; }
  if (hide) { watch.visible = false; return J; } watch.visible = true;
  const Z = (k, d) => { const p = wP(k); p.z += d; return p; };
  for (const [s, dz] of [['f', -.09], ['n', .09]]) { const l = J.leg[s]; bone(AK['th' + s.toUpperCase()], Z(l.hip, dz), Z(l.knee, dz)); bone(AK['sh' + s.toUpperCase()], Z(l.knee, dz), Z(l.ankle, dz));
    const b = s === 'f' ? AK.bootF : AK.bootN; b.position.copy(Z(l.ankle, dz)).add(V(.06 * Math.cos(l.pitch), -.03 - .06 * Math.sin(l.pitch), 0)); b.rotation.set(0, 0, -l.pitch); }
  for (const [s, dz] of [['f', -.14], ['n', .14]]) { const a = J.arm[s]; bone(AK['ua' + s.toUpperCase()], Z(a.sh, dz), Z(a.el, dz)); bone(AK['fa' + s.toUpperCase()], Z(a.el, dz), Z(a.wr, dz));
    const h = s === 'f' ? AK.handF : AK.handN, wr = Z(a.wr, dz), el = Z(a.el, dz); h.position.copy(wr).addScaledVector(_d.subVectors(wr, el).normalize(), .04); }
  const pv = wP(J.pelvis), nb = wP(J.neckBase); AK.coat.position.copy(pv).lerp(nb, .5); AK.coat.quaternion.setFromUnitVectors(UPV, _d.subVectors(nb, pv).normalize()); AK.coat.scale.set(1, pv.distanceTo(nb) * 1.05, 1);
  const hb = sc.hemB; AK.hem.position.copy(pv).addScaledVector(_d, -.12); AK.hem.quaternion.setFromUnitVectors(UPV, _d.clone().add(V(clamp(-hb[0] * .004, -.4, .4), 0, 0)).normalize()); AK.hem.scale.set(1, .26, 1);
  bone(AK.neck, nb, wP(J.neckTop)); AK.collar.position.copy(nb); AK.collar.quaternion.setFromUnitVectors(V(0, 0, 1), _d.subVectors(wP(J.neckTop), nb).normalize());
  const hc = wP([J.headC[0], J.headC[1] - 6]); AK.head.position.copy(hc); AK.head.rotation.set(0, 0, -J.headA);
  AK.hair.position.copy(hc).add(V(-.012, .012, 0)); AK.hair.rotation.set(0, Math.PI, J.headA * .5);
  const lag = sc.hair.back; AK.bob.position.copy(hc).add(V(-.07 + clamp(lag[0] * KS * .4, -.06, 0), -.06, 0)); AK.bob.rotation.set(0, 0, -J.headA + .2);
  const an = J.arm.n, wr = Z(an.wr, .14), el = Z(an.el, .14), dir = _d.subVectors(wr, el).normalize().clone();
  watch.position.copy(wr).addScaledVector(dir, -.05).add(V(0, 0, .055)); watch.rotation.set(0, 0, Math.atan2(dir.y, dir.x));   // 3 o'clock (the crown) toward her hand, 12 across the wrist
  AK.shadow.position.set(pv.x, CURB + .015, LANE);
  return J;
}
// the splash: drops on sticks of time, rings opening in the hero puddle; rain rings on the puddle
const dropM = M('#dfe8ff', { roughness: .05, metalness: .1, transparent: true, opacity: .8 }), drops = new THREE.InstancedMesh(new THREE.SphereGeometry(.035, 8, 6), dropM, 40); scene.add(drops);
const ringM = new THREE.MeshBasicMaterial({ color: '#c8d4f0', transparent: true, opacity: .7 }), rings = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.TorusGeometry(1, .012, 6, 48), ringM); r.rotation.x = Math.PI / 2; scene.add(r); return r; });
const rrM = new THREE.MeshBasicMaterial({ color: '#9fb0d0', transparent: true, opacity: .45 }), rr = Array.from({ length: 10 }, () => { const r = new THREE.Mesh(new THREE.TorusGeometry(1, .006, 5, 32), rrM); r.rotation.x = Math.PI / 2; scene.add(r); return r; });
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
function splashAt(t) {
  const u = t - SPL.t0, p0 = V(X0W + (SPL.x + 24) * KS, CURB + .01, LANE + .1); let n = 0;
  if (u > 0 && u < .8) for (let j = 0; j < 40; j++) { const a = Math.PI * (.12 + .76 * hash(j * 7.1)), az = (hash(j * 2.3) - .5) * 2.4, sp = 2.4 * (.45 + .7 * hash(j * 3.3)), x = p0.x + Math.cos(a) * Math.cos(az) * sp * u * (hash(j) < .5 ? -1 : 1), z = p0.z + Math.sin(az) * sp * u * .6, y = p0.y + Math.sin(a) * sp * u * 1.3 - 4.9 * u * u;
    if (y < p0.y) continue; _m.compose(V(x, y, z), _q, _s.set(1, 1, 1).multiplyScalar(.6 + .7 * hash(j * 1.9))); drops.setMatrixAt(n++, _m); }
  drops.count = n; drops.instanceMatrix.needsUpdate = true;
  rings.forEach((r, k) => { const v = u - k * .14; r.visible = v > 0 && v < 1.2; if (r.visible) { r.position.set(p0.x, CURB + .012, p0.z - .3); const s = .15 + 1.2 * eo(v / 1.2); r.scale.set(s, s * .55, 1); r.material.opacity = .7 * (1 - v / 1.2); } });
  rr.forEach((r, k) => { const per = .55, ph = hash(k * 4.3) * per, age = ((t + ph) % per) / per, cyc = Math.floor((t + ph) / per); r.position.set((hash(k * 7.1 + cyc) - .5) * 2.2, CURB + .011, -7.7 + (hash(k * 5.3 + cyc) - .5) * 1.0); const s = .04 + .3 * age; r.scale.set(s, s, 1); });
}

// ——— cameras (smooth, on ones); the band follows the subject ———
const BAND = (w, amp, mix, tilt = 0) => ({ w, amp, mix, tilt, pow: 1.3 });
function cam(t) {
  const id = shotAt(t)[2]; let pos, look, fov = 28, band, follow, aper = 4000; G.expo.value = 1;
  if (id === 'S1') {   // the intimate exception: at the puddle, at her height; a blurred kerb in the foreground
    look = V(.4 + .05 * t, .3, -7.9); pos = V(-1.9 + .05 * t, .42, -3.8); fov = 34; G.expo.value = .8; band = BAND(.05, 30, .35); follow = V(0, CURB, -7.7); aper = 160;
  } else if (id === 'S2') {   // high oblique, the band on her; a slow dive toward her as the watch moment approaches
    const p = wP(RUN.pelvisAt(t)); p.y = 1.1; const k = eio(seg(t, 4.6, 7.5)), d = lerp(1, .36, k);
    look = p.clone().add(V(1.6, 0, 0)); pos = look.clone().add(V(-5 * d, 25 * d + 2, 22 * d)); fov = lerp(27, 30, k); band = BAND(lerp(.05, .07, k), 30, .55); follow = p; aper = lerp(6000, 1400, k);
  } else if (id === 'S3') {   // her wrist at its height, the band a sliver on the watch
    const w = watch.getWorldPosition(V(0, 0, 0)), bob = .004 * Math.sin((t - FIRST_STEP) * CADENCE * Math.PI);
    look = w.clone().add(V(0, bob, 0)); pos = w.clone().add(V(.06, .07 + bob, .42)); fov = 30; band = BAND(.03, 30, .45); follow = w; aper = 40;
  } else {   // high wide over the roofs to the clock tower; the descent begins
    const k = eio(seg(t, 9.375, 10.3)); look = CLOCKP.clone().add(V(-4, -6 - 3 * k, 0)); pos = look.clone().add(V(-26, 30 - 6 * k, 64)); fov = 30; band = BAND(.07, 28, .6); follow = CLOCKP; aper = 9000;
  }
  camera.position.copy(pos); camera.fov = fov; camera.near = pos.y < 3 ? .03 : .5; camera.updateProjectionMatrix(); camera.lookAt(look); camera.updateMatrixWorld();
  const pr = follow.clone().project(camera); band.y = clamp((pr.y + 1) / 2, .2, .8);
  const d = post.dof; d.focus = pos.distanceTo(follow); d.aper = aper; d.maxCoc = 28; Object.assign(d.band, band);
  return { id, look };
}

function frame(t) {
  const id = shotAt(t)[2];
  // actors first (the band reads their positions), then the camera
  const S = poseAt(t, id === 'S3' ? 1 : 0); placeAki(S, t, id === 'S1' && (t < .3 || t > 1.95));
  if (id === 'S3') drawDial(41 + Math.floor(t - EV.watchHit));
  for (const c of CARS) { c.g.position.set(c.x + c.v * t, 0, c.z); c.g.rotation.y = c.v > 0 ? 0 : Math.PI; }
  PEOPLE.forEach((p, i) => { const x = p.x + p.v * t, bobY = .03 * Math.abs(Math.sin(t * 6 + i)); _m.compose(V(x, CURB + 1.65 + bobY, p.z), _q, _s.set(1, 1, 1)); umb.setMatrixAt(i, _m); _m.compose(V(x, CURB + .62 + bobY, p.z), _q, _s.set(1, 1, 1)); bod.setMatrixAt(i, _m); });
  umb.instanceMatrix.needsUpdate = bod.instanceMatrix.needsUpdate = true;
  splashAt(t);
  const c = cam(t);
  // the four lamps nearest to what we look at light the scene (fixed per frame: no state carried between frames)
  const near = LAMPS.map(x => [x, Math.abs(x - c.look.x)]).sort((a, b) => a[1] - b[1]).slice(0, 4);
  PL.forEach((l, i) => { l.position.set(near[i][0], CURB + 5.0, -6.6); l.intensity = 55; });
  clockM.color.setScalar(id === 'S4' && t > EV.chime ? 1.3 + 1.6 * Math.exp(-(t - EV.chime) / .45) : 1.3);
  rainAt(t, c.look, id === 'S3' || id === 'S1' ? 8 : 70);
  post.composer.render();
}
window.DUR = DUR; window.render = t => frame(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id === 'S1') { if (t <= .3 || t >= 1.95) return null; } else if (id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
frame(0);
window.READY = true;
