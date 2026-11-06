/*
  RESET Design Presentation - PowerPoint export

  Builds an editable presentation/RESET_Design_Presentation.pptx from
  presentation/index.html. The HTML deck stays the source of truth: every slide
  is rendered at 1920 x 1080 in headless Chromium, the position and style of each
  text block, image, rule and placeholder is measured, and the same objects are
  rebuilt as native PowerPoint text boxes, pictures and shapes (no screenshots).
  Speaker notes come from the <aside class="notes"> of each slide.

  Usage (from the repository root):
    npm install --prefix presentation/tools     # once: pptxgenjs, jszip, image-size
    node presentation/tools/build_pptx.cjs

  Fonts in the .pptx: Latin text uses Arial, Japanese text uses Noto Sans JP
  (set as the theme's East Asian font). Install Noto Sans JP from Google Fonts on
  the presenting computer; otherwise PowerPoint substitutes another Japanese font.
*/
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const PptxGenJS = require("pptxgenjs");
const JSZip = require("jszip");

const ROOT = path.resolve(__dirname, "..");
const HTML = path.join(ROOT, "index.html");
const OUT = path.join(ROOT, "RESET_Design_Presentation.pptx");

const PX = 1 / 144; // 1920 px slide = 13.333 in
const LATIN = "Arial";
const JAPANESE = "Noto Sans JP";

// design tokens -> theme slots, so colours stay editable from the PowerPoint theme
const THEME = {
  name: "RESET Design Review",
  colors: {
    dk1: "121212", // ink
    lt1: "ECEAE5", // paper
    dk2: "0E0E0D", // night
    lt2: "E0DED8", // paper-2
    accent1: "E2231A", // red
    accent2: "7A7872", // grey
    accent3: "A6A39C", // grey-2
    accent4: "45433F", // ink-2
    accent5: "C4C1BA", // rule
    accent6: "B9B6AE", // night text
    hlink: "E2231A",
    folHlink: "7A7872",
  },
};
const SCHEME = {
  "121212": "tx1",
  ECEAE5: "bg1",
  "0E0E0D": "tx2",
  E0DED8: "bg2",
  E2231A: "accent1",
  "7A7872": "accent2",
  A6A39C: "accent3",
  "45433F": "accent4",
  C4C1BA: "accent5",
  B9B6AE: "accent6",
};

const SECTIONS = {
  1: "導入",
  2: "背景とコンセプト",
  5: "素材の観察",
  7: "デザインと展示",
  10: "ディスカッション",
};

/* ------------------------------------------------------------------ */
/* 1. measure the rendered HTML                                         */
/* ------------------------------------------------------------------ */

