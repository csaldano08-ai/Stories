// S3 close-up: AKI's forearm and gold watch as one big pixel sprite (160×90 px), drawn from ramps with Bayer dither,
// lit in the scene like every other billboard. The second hand steps once a second; raindrops sit on the crystal.
import { PX, ramp, hex, h2 } from './px.js';

const C = {
  coat: ramp(['#5c140d', '#a82b22', '#e4472d', '#ff8f62'], .22), skin: ramp(['#b87a62', '#dea282', '#f3c9a6', '#ffe2c8'], .22),
  gold: ramp(['#4a3210', '#97702c', '#d8b25c', '#fff0b0'], .22), strap: ramp(['#1a0c06', '#3a2418', '#5a3b2a'], .22),
  dial: ramp(['#cfc2a0', '#efe6cc', '#fffbea'], .22), drop: ramp(['#8fb0d0', '#d0e4f4', '#ffffff'], .22),
};
const INK = hex('#1a1016'), RED = hex('#c8402c');
export const WW = 160, WH = 90;
// sec: seconds shown (41, 42, …); returns a PX
export function drawWatch(P, sec) {
  P.d.data.fill(0);
  const ax = -.1, ca = Math.cos(ax), sa = Math.sin(ax), A = (u, v) => [80 + u * ca - v * sa, 48 + u * sa + v * ca];
  // sleeve (vermilion), from the left edge to the cuff
  P.poly([A(-110, -20), A(-34, -19), A(-34, 19), A(-110, 22)], (x, y) => { const v = (y - (48 - 20)) / 40; return C.coat(.82 - v * .55 + ((x * 3 + y) % 11 === 0 ? -.15 : 0), x, y); });
  P.poly([A(-38, -21), A(-30, -21), A(-30, 21), A(-38, 21)], (x, y) => C.coat(.25, x, y));
  // forearm skin + fist
  P.poly([A(-31, -14), A(40, -12), A(40, 12), A(-31, 15)], (x, y) => { const v = (y - 36) / 26; return C.skin(.78 - v * .45, x, y); });
  P.ellipse(...A(52, 0), 15, 13, (x, y, dx, dy) => C.skin(.72 - dy * .3 - dx * .1, x, y));
  for (const k of [-6, 0, 6]) { const p = A(62, k).map(Math.round); P.set(p[0], p[1], C.skin(.25, 0, 0)); P.set(p[0] - 1, p[1], C.skin(.35, 0, 0)); }
  // strap + case + dial
  P.poly([A(-14, -16), A(14, -16), A(14, 16), A(-14, 16)], (x, y) => C.strap(.5 + (h2(x, y, 2) - .5) * .3, x, y));
  const c = A(0, 0);
  P.ellipse(c[0], c[1], 21, 21, (x, y, dx, dy) => C.gold(.7 - dx * .25 - dy * .3, x, y));
  P.ellipse(c[0], c[1], 17, 17, (x, y, dx, dy) => C.dial(.7 - dy * .2, x, y));
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, r0 = k % 3 ? 14 : 12; for (let r = r0; r <= 15; r++) P.set(Math.round(c[0] + Math.sin(a) * r), Math.round(c[1] - Math.cos(a) * r), INK); }
  const hand = (a, len, col) => { for (let r = 0; r <= len; r += .5) P.set(Math.round(c[0] + Math.sin(a) * r), Math.round(c[1] - Math.cos(a) * r), col); };
  const mm = 58 + sec / 60;
  hand((11 + mm / 60) / 12 * Math.PI * 2, 8, INK); hand(mm / 60 * Math.PI * 2, 12, INK); hand(sec / 60 * Math.PI * 2, 14, RED);
  P.set(Math.round(c[0]), Math.round(c[1]), INK);
  // glints and raindrops on the crystal
  for (const [u, v] of [[-8, -10], [-7, -11], [-6, -10]]) P.set(Math.round(c[0] + u), Math.round(c[1] + v), hex('#ffffff'));
  for (let k = 0; k < 4; k++) { const u = -10 + h2(k, 1, 4) * 20, v = -6 + h2(k, 2, 4) * 14; P.ellipse(c[0] + u, c[1] + v, 1.6, 2, (x, y, dx, dy) => C.drop(.6 - dy * .5, x, y)); }
  P.outline(.35, [22, 14, 30]);
  return P.done();
}
