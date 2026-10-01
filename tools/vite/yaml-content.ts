import type { Plugin } from 'vite';
import { parse } from 'yaml';

/**
 * Lets the app `import chapter from '@content/chapters/mesir/chapter.yaml'`.
 * The YAML is parsed at build time, so no YAML parser ships to the player.
 * Validation against the Zod schemas happens in `bun run content:check`
 * and once more when the app loads a chapter.
 */
export function yamlContent(): Plugin {
  return {
    name: 'content-yaml',
    transform(source, id) {
      const file = id.split('?')[0] ?? id;
      if (!file.endsWith('.yaml') && !file.endsWith('.yml')) return null;
      return { code: `export default ${JSON.stringify(parse(source))};`, map: null };
    },
  };
}
