// engine/stage.js — excerpt of lemo-opuscar styles/shadow-puppet/demo/stage.js (drawFrame, drawAudience, drawPillar, unchanged)
// and houyi.js (drawRods, unchanged). The demo's title plaques and its puppet are not used.

export function drawFrame(g, Cam, spill = 1) {
  g.save(); g.setTransform(Cam[0], Cam[1], Cam[2], Cam[3], Cam[4], Cam[5]);
  const lac = '#2a0d08', lac2 = '#46140c', gold = '#8a6430';
  // Lintel
  g.fillStyle = lac; g.fillRect(-420, -520, 2760, 520);
  g.fillStyle = lac2; g.fillRect(-300, -200, 2520, 170);
  // Lintel carving: a row of cloud-head scrolls + gold fret-pattern (回纹) lines
  g.strokeStyle = gold; g.lineWidth = 3;
  for (let x = -260; x < 2200; x += 120) { g.beginPath(); for (let i = 0; i <= 30; i++) { const a = i / 30 * Math.PI * 2.1, r = 34 * (1 - i / 30 * .75); const px = x + 60 + Math.cos(a) * r, py = -115 + Math.sin(a) * r * .7; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke(); }
  g.beginPath(); g.moveTo(-300, -200); g.lineTo(2220, -200); g.moveTo(-300, -30); g.lineTo(2220, -30); g.stroke();
  g.fillStyle = '#6a1a10'; g.fillRect(-300, -30, 2520, 30);
  // Posts
  for (const x of [-230, 1920]) {
    const gr = g.createLinearGradient(x, 0, x + 230, 0); gr.addColorStop(0, '#1a0806'); gr.addColorStop(.5, '#3e110a'); gr.addColorStop(1, '#1a0806');
    g.fillStyle = gr; g.fillRect(x, -520, 230, 2000);
    g.strokeStyle = gold; g.lineWidth = 2.5; g.strokeRect(x + 24, 60, 182, 900);
  }
  // Stage lip (bottom edge)
  g.fillStyle = lac; g.fillRect(-420, 1080, 2760, 600);
  g.fillStyle = '#5a170d'; g.fillRect(-300, 1080, 2520, 46);
  g.strokeStyle = gold; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-300, 1126); g.lineTo(2220, 1126); g.stroke();
  // Lit inner edge (warm light coming through the cloth falls on the wood)
  g.globalCompositeOperation = 'lighter';
  const sp = (x0, y0, x1, y1, gx0, gy0, gx1, gy1) => { const gr = g.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, `rgba(255,170,90,${.32 * spill})`); gr.addColorStop(1, 'rgba(255,150,70,0)'); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0); };
  sp(-300, -120, 2220, 0, 0, 0, 0, -120); sp(-300, 1080, 2220, 1200, 0, 1080, 0, 1200); sp(-160, -30, 0, 1110, 0, 0, -160, 0); sp(1920, -30, 2080, 1110, 1920, 0, 2080, 0);
  g.restore();
}

export function drawAudience(g, a = 1, t = 0) {
  if (a <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.fillStyle = '#080404'; g.filter = 'blur(3px)';
  const heads = [[260, 1010, 95, 1], [560, 1040, 110, 0], [880, 1060, 90, 1], [1330, 1030, 105, 0], [1640, 1050, 95, 1]];
  heads.forEach(([x, y, r, bun], i) => {
    const bob = Math.sin(t * 1.3 + i * 2) * 3;
    g.beginPath(); g.ellipse(x, y + bob, r * .78, r, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(x, y + r * 1.25 + bob, r * 1.8, r * .9, 0, 0, 7); g.fill();
    if (bun) { g.beginPath(); g.arc(x + r * .1, y - r * .95 + bob, r * .32, 0, 7); g.fill(); }
  });
  g.restore();
}

export function drawPillar(g, x) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'blur(14px)';
  const w = 1500, gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  gr.addColorStop(0, 'rgba(12,4,3,0)'); gr.addColorStop(.08, '#120604'); gr.addColorStop(.45, '#3a1009'); gr.addColorStop(.55, '#2a0b07'); gr.addColorStop(.92, '#0e0503'); gr.addColorStop(1, 'rgba(12,4,3,0)');
  g.fillStyle = gr; g.fillRect(x - w / 2, -40, w, 1160);
  g.globalCompositeOperation = 'lighter'; const rg = g.createLinearGradient(x - w / 2, 0, x - w / 2 + 160, 0); rg.addColorStop(0, 'rgba(255,160,80,0)'); rg.addColorStop(.6, 'rgba(255,160,80,.16)'); rg.addColorStop(1, 'rgba(255,160,80,0)'); g.fillStyle = rg; g.fillRect(x - w / 2, -40, 200, 1160);
  g.restore();
}

export function drawRods(g, pts, ends, blur = 2.5, alpha = .62) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.filter = `blur(${blur}px)`; g.globalAlpha = alpha;
  pts.forEach((p, i) => {
    const e = ends[i]; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(e[0], e[1]); g.strokeStyle = '#2a1a10'; g.lineWidth = i === 0 ? 4.2 : 2.8; g.stroke();
    g.beginPath(); g.arc(p[0], p[1], i === 0 ? 4 : 3, 0, Math.PI * 2); g.fillStyle = '#2a1a10'; g.fill();
  });
  g.restore();
}
