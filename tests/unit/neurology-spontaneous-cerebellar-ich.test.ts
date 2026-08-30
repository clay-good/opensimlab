import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay-engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import type { LearnerAction } from '@platform/kernel/protocol';
import { SPONTANEOUS_CEREBELLAR_INTRACEREBRAL_HEMORRHAGE as SCENARIO } from '../../src/modules/neurology/scenarios/spontaneous-cerebellar-intracerebral-hemorrhage';
import { BASILAR_ARTERY_OCCLUSION_ESCALATION } from '../../src/modules/neurology/scenarios/basilar-artery-occlusion-escalation';
import { MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE } from '../../src/modules/neurology/scenarios/minor-nondisabling-acute-ischemic-stroke';
import { INTRACRANIAL_HEMORRHAGE_DETERIORATION } from '../../src/modules/emergency-medicine/scenarios/intracranial-hemorrhage-deterioration';
import { INTRACRANIAL_HYPERTENSION } from '../../src/modules/critical-care/scenarios/intracranial-hypertension';

const ACTIONS = [
  'reconcile-neurology-cerebellar-ich-clock-deficit-alertness-and-whole-patient',
  'review-neurology-cerebellar-ich-imaging-location-causes-and-immediate-threats',
  'recognize-neurology-cerebellar-ich-posterior-fossa-escalation-boundary',
  'activate-neurology-cerebellar-ich-qualified-neurocritical-neurosurgical-and-airway-ownership',
  'review-neurology-cerebellar-ich-strict-later-neurologic-and-airway-trajectory',
  'handoff-neurology-cerebellar-ich-imaging-expansion-etiology-and-active-risk',
] as const;
const responseType = 'spontaneous-cerebellar-intracerebral-hemorrhage-response';
const make = (scenario = SCENARIO, seed = 1703) =>
  new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown,
  extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick,
  type: responseType, payload: { action: action as never, ...extras } as never });

