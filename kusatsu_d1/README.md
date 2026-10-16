# KUSATSU Vacation rental PJ — D1 建具製作図

| ファイル | 内容 |
|---|---|
| `D1_建具製作図.pdf` | A3横・ベクターPDF（S=1/5・1/15） |
| `D1_建具製作図.svg` | PDFと同一内容のSVG（PDFはこのSVGから出力） |
| `D1_建具製作図.dxf` | CAD編集用DXF（R2018、A3用紙座標 1単位=1mm、画層：外形線／細線／寸法／文字／注記／金物／ハッチ／木目／図枠） |
| `D1_確認事項一覧.md` | 未確定寸法・仕様の確認事項、算定根拠、整合性チェック結果 |
| `src/` | 作図スクリプト（寸法を変更して再出力する場合に使用） |

## 再出力

```bash
cd src
python3 d1.py out        # out.svg / out.dxf（寸法の値は d1.py 冒頭の定数）
./render.sh out          # out.pdf（Chromium で A3 印刷）
python3 check.py         # 整合性チェック
```

必要なもの：Python 3、`ezdxf`、Chromium、IPAゴシックフォント。
DXFの文字スタイルは `msgothic.ttc`（MSゴシック）を指定しています。
