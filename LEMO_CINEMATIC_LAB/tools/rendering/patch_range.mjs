// Re-render only a time range of a film and splice it into an existing render, frame-exact (checkpoint-style fixes).
//   node patch_range.mjs <film src dir> <video.mp4> <t0> <t1> <out.mp4> [--fps 30] [--workers 2]
// Frames [round(t0·fps), round(t1·fps)) are rendered with the page's window.render(t) and replace the same frames of <video.mp4>.
import path from 'path'; import fs from 'fs'; import os from 'os'; import { spawn, execFileSync } from 'child_process';
const LIB = process.env.LIB; const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const [dir, src, T0, T1, out] = a; const FPS = +opt('--fps', 30), WK = +opt('--workers', 2);
const F0 = Math.round(+T0 * FPS), F1 = Math.round(+T1 * FPS), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'patch-'));
const per = Math.ceil((F1 - F0) / WK);
await Promise.all([...Array(WK)].map(async (_, w) => {
  const a0 = F0 + w * per, a1 = Math.min(F1, a0 + per); if (a0 >= a1) return;
  const { browser, page } = await openDemo(dir, { w: 1920, h: 1080, q: '' });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-crf', '14', '-pix_fmt', 'yuv420p', path.join(tmp, `p${w}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));
  for (let f = a0; f < a1; f++) { await page.evaluate(t => window.render(t), f / FPS); const buf = await page.screenshot({ type: 'jpeg', quality: 95 }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await done; await browser.close();
}));
const parts = [...Array(WK)].map((_, w) => path.join(tmp, `p${w}.mp4`)).filter(f => fs.existsSync(f));
fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map(p => `file '${p}'`).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', path.join(tmp, 'patch.mp4')]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-i', path.join(tmp, 'patch.mp4'), '-filter_complex',
  `[0:v]trim=end_frame=${F0},setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[0:v]trim=start_frame=${F1},setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]`,
  '-map', '[v]', '-r', String(FPS), '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-pix_fmt', 'yuv420p', out]);
fs.rmSync(tmp, { recursive: true, force: true }); closeServer();
console.log('patched frames', F0, '→', F1 - 1, 'into', out); process.exit(0);
