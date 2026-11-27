// 092 · Radar Sweep Documentary — the first 10 s of "Last Train Home" (lemo-opuscar styles/dark-documentary).
// The world is black until something scans it. Here the first light is the runner herself: every footfall is a small
// radial ping, and the splash at 0.94 s is the big one that lights the street for the first time. After it a plane of
// light sweeps ahead of her towards the station in surges on the beat; she keeps a cold rim and leaves wireframe echoes
// (the echo records time). A vertical sweep climbs the clock tower; the clock face is the one warm target. On the chime
// the tower becomes the source: a ring of light runs out across the street and the range rings flash.
//   S1 0–2.5 low wide dolly: footfall pings, the splash ping, the title written by a scan bar
//   S2 2.5–7.5 side track: the plane scan surging ahead; at 6.05 s the watch reading "11:58" is written by the scan
//   S3 7.5–9.375 fast lateral track to the tower; a vertical sweep; the second hand counts 282° → 288° on an arc
//   S4 9.375–10 pull back and up: the radial ping from the tower on the chime
// Readings are the film's own values (the run 4.06 m/s from the rig; the clock time); nothing else is scaled or invented.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2, BEAT = .625, V3 = (x, y, z) => new THREE.Vector3(x, y, z);
await Promise.all(['200 60px Plex', '300 20px Plex', '300 16px JBM'].map(f => document.fonts.load(f, 'A0')));
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.toneMapping = THREE.NoToneMapping;
const ov = document.getElementById('ov').getContext('2d');
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
const cam = new THREE.PerspectiveCamera(40, W / H, .1, 2000);

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
const UM = .0028, X0 = X(0), XS = -6, ZR = .6;
const wx = xr => XS + (xr - X0) * UM, herX = t => wx(X(t)), P3 = (p, z = ZR) => V3(wx(p[0]), -p[1] * UM, z);
const SXW = wx(SPL.x + 44), TOWER = V3(48, 0, -9.5), CLOCK = V3(48, 15.6, -9.5 + 1.86);

