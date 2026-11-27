// 073 · Dark Tech Keynote — the first 10 s of "Last Train Home" as a software launch film (lemo-opuscar styles/dark-keynote).
// A narrative adaptation: the star is the interface of an original, unnamed running app; AKI is its live element — her pose,
// tracked joint by joint from the shared rig (constant bone lengths, a planted foot), drawn as 1 px bones and joint dots in the one
// accent (lime). Everything snaps to a 48 px grid and lands on the beat (96 bpm). A problem colour (red) exists only while the
// problem does: the wet-surface card at the splash; after the turn it never returns.
//   S1  locked close on the LIVE window: her tracked pose runs; at 0.94 s the foot lands in water — a red WET SURFACE card drops
//   S2  a pull-back keyed per bar: stat cards snap into the grid one per beat (pace, cadence, stride: facts of our model), a step
//       log spawns a row per footfall; at 6.05 s the watch is raised: the watch widget lights in the accent
//   S3  a dive into the watch widget and a match cut to the one giant number: 11:58:47 locking from glyph noise one digit per
//       sixteenth, the seconds stepping to 48 at 8.4 s
//   S4  the number collapses into a final card revealed by a sweep of light; on the chime (9.58 s) its confirmation ring pulses
// Page contract: window.render(t), DUR, READY, RIGQA.
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, mulberry, hash } from './shared/lib/util.js';

window.DUR = DUR;
const W = 1920, H = 1080, TAU = Math.PI * 2, BEAT = .625;
const g = document.getElementById('c').getContext('2d');
await Promise.all(['500 30px Inter', '600 30px Inter', '800 80px "Inter Tight"', '500 20px JBMono'].map(f => document.fonts.load(f, 'AB09')));
const C = { stage: '#07080B', s1: '#101218', s2: '#161922', s3: '#1D212C', line: 'rgba(255,255,255,.08)', top: 'rgba(255,255,255,.06)', t1: '#E8EAF0', t2: '#9AA0AE', t3: '#5E6472', acc: '#B7F34A', red: '#FF4D4D', blue: 'rgba(120,150,190,.5)' };
const bk = u => u <= 0 ? 0 : back(clamp(u), 1.3);   // (back(0) is 2e-16 in floating point: guard the zero)

// ═════════ the run (shared by every style)
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const SPL = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const X = t => RUN.pelvisAt(t)[0];
function poseAt(t) {
  const S_ = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S_.watch = w;
  if (w > 0) { const J0 = solveProfile(S_), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S_.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S_.arms.f.sh *= 1 - .45 * wm; S_.head += .26 * wm; S_.neck += .08 * wm; }
  return S_;
}

