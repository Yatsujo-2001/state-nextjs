# KUSATSU Vacation rental PJ — 建具製作図（D1・D2）

| フォルダ | 建具 | 内容 |
|---|---|---|
| `D1/` | D1 KITCHEN・TOILET間 木製片開き戸 | 製作図 PDF／SVG／DXF、確認事項一覧、Vectorworks 用スクリプト |
| `D2/` | D2 KITCHEN・STORAGE間 木製片開き戸（オーク突板 染色・4分割割付） | 同上 |
| `src/` | 共通 | 作図・生成・検証スクリプト |

各フォルダのファイル

| ファイル | 内容 |
|---|---|
| `Dx_建具製作図.pdf` | A3横・ベクターPDF（S=1/5・1/15） |
| `Dx_建具製作図.svg` | PDFと同一内容のSVG（PDFはこのSVGから出力） |
| `Dx_建具製作図.dxf` | DXF（R2018）。**A3用紙座標（1単位＝用紙上1mm）のため実寸ではない** |
| `KUSATSU_Dx_VW.txt` / `.py` | **Vectorworks 用スクリプト**（同一内容。英数字のみで文字化けしない）。実行するとレイヤ縮尺どおり・実寸で作図する |
| `Dx_確認事項一覧.md` | 未確定寸法・仕様の確認事項、算定根拠、整合性チェック結果 |

## Vectorworks（.vwx）の作り方（リソースマネージャから実行）

1. Vectorworks で新規ファイルを作成（単位 mm、原点・用紙位置は初期状態のまま）
2. **ファイル > 用紙設定** で A3・横
3. **ウインドウ > パレット > リソースマネージャ** を開く
4. リソースマネージャの **新規リソース** →「スクリプト」を選んで **作成**
   → スクリプトパレットの名前（例：D2）→ スクリプトの名前（例：D2作図）
5. スクリプトエディタで **言語を「Python Script」** にし、`KUSATSU_Dx_VW.txt` をメモ帳で開いて
   全選択（Ctrl+A）→ コピー（Ctrl+C）→ エディタに貼り付け → **OK**
6. スクリプトパレットのスクリプトを **ダブルクリック（1回だけ）**
7. 完了ダイアログで「失敗 0」を確認（D1：作成 608、D2：作成 618）
8. **表示 > レイヤオプション > 表示/スナップ/編集** にする
9. **ファイル > 別名で保存** で `.vwx` として保存

### 貼り付けがうまくいかない場合（代替）
`KUSATSU_Dx_VW.txt` をデスクトップに置き、手順5で本文の代わりに次の数行を貼り付けて実行する（`Dx` は D1／D2 に置き換え）。

```python
import os, vs
h = os.path.expanduser('~')
c = [os.path.join(h, d, 'KUSATSU_D2_VW.txt') for d in ('Desktop', 'Downloads', 'OneDrive\\Desktop', 'OneDrive\\デスクトップ')]
c = [p for p in c if os.path.exists(p)]
if c:
    exec(compile(open(c[0], 'rb').read().decode('ascii'), c[0], 'exec'))
else:
    vs.AlrtDialog('KUSATSU_D2_VW.txt をデスクトップに置いてください')
```

作成されるデザインレイヤ（図形はすべて実寸 mm）

| デザインレイヤ | 縮尺 | 内容 |
|---|---|---|
| 00_図枠・表題_1-1 | 1:1 | 図枠・タイトル欄・仕様表・特記 |
| 01_平面詳細図_1-5 | 1:5 | 平面詳細図 |
| 02_KITCHEN側正面図_1-15 | 1:15 | KITCHEN側正面図 |
| 03_TOILET側（D2：STORAGE側）正面図_1-15 | 1:15 | 反対側の正面図 |
| 04_断面詳細図_1-15 | 1:15 | 断面詳細図 |
| 05_上部詳細図_1-5 | 1:5 | A：上部詳細 |
| 06_下部詳細図_1-5 | 1:5 | B：下部詳細 |

- クラス：Dx-外形線／Dx-細線／Dx-寸法／Dx-文字／Dx-注記／Dx-金物／Dx-木目／Dx-図名／Dx-図枠／Dx-ハッチ
- 文字はポイント指定（用紙上の大きさ）、線の太さはミル指定のため、どのレイヤでも PDF と同じ見え方になる
- 破線・ハッチは短い線分のグループ、寸法は線・点・文字で作図している（Vectorworks の線種リソース・寸法オブジェクトは使っていない）
- 2回実行すると図形が二重にできるので、やり直す場合は新規ファイルで実行する

## 再出力（寸法を変えた場合）

```bash
cd src
python3 d2.py ../D2/D2_建具製作図                      # SVG / DXF（寸法の値は d2.py 冒頭の定数）
(cd ../D2 && ../src/render.sh D2_建具製作図)           # PDF（Chromium で A3 印刷）
python3 check_d2.py                                     # 整合性チェック（D1 は check.py）
python3 vwgen.py ../D2/KUSATSU_D2_VW.py d2              # Vectorworks 用スクリプトを再生成（.txt にもコピー）
python3 test_vw.py ../D2/KUSATSU_D2_VW.py /tmp/vwtest d2   # 模擬 vs モジュールで縮尺・実寸・配置を検証
```

必要なもの：Python 3、`ezdxf`、Chromium、IPAゴシックフォント。
