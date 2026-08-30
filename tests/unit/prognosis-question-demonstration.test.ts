/**
 * The worked example and observed-state tutor for a number he asked for.
 *
 * The scenario decides what he repeats back from what was actually said: answer
 * without stating the direction of the error and the best case comes back alone,
 * as though it were the answer. So the example is not judged on using the right
 * words — it is judged on what the fictional patient heard, which the engine
 * decides rather than the narration.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PROGNOSIS_QUESTION_A_NUMBER_HE_ASKED_FOR as SCENARIO } from '../../src/modules/oncology/scenarios/prognosis-question-a-number-he-asked-for';
import { PROGNOSIS_QUESTION_FIXTURES as FIXTURES } from '../../src/modules/oncology/prognosis-question-fixtures';
import {
  PROGNOSIS_QUESTION_DEMONSTRATION_VERSION, prognosisQuestionDemonstrationStep,
  supportsPrognosisQuestionDemonstration,
} from '../../src/modules/oncology/demo/prognosis-question-demonstration';
import { prognosisQuestionInlinePrompt } from '../../src/modules/oncology/prognosis-question-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.prognosisQuestion;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = prognosisQuestionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) beats.push(step.id);
    if (step.action) engine.apply({ tick, type: 'prognosis-question-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Is Judged By What He Heard', () => {
  const { beats, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PROGNOSIS_QUESTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPrognosisQuestionDemonstration(SCENARIO)).toBe(true);
    expect(supportsPrognosisQuestionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('leaves him repeating all three scenarios, not the best case alone', () => {
    // This is the engine's verdict on what was said, not the narration's claim.
    expect(patient.readback).toBe('all-three-scenarios');
    expect(patient.readbackObserved).toBe(true);
    expect(patient.ended).toBe('handoff');
  });

  it('asks what he wants before answering, which the scenario refuses to reverse', () => {
    expect(beats[0]).toBe('intent');
    expect(beats.indexOf('intent')).toBeLessThan(beats.indexOf('answer'));
    expect(beats.indexOf('belief')).toBeLessThan(beats.indexOf('answer'));
    expect(patient.prematureAnswerAttempted).toBe(false);
  });

  it('states the direction of the error before he has a chance to repeat it back', () => {
    expect(beats.indexOf('direction')).toBeLessThan(beats.indexOf('observe'));
    expect(patient.directionStatedAtTick).not.toBeNull();
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.singleNumberAttempted).toBe(false);
    expect(patient.nobodyKnowsAttempted).toBe(false);
    expect(patient.reassuranceAttempted).toBe(false);
    expect(patient.prematureAnswerAttempted).toBe(false);
  });
});

describe('Requirement: Omitting The Direction Changes What He Hears', () => {
  it('leaves him with the best case alone when the direction is never stated', () => {
    // The counterfactual the example exists to make visible: the same answer,
    // given without the shape around it, comes back as the whole answer.
    const engine = create();
    for (const action of ['ask-what-he-wants-to-know', 'record-the-question-as-asked',
      'check-what-he-believes-the-treatment-is-for', 'answer-with-scenarios-not-a-number'] as const) {
      engine.apply({ tick: 0, type: 'prognosis-question-response', payload: { action } });
    }
    for (let tick = 0; tick <= 30_000; tick += 1) engine.step();
    const patient = snapshot(engine)!;
    expect(patient.directionStatedAtTick).toBeNull();
    expect(patient.readback).toBe('best-case-only');
  });
});

describe('Requirement: The Tutor Refuses Both Comfortable Answers', () => {
  it('opens by asking what he wants to know', () => {
    const engine = create(); engine.step();
    expect(prognosisQuestionInlinePrompt('guided', {
      scenarioVersion: '0.1.0', prognosisQuestion: snapshot(engine),
    })?.id).toBe('prognosis-question-intent');
  });

  it('never offers a single number and never says nobody can know', () => {
    const engine = create();
    const seen: string[] = [];
    for (const action of ['ask-what-he-wants-to-know', 'record-the-question-as-asked',
      'check-what-he-believes-the-treatment-is-for', 'answer-with-scenarios-not-a-number',
      'state-the-direction-of-the-error'] as const) {
      const prompt = prognosisQuestionInlinePrompt('guided', {
        scenarioVersion: '0.1.0', prognosisQuestion: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      engine.apply({ tick: 0, type: 'prognosis-question-response', payload: { action } });
      engine.step();
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      // No figure and no reassurance. "nobody can know" is not in this list: the
      // tutor quotes it in order to refuse it, and forbidding the substring would
      // have banned naming the error rather than making it.
      for (const forbidden of ['months', 'years', 'reassure him', 'do not worry']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
    // What it must do instead of merely avoiding them: name both failures.
    const answerPrompt = seen.find((text) => text.includes('scenarios rather than a single number'))!;
    expect(answerPrompt).toContain('false precision');
    expect(answerPrompt).toContain('true and useless');
  });

  it('is silent when unassisted and bound to the exact content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(prognosisQuestionInlinePrompt('unassisted', { scenarioVersion: '0.1.0', prognosisQuestion: patient })).toBeNull();
    expect(prognosisQuestionInlinePrompt('guided', { scenarioVersion: '0.1.1', prognosisQuestion: patient })).toBeNull();
  });
});
