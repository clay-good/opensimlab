import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { stepOpioidVentilatoryImpairment } from '@anesthesia/physiology';
import { OPIOID_INDUCED_VENTILATORY_IMPAIRMENT as SCENARIO } from '@anesthesia/scenarios/opioid-induced-ventilatory-impairment';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function engine() {
  return new AnesthesiaEngine({ scenario: SCENARIO, seed: 38, practiceRegion: 'US' });
}

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let tick = 1; tick < ticks; tick += 1) result = subject.step();
  return result;
}

describe('opioid-induced ventilatory impairment foundation', () => {
  it('depresses spontaneous rate more than breath size without obstructing the airway', () => {
    const result = advance(engine(), 101);
    expect(result.state.respiratoryRateBpm).toBeLessThanOrEqual(5);
    expect(result.state.tidalVolumeMl).toBeGreaterThan(350);
    expect(result.equipment.airway).toMatchObject({
      patencyFraction: 1, postExtubationObstructionSeverity: 0, bronchospasmSeverity: 0,
    });
    expect(result.state.spo2Percent).toBeGreaterThanOrEqual(98);
  });

  it('supports ventilation immediately and restores spontaneous drive only after ordered reversal intent', () => {
    const subject = engine();
    advance(subject, 101);
    subject.apply({ tick: subject.tick, type: 'call-for-help', payload: { context: 'airway' } });
    subject.apply({ tick: subject.tick, type: 'ventilator', payload: {
      mode: 'manual', delivering: true, fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12,
    } });
    let result = advance(subject, 10);
    expect(result.state.respiratoryRateBpm).toBe(12);
    expect(result.state.tidalVolumeMl).toBe(500);

    subject.apply({ tick: subject.tick, type: 'opioid-ventilatory-response', payload: {
      response: 'record-naloxone-titration',
    } });
    expect(subject.step().events.at(-1)?.eventId).toMatch(/^naloxone-order-refused-/);
    subject.apply({ tick: subject.tick, type: 'opioid-ventilatory-response', payload: {
      response: 'hold-further-opioid',
    } });
    subject.apply({ tick: subject.tick, type: 'opioid-ventilatory-response', payload: {
      response: 'record-naloxone-titration',
    } });
    advance(subject, 500);
    subject.apply({ tick: subject.tick, type: 'ventilator', payload: { delivering: false } });
    result = advance(subject, 10);
    expect(result.state.respiratoryRateBpm).toBeGreaterThanOrEqual(10);
    expect(result.state.tidalVolumeMl).toBeGreaterThan(400);
    expect(result.equipment.resuscitation.opioidVentilatoryResponse).toMatchObject({
      furtherOpioidHeldAtTick: 112, naloxoneIntentAtTick: 112,
    });
    expect(result.equipment.resuscitation.opioidVentilatoryResponse?.severity).toBeLessThan(0.1);
  });

  it('keeps the reversal trajectory finite and refuses hostile events and actions', () => {
    expect(stepOpioidVentilatoryImpairment(0.8, 0, 18)).toBeCloseTo(0.294, 2);
    expect(stepOpioidVentilatoryImpairment(Number.NaN, Number.POSITIVE_INFINITY, 1)).toBe(0);
    for (const value of [undefined, Number.NaN, Number.POSITIVE_INFINITY, -0.1, 1.1]) {
      const hostile = {
        ...SCENARIO,
        timeline: [{ id: 'hostile', type: 'opioid-ventilatory-impairment', atTick: 0, value }],
      };
      expect(validateScenario(hostile)).not.toEqual([]);
      const subject = new AnesthesiaEngine({ scenario: hostile as never, seed: 38, practiceRegion: 'US' });
      expect(subject.step().state.respiratoryRateBpm).toBeGreaterThan(10);
    }
    const subject = engine();
    subject.apply({ tick: 0, type: 'opioid-ventilatory-response', payload: { response: '__proto__' } });
    expect(subject.step().events.some((event) =>
      event.eventId.startsWith('opioid-response-refused-'))).toBe(true);
  });

  it('debriefs accepted escalation, support, reversal intent, and spontaneous reassessment', () => {
    const subject = engine();
    const history: { tick: number; state: Readonly<Record<string, number>>;
      concentrations: never[] }[] = [];
    const events: EngineEvent[] = [];
    const actions: LearnerAction[] = [];
    const step = () => {
      const result = subject.step();
      history.push({ tick: result.tick, state: result.state, concentrations: [] });
      events.push(...result.events);
    };
    for (let tick = 0; tick < 101; tick += 1) step();
    const initial: LearnerAction[] = [
      { tick: subject.tick, type: 'call-for-help', payload: { context: 'airway' } },
      { tick: subject.tick, type: 'ventilator', payload: {
        mode: 'manual', delivering: true, fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12,
      } },
      { tick: subject.tick, type: 'opioid-ventilatory-response', payload: {
        response: 'hold-further-opioid',
      } },
      { tick: subject.tick, type: 'opioid-ventilatory-response', payload: {
        response: 'record-naloxone-titration',
      } },
    ];
    for (const action of initial) {
      actions.push(action);
      subject.apply(action);
    }
    for (let tick = 0; tick < 500; tick += 1) step();
    const spontaneous = {
      tick: subject.tick, type: 'ventilator', payload: { delivering: false },
    } satisfies LearnerAction;
    actions.push(spontaneous);
    subject.apply(spontaneous);
    for (let tick = 0; tick < 20; tick += 1) step();

    expect(objectiveFindings(
      SCENARIO, history, 0, 0, actions, events,
    ).map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });
});
