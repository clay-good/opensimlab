import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '@anesthesia/scenarios';
import { circulationStateProblem, runCirculation, type CirculationState } from '@anesthesia/sandbox/circulation-sandbox';

const rest: CirculationState = { scenarioId: 'routine-induction', vasodilation: 0, bloodLossPercent: 0, vasopressor: 0, minutes: 5 };
const end = (state: CirculationState) => runCirculation(SCENARIOS, state).samples.at(-1)!;

describe('the circulation sandbox', () => {
  it('holds the authored baseline when nothing is changed', () => {
    const routine = SCENARIOS.find((scenario) => scenario.metadata.id === 'routine-induction')!;
    const last = end(rest);
    expect(last.meanArterialMmHg).toBeCloseTo(routine.patient.baseline.meanArterialMmHg, 0);
    expect(last.heartRateBpm).toBeCloseTo(routine.patient.baseline.heartRateBpm, 0);
  });

  it('answers a fall in pressure with the baroreflex: the heart speeds up after blood loss and after vasodilation', () => {
    const base = end(rest);
    for (const state of [{ ...rest, bloodLossPercent: 20 }, { ...rest, vasodilation: 1 }]) {
      const last = end(state);
      expect(last.meanArterialMmHg).toBeLessThan(base.meanArterialMmHg);
      expect(last.heartRateBpm).toBeGreaterThan(base.heartRateBpm);
    }
    // Blood loss lowers stroke volume; vasodilation alone does not.
    expect(end({ ...rest, bloodLossPercent: 20 }).strokeVolumeMl).toBeLessThan(base.strokeVolumeMl - 5);
    expect(end({ ...rest, vasodilation: 1 }).strokeVolumeMl).toBeCloseTo(base.strokeVolumeMl, 0);
  });

  it('lets a vasopressor raise the pressure a vasodilator lowered', () => {
    expect(end({ ...rest, vasodilation: 1, vasopressor: 1 }).meanArterialMmHg)
      .toBeGreaterThan(end({ ...rest, vasodilation: 1 }).meanArterialMmHg);
  });

  it('reads each input\'s label from the engine\'s own influence records, and only for inputs that are on', () => {
    expect(runCirculation(SCENARIOS, rest).teaching).toEqual({});
    const all = runCirculation(SCENARIOS, { ...rest, vasodilation: 1, bloodLossPercent: 20, vasopressor: 1 }).teaching;
    expect(all).toEqual({ vasodilation: false, 'blood-loss': false, vasopressor: true });
  });

  it('refuses a value it does not offer', () => {
    expect(circulationStateProblem(SCENARIOS, { ...rest, bloodLossPercent: 15 })).toMatch(/not an offered/);
    expect(circulationStateProblem(SCENARIOS, { ...rest, scenarioId: 'nobody' })).toMatch(/No lesson/);
  });
});

describe('a circulation state as a link', () => {
  it('round-trips, carries only its inputs, and refuses what it cannot honour', async () => {
    const { circulationQuery, parseCirculationQuery } = await import('@anesthesia/sandbox/circulation-sandbox');
    const state = { ...rest, bloodLossPercent: 30, vasopressor: 0.5 };
    expect(parseCirculationQuery(SCENARIOS, circulationQuery(state))).toEqual({ state });
    expect([...new URLSearchParams(circulationQuery(state)).keys()].sort())
      .toEqual(['lesson', 'loss', 'minutes', 'vasodilation', 'vasopressor', 'view']);
    expect(parseCirculationQuery(SCENARIOS, `${circulationQuery(state)}&transcript=x`)).toHaveProperty('problem');
  });
});
