# -*- coding: utf-8 -*-
"""KUSATSU Vacation rental PJ  D1 建具製作図 (KITCHEN-TOILET 木製片開き戸)
Geometry source: 草津D1.pdf (red dims) + hand-written site dims (686/671/15, 2398/2380/2370, 13)
Confirmed by user 2026/10/16.

Real-coordinate conventions
  Plan   : X along wall, X=0 = 吊元側 枠面 (KITCHEN面の開口端), X increases toward 戸先.
           Y thickness, Y=0 = KITCHEN壁面(=扉KITCHEN面), Y=166 = TOILET壁面.
  Height : Z, Z=0 = FL (床タイル天端)
"""
import sys
from engine import *
import engine as _E

# ------------------------------------------------------------------ key values
OPEN_K = 686        # KITCHEN面 開口W (吊元枠面〜戸先欠込み底)       site
INNER_W = 671       # 内法W (吊元枠面〜戸先枠面)                      site
REB_D = 15          # 戸先欠込み深さ                                  site
REB_T = 13          # 欠込み見込み幅                                  site ("13")
CL = 3              # クリアランス (草津D1 赤字)
LIP = REB_T - CL    # 段欠き厚 10
T = 53              # 扉厚 (草津D1)
SKIN = 6            # 面材 t6 (草津D1)
EDGE = 5            # 小口 5 (草津D1)
HJ_PROJ = 23        # 吊元TOILET側 枠出 (草津D1 20+3)  ※実測なし
HJ_DEPTH = 39       # 吊元 枠出し部 見込 (草津D1)
H_LIP_T = 11        # 吊元 TOILET側段欠き厚 (草津D1)
WALL = 166          # 壁厚 (草津D1)
UC = 10             # アンダーカット (草津D1)
Z_CEIL = 2398; Z_REB = 2380; Z_SOF = 2370   # site

# derived
DW_K = OPEN_K - 2 * CL                      # 680
DW_T = INNER_W - CL + (HJ_PROJ - CL)        # 688
DH_K = (Z_REB - CL) - UC                    # 2367
DH_T = (Z_SOF - CL) - UC                    # 2357
X_LIP = OPEN_K - CL                         # 683  戸先段欠き先端
X_BODY = INNER_W - CL                       # 668  戸先本体端
X_HL = -(HJ_PROJ - CL)                      # -20  吊元TOILET段欠き先端
Z_TOP_K = Z_REB - CL                        # 2377
Z_TOP_T = Z_SOF - CL                        # 2367
assert (DW_K, DW_T, DH_K, DH_T) == (680, 688, 2367, 2357)

DIMT = 2.0     # dim text size
SMT = 1.7      # small dim text
NT = 2.0       # note text

# ================================================================== sheet frame
rect(5, 5, 415, 292, w=W_THIN, layer='図枠')
rect(10, 10, 410, 287, w=W_MED, layer='図枠')


# ================================================================== PLAN 1/5
_E.VIEW = 'plan'
PX0, PY0 = 211.0, 66.0


def P(X, Y):
    return (PX0 - X / 5.0, PY0 - Y / 5.0)


def Ppoly(pts, **kw):
    poly([P(*p) for p in pts], **kw)


def Prect(X0, Y0, X1, Y1, **kw):
    Ppoly([(X0, Y0), (X1, Y0), (X1, Y1), (X0, Y1)], closed=True, **kw)


def plan_wall(side):
    """side 'h' (吊元, X<=0) or 's' (戸先, X>=INNER_W)"""
    if side == 'h':
        E = -200            # break line position
        Xpb = -39; Xst = -54; Xst2 = -159
        # finishes
        Prect(E, 0, 0, SKIN, w=W_MED, layer='外形線')                                   # KITCHEN ウッドパネル
        Prect(E, SKIN, Xpb, SKIN + 12.5, w=W_THIN, fill='#E6E6E6')                      # PB
        Prect(E, 18.5, Xst, 30.5, w=W_THIN, hatch='nuki')                              # ヌキ
        Prect(Xst2, 30.5, Xst, 135.5, w=W_THIN)                                        # 柱
        line(P(Xst2, 30.5), P(Xst, 135.5)); line(P(Xst2, 135.5), P(Xst, 30.5))
        Prect(E, 135.5, Xst, 147.5, w=W_THIN, hatch='nuki')
        Prect(E, 147.5, Xpb, 160, w=W_THIN, fill='#E6E6E6')
        Ppoly([(E, 160), (-29, 160), (-29, HJ_DEPTH), (-HJ_PROJ, HJ_DEPTH), (-HJ_PROJ, WALL), (E, WALL)],
              closed=True, w=W_MED, layer='外形線')                                    # TOILET panel + 枠見付 panel
        # 下地 (大工工事)
        Ppoly([(Xst, 18.5), (Xpb, 18.5), (Xpb, SKIN), (0, SKIN), (0, HJ_DEPTH), (-29, HJ_DEPTH), (-29, 160),
               (Xpb, 160), (Xpb, 147.5), (Xst, 147.5)], closed=True, w=W_THIN, hatch='base')
        line(P(0, 0), P(0, HJ_DEPTH), w=W_MED, layer='外形線')
        breakline_v(P(E, 0)[0], P(E, WALL + 6)[1], P(E, -6)[1])
    else:
        E = 830
        Xr = INNER_W; Xreb = OPEN_K; Xst = 702; Xst2 = 807; Xpb_t = 687
        Prect(Xreb, 0, E, SKIN, w=W_MED, layer='外形線')
        Prect(Xst, SKIN, E, SKIN + 12.5, w=W_THIN, fill='#E6E6E6')
        Prect(Xst, 18.5, E, 30.5, w=W_THIN, hatch='nuki')
        Prect(Xst, 30.5, Xst2, 135.5, w=W_THIN)
        line(P(Xst, 30.5), P(Xst2, 135.5)); line(P(Xst, 135.5), P(Xst2, 30.5))
        Prect(Xst, 135.5, E, 147.5, w=W_THIN, hatch='nuki')
        Prect(Xpb_t, 147.5, E, 160, w=W_THIN, fill='#E6E6E6')
        Ppoly([(Xr, REB_T), (Xr + 6, REB_T), (Xr + 6, 160), (E, 160), (E, WALL), (Xr, WALL)],
              closed=True, w=W_MED, layer='外形線')
        Ppoly([(Xst, 147.5), (Xst, SKIN), (Xreb, SKIN), (Xreb, REB_T), (Xr + 6, REB_T), (Xr + 6, 160),
               (Xpb_t, 160), (Xpb_t, 147.5)], closed=True, w=W_THIN, hatch='base')
        line(P(Xreb, 0), P(Xreb, REB_T), w=W_MED, layer='外形線')
        line(P(Xr, REB_T), P(Xreb, REB_T), w=W_MED, layer='外形線')
        breakline_v(P(E, 0)[0], P(E, WALL + 6)[1], P(E, -6)[1])


