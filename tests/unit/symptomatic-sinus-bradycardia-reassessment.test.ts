import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { SYMPTOMATIC_SINUS_BRADYCARDIA_REASSESSMENT as SCENARIO } from '../../src/modules/cardiology/scenarios/symptomatic-sinus-bradycardia-reassessment';
import { UNSTABLE_BRADYCARDIA as UNSTABLE } from '../../src/modules/emergency-medicine/scenarios/unstable-bradycardia';

const action = (subject: AnesthesiaEngine, value: string) => subject.apply({ tick: subject.tick,
  type: 'symptomatic-bradycardia-response', payload: { action: value } });

describe('cardiology symptomatic sinus bradycardia reassessment', () => {
  it('validates a stable longitudinal contract distinct from acute unstable bradycardia', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const text = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(text).toContain('no AV block'); expect(text).toContain('No minimum heart rate');
    expect(text).not.toContain('1 mg IV atropine');
    expect(SCENARIO.metadata.objectives).not.toEqual(UNSTABLE.metadata.objectives);
  });

  it('allows the two diagnostic lanes in either order and preserves the slow rhythm after handoff', () => {
    for (const order of [['review-symptomatic-bradycardia-context', 'correlate-symptomatic-bradycardia-record'],
      ['correlate-symptomatic-bradycardia-record', 'review-symptomatic-bradycardia-context']]) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 127, practiceRegion: 'US' });
      const onset = subject.step(); action(subject, 'reconcile-symptomatic-bradycardia-stability');
      for (const next of order) action(subject, next);
      action(subject, 'record-symptomatic-bradycardia-pacing-evaluation');
      action(subject, 'handoff-symptomatic-bradycardia-plan');
      const completed = subject.step();
      expect(completed.state).toMatchObject({ heartRateBpm: 44, systolicMmHg: 134,
        diastolicMmHg: 72, meanArterialMmHg: 93, spo2Percent: 98 });
      const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
        { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
      expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
        .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
    }
  });

  it('refuses threshold shortcuts, acute-family actions, and premature pacing', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 128, practiceRegion: 'US' });
    subject.step();
    for (const value of ['pace-because-rate-below-50', 'implant-pacemaker-now', 'give-atropine-1-mg',
      'record-symptomatic-bradycardia-pacing-evaluation', '__proto__']) action(subject, value);
    subject.apply({ tick: subject.tick, type: 'unstable-bradycardia-response',
      payload: { action: 'record-atropine-intent' } });
    const state = subject.step();
    expect(state.equipment.resuscitation.symptomaticBradycardiaAssessment?.pacingEvaluationAtTick).toBeNull();
    expect(state.equipment.resuscitation.unstableBradycardiaAssessment?.atropineAtTick).toBeNull();
    expect(state.events.filter((event) => event.eventId.includes('refused')).length).toBeGreaterThanOrEqual(6);
  });
});
