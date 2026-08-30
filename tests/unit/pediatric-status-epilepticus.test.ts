import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay-engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_STATUS_EPILEPTICUS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-status-epilepticus';
import { PEDIATRIC_FEBRILE_SEIZURE } from '../../src/modules/pediatrics/scenarios/pediatric-febrile-seizure';
import { PEDIATRIC_HYPOGLYCEMIC_SEIZURE } from '../../src/modules/pediatrics/scenarios/pediatric-hypoglycemic-seizure';
import { PEDIATRIC_DIABETIC_KETOACIDOSIS } from '../../src/modules/pediatrics/scenarios/pediatric-diabetic-ketoacidosis';
import { PEDIATRIC_SEPSIS } from '../../src/modules/pediatrics/scenarios/pediatric-sepsis';
import { STATUS_EPILEPTICUS as ADULT_STATUS } from '../../src/modules/emergency-medicine/scenarios/status-epilepticus';
import { SEVERE_HYPONATREMIA_WITH_SEIZURE } from '../../src/modules/emergency-medicine/scenarios/severe-hyponatremia-with-seizure';
import { STATUS_EPILEPTICUS as REFRACTORY_STATUS } from '../../src/modules/critical-care/scenarios/status-epilepticus';

const ACTIONS = ['reconcile-pediatric-status-epilepticus-clock-care-and-whole-child',
  'recognize-pediatric-convulsive-status-after-first-line-care',
  'activate-pediatric-status-epilepticus-qualified-second-line-ownership',
  'review-pediatric-status-epilepticus-airway-causes-and-refractory-boundary',
  'review-pediatric-status-epilepticus-later-response',
  'handoff-pediatric-status-epilepticus-active-risk'] as const;
const apply = (subject: AnesthesiaEngine, action: unknown,
  type = 'pediatric-status-epilepticus-response') =>
  subject.apply({ tick: subject.tick, type, payload: { action: action as never } });

