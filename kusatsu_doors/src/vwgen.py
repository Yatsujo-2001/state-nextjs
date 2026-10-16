# -*- coding: utf-8 -*-
"""Generate a self-contained Vectorworks Python script that rebuilds a door drawing (d1 / d2 ...)
natively in Vectorworks: one design layer per view with its layer scale
(1:1 sheet, 1:5 plan/details, 1:15 elevations/section) and geometry at real size (mm).

Paper (A3, mm, y down, origin top-left) -> world (mm, y up, origin = page centre):
    X = (x - 210) * S,  Y = (148.5 - y) * S        (S = layer scale denominator)
"""
import sys
import importlib
MODNAME = sys.argv[2] if len(sys.argv) > 2 else 'd1'
MOD = importlib.import_module(MODNAME)          # builds ITEMS
from engine import ITEMS, HATCHES, DASH_HIDDEN, DASH_CENTER, DASH_SWING  # noqa: E402
NO = getattr(MOD, 'DRAWING_NO', 'D1')
OTHER = getattr(MOD, 'OTHER_ROOM', 'TOILET')

PAGE_W, PAGE_H = 420.0, 297.0

LAYERS = [  # (view key, layer name, scale)
    ('sheet', '00_図枠・表題_1-1', 1),
    ('plan', '01_平面詳細図_1-5', 5),
    ('kitchen', '02_KITCHEN側正面図_1-15', 15),
    ('toilet', '03_%s側正面図_1-15' % OTHER, 15),
    ('section', '04_断面詳細図_1-15', 15),
    ('head', '05_上部詳細図_1-5', 5),
    ('foot', '06_下部詳細図_1-5', 5),
]
LIDX = {k: i for i, (k, _, _) in enumerate(LAYERS)}
CLASS_OF = {k: '%s-%s' % (NO, k) for k in ('外形線', '細線', '寸法', '文字', '注記', '図名', '図枠', '金物', '木目')}
CLASSES = sorted(set(CLASS_OF.values())) + ['%s-ハッチ' % NO]
CIDX = {c: i for i, c in enumerate(CLASSES)}
DASHKEY = {tuple(DASH_HIDDEN): 'H', tuple(DASH_CENTER): 'C', tuple(DASH_SWING): 'S'}


def mils(w):
    if w is None or w <= 0.011:
        return 0
    return max(1, int(round(w / 0.0254)))


def r4(v):
    v = round(v, 4)
    return 0.0 if v == 0 else v


def world(p, S):
    return (r4((p[0] - PAGE_W / 2) * S), r4((PAGE_H / 2 - p[1]) * S))


def col(c):
    if not c or c.upper() == '#000000':
        return None
    return c.upper()


def build_data():
    data = []
    for it in ITEMS:
        li = LIDX[it['view']]
        S = LAYERS[li][2]
        ci = CIDX[CLASS_OF.get(it['layer'], CLASS_OF['細線'])]
        if it['t'] == 'poly':
            flat = []
            for p in it['pts']:
                flat.extend(world(p, S))
            dash = DASHKEY.get(tuple(it['dash'])) if it['dash'] else None
            data.append(('P', li, ci, col(it['c']), mils(it['w']), dash, 1 if it['closed'] else 0,
                         it.get('fill'), it.get('hatch'), tuple(flat)))
        elif it['t'] == 'circle':
            cx, cy = world(it['c0'], S)
            dash = DASHKEY.get(tuple(it['dash'])) if it['dash'] else None
            m = mils(it['w'])
            if it['fill'] and m == 0:
                m = 1
            data.append(('C', li, ci, col(it['c']), m, dash, it['fill'], cx, cy, r4(it['r'] * S)))
        elif it['t'] == 'text':
            if not it['s'].strip():
                continue
            x, y = world(it['p'], S)
            just = {'start': 1, 'middle': 2, 'end': 3}[it['anchor']]
            ang = -it['rot'] if it['rot'] else 0
            data.append(('T', li, ci, col(it['c']), round(it['size'], 3), just, ang,
                         1 if it['weight'] == 'bold' else 0, x, y, it['s']))
    return data


