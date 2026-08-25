import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { STATUS_EPILEPTICUS as SCENARIO } from '../../src/modules/critical-care/scenarios/status-epilepticus';

describe('critical-care refractory status epilepticus', () => {
  it('validates beyond the emergency first-line lab without universal anesthetic or EEG targets', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('Absence of movement does not prove seizure control');
    expect(narrative).toContain('no universal agent, dose, depth, burst-suppression target, or duration');
    expect(narrative).toContain('not simulated');
  });

  it('orders recognition, pattern, continuous pathway, causes, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 114, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 118, meanArterialMmHg: 62,
      respiratoryRateBpm: 18, spo2Percent: 94, coreTemperatureC: 38.1 });
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'critical-care-status-epilepticus-response', payload: { action } });
    for (const action of ['recognize-refractory-status-epilepticus',
      'review-refractory-status-pattern', 'activate-refractory-status-pathway',
      'address-refractory-status-causes',
      'reassess-refractory-status-trajectory']) apply(action);
    const completed = subject.step();
    expect(completed.state).toMatchObject({ heartRateBpm: 102, meanArterialMmHg: 68,
      respiratoryRateBpm: 18, spo2Percent: 96, coreTemperatureC: 37.9 });
    expect(completed.equipment.resuscitation.criticalCareStatusEpilepticusAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), patternAtTick: expect.any(Number),
      pathwayAtTick: expect.any(Number), causesAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^critical-care-status-pathway-activated-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ continuousAnestheticPathwayActivated: true, continuousEegRequired: true,
        universalAgentOrDose: false, universalBurstSuppressionTarget: false, therapyDelivered: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature, duplicate, and unknown responses', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 115, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'critical-care-status-epilepticus-response', payload: { action } });
    apply('activate-refractory-status-pathway'); apply('repeat-lorazepam');
    apply('recognize-refractory-status-epilepticus');
    apply('recognize-refractory-status-epilepticus');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.criticalCareStatusEpilepticusAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), patternAtTick: null, pathwayAtTick: null,
      causesAtTick: null, reassessmentAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('critical-care-status-recognition-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('critical-care-status-response-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('critical-care-status-recognition-refused-'))).toBe(true);
  });
});
