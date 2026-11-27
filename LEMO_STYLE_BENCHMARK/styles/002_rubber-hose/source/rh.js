// 002 · 1930s Rubber Hose — AKI redrawn as a rubber-hose cartoon girl (same identity: dark bob with a side part, the jacket
// (now mid-dark grey: strictly greyscale), cream roll-neck → white collar, dark legs, the watch on her LEFT wrist, worn over the glove cuff).
// Construction per STYLE §2: constant-width noodle limbs with one smooth bend (no elbows, no knees), white 4-finger gloves,
// pie eyes, big round shoes, one hard form-shadow band (light from upper left), ink stroked thick first then filled (union outline),
// line boil = 3 drawings cycling on twos.
import { path, TAU } from './shared/lib/cel.js';
import { celGroup } from './shared/lib/celgroup.js';
import { hash } from './shared/lib/util.js';

export const G = {   // greyscale ramp (warm paper greys) — characters own the extremes
  ink: '#121010', white: '#f7f4ee', hair: { f: '#1c1a1a', s: '#100e0e', l: '#060505' }, skin: { f: '#efe9df', s: '#c9c1b4', l: '#121010' },
  jacket: { f: '#4e4a47', s: '#353230', h: '#6a6560', l: '#121010' }, collar: { f: '#f0ece4', s: '#cbc5ba', l: '#121010' },
  legs: { f: '#2a2726', s: '#1c1a19', l: '#121010' }, glove: { f: '#f7f4ee', s: '#d2ccc2', l: '#121010' }, shoe: { f: '#151313', s: '#0a0909', l: '#060505' },
  watch: { f: '#bdb6aa', s: '#8f897f', l: '#121010' },
};
const LGT = { sh: [-5, -5] };                     // shadow band on the lower right (light from upper left)
let BOIL = 0;
export const setBoil = k => { BOIL = k; };
const bj = (x, y, i) => [x + (hash(BOIL * 31.7 + i * 7.13) - .5) * 2.4, y + (hash(BOIL * 17.3 + i * 3.71) - .5) * 2.4];   // ±1.2 px boil
const P = (pts, closed = true) => path(pts.map((p, i) => { const q = bj(p[0], p[1], i); return p[2] ? [...q, 1] : q; }), closed);

// a noodle limb: constant width, ONE smooth bend (quadratic), round caps — returned as a closed outline polygon
export function noodle(a, b, bend, w) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const c = [mx - dy / L * bend, my + dx / L * bend], pts = [], N = 14;
  for (let i = 0; i <= N; i++) { const u = i / N, x = (1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], y = (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]; pts.push([x, y]); }
  const L1 = [], R1 = [];
  pts.forEach((p, i) => { const q = pts[Math.min(N, i + 1)], o = pts[Math.max(0, i - 1)], tx = q[0] - o[0], ty = q[1] - o[1], tl = Math.hypot(tx, ty) || 1;
    L1.push([p[0] - ty / tl * w / 2, p[1] + tx / tl * w / 2]); R1.push([p[0] + ty / tl * w / 2, p[1] - tx / tl * w / 2]); });
  const band = P([...L1, ...R1.reverse()]);
  for (const e of [pts[0], pts[N]]) { band.moveTo(e[0] + w / 2, e[1]); band.arc(e[0], e[1], w / 2, 0, TAU); }   // round caps (union outline merges them)
  return band;
}
const ell = (cx, cy, rx, ry, n = 18, a0 = 0) => P(Array.from({ length: n }, (_, i) => { const a = a0 + i / n * TAU; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; }));

