// 007 · 16-bit Pixel RPG — the first 10 s of "Last Train Home" as a mid-90s console RPG (lemo-opuscar styles/pixel-rpg):
// 320×180 indexed framebuffer (ENDESGA-32 + protected indices) scaled ×6 nearest; ordered dither instead of blends;
// a rig-driven sprite with an ASCII head; game systems as narration (HUD clock, portrait box with "...!"); a mosaic
// cross into the watch close-up; integer-pixel camera; screen shake 3-2-1 on the hit. Page contract: render(t), DUR, READY, RIGQA.
import { W, H, C, T, FB, LUT, makeOut, mosaic, bayer, hash, sprFromRows } from './px.js';
import { text, textW } from './font.js';
import { win, dialog } from './ui.js';
import { drawAki16, HEADS, MAT } from './aki16.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T as EV, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { clamp, lerp, seg, ss, eio, eo, back } from './shared/lib/util.js';

const cv = document.getElementById('c'), out = makeOut(cv), fb = new FB();
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const TICK = 3 * CADENCE, tick = t => FIRST_STEP + Math.floor((t - FIRST_STEP) * TICK + 1e-6) / TICK;   // sprite drawings ≈ 8.7 fps (3 per footfall)
const SPLASH = RUN.contacts.find(c => Math.abs(c.t0 - EV.splash) < .02);
const t12 = t => Math.floor(t * 12 + 1e-6);
function poseAt(t) {
  const S = RUN.pose(t);
  const up = back(seg(t, EV.watchUp, EV.watchUp + .2), 1.3), dn = ss(seg(t, EV.watchDown - .14, EV.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn); S.watch = w;
  if (w > 0) { const J0 = solveProfile(S), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w), tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm)];
    S.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' }; S.arms.f.sh *= 1 - .45 * wm; S.head += .2 * wm; }
  return S;
}
const secAt = t => secondary(q => { const p = RUN.pelvisAt(q); return [p[0], p[1] - 250]; }, 0, t);

