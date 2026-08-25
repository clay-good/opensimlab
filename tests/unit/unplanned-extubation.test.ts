import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { UNPLANNED_EXTUBATION as SCENARIO } from '../../src/modules/critical-care/scenarios/unplanned-extubation';

describe('critical-care unplanned extubation', () => {
  it('validates a coherent failing post-extubation trajectory without making every event automatic', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('patient tolerates extubation');
    expect(narrative).toContain('noninvasive support must not delay');
  });

  it('orders support, tolerance assessment, failure classification, airway plan, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 98, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'unplanned-extubation-response', payload: { action } });
    for (const action of ['support-unplanned-extubation-and-call-help',
      'assess-unplanned-extubation-tolerance', 'classify-unplanned-extubation-failure',
      'record-unplanned-extubation-airway-plan', 'reassess-unplanned-extubation-response']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.unplannedExtubationAssessment).toMatchObject({
      supportAtTick: expect.any(Number), assessmentAtTick: expect.any(Number),
      failureAtTick: expect.any(Number), airwayPlanAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^unplanned-extubation-airway-plan-recorded-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ preoxygenation: true, promptReintubation: true, nivDelay: false });
    expect(completed.events.find((event) => /^unplanned-extubation-response-reassessed-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ continuousCapnogram: true, bilateralVentilation: true, incidentReview: true });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature planning, NIV delay, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 99, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'unplanned-extubation-response', payload: { action } });
    apply('record-unplanned-extubation-airway-plan'); apply('delay-with-niv');
    apply('support-unplanned-extubation-and-call-help');
    apply('support-unplanned-extubation-and-call-help');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.unplannedExtubationAssessment)
      .toMatchObject({ supportAtTick: expect.any(Number), assessmentAtTick: null,
        failureAtTick: null, airwayPlanAtTick: null, reassessmentAtTick: null });
    expect(refused.events.some((event) => event.eventId.startsWith('unplanned-extubation-support-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('unplanned-extubation-response-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('unplanned-extubation-support-refused-'))).toBe(true);
  });
});
