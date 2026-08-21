/**
 * What happens to the circulation when nobody relieves the hypoxaemia.
 *
 * The circulation had no oxygen input at all. A patient given an induction dose
 * and then left alone desaturated to nothing while their heart rate sat at 81
 * and their blood pressure RECOVERED — the simulator was quietly teaching that
 * an unmanaged airway is survivable, which is the exact opposite of the thing
 * every airway scenario exists to teach.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import {
  HYPOXIA, hypoxicFailureDrive, hypoxicSympatheticDrive,
} from '@anesthesia/physiology/hemodynamics';

/** Induce, then do nothing at all, and record the whole trajectory. */
function abandonedAfterInduction(ticks = 6000) {
  const engine = new AnesthesiaEngine({
    scenario: ROUTINE_INDUCTION, seed: 7, practiceRegion: 'US',
  });
  const trace: { tick: number; state: Readonly<Record<string, number>>; rhythm: string }[] = [];
  const messages: string[] = [];
  for (let tick = 0; tick < ticks; tick += 1) {
    if (tick === 50) {
      engine.apply({
        type: 'bolus', payload: { drugId: 'propofol', amount: 2.5, unit: 'mg/kg' }, tick,
      } as never);
    }
    const result = engine.step();
    for (const event of result.events) messages.push(event.message);
    trace.push({ tick, state: result.state, rhythm: engine.equipment().rhythmId });
  }
  return { engine, trace, messages };
}

describe('the two drives', () => {
  it('the sympathetic response rises across its band and then holds', () => {
    expect(hypoxicSympatheticDrive(97)).toBe(0);
    expect(hypoxicSympatheticDrive(HYPOXIA.sympatheticOnsetPercent)).toBe(0);
    expect(hypoxicSympatheticDrive(86)).toBeGreaterThan(0);
    expect(hypoxicSympatheticDrive(86)).toBeLessThan(1);
    expect(hypoxicSympatheticDrive(HYPOXIA.sympatheticPeakPercent)).toBe(1);
    expect(hypoxicSympatheticDrive(10)).toBe(1);
  });

  it('myocardial failure begins well below where the sympathetic response begins', () => {
    // The order is the whole teaching point: the heart speeds up first and only
    // then gives out. If these bands were the wrong way round the simulator
    // would show a bradycardia at 90% and a tachycardia at 40%.
    expect(HYPOXIA.failureOnsetPercent).toBeLessThan(HYPOXIA.sympatheticOnsetPercent);
    expect(hypoxicFailureDrive(97)).toBe(0);
    expect(hypoxicFailureDrive(HYPOXIA.failureOnsetPercent)).toBe(0);
    expect(hypoxicFailureDrive(HYPOXIA.collapsePercent)).toBe(1);
    expect(hypoxicFailureDrive(0)).toBe(1);
  });
});

describe('a patient induced and then left alone', () => {
  const { trace, messages } = abandonedAfterInduction();
  const at = (second: number) => trace[Math.round(second * 10)]!;
  const hr = (second: number) => at(second).state.heartRateBpm!;

  it('desaturates, because nobody is ventilating them', () => {
    expect(at(60).state.spo2Percent!).toBeGreaterThan(90);
    expect(at(180).state.spo2Percent!).toBeLessThan(70);
  });

  it('speeds the heart up first — the sympathetic response', () => {
    // This is the part a learner has to recognise EARLY, while it is still
    // recoverable. A rising rate with a falling saturation is the warning.
    expect(hr(120)).toBeGreaterThan(hr(60));
    expect(at(120).state.spo2Percent!).toBeLessThan(at(60).state.spo2Percent!);
  });

  it('then slows it, because a hypoxic myocardium fails', () => {
    expect(hr(180)).toBeLessThan(hr(140));
    expect(hr(200)).toBeLessThan(hr(180));
  });

  it('loses the blood pressure with the output, rather than recovering it', () => {
    // The original defect in one assertion: the mean pressure used to climb back
    // toward normal while the saturation was on its way to zero.
    expect(at(200).state.meanArterialMmHg!).toBeLessThan(at(140).state.meanArterialMmHg!);
  });

  it('arrests, and says so once, at the moment it happens', () => {
    const arrested = trace.find((entry) => entry.rhythm === 'asystole');
    expect(arrested).toBeDefined();
    expect(arrested!.state.cardiacOutputLPerMin!).toBeLessThan(0.5);
    expect(messages.filter((m) => m.includes('the rhythm is asystole'))).toHaveLength(1);
  });

  it('names the arrest as a teaching model rather than as a published one', () => {
    expect(messages.some((m) => m.includes('teaching model'))).toBe(true);
  });

  it('takes minutes, not seconds — there is time to recognise it', () => {
    const arrestedAt = trace.findIndex((entry) => entry.rhythm === 'asystole');
    expect(arrestedAt / 10).toBeGreaterThan(120);
  });
});

