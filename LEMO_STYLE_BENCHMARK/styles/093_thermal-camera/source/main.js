// 093 · Thermal Camera — the first 10 s of "Last Train Home" through a radiometric thermal camera (lemo-opuscar styles/thermal-camera).
// Two passes of one camera: a picture pass (real night light) and a thermal pass in which every material writes its apparent
// temperature (°C) into a float target; a sensor pass decimates it to a 640×360 grid with optics blur, noise, fixed pattern and
// lens shading; every number on screen is read back from that sensor buffer. Iron palette, one scale per moment, isotherm green.
//   S1  plain sight: she runs through the puddle under the lamp (0.94 s); the detector's shutter freezes the frame (NUC) and the
//       picture comes back as heat: a warm runner on a cold street, cold water thrown up, the first warm footprints (ghosts)
//   S2  side track in heat: the hot-spot tracker pinned to her face; at 6.05 s a split lands on her wrist: plain sight on the left
//       (the lit dial reads 11:58), heat on the right (the steel case reads cold: it mirrors the sky)
//   S3  tilt up the tower: the backlit dial is hot and the hands are cold, so the time reads in heat; isotherm above 34 °C;
//       the second hand moves 47 → 48 at 8.4 s
//   S4  pull back over the street; on the chime (9.58 s) the span narrows from 36 °C to 7 °C wide and her footprints appear,
//       all the way back to the puddle (level and span + ghosts)
// The temperatures are a model (night 7 °C, rain): a simulation, labelled as the camera's reading, not a recording.
import * as THREE from 'three';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, SW = 640, SH = 360, TAU = Math.PI * 2, V3 = (x, y, z) => new THREE.Vector3(x, y, z);
await Promise.all(['400 22px PM', '500 30px PM', '400 26px IT', '500 30px IT'].map(f => document.fonts.load(f, 'A0')));
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.outputColorSpace = THREE.SRGBColorSpace;
const ov = document.getElementById('ov').getContext('2d');
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, W / H, .1, 600);

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
const clk = t => { const s = Math.floor(W_T(t) + 12 * 3600 + 1e-6) % 86400; return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(v => String(v).padStart(2, '0')).join(':'); };
const UM = .0028, X0 = X(0), XS = -6, ZR = .6;
const wx = xr => XS + (xr - X0) * UM, herX = t => wx(X(t)), P3 = (p, z = ZR) => V3(wx(p[0]), -p[1] * UM, z);
const SXW = wx(SPL.x + 44), TOWER = V3(48, 0, -9.5), CLOCK = V3(48, 15.6, -9.5 + 1.86);
const FOOT = RUN.contacts.filter(c => c.t0 < 10).map((c, i) => ({ t: c.t0, x: wx(c.x + 44), z: ZR + (i % 2 ? .1 : -.1), wet: Math.abs(c.t0 - SPL.t0) < .02 }));

// ═════════ the thermal model: each mesh carries a picture material and a thermal material (apparent °C written to R)
const TH = { sky: { value: 1.0 }, gnd: { value: 6.5 }, time: { value: 0 }, camPos: { value: new THREE.Vector3() }, FP: { value: Array.from({ length: 40 }, (_, i) => FOOT[i] ? new THREE.Vector4(FOOT[i].x, FOOT[i].z, FOOT[i].t, FOOT[i].wet ? 1 : 0) : new THREE.Vector4(0, 0, 999, 0)) }, NF: { value: FOOT.length } };
const APP = /* glsl */`
  uniform float sky, gnd, time; uniform vec3 camPos; varying vec3 wp; varying vec3 nrm;
  // apparent = eps(theta) * T + (1 - eps(theta)) * T_reflected (cold sky above the mirror direction, the ground below)
  float apparent(float T, float eps0){ vec3 n = normalize(nrm); if (!gl_FrontFacing) n = -n; vec3 V = normalize(camPos - wp);
    float c = clamp(dot(n, V), 0., 1.), eps = eps0 * (1. - .55 * pow(1. - c, 4.)); vec3 r = reflect(-V, n); float Tr = mix(gnd, sky, smoothstep(-.15, .25, r.y)); return eps * T + (1. - eps) * Tr; }`;
const TVS = `varying vec3 wp; varying vec3 nrm; varying vec2 vUv; void main(){ vec4 w = modelMatrix*vec4(position,1.); wp = w.xyz; nrm = normalize(mat3(modelMatrix)*normal); vUv = uv; gl_Position = projectionMatrix*viewMatrix*w; }`;
// TM(body): custom GLSL that sets float T and float eps; available: wp, nrm, vUv, time
const TM = (body, extra = '') => new THREE.ShaderMaterial({ uniforms: TH, vertexShader: TVS, side: THREE.DoubleSide,
  fragmentShader: APP + extra + `varying vec2 vUv; float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main(){ float T = 7., eps = .95; ${body} gl_FragColor = vec4(apparent(T, eps), 0., 0., 1.); }` });
