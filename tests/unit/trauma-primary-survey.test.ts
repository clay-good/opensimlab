import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { TRAUMA_PRIMARY_SURVEY as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/trauma-primary-survey';

describe('emergency trauma primary survey', () => {
  it('validates a coherent <C>ABCDE major-trauma presentation', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('Direct pressure has failed');
    expect(narrative).toContain('pelvis is authored as mechanically unstable');
    expect(narrative).toContain('repeat <C>ABCDE after interventions');
  });

  it('orders activation, catastrophic hemorrhage, A-B, circulation, D-E, and repeat survey', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 84, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'trauma-primary-survey-response', payload: { action },
    });
    for (const action of ['activate-trauma-primary-survey', 'control-trauma-catastrophic-hemorrhage',
      'review-trauma-airway-and-breathing', 'record-trauma-circulation-response',
      'review-trauma-disability-and-exposure', 'repeat-trauma-primary-survey']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.traumaPrimarySurveyAssessment).toMatchObject({
      activatedAtTick: expect.any(Number), catastrophicHemorrhageAtTick: expect.any(Number),
      airwayBreathingAtTick: expect.any(Number), circulationAtTick: expect.any(Number),
      disabilityExposureAtTick: expect.any(Number), repeatedAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^trauma-circulation-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ intentOnly: true, heartRatePerMin: 124, systolicBpMmHg: 88 });
    expect(completed.events.find((event) => /^trauma-repeated-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ heartRatePerMin: 112, systolicBpMmHg: 100, coreTemperatureC: 35.8 });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses airway fixation before hemorrhage control and CT-before-survey shortcuts', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 85, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'trauma-primary-survey-response', payload: { action },
    });
    apply('activate-trauma-primary-survey');
    apply('review-trauma-airway-and-breathing');
    apply('repeat-trauma-primary-survey');
    apply('send-to-whole-body-ct-first');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.traumaPrimarySurveyAssessment).toMatchObject({
      activatedAtTick: expect.any(Number), catastrophicHemorrhageAtTick: null,
      airwayBreathingAtTick: null, circulationAtTick: null,
      disabilityExposureAtTick: null, repeatedAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('trauma-hemorrhage-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('trauma-primary-survey-response-refused-'))).toBe(true);
  });
});
