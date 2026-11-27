// 083 · Paper Pop-up Book — the first 10 s of "Last Train Home" as a pop-up book on a real desk (lemo-opuscar styles/paper-popup).
// Two worlds in one frame: the real desk (the library's own CC0 Poly Haven assets: lythwood lounge HDRI, walnut veneer, an arm desk lamp,
// a tea set) and a hardcover book open on it. Inside, a night street: the backdrop page is the sky (moon and stars on threads), shopfronts
// stand as pop-up cards, and the pavement is a pull-tab band that slides through two slots in the page, so AKI can run on the spot:
// a flat cut-paper actor (ink outline, crescent shading, thick off-white border, grey card edge) redrawn every frame from the shared rig,
// her planted foot moving with the band (no sliding). The paper puddle rides the band.
//   S1  eye-level macro: the band carries the puddle under her; at 0.94 s her far foot lands in it: paper droplets pop up, SPLASH!
//   S2  pull up to a 3/4 view of the spread (the band, the slots, the row of shops); at 6.05 s she raises her wrist: a thought bubble types 11:58!
//   S3  cut to a push-in: a pop-up watch card springs up beside her; its paper second hand on a brass brad ticks 47 → 48 at 8.4 s
//   S4  cut to the spread: the clock tower rises at the back (back to front, with overshoot); on the chime (9.58 s) its paper bell swings: DING!
// Page contract: window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makeBook, coverCanvases, texOf, BW, BD, PG } from './src/book.js';
import { cutMesh, blobShadow, thread, particles } from './src/cutmesh.js';
import * as A from './src/art.js';
import { cv, paperFill, finishCut, INK, sh, blob, crescent, GRAIN, rr } from './src/paper.js';
import { makePost } from './src/post.js';
import { track } from './src/lib.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash, mulberry } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2;
await Promise.all(['700 40px Fredoka', '600 40px Fredoka', '40px "Lilita One"'].map(f => document.fonts.load(f, 'Aa0')));

// ═════════ the run (shared by every style)
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const X = t => RUN.pelvisAt(t)[0];
function poseAt(t) {
  const S_ = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S_.watch = w;
  if (w > 0) { const J0 = solveProfile(S_), sh_ = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh_[0] + lerp(70, 92, wm), sh_[1] + lerp(150, 50, wm)];
    S_.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S_.arms.f.sh *= 1 - .45 * wm; S_.head += .26 * wm; S_.neck += .08 * wm; }
  return S_;
}
const SIM = (() => {
  const dt = 1 / 240, n = Math.ceil(11 / dt), tail = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const th = [-.2, -.1, 0], vt = [0, 0, 0], py = t => RUN.pelvisAt(t)[1], ay = t => (py(t + dt) - 2 * py(t) + py(t - dt)) / (dt * dt);
  for (let i = 0; i < n; i++) { const t = -.5 + i * dt, Ac = ay(t);
    for (let k = 0; k < 3; k++) { const par = k ? th[k - 1] : -.1, rest = .16 + .05 * k; vt[k] += (-60 * (th[k] - (par + rest)) - 6 * vt[k] + .014 * Ac * (k + 1) * .6) * dt; th[k] += vt[k] * dt; tail[k][i] = th[k]; } }
  return { tail: t => tail.map(a => a[clamp(Math.round((t + .5) / dt), 0, n - 1)]) };
})();
const W_T = t => 11 * 3600 + 58 * 60 + 48 + (t - 8.4);

