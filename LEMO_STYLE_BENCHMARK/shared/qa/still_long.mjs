// Stills for heavy (CPU WebGL) pages: node still_long.mjs <src> <outDir> <t> [<t> ...] [--q k=v&..]
// Same page contract as core/render/still.mjs, but renders with window.render(t) and screenshots with a long timeout
// (the library's still tool gives up after 30 s, which a first frame with shader compilation on SwiftShader can exceed).
import path from 'path'; import fs from 'fs';
const { openDemo, closeServer } = await import(path.join(process.env.LIB, 'core/render/page.mjs'));
const a = process.argv.slice(2), qi = a.indexOf('--q'), q = qi >= 0 ? a.splice(qi, 2)[1] : '';
const [dir, out, ...times] = a; fs.mkdirSync(out, { recursive: true });
const { browser, page } = await openDemo(dir, { w: 1920, h: 1080, q });
for (const t of times) {
  const t0 = Date.now();
  await page.evaluate(tt => window.render(+tt), t);
  const f = path.join(out, `t_${t}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 92, timeout: 600000 });
  console.log(f, Date.now() - t0 + 'ms');
}
await browser.close(); closeServer(); process.exit(0);
