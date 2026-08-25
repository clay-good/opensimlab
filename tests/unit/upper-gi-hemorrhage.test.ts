import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { UPPER_GI_HEMORRHAGE as SCENARIO } from '../../src/modules/critical-care/scenarios/upper-gi-hemorrhage';

describe('critical-care upper GI hemorrhage', () => {
  it('validates recurrent nonvariceal bleeding without turning a threshold into a universal rule', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('without treating 7 g/dL as a universal trigger');
    expect(narrative).toContain('transcatheter embolization');
    expect(narrative).toContain('not simulated');
  });

  it('orders recognition, pattern, resuscitation, hemostasis escalation, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 112, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 122, meanArterialMmHg: 55,
      respiratoryRateBpm: 24, spo2Percent: 96 });
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'upper-gi-hemorrhage-response', payload: { action } });
    for (const action of ['recognize-recurrent-upper-gi-hemorrhage',
      'review-upper-gi-hemorrhage-pattern', 'record-upper-gi-hemorrhage-resuscitation',
      'activate-repeat-endoscopy-pathway',
      'reassess-upper-gi-hemorrhage-trajectory']) apply(action);
    const completed = subject.step();
    expect(completed.state).toMatchObject({ heartRateBpm: 104, meanArterialMmHg: 68,
      respiratoryRateBpm: 24, spo2Percent: 96 });
    expect(completed.equipment.resuscitation.upperGiHemorrhageAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), patternAtTick: expect.any(Number),
      resuscitationAtTick: expect.any(Number), hemostasisAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^upper-gi-hemorrhage-hemostasis-activated-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ repeatEndoscopyActivated: true, embolizationAfterEndoscopicFailure: true,
        surgeryAfterUnavailableOrFailedEmbolization: true, procedureDelivered: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature, duplicate, and unknown responses', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 113, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'upper-gi-hemorrhage-response', payload: { action } });
    apply('activate-repeat-endoscopy-pathway'); apply('transfuse-to-ten');
    apply('recognize-recurrent-upper-gi-hemorrhage');
    apply('recognize-recurrent-upper-gi-hemorrhage');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.upperGiHemorrhageAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), patternAtTick: null, resuscitationAtTick: null,
      hemostasisAtTick: null, reassessmentAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('upper-gi-hemorrhage-recognition-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('upper-gi-hemorrhage-response-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('upper-gi-hemorrhage-recognition-refused-'))).toBe(true);
  });
});
