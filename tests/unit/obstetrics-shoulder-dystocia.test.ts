import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { MATERNAL_CARDIAC_ARREST_COORDINATED_RESPONSE } from '../../src/modules/obstetrics/scenarios/maternal-cardiac-arrest-coordinated-response';
import { SHOULDER_DYSTOCIA_COGNITIVE_SEQUENCE as SCENARIO } from '../../src/modules/obstetrics/scenarios/shoulder-dystocia-cognitive-sequence';

const ACTIONS = SCENARIO.metadata.objectives.map(({ id }) => id);
const make = (scenario = SCENARIO, seed = 3501) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras = {}) => subject.apply({ tick: subject.tick, type: 'shoulder-dystocia-cognitive-sequence-response', payload: { action, ...extras } as never });

describe('Obstetrics shoulder-dystocia cognitive-sequence contract', () => {
  it('validates and exposes authored stable maternal state without learner procedure claims', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 104, systolicMmHg: 118, diastolicMmHg: 66, meanArterialMmHg: 83, respiratoryRateBpm: 22, spo2Percent: 98, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.obstetricsShoulderDystociaAssessment).toMatchObject({ supportAtTick: null, authoredShoulderDystocia: true, authoredCaseSpecificDeliveryCompleted: false });
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); frame = subject.step(); }
    apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.equipment.resuscitation.obstetricsShoulderDystociaAssessment).toMatchObject({
      authoredCaseSpecificDeliveryCompleted: true, patientExaminedByLearner: false,
      tractionAppliedByLearner: false, pushingDirectedByLearner: false,
      positionChangedByLearner: false, pressureAppliedByLearner: false,
      maneuverPerformedByLearner: false, episiotomySelectedByLearner: false,
      deliveryPerformedByLearner: false, newbornCarePerformedByLearner: false,
      drugDoseRouteSelectedByLearner: false, procedureSelectedByLearner: false,
      maternalInjuryDetermined: false, newbornInjuryDetermined: false,
      treatmentEffectProven: false, safetyDispositionDetermined: false,
      maternalOutcomePredicted: false, newbornOutcomePredicted: false, outcomePredicted: false,
    });
    // Keep the authored reassessment on the same side of the accessibility
    // announcement threshold so a normal HR does not sound like an alarm.
    expect(frame.state).toMatchObject({ heartRateBpm: 102, meanArterialMmHg: 83, respiratoryRateBpm: 20, spo2Percent: 98 });
  });

  it('requires the serial safety sequence and both elapsed checkpoints', () => {
    const subject = make(SCENARIO, 3510); subject.step();
    apply(subject, ACTIONS[1]); expect(subject.step().equipment.resuscitation.obstetricsShoulderDystociaAssessment?.contextAtTick).toBeNull();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsShoulderDystociaAssessment?.reassessmentAtTick).toBeNull();
    apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsShoulderDystociaAssessment?.reassessmentAtTick).not.toBeNull();
    apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsShoulderDystociaAssessment?.handoffAtTick).not.toBeNull();
  });

  it('fails closed for hostile payloads, procedure actions, malformed identity, and its neighbor', () => {
    const hostile = make(SCENARIO, 3520); const control = make(SCENARIO, 3520); hostile.step(); control.step();
    for (const action of [null, 7, {}, [], '__proto__', 'x'.repeat(10_000)]) apply(hostile, action, { patientName: 'Patient Example', phone: '555-0100', notes: 'private note' });
    for (const [type, payload] of [
      ['airway-maneuver', { maneuver: 'jaw-thrust' }], ['fluid', { type: 'crystalloid', volumeMl: 2_000 }],
      ['blood-product', { product: 'packed-red-blood-cells', units: 2 }], ['bolus', { drugId: 'oxytocin', amount: 10, unit: 'units' }],
      ['postpartum-hemorrhage-uterine-atony-response', { action: 'activate' }], ['maternal-cardiac-arrest-response', { action: ACTIONS[0] }],
      ['rhythm-change', { target: 'ventricular-fibrillation' }], ['inject-crisis', { crisisId: 'cardiac-arrest-shockable' }],
    ] as const) hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|555-0100|private note/);
    const malformed = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'shoulder-dystocia-cognitive-sequence-lookalike' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, { ...SCENARIO.timeline[0]!, id: 'bad-event', type: 'rhythm-change', target: 'pea' } as never] },
    ];
    for (const scenario of malformed) { const subject = make(scenario, 3521); subject.step(); apply(subject, ACTIONS[0]); expect(subject.step().equipment.resuscitation.obstetricsShoulderDystociaAssessment).toBeUndefined(); }
    const neighbor = make(MATERNAL_CARDIAC_ARREST_COORDINATED_RESPONSE, 3522); const neighborControl = make(MATERNAL_CARDIAC_ARREST_COORDINATED_RESPONSE, 3522); neighbor.step(); neighborControl.step(); apply(neighbor, ACTIONS[0]); expect(neighbor.step().equipment.resuscitation).toEqual(neighborControl.step().equipment.resuscitation);
  });
});