// ═════════ scans: a plane (A) along the street, a vertical sweep (B) on the tower, and radial pings
// age d > 0 behind the front (bright line at d = 0, glow exp(-d/L1), trail exp(-d/L2)); d < 0 is "not yet seen"
const NP = 8;
const U = {
  SA: { value: -1e6 }, SB: { value: -1e6 }, BI: { value: 1 }, camPos: { value: new THREE.Vector3() },
  PG: { value: Array.from({ length: NP }, () => new THREE.Vector4(0, 0, 0, 0)) },   // ping: cx, cz, radius, amplitude
  RC: { value: new THREE.Vector2(SXW, ZR) }, RA: { value: 0 }, RRING: { value: 1.6 },   // range rings: centre, amplitude, spacing
  WARM: { value: 0 }, L: { value: V3(-.4, .75, .5).normalize() },
};
const SCAN = /* glsl */`
  uniform float SA; uniform float SB; uniform float BI; uniform vec3 camPos; uniform vec4 PG[${NP}];
  uniform vec2 RC; uniform float RA; uniform float RRING; uniform float WARM; uniform vec3 L;
  const vec3 ECHO = vec3(0.70, 0.86, 1.0);
  float dA(vec3 wp){ return SA - wp.x; }
  float dB(vec3 wp){ return SB - wp.y; }
  float beamF(float d, float w){ return exp(-(d*d)/(w*w)); }
  float glowF(float d, float len){ return d > 0. ? exp(-d/len) : 0.; }
  float pingRing(vec3 wp, float w){ float s = 0.; for (int i = 0; i < ${NP}; i++){ vec4 p = PG[i]; if (p.w <= 0.) continue; float x = (length(wp.xz - p.xy) - p.z) / w; s += p.w * exp(-x*x); } return s; }
  float pingTrail(vec3 wp, float len){ float s = 0.; for (int i = 0; i < ${NP}; i++){ vec4 p = PG[i]; if (p.w <= 0.) continue; float x = p.z - length(wp.xz - p.xy); if (x > 0.) s += p.w * exp(-x/len) * 0.6; } return s; }
  float lineAA(float v, float px){ float f = abs(fract(v - .5) - .5); return 1. - smoothstep(0., px, f / max(fwidth(v), 1e-5)); }
`;
const VS = `varying vec3 wp; varying vec3 nrm; varying vec2 vUv; void main(){ vec4 w = modelMatrix*vec4(position,1.); wp=w.xyz; nrm=normalize(mat3(modelMatrix)*normal); vUv=uv; gl_Position=projectionMatrix*viewMatrix*w; }`;
// opaque surfaces: near-black, lit only by the scans, a cold rim for the subject, panel seams for façades
function surfMat({ gain = 1, rim = 0, panel = 0, tower = false, warm = 0 } = {}) {
  return new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: SCAN + /* glsl */`
    varying vec3 wp; varying vec3 nrm; varying vec2 vUv;
    void main(){
      vec3 n = normalize(nrm); if (!gl_FrontFacing) n = -n; vec3 V = normalize(camPos - wp);
      float d = dA(wp); ${tower ? 'float db = dB(wp); if (db > -0.0) d = db; else d = min(d, -1.);' : ''}
      float beam = beamF(d, .22) * BI, halo = beamF(d, 1.4) * BI, glow = glowF(d, 7.5), trail = glowF(d, 34.);
      float pr = pingRing(wp, .45), pt = pingTrail(wp, 5.);
      float lam = clamp(dot(n, L), 0., 1.), rimT = pow(1. - clamp(dot(n, V), 0., 1.), 3.);
      float lit = beam * 1.4 + halo * .4 + glow * .55 + trail * .08 + pr * .7 + pt * .25;
      vec3 col = ECHO * (0.08 + lam * .85 + rimT * .35) * lit * ${gain.toFixed(2)} + vec3(1.) * beam * .35;
      col += vec3(.50, .70, 1.0) * rimT * ${rim.toFixed(2)};
      ${panel ? `float pl = max(lineAA(vUv.x * ${panel.toFixed(1)}, .8), lineAA(vUv.y * ${(panel * .55).toFixed(1)}, .8)); col += ECHO * pl * (beam * .8 + glow * .5 + trail * .2 + pr * .6 + pt * .2) * .55;` : ''}
      ${warm ? `col += vec3(.95, .77, .55) * (${warm.toFixed(2)} * WARM * (0.35 + 0.65 * lam) + (glow * .5 + beam) * .6);` : ''}
      gl_FragColor = vec4(col, 1.);
    }` });
}
// additive line geometry (edges, seams): the same scan terms
const lineMat = (k = 1, tower = false) => new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `varying vec3 wp; void main(){ vec4 w = modelMatrix*vec4(position,1.); wp=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: SCAN + `varying vec3 wp; void main(){ float d = dA(wp); ${tower ? 'float db = dB(wp); if (db > 0.) d = db; else d = min(d, -1.);' : ''}
    float a = beamF(d, .3) * 1.2 * BI + glowF(d, 7.) * .6 + glowF(d, 45.) * .26 + pingRing(wp, .5) * .8 + pingTrail(wp, 6.) * .3;
    gl_FragColor = vec4(ECHO * a * ${k.toFixed(2)}, 1.); }` });
const addEdges = (m, k = 1, thr = 25, tower = false) => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, thr), lineMat(k, tower)); e.position.copy(m.position); e.rotation.copy(m.rotation); e.scale.copy(m.scale); m.parent.add(e); return e; };
function part(geo, mat, x, y, z, parent = scene, edges = 1, tower = false) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); if (edges) addEdges(m, edges, 25, tower); return m; }
const boxY = (w, h, d) => new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);

// ═════════ the place, in metres: Station Road, near pavement (AKI at z = 0.6), road, far façades, the station and its clock tower
{ // the ground: black, written by the scans as a survey grid, kerb lines, range rings and the puddle's ripples
  const gm = new THREE.ShaderMaterial({ uniforms: { ...U, SPLX: { value: new THREE.Vector3(SXW, ZR, -1) } }, vertexShader: VS, fragmentShader: SCAN + /* glsl */`
    uniform vec3 SPLX; varying vec3 wp; varying vec3 nrm; varying vec2 vUv;
    void main(){
      float d = dA(wp), beam = beamF(d, .25) * BI, halo = beamF(d, 1.6) * BI, glow = glowF(d, 6.), trail = glowF(d, 40.);
      float pr = pingRing(wp, .5), pt = pingTrail(wp, 4.);
      float grid = max(lineAA(wp.x / 2., .7), lineAA(wp.z / 2., .7)) * .55;
      float kerb = max(max(lineAA((wp.z + 1.2) / 400., 1.2), lineAA((wp.z + 7.) / 400., 1.2)), lineAA((wp.z + 4.1) / 400., .9) * step(.5, fract(wp.x / 3.)));
      float rr = length(wp.xz - RC), ring = lineAA(rr / RRING, .9) * exp(-rr / 22.) * RA;
      // the puddle: an outline and, after the splash, ripples running out
      vec2 q = (wp.xz - SPLX.xy) / vec2(1.2, .55); float pd = length(q);
      float puddle = lineAA(pd, .9) * step(pd, 1.5) * step(.5, pd);
      float age = SPLX.z; float rip = age > 0. ? lineAA((pd - age * .9) * 3., .9) * step(pd, 1.) * exp(-age * 1.4) * 1.5 : 0.;
      float lit = beam * 1.2 + halo * .35 + glow * .5 + trail * .1 + pr * 1.1 + pt * .5;
      vec3 col = ECHO * (.05 * lit + (grid + kerb) * (beam * .9 + glow * .55 + trail * .22 + pr * 1.0 + pt * .55) + puddle * (glow * .6 + trail * .3 + pr + pt * .8 + .05) + rip * (.6 + glow)) + vec3(1.) * beam * .25;
      col += ECHO * ring * 1.2;
      gl_FragColor = vec4(col, 1.);
    }` });
  const g = new THREE.Mesh(new THREE.PlaneGeometry(400, 200).rotateX(-Math.PI / 2), gm); g.position.set(40, 0, -20); scene.add(g); U.SPLX = gm.uniforms.SPLX;
}
const conc = surfMat({ gain: .5 }), steel = surfMat({ gain: .8 }), facade = surfMat({ gain: .55, panel: 6 });
part(boxY(120, .14, .3), conc, 20, 0, -1.2, scene, .5); part(boxY(120, .14, .3), conc, 20, 0, -7, scene, .5);   // kerbs
const R = mulberry(92);
for (let x = -34; x < 42;) { const w = 7 + R() * 6, h = 7 + R() * 8, m = part(boxY(w, h, 6), facade, x + w / 2, 0, -12, scene, .8); m.geometry.computeBoundingBox(); x += w + .4;
  part(boxY(w * .4, .5, .8), steel, x - w / 2 - .2, 3.2, -8.6, scene, .5); }   // shop canopies
for (let x = -30; x < 44; x += 9) { part(new THREE.CylinderGeometry(.06, .08, 4.4, 10).translate(0, 2.2, 0), steel, x, 0, -.9, scene, .7); part(boxY(1.1, .1, .12), steel, x + .5, 4.3, -.9, scene, .7); part(new THREE.CylinderGeometry(.18, .26, .3, 10), steel, x + 1, 4.15, -.9, scene, .7); }
// the station hall and the clock tower (the tower is written by the vertical sweep B)
part(boxY(26, 9, 12), facade, 64, 0, -15, scene, .8); part(boxY(28, .5, 14), steel, 64, 9, -15, scene, .8);
const TW = new THREE.Group(); TW.position.copy(TOWER); scene.add(TW);
const tMat = surfMat({ gain: .75, rim: .18, panel: 4, tower: true }), tSteel = surfMat({ gain: .9, rim: .25, tower: true });
part(boxY(3.4, .6, 3.4), tMat, 0, 0, 0, TW, .8, true); part(boxY(2.8, 13.6, 2.8), tMat, 0, .6, 0, TW, .9, true);
part(boxY(3.7, 3.6, 3.7), tSteel, 0, 13.8, 0, TW, 1.0, true); part(new THREE.ConeGeometry(2.9, 3.0, 4).rotateY(Math.PI / 4).translate(0, 1.5, 0), tSteel, 0, 17.4, 0, TW, 1.0, true);
// the clock face: the warm target
const faceMat = surfMat({ gain: .35, warm: .5, tower: true }), handMat = surfMat({ gain: .3, warm: 1.1, tower: true });
part(new THREE.CylinderGeometry(1.25, 1.25, .12, 48).rotateX(Math.PI / 2), faceMat, CLOCK.x - TOWER.x, CLOCK.y, CLOCK.z - TOWER.z, TW, 0);
{ const ring = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(1.32, 1.32, .14, 48).rotateX(Math.PI / 2), 30), lineMat(1.2, true)); ring.position.set(CLOCK.x - TOWER.x, CLOCK.y, CLOCK.z - TOWER.z); TW.add(ring);
  const tk = []; for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, r0 = i % 5 ? 1.12 : 1.0; tk.push(Math.sin(a) * r0, Math.cos(a) * r0, 0, Math.sin(a) * 1.2, Math.cos(a) * 1.2, 0); }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tk, 3)); const tl = new THREE.LineSegments(tg, lineMat(1.4, true)); tl.position.set(CLOCK.x - TOWER.x, CLOCK.y, CLOCK.z - TOWER.z + .08); TW.add(tl); }
const hand = (L, w) => { const p = new THREE.Group(); p.position.set(CLOCK.x - TOWER.x, CLOCK.y, CLOCK.z - TOWER.z + .1); TW.add(p); const m = new THREE.Mesh(new THREE.BoxGeometry(w, L, .05).translate(0, L / 2 - .12, 0), handMat); p.add(m); return p; };
const hH = hand(.62, .11), hM = hand(.95, .075), hS = hand(1.08, .035);
// stars: a dim night sky that appears where the plane scan has passed (they never move on screen: the camera only translates in S1–S2)
{ const n = 900, pos = new Float32Array(n * 3), br = new Float32Array(n), r = mulberry(7);
  for (let i = 0; i < n; i++) { const az = -.4 + r() * 2.4, el = .03 + Math.pow(r(), 1.6) * 1.2, band = Math.exp(-Math.pow((el - .55 + .25 * Math.sin(az * 1.3)) / .16, 2));
    pos.set([Math.cos(el) * Math.sin(az) * 800, Math.sin(el) * 800, -Math.cos(el) * Math.cos(az) * 800], i * 3); br[i] = (.25 + .75 * r() * r()) * (1 + band * 1.5); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('br', new THREE.BufferAttribute(br, 1));
  const m = new THREE.ShaderMaterial({ uniforms: { ...U, REV: { value: -1e6 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float br; uniform float REV; varying float a; void main(){ vec4 w = modelMatrix*vec4(position,1.); a = br * smoothstep(0., 60., REV - w.x * .08); gl_Position = projectionMatrix*viewMatrix*w; gl_PointSize = 2.2; }`,
    fragmentShader: `varying float a; void main(){ vec2 c = gl_PointCoord - .5; float k = 1. - smoothstep(.2, .5, length(c)); gl_FragColor = vec4(vec3(.78, .86, 1.) * a * k * .55, 1.); }` });
  const st = new THREE.Points(g, m); st.frustumCulled = false; scene.add(st); U.REV = m.uniforms.REV; var STARS = st; }
