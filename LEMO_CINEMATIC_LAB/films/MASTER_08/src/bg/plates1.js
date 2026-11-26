// Plates for S1–S5: the rainy shopping street, the puddle insert, the station wide. Generic sign words only.
import { plate, vgrad, air, clouds, building, neonText, neonPath, lightbox, smear, reflection, canvas, rgba, mix, mulberry, lerp } from './paint.js';

const NIGHT = { sky0: '#0b0820', sky1: '#2a1846', glow: '#7a3a6a', bld: '#1b1534', bldTop: '#120e26' };
const WIN = ['#ffd27a', '#ffe7b0', '#9fe6ff', '#ffb36a', '#f4f0ff'];

// ——— FAR layer: skyline over the street (parallax ≈ .35) ———
export function streetFar(w = 4600) {
  const P = plate(w, 1080), { g } = P, r = mulberry(11);
  vgrad(g, 0, 0, w, 1080, [[0, NIGHT.sky0], [.45, NIGHT.sky1], [.75, '#4a2350'], [1, '#2a1636']]);
  clouds(g, w, 40, 360, 5, '#2b1f4e', '#8a3f78', 60);
  let x = -40;
  while (x < w) {
    const bw = 160 + r() * 260, bh = 380 + r() * 520, top = 1080 - bh - 120;
    building(P, { x, y: top, w: bw, h: bh + 120, col: mix(NIGHT.bld, '#000000', r() * .3), top: NIGHT.bldTop, seed: 100 + x | 0,
      edge: rgba('#ff6fbf', .25), win: { w: 9, h: 13, gx: 19, gy: 26, mx: 10, my: 14, lit: .28 + r() * .2, cols: WIN, glow: .35 } });
    if (r() < .35) { g.fillStyle = '#ff3a3a'; g.fillRect(x + bw / 2, top - 30, 3, 30); P.e.fillStyle = '#ff2a2a'; P.e.beginPath(); P.e.arc(x + bw / 2 + 1, top - 32, 4, 0, 7); P.e.fill(); }
    x += bw + 6 + r() * 30;
  }
  air(g, w / 2, 1000, w * .7, 220, '#ff5aa8', .16, 1);   // city glow in the rain haze
  return P;
}

// ——— MID layer: the shopfronts the runner passes (parallax 1). Ground line (back edge of the sidewalk) at y = 860 ———
export const SHOPS = [['CAFE', '#ff5fb3'], ['24H', '#59e6ff'], ['BAKERY', '#ffd36a'], ['BAR', '#ff4f6a'], ['BOOKS', '#9b7bff'], ['PHARMACY', '#53ffb0'],
  ['NOODLES', '#ffb34f'], ['LAUNDRY', '#59e6ff'], ['RECORDS', '#ff5fb3'], ['HOTEL', '#ffd36a'], ['FLOWERS', '#ff7fa8'], ['KARAOKE', '#9b7bff']];
