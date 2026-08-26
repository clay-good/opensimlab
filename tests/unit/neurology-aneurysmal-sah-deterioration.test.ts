import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay';
import { validateScenario } from '@anesthesia/scenarios/schema';
import type { LearnerAction } from '@platform/kernel/protocol';
import { ANEURYSMAL_SUBARACHNOID_HEMORRHAGE_DETERIORATION as SCENARIO } from '../../src/modules/neurology/scenarios/aneurysmal-subarachnoid-hemorrhage-deterioration';
import { SPONTANEOUS_CEREBELLAR_INTRACEREBRAL_HEMORRHAGE } from '../../src/modules/neurology/scenarios/spontaneous-cerebellar-intracerebral-hemorrhage';
import { BASILAR_ARTERY_OCCLUSION_ESCALATION } from '../../src/modules/neurology/scenarios/basilar-artery-occlusion-escalation';
import { INTRACRANIAL_HEMORRHAGE_DETERIORATION } from '../../src/modules/emergency-medicine/scenarios/intracranial-hemorrhage-deterioration';
import { INTRACRANIAL_HYPERTENSION } from '../../src/modules/critical-care/scenarios/intracranial-hypertension';
import { STATUS_EPILEPTICUS } from '../../src/modules/critical-care/scenarios/status-epilepticus';

const ACTIONS = [
  'reconcile-neurology-asah-day-aneurysm-status-new-deficit-and-whole-patient',
  'review-neurology-asah-rebleeding-hydrocephalus-seizure-metabolic-and-perfusion-evidence',
  'recognize-neurology-asah-possible-dci-without-imaging-alone',
  'activate-neurology-asah-qualified-neurocritical-neurovascular-and-rescue-ownership',
  'review-neurology-asah-strict-later-neurologic-and-perfusion-trajectory',
  'handoff-neurology-asah-dci-aneurysm-recurrence-and-active-risk',
] as const;
const responseType = 'aneurysmal-subarachnoid-hemorrhage-deterioration-response';
const make = (scenario = SCENARIO, seed = 1704) =>
  new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown,
  extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick,
  type: responseType, payload: { action: action as never, ...extras } as never });