// ═════════ renderer, the real desk
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, canvas: document.getElementById('gl') });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 16 / 9, .004, 30), post = makePost(renderer, scene, cam, W, H);
const ASSET = '/core/assets/polyhaven/';
const hdr = await new RGBELoader().loadAsync(ASSET + 'lythwood_lounge_2k.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = hdr; scene.background = hdr; scene.backgroundBlurriness = .25; scene.backgroundIntensity = .62; scene.environmentIntensity = .2;
scene.backgroundRotation.set(0, 2.3, 0); scene.environmentRotation.set(0, 2.3, 0);
const tl = new THREE.TextureLoader(), wt = n => { const t = tl.load(ASSET + `walnut_${n}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.2, 1.4); t.anisotropy = 12; return t; };
const wdiff = wt('diff'); wdiff.colorSpace = THREE.SRGBColorSpace;
const desk = new THREE.Mesh(new THREE.BoxGeometry(2.6, .04, 1.7), new THREE.MeshStandardMaterial({ map: wdiff, normalMap: wt('nor'), roughnessMap: wt('rough'), color: '#c9a88a', envMapIntensity: .8 }));
desk.position.set(0, -.02, .25); desk.receiveShadow = true; scene.add(desk);
const gl = new GLTFLoader();
async function prop(name, x, z, s, ry) { const m = (await gl.loadAsync(ASSET + `${name}/${name}.gltf`)).scene; m.position.set(x, 0, z); m.scale.setScalar(s); m.rotation.y = ry; m.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(m); return m; }
const lamp = await prop('desk_lamp_arm_01', -.347, .51, .55, -.76);
lamp.traverse(o => { if (o.isMesh && o.material.name.includes('light')) { o.material = o.material.clone(); o.material.emissive = new THREE.Color('#ffd9a0'); o.material.emissiveIntensity = 6; } });
const tea = await prop('tea_set_01', 0, 0, 1, 0);
{ const keep = { tea_set_01_teapot_01: [.52, .2, .5], tea_set_01_teapot_01_lid: [.52, .2, .5], tea_set_01_cup_small_01: [.36, .5, 2.2], tea_set_01_saucer_circular_04: [.36, .5, 0] }, dead = [];
  tea.traverse(o => { if (!o.name.startsWith('tea_set_01_') || o === tea) return; const k = keep[o.name]; if (!k) { if (o.isMesh) dead.push(o); } else { o.position.x = k[0]; o.position.z = k[1]; o.rotation.y = k[2]; } });
  dead.forEach(o => o.parent && o.parent.remove(o)); tea.traverse(o => { if (o.name === 'tea_set_01_cup_small_01') o.position.y += .012; }); }

// ═════════ the book: night-street spread
const cover = coverCanvases((x, px, py, w, h) => { x.save(); x.translate(px + w / 2, py + h / 2); x.fillStyle = '#fff4dc'; x.beginPath(); x.arc(0, 0, w * .34, 0, TAU); x.fill(); x.strokeStyle = '#3a2a24'; x.lineWidth = 14; x.stroke(); x.lineWidth = 16; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -w * .25); x.moveTo(0, 0); x.lineTo(-w * .12, -w * .1); x.stroke(); x.restore(); });
const book = makeBook(cover); scene.add(book.root); book.setOpen(Math.PI / 2);
const PW = 2048, PH = Math.round(2048 * BD / BW), gx = xm => (xm / BW + .5) * PW, gz = zm => zm / BD * PH;
const BAND_Z = .205, BAND_W = .058;
{ const c = cv(PW, PH), x = c.getContext('2d'); paperFill(x, PW, PH, '#5a6aa0', 4, .05);
  x.fillStyle = '#3f4a7c'; x.fillRect(0, gz(.255), PW, PH - gz(.255)); x.fillStyle = '#e8d9a8'; x.fillRect(0, gz(.248), PW, 14);   // the road edge, the kerb
  for (let i = 0; i < 9; i++) { x.fillStyle = '#d9c46e'; x.fillRect(80 + i * 240, gz(.28), 110, 10); }                                // road markings
  x.fillStyle = '#2b2440'; for (const z of [BAND_Z - BAND_W / 2 - .002, BAND_Z + BAND_W / 2]) x.fillRect(gx(-.205), gz(z), gx(.205) - gx(-.205), 6);   // the two slots
  x.save(); x.globalAlpha = .7; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, PW, PH); x.restore();
  book.groundMat.map = texOf(c); book.groundMat.needsUpdate = true; }
{ const c = cv(PW, PH), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, PH); g.addColorStop(0, '#1b1f4a'); g.addColorStop(.75, '#36366e'); g.addColorStop(1, '#5b4a7e'); x.fillStyle = g; x.fillRect(0, 0, PW, PH);
  const R = mulberry(5); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,240,200,${.4 + R() * .5})`; x.beginPath(); x.arc(R() * PW, R() * PH * .7, 2 + R() * 4, 0, TAU); x.fill(); }
  x.fillStyle = '#221c3a'; for (let i = 0; i < 14; i++) { const bx = i * 150 + R() * 40, bh = 120 + R() * 180; x.fillRect(bx, PH - bh, 130, bh); }                       // far rooftops
  x.save(); x.globalAlpha = .7; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, PW, PH); x.restore();
  book.backMat.map = texOf(c); book.backMat.needsUpdate = true; }
