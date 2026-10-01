"""Compares the art-style test images side by side and measures what matters for a mobile game.

Usage:  python tools/assets/style-test-report.py

Reads   assets-src/style-test/<style>/raw/<subject>.jpeg      (large originals, not committed)
Writes  docs/art/style-test/<style>/<subject>.webp            (small review copies, committed)
        docs/art/style-test/comparison.png                    (all styles in one sheet)
Prints  WebP size per image (what a phone would download) and how clean the magenta sprite
        background is to remove.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets-src" / "style-test"
OUT = ROOT / "docs" / "art" / "style-test"

STYLES = [
    ("a-flat", "A  Datar (buku cerita)"),
    ("b-gouache", "B  Gouache"),
    ("c-papercut", "C  Diorama kertas"),
]
SUBJECTS = [
    ("banner", "banner bab"),
    ("mission-bg", "latar misi"),
    ("portrait-neutral", "potret netral"),
    ("portrait-worried", "potret cemas"),
    ("artifact-icon", "ikon artefak"),
    ("walk-pose", "sprite jalan (dikey)"),
    ("jump-pose", "sprite lompat (dikey)"),
]
SPRITES = {"walk-pose", "jump-pose"}
REVIEW_MAX = 1280  # longest side of the review copies
WEBP_QUALITY = 80
CELL_H = 300


def key_magenta(img):
    """Remove the flat magenta background; returns RGBA and the share of soft (semi-transparent) pixels."""
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    dist = np.sqrt((255 - r) ** 2 + g**2 + (255 - b) ** 2)
    alpha = np.clip((dist - 70.0) / 70.0, 0.0, 1.0)
    spill = np.maximum(0.0, np.minimum(r, b) - g)
    edge = alpha < 0.999
    r, b = np.where(edge, r - spill, r), np.where(edge, b - spill, b)
    out = np.stack([r, g, b, alpha * 255.0], axis=-1)
    rgba = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")
    soft = float(((alpha > 0.02) & (alpha < 0.98)).sum()) / max(1.0, float((alpha > 0.02).sum()))
    return rgba, soft


def corner_noise(img):
    """How much the 'flat' background varies: standard deviation of the border pixels (0 = perfectly flat)."""
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    border = np.concatenate([a[:20].reshape(-1, 3), a[-20:].reshape(-1, 3), a[:, :20].reshape(-1, 3), a[:, -20:].reshape(-1, 3)])
    return float(border.std(axis=0).mean())


def on_gray(rgba):
    bg = Image.new("RGBA", rgba.size, (92, 96, 108, 255))
    bg.alpha_composite(rgba)
    return bg.convert("RGB")


def main():
    font = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 17)
    bold = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 19)
    sizes = {}
    cells = {}
    quality = {}

    for style, _label in STYLES:
        (OUT / style).mkdir(parents=True, exist_ok=True)
        for subject, _ in SUBJECTS:
            src = next(iter((SRC / style / "raw").glob(f"{subject}.*")), None)
            if src is None:
                continue
            img = Image.open(src).convert("RGB")
            review = img.copy()
            review.thumbnail((REVIEW_MAX, REVIEW_MAX), Image.LANCZOS)
            dest = OUT / style / f"{subject}.webp"
            review.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)
            sizes[(style, subject)] = dest.stat().st_size / 1024

            shown = img
            if subject in SPRITES:
                rgba, soft = key_magenta(img)
                box = rgba.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
                quality[(style, subject)] = (corner_noise(img), soft)
                shown = on_gray(rgba.crop(box)) if box else img
            w = max(1, round(shown.width * CELL_H / shown.height))
            cells[(style, subject)] = shown.resize((w, CELL_H), Image.LANCZOS)

    # sheet
    pad, label_w, head_h = 14, 150, 34
    col_w = {s: max((cells[(st, s)].width for st, _ in STYLES if (st, s) in cells), default=0) for s, _ in SUBJECTS}
    width = label_w + sum(col_w.values()) + pad * (len(SUBJECTS) + 1)
    height = head_h + len(STYLES) * (CELL_H + pad) + pad
    sheet = Image.new("RGB", (width, height), (36, 36, 44))
    draw = ImageDraw.Draw(sheet)
    x = label_w + pad
    for subject, title in SUBJECTS:
        draw.text((x, 8), title, font=font, fill=(200, 200, 215))
        x += col_w[subject] + pad
    for row, (style, label) in enumerate(STYLES):
        y = head_h + row * (CELL_H + pad)
        draw.text((pad, y + CELL_H // 2 - 12), label, font=bold, fill=(255, 227, 154))
        x = label_w + pad
        for subject, _ in SUBJECTS:
            cell = cells.get((style, subject))
            if cell:
                sheet.paste(cell, (x + (col_w[subject] - cell.width) // 2, y))
            x += col_w[subject] + pad
    sheet.save(OUT / "comparison.png")
    print(f"comparison sheet -> {OUT / 'comparison.png'} ({width}x{height})\n")

    # numbers
    print(f"WebP q{WEBP_QUALITY}, longest side {REVIEW_MAX}px (KB):")
    print(f"{'':22}" + "".join(f"{label.split()[0]:>10}" for _, label in STYLES))
    for subject, _ in SUBJECTS:
        print(f"{subject:22}" + "".join(f"{sizes.get((st, subject), 0):>10.0f}" for st, _ in STYLES))
    print(f"{'average':22}" + "".join(
        f"{np.mean([sizes[(st, s)] for s, _ in SUBJECTS if (st, s) in sizes]):>10.0f}" for st, _ in STYLES))

    print("\nSprite background (lower is easier to remove):")
    print(f"{'':22}{'style':<14}{'bg noise':>10}{'soft-edge %':>14}")
    for st, label in STYLES:
        for subject in sorted(SPRITES):
            if (st, subject) in quality:
                noise, soft = quality[(st, subject)]
                print(f"{subject:22}{label.split()[0]:<14}{noise:>10.1f}{soft * 100:>13.1f}%")


if __name__ == "__main__":
    main()
