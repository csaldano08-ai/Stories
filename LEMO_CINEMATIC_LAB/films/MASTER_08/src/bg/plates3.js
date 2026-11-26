// Plates for S14–S20: the train (an invented livery: cream body, teal stripe), the platform, the cab, the interior, the city.
import { plate, vgrad, air, clouds, building, lightbox, reflection, canvas, rgba, mix, mulberry, lerp } from './paint.js';

const WIN = ['#ffd27a', '#ffe7b0', '#9fe6ff', '#ffb36a', '#f4f0ff'];
// train side in world units (u): platform/floor at y=0, roof at y≈−860. Draws one car from x to x+len.
// o: {doorAt:[x…] door centres, open:0..1 (door leaves slide), lit:1, interior:true}
export function trainSide(g, e, x, len, o = {}) {
  const top = -860, bot = 60;
  // body
  const gr = g.createLinearGradient(0, top, 0, bot); gr.addColorStop(0, '#d8d2c4'); gr.addColorStop(.08, '#eee8da'); gr.addColorStop(.85, '#cfc8b8'); gr.addColorStop(1, '#9a9488');
  g.fillStyle = gr; g.fillRect(x, top, len, bot - top);
  g.fillStyle = '#7a7668'; g.fillRect(x, top, len, 18);                       // roof gutter
  g.fillStyle = '#1f8a8a'; g.fillRect(x, -250, len, 34);                       // teal stripe
  g.fillStyle = '#e46a3a'; g.fillRect(x, -212, len, 8);                        // thin vermilion pinstripe (echoes her jacket)
  const doors = o.doorAt || [];
  const inDoor = wx => doors.some(d => Math.abs(wx - d) < 300);
  // windows (warm interior)
  for (let wx = x + 160; wx < x + len - 300; wx += 460) {
    if (inDoor(wx + 180)) continue;
    winRect(g, e, wx, -650, 360, 330, o);
  }
  for (const d of doors) door(g, e, d, o.open ?? 0, o);
  g.strokeStyle = rgba('#5a5648', .6); g.lineWidth = 3;
  for (let px = x; px < x + len; px += 920) { g.beginPath(); g.moveTo(px, top + 20); g.lineTo(px, bot); g.stroke(); }   // panel seams
}
function winRect(g, e, x, y, w, h, o) {
  g.fillStyle = '#2a2420'; g.fillRect(x - 8, y - 8, w + 16, h + 16);
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#fff0c4'); gr.addColorStop(1, '#f0b878');
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  // seat backs and a hand strap silhouette inside
  g.fillStyle = rgba('#8a4a30', .55); g.fillRect(x + 20, y + h - 120, w - 40, 120);
  g.fillStyle = rgba('#5a3020', .5); for (let k = 0; k < 3; k++) g.fillRect(x + 50 + k * 110, y + 10, 4, 60);
  if (o.lit !== 0) { e.fillStyle = rgba('#ffc878', .55); e.fillRect(x, y, w, h); }
  g.fillStyle = rgba('#ffffff', .18); g.beginPath(); g.moveTo(x + 30, y); g.lineTo(x + 110, y); g.lineTo(x + 20, y + h); g.lineTo(x - 60 < x ? x : x, y + h); g.fill();
}
function door(g, e, cx, open, o) {
  const w = 480, top = -760;
  // doorway interior (warm) behind the leaves
  const gr = g.createLinearGradient(0, top, 0, 0); gr.addColorStop(0, '#ffe8b8'); gr.addColorStop(1, '#d89a68');
  g.fillStyle = gr; g.fillRect(cx - w / 2, top, w, -top);
  e.fillStyle = rgba('#ffc878', .6 * (o.lit ?? 1)); e.fillRect(cx - w / 2, top, w, -top);
  g.fillStyle = '#5a4a3c'; g.fillRect(cx - w / 2, -20, w, 20);                  // threshold
  const lw = w / 2, sl = open * lw * .95;
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? cx - lw - sl : cx + sl;
    g.fillStyle = '#e6e0d2'; g.fillRect(x0, top, lw, -top);
    g.fillStyle = '#2a2420'; g.fillRect(x0 + 40, top + 120, lw - 80, 280);
    g.fillStyle = '#f2c88a'; g.fillRect(x0 + 46, top + 126, lw - 92, 268); e.fillStyle = rgba('#ffc878', .4); e.fillRect(x0 + 46, top + 126, lw - 92, 268);
    g.fillStyle = '#1f8a8a'; g.fillRect(x0, -250, lw, 34);
    g.strokeStyle = '#4a463c'; g.lineWidth = 4; g.strokeRect(x0, top, lw, -top);
  }
  // door frame (in front of everything inside the doorway)
  g.strokeStyle = '#3a3630'; g.lineWidth = 10; g.strokeRect(cx - w / 2 - 6, top - 6, w + 12, -top + 6);
}