// the pull-tab band: a paper strip sliding through the slots (its texture scrolls: the strip is longer than the page)
const BAND_L = .4, SC = .045 / 578;                   // AKI is 4.5 cm tall: metres per rig unit
const bandTex = (() => { const c = cv(2400, 340), x = c.getContext('2d'); paperFill(x, 2400, 340, '#8f98b8', 9, .05);
  for (let i = 0; i <= 12; i++) { x.fillStyle = '#6f7898'; x.fillRect(i * 200 - 3, 0, 6, 340); } x.fillStyle = '#6f7898'; x.fillRect(0, 168, 2400, 5);
  x.strokeStyle = INK; x.lineWidth = 5; x.strokeRect(2, 2, 2396, 336); const t = texOf(c); t.wrapS = THREE.RepeatWrapping; return t; })();
const band = new THREE.Mesh(new THREE.PlaneGeometry(BW - .03, BAND_W), new THREE.MeshStandardMaterial({ map: bandTex, roughness: .9 })); band.rotation.x = -Math.PI / 2; band.position.set(0, .0009, BAND_Z); band.receiveShadow = true; book.stage.add(band);
const shiftAt = t => (X(t) - X(0)) * SC;               // how far the band has slid under her (her planted foot rides it)
// the puddle on the band (glossy blue paper)
const PUD = A.cut(.05, .016, (x, w, h) => { x.beginPath(); x.ellipse(w / 2, h / 2, w * .48, h * .45, 0, 0, TAU); sh(x, '#4fa3e0', 7); x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.ellipse(w * .38, h * .38, w * .18, h * .1, -.2, 0, TAU); x.fill(); }, { border: 10, ay: .5 });
const pudMesh = cutMesh(PUD, { shadow: false }); pudMesh.rotation.x = -Math.PI / 2; book.stage.add(pudMesh);
pudMesh.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.roughness = .12; } });
const PUD_X0 = (SPL.x + 44 - X(0)) * SC;              // the splash point's place on the band at t = 0, relative to her

// ═════════ pop-up cards: shops (static), lamp posts, moon and stars on threads; the watch and the tower rise when their time comes
const pops = [];
function popper(item, x, z, o = {}) { const g = new THREE.Group(), m = cutMesh(item, { s: o.s ?? 1 }); g.add(m); g.position.set(x, .001, z); g.rotation.y = o.ry || 0; book.stage.add(g); pops.push({ g, m, t0: o.t0 ?? -1, t1: o.t1, dur: o.dur ?? .35, sway: o.sway ?? 0, ph: hash(x * 91) * TAU }); return g; }
const shop = (name, col, w, h, seed) => A.cut(w, h, (x, W_, H_) => { const R = mulberry(seed);
  x.beginPath(); x.rect(0, H_ * .1, W_, H_ * .9); sh(x, col, 7); x.beginPath(); x.moveTo(-10, H_ * .12); x.lineTo(W_ / 2, 0); x.lineTo(W_ + 10, H_ * .12); sh(x, '#3c3360', 7);
  for (let k = 0; k < 2; k++) { x.beginPath(); x.rect(W_ * (.12 + k * .44), H_ * .52, W_ * .32, H_ * .26); sh(x, R() > .3 ? '#ffd766' : '#4a4470', 5); }
  x.beginPath(); x.rect(W_ * .18, H_ * .22, W_ * .64, H_ * .16); sh(x, '#fff4dc', 5); x.fillStyle = INK; x.font = `700 ${H_ * .1}px Fredoka`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(name, W_ / 2, H_ * .31); }, { border: 12 });
