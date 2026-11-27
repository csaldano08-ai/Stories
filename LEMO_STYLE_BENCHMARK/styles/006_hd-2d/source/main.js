// 006 · 2.5D Pixel Art — the first 10 s of "Last Train Home" as a lit, fogged tabletop diorama with a pixel sprite
// (lemo-opuscar styles/hd-2d): pixel-textured 3D set, emissive windows and signs, lamps that throw the sprite's shadow,
// rain, blue fog, physical depth of field with a tilt-shift band, bloom, vignette. The sprite steps; camera, light,
// particles and focus glide. Page contract: window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { PX, texOf, glow } from './px.js';
import { flick, particles } from './fx.js';
import { buildTown, signCanvas } from './town.js';
import { makeAkiSprite, emote, SPX } from './aki_px.js';
import { drawWatch, WW, WH } from './watch_px.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash } from './shared/lib/util.js';

const W = 1920, H = 1080, Q = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(30, W / H, .2, 400);

// ——— the run (shared rig) in metres: x = 0 at t = 5 s ———
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const U2M = 1.65 / 600, X0 = RUN.pelvisAt(5)[0];
const X = t => (RUN.pelvisAt(t)[0] - X0) * U2M;
const TICK = 3 * CADENCE, tick = t => FIRST_STEP + Math.floor((t - FIRST_STEP) * TICK + 1e-6) / TICK;   // 3 drawings per footfall
const SPLASH = RUN.contacts.find(c => Math.abs(c.t0 - T.splash) < .02), XS = (SPLASH.x - X0) * U2M;
function poseAt(t) {
  const S = RUN.pose(t);
  const up = back(seg(t, T.watchUp, T.watchUp + .2), 1.3), dn = ss(seg(t, T.watchDown - .14, T.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S.watch = w;
  if (w > 0) { const J0 = solveProfile(S), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S.arms.f.sh *= 1 - .45 * wm; S.head += .26 * wm; S.neck += .08 * wm; }
  return S;
}

// ——— the set ———
const town = buildTown({ heroX: XS, shadowX: -2, shadowR: 16 });
const { scene } = town;
const aki = makeAkiSprite(); scene.add(aki.mesh);
const shadowBlob = new THREE.Mesh(new THREE.CircleGeometry(.32, 16), new THREE.MeshBasicMaterial({ color: '#05040a', transparent: true, opacity: .45, depthWrite: false })); shadowBlob.rotation.x = -Math.PI / 2; shadowBlob.position.y = .008; scene.add(shadowBlob);
const front = new THREE.PointLight('#c0ccff', 6, 7, 2); scene.add(front);                     // cool front fill ~2 m before the hero (a billboard lit from behind stays black)
const EM = emote(); EM.visible = false; scene.add(EM);
// S1: the hero puddle with the boards reflected in it (flipped emissive decals that ripple), ripple rings, splash pixels
const hero = new THREE.Group(); hero.position.set(XS + .02, .007, .05); scene.add(hero);
const hp = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshStandardMaterial({ color: '#1c2440', roughness: .08, metalness: .2 })); hp.rotation.x = -Math.PI / 2; hp.scale.set(1.25, .62, 1); hero.add(hp);
const refl = [];
for (const [word, col, dx] of [['24H', ['#8fe8d4', '#d8fff4'], -.62], ['CAFE', ['#ff8fb0', '#ffd8e4'], .62]]) {
  const S = signCanvas(word, col), tx = texOf(S.e); tx.flipY = false; tx.needsUpdate = true;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.62 * S.w / S.h * .8, .5), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: .32, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.2, 1.2, 1.2) }));
  m.rotation.x = -Math.PI / 2; m.position.set(dx, .002, -.32); hero.add(m); refl.push({ m, dx });
}
const ringTex = (() => { const P = new PX(32, 32); P.fill((x, y) => { const d = Math.hypot(x - 15.5, y - 15.5); return d > 13.5 && d < 15.5 ? [200, 220, 255] : null; }); return texOf(P.done()); })();
const rings = [...Array(8)].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); m.rotation.x = -Math.PI / 2; m.position.y = .004; scene.add(m); return m; });
const SPL = particles(220, () => {}, { soft: 0, blend: THREE.NormalBlending, scale: 1 }); scene.add(SPL);
function splashFn(t) {   // pixel droplets for every footfall near the camera (deterministic, stepped at 15 fps)
  const list = RUN.contacts.filter(c => t >= c.t0 && t < c.t0 + .55);
  return (i, tt, o) => { const c = list[Math.floor(i / 22)]; if (!c) { o.a = 0; return; } const k = i % 22, u = Math.floor((t - c.t0) * 15 + 1) / 15, big = Math.abs(c.t0 - T.splash) < .02 ? 1.5 : 1;
    const a = -Math.PI / 2 + (hash(k * 3.1 + c.t0) - .5) * 2.4, sp = (1.4 + hash(k * 5.7 + c.t0) * 1.8) * big, cx = (c.x - X0) * U2M + .12;
    o.x = cx + Math.cos(a) * sp * u * .7; o.y = Math.max(0, -Math.sin(a) * sp * u * 1.1 - 9.8 * u * u * .9); o.z = .05 + (hash(k * 7.3 + c.t0) - .5) * .5;
    o.a = o.y <= 0 && u > .1 ? 0 : .9; o.s = .035 * big; o.r = .78; o.g = .86; o.b = 1; };
}
// S3: the wrist sprite (a big billboard in front of the lens, lit by the street)
const WP = new PX(WW, WH), wTex = texOf(WP.done());
const wrist = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05 * WH / WW), new THREE.MeshLambertMaterial({ map: wTex, alphaTest: .5, side: THREE.DoubleSide })); wrist.visible = false; scene.add(wrist);
const wristLight = new THREE.PointLight('#ffc88a', 3.2, 4, 2); scene.add(wristLight);
const heroLight = new THREE.PointLight('#ffb870', 0, 5, 2); heroLight.position.set(XS + .6, .9, 1.4); scene.add(heroLight);   // S1: the café's spill on the puddle and the boots