// ——— shared pixel pieces ———
function rain(t, camX = 0, n = 90, col = C.steel) {
  for (let i = 0; i < n; i++) { const sp = 260 + hash(i, 1) * 160, y = Math.floor(((hash(i, 2) * 220 + t * sp) % 220) - 20), x = Math.floor((((hash(i, 3) * 380 - camX * (.6 + hash(i, 4) * .5) - y * .25) % 380) + 380) % 380) - 30;
    fb.px(x, y, i % 3 ? col : C.silver); fb.px(x - 1, y - 2, col); fb.px(x - 1, y - 3, i % 2 ? col : C.slate); }
}
function glowRing(cx, cy, r, col, k = .5) {   // Bayer-thresholded glow ring (no blends)
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = Math.hypot(x, y) / r; if (d > 1 || d < .35) continue; if (bayer(cx + x, cy + y) < (1 - d) * k) fb.px(cx + x, cy + y, col); }
}
function board(x, y, word, col, sc = 1) {   // a lightbox sign: ink board, steel rim, pixel-font letters with a shadow
  const w = textW(word, sc) + 6 * sc, h = 7 * sc + 5 * sc;
  fb.rect(x, y, w, h, C.ink); fb.hline(x, x + w - 1, y, C.dslate); fb.hline(x, x + w - 1, y + h - 1, C.night);
  text(fb, word, x + 3 * sc, y + 3 * sc - (sc > 1 ? 1 : 0), col, C.night, sc);
  return w;
}
function cobbles(x0, y0, w, h, camX = 0) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const wx = x + camX, row = Math.floor((y - y0) / 4), cx = ((wx + row * 3) % 7 + 7) % 7, cy = (y - y0) % 4;
    fb.px(x, y, cx === 0 || cy === 0 ? C.ink : (hash(Math.floor((wx + row * 3) / 7), row) > .7 && cy === 1 ? C.dslate : C.night));
  }
}
function splash(u, x, y, big = 1, seed = 1) {   // droplets at 12 fps
  if (u < 0 || u > .5) return; u = Math.floor(u * 12 + 1) / 12;
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (hash(i, seed) - .5) * 2.3, sp = (38 + hash(i, seed + 7) * 40) * big, px = x + Math.cos(a) * sp * u, py = y + Math.sin(a) * sp * u + 190 * u * u * big; if (py > y) continue; fb.px(px, py, i % 3 ? C.silver : C.white); if (big > 1.2) fb.px(px + 1, py, C.silver); }
  if (u < .35) { const r = Math.round((6 + 40 * u) * big); for (let a = 0; a < 40; a++) { const an = a / 40 * Math.PI * 2; if (Math.sin(an) > .2) continue; fb.px(x + Math.cos(an) * r, y + Math.sin(an) * r * .25, C.silver); } }
}
// AKI's portrait (32×32, 3/4 view) — the face acts here, not on the one-eye sprite
function portrait(expr) {
  const p = new FB(32, 32); p.d.fill(T);
  p.rect(6, 24, 20, 8, C.scarf); p.rect(6, 24, 20, 1, C.scarfL); p.rect(13, 22, 7, 4, C.sand); p.rect(8, 27, 3, 5, C.scarfD); p.rect(22, 27, 3, 5, C.scarfD);   // coat + roll-neck
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const dx = (x - 15.5) / 9, dy = (y - 14) / 10.5; if (dx * dx + dy * dy <= 1) p.px(x, y, x > 19 && y > 12 ? C.skinS : C.skin); }   // face
  for (let y = 2; y < 24; y++) for (let x = 3; x < 29; x++) { const dx = (x - 15.5) / 12.5, dy = (y - 12) / 11; const inH = dx * dx + dy * dy <= 1;
    const face = y > 9 && x > 8 + (y < 13 ? (13 - y) * 2 : 0) && x < 25 && y < 23, bang = y <= 9 && y >= 7 && x > 10 + (9 - y) * 3 && x < 26;
    if (inH && (!face || y < 8) && !(bang && false)) p.px(x, y, (x + y) % 9 === 0 ? C.rose : y > 18 ? C.umber : C.plum); }
  for (let x = 9; x < 25; x++) { const yb = 9 + Math.round(Math.max(0, (x - 9) * .22)); for (let y = 6; y <= yb; y++) p.px(x, y, y === yb ? C.umber : C.plum); }   // side-swept bangs
  const wide = expr === 'shock';
  for (const ex of [12, 20]) { if (wide) { p.rect(ex - 2, 13, 4, 4, C.white); p.px(ex - 1 + (ex > 15 ? 1 : 0), 14, C.ink); p.px(ex - 1 + (ex > 15 ? 1 : 0), 15, C.ink); p.hline(ex - 2, ex + 1, 12, C.ink); }
    else { p.rect(ex - 2, 14, 4, 2, C.white); p.rect(ex - 1, 14, 2, 2, C.dbrown); p.hline(ex - 2, ex + 1, 13, C.ink); } }
  p.hline(10, 13, wide ? 10 : 11, C.umber); p.hline(18, 21, wide ? 10 : 11, C.umber);   // brows up when shocked
  p.px(17, 17, C.skinS); p.px(10, 18, C.pink); p.px(22, 18, C.pink);
  if (wide) { p.rect(15, 19, 3, 2, C.crimson); } else p.hline(15, 17, 20, C.crimson);
  // outline
  const src = p.d.slice(); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (src[y * 32 + x] === T && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const X = x + a, Y = y + b; return X >= 0 && Y >= 0 && X < 32 && Y < 32 && src[Y * 32 + X] !== T; })) p.d[y * 32 + x] = C.ink;
  return p;
}
const PORT = { shock: portrait('shock') };

