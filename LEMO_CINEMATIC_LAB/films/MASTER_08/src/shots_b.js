// S6–S13: the brake and the turn, the eyes, the kitten's view, the walk back and the crouch, the kitten answers,
// the hands, the clock passes midnight, she stands with the bundle.
import { W, H, canvas, rgba, mix, path } from './lib/cel.js';
import { clamp, lerp, seg, ss, eio, eo, hash, mulberry, onN, TAU, keys } from './lib/util.js';
import { solveProfile, drawProfile } from './chars/aki.js';
import { head34 } from './chars/head.js';
import { hairUnder, hairOver } from './chars/hair.js';
import { drawKitten } from './chars/kitten.js';
import { drawBust34 } from './chars/aki34.js';
import { handTop } from './chars/handtop.js';
import { PAL } from './chars/palette.js';
import { secondary } from './chars/motion.js';
import { planGait, footAt, lagOffset } from './lib/rig.js';
import { celGroup, iline } from './lib/celgroup.js';
import { rain, groundRain, drips } from './fx.js';
import { forecourt, drawBench } from './bg/plates2.js';
import { clockFace, hands as clockHands } from './bg/plates1.js';
import { T, b, SHOTS, LINES } from './timeline.js';
import { visemeAt } from './lipsync.js';

const L_FC = { sh: [-8, 2], hi: [-3, 1], rim: { c: '#59e6ff', d: [3, 0] } };   // forecourt: key from the station doors (right), cyan rim from the stair rail
export async function init(A) {
  A.fc = forecourt();
  const [bc, bg] = canvas(1300, 540); bg.filter = 'blur(9px)'; bg.drawImage(A.fc.c, 0, 0, 1300, 540); A.fcBlur = bc;
  const [bec, beg] = canvas(1300, 540); beg.filter = 'blur(10px)'; beg.drawImage(A.fc.ec, 0, 0, 1300, 540); A.fcBlurE = bec;
}
const shot = id => SHOTS.find(s => s[2] === id);
function fig(g, J, o, ox, oy, s, mirror) { g.save(); g.translate(ox, oy); g.scale(mirror ? -s : s, s); drawProfile(g, J, o); g.restore(); }

