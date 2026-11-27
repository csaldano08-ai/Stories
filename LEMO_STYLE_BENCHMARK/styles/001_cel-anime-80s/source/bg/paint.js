// Painting helpers for the background plates (painted ONCE at load, then only slid: STYLE §2 "Backgrounds").
// Every plate is a pair: colour canvas + emissive canvas (light sources only), so bloom comes from real light.
import { canvas, rgba, mix, hex } from '../shared/lib/cel.js';
import { mulberry, lerp, clamp, TAU } from '../shared/lib/util.js';

export function plate(w, h) { const [c, g] = canvas(w, h), [ec, e] = canvas(w, h); e.fillStyle = '#000'; e.fillRect(0, 0, w, h); return { w, h, c, g, ec, e }; }
export function vgrad(g, x, y, w, h, stops) { const gr = g.createLinearGradient(0, y, 0, y + h); for (const [o, c] of stops) gr.addColorStop(o, c); g.fillStyle = gr; g.fillRect(x, y, w, h); }
export function air(g, x, y, rx, ry, col, a = 1, soft = 1) {   // airbrush spot
  g.save(); g.translate(x, y); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, rgba(col, a)); gr.addColorStop(Math.max(0, 1 - soft), rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
}
// airbrushed rain-cloud band with lit underside (city glow)
export function clouds(g, w, y0, y1, seed, base, lit, n = 40) {
  const r = mulberry(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = lerp(y0, y1, r()), rx = 120 + r() * 340, ry = 30 + r() * 70;
    air(g, x, y, rx, ry, base, .55, .9);
    air(g, x + rx * .1, y + ry * .45, rx * .8, ry * .45, lit, .28, .9);
  }
}
// building facade with a window grid. o: {x, y (top), w, h, col, edge, win:{w,h,gx,gy,lit,cols}, seed, emissive e}
export function building(P, o) {
  const { g, e } = P, r = mulberry(o.seed || 1);
  const { x, y, w, h } = o;
  vgrad(g, x, y, w, h, [[0, o.top || o.col], [1, o.col]]);
  if (o.edge) { g.fillStyle = o.edge; g.fillRect(x, y, Math.max(2, w * .04), h); }   // lit edge
  const W2 = o.win; if (!W2) return;
  const cols = Math.floor((w - W2.mx * 2) / W2.gx), rows = Math.floor((h - W2.my) / W2.gy);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const wx = x + W2.mx + i * W2.gx, wy = y + W2.my + j * W2.gy;
    const lit = r() < W2.lit;
    if (lit) {
      const c = W2.cols[Math.floor(r() * W2.cols.length)], a = .55 + r() * .45;
      g.fillStyle = rgba(c, a); g.fillRect(wx, wy, W2.w, W2.h);
      g.fillStyle = rgba('#000000', .18); g.fillRect(wx, wy + W2.h * .62, W2.w, W2.h * .38);   // blind/sill shadow
      e.fillStyle = rgba(c, a * (W2.glow ?? .5)); e.fillRect(wx, wy, W2.w, W2.h);
    } else { g.fillStyle = rgba(W2.dark || '#0c0a1c', .7); g.fillRect(wx, wy, W2.w, W2.h); }
  }
}
// neon tube: stroke a path in the colour plate (white-hot core) and thickly in the emissive plate
export function neonPath(P, draw, col, wCore = 3, wGlow = 9, on = 1) {
  const { g, e } = P;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = mix(col, '#000000', .35); g.lineWidth = wCore + 4; g.beginPath(); draw(g); g.stroke();   // tube body in shadow
  g.strokeStyle = mix(col, '#ffffff', .55 * on); g.lineWidth = wCore; g.beginPath(); draw(g); g.stroke();
  g.restore();
  e.save(); e.lineCap = 'round'; e.lineJoin = 'round';
  e.strokeStyle = rgba(col, .9 * on); e.lineWidth = wGlow; e.beginPath(); draw(e); e.stroke();
  e.strokeStyle = rgba(mix(col, '#ffffff', .6), on); e.lineWidth = wCore; e.beginPath(); draw(e); e.stroke();
  e.restore();
}
// neon lettering (generic words only)
export function neonText(P, txt, x, y, size, col, font = '700', on = 1) {
  const { g, e } = P;
  for (const [ctx, isE] of [[g, 0], [e, 1]]) {
    ctx.save(); ctx.font = `${font} ${size}px "Barlow SC"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    if (!isE) { ctx.strokeStyle = mix(col, '#000000', .45); ctx.lineWidth = size * .14; ctx.strokeText(txt, x, y); ctx.fillStyle = mix(col, '#ffffff', .6 * on); ctx.fillText(txt, x, y); }
    else { ctx.strokeStyle = rgba(col, .95 * on); ctx.lineWidth = size * .16; ctx.strokeText(txt, x, y); ctx.fillStyle = rgba(mix(col, '#ffffff', .5), on); ctx.fillText(txt, x, y); }
    ctx.restore();
  }
}
// light box sign (backlit panel)
export function lightbox(P, x, y, w, h, bg, txt, tcol, size) {
  const { g, e } = P;
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  e.fillStyle = rgba(bg, .55); e.fillRect(x, y, w, h);
  g.strokeStyle = rgba('#000000', .5); g.lineWidth = 3; g.strokeRect(x, y, w, h);
  if (txt) { for (const c of [g, e]) { c.save(); c.font = `700 ${size}px "Barlow SC"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = c === g ? tcol : rgba(tcol, .5); c.fillText(txt, x + w / 2, y + h / 2 + 1); c.restore(); } }
}
// horizontal motion smear for plates that slide fast (anti-strobing, STYLE §2)
export function smear(src, px = 16, steps = 8) {
  const [c, g] = canvas(src.width, src.height);
  g.globalAlpha = 1 / steps; for (let i = 0; i < steps; i++) g.drawImage(src, -px / 2 + px * i / (steps - 1), 0);
  g.globalAlpha = 1; return c;
}
// wet-ground reflection of a plate strip: flipped, vertically blurred & streaked, darkened, with ripple bands
export function reflection(src, sy, sh, outH, o = {}) {
  const [c, g] = canvas(src.width, outH);
  g.save(); g.translate(0, outH * (o.squash ?? .9)); g.scale(1, -(o.squash ?? .9) * outH / sh);
  g.filter = `blur(${o.blur ?? 3}px)`; g.drawImage(src, 0, sy, src.width, sh, 0, 0, src.width, sh); g.restore();
  g.filter = 'none';
  // vertical streaks (light smeared down the wet surface)
  const [c2, g2] = canvas(src.width, outH);
  for (let k = 0; k < 6; k++) { g2.globalAlpha = .22; g2.drawImage(c, 0, k * (o.streak ?? 7)); }
  g2.globalAlpha = 1;
  g2.globalCompositeOperation = 'source-over';
  vgrad(g2, 0, 0, src.width, outH, [[0, rgba('#05040c', o.dark0 ?? .25)], [1, rgba('#05040c', o.dark1 ?? .75)]]);
  // ripple bands
  const r = mulberry(o.seed || 7);
  g2.globalCompositeOperation = 'destination-out';
  for (let y = 0; y < outH; y += 3 + r() * 6) { g2.fillStyle = rgba('#000000', .12 + r() * .18); g2.fillRect(0, y, src.width, 1 + r() * 2); }
  g2.globalCompositeOperation = 'source-over';
  return c2;
}
export { canvas, rgba, mix, hex, mulberry, lerp, clamp, TAU };