function measure() {
  const out = [];
  const toHex = (c) => {
    const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(c || "");
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
    return [m[1], m[2], m[3]].map((v) => Math.round(+v).toString(16).padStart(2, "0")).join("").toUpperCase();
  };
  const num = (v) => parseFloat(v) || 0;

  document.querySelectorAll(".slide").forEach((slide, index) => {
    const S = slide.getBoundingClientRect();
    const items = [];
    const rel = (r) => ({ x: r.left - S.left, y: r.top - S.top, w: r.width, h: r.height });

    function borders(r, cs, fill) {
      const sides = ["Top", "Right", "Bottom", "Left"].map((s) => ({
        s,
        w: num(cs["border" + s + "Width"]),
        style: cs["border" + s + "Style"],
        color: toHex(cs["border" + s + "Color"]),
      }));
      const vis = sides.filter((b) => b.w > 0 && b.style !== "none" && b.color);
      if (vis.length === 4 && vis.every((b) => b.w === vis[0].w && b.color === vis[0].color)) {
        items.push({ t: "box", ...r, fill, line: vis[0].color, lw: vis[0].w, dash: vis[0].style === "dashed" });
        return true;
      }
      if (fill) items.push({ t: "box", ...r, fill });
      for (const b of vis) {
        const o = b.w / 2;
        if (b.s === "Top") items.push({ t: "line", x1: r.x, y1: r.y + o, x2: r.x + r.w, y2: r.y + o, color: b.color, lw: b.w });
        if (b.s === "Bottom") items.push({ t: "line", x1: r.x, y1: r.y + r.h - o, x2: r.x + r.w, y2: r.y + r.h - o, color: b.color, lw: b.w });
        if (b.s === "Left") items.push({ t: "line", x1: r.x + o, y1: r.y, x2: r.x + o, y2: r.y + r.h, color: b.color, lw: b.w });
        if (b.s === "Right") items.push({ t: "line", x1: r.x + r.w - o, y1: r.y, x2: r.x + r.w - o, y2: r.y + r.h, color: b.color, lw: b.w });
      }
      return true;
    }

    function paintBox(r, cs) {
      const fill = toHex(cs.backgroundColor);
      // thin filled boxes are rules: draw them as lines
      if (fill && (r.w <= 2.5 || r.h <= 2.5) && r.w * r.h > 0) {
        if (r.w <= r.h) items.push({ t: "line", x1: r.x + r.w / 2, y1: r.y, x2: r.x + r.w / 2, y2: r.y + r.h, color: fill, lw: r.w });
        else items.push({ t: "line", x1: r.x, y1: r.y + r.h / 2, x2: r.x + r.w, y2: r.y + r.h / 2, color: fill, lw: r.h });
        return;
      }
      borders(r, cs, fill);
    }

    function pseudo(el, which) {
      const ps = getComputedStyle(el, which);
      if (!ps || ps.content === "none" || ps.content === "normal" || ps.display === "none") return;
      if (ps.position !== "absolute") return;
      const pr = el.getBoundingClientRect();
      const pcs = getComputedStyle(el);
      const x = pr.left - S.left + num(pcs.borderLeftWidth) + num(ps.left);
      const y = pr.top - S.top + num(pcs.borderTopWidth) + num(ps.top);
      const w = num(ps.width) + num(ps.borderLeftWidth) + num(ps.borderRightWidth);
      const h = num(ps.height) + num(ps.borderTopWidth) + num(ps.borderBottomWidth);
      paintBox({ x, y, w, h }, ps);
    }

    function clipRect(el) {
      let p = el.parentElement;
      while (p && p !== slide) {
        if (getComputedStyle(p).overflow === "hidden") return rel(p.getBoundingClientRect());
        p = p.parentElement;
      }
      return { x: 0, y: 0, w: 1920, h: 1080 };
    }

    function image(img) {
      const cs = getComputedStyle(img);
      const R = img.getBoundingClientRect();
      const bw = img.offsetWidth, bh = img.offsetHeight;
      const nw = img.naturalWidth, nh = img.naturalHeight;
      const s0 = Math.max(bw / nw, bh / nh);
      const [pxs, pys] = cs.objectPosition.split(" ").map((v) => parseFloat(v) / 100);
      const k = R.width / bw; // css transform scale
      const cw = nw * s0 * k, ch = nh * s0 * k;
      const cx = R.left - S.left + (bw - nw * s0) * pxs * k;
      const cy = R.top - S.top + (bh - nh * s0) * pys * k;
      const C = clipRect(img);
      const vx = Math.max(C.x, cx), vy = Math.max(C.y, cy);
      const vr = Math.min(C.x + C.w, cx + cw), vb = Math.min(C.y + C.h, cy + ch);
      items.push({
        t: "img",
        src: decodeURIComponent(new URL(img.src).pathname),
        alt: img.alt,
        cw, ch,
        crop: { x: vx - cx, y: vy - cy, w: vr - vx, h: vb - vy },
        x: vx, y: vy,
      });
    }

    function svg(el) {
      el.querySelectorAll("line").forEach((ln) => {
        const m = ln.getScreenCTM();
        const p = (x, y) => {
          const pt = el.createSVGPoint();
          pt.x = x; pt.y = y;
          const q = pt.matrixTransform(m);
          return [q.x - S.left, q.y - S.top];
        };
        const a = p(ln.x1.baseVal.value, ln.y1.baseVal.value);
        const b = p(ln.x2.baseVal.value, ln.y2.baseVal.value);
        const lcs = getComputedStyle(ln);
        items.push({ t: "line", x1: a[0], y1: a[1], x2: b[0], y2: b[1], color: toHex(lcs.stroke), lw: num(lcs.strokeWidth) || 1 });
      });
      el.querySelectorAll("rect").forEach((rc) => {
        const rcs = getComputedStyle(rc);
        items.push({ t: "box", ...rel(rc.getBoundingClientRect()), fill: null, line: toHex(rcs.stroke), lw: num(rcs.strokeWidth) || 1 });
      });
      el.querySelectorAll("text").forEach((tx) => {
        const tcs = getComputedStyle(tx);
        const r = rel(tx.getBoundingClientRect());
        items.push({
          t: "text", x: r.x, y: r.y, w: r.w, h: r.h, align: "left", lh: r.h,
          runs: [{ text: tx.textContent, size: num(tcs.fontSize), color: toHex(tcs.fill), ls: 0 }],
        });
      });
    }

    function styleOf(el) {
      const cs = getComputedStyle(el);
      return {
        size: num(cs.fontSize),
        color: toHex(cs.color),
        ls: cs.letterSpacing === "normal" ? 0 : num(cs.letterSpacing),
        upper: cs.textTransform === "uppercase",
      };
    }

    function runsOf(el, runs) {
      for (const node of el.childNodes) {
        if (node.nodeType === 3) {
          const t = node.textContent.replace(/[ \t\n\r\f]+/g, " ");
          if (t) runs.push({ text: t, ...styleOf(node.parentElement) });
        } else if (node.nodeType === 1) {
          const cs = getComputedStyle(node);
          if (cs.display === "none") continue;
          if (node.tagName === "BR") { runs.push({ br: true }); continue; }
          const block = cs.display === "block" || cs.display === "list-item";
          if (block && runs.length && !runs[runs.length - 1].br) runs.push({ br: true });
          const st = styleOf(node);
          const ml = num(cs.marginLeft), mr = num(cs.marginRight);
          const gap = (m) => { const n = Math.round(m / (st.size * 0.5)); if (n > 0) runs.push({ text: " ".repeat(n), ...st }); };
          if (!block) gap(ml);
          runsOf(node, runs);
          if (!block) gap(mr);
          if (block) runs.push({ br: true });
        }
      }
      return runs;
    }

    function textBlock(el) {
      const cs = getComputedStyle(el);
      // geometry from the text itself (not the element), so flex/grid centring is kept
      const rects = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (!n.textContent.trim()) continue;
        const rg = document.createRange();
        rg.selectNodeContents(n);
        for (const r of rg.getClientRects()) if (r.width > 0) rects.push(r);
      }
      if (!rects.length) return;
      const left = Math.min(...rects.map((r) => r.left));
      const right = Math.max(...rects.map((r) => r.right));
      const top = Math.min(...rects.map((r) => r.top));
      const bottom = Math.max(...rects.map((r) => r.bottom));
      // count line boxes
      const centers = rects.map((r) => (r.top + r.bottom) / 2).sort((a, b) => a - b);
      let lines = 1;
      for (let i = 1; i < centers.length; i++) if (centers[i] - centers[i - 1] > num(cs.fontSize) * 0.45) lines++;
      const lh = cs.lineHeight === "normal" ? (bottom - top) / lines : num(cs.lineHeight);
      const firstH = rects.filter((r) => r.top - top < 2).reduce((m, r) => Math.max(m, r.height), 0);
      const y = top - (lh - firstH) / 2;
      let runs = runsOf(el, []);
      // tidy: trim spaces at line edges, drop trailing breaks
      const tidy = [];
      for (const r of runs) {
        if (r.br) { if (tidy.length && !tidy[tidy.length - 1].br) tidy.push(r); continue; }
        const atLineStart = !tidy.length || tidy[tidy.length - 1].br;
        const t = atLineStart ? r.text.replace(/^ +/, "") : r.text;
        if (t) tidy.push({ ...r, text: r.upper ? t.toUpperCase() : t });
      }
      while (tidy.length && tidy[tidy.length - 1].br) tidy.pop();
      for (let i = 0; i < tidy.length; i++) {
        if (!tidy[i].br && (i === tidy.length - 1 || tidy[i + 1].br)) tidy[i].text = tidy[i].text.replace(/ +$/, "");
      }
      const align = cs.textAlign === "right" || cs.textAlign === "end" ? "right" : cs.textAlign === "center" ? "center" : "left";
      // every line break is explicit -> never let PowerPoint re-wrap the text
      const explicitLines = 1 + tidy.filter((r) => r.br).length;
      items.push({
        t: "text",
        title: /^H[12]$/.test(el.tagName),
        x: left - S.left, y: y - S.top, w: right - left, h: lh * lines, lh, align,
        nowrap: lines <= explicitLines,
        runs: tidy,
      });
      // inline descendants that draw rules (e.g. the blank line in Q6)
      el.querySelectorAll("*").forEach((d) => {
        const dcs = getComputedStyle(d);
        if (["inline-block", "inline"].includes(dcs.display) && !d.textContent.trim()) paintBox(rel(d.getBoundingClientRect()), dcs);
      });
    }

    function isInline(el) {
      const d = getComputedStyle(el).display;
      return d === "inline" || d === "inline-block";
    }

    function walk(el) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || el.classList.contains("notes")) return;
      const r = rel(el.getBoundingClientRect());
      if (el !== slide && !["IMG", "svg"].includes(el.tagName)) paintBox(r, cs);
      pseudo(el, "::before");
      pseudo(el, "::after");
      if (el.tagName === "IMG") return image(el);
      if (el.tagName === "svg") return svg(el);
      const hasText = Array.from(el.childNodes).some((c) => c.nodeType === 3 && c.textContent.trim());
      const kids = Array.from(el.children);
      const inlineOnly = kids.length > 0 && kids.every((k) => isInline(k) || k.tagName === "BR") && el.textContent.trim();
      if (el !== slide && (hasText || inlineOnly)) return textBlock(el);
      kids.forEach(walk);
    }

    walk(slide);
    out.push({
      n: index + 1,
      dark: slide.classList.contains("dark"),
      bg: toHex(getComputedStyle(slide).backgroundColor),
      name: (slide.dataset.title || "").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()),
      notes: Array.from(slide.querySelectorAll(".notes p")).map((p) => p.textContent.replace(/\s+/g, " ").trim()),
      items,
    });
  });
  return out;
}

