// S14–S20: along the train, the driver, "thank you", boarding, the warm car, the window, the city.
import { W, H, canvas, rgba, mix, path } from './lib/cel.js';
import { clamp, lerp, seg, ss, eio, eo, ei, hash, mulberry, onN, TAU, keys } from './lib/util.js';
import { solveProfile, drawProfile, bundleHands } from './chars/aki.js';
import { drawBust34 } from './chars/aki34.js';
import { drawDriver } from './chars/driver.js';
import { PAL } from './chars/palette.js';
import { secondary } from './chars/motion.js';
import { planGait, footAt } from './lib/rig.js';
import { celGroup, iline, resetSil, silC } from './lib/celgroup.js';
import { rain, groundRain, drips, flare } from './fx.js';
import { trainSide, platformPlate, interiorPlate, cityPlate } from './bg/plates3.js';
import { streetFar } from './bg/plates1.js';
import { T, b, SHOTS, LINES } from './timeline.js';
import { visemeAt } from './lipsync.js';

const shot = id => SHOTS.find(s => s[2] === id);
const LPL = { sh: [6, 2], hi: [2, 1], rim: { c: '#ffbf6a', d: [-3, 0] } };          // platform: train-window warm rim
const LIN = { sh: [-6, 3], hi: [-2, 1], rim: { c: '#fff0c0', d: [2.5, 0] } };       // interior: warm key from the ceiling/right
export async function init(A) {
  A.plat = platformPlate(); A.inter = interiorPlate(); A.city = cityPlate(); A.cityFar = streetFar(4600);
  const [c, g] = canvas(1200, 600); g.filter = 'blur(10px)'; g.drawImage(A.plat.c, 0, 0, 1200 * 2.2, 600 * 1.1); A.platBlur = c;
}
const kitSleep = (t, k = {}) => ({ wet: .5, eyes: .1, pupil: .5, time: t, headTilt: .15, ...k });
// pose helper: arms cradle the bundle
function withBundle(S) { const J0 = solveProfile(S), hb = bundleHands(J0); S.arms = { n: { tgt: hb.n, bend: -1, hand: 'cup' }, f: { tgt: hb.f, bend: -1, hand: 'relax' } }; return solveProfile(S); }

// ——— S14: she hurries along the train, curled round the bundle ———
const S14 = (() => {
  const [t0, t1] = shot('S14_platform'), v = 690, cad = 2.25;
  const contacts = planGait({ t0: t0 - 1, t1: t1 + 1, x0: -v, v, cadence: cad, duty: 1.16, lead: .04, first: 'n', L: 312, strike: -.18, toeoff: .55, flatTo: .5 });
  const pelvisAt = t => [v * (t - t0), -(305 + 3.5 * Math.cos(2 * Math.PI * cad * (t - t0)))];
  const pose = t => { const a = footAt(contacts, 'n', t, pelvisAt, { legLen: 294, run: 0 }), c = footAt(contacts, 'f', t, pelvisAt, { legLen: 294, run: 0 });
    return { pelvis: pelvisAt(t), tL: .1, tU: .24 + .02 * Math.sin(2 * Math.PI * cad * t), neck: .05, head: .12,
      legs: { n: { ball: a.ball, pitch: a.pitch, planted: a.planted }, f: { ball: c.ball, pitch: c.pitch, planted: c.planted } }, arms: { n: { sh: 0, el: 0 }, f: { sh: 0, el: 0 } } }; };
  return { pose, pelvisAt, contacts, t0 };
})();
export function S14_platform({ t, lt, g, e, A }) {
  const s = .62, gy = 1000, pel = S14.pelvisAt(t)[0], camX = pel * s - 760;
  g.drawImage(A.plat.c, -(camX + 1000) * .98, 0); e.drawImage(A.plat.ec, -(camX + 1000) * .98, 0);
  // the train (static) — slightly behind the platform edge
  for (const [c, isE] of [[g, 0], [e, 1]]) { if (isE) continue; c.save(); c.translate(-camX * .96, gy + 4); c.scale(s * .98, s * .98); trainSide(c, e, -4000, 16000, { doorAt: [-1200, 3400, 7900], open: 1 }); c.restore(); }
  // the drizzle beyond the canopy end + drips
  drips(g, t, { x0: 0, x1: W, y: 100, yEnd: 400, n: 10, scale: 1 });
  const S = S14.pose(t), J = withBundle(S);
  const sec = secondary(tt => { const p = S14.pelvisAt(tt); return [p[0], p[1] - 250]; }, S14.t0 - 1, t, { mb: 22 });
  g.save(); g.translate(-camX, gy); g.scale(s, s);
  drawProfile(g, J, { P: PAL.platform, L: LPL, jacket: 0, wet: .9, wetHair: 1, ...sec, face: { open: .9, lid: .2, look: [.5, .2], brow: [-3, 1, 2], mouth: 'pant', blush: .5 }, bundle: { wet: .7, eyes: 1, pupil: .7, time: t, look: [-.5, -.5] } });
  g.restore();
  return {};
}

