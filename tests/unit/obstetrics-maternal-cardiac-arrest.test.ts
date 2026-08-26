import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { PERSISTENT_VF_CARDIAC_ARREST } from '@anesthesia/scenarios/persistent-vf-cardiac-arrest';
import { PEA_ARREST } from '../../src/modules/emergency-medicine/scenarios/pea-arrest';
import { SUSPECTED_AMNIOTIC_FLUID_EMBOLISM_PATTERN } from '../../src/modules/obstetrics/scenarios/suspected-amniotic-fluid-embolism-pattern';
import { MATERNAL_CARDIAC_ARREST_COORDINATED_RESPONSE as SCENARIO } from '../../src/modules/obstetrics/scenarios/maternal-cardiac-arrest-coordinated-response';

const ACTIONS = SCENARIO.metadata.objectives.map(({ id }) => id);
const make = (scenario = SCENARIO, seed = 3401) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras = {}) => subject.apply({ tick: subject.tick, type: 'maternal-cardiac-arrest-response', payload: { action, ...extras } as never });

describe('Obstetrics maternal cardiac-arrest contract', () => {
  it('validates and exposes fixed arrest state without live arrest treatment state', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 48, systolicMmHg: 0, diastolicMmHg: 0, meanArterialMmHg: 0, respiratoryRateBpm: 0, spo2Percent: 0, coreTemperatureC: 36.8 });
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining([
      'systolicMmHg', 'diastolicMmHg', 'meanArterialMmHg', 'spo2Percent', 'etco2MmHg',
    ]));
    expect(frame.alarms).toEqual([]);
    expect(frame.events.filter((event) => event.category === 'alarm')).toEqual([]);
    expect(frame.equipment.resuscitation.obstetricsMaternalArrestAssessment).toMatchObject({ supportAtTick: null, authoredMaternalCardiacArrest: true, qualifiedStandardResuscitationAuthored: true });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action); frame = subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 42, systolicMmHg: 0, diastolicMmHg: 0, meanArterialMmHg: 0, respiratoryRateBpm: 0, spo2Percent: 0 });
    expect(frame.equipment.resuscitation.obstetricsMaternalArrestAssessment).toMatchObject({
      authoredMaternalCardiacArrest: true, learnerAssessedResponsivenessBreathingOrPulse: false,
      learnerInterpretedRhythmOrMonitoring: false, cprPerformedByLearner: false,
      uterineDisplacementPerformedByLearner: false, airwayOrVentilationSelectedByLearner: false,
      accessSelectedByLearner: false, drugDoseRouteOrTargetSelectedByLearner: false,
      shockOrPacingSelectedByLearner: false, fetalMonitorOperatedByLearner: false,
      causeDiagnosedByLearner: false, causeExcludedByLearner: false,
      deliveryEligibilityDeterminedByLearner: false, deliverySelectedByLearner: false,
      deliveryPerformedByLearner: false, deliveryCompleted: false, roscOccurred: false,
      treatmentEffectProven: false, terminationDecisionMade: false,
      safetyDispositionDetermined: false, maternalOutcomePredicted: false,
      newbornOutcomePredicted: false, outcomePredicted: false,
    });
    expect(frame.equipment.resuscitation).toMatchObject({ cardiacArrestActive: false, chestCompressionsActive: false, chestCompressionSeconds: 0, arrestEpinephrineTotalMg: 0, defibrillationShockCount: 0, roscAtTick: null, crystalloidTotalMl: 0, epinephrineTotalMicrograms: 0 });
  });

  it('requires activation first, accepts three parallel reviews, and enforces elapsed checkpoints', () => {
    for (const [seed, order] of [[3410, [1, 2, 3]], [3411, [1, 3, 2]], [3412, [2, 1, 3]], [3413, [2, 3, 1]], [3414, [3, 1, 2]], [3415, [3, 2, 1]]] as const) {
      const subject = make(SCENARIO, seed); subject.step(); apply(subject, ACTIONS[1]);
      expect(subject.step().equipment.resuscitation.obstetricsMaternalArrestAssessment?.contextAtTick).toBeNull();
      apply(subject, ACTIONS[0]); for (const index of order) apply(subject, ACTIONS[index]);
      apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsMaternalArrestAssessment?.reassessmentAtTick).toBeNull();
      apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsMaternalArrestAssessment?.reassessmentAtTick).not.toBeNull();
      apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsMaternalArrestAssessment?.handoffAtTick).not.toBeNull();
    }
  });

  it('fails closed for hostile payloads, live arrest actions, malformed identity, and neighbors', () => {
    const hostile = make(SCENARIO, 3420); const control = make(SCENARIO, 3420); hostile.step(); control.step();
    for (const action of [null, 7, {}, [], '__proto__', 'x'.repeat(10_000)]) apply(hostile, action, { patientName: 'Patient Example', phone: '555-0100', notes: 'private note' });
    for (const [type, payload] of [
      ['rhythm', { rhythm: 'sinus' }], ['rhythm-change', { target: 'ventricular-fibrillation' }],
      ['inject-crisis', { crisisId: 'cardiac-arrest-shockable' }], ['inject-crisis', { crisisId: 'cardiac-arrest-non-shockable' }],
      ['chest-compressions', { active: true }], ['cardiac-arrest-epinephrine', { doseMg: 1, route: 'iv' }],
      ['defibrillation', { energyJ: 200, waveform: 'biphasic' }], ['ventilator', { fio2: 1 }],
      ['airway-maneuver', { maneuver: 'jaw-thrust' }], ['fluid', { type: 'crystalloid', volumeMl: 2_000 }],
      ['blood-product', { product: 'packed-red-blood-cells', units: 2 }], ['suspected-amniotic-fluid-embolism-pattern-response', { action: 'activate-obstetrics-afe-coordinated-obstetric-anesthesia-critical-care-cardiopulmonary-hemorrhage-newborn-and-dignity-response' }],
      ['pediatric-bradycardic-arrest-response', { action: 'activate' }], ['post-arrest-temperature-response', { action: 'activate' }],
    ] as const) hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|555-0100|private note/);

    const malformed = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'maternal-cardiac-arrest-coordinated-response-lookalike' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, { ...SCENARIO.timeline[0]!, id: 'bad-event', type: 'rhythm-change', target: 'pea' } as never] },
    ];
    for (const scenario of malformed) { const subject = make(scenario, 3421); subject.step(); apply(subject, ACTIONS[0]); expect(subject.step().equipment.resuscitation.obstetricsMaternalArrestAssessment).toBeUndefined(); }

    for (const [seed, scenario] of [[3422, PEA_ARREST], [3423, PERSISTENT_VF_CARDIAC_ARREST], [3424, SUSPECTED_AMNIOTIC_FLUID_EMBOLISM_PATTERN]] as const) {
      const subject = make(scenario, seed); const neighborControl = make(scenario, seed); subject.step(); neighborControl.step(); apply(subject, ACTIONS[0]); expect(subject.step().equipment.resuscitation).toEqual(neighborControl.step().equipment.resuscitation);
    }
  });
});
