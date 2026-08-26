import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { replay } from '@anesthesia/debrief/replay';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_SEPTIC_SHOCK as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-septic-shock';
import { PEDIATRIC_SEPSIS } from '../../src/modules/pediatrics/scenarios/pediatric-sepsis';
import { SEPTIC_SHOCK } from '../../src/modules/emergency-medicine/scenarios/septic-shock';

const ACTIONS = ['reconcile-pediatric-septic-shock-care-and-trajectory',
  'recognize-pediatric-septic-shock-after-fluid-reassessment',
  'activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership',
  'escalate-pediatric-septic-shock-source-control',
  'review-pediatric-septic-shock-later-response',
  'handoff-pediatric-septic-shock-active-risk'] as const;
const apply = (subject: AnesthesiaEngine, action: unknown,
  type = 'pediatric-septic-shock-response') =>
  subject.apply({ tick: subject.tick, type, payload: { action: action as never } });

describe('pediatric septic shock', () => {
  it('is valid, isolated, and contains no learner treatment recipe', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 4, sex: 'female', weightKg: 16 });
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const anchor of ['two individually reassessed 10 mL/kg',
      '2 cardiovascular points', 'pediatric septic shock',
      'congestion warnings, not proof that fluid caused them',
      'classification after overt organ dysfunction rather than an early screening tool']) {
      expect(narrative).toContain(anchor);
    }
    expect(SCENARIO.timeline.some(({ type }) => type === 'sepsis-pattern')).toBe(false);
    expect(narrative).not.toMatch(/mcg\/kg|mg\/mL|mL\/h|repeat every|MAP target|tube size/i);
  });

  it('moves only from the fixed minute-35 state to the fixed minute-90 report', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 951, practiceRegion: 'US' });
    expect(subject.step().state).toMatchObject({ heartRateBpm: 170, respiratoryRateBpm: 42,
      spo2Percent: 94, systolicMmHg: 66, diastolicMmHg: 32, meanArterialMmHg: 43,
      coreTemperatureC: 39.3 });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]);
    const later = subject.step();
    expect(later.state).toMatchObject({ heartRateBpm: 150, respiratoryRateBpm: 34,
      spo2Percent: 95, systolicMmHg: 84, diastolicMmHg: 48, meanArterialMmHg: 60,
      coreTemperatureC: 38.9 });
    expect(later.equipment.resuscitation.crystalloidTotalMl).toBe(0);
    expect(later.equipment.resuscitation.pediatricSepticShockAssessment).toMatchObject({
      phoenixScoreAuthored: 2, phoenixCardiovascularSubscoreAuthored: 2,
      septicShockAuthored: true, congestionWarningsAuthored: true,
      qualifiedVasoactiveOwnershipActive: true,
      qualifiedSourceControlOwnershipActive: true, laterReportAuthored: true,
      persistentShockAuthored: true, scoreCalculatedByLearner: false,
      imagingInterpretedByLearner: false, fluidVolumeSelectedByLearner: false,
      fluidDeliveredByLearner: false, vasoactiveSelectedByLearner: false,
      vasoactiveRateSelectedByLearner: false, sourceControlPerformedByLearner: false,
      treatmentEffectProven: false, durableRecoveryProven: false,
      dispositionDetermined: false, outcomePredicted: false,
    });
  });

  it('allows rescue and source lanes in either order, then enforces both elapsed gates', () => {
    for (const parallel of [[ACTIONS[2], ACTIONS[3]], [ACTIONS[3], ACTIONS[2]]] as const) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 952, practiceRegion: 'US' });
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
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 957, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 957, practiceRegion: 'US' });
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

  it('immutably refuses adult shock, generic treatment, adjacent, and hostile actions', () => {
    const blocked = ['bolus', 'infusion', 'fluid', 'ventilator', 'call-for-help',
      'airway-device', 'airway-maneuver', 'laryngoscopy', 'septic-shock-assessment',
      'septic-shock-resuscitation-response', 'undifferentiated-shock-assessment',
      'hemorrhagic-shock-assessment', 'cardiogenic-shock-response', 'mixed-shock-response',
      'pediatric-sepsis-response', 'pediatric-respiratory-distress-response',
      'pediatric-status-asthmaticus-response', 'emergency-anaphylaxis-response'] as const;
    const shortcuts: unknown[] = ['calculate-phoenix-score', 'give-10-ml-kg-bolus',
      'repeat-fluid-until-map-normal', 'choose-epinephrine', 'choose-norepinephrine',
      'wait-for-central-line', 'set-infusion-rate', 'perform-pocus', 'drain-source',
      'declare-stabilized', 'discharge', '__proto__', 'constructor', '', null, {}, ['handoff']];
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 953, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 953, practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: -999, type, payload: {} });
    for (const shortcut of shortcuts) apply(hostile, shortcut);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    expect(refused.equipment.resuscitation.crystalloidTotalMl).toBe(0);
    expect(refused.equipment.resuscitation.septicShockResuscitationAssessment).toBeUndefined();
    expect(refused.events.some(({ eventId }) =>
      /^(?:sepsis-|septic-resuscitation-|pediatric-sepsis-(?!septic-shock))/.test(eventId)))
      .toBe(false);
  });

  it.each([undefined, null, [], { type: 'pediatric-septic-shock-response', payload: null },
    { type: 4, payload: {} }, { type: 'pediatric-septic-shock-response', payload: [] }] as const)(
    'calmly refuses malformed runtime action %# without ending the session', (malformed) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 954, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 954, practiceRegion: 'US' });
      subject.step(); control.step(); subject.apply(malformed as never);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.events.some(({ eventId }) =>
        eventId.startsWith('malformed-action-refused-'))).toBe(true);
      apply(subject, ACTIONS[0]);
      expect(subject.step().equipment.resuscitation.pediatricSepticShockAssessment?.trajectoryAtTick)
        .not.toBeNull();
    },
  );

  it('replays deterministically and preserves accepted ticks across duplicate actions', () => {
    const run = () => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 955, practiceRegion: 'US' });
      const events = [...subject.step().events];
      for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(subject, action); }
      events.push(...subject.step().events); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
      events.push(...subject.step().events); apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
      const final = subject.step(); events.push(...final.events);
      return { state: final.state, resuscitation: final.equipment.resuscitation,
        eventIds: events.map(({ eventId }) => eventId) };
    };
    expect(run()).toEqual(run());
  });

  it('replays scheduled parallel-lane transcripts identically in either order', () => {
    const scheduled = (parallel: readonly [string, string]): LearnerAction[] => [
      { tick: 0, type: 'pediatric-septic-shock-response', payload: { action: ACTIONS[0] } },
      { tick: 0, type: 'pediatric-septic-shock-response', payload: { action: ACTIONS[1] } },
      { tick: 1, type: 'pediatric-septic-shock-response', payload: { action: parallel[0] } },
      { tick: 1, type: 'pediatric-septic-shock-response', payload: { action: parallel[1] } },
      { tick: 1, type: 'pediatric-septic-shock-response', payload: { action: parallel[1] } },
      { tick: 2, type: 'pediatric-septic-shock-response', payload: { action: ACTIONS[4] } },
      { tick: 3, type: 'pediatric-septic-shock-response', payload: { action: ACTIONS[5] } },
    ];
    const options = { scenario: SCENARIO, seed: 958, practiceRegion: 'US', ticks: 5 };
    const rescueFirst = replay(scheduled([ACTIONS[2], ACTIONS[3]]), options);
    const sourceFirst = replay(scheduled([ACTIONS[3], ACTIONS[2]]), options);
    expect(rescueFirst).toEqual(sourceFirst);
    expect(replay(scheduled([ACTIONS[2], ACTIONS[3]]), options)).toEqual(rescueFirst);
  });

  it('cannot leak pediatric septic-shock state into adjacent pediatric or adult sepsis labs', () => {
    for (const scenario of [PEDIATRIC_SEPSIS, SEPTIC_SHOCK]) {
      const subject = new AnesthesiaEngine({ scenario, seed: 959, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario, seed: 959, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation.pediatricSepticShockAssessment).toBeUndefined();
      expect(refused.events.some(({ eventId }) =>
        eventId.startsWith('pediatric-septic-shock-response-refused-')
          || eventId.startsWith('pediatric-sepsis-generic-action-refused-'))).toBe(true);
    }
  });

  it('requires exact scenario identity and target for state, vitals, and controls', () => {
    for (const scenarioWithoutGuard of [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'not-pediatric-septic-shock' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.map((event) =>
        event.target === 'pediatric-septic-shock-reassessment'
          ? { ...event, target: 'pediatric-septic-shock-reassessment-suffix' } : event) },
    ]) {
      const scenario = { ...scenarioWithoutGuard, patient: { ...scenarioWithoutGuard.patient,
        baseline: { ...scenarioWithoutGuard.patient.baseline,
          heartRateBpm: 111, meanArterialMmHg: 70 } } };
      const subject = new AnesthesiaEngine({ scenario, seed: 956, practiceRegion: 'US' });
      apply(subject, ACTIONS[0]); const frame = subject.step();
      expect(frame.equipment.resuscitation.pediatricSepticShockAssessment).toBeUndefined();
      expect(frame.events.some(({ eventId }) =>
        eventId.startsWith('pediatric-septic-shock-response-refused-'))).toBe(true);
      expect(frame.state.heartRateBpm).toBe(111);
      expect(frame.state.meanArterialMmHg).toBeCloseTo(70, 10);
    }
  });
});
