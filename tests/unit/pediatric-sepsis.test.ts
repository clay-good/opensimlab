import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { PEDIATRIC_SEPSIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-sepsis';

const ACTIONS = ['reconcile-pediatric-sepsis-infection-and-organ-dysfunction',
  'distinguish-pediatric-sepsis-without-shock',
  'confirm-pediatric-sepsis-qualified-care-ownership',
  'review-pediatric-sepsis-source-organs-and-alternatives',
  'review-pediatric-sepsis-later-response',
  'handoff-pediatric-sepsis-active-risk'] as const;
const apply = (subject: AnesthesiaEngine, action: unknown, type = 'pediatric-sepsis-response') =>
  subject.apply({ tick: subject.tick, type, payload: { action: action as never } });

describe('pediatric sepsis without shock', () => {
  it('is valid, uses the supported child fixture, and contains no treatment recipe', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 6, sex: 'male', weightKg: 20 });
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['Platelets are 82,000 per microliter', 'INR 1.5',
      '2 coagulation points', 'without current shock', 'not an early screening tool']) {
      expect(narrative).toContain(anchor);
    }
    expect(narrative).not.toMatch(/mg\/kg|mcg\/kg|mg\/mL|repeat every|mL\/h|tube size|PEEP \d/i);
    expect(SCENARIO.timeline.some(({ type }) => type === 'sepsis-pattern')).toBe(false);
  });

  it('moves only from the fixed minute-35 state to the fixed minute-120 report', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 941, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 140, respiratoryRateBpm: 28,
      spo2Percent: 97, systolicMmHg: 104, diastolicMmHg: 62, meanArterialMmHg: 76,
      coreTemperatureC: 39.1 });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]);
    const later = subject.step();
    expect(later.state).toMatchObject({ heartRateBpm: 126, respiratoryRateBpm: 24,
      spo2Percent: 98, systolicMmHg: 102, diastolicMmHg: 60, meanArterialMmHg: 74,
      coreTemperatureC: 38.3 });
    expect(later.equipment.resuscitation.pediatricSepsisAssessment).toMatchObject({
      phoenixSepsisScoreAuthored: 2, phoenixCardiovascularSubscoreAuthored: 0,
      sepsisWithoutShockAuthored: true, hypotensionAuthored: false,
      qualifiedCareOwnershipConfirmed: true, laterReportAuthored: true,
      scoreCalculatedByLearner: false, antimicrobialSelectedByLearner: false,
      fluidVolumeSelectedByLearner: false, fluidRateSelectedByLearner: false,
      fluidDeliveredByLearner: false, oxygenFlowSelectedByLearner: false,
      oxygenDeliveredByLearner: false, treatmentDeliveredByLearner: false,
      durableRecoveryProven: false, dispositionDetermined: false,
    });
  });

  it('enforces serial order and both elapsed gates through debrief', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 942, practiceRegion: 'US' });
    const first = subject.step(); const events = [...first.events];
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    events.push(...subject.step().events);
    expect(events.filter(({ eventId }) => eventId.includes('pattern-order-refused')))
      .toHaveLength(5);
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
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
  });

  it('immutably refuses adult shock, generic treatment, adjacent, and hostile actions', () => {
    const blocked = ['bolus', 'infusion', 'fluid', 'ventilator', 'call-for-help',
      'airway-device', 'airway-maneuver', 'laryngoscopy', 'septic-shock-assessment',
      'septic-shock-resuscitation-response', 'pediatric-respiratory-distress-response',
      'bronchiolitis-response', 'croup-response', 'pediatric-status-asthmaticus-response',
      'emergency-anaphylaxis-response'] as const;
    const shortcuts: unknown[] = ['calculate-phoenix-score', 'wait-for-culture-result',
      'select-ceftriaxone', 'give-20-ml-kg-bolus', 'start-norepinephrine',
      'declare-no-shock-from-bp', 'diagnose-pediatric-sepsis', 'discharge', '__proto__',
      'constructor', '', null, { action: ACTIONS[0] }, ['handoff']];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 943, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 943, practiceRegion: 'US' });
    const initial = hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: -999, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation.crystalloidTotalMl).toBe(0);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    expect(refused.equipment.resuscitation.septicShockAssessment).toEqual({
      infectionAndOrganDysfunctionReviewedAtTick: null, culturesAndLactateAtTick: null,
      antimicrobialIntentAtTick: null, initialCrystalloidAtTick: null,
      postFluidReassessmentAtTick: null, norepinephrineIntentAtTick: null,
      sourceControlEscalationAtTick: null,
    });
    expect(refused.equipment.resuscitation.septicShockResuscitationAssessment).toBeUndefined();
    expect(refused.events.some(({ eventId }) => /^(?:sepsis-|septic-resuscitation-)/.test(eventId)))
      .toBe(false);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('pediatric-sepsis-generic-action-refused-')))
      .toHaveLength(blocked.length);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('pediatric-sepsis-response-refused-')))
      .toHaveLength(shortcuts.length);
    expect(initial.equipment.resuscitation.pediatricSepsisAssessment).toBeDefined();
  });

  it.each([undefined, null, [], { type: 'pediatric-sepsis-response', payload: null },
    { type: 4, payload: {} }, { type: 'pediatric-sepsis-response', payload: [] }] as const)(
    'calmly refuses malformed runtime action %# without ending the session', (malformed) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 945, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 945, practiceRegion: 'US' });
      subject.step(); control.step(); subject.apply(malformed as never);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.events.some(({ eventId }) =>
        eventId.startsWith('malformed-action-refused-'))).toBe(true);
      apply(subject, ACTIONS[0]);
      expect(subject.step().equipment.resuscitation.pediatricSepsisAssessment?.patternAtTick)
        .not.toBeNull();
    },
  );

  it('keeps duplicate ticks immutable and reproduces the full sequence across instances', () => {
    const run = () => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 946, practiceRegion: 'US' });
      const events = [...subject.step().events];
      for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(subject, action); }
      events.push(...subject.step().events); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
      events.push(...subject.step().events); apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
      const final = subject.step(); events.push(...final.events);
      return { state: final.state, resuscitation: final.equipment.resuscitation,
        eventIds: events.map(({ eventId }) => eventId) };
    };
    const first = run(); const second = run();
    expect(first).toEqual(second);
    const assessment = first.resuscitation.pediatricSepsisAssessment!;
    expect(new Set([assessment.patternAtTick, assessment.shockBoundaryAtTick,
      assessment.careAtTick, assessment.sourceReviewAtTick,
      assessment.laterResponseAtTick, assessment.handoffAtTick]).size).toBe(3);
    expect(first.eventIds.filter((id) => id.includes('-refused-')).length).toBeGreaterThanOrEqual(6);
  });

  it('requires exact scenario identity and target for state and controls', () => {
    for (const scenario of [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'not-pediatric-sepsis' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.map((event) => event.target === 'pediatric-sepsis-reassessment'
        ? { ...event, target: 'pediatric-sepsis-reassessment-suffix' } : event) },
    ]) {
      const subject = new AnesthesiaEngine({ scenario, seed: 944, practiceRegion: 'US' });
      apply(subject, ACTIONS[0]); const frame = subject.step();
      expect(frame.equipment.resuscitation.pediatricSepsisAssessment).toBeUndefined();
      expect(frame.events.some(({ eventId }) =>
        eventId.startsWith('pediatric-sepsis-response-refused-'))).toBe(true);
    }
  });
});
