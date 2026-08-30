import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay-engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { LearnerAction } from '@platform/kernel/protocol';
import { BASILAR_ARTERY_OCCLUSION_ESCALATION as SCENARIO } from '../../src/modules/neurology/scenarios/basilar-artery-occlusion-escalation';
import { MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE } from '../../src/modules/neurology/scenarios/minor-nondisabling-acute-ischemic-stroke';
import { ACUTE_ISCHEMIC_STROKE } from '../../src/modules/emergency-medicine/scenarios/acute-ischemic-stroke';
import { INTRACRANIAL_HEMORRHAGE_DETERIORATION } from '../../src/modules/emergency-medicine/scenarios/intracranial-hemorrhage-deterioration';
import { INTRACRANIAL_HYPERTENSION } from '../../src/modules/critical-care/scenarios/intracranial-hypertension';

const ACTIONS = [
  'reconcile-neurology-basilar-lvo-clock-posterior-syndrome-and-whole-patient',
  'review-neurology-basilar-lvo-imaging-selection-and-open-mimics',
  'recognize-neurology-basilar-lvo-thrombectomy-escalation-boundary',
  'activate-neurology-basilar-lvo-qualified-endovascular-and-airway-capable-ownership',
  'review-neurology-basilar-lvo-strict-later-neurologic-and-airway-trajectory',
  'handoff-neurology-basilar-lvo-clocks-imaging-deterioration-and-unresolved-outcome',
] as const;
const responseType = 'basilar-artery-occlusion-escalation-response';
const make = (scenario = SCENARIO, seed = 1702) =>
  new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown,
  extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick,
  type: responseType, payload: { action: action as never, ...extras } as never });