// ——— S15: the driver leans out of his cab window ———
export function S15_driver({ t, lt, g, e, A }) {
  g.drawImage(A.platBlur, -100, -60, 1200 * 2, 600 * 2);
  rain(g, e, t, { density: .6, layers: [1, 1, 0] });
  // cab side wall (right) with the window opening; he leans out past the wall edge, looking back down the platform (screen left)
  const wall = 1060, wy0 = 170, wy1 = 690;
  g.fillStyle = '#e6e0d2'; g.fillRect(wall, 0, W - wall, H);
  vgrad(g, wall + 40, wy0, 620, wy1 - wy0, '#3a3048', '#1a1426');
  for (let k = 0; k < 5; k++) { const c = ['#59e6ff', '#ffb03a', '#53ffb0'][k % 3]; g.fillStyle = c; g.fillRect(wall + 360 + k * 46, 600, 16, 9); e.fillStyle = rgba(c, .9); e.fillRect(wall + 360 + k * 46, 600, 16, 9); }
  g.fillStyle = '#2a2420'; g.fillRect(wall, 0, 16, H);
  const tq = onN(t, 30, 3), P = PAL.platform;
  const vis = visemeAt('D1', t), smile = ss(seg(tq, LINES[2].t + 1.9, LINES[2].t + 2.4));
  const wave = lt > .4 && lt < 2.7 ? (tq - b(76)) * 1.7 : null, lean = ss(seg(tq, b(76), b(76) + .5));
  g.save(); g.beginPath(); g.rect(0, 0, W, wy1 + 2); g.clip();             // nothing of him below the sill (he is inside the cab)
  g.translate(1330 - lean * 50, 470); g.scale(-2.8, 2.8);   // inside the window opening: the sill crosses his chest
  drawDriver(g, P, { mouth: vis || (smile > .3 ? 'smile' : 'X'), eyes: 1, smile, look: [.7, .15], brow: [-1, -1], wave }, { sh: [5, 2], hi: [2, 1], rim: { c: '#ffd9a0', d: [-1.6, 0] } });
  g.restore();
  // the wall below the sill hides his body below the window; the sill line crosses under his arm
  g.fillStyle = '#e6e0d2'; g.fillRect(wall + 16, wy1, W - wall, H - wy1); g.fillStyle = '#2a2420'; g.fillRect(wall - 30, wy1 - 6, 700, 20);
  g.fillStyle = '#1f8a8a'; g.fillRect(wall + 16, 860, W, 46); g.fillStyle = '#e46a3a'; g.fillRect(wall + 16, 912, W, 10);
  rain(g, e, t, { density: .5, layers: [0, 0, 1] });
  return {};
}
function vgrad(g, x, y, w, h, a, b2) { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, a); gr.addColorStop(1, b2); g.fillStyle = gr; g.fillRect(x, y, w, h); }

