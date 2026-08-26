import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_BRADYCARDIC_ARREST as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-bradycardic-arrest';
import { PEDIATRIC_SUPRAVENTRICULAR_TACHYCARDIA } from '../../src/modules/pediatrics/scenarios/pediatric-supraventricular-tachycardia';
import { PEDIATRIC_ANAPHYLAXIS } from '../../src/modules/pediatrics/scenarios/pediatric-anaphylaxis';
import { UNSTABLE_BRADYCARDIA } from '../../src/modules/emergency-medicine/scenarios/unstable-bradycardia';
import { PEA_ARREST } from '../../src/modules/emergency-medicine/scenarios/pea-arrest';
import { PERSISTENT_VF_ARREST } from '../../src/modules/emergency-medicine/scenarios/persistent-vf-arrest';
import { COMPLETE_HEART_BLOCK } from '../../src/modules/cardiology/scenarios/complete-heart-block';
import { PACEMAKER_CAPTURE_FAILURE } from '../../src/modules/cardiology/scenarios/pacemaker-capture-failure';
import { TRANSCUTANEOUS_PACING_MECHANICAL_CAPTURE_REASSESSMENT } from '../../src/modules/cardiology/scenarios/transcutaneous-pacing-mechanical-capture-reassessment';

const ACTIONS = ['reconcile-pediatric-bradycardic-arrest-support-and-trajectory',
  'recognize-pediatric-bradycardia-with-persistent-compromise',
  'activate-pediatric-bradycardic-arrest-qualified-resuscitation-ownership',
  'review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary',
  'review-pediatric-bradycardic-arrest-pulse-loss-response',
  'handoff-pediatric-bradycardic-arrest-active-risk'] as const;
const apply = (subject: AnesthesiaEngine, action: unknown,
  type = 'pediatric-bradycardic-arrest-response') =>
  subject.apply({ tick: subject.tick, type, payload: { action: action as never } });

