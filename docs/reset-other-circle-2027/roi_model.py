#!/usr/bin/env python3
"""Cost / ROI model for RESET x Other Circle 2027. All JPY unless noted.
FX: ECB reference 2026-11-06 EUR/JPY 176.77 (checked 2026-11-09)."""
import math, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
FX = 176.77

def oc_fee(sqm):
    return 4000 + max(0, sqm - 5) * 650  # EUR excl. VAT (othercircle.com/apply, 2027)

# --- scenarios -------------------------------------------------------------
S = {
 'A': dict(name='最小構成', sqm=15, staff=2, nights=9, days=10),
 'B': dict(name='標準構成', sqm=40, staff=3, nights=10, days=11),
 'C': dict(name='ブランド訴求重視（Studio 3全館178㎡・定価計算）', sqm=178, staff=5, nights=11, days=12),
}
# cost lines (JPY) – estimates, see report for basis. key: (A,B,C, basis_tag)
L = [
 ('出展料（Other Circle、税抜）', None, '確認済（主催者2027価格表）'),
 ('作品製作費（材料・社内工数・試作）', (1_500_000, 4_000_000, 10_000_000), '推計（社内工数を原価計上）'),
 ('ブース設営・展示什器（台座・照明・吊り具等）', (500_000, 1_500_000, 4_000_000), '推計'),
 ('梱包（木箱・クレート）', (300_000, 700_000, 1_500_000), '見積必要'),
 ('国際輸送・往路（集荷〜会場搬入）', (700_000, 1_500_000, 3_000_000), '見積必要（A=航空、B=海上LCL、C=コンテナ想定）'),
 ('保険（輸送・展示中）', (100_000, 200_000, 400_000), '見積必要'),
 ('通関・ATAカルネ・通関業者費', (200_000, 300_000, 500_000), '見積必要'),
 ('航空券（東京⇄コペンハーゲン）', None, '推計（1人35万円）'),
 ('宿泊費（会期中・設営撤収含む）', None, '推計（1室1泊4.5万円）'),
 ('日当・現地交通', None, '推計（1人1日1.5万円）'),
 ('現地人件費・施工費（設営補助・機材）', (300_000, 800_000, 2_500_000), '見積必要'),
 ('カタログ・広報制作（撮影・プライスリスト・PR）', (400_000, 1_000_000, 2_500_000), '推計'),
 ('撤収・返送費', (500_000, 1_000_000, 2_000_000), '見積必要'),
 ('会期後フォロー費（サンプル送付・再訪1回）', (300_000, 800_000, 1_500_000), '推計（投資総額に含める）'),
]
CONT = 0.12  # contingency

def build(k):
    s = S[k]; i = 'ABC'.index(k)
    rows = []
    fee_eur = oc_fee(s['sqm'])
    for name, v, basis in L:
        if name.startswith('出展料'):
            jpy = fee_eur * FX
        elif name.startswith('航空券'):
            jpy = s['staff'] * 350_000
        elif name.startswith('宿泊'):
            jpy = s['staff'] * s['nights'] * 45_000
        elif name.startswith('日当'):
            jpy = s['staff'] * s['days'] * 15_000
        else:
            jpy = v[i]
        rows.append((name, jpy, basis))
    sub = sum(r[1] for r in rows)
    cont = sub * CONT
    rows.append(('予備費（小計の12%）', cont, '推計'))
    total = sub + cont
    vat = fee_eur * 0.25 * FX  # cash-flow item, potentially refundable
    return dict(rows=rows, total=total, fee_eur=fee_eur, vat=vat, **s)

R = {k: build(k) for k in 'ABC'}

def yen(x):
    return f"{x/10000:,.0f}万円"
def eur(x):
    return f"€{x/FX:,.0f}"

out = []
out.append('### 費用明細（3シナリオ）\n')
out.append(f"為替：1 EUR = {FX} JPY（ECB参照レート 2026-11-06、確認日 2026-11-09）。万円未満四捨五入。\n")
hdr = '| 費用項目 | ' + ' | '.join(f"{R[k]['name'].split('（')[0]}（{R[k]['sqm']}㎡・{R[k]['staff']}名）" for k in 'ABC') + ' | 根拠区分 |'
out.append(hdr)
out.append('|---|---:|---:|---:|---|')
for j in range(len(R['A']['rows'])):
    name = R['A']['rows'][j][0]; basis = R['A']['rows'][j][2]
    cells = []
    for k in 'ABC':
        v = R[k]['rows'][j][1]
        cells.append(f"{yen(v)}<br>({eur(v)})")
    out.append(f"| {name} | " + ' | '.join(cells) + f" | {basis} |")
out.append('| **出展総費用（税抜）** | ' + ' | '.join(f"**{yen(R[k]['total'])}**<br>(**{eur(R[k]['total'])}**)" for k in 'ABC') + ' | |')
out.append('| 参考：出展料に25%のデンマークVATが課される場合の立替額（還付申請可・要確認） | ' + ' | '.join(f"{yen(R[k]['vat'])}" for k in 'ABC') + ' | skat.dk |')
out.append('')
for k in 'ABC':
    out.append(f"- {R[k]['name']}：出展料 €{R[k]['fee_eur']:,.0f} = €4,000 + ({R[k]['sqm']}−5)㎡ × €650")
out.append('')