// rain: slanted streaks in a box that travels with the camera, lit only where the scans are fresh
const RAIN = (() => { const n = 1400, r = mulberry(11), pos = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) { const x = r() * 40 - 20, y = r() * 14, z = r() * 30 - 22; pos.set([x, y, z, x + .12, y - .55, z], i * 6); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.ShaderMaterial({ uniforms: { ...U, OFF: { value: new THREE.Vector3() }, TT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform vec3 OFF; uniform float TT; varying vec3 wp; void main(){ vec3 p = position; p.y = mod(p.y - TT * 9., 14.); p.x += p.y * .0; vec4 w = vec4(p + OFF, 1.); wp = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: SCAN + `varying vec3 wp; void main(){ float d = dA(wp); float a = glowF(d, 6.) * .22 + beamF(d, .5) * .6 + pingRing(wp, .6) * .25 + .025; gl_FragColor = vec4(ECHO * a, 1.); }` });
  const l = new THREE.LineSegments(g, m); l.frustumCulled = false; scene.add(l); return m.uniforms; })();

// ═════════ AKI: capsules from the rig every frame (opaque, scanned, with the subject's cold rim) + wireframe echoes
const akiMat = surfMat({ gain: 1.15, rim: .75 }), akiG = new THREE.Group(); scene.add(akiG);
const uCyl = new THREE.CylinderGeometry(1, 1, 1, 10), uSph = new THREE.SphereGeometry(1, 14, 10), coatGeo = new THREE.CylinderGeometry(.62, 1, 1, 14);
const pool = []; let pi = 0;
const pm = geo => { let m = pool[pi]; if (!m) { m = new THREE.Mesh(geo, akiMat); akiG.add(m); pool.push(m); } m.geometry = geo; m.visible = true; pi++; return m; };
const bone = (a, b, r) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(), m = pm(uCyl); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); m.scale.set(r, L, r); };
const ball = (p, r) => { const m = pm(uSph); m.position.copy(p); m.scale.setScalar(r); m.quaternion.identity(); };
function skeleton(J, xOff = 0) {   // line segments of one pose (for the echoes), in world space
  const S = [], P = (p, z) => P3(p, z).add(V3(xOff, 0, 0));
  for (const [k, z] of [['f', ZR - .1], ['n', ZR + .1]]) { const l = J.leg[k], toe = [l.ankle[0] + 72 * Math.cos(l.pitch), l.ankle[1] + 72 * Math.sin(l.pitch)]; S.push([P(l.hip, z), P(l.knee, z)], [P(l.knee, z), P(l.ankle, z)], [P(l.ankle, z), P(toe, z)]); }
  for (const [k, z] of [['f', ZR - .18], ['n', ZR + .18]]) { const a = J.arm[k]; S.push([P(a.sh, z), P(a.el, z)], [P(a.el, z), P(a.wr, z)]); }
  S.push([P(J.pelvis), P(J.neckBase)]); const hc = P(J.headC); for (let i = 0; i < 8; i++) { const a0 = i / 8 * TAU, a1 = (i + 1) / 8 * TAU; S.push([hc.clone().add(V3(Math.cos(a0) * .12, Math.sin(a0) * .13, 0)), hc.clone().add(V3(Math.cos(a1) * .12, Math.sin(a1) * .13, 0))]); }
  return S;
}
const NG = 6, SEGS = 19;
const ghostGeo = new THREE.BufferGeometry(); ghostGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NG * SEGS * 6), 3)); ghostGeo.setAttribute('a', new THREE.BufferAttribute(new Float32Array(NG * SEGS * 2), 1));
const ghosts = new THREE.LineSegments(ghostGeo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute float a; varying float va; void main(){ va = a; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `varying float va; void main(){ gl_FragColor = vec4(vec3(.70, .86, 1.) * va, 1.); }` }));
ghosts.frustumCulled = false; scene.add(ghosts);
function buildAki(t, vis) {
  pool.forEach(m => m.visible = false); pi = 0; const J = solveProfile(poseAt(t));
  for (const [k, z] of [['f', ZR - .1], ['n', ZR + .1]]) { const l = J.leg[k]; bone(P3(l.hip, z), P3(l.knee, z), .075); bone(P3(l.knee, z), P3(l.ankle, z), .06); ball(P3(l.knee, z), .07);
    bone(P3(l.ankle, z), P3([l.ankle[0] + 72 * Math.cos(l.pitch), l.ankle[1] + 72 * Math.sin(l.pitch)], z), .055); }
  for (const [k, z] of [['f', ZR - .18], ['n', ZR + .18]]) { const a = J.arm[k]; bone(P3(a.sh, z), P3(a.el, z), .055); bone(P3(a.el, z), P3(a.wr, z), .045); ball(P3(a.wr, z), .05); }
  const TT = (b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f], hem = P3(TT(J.pelvis, -98, -4)), neck = P3(J.neckBase);
  { const d = new THREE.Vector3().subVectors(neck, hem), L = d.length(), m = pm(coatGeo); m.position.copy(hem).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); m.scale.set(.19, L, .17); }
  const hc = P3(J.headC); ball(hc, .13); bone(hc.clone().add(V3(-.08, .04, 0)), P3([J.headC[0] - Math.cos(J.headA) * 95, J.headC[1] - 15]), .04);
  akiG.visible = vis;
  // echoes: earlier poses left behind where she was (wireframe after-images), each fainter
  const pa = ghostGeo.attributes.position.array, aa = ghostGeo.attributes.a.array; let o = 0, oa = 0;
  for (let k = 1; k <= NG; k++) { const tk = t - k * .1, Sk = skeleton(solveProfile(poseAt(Math.max(0, tk)))), al = vis ? .42 * Math.pow(1 - k / (NG + 1), 1.4) * (tk > 0 ? 1 : 0) : 0;
    for (let i = 0; i < SEGS; i++) { const s = Sk[i]; pa.set([s[0].x, s[0].y, s[0].z, s[1].x, s[1].y, s[1].z], o); o += 6; aa[oa++] = al; aa[oa++] = al; } }
  ghostGeo.attributes.position.needsUpdate = true; ghostGeo.attributes.a.needsUpdate = true;
  const a = J.arm.n; return { wrist: P3([a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84], ZR + .18), J };
}

