import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { SUSPECTED_UTERINE_RUPTURE_RECOGNITION } from '../../src/modules/obstetrics/scenarios/suspected-uterine-rupture-recognition';
import { MAGNESIUM_SULFATE_TOXICITY_RECOGNITION as SCENARIO } from '../../src/modules/obstetrics/scenarios/magnesium-sulfate-toxicity-recognition';

const ACTIONS = SCENARIO.metadata.objectives.map(({ id }) => id);
const make = (scenario = SCENARIO, seed = 3801) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras = {}) => subject.apply({ tick: subject.tick, type: 'magnesium-sulfate-toxicity-recognition-response', payload: { action, ...extras } as never });

describe('Obstetrics magnesium-toxicity contract', () => {
  it('validates and exposes only authored state while every treatment and outcome claim stays false', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 62, systolicMmHg: 112, diastolicMmHg: 68, meanArterialMmHg: 83, respiratoryRateBpm: 9, spo2Percent: 94, coreTemperatureC: 36.7 });
    expect(frame.equipment.resuscitation.obstetricsMagnesiumToxicityAssessment).toMatchObject({ supportAtTick: null, authoredMagnesiumToxicityPattern: true, authoredQualifiedPartialResponse: false });
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); frame = subject.step(); }
    apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 66, systolicMmHg: 110, diastolicMmHg: 68, meanArterialMmHg: 82, respiratoryRateBpm: 12, spo2Percent: 98, coreTemperatureC: 36.7 });
    expect(frame.equipment.resuscitation.obstetricsMagnesiumToxicityAssessment).toMatchObject({
      authoredQualifiedPartialResponse: true, patientExaminedByLearner: false,
      monitoringInterpretedByLearner: false, laboratoryInterpretedByLearner: false,
      diagnosisMadeByLearner: false, infusionChangedByLearner: false,
      airwayManagedByLearner: false, oxygenDeliveredByLearner: false,
      ventilationDeliveredByLearner: false, antidoteSelectedOrDeliveredByLearner: false,
      drugDoseConcentrationRouteRateTargetSelectedByLearner: false,
      seizureCarePerformedByLearner: false, newbornAssessedByLearner: false,
      procedurePerformedByLearner: false, completeReversalProven: false,
      magnesiumClearanceProven: false, renalRecoveryProven: false,
      treatmentEffectProven: false, newbornSafetyProven: false,
      safetyDispositionDetermined: false, maternalOutcomePredicted: false,
      newbornOutcomePredicted: false, outcomePredicted: false,
    });
  });

  it('requires the serial sequence and both elapsed checkpoints', () => {
    const subject = make(SCENARIO, 3810); subject.step();
    apply(subject, ACTIONS[1]); expect(subject.step().equipment.resuscitation.obstetricsMagnesiumToxicityAssessment?.contextAtTick).toBeNull();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsMagnesiumToxicityAssessment?.reassessmentAtTick).toBeNull();
    apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsMagnesiumToxicityAssessment?.reassessmentAtTick).not.toBeNull();
    apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsMagnesiumToxicityAssessment?.handoffAtTick).not.toBeNull();
  });

  it('fails closed for hostile text, adjacent actions, malformed identity, and its neighbor', () => {
    const hostile = make(SCENARIO, 3820); const control = make(SCENARIO, 3820); hostile.step(); control.step();
    for (const action of [null, 7, {}, [], '__proto__', 'x'.repeat(10_000)]) apply(hostile, action, { patientName: 'Patient Example', phone: '555-0100', notes: 'private note' });
    for (const [type, payload] of [
      ['airway-maneuver', { maneuver: 'jaw-thrust' }], ['fluid', { type: 'crystalloid', volumeMl: 1_000 }],
      ['bolus', { drugId: 'calcium-gluconate', amount: 1, unit: 'g' }], ['infusion', { drugId: 'magnesium-sulfate', rate: 2, unit: 'g/hour' }],
      ['suspected-uterine-rupture-recognition-response', { action: ACTIONS[0] }],
      ['eclampsia-first-seizure-response', { action: ACTIONS[0] }], ['rhythm-change', { target: 'ventricular-fibrillation' }],
      ['inject-crisis', { crisisId: 'high-spinal' }],
    ] as const) hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|555-0100|private note/);
    const malformed = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'magnesium-sulfate-toxicity-recognition-lookalike' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, { ...SCENARIO.timeline[0]!, id: 'bad-event', type: 'rhythm-change', target: 'pea' } as never] },
    ];
    for (const scenario of malformed) { const subject = make(scenario, 3821); subject.step(); apply(subject, ACTIONS[0]); expect(subject.step().equipment.resuscitation.obstetricsMagnesiumToxicityAssessment).toBeUndefined(); }
    const neighbor = make(SUSPECTED_UTERINE_RUPTURE_RECOGNITION, 3822); const neighborControl = make(SUSPECTED_UTERINE_RUPTURE_RECOGNITION, 3822); neighbor.step(); neighborControl.step(); apply(neighbor, ACTIONS[0]); expect(neighbor.step().equipment.resuscitation).toEqual(neighborControl.step().equipment.resuscitation);
  });
});
