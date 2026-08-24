/**
 * Timeline events, and the trap they used to be.
 *
 * The scenario schema advertised nine event types, a `when:` state predicate and
 * a `repeatable` flag. The engine read `atTick` and four of the nine types. An
 * author could write `when: "spo2Percent < 90"`, pass validation, and get an
 * event that never fired, with nothing anywhere saying why.
 *
 * These cover the behaviour that replaced it, and the parser that has to stay
 * incapable of executing anything.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { EVENT_TYPES } from '@anesthesia/scenarios/event-types';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import {
  InvalidPredicate, evaluatePredicate, parsePredicate,
} from '@anesthesia/scenarios/predicate';
import type { TimelineEvent } from '@anesthesia/scenarios/types';

/** The routine induction with its timeline replaced, so one event is isolated. */
const withTimeline = (timeline: TimelineEvent[]) => ({
  ...ROUTINE_INDUCTION,
  timeline,
});

const run = (timeline: TimelineEvent[], ticks: number) => {
  const engine = new AnesthesiaEngine({
    scenario: withTimeline(timeline) as never, seed: 11, practiceRegion: 'US',
  });
  const events: { id: string; message: string }[] = [];
  for (let tick = 0; tick < ticks; tick += 1) {
    for (const event of engine.step().events) events.push({ id: event.eventId, message: event.message });
  }
  return { engine, events };
};

describe('parsing a state predicate', () => {
  it('reads the form a scenario author would write', () => {
    expect(parsePredicate('spo2Percent < 90')).toEqual({
      field: 'spo2Percent', operator: '<', value: 90,
    });
    expect(parsePredicate('meanArterialMmHg<=55').operator).toBe('<=');
    expect(parsePredicate('depthIndex >= 60').operator).toBe('>=');
    expect(parsePredicate('respiratoryRateBpm == 0').operator).toBe('==');
    expect(parsePredicate('respiratoryRateBpm != 0').operator).toBe('!=');
  });

  it('prefers the two-character operator, so <= is not read as <', () => {
    // Read as `<`, `spo2Percent <= 90` would parse its value from "= 90" and
    // silently become a predicate that can never be decided.
    expect(parsePredicate('spo2Percent <= 90')).toEqual({
      field: 'spo2Percent', operator: '<=', value: 90,
    });
  });

  it('cannot execute anything, whatever is written in it', () => {
    // A scenario is content, and content will eventually come from people other
    // than the maintainers. There is no path from this string to running code,
    // and each of these is refused rather than interpreted.
    for (const hostile of [
      'process.exit(1)',
      'globalThis.fetch("https://example.com")',
      'spo2Percent < 90 && fetch("/x")',
      '(() => 1)() < 2',
      'constructor.constructor("return 1")() < 2',
    ]) {
      expect(() => parsePredicate(hostile), hostile).toThrow(InvalidPredicate);
    }
  });

  it('refuses what it cannot decide, and says what was wrong', () => {
    expect(() => parsePredicate('')).toThrow(/empty/);
    expect(() => parsePredicate('spo2Percent')).toThrow(/no comparison/);
    expect(() => parsePredicate('spo2Percent < banana')).toThrow(/finite number/);
    expect(() => parsePredicate('spo2Percent < NaN')).toThrow(/finite number/);
    expect(() => parsePredicate('spo2 percent < 90')).toThrow(/not a state field/);
    expect(() => parsePredicate('a < 90 && b > 2')).toThrow(/two timeline events/);
  });
});

describe('deciding a state predicate', () => {
  const p = parsePredicate('spo2Percent < 90');

  it('decides against the state it is given', () => {
    expect(evaluatePredicate(p, { spo2Percent: 88 })).toBe(true);
    expect(evaluatePredicate(p, { spo2Percent: 97 })).toBe(false);
  });

  it('is false for a field the state does not carry, rather than throwing', () => {
    // The state gains and loses fields as equipment comes and goes. A scenario
    // should not die because a train-of-four ratio is absent.
    expect(evaluatePredicate(p, {})).toBe(false);
    expect(evaluatePredicate(p, { spo2Percent: Number.NaN })).toBe(false);
  });
});

