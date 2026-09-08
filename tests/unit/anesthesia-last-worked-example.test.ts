/**
 * The anaesthesia module's eleventh observed-state worked example, driven
 * through the real engine.
 *
 * Its ordering problem is that the toxicity fraction and the seizure fraction
 * both FALL as the treatment works, so neither can sequence the beats. What
 * orders it instead are three quantities that only rise or latch: the running
 * lipid infusion, the accepted epinephrine micrograms, and the ventilator's own
 * delivering flag.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY as SCENARIO } from '@anesthesia/scenarios/local-anesthetic-systemic-toxicity';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { BRONCHOSPASM } from '@anesthesia/scenarios/bronchospasm';
import { LAST_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/local-anesthetic-systemic-toxicity-fixtures';
import {
  LAST_DEMONSTRATION_VERSION, lastDemonstrationStep,
  supportsLastDemonstration, type LastProgress,
} from '@anesthesia/demo/last-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 8_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): LastProgress => {
    const equipment = engine.equipment();
    const resuscitation = equipment.resuscitation;
    return {
      inspiredOxygenFraction: equipment.ventilator.fio2,
      ventilatorDelivering: equipment.ventilator.delivering,
      tidalVolumeMl: equipment.ventilator.tidalVolumeMl,
      respiratoryRateBpm: equipment.ventilator.respiratoryRateBpm,
      toxicityFraction: resuscitation.localAnestheticToxicityFraction ?? 0,
      seizureFraction: resuscitation.seizureActivityFraction ?? 0,
      lipidInfusionMlPerMin: resuscitation.lipidEmulsionInfusionMlPerMin ?? 0,
      epinephrineTotalMicrograms: resuscitation.epinephrineTotalMicrograms,
      weightKg: SCENARIO.patient.weightKg,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = lastDemonstrationStep(progress());
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

describe('Requirement: The LAST Example Sequences On What Only Rises', () => {
  const fresh = runExample();
  // Handed the error path's opening: a refused full-dose pressor and nothing else.
  const handover = runExample(FIXTURES.commonError.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(LAST_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsLastDemonstration(SCENARIO)).toBe(true);
    expect(supportsLastDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // Two other lessons with a bounded crisis tray and a call for help.
    expect(supportsLastDemonstration(BRONCHOSPASM)).toBe(false);
    expect(supportsLastDemonstration(ROUTINE_INDUCTION)).toBe(false);
  });

  it('advances every beat on physiology, in order, through the checklist', () => {
    expect(fresh.beats).toEqual(['watching', 'oxygenate', 'seizure', 'lipid', 'epinephrine']);
    expect(fresh.progress().lipidInfusionMlPerMin).toBe(15);
    expect(fresh.progress().epinephrineTotalMicrograms).toBeGreaterThan(0);
    expect(fresh.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
  });

  it('sets all four ventilator fields, and says why the dial is not enough', () => {
    const oxygenate = fresh.narrations[fresh.beats.indexOf('oxygenate')]!;
    expect(oxygenate).toContain('all four parts of it in one action');
    expect(oxygenate).toContain('different claims');
    expect(fresh.engine.equipment().ventilator.respiratoryRateBpm).toBeGreaterThan(0);
    expect(fresh.engine.equipment().ventilator.tidalVolumeMl).toBeGreaterThan(0);
  });

  it('treats the seizure as metabolic rather than neurological', () => {
    expect(fresh.beats.indexOf('seizure')).toBeLessThan(fresh.beats.indexOf('lipid'));
    const seizure = fresh.narrations[fresh.beats.indexOf('seizure')]!;
    expect(seizure).toContain('acidosis increases the free fraction');
  });

  it('never reaches for a full-dose pressor, and names the ceiling instead', () => {
    const epinephrine = fresh.narrations[fresh.beats.indexOf('epinephrine')]!;
    expect(epinephrine).toContain('under 1 microgram per kilogram');
    expect(epinephrine).toContain('is refused while the toxicity is running');
    // The dose it does give is inside the ceiling the engine enforces.
    expect(fresh.progress().epinephrineTotalMicrograms)
      .toBeLessThanOrEqual(SCENARIO.patient.weightKg);
  });

  it('closes on the order of operations rather than on a drug', () => {
    expect(fresh.closing).toContain('take the order');
    expect(fresh.closing).toContain('refuses it outright');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('picks up a case whose pressor reach was already refused', () => {
    // It does not repeat the refused action, and it does not treat the refusal
    // as a setback: it runs the checklist from where the patient actually is.
    expect(handover.beats[0]).toBe('oxygenate');
    expect(handover.beats).not.toContain('watching');
    expect(handover.progress().lipidInfusionMlPerMin).toBe(15);
    // The one refusal in this run is the learner's, from before the handover.
    const refusals = handover.events.filter((event) => event.eventId.startsWith('bad-'));
    expect(refusals).toHaveLength(1);
    expect(refusals[0]!.eventId).toContain('epinephrine');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'he recovered', 'he was fine', 'she recovered',
      'no harm came', 'survived', 'made a full recovery']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = lastDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
