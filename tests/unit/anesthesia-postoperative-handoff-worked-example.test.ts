/**
 * The anaesthesia module's nineteenth observed-state worked example, driven
 * through the real engine.
 *
 * The longest at six beats, the fifth to read an assessment sidecar, and the
 * only one whose subject is a conversation. Every beat is gated on the recorded
 * tick of the step before it, so it resumes from wherever a learner stopped and
 * no gate can reverse — a recorded step never becomes unrecorded.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { POSTOPERATIVE_HANDOFF as SCENARIO } from '@anesthesia/scenarios/postoperative-handoff';
import { BLOOD_BANK_HANDOFF } from '@anesthesia/scenarios/blood-bank-handoff';
import { POSTOPERATIVE_HANDOFF_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/postoperative-handoff-fixtures';
import {
  POSTOPERATIVE_HANDOFF_DEMONSTRATION_VERSION, postoperativeHandoffDemonstrationStep,
  supportsPostoperativeHandoffDemonstration, type PostoperativeHandoffProgress,
} from '@anesthesia/demo/postoperative-handoff-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 6_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same source. */
  const progress = (): PostoperativeHandoffProgress =>
    (engine.equipment().resuscitation as Readonly<Record<string, unknown>>)
      .postoperativeHandoffAssessment as PostoperativeHandoffProgress;
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = postoperativeHandoffDemonstrationStep(progress());
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

describe('Requirement: The Handoff Example Closes The Loop Before It Transfers', () => {
  const fresh = runExample();
  // A learner who confirmed readiness and shared the course, then handed back.
  const handover = runExample(FIXTURES.expert.slice(0, 2));

  it('binds to this exact scenario version and no other', () => {
    expect(POSTOPERATIVE_HANDOFF_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPostoperativeHandoffDemonstration(SCENARIO)).toBe(true);
    expect(supportsPostoperativeHandoffDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The module's other handoff lesson, which this must never answer for.
    expect(supportsPostoperativeHandoffDemonstration(BLOOD_BANK_HANDOFF)).toBe(false);
  });

  it('advances every beat on the recorded steps, in the enforced order', () => {
    expect(fresh.beats).toEqual([
      'readiness', 'course', 'current-state', 'risks', 'readback', 'accept',
    ]);
    const recorded = fresh.progress();
    expect(recorded.transferAcceptedAtTick).not.toBeNull();
    expect(recorded.receiverReadbackAtTick!).toBeLessThan(recorded.transferAcceptedAtTick!);
    // Nothing the example does is ever refused, because it never jumps a step.
    expect(fresh.events.filter((event) => event.eventId.includes('refused'))).toHaveLength(0);
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('current-state');
    expect(handover.beats).not.toContain('readiness');
    expect(handover.progress().transferAcceptedAtTick).not.toBeNull();
  });

  it('confirms the room is listening before saying anything worth hearing', () => {
    const first = fresh.narrations[fresh.beats.indexOf('readiness')]!;
    expect(first).toContain('a room that is not listening');
  });

  it('names the read-back as the step that feels redundant and is not', () => {
    const readback = fresh.narrations[fresh.beats.indexOf('readback')]!;
    expect(readback).toContain('silent receipt is not the same as understanding');
    expect(readback).toContain('refuse an acceptance without it');
    // And the acceptance is its own act, not a consequence of finishing talking.
    expect(fresh.narrations[fresh.beats.indexOf('accept')]!)
      .toContain('responsibility changes hands');
  });

  it('declines the credit its own demonstration would take', () => {
    // The honest closing. Every step can be satisfied by a bad handoff, because
    // what this model records is that blocks were shared, never that they landed.
    expect(fresh.closing).toContain('three of the four objectives met, and nothing actually transferred');
    expect(fresh.closing).toContain('cannot record that anyone understood anything');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['she did well', 'she recovered', 'she was fine', 'the operation went',
      'no harm came', 'she survived']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = postoperativeHandoffDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
