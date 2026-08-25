import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { EXERTIONAL_HEAT_STROKE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/exertional-heat-stroke';

describe('emergency exertional heat stroke', () => {
  it('validates CNS dysfunction, measured core hyperthermia, and immediate mimics', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('rectal core temperature of 41.3°C');
    expect(narrative).toContain('glucose is 110 mg/dL and sodium 139 mmol/L');
    expect(narrative).toContain('do not use antipyretics or dantrolene');
    expect(validateScenario({ ...SCENARIO, patient: { ...SCENARIO.patient,
      baseline: { ...SCENARIO.patient.baseline, coreTemperatureC: 46 } } })[0])
      .toMatchObject({ pointer: '/patient/baseline/coreTemperatureC', rule: 'maximum' });
  });

  it('orders support, rapid immersion, target stop, and multiorgan surveillance', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 82, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'heat-stroke-response', payload: { action },
    });
    for (const action of ['review-heat-stroke-pattern', 'record-heat-stroke-support',
      'record-cold-water-immersion', 'reassess-heat-stroke-cooling-target',
      'record-heat-stroke-organ-surveillance']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.heatStrokeAssessment).toMatchObject({
      patternReviewedAtTick: expect.any(Number), supportAtTick: expect.any(Number),
      coolingAtTick: expect.any(Number), targetAtTick: expect.any(Number),
      surveillanceAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^heat-stroke-cooling-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ intentOnly: true, initialCoreTemperatureC: 41.3, stopBelowC: 39 });
    expect(completed.events.find((event) => /^heat-stroke-target-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ coreTemperatureC: 38.9, elapsedMinutes: 14 });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses cooling-before-support and antipyretic shortcuts', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 83, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'heat-stroke-response', payload: { action },
    });
    apply('review-heat-stroke-pattern');
    apply('record-cold-water-immersion');
    apply('record-heat-stroke-organ-surveillance');
    apply('give-acetaminophen-and-dantrolene');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.heatStrokeAssessment).toMatchObject({
      patternReviewedAtTick: expect.any(Number), supportAtTick: null,
      coolingAtTick: null, targetAtTick: null, surveillanceAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('heat-stroke-support-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('heat-stroke-response-refused-'))).toBe(true);
  });
});