plan_wall('h')
plan_wall('s')

# ---- door (plan section)
door_outline = [(X_LIP, 0), (X_LIP, LIP), (X_BODY, LIP), (X_BODY, T), (X_HL, T), (X_HL, T - H_LIP_T),
                (CL, T - H_LIP_T), (CL, 0)]
# stiles / edge (hatched)  hinge side
Ppoly([(CL, T - H_LIP_T), (CL, 0), (CL + EDGE, 0), (CL + EDGE, SKIN), (19, SKIN), (19, T - SKIN),
       (X_HL + EDGE, T - SKIN), (X_HL + EDGE, T), (X_HL, T), (X_HL, T - H_LIP_T)], closed=True, w=0, hatch='wood')
# strike side
Ppoly([(643, SKIN), (X_LIP - EDGE, SKIN), (X_LIP - EDGE, 0), (X_LIP, 0), (X_LIP, LIP), (X_BODY, LIP),
       (X_BODY, T), (X_BODY - EDGE, T), (X_BODY - EDGE, T - SKIN), (643, T - SKIN)], closed=True, w=0, hatch='wood')
# skins
line(P(CL + EDGE, SKIN), P(X_LIP - EDGE, SKIN), w=W_THIN)
line(P(X_HL + EDGE, T - SKIN), P(X_BODY - EDGE, T - SKIN), w=W_THIN)
for (xa, ya, yb) in [(CL + EDGE, 0, SKIN), (X_LIP - EDGE, 0, SKIN), (X_HL + EDGE, T - SKIN, T), (X_BODY - EDGE, T - SKIN, T)]:
    line(P(xa, ya), P(xa, yb), w=W_XTHIN)
line(P(19, SKIN), P(19, T - SKIN), w=W_XTHIN); line(P(643, SKIN), P(643, T - SKIN), w=W_XTHIN)
Ppoly(door_outline, closed=True, w=W_HEAVY, layer='外形線')
# face lines heavier (reference style: 面材を太線)
line(P(CL, 0), P(X_LIP, 0), w=0.38, layer='外形線')
line(P(X_HL, T), P(X_BODY, T), w=0.38, layer='外形線')

# ---- hinge (blue)  per 草津D1: 軸 KITCHEN側, 芯 X=1.5 / Y=-28, φ32
HC = P(1.5, -28)
circle(HC, 16 / 5.0, w=W_THIN, c=BLUE, layer='金物')
line((HC[0] - 4.5, HC[1]), (HC[0] + 4.5, HC[1]), w=W_XTHIN, c=BLUE, dash=DASH_CENTER, layer='金物')
line((HC[0], HC[1] - 4.5), (HC[0], HC[1] + 4.5), w=W_XTHIN, c=BLUE, dash=DASH_CENTER, layer='金物')
Prect(-3.3, -12, 0.8, 32, w=W_XTHIN, c=BLUE, layer='金物')
Prect(2.3, -12, 6.3, 32, w=W_XTHIN, c=BLUE, layer='金物')
for yy in (12, 22):
    Prect(-24, yy - 1.5, -3.3, yy + 1.5, w=W_XTHIN, c=BLUE, layer='金物')
    Prect(6.3, yy - 1.5, 27, yy + 1.5, w=W_XTHIN, c=BLUE, layer='金物')

# ---- swing (KITCHEN側へ開く)
import math
R = math.hypot(X_LIP - 1.5, 0 + 28)
a0 = math.degrees(math.atan2(28, X_LIP - 1.5))
pts = []
for i in range(0, 41):
    a = math.radians(a0 - 9.0 * i / 40)
    pts.append(P(1.5 + R * math.cos(a), -28 + R * math.sin(a)))