describe('Neurology aneurysmal SAH deterioration engine contract', () => {
  it('validates the exact narrative-only fixture and two targets', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 56, sex: 'female', heightCm: 164,
      weightKg: 62 });
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual([
      'aneurysmal-subarachnoid-hemorrhage-deterioration-reassessment',
      'aneurysmal-subarachnoid-hemorrhage-deterioration-reassessment-boundary',
    ]);
    expect(SCENARIO.timeline.every(({ type }) => type === 'narrative')).toBe(true);
  });

  it('reveals only the authored strict-later deterioration and no learner treatment state', () => {
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 82, respiratoryRateBpm: 16,
      systolicMmHg: 144, diastolicMmHg: 80, meanArterialMmHg: 101,
      spo2Percent: 98, coreTemperatureC: 37.1 });
    expect(frame.equipment.resuscitation.neurologyAsahAssessment).toMatchObject({
      trajectoryAtTick: null, evidenceAtTick: null, boundaryAtTick: null,
      ownershipAtTick: null, laterAtTick: null, handoffAtTick: null,
      priorAneurysmalSahAuthored: true, reportedAneurysmSecuredAuthored: true,
      newFocalDeficitAuthored: true, possibleDciBoundaryAuthored: false,
      qualifiedNeurocriticalOwnershipActive: false,
      qualifiedNeurovascularOwnershipActive: false,
      qualifiedRescueOwnershipActive: false, laterDeteriorationAuthored: false,
    });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 82, meanArterialMmHg: 101,
      respiratoryRateBpm: 16, spo2Percent: 98, coreTemperatureC: 37.1 });
    apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 86, respiratoryRateBpm: 18,
      systolicMmHg: 148, diastolicMmHg: 82, meanArterialMmHg: 104,
      spo2Percent: 97, coreTemperatureC: 37.2 });
    expect(frame.equipment.resuscitation).toMatchObject({ cardiacArrestActive: false,
      chestCompressionsActive: false, arrestEpinephrineTotalMg: 0,
      defibrillationShockCount: 0, roscAtTick: null,
      neurologyAsahAssessment: {
        possibleDciBoundaryAuthored: true, qualifiedNeurocriticalOwnershipActive: true,
        qualifiedNeurovascularOwnershipActive: true, qualifiedRescueOwnershipActive: true,
        laterDeteriorationAuthored: true, patientHistoryTakenByLearner: false,
        patientExaminedByLearner: false, neurologicExamPerformedByLearner: false,
        scoreCalculatedByLearner: false, clockDeterminedByLearner: false,
        glucoseAcquiredByLearner: false, sodiumAcquiredByLearner: false,
        bloodPressureAcquiredByLearner: false, testAcquiredByLearner: false,
        testInterpretedByLearner: false, imagingAcquiredByLearner: false,
        imagingInterpretedByLearner: false, eegAcquiredByLearner: false,
        eegInterpretedByLearner: false, diagnosisMadeByLearner: false,
        dciDiagnosedByLearner: false, aneurysmSecurityValidatedByLearner: false,
        drugSelectedByLearner: false, doseSelectedByLearner: false,
        routeSelectedByLearner: false, accessPlacedByLearner: false,
        medicationDeliveredByLearner: false, fluidSelectedByLearner: false,
        bloodPressureTargetSelectedByLearner: false, vasopressorSelectedByLearner: false,
        airwayDeviceSelectedByLearner: false, airwayProcedurePerformedByLearner: false,
        angiographySelectedByLearner: false, angioplastySelectedByLearner: false,
        intraArterialTherapySelectedByLearner: false, drainSelectedByLearner: false,
        deviceSelectedByLearner: false, procedureSelectedByLearner: false,
        procedurePerformedByLearner: false, treatmentDeliveredByLearner: false,
        dciFinallyProven: false, vasospasmProvenCausal: false,
        aneurysmDurableSecurityProven: false, rebleedingExcluded: false,
        hydrocephalusExcluded: false, seizureExcluded: false,
        infectionExcluded: false, metabolicCauseExcluded: false,
        establishedInfarctExcluded: false, treatmentEffectProven: false,
        durableNeurologicRecoveryProven: false, durableAirwayProtectionProven: false,
        dischargeReadinessProven: false, dispositionDetermined: false,
        prognosisPredicted: false, outcomePredicted: false,
      },
    });
  });

  it('enforces all serial prerequisites and both strict elapsed gates without mutation', () => {
    const cases: readonly [readonly string[], string][] = [
      [[], ACTIONS[1]], [[], ACTIONS[2]], [[], ACTIONS[3]], [[], ACTIONS[4]], [[], ACTIONS[5]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]],
    ];
    for (const [prepare, attempted] of cases) {
      const subject = make(SCENARIO, 1705); const control = make(SCENARIO, 1705);
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, attempted);
      expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 1705); const control = make(SCENARIO, 1705);
    subject.step(); control.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(control, action); }
    apply(subject, ACTIONS[4]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[4]); apply(control, ACTIONS[4]); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neurologyAsahAssessment).toMatchObject({
      trajectoryAtTick: 1, evidenceAtTick: 1, boundaryAtTick: 1, ownershipAtTick: 1,
      laterAtTick: 2, handoffAtTick: 3,
    });
  });

  it('refuses malformed, PII-bearing, drug, pressure, fluid, airway, and procedure shortcuts', () => {
    const subject = make(SCENARIO, 1706); const control = make(SCENARIO, 1706);
    subject.step(); control.step();
    for (const malformed of [undefined, null, [],
      { type: responseType, payload: null }, { type: responseType, payload: [] },
      { type: responseType, payload: Object.create(null) }]) subject.apply(malformed as never);
    const secrets = ['Patient Example', '312-555-0199', '101 Example Street', 'private note'];
    for (const malformed of [undefined, null, [], {}, Object.create(null), '__proto__',
      'constructor', 'give-nimodipine', 'induce-hypertension', 'give-fluid-bolus',
      'diagnose-dci-from-cta', 'perform-angioplasty', 'place-evd', 'declare-recovery'])
      apply(subject, malformed, { patientName: secrets[0], phone: secrets[1],
        address: secrets[2], notes: secrets[3] });
    for (const [type, payload] of [
      ['intracranial-hemorrhage-response', { action: 'record-smooth-ich-pressure-control' }],
      ['intracranial-hypertension-response', { action: 'activate-individualized-hyperosmolar-rescue' }],
      ['status-epilepticus-response', { action: 'give-lorazepam-4-mg-iv' }],
      ['bolus', { drugId: 'nimodipine', amount: 60, unit: 'mg' }],
      ['vasopressor', { drugId: 'norepinephrine', rate: 0.1 }],
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

  it('preserves duplicate ticks, exact evidence, and deterministic replay', () => {
    const subject = make(SCENARIO, 1707); const events = [...subject.step().events];
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(subject, action); }
    let frame = subject.step(); events.push(...frame.events);
    apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
    frame = subject.step(); events.push(...frame.events);
    apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
    frame = subject.step(); events.push(...frame.events);
    expect(frame.equipment.resuscitation.neurologyAsahAssessment).toMatchObject({
      trajectoryAtTick: 1, evidenceAtTick: 1, boundaryAtTick: 1, ownershipAtTick: 1,
      laterAtTick: 2, handoffAtTick: 3,
    });
    expect(events.map(({ eventId }) => eventId).filter((id) => id.startsWith('neurology-asah-')))
      .toEqual(expect.arrayContaining([
        expect.stringMatching(/^neurology-asah-trajectory-reconciled-\d+$/),
        expect.stringMatching(/^neurology-asah-evidence-and-threats-reviewed-\d+$/),
        expect.stringMatching(/^neurology-asah-possible-dci-boundary-recognized-\d+$/),
        expect.stringMatching(/^neurology-asah-qualified-ownership-activated-\d+$/),
        expect.stringMatching(/^neurology-asah-later-trajectory-reviewed-\d+$/),
        expect.stringMatching(/^neurology-asah-active-risk-handoff-recorded-\d+$/),
      ]));
    const actions: LearnerAction[] = ACTIONS.map((action, index) => ({
      tick: index < 4 ? 0 : index - 3, type: responseType, payload: { action },
    }));
    const options = { scenario: SCENARIO, seed: 1707, practiceRegion: 'US', ticks: 11 };
    const first = replay(actions, options);
    expect(replay(actions, options)).toEqual(first);
    expect(first.at(-1)?.state).toMatchObject({ heartRateBpm: 86, respiratoryRateBpm: 18,
      systolicMmHg: 148, diastolicMmHg: 82, meanArterialMmHg: 104,
      spo2Percent: 97, coreTemperatureC: 37.2 });
  });

  it('requires exact metadata and both targets and stays isolated from adjacent labs', () => {
    const wrong = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'aneurysmal-sah' } },
      ...['aneurysmal-subarachnoid-hemorrhage-deterioration-reassessment',
        'aneurysmal-subarachnoid-hemorrhage-deterioration-reassessment-boundary'].map((target) => ({
        ...SCENARIO, timeline: SCENARIO.timeline.map((event) => event.target === target
          ? { ...event, target: `${target}-suffix` } : event),
      })),
      SPONTANEOUS_CEREBELLAR_INTRACEREBRAL_HEMORRHAGE,
      INTRACRANIAL_HEMORRHAGE_DETERIORATION, INTRACRANIAL_HYPERTENSION,
      BASILAR_ARTERY_OCCLUSION_ESCALATION, STATUS_EPILEPTICUS,
    ];
    for (const scenario of wrong) {
      const subject = make(scenario, 1708); const control = make(scenario, 1708);
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation.neurologyAsahAssessment).toBeUndefined();
    }
  });
});
