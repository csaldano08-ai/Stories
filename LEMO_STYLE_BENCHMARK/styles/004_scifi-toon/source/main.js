// 004 · Sci-Fi Sitcom Toon — the first 10 s of "Last Train Home" in the adult-swim-era sci-fi sitcom grammar
// (lemo-opuscar styles/scifi-toon): thick near-black outline at constant screen width, boiling (3 drawings on twos),
// flat fills with hard shadow shapes, big white eyes with tiny pupils, one palette for this world (ultraviolet + gold),
// skies in flat bands, nothing glows, hardware as junk, every absurd image followed by a reaction.
// Page contract: window.render(t), DUR, READY, RIGQA.
import { init, frame, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, quad, dot, text, bands, sid, S, INK, W, H } from './toon.js';
import { clamp, lerp, seg, ss, eo, eio, back, hash, TAU } from './shared/lib/util.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
import { runner, secondary } from './shared/aki2/motion.js';
import { DUR, shotAt, T, CADENCE, FIRST_STEP, STEP } from './shared/clip10.js';
import { drawAkiSF, hand, mouth, limb, P as AP } from './aki_sf.js';

const Q = new URLSearchParams(location.search);
const cv = document.getElementById('c'); init(cv);
const g = cv.getContext('2d');
await Promise.all(['800 40px "Baloo 2"', '40px "Titan One"'].map(f => document.fonts.load(f)));

// this world's palette (3–5 colours + the fixed line and eye white): ultraviolet + gold, one pink for signs
const U = { b0: '#22174F', b1: '#2B1E5E', b2: '#352670', b3: '#3F2E82', v1: '#4B3592', v2: '#5E46A8', v3: '#6F57BC', vS: '#3A2878',
  gold: '#F5B83D', goldS: '#D18F25', pink: '#FF7AA8', pinkS: '#D9558A', pave: '#2E2360', paveS: '#241B4E', water: '#1C1442', drop: '#B8A8F0', rain: 'rgba(200,186,255,.5)' };
const twos = t => Math.floor(t * 15 + 1e-6) / 15;

// ——— the run (shared rig) and the watch-check acting ———
const RUN = runner({ t0: FIRST_STEP + STEP, t1: 12, x0: -1400, v: 1450, cadence: CADENCE, duty: .42, lean: .15 });
const sec = (t, t0) => secondary(tq => { const p = RUN.pelvisAt(tq); return [p[0], p[1] - 250]; }, t0, t);
function poseAt(t) {
  const S0 = RUN.pose(t);
  const up = back(seg(t, T.watchUp, T.watchUp + .2), 1.3), dn = ss(seg(t, T.watchDown - .14, T.watchDown + .2));
  const w = clamp(up, 0, 1.1) * (1 - dn), ant = Math.sin(Math.PI * seg(t, T.watchUp - .16, T.watchUp)) * .3;
  S0.arms.n.sh -= ant; S0.watch = w;
  if (w > 0) {
    const J0 = solveProfile(S0), sh = J0.sh.n, ra = J0.arm.n, wm = Math.min(1, w);
    const tgt = [sh[0] + lerp(70, 92, wm), sh[1] + lerp(150, 50, wm) + (w > 1 ? (w - 1) * -40 : 0)];
    S0.arms.n = { tgt: [lerp(ra.wr[0], tgt[0], wm), lerp(ra.wr[1], tgt[1], wm)], bend: -1, hand: 'grip' };
    S0.arms.f.sh *= 1 - .45 * wm; S0.arms.f.el = lerp(S0.arms.f.el, 1.4, wm * .5);
    S0.head += .26 * wm; S0.neck += .08 * wm;
  }
  return S0;
}
// face acting: deadpan → the take at 6.5 s (eyes pop, pupils shrink and tremble, brows up, grimace), sweat, jitter
function faceAt(t) {
  const tq = twos(t), take = ss(seg(t, 6.47, 6.6)), panic = take * (1 - ss(seg(t, 7.3, 7.6)) * .3);
  const blink = [3.55, 5.25].some(b => tq >= b && tq < b + 2 / 15);
  const f = Math.floor(t * 15), J = 3 + 3 * panic;
  return { lid: lerp(.36, 0, take), eyeOpen: 1 + .22 * take, pupil: lerp(4.3, 2.6, take), blink,
    look: take > .1 ? [.15, .55] : (t > 6.1 ? [.4, .7] : [.7, 0]),
    tremble: panic > .1 ? [(hash(f * 1.7) - .5) * 2.4 * panic, (hash(f * 2.9) - .5) * 2.4 * panic] : [0, 0],
    jitter: panic > .1 ? [(hash(f * 3.3) - .5) * J * 2 * panic, (hash(f * 5.1) - .5) * J * 2 * panic] : [0, 0],
    brow: take, mouth: take > .1 ? { o: .45, w: 1.15, sm: -.7, skew: .35 } : { o: .3 + .15 * Math.abs(Math.sin(tq * 9)), w: .8, sm: -.1 },
    sweat: t >= 6.62 && t < 7.4 ? twos(t - 6.62) / .7 : null };
}
function aki(t, ox, oy, s, extra = {}) {
  const S0 = poseAt(t), J = solveProfile(S0), sc = sec(t, 0), w = Math.min(1, S0.watch || 0);
  push(); translate(ox, oy); scale(s);
  drawAkiSF(J, { hairLag: sc.hair.back, hemB: sc.hemB, hemF: sc.hemF, cuffBack: w, ...faceAt(t), ...extra });
  pop();
  return J;
}

