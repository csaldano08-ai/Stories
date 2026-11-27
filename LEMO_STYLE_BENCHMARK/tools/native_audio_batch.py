#!/usr/bin/env python3
"""Generate the native sound design (shared/audio/native.py) for every style that has a rendered build/video.mp4 and mux it into
final_native.mp4 (the same video as final.mp4, the style's own sound instead of the common audio). Skips blocked styles and styles
already done unless --force. Usage: $LEMO_PY tools/native_audio_batch.py [--force] [slug-number ...]"""
import glob, json, os, subprocess, sys
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); LIB = os.environ['LIB']
force = '--force' in sys.argv; only = [a for a in sys.argv[1:] if a.isdigit()]
for d in sorted(glob.glob(f'{B}/styles/[0-9][0-9][0-9]_*')):
    n = os.path.basename(d)[:3]
    if only and n not in only: continue
    V = f'{d}/build/video.mp4'; out = f'{d}/final_native.mp4'
    if not os.path.exists(V) or not os.path.exists(f'{d}/final.mp4'): continue
    if os.path.exists(out) and not force: continue
    r = subprocess.run([sys.executable, f'{B}/shared/audio/native.py', d], capture_output=True, text=True, cwd=f'{B}/shared/audio')
    if r.returncode: print(n, 'AUDIO FAILED', r.stderr[-300:]); continue
    m = subprocess.run(['sh', f'{LIB}/core/render/mux.sh', V, f'{d}/audio/native.wav', out, '30', '0'], capture_output=True, text=True)
    ok = os.path.exists(out) and os.path.getsize(out) > 1e5
    print(n, os.path.basename(d)[4:], 'ok' if ok else 'MUX FAILED ' + m.stderr[-200:], r.stdout.strip().split('peak')[-1].strip(), flush=True)