export function streetMid(w = 8200) {
  const P = plate(w, 1080), { g, e } = P, r = mulberry(23);
  let x = 0, i = 0;
  while (x < w) {
    const [word, col] = SHOPS[i % SHOPS.length]; i++;
    const sw = 520 + r() * 380, top = 40 + r() * 80;
    // upper floors
    building(P, { x, y: top, w: sw, h: 560 - top, col: mix('#1e1734', '#000000', .2 + r() * .3), top: '#0f0b20', seed: 300 + i,
      win: { w: 34, h: 52, gx: 74, gy: 96, mx: 26, my: 30, lit: .3, cols: WIN, glow: .45, dark: '#0c0a1a' } });
    // balcony rails + AC units (silhouette detail that separates this layer from the far skyline)
    for (let fy = top + 92; fy < 540; fy += 96) { g.fillStyle = '#0a0816'; g.fillRect(x + 14, fy, sw - 28, 5); for (let bx = x + 20; bx < x + sw - 20; bx += 14) g.fillRect(bx, fy - 26, 2, 26);
      if (r() < .5) { g.fillStyle = '#2a2840'; g.fillRect(x + 30 + r() * (sw - 120), fy - 40, 56, 34); g.fillStyle = '#16142a'; g.fillRect(x + 36 + r() * 6, fy - 34, 44, 3); } }
    // a vertical sign box on some façades (generic words, stacked letters)
    if (r() < .55) {
      const vx = x + (r() < .5 ? 24 : sw - 90), vw = 66, vy = top + 40 + r() * 80, word = ['BAR', 'INN', '24H', 'CAFE', 'FOOD', 'GAME'][Math.floor(r() * 6)], vc = ['#ff5fb3', '#59e6ff', '#ffd36a', '#9b7bff', '#53ffb0'][Math.floor(r() * 5)];
      const vh = word.length * 64 + 30;
      g.fillStyle = mix(vc, '#ffffff', .35); g.fillRect(vx, vy, vw, vh); e.fillStyle = rgba(vc, .6); e.fillRect(vx, vy, vw, vh);
      g.strokeStyle = '#0a0816'; g.lineWidth = 4; g.strokeRect(vx, vy, vw, vh);
      g.font = '700 52px "Barlow SC"'; g.textAlign = 'center'; g.fillStyle = '#2a0e24';
      [...word].forEach((ch, k) => g.fillText(ch, vx + vw / 2, vy + 62 + k * 64));
    }
    g.fillStyle = rgba('#000000', .35); g.fillRect(x + sw - 6, top, 6, 820);                 // party wall shadow
    // sign band
    const sy = 560, sh = 90;
    g.fillStyle = '#16102a'; g.fillRect(x, sy, sw, sh);
    if (r() < .5) neonText(P, word, x + sw / 2, sy + sh / 2, 64, col);
    else lightbox(P, x + sw * .18, sy + 12, sw * .64, sh - 24, mix(col, '#ffffff', .25), word, '#2a1030', 50);
    // shop window (warm interior) + door
    const wy = sy + sh, wh = 860 - wy;
    vgrad(g, x + 20, wy + 10, sw - 160, wh - 10, [[0, '#ffcf8a'], [.6, '#e88a5a'], [1, '#5a2a3a']]);
    vgrad(e, x + 20, wy + 10, sw - 160, wh - 10, [[0, rgba('#ffcf8a', .45)], [1, rgba('#e88a5a', .15)]]);
    for (let k = 0; k < 4; k++) { g.fillStyle = rgba('#3a1a2a', .55); g.fillRect(x + 40 + k * (sw - 200) / 4, wy + 60, (sw - 200) / 4 - 30, 8); g.fillRect(x + 50 + k * (sw - 200) / 4, wy + 30, 40 + r() * 40, 30); }
    g.fillStyle = '#120c22'; g.fillRect(x + sw - 130, wy + 10, 100, wh - 10);                // door
    g.fillStyle = rgba('#ffe7b0', .8); g.fillRect(x + sw - 120, wy + 24, 80, 70); e.fillStyle = rgba('#ffe7b0', .3); e.fillRect(x + sw - 120, wy + 24, 80, 70);
    // awning (striped) over the window
    if (r() < .6) {
      const ac = r() < .5 ? '#c43a4a' : '#2f7a8a';
      for (let k = 0; k < 12; k++) { g.fillStyle = k % 2 ? ac : mix(ac, '#ffffff', .55); g.beginPath(); const ax = x + 10 + k * (sw - 40) / 12; g.moveTo(ax, wy); g.lineTo(ax + (sw - 40) / 12, wy); g.lineTo(ax + (sw - 40) / 12 + 6, wy + 44); g.lineTo(ax + 6, wy + 44); g.fill(); }
      g.fillStyle = rgba('#000000', .3); g.fillRect(x + 10, wy + 44, sw - 30, 10);
    }
    x += sw;
  }
  // sidewalk back edge + kerb strip at the bottom of the plate (reflection painted separately)
  g.fillStyle = '#100c1e'; g.fillRect(0, 856, w, 8);
  return P;
}
// wet sidewalk under the shopfronts: reflection of the mid plate (rows 300..860) into the ground band 864..1080
export function streetGround(mid) {
  const H2 = 216;
  const refl = reflection(mid.c, 360, 500, H2, { blur: 2.5, streak: 6, dark0: .3, dark1: .78, seed: 4 });
  const reflE = reflection(mid.ec, 360, 500, H2, { blur: 4, streak: 8, dark0: .1, dark1: .6, seed: 4 });
  // paving: subtle joints + puddle patches stay reflective, dry patches darker
  const [c, g] = canvas(mid.w, H2);
  g.fillStyle = '#17122a'; g.fillRect(0, 0, mid.w, H2);
  g.globalAlpha = .85; g.drawImage(refl, 0, 0); g.globalAlpha = 1;
  const r = mulberry(9);
  for (let k = 0; k < mid.w / 260; k++) { g.fillStyle = rgba('#0a0816', .35); g.beginPath(); g.ellipse(r() * mid.w, 40 + r() * 170, 120 + r() * 200, 14 + r() * 20, 0, 0, 7); g.fill(); }
  g.strokeStyle = rgba('#000000', .25); g.lineWidth = 2;
  for (let y = 30; y < H2; y += 46 + y * .25) { g.beginPath(); g.moveTo(0, y); g.lineTo(mid.w, y); g.stroke(); }
  return { c, refl: c, reflE, h: H2 };
}

