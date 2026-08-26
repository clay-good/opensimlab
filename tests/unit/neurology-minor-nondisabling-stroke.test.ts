import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { LearnerAction } from '@platform/kernel/protocol';
import { MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE as SCENARIO } from '../../src/modules/neurology/scenarios/minor-nondisabling-acute-ischemic-stroke';
import { ACUTE_ISCHEMIC_STROKE } from '../../src/modules/emergency-medicine/scenarios/acute-ischemic-stroke';
import { INTRACRANIAL_HEMORRHAGE_DETERIORATION } from '../../src/modules/emergency-medicine/scenarios/intracranial-hemorrhage-deterioration';
import { INTRACRANIAL_HYPERTENSION } from '../../src/modules/critical-care/scenarios/intracranial-hypertension';
import { STATUS_EPILEPTICUS } from '../../src/modules/critical-care/scenarios/status-epilepticus';

const ACTIONS = [
  'reconcile-neurology-minor-stroke-clock-deficit-function-and-whole-patient',
  'review-neurology-minor-stroke-imaging-mimics-and-immediate-threats',
  'recognize-neurology-minor-nondisabling-stroke-boundary-without-score-alone',
  'record-neurology-minor-stroke-qualified-antiplatelet-and-surveillance-intent',
  'review-neurology-minor-stroke-later-neurologic-trajectory',
  'handoff-neurology-minor-stroke-etiology-recurrence-and-secondary-prevention-risk',
] as const;
const responseType = 'minor-nondisabling-acute-ischemic-stroke-response';
const make = (scenario = SCENARIO, seed = 1701) =>
  new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown,
  extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick,
  type: responseType, payload: { action: action as never, ...extras } as never });

