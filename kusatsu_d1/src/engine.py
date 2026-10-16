# -*- coding: utf-8 -*-
"""Minimal 2D drafting engine: collects primitives in A3 paper mm (x right, y down)
and writes SVG (for PDF via Chromium) and DXF (via ezdxf) from the same list."""
import math, html

BLACK = '#000000'; RED = '#D81E1E'; BLUE = '#1D1DDD'; GRAY = '#9A9A9A'; LGRAY = '#C8C8C8'
W_HEAVY = 0.30; W_MED = 0.18; W_THIN = 0.09; W_XTHIN = 0.05; W_GRAIN = 0.04
DASH_HIDDEN = (1.0, 0.6)
DASH_CENTER = (3.0, 0.6, 0.4, 0.6)
DASH_SWING = (1.6, 0.8)
FONT = "'IPAGothic','IPAゴシック','MS Gothic','ＭＳ ゴシック',sans-serif"

ITEMS = []


def add(**kw):
    ITEMS.append(kw)


def line(p1, p2, w=W_THIN, c=BLACK, dash=None, layer='細線'):
    add(t='poly', pts=[p1, p2], closed=False, w=w, c=c, dash=dash, fill=None, hatch=None, layer=layer)


def poly(pts, closed=False, w=W_THIN, c=BLACK, dash=None, fill=None, hatch=None, layer='細線'):
    add(t='poly', pts=list(pts), closed=closed, w=w, c=c, dash=dash, fill=fill, hatch=hatch, layer=layer)


def rect(x0, y0, x1, y1, **kw):
    poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], closed=True, **kw)


def circle(c0, r, w=W_THIN, c=BLACK, dash=None, fill=None, layer='細線'):
    add(t='circle', c0=c0, r=r, w=w, c=c, dash=dash, fill=fill, layer=layer)


def arc_pts(c0, r, a0, a1, n=48):
    """angles in degrees, paper coords (y down): x=cx+r cos a, y=cy+r sin a"""
    return [(c0[0] + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)),
             c0[1] + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


def text(p, s, size=2.2, c=BLACK, anchor='start', rot=0, layer='文字', weight='normal'):
    add(t='text', p=p, s=s, size=size, c=c, anchor=anchor, rot=rot, layer=layer, weight=weight)


def text_w(s, size):
    w = 0
    for ch in s:
        w += 0.5 if ord(ch) < 0x2000 or 0xFF61 <= ord(ch) <= 0xFF9F else 1.0
    return w * size


def dot(p, r=0.28, c=BLACK, layer='寸法'):
    circle(p, r, w=0.01, c=c, fill=c, layer=layer)


# ---------------------------------------------------------------- dimensions
def hdim(xs, y, ext_from, texts, size=2.0, c=BLACK, offs=None, gap=0.6, over=0.8, layer='寸法', tc=None):
    """horizontal chain dimension. xs paper x list, y dim-line y.
    ext_from: list (per x) of object y where extension line starts (None = no ext line)."""
    offs = offs or {}
    if not isinstance(ext_from, (list, tuple)):
        ext_from = [ext_from] * len(xs)
    for x, ey in zip(xs, ext_from):
        if ey is None:
            continue
        sgn = 1 if y > ey else -1
        line((x, ey + sgn * gap), (x, y + sgn * over), w=W_XTHIN, c=c, layer=layer)
    line((min(xs), y), (max(xs), y), w=W_XTHIN, c=c, layer=layer)
    for x in xs:
        dot((x, y), c=c, layer=layer)
    for i, s in enumerate(texts):
        if not s:
            continue
        xm = (xs[i] + xs[i + 1]) / 2
        dx, dy = offs.get(i, (0, 0))
        col = (tc[i] if isinstance(tc, (list, tuple)) else tc) or (RED if '※' in s else c)
        text((xm + dx, y - 0.6 + dy), s, size=size, c=col, anchor='middle', layer=layer)


def vdim(ys, x, ext_from, texts, size=2.0, c=BLACK, offs=None, gap=0.6, over=0.8, layer='寸法', tc=None, side='left'):
    """vertical chain dimension (text rotated, reading bottom->top, left of line)."""
    offs = offs or {}
    if not isinstance(ext_from, (list, tuple)):
        ext_from = [ext_from] * len(ys)
    for yy, ex in zip(ys, ext_from):
        if ex is None:
            continue
        sgn = 1 if x > ex else -1
        line((ex + sgn * gap, yy), (x + sgn * over, yy), w=W_XTHIN, c=c, layer=layer)
    line((x, min(ys)), (x, max(ys)), w=W_XTHIN, c=c, layer=layer)
    for yy in ys:
        dot((x, yy), c=c, layer=layer)
    for i, s in enumerate(texts):
        if not s:
            continue
        ym = (ys[i] + ys[i + 1]) / 2
        dx, dy = offs.get(i, (0, 0))
        col = (tc[i] if isinstance(tc, (list, tuple)) else tc) or (RED if '※' in s else c)
        tx = x - 0.6 if side == 'left' else x + 0.6 + size * 0.8
        text((tx + dx, ym + dy), s, size=size, c=col, anchor='middle', rot=-90, layer=layer)