poly(pts, w=W_XTHIN, dash=DASH_SWING)
pe = pts[-1]; pp = pts[-3]
ang = math.atan2(pe[1] - pp[1], pe[0] - pp[0])
poly([pe, (pe[0] - 1.4 * math.cos(ang - 0.35), pe[1] - 1.4 * math.sin(ang - 0.35)),
      (pe[0] - 1.4 * math.cos(ang + 0.35), pe[1] - 1.4 * math.sin(ang + 0.35))], closed=True, w=0.02, fill=BLACK)

# ---- room labels
text(P(250, 112), '【TOILET】', size=2.2, anchor='middle')
text(P(300, -24), '【KITCHEN】', size=2.2, anchor='middle')

# ---- plan dims : TOILET side (top)
yT = P(0, WALL)[1]          # TOILET face paper y
xs = [P(x, 0)[0] for x in (-HJ_PROJ, X_HL, X_BODY, INNER_W)]
hdim(xs, yT - 5.5, [yT, P(0, T)[1], P(0, T)[1], yT], ['3', 'DW=688', '3'], offs={0: (1.6, 0), 2: (-1.6, 0)})
xs = [P(x, 0)[0] for x in (-HJ_PROJ, 0, INNER_W)]
hdim(xs, yT - 10.5, [yT, P(0, HJ_DEPTH)[1], yT], ['23※', '内法W=671'], offs={0: (2.6, 0)})
xs = [P(x, 0)[0] for x in (-HJ_PROJ, INNER_W)]
hdim(xs, yT - 15.5, [yT, yT], ['開口W（TOILET側）=694 ※要確認'])

# ---- plan dims : KITCHEN side (bottom)
yK = P(0, 0)[1]
xs = [P(x, 0)[0] for x in (0, CL, X_LIP, OPEN_K)]
hdim(xs, yK + 13, [yK, yK, yK, yK], ['3', 'DW=680', '3'], offs={0: (-1.6, 0), 2: (1.6, 0)})
xs = [P(x, 0)[0] for x in (0, INNER_W, OPEN_K)]
hdim(xs, yK + 18, [yK + 13.5, P(0, REB_T)[1], yK + 13.5], ['内法W=671', '15'])
xs = [P(x, 0)[0] for x in (0, OPEN_K)]
hdim(xs, yK + 23, [yK + 18.5, yK + 18.5], ['開口W（KITCHEN側）=686'])

# ---- plan local dims
# door profile at hinge (vertical chain, inside door)
x_c = P(45, 0)[0]
vdim([P(0, y)[1] for y in (0, T - H_LIP_T, T)], x_c, None, ['42', '11'], size=SMT, offs={1: (-0.2, -2.6)})
# strike profile
x_c = P(625, 0)[0]
vdim([P(0, y)[1] for y in (0, LIP, T)], x_c, None, ['10', '43'], size=SMT, offs={0: (0, 2.6)})
# door thickness
x_c = P(330, 0)[0]
vdim([P(0, y)[1] for y in (0, T)], x_c, None, ['t53'], size=DIMT)
# TOILET wall to door
x_c = P(100, 0)[0]
vdim([P(0, y)[1] for y in (T, WALL)], x_c, None, ['113'], size=SMT)
# hinge-side TOILET lip overlap
y_c = P(0, 75)[1]
hdim([P(x, 0)[0] for x in (X_HL, 0, CL)], y_c, [P(0, T)[1], P(0, HJ_DEPTH)[1], P(0, T - H_LIP_T)[1]],
     ['20', '3'], size=SMT, offs={0: (0.6, 0), 1: (-2.2, 0)})
# wall thickness
x_c = P(-190, 0)[0] + 3.5
vdim([P(0, y)[1] for y in (0, WALL)], x_c, [P(-200, 0)[0] + 0.6, P(-200, 0)[0] + 0.6], ['166'], size=SMT, side='right')

# ---- plan notes
leader(P(-120, 150), (258, 24), '', size=1.8, lines=['壁：ウッドパネル t6 / PB t12.5', '　　ヌキ t12 / 柱□105（参考）'])
leader(P(-35, 100), (258, 44), '', size=1.8, lines=['枠（三方）：大工工事（別途）', '　ウッドパネル t6＋下地（参考表示）'])
leader(P(684, 9), (14, 44), '', size=1.8, to='right', lines=['戸先 欠込み：見込13×深さ15', '（現場実測値）'])
leader(P(470, 3), (118, 72.5), '', size=1.8, to='left', lines=['表面材 t6 ※材種・品番要確認'])
leader(P(X_LIP, 3), (60, 72.5), '', size=1.8, to='left', lines=['小口 t5 ※樹種要確認'])
leader(P(520, 27), (150, 39.5), '', size=1.8, to='left', lines=['框・芯材構成 ※要確認'])
leader((HC[0] + 2.4, HC[1] + 2.0), (224, 78), '', size=1.8, c=BLUE, to='right',
       lines=['丁番（軸：KITCHEN側）', '※品番・枚数・寸法 要確認'])
title_box(242, 84.5, '平面詳細図　S=1/5')


# ================================================================== ELEVATIONS 1/15
FLY = 254.0
KX0 = 42.0 + OPEN_K / 15.0
TX0 = 152.0 + HJ_PROJ / 15.0


def KE(X, Z):
    return (KX0 - X / 15.0, FLY - Z / 15.0)


def TE(X, Z):
    return (TX0 + X / 15.0, FLY - Z / 15.0)