// ═════════ timing of the scans
const PINGS = RUN.contacts.filter(c => c.t0 < EV.splash - .01).map(c => ({ t: c.t0, x: wx(c.x + 44), amp: 1.0, v: 6.5, tau: .5 }))
  .concat([{ t: SPL.t0, x: SXW, amp: 1.6, v: 28, tau: 1.3 }]);                           // footfalls, then the splash: the first light
const surge = t => { const f = ((t / BEAT) % 1 + 1) % 1; return 1.6 * (eo(f / .45) - f); };   // an ease-out push per beat over a steady drift
const SA_at = t => t < SPL.t0 ? -1e6 : SXW - .5 + 5.0 * (t - SPL.t0) + 1.4 * eo(seg(t, SPL.t0, SPL.t0 + .5)) + surge(t);
const SB_at = t => t < 7.62 ? -1e6 : -.3 + 19.5 * eo(seg(t, 7.62, 8.35)) + .4 * surge(t) * seg(t, 7.62, 8.6);
function scanState(t) {
  U.SA.value = SA_at(t); U.SB.value = SB_at(t); U.BI.value = 1;
  const list = PINGS.filter(p => t >= p.t && t - p.t < 4).map(p => [p.x, ZR, p.v * (t - p.t), p.amp * Math.exp(-(t - p.t) / p.tau)]);
  if (t >= EV.chime) list.push([TOWER.x, TOWER.z, 62 * (t - EV.chime), 1.8 * Math.exp(-(t - EV.chime) / 1.4)]);   // the tower's ping on the chime
  U.PG.value.forEach((v, i) => { const p = list[list.length - 1 - i]; v.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0, p ? p[3] : 0); });
  // range rings: round the puddle after the splash; round the tower on the chime
  if (t >= EV.chime) { U.RC.value.set(TOWER.x, TOWER.z); U.RA.value = 1.4 * Math.exp(-(t - EV.chime) / .5); U.RRING.value = 3; }
  else { U.RC.value.set(SXW, ZR); U.RA.value = t > SPL.t0 ? .9 * Math.exp(-(t - SPL.t0) / .8) : 0; U.RRING.value = 1.1; }
  U.SPLX.value.z = t - SPL.t0;
  U.WARM.value = t < 7.6 ? 0 : .55 + .45 * Math.exp(-Math.max(0, t - EV.chime) / .35) * (t > EV.chime ? 1 : 0);
  U.REV.value = t < SPL.t0 ? -1e6 : t < 7.5 ? SA_at(t) + 30 : 1e6;
}
// ═════════ cameras (translation only in S1–S2, so the stars hold still)
function camAt(t) {
  const K = (p, l, f = 40) => ({ p, l, f }), mix = (a, b, k) => K(a.p.clone().lerp(b.p, k), a.l.clone().lerp(b.l, k), lerp(a.f, b.f, k));
  const C1 = t => K(V3(-13.5 + .7 * t, 1.45, 9.5), V3(-1 + .7 * t, 1.25, -2.5), 40);
  const C2 = t => K(V3(herX(t) + .6, 1.3, 6.4), V3(herX(t) + 1.4, 1.15, -2), 38);
  const C3 = t => { const u = seg(t, 7.7, 9.375); return K(V3(41.2 + 1.1 * u, 1.7, 7.4), V3(47.6, lerp(13.2, 14.8, eio(u)), -9.5), lerp(34, 30, u)); };
  const C4 = t => K(V3(26, 12.5, 27), V3(38, 3, -5), 46);
  if (t < 2.5) return C1(t);
  if (t < 7.5) return t < 3.3 ? mix(C1(2.5), C2(3.3), eio(seg(t, 2.5, 3.3))) : C2(t);
  if (t < 9.375) return t < 7.72 ? mix(C2(7.36), C3(7.72), eio(seg(t, 7.36, 7.72))) : C3(t);
  return mix(C3(9.375), C4(10), eio(seg(t, 9.375, 10)));
}
// ═════════ post: bloom, then the grade (vignette, soft shoulder, static dither)
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.setPixelRatio(1); composer.setSize(W, H); composer.addPass(new RenderPass(scene, cam));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), .55, .5, .55));
composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
  fragmentShader: `varying vec2 vUv; uniform sampler2D tDiffuse; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; vec2 q = vUv - .5; c *= 1. - dot(q, q) * .85; c = c / (1. + c * .25); c += (h(gl_FragCoord.xy) - .5) / 255.; gl_FragColor = vec4(max(c, 0.), 1.); }` }));

