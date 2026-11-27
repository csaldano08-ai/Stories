// 099 · Blob Simulation — the first 10 s of "Last Train Home" as a small simulation on a paper lab board
// (lemo-opuscar styles/pip-simulation). One Pip = one individual. Twenty-one late commuters run for the last train down a
// printed street; the trait under study is speed (colour ramp cobalt → butter). AKI is the fastest one, the Pip we follow:
// her motion is the shared run rig (4.06 m/s, a hop at each footfall), the others come from a deterministic run with a fixed
// seed (own speed, steering to keep apart, the street's kerbs). The outcome is computed, not placed: on the chime the board
// marks in mint every Pip that can still reach the gate before midnight at its own speed, and the head count is the result.
//   S1  close on AKI: she hops through the printed puddle at 0.94 s (cream splash fluff, a ring printed on the board)
//   S2  rising to the street: she overtakes the crowd; her tag travels with her; at 6.05 s she checks: "11:58" (a blink to surprised)
//   S3  down to the printed station clock at the board's end: its flocked hand moves 47 → 48 at 8.4 s
//   S4  board-wide on the chime: mint rings, happy and sad faces (by a blink), the head count
// Assumption printed on the board: the gate is 300 m from AKI's start (the board shows the first 64 m).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2, V3 = (x, y, z) => new THREE.Vector3(x, y, z);
await Promise.all(['600 140px FR', '600 40px FR', '500 26px IT', '600 15px IT'].map(f => document.fonts.load(f, 'A0')));
const PAL = { team: ['#4A6FE3', '#8B67D6', '#E0607E', '#F2604A', '#F6BE45'], mint: '#4FBF8F', ink: '#262A3B', board: '#ECE6DA', grid1: '#E0D7C7', grid5: '#D3C6B1', edge: '#C4BFB6', haze: '#E9E2D5', haze2: '#EFE8DC', floor: '#E2D9C9', spent: '#B9B2A6', fluff: '#FFF7EA', blush: '#FF9A8F' };
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = .94;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const ov = document.getElementById('ov').getContext('2d');
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, W / H, .1, 400);
scene.background = new THREE.Color(PAL.haze); scene.fog = new THREE.Fog(PAL.haze, 30, 120);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .42;
const key = new THREE.DirectionalLight('#FFF4E6', 2.8); key.position.set(-30, 45, 30); key.castShadow = true; key.shadow.mapSize.set(4096, 4096); key.shadow.radius = 4; key.shadow.bias = -.0005;
Object.assign(key.shadow.camera, { left: -40, right: 40, top: 26, bottom: -26, near: 10, far: 140 }); key.target.position.set(4, 0, 0); scene.add(key, key.target);
const rimL = new THREE.DirectionalLight('#F3F6FF', 1.3); rimL.position.set(10, 12, -30); scene.add(rimL); scene.add(new THREE.HemisphereLight('#fffaf2', '#d9cfbd', .35));

// ═════════ the run (shared by every style) and the simulation record
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const Xr = t => RUN.pelvisAt(t)[0], UM = .0028, X0 = Xr(0), XS = -28, akiX = t => XS + (Xr(t) - X0) * UM;
const W_T = t => 11 * 3600 + 58 * 60 + 48 + (t - 8.4);
const GATE = XS + 300, T_LEFT = 80.4 - EV.chime;              // the gate 300 m from AKI's start; seconds to midnight on the chime
const PUD = { x: XS + (SPL.x + 44 - X0) * UM, z: .4 };
const N = 21, FPS = 60, STEPS = Math.round(10.2 * FPS);
const R = mulberry(99), PIPS = [];
for (let i = 0; i < N; i++) { const aki = i === 0, v = aki ? 1450 * UM : 1.25 + 2.45 * Math.pow(R(), 1.3); PIPS.push({ aki, v, x: aki ? akiX(0) : XS + 6 + R() * 26, z: aki ? .4 : (R() - .5) * 9, ph: R() * TAU, rec: [] }); }
{ // integrate (deterministic): forward at own speed, separation from neighbours, kept between the kerbs
  const st = PIPS.map(p => ({ x: p.x, z: p.z, vz: 0 }));
  for (let k = 0; k <= STEPS; k++) { const t = k / FPS;
    PIPS.forEach((p, i) => { const s = st[i]; if (p.aki) { s.x = akiX(t); s.z = .4 + .25 * Math.sin(t * .7); p.rec.push([s.x, s.z]); return; }
      let fz = 0; PIPS.forEach((q, j) => { if (i === j) return; const o = st[j], dx = s.x - o.x, dz = s.z - o.z, d2 = dx * dx + dz * dz; if (d2 < 2.4 && d2 > 1e-6 && Math.abs(dx) < 1.6) fz += dz / d2 * .9; });
      if (s.z > 5) fz -= (s.z - 5) * 2; if (s.z < -5) fz -= (s.z + 5) * 2;
      s.vz = lerp(s.vz, clamp(fz, -1.2, 1.2), .08); s.z += s.vz / FPS; s.x += p.v / FPS; p.rec.push([s.x, s.z]); }); } }