async function measureDeck() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto("file://" + HTML, { waitUntil: "networkidle" });
  // measure with Arial-compatible Latin metrics, matching the font written into the .pptx
  await page.addStyleTag({ content: ':root{--font: Arial, "Liberation Sans", "Noto Sans JP", sans-serif !important}' });
  await page.emulateMedia({ media: "print" });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(500);
  const deck = await page.evaluate(measure);
  await browser.close();
  return deck;
}

/* ------------------------------------------------------------------ */
/* 2. rebuild as PowerPoint                                             */
/* ------------------------------------------------------------------ */

function color(hex) {
  return SCHEME[hex] || hex || "121212";
}

async function build(deck) {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in = 1920 x 1080 px
  pres.title = "製作者の視点 — RESET Internal Design Review";
  pres.subject = "RESET exhibition concept";
  pres.author = "RESET";
  pres.theme = { headFontFace: LATIN, bodyFontFace: LATIN };

  // one layout per slide: its background and its title placeholder
  for (const s of deck) {
    const t = s.items.find((i) => i.t === "text" && i.title);
    const objects = [];
    if (t) {
      const size = t.runs[0].size / 2;
      objects.push({
        placeholder: {
          options: {
            name: "title",
            type: "title",
            x: t.x * PX,
            y: t.y * PX,
            w: Math.min(t.w * 1.1 + 16, 1920 - t.x) * PX,
            h: t.h * PX,
            fontSize: size,
            color: color(t.runs[0].color),
            margin: 0,
            valign: "top",
            align: "left",
            lineSpacing: (t.lh / 2),
            charSpacing: t.runs[0].ls / 2,
            lang: "ja-JP",
          },
          text: "",
        },
      });
    }
    pres.defineSlideMaster({
      title: `${String(s.n).padStart(2, "0")} ${s.name}`,
      background: { color: color(s.bg) },
      objects,
    });
  }

  for (const s of deck) {
    if (SECTIONS[s.n]) pres.addSection({ title: SECTIONS[s.n] });
    const sectionTitle = Object.keys(SECTIONS).map(Number).filter((k) => k <= s.n).map((k) => SECTIONS[k]).pop();
    const slide = pres.addSlide({ masterName: `${String(s.n).padStart(2, "0")} ${s.name}`, sectionTitle });
    let k = 0;
    for (const it of s.items) {
      k++;
      const objectName = `${it.t}-${String(k).padStart(3, "0")}`;
      if (it.t === "box") {
        if (it.w < 1 || it.h < 1) continue;
        slide.addShape(pres.shapes.RECTANGLE, {
          x: it.x * PX, y: it.y * PX, w: it.w * PX, h: it.h * PX,
          fill: it.fill ? { color: color(it.fill) } : { type: "none" },
          line: it.line ? { color: color(it.line), width: Math.max(0.75, it.lw / 2), dashType: it.dash ? "dash" : "solid" } : { type: "none" },
          objectName,
        });
      } else if (it.t === "line") {
        const x = Math.min(it.x1, it.x2), y = Math.min(it.y1, it.y2);
        const w = Math.abs(it.x2 - it.x1), h = Math.abs(it.y2 - it.y1);
        const flipH = (it.x2 < it.x1) !== (it.y2 < it.y1) && w > 0.5 && h > 0.5;
        slide.addShape(pres.shapes.LINE, {
          x: x * PX, y: y * PX, w: w * PX, h: h * PX, flipH,
          line: { color: color(it.color), width: Math.max(0.75, it.lw / 2) },
          objectName,
        });
      } else if (it.t === "img") {
        slide.addImage({
          path: it.src,
          x: it.x * PX, y: it.y * PX, w: it.cw * PX, h: it.ch * PX,
          sizing: { type: "crop", x: it.crop.x * PX, y: it.crop.y * PX, w: it.crop.w * PX, h: it.crop.h * PX },
          altText: it.alt,
          objectName: `photo-${String(k).padStart(3, "0")}`,
        });
      } else if (it.t === "text") {
        const runs = [];
        it.runs.forEach((r, i) => {
          if (r.br) {
            if (runs.length) runs[runs.length - 1].options.breakLine = true;
            return;
          }
          runs.push({
            text: r.text,
            options: {
              fontSize: r.size / 2,
              color: color(r.color),
              charSpacing: r.ls ? r.ls / 2 : undefined,
              lang: "ja-JP",
            },
          });
        });
        if (!runs.length) continue;
        if (it.title) {
          slide.addText(runs, { placeholder: "title" });
          continue;
        }
        // headroom for metric differences between browser and PowerPoint (no proportional kana)
        const extra = Math.max(16, it.w * 0.1);
        let x = it.x, w = it.w + extra;
        if (it.align === "right") x = it.x - extra;
        if (it.align === "center") x = it.x - extra / 2;
        x = Math.max(0, x);
        w = Math.min(w, 1920 - x);
        slide.addText(runs, {
          x: x * PX, y: it.y * PX, w: w * PX, h: Math.max(it.h, it.lh) * PX,
          margin: 0, valign: "top", align: it.align, isTextBox: true, fit: "none",
          wrap: !it.nowrap,
          lineSpacing: it.lh / 2,
          objectName: `text-${String(k).padStart(3, "0")}`,
        });
      }
    }
    if (s.notes.length) slide.addNotes(s.notes.join("\n\n"));
  }

  await pres.writeFile({ fileName: OUT });
}

