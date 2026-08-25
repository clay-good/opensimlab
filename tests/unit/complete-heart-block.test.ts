import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { COMPLETE_HEART_BLOCK as SCENARIO } from '../../src/modules/cardiology/scenarios/complete-heart-block';

const action = (subject: AnesthesiaEngine, value: string) => {
  subject.apply({ tick: subject.tick, type: 'complete-heart-block-response', payload: { action: value } });
  return subject.step();
};

describe('cardiology complete heart block', () => {
  it('validates an AV-dissociation contract with a ventricular escape and mechanical pulse', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 131, practiceRegion: 'US' });
    const state = subject.step();
    expect(subject.equipment().rhythmId).toBe('complete-heart-block');
    expect(state.state).toMatchObject({ heartRateBpm: 34, systolicMmHg: 116,
      diastolicMmHg: 70, meanArterialMmHg: 85, spo2Percent: 98 });
    expect(SCENARIO.timeline.map((event) => event.message).join(' '))
      .toContain('P waves marching independently');
  });

  it('allows context and escalation in either order, requires elapsed reassessment, and never paces', () => {
    for (const order of [['review-complete-heart-block-context', 'activate-complete-heart-block-pathway'],
      ['activate-complete-heart-block-pathway', 'review-complete-heart-block-context']]) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 132, practiceRegion: 'US' });
      const onset = subject.step(); const results = [action(subject, 'reconcile-complete-heart-block-stability')];
      for (const next of order) results.push(action(subject, next));
      const reassessed = action(subject, 'reassess-complete-heart-block-trajectory');
      const completed = action(subject, 'handoff-complete-heart-block-pacing-plan');
      expect(completed.equipment.rhythmId).toBe('complete-heart-block');
      expect(completed.state.heartRateBpm).toBe(34);
      expect(completed.equipment.resuscitation.completeHeartBlockAssessment)
        .toMatchObject({ pacingDelivered: false, captureAssessed: false,
          reassessmentAtTick: expect.any(Number), handoffAtTick: expect.any(Number) });
      const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
        { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
      expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events,
        ...results.flatMap((result) => result.events), ...reassessed.events, ...completed.events])
        .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
    }
  });

  it('refuses premature, acute-family, sinus-node, capture, and hostile shortcuts', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 133, practiceRegion: 'US' });
    subject.step();
    const results = ['reassess-complete-heart-block-trajectory', 'implant-dual-chamber-now',
      'declare-mechanical-capture', 'permanent-pacing-because-hr-34', '__proto__']
      .map((value) => action(subject, value));
    subject.apply({ tick: subject.tick, type: 'unstable-bradycardia-response',
      payload: { action: 'record-atropine-intent' } });
    subject.apply({ tick: subject.tick, type: 'symptomatic-bradycardia-response',
      payload: { action: 'correlate-symptomatic-bradycardia-record' } });
    const state = subject.step();
    expect(state.equipment.rhythmId).toBe('complete-heart-block');
    expect(state.equipment.resuscitation.completeHeartBlockAssessment?.reassessmentAtTick).toBeNull();
    expect(state.equipment.resuscitation.unstableBradycardiaAssessment?.atropineAtTick).toBeNull();
    expect(state.equipment.resuscitation.symptomaticBradycardiaAssessment).toBeUndefined();
    expect([...results.flatMap((result) => result.events), ...state.events]
      .filter((event) => event.eventId.includes('refused')).length).toBeGreaterThanOrEqual(7);
  });
});
