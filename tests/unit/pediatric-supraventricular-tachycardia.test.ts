import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay-engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_SUPRAVENTRICULAR_TACHYCARDIA as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-supraventricular-tachycardia';
import { REGULAR_NARROW_COMPLEX_TACHYCARDIA } from '../../src/modules/cardiology/scenarios/regular-narrow-complex-tachycardia';
import { WIDE_COMPLEX_TACHYCARDIA } from '../../src/modules/cardiology/scenarios/wide-complex-tachycardia';
import { ATRIAL_FIBRILLATION_WITH_RAPID_RESPONSE } from '../../src/modules/cardiology/scenarios/atrial-fibrillation-with-rapid-response';
import { TORSADES_DE_POINTES } from '../../src/modules/cardiology/scenarios/torsades-de-pointes';
import { UNSTABLE_NARROW_COMPLEX_TACHYCARDIA } from '../../src/modules/emergency-medicine/scenarios/unstable-narrow-complex-tachycardia';
import { PEDIATRIC_ANAPHYLAXIS } from '../../src/modules/pediatrics/scenarios/pediatric-anaphylaxis';
import { PEDIATRIC_SEPTIC_SHOCK } from '../../src/modules/pediatrics/scenarios/pediatric-septic-shock';
import { PEDIATRIC_STATUS_EPILEPTICUS } from '../../src/modules/pediatrics/scenarios/pediatric-status-epilepticus';

const ACTIONS = ['reconcile-pediatric-svt-clock-rhythm-and-whole-child',
  'recognize-pediatric-svt-with-perfusion-compromise',
  'activate-pediatric-svt-qualified-rhythm-care-and-resuscitation-ownership',
  'review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary',
  'review-pediatric-svt-later-response',
  'handoff-pediatric-svt-recurrence-cardiology-and-caregiver-risk'] as const;
const apply = (subject: AnesthesiaEngine, action: unknown,
  type = 'pediatric-supraventricular-tachycardia-response') =>
  subject.apply({ tick: subject.tick, type, payload: { action: action as never } });

