// Last Train Home — 80s Cel Anime (LEMO_CINEMATIC_LAB MASTER 08). Page contract: window.render(t), DUR, EV, READY.
import { canvas, W, H } from './lib/cel.js';
import { makePost } from './lib/post.js';
import { resetSil, stampSil } from './lib/celgroup.js';
import { DUR, SHOTS, shotAt, FPS } from './timeline.js';
import { loadLipsync } from './lipsync.js';
import { hud } from './hud.js';
import { buildEvents } from './events.js';
import { streetFar, streetMid, streetGround, puddlePlate, stationWide } from './bg/plates1.js';
import { smear } from './bg/paint.js';
import * as SA from './shots_a.js';

const qs = new URLSearchParams(location.search);
const [sc, g] = canvas(W, H), [gc, e] = canvas(W, H), [ovc, ov] = canvas(W, H);
const post = makePost(document.getElementById('gl'));
const TEST = qs.get('test');
const testMod = TEST ? await import('./test.js') : null;
await document.fonts.load('600 54px "Barlow SC"'); await document.fonts.load('700 54px "Barlow SC"');
await loadLipsync('data/lipsync.json');
let DURS = {}; try { const r = await fetch('data/durs.json'); if (r.ok) DURS = await r.json(); } catch (x) { }

// —— plates, painted once ——
const A = {};
if (!testMod) {
  A.far = streetFar(); A.mid = streetMid(); A.midS = smear(A.mid.c, 18, 8); A.midSE = smear(A.mid.ec, 18, 8); A.ground = streetGround(A.mid);
  A.puddle = puddlePlate(); A.station = stationWide();
  const [bc, bg] = canvas(A.mid.w / 2, 540); bg.filter = 'blur(10px)'; bg.drawImage(A.mid.c, 0, 0, A.mid.w / 2, 540); A.blurMid = bc;
  const [bec, beg] = canvas(A.mid.w / 2, 540); beg.filter = 'blur(12px)'; beg.drawImage(A.mid.ec, 0, 0, A.mid.w / 2, 540); A.blurMidE = bec;
  const more = await Promise.all([import('./shots_b.js').catch(() => null), import('./shots_c.js').catch(() => null)]);
  A.B = more[0]; A.C = more[1];
  if (A.B?.init) await A.B.init(A); if (A.C?.init) await A.C.init(A);
}
const FN = { ...SA };
const RAWP = { bloom: 0, halo: 0, soft: 0, flick: 0, lift: 0, contrast: 0, fade: 0, sat: 1, tint: [1, 1, 1], scan: 0, grille: 0, bleed: 1, rshift: 0, glow: 0, corner: 0, noiseA: 0, power: 1, track: 0, expo: 1 };

function render(t) {
  for (const x of [g, e]) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; }
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H); resetSil();
  let over = {};
  if (testMod) ({ run: testMod.testRun, kit: testMod.testKit }[TEST] || testMod.test)(g, e, t, TEST);
  else {
    const [t0, t1, id] = qs.get('shot') ? SHOTS.find(s => s[2] === qs.get('shot')) : shotAt(t);
    const fn = FN[id] || A.B?.[id] || A.C?.[id];
    if (fn) over = fn({ t, lt: t - t0, u: (t - t0) / (t1 - t0), g, e, A, id }) || {};
    else { g.fillStyle = '#222'; g.fillRect(0, 0, W, H); g.fillStyle = '#888'; g.font = '700 60px "Barlow SC"'; g.fillText(id, 80, 120); }
  }
  stampSil(e);
  ov.setTransform(1, 0, 0, 1, 0, 0); ov.clearRect(0, 0, W, H);
  if (!testMod && !qs.get('nosub')) hud(ov, t, DURS);
  const fade = Math.min(1, t / .25) * Math.min(1, (DUR - t) / .9);
  post.render(sc, gc, Math.round(t * FPS), ovc, qs.get('raw') || testMod ? RAWP : { ...over, expo: (over.expo ?? 1.06) * fade });
}
window.render = render; window.DUR = DUR; window.EV = testMod ? [] : buildEvents(A);
render(parseFloat(qs.get('t') ?? '1'));
window.READY = true;
