import type { MissionContent, MissionEngine } from '@/core/missions/schema';
import type { Mode } from '@/features/progress';

/** What an engine reports when the player has played the mission to the end. */
export interface EngineResult {
  stars: 1 | 2 | 3;
  /** the engine's own bonus challenge was solved: unlocks the mission's `bonusCodex` */
  bonus?: boolean;
}

/** The props every mission engine receives from the mission host. */
export interface EngineProps<E extends MissionEngine> {
  /** the mission's file, narrowed to this engine so `mission.params` has the engine's shape */
  mission: Extract<MissionContent, { engine: E }>;
  mode: Mode;
  onFinish: (result: EngineResult) => void;
}