// ——— effects ———
function rain(t, n = 150, camX = 0) {
  const tq = twos(t); g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = U.rain; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const z = .5 + hash(i * 3.7) * .8, len = 22 + 34 * z, sp = 1400 + 900 * z;
    const y = ((hash(i * 1.3) * 1300 + tq * sp) % 1300) - 110, x = ((hash(i * 2.1) * 2400 - camX * z - y * .18) % 2400 + 2400) % 2400 - 240;
    g.lineWidth = 2 + z * 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - len * .18, y + len); g.stroke(); }
}
// a cartoon splash: flat water drops with outlines flying out, a flat crown that rises and falls (on twos)
function splash(u, x, y, s = 1, seed = 1) {
  if (u < 0 || u > .6) return; u = twos(u) + 1 / 30;
  const base = 9000 + (seed % 50) * 40;
  if (u < .3) { const h = Math.sin(Math.PI * u / .3) * 70 * s, w2 = (40 + 120 * u) * s;
    shape(spline([[x - w2, y], [x - w2 * .7, y - h * .7], [x - w2 * .45, y - h * .2], [x - w2 * .2, y - h], [x, y - h * .3], [x + w2 * .25, y - h * .95], [x + w2 * .5, y - h * .25], [x + w2 * .75, y - h * .65], [x + w2, y]]), { fill: U.drop, lw: 6, seed: base }); }
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (hash(seed * 7 + i) - .5) * 2.2, sp = (280 + hash(seed * 3 + i) * 300) * s;
    const px = x + Math.cos(a) * sp * u, py = y + Math.sin(a) * sp * u + 1400 * u * u * s; if (py > y) continue;
    shape(spline([[px, py - 10 * s], [px + 6 * s, py + 3 * s], [px, py + 8 * s], [px - 6 * s, py + 3 * s]]), { fill: U.drop, lw: 5, seed: base + 1 + i }); }
}
function signBoard(x, y, word, fill, txt, px = 46, seedN = 0) {
  g.save(); g.font = `800 ${px}px "Baloo 2"`; const tw = g.measureText(word).width; g.restore();
  const bw = tw + px * .9, bh = px * 1.25;
  shape(rr(x - bw / 2, y - bh / 2, bw, bh, 12), { fill, lw: 6, seed: seedN, shade: () => fillOnly(rect(x - bw / 2, y + bh * .18, bw, bh), 'rgba(0,0,0,.14)', { boil: 0 }) });
  text(word, x, y + px * .06, { font: `800 ${px}px "Baloo 2"`, fill: txt });
}