// ——— S1 · 0–2.5 · cutscene at ground level: the puddle, the boards in it, the boots (drawings on the 8.7 fps tick) ———
const PX = 150, PY = 142;
function S1(t) {
  const tq = tick(t);
  fb.gradV(0, 0, W, 94, [C.night, C.dslate, C.dslate]);
  // two shopfronts: brick walls (dithered rows), lit windows, doors, the 24H and CAFE boards
  for (let y = 0; y < 92; y++) for (let x = 0; x < W; x++) { const left = x < 158, brick = (y % 6 === 0) || ((x + (Math.floor(y / 6) % 2) * 6) % 12 === 0);
    fb.px(x, y, brick ? C.night : left ? C.dslate : C.slate); }
  fb.rect(157, 0, 3, 92, C.ink);
  fb.gradV(10, 40, 118, 48, [C.yellow, C.amber, C.orange, C.clay]); fb.rect(9, 39, 120, 1, C.ink); fb.rect(9, 88, 120, 2, C.dbrown);
  for (let x = 10; x < 128; x += 20) fb.vline(x, 40, 87, C.dbrown);
  fb.gradV(176, 42, 124, 46, [C.white, C.pink, C.rose, C.plum]); fb.rect(175, 41, 126, 1, C.ink); fb.rect(175, 88, 126, 2, C.dbrown);
  for (let x = 176; x < 300; x += 25) fb.vline(x, 42, 87, C.dbrown);
  fb.rect(132, 34, 20, 58, C.umber); fb.rect(134, 36, 16, 56, C.dbrown); fb.px(146, 64, C.amber);
  fb.rect(302, 30, 16, 62, C.umber);
  glowRing(52, 22, 26, C.teal, .45); board(30, 12, '24H', C.cyan, 2);
  glowRing(232, 22, 30, C.plum, .45); board(204, 12, 'CAFE', C.pink, 2);
  fb.hline(0, W - 1, 92, C.steel); fb.hline(0, W - 1, 93, C.ink);
  cobbles(0, 94, W, 86);
  // the puddle (navy) with the boards upside down in it, rows wobbling at 8 fps (harder after the splash)
  const stir = t > EV.splash ? Math.exp(-(t - EV.splash) * 2.4) : 0, f8 = Math.floor(t * 8);
  const inP = (x, y) => { const dx = (x - PX) / 72, dy = (y - PY) / 15; return dx * dx + dy * dy <= 1; };
  for (let y = PY - 16; y <= PY + 16; y++) for (let x = PX - 74; x <= PX + 74; x++) if (inP(x, y)) fb.px(x, y, bayer(x, y) < .25 ? C.navy : C.night);
  const refl = new FB(W, 40); refl.d.fill(T);
  text(refl, '24H', 4, 4, C.blue, null, 2); text(refl, 'CAFE', 88, 4, C.rose, null, 2);
  for (let y = 0; y < 20; y++) { const off = Math.round(Math.sin(Math.floor(y / 2) * 1.3 + f8 * 1.7) * (.6 + 3 * stir)); for (let x = 0; x < 140; x++) { const c = refl.get(x, 19 - y); if (c === T) continue; const X = PX - 66 + x + off, Y = PY - 12 + y; if (inP(X, Y)) fb.px(X, Y, c); } }
  for (let x = PX - 60; x < PX + 60; x += 3) if (bayer(x, PY - 13) < .5) fb.px(x, PY - 13, C.blue);
  // rain rings on the water (12 fps)
  for (let i = 0; i < 6; i++) { const per = .6 + hash(i, 9) * .5, ph = ((t + hash(i, 8) * per) % per) / per, n = Math.floor((t + hash(i, 8) * per) / per), u = Math.floor(ph * 6) / 6;
    const cx = PX - 50 + Math.floor(hash(i, n) * 100), cy = PY - 8 + Math.floor(hash(i + 5, n) * 14), r = 1 + u * 8; if (u > .9) continue;
    for (let a = 0; a < 24; a++) { const an = a / 24 * Math.PI * 2, X = Math.round(cx + Math.cos(an) * r), Y = Math.round(cy + Math.sin(an) * r * .35); if (inP(X, Y)) fb.px(X, Y, C.steel); } }
  // the boots (legs only, big), on the tick; the hero splash lands in the puddle at 0.9375 s
  if (tq > .3 && tq < 1.75) { const S = poseAt(tq), J = solveProfile(S), k = .45, ox = PX - 6 + (RUN.pelvisAt(tq)[0] - SPLASH.x) * k; drawAki16(fb, J, ox, PY + 2, k, { legsOnly: true, hemB: secAt(tq).hemB }); }
  for (const c of RUN.contacts) { const sx = PX - 6 + (c.x - SPLASH.x) * .45 + 10; if (sx > -40 && sx < W + 40) splash(t - c.t0, sx, PY + 1, c === SPLASH ? 1.6 : 1.1, Math.round(c.t0 * 100)); }
  rain(t, 0, 110);
}

