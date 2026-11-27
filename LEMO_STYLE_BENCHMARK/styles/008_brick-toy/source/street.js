// The night street built from bricks on a real walnut desk: shop facades in running bond (instanced bricks), lit
// trans-yellow windows, printed sign tiles, brick street lamps, trans-clear puddle tiles, a brick clock tower at the end
// of the street; the real room around it (desk lamp on, tea set, a stack of books), lit like toy photography at night:
// low neutral HDRI, a cool rim softbox, a warm key softbox, the desk lamp's bulb, small practicals in the bricks.
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { COL, BRICK, PLATE, brick, plate, mesh, roundGeo, brickGeo, plastic } from './bricks.js';
import { hash } from './shared/lib/util.js';

const PH = '/core/assets/polyhaven/';
export const M = 125;                                            // 1 m = 125 studs
export const Z_RUN = 2, Z_FRONT = -6;                            // the runner's lane; shop fronts
const SHOPCOL = ['#b4d2e3', '#e4cd9e', '#a0a5a9', '#958a73', '#7d9fb3', '#cfa6a0'];
export const SIGNS = [['24H', '#36aebf'], ['CAFE', '#e85fa0'], ['BAKERY', '#fe8a18'], ['BAR', '#e85fa0'], ['BOOKS', '#f2cd37'], ['PHARMACY', '#4cb050'], ['NOODLES', '#fe8a18'], ['LAUNDRY', '#36aebf'], ['RECORDS', '#e85fa0'], ['HOTEL', '#f2cd37']];