// ——— S1 · 0–2.5 · ground-level insert on the puddle; the puddle creature ducks, the boot lands, the creature stares ———
const PX = 780, PY = 860, S1S = 2.2, S1G = 905;
const PUD = spline([[PX - 470, PY + 10], [PX - 360, PY - 70], [PX - 60, PY - 92], [PX + 240, PY - 60], [PX + 470, PY - 74], [PX + 520, PY + 8], [PX + 330, PY + 84], [PX - 40, PY + 96], [PX - 380, PY + 74]]);
function creature(t) {
  const tq = twos(t);
  const duck = ss(seg(tq, .74, .88)) * (1 - ss(seg(tq, 1.22, 1.36)));
  const land = tq > 1.36 ? Math.cos((tq - 1.36) * 16) * Math.exp(-(tq - 1.36) * 5) * .22 : 0;
  const ant = tq > .66 && tq < .74 ? .12 : 0;
  const rise = 1 - duck; if (rise < .04) return;
  const cx = PX + 40, cy = PY + 14, h = 120 * rise * (1 + ant - land), wd = 92 * (1 - ant * .5 + land);
  push();
  shape(spline([[cx - wd, cy], [cx - wd * .95, cy - h * .6], [cx - wd * .5, cy - h], [cx + wd * .5, cy - h], [cx + wd * .95, cy - h * .6], [cx + wd, cy], [cx, cy + 10]]), { fill: '#6A55B8', lw: 7, seed: 800,
    shade: () => { fillOnly(ell(cx + wd * .7, cy - h * .4, wd * .35, h * .7, 18), '#5442A0', { boil: .3 }); fillOnly(ell(cx - wd * .45, cy - h * .72, 9, 16, 10), 'rgba(255,255,255,.5)', { boil: .2 }); } });
  // drips while it is wet (after the splash)
  if (tq > 1.3) for (const [dx, L] of [[-60, 18], [-8, 26], [52, 16]]) { const yy = cy - h * .55 + ((tq * 30 + dx) % 22); shape(spline([[cx + dx - 6, yy], [cx + dx + 6, yy], [cx + dx, yy + L * .6]]), { fill: U.drop, lw: 4, seed: 810 + dx }); }
  // eyes: idle (lidded) → the take (wide, tiny pupils) → after: deadpan heavy lids looking where she went
  const take = tq >= .55 && tq < .9, after = tq > 1.36, blink = tq >= 2.1 && tq < 2.1 + 2 / 15;
  const ey = cy - h * .62, lid = take ? 0 : after ? .55 : .3, look = take ? [-.6, -.4] : after ? [.85, 0] : [-.3, -.2], pr = take ? 3 : 5;
  for (const ex of [cx - 30, cx + 30]) {
    if (blink) { stroke([[ex - 22, ey], [ex + 22, ey]], 7, { seed: 820 + ex }); continue; }
    const ry = take ? 30 : 24;
    shape(ell(ex, ey, 24, ry, 30), { fill: '#FFFFFF', lw: 6, seed: 830 + (ex > cx ? 1 : 0), shade: () => {
      dot(ex + look[0] * 11, ey + look[1] * 10, pr);
      if (lid > 0) { const yl = ey - ry + lid * 2 * ry; fillOnly([[ex - 40, ey - 40], [ex + 40, ey - 40], [ex + 40, yl], [ex - 40, yl]], '#6A55B8', { boil: .4 }); stroke([[ex - 28, yl], [ex + 28, yl]], 6); }
    } });
  }
  if (take) mouth(cx, cy - h * .25, 30, { o: .6, w: 1, sm: -.6, lw: 6, teeth: false });
  else if (after) stroke(quad([cx - 18, cy - h * .25], [cx, cy - h * .2], [cx + 16, cy - h * .28]), 6);
  pop();
}
function S1(t, lt) {
  const tq = twos(t);
  sid(100); bands([U.b1, U.b2, U.b3], -100, 700);
  // shopfronts (flat, outlined), gold windows, 24H and CAFE boards
  shape(rect(-40, 40, 960, 600), { fill: U.v1, lw: 6, shade: () => fillOnly(rect(760, 0, 200, 700), U.vS, { boil: .3 }) });
  shape(rect(900, 0, 1100, 640), { fill: U.v2, lw: 6, shade: () => fillOnly(rect(1700, 0, 300, 700), U.v1, { boil: .3 }) });
  shape(rect(20, 300, 600, 300), { fill: U.gold, lw: 6, shade: () => fillOnly(rect(20, 470, 600, 140), U.goldS, { boil: .3 }) });
  shape(rect(990, 310, 560, 290), { fill: U.gold, lw: 6, shade: () => fillOnly(rect(990, 480, 560, 140), U.goldS, { boil: .3 }) });
  shape(rect(660, 270, 160, 370), { fill: U.b1, lw: 6 }); shape(rect(1620, 260, 160, 380), { fill: U.b1, lw: 6 });
  signBoard(320, 180, '24H', U.gold, U.b0, 96, 140); signBoard(1270, 190, 'CAFE', U.pink, U.b0, 88, 141);
  // junk: a dented satellite dish bolted above the café door
  push(); translate(1700, 200); rotate(-.5); shape(spline([[-60, -10], [0, -46], [60, -10], [0, 20]]), { fill: '#B9B4CF', lw: 6, seed: 150 }); stroke([[0, 0], [0, 50]], 6, { seed: 151 }); dot(0, -2, 7, INK); pop();
  shape(rect(-40, 640, 2000, 500), { fill: U.pave, lw: 6, seed: 160, shade: () => fillOnly(rect(-40, 1000, 2000, 120), U.paveS, { boil: .3 }) });
  // the puddle: flat water with the boards upside down in it, wobbling on twos (more after the splash)
  const stir = t > T.splash ? 10 * Math.exp(-(t - T.splash) * 2) : 0;
  const pp = shape(PUD, { fill: U.water, lw: 6, seed: 170 });
  g.save(); g.clip(pp);
  for (let k = 0; k < 6; k++) { const yy = 790 + k * 26, dx = Math.sin(k * 1.3 + tq * 8) * (4 + stir); g.fillStyle = 'rgba(245,184,61,.35)'; g.fillRect(PX - 420 + dx + k * 20, yy, 360 - k * 30, 10); g.fillStyle = 'rgba(255,122,168,.3)'; g.fillRect(PX + 140 - dx, yy + 6, 300 - k * 34, 10); }
  g.save(); g.translate(PX - 250 + Math.sin(tq * 8) * (2 + stir), PY + 40); g.scale(1, -1); g.globalAlpha = .45; g.font = '800 70px "Baloo 2"'; g.textAlign = 'center'; g.fillStyle = U.gold; g.fillText('24H', 0, 20); g.restore();
  g.save(); g.translate(PX + 320 - Math.sin(tq * 8) * (2 + stir), PY + 30); g.scale(1, -1); g.globalAlpha = .45; g.font = '800 64px "Baloo 2"'; g.textAlign = 'center'; g.fillStyle = U.pink; g.fillText('CAFE', 0, 20); g.restore();
  g.restore(); g.globalAlpha = 1;
  creature(t);
  // the legs, on twos (locked camera)
  const c = RUN.contacts.find(c => Math.abs(c.t0 - T.splash) < .02), ox = PX + 30 - c.x * S1S;
  if (tq > .3 && tq < 1.75) { sid(2000); aki(tq, ox, S1G, S1S); }
  for (const k of RUN.contacts) splash(t - k.t0, ox + k.x * S1S + 20, S1G - 6, Math.abs(k.t0 - T.splash) < .02 ? 2.3 : 1.2, Math.round(k.t0 * 100));
  if (t > T.splash) for (let j = 0; j < 3; j++) { const v = twos(t - T.splash) - j * .2; if (v > 0 && v < 1.2) stroke(ell(PX + 60, PY + 20, 40 + 360 * eo(v / 1.2), 10 + 70 * eo(v / 1.2), 40), 5, { line: `rgba(184,168,240,${(.9 * (1 - v / 1.2)).toFixed(2)})`, seed: 870 + j }); }
  rain(t, 160);
}