def grain(fn, x0, x1, z0, z1, n=9, seed=3):
    import random
    rnd = random.Random(seed)
    for i in range(n):
        xb = x0 + (x1 - x0) * (i + 0.5) / n + rnd.uniform(-12, 12)
        pts = []
        steps = 30
        ph = rnd.uniform(0, 6.28); amp = rnd.uniform(3, 9)
        for k in range(steps + 1):
            z = z0 + 40 + (z1 - z0 - 80) * k / steps
            pts.append(fn(xb + amp * math.sin(ph + k * 0.45), z))
        poly(pts, w=W_GRAIN, c=LGRAY, layer='木目')


# ---------------- KITCHEN side elevation (吊元 = 右)
_E.VIEW = 'kitchen'
fl_l, fl_r = 16.0, 112.0
line((fl_l, FLY), (fl_r, FLY), w=W_MED, layer='外形線')
text((fl_l, FLY - 0.8), '▽FL±0', size=DIMT)
yc = KE(0, Z_CEIL)[1]
line((fl_l, yc), (fl_r, yc), w=W_THIN)
text((fl_r, yc - 0.8), '▽天井（KITCHEN）FL+2398', size=DIMT, anchor='end')
# opening on KITCHEN face
poly([KE(0, 0), KE(0, Z_REB), KE(OPEN_K, Z_REB), KE(OPEN_K, 0)], w=W_MED, layer='外形線')
# door
rect(*KE(X_LIP, Z_TOP_K), *KE(CL, UC), w=W_HEAVY, layer='外形線')
grain(KE, CL, X_LIP, UC, Z_TOP_K, seed=5)
# hinges (visible barrel, position TBD)
for zc in (2150, 1200, 260):
    x0, y0 = KE(1.5 + 16, zc + 55); x1, y1 = KE(1.5 - 16, zc - 55)
    rect(x0, y0, x1, y1, w=W_THIN, c=BLUE, layer='金物')
leader(((KE(-14, 2150)[0]), KE(0, 2150)[1]), (96, 112), '', size=1.8, c=BLUE,
       lines=['丁番（3枚想定）', '※品番・枚数・取付位置 要確認'])
# handle placeholder (strike side = left)
hx0, hy0 = KE(X_LIP - 40, 1060); hx1, hy1 = KE(X_LIP - 110, 940)
rect(hx0, hy0, hx1, hy1, w=W_THIN, c=BLUE, dash=DASH_HIDDEN, layer='金物')
leader(((hx0 + hx1) / 2, hy0), (60, 168), '', size=1.8, c=BLUE,
       lines=['取手（位置未定）', '※種類・品番・取付高さ 要確認'])
leader(KE(330, 1700), (66, 133), '', size=1.8, to='right', lines=['表面材 t6', '※材種・品番 要確認'])
text((KE(330, 0)[0], KE(0, 2385)[1] + 0.2), '', size=1.5)
# dims
xs = [KE(x, 0)[0] for x in (OPEN_K, X_LIP, CL, 0)]
hdim(xs, FLY + 5, [FLY, KE(0, UC)[1], KE(0, UC)[1], FLY], ['3', 'DW=680', '3'], offs={0: (-1.6, 0), 2: (1.6, 0)})
hdim([KE(OPEN_K, 0)[0], KE(0, 0)[0]], FLY + 10, [FLY + 5.5, FLY + 5.5], ['開口W=686'])
xe = KE(OPEN_K, 0)[0]
vdim([KE(0, z)[1] for z in (0, UC, Z_TOP_K, Z_REB)], xe - 4, [None, KE(X_LIP, 0)[0], KE(X_LIP, 0)[0], xe],
     ['10', 'DH=2367', '3'], offs={0: (0, 1.9), 2: (0, -1.4)})
vdim([KE(0, z)[1] for z in (0, Z_REB, Z_CEIL)], xe - 10, [None, xe - 3.4, None], ['開口H=2380', '18'],
     offs={1: (0, -1.6)})
vdim([KE(0, z)[1] for z in (0, Z_CEIL)], xe - 16, [None, None], ['天井高 2398'])
title_box(KE(OPEN_K / 2, 0)[0], 268.0, 'KITCHEN側 正面図　S=1/15')

# ---------------- TOILET side elevation (吊元 = 左)
_E.VIEW = 'toilet'
fl_l, fl_r = 138.0, 222.0
line((fl_l, FLY), (fl_r, FLY), w=W_MED, layer='外形線')
text((fl_l, FLY - 0.8), '▽FL±0', size=DIMT)
poly([TE(-HJ_PROJ, 0), TE(-HJ_PROJ, Z_SOF), TE(INNER_W, Z_SOF), TE(INNER_W, 0)], w=W_MED, layer='外形線')
rect(*TE(X_HL, Z_TOP_T), *TE(X_BODY, UC), w=W_HEAVY, layer='外形線')
grain(TE, X_HL, X_BODY, UC, Z_TOP_T, seed=8)
for zc in (2150, 1200, 260):
    x0, y0 = TE(1.5 - 16, zc + 55); x1, y1 = TE(1.5 + 16, zc - 55)
    rect(x0, y0, x1, y1, w=W_THIN, c=BLUE, dash=DASH_HIDDEN, layer='金物')
hx0, hy0 = TE(X_BODY - 30, 1060); hx1, hy1 = TE(X_BODY - 100, 940)
rect(hx0, hy0, hx1, hy1, w=W_THIN, c=BLUE, dash=DASH_HIDDEN, layer='金物')
leader(((hx0 + hx1) / 2, hy0), (157.5, 168), '', size=1.8, c=BLUE, to='right',
       lines=['取手（位置未定）', '※種類・品番・取付高さ 要確認'])
