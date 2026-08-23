import { describe, expect, it } from 'vitest';
import { EARLY_MALIGNANT_HYPERTHERMIA_DURING_VOLATILE_ANESTHESIA as SCENARIO } from '@anesthesia/scenarios/early-malignant-hyperthermia-during-volatile-anesthesia';
import { SCENARIOS } from '@anesthesia/scenarios';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';

const ONSET = 3000;

function sample(
  tick: number,
  state: Partial<{
    muscleRigidityFraction: number;
    etco2MmHg: number;
    heartRateBpm: number;
    coreTemperatureC: number;
  }> = {},
) {
  return {
    tick,
    state: {
      muscleRigidityFraction: 0,
      etco2MmHg: 40,
      heartRateBpm: 80,
      coreTemperatureC: 36.7,
      ...state,
    },
    concentrations: [], attribution: [], alarms: [],
  } as never;
}

function finding(
  objectiveId: string,
  actions: readonly LearnerAction[],
  history = [sample(ONSET, { muscleRigidityFraction: 0.2 }), sample(ONSET + 1200)],
) {
  return objectiveFindings(SCENARIO, history, 0, 0, actions)
    .find((entry) => entry.objectiveId === objectiveId)!;
}

function advance(subject: AnesthesiaEngine, targetTick: number) {
  let result = subject.step();
  while (result.tick < targetTick) result = subject.step();
  return result;
}

describe('Requirement: early volatile-triggered malignant hyperthermia is a complete bundled case', () => {
  it('validates, is registered, starts awake, and arms only after real volatile exposure', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIO.metadata.estimatedMinutes).toBeLessThanOrEqual(10);
    expect(SCENARIO.equipment.ventilator).toMatchObject({
      delivering: false, fio2: 0.21, freshGasFlowLPerMin: 1,
    });
    expect(SCENARIO.timeline).toContainEqual(expect.objectContaining({
      id: 'volatile-trigger-context', type: 'malignant-hyperthermia',
      target: 'volatile-trigger', value: 1, atTick: 2400,
    }));
    const event = SCENARIO.timeline.find((entry) => entry.type === 'malignant-hyperthermia')!;
    expect(event.message).toBeUndefined();
    expect(JSON.stringify(event).toLowerCase()).not.toContain('susceptibility');
    expect(SCENARIO.formulary.some((entry) => entry.drugId === 'succinylcholine')).toBe(false);
  });

  it('uses the four declared sources and states the early-response boundary', () => {
    const sources = SCENARIO.metadata.clinicalReview.sources.join(' ');
    const briefing = SCENARIO.timeline[0]!.message!;
    expect(sources).toContain('PMID 39482150');
    expect(sources).toContain('PMID 33399225');
    expect(sources).toContain('PMID 20081135');
    expect(sources).toContain('Malignant Hyperthermia Association');
    expect(briefing).toContain('1 in 10,000 and 1 in 150,000');
    expect(briefing).toContain('initial response only');
    expect(briefing).toContain('does not model laboratory-guided acidosis or hyperkalemia treatment');
    expect(SCENARIO.metadata.limitations).toEqual(expect.arrayContaining([
      'malignant-hyperthermia-is-a-teaching-model',
      'dantrolene-course-is-a-teaching-model',
      'malignant-hyperthermia-initial-response-only',
      'fresh-gas-flow-is-a-teaching-model',
    ]));
  });

  it('maps its objectives into every supported framework', () => {
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
  });

  it('runs from volatile exposure to observable signs and a bounded initial response', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 20260823, practiceRegion: 'US' });
    subject.apply({
      tick: 0, type: 'ventilator', payload: {
        delivering: true, mode: 'volume-control', fio2: 0.5,
        tidalVolumeMl: 500, respiratoryRateBpm: 12,
        freshGasFlowLPerMin: 1, sevofluranePercent: 4,
      },
    });
    let result = advance(subject, 4800);
    expect(result.state.endTidalSevofluranePercent).toBeGreaterThan(0);
    expect(result.state.muscleRigidityFraction).toBeGreaterThan(0.01);
    const before = result.state;
    subject.apply({
      tick: subject.tick, type: 'ventilator', payload: {
        sevofluranePercent: 0, fio2: 1, freshGasFlowLPerMin: 10,
        tidalVolumeMl: 600, respiratoryRateBpm: 20, delivering: true,
      },
    });
    subject.apply({
      tick: subject.tick, type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: 2.5 },
    });
    result = advance(subject, 6000);
    expect(result.equipment.resuscitation.dantroleneTotalMg).toBe(200);
    expect(result.state.etco2MmHg).toBeLessThan(before.etco2MmHg);
    expect(result.state.muscleRigidityFraction).toBeLessThan(before.muscleRigidityFraction);
  });
});

describe('Requirement: the malignant-hyperthermia debrief scores accepted actions honestly', () => {
  it('does not score a crisis when no rigidity developed', () => {
    expect(finding('recognize-mh-hypermetabolism', [], [sample(6000)]).outcome)
      .toBe('not-exercised');
  });

  it('ignores hostile dantrolene before the valid 2.5 mg/kg IV dose', () => {
    const actions: LearnerAction[] = [
      { tick: ONSET + 10, type: 'dantrolene', payload: { route: 'im', doseMgPerKg: 2.5 } },
      { tick: ONSET + 20, type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: 3 } },
      { tick: ONSET + 300, type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: 2.5 } },
    ];
    const result = finding('give-initial-dantrolene', actions);
    expect(result.outcome).toBe('met');
    expect(result.finding).toContain('30 seconds');
    expect(result.finding).toContain('2.5 mg/kg IV');
  });

  it('reconstructs the initial machine response from separate learner controls', () => {
    const actions: LearnerAction[] = [
      { tick: ONSET + 10, type: 'ventilator', payload: { sevofluranePercent: 0 } },
      { tick: ONSET + 20, type: 'ventilator', payload: { fio2: 1 } },
      { tick: ONSET + 30, type: 'ventilator', payload: { freshGasFlowLPerMin: 10 } },
      { tick: ONSET + 40, type: 'ventilator', payload: { tidalVolumeMl: 600 } },
      { tick: ONSET + 50, type: 'ventilator', payload: { respiratoryRateBpm: 20 } },
      { tick: ONSET + 60, type: 'ventilator', payload: { delivering: true } },
    ];
    const result = finding('stop-trigger-and-hyperventilate', actions);
    expect(result.outcome).toBe('met');
    expect(result.finding).toContain('12.0 L/min');
    expect(result.finding).toContain('observable initial bundle');
  });

  it('reports a bounded observable response without claiming a diagnosis', () => {
    const dose: LearnerAction = {
      tick: ONSET + 100, type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: 2.5 },
    };
    const result = finding('reassess-mh-response', [dose], [
      sample(ONSET, { muscleRigidityFraction: 0.4, etco2MmHg: 70, heartRateBpm: 125 }),
      sample(ONSET + 100, { muscleRigidityFraction: 0.5, etco2MmHg: 75, heartRateBpm: 130 }),
      sample(ONSET + 1300, {
        muscleRigidityFraction: 0.15, etco2MmHg: 52, heartRateBpm: 105, coreTemperatureC: 38.2,
      }),
    ]);
    expect(result.outcome).toBe('met');
    expect(result.finding).toContain('bounded modeled response');
    expect(result.finding).toContain('does not confirm a diagnosis');
  });
});
