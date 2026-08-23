import { describe, expect, it } from 'vitest';
import { LARYNGOSPASM_AFTER_AIRWAY_STIMULATION } from '@anesthesia/scenarios/laryngospasm-after-airway-stimulation';
import { SCENARIOS } from '@anesthesia/scenarios';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';

const ONSET = 2400;

const state = (tick: number, values: Partial<Record<string, number>>) => ({
  tick,
  state: {
    endTidalO2Fraction: 0.9,
    spo2Percent: 98,
    meanArterialMmHg: 80,
    ...values,
  },
  concentrations: [], attribution: [], alarms: [],
}) as never;

function finding(
  objectiveId: string,
  history: readonly never[],
  actions: readonly LearnerAction[],
) {
  return objectiveFindings(
    LARYNGOSPASM_AFTER_AIRWAY_STIMULATION, history, 0, 0, actions,
  ).find((entry) => entry.objectiveId === objectiveId)!;
}

function advance(subject: AnesthesiaEngine, targetTick: number) {
  let result = subject.step();
  while (result.tick < targetTick) result = subject.step();
  return result;
}

describe('Requirement: laryngospasm initial response is a complete bundled scenario', () => {
  it('validates, is registered, and declares persistent upper-airway closure', () => {
    expect(validateScenario(LARYNGOSPASM_AFTER_AIRWAY_STIMULATION)).toEqual([]);
    expect(SCENARIOS).toContain(LARYNGOSPASM_AFTER_AIRWAY_STIMULATION);
    expect(LARYNGOSPASM_AFTER_AIRWAY_STIMULATION.metadata.estimatedMinutes).toBeLessThan(20);
    expect(LARYNGOSPASM_AFTER_AIRWAY_STIMULATION.timeline).toContainEqual(expect.objectContaining({
      id: 'laryngospasm-onset', type: 'laryngospasm', value: 0.95,
    }));
  });

  it('stocks no blocker and states the missing refractory pathway', () => {
    expect(LARYNGOSPASM_AFTER_AIRWAY_STIMULATION.formulary.some(
      (entry) => entry.drugId === 'rocuronium' || entry.drugId === 'succinylcholine',
    )).toBe(false);
    expect(LARYNGOSPASM_AFTER_AIRWAY_STIMULATION.metadata.limitations)
      .toEqual(expect.arrayContaining([
        'laryngospasm-initial-measures-are-a-teaching-model',
        'no-refractory-laryngospasm-pathway',
      ]));
  });

  it('maps observable objectives into every supported framework', () => {
    const mappings = SCENARIO_MAPPINGS.filter(
      (entry) => entry.scenarioId === LARYNGOSPASM_AFTER_AIRWAY_STIMULATION.metadata.id,
    );
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const declared = new Set(
      LARYNGOSPASM_AFTER_AIRWAY_STIMULATION.metadata.objectives.map((entry) => entry.id),
    );
    for (const mapping of mappings) {
      for (const objectiveId of mapping.objectiveIds) expect(declared).toContain(objectiveId);
    }
  });

  it('closes an unsecured airway and responds to the bounded initial-measures bundle', () => {
    const subject = new AnesthesiaEngine({
      scenario: LARYNGOSPASM_AFTER_AIRWAY_STIMULATION,
      seed: 20260823,
      practiceRegion: 'US',
    });
    subject.apply({ tick: 0, type: 'ventilator', payload: { fio2: 1, delivering: true } });
    let result = advance(subject, 1800);
    expect(result.equipment.airway.intubated).toBe(false);
    subject.apply({ tick: subject.tick, type: 'bolus', payload: {
      drugId: 'propofol', amount: 2, unit: 'mg/kg',
    } });
    result = advance(subject, ONSET);
    expect(result.equipment.airway.intubated).toBe(false);
    expect(result.equipment.airway.patencyFraction).toBeLessThan(0.1);

    subject.apply({ tick: subject.tick, type: 'airway-maneuver', payload: {
      maneuver: 'jaw-thrust-cpap',
    } });
    result = advance(subject, ONSET + 200);
    expect(result.equipment.airway.patencyFraction).toBe(1);
    expect(result.state.spo2Percent).toBeGreaterThanOrEqual(92);
  });
});

describe('Requirement: laryngospasm objectives use observable behavioral proxies', () => {
  it('reads the end-tidal oxygen value at closure', () => {
    expect(finding(
      'preoxygenate-before-laryngospasm', [state(ONSET, { endTidalO2Fraction: 0.91 })], [],
    ).outcome).toBe('met');
    expect(finding(
      'preoxygenate-before-laryngospasm', [state(ONSET, { endTidalO2Fraction: 0.81 })], [],
    ).outcome).toBe('partly-met');
  });

  it('reconstructs oxygen and delivery from separate UI-realistic ventilator actions', () => {
    const actions: LearnerAction[] = [
      { tick: 100, type: 'ventilator', payload: { fio2: 1 } },
      { tick: 200, type: 'ventilator', payload: { delivering: true } },
      { tick: ONSET + 200, type: 'airway-maneuver', payload: { maneuver: 'jaw-thrust-cpap' } },
    ];
    const result = finding(
      'apply-initial-laryngospasm-measures', [state(ONSET + 300, {})], actions,
    );
    expect(result.outcome).toBe('met');
    expect(result.finding).toContain('observable initial measures');

    const deliveryStopped = [...actions.slice(0, 2),
      { tick: ONSET + 100, type: 'ventilator', payload: { delivering: false } }, actions[2]!];
    expect(finding(
      'apply-initial-laryngospasm-measures', [state(ONSET + 300, {})], deliveryStopped,
    ).outcome).toBe('not-met');
  });

  it('grades deepening by timing without claiming adequacy', () => {
    const timely: LearnerAction = {
      tick: ONSET + 300, type: 'bolus', payload: { drugId: 'propofol', amount: 20, unit: 'mg' },
    };
    const result = finding('deepen-during-laryngospasm', [state(ONSET + 400, {})], [timely]);
    expect(result.outcome).toBe('met');
    expect(result.finding).toContain('action proxy');
    expect(result.finding).not.toContain('adequate dose');
  });

  it('reports oxygenation without claiming definitive treatment', () => {
    const result = finding('protect-oxygenation-during-laryngospasm', [
      state(ONSET, { spo2Percent: 98 }),
      state(ONSET + 600, { spo2Percent: 90 }),
    ], []);
    expect(result.outcome).toBe('partly-met');
    expect(result.finding).toContain('not proof that laryngospasm was definitively treated');
  });

  it('does not infer closure objectives after earlier airway instrumentation', () => {
    const airway: LearnerAction = {
      tick: ONSET - 100, type: 'laryngoscopy', payload: { technique: 'video' },
    };
    const result = finding(
      'protect-oxygenation-during-laryngospasm', [state(ONSET + 600, {})], [airway],
    );
    expect(result.outcome).toBe('not-exercised');
    expect(result.finding).toContain('does not prove whether an earlier attempt succeeded');
  });
});