RUNTIME = r'''
FONTS = ['ＭＳ ゴシック', 'MS Gothic', 'MS ゴシック', 'ＭＳ Ｐゴシック', 'Osaka',
         'ヒラギノ角ゴ ProN W3', 'Hiragino Kaku Gothic ProN', 'メイリオ', 'Meiryo']


def _call(name, *variants):
    fn = getattr(vs, name, None)
    if fn is None:
        return False
    for args in variants:
        try:
            fn(*args)
            return True
        except Exception:
            continue
    return False


def _rgb(hx):
    hx = hx.lstrip('#')
    return tuple(int(hx[i:i + 2], 16) * 257 for i in (0, 2, 4))


def _pen_color(h, hx):
    r, g, b = _rgb(hx)
    _call('SetPenFore', (h, r, g, b), (h, (r, g, b)))


def _fill_color(h, hx):
    r, g, b = _rgb(hx)
    _call('SetFillBack', (h, r, g, b), (h, (r, g, b)))
    _call('SetFillFore', (h, r, g, b), (h, (r, g, b)))


def _text_color(h, s, hx):
    r, g, b = _rgb(hx)
    idx = None
    fn = getattr(vs, 'RGBToColorIndex', None)
    if fn is not None:
        for args in ((r, g, b), ((r, g, b),)):
            try:
                idx = fn(*args)
                break
            except Exception:
                continue
    if isinstance(idx, (tuple, list)):
        idx = idx[-1] if idx else None
    if idx is not None:
        _call('SetTextColor', (h, 0, len(s), idx))
    _pen_color(h, hx)
    r_, g_, b_ = r, g, b
    _call('SetFillFore', (h, r_, g_, b_), (h, (r_, g_, b_)))


def _attrs(h, color, mil, fill, pen_none):
    if mil > 0:
        vs.SetLW(h, int(mil))
    if pen_none:
        _call('SetPPat', (h, 0))
    elif color:
        _pen_color(h, color)
    if fill:
        vs.SetFPat(h, 1)
        _fill_color(h, fill)
    else:
        vs.SetFPat(h, 0)


def _poly(pts, closed):
    if len(pts) == 2 and not closed:
        vs.MoveTo(pts[0][0], pts[0][1])
        vs.LineTo(pts[1][0], pts[1][1])
    else:
        pts = list(pts)
        if closed:
            if not _call('ClosePoly', ()):
                pts.append(pts[0])
        else:
            _call('OpenPoly', ())
        vs.BeginPoly()
        for x, y in pts:
            vs.AddPoint(x, y)
        vs.EndPoly()
    return vs.LNewObj()


def _line(x1, y1, x2, y2, color, mil):
    vs.MoveTo(x1, y1)
    vs.LineTo(x2, y2)
    h = vs.LNewObj()
    vs.SetLW(h, int(max(1, mil)))
    if color:
        _pen_color(h, color)
    return h


def _hatch_segments(pts, ang_deg, sp):
    a = math.radians(ang_deg)
    dx, dy = -math.sin(a), -math.cos(a)          # line direction (y up)
    nx, ny = -dy, dx                             # normal
    T = [x * nx + y * ny for x, y in pts]
    Sv = [x * dx + y * dy for x, y in pts]
    n = len(pts)
    segs = []
    k0 = int(math.ceil(min(T) / sp))
    k1 = int(math.floor(max(T) / sp))
    for k in range(k0, k1 + 1):
        c = k * sp
        xs = []
        for i in range(n):
            j = (i + 1) % n
            ti, tj = T[i], T[j]
            if (ti <= c < tj) or (tj <= c < ti):
                xs.append(Sv[i] + (c - ti) / (tj - ti) * (Sv[j] - Sv[i]))
        xs.sort()
        for m in range(0, len(xs) - 1, 2):
            s0, s1 = xs[m], xs[m + 1]
            if s1 - s0 < 1e-6:
                continue
            segs.append((c * nx + s0 * dx, c * ny + s0 * dy, c * nx + s1 * dx, c * ny + s1 * dy))
    return segs


def _dash_segments(pts, closed, pattern):
    if closed:
        pts = list(pts) + [pts[0]]
    segs = []
    k = 0
    rem = pattern[0]
    on = True
    for i in range(len(pts) - 1):
        x0, y0 = pts[i]
        x1, y1 = pts[i + 1]
        L = math.hypot(x1 - x0, y1 - y0)
        if L <= 1e-9:
            continue
        ux, uy = (x1 - x0) / L, (y1 - y0) / L
        pos = 0.0
        while pos < L - 1e-9:
            step = min(rem, L - pos)
            if on:
                segs.append((x0 + ux * pos, y0 + uy * pos, x0 + ux * (pos + step), y0 + uy * (pos + step)))
            pos += step
            rem -= step
            if rem <= 1e-9:
                k = (k + 1) % len(pattern)
                rem = pattern[k]
                on = (k % 2 == 0)
    return segs


def _group(segs, color, mil):
    if not segs:
        return
    vs.BeginGroup()
    for s in segs:
        _line(s[0], s[1], s[2], s[3], color, mil)
    vs.EndGroup()


def _draw(it, li, f, ox, oy, S):
    kind = it[0]
    if kind == 'P':
        _, _, ci, color, mil, dash, closed, fill, hatch, flat = it
        pts = [((flat[k] + ox) * f, (flat[k + 1] + oy) * f) for k in range(0, len(flat), 2)]
        if hatch:
            ang, sp, hcol, hmil = HATCH[hatch]
            vs.NameClass(CLASSES[-1])
            _group(_hatch_segments(pts, ang, sp * S * f), hcol, hmil)
            vs.NameClass(CLASSES[ci])
        if dash and mil > 0:
            pat = [v * S * f for v in DASH[dash]]
            _group(_dash_segments(pts, closed, pat), color, mil)
        elif fill or mil > 0:
            h = _poly(pts, closed)
            _attrs(h, color, mil, fill, mil <= 0)
    elif kind == 'C':
        _, _, ci, color, mil, dash, fill, cx, cy, r = it
        X, Y, R = (cx + ox) * f, (cy + oy) * f, r * f
        if dash:
            n = 72
            pts = [(X + R * math.cos(2 * math.pi * i / n), Y + R * math.sin(2 * math.pi * i / n)) for i in range(n)]
            pat = [v * S * f for v in DASH[dash]]
            _group(_dash_segments(pts, True, pat), color, mil)
        else:
            vs.Oval(X - R, Y + R, X + R, Y - R)
            h = vs.LNewObj()
            _attrs(h, color, mil, fill, mil <= 0)
            if fill:
                _pen_color(h, fill)
    else:
        _, _, ci, color, size, just, ang, bold, x, y, s = it
        X, Y = (x + ox) * f, (y + oy) * f
        vs.TextSize(size * 72.0 / 25.4)
        vs.TextJust(just)
        _call('TextVerticalAlign', (4,))
        _call('TextFace', (1 if bold else 0,))
        vs.TextOrigin(X, Y)
        vs.CreateText(s)
        h = vs.LNewObj()
        _call('SetFPat', (h, 0))
        if ang:
            _call('HRotate', (h, X, Y, float(ang)), (h, (X, Y), float(ang)))
        if color:
            _text_color(h, s, color)


def _unit_factor():
    try:
        u = vs.GetUnits()
        upi = float(u[3])
        name = u[4] if len(u) > 4 else ''
        for ok in (25.4, 2.54, 0.0254, 1.0, 1.0 / 12.0, 254.0):
            if abs(upi - ok) <= ok * 1e-6:
                return upi / 25.4, name
    except Exception:
        pass
    return 1.0, '(mm と仮定)'


def _flat(v):
    out = []
    for e in (v if isinstance(v, (tuple, list)) else [v]):
        if isinstance(e, (tuple, list)):
            out.extend(_flat(e))
        else:
            out.append(float(e))
    return out


def _page(f):
    fn = getattr(vs, 'GetDrawingSizeRect', None)
    if fn is not None:
        try:
            v = _flat(fn())
            if len(v) >= 4:
                x1, y1, x2, y2 = v[:4]
                w, h = abs(x2 - x1) / f, abs(y2 - y1) / f
                if w > 1 and h > 1:
                    return (x1 + x2) / 2 / f, (y1 + y2) / 2 / f, w, h
        except Exception:
            pass
    return 0.0, 0.0, None, None


def main():
    try:
        _main()
    except Exception:
        import traceback
        vs.AlrtDialog(DRAWING_NO + ' 作図スクリプトでエラーが発生しました。\n' + traceback.format_exc()[-900:])


def _main():
    f, unit_name = _unit_factor()
    for name, sc in LAYERS:
        vs.Layer(name)
        h = vs.ActLayer()
        if not _call('SetLScale', (h, float(sc))):
            _call('SetScale', (float(sc),))
    vs.Layer(LAYERS[0][0])
    pcx, pcy, pw, ph = _page(f)
    for c in CLASSES:
        vs.NameClass(c)
    for nm in FONTS:
        try:
            fid = vs.GetFontID(nm)
        except Exception:
            fid = None
        if fid is not None and fid > 0:
            _call('TextFont', (fid,))
            break
    _call('FillPat', (0,))
    done, fail, last_err = 0, 0, ''
    order = sorted(range(len(DATA)), key=lambda i: DATA[i][1])
    cur = None
    for i in order:
        it = DATA[i]
        li = it[1]
        if li != cur:
            vs.Layer(LAYERS[li][0])
            cur = li
        S = float(LAYERS[li][1])
        try:
            vs.NameClass(CLASSES[it[2]])
            _draw(it, li, f, pcx * S, pcy * S, S)
            done += 1
        except Exception as e:
            fail += 1
            last_err = repr(e)
    vs.Layer(LAYERS[0][0])
    try:
        vs.ReDrawAll()
    except Exception:
        pass
    msg = DRAWING_NO + ' 建具製作図を作成しました。\n作成 %d / 失敗 %d\n単位: %s\n' % (done, fail, unit_name)
    if pw:
        msg += '用紙: %.0f × %.0f mm' % (pw, ph)
        if not (abs(pw - 420) < 3 and abs(ph - 297) < 3):
            msg += '（A3横 420×297 に設定してから再実行してください）'
        msg += '\n'
    msg += '表示 > レイヤオプション >「表示/スナップ/編集」にすると全ビューが用紙上に揃います。'
    if fail:
        msg += '\n最後のエラー: ' + last_err
    vs.AlrtDialog(msg)


main()
'''