// ——— S16: Aki at the open door: a small bow, "Thank you." ———
export function S16_thanks({ t, lt, g, e, A }) {
  g.drawImage(A.platBlur, -600, -80, 1200 * 2.2, 600 * 2.2);
  // the open doorway's warm light on the right of frame
  // train side wall, then the open doorway (warm vestibule: grab pole, seat edge, ceiling light) on the right of frame
  g.fillStyle = '#e6e0d2'; g.fillRect(1330, 0, W - 1330, H); g.fillStyle = '#1f8a8a'; g.fillRect(1330, 860, W, 40);
  vgrad(g, 1450, 0, 470, H, '#fff0c8', '#d89a68'); e.fillStyle = rgba('#ffc878', .42); e.fillRect(1450, 0, 470, H);
  g.fillStyle = rgba('#7a4a30', .5); g.fillRect(1760, 600, 160, 480);                 // seat end in the vestibule
  g.fillStyle = '#d0d6e0'; g.fillRect(1640, 0, 14, H); g.fillStyle = '#ffffff'; g.fillRect(1643, 0, 4, H);   // stainless grab pole
  g.fillStyle = '#fff6dc'; g.fillRect(1450, 40, 470, 18); e.fillStyle = rgba('#fff6dc', .9); e.fillRect(1450, 40, 470, 18);
  g.fillStyle = '#2a2622'; g.fillRect(1436, 0, 18, H); g.fillStyle = '#4a463c'; g.fillRect(1420, 0, 10, H);   // gasket + door edge
  air16(g, 1460, 600, 260, 540);
  const tq = onN(t, 30, 2), P = PAL.platform;
  const bow = Math.sin(clamp((tq - LINES[3].t + .25) / 1.0) * Math.PI) * (tq > LINES[3].t - .25 ? 1 : 0);
  const vis = visemeAt('A3', t), smile = ss(seg(tq, LINES[3].t + 1.2, LINES[3].t + 1.6));
  const face = { open: lerp(.9, .62, smile), smileEyes: smile > .5, look: [.6, -.1], brow: [-3, -2, 2.4], mouth: vis || (smile > .4 ? 'smile' : 'soft'), blush: .7 };
  g.save(); g.translate(820, 520); g.scale(3.1, 3.1);
  drawBust34(g, P, { wet: .95, breathe: t * 3, lean: .12 * bow, head: .05 + .25 * bow, face, kit: { wet: .8, eyes: .8, pupil: .6, time: t, headTilt: .1 }, hair: {}, lift: 4 }, { sh: [-6, 2], hi: [-2, 1], rim: { c: '#ffbf6a', d: [2.2, 0] } });
  g.restore();
  rain(g, e, t, { density: .5, layers: [1, 1, 0] });
  return {};
}