[['HOTEL', '#6b5ba0', -.17], ['BAR', '#8a4d7c', -.085], ['BOOKS', '#4f6aa0', .0], ['NOODLES', '#7a5a9a', .09]].forEach(([n, c, x], i) => popper(shop(n, c, .07, .085, i + 3), x, .075 + (i % 2) * .012));
const lampPost = A.cut(.012, .07, (x, W_, H_) => { x.beginPath(); x.rect(W_ * .4, H_ * .12, W_ * .2, H_ * .88); sh(x, '#3c3360', 5); x.beginPath(); x.arc(W_ / 2, H_ * .1, W_ * .45, 0, TAU); sh(x, '#ffe08a', 5); }, { border: 10 });
for (const x of [-.13, .05]) { const g = popper(lampPost, x, .14); const glow = new THREE.PointLight('#ffcf80', .006, .09, 2); glow.position.set(0, .064, .004); g.add(glow); }
{ const moon = cutMesh(A.moon(.022)), th = thread(.06); const g = new THREE.Group(); g.add(th, moon); moon.position.y = -.0; th.position.y = 0; g.position.set(-.12, .2, .012); book.sky.add(g); pops.push({ g, m: moon, t0: -1, sway: .02, ph: 1, hang: true }); }
for (let i = 0; i < 4; i++) { const s = cutMesh(A.star(.008)), g = new THREE.Group(), th = thread(.04 + i * .015); g.add(th, s); g.position.set(-.02 + i * .05, .24 - i * .01, .01); book.sky.add(g); pops.push({ g, m: s, t0: -1, sway: .03, ph: i }); }
// the watch card (V-fold, rises at 7.5 s) with a paper second hand on a brass brad
const WATCH = A.cut(.05, .062, (x, W_, H_) => { x.beginPath(); rr(x, W_ * .36, 0, W_ * .28, H_, 18); sh(x, '#c0463c', 6);   // strap
  const cx = W_ / 2, cy = H_ * .5, r = W_ * .46; x.beginPath(); x.arc(cx, cy, r, 0, TAU); sh(x, '#d9b25b', 8); x.beginPath(); x.arc(cx, cy, r * .84, 0, TAU); sh(x, '#fff8e6', 6);
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0; x.strokeStyle = INK; x.lineWidth = big ? 7 : 3; x.beginPath(); x.moveTo(cx + Math.sin(a) * r * (big ? .64 : .72), cy - Math.cos(a) * r * (big ? .64 : .72)); x.lineTo(cx + Math.sin(a) * r * .78, cy - Math.cos(a) * r * .78); x.stroke(); }
  x.fillStyle = INK; x.font = `700 ${r * .22}px Fredoka`; x.textAlign = 'center'; x.textBaseline = 'middle'; [['12', 0], ['3', 1], ['6', 2], ['9', 3]].forEach(([s, i]) => { const a = i / 4 * TAU; x.fillText(s, cx + Math.sin(a) * r * .5, cy - Math.cos(a) * r * .5); });
  const mn = 58.8 / 60 * TAU, hr = (11 + 58.8 / 60) / 12 * TAU; x.lineCap = 'round'; x.strokeStyle = INK; x.lineWidth = 12; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.sin(hr) * r * .4, cy - Math.cos(hr) * r * .4); x.stroke();
  x.lineWidth = 8; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.sin(mn) * r * .62, cy - Math.cos(mn) * r * .62); x.stroke(); }, { border: 14 });
