/**
 * The anaesthesia module's twenty-fourth observed-state worked example, driven
 * through the real engine.
 *
 * Its gates — end-tidal oxygen fraction, a latched help tick, accepted
 * milligrams, the attempt count, and the airway device — are all monotone across
 * this lesson, so no beat can walk backwards.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { REPEATED_LARYNGOSCOPY_HARM as SCENARIO } from '@anesthesia/scenarios/repeated-laryngoscopy-harm';
import { RAPID_DESATURATION } from '@anesthesia/scenarios/rapid-desaturation';
import { REPEATED_LARYNGOSCOPY_HARM_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/repeated-laryngoscopy-harm-fixtures';
import {
  REPEATED_LARYNGOSCOPY_DEMONSTRATION_VERSION,
  repeatedLaryngoscopyDemonstrationStep,
  supportsRepeatedLaryngoscopyDemonstration,
  type RepeatedLaryngoscopyProgress,
} from '@anesthesia/demo/repeated-laryngoscopy-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 12_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  /** The observed state at the moment each beat first fired. */
  const snapshots = new Map<string, RepeatedLaryngoscopyProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): RepeatedLaryngoscopyProgress => {
    const equipment = engine.equipment();
    const propofol = SCENARIO.formulary.find((entry) => entry.drugId === 'propofol')!;
    const remaining = equipment.drugs
      .find((drug) => drug.drugId === 'propofol')?.syringeRemainingMl ?? propofol.syringeVolumeMl;
    const state = frame.state as Readonly<Record<string, number>>;
    return {
      endTidalOxygenFraction: state.endTidalO2Fraction ?? 0,
      helpRequestedAtTick: equipment.airway.helpRequestedAtTick ?? null,
      propofolTotalMg: (propofol.syringeVolumeMl - remaining) * propofol.concentration,
      attempts: equipment.airway.attempts,
      attemptInProgress: equipment.airway.attemptInProgress,
      airwayDevice: equipment.airway.device,
      ventilatorDelivering: equipment.ventilator.delivering,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = repeatedLaryngoscopyDemonstrationStep(progress());
    if (step.finished) {
      return { beats, narrations, events, snapshots, closing: step.narration, engine, progress, tick };
    }
    if (beats.at(-1) !== step.id) {
      beats.push(step.id); narrations.push(step.narration);
      if (!snapshots.has(step.id)) snapshots.set(step.id, progress());
    }
    if (step.dispatch && !submitted.has(step.id)) {
      submitted.add(step.id);
      engine.apply({ tick, ...step.dispatch });
    }
    frame = engine.step();
    events.push(...frame.events);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Laryngoscopy Example Argues With Its Own Title', () => {
  const fresh = runExample();
  // A learner who preoxygenated, called for help, and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 2));

  it('binds to this exact scenario version and no other', () => {
    expect(REPEATED_LARYNGOSCOPY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsRepeatedLaryngoscopyDemonstration(SCENARIO)).toBe(true);
    expect(supportsRepeatedLaryngoscopyDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsRepeatedLaryngoscopyDemonstration(RAPID_DESATURATION)).toBe(false);
  });

  it('advances every beat on observed state, in order, and makes one attempt', () => {
    expect(fresh.beats).toEqual([
      'preoxygenate', 'help', 'induce', 'attempt', 'attempting', 'rescue', 'confirm',
    ]);
    const recorded = fresh.progress();
    expect(recorded.attempts).toBe(1);
    expect(recorded.airwayDevice).toBe('supraglottic-airway');
    // Read at the moment induction fired, not at the end: the fraction falls
    // during the apnoeic attempt, which is the whole point of building it first.
    expect(fresh.snapshots.get('induce')!.endTidalOxygenFraction).toBeGreaterThanOrEqual(0.9);
    expect(fresh.snapshots.get('induce')!.propofolTotalMg).toBe(0);
    // The in-progress beat is why: without it the example falls back through
    // a gate it has already passed and re-emits 'induce' mid-attempt.
    expect(fresh.beats.indexOf('attempting')).toBe(fresh.beats.indexOf('attempt') + 1);
    expect(fresh.beats.filter((beat) => beat === 'induce')).toHaveLength(1);
    // Nothing is refused: it never overlaps a procedure or looks again.
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('laryngoscopy-refused-'))).toHaveLength(0);
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('induce');
    expect(handover.beats).not.toContain('preoxygenate');
    expect(handover.beats).not.toContain('help');
    expect(handover.progress().airwayDevice).toBe('supraglottic-airway');
  });

  it('waits for the number rather than the clock before inducing', () => {
    const preoxygenate = fresh.narrations[fresh.beats.indexOf('preoxygenate')]!;
    expect(preoxygenate).toContain('wait for the number rather than the clock');
    expect(preoxygenate).toContain('decides how much the rest of the case costs');
  });

  it('calls for help before the first attempt, not after a failed one', () => {
    const help = fresh.narrations[fresh.beats.indexOf('help')]!;
    expect(help).toContain('BEFORE the first attempt');
    expect(help).toContain('something to act on rather than to have read');
  });

  it('frames the rescue as a decision about stopping', () => {
    const rescue = fresh.narrations[fresh.beats.indexOf('rescue')]!;
    expect(rescue).toContain('a decision about stopping');
    expect(rescue).toContain('the tube is only one way to reach it');
  });

  it('separates a device that is in place from one that is ventilating', () => {
    const confirm = fresh.narrations[fresh.beats.indexOf('confirm')]!;
    expect(confirm).toContain('thirty continuous seconds');
    expect(confirm).toContain('two different claims');
  });

  it('declines the credit its own demonstration would take', () => {
    // The honest closing: it reports that the three attempts it did NOT make
    // would have cost this patient nothing, and where the harm actually lives.
    expect(fresh.closing).toContain('also never drops below 100%');
    expect(fresh.closing).toContain('cost the patient nothing measurable');
    expect(fresh.closing).toContain('lowest saturation of 41%');
    expect(fresh.closing).toContain('how the reserve gets spent');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'she did well', 'recovered fully', 'was fine',
      'no harm came', 'survived', 'the operation went']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = repeatedLaryngoscopyDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
