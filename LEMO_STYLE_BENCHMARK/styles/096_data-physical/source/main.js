// 096 · Data Physicalization — the first 10 s of "Last Train Home" built as an object (lemo-opuscar styles/data-physical).
// The data is the run itself (data/footfalls.csv, exported from the shared run rig, read by column name): one column of
// plates per foot contact, standing on a walnut slab at its clock time; the column's height is the distance run so far,
// 1 plate = 1 metre (rounded to the nearest plate, at most half a plate off: written in the facts line), every tenth plate
// brass so each stack is its own ruler; the footfall in the puddle is built in tinted acrylic. Columns are assembled plate by
// plate the moment the footfall happens (growth is assembly: nothing scales). Studio light, a greige sweep, one accent.
//   S1  low and close on the first columns; the third one (0.94 s) arrives in acrylic: the puddle
//   S2  tracking along the slab as the staircase rises; a reading on a brass plate; at 6.05 s "11:58 on her watch"
//   S3  down to the inlaid time line: the tick 23:58:48 and the column placed at 8.4 s
//   S4  the chime: pull back until the chart is an installation; the summary reading in the accent
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash, mulberry } from './shared/lib/util.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2, V3 = (x, y, z) => new THREE.Vector3(x, y, z);
await Promise.all(['200 140px IT', '300 48px IT', '500 30px IT', '400 20px PM', '400 40px NR'].map(f => document.fonts.load(f, 'A0')));
const csv = await (await fetch('data/footfalls.csv')).text();
const [head, ...lines] = csv.trim().split('\n'), cols = head.split(','), col = n => cols.indexOf(n);
const DATA = lines.map(l => l.split(',')).map(r => ({ step: +r[col('step')], t: +r[col('t_s')], clock: r[col('clock')], d: +r[col('distance_m')], wet: r[col('in_puddle')] === '1' }));
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const ov = document.getElementById('ov').getContext('2d');
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, W / H, .01, 50);
scene.background = new THREE.Color('#C4BEB4');
{ const hdr = await new RGBELoader().loadAsync('/core/assets/polyhaven/photo_studio_loft_hall_2k.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping; const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(hdr).texture; scene.environmentIntensity = .95; hdr.dispose(); }
// the warm key (low, long soft shadows) and a cool rim
const key = new THREE.DirectionalLight('#ffe2c0', 2.6); key.position.set(-1.6, .9, 1.1); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -.0004; key.shadow.normalBias = .01;
Object.assign(key.shadow.camera, { left: -.9, right: .9, top: .6, bottom: -.6, near: .2, far: 5 }); scene.add(key, key.target);
const rim = new THREE.DirectionalLight('#b8d4ff', 1.2); rim.position.set(1.4, .7, -1.2); scene.add(rim);
// the seamless sweep (a curved backdrop) — greige, matte
const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#C4BEB4', roughness: .95 })); floor.receiveShadow = true; scene.add(floor);
const back_ = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 6, 64, 1, true, Math.PI * .6, Math.PI * .8), new THREE.MeshStandardMaterial({ color: '#C4BEB4', roughness: .95, side: THREE.BackSide })); back_.position.set(0, 3, .6); scene.add(back_);