describe('pediatric supraventricular-tachycardia engine contract', () => {
  it('uses one authored SVT rhythm event and an exact recipe-free intent contract', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.filter(({ type }) => type === 'rhythm-change')).toEqual([
      expect.objectContaining({ target: 'svt', atTick: 0 }),
    ]);
    expect(SCENARIO.timeline.some(({ target }) => target === 'regular-narrow-complex-tachycardia'
      || target === 'unstable-narrow-complex-tachycardia')).toBe(false);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 6, sex: 'male', weightKg: 20,
      heightCm: 115 });
    expect(SCENARIO.timeline.map(({ message }) => message).join(' '))
      .not.toMatch(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|mL|J)(?:\/kg|\/mL|\/h|\s+IV|\s+IO)?\b/i);
  });

  it('reports the exact supplied initial and later states without learner ownership', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1301, practiceRegion: 'US' });
    let frame = subject.step();
    expect(frame.state).toMatchObject({ coreTemperatureC: 37, heartRateBpm: 210,
      respiratoryRateBpm: 28, systolicMmHg: 96, diastolicMmHg: 60,
      meanArterialMmHg: 72, spo2Percent: 98 });
    expect(frame.equipment.rhythmId).toBe('svt');
    expect(frame.equipment.invalidParameters).toContain('etco2MmHg');
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ coreTemperatureC: 37, heartRateBpm: 118,
      respiratoryRateBpm: 22, systolicMmHg: 102, diastolicMmHg: 66,
      meanArterialMmHg: 78, spo2Percent: 99 });
    expect(frame.equipment.rhythmId).toBe('sinus');
    expect(frame.equipment.resuscitation.pediatricSupraventricularTachycardiaAssessment)
      .toMatchObject({
        abruptRegularNarrowTachycardiaAuthored: true, probableSvtPatternAuthored: true,
        perfusionCompromiseAuthored: true, qualifiedRhythmCareOwnershipActive: true,
        qualifiedSafetyReviewActive: true, laterReportAuthored: true,
        laterSinusRhythmAuthored: true, patientExaminedByLearner: false,
        monitoringAcquiredByLearner: false, ecgAcquiredByLearner: false,
        ecgInterpretedByLearner: false, diagnosisMadeByLearner: false,
        mechanismAssignedByLearner: false, maneuverPerformedByLearner: false,
        accessPlacedByLearner: false, modalitySelectedByLearner: false,
        drugSelectedByLearner: false, adenosineSelectedByLearner: false,
        concentrationSelectedByLearner: false, doseSelectedByLearner: false,
        routeSelectedByLearner: false, deviceSelectedByLearner: false,
        energySelectedByLearner: false, sedationSelectedByLearner: false,
        oxygenDeliveredByLearner: false, drugDeliveredByLearner: false,
        cardioversionPerformedByLearner: false, procedurePerformedByLearner: false,
        treatmentDeliveredByLearner: false, svtFinallyProven: false,
        sinusTachycardiaExcluded: false, mechanismProven: false, causeProven: false,
        treatmentEffectProven: false, durableConversionProven: false,
        durableRecoveryProven: false, heartFailureExcluded: false,
        deteriorationExcluded: false, recurrenceExcluded: false,
        dispositionDetermined: false, prognosisPredicted: false, outcomePredicted: false,
      });
  });

  it('enforces strict serial order and both elapsed gates through debrief', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1302, practiceRegion: 'US' });
    const initial = subject.step(); const events = [...initial.events];
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); let frame = subject.step(); events.push(...frame.events);
    expect(frame.events.some(({ eventId }) => eventId.includes('later-time-refused'))).toBe(true);
    expect(frame.equipment.resuscitation.pediatricSupraventricularTachycardiaAssessment)
      .toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, careAtTick: 1,
        safetyAtTick: 1, laterResponseAtTick: null, handoffAtTick: null });
    apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); frame = subject.step();
    events.push(...frame.events);
    expect(frame.events.some(({ eventId }) => eventId.includes('handoff-time-refused'))).toBe(true);
    apply(subject, ACTIONS[5]); frame = subject.step(); events.push(...frame.events);
    expect(frame.equipment.resuscitation.pediatricSupraventricularTachycardiaAssessment)
      .toMatchObject({ laterResponseAtTick: 2, handoffAtTick: 3 });
    const history = [{ tick: initial.tick, state: initial.state, concentrations: [] },
      { tick: frame.tick, state: frame.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], events).map(({ outcome }) => outcome))
      .toEqual(Array(6).fill('met'));
  });

  it('refuses every missing prerequisite without patient or assessment mutation', () => {
    const cases: readonly [readonly string[], string][] = [
      [[], ACTIONS[1]], [[], ACTIONS[2]], [[], ACTIONS[3]], [[], ACTIONS[4]], [[], ACTIONS[5]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]],
    ];
    for (const [prepare, action] of cases) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1303, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1303, practiceRegion: 'US' });
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, action);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.rhythmId).toBe(untouched.equipment.rhythmId);
    }
  });

  it('immutably blocks adult tachycardia, drug, rhythm, device, and shock shortcuts', () => {
    const blocked: readonly [string, unknown][] = [
      ['stable-narrow-tachycardia-response', 'record-stable-regular-narrow-adenosine-intent'],
      ['unstable-narrow-tachycardia-response', 'record-synchronized-cardioversion-intent'],
      ['stable-wide-tachycardia-response', 'record-wide-complex-cardioversion-intent'],
      ['af-rvr-response', 'record-af-rvr-rate-control-intent'],
      ['torsades-response', 'record-torsades-magnesium-intent'],
      ['bolus', { drugId: 'adenosine', amount: 6, unit: 'mg' }],
      ['infusion', { drugId: 'amiodarone', rate: 1, unit: 'mg/min' }],
      ['rhythm', { rhythmId: 'sinus' }], ['rhythm-change', { target: 'sinus' }],
      ['defibrillation', { joules: 200 }], ['ventilator', { fio2: 1, delivering: true }],
      ['airway-device', {}], ['inject-crisis', { crisisId: 'anaphylaxis' }],
    ];
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1304, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1304, practiceRegion: 'US' });
    subject.step(); control.step();
    for (const [type, action] of blocked) subject.apply({ tick: -999, type,
      payload: (type.endsWith('-response') ? { action } : action) as never });
    for (const shortcut of ['give-adenosine', 'perform-vagal-maneuver', 'select-energy',
      'cardiovert-now', 'declare-durable-conversion', '__proto__', 'constructor', '', null,
      {}, ['handoff']]) apply(subject, shortcut);
    const refused = subject.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    expect(refused.equipment.rhythmId).toBe('svt');
    expect(refused.equipment.ventilator).toEqual(untouched.equipment.ventilator);
  });

  it.each([undefined, null, [],
    { type: 'pediatric-supraventricular-tachycardia-response', payload: null },
    { type: 4, payload: {} },
    { type: 'pediatric-supraventricular-tachycardia-response', payload: [] }] as const)(
    'calmly refuses malformed runtime action %# and continues', (malformed) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1305, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1305, practiceRegion: 'US' });
      subject.step(); control.step(); subject.apply(malformed as never);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      apply(subject, ACTIONS[0]);
      expect(subject.step().equipment.resuscitation
        .pediatricSupraventricularTachycardiaAssessment?.trajectoryAtTick).not.toBeNull();
    },
  );

  it('preserves duplicate ticks and replays the fixed trajectory deterministically', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1306, practiceRegion: 'US' });
    subject.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(subject, action); }
    subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
    subject.step(); apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.pediatricSupraventricularTachycardiaAssessment)
      .toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, careAtTick: 1,
        safetyAtTick: 1, laterResponseAtTick: 2, handoffAtTick: 3 });
    const actions: LearnerAction[] = ACTIONS.map((action, index) => ({
      tick: index < 4 ? 0 : index - 3,
      type: 'pediatric-supraventricular-tachycardia-response', payload: { action },
    }));
    const options = { scenario: SCENARIO, seed: 1306, practiceRegion: 'US', ticks: 11 };
    const first = replay(actions, options);
    expect(replay(actions, options)).toEqual(first);
    expect(first.at(-1)?.state).toMatchObject({ heartRateBpm: 118,
      respiratoryRateBpm: 22, meanArterialMmHg: 78, spo2Percent: 99 });
  });

  it('requires exact metadata and both targets and cannot leak into adjacent lessons', () => {
    const wrong = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'supraventricular-tachycardia' } },
      ...['pediatric-supraventricular-tachycardia-reassessment',
        'pediatric-supraventricular-tachycardia-reassessment-boundary'].map((target) => ({
        ...SCENARIO, timeline: SCENARIO.timeline.map((event) => event.target === target
          ? { ...event, target: `${target}-suffix` } : event),
      })),
      REGULAR_NARROW_COMPLEX_TACHYCARDIA, UNSTABLE_NARROW_COMPLEX_TACHYCARDIA,
      WIDE_COMPLEX_TACHYCARDIA, ATRIAL_FIBRILLATION_WITH_RAPID_RESPONSE, TORSADES_DE_POINTES,
      PEDIATRIC_ANAPHYLAXIS, PEDIATRIC_SEPTIC_SHOCK, PEDIATRIC_STATUS_EPILEPTICUS,
    ];
    for (const scenario of wrong) {
      const subject = new AnesthesiaEngine({ scenario, seed: 1307, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario, seed: 1307, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation
        .pediatricSupraventricularTachycardiaAssessment).toBeUndefined();
    }
  });
});
