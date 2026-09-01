/**
 * The worked example and observed-state tutor for the newborn who needs nothing
 * done to her.
 *
 * The pressure in this lesson runs the opposite way from a crisis: not toward a
 * missed intervention but toward an unearned conclusion. So both hold two
 * statements together — nothing needs to be done to her, and she is not
 * finished being watched — and neither turns an absent resuscitation into a
 * discharge.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { TERM_NEWBORN_TRANSITION as SCENARIO } from '../../src/modules/neonatology/scenarios/term-newborn-transition';
import { TERM_TRANSITION_FIXTURES as FIXTURES } from '../../src/modules/neonatology/term-newborn-transition-fixtures';
import {
  TERM_TRANSITION_DEMONSTRATION_VERSION, termTransitionDemonstrationStep,
  supportsTermTransitionDemonstration,
} from '../../src/modules/neonatology/demo/term-newborn-transition-demonstration';
import { termTransitionInlinePrompt } from '../../src/modules/neonatology/tutor/term-newborn-transition-guidance';
import type { TermTransitionAction } from '../../src/modules/neonatology/term-newborn-transition';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neonatologyTermTransitionAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: TermTransitionAction) => {
  engine.apply({ tick, type: 'term-newborn-transition-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = termTransitionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'term-newborn-transition-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Recognizes A Normal Without Closing It', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(TERM_TRANSITION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsTermTransitionDemonstration(SCENARIO)).toBe(true);
    expect(supportsTermTransitionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsTermTransitionDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'recognize', 'care', 'report', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.careAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('holds both statements together at the recognition beat', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('no need for resuscitation');
    expect(recognize).toContain('not a discharge');
    expect(recognize).toContain('stay open');
  });

  it('names the routine acts it deliberately leaves off', () => {
    const care = narrations[beats.indexOf('care')]!;
    expect(care).toContain('are left off');
    expect(care).toContain('leaving them off is the decision');
  });

  it('proves nothing and delivers nothing', () => {
    expect(patient.newbornExaminedOrScoredByLearner).toBe(false);
    expect(patient.cordCarePerformedByLearner).toBe(false);
    expect(patient.suctionOrStimulationPerformedByLearner).toBe(false);
    expect(patient.oxygenVentilationOrAirwayCareDeliveredByLearner).toBe(false);
    expect(patient.feedingPerformedByLearner).toBe(false);
    expect(patient.durableSafetyProven).toBe(false);
    expect(patient.glucoseStabilityProven).toBe(false);
    expect(patient.feedingSuccessProven).toBe(false);
    expect(patient.dischargeReadinessDetermined).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.parentOutcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['a well newborn', 'she is fine', 'she is stable now', 'ready for discharge', 'suction her', 'give oxygen']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('finishes on a checkpoint rather than a result', () => {
    expect(narrations[beats.indexOf('handoff')]).toContain('a checkpoint, not a result');
    expect(narration).toContain('nothing about her was closed');
  });
});

describe('Requirement: The Tutor Refuses To Turn A Quiet Hour Into A Conclusion', () => {
  it('opens on the team confirmed before it looks needed', () => {
    const engine = create(); engine.step();
    const prompt = termTransitionInlinePrompt('guided', {
      scenarioVersion: '0.1.0', termTransition: snapshot(engine),
    })!;
    expect(prompt.id).toBe('term-transition-support');
    expect(prompt.because).toContain('stops breathing at four minutes');
  });

  it('keeps the open risks in the same breath as the reassurance', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    advance(engine, 1, FIXTURES.expert[1][1]);
    const prompt = termTransitionInlinePrompt('guided', {
      scenarioVersion: '0.1.0', termTransition: snapshot(engine),
    })!;
    expect(prompt.id).toBe('term-transition-recognize');
    expect(prompt.because).toContain('not a discharge');
    expect(prompt.because).toContain('stay open');
  });

  it('never calls her well, nor supplies the care that stays with the team', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = termTransitionInlinePrompt('guided', {
        scenarioVersion: '0.1.0', termTransition: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['she is fine', 'a well newborn', 'ready for discharge', 'clamp the cord at', 'suction her', 'start the feed']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(termTransitionInlinePrompt('guided', { scenarioVersion: '0.1.0', termTransition: patient })!.id)
      .toBe('term-transition-observe');
    expect(termTransitionInlinePrompt('coached', { scenarioVersion: '0.1.0', termTransition: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(termTransitionInlinePrompt('unassisted', { scenarioVersion: '0.1.0', termTransition: patient })).toBeNull();
    expect(termTransitionInlinePrompt('guided', { scenarioVersion: '0.1.1', termTransition: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(termTransitionInlinePrompt('guided', { scenarioVersion: '0.1.0', termTransition: snapshot(engine) })).toBeNull();
  });
});