function signTile(word, col, w) {   // a printed 1×w tile (no studs, so it may carry lettering)
  const c = document.createElement('canvas'); c.width = 64 * w; c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#1b2a34'; x.fillRect(0, 0, c.width, 64); x.fillStyle = col; x.font = '700 44px Fredoka, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(word, c.width / 2, 35);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const front = new THREE.MeshPhysicalMaterial({ map: t, emissiveMap: t, emissive: new THREE.Color('#ffffff'), emissiveIntensity: .9, roughness: .3, clearcoat: .8 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1, .4), [plastic(COL.black), plastic(COL.black), plastic(COL.black), plastic(COL.black), front, plastic(COL.black)]);
  m.castShadow = true; return m;
}
export async function buildStreet(scene, o = {}) {
  const hdr = await new RGBELoader().loadAsync(PH + 'photo_studio_loft_hall_2k.hdr');
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdr; scene.background = hdr;
  scene.backgroundBlurriness = .6; scene.backgroundIntensity = .05; scene.environmentIntensity = .16;
  scene.environmentRotation.y = scene.backgroundRotation.y = 1.2;
  const tl = new THREE.TextureLoader(), tex = (f, srgb) => { const t = tl.load(PH + f); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(900, 700), new THREE.MeshStandardMaterial({ map: tex('walnut_diff.jpg', true), normalMap: tex('walnut_nor.jpg'), roughnessMap: tex('walnut_rough.jpg'), roughness: 1, color: '#bba08a' }));
  desk.rotation.x = -Math.PI / 2; desk.position.set(0, -.01, -60); desk.receiveShadow = true; scene.add(desk);

  // lights: dim cool "window" key with shadows, a cool rim softbox, a warm softbox low from the front, the desk lamp bulb
  const key = new THREE.DirectionalLight('#b8ccff', .45); key.position.set(-80, 120, 70); key.target.position.set(0, 0, -6);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0004; key.shadow.normalBias = .03; key.shadow.radius = 3;
  Object.assign(key.shadow.camera, { left: -150, right: 150, top: 80, bottom: -80, near: 10, far: 400 }); scene.add(key, key.target);
  RectAreaLightUniformsLib.init();
  const box = (col, I, w, h, p, at) => { const l = new THREE.RectAreaLight(col, I, w, h); l.position.set(...p); l.lookAt(...at); scene.add(l); return l; };
  box('#9fb8ff', 5, 160, 30, [0, 45, -80], [0, 6, 0]);           // cool rim behind the street
  const softKey = box('#ffe8d0', 2.2, 60, 30, [-30, 30, 70], [0, 4, 0]);
  const gl = new GLTFLoader(), load = async n => (await gl.loadAsync(`${PH}${n}/${n}.gltf`)).scene;
  const lamp = await load('desk_lamp_arm_01'); lamp.scale.setScalar(M); lamp.position.set(-150, 0, -90); lamp.rotation.y = .9; scene.add(lamp);
  const tea = await load('tea_set_01'); const dead = []; tea.traverse(m => { if (m.name.startsWith('tea_set_01_') && !/teapot_01|cup_small_01|saucer_circular_04/.test(m.name)) dead.push(m); }); dead.forEach(m => m.parent.remove(m));
  tea.scale.setScalar(M); tea.position.set(150, 0, -110); scene.add(tea);
  for (const g of [lamp, tea]) g.traverse(m => { if (m.isMesh) m.castShadow = m.receiveShadow = true; });
  const bulb = new THREE.PointLight('#ffd6a0', 900, 260, 2); bulb.position.set(-118, 52, -86); scene.add(bulb);
  // books under the far end of the street (the station stands on them)
  const cloth = ['#7b2d26', '#274b6d', '#3d5c3a']; let by = 0;
  const books = new THREE.Group(); books.position.set(95, 0, -22); scene.add(books);
  [[44, 4.2, 30], [40, 3.6, 28], [42, 4.6, 29]].forEach(([w, h, d], i) => { const c = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: cloth[i], roughness: .75 })); c.position.y = by + h / 2; c.rotation.y = (hash(i * 3.1) - .5) * .2; c.castShadow = c.receiveShadow = true; books.add(c); by += h; });

  // the street: a dark grey matte baseplate (road), a light grey sidewalk of plates, a curb row
  const road = new THREE.Mesh(brickGeo(200, 30, .3, { tile: true }), new THREE.MeshPhysicalMaterial({ color: '#3d4148', roughness: .6, clearcoat: .15, clearcoatRoughness: .5 })); road.position.set(-30, 0, 4); road.receiveShadow = true; scene.add(road);
  const walk = new THREE.Mesh(brickGeo(200, 12, PLATE, { tile: true }), new THREE.MeshPhysicalMaterial({ color: '#a0a5a9', roughness: .55, clearcoat: .2 })); walk.position.set(-30, .3, -.5); walk.receiveShadow = walk.castShadow = true; scene.add(walk);
  const TOPW = .3 + PLATE;
  // instanced running-bond facades: one InstancedMesh per colour
  const geo2 = brickGeo(2, 1, BRICK, { tile: true }), geo1 = brickGeo(1, 1, BRICK, { tile: true }), perCol = new Map(), shops = [];
  let x = -125, si = 0;
  while (x < 66) {
    const w = 14 + 2 * Math.floor(hash(si * 1.7) * 3), rows = 15 + Math.floor(hash(si * 2.3) * 6), col = SHOPCOL[si % SHOPCOL.length];
    const L = perCol.get(col) || { b2: [], b1: [] }; perCol.set(col, L);
    // openings in stud columns × brick rows: the shop window, the door, upper windows 2 studs × 2 rows
    const open = (c, r) => (r < 6 && c >= 1 && c < w - 7) || (r < 6 && c >= w - 5 && c < w - 2) || (r >= 8 && r < rows - 2 && (r - 8) % 4 < 2 && c >= 2 && c < w - 2 && (c - 2) % 5 < 2 && hash(si * 9 + r - (r - 8) % 4 + c - (c - 2) % 5) >= .35);
    for (let r = 0; r < rows; r++) {   // running bond: 2×1 bricks, 1×1 fillers at the edges of openings and on odd rows
      let c = 0; if (r % 2 && !open(0, r)) { L.b1.push([x + .5, TOPW + r * BRICK, Z_FRONT - .5]); c = 1; }
      while (c < w) { if (open(c, r)) { c++; continue; }
        if (c + 1 < w && !open(c + 1, r)) { L.b2.push([x + c + 1, TOPW + r * BRICK, Z_FRONT - .5]); c += 2; } else { L.b1.push([x + c + .5, TOPW + r * BRICK, Z_FRONT - .5]); c++; } }
    }
    const door = [w - 5, w - 3];
    // lit openings: shop window, upper windows (trans yellow, emissive) and the door
    const winM = new THREE.MeshPhysicalMaterial({ color: '#f5c542', emissive: new THREE.Color('#ffb347'), emissiveIntensity: 1.6 + hash(si) * .6, roughness: .2, clearcoat: 1, transparent: true, opacity: .92 });
    const sw = new THREE.Mesh(new THREE.BoxGeometry(w - 8, 6 * BRICK, .3), winM); sw.position.set(x + 1 + (w - 8) / 2, TOPW + 3 * BRICK, Z_FRONT - .7); scene.add(sw);
    const dr = new THREE.Mesh(new THREE.BoxGeometry(3, 6 * BRICK, .4), plastic('#6b3a22')); dr.position.set(x + door[0] + 1.5, TOPW + 3 * BRICK, Z_FRONT - .7); dr.castShadow = true; scene.add(dr);
    for (let r = 8; r < rows - 2; r += 4) for (let c = 2; c < w - 2; c += 5) { if (!open(c, r)) continue; const q = new THREE.Mesh(new THREE.BoxGeometry(2, 2 * BRICK, .3), winM); q.position.set(x + c + 1, TOPW + (r + 1) * BRICK, Z_FRONT - .7); scene.add(q); }
    const [word, scol] = SIGNS[(si + (o.shift ?? 0)) % SIGNS.length];
    const st = signTile(word, scol, Math.min(w - 6, Math.max(4, word.length + 1))); st.position.set(x + w / 2 - 2, TOPW + 6.7 * BRICK, Z_FRONT + .2); scene.add(st);
    const aw = plate(w - 6, 2, si % 2 ? COL.white : '#36aebf'); aw.position.set(x + (w - 6) / 2 + 1, TOPW + 6.1 * BRICK, Z_FRONT + 1); aw.rotation.x = .35; scene.add(aw);
    const roof = plate(w, 2, '#6c6e68'); roof.position.set(x + w / 2, TOPW + rows * BRICK, Z_FRONT - .5); scene.add(roof);
    shops.push({ x, w, word }); x += w; si++;
  }
  for (const [col, L] of perCol) for (const [g, list] of [[geo2, L.b2], [geo1, L.b1]]) {
    if (!list.length) continue;
    const im = new THREE.InstancedMesh(g, plastic(col), list.length), m4 = new THREE.Matrix4();
    list.forEach((p, i) => { m4.makeTranslation(p[0], p[1], p[2]); im.setMatrixAt(i, m4); });
    im.castShadow = im.receiveShadow = true; scene.add(im);
  }
  // brick street lamps (black round bricks, a trans-yellow lamp with a small practical)
  const lamps = [];
  for (let k = 0; k < 5; k++) {
    const lx = -118 + k * 40, g = new THREE.Group(); g.position.set(lx, TOPW, 5);
    for (let i = 0; i < 9; i++) { const b = mesh(roundGeo(.5), COL.black); b.position.y = i * BRICK; g.add(b); }
    const cap = mesh(roundGeo(1, PLATE), COL.black); cap.position.y = 9 * BRICK; g.add(cap);
    const bulbB = new THREE.Mesh(roundGeo(.5), new THREE.MeshPhysicalMaterial({ color: '#ffd35a', emissive: new THREE.Color('#ffc24a'), emissiveIntensity: 3, roughness: .1, clearcoat: 1 })); bulbB.position.y = 9 * BRICK + PLATE; g.add(bulbB);
    const L = new THREE.PointLight('#ffc070', 90, 34, 2); L.position.set(lx, TOPW + 9 * BRICK + 1, 5.5); scene.add(g, L); lamps.push({ g, L, x: lx });
  }
  // the station clock tower on the books at the far end
  const tower = new THREE.Group(); tower.position.set(95, by, -22); scene.add(tower);
  for (let r = 0; r < 30; r++) for (const [dx, dz, w, d] of [[0, -2.5, 6, 1], [0, 2.5, 6, 1], [-2.5, 0, 1, 4], [2.5, 0, 1, 4]]) { const b = brick(w, d, '#958a73', { tile: r < 29 }); b.position.set(dx, r * BRICK, dz); tower.add(b); }
  const clockTex = document.createElement('canvas'); clockTex.width = clockTex.height = 128; { const x = clockTex.getContext('2d'); x.fillStyle = '#fff3cf'; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#2a2018'; x.lineCap = 'round';
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; x.lineWidth = 6; x.beginPath(); x.moveTo(64 + Math.sin(a) * 44, 64 - Math.cos(a) * 44); x.lineTo(64 + Math.sin(a) * 56, 64 - Math.cos(a) * 56); x.stroke(); }
    x.lineWidth = 9; x.beginPath(); x.moveTo(64, 64); x.lineTo(64 - 6, 30); x.stroke(); x.lineWidth = 6; x.beginPath(); x.moveTo(64, 64); x.lineTo(62, 14); x.stroke(); }
  const ct = new THREE.CanvasTexture(clockTex); ct.colorSpace = THREE.SRGBColorSpace;
  const clockM = new THREE.MeshPhysicalMaterial({ map: ct, emissiveMap: ct, emissive: new THREE.Color('#fff0c0'), emissiveIntensity: 1.2, roughness: .2, clearcoat: 1 });
  const face = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, .3, 40), [plastic(COL.black), clockM, plastic(COL.black)]); face.rotation.x = Math.PI / 2; face.position.set(0, 25 * BRICK, 3.2); tower.add(face);
  const troof = mesh(new THREE.ConeGeometry(4.6, 6, 4).translate(0, 3, 0), '#6c6e68'); troof.rotation.y = Math.PI / 4; troof.position.y = 30 * BRICK; tower.add(troof);
  const clockL = new THREE.PointLight('#ffe0a0', 40, 30, 2); clockL.position.set(95, by + 25 * BRICK, -16); scene.add(clockL);
  return { key, softKey, bulb, lamps, shops, tower, clockM, clockL, TOPW, by };
}