const objs = [];
function part(geo, pic, th, x = 0, y = 0, z = 0, parent = scene) { const m = new THREE.Mesh(geo, pic); m.position.set(x, y, z); m.userData.pic = pic; m.userData.th = th; parent.add(m); objs.push(m); return m; }
function setPass(k) { for (const m of objs) m.material = m.userData[k]; }
const boxY = (w, h, d) => new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
const STD = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .8, metalness: 0, ...o });

// ═════════ the place (metres): Station Road at night, a near pavement (AKI at z 0.6), the road, the far façades, the station
scene.background = new THREE.Color('#05070d'); scene.fog = new THREE.Fog('#070a12', 18, 75);
scene.add(new THREE.HemisphereLight('#3a4a70', '#0d0b0a', .55)); { const f = new THREE.DirectionalLight('#9fb0d8', .35); f.position.set(-4, 6, 10); scene.add(f); }   // the overcast night sky and the shop light behind the camera
const LAMPS = [];
for (let x = -30; x < 44; x += 9) { const L = new THREE.PointLight('#ffbf7a', 26, 16, 1.6); L.position.set(x + 1, 4.05, -.9); scene.add(L); LAMPS.push(L); }
const gndPic = STD('#15161b', { roughness: .32, metalness: .1 });   // wet asphalt and paving: low roughness, the lamps' highlights
part(new THREE.PlaneGeometry(400, 200).rotateX(-Math.PI / 2), gndPic, TM(`
    T = 6.6 + 0.4 * (h21(floor(wp.xz * 2.)) - .5) * .5; eps = .95;
    if (wp.z > -1.2) T = 7.2;                                                     // pavement (drier, paler)
    if (wp.z < -7.0) T = 7.4;
    // the puddle: cold rain water (evaporating), high emissivity
    vec2 q = (wp.xz - vec2(${SXW.toFixed(3)}, ${ZR.toFixed(2)})) / vec2(1.2, .55); if (length(q) < 1.) T = 5.4 + .3 * length(q);
    // footprints: heat left by her soles, fading (ghosts); the wet one in the puddle stays cold
    for (int i = 0; i < 40; i++){ if (i >= NF) break; vec4 f = FP[i]; float age = time - f.z; if (age < 0.) continue;
      vec2 d = (wp.xz - f.xy) / vec2(.17, .075); float k = exp(-dot(d, d) * 1.2); T += k * (f.w > .5 ? -.4 : 2.6 * exp(-age / 9.)); }`, `uniform vec4 FP[40]; uniform int NF;`), 40, 0, -20);
const puddle = part(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), STD('#0c0e12', { roughness: .04, metalness: .85 }), TM(`T = 5.4; eps = .96;`), SXW, .006, ZR); puddle.scale.set(1.2, 1, .55);
const dropPic = STD('#d8e6ff', { emissive: '#7d8fb0', emissiveIntensity: .9, roughness: .1 }), dropTh = TM(`T = 5.8; eps = .96;`);
const DROPS = Array.from({ length: 18 }, () => part(new THREE.SphereGeometry(.028, 8, 6), dropPic, dropTh, 0, -5, 0));
const RIPS = [0, 1, 2].map(() => { const m = part(new THREE.TorusGeometry(1, .012, 4, 48).rotateX(Math.PI / 2), STD('#9fb6dc', { emissive: '#5a6f96', emissiveIntensity: .8 }), TM(`T = 5.6; eps = .96;`), SXW, .012, ZR); m.visible = false; return m; });
const conc = STD('#3a3a40'), facadeP = [STD('#3a2f2a'), STD('#2c3038'), STD('#43352e'), STD('#2a2a2e')];
const wallTh = TM(`T = 8.3 + 2.4 * smoothstep(.12, 0., abs(fract((wp.y - .15) / 3.2) - .5) - .38) + 1.4 * exp(-pow(wp.y - .2, 2.) * 3.); eps = .93;`);
const glassTh = TM(`T = 8.0; eps = .84;`);   // glass: opaque to the camera, it shows the cold sky
const kerbTh = TM(`T = 7.0; eps = .94;`);
part(boxY(120, .14, .3), conc, kerbTh, 20, 0, -1.2); part(boxY(120, .14, .3), conc, kerbTh, 20, 0, -7);
const R = mulberry(93), winPic = [STD('#3a2a1a', { emissive: '#ffb45e', emissiveIntensity: .5 }), STD('#1a2230', { roughness: .15, metalness: .3 }), STD('#1a2230', { emissive: '#8fb4ff', emissiveIntensity: .28 })];
for (let x = -34, i = 0; x < 42; i++) { const w = 7 + R() * 6, h = 7 + R() * 8;
  part(boxY(w, h, 6), facadeP[i % 4], wallTh, x + w / 2, 0, -12);
  for (let fy = 1; fy * 3.2 + 1 < h; fy++) for (let wx_ = x + 1.2; wx_ < x + w - 1.2; wx_ += 2.2) part(new THREE.PlaneGeometry(1.2, 1.5), winPic[R() < .35 ? 0 : R() < .8 ? 1 : 2], glassTh, wx_ + .6, fy * 3.2 - .2, -8.98);
  part(boxY(w - 1, 2.6, .1), winPic[R() < .6 ? 0 : 1], glassTh, x + w / 2, .2, -8.97);   // shop glass
  part(boxY(w * .4, .45, .9), STD('#5a1f1f'), TM(`T = 7.5; eps = .9;`), x + w * .3, 2.95, -8.5);
  part(new THREE.BoxGeometry(.5, .4, .3), STD('#555'), TM(`T = 24. + 6. * exp(-pow(length(wp.xy - vec2(${(x + w * .75).toFixed(2)}, 3.4)), 2.) * 8.); eps = .9;`), x + w * .75, 3.4, -8.85);   // warm air vents
  x += w + .4; }
