// Rain, splashes, ripples, drips, light bands — all deterministic functions of t (hash-seeded), drawn on ones (30 fps).
import { hash, clamp, lerp, TAU } from './lib/util.js';
import { W, H, rgba } from './lib/cel.js';

// Three depths of rain. o: {camX, camY (px of camera travel, for parallax), wind (slope dx/dy), density, tint, alpha,
//   near/mid/far toggles, speed, region:[x0,y0,x1,y1]}
export function rain(g, e, t, o = {}) {
  const wind = o.wind ?? .18, tint = o.tint || '#bcd2ff', A = o.alpha ?? 1, dens = o.density ?? 1;
  const layers = [
    { n: 260, len: 26, w: 1, sp: 1500, par: .25, a: .22 },
    { n: 120, len: 54, w: 1.6, sp: 2300, par: .6, a: .32 },
    { n: 26, len: 150, w: 3.2, sp: 3400, par: 1.3, a: .28 },
  ].filter((L, i) => (o.layers ?? [1, 1, 1])[i]);
  const R = o.region || [0, 0, W, H];
  g.save(); g.lineCap = 'round';
  layers.forEach((L, li) => {
    const n = Math.round(L.n * dens), sp = L.sp * (o.speed ?? 1);
    g.strokeStyle = rgba(tint, L.a * A); g.lineWidth = L.w;
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const h1 = hash(i * 7.31 + li * 101.7), h2 = hash(i * 3.17 + li * 53.1), h3 = hash(i * 1.77 + li * 9.9);
      const span = (R[3] - R[1]) + L.len * 2;
      const y = R[1] - L.len + ((h2 * span + t * sp * (.85 + .3 * h3) + (o.camY || 0) * L.par) % span + span) % span;
      const wx = (R[2] - R[0]) + 200;
      const x = R[0] - 100 + ((h1 * wx - (o.camX || 0) * L.par + y * wind) % wx + wx) % wx;
      g.moveTo(x, y); g.lineTo(x - L.len * wind, y - L.len);
    }
    g.stroke();
  });
  // a few near drops catch the light (glow layer)
  if (e && o.glints !== false) {
    e.save(); e.strokeStyle = rgba(o.glintCol || '#9fd8ff', .35 * A); e.lineWidth = 2;
    e.beginPath();
    for (let i = 0; i < 18 * dens; i++) {
      const h1 = hash(i * 9.1 + 3), h2 = hash(i * 4.7 + 8), span = H + 300;
      const y = -150 + ((h2 * span + t * 3400 + (o.camY || 0) * 1.3) % span);
      const x = ((h1 * (W + 200) - (o.camX || 0) * 1.3 + y * wind) % (W + 200) + W + 200) % (W + 200) - 100;
      e.moveTo(x, y); e.lineTo(x - 150 * wind, y - 150);
    }
    e.stroke(); e.restore();
  }
  g.restore();
}

// ground splashes + expanding ripples on a ground band (screen y0..y1, perspective scale grows with y)
export function groundRain(g, t, o = {}) {
  const [y0, y1] = o.band || [H * .7, H];
  if (!(y1 > y0 + 4)) return;
  const n = o.n ?? 70, col = o.col || '#cfe0ff', camX = o.camX || 0, par = o.par ?? 1;
  g.save();
  for (let i = 0; i < n; i++) {
    const per = .45 + hash(i * 2.3) * .5, ph = hash(i * 5.1) * per, k = Math.floor((t + ph) / per), u = ((t + ph) % per) / per;
    const hx = hash(i * 13.7 + k * 3.1), hy = hash(i * 17.3 + k * 7.7);
    const y = lerp(y0, y1, Math.pow(hy, .8)), s = Math.max(.05, lerp(.35, 1.4, (y - y0) / Math.max(1, y1 - y0)));
    const x = ((hx * (W + 400) - camX * par * s) % (W + 400) + W + 400) % (W + 400) - 200;
    // ripple
    g.strokeStyle = rgba(col, .35 * (1 - u)); g.lineWidth = 1.2 * s;
    g.beginPath(); g.ellipse(x, y, (4 + 26 * u) * s, (1.2 + 6 * u) * s, 0, 0, TAU); g.stroke();
    // crown splash in the first 15 %
    if (u < .15) {
      const v = u / .15; g.strokeStyle = rgba(col, .6 * (1 - v)); g.lineWidth = 1.4 * s; g.beginPath();
      for (let j = -2; j <= 2; j++) { g.moveTo(x + j * 2 * s, y); g.lineTo(x + j * (5 + 7 * v) * s, y - (6 + 10 * Math.sin(v * Math.PI)) * s); }
      g.stroke();
    }
  }
  g.restore();
}

// drips falling from an edge (canopy, bench) — x positions spread on [x0,x1] at height y, fall to yEnd
export function drips(g, t, o) {
  const { x0, x1, y, yEnd, n = 14, col = '#d6e6ff', scale = 1 } = o;
  g.save(); g.fillStyle = rgba(col, .75);
  for (let i = 0; i < n; i++) {
    const per = .7 + hash(i * 3.3) * .9, ph = hash(i * 8.1) * per, u = ((t + ph) % per) / per;
    const x = lerp(x0, x1, hash(i * 1.9 + .3));
    // hang (swell) for 55 %, then fall with gravity
    if (u < .55) { const r = (1 + 2.2 * u / .55) * scale; g.beginPath(); g.ellipse(x, y + r, r * .8, r, 0, 0, TAU); g.fill(); }
    else { const v = (u - .55) / .45, yy = y + (yEnd - y) * v * v; g.beginPath(); g.ellipse(x, yy, 1.6 * scale, 4.5 * scale, 0, 0, TAU); g.fill(); }
  }
  g.restore();
}

// soft light band sweeping across a region (source-atop on the cel layer) — STYLE §5 "move light, not drawings"
export function lightBand(g, x, w, ang, col, a, region) {
  g.save();
  if (region) { g.beginPath(); g.rect(...region); g.clip(); }
  g.globalCompositeOperation = 'source-atop';
  g.translate(x, H / 2); g.rotate(ang);
  const gr = g.createLinearGradient(-w, 0, w, 0);
  gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(.35, rgba(col, a)); gr.addColorStop(.65, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(-w, -H * 1.5, w * 2, H * 3);
  g.restore();
}

// anamorphic streak + star flare on the emissive canvas
export function flare(e, x, y, col, s = 1, a = 1) {
  e.save(); e.globalCompositeOperation = 'lighter';
  const gr = e.createLinearGradient(x - 320 * s, y, x + 320 * s, y);
  gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(.5, rgba(col, .55 * a)); gr.addColorStop(1, rgba(col, 0));
  e.fillStyle = gr; e.fillRect(x - 320 * s, y - 2 * s, 640 * s, 4 * s);
  const rg = e.createRadialGradient(x, y, 0, x, y, 40 * s); rg.addColorStop(0, rgba('#ffffff', .9 * a)); rg.addColorStop(.3, rgba(col, .5 * a)); rg.addColorStop(1, rgba(col, 0));
  e.fillStyle = rg; e.beginPath(); e.arc(x, y, 40 * s, 0, TAU); e.fill();
  e.restore();
}
export { clamp };
