import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { SEVERE_ACIDEMIA as SCENARIO } from '../../src/modules/critical-care/scenarios/severe-acidemia';

describe('critical-care severe acidemia', () => {
  it('validates mixed-disorder and treatment boundaries', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('added respiratory acidemia');
    expect(narrative).toContain('no 90-day mortality benefit');
    expect(narrative).toContain('not simulated');
  });
  it('orders recognition, analysis, ventilation, cause planning, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 122, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 122, meanArterialMmHg: 61,
      respiratoryRateBpm: 18, spo2Percent: 95, etco2MmHg: 48, coreTemperatureC: 38.4 });
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'severe-acidemia-response', payload: { action } });
    for (const action of ['recognize-severe-acidemia', 'analyze-severe-acidemia-context',
      'protect-severe-acidemia-ventilation', 'activate-severe-acidemia-cause-plan',
      'reassess-severe-acidemia-trajectory']) apply(action);
    const completed = subject.step();
    expect(completed.state).toMatchObject({ heartRateBpm: 112, meanArterialMmHg: 68,
      respiratoryRateBpm: 18, spo2Percent: 95, etco2MmHg: 32, coreTemperatureC: 38.2 });
    expect(completed.equipment.resuscitation.severeAcidemiaAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), analysisAtTick: expect.any(Number),
      ventilationAtTick: expect.any(Number), causePlanAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number) });
    expect(completed.events.find((e) => /^severe-acidemia-cause-plan-activated-\d+$/.test(e.eventId))?.data)
      .toMatchObject({ bicarbonateUniversal: false, mortalityBenefitClaimed: false,
        urgentKidneySupportAssessmentPreserved: true, treatmentDelivered: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });
  it('refuses premature, duplicate, and unknown responses', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 123, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'severe-acidemia-response', payload: { action } });
    apply('activate-severe-acidemia-cause-plan'); apply('normalize-ph');
    apply('recognize-severe-acidemia'); apply('recognize-severe-acidemia');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.severeAcidemiaAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), analysisAtTick: null, ventilationAtTick: null,
      causePlanAtTick: null, reassessmentAtTick: null });
    expect(refused.events.some((e) => e.eventId.startsWith('severe-acidemia-recognition-order-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('severe-acidemia-response-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('severe-acidemia-recognition-refused-'))).toBe(true);
  });
});
