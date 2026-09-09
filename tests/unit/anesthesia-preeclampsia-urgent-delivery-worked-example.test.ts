/**
 * The anaesthesia module's twenty-first observed-state worked example, driven
 * through the real engine.
 *
 * Every quantity it gates on only rises — a count of accepted pressure checks
 * and two cumulative doses — because the pressure itself is not monotone once
 * labetalol is given, and a beat keyed on it would walk backwards.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PREECLAMPSIA_URGENT_DELIVERY as SCENARIO } from '@anesthesia/scenarios/preeclampsia-urgent-delivery';
import { OBSTETRIC_GENERAL_ANESTHESIA } from '@anesthesia/scenarios/obstetric-general-anesthesia';
import { PREECLAMPSIA_URGENT_DELIVERY_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/preeclampsia-urgent-delivery-fixtures';
import {
  PREECLAMPSIA_URGENT_DELIVERY_DEMONSTRATION_VERSION,
  preeclampsiaUrgentDeliveryDemonstrationStep,
  supportsPreeclampsiaUrgentDeliveryDemonstration,
  type PreeclampsiaUrgentDeliveryProgress,
} from '@anesthesia/demo/preeclampsia-urgent-delivery-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 12_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): PreeclampsiaUrgentDeliveryProgress => {
    const resuscitation = engine.equipment().resuscitation;
    const state = frame.state as Readonly<Record<string, number>>;
    return {
      bloodPressureChecks: resuscitation.preeclampsiaBloodPressureChecks ?? 0,
      labetalolTotalMg: resuscitation.labetalolTotalMg ?? 0,
      magnesiumSulfateTotalG: resuscitation.magnesiumSulfateTotalG ?? 0,
      systolicMmHg: state.systolicMmHg ?? 0,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = preeclampsiaUrgentDeliveryDemonstrationStep(progress());
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

describe('Requirement: The Preeclampsia Example Separates The Two Drugs', () => {
  const fresh = runExample();
  // A learner who confirmed the pressure and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(PREECLAMPSIA_URGENT_DELIVERY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPreeclampsiaUrgentDeliveryDemonstration(SCENARIO)).toBe(true);
    expect(supportsPreeclampsiaUrgentDeliveryDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The module's other obstetric lesson.
    expect(supportsPreeclampsiaUrgentDeliveryDemonstration(OBSTETRIC_GENERAL_ANESTHESIA)).toBe(false);
  });

  it('advances every beat on observed state, in the order the engine enforces', () => {
    expect(fresh.beats).toEqual(['confirm', 'labetalol', 'magnesium', 'reassess']);
    const recorded = fresh.progress();
    expect(recorded.bloodPressureChecks).toBe(2);
    expect(recorded.labetalolTotalMg).toBe(20);
    expect(recorded.magnesiumSulfateTotalG).toBe(4);
    // It never reaches for a drug before confirming, so nothing is withheld.
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('preeclampsia-treatment-before-confirmation-'))).toHaveLength(0);
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('labetalol');
    expect(handover.beats).not.toContain('confirm');
    expect(handover.progress().bloodPressureChecks).toBe(2);
  });

  it('confirms before treating, and says the engine enforces it', () => {
    const confirm = fresh.narrations[fresh.beats.indexOf('confirm')]!;
    expect(confirm).toContain('before either drug');
    expect(confirm).toContain('what turns a reading into an emergency is that it persists');
  });

  it('says the magnesium will not move the pressure before it fails to', () => {
    const magnesium = fresh.narrations[fresh.beats.indexOf('magnesium')]!;
    expect(magnesium).toContain('seizure prophylaxis');
    expect(magnesium).toContain('will not move the pressure at all');
    expect(magnesium).toContain('neither one covers for the other');
  });

  it('reads the follow-up pressure in both directions', () => {
    // Not "as low as possible": the target is out of the severe range.
    const reassess = fresh.narrations[fresh.beats.indexOf('reassess')]!;
    expect(reassess).toContain('not as low as possible');
    expect(reassess).toContain('the placenta is downstream');
  });

  it('declines the credit its own demonstration would take', () => {
    // The honest closing: it reports the unchanged pressure of the run it did
    // not take, names the not-exercised outcome, and refuses to present the
    // response just watched as a prediction for a person.
    expect(fresh.closing).toContain('unchanged to the digit');
    expect(fresh.closing).toContain('NOT EXERCISED');
    expect(fresh.closing).toContain('bounded teaching trajectory rather than individual pharmacokinetics');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['she did well', 'she recovered', 'she was fine', 'the baby',
      'no harm came', 'she survived', 'delivered safely']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = preeclampsiaUrgentDeliveryDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
