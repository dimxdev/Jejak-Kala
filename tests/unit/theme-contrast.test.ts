// Keeps the text colours of every theme readable: WCAG AA asks for a contrast ratio of at least 4.5
// for normal text. A colour that is too light is caught here instead of by a player squinting.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  fileURLToPath(new URL('../../src/styles/themes.css', import.meta.url)),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

/** `--name: #rrggbb` declarations of each block, keyed by selector. */
function parseThemes(source: string): Map<string, Record<string, string>> {
  const blocks = new Map<string, Record<string, string>>();
  for (const [, selector, body] of source.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const tokens: Record<string, string> = {};
    for (const [, name, value] of (body ?? '').matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) {
      if (name && value) tokens[name] = value;
    }
    blocks.set((selector ?? '').trim(), tokens);
  }
  return blocks;
}

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

const themes = parseThemes(css);
const root = themes.get(':root') ?? {};

/** [text colour, background colour] pairs the app really draws. */
const PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['fg', 'canvas'],
  ['fg', 'panel'],
  ['fg', 'panel-2'],
  ['muted', 'canvas'],
  ['muted', 'panel'],
  ['muted', 'panel-2'],
  ['accent', 'panel'],
  ['accent', 'canvas'],
  ['on-accent', 'accent'],
  ['good', 'panel'],
  ['good', 'good-soft'],
  ['bad', 'panel'],
  ['bad', 'bad-soft'],
];

describe('theme contrast', () => {
  it('finds the base tokens', () => {
    expect(Object.keys(root).length).toBeGreaterThan(10);
  });

  const variants: Array<[string, Record<string, string>]> = [
    ['dasar (:root)', root],
    ...[...themes.entries()]
      .filter(([selector]) => selector.startsWith('[data-theme'))
      .map(([selector, overrides]): [string, Record<string, string>] => [
        selector,
        { ...root, ...overrides },
      ]),
  ];

  for (const [label, tokens] of variants) {
    it(`keeps every text colour at 4.5:1 or better: ${label}`, () => {
      const failures: string[] = [];
      for (const [text, background] of PAIRS) {
        const fg = tokens[text];
        const bg = tokens[background];
        if (!fg || !bg) {
          failures.push(`${text}/${background}: token tidak ada`);
          continue;
        }
        const ratio = contrast(fg, bg);
        if (ratio < 4.5)
          failures.push(`${text} ${fg} di atas ${background} ${bg}: ${ratio.toFixed(2)}`);
      }
      expect(failures).toEqual([]);
    });
  }

  it('knows the contrast of black on white', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });
});