// ——— S17: she steps up through the door; the doors close in front of her; the train starts ———
export function S17_board({ t, lt, g, e, A }) {
  const s = .8, gy = 1010, P = PAL.platform, tq = t;
  g.drawImage(A.plat.c, -1400, 0); e.drawImage(A.plat.ec, -1400, 0);
  const move = ei(seg(t, T.depart, T.depart + 3)) * 900;     // the train pulls away to the right
  const close = eio(seg(t, T.doorClose, T.doorClose + .55));
  const doorX = 1250 / s;                                       // world x of the door centre (screen ≈ 1250 + offset)
  const ox = 0, trainX = -move / s;
  // 1) train body + open doorway (interior behind her)
  g.save(); g.translate(ox, gy); g.scale(s, s);
  trainSide(g, e, trainX - 3000, 7000, { doorAt: [doorX + trainX], open: 1 });
  g.restore();
  // 2) Aki: walks to the door (profile, facing right), steps up onto the threshold, then into the doorway (smaller, higher)
  const arrive = b(85) + .45, step = T.doorStep, inside = step + .5;
  const v = 560, x0 = doorX - v * (arrive - b(85)) - 60;
  const X = tt => tt < arrive ? x0 + v * (tt - b(85)) : x0 + v * (arrive - b(85)) + 60 * ss(seg(tt, step, inside));
  const C = [...planGait({ t0: b(85) - 1, t1: arrive - .2, x0: x0 - v, v, cadence: 2.1, duty: 1.18, lead: .02, first: 'f', L: 312, strike: -.15, toeoff: .5 }).filter(c => c.t0 < arrive - .25),
    { foot: 'n', t0: step, t1: 99, x: doorX + 10, y: -32, strike: -.1, hold: 1 }, { foot: 'f', t0: inside - .1, t1: 99, x: doorX - 30, y: -32, strike: 0, hold: 1 }];
  const lastF = C.filter(c => c.foot === 'f' && c.t1 < 50).pop(); if (lastF) lastF.t1 = Math.max(lastF.t1, inside - .35);
  const lastN = C.filter(c => c.foot === 'n' && c.t1 < 50).pop(); if (lastN) lastN.t1 = Math.max(lastN.t1, step - .3);
  const pelvisAt = tt => [X(tt), -305 - 32 * ss(seg(tt, step + .05, inside))];
  const a = footAt(C, 'n', tq, pelvisAt, { legLen: 294, run: 0 }), c2 = footAt(C, 'f', tq, pelvisAt, { legLen: 294, run: 0 });
  const S = { pelvis: pelvisAt(tq), tL: .08 + .06 * Math.sin(seg(tq, step - .2, inside) * Math.PI), tU: .18, neck: .04, head: .06, legs: { n: { ball: a.ball, pitch: a.pitch, planted: a.planted }, f: { ball: c2.ball, pitch: c2.pitch, planted: c2.planted } }, arms: { n: { sh: 0, el: 0 }, f: { sh: 0, el: 0 } } };
  const J = withBundle(S);
  const sec = secondary(tt => { const p = pelvisAt(tt); return [p[0], p[1] - 250]; }, b(85) - 1, t, { mb: 22 });
  const depth = ss(seg(tq, step + .2, inside + .3));   // into the doorway: a touch smaller and higher
  if (close < 1) {
    g.save(); g.translate(ox + (doorX * s) * depth * .04 - move, gy - 14 * depth); g.scale(s * (1 - .04 * depth), s * (1 - .04 * depth));
    drawProfile(g, J, { P: lerpPal(depth), L: LPL, jacket: 0, wet: .9, wetHair: 1, ...sec, face: { open: .9, look: [.5, 0], mouth: 'soft', blush: .5 }, bundle: kitSleep(t, { eyes: .8 }) });
    g.restore();
  }
  // 3) door leaves close in front of her
  if (close > 0) { g.save(); g.translate(ox, gy); g.scale(s, s); doorLeaves(g, e, doorX + trainX, close); g.restore(); }
  return {};
}
function air16(g, x, y, rx, ry) { const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, 'rgba(255,200,130,.22)'); gr.addColorStop(1, 'rgba(255,200,130,0)'); g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx, 0, 7); g.fill(); g.restore(); }
function lerpPal(d) { return d > .5 ? PAL.window : PAL.platform; }
function doorLeaves(g, e, cx, close) {
  const w = 480, top = -760, lw = w / 2, sl = (1 - close) * lw * .95;
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? cx - lw - sl : cx + sl;
    g.fillStyle = '#e6e0d2'; g.fillRect(x0, top, lw, -top);
    g.fillStyle = '#2a2420'; g.fillRect(x0 + 40, top + 120, lw - 80, 280);
    g.fillStyle = '#f2c88a'; g.fillRect(x0 + 46, top + 126, lw - 92, 268);
    g.fillStyle = '#1f8a8a'; g.fillRect(x0, -250, lw, 34);
    g.strokeStyle = '#4a463c'; g.lineWidth = 4; g.strokeRect(x0, top, lw, -top);
  }
}

