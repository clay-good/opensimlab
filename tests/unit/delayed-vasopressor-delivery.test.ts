import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { DELAYED_VASOPRESSOR_DELIVERY as SCENARIO } from '../../src/modules/critical-care/scenarios/delayed-vasopressor-delivery';

describe('critical-care delayed vasopressor delivery', () => {
  it('validates command-delivery separation and anti-bolus boundaries', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('separate teaching states');
    expect(narrative).toContain('do not flush or purge concentrated vasopressor into the patient');
    expect(narrative).toContain('does not inspect, measure, calculate');
  });
  it('orders discordance review, path trace, classification, safe protocol, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 128, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 124, meanArterialMmHg: 54,
      respiratoryRateBpm: 20, spo2Percent: 95, etco2MmHg: 29, coreTemperatureC: 39 });
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'delayed-vasopressor-delivery-response', payload: { action } });
    for (const action of ['review-vasopressor-command-delivery-discordance',
      'trace-vasopressor-source-to-patient-path', 'classify-vasopressor-dead-space-startup-delay',
      'activate-vasopressor-startup-safety-plan', 'reassess-vasopressor-delivery-and-perfusion']) apply(action);
    const completed = subject.step();
    expect(completed.state).toMatchObject({ heartRateBpm: 108, meanArterialMmHg: 67,
      respiratoryRateBpm: 20, spo2Percent: 95, etco2MmHg: 32, coreTemperatureC: 38.9 });
    expect(completed.equipment.resuscitation.delayedVasopressorDeliveryAssessment).toMatchObject({
      discordanceAtTick: expect.any(Number), pathAtTick: expect.any(Number),
      classifiedAtTick: expect.any(Number), protocolAtTick: expect.any(Number),
      reassessedAtTick: expect.any(Number) });
    expect(completed.events.find((e) => /^vasopressor-delivery-reassessed-\d+$/.test(e.eventId))?.data)
      .toMatchObject({ deliveryDocumented: true, drugDeliveredByControl: false, outcomeProven: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });
  it('refuses premature protocol activation, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 129, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'delayed-vasopressor-delivery-response', payload: { action } });
    apply('activate-vasopressor-startup-safety-plan'); apply('flush-the-line');
    apply('review-vasopressor-command-delivery-discordance');
    apply('review-vasopressor-command-delivery-discordance');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.delayedVasopressorDeliveryAssessment).toMatchObject({
      discordanceAtTick: expect.any(Number), pathAtTick: null, classifiedAtTick: null,
      protocolAtTick: null, reassessedAtTick: null });
    expect(refused.events.some((e) => e.eventId.startsWith('vasopressor-delivery-discordance-order-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('vasopressor-delivery-response-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('vasopressor-delivery-discordance-refused-'))).toBe(true);
  });
});
