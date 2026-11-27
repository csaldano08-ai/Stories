#!/usr/bin/env python3
"""Finish one benchmark style: mux common audio, previews, automated QA, report, status.
   $LEMO_PY finish_style.py <style dir> [--strip t0:t1] [--native audio.wav] [--note "..."]
Reads <style>/build/video.mp4 (300 frames). Writes final.mp4 (common audio), final_native.mp4 (if --native), preview.mp4 (960x540),
thumbnail.png, qa/contact_sheet.png, qa/strip.png, qa_report.md, status.json. Only measured facts go in the automated sections."""
import argparse, json, os, re, subprocess, sys
B = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LIB = os.environ['LIB']
def run(c, **k): return subprocess.run(c, capture_output=True, text=True, **k)
def ff(*a): r = run(['ffmpeg', '-y', '-loglevel', 'error', *a]); assert r.returncode == 0, r.stderr; return r
ap = argparse.ArgumentParser(); ap.add_argument('dir'); ap.add_argument('--strip', default='5.8:7.2'); ap.add_argument('--native'); ap.add_argument('--note', default='')
ap.add_argument('--manual', default=''); ap.add_argument('--status', default='qa'); ap.add_argument('--grain', default='0')
a = ap.parse_args(); D = os.path.abspath(a.dir); sid = os.path.basename(D)
inv = {r['folder'].split('/')[-1]: r for r in json.load(open(f'{B}/STYLE_INVENTORY.json'))['styles']}[sid]
os.makedirs(f'{D}/qa', exist_ok=True)
V = f'{D}/build/video.mp4'
common = f'{B}/reference/original_audio_48k.wav'
mux = lambda aud, out: run(['sh', f'{LIB}/core/render/mux.sh', V, aud, out, '30', a.grain])
r = mux(common, f'{D}/final.mp4'); assert os.path.exists(f'{D}/final.mp4'), r.stderr[-800:]
if a.native: r = mux(a.native, f'{D}/final_native.mp4'); assert os.path.exists(f'{D}/final_native.mp4'), r.stderr[-800:]
ff('-i', f'{D}/final.mp4', '-vf', 'scale=960:540', '-c:v', 'libx264', '-crf', '26', '-preset', 'medium', '-c:a', 'aac', '-b:a', '128k', f'{D}/preview.mp4')
ff('-ss', '4.4', '-i', f'{D}/final.mp4', '-frames:v', '1', '-vf', 'scale=640:360', f'{D}/thumbnail.png')
ff('-i', f'{D}/final.mp4', '-vf', "fps=2,scale=384:-1,drawtext=text='%{pts\\:hms}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile=5x4:padding=3", '-frames:v', '1', f'{D}/qa/contact_sheet.png')
s0, s1 = map(float, a.strip.split(':'))
ff('-ss', str(s0), '-to', str(s1), '-i', f'{D}/final.mp4', '-vf', 'fps=5,scale=384:-1,tile=7x1:padding=3', '-frames:v', '1', f'{D}/qa/strip.png')
# measurements
p = json.loads(run(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', f'{D}/final.mp4']).stdout)
v = next(s for s in p['streams'] if s['codec_type'] == 'video'); au = next(s for s in p['streams'] if s['codec_type'] == 'audio')
m = run(['ffmpeg', '-hide_banner', '-nostats', '-i', f'{D}/final.mp4', '-vf', 'blackdetect=d=0.04:pix_th=0.06,freezedetect=n=0.0008:d=0.7', '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
blacks = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', m); fz = list(zip(re.findall(r'freeze_start: ([\d.]+)', m), re.findall(r'freeze_end: ([\d.]+)', m)))
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', m)[-1]); TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', m)[-1])
rig = json.load(open(f'{D}/animation/rig_qa.json')) if os.path.exists(f'{D}/animation/rig_qa.json') else None
M = {'frames': int(v['nb_read_frames']), 'fps': v['r_frame_rate'], 'size': f"{v['width']}x{v['height']}", 'codec': v['codec_name'], 'pix_fmt': v['pix_fmt'],
     'duration_s': float(p['format']['duration']), 'audio': f"{au['codec_name']} {au['sample_rate']} Hz {au['channels']} ch", 'black': blacks, 'frozen_ge_0.7s': fz,
     'lufs': I, 'true_peak_dbtp': TP, 'size_mb': round(os.path.getsize(f'{D}/final.mp4') / 1e6, 1)}
fails = []
if M['frames'] != 300: fails.append(f"{M['frames']} frames (expected 300)")
if M['size'] != '1920x1080': fails.append('size')
if M['fps'] != '30/1': fails.append('fps')
if blacks: fails.append(f'black frames {blacks}')
if TP > -1.0: fails.append(f'true peak {TP}')
if rig and not rig['pass']: fails.append('rig QA failed')
rep = [f"# {sid} — {inv['name']} ({inv['category']}) — QA report", '',
       f"Style construction: {', '.join(inv['engine'])}. Narrative adaptation: {'yes' if inv['narrative_adaptation'] else 'no'}.", '',
       '## Automated checks (measured on final.mp4)', '```', json.dumps(M, indent=1), '```']
if rig: rep += ['## Rig QA (all 300 frames, `shared/qa/rig_check.mjs`)', '```', json.dumps({k: rig[k] for k in ['bone', 'kneeBackward', 'slideMaxU', 'slideFrames', 'belowGround', 'adjustments', 'lifted', 'pass']}, indent=1), '```',
               'bone = [min, max] measured length in u over all frames (constant ⇒ no stretching); slide = planted-foot drift between frames.']
rep += ['## Visual review (done by the agent on stills / strips — not full-speed playback)', a.manual or '(none recorded)', '',
        '## Needs a human', '- full-speed viewing; listening to the mix', '', f"**Automated result:** {'PASS' if not fails else 'FAIL — ' + '; '.join(fails)}", '', a.note]
open(f'{D}/qa_report.md', 'w').write('\n'.join(rep) + '\n')
json.dump({'status': 'done' if (not fails and a.status == 'done') else ('qa' if not fails else 'wip'), 'note': a.note[:140], 'measured': M, 'fails': fails}, open(f'{D}/status.json', 'w'), indent=1)
print(json.dumps({'fails': fails, **{k: M[k] for k in ['frames', 'lufs', 'true_peak_dbtp', 'size_mb']}}))
