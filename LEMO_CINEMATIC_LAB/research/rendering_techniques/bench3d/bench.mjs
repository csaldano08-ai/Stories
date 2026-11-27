import path from 'path';
const { openDemo, closeServer } = await import(path.join(process.env.LIB, 'core/render/page.mjs'));
const dir = process.argv[2];
for (const q of (process.argv[3] || 'ss=1&ao=0,ss=1&ao=1,ss=2&ao=1').split(',')) {
  const { browser, page } = await openDemo(dir, { w: 1920, h: 1080, q });
  page.setDefaultTimeout(600000);
  const r = await page.evaluate(async () => { const ts = []; for (let i = 0; i < 3; i++) { const a = performance.now(); window.render(i * .1); window.SYNC(); ts.push(performance.now() - a); } return ts; });
  let a = Date.now(); await page.screenshot({ type: 'jpeg', quality: 90, timeout: 600000, path: `${dir}/bench_${q.replace(/[=&]/g, '_')}.jpg` }); const shot = Date.now() - a;
  console.log(q, '| synced render ms', r.map(x => Math.round(x)).join(' '), '| screenshot ms', shot);
  await browser.close();
}
closeServer(); process.exit(0);
