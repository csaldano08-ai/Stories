// engine/window_kit.js — excerpt of lemo-opuscar styles/stained-glass/demo/window.js: lozenges, vineCurl and the stone texture,
// unchanged except that stonePattern is exported. The demo's window layout and its lancet contents are not used.
import { mulberry, hash } from '/core/lib.js';
import { softPoly, brush } from './glass.js';
import { COL } from './glass.js';

export function lozenges(box, d, seed) {
  const J = (k, m) => [k * d + (hash(k * 12.9 + m * 78.2 + seed) - .5) * d * .34, m * d + (hash(k * 39.3 + m * 11.1 + seed * 3) - .5) * d * .34];
  const out = [];
  for (let b = Math.floor(box[1] / d) - 1; b <= Math.ceil(box[3] / d) + 1; b++)
    for (let a = Math.floor(box[0] / d) - 1; a <= Math.ceil(box[2] / d) + 1; a++) {
      if ((a + b) & 1) continue;
      const pts = [J(a - 1, b), J(a, b - 1), J(a + 1, b), J(a, b + 1)];
      const h = hash(a * 3.3 + b * 7.9 + seed);
      out.push({ pts, path: softPoly(pts, .12), c: [a * d, b * d], col: h < .1 ? COL.blue2 : h < .2 ? COL.deepblue : COL.cobalt, id: seed * 1000 + (a + 500) * 97 + b, curl: hash(a * 5.1 + b * 2.3 + seed) });
    }
  return out;
}

export function vineCurl(g, c, d, h) {
  const [x, y] = c, s = h > .5 ? 1 : -1, r = d * .32;
  brush(g, [[x - r * s, y + r * .6], [x - r * .2 * s, y - r * .4], [x + r * .5 * s, y - r * .2], [x + r * .35 * s, y + r * .35], [x, y + r * .15]], d * .09, { w0: .3, w1: .15, color: 'rgba(30,24,40,.42)' });
  g.fillStyle = 'rgba(30,24,40,.38)'; g.beginPath(); g.arc(x - r * s, y + r * .6, d * .06, 0, 7); g.fill();
}

let stoneTex = null;
export function stonePattern(ctx) {
  if (!stoneTex) {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const im = x.createImageData(512, 512);
    const rnd = mulberry(9);
    const N = (u, v, f) => { const X = u * f, Y = v * f; const i = Math.floor(X), j = Math.floor(Y), a = X - i, b = Y - j; const h = (p, q) => hash((p % f + f) % f * 57.1 + (q % f + f) % f * 131.7); const s = t => t * t * (3 - 2 * t);
      return (h(i, j) * (1 - s(a)) + h(i + 1, j) * s(a)) * (1 - s(b)) + (h(i, j + 1) * (1 - s(a)) + h(i + 1, j + 1) * s(a)) * s(b); };
    for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) {
      const u = i / 512, v = j / 512;
      let n = N(u, v, 4) * .45 + N(u, v, 16) * .3 + N(u, v, 64) * .17 + rnd() * .08;
      const k = (i + j * 512) * 4, val = 150 + (n - .5) * 120;
      im.data[k] = val; im.data[k + 1] = val * .96; im.data[k + 2] = val * .9; im.data[k + 3] = 255;
    }
    x.putImageData(im, 0, 0); stoneTex = c;
  }
  return ctx.createPattern(stoneTex, 'repeat');
}
