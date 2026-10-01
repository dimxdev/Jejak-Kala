"""Builds a labelled contact sheet from a folder of images, for comparing art styles side by side.

Usage:  python tools/assets/contact-sheet.py <folder> <output.png> [--height 420] [--cols 4]
Images are shown in file-name order, scaled to the same height.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        raise SystemExit(__doc__)
    folder, out = Path(args[0]), Path(args[1])
    height = int(args[args.index("--height") + 1]) if "--height" in args else 420
    cols = int(args[args.index("--cols") + 1]) if "--cols" in args else 4

    files = sorted(p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXTS)
    if not files:
        raise SystemExit(f"no images in {folder}")

    font = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 18)
    pad, label_h = 16, 30
    thumbs = []
    for p in files:
        im = Image.open(p).convert("RGB")
        w = max(1, round(im.width * height / im.height))
        thumbs.append((p.stem, im.resize((w, height), Image.LANCZOS)))

    # lay out in rows of `cols`
    rows = [thumbs[i : i + cols] for i in range(0, len(thumbs), cols)]
    sheet_w = max(sum(t.width for _, t in row) + pad * (len(row) + 1) for row in rows)
    sheet_h = len(rows) * (height + label_h + pad) + pad
    sheet = Image.new("RGB", (sheet_w, sheet_h), (36, 36, 44))
    draw = ImageDraw.Draw(sheet)
    y = pad
    for row in rows:
        x = pad
        for name, thumb in row:
            sheet.paste(thumb, (x, y + label_h))
            draw.text((x, y + 4), name, font=font, fill=(255, 227, 154))
            x += thumb.width + pad
        y += height + label_h + pad
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(f"{out} ({sheet.width}x{sheet.height}, {len(files)} images)")


if __name__ == "__main__":
    main()