// ——— S2 · 2.5–7.5 · side tracking run; flat-band sky, violet street, gold windows, junk hardware on the roofs ———
const S2S = .78, S2G = 962, HOR = 800;
const SIGNS = [['24H', 'gold'], ['CAFE', 'pink'], ['BAKERY', 'gold'], ['BAR', 'pink'], ['BOOKS', 'white'], ['PHARMACY', 'gold'], ['NOODLES', 'pink'], ['LAUNDRY', 'white'], ['RECORDS', 'gold'], ['HOTEL', 'pink'], ['FLOWERS', 'gold'], ['DINER', 'white']];
const FAC = (() => { const o = []; let x = -1100, i = 0; while (x < 7600) { const w = 540 + hash(i * 7.1) * 240; o.push({ x, w, top: 170 + hash(i * 3.3) * 170, col: [U.v1, U.v2, U.v3, U.vS][i % 4], sign: SIGNS[i % SIGNS.length], junk: i % 3, i }); x += w + 16; i++; } return o; })();
const TOW = (() => { const o = []; let x = -600, i = 0; while (x < 4200) { const w = 160 + hash(i * 2.7) * 180; o.push({ x, w, top: 90 + hash(i * 4.1) * 240, i }); x += w + 40 + hash(i * 9.1) * 70; i++; } return o; })();
const sc = { gold: [U.gold, U.b0], pink: [U.pink, U.b0], white: ['#FFFFFF', U.b0] };
function facade(F, ox) {
  const x = F.x - ox, w = F.w; if (x > W + 60 || x + w < -60) return;
  const top = F.top, base = 3000 + F.i * 60; sid(base);
  shape(rect(x, top, w, HOR - top + 4), { fill: F.col, lw: 6, shade: () => fillOnly(rect(x + w - 50, top - 10, 60, HOR - top + 20), 'rgba(20,10,50,.28)', { boil: .3 }) });
  for (let yy = top + 46, r = 0; yy < 410; yy += 110, r++) for (let xx = x + 54, c = 0; xx < x + w - 100; xx += 116, c++) {
    const lit = hash(F.i * 13 + r * 7 + c) < .55;
    shape(rr(xx, yy, 60, 74, 8), { fill: lit ? U.gold : U.b1, lw: 5, shade: lit ? () => fillOnly(rect(xx + 32, yy - 4, 40, 90), U.goldS, { boil: .3 }) : null });
  }
  shape(rect(x + 30, 500, w - 60, 40), { fill: F.sign[1] === 'pink' ? U.pink : U.gold, lw: 5, shade: () => { for (let k = 0; k < 12; k++) fillOnly(rect(x + 30 + k * 2 * (w - 60) / 12, 500, (w - 60) / 12, 44), 'rgba(255,255,255,.55)', { boil: .2 }); } });
  shape(rect(x + 40, 560, w - 220, 200), { fill: U.gold, lw: 6, shade: () => fillOnly(rect(x + 40, 700, w - 220, 70), U.goldS, { boil: .3 }) });
  shape(rect(x + w - 150, 552, 100, HOR - 552), { fill: U.b1, lw: 6 });
  const [bf, bt] = sc[F.sign[1]]; signBoard(x + w / 2 - 30, 446, F.sign[0], bf, bt, F.sign[0].length > 6 ? 36 : 44, base + 40);
  // roof junk: a satellite dish / a bolted-on thruster / a bent antenna with a flat red ball
  if (F.junk === 0) { push(); translate(x + w * .3, top - 30); rotate(-.6); shape(spline([[-46, -8], [0, -36], [46, -8], [0, 16]]), { fill: '#B9B4CF', lw: 5 }); stroke([[0, 0], [0, 34]], 5); pop(); }
  else if (F.junk === 1) { shape(rr(x + w * .62, top - 50, 70, 50, 10), { fill: '#8D86AE', lw: 5 }); shape(spline([[x + w * .62 + 70, top - 44], [x + w * .62 + 104, top - 52], [x + w * .62 + 104, top - 6], [x + w * .62 + 70, top - 12]]), { fill: '#6E6890', lw: 5 }); }
  else { stroke(spline([[x + w * .5, top], [x + w * .5 + 10, top - 40], [x + w * .5 - 6, top - 70], [x + w * .5 + 8, top - 96]], false), 5); dot(x + w * .5 + 8, top - 100, 7, '#FF4A3A'); }
}
function tower(Tw, ox) {
  const x = Tw.x - ox, w = Tw.w; if (x > W + 60 || x + w < -60) return; sid(6000 + Tw.i * 30);
  shape(rect(x, Tw.top, w, HOR - Tw.top), { fill: Tw.i % 2 ? U.b3 : U.b2, lw: 5, shade: () => fillOnly(rect(x + w * .7, Tw.top - 10, w * .4, HOR), U.b1, { boil: .3 }) });
  for (let yy = Tw.top + 30, r = 0; yy < HOR - 60; yy += 46, r++) for (let xx = x + 22, c = 0; xx < x + w - 30; xx += 40, c++) if (hash(Tw.i * 31 + r * 5 + c) < .3) fillOnly(rect(xx, yy, 18, 22), U.gold, { boil: .3 });
}
function S2(t, lt) {
  const camX = RUN.pelvisAt(t)[0] - 40 / S2S, sx = -camX * S2S + 860;
  const mid = camX * S2S * .82 - 1000, far = camX * S2S * .32 - 700, fg = camX * S2S * 1.6;
  sid(200); bands([U.b0, U.b1, U.b2, U.b3], -20, 520);
  for (const Tw of TOW) tower(Tw, far);
  for (const F of FAC) facade(F, mid);
  sid(5000); shape(rect(-40, HOR, 2000, 400), { fill: U.pave, lw: 6, shade: () => fillOnly(rect(-40, 1030, 2000, 100), U.paveS, { boil: .3 }) });
  for (const F of FAC) { const x = F.x - mid; if (x > W || x + F.w < 0) continue; fillOnly(rect(x + 60, HOR + 16, F.w - 260, 12), 'rgba(245,184,61,.28)', { boil: .3, seed: 5100 + F.i }); }
  // the junk drone: a trash can on a propeller, hovering over the pavement (mid layer)
  { const x = 2600 - mid, y = 700 + Math.sin(t * 3) * 10; if (x > -200 && x < W + 200) { sid(5200);
    shape(rr(x - 40, y - 60, 80, 90, 10), { fill: '#8D86AE', lw: 6, shade: () => fillOnly(rect(x + 10, y - 70, 40, 110), '#6E6890', { boil: .3 }) });
    stroke([[x, y - 60], [x, y - 84]], 5); const pa = twos(t) * 40; stroke([[x - 50 * Math.cos(pa), y - 86], [x + 50 * Math.cos(pa), y - 86]], 6);
    shape(ell(x + 18, y - 26, 10, 12, 16), { fill: '#FFFFFF', lw: 4, shade: () => dot(x + 22, y - 26, 3) }); } }
  sid(7000); const J = aki(t, sx, S2G, S2S);
  for (const k of RUN.contacts) splash(t - k.t0, sx + k.x * S2S + 14, S2G - 2, .7, Math.round(k.t0 * 100));
  // foreground lamp posts (parallax 1.6): flat gold heads (no glow — only a travel device may glow in this genre)
  for (let k = 0; k < 5; k++) { const x = k * POST + POST_OFF - fg; if (x < -200 || x > W + 200) continue; sid(8000 + k * 10);
    shape(limb([[x, H + 40], [x, 270]], 26, 22), { fill: U.b0, lw: 6 }); shape(ell(x, 250, 40, 30, 24), { fill: U.gold, lw: 6, shade: () => fillOnly(rect(x, 210, 50, 80), U.goldS, { boil: .3 }) }); }
  rain(t, 140, camX * S2S);
}
const POST = 3600;
const POST_OFF = (() => { let best = 0, bd = -1; for (let off = 0; off < POST; off += 20) { let md = 1e9; for (let t = 5.85; t <= 7.5; t += 1 / 30) { const fg = (RUN.pelvisAt(t)[0] - 40 / S2S) * S2S * 1.6; for (let k = 0; k < 5; k++) md = Math.min(md, Math.abs(k * POST + off - fg - 900)); } if (md > bd) { bd = md; best = off; } } return best; })();