// ——— S6: brake & turn (static camera; she runs in from the left) ———
const S6 = (() => {
  const [t0] = shot('S6_brake'), D = 1.05, x0 = 0, v = 1450;
  const X = t => { const u = seg(t, t0, t0 + D); return t < t0 ? x0 + v * (t - t0) : x0 + v * D * u - v * D * (u * u * u - u * u * u * u / 2); };
  const Xf = X(t0 + D + 1);
  const contacts = [
    { foot: 'f', t0: t0 - .33, t1: t0 - .1, x: X(t0 - .21) + 22 },
    { foot: 'n', t0: t0 + .02, t1: t0 + .26, x: X(t0 + .14) + 30, strike: -.2, toeoff: .7 },
    { foot: 'f', t0: t0 + .32, t1: t0 + .62, x: X(t0 + .47) + 55, strike: -.3, toeoff: .5 },
    { foot: 'n', t0: t0 + .64, t1: 99, x: Xf + 46, strike: -.35, hold: 0 },
    { foot: 'f', t0: t0 + .98, t1: 99, x: Xf - 26, strike: -.15, hold: 0 },
  ];
  const pelY = t => -keys([[t0 - .5, 300], [t0 + .5, 298], [t0 + .9, 292], [t0 + 1.3, 309], [t0 + 2, 311]], t);
  const pelvisAt = t => [X(t), pelY(t)];
  const P = { legLen: 294, run: 1 };
  const pose = t => {
    const fN = footAt(contacts, 'n', t, pelvisAt, P), fF = footAt(contacts, 'f', t, pelvisAt, P);
    const lean = keys([[t0, .15], [t0 + .75, -.12], [t0 + 1.25, .03]], t), brace = ss(seg(t, t0 + .3, t0 + .8)) * (1 - ss(seg(t, t0 + 1.2, t0 + 1.7)));
    const sw = 1 - ss(seg(t, t0 + .1, t0 + .7)), c = Math.cos(2 * Math.PI * (t - t0) * 1.45);
    return { pelvis: pelvisAt(t), tL: lean * .7, tU: lean, neck: .03, head: -lean * .4 + keys([[t0 + 1.2, 0], [t0 + 1.5, -.08], [t0 + 1.8, .05]], t),
      legs: { n: { ball: fN.ball, pitch: fN.pitch, planted: fN.planted }, f: { ball: fF.ball, pitch: fF.pitch, planted: fF.planted } },
      arms: { n: { sh: -.5 * c * sw + .35 * brace - .05, el: lerp(1.6, .5, 1 - sw) + .3 * brace, wr: .2, hand: brace > .3 ? 'open' : sw > .5 ? 'fist' : 'relax' },
              f: { sh: .5 * c * sw + .2 * brace - .1, el: lerp(1.6, .4, 1 - sw) + .2 * brace, wr: .2, hand: brace > .3 ? 'open' : sw > .5 ? 'fist' : 'relax' } } };
  };
  return { pose, pelvisAt, contacts, t0, Xf };
})();
export function S6_brake({ t, lt, g, e, A }) {
  const s = .8, gy = 1000, camPan = 360 - 120 * eo(seg(lt, 0, 1.1));
  g.drawImage(A.fc.c, -camPan, 0); e.drawImage(A.fc.ec, -camPan, 0);
  // bench (left), kitten under it — a tiny grey shape you can spot if you look
  const bx = 330 - camPan * .0;
  g.save(); g.translate(bx, gy); g.scale(s, s); drawBench(g, PAL.canopy, L_FC, 2.6); g.restore();
  g.save(); g.translate(bx + 205 * s, gy); g.scale(s * .95, s * .95); drawKitten(g, PAL.canopy, { wet: 1, shiver: 1, time: t, eyes: 1, pupil: .9, tail: t * 2 }, L_FC); g.restore();
  drips(g, t, { x0: bx - 10, x1: bx + 370, y: gy - 152 * s, yEnd: gy, n: 8, scale: .9 });
  // the figure; the turn happens on twos with one squash/smear in-between (limited animation)
  const tq = onN(t, 30, 2), tTurn = S6.t0 + 1.72;
  const S = S6.pose(t), J = solveProfile(S);
  const sec = secondary(tt => { const p = S6.pelvisAt(tt); return [p[0], p[1] - 250]; }, S6.t0 - 2, t);
  const look = ss(seg(t, S6.t0 + 1.1, S6.t0 + 1.4));
  const face = { open: 1.05, lid: 0, brow: [-5 * look, -3 * look, 2.6], look: [lerp(.3, -.8, look), .1], mouth: t < S6.t0 + .9 ? 'pant' : 'X', blush: .4 };
  const o = { P: PAL.canopy, L: L_FC, jacket: 1, ...sec, face };
  const ox = 1240 - S6.Xf * s - camPan + 360;
  if (tq < tTurn) fig(g, J, o, ox, gy, s, false);
  else if (tq < tTurn + 2 / 30) {   // smear frame: compressed, blurred silhouette mid-turn
    g.save(); g.filter = 'blur(3px)'; g.translate(ox + S6.Xf * s, gy); g.scale(.3, 1); g.translate(-(ox + S6.Xf * s), -gy); fig(g, J, o, ox, gy, s, false); g.restore(); g.filter = 'none';
  } else {
    const S2 = S6.pose(t); const px = S6.Xf;
    // facing left: mirror about her own pelvis; she looks down toward the bench
    S2.head += .12 * ss(seg(t, tTurn + .1, tTurn + .5)); S2.arms.n = { sh: .02, el: .15, wr: .1, hand: 'relax' }; S2.arms.f = { sh: -.05, el: .2, wr: .1, hand: 'relax' };
    const J2 = solveProfile(S2);
    const sec2 = secondary(tt => { const p = S6.pelvisAt(tt); return tt < tTurn ? [p[0], p[1] - 250] : [2 * px - p[0] + 60, p[1] - 250]; }, S6.t0 - 2, t);
    g.save(); g.translate(ox + 2 * px * s, gy); g.scale(-s, s); drawProfile(g, J2, { ...o, ...sec2, face: { open: 1, look: [.5, .5], brow: [-4, -2, 2.4], mouth: 'X' } }); g.restore();
  }
  groundRain(g, t, { band: [905, 1080], n: 70, camX: camPan });
  rain(g, e, t, { camX: camPan, density: 1 });
  return {};
}

