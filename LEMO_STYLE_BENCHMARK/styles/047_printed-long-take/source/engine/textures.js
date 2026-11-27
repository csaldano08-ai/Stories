// engine/textures.js — excerpt from lemo-opuscar styles/printed-long-take/demo/textures.js: the palette, cut() and mistAtlas(), copied unchanged
// Canvas-drawn sprites and plates. Everything is ink, paper and one red; seeded, so every worker draws the same pixels.
import { mulberry } from '/core/lib.js';

export const INK = '#16171b', PAPER = '#ede5cd', RED = '#c4332b', YELLOW = '#dfa443';

// A short knife cut: blunt entry, tapered exit, a little wobble.
export function cut(g, x0, y0, x1, y1, w, R, col, taper = .85) {
  const n = 8, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len, wob = (R() - .5) * len * .04;
  g.fillStyle = col; g.beginPath();
  for (let i = 0; i <= n; i++) {
    const s = i / n, ww = w * (1 - s * taper) * .5, b = Math.sin(s * Math.PI) * wob;
    g.lineTo(x0 + dx * s + nx * (ww + b), y0 + dy * s + ny * (ww + b));
  }
  for (let i = n; i >= 0; i--) {
    const s = i / n, ww = w * (1 - s * taper) * .5, b = Math.sin(s * Math.PI) * wob;
    g.lineTo(x0 + dx * s - nx * (ww - b), y0 + dy * s - ny * (ww - b));
  }
  g.fill();
}

// 4 wisps, 1024×256 each, stacked: lens-shaped clusters of horizontal paper cuts.
export function mistAtlas() {
  const W = 1024, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H * 4;
  const g = c.getContext('2d');
  for (let v = 0; v < 4; v++) {
    const R = mulberry(880 + v * 29), oy = v * H;
    for (let y = 30; y < H - 30; y += 8 + R() * 8) {
      const s = (y - 30) / (H - 60), env = Math.pow(Math.sin(s * Math.PI), .7);
      const half = W * .46 * env * (.7 + R() * .3), cx = W / 2 + (R() - .5) * 120;
      let x = cx - half;
      while (x < cx + half) {
        const len = 40 + R() * 260, gap = 10 + R() * 90;
        if (R() < .7) {
          const x1 = Math.min(cx + half, x + len), wv = Math.sin(x * .01 + v) * 3;
          cut(g, x, oy + y + wv, x1, oy + y + wv + (R() - .5) * 4, 4 + R() * 8 * env, R, PAPER, .9);
        }
        x += len + gap;
      }
    }
  }
  return c;
}

