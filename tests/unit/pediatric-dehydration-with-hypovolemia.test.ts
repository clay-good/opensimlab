import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_DEHYDRATION_WITH_HYPOVOLEMIA as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-dehydration-with-hypovolemia';
import { PEDIATRIC_SEPSIS } from '../../src/modules/pediatrics/scenarios/pediatric-sepsis';
import { PEDIATRIC_SEPTIC_SHOCK } from '../../src/modules/pediatrics/scenarios/pediatric-septic-shock';
import { SEPTIC_SHOCK } from '../../src/modules/emergency-medicine/scenarios/septic-shock';
import { DIABETIC_KETOACIDOSIS } from '../../src/modules/emergency-medicine/scenarios/diabetic-ketoacidosis';
import { HEMORRHAGIC_SHOCK } from '../../src/modules/emergency-medicine/scenarios/hemorrhagic-shock';
import { ANAPHYLAXIS } from '../../src/modules/emergency-medicine/scenarios/anaphylaxis';

const ACTIONS = ['reconcile-pediatric-dehydration-losses-and-perfusion',
  'recognize-pediatric-dehydration-with-hypovolemia',
  'activate-pediatric-dehydration-qualified-rehydration-ownership',
  'review-pediatric-dehydration-ongoing-losses-and-safety',
  'review-pediatric-dehydration-later-response',
  'handoff-pediatric-dehydration-active-risk'] as const;
const apply = (subject: AnesthesiaEngine, action: unknown,
  type = 'pediatric-dehydration-response') =>
  subject.apply({ tick: subject.tick, type, payload: { action: action as never } });

