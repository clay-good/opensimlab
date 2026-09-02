/**
 * The worked example and observed-state tutor for a recovery that stopped at
 * 30 metres.
 *
 * Her gas is nearly back and she speaks in full sentences, and she walked 200
 * metres before this admission and now stops after thirty. The numbers
 * recovered and the function did not.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { COPD_EXACERBATION_TRANSITION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/copd-exacerbation-transition-reassessment';
import { COPD_TRANSITION_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/copd-exacerbation-transition-reassessment-fixtures';
import {
  COPD_TRANSITION_DEMONSTRATION_VERSION, copdTransitionDemonstrationStep,
  supportsCopdTransitionDemonstration,
} from '../../src/modules/respiratory-medicine/demo/copd-exacerbation-transition-reassessment-demonstration';
import { copdTransitionInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/copd-exacerbation-transition-reassessment-guidance';
import type { CopdTransitionAction } from '../../src/modules/respiratory-medicine/copd-exacerbation-transition-reassessment';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.copdTransitionAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: CopdTransitionAction) => {
  engine.apply({ tick, type: 'copd-exacerbation-transition-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = copdTransitionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'copd-exacerbation-transition-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Reads Function Rather Than Numbers', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(COPD_TRANSITION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCopdTransitionDemonstration(SCENARIO)).toBe(true);
    expect(supportsCopdTransitionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCopdTransitionDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
    // The obstruction waveform cue is part of the identity, not incidental.
    expect(supportsCopdTransitionDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'obstruction'),
    })).toBe(false);
  });

  it('reaches handoff through all five recorded steps in the enforced order', () => {
    expect(beats).toEqual(['readiness', 'needs', 'medication', 'coordination', 'handoff']);
    expect(patient.readinessAtTick).toBeLessThan(patient.respiratoryNeedsAtTick!);
    expect(patient.respiratoryNeedsAtTick).toBeLessThan(patient.medicationAtTick!);
    expect(patient.medicationAtTick).toBeLessThan(patient.coordinationAtTick!);
    expect(patient.coordinationAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('starts from who she was rather than from today’s numbers', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('not from today’s numbers');
    expect(readiness).toContain('all correctly given by someone else');
    expect(readiness).toContain('whether it reaches back to the person in the first sentence');
  });

  it('puts the corridor walk ahead of everything else', () => {
    const needs = narrations[beats.indexOf('needs')]!;
    expect(needs).toContain('because that is the answer');
    expect(needs).toContain('function is what decides whether home works');
    expect(needs).toContain('does not establish long-term oxygen eligibility');
  });

  it('carries the technique errors rather than re-grading them', () => {
    const medication = narrations[beats.indexOf('medication')]!;
    expect(medication).toContain('a finding to carry rather than something to re-grade');
    expect(medication).toContain('a maintenance inhaler she cannot use is not a maintenance inhaler');
    expect(beats.indexOf('needs')).toBeLessThan(beats.indexOf('medication'));
  });

  it('arranges what changes the next admission, and guarantees none of it', () => {
    const coordination = narrations[beats.indexOf('coordination')]!;
    expect(coordination).toContain('the next admission rather than this one');
    expect(coordination).toContain('most likely to be skipped and most likely to matter');
    expect(coordination).toContain('none of them is guaranteed by naming it');
  });

  it('ends on a recovery that is real and incomplete', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the gap between her numbers and her walking');
    expect(handoff).toContain('requested rather than secured');
    expect(narration).toContain('not yet the person she was three days ago');
    expect(narration).toContain('This ends the example, not the recovery.');
  });

  it('delivers nothing, arranges nothing, and predicts nothing', () => {
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.oxygenDeliveredByLearner).toBe(false);
    expect(patient.longTermOxygenEligibilityDetermined).toBe(false);
    expect(patient.regimenSelected).toBe(false);
    expect(patient.techniquePerformedByLearner).toBe(false);
    expect(patient.rehabilitationEnrolled).toBe(false);
    expect(patient.appointmentGuaranteed).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she is ready for home', 'she qualifies for home oxygen', 'her technique is corrected', 'the appointment is booked']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    for (const forbidden of ['switch her to', 'start her on', 'book the rehab', 'stop the steroid on day']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Reads Function Rather Than Numbers', () => {
  it('opens on who she was before this admission', () => {
    const engine = create(); engine.step();
    const prompt = copdTransitionInlinePrompt('guided', { scenarioVersion: '0.1.0', copdTransition: snapshot(engine) })!;
    expect(prompt.id).toBe('copd-readiness');
    expect(prompt.suggestion).toContain('not from today’s numbers');
    expect(prompt.because).toContain('whether it reaches back to the person in the first sentence');
  });

  it('sends you to the corridor walk next', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = copdTransitionInlinePrompt('guided', { scenarioVersion: '0.1.0', copdTransition: snapshot(engine) })!;
    expect(prompt.id).toBe('copd-needs');
    expect(prompt.suggestion).toContain('because that is the answer');
    expect(prompt.because).toContain('function is what decides whether home works');
    expect(prompt.because).toContain('does not establish long-term oxygen eligibility');
  });

  it('treats the technique errors as a finding to carry', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = copdTransitionInlinePrompt('guided', { scenarioVersion: '0.1.0', copdTransition: snapshot(engine) })!;
    expect(prompt.id).toBe('copd-medication');
    expect(prompt.suggestion).toContain('finish neither here');
    expect(prompt.because).toContain('a finding to carry rather than something to re-grade');
  });

  it('names the follow-up as requested rather than guaranteed', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = copdTransitionInlinePrompt('guided', { scenarioVersion: '0.1.0', copdTransition: snapshot(engine) })!;
    expect(prompt.id).toBe('copd-coordination');
    expect(prompt.because).toContain('most likely to be skipped and most likely to matter');
    expect(prompt.because).toContain('none of them is guaranteed by naming it');
  });

  it('never declares her ready, eligible, or booked', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = copdTransitionInlinePrompt('guided', { scenarioVersion: '0.1.0', copdTransition: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['she is ready for home', 'she qualifies for home oxygen', 'the appointment is booked', 'switch her to']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(copdTransitionInlinePrompt('unassisted', { scenarioVersion: '0.1.0', copdTransition: patient })).toBeNull();
    expect(copdTransitionInlinePrompt('guided', { scenarioVersion: '0.1.1', copdTransition: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(copdTransitionInlinePrompt('guided', { scenarioVersion: '0.1.0', copdTransition: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(copdTransitionInlinePrompt(level, { scenarioVersion: '0.1.0', copdTransition: snapshot(engine) })).not.toBeNull();
    }
  });
});
