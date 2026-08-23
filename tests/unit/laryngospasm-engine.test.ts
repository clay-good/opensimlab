import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay';
import { stepLaryngospasm } from '@anesthesia/physiology';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { LARYNGOSPASM_AFTER_AIRWAY_STIMULATION } from '@anesthesia/scenarios/laryngospasm-after-airway-stimulation';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { NORMAL_ALPHA_DEGREES } from '@anesthesia/waveforms/capnogram';
import type { LearnerAction } from '@platform/kernel/protocol';

const EVENT_TICK = 500;
const scenario = {
  ...ROUTINE_INDUCTION,
  timeline: [{
    id: 'airway-closes', type: 'laryngospasm', atTick: EVENT_TICK, value: 1,
    message: 'Air movement stops abruptly.',
  }],
};

function engine() {
  return new AnesthesiaEngine({ scenario: scenario as never, seed: 41, practiceRegion: 'US' });
}

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let tick = 1; tick < ticks; tick += 1) result = subject.step();
  return result;
}

describe('upper-airway laryngospasm foundation', () => {
  it('makes complete closure a no-ventilation capnogram, not lower-airway shark fin', () => {
    const subject = engine();
    subject.apply({ tick: 0, type: 'ventilator', payload: {
      mode: 'manual', delivering: true, fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12,
    } });
    let result = advance(subject, EVENT_TICK + 1);

    expect(result.state.tidalVolumeMl).toBe(0);
    expect(result.state.respiratoryRateBpm).toBe(0);
    expect(result.state.etco2MmHg).toBe(0);
    expect(result.waveforms.capno.samples.every((sample) => sample === 0)).toBe(true);
    expect(result.waveforms.capnoAlphaDegrees).toBe(NORMAL_ALPHA_DEGREES);
    expect(result.equipment.airway).toMatchObject({
      patencyFraction: 0, bronchospasmSeverity: 0, jawThrustCpapSecondsRemaining: 0,
    });

    const saturationAtClosure = result.state.spo2Percent;
    result = advance(subject, 600);
    expect(result.state.spo2Percent).toBeLessThan(saturationAtClosure);
  });

  it('requires the complete initial-response bundle and resolves on a bounded trajectory', () => {
    const base = { jawThrustCpap: true, positivePressure: true, fio2: 1, depthIndex: 50 };
    for (const incomplete of [
      { ...base, jawThrustCpap: false },
      { ...base, positivePressure: false },
      { ...base, fio2: 0.94 },
      { ...base, depthIndex: 61 },
    ]) {
      expect(stepLaryngospasm(1, incomplete, 10)).toBe(1);
    }
    expect(stepLaryngospasm(1, base, 2)).toBeCloseTo(0.6);
    expect(stepLaryngospasm(1, base, 5)).toBe(0);
    expect(stepLaryngospasm(1, base, 50)).toBe(0);
  });

  it('does not mistake an enabled machine with zero commanded ventilation for pressure', () => {
    const subject = engine();
    subject.apply({ tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: 200, unit: 'mg' } });
    advance(subject, 1200);
    subject.apply({ tick: subject.tick, type: 'ventilator', payload: {
      delivering: true, fio2: 1, tidalVolumeMl: 0, respiratoryRateBpm: 12,
    } });
    subject.apply({ tick: subject.tick, type: 'airway-maneuver', payload: {
      maneuver: 'jaw-thrust-cpap',
    } });
    const result = advance(subject, 100);
    expect(result.equipment.airway.patencyFraction).toBe(0);
  });

  it('integrates the actual case controls: only the complete response restores gas flow', () => {
    const runCase = (omit?: 'oxygen' | 'pressure' | 'depth' | 'maneuver') => {
      const subject = new AnesthesiaEngine({
        scenario: LARYNGOSPASM_AFTER_AIRWAY_STIMULATION,
        seed: 41,
        practiceRegion: 'US',
      });
      // Build the reserve the bundled case asks for before the scripted closure.
      subject.apply({ tick: 0, type: 'ventilator', payload: {
        mode: 'manual', delivering: true, fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12,
      } });
      let result = advance(subject, 2401);
      expect(result.equipment.airway.patencyFraction).toBeCloseTo(0.05);
      expect(result.state.tidalVolumeMl).toBe(0);
      expect(result.state.etco2MmHg).toBe(0);

      subject.apply({ tick: subject.tick, type: 'ventilator', payload: {
        fio2: omit === 'oxygen' ? 0.21 : 1,
      } });
      subject.apply({ tick: subject.tick, type: 'ventilator', payload: {
        mode: 'manual', delivering: omit !== 'pressure', tidalVolumeMl: 500, respiratoryRateBpm: 12,
      } });
      if (omit !== 'depth') subject.apply({ tick: subject.tick, type: 'bolus', payload: {
        drugId: 'propofol', amount: 2, unit: 'mg/kg',
      } });
      if (omit !== 'maneuver') subject.apply({
        tick: subject.tick, type: 'airway-maneuver', payload: { maneuver: 'jaw-thrust-cpap' },
      });
      result = advance(subject, 900);
      return result;
    };

    const complete = runCase();
    expect(complete.state.depthIndex).toBeLessThanOrEqual(60);
    expect(complete.equipment.airway.patencyFraction).toBe(1);
    expect(complete.state.tidalVolumeMl).toBeGreaterThan(0);
    expect(complete.state.etco2MmHg).toBeGreaterThan(0);
    for (const missing of ['oxygen', 'pressure', 'depth', 'maneuver'] as const) {
      expect(runCase(missing).equipment.airway.patencyFraction, missing).toBeCloseTo(0.05);
    }
  });

  it('treats 95% closure as functionally absent ventilation rather than a normal trace', () => {
    const severe = {
      ...scenario,
      timeline: [{ id: 'severe', type: 'laryngospasm', atTick: 0, value: 0.95 }],
    };
    const subject = new AnesthesiaEngine({ scenario: severe as never, seed: 41, practiceRegion: 'US' });
    subject.apply({ tick: 0, type: 'ventilator', payload: {
      delivering: true, tidalVolumeMl: 500, respiratoryRateBpm: 12,
    } });
    const result = subject.step();
    expect(result.state.tidalVolumeMl).toBe(0);
    expect(result.state.etco2MmHg).toBe(0);
    expect(result.waveforms.capno.samples.every((sample) => sample === 0)).toBe(true);
    expect(result.equipment.airway.patencyFraction).toBeCloseTo(0.05);
    expect(result.equipment.airway.bronchospasmSeverity).toBe(0);
  });

  it('holds the learner maneuver for exactly 90 seconds and rejects invented maneuvers', () => {
    const subject = engine();
    subject.apply({ tick: 0, type: 'airway-maneuver', payload: { maneuver: 'jaw-thrust-cpap' } });
    expect(subject.equipment().airway.jawThrustCpapSecondsRemaining).toBe(90);
    advance(subject, 900);
    expect(subject.equipment().airway.jawThrustCpapSecondsRemaining).toBe(0);

    subject.apply({ tick: subject.tick, type: 'airway-maneuver', payload: { maneuver: '__proto__' } });
    const result = subject.step();
    expect(result.events.some((event) => event.eventId.startsWith('bad-airway-maneuver'))).toBe(true);
    expect(result.equipment.airway.jawThrustCpapSecondsRemaining).toBe(0);
  });

  it('rejects missing, non-finite, and out-of-range closure without poisoning state', () => {
    for (const value of [undefined, Number.NaN, Number.POSITIVE_INFINITY, -0.1, 1.1]) {
      const hostile = {
        ...scenario,
        timeline: [{ id: 'hostile', type: 'laryngospasm', atTick: 0, value }],
      };
      expect(validateScenario(hostile)).not.toEqual([]);
      const subject = new AnesthesiaEngine({
        scenario: hostile as never, seed: 41, practiceRegion: 'US',
      });
      const result = subject.step();
      expect(result.equipment.airway.patencyFraction).toBe(1);
      expect([
        result.equipment.airway.patencyFraction,
        result.equipment.airway.bronchospasmSeverity,
        result.equipment.airway.jawThrustCpapSecondsRemaining,
      ].every(Number.isFinite)).toBe(true);
      expect(result.events.some((event) => event.eventId.startsWith('incomplete-event-hostile'))).toBe(true);
      expect(Object.values(result.state).every(Number.isFinite)).toBe(true);
      for (const block of Object.values(result.waveforms).filter(
        (value): value is { samples: Float32Array } => typeof value === 'object'
          && value !== null && 'samples' in value,
      )) expect(block.samples.every(Number.isFinite)).toBe(true);
    }
  });

  it('does not apply a closure event after a tracheal tube has secured the airway', () => {
    const subject = engine();
    // Drive seeded attempts to completion before the deliberately late event.
    while (!subject.equipment().airway.intubated && subject.tick < EVENT_TICK) {
      subject.apply({ tick: subject.tick, type: 'laryngoscopy', payload: { technique: 'video' } });
      while (subject.equipment().airway.attemptInProgress) subject.step();
    }
    expect(subject.equipment().airway.intubated).toBe(true);
    let result = subject.step();
    while (result.tick < EVENT_TICK) result = subject.step();
    expect(result.equipment.airway.patencyFraction).toBe(1);
    expect(result.events.some((event) => event.eventId.startsWith('inapplicable-event-airway-closes')))
      .toBe(true);
  });

  it('replays the upper-airway event and response bit-identically', () => {
    const actions: LearnerAction[] = [
      { tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: 140, unit: 'mg' } },
      { tick: EVENT_TICK, type: 'ventilator', payload: {
        mode: 'manual', delivering: true, fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12,
      } },
      { tick: EVENT_TICK, type: 'airway-maneuver', payload: { maneuver: 'jaw-thrust-cpap' } },
    ];
    const options = { scenario: scenario as never, seed: 41, practiceRegion: 'US', ticks: 700 };
    expect(replay(actions, options)).toEqual(replay(actions, options));
  });
});
