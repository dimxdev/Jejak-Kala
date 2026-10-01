import { parseMission } from '@/core/content/parse';
import type { MissionContent } from '@/core/missions/schema';

// A mission file holds the whole story and numbers of one mission, so it is loaded when that mission
// is opened and not at start-up. `import.meta.glob` makes Vite split each file into its own chunk.
const loaders = import.meta.glob('@content/chapters/*/missions/*.yaml', { import: 'default' });

const pathOf = (missionId: string): string | undefined =>
  Object.keys(loaders).find((path) => path.endsWith(`/missions/${missionId}.yaml`));

/** Is there a playable mission file for this id? Missions without one are shown as "segera hadir". */
export const hasMissionFile = (missionId: string): boolean => pathOf(missionId) !== undefined;

/** Loads and validates a mission file. Resolves to null when the mission has no file. */
export async function loadMission(missionId: string): Promise<MissionContent | null> {
  const path = pathOf(missionId);
  const load = path ? loaders[path] : undefined;
  if (!path || !load) return null;
  return parseMission(await load(), path);
}