// ——— S2 · 2.5–7.5 · side-scroll with parallax; the HUD clock; the portrait box at the take ———
const K2 = 32 / 600, FLOOR = 131;
const SHOPS = [['24H', C.cyan], ['CAFE', C.pink], ['BAKERY', C.amber], ['BAR', C.pink], ['BOOKS', C.white], ['PHARMACY', C.lime], ['NOODLES', C.amber], ['LAUNDRY', C.cyan], ['RECORDS', C.pink], ['HOTEL', C.amber], ['FLOWERS', C.pink], ['DINER', C.cyan]];
const LAY = (() => { const o = []; let x = -40, i = 0; while (x < 1100) { const w = 76 + Math.floor(hash(i, 21) * 30); o.push({ x, w, top: 26 + Math.floor(hash(i, 22) * 26), i, wall: [C.dslate, C.slate, C.plum, C.teal][i % 4] }); x += w + 2; i++; } return o; })();
const FAR = (() => { const o = []; let x = -60, i = 0; while (x < 700) { const w = 18 + Math.floor(hash(i, 31) * 26); o.push({ x, w, top: 30 + Math.floor(hash(i, 32) * 50), i }); x += w + 1; i++; } return o; })();
function shop(Sx, camX) {
  const x = Sx.x - camX, w = Sx.w; if (x > W || x + w < 0) return;
  const top = Sx.top, wall = Sx.wall;
  for (let y = top; y < 112; y++) for (let xx = Math.max(0, x); xx < Math.min(W, x + w); xx++) { const lx = xx - x, brick = (y % 5 === 0) || ((lx + (Math.floor(y / 5) % 2) * 4) % 8 === 0); fb.px(xx, y, brick && wall !== C.teal ? C.night : wall); }
  fb.rect(x - 1, top - 3, w + 2, 3, C.ink); fb.vline(x - 1, top, 111, C.ink);
  for (let wy = top + 6, r = 0; wy < 60; wy += 14, r++) for (let wx = x + 8, c = 0; wx < x + w - 12; wx += 16, c++) { const lit = hash(Sx.i * 7 + r, c) < .55; fb.rect(wx, wy, 8, 9, C.ink); fb.rect(wx + 1, wy + 1, 6, 7, lit ? C.amber : C.night); if (lit) { fb.rect(wx + 1, wy + 1, 6, 3, C.yellow); fb.vline(wx + 4, wy + 1, wy + 7, C.dbrown); } }
  const [word, col] = SHOPS[Sx.i % SHOPS.length];
  const aw = w - 10, ay = 76, aCol = [C.pink, C.teal, C.amber, C.rose][Sx.i % 4];
  for (let xx = 0; xx < aw; xx++) for (let y = 0; y < 6; y++) fb.px(x + 5 + xx, ay + y, Math.floor(xx / 5) % 2 ? C.white : aCol);
  for (let xx = 0; xx < aw; xx += 5) fb.px(x + 7 + xx, ay + 6, Math.floor(xx / 5) % 2 ? C.white : aCol);
  fb.hline(x + 5, x + 5 + aw - 1, ay - 1, C.ink);
  fb.gradV(x + 6, 85, w - 34, 25, [C.yellow, C.amber, C.orange]); fb.rect(x + 5, 84, w - 32, 1, C.ink);
  for (let k = 0; k < 3; k++) { const gx = x + 10 + k * Math.floor((w - 40) / 3); fb.rect(gx, 98, 6, 8, [C.rust, C.dbrown, C.plum][(Sx.i + k) % 3]); }
  fb.rect(x + w - 24, 82, 14, 30, C.umber); fb.rect(x + w - 22, 84, 10, 28, C.dbrown); fb.px(x + w - 14, 98, C.amber);
  glowRing(x + Math.floor(w / 2) - 4, 70, 18, col === C.cyan ? C.teal : col === C.pink ? C.plum : C.dbrown, .35);
  const bw = textW(word) + 6; board(x + Math.floor((w - bw) / 2) - 4, 63, word, col);
}
function farB(Bf, camX) {
  const x = Bf.x - camX, w = Bf.w; if (x > W || x + w < 0) return;
  fb.rect(x, Bf.top, w, 112 - Bf.top, Bf.i % 2 ? C.night : C.ink);
  for (let wy = Bf.top + 4; wy < 104; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) if (hash(Bf.i * 13 + wx - x, wy) < .22) fb.px(wx, wy, hash(wx, wy) < .7 ? C.amber : C.tan);
}
function hudClock(t) {   // the game clock, top right; blinks red after she reads the watch
  win(fb, W - 62, 4, 58, 17);
  const alarm = t >= 6.25 && t < 7.5 && t12(t) % 2 === 0;
  text(fb, '23:58', W - 52, 9, alarm ? C.red : C.white, C.night);
  fb.px(W - 57, 11, alarm ? C.red : C.amber); fb.px(W - 56, 10, alarm ? C.red : C.amber); fb.px(W - 56, 12, alarm ? C.red : C.amber);
}
function S2(t) {
  const px = RUN.pelvisAt(t)[0] * K2, camX = Math.round(px - 118), sx = Math.round(px - camX);
  fb.gradV(0, 0, W, 112, [C.ink, C.night, C.night, C.dslate]);
  for (let i = 0; i < 40; i++) { const x = Math.floor(hash(i, 41) * W), y = Math.floor(hash(i, 42) * 50); if ((t12(t) + i) % 9 !== 0) fb.px(x, y, i % 4 ? C.steel : C.white); }
  const camF = Math.round(camX * .3); for (const Bf of FAR) farB(Bf, camF);
  const camM = Math.round(camX * .85); for (const Sx of LAY) shop(Sx, camM);
  fb.hline(0, W - 1, 112, C.steel); fb.rect(0, 113, W, 1, C.ink);
  cobbles(0, 114, W, 66, camX);
  for (let k = 0; k < 8; k++) { const x = k * 70 + 30 - (camX % 560 + 560) % 560; const pxx = ((x % 560) + 560) % 560 - 60; for (let y = 140; y < 146; y++) for (let xx = pxx; xx < pxx + 34; xx++) { const dx = (xx - pxx - 17) / 17, dy = (y - 143) / 3; if (dx * dx + dy * dy <= 1) fb.px(xx, y, bayer(xx, y) < .3 ? C.navy : C.night); } }
  fb.hline(0, W - 1, 152, C.steel);
  // AKI (drawn every output frame: the camera tracks, so a held drawing would slide its planted foot)
  const S = poseAt(t), J = solveProfile(S), w = Math.min(1, S.watch || 0), take = t >= 6.45 && t < 7.4;
  const blink = [3.55, 5.2].some(b => t >= b && t < b + 2 / 12);
  drawAki16(fb, J, sx, FLOOR, K2, { watch: w, head: take ? 'take' : blink ? 'blink' : w > .4 ? 'look' : 'run', hemB: secAt(t).hemB, hairLag: secAt(t).hair.back });
  for (const c of RUN.contacts) splash(t - c.t0, Math.round(c.x * K2 - camX) + 2, FLOOR - 1, .7, Math.round(c.t0 * 100));
  // foreground lamp posts (parallax 1.5), lamp heads with a Bayer glow
  const camL = Math.round(camX * 1.5); for (let k = 0; k < 6; k++) { const x = k * 210 + 160 - camL; if (x < -20 || x > W + 20) continue; glowRing(x + 4, 34, 22, C.amber, .4); fb.rect(x, 36, 4, 144, C.ink); fb.rect(x + 1, 36, 1, 144, C.dslate); fb.rect(x - 2, 28, 12, 7, C.ink); fb.rect(x - 1, 29, 10, 5, C.yellow); }
  rain(t, camX, 100);
  hudClock(t);
  if (take) dialog(fb, { portrait: PORT.shock, text: '...!', t: t - 6.45, cps: 9 });
}

