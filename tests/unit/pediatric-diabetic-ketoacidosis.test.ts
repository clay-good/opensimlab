import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay-engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_DIABETIC_KETOACIDOSIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-diabetic-ketoacidosis';
import { PEDIATRIC_DEHYDRATION_WITH_HYPOVOLEMIA } from '../../src/modules/pediatrics/scenarios/pediatric-dehydration-with-hypovolemia';
import { PEDIATRIC_SEPSIS } from '../../src/modules/pediatrics/scenarios/pediatric-sepsis';
import { PEDIATRIC_SEPTIC_SHOCK } from '../../src/modules/pediatrics/scenarios/pediatric-septic-shock';
import { DIABETIC_KETOACIDOSIS } from '../../src/modules/emergency-medicine/scenarios/diabetic-ketoacidosis';
import { HYPERKALEMIA_WITH_ECG_CHANGE } from '../../src/modules/emergency-medicine/scenarios/hyperkalemia-with-ecg-change';
import { SEVERE_HYPONATREMIA_WITH_SEIZURE } from '../../src/modules/emergency-medicine/scenarios/severe-hyponatremia-with-seizure';
import { INTRACRANIAL_HYPERTENSION } from '../../src/modules/critical-care/scenarios/intracranial-hypertension';

const ACTIONS = ['reconcile-pediatric-dka-illness-and-fixed-pattern',
  'recognize-pediatric-dka-and-current-risk',
  'activate-pediatric-dka-qualified-care-ownership',
  'review-pediatric-dka-neurologic-and-metabolic-safety',
  'review-pediatric-dka-later-response',
  'handoff-pediatric-dka-active-risk'] as const;
const apply = (subject: AnesthesiaEngine, action: unknown,
  type = 'pediatric-diabetic-ketoacidosis-response') =>
  subject.apply({ tick: subject.tick, type, payload: { action: action as never } });

