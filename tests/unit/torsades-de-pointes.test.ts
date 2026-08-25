import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { TORSADES_DE_POINTES as SCENARIO } from '../../src/modules/cardiology/scenarios/torsades-de-pointes';

const action = (subject: AnesthesiaEngine, value: string) => {
  subject.apply({ tick: subject.tick, type: 'torsades-response', payload: { action: value } });
  return subject.step();
};

describe('cardiology torsades de pointes', () => {
  it('validates sustained pulsed long-QT polymorphic VT with mechanical perfusion', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 141, practiceRegion: 'US' });
    const state = subject.step();
    expect(subject.equipment().rhythmId).toBe('torsades-de-pointes');
    expect(state.state).toMatchObject({ heartRateBpm: 220, systolicMmHg: 74,
      diastolicMmHg: 42, meanArterialMmHg: 53, spo2Percent: 96 });
    expect(SCENARIO.timeline.map((event) => event.message).join(' '))
      .toMatch(/weak palpable pulse[\s\S]*QTc 560 ms/i);
  });

  it('requires immediate unsynchronized shock intent, elapsed review, and both prevention lanes', () => {
    for (const order of [['review-torsades-long-qt-context',
      'record-torsades-recurrence-suppression-intent'],
    ['record-torsades-recurrence-suppression-intent', 'review-torsades-long-qt-context']]) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 142, practiceRegion: 'US' });
      const onset = subject.step();
      const results = [action(subject, 'reconcile-torsades-pulse-and-pattern')];
      subject.apply({ tick: subject.tick, type: 'torsades-response',
        payload: { action: 'record-torsades-unsynchronized-shock-intent' } });
      subject.apply({ tick: subject.tick, type: 'torsades-response',
        payload: { action: 'review-torsades-post-shock-rhythm' } });
      const premature = subject.step();
      results.push(premature);
      expect(premature.equipment.rhythmId).toBe('torsades-de-pointes');
      const postShock = action(subject, 'review-torsades-post-shock-rhythm');
      expect(postShock.equipment.rhythmId).toBe('sinus-bradycardia');
      expect(postShock.state).toMatchObject({ heartRateBpm: 52, systolicMmHg: 112,
        diastolicMmHg: 68, meanArterialMmHg: 83 });
      results.push(postShock);
      for (const next of order) results.push(action(subject, next));
      const completed = action(subject, 'handoff-torsades-recurrence-plan');
      expect(completed.equipment.resuscitation.torsadesAssessment).toMatchObject({
        initialPulsePresent: true, shockDeliveredByLearner: false,
        treatmentDeliveredByLearner: false, handoffAtTick: expect.any(Number) });
      expect(completed.equipment.resuscitation.magnesiumSulfateTotalG ?? 0).toBe(0);
      const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
        { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
      expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events,
        ...results.flatMap((result) => result.events), ...completed.events])
        .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    }
  });

  it('refuses delay, synchronization, adjacent pathways, treatment delivery, and hostile shortcuts', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 143, practiceRegion: 'US' });
    subject.step();
    const results = ['review-torsades-long-qt-context', 'give-magnesium-before-shock',
      'record-synchronized-shock-intent', 'deliver-200-joules', 'start-overdrive-pacing',
      'declare-capture', '__proto__'].map((value) => action(subject, value));
    subject.apply({ tick: subject.tick, type: 'wide-tachycardia-response',
      payload: { action: 'record-procainamide-intent' } });
    subject.apply({ tick: subject.tick, type: 'persistent-vf-response',
      payload: { action: 'record-defibrillation-intent' } });
    subject.apply({ tick: subject.tick, type: 'hyperkalemia-response',
      payload: { action: 'record-calcium-intent' } });
    const state = subject.step();
    expect(state.equipment.rhythmId).toBe('torsades-de-pointes');
    expect(state.equipment.resuscitation.torsadesAssessment)
      .toMatchObject({ shockIntentAtTick: null, contextAtTick: null,
        recurrenceIntentAtTick: null, shockDeliveredByLearner: false,
        treatmentDeliveredByLearner: false });
    expect(state.equipment.resuscitation.magnesiumSulfateTotalG ?? 0).toBe(0);
    expect(state.equipment.resuscitation.stableWideTachycardiaAssessment).toBeUndefined();
    expect([...results.flatMap((result) => result.events), ...state.events]
      .filter((event) => event.eventId.includes('refused')).length).toBeGreaterThanOrEqual(8);
  });
});