// ——— S3 · 7.5–9.375 · close-up of the watch (cutscene), screen shake 3-2-1 on the hit ———
function S3(t, lt) {
  fb.gradV(0, 0, W, H, [C.ink, C.night, C.night, C.dslate]);
  const lights = [C.amber, C.pink, C.cyan, C.yellow, C.rose];
  for (let k = 0; k < 30; k++) { const y = Math.floor(hash(k, 61) * 176), sp = 160 + hash(k, 62) * 260, len = 16 + Math.floor(hash(k, 63) * 50), x = Math.floor(((hash(k, 64) * 520 - t * sp) % 520 + 520) % 520) - 100; fb.rect(x, y, len, 2, lights[k % 5]); fb.rect(x + len, y, 6, 2, C.dslate); }
  const bob = (Math.floor((tick(t) - FIRST_STEP) * TICK) % 3) - 1;
  const A = (u, v) => [160 + u - v * .1, 98 + v + u * .1 + bob];
  const poly = (pts, f) => { const ys = pts.map(p => p[1]); for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) { const xs = []; for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y + .5 && by > y + .5) || (by <= y + .5 && ay > y + .5)) xs.push(ax + (y + .5 - ay) / (by - ay) * (bx - ax)); } xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) fb.px(x, y, f(x, y)); } };
  // sleeve (protected red, dithered folds), cuff, skin forearm, fist
  poly([A(-200, -40), A(-70, -38), A(-70, 38), A(-200, 44)], (x, y) => { const v = (y - 60) / 80; return v < .15 ? C.scarfL : v > .7 ? C.scarfD : (bayer(x, y) < .2 && (x + y) % 13 < 2 ? C.scarfD : C.scarf); });
  poly([A(-76, -42), A(-60, -42), A(-60, 42), A(-76, 42)], () => C.scarfD);
  poly([A(-62, -28), A(80, -24), A(80, 24), A(-62, 30)], (x, y) => { const v = (y - 70) / 56; return v < .2 ? C.sand : v > .72 ? C.skinS : C.skin; });
  for (let y = -26; y <= 26; y++) for (let x = -30; x <= 30; x++) { const dx = x / 30, dy = y / 26; if (dx * dx + dy * dy > 1) continue; const p = A(104 + x, y).map(Math.round); fb.px(p[0], p[1], dy < -.4 ? C.sand : dy > .45 || dx > .6 ? C.skinS : C.skin); }
  for (const k of [-12, 0, 12]) { const p = A(124, k).map(Math.round); fb.hline(p[0] - 4, p[0], p[1], C.skinS); }
  // strap, gold case, dial, hands at 11:58, second hand stepping once a second
  poly([A(-28, -32), A(28, -32), A(28, 32), A(-28, 32)], (x, y) => ((x + y) % 4 ? C.dbrown : C.umber));
  const c = A(0, 0).map(Math.round);
  for (let y = -42; y <= 42; y++) for (let x = -42; x <= 42; x++) { const d = Math.hypot(x, y); if (d > 42) continue; const l = (-x - y) / 60;
    fb.px(c[0] + x, c[1] + y, d > 35 ? (l > .25 ? C.yellow : l < -.25 ? C.orange : C.amber) : d > 33 ? C.dbrown : (bayer(c[0] + x, c[1] + y) < .15 + (y / 70) ? C.tan : C.sand)); }
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, r0 = k % 3 ? 27 : 23; for (let r = r0; r <= 31; r++) fb.px(c[0] + Math.sin(a) * r, c[1] - Math.cos(a) * r, C.ink); }
  text(fb, '12', c[0] - 5, c[1] - 20, C.ink); text(fb, '3', c[0] + 16, c[1] - 3, C.ink); text(fb, '6', c[0] - 2, c[1] + 13, C.ink); text(fb, '9', c[0] - 20, c[1] - 3, C.ink);
  const sec = 41 + Math.floor(t - EV.watchHit), mm = 58 + sec / 60, hand = (a, len, col, w = 1) => { for (let r = 0; r <= len; r += .5) { const x = c[0] + Math.sin(a) * r, y = c[1] - Math.cos(a) * r; fb.px(x, y, col); if (w > 1) fb.px(x + 1, y, col); } };
  hand((11 + mm / 60) / 12 * Math.PI * 2, 15, C.ink, 2); hand(mm / 60 * Math.PI * 2, 24, C.ink, 2); hand(sec / 60 * Math.PI * 2, 28, C.red);
  fb.rect(c[0] - 1, c[1] - 1, 3, 3, C.red);
  for (const [u, v] of [[-18, -22], [-16, -24], [-14, -22], [-20, -20]]) fb.px(c[0] + u, c[1] + v, C.white);
  for (let k = 0; k < 4; k++) { const x = c[0] - 20 + Math.floor(hash(k, 71) * 40), y = c[1] - 10 + Math.floor(hash(k, 72) * 26) + Math.floor((t * 6 + k) % 6); fb.rect(x, y, 2, 3, C.silver); fb.px(x, y, C.white); }
  rain(t, t * 40, 60);
}

