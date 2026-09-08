/**
 * The anaesthesia module's sixteenth observed-state worked example, driven
 * through the real engine, and the second to read an assessment sidecar rather
 * than physiology. Its beats read ticks that are either null or not, so none of
 * its gates can reverse the way a pressure or a twitch count can.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { ASPIRATION_RISK_RECOGNITION as SCENARIO } from '@anesthesia/scenarios/aspiration-risk-recognition';
import { EMERGENCE_WITH_RESIDUAL_BLOCKADE } from '@anesthesia/scenarios/emergence-with-residual-blockade';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { ASPIRATION_RISK_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/aspiration-risk-recognition-fixtures';
import {
  ASPIRATION_RISK_DEMONSTRATION_VERSION, aspirationRiskDemonstrationStep,
  supportsAspirationRiskDemonstration, type AspirationRiskProgress,
} from '@anesthesia/demo/aspiration-risk-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 6_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sidecar. */
  const progress = (): AspirationRiskProgress => {
    const assessment = engine.equipment().resuscitation.aspirationRiskAssessment;
    return {
      cuesReviewedAtTick: assessment?.cuesReviewedAtTick ?? null,
      classification: assessment?.classification ?? null,
      plan: assessment?.plan ?? null,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = aspirationRiskDemonstrationStep(progress());
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

describe('Requirement: The Aspiration Example Argues From The Patient', () => {
  const fresh = runExample();
  // Handed a case where someone has already reviewed the cues.
  const handover = runExample(FIXTURES.commonError.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(ASPIRATION_RISK_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAspirationRiskDemonstration(SCENARIO)).toBe(true);
    expect(supportsAspirationRiskDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The module's other ordered decision vignette, with the same action shape.
    expect(supportsAspirationRiskDemonstration(EMERGENCE_WITH_RESIDUAL_BLOCKADE)).toBe(false);
    expect(supportsAspirationRiskDemonstration(ROUTINE_INDUCTION)).toBe(false);
  });

  it('advances every beat on recorded steps, in order, to a disposition', () => {
    expect(fresh.beats).toEqual(['review', 'classify', 'defer']);
    expect(fresh.progress().classification).toBe('elevated');
    expect(fresh.progress().plan).toBe('defer-and-replan');
    expect(fresh.events.filter((event) => event.eventId.includes('refused'))).toHaveLength(0);
  });

  it('reviews the cues together, and says why one at a time fails', () => {
    const review = fresh.narrations[0]!;
    expect(review).toContain('three of the four look reassuring in isolation');
    expect(review).toContain('It is not the question');
  });

  it('names the two cues that carry the argument, not all four', () => {
    const classify = fresh.narrations[fresh.beats.indexOf('classify')]!;
    expect(classify).toContain('Not because of the drug');
    expect(classify).toContain('either one alone would be a weaker argument');
  });

  it('names the fact that makes this decision easy, and when it would not be', () => {
    const defer = fresh.narrations[fresh.beats.indexOf('defer')]!;
    expect(defer).toContain('this lesson does not model that one');
  });

  it('states the fourth objective in both directions', () => {
    // A blanket rule reaches the right disposition here for the wrong reason,
    // and delays stable asymptomatic patients for nothing.
    expect(fresh.closing).toContain('no single click earns');
    expect(fresh.closing).toContain('would reach the same disposition and fail it');
    expect(fresh.closing).toContain('The argument runs the other way too');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('picks up a case whose cues someone else reviewed', () => {
    expect(handover.beats[0]).toBe('classify');
    expect(handover.beats).not.toContain('review');
    expect(handover.progress().plan).toBe('defer-and-replan');
    expect(handover.events.filter((event) => event.eventId.includes('refused'))).toHaveLength(0);
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['she did well', 'she recovered', 'she was fine', 'she aspirated',
      'no harm came', 'she survived', 'the operation went']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = aspirationRiskDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
