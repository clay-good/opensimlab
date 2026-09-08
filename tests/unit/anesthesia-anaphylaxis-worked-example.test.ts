/**
 * The anaesthesia module's thirteenth observed-state worked example, driven
 * through the real engine.
 *
 * The engine's anaphylaxis severity is private and not on the snapshot, so this
 * example triggers on the collapse itself — the observation the learner actually
 * has. Its treatment branch is latched on epinephrine having been given, because
 * the drug lifts the pressure back over the trigger threshold for a while and a
 * gate on the collapse alone walks the example back into its waiting beat.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC as SCENARIO } from '@anesthesia/scenarios/perioperative-anaphylaxis-after-antibiotic';
import { HYPOTENSION_AFTER_INDUCTION } from '@anesthesia/scenarios/hypotension-after-induction';
import { LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY } from '@anesthesia/scenarios/local-anesthetic-systemic-toxicity';
import { PERIOPERATIVE_ANAPHYLAXIS_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/perioperative-anaphylaxis-fixtures';
import {
  ANAPHYLAXIS_DEMONSTRATION_VERSION, anaphylaxisDemonstrationStep,
  supportsAnaphylaxisDemonstration, type AnaphylaxisProgress,
} from '@anesthesia/demo/anaphylaxis-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 10_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): AnaphylaxisProgress => {
    const equipment = engine.equipment();
    const state = frame.state as Readonly<Record<string, number>>;
    return {
      inspiredOxygenFraction: equipment.ventilator.fio2,
      ventilatorDelivering: equipment.ventilator.delivering,
      epinephrineTotalMicrograms: equipment.resuscitation.epinephrineTotalMicrograms,
      crystalloidTotalMl: equipment.resuscitation.crystalloidTotalMl,
      meanArterialMmHg: state.meanArterialMmHg ?? 0,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = anaphylaxisDemonstrationStep(progress());
    if (step.finished) {
      return { beats, narrations, events, closing: step.narration, engine, progress, tick };
    }
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.dispatch && !submitted.has(step.id)) {
      submitted.add(step.id);
      engine.apply({ tick, ...step.dispatch });
    }
    frame = engine.step();
    events.push(...frame.events);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Anaphylaxis Example Reaches For The Mechanism', () => {
  const fresh = runExample();
  // Handed the error path's opening: prepared, then a vasopressor and a litre.
  const handover = runExample(FIXTURES.commonError.slice(0, 3));

  it('binds to this exact scenario version and no other', () => {
    expect(ANAPHYLAXIS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAnaphylaxisDemonstration(SCENARIO)).toBe(true);
    expect(supportsAnaphylaxisDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The other collapse lesson, and the other bounded-epinephrine lesson.
    expect(supportsAnaphylaxisDemonstration(HYPOTENSION_AFTER_INDUCTION)).toBe(false);
    expect(supportsAnaphylaxisDemonstration(LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY)).toBe(false);
  });

  it('advances every beat on physiology, in order, without walking backwards', () => {
    // The waiting beat must not reappear between the drug and the volume: the
    // epinephrine lifts the pressure back over the trigger threshold, so the
    // treatment branch is latched on the drug rather than gated on the collapse.
    expect(fresh.beats).toEqual(['prepare', 'watching', 'epinephrine', 'volume-0', 'volume-1000']);
    expect(fresh.beats.lastIndexOf('watching')).toBeLessThan(fresh.beats.indexOf('epinephrine'));
    expect(fresh.progress().epinephrineTotalMicrograms).toBe(50);
    expect(fresh.progress().crystalloidTotalMl).toBe(2000);
    expect(fresh.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
  });

  it('prepares before the exposure, and says that decides an objective', () => {
    expect(fresh.beats[0]).toBe('prepare');
    const prepare = fresh.narrations[0]!;
    expect(prepare).toContain('before anything has happened');
    expect(prepare).toContain('counts settings established beforehand');
  });

  it('names the adjacency as the whole diagnosis', () => {
    const watching = fresh.narrations[fresh.beats.indexOf('watching')]!;
    expect(watching).toContain('nothing about the next two minutes will announce itself');
    expect(watching).toContain('that adjacency is the whole diagnosis');
  });

  it('gives epinephrine first, as the mechanism rather than the reading', () => {
    expect(fresh.beats.indexOf('epinephrine'))
      .toBeLessThan(fresh.beats.findIndex((id) => id.startsWith('volume-')));
    const epinephrine = fresh.narrations[fresh.beats.indexOf('epinephrine')]!;
    expect(epinephrine).toContain('acts on the mechanism rather than on the reading');
    expect(epinephrine).toContain('the first thing and not the third');
  });

  it('never reaches for the vasopressor, and states what a run that does gets', () => {
    expect(fresh.beats.some((id) => id.includes('vasopressor'))).toBe(false);
    expect(fresh.closing).toContain('Worth naming what was NOT used');
    expect(fresh.closing).toContain('7.3 mmHg');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('picks up a case that was already treated as an ordinary collapse', () => {
    // It does not undo the vasopressor and does not pretend it helped: it gives
    // the drug that was missing.
    expect(handover.beats[0]).toBe('epinephrine');
    expect(handover.beats).not.toContain('prepare');
    expect(handover.progress().epinephrineTotalMicrograms).toBe(50);
    expect(handover.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['she did well', 'she recovered', 'she was fine', 'the operation went',
      'no harm came', 'she survived', 'the reaction is over']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = anaphylaxisDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
