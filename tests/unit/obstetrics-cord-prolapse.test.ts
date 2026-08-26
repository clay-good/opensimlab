import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { SHOULDER_DYSTOCIA_COGNITIVE_SEQUENCE } from '../../src/modules/obstetrics/scenarios/shoulder-dystocia-cognitive-sequence';
import { UMBILICAL_CORD_PROLAPSE_URGENT_BIRTH_COORDINATION as SCENARIO } from '../../src/modules/obstetrics/scenarios/umbilical-cord-prolapse-urgent-birth-coordination';

const ACTIONS = SCENARIO.metadata.objectives.map(({ id }) => id);
const make = (scenario = SCENARIO, seed = 3601) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras = {}) => subject.apply({ tick: subject.tick, type: 'umbilical-cord-prolapse-urgent-birth-coordination-response', payload: { action, ...extras } as never });

describe('Obstetrics umbilical-cord-prolapse contract', () => {
  it('validates and exposes stable maternal state with every physical and outcome claim false', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 96, systolicMmHg: 122, diastolicMmHg: 72, meanArterialMmHg: 89, respiratoryRateBpm: 20, spo2Percent: 99, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.obstetricsCordProlapseAssessment).toMatchObject({ supportAtTick: null, authoredCordProlapse: true, authoredPersistentFetalCompromise: false });
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); frame = subject.step(); }
    apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.equipment.resuscitation.obstetricsCordProlapseAssessment).toMatchObject({
      authoredPersistentFetalCompromise: true, patientExaminedByLearner: false,
      fetalMonitoringInterpretedByLearner: false, diagnosisMadeByLearner: false,
      cordHandledByLearner: false, cordReplacementAttemptedByLearner: false,
      presentingPartElevatedByLearner: false, bladderFilledByLearner: false,
      positionChangedByLearner: false, drugDoseRouteSelectedByLearner: false,
      anesthesiaSelectedByLearner: false, birthModeSelectedByLearner: false,
      deliveryPerformedByLearner: false, newbornCarePerformedByLearner: false,
      procedureSelectedByLearner: false, fetalRecoveryProven: false,
      treatmentEffectProven: false, safetyDispositionDetermined: false,
      maternalOutcomePredicted: false, newbornOutcomePredicted: false, outcomePredicted: false,
    });
  });

  it('requires the serial sequence and both elapsed checkpoints', () => {
    const subject = make(SCENARIO, 3610); subject.step();
    apply(subject, ACTIONS[1]); expect(subject.step().equipment.resuscitation.obstetricsCordProlapseAssessment?.contextAtTick).toBeNull();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsCordProlapseAssessment?.reassessmentAtTick).toBeNull();
    apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsCordProlapseAssessment?.reassessmentAtTick).not.toBeNull();
    apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsCordProlapseAssessment?.handoffAtTick).not.toBeNull();
  });

  it('fails closed for hostile text, adjacent actions, malformed identity, and its neighbor', () => {
    const hostile = make(SCENARIO, 3620); const control = make(SCENARIO, 3620); hostile.step(); control.step();
    for (const action of [null, 7, {}, [], '__proto__', 'x'.repeat(10_000)]) apply(hostile, action, { patientName: 'Patient Example', phone: '555-0100', notes: 'private note' });
    for (const [type, payload] of [
      ['airway-maneuver', { maneuver: 'jaw-thrust' }], ['fluid', { type: 'crystalloid', volumeMl: 2_000 }],
      ['bolus', { drugId: 'terbutaline', amount: 0.25, unit: 'mg' }], ['shoulder-dystocia-cognitive-sequence-response', { action: ACTIONS[0] }],
      ['maternal-cardiac-arrest-response', { action: 'activate' }], ['rhythm-change', { target: 'ventricular-fibrillation' }],
      ['inject-crisis', { crisisId: 'cardiac-arrest-shockable' }],
    ] as const) hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|555-0100|private note/);
    const malformed = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'umbilical-cord-prolapse-urgent-birth-coordination-lookalike' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, { ...SCENARIO.timeline[0]!, id: 'bad-event', type: 'rhythm-change', target: 'pea' } as never] },
    ];
    for (const scenario of malformed) { const subject = make(scenario, 3621); subject.step(); apply(subject, ACTIONS[0]); expect(subject.step().equipment.resuscitation.obstetricsCordProlapseAssessment).toBeUndefined(); }
    const neighbor = make(SHOULDER_DYSTOCIA_COGNITIVE_SEQUENCE, 3622); const neighborControl = make(SHOULDER_DYSTOCIA_COGNITIVE_SEQUENCE, 3622); neighbor.step(); neighborControl.step(); apply(neighbor, ACTIONS[0]); expect(neighbor.step().equipment.resuscitation).toEqual(neighborControl.step().equipment.resuscitation);
  });
});
