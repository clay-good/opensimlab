/**
 * The anaesthesia module's twenty-fifth observed-state worked example, driven
 * through the real engine.
 *
 * The sibling of the repeated-laryngoscopy example, carrying the same
 * no-dispatch beat while an attempt is in progress: the attempt count is still
 * zero until the procedure completes, so without it the read-backwards chain
 * falls through to an earlier gate and re-emits it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE as SCENARIO } from '@anesthesia/scenarios/difficult-airway-supraglottic-rescue';
import { REPEATED_LARYNGOSCOPY_HARM } from '@anesthesia/scenarios/repeated-laryngoscopy-harm';
import { DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/difficult-airway-supraglottic-rescue-fixtures';
import {
  SUPRAGLOTTIC_RESCUE_DEMONSTRATION_VERSION,
  supraglotticRescueDemonstrationStep,
  supportsSupraglotticRescueDemonstration,
  type SupraglotticRescueProgress,
} from '@anesthesia/demo/supraglottic-rescue-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 12_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const snapshots = new Map<string, SupraglotticRescueProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): SupraglotticRescueProgress => {
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
    const step = supraglotticRescueDemonstrationStep(progress());
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

describe('Requirement: The Supraglottic Example Escalates Inside The Window', () => {
  const fresh = runExample();
  // A learner who preoxygenated and handed the case back mid-reserve.
  const handover = runExample(FIXTURES.expert.slice(0, 2));

  it('binds to this exact scenario version and no other', () => {
    expect(SUPRAGLOTTIC_RESCUE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsSupraglotticRescueDemonstration(SCENARIO)).toBe(true);
    expect(supportsSupraglotticRescueDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The near-twin must never be answered for by this example.
    expect(supportsSupraglotticRescueDemonstration(REPEATED_LARYNGOSCOPY_HARM)).toBe(false);
  });

  it('advances every beat on observed state, in order, and makes one attempt', () => {
    expect(fresh.beats).toEqual([
      'preoxygenate', 'induce', 'attempt', 'attempting', 'escalate', 'rescue', 'confirm',
    ]);
    const recorded = fresh.progress();
    expect(recorded.attempts).toBe(1);
    expect(recorded.airwayDevice).toBe('supraglottic-airway');
    // The in-progress beat is why 'induce' is not re-emitted mid-attempt.
    expect(fresh.beats.indexOf('attempting')).toBe(fresh.beats.indexOf('attempt') + 1);
    expect(fresh.beats.filter((beat) => beat === 'induce')).toHaveLength(1);
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('laryngoscopy-refused-'))).toHaveLength(0);
  });

  it('builds the reserve before inducing, read at the moment it induced', () => {
    // Not at the end of the run: the fraction falls during the apnoeic attempt.
    expect(fresh.snapshots.get('induce')!.endTidalOxygenFraction).toBeGreaterThanOrEqual(0.9);
    expect(fresh.snapshots.get('induce')!.propofolTotalMg).toBe(0);
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('attempt');
    expect(handover.beats).not.toContain('preoxygenate');
    expect(handover.beats).not.toContain('induce');
    expect(handover.progress().airwayDevice).toBe('supraglottic-airway');
  });

  it('escalates at the failed attempt, inside the declared window', () => {
    const escalate = fresh.narrations[fresh.beats.indexOf('escalate')]!;
    expect(escalate).toContain("window opens at the failed attempt");
    expect(escalate).toContain('while there is still a full reserve');
    // And it escalates before rescuing, not after.
    expect(fresh.beats.indexOf('escalate')).toBeLessThan(fresh.beats.indexOf('rescue'));
  });

  it('frames the rescue as a decision about stopping', () => {
    const rescue = fresh.narrations[fresh.beats.indexOf('rescue')]!;
    expect(rescue).toContain('a decision about stopping');
    expect(rescue).toContain('the tube is one route to it and not the only one');
  });

  it('declines the credit its own demonstration would take', () => {
    // The honest closing reports all three findings, including the two that are
    // properties of the rubric rather than of the airway.
    expect(fresh.closing).toContain('lowest saturation of 54%');
    expect(fresh.closing).toContain('The reserve is doing the work, not the restraint');
    expect(fresh.closing).toContain('there is no gradient between late and never');
    expect(fresh.closing).toContain('the wording is narrower than the check');
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
    const step = supraglotticRescueDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
