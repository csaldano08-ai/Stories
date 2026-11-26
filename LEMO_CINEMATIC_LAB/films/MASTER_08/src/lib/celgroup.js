// LEMO_CINEMATIC_LAB — "union cel" renderer (original).
// One cel group = several overlapping shapes painted as ONE cel: flat fill, hard-edged shadow / highlight / rim crescents
// computed on the union through offscreen masks (no evenodd artefacts where shapes overlap), and ONE coloured outline
// around the union (stroke band minus the eroded union ⇒ inner seams vanish, so elbows/knees never read as puppet joints).
// All mask work is confined to the group's device-space bounding box (paths from cel.js path() carry .bb).
import { W, H } from './cel.js';

const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d', { willReadFrequently: true })]; };
const [mA, gA] = mk(), [mB, gB] = mk(), [mC, gC] = mk();
export const [silC, silG] = mk();          // accumulated silhouette of everything drawn as cel (to stamp the emissive canvas)

export function resetSil() { silG.setTransform(1, 0, 0, 1, 0, 0); silG.clearRect(0, 0, W, H); }
const dev = (T, v) => [T.a * v[0] + T.c * v[1], T.b * v[0] + T.d * v[1]];

function devBox(T, shapes, margin) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of shapes) {
    if (!s.bb) return [0, 0, W, H];
    const [a, b, c, d] = s.bb;
    for (const [x, y] of [[a, b], [c, b], [a, d], [c, d]]) {
      const X = T.a * x + T.c * y + T.e, Y = T.b * x + T.d * y + T.f;
      if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y;
    }
  }
  x0 = Math.max(0, Math.floor(x0 - margin)); y0 = Math.max(0, Math.floor(y0 - margin));
  x1 = Math.min(W, Math.ceil(x1 + margin)); y1 = Math.min(H, Math.ceil(y1 + margin));
  return [x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0)];
}
const reset = (x, b) => { x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(b[0], b[1], b[2], b[3]); };
const blit = (dst, src, b, dx = 0, dy = 0) => dst.drawImage(src, b[0], b[1], b[2], b[3], b[0] + dx, b[1] + dy, b[2], b[3]);

// st = {f, s, h, l, s2?}
// light = {sh:[dx,dy] offset TOWARD the light (local units) → shadow on the far side, hi:[dx,dy] offset AWAY → highlight
//          on the lit edge, rim:{c, d:[dx,dy]} thin coloured edge on the back side}
// o = {lw, xs:[Path2D] extra shadow shapes, xs2:[Path2D] deeper shadow (st.s2), xh:[Path2D] extra highlights, noLine, noRim, sil:false}
export function celGroup(g, shapes, st, light = {}, o = {}) {
  const T = g.getTransform();
  g.save(); g.fillStyle = st.f; for (const s of shapes) g.fill(s); g.restore();
  const wantS = st.s && (light.sh || o.xs?.length), wantH = st.h && (light.hi || o.xh?.length), wantR = light.rim && !o.noRim;
  if (o.noLine && !wantS && !wantH && !wantR && !(st.s2 && o.xs2?.length)) {   // flat mark: fill + silhouette only
    if (o.sil !== false) { silG.setTransform(T); silG.fillStyle = '#fff'; for (const s of shapes) silG.fill(s); silG.setTransform(1, 0, 0, 1, 0, 0); }
    return;
  }
  const sc = Math.hypot(T.a, T.b), lw = o.lw ?? 2.2;
  const offs = [light.sh, light.hi, light.rim?.d].filter(Boolean).map(v => Math.hypot(...dev(T, v)));
  const box = devBox(T, shapes, Math.max(0, ...offs) + lw * sc * 2 + 3);
  if (box[2] <= 0 || box[3] <= 0) return;
  reset(gA, box); gA.setTransform(T); gA.fillStyle = '#fff'; for (const s of shapes) gA.fill(s); gA.setTransform(1, 0, 0, 1, 0, 0);
  if (o.sil !== false) { silG.setTransform(1, 0, 0, 1, 0, 0); blit(silG, mA, box); }
  const paint = (d, col, extra) => {
    reset(gB, box);
    if (d) { const [dx, dy] = dev(T, d); blit(gB, mA, box); gB.globalCompositeOperation = 'destination-out'; blit(gB, mA, box, dx, dy); }
    if (extra && extra.length) {
      reset(gC, box); gC.setTransform(T); gC.fillStyle = '#fff'; for (const s of extra) gC.fill(s);
      gC.setTransform(1, 0, 0, 1, 0, 0); gC.globalCompositeOperation = 'destination-in'; blit(gC, mA, box);
      gB.globalCompositeOperation = 'source-over'; blit(gB, mC, box);
    }
    gB.globalCompositeOperation = 'source-in'; gB.fillStyle = col; gB.fillRect(box[0], box[1], box[2], box[3]);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); blit(g, mB, box); g.restore();
  };
  if (wantS) paint(light.sh, st.s, o.xs);
  if (st.s2 && o.xs2 && o.xs2.length) paint(null, st.s2, o.xs2);
  if (wantH) paint(light.hi ? [-light.hi[0], -light.hi[1]] : null, st.h, o.xh);
  if (wantR) paint([-light.rim.d[0], -light.rim.d[1]], light.rim.c);
  if (!o.noLine && st.l) {
    // union outline: stroke band (2·lw) minus the union eroded by lw
    const e = Math.max(0.75, lw * sc);
    reset(gB, box); gB.setTransform(T); gB.strokeStyle = st.l; gB.lineWidth = lw * 2; gB.lineJoin = 'round'; gB.lineCap = 'round';
    for (const s of shapes) gB.stroke(s);
    gB.setTransform(1, 0, 0, 1, 0, 0);
    reset(gC, box); blit(gC, mA, box); gC.globalCompositeOperation = 'destination-in';
    const k = .7071;
    for (const [ox, oy] of [[e, 0], [-e, 0], [0, e], [0, -e], [e * k, e * k], [-e * k, e * k], [e * k, -e * k], [-e * k, -e * k]]) blit(gC, mA, box, ox, oy);
    gB.globalCompositeOperation = 'destination-out'; blit(gB, mC, box);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); blit(g, mB, box); g.restore();
  }
}

// interior detail line (folds, seams, creases)
export function iline(g, P, col, lw = 1.6) {
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(P); g.restore();
}
// stamp the accumulated silhouette black into the emissive canvas (neon never glows through a cel)
export function stampSil(e) {
  e.save(); e.setTransform(1, 0, 0, 1, 0, 0); e.globalCompositeOperation = 'destination-out'; e.drawImage(silC, 0, 0); e.restore();
}
