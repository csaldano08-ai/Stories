// The night shopping street as a tabletop diorama: pixel-textured boxes, emissive shop windows and lightbox signs,
// street lamps that throw the sprite's shadow across the wet cobbles, puddles that catch the lights, rain, blue fog,
// a far city and the station clock tower. Cold ambient (moon + blue fog) against warm practicals (style §3).
import * as THREE from 'three';
import { PX, PPM, ramp, hex, h2, fbm, texOf, cobbles, glow, blob } from './px.js';
import { mats, mat, mesh, box, windowQuad } from './kit.js';
import { sky, rain, particles, flick } from './fx.js';

// —— a 5×7 pixel font for the signs ——
const FONT = {
  A: '01110100011000111111100011000110001', B: '11110100011000111110100011000111110', C: '01111100001000010000100001000001111', D: '11110100011000110001100011000111110',
  E: '11111100001000011110100001000011111', F: '11111100001000011110100001000010000', H: '10001100011000111111100011000110001', I: '01110001000010000100001000010001110',
  K: '10001100101010011000101001001010001', L: '10000100001000010000100001000011111', M: '10001110111010110101100011000110001', N: '10001110011010110011100011000110001',
  O: '01110100011000110001100011000101110', P: '11110100011000111110100001000010000', R: '11110100011000111110101001001010001', S: '01111100001000001110000010000111110',
  T: '11111001000010000100001000010000100', U: '10001100011000110001100011000101110', W: '10001100011000110101101011101110001', Y: '10001100010101000100001000010000100',
  2: '01110100010000100010001000100011111', 4: '00010001100101010010111110001000010', ' ': '00000000000000000000000000000000000',
};
export function signCanvas(word, col, o = {}) {
  const sc = o.sc ?? 1, pad = 3, w = word.length * 6 * sc - sc + pad * 2, h = 7 * sc + pad * 2, P = new PX(w, h), E = new PX(w, h);
  const plate = ramp(o.plate ?? ['#140c14', '#22161e', '#2e1e26']), L = ramp(col.map ? col : [col]), c0 = hex(col[col.length - 1] ?? col);
  P.fill((x, y) => { const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1; return edge ? hex('#5a4a3a') : plate(.5 + (h2(x, y, 3) - .5) * .3, x, y); });
  [...word].forEach((ch, i) => { const g = FONT[ch] || FONT[' ']; for (let j = 0; j < 7; j++) for (let k = 0; k < 5; k++) if (g[j * 5 + k] === '1') for (let a = 0; a < sc; a++) for (let b = 0; b < sc; b++) { const x = pad + (i * 6 + k) * sc + a, y = pad + j * sc + b, c = L(.4 + (1 - j / 7) * .6, x, y); P.set(x, y, c); E.set(x, y, c); } });
  return { c: P.done(), e: E.done(), w, h };
}
export function signMesh(word, col, hM, o = {}) {
  const S = signCanvas(word, col, o), wM = hM * S.w / S.h;
  const m = new THREE.MeshStandardMaterial({ map: texOf(S.c), emissiveMap: texOf(S.e), emissive: new THREE.Color('#ffffff'), emissiveIntensity: o.emI ?? 2.4, roughness: .7 });
  const me = new THREE.Mesh(new THREE.PlaneGeometry(wM, hM), m); me.userData.word = word; me.userData.S = S; return me;
}
// shop window: pixel panes with goods silhouettes, warm emissive
function shopWindowMat(seed, warm) {
  const P = new PX(48, 30), E = new PX(48, 30), F = ramp(['#140c08', '#2a1a10', '#40281a']), G = ramp(warm, .3);
  P.fill((x, y) => {
    const fr = x < 1 || x > 46 || y < 1 || y > 28 || x === 16 || x === 32;
    if (fr) return F(y < 2 ? .9 : .4, x, y);
    const shelf = y === 12 || y === 22, goods = (y > 6 && y < 12 && h2(x >> 2, 1, seed) > .45) || (y > 16 && y < 22 && h2(x >> 1, 2, seed) > .55);
    if (shelf) return F(.6, x, y);
    if (goods) return ramp(['#2a1a20', '#4a2a2a'])(h2(x, y, seed), x, y);
    const c = G(.45 + (1 - y / 30) * .4 + (h2(x, y, seed) - .5) * .2, x, y); E.set(x, y, c); return c;
  });
  return new THREE.MeshStandardMaterial({ map: texOf(P.done()), emissiveMap: texOf(E.done()), emissive: new THREE.Color('#ffffff'), emissiveIntensity: 1.25, roughness: .5 });
}
function awningMat(c1, c2) { const P = new PX(24, 12); P.fill((x, y) => hex(((x >> 2) % 2) ? c1 : c2).map(v => v * (y > 9 ? .7 : 1) | 0)); return new THREE.MeshStandardMaterial({ map: texOf(P.done()), roughness: .9, side: THREE.DoubleSide }); }
function cityWinTex(seed) {   // far buildings: dark wall, scattered warm windows
  const P = new PX(32, 64), E = new PX(32, 64), D = ramp(['#0c0f1c', '#151a2c', '#1d2438']);
  P.fill((x, y) => { const wx = x % 4 >= 1 && x % 4 <= 2, wy = y % 5 >= 1 && y % 5 <= 3, lit = h2(x >> 2, (y / 5) | 0, seed) > .66;
    if (wx && wy && lit) { const c = ramp(['#b86a2a', '#ffb860', '#ffe0a0'])(h2(x, y, seed + 1), x, y); E.set(x, y, c); return c; } return D(.5 + (h2(x, y, seed) - .5) * .4, x, y); });
  const t = texOf(P.done()), e = texOf(E.done()); t.wrapS = t.wrapT = e.wrapS = e.wrapT = THREE.RepeatWrapping;
  return { t, e };
}

