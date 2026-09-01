/**
 * The worked example and observed-state tutor for a plan that was not said.
 *
 * Nothing in this lesson is missing. The contingency was written yesterday and
 * every part of it is recoverable, so neither may ask anyone to remember what
 * was said or write a plan of its own — either replaces a recoverable record
 * with a reconstruction from memory, which is the failure one step along.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { LOST_CONTINGENCY_A_PLAN_THAT_WAS_NOT_SAID as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/lost-contingency-a-plan-that-was-not-said';
import { LOST_CONTINGENCY_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/lost-contingency-fixtures';
import {
  LOST_CONTINGENCY_DEMONSTRATION_VERSION, lostContingencyDemonstrationStep,
  supportsLostContingencyDemonstration,
} from '../../src/modules/medical-surgical-nursing/demo/lost-contingency-demonstration';
import { lostContingencyInlinePrompt } from '../../src/modules/medical-surgical-nursing/lost-contingency-tutor';
import type { LostContingencyAction } from '../../src/modules/medical-surgical-nursing/lost-contingency';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.lostContingency;
const advance = (engine: AnesthesiaEngine, tick: number, action: LostContingencyAction) => {
  engine.apply({ tick, type: 'lost-contingency-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = lostContingencyDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'lost-contingency-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Rescues Nothing', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(LOST_CONTINGENCY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsLostContingencyDemonstration(SCENARIO)).toBe(true);
    expect(supportsLostContingencyDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats.slice(0, 8)).toEqual(['spoken', 'notes', 'gap', 'reconstruct',
      'consequences', 'confirm', 'boundaries', 'monitor']);
    expect(beats.at(-1)).toBe('handoff');
    expect(patient.ended).toBe('handoff');
  });

  it('records what was said before reading the notes', () => {
    expect(patient.spokenRecordedAtTick).toBeLessThan(patient.notesCheckedAtTick!);
    expect(patient.gapRecordedAtTick).toBeLessThan(patient.reconstructedAtTick!);
    expect(narrations[0]).toContain('no record of its own');
  });

  it('reconstructs from the record rather than from anyone’s memory', () => {
    expect(patient.memoryAskedFor).toBe(false);
    expect(patient.contingencyInTheRecord).toBe(true);
    expect(patient.contingencyWasSpoken).toBe(false);
    expect(patient.contingencyReconstructed).not.toBeNull();
    expect(narrations[beats.indexOf('reconstruct')]).toContain('in the surgical team’s words');
  });

  it('ends without anything having been rescued', () => {
    expect(narration).toContain('nothing was ever lost');
    expect(narrations[beats.indexOf('consequences')]).toContain('who knew, and for how long');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.nothingSaidReadAsNothingApplies).toBe(false);
    expect(patient.memoryAskedFor).toBe(false);
  });
});

describe('Requirement: The Tutor Sends You To The Record', () => {
  it('opens on writing down what was said', () => {
    const engine = create(); engine.step();
    const prompt = lostContingencyInlinePrompt('guided', { scenarioVersion: '0.1.0', lostContingency: snapshot(engine) })!;
    expect(prompt.id).toBe('lost-contingency-spoken');
    expect(prompt.because).toContain('no record of its own');
  });

  it('never asks for a recollection or a plan of the learner’s own', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = lostContingencyInlinePrompt('guided', { scenarioVersion: '0.1.0', lostContingency: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['ask the day nurse', 'write your own plan', 'nothing applies', 'a quiet handover means']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds the waiting beat when coached', () => {
    const engine = create();
    for (const action of ['record-what-was-said', 'check-the-notes', 'record-the-gap-as-a-transmission-gap',
      'reconstruct-the-contingency', 'record-what-the-gap-changes', 'confirm-the-plan-with-the-team',
      'review-boundaries', 'monitor'] as const) {
      advance(engine, 0, action);
    }
    const patient = snapshot(engine);
    expect(lostContingencyInlinePrompt('guided', { scenarioVersion: '0.1.0', lostContingency: patient })!.id)
      .toBe('lost-contingency-await');
    expect(lostContingencyInlinePrompt('coached', { scenarioVersion: '0.1.0', lostContingency: patient })).toBeNull();
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(lostContingencyInlinePrompt('unassisted', { scenarioVersion: '0.1.0', lostContingency: patient })).toBeNull();
    expect(lostContingencyInlinePrompt('guided', { scenarioVersion: '0.1.1', lostContingency: patient })).toBeNull();
  });
});