describe('Neurology spontaneous cerebellar ICH engine contract', () => {
  it('validates the exact narrative-only fixture and two targets', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 67, sex: 'female', weightKg: 68 });
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual([
      'spontaneous-cerebellar-intracerebral-hemorrhage-reassessment',
      'spontaneous-cerebellar-intracerebral-hemorrhage-reassessment-boundary',
    ]);
    expect(SCENARIO.timeline.every(({ type }) => type === 'narrative')).toBe(true);
  });

  it('reveals fixed worsening only after strict later review without treatment state', () => {
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 78, respiratoryRateBpm: 18,
      systolicMmHg: 168, diastolicMmHg: 92, meanArterialMmHg: 117,
      spo2Percent: 97, coreTemperatureC: 36.7 });
    expect(frame.equipment.resuscitation.neurologyCerebellarIchAssessment).toMatchObject({
      trajectoryAtTick: null, imagingAtTick: null, boundaryAtTick: null,
      ownershipAtTick: null, laterAtTick: null, handoffAtTick: null,
      initialPulsePresent: true, spontaneousBreathingAuthored: true,
      cerebellarDeficitAuthored: true, initialAlertnessAuthored: true,
      cerebellarIchAuthored: true, fourthVentricleEffacementAuthored: true,
      posteriorFossaEscalationBoundaryAuthored: false,
      qualifiedNeurocriticalOwnershipActive: false,
      qualifiedNeurosurgicalOwnershipActive: false,
      qualifiedAirwayCapableOwnershipActive: false,
      laterDeteriorationAuthored: false, obstructiveHydrocephalusAuthored: false,
      brainstemCompressionAuthored: false,
    });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 78, meanArterialMmHg: 117,
      respiratoryRateBpm: 18, spo2Percent: 97 });
    apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 82, respiratoryRateBpm: 20,
      systolicMmHg: 176, diastolicMmHg: 96, meanArterialMmHg: 123,
      spo2Percent: 95, coreTemperatureC: 36.7 });
    expect(frame.equipment.resuscitation).toMatchObject({ cardiacArrestActive: false,
      chestCompressionsActive: false, arrestEpinephrineTotalMg: 0,
      defibrillationShockCount: 0, roscAtTick: null,
      neurologyCerebellarIchAssessment: {
        posteriorFossaEscalationBoundaryAuthored: true,
        qualifiedNeurocriticalOwnershipActive: true,
        qualifiedNeurosurgicalOwnershipActive: true,
        qualifiedAirwayCapableOwnershipActive: true,
        laterDeteriorationAuthored: true, obstructiveHydrocephalusAuthored: true,
        brainstemCompressionAuthored: true,
        patientHistoryTakenByLearner: false, patientExaminedByLearner: false,
        neurologicExamPerformedByLearner: false, scoreCalculatedByLearner: false,
        hematomaVolumeCalculatedByLearner: false, clockDeterminedByLearner: false,
        glucoseAcquiredByLearner: false, bloodPressureAcquiredByLearner: false,
        testAcquiredByLearner: false, testInterpretedByLearner: false,
        imagingAcquiredByLearner: false, imagingInterpretedByLearner: false,
        diagnosisMadeByLearner: false, etiologyDeterminedByLearner: false,
        anticoagulantExposureExcludedByLearner: false,
        reversalEligibilityDeterminedByLearner: false,
        reversalProductSelectedByLearner: false, drugSelectedByLearner: false,
        doseSelectedByLearner: false, routeSelectedByLearner: false,
        accessPlacedByLearner: false, medicationDeliveredByLearner: false,
        bloodPressureTargetSelectedByLearner: false,
        airwayDeviceSelectedByLearner: false, airwayProcedurePerformedByLearner: false,
        drainSelectedByLearner: false, surgerySelectedByLearner: false,
        deviceSelectedByLearner: false, procedureSelectedByLearner: false,
        procedurePerformedByLearner: false, treatmentDeliveredByLearner: false,
        etiologyProven: false, anticoagulantExposureExcluded: false,
        futureExpansionExcluded: false, herniationExcluded: false,
        treatmentEffectProven: false, durablePressureControlProven: false,
        durableAirwayProtectionProven: false, neurologicRecoveryProven: false,
        dischargeReadinessProven: false, dispositionDetermined: false,
        prognosisPredicted: false, outcomePredicted: false,
      },
    });
  });

  it('enforces every prerequisite and both elapsed gates without mutation', () => {
    const cases: readonly [readonly string[], string][] = [
      [[], ACTIONS[1]], [[], ACTIONS[2]], [[], ACTIONS[3]], [[], ACTIONS[4]], [[], ACTIONS[5]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]],
    ];
    for (const [prepare, attempted] of cases) {
      const subject = make(SCENARIO, 1704); const control = make(SCENARIO, 1704);
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, attempted);
      expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 1704); const control = make(SCENARIO, 1704);
    subject.step(); control.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(control, action); }
    apply(subject, ACTIONS[4]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[4]); apply(control, ACTIONS[4]); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neurologyCerebellarIchAssessment)
      .toMatchObject({ trajectoryAtTick: 1, imagingAtTick: 1, boundaryAtTick: 1,
        ownershipAtTick: 1, laterAtTick: 2, handoffAtTick: 3 });
  });

  it('refuses malformed, PII-bearing, reversal, BP, ICP, airway, and procedure shortcuts', () => {
    const subject = make(SCENARIO, 1705); const control = make(SCENARIO, 1705);
    subject.step(); control.step();
    for (const malformed of [undefined, null, [],
      { type: responseType, payload: null }, { type: responseType, payload: [] },
      { type: responseType, payload: Object.create(null) }]) subject.apply(malformed as never);
    const secrets = ['Patient Example', '312-555-0199', '101 Example Street', 'private note'];
    for (const malformed of [undefined, null, [], {}, Object.create(null), '__proto__',
      'constructor', 'record-warfarin-reversal-intent', 'record-smooth-ich-pressure-control',
      'activate-individualized-hyperosmolar-rescue', 'select-evd', 'declare-stable'])
      apply(subject, malformed, { patientName: secrets[0], phone: secrets[1],
        address: secrets[2], notes: secrets[3] });
    for (const [type, payload] of [
      ['intracranial-hemorrhage-response', { action: 'record-warfarin-reversal-intent' }],
      ['intracranial-hypertension-response', { action: 'activate-individualized-hyperosmolar-rescue' }],
      ['acute-ischemic-stroke-response', { action: 'record-tenecteplase-20-mg-intent' }],
      ['bolus', { drugId: 'vitamin-k', amount: 10, unit: 'mg' }],
      ['infusion', { drugId: 'nicardipine', rate: 5, unit: 'mg/h' }],
      ['airway-device', { deviceId: 'ett' }], ['laryngoscopy', {}],
      ['fluid', { fluidId: 'hypertonic-saline', volumeMl: 250 }],
      ['chest-compressions', { active: true }], ['defibrillation', { energyJ: 200 }],
      ['rhythm-change', { target: 'pea' }],
    ] as const) subject.apply({ tick: -999, type, payload: payload as never });
    const refused = subject.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    for (const secret of secrets) expect(JSON.stringify(refused.events)).not.toContain(secret);
  });

  it('preserves duplicate ticks, exact evidence prefixes, and deterministic replay', () => {
    const subject = make(SCENARIO, 1706); const events = [...subject.step().events];
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(subject, action); }
    let frame = subject.step(); events.push(...frame.events);
    apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
    frame = subject.step(); events.push(...frame.events);
    apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
    frame = subject.step(); events.push(...frame.events);
    expect(frame.equipment.resuscitation.neurologyCerebellarIchAssessment).toMatchObject({
      trajectoryAtTick: 1, imagingAtTick: 1, boundaryAtTick: 1, ownershipAtTick: 1,
      laterAtTick: 2, handoffAtTick: 3,
    });
    expect(events.map(({ eventId }) => eventId).filter((id) => id.startsWith('neurology-cerebellar-ich-')))
      .toEqual(expect.arrayContaining([
        expect.stringMatching(/^neurology-cerebellar-ich-trajectory-reconciled-\d+$/),
        expect.stringMatching(/^neurology-cerebellar-ich-imaging-and-threats-reviewed-\d+$/),
        expect.stringMatching(/^neurology-cerebellar-ich-posterior-fossa-boundary-recognized-\d+$/),
        expect.stringMatching(/^neurology-cerebellar-ich-qualified-ownership-activated-\d+$/),
        expect.stringMatching(/^neurology-cerebellar-ich-later-trajectory-reviewed-\d+$/),
        expect.stringMatching(/^neurology-cerebellar-ich-active-risk-handoff-recorded-\d+$/),
      ]));
    const actions: LearnerAction[] = ACTIONS.map((action, index) => ({
      tick: index < 4 ? 0 : index - 3, type: responseType, payload: { action },
    }));
    const options = { scenario: SCENARIO, seed: 1706, practiceRegion: 'US', ticks: 11 };
    const first = replay(actions, options);
    expect(replay(actions, options)).toEqual(first);
    expect(first.at(-1)?.state).toMatchObject({ heartRateBpm: 82, respiratoryRateBpm: 20,
      systolicMmHg: 176, diastolicMmHg: 96, meanArterialMmHg: 123,
      spo2Percent: 95, coreTemperatureC: 36.7 });
  });

  it('requires exact metadata and both targets and stays isolated from adjacent labs', () => {
    const wrong = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'cerebellar-ich' } },
      ...['spontaneous-cerebellar-intracerebral-hemorrhage-reassessment',
        'spontaneous-cerebellar-intracerebral-hemorrhage-reassessment-boundary'].map((target) => ({
        ...SCENARIO, timeline: SCENARIO.timeline.map((event) => event.target === target
          ? { ...event, target: `${target}-suffix` } : event),
      })),
      INTRACRANIAL_HEMORRHAGE_DETERIORATION, INTRACRANIAL_HYPERTENSION,
      BASILAR_ARTERY_OCCLUSION_ESCALATION, MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE,
    ];
    for (const scenario of wrong) {
      const subject = make(scenario, 1707); const control = make(scenario, 1707);
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation.neurologyCerebellarIchAssessment).toBeUndefined();
    }
  });
});
