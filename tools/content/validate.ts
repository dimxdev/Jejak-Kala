// Validates everything under content/ and prints a short report.
//   bun run content:check
// Also imported by tests/unit/content.test.ts so CI covers it.
//
// Each file is checked against its Zod schema (src/core/...), then the files are checked against each
// other: mission files belong to a mission of their chapter, every speaker and picture exists, every
// Kodeks entry a mission unlocks is written, ids are unique.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { CodexFile } from '../../src/core/codex/schema';
import {
  ContentError,
  parseChapter,
  parseCharacters,
  parseCodex,
  parseMission,
} from '../../src/core/content/parse';
import type { Chapter } from '../../src/core/content/schema';
import { engineAssets, type MissionContent } from '../../src/core/missions/schema';
import {
  type CharactersFile,
  type DialogueLine,
  type Scene,
  SPECIAL_SPEAKERS,
} from '../../src/core/story/schema';
import { formatYearRange } from '../../src/core/years';

export interface ContentReport {
  chapters: Chapter[];
  /** Kodeks of each chapter, by chapter id */
  codex: Record<string, CodexFile>;
  missions: MissionContent[];
  characters: CharactersFile | null;
  errors: string[];
  /** dates and facts still marked `verify: true` */
  unverified: string[];
}

const rootDir = fileURLToPath(new URL('../../', import.meta.url));

/** Reads and parses one YAML file, turning any failure into a line in the report. */
function load<T>(
  report: ContentReport,
  file: string,
  parser: (raw: unknown, source: string) => T,
): T | null {
  const label = relative(rootDir, file).replaceAll('\\', '/');
  try {
    return parser(parse(readFileSync(file, 'utf8')), label);
  } catch (error) {
    report.errors.push(
      error instanceof ContentError ? error.message : `${label}: ${String(error)}`,
    );
    return null;
  }
}

