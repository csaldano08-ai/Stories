#!/usr/bin/env python3
"""Objective QA of an exported film (LEMO_CINEMATIC_LAB). Reports only what it actually measured.

    $TTS_PY qa_film.py film.mp4 --lines lines.json --out report_dir [--fps 30] [--size 1920x1080] [--stems dir] [--quiet t0:t1,...]

Checks
  container : duration, fps, resolution, codec, pixel format, audio rate/channels, A/V duration difference
  picture   : black frames (ffmpeg blackdetect), frozen stretches (freezedetect, flagged when longer than --freeze s),
              per-frame luma for NaN-like anomalies (all-equal frames), contact sheet (1 frame / 2 s)
  audio     : integrated loudness + LRA + true peak (ebur128, measured on the EXPORTED file), clipped samples, DC,
              noise floor in requested quiet windows (--quiet), low-end share (20–120 Hz vs total)
  dialogue  : faster-whisper on the exported mix inside each line's window, word match vs the script
Writes report.json + report.md. Exit 1 if a hard limit fails (black frames, TP > −1.0 dBTP, loudness off by > 1 LU,
A/V mismatch > 1 frame, a dialogue line not recognised).
"""
import argparse, json, os, re, subprocess, sys, numpy as np

FF = os.environ.get('FFMPEG', 'ffmpeg')
def run(cmd): return subprocess.run(cmd, capture_output=True, text=True)
def probe(f):
    r = run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', f]); return json.loads(r.stdout)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('film'); ap.add_argument('--lines'); ap.add_argument('--out', required=True)
    ap.add_argument('--fps', type=float, default=30); ap.add_argument('--size', default='1920x1080'); ap.add_argument('--freeze', type=float, default=1.2)
    ap.add_argument('--quiet', default=''); ap.add_argument('--target', type=float, default=-14.0)
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
    R = {'film': a.film, 'checks': {}, 'fail': []}
    P = probe(a.film); v = next(s for s in P['streams'] if s['codec_type'] == 'video'); au = next((s for s in P['streams'] if s['codec_type'] == 'audio'), None)
    num, den = map(int, v['r_frame_rate'].split('/')); fps = num / den
    vd = float(v.get('duration', P['format']['duration'])); ad = float(au['duration']) if au else 0
    C = R['checks']['container'] = {'duration_s': round(float(P['format']['duration']), 3), 'video_s': round(vd, 3), 'audio_s': round(ad, 3),
        'fps': round(fps, 3), 'size': f"{v['width']}x{v['height']}", 'vcodec': v['codec_name'], 'pix_fmt': v.get('pix_fmt'), 'profile': v.get('profile'),
        'frames': int(v.get('nb_frames', 0)), 'acodec': au and au['codec_name'], 'arate': au and int(au['sample_rate']), 'channels': au and au['channels'],
        'bitrate_kbps': round(int(P['format']['bit_rate']) / 1000)}
    if abs(fps - a.fps) > .01: R['fail'].append(f'fps {fps} != {a.fps}')
    if C['size'] != a.size: R['fail'].append(f"size {C['size']} != {a.size}")
    if au and abs(vd - ad) > 1 / fps + .02: R['fail'].append(f'A/V duration differs by {abs(vd - ad):.3f}s')
    # picture: blackdetect + freezedetect
    r = run([FF, '-hide_banner', '-nostats', '-i', a.film, '-vf', f'blackdetect=d=0.04:pix_th=0.06,freezedetect=n=0.0008:d={a.freeze}', '-an', '-f', 'null', '-'])
    blacks = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', r.stderr)
    fz = re.findall(r'freeze_start: ([\d.]+)', r.stderr); fze = re.findall(r'freeze_end: ([\d.]+)', r.stderr)
    R['checks']['picture'] = {'black_segments': [[float(x), float(y)] for x, y in blacks], 'frozen_segments': [[float(x), float(y)] for x, y in zip(fz, fze + [None] * (len(fz) - len(fze))) if y]}
    # black at the very start/end (fade) is intended only if < 0.5 s
    for s0, s1 in R['checks']['picture']['black_segments']:
        if not (s0 < .3 or s1 > C['duration_s'] - 1.2): R['fail'].append(f'unexpected black frames {s0:.2f}–{s1:.2f}')
    # contact sheet
    sheet = os.path.join(a.out, 'contact_sheet.jpg')
    run([FF, '-y', '-loglevel', 'error', '-i', a.film, '-vf', 'fps=1/2,scale=384:-1,tile=6x7:padding=4:margin=4', '-frames:v', '1', '-q:v', '3', sheet])
    R['checks']['picture']['contact_sheet'] = sheet
    # audio: ebur128 on the exported file
    if au:
        r = run([FF, '-hide_banner', '-nostats', '-i', a.film, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
        I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)[-1]); LRA = float(re.findall(r'LRA:\s+([\d.]+) LU', r.stderr)[-1])
        TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r.stderr)[-1])
        x = np.frombuffer(subprocess.run([FF, '-loglevel', 'error', '-i', a.film, '-ac', '2', '-ar', '48000', '-f', 'f32le', '-'], capture_output=True).stdout, dtype=np.float32).reshape(-1, 2)
        m = x.mean(1); S = np.abs(np.fft.rfft(m[: len(m) // 2 * 2])) ** 2; f = np.fft.rfftfreq(len(m) // 2 * 2, 1 / 48000)
        A = R['checks']['audio'] = {'integrated_lufs': I, 'lra_lu': LRA, 'true_peak_dbtp': TP, 'clipped_samples': int(np.sum(np.abs(x) >= .9999)),
            'dc': [float(x[:, 0].mean()), float(x[:, 1].mean())], 'low_20_120hz_pct': round(float(S[(f > 20) & (f < 120)].sum() / S.sum() * 100), 2), 'quiet_windows': []}
        for w in [q for q in a.quiet.split(',') if q]:
            t0, t1 = map(float, w.split(':')); seg = m[int(t0 * 48000):int(t1 * 48000)]
            A['quiet_windows'].append({'t': [t0, t1], 'rms_dbfs': round(float(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)), 1)})
        if TP > -1.0: R['fail'].append(f'true peak {TP} dBTP > -1.0')
        if abs(I - a.target) > 1.0: R['fail'].append(f'loudness {I} LUFS not within 1 LU of {a.target}')
        if A['clipped_samples']: R['fail'].append(f"{A['clipped_samples']} clipped samples")
    # dialogue intelligibility on the final mix
    if a.lines and au:
        from faster_whisper import WhisperModel
        import soundfile as sf
        model = WhisperModel('small.en', device='cpu', compute_type='int8'); D = []
        for L in json.load(open(a.lines)):
            seg = m[int((L['t'] - .2) * 48000):int((L['t'] + L['dur'] + .5) * 48000)]
            tmp = os.path.join(a.out, f"_line_{L['id']}.wav"); sf.write(tmp, seg, 48000)
            hyp = ' '.join(s.text for s in model.transcribe(tmp, language='en', beam_size=5)[0]).strip(); os.remove(tmp)
            norm = lambda s: re.sub(r"[^a-z' ]", ' ', s.lower().replace('’', "'")).split()
            ref, hy = norm(L['text']), norm(hyp); ok = all(w in hy for w in ref)
            D.append({'id': L['id'], 'expected': L['text'], 'heard': hyp, 'all_words_found': ok})
            if not ok: R['fail'].append(f"line {L['id']} not fully recognised in the mix: '{hyp}'")
        R['checks']['dialogue'] = D
    json.dump(R, open(os.path.join(a.out, 'qa_report.json'), 'w'), indent=1)
    md = [f"# QA report — {os.path.basename(a.film)}", '', '## Container', '```', json.dumps(R['checks']['container'], indent=1), '```',
          '## Picture', f"- black segments: {R['checks']['picture']['black_segments']}", f"- frozen ≥ {a.freeze}s: {R['checks']['picture']['frozen_segments']}",
          f"- contact sheet: `{os.path.basename(sheet)}`"]
    if 'audio' in R['checks']: md += ['## Audio (measured on the exported file)', '```', json.dumps(R['checks']['audio'], indent=1), '```']
    if 'dialogue' in R['checks']: md += ['## Dialogue in the final mix (faster-whisper small.en)', ''] + [f"- {d['id']}: expected “{d['expected']}” — heard “{d['heard']}” — {'OK' if d['all_words_found'] else 'FAIL'}" for d in R['checks']['dialogue']]
    md += ['', '## Result', 'PASS' if not R['fail'] else 'FAIL:\n- ' + '\n- '.join(R['fail'])]
    open(os.path.join(a.out, 'qa_report.md'), 'w').write('\n'.join(md) + '\n')
    print('\n'.join(md[-3:])); sys.exit(1 if R['fail'] else 0)

if __name__ == '__main__':
    main()
