#!/usr/bin/env python3
"""Generate STYLE_INVENTORY.json from the INSTALLED Lemo-Opuscar library (no style is invented: only styles/*/style.json are listed).
Every field is extracted from the style's own STYLE.md / style.json / DEMO.md; 'engine' and 'adaptation' are derived by rules stated below."""
import json, glob, os, re, sys
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
FIRST = ['cel-anime-80s', 'rubber-hose', 'midcentury-toon', 'scifi-toon', 'manga-panels', 'hd-2d', 'pixel-rpg', 'brick-toy', 'lowpoly-island',
         'crayon-world', 'isometric-picture-book', 'tilt-shift', 'stick-explainer', 'watercolor', 'crayon-book', 'ink-wash', 'ukiyoe', 'paper-lantern',
         'backrooms', 'neon-tubes']
CAT_ORDER = ['Edit & Documentary', 'Painting & Illustration', 'Sketch & Board', 'Traditional Crafts', 'Print & Printmaking', 'Graphic & Type', 'Line Diagrams',
             'Cartoons', 'Games', 'Film & Tape', 'Screens & Interfaces', 'Light & Lines', '3D & Miniature', 'Instruments & Evidence', 'Data & Maps']
NARRATIVE_ADAPT = {'Edit & Documentary', 'Line Diagrams', 'Screens & Interfaces', 'Instruments & Evidence', 'Data & Maps'}

def section(md, num):
    m = re.search(rf'^## {num}\.[^\n]*\n(.*?)(?=^## \d+\.|\Z)', md, re.S | re.M); return m.group(1).strip() if m else ''
def bullets(txt, n=8):
    out = []
    for l in txt.splitlines():
        l = l.strip()
        if l.startswith('- ') or l.startswith('* '):
            b = re.sub(r'\*\*', '', l[2:]); out.append(b[:260])
    return out[:n]
def first_par(txt):
    for p in txt.split('\n\n'):
        p = p.strip()
        if p and not p.startswith('|'): return re.sub(r'\s+', ' ', re.sub(r'\*\*', '', p))[:600]
    return ''
def camera_moves(txt):
    rows = [l for l in txt.splitlines() if l.startswith('|') and not set(l) <= set('|- ')]
    return [r.split('|')[1].strip() for r in rows[1:]][:12]
def native_moves(txt):
    return [re.sub(r'\*\*', '', m) for m in re.findall(r'^- \*\*([^*]+)\*\*', txt, re.M)][:10]

def engine(md, sj):
    """Derived from the style's own §10 Engine + §2 Materials text (not from the whole file, which mentions data/footage loosely)."""
    t = (section(md, 10) + '\n' + section(md, 2)).lower(); e = []
    if re.search(r'three\.js|three/|gtao|meshphysical|webgl2? (scene|3d)|\.glb|hdri', t): e.append('three.js 3D (WebGL)')
    if re.search(r'footage|archive (film|clip|reel)|newsreel|video clips?', t): e.append('real footage / archive (licensed)')
    if 'image-generation' in json.dumps(sj) or 'image generator' in t: e.append('image generator (external)')
    if re.search(r'satellite|sentinel|landsat|lidar|point cloud|laz\b|las\b|dem\b|elevation', t): e.append('real data / imagery')
    if re.search(r'webgl|glsl|shader', t) and not e[:1] == ['three.js 3D (WebGL)']: e.append('WebGL shader pass')
    if re.search(r'canvas|2d', t) or not e: e.insert(0, 'Canvas 2D')
    if 'svg' in t: e.append('SVG')
    return list(dict.fromkeys(e))

def deps(md):
    found = set()
    for k in ['laspy', 'pdal', 'rasterio', 'gdal', 'shapely', 'geopandas', 'pyproj', 'opencv', 'cv2', 'yt-dlp', 'ffmpeg', 'three', 'numba', 'librosa', 'Codex', 'faster-whisper',
              'kokoro', 'edge-tts', 'sampler.py', 'pluck.py', 'HDRI', 'Poly Haven', 'Natural Earth', 'Sentinel', 'Landsat', 'Wikimedia', 'Internet Archive', 'OpenStreetMap']:
        if k.lower() in md.lower(): found.add(k)
    return sorted(found)

rows = []
for f in sorted(glob.glob(f'{LIB}/styles/*/style.json')):
    if '/_template/' in f: continue
    sj = json.load(open(f)); slug = sj['slug']; d = os.path.dirname(f)
    md = open(f'{d}/STYLE.md').read(); demo = os.path.exists(f'{d}/DEMO.md')
    rows.append({
        'slug': slug, 'name': sj['en'].replace(' ✦', ''), 'name_cn': sj.get('cn'), 'category': sj['category_en'], 'library_num': sj.get('num'),
        'official_demo': sj.get('film'), 'official_demo_line': sj.get('line'), 'needs': sj.get('needs', []),
        'needs_image_generator': 'image-generation' in sj.get('needs', []),
        'principles': first_par(section(md, 1)),
        'construction': bullets(section(md, 2), 6),
        'colour_logic': bullets(section(md, 3), 4),
        'motion': bullets(section(md, 5), 6),
        'camera_grammar': camera_moves(section(md, 6)),
        'sound_palette': bullets(section(md, 7), 4),
        'native_moves': native_moves(section(md, 8)),
        'pitfalls_limits': bullets(section(md, 9), 8),
        'engine_section': first_par(section(md, 10)),
        'engine': engine(md, sj),
        'dependencies_mentioned': deps(md),
        'external_tools': (['image generator (Codex CLI or equivalent)'] if 'image-generation' in sj.get('needs', []) else []) + (['real footage/archive sources (licensed)'] if sj['category_en'] == 'Edit & Documentary' else []),
        'narrative_adaptation': sj['category_en'] in NARRATIVE_ADAPT,
        'has_demo_md': demo,
    })
first = [r for s in FIRST for r in rows if r['slug'] == s]
rest = sorted([r for r in rows if r['slug'] not in FIRST], key=lambda r: (CAT_ORDER.index(r['category']), r['library_num'] or ''))
for i, r in enumerate(first + rest, 1):
    r['bench_id'] = f'{i:03d}'; r['folder'] = f"styles/{i:03d}_{r['slug']}"; r['series'] = 1 if i <= 20 else 2
inv = first + rest
assert len(inv) == 99 and len({r['slug'] for r in inv}) == 99, len(inv)
lib_commit = os.popen(f'git -C {LIB} rev-parse --short HEAD').read().strip()
json.dump({'library': LIB, 'library_commit': lib_commit, 'count': len(inv), 'categories': {c: sum(r['category'] == c for r in inv) for c in CAT_ORDER},
           'styles': inv}, open(sys.argv[1], 'w'), indent=1, ensure_ascii=False)
print(len(inv), 'styles,', sum(r['needs_image_generator'] for r in inv), 'need an image generator,', sum(r['narrative_adaptation'] for r in inv), 'narrative adaptations; commit', lib_commit)
