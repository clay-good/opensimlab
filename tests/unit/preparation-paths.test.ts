import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '@anesthesia/scenarios';
import {
  PREPARATION_PATHS,
  pathMinutes,
  pathScenarios,
  recommendNextScenario,
} from '@anesthesia/catalog/preparation-paths';

describe('goal-based preparation paths', () => {
  it('defines exactly the 10 named, finite, versioned paths from the design', () => {
    expect(PREPARATION_PATHS.map((path) => path.title)).toEqual([
      'My first simulation lab', 'Recognize a deteriorating patient', 'Airway and oxygenation',
      'Shock and perfusion', 'Rhythm and resuscitation', 'Ventilation and respiratory failure',
      'Pediatric emergencies', 'Obstetric emergencies', 'Medication and infusion safety',
      'Handoff and escalation',
    ]);
    for (const path of PREPARATION_PATHS) {
      expect(path.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(pathScenarios(path, SCENARIOS)).toHaveLength(path.scenarioIds.length);
      expect(pathMinutes(path, SCENARIOS)).toBeGreaterThan(0);
      expect(path.targetCompetencies.length).toBeGreaterThan(0);
      expect(path.supportedRoles.length).toBeGreaterThan(0);
      expect(path.limitations).toContain('does not assess psychomotor technique');
    }
  });

  it('recommends the first unfinished scenario with one inspectable local reason', () => {
    const path = PREPARATION_PATHS[0]!;
    const first = recommendNextScenario(path, SCENARIOS);
    expect(first.scenario.metadata.id).toBe(path.scenarioIds[0]);
    expect(first.reason).toContain(path.title);
    const next = recommendNextScenario(path, SCENARIOS, new Set([path.scenarioIds[0]!]))
    expect(next.scenario.metadata.id).toBe(path.scenarioIds[1]);
  });

  it('fails loudly if a path drifts from the scenario registry', () => {
    expect(() => pathScenarios({
      ...PREPARATION_PATHS[0]!, scenarioIds: ['not-a-scenario'],
    }, SCENARIOS)).toThrow(/unknown scenario/);
  });
});
