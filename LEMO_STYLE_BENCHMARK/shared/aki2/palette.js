// Colour models (色指定) for Aki, the kitten and the driver — one hand-checked set per lighting situation.
// Base = neutral daylight design colours (model sheet). Each set multiplies lit/shade/line separately and gives skin its
// own values (multiplying skin by a night tint turns faces pink — STYLE §3, §9).
import { hex } from '../lib/cel.js';

export const BASE = {
  skin: { f: '#ffd8c2', s: '#e0a08f', h: '#fff0e6', l: '#5a2c2a' },
  hair: { f: '#3d2547', s: '#26162e', h: '#7d5c93', l: '#1d0e24' },
  eye: { f: '#7a4a2e', s: '#3d2216', h: '#d9a06a', l: '#1e0c06' },
  jacket: { f: '#e4472d', s: '#a82b22', h: '#ff8f62', l: '#5c140d' },
  lining: { f: '#8c1f2a', s: '#5e1019', h: '#b84150', l: '#3a0810' },
  sweater: { f: '#eee2cc', s: '#c0ad92', h: '#fffaf1', l: '#5b4f3f' },
  trousers: { f: '#3b3b4a', s: '#24242f', h: '#64647c', l: '#101018' },
  boots: { f: '#6b4430', s: '#45291a', h: '#a1715a', l: '#1d0f08' },
  strap: { f: '#5a3b2a', s: '#3a2418', h: '#8a6048', l: '#1a0c06' },
  gold: { f: '#d8b25c', s: '#97702c', h: '#fff0b0', l: '#4a3210' },
  // kitten: grey tabby, white chest/front paws
  fur: { f: '#9a9aa6', s: '#6a6a78', h: '#c9c9d4', l: '#2e2e3a' },
  furStripe: { f: '#5c5c6a', s: '#40404c', l: '#2e2e3a' },
  furWhite: { f: '#f2f0ee', s: '#c4c0c4', h: '#ffffff', l: '#4a4652' },
  catEye: { f: '#a8c86a', s: '#5f7e30', h: '#e8f6b0', l: '#1c2a0c' },
  catNose: { f: '#f29aa8', s: '#c06a7a', l: '#6a2a36' },
  // driver
  uniform: { f: '#2b3a66', s: '#1a2442', h: '#51679e', l: '#0b1024' },
  dskin: { f: '#f2c4a4', s: '#c98d74', h: '#ffe6d6', l: '#5a2e22' },
  dhair: { f: '#b9b6bb', s: '#86828c', h: '#e6e4ea', l: '#3e3a44' },
  glove: { f: '#f4f4f0', s: '#bcbcc6', h: '#ffffff', l: '#4a4a5a' },
  capBadge: { f: '#e6c46a', s: '#a07c30', l: '#4a3410' },
};
export const SOLO = {
  white_eye: '#fbf7f4', lash: '#1f0f1c', mouth: '#5a1a2a', tongue: '#e0707a', blush: '#ff9a9a', teeth: '#ffffff',
};

const mul = (c, m) => { const v = hex(c); return '#' + v.map((x, i) => Math.max(0, Math.min(255, Math.round(x * m[i]))).toString(16).padStart(2, '0')).join(''); };

const SETS = {
  day: { lit: [1, 1, 1], shade: [1, 1, 1], line: [1, 1, 1] },
  // rainy street under neon: cold violet ambient, magenta/cyan rims
  street: { lit: [.74, .73, .98], shade: [.5, .48, .84], line: [.82, .72, 1.05],
    skin: { f: '#e8c8c4', s: '#9d82b4', h: '#fff1f1', l: '#4a2a3e' }, blush: '#d98aa0', white_eye: '#e9e6f6' },
  // station entrance canopy: fluorescent, slightly green-white, cyan rim from the signs
  canopy: { lit: [.84, .9, .96], shade: [.56, .6, .78], line: [.85, .85, 1],
    skin: { f: '#f0d6ca', s: '#a88ca8', h: '#fff6f0', l: '#52303a' }, blush: '#e6939e', white_eye: '#f1f2f6' },
  // platform: cool canopy light + warm spill from the train windows (rim)
  platform: { lit: [.8, .82, .95], shade: [.52, .54, .8], line: [.85, .8, 1],
    skin: { f: '#ecd0c6', s: '#a2859f', h: '#fff4ec', l: '#4e2c36' }, blush: '#e48e9c', white_eye: '#eeeef6' },
  // inside the train: warm amber
  interior: { lit: [1.0, .88, .7], shade: [.7, .54, .52], line: [.9, .75, .7],
    skin: { f: '#ffd6b0', s: '#cf8a74', h: '#fff2dc', l: '#5c2c22' }, blush: '#ff9a88', white_eye: '#fff4e4' },
  // seen from outside through the glass (interior light, a touch cooler and softer)
  window: { lit: [.94, .84, .74], shade: [.62, .5, .56], line: [.85, .72, .78],
    skin: { f: '#f6cfb2', s: '#b8808a', h: '#fff0e0', l: '#55283a' }, blush: '#f09090', white_eye: '#f6eee6' },
  // silhouette against the neon (backlit) — used for far, small figures
  backlit: { lit: [.34, .26, .46], shade: [.22, .16, .34], line: [.4, .25, .5],
    skin: { f: '#5a4058', s: '#3e2a44', h: '#7a5a70', l: '#21121e' }, blush: '#5a4058', white_eye: '#7e6e8a' },
};

export function palette(name) {
  const S = SETS[name], out = {};
  for (const [k, v] of Object.entries(BASE)) {
    out[k] = {};
    for (const [kk, c] of Object.entries(v)) out[k][kk] = mul(c, kk === 's' || kk === 's2' ? S.shade : kk === 'l' ? S.line : S.lit);
  }
  for (const [k, c] of Object.entries(SOLO)) out[k] = mul(c, S.lit);
  if (S.skin) out.skin = { ...S.skin };
  if (S.blush) out.blush = S.blush;
  if (S.white_eye) out.white_eye = S.white_eye;
  out.lash = mul(SOLO.lash, [1, 1, 1]);
  // far-side limbs: one step darker (depth cue in profile)
  out.far = k => ({ f: out[k].s, s: mul(out[k].s, [.78, .76, .86]), h: out[k].f, l: out[k].l });
  // wet sweater: darker, more saturated (after the rain soaks it)
  out.wet = (k, w) => { const a = out[k]; const m = [1 - .22 * w, 1 - .24 * w, 1 - .2 * w]; return { f: mul(a.f, m), s: mul(a.s, m), h: mul(a.h, m), l: a.l }; };
  out.name = name;
  return out;
}
export const PAL = Object.fromEntries(Object.keys(SETS).map(k => [k, palette(k)]));
