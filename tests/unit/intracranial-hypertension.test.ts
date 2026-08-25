import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { INTRACRANIAL_HYPERTENSION as SCENARIO } from '../../src/modules/critical-care/scenarios/intracranial-hypertension';

describe('critical-care intracranial hypertension', () => {
  it('validates current ICP and CPP boundaries without prescribing or prognosticating', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('ICP above 22 mmHg');
    expect(narrative).toContain('60–70 mmHg');
    expect(narrative).toContain('no universal agent, concentration, dose, or route');
    expect(narrative).toContain('not simulated');
  });

  it('orders recognition, context, protection, rescue, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 118, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 88, meanArterialMmHg: 82,
      respiratoryRateBpm: 16, spo2Percent: 97, etco2MmHg: 40, coreTemperatureC: 37.7 });
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'intracranial-hypertension-response', payload: { action } });
    for (const action of ['recognize-intracranial-hypertension',
      'review-intracranial-hypertension-context', 'activate-first-tier-brain-protection',
      'activate-individualized-hyperosmolar-rescue',
      'reassess-intracranial-hypertension-trajectory']) apply(action);
    const completed = subject.step();
    expect(completed.state).toMatchObject({ heartRateBpm: 84, meanArterialMmHg: 84,
      respiratoryRateBpm: 16, spo2Percent: 97, etco2MmHg: 38, coreTemperatureC: 37.5 });
    expect(completed.equipment.resuscitation.intracranialHypertensionAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), contextAtTick: expect.any(Number),
      protectionAtTick: expect.any(Number), rescueAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^intracranial-hypertension-rescue-activated-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ universalAgent: false, doseSelected: false, treatmentDelivered: false });
    expect(completed.events.find((event) => /^intracranial-hypertension-trajectory-reassessed-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ icpMmHg: 19, cppMmHg: 65, durableControlProven: false,
        neurologicOutcomeProven: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature, duplicate, and unknown responses', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 119, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'intracranial-hypertension-response', payload: { action } });
    apply('activate-first-tier-brain-protection'); apply('set-cpp-to-80');
    apply('recognize-intracranial-hypertension'); apply('recognize-intracranial-hypertension');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.intracranialHypertensionAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), contextAtTick: null, protectionAtTick: null,
      rescueAtTick: null, reassessmentAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('intracranial-hypertension-recognition-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('intracranial-hypertension-response-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('intracranial-hypertension-recognition-refused-'))).toBe(true);
  });
});