leader((TE(0, 0)[0] - 0.4, TE(0, 2150)[1]), (147, 121), '', size=1.8, c=BLUE, to='left',
       lines=['丁番（KITCHEN側・隠れ線）'])
text((TE(INNER_W / 2 - 10, 0)[0], TE(0, Z_SOF)[1] - 4.2), '天井（TOILET側）：高さ ※要確認', size=1.8, c=RED, anchor='middle')
leader(TE(330, 1700), (166, 133), '', size=1.8, to='right', lines=['表面材 t6', '※材種・品番 要確認'])
xs = [TE(x, 0)[0] for x in (-HJ_PROJ, X_HL, X_BODY, INNER_W)]
hdim(xs, FLY + 5, [FLY, TE(0, UC)[1], TE(0, UC)[1], FLY], ['3', 'DW=688', '3'], offs={0: (-1.6, 0), 2: (1.6, 0)})
hdim([TE(-HJ_PROJ, 0)[0], TE(INNER_W, 0)[0]], FLY + 10, [FLY + 5.5, FLY + 5.5], ['開口W=694 ※要確認'])
xe = TE(INNER_W, 0)[0]
vdim([TE(0, z)[1] for z in (0, UC, Z_TOP_T, Z_SOF)], xe + 4, [None, TE(X_BODY, 0)[0], TE(X_BODY, 0)[0], xe],
     ['10', 'DH=2357', '3'], offs={0: (0, 1.9), 2: (0, -1.4)})
vdim([TE(0, z)[1] for z in (0, Z_SOF)], xe + 10, [None, xe + 4.6], ['開口H=2370（内法）'])
title_box(TE(INNER_W / 2 - 12, 0)[0], 268.0, 'TOILET側 正面図　S=1/15')


# ================================================================== SECTION 1/15
_E.VIEW = 'section'
SX0 = 272.0


def SE(Y, Z):
    return (SX0 + Y / 15.0, FLY - Z / 15.0)


yl, yr = -150, 300
# floor
poly([SE(yl, -10), SE(yr, -10), SE(yr, 0), SE(yl, 0)], closed=True, w=0, fill='#E2E2E2')
line(SE(yl, 0), SE(yr, 0), w=W_MED, layer='外形線')
line(SE(yl, -10), SE(yr, -10), w=W_XTHIN)
text((SE(yl, 0)[0] - 1.0, FLY - 0.8), '▽FL±0', size=DIMT, anchor='end')
# KITCHEN ceiling
poly([SE(yl, Z_CEIL), SE(0, Z_CEIL), SE(0, Z_CEIL + 12.5), SE(yl, Z_CEIL + 12.5)], closed=True, w=0, fill='#E6E6E6')
line(SE(yl, Z_CEIL), SE(0, Z_CEIL), w=W_MED, layer='外形線')
# head (by others)
head = [(0, Z_CEIL + 30), (0, Z_REB), (REB_T, Z_REB), (REB_T, Z_SOF), (WALL, Z_SOF), (WALL, Z_CEIL + 30)]
poly([SE(*p) for p in head], closed=False, w=W_MED, layer='外形線')
poly([SE(*p) for p in head], closed=True, w=0, hatch='base')
breakline_h(SE(0, Z_CEIL + 30)[1], SE(-6, 0)[0], SE(WALL + 6, 0)[0])
# jambs seen beyond
line(SE(0, 0), SE(0, Z_REB), w=W_XTHIN)
line(SE(WALL, 0), SE(WALL, Z_SOF), w=W_XTHIN)
# door
dsec = [(0, UC), (0, Z_TOP_K), (LIP, Z_TOP_K), (LIP, Z_TOP_T), (T, Z_TOP_T), (T, UC)]
poly([SE(*p) for p in dsec], closed=True, w=W_HEAVY, layer='外形線')
text(SE(-75, 1650), '【KITCHEN】', size=2.0, anchor='middle')
text(SE(215, 1650), '【TOILET】', size=2.0, anchor='middle')
# detail call-outs
for (lab, z) in (('A', 2380), ('B', 15)):
    cc = SE(26, z)
    circle(cc, 3.2, w=W_THIN, dash=DASH_HIDDEN)
    text((cc[0] - 3.4, cc[1] - 2.4), lab, size=2.4, anchor='end', weight='bold')
# dims left
xe = SE(0, 0)[0]
xl = SE(yl, 0)[0]
vdim([SE(0, z)[1] for z in (0, UC, Z_TOP_K, Z_REB)], xl - 3, [None, xe, xe, xe], ['10', 'DH=2367（KITCHEN面）', '3'],
     offs={0: (0, 1.9), 2: (0, -1.4)})
vdim([SE(0, z)[1] for z in (0, Z_REB, Z_CEIL)], xl - 9, [None, None, xl], ['開口H=2380', '18'], offs={1: (0, -1.6)})
vdim([SE(0, z)[1] for z in (0, Z_CEIL)], xl - 15, [None, None], ['天井高 2398'])
# dims right
xr = SE(yr, 0)[0]
vdim([SE(0, z)[1] for z in (0, UC, Z_TOP_T, Z_SOF)], xr + 3, [None, SE(T, 0)[0], SE(T, 0)[0], SE(WALL, 0)[0]],
     ['10', 'DH=2357（TOILET面）', '3'], offs={0: (0, 1.9), 2: (0, -1.4)}, side='right')
