import { lazy } from 'react';
import type { MissionContent } from '@/core/missions/schema';
import type { Mode } from '@/features/progress';
import type { EngineResult } from './types';

// One line per engine: the UI of a mission type is loaded only when a mission of that type is opened.
// The `switch` below is checked for completeness by TypeScript: adding an engine to the mission schema
// (src/core/missions/schema.ts) fails to compile until its case is added here.
const NileFlood = lazy(() => import('./nile-flood/NileFloodMission'));
const RopeSurvey = lazy(() => import('./rope-survey/RopeSurveyMission'));
const PyramidClimb = lazy(() => import('./pyramid-climb/PyramidClimbMission'));

interface EngineViewProps {
  mission: MissionContent;
  mode: Mode;
  onFinish: (result: EngineResult) => void;
}

export function EngineView({ mission, mode, onFinish }: EngineViewProps) {
  switch (mission.engine) {
    case 'nile-flood':
      return <NileFlood mission={mission} mode={mode} onFinish={onFinish} />;
    case 'rope-survey':
      return <RopeSurvey mission={mission} mode={mode} onFinish={onFinish} />;
    case 'pyramid-climb':
      return <PyramidClimb mission={mission} mode={mode} onFinish={onFinish} />;
    default:
      return assertNever(mission);
  }
}

function assertNever(value: never): never {
  throw new Error(`engine tanpa tampilan: ${JSON.stringify(value)}`);
}