// ═════════ type: every text is written by a scan bar (a clip growing left to right with a 1 px bright edge leading)
const COL = { hi: '#EEF2F6', mid: '#C4CED8', lo: '#96A2B0', echo: '#B3DBFF', warm: '#F2C48D' };
function spaced(s, x, y, sp) { for (const ch of s) { ov.fillText(ch, x, y); x += ov.measureText(ch).width + sp; } return x; }
function spacedW(s, sp) { let w = 0; for (const ch of s) w += ov.measureText(ch).width + sp; return w - sp; }
// write(fn, box, k): draws fn() clipped to the left k of box [x, y, w, h], with the bright leading edge
function write(k, [x, y, w, h], fn) { if (k <= 0) return; ov.save(); ov.beginPath(); ov.rect(x - 4, y, (w + 8) * Math.min(1, k), h); ov.clip(); fn(); ov.restore();
  if (k < 1) { const ex = x - 4 + (w + 8) * k; ov.fillStyle = 'rgba(220,238,255,.95)'; ov.fillRect(ex, y, 1.5, h); const gg = ov.createLinearGradient(ex - 40, 0, ex, 0); gg.addColorStop(0, 'rgba(179,219,255,0)'); gg.addColorStop(1, 'rgba(179,219,255,.22)'); ov.fillStyle = gg; ov.fillRect(ex - 40, y, 40, h); } }