describe('pediatric dehydration with hypovolemia', () => {
  it('is valid, isolated, compensated, and contains no learner fluid recipe', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 2, sex: 'female', weightKg: 12 });
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['clinical dehydration with compensated volume depletion',
      'weight change is context rather than a stand-alone dehydration or intravascular-deficit calculation',
      'no current shock', 'small frequent amounts']) expect(narrative).toContain(anchor);
    expect(SCENARIO.timeline.some(({ type }) =>
      ['sepsis-pattern', 'shock-pattern', 'blood-loss'].includes(type))).toBe(false);
    expect(narrative).not.toMatch(/\b\d+\s*mL\/kg|mL\/h|4-2-1|repeat every|sodium correction/i);
  });

  it('moves only from the fixed compensated state to the fixed minute-60 report', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 971, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 138, respiratoryRateBpm: 28,
      spo2Percent: 99, systolicMmHg: 90, diastolicMmHg: 56, meanArterialMmHg: 67,
      coreTemperatureC: 37.6 });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]);
    const later = subject.step();
    expect(later.state).toMatchObject({ heartRateBpm: 116, respiratoryRateBpm: 24,
      spo2Percent: 99, systolicMmHg: 92, diastolicMmHg: 58, meanArterialMmHg: 69,
      coreTemperatureC: 37.4 });
    expect(later.equipment.resuscitation.crystalloidTotalMl).toBe(0);
    expect(later.equipment.resuscitation.pediatricDehydrationAssessment).toMatchObject({
      clinicalDehydrationAuthored: true, compensatedHypovolemiaAuthored: true,
      shockAuthored: false, bleedingAuthored: false, sepsisAuthored: false,
      diabeticKetoacidosisAuthored: false, qualifiedRehydrationOwnershipActive: true,
      qualifiedSafetyReviewActive: true, laterReportAuthored: true,
      patientExaminedByLearner: false, dehydrationPercentageCalculatedByLearner: false,
      fluidDeficitCalculatedByLearner: false, maintenanceCalculatedByLearner: false,
      routeSelectedByLearner: false, fluidSelectedByLearner: false,
      fluidVolumeSelectedByLearner: false, fluidRateSelectedByLearner: false,
      fluidDeliveredByLearner: false, treatmentEffectProven: false,
      durableRecoveryProven: false, dispositionDetermined: false, outcomePredicted: false,
    });
  });

  it('allows rehydration and safety lanes in either order, then enforces both elapsed gates', () => {
    for (const parallel of [[ACTIONS[2], ACTIONS[3]], [ACTIONS[3], ACTIONS[2]]] as const) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 972, practiceRegion: 'US' });
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

  it('refuses every valid action when its prerequisite is missing without mutating state', () => {
    const assertRefused = (prepare: (subject: AnesthesiaEngine) => void, action: string) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 973, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 973, practiceRegion: 'US' });
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

  it('immutably refuses generic fluid, shock, sepsis, DKA, adjacent, and hostile actions', () => {
    const blocked = ['bolus', 'infusion', 'fluid', 'ventilator', 'call-for-help',
      'airway-device', 'airway-maneuver', 'laryngoscopy', 'septic-shock-assessment',
      'septic-shock-resuscitation-response', 'undifferentiated-shock-assessment',
      'hemorrhagic-shock-assessment', 'cardiogenic-shock-response', 'mixed-shock-response',
      'diabetic-ketoacidosis-response', 'pediatric-sepsis-response',
      'pediatric-septic-shock-response', 'emergency-anaphylaxis-response'] as const;
    const shortcuts: unknown[] = ['calculate-dehydration-percent', 'give-20-ml-kg-bolus',
      'calculate-deficit', 'calculate-maintenance', 'choose-iv-route', 'choose-ors-volume',
      'replace-sodium', 'give-antidiarrheal', 'declare-rehydrated', 'discharge',
      '__proto__', 'constructor', '', null, {}, ['handoff']];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 974, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 974, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: -999, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    expect(refused.equipment.resuscitation.crystalloidTotalMl).toBe(0);
    expect(refused.equipment.resuscitation.septicShockResuscitationAssessment).toBeUndefined();
    expect(refused.equipment.resuscitation.pediatricSepsisAssessment).toBeUndefined();
    expect(refused.equipment.resuscitation.pediatricSepticShockAssessment).toBeUndefined();
  });

  it.each([undefined, null, [], { type: 'pediatric-dehydration-response', payload: null },
    { type: 4, payload: {} }, { type: 'pediatric-dehydration-response', payload: [] }] as const)(
    'calmly refuses malformed runtime action %# without ending the session', (malformed) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 975, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 975, practiceRegion: 'US' });
      subject.step(); control.step(); subject.apply(malformed as never);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.events.some(({ eventId }) =>
        eventId.startsWith('malformed-action-refused-'))).toBe(true);
      apply(subject, ACTIONS[0]);
      expect(subject.step().equipment.resuscitation.pediatricDehydrationAssessment?.trajectoryAtTick)
        .not.toBeNull();
    },
  );

  it('replays deterministically and preserves accepted ticks across duplicate actions', () => {
    const run = () => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 976, practiceRegion: 'US' });
      const events = [...subject.step().events];
      for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(subject, action); }
      events.push(...subject.step().events); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
      events.push(...subject.step().events); apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
      const final = subject.step(); events.push(...final.events);
      expect(final.equipment.resuscitation.pediatricDehydrationAssessment).toMatchObject({
        trajectoryAtTick: 1, recognitionAtTick: 1, rehydrationAtTick: 1, safetyAtTick: 1,
        laterResponseAtTick: 2, handoffAtTick: 3,
      });
      return { state: final.state, resuscitation: final.equipment.resuscitation,
        eventIds: events.map(({ eventId }) => eventId) };
    };
    expect(run()).toEqual(run());
  });

  it('replays scheduled parallel-lane transcripts identically in either order', () => {
    const scheduled = (parallel: readonly [string, string]): LearnerAction[] => [
      { tick: 0, type: 'pediatric-dehydration-response', payload: { action: ACTIONS[0] } },
      { tick: 0, type: 'pediatric-dehydration-response', payload: { action: ACTIONS[1] } },
      { tick: 1, type: 'pediatric-dehydration-response', payload: { action: parallel[0] } },
      { tick: 1, type: 'pediatric-dehydration-response', payload: { action: parallel[1] } },
      { tick: 1, type: 'pediatric-dehydration-response', payload: { action: parallel[1] } },
      { tick: 2, type: 'pediatric-dehydration-response', payload: { action: ACTIONS[4] } },
      { tick: 3, type: 'pediatric-dehydration-response', payload: { action: ACTIONS[5] } },
    ];
    const options = { scenario: SCENARIO, seed: 977, practiceRegion: 'US', ticks: 11 };
    const rehydrationFirst = replay(scheduled([ACTIONS[2], ACTIONS[3]]), options);
    const safetyFirst = replay(scheduled([ACTIONS[3], ACTIONS[2]]), options);
    expect(rehydrationFirst).toEqual(safetyFirst);
    expect(replay(scheduled([ACTIONS[2], ACTIONS[3]]), options)).toEqual(rehydrationFirst);
    expect(rehydrationFirst.at(-1)?.state).toMatchObject({
      heartRateBpm: 116, meanArterialMmHg: 69,
    });
  });

  it('cannot leak dehydration state into adjacent pediatric, septic-shock, or DKA labs', () => {
    for (const scenario of [PEDIATRIC_SEPSIS, PEDIATRIC_SEPTIC_SHOCK,
      SEPTIC_SHOCK, HEMORRHAGIC_SHOCK, DIABETIC_KETOACIDOSIS, ANAPHYLAXIS]) {
      const subject = new AnesthesiaEngine({ scenario, seed: 978, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario, seed: 978, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation.pediatricDehydrationAssessment).toBeUndefined();
      expect(refused.events.some(({ eventId }) => eventId.includes('refused'))).toBe(true);
    }
  });

  it('requires exact scenario identity and target for state, vitals, controls, and debrief proof', () => {
    for (const scenarioWithoutGuard of [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'not-pediatric-dehydration' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.map((event) =>
        event.target === 'pediatric-dehydration-with-hypovolemia-reassessment'
          ? { ...event, target: 'pediatric-dehydration-with-hypovolemia-reassessment-suffix' }
          : event) },
    ]) {
      const scenario = { ...scenarioWithoutGuard, patient: { ...scenarioWithoutGuard.patient,
        baseline: { ...scenarioWithoutGuard.patient.baseline,
          heartRateBpm: 111, meanArterialMmHg: 70 } } };
      const subject = new AnesthesiaEngine({ scenario, seed: 979, practiceRegion: 'US' });
      apply(subject, ACTIONS[0]); const frame = subject.step();
      expect(frame.equipment.resuscitation.pediatricDehydrationAssessment).toBeUndefined();
      expect(frame.events.some(({ eventId }) =>
        eventId.startsWith('pediatric-dehydration-response-refused-'))).toBe(true);
      expect(frame.state.heartRateBpm).toBe(111);
      expect(frame.state.meanArterialMmHg).toBeCloseTo(70, 10);
      const history = [{ tick: frame.tick, state: frame.state, concentrations: [] }] as never;
      expect(objectiveFindings(scenario, history, 0, 0, [], frame.events)
        .every(({ outcome }) => outcome === 'not-exercised')).toBe(true);
    }
  });
});
