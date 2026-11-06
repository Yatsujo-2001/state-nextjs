/*
  RESET Design Presentation - build

  Renders presentation/index.html with headless Chromium (Playwright) and writes
    presentation/RESET_Design_Presentation.pdf   (10 pages, 1920 x 1080)
    presentation/speaker-notes.md                (Japanese speaker notes, from the
                                                  <aside class="notes"> in each slide)

  Usage (from the repository root):
    node presentation/tools/build.cjs
    node presentation/tools/build.cjs --shots <dir>   # also save a PNG per slide

  Requires Playwright with Chromium, and network access to Google Fonts
  (Noto Sans JP) so the Japanese type is embedded in the PDF.
*/
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const HTML = path.join(ROOT, "index.html");
const PDF = path.join(ROOT, "RESET_Design_Presentation.pdf");
const NOTES = path.join(ROOT, "speaker-notes.md");

const shotsArg = process.argv.indexOf("--shots");
const SHOTS = shotsArg > -1 ? path.resolve(process.argv[shotsArg + 1]) : null;

async function settle(page) {
  // wait until every web-font face the page asked for has arrived and all images are decoded
  for (let i = 0; i < 40; i++) {
    const ready = await page.evaluate(async () => {
      await document.fonts.ready;
      const imgs = Array.from(document.images);
      const imgsDone = imgs.every((img) => img.complete && img.naturalWidth > 0);
      const loading = Array.from(document.fonts).some((f) => f.status === "loading");
      return imgsDone && !loading && document.fonts.status === "loaded";
    });
    if (ready) return;
    await page.waitForTimeout(250);
  }
  throw new Error("Fonts or images did not finish loading");
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const failed = [];
  page.on("requestfailed", (r) => failed.push(r.url()));

  await page.goto("file://" + HTML, { waitUntil: "networkidle" });

  // Outside macOS, "Helvetica Neue" is usually missing and fontconfig may substitute an
  // unrelated face for it. Start the stack at Nimbus Sans (the Helvetica clone from the
  // fonts-urw-base35 package); without it, Helvetica/Arial resolve to Liberation Sans.
  if (process.platform !== "darwin") {
    await page.addStyleTag({
      content:
        ':root{--font: "Nimbus Sans", Helvetica, Arial, "Liberation Sans", "Noto Sans JP", sans-serif !important}',
    });
  }

  // ---- PDF ----
  await page.emulateMedia({ media: "print" });
  await settle(page);
  await page.waitForTimeout(300);
  await settle(page);
  const jpOk = await page.evaluate(() => document.fonts.check('500 40px "Noto Sans JP"', "製作者の視点"));
  if (!jpOk) throw new Error("Noto Sans JP is not loaded; the PDF would fall back to another Japanese font");
  await page.pdf({
    path: PDF,
    width: "1920px",
    height: "1080px",
    printBackground: true,
    preferCSSPageSize: true,
  });
  console.log("wrote", path.relative(process.cwd(), PDF));

  // ---- speaker notes ----
  const slides = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".slide")).map((s, i) => {
      const h = s.querySelector("h1, h2");
      const notes = Array.from(s.querySelectorAll(".notes p")).map((p) => ({
        text: p.textContent.replace(/\s+/g, " ").trim(),
        q: p.classList.contains("q"),
      }));
      return {
        n: i + 1,
        title: s.dataset.title || "",
        heading: h ? h.innerText.replace(/\s*\n\s*/g, "").trim() : "",
        notes,
      };
    })
  );
  const pad = (n) => String(n).padStart(2, "0");
  let md = "# RESET — 製作者の視点（仮）\n\n";
  md += "社内デザインレビュー用プレゼンテーション　発表者ノート\n\n";
  md += "- 対象：RESET デザイナーチーム（社内）\n";
  md += "- 資料：`presentation/index.html`（ブラウザ）／ `presentation/RESET_Design_Presentation.pdf`\n";
  md += "- 操作：← → または Space でスライド移動、F で全画面、N で発表者ノートを表示\n";
  md += "- スライドには要点だけを載せています。説明はこのノートを元に口頭で補ってください。\n\n";
  md += "> このファイルは `node presentation/tools/build.cjs` で、各スライドの `<aside class=\"notes\">` から自動生成されます。ノートを直すときは `index.html` を編集してください。\n";
  for (const s of slides) {
    md = md.trimEnd() + `\n\n---\n\n## ${pad(s.n)} — ${s.title}\n\n`;
    if (s.heading) md += `**スライド見出し：** ${s.heading}\n\n`;
    for (const p of s.notes) md += (p.q ? `> ${p.text}` : p.text) + "\n\n";
  }
  fs.writeFileSync(NOTES, md.trimEnd() + "\n");
  console.log("wrote", path.relative(process.cwd(), NOTES));

  // ---- optional screenshots ----
  if (SHOTS) {
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.emulateMedia({ media: "screen" });
    for (let i = 1; i <= slides.length; i++) {
      await page.evaluate((n) => { window.location.hash = "#slide-" + n; }, i);
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(SHOTS, `slide-${pad(i)}.png`) });
    }
    console.log("wrote screenshots to", SHOTS);
  }

  if (failed.length) console.warn("failed requests:\n  " + failed.join("\n  "));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