// the platform at night: canopy with fluorescents, columns, tactile strip, wet floor. Ground y = 1000 at the figure.
export function platformPlate(w = 5200) {
  const P = plate(w, 1080), { g, e } = P;
  vgrad(g, 0, 0, w, 1080, [[0, '#120e22'], [1, '#1a1630']]);
  g.fillStyle = '#0c0a18'; g.fillRect(0, 0, w, 90);
  for (let x = 80; x < w; x += 360) { g.fillStyle = '#eaf8ff'; g.fillRect(x, 92, 200, 8); e.fillStyle = rgba('#eaf8ff', .95); e.fillRect(x, 92, 200, 8); air(g, x + 100, 110, 220, 50, '#d8f0ff', .15, 1); }
  // floor
  vgrad(g, 0, 990, w, 90, [[0, '#2e2c44'], [1, '#1c1a2e']]);
  g.fillStyle = '#e8c23a'; g.fillRect(0, 1000, w, 10);                            // tactile edge strip (yellow)
  for (let x = 0; x < w; x += 18) { g.fillStyle = rgba('#7a6420', .7); g.fillRect(x, 1002, 8, 6); }
  return P;
}

// interior of the car: warm, cross seats; window wall behind with the city sliding past (drawn by the shot)
export function interiorPlate() {
  const P = plate(1920, 1080), { g, e } = P;
  vgrad(g, 0, 0, 1920, 1080, [[0, '#f2d4a0'], [.5, '#e0b27a'], [1, '#7a4a34']]);
  g.fillStyle = '#fff2d0'; g.fillRect(0, 40, 1920, 26); e.fillStyle = rgba('#fff2d0', .9); e.fillRect(0, 40, 1920, 26);   // ceiling light strip
  g.fillStyle = '#c89a68'; g.fillRect(0, 66, 1920, 70);
  for (let k = 0; k < 9; k++) { g.fillStyle = '#9a6a48'; g.fillRect(90 + k * 220, 136, 6, 90); g.fillStyle = '#f4e8d0'; g.beginPath(); g.ellipse(93 + k * 220, 240, 20, 26, 0, 0, 7); g.fill(); g.strokeStyle = '#7a5038'; g.lineWidth = 5; g.stroke(); }  // hand straps
  // window band (cut out later by the shot: we draw the window frames here, the city goes behind)
  return P;
}

// city at night for the last shot: rain has stopped, the sky clears; a viaduct crosses the lower third
export function cityPlate() {
  const w = 2600, h = 1500, P = plate(w, h), { g, e } = P, r = mulberry(91);
  vgrad(g, 0, 0, w, h, [[0, '#06051a'], [.45, '#1a1446'], [.8, '#5a2a5a'], [1, '#2a1636']]);
  for (let k = 0; k < 240; k++) { const x = r() * w, y = r() * 700, a = r(); g.fillStyle = rgba('#ffffff', .25 + a * .6); g.fillRect(x, y, a > .9 ? 3 : 2, a > .9 ? 3 : 2); if (a > .85) { e.fillStyle = rgba('#ffffff', .6); e.fillRect(x - 1, y - 1, 4, 4); } }
  clouds(g, w, 300, 700, 33, '#2a2050', '#9a4a7a', 30);
  let x = -40; while (x < w) { const bw = 80 + r() * 200, bh = 260 + r() * 640; building(P, { x, y: 1200 - bh, w: bw, h: bh + 300, col: mix('#1a1434', '#000000', r() * .3), top: '#100c22', seed: 2000 + x | 0, edge: rgba('#ff6fbf', .2), win: { w: 7, h: 10, gx: 15, gy: 21, mx: 8, my: 10, lit: .35, cols: WIN, glow: .5 } }); x += bw + 4; }
  air(g, w / 2, 1180, w * .8, 200, '#ff6fa8', .2, 1);
  // viaduct: deck + arches
  g.fillStyle = '#0c0a16'; g.fillRect(0, 1150, w, 34);
  for (let ax = 0; ax < w; ax += 200) { g.fillStyle = '#0c0a16'; g.fillRect(ax, 1184, 30, 316); g.beginPath(); g.arc(ax + 115, 1260, 85, Math.PI, 0); g.lineTo(ax + 200, 1184); g.lineTo(ax + 30, 1184); g.fill(); }
  // river below reflecting the city
  const refl = reflection(P.c, 700, 450, 260, { blur: 4, streak: 9, dark0: .3, dark1: .8, seed: 2 });
  g.globalAlpha = .7; g.drawImage(refl, 0, 1240); g.globalAlpha = 1;
  const reflE = reflection(P.ec, 700, 450, 260, { blur: 6, streak: 9, dark0: .2, dark1: .7, seed: 2 }); e.globalAlpha = .5; e.drawImage(reflE, 0, 1240); e.globalAlpha = 1;
  return P;
}
