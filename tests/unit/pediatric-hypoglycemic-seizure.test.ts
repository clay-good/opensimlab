import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay-engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_HYPOGLYCEMIC_SEIZURE as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-hypoglycemic-seizure';
import { PEDIATRIC_DIABETIC_KETOACIDOSIS } from '../../src/modules/pediatrics/scenarios/pediatric-diabetic-ketoacidosis';
import { PEDIATRIC_DEHYDRATION_WITH_HYPOVOLEMIA } from '../../src/modules/pediatrics/scenarios/pediatric-dehydration-with-hypovolemia';
import { DIABETIC_KETOACIDOSIS } from '../../src/modules/emergency-medicine/scenarios/diabetic-ketoacidosis';
import { SEVERE_HYPONATREMIA_WITH_SEIZURE } from '../../src/modules/emergency-medicine/scenarios/severe-hyponatremia-with-seizure';
import { STATUS_EPILEPTICUS } from '../../src/modules/emergency-medicine/scenarios/status-epilepticus';

const ACTIONS = ['reconcile-pediatric-hypoglycemic-seizure-whole-child-and-glucose',
  'recognize-pediatric-hypoglycemic-seizure',
  'activate-pediatric-hypoglycemic-seizure-qualified-rescue-ownership',
  'review-pediatric-hypoglycemic-seizure-causes-and-recurrence-risk',
  'review-pediatric-hypoglycemic-seizure-later-response',
  'handoff-pediatric-hypoglycemic-seizure-active-risk'] as const;
const apply = (subject: AnesthesiaEngine, action: unknown,
  type = 'pediatric-hypoglycemic-seizure-response') =>
  subject.apply({ tick: subject.tick, type, payload: { action: action as never } });