// ——— post: physical DOF + tilt-shift band + bloom + grade ———
const post = makePost(renderer, scene, camera, W, H, { ssaa: +(Q.get('ss') ?? 1) });
post.bloom.strength = .6; post.bloom.radius = .75; post.bloom.threshold = .82;
const V = post.vig.uniforms; V.amt.value = .62; V.warm.value = .08; V.contrast.value = .22; V.sat.value = 1.08;
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
const _v = new THREE.Vector3();
const screenY = p => { _v.copy(p); _v.project(camera); return clamp(_v.y * .5 + .5, .2, .8); };

// stepped = drawings held at the sprite tick (3 per footfall, locked camera); otherwise one drawing per output frame —
// with a tracking camera a held drawing would either slide its planted foot or judder against the glide, so the run is on ones there.
function placeAki(t, show = true, stepped = false) {
  const tq = stepped ? tick(t) : t, S = poseAt(tq), J = solveProfile(S), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, tq);
  const take = t >= 6.45 && t < 7.4;
  aki.draw(tq.toFixed(4), J, { watch: Math.min(1, S.watch || 0), hemB: sc.hemB, hairLag: sc.hair.back, blink: [3.6, 5.2].some(b => tq >= b && tq < b + .12), wide: take, mouth: take ? 'o' : null, look: S.watch > .5 ? .4 : 0 });
  const x = X(tq); aki.mesh.position.set(x, 0, 0); aki.mesh.visible = show;
  shadowBlob.position.x = x; shadowBlob.visible = show;
  front.position.set(x + .7, 1.6, 2.4); front.intensity = 6;
  return x;
}
function setRings(t, cx, cz, on) {
  rings.forEach((m, k) => { const per = .8 + hash(k * 2.3) * .5, ph = ((t + hash(k * 5.1) * per) % per) / per, n = Math.floor((t + hash(k * 5.1) * per) / per), u = Math.floor(ph * 10) / 10;
    m.visible = on; m.position.set(cx + (hash(k * 7.7 + n) - .5) * 2, .004, cz + (hash(k * 9.1 + n) - .5) * .8); const s = .1 + u * .5; m.scale.set(s, s, 1); m.material.opacity = .55 * (1 - u); });
}

