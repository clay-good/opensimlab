import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { TARGETED_TEMPERATURE_MANAGEMENT as SCENARIO } from '../../src/modules/critical-care/scenarios/targeted-temperature-management';

describe('critical-care post-arrest temperature control', () => {
  it('validates current protocolized control without a universal target or early prognosis', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('32°C and 37.5°C for at least 36 hours');
    expect(narrative).toContain('no one temperature in that range is taught as universally superior');
    expect(narrative).toContain('not simulated');
  });

  it('orders recognition, context, protocol, guardrails, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 116, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 98, meanArterialMmHg: 68,
      respiratoryRateBpm: 18, spo2Percent: 96, coreTemperatureC: 38.3 });
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'targeted-temperature-management-response', payload: { action } });
    for (const action of ['recognize-post-arrest-temperature-control',
      'review-post-arrest-temperature-context', 'activate-post-arrest-temperature-protocol',
      'record-temperature-control-guardrails',
      'reassess-post-arrest-temperature-trajectory']) apply(action);
    const completed = subject.step();
    expect(completed.state).toMatchObject({ heartRateBpm: 92, meanArterialMmHg: 70,
      respiratoryRateBpm: 18, spo2Percent: 97, coreTemperatureC: 37.4 });
    expect(completed.equipment.resuscitation.postArrestTemperatureAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), contextAtTick: expect.any(Number),
      protocolAtTick: expect.any(Number), guardrailsAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^post-arrest-temperature-protocol-activated-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ minimumTemperatureC: 32, maximumTemperatureC: 37.5,
        minimumDurationHours: 36, universalBestTarget: false, deviceUsed: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature, duplicate, and unknown responses', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 117, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'targeted-temperature-management-response', payload: { action } });
    apply('activate-post-arrest-temperature-protocol'); apply('cool-everyone-to-33');
    apply('recognize-post-arrest-temperature-control');
    apply('recognize-post-arrest-temperature-control');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.postArrestTemperatureAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), contextAtTick: null, protocolAtTick: null,
      guardrailsAtTick: null, reassessmentAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('post-arrest-temperature-recognition-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('post-arrest-temperature-response-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('post-arrest-temperature-recognition-refused-'))).toBe(true);
  });
});
