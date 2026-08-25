import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { ADULT_ASTHMA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/adult-asthma';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let index = 1; index < ticks; index += 1) result = subject.step();
  return result;
}

function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'adult-asthma-response', payload: { action } });
  return subject.step();
}

describe('adult asthma foundation', () => {
  it('validates and produces sustained isolated lower-airway obstruction', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 44, practiceRegion: 'US' });
    const affected = advance(subject, 100);
    expect(affected.equipment.airway.bronchospasmSeverity).toBeGreaterThan(0.8);
    expect(affected.state.spo2Percent).toBe(91);
    expect(affected.state.respiratoryRateBpm).toBe(34);
    expect(affected.state.etco2MmHg).toBeGreaterThan(30);
    expect(affected.state.meanArterialMmHg).toBeGreaterThan(65);
  });

  it('enforces assessment, controlled oxygen, conservative inhaled treatment, and reassessment', () => {
    const treated = new AnesthesiaEngine({ scenario: SCENARIO, seed: 44, practiceRegion: 'US' });
    const untreated = new AnesthesiaEngine({ scenario: SCENARIO, seed: 44, practiceRegion: 'US' });
    advance(treated, 100); advance(untreated, 100);
    expect(act(treated, '__proto__').events.at(-1)?.eventId).toMatch(/^adult-asthma-refused-/);
    expect(act(treated, 'record-controlled-oxygen').events.at(-1)?.eventId)
      .toMatch(/^adult-asthma-order-refused-/);
    act(treated, 'review-severity-and-mimics');
    act(treated, 'record-controlled-oxygen');
    const bronchodilators = act(treated, 'give-fixed-inhaled-bronchodilators');
    const event = bronchodilators.events.find((entry) => entry.eventId.startsWith('adult-asthma-bronchodilators-'));
    expect(event?.data).toMatchObject({ route: 'inhaled-pmdi-spacer', salbutamolPuffs: 6, ipratropiumPuffs: 4 });
    act(treated, 'record-early-corticosteroid-intent');
    const reassessed = act(treated, 'reassess-after-initial-treatment');
    expect(reassessed.state.spo2Percent).toBe(94);
    expect(reassessed.state.respiratoryRateBpm).toBe(24);
    expect(reassessed.equipment.ventilator.fio2).toBe(0.4);
    expect(reassessed.equipment.resuscitation.salbutamolTotalMg).toBeCloseTo(0.6);
    expect(reassessed.equipment.resuscitation.adultAsthmaAssessment).toMatchObject({
      severityReviewedAtTick: expect.any(Number), controlledOxygenAtTick: expect.any(Number),
      bronchodilatorBundleAtTick: expect.any(Number), corticosteroidIntentAtTick: expect.any(Number),
      reassessedAtTick: expect.any(Number),
    });
    const treatedLater = advance(treated, 100);
    const untreatedLater = advance(untreated, 105);
    expect(treatedLater.equipment.airway.bronchospasmSeverity)
      .toBeLessThan(untreatedLater.equipment.airway.bronchospasmSeverity * 0.5);
  });

  it('debriefs only accepted adult-asthma events', () => {
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const actions: LearnerAction[] = [];
    const event = (eventId: string, tick: number): EngineEvent => ({
      eventId, tick, category: 'assessment', severity: 'warning', message: eventId,
    });
    const log = [event('adult-asthma-severity-reviewed-10', 10),
      event('adult-asthma-oxygen-20', 20), event('adult-asthma-bronchodilators-30', 30),
      event('adult-asthma-corticosteroid-40', 40), event('adult-asthma-reassessed-50', 50)];
    const findings = objectiveFindings(SCENARIO, history, 0, 0, actions, log);
    expect(findings.map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met']);
  });
});