describe('pediatric hypoglycemic seizure engine contract', () => {
  it('uses the exact target and action contract without learner treatment controls', () => {
    expect(SCENARIO.metadata.id).toBe('pediatric-hypoglycemic-seizure');
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.some(({ type, target }) => type === 'narrative'
      && target === 'pediatric-hypoglycemic-seizure-reassessment')).toBe(true);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    expect(narrative).toContain('34 mg/dL');
    expect(narrative).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:mg\/kg|g\/kg|mL\/kg|mL\/h)\b/i);
  });

  it('moves only from the frozen initial state to the frozen later report', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 991, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ coreTemperatureC: 36.6, heartRateBpm: 132,
      respiratoryRateBpm: 24, systolicMmHg: 98, diastolicMmHg: 62,
      meanArterialMmHg: 74, spo2Percent: 99 });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]);
    const later = subject.step();
    expect(later.state).toMatchObject({ coreTemperatureC: 36.7, heartRateBpm: 106,
      respiratoryRateBpm: 20, systolicMmHg: 100, diastolicMmHg: 64,
      meanArterialMmHg: 76, spo2Percent: 99 });
    const laterReport = later.events.find(({ eventId }) =>
      eventId.startsWith('pediatric-hypoglycemic-seizure-later-response-reviewed-'));
    expect(laterReport?.message).toContain('he is awake, follows commands, uses age-appropriate speech');
    expect(laterReport?.message).toContain('remains tired, with no recurrent convulsion');
    expect(later.equipment.resuscitation.crystalloidTotalMl).toBe(0);
    expect(later.equipment.resuscitation.pediatricHypoglycemicSeizureAssessment).toMatchObject({
      seizureAuthored: true, hypoglycemiaAuthored: true,
      initialGlucoseMgPerDl: 34, laterGlucoseMgPerDl: 86,
      qualifiedRescueOwnershipActive: true, qualifiedSafetyReviewActive: true,
      laterReportAuthored: true, patientExaminedByLearner: false,
      glucoseAcquiredByLearner: false, glucoseInterpretedByLearner: false,
      diagnosisMadeByLearner: false, drugSelectedByLearner: false,
      glucoseFormulationSelectedByLearner: false, doseSelectedByLearner: false,
      concentrationSelectedByLearner: false, routeSelectedByLearner: false,
      volumeSelectedByLearner: false, rateSelectedByLearner: false,
      accessPlacedByLearner: false, deviceSelectedByLearner: false,
      drugDeliveredByLearner: false, glucoseDeliveredByLearner: false,
      airwayManeuverPerformedByLearner: false, procedurePerformedByLearner: false,
      treatmentDeliveredByLearner: false, treatmentEffectProven: false,
      seizureCauseProven: false, durableEuglycemiaProven: false,
      neurologicRecoveryProven: false, recurrenceExcluded: false,
      dispositionDetermined: false, outcomePredicted: false,
    });
  });

  it('allows rescue and safety in either order and enforces both strict elapsed gates', () => {
    for (const parallel of [[ACTIONS[2], ACTIONS[3]], [ACTIONS[3], ACTIONS[2]]] as const) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 992, practiceRegion: 'US' });
      subject.step(); apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]);
      apply(subject, parallel[0]); apply(subject, parallel[1]); apply(subject, ACTIONS[4]);
      let frame = subject.step();
      expect(frame.events.some(({ eventId }) => eventId.includes('later-time-refused'))).toBe(true);
      apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); frame = subject.step();
      expect(frame.events.some(({ eventId }) => eventId.includes('handoff-time-refused'))).toBe(true);
      apply(subject, ACTIONS[5]); frame = subject.step();
      expect(frame.equipment.resuscitation.pediatricHypoglycemicSeizureAssessment)
        .toMatchObject({ rescueAtTick: 1, safetyAtTick: 1,
          laterResponseAtTick: 2, handoffAtTick: 3 });
    }
  });

  it('refuses every missing prerequisite without mutating accepted state', () => {
    const cases: readonly [readonly string[], string][] = [
      [[], ACTIONS[1]], [[], ACTIONS[2]], [[], ACTIONS[3]], [[], ACTIONS[4]], [[], ACTIONS[5]],
      [[ACTIONS[0]], ACTIONS[2]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]],
    ];
    for (const [prepare, action] of cases) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 993, practiceRegion: 'US' });
      subject.step(); for (const item of prepare) apply(subject, item);
      const before = subject.step().equipment.resuscitation;
      apply(subject, action); const after = subject.step();
      expect(after.equipment.resuscitation).toEqual(before);
      expect(after.events.some(({ eventId }) => eventId.includes('-refused-'))).toBe(true);
    }
  });

  it('immutably refuses generic, adult, neurologic, metabolic, and hostile shortcuts', () => {
    const blocked = ['bolus', 'infusion', 'fluid', 'ventilator', 'airway-device',
      'airway-maneuver', 'laryngoscopy', 'glycemic-response',
      'diabetic-ketoacidosis-response', 'pediatric-diabetic-ketoacidosis-response',
      'status-epilepticus-response', 'critical-care-status-epilepticus-response',
      'hyponatremia-response', 'intracranial-hypertension-response',
      'opioid-toxicity-response', 'emergency-anaphylaxis-response'] as const;
    const shortcuts: unknown[] = ['give-dextrose', 'give-glucagon', 'give-lorazepam',
      'select-iv-route', 'choose-dose', 'choose-concentration', 'intubate', 'declare-recovered',
      'discharge', '__proto__', 'constructor', '', null, {}, ['handoff']];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 994, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 994, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: -999, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    expect(refused.equipment.resuscitation.crystalloidTotalMl).toBe(0);
  });

  it.each([undefined, null, [],
    { type: 'pediatric-hypoglycemic-seizure-response', payload: null },
    { type: 4, payload: {} },
    { type: 'pediatric-hypoglycemic-seizure-response', payload: [] }] as const)(
    'calmly refuses malformed runtime action %# and continues', (malformed) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 995, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 995, practiceRegion: 'US' });
      subject.step(); control.step(); subject.apply(malformed as never);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      apply(subject, ACTIONS[0]);
      expect(subject.step().equipment.resuscitation
        .pediatricHypoglycemicSeizureAssessment?.trajectoryAtTick).not.toBeNull();
    },
  );

  it('preserves first accepted ticks across duplicates and replays deterministically', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 996, practiceRegion: 'US' });
    subject.step();
    for (const action of ACTIONS.slice(0, 2)) { apply(subject, action); apply(subject, action); }
    subject.step();
    for (const action of ACTIONS.slice(2, 4)) { apply(subject, action); apply(subject, action); }
    subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
    subject.step(); apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
    const final = subject.step();
    expect(final.equipment.resuscitation.pediatricHypoglycemicSeizureAssessment).toMatchObject({
      trajectoryAtTick: 1, recognitionAtTick: 1, rescueAtTick: 2, safetyAtTick: 2,
      laterResponseAtTick: 3, handoffAtTick: 4,
    });
    const scheduled = (parallel: readonly [string, string]): LearnerAction[] => [
      { tick: 0, type: 'pediatric-hypoglycemic-seizure-response', payload: { action: ACTIONS[0] } },
      { tick: 0, type: 'pediatric-hypoglycemic-seizure-response', payload: { action: ACTIONS[1] } },
      { tick: 1, type: 'pediatric-hypoglycemic-seizure-response', payload: { action: parallel[0] } },
      { tick: 1, type: 'pediatric-hypoglycemic-seizure-response', payload: { action: parallel[1] } },
      { tick: 1, type: 'pediatric-hypoglycemic-seizure-response', payload: { action: parallel[1] } },
      { tick: 2, type: 'pediatric-hypoglycemic-seizure-response', payload: { action: ACTIONS[4] } },
      { tick: 3, type: 'pediatric-hypoglycemic-seizure-response', payload: { action: ACTIONS[5] } },
    ];
    const options = { scenario: SCENARIO, seed: 996, practiceRegion: 'US', ticks: 11 };
    const rescueFirst = replay(scheduled([ACTIONS[2], ACTIONS[3]]), options);
    const safetyFirst = replay(scheduled([ACTIONS[3], ACTIONS[2]]), options);
    expect(rescueFirst).toEqual(safetyFirst);
    expect(replay(scheduled([ACTIONS[2], ACTIONS[3]]), options)).toEqual(rescueFirst);
    expect(rescueFirst.at(-1)?.state).toMatchObject({ heartRateBpm: 106,
      respiratoryRateBpm: 20, meanArterialMmHg: 76, spo2Percent: 99 });
  });

  it('cannot leak state to adjacent scenarios or accept reverse adjacent actions', () => {
    for (const scenario of [STATUS_EPILEPTICUS, SEVERE_HYPONATREMIA_WITH_SEIZURE,
      DIABETIC_KETOACIDOSIS, PEDIATRIC_DIABETIC_KETOACIDOSIS,
      PEDIATRIC_DEHYDRATION_WITH_HYPOVOLEMIA]) {
      const subject = new AnesthesiaEngine({ scenario, seed: 997, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario, seed: 997, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation.pediatricHypoglycemicSeizureAssessment)
        .toBeUndefined();
    }
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 998, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 998, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of ['status-epilepticus-response', 'hyponatremia-response',
      'diabetic-ketoacidosis-response', 'pediatric-diabetic-ketoacidosis-response']) {
      hostile.apply({ tick: hostile.tick, type, payload: { action: 'review' } });
    }
    expect(hostile.step().equipment.resuscitation)
      .toEqual(control.step().equipment.resuscitation);
  });

  it('requires both exact metadata identity and exact narrative target', () => {
    for (const scenario of [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'not-pediatric-hypoglycemia' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.map((event) =>
        event.target === 'pediatric-hypoglycemic-seizure-reassessment'
          ? { ...event, target: 'pediatric-hypoglycemic-seizure-reassessment-suffix' }
          : event) },
    ]) {
      const subject = new AnesthesiaEngine({ scenario, seed: 999, practiceRegion: 'US' });
      apply(subject, ACTIONS[0]); const frame = subject.step();
      expect(frame.equipment.resuscitation.pediatricHypoglycemicSeizureAssessment).toBeUndefined();
      expect(frame.state).toMatchObject({ heartRateBpm: 132, meanArterialMmHg: 74 });
      expect(frame.events.some(({ eventId }) =>
        eventId.startsWith('pediatric-hypoglycemic-seizure-response-refused-'))).toBe(true);
    }
  });
});