// ——— S7: extreme close-up on her eyes (she faces left now: mirrored 3/4 head) ———
export function S7_eyes({ t, lt, g, e, A }) {
  g.drawImage(A.fcBlur, -200, -300, 2600, 1080 * 1.6); e.globalAlpha = .6; e.drawImage(A.fcBlurE, -200, -300, 2600, 1080 * 1.6); e.globalAlpha = 1;
  const push = 15 + lt * .5, P = PAL.canopy;
  const tq = onN(t, 30, 3);
  const blink = tq > b(30) + 1.15 && tq < b(30) + 1.25;
  const down = ss(seg(tq, b(30) + .55, b(30) + .95));
  const f = { open: blink ? 0 : lerp(1.05, .92, down), lid: .05 + down * .12, iris: lerp(1, .9, down), look: [lerp(-.2, .55, down), lerp(-.1, .75, down)], brow: [-6 + 2 * down, -2, 2.8 - down], mouth: 'soft', reflect: '#59e6ff', glint: down > .9 ? .8 : 0 };
  g.save(); g.translate(960, 560); g.scale(-push, push); g.translate(-7.5, -2);
  const o = { P, L: { sh: [3, .8], hi: [1.2, .4], rim: { c: '#59e6ff', d: [-.45, 0] } }, hair: { bang: [0, 0] }, lw: .32 };
  head34(g, P, [0, 0], 0, f, o.L, o); hairOver(g, P, { headC: [0, 0], headA: 0 }, o, '34');
  g.restore();
  rain(g, e, t, { density: .5, layers: [0, 1, 1], alpha: .8 });
  return { bloom: .7 };
}

// ——— S8: the kitten's view — low, under the bench; rack focus from the drips to the kitten ———
export function S8_kitten({ t, lt, g, e, A }) {
  g.drawImage(A.fcBlur, -500, -200, 2600 * 1.1, 1080 * 1.5); e.globalAlpha = .6; e.drawImage(A.fcBlurE, -500, -200, 2600 * 1.1, 1080 * 1.5); e.globalAlpha = 1;
  vgrad2(g, 0, 640, W, 440, '#1a1430', '#0a0814');
  groundRain(g, t, { band: [700, 1080], n: 80, par: 0 });
  const focus = ss(seg(lt, .4, 1.4)), P = PAL.canopy;
  // the kitten, shivering, wet; mews when we first see it clearly
  const mew = Math.max(0, Math.sin(clamp((t - T.mew2) / .55) * Math.PI));
  g.save(); g.filter = `blur(${((1 - focus) * 7).toFixed(1)}px)`;
  g.translate(980, 900); g.scale(4.6, 4.6);
  drawKitten(g, P, { wet: 1, shiver: 1 - mew * .6, time: t, eyes: 1, pupil: .95, mouth: mew, headTilt: -.06 - .08 * mew, earL: -.15 * mew, earR: .1 * mew, tail: t * 1.5, look: [.3, -.2] }, { sh: [-6, 2], hi: [-2, 1], rim: { c: '#59e6ff', d: [1.6, 0] } });
  g.restore(); g.filter = 'none';
  // bench underside framing the top, legs at the sides (foreground, sharp → soft)
  g.save(); g.filter = `blur(${(focus * 5).toFixed(1)}px)`;
  g.fillStyle = '#0a0812'; g.fillRect(0, 0, W, 120); g.fillRect(140, 0, 70, H); g.fillRect(W - 230, 0, 70, H);
  for (let k = 0; k < 3; k++) { g.fillStyle = k % 2 ? '#2a1c16' : '#3a281c'; g.fillRect(0, 120 + k * 26, W, 20); }
  g.restore(); g.filter = 'none';
  drips(g, t, { x0: 200, x1: W - 200, y: 196, yEnd: 820, n: 16, scale: 2.2 * (1 - focus * .5) + .6 });
  rain(g, e, t, { density: .9, region: [0, 200, W, H] });
  return {};
}
const [A0c, A0] = canvas(W, H);
function vgrad2(g, x, y, w, h, a, b2) { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, a); gr.addColorStop(1, b2); g.fillStyle = gr; g.fillRect(x, y, w, h); }

