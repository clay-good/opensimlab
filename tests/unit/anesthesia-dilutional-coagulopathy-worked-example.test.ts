/**
 * The anaesthesia module's eighth observed-state worked example, driven through
 * the real engine.
 *
 * It is the first that needs something the equipment snapshot does not carry.
 * Ordering a coagulation panel changes no modelled state at all, so a second
 * panel is invisible to every field on the snapshot; the count of accepted
 * panels comes from the session's event log instead. This file drives the
 * example with that count assembled exactly as the cockpit assembles it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { DILUTIONAL_COAGULOPATHY as SCENARIO } from '@anesthesia/scenarios/dilutional-coagulopathy';
import { UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE } from '@anesthesia/scenarios/unexpected-intraoperative-hemorrhage';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { DILUTIONAL_COAGULOPATHY_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/dilutional-coagulopathy-fixtures';
import {
  DILUTIONAL_COAGULOPATHY_DEMONSTRATION_VERSION, dilutionalCoagulopathyDemonstrationStep,
  supportsDilutionalCoagulopathyDemonstration, type DilutionalCoagulopathyProgress,
} from '@anesthesia/demo/dilutional-coagulopathy-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 8_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const log: EngineEvent[] = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same two sources. */
  const progress = (): DilutionalCoagulopathyProgress => {
    const equipment = engine.equipment();
    const state = frame.state as Readonly<Record<string, number>>;
    return {
      coagulationPanelCount: log
        .filter((entry) => entry.eventId.startsWith('coagulation-labs-')).length,
      bloodProductsReleased: equipment.resuscitation.bloodProductsReleased === true,
      freshFrozenPlasmaUnits: equipment.resuscitation.freshFrozenPlasmaUnits ?? 0,
      prothrombinTimeRatio: state.prothrombinTimeRatio ?? 1,
      fibrinogenGPerL: state.fibrinogenGPerL ?? 3,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); log.push(...frame.events); continue; }
    const step = dilutionalCoagulopathyDemonstrationStep(progress());
    if (step.finished) {
      return { beats, narrations, log, closing: step.narration, engine, tick };
    }
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.dispatch && !submitted.has(step.id)) {
      submitted.add(step.id);
      engine.apply({ tick, ...step.dispatch });
    }
    frame = engine.step();
    log.push(...frame.events);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Coagulopathy Example Counts Its Own Panels', () => {
  const fresh = runExample();
  // Handed the error path's opening: a blood-bank request and a plasma attempt
  // the engine refused, with no panel yet ordered.
  const handover = runExample(FIXTURES.commonError.slice(0, 2));

  it('binds to this exact scenario version and no other', () => {
    expect(DILUTIONAL_COAGULOPATHY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsDilutionalCoagulopathyDemonstration(SCENARIO)).toBe(true);
    expect(supportsDilutionalCoagulopathyDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The lesson this one is the sequel to shares the blood-bank workflow.
    expect(supportsDilutionalCoagulopathyDemonstration(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE)).toBe(false);
    expect(supportsDilutionalCoagulopathyDemonstration(ROUTINE_INDUCTION)).toBe(false);
  });

  it('advances every beat on physiology, in order, to a repeat panel', () => {
    expect(fresh.beats).toEqual(['panel', 'blood-bank', 'plasma', 'recheck']);
    expect(fresh.log.filter((entry) => entry.eventId.startsWith('coagulation-labs-'))).toHaveLength(2);
    expect(fresh.engine.equipment().resuscitation.freshFrozenPlasmaUnits).toBe(4);
    expect(fresh.log.filter((entry) => entry.eventId.startsWith('bad-'))).toHaveLength(0);
  });

  it('asks before it treats, which is the whole argument', () => {
    expect(fresh.beats.indexOf('panel')).toBeLessThan(fresh.beats.indexOf('plasma'));
    const panel = fresh.narrations[fresh.beats.indexOf('panel')]!;
    expect(panel).toContain('oozing everywhere rather than bleeding from somewhere');
    // And it warns that the cockpit enforces this rather than merely scoring it.
    expect(panel).toContain('this cockpit will simply refuse');
  });

  it('rechecks rather than assuming, and says why that is easy to skip', () => {
    const recheck = fresh.narrations[fresh.beats.indexOf('recheck')]!;
    expect(recheck).toContain('rather than assuming the plasma worked');
    expect(recheck).toContain('Ordering it changes nothing about the patient');
  });

  it('does not sequence on a number that moves the instant plasma is given', () => {
    // The prothrombin ratio and the fibrinogen both change in the instant the
    // plasma is accepted, so gating on either would let the example skip the
    // recheck it exists to demonstrate. Only monotone counts order the beats.
    const beforeRecheck = fresh.beats.indexOf('plasma');
    expect(beforeRecheck).toBeGreaterThan(-1);
    expect(fresh.beats.indexOf('recheck')).toBe(beforeRecheck + 1);
  });

  it('reads the repeat panel as a direction rather than a destination', () => {
    expect(fresh.closing).toContain('a direction rather than as a destination');
    expect(fresh.closing).toContain('is not normal');
    expect(fresh.closing).toContain('not a massive-transfusion protocol');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('names the decision that was made before the learner arrived', () => {
    expect(fresh.closing).toContain('replaced predominantly with crystalloid');
    expect(fresh.closing).toContain('this panel is the bill for it');
  });

  it('picks up a case whose plasma request was already refused', () => {
    // It does not repeat the refused action; it orders the panel that unblocks
    // it, because it reads the panel count rather than a list of its own clicks.
    expect(handover.beats[0]).toBe('panel');
    expect(handover.beats).not.toContain('blood-bank');
    expect(handover.engine.equipment().resuscitation.freshFrozenPlasmaUnits).toBe(4);
    // The one refusal in this run is the learner's, from before the handover.
    const refusals = handover.log.filter((entry) => entry.eventId.startsWith('bad-'));
    expect(refusals).toHaveLength(1);
    expect(refusals[0]!.tick).toBe(700);
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['she did well', 'she recovered', 'she was fine', 'the operation went',
      'no harm came', 'she survived', 'the coagulopathy is corrected']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = dilutionalCoagulopathyDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