// ——— S1: puddle insert (ground level) ———
export function puddlePlate() {
  const P = plate(2400, 1080), { g, e } = P, r = mulberry(41);
  vgrad(g, 0, 0, 2400, 1080, [[0, '#120d24'], [.55, '#1c1430'], [.62, '#120e1e'], [1, '#0d0a16']]);
  // out-of-focus shopfronts (bokeh) above the horizon
  for (let k = 0; k < 70; k++) {
    const col = ['#ff5fb3', '#59e6ff', '#ffd36a', '#ff4f6a', '#9b7bff', '#ffb36a'][k % 6], x = r() * 2400, y = 120 + r() * 420, rad = 18 + r() * 60;
    air(g, x, y, rad, rad, col, .35 + r() * .3, .35); air(e, x, y, rad, rad, col, .3, .4);
  }
  air(g, 1200, 600, 1400, 120, '#ff6fbf', .12, 1);
  // asphalt texture
  for (let k = 0; k < 4000; k++) { g.fillStyle = rgba(r() < .5 ? '#2a2040' : '#05040a', .25); g.fillRect(r() * 2400, 640 + r() * 440, 2 + r() * 3, 1 + r() * 2); }
  return P;
}

// ——— S4: the station wide — tall plate for a crane down (sky → station → plaza) ———
export function stationWide() {
  const Hh = 2600, P = plate(1920, Hh), { g, e } = P, r = mulberry(77);
  vgrad(g, 0, 0, 1920, 1400, [[0, '#07061a'], [.5, '#1d1240'], [1, '#4a2048']]);
  clouds(g, 1920, 80, 900, 13, '#2a1f50', '#9a4a80', 70);
  // city behind the station
  let x = -30;
  while (x < 1920) { const bw = 120 + r() * 200, bh = 300 + r() * 500;
    building(P, { x, y: 1400 - bh, w: bw, h: bh, col: '#1a1434', top: '#110d26', seed: 900 + x | 0, win: { w: 8, h: 12, gx: 17, gy: 24, mx: 8, my: 10, lit: .3, cols: WIN, glow: .35 } }); x += bw + 10; }
  air(g, 960, 1350, 1300, 200, '#ff6fa8', .18, 1);
  // elevated platform: canopy roof, train, deck, columns
  const deckY = 1560;
  g.fillStyle = '#2b2a40'; g.fillRect(0, 1250, 1920, 40);                                   // canopy roof edge
  vgrad(g, 0, 1290, 1920, 30, [[0, '#4a4866'], [1, '#22203a']]);
  for (let k = 0; k < 9; k++) { g.fillStyle = '#d8f4ff'; g.fillRect(70 + k * 220, 1312, 120, 6); e.fillStyle = rgba('#d8f4ff', .9); e.fillRect(70 + k * 220, 1312, 120, 6); }   // canopy fluorescents
  // the train: cream body, teal stripe, warm windows
  const ty = 1400, th = 150;
  vgrad(g, 180, ty, 1740, th, [[0, '#e9e4d6'], [1, '#b8b2a6']]);
  g.fillStyle = '#1f8a8a'; g.fillRect(180, ty + th - 34, 1740, 14);
  for (let k = 0; k < 14; k++) { const wx = 210 + k * 122; g.fillStyle = '#ffd99a'; g.fillRect(wx, ty + 22, 92, 62); e.fillStyle = rgba('#ffc878', .75); e.fillRect(wx, ty + 22, 92, 62);
    g.fillStyle = rgba('#7a4a2a', .45); g.fillRect(wx, ty + 66, 92, 18); }
  g.fillStyle = '#2b2a40'; g.fillRect(0, deckY, 1920, 34);                                    // deck slab
  for (let k = 0; k < 6; k++) { vgrad(g, 120 + k * 340, deckY + 34, 54, 420, [[0, '#2a2840'], [1, '#141224']]); }
  // station hall below the deck: glass entrance glowing
  vgrad(g, 0, deckY + 34, 1920, 420, [[0, '#1a1630'], [1, '#120f22']]);
  vgrad(g, 640, 1700, 640, 300, [[0, '#fff0c8'], [1, '#ffb878']]); vgrad(e, 640, 1700, 640, 300, [[0, rgba('#fff0c8', .55)], [1, rgba('#ffb878', .3)]]);
  for (let k = 0; k < 8; k++) { g.fillStyle = '#2a2440'; g.fillRect(640 + k * 80, 1700, 6, 300); }
  // big station clock (23:58)
  clockFace(P, 960, 1640, 52, 23, 58);
  // name board + departure board (LED amber)
  lightbox(P, 700, 1600 - 120, 520, 56, '#f4f4ff', 'STATION', '#1b2a5a', 44);
  ledBoard(P, 1300, 1620, 360, 70, ['LAST TRAIN', '23:59']);
  // plaza
  vgrad(g, 0, 2000, 1920, 600, [[0, '#1a1530'], [1, '#0e0b1a']]);
  const refl = reflection(P.c, 1500, 500, 380, { blur: 3, streak: 8, dark0: .35, dark1: .8, seed: 3 });
  g.globalAlpha = .7; g.drawImage(refl, 0, 2050); g.globalAlpha = 1;
  const reflE = reflection(P.ec, 1500, 500, 380, { blur: 5, streak: 9, dark0: .2, dark1: .7, seed: 3 });
  e.globalAlpha = .5; e.drawImage(reflE, 0, 2050); e.globalAlpha = 1;
  for (const lx of [260, 1660]) { g.fillStyle = '#16122a'; g.fillRect(lx, 1780, 10, 420); air(g, lx + 5, 1780, 70, 70, '#fff0c8', .5, .5); air(e, lx + 5, 1780, 60, 60, '#fff0c8', .8, .5); }
  return P;
}

