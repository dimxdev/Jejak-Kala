// Prints the exact Gemini prompt (and the aspect ratio to select) for an asset.
//   bun run assets:prompt mesir               list the assets that are still todo
//   bun run assets:prompt mesir m1-bg-peret   the full prompt for one asset
//   bun run assets:prompt mesir --todo        the full prompt of every todo asset

import { loadManifest, manifestProblems } from './manifest.ts';
import { composePrompt, loadStyle } from './style.ts';

const args = process.argv.slice(2);
const chapter = args.find((a) => !a.startsWith('--'));
const id = args.filter((a) => !a.startsWith('--'))[1];
if (!chapter) {
  console.error('pakai: bun run assets:prompt <bab> [id | --todo]');
  process.exit(1);
}

const style = loadStyle();
const manifest = loadManifest(chapter);
const problems = manifestProblems(manifest, style);
if (problems.length > 0) {
  for (const p of problems) console.error(`GALAT ${p}`);
  process.exit(1);
}

const show = (asset: (typeof manifest.assets)[number]) => {
  const { aspect, prompt } = composePrompt(style, asset);
  const used = asset.aspect ?? aspect;
  console.log(
    `\n# ${asset.id}  [${asset.kind}, ${used}${asset.followUp ? ', lanjutan dalam chat yang sama' : ''}]${asset.chat ? `  chat: ${asset.chat}` : ''}`,
  );
  console.log(prompt);
};

if (id) {
  const asset = manifest.assets.find((a) => a.id === id);
  if (!asset) {
    console.error(`aset "${id}" tidak ada di manifest ${chapter}`);
    process.exit(1);
  }
  show(asset);
} else if (args.includes('--todo')) {
  for (const asset of manifest.assets.filter((a) => a.status === 'todo')) show(asset);
} else {
  const todo = manifest.assets.filter((a) => a.status === 'todo');
  console.log(`${manifest.assets.length} aset di manifest ${chapter}, ${todo.length} masih todo:`);
  for (const a of todo)
    console.log(
      `  ${a.id.padEnd(24)} ${a.kind.padEnd(12)} ${a.aspect ?? composePrompt(style, a).aspect}${a.followUp ? '  (lanjutan)' : ''}`,
    );
}
