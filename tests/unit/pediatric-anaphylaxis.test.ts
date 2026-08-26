import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_ANAPHYLAXIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-anaphylaxis';
import { ANAPHYLAXIS as ADULT_ANAPHYLAXIS } from '../../src/modules/emergency-medicine/scenarios/anaphylaxis';
import { PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC } from '../../src/modules/anesthesia/scenarios/perioperative-anaphylaxis-after-antibiotic';
import { PEDIATRIC_STATUS_ASTHMATICUS } from '../../src/modules/pediatrics/scenarios/pediatric-status-asthmaticus';
import { PEDIATRIC_SEPTIC_SHOCK } from '../../src/modules/pediatrics/scenarios/pediatric-septic-shock';
import { PEDIATRIC_STATUS_EPILEPTICUS } from '../../src/modules/pediatrics/scenarios/pediatric-status-epilepticus';

const ACTIONS = ['reconcile-pediatric-anaphylaxis-exposure-care-and-whole-child',
  'recognize-pediatric-anaphylaxis-persistent-abc-compromise',
  'activate-pediatric-anaphylaxis-qualified-repeat-first-line-and-resuscitation-ownership',
  'review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary',
  'review-pediatric-anaphylaxis-later-response',
  'handoff-pediatric-anaphylaxis-observation-allergy-and-caregiver-risk'] as const;
const apply = (subject: AnesthesiaEngine, action: unknown,
  type = 'pediatric-anaphylaxis-response') =>
  subject.apply({ tick: subject.tick, type, payload: { action: action as never } });

