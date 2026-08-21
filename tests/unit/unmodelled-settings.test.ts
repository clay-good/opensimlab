/**
 * Controls this module records but does not act on.
 *
 * Found by setting every ventilator control in turn and checking whether the
 * patient noticed. PEEP and pressure control both changed nothing: the number
 * moved on screen, the log said the machine had been set, and the physiology was
 * bit-for-bit identical. Silently accepting a setting is worse than refusing it,
 * because a learner who sets PEEP and sees nothing happen reasonably concludes
 * that PEEP does not do much.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { LIMITATIONS } from '@platform/docs/limitations';

function withVentilator(payload: Record<string, unknown>, ticks = 3000) {
  const engine = new AnesthesiaEngine({
    scenario: ROUTINE_INDUCTION, seed: 7, practiceRegion: 'US',
  });
  const messages: string[] = [];
  engine.apply({
    type: 'ventilator',
    payload: { fio2: 1, delivering: true, mode: 'volume-control', ...payload },
    tick: 0,
  } as never);
  engine.apply({ type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' }, tick: 5 } as never);
  let state: Readonly<Record<string, number>> = {};
  for (let tick = 0; tick < ticks; tick += 1) {
    const result = engine.step();
    for (const event of result.events) messages.push(event.message);
    state = result.state;
  }
  return { engine, state, messages };
}

describe('a setting the model does not use says so', () => {
  it('names PEEP, once, and says what will not change', () => {
    const { messages } = withVentilator({ peep: 10 });
    const notices = messages.filter((m) => m.includes('PEEP is recorded'));
    expect(notices).toHaveLength(1);
    expect(notices[0]).toContain('does not model');
    expect(notices[0]).toContain('venous return');
    expect(notices[0]).toContain('limitations register');
  });

  it('says nothing when PEEP is left alone', () => {
    const { messages } = withVentilator({ peep: 0 });
    expect(messages.some((m) => m.includes('PEEP is recorded'))).toBe(false);
  });

  it('names pressure control, and says the two modes are the same here', () => {
    const { messages } = withVentilator({ mode: 'pressure-control' });
    const notices = messages.filter((m) => m.includes('Pressure control is recorded'));
    expect(notices).toHaveLength(1);
    expect(notices[0]).toContain('identically');
    expect(notices[0]).toContain('compliance');
  });

  it('says nothing about volume control, which is what the model does', () => {
    const { messages } = withVentilator({ mode: 'volume-control' });
    expect(messages.some((m) => m.includes('Pressure control is recorded'))).toBe(false);
  });
});

describe('the notices are true', () => {
  it('PEEP really does change nothing, so the notice is not a false alarm', () => {
    // If PEEP ever starts doing something, this fails and the notice has to go.
    const none = withVentilator({ peep: 0 }).state;
    const lots = withVentilator({ peep: 15 }).state;
    expect(lots.spo2Percent).toBe(none.spo2Percent);
    expect(lots.meanArterialMmHg).toBe(none.meanArterialMmHg);
    expect(lots.etco2MmHg).toBe(none.etco2MmHg);
  });

  it('the two modes really are identical, so the notice is not a false alarm', () => {
    const volume = withVentilator({ mode: 'volume-control' }).state;
    const pressure = withVentilator({ mode: 'pressure-control' }).state;
    expect(pressure.tidalVolumeMl).toBe(volume.tidalVolumeMl);
    expect(pressure.etco2MmHg).toBe(volume.etco2MmHg);
    expect(pressure.meanArterialMmHg).toBe(volume.meanArterialMmHg);
  });

  it('the controls that DO work are not flagged as unmodelled', () => {
    // The guard against the notices spreading to things that work.
    const { messages } = withVentilator({ tidalVolumeMl: 700, respiratoryRateBpm: 18, fio2: 0.5 });
    expect(messages.some((m) => m.includes('is recorded but'))).toBe(false);
  });
});

describe('the limitations register carries both', () => {
  it('records that the modes are not distinguished, and what that costs', () => {
    const entry = LIMITATIONS.find((l) => l.id === 'ventilation-modes-are-not-distinguished');
    expect(entry).toBeDefined();
    expect(entry!.correctUnderstanding).toContain('compliance');
    // Named in the briefing of the scenario where it bites hardest.
    expect(entry!.briefIn).toContain('bronchospasm');
  });

  it('still records PEEP', () => {
    expect(LIMITATIONS.some((l) => l.id === 'peep-not-modelled')).toBe(true);
  });
});