for (let x = -30; x < 44; x += 9) {
  part(new THREE.CylinderGeometry(.06, .08, 4.4, 10).translate(0, 2.2, 0), STD('#2a2c30', { metalness: .7, roughness: .4 }), TM(`T = 7.; eps = .25;`), x, 0, -.9);
  part(boxY(1.1, .1, .12), STD('#2a2c30', { metalness: .7, roughness: .4 }), TM(`T = 7.; eps = .25;`), x + .5, 4.3, -.9);
  part(new THREE.CylinderGeometry(.18, .26, .3, 10), STD('#ffd9a0', { emissive: '#ffcf8a', emissiveIntensity: 3 }), TM(`T = 64.; eps = .9;`), x + 1, 4.15, -.9); }
// the station hall (warm doors) and the clock tower
part(boxY(26, 9, 12), STD('#3a302c'), TM(`T = 8.6; eps = .93; T += 9. * exp(-pow((wp.x - 56.) / 2.2, 2.)) * exp(-pow(wp.y - 1.4, 2.) * .5);`), 64, 0, -15);
part(boxY(3, 2.6, .1), STD('#ffd49a', { emissive: '#ffbf70', emissiveIntensity: 1.2 }), glassTh, 56, 0, -8.95);
const TWg = new THREE.Group(); TWg.position.copy(TOWER); scene.add(TWg);
const towTh = TM(`T = 8.6 + 1.6 * smoothstep(.1, 0., abs(fract(wp.y / 3.4) - .5) - .4); eps = .93;`);
part(boxY(3.4, .6, 3.4), STD('#3d3632'), towTh, 0, 0, 0, TWg); part(boxY(2.8, 13.6, 2.8), STD('#3d3632'), towTh, 0, .6, 0, TWg);
part(boxY(3.7, 3.6, 3.7), STD('#463c36'), TM(`T = 10.5 + 6. * exp(-pow(wp.y - 15.6, 2.) * .4); eps = .93;`), 0, 13.8, 0, TWg);   // warm: the lamps behind the dial
part(new THREE.ConeGeometry(2.9, 3.0, 4).rotateY(Math.PI / 4).translate(0, 1.5, 0), STD('#2b2f36', { metalness: .5, roughness: .5 }), TM(`T = 7.; eps = .3;`), 0, 17.4, 0, TWg);
const lc = CLOCK.clone().sub(TOWER);
part(new THREE.CylinderGeometry(1.25, 1.25, .12, 48).rotateX(Math.PI / 2), STD('#f4f0e6', { emissive: '#fff1d2', emissiveIntensity: 1.3 }),
  TM(`float r = length(wp.xy - vec2(${CLOCK.x.toFixed(2)}, ${CLOCK.y.toFixed(2)})); T = 38.6 - 7.5 * r * r; eps = .9;`), lc.x, lc.y, lc.z, TWg);   // backlit opal dial