const watchG = popper(WATCH, .072, .255, { t0: 7.45, dur: .38, ry: -.35, t1: 9.3 });
const SEC = A.cut(.0035, .022, (x, W_, H_) => { x.beginPath(); rr(x, W_ * .3, 0, W_ * .4, H_ * .8, 6); sh(x, '#d43c2e', 4); x.beginPath(); x.arc(W_ / 2, H_ * .8, W_ * .5, 0, TAU); sh(x, '#d9b25b', 4); }, { border: 6, ay: .8 });
const secHand = cutMesh(SEC); const secPivot = new THREE.Group(); secPivot.add(secHand); secPivot.position.set(0, .031, .0012); watchG.children[0].add(secPivot);
// the clock tower (rises at 9.375 s) and its paper bell on a thread
const TOWER = A.cut(.06, .17, (x, W_, H_) => { const tw = W_ * .7, l = (W_ - tw) / 2; x.beginPath(); x.rect(l, H_ * .3, tw, H_ * .7); sh(x, '#8b7fb8', 7);
  x.beginPath(); x.moveTo(l - 12, H_ * .3); x.lineTo(W_ / 2, H_ * .02); x.lineTo(l + tw + 12, H_ * .3); sh(x, '#4a3f6b', 7); x.beginPath(); x.rect(l + tw * .18, H_ * .33, tw * .64, H_ * .12); sh(x, '#2b2440', 5);
  const cx = W_ / 2, cy = H_ * .56, r = tw * .34; x.beginPath(); x.arc(cx, cy, r, 0, TAU); sh(x, '#fff4dc', 7); x.lineCap = 'round'; x.strokeStyle = INK; x.lineWidth = 9; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx - r * .1, cy - r * .55); x.stroke(); x.lineWidth = 6; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx - r * .06, cy - r * .8); x.stroke();
  for (let k = 0; k < 4; k++) { x.beginPath(); x.rect(l + tw * .3, H_ * (.7 + k * .07), tw * .4, H_ * .04); sh(x, '#ffd766', 4); } }, { border: 14 });
const towerG = popper(TOWER, .135, .045, { t0: 9.375, dur: .26 });
const BELL = A.cut(.016, .014, (x, W_, H_) => { x.beginPath(); x.moveTo(W_ * .1, H_); x.quadraticCurveTo(W_ * .15, H_ * .1, W_ / 2, H_ * .05); x.quadraticCurveTo(W_ * .85, H_ * .1, W_ * .9, H_); x.closePath(); sh(x, '#e0b456', 5); }, { border: 8, ay: 0 });
const bellG = new THREE.Group(), bell = cutMesh(BELL); bell.position.y = -.004; bellG.add(thread(.004), bell); bellG.position.set(0, TOWER.h * .63, .003); towerG.children[0].add(bellG);
function updatePops(t) {
  for (const p of pops) { if (p.hang) { p.g.rotation.z = Math.sin(t * 1.3 + p.ph) * p.sway; continue; }
    const k = (p.t0 < 0 ? 1 : back(seg(t, p.t0, p.t0 + p.dur), 1.7)) * (p.t1 ? 1 - eio(seg(t, p.t1, p.t1 + .2)) : 1); p.g.visible = p.t0 < 0 || t > p.t0 - .05; p.m.rotation.x = -Math.PI / 2 * (1 - k); if (p.sway) p.g.rotation.z = Math.sin(t * 1.3 + p.ph) * p.sway; }
}

