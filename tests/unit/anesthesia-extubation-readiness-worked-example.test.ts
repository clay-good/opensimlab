/**
 * The anaesthesia module's eighteenth observed-state worked example, driven
 * through the real engine, and the fourth to read an assessment sidecar: five
 * beats, each gated on the previous step's tick being recorded.
 *
 * The thing this example has to do that none of the others does is argue against
 * caution — and it does that by pointing at the lesson it mirrors.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { EXTUBATION_READINESS as SCENARIO } from '@anesthesia/scenarios/extubation-readiness';
import { EMERGENCE_WITH_RESIDUAL_BLOCKADE } from '@anesthesia/scenarios/emergence-with-residual-blockade';
import { DELAYED_EMERGENCE_DIFFERENTIAL } from '@anesthesia/scenarios/delayed-emergence-differential';
import { EXTUBATION_READINESS_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/extubation-readiness-fixtures';
import {
  EXTUBATION_READINESS_DEMONSTRATION_VERSION, extubationReadinessDemonstrationStep,
  supportsExtubationReadinessDemonstration, type ExtubationReadinessProgress,
} from '@anesthesia/demo/extubation-readiness-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 6_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sidecar. */
  const progress = (): ExtubationReadinessProgress => {
    const assessment = engine.equipment().resuscitation.extubationReadinessAssessment;
    const state = frame.state as Readonly<Record<string, number>>;
    return {
      quantitativeRecoveryReviewedAtTick: assessment?.quantitativeRecoveryReviewedAtTick ?? null,
      awakeAirwayReviewedAtTick: assessment?.awakeAirwayReviewedAtTick ?? null,
      gasExchangeReviewedAtTick: assessment?.gasExchangeReviewedAtTick ?? null,
      airwayPlanReviewedAtTick: assessment?.airwayPlanReviewedAtTick ?? null,
      decision: assessment?.decision ?? null,
      trainOfFourRatio: state.trainOfFourRatio ?? 1,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = extubationReadinessDemonstrationStep(progress());
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

describe('Requirement: The Extubation Example Argues Against Caution', () => {
  const fresh = runExample();
  // Handed the error path: a decision the engine already refused.
  const handover = runExample(FIXTURES.commonError);

  it('binds to this exact scenario version and no other', () => {
    expect(EXTUBATION_READINESS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsExtubationReadinessDemonstration(SCENARIO)).toBe(true);
    expect(supportsExtubationReadinessDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The lesson it mirrors, and the other five-step emergence vignette.
    expect(supportsExtubationReadinessDemonstration(EMERGENCE_WITH_RESIDUAL_BLOCKADE)).toBe(false);
    expect(supportsExtubationReadinessDemonstration(DELAYED_EMERGENCE_DIFFERENTIAL)).toBe(false);
  });

  it('advances every beat on recorded steps, in order, to a decision', () => {
    expect(fresh.beats).toEqual([
      'quantitative', 'awake-airway', 'gas-exchange', 'plan', 'decide',
    ]);
    expect(fresh.progress().decision).toBe('ready-for-planned-awake-extubation');
    expect(fresh.events.filter((event) => event.eventId.includes('refused'))).toHaveLength(0);
  });

  it('treats the ratio as one input rather than the answer', () => {
    const quantitative = fresh.narrations[0]!;
    expect(quantitative).toContain('one input rather than the answer');
    expect(quantitative).toContain('not that there is no reason to wait');
  });

  it('separates strength from wakefulness from breathing', () => {
    const awake = fresh.narrations[fresh.beats.indexOf('awake-airway')]!;
    expect(awake).toContain('the half of readiness the monitor cannot measure');
    const gas = fresh.narrations[fresh.beats.indexOf('gas-exchange')]!;
    expect(gas).toContain('a separate question with a separate answer');
  });

  it('names the rescue plan as the review most likely to be skipped', () => {
    const plan = fresh.narrations[fresh.beats.indexOf('plan')]!;
    expect(plan).toContain('cheapest to make exactly then');
    expect(plan).toContain('most likely to be skipped');
  });

  it('sets itself beside the lesson it mirrors, and names the cost of caution', () => {
    expect(fresh.closing).toContain('0.72');
    expect(fresh.closing).toContain('There, deferring is right');
    expect(fresh.closing).toContain('Caution is not a free action');
    expect(fresh.closing).toContain('scores four of these five objectives');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('removes no tube, because the lesson stops at the decision', () => {
    expect(fresh.closing).toContain('no tube removed');
    expect(fresh.engine.equipment().airway.intubated).toBe(true);
  });

  it('picks up a case whose decision was already refused', () => {
    // Nothing the learner did was recorded, so it starts from the beginning.
    expect(handover.beats).toEqual([
      'quantitative', 'awake-airway', 'gas-exchange', 'plan', 'decide',
    ]);
    expect(handover.progress().decision).toBe('ready-for-planned-awake-extubation');
    expect(handover.events.filter((event) => event.eventId.includes('refused'))).toHaveLength(1);
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'he recovered', 'he was fine', 'was extubated safely',
      'no harm came', 'he survived', 'the extubation went']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = extubationReadinessDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
