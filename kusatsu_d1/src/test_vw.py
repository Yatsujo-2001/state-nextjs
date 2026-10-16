# -*- coding: utf-8 -*-
"""Run the generated Vectorworks script against the mock `vs` and verify layers, scales, real sizes
and the printed-page result (compared with the original SVG drawing)."""
import sys, os, subprocess, json
from mock_vs import run_script

SCRIPT = sys.argv[1] if len(sys.argv) > 1 else '../D1_建具製作図_VW.py'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'vwtest'
os.makedirs(OUT, exist_ok=True)
EXPECT = {'00_図枠・表題_1-1': 1, '01_平面詳細図_1-5': 5, '02_KITCHEN側正面図_1-15': 15,
          '03_TOILET側正面図_1-15': 15, '04_断面詳細図_1-15': 15, '05_上部詳細図_1-5': 5, '06_下部詳細図_1-5': 5}
results = {}


def flat(objs):
    for o in objs:
        if o['kind'] == 'group':
            yield from flat(o['items'])
        else:
            yield o


def bbox(o, f):
    pts = o['pts']
    xs = [p[0] / f for p in pts]; ys = [p[1] / f for p in pts]
    return max(xs) - min(xs), max(ys) - min(ys)


configs = {
    'A_mm_sep_center': dict(mode='sep', units_upi=25.4, page_center=(0.0, 0.0)),
    'B_inch_tuple_offset_noClosePoly': dict(mode='tup', units_upi=1.0, page_center=(37.0, -12.0), has_close=False),
    'C_mm_noDrawingRect': dict(mode='sep', units_upi=25.4, page_center=(0.0, 0.0), has_rect=False),
}
for name, kw in configs.items():
    m = run_script(SCRIPT, **kw)
    f = kw['units_upi'] / 25.4
    st = m.stats()
    r = {'alert': m.alerts[-1] if m.alerts else None, 'layers': {k: v for k, v in st.items()}}
    r['scale_ok'] = all(abs(st[k][0] - v) < 1e-9 for k, v in EXPECT.items())
    r['fail0'] = bool(m.alerts) and '失敗 0' in m.alerts[-1]
    # real-size checks (world units -> mm)
    L = m.layers
    heavy = lambda lay: [o for o in flat(L[lay]['objs']) if o['kind'] == 'poly' and o.get('lw') == 12]
    plan_door = [bbox(o, f) for o in heavy('01_平面詳細図_1-5') if len(o['pts']) in (8, 9)]
    ke_door = [bbox(o, f) for o in heavy('02_KITCHEN側正面図_1-15') if len(o['pts']) in (4, 5)]
    te_door = [bbox(o, f) for o in heavy('03_TOILET側正面図_1-15') if len(o['pts']) in (4, 5)]
    se_door = [bbox(o, f) for o in heavy('04_断面詳細図_1-15') if len(o['pts']) in (6, 7)]
    r['real_size'] = {'平面 扉外形 (幅703×厚53)': [tuple(round(v, 3) for v in b) for b in plan_door],
                      'KITCHEN面 扉 (680×2367)': [tuple(round(v, 3) for v in b) for b in ke_door],
                      'TOILET面 扉 (688×2357)': [tuple(round(v, 3) for v in b) for b in te_door],
                      '断面 扉 (53×2367)': [tuple(round(v, 3) for v in b) for b in se_door]}
    r['size_ok'] = (plan_door == [(703.0, 53.0)] or [tuple(round(v, 3) for v in b) for b in plan_door] == [(703.0, 53.0)]) \
        and [tuple(round(v, 3) for v in b) for b in ke_door] == [(680.0, 2367.0)] \
        and [tuple(round(v, 3) for v in b) for b in te_door] == [(688.0, 2357.0)] \
        and [tuple(round(v, 3) for v in b) for b in se_door] == [(53.0, 2367.0)]
    texts = [o for o in flat(sum([L[k]['objs'] for k in L], [])) if o['kind'] == 'text']
    r['texts'] = len(texts)
    r['rotated_texts'] = sum(1 for t in texts if t['angle'])
    r['colored_texts'] = sum(1 for t in texts if 'tcolor' in t)
    from collections import Counter
    r['white_fill_left'] = dict(Counter(o['kind'] for o in flat(sum([L[k]['objs'] for k in L], []))
                               if o.get('fpat') == 1 and o.get('fill') == (65535, 65535, 65535)))
    m.render_svg(os.path.join(OUT, name + '.svg'))
    results[name] = r
print(json.dumps(results, ensure_ascii=False, indent=1))