// ═════════ AKI: a flat cut-paper card redrawn every frame from the rig (anchor = her feet, on the band)
const PXM = 8400, AK = SC * PXM, CW = 470, CH = 500, AX = 235, AY = 470;      // px per rig unit on her card
const akiArt = cv(CW, CH), akiItem = { c: cv(CW, CH), w: CW / PXM, h: CH / PXM, ax: AX / CW, ay: AY / CH };
const akiTex = texOf(akiItem.c), akiMesh = cutMesh(akiItem, { tex: akiTex }); akiMesh.position.set(0, .0012, BAND_Z); book.stage.add(akiMesh);
function drawAki(t) {
  const x = akiArt.getContext('2d'); x.clearRect(0, 0, CW, CH); const J = solveProfile(poseAt(t)), x0 = X(t), P = p => [AX + (p[0] - x0) * AK, AY + p[1] * AK];
  const LW = 6, stroke = (pts, w, col) => { x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = INK; x.lineWidth = w + LW * 2; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(...P(p)) : x.moveTo(...P(p))); x.stroke(); x.strokeStyle = col; x.lineWidth = w; x.stroke(); };
  const leg = (k, col, shoe) => { const l = J.leg[k], c = Math.cos(l.pitch), s = Math.sin(l.pitch); stroke([l.hip, l.knee, l.ankle], 30 * AK * 2.2, col); stroke([l.ankle, [l.ankle[0] + 66 * c, l.ankle[1] + 66 * s]], 20 * AK * 2.2, shoe); };
  const arm = (k, col) => { const a = J.arm[k]; stroke([a.sh, a.el, a.wr], 20 * AK * 2.2, col); const h = [a.wr[0] + (a.wr[0] - a.el[0]) * .25, a.wr[1] + (a.wr[1] - a.el[1]) * .25]; stroke([a.wr, h], 15 * AK * 2.2, '#f2c9a6'); };
  arm('f', '#a83a2f'); leg('f', '#2f3560', '#5a3a2a');
  const TT = (b, u, f) => P([b[0] + J.uL[0] * u + J.fL[0] * f, b[1] + J.uL[1] * u + J.fL[1] * f]), co = [TT(J.neckBase, 6, -26), TT(J.waist, 0, -44), TT(J.pelvis, -96, -58), TT(J.pelvis, -100, 50), TT(J.waist, 0, 38), TT(J.neckBase, -6, 28)];
  const coatPath = () => { x.beginPath(); co.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.closePath(); };
  coatPath(); x.lineJoin = 'round'; x.fillStyle = '#e0453a'; x.fill(); crescent(x, coatPath, '#b5322a', -10, 0, '#e0453a'); coatPath(); x.strokeStyle = INK; x.lineWidth = LW; x.stroke();
  leg('n', '#3b4170', '#5a3a2a'); stroke([J.neckBase, J.neckTop], 18 * AK * 2, '#f2c9a6');
  const ta = SIM.tail(t); let ang = Math.PI - .25 + ta[0] + J.headA, p = [J.headC[0] - Math.cos(J.headA) * 50, J.headC[1] - Math.sin(J.headA) * 50 - 10]; const tl = [p];
  for (let i = 0; i < 3; i++) { const Lk = [46, 42, 36][i]; p = [p[0] + Math.cos(ang) * Lk, p[1] + Math.sin(ang) * Lk]; tl.push(p); ang += ta[(i + 1) % 3] * .6 - ta[i] * .3; } stroke(tl, 26 * AK * 1.6, '#2a2340');
  const hc = P(J.headC), hr = 52 * AK, ca = Math.cos(J.headA), sa = Math.sin(J.headA); x.beginPath(); x.arc(hc[0], hc[1], hr, 0, TAU); x.fillStyle = '#f2c9a6'; x.fill(); x.strokeStyle = INK; x.lineWidth = LW; x.stroke();
  x.beginPath(); x.arc(hc[0], hc[1], hr, J.headA + Math.PI * .5, J.headA + Math.PI * 1.7); x.closePath(); x.fillStyle = '#2a2340'; x.fill(); x.stroke();
  x.fillStyle = INK; x.beginPath(); x.arc(hc[0] + ca * hr * .5 - sa * -hr * .05, hc[1] + sa * hr * .5 - hr * .12, 5, 0, TAU); x.fill();
  arm('n', '#e0453a');
  const a = J.arm.n, w = P([a.el[0] + (a.wr[0] - a.el[0]) * .84, a.el[1] + (a.wr[1] - a.el[1]) * .84]); x.beginPath(); x.arc(w[0], w[1], 9, 0, TAU); x.fillStyle = '#d9b25b'; x.fill(); x.strokeStyle = INK; x.lineWidth = 3; x.stroke();
  const fin = finishCut(akiArt, 15), o = akiItem.c.getContext('2d'); o.clearRect(0, 0, CW, CH); o.drawImage(fin, 0, 0); akiTex.needsUpdate = true;
  return { J, head: [(J.headC[0] - x0) * SC, -J.headC[1] * SC] };
}
// splash droplets (blue paper discs popping from the puddle)
const DROP = A.cut(.003, .005, (x, w, h) => { x.beginPath(); x.moveTo(w / 2, 0); x.quadraticCurveTo(w, h * .7, w / 2, h); x.quadraticCurveTo(0, h * .7, w / 2, 0); sh(x, '#5ab0ea', 3); }, { border: 4, ay: .5 });
const dropTex = texOf(DROP.c), dropGeo = new THREE.PlaneGeometry(DROP.w, DROP.h), dropMat = new THREE.MeshStandardMaterial({ map: dropTex, alphaTest: .5, side: THREE.DoubleSide, roughness: .3, emissiveMap: dropTex, emissive: new THREE.Color(.55, .55, .55) });
const drops = particles(dropGeo, dropMat, 14, (i, t) => { const a = t - SPL.t0; if (a < 0 || a > .9) return null; const th = hash(i) * TAU, vy = .17 + hash(i * 3.1) * .12, y = vy * a - .75 * a * a; if (y < 0) return null;
  const px = PUD_X0 - shiftAt(SPL.t0) + Math.cos(th) * .03 * a; return { x: px, y: y + .002, z: BAND_Z - .004 + Math.sin(th) * .012 * a, rx: 0, ry: a * 6, rz: a * 4, s: 1 }; });
