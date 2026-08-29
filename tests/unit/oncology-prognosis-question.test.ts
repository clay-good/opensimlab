import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { PROGNOSIS_QUESTION_A_NUMBER_HE_ASKED_FOR as SCENARIO } from '../../src/modules/oncology/scenarios/prognosis-question-a-number-he-asked-for';
import { PROGNOSIS_QUESTION_FIXTURES as FIXTURES } from '../../src/modules/oncology/prognosis-question-fixtures';
import { PrognosisQuestion } from '../../src/modules/oncology/prognosis-question';
import { PROGNOSIS_QUESTION_REPEAT_TICKS as REPEAT, PROGNOSIS_QUESTION_READBACK_TICKS as READBACK, PROGNOSIS_QUESTION_TAKEOVER_TICKS as STOP, PROGNOSIS_QUESTION_ACTIONS, type PrognosisQuestionAction } from '../../src/modules/oncology/prognosis-question';

type Choices = readonly (readonly [number, PrognosisQuestionAction])[];

function drive(actions: Choices, until: number) {
  const model = new PrognosisQuestion();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Oncology prognosis-conversation contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'oncology', 'clinic', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // Nothing measurable answers what he asked, in any state. A learner who checks observations
  // hard enough must not be rewarded with an answer.
  it('never lets an observation bear on the question', () => {
    for (const until of [10, REPEAT + 10, STOP - 10]) {
      const run = drive([[0, 'check-observations']], until);
      expect(run.snapshot.observationsAnswerTheQuestion).toBe(false);
      expect(run.snapshot.choiceFeedback).toContain('none of them answers what he asked');
      expect(run.model.vitals()).toEqual(new PrognosisQuestion().vitals());
    }
  });

  it('refuses an answer before the question behind it is established', () => {
    const early = drive([[0, 'answer-with-scenarios-not-a-number']], 10);
    expect(early.ids).toContain('answer-refused');
    expect(early.snapshot.answeredAtTick).toBeNull();
    const ordered = drive([[0, 'ask-what-he-wants-to-know'], [1, 'answer-with-scenarios-not-a-number']], 10);
    expect(ordered.ids).toContain('answered');
    expect(ordered.snapshot.answeredAtTick).toBe(1);
  });

  it('refuses a direction of error before there is an estimate to attach it to', () => {
    const early = drive([[0, 'state-the-direction-of-the-error']], 10);
    expect(early.ids).toContain('direction-refused');
    expect(early.snapshot.directionStatedAtTick).toBeNull();
  });

  // The readback is the lesson: what he repeats is decided by what was said, not what was meant.
  it('produces the readback from what was actually said', () => {
    const withoutDirection = drive([[0, 'ask-what-he-wants-to-know'], [1, 'answer-with-scenarios-not-a-number']], READBACK + 10);
    expect(withoutDirection.ids).toContain('readback-best-case');
    expect(withoutDirection.snapshot.readback).toBe('best-case-only');

    const withDirection = drive([[0, 'ask-what-he-wants-to-know'], [1, 'answer-with-scenarios-not-a-number'],
      [2, 'state-the-direction-of-the-error']], READBACK + 10);
    expect(withDirection.ids).toContain('readback-scenarios');
    expect(withDirection.snapshot.readback).toBe('all-three-scenarios');

    // Never answered: there is nothing to repeat, and no readback event fires at all.
    const unanswered = drive([[0, 'ask-what-he-wants-to-know']], READBACK + 10);
    expect(unanswered.ids).not.toContain('readback-best-case');
    expect(unanswered.ids).not.toContain('readback-scenarios');
    expect(unanswered.snapshot.readback).toBeNull();
  });

  it('has him give the reason himself if nobody asks', () => {
    const run = drive([[0, 'check-observations']], REPEAT + 10);
    expect(run.ids).toContain('asked-again');
    expect(run.snapshot.askedAgain).toBe(true);
  });

  it('refuses the four comfortable replies with stated reasons', () => {
    const single = drive([[0, 'give-a-single-number']], 10);
    expect(single.ids).toContain('single-number-refused');
    expect(single.snapshot.choiceFeedback).toContain('it is heard as a date');
    const nobody = drive([[0, 'say-nobody-can-know']], 10);
    expect(nobody.ids).toContain('nobody-knows-refused');
    expect(nobody.snapshot.choiceFeedback).toContain('It is true and it is not an answer');
    const reassure = drive([[0, 'reassure-and-move-on']], 10);
    expect(reassure.ids).toContain('reassurance-refused');
    expect(reassure.snapshot.choiceFeedback).toContain('most favourably');
    const premature = drive([[0, 'answer-before-asking-what-he-wants']], 10);
    expect(premature.ids).toContain('premature-refused');
    expect(premature.snapshot.choiceFeedback).toContain('does not want "all the details"');
  });

  it('names whose bias the direction of the error describes', () => {
    const text = drive([[0, 'ask-what-he-wants-to-know'], [1, 'answer-with-scenarios-not-a-number'],
      [2, 'state-the-direction-of-the-error']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('a property of the people making it rather than of him');
    expect(text).toContain('known their patients longest were the least accurate');
  });

  it('keeps every cited figure off this patient', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('None of these figures is this man');
    expect(text).toContain('its size does not transfer');
  });

  it('gates handoff on a current assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'ask-what-he-wants-to-know'], [1, 'record-the-question-as-asked'],
      [2, 'check-what-he-believes-the-treatment-is-for'], [3, 'answer-with-scenarios-not-a-number'],
      [4, 'state-the-direction-of-the-error'], [5, 'review-boundaries'], [6, 'reassess'],
      [READBACK + 20, 'handoff']];
    expect(drive(stale, READBACK + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 18020);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    const recovered = drive(FIXTURES.recovery, 18030);
    expect(recovered.snapshot.singleNumberAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('carries the best-case readback into the handoff rather than tidying it away', () => {
    const late: Choices = [[0, 'ask-what-he-wants-to-know'], [1, 'record-the-question-as-asked'],
      [2, 'check-what-he-believes-the-treatment-is-for'], [3, 'answer-with-scenarios-not-a-number'],
      [READBACK + 10, 'review-boundaries'], [READBACK + 11, 'state-the-direction-of-the-error'],
      [READBACK + 12, 'reassess'], [READBACK + 13, 'handoff']];
    const run = drive(late, READBACK + 20);
    expect(run.snapshot.ended).toBe('handoff');
    expect(run.snapshot.readback).toBe('best-case-only');
    expect(run.snapshot.choiceFeedback).toContain('the best case alone');
  });

  it('bounds a run in which he is never answered', () => {
    expect(REPEAT).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('asked-again');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'morphine', doseMg: 5 } });
    engine.apply({ tick: 0, type: 'normal-test-toxicity-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'prognosis-question-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'prognosis-question-response', payload: { action: 'predict-survival' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('prognosis-question-generic-action-refused');
    expect(ids).toContain('prognosis-question-action-refused');
    expect(frame.equipment.resuscitation.prognosisQuestion!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent, dose, or predicted survival after ANY action', () => {
    const forbidden = ['morphine', 'chemotherapy regimen', 'mg/kg', 'milligram', 'months to live',
      'he will live', 'life expectancy is'];
    for (const action of PROGNOSIS_QUESTION_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'prognosis-question-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.prognosisQuestion!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(PROGNOSIS_QUESTION_ACTIONS).size).toBe(PROGNOSIS_QUESTION_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
