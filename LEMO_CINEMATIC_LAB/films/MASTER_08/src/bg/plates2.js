// Plates for S6–S13: the station forecourt with the bench, the bench object, the clock insert.
import { plate, vgrad, air, clouds, building, neonText, lightbox, reflection, canvas, rgba, mix, mulberry, lerp } from './paint.js';
import { clockFace, ledBoard } from './plates1.js';
import { path } from '../lib/cel.js';
import { celGroup, iline } from '../lib/celgroup.js';

const WIN = ['#ffd27a', '#ffe7b0', '#9fe6ff', '#ffb36a'];
// Forecourt: plaza edge in the rain (left), station façade with lit glass doors and the stair up to the platform (right).
// Ground line (back of the paving the figure stands on) at y = 900; plate 2600 wide for small pans.
export function forecourt() {
  const W2 = 2600, P = plate(W2, 1080), { g, e } = P, r = mulberry(61);
  vgrad(g, 0, 0, W2, 1080, [[0, '#0a0820'], [.5, '#22163e'], [1, '#2c1a3c']]);
  clouds(g, W2, 20, 260, 21, '#251c48', '#7a3a70', 40);
  // city across the plaza (left half), soft
  let x = -20; while (x < 1300) { const bw = 100 + r() * 180, bh = 260 + r() * 360; building(P, { x, y: 820 - bh, w: bw, h: bh, col: '#1c1636', top: '#130f28', seed: 1200 + x | 0, win: { w: 7, h: 11, gx: 15, gy: 22, mx: 8, my: 10, lit: .3, cols: WIN, glow: .3 } }); x += bw + 8; }
  air(g, 650, 780, 900, 160, '#ff6fa8', .14, 1);
  // station façade (right): stone wall, canopy, glass doors, stair
  vgrad(g, 1300, 120, 1300, 780, [[0, '#26203c'], [1, '#1a1630']]);
  g.fillStyle = '#121022'; g.fillRect(1300, 120, 1300, 70);                                    // canopy edge
  for (let k = 0; k < 6; k++) { g.fillStyle = '#e6f6ff'; g.fillRect(1360 + k * 210, 196, 130, 7); e.fillStyle = rgba('#e6f6ff', .95); e.fillRect(1360 + k * 210, 196, 130, 7); }
  air(g, 1950, 300, 760, 160, '#d8f0ff', .12, 1);
  // glass doors (warm hall behind)
  vgrad(g, 1720, 420, 560, 480, [[0, '#fff0c8'], [1, '#ffb27a']]); vgrad(e, 1720, 420, 560, 480, [[0, rgba('#fff0c8', .55)], [1, rgba('#ffb27a', .3)]]);
  for (let k = 0; k <= 4; k++) { g.fillStyle = '#2a2440'; g.fillRect(1716 + k * 140, 420, 10, 480); }
  g.fillStyle = '#2a2440'; g.fillRect(1716, 412, 570, 14);
  for (let k = 0; k < 4; k++) { g.fillStyle = rgba('#7a4a3a', .35); g.fillRect(1760 + k * 140, 560, 60, 340); }   // door panels shadows
  // stair up to the platform (left of the doors), lit handrail
  for (let k = 0; k < 14; k++) { const sy = 900 - k * 34, sx = 1380 + k * 18; g.fillStyle = k % 2 ? '#2e2846' : '#262040'; g.fillRect(sx, sy - 34, 300, 34); }
  g.strokeStyle = '#59e6ff'; g.lineWidth = 4; g.beginPath(); g.moveTo(1370, 860); g.lineTo(1640, 400); g.stroke();
  e.strokeStyle = rgba('#59e6ff', .8); e.lineWidth = 8; e.beginPath(); e.moveTo(1370, 860); e.lineTo(1640, 400); e.stroke();
  lightbox(P, 1400, 300, 300, 60, '#e8f6ff', 'PLATFORM 2  ↑', '#1b2a5a', 34);
  ledBoard(P, 1760, 330, 420, 62, ['LAST TRAIN', '23:59']);
  // vending machine glow (generic) at the far right
  vgrad(g, 2380, 560, 150, 340, [[0, '#cfe8ff'], [1, '#6aa8e8']]); vgrad(e, 2380, 560, 150, 340, [[0, rgba('#cfe8ff', .6)], [1, rgba('#6aa8e8', .3)]]);
  for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) { g.fillStyle = ['#ff5f6a', '#ffd36a', '#59e6ff'][(k + j) % 3]; g.fillRect(2396 + j * 44, 600 + k * 52, 30, 34); }
  // lamp post by the bench (left of centre)
  g.fillStyle = '#16122a'; g.fillRect(600, 330, 12, 570); air(g, 606, 330, 90, 70, '#fff0c8', .55, .5); air(e, 606, 330, 80, 60, '#fff0c8', .9, .5);
  g.fillStyle = '#fff6dc'; g.beginPath(); g.ellipse(606, 330, 26, 14, 0, 0, 7); g.fill();
  // paving + reflections
  vgrad(g, 0, 900, W2, 180, [[0, '#1c1632'], [1, '#0e0b1a']]);
  const refl = reflection(P.c, 300, 600, 180, { blur: 3, streak: 7, dark0: .35, dark1: .85, seed: 6 });
  g.globalAlpha = .75; g.drawImage(refl, 0, 900); g.globalAlpha = 1;
  const reflE = reflection(P.ec, 300, 600, 180, { blur: 5, streak: 8, dark0: .2, dark1: .7, seed: 6 });
  e.globalAlpha = .5; e.drawImage(reflE, 0, 900); e.globalAlpha = 1;
  // canopy shadow line on the paving (dry area under it is lighter, less reflective)
  g.fillStyle = rgba('#2a2440', .5); g.fillRect(1300, 900, 1300, 180);
  return P;
}

// the bench: metal frame + wooden slats, drawn as a cel object at world scale (1 u = 1 px × s). Origin: ground, left leg.
export function drawBench(g, P, L, lw = 2.2) {
  const metal = { f: '#3a3a50', s: '#24243a', h: '#6a6a88', l: '#0c0c16' }, wood = { f: '#7a5038', s: '#4e3020', h: '#a87454', l: '#24140a' };
  celGroup(g, [path([[0, 0], [0, -150], [12, -150], [12, 0]]), path([[440, 0], [440, -150], [452, -150], [452, 0]])], metal, L, { lw });
  for (let k = 0; k < 3; k++) celGroup(g, [path([[-20, -150 - k * 16], [472, -150 - k * 16], [472, -140 - k * 16], [-20, -140 - k * 16]])], wood, L, { lw });
  celGroup(g, [path([[-6, -196], [-6, -290], [6, -290], [6, -196]]), path([[446, -196], [446, -290], [458, -290], [458, -196]])], metal, L, { lw });
  for (let k = 0; k < 3; k++) celGroup(g, [path([[-20, -212 - k * 26], [472, -212 - k * 26], [472, -198 - k * 26], [-20, -198 - k * 26]])], wood, L, { lw });
}