vdim([SE(0, z)[1] for z in (0, Z_SOF)], xr + 9, [None, xr + 3.6], ['開口H=2370（内法）'], side='right')
# thickness
hdim([SE(0, 0)[0], SE(T, 0)[0]], SE(0, 1250)[1], None, ['t53'], size=SMT, offs={0: (0, 0)})
hdim([SE(T, 0)[0], SE(WALL, 0)[0]], SE(0, 1100)[1], None, ['113'], size=SMT)
title_box(SX0 + 5, 268.0, '断面詳細図　S=1/15')


# ================================================================== DETAILS 1/5
_E.VIEW = 'head'
HX0, HY0 = 352.0, 128.0   # head: Y=0 -> x, Z=2370 -> y


def HD(Y, Z):
    return (HX0 + Y / 5.0, HY0 - (Z - Z_SOF) / 5.0)


ytop = 2428; ybot = 2318; YL = -60
# KITCHEN ceiling
poly([HD(YL, Z_CEIL), HD(0, Z_CEIL), HD(0, Z_CEIL + 12.5), HD(YL, Z_CEIL + 12.5)], closed=True, w=W_THIN, fill='#E6E6E6')
line(HD(YL, Z_CEIL), HD(0, Z_CEIL), w=W_MED, layer='外形線')
# head block (by others)
head = [(0, ytop), (0, Z_REB), (REB_T, Z_REB), (REB_T, Z_SOF), (WALL, Z_SOF), (WALL, ytop)]
poly([HD(*p) for p in head], closed=True, w=0, hatch='base')
poly([HD(*p) for p in head], closed=False, w=W_MED, layer='外形線')
line(HD(REB_T, Z_SOF + 6), HD(WALL, Z_SOF + 6), w=W_XTHIN)          # 上枠見付 panel t6
breakline_h(HD(0, ytop)[1], HD(-2, 0)[0], HD(WALL + 4, 0)[0])
breakline_v(HD(YL, 0)[0], HD(0, Z_CEIL + 15)[1], HD(0, Z_CEIL - 3)[1])
line(HD(WALL, Z_SOF), HD(WALL, ybot), w=W_XTHIN)                       # TOILET wall face (beyond)
# door top
poly([HD(*p) for p in [(0, Z_TOP_K - EDGE), (0, Z_TOP_K), (LIP, Z_TOP_K), (LIP, Z_TOP_T), (T, Z_TOP_T),
                         (T, Z_TOP_T - EDGE), (T - SKIN, Z_TOP_T - EDGE), (T - SKIN, Z_TOP_T - 25),
                         (SKIN, Z_TOP_T - 25), (SKIN, Z_TOP_K - EDGE)]], closed=True, w=0, hatch='wood')
dtop = [(0, ybot), (0, Z_TOP_K), (LIP, Z_TOP_K), (LIP, Z_TOP_T), (T, Z_TOP_T), (T, ybot)]
poly([HD(*p) for p in dtop], closed=False, w=W_HEAVY, layer='外形線')
line(HD(SKIN, Z_TOP_K - EDGE), HD(SKIN, ybot), w=W_THIN)
line(HD(T - SKIN, Z_TOP_T - EDGE), HD(T - SKIN, ybot), w=W_THIN)
line(HD(0, Z_TOP_K - EDGE), HD(SKIN, Z_TOP_K - EDGE), w=W_XTHIN)
line(HD(T - SKIN, Z_TOP_T - EDGE), HD(T, Z_TOP_T - EDGE), w=W_XTHIN)
breakline_h(HD(0, ybot)[1], HD(-4, 0)[0], HD(T + 4, 0)[0])
text(HD(-30, 2330), 'KITCHEN', size=1.8, anchor='middle')
text(HD(112, 2330), 'TOILET', size=1.8, anchor='middle')
# level lines + labels (left / KITCHEN side)
XLAB = HD(YL - 6, 0)[0]
for (z, lab, y0, dy) in ((Z_CEIL, '▽FL+2398 天井（KITCHEN）', YL, -0.5), (Z_REB, '▽FL+2380 欠込み天端', 0, -0.5),
                         (Z_SOF, '▽FL+2370 上枠下端（内法）', REB_T, 2.0)):
    line(HD(y0, z), (XLAB, HD(0, z)[1]), w=W_XTHIN, dash=DASH_HIDDEN)
    text((XLAB - 0.4, HD(0, z)[1] + dy), lab, size=1.5, anchor='end')
# vertical chains
vdim([HD(0, z)[1] for z in (Z_SOF, Z_REB, Z_CEIL)], HD(-38, 0)[0], None, ['10', '18'], size=SMT)
vdim([HD(0, z)[1] for z in (Z_TOP_K, Z_REB)], HD(-14, 0)[0], [HD(0, 0)[0], None], ['3'], size=SMT,
     offs={0: (0, -1.8)})
vdim([HD(0, z)[1] for z in (Z_TOP_T, Z_SOF)], HD(75, 0)[0], [HD(T, 0)[0], None], ['3'], size=SMT, side='right',
     offs={0: (0, 1.9)})
# horizontal
hdim([HD(y, 0)[0] for y in (0, LIP, REB_T)], HD(0, 2349)[1], None, ['10', '3'], size=SMT,
     offs={0: (-1.7, 0), 1: (1.5, 0)})