def leader(p_obj, p_elbow, s, size=2.0, c=BLACK, to='right', mark='dot', layer='注記', lines=None):
    """leader from object to elbow then horizontal shelf under text."""
    texts = lines or [s]
    tw = max(text_w(t, size) for t in texts) + 0.6
    line(p_obj, p_elbow, w=W_XTHIN, c=c, layer=layer)
    if to == 'right':
        x1 = p_elbow[0] + tw
        tx = p_elbow[0] + 0.3
        anc = 'start'
    else:
        x1 = p_elbow[0] - tw
        tx = p_elbow[0] - 0.3
        anc = 'end'
    line(p_elbow, (x1, p_elbow[1]), w=W_XTHIN, c=c, layer=layer)
    for k, t in enumerate(reversed(texts)):
        col = RED if '※' in t and c == BLACK else c
        text((tx, p_elbow[1] - 0.6 - k * size * 1.25), t, size=size, c=col, anchor=anc, layer=layer)
    if mark == 'dot':
        dot(p_obj, r=0.3, c=c, layer=layer)
    elif mark == 'arrow':
        ang = math.atan2(p_obj[1] - p_elbow[1], p_obj[0] - p_elbow[0])
        L = 1.2
        a1 = (p_obj[0] - L * math.cos(ang - 0.3), p_obj[1] - L * math.sin(ang - 0.3))
        a2 = (p_obj[0] - L * math.cos(ang + 0.3), p_obj[1] - L * math.sin(ang + 0.3))
        poly([p_obj, a1, a2], closed=True, w=0.02, c=c, fill=c, layer=layer)


def title_box(cx, y, s, size=2.6):
    tw = text_w(s, size) + 4
    rect(cx - tw / 2, y, cx + tw / 2, y + size + 2.4, w=W_THIN, layer='図名')
    text((cx, y + size + 1.0), s, size=size, anchor='middle', layer='図名')


def breakline_v(x, y0, y1, w=W_THIN, layer='細線'):
    ym = (y0 + y1) / 2
    poly([(x, y0), (x, ym - 1.0), (x - 0.9, ym - 0.4), (x + 0.9, ym + 0.4), (x, ym + 1.0), (x, y1)], w=w, layer=layer)


def breakline_h(y, x0, x1, w=W_THIN, layer='細線'):
    xm = (x0 + x1) / 2
    poly([(x0, y), (xm - 1.0, y), (xm - 0.4, y - 0.9), (xm + 0.4, y + 0.9), (xm + 1.0, y), (x1, y)], w=w, layer=layer)


# ---------------------------------------------------------------- writers
HATCHES = {
    'wood': dict(angle=45, sp=0.9, w=0.05, c=BLACK),      # 框・芯材 (製作範囲)
    'base': dict(angle=45, sp=1.6, w=0.04, c=GRAY),       # 下地 (別途工事)
    'nuki': dict(angle=-45, sp=1.4, w=0.04, c=GRAY),      # ヌキ
    'tile': dict(angle=45, sp=0.7, w=0.04, c=GRAY),       # 床タイル
}


def _dash(d):
    return '' if not d else ' stroke-dasharray="%s"' % ' '.join('%.2f' % v for v in d)


def write_svg(path, W=420, H=297, title=''):
    out = []
    out.append('<?xml version="1.0" encoding="UTF-8"?>')
    out.append('<svg xmlns="http://www.w3.org/2000/svg" width="%dmm" height="%dmm" viewBox="0 0 %d %d">' % (W, H, W, H))
    out.append('<title>%s</title>' % html.escape(title))
    out.append('<defs>')
    for k, h in HATCHES.items():
        sp = h['sp']
        out.append('<pattern id="h_%s" patternUnits="userSpaceOnUse" width="%.3f" height="%.3f" patternTransform="rotate(%d)">'
                   '<line x1="0" y1="0" x2="0" y2="%.3f" stroke="%s" stroke-width="%.3f"/></pattern>'
                   % (k, sp, sp, h['angle'], sp, h['c'], h['w']))
    out.append('</defs>')
    out.append('<rect x="0" y="0" width="%d" height="%d" fill="#FFFFFF"/>' % (W, H))
    out.append('<g fill="none" stroke-linecap="round" stroke-linejoin="round">')
    for it in ITEMS:
        t = it['t']
        if t == 'poly':
            d = 'M' + ' L'.join('%.3f,%.3f' % p for p in it['pts']) + (' Z' if it['closed'] else '')
            if it.get('fill'):
                out.append('<path d="%s" fill="%s" stroke="none"/>' % (d, it['fill']))
            if it.get('hatch'):
                out.append('<path d="%s" fill="url(#h_%s)" stroke="none"/>' % (d, it['hatch']))
            if it['w'] > 0.011:
                out.append('<path d="%s" stroke="%s" stroke-width="%.3f"%s/>' % (d, it['c'], it['w'], _dash(it['dash'])))
        elif t == 'circle':
            fill = it['fill'] or 'none'
            out.append('<circle cx="%.3f" cy="%.3f" r="%.3f" fill="%s" stroke="%s" stroke-width="%.3f"%s/>'
                       % (it['c0'][0], it['c0'][1], it['r'], fill, it['c'], it['w'], _dash(it['dash'])))
        elif t == 'text':
            x, y = it['p']
            anc = {'start': 'start', 'middle': 'middle', 'end': 'end'}[it['anchor']]
            tr = ' transform="rotate(%.1f %.3f %.3f)"' % (it['rot'], x, y) if it['rot'] else ''
            fw = ' font-weight="bold"' if it['weight'] == 'bold' else ''
            out.append('<text x="%.3f" y="%.3f" font-family="%s" font-size="%.2f" fill="%s" stroke="none" text-anchor="%s"%s%s>%s</text>'
                       % (x, y, FONT, it['size'], it['c'], anc, fw, tr, html.escape(it['s'])))
    out.append('</g></svg>')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))