// ——— S4 · 9.375–10 · integer-pixel tilt down from the night sky to the station clock; the clock chimes ———
function S4(t, lt) {
  const o = Math.round(48 * Math.pow(seg(lt, 0, .625), 2));   // the stand tilts down: the world rises by o px (integer)
  fb.gradV(0, 0, W, H, [C.ink, C.ink, C.night, C.night, C.dslate]);
  for (let i = 0; i < 70; i++) { const x = Math.floor(hash(i, 81) * W), y = Math.floor(hash(i, 82) * 130) - Math.round(o * .3); if ((t12(t) + i) % 7 !== 0) fb.px(x, y, i % 5 ? C.steel : C.white); }
  for (let k = 0; k < 6; k++) { const x0 = Math.floor(((hash(k, 83) * 420 + t * 8) % 420)) - 60, y0 = 16 + Math.floor(hash(k, 84) * 70) - Math.round(o * .5), w = 60 + Math.floor(hash(k, 85) * 60);
    for (let y = 0; y < 14; y++) for (let x = 0; x < w; x++) { const dx = (x - w / 2) / (w / 2), dy = (y - 7) / 7; if (dx * dx + dy * dy > 1) continue; fb.px(x0 + x, y0 + y, bayer(x0 + x, y0 + y) < .5 - dy * .4 ? C.dslate : C.night); } }
  for (let i = 0; i < 16; i++) { const x = -10 + i * 22 + Math.floor(hash(i, 86) * 8), w = 16 + Math.floor(hash(i, 87) * 12), top = 136 + Math.floor(hash(i, 88) * 26) - o;
    fb.rect(x, top, w, 200, i % 2 ? C.night : C.ink); fb.hline(x, x + w - 1, top, C.dslate); for (let wy = top + 4; wy < H; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) if (hash(i * 7 + wx, wy) < .25) fb.px(wx, wy, C.amber); }
  // the station tower and its clock: the face cycles its palette on the chime (amber → yellow → white → yellow)
  const tx = 214, ty = 104 - o;
  fb.rect(tx - 12, ty, 24, 200, C.dslate); fb.rect(tx - 12, ty, 2, 200, C.slate); fb.rect(tx + 8, ty, 4, 200, C.night);
  for (let y = 0; y < 14; y++) { fb.hline(tx - 13 + y, tx + 12 - y, 104 - o - 14 + (13 - y), C.slate); fb.px(tx - 13 + y, 104 - o - 1 - y, C.ink); fb.px(tx + 12 - y, 104 - o - 1 - y, C.ink); }
  const u = t - EV.chime, cyc = u >= 0 && u < .4 ? [C.yellow, C.white, C.yellow, C.amber][Math.floor(u * 12) % 4] : C.amber;
  glowRing(tx, ty + 12, u >= 0 && u < .5 ? 22 : 16, cyc, .5);
  fb.disc(tx, ty + 12, 8, C.ink); fb.disc(tx, ty + 12, 7, cyc); fb.vline(tx, ty + 6, ty + 12, C.ink); fb.line(tx, ty + 12, tx - 3, ty + 8, C.ink);
  rain(t, 0, 100);
}

