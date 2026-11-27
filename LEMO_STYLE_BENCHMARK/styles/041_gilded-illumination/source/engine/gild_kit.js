'use strict';
// engine/gild_kit.js — excerpts, unchanged, of lemo-opuscar styles/gilded-illumination/demo: film.js (lightAt, glintPass,
// glowPass, hidden, flashes, resetCtx and the buffers they use) and world.js (makePaint, paint). The demo's world, story and text are not used.
let FR, FRg, MC, MCg, OCC, OCCg, OCCd = null;
let GW, GWg, GWD, GWI;
const SCR_LS = .6;   // screen leaf: 1 px = 1 unit

function resetCtx(g) { if (g.reset) g.reset(); g.__gp = g.__sp = g.__paint = g.__gf = g.__gff = null; }

function lightAt(lights, x, y) {
  let v = 0; for (const L of lights) {
    if (L.type === 'r') { const d = Math.hypot(x - L.x, y - L.y) / L.r; if (d < 1) v += L.a * Math.pow(1 - d, 1.4); }
    else if (L.type === 'b') { const d = ((x - L.x) * L.nx + (y - L.y) * L.ny) / L.w; v += L.a * Math.exp(-d * d); }
    else if (L.type === 'o') { const d = (Math.hypot(x - L.x, y - L.y) - L.rad) / L.w; v += L.a * Math.exp(-d * d); }
  } return v;
}

function glintPass(M, lights, amb) {
  if (!lights.length && amb <= 0) { if (GWD) GWD.fill(0); return; }
  const md = MCg.getImageData(0, 0, W, H).data, img = ctx.getImageData(0, 0, W, H), fd = img.data;
  if (!GW) { GW = cnv(W / 4, H / 4); GWg = GW.getContext('2d'); GWD = new Float32Array(W / 4 * H / 4); GWI = GWg.createImageData(W / 4, H / 4); }
  GWD.fill(0); const QW = W / 4;
  const inv = M.inverse(), ia = inv.a, ib = inv.b, ic = inv.c, id = inv.d, ie = inv.e, iff = inv.f;
  const Ls = lights.map(L => ({ ...L, r2: L.r ? L.r * L.r : 0 }));
  let ci = 1e9, cj = 1e9, nx = 1, ny = 0, th = 0, fam = 0, tone = 0, ox = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4, A = md[p + 3]; if (A < 6) continue;
      const wx = ia * x + ic * y + ie, wy = ib * x + id * y + iff, scr = md[p + 1] < 128;
      const fx = scr ? x / SCR_LS : wx, fy = scr ? y / SCR_LS : wy;
      const j = Math.floor(fy / LS), ro = rowOff(j), i = Math.floor((fx + ro) / LS), gk = scr ? .6 : 1;
      if (i !== ci || j !== cj) { ci = i; cj = j; ox = ro; th = leafTilt(i, j); nx = Math.cos(th); ny = Math.sin(th); const fa = .5 + .5 * Math.cos(th - .9); fam = fa * fa * fa * fa; tone = leafTone(i, j); }
      // the leaf is not flat: each square is a little cupped along its tilt
      const lu = (fx + ox) / LS - i - .5, lv = fy / LS - j - .5, cup = 1 + .55 * (lu * nx + lv * ny);
      let R = amb * (.55 + .55 * fam);
      for (let k = 0; k < Ls.length; k++) { const L = Ls[k];
        if (L.type === 'r') { const dx = wx - L.x, dy = wy - L.y, d2 = dx * dx + dy * dy; if (d2 >= L.r2) continue; const d = Math.sqrt(d2), v = L.a * Math.pow(1 - d / L.r, 1.4);
          let f = .5 + .5 * (dx * nx + dy * ny) / (d + 1e-3); f *= f; R += v * (.5 + .75 * f); }
        else if (L.type === 'b') { const dd = ((wx - L.x) * L.nx + (wy - L.y) * L.ny) / L.w; if (dd > 3 || dd < -3) continue; const v = L.a * Math.exp(-dd * dd);
          let f = .5 + .5 * Math.cos(dd * 1.9 + th); f *= f; R += v * (.45 + .8 * f); }
        else { const dx = wx - L.x, dy = wy - L.y, dd = (Math.sqrt(dx * dx + dy * dy) - L.rad) / L.w; if (dd > 3 || dd < -3) continue; const v = L.a * Math.exp(-dd * dd);
          let f = .5 + .5 * Math.cos(dd * 2.2 + th); f *= f; R += v * (.5 + .8 * f); }
      }
      if (R < .004) continue;
      const k = A / 255 * Math.min(R * cup * gk, 2.2) * (.9 + .2 * tone);
      if (k > .6) GWD[(y >> 2) * QW + (x >> 2)] += (k - .6);
      const f = .82 * (1 - Math.exp(-1.15 * k)), r0 = fd[p], g0 = fd[p + 1], b0 = fd[p + 2];
      fd[p] = Math.min(255, r0 * (1 + .5 * k) + (250 - r0) * f); fd[p + 1] = Math.min(232, g0 * (1 + .45 * k) + (204 - g0) * f); fd[p + 2] = Math.min(150, b0 * (1 + .2 * k) + (96 - b0) * f);
    }
  }
  ctx.putImageData(img, 0, 0);
}

