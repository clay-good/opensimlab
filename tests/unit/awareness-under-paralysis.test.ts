import { describe, expect, it } from 'vitest';
import { AWARENESS_UNDER_PARALYSIS } from '@anesthesia/scenarios/awareness-under-paralysis';
import { SCENARIOS } from '@anesthesia/scenarios';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';

const state = (tick: number, values: Partial<Record<string, number>>) => ({
  tick,
  state: {
    meanArterialMmHg: 80,
    heartRateBpm: 76,
    spo2Percent: 98,
    etco2MmHg: 35,
    depthIndex: 45,
    trainOfFourRatio: 0.04,
    trainOfFourCount: 0,
    ...values,
  },
  concentrations: [], attribution: [], alarms: [],
}) as never;

const bolus = (tick: number, drugId: string): LearnerAction => ({
  tick, type: 'bolus', payload: { drugId, amount: 1, unit: 'mg/kg' },
});

const line = (tick: number, action: 'inspect' | 'reconnect'): LearnerAction => ({
  tick, type: 'hypnotic-line', payload: { action },
});

function finding(
  objectiveId: string,
  history: readonly never[],
  actions: readonly LearnerAction[],
) {
  return objectiveFindings(
    AWARENESS_UNDER_PARALYSIS, history, 0, 0, actions,
  ).find((entry) => entry.objectiveId === objectiveId)!;
}

describe('Requirement: awareness under paralysis is a complete bundled scenario', () => {
  it('validates, is registered, remains under 20 minutes, and declares the exact failure target', () => {
    expect(validateScenario(AWARENESS_UNDER_PARALYSIS)).toEqual([]);
    expect(SCENARIOS).toContain(AWARENESS_UNDER_PARALYSIS);
    expect(AWARENESS_UNDER_PARALYSIS.metadata.estimatedMinutes).toBeLessThanOrEqual(10);
    expect(AWARENESS_UNDER_PARALYSIS.timeline).toContainEqual(expect.objectContaining({
      type: 'equipment-failure', target: 'hypnotic-line-disconnection',
    }));
  });

  it('runs the specified silent-risk trajectory in the bundled case', () => {
    const engine = new AnesthesiaEngine({
      scenario: AWARENESS_UNDER_PARALYSIS, seed: 20260823, practiceRegion: 'US',
    });
    const competentActions: LearnerAction[] = [
      { tick: 0, type: 'ventilator', payload: {
        mode: 'volume-control', delivering: true, fio2: 0.5,
      } },
      { tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' } },
      { tick: 0, type: 'infusion', payload: {
        drugId: 'propofol', rate: 0.1, unit: 'mg/kg/min',
      } },
      { tick: 0, type: 'bolus', payload: {
        drugId: 'rocuronium', amount: 0.6, unit: 'mg/kg',
      } },
    ];
    for (const action of competentActions) engine.apply(action);

    let result = engine.step();
    for (let tick = 1; tick < 1800; tick += 1) result = engine.step();
    expect(result.state.depthIndex).toBeGreaterThanOrEqual(40);
    expect(result.state.depthIndex).toBeLessThanOrEqual(60);
    expect(result.state.trainOfFourCount).toBe(0);

    for (let tick = 1800; tick < 6000; tick += 1) result = engine.step();
    expect(result.state.depthIndex).toBeGreaterThan(60);
    expect(result.state.trainOfFourRatio).toBeLessThan(0.1);
    expect(result.alarms.map((alarm) => alarm.id)).toContain('depth-light');
    expect(result.alarms.filter((alarm) => alarm.parameter !== 'depthIndex')).toEqual([]);
  });

  it('declares TIVA, quantitative block monitoring, and the NAP5 evidence base', () => {
    expect(AWARENESS_UNDER_PARALYSIS.formulary.map((entry) => entry.drugId))
      .toEqual(expect.arrayContaining(['propofol', 'remifentanil', 'rocuronium']));
    expect(AWARENESS_UNDER_PARALYSIS.equipment.monitoring)
      .toEqual(expect.arrayContaining(['depth-index', 'train-of-four']));
    const prebriefMeasure = AWARENESS_UNDER_PARALYSIS.metadata.objectives.find(
      (entry) => entry.id === 'recognize-paralysis-risk',
    )?.measure ?? '';
    expect(prebriefMeasure).toContain('NAP5 (Br J Anaesth 2014;113:549-59)');
    for (const value of ['1 in 19,600', '1 in 8,200', '1 in 135,900', 'two-thirds']) {
      expect(prebriefMeasure).toContain(value);
    }
  });

  it('maps declared objectives into all three supported frameworks', () => {
    const mappings = SCENARIO_MAPPINGS.filter(
      (entry) => entry.scenarioId === AWARENESS_UNDER_PARALYSIS.metadata.id,
    );
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const declared = new Set(AWARENESS_UNDER_PARALYSIS.metadata.objectives.map((entry) => entry.id));
    for (const mapping of mappings) {
      for (const objectiveId of mapping.objectiveIds) expect(declared).toContain(objectiveId);
    }
  });
});

describe('Requirement: awareness objectives are derived from state and recorded actions', () => {
  const failureTick = 1800;

  it('requires propofol hypnosis before rocuronium and maintenance delivery before failure', () => {
    const competent = [
      bolus(100, 'propofol'),
      bolus(110, 'rocuronium'),
      { tick: 300, type: 'infusion', payload: { drugId: 'propofol', rate: 8, unit: 'mg/min' } },
    ];
    expect(finding('hypnosis-before-paralysis', [state(failureTick, {})], competent).outcome)
      .toBe('met');
    const blockerFirst = [bolus(90, 'rocuronium'), competent[0]!, competent[2]!];
    expect(finding('hypnosis-before-paralysis', [state(failureTick, {})], blockerFirst).outcome)
      .toBe('not-met');
  });

  it('grades inspection and reconnection against their declared timing windows', () => {
    expect(finding(
      'inspect-the-tiva-line', [state(5000, {})], [line(failureTick + 300, 'inspect')],
    ).outcome).toBe('met');
    expect(finding(
      'inspect-the-tiva-line', [state(5000, {})], [line(failureTick + 700, 'inspect')],
    ).outcome).toBe('partly-met');
    expect(finding(
      'restore-hypnotic-delivery', [state(5000, {})], [line(failureTick + 600, 'reconnect')],
    ).outcome).toBe('met');
    expect(finding(
      'restore-hypnotic-delivery', [state(5000, {})], [],
    ).outcome).toBe('not-met');
  });

  it('calls the depth-plus-block pattern risk rather than consciousness or recall', () => {
    const result = finding('recognize-paralysis-risk', [
      state(failureTick, { depthIndex: 48, trainOfFourRatio: 0.02 }),
      state(4300, { depthIndex: 68, trainOfFourRatio: 0.04 }),
    ], []);
    expect(result.outcome).toBe('met');
    expect(result.finding).toContain('modeled awareness risk');
    expect(result.finding).toContain('not measured consciousness or recall');
  });

  it('does not claim an objective was exercised before the failure occurs', () => {
    expect(finding('inspect-the-tiva-line', [state(1700, {})], []).outcome)
      .toBe('not-exercised');
    expect(finding('recognize-paralysis-risk', [state(1700, {})], []).outcome)
      .toBe('not-exercised');
  });
});