for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; part(new THREE.BoxGeometry(.08, .24, .04), STD('#15151a'), TM(`T = 14.; eps = .9;`), lc.x + Math.sin(a) * 1.02, lc.y + Math.cos(a) * 1.02, lc.z + .08, TWg).rotation.z = -a; }
const hand = (L, w) => { const p = new THREE.Group(); p.position.set(lc.x, lc.y, lc.z + .1); TWg.add(p); part(new THREE.BoxGeometry(w, L, .05).translate(0, L / 2 - .12, 0), STD('#101014'), TM(`T = 11.; eps = .9;`), 0, 0, 0, p); return p; };
const hH = hand(.62, .12), hM = hand(.95, .085), hS = hand(1.08, .04);
// ═════════ AKI: capsules from the rig every frame, each part with its picture colour and its surface temperature
const AK = {
  skin: [STD('#e8b8a0', { roughness: .6 }), TM(`T = 33.4 + .6 * smoothstep(.0, .1, -nrm.y); eps = .98;`)],
  hand: [STD('#e8b8a0', { roughness: .6 }), TM(`T = 29.5; eps = .98;`)],
  hair: [STD('#2a1830', { roughness: .7 }), TM(`T = 17.5; eps = .95;`)],
  coat: [STD('#c8402a', { roughness: .55 }), TM(`T = 12.2 + 1.2 * smoothstep(-.2, .6, nrm.y); eps = .95;`)],   // wet, insulated: its outer face stays cool
  legs: [STD('#3b3b4a', { roughness: .8 }), TM(`T = 17.2; eps = .95;`)],
  shoe: [STD('#6b4430', { roughness: .6 }), TM(`T = 9.2; eps = .94;`)],
  watch: [STD('#d8d4cc', { metalness: .9, roughness: .25, emissive: '#fff4dc', emissiveIntensity: .25 }), TM(`T = 30.; eps = .12;`)],   // steel: it mirrors the sky
};
const akiG = new THREE.Group(); scene.add(akiG);
const uCyl = new THREE.CylinderGeometry(1, 1, 1, 12), uSph = new THREE.SphereGeometry(1, 16, 12), coatGeo = new THREE.CylinderGeometry(.62, 1, 1, 16), watchGeo = new THREE.CylinderGeometry(1, 1, 1, 20);
const pool = []; let pi = 0;
const pm = (geo, mt) => { let m = pool[pi]; if (!m) { m = new THREE.Mesh(geo, mt[0]); akiG.add(m); pool.push(m); objs.push(m); } m.geometry = geo; m.userData.pic = mt[0]; m.userData.th = mt[1]; m.visible = true; pi++; return m; };
const bone = (a, b, r, mt) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(), m = pm(uCyl, mt); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); m.scale.set(r, L, r); return m; };
const ball = (p, r, mt) => { const m = pm(uSph, mt); m.position.copy(p); m.scale.setScalar(r); m.quaternion.identity(); return m; };
function buildAki(t) {
  pool.forEach(m => m.visible = false); pi = 0; const J = solveProfile(poseAt(t));
  for (const [k, z] of [['f', ZR - .1], ['n', ZR + .1]]) { const l = J.leg[k]; bone(P3(l.hip, z), P3(l.knee, z), .075, AK.legs); bone(P3(l.knee, z), P3(l.ankle, z), .058, AK.legs); ball(P3(l.knee, z), .068, AK.legs);
    bone(P3(l.ankle, z), P3([l.ankle[0] + 72 * Math.cos(l.pitch), l.ankle[1] + 72 * Math.sin(l.pitch)], z), .058, AK.shoe); }
  for (const [k, z] of [['f', ZR - .18], ['n', ZR + .18]]) { const a = J.arm[k]; bone(P3(a.sh, z), P3(a.el, z), .06, AK.coat); bone(P3(a.el, z), P3(a.wr, z), .05, AK.coat); ball(P3(a.wr, z), .048, AK.hand); }
  const TT = (b, u, f) => [b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f], hem = P3(TT(J.pelvis, -98, -4)), neck = P3(J.neckBase);
  { const d = new THREE.Vector3().subVectors(neck, hem), L = d.length(), m = pm(coatGeo, AK.coat); m.position.copy(hem).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); m.scale.set(.19, L, .17); }
  const hc = P3(J.headC); ball(hc, .12, AK.skin); { const m = ball(hc.clone().add(V3(-.03, .035, 0)), .125, AK.hair); m.scale.set(.12, .1, .125); }
  bone(hc.clone().add(V3(-.09, .05, 0)), P3([J.headC[0] - Math.cos(J.headA) * 95, J.headC[1] - 15]), .04, AK.hair);
  const a = J.arm.n, wr = P3([a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84], ZR + .23);
  { const d = new THREE.Vector3().subVectors(P3(a.wr), P3(a.el)).normalize(), m = pm(watchGeo, AK.watch); m.position.copy(wr); m.quaternion.setFromUnitVectors(V3(0, 0, 1), V3(0, 0, 1)); m.rotation.set(Math.PI / 2, 0, Math.atan2(d.y, d.x)); m.scale.set(.022, .012, .022); }
  return { wrist: wr, head: hc, J };
}
// breath: warm puffs blending in temperature space (alpha-composited °C), trailing behind her
const breathTh = new THREE.ShaderMaterial({ uniforms: { A: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float A; varying vec2 vUv; void main(){ float r = length(vUv - .5) * 2.; gl_FragColor = vec4(27., 0., 0., A * smoothstep(1., .1, r)); }` });
const PUFFS = Array.from({ length: 6 }, () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), breathTh.clone()); m.visible = false; scene.add(m); return m; });

// ═════════ render targets and the sensor
const rtPic = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtTh = new THREE.WebGLRenderTarget(SW * 2, SH * 2, { type: THREE.FloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
const rtS = new THREE.WebGLRenderTarget(SW, SH, { type: THREE.FloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)), qScene = new THREE.Scene(), qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); qScene.add(quad);
const QVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const sensorMat = new THREE.ShaderMaterial({ uniforms: { tT: { value: rtTh.texture }, frame: { value: 0 }, px: { value: new THREE.Vector2(1 / SW, 1 / SH) } }, vertexShader: QVS,
  fragmentShader: `uniform sampler2D tT; uniform float frame; uniform vec2 px; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){ float s = 0., w = 0.; for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){ float k = (i == 0 ? 2. : 1.) * (j == 0 ? 2. : 1.); s += texture2D(tT, vUv + vec2(i, j) * px * .75).r * k; w += k; }
      float T = s / w; vec2 c = floor(vUv / px);
      T += (h(c + frame * 1.37) + h(c * 1.7 - frame) - 1.) * .12;                     // temporal noise (~0.1 °C)
      T += (h(vec2(c.x, 3.)) - .5) * .09 + (h(vec2(7., c.y)) - .5) * .05;            // fixed column / row pattern
      vec2 q = vUv - .5; T -= dot(q, q) * 1.1;                                       // lens shading
      gl_FragColor = vec4(T, 0., 0., 1.); }` });
const finalMat = new THREE.ShaderMaterial({ uniforms: { tS: { value: rtS.texture }, tP: { value: rtPic.texture }, lo: { value: -2 }, hi: { value: 36 }, iso: { value: 999 }, mode: { value: 1 }, split: { value: -1 }, px: { value: new THREE.Vector2(1 / SW, 1 / SH) }, freeze: { value: 0 } },
  vertexShader: QVS, fragmentShader: `uniform sampler2D tS; uniform sampler2D tP; uniform float lo, hi, iso, mode, split, freeze; uniform vec2 px; varying vec2 vUv;
    vec3 iron(float u){ u = clamp(u, 0., 1.); vec3 c[8]; c[0]=vec3(0.,0.,.03); c[1]=vec3(.08,.025,.35); c[2]=vec3(.32,.04,.6); c[3]=vec3(.62,.08,.57); c[4]=vec3(.86,.21,.32); c[5]=vec3(.97,.48,.08); c[6]=vec3(1.,.76,.14); c[7]=vec3(1.,.98,.87);
      float x = u * 7.; int i = int(floor(min(x, 6.999))); float f = x - float(i); vec3 a = c[0], b = c[1]; for (int k = 0; k < 7; k++) if (k == i) { a = c[k]; b = c[k + 1]; } return mix(a, b, f); }
    void main(){
      float T = texture2D(tS, vUv).r, Tb = 0.; for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) Tb += texture2D(tS, vUv + vec2(i, j) * px).r; Tb /= 9.;
      T += (T - Tb) * .45;                                                           // mild detail enhancement after the upsample
      vec3 th = iron((T - lo) / (hi - lo)); if (T > iso) th = mix(th, vec3(.17, .82, .29), .88);
      vec3 pic = texture2D(tP, vUv).rgb; pic = pic / (1. + pic * .15); pic = pow(max(pic, 0.), vec3(1. / 2.2));
      float useTh = mode > 1.5 ? step(split, vUv.x) : mode;                          // mode 2: a split (picture left, heat right)
      vec3 c = mix(pic, th, useTh);
      if (mode > 1.5) { float e = abs(vUv.x - split) * 1920.; c = mix(c, vec3(1.), smoothstep(2.2, .6, e)); }
      c = mix(c, c * .7 + .3, freeze * .5);
      gl_FragColor = vec4(c, 1.); }` });
const sensorBuf = new Float32Array(SW * SH * 4);
const Tat = (u, v) => { const x = clamp(Math.floor(u * SW), 0, SW - 1), y = clamp(Math.floor((1 - v) * SH), 0, SH - 1); return sensorBuf[(y * SW + x) * 4]; };   // u,v in screen fractions (v down)
function boxStat(u0, v0, u1, v1) { let mx = -1e9, s = 0, n = 0, mu = 0, mv = 0; for (let v = v0; v <= v1; v += 1 / SH) for (let u = u0; u <= u1; u += 1 / SW) { const T = Tat(u, v); s += T; n++; if (T > mx) { mx = T; mu = u; mv = v; } } return { max: mx, avg: s / Math.max(1, n), mu, mv }; }
const proj = p => { const q = p.clone().project(cam); return [(q.x + 1) / 2, (1 - q.y) / 2]; };

// ═════════ shots: camera, composite mode, scale
function camAt(t) {
  const K = (p, l, f) => ({ p, l, f }), mix = (a, b, k) => K(a.p.clone().lerp(b.p, k), a.l.clone().lerp(b.l, k), lerp(a.f, b.f, k));
  const C1 = t => K(V3(SXW - 5.5 + .75 * t, 1.45, 6.3), V3(SXW + 1.6 + .75 * t, .95, -2.2), 38);
  const C2 = t => { const k = ss(seg(t, EV.watchUp - .1, EV.watchUp + .35)) * (1 - ss(seg(t, EV.watchDown, EV.watchDown + .35))); return K(V3(herX(t) + lerp(.5, .32, k), lerp(1.3, 1.4, k), lerp(6.2, 4.4, k)), V3(herX(t) + lerp(1.3, .3, k), lerp(1.1, 1.25, k), -2), lerp(38, 27, k)); };   // the wrist comes to the centre of the frame
  const C3 = t => { const u = eio(seg(t, 7.7, 8.3)); return K(V3(44.2, 1.8, 5.5), V3(47.6, lerp(5, 14.9, u), -9.5), lerp(32, 26, ss(seg(t, 8.3, 9.4)))); };
  const C4 = t => K(V3(lerp(33.5, 32.5, seg(t, 9.6, 10)), 6.2, 11.5), V3(27.5, .3, -.6), 48);
  if (t < 2.5) return C1(t);
  if (t < 7.5) return t < 3.2 ? mix(C1(2.5), C2(3.2), eio(seg(t, 2.5, 3.2))) : C2(t);
  if (t < 9.375) return t < 7.72 ? mix(C2(7.36), C3(7.72), eio(seg(t, 7.36, 7.72))) : C3(t);
  return mix(C3(9.375), C4(9.75), eio(seg(t, 9.375, 9.75)));
}
const T_NUC = 1.38, NUC_D = .16;
function scaleAt(t) { if (t < EV.chime) return [-2, 36]; const k = ss(seg(t, EV.chime, EV.chime + .12)); return [lerp(-2, 5, k), lerp(36, 12, k)]; }

// ═════════ the camera's screen (overlays): scale bar, time stamp, meters, labels
const MONO = (sz, w = 400) => `${w} ${sz}px PM`, SANS = (sz, w = 400) => `${w} ${sz}px IT`;
function halo(fn) { ov.save(); ov.shadowColor = 'rgba(0,0,0,.85)'; ov.shadowBlur = 6; fn(); ov.restore(); }
function txt(s, x, y, font, al = 'left', col = '#fff') { ov.font = font; ov.textAlign = al; ov.textBaseline = 'middle'; ov.fillStyle = col; halo(() => ov.fillText(s, x, y)); }
const fmt = T => (Math.round(T * 10) / 10).toFixed(1);
function scaleBar(lo, hi) {
  const x = 1812, y0 = 170, y1 = 860; const g = ov.createLinearGradient(0, y1, 0, y0);
  const st = ['#000008', '#14065A', '#520A98', '#9E1592', '#DD3550', '#F87A14', '#FFC226', '#FFFBDF']; st.forEach((c, i) => g.addColorStop(i / 7, c));
  halo(() => { ov.fillStyle = g; ov.fillRect(x, y0, 28, y1 - y0); }); ov.strokeStyle = 'rgba(255,255,255,.8)'; ov.lineWidth = 1.5; ov.strokeRect(x, y0, 28, y1 - y0);
  txt(`${fmt(hi)}`, x + 14, y0 - 26, MONO(24, 500), 'center'); txt(`${fmt(lo)}`, x + 14, y1 + 26, MONO(24, 500), 'center'); txt('°C', x + 14, y1 + 58, MONO(22), 'center', 'rgba(255,255,255,.75)');
}
function crosshair(x, y, k = 1, col = '#fff') { const r = lerp(60, 16, eo(k)); halo(() => { ov.strokeStyle = col; ov.lineWidth = 2.2; ov.beginPath(); ov.moveTo(x - r - 10, y); ov.lineTo(x - r + 6, y); ov.moveTo(x + r - 6, y); ov.lineTo(x + r + 10, y); ov.moveTo(x, y - r - 10); ov.lineTo(x, y - r + 6); ov.moveTo(x, y + r - 6); ov.lineTo(x, y + r + 10); ov.stroke(); ov.beginPath(); ov.arc(x, y, r * .55, 0, TAU); ov.stroke(); }); }
function hotMark(x, y, k = 1) { const s = lerp(40, 14, eo(k)); halo(() => { ov.strokeStyle = '#fff'; ov.lineWidth = 2.4; ov.beginPath(); ov.moveTo(x, y - s * .2); ov.lineTo(x - s, y - s * 1.6); ov.lineTo(x + s, y - s * 1.6); ov.closePath(); ov.stroke(); }); }
function label(head, sub, x, y, al = 'left') { txt(head, x, y, SANS(30, 500), al); if (sub) txt(sub, x, y + 34, SANS(22), al, 'rgba(255,255,255,.82)'); }
function lead(x0, y0, x1, y1) { halo(() => { ov.strokeStyle = 'rgba(255,255,255,.9)'; ov.lineWidth = 1.6; ov.beginPath(); ov.moveTo(x0, y0); ov.lineTo(x1, y1); ov.stroke(); }); }
const rnd6 = (t, T, seed) => T + (hash(Math.floor(t * 6) * 13.1 + seed) - .5) * .2;   // the last digit refreshes at ~6 Hz
function overlay(t, A, mode) {
  ov.setTransform(1, 0, 0, 1, 0, 0); ov.clearRect(0, 0, W, H);
  if (mode === 0) { txt(`VIS  ${clk(t)}`, 60, 1026, MONO(22), 'left', 'rgba(255,255,255,.85)'); if (t > T_NUC - .02 && t < T_NUC + NUC_D) { txt('NUC', 960, 540, MONO(30, 500), 'center'); } return; }
  const [lo, hi] = scaleAt(t); scaleBar(lo, hi);
  txt(`${clk(t)}   ε 0.95   7.0 °C AIR   IR`, 60, 1026, MONO(22), 'left', 'rgba(255,255,255,.88)');
  if (t < T_NUC + NUC_D) txt('NUC', 960, 540, MONO(30, 500), 'center');
  // S1 (heat): the splash water reads cold against her legs; the first footprints
  if (t > 1.6 && t < 2.5) { const [u, v] = proj(V3(SXW - .3, 0, ZR + .1)), T = Tat(u, v), k = seg(t, 1.6, 1.85); crosshair(u * W, v * H, k); if (k > .6) { lead(u * W - 18, v * H + 18, u * W - 140, v * H + 110); label(`${fmt(rnd6(t, T, 1))} °C`, 'the puddle: cold rain water', u * W - 148, v * H + 122, 'right'); } }
  // S2: the hot-spot tracker, found once from the buffer and pinned to her head; a box on the coat
  if (t > 3.1 && t < EV.watchUp - .05) {
    const [hu, hv] = proj(A.head), [cu, cv] = proj(A.J ? P3(A.J.waist) : A.head);
    const [mu, mv] = proj(A.head.clone().add(V3(.07, -.03, .1)));   // pinned to her face (the warmest skin, found from the buffer), it rides with her
    const T = boxStat(hu - .03, hv - .05, hu + .03, hv + .05).max, k = seg(t, 3.1, 3.35);
    hotMark(mu * W, mv * H, k); if (k > .7) { txt(`MAX ${fmt(rnd6(t, T, 2))} °C`, mu * W, mv * H - 72, MONO(28, 500), 'center'); }
    const bx0 = cu - .045, bx1 = cu + .045, by0 = cv - .1, by1 = cv + .06, b = boxStat(bx0, by0, bx1, by1), kb = seg(t, 3.5, 3.75);
    if (kb > 0) { halo(() => { ov.strokeStyle = '#fff'; ov.lineWidth = 2; ov.strokeRect(bx0 * W, by0 * H, (bx1 - bx0) * W * eo(kb), (by1 - by0) * H * eo(kb)); });
      if (kb > .9) { txt(`AVG ${fmt(rnd6(t, b.avg, 3))}`, bx1 * W + 16, by0 * H + 14, MONO(24), 'left'); txt('coat, wet', bx1 * W + 16, by0 * H + 46, SANS(22), 'left', 'rgba(255,255,255,.82)'); } }
  }
  // the watch, in the split: plain sight on the left reads the dial; heat on the right reads the steel
  if (mode === 2) { const [u, v] = proj(A.wrist), k = seg(t, EV.watchUp + .15, EV.watchUp + .4);
    if (k > 0) { lead(u * W - 14, v * H - 10, u * W - 160, v * H - 150); label('11:58', 'her watch, in plain sight', u * W - 168, v * H - 172, 'right');
      const T = Tat(u + .006, v); crosshair(u * W + 10, v * H, k); lead(u * W + 24, v * H + 14, u * W + 170, v * H + 150); label(`${fmt(rnd6(t, T, 4))} °C`, 'steel case: it mirrors the cold sky', u * W + 178, v * H + 160); } }
  // S3: the backlit dial; isotherm above 34 °C; a box maximum on the face
  if (t > 8.05 && t < 9.4) { const [u, v] = proj(CLOCK), [ue] = proj(CLOCK.clone().add(V3(1.3, 0, 0))), r = Math.abs(ue - u), b = boxStat(u - r, v - r * 1.78, u + r, v + r * 1.78), k = seg(t, 8.05, 8.3);
    halo(() => { ov.strokeStyle = '#fff'; ov.lineWidth = 2; ov.strokeRect((u - r) * W, (v - r * 1.78) * H, 2 * r * W * eo(k), 2 * r * 1.78 * H * eo(k)); });
    if (k > .9) { txt(`MAX ${fmt(rnd6(t, b.max, 5))} °C`, (u + r) * W + 22, (v - r * 1.78) * H + 16, MONO(28, 500)); label('station clock', 'lit from behind; the hands are cold', (u + r) * W + 22, (v - r * 1.78) * H + 66);
      halo(() => { ov.fillStyle = '#2BD14A'; ov.fillRect((u + r) * W + 22, (v + r * 1.78) * H - 26, 26, 18); }); txt('ISO > 34.0 °C', (u + r) * W + 60, (v + r * 1.78) * H - 17, MONO(22)); } }
  // S4: the span narrows on the chime; her footprints appear, back to the puddle
  if (t > EV.chime + .1) { const k = seg(t, EV.chime + .1, EV.chime + .3), f = FOOT.filter(f => f.t < t - .5 && !f.wet).slice(-6)[0];
    if (f) { const [u, v] = proj(V3(f.x, 0, f.z)), T = Tat(u, v), [u2, v2] = proj(V3(f.x + .5, 0, f.z - .6)), T0 = Tat(u2, v2); crosshair(u * W, v * H, k);
      if (k > .7) { lead(u * W - 16, v * H - 16, u * W - 150, v * H - 140); label(`+${fmt(T - T0)} °C`, 'her footprints, back to the puddle', u * W - 158, v * H - 160, 'right'); } }
    txt(`SPAN ${fmt(scaleAt(t)[1] - scaleAt(t)[0])} °C`, 1812 + 14, 96, MONO(22), 'center', 'rgba(255,255,255,.85)'); }
}

window.render = t => {
  t = clamp(+t || 0, 0, DUR);
  const s = W_T(t), sec = Math.floor(s + 1e-6) % 60, mn = 58 + (s % 60) / 60; hS.rotation.z = -sec / 60 * TAU; hM.rotation.z = -mn / 60 * TAU; hH.rotation.z = -(11 + mn / 60) / 12 * TAU;
  const A = buildAki(t), C = camAt(t);
  { const a = t - SPL.t0; DROPS.forEach((m, i) => { if (a < 0 || a > .75) { m.position.y = -5; return; } const th = hash(i) * TAU, sp = .7 + hash(i * 3) * 1.1, vy = 1.6 + hash(i * 7) * 1.9, y = vy * a - 4.9 * a * a;
      m.position.set(SXW + .15 + Math.cos(th) * sp * a, y > 0 ? y + .02 : -5, ZR + Math.sin(th) * sp * .5 * a); m.scale.setScalar(1 - .5 * a); });
    RIPS.forEach((m, k) => { const u = (a - k * .12) / 1.1; m.visible = a > 0 && u > 0 && u < 1; if (m.visible) m.scale.set(.15 + 1.1 * eo(u), 1, .1 + .5 * eo(u)); }); } cam.position.copy(C.p); cam.lookAt(C.l); cam.fov = C.f; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  TH.camPos.value.copy(cam.position); TH.time.value = t;
  // breath puffs (every 0.7 s, drifting back and up, cooling)
  PUFFS.forEach((m, i) => { const tb = Math.floor(t / .7) * .7 - i * .7, age = t - tb; if (tb < 0 || age > 2.4) { m.visible = false; return; }
    const p0 = P3(solveProfile(poseAt(tb)).headC).add(V3(.12, -.03, 0)); m.position.copy(p0).add(V3(-.25 * age, .2 * age, 0)); m.scale.setScalar(.12 + .35 * age); m.lookAt(cam.position); m.visible = true; m.material.uniforms.A.value = .55 * Math.exp(-age / .7); });
  // the shutter freeze (NUC) switches the camera from plain sight to heat; a split at the watch
  const mode = t < T_NUC ? 0 : (t > EV.watchUp + .02 && t < EV.watchDown + .3) ? 2 : 1;
  const frozen = t >= T_NUC && t < T_NUC + NUC_D, tt = frozen ? T_NUC : t;
  if (mode !== 1 || frozen) { setPass('pic'); PUFFS.forEach(m => m.visible = false); renderer.setRenderTarget(rtPic); renderer.setClearColor(0x05070d, 1); renderer.clear(); renderer.render(scene, cam); }
  // thermal pass → sensor → read back
  setPass('th'); const bg = scene.background, fog = scene.fog; scene.background = null; scene.fog = null;
  if (mode !== 0 || frozen) PUFFS.forEach(m => m.visible = m.material.uniforms.A.value > .01 && m.position.y > 0);
  renderer.setRenderTarget(rtTh); renderer.setClearColor(new THREE.Color(1.0, 0, 0), 1); renderer.clear(); renderer.render(scene, cam);   // the sky: 1 °C (cold overcast)
  scene.background = bg; scene.fog = fog;
  quad.material = sensorMat; sensorMat.uniforms.frame.value = Math.round(t * 30); renderer.setRenderTarget(rtS); renderer.render(qScene, qCam);
  renderer.readRenderTargetPixels(rtS, 0, 0, SW, SH, sensorBuf);
  const [lo, hi] = scaleAt(t); const F = finalMat.uniforms; F.lo.value = lo; F.hi.value = hi; F.iso.value = t > 8.15 && t < 9.4 ? 34 : 999;
  F.mode.value = frozen ? 0 : mode; F.freeze.value = frozen ? 1 - (t - T_NUC) / NUC_D : 0;
  if (mode === 2) { const [u] = proj(A.wrist), k = eo(seg(t, EV.watchUp + .02, EV.watchUp + .27)), kb = eio(seg(t, EV.watchDown, EV.watchDown + .3)); F.split.value = lerp(1.02, u, k) * (1 - kb) + kb * 1.02; }
  quad.material = finalMat; renderer.setRenderTarget(null); renderer.render(qScene, qCam);
  overlay(t, A, frozen ? 0 : mode === 0 ? 0 : mode);
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0); window.READY = true;
