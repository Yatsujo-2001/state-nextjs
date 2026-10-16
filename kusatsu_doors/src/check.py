# -*- coding: utf-8 -*-
"""STEP3 整合性チェック: 寸法関係・図間の表記一致・開閉方向・文字重なり"""
import itertools
import d1
from engine import ITEMS, text_w

ok = []; ng = []


def chk(name, cond, detail=''):
    (ok if cond else ng).append((name, detail))


# ---- 1. 寸法の算定関係
chk('DW(KITCHEN)=開口686−3−3=680', d1.DW_K == d1.OPEN_K - 2 * d1.CL == 680)
chk('DW(TOILET)=内法671+枠出23−3−3=688', d1.DW_T == d1.INNER_W + d1.HJ_PROJ - 2 * d1.CL == 688)
chk('開口686=内法671+欠込み15', d1.OPEN_K == d1.INNER_W + d1.REB_D)
chk('戸先段欠き出寸法(683−668)=欠込み深さ15', d1.X_LIP - d1.X_BODY == d1.REB_D)
chk('段欠き厚10+クリアランス3=欠込み見込13', d1.LIP + d1.CL == d1.REB_T)
chk('段欠き10+本体43=扉厚53', d1.LIP + (d1.T - d1.LIP) == d1.T == 53)
chk('DH(KITCHEN面)=2380−3−10=2367', d1.DH_K == d1.Z_REB - d1.CL - d1.UC == 2367)
chk('DH(TOILET面)=2370−3−10=2357', d1.DH_T == d1.Z_SOF - d1.CL - d1.UC == 2357)
chk('上部段欠き出寸法(2377−2367)=上枠欠込み10', d1.Z_TOP_K - d1.Z_TOP_T == d1.Z_REB - d1.Z_SOF == 10)
chk('天井〜欠込み天端=2398−2380=18', d1.Z_CEIL - d1.Z_REB == 18)
chk('吊元TOILET段欠き先端〜枠見付=3', -d1.HJ_PROJ + d1.CL == d1.X_HL)
chk('扉TOILET面〜壁TOILET面=166−53=113', d1.WALL - d1.T == 113)

# ---- 2. 図ごとの寸法表記 (テキストをビュー領域で分類)
views = {
    '平面': (12, 12, 270, 92),
    'KITCHEN正面': (12, 92, 135, 274),
    'TOILET正面': (135, 92, 235, 274),
    '断面': (235, 92, 312, 274),
    '上部詳細': (312, 95, 410, 150),
    '下部詳細': (312, 160, 410, 215),
}
texts = [it for it in ITEMS if it['t'] == 'text']


def in_view(it, v):
    x0, y0, x1, y1 = views[v]
    x, y = it['p']
    return x0 <= x <= x1 and y0 <= y <= y1


def has(v, s):
    return any(s in it['s'] for it in texts if in_view(it, v))


expect = [
    ('DW=680', ['平面', 'KITCHEN正面']),
    ('DW=688', ['平面', 'TOILET正面']),
    ('686', ['平面', 'KITCHEN正面']),
    ('694', ['平面', 'TOILET正面']),
    ('671', ['平面']),
    ('DH=2367', ['KITCHEN正面', '断面']),
    ('DH=2357', ['TOILET正面', '断面']),
    ('開口H=2380', ['KITCHEN正面', '断面']),
    ('開口H=2370', ['TOILET正面', '断面']),
    ('2398', ['KITCHEN正面', '断面', '上部詳細']),
    ('2380', ['上部詳細']),
    ('2370', ['上部詳細']),
    ('t53', ['平面', '断面', '下部詳細']),
    ('13', ['上部詳細']),
    ('10', ['平面', '上部詳細', '下部詳細', 'KITCHEN正面', 'TOILET正面', '断面']),
]
for s, vs in expect:
    for v in vs:
        chk('表記「%s」が%sにある' % (s, v), has(v, s))

# ---- 3. 開閉方向・吊元位置
blue_rects_K = [it for it in ITEMS if it['t'] == 'poly' and it['layer'] == '金物' and it['closed']
                and 92 < it['pts'][0][1] < 274 and 12 < it['pts'][0][0] < 135 and not it['dash']]