function glowPass(gain) {   // a soft halo around the brightest gold (the eye's bloom), from the quarter-size light record
  if (!GWD) return; const n = GWD.length, d = GWI.data;
  for (let i = 0; i < n; i++) { const v = Math.min(1, GWD[i] / 16 * gain); d[i * 4] = 255; d[i * 4 + 1] = 196; d[i * 4 + 2] = 110; d[i * 4 + 3] = 255 * v * v; }
  GWg.putImageData(GWI, 0, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
  ctx.filter = 'blur(10px)'; ctx.globalAlpha = .55; ctx.drawImage(GW, 0, 0, W, H);
  ctx.filter = 'blur(36px)'; ctx.globalAlpha = .55; ctx.drawImage(GW, 0, 0, W, H);
  ctx.restore();
}

function hidden(M, x, y) { if (!OCCd) return false; const q = new DOMPoint(x, y).matrixTransform(M), X = Math.round(q.x), Y = Math.round(q.y); if (X < 0 || Y < 0 || X >= W || Y >= H) return false; return OCCd[(Y * W + X) * 4 + 3] > 100; }

function flashes(M, lights) {   // four-point flashes where the light is strongest on a piece of gold
  ctx.setTransform(M); ctx.globalCompositeOperation = 'lighter'; const z = Math.hypot(M.a, M.b);
  for (const p of GP) {
    const v = lightAt(lights, p.x, p.y) * p.k; if (v < .55 || hidden(M, p.x, p.y)) continue; const a = clamp((v - .55) * 1.4), r = Math.min(p.r * (.4 + .45 * a), 160 / z);
    const rg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * .5); rg.addColorStop(0, `rgba(255,246,215,${.4 * a})`); rg.addColorStop(1, 'rgba(255,232,160,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(p.x, p.y, r * .5, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,250,232,${.8 * a})`;
    for (const an of [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4]) { const rr = an % (Math.PI / 2) ? r * .45 : r; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(an + .2); ctx.beginPath(); ctx.moveTo(-rr, 0); ctx.quadraticCurveTo(0, -rr * .06, rr, 0); ctx.quadraticCurveTo(0, rr * .06, -rr, 0); ctx.fill(); ctx.restore(); }
  }
  ctx.globalCompositeOperation = 'source-over';
}

let PAINTC;
function makePaint() {   // ground ultramarine as paint: granular, deep, matte
  const s = 512, c = cnv(s, s), g = c.getContext('2d'); g.drawImage(GRAINC, 0, 0);
  const im = g.getImageData(0, 0, s, s), d = im.data, A = [20, 30, 98], B = [58, 82, 176];
  for (let i = 0; i < d.length; i += 4) { const v = d[i] / 255, u = clamp(v * 1.15 - .1); d[i] = lerp(A[0], B[0], u); d[i + 1] = lerp(A[1], B[1], u); d[i + 2] = lerp(A[2], B[2], u); }
  g.putImageData(im, 0, 0); return c;
}

function paint(g, path, fill, rim, rimW, lw = 2.4) {   // flat pigment: fill, inner darker band, ink line; covers gold behind it
  g.fillStyle = fill; g.fill(path); if (rim) rimShade(g, path, rim, rimW || 10);
  ink(g, path, lw); maskErase(g, path);
}
