import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { MAGNESIUM_SULFATE_TOXICITY_RECOGNITION } from '../../src/modules/obstetrics/scenarios/magnesium-sulfate-toxicity-recognition';
import { HIGH_NEURAXIAL_BLOCK_OBSTETRIC_COORDINATION as SCENARIO } from '../../src/modules/obstetrics/scenarios/high-neuraxial-block-obstetric-coordination';

const ACTIONS = SCENARIO.metadata.objectives.map(({ id }) => id);
const make = (scenario = SCENARIO, seed = 3901) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras = {}) => subject.apply({ tick: subject.tick, type: 'high-neuraxial-block-obstetric-coordination-response', payload: { action, ...extras } as never });

describe('Obstetrics high-neuraxial-block contract', () => {
  it('validates and exposes only authored state while every treatment and outcome claim stays false', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 52, systolicMmHg: 78, diastolicMmHg: 42, meanArterialMmHg: 54, respiratoryRateBpm: 8, spo2Percent: 96, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.obstetricsHighNeuraxialAssessment).toMatchObject({ supportAtTick: null, authoredHighNeuraxialPattern: true, authoredQualifiedPartialSupport: false });
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); frame = subject.step(); }
    apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 78, systolicMmHg: 104, diastolicMmHg: 64, meanArterialMmHg: 77, respiratoryRateBpm: 14, spo2Percent: 99, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.obstetricsHighNeuraxialAssessment).toMatchObject({
      authoredQualifiedPartialSupport: true, patientExaminedByLearner: false,
      blockAssessedByLearner: false, monitoringInterpretedByLearner: false,
      diagnosisMadeByLearner: false, injectionOrInfusionChangedByLearner: false,
      positionChangedByLearner: false, airwayManagedByLearner: false,
      oxygenDeliveredByLearner: false, ventilationDeliveredByLearner: false,
      circulationSupportedByLearner: false, drugDoseConcentrationRouteRateTargetSelectedByLearner: false,
      anesthesiaSelectedByLearner: false, birthPlanSelectedByLearner: false,
      deliveryPerformedByLearner: false, newbornAssessedByLearner: false,
      procedurePerformedByLearner: false, blockRecessionProven: false,
      fetalRecoveryProven: false, treatmentEffectProven: false,
      newbornSafetyProven: false, awarenessExcluded: false,
      safetyDispositionDetermined: false, maternalOutcomePredicted: false,
      newbornOutcomePredicted: false, outcomePredicted: false,
    });
  });

  it('requires the serial sequence and both elapsed checkpoints', () => {
    const subject = make(SCENARIO, 3910); subject.step();
    apply(subject, ACTIONS[1]); expect(subject.step().equipment.resuscitation.obstetricsHighNeuraxialAssessment?.contextAtTick).toBeNull();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsHighNeuraxialAssessment?.reassessmentAtTick).toBeNull();
    apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsHighNeuraxialAssessment?.reassessmentAtTick).not.toBeNull();
    apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsHighNeuraxialAssessment?.handoffAtTick).not.toBeNull();
  });

  it('fails closed for hostile text, adjacent actions, malformed identity, and its neighbor', () => {
    const hostile = make(SCENARIO, 3920); const control = make(SCENARIO, 3920); hostile.step(); control.step();
    for (const action of [null, 7, {}, [], '__proto__', 'x'.repeat(10_000)]) apply(hostile, action, { patientName: 'Patient Example', phone: '555-0100', notes: 'private note' });
    for (const [type, payload] of [
      ['airway-maneuver', { maneuver: 'jaw-thrust' }], ['fluid', { type: 'crystalloid', volumeMl: 1_000 }],
      ['bolus', { drugId: 'ephedrine', amount: 10, unit: 'mg' }], ['infusion', { drugId: 'phenylephrine', rate: 50, unit: 'mcg/min' }],
      ['high-spinal-response', { action: ACTIONS[0] }], ['magnesium-sulfate-toxicity-recognition-response', { action: ACTIONS[0] }],
      ['rhythm-change', { target: 'ventricular-fibrillation' }], ['inject-crisis', { crisisId: 'high-spinal' }],
    ] as const) hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|555-0100|private note/);
    const malformed = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'high-neuraxial-block-obstetric-coordination-lookalike' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, { ...SCENARIO.timeline[0]!, id: 'bad-event', type: 'rhythm-change', target: 'pea' } as never] },
    ];
    for (const scenario of malformed) { const subject = make(scenario, 3921); subject.step(); apply(subject, ACTIONS[0]); expect(subject.step().equipment.resuscitation.obstetricsHighNeuraxialAssessment).toBeUndefined(); }
    const neighbor = make(MAGNESIUM_SULFATE_TOXICITY_RECOGNITION, 3922); const neighborControl = make(MAGNESIUM_SULFATE_TOXICITY_RECOGNITION, 3922); neighbor.step(); neighborControl.step(); apply(neighbor, ACTIONS[0]); expect(neighbor.step().equipment.resuscitation).toEqual(neighborControl.step().equipment.resuscitation);
  });
});