describe('Neurology minor nondisabling acute ischemic stroke engine contract', () => {
  it('validates the exact bounded adult fixture and narrative-only contract', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 62, sex: 'female', heightCm: 165,
      weightKg: 68, respiratory: { profile: 'healthy' } });
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual([
      'minor-nondisabling-acute-ischemic-stroke-reassessment',
      'minor-nondisabling-acute-ischemic-stroke-reassessment-boundary',
    ]);
    expect(SCENARIO.timeline.every(({ type }) => type === 'narrative')).toBe(true);
  });

  it('exposes fixed initial and later states without learner treatment or outcome claims', () => {
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 78, respiratoryRateBpm: 16,
      systolicMmHg: 156, diastolicMmHg: 88, meanArterialMmHg: 111,
      spo2Percent: 98, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.neurologyMinorStrokeAssessment).toMatchObject({
      initialPulsePresent: true, spontaneousBreathingAuthored: true,
      persistentFocalDeficitAuthored: true, individualizedFunctionIntactAuthored: true,
      fixedImagingAuthored: true, suppliedGlucoseAuthored: true,
      nondisablingBoundaryAuthored: false,
      qualifiedAntiplateletStrategyIntentActive: false,
      qualifiedNeurologicSurveillanceActive: false,
      laterPersistentDeficitWithoutSpreadAuthored: false,
    });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 76, respiratoryRateBpm: 16,
      systolicMmHg: 150, diastolicMmHg: 84, meanArterialMmHg: 106,
      spo2Percent: 98, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation).toMatchObject({ cardiacArrestActive: false,
      chestCompressionsActive: false, arrestEpinephrineTotalMg: 0,
      defibrillationShockCount: 0, roscAtTick: null,
      neurologyMinorStrokeAssessment: {
        nondisablingBoundaryAuthored: true,
        qualifiedAntiplateletStrategyIntentActive: true,
        qualifiedNeurologicSurveillanceActive: true,
        laterPersistentDeficitWithoutSpreadAuthored: true,
        patientHistoryTakenByLearner: false, patientExaminedByLearner: false,
        neurologicExamPerformedByLearner: false, scoreCalculatedByLearner: false,
        disabilityAdjudicatedByLearner: false, clockDeterminedByLearner: false,
        glucoseAcquiredByLearner: false, bloodPressureAcquiredByLearner: false,
        testAcquiredByLearner: false, testInterpretedByLearner: false,
        imagingAcquiredByLearner: false, imagingInterpretedByLearner: false,
        diagnosisMadeByLearner: false, strokeMimicExcluded: false,
        thrombolysisEligibilityDeterminedByLearner: false,
        antiplateletEligibilityDeterminedByLearner: false,
        productSelectedByLearner: false, combinationSelectedByLearner: false,
        drugSelectedByLearner: false, doseSelectedByLearner: false,
        durationSelectedByLearner: false, concentrationSelectedByLearner: false,
        routeSelectedByLearner: false, accessPlacedByLearner: false,
        prescriptionCreatedByLearner: false, medicationPreparedByLearner: false,
        medicationDeliveredByLearner: false, bloodPressureTargetSelectedByLearner: false,
        reperfusionSelectedByLearner: false, reperfusionPerformedByLearner: false,
        deviceSelectedByLearner: false, procedurePerformedByLearner: false,
        swallowAssessmentPerformedByLearner: false, dietSelectedByLearner: false,
        rehabilitationSelectedByLearner: false, dispositionDeterminedByLearner: false,
        treatmentDeliveredByLearner: false, strokeMechanismProven: false,
        etiologyProven: false, treatmentEffectProven: false,
        infarctResolutionProven: false, hemorrhagicTransformationExcluded: false,
        deteriorationExcluded: false, durableNeurologicStabilityProven: false,
        completeRecoveryProven: false, lowRecurrenceRiskProven: false,
        dischargeReadinessProven: false, dispositionDetermined: false,
        prognosisPredicted: false, outcomePredicted: false,
      },
    });
  });

  it('enforces every serial prerequisite without state or assessment mutation', () => {
    const cases: readonly [readonly string[], string][] = [
      [[], ACTIONS[1]], [[], ACTIONS[2]], [[], ACTIONS[3]], [[], ACTIONS[4]], [[], ACTIONS[5]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]],
    ];
    for (const [prepare, attempted] of cases) {
      const subject = make(SCENARIO, 1702); const control = make(SCENARIO, 1702);
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, attempted);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    }
  });

  it('requires separate elapsed ticks for later review and handoff', () => {
    const subject = make(SCENARIO, 1703); const control = make(SCENARIO, 1703);
    subject.step(); control.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(control, action); }
    apply(subject, ACTIONS[4]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[4]); apply(control, ACTIONS[4]); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neurologyMinorStrokeAssessment)
      .toMatchObject({ trajectoryAtTick: 1, threatsAtTick: 1, boundaryAtTick: 1,
        intentAtTick: 1, laterAtTick: 2, handoffAtTick: 3 });
  });

  it('refuses malformed, prototype, PII-bearing, adult-stroke, drug, and procedure shortcuts', () => {
    const subject = make(SCENARIO, 1704); const control = make(SCENARIO, 1704);
    subject.step(); control.step();
    for (const malformed of [undefined, null, [],
      { type: responseType, payload: null }, { type: responseType, payload: [] },
      { type: responseType, payload: Object.create(null) }]) subject.apply(malformed as never);
    const secrets = ['Patient Example', '312-555-0199', '101 Example Street',
      'verbatim private history'];
    for (const malformed of [undefined, null, [], {}, Object.create(null), '__proto__',
      'constructor', 'record-tenecteplase-20-mg-intent', 'activate-thrombectomy-transfer',
      'select-aspirin-dose', 'declare-complete-recovery']) apply(subject, malformed,
      { patientName: secrets[0], phone: secrets[1], address: secrets[2], notes: secrets[3] });
    for (const [type, payload] of [
      ['acute-ischemic-stroke-response', { action: 'record-tenecteplase-20-mg-intent' }],
      ['intracranial-hemorrhage-response', { action: 'review-ich-deterioration' }],
      ['intracranial-hypertension-response', { action: 'recognize' }],
      ['bolus', { drugId: 'tenecteplase', amount: 20, unit: 'mg' }],
      ['infusion', { drugId: 'nicardipine', rate: 5, unit: 'mg/h' }],
      ['fluid', { fluidId: 'balanced-crystalloid', volumeMl: 1000 }],
      ['airway-device', { deviceId: 'ett' }], ['laryngoscopy', {}],
      ['chest-compressions', { active: true }], ['defibrillation', { energyJ: 200 }],
      ['rhythm-change', { target: 'pea' }],
    ] as const) subject.apply({ tick: -999, type, payload: payload as never });
    const refused = subject.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    const serialized = JSON.stringify(refused.events);
    for (const secret of secrets) expect(serialized).not.toContain(secret);
  });

  it('preserves first accepted duplicate ticks and replays deterministically', () => {
    const subject = make(SCENARIO, 1705); subject.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(subject, action); }
    subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
    subject.step(); apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neurologyMinorStrokeAssessment)
      .toMatchObject({ trajectoryAtTick: 1, threatsAtTick: 1, boundaryAtTick: 1,
        intentAtTick: 1, laterAtTick: 2, handoffAtTick: 3 });

    const actions: LearnerAction[] = ACTIONS.map((action, index) => ({
      tick: index < 4 ? 0 : index - 3, type: responseType, payload: { action },
    }));
    const options = { scenario: SCENARIO, seed: 1705, practiceRegion: 'US', ticks: 11 };
    const first = replay(actions, options);
    expect(replay(actions, options)).toEqual(first);
    expect(first.at(-1)?.state).toMatchObject({ heartRateBpm: 76, respiratoryRateBpm: 16,
      systolicMmHg: 150, diastolicMmHg: 84, meanArterialMmHg: 106,
      spo2Percent: 98, coreTemperatureC: 36.8 });
  });

  it('emits only the six exact structured evidence prefixes for accepted actions', () => {
    const subject = make(SCENARIO, 1706); const events = [...subject.step().events];
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    let frame = subject.step(); events.push(...frame.events); apply(subject, ACTIONS[4]);
    frame = subject.step(); events.push(...frame.events); apply(subject, ACTIONS[5]);
    frame = subject.step(); events.push(...frame.events);
    expect(events.map(({ eventId }) => eventId).filter((id) => id.startsWith('neurology-minor-stroke-')))
      .toEqual(expect.arrayContaining([
        expect.stringMatching(/^neurology-minor-stroke-trajectory-reconciled-\d+$/),
        expect.stringMatching(/^neurology-minor-stroke-imaging-and-threats-reviewed-\d+$/),
        expect.stringMatching(/^neurology-minor-stroke-nondisabling-boundary-recognized-\d+$/),
        expect.stringMatching(/^neurology-minor-stroke-qualified-strategy-recorded-\d+$/),
        expect.stringMatching(/^neurology-minor-stroke-later-trajectory-reviewed-\d+$/),
        expect.stringMatching(/^neurology-minor-stroke-active-risk-handoff-recorded-\d+$/),
      ]));
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
  });

  it('requires exact metadata and both targets and remains isolated from adjacent labs', () => {
    const wrong = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'minor-stroke' } },
      ...['minor-nondisabling-acute-ischemic-stroke-reassessment',
        'minor-nondisabling-acute-ischemic-stroke-reassessment-boundary'].map((target) => ({
        ...SCENARIO, timeline: SCENARIO.timeline.map((event) => event.target === target
          ? { ...event, target: `${target}-suffix` } : event),
      })),
      ACUTE_ISCHEMIC_STROKE, INTRACRANIAL_HEMORRHAGE_DETERIORATION,
      INTRACRANIAL_HYPERTENSION, STATUS_EPILEPTICUS,
    ];
    for (const scenario of wrong) {
      const subject = make(scenario, 1707); const control = make(scenario, 1707);
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation.neurologyMinorStrokeAssessment).toBeUndefined();
    }
  });
});