describe('an arrest is where this module stops', () => {
  it('says plainly that resuscitation is not modelled', () => {
    const { messages } = abandonedAfterInduction();
    const notice = messages.find((m) => m.includes('does not model resuscitation'));
    expect(notice).toBeDefined();
    expect(notice).toContain('compressions');
    expect(notice).toContain('adrenaline');
    expect(notice).toContain('debrief');
  });

  it('does not undo itself when the airway is finally sorted out', () => {
    // The dangerous version of this fix: asystole to a heart rate of 84 in
    // twenty seconds, with no compressions and no adrenaline, purely because
    // oxygen was turned on. That teaches that an arrest you caused will undo
    // itself, which is worse than the bug it replaced.
    const engine = new AnesthesiaEngine({
      scenario: ROUTINE_INDUCTION, seed: 7, practiceRegion: 'US',
    });
    let rescued = false;
    let last: Readonly<Record<string, number>> = {};
    for (let tick = 0; tick < 6000; tick += 1) {
      if (tick === 50) {
        engine.apply({ type: 'bolus', payload: { drugId: 'propofol', amount: 2.5, unit: 'mg/kg' }, tick } as never);
      }
      // Ventilate with 100% oxygen well after the arrest.
      if (!rescued && engine.equipment().rhythmId === 'asystole' && tick > 3000) {
        engine.apply({
          type: 'ventilator',
          payload: { fio2: 1, delivering: true, mode: 'volume-control' }, tick,
        } as never);
        rescued = true;
      }
      last = engine.step().state;
    }
    expect(rescued).toBe(true);
    expect(engine.equipment().rhythmId).toBe('asystole');
    // The STATE, not just the display: an earlier version masked the arrest at
    // the monitor while the underlying heart rate quietly recovered.
    expect(last.heartRateBpm).toBe(0);
    expect(last.cardiacOutputLPerMin).toBe(0);
  });

  it('shows nothing rather than a number the instrument cannot produce', () => {
    // A pulse oximeter reads the pulsatile component of absorbance. With no
    // output there is nothing to read, and the old display was "0%" — which
    // reads as a measurement rather than as the absence of one.
    const { engine } = abandonedAfterInduction();
    const invalid = engine.invalidParameters();
    expect(invalid.has('spo2Percent')).toBe(true);
    expect(invalid.has('heartRateBpm')).toBe(true);
    expect(invalid.has('meanArterialMmHg')).toBe(true);
  });
});

describe('a session that is managed properly', () => {
  it('never arrests, and never sees the hypoxic drives at all', () => {
    // The guard against the fix being too eager: a preoxygenated, ventilated
    // patient must be untouched by any of this.
    const engine = new AnesthesiaEngine({
      scenario: ROUTINE_INDUCTION, seed: 7, practiceRegion: 'US',
    });
    engine.apply({ type: 'ventilator', payload: { fio2: 1 }, tick: 0 } as never);
    for (let tick = 0; tick < 6000; tick += 1) {
      if (tick === 1950) {
        engine.apply({ type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' }, tick } as never);
      }
      if (tick === 2900) {
        engine.apply({
          type: 'ventilator', payload: { delivering: true, mode: 'volume-control' }, tick,
        } as never);
      }
      const state = engine.step().state;
      expect(state.spo2Percent, `desaturated at tick ${tick}`).toBeGreaterThan(90);
    }
    expect(engine.equipment().rhythmId).not.toBe('asystole');
  });
});

describe('the traces at arrest', () => {
  /**
   * The engine sets the rhythm to asystole when the circulation stops, and the
   * waveform engine has to be able to draw that. A rhythm the engine can reach
   * but the renderer cannot draw would be a NaN in a Float32Array and a monitor
   * full of nothing, at the single most dramatic moment a session has.
   */
  const arrested = (() => {
    const engine = new AnesthesiaEngine({
      scenario: ROUTINE_INDUCTION, seed: 7, practiceRegion: 'US',
    });
    let arrestedAt = -1;
    for (let tick = 0; tick < 4000; tick += 1) {
      if (tick === 50) {
        engine.apply({
          type: 'bolus', payload: { drugId: 'propofol', amount: 2.5, unit: 'mg/kg' }, tick,
        } as never);
      }
      const result = engine.step();
      if (arrestedAt < 0 && engine.equipment().rhythmId === 'asystole') arrestedAt = tick;
      if (arrestedAt > 0 && tick === arrestedAt + 300) return { engine, result, arrestedAt };
    }
    throw new Error('the patient never arrested');
  })();

  const samples = (signal: 'ecg' | 'arterial' | 'capno' | 'pleth') =>
    Array.from(arrested.result.waveforms[signal].samples as Float32Array);

  it('draws every trace, with no NaN anywhere in the buffers', () => {
    for (const signal of ['ecg', 'arterial', 'capno', 'pleth'] as const) {
      const values = samples(signal);
      expect(values.length, signal).toBeGreaterThan(0);
      expect(values.every(Number.isFinite), `${signal} contains a non-finite sample`).toBe(true);
    }
  });

  it('flattens the traces that need a circulation to exist', () => {
    // An arterial line with no cardiac output, and a plethysmogram with no
    // pulse, have nothing to show. A trace still pulsing here would contradict
    // the rhythm the monitor is reporting.
    for (const signal of ['arterial', 'pleth'] as const) {
      const values = samples(signal);
      expect(Math.max(...values) - Math.min(...values), `${signal} is still pulsing`)
        .toBeLessThan(0.5);
    }
  });

  it('leaves the electrocardiogram flat rather than beating', () => {
    // Asystole is a flat line with baseline wander, not a rhythm.
    const values = samples('ecg');
    expect(Math.max(...values) - Math.min(...values)).toBeLessThan(0.2);
  });

  it('takes several minutes to get there, so it is watchable', () => {
    expect(arrested.arrestedAt / 10).toBeGreaterThan(120);
    expect(arrested.arrestedAt / 10).toBeLessThan(600);
  });
});