export function validateAllContent(
  contentDir = join(rootDir, 'content'),
  publicDir = join(rootDir, 'public'),
): ContentReport {
  const report: ContentReport = {
    chapters: [],
    codex: {},
    missions: [],
    characters: null,
    errors: [],
    unverified: [],
  };
  const chaptersDir = join(contentDir, 'chapters');
  if (!existsSync(chaptersDir)) {
    report.errors.push(`folder tidak ditemukan: ${relative(rootDir, chaptersDir)}`);
    return report;
  }

  const charactersFile = join(contentDir, 'characters.yaml');
  if (existsSync(charactersFile)) report.characters = load(report, charactersFile, parseCharacters);

  for (const entry of readdirSync(chaptersDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(chaptersDir, entry.name);
    const file = join(dir, 'chapter.yaml');
    if (!existsSync(file)) {
      report.errors.push(`${relative(rootDir, file).replaceAll('\\', '/')}: berkas tidak ada`);
      continue;
    }
    const chapter = load(report, file, parseChapter);
    if (!chapter) continue;
    if (chapter.id !== entry.name) {
      report.errors.push(
        `content/chapters/${entry.name}/chapter.yaml\n  - id "${chapter.id}" harus sama dengan nama folder "${entry.name}"`,
      );
      continue;
    }
    report.chapters.push(chapter);

    const codexFile = join(dir, 'codex.yaml');
    if (existsSync(codexFile)) {
      const codex = load(report, codexFile, parseCodex);
      if (codex) report.codex[chapter.id] = codex;
    }

    const missionsDir = join(dir, 'missions');
    if (existsSync(missionsDir)) {
      for (const missionFile of readdirSync(missionsDir).filter((name) => name.endsWith('.yaml'))) {
        const mission = load(report, join(missionsDir, missionFile), parseMission);
        if (!mission) continue;
        if (`${mission.id}.yaml` !== missionFile) {
          report.errors.push(
            `content/chapters/${chapter.id}/missions/${missionFile}\n  - id "${mission.id}" harus sama dengan nama berkas`,
          );
          continue;
        }
        report.missions.push(mission);
      }
    }
  }

  checkAcrossChapters(report);
  for (const chapter of report.chapters) {
    if (chapter.banner && !assetExists(publicDir, chapter.banner)) {
      report.errors.push(
        `bab ${chapter.id}: banner "${chapter.banner}" tidak ada di public/assets`,
      );
    }
  }
  checkMissions(report, publicDir);
  checkCodex(report, publicDir);
  collectUnverified(report);
  return report;
}

function checkAcrossChapters(report: ContentReport): void {
  const chapterIds = new Set(report.chapters.map((c) => c.id));
  const missionOwner = new Map<string, string>();

  for (const chapter of report.chapters) {
    for (const required of chapter.requires) {
      if (!chapterIds.has(required)) {
        report.errors.push(`${chapter.id}: requires bab "${required}" yang tidak ada`);
      }
    }
    for (const mission of [...chapter.missions, chapter.exam]) {
      const owner = missionOwner.get(mission.id);
      if (owner) {
        report.errors.push(`id misi "${mission.id}" dipakai di "${owner}" dan "${chapter.id}"`);
      }
      missionOwner.set(mission.id, chapter.id);
    }
  }

  // a chapter must be reachable: no cycles in `requires`
  const byId = new Map(report.chapters.map((c) => [c.id, c]));
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (id: string, path: string[]): void => {
    if (done.has(id)) return;
    if (visiting.has(id)) {
      report.errors.push(`siklus pada requires: ${[...path, id].join(' -> ')}`);
      return;
    }
    visiting.add(id);
    for (const required of byId.get(id)?.requires ?? []) visit(required, [...path, id]);
    visiting.delete(id);
    done.add(id);
  };
  for (const id of byId.keys()) visit(id, []);
}

const assetExists = (publicDir: string, ref: string) =>
  existsSync(join(publicDir, 'assets', `${ref}.webp`));

function scenesOf(mission: MissionContent): [string, Scene][] {
  return [
    ['intro', mission.intro],
    ['outro.one', mission.outro.one],
    ['outro.two', mission.outro.two],
    ['outro.three', mission.outro.three],
    ...Object.entries(mission.scenes).map(([name, scene]): [string, Scene] => [
      `scenes.${name}`,
      scene,
    ]),
  ];
}

function checkMissions(report: ContentReport, publicDir: string): void {
  const characters = report.characters?.characters ?? {};
  const special = new Set<string>(SPECIAL_SPEAKERS);

  for (const mission of report.missions) {
    const chapter = report.chapters.find((c) =>
      [...c.missions, c.exam].some((m) => m.id === mission.id),
    );
    const where = `misi ${mission.id}`;
    if (!chapter) {
      report.errors.push(`${where}: tidak ada misi dengan id ini di chapter.yaml mana pun`);
      continue;
    }

    const entries = new Set(report.codex[chapter.id]?.entries.map((e) => e.id));
    for (const id of [...mission.codex, ...mission.bonusCodex]) {
      if (!entries.has(id)) {
        report.errors.push(`${where}: entri Kodeks "${id}" tidak ada di ${chapter.id}/codex.yaml`);
      }
    }

    for (const ref of engineAssets(mission)) {
      if (!assetExists(publicDir, ref)) {
        report.errors.push(`${where}: gambar "${ref}" (params.art) tidak ada di public/assets`);
      }
    }

    for (const [name, scene] of scenesOf(mission)) {
      if (scene.background && !assetExists(publicDir, scene.background)) {
        report.errors.push(
          `${where} ${name}: latar "${scene.background}" tidak ada di public/assets`,
        );
      }
      scene.lines.forEach((line: DialogueLine, i) => {
        const at = `${where} ${name}, baris ${i + 1}`;
        if (special.has(line.who)) return;
        const speaker = characters[line.who];
        if (!speaker) {
          report.errors.push(`${at}: tokoh "${line.who}" tidak ada di content/characters.yaml`);
        } else if (!(line.mood in speaker.portraits)) {
          report.errors.push(`${at}: ${line.who} tidak punya potret untuk suasana "${line.mood}"`);
        }
      });
    }
  }

  for (const [id, character] of Object.entries(characters)) {
    for (const [mood, ref] of Object.entries(character.portraits)) {
      if (!assetExists(publicDir, ref)) {
        report.errors.push(`tokoh ${id} (${mood}): gambar "${ref}" tidak ada di public/assets`);
      }
    }
  }
}

function checkCodex(report: ContentReport, publicDir: string): void {
  for (const [chapterId, file] of Object.entries(report.codex)) {
    for (const entry of file.entries) {
      for (const ref of entry.images) {
        if (!assetExists(publicDir, ref)) {
          report.errors.push(
            `kodeks ${chapterId}/${entry.id}: gambar "${ref}" tidak ada di public/assets`,
          );
        }
      }
    }
  }
}

function collectUnverified(report: ContentReport): void {
  for (const chapter of report.chapters) {
    if (chapter.years.verify) report.unverified.push(`${chapter.id}: ${describe(chapter.years)}`);
    for (const mission of [...chapter.missions, chapter.exam]) {
      for (const year of mission.years) {
        if (year.verify) report.unverified.push(`${chapter.id}/${mission.id}: ${describe(year)}`);
      }
    }
  }
  for (const [chapterId, file] of Object.entries(report.codex)) {
    for (const entry of file.entries) {
      if (entry.verify)
        report.unverified.push(`${chapterId}/kodeks/${entry.id}: fakta perlu dicek`);
      for (const year of entry.years) {
        if (year.verify) {
          report.unverified.push(`${chapterId}/kodeks/${entry.id}: ${describe(year)}`);
        }
      }
    }
  }
}

const describe = (y: { start: number; end?: number; approximate: boolean }) =>
  formatYearRange(y.start, y.end, y.approximate);

if (import.meta.main) {
  const report = validateAllContent();
  for (const error of report.errors) console.error(`GALAT ${error}`);
  const missionCount = report.chapters.reduce((n, c) => n + c.missions.length + 1, 0);
  const entryCount = Object.values(report.codex).reduce((n, f) => n + f.entries.length, 0);
  console.log(
    `${report.chapters.length} bab, ${missionCount} misi (termasuk ujian), ${report.missions.length} berkas misi, ${entryCount} entri Kodeks divalidasi.`,
  );
  if (report.unverified.length > 0) {
    console.log(`\nYang masih perlu diverifikasi (${report.unverified.length}):`);
    for (const item of report.unverified) console.log(`  - ${item}`);
  }
  if (report.errors.length > 0) process.exit(1);
}