HEADER = '''# -*- coding: utf-8 -*-
# =============================================================================
#  KUSATSU Vacation rental PJ  -  %s door shop drawing (KITCHEN / %s)
#  Vectorworks Python script (auto-generated by src/vwgen.py). ASCII only.
#
#  HOW TO RUN (Japanese UI):
#   1. New file (units mm), File > Page Setup: A3 landscape
#   2. Resource Manager > New Resource > Script > (palette name) > (script name)
#      Script Editor: Language = Python Script, paste this whole text, OK
#   3. Double-click the script in the script palette (run ONCE)
#   4. View > Layer Options > Show/Snap/Modify Others
#   5. Save as .vwx
#
#  Design layers (geometry at real size, mm):
%s#  Japanese text is written as \\uXXXX escapes; it appears in Japanese in Vectorworks.
# =============================================================================
import vs
import math

'''


def generate(path):
    data = build_data()
    layer_doc = ''.join('#   %-26s 1:%d\n' % (k, sc) for k, _, sc in LAYERS)
    out = [HEADER % (NO, OTHER, layer_doc)]
    out.append('DRAWING_NO = %r\n' % NO)
    out.append('LAYERS = %r\n' % [(n, s) for _, n, s in LAYERS])
    out.append('CLASSES = %r\n' % CLASSES)
    hat = {k: (h['angle'], h['sp'], col(h['c']) if col(h['c']) else None, mils(h['w'])) for k, h in HATCHES.items()}
    out.append('HATCH = %r\n' % hat)
    out.append('DASH = %r\n' % {'H': list(DASH_HIDDEN), 'C': list(DASH_CENTER), 'S': list(DASH_SWING)})
    out.append('DATA = [\n')
    for d in data:
        if d[0] == 'P' and len(d[9]) > 8:
            head = repr(d[:9])[:-1]
            nums = [repr(v) for v in d[9]]
            rows = [', '.join(nums[k:k + 8]) for k in range(0, len(nums), 8)]
            out.append('    %s, (\n        %s)),\n' % (head, ',\n        '.join(rows)))
        else:
            out.append('    %r,\n' % (d,))
    out.append(']\n')
    out.append(RUNTIME)
    text = ''.join(out)
    # ASCII only: every non-ASCII character (all inside string literals) -> \\uXXXX escape,
    # so the file reads correctly whatever text encoding Vectorworks/Windows assumes.
    text = ''.join(ch if ord(ch) < 128 else ('\\u%04x' % ord(ch)) for ch in text)
    assert all(ord(ch) < 128 for ch in text)
    with open(path, 'w', encoding='ascii', newline='\r\n') as fh:
        fh.write(text)
    return data


if __name__ == '__main__':
    p = sys.argv[1] if len(sys.argv) > 1 else NO + '_vw.py'
    data = generate(p)
    from collections import Counter
    print('items', len(data), Counter(d[0] for d in data), Counter(LAYERS[d[1]][1] for d in data))