hdim([HD(y, 0)[0] for y in (0, REB_T)], HD(0, 2336)[1], None, ['13'], size=SMT)
line(HD(REB_T, Z_SOF), HD(REB_T, 2336), w=W_XTHIN, dash=DASH_HIDDEN)
line(HD(0, ybot), HD(0, 2336), w=W_XTHIN)
leader(HD(100, 2373), (HX0 + 24, HY0 + 6.0), '', size=1.6, to='right', lines=['上枠見付 ウッドパネル t6（参考）'])
leader(HD(70, 2412), (HX0 + 16, HY0 - 17.5), '', size=1.6, to='right', lines=['上枠・下地：大工工事（別途）'])
leader(HD(-30, Z_CEIL + 9), (HX0 - 16, HY0 - 17.5), '', size=1.6, to='left', lines=['天井 PB12.5 塗装'])
text((HX0 + 34.4, HY0 - 9.6), '天井（TOILET側）', size=1.5, c=RED, anchor='start')
text((HX0 + 34.4, HY0 - 7.6), '※高さ要確認', size=1.5, c=RED, anchor='start')
title_box(HX0 + 2, HY0 + 13.0, 'A：上部詳細　S=1/5')

# ---- foot detail
_E.VIEW = 'foot'
FX0, FY0 = 352.0, 192.0


def FD(Y, Z):
    return (FX0 + Y / 5.0, FY0 - Z / 5.0)


ft = 75
poly([FD(-60, -10), FD(WALL + 30, -10), FD(WALL + 30, 0), FD(-60, 0)], closed=True, w=0, fill='#E2E2E2')
line(FD(-60, 0), FD(WALL + 30, 0), w=W_MED, layer='外形線')
line(FD(-60, -10), FD(WALL + 30, -10), w=W_XTHIN)
poly([FD(*p) for p in [(SKIN, UC), (T - SKIN, UC), (T - SKIN, UC + 30), (SKIN, UC + 30)]], closed=True, w=0, hatch='wood')
poly([FD(*p) for p in [(0, ft), (0, UC), (T, UC), (T, ft)]], closed=False, w=W_HEAVY, layer='外形線')
line(FD(SKIN, UC), FD(SKIN, ft), w=W_THIN)
line(FD(T - SKIN, UC), FD(T - SKIN, ft), w=W_THIN)
breakline_h(FD(0, ft)[1], FD(-4, 0)[0], FD(T + 4, 0)[0])
line(FD(WALL, 0), FD(WALL, ft), w=W_XTHIN)
text(FD(-30, 30), 'KITCHEN', size=1.8, anchor='middle')
text(FD(112, 30), 'TOILET', size=1.8, anchor='middle')
text((FD(-60, 0)[0] - 0.6, FY0 - 0.5), '▽FL±0', size=1.6, anchor='end')
vdim([FD(0, z)[1] for z in (-10, 0, UC)], FD(-14, 0)[0], [None, None, FD(0, 0)[0]],
     ['10', '10'], size=SMT, offs={1: (0, -2.4)})
hdim([FD(y, 0)[0] for y in (0, SKIN, T - SKIN, T)], FD(0, ft + 9)[1], [FD(0, ft)[1]] * 4, ['6', '41', '6'],
     size=SMT, offs={0: (-1.6, 0), 2: (1.6, 0)})
hdim([FD(y, 0)[0] for y in (0, T)], FD(0, ft + 25)[1], [FD(0, ft + 9)[1] - 0.2, FD(0, ft + 9)[1] - 0.2], ['t53'], size=SMT)
leader(FD(40, UC / 2.0), (FX0 + 24, FY0 + 5.5), '', size=1.6, to='right', lines=['アンダーカット 10'])
leader(FD(140, -5), (FX0 + 30, FY0 + 9.5), '', size=1.6, to='right', lines=['床：タイル t10（両室共）'])
leader(FD(T - SKIN / 2, 45), (FX0 + 18, FY0 - 17.5), '', size=1.6, to='right', lines=['面材 t6／下框 ※構成要確認'])
title_box(FX0 + 2, FY0 + 13.0, 'B：下部詳細　S=1/5')


# ================================================================== SPEC TABLE (right top)
_E.VIEW = 'sheet'
TX, TY = 300.0, 12.0
cw = [12, 26, 44, 26]   # 記号 | 室名 | 名称 | 数量   (sum 108)
xs = [TX]
for w_ in cw:
    xs.append(xs[-1] + w_)
rect(TX, TY, xs[-1], TY + 15, w=W_MED, layer='図枠')
line((TX, TY + 5.5), (xs[-1], TY + 5.5), w=W_THIN)
for x in xs[1:-1]:
    line((x, TY), (x, TY + 15), w=W_THIN)
for i, s_ in enumerate(['記号', '室　名', '名　称', '数量']):
    text(((xs[i] + xs[i + 1]) / 2, TY + 4.0), s_, size=2.0, anchor='middle')