// glove: palm + 3 fat fingers + thumb + flared cuff with a fold line and 3 stitch lines. a = pointing angle; open 0 (fist) … 1 (open)
export function glove(g, x, y, a, s, open = .5, lw = 3) {
  g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
  const sh = [ell(0, 0, 13, 12), P([[-13, -4], [-24, -12], [-26, -6], [-14, 6]])];
  for (let k = 0; k < 3; k++) { const yy = -8 + k * 8; sh.push(P([[8, yy - 3.6], [8 + 10 + 9 * open, yy - 4.4], [8 + 15 + 9 * open, yy], [8 + 10 + 9 * open, yy + 4.4], [8, yy + 3.6]])); }
  sh.push(P([[-2, -11], [6 + 4 * open, -20 - 4 * open], [12 + 3 * open, -18 - 4 * open], [8, -9]]));
  celGroup(g, sh, G.glove, LGT, { lw });
  celGroup(g, [P([[-12, -9], [-26, -14], [-27, 14], [-12, 9]])], G.glove, LGT, { lw });   // flared cuff
  g.strokeStyle = G.ink; g.lineWidth = 1.6;
  for (const yy of [-4, 0, 4]) { g.beginPath(); g.moveTo(-2, yy); g.lineTo(5, yy * 1.1); g.stroke(); }
  g.restore();
}
// pie eye: white oval, big black pupil (~64 % × 74 %) with a wedge cut toward the upper right; lid in body colour for blinks
export function pieEye(g, x, y, rx, ry, look = [0, 0], lid = 0, lw = 3) {
  celGroup(g, [ell(x, y, rx, ry)], { f: G.white, l: G.ink }, {}, { lw });
  const px = x + look[0] * rx * .25, py = y + look[1] * ry * .2, pr = rx * .64, pv = ry * .74;
  g.save(); g.fillStyle = G.ink; g.beginPath(); g.ellipse(px, py + ry * .08, pr, pv, 0, 0, TAU); g.fill();
  g.fillStyle = G.white; g.beginPath(); g.moveTo(px, py); g.arc(px, py + ry * .08, pr * 1.02, -1.25, -.62); g.closePath(); g.fill(); g.restore();
  if (lid > 0) { celGroup(g, [P([[x - rx * 1.05, y - ry * 1.05], [x + rx * 1.05, y - ry * 1.05], [x + rx * 1.05, y - ry + ry * 2 * lid], [x - rx * 1.05, y - ry + ry * 2 * lid]])], { f: G.skin.f, l: G.ink }, {}, { lw: lw * .8 }); }
}

