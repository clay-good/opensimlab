import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { COPD_EXACERBATION as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/copd-exacerbation';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let index = 1; index < ticks; index += 1) result = subject.step();
  return result;
}

function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'copd-exacerbation-response', payload: { action } });
  return subject.step();
}

describe('COPD exacerbation foundation', () => {
  it('validates and keeps authored monitor anchors aligned with obstruction', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 45, practiceRegion: 'US' });
    const affected = advance(subject, 100);
    expect(affected.equipment.airway.bronchospasmSeverity).toBeGreaterThan(0.7);
    expect(affected.state.spo2Percent).toBe(90);
    expect(affected.state.respiratoryRateBpm).toBe(28);
    expect(affected.state.meanArterialMmHg).toBeGreaterThan(65);
  });

  it('enforces assessment, controlled oxygen, complete initial intent, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 45, practiceRegion: 'US' });
    advance(subject, 100);
    expect(act(subject, '__proto__').events.at(-1)?.eventId)
      .toMatch(/^copd-exacerbation-refused-/);
    expect(act(subject, 'record-controlled-oxygen').events.at(-1)?.eventId)
      .toMatch(/^copd-exacerbation-order-refused-/);
    act(subject, 'review-severity-and-mimics');
    act(subject, 'record-controlled-oxygen');
    const bronchodilators = act(subject, 'give-air-driven-bronchodilators');
    expect(bronchodilators.events.find((entry) =>
      entry.eventId.startsWith('copd-exacerbation-bronchodilators-'))?.data)
      .toMatchObject({ route: 'air-driven-inhaled-bundle', beta2Agonist: true,
        anticholinergic: true });
    const steroid = act(subject, 'record-five-day-corticosteroid-intent');
    expect(steroid.events.find((entry) =>
      entry.eventId.startsWith('copd-exacerbation-corticosteroid-'))?.data)
      .toMatchObject({ prednisoneEquivalentMgPerDay: 40, durationDays: 5 });
    act(subject, 'record-antibiotic-indication');
    const reassessed = act(subject, 'reassess-and-review-ventilatory-support');
    expect(reassessed.state.spo2Percent).toBe(91);
    expect(reassessed.state.respiratoryRateBpm).toBe(22);
    expect(reassessed.equipment.ventilator.fio2).toBe(0.28);
    expect(reassessed.equipment.resuscitation.copdExacerbationAssessment).toMatchObject({
      severityReviewedAtTick: expect.any(Number), controlledOxygenAtTick: expect.any(Number),
      bronchodilatorBundleAtTick: expect.any(Number), corticosteroidIntentAtTick: expect.any(Number),
      antibioticIntentAtTick: expect.any(Number), reassessedAtTick: expect.any(Number),
    });
  });

  it('debriefs only accepted COPD-exacerbation events', () => {
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const actions: LearnerAction[] = [];
    const event = (eventId: string, tick: number): EngineEvent => ({
      eventId, tick, category: 'assessment', severity: 'warning', message: eventId,
    });
    const log = [event('copd-exacerbation-severity-reviewed-10', 10),
      event('copd-exacerbation-oxygen-20', 20),
      event('copd-exacerbation-bronchodilators-30', 30),
      event('copd-exacerbation-corticosteroid-40', 40),
      event('copd-exacerbation-antibiotic-50', 50),
      event('copd-exacerbation-reassessed-60', 60)];
    const findings = objectiveFindings(SCENARIO, history, 0, 0, actions, log);
    expect(findings.map((finding) => finding.outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
  });
});