// ——— S18: the warm car — she sits by the window; the kitten yawns and falls asleep; light bands sweep across ———
const [bc, bgx] = canvas(W, H);
export function S18_interior({ t, lt, g, e, A }) {
  const P = PAL.interior, s = 1.45, gy = 1190, tq = onN(t, 30, 2);
  const run = Math.max(0, t - T.depart) * 900 * ss(seg(t, T.depart, T.depart + 4));   // city scroll (px)
  // the city through the windows (behind the window wall), then the interior plate with window holes
  g.save(); g.beginPath(); for (let k = 0; k < 3; k++) g.rect(120 + k * 600, 200, 480, 330); g.clip();
  const cx = (run * .6) % (A.cityFar.w - W);
  g.drawImage(A.cityFar.c, -cx, -260); e.save(); e.beginPath(); for (let k = 0; k < 3; k++) e.rect(120 + k * 600, 200, 480, 330); e.clip(); e.drawImage(A.cityFar.ec, -cx, -260); e.restore();
  g.restore();
  // interior wall around the windows
  g.save(); g.beginPath(); g.rect(0, 0, W, H); for (let k = 0; k < 3; k++) g.rect(120 + k * 600, 200, 480, 330); g.clip('evenodd');
  g.drawImage(A.inter.c, 0, 0); e.drawImage(A.inter.ec, 0, 0); g.restore();
  for (let k = 0; k < 3; k++) { g.strokeStyle = '#6a4a34'; g.lineWidth = 16; g.strokeRect(120 + k * 600, 200, 480, 330); }
  // seat: backrest (behind her, left) + cushion
  const seatX = 760, seatY = -170;   // seat in world units; screen x of the figure origin = seatX
  const seat = { f: '#2f6a6a', s: '#1e4848', h: '#4a9a9a', l: '#0e2424' };
  g.save(); g.translate(seatX - 40, gy); g.scale(s, s);
  // cross-seat: upright backrest with a rounded top (behind her), deep cushion, metal frame to the floor
  celGroup(g, [path([[-150, seatY + 10], [-150, -560], [-138, -600], [-90, -612], [-62, -596], [-56, -560], [-62, seatY - 10]])], seat, LIN, { lw: 2.4, sil: false });
  iline(g, path([[-118, -540], [-118, seatY - 20]], false), seat.l, 1.4);
  celGroup(g, [path([[-120, seatY - 34], [190, seatY - 30], [214, seatY - 14], [210, seatY + 14], [-120, seatY + 14]])], seat, LIN, { lw: 2.4, sil: false });
  g.fillStyle = '#3a2a22'; g.fillRect(-100, seatY + 20, 320, -seatY - 20);
  g.restore();
  // the sit: from standing in front of the seat to seated (pelvis lands on the cushion; feet stay planted)
  const sit = eio(seg(tq, T.sit, T.sit + 1.4)), land = seg(tq, T.sit + 1.2, T.sit + 1.4);
  const pel = [lerp(110, 20, sit), -lerp(308, 178 + 4 * Math.sin(land * Math.PI), sit)];
  const S = { pelvis: pel, tL: lerp(.08, -.05, sit) + .25 * Math.sin(sit * Math.PI), tU: lerp(.12, .02, sit) + .3 * Math.sin(sit * Math.PI), neck: .05, head: lerp(.1, .22, ss(seg(tq, T.yawn - .6, T.yawn))),
    legs: { n: { ball: [210, 0], pitch: 0, planted: 1 }, f: { ball: [170, 0], pitch: 0, planted: 1 } }, arms: { n: { sh: 0, el: 0 }, f: { sh: 0, el: 0 } } };
  const J = withBundle(S);
  const smile = ss(seg(tq, T.yawn + .9, T.yawn + 1.4));
  const yawn = Math.sin(clamp((tq - T.yawn) / .9) * Math.PI);
  const kit = { wet: .3, eyes: tq < T.yawn ? .9 : tq < T.yawn + .9 ? .2 : .05, pupil: .6, time: t, yawn: tq > T.yawn ? yawn : 0, headTilt: .2 + .1 * (tq > T.yawn + .9 ? 1 : 0) };
  resetSil();
  g.save(); g.translate(seatX, gy); g.scale(s, s);
  drawProfile(g, J, { P, L: LIN, jacket: 0, wet: .6, wetHair: 1, hair: {}, face: { open: lerp(.9, .55, smile), smileEyes: smile > .5, look: [.4, .9], brow: [-2, -1, 2.2], mouth: smile > .4 ? 'smile' : 'soft', blush: .8 }, bundle: kit });
  g.restore();
  // light bands from the passing lamps sweep across her (only on her cel: masked by the silhouette)
  const sp = 1400;
  bgx.setTransform(1, 0, 0, 1, 0, 0); bgx.clearRect(0, 0, W, H);
  for (let k = 0; k < 6; k++) {
    const x = ((k * 700 - run * 1.3) % 4200 + 4200) % 4200 - 600;
    const gr = bgx.createLinearGradient(x - 160, 0, x + 160, 0); gr.addColorStop(0, 'rgba(255,214,150,0)'); gr.addColorStop(.5, 'rgba(255,214,150,.42)'); gr.addColorStop(1, 'rgba(255,214,150,0)');
    bgx.save(); bgx.translate(x, H / 2); bgx.transform(1, 0, -.25, 1, 0, 0); bgx.translate(-x, -H / 2); bgx.fillStyle = gr; bgx.fillRect(x - 160, -200, 320, H + 400); bgx.restore();
  }
  bgx.globalCompositeOperation = 'destination-in'; bgx.drawImage(silC, 0, 0); bgx.globalCompositeOperation = 'source-over';
  g.save(); g.globalCompositeOperation = 'lighter'; g.drawImage(bc, 0, 0); g.restore();
  // rain on the windows, thinning
  const thin = 1 - ss(seg(t, b(96), b(102)));
  if (thin > 0) { g.save(); g.beginPath(); for (let k = 0; k < 3; k++) g.rect(120 + k * 600, 200, 480, 330); g.clip(); rain(g, null, t, { density: .7 * thin, wind: 1.6, speed: .5, glints: false, alpha: .8 }); g.restore(); }
  return { bloom: .7, sat: 1.08 };
}

