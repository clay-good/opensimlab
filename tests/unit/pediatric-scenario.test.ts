import { describe, expect, it } from 'vitest';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { ROUTINE_PEDIATRIC_IV_INDUCTION as SCENARIO } from '@anesthesia/scenarios/routine-pediatric-iv-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { LearnerAction } from '@platform/kernel/protocol';

const sample = (tick: number, values: Partial<Record<string, number>> = {}) => ({
  tick,
  state: {
    endTidalO2Fraction: 0.92,
    etco2MmHg: 40,
    spo2Percent: 98,
    ...values,
  },
  concentrations: [], attribution: [], alarms: [],
}) as never;

function findings(actions: readonly LearnerAction[]) {
  return objectiveFindings(SCENARIO, [
    sample(100), sample(200, { etco2MmHg: 42 }), sample(500, { etco2MmHg: 40 }),
  ], 0, 0, actions);
}

describe('Requirement: bounded routine pediatric intravenous induction scenario', () => {
  it('validates, is registered, and stays inside the declared 6-year-old profile', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 6, weightKg: 20 });
    expect(SCENARIO.patient.respiratory).toEqual({ profile: 'healthy-child' });
    expect(SCENARIO.metadata.estimatedMinutes).toBeLessThanOrEqual(10);
    expect(SCENARIO.formulary).toHaveLength(1);
    expect(SCENARIO.formulary[0]).toMatchObject({ drugId: 'propofol', deliveryModes: ['bolus'] });
    expect(SCENARIO.formulary[0]?.modelId).toBeUndefined();
  });

  it('rejects reusing the bounded healthy-child profile for a different child', () => {
    const unsupported = {
      ...SCENARIO,
      patient: { ...SCENARIO.patient, ageYears: 8 },
    };
    expect(validateScenario(unsupported)).toEqual(expect.arrayContaining([
      expect.objectContaining({ rule: 'supported-profile' }),
    ]));
  });

  it('carries the pediatric kinetic, respiratory, preoxygenation, and dosing sources', () => {
    const sources = SCENARIO.metadata.clinicalReview.sources.join(' ');
    for (const pmid of [
      '15941735', '14504151', '1549927', '2240677', '2492815', '8727530', '6419754',
    ]) {
      expect(sources).toContain(`PMID ${pmid}`);
    }
    expect(sources).toContain('DailyMed');
    expect(SCENARIO.metadata.limitations).toEqual(expect.arrayContaining([
      'paedfusor-pk-does-not-validate-pediatric-depth',
      'pediatric-respiratory-profile-is-a-teaching-model',
      'pediatric-hemodynamic-maturation-is-not-modeled',
      'pediatric-airway-equipment-sizing-is-not-modeled',
      'pediatric-case-is-one-bounded-profile',
      'pediatric-emergence-is-not-modeled',
    ]));
  });

  it('maps declared objectives into every supported framework', () => {
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const objectiveIds = new Set(SCENARIO.metadata.objectives.map((entry) => entry.id));
    for (const mapping of mappings) {
      for (const objectiveId of mapping.objectiveIds) expect(objectiveIds).toContain(objectiveId);
    }
  });
});

describe('Requirement: pediatric debrief scores accepted actions and observed physiology', () => {
  const competent: LearnerAction[] = [
    { tick: 20, type: 'ventilator', payload: { tidalVolumeMl: 160 } },
    { tick: 30, type: 'ventilator', payload: { respiratoryRateBpm: 20 } },
    { tick: 40, type: 'ventilator', payload: { delivering: true } },
    { tick: 100, type: 'bolus', payload: { drugId: 'propofol', amount: 3.5, unit: 'mg/kg' } },
  ];

  it('scores the end-tidal oxygen endpoint and accepted weight-based dose', () => {
    const result = findings(competent);
    expect(result.find((entry) => entry.objectiveId === 'preoxygenate-child')?.outcome).toBe('met');
    const dose = result.find((entry) => entry.objectiveId === 'dose-pediatric-propofol')!;
    expect(dose.outcome).toBe('met');
    expect(dose.finding).toContain('3.50 mg/kg');
    expect(dose.finding).toContain('not validated pediatric depth pharmacodynamics');
  });

  it('credits settings prepared before induction when gas exchange is sustained afterward', () => {
    const result = findings(competent).find(
      (entry) => entry.objectiveId === 'ventilate-child-by-weight',
    )!;
    expect(result.outcome).toBe('met');
    expect(result.finding).toContain('160 mL (8.0 mL/kg)');
    expect(result.finding).toContain('final 30 seconds');
  });

  it('does not credit a pediatric-sized setting applied only at the final tick', () => {
    const late: LearnerAction[] = [
      { tick: 20, type: 'ventilator', payload: { tidalVolumeMl: 500, delivering: true } },
      { tick: 100, type: 'bolus', payload: { drugId: 'propofol', amount: 3.5, unit: 'mg/kg' } },
      { tick: 500, type: 'ventilator', payload: { tidalVolumeMl: 160, respiratoryRateBpm: 20 } },
    ];
    const result = findings(late).find(
      (entry) => entry.objectiveId === 'ventilate-child-by-weight',
    )!;
    expect(result.outcome).toBe('partly-met');
    expect(result.finding).toContain('was not recorded');
  });

  it('does not award saturation when no post-induction trace exists', () => {
    const result = objectiveFindings(SCENARIO, [], 0, 0, competent).find(
      (entry) => entry.objectiveId === 'avoid-pediatric-desaturation',
    )!;
    expect(result.outcome).toBe('not-exercised');
  });

  it('ignores refused dose units, exhausted-syringe doses, malformed settings, and nonboolean delivery', () => {
    const hostileBeforeValid: LearnerAction[] = [
      { tick: 1, type: 'bolus', payload: { drugId: 'propofol', amount: 2.5, unit: 'banana' } },
      { tick: 2, type: 'bolus', payload: { drugId: 'propofol', amount: 6, unit: 'mg/kg' } },
      { tick: 20, type: 'ventilator', payload: { tidalVolumeMl: 160, delivering: true } },
      { tick: 30, type: 'ventilator', payload: { tidalVolumeMl: Number.NaN, delivering: 'false' } },
      { tick: 40, type: 'ventilator', payload: { respiratoryRateBpm: 20 } },
      { tick: 100, type: 'bolus', payload: { drugId: 'propofol', amount: 3.5, unit: 'mg/kg' } },
    ];
    const result = findings(hostileBeforeValid);
    expect(result.find((entry) => entry.objectiveId === 'dose-pediatric-propofol')?.outcome).toBe('met');
    expect(result.find((entry) => entry.objectiveId === 'ventilate-child-by-weight')?.outcome).toBe('met');
  });

  it('reports the observed post-induction saturation without generalizing it', () => {
    const result = findings(competent).find(
      (entry) => entry.objectiveId === 'avoid-pediatric-desaturation',
    )!;
    expect(result.outcome).toBe('met');
    expect(result.finding).toContain('bounded 6-year-old respiratory profile');
  });
});
