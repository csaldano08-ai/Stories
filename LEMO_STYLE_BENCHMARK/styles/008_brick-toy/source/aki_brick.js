// AKI built from bricks (no minifigure: 1×1 columns for legs, a 2×2 red torso, round 1×1 bricks for arms, a round 2×2
// head with a plum bob built from a round plate, a 2×1 brick and two 1×1 bricks). Joints rotate; nothing bends (style §1).
// Her identity in bricks: red coat (the most saturated toy colour), tan roll-neck, dark grey trousers, reddish-brown
// boots, a gold 1×1 round tile watch on the LEFT arm, the plum bob.
// Run = compass gait on the shared footfall grid: the stance leg pivots about its planted foot, so a planted foot never
// moves (rigid legs cannot slide-lock any other way). Poses are evaluated on twos (15 drawings/s) — the brick-film rule.
import * as THREE from 'three';
import { COL, BRICK, PLATE, brick, plate, mesh, roundGeo, brickGeo, plastic } from './bricks.js';
import { FIRST_STEP, STEP, T as EV } from './shared/clip10.js';
import { clamp, lerp, seg, ss, back } from './shared/lib/util.js';

export const AC = { coat: '#c91a09', coatD: '#9c1407', trou: '#3a3c44', boot: '#6b3a22', skin: '#f2c9a3', hair: '#4b2a4c', knit: '#e4cd9e', gold: '#f2cd37' };
export const HIP = PLATE + 2 * BRICK, SHOULDER = HIP + PLATE + 2 * BRICK, ARM_L = 3 * BRICK - .2, LEG_A = .55;
export const STRIDE = 2 * HIP * Math.sin(LEG_A);                 // ≈ 2.93 studs per step

export function makeAki() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const legs = [-.5, .5].map((x, i) => {
    const g = new THREE.Group(); g.position.set(x, HIP, 0); body.add(g);
    for (let k = 0; k < 2; k++) { const b = brick(1, 1, AC.trou); b.position.y = -HIP + PLATE + k * BRICK; g.add(b); }
    const f = plate(1, 2, AC.boot); f.position.set(0, -HIP, .5); g.add(f);
    return g;
  });
  const hip = plate(2, 2, AC.coat); hip.position.y = HIP; body.add(hip);
  const hem = plate(2, 3, AC.coat, { tile: true }); hem.position.set(0, HIP - PLATE * .5, -.35); hem.rotation.x = .12; body.add(hem);   // the trench's flared back hem
  for (let k = 0; k < 2; k++) { const b = brick(2, 2, AC.coat); b.position.y = HIP + PLATE + k * BRICK; body.add(b); }
  const belt = new THREE.Mesh(new THREE.BoxGeometry(2.04, .22, 2.04), plastic(AC.coatD)); belt.position.y = HIP + PLATE + BRICK * .55; body.add(belt);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(.5, .3, .1), plastic(AC.gold)); buckle.position.set(.35, HIP + PLATE + BRICK * .55, 1.04); body.add(buckle);
  const arms = [-1.5, 1.5].map((x, i) => {
    const g = new THREE.Group(); g.position.set(x, SHOULDER - .1, 0); body.add(g);
    for (let k = 0; k < 3; k++) { const b = mesh(roundGeo(.5), AC.coat); b.position.y = -ARM_L - .2 + k * BRICK; g.add(b); }
    const hand = mesh(roundGeo(.5, PLATE), AC.skin); hand.position.y = -ARM_L - .6; g.add(hand);
    return g;
  });
  // the watch: a printed 1×1 round tile on the LEFT arm (x = −1.5 when she faces +z), facing outward
  const watchTex = document.createElement('canvas'); watchTex.width = watchTex.height = 64;
  const wt = new THREE.CanvasTexture(watchTex); wt.colorSpace = THREE.SRGBColorSpace;
  const watch = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .16, 28), [plastic(AC.gold), new THREE.MeshPhysicalMaterial({ map: wt, roughness: .3, clearcoat: .9 }), plastic(AC.gold)]);
  watch.rotation.z = Math.PI / 2; watch.position.set(-.5, -ARM_L + .5, 0); arms[0].add(watch);
  const collar = plate(2, 2, AC.knit); collar.position.y = SHOULDER; body.add(collar);
  const head = new THREE.Group(); head.position.set(0, SHOULDER + PLATE, 0); body.add(head);
  const face = mesh(roundGeo(1, BRICK * 1.5), AC.skin); head.add(face);
  const eyes = [-.38, .38].map(ex => { const e = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .06, 16), new THREE.MeshPhysicalMaterial({ color: '#121418', roughness: .2, clearcoat: 1 })); e.rotation.x = Math.PI / 2; e.position.set(ex, BRICK * .95, .99); head.add(e); return e; });
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(.36, .07, .04), new THREE.MeshStandardMaterial({ color: '#7a2a26' })); mouth.position.set(0, BRICK * .5, 1.0); head.add(mouth);
  // the bob: a round 2×2 plate cap, a 2×1 brick at the back, 1×1 bricks over the ears, a 1×2 plate as the side-swept fringe
  const cap = mesh(roundGeo(1.05, PLATE * 2), AC.hair); cap.position.y = BRICK * 1.5; head.add(cap);
  const back1 = brick(2, 1, AC.hair, { tile: true }); back1.position.set(0, BRICK * .2, -.8); back1.scale.set(1.06, 1.05, .9); head.add(back1);
  const fringe = plate(2, 1, AC.hair, { tile: true }); fringe.position.set(.15, BRICK * 1.3, .55); fringe.rotation.z = -.18; head.add(fringe);
  root.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });

  function drawWatch(sec) {
    const x = watchTex.getContext('2d'), c = 32;
    x.fillStyle = '#f7efd8'; x.beginPath(); x.arc(c, c, 32, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#2a2018'; x.lineCap = 'round';
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; x.lineWidth = k % 3 ? 2 : 4; x.beginPath(); x.moveTo(c + Math.sin(a) * 22, c - Math.cos(a) * 22); x.lineTo(c + Math.sin(a) * 29, c - Math.cos(a) * 29); x.stroke(); }
    const mm = 58 + sec / 60, hand = (a, l, w, col) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(c, c); x.lineTo(c + Math.sin(a) * l, c - Math.cos(a) * l); x.stroke(); };
    hand((11 + mm / 60) / 12 * Math.PI * 2, 14, 5, '#2a2018'); hand(mm / 60 * Math.PI * 2, 22, 3.5, '#2a2018'); hand(sec / 60 * Math.PI * 2, 26, 2, '#c91a09');
    wt.needsUpdate = true;
  }
  drawWatch(41);
  // pose: legs angle (+ = foot forward), arms [swing, raise], body lean, head nod/tilt, alarm (both arms flung up)
  function pose(p) {
    root.position.set(p.x, p.y, p.z); root.rotation.y = p.ry ?? Math.PI / 2;
    body.position.y = p.bob ?? 0; body.rotation.x = p.lean ?? 0;
    legs[0].rotation.x = -(p.legL ?? 0); legs[1].rotation.x = -(p.legR ?? 0);
    arms[0].rotation.set(-(p.armL?.[0] ?? 0), 0, -(p.armL?.[1] ?? 0)); arms[1].rotation.set(-(p.armR?.[0] ?? 0), 0, p.armR?.[1] ?? 0);
    head.rotation.set(p.nod ?? 0, p.look ?? 0, 0);
    const bl = p.blink ? .15 : 1; eyes.forEach(e => e.scale.set(1, 1, bl));
    mouth.scale.set(p.mouthO ? .8 : 1, p.mouthO ? 3.2 : 1, 1);
  }
  return { root, body, legs, arms, head, watch, pose, drawWatch };
}