describe('pediatric bradycardic-arrest engine contract', () => {
  it('uses only initial pulse-bearing sinus bradycardia and a recipe-free intent contract', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.filter(({ type }) => type === 'rhythm-change')).toEqual([
      expect.objectContaining({ target: 'sinus-bradycardia', atTick: 0 }),
    ]);
    expect(SCENARIO.timeline.some(({ type, target }) => type === 'rhythm-change'
      && ['pea', 'asystole', 'ventricular-fibrillation'].includes(target ?? ''))).toBe(false);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 6, weightKg: 20, heightCm: 115 });
    expect(SCENARIO.timeline.map(({ message }) => message).join(' '))
      .not.toMatch(/\b(?:1\s*mg|200\s*J|\d+(?:\.\d+)?\s*(?:mg|mcg)(?:\/kg)?\b)/i);
  });

  it('reports fixed pulse-bearing support, then authored PEA without learner resuscitation', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1401, practiceRegion: 'US' });
    let frame = subject.step();
    expect(frame.state).toMatchObject({ coreTemperatureC: 36.8, heartRateBpm: 52,
      respiratoryRateBpm: 20, systolicMmHg: 64, diastolicMmHg: 36,
      meanArterialMmHg: 45, spo2Percent: 95, etco2MmHg: 36 });
    expect(frame.equipment.rhythmId).toBe('sinus-bradycardia');
    expect(frame.equipment.invalidParameters).not.toContain('etco2MmHg');
    expect(frame.equipment.resuscitation).toMatchObject({ cardiacArrestActive: false,
      chestCompressionsActive: false, arrestEpinephrineTotalMg: 0,
      defibrillationShockCount: 0, roscAtTick: null });

    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ coreTemperatureC: 36.8, heartRateBpm: 46,
      respiratoryRateBpm: 20, systolicMmHg: 0, diastolicMmHg: 0,
      meanArterialMmHg: 0, etco2MmHg: 0 });
    expect(frame.equipment.rhythmId).toBe('pea');
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining([
      'spo2Percent', 'systolicMmHg', 'diastolicMmHg', 'meanArterialMmHg', 'etco2MmHg',
    ]));
    expect(frame.equipment.resuscitation).toMatchObject({ cardiacArrestActive: true,
      chestCompressionsActive: false, chestCompressionSeconds: 0,
      arrestEpinephrineTotalMg: 0, defibrillationShockCount: 0, roscAtTick: null });
    expect(frame.equipment.resuscitation.pediatricBradycardicArrestAssessment)
      .toMatchObject({ initialPulsePresent: true, effectiveAssistedVentilationAuthored: true,
        persistentBradycardiaWithCompromiseAuthored: true, laterPulseLossAuthored: true,
        laterPeaAuthored: true, qualifiedResuscitationOwnershipActive: true,
        qualifiedSafetyReviewActive: true, laterReportAuthored: true,
        patientExaminedByLearner: false, pulseAssessedByLearner: false,
        monitoringAcquiredByLearner: false, ecgAcquiredByLearner: false,
        ecgInterpretedByLearner: false, testAcquiredByLearner: false,
        testInterpretedByLearner: false, diagnosisMadeByLearner: false,
        causeAssignedByLearner: false, cprDeliveredByLearner: false,
        chestCompressionsDeliveredByLearner: false, oxygenDeliveredByLearner: false,
        ventilationDeliveredByLearner: false, accessPlacedByLearner: false,
        drugSelectedByLearner: false, epinephrineSelectedByLearner: false,
        concentrationSelectedByLearner: false, doseSelectedByLearner: false,
        routeSelectedByLearner: false, intervalSelectedByLearner: false,
        fluidDeliveredByLearner: false, pacingSelectedByLearner: false,
        deviceSelectedByLearner: false, currentSelectedByLearner: false,
        energySelectedByLearner: false, shockDeliveredByLearner: false,
        defibrillationPerformedByLearner: false, procedurePerformedByLearner: false,
        treatmentDeliveredByLearner: false, causeProven: false,
        conductionMechanismProven: false, treatmentEffectProven: false,
        roscReported: false, durableRoscProven: false, durableRecoveryProven: false,
        neurologicRecoveryProven: false, recurrenceExcluded: false,
        deathDeclared: false, resuscitationTerminated: false,
        dispositionDetermined: false, prognosisPredicted: false, outcomePredicted: false });
  });

  it('enforces strict serial order and both elapsed gates without mutation', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1402, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1402, practiceRegion: 'US' });
    subject.step(); control.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(control, action); }
    apply(subject, ACTIONS[4]);
    let refused = subject.step(); let untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    expect(refused.equipment.rhythmId).toBe('sinus-bradycardia');
    expect(refused.events.some(({ eventId }) => eventId.includes('later-time-refused'))).toBe(true);
    apply(subject, ACTIONS[4]); apply(control, ACTIONS[4]);
    apply(subject, ACTIONS[5]);
    refused = subject.step(); untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    expect(refused.events.some(({ eventId }) => eventId.includes('handoff-time-refused'))).toBe(true);
    apply(subject, ACTIONS[5]);
    const final = subject.step();
    expect(final.equipment.resuscitation.pediatricBradycardicArrestAssessment)
      .toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, resuscitationAtTick: 1,
        safetyAtTick: 1, laterResponseAtTick: 2, handoffAtTick: 3 });
    expect(final.equipment).toMatchObject({ rhythmId: 'pea', resuscitation: {
      cardiacArrestActive: true, chestCompressionsActive: false,
      arrestEpinephrineTotalMg: 0, defibrillationShockCount: 0, roscAtTick: null } });
  });

  it('refuses every missing prerequisite without state, rhythm, or assessment mutation', () => {
    const cases: readonly [readonly string[], string][] = [
      [[], ACTIONS[1]], [[], ACTIONS[2]], [[], ACTIONS[3]], [[], ACTIONS[4]], [[], ACTIONS[5]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]],
    ];
    for (const [prepare, action] of cases) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1403,
        practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1403,
        practiceRegion: 'US' });
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, action);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.rhythmId).toBe(untouched.equipment.rhythmId);
    }
  });

  it('blocks adult arrest, bradycardia, pacing, rhythm, drug, and shock shortcuts pre/post PEA', () => {
    const blocked: readonly [string, unknown][] = [
      ['unstable-bradycardia-response', 'record-unstable-bradycardia-atropine-intent'],
      ['symptomatic-bradycardia-response', 'record-symptomatic-bradycardia-atropine-intent'],
      ['complete-heart-block-response', 'activate-complete-heart-block-pacing-response'],
      ['pacemaker-capture-failure-response', 'activate-pacemaker-capture-failure-rescue-pathway'],
      ['transcutaneous-pacing-capture-response', 'activate-transcutaneous-pacing-pulseless-response'],
      ['pediatric-supraventricular-tachycardia-response', ACTIONS[0]],
      ['chest-compressions', { active: true }],
      ['cardiac-arrest-epinephrine', { doseMg: 1, route: 'iv' }],
      ['defibrillation', { energyJ: 200, waveform: 'biphasic' }],
      ['bolus', { drugId: 'atropine', amount: 1, unit: 'mg' }],
      ['epinephrine', { doseMicrograms: 20, route: 'iv' }],
      ['rhythm', { rhythmId: 'sinus' }], ['rhythm-change', { target: 'asystole' }],
      ['inject-crisis', { crisisId: 'cardiac-arrest-shockable' }],
      ['airway-device', {}], ['ventilator', { fio2: 1, delivering: true }],
      ['fluid', { fluidId: 'balanced-crystalloid', volumeMl: 400 }],
    ];
    for (const afterPea of [false, true]) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1404,
        practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1404,
        practiceRegion: 'US' });
      subject.step(); control.step();
      if (afterPea) {
        for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(control, action); }
        subject.step(); control.step(); apply(subject, ACTIONS[4]); apply(control, ACTIONS[4]);
        subject.step(); control.step();
      }
      for (const [type, payload] of blocked) subject.apply({ tick: -999, type,
        payload: (type.endsWith('-response') ? { action: payload } : payload) as never });
      for (const shortcut of ['give-adult-epinephrine', 'start-compressions', 'shock-now',
        'pace-now', 'declare-rosc', '__proto__', 'constructor', '', null, {}, ['handoff']]) {
        apply(subject, shortcut);
      }
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.rhythmId).toBe(afterPea ? 'pea' : 'sinus-bradycardia');
      expect(refused.equipment.resuscitation).toMatchObject({ chestCompressionsActive: false,
        arrestEpinephrineTotalMg: 0, defibrillationShockCount: 0, roscAtTick: null });
    }
  });

  it.each([undefined, null, [],
    { type: 'pediatric-bradycardic-arrest-response', payload: null },
    { type: 4, payload: {} },
    { type: 'pediatric-bradycardic-arrest-response', payload: [] }] as const)(
    'calmly refuses malformed runtime action %# and continues', (malformed) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1405,
        practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1405,
        practiceRegion: 'US' });
      subject.step(); control.step(); subject.apply(malformed as never);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      apply(subject, ACTIONS[0]);
      expect(subject.step().equipment.resuscitation
        .pediatricBradycardicArrestAssessment?.trajectoryAtTick).not.toBeNull();
    },
  );

  it('preserves accepted duplicate ticks and replays the pulse-loss trajectory deterministically', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1406, practiceRegion: 'US' });
    subject.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(subject, action); }
    subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
    subject.step(); apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.pediatricBradycardicArrestAssessment)
      .toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, resuscitationAtTick: 1,
        safetyAtTick: 1, laterResponseAtTick: 2, handoffAtTick: 3 });

    const actions: LearnerAction[] = ACTIONS.map((action, index) => ({
      tick: index < 4 ? 0 : index - 3,
      type: 'pediatric-bradycardic-arrest-response', payload: { action },
    }));
    const options = { scenario: SCENARIO, seed: 1406, practiceRegion: 'US', ticks: 11 };
    const first = replay(actions, options);
    expect(replay(actions, options)).toEqual(first);
    expect(first.at(-1)?.state).toMatchObject({ heartRateBpm: 46,
      respiratoryRateBpm: 20, meanArterialMmHg: 0, etco2MmHg: 0 });
  });

  it('requires exact metadata and both targets and cannot leak into neighboring lessons', () => {
    const wrong = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'bradycardic-arrest' } },
      ...['pediatric-bradycardic-arrest-reassessment',
        'pediatric-bradycardic-arrest-reassessment-boundary'].map((target) => ({
        ...SCENARIO, timeline: SCENARIO.timeline.map((event) => event.target === target
          ? { ...event, target: `${target}-suffix` } : event),
      })),
      UNSTABLE_BRADYCARDIA, PEA_ARREST, PERSISTENT_VF_ARREST, COMPLETE_HEART_BLOCK,
      PACEMAKER_CAPTURE_FAILURE, TRANSCUTANEOUS_PACING_MECHANICAL_CAPTURE_REASSESSMENT,
      PEDIATRIC_SUPRAVENTRICULAR_TACHYCARDIA, PEDIATRIC_ANAPHYLAXIS,
    ];
    for (const scenario of wrong) {
      const subject = new AnesthesiaEngine({ scenario, seed: 1407, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario, seed: 1407, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation.pediatricBradycardicArrestAssessment).toBeUndefined();
    }
  });

  it('maps all six exact ordered events to debrief evidence', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1409, practiceRegion: 'US' });
    const initial = subject.step(); const events = [...initial.events];
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    let frame = subject.step(); events.push(...frame.events); apply(subject, ACTIONS[4]);
    frame = subject.step(); events.push(...frame.events); apply(subject, ACTIONS[5]);
    frame = subject.step(); events.push(...frame.events);
    const history = [{ tick: initial.tick, state: initial.state, concentrations: [] },
      { tick: frame.tick, state: frame.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], events).map(({ outcome }) => outcome))
      .toEqual(Array(6).fill('met'));
    expect(events.map(({ eventId }) => eventId)).toEqual(expect.arrayContaining([
      expect.stringMatching(/^pediatric-bradycardic-arrest-trajectory-reconciled-\d+$/),
      expect.stringMatching(/^pediatric-bradycardic-arrest-persistent-compromise-recognized-\d+$/),
      expect.stringMatching(/^pediatric-bradycardic-arrest-qualified-resuscitation-activated-\d+$/),
      expect.stringMatching(/^pediatric-bradycardic-arrest-safety-reviewed-\d+$/),
      expect.stringMatching(/^pediatric-bradycardic-arrest-pulse-loss-response-reviewed-\d+$/),
      expect.stringMatching(/^pediatric-bradycardic-arrest-active-risk-handoff-recorded-\d+$/),
    ]));
  });
});