const mono = (s, x, y, col = COL.mid, sz = 16) => { ov.font = `300 ${sz}px JBM`; ov.fillStyle = col; ov.textBaseline = 'alphabetic'; ov.textAlign = 'left'; return spaced(s.toUpperCase(), x, y, 1.8); };
const thin = (s, x, y, sz, col = COL.hi) => { ov.font = `200 ${sz}px Plex`; ov.fillStyle = col; ov.textBaseline = 'alphabetic'; ov.textAlign = 'left'; ov.fillText(s, x, y); return ov.measureText(s).width; };
const proj = p => { const q = p.clone().project(cam); return [(q.x + 1) / 2 * W, (1 - q.y) / 2 * H, q.z]; };
function leader(x0, y0, x1, y1, k, col = 'rgba(179,219,255,.7)') { if (k <= 0) return; ov.strokeStyle = col; ov.lineWidth = 1; ov.beginPath(); ov.moveTo(x0, y0); ov.lineTo(lerp(x0, x1, eo(k)), lerp(y0, y1, eo(k))); ov.stroke(); ov.fillStyle = col; ov.beginPath(); ov.arc(x0, y0, 2.5, 0, TAU); ov.fill(); }
function overlay(t, A) {
  ov.setTransform(1, 0, 0, 1, 0, 0); ov.clearRect(0, 0, W, H);
  // the one title, written at the bottom left after the first light; erased by a scan bar as the camera turns
  { const k = seg(t, 1.15, 1.75), e = seg(t, 2.35, 2.7); if (k > 0 && e < 1) { const box = [96, 880, 560, 120];
      ov.save(); if (e > 0) { ov.beginPath(); ov.rect(96 + 560 * e, 860, 600, 160); ov.clip(); }
      write(k, box, () => { thin('Last train home', 96, 948, 62); mono('Station Road · night', 98, 984, COL.lo, 15); }); ov.restore(); } }
  // the splash: a reading beside the puddle
  if (t > SPL.t0 + .05 && t < 2.45) { const [x, y] = proj(V3(SXW, 0, ZR)), k = seg(t, SPL.t0 + .05, SPL.t0 + .3), bx = x + 120, by = y - 210;
    leader(x + 8, y - 6, bx, by + 6, k); write(seg(t, SPL.t0 + .25, SPL.t0 + .65), [bx + 6, by - 22, 260, 54], () => { mono('splash', bx + 10, by, COL.echo); mono('t + 0.94 s', bx + 10, by + 24, COL.mid); }); }
  // the run: her speed from the rig, beside her
  if (t > 3.4 && t < 5.9) { const [x, y] = proj(V3(herX(t) + .2, 1.75, ZR)), k = seg(t, 3.4, 3.65), bx = x + 140, by = y - 150, f = 1 - seg(t, 5.6, 5.9);
    ov.globalAlpha = f; leader(x, y, bx, by + 6, k); write(seg(t, 3.6, 4.1), [bx + 6, by - 22, 300, 54], () => { mono('run', bx + 10, by, COL.echo); mono('4.06 m/s · 174 / min', bx + 10, by + 24, COL.mid); }); ov.globalAlpha = 1; }
  // the watch: the signal, warm, written by the scan beside her wrist
  if (t > EV.watchUp + .05 && t < EV.watchDown + .3) { const [x, y] = proj(A.wrist), k = seg(t, EV.watchUp + .08, EV.watchUp + .3), bx = x + 110, by = y - 190;
    const e = seg(t, EV.watchDown, EV.watchDown + .3); ov.save(); if (e > 0) { ov.beginPath(); ov.rect(bx + 480 * e, by - 140, 700, 260); ov.clip(); }
    ov.fillStyle = 'rgba(242,196,141,.9)'; ov.beginPath(); ov.arc(x, y, 4, 0, TAU); ov.fill(); leader(x, y, bx, by + 10, k, 'rgba(242,196,141,.75)');
    write(seg(t, EV.watchUp + .2, EV.watchUp + .55), [bx + 6, by - 120, 420, 150], () => { mono('watch', bx + 12, by - 92, COL.lo); thin('11:58', bx + 6, by, 118, COL.warm); });
    ov.restore(); }
  // the station clock: the second hand's angle counting on an arc around the face, the time in the thin sans
  if (t > 7.95) { const [cx, cy] = proj(CLOCK), [ex] = proj(CLOCK.clone().add(V3(1.25, 0, 0))), r = Math.abs(ex - cx) + 26, s = W_T(t), sec = Math.floor(s + 1e-6) % 60, ang = sec * 6;
    const k = seg(t, 7.95, 8.25), fa = 1 - seg(t, 9.3, 9.5); ov.globalAlpha = fa;
    ov.strokeStyle = 'rgba(179,219,255,.55)'; ov.lineWidth = 1.2; ov.beginPath(); ov.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * k); ov.stroke();
    for (let i = 0; i < 60; i++) { if (i / 60 > k) break; const a = -Math.PI / 2 + i / 60 * TAU, l = i % 5 ? 6 : 12; ov.beginPath(); ov.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ov.lineTo(cx + Math.cos(a) * (r + l), cy + Math.sin(a) * (r + l)); ov.stroke(); }
    if (k >= 1) { const a = -Math.PI / 2 + ang / 360 * TAU; ov.strokeStyle = 'rgba(242,196,141,.95)'; ov.lineWidth = 2.5; ov.beginPath(); ov.arc(cx, cy, r, -Math.PI / 2, a); ov.stroke();
      const tx = cx + Math.cos(a) * (r + 22), ty = cy + Math.sin(a) * (r + 22); ov.fillStyle = 'rgba(5,8,12,.75)'; ov.beginPath(); ov.roundRect(tx - 112, ty - 22, 98, 32, 4); ov.fill(); mono(`${String(ang).padStart(3, '0')}°`, tx - 104, ty, COL.warm); }
    const bx = cx + r + 90, by = cy + 30; write(seg(t, 8.0, 8.45), [bx, by - 150, 560, 210], () => { mono('station clock', bx + 4, by - 112, COL.lo); thin(`11:58:${String(sec).padStart(2, '0')}`, bx, by, 96, COL.hi); mono(`second hand ${String(ang).padStart(3, '0')}°`, bx + 4, by + 40, COL.mid); });
    ov.globalAlpha = 1; }
  // the chime: the tower's ping; one comparison held still
  if (t > EV.chime + .05) { const bx = 96, by = 900; write(seg(t, EV.chime + .05, EV.chime + .32), [bx, by - 40, 620, 110], () => { mono('chime · 11:58:49', bx + 2, by - 10, COL.echo); thin('71 s to midnight', bx, by + 50, 46, COL.hi); }); }
}

window.render = t => {
  t = clamp(+t || 0, 0, DUR);
  scanState(t);
  const s = W_T(t), sec = Math.floor(s + 1e-6) % 60, mn = 58 + (s % 60) / 60;
  hS.rotation.z = -sec / 60 * TAU; hM.rotation.z = -mn / 60 * TAU; hH.rotation.z = -(11 + mn / 60) / 12 * TAU;
  const A = buildAki(t, true);
  const C = camAt(t); cam.position.copy(C.p); cam.lookAt(C.l); cam.fov = C.f; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); U.camPos.value.copy(cam.position);
  STARS.position.copy(cam.position); RAIN.OFF.value.set(cam.position.x, 0, cam.position.z); RAIN.TT.value = t;
  composer.render();
  overlay(t, A);
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0); window.READY = true;
