/** Acceptance tests for engine/simulation-clock. */
import { describe, expect, it } from 'vitest';
import {
  MAX_CATCHUP_TICKS, SINGLE_STEP_TICKS, SPEED_MULTIPLIERS, SimulationClock,
  TICKS_PER_SECOND, TICK_MS, formatElapsed,
} from '@platform/clock/simulation-clock';

describe('Requirement: Fixed Simulation Tick', () => {
  it('Scenario: One tick, one solver step', () => {
    for (const speed of SPEED_MULTIPLIERS) {
      const clock = new SimulationClock();
      clock.setSpeed(speed);
      clock.play();
      let steps = 0;
      // Sixty simulated seconds at this speed takes 60000/speed milliseconds.
      const wallMs = 60_000 / speed;
      const chunk = 16;
      for (let elapsed = 0; elapsed < wallMs; elapsed += chunk) {
        steps += clock.ticksFor(Math.min(chunk, wallMs - elapsed));
      }
      expect(steps).toBe(600);
      expect(clock.tick).toBe(600);
    }
  });

  it('Scenario: Display time is derived, not stored', () => {
    expect(formatElapsed(0)).toBe('00:00:00');
    expect(formatElapsed(TICKS_PER_SECOND * 61)).toBe('00:01:01');
    expect(formatElapsed(TICKS_PER_SECOND * 3725)).toBe('01:02:05');
    const clock = new SimulationClock();
    clock.play();
    clock.ticksFor(12_345);
    expect(clock.snapshot().elapsed).toBe(formatElapsed(clock.tick));
  });

  it('uses a 100 ms tick', () => {
    expect(TICK_MS).toBe(100);
    expect(TICKS_PER_SECOND).toBe(10);
  });
});

describe('Requirement: Transport Controls', () => {
  it('offers exactly the declared speed multipliers', () => {
    expect([...SPEED_MULTIPLIERS]).toEqual([1, 2, 5, 60]);
  });

  it('Scenario: Pause freezes physiology but not the interface', () => {
    const clock = new SimulationClock();
    clock.play();
    clock.ticksFor(1000);
    const frozen = clock.tick;
    clock.pause();
    expect(clock.ticksFor(60_000)).toBe(0);
    expect(clock.tick).toBe(frozen);
    // The snapshot still reports, so the interface can keep rendering.
    expect(clock.snapshot().state).toBe('paused');
    expect(clock.snapshot().elapsed).toBe(formatElapsed(frozen));
  });

  it('advances exactly one simulated second on single-step', () => {
    const clock = new SimulationClock();
    expect(clock.singleStep()).toBe(SINGLE_STEP_TICKS);
    expect(clock.tick).toBe(10);
  });

  it('Scenario: Reset requires confirmation and clears state', () => {
    const clock = new SimulationClock();
    clock.play();
    clock.ticksFor(5000);
    expect(clock.tick).toBeGreaterThan(0);
    clock.reset();
    expect(clock.tick).toBe(0);
    expect(clock.state).toBe('idle');
  });

  it('restores only an exact deterministic replay tick and remains paused', () => {
    const clock = new SimulationClock();
    clock.restore(600);
    expect(clock.snapshot()).toMatchObject({ tick: 600, state: 'paused', elapsed: '00:01:00' });
    expect(() => clock.restore(1.5)).toThrow('non-negative integer');
    expect(() => clock.restore(-1)).toThrow('non-negative integer');
  });

  it('loses no time to rounding across many small advances', () => {
    const clock = new SimulationClock();
    clock.play();
    // 16.7 ms frames for ten simulated seconds at 1x.
    let total = 0;
    for (let i = 0; i < 600; i += 1) total += clock.ticksFor(10_000 / 600);
    expect(total).toBe(100);
  });
});

describe('Requirement: Catch-Up Is Bounded', () => {
  it('Scenario: Backgrounded tab does not skip ahead', () => {
    const clock = new SimulationClock();
    clock.play();
    // Ten minutes hidden at 1x would be 6000 ticks.
    const ticks = clock.ticksFor(10 * 60 * 1000);
    expect(ticks).toBe(MAX_CATCHUP_TICKS);
    expect(ticks).toBe(50);
    expect(clock.snapshot().catchUpWasCapped).toBe(true);
    // And the next normal advance is not still capped.
    clock.ticksFor(100);
    expect(clock.snapshot().catchUpWasCapped).toBe(false);
  });
});
