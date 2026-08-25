import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { ACUTE_KIDNEY_INJURY_WITH_FLUID_OVERLOAD as SCENARIO } from '../../src/modules/critical-care/scenarios/acute-kidney-injury-with-fluid-overload';

describe('critical-care AKI with fluid overload', () => {
  it('validates trajectory-based kidney-support boundaries', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('life-threatening fluid, electrolyte, or acid-base imbalance');
    expect(narrative).toContain('rather than a single creatinine or BUN threshold');
    expect(narrative).toContain('not simulated');
  });
  it('orders recognition, context, fluid limits, support planning, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 120, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 104, meanArterialMmHg: 72,
      respiratoryRateBpm: 20, spo2Percent: 91, coreTemperatureC: 37.4 });
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'aki-fluid-overload-response', payload: { action } });
    for (const action of ['recognize-aki-fluid-overload', 'review-aki-fluid-overload-context',
      'limit-fluid-and-review-diuretic-response', 'activate-individualized-kidney-support-pathway',
      'reassess-aki-fluid-overload-trajectory']) apply(action);
    const completed = subject.step();
    expect(completed.state).toMatchObject({ heartRateBpm: 96, meanArterialMmHg: 74,
      respiratoryRateBpm: 20, spo2Percent: 95, coreTemperatureC: 37.3 });
    expect(completed.equipment.resuscitation.akiFluidOverloadAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), contextAtTick: expect.any(Number),
      fluidPlanAtTick: expect.any(Number), supportAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number) });
    expect(completed.events.find((e) => /^aki-fluid-overload-support-activated-\d+$/.test(e.eventId))?.data)
      .toMatchObject({ universalStartTime: false, modalitySelected: false, treatmentDelivered: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });
  it('refuses premature, duplicate, and unknown responses', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 121, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'aki-fluid-overload-response', payload: { action } });
    apply('activate-individualized-kidney-support-pathway'); apply('dialyze-creatinine');
    apply('recognize-aki-fluid-overload'); apply('recognize-aki-fluid-overload');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.akiFluidOverloadAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), contextAtTick: null, fluidPlanAtTick: null,
      supportAtTick: null, reassessmentAtTick: null });
    expect(refused.events.some((e) => e.eventId.startsWith('aki-fluid-overload-recognition-order-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('aki-fluid-overload-response-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('aki-fluid-overload-recognition-refused-'))).toBe(true);
  });
});
