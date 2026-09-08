/**
 * The anaesthesia module's twelfth observed-state worked example, driven through
 * the real engine.
 *
 * It is the only one that has to CAUSE the crisis it then treats. The trigger is
 * latent — rigidity appears on genuine end-tidal volatile exposure rather than at
 * a scheduled tick — so an example that skipped the maintenance beat would sit
 * in an uneventful anaesthetic forever with nothing to demonstrate.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { EARLY_MALIGNANT_HYPERTHERMIA_DURING_VOLATILE_ANESTHESIA as SCENARIO } from '@anesthesia/scenarios/early-malignant-hyperthermia-during-volatile-anesthesia';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY } from '@anesthesia/scenarios/local-anesthetic-systemic-toxicity';
import { EARLY_MH_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/early-malignant-hyperthermia-fixtures';
import {
  MALIGNANT_HYPERTHERMIA_DEMONSTRATION_VERSION, malignantHyperthermiaDemonstrationStep,
  supportsMalignantHyperthermiaDemonstration, type MalignantHyperthermiaProgress,
} from '@anesthesia/demo/malignant-hyperthermia-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 14_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): MalignantHyperthermiaProgress => {
    const equipment = engine.equipment();
    const state = frame.state as Readonly<Record<string, number>>;
    return {
      sevofluranePercent: equipment.ventilator.sevofluranePercent ?? 0,
      inspiredOxygenFraction: equipment.ventilator.fio2,
      freshGasFlowLPerMin: equipment.ventilator.freshGasFlowLPerMin ?? 0,
      tidalVolumeMl: equipment.ventilator.tidalVolumeMl,
      respiratoryRateBpm: equipment.ventilator.respiratoryRateBpm,
      ventilatorDelivering: equipment.ventilator.delivering,
      muscleRigidityFraction: state.muscleRigidityFraction ?? 0,
      etco2MmHg: state.etco2MmHg ?? 0,
      coreTemperatureC: state.coreTemperatureC ?? 0,
      dantroleneTotalMg: equipment.resuscitation.dantroleneTotalMg,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = malignantHyperthermiaDemonstrationStep(progress());
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

describe('Requirement: The MH Example Causes The Crisis It Treats', () => {
  const fresh = runExample();
  // Handed a case where someone else already started the volatile maintenance.
  const handover = runExample(FIXTURES.commonError);

  it('binds to this exact scenario version and no other', () => {
    expect(MALIGNANT_HYPERTHERMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMalignantHyperthermiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsMalignantHyperthermiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The other lesson with a bounded single-dose rescue drug.
    expect(supportsMalignantHyperthermiaDemonstration(LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY)).toBe(false);
    expect(supportsMalignantHyperthermiaDemonstration(ROUTINE_INDUCTION)).toBe(false);
  });

  it('starts the volatile itself, because the trigger is latent', () => {
    // Without this beat there is no crisis to demonstrate at all.
    expect(fresh.beats).toEqual(['induce', 'maintaining', 'rescue', 'dantrolene']);
    expect(fresh.narrations[0]!).toContain('the beat that causes what follows');
    expect(fresh.progress().dantroleneTotalMg).toBeGreaterThan(0);
    expect(fresh.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
  });

  it('names the divergence that moves before the temperature does', () => {
    const maintaining = fresh.narrations[fresh.beats.indexOf('maintaining')]!;
    expect(maintaining).toContain('is also, in this patient, the trigger');
    expect(maintaining).toContain('before the temperature does');
  });

  it('changes four machine settings at once, and says why the vaporizer alone is not enough', () => {
    const rescue = fresh.narrations[fresh.beats.indexOf('rescue')]!;
    expect(rescue).toContain('the objective reads all four');
    expect(rescue).toContain('the flow is what washes it out');
    const ventilator = fresh.engine.equipment().ventilator;
    expect(ventilator.sevofluranePercent).toBe(0);
    expect(ventilator.freshGasFlowLPerMin).toBeGreaterThanOrEqual(10);
    expect(ventilator.tidalVolumeMl * ventilator.respiratoryRateBpm).toBeGreaterThanOrEqual(12_000);
  });

  it('gives dantrolene on a pattern rather than a diagnosis', () => {
    const dantrolene = fresh.narrations[fresh.beats.indexOf('dantrolene')]!;
    expect(dantrolene).toContain('on a pattern rather than on a diagnosis');
    expect(dantrolene).toContain('teaching bound rather than a dosing claim');
  });

  it('argues with its own temperature reading, and with its own reassessment', () => {
    expect(fresh.closing).toContain('waiting for a fever');
    expect(fresh.closing).toContain('very little to reverse');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('picks up a case whose volatile someone else started', () => {
    expect(handover.beats[0]).toBe('maintaining');
    expect(handover.beats).not.toContain('induce');
    expect(handover.progress().dantroleneTotalMg).toBeGreaterThan(0);
    expect(handover.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'he recovered', 'he was fine', 'the operation went',
      'no harm came', 'he survived', 'the crisis is over']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = malignantHyperthermiaDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
