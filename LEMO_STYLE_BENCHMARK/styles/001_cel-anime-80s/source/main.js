// 001 · 80s Cel Anime — page contract: window.render(t), DUR, READY; RIGQA(t) for the automated rig check.
import { canvas, W, H } from './shared/lib/cel.js';
import { makePost } from './shared/lib/post.js';
import { resetSil, stampSil } from './shared/lib/celgroup.js';
import { DUR, FPS, shotAt } from './shared/clip10.js';
import { streetFar, streetMid, streetGround, puddlePlate, stationWide } from './bg/plates1.js';
import { smear } from './bg/paint.js';
import * as SH from './shots.js';
import { solveProfile } from './shared/aki2/aki_profile.js';
const qs = new URLSearchParams(location.search);
const [sc, g] = canvas(W, H), [gc, e] = canvas(W, H), [ovc, ov] = canvas(W, H);
const post = makePost(document.getElementById('gl'));
await document.fonts.load('700 54px "Barlow SC"');
const A = {};
A.far = streetFar(); A.mid = streetMid(); A.midS = smear(A.mid.c, 18, 8); A.midSE = smear(A.mid.ec, 18, 8); A.ground = streetGround(A.mid);
A.puddle = puddlePlate(); A.station = stationWide();
const RAWP = { bloom: 0, halo: 0, soft: 0, flick: 0, lift: 0, contrast: 0, fade: 0, sat: 1, tint: [1, 1, 1], scan: 0, grille: 0, bleed: 1, rshift: 0, glow: 0, corner: 0, noiseA: 0, power: 1, track: 0, expo: 1 };
function render(t) {
  for (const x of [g, e]) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; }
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H); resetSil();
  const [t0, t1, id] = shotAt(t);
  const over = SH[id]({ t, lt: t - t0, u: (t - t0) / (t1 - t0), g, e, A }) || {};
  stampSil(e); ov.clearRect(0, 0, W, H);
  post.render(sc, gc, Math.round(t * FPS), ovc, qs.get('raw') ? RAWP : { ...over, expo: (over.expo ?? 1.06) * Math.min(1, t / .2) });
}
window.render = render; window.DUR = DUR; window.EV = [];
window.RIGQA = t => { const J = solveProfile(SH.poseAt(t)); return { t, leg: J.leg, arm: J.arm, adjust: J.qa.legAdjust }; };
render(parseFloat(qs.get('t') ?? '1')); window.READY = true;
