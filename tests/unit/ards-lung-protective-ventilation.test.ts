import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { ARDS_LUNG_PROTECTIVE_VENTILATION as SCENARIO } from '../../src/modules/critical-care/scenarios/ards-lung-protective-ventilation';

describe('critical-care ARDS lung-protective ventilation', () => {
  it('validates a coherent fixed moderate-severe ARDS baseline', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('Plateau pressure is authored as 32');
    expect(narrative).toContain('predicted body weight');
  });

  it('orders baseline, PBW, protection, reassessment, and escalation', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 88, practiceRegion: 'US' });
    const onset = subject.step();
    const apply = (action: string) => subject.apply({
      tick: subject.tick, type: 'ards-lung-protective-response', payload: { action },
    });
    for (const action of ['review-ards-baseline', 'calculate-ards-pbw',
      'record-ards-protective-settings', 'reassess-ards-protection',
      'record-ards-peep-prone-escalation']) apply(action);
    const completed = subject.step();
    expect(completed.equipment.resuscitation.ardsLungProtectiveAssessment).toMatchObject({
      baselineAtTick: expect.any(Number), pbwAtTick: expect.any(Number),
      protectionAtTick: expect.any(Number), reassessmentAtTick: expect.any(Number),
      escalationAtTick: expect.any(Number),
    });
    expect(completed.events.find((event) => /^ards-pbw-calculated-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ predictedBodyWeightKg: 61.5, currentMlPerKgPbw: 8.1 });
    expect(completed.events.find((event) => /^ards-protection-reassessed-\d+$/.test(event.eventId))?.data)
      .toMatchObject({ tidalVolumeMl: 370, plateauPressureCmH2O: 27, ph: 7.29 });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses actual-weight settings and escalation before reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 89, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'ards-lung-protective-response', payload: { action } });
    apply('record-ards-protective-settings'); apply('record-ards-peep-prone-escalation');
    apply('set-6-ml-per-kg-actual-weight');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.ardsLungProtectiveAssessment)
      .toMatchObject({ baselineAtTick: null, pbwAtTick: null, protectionAtTick: null,
        reassessmentAtTick: null, escalationAtTick: null });
    expect(refused.events.some((event) => event.eventId.startsWith('ards-baseline-order-refused-'))).toBe(true);
    expect(refused.events.some((event) => event.eventId.startsWith('ards-lung-protective-response-refused-'))).toBe(true);
  });
});