/* ------------------------------------------------------------------ */
/* 3. theme: colours and the Japanese (East Asian) font                 */
/* ------------------------------------------------------------------ */

async function applyTheme() {
  const zip = await JSZip.loadAsync(fs.readFileSync(OUT));
  const themes = Object.keys(zip.files).filter((f) => /^ppt\/theme\/theme\d+\.xml$/.test(f));
  const c = THEME.colors;
  const sys = (k) => `<a:srgbClr val="${c[k]}"/>`;
  const scheme =
    `<a:clrScheme name="${THEME.name}">` +
    `<a:dk1>${sys("dk1")}</a:dk1><a:lt1>${sys("lt1")}</a:lt1><a:dk2>${sys("dk2")}</a:dk2><a:lt2>${sys("lt2")}</a:lt2>` +
    ["accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"].map((k) => `<a:${k}>${sys(k)}</a:${k}>`).join("") +
    `</a:clrScheme>`;
  for (const f of themes) {
    let xml = await zip.file(f).async("string");
    xml = xml.replace(/<a:clrScheme[\s\S]*?<\/a:clrScheme>/, scheme);
    xml = xml.replace(/(<a:(?:major|minor)Font>\s*<a:latin[^>]*\/>\s*)<a:ea typeface="[^"]*"\s*\/>/g, `$1<a:ea typeface="${JAPANESE}"/>`);
    xml = xml.replace(/<a:theme ([^>]*)name="[^"]*"/, `<a:theme $1name="${THEME.name}"`);
    zip.file(f, xml);
  }
  // layout title placeholders: no inner margin, top-anchored, no re-wrapping (pptxgenjs omits these)
  for (const f of Object.keys(zip.files).filter((n) => /^ppt\/slideLayouts\/slideLayout\d+\.xml$/.test(n))) {
    let xml = await zip.file(f).async("string");
    xml = xml.replace(/<a:bodyPr wrap="square" rtlCol="0">/g, '<a:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="t">');
    zip.file(f, xml);
  }
  // repack without folder entries (some cloud viewers refuse zips that contain them)
  const clean = new JSZip();
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    clean.file(name, await entry.async("nodebuffer"), { createFolders: false });
  }
  fs.writeFileSync(OUT, await clean.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

(async () => {
  const deck = await measureDeck();
  if (process.argv.includes("--dump")) fs.writeFileSync(process.argv[process.argv.indexOf("--dump") + 1], JSON.stringify(deck, null, 1));
  await build(deck);
  await applyTheme();
  console.log("wrote", path.relative(process.cwd(), OUT), `(${deck.length} slides, ${deck.reduce((n, s) => n + s.items.length, 0)} objects)`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
