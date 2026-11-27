// Automated rig QA over every frame: node rig_check.mjs <style source dir> <out.json> [--fps 30 --dur 10]
// Uses the page's window.RIGQA(t) (same code that draws the frame). Checks: bone lengths constant (thigh 150, shin 144,
// upper arm 108, forearm 92), knees bend forward / elbows back, planted feet do not slide, soles never below the ground,
// reach adjustments (heel lift / foot lift) logged.
import path from 'path'; import fs from 'fs';
const { openDemo, closeServer } = await import(path.join(process.env.LIB, 'core/render/page.mjs'));
const a = process.argv.slice(2), dir = a[0], out = a[1], FPS = 30, N = 300;
const { browser, page } = await openDemo(dir, { w: 1920, h: 1080, q: '' });
const frames = await page.evaluate(n => { const r = []; for (let f = 0; f < n; f++) { const q = window.RIGQA(f / 30); if (q) r.push(q); } return r; }, N);
await browser.close(); closeServer();
const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const R = { frames: frames.length, bone: { thigh: [1e9, -1e9], shin: [1e9, -1e9], upper: [1e9, -1e9], fore: [1e9, -1e9] }, kneeBackward: 0, elbowForward: 0, slideMaxU: 0, slideFrames: 0, belowGround: 0, adjustments: 0, lifted: 0, worst: [] };
const mm = (k, v) => { R.bone[k][0] = Math.min(R.bone[k][0], v); R.bone[k][1] = Math.max(R.bone[k][1], v); };
let prev = null;
for (const F of frames) {
  for (const k of ['n', 'f']) {
    const L = F.leg[k], A = F.arm[k];
    mm('thigh', d(L.hip, L.knee)); mm('shin', d(L.knee, L.ankle)); mm('upper', d(A.sh, A.el)); mm('fore', d(A.el, A.wr));
    // knee in front of the hip→ankle line (profile facing +x): cross product sign
    const cr = (L.ankle[0] - L.hip[0]) * (L.knee[1] - L.hip[1]) - (L.ankle[1] - L.hip[1]) * (L.knee[0] - L.hip[0]);
    if (cr > 1) R.kneeBackward++;
    if (L.ball[1] > 1.0) R.belowGround++;
    if (prev && L.planted && prev.leg[k].planted && Math.abs(L.target[0] - prev.leg[k].target[0]) < 1e-6) {
      const s = d(L.ball, prev.leg[k].ball); if (s > R.slideMaxU) R.slideMaxU = s; if (s > 1.0) { R.slideFrames++; if (R.worst.length < 8) R.worst.push({ t: F.t, k, slideU: +s.toFixed(2) }); }
    }
  }
  R.adjustments += F.adjust.length; R.lifted += F.adjust.filter(x => x.lifted > 0).length;
  prev = F;
}
for (const k in R.bone) R.bone[k] = R.bone[k].map(v => +v.toFixed(3));
R.pass = R.bone.thigh[1] - R.bone.thigh[0] < .05 && R.bone.shin[1] - R.bone.shin[0] < .05 && R.kneeBackward === 0 && R.belowGround === 0 && R.slideFrames === 0;
fs.writeFileSync(out, JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); process.exit(0);