blue_rects_T = [it for it in ITEMS if it['t'] == 'poly' and it['layer'] == '金物' and it['closed']
                and 92 < it['pts'][0][1] < 274 and 135 < it['pts'][0][0] < 235 and it['dash']]
kd_cx = (d1.KE(d1.CL, 0)[0] + d1.KE(d1.X_LIP, 0)[0]) / 2
td_cx = (d1.TE(d1.X_HL, 0)[0] + d1.TE(d1.X_BODY, 0)[0]) / 2
hingeK = [r for r in blue_rects_K if abs(r['pts'][0][0] - r['pts'][2][0]) < 3]
hingeT = [r for r in blue_rects_T if abs(r['pts'][0][0] - r['pts'][2][0]) < 3]
chk('KITCHEN側正面：吊元が右（丁番が扉中心より右）', hingeK and all(r['pts'][0][0] > kd_cx for r in hingeK))
chk('TOILET側正面：吊元が左（丁番隠れ線が扉中心より左）', hingeT and all(r['pts'][0][0] < td_cx for r in hingeT))
chk('KITCHEN／TOILET 丁番数一致', len(hingeK) == len(hingeT) == 3, '%d / %d' % (len(hingeK), len(hingeT)))
chk('平面：丁番軸がKITCHEN側（Y<0）', d1.HC[1] > d1.P(0, 0)[1])
from engine import DASH_SWING, DASH_HIDDEN
arc = [it for it in ITEMS if it['t'] == 'poly' and it['dash'] == DASH_SWING]
chk('平面：開き軌跡がKITCHEN側（KITCHEN面より下）', arc and all(p[1] >= d1.P(0, 0)[1] - 0.01 for p in arc[0]['pts']))
hK = [it for it in ITEMS if it['t'] == 'poly' and it['layer'] == '金物' and it['dash'] == DASH_HIDDEN
      and 12 < it['pts'][0][0] < 135 and 92 < it['pts'][0][1] < 274]
hT = [r for r in blue_rects_T if abs(r['pts'][0][0] - r['pts'][2][0]) >= 3]
chk('KITCHEN側正面：取手が戸先側（左）', hK and all(r['pts'][0][0] < kd_cx for r in hK))
chk('TOILET側正面：取手が戸先側（右）', hT and all(r['pts'][0][0] > td_cx for r in hT))
chk('取手高さ：両面同一', hK and hT and abs(hK[0]['pts'][0][1] - hT[0]['pts'][0][1]) < 0.01)

# ---- 4. 文字の重なり (概算外接矩形)


def bbox(it):
    x, y = it['p']; sz = it['size']; w = text_w(it['s'], sz)
    if it['rot'] == 0:
        x0 = {'start': x, 'middle': x - w / 2, 'end': x - w}[it['anchor']]
        return (x0, y - sz * 0.85, x0 + w, y + sz * 0.1)
    # rot -90 : reads upward, glyph tops point to -x
    y0 = {'start': y - w, 'middle': y - w / 2, 'end': y}[it['anchor']]
    return (x - sz * 0.85, y0, x + sz * 0.1, y0 + w)


overl = []
bxs = [(it, bbox(it)) for it in texts if it['s'].strip()]
for (a, A), (b, B) in itertools.combinations(bxs, 2):
    ix = min(A[2], B[2]) - max(A[0], B[0]); iy = min(A[3], B[3]) - max(A[1], B[1])
    if ix > 0.25 and iy > 0.25:
        overl.append((a['s'], b['s'], round(ix, 2), round(iy, 2)))
chk('文字同士の重なりなし', not overl, str(overl[:10]))

print('OK %d / NG %d' % (len(ok), len(ng)))
for n, d in ng:
    print('NG:', n, d)
if __name__ == '__main__':
    import json
    json.dump({'ok': [n for n, _ in ok], 'ng': [(n, d) for n, d in ng]}, open('check_result.json', 'w'), ensure_ascii=False, indent=1)
