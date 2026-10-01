import { describe, expect, it } from 'vitest';
import { optimalPlan } from '../../src/core/missions/nile-flood/model';
import { testParams } from '../../src/core/missions/nile-flood/model.fixture';
import {
  gaugeOf,
  gaugeValue,
  isRightSeked,
  sekedOf,
} from '../../src/core/missions/pyramid-climb/seked';
import { isCornerC, isCornerD, plotStakes } from '../../src/core/missions/rope-survey/model';
import { testParams as ropeParams } from '../../src/core/missions/rope-survey/model.fixture';
import { MISSION_ENGINES } from '../../src/core/missions/schema';
import { validateAllContent } from '../../tools/content/validate';

describe('content/', () => {
  const report = validateAllContent();

  it('has no validation errors', () => {
    expect(report.errors).toEqual([]);
  });

  it('contains the Mesir chapter with six missions and one exam', () => {
    const mesir = report.chapters.find((c) => c.id === 'mesir');
    expect(mesir?.missions).toHaveLength(6);
    expect(mesir?.exam.type).toBe('boss');
    expect(mesir?.examRequires).toBe('all');
  });

  it('gives every Kodeks entry a body and a credibility label', () => {
    for (const file of Object.values(report.codex)) {
      for (const entry of file.entries) {
        expect(entry.body.length, entry.id).toBeGreaterThan(0);
        expect(entry.credibility, entry.id).toBeTruthy();
      }
    }
  });

  it('only unlocks Kodeks entries that exist', () => {
    // validateAllContent reports this as an error; this test names the rule so a failure is easy to find
    const ids = new Set(Object.values(report.codex).flatMap((f) => f.entries.map((e) => e.id)));
    for (const mission of report.missions) {
      for (const id of [...mission.codex, ...mission.bonusCodex]) {
        expect(ids.has(id), `${mission.id} -> ${id}`).toBe(true);
      }
    }
  });
});

describe('mission m1-banjir-nil', () => {
  const report = validateAllContent();
  const mission = report.missions.find((m) => m.id === 'm1-banjir-nil');

  it('is a nile-flood mission', () => {
    expect(mission?.engine).toBe('nile-flood');
  });

  it('uses the same numbers as the unit-test fixture, so the tests describe the real game', () => {
    if (mission?.engine !== 'nile-flood') throw new Error('bukan nile-flood');
    expect(mission.params).toEqual(testParams);
  });

  it('can be won well in every possible flood: the best plan always feeds the family', () => {
    if (mission?.engine !== 'nile-flood') throw new Error('bukan nile-flood');
    const { min, max } = mission.params.floodRange;
    for (let flood = min; flood <= max; flood++) {
      const best = optimalPlan(mission.params, flood).settlement;
      expect(best.hungry, `banjir ${flood} hasta`).toBe(false);
      expect(best.surplus, `banjir ${flood} hasta`).toBeGreaterThan(0);
    }
  });

  it('has a bonus quiz whose answers point at real options', () => {
    expect(mission?.bonusQuiz?.questions.length).toBeGreaterThanOrEqual(3);
    for (const question of mission?.bonusQuiz?.questions ?? []) {
      expect(question.options[question.answer]).toBeTruthy();
    }
  });
});

describe('mission m2-tali-penyurvei', () => {
  const report = validateAllContent();
  const mission = report.missions.find((m) => m.id === 'm2-tali-penyurvei');

  it('is a rope-survey mission', () => {
    expect(mission?.engine).toBe('rope-survey');
  });

  it('uses the same numbers as the unit-test fixture, so the tests describe the real game', () => {
    if (mission?.engine !== 'rope-survey') throw new Error('bukan rope-survey');
    expect(mission.params).toEqual(ropeParams);
  });

  it('can be solved: the stakes the rope asks for exist on the grid and are accepted', () => {
    if (mission?.engine !== 'rope-survey') throw new Error('bukan rope-survey');
    const { c, d } = plotStakes(mission.params);
    expect(isCornerC(mission.params, c)).toBe(true);
    expect(isCornerD(mission.params, d)).toBe(true);
  });

  it('puts the circle entry behind the bonus and the other entries behind finishing', () => {
    expect(mission?.bonusCodex).toEqual(['luas-lingkaran-mesir']);
    expect(mission?.codex).toContain('setat');
  });
});

describe('mission m4-lereng-sempurna', () => {
  const report = validateAllContent();
  const mission = report.missions.find((m) => m.id === 'm4-lereng-sempurna');

  it('is a pyramid-climb mission with three gates and three golden rods', () => {
    if (mission?.engine !== 'pyramid-climb') throw new Error('bukan pyramid-climb');
    expect(mission.params.gates).toHaveLength(3);
    expect(mission.params.rods).toHaveLength(3);
  });

  it('has a right setting on the gauge at every gate, so "Lihat solusi" always shows a valid answer', () => {
    if (mission?.engine !== 'pyramid-climb') throw new Error('bukan pyramid-climb');
    for (const gate of mission.params.gates) {
      const shown = gaugeValue(gaugeOf(sekedOf(gate)));
      expect(isRightSeked(shown, gate), `${gate.base} x ${gate.height}`).toBe(true);
    }
  });

  it('uses the three numbers the story tells: 7, 5 1/25 (Rhind 56) and 5 1/2 palms', () => {
    if (mission?.engine !== 'pyramid-climb') throw new Error('bukan pyramid-climb');
    const answers = mission.params.gates.map((gate) => sekedOf(gate));
    expect(answers[0]).toBe(7);
    expect(answers[1]).toBeCloseTo(5 + 1 / 25, 10);
    expect(answers[2]).toBe(5.5);
  });

  it('puts the golden rods behind the bonus and the rest behind finishing', () => {
    expect(mission?.bonusCodex).toEqual(['tongkat-hasta']);
    expect(mission?.codex).toContain('seked');
  });

  it('has the five scenes the engine plays', () => {
    expect(Object.keys(mission?.scenes ?? {}).sort()).toEqual(
      ['climb', 'gate1', 'gate2', 'gate3', 'summit'].sort(),
    );
  });
});

describe('mission engines', () => {
  it('have a mission file in the content for every engine that exists', () => {
    const report = validateAllContent();
    const used = new Set(report.missions.map((m) => m.engine));
    expect([...used].sort()).toEqual([...MISSION_ENGINES].sort());
  });
});
