import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { HYPERKALEMIC_CONDUCTION_DISTURBANCE as SCENARIO }
  from '../../src/modules/cardiology/scenarios/hyperkalemic-conduction-disturbance';

const action = (subject: AnesthesiaEngine, value: string) => {
  subject.apply({ tick: subject.tick, type: 'hyperkalemic-conduction-response',
    payload: { action: value } });
  return subject.step();
};

describe('cardiology hyperkalemic conduction disturbance', () => {
  it('validates a pulsed post-emergency conduction trajectory distinct from complete block', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 151, practiceRegion: 'US' });
    const state = subject.step();
    expect(state.equipment.rhythmId).toBe('hyperkalemic-conduction');
    expect(state.state).toMatchObject({ heartRateBpm: 52, systolicMmHg: 118,
      diastolicMmHg: 70, meanArterialMmHg: 86, spo2Percent: 97 });
    expect(SCENARIO.timeline.map((event) => event.message).join(' '))
      .toMatch(/potassium 6\.9 mmol\/L[\s\S]*QRS 154 ms[\s\S]*QRS 112 ms/i);
  });

  it('allows three review lanes in parallel and requires separate elapsed panel and handoff phases', () => {
    for (const order of [['review-hyperkalemic-conduction-calcium-response',
      'review-hyperkalemic-conduction-shift-surveillance',
      'review-hyperkalemic-conduction-removal-and-device-restraint'],
    ['review-hyperkalemic-conduction-removal-and-device-restraint',
      'review-hyperkalemic-conduction-calcium-response',
      'review-hyperkalemic-conduction-shift-surveillance']]) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 152, practiceRegion: 'US' });
      const onset = subject.step();
      const results = [action(subject, 'reconcile-hyperkalemic-conduction-trajectory')];
      results.push(action(subject, order[0]!), action(subject, order[1]!));
      subject.apply({ tick: subject.tick, type: 'hyperkalemic-conduction-response',
        payload: { action: order[2]! } });
      subject.apply({ tick: subject.tick, type: 'hyperkalemic-conduction-response',
        payload: { action: 'review-hyperkalemic-conduction-later-panel' } });
      const prematurePanel = subject.step(); results.push(prematurePanel);
      expect(prematurePanel.equipment.rhythmId).toBe('hyperkalemic-conduction');
      subject.apply({ tick: subject.tick, type: 'hyperkalemic-conduction-response',
        payload: { action: 'review-hyperkalemic-conduction-later-panel' } });
      subject.apply({ tick: subject.tick, type: 'hyperkalemic-conduction-response',
        payload: { action: 'handoff-hyperkalemic-conduction-reassessment' } });
      const prematureHandoff = subject.step(); results.push(prematureHandoff);
      expect(prematureHandoff.equipment.rhythmId).toBe('sinus');
      expect(prematureHandoff.state).toMatchObject({ heartRateBpm: 62,
        systolicMmHg: 122, diastolicMmHg: 72, meanArterialMmHg: 89 });
      const completed = action(subject, 'handoff-hyperkalemic-conduction-reassessment');
      expect(completed.equipment.resuscitation.hyperkalemicConductionAssessment).toMatchObject({
        initialPulsePresent: true, treatmentDeliveredByLearner: false,
        pacingDelivered: false, captureAssessed: false, permanentDeviceSelected: false,
        handoffAtTick: expect.any(Number) });
      const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
        { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
      expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events,
        ...results.flatMap((result) => result.events), ...completed.events])
        .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    }
  });

  it('refuses emergency-treatment, pacing, rhythm, arrest, and hostile shortcuts', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 153, practiceRegion: 'US' });
    subject.step();
    const results = ['implant-pacemaker-now', 'declare-capture', 'set-rhythm-paced',
      'calcium-lowered-potassium', 'ecg-normal-so-resolved', 'advance-one-tick-as-one-hour',
      '__proto__'].map((value) => action(subject, value));
    subject.apply({ tick: subject.tick, type: 'hyperkalemia-response',
      payload: { action: 'record-hyperkalemia-calcium-intent' } });
    subject.apply({ tick: subject.tick, type: 'complete-heart-block-response',
      payload: { action: 'activate-complete-heart-block-pathway' } });
    subject.apply({ tick: subject.tick, type: 'unstable-bradycardia-response',
      payload: { action: 'record-atropine-intent' } });
    subject.apply({ tick: subject.tick, type: 'stable-wide-tachycardia-response',
      payload: { action: 'record-procainamide-intent' } });
    subject.apply({ tick: subject.tick, type: 'defibrillation',
      payload: { energyJ: 200, waveform: 'biphasic' } });
    const state = subject.step();
    expect(state.equipment.rhythmId).toBe('hyperkalemic-conduction');
    expect(state.equipment.resuscitation.hyperkalemicConductionAssessment?.reconciledAtTick).toBeNull();
    expect(state.equipment.resuscitation.hyperkalemiaAssessment?.calciumAtTick).toBeNull();
    expect(state.equipment.resuscitation.completeHeartBlockAssessment).toBeUndefined();
    expect([...results.flatMap((result) => result.events), ...state.events]
      .filter((event) => event.eventId.includes('refused')).length).toBeGreaterThanOrEqual(11);
  });
});
