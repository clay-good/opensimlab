import { describe, expect, it } from 'vitest';
import { RATIFIED_SCENARIO_COUNT, catalogFloorBlockers, recordedWithdrawals, scenarioKey } from '@platform/catalog/catalog-growth';
import { CORRECTIONS, type CorrectionEntry } from '@platform/docs/corrections';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';

const ids = (count: number) => Array.from({ length: count }, (_, index) => scenarioKey('anesthesia', `scenario-${index}`));
const withdrawal = (scenarioId: string): CorrectionEntry => ({
  released: '2026-11-01', title: `Withdrew ${scenarioId}`, item: `scenario:${scenarioId}`,
  wasWrong: 'x', educationalImpact: 'x', reportedBy: 'anonymous', whatChanged: 'Withdrawn.',
  releasedIn: '2026-11-01+abc', withdrawal: { moduleId: 'anesthesia', scenarioId },
});

describe('the ratified count is a floor', () => {
  it('records 256 as the ratified count', () => {
    expect(RATIFIED_SCENARIO_COUNT).toBe(256);
  });

  it('lets the catalog grow past it with no permission needed', () => {
    expect(catalogFloorBlockers(ids(257), [])).toEqual([]);
    expect(catalogFloorBlockers(ids(400), [])).toEqual([]);
  });

  it('blocks a silent shrink below it', () => {
    expect(catalogFloorBlockers(ids(255), [])).toEqual([
      '255 playable scenarios is 1 below the ratified 256 with no withdrawal recorded in the corrections log for the difference',
    ]);
  });

  it('accepts a shrink the corrections log accounts for, one withdrawal per missing scenario', () => {
    expect(catalogFloorBlockers(ids(255), [withdrawal('gone-1')])).toEqual([]);
    expect(catalogFloorBlockers(ids(254), [withdrawal('gone-1')])).toHaveLength(1);
    expect(catalogFloorBlockers(ids(254), [withdrawal('gone-1'), withdrawal('gone-1')])).toHaveLength(1);
  });

  it('blocks a withdrawal that left the scenario playable', () => {
    expect(catalogFloorBlockers(ids(256), [withdrawal('scenario-3')]))
      .toEqual(['anesthesia:scenario-3 is recorded as withdrawn in the corrections log but is still playable']);
  });

  it('holds for the catalog as built today', () => {
    expect(recordedWithdrawals(CORRECTIONS)).toEqual([]);
    const playable = FACILITATED_SCENARIOS.filter((entry) => entry.scenario.metadata.maturity !== 'withdrawn');
    expect(playable.length).toBeGreaterThanOrEqual(RATIFIED_SCENARIO_COUNT);
    const keys = playable.map((entry) => scenarioKey(entry.moduleRoute, entry.scenario.metadata.id));
    expect(new Set(keys).size).toBe(keys.length);
    expect(catalogFloorBlockers(keys, CORRECTIONS)).toEqual([]);
  });

  it('counts two modules\' lessons with the same id as two scenarios', () => {
    const shared = FACILITATED_SCENARIOS.filter((entry) => entry.scenario.metadata.id === 'status-epilepticus');
    expect(shared.map((entry) => entry.moduleRoute).sort()).toEqual(['critical-care', 'emergency-medicine']);
  });
});