cc = ((xs[0] + xs[1]) / 2, TY + 10.3)
circle(cc, 3.4, w=W_THIN)
line((cc[0] - 3.4, cc[1]), (cc[0] + 3.4, cc[1]), w=W_XTHIN)
text((cc[0], cc[1] - 0.7), '1', size=1.7, anchor='middle')
text((cc[0], cc[1] + 2.5), 'D1', size=1.7, anchor='middle')
text(((xs[1] + xs[2]) / 2, TY + 11.0), 'KITCHEN／TOILET', size=1.9, anchor='middle')
text(((xs[2] + xs[3]) / 2, TY + 11.0), '木製片開き戸', size=2.0, anchor='middle')
text(((xs[3] + xs[4]) / 2, TY + 11.0), '1', size=2.0, anchor='middle')
text((TX + 1, TY + 19.6), '*仕様', size=2.0)
rows = [
    ('扉寸法', 'KITCHEN面 W680×H2367', 'TOILET面 W688×H2357'),
    ('扉厚', 't53（段欠き10＋本体43）', '開き勝手：KITCHEN側へ開く'),
    ('表面材', 't6 両面', '※材種・品番要確認'),
    ('小口', 't5', '※樹種要確認'),
    ('芯材・框', '※構成要確認', '反り止め ※要否確認'),
    ('枠', '別途（大工工事）', 'ウッドパネル t6 仕上'),
    ('丁番', '軸：KITCHEN側', '※品番・枚数要確認'),
    ('取手', '※種類要確認', '※品番・取付高さ要確認'),
    ('錠', '※有無要確認', '（表示錠等）'),
    ('戸当り', '※要否確認', ''),
    ('備考', 'アンダーカット10', 'クリアランス 上・左右3'),
]
c2 = [TX, TX + 15, TX + 58, TX + 108]
ry = TY + 21
rh = 4.4
for k, (a_, b_, c_) in enumerate(rows):
    y0 = ry + k * rh
    line((TX, y0), (TX + 108, y0), w=W_THIN)
    text((c2[0] + 1, y0 + 3.2), a_, size=1.8)
    text((c2[1] + 1, y0 + 3.2), b_, size=1.8, c=RED if '※' in b_ else BLACK)
    text((c2[2] + 1, y0 + 3.2), c_, size=1.8, c=RED if '※' in c_ else BLACK)
line((TX, ry + len(rows) * rh), (TX + 108, ry + len(rows) * rh), w=W_THIN)
for x in c2[1:3]:
    line((x, ry), (x, ry + len(rows) * rh), w=W_XTHIN)

# ---------------- red notes (top-left), as reference
text((14, 16.5), '*錠の有無 要確認（トイレ用表示錠等）', size=2.6, c=RED)
text((14, 20.3), '*取手・丁番 品番・取付位置 要確認', size=2.6, c=RED)
text((14, 24.1), '*表面材・小口材 品番 要確認', size=2.6, c=RED)

# ---------------- general notes (right bottom)
NX, NY = 316.0, 226.0
notes = [
    '【特記】',
    '・寸法単位：mm',
    '・幅・高さは現場実測値（草津D1手書き 686／671／15、',
    '　2398／2380／2370、13）による',
    '・扉厚53・面材t6・小口5・クリアランス3・アンダーカット10',
    '　は草津D1（26.8.19）赤字寸法による',
    '・枠・下地・壁は大工工事（別途）。本図では参考表示',
    '・吊元TOILET側の枠出23は草津D1設計値（実測なし）※要確認',
    '・丁番・取手の図示位置は参考（未確定）',
    '・※印は未確定事項。製作前に要確認',
]
for k, s_ in enumerate(notes):
    text((NX, NY + k * 3.9), s_, size=1.8, c=RED if '※' in s_ else BLACK)

# ================================================================== TITLE BLOCK
TB0, TB1 = 275.0, 287.0
line((10, TB0), (410, TB0), w=W_MED, layer='図枠')
cols = [10, 90, 140, 195, 270, 345, 370, 390, 410]
for x in cols[1:-1]:
    line((x, TB0), (x, TB1), w=W_THIN, layer='図枠')
for k in range(1, 4):
    yy = TB0 + 3 * k
    line((195, yy), (345, yy), w=W_XTHIN, layer='図枠')
line((345, TB0 + 6), (390, TB0 + 6), w=W_XTHIN, layer='図枠')


def lab(x, y, s_):
    text((x + 0.8, y + 1.7), s_, size=1.2, c='#555555', layer='図枠')


lab(10, TB0, '会社名')
lab(90, TB0, '工事名（PROJECT）')
text((115, TB0 + 8.3), 'KUSATSU Vacation rental PJ', size=2.3, anchor='middle', weight='bold')
lab(140, TB0, '図面名（DRAWING TITLE）')
text((167.5, TB0 + 7.0), 'D1 建具製作図', size=2.8, anchor='middle', weight='bold')
text((167.5, TB0 + 10.6), 'KITCHEN・TOILET間 木製片開き戸', size=1.5, anchor='middle')
lab(195, TB0, '改訂（REVISION）')
text((219, TB0 + 2.5), '261016　図面作成', size=1.8)
lab(345, TB0, '縮尺（SCALE）')
text((357.5, TB0 + 5.0), '1/5・1/15（A3）', size=1.8, anchor='middle')
lab(345, TB0 + 6, '日付（DATE）')
text((357.5, TB0 + 11.0), '2026/10/16', size=1.8, anchor='middle')
lab(370, TB0, '作図')
lab(370, TB0 + 6, '検図')
lab(390, TB0, '図番（DRAWING NO.）')
text((400, TB0 + 9.2), 'D1', size=3.6, anchor='middle', weight='bold')

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'out'
    write_svg(out + '.svg', title='KUSATSU Vacation rental PJ  D1 建具製作図')
    write_dxf(out + '.dxf')
    print('items', len(ITEMS))
