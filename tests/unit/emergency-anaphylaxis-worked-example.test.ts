/**
 * The worked example and observed-state tutor for a drug that does not wait on
 * getting ready.
 *
 * Oxygen and a line feel like preparation, and the engine refuses both until
 * the intramuscular epinephrine is recorded. The two adjuncts that follow are
 * unordered, so the example only ever passes through the beat for the state
 * where neither has been recorded — the claim about the fluid lives there, and
 * the assertions below check it on the joined narration.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ANAPHYLAXIS as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/anaphylaxis';
import { EMERGENCY_ANAPHYLAXIS_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/emergency-anaphylaxis-fixtures';
import {
  EMERGENCY_ANAPHYLAXIS_DEMONSTRATION_VERSION, emergencyAnaphylaxisDemonstrationStep,
  supportsEmergencyAnaphylaxisDemonstration,
} from '../../src/modules/emergency-medicine/demo/emergency-anaphylaxis-demonstration';
import { emergencyAnaphylaxisInlinePrompt } from '../../src/modules/emergency-medicine/tutor/emergency-anaphylaxis-guidance';
import type { EmergencyAnaphylaxisAction } from '../../src/modules/emergency-medicine/emergency-anaphylaxis';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.emergencyAnaphylaxisAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: EmergencyAnaphylaxisAction) => {
  engine.apply({ tick, type: 'emergency-anaphylaxis-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = emergencyAnaphylaxisDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'emergency-anaphylaxis-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Gives The Drug Before Getting Ready', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(EMERGENCY_ANAPHYLAXIS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsEmergencyAnaphylaxisDemonstration(SCENARIO)).toBe(true);
    expect(supportsEmergencyAnaphylaxisDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsEmergencyAnaphylaxisDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'anaphylaxis'),
    })).toBe(false);
  });

  it('takes all six recorded steps with the drug ahead of both adjuncts', () => {
    expect(beats).toEqual(['pattern', 'position', 'epinephrine', 'oxygen', 'crystalloid', 'reassess']);
    expect(patient.patternReviewedAtTick).toBeLessThan(patient.positionedAndHelpedAtTick!);
    expect(patient.positionedAndHelpedAtTick).toBeLessThan(patient.imEpinephrineAtTick!);
    expect(patient.imEpinephrineAtTick).toBeLessThan(patient.oxygenAtTick!);
    expect(patient.oxygenAtTick).toBeLessThan(patient.crystalloidAtTick!);
    expect(patient.crystalloidAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('makes the absent skin findings the point', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('What is absent is the skin');
    expect(pattern).toContain('exactly the wrong way round for a rule that says wait');
  });

  it('treats positioning as treatment rather than tidying', () => {
    const position = narrations[beats.indexOf('position')]!;
    expect(position).toContain('Positioning is treatment here, not tidying');
    expect(position).toContain('in the act of sitting or standing them');
  });

  it('says why the refusal on the adjuncts is the whole point', () => {
    const epinephrine = narrations[beats.indexOf('epinephrine')]!;
    expect(epinephrine).toContain('This is the lesson');
    expect(epinephrine).toContain('the interval most consistently found in the fatal cases');
    expect(epinephrine).toContain('the control does not offer it');
    expect(narration).toContain('the two things that feel like preparation');
  });

  it('carries the fluid claim on the path the example actually takes', () => {
    // The adjuncts are unordered, so the per-lane crystalloid beat is never
    // reached here. The claim has to survive on the "neither yet" beat.
    expect(beats).not.toContain('ana-crystalloid');
    expect(everything).toContain('the fluid is not an afterthought');
    expect(everything).toContain('treating an acute hypovolaemia that arrived in the time it took to walk into the department');
    expect(everything).toContain('neither adjunct is a substitute for a second dose of epinephrine');
  });

  it('says the honest answer after a first dose is often to give it again', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('not yet, give it again');
    expect(reassess).toContain('authored rather than modelled');
  });

  it('never gives the drug intravenously, teaches technique, sits him up, or calls it over', () => {
    // Guard the instruction voice, not the nouns: the lesson names the drug,
    // the dose and the route as recorded content, and it argues against the
    // intravenous route by naming it, so a bare noun match would fail on the
    // lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['give it intravenously', 'push 500 micrograms iv',
      'sit him upright', 'stand him up', 'aspirate before injecting',
      'the reaction is over', 'he can be discharged']) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds The Chain And The Unordered Pair', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = emergencyAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['ana-pattern', 'ana-position', 'ana-epinephrine', 'ana-adjuncts', 'ana-crystalloid', 'ana-reassess']);
  });

  it('reaches the per-lane oxygen beat only when a learner takes the fluid first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-systemic-pattern');
    advance(engine, 1, 'position-and-call-for-help');
    advance(engine, 2, 'give-im-epinephrine');
    advance(engine, 3, 'begin-fixed-crystalloid');
    const prompt = emergencyAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ana-oxygen');
    expect(prompt.because).toContain('It buys time; it does not treat the mechanism');
  });

  it('stays on the drug when an adjunct is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-systemic-pattern');
    advance(engine, 1, 'position-and-call-for-help');
    advance(engine, 2, 'give-high-flow-oxygen');
    expect(snapshot(engine)!.oxygenAtTick).toBeNull();
    expect(emergencyAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ana-epinephrine');
  });

  it('stays on the reassessment while the engine clock has not moved on', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-systemic-pattern');
    advance(engine, 1, 'position-and-call-for-help');
    advance(engine, 2, 'give-im-epinephrine');
    advance(engine, 3, 'give-high-flow-oxygen');
    engine.apply({ tick: 4, type: 'emergency-anaphylaxis-response', payload: { action: 'begin-fixed-crystalloid' } });
    engine.apply({ tick: 4, type: 'emergency-anaphylaxis-response', payload: { action: 'reassess-response' } });
    engine.step();
    expect(snapshot(engine)!.reassessedAtTick).toBeNull();
    expect(emergencyAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ana-reassess');
  });

  it('does not move on when the drug is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'give-im-epinephrine');
    expect(snapshot(engine)!.imEpinephrineAtTick).toBeNull();
    expect(emergencyAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ana-pattern');
  });

  it('never offers the intravenous route or a technique anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = emergencyAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['give it intravenously', 'push 500 micrograms iv', 'aspirate before injecting']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(emergencyAnaphylaxisInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(emergencyAnaphylaxisInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(emergencyAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(emergencyAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(emergencyAnaphylaxisInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
