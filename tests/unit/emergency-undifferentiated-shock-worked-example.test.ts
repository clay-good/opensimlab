/**
 * The worked example and observed-state tutor for a shock nobody names.
 *
 * The two opening reviews are an unordered pair, so the example shows one order
 * of them and the claim that neither is a precondition is asserted on the
 * closing narration, which every path reaches, rather than on a single beat.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { UNDIFFERENTIATED_SHOCK as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/undifferentiated-shock';
import { UNDIFFERENTIATED_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/undifferentiated-shock-fixtures';
import {
  UNDIFFERENTIATED_SHOCK_DEMONSTRATION_VERSION, undifferentiatedShockDemonstrationStep,
  supportsUndifferentiatedShockDemonstration,
} from '../../src/modules/emergency-medicine/demo/undifferentiated-shock-demonstration';
import { undifferentiatedShockInlinePrompt } from '../../src/modules/emergency-medicine/tutor/undifferentiated-shock-guidance';
import type { UndifferentiatedShockAction } from '../../src/modules/emergency-medicine/undifferentiated-shock';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.undifferentiatedShockAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: UndifferentiatedShockAction) => {
  engine.apply({ tick, type: 'undifferentiated-shock-assessment', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create(); engine.step();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 1; tick <= limit; tick += 1) {
    const step = undifferentiatedShockDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'undifferentiated-shock-assessment', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Tests Before It Commits', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(UNDIFFERENTIATED_SHOCK_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsUndifferentiatedShockDemonstration(SCENARIO)).toBe(true);
    expect(supportsUndifferentiatedShockDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsUndifferentiatedShockDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'undifferentiated-shock'),
    })).toBe(false);
  });

  it('takes all seven recorded steps without a single refusal', () => {
    expect(beats).toEqual(['perfusion', 'lactate', 'echo', 'leg-raise', 'fluid', 'reassess', 'escalate']);
    expect(patient.focusedEchoReviewedAtTick).toBeLessThan(patient.passiveLegRaiseAtTick!);
    expect(patient.passiveLegRaiseAtTick).toBeLessThan(patient.fluidChallengeAtTick!);
    expect(patient.fluidChallengeAtTick).toBeLessThan(patient.perfusionReassessedAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('puts the unordered-pair claim where every path reaches it', () => {
    // The example reads the perfusion first. A learner who reads the lactate
    // first never sees that beat in that position, so the claim is asserted on
    // the closing narration rather than on one branch.
    expect(narration).toContain('neither is a precondition for the other');
    expect(narration).toContain('the test you can undo comes before the one you cannot');
  });

  it('names the three organs and refuses to define shock by the pressure', () => {
    const perfusion = narrations[beats.indexOf('perfusion')]!;
    expect(perfusion).toContain('the three organs you can assess without a machine');
    expect(perfusion).toContain('a normal pressure buys no reassurance');
  });

  it('treats the lactate as a second opinion rather than a verdict', () => {
    const lactate = narrations[beats.indexOf('lactate')]!;
    expect(lactate).toContain('confirmation of a decision you can already make');
  });

  it('says the study excluded rather than diagnosed', () => {
    const echo = narrations[beats.indexOf('echo')]!;
    expect(echo).toContain('excluded, not diagnosed');
  });

  it('gives the reversibility argument in the beat that carries the lesson', () => {
    const legRaise = narrations[beats.indexOf('leg-raise')]!;
    expect(legRaise).toContain('gives it back the moment they come down');
    expect(legRaise).toContain('volume you have given cannot be taken back');
  });

  it('says why bounded means bounded, and why the same markers', () => {
    expect(narrations[beats.indexOf('fluid')]!).toContain('an experiment with an endpoint');
    expect(narrations[beats.indexOf('reassess')]!).toContain('only judged on the pressure will look like it worked');
  });

  it('ends by saying the cause is still open', () => {
    const escalate = narrations[beats.indexOf('escalate')]!;
    expect(escalate).toContain('mistaken a better number for an answer');
    expect(narration).toContain('a cause still open');
  });

  it('never names a cause, hangs an infusion, or reports an outcome', () => {
    // Guard the instruction voice, not the nouns: the lesson names fluid,
    // tamponade and lactate in order to reason about them, so a bare noun match
    // would fail on the lesson's own point.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is septic shock', 'she has a tamponade', 'start norepinephrine',
      'run it wide open', 'keep the fluid going', 'she is out of shock', 'her lactate has cleared']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Puts The Reversible Test First', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = undifferentiatedShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['us-perfusion', 'us-lactate', 'us-echo', 'us-plr',
      'us-fluid', 'us-reassess', 'us-escalate']);
  });

  it('moves to the lactate when the pair is taken the other way round', () => {
    const engine = create(); engine.step();
    advance(engine, 1, 'review-lactate');
    // The pair is unordered in the engine; the tutor names whichever is left.
    expect(undifferentiatedShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('us-perfusion');
    advance(engine, 2, 'review-perfusion');
    expect(undifferentiatedShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('us-echo');
  });

  it('stays on the leg raise when the fluid is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 1, 'review-perfusion');
    advance(engine, 2, 'review-lactate');
    advance(engine, 3, 'review-focused-echo');
    advance(engine, 4, 'give-targeted-fluid-challenge');
    expect(snapshot(engine)!.fluidChallengeAtTick).toBeNull();
    const prompt = undifferentiatedShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('us-plr');
    expect(prompt.because).toContain('volume you have given cannot be taken back');
  });

  it('never names a cause anywhere on the recovery path', () => {
    const engine = create(); engine.step(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = undifferentiatedShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(7);
    for (const text of seen) {
      for (const forbidden of ['this is septic shock', 'start norepinephrine', 'she is out of shock']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the escalation', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(undifferentiatedShockInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(undifferentiatedShockInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(undifferentiatedShockInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.escalationAtTick).not.toBeNull();
    expect(undifferentiatedShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(undifferentiatedShockInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
