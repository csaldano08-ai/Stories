// 002 · 1930s Rubber Hose — the first 10 s of Last Train Home as a 1930s sound cartoon (greyscale, 4:3 gate, worn print).
import { W, H, canvas, path, TAU } from './shared/lib/cel.js';
import { celGroup } from './shared/lib/celgroup.js';
import { clamp, lerp, seg, ss, hash, vnoise, mulberry } from './shared/lib/util.js';
import { DUR, FPS, shotAt, T, CADENCE, FIRST_STEP } from './shared/clip10.js';
import { G, drawRH, runPose, setBoil, glove, pieEye } from './rh.js';

const GW = 1440, GH = 1080, GX = (W - GW) / 2;                       // 4:3 gate inside the 16:9 frame
const out = document.getElementById('c').getContext('2d', { willReadFrequently: true });
const [sc, g] = canvas(GW, GH);
const BPM = 96, BEAT = 60 / BPM, beats = t => t / BEAT;
const breathe = (t, amp = .06) => 1 + amp * Math.cos(2 * Math.PI * beats(Math.floor(t * 15) / 15));   // sampled on twos
const STEP = 1 / CADENCE;

// ——— watercolour painting helpers (painted ONCE into cached canvases at 1.3×) ———
const grey = v => `rgb(${v},${v - 2},${v - 5})`;
function wash(c, x, y, w, h, v, seed, edge = true) {
  const r = mulberry(seed);
  c.fillStyle = grey(v); c.fillRect(x, y, w, h);
  for (let i = 0; i < Math.max(4, w * h / 9000); i++) { const bx = x + r() * w, by = y + r() * h, rr = 20 + r() * Math.min(w, h) * .4, dv = (r() - .5) * 22;
    const gr = c.createRadialGradient(bx, by, 0, bx, by, rr); gr.addColorStop(0, `rgba(${dv > 0 ? 255 : 0},${dv > 0 ? 250 : 0},${dv > 0 ? 240 : 0},${Math.abs(dv) / 160})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(bx - rr, by - rr, rr * 2, rr * 2); }
  if (edge) { c.save(); c.strokeStyle = 'rgba(30,26,22,.22)'; c.lineWidth = 7; c.filter = 'blur(3px)'; c.strokeRect(x + 3, y + 3, w - 6, h - 6); c.restore(); c.filter = 'none';
    c.strokeStyle = 'rgba(40,36,32,.55)'; c.lineWidth = 1.5; c.strokeRect(x, y, w, h); }
}
function grain(c, w, h, seed) { const r = mulberry(seed); for (let i = 0; i < w * h / 260; i++) { c.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,250,240'},${.04 + r() * .05})`; c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }
function brickFacade(c, x, y, w, h, seed, v) {
  wash(c, x, y, w, h, v, seed);
  const r = mulberry(seed + 9); c.strokeStyle = 'rgba(30,26,22,.16)'; c.lineWidth = 1;
  for (let yy = y + 14; yy < y + h; yy += 14) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); for (let xx = x + ((yy / 14) % 2) * 18; xx < x + w; xx += 36) { c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy - 14); c.stroke(); } }
  for (let wy = y + 50; wy < y + h - 260; wy += 150) for (let wx = x + 40; wx < x + w - 90; wx += 130) {
    const lit = r() < .45; wash(c, wx, wy, 70, 96, lit ? 196 : 58, seed + wx + wy, true);
    c.strokeStyle = 'rgba(25,22,20,.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(wx + 35, wy); c.lineTo(wx + 35, wy + 96); c.moveTo(wx, wy + 48); c.lineTo(wx + 70, wy + 48); c.stroke();
    if (lit) { c.fillStyle = 'rgba(240,235,220,.25)'; c.beginPath(); c.ellipse(wx + 35, wy + 48, 80, 70, 0, 0, TAU); c.fill(); }
  }
  // shop front at street level: an awning with stripes, a window with a hanging sign shape
  const sy = y + h - 250; wash(c, x + 30, sy + 60, w - 60, 170, 188, seed + 3);
  for (let k = 0; k < 10; k++) { c.fillStyle = k % 2 ? grey(96) : grey(206); c.beginPath(); const ax = x + 20 + k * (w - 40) / 10; c.moveTo(ax, sy); c.lineTo(ax + (w - 40) / 10, sy); c.lineTo(ax + (w - 40) / 10 + 8, sy + 50); c.lineTo(ax + 8, sy + 50); c.fill(); }
  c.strokeStyle = 'rgba(25,22,20,.8)'; c.lineWidth = 2; c.strokeRect(x + 20, sy, w - 40, 50);
}
function streetPlate() {   // long plate for the trucking pan; ground line (back of the pavement) at y = 830
  const w = 5200, [c, x] = canvas(w, GH);
  wash(x, 0, 0, w, GH, 62, 1, false);
  const r = mulberry(4);
  for (let k = 0; k < 40; k++) { const cx = r() * w, cy = 40 + r() * 160; x.fillStyle = 'rgba(120,114,108,.18)'; x.beginPath(); x.ellipse(cx, cy, 160 + r() * 200, 40 + r() * 40, 0, 0, TAU); x.fill(); }   // rain clouds
  let bx = 0, i = 0; while (bx < w) { const bw = 420 + r() * 260, top = 70 + r() * 160; brickFacade(x, bx, top, bw, 830 - top, 50 + i, i % 2 ? 128 : 112); bx += bw; i++; }
  wash(x, 0, 830, w, 250, 150, 7, false);                                                     // pavement
  for (let k = 0; k < 30; k++) { x.fillStyle = 'rgba(70,64,60,.35)'; x.beginPath(); x.ellipse(r() * w, 880 + r() * 170, 60 + r() * 90, 10 + r() * 10, 0, 0, TAU); x.fill(); }   // puddles
  x.strokeStyle = 'rgba(40,36,32,.4)'; x.lineWidth = 2; for (let yy = 860; yy < GH; yy += 60) { x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy); x.stroke(); }
  grain(x, w, GH, 5); return c;
}
function closePlate() {    // S1: pavement close to the ground, kerb, a lamp's reflection in the puddle
  const [c, x] = canvas(GW * 1.3, GH);
  wash(x, 0, 0, GW * 1.3, 560, 70, 11, false);
  brickFacade(x, -40, 40, 900, 520, 12, 120); brickFacade(x, 860, 0, 1100, 560, 13, 104);
  wash(x, 0, 560, GW * 1.3, 520, 148, 14, false);
  x.fillStyle = grey(52); x.beginPath(); x.ellipse(820, 860, 520, 120, 0, 0, TAU); x.fill();                                 // the puddle
  x.fillStyle = 'rgba(230,225,210,.55)'; x.beginPath(); x.ellipse(700, 860, 40, 90, 0, 0, TAU); x.fill();                   // lamp reflection
  grain(x, GW * 1.3, GH, 15); return c;
}
function skyPlate() {      // S4: rain clouds over the station clock tower
  const [c, x] = canvas(GW, GH * 1.6); wash(x, 0, 0, GW, GH * 1.6, 70, 21, false);
  const r = mulberry(22); for (let k = 0; k < 40; k++) { x.fillStyle = `rgba(${r() < .5 ? '140,134,126' : '40,36,32'},.22)`; x.beginPath(); x.ellipse(r() * GW, 80 + r() * 900, 200 + r() * 260, 50 + r() * 60, 0, 0, TAU); x.fill(); }
  grain(x, GW, GH * 1.6, 23); return c;
}
const PL = { street: streetPlate(), close: closePlate(), sky: skyPlate() };

