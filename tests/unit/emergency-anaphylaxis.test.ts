import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { ANAPHYLAXIS as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/anaphylaxis';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let index = 1; index < ticks; index += 1) result = subject.step();
  return result;
}

function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'emergency-anaphylaxis-response', payload: { action } });
  return subject.step();
}

describe('emergency anaphylaxis foundation', () => {
  it('validates a distinct community exposure and produces the shared bounded syndrome', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 43, practiceRegion: 'US' });
    const baseline = subject.step();
    const affected = advance(subject, 300);
    expect(affected.state.meanArterialMmHg).toBeLessThan(baseline.state.meanArterialMmHg);
    expect(affected.state.spo2Percent).toBeLessThan(baseline.state.spo2Percent);
    expect(affected.equipment.airway.bronchospasmSeverity).toBeGreaterThan(0.3);
    expect(affected.equipment.lastExposure?.agentId).toBe('community-food-exposure');
  });

  it('enforces the fixed first-line order and excludes an intravenous bolus pathway', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 43, practiceRegion: 'US' });
    advance(subject, 20);
    expect(act(subject, '__proto__').events.at(-1)?.eventId).toMatch(/^emergency-anaphylaxis-refused-/);
    expect(act(subject, 'give-im-epinephrine').events.at(-1)?.eventId)
      .toMatch(/^emergency-anaphylaxis-order-refused-/);
    act(subject, 'review-systemic-pattern');
    act(subject, 'position-and-call-for-help');
    const epinephrine = act(subject, 'give-im-epinephrine');
    const accepted = epinephrine.events.find((event) => event.eventId.startsWith('epinephrine-im-emergency-'));
    expect(accepted?.data).toMatchObject({ route: 'im', doseMicrograms: 500, teachingModel: true });
    expect(epinephrine.equipment.resuscitation.epinephrineTotalMicrograms).toBe(500);
    act(subject, 'give-high-flow-oxygen');
    act(subject, 'begin-fixed-crystalloid');
    const reassessed = act(subject, 'reassess-response');
    expect(reassessed.equipment.ventilator.fio2).toBe(1);
    expect(reassessed.equipment.resuscitation.crystalloidTotalMl).toBe(1500);
    expect(reassessed.equipment.resuscitation.emergencyAnaphylaxisAssessment).toMatchObject({
      patternReviewedAtTick: expect.any(Number), positionedAndHelpedAtTick: expect.any(Number),
      imEpinephrineAtTick: expect.any(Number), oxygenAtTick: expect.any(Number),
      crystalloidAtTick: expect.any(Number), reassessedAtTick: expect.any(Number),
    });
    expect(act(subject, 'give-im-epinephrine').events.at(-1)?.eventId)
      .toMatch(/^emergency-anaphylaxis-epinephrine-refused-/);
  });

  it('debriefs only accepted emergency-response events', () => {
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const actions: LearnerAction[] = [];
    const event = (eventId: string, tick: number): EngineEvent => ({
      eventId, tick, category: 'assessment', severity: 'warning', message: eventId,
    });
    const log = [
      event('emergency-anaphylaxis-pattern-reviewed-10', 10),
      event('emergency-anaphylaxis-positioned-20', 20),
      event('epinephrine-im-emergency-30', 30),
      event('emergency-anaphylaxis-oxygen-40', 40),
      event('emergency-anaphylaxis-fluid-50', 50),
      event('emergency-anaphylaxis-reassessed-60', 60),
    ];
    const findings = objectiveFindings(SCENARIO, history, 0, 0, actions, log);
    expect(findings.map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met']);
  });
});