// ——— compass-gait run on the shared footfall grid ———
// contact k at tc_k = FIRST_STEP + k·STEP on foot (k even = left/near, k odd = right), at x = X0 + k·STRIDE.
export function gait(X0) {
  const kOf = t => Math.floor((t - FIRST_STEP) / STEP + 1e-9);
  const P = k => X0 + k * STRIDE;
  function at(t) {
    const k = kOf(t), u = clamp((t - (FIRST_STEP + k * STEP)) / STEP), th = LEG_A - 2 * LEG_A * u;    // stance angle: foot ahead → behind
    const stance = (k % 2 + 2) % 2 === 0 ? 'L' : 'R';
    const hipX = P(k) - HIP * Math.sin(th), hipY = HIP * Math.cos(th);
    const sw = -th;                                                                                // swing leg mirrors the stance leg (a rigid knee-less leg grazes the ground at mid-swing, as brick figures do)
    return { k, u, stance, hipX, bob: hipY - HIP, legL: stance === 'L' ? th : sw, legR: stance === 'R' ? th : sw, footX: P(k), swingFootX: hipX + HIP * Math.sin(sw) };
  }
  return { at, P, kOf };
}
// full pose at time t (call with t on twos); the watch check: anticipation, raise landing on the 6.25 s beat, the read,
// the alarm (both arms flung up for a few drawings at 6.6 s), then back into the run
export function runPose(G, t, z = 0) {
  const g = G.at(t), s = Math.sin(Math.PI * 2 * (t - FIRST_STEP) / (2 * STEP));
  const p = { x: g.hipX, y: 0, z, bob: g.bob, legL: g.legL, legR: g.legR, lean: .14, armL: [-g.legL * .9, .08], armR: [-g.legR * .9, .08], nod: .05, look: -.45, g };   // the head cheats toward the lens, as brick films do
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2)), w = clamp(up, 0, 1.1) * (1 - dn);
  const ant = Math.sin(Math.PI * seg(t, EV.watchUp - .16, EV.watchUp)) * .35;
  p.armL[0] -= ant;
  if (w > 0) { p.armL = [lerp(p.armL[0], 1.45, Math.min(1, w)), lerp(.08, -.55, Math.min(1, w))]; p.nod = lerp(.05, .42, Math.min(1, w)); }
  const alarm = t >= 6.6 && t < 6.95;
  if (alarm) { p.armR = [2.9, .35]; p.nod = -.15; p.mouthO = true; }
  p.watch = w; p.alarm = alarm;
  return p;
}