// ——— breathing props (inked, on twos, anchored at the base) ———
function lampPost(c, x, y, s, t, face) {
  c.save(); c.translate(x, y); c.scale(s, s * breathe(t)); c.translate(0, 0);
  celGroup(c, [path([[-7, 0], [-5, -330], [5, -330], [7, 0]].map(p => [p[0], p[1], 1])), path([[-26, -326], [26, -326], [18, -370], [-18, -370]])], { f: grey(40), s: grey(26), l: G.ink }, { sh: [-4, -4] }, { lw: 3 / s });
  c.fillStyle = 'rgba(245,240,225,.95)'; c.beginPath(); c.ellipse(0, -344, 16, 18, 0, 0, TAU); c.fill();
  c.restore();
}
function hydrant(c, x, y, s, t, look = 0, squint = 0) {
  c.save(); c.translate(x, y); c.scale(s * (2 - breathe(t)), s * breathe(t));
  celGroup(c, [path([[-30, 0], [-28, -90], [-36, -96], [-30, -120], [0, -142], [30, -120], [36, -96], [28, -90], [30, 0]]), path([[-48, -84], [-30, -84], [-30, -66], [-48, -66]]), path([[48, -84], [30, -84], [30, -66], [48, -66]])], { f: grey(150), s: grey(112), l: G.ink }, { sh: [-5, -5] }, { lw: 3 / s });
  pieEye(c, -10, -104, 7, 10, [look, 0], squint, 2.4 / s); pieEye(c, 10, -104, 7, 10, [look, 0], squint, 2.4 / s);
  c.restore();
}
function rainInk(c, t, camX = 0, dens = 1) {
  c.save(); c.strokeStyle = 'rgba(232,228,216,.55)'; c.lineWidth = 2.4; c.beginPath();
  for (let i = 0; i < 120 * dens; i++) { const span = GH + 200, y = ((hash(i * 3.1) * span + t * 1300) % span) - 100, x = ((hash(i * 7.7) * (GW + 300) - camX * .9 + y * .25) % (GW + 300) + GW + 300) % (GW + 300) - 150; c.moveTo(x, y); c.lineTo(x - 12, y - 46); }
  c.stroke(); c.restore();
}
function inkSplash(c, u, x, y, s = 1) {   // a cartoon splash: inked droplets on arcs + a crown that squashes
  if (u < 0 || u > .7) return; const r = mulberry(7);
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (r() - .5) * 2.2, sp = (300 + r() * 280) * s, px = x + Math.cos(a) * sp * u, py = y + Math.sin(a) * sp * u + 1100 * u * u, rr = (7 + r() * 6) * s * (1 - u);
    if (py > y + 4) continue; celGroup(c, [path([[px, py - rr * 1.6], [px + rr, py], [px, py + rr], [px - rr, py]])], { f: '#e8e4dc', l: G.ink }, {}, { lw: 2.2 }); }
  if (u < .3) { const v = u / .3, w = (60 + 120 * v) * s; celGroup(c, [path([[x - w, y], [x - w * .7, y - 40 * s * (1 - v)], [x - w * .3, y - 16 * s], [x, y - 52 * s * (1 - v)], [x + w * .3, y - 16 * s], [x + w * .7, y - 40 * s * (1 - v)], [x + w, y]])], { f: '#e8e4dc', l: G.ink }, {}, { lw: 2.4 }); }
}

