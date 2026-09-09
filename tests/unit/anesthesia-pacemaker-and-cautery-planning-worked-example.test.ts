/**
 * The anaesthesia module's twentieth observed-state worked example, driven
 * through the real engine.
 *
 * The sixth to read an assessment sidecar, and the first to gate on a field that
 * holds a choice rather than a tick. It waits for the plan to be RECORDED rather
 * than for the right plan, because a plan cannot be replaced and a beat waiting
 * for the correct one would never fire after a wrong one.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PACEMAKER_AND_CAUTERY_PLANNING as SCENARIO } from '@anesthesia/scenarios/pacemaker-and-cautery-planning';
import { POSTOPERATIVE_HANDOFF } from '@anesthesia/scenarios/postoperative-handoff';
import { PACEMAKER_AND_CAUTERY_PLANNING_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/pacemaker-and-cautery-planning-fixtures';
import {
  PACEMAKER_AND_CAUTERY_PLANNING_DEMONSTRATION_VERSION,
  pacemakerAndCauteryPlanningDemonstrationStep,
  supportsPacemakerAndCauteryPlanningDemonstration,
  type PacemakerAndCauteryPlanningProgress,
} from '@anesthesia/demo/pacemaker-and-cautery-planning-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 6_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same source. */
  const progress = (): PacemakerAndCauteryPlanningProgress =>
    (engine.equipment().resuscitation as Readonly<Record<string, unknown>>)
      .ciedPlanningAssessment as PacemakerAndCauteryPlanningProgress;
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = pacemakerAndCauteryPlanningDemonstrationStep(progress());
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

describe('Requirement: The CIED Example Plans Once And Says So', () => {
  const fresh = runExample();
  // A learner who read the device record and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(PACEMAKER_AND_CAUTERY_PLANNING_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPacemakerAndCauteryPlanningDemonstration(SCENARIO)).toBe(true);
    expect(supportsPacemakerAndCauteryPlanningDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The module's other bounded planning conversation.
    expect(supportsPacemakerAndCauteryPlanningDemonstration(POSTOPERATIVE_HANDOFF)).toBe(false);
  });

  it('advances every beat on the recorded steps, in the enforced order', () => {
    expect(fresh.beats).toEqual(['device', 'procedure', 'plan', 'document']);
    expect(fresh.progress().plan).toBe('coordinate-asynchronous-pacing');
    expect(fresh.progress().backupAndRestorationDocumentedAtTick).not.toBeNull();
    // The example never plans before reading, so it is never refused.
    expect(fresh.events.filter((event) => event.eventId.includes('refused'))).toHaveLength(0);
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('procedure');
    expect(handover.beats).not.toContain('device');
    expect(handover.progress().plan).toBe('coordinate-asynchronous-pacing');
  });

  it('reads pacing dependence before it reads the operation', () => {
    const device = fresh.narrations[fresh.beats.indexOf('device')]!;
    expect(device).toContain('before anything about the operation');
    expect(device).toContain('not something to discover once the drapes are on');
  });

  it('gives the reasoning rather than the answer on the plan beat', () => {
    const planBeat = fresh.narrations[fresh.beats.indexOf('plan')]!;
    expect(planBeat).toContain('pacing dependent');
    expect(planBeat).toContain('above the umbilicus');
    // The whole point: a documented magnet response is not a universal rule.
    expect(planBeat).toContain('documentation is not a universal rule');
    expect(planBeat).toContain('this attempt records one plan');
  });

  it('names the half of the restoration that gets left off', () => {
    const document = fresh.narrations[fresh.beats.indexOf('document')]!;
    expect(document).toContain('before this patient leaves monitored care');
    expect(document).toContain('a plan that was never finished');
  });

  it('declines the credit its own demonstration would take', () => {
    // The honest closing: it reports the exact scoring of the path it did NOT
    // take, including the documentation that is done and not credited.
    expect(fresh.closing).toContain('met, met, not met, NOT met');
    expect(fresh.closing).toContain('the engine records one plan per attempt');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['did well', 'recovered uneventfully', 'was fine', 'the operation went',
      'no harm came', 'survived']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = pacemakerAndCauteryPlanningDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
