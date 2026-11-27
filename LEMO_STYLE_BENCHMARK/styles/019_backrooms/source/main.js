// 019 · Liminal Found Footage — the first 10 s of "Last Train Home" as a 1990s-style consumer camcorder recording made by
// AKI herself while she runs through an empty, fluorescent-lit underground station arcade toward the last train
// (lemo-opuscar styles/backrooms, renamed here by its grammar only: an original place, original notices, no folklore names).
// 4:3 pillarboxed, rendered at 720×540 and passed through the style's VHS camcorder shader (line jitter, head-switching band,
// chroma smear, AGC noise, barrel, drifting white balance) with its dot-matrix OSD. Flat light from a grid of ceiling panels
// (no shadows), fog that follows the light, a pale institutional green, exactly one saturated hue: the red of the departure
// board (her vermilion sleeve rhymes with it). The cuts keep their times and happen where the tape breaks (tracking tears).
// This is a stylistic recreation, not footage: nothing in it claims to be real (no date stamp).
// Engine: vhs.js and osd.js copied unchanged from the style's demo; the post chain is the library's core/three/post.js.
// Page contract: window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { VHS } from './engine/vhs.js';
import { drawOSD } from './engine/osd.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { lerp, seg, ss, eio, eo, back, hash, clamp, mulberry, vnoise } from './shared/lib/util.js';

const W = 1920, H = 1080, SW = 720, SH = 540, TAU = Math.PI * 2, V = (x, y, z) => new THREE.Vector3(x, y, z);
await Promise.all(['700 60px "Barlow SC"', '600 40px "Barlow SC"'].map(f => document.fonts.load(f)));
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = .85;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0, 0, 0);
const camera = new THREE.PerspectiveCamera(40, 4 / 3, .03, 120); camera.rotation.order = 'YXZ';
const post = makePost(renderer, scene, camera, SW, SH, { ssaa: 1, ao: false });
post.bloom.strength = .5; post.bloom.radius = .55; post.bloom.threshold = 1.1;
post.vig.uniforms.amt.value = 0; post.vig.uniforms.contrast.value = 0; post.vig.uniforms.sat.value = 1; post.dof.maxCoc = 14;
const osdCv = document.createElement('canvas'); osdCv.width = SW; osdCv.height = SH;
const osdTex = new THREE.CanvasTexture(osdCv); osdTex.minFilter = osdTex.magFilter = THREE.LinearFilter; osdTex.generateMipmaps = false;
const vhs = new ShaderPass(VHS); vhs.uniforms.tOSD.value = osdTex; vhs.uniforms.res.value = [W, H]; vhs.uniforms.src.value = [SW, SH]; post.composer.addPass(vhs);

// ——— her run (shared rig), in metres: the arcade runs along −z; the operator's eye is her eye ———
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const KS = 1.65 / 600, Z0 = -2;                                  // the splash lands at z = −2
const zOf = x => Z0 - (x - SPL.x) * KS;
function poseAt(t, raise = 0) {
  const S = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  let w = clamp(up, 0, 1.1) * (1 - dn); w = Math.max(w, raise); S.watch = w;
  if (w > 0) { const J0 = solveProfile(S), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S.arms.f.sh *= 1 - .45 * wm; S.head += .26 * wm; S.neck += .08 * wm; }
  return S;
}