// ——— S19: from outside, tracking with the train: her window; the city slides over the glass; the rain stops ———
export function S19_window({ t, lt, g, e, A }) {
  const P = PAL.window, run = (t - T.depart) * 1100;
  // train body around the window
  g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1f8a8a'; g.fillRect(0, 900, W, 50); g.fillStyle = '#e46a3a'; g.fillRect(0, 956, W, 12);
  const wx = 420, wy = 150, ww = 1080, wh = 680;
  g.fillStyle = '#2a2420'; g.fillRect(wx - 18, wy - 18, ww + 36, wh + 36);
  // interior behind the glass
  g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
  vgrad(g, wx, wy, ww, wh, '#f0cc94', '#b87a54'); e.fillStyle = rgba('#ffc878', .35); e.fillRect(wx, wy, ww, wh);
  const tq = onN(t, 30, 2), look = ss(seg(tq, b(102) + .6, b(102) + 1.4));
  g.translate(980, 600); g.scale(2.6, 2.6);
  drawBust34(g, P, { wet: .4, breathe: t * 2.2, head: lerp(.2, -.02, look), face: { open: lerp(.6, .8, look), smileEyes: look < .5, look: [lerp(.3, .9, look), lerp(.8, -.1, look)], mouth: 'smile', blush: .7 }, kit: kitSleep(t, { eyes: 0 }), hair: {}, lift: 4 }, { sh: [-5, 2], hi: [-2, 1], rim: { c: '#fff0c0', d: [2, 0] } });
  g.restore();
  // reflections of the city sliding over the glass (blurred streaks), and the last raindrops being blown back
  g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip(); g.globalCompositeOperation = 'screen';
  const r = mulberry(4);
  for (let k = 0; k < 26; k++) { const col = ['#ff5fb3', '#59e6ff', '#ffd36a', '#9b7bff'][k % 4], y = wy + r() * wh, x = ((r() * 4000 - run * (.8 + r() * .6)) % 4000 + 4000) % 4000 - 600; g.fillStyle = rgba(col, .16); g.fillRect(x, y, 300 + r() * 400, 8 + r() * 30); }
  g.globalCompositeOperation = 'source-over';
  const rainLeft = 1 - ss(seg(t, b(103), b(108)));
  for (let k = 0; k < 40 * rainLeft; k++) { const y = wy + hash(k * 3.1) * wh, x = wx + ((hash(k * 7.7) * ww - (t * 380 * (1 + hash(k))) % ww) + ww) % ww; g.strokeStyle = rgba('#ffffff', .4); g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40, y - 3); g.stroke(); }
  g.fillStyle = rgba('#ffffff', .08); g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + 320, wy); g.lineTo(wx + 80, wy + wh); g.lineTo(wx, wy + wh); g.fill();
  g.restore();
  // a passing catenary post now and then (motion, on ones)
  const px = ((-run * 1.4) % 2600 + 2600) % 2600 - 300; g.save(); g.filter = 'blur(8px)'; g.fillStyle = '#0a0812'; g.fillRect(px, 0, 60, H); g.restore();
  return {};
}

