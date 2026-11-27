// 010 · Crayon World 3D — the first 10 s of "Last Train Home" as a real 3D night street drawn again in crayon 15 times a
// second (lemo-opuscar styles/crayon-world): an invisible half-resolution render gives region ids, light and depth; marching
// squares trace each region; crayon fills, scribbled hatching and outlines are drawn from the rings; a WebGL compositor
// lets the wax stick to the paper's tooth; the paper never moves. Face, rain, splash, lettering and the watch's dial are
// drawn in 2D at projected positions (style: faces and tiny things). Page contract: window.render(t), DUR, READY, RIGQA.
import * as THREE from 'three';
import { makeComp } from './engine/gl.js';
import * as C from './engine/crayon.js';
import { makeNPR, snap, shapes, silhouette, region, mesh, REG, REGM, RW, RH } from './engine/npr.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash } from './shared/lib/util.js';

// the crayon box for a rainy night (12 crayons)
const P = { line: '#2c2f6b', night: '#2b3a78', blue: '#4a6fc0', grey: '#7a7f99', lemon: '#f2d43a', orange: '#f0a030', red: '#e0402a', brick: '#a8452f', plum: '#7a3f7c', rose: '#ec8a9a', cream: '#f4c49a', earth: '#8a5a35' };
const PAPER = [0.957, 0.937, 0.890];
const R = {
  sky: region({ col: P.night, p: .62, ang: .12, gap: 13, w: 14, ow: 0, cross: 1 }),
  cloud: region({ col: P.grey, p: .35, ang: .3, gap: 14, w: 13, ow: 7 }),
  road: region({ col: P.grey, p: .62, ang: .08, gap: 13, w: 13, ow: 0, night: .55 }),
  walk: region({ col: P.blue, p: .5, ang: .1, gap: 13, w: 13, ow: 6, night: .42 }),
  puddle: region({ col: P.blue, p: .85, ang: .05, gap: 8, w: 10, ow: 6 }),
  wallA: region({ col: P.brick, p: .72, ang: 1.45, gap: 11, w: 12, ow: 8, shade: 1, night: .62 }),
  wallB: region({ col: P.plum, p: .7, ang: 1.4, gap: 11, w: 12, ow: 8, shade: 1, night: .62 }),
  wallC: region({ col: P.earth, p: .68, ang: 1.5, gap: 11, w: 12, ow: 8, shade: 1, night: .62 }),
  roof: region({ col: P.line, p: .7, ang: .55, gap: 9, w: 11, ow: 8 }),
  win: region({ col: P.lemon, p: .95, ang: .8, gap: 7, w: 9, ow: 6 }),
  shop: region({ col: P.orange, p: .85, ang: .9, gap: 8, w: 10, ow: 7 }),
  door: region({ col: P.earth, p: .9, ang: 1.5, gap: 8, w: 10, ow: 7, night: .5 }),
  signA: region({ col: P.rose, p: .9, ang: .2, gap: 6, w: 8, ow: 6 }),
  signB: region({ col: P.blue, p: .9, ang: .2, gap: 6, w: 8, ow: 6 }),
  pole: region({ col: P.line, p: .9, ang: 1.5, gap: 5, w: 7, ow: 4 }),
  lamp: region({ col: P.lemon, p: .95, ang: .4, gap: 5, w: 7, ow: 5 }),
  tower: region({ col: P.grey, p: .6, ang: 1.45, gap: 10, w: 12, ow: 8, shade: 1, night: .45 }),
  clock: region({ col: P.lemon, p: .9, ang: .5, gap: 6, w: 8, ow: 7 }),
  // her (ch group): red coat, plum hair, cream face, dark trousers, brown boots, the lemon watch
  coat: region({ col: P.red, p: .9, ang: .7, gap: 7, w: 9, ow: 9, grp: 'ch', shade: 1 }),
  pants: region({ col: P.line, p: .7, ang: .3, gap: 7, w: 9, ow: 9, grp: 'ch', shade: 1 }),
  boot: region({ col: P.earth, p: .92, ang: .4, gap: 6, w: 8, ow: 8, grp: 'ch' }),
  skin: region({ col: P.cream, p: .72, ang: .5, gap: 7, w: 9, ow: 9, grp: 'ch' }),
  hair: region({ col: P.plum, p: .92, ang: 1.0, gap: 6, w: 8, ow: 9, grp: 'ch', shade: 1 }),
  knit: region({ col: P.cream, p: .3, ang: .2, gap: 7, w: 9, ow: 7, grp: 'ch' }),
  watch: region({ col: P.lemon, p: .95, ang: .5, gap: 5, w: 7, ow: 7, grp: 'ch' }),
};