// ——— S9: she walks back to the bench and crouches; the line; she starts to slip off the jacket ———
const S9 = (() => {
  const [t0, t1] = shot('S9_crouch');
  // local frame faces +x (rendered mirrored: she walks right→left on screen). Bench kitten at local x ≈ 1100.
  const v = 505, cad = 1.95, tw1 = t0 + 1.55;   // walk until tw1 (ends close enough to reach the kitten)
  const X = t => t < tw1 ? v * (t - t0) : v * (tw1 - t0) + v * .35 * (1 - Math.exp(-(t - tw1) * 3)) / 1.05;
  const xs = X(t1 + 2);
  const walk = planGait({ t0, t1: tw1 - .2, x0: 0, v, cadence: cad, duty: 1.26, lead: .02, first: 'f', L: 312, strike: -.15, toeoff: .5, flatTo: .55 });
  const steps = walk.filter(c => c.t0 < tw1 - .4);
  const lastN = steps.filter(c => c.foot === 'n').pop(), lastF = steps.filter(c => c.foot === 'f').pop();
  const contacts = [...steps.map(c => ({ ...c, t1: Math.min(c.t1, c === lastN || c === lastF ? 99 : c.t1) }))];
  // final stance for the crouch: feet staggered, then heels lift as she squats
  const fN = { foot: 'n', t0: tw1 - .25, t1: 99, x: xs + 60, strike: -.1, hold: 1, holdPitch: 0 }, fF = { foot: 'f', t0: tw1 + .1, t1: 99, x: xs - 20, strike: -.1, hold: 1, holdPitch: 0 };
  const C2 = contacts.filter(c => c.t0 < tw1 - .3).map(c => ({ ...c, t1: Math.min(c.t1, c.foot === 'n' ? fN.t0 - .3 : fF.t0 - .3) }));
  const all = [...C2, fN, fF];
  const crouch = t => ss(seg(t, T.crouch - .15, T.crouch + .9));
  const pelvisAt = t => { const c = crouch(t); return [lerp(X(t), xs - 30, c), -lerp(306 - 3 * Math.cos(2 * Math.PI * cad * (t - t0)), 128, c)]; };
  const P = { legLen: 294, run: 0 };
  const pose = t => {
    const c = crouch(t), sh = ss(seg(t, T.jacketOff, T.jacketOff + .9));
    const a = footAt(all, 'n', t, pelvisAt, P), bb = footAt(all, 'f', t, pelvisAt, P);
    const heel = .55 * c;
    const sw = Math.cos(2 * Math.PI * cad / 2 * (t - t0)) * .22 * (1 - c);
    const reach = ss(seg(t, T.crouch + .8, T.crouch + 1.6)) * (1 - ss(seg(t, T.jacketOff - .5, T.jacketOff)));
    const kitX = 1100;
    return { pelvis: pelvisAt(t), tL: .05 + .35 * c, tU: .08 + .55 * c - .25 * sh, neck: .1 + .1 * c, head: .1 + .22 * c - .1 * sh,
      legs: { n: { ball: a.ball, pitch: a.planted && c > 0 ? heel : a.pitch, planted: a.planted }, f: { ball: bb.ball, pitch: bb.planted && c > 0 ? heel * 1.1 : bb.pitch, planted: bb.planted } },
      arms: {
        n: sh > 0 ? { tgt: [xs + lerp(70, 10, sh), -lerp(250, 220, sh)], bend: -1, hand: 'grip' }
          : reach > 0 ? { tgt: [lerp(xs + 80, kitX - 20, reach), -lerp(150, 70, reach)], bend: -1, hand: reach > .7 ? 'open' : 'relax' }
          : { sh: -sw + .25 * c, el: .2 + .9 * c, wr: .1, hand: 'relax' },
        f: sh > 0 ? { tgt: [xs + lerp(80, 30, sh), -lerp(255, 225, sh)], bend: -1, hand: 'grip' } : { sh: sw + .3 * c, el: .25 + .9 * c, wr: .1, hand: 'relax' },
      } };
  };
  return { pose, pelvisAt, t0, xs, contacts: all };
})();
export function S9_crouch({ t, lt, g, e, A }) {
  const s = 1.45, gy = 1040, OX = 2300 + lt * 10;          // mirrored: screen_x = OX − local_x·s
  for (const [c, src] of [[g, A.fc.c], [e, A.fc.ec]]) { c.save(); c.translate(960, 1000); c.scale(1.25, 1.25); c.translate(-960 - 60 - lt * 8, -1000); c.drawImage(src, 0, 0); c.restore(); }
  const bx = 190;
  g.save(); g.translate(bx, gy); g.scale(s, s); drawBench(g, PAL.canopy, L_FC, 2.4); g.restore();
  // kitten under the bench, it lifts its head to her voice
  const kx = OX - 1100 * s;
  const kt = ss(seg(t, LINES[1].t + .4, LINES[1].t + 1.2));
  g.save(); g.translate(kx - 10, gy); g.scale(s, s); drawKitten(g, PAL.canopy, { wet: 1, shiver: 1 - kt * .7, time: t, eyes: 1, pupil: .9, headTilt: -.15 * kt, look: [-.4 * kt, -.6 * kt], tail: t * 1.6 }, L_FC); g.restore();
  drips(g, t, { x0: bx - 10, x1: bx + 480, y: gy - 152 * s, yEnd: gy, n: 9 });
  const S = S9.pose(t), J = solveProfile(S);
  const sec = secondary(tt => { const p = S9.pelvisAt(tt); return [p[0], p[1] - 250]; }, S9.t0 - 1, t, { mb: 26 });
  const vis = visemeAt('A2', t);
  const face = { open: .95, lid: .18, look: [.6, .5], brow: [-4, -1, 2.4], mouth: vis || 'soft', blush: .5 };
  const shrug = ss(seg(t, T.jacketOff, T.jacketOff + .9));
  g.save(); g.translate(OX, gy); g.scale(-s, s);
  drawProfile(g, J, { P: PAL.canopy, L: L_FC, jacket: 1, shrug, ...sec, face, wet: .2 });
  g.restore();
  groundRain(g, t, { band: [940, 1080], n: 60 });
  rain(g, e, t, { density: .9 });
  return {};
}

