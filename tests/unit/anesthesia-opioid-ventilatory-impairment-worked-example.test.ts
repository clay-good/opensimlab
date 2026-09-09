/**
 * The anaesthesia module's twenty-second observed-state worked example, driven
 * through the real engine.
 *
 * It gates on latched ticks and on whether the machine is delivering, and never
 * on the saturation — which is both the lesson's point and a practical
 * necessity, since the saturation reads 100% whether the patient is supported or
 * merely receiving oxygen while breathing four times a minute.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { OPIOID_INDUCED_VENTILATORY_IMPAIRMENT as SCENARIO } from '@anesthesia/scenarios/opioid-induced-ventilatory-impairment';
import { RAPID_DESATURATION } from '@anesthesia/scenarios/rapid-desaturation';
import { OPIOID_INDUCED_VENTILATORY_IMPAIRMENT_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/opioid-induced-ventilatory-impairment-fixtures';
import {
  OPIOID_VENTILATORY_IMPAIRMENT_DEMONSTRATION_VERSION,
  opioidVentilatoryImpairmentDemonstrationStep,
  supportsOpioidVentilatoryImpairmentDemonstration,
  type OpioidVentilatoryImpairmentProgress,
} from '@anesthesia/demo/opioid-ventilatory-impairment-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 6_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): OpioidVentilatoryImpairmentProgress => {
    const equipment = engine.equipment();
    const resuscitation = equipment.resuscitation.opioidVentilatoryResponse;
    const state = frame.state as Readonly<Record<string, number>>;
    return {
      severity: resuscitation?.severity ?? 0,
      helpRequestedAtTick: equipment.airway.helpRequestedAtTick ?? null,
      ventilatorDelivering: equipment.ventilator.delivering,
      inspiredOxygenFraction: equipment.ventilator.fio2,
      furtherOpioidHeldAtTick: resuscitation?.furtherOpioidHeldAtTick ?? null,
      naloxoneIntentAtTick: resuscitation?.naloxoneIntentAtTick ?? null,
      respiratoryRateBpm: state.respiratoryRateBpm ?? 0,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = opioidVentilatoryImpairmentDemonstrationStep(progress());
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

describe('Requirement: The Opioid Example Never Reads The Saturation', () => {
  const fresh = runExample();
  // A learner who called for help and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(OPIOID_VENTILATORY_IMPAIRMENT_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsOpioidVentilatoryImpairmentDemonstration(SCENARIO)).toBe(true);
    expect(supportsOpioidVentilatoryImpairmentDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsOpioidVentilatoryImpairmentDemonstration(RAPID_DESATURATION)).toBe(false);
  });

  it('advances every beat on observed state, in order', () => {
    expect(fresh.beats).toEqual(['watching', 'recognize', 'support', 'hold', 'reversal', 'wean']);
    const recorded = fresh.progress();
    expect(recorded.helpRequestedAtTick).not.toBeNull();
    expect(recorded.furtherOpioidHeldAtTick).not.toBeNull();
    expect(recorded.naloxoneIntentAtTick).not.toBeNull();
    expect(recorded.ventilatorDelivering).toBe(false);
    // It never reaches for reversal before the hold, so nothing is refused.
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('naloxone-order-refused-'))).toHaveLength(0);
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('support');
    expect(handover.beats).not.toContain('watching');
    expect(handover.beats).not.toContain('recognize');
    expect(handover.progress().naloxoneIntentAtTick).not.toBeNull();
  });

  it('waits for the pattern instead of acting before there is one', () => {
    // Every objective is timed FROM the scripted onset, so a help request made
    // before it is not merely early — the rubric does not see it at all.
    const watching = fresh.narrations[fresh.beats.indexOf('watching')]!;
    expect(watching).toContain('acting before there is anything to act on records nothing at all');
    expect(fresh.beats.indexOf('watching')).toBe(0);
  });

  it('escalates before the saturation moves, and says why', () => {
    const recognize = fresh.narrations[fresh.beats.indexOf('recognize')]!;
    expect(recognize).toContain('the objective allows 30 seconds');
    expect(recognize).toContain('the last thing to move and the first thing to be believed');
  });

  it('distinguishes delivering breaths from supplying oxygen', () => {
    const support = fresh.narrations[fresh.beats.indexOf('support')]!;
    expect(support).toContain('breaths are being DELIVERED, not just oxygen being supplied');
    expect(support).toContain('treats the number rather than the patient');
    expect(fresh.engine.equipment().ventilator.fio2).toBe(1);
  });

  it('stops the cause before reaching for the antidote', () => {
    const hold = fresh.narrations[fresh.beats.indexOf('hold')]!;
    expect(hold).toContain('Stopping the cause is not a smaller intervention than treating it');
    // And the reversal beat refuses to present intent as an ending.
    expect(fresh.narrations[fresh.beats.indexOf('reversal')]!)
      .toContain('the beginning of a monitoring problem rather than the end of one');
  });

  it('treats the wean as a measurement rather than a discharge', () => {
    const wean = fresh.narrations[fresh.beats.indexOf('wean')]!;
    expect(wean).toContain('This is a measurement rather than a discharge');
    expect(wean).toContain('any one of them alone is the mistake this lesson is about');
  });

  it('declines the credit its own demonstration would take', () => {
    // The honest closing: it reports the error path's BETTER saturation beside
    // the no-action path's worse one, and names what it cannot simulate.
    expect(fresh.closing).toContain('the run that does NOTHING reads 96%');
    expect(fresh.closing).toContain('made the monitored number better and the patient no safer');
    expect(fresh.closing).toContain('the reassurance is manufactured by the intervention');
    expect(fresh.closing).toContain('recurrent depression after a short-acting reversal');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'he recovered fully', 'he was fine',
      'no harm came', 'he survived', 'woke up comfortable']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = opioidVentilatoryImpairmentDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
