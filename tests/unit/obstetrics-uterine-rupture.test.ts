import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { UMBILICAL_CORD_PROLAPSE_URGENT_BIRTH_COORDINATION } from '../../src/modules/obstetrics/scenarios/umbilical-cord-prolapse-urgent-birth-coordination';
import { SUSPECTED_UTERINE_RUPTURE_RECOGNITION as SCENARIO } from '../../src/modules/obstetrics/scenarios/suspected-uterine-rupture-recognition';

const ACTIONS = SCENARIO.metadata.objectives.map(({ id }) => id);
const make = (scenario = SCENARIO, seed = 3701) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras = {}) => subject.apply({ tick: subject.tick, type: 'suspected-uterine-rupture-recognition-response', payload: { action, ...extras } as never });

describe('Obstetrics suspected-uterine-rupture contract', () => {
  it('validates and exposes only authored maternal state while every treatment and outcome claim stays false', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 118, systolicMmHg: 96, diastolicMmHg: 58, meanArterialMmHg: 71, respiratoryRateBpm: 24, spo2Percent: 98, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.obstetricsUterineRuptureAssessment).toMatchObject({ supportAtTick: null, authoredSuspectedUterineRupture: true, authoredWorseningMaternalFetalPattern: false });
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); frame = subject.step(); }
    apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 126, systolicMmHg: 86, diastolicMmHg: 50, meanArterialMmHg: 62, respiratoryRateBpm: 26, spo2Percent: 98, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.obstetricsUterineRuptureAssessment).toMatchObject({
      authoredWorseningMaternalFetalPattern: true, patientExaminedByLearner: false,
      fetalMonitoringInterpretedByLearner: false, diagnosisMadeByLearner: false,
      infusionChangedByLearner: false, resuscitationDeliveredByLearner: false,
      drugDoseRouteTargetSelectedByLearner: false, anesthesiaSelectedByLearner: false,
      deliveryPerformedByLearner: false, surgeryPerformedByLearner: false,
      repairSelectedByLearner: false, hysterectomyDeterminedByLearner: false,
      newbornCarePerformedByLearner: false, ruptureOperativelyConfirmed: false,
      hemostasisProven: false, fetalRecoveryProven: false, treatmentEffectProven: false,
      safetyDispositionDetermined: false, fertilityOutcomePredicted: false,
      maternalOutcomePredicted: false, newbornOutcomePredicted: false, outcomePredicted: false,
    });
  });

  it('requires the serial sequence and both elapsed checkpoints', () => {
    const subject = make(SCENARIO, 3710); subject.step();
    apply(subject, ACTIONS[1]); expect(subject.step().equipment.resuscitation.obstetricsUterineRuptureAssessment?.contextAtTick).toBeNull();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsUterineRuptureAssessment?.reassessmentAtTick).toBeNull();
    apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsUterineRuptureAssessment?.reassessmentAtTick).not.toBeNull();
    apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsUterineRuptureAssessment?.handoffAtTick).not.toBeNull();
  });

  it('fails closed for hostile text, adjacent actions, malformed identity, and its neighbor', () => {
    const hostile = make(SCENARIO, 3720); const control = make(SCENARIO, 3720); hostile.step(); control.step();
    for (const action of [null, 7, {}, [], '__proto__', 'x'.repeat(10_000)]) apply(hostile, action, { patientName: 'Patient Example', phone: '555-0100', notes: 'private note' });
    for (const [type, payload] of [
      ['airway-maneuver', { maneuver: 'jaw-thrust' }], ['fluid', { type: 'crystalloid', volumeMl: 2_000 }],
      ['bolus', { drugId: 'oxytocin', amount: 10, unit: 'IU' }], ['infusion', { drugId: 'oxytocin', rate: 20, unit: 'milliunits/min' }],
      ['umbilical-cord-prolapse-urgent-birth-coordination-response', { action: ACTIONS[0] }],
      ['shoulder-dystocia-cognitive-sequence-response', { action: ACTIONS[0] }],
      ['maternal-cardiac-arrest-response', { action: 'activate' }], ['rhythm-change', { target: 'ventricular-fibrillation' }],
      ['inject-crisis', { crisisId: 'cardiac-arrest-shockable' }],
    ] as const) hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|555-0100|private note/);
    const malformed = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'suspected-uterine-rupture-recognition-lookalike' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, { ...SCENARIO.timeline[0]!, id: 'bad-event', type: 'rhythm-change', target: 'pea' } as never] },
    ];
    for (const scenario of malformed) { const subject = make(scenario, 3721); subject.step(); apply(subject, ACTIONS[0]); expect(subject.step().equipment.resuscitation.obstetricsUterineRuptureAssessment).toBeUndefined(); }
    const neighbor = make(UMBILICAL_CORD_PROLAPSE_URGENT_BIRTH_COORDINATION, 3722); const neighborControl = make(UMBILICAL_CORD_PROLAPSE_URGENT_BIRTH_COORDINATION, 3722); neighbor.step(); neighborControl.step(); apply(neighbor, ACTIONS[0]); expect(neighbor.step().equipment.resuscitation).toEqual(neighborControl.step().equipment.resuscitation);
  });
});
