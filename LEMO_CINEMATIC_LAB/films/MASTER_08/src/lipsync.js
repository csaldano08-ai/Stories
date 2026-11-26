// Phoneme-ish lip sync: words (from the voice take's Whisper word timestamps) → letter clusters → visemes,
// spread over each word's time span, sampled on threes (10 drawings/s, STYLE §5 "lip flaps on threes"), ending on a held shape.
import { LINES } from './timeline.js';
let LS = {};
export async function loadLipsync(url) { try { const r = await fetch(url); if (r.ok) LS = await r.json(); } catch (e) { } return LS; }

const CL = [['th', 'L'], ['sh', 'U'], ['ch', 'U'], ['oo', 'U'], ['ou', 'O'], ['ee', 'I'], ['ea', 'E'], ['ai', 'E'], ['ay', 'E'], ['ow', 'O'], ['qu', 'U'], ['ng', 'E']];
const ONE = { a: 'A', e: 'E', i: 'I', o: 'O', u: 'U', y: 'I', m: 'M', b: 'M', p: 'M', f: 'F', v: 'F', w: 'U', l: 'L', r: 'E', n: 'E', d: 'E', t: 'E', s: 'I', z: 'I', k: 'E', g: 'E', c: 'E', h: 'A', j: 'U', x: 'E' };
export function wordVisemes(w) {
  w = w.toLowerCase().replace(/[^a-z]/g, ''); const out = [];
  for (let i = 0; i < w.length;) {
    const two = w.slice(i, i + 2), c = CL.find(([k]) => k === two);
    if (c) { out.push(c[1]); i += 2; continue; }
    const v = ONE[w[i]]; if (v && out[out.length - 1] !== v) out.push(v); i++;
  }
  // silent final e, and a vowel always wins over a following consonant at the same weight
  if (w.endsWith('e') && out.length > 1 && out[out.length - 1] === 'E') out.pop();
  return out.length ? out : ['E'];
}
// viseme for line `id` at absolute time t (line starts at LINES[id].t), or null when the line isn't playing
export function visemeAt(id, t, fps = 30, step = 3) {
  const L = LINES.find(l => l.id === id), D = LS[id]; if (!L || !D) return null;
  const tq = Math.floor(t * fps / step) * step / fps, lt = tq - L.t;
  if (lt < D.t0 - .05 || lt > D.t1 + .12) return null;
  for (const [w, a, b] of D.words) {
    if (lt >= a && lt < b) { const v = wordVisemes(w), k = Math.min(v.length - 1, Math.floor((lt - a) / Math.max(.01, b - a) * v.length)); return v[k]; }
  }
  return 'X';
}
export const speaking = (id, t) => visemeAt(id, t) !== null;
