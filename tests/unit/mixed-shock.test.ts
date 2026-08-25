import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { MIXED_SHOCK as SCENARIO } from '../../src/modules/critical-care/scenarios/mixed-shock';

describe('critical-care mixed shock', () => {
  it('validates a treatment-context phenotype without universal catheter cutoffs', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('cardiac index 1.7 L/min/m²');
    expect(narrative).toContain('not universal diagnostic cutoffs');
    expect(narrative).toContain('without blind fluid loading');
  });

  it('orders discordance, hemodynamics, support, causes, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 106, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'mixed-shock-response', payload: { action } });
    for (const action of ['recognize-mixed-shock-discordance',
      'classify-mixed-shock-hemodynamics', 'record-mixed-shock-support',
      'address-mixed-shock-causes', 'reassess-mixed-shock-trajectory']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.mixedShockAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), hemodynamicsAtTick: expect.any(Number),
      supportAtTick: expect.any(Number), causesAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^mixed-shock-hemodynamics-classified-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ cardiacIndexLPerMinM2: 1.7, wedgePressureMmHg: 24,
        svrDynSecPerCm5: 720, cardiacVasodilatoryPhenotype: true, universalCutoffs: false });
    expect(completed.events.find((event) => /^mixed-shock-support-recorded-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ toneSupport: true, outputSupportReview: true,
        concurrentSupport: true, primaryFluidLoading: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature, duplicate, and unknown responses', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 107, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'mixed-shock-response', payload: { action } });
    apply('record-mixed-shock-support'); apply('give-two-liters');
    apply('recognize-mixed-shock-discordance'); apply('recognize-mixed-shock-discordance');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.mixedShockAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), hemodynamicsAtTick: null, supportAtTick: null,
      causesAtTick: null, reassessmentAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('mixed-shock-recognition-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('mixed-shock-response-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('mixed-shock-recognition-refused-'))).toBe(true);
  });
});
