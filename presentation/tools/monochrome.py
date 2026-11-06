"""
RESET Design Presentation - monochrome conversion for any photo

Applies the deck's black-and-white treatment (tone curve + film grain, the same
mono_grain() used for the slide images) to whole photos, at full resolution.
Before that it lifts local contrast (a wide unsharp mask, like dodging and
burning in the darkroom), so low-contrast subjects such as the layers in a bag
of wood dust keep their structure in black and white.

Usage (from the repository root):
    python3 presentation/tools/monochrome.py [--no-local] OUT_DIR PHOTO [PHOTO ...]

Example:
    python3 presentation/tools/monochrome.py assets/monochrome assets/material-*.jpg

Requires: Pillow, numpy
"""

import sys
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parent))
from process_images import mono_grain  # noqa: E402


def main(argv):
    local = "--no-local" not in argv
    argv = [a for a in argv if a != "--no-local"]
    if len(argv) < 3:
        print(__doc__)
        return 1
    out = Path(argv[1])
    out.mkdir(parents=True, exist_ok=True)
    for i, src in enumerate(argv[2:]):
        src = Path(src)
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        if local:
            radius = max(im.size) / 40  # "local" = about 1/40 of the long side
            im = ImageOps.grayscale(im).filter(ImageFilter.UnsharpMask(radius=radius, percent=90, threshold=0)).convert("RGB")
        # grain is tuned for ~2000 px wide images; keep its apparent size on larger photos
        grain = 11.0 * max(1.0, im.width / 2000) ** 0.5
        g = mono_grain(im, seed=500 + i, grain=grain)
        dst = out / (src.stem + ".jpg")
        g.save(dst, quality=90, optimize=True, progressive=True)
        print(f"{dst}  {g.width}x{g.height}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