def write_dxf(path, H=297):
    import ezdxf
    from ezdxf.enums import TextEntityAlignment
    doc = ezdxf.new('R2018', setup=True)
    doc.header['$INSUNITS'] = 4  # mm
    doc.styles.new('JP', dxfattribs={'font': 'msgothic.ttc'})
    msp = doc.modelspace()
    layer_cols = {'外形線': 7, '細線': 7, '寸法': 7, '文字': 7, '注記': 7, '図名': 7, '図枠': 7,
                  '金物': 5, '要確認': 1, 'ハッチ': 8, '木目': 8}
    for ln, col in layer_cols.items():
        if ln not in doc.layers:
            doc.layers.add(ln, color=col)

    def ensure(ln):
        if ln not in doc.layers:
            doc.layers.add(ln, color=7)

    ltypes = {DASH_HIDDEN: ('DASHED', 0.8), DASH_CENTER: ('CENTER', 0.8), DASH_SWING: ('DASHED', 1.2)}
    for ltn in ('HIDDEN', 'CENTER', 'DASHED'):
        if ltn not in doc.linetypes:
            pass

    def col_attr(c):
        if c == BLACK:
            return {}
        h = c.lstrip('#')
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        return {'true_color': ezdxf.colors.rgb2int((r, g, b))}

    def P(p):
        return (p[0], H - p[1])

    for it in ITEMS:
        ln = it['layer']
        ensure(ln)
        if it['t'] == 'poly':
            pts = [P(p) for p in it['pts']]
            if it.get('fill') or it.get('hatch'):
                hl = 'ハッチ'
                hatch = msp.add_hatch(dxfattribs={'layer': hl, **col_attr(it.get('fill') or BLACK)})
                if it.get('hatch'):
                    hp = HATCHES[it['hatch']]
                    hatch.set_pattern_fill('ANSI31', scale=hp['sp'] / 3.175, angle=hp['angle'] - 45)
                    hatch.dxf.true_color = ezdxf.colors.rgb2int((150, 150, 150)) if hp['c'] != BLACK else ezdxf.colors.rgb2int((0, 0, 0))
                hatch.paths.add_polyline_path(pts, is_closed=True)
            if it['w'] > 0.011:
                attrs = {'layer': ln, 'lineweight': max(5, int(round(it['w'] * 100))), **col_attr(it['c'])}
                if it['dash']:
                    lt_, ls_ = ltypes.get(tuple(it['dash']), ('DASHED', 1.0))
                    attrs['linetype'] = lt_
                    attrs['ltscale'] = ls_
                msp.add_lwpolyline(pts, close=it['closed'], dxfattribs=attrs)
        elif it['t'] == 'circle':
            attrs = {'layer': ln, 'lineweight': max(5, int(round(it['w'] * 100))), **col_attr(it['c'])}
            if it['dash']:
                lt_, ls_ = ltypes.get(tuple(it['dash']), ('DASHED', 1.0))
                attrs['linetype'] = lt_
                attrs['ltscale'] = ls_
            if it['fill']:
                hatch = msp.add_hatch(dxfattribs={'layer': ln, **col_attr(it['fill'])})
                hatch.paths.add_edge_path().add_arc(P(it['c0']), it['r'], 0, 360)
            else:
                msp.add_circle(P(it['c0']), it['r'], dxfattribs=attrs)
        elif it['t'] == 'text':
            al = {'start': TextEntityAlignment.LEFT, 'middle': TextEntityAlignment.CENTER,
                  'end': TextEntityAlignment.RIGHT}[it['anchor']]
            t = msp.add_text(it['s'], height=it['size'] * 0.78,
                             dxfattribs={'layer': ln, 'style': 'JP', 'rotation': -it['rot'], **col_attr(it['c'])})
            t.set_placement(P(it['p']), align=al)
    doc.saveas(path)