book.stage.add(drops);

// ═════════ lights: the desk lamp is the key (warm, real); a cool fill from the window side
const lampHead = new THREE.Vector3(-.28, .375, .44), spot = new THREE.SpotLight('#fff0dc', 2.6, 3, .75, .55, 2); spot.position.copy(lampHead); spot.target.position.set(.02, 0, .2);
spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -.00006; spot.shadow.normalBias = .0004; spot.shadow.radius = 5; spot.shadow.camera.near = .05; spot.shadow.camera.far = 2; scene.add(spot, spot.target);
const bulb = new THREE.PointLight('#ffcf94', .4, .6, 2); bulb.position.copy(lampHead).add(new THREE.Vector3(0, -.02, 0)); scene.add(bulb);
scene.add(new THREE.HemisphereLight('#cfe6ff', '#caa27a', .2));
const moonL = new THREE.DirectionalLight('#9fb4ff', .55); moonL.position.set(.35, .55, .75); moonL.target.position.set(0, .05, .12); scene.add(moonL, moonL.target);   // the night inside the story: a cool fill

// ═════════ camera: monotone-cubic keys [t, pos, target, fov, aperture]; a new key list = a cut (at 7.5 s and 9.375 s)
const S = (x, y, z) => [x, y + PG, z];
const SH = [[[0, ...S(.07, .02, .335), ...S(.012, .014, .2), 30, 2.4], [2.5, ...S(.055, .022, .33), ...S(.012, .015, .2), 30, 2.4], [3.5, ...S(.19, .16, .56), ...S(.0, .03, .15), 30, 3.0], [7.5, ...S(.15, .14, .53), ...S(.0, .03, .16), 30, 3.0]],
  [[7.5, ...S(.16, .05, .38), ...S(.07, .028, .25), 30, 2.6], [9.375, ...S(.148, .046, .366), ...S(.07, .028, .25), 30, 2.6]],
  [[9.375, ...S(.02, .11, .5), ...S(.08, .07, .1), 30, 3.0], [10, ...S(.0, .12, .52), ...S(.08, .07, .1), 30, 3.0]]].map(keys => ({ t0: keys[0][0], f: track(keys.map(k => [k[0], k.slice(1)])) }));
const camAt = t => { let s = SH[0]; for (const k of SH) if (t >= k.t0) s = k; const v = s.f(t); return { pos: new THREE.Vector3(v[0], v[1], v[2]), tgt: new THREE.Vector3(v[3], v[4], v[5]), fov: v[6], aper: v[7] }; };