// ═════════ the slab: walnut veneer, an inlaid brass time line, engraved clock times (cut at the slab's own scale)
const X0 = -.52, PX = .104;                       // 10.4 cm per second along the slab
const xAt = s => X0 + s * PX;
const SL = { w: 1.18, d: .34, h: .045 };
const tl = new THREE.TextureLoader(), wd = await tl.loadAsync('/core/assets/polyhaven/walnut_diff.jpg'), wn = await tl.loadAsync('/core/assets/polyhaven/walnut_nor.jpg'), wr = await tl.loadAsync('/core/assets/polyhaven/walnut_rough.jpg');
const top = document.createElement('canvas'); top.width = 4096; top.height = 1180; { const c = top.getContext('2d'), img = wd.image;
  for (let x = 0; x < 4096; x += img.width * .9) c.drawImage(img, x, 0, img.width * .9, 1180);
  const u = x => (x - (-SL.w / 2)) / SL.w * 4096, v = z => (z + SL.d / 2) / SL.d * 1180;
  // engraved: ticks every second and the clock times, along the front strip; a brass inlay line
  c.fillStyle = '#c9a25a'; c.fillRect(u(X0 - .02), v(.118) - 4, u(xAt(10.3)) - u(X0 - .02), 8);
  for (let s = 0; s <= 10; s++) { const x = u(xAt(s - .2)); c.fillStyle = 'rgba(30,16,8,.85)'; c.fillRect(x - 3, v(.118) - (s % 5 ? 22 : 40), 6, s % 5 ? 44 : 80);
    const S = 23 * 3600 + 58 * 60 + 40 + s; c.font = '500 46px PM'; c.textAlign = 'center'; c.fillStyle = 'rgba(28,14,6,.82)'; c.fillText(`23:58:${String(S % 60).padStart(2, '0')}`, x, v(.152)); }
  c.font = '500 40px PM'; c.textAlign = 'left'; c.fillStyle = 'rgba(28,14,6,.7)'; c.fillText('STATION ROAD · 23:58:40 — 23:58:50 · ONE COLUMN PER FOOTFALL · 1 PLATE = 1 M', u(X0 - .01), v(-.14)); }
const topTex = new THREE.CanvasTexture(top); topTex.colorSpace = THREE.SRGBColorSpace; topTex.anisotropy = 8;
wd.colorSpace = THREE.SRGBColorSpace; for (const t of [wd, wn, wr]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); }
const sideMat = new THREE.MeshStandardMaterial({ map: wd, normalMap: wn, roughnessMap: wr, roughness: .7 }), topMat = new THREE.MeshStandardMaterial({ map: topTex, normalMap: wn, roughness: .55 });
const slab = new THREE.Mesh(new THREE.BoxGeometry(SL.w, SL.h, SL.d).translate(0, SL.h / 2, 0), [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]); slab.castShadow = slab.receiveShadow = true; scene.add(slab);
// ═════════ the plates: aluminium, brass for every tenth, tinted acrylic for the puddle's footfall
const PT = .0062, GAP = .0007, PW = .028, PD = .05, ZC = -.02;
const geo = new THREE.BoxGeometry(PW, PT, PD);
const mats = { al: new THREE.MeshStandardMaterial({ color: '#D6DADF', metalness: .85, roughness: .24 }), br: new THREE.MeshStandardMaterial({ color: '#E0BE84', metalness: .95, roughness: .22 }),
  ac: new THREE.MeshPhysicalMaterial({ color: '#9FD3D6', metalness: 0, roughness: .08, transmission: .82, thickness: .02, attenuationColor: new THREE.Color('#3f9aa0'), attenuationDistance: .05, ior: 1.49 }) };
const PL = [];   // every plate: column, index, kind
DATA.forEach((d, ci) => { const n = Math.max(1, Math.round(d.d)); for (let j = 0; j < n; j++) PL.push({ ci, j, t: d.t + j * .0075, kind: d.wet ? 'ac' : (j + 1) % 10 === 0 ? 'br' : 'al', r: mulberry(ci * 97 + j * 13 + 5) }); });
const IM = {}; for (const k of ['al', 'br', 'ac']) { const n = PL.filter(p => p.kind === k).length; IM[k] = new THREE.InstancedMesh(geo, mats[k], Math.max(1, n)); IM[k].castShadow = IM[k].receiveShadow = true; IM[k].count = 0; IM[k].frustumCulled = false; scene.add(IM[k]); }
const PJ = PL.map(p => ({ ...p, dx: (p.r() - .5) * .0016, dz: (p.r() - .5) * .0016, yaw: (p.r() - .5) * .05, sc: 1 + (p.r() - .5) * .07 }));
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), Y = V3(0, 1, 0);
function placePlates(t) {
  const cnt = { al: 0, br: 0, ac: 0 };
  for (const p of PJ) { if (t < p.t) continue; const a = t - p.t, drop = a < .06 ? (1 - eo(a / .06)) * .03 : 0, settle = a >= .06 && a < .14 ? Math.sin((a - .06) / .08 * Math.PI) * .0012 : 0;
    _p.set(xAt(DATA[p.ci].t) + p.dx, SL.h + PT / 2 + p.j * (PT + GAP) + drop + settle, ZC + p.dz); _q.setFromAxisAngle(Y, p.yaw); _s.set(p.sc, 1, p.sc);
    IM[p.kind].setMatrixAt(cnt[p.kind]++, _m.compose(_p, _q, _s)); }
  for (const k in IM) { IM[k].count = cnt[k]; IM[k].instanceMatrix.needsUpdate = true; }
}
const colTop = ci => V3(xAt(DATA[ci].t), SL.h + Math.max(1, Math.round(DATA[ci].d)) * (PT + GAP), ZC);

