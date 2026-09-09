import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { UNFINISHED_SURVEY_A_PATIENT_WHO_CANNOT_BE_ASKED as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/unfinished-survey-a-patient-who-cannot-be-asked';
import { UNFINISHED_SURVEY_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/unfinished-survey-fixtures';
import { UnfinishedSurvey } from '../../src/modules/surgery-trauma/unfinished-survey';
import { UNFINISHED_SURVEY_WAKE_TICKS as WAKE, UNFINISHED_SURVEY_TEAM_TICKS as TEAM, UNFINISHED_SURVEY_TAKEOVER_TICKS as STOP, UNFINISHED_SURVEY_ACTIONS, type UnfinishedSurveyAction } from '../../src/modules/surgery-trauma/unfinished-survey';

type Choices = readonly (readonly [number, UnfinishedSurveyAction])[];

function drive(actions: Choices, until: number) {
  const model = new UnfinishedSurvey();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Surgery and trauma unfinished-survey contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'surgery-trauma', 'ward', 'state_transition');
    expect(audit.requirements.find((entry) => entry.id === 'guidance-and-demonstration')?.status)
      .toBe('satisfied');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // Nothing deteriorates, ever. The whole difficulty is defending an unfinished assessment
  // with no abnormality to point at, so an observation that drifted would dissolve the lesson.
  it('holds every observation normal in every state', () => {
    for (const until of [10, WAKE + 10, TEAM + 10, STOP - 10]) {
      const run = drive([[0, 'check-observations']], until);
      expect(run.snapshot.observationRecord).toMatchObject({
        heartRateBpm: 88, systolicMmHg: 118, diastolicMmHg: 68, spo2Percent: 98,
      });
      expect(run.snapshot.secondarySurveyDocumented).toBe(true);
      expect(run.snapshot.tertiarySurveyDocumented).toBe(false);
    }
  });

  // The record never becomes wrong and the survey never gets done on its own. Those two facts
  // are what the learner has to act on, so they are pinned rather than assumed.
  it('never completes the survey by itself and never falsifies the record', () => {
    const run = drive([], STOP - 10);
    expect(run.snapshot.tertiarySurveyDocumented).toBe(false);
    expect(run.snapshot.secondarySurveyDocumented).toBe(true);
    expect(drive([[0, 'check-injury-record']], TEAM + 10).snapshot.injuryRecord!.tertiarySurveyDocumented).toBe(false);
  });

  it('moves only how much of him can be examined', () => {
    const before = drive([], 10).snapshot;
    expect(before.hoursSinceInjury).toBe(14);
    expect(before.sedationLightened).toBe(false);
    expect(before.alertness).toContain('not able to report');
    const run = drive([[0, 'record-why-he-could-not-be-examined']], WAKE + 20);
    expect(run.ids).toContain('sedation-lightened');
    expect(run.snapshot.hoursSinceInjury).toBe(15);
    expect(run.snapshot.alertness).toContain('not moving the left arm');
    // The monitored numbers are identical either side of the window.
    expect(run.model.vitals().heartRateBpm).toBe(new UnfinishedSurvey().vitals().heartRateBpm);
    expect(run.model.vitals().meanArterialMmHg).toBe(new UnfinishedSurvey().vitals().meanArterialMmHg);
  });

  it('records the unfinished assessment as a finding rather than an omission', () => {
    const text = drive([[0, 'record-that-the-third-survey-is-not-done']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('has not been performed or documented');
    expect(text).toContain('2 percent until somebody went back and looked, and then it was 9');
  });

  it('keeps both halves of the evidence, including the half that undercuts the step', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('41 missed injuries in 36 patients, 9 percent');
    expect(text).toContain('4.3 percent');
    expect(text).toContain('27 to 42 percent');
    expect(text).toContain('did not reduce missed injuries at all');
    expect(text).toContain('the evidence that doing it fixes this is weak');
  });

  it('refuses the documentation, the scan, the silence, and the clearance', () => {
    const documented = drive([[0, 'the-secondary-survey-is-documented-complete']], 10);
    expect(documented.ids).toContain('documentation-claim-refused');
    expect(documented.snapshot.choiceFeedback).toContain('A complete record of a limited examination is still a limited examination');
    const imaging = drive([[0, 'the-pan-scan-would-have-shown-it']], 10);
    expect(imaging.ids).toContain('imaging-claim-refused');
    expect(imaging.snapshot.choiceFeedback).toContain('21 of 41');
    const silence = drive([[0, 'he-has-not-complained-of-anything']], 10);
    expect(silence.ids).toContain('no-complaint-refused');
    expect(silence.snapshot.choiceFeedback).toContain('because he cannot');
    // The objection is to recording him as assessed, not to moving him to a ward.
    const clear = drive([[0, 'clear-him-now-and-review-if-something-appears']], 10);
    expect(clear.ids).toContain('clear-now-refused');
    expect(clear.snapshot.choiceFeedback).toContain('Stepping him down is not the objection');
  });

  it('never sends a trauma team that nobody asked, and answers slower than the second lesson', () => {
    const idle = drive([[0, 'record-why-he-could-not-be-examined']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    const asked = drive([[0, 'escalate-to-the-trauma-team']], TEAM + 10);
    expect(asked.ids).toContain('team-responded');
    // Twenty-five minutes against the rising-requirement lesson's twenty, and the first
    // lesson's takeover interval rather than the second's: what is asked for here is a
    // deliberate reassessment, and the harm is not measured minute to minute.
    expect(TEAM).toBe(25 * 60 * 10);
    expect(STOP).toBe(180 * 60 * 10);
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-why-he-could-not-be-examined'], [1, 'record-what-the-injury-list-rests-on'],
      [2, 'record-that-the-third-survey-is-not-done'], [3, 'escalate-to-the-trauma-team'],
      [4, 'record-bounded-survey-intent'], [5, 'review-boundaries'], [6, 'reassess'],
      [WAKE + 20, 'handoff']];
    expect(drive(stale, WAKE + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 22530);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 22540);
    expect(recovered.snapshot.documentationClaimAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with takeover', () => {
    expect(WAKE).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('sedation-lightened');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'morphine', doseMg: 10 } });
    engine.apply({ tick: 0, type: 'rising-requirement-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'unfinished-survey-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'unfinished-survey-response', payload: { action: 'order-a-repeat-scan' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('unfinished-survey-generic-action-refused');
    expect(ids).toContain('unfinished-survey-action-refused');
    expect(frame.equipment.resuscitation.unfinishedSurvey!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent, dose, imaging modality, or procedure after ANY action', () => {
    const forbidden = ['morphine', 'propofol', 'fentanyl', 'midazolam', 'laparotomy',
      'mg/kg', 'milligram', 'ultrasound'];
    for (const action of UNFINISHED_SURVEY_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'unfinished-survey-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.unfinishedSurvey!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  // The lesson exists because nobody can say whether anything is actually there. If the engine
  // ever asserted an injury it would answer the question the learner is meant to hold open.
  it('never asserts that a missed injury exists', () => {
    for (const action of UNFINISHED_SURVEY_ACTIONS) {
      const run = drive([[0, action]], WAKE + 20);
      const text = (run.snapshot.choiceFeedback ?? '').toLowerCase();
      expect(text, action).not.toContain('missed injury was found');
      expect(text, action).not.toContain('he has a fracture');
      expect(text, action).not.toContain('undiagnosed fracture');
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(UNFINISHED_SURVEY_ACTIONS).size).toBe(UNFINISHED_SURVEY_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
