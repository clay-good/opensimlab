import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PERIOPERATIVE_HYPERGLYCEMIA as SCENARIO } from '@anesthesia/scenarios/perioperative-hyperglycemia';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function engine() {
  return new AnesthesiaEngine({ scenario: SCENARIO, seed: 40, practiceRegion: 'US' });
}

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let tick = 1; tick < ticks; tick += 1) result = subject.step();
  return result;
}

describe('perioperative hyperglycemia foundation', () => {
  it('reveals the fixed glucose cue without disturbing stable physiology', () => {
    const result = advance(engine(), 101);
    expect(result.equipment.resuscitation.glycemicResponse).toMatchObject({
      pointOfCareGlucoseMgPerDl: 238,
      pointOfCareConfirmedAtTick: null,
      insulinProtocolIntentAtTick: null,
      repeatEligible: false,
    });
    expect(result.state.meanArterialMmHg).toBeGreaterThan(65);
    expect(result.state.spo2Percent).toBeGreaterThanOrEqual(98);
  });

  it('enforces confirmation, response, and a 30-minute repeat interval', () => {
    const subject = engine();
    advance(subject, 101);
    subject.apply({ tick: subject.tick, type: 'glycemic-response', payload: {
      response: 'record-insulin-protocol-intent',
    } });
    expect(subject.step().events.at(-1)?.eventId).toMatch(/^glycemic-order-refused-/);
    for (const response of [
      'confirm-point-of-care-glucose', 'record-insulin-protocol-intent',
    ] as const) subject.apply({ tick: subject.tick, type: 'glycemic-response', payload: { response } });
    subject.apply({ tick: subject.tick, type: 'glycemic-response', payload: {
      response: 'repeat-point-of-care-glucose',
    } });
    expect(subject.step().events.at(-1)?.eventId).toMatch(/^repeat-glucose-too-early-/);
    advance(subject, 17_999);
    expect(subject.step().equipment.resuscitation.glycemicResponse?.repeatEligible).toBe(true);
    subject.apply({ tick: subject.tick, type: 'glycemic-response', payload: {
      response: 'repeat-point-of-care-glucose',
    } });
    expect(subject.step().equipment.resuscitation.glycemicResponse).toMatchObject({
      repeatPointOfCareGlucoseMgPerDl: 174,
      repeatPointOfCareAtTick: subject.tick - 1,
    });
  });

  it('rejects invalid glucose values and hostile response names', () => {
    for (const value of [undefined, Number.NaN, Number.POSITIVE_INFINITY, 180, 401]) {
      const hostile = {
        ...SCENARIO,
        timeline: [{ id: 'hostile', type: 'perioperative-hyperglycemia', atTick: 0, value }],
      };
      expect(validateScenario(hostile)).not.toEqual([]);
      const subject = new AnesthesiaEngine({ scenario: hostile as never, seed: 40, practiceRegion: 'US' });
      expect(subject.step().equipment.resuscitation.glycemicResponse?.pointOfCareGlucoseMgPerDl)
        .toBeNull();
    }
    const subject = engine();
    subject.apply({ tick: 0, type: 'glycemic-response', payload: { response: '__proto__' } });
    expect(subject.step().events.some((event) =>
      event.eventId.startsWith('glycemic-response-refused-'))).toBe(true);
  });

  it('debriefs confirmation, bounded response, and observed repeat', () => {
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
    for (const response of [
      'confirm-point-of-care-glucose', 'record-insulin-protocol-intent',
    ] as const) {
      const action = { tick: subject.tick, type: 'glycemic-response', payload: { response } };
      actions.push(action);
      subject.apply(action);
    }
    for (let tick = 0; tick < 18_001; tick += 1) step();
    const repeat = { tick: subject.tick, type: 'glycemic-response', payload: {
      response: 'repeat-point-of-care-glucose',
    } };
    actions.push(repeat);
    subject.apply(repeat);
    step();
    expect(objectiveFindings(
      SCENARIO, history, 0, 0, actions, events,
    ).map((finding) => finding.outcome)).toEqual(['met', 'met', 'met']);
  });
});