const SH = { S1, S2, S3, S4 };
window.DUR = DUR;
window.render = t => {
  const [t0, , id] = shotAt(t);
  fb.clip = [0, 0, W, H]; fb.clear(C.ink);
  // screen shake 3-2-1 px over 8 frames on the watch hit
  let shake = 0; if (id === 'S3' && t - t0 < 8 / 30) shake = [3, -3, 2, -2, 1, -1, 1, 0][Math.floor((t - t0) * 30)] || 0;
  SH[id](t, t - t0);
  if (shake) { const s = fb.d.slice(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const X = x - shake; fb.d[y * W + x] = s[y * W + Math.max(0, Math.min(W - 1, X))]; } }
  out.present(fb, LUT.full);
  // mosaic cross into the close-up (7.30–7.70 s, peak on the cut), never an alpha fade
  const m = t >= 7.3 && t < 7.5 ? 1 + Math.round(ss(seg(t, 7.3, 7.5)) * 7) : t >= 7.5 && t < 7.7 ? 1 + Math.round((1 - ss(seg(t, 7.5, 7.7))) * 7) : 1;
  if (m > 1) out.post(u => mosaic(u, m));
  out.show();
};
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const tq = id === 'S1' ? tick(t) : t; if (id === 'S1' && (tq <= .3 || tq >= 1.75)) return null;
  const J = solveProfile(poseAt(tq)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render(0); window.READY = true;