// ——— the arcade: x −3.2…3.2, ceiling 3.0 m, panels every 2.4 m in two rows; flat light summed from the nearest panels ———
const HX = 3.2, HC = 3.0, LZ = 2.4, NL = 48, Z_END = -44;
const U = { uI: { value: new Float32Array(NL * 2) }, uFog: { value: new THREE.Color('#b8c2a6') }, uFogG: { value: 1 }, uPud: { value: [] }, uTime: { value: 0 } };
const PUD = [[-.12, Z0 + .05, .55, .38], [1.4, -9.5, .9, .5], [-1.6, -16, .7, .45], [.6, -23, 1.1, .5], [-.8, -31, .8, .4], [1.0, -38, .7, .4]];
U.uPud.value = PUD.map(p => new THREE.Vector4(...p));
const LIGHTING = `
  uniform float uI[${NL * 2}]; uniform vec3 uFog; uniform float uFogG; uniform vec4 uPud[6]; uniform float uTime;
  varying vec3 vW; varying vec3 vN;
  float hh(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  vec3 light(vec3 P, vec3 N, vec3 Vd, float spec, float shin){
    vec3 acc = vec3(0.); float k0 = floor(-P.z / ${LZ.toFixed(1)});
    for (int dk = -4; dk <= 4; dk++){ float k = k0 + float(dk); if (k < 0. || k > ${NL - 1}.) continue;
      for (int r = 0; r < 2; r++){ float lx = r == 0 ? -1.3 : 1.3; vec3 L = vec3(lx, ${HC.toFixed(2)} - .02, -(k + .5) * ${LZ.toFixed(1)}) - P; float d2 = dot(L, L); vec3 l = L * inversesqrt(d2);
        float I = uI[int(k) * 2 + r]; float em = max(0., l.y);                 // the panel faces down: its cosine toward a point below
        acc += I * em * max(0., dot(N, l)) / (d2 + .35) * vec3(1., .985, .94);
        if (spec > 0.) { vec3 hv = normalize(l + Vd); acc += I * em * spec * pow(max(0., dot(N, hv)), shin) / (d2 * .25 + .2); } } }
    return acc * 1.25 + vec3(.06, .065, .055);
  }
  vec3 fogged(vec3 c, vec3 P){ float d = length(P - cameraPosition); float f = 1. - exp(-d * .042); return mix(c, uFog * uFogG * .22, f); }`;