// ═════════ kit: stage, grid, surfaces, text
function stage() {
  g.fillStyle = C.stage; g.fillRect(0, 0, W, H);
  let gr = g.createRadialGradient(W / 2, 120, 0, W / 2, 120, 1100); gr.addColorStop(0, 'rgba(70,80,110,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  gr = g.createRadialGradient(1500, 760, 0, 1500, 760, 900); gr.addColorStop(0, 'rgba(120,150,255,.06)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
function grid(cam) { g.save(); g.lineWidth = 1; for (let k = -40; k < 80; k++) { const x = (k * 48 - cam.x) * cam.z + W / 2, y = (k * 48 - cam.y) * cam.z + H / 2;
  if (x > -2 && x < W + 2) { g.strokeStyle = k % 4 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.06)'; g.beginPath(); g.moveTo(Math.round(x) + .5, 0); g.lineTo(Math.round(x) + .5, H); g.stroke(); }
  if (y > -2 && y < H + 2) { g.strokeStyle = k % 4 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.06)'; g.beginPath(); g.moveTo(0, Math.round(y) + .5); g.lineTo(W, Math.round(y) + .5); g.stroke(); } } g.restore(); }
function vignette() { const gr = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.52)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
function surface(x, y, w, h, r = 18, lvl = 1, a = 1) {
  g.save(); g.globalAlpha = a; g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 40; g.shadowOffsetY = 14;
  g.fillStyle = [C.s1, C.s2, C.s3][lvl - 1]; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); g.restore();
  g.save(); g.globalAlpha = a; g.strokeStyle = C.line; g.lineWidth = 1; g.beginPath(); g.roundRect(x + .5, y + .5, w - 1, h - 1, r); g.stroke();
  g.strokeStyle = C.top; g.beginPath(); g.moveTo(x + r, y + 1.5); g.lineTo(x + w - r, y + 1.5); g.stroke(); g.restore();
}
function txt(s, x, y, size, col = C.t1, o = {}) { g.save(); g.font = `${o.w ?? 500} ${size}px ${o.f ?? 'Inter'}`; g.fillStyle = col; g.textAlign = o.al ?? 'left'; g.textBaseline = o.bl ?? 'alphabetic'; if (o.ls) g.letterSpacing = o.ls + 'px'; g.globalAlpha = o.a ?? 1; g.fillText(s, x, y); g.restore(); }
const mono = (s, x, y, size, col = C.t2, o = {}) => txt(s, x, y, size, col, { ...o, f: 'JBMono', ls: o.ls ?? 2 });
// a window: rounded, a title bar with one small glyph and a title, nothing else
function win(x, y, w, h, title, a = 1) { surface(x, y, w, h, 20, 1, a); g.save(); g.globalAlpha = a; g.strokeStyle = C.line; g.beginPath(); g.moveTo(x, y + 52.5); g.lineTo(x + w, y + 52.5); g.stroke();
  g.fillStyle = C.acc; g.beginPath(); g.arc(x + 30, y + 26, 5, 0, TAU); g.fill(); g.restore(); mono(title, x + 50, y + 34, 21, C.t2, { a }); }

// ═════════ AKI's tracked pose: 1 px bones, joint dots, in the accent; the ground hairline and the puddle as a cool zone
function pose(t, ox, oy, k, a = 1) {
  const J = solveProfile(poseAt(t)), x0 = X(t), M = p => [ox + (p[0] - x0) * k, oy + p[1] * k];
  g.save(); g.globalAlpha = a; g.strokeStyle = C.acc; g.fillStyle = C.acc; g.lineWidth = 2; g.lineCap = 'round';
  g.shadowColor = 'rgba(183,243,74,.55)'; g.shadowBlur = 14;
  const bone = (p, q, al = 1) => { g.globalAlpha = a * al; g.beginPath(); g.moveTo(...M(p)); g.lineTo(...M(q)); g.stroke(); };
  const dot = (p, r = 5, al = 1) => { g.globalAlpha = a * al; g.beginPath(); g.arc(...M(p), r, 0, TAU); g.fill(); };
  for (const kk of ['f', 'n']) { const al = kk === 'f' ? .45 : 1, l = J.leg[kk], ar = J.arm[kk];
    bone(l.hip, l.knee, al); bone(l.knee, l.ankle, al); bone(l.ankle, l.ball, al); bone(ar.sh, ar.el, al); bone(ar.el, ar.wr, al);
    for (const p of [l.knee, l.ankle, l.ball, ar.el, ar.wr]) dot(p, 4.5, al); }
  bone(J.pelvis, J.waist); bone(J.waist, J.neckBase); bone(J.neckBase, J.neckTop); dot(J.pelvis, 6); dot(J.neckBase, 5);
  g.globalAlpha = a; g.beginPath(); g.arc(...M(J.headC), 40 * k, 0, TAU); g.stroke();
  g.restore();
  return { J, M };
}

// ═════════ the step log: a row per footfall (her own rhythm), spawned by rule
const STEPS = RUN.contacts.filter(c => c.t0 > 0 && c.t0 < 10);
function stepRows(t, x, y, w, rows = 7, a = 1) {
  const done = STEPS.filter(c => c.t0 <= t), list = done.slice(-rows);
  list.forEach((c, i) => { const age = t - c.t0, k = bk(seg(age, 0, .25)), yy = y + (rows - list.length + i) * 46 + (1 - k) * 20;
    g.save(); g.globalAlpha = a * (.35 + .65 * (i + 1) / list.length) * clamp(k * 2); surface(x, yy, w, 38, 10, 2, 1); g.restore();
    const n = STEPS.indexOf(c) + 1, wet = Math.abs(c.t0 - EV.splash) < .02;
    mono(String(n).padStart(2, '0'), x + 18, yy + 27, 19, C.t3, { a }); mono(`${c.t0.toFixed(2)} s`, x + 80, yy + 27, 19, C.t2, { a }); mono(c.foot === 'n' ? 'NEAR FOOT' : 'FAR FOOT', x + 230, yy + 27, 19, C.t3, { a });
    if (wet) { g.save(); g.globalAlpha = a; g.fillStyle = C.red; g.beginPath(); g.roundRect(x + w - 92, yy + 9, 74, 20, 10); g.fill(); g.restore(); mono('WET', x + w - 78, yy + 24, 13, '#fff', { a }); }
    else { g.save(); g.globalAlpha = a * .8; g.fillStyle = C.acc; g.beginPath(); g.arc(x + w - 30, yy + 19, 4, 0, TAU); g.fill(); g.restore(); } });
}
// a stat card that snaps into its grid slot on its beat
function stat(t, t0, x, y, label, value, unit, from) { const u = bk(seg(t, t0 - .2, t0)); if (u <= 0) return;
  const fx = from[0], fy = from[1], cx = lerp(fx, x, u), cy = lerp(fy, y, u); g.save(); g.globalAlpha = clamp(u * 1.4);
  surface(cx, cy, 288, 144, 16, 2); mono(label, cx + 24, cy + 42, 18, C.t3, { ls: 3 }); txt(value, cx + 24, cy + 112, 60, C.t1, { w: 800, f: '"Inter Tight"', ls: -2 }); mono(unit, cx + 26 + measure(value, 60) + 10, cy + 112, 22, C.t2);
  g.restore(); }
function measure(s, size) { g.save(); g.font = `800 ${size}px "Inter Tight"`; g.letterSpacing = '-2px'; const w = g.measureText(s).width; g.restore(); return w; }

// ═════════ shots
function liveWindow(t, x, y, w, h, a = 1) {
  win(x, y, w, h, 'LIVE · RUN', a);
  const gy = y + h - 120, k = (h - 220) / 600;
  g.save(); g.beginPath(); g.roundRect(x + 1, y + 54, w - 2, h - 55, [0, 0, 20, 20]); g.clip();
  // the ground hairline and the wet zone (a cool category code, not an accent)
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, gy + .5); g.lineTo(x + w, gy + .5); g.stroke();
  const ox = x + w * .45, px = ox + (SPL.x + 44 - X(t)) * k;
  g.fillStyle = 'rgba(120,150,190,.16)'; g.fillRect(px - 300 * k, gy - 2, 600 * k, 8); g.strokeStyle = C.blue; g.strokeRect(px - 300 * k + .5, gy - 1.5, 600 * k, 7);
  for (let i = 0; i < 40; i++) { const tx = ((i * 220 - (X(t) - X(0)) * k) % (w + 300) + w + 300) % (w + 300) + x - 150; g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(tx, gy + 22, 2, 6); }
  const P = pose(t, ox, gy, k, a);
  // the problem: the foot lands in water — a red ring at the contact
  const s = t - EV.splash; if (s > 0 && s < 1.4) { g.strokeStyle = C.red; g.lineWidth = 2; for (let j = 0; j < 2; j++) { const u = clamp((s - j * .12) / .7); if (u <= 0 || u >= 1) continue; g.globalAlpha = 1 - u; g.beginPath(); g.ellipse(px, gy, 30 + 140 * u, 6 + 20 * u, 0, 0, TAU); g.stroke(); } g.globalAlpha = 1; }
  g.restore();
  mono(`${(t).toFixed(2)} s`, x + w - 150, y + 34, 21, C.t3, { a });
  return P;
}
function S1(t) { const cam = { x: 960, y: 540, z: 1 }; grid(cam);
  liveWindow(t, 200, 110, 1520, 860);
  // the problem card drops and bounces on the splash; it stays only while the problem exists
  const u = bk(seg(t, EV.splash, EV.splash + .25)), out = ss(seg(t, 2.2, 2.5));
  if (u > 0) { const y = lerp(-220, 150, u) - out * 420; surface(1176, y, 504, 150, 18, 3); g.fillStyle = C.red; g.beginPath(); g.arc(1220, y + 56, 11, 0, TAU); g.fill(); mono('WET SURFACE', 1248, y + 64, 26, C.red, { ls: 4 });
    mono('step 03 · 0.94 s · far foot', 1210, y + 112, 21, C.t2); }
}
function S2(t) {
  // the pull-back, keyed per bar in log space: the live window shrinks to its slot, the cards arrive around it on the beat
  const z = Math.exp(lerp(0, Math.log(.62), eio(seg(t, 2.5, 3.4)))), cam = { x: 960, y: 540, z };   // the pull-back, eased in log space
  grid(cam);
  const S = (x, y) => [W / 2 + (x - 960) * z, H / 2 + (y - 540) * z], ww = 1520 * z, hh = 860 * z, [lx, ly] = S(200, 110);
  const wx = lerp(lx, 96, eio(seg(t, 2.5, 3.4))), wy = lerp(ly, 96, eio(seg(t, 2.5, 3.4)));
  const P = liveWindow(t, wx, wy, Math.max(ww, 940), Math.max(hh, 560));
  stat(t, 3.125, 1104, 96, 'PACE', '4.06', 'm/s', [1104, -200]);
  stat(t, 3.75, 1440, 96, 'CADENCE', '174', '/min', [1440, -200]);
  stat(t, 4.375, 1104, 288, 'STRIDE', '1.40', 'm', [W + 100, 288]);
  stat(t, 5.0, 1440, 288, 'HEIGHT', '1.62', 'm', [W + 100, 288]);
  // the step log, a row per footfall
  if (t > 3.6) { win(96, 696, 940, 330, 'STEP LOG', clamp((t - 3.6) / .2)); stepRows(t, 120, 760, 892, 5, clamp((t - 3.6) / .2)); }
  // the watch widget: dark until she raises the watch, then lit in the accent
  const wu = bk(seg(t, 5.4, 5.625)); if (wu > 0) { surface(1104, 480 + (1 - wu) * 40, 624, 546, 20, 2, clamp(wu * 1.5)); mono('WATCH', 1134, 530 + (1 - wu) * 40, 20, C.t3, { ls: 3 });
    const on = seg(t, EV.watchUp, EV.watchUp + .2), cx = 1416, cy = 770; g.save(); g.lineWidth = 3; g.strokeStyle = on > 0 ? C.acc : C.t3; if (on > 0) { g.shadowColor = 'rgba(183,243,74,.7)'; g.shadowBlur = 30 * on; }
    g.beginPath(); g.arc(cx, cy, 170, 0, TAU); g.stroke(); g.restore();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.strokeStyle = C.t2; g.lineWidth = i % 3 ? 1.5 : 3; g.beginPath(); g.moveTo(cx + Math.sin(a) * 150, cy - Math.cos(a) * 150); g.lineTo(cx + Math.sin(a) * (i % 3 ? 140 : 130), cy - Math.cos(a) * (i % 3 ? 140 : 130)); g.stroke(); }
    const sec = 11 * 3600 + 58 * 60 + 48 + (t - 8.4); for (const [fr, L, w, col] of [[(sec / 3600 % 12) / 12, 80, 5, C.t1], [(sec / 60 % 60) / 60, 120, 3, C.t1], [Math.floor(sec % 60) / 60, 140, 1.5, on > 0 ? C.acc : C.t2]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(fr * TAU) * L, cy - Math.cos(fr * TAU) * L); g.stroke(); }
    if (on > 0) mono('RAISED · 6.05 s', 1134, 1000, 20, C.acc, { a: on }); }
  // the dive: the camera pushes into the watch widget from 7.15 s (log zoom), the cut lands on the number
  return P;
}
const GLY = '0123456789#%&*+=?@';
// the one giant number: 11:58:47 → 48 (8.4 s) → 49 (9.4 s); with noise, each digit locks from glyph noise, one per 32nd note
function bigNum(t, x, y, size, centered, noise) {
  const sec = t >= 9.4 ? 49 : t >= 8.4 ? 48 : 47, str = `11:58:${sec}`, tick = sec === 49 ? 9.4 : sec === 48 ? 8.4 : -9;
  g.save(); g.font = `800 ${size}px "Inter Tight"`; g.letterSpacing = `${-size * .045}px`; g.textBaseline = 'middle';
  const full = g.measureText(str).width; let xx = centered ? x - full / 2 : x;
  for (let i = 0; i < str.length; i++) { const ch = str[i], lock = 7.6 + i * BEAT / 8, locked = !noise || t >= lock || ch === ':';
    const shown = locked ? ch : GLY[Math.floor(hash(i * 7 + Math.floor(t * 30)) * GLY.length)], k = noise && locked ? bk(seg(t, lock, lock + .12)) : 1;
    const isSec = i >= 6, roll = i === 7 ? bk(seg(t, tick, tick + .14)) : 1;
    g.save(); g.translate(xx, y - (1 - k) * size * .05 - (1 - roll) * size * .12); g.globalAlpha = (locked ? 1 : .35) * (i === 7 ? lerp(.2, 1, roll) : 1);
    g.fillStyle = isSec ? C.acc : C.t1; if (isSec) { g.shadowColor = 'rgba(183,243,74,.5)'; g.shadowBlur = size * .13; }
    g.fillText(shown, 0, 0); g.restore();
    xx += g.measureText(ch).width; }
  g.restore(); return full;
}
const S3Z = t => 1 + .05 * eio(seg(t, 7.5, 9.375));   // a slow push on the number: it never sits still
function S3(t) { grid({ x: 960, y: 540, z: 1 }); bigNum(t, W / 2, 540, 300 * S3Z(t), true, true); }
const CARD = { x: 400, y: 340, w: 1120, h: 400 };
function S4(t) {
  grid({ x: 960, y: 540, z: 1 });
  // the number collapses into its chip on the final card (UI collapse), the card grows out of the number's own box
  const u = eio(seg(t, 9.375, 9.56)), size = lerp(300 * S3Z(9.375), 168, u);
  g.save(); g.font = `800 ${size}px "Inter Tight"`; g.letterSpacing = `${-size * .045}px`; const full = g.measureText('11:58:48').width; g.restore();
  const nx = lerp(W / 2 - full / 2, CARD.x + 60, u), ny = lerp(540, CARD.y + 232, u);
  const bx = lerp(W / 2 - full / 2 - 40, CARD.x, u), by = lerp(540 - 190, CARD.y, u), bw = lerp(full + 80, CARD.w, u), bh = lerp(380, CARD.h, u);
  surface(bx, by, bw, bh, 28, 2, clamp(u * 1.6));
  // a soft sweep of light across the card (glint well under 20 %), clipped to it
  const sw = lerp(bx - 300, bx + bw + 300, ei(seg(t, 9.47, 9.95)));
  g.save(); g.beginPath(); g.roundRect(bx, by, bw, bh, 28); g.clip(); const gr = g.createLinearGradient(sw - 260, 0, sw + 60, 0);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.8, 'rgba(255,255,255,.10)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(sw - 260, by, 320, bh); g.restore();
  const la = clamp((u - .6) / .4);
  mono('STATION CLOCK', CARD.x + 64, CARD.y + 82, 24, C.t3, { ls: 5, a: la });
  bigNum(t, nx, ny, size, false, false);
  mono(`${120 - (t >= 9.4 ? 49 : 48)} s TO 12:00:00`, CARD.x + 64, CARD.y + CARD.h - 54, 22, C.t2, { a: la });
  // the chime: the confirmation ring pulses once, in the accent
  const rx = CARD.x + CARD.w - 150, ry = CARD.y + CARD.h / 2;
  g.save(); g.globalAlpha = la; g.strokeStyle = t >= EV.chime ? C.acc : C.t3; g.lineWidth = 3; g.beginPath(); g.arc(rx, ry, 64, 0, TAU); g.stroke(); g.restore();
  if (t >= EV.chime) { const k = seg(t, EV.chime, EV.chime + .4); g.save(); g.strokeStyle = C.acc; g.lineWidth = 3; g.shadowColor = 'rgba(183,243,74,.8)'; g.shadowBlur = 30;
    g.beginPath(); g.arc(rx, ry, 64, 0, TAU); g.stroke(); g.globalAlpha = 1 - k; g.beginPath(); g.arc(rx, ry, 64 + 110 * eo(k), 0, TAU); g.stroke(); g.globalAlpha = 1;
    const c = bk(seg(t, EV.chime, EV.chime + .18)); g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(rx - 26, ry + 2); g.lineTo(rx - 7, ry + 22); g.lineTo(lerp(rx - 7, rx + 28, c), lerp(ry + 22, ry - 20, c)); g.stroke(); g.restore();
    mono('CHIME · 9.58 s', CARD.x + CARD.w - 360, CARD.y + CARD.h - 54, 22, C.acc, { a: clamp(k * 4) }); }
}
// UI expand / collapse transitions: the frame collapses into the watch widget (7.15–7.5) and the number expands out of it
function frame(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); stage();
  if (t < 2.5) S1(t);
  else if (t < 7.5) { const push = ei(seg(t, 7.15, 7.5)); if (push > 0) { const z = Math.exp(lerp(0, Math.log(9), push)); g.save(); g.translate(1416, 770); g.scale(z, z); g.translate(-1416, -770); S2(t); g.restore(); } else S2(t); }
  else if (t < 9.375) { const ex = eo(seg(t, 7.5, 7.62)); g.save(); g.translate(W / 2, H / 2); g.scale(lerp(.2, 1, ex), lerp(.2, 1, ex)); g.translate(-W / 2, -H / 2); S3(t); g.restore(); }
  else S4(t);
  vignette();
}
window.render = t => frame(t);
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const J = solveProfile(poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.READY = true;
