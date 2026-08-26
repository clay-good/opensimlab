import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_FEBRILE_SEIZURE as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-febrile-seizure';
import { PEDIATRIC_HYPOGLYCEMIC_SEIZURE } from '../../src/modules/pediatrics/scenarios/pediatric-hypoglycemic-seizure';
import { PEDIATRIC_SEPSIS } from '../../src/modules/pediatrics/scenarios/pediatric-sepsis';
import { PEDIATRIC_SEPTIC_SHOCK } from '../../src/modules/pediatrics/scenarios/pediatric-septic-shock';
import { SEVERE_HYPONATREMIA_WITH_SEIZURE } from '../../src/modules/emergency-medicine/scenarios/severe-hyponatremia-with-seizure';
import { STATUS_EPILEPTICUS } from '../../src/modules/emergency-medicine/scenarios/status-epilepticus';

const ACTIONS = ['reconcile-pediatric-febrile-seizure-event-recovery-and-fever',
  'recognize-pediatric-febrile-seizure-pattern-and-danger-boundary',
  'activate-pediatric-febrile-seizure-qualified-care-ownership',
  'review-pediatric-febrile-seizure-infection-recurrence-and-alternatives',
  'review-pediatric-febrile-seizure-later-response',
  'handoff-pediatric-febrile-seizure-active-risk'] as const;
const apply = (subject: AnesthesiaEngine, action: unknown,
  type = 'pediatric-febrile-seizure-response') =>
  subject.apply({ tick: subject.tick, type, payload: { action: action as never } });

