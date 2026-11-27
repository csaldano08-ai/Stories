// engine/props.js — excerpt from lemo-opuscar styles/printed-long-take/demo/props.js: carvedText() and skyTypeCanvas(), copied unchanged except two marked edits (the font; carvedText is exported)
import { mulberry } from '/core/lib.js';
import { INK, PAPER, cut } from './textures.js';

// EDIT 047: the film's serif is Newsreader (OFL, local), the library's Noto Serif SC woff2 is not shipped with the demo
export const FONT = `'Newsreader', serif`;
const font = (px) => `700 ${px}px ${FONT}`;

// letters cut into an ink ground: paper face, a hairline of ink inside each stroke edge, a few knife nicks
// EDIT 047: exported
export function carvedText(g, text, x, y, px, R, opts = {}) {
  g.font = font(px); g.textBaseline = 'alphabetic'; g.textAlign = opts.align || 'left';
  g.fillStyle = opts.col || PAPER; g.fillText(text, x, y);
  if (opts.nicks !== false) {
    const w = g.measureText(text).width, x0 = opts.align === 'center' ? x - w / 2 : opts.align === 'right' ? x - w : x;
    g.save(); g.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < w / 18; i++) { const xx = x0 + R() * w, yy = y - R() * px * .8; cut(g, xx, yy, xx + 6 + R() * 14, yy + (R() - .5) * 2, 1.6, R, INK); }
    g.restore();
  }
  return g.measureText(text).width;
}

// ------------------------------------------------------------------ plates of carved type for the sky (title, end card)
// lines: [{text, px, y}], returns the canvas and each line's box as fractions of the canvas
export function skyTypeCanvas(lines, W = 2400, H = 820) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), R = mulberry(4);
  const boxes = [];
  for (const L of lines) {
    const w = carvedText(g, L.text, L.x ?? 40, L.y, L.px, R, { nicks: true });
    boxes.push({ id: L.id, text: L.text, u0: (L.x ?? 40) / W, u1: ((L.x ?? 40) + w) / W, v0: (L.y - L.px * .92) / H, v1: (L.y + L.px * .22) / H });
  }
  return { c, boxes };
}