// ——— S10: close on the kitten — it answers, steps toward her; the open jacket descends round it ———
export function S10_kitten({ t, lt, g, e, A }) {
  g.drawImage(A.fcBlur, -300, -380, 2600, 1080 * 1.7); e.globalAlpha = .5; e.drawImage(A.fcBlurE, -300, -380, 2600, 1080 * 1.7); e.globalAlpha = 1;
  vgrad2(g, 0, 700, W, 380, '#1a1430', '#0a0814');
  groundRain(g, t, { band: [760, 1080], n: 50, par: 0 });
  const P = PAL.canopy, L = { sh: [-6, 2], hi: [-2, 1], rim: { c: '#59e6ff', d: [1.5, 0] } };
  const tq = onN(t, 30, 2);
  const mew = Math.max(0, Math.sin(clamp((tq - T.mew3) / .5) * Math.PI)), step = ss(seg(tq, T.mew3 + .55, T.mew3 + 1.05));
  g.save(); g.translate(960 + step * 40, 940 - step * 6); g.scale(6.2, 6.2);
  drawKitten(g, P, { wet: 1, shiver: .25, time: t, eyes: 1, pupil: .85, mouth: mew, headTilt: -.22 + .1 * mew, earL: -.2, earR: .15 * mew, paw: step, rise: step * .4, look: [.5, -.9], tail: t * 1.2 }, L);
  g.restore();
  // the jacket descends from above, held open by her hands (lining facing the kitten)
  const d = eio(seg(tq, b(50) + 1.85, b(54)));
  if (d > 0) {
    const y = lerp(-520, 120, d);
    g.save(); g.translate(960, y);
    celGroup(g, [path([[-900, -200], [900, -200], [880, 260], [560, 360], [0, 330], [-560, 360], [-880, 260]])], P.lining, L, { lw: 3 });
    celGroup(g, [path([[-900, -200], [-740, -200], [-760, 300], [-880, 260]]), path([[900, -200], [740, -200], [760, 300], [880, 260]])], P.jacket, L, { lw: 3 });
    // her hands at the edges (sweater cuffs)
    for (const sx of [-1, 1]) { g.save(); g.scale(sx, 1);
      celGroup(g, [path([[700, 160], [760, 120], [860, 160], [860, 260], [760, 280], [700, 230]])], PAL.canopy.wet('sweater', .7), L, { lw: 3 });
      celGroup(g, [path([[640, 230], [700, 200], [760, 250], [740, 330], [670, 350], [630, 300]])], P.skin, L, { lw: 3 }); g.restore(); }
    g.restore();
  }
  rain(g, e, t, { density: .7, layers: [0, 1, 1] });
  return {};
}