// ——— shots ———
function S1(t, lt) {   // low and close on the puddle (still looking down); the boot lands at 0.9375 s
  const push = eio(lt / 2.5);
  camera.fov = 34; camera.position.set(XS - .85 + push * .12, .95 - push * .04, 2.45 - push * .1); camera.lookAt(XS + .1, .18, -.05); camera.updateProjectionMatrix();
  placeAki(t, t > .25 && t < 1.8, true);
  EM.visible = false; wrist.visible = false; wristLight.intensity = 0; heroLight.intensity = 5 * flick(t, 5);
  const stir = t > T.splash ? Math.exp(-(t - T.splash) * 2.2) : 0, f = Math.floor(t * 10);
  refl.forEach(({ m, dx }, k) => { m.position.x = dx + Math.sin(f * 1.7 + k) * (.006 + .04 * stir); m.scale.set(1 + .06 * stir * Math.sin(f * 2.3), 1, 1); });
  setRings(t, XS + .1, .15, true);
  updateParticles(SPL, splashFn(t), t);
  post.dof.focus = camera.position.distanceTo(new THREE.Vector3(XS + .1, .05, .1)); post.dof.aper = 120; post.dof.maxCoc = 22;
  post.dof.tiltAmt = 0;
}
function S2(t, lt) {   // lateral tracking, camera leading slightly; foreground lamp posts pass blurred
  const x = placeAki(t);
  const cx = X(t) + 1.35;
  camera.fov = 30; camera.position.set(cx, 4.7, 7.4); camera.lookAt(cx + .3, .85, -.2); camera.updateProjectionMatrix();
  const take = t >= 6.45 && t < 7.4; EM.visible = take; EM.position.set(x + .15, 1.92 + (Math.floor(t * 10) % 2) * .02, .02);
  wrist.visible = false; wristLight.intensity = 0; setRings(t, x + 2, .3, false);
  updateParticles(SPL, splashFn(t), t);
  post.dof.focus = camera.position.distanceTo(new THREE.Vector3(x, .9, 0)); post.dof.aper = 260; post.dof.maxCoc = 20;
  post.dof.tiltAmt = 16; post.dof.tiltC = screenY(new THREE.Vector3(x, .8, 0)); post.dof.tiltW = .08; post.dof.tiltF = .3;
}
function S3(t, lt) {   // looking down at her wrist: the pixel watch sharp, the street below it melted into bokeh
  const x = X(t), tq = Math.floor(t * 15) / 15, bob = Math.sin(2 * Math.PI * CADENCE * (tick(t) - FIRST_STEP)) * .012;
  camera.fov = 32; camera.position.set(x + .2, 1.75, .9); camera.lookAt(x + .55, .2, -2.2); camera.updateProjectionMatrix();
  aki.mesh.visible = false; shadowBlob.visible = false; EM.visible = false; setRings(t, 0, 0, false); updateParticles(SPL, (i, tt, o) => { o.a = 0; }, t);
  const sec = 41 + Math.floor(t - T.watchHit);
  if (wrist.userData.sec !== sec) { drawWatch(WP, sec); wTex.needsUpdate = true; wrist.userData.sec = sec; }
  // the plane sits .95 m in front of the lens, facing it
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  wrist.position.copy(camera.position).addScaledVector(dir, .95); wrist.position.y += bob; wrist.quaternion.copy(camera.quaternion); wrist.rotateZ(.02 * Math.sin(tick(t) * 9)); wrist.visible = true;
  wristLight.position.copy(wrist.position).add(new THREE.Vector3(.9, .7, .8)); wristLight.intensity = 1.6 * flick(t, 2);
  front.intensity = 0;   // every light is set by the shot itself: a frame never depends on the frame rendered before it
  post.dof.focus = .95; post.dof.aper = 30; post.dof.maxCoc = 26; post.dof.tiltAmt = 0;
}
function S4(t, lt) {   // very high and far; the crane down begins; the clock lights up on the chime
  const d = eio(seg(lt, 0, .625)) * .35;
  const tx = (town.tower.position.x);
  camera.fov = 30; camera.position.set(tx - 17, 30 - d * 5, 42 - d * 2); camera.lookAt(tx - 5, 11 - d * 4, -10); camera.updateProjectionMatrix();
  placeAki(t); EM.visible = false; wrist.visible = false; wristLight.intensity = 0; setRings(t, 0, 0, false); updateParticles(SPL, (i, tt, o) => { o.a = 0; }, t);
  const u = t - T.chime, pulse = u > 0 ? Math.exp(-u * 4) : 0;
  town.clockM.emissiveIntensity = 1.4 + 2.2 * pulse; town.clockL.intensity = 6 + 18 * pulse; town.clockGlow.material.opacity = .9 + .1 * pulse; town.clockGlow.scale.setScalar(4.5 + 3 * pulse);
  post.dof.focus = camera.position.distanceTo(town.tower.position.clone().setY(14)); post.dof.aper = 900; post.dof.maxCoc = 18;
  post.dof.tiltAmt = 18; post.dof.tiltC = screenY(town.tower.position.clone().setY(15)); post.dof.tiltW = .09; post.dof.tiltF = .28;
}
function updateParticles(P, fn, t) {   // particles() keeps fn at build time: rebuild its update with the frame's function
  const pos = P.geometry.attributes.position.array, a = P.geometry.attributes.a.array, sz = P.geometry.attributes.sz.array, col = P.geometry.attributes.col.array, o = { x: 0, y: 0, z: 0, a: 0, s: 1, r: 1, g: 1, b: 1 };
  for (let i = 0; i < a.length; i++) { o.a = 1; o.s = 1; fn(i, t, o); pos[i * 3] = o.x; pos[i * 3 + 1] = o.y; pos[i * 3 + 2] = o.z; a[i] = o.a; sz[i] = o.s; col[i * 3] = o.r; col[i * 3 + 1] = o.g; col[i * 3 + 2] = o.b; }
  for (const k of ['position', 'a', 'sz', 'col']) P.geometry.attributes[k].needsUpdate = true;
}
const SH = { S1, S2, S3, S4 };
window.DUR = DUR;
window.render = t => {
  const [t0, , id] = shotAt(t);
  post.vig.uniforms.fade.value = 1; renderer.toneMappingExposure = 1.2; heroLight.intensity = 0; front.intensity = 0; wristLight.intensity = 0; town.clockM.emissiveIntensity = 1.4; town.clockL.intensity = 6;
  for (const L of town.lamps) L.sp.intensity = 38 * (1 + .04 * Math.sin(t * 11 + L.x));
  SH[id](t, t - t0);
  town.R.position.x = camera.position.x; town.R.userData.update(t, [-3, 0]);
  post.composer.render();
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const tq = id === 'S1' ? tick(t) : t; if (id === 'S1' && (t <= .25 || t >= 1.8)) return null;
  const J = solveProfile(poseAt(tq)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
