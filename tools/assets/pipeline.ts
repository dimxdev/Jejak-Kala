// Turns a raw Gemini image into a shipped WebP.
//  - "fit" kinds are scaled down to fit inside a box.
//  - sprites were drawn on a flat magenta background: the magenta is removed, the figure is trimmed
//    and scaled to fit a fixed height (and, for wide sprites, a width).

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import sharp from 'sharp';

export interface Processed {
  width: number;
  height: number;
  bytes: number;
}

/** Distance from magenta (0 at #FF00FF) where a pixel is fully transparent / fully opaque. */
const KEY_NEAR = 70;
const KEY_FAR = 140;

/**
 * Removes the flat magenta background in place (RGBA pixels). Semi-transparent edge pixels also lose
 * their pink tint ("spill") so the figure has no halo on any background.
 */
export function keyMagenta(pixels: Uint8ClampedArray): void {
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] ?? 0;
    const g = pixels[i + 1] ?? 0;
    const b = pixels[i + 2] ?? 0;
    const a = pixels[i + 3] ?? 255;
    const distance = Math.hypot(255 - r, g, 255 - b);
    const alpha = Math.min(1, Math.max(0, (distance - KEY_NEAR) / (KEY_FAR - KEY_NEAR)));
    if (alpha < 0.999) {
      const spill = Math.max(0, Math.min(r, b) - g);
      pixels[i] = r - spill;
      pixels[i + 2] = b - spill;
    }
    pixels[i + 3] = Math.round(alpha * a);
  }
}

/** Bounding box of the pixels that are clearly visible. */
export function visibleBox(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  threshold = 24,
): { left: number; top: number; width: number; height: number } | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((pixels[(y * width + x) * 4 + 3] ?? 0) > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * Fades the outer edge of the image to transparent, in place (RGBA pixels). `fraction` is the width of
 * the fade as a share of the shorter side. Portraits and illustrations are drawn on a cream background:
 * with soft edges they sit on any paper-coloured page without a visible rectangle.
 */
export function fadeEdges(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  fraction: number,
): void {
  const reach = Math.max(1, fraction * Math.min(width, height));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const edge = Math.min(x, width - 1 - x, y, height - 1 - y);
      const t = Math.min(1, edge / reach);
      const i = (y * width + x) * 4 + 3;
      pixels[i] = Math.round((pixels[i] ?? 255) * t * t * (3 - 2 * t));
    }
  }
}

const ensureDir = (file: string) => mkdirSync(dirname(file), { recursive: true });

export async function processFit(
  src: string,
  out: string,
  {
    width,
    height,
    quality,
    fade = 0,
  }: { width: number; height: number; quality: number; fade?: number },
): Promise<Processed> {
  ensureDir(out);
  const resized = sharp(src)
    .rotate()
    .resize({ width, height, fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' });

  if (fade <= 0) {
    const info = await resized.webp({ quality, effort: 5 }).toFile(out);
    return { width: info.width, height: info.height, bytes: info.size };
  }

  const { data, info } = await resized.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
  fadeEdges(pixels, info.width, info.height, fade);
  const result = await sharp(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.length), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .webp({ quality, alphaQuality: 90, effort: 5 })
    .toFile(out);
  return { width: result.width, height: result.height, bytes: result.size };
}

export async function processSprite(
  src: string,
  out: string,
  { height, width, quality }: { height: number; width?: number; quality: number },
): Promise<Processed> {
  ensureDir(out);
  const { data, info } = await sharp(src)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
  keyMagenta(pixels);
  const box = visibleBox(pixels, info.width, info.height);
  if (!box) throw new Error(`${src}: tidak ada gambar yang tersisa setelah latar magenta dihapus`);

  const result = await sharp(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.length), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract(box)
    .resize({ width, height, fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' })
    .webp({ quality, alphaQuality: 100, effort: 5 })
    .toFile(out);
  return { width: result.width, height: result.height, bytes: result.size };
}