// ——— S11: the hands. Top-down 3/4: jacket spread, hands come in from both sides, fingers slide under (contact first),
//          the kitten rises WITH the hands, the jacket folds over it, the bundle lifts away and leaves a dry patch ———
export function S11_hands({ t, lt, g, e, A }) {
  const P = PAL.canopy, L = { sh: [-5, 6], hi: [-2, 2], rim: { c: '#59e6ff', d: [2, -1] } }, LH = { sh: [-2, 2.4], hi: [-.8, .8] };
  g.fillStyle = '#17122a'; g.fillRect(0, 0, W, H);
  const r = mulberry(3); for (let k = 0; k < 900; k++) { g.fillStyle = rgba(r() < .5 ? '#2a2244' : '#0a0816', .4); g.fillRect(r() * W, r() * H, 3 + r() * 6, 2 + r() * 3); }
  g.strokeStyle = rgba('#000000', .35); g.lineWidth = 3; for (let x = -200; x < W; x += 260) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 140, H); g.stroke(); }
  const tq = onN(t, 30, 2);
  const lay = eio(seg(tq, b(54) + .05, b(54) + .9));
  const reach = eio(seg(tq, b(54) + .5, b(54) + 1.4));          // hands come in from the sides
  const under = eio(seg(tq, b(54) + 1.4, b(54) + 2.2));         // fingers curl & slide beneath (contact)
  const lift = eio(seg(tq, T.lift, T.lift + .9));
  const wrapL = eio(seg(tq, T.lift + .9, T.lift + 1.45)), wrapR = eio(seg(tq, T.lift + 1.3, T.lift + 1.85));
  const away = ei(seg(tq, T.lift + 2.3, T.lift + 3.1));
  const sc = 1 + lift * .14, cx = 960, cy = 560 - lift * 70 - away * 950;
  if (lift > 0) { g.fillStyle = '#2a2240'; g.beginPath(); g.ellipse(960, 690, 160, 105, 0, 0, TAU); g.fill();
    const rr = mulberry(19); for (let k = 0; k < 60 * clamp((tq - T.lift) / 3); k++) { g.fillStyle = rgba('#120e22', .8); g.beginPath(); g.arc(960 + (rr() - .5) * 290, 690 + (rr() - .5) * 190, 4 + rr() * 6, 0, TAU); g.fill(); } }
  const X = (dx, dy) => [cx + dx * sc, cy + dy * sc];
  if (away < 1) {
    // jacket spread under/around (lining up), with folds
    const sp = lerp(1.2, 1, lay), dy = 50 * (1 - lay);
    celGroup(g, [path([X(-600 * sp, -300 + dy), X(-160, -360 + dy), X(170, -350 + dy), X(600 * sp, -290 + dy), X(640 * sp, 200 + dy), X(260, 340 + dy), X(-280, 330 + dy), X(-640 * sp, 190 + dy)])], P.lining, L, { lw: 3 });
    for (const [x0, y0, x1, y1, x2, y2] of [[-420, -220, -330, 40, -400, 240], [400, -230, 320, 20, 380, 230], [-60, 250, 40, 300, 160, 250]])
      iline(g, path([X(x0, y0 + dy), X(x1, y1 + dy), X(x2, y2 + dy)], false), P.lining.l, 2.4);
    // the red outer edge of the jacket shows where it turns over
    celGroup(g, [path([X(-640 * sp, 190 + dy), X(-280, 330 + dy), X(260, 340 + dy), X(640 * sp, 200 + dy), X(620 * sp, 240 + dy), X(260, 380 + dy), X(-280, 370 + dy), X(-650 * sp, 230 + dy)])], P.jacket, L, { lw: 3 });
    // hands BEHIND the kitten: fingers slide under its body
    for (const side of [-1, 1]) {
      const hx = side * lerp(760, 205, reach), hy = 120 + 20 * under;
      g.save(); g.translate(...X(hx, hy)); g.scale(5.2 * sc, 5.2 * sc);
      // sweater cuff first (behind the hand)
      celGroup(g, [path([[side * 30, -21], [side * 120, -30], [side * 240, -34], [side * 240, 36], [side * 120, 32], [side * 30, 23]])], P.wet('sweater', .8), L, { lw: 1.6 });
      iline(g, path([[side * 38, -20], [side * 40, 22]], false), P.sweater.l, 1.1);
      handTop(g, P, LH, 0, 0, { side: side > 0 ? -1 : 1, ang: side > 0 ? Math.PI : 0, curl: under, spread: .35, thumb: .2 + .5 * lift, lw: 1.5 });
      g.restore();
    }
    // the kitten
    g.save(); g.translate(...X(0, 175)); g.scale(5.6 * sc, 5.6 * sc);
    drawKitten(g, P, { wet: 1, shiver: .25 * (1 - under), time: t, eyes: 1, pupil: .8, look: [0, -1], headTilt: lift * .12, earL: -.25 * under, earR: .25 * under, rise: lift * .45, tail: t, paw: 0 }, L);
    g.restore();
    // wrap: the two halves of the jacket fold over the kitten's body (head stays out); thumbs rest on top
    for (const [side, w] of [[-1, wrapL], [1, wrapR]]) if (w > 0) {
      const x = lerp(620, 30, w), yy = lerp(-40, 40, w);
      celGroup(g, [path([X(side * x, -60 + yy), X(side * (x + 90 * (1 - w) + 70), -260 + yy * .5), X(side * (x + 160 * (1 - w) + 230), -80), X(side * (x + 200 * (1 - w) + 200), 230), X(side * (x + 40), 310), X(side * (x - 40), 150)])], P.jacket, L, { lw: 3 });
      iline(g, path([X(side * (x + 40), -120 + yy), X(side * (x + 90), 60), X(side * (x + 70), 230)], false), P.jacket.l, 2.2);
    }
    if (lift > .2) for (const side of [-1, 1]) {
      const p = X(side * 250, 40 + 40 * wrapL);
      g.save(); g.translate(...p); g.scale(5.2 * sc, 5.2 * sc); g.rotate(side * (.9 - .4 * lift));
      celGroup(g, [path([[0, -6], [24, -9], [32, -2], [24, 6], [0, 6]])], P.skin, LH, { lw: 1.4 });
      g.restore();
    }
  }
  rain(g, e, t, { density: .6, layers: [0, 1, 1], wind: .05 });
  groundRain(g, t, { band: [0, H], n: 70, par: 0 });
  return {};
}
function ei(x) { return x * x * x; }

