// Time window.render(t) inside the page and its parts. usage: node profile_page.mjs <film dir> <t> [query]
import path from 'path';
const LIB = process.env.LIB;
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const [dir, t = '1', q = ''] = process.argv.slice(2);
const { browser, page } = await openDemo(dir, { w: 1920, h: 1080, q });
const r = await page.evaluate(async (t) => {
  const out = {};
  let a = performance.now(); window.render(t); out.render1 = performance.now() - a;
  a = performance.now(); window.render(t); out.render2 = performance.now() - a;
  if (window.PROF) out.parts = window.PROF;
  return out;
}, +t);
console.log(JSON.stringify(r));
let a = Date.now(); await page.screenshot({ type: 'jpeg', quality: 95 }); console.log('screenshot ms', Date.now() - a);
await browser.close(); closeServer();
