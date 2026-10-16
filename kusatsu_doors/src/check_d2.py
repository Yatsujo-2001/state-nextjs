# -*- coding: utf-8 -*-
"""D2 整合性チェック: 寸法関係・表面材割付・図間の表記一致・開閉方向・文字重なり"""
import itertools
from collections import Counter
import d2
from engine import ITEMS, text_w, DASH_SWING, DASH_HIDDEN

ok = []; ng = []


def chk(name, cond, detail=''):
    (ok if cond else ng).append((name, detail))


# ---- 1. 寸法の算定関係
chk('DW(KITCHEN)=開口780−3−3=774', d2.DW_K == d2.OPEN_K - 2 * d2.CL == 774)
chk('DW(STORAGE)=内法765+枠出28−3−3=787', d2.DW_T == d2.INNER_W + d2.HJ_PROJ - 2 * d2.CL == 787)
chk('開口780=内法765+欠込み15', d2.OPEN_K == d2.INNER_W + d2.REB_D)
chk('戸先段欠き出寸法(777−762)=欠込み深さ15', d2.X_LIP - d2.X_BODY == d2.REB_D)
chk('段欠き11+クリアランス3=欠込み見込14', d2.LIP + d2.CL == d2.REB_T == 14)
chk('段欠き11+本体42=扉厚53', d2.LIP + (d2.T - d2.LIP) == d2.T == 53)
chk('DH(KITCHEN面)=1777−3−10=1764', d2.DH_K == d2.Z_REB - d2.CL - d2.UC == 1764)
chk('DH(STORAGE面)=1764−3−10=1751', d2.DH_T == d2.Z_SOF - d2.CL - d2.UC == 1751)
chk('上部段欠き出寸法(1774−1761)=手書き13=1777−1764', d2.Z_TOP_K - d2.Z_TOP_T == d2.Z_REB - d2.Z_SOF == 13)
chk('吊元STORAGE段欠き先端〜枠見付=3', -d2.HJ_PROJ + d2.CL == d2.X_HL)
chk('扉STORAGE面〜壁STORAGE面=166−53=113', d2.WALL - d2.T == 113)

# ---- 2. 表面材 4分割割付
for nm, ws, dw in (('KITCHEN面', d2.VEN_K, d2.DW_K), ('STORAGE面', d2.VEN_T, d2.DW_T)):
    chk('%s 4分割' % nm, len(ws) == 4, str(ws))
    chk('%s 割付合計=DW%d' % (nm, dw), abs(sum(ws) - dw) < 1e-9, str(sum(ws)))
    chk('%s 各巾が整数または.5' % nm, all(abs(v * 2 - round(v * 2)) < 1e-9 for v in ws), str(ws))
    chk('%s 最大差0.5以内（ほぼ均等）' % nm, max(ws) - min(ws) <= 0.5, str(ws))
chk('割付目地が扉面内', all(d2.CL < x < d2.X_LIP for x in d2.EDG_K[1:-1]) and all(d2.X_HL < x < d2.X_BODY for x in d2.EDG_T[1:-1]))

# ---- 3. 図ごとの寸法表記（ビュー別）
texts = [it for it in ITEMS if it['t'] == 'text']


def vt(v):
    return [it['s'] for it in texts if it['view'] == v]


def has(v, s):
    return any(s in t for t in vt(v))


expect = [
    ('DW=774', ['plan', 'kitchen']), ('DW=787', ['plan', 'toilet']),
    ('780', ['plan', 'kitchen']), ('793', ['plan', 'toilet']), ('765', ['plan']), ('28', ['plan']), ('15', ['plan']),
    ('DH=1764', ['kitchen', 'section']), ('DH=1751', ['toilet', 'section']),
    ('開口H=1777', ['kitchen', 'section']), ('開口H=1764', ['toilet', 'section']),
    ('1777', ['head']), ('1764', ['head']), ('13', ['head']), ('t53', ['plan', 'section', 'foot']), ('10', ['foot']),
]
for s, vs_ in expect:
    for v in vs_:
        chk('表記「%s」が%sにある' % (s, v), has(v, s))
ck = Counter(vt('kitchen')); ct = Counter(vt('toilet'))
chk('KITCHEN側正面に割付寸法193.5×4', ck['193.5'] == 4, str(ck['193.5']))
chk('STORAGE側正面に割付寸法196.5×2・197×2', ct['196.5'] == 2 and ct['197'] == 2)

# ---- 4. 開閉方向・吊元位置
blue = [it for it in ITEMS if it['t'] == 'poly' and it['layer'] == '金物' and it['closed']]
hk = [b for b in blue if b['view'] == 'kitchen' and not b['dash']]
ht = [b for b in blue if b['view'] == 'toilet' and b['dash'] and abs(b['pts'][0][0] - b['pts'][2][0]) < 3]
handle_k = [b for b in blue if b['view'] == 'kitchen' and b['dash']]
handle_t = [b for b in blue if b['view'] == 'toilet' and b['dash'] and abs(b['pts'][0][0] - b['pts'][2][0]) >= 3]
kc = (d2.KE(d2.CL, 0)[0] + d2.KE(d2.X_LIP, 0)[0]) / 2
tc = (d2.TE(d2.X_HL, 0)[0] + d2.TE(d2.X_BODY, 0)[0]) / 2
chk('KITCHEN側正面：吊元が左', hk and all(b['pts'][0][0] < kc for b in hk))
chk('STORAGE側正面：吊元が右（隠れ線）', ht and all(b['pts'][0][0] > tc for b in ht))
chk('丁番数 両面一致(3)', len(hk) == len(ht) == 3, '%d/%d' % (len(hk), len(ht)))
chk('KITCHEN側正面：取手が戸先側（右）', handle_k and all(b['pts'][0][0] > kc for b in handle_k))
chk('STORAGE側正面：取手が戸先側（左）', handle_t and all(b['pts'][0][0] < tc for b in handle_t))
chk('取手高さ 両面一致', handle_k and handle_t and abs(handle_k[0]['pts'][0][1] - handle_t[0]['pts'][0][1]) < 1e-6)
arc = [it for it in ITEMS if it['t'] == 'poly' and it['dash'] == DASH_SWING]
chk('平面：開き軌跡がKITCHEN側', arc and all(p[1] >= d2.P(0, 0)[1] - 0.01 for p in arc[0]['pts']))
chk('平面：吊元が左（KITCHEN側から見て）', d2.P(0, 0)[0] < d2.P(d2.OPEN_K, 0)[0])
chk('平面：丁番軸がKITCHEN側', d2.HC[1] > d2.P(0, 0)[1])


# ---- 5. 文字の重なり
def bbox(it):
    x, y = it['p']; sz = it['size']; w = text_w(it['s'], sz)
    if it['rot'] == 0:
        x0 = {'start': x, 'middle': x - w / 2, 'end': x - w}[it['anchor']]
        return (x0, y - sz * 0.85, x0 + w, y + sz * 0.1)
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