describe('pediatric status-epilepticus engine contract', () => {
  it('uses only the exact narrative-scoped intent contract', () => {
    expect(SCENARIO.metadata.id).toBe('pediatric-status-epilepticus');
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.some(({ type }) => type === 'status-epilepticus')).toBe(false);
    expect(SCENARIO.timeline.some(({ type, target }) => type === 'narrative'
      && target === 'pediatric-status-epilepticus-reassessment')).toBe(true);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    expect(narrative).toContain('14 minutes 30 seconds');
    expect(narrative).toContain('point-of-care glucose is 108 mg/dL');
    expect(narrative).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:mg\/kg|mg IV|mL\/kg|mL\/h)\b/i);
  });

  it('reports exact authored initial and minute-25 states without learner ownership', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1101, practiceRegion: 'US' });
    const initial = subject.step();
    expect(initial.state).toMatchObject({ coreTemperatureC: 37.2, heartRateBpm: 146,
      systolicMmHg: 106, diastolicMmHg: 68, meanArterialMmHg: 81, spo2Percent: 94 });
    expect(initial.equipment.invalidParameters).toEqual(expect.arrayContaining([
      'respiratoryRateBpm', 'etco2MmHg',
    ]));
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]);
    const later = subject.step();
    expect(later.state).toMatchObject({ coreTemperatureC: 37.2, heartRateBpm: 116,
      respiratoryRateBpm: 22, systolicMmHg: 102, diastolicMmHg: 66,
      meanArterialMmHg: 78, spo2Percent: 98 });
    expect(later.events.find(({ eventId }) => eventId.startsWith(
      'pediatric-status-epilepticus-later-response-reviewed-'))?.message)
      .toMatch(/no visible convulsions.*drowsy.*not at baseline.*unsafe to swallow/i);
    expect(later.equipment.resuscitation.pediatricStatusEpilepticusAssessment).toMatchObject({
      initialOngoingConvulsionAuthored: true, statusThresholdAuthored: true,
      firstLineCareAuthored: true, qualifiedSecondLineOwnershipActive: true,
      qualifiedSafetyReviewActive: true, laterReportAuthored: true,
      patientExaminedByLearner: false, seizureTimedByLearner: false,
      monitoringAcquiredByLearner: false, glucoseAcquiredByLearner: false,
      glucoseInterpretedByLearner: false, testAcquiredByLearner: false,
      testInterpretedByLearner: false, diagnosisMadeByLearner: false,
      drugSelectedByLearner: false, benzodiazepineSelectedByLearner: false,
      antiseizureDrugSelectedByLearner: false, doseSelectedByLearner: false,
      concentrationSelectedByLearner: false, routeSelectedByLearner: false,
      volumeSelectedByLearner: false, rateSelectedByLearner: false,
      accessPlacedByLearner: false, deviceSelectedByLearner: false,
      drugDeliveredByLearner: false, oxygenDeliveredByLearner: false,
      airwayManeuverPerformedByLearner: false, procedurePerformedByLearner: false,
      treatmentDeliveredByLearner: false, seizureCauseProven: false,
      treatmentEffectProven: false, electrographicSeizureControlProven: false,
      durableSeizureControlProven: false, neurologicRecoveryProven: false,
      recurrenceExcluded: false, dischargeReadinessProven: false,
      dispositionDetermined: false, outcomePredicted: false,
    });
    expect(later.equipment.invalidParameters).not.toContain('respiratoryRateBpm');
    expect(later.equipment.invalidParameters).toContain('etco2MmHg');
    expect(later.equipment.resuscitation.crystalloidTotalMl).toBe(0);
  });

  it('allows both parallel orders and enforces both strict elapsed gates', () => {
    for (const parallel of [[ACTIONS[2], ACTIONS[3]], [ACTIONS[3], ACTIONS[2]]] as const) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1102,
        practiceRegion: 'US' });
      subject.step(); apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]);
      apply(subject, parallel[0]); apply(subject, parallel[1]); apply(subject, ACTIONS[4]);
      let frame = subject.step();
      expect(frame.events.some(({ eventId }) => eventId.includes('later-time-refused'))).toBe(true);
      expect(frame.equipment.resuscitation.pediatricStatusEpilepticusAssessment)
        .toMatchObject({ laterResponseAtTick: null, handoffAtTick: null });
      apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); frame = subject.step();
      expect(frame.events.some(({ eventId }) => eventId.includes('handoff-time-refused'))).toBe(true);
      expect(frame.equipment.resuscitation.pediatricStatusEpilepticusAssessment)
        .toMatchObject({ laterResponseAtTick: 2, handoffAtTick: null });
      apply(subject, ACTIONS[5]); frame = subject.step();
      expect(frame.equipment.resuscitation.pediatricStatusEpilepticusAssessment)
        .toMatchObject({ secondLineAtTick: 1, safetyAtTick: 1,
          laterResponseAtTick: 2, handoffAtTick: 3 });
    }
  });

  it('maps the completed exact contract to all six debrief outcomes', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1109,
      practiceRegion: 'US' });
    const onset = subject.step(); const events = [...onset.events];
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    let frame = subject.step(); events.push(...frame.events);
    apply(subject, ACTIONS[4]); frame = subject.step(); events.push(...frame.events);
    apply(subject, ACTIONS[5]); frame = subject.step(); events.push(...frame.events);
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: frame.tick, state: frame.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], events)
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const clone = { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'not-pediatric-status' } };
    expect(objectiveFindings(clone, history, 0, 0, [], events)
      .map(({ outcome }) => outcome)).toEqual(Array(6).fill('not-exercised'));
  });

  it('refuses every missing prerequisite without patient or snapshot mutation', () => {
    const cases: readonly [readonly string[], string][] = [
      [[], ACTIONS[1]], [[], ACTIONS[2]], [[], ACTIONS[3]], [[], ACTIONS[4]], [[], ACTIONS[5]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]],
    ];
    for (const [prepare, action] of cases) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1103,
        practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1103,
        practiceRegion: 'US' });
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, action);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.events.some(({ eventId }) => eventId.includes('-refused-'))).toBe(true);
    }
  });

  it('immutably blocks adult 4 mg, generic drug, airway, test, and adjacent shortcuts', () => {
    const blocked: readonly [string, unknown][] = [
      ['status-epilepticus-response', 'give-lorazepam-4-mg-iv'],
      ['critical-care-status-epilepticus-response', 'activate-refractory-status-pathway'],
      ['seizure-suppression', {}], ['bolus', {}], ['infusion', {}], ['inject-crisis', {}],
      ['oxygen-device-failure-response', {}], ['airway-device', {}], ['airway-maneuver', {}],
      ['laryngoscopy', {}], ['pediatric-hypoglycemic-seizure-response', {}],
      ['pediatric-febrile-seizure-response', {}], ['hyponatremia-response', {}],
      ['pediatric-sepsis-response', {}], ['pediatric-diabetic-ketoacidosis-response', {}],
    ];
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1104,
      practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1104,
      practiceRegion: 'US' });
    subject.step(); control.step();
    for (const [type, action] of blocked) subject.apply({ tick: -999, type,
      payload: (type.endsWith('-response') ? { action } : action) as never });
    for (const shortcut of ['give-pediatric-benzodiazepine', 'select-second-line-dose',
      'intubate-now', 'declare-seizure-controlled', 'exclude-recurrence', 'discharge',
      '__proto__', 'constructor', '', null, {}, ['handoff']]) apply(subject, shortcut);
    const refused = subject.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
  });

  it.each([undefined, null, [], { type: 'pediatric-status-epilepticus-response', payload: null },
    { type: 4, payload: {} },
    { type: 'pediatric-status-epilepticus-response', payload: [] }] as const)(
    'calmly refuses malformed runtime action %# and continues', (malformed) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1105,
        practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1105,
        practiceRegion: 'US' });
      subject.step(); control.step(); subject.apply(malformed as never);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      apply(subject, ACTIONS[0]);
      expect(subject.step().equipment.resuscitation
        .pediatricStatusEpilepticusAssessment?.trajectoryAtTick).not.toBeNull();
    },
  );

  it('preserves first accepted ticks and replays both parallel orders deterministically', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1106,
      practiceRegion: 'US' });
    subject.step();
    for (const action of ACTIONS.slice(0, 2)) { apply(subject, action); apply(subject, action); }
    subject.step();
    for (const action of ACTIONS.slice(2, 4)) { apply(subject, action); apply(subject, action); }
    subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
    subject.step(); apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.pediatricStatusEpilepticusAssessment)
      .toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, secondLineAtTick: 2,
        safetyAtTick: 2, laterResponseAtTick: 3, handoffAtTick: 4 });
    const scheduled = (parallel: readonly [string, string]): LearnerAction[] => [
      { tick: 0, type: 'pediatric-status-epilepticus-response', payload: { action: ACTIONS[0] } },
      { tick: 0, type: 'pediatric-status-epilepticus-response', payload: { action: ACTIONS[1] } },
      { tick: 1, type: 'pediatric-status-epilepticus-response', payload: { action: parallel[0] } },
      { tick: 1, type: 'pediatric-status-epilepticus-response', payload: { action: parallel[1] } },
      { tick: 1, type: 'pediatric-status-epilepticus-response', payload: { action: parallel[1] } },
      { tick: 2, type: 'pediatric-status-epilepticus-response', payload: { action: ACTIONS[4] } },
      { tick: 3, type: 'pediatric-status-epilepticus-response', payload: { action: ACTIONS[5] } },
    ];
    const options = { scenario: SCENARIO, seed: 1106, practiceRegion: 'US', ticks: 11 };
    const secondLineFirst = replay(scheduled([ACTIONS[2], ACTIONS[3]]), options);
    const safetyFirst = replay(scheduled([ACTIONS[3], ACTIONS[2]]), options);
    expect(secondLineFirst).toEqual(safetyFirst);
    expect(replay(scheduled([ACTIONS[2], ACTIONS[3]]), options)).toEqual(secondLineFirst);
    expect(secondLineFirst.at(-1)?.state).toMatchObject({ heartRateBpm: 116,
      respiratoryRateBpm: 22, meanArterialMmHg: 78, spo2Percent: 98 });
  });

  it('cannot leak to adult, refractory, pediatric seizure, metabolic, or infection lessons', () => {
    for (const scenario of [ADULT_STATUS, REFRACTORY_STATUS, PEDIATRIC_FEBRILE_SEIZURE,
      PEDIATRIC_HYPOGLYCEMIC_SEIZURE, SEVERE_HYPONATREMIA_WITH_SEIZURE,
      PEDIATRIC_DIABETIC_KETOACIDOSIS, PEDIATRIC_SEPSIS]) {
      const subject = new AnesthesiaEngine({ scenario, seed: 1107, practiceRegion: 'US' });
      const control = new AnesthesiaEngine({ scenario, seed: 1107, practiceRegion: 'US' });
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation.pediatricStatusEpilepticusAssessment).toBeUndefined();
    }
  });

  it('requires exact metadata identity and exact narrative target', () => {
    for (const scenario of [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'status-epilepticus' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.map((event) =>
        event.target === 'pediatric-status-epilepticus-reassessment'
          ? { ...event, target: 'pediatric-status-epilepticus-reassessment-suffix' }
          : event) },
    ]) {
      const subject = new AnesthesiaEngine({ scenario, seed: 1108, practiceRegion: 'US' });
      apply(subject, ACTIONS[0]); const frame = subject.step();
      expect(frame.equipment.resuscitation.pediatricStatusEpilepticusAssessment).toBeUndefined();
      expect(frame.events.some(({ eventId }) =>
        eventId.startsWith('pediatric-status-epilepticus-response-refused-'))).toBe(true);
    }
  });
});