export function clockFace(P, cx, cy, R, hh, mm, ss = null) {
  const { g, e } = P;
  g.fillStyle = '#0e0c1c'; g.beginPath(); g.arc(cx, cy, R + 7, 0, 7); g.fill();
  g.fillStyle = '#f6f4ea'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
  e.fillStyle = rgba('#f6f4ea', .55); e.beginPath(); e.arc(cx, cy, R, 0, 7); e.fill();
  g.strokeStyle = '#1b1b2a';
  for (let k = 0; k < 60; k++) { const a = k / 60 * Math.PI * 2, l = k % 5 ? R * .06 : R * .14; g.lineWidth = k % 5 ? R * .02 : R * .045;
    g.beginPath(); g.moveTo(cx + Math.sin(a) * (R * .92 - l), cy - Math.cos(a) * (R * .92 - l)); g.lineTo(cx + Math.sin(a) * R * .92, cy - Math.cos(a) * R * .92); g.stroke(); }
  hands(g, cx, cy, R, hh, mm, ss);
}
export function hands(g, cx, cy, R, hh, mm, ss) {
  const ha = ((hh % 12) + mm / 60) / 12 * Math.PI * 2, ma = mm / 60 * Math.PI * 2;
  g.strokeStyle = '#151522'; g.lineCap = 'round';
  g.lineWidth = R * .07; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(ha) * R * .52, cy - Math.cos(ha) * R * .52); g.stroke();
  g.lineWidth = R * .045; g.beginPath(); g.moveTo(cx - Math.sin(ma) * R * .1, cy + Math.cos(ma) * R * .1); g.lineTo(cx + Math.sin(ma) * R * .8, cy - Math.cos(ma) * R * .8); g.stroke();
  if (ss != null) { const sa = ss / 60 * Math.PI * 2; g.strokeStyle = '#d23a3a'; g.lineWidth = R * .018; g.beginPath(); g.moveTo(cx - Math.sin(sa) * R * .18, cy + Math.cos(sa) * R * .18); g.lineTo(cx + Math.sin(sa) * R * .86, cy - Math.cos(sa) * R * .86); g.stroke(); }
  g.fillStyle = '#151522'; g.beginPath(); g.arc(cx, cy, R * .06, 0, 7); g.fill();
}
export function ledBoard(P, x, y, w, h, lines) {
  const { g, e } = P;
  g.fillStyle = '#07060c'; g.fillRect(x, y, w, h); g.strokeStyle = '#2a2838'; g.lineWidth = 4; g.strokeRect(x, y, w, h);
  for (const [c, a] of [[g, 1], [e, .9]]) { c.save(); c.font = `700 ${h * .36}px "Barlow SC"`; c.textBaseline = 'middle'; c.fillStyle = rgba('#ffb03a', a);
    c.textAlign = 'left'; c.fillText(lines[0], x + 14, y + h / 2); c.textAlign = 'right'; c.fillText(lines[1], x + w - 14, y + h / 2); c.restore(); }
  // LED dot mask
  g.fillStyle = rgba('#000000', .45); for (let yy = y + 2; yy < y + h; yy += 4) g.fillRect(x, yy, w, 1.5);
}
