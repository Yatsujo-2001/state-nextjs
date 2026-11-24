#!/usr/bin/env python3
"""
家具写真を FURNITURE INDEX 用に整える（4:5 / 1200×1500 の JPEG）

使い方:
  python3 scripts/prepare_furniture_image.py <入力画像> public/furniture/<slug>.jpg [--mode float|bleed] [--fill 0.74]

  --mode float（既定）
      背景がグレー〜白のレンダーや切り抜き写真向け。
      背景の明るさをセルのグレーに合わせ、周囲に余白を足してふちをぼかし、
      作品をセルの中央に浮かせる（INDEX の見本の雰囲気）。
      --fill で作品の大きさを調整（画像がセル幅・高さの何割に収まるか）。
  --mode bleed
      床や壁ごと見せたい写真向け。4:5 に中央トリミングするだけ。
      --anchor で縦方向の切り出し位置を調整（0=上寄せ, 0.5=中央, 1=下寄せ）。

必要: Pillow, numpy
"""
import argparse

import numpy as np
from PIL import Image, ImageFilter

# app/globals.css の --fx-cell と同じ色にすること
CELL = np.array([0xE3, 0xE3, 0xE1], dtype=np.float32)
OUT_W, OUT_H = 1200, 1500


def smooth1d(a: np.ndarray, sigma: float) -> np.ndarray:
    """(n, 3) の色列を辺に沿ってガウスぼかし"""
    r = max(1, int(sigma * 3))
    x = np.arange(-r, r + 1)
    k = np.exp(-(x**2) / (2 * sigma**2))
    k /= k.sum()
    p = np.pad(a, ((r, r), (0, 0)), mode="edge")
    return np.stack([np.convolve(p[:, c], k, mode="valid") for c in range(3)], axis=1)


def float_mode(img: Image.Image, fill: float, feather: float) -> Image.Image:
    a = np.asarray(img, dtype=np.float32)
    h, w, _ = a.shape

    # 1. 背景（外周）の色をセル色に合わせる
    st = max(2, int(min(w, h) * 0.006))
    border = np.concatenate(
        [a[:st].reshape(-1, 3), a[-st:].reshape(-1, 3), a[:, :st].reshape(-1, 3), a[:, -st:].reshape(-1, 3)]
    )
    gain = np.clip(CELL / np.median(border, axis=0), 0.85, 1.15)
    a = np.clip(a * gain, 0, 255)

    # 2. キャンバス内に収まるよう縮小
    s = min(OUT_W * fill / w, OUT_H * fill / h)
    nw, nh = round(w * s), round(h * s)
    a = np.asarray(Image.fromarray(a.astype(np.uint8)).resize((nw, nh), Image.LANCZOS), dtype=np.float32)

    # 2.5 写真のふち（内側の細い帯）だけ少しぼかし、延長部分とつなぎ目なく接続する
    band = max(6.0, min(nw, nh) * 0.035)
    soft = np.asarray(Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.GaussianBlur(band * 0.8)), dtype=np.float32)
    iy, ix = np.mgrid[0:nh, 0:nw]
    d_in = np.minimum(np.minimum(ix, nw - 1 - ix), np.minimum(iy, nh - 1 - iy))
    w_in = np.clip(1 - d_in / band, 0, 1)[..., None]
    a = a * (1 - w_in) + soft * w_in

    # 3. 外周を辺に沿ってならし、その色で余白を延長（ノイズの筋を防ぐ）
    st = max(2, int(min(nw, nh) * 0.006))
    sig = max(12.0, nw * 0.04)
    e = a.copy()
    e[0] = smooth1d(a[:st].mean(0), sig)
    e[-1] = smooth1d(a[-st:].mean(0), sig)
    e[:, 0] = smooth1d(a[:, :st].mean(1), sig)
    e[:, -1] = smooth1d(a[:, -st:].mean(1), sig)
    left, top = (OUT_W - nw) // 2, (OUT_H - nh) // 2
    canvas = np.pad(e, ((top, OUT_H - nh - top), (left, OUT_W - nw - left), (0, 0)), mode="edge")
    canvas[top : top + nh, left : left + nw] = a

    # 4. 画像の外側をセル色へなめらかにフェード（余白いっぱいを使って四角い境目を見せない）
    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W]
    dx = np.maximum(np.maximum(left - xx, xx - (left + nw - 1)), 0) / max(left * feather, 1)
    dy = np.maximum(np.maximum(top - yy, yy - (top + nh - 1)), 0) / max(top * feather, 1)
    t = np.clip(np.sqrt(dx**2 + dy**2), 0, 1)[..., None]
    # 写真から離れるほど強くぼかす（延長部分の筋を消す）
    blurred = np.asarray(
        Image.fromarray(canvas.astype(np.uint8)).filter(ImageFilter.GaussianBlur(OUT_W * 0.035)), dtype=np.float32
    )
    canvas = canvas + (blurred - canvas) * np.clip(t * 2.5, 0, 1)
    t = t * t * (3 - 2 * t)
    out = canvas * (1 - t) + CELL * t
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def bleed_mode(img: Image.Image, anchor: float) -> Image.Image:
    w, h = img.size
    ratio = OUT_W / OUT_H
    if w / h > ratio:
        cw = round(h * ratio)
        x0 = (w - cw) // 2
        box = (x0, 0, x0 + cw, h)
    else:
        ch = round(w / ratio)
        y0 = round((h - ch) * anchor)
        box = (0, y0, w, y0 + ch)
    img = img.crop(box)
    if img.width > OUT_W:
        img = img.resize((OUT_W, OUT_H), Image.LANCZOS)
    return img


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("src")
    p.add_argument("dst")
    p.add_argument("--mode", choices=["float", "bleed"], default="float")
    p.add_argument("--fill", type=float, default=0.74)
    p.add_argument("--feather", type=float, default=0.9, help="余白の何割でセル色まで溶かすか")
    p.add_argument("--anchor", type=float, default=0.5)
    args = p.parse_args()

    img = Image.open(args.src).convert("RGB")
    out = float_mode(img, args.fill, args.feather) if args.mode == "float" else bleed_mode(img, args.anchor)
    out.save(args.dst, "JPEG", quality=86, optimize=True, progressive=True)
    print(f"{args.dst}  {out.width}x{out.height}")


if __name__ == "__main__":
    main()
