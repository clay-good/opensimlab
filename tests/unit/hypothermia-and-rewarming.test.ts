import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { HYPOTHERMIA_AND_REWARMING as SCENARIO } from '@anesthesia/scenarios/hypothermia-and-rewarming';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function engine() {
  return new AnesthesiaEngine({ scenario: SCENARIO, seed: 39, practiceRegion: 'US' });
}

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let tick = 1; tick < ticks; tick += 1) result = subject.step();
  return result;
}

describe('hypothermia and rewarming foundation', () => {
  it('creates an isolated, gradual low-temperature course with stable ventilation and circulation', () => {
    const result = advance(engine(), 3600);
    expect(result.state.coreTemperatureC).toBeLessThan(36);
    expect(result.state.coreTemperatureC).toBeGreaterThan(35.5);
    expect(result.state.meanArterialMmHg).toBeGreaterThan(65);
    expect(result.state.spo2Percent).toBeGreaterThanOrEqual(98);
    expect(result.alarms.some((alarm) => alarm.id === 'temperature-low')).toBe(true);
    expect(result.attribution.some((entry) =>
      entry.terms.some((term) => term.termId === 'perioperative-heat-loss'))).toBe(true);
  });

  it('requires confirmation before ordered warming actions and then recovers gradually', () => {
    const subject = engine();
    advance(subject, 3600);
    subject.apply({ tick: subject.tick, type: 'thermal-response', payload: {
      response: 'start-forced-air-warming',
    } });
    expect(subject.step().events.at(-1)?.eventId).toMatch(/^thermal-order-refused-/);
    for (const response of [
      'confirm-core-temperature', 'start-forced-air-warming', 'record-warmed-bulk-fluids',
    ] as const) subject.apply({ tick: subject.tick, type: 'thermal-response', payload: { response } });
    const firstWarmingStep = subject.step();
    const result = advance(subject, 3599);
    expect(result.state.coreTemperatureC).toBeGreaterThanOrEqual(36.5);
    expect(result.equipment.resuscitation.thermalResponse).toMatchObject({
      coreTemperatureConfirmedAtTick: 3601,
      forcedAirWarmingAtTick: 3601,
      warmedBulkFluidsAtTick: 3601,
      targetTemperatureC: 36.6,
    });
    expect(firstWarmingStep.attribution.some((entry) =>
      entry.terms.some((term) => term.termId === 'active-warming'))).toBe(true);
  });

  it('rejects invalid targets and hostile response names without changing temperature', () => {
    for (const value of [undefined, Number.NaN, Number.POSITIVE_INFINITY, 33.9, 36]) {
      const hostile = {
        ...SCENARIO,
        timeline: [{ id: 'hostile', type: 'perioperative-hypothermia', atTick: 0, value }],
      };
      expect(validateScenario(hostile)).not.toEqual([]);
      const subject = new AnesthesiaEngine({ scenario: hostile as never, seed: 39, practiceRegion: 'US' });
      expect(subject.step().state.coreTemperatureC).toBeCloseTo(36.7, 5);
    }
    const subject = engine();
    subject.apply({ tick: 0, type: 'thermal-response', payload: { response: '__proto__' } });
    expect(subject.step().events.some((event) =>
      event.eventId.startsWith('thermal-response-refused-'))).toBe(true);
  });

  it('debriefs confirmation, both warming intents, and observed recovery', () => {
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
    for (let tick = 0; tick < 3600; tick += 1) step();
    for (const response of [
      'confirm-core-temperature', 'start-forced-air-warming', 'record-warmed-bulk-fluids',
    ] as const) {
      const action = { tick: subject.tick, type: 'thermal-response', payload: { response } };
      actions.push(action);
      subject.apply(action);
    }
    for (let tick = 0; tick < 3600; tick += 1) step();
    expect(objectiveFindings(
      SCENARIO, history, 0, 0, actions, events,
    ).map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met']);
  });
});