describe('Neurology basilar artery occlusion escalation engine contract', () => {
  it('validates the exact narrative-only fixture and action contract', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 74, sex: 'male', heightCm: 175,
      weightKg: 78, respiratory: { profile: 'healthy' } });
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual([
      'basilar-artery-occlusion-escalation-reassessment',
      'basilar-artery-occlusion-escalation-reassessment-boundary',
    ]);
    expect(SCENARIO.timeline.every(({ type }) => type === 'narrative')).toBe(true);
  });

  it('uses only fixed initial and later physiology and literal ownership nonclaims', () => {
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 84, respiratoryRateBpm: 20,
      systolicMmHg: 174, diastolicMmHg: 96, meanArterialMmHg: 122,
      spo2Percent: 96, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.neurologyBasilarLvoAssessment).toMatchObject({
      trajectoryAtTick: null, imagingAtTick: null, boundaryAtTick: null,
      activationAtTick: null, laterAtTick: null, handoffAtTick: null,
      initialPulsePresent: true, spontaneousBreathingAuthored: true,
      posteriorCirculationSyndromeAuthored: true, disablingDeficitAuthored: true,
      basilarOcclusionAuthored: true, fixedImagingAuthored: true,
      thrombectomyEscalationBoundaryAuthored: false,
      qualifiedEndovascularOwnershipActive: false,
      qualifiedAirwayCapableOwnershipActive: false,
      laterPosteriorSyndromePersistsAuthored: false,
    });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 86, respiratoryRateBpm: 20,
      systolicMmHg: 166, diastolicMmHg: 92, meanArterialMmHg: 117,
      spo2Percent: 95, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation).toMatchObject({ cardiacArrestActive: false,
      chestCompressionsActive: false, arrestEpinephrineTotalMg: 0,
      defibrillationShockCount: 0, roscAtTick: null,
      neurologyBasilarLvoAssessment: {
        thrombectomyEscalationBoundaryAuthored: true,
        qualifiedEndovascularOwnershipActive: true,
        qualifiedAirwayCapableOwnershipActive: true,
        laterPosteriorSyndromePersistsAuthored: true,
        patientHistoryTakenByLearner: false, patientExaminedByLearner: false,
        neurologicExamPerformedByLearner: false, scoreCalculatedByLearner: false,
        clockDeterminedByLearner: false, imagingAcquiredByLearner: false,
        imagingInterpretedByLearner: false, diagnosisMadeByLearner: false,
        strokeMimicExcluded: false, eligibilityDeterminedByLearner: false,
        thrombolysisSelectedByLearner: false, drugSelectedByLearner: false,
        doseSelectedByLearner: false, routeSelectedByLearner: false,
        accessPlacedByLearner: false, medicationDeliveredByLearner: false,
        bloodPressureTargetSelectedByLearner: false, transportSelectedByLearner: false,
        airwayDeviceSelectedByLearner: false, airwayProcedurePerformedByLearner: false,
        anesthesiaSelectedByLearner: false, thrombectomyDeviceSelectedByLearner: false,
        procedureSelectedByLearner: false, procedurePerformedByLearner: false,
        treatmentDeliveredByLearner: false, vesselPatencyProven: false,
        reperfusionProven: false, treatmentEffectProven: false,
        durableAirwayProtectionProven: false, durableNeurologicRecoveryProven: false,
        deteriorationExcluded: false, dischargeReadinessProven: false,
        dispositionDetermined: false, prognosisPredicted: false, outcomePredicted: false,
      },
    });
  });

  it('enforces every serial prerequisite without mutation', () => {
    const cases: readonly [readonly string[], string][] = [
      [[], ACTIONS[1]], [[], ACTIONS[2]], [[], ACTIONS[3]], [[], ACTIONS[4]], [[], ACTIONS[5]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]],
    ];
    for (const [prepare, attempted] of cases) {
      const subject = make(SCENARIO, 1703); const control = make(SCENARIO, 1703);
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, attempted);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    }
  });

  it('requires separate elapsed ticks for the later review and handoff', () => {
    const subject = make(SCENARIO, 1704); const control = make(SCENARIO, 1704);
    subject.step(); control.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(control, action); }
    apply(subject, ACTIONS[4]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[4]); apply(control, ACTIONS[4]); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neurologyBasilarLvoAssessment).toMatchObject({
      trajectoryAtTick: 1, imagingAtTick: 1, boundaryAtTick: 1, activationAtTick: 1,
      laterAtTick: 2, handoffAtTick: 3,
    });
  });

  it('refuses malformed, PII-bearing, adult-stroke, drug, airway, and procedure shortcuts', () => {
    const subject = make(SCENARIO, 1705); const control = make(SCENARIO, 1705);
    subject.step(); control.step();
    for (const malformed of [undefined, null, [],
      { type: responseType, payload: null }, { type: responseType, payload: [] },
      { type: responseType, payload: Object.create(null) }]) subject.apply(malformed as never);
    const secrets = ['Patient Example', '312-555-0199', '101 Example Street', 'private note'];
    for (const malformed of [undefined, null, [], {}, Object.create(null), '__proto__',
      'constructor', 'record-tenecteplase-20-mg-intent', 'activate-thrombectomy-transfer',
      'select-thrombectomy-device', 'declare-reperfusion']) apply(subject, malformed,
      { patientName: secrets[0], phone: secrets[1], address: secrets[2], notes: secrets[3] });
    for (const [type, payload] of [
      ['acute-ischemic-stroke-response', { action: 'record-tenecteplase-20-mg-intent' }],
      ['minor-nondisabling-acute-ischemic-stroke-response', { action: ACTIONS[0] }],
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
    for (const secret of secrets) expect(JSON.stringify(refused.events)).not.toContain(secret);
  });

  it('preserves duplicate ticks, replays deterministically, and scores exact evidence', () => {
    const subject = make(SCENARIO, 1706); const onset = subject.step();
    const events = [...onset.events];
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(subject, action); }
    let frame = subject.step(); events.push(...frame.events);
    apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
    frame = subject.step(); events.push(...frame.events);
    apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
    frame = subject.step(); events.push(...frame.events);
    expect(frame.equipment.resuscitation.neurologyBasilarLvoAssessment).toMatchObject({
      trajectoryAtTick: 1, imagingAtTick: 1, boundaryAtTick: 1, activationAtTick: 1,
      laterAtTick: 2, handoffAtTick: 3,
    });
    expect(events.map(({ eventId }) => eventId).filter((id) => id.startsWith('neurology-basilar-lvo-')))
      .toEqual(expect.arrayContaining([
        expect.stringMatching(/^neurology-basilar-lvo-trajectory-reconciled-\d+$/),
        expect.stringMatching(/^neurology-basilar-lvo-imaging-and-selection-reviewed-\d+$/),
        expect.stringMatching(/^neurology-basilar-lvo-escalation-boundary-recognized-\d+$/),
        expect.stringMatching(/^neurology-basilar-lvo-qualified-ownership-activated-\d+$/),
        expect.stringMatching(/^neurology-basilar-lvo-later-trajectory-reviewed-\d+$/),
        expect.stringMatching(/^neurology-basilar-lvo-active-risk-handoff-recorded-\d+$/),
      ]));
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: frame.tick, state: frame.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], events)
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);

    const actions: LearnerAction[] = ACTIONS.map((action, index) => ({
      tick: index < 4 ? 0 : index - 3, type: responseType, payload: { action },
    }));
    const options = { scenario: SCENARIO, seed: 1706, practiceRegion: 'US', ticks: 11 };
    const first = replay(actions, options);
    expect(replay(actions, options)).toEqual(first);
    expect(first.at(-1)?.state).toMatchObject({ heartRateBpm: 86, respiratoryRateBpm: 20,
      systolicMmHg: 166, diastolicMmHg: 92, meanArterialMmHg: 117,
      spo2Percent: 95, coreTemperatureC: 36.8 });
  });

  it('requires exact metadata and both targets and remains isolated from adjacent labs', () => {
    const wrong = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'basilar-lvo' } },
      ...['basilar-artery-occlusion-escalation-reassessment',
        'basilar-artery-occlusion-escalation-reassessment-boundary'].map((target) => ({
        ...SCENARIO, timeline: SCENARIO.timeline.map((event) => event.target === target
          ? { ...event, target: `${target}-suffix` } : event),
      })),
      MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE, ACUTE_ISCHEMIC_STROKE,
      INTRACRANIAL_HEMORRHAGE_DETERIORATION, INTRACRANIAL_HYPERTENSION,
    ];
    for (const scenario of wrong) {
      const subject = make(scenario, 1707); const control = make(scenario, 1707);
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation.neurologyBasilarLvoAssessment).toBeUndefined();
    }
  });
});