let comp, N, scene, cam, LY, A, SET;
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d), cyl = (a, b, h, n = 16) => new THREE.CylinderGeometry(a, b, h, n), sph = (r) => new THREE.SphereGeometry(r, 24, 16);
const put = (m, x, y, z, parent = scene) => { m.position.set(x, y, z); parent.add(m); return m; };
const UP = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3(), _d = new THREE.Vector3();
function bone(m, a, b) { _d.subVectors(b, a); const L = _d.length() || 1e-6; m.position.copy(a).addScaledVector(_d, .5); m.quaternion.setFromUnitVectors(UP, _d.multiplyScalar(1 / L)); m.scale.set(1, L, 1); }

// ——— the run (shared rig) in metres ———
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const U2M = 1.65 / 600, X0 = RUN.pelvisAt(5)[0], SPLASH = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const XS = (SPLASH.x - X0) * U2M;
const X = t => (RUN.pelvisAt(t)[0] - X0) * U2M;
function poseAt(t, raise = false) {
  const S = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  let w = clamp(up, 0, 1.1) * (1 - dn); if (raise) w = 1; S.watch = w;
  if (w > 0) { const J0 = solveProfile(S), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S.arms.f.sh *= 1 - .45 * wm; S.head += .26 * wm; S.neck += .08 * wm; }
  return S;
}