// ——— the run: windmill feet; ground scrolls at the foot's bottom speed so contacts don't slip ———
const RS = 1.62, FOOT_SPEED = Math.PI / STEP * 48 * 1.25;            // u/s at the bottom of the orbit
function pose(t, watch = 0) {
  const p = runPose(Math.floor(t * 15) / 15, { stepT: STEP, first: FIRST_STEP });   // drawings on twos
  if (watch > 0) {   // the watch "take": left (near) arm stretches up in a rubber arc to bring the watch to the eyes, eyes pop
    p.arms[0] = { hand: [lerp(p.arms[0].hand[0], 64, watch), lerp(p.arms[0].hand[1], -206, watch)], bend: lerp(-22, 30, watch), open: .2, ang: lerp(p.arms[0].ang, -2.6, watch) };
    p.lean = lerp(p.lean, .12, watch);
  }
  return p;
}
// ——— shots ———
function S1(t, lt) {   // close on the pavement; the hydrant watches; shoes splash into the puddle on 0.9375 s
  const cam = 120 + lt * 18; g.drawImage(PL.close, -cam, 0);
  hydrant(g, 1150 - cam * .2, 980, 1.3, t, clamp((t - .5) * 2, -1, 1) * (t > 1.6 ? -1 : 1), t > T.splash && t < T.splash + .5 ? .6 : 0);
  lampPost(g, 220 - cam, 1060, 1.9, t);
  const s = 2.6, px = 760 - cam * .2, gy = 905;
  const sp = FOOT_SPEED * s, x0 = px - sp * (T.splash - FIRST_STEP - 2 * STEP) - 40;   // she crosses at the foot speed
  const p = pose(t), X = px + (t - T.splash) * sp - 30;
  if (X > -500 && X < GW + 500) drawRH(g, { x: X, y: gy, s, ...p, eyes: { look: [1, 0] }, mouth: 'O', watch: 1 });
  void x0; inkSplash(g, t - T.splash, px, gy - 6, 1.5);
  rainInk(g, t, cam);
}
function S2(t, lt) {   // trucking pan beside the runner (medium follow: she is ~1/3 of the frame height)
  const pan = (t - 2.5) * FOOT_SPEED * RS;
  g.drawImage(PL.street, -((pan * .85) % (PL.street.width - GW)), 0);
  const w = ss(seg(t, T.watchUp - .2, T.watchUp + .1)) * (1 - ss(seg(t, T.watchDown - .05, T.watchDown + .25)));
  // breathing lamp posts pass on the pavement (parallax 1)
  for (let k = 0; k < 5; k++) { const lx = ((k * 820 + 600 - pan) % 4100 + 4100) % 4100 - 300; if (lx > -200 && lx < GW + 200) lampPost(g, lx, 1010, 1.25, t); }
  for (const k of [0, 1, 2, 3]) { const sx = 520 - 90 - k * 70; g.save(); g.strokeStyle = 'rgba(18,16,16,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(sx - 120, 760 + k * 40); g.lineTo(sx, 760 + k * 40); g.stroke(); g.restore(); }   // speed lines
  const p = pose(t, w), eyes = w > .6 ? { look: [.4, .6], wide: 1.25 } : { look: [1, 0] };
  drawRH(g, { x: 560, y: 1040, s: RS, ...p, eyes, mouth: w > .6 ? 'O' : 'smile', watch: 1, hair: [-10, -4] });
  const ph = (t - FIRST_STEP) / STEP, fr = ph - Math.floor(ph);
  if (fr < .35) inkSplash(g, fr * STEP, 560 + 8 * RS, 1038, .7);
  rainInk(g, t, pan);
}
function S3(t, lt) {   // hard cut to the watch: an object character on her gloved wrist, sweating, ticking to 11:58
  g.fillStyle = grey(72); g.fillRect(0, 0, GW, GH); wash(g, 0, 0, GW, GH, 76, 31, false);
  const bob = Math.sin((t - FIRST_STEP) / STEP * Math.PI) * 10, s = breathe(t, .04);
  g.save(); g.translate(GW / 2, GH / 2 + bob);
  celGroup(g, [path([[-760, -70], [-260, -80], [-250, 80], [-760, 90]])], G.jacket, { sh: [-5, -5] }, { lw: 4 });   // sleeve
  glove(g, 250, 30, .12, 3.1, .55, 4 / 3.1);
  g.save(); g.scale(s, 2 - s);
  celGroup(g, [path(Array.from({ length: 24 }, (_, i) => [Math.cos(i / 24 * TAU) * 230, Math.sin(i / 24 * TAU) * 230]))], G.watch, { sh: [-8, -8] }, { lw: 5 });
  celGroup(g, [path(Array.from({ length: 24 }, (_, i) => [Math.cos(i / 24 * TAU) * 196, Math.sin(i / 24 * TAU) * 196]))], { f: G.white, l: G.ink }, {}, { lw: 4 });
  g.strokeStyle = G.ink; g.lineCap = 'round';
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.lineWidth = k % 3 ? 4 : 8; g.beginPath(); g.moveTo(Math.sin(a) * 160, -Math.cos(a) * 160); g.lineTo(Math.sin(a) * 186, -Math.cos(a) * 186); g.stroke(); }
  const sec = 41 + Math.floor(t - T.watchHit), mm = 58 + sec / 60;
  pieEye(g, -62, -60, 26, 36, [Math.sin(t * 6) * .6, 0], 0, 4); pieEye(g, 62, -60, 26, 36, [Math.sin(t * 6) * .6, 0], 0, 4);   // the watch's eyes dart
  g.lineWidth = 12; g.beginPath(); g.moveTo(0, 0); const ha = (11 + mm / 60) / 12 * TAU; g.lineTo(Math.sin(ha) * 92, -Math.cos(ha) * 92); g.stroke();
  g.lineWidth = 8; g.beginPath(); g.moveTo(0, 0); const ma = mm / 60 * TAU; g.lineTo(Math.sin(ma) * 150, -Math.cos(ma) * 150); g.stroke();
  g.lineWidth = 4; g.beginPath(); g.moveTo(0, 30); g.lineTo(0, 30); g.arc(0, 70, 22, Math.PI + .3, -.3); g.stroke();   // worried mouth
  for (let k = 0; k < 3; k++) { const u = ((t * 1.6 + k / 3) % 1); g.fillStyle = '#e8e4dc'; g.strokeStyle = G.ink; g.lineWidth = 3; g.beginPath(); g.ellipse(-200 + k * 30 - u * 40, -150 + u * 120, 9, 14, 0, 0, TAU); g.fill(); g.stroke(); }   // sweat drops
  g.restore(); g.restore();
  rainInk(g, t, 0, .6);
}
function S4(t, lt) {   // tilt up over the rain clouds toward the station (begins)
  const y = 260 - lt * 220; g.drawImage(PL.sky, 0, -y);
  g.save(); g.translate(GW * .62, 1180 - y * .5); g.scale(1, breathe(t));
  celGroup(g, [path([[-80, 0], [-80, -320], [0, -380], [80, -320], [80, 0]])], { f: grey(98), s: grey(70), l: G.ink }, { sh: [-6, -6] }, { lw: 3.5 });
  celGroup(g, [path(Array.from({ length: 20 }, (_, i) => [Math.cos(i / 20 * TAU) * 52, -250 + Math.sin(i / 20 * TAU) * 52]))], { f: G.white, l: G.ink }, {}, { lw: 3.5 });
  g.restore(); rainInk(g, t, 0, 1.1);
}
const SH = { S1, S2, S3, S4 };

