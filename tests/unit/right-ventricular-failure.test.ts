import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { RIGHT_VENTRICULAR_FAILURE as SCENARIO } from '../../src/modules/critical-care/scenarios/right-ventricular-failure';

describe('critical-care right ventricular failure', () => {
  it('validates a pressure-loaded RV pattern without universal cutoffs or reflex preload rules', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('CVP 18 mmHg');
    expect(narrative).toContain('no single value is a universal diagnostic or treatment cutoff');
    expect(narrative).toContain('without reflex fluid loading or reflex decongestion');
  });

  it('orders recognition, phenotype, support, triggers, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 108, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 116, meanArterialMmHg: 58,
      respiratoryRateBpm: 24, spo2Percent: 91 });
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'right-ventricular-failure-response', payload: { action } });
    for (const action of ['recognize-rv-failure-trajectory', 'review-rv-failure-phenotype',
      'record-rv-failure-support', 'address-rv-failure-triggers',
      'reassess-rv-failure-trajectory']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.rightVentricularFailureAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), phenotypeAtTick: expect.any(Number),
      supportAtTick: expect.any(Number), triggersAtTick: expect.any(Number),
      reassessmentAtTick: expect.any(Number),
    });
    expect(completed.state).toMatchObject({ heartRateBpm: 108, meanArterialMmHg: 66,
      respiratoryRateBpm: 24, spo2Percent: 94 });
    expect(completed.events.find((event) => /^rv-failure-phenotype-reviewed-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ cvpMmHg: 18, wedgePressureMmHg: 10, cardiacIndexLPerMinM2: 1.8,
        pressureLoadedRvPhenotype: true, universalCutoffs: false });
    expect(completed.events.find((event) => /^rv-failure-support-recorded-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ individualizedPreload: true, reflexFluidLoading: false,
        reflexDecongestion: false, intentOnly: true });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature, duplicate, and unknown responses', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 109, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'right-ventricular-failure-response', payload: { action } });
    apply('record-rv-failure-support'); apply('give-two-liters');
    apply('recognize-rv-failure-trajectory'); apply('recognize-rv-failure-trajectory');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.rightVentricularFailureAssessment).toMatchObject({
      recognitionAtTick: expect.any(Number), phenotypeAtTick: null, supportAtTick: null,
      triggersAtTick: null, reassessmentAtTick: null,
    });
    expect(refused.events.some((event) => event.eventId.startsWith('rv-failure-recognition-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('rv-failure-response-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('rv-failure-recognition-refused-'))).toBe(true);
  });
});