function build() {
  scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(40, 16 / 9, .05, 400);
  put(mesh(new THREE.SphereGeometry(200, 16, 12), R.sky, THREE.BackSide), 0, 0, 0);
  put(mesh(box(120, .2, 9), R.road), 0, -.1, 4.5);
  put(mesh(box(120, .22, 6), R.walk), 0, -.09, -1);
  SET = { puddle: put(mesh(cyl(.75, .75, .02, 28), R.puddle), XS + .1, .03, .1) }; SET.puddle.scale.z = .55;
  const walls = [R.wallA, R.wallB, R.wallC]; let x = -30, i = 0; SET.shops = [];
  while (x < 34) {
    const w = 4.2 + hash(i * 1.7) * 1.8, h = 5 + hash(i * 2.9) * 3, g = new THREE.Group(); put(g, x + w / 2, 0, -6.2);
    put(mesh(box(w, h, 4), walls[i % 3]), 0, h / 2, 0, g);
    const roof = mesh(new THREE.CylinderGeometry(2.4, 2.4, w + .2, 3), R.roof); roof.rotation.z = Math.PI / 2; roof.rotation.x = Math.PI / 6; put(roof, 0, h + .9, 0, g);
    put(mesh(box(w * .55, 1.6, .2), R.shop), -w * .12, 1.1, 2.05, g);
    put(mesh(box(.9, 2, .2), R.door), w * .33, 1, 2.05, g);
    put(mesh(box(w * .5, .55, .2), i % 2 ? R.signA : R.signB), -w * .12, 2.45, 2.15, g);
    for (let fy = 3.5; fy < h - .8; fy += 1.6) for (let fx = -w / 2 + .8; fx < w / 2 - .5; fx += 1.4) if (hash(i * 7 + fx + fy * 3) > .3) put(mesh(box(.7, .9, .2), R.win), fx, fy, 2.05, g);
    SET.shops.push({ g, x: x + w / 2, w, i }); x += w + .25; i++;
  }
  for (let k = 0; k < 6; k++) { const lx = -24 + k * 9.5; if (Math.abs(lx - XS) < 2.5) continue; put(mesh(cyl(.06, .08, 3.6), R.pole), lx, 1.8, 1.6); put(mesh(sph(.24), R.lamp), lx, 3.7, 1.6); }
  const tw = new THREE.Group(); put(tw, 24, 0, -9); put(mesh(box(3, 18, 3), R.tower), 0, 9, 0, tw);
  const tr = mesh(new THREE.ConeGeometry(2.4, 3, 4), R.roof); tr.rotation.y = Math.PI / 4; put(tr, 0, 19.5, 0, tw);
  SET.clock = put(mesh(cyl(1.1, 1.1, .2, 28), R.clock), 0, 15.5, 1.55, tw); SET.clock.rotation.x = Math.PI / 2; SET.tower = tw;
  for (let k = 0; k < 7; k++) { const c = mesh(sph(1), R.cloud); c.scale.set(5 + hash(k) * 4, 1.2 + hash(k * 2) * .8, 3); put(c, -20 + k * 9 + hash(k * 3) * 4, 26 + hash(k * 5) * 6, -30 - hash(k * 7) * 10); }
  // AKI: tube limbs on the rig joints, a boxy coat, a big round head (a child's vocabulary)
  A = {};
  for (const k of ['thF', 'shF', 'thN', 'shN']) A[k] = put(mesh(cyl(.07, .06, 1, 10), R.pants), 0, 0, 0);
  for (const k of ['btF', 'btN']) A[k] = put(mesh(box(.24, .09, .11), R.boot), 0, 0, 0);
  for (const k of ['uaF', 'faF', 'uaN', 'faN']) A[k] = put(mesh(cyl(.06, .055, 1, 10), R.coat), 0, 0, 0);
  for (const k of ['hdF', 'hdN']) A[k] = put(mesh(sph(.055), R.skin), 0, 0, 0);
  A.coat = put(mesh(cyl(.13, .2, 1, 12), R.coat), 0, 0, 0);
  A.knit = put(mesh(cyl(.08, .09, .08, 12), R.knit), 0, 0, 0);
  A.head = put(mesh(sph(.16), R.skin), 0, 0, 0);
  A.hair = put(mesh(new THREE.SphereGeometry(.172, 24, 16, Math.PI * .35, Math.PI * 1.3, 0, Math.PI * .62), R.hair), 0, 0, 0);
  A.bob = put(mesh(box(.14, .2, .3), R.hair), 0, 0, 0);
  A.watch = put(mesh(cyl(.05, .05, .03, 20), R.watch), 0, 0, 0);
}
function placeAki(t, raise = false) {
  const S = poseAt(t, raise), J = solveProfile(S), sc = secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, t), ox = -X0 * U2M;
  const Wp = (p, z) => new THREE.Vector3(ox + p[0] * U2M, -p[1] * U2M, z);
  const L = (k, z, th, sh, bt) => { const l = J.leg[k]; bone(A[th], Wp(l.hip, z), Wp(l.knee, z)); bone(A[sh], Wp(l.knee, z), Wp(l.ankle, z)); const an = Wp(l.ankle, z); A[bt].position.set(an.x + .07 * Math.cos(l.pitch), an.y - .03 + .07 * Math.sin(-l.pitch), z); A[bt].rotation.set(0, 0, -l.pitch); };
  L('f', -.09, 'thF', 'shF', 'btF'); L('n', .09, 'thN', 'shN', 'btN');
  const Ar = (k, z, ua, fa, hd) => { const a = J.arm[k], sh = Wp(a.sh, z), el = Wp(a.el, z), wr = Wp(a.wr, z); bone(A[ua], sh, el); bone(A[fa], el, wr); A[hd].position.copy(wr); return { el, wr }; };
  Ar('f', -.14, 'uaF', 'faF', 'hdF');
  const pv = Wp(J.pelvis, 0), nb = Wp(J.neckBase, 0), hb = sc.hemB;
  bone(A.coat, nb, pv.clone().add(new THREE.Vector3(hb[0] * U2M * .5, -.2 - hb[1] * U2M * .3, 0)));   // boxy coat from the shoulders to below the hips
  A.knit.position.copy(nb).add(new THREE.Vector3(0, .03, 0));
  const hc = Wp(J.headC, 0).add(new THREE.Vector3(0, .05, 0)); A.head.position.copy(hc);
  A.hair.position.copy(hc); A.hair.rotation.set(0, Math.PI, J.headA * .5);   // the cap's opening faces forward (the face), the hair covers crown, side and back
  A.bob.position.copy(hc).add(new THREE.Vector3(-.09 + Math.max(-.06, sc.hair.back[0] * U2M * .4), -.08, 0)); A.bob.rotation.z = -J.headA;
  const n = Ar('n', .14, 'uaN', 'faN', 'hdN');
  A.watch.position.copy(n.wr).addScaledVector(_v.subVectors(n.wr, n.el).normalize(), -.07); A.watch.position.z += .07; A.watch.rotation.set(Math.PI / 2, 0, 0);
  return { J, S, hc, watch: A.watch.position.clone(), nearWr: n.wr };
}
const prj = v => { const q = v.clone().project(cam); return [(q.x * .5 + .5) * 1920, (.5 - q.y * .5) * 1080, q.z]; };
// her face, drawn in 2D on the projected head: one eye (side view), a brow, a mouth; wide eyes at the take
function face(L, Sx, info, t) {
  const hc = info.hc, c = prj(hc), top = prj(hc.clone().add(new THREE.Vector3(0, .16, 0))), r = Math.hypot(top[0] - c[0], top[1] - c[1]);
  if (r < 6 || c[2] > 1) return;
  const seen = ([x, y]) => { const i = Math.floor(y / 2) * RW + Math.floor(x / 2); return x >= 0 && y >= 0 && x < 1920 && y < 1080 && Sx.id[i] === R.skin; };
  const e = prj(hc.clone().add(new THREE.Vector3(.11, .02, .09))); if (!seen(e)) return;
  const take = t >= 6.45 && t < 7.4;
  if (take) { C.line(L, C.ellipse(e[0], e[1], r * .13, r * .16, 16), { col: P.line, w: Math.max(3, r * .05), p: .9, seed: 31, closed: true }); C.dab(L, e[0] + r * .02, e[1], r * .05, { col: P.line, p: .97, seed: 33, gap: 3, w: 4 }); }
  else C.dab(L, e[0], e[1], r * .075, { col: P.line, p: .97, seed: 31, gap: 3, w: 4 });
  const b = prj(hc.clone().add(new THREE.Vector3(.1, .1 + (take ? .03 : 0), .09))); C.line(L, [[b[0] - r * .13, b[1] + r * .02], [b[0] + r * .1, b[1] - r * .01]], { col: P.plum, w: Math.max(3, r * .05), p: .8, seed: 71, closed: false });
  const ck = prj(hc.clone().add(new THREE.Vector3(.07, -.05, .1))); if (seen(ck)) C.dab(L, ck[0], ck[1], r * .09, { col: P.rose, p: .5, seed: 51, sq: .7 });
  const m = prj(hc.clone().add(new THREE.Vector3(.14, -.08, .06))); if (seen(m)) { if (take) C.dab(L, m[0], m[1], r * .06, { col: P.line, p: .9, seed: 61 }); else C.line(L, [[m[0] - r * .06, m[1]], [m[0] + r * .03, m[1] + r * .01]], { col: P.line, w: Math.max(3, r * .04), p: .9, seed: 61, closed: false }); }
}
function rain(L, tq, n = 90, a = .9) {
  for (let i = 0; i < n; i++) { const sp = 900 + hash(i * 1.3) * 500, y = ((hash(i * 2.1) * 1300 + tq * sp) % 1300) - 110, x = ((hash(i * 3.7) * 2200 - y * .25) % 2200 + 2200) % 2200 - 140, len = 26 + hash(i * 4.4) * 30;
    C.line(L, [[x, y], [x - len * .25, y + len]], { col: i % 3 ? '#fbfaf4' : '#9cbcf0', w: 6.5, p: .95 * a, seed: i * 3.1 + Math.floor(tq * 15), closed: false, taper: .15 }); }
}
function splash(L, tq) {   // drops (dabs) and rings (ellipse lines) at each footfall's projected point
  for (const c of RUN.contacts) { const u = tq - c.t0; if (u < 0 || u > .6) continue; const hero = c === SPLASH, p = prj(new THREE.Vector3((c.x - X0) * U2M + .1, .02, .1)); if (p[2] > 1) continue;
    const far = prj(new THREE.Vector3((c.x - X0) * U2M + .6, .02, .1)), s = Math.abs(far[0] - p[0]) / .5;
    for (let j = 0; j < (hero ? 10 : 5); j++) { const a = -Math.PI / 2 + (hash(j * 7 + c.t0) - .5) * 2.4, sp = s * (hero ? 1.5 : 1) * (.6 + hash(j * 3 + c.t0) * .6);
      const x = p[0] + Math.cos(a) * sp * u * .8, y = p[1] + Math.sin(a) * sp * u * 1.3 + s * 3 * u * u; if (y > p[1]) continue; C.dab(L, x, y, Math.max(4, s * .03), { col: P.blue, p: .85, seed: j + c.t0 * 10 }); }
    if (hero) for (let k = 0; k < 2; k++) { const v = u - k * .15; if (v > 0) C.line(L, C.ellipse(p[0], p[1], s * (.15 + .6 * v), s * (.04 + .15 * v), 28), { col: P.blue, w: 4, p: .8 * (1 - v / .6), seed: 80 + k, closed: true }); } }
}
function signWords(L, Sx) {   // crayon lettering on the two boards nearest the puddle (drawn where the board is visible)
  for (const sh of SET.shops) { if (Math.abs(sh.x - XS) > 7) continue; const word = sh.i % 2 ? 'CAFE' : '24H', p = prj(new THREE.Vector3(sh.x - sh.w * .12, 2.45, -6.2 + 2.3)); if (p[2] > 1) continue;
    const q = prj(new THREE.Vector3(sh.x - sh.w * .12, 2.72, -6.2 + 2.3)), size = Math.abs(p[1] - q[1]) * 1.7; if (size < 14) continue;
    C.text(L, word, p[0], p[1] + size * .35, { font: 'Patrick Hand', size, col: P.line, seed: sh.i * 5 }); }
}
function watchFace(L, Sx, t) {   // the watch's dial in 2D on the projected disc: 12 ticks, 11:58, the second hand once a second
  const c = prj(A.watch.position), e = prj(A.watch.position.clone().add(new THREE.Vector3(.05, 0, 0))), r = Math.abs(e[0] - c[0]); if (r < 20) return;
  C.dab(L, c[0], c[1], r * .78, { col: '#fffbe8', p: .9, seed: 400, gap: 4, w: 6 });
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; C.line(L, [[c[0] + Math.sin(a) * r * .55, c[1] - Math.cos(a) * r * .55], [c[0] + Math.sin(a) * r * .7, c[1] - Math.cos(a) * r * .7]], { col: P.line, w: k % 3 ? 3 : 5, p: .9, seed: 410 + k, closed: false }); }
  const sec = 41 + Math.floor(t - EV.watchHit), mm = 58 + sec / 60, hand = (a, l, w, col, s) => C.line(L, [[c[0], c[1]], [c[0] + Math.sin(a) * r * l, c[1] - Math.cos(a) * r * l]], { col, w, p: .95, seed: s, closed: false, taper: .1 });
  hand((11 + mm / 60) / 12 * Math.PI * 2, .38, Math.max(5, r * .07), P.line, 430); hand(mm / 60 * Math.PI * 2, .6, Math.max(4, r * .05), P.line, 431); hand(sec / 60 * Math.PI * 2, .66, Math.max(3, r * .025), P.red, 432);
}
function stars(L, tq, n = 40) { for (let i = 0; i < n; i++) { const x = hash(i * 5.1) * 1920, y = hash(i * 6.3) * 520; if ((Math.floor(tq * 15) + i) % 11 === 0) continue; C.dab(L, x, y, 4 + hash(i) * 3, { col: P.lemon, p: .9, seed: i }); } }
function chime(L, t) { const u = t - EV.chime; if (u <= 0) return; const c = prj(new THREE.Vector3(24, 15.5, -9 + 1.7)); for (let k = 0; k < 3; k++) { const v = u - k * .1; if (v > 0 && v < .5) C.line(L, C.ellipse(c[0], c[1], 60 + 300 * v, 60 + 300 * v, 40, -2.4, -.7), { col: P.lemon, w: 6, p: .9 * (1 - v / .5), seed: 500 + k, closed: false }); } }