const posAt = (p, t) => { const f = clamp(t * FPS, 0, STEPS), i = Math.floor(f), u = f - i, a = p.rec[i], b = p.rec[Math.min(STEPS, i + 1)]; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; };
// the outcome at the chime: who can still reach the gate before midnight at their own speed (computed)
PIPS.forEach(p => { const [x] = posAt(p, EV.chime); p.eta = (GATE - x) / p.v; p.makes = p.eta <= T_LEFT; });
const MAKES = PIPS.filter(p => p.makes).length;
// the trait ramp (speed): the five team colours as stops, interpolated in OKLab
const toLin = c => { const v = new THREE.Color(c); return [v.r, v.g, v.b]; };
const oklab = ([r, g, b]) => { const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b); return [.2104542553 * l + .793617785 * m - .0040720468 * s, 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .808675766 * s]; };
const fromOk = ([L, a, b]) => { const l = (L + .3963377774 * a + .2158037573 * b) ** 3, m = (L - .1055613458 * a - .0638541728 * b) ** 3, s = (L - .0894841775 * a - 1.291485548 * b) ** 3; return new THREE.Color(4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s); };
const RAMP = PAL.team.map(c => oklab(toLin(c)));
const rampC = u => { u = clamp(u) * 4; const i = Math.min(3, Math.floor(u)), f = u - i; return fromOk(RAMP[i].map((v, k) => lerp(v, RAMP[i + 1][k], f))); };
const vmin = 1.25, vmax = 1450 * UM;