// ——— S20: the city, rain gone; the train is a string of warm windows crossing the viaduct ———
export function S20_city({ t, lt, g, e, A }) {
  const C = A.city, tilt = eio(seg(lt, .8, 5.4)), y = lerp(420, 120, tilt), x = 300 + lt * 30;
  g.drawImage(C.c, -x, -y); e.drawImage(C.ec, -x, -y);
  // the train on the viaduct
  const tx = 380 + (t - b(110)) * 240;
  for (let k = 0; k < 4; k++) {
    const cx = tx + k * 180 - x, cy = 1150 - 26 - y;
    g.fillStyle = '#d8d2c4'; g.fillRect(cx, cy, 172, 26); g.fillStyle = '#1f8a8a'; g.fillRect(cx, cy + 18, 172, 4);
    for (let j = 0; j < 6; j++) { g.fillStyle = '#ffd99a'; g.fillRect(cx + 10 + j * 27, cy + 6, 18, 9); e.fillStyle = rgba('#ffc878', .95); e.fillRect(cx + 10 + j * 27, cy + 6, 18, 9); }
  }
  return { bloom: .9 };
}

export function events(add) {
  for (const c of [0, 1, 2, 3, 4, 5, 6, 7, 8]) add('step_hurry', b(70) + .1 + c * (1 / 2.25), { v: .6 });
  add('voice_bed', b(76), {});
  add('window_slide', b(76) - .1, { v: .5 }); add('cloth', b(81) + .2, { v: .5 });
  add('step_hurry', b(85) + .2, { v: .5 }); add('step_up', T.doorStep, { v: .8 }); add('step_soft', T.doorStep + .45, { v: .5 });
  add('door_chime', T.doorChime, { v: .7 }); add('door_close', T.doorClose, { v: .9 });
  add('train_depart', T.depart, { d: b(110) - T.depart });
  add('seat', T.sit + 1.25, { v: .7 }); add('cloth', T.sit + .1, { v: .5 });
  add('yawn_kitten', T.yawn, { v: .6 });
}
