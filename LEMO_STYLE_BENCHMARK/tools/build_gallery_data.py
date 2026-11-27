#!/usr/bin/env python3
"""Write gallery/data.json from STYLE_INVENTORY.json + each style's status.json and files (run after every finished style)."""
import json, os
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
inv = json.load(open(f'{B}/STYLE_INVENTORY.json'))
out = {'reference': {'id': '000', 'name': 'Original — Last Train Home', 'category': 'Reference', 'video': 'reference/original_clip.mp4',
                     'preview': 'reference/original_clip.mp4', 'thumb': 'gallery/ref_thumb.png'}, 'styles': []}
for r in inv['styles']:
    d = f"{B}/{r['folder']}"; st = {'status': 'blocked' if r['needs_image_generator'] else 'queued', 'note': ''}
    if os.path.exists(f'{d}/status.json'): st.update(json.load(open(f'{d}/status.json')))
    has = lambda f: os.path.exists(f'{d}/{f}')
    out['styles'].append({'id': r['bench_id'], 'slug': r['slug'], 'name': r['name'], 'category': r['category'], 'series': r['series'],
        'status': st['status'], 'note': st.get('note', ''), 'adaptation': r['narrative_adaptation'], 'engine': r['engine'],
        'video': f"{r['folder']}/final.mp4" if has('final.mp4') else None, 'native': f"{r['folder']}/final_native.mp4" if has('final_native.mp4') else None,
        'preview': f"{r['folder']}/preview.mp4" if has('preview.mp4') else None, 'thumb': f"{r['folder']}/thumbnail.png" if has('thumbnail.png') else None,
        'report': f"{r['folder']}/qa_report.md" if has('qa_report.md') else None})
json.dump(out, open(f'{B}/gallery/data.json', 'w'), indent=1, ensure_ascii=False)
print(sum(1 for s in out['styles'] if s['video']), 'clips with video /', len(out['styles']))
