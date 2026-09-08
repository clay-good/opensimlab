/**
 * The anaesthesia module's seventeenth observed-state worked example, driven
 * through the real engine, and its longest at five beats — each gated on the
 * previous step's tick being recorded, which is the shape the engine's own order
 * enforcement produces for free.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { DELAYED_EMERGENCE_DIFFERENTIAL as SCENARIO } from '@anesthesia/scenarios/delayed-emergence-differential';
import { EMERGENCE_WITH_RESIDUAL_BLOCKADE } from '@anesthesia/scenarios/emergence-with-residual-blockade';
import { ASPIRATION_RISK_RECOGNITION } from '@anesthesia/scenarios/aspiration-risk-recognition';
import { DELAYED_EMERGENCE_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/delayed-emergence-differential-fixtures';
import {
  DELAYED_EMERGENCE_DEMONSTRATION_VERSION, delayedEmergenceDemonstrationStep,
  supportsDelayedEmergenceDemonstration, type DelayedEmergenceProgress,
} from '@anesthesia/demo/delayed-emergence-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 6_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sidecar. */
  const progress = (): DelayedEmergenceProgress => {
    const assessment = engine.equipment().resuscitation.delayedEmergenceAssessment;
    return {
      supportReviewedAtTick: assessment?.supportReviewedAtTick ?? null,
      exposureReviewedAtTick: assessment?.exposureReviewedAtTick ?? null,
      metabolicReviewedAtTick: assessment?.metabolicReviewedAtTick ?? null,
      neurologicExamAtTick: assessment?.neurologicExamAtTick ?? null,
      escalation: assessment?.escalation ?? null,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = delayedEmergenceDemonstrationStep(progress());
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

describe('Requirement: The Delayed-Emergence Example Argues For Its Order', () => {
  const fresh = runExample();
  // Handed the error path: two out-of-turn attempts the engine already refused.
  const handover = runExample(FIXTURES.commonError);

  it('binds to this exact scenario version and no other', () => {
    expect(DELAYED_EMERGENCE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsDelayedEmergenceDemonstration(SCENARIO)).toBe(true);
    expect(supportsDelayedEmergenceDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The module's other two ordered decision vignettes.
    expect(supportsDelayedEmergenceDemonstration(EMERGENCE_WITH_RESIDUAL_BLOCKADE)).toBe(false);
    expect(supportsDelayedEmergenceDemonstration(ASPIRATION_RISK_RECOGNITION)).toBe(false);
  });

  it('advances every beat on recorded steps, in order, to an escalation', () => {
    expect(fresh.beats).toEqual(['support', 'exposures', 'metabolic', 'examine', 'escalate']);
    expect(fresh.progress().escalation).toBe('urgent-neurologic-evaluation');
    expect(fresh.events.filter((event) => event.eventId.includes('refused'))).toHaveLength(0);
  });

  it('supports before it theorises, and says the order is enforced', () => {
    expect(fresh.beats[0]).toBe('support');
    expect(fresh.narrations[0]!).toContain('before anyone starts theorising');
    expect(fresh.narrations[0]!).toContain('unavoidable rather than merely recommended');
  });

  it('excludes the common cause before the rare one', () => {
    expect(fresh.beats.indexOf('exposures')).toBeLessThan(fresh.beats.indexOf('examine'));
    const exposures = fresh.narrations[fresh.beats.indexOf('exposures')]!;
    expect(exposures).toContain('commonest reason a patient has not woken');
  });

  it('argues that a negative finding is not a wasted step', () => {
    const metabolic = fresh.narrations[fresh.beats.indexOf('metabolic')]!;
    expect(metabolic).toContain('a negative here is not a wasted step');
    const examine = fresh.narrations[fresh.beats.indexOf('examine')]!;
    expect(examine).toContain('only interpretable now');
  });

  it('names the wrong alternative honestly rather than omitting it', () => {
    const escalate = fresh.narrations[fresh.beats.indexOf('escalate')]!;
    expect(escalate).toContain('comfortable, defensible-sounding, and — with a new lateralizing sign');
    expect(escalate).toContain('scores four of these five objectives');
  });

  it('closes on the sequence rather than on the answer', () => {
    expect(fresh.closing).toContain('three of those four steps found nothing wrong');
    expect(fresh.closing).toContain('with nothing to weigh them against');
    expect(fresh.closing).toContain('does not name a diagnosis');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('picks up a case whose out-of-turn attempts were refused', () => {
    // It starts at the beginning, because nothing the learner did was recorded.
    expect(handover.beats).toEqual(['support', 'exposures', 'metabolic', 'examine', 'escalate']);
    expect(handover.progress().escalation).toBe('urgent-neurologic-evaluation');
    // Both refusals in this run are the learner's, from before the handover: the
    // opening reaches for the examination AND the escalation, and neither is
    // recorded, which is why the example has to start from the beginning.
    expect(handover.events.filter((event) => event.eventId.includes('refused'))).toHaveLength(2);
  });

  it('never predicts an outcome or names a diagnosis', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['she had a stroke', 'she did well', 'she recovered', 'she was fine',
      'no harm came', 'she survived', 'the diagnosis is']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = delayedEmergenceDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
