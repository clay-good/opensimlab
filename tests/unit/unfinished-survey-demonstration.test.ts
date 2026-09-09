/**
 * The worked example and observed-state tutor for an assessment that is accurate and unfinished.
 *
 * The failure this example must not model is waiting until the patient produces a finding
 * before defending the position. It is held here to asking for the survey while he is still
 * sedated and there is nothing to show, and to never asserting that a missed injury exists,
 * because nothing available in the lesson can establish that.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { UNFINISHED_SURVEY_A_PATIENT_WHO_CANNOT_BE_ASKED as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/unfinished-survey-a-patient-who-cannot-be-asked';
import { UNFINISHED_SURVEY_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/unfinished-survey-fixtures';
import {
  UNFINISHED_SURVEY_DEMONSTRATION_VERSION, unfinishedSurveyDemonstrationStep, supportsUnfinishedSurveyDemonstration,
} from '../../src/modules/surgery-trauma/demo/unfinished-survey-demonstration';
import { unfinishedSurveyInlinePrompt } from '../../src/modules/surgery-trauma/unfinished-survey-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.unfinishedSurvey;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = unfinishedSurveyDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'unfinished-survey-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Holds The Position With Nothing To Show', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(UNFINISHED_SURVEY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsUnfinishedSurveyDemonstration(SCENARIO)).toBe(true);
    expect(supportsUnfinishedSurveyDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('runs to a handoff through the real engine, in the taught order', () => {
    expect(patient.ended).toBe('handoff');
    expect(beats).toEqual(['limits', 'list', 'third', 'escalate', 'intent', 'boundaries',
      'hold', 'window', 'reassess', 'handoff']);
  });

  // The whole failure mode is waiting for the patient to justify the position, so the example
  // must ask before the sedation window rather than after it.
  it('asks for the survey before the sedation window, not after it', () => {
    expect(beats.indexOf('escalate')).toBeLessThan(beats.indexOf('window'));
    expect(narrations[beats.indexOf('escalate')]).toContain('while he is still sedated and there is nothing to show');
  });

  it('starts with what he could contribute rather than with the record', () => {
    expect(beats[0]).toBe('limits');
    expect(narrations[0]).toContain('Start with what he could contribute');
  });

  // Forbid the assertion, not the subject: the example has to be able to discuss missed
  // injuries as a category while refusing to claim this patient has one.
  it('never asserts that this patient has a missed injury, in any beat', () => {
    const joined = narrations.join(' ').toLowerCase();
    for (const claim of ['he has a missed injury', 'there is a missed injury',
      'his left arm is fractured', 'confirms a missed injury', 'excludes a missed injury',
      'proves', 'diagnosed with']) {
      expect(joined, `the example asserted "${claim}"`).not.toContain(claim);
    }
    expect(joined).toContain('a record of what was found');
  });

  it('says that nothing is coming to prove the learner right', () => {
    const hold = narrations[beats.indexOf('hold')]!;
    expect(hold).toContain('No deterioration is coming to prove you right');
    const window = narrations[beats.indexOf('window')]!;
    expect(window).toContain('the question was still open when it arrived');
  });

  it('keeps the half of the evidence that undercuts the step it is teaching', () => {
    const boundaries = narrations[beats.indexOf('boundaries')]!;
    expect(boundaries).toContain('27 to 42 percent');
    expect(boundaries).toContain('Worth doing; not proven to fix it');
  });

  it('ends with the survey owned by the trauma team and nothing called clear', () => {
    expect(patient.teamObserved).toBe(true);
    expect(narrations.at(-1)).toContain('nobody has yet called him clear');
  });

  it('says nothing at all on the unassisted setting', () => {
    const engine = create();
    engine.step();
    expect(unfinishedSurveyInlinePrompt('unassisted', { scenarioVersion: '0.1.0', unfinishedSurvey: snapshot(engine) }))
      .toBeNull();
  });

  it('withholds exactly the two non-urgent beats when coached', () => {
    const engine = create();
    const guided: (string | null)[] = []; const coached: (string | null)[] = [];
    for (let tick = 0; tick <= 200_000; tick += 1) {
      const patientNow = snapshot(engine);
      const step = unfinishedSurveyDemonstrationStep(patientNow);
      if (step.finished) break;
      const input = { scenarioVersion: '0.1.0', unfinishedSurvey: patientNow };
      guided.push(unfinishedSurveyInlinePrompt('guided', input)?.id ?? null);
      coached.push(unfinishedSurveyInlinePrompt('coached', input)?.id ?? null);
      if (step.action) engine.apply({ tick, type: 'unfinished-survey-response', payload: { action: step.action } });
      engine.step();
    }
    const withheld = [...new Set(guided.filter((id, index) => id !== null && coached[index] === null))];
    expect(withheld.sort()).toEqual(['unfinished-survey-handoff', 'unfinished-survey-hold']);
    expect(new Set(guided.filter((id): id is string => id !== null)).size).toBeGreaterThan(5);
  });

  it('is silent on a version it was not written for, and after the run ends', () => {
    const engine = create();
    engine.step();
    expect(unfinishedSurveyInlinePrompt('guided', { scenarioVersion: '0.1.1', unfinishedSurvey: snapshot(engine) }))
      .toBeNull();
    expect(unfinishedSurveyInlinePrompt('guided', { scenarioVersion: '0.1.0', unfinishedSurvey: patient })).toBeNull();
  });
});
