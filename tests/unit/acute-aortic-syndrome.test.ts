import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { ACUTE_AORTIC_SYNDROME as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/acute-aortic-syndrome';

describe('emergency acute aortic syndrome', () => {
  it('validates an incomplete presentation whose asymmetry is not leaked at arrival', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const presentation = SCENARIO.timeline[0]?.message ?? '';
    expect(presentation).toContain('initially symmetric');
    expect(presentation).toContain('acute coronary syndrome remains plausible');
    expect(presentation).not.toContain('36 mmHg');
  });

  it('reveals evolving malperfusion before bounded escalation, anti-impulse intent, imaging, and handoff', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 86, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'acute-aortic-syndrome-response', payload: { action },
    });
    for (const action of ['review-aortic-initial-pattern', 'repeat-aortic-asymmetry-exam',
      'activate-aortic-pathway', 'record-aortic-anti-impulse-intent',
      'prioritize-aortic-imaging', 'repeat-and-handoff-aortic-evolution']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.acuteAorticSyndromeAssessment).toMatchObject({
      initialReviewedAtTick: expect.any(Number), evolutionReviewedAtTick: expect.any(Number),
      escalatedAtTick: expect.any(Number), antiImpulseAtTick: expect.any(Number),
      imagingAtTick: expect.any(Number), handedOffAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^aortic-evolution-reviewed-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ pressureDifferenceMmHg: 36, glucoseMgPerDl: 112 });
    expect(completed.events.find((event) => /^aortic-imaging-prioritized-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ intentOnly: true, resultAvailable: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature pathway, imaging, and unsupported default actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 87, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'acute-aortic-syndrome-response', payload: { action },
    });
    apply('activate-aortic-pathway');
    apply('prioritize-aortic-imaging');
    apply('give-thrombolysis');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.acuteAorticSyndromeAssessment).toMatchObject({
      initialReviewedAtTick: null, evolutionReviewedAtTick: null, escalatedAtTick: null,
      antiImpulseAtTick: null, imagingAtTick: null, handedOffAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('aortic-initial-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('acute-aortic-syndrome-response-refused-'))).toBe(true);
  });
});