// ═════════ camera
function camAt(t) {
  const K = (p, l, f = 30) => ({ p, l, f }), mix = (a, b, k) => K(a.p.clone().lerp(b.p, k), a.l.clone().lerp(b.l, k), lerp(a.f, b.f, k));
  const C1 = t => K(V3(xAt(.35) + .1 + .02 * t, .085, .36), V3(xAt(1.0), .06, -.01), 26);
  const C2 = t => { const xn = xAt(Math.max(2.5, t)); return K(V3(xn - .02, .17 + .012 * t, .5), V3(xn + .03, SL.h + Math.max(2.5, t) * 4.06 * (PT + GAP) * .55, -.02), 28); };
  const C3 = t => { const x = xAt(8.4 - .2); return K(V3(x + .02, .16, .36 - .03 * seg(t, 7.9, 9.3)), V3(x + .035, .1, .02), 26); };   // the tick and the column standing behind it
  const C4 = K(V3(.32, .62, 1.38), V3(.02, .1, -.02), 30);
  if (t < 2.5) return C1(t);
  if (t < 7.5) return t < 3.1 ? mix(C1(2.5), C2(3.1), eio(seg(t, 2.5, 3.1))) : C2(t);
  if (t < 9.375) return t < 7.9 ? mix(C2(7.5), C3(7.9), eio(seg(t, 7.5, 7.9))) : C3(t);
  return mix(C3(9.375), C4, eio(seg(t, 9.375, 9.85)));
}
// ═════════ type (screen space only): readings pinned through the camera, the source line, the rule, the summary
const proj = p => { const q = p.clone().project(cam); return [(q.x + 1) / 2 * W, (1 - q.y) / 2 * H]; };
const INK = '#1C1D20', INK6 = 'rgba(28,29,32,.6)', ACC = '#D4521C';
function reading(px, py, bx, by, swatch, cat, val, unit, k = 1) {
  if (k <= 0) return; by = clamp(by, 110, H - 260); bx = clamp(bx, 60, W - 560); ov.save(); ov.globalAlpha = clamp(k * 2);
  ov.fillStyle = INK; ov.beginPath(); ov.arc(px, py, 4.5, 0, TAU); ov.fill(); ov.strokeStyle = INK; ov.lineWidth = 1.4; ov.beginPath(); ov.moveTo(px, py); ov.lineTo(lerp(px, bx, eo(k)), lerp(py, by + 40, eo(k))); ov.stroke();
  if (k > .5) { ov.font = '300 52px IT'; const w = Math.max(ov.measureText(val + ' ' + unit).width, 260) + 64; ov.fillStyle = 'rgba(244,240,232,.84)'; ov.beginPath(); ov.roundRect(bx, by - 10, w, 118, 6); ov.fill();
    ov.fillStyle = swatch; ov.fillRect(bx + 18, by + 10, 16, 16); ov.font = '500 24px IT'; ov.fillStyle = INK6; ov.textBaseline = 'middle'; ov.fillText(cat, bx + 44, by + 18);
    ov.font = '300 52px IT'; ov.fillStyle = INK; ov.fillText(val, bx + 18, by + 70); const vw = ov.measureText(val).width; ov.font = '400 22px PM'; ov.fillStyle = INK6; ov.fillText(unit, bx + 26 + vw, by + 76); }
  ov.restore();
}
function overlay(t) {
  ov.setTransform(1, 0, 0, 1, 0, 0); ov.clearRect(0, 0, W, H);
  // the rule, said once
  { const a = seg(t, 1.5, 1.8) * (1 - seg(t, 4.6, 4.9)); if (a > 0) { ov.globalAlpha = a; ov.font = '500 30px IT'; ov.fillStyle = INK; ov.textBaseline = 'alphabetic'; ov.fillText('1 plate = 1 metre run', 96, 120); ov.font = '400 22px PM'; ov.fillStyle = INK6; ov.fillText('EVERY 10TH PLATE BRASS · ONE COLUMN PER FOOTFALL', 96, 156); ov.globalAlpha = 1; } }
  // S1: the puddle's footfall, in acrylic
  if (t > EV.splash + .3 && t < 2.6) { const ci = DATA.findIndex(d => d.wet), [px, py] = proj(colTop(ci).add(V3(0, .002, 0))); reading(px, py, px + 120, py - 320, '#9FD3D6', 'footfall 3 · in the puddle', DATA[ci].d.toFixed(1), 'm', seg(t, EV.splash + .3, EV.splash + .6)); }
  // S2: a brass plate read at its edge; then the watch
  if (t > 3.6 && t < 5.9) { const cc = DATA.findIndex(d => Math.round(d.d) >= 10), p = V3(xAt(DATA[cc].t) + PW / 2, SL.h + 9.5 * (PT + GAP), ZC + PD / 2), [px, py] = proj(p);   // the first brass plate: 10 m
    reading(px, py, px + 90, py - 300, '#D2B07A', 'the 10th plate (brass)', '10', 'm run', seg(t, 3.6, 3.9) * (1 - seg(t, 5.6, 5.9))); }
  if (t > EV.watchUp && t < EV.watchDown + .35) { const ci = DATA.findIndex(d => d.t >= EV.watchUp), [px, py] = proj(colTop(ci)); reading(px, py, px - 460, py - 260, '#C8CCD1', 'her watch at footfall ' + DATA[ci].step, '11:58', `· ${DATA[ci].d.toFixed(1)} m`, seg(t, EV.watchUp, EV.watchUp + .3) * (1 - seg(t, EV.watchDown, EV.watchDown + .35))); }
  // S3: the inlaid time line
  if (t > 8.3 && t < 9.4) { const [px, py] = proj(V3(xAt(8.4 - .2), SL.h, .118)); reading(px, py, px + 120, py - 330, '#c9a25a', 'the station clock', '23:58:48', '', seg(t, 8.4, 8.65)); }
  // S4: the summary, in the accent
  if (t > EV.chime + .05) { const k = seg(t, EV.chime + .05, EV.chime + .3); ov.globalAlpha = k; ov.font = '200 120px IT'; ov.fillStyle = ACC; ov.textBaseline = 'alphabetic'; ov.fillText(`${DATA[DATA.length - 1].d.toFixed(1)} m`, 96, 250); ov.font = '500 30px IT'; ov.fillStyle = INK; ov.fillText(`run in ${DATA.length} footfalls · midnight in ${Math.round(80.4 - EV.chime)} s`, 100, 300);
    ov.fillStyle = ACC; ov.fillRect(100, 322, 560 * eo(seg(t, EV.chime + .15, EV.chime + .4)), 3); ov.globalAlpha = 1; }
  // the source line, from the first reading to the end (small, ink at 60 %)
  if (t > 1.2) { ov.font = '400 20px PM'; ov.fillStyle = INK6; ov.textAlign = 'right'; ov.textBaseline = 'alphabetic'; ov.fillText('DATA: footfalls.csv · the run rig of this benchmark (shared/aki2/motion.js) · 29 foot contacts, 0–10 s · rounded to ±0.5 plate', W - 72, H - 48); ov.textAlign = 'left'; }
}
window.render = t => {
  t = clamp(+t || 0, 0, DUR);
  placePlates(t);
  const C = camAt(t); cam.position.copy(C.p); cam.lookAt(C.l); cam.fov = C.f; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  renderer.render(scene, cam); overlay(t);
};
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(RUN.pose(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0); window.READY = true;
