import { describe, expect, it } from 'vitest';
import { type Manifest, ManifestSchema, manifestProblems } from './manifest.ts';
import { loadStyle } from './style.ts';

const style = loadStyle();
const manifest = (assets: object[]): Manifest => ManifestSchema.parse({ chapter: 'mesir', assets });
const asset = (extra: object = {}) => ({
  id: 'banner',
  kind: 'banner',
  subject: 'Scene: x.',
  ...extra,
});

describe('manifest', () => {
  it('fills in defaults', () => {
    const [a] = manifest([asset()]).assets;
    expect(a?.status).toBe('todo');
    expect(a?.followUp).toBe(false);
  });

  it('rejects ids that are not kebab-case and empty subjects', () => {
    expect(() => manifest([asset({ id: 'Banner Mesir' })])).toThrow();
    expect(() => manifest([asset({ subject: '  ' })])).toThrow();
  });

  it('reports duplicate ids', () => {
    expect(manifestProblems(manifest([asset(), asset()]), style)).toEqual(['id kembar: banner']);
  });

  it('reports a kind that style.yaml does not define', () => {
    expect(manifestProblems(manifest([asset({ kind: 'poster' })]), style)[0]).toMatch(
      /jenis tidak dikenal/,
    );
  });

  it('requires a raw file once an asset is no longer todo', () => {
    expect(manifestProblems(manifest([asset({ status: 'generated' })]), style)[0]).toMatch(
      /"file" kosong/,
    );
    expect(
      manifestProblems(
        manifest([asset({ status: 'generated', file: 'chapters/mesir/raw/banner.jpeg' })]),
        style,
      ),
    ).toEqual([]);
  });
});
