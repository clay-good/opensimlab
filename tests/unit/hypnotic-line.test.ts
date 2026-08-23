import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay';
import { RAPID_SEQUENCE_INDUCTION } from '@anesthesia/scenarios/rapid-sequence-induction';
import type { LearnerAction } from '@platform/kernel/protocol';

const FAILURE_TICK = 3000;
const scenario = {
  ...RAPID_SEQUENCE_INDUCTION,
  timeline: [{
    id: 'hypnotic-line-fails', type: 'equipment-failure', atTick: FAILURE_TICK,
    target: 'hypnotic-line-disconnection',
    message: 'The infusion pumps continue to run at their set rates.',
  }],
};

const setupActions: LearnerAction[] = [
  { tick: 0, type: 'ventilator', payload: {
    mode: 'volume-control', delivering: true, fio2: 0.5,
  } },
  { tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: 120, unit: 'mg' } },
  { tick: 0, type: 'infusion', payload: { drugId: 'propofol', rate: 8, unit: 'mg/min' } },
  { tick: 0, type: 'infusion', payload: { drugId: 'remifentanil', rate: 0.5, unit: 'µg/min' } },
  { tick: 0, type: 'bolus', payload: { drugId: 'rocuronium', amount: 1.2, unit: 'mg/kg' } },
];

function concentration(result: ReturnType<AnesthesiaEngine['step']>, drugId: string) {
  return result.concentrations.find((entry) => entry.drugId === drugId)!.effectSite;
}

describe('the propofol hypnotic line', () => {
  it('disconnects delivery without changing the pump command', () => {
    const engine = new AnesthesiaEngine({ scenario: scenario as never, seed: 8, practiceRegion: 'US' });
    for (const action of setupActions) engine.apply(action);

    let result = engine.step();
    for (let tick = 1; tick <= FAILURE_TICK; tick += 1) result = engine.step();
    const beforeFall = concentration(result, 'propofol');
    expect(result.equipment.hypnoticLine).toEqual({ connected: false, inspected: false });
    expect(result.equipment.drugs.find((drug) => drug.drugId === 'propofol')?.infusionRate).toBe(8);
    expect(result.events.some((event) => event.eventId === 'hypnotic-line-fails')).toBe(true);
    expect(result.events.every((event) => !event.message.toLowerCase().includes('disconnect'))).toBe(true);

    for (let tick = 0; tick < 1200; tick += 1) result = engine.step();
    expect(concentration(result, 'propofol')).toBeLessThan(beforeFall);
    // The separate opioid line continues to deliver while only propofol falls.
    expect(concentration(result, 'remifentanil')).toBeGreaterThan(0);
    expect(result.equipment.drugs.find((drug) => drug.drugId === 'remifentanil')?.infusionRate).toBe(0.5);
  });

  it('inspection reports the physical fault without changing the pump', () => {
    const engine = new AnesthesiaEngine({ scenario: scenario as never, seed: 8, practiceRegion: 'US' });
    for (const action of setupActions) engine.apply(action);
    for (let tick = 0; tick <= FAILURE_TICK; tick += 1) engine.step();

    engine.apply({ tick: engine.tick, type: 'hypnotic-line', payload: { action: 'inspect' } });
    const result = engine.step();
    expect(result.equipment.hypnoticLine).toEqual({ connected: false, inspected: true });
    expect(result.equipment.drugs.find((drug) => drug.drugId === 'propofol')?.infusionRate).toBe(8);
    expect(result.events.find((event) => event.eventId.startsWith('hypnotic-line-inspect'))?.message)
      .toContain('is disconnected');
  });

  it('reconnects and resumes the exact commanded rate', () => {
    const engine = new AnesthesiaEngine({ scenario: scenario as never, seed: 8, practiceRegion: 'US' });
    const disconnectedControl = new AnesthesiaEngine({ scenario: scenario as never, seed: 8, practiceRegion: 'US' });
    for (const action of setupActions) engine.apply(action);
    for (const action of setupActions) disconnectedControl.apply(action);
    for (let tick = 0; tick <= FAILURE_TICK + 1200; tick += 1) {
      engine.step();
      disconnectedControl.step();
    }
    let result = engine.step();

    engine.apply({ tick: engine.tick, type: 'hypnotic-line', payload: { action: 'reconnect' } });
    result = engine.step();
    expect(result.equipment.hypnoticLine).toEqual({ connected: true, inspected: true });
    expect(result.equipment.drugs.find((drug) => drug.drugId === 'propofol')?.infusionRate).toBe(8);
    expect(result.events.find((event) => event.eventId.startsWith('hypnotic-line-reconnect'))?.data?.commandedRate)
      .toBe(8);
    let control = disconnectedControl.step();
    for (let tick = 0; tick < 1200; tick += 1) {
      result = engine.step();
      control = disconnectedControl.step();
    }
    expect(concentration(result, 'propofol')).toBeGreaterThan(concentration(control, 'propofol'));
  });

  it('produces isolated predicted lightening under persistent paralysis', () => {
    const engine = new AnesthesiaEngine({ scenario: scenario as never, seed: 8, practiceRegion: 'US' });
    for (const action of setupActions) engine.apply(action);
    let result = engine.step();
    for (let tick = 1; tick < FAILURE_TICK; tick += 1) result = engine.step();
    expect(result.state.depthIndex).toBeGreaterThanOrEqual(40);
    expect(result.state.depthIndex).toBeLessThanOrEqual(60);
    expect(result.state.trainOfFourCount).toBe(0);

    for (let tick = 0; tick < 3600; tick += 1) result = engine.step();
    expect(result.state.depthIndex).toBeGreaterThan(60);
    expect(result.state.trainOfFourRatio).toBeLessThan(0.1);
    expect(result.alarms.map((alarm) => alarm.id)).toContain('depth-light');
    expect(result.alarms.filter((alarm) => alarm.parameter !== 'depthIndex')).toEqual([]);
    expect(result.state.spo2Percent).toBeGreaterThan(92);
    expect(result.state.etco2MmHg).toBeGreaterThan(20);
    expect(result.state.heartRateBpm).toBeLessThan(120);
    expect(result.state.meanArterialMmHg).toBeGreaterThan(55);
  });

  it('replays disconnect and reconnect deterministically', () => {
    const actions = [...setupActions, {
      tick: FAILURE_TICK + 1800, type: 'hypnotic-line', payload: { action: 'reconnect' },
    } satisfies LearnerAction];
    const options = { scenario: scenario as never, seed: 8, practiceRegion: 'US', ticks: 7200 };
    const first = replay(actions, options);
    const second = replay(actions, options);
    expect(second).toEqual(first);
    expect(first.at(-1)?.state.depthIndex).toBeLessThan(
      replay(setupActions, options).at(-1)?.state.depthIndex ?? 0,
    );
  });

  it('refuses an unknown line operation without changing connection state', () => {
    const engine = new AnesthesiaEngine({ scenario: scenario as never, seed: 8, practiceRegion: 'US' });
    engine.apply({ tick: 0, type: 'hypnotic-line', payload: { action: 'cut-it' } });
    const result = engine.step();
    expect(result.equipment.hypnoticLine).toEqual({ connected: true, inspected: false });
    expect(result.events.some((event) => event.eventId.startsWith('bad-hypnotic-line-action'))).toBe(true);
  });
});
