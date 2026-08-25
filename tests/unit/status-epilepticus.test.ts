import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { STATUS_EPILEPTICUS as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/status-epilepticus';

describe('emergency status epilepticus', () => {
  it('validates and produces a bounded active generalized-convulsive signal', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 67, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.equipment.resuscitation).toMatchObject({
      seizureActivityFraction: 1,
      seizureSuppressed: false,
      localAnestheticToxicityFraction: 0,
    });
    expect(onset.events.some((event) => event.eventId.startsWith('status-epilepticus-active-')))
      .toBe(true);
    expect(onset.state).toMatchObject({ heartRateBpm: 118, respiratoryRateBpm: 24,
      spo2Percent: 92 });
  });

  it('requires the ordered first-line path, stops the visible signal, and scores reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 68, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'status-epilepticus-response', payload: { action },
    });
    apply('review-convulsive-status');
    apply('record-status-stabilization');
    apply('give-lorazepam-4-mg-iv');
    const treated = subject.step();
    expect(treated.equipment.resuscitation).toMatchObject({
      seizureActivityFraction: 0,
      seizureSuppressed: true,
      statusEpilepticusAssessment: {
        reviewedAtTick: expect.any(Number), supportedAtTick: expect.any(Number),
        lorazepamAtTick: expect.any(Number), reassessedAtTick: null,
      },
    });
    expect(treated.state).toMatchObject({ heartRateBpm: 98, respiratoryRateBpm: 18,
      spo2Percent: 96 });
    apply('reassess-after-lorazepam');
    const reassessed = subject.step();
    const log = [...onset.events, ...treated.events, ...reassessed.events];
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: reassessed.tick, state: reassessed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], log)
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met']);
  });

  it('refuses out-of-order and LAST-only seizure actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 69, practiceRegion: 'US' });
    subject.step();
    subject.apply({ tick: subject.tick, type: 'status-epilepticus-response',
      payload: { action: 'give-lorazepam-4-mg-iv' } });
    subject.apply({ tick: subject.tick, type: 'seizure-suppression',
      payload: { route: 'iv', medicationClass: 'benzodiazepine' } });
    const refused = subject.step();
    expect(refused.equipment.resuscitation).toMatchObject({
      seizureActivityFraction: 1,
      seizureSuppressed: false,
      statusEpilepticusAssessment: { lorazepamAtTick: null },
    });
    expect(refused.events.some((event) => event.eventId.startsWith(
      'status-epilepticus-order-refused-',
    ))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith(
      'bad-seizure-suppression-',
    ))).toBe(true);
    const history = [{ tick: refused.tick, state: refused.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], refused.events)
      .map((finding) => finding.outcome)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
  });
});
