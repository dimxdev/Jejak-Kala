import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { assetsSrcDir } from './paths.ts';
import { composePrompt, loadStyle, styleCore } from './style.ts';

const style = loadStyle();
const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

describe('locked style', () => {
  it('still equals the style block that was used for the approved style-test images', () => {
    const test = parse(readFileSync(join(assetsSrcDir, 'style-test', 'prompts.yaml'), 'utf8'));
    // style test portraits and sprites had no "soft gradients only in the sky" clause
    expect(styleCore(style, false)).toBe(squash(test.styles['a-flat'].core));
  });

  it('defines a palette for Mesir with valid hex colours', () => {
    expect(style.palettes.mesir?.ochre).toBe('#df9f5a');
  });
});

describe('composePrompt', () => {
  it('builds a landscape prompt: style with sky clause + negative + subject + extra', () => {
    const { aspect, prompt } = composePrompt(style, {
      kind: 'background',
      subject: 'Scene: a field.',
    });
    expect(aspect).toBe('16:9');
    expect(prompt).toContain('soft gradients only in the sky,');
    expect(prompt).toContain('No text, no letters, no watermark, no people. Scene: a field.');
    expect(prompt.endsWith('can sit on top of it.')).toBe(true);
    expect(prompt).not.toContain('{landscape}');
  });

  it('leaves the sky clause out for characters', () => {
    const { aspect, prompt } = composePrompt(style, {
      kind: 'portrait',
      subject: 'Subject: Meryt.',
    });
    expect(aspect).toBe('3:4');
    expect(prompt).not.toContain('soft gradients');
    expect(prompt).toContain('No text, no letters, no watermark. Subject: Meryt.');
    expect(prompt).not.toContain('no people');
  });

  it('adds the magenta background to sprites', () => {
    const { prompt } = composePrompt(style, { kind: 'sprite', subject: 'Subject: a walking man.' });
    expect(prompt).toContain('pure magenta (#FF00FF)');
  });

  it('uses a follow-up exactly as written, without the style block', () => {
    const { prompt } = composePrompt(style, {
      kind: 'portrait',
      subject: '  Same character Meryt,   now smiling. ',
      followUp: true,
    });
    expect(prompt).toBe('Same character Meryt, now smiling.');
  });

  it('rejects an unknown kind', () => {
    expect(() => composePrompt(style, { kind: 'poster', subject: 'x' })).toThrow(/tidak dikenal/);
  });
});
