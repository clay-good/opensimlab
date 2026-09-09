/**
 * The anaesthesia module's twenty-third observed-state worked example, driven
 * through the real engine.
 *
 * The second to open with a beat that deliberately does nothing: every objective
 * here is timed from the scripted pleural event, and the rubric does not see an
 * action taken before it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE as SCENARIO } from '@anesthesia/scenarios/pneumothorax-under-positive-pressure';
import { RAPID_DESATURATION } from '@anesthesia/scenarios/rapid-desaturation';
import { PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/pneumothorax-under-positive-pressure-fixtures';
import {
  PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE_DEMONSTRATION_VERSION,
  pneumothoraxDemonstrationStep,
  supportsPneumothoraxUnderPositivePressureDemonstration,
  type PneumothoraxProgress,
} from '@anesthesia/demo/pneumothorax-under-positive-pressure-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 8_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): PneumothoraxProgress => {
    const equipment = engine.equipment();
    const resuscitation = equipment.resuscitation;
    return {
      severity: resuscitation.tensionPneumothoraxFraction ?? 0,
      assessedAtTick: resuscitation.pneumothoraxAssessedAtTick ?? null,
      helpRequestedAtTick: equipment.airway.helpRequestedAtTick ?? null,
      inspiredOxygenFraction: equipment.ventilator.fio2,
      ventilatorDelivering: equipment.ventilator.delivering,
      decompressedAtTick: resuscitation.pneumothoraxDecompressedAtTick ?? null,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = pneumothoraxDemonstrationStep(progress());
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

describe('Requirement: The Pneumothorax Example Names Its Own Broken Objective', () => {
  const fresh = runExample();
  // A learner who assessed the chest and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPneumothoraxUnderPositivePressureDemonstration(SCENARIO)).toBe(true);
    expect(supportsPneumothoraxUnderPositivePressureDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPneumothoraxUnderPositivePressureDemonstration(RAPID_DESATURATION)).toBe(false);
  });

  it('waits for the scripted event before acting at all', () => {
    expect(fresh.beats[0]).toBe('watching');
    expect(fresh.narrations[0]).toContain('the rubric does not see it at all');
    // Nothing is refused, because nothing is attempted while inactive.
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('pneumothorax-response-refused-'))).toHaveLength(0);
  });

  it('advances every beat on observed state, in order', () => {
    expect(fresh.beats).toEqual(['watching', 'assess', 'escalate', 'oxygen', 'decompress']);
    const recorded = fresh.progress();
    expect(recorded.assessedAtTick).not.toBeNull();
    expect(recorded.helpRequestedAtTick).not.toBeNull();
    expect(recorded.decompressedAtTick).not.toBeNull();
    expect(recorded.inspiredOxygenFraction).toBe(1);
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('escalate');
    expect(handover.beats).not.toContain('watching');
    expect(handover.progress().decompressedAtTick).not.toBeNull();
  });

  it('raises the oxygen and explicitly leaves the rate alone', () => {
    const oxygen = fresh.narrations[fresh.beats.indexOf('oxygen')]!;
    expect(oxygen).toContain('leave the rate where it is');
    expect(oxygen).toContain('Oxygen buys margin; more breaths spend it');
    expect(fresh.engine.equipment().ventilator.respiratoryRateBpm).toBe(12);
  });

  it('names decompression as the only action that treats the problem', () => {
    const decompress = fresh.narrations[fresh.beats.indexOf('decompress')]!;
    expect(decompress).toContain('the only action in the lesson that treats the problem');
    expect(decompress).toContain('diagnosis is being made by the blood pressure');
  });

  it('tells the learner the fifth objective cannot be earned', () => {
    // The honest closing. It reports the error path's one earned objective and
    // then declines to let the learner hunt for a score that does not exist.
    expect(fresh.closing).toContain('More minute ventilation is not a treatment');
    expect(fresh.closing).toContain('this model tops out at 64.71');
    expect(fresh.closing).toContain('Nothing you can do earns it');
    expect(fresh.closing).toContain('recorded in the completion evidence rather than hidden');
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
    const step = pneumothoraxDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
