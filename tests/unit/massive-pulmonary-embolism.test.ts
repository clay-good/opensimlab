import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { MASSIVE_PULMONARY_EMBOLISM as SCENARIO } from '../../src/modules/critical-care/scenarios/massive-pulmonary-embolism';

describe('critical-care massive pulmonary embolism', () => {
  it('validates a confirmed Category E2R rescue bridge without making ECMO clot treatment', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('Category E2R');
    expect(narrative).toContain('not thrombus treatment');
    expect(narrative).toContain('usefulness on VA-ECMO is not established');
  });

  it('orders recognition, pattern, support, bridge, and reassessment with visible physiology', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 110, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 132, meanArterialMmHg: 50,
      respiratoryRateBpm: 26, spo2Percent: 82 });
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'massive-pulmonary-embolism-response', payload: { action } });
    for (const action of ['recognize-refractory-pe-shock', 'review-refractory-pe-pattern',
      'record-refractory-pe-support', 'activate-pe-ecmo-bridge',
      'reassess-pe-ecmo-trajectory']) apply(action);
    const completed = subject.step();
    expect(completed.state).toMatchObject({ heartRateBpm: 112, meanArterialMmHg: 68,
      respiratoryRateBpm: 26, spo2Percent: 94 });
    expect(completed.equipment.resuscitation.massivePulmonaryEmbolismAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), patternAtTick: expect.any(Number),
      supportAtTick: expect.any(Number), ecmoAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^massive-pe-ecmo-activated-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ category: 'E2', vaEcmoPathwayActivated: true,
        resourceDependent: true, thrombusTreatment: false, deviceDelivered: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature, duplicate, and unknown responses', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 111, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'massive-pulmonary-embolism-response', payload: { action } });
    apply('activate-pe-ecmo-bridge'); apply('routine-thrombectomy');
    apply('recognize-refractory-pe-shock'); apply('recognize-refractory-pe-shock');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.massivePulmonaryEmbolismAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), patternAtTick: null, supportAtTick: null,
      ecmoAtTick: null, reassessmentAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('massive-pe-recognition-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('massive-pe-response-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('massive-pe-recognition-refused-'))).toBe(true);
  });
});