// ——— S3 · 7.5–9.375 · extreme close-up insert of the gadget watch, a short shake on the hit; her panic in the glass ———
function S3(t, lt) {
  const tq = twos(t), sh = lt < .3 ? Math.exp(-lt * 12) * 14 : 0, f = Math.floor(t * 30);
  const shx = sh * (hash(f * 1.3) - .5) * 2, shy = sh * (hash(f * 2.7) - .5) * 2;
  const bob = Math.sin(2 * Math.PI * CADENCE * (tq - FIRST_STEP)) * 8;
  sid(100); bands([U.b0, U.b1, U.b2, U.b1], -20, 1100);
  for (let k = 0; k < 26; k++) { const y = 40 + hash(k * 1.7) * 1000, sp = 900 + hash(k * 2.3) * 1300, w = 160 + hash(k * 3.1) * 280, x = ((hash(k * 4.3) * 2600 - t * sp) % 2600 + 2600) % 2600 - 400;
    fillOnly(rr(x, y, w, 18 + hash(k * 5.9) * 16, 9), [U.gold, U.pink, U.v3][k % 3], { alpha: .55, boil: .3, seed: 200 + k }); }
  push(); translate(1000 + shx, 560 + bob + shy); rotate(-.1);
  sid(1000);
  shape(limb([[-1500, 40], [-800, 20], [-300, 6]], 330, 300), { fill: AP.coat, lw: 7, shade: () => fillOnly(rect(-1600, 90, 1400, 200), AP.coatS, { boil: .3 }) });
  stroke(spline([[-1050, -100], [-980, 0], [-1040, 120]], false), 6); stroke(spline([[-700, -110], [-640, 0], [-690, 120]], false), 6);
  shape(limb([[-320, 4], [300, -6]], 220, 206), { fill: AP.skin, lw: 7, shade: () => fillOnly(rect(-360, 50, 700, 80), AP.skinS, { boil: .3 }) });
  shape(rr(-370, -170, 80, 340, 26), { fill: AP.coatS, lw: 7 });
  hand(390, 4, -.02, 120, AP.skin, { fist: true, lw: 7 });
  // the gadget: strap, chunky gold case, side buttons, antenna with a flat red ball, dial 11:58, second hand ticking
  shape(rect(-110, -150, 220, 300), { fill: AP.strap, lw: 7, shade: () => fillOnly(rect(20, -160, 120, 320), '#3E2718', { boil: .3 }) });
  shape(rr(-34, -262, 20, 70, 6), { fill: '#B9B4CF', lw: 6 }); stroke([[-24, -262], [-40, -330]], 7); dot(-42, -340, 15, '#FF4A3A');
  shape(rr(196, -50, 40, 34, 8), { fill: AP.gold, lw: 6 }); shape(rr(196, 20, 40, 34, 8), { fill: AP.gold, lw: 6 });
  shape(rr(-210, -200, 420, 400, 80), { fill: AP.gold, lw: 7, shade: () => fillOnly(rr(40, -230, 220, 460, 60), AP.goldS, { boil: .3 }) });
  const dial = shape(ell(0, 0, 160, 160, 64), { fill: AP.dial, lw: 7 });
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, r0 = k % 3 ? 136 : 118; stroke([[Math.sin(a) * r0, -Math.cos(a) * r0], [Math.sin(a) * 150, -Math.cos(a) * 150]], k % 3 ? 5 : 8, { seed: 1100 + k }); }
  [['12', 0, -92], ['3', 96, 0], ['6', 0, 96], ['9', -96, 0]].forEach(([s, x, y]) => text(s, x, y + 4, { font: '800 52px "Baloo 2"', fill: INK }));
  const secs = 41 + Math.floor(t - T.watchHit), mm = 58 + secs / 60, ha = (11 + mm / 60) / 12 * TAU, ma = mm / 60 * TAU, sa = secs / 60 * TAU;
  sid(1200);
  shape(limb([[0, 0], [Math.sin(ha) * 78, -Math.cos(ha) * 78]], 18, 10), { fill: INK, lw: 4 });
  shape(limb([[0, 0], [Math.sin(ma) * 124, -Math.cos(ma) * 124]], 14, 8), { fill: INK, lw: 4 });
  stroke([[-Math.sin(sa) * 26, Math.cos(sa) * 26], [Math.sin(sa) * 138, -Math.cos(sa) * 138]], 5, { line: '#E5482E' });
  dot(0, 0, 12, '#E5482E');
  // her reaction in the crystal: a faint reflection of her face — the bob, one huge eye with a tiny trembling pupil
  g.save(); g.clip(dial); g.globalAlpha = .3;
  fillOnly(spline([[-150, -10], [-120, -120], [-20, -150], [60, -110], [70, -20], [20, -40], [-60, -50], [-110, 30]]), AP.hair, { boil: .4, seed: 1290 });
  fillOnly(ell(-30, -40, 70, 64, 30), AP.skin, { boil: .4, seed: 1291 });
  { const tr = [(hash(f * 1.9) - .5) * 5, (hash(f * 3.7) - .5) * 5]; fillOnly(ell(-2, -52, 30, 38, 30), '#FFFFFF', { boil: .4, seed: 1292 }); dot(-2 + tr[0], -48 + tr[1], 5, INK); }
  g.restore(); g.globalAlpha = 1;
  for (let k = 0; k < 5; k++) { const a = (.15 + hash(k * 8.1) * .7) * Math.PI, d = 40 + hash(k * 9.3) * 90, sl = (tq * (14 + hash(k * 4.4) * 18)) % 40, x = Math.cos(a) * d, y = Math.sin(a) * d + sl;
    shape(spline([[x, y - 14], [x + 9, y + 4], [x, y + 11], [x - 9, y + 4]]), { fill: 'rgba(191,233,255,.85)', lw: 4, seed: 1400 + k }); }
  pop();
  rain(t, 90);
}

