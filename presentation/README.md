# RESET — 製作者の視点（仮）　社内デザインレビュー資料

RESETの新しい展示コンセプトを、社内デザイナーチームと議論するためのプレゼンテーションです。
16:9（1920×1080）・全10スライド。

## 成果物

| ファイル | 内容 |
|---|---|
| `RESET_Design_Presentation.pdf` | PDF版（10ページ、1920×1080） |
| `index.html` | ブラウザで見るプレゼンテーション（スライド本体と発表者ノートの元データ） |
| `speaker-notes.md` | 日本語の発表者ノート（`index.html` から自動生成） |
| `css/deck.css` | デザイン（グリッド、色、書体、各スライドのレイアウト） |
| `js/deck.js` | スライド操作（キーボード、クリック、スワイプ、ノート表示） |
| `images/` | スライド用に加工した写真（モノクロ・粒子・ハーフトーン） |
| `tools/process_images.py` | `../assets/` の元写真から `images/` を作るスクリプト |
| `tools/build.cjs` | PDF と発表者ノートを書き出すスクリプト |

## 見かた・操作

`index.html` をブラウザ（Chrome 推奨）で開きます。

| 操作 | キー |
|---|---|
| 次へ | → ↓ Space Enter PageDown、画面の右側をクリック、左へスワイプ |
| 前へ | ← ↑ PageUp、画面の左 1/3 をクリック、右へスワイプ |
| 最初 / 最後 | Home / End |
| 全画面 | F |
| 発表者ノート | N（Esc で閉じる） |
| 特定のスライド | URL の末尾に `#slide-7` など |

発表者ノートのパネルはスライドに重なって表示されます。プロジェクターで投影しながら使う場合は、`speaker-notes.md` か PDF を手元の別の端末で開いてください。

## 編集のしかた

- スライドの文字や配置は `index.html`。各スライドは `<section class="slide">` で、要素は 12 列グリッド上に `style="--x:開始列;--w:列数;top:..px"` で置いています。
- 発表者ノートは、各スライド内の `<aside class="notes">` に書きます。`speaker-notes.md` は書き出し時に自動生成されるので、直接は編集しないでください。
- 色と書体は `css/deck.css` 冒頭の `:root` にまとめています。赤（`--red`）は意味のある箇所だけに使っています。

## 書き出し

リポジトリのルートで実行します。

```bash
python3 presentation/tools/process_images.py
```

```bash
node presentation/tools/build.cjs
```

- 1つ目は写真の加工（Pillow と numpy が必要）。元写真を差し替えたときだけ実行します。
- 2つ目で PDF と `speaker-notes.md` を書き出します（Playwright と Chromium が必要）。`--shots <フォルダ>` を付けると各スライドの PNG も保存します。
- 日本語書体の Noto Sans JP は Google Fonts から読み込むため、書き出しにはネット接続が必要です。
- 欧文は Helvetica Neue → Helvetica → Arial の順で使います。macOS 以外で書き出すときは、Helvetica 互換の Nimbus Sans（Debian / Ubuntu では `fonts-urw-base35` パッケージ）を入れておくと、PDF の欧文が Helvetica と同じ字形になります。入っていなければ Arial 互換の Liberation Sans になります。

## 写真について

- 使用しているのは `../assets/` にある RESET の写真（作業写真・検討用パース）だけです。
- `../references/` はグラフィックデザインの参考画像で、スライドには使っていません。
- まだ写真がない題材はプレースホルダーにしています。撮影後に差し替えてください。
  - 木の節（節のある板の表面と断面）— スライド 05・06
  - 集塵機の中に堆積した木粉の層 — スライド 05・06
- スライド 09 のパースは検討用です。確定した展示計画ではないことをキャプションに明記しています。