describe('pediatric febrile seizure engine contract', () => {
  it('uses the exact bounded contract without routine testing or a treatment recipe', () => {
    expect(SCENARIO.metadata.id).toBe('pediatric-febrile-seizure');
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.some(({ type, target }) => type === 'narrative'
      && target === 'pediatric-febrile-seizure-reassessment')).toBe(true);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    expect(narrative).toContain('No routine glucose or other test is supplied.');
    expect(narrative).toContain('simple features to date');
    expect(narrative).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:mg\/kg|g\/kg|mL\/kg|mL\/h)\b/i);
  });

  it('moves only from the frozen initial state to the frozen minute-30 report', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1001, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ coreTemperatureC: 39, heartRateBpm: 150,
      respiratoryRateBpm: 30, systolicMmHg: 94, diastolicMmHg: 58,
      meanArterialMmHg: 70, spo2Percent: 98 });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]);
    const later = subject.step();
    expect(later.state).toMatchObject({ coreTemperatureC: 38.7, heartRateBpm: 126,
      respiratoryRateBpm: 24, systolicMmHg: 96, diastolicMmHg: 60,
      meanArterialMmHg: 72, spo2Percent: 99 });
    const event = later.events.find(({ eventId }) =>
      eventId.startsWith('pediatric-febrile-seizure-later-response-reviewed-'));
    expect(event?.message).toContain('awake and interactive, recognizes his caregiver');
    expect(event?.message).toContain('moves and reaches symmetrically, and remains mildly tired');
    expect(event?.message).toContain('no recurrent seizure or focal finding');
    expect(later.equipment.resuscitation.pediatricFebrileSeizureAssessment).toMatchObject({
      stoppedSeizureAuthored: true, feverAuthored: true, statusEpilepticusAuthored: false,
      qualifiedCareOwnershipActive: true, qualifiedSafetyReviewActive: true,
      laterReportAuthored: true, patientExaminedByLearner: false,
      temperatureAcquiredByLearner: false, testAcquiredByLearner: false,
      testInterpretedByLearner: false, diagnosisMadeByLearner: false,
      classificationMadeByLearner: false, lumbarPuncturePerformedByLearner: false,
      eegAcquiredByLearner: false, imagingAcquiredByLearner: false,
      drugSelectedByLearner: false, antipyreticSelectedByLearner: false,
      anticonvulsantSelectedByLearner: false, antimicrobialSelectedByLearner: false,
      doseSelectedByLearner: false, concentrationSelectedByLearner: false,
      routeSelectedByLearner: false, volumeSelectedByLearner: false,
      rateSelectedByLearner: false, accessPlacedByLearner: false,
      deviceSelectedByLearner: false, drugDeliveredByLearner: false,
      airwayManeuverPerformedByLearner: false, procedurePerformedByLearner: false,
      treatmentDeliveredByLearner: false, simpleFebrileSeizureFinallyProven: false,
      benignCourseProven: false, seizureCauseProven: false, cnsInfectionExcluded: false,
      seriousInfectionExcluded: false, treatmentEffectProven: false,
      durableRecoveryProven: false, recurrenceExcluded: false,
      dischargeReadinessProven: false, dispositionDetermined: false, outcomePredicted: false,
    });
    expect(later.equipment.resuscitation.crystalloidTotalMl).toBe(0);
  });

  it('allows both parallel orders and enforces both strict elapsed gates', () => {
    for (const parallel of [[ACTIONS[2], ACTIONS[3]], [ACTIONS[3], ACTIONS[2]]] as const) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1002, practiceRegion: 'US' });
      subject.step(); apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]);
      apply(subject, parallel[0]); apply(subject, parallel[1]); apply(subject, ACTIONS[4]);
      let frame = subject.step();
      expect(frame.events.some(({ eventId }) => eventId.includes('later-time-refused'))).toBe(true);
      apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); frame = subject.step();
      expect(frame.events.some(({ eventId }) => eventId.includes('handoff-time-refused'))).toBe(true);
      apply(subject, ACTIONS[5]); frame = subject.step();
      expect(frame.equipment.resuscitation.pediatricFebrileSeizureAssessment)
        .toMatchObject({ careAtTick: 1, safetyAtTick: 1,
          laterResponseAtTick: 2, handoffAtTick: 3 });
    }
  });

  it('refuses missing prerequisites without changing patient or accepted assessment state', () => {
    const cases: readonly [readonly string[], string][] = [
      [[], ACTIONS[1]], [[], ACTIONS[2]], [[], ACTIONS[3]], [[], ACTIONS[4]], [[], ACTIONS[5]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]],
    ];
    for (const [prepare, action] of cases) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1003, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1003, practiceRegion: 'US' });
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, action);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.events.some(({ eventId }) => eventId.includes('-refused-'))).toBe(true);
    }
  });

  it('immutably refuses generic, seizure, infection, and hostile shortcuts', () => {
    const blocked = ['bolus', 'infusion', 'fluid', 'ventilator', 'airway-device',
      'airway-maneuver', 'laryngoscopy', 'seizure-suppression', 'status-epilepticus-response',
      'critical-care-status-epilepticus-response', 'pediatric-hypoglycemic-seizure-response',
      'hyponatremia-response', 'pediatric-sepsis-response',
      'pediatric-septic-shock-response', 'emergency-anaphylaxis-response'] as const;
    const shortcuts: unknown[] = ['give-antipyretic', 'give-lorazepam', 'give-antibiotic',
      'perform-lumbar-puncture', 'order-eeg', 'order-ct', 'cool-child', 'declare-benign',
      'exclude-meningitis', 'discharge', 'predict-no-recurrence', '__proto__', 'constructor',
      '', null, {}, ['handoff']];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1004, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1004, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: -999, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
  });

  it.each([undefined, null, [], { type: 'pediatric-febrile-seizure-response', payload: null },
    { type: 4, payload: {} }, { type: 'pediatric-febrile-seizure-response', payload: [] }] as const)(
    'calmly refuses malformed runtime action %# and continues', (malformed) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1005, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1005, practiceRegion: 'US' });
      subject.step(); control.step(); subject.apply(malformed as never);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      apply(subject, ACTIONS[0]);
      expect(subject.step().equipment.resuscitation
        .pediatricFebrileSeizureAssessment?.trajectoryAtTick).not.toBeNull();
    },
  );

  it('preserves first accepted ticks and replays both parallel orders deterministically', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1006, practiceRegion: 'US' });
    subject.step();
    for (const action of ACTIONS.slice(0, 2)) { apply(subject, action); apply(subject, action); }
    subject.step();
    for (const action of ACTIONS.slice(2, 4)) { apply(subject, action); apply(subject, action); }
    subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
    subject.step(); apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.pediatricFebrileSeizureAssessment).toMatchObject({
      trajectoryAtTick: 1, recognitionAtTick: 1, careAtTick: 2, safetyAtTick: 2,
      laterResponseAtTick: 3, handoffAtTick: 4,
    });
    const scheduled = (parallel: readonly [string, string]): LearnerAction[] => [
      { tick: 0, type: 'pediatric-febrile-seizure-response', payload: { action: ACTIONS[0] } },
      { tick: 0, type: 'pediatric-febrile-seizure-response', payload: { action: ACTIONS[1] } },
      { tick: 1, type: 'pediatric-febrile-seizure-response', payload: { action: parallel[0] } },
      { tick: 1, type: 'pediatric-febrile-seizure-response', payload: { action: parallel[1] } },
      { tick: 1, type: 'pediatric-febrile-seizure-response', payload: { action: parallel[1] } },
      { tick: 2, type: 'pediatric-febrile-seizure-response', payload: { action: ACTIONS[4] } },
      { tick: 3, type: 'pediatric-febrile-seizure-response', payload: { action: ACTIONS[5] } },
    ];
    const options = { scenario: SCENARIO, seed: 1006, practiceRegion: 'US', ticks: 11 };
    const careFirst = replay(scheduled([ACTIONS[2], ACTIONS[3]]), options);
    const safetyFirst = replay(scheduled([ACTIONS[3], ACTIONS[2]]), options);
    expect(careFirst).toEqual(safetyFirst);
    expect(replay(scheduled([ACTIONS[2], ACTIONS[3]]), options)).toEqual(careFirst);
    expect(careFirst.at(-1)?.state).toMatchObject({ coreTemperatureC: 38.7,
      heartRateBpm: 126, respiratoryRateBpm: 24, meanArterialMmHg: 72, spo2Percent: 99 });
  });

  it('cannot leak into neighboring seizure, metabolic, or infection scenarios', () => {
    for (const scenario of [PEDIATRIC_HYPOGLYCEMIC_SEIZURE, STATUS_EPILEPTICUS,
      SEVERE_HYPONATREMIA_WITH_SEIZURE, PEDIATRIC_SEPSIS, PEDIATRIC_SEPTIC_SHOCK]) {
      const subject = new AnesthesiaEngine({ scenario, seed: 1007, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario, seed: 1007, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation.pediatricFebrileSeizureAssessment).toBeUndefined();
    }
  });

  it('requires exact metadata identity and exact narrative target', () => {
    for (const scenario of [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'not-pediatric-febrile-seizure' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.map((event) =>
        event.target === 'pediatric-febrile-seizure-reassessment'
          ? { ...event, target: 'pediatric-febrile-seizure-reassessment-suffix' }
          : event) },
    ]) {
      const subject = new AnesthesiaEngine({ scenario, seed: 1008, practiceRegion: 'US' });
      apply(subject, ACTIONS[0]); const frame = subject.step();
      expect(frame.equipment.resuscitation.pediatricFebrileSeizureAssessment).toBeUndefined();
      expect(frame.state).toMatchObject({ heartRateBpm: 150, meanArterialMmHg: 70 });
      expect(frame.events.some(({ eventId }) =>
        eventId.startsWith('pediatric-febrile-seizure-response-refused-'))).toBe(true);
    }
  });
});