// ═════════ HUD on the glass: the thought bubble (types on with blips) and two action words
const ov = document.getElementById('ov').getContext('2d');
function hud(t, headW) {
  ov.setTransform(1, 0, 0, 1, 0, 0); ov.clearRect(0, 0, W, H);
  const proj = v => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };
  if (t > EV.watchUp + .05 && t < 7.45) { const k = back(seg(t, EV.watchUp + .05, EV.watchUp + .3), 2), hp = proj(headW), bx = Math.min(W - 360, hp[0] + 90), by = Math.max(120, hp[1] - 230), s = '11:58 !', n = Math.min(s.length, Math.floor((t - EV.watchUp - .08) / .05) + 1);
    ov.save(); ov.translate(bx + 130, by + 60); ov.scale(k, k); ov.translate(-bx - 130, -by - 60);
    ov.fillStyle = '#fffdf7'; ov.strokeStyle = '#3a2a24'; ov.lineWidth = 7; ov.beginPath(); ov.ellipse(bx + 130, by + 60, 140, 70, 0, 0, TAU); ov.fill(); ov.stroke();
    for (const [dx, dy, r] of [[-30, 90, 18], [-58, 118, 11], [-78, 138, 7]]) { ov.beginPath(); ov.arc(bx + 130 + dx - (bx + 130 - hp[0]) * .25, by + 60 + dy, r, 0, TAU); ov.fill(); ov.stroke(); }
    ov.fillStyle = '#3a2a24'; ov.font = '700 64px Fredoka'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; if (n > 0) ov.fillText(s.slice(0, n), bx + 130, by + 64); ov.restore(); }
  const word = (txt, t0, x, y, c1, c2) => { const a = t - t0; if (a < 0 || a > 1.3) return; const k = back(seg(a, 0, .22), 2.2) * (1 - seg(a, 1.05, 1.3));
    ov.save(); ov.translate(x, y); ov.rotate(-.08); ov.scale(k, k);
    for (let i = 0; i < 12; i++) { const an = i / 12 * TAU; ov.strokeStyle = 'rgba(255,215,102,.85)'; ov.lineWidth = 10; ov.beginPath(); ov.moveTo(Math.cos(an) * 150, Math.sin(an) * 90); ov.lineTo(Math.cos(an) * 210, Math.sin(an) * 130); ov.stroke(); }
    ov.font = 'italic 120px "Lilita One"'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round'; ov.lineWidth = 26; ov.strokeStyle = '#3a2a24'; ov.strokeText(txt, 0, 0); ov.lineWidth = 12; ov.strokeStyle = '#fffdf7'; ov.strokeText(txt, 0, 0);
    const g = ov.createLinearGradient(0, -50, 0, 50); g.addColorStop(0, c1); g.addColorStop(1, c2); ov.fillStyle = g; ov.fillText(txt, 0, 0); ov.restore(); };
  word('SPLASH!', SPL.t0 + .04, 1280, 300, '#9fd8ff', '#3c8fd4'); word('DING!', EV.chime, 600, 260, '#ffe680', '#e0a030');
}

function frame(t) {
  updatePops(t);
  const sh_ = shiftAt(t); bandTex.offset.x = (sh_ / BAND_L) % 1;
  const px = PUD_X0 - sh_; pudMesh.position.set(px, .0013, BAND_Z - .002); pudMesh.visible = Math.abs(px) < .19;
  const A_ = drawAki(t); drops.userData.update(t);
  // the second hand: ticks once a second with a small spring overshoot; the bell: a damped swing from the chime
  const s = Math.floor(W_T(t) + 1e-6) % 60, tick = t - (Math.floor(t - .4) + .4), sp = tick < .25 ? Math.sin(tick * 40) * Math.exp(-tick * 14) * .08 : 0; secPivot.rotation.z = -(s / 60) * TAU + sp;
  const c = t - EV.chime; bellG.rotation.z = c > 0 ? .55 * Math.sin(c * 16) * Math.exp(-c * 3) : 0;
  const C = camAt(t); cam.position.copy(C.pos); cam.fov = C.fov; cam.lookAt(C.tgt); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  post.dof.focus = C.pos.distanceTo(C.tgt); post.dof.aper = C.aper; post.dof.maxCoc = 12; post.vig.uniforms.fade.value = 1; post.vig.uniforms.warm.value = .12; post.bloom.strength = .14;
  post.composer.render();
  hud(t, new THREE.Vector3(A_.head[0], A_.head[1] + PG, BAND_Z));
}
window.render = t => frame(clamp(+t || 0, 0, DUR));
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
frame(0); renderer.compile(scene, cam);
window.READY = true;