describe('pediatric diabetic ketoacidosis', () => {
  it('is valid, pediatric-specific, and contains no learner treatment recipe', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 9, sex: 'female', weightKg: 30 });
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['glucose 468 mg/dL', 'beta-hydroxybutyrate 5.6 mmol/L',
      'pH 7.14', 'bicarbonate 8 mmol/L', 'glucose alone does not establish it',
      'no current authored cerebral-injury warning cluster']) expect(narrative).toContain(anchor);
    expect(SCENARIO.timeline.some(({ target }) => target === 'diabetic-ketoacidosis')).toBe(false);
    expect(SCENARIO.metadata.objectives.some(({ id }) => id.startsWith('record-dka-'))).toBe(false);
    expect(narrative).not.toMatch(/mL\/kg|units\/kg|mL\/h|insulin bolus|corrected sodium|anion gap formula|routine bicarbonate/i);
  });

  it('moves only from the fixed presentation to the fixed minute-60 report', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 981, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 124, respiratoryRateBpm: 30,
      spo2Percent: 99, systolicMmHg: 102, diastolicMmHg: 64, meanArterialMmHg: 77,
      coreTemperatureC: 37.2 });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]);
    const later = subject.step();
    expect(later.state).toMatchObject({ heartRateBpm: 108, respiratoryRateBpm: 24,
      spo2Percent: 99, systolicMmHg: 104, diastolicMmHg: 66, meanArterialMmHg: 79,
      coreTemperatureC: 37.1 });
    expect(later.equipment.resuscitation.crystalloidTotalMl).toBe(0);
    expect(later.equipment.resuscitation.diabeticKetoacidosisAssessment).toEqual({
      presentationReviewedAtTick: null, fluidsAtTick: null, potassiumAtTick: null,
      insulinAtTick: null, dextroseAtTick: null, transitionAtTick: null,
    });
    expect(later.equipment.resuscitation.pediatricDiabeticKetoacidosisAssessment).toMatchObject({
      pediatricDkaAuthored: true, dehydrationAuthored: true, shockAuthored: false,
      cerebralInjuryAuthored: false, cerebralInjuryRiskActive: true,
      qualifiedCareOwnershipActive: true, qualifiedSafetyReviewActive: true,
      laterReportAuthored: true, patientExaminedByLearner: false,
      neurologicExamPerformedByLearner: false, diagnosisMadeByLearner: false,
      dehydrationCalculatedByLearner: false, sodiumCalculatedByLearner: false,
      osmolalityCalculatedByLearner: false, anionGapCalculatedByLearner: false,
      fluidSelectedByLearner: false, insulinSelectedByLearner: false,
      electrolyteSelectedByLearner: false, fluidDeliveredByLearner: false,
      drugSelectedByLearner: false, deviceSelectedByLearner: false,
      procedurePerformedByLearner: false, treatmentDeliveredByLearner: false,
      cerebralInjuryExcluded: false, treatmentEffectProven: false,
      biochemicalResolutionProven: false, durableRecoveryProven: false,
      dispositionDetermined: false, outcomePredicted: false,
    });
  });

  it('allows care and safety lanes in either order, then enforces both elapsed gates', () => {
    for (const parallel of [[ACTIONS[2], ACTIONS[3]], [ACTIONS[3], ACTIONS[2]]] as const) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 982, practiceRegion: 'US' });
      const first = subject.step(); const events = [...first.events];
      apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]);
      apply(subject, parallel[0]); apply(subject, parallel[1]);
      apply(subject, ACTIONS[4]); let frame = subject.step(); events.push(...frame.events);
      expect(frame.events.some(({ eventId }) => eventId.includes('later-time-refused'))).toBe(true);
      apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); frame = subject.step();
      events.push(...frame.events);
      expect(frame.events.some(({ eventId }) => eventId.includes('handoff-time-refused'))).toBe(true);
      apply(subject, ACTIONS[5]); frame = subject.step(); events.push(...frame.events);
      const history = [{ tick: first.tick, state: first.state, concentrations: [] },
        { tick: frame.tick, state: frame.state, concentrations: [] }] as never;
      expect(objectiveFindings(SCENARIO, history, 0, 0, [], events)
        .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    }
  });

  it('refuses missing prerequisites without mutating state', () => {
    const assertRefused = (prepare: (subject: AnesthesiaEngine) => void, action: string) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 983, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 983, practiceRegion: 'US' });
      subject.step(); control.step(); prepare(subject); prepare(control);
      apply(subject, action); const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.events.some(({ eventId }) => eventId.includes('-refused-'))).toBe(true);
    };
    for (const action of ACTIONS.slice(1)) assertRefused(() => {}, action);
    assertRefused((subject) => { apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]);
      apply(subject, ACTIONS[2]); }, ACTIONS[4]);
    assertRefused((subject) => { for (const action of ACTIONS.slice(0, 4)) apply(subject, action); },
      ACTIONS[5]);
  });

  it('immutably refuses adult DKA, fluid, electrolyte, neurologic, and hostile shortcuts', () => {
    const blocked = ['bolus', 'infusion', 'fluid', 'ventilator', 'airway-device',
      'airway-maneuver', 'laryngoscopy', 'diabetic-ketoacidosis-response', 'glycemic-response',
      'hyperkalemia-response', 'hyponatremia-response', 'intracranial-hypertension-response',
      'status-epilepticus-response', 'pediatric-dehydration-response',
      'pediatric-sepsis-response', 'pediatric-septic-shock-response'] as const;
    const shortcuts: unknown[] = ['calculate-corrected-sodium', 'calculate-osmolality',
      'calculate-anion-gap', 'give-insulin-bolus', 'give-rapid-fluid', 'give-bicarbonate',
      'choose-potassium-rate', 'exclude-cerebral-injury', 'declare-resolved', 'discharge',
      '__proto__', 'constructor', '', null, {}, ['handoff']];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 984, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 984, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: -999, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    expect(refused.equipment.resuscitation.crystalloidTotalMl).toBe(0);
    expect(refused.equipment.resuscitation.diabeticKetoacidosisAssessment).toEqual({
      presentationReviewedAtTick: null, fluidsAtTick: null, potassiumAtTick: null,
      insulinAtTick: null, dextroseAtTick: null, transitionAtTick: null,
    });
  });

  it.each([undefined, null, [], { type: 'pediatric-diabetic-ketoacidosis-response', payload: null },
    { type: 4, payload: {} },
    { type: 'pediatric-diabetic-ketoacidosis-response', payload: [] }] as const)(
    'calmly refuses malformed runtime action %# without ending the session', (malformed) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 985, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 985, practiceRegion: 'US' });
      subject.step(); control.step(); subject.apply(malformed as never);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      apply(subject, ACTIONS[0]);
      expect(subject.step().equipment.resuscitation
        .pediatricDiabeticKetoacidosisAssessment?.trajectoryAtTick).not.toBeNull();
    },
  );

  it('replays deterministically and preserves first accepted ticks', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 986, practiceRegion: 'US' });
    subject.step();
    for (const action of ACTIONS.slice(0, 2)) { apply(subject, action); apply(subject, action); }
    subject.step();
    for (const action of ACTIONS.slice(2, 4)) { apply(subject, action); apply(subject, action); }
    subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
    subject.step(); apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
    const final = subject.step();
    expect(final.equipment.resuscitation.pediatricDiabeticKetoacidosisAssessment).toMatchObject({
      trajectoryAtTick: 1, recognitionAtTick: 1, careAtTick: 2, safetyAtTick: 2,
      laterResponseAtTick: 3, handoffAtTick: 4,
    });
    const scheduled = (parallel: readonly [string, string]): LearnerAction[] => [
      { tick: 0, type: 'pediatric-diabetic-ketoacidosis-response', payload: { action: ACTIONS[0] } },
      { tick: 0, type: 'pediatric-diabetic-ketoacidosis-response', payload: { action: ACTIONS[1] } },
      { tick: 1, type: 'pediatric-diabetic-ketoacidosis-response', payload: { action: parallel[0] } },
      { tick: 1, type: 'pediatric-diabetic-ketoacidosis-response', payload: { action: parallel[1] } },
      { tick: 1, type: 'pediatric-diabetic-ketoacidosis-response', payload: { action: parallel[1] } },
      { tick: 2, type: 'pediatric-diabetic-ketoacidosis-response', payload: { action: ACTIONS[4] } },
      { tick: 3, type: 'pediatric-diabetic-ketoacidosis-response', payload: { action: ACTIONS[5] } },
    ];
    const options = { scenario: SCENARIO, seed: 986, practiceRegion: 'US', ticks: 11 };
    const careFirst = replay(scheduled([ACTIONS[2], ACTIONS[3]]), options);
    const safetyFirst = replay(scheduled([ACTIONS[3], ACTIONS[2]]), options);
    expect(careFirst).toEqual(safetyFirst);
    expect(replay(scheduled([ACTIONS[2], ACTIONS[3]]), options)).toEqual(careFirst);
    expect(careFirst.at(-1)?.state).toMatchObject({ heartRateBpm: 108, meanArterialMmHg: 79 });
  });

  it('cannot leak pediatric DKA state into adjacent or adult DKA labs', () => {
    for (const scenario of [DIABETIC_KETOACIDOSIS, PEDIATRIC_DEHYDRATION_WITH_HYPOVOLEMIA,
      PEDIATRIC_SEPSIS, PEDIATRIC_SEPTIC_SHOCK, HYPERKALEMIA_WITH_ECG_CHANGE,
      SEVERE_HYPONATREMIA_WITH_SEIZURE, INTRACRANIAL_HYPERTENSION]) {
      const subject = new AnesthesiaEngine({ scenario, seed: 987, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario, seed: 987, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation.pediatricDiabeticKetoacidosisAssessment)
        .toBeUndefined();
    }
  });

  it('requires exact metadata identity and target for state, vitals, controls, and proof', () => {
    for (const scenarioWithoutGuard of [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'not-pediatric-dka' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.map((event) =>
        event.target === 'pediatric-diabetic-ketoacidosis-reassessment'
          ? { ...event, target: 'pediatric-diabetic-ketoacidosis-reassessment-suffix' }
          : event) },
    ]) {
      const scenario = { ...scenarioWithoutGuard, patient: { ...scenarioWithoutGuard.patient,
        baseline: { ...scenarioWithoutGuard.patient.baseline,
          heartRateBpm: 111, meanArterialMmHg: 70 } } };
      const subject = new AnesthesiaEngine({ scenario, seed: 988, practiceRegion: 'US' });
      apply(subject, ACTIONS[0]); const frame = subject.step();
      expect(frame.equipment.resuscitation.pediatricDiabeticKetoacidosisAssessment).toBeUndefined();
      expect(frame.state).toMatchObject({ heartRateBpm: 111, meanArterialMmHg: 70 });
      const history = [{ tick: frame.tick, state: frame.state, concentrations: [] }] as never;
      expect(objectiveFindings(scenario, history, 0, 0, [], frame.events)
        .every(({ outcome }) => outcome === 'not-exercised')).toBe(true);
    }
  });

  it('hardens the adult DKA engine and debrief against metadata clones', () => {
    const cloned = { ...DIABETIC_KETOACIDOSIS,
      metadata: { ...DIABETIC_KETOACIDOSIS.metadata, id: 'not-adult-dka' } };
    const subject = new AnesthesiaEngine({ scenario: cloned, seed: 989, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: cloned, seed: 989, practiceRegion: 'US' });
    subject.step(); control.step();
    subject.apply({ tick: subject.tick, type: 'diabetic-ketoacidosis-response',
      payload: { action: 'review-dka-presentation' } });
    const refused = subject.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation.diabeticKetoacidosisAssessment)
      .toEqual(untouched.equipment.resuscitation.diabeticKetoacidosisAssessment);
    const history = [{ tick: refused.tick, state: refused.state, concentrations: [] }] as never;
    expect(objectiveFindings(cloned, history, 0, 0, [], refused.events)
      .every(({ outcome }) => outcome === 'not-exercised')).toBe(true);
  });
});