// ——— worn 35 mm print, composited into the 4:3 gate (deterministic per frame) ———
function film(f) {
  out.setTransform(1, 0, 0, 1, 0, 0); out.fillStyle = '#000'; out.fillRect(0, 0, W, H);
  const wx = (vnoise(f * .07) - .5) * 2.4 + (f % 97 === 0 ? 6 : 0), wy = (vnoise(f * .05 + 9) - .5) * 2.4, fl = 1 + (hash(f * .37) - .5) * .08;
  out.save(); out.beginPath(); out.roundRect(GX, 0, GW, GH, 28); out.clip();
  out.filter = `contrast(1.13) brightness(${fl.toFixed(3)}) blur(.5px)`; out.drawImage(sc, GX + wx, wy); out.filter = 'none';
  const r = mulberry(f * 13 + 1);
  for (let k = 0; k < 3; k++) if (hash(Math.floor(f / 40) * 5 + k) < .5) { const x = GX + hash(Math.floor(f / 40) * 3.3 + k) * GW + (f % 40) * .6; out.strokeStyle = `rgba(${k % 2 ? '255,250,240' : '20,18,16'},.35)`; out.lineWidth = 1.2; out.beginPath(); out.moveTo(x, 0); out.lineTo(x + 3, GH); out.stroke(); }
  for (let k = 0; k < 3 + Math.floor(r() * 6); k++) { out.fillStyle = r() < .5 ? 'rgba(15,13,12,.8)' : 'rgba(250,246,236,.7)'; out.beginPath(); out.arc(GX + r() * GW, r() * GH, 1 + r() * 2.5, 0, TAU); out.fill(); }
  if (f % 120 > 112) { out.strokeStyle = 'rgba(15,13,12,.6)'; out.lineWidth = 1.5; out.beginPath(); const hx = GX + hash(f) * GW, hy = hash(f + 3) * GH; out.moveTo(hx, hy); out.bezierCurveTo(hx + 40, hy - 30, hx + 70, hy + 50, hx + 110, hy + 10); out.stroke(); }
  const vg = out.createRadialGradient(W / 2, H / 2, GH * .35, W / 2, H / 2, GH * .85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); out.fillStyle = vg; out.fillRect(GX, 0, GW, GH);
  out.restore();
  out.strokeStyle = 'rgba(0,0,0,.6)'; out.lineWidth = 10; out.beginPath(); out.roundRect(GX + 2, 2, GW - 4, GH - 4, 28); out.stroke();
}
function render(t) {
  const f = Math.round(t * FPS); setBoil(Math.floor(t * 15) % 3);       // line boil: 3 drawings cycling on twos
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, GW, GH);
  const [t0, , id] = shotAt(t); SH[id](t, t - t0); film(f);
}
window.render = render; window.DUR = DUR; window.EV = []; render(1); window.READY = true;
