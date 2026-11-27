// AKI as a voxel toy, re-voxelised every frame from the shared rig: the pose is rasterised onto one pixel grid (no anti-aliasing, an automatic
// ink outline), then every pixel becomes a bevelled cube, thin at the silhouette and thicker inside (the voxel.js recipe), the eye standing proud.
// The rig keeps its constant bone lengths and its planted foot: the grid is anchored to her pelvis on the same lattice as the floor.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp } from '/core/lib.js';

const box = new RoundedBoxGeometry(1, 1, 1, 2, .16), DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export function makeAkiVox(scene, { cell = .0042, GW = 64, GH = 50, CX = 30, GY = 46, depthK = .85 } = {}) {
  const MAX = GW * GH, mesh = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ roughness: .48, metalness: 0 }), MAX);
  mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.count = 0;
  const root = new THREE.Group(); root.add(mesh); scene.add(root);
  const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH; const c = cv.getContext('2d', { willReadFrequently: true });
  const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(), q = new THREE.Quaternion(), col = new THREE.Color();
  // raster primitives (pixel centres inside the shape are filled)
  const capsule = (a, b, r, fill) => { c.fillStyle = fill; const x0 = Math.floor(Math.min(a[0], b[0]) - r), x1 = Math.ceil(Math.max(a[0], b[0]) + r), y0 = Math.floor(Math.min(a[1], b[1]) - r), y1 = Math.ceil(Math.max(a[1], b[1]) + r);
    const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const u = clamp(((x + .5 - a[0]) * dx + (y + .5 - a[1]) * dy) / L2), qx = a[0] + dx * u - x - .5, qy = a[1] + dy * u - y - .5; if (qx * qx + qy * qy <= r * r) c.fillRect(x, y, 1, 1); } };
  const poly = (P, fill) => { c.fillStyle = fill; const ys = P.map(p => p[1]); for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) { const xs = [];
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if ((a[1] <= y + .5) !== (b[1] <= y + .5)) xs.push(a[0] + (y + .5 - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
    xs.sort((m, n) => m - n); for (let k = 0; k + 1 < xs.length; k += 2) c.fillRect(Math.round(xs[k]), y, Math.round(xs[k + 1]) - Math.round(xs[k]), 1); } };
  const dot = (x, y, fill) => { c.fillStyle = fill; c.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const A = { root, mesh, cell, GW, GH, CX, GY, height: GH * cell };
  // draw(api) paints the pose with api.capsule / api.poly / api.dot; outline = ink drawn around every opaque pixel; eyes are pure black
  A.update = (draw, outline = '#231f33') => {
    c.clearRect(0, 0, GW, GH); draw({ capsule, poly, dot });
    const id = c.getImageData(0, 0, GW, GH), d = id.data, o = new Uint8ClampedArray(d), oc = new THREE.Color(outline);
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const i = (y * GW + x) * 4; if (d[i + 3]) continue;
      if ((x < GW - 1 && d[i + 7]) || (x > 0 && d[i - 1]) || (y < GH - 1 && d[i + GW * 4 + 3]) || (y > 0 && d[i - GW * 4 + 3])) { o[i] = oc.r * 255; o[i + 1] = oc.g * 255; o[i + 2] = oc.b * 255; o[i + 3] = 255; } }
    const occ = new Int16Array(GW * GH).fill(0), cells = [];
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (o[(y * GW + x) * 4 + 3]) { occ[y * GW + x] = 1; cells.push([x, y]); }
    // distance to the silhouette (breadth-first), for the thickness
    const dist = new Int16Array(GW * GH).fill(0), qq = [];
    for (const [x, y] of cells) if (DIRS.some(([a, b]) => { const X = x + a, Y = y + b; return X < 0 || Y < 0 || X >= GW || Y >= GH || !occ[Y * GW + X]; })) { dist[y * GW + x] = 1; qq.push(x, y); }
    for (let k = 0; k < qq.length; k += 2) { const x = qq[k], y = qq[k + 1], dd = dist[y * GW + x];
      for (const [a, b] of DIRS) { const X = x + a, Y = y + b; if (X < 0 || Y < 0 || X >= GW || Y >= GH) continue; const n = Y * GW + X; if (occ[n] && !dist[n]) { dist[n] = dd + 1; qq.push(X, Y); } } }
    let n = 0;
    for (const [x, y] of cells) { const i = (y * GW + x) * 4, eye = o[i] + o[i + 1] + o[i + 2] < 8;
      const dep = (2.2 + Math.min(dist[y * GW + x] - 1, 3.2) * 1.15) * cell * depthK + (eye ? cell * .9 : 0);
      p.set((x + .5 - CX) * cell, (GY - y - .5) * cell, eye ? cell * .45 : 0); s.set(cell * .94, cell * .94, dep); m4.compose(p, q, s); mesh.setMatrixAt(n, m4);
      col.setRGB(o[i] / 255, o[i + 1] / 255, o[i + 2] / 255, THREE.SRGBColorSpace); mesh.setColorAt(n, col); n++; }
    mesh.count = n; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };
  return A;
}
