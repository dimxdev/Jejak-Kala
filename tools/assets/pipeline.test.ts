import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, describe, expect, it } from 'vitest';
import { fadeEdges, keyMagenta, processFit, processSprite, visibleBox } from './pipeline.ts';

sharp.cache(false); // on Windows sharp's file cache keeps files open and blocks cleanup
const dir = mkdtempSync(join(tmpdir(), 'pipeline-test-'));
afterAll(() => {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // a temp folder that cannot be removed right now is harmless
  }
});

const px = (r: number, g: number, b: number, a = 255) => new Uint8ClampedArray([r, g, b, a]);

describe('keyMagenta', () => {
  it('makes pure magenta fully transparent', () => {
    const p = px(255, 0, 255);
    keyMagenta(p);
    expect(p[3]).toBe(0);
  });

  it('keeps ordinary colours opaque and unchanged', () => {
    const p = px(137, 89, 51);
    keyMagenta(p);
    expect([...p]).toEqual([137, 89, 51, 255]);
  });

  it('makes an edge pixel semi-transparent and removes its pink tint', () => {
    const p = px(255, 120, 255);
    keyMagenta(p);
    expect(p[3]).toBeGreaterThan(0);
    expect(p[3]).toBeLessThan(255);
    expect(p[0]).toBeLessThan(255); // spill removed from red
    expect(p[2]).toBeLessThan(255); // and from blue
  });

  it('keeps the original alpha of a pixel that was already transparent', () => {
    const p = px(137, 89, 51, 0);
    keyMagenta(p);
    expect(p[3]).toBe(0);
  });
});

describe('visibleBox', () => {
  it('finds the area that is not transparent', () => {
    const w = 6;
    const h = 5;
    const data = new Uint8ClampedArray(w * h * 4);
    for (const [x, y] of [
      [2, 1],
      [3, 3],
    ] as const)
      data[(y * w + x) * 4 + 3] = 255;
    expect(visibleBox(data, w, h)).toEqual({ left: 2, top: 1, width: 2, height: 3 });
  });

  it('returns null for an empty image', () => {
    expect(visibleBox(new Uint8ClampedArray(4 * 4 * 4), 4, 4)).toBeNull();
  });
});

describe('fadeEdges', () => {
  const opaque = (w: number, h: number) => new Uint8ClampedArray(w * h * 4).fill(255);
  const alphaAt = (p: Uint8ClampedArray, w: number, x: number, y: number) => p[(y * w + x) * 4 + 3];

  it('makes the outermost pixels transparent and leaves the middle opaque', () => {
    const w = 100;
    const h = 100;
    const p = opaque(w, h);
    fadeEdges(p, w, h, 0.1);
    expect(alphaAt(p, w, 0, 50)).toBe(0);
    expect(alphaAt(p, w, 50, 0)).toBe(0);
    expect(alphaAt(p, w, 99, 99)).toBe(0);
    expect(alphaAt(p, w, 50, 50)).toBe(255);
  });

  it('rises smoothly towards the middle', () => {
    const w = 100;
    const h = 100;
    const p = opaque(w, h);
    fadeEdges(p, w, h, 0.2);
    const ramp = [0, 2, 5, 10, 15, 20].map((x) => alphaAt(p, w, x, 50) ?? 0);
    expect([...ramp].sort((a, b) => a - b)).toEqual(ramp);
    expect(ramp[2]).toBeGreaterThan(0);
    expect(ramp[2]).toBeLessThan(255);
  });

  it('keeps pixels that were already transparent transparent', () => {
    const w = 20;
    const h = 20;
    const p = new Uint8ClampedArray(w * h * 4); // all transparent
    fadeEdges(p, w, h, 0.1);
    expect(alphaAt(p, w, 10, 10)).toBe(0);
  });
});

describe('processing files', () => {
  it('scales a wide image down to fit the box and writes a WebP', async () => {
    const src = join(dir, 'wide.png');
    await sharp({ create: { width: 3200, height: 1800, channels: 3, background: '#c08d69' } })
      .png()
      .toFile(src);
    const out = join(dir, 'wide.webp');
    const done = await processFit(src, out, { width: 1600, height: 900, quality: 80 });
    expect(done.width).toBe(1600);
    expect(done.height).toBe(900);
    expect((await sharp(out).metadata()).format).toBe('webp');
  });

  it('writes a WebP with soft transparent edges when a fade is requested', async () => {
    const src = join(dir, 'paper.png');
    await sharp({ create: { width: 400, height: 500, channels: 3, background: '#fff6e6' } })
      .png()
      .toFile(src);
    const out = join(dir, 'paper.webp');
    const done = await processFit(src, out, { width: 200, height: 250, quality: 80, fade: 0.1 });
    expect(done.width).toBe(200);
    const raw = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect(raw.info.channels).toBe(4);
    expect(raw.data[3]).toBeLessThan(40); // top-left corner is transparent
    const middle = (125 * 200 + 100) * 4 + 3;
    expect(raw.data[middle]).toBeGreaterThan(240); // the middle is opaque
  });

  it('never enlarges a small image', async () => {
    const src = join(dir, 'small.png');
    await sharp({ create: { width: 200, height: 100, channels: 3, background: '#df9f5a' } })
      .png()
      .toFile(src);
    const done = await processFit(src, join(dir, 'small.webp'), {
      width: 1600,
      height: 900,
      quality: 80,
    });
    expect(done.width).toBe(200);
  });

  it('cuts a figure out of a magenta background, trims it and scales it to the requested height', async () => {
    const src = join(dir, 'sprite.png');
    const figure = await sharp({
      create: { width: 100, height: 300, channels: 3, background: '#895933' },
    })
      .png()
      .toBuffer();
    await sharp({ create: { width: 400, height: 600, channels: 3, background: '#ff00ff' } })
      .composite([{ input: figure, left: 150, top: 120 }])
      .png()
      .toFile(src);

    const out = join(dir, 'sprite.webp');
    const done = await processSprite(src, out, { height: 150, quality: 85 });
    expect(done.height).toBe(150);
    expect(done.width).toBe(50); // 100 x 300 scaled to 150 high

    const raw = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect(raw.data[3]).toBeGreaterThan(200); // the figure fills the trimmed image
    expect(raw.info.channels).toBe(4);
  });

  it('keeps a wide sprite inside the width as well as the height', async () => {
    const src = join(dir, 'wide.png');
    const rod = await sharp({
      create: { width: 600, height: 60, channels: 3, background: '#e2a93b' },
    })
      .png()
      .toBuffer();
    await sharp({ create: { width: 800, height: 400, channels: 3, background: '#ff00ff' } })
      .composite([{ input: rod, left: 100, top: 170 }])
      .png()
      .toFile(src);

    const done = await processSprite(src, join(dir, 'wide.webp'), {
      height: 512,
      width: 300,
      quality: 85,
    });
    expect(done.width).toBe(300);
    expect(done.height).toBe(30);
  });

  it('fails clearly when nothing is left after removing the background', async () => {
    const src = join(dir, 'empty.png');
    await sharp({ create: { width: 50, height: 50, channels: 3, background: '#ff00ff' } })
      .png()
      .toFile(src);
    await expect(
      processSprite(src, join(dir, 'empty.webp'), { height: 20, quality: 80 }),
    ).rejects.toThrow(/magenta/);
  });
});