// ——— S12: the station clock: 23:59 → 00:00 ———
export function S12_clock({ t, lt, g, e }) {
  g.fillStyle = '#100c20'; g.fillRect(0, 0, W, H);
  const P = { g, e }, cx = 960, cy = 560 + lt * 6, R = 430;
  g.save(); g.translate(cx, cy); g.scale(1 + lt * .015, 1 + lt * .015); g.translate(-cx, -cy);
  e.save(); e.translate(cx, cy); e.scale(1 + lt * .015, 1 + lt * .015); e.translate(-cx, -cy);
  const jump = seg(t, T.clock, T.clock + .12), over = Math.sin(clamp((t - T.clock) / .3) * Math.PI) * .25 * (1 - clamp((t - T.clock) / .3));
  const mm = 59 + jump + over;
  g.fillStyle = '#0e0c1c'; g.beginPath(); g.arc(cx, cy, R + 40, 0, TAU); g.fill();
  clockFace({ g, e: A0 }, cx, cy, R, 0, 0);
  e.fillStyle = 'rgba(246,244,234,.10)'; e.beginPath(); e.arc(cx, cy, R, 0, TAU); e.fill();
  // repaint the hands (face painted at 0:00) with the true time
  g.fillStyle = '#f6f4ea'; g.beginPath(); g.arc(cx, cy, R * .74, 0, TAU); g.fill();
  clockHands(g, cx, cy, R, mm >= 60 ? 0 : 23, mm >= 60 ? mm - 60 : mm, null);
  // rain beading on the glass
  const r = mulberry(12); for (let k = 0; k < 40; k++) { const a = r() * TAU, d = Math.sqrt(r()) * R; g.fillStyle = rgba('#e8f2ff', .5); g.beginPath(); g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d + ((t * 30 * r()) % 30), 6 + r() * 9, 8 + r() * 10, 0, 0, TAU); g.fill(); }
  g.restore(); e.restore();
  rain(g, e, t, { density: .8 });
  return {};
}

