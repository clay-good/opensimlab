import { describe, expect, it } from 'vitest';
import { RAPID_SEQUENCE_INDUCTION } from '@anesthesia/scenarios/rapid-sequence-induction';
import { SCENARIOS } from '@anesthesia/scenarios';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';

const state = (
  tick: number,
  values: Partial<Record<string, number>>,
) => ({
  tick,
  state: {
    meanArterialMmHg: 80,
    spo2Percent: 98,
    endTidalO2Fraction: 0.21,
    trainOfFourCount: 4,
    trainOfFourRatio: 1,
    respiratoryRateBpm: 0,
    etco2MmHg: 0,
    ...values,
  },
  concentrations: [], attribution: [], alarms: [],
}) as never;

const bolus = (tick: number, drugId: string, amount: number, unit: string): LearnerAction => ({
  tick, type: 'bolus', payload: { drugId, amount, unit },
});

function finding(
  objectiveId: string,
  history: readonly never[],
  actions: readonly LearnerAction[],
) {
  return objectiveFindings(
    RAPID_SEQUENCE_INDUCTION, history, 0, 0, actions,
  ).find((entry) => entry.objectiveId === objectiveId)!;
}

describe('Requirement: Rapid-sequence induction is a complete bundled scenario', () => {
  it('validates, is registered, and is reachable by the required stable id', () => {
    expect(validateScenario(RAPID_SEQUENCE_INDUCTION)).toEqual([]);
    expect(SCENARIOS).toContain(RAPID_SEQUENCE_INDUCTION);
    expect(RAPID_SEQUENCE_INDUCTION.metadata.id).toBe('rapid-sequence-induction');
    expect(RAPID_SEQUENCE_INDUCTION.metadata.estimatedMinutes).toBeLessThan(20);
  });

  it('declares bolus-only rocuronium and quantitative train-of-four monitoring', () => {
    const rocuronium = RAPID_SEQUENCE_INDUCTION.formulary.find(
      (entry) => entry.drugId === 'rocuronium',
    );
    expect(rocuronium?.deliveryModes).toEqual(['bolus']);
    expect(rocuronium?.presets.some((preset) => preset.unit === 'mg/kg')).toBe(true);
    expect(RAPID_SEQUENCE_INDUCTION.equipment.monitoring).toContain('train-of-four');
  });

  it('loads in the engine and produces a complete modeled block from its rocuronium preset', () => {
    const sim = new AnesthesiaEngine({
      scenario: RAPID_SEQUENCE_INDUCTION, seed: 20260823, practiceRegion: 'US',
    });
    sim.apply(bolus(0, 'rocuronium', 0.6, 'mg/kg'));
    let result = sim.step();
    for (let tick = 1; tick < 1800 && result.state.trainOfFourCount > 0; tick += 1) {
      result = sim.step();
    }
    expect(result.state.trainOfFourCount).toBe(0);
    expect(result.state.trainOfFourRatio).toBeLessThanOrEqual(0.1);
    expect(result.concentrations.find((entry) => entry.drugId === 'rocuronium')?.confidence)
      .toBe('teaching');
  });

  it('maps its observable objectives into every supported framework', () => {
    const mappings = SCENARIO_MAPPINGS.filter(
      (entry) => entry.scenarioId === RAPID_SEQUENCE_INDUCTION.metadata.id,
    );
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const declared = new Set(
      RAPID_SEQUENCE_INDUCTION.metadata.objectives.map((objective) => objective.id),
    );
    for (const mapping of mappings) {
      for (const objectiveId of mapping.objectiveIds) expect(declared).toContain(objectiveId);
    }
  });
});

describe('Requirement: RSI objectives are derived from recorded state and actions', () => {
  it('judges the end-tidal oxygen value at induction, not the inspired setting', () => {
    const induction = bolus(100, 'propofol', 1.5, 'mg/kg');
    expect(finding(
      'preoxygenate-before-induction', [state(100, { endTidalO2Fraction: 0.91 })], [induction],
    ).outcome).toBe('met');
    expect(finding(
      'preoxygenate-before-induction', [state(100, { endTidalO2Fraction: 0.82 })], [induction],
    ).outcome).toBe('partly-met');
    expect(finding(
      'preoxygenate-before-induction', [state(100, { endTidalO2Fraction: 0.5 })], [induction],
    ).outcome).toBe('not-met');
  });

  it('judges block at the airway action and names the peripheral-monitor limit', () => {
    const actions: LearnerAction[] = [
      bolus(90, 'propofol', 1.5, 'mg/kg'),
      bolus(100, 'rocuronium', 0.6, 'mg/kg'),
      { tick: 900, type: 'laryngoscopy', payload: { technique: 'video' } },
    ];
    const ready = finding(
      'wait-for-intubating-block',
      [state(900, { trainOfFourCount: 0, trainOfFourRatio: 0 })],
      actions,
    );
    expect(ready.outcome).toBe('met');
    expect(ready.finding).toContain('does not guarantee conditions at the larynx');

    expect(finding(
      'wait-for-intubating-block',
      [state(900, { trainOfFourCount: 4, trainOfFourRatio: 1 })],
      actions,
    ).outcome).toBe('not-met');
  });

  it('does not mistake paralysis before hypnosis for a competent sequence', () => {
    const actions: LearnerAction[] = [
      bolus(100, 'rocuronium', 0.6, 'mg/kg'),
      bolus(110, 'propofol', 1.5, 'mg/kg'),
      { tick: 900, type: 'laryngoscopy', payload: { technique: 'video' } },
    ];
    const result = finding(
      'wait-for-intubating-block',
      [state(900, { trainOfFourCount: 0, trainOfFourRatio: 0 })],
      actions,
    );
    expect(result.outcome).toBe('not-met');
    expect(result.finding).toContain('does not produce sleep');
  });

  it('reports the oxygen margin and subsequent gas exchange independently', () => {
    const airway: LearnerAction = {
      tick: 900, type: 'laryngoscopy', payload: { technique: 'video' },
    };
    const history = [
      state(900, { spo2Percent: 95 }),
      state(1100, { spo2Percent: 93, respiratoryRateBpm: 12, etco2MmHg: 34 }),
    ];
    expect(finding('protect-the-apnea-margin', history, [airway]).outcome).toBe('met');
    expect(finding('secure-and-confirm', history, [airway]).outcome).toBe('met');

    const noExchange = [state(900, { spo2Percent: 87 }), state(1100, { spo2Percent: 87 })];
    expect(finding('protect-the-apnea-margin', noExchange, [airway]).outcome).toBe('not-met');
    expect(finding('secure-and-confirm', noExchange, [airway]).outcome).toBe('partly-met');
  });
});