describe('firing timeline events', () => {
  it('fires a `when:` event when the patient reaches the state', () => {
    // Nothing is given, so the patient stays saturated and this never fires.
    const quiet = run([{
      id: 'desat', type: 'narrative', when: 'spo2Percent < 90', message: 'Saturation is falling.',
    }], 200);
    expect(quiet.events.filter((e) => e.id === 'desat')).toHaveLength(0);

    // A condition that is true from the start fires immediately.
    const loud = run([{
      id: 'awake', type: 'narrative', when: 'depthIndex > 60', message: 'The patient is awake.',
    }], 20);
    expect(loud.events.filter((e) => e.id === 'awake')).toHaveLength(1);
  });

  it('fires a `when:` event once, not once per tick it stays true', () => {
    const { events } = run([{
      id: 'awake', type: 'narrative', when: 'depthIndex > 60', message: 'The patient is awake.',
    }], 600);
    expect(events.filter((e) => e.id === 'awake')).toHaveLength(1);
  });

  it('re-fires a repeatable event only on a fresh rising edge', () => {
    // Held true for the whole run: a repeatable event that fired on every tick
    // it was true would produce six hundred log entries, not two.
    const { events } = run([{
      id: 'awake', type: 'narrative', repeatable: true, when: 'depthIndex > 60',
      message: 'The patient is awake.',
    }], 600);
    expect(events.filter((e) => e.id.startsWith('awake'))).toHaveLength(1);
  });

  it('says so when an event cannot fire, instead of failing silently', () => {
    const { events } = run([{
      id: 'broken', type: 'narrative', when: 'spo2Percent !!! 90', message: 'never seen',
    }], 20);
    const complaint = events.find((e) => e.id === 'bad-predicate-broken');
    expect(complaint).toBeDefined();
    expect(complaint!.message).toContain('will never fire');
    expect(events.filter((e) => e.id === 'broken')).toHaveLength(0);
  });
});

describe('every declared event type does something', () => {
  it('changes the rhythm', () => {
    const { events } = run([{
      id: 'vf', type: 'rhythm-change', atTick: 10, target: 'ventricular-fibrillation',
    }], 40);
    expect(events.some((e) => e.message.includes('ventricular-fibrillation'))).toBe(true);
  });

  it('injects and clears a sensor artifact', () => {
    const injected = run([{ id: 'a', type: 'artifact', atTick: 10, target: 'electrocautery' }], 40);
    expect(injected.events.some((e) => e.message.includes('Injected'))).toBe(true);

    const cleared = run([{
      id: 'a', type: 'artifact', atTick: 10, target: 'electrocautery', value: 0,
    }], 40);
    expect(cleared.events.some((e) => e.message.includes('Cleared'))).toBe(true);
  });

  it('fails the equipment it actually models', () => {
    const { engine } = run([
      { id: 'o2', type: 'equipment-failure', atTick: 10, target: 'oxygen-supply' },
    ], 40);
    expect(engine.equipment().ventilator.fio2).toBe(0.21);

    const disconnected = run([
      { id: 'd', type: 'equipment-failure', atTick: 10, target: 'ventilator-disconnection' },
    ], 40);
    expect(disconnected.engine.equipment().ventilator.delivering).toBe(false);
  });

  it('refuses an equipment failure it does not model, by name', () => {
    const { events } = run([{
      id: 'oops', type: 'equipment-failure', atTick: 10, target: 'time-travel',
    }], 40);
    const complaint = events.find((e) => e.id.startsWith('incomplete-event-oops'));
    expect(complaint?.message).toContain('does not model');
    expect(complaint?.message).toContain('ventilator-disconnection');
  });

  it('complains about an event that names nothing to act on', () => {
    for (const type of ['rhythm-change', 'artifact'] as const) {
      const { events } = run([{ id: 'bare', type, atTick: 10 }], 40);
      expect(
        events.some((e) => e.id.startsWith('incomplete-event-bare')),
        `${type} fired silently with no target`,
      ).toBe(true);
    }
  });

  it('complains about a sustained event with no window', () => {
    const { events } = run([{ id: 'stim', type: 'surgical-stimulus', atTick: 10, value: 5 }], 40);
    expect(events.some((e) => e.id.startsWith('incomplete-event-stim'))).toBe(true);
  });

  it('declares no type it cannot honour', () => {
    // The switch in the engine is exhaustive over this list and fails to compile
    // if a name is added without being handled, so this asserts the list itself
    // has not regrown a member that was removed for being unimplementable.
    expect([...EVENT_TYPES]).not.toContain('objective-window');
    expect(EVENT_TYPES).toContain('malignant-hyperthermia');
    expect(EVENT_TYPES).toContain('difficult-airway');
    expect(EVENT_TYPES).toContain('local-anesthetic-toxicity');
    expect(EVENT_TYPES).toHaveLength(13);
  });
});

describe('the scenario schema and the engine agree', () => {
  it('accepts a `when:` event, which is the whole point of validating one', () => {
    expect(validateScenario(withTimeline([{
      id: 'desat', type: 'narrative', when: 'spo2Percent < 90', message: 'Saturation is falling.',
    }]))).toEqual([]);
  });

  it('accepts a target on the events that need one', () => {
    expect(validateScenario(withTimeline([{
      id: 'vf', type: 'rhythm-change', atTick: 10, target: 'ventricular-fibrillation',
    }]))).toEqual([]);
  });

  it('still refuses an event with both a tick and a condition', () => {
    const errors = validateScenario(withTimeline([{
      id: 'both', type: 'narrative', atTick: 10, when: 'spo2Percent < 90', message: 'Both declared.',
    }]));
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('exactly one');
  });
});