// ——— S13: she stands up with the bundle and looks up at the platform: silence — then the train's hum ———
export function S13_stand({ t, lt, g, e, A }) {
  g.drawImage(A.fcBlur, -620, -340, 2600, 1080 * 1.7); e.globalAlpha = .6; e.drawImage(A.fcBlurE, -620, -340, 2600, 1080 * 1.7); e.globalAlpha = 1;
  const tq = onN(t, 30, 2), P = PAL.canopy;
  const rise = eo(seg(tq, b(66), b(66) + .8)), up = ss(seg(tq, T.silence2 - .1, T.silence2 + .5)), hope = ss(seg(tq, T.hum, T.hum + .4));
  const face = { open: lerp(.95, 1.12, hope), lid: lerp(.1, 0, up), iris: lerp(1, .88, hope), look: [.55, lerp(.2, -.85, up)], brow: [lerp(-3, -6, up), lerp(-1, -5, hope), 2.4 + hope], mouth: hope > .5 ? 'O' : 'soft', blush: .5, glint: hope };
  g.save(); g.translate(880, 470 + (1 - rise) * 560); g.scale(3.1, 3.1);
  drawBust34(g, P, { wet: .85, breathe: t * 2.6 * (1 - up * .9), head: lerp(.08, -.14, up), face, kit: { wet: .9, eyes: .7, pupil: .6, time: t, headTilt: .1 }, hair: {}, lift: 6 }, { sh: [-6, 2], hi: [-2, 1], rim: { c: '#59e6ff', d: [2, 0] } });
  g.restore();
  rain(g, e, t, { density: .9 });
  return {};
}

export function events(add) {
  for (const c of S6.contacts.slice(1)) add('step_wet', c.t0, { v: .85, pan: .1 });
  add('scuff', S6.t0 + .66, { v: .8 }); add('scuff', S6.t0 + .98, { v: .55 });
  add('cloth', S6.t0 + 1.7, { v: .55 });
  for (const c of S9.contacts) if (c.t0 > S9.t0 - .05 && c.t0 < S9.t0 + 2.2) add('step_wet', c.t0, { v: .55, pan: -.2 });
  add('cloth', T.crouch, { v: .7 }); add('knee', T.crouch + .7, { v: .5 });
  add('cloth', T.jacketOff, { v: .8 }); add('zip', T.jacketOff + .3, { v: .4 });
  add('cloth', b(50) + 1.9, { v: .7 });
  add('cloth', b(54) + .2, { v: .6 }); add('fur', b(54) + 1.2, { v: .5 }); add('cloth', T.lift + .9, { v: .7 }); add('cloth', T.lift + 1.3, { v: .7 });
  add('purr', T.purr, { d: 5.5, v: .5 });
  add('clunk', T.clock, { v: .9 });
  add('cloth', b(66) + .1, { v: .6 });
}