const VSH = `varying vec3 vW; varying vec3 vN; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
function lit(fs, extra = {}, o = {}) { return new THREE.ShaderMaterial({ uniforms: { ...U, ...extra }, vertexShader: VSH, fragmentShader: 'varying vec2 vUv;\n' + LIGHTING + fs, ...o }); }
// pale institutional green wall tile with a darker trim band and a tide-mark at the foot; terrazzo floor (wet in the puddles); ceiling tiles
const wallM = lit(`void main(){ vec3 c = vec3(.62, .70, .60); vec2 g = vec2(vW.z, vW.y) / vec2(.3, .15); vec2 f = fract(g);
  c *= 1. - .18 * (step(f.x, .04) + step(f.y, .06)); c *= .94 + .1 * hh(floor(g));
  if (vW.y < .32) c = vec3(.30, .32, .27); if (vW.y > .32 && vW.y < .45) c *= .85 + .15 * smoothstep(.32, .45, vW.y);
  if (vW.y > 2.7) c *= .82;
  vec3 Vd = normalize(cameraPosition - vW); gl_FragColor = vec4(fogged(c * light(vW, normalize(vN), Vd, .12, 30.), vW), 1.); }`);
const floorM = lit(`void main(){ vec3 c = vec3(.58, .54, .45); vec2 g = vW.xz / .6; vec2 f = fract(g); c *= 1. - .22 * (step(f.x, .025) + step(f.y, .025));
  c *= .9 + .14 * hh(floor(g)) + .06 * hh(floor(vW.xz * 23.));
  float pud = 0.; for (int i = 0; i < 6; i++){ vec2 q = (vW.xz - uPud[i].xy) / uPud[i].zw; float e = dot(q, q) + .25 * (hh(floor(vW.xz * 9.)) - .5) * .4; pud = max(pud, smoothstep(1., .82, e)); }
  vec3 Vd = normalize(cameraPosition - vW); vec3 col = c * light(vW, vec3(0., 1., 0.), Vd, .35 + 2.2 * pud, mix(24., 220., pud));
  col *= mix(1., .28, pud);
  gl_FragColor = vec4(fogged(col, vW), mix(1., .66, pud)); }`, {}, { transparent: true, depthWrite: true });
const ceilM = lit(`void main(){ vec3 c = vec3(.84, .83, .78); vec2 g = vec2(vW.x - .3, vW.z) / .6; vec2 f = fract(g); c *= 1. - .25 * (step(f.x, .03) + step(f.y, .03)); c *= .93 + .08 * hh(floor(g)) - .2 * step(.985, hh(floor(g) + 3.));
  vec3 Vd = normalize(cameraPosition - vW); gl_FragColor = vec4(fogged(c * light(vW, vec3(0., -1., 0.), Vd, 0., 1.), vW), 1.); }`);
const shutterM = lit(`void main(){ vec3 c = vec3(.66, .66, .62) * (.82 + .18 * step(.5, fract(vW.y / .09))); c *= .95 + .08 * hh(vec2(floor(vW.y / .09), floor(vW.z)));
  vec3 Vd = normalize(cameraPosition - vW); gl_FragColor = vec4(fogged(c * light(vW, normalize(vN), Vd, .3, 40.), vW), 1.); }`);
const L = HX * 2, LEN = -Z_END + 8;
const add = (geo, mat, p, r = [0, 0, 0]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); scene.add(m); return m; };
add(new THREE.PlaneGeometry(L, LEN), floorM, [0, 0, -LEN / 2 + 6], [-Math.PI / 2, 0, 0]).renderOrder = 2;
add(new THREE.PlaneGeometry(L, LEN), ceilM, [0, HC, -LEN / 2 + 6], [Math.PI / 2, 0, 0]);
add(new THREE.PlaneGeometry(LEN, HC), wallM, [-HX, HC / 2, -LEN / 2 + 6], [0, Math.PI / 2, 0]);
add(new THREE.PlaneGeometry(LEN, HC), wallM, [HX, HC / 2, -LEN / 2 + 6], [0, -Math.PI / 2, 0]);
add(new THREE.PlaneGeometry(L, HC), wallM, [0, HC / 2, Z_END - .01]);            // the end wall (stairs down to the platforms)
add(new THREE.PlaneGeometry(L, HC), wallM, [0, HC / 2, 6], [0, Math.PI, 0]);
// light panels (emissive, the light texture's intensity), recessed in the ceiling
const panelG = new THREE.PlaneGeometry(.6, 1.2), PANELS = [];
for (let k = 0; k < NL; k++) for (let r = 0; r < 2; r++) { const m = new THREE.Mesh(panelG, new THREE.MeshBasicMaterial({ color: new THREE.Color(1, .99, .95) })); m.position.set(r ? 1.3 : -1.3, HC - .005, -(k + .5) * LZ); m.rotation.x = Math.PI / 2; scene.add(m); PANELS.push(m); }
// per-panel character: a few % warm / cool / green, a few dead, a few flickering
const PCH = Array.from({ length: NL * 2 }, (_, i) => ({ base: .9 + .2 * hash(i * 3.1), dead: hash(i * 7.7) < .05, flick: hash(i * 5.3) < .06, tint: [1 + (hash(i) - .5) * .06, 1 + (hash(i * 2) - .5) * .04, 1 + (hash(i * 4) - .5) * .08] }));
// shop units: roller shutters down, some with a lit lightbox sign (off-white plastic, dark letters: not saturated), a taped notice
const canvasTex = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const WORDS = ['24H', 'CAFE', 'BAKERY', 'BOOKS', 'NOODLES', 'LAUNDRY', 'RECORDS', 'FLOWERS', 'PHARMACY', 'HOTEL'];
for (let i = 0, z = 1.5; z > Z_END + 4; i++, z -= 5.6) for (const side of [-1, 1]) {
  const x = side * (HX - .01), j = i * 2 + (side > 0 ? 1 : 0), ry = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  add(new THREE.PlaneGeometry(4.2, 2.3), shutterM, [x - side * .005, 1.15, z - 2.4], [0, ry, 0]);
  const word = j === 1 ? '24H' : j === 3 ? 'CAFE' : WORDS[(j + 3) % WORDS.length], lit = hash(j * 2.7) < .75 || j < 4;
  const tex = canvasTex(512, 96, (x2, w, h) => { x2.fillStyle = '#ecebe2'; x2.fillRect(0, 0, w, h); x2.fillStyle = '#2a2a2a'; x2.font = '700 64px "Barlow SC"'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText(word, w / 2, h / 2 + 4); });
  const face = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(lit ? 1.15 : .3, lit ? 1.15 : .3, lit ? 1.1 : .3) }), dark = new THREE.MeshBasicMaterial({ color: '#3a3a38' });
  add(new THREE.BoxGeometry(.16, .5, 2.8), [dark, dark, dark, dark, dark, dark], [x - side * .08, 2.62, z - 2.4]);
  add(new THREE.PlaneGeometry(2.8, .5), face, [x - side * .165, 2.62, z - 2.4], [0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]);   // the lit face, toward the corridor
}
// a printed notice taped to a shutter (original text; laser print on yellowed paper)
const noticeT = canvasTex(400, 520, (x, w, h) => { x.fillStyle = '#ece3c4'; x.fillRect(0, 0, w, h); x.fillStyle = '#222'; x.font = '700 34px "Barlow SC"'; x.fillText('NOTICE', 30, 60); x.font = '600 20px "Barlow SC"'; x.fillText('FORM SA-12  REV. 4', 30, 92);
  ['1. The arcade closes at 00:00.', '2. The last train leaves at 23:59.', '3. Do not run on wet floors.', '4. If the lights go out, keep walking', '    toward the red board.', '', 'Thank you for your cooperation.', '— Station Management'].forEach((l, i) => x.fillText(l, 30, 150 + i * 36)); });
add(new THREE.PlaneGeometry(.42, .55), new THREE.MeshBasicMaterial({ map: noticeT, color: new THREE.Color(.75, .73, .66) }), [-HX + .02, 1.45, -12.4], [0, Math.PI / 2, -.03]);
// the end wall: the red LED departure board (the one saturated thing, it blooms) and the station clock above the stairs
const boardT = canvasTex(1024, 192, (x, w, h) => { x.fillStyle = '#100404'; x.fillRect(0, 0, w, h); x.fillStyle = '#ff3a1c'; x.font = '700 96px "Barlow SC"'; x.textBaseline = 'middle'; x.fillText('LAST TRAIN', 40, 96); x.textAlign = 'right'; x.fillText('23:59', w - 40, 96); });
const boardM = new THREE.MeshBasicMaterial({ map: boardT, color: new THREE.Color(2.6, 2.6, 2.6) }); add(new THREE.PlaneGeometry(2.6, .48), boardM, [0, 2.05, Z_END + .02]);
const clockT = canvasTex(256, 256, (x) => { x.fillStyle = '#f2f0e6'; x.beginPath(); x.arc(128, 128, 124, 0, TAU); x.fill(); x.strokeStyle = '#141414'; x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 121, 0, TAU); x.stroke(); x.lineCap = 'round';
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; x.lineWidth = k % 3 ? 4 : 8; x.beginPath(); x.moveTo(128 + Math.sin(a) * 98, 128 - Math.cos(a) * 98); x.lineTo(128 + Math.sin(a) * 114, 128 - Math.cos(a) * 114); x.stroke(); }
  const hh = (11 + 58 / 60) / 12 * TAU, mm = 58 / 60 * TAU; x.lineWidth = 11; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(hh) * 58, 128 - Math.cos(hh) * 58); x.stroke(); x.lineWidth = 7; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(mm) * 92, 128 - Math.cos(mm) * 92); x.stroke(); });
const clockM = new THREE.MeshBasicMaterial({ map: clockT, color: new THREE.Color(.95, .95, .92) }); add(new THREE.CircleGeometry(.42, 40), clockM, [0, 2.62, Z_END + .03]);
add(new THREE.PlaneGeometry(2.2, 1.8), new THREE.MeshBasicMaterial({ color: '#050505' }), [0, .9, Z_END + .015]);   // the dark mouth of the stairs down
// the puddles mirror what hangs above them: the signs, the board, the panels (a mirrored copy under the floor, seen through the wet patches)
const mirror = new THREE.Group(); mirror.scale.y = -1; scene.add(mirror);
scene.children.filter(o => o.isMesh && o.material && o.material.isMeshBasicMaterial && o.position.y > 1).forEach(o => { const c = o.clone(); if (!Array.isArray(c.material)) { c.material = c.material.clone(); c.material.color.multiplyScalar(.45); } mirror.add(c); });
// her own body as the operator sees it: the boots when she looks down, the left forearm with the watch when she looks at it
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, ...o });
scene.add(new THREE.HemisphereLight('#dfe6d0', '#3a3428', 1.1));
const bootG = new THREE.BoxGeometry(.11, .12, .27); bootG.translate(0, .06, .05);
const BOOT = [M('#7a4e30', { roughness: .32 }), M('#7a4e30', { roughness: .32 })].map(m => add(bootG, m, [0, 0, 0]));
const TROU = [0, 1].map(() => add(new THREE.CylinderGeometry(.06, .065, .5, 10), M('#34343c'), [0, 0, 0]));
const ARM = add(new THREE.CapsuleGeometry(.045, 92 * KS, 4, 10), M('#c8402c', { roughness: .7 }), [0, 0, 0]);
const HAND = add(new THREE.SphereGeometry(.036, 12, 10), M('#f0c8a8'), [0, 0, 0]); HAND.scale.set(1, .8, 1.25);
const dialC = document.createElement('canvas'); dialC.width = dialC.height = 256; const dialT = new THREE.CanvasTexture(dialC); dialT.colorSpace = THREE.SRGBColorSpace;
let dialSec = -1; function drawDial(sec) { if (sec === dialSec) return; dialSec = sec; const x = dialC.getContext('2d'); x.fillStyle = '#f6efd8'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#1a1414'; x.lineCap = 'round';
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; x.lineWidth = k % 3 ? 4 : 9; x.beginPath(); x.moveTo(128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); x.lineTo(128 + Math.sin(a) * 116, 128 - Math.cos(a) * 116); x.stroke(); }
  x.fillStyle = '#1a1414'; x.font = '600 34px "Barlow SC"'; x.textAlign = 'center'; x.textBaseline = 'middle'; [['12', 0], ['3', 1], ['6', 2], ['9', 3]].forEach(([n, i]) => { const a = i / 4 * TAU; x.fillText(n, 128 + Math.sin(a) * 74, 130 - Math.cos(a) * 74); });
  const mm = 58 + sec / 60, hh = (11 + mm / 60) / 12 * TAU, ma = mm / 60 * TAU, sa = sec / 60 * TAU;
  x.lineWidth = 11; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(hh) * 52, 128 - Math.cos(hh) * 52); x.stroke(); x.lineWidth = 7; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(ma) * 84, 128 - Math.cos(ma) * 84); x.stroke();
  x.strokeStyle = '#c8301c'; x.lineWidth = 3; x.beginPath(); x.moveTo(128 - Math.sin(sa) * 20, 128 + Math.cos(sa) * 20); x.lineTo(128 + Math.sin(sa) * 100, 128 - Math.cos(sa) * 100); x.stroke(); dialT.needsUpdate = true; }
drawDial(41);
const WATCH = new THREE.Group(); { const cs = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .014, 24), M('#d8a848', { roughness: .25, metalness: .8 })); WATCH.add(cs);
  const d = new THREE.Mesh(new THREE.CircleGeometry(.025, 32), new THREE.MeshBasicMaterial({ map: dialT, color: new THREE.Color(.8, .8, .76) })); d.rotation.x = -Math.PI / 2; d.position.y = .0075; cs.add(d);
  for (const [u, v, r] of [[-.01, .008, .0028], [.008, -.01, .002]]) { const dr = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), M('#e0eaff', { roughness: .02, transparent: true, opacity: .5 })); dr.position.set(u, .009, v); dr.scale.y = .5; cs.add(dr); } }
scene.add(WATCH);
// drips from a leak in the ceiling over the puddles, and the rings they open; her splash
const NR = 260, rG = new THREE.BufferGeometry(), rP = new Float32Array(NR * 6); rG.setAttribute('position', new THREE.BufferAttribute(rP, 3));
const drips = new THREE.LineSegments(rG, new THREE.LineBasicMaterial({ color: '#cfd8e0', transparent: true, opacity: .55 })); drips.frustumCulled = false; scene.add(drips);
const ringM = new THREE.MeshBasicMaterial({ color: '#d8e0e8', transparent: true, opacity: .55 }), RINGS = Array.from({ length: 16 }, () => { const r = new THREE.Mesh(new THREE.TorusGeometry(1, .006, 4, 40), ringM.clone()); r.rotation.x = Math.PI / 2; scene.add(r); return r; });
const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(.018, 6, 5), M('#e0e8f0', { roughness: .05, transparent: true, opacity: .8 }), 36); scene.add(drops);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1);
function water(t) {
  // drips fall from the leaks above each puddle (the arcade's "rain"), ~6 m/s
  for (let i = 0; i < NR; i++) { const p = PUD[i % PUD.length], x = p[0] + (hash(i * 1.7) - .5) * p[2] * 1.4, z = p[1] + (hash(i * 2.9) - .5) * p[3] * 1.4, per = .5 + hash(i * 4.3) * .6, y = HC - ((t / per + hash(i * 6.1)) % 1) * HC;
    rP.set([x, y, z, x, y + .14, z], i * 6); } rG.attributes.position.needsUpdate = true;
  RINGS.forEach((r, k) => { const p = PUD[k % PUD.length], per = .45 + hash(k) * .3, ph = hash(k * 3.3), age = ((t / per + ph) % 1), cyc = Math.floor(t / per + ph);
    r.position.set(p[0] + (hash(k * 5.1 + cyc) - .5) * p[2], .004, p[1] + (hash(k * 7.3 + cyc) - .5) * p[3]); const s = .02 + .22 * age; r.scale.set(s, s, 1); r.material.opacity = .55 * (1 - age); });
  const u = t - SPL.t0, p0 = V(-.12, .01, zOf(SPL.x + 24)); let n = 0;
  if (u > 0 && u < .7) for (let j = 0; j < 36; j++) { const a = Math.PI * (.15 + .7 * hash(j * 7.1)), az = hash(j * 2.3) * TAU, sp = 2.2 * (.45 + .7 * hash(j * 3.3)), x = p0.x + Math.cos(az) * Math.cos(a) * sp * u, z = p0.z + Math.sin(az) * Math.cos(a) * sp * u, y = p0.y + Math.sin(a) * sp * u * 1.2 - 4.9 * u * u;
    if (y < 0) continue; _m.compose(V(x, y, z), _q, _s.set(1, 1, 1)); drops.setMatrixAt(n++, _m); }
  drops.count = n; drops.instanceMatrix.needsUpdate = true;
}

// ——— the operator: her eye, the gait (bob, sway, roll from the rig's run), breathing, tremor; where she looks per shot ———
const nz = (t, f, s) => vnoise(t * f + s * 17.3) - .5;
function eye(t) {
  const id = shotAt(t)[2], pv = RUN.pelvisAt(t), ph = (t - FIRST_STEP) * CADENCE * Math.PI; let z = zOf(pv[0]);
  let y = 1.55 + .045 * (Math.abs(Math.sin(ph)) - .6), x = .02 * Math.sin(ph), pitch = 0, yaw = 0, roll = .014 * Math.sin(ph) + nz(t, .6, 6) * .03, fov = 52;
  pitch += nz(t, 1.1, 1) * .02 + nz(t, 3.7, 2) * .01; yaw += nz(t, .9, 4) * .02 + .012 * Math.sin(ph);
  if (id === 'S1') { pitch += -1.14 - .22 * Math.exp(-(((t - .95) / .28) ** 2)) + .14 * eio(seg(t, 1.6, 2.5)); y -= .14; }   // a reflex look down as the boot hits the water                                    // filming the floor right at her feet
  else if (id === 'S2') { const g = ss(seg(t, 6.0, 6.35)) * (1 - ss(seg(t, 7.1, 7.4))); pitch += -.04 - .62 * g; yaw += .26 * g; }   // the glance at her wrist
  else if (id === 'S3') { pitch += -.9; yaw += .32; y -= .2; fov = lerp(40, 26, ss(seg(t, 7.5, 8.1))); }             // the watch, zoomed in, the focus hunting
  else { pitch += .12 - .1 * eio(seg(t, 9.6, 10.4)); fov = 44; x *= .4; }                                       // up at the clock over the stairs, then tilting down
  if (id === 'S1') z -= .16;   // filming her feet: the arm holds the camera a little ahead of her body
  return { x, y, z, pitch, yaw, roll, fov, ph, id };
}
// autofocus: in the watch shot it hunts (blur → lock → slip → lock); elsewhere it holds
function focusAt(t, e) { if (e.id === 'S3') { const k = t - 7.5; const lock = .34; let f = k < .25 ? lerp(1.6, .2, k / .25) : k < .55 ? lerp(.2, lock, eo((k - .25) / .3)) : k < 1.05 ? lock : k < 1.2 ? lerp(lock, .55, (k - 1.05) / .15) : lerp(.55, lock, eo(seg(k, 1.2, 1.5))); return [f, 9]; }
  if (e.id === 'S1') return [1.7, 3]; if (e.id === 'S4') return [8, 2]; return [6, 2.5]; }

// ——— lights: base + per-panel flicker; the chime blacks the whole floor out for a tenth of a second, auto-exposure lags ———
function gLight(t) { const d = t - EV.chime; if (d > -.02 && d < .1) return .03; if (d >= .1 && d < .22) return .5 + .5 * seg(d, .1, .22); return 1; }
function darkMem(t) { let s = 0, w = 0; for (let k = 0; k < 30; k++) { const d = k * .03, e = Math.exp(-d / .45); s += (1 - gLight(t - d)) * e; w += e; } return s / w; }
function lights(t) { const g = gLight(t); PCH.forEach((c, i) => { let I = c.dead ? 0 : c.base; if (c.flick) I *= hash(Math.floor(t * 30) * 1.3 + i) < .22 ? .15 : 1; I *= g; U.uI.value[i] = I; PANELS[i].material.color.setRGB(I * c.tint[0] * 1.6, I * c.tint[1] * 1.6, I * c.tint[2] * 1.55); }); U.uFogG.value = .35 + .65 * g; return g; }

function render(t) {
  const e = eye(t), id = e.id;
  camera.position.set(e.x, e.y, e.z); camera.rotation.set(e.pitch, e.yaw, e.roll); const hf = e.fov * Math.PI / 180; camera.fov = 2 * Math.atan(Math.tan(hf / 2) / (4 / 3)) * 180 / Math.PI; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  // her boots and trouser cuffs (only what she can see when she looks down), her left forearm and the watch
  const S = poseAt(t, id === 'S3' ? 1 : 0), J = solveProfile(S);
  const sh = id === 'S1' || (id === 'S2' && t > 6) || id === 'S3';
  ['f', 'n'].forEach((k, i) => { const l = J.leg[k], side = k === 'n' ? -.11 : .11; BOOT[i].position.set(side, Math.max(0, -l.ankle[1] * KS - .02), zOf(l.ankle[0]) - .02); BOOT[i].rotation.set(l.pitch, 0, 0); BOOT[i].visible = id === 'S1';
    TROU[i].position.set(side, -l.ankle[1] * KS + .27, zOf(l.ankle[0]) + .02); TROU[i].rotation.set(-.2, 0, 0); TROU[i].visible = false; });   // looking down shows only the boots' toes, never the legs (style)
  const an = J.arm.n, el = V(-.2, -an.el[1] * KS, zOf(an.el[0]) + .06), wr = V(-.12, -an.wr[1] * KS, zOf(an.wr[0]) - .02);
  if (id === 'S3') { const c = camera.position, f = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); wr.copy(c).addScaledVector(f, .36).add(V(.02, -.02, 0)); el.copy(wr).add(V(-.22, -.06, .14)); }
  const d = new THREE.Vector3().subVectors(wr, el), Ld = d.length(); ARM.position.copy(el).addScaledVector(d, .5); ARM.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); ARM.visible = sh && S.watch > .2 || id === 'S3';
  HAND.position.copy(wr).addScaledVector(d.clone().normalize(), .06); HAND.visible = ARM.visible;
  WATCH.position.copy(wr).addScaledVector(d.clone().normalize(), -.04).add(V(0, .045, 0)); WATCH.quaternion.setFromUnitVectors(V(0, 1, 0), V(.15, 1, .35).normalize()); WATCH.visible = ARM.visible;
  if (id === 'S3') drawDial(41 + Math.floor(t - EV.watchHit));
  water(t);
  const g = lights(t), dm = darkMem(t);
  clockM.color.setScalar(.95 * (.15 + .85 * g)); boardM.color.setScalar(2.6 * (.5 + .5 * g));
  scene.background.copy(U.uFog.value).multiplyScalar(U.uFogG.value * .15);
  const [fo, ap] = focusAt(t, e); post.dof.focus = fo; post.dof.aper = ap;
  // VHS: noise at tape rate, auto white balance drifting, AGC gain pumping in the dark, a tracking tear where the tape breaks (the cuts)
  const u = vhs.uniforms, f = Math.floor(t * 30); u.frame.value = f;
  u.tint.value = [1.0 - .02 * Math.sin(t * .31), 1.0, .95 + .04 * Math.sin(t * .23 + 1)];
  u.expo.value = (1 + .45 * dm) * (.97 + .03 * Math.sin(t * .47)); u.gain.value = .034 + .08 * dm + (id === 'S3' ? .02 : 0);
  let track = 0, roll = 0; for (const c of [2.5, 7.5, 9.375]) { const k = t - c; if (k > -.06 && k < .3) { track = Math.max(track, k < 0 ? 1 - (-k / .06) * .5 : 1 - k / .3); roll = (hash(f * .7) - .5) * .1 * (1 - clamp(k / .3)); } }
  if (t < .25) { const k = 1 - t / .25; track = Math.max(track, k * .8); roll = k * k * .2; }
  u.track.value = track; u.roll.value = roll; u.off.value = 0;
  drawOSD(osdCv, { t, rec: true, clock: `PM 11:${String(58).padStart(2, '0')}:${String(41 + Math.floor(t)).padStart(2, '0')}`, date: '', bat: 2, counter: `0:00:${String(Math.floor(t)).padStart(2, '0')}` });
  osdTex.needsUpdate = true; U.uTime.value = t;
  post.composer.render();
}
window.DUR = DUR; window.render = t => render(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
render(0);
window.READY = true;
