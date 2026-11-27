#!/usr/bin/env python3
"""Showreel A: every one of the 99 styles in catalogue order, each behind a short separator card (number, name, category).

A style with a final.mp4 gets a 1.2 s card and then its 10 s clip. A style without one gets a 2.5 s card that says so plainly
(BLOCKED with the one-line reason from its status.json, or NOT RENDERED YET), so the reel never hides a gap.
No logos, no intro, no CTA. Output: comparison/showreel_A.mp4 (1920x1080, 30 fps, H.264, AAC stereo) + showreel_A.txt (the running order).
Usage: $LEMO_PY tools/make_showreel_a.py [--only-rendered]
"""
import json, os, subprocess, sys, textwrap
from PIL import Image, ImageDraw, ImageFont

B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(B, 'comparison'); TMP = os.path.join(OUT, '.showreel_a'); os.makedirs(TMP, exist_ok=True)
F = lambda w, s: ImageFont.truetype(f'/usr/share/fonts/opentype/inter/Inter-{w}.otf', s)
inv = json.load(open(os.path.join(B, 'STYLE_INVENTORY.json'))); inv = inv if isinstance(inv, list) else inv['styles']
only = '--only-rendered' in sys.argv
ENC = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2']

def card(path, num, name, cat, state, reason):
    im = Image.new('RGB', (1920, 1080), '#0b0b0d'); d = ImageDraw.Draw(im)
    d.text((160, 380), num, font=F('Light', 64), fill='#8a8a92')
    d.text((160, 470), name, font=F('SemiBold', 96), fill='#f2f2f4')
    d.text((164, 610), cat.upper(), font=F('Medium', 30), fill='#8a8a92')
    if state:
        col = '#e0a43a' if state == 'BLOCKED' else '#7a8aa8'
        d.text((164, 700), state, font=F('SemiBold', 34), fill=col)
        for i, line in enumerate(textwrap.wrap(reason, 90)[:4]): d.text((164, 752 + i * 40), line, font=F('Regular', 28), fill='#b0b0b8')
    im.save(path)

def seg_card(png, dur, out):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-t', str(dur), '-i', png, '-f', 'lavfi', '-t', str(dur), '-i', 'anullsrc=r=48000:cl=stereo', *ENC, '-shortest', out], check=True)

def seg_clip(src, out):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', 'scale=1920:1080,fps=30,format=yuv420p', *ENC, out], check=True)

parts, order = [], []
for it in sorted(inv, key=lambda x: x['bench_id']):
    d = os.path.join(B, it['folder']); fin = os.path.join(d, 'final.mp4'); st = {}
    if os.path.exists(os.path.join(d, 'status.json')): st = json.load(open(os.path.join(d, 'status.json')))
    has = os.path.exists(fin)
    if only and not has: continue
    state = '' if has else ('BLOCKED' if st.get('status') == 'blocked' else 'NOT RENDERED YET')
    reason = '' if has else (st.get('short') or st.get('note', '').replace('BLOCKED: ', '').split('. ')[0] + '.' if state == 'BLOCKED' else 'Built and queued; this reel will include it once it is rendered and reviewed.')
    png = os.path.join(TMP, f"card_{it['bench_id']}.png"); card(png, it['bench_id'], it['name'], it['category'], state, reason)
    cs = os.path.join(TMP, f"card_{it['bench_id']}.mp4"); seg_card(png, 1.2 if has else 2.5, cs); parts.append(cs)
    if has: cl = os.path.join(TMP, f"clip_{it['bench_id']}.mp4"); seg_clip(fin, cl); parts.append(cl)
    order.append(f"{it['bench_id']}  {it['name']:<34} {it['category']:<22} {'clip' if has else state}")
    print(order[-1], flush=True)
lst = os.path.join(TMP, 'list.txt'); open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', '-movflags', '+faststart', os.path.join(OUT, 'showreel_A.mp4')], check=True)
open(os.path.join(OUT, 'showreel_A.txt'), 'w').write('Showreel A — running order\n\n' + '\n'.join(order) + '\n')
print('wrote', os.path.join(OUT, 'showreel_A.mp4'))
