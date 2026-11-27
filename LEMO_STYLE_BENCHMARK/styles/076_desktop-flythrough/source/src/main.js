// 076 · Tabletop App Flythrough — main: world, one camera rig, sub-frame accumulation (anti-aliasing + light motion blur), DOF behind the
// subject, bloom, grade. Adapted from the library's demo main.js (no voice-over, so no captions). Page contract: render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { makeWorld } from './world.js';
import { makePost } from './post.js';
import { makeRig } from './camera.js';
import { KEYS, SHAKES } from './shots.js';
import * as F from './film.js';
import { solveProfile } from '../shared/aki2/aki_profile.js';
import { shotAt } from '../shared/clip10.js';

const FPS = 30, SHUTTER = .3;
const Q = new URLSearchParams(location.search);
window.DUR = F.DUR;
await Promise.all([document.fonts.load('500 20px PM'), document.fonts.load('600 20px PM'), document.fonts.load('700 40px SG'), document.fonts.load('500 40px SG')]);
const world = makeWorld({ mat: F.MAT, haze: '#e8e4e6' }), { renderer, scene, camera, sun, SUNDIR } = world;
const ctx = { world, subj: {}, ev: [], camera };
const update = F.build(ctx);
const rig = makeRig(ctx, camera, KEYS, SHAKES);
const post = makePost(renderer, scene, camera, 1920, 1080);
post.grade.uniforms.amt.value = .12; post.grade.uniforms.warm.value = .04; post.grade.uniforms.lift.value.set(0, 0, 0); post.grade.uniforms.contrast.value = .1; post.grade.uniforms.sat.value = 1.1;
post.bloom.strength = .12; post.bloom.threshold = 1.1;
function applyAt(t, jx, jy) {
  update(t);
  const { tg, d } = rig.apply(t, jx, jy);
  sun.target.position.copy(tg); sun.position.copy(tg).addScaledVector(SUNDIR, 4);
  const hs = Math.min(4, Math.max(.35, d * 1.1));
  Object.assign(sun.shadow.camera, { left: -hs, right: hs, top: hs, bottom: -hs, near: .1, far: 10 }); sun.shadow.camera.updateProjectionMatrix();
  const fp = tg.clone().applyMatrix4(camera.matrixWorldInverse); post.dof.focus = Math.max(.05, -fp.z) * 1.25; post.dof.aper = 2.0; post.dof.maxCoc = 5;
  renderer.toneMappingExposure = 1 + 1.6 * ctx.fx.flash;
}
const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
let TC = 0, SH = SHUTTER;
post.accum.N = +(Q.get('n') || 4);   // 4 jittered sub-frames per frame (the demo uses 16–24; the CPU renderer here makes that ~5× slower)
const q0 = new THREE.Quaternion(), p0 = new THREE.Vector3();
function shutterAt(t) {   // the shutter adapts to the camera's speed: a streak never exceeds ~8 px
  const h = .02; applyAt(t - h, 0, 0); q0.copy(camera.quaternion); p0.copy(camera.position); const d0 = rig.target(t - h).distanceTo(p0);
  applyAt(t + h, 0, 0); const ang = q0.angleTo(camera.quaternion) + camera.position.distanceTo(p0) / Math.max(.05, d0);
  const pxPerSec = ang / (2 * h) * 1080 / (camera.fov * Math.PI / 180);
  return Math.max(.02, Math.min(SHUTTER, 8 * FPS / Math.max(1, pxPerSec)));
}
post.accum.setSub = (i, n) => applyAt(Math.min(F.DUR - 1e-3, Math.max(0, TC + ((i + .5) / n - .5) * SH / FPS)), halton(i + 1, 2) - .5, halton(i + 1, 3) - .5);
window.render = t => { TC = t; SH = shutterAt(t); post.composer.render(); };
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(F.poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
applyAt(0, 0, 0); renderer.compile(scene, camera);
window.READY = true;