export const SHOPS = [['24H', ['#8fe8d4', '#d8fff4']], ['CAFE', ['#ff8fb0', '#ffd8e4']], ['BAKERY', ['#ffb050', '#ffe6b0']], ['BAR', ['#ff9ab0', '#ffe0ea']], ['BOOKS', ['#ffd070', '#fff0c0']],
  ['PHARMACY', ['#8fe8d4', '#d8fff4']], ['NOODLES', ['#ffb050', '#ffe6b0']], ['LAUNDRY', ['#c8d4ff', '#f0f4ff']], ['RECORDS', ['#ff9ab0', '#ffe0ea']], ['HOTEL', ['#ffd070', '#fff0c0']], ['FLOWERS', ['#ff8fb0', '#ffd8e4']], ['DINER', ['#ffb050', '#ffe6b0']]];

export function buildTown(o = {}) {
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2('#18213c', .028);
  const SK = sky({ top: '#04061a', mid: '#0f1838', hor: '#26355a', moonDir: new THREE.Vector3(-.5, .45, -1), moonCol: '#c8d6ff', moonI: .7 }); scene.add(SK.mesh);
  const moon = new THREE.DirectionalLight('#7f95d0', .55); moon.position.set(-18, 30, 14); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -40, right: 40, top: 30, bottom: -30, near: 1, far: 120 }); moon.shadow.bias = -.0006; scene.add(moon, moon.target);
  scene.add(new THREE.HemisphereLight('#4a5e98', '#141420', 1.5));
  const MM = mats();
  // ground: wet cobbles (low roughness picks up the practicals), a kerb line, the pavement strip in front of the shops
  const cob = mat(cobbles(96, 96, { cell: 6, cols: ['#12121c', '#22222e', '#33323f', '#45434f', '#5a5764'] }), { rough: .42 });
  scene.add(mesh(new THREE.BoxGeometry(140, .4, 60).translate(0, -.2, -8), cob, { cast: false }));
  const kerb = box(140, .12, .3, MM.beam, { cast: false }); kerb.position.set(0, 0, 1.6); scene.add(kerb);
  // shops along x, front face at z = −3
  const shops = [], winLights = [];
  const LAY = []; { let x = -34, i = 0; while (x < 34) { const w = 5.2 + h2(i, 1, 7) * 2.2; LAY.push([x, w]); x += w + .25; i++; } }
  // the shop behind the hero puddle is the 24H (its neighbour is the CAFE): shift the sign list so the S1 boards match
  const hi = Math.max(0, LAY.findIndex(([x, w]) => (o.heroX ?? 0) - 1.2 >= x && (o.heroX ?? 0) - 1.2 < x + w + .25)), shift = (SHOPS.length * 4 - hi) % SHOPS.length;
  for (let i = 0; i < LAY.length; i++) {
    const [x, w] = LAY[i], h = 5.5 + h2(i, 2, 7) * 3, wall = ['wall', 'wall2', 'wall3'][i % 3];
    const g = new THREE.Group(); g.position.set(x + w / 2, 0, -5.5);
    g.add(box(w, h, 5, MM[wall]));
    const [word, col] = SHOPS[(i + shift) % SHOPS.length];
    const win = new THREE.Mesh(new THREE.PlaneGeometry(w * .62, 1.8), shopWindowMat(i * 13 + 1, ['#8a3e14', '#e0822c', '#ffc05a', '#ffe6a4']));
    win.position.set(-w * .1, 1.25, 2.52); g.add(win);
    const door = box(1, 2.1, .12, MM.plankDark); door.position.set(w * .33, 0, 2.52); g.add(door);
    const sg = signMesh(word, col, .62, { sc: 1 }); sg.position.set(-w * .05, 2.75, 2.56); g.add(sg);
    const aw = new THREE.Mesh(new THREE.PlaneGeometry(w * .8, 1.1), awningMat(i % 2 ? '#e9dcc0' : '#d8c8a8', ['#2f6b68', '#5b3f5d', '#6b6e43'][i % 3])); aw.rotation.x = -1.0; aw.position.set(-w * .05, 2.35, 3.0); aw.castShadow = true; g.add(aw);
    for (const ux of [-w * .3, w * .1, w * .3].slice(0, w > 6 ? 3 : 2)) { const q = windowQuad(.75, 1); q.position.set(ux, 4.3, 2.52); g.add(q); if (h > 7) { const q2 = windowQuad(.75, 1); q2.position.set(ux, 6.2, 2.52); g.add(q2); } }
    scene.add(g); shops.push({ g, x0: x, x1: x + w, word, sign: sg });
    if (i % 2 === 0) { const L = new THREE.PointLight('#ffb060', 1.8, 8, 2); L.position.set(x + w * .4, 1.4, -1.6); scene.add(L); winLights.push(L); }   // the windows' spill on the pavement
  }
  // street lamps (front of the street, z = +3.4): spot lights with shadows → the sprite's shadow swings as she passes each lamp
  const lamps = [];
  for (let k = 0; k < 9; k++) {
    const lx = -32 + k * 8.5, g = new THREE.Group(); g.position.set(lx, 0, 3.4);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .1, 4.2, 6).translate(0, 2.1, 0), new THREE.MeshStandardMaterial({ color: '#16141c', roughness: .6 })); post.castShadow = true; g.add(post);
    const arm = box(.9, .08, .08, MM.beam); arm.position.set(-.4, 4.1, 0); g.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.36, .3, .36).translate(-.8, 3.9, 0), new THREE.MeshStandardMaterial({ color: '#2a2018', emissive: new THREE.Color('#ffc070'), emissiveIntensity: 2.6 })); g.add(head);
    const halo = glow('#ffc070', 1.6, 1.1); halo.position.set(-.8, 3.85, 0); g.add(halo);
    const sp = new THREE.SpotLight('#ffbf70', 38, 14, .95, .55, 2); sp.position.set(lx - .8, 3.75, 3.4); sp.target.position.set(lx - 1.3, 0, 1.2);
    sp.castShadow = Math.abs(lx - (o.shadowX ?? 0)) < (o.shadowR ?? 99); sp.shadow.mapSize.set(512, 512); sp.shadow.bias = -.002; sp.shadow.camera.near = .5; sp.shadow.camera.far = 12;
    scene.add(g, sp, sp.target); lamps.push({ g, sp, halo, x: lx });
  }
  // puddles: low-roughness dark water that catches every practical as a streak of light
  const pudM = new THREE.MeshStandardMaterial({ color: '#232c48', roughness: .12, metalness: .15, transparent: true, opacity: .85 });
  const puddles = [];
  for (let k = 0; k < 16; k++) { const px = -33 + k * 4.4 + h2(k, 4, 9) * 2, pz = -1.6 + h2(k, 5, 9) * 3.2, sx = .9 + h2(k, 6, 9) * 1.4;
    const pm = new THREE.Mesh(new THREE.CircleGeometry(1, 20), pudM); pm.rotation.x = -Math.PI / 2; pm.scale.set(sx, sx * .55, 1); pm.position.set(px, .006, pz); pm.receiveShadow = true; scene.add(pm); puddles.push(pm); }
  // far city (backdrop, blurred by the depth of field) and the station clock tower
  for (let k = 0; k < 24; k++) { const T = cityWinTex(k + 3), w = 4.5 + h2(k, 8, 5) * 4, hh = 5 + h2(k, 9, 5) * 8, bx = -40 + (k % 12) * 7.5 + h2(k, 10, 5) * 2, bz = -16 - Math.floor(k / 12) * 13 - h2(k, 11, 5) * 5;
    const m = new THREE.MeshStandardMaterial({ map: T.t.clone(), emissiveMap: T.e.clone(), emissive: new THREE.Color('#ffffff'), emissiveIntensity: 1.6, roughness: .9 });
    for (const tt of [m.map, m.emissiveMap]) { tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(w / 8, hh / 16); tt.needsUpdate = true; }
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, w).translate(0, hh / 2, 0), m); b.position.set(bx, 0, bz); scene.add(b);
    const rf = box(w + .3, .35, w + .3, MM.roof2, { cast: false }); rf.position.set(bx, hh, bz); scene.add(rf); }
  const tower = new THREE.Group(); tower.position.set(o.towerX ?? 22, 0, -11);
  tower.add(box(3.6, 20, 3.6, MM.wall2)); const roof = new THREE.Mesh(new THREE.ConeGeometry(3, 3.4, 4).translate(0, 21.7, 0), MM.roof2); roof.rotation.y = Math.PI / 4; roof.castShadow = true; tower.add(roof);
  const clockC = new PX(32, 32), clockE = new PX(32, 32);
  clockC.fill((x, y) => { const d = Math.hypot(x - 15.5, y - 15.5); if (d > 15.5) return null; if (d > 14) return hex('#6a5228'); const tick = d > 12 && d < 14 && (Math.round(Math.atan2(y - 15.5, x - 15.5) / (Math.PI / 6) * 100) % 100 === 0); const c = tick ? hex('#3a2a18') : ramp(['#d8c8a0', '#fff4d8', '#fffbea'])(.6 + (h2(x, y, 2) - .5) * .3, x, y); clockE.set(x, y, c); return c; });
  for (let r = 0; r < 9; r++) { clockC.set(15 - Math.round(r * .35), 15 - r, hex('#20160e')); clockE.set(15 - Math.round(r * .35), 15 - r, hex('#20160e')); }
  for (let r = 0; r < 12; r++) { clockC.set(15, 15 - r, hex('#20160e')); clockE.set(15, 15 - r, hex('#20160e')); }
  const clockM = new THREE.MeshStandardMaterial({ map: texOf(clockC.done()), emissiveMap: texOf(clockE.done()), emissive: new THREE.Color('#ffffff'), emissiveIntensity: 1.4, transparent: true, alphaTest: .5 });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), clockM); face.position.set(0, 16.5, 1.82); tower.add(face);
  const clockL = new THREE.PointLight('#ffe0a0', 6, 9, 2); clockL.position.set(0, 16.5, 3); tower.add(clockL);
  const clockGlow = glow('#ffe8b0', 4.5, .9); clockGlow.position.set(0, 16.5, 2); tower.add(clockGlow);
  scene.add(tower);
  // rain + dust in the light
  const R = rain(2600, [-18, 0, -6, 18, 16, 8], { speed: 20, len: .7, opacity: .3, color: '#a8bcd8' }); scene.add(R);
  return { scene, SK, shops, lamps, puddles, winLights, R, tower, clockM, clockL, clockGlow };
}
