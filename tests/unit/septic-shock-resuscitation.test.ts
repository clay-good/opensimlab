import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { SEPTIC_SHOCK_RESUSCITATION as SCENARIO } from '../../src/modules/critical-care/scenarios/septic-shock-resuscitation';

const ACTIONS = ['reconcile-septic-shock-resuscitation-so-far',
  'reassess-septic-shock-perfusion', 'test-septic-shock-fluid-responsiveness',
  'individualize-septic-shock-support-and-source-control',
  'reassess-septic-shock-trajectory'];

describe('critical-care persistent septic-shock resuscitation', () => {
  it('validates dynamic reassessment, no-blind-fluid, and treatment boundaries', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('command, delivery, and effect remain separate claims');
    expect(narrative).toContain('do not support a blind repeat-fluid bolus');
    expect(narrative).toContain('not universal cutoffs');
    const ordinary = new AnesthesiaEngine({ scenario: ROUTINE_INDUCTION,
      seed: 142, practiceRegion: 'US' }).step();
    expect(ordinary.equipment.resuscitation.septicShockResuscitationAssessment).toBeUndefined();
  });

  it('orders context, perfusion, dynamic fluid review, parallel plan, and trajectory proof', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 141, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 118, meanArterialMmHg: 64,
      respiratoryRateBpm: 24, spo2Percent: 94, etco2MmHg: 31, coreTemperatureC: 39.1 });
    for (const action of ACTIONS) subject.apply({ tick: subject.tick,
      type: 'septic-shock-resuscitation-response', payload: { action } });
    const completed = subject.step();
    expect(completed.state).toMatchObject({ heartRateBpm: 110, meanArterialMmHg: 68,
      respiratoryRateBpm: 23, spo2Percent: 94, etco2MmHg: 33, coreTemperatureC: 39 });
    expect(completed.equipment.resuscitation.septicShockResuscitationAssessment).toMatchObject({
      contextAtTick: expect.any(Number), perfusionAtTick: expect.any(Number),
      fluidResponseAtTick: expect.any(Number), planAtTick: expect.any(Number),
      reassessedAtTick: expect.any(Number), passiveLegRaiseStrokeVolumeChangePercent: 2,
      blindRepeatFluidOffered: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature planning, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 143, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'septic-shock-resuscitation-response', payload: { action } });
    apply(ACTIONS[3]!); apply('give-another-liter'); apply(ACTIONS[0]!); apply(ACTIONS[0]!);
    const refused = subject.step();
    expect(refused.equipment.resuscitation.septicShockResuscitationAssessment).toMatchObject({
      contextAtTick: expect.any(Number), perfusionAtTick: null, fluidResponseAtTick: null,
      planAtTick: null, reassessedAtTick: null, blindRepeatFluidOffered: false });
    expect(refused.events.some((e) => e.eventId.startsWith('septic-resuscitation-context-order-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('septic-resuscitation-response-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('septic-resuscitation-context-refused-'))).toBe(true);
  });
});
