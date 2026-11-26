// Small deterministic helpers (same API as Lemo-Opuscar core/lib.js, MIT).
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const eo = t => 1 - Math.pow(1 - clamp(t), 3);
export const ei = t => Math.pow(clamp(t), 3);
export const back = (t, s = 1.8) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
export const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
export const vnoise = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };
export function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const TAU = Math.PI * 2;
// keyframe track: keys [[t, value | [values]], ...] with per-key easing (default smoothstep between keys); holds outside
export function keys(K, t, ease = ss) {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 0; i < K.length - 1; i++) {
    const [ta, va, ea] = K[i], [tb, vb] = K[i + 1];
    if (t <= tb) {
      const u = (ea || ease)((t - ta) / (tb - ta));
      return Array.isArray(va) ? va.map((x, j) => lerp(x, vb[j], u)) : lerp(va, vb, u);
    }
  }
  return K[K.length - 1][1];
}
// quantise time for drawings on twos/threes (camera stays on ones)
export const onN = (t, fps, n) => Math.floor(t * fps / n) * n / fps;
