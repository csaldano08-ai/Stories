// Subtitles recorded on the tape (composited inside the CRT pass): Barlow Semi Condensed 600, 54 px, cream-yellow with a
// thick dark outline and soft shadow, ~96 px above the bottom; the driver in pale cyan (second-speaker colour).
import { LINES } from './timeline.js';
import { W, H } from './lib/cel.js';
export function spans(DURS) {
  return LINES.map((L, i) => {
    const d = DURS[L.id] ?? 2.2, nx = LINES[i + 1];
    let t1 = L.t + Math.max(1.8, d + .6);
    if (nx && t1 > nx.t - .05) t1 = nx.t - .05;
    return { ...L, t0: L.t, t1 };
  });
}
export function hud(c, t, DURS) {
  for (const s of spans(DURS)) {
    if (t < s.t0 || t >= s.t1) continue;
    const a = Math.min(1, (t - s.t0) / .08, (s.t1 - t) / .1);
    c.save(); c.globalAlpha = a; c.font = '600 54px "Barlow SC"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
    const y = H - 96, col = s.who === 'driver' ? '#a8f2ff' : '#fff0a0';
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillText(s.text, W / 2 + 3, y + 4);
    c.strokeStyle = '#1a1020'; c.lineWidth = 9; c.strokeText(s.text, W / 2, y);
    c.fillStyle = col; c.fillText(s.text, W / 2, y);
    c.restore();
  }
}