# --- break-even ------------------------------------------------------------
cases = [
 ('① 家具直販（展示品・受注生産の直接販売）', 600_000, [0.35, 0.50, 0.65], '平均受注単価60万円（約€3,400）'),
 ('② 海外卸・委託（ギャラリー/販売店経由）', 1_500_000, [0.20, 0.30, 0.40], '1取引先あたり年間取引額150万円（卸価格ベース）'),
 ('③ SETUP特注什器・内装（国内製作受託）', 15_000_000, [0.15, 0.22, 0.30], '1案件1,500万円'),
]
out.append('### 損益分岐：必要受注件数（粗利益で出展総費用を回収するのに必要な件数）\n')
out.append('計算式：必要件数 = 出展総費用 ÷（平均受注額 × 粗利益率）、小数点以下切上げ。\n')
out.append('| 回収ケース | 前提 | 粗利益率 | ' + ' | '.join(f"{R[k]['name'].split('（')[0]}<br>{yen(R[k]['total'])}" for k in 'ABC') + ' |')
out.append('|---|---|---:|---:|---:|---:|')
BE = {}
for cname, avg, gms, note in cases:
    for gm in gms:
        cells = []
        for k in 'ABC':
            n = math.ceil(R[k]['total'] / (avg * gm))
            sales = n * avg
            cells.append(f"{n}件<br>(売上{yen(sales)})")
            BE[(cname, gm, k)] = n
        out.append(f"| {cname} | {note} | {int(gm*100)}% | " + ' | '.join(cells) + ' |')
out.append('')

# --- composite ROI scenarios (Standard config B) ---------------------------
# attributable outcomes at 12 months, Low / Mid / High
comp = {
 '低位': dict(direct=(2, 400_000), whole=(0, 1_500_000), setup=(0, 15_000_000)),
 '中位': dict(direct=(6, 600_000), whole=(2, 1_500_000), setup=(1, 8_000_000)),
 '高位': dict(direct=(12, 700_000), whole=(4, 2_000_000), setup=(2, 15_000_000)),
}
GM = dict(direct=0.50, whole=0.30, setup=0.22)
out.append('### 複合回収シナリオ（標準構成B、出展後12か月の累計・出展起因分のみ）\n')
out.append('| シナリオ | 家具直販 | 海外卸・委託 | SETUP案件 | 増分粗利益 | ROI（B） | ROI（A） | ROI（C） |')
out.append('|---|---|---|---|---:|---:|---:|---:|')
CR = {}
for sc, d in comp.items():
    gp = sum(d[x][0] * d[x][1] * GM[x] for x in d)
    rois = {k: (gp - R[k]['total']) / R[k]['total'] * 100 for k in 'ABC'}
    CR[sc] = (gp, rois)
    out.append(f"| {sc} | {d['direct'][0]}件×{yen(d['direct'][1])} | {d['whole'][0]}社×{yen(d['whole'][1])} | {d['setup'][0]}件×{yen(d['setup'][1])} | {yen(gp)} | {rois['B']:+.0f}% | {rois['A']:+.0f}% | {rois['C']:+.0f}% |")
out.append('')
out.append('粗利益率の前提：家具直販50%、卸・委託30%、SETUP案件22%。A・Cの列は同じ成果をA・Cの費用で割った参考値（実際には展示規模により成果も変わる）。\n')

# sensitivity: mid scenario, vary GM ±
out.append('### 感度分析（標準構成B・中位シナリオ）：粗利益率と成果量の変動\n')
out.append('| 成果量 \\ 粗利益率 | 低（直販35%・卸20%・施工15%） | 中（50%・30%・22%） | 高（65%・40%・30%） |')
out.append('|---|---:|---:|---:|')
d = comp['中位']
for mult, lab in [(0.5, '中位×0.5'), (1.0, '中位×1.0'), (1.5, '中位×1.5'), (2.0, '中位×2.0')]:
    cells = []
    for gmset in [(0.35, 0.20, 0.15), (0.50, 0.30, 0.22), (0.65, 0.40, 0.30)]:
        gp = mult * (d['direct'][0]*d['direct'][1]*gmset[0] + d['whole'][0]*d['whole'][1]*gmset[1] + d['setup'][0]*d['setup'][1]*gmset[2])
        roi = (gp - R['B']['total']) / R['B']['total'] * 100
        cells.append(f"{roi:+.0f}%（粗利{yen(gp)}）")
    out.append(f"| {lab} | " + ' | '.join(cells) + ' |')
out.append('')

# time-phased mid scenario
out.append('### 時系列の回収見通し（標準構成B・中位シナリオ、累計粗利益）\n')
phase = [('会期中〜3か月', 0.30, 0.25, 0.0), ('〜6か月', 0.65, 0.60, 0.0), ('〜12か月', 1.0, 1.0, 1.0)]
out.append('| 時点 | 家具直販 | 卸・委託 | SETUP案件 | 累計粗利益 | 累計ROI |')
out.append('|---|---:|---:|---:|---:|---:|')
for lab, a, b, c in phase:
    g1 = d['direct'][0]*d['direct'][1]*GM['direct']*a
    g2 = d['whole'][0]*d['whole'][1]*GM['whole']*b
    g3 = d['setup'][0]*d['setup'][1]*GM['setup']*c
    gp = g1+g2+g3
    out.append(f"| {lab} | {yen(g1)} | {yen(g2)} | {yen(g3)} | {yen(gp)} | {(gp-R['B']['total'])/R['B']['total']*100:+.0f}% |")
out.append('')

open(os.path.join(HERE, 'roi_model_output.md'), 'w').write('\n'.join(out))
json.dump({k: dict(total=R[k]['total'], fee_eur=R[k]['fee_eur'], vat=R[k]['vat'], rows=R[k]['rows']) for k in R} | {'composite': {k: [v[0], v[1]] for k, v in CR.items()}},
          open(os.path.join(HERE, 'roi_model_output.json'), 'w'), ensure_ascii=False, indent=1)
print('\n'.join(out))