function anc(r) { const m = REGM[r]?.[0]; if (!m) return undefined; m.getWorldPosition(_v).project(cam); return [(_v.x * .5 + .5) * 1920, (.5 - _v.y * .5) * 1080]; }
function openLines(rings) { const out = []; for (const r of rings) { let cur = []; const on = ([x, y]) => x > 3 && x < 1917 && y > 3 && y < 1077; for (const p of r) { if (on(p)) cur.push(p); else { if (cur.length > 3) out.push(cur); cur = []; } } if (cur.length > 3) out.push(cur); if (out.length && r.every(on)) { out.pop(); out.push([...r, r[0]]); } } return out; }

// ——— shots (the whole frame — pose and camera — is evaluated on the drawing's time) ———
function shot(tq) {
  const [t0, , id] = shotAt(tq), lt = tq - t0; let info;
  if (id === 'S1') { info = placeAki(tq); const u = eio(lt / 2.5); cam.fov = 40; cam.position.set(XS - .95 + u * .12, .42, 2.05 - u * .1); cam.lookAt(XS + .2, .38, -.4); }
  else if (id === 'S2') { info = placeAki(tq); const x = X(tq); cam.fov = 38; cam.position.set(x + 1.1, 1.9, 7.2); cam.lookAt(x + 1.6, 1.0, -.6); }
  else if (id === 'S3') { info = placeAki(tq, true); const w = info.watch; cam.fov = 34; cam.position.set(w.x + .28, w.y + .12, w.z + .6); cam.lookAt(w.x + .04, w.y - .01, w.z); }
  else { info = placeAki(tq); const u = eio(seg(lt, 0, .625)); cam.fov = 44; cam.position.set(8, 6 - u * .6, 26); cam.lookAt(14, 18 - u * 4, -12); }
  cam.updateProjectionMatrix();
  return { id, lt, info };
}
async function init() {
  comp = makeComp(document.getElementById('gl')); N = makeNPR(); build();
  const L = () => C.layer();
  LY = { bg: [L(), L()], ch: [L(), L()], fg: [L(), L()], sil: document.createElement('canvas'), knock: L() };
  LY.sil.width = RW; LY.sil.height = RH;
  try { await document.fonts.load('60px "Patrick Hand"', 'CAFE24H'); } catch (e) { }
}
function frame(t) {
  const step = Math.floor(t * 15 + 1e-6), tq = step / 15;   // the drawing is replaced 15 times a second (on twos for this 30 fps clip)
  C.BOIL.step = step; C.BOIL.amp = 0;
  const { id, info } = shot(tq);
  for (const k of Object.values(A)) k.visible = !(id === 'S1' && (tq < .3 || tq > 1.8));
  scene.updateMatrixWorld(true);
  const S = snap(N, scene, cam), SH = shapes(S);
  for (const k of ['bg', 'ch', 'fg']) LY[k].forEach(C.clear);
  const order = Object.keys(SH).map(Number).sort((a, b) => SH[b].n - SH[a].n);
  for (const r of order) {
    const g = REG[r], s = SH[r]; if (!g || !s.rings.length) continue;
    const [F, Ln] = LY[g.grp], p = g.p * (1.05 - .25 * s.shade), anchor = anc(r);
    if (!g.nofill) C.fill(F, s.rings, { col: g.col, p, ang: g.ang, gap: g.gap, w: g.w, over: g.over, seed: r * 7.3, anchor, hand: 1, cross: g.cross, crossP: .55 });
    if (g.night) C.fill(F, s.rings, { col: P.night, p: g.night, ang: g.ang + .85, gap: g.gap * 1.25, w: g.w, over: 3, seed: r * 7.3 + 90, anchor, hand: 1 });   // night: a second, indigo scribble over everything that is not lit
    if (s.dark.length) C.fill(F, s.dark, { col: g.col, p: Math.min(1, g.p + .15), ang: g.ang + 1.1, gap: g.gap * .8, w: g.w * .9, over: 3, seed: r * 7.3 + 50, anchor });
    if (g.ow) openLines(s.rings).forEach((l, i) => C.line(Ln, l, { col: P.line, w: g.ow, p: .92, seed: r * 13 + i, closed: false, taper: .08 }));
  }
  if (A.head.visible) face(LY.ch[1], S, info, tq);
  if (id === 'S3') watchFace(LY.ch[1], S, tq);
  if (id === 'S1') signWords(LY.bg[1], S);
  if (id === 'S4') { stars(LY.bg[1], tq); chime(LY.bg[1], tq); }
  if (id === 'S1' || id === 'S2') splash(LY.fg[1], tq);
  rain(LY.fg[1], tq, id === 'S3' ? 60 : 120, id === 'S4' ? .7 : 1);
  comp.paperCam(0, 0, 1); comp.begin(PAPER, [0, 0]);
  const knock = regs => { const g = LY.knock.g; C.clear(LY.knock); g.imageSmoothingEnabled = true; g.drawImage(silhouette(S, regs, LY.sil), 0, 0, 1920, 1080); comp.knock(LY.knock.c, PAPER, [0, 0]); };
  const grpRegs = k => new Set(REG.filter(g => g && g.grp === k).map(g => g.id));
  comp.crayon(LY.bg[0].c, { goff: [0, 0] }); comp.crayon(LY.bg[1].c, { goff: [0, 0] });
  knock(grpRegs('ch')); comp.crayon(LY.ch[0].c, { goff: [0, 0] }); comp.crayon(LY.ch[1].c, { goff: [0, 0] });
  comp.crayon(LY.fg[0].c, { goff: [0, 0] }); comp.crayon(LY.fg[1].c, { goff: [0, 0] });
  comp.finish({ vig: .28, emb: .55, poff: [0, 0] });
}
await init();
window.DUR = DUR; window.render = t => frame(t);
window.RIGQA = t => { const tq = Math.floor(t * 15 + 1e-6) / 15, id = shotAt(tq)[2]; if (id !== 'S1' && id !== 'S2') return null; if (id === 'S1' && (tq < .3 || tq > 1.8)) return null;
  const J = solveProfile(poseAt(tq)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