// ——— S4 · 9.375–10 · flat-band sky, lumpy clouds, the city's roofs; the stand tilts down; the clock squashes on the chime ———
function S4(t, lt) {
  const tilt = 240 * Math.pow(seg(lt, 0, .625), 2);
  sid(100); bands([U.b0, U.b1, U.b2, U.b3, U.v1], -20 - tilt * .2, 1100);
  push(); translate(0, -tilt);
  for (let k = 0; k < 6; k++) { const x = ((hash(k * 7.7) * 2600 + t * 30 * (1 + hash(k * 3.3))) % 2600) - 340, y = 140 + hash(k * 5.5) * 380, s = 170 + hash(k * 2.2) * 160;
    shape(spline([[x - s, y + s * .2], [x - s * .8, y - s * .2], [x - s * .35, y - s * .38], [x, y - s * .22], [x + s * .4, y - s * .45], [x + s * .9, y - s * .15], [x + s, y + s * .2]]), { fill: U.v1, lw: 5, seed: 300 + k, shade: () => fillOnly(rect(x - s * 1.2, y + s * .02, s * 2.4, s), U.vS, { boil: .3 }) }); }
  for (let i = 0; i < 9; i++) { const x = -60 + i * 240 + hash(i * 1.9) * 60, w = 150 + hash(i * 2.9) * 120, top = 880 + hash(i * 3.9) * 200; sid(400 + i * 30);
    shape(rect(x, top, w, 700), { fill: i % 2 ? U.b3 : U.b2, lw: 5, shade: () => fillOnly(rect(x + w * .7, top - 10, w * .4, 800), U.b1, { boil: .3 }) });
    for (let yy = top + 30, r = 0; yy < 1500; yy += 46, r++) for (let xx = x + 22, c = 0; xx < x + w - 30; xx += 40, c++) if (hash(i * 31 + r * 5 + c) < .32) fillOnly(rect(xx, yy, 18, 22), U.gold, { boil: .3 }); }
  // the station clock tower top: the clock face squashes on the chime (decaying cosine) and a flat ring pops
  const cx = 1340, cy = 1040, u = t - T.chime, sq = u > 0 ? Math.cos(u * 30) * Math.exp(-u * 8) * .18 : 0;
  sid(700); shape([[cx - 100, 1600], [cx - 100, cy + 60], [cx, cy - 120], [cx + 100, cy + 60], [cx + 100, 1600]], { fill: U.vS, lw: 6, shade: () => fillOnly(rect(cx + 30, cy - 130, 80, 800), U.b1, { boil: .3 }) });
  push(); translate(cx, cy + 40); scale(1 + sq, 1 - sq);
  shape(ell(0, 0, 66, 66, 40), { fill: U.gold, lw: 6 }); shape(ell(0, 0, 50, 50, 36), { fill: AP.dial, lw: 5 });
  stroke([[0, 0], [-10, -32]], 6); stroke([[0, 0], [-3, -42]], 5);
  pop();
  if (u > 0) for (let j = 0; j < 2; j++) { const v = twos(u) - j * .12; if (v > 0) stroke(ell(cx, cy + 40, 90 + 300 * v, 90 + 300 * v, 60), 6, { line: `rgba(245,184,61,${Math.max(0, .85 - v * 1.6).toFixed(2)})`, seed: 760 + j }); }
  pop();
  rain(t, 150);
}

const SH = { S1, S2, S3, S4 };
function sheet() {
  bands(['#EDE6FF'], -10, 1100);
  [3.0, 3.06, 3.12, 3.18, 3.24, 6.7].forEach((tt, i) => { sid(10000 + i * 400); aki(tt, 160 + i * 300 - RUN.pelvisAt(tt)[0] * .52, 900, .52); });
  sid(14000); const tt = 6.7, s = 1.35; aki(tt, 1700 - RUN.pelvisAt(tt)[0] * s, 1150, s);
}
function render(t) {
  frame(t); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  if (Q.get('test') === 'sheet') { sheet(); return; }
  const [t0, , id] = shotAt(t); SH[id](t, t - t0);
}
window.RIGQA = t => { const id = shotAt(t)[2]; if (id !== 'S1' && id !== 'S2') return null; const tt = id === 'S1' ? twos(t) : t; if (id === 'S1' && (tt <= .3 || tt >= 1.75)) return null;
  const J = solveProfile(poseAt(tt)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
window.render = render; window.DUR = DUR; window.EV = []; render(0); window.READY = true;