// ═════════ the board: a thick paper slab; the grid drawn in the shader (1 m fine, 5 m heavy), paper grain, an ink edge
const BW = 70, BD = 22;
const boardMat = new THREE.MeshStandardMaterial({ color: PAL.board, roughness: .95 });
boardMat.onBeforeCompile = sh => {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.)).xyz;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
    varying vec3 vWP; float gl1(float v, float px){ float f = abs(fract(v - .5) - .5); return 1. - smoothstep(0., px, f / max(fwidth(v), 1e-5)); }
    float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`)
    .replace('#include <color_fragment>', `#include <color_fragment>
    if (vWP.y > .49) { float fade = clamp(1. - length(fwidth(vWP.xz)) * 2.5, 0., 1.);
      float g1 = max(gl1(vWP.x, .8), gl1(vWP.z, .8)) * fade, g5 = max(gl1(vWP.x / 5., 1.1), gl1(vWP.z / 5., 1.1));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${new THREE.Color(PAL.grid1).toArray().map(v => v.toFixed(3))}), g1 * .9);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${new THREE.Color(PAL.grid5).toArray().map(v => v.toFixed(3))}), g5 * .9);
      diffuseColor.rgb *= 1. - (h2(floor(vWP.xz * 40.)) - .5) * .025;
      float e = min(min(${(BW / 2).toFixed(1)} - abs(vWP.x - 8.), ${(BD / 2).toFixed(1)} - abs(vWP.z)), 9.);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${new THREE.Color(PAL.ink).toArray().map(v => v.toFixed(3))}), (1. - smoothstep(.04, .1, e)) * .8); }`);
};
const board = new THREE.Mesh(new THREE.BoxGeometry(BW, 1, BD).translate(8, 0, 0), boardMat); board.receiveShadow = true; scene.add(board);
const floorM = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: PAL.floor, roughness: 1 })); floorM.position.y = -.5; floorM.receiveShadow = true; scene.add(floorM);
// printed matter: canvas textures lying flat on the paper
function printed(wM, dM, draw, x, z, res = 64) { const c = document.createElement('canvas'); c.width = Math.round(wM * res); c.height = Math.round(dM * res); const g = c.getContext('2d'); draw(g, c.width, c.height, res);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(wM, dM).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tx, transparent: true, roughness: .95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); m.position.set(x, .502, z); m.receiveShadow = true; scene.add(m); return { m, g, tx, c }; }
const inkA = a => `rgba(38,42,59,${a})`;
printed(BW - 2, 1.4, (g, w, h, r) => { g.font = `600 ${.5 * r}px IT`; g.fillStyle = inkA(.55); g.textBaseline = 'middle'; for (let x = 0; x < BW - 2; x += 5) { g.fillText(`${x} m`, x * r + 6, h / 2); } }, 8, -BD / 2 + 1.2);   // the distance ruler
printed(30, 2, (g, w, h, r) => { g.font = `600 ${.9 * r}px FR`; g.fillStyle = inkA(.8); g.textBaseline = 'middle'; g.fillText('STATION ROAD', 10, h / 2); g.font = `600 ${.38 * r}px IT`; g.fillStyle = inkA(.55); g.fillText('THE LAST TRAIN LEAVES AT 00:00 · THE GATE IS 300 M FROM THE START', 6.2 * r, h / 2 + .05 * r); }, XS + 16, BD / 2 - 1.6);
// kerbs printed as ink lines; the puddle as a hatched ink shape
printed(BW - 2, .2, (g, w, h) => { g.fillStyle = inkA(.6); g.fillRect(0, h * .35, w, h * .3); }, 8, -6.2); printed(BW - 2, .2, (g, w, h) => { g.fillStyle = inkA(.6); g.fillRect(0, h * .35, w, h * .3); }, 8, 6.2);
printed(3.4, 2, (g, w, h, r) => { g.save(); g.beginPath(); g.ellipse(w / 2, h / 2, w * .46, h * .42, 0, 0, TAU); g.clip(); g.strokeStyle = inkA(.45); g.lineWidth = 2; for (let x = -h; x < w; x += 9) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + h, 0); g.stroke(); } g.restore();
  g.strokeStyle = inkA(.8); g.lineWidth = 3; g.beginPath(); g.ellipse(w / 2, h / 2, w * .46, h * .42, 0, 0, TAU); g.stroke(); g.font = `600 ${.26 * r}px IT`; g.fillStyle = inkA(.6); g.fillText('PUDDLE', w * .32, h * .95); }, PUD.x, PUD.z);
// the gate arrow at the board's end; the printed station clock with a flocked hand
printed(6, 3, (g, w, h, r) => { g.fillStyle = inkA(.8); g.font = `600 ${.55 * r}px FR`; g.fillText('GATE', .3 * r, 1.0 * r); g.font = `600 ${.32 * r}px IT`; g.fillStyle = inkA(.6); g.fillText(`${Math.round(GATE - (8 + BW / 2))} M FURTHER →`, .3 * r, 1.6 * r);
  g.strokeStyle = inkA(.8); g.lineWidth = 6; g.beginPath(); g.moveTo(.3 * r, 2.3 * r); g.lineTo(5.4 * r, 2.3 * r); g.lineTo(5.0 * r, 2.0 * r); g.moveTo(5.4 * r, 2.3 * r); g.lineTo(5.0 * r, 2.6 * r); g.stroke(); }, 38.5, -3.5);
const CLK = { x: 38, z: 3.6, r: 2.2 };
printed(5.4, 5.4, (g, w, h, r) => { const cx = w / 2, cy = h / 2, R0 = CLK.r * r; g.fillStyle = 'rgba(255,253,248,.9)'; g.beginPath(); g.arc(cx, cy, R0, 0, TAU); g.fill(); g.strokeStyle = inkA(.85); g.lineWidth = 8; g.stroke();
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU - Math.PI / 2, l = i % 5 ? .12 : .3; g.lineWidth = i % 5 ? 3 : 6; g.beginPath(); g.moveTo(cx + Math.cos(a) * R0 * .92, cy + Math.sin(a) * R0 * .92); g.lineTo(cx + Math.cos(a) * R0 * (.92 - l), cy + Math.sin(a) * R0 * (.92 - l)); g.stroke(); }
  g.font = `600 ${.34 * r}px IT`; g.fillStyle = inkA(.6); g.textAlign = 'center'; g.fillText('STATION CLOCK', cx, cy + R0 + .42 * r); }, CLK.x, CLK.z, 96);
const flock = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .9, specularIntensity: .1, sheen: 1, sheenColor: new THREE.Color(c).lerp(new THREE.Color('#ffffff'), .35), sheenRoughness: .35, ...o });
const handG = (L, w, y) => { const p = new THREE.Group(); p.position.set(CLK.x, .52 + y, CLK.z); scene.add(p); const m = new THREE.Mesh(new THREE.CapsuleGeometry(w, L, 4, 8).rotateX(Math.PI / 2).translate(0, 0, -L / 2 + .15), flock(PAL.ink)); m.castShadow = true; p.add(m); return p; };
const hHr = handG(1.0, .09, .05), hMn = handG(1.55, .07, .12), hSc = handG(1.75, .04, .2);

// ═════════ the Pip: a flocked mochi body (lathe), a curled tuft, two flat feet, an ink face that changes by a blink
const bodyGeo = new THREE.LatheGeometry([[0, 0], [.46, 0], [.525, .05], [.535, .2], [.5, .44], [.4, .66], [.22, .83], [.08, .89], [0, .9]].map(p => new THREE.Vector2(...p)), 40);
const tuftGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, .86, 0), V3(.02, 1.0, -.02), V3(.1, 1.08, -.05), V3(.16, 1.02, -.04)]), 20, .045, 8, false);
const tuftEnd = new THREE.SphereGeometry(.055, 12, 8), footGeo = new THREE.SphereGeometry(1, 14, 8), eyeGeo = new THREE.SphereGeometry(1, 16, 12), glintGeo = new THREE.SphereGeometry(1, 8, 6);
const mouthGeo = new THREE.TorusGeometry(.065, .014, 6, 16, Math.PI), browGeo = new THREE.CapsuleGeometry(.012, .07, 2, 6).rotateZ(Math.PI / 2), blushGeo = new THREE.CircleGeometry(.055, 16);
const inkM = new THREE.MeshStandardMaterial({ color: PAL.ink, roughness: .15, metalness: 0 }), inkMat = new THREE.MeshStandardMaterial({ color: PAL.ink, roughness: .85 }), whiteM = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const shadowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(.6, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const shadowM = new THREE.MeshBasicMaterial({ map: shadowTex, color: '#3a3222', transparent: true, depthWrite: false, fog: false });   // a clean radial contact shadow
function makePip(col) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); const bm = flock(col);
  const add = (geo, m, x, y, z, sx = 1, sy = sx, sz = sx, par = body) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = m !== whiteM; par.add(o); return o; };
  add(bodyGeo, bm, 0, 0, 0); add(tuftGeo, bm, 0, 0, 0); add(tuftEnd, bm, .16, 1.02, -.04);
  const fm = flock(new THREE.Color(col).multiplyScalar(.8)); const feet = [add(footGeo, fm, -.19, .035, .3, .14, .055, .13, g), add(footGeo, fm, .19, .035, .3, .14, .055, .13, g)];
  const face = new THREE.Group(); face.position.set(0, .52, .45); body.add(face);
  const eyes = [-1, 1].map(s => { const e = add(eyeGeo, inkM, s * .14, 0, .02, .062, .1, .05, face); add(glintGeo, whiteM, s * .14 - .02, .035, .07, .022, .022, .01, face); add(glintGeo, whiteM, s * .14 + .015, -.03, .07, .011, .011, .006, face); return e; });
  const bl = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).lerp(new THREE.Color(PAL.blush), .3), transparent: true, opacity: .75 }); [-1, 1].forEach(s => { const b = add(blushGeo, bl, s * .26, -.1, .0, 1, .7, 1, face); b.castShadow = false; b.lookAt(face.localToWorld(V3(s * .4, -.1, 1))); b.rotation.set(0, s * .5, 0); });
  const mouth = add(mouthGeo, inkMat, 0, -.13, .03, 1, 1, 1, face); mouth.rotation.z = Math.PI;
  const brows = [-1, 1].map(s => { const b = add(browGeo, inkMat, s * .14, .13, .04, 1, 1, 1, face); b.visible = false; return b; });
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5).rotateX(-Math.PI / 2), shadowM); sh.position.y = .505; g.add(sh);
  scene.add(g); return { g, body, feet, eyes, mouth, brows, bm, face };
}
PIPS.forEach(p => { p.u = (p.v - vmin) / (vmax - vmin); p.col = p.aki ? new THREE.Color(PAL.team[4]) : rampC(Math.min(.92, p.u)); p.mesh = makePip(p.col); p.mesh.g.scale.setScalar(p.aki ? 1.25 : 1.15); });
// splash fluff (cream balls that stay where they land and shrink) and the printed ring
const FLUFF = Array.from({ length: 12 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), flock(PAL.fluff)); m.castShadow = true; scene.add(m); return { m, th: hash(i * 3.1) * TAU, sp: 1.4 + hash(i * 7.7) * 1.8, vy: 2.2 + hash(i * 1.3) * 2 }; });
const ringM = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: PAL.ink, transparent: true, opacity: .6, depthWrite: false })); ringM.position.set(PUD.x, .506, PUD.z); scene.add(ringM);
const MINT = PIPS.map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(.62, .78, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: PAL.mint, transparent: true, opacity: 0, depthWrite: false })); m.position.y = .507; scene.add(m); return m; });

// ═════════ expressions (eyes, mouth, brows only; changes through a blink)
function setFace(P, expr, blink) {
  const M = P.mesh; M.eyes.forEach(e => e.scale.y = .1 * (1 - .92 * blink) * (expr === 'surprised' ? 1.25 : expr === 'happy' ? .85 : 1));
  M.mouth.scale.set(expr === 'surprised' ? .7 : 1, expr === 'surprised' ? 1.6 : expr === 'sad' ? -1 : 1, 1); M.mouth.position.y = expr === 'sad' ? -.17 : -.13;
  M.brows.forEach((b, i) => { b.visible = expr === 'determined' || expr === 'sad'; const s = i ? 1 : -1; b.rotation.z = (expr === 'determined' ? -.35 : .35) * s; });
}
const exprAt = (p, t) => { if (t >= EV.chime + .12) return p.makes ? 'happy' : 'sad'; if (p.aki) return t >= EV.watchUp + .08 && t < EV.watchDown + .1 ? 'surprised' : 'determined'; return p.v > 2.6 ? 'determined' : 'neutral'; };
const blinkAt = (p, t) => { const marks = p.aki ? [EV.watchUp, EV.watchDown, EV.chime] : [EV.chime, 2 + (p.ph % 3)]; let b = 0; for (const m of marks) { const d = t - m; if (d > -.02 && d < .16) b = Math.max(b, Math.sin(clamp((d + .02) / .18) * Math.PI)); } return b; };

// ═════════ hop by distance: phase = distance / stride; AKI hops at each footfall of the rig
function placePip(p, t) {
  const [x, z] = posAt(p, t), [x2, z2] = posAt(p, t + .05), M = p.mesh, yaw = Math.atan2(x2 - x, z2 - z);
  let hop, lean;
  if (p.aki) { const c = RUN.contacts.filter(c => c.t0 <= t).pop(), n = RUN.contacts.find(c => c.t0 > t); const u = c && n ? (t - c.t0) / (n.t0 - c.t0) : 0; hop = Math.sin(Math.PI * u) * .38; lean = .2; }
  else { const stride = .55 + p.v * .22, ph = (x - p.rec[0][0]) / stride + p.ph; hop = Math.abs(Math.sin(Math.PI * ph)) * (.1 + p.v * .05); lean = .1 + p.v * .03; }
  M.g.position.set(x, .5, z); M.g.rotation.y = yaw; M.body.position.y = hop; M.body.rotation.x = lean;
  const sq = 1 + (hop < .04 ? -.07 * (1 - hop / .04) : .05 * Math.sin(hop * 4)); M.body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
  setFace(p, exprAt(p, t), blinkAt(p, t)); return [x, z];
}
// ═════════ cameras (real perspective; type only on clean ground)
function camAt(t) {
  const K = (p, l, f = 32) => ({ p, l, f }), mix = (a, b, k) => K(a.p.clone().lerp(b.p, k), a.l.clone().lerp(b.l, k), lerp(a.f, b.f, k)), ax = akiX(t);
  const C1 = t => K(V3(akiX(t) + 2.8, 2.9, 8.6), V3(akiX(t) + 1.2, .9, .3), 30);
  const C2 = t => K(V3(akiX(t) - 3 + 2 * seg(t, 2.5, 7.5), 13, 21), V3(akiX(t) + 4, .8, -1), 32);
  const C3 = t => K(V3(CLK.x + .6, 6.8, CLK.z + 7.2 - .6 * seg(t, 7.9, 9.3)), V3(CLK.x + .2, .5, CLK.z - .2), 30);
  const C4 = K(V3(10, 34, 40), V3(9, 0, 2.5), 34);
  if (t < 2.5) return C1(t);
  if (t < 7.5) return t < 3.3 ? mix(C1(2.5), C2(3.3), eio(seg(t, 2.5, 3.3))) : C2(t);
  if (t < 9.375) return t < 7.95 ? mix(C2(7.5), C3(7.95), eio(seg(t, 7.5, 7.95))) : C3(t);
  return mix(C3(9.375), C4, eio(seg(t, 9.375, 9.8)));
}
const proj = p => { const q = p.clone().project(cam); return [(q.x + 1) / 2 * W, (1 - q.y) / 2 * H]; };
const ink = a => `rgba(38,42,59,${a})`;
function eyebrow(s, x, y, a = .55) { ov.font = '600 15px IT'; ov.letterSpacing = '2px'; ov.fillStyle = ink(a); ov.textBaseline = 'alphabetic'; ov.fillText(s.toUpperCase(), x, y); ov.letterSpacing = '0px'; }
function tag(p, t, big, label, energy) {   // travels with the Pip: beside its head, its value in Fredoka, one word for its state, a mint energy bar
  const [x, z] = posAt(p, t), [hx, hy] = proj(V3(x, 2.1, z)), bx = hx + 40, by = hy - 70;
  ov.fillStyle = 'rgba(236,230,218,.86)'; ov.beginPath(); ov.roundRect(bx - 14, by - 46, Math.max(150, ov.measureText(big).width + 60), 104, 14); ov.fill();
  ov.font = '600 40px FR'; ov.fillStyle = PAL.ink; ov.textBaseline = 'alphabetic'; ov.fillText(big, bx, by); eyebrow(label, bx, by + 24, .75);
  if (energy != null) { ov.fillStyle = ink(.15); ov.fillRect(bx, by + 34, 120, 8); ov.fillStyle = PAL.mint; ov.fillRect(bx, by + 34, 120 * energy, 8); }
}
function overlay(t) {
  ov.setTransform(1, 0, 0, 1, 0, 0); ov.clearRect(0, 0, W, H);
  const A = PIPS[0];
  if (t < 2.5) { eyebrow('Station Road · 23:58:40 · twenty-one late commuters', 96, 96); ov.font = '500 26px IT'; ov.fillStyle = ink(.75); ov.fillText('One Pip is one person. Colour is speed.', 96, 134); }
  if (t > .3 && t < 7.5) { const watch = t > EV.watchUp + .05 && t < EV.watchDown + .2; tag(A, t, watch ? '11:58' : '4.06 m/s', watch ? 'her watch' : t < EV.splash + .5 && t > EV.splash - .05 ? 'splash' : 'AKI · running', watch ? null : 1 - t * .012); }
  if (t > 2.6 && t < 7.4) { // the speed ramp, printed in the margin
    const x0 = 96, y0 = 1000; eyebrow('speed', x0, y0 - 24); for (let i = 0; i < 200; i++) { ov.fillStyle = '#' + rampC(i / 200).getHexString(); ov.fillRect(x0 + i * 2, y0 - 8, 2, 18); }
    ov.font = '500 22px IT'; ov.fillStyle = ink(.75); ov.fillText(`${vmin.toFixed(1)} m/s`, x0, y0 + 40); ov.fillText(`${vmax.toFixed(2)} m/s`, x0 + 330, y0 + 40); }
  if (t > 8.0 && t < 9.4) { const s = Math.floor(W_T(t) + 1e-6) % 60; ov.font = '600 140px FR'; ov.fillStyle = PAL.ink; ov.fillText(`23:58:${String(s).padStart(2, '0')}`, 96, 210); eyebrow('the station clock', 100, 250, .6); }
  if (t > EV.chime + .1) { const k = seg(t, EV.chime + .1, EV.chime + .3); ov.globalAlpha = k; ov.font = '600 150px FR'; ov.fillStyle = PAL.ink; ov.fillText(`${MAKES} of ${N}`, 96, 220);
    ov.font = '500 28px IT'; ov.fillText('can still reach the gate before midnight, at their own speed', 100, 268); ov.fillStyle = PAL.mint; ov.fillRect(100, 286, 640 * eo(seg(t, EV.chime + .2, EV.chime + .4)), 5);
    eyebrow(`simulated · fixed seed · gate 300 m from the start · ${Math.round(T_LEFT)} s to midnight`, 100, 320, .55); ov.globalAlpha = 1; }
}
window.render = t => {
  t = clamp(+t || 0, 0, DUR);
  PIPS.forEach((p, i) => { placePip(p, t); const [x, z] = posAt(p, t); MINT[i].position.set(x, .507, z); MINT[i].material.opacity = p.makes ? .9 * seg(t, EV.chime + .1 + i * .008, EV.chime + .25 + i * .008) : 0;
    if (t >= EV.chime + .12 && !p.makes) p.mesh.bm.color.copy(p.col).lerp(new THREE.Color(PAL.spent), .35 * seg(t, EV.chime + .12, EV.chime + .4)); else p.mesh.bm.color.copy(p.col); });
  // the splash: fluff kicked up, landing and shrinking; a ring printed on the board
  const a = t - SPL.t0; FLUFF.forEach(f => { if (a < 0) { f.m.visible = false; return; } f.m.visible = true; const ta = Math.min(a, .55), y = .5 + f.vy * ta - 4.9 * ta * ta; f.m.position.set(PUD.x + .3 + Math.cos(f.th) * f.sp * ta, Math.max(.55, y), PUD.z + Math.sin(f.th) * f.sp * .6 * ta); f.m.scale.setScalar(a < .55 ? 1 : Math.max(0, 1 - (a - .55) / 1.5)); });
  ringM.visible = a > 0 && a < 1.2; if (ringM.visible) { const u = eo(a / 1.2); ringM.scale.setScalar(.3 + 2.4 * u); ringM.material.opacity = .6 * (1 - u); }
  const s = W_T(t), sec = Math.floor(s + 1e-6) % 60, mn = 58 + (s % 60) / 60; hSc.rotation.y = -sec / 60 * TAU; hMn.rotation.y = -mn / 60 * TAU; hHr.rotation.y = -(11 + mn / 60) / 12 * TAU;
  const C = camAt(t); cam.position.copy(C.p); cam.lookAt(C.l); cam.fov = C.f; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  scene.fog.near = t < 2.5 || (t > 7.95 && t < 9.375) ? 9 : 40; scene.fog.far = t < 2.5 || (t > 7.95 && t < 9.375) ? 38 : 140;
  renderer.render(scene, cam); overlay(t);
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(RUN.pose(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0); window.READY = true;
