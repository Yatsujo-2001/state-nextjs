# -*- coding: utf-8 -*-
"""Test double of the Vectorworks `vs` module (only the calls used by the generated script).
Records objects with their design layer, then renders the *printed page* (world / layer scale)
to SVG so the result can be compared with the original drawing.

mode: 'sep'  -> colour functions accept (h, r, g, b) only
      'tup'  -> colour functions accept (h, (r, g, b)) only
units_upi: 25.4 (mm) / 1.0 (inch) ...
page_center: page centre in 1:1 world units (tests GetDrawingSizeRect offset handling)
"""
import html
import math


class Obj(dict):
    pass


class MockVS:
    def __init__(self, mode='sep', units_upi=25.4, page_center=(0.0, 0.0), has_rect=True, has_close=True):
        self.mode = mode
        self.upi = units_upi
        self.pc = page_center
        self.has_rect = has_rect
        self.has_close = has_close
        self.layers = {}          # name -> {'scale': s, 'objs': []}
        self.layer_order = []
        self.active = None
        self.cls = None
        self.classes = []
        self._closed = False
        self._poly = None
        self._pen = None
        self._last = None
        self._groups = []
        self.t = dict(size=10.0, just=1, valign=1, face=0, font=0, origin=(0.0, 0.0))
        self.alerts = []
        self.calls = {}

    # ---------- bookkeeping
    def _count(self, n):
        self.calls[n] = self.calls.get(n, 0) + 1

    def _new(self, o):
        o['layer'] = self.active
        o['class'] = self.cls
        o.setdefault('lw', 2)
        o.setdefault('pen', (0, 0, 0))
        o.setdefault('fpat', 1)        # VW default: solid fill (white) -> must be cleared by script
        o.setdefault('fill', (65535, 65535, 65535))
        o.setdefault('ppat', 2)
        if self._groups:
            self._groups[-1]['items'].append(o)
        else:
            self.layers[self.active]['objs'].append(o)
        self._last = o
        return o

    # ---------- document / layers / classes
    def GetUnits(self):
        self._count('GetUnits')
        name = {25.4: 'mm', 1.0: 'inch', 2.54: 'cm'}.get(self.upi, '?')
        return (1, 1, 0, self.upi, name, name + '2')

    def Layer(self, name):
        self._count('Layer')
        if name not in self.layers:
            self.layers[name] = {'scale': 1.0, 'objs': []}
            self.layer_order.append(name)
        self.active = name

    def ActLayer(self):
        return ('LAYER', self.active)

    def SetLScale(self, h, s):
        assert h[0] == 'LAYER'
        self.layers[h[1]]['scale'] = float(s)

    def GetDrawingSizeRect(self):
        f = self.upi / 25.4
        cx, cy = self.pc
        return ((cx - 210) * f, (cy + 148.5) * f), ((cx + 210) * f, (cy - 148.5) * f)

    def NameClass(self, n):
        if n not in self.classes:
            self.classes.append(n)
        self.cls = n

    def SetClass(self, h, n):
        h['class'] = n

    # ---------- attributes
    def _rgb_args(self, args):
        if self.mode == 'sep':
            if len(args) != 3:
                raise TypeError('expects r,g,b')
            return tuple(args)
        if len(args) != 1 or not isinstance(args[0], tuple):
            raise TypeError('expects (r,g,b)')
        return args[0]

    def SetPenFore(self, h, *args):
        h['pen'] = self._rgb_args(args)

    def SetFillFore(self, h, *args):
        h['ffore'] = self._rgb_args(args)

    def SetFillBack(self, h, *args):
        h['fill'] = self._rgb_args(args)

    def RGBToColorIndex(self, *args):
        rgb = self._rgb_args(args)
        self._cidx = getattr(self, '_cidx', {})
        k = 100 + len(self._cidx)
        self._cidx[k] = rgb
        return k

    def SetTextColor(self, h, start, count, idx):
        assert isinstance(idx, int) and start == 0 and count == len(h['text'])
        h['tcolor'] = self._cidx[idx]

    def SetLW(self, h, m):
        assert isinstance(m, int) and m >= 0
        h['lw'] = m

    def SetFPat(self, h, p):
        h['fpat'] = p

    def SetPPat(self, h, p):
        h['ppat'] = p

    def FillPat(self, p):
        self._count('FillPat')

    # ---------- geometry
    def MoveTo(self, x, y):
        self._pen = (float(x), float(y))

    def LineTo(self, x, y):
        o = Obj(kind='line', pts=[self._pen, (float(x), float(y))])
        self._pen = (float(x), float(y))
        self._new(o)

    def ClosePoly(self):
        if not self.has_close:
            raise AttributeError('ClosePoly')
        self._closed = True

    def OpenPoly(self):
        if not self.has_close:
            raise AttributeError('OpenPoly')
        self._closed = False

    def BeginPoly(self):
        self._poly = []

    def AddPoint(self, x, y):
        self._poly.append((float(x), float(y)))

    def EndPoly(self):
        o = Obj(kind='poly', pts=self._poly, closed=self._closed)
        self._poly = None
        self._new(o)

    def Oval(self, x1, y1, x2, y2):
        o = Obj(kind='oval', c=((x1 + x2) / 2, (y1 + y2) / 2), r=abs(x2 - x1) / 2, ry=abs(y2 - y1) / 2)
        self._new(o)

    def BeginGroup(self):
        self._groups.append(Obj(kind='group', items=[]))

    def EndGroup(self):
        g = self._groups.pop()
        g['layer'] = self.active
        g['class'] = self.cls
        if self._groups:
            self._groups[-1]['items'].append(g)
        else:
            self.layers[self.active]['objs'].append(g)
        self._last = g

    def LNewObj(self):
        return self._last

    # ---------- text
    def GetFontID(self, n):
        return 3 if n == 'MS Gothic' else 0

    def TextFont(self, i):
        self.t['font'] = i

    def TextSize(self, s):
        self.t['size'] = float(s)

    def TextJust(self, j):
        assert j in (1, 2, 3)
        self.t['just'] = j

    def TextVerticalAlign(self, v):
        self.t['valign'] = v

    def TextFace(self, f):
        self.t['face'] = f

    def TextOrigin(self, x, y):
        self.t['origin'] = (float(x), float(y))

    def CreateText(self, s):
        o = Obj(kind='text', text=s, origin=self.t['origin'], size=self.t['size'], just=self.t['just'],
                valign=self.t['valign'], face=self.t['face'], font=self.t['font'], angle=0.0)
        self._new(o)

    def HRotate(self, h, *args):
        if len(args) == 3:
            x, y, a = args
        else:
            (x, y), a = args
        assert h['kind'] == 'text'
        assert abs(x - h['origin'][0]) < 1e-9 and abs(y - h['origin'][1]) < 1e-9
        h['angle'] += a

    # ---------- misc
    def ReDrawAll(self):
        pass

    def AlrtDialog(self, m):
        self.alerts.append(m)

    # ---------- render printed page (world / scale) to SVG
    def render_svg(self, path):
        f = self.upi / 25.4
        cx, cy = self.pc
        out = ['<svg xmlns="http://www.w3.org/2000/svg" width="420mm" height="297mm" viewBox="0 0 420 297">',
               '<rect width="420" height="297" fill="#fff"/>']

        def hexc(rgb):
            return '#%02X%02X%02X' % tuple(int(round(v / 257)) for v in rgb)

        def walk(objs, S):
            for o in objs:
                if o['kind'] == 'group':
                    walk(o['items'], S)
                    continue

                def P(p):
                    return (p[0] / f / S - cx + 210, 148.5 - (p[1] / f / S - cy))
                lw = o.get('lw', 2) * 0.0254
                pen = 'none' if o.get('ppat') == 0 else hexc(o.get('pen', (0, 0, 0)))
                fill = hexc(o['fill']) if o.get('fpat') == 1 else 'none'
                if o['kind'] in ('line', 'poly'):
                    pts = [P(p) for p in o['pts']]
                    d = 'M' + ' L'.join('%.3f,%.3f' % p for p in pts) + (' Z' if o.get('closed') else '')
                    out.append('<path d="%s" fill="%s" stroke="%s" stroke-width="%.3f"/>' % (
                        d, fill if o['kind'] == 'poly' else 'none', pen, lw))
                elif o['kind'] == 'oval':
                    c = P(o['c'])
                    out.append('<circle cx="%.3f" cy="%.3f" r="%.3f" fill="%s" stroke="%s" stroke-width="%.3f"/>' % (
                        c[0], c[1], o['r'] / f / S, fill, pen, lw))
                elif o['kind'] == 'text':
                    c = P(o['origin'])
                    anc = {1: 'start', 2: 'middle', 3: 'end'}[o['just']]
                    size = o['size'] * 25.4 / 72
                    col = hexc(o.get('tcolor', o.get('pen', (0, 0, 0))))
                    tr = ' transform="rotate(%.2f %.3f %.3f)"' % (-o['angle'], c[0], c[1]) if o['angle'] else ''
                    fw = ' font-weight="bold"' if o['face'] == 1 else ''
                    out.append('<text x="%.3f" y="%.3f" font-family="IPAGothic" font-size="%.3f" fill="%s" '
                               'text-anchor="%s"%s%s>%s</text>' % (c[0], c[1], size, col, anc, fw, tr,
                                                                     html.escape(o['text'])))

        for name in self.layer_order:
            L = self.layers[name]
            walk(L['objs'], L['scale'])
        out.append('</svg>')
        open(path, 'w', encoding='utf-8').write('\n'.join(out))

    def stats(self):
        res = {}
        for name in self.layer_order:
            n = [0]

            def cnt(objs):
                for o in objs:
                    if o['kind'] == 'group':
                        cnt(o['items'])
                    else:
                        n[0] += 1
            cnt(self.layers[name]['objs'])
            res[name] = (self.layers[name]['scale'], n[0])
        return res


def run_script(path, **kw):
    import sys
    import types
    m = MockVS(**kw)
    mod = types.ModuleType('vs')
    for name in [n for n in dir(MockVS) if not n.startswith('_') and n not in ('render_svg', 'stats')]:
        if name == 'GetDrawingSizeRect' and not kw.get('has_rect', True):
            continue
        if name in ('ClosePoly', 'OpenPoly') and not kw.get('has_close', True):
            continue
        setattr(mod, name, getattr(m, name))
    sys.modules['vs'] = mod
    src = open(path, encoding='utf-8').read()
    g = {'__name__': '__main__'}
    exec(compile(src, path, 'exec'), g)
    del sys.modules['vs']
    return m