// the whole figure. p = { x, y (feet/ground), s, lean, sq (squash: <1 squashed), hip:[dx,dy] bob, legs:[{foot:[x,y],bend}], arms:[{hand:[x,y],bend,open,ang}],
//   eyes:{look,lid,wide}, mouth:'smile'|'O'|'grin'|'wavy', hair:[dx,dy] lag, watch:true (on the near/left arm = arms[0]) }
export function drawRH(g, p) {
  const lw = 3.2 / p.s;
  g.save(); g.translate(p.x, p.y); g.scale(p.s, p.s);
  const sq = p.sq ?? 1, lean = p.lean ?? 0;
  const hip = [p.hip?.[0] || 0, -96 * sq + (p.hip?.[1] || 0)];
  // far leg + far arm first
  const legW = 15, armW = 13;
  const legs = p.legs, arms = p.arms;
  const drawLeg = (L, far) => {
    celGroup(g, [noodle([hip[0] + (far ? -5 : 6), hip[1]], L.foot, L.bend, legW)], far ? { f: G.legs.s, l: G.ink } : G.legs, LGT, { lw });
    g.save(); g.translate(L.foot[0], L.foot[1]); g.rotate(L.toe || 0);
    celGroup(g, [ell(14, -9, 26, 14)], G.shoe, LGT, { lw }); g.fillStyle = G.white; g.beginPath(); g.ellipse(26, -15, 6, 3, -.3, 0, TAU); g.fill();   // shoe + toe glint
    g.restore();
  };
  g.save(); g.translate(hip[0], hip[1]); g.rotate(lean); g.translate(-hip[0], -hip[1]);
  const sh = [hip[0] + 4, hip[1] - 76 * sq];
  const drawArm = (A, far) => {
    celGroup(g, [noodle([sh[0] + (far ? -8 : 8), sh[1] + 6], A.hand, A.bend, armW)], far ? { f: G.jacket.s, l: G.ink } : G.jacket, LGT, { lw });
    glove(g, A.hand[0], A.hand[1], A.ang ?? 0, .78, A.open ?? .4, lw / .78);
    if (!far && p.watch) { g.save(); g.translate(A.hand[0], A.hand[1]); g.rotate(A.ang ?? 0); celGroup(g, [ell(-17, 0, 7.5, 7.5)], G.watch, LGT, { lw: lw * .8 }); g.fillStyle = G.white; g.beginPath(); g.arc(-17, 0, 5, 0, TAU); g.fill(); g.restore(); }
  };
  g.restore();
  // world-space limbs (the lean is applied to the torso only; limbs reach their world targets)
  drawArm(arms[1], true); drawLeg(legs[1], true);
  g.save(); g.translate(hip[0], hip[1]); g.rotate(lean); g.translate(-hip[0], -hip[1]);
  // torso: a bean (jacket) with a white collar, body squashes/stretches
  celGroup(g, [P([[hip[0] - 26, hip[1] + 6], [hip[0] - 30, hip[1] - 36 * sq], [hip[0] - 22, hip[1] - 74 * sq], [hip[0] + 4, hip[1] - 84 * sq], [hip[0] + 28, hip[1] - 70 * sq], [hip[0] + 32, hip[1] - 32 * sq], [hip[0] + 26, hip[1] + 6], [hip[0], hip[1] + 12]])], G.jacket, LGT, { lw,
    xs: [P([[hip[0] + 6, hip[1] - 60 * sq], [hip[0] + 34, hip[1] - 40 * sq], [hip[0] + 28, hip[1] + 8], [hip[0] + 8, hip[1] + 10]])] });
  celGroup(g, [P([[hip[0] - 14, hip[1] - 80 * sq], [hip[0] + 4, hip[1] - 70 * sq], [hip[0] + 22, hip[1] - 80 * sq], [hip[0] + 4, hip[1] - 92 * sq]])], G.collar, {}, { lw });
  // head: big round, bob hair with a side part and a forehead curl; pie eyes, small nose, mouth
  const hc = [hip[0] + 10, hip[1] - 84 * sq - 54], hr = 50;
  const hl = p.hair || [0, 0];
  celGroup(g, [P([[hc[0] - 56 + hl[0] * .6, hc[1] + 6 + hl[1]], [hc[0] - 54, hc[1] - 34], [hc[0] - 20, hc[1] - 58], [hc[0] + 26, hc[1] - 56], [hc[0] + 54, hc[1] - 28], [hc[0] + 52, hc[1] + 18], [hc[0] + 40, hc[1] + 30], [hc[0] - 46 + hl[0], hc[1] + 32 + hl[1], 1]])], G.hair, {}, { lw });
  celGroup(g, [ell(hc[0], hc[1], hr * .92, hr)], G.skin, LGT, { lw });
  celGroup(g, [P([[hc[0] - 46, hc[1] - 6], [hc[0] - 44, hc[1] - 36], [hc[0] - 10, hc[1] - 54], [hc[0] + 30, hc[1] - 50], [hc[0] + 46, hc[1] - 26], [hc[0] + 30, hc[1] - 30], [hc[0] + 8, hc[1] - 22],
    [hc[0] - 12, hc[1] - 34, 1], [hc[0] - 24, hc[1] - 18], [hc[0] - 40, hc[1] - 8]])], G.hair, {}, { lw });   // bangs from the side part
  g.save(); g.strokeStyle = G.hair.f; g.lineWidth = 7 / 1; g.lineCap = 'round'; g.beginPath(); g.arc(hc[0] - 8, hc[1] - 30, 9, .2, 4.2); g.stroke(); g.restore();   // the curl
  const E = p.eyes || {}, ew = 12 * (E.wide || 1), eh = 17 * (E.wide || 1);
  pieEye(g, hc[0] + 2, hc[1] + 2, ew, eh, E.look, E.lid, lw); pieEye(g, hc[0] + 30, hc[1] + 2, ew * .9, eh, E.look, E.lid, lw);
  celGroup(g, [ell(hc[0] + 20, hc[1] + 22, 6, 4.5)], { f: G.ink }, {}, { noLine: true });
  g.save(); g.strokeStyle = G.ink; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath();
  const m = p.mouth || 'smile', mx = hc[0] + 16, my = hc[1] + 34;
  if (m === 'O') { g.fillStyle = G.ink; g.ellipse(mx, my, 6, 8, 0, 0, TAU); g.fill(); }
  else if (m === 'wavy') { g.moveTo(mx - 14, my); for (let k = 1; k <= 6; k++) g.lineTo(mx - 14 + k * 4.6, my + (k % 2 ? -3 : 3)); g.stroke(); }
  else { g.arc(mx, my - 8, 14, .35, Math.PI - .35); g.stroke(); g.beginPath(); g.moveTo(mx - 16, my - 6); g.lineTo(mx - 13, my - 2); g.moveTo(mx + 16, my - 6); g.lineTo(mx + 13, my - 2); g.stroke(); }
  g.restore();
  g.restore();
  drawLeg(legs[0], false); drawArm(arms[0], false);
  g.restore();
}

// windmill run (STYLE §5): each foot orbits a circle under the hip; its lowest point lands on the shared footfall times.
export function runPose(t, opt) {
  const { stepT, first } = opt, ph = (t - first) / stepT;            // one step per footfall
  const legs = [0, 1].map(k => {
    const a = Math.PI / 2 - (ph + k) * Math.PI;                      // k=0 near foot down at even steps, far foot at odd
    const r = 48, cx = 6, cy = -44;
    return { foot: [cx + Math.cos(a) * r * 1.25, Math.min(0, cy + Math.sin(a) * r)], bend: 18 * Math.sin(a + .6), toe: -.25 * Math.cos(a) };
  });
  const contact = Math.abs(Math.sin(ph * Math.PI));                  // 0 at a footfall
  const bob = -10 * contact, sq = 1 + .05 * contact - .06 * Math.exp(-contact * 12);
  const arms = [0, 1].map(k => { const a = (ph + k) * Math.PI; return { hand: [24 + Math.cos(a) * 46, -150 + Math.sin(a) * 26 + bob], bend: -22, open: .2, ang: Math.cos(a) * .6 }; });
  return { legs, arms, hip: [0, bob], sq, lean: .28 };
}
