"""
RESET Design Presentation - image preparation

Turns the original photos in ../../assets/ into the monochrome, grainy and
halftone versions used by the slides (written to ../images/).
The originals are never modified.

Usage (from the repository root):
    python3 presentation/tools/process_images.py

Requires: Pillow, numpy
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets"
OUT = ROOT / "presentation" / "images"

PAPER = (236, 234, 229)  # --paper
INK = (18, 18, 18)       # --ink

# name: (source file, crop box (left, top, right, bottom) or None, max width)
PHOTOS = {
    # RESET workshop photos
    "workshop-planing": ("work-photo-01-planing.jpg", None, 2000),
    "planing-tall": ("work-photo-01-planing.jpg", (300, 360, 1340, 1333), 1400),
    "shavings-planer": ("work-photo-01-planing.jpg", (760, 820, 1360, 1240), 1200),
    "shavings-close": ("work-photo-01-planing.jpg", (380, 1010, 905, 1333), 1000),
    "shavings-strip": ("work-photo-01-planing.jpg", (200, 1020, 1000, 1320), 1200),
    "offcuts-joints": ("work-photo-02-joinery-stack.jpg", (1100, 540, 2000, 1080), 1400),
    "offcuts-endgrain": ("work-photo-02-joinery-stack.jpg", (1190, 690, 1660, 1070), 1000),
    # RESET study renderings (perspectives)
    "perspective-01": ("perspective-01-corner.webp", None, 1920),
    "perspective-02": ("perspective-02-front.webp", None, 1920),
    "perspective-03": ("perspective-03-left.webp", None, 1920),
}

# name: (source photo name above, dot cell size in px)
HALFTONES = {
    "shavings-planer-halftone": ("shavings-planer", 7),
}


def load_crop(file, box, max_w):
    im = Image.open(SRC / file).convert("RGB")
    if box:
        im = im.crop(box)
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    return im


def mono_grain(im, seed, grain=11.0):
    """Black-and-white conversion with a print-like tone curve and film grain."""
    g = ImageOps.grayscale(im)
    g = ImageOps.autocontrast(g, cutoff=0.6)
    a = np.asarray(g).astype(np.float32) / 255.0
    # gentle S-curve: deeper blacks, keep highlight detail
    a = a ** 1.08
    a = a * a * (3 - 2 * a) * 0.35 + a * 0.65
    rng = np.random.default_rng(seed)
    noise = rng.normal(0.0, grain / 255.0, a.shape).astype(np.float32)
    # grain is slightly clumped like silver halide, not per-pixel digital noise
    noise_img = Image.fromarray(((noise * 4 + 0.5).clip(0, 1) * 255).astype(np.uint8))
    noise_img = noise_img.filter(ImageFilter.GaussianBlur(0.6))
    noise = (np.asarray(noise_img).astype(np.float32) / 255.0 - 0.5) / 4 * 1.8
    a = (a + noise).clip(0, 1)
    return Image.fromarray((a * 255).astype(np.uint8), "L")


def halftone(gray, cell):
    """Classic 45-degree round-dot halftone, ink dots on paper."""
    scale = 3  # draw large, then reduce for smooth dots
    w, h = gray.size
    big = gray.resize((w * scale, h * scale), Image.LANCZOS)
    rotated = big.rotate(45, expand=True, fillcolor=255)
    rw, rh = rotated.size
    c = cell * scale
    small = rotated.resize((max(1, rw // c), max(1, rh // c)), Image.BOX)
    arr = np.asarray(small).astype(np.float32) / 255.0
    canvas = Image.new("L", (rw, rh), 255)
    draw = ImageDraw.Draw(canvas)
    max_r = c * 0.72
    for y in range(arr.shape[0]):
        for x in range(arr.shape[1]):
            darkness = 1.0 - arr[y, x]
            r = max_r * np.sqrt(darkness)
            if r < 0.6:
                continue
            cx, cy = x * c + c / 2, y * c + c / 2
            draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=0)
    back = canvas.rotate(-45, expand=True, fillcolor=255)
    bw, bh = back.size
    left, top = (bw - w * scale) // 2, (bh - h * scale) // 2
    back = back.crop((left, top, left + w * scale, top + h * scale))
    back = back.resize((w, h), Image.LANCZOS)
    # map white -> paper, black -> ink
    a = np.asarray(back).astype(np.float32)[..., None] / 255.0
    rgb = np.array(INK, np.float32) + (np.array(PAPER, np.float32) - np.array(INK, np.float32)) * a
    return Image.fromarray(rgb.clip(0, 255).astype(np.uint8), "RGB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    mono = {}
    for i, (name, (file, box, max_w)) in enumerate(PHOTOS.items()):
        im = load_crop(file, box, max_w)
        g = mono_grain(im, seed=100 + i)
        mono[name] = g
        g.save(OUT / f"{name}.jpg", quality=86, optimize=True, progressive=True)
        print(f"{name}.jpg  {g.size[0]}x{g.size[1]}")
    for name, (src, cell) in HALFTONES.items():
        ht = halftone(ImageOps.autocontrast(mono[src], cutoff=1), cell)
        ht.save(OUT / f"{name}.png", optimize=True)
        print(f"{name}.png  {ht.size[0]}x{ht.size[1]}")


if __name__ == "__main__":
    main()