describe('pediatric anaphylaxis engine contract', () => {
  it('uses only the exact narrative-scoped, recipe-free contract', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.id).toBe('pediatric-anaphylaxis');
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.some(({ type }) => type === 'anaphylaxis')).toBe(false);
    expect(SCENARIO.timeline.some(({ target }) => target === 'emergency-anaphylaxis')).toBe(false);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 6, sex: 'male', weightKg: 20,
      heightCm: 115 });
    expect(SCENARIO.timeline.map(({ message }) => message).join(' '))
      .not.toMatch(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|mL)(?:\/kg|\/mL|\/h|\s+IM|\s+IV)\b/i);
  });

  it('reports the exact supplied minute-10 and minute-18 states and nonclaims', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1201, practiceRegion: 'US' });
    let frame = subject.step();
    expect(frame.state).toMatchObject({ coreTemperatureC: 36.7, heartRateBpm: 148,
      respiratoryRateBpm: 34, systolicMmHg: 78, diastolicMmHg: 42,
      meanArterialMmHg: 54, spo2Percent: 91 });
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining(['etco2MmHg', 'fio2']));
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ coreTemperatureC: 36.7, heartRateBpm: 122,
      respiratoryRateBpm: 24, systolicMmHg: 96, diastolicMmHg: 60,
      meanArterialMmHg: 72, spo2Percent: 97 });
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining(['etco2MmHg', 'fio2']));
    expect(frame.equipment.resuscitation.pediatricAnaphylaxisAssessment).toMatchObject({
      plausibleExposureAuthored: true, multisystemCompromiseAuthored: true,
      firstLineCareAuthored: true, qualifiedFirstLineOwnershipActive: true,
      qualifiedSafetyReviewActive: true, laterReportAuthored: true,
      patientExaminedByLearner: false, exposureVerifiedByLearner: false,
      diagnosisMadeByLearner: false, epinephrineSelectedByLearner: false,
      productSelectedByLearner: false, concentrationSelectedByLearner: false,
      doseSelectedByLearner: false, routeSelectedByLearner: false,
      intervalSelectedByLearner: false, oxygenDeliveredByLearner: false,
      fluidDeliveredByLearner: false, treatmentDeliveredByLearner: false,
      anaphylaxisFinallyProven: false, triggerConfirmed: false,
      treatmentEffectProven: false, airwayRiskResolved: false, shockResolved: false,
      refractoryAnaphylaxisExcluded: false, biphasicReactionExcluded: false,
      recurrenceExcluded: false, durableRecoveryProven: false,
      dispositionDetermined: false, outcomePredicted: false,
    });
    expect(frame.equipment.resuscitation.epinephrineTotalMicrograms).toBe(0);
    expect(frame.equipment.resuscitation.crystalloidTotalMl).toBe(0);
  });

  it('enforces strict serial order and both elapsed gates through debrief', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1202, practiceRegion: 'US' });
    const initial = subject.step(); const events = [...initial.events];
    for (const action of ACTIONS.slice(1)) apply(subject, action);
    let frame = subject.step(); events.push(...frame.events);
    expect(frame.equipment.resuscitation.pediatricAnaphylaxisAssessment)
      .toMatchObject({ trajectoryAtTick: null, handoffAtTick: null });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); frame = subject.step(); events.push(...frame.events);
    expect(frame.events.some(({ eventId }) => eventId.includes('later-time-refused'))).toBe(true);
    apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); frame = subject.step();
    events.push(...frame.events);
    expect(frame.events.some(({ eventId }) => eventId.includes('handoff-time-refused'))).toBe(true);
    apply(subject, ACTIONS[5]); frame = subject.step(); events.push(...frame.events);
    expect(frame.equipment.resuscitation.pediatricAnaphylaxisAssessment).toMatchObject({
      trajectoryAtTick: 2, recognitionAtTick: 2, firstLineAtTick: 2, safetyAtTick: 2,
      laterResponseAtTick: 3, handoffAtTick: 4,
    });
    const history = [{ tick: initial.tick, state: initial.state, concentrations: [] },
      { tick: frame.tick, state: frame.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], events).map(({ outcome }) => outcome))
      .toEqual(Array(6).fill('met'));
  });

  it('refuses every missing prerequisite without state or assessment mutation', () => {
    const cases: readonly [readonly string[], string][] = [
      [[], ACTIONS[1]], [[], ACTIONS[2]], [[], ACTIONS[3]], [[], ACTIONS[4]], [[], ACTIONS[5]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]],
    ];
    for (const [prepare, action] of cases) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1203, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1203, practiceRegion: 'US' });
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, action);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    }
  });

  it('immutably blocks adult treatment, generic drug/fluid/device, and adjacent shortcuts', () => {
    const blocked: readonly [string, unknown][] = [
      ['emergency-anaphylaxis-response', 'give-im-epinephrine'],
      ['emergency-anaphylaxis-response', 'give-high-flow-oxygen'],
      ['emergency-anaphylaxis-response', 'begin-fixed-crystalloid'],
      ['anaphylaxis', {}], ['inject-crisis', { crisisId: 'anaphylaxis' }],
      ['bolus', {}], ['infusion', {}], ['fluid', {}],
      ['ventilator', { fio2: 1, delivering: true }], ['airway-device', {}],
      ['airway-maneuver', {}], ['laryngoscopy', {}], ['pediatric-status-asthmaticus-response', {}],
      ['pediatric-septic-shock-response', {}], ['pediatric-status-epilepticus-response', {}],
    ];
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1204, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1204, practiceRegion: 'US' });
    subject.step(); control.step();
    for (const [type, action] of blocked) subject.apply({ tick: -999, type,
      payload: (type.endsWith('-response') ? { action } : action) as never });
    for (const shortcut of ['select-epinephrine-dose', 'intubate-now', 'declare-shock-resolved',
      'discharge', '__proto__', 'constructor', '', null, {}, ['handoff']]) apply(subject, shortcut);
    const refused = subject.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    expect(refused.equipment.ventilator).toEqual(untouched.equipment.ventilator);
  });

  it.each([undefined, null, [], { type: 'pediatric-anaphylaxis-response', payload: null },
    { type: 4, payload: {} },
    { type: 'pediatric-anaphylaxis-response', payload: [] }] as const)(
    'calmly refuses malformed runtime action %# and continues', (malformed) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1205, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1205, practiceRegion: 'US' });
      subject.step(); control.step(); subject.apply(malformed as never);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      apply(subject, ACTIONS[0]);
      expect(subject.step().equipment.resuscitation.pediatricAnaphylaxisAssessment?.trajectoryAtTick)
        .not.toBeNull();
    },
  );

  it('preserves first accepted ticks and replays deterministically', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1206, practiceRegion: 'US' });
    subject.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(subject, action); }
    subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
    subject.step(); apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.pediatricAnaphylaxisAssessment).toMatchObject({
      trajectoryAtTick: 1, recognitionAtTick: 1, firstLineAtTick: 1, safetyAtTick: 1,
      laterResponseAtTick: 2, handoffAtTick: 3,
    });
    const actions: LearnerAction[] = ACTIONS.map((action, index) => ({
      tick: index < 4 ? 0 : index - 3, type: 'pediatric-anaphylaxis-response', payload: { action },
    }));
    const options = { scenario: SCENARIO, seed: 1206, practiceRegion: 'US', ticks: 11 };
    expect(replay(actions, options)).toEqual(replay(actions, options));
    expect(replay(actions, options).at(-1)?.state).toMatchObject({ heartRateBpm: 122,
      respiratoryRateBpm: 24, meanArterialMmHg: 72, spo2Percent: 97 });
  });

  it('requires exact metadata and target and cannot leak into adjacent lessons', () => {
    const wrong = [{ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'anaphylaxis' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.map((event) =>
        event.target === 'pediatric-anaphylaxis-reassessment'
          ? { ...event, target: 'pediatric-anaphylaxis-reassessment-suffix' } : event) },
      ADULT_ANAPHYLAXIS, PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC,
      PEDIATRIC_STATUS_ASTHMATICUS, PEDIATRIC_SEPTIC_SHOCK, PEDIATRIC_STATUS_EPILEPTICUS];
    for (const scenario of wrong) {
      const subject = new AnesthesiaEngine({ scenario, seed: 1207, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario, seed: 1207, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation.pediatricAnaphylaxisAssessment).toBeUndefined();
    }
  });
});
