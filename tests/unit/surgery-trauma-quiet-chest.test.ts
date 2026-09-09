import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { QUIET_CHEST_AN_INJURY_WHOSE_SEVERITY_IS_NOT_YET_VISIBLE as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/quiet-chest-an-injury-whose-severity-is-not-yet-visible';
import { QUIET_CHEST_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/quiet-chest-fixtures';
import { QuietChest } from '../../src/modules/surgery-trauma/quiet-chest';
import { QUIET_CHEST_FAMILY_TICKS as FAMILY, QUIET_CHEST_TEAM_TICKS as TEAM, QUIET_CHEST_TAKEOVER_TICKS as STOP, QUIET_CHEST_ACTIONS, type QuietChestAction } from '../../src/modules/surgery-trauma/quiet-chest';

type Choices = readonly (readonly [number, QuietChestAction])[];

function drive(actions: Choices, until: number) {
  const model = new QuietChest();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Surgery and trauma quiet-chest contract', () => {
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

  // The entire difficulty is defending a comfortable patient with a normal chart. An
  // observation that drifted anywhere would hand the learner the argument.
  it('holds every observation normal in every state, before and after the call', () => {
    for (const until of [10, FAMILY + 10, TEAM + 10, STOP - 10]) {
      const run = drive([[0, 'check-observations']], until);
      expect(run.snapshot.observationRecord).toMatchObject({
        heartRateBpm: 84, systolicMmHg: 138, respiratoryRateBpm: 18, spo2Percent: 96,
      });
    }
    const before = new QuietChest(); const after = drive([], FAMILY + 10).model;
    expect(after.vitals()).toEqual(before.vitals());
  });

  // The authored beat is social, not clinical, and nobody ever watches her breathe.
  it('changes only who will be at home, and never observes a full breath', () => {
    const early = drive([], 10).snapshot;
    expect(early.familyCalled).toBe(false);
    expect(early.hoursSinceFall).toBe(16);
    const run = drive([[0, 'record-the-fall-and-what-was-broken']], FAMILY + 20);
    expect(run.ids).toContain('family-called');
    expect(run.snapshot.familyCalled).toBe(true);
    expect(run.snapshot.hoursSinceFall).toBe(17);
    expect(run.snapshot.effortObserved).toBe(false);
    expect(drive([[0, 'check-chest-record']], TEAM + 10).snapshot.chestRecord!.effortObserved).toBe(false);
  });

  it('records what a resting chart was measuring', () => {
    const text = drive([[0, 'record-what-comfortable-at-rest-measures']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('report on the work she is doing now, which is none');
    expect(text).toContain('has not been asked to take a full breath');
  });

  it('records the count and the age as the finding rather than as demographics', () => {
    const text = drive([[0, 'record-what-the-count-predicts']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('31 percent against 17');
    expect(text).toContain('22 percent against 10');
    expect(text).toContain('five times the adjusted odds');
  });

  it('keeps the half of the evidence that removes the easy answer', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('223 patients in total and all at high risk of bias');
    expect(text).toContain('no significant difference in mortality, pneumonia or ventilation days');
    expect(text).toContain('not that anybody can point to the thing that will prevent it');
    // The source disagrees with itself and the lesson says so rather than picking a figure.
    expect(text).toContain('which do not match');
  });

  it('refuses the chart, the film, her own report, and the week', () => {
    const numbers = drive([[0, 'her-numbers-are-normal-so-she-can-go-home']], 10);
    expect(numbers.ids).toContain('normal-numbers-refused');
    expect(numbers.snapshot.choiceFeedback).toContain('evidence that she is resting');
    const film = drive([[0, 'there-is-no-pneumothorax-on-the-film']], 10);
    expect(film.ids).toContain('film-claim-refused');
    expect(film.snapshot.choiceFeedback).toContain('what is in the pleural space today');
    const pain = drive([[0, 'she-says-the-pain-is-manageable']], 10);
    expect(pain.ids).toContain('pain-report-refused');
    expect(pain.snapshot.choiceFeedback).toContain('most manageable and least informative');
    // The objection is to the interval and the label, not to her going home.
    const discharge = drive([[0, 'send-her-home-with-tablets-and-review-in-a-week']], 10);
    expect(discharge.ids).toContain('discharge-refused');
    expect(discharge.snapshot.choiceFeedback).toContain('Going home is not the objection');
  });

  it('never sends an admitting team that nobody asked', () => {
    const idle = drive([[0, 'record-the-fall-and-what-was-broken']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    const asked = drive([[0, 'escalate-to-the-admitting-team']], TEAM + 10);
    expect(asked.ids).toContain('team-responded');
    expect(TEAM).toBe(30 * 60 * 10);
    expect(STOP).toBe(120 * 60 * 10);
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-the-fall-and-what-was-broken'], [1, 'record-what-comfortable-at-rest-measures'],
      [2, 'record-what-the-count-predicts'], [3, 'escalate-to-the-admitting-team'],
      [4, 'record-bounded-admission-intent'], [5, 'review-boundaries'], [6, 'reassess'],
      [FAMILY + 20, 'handoff']];
    expect(drive(stale, FAMILY + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 18030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 18040);
    expect(recovered.snapshot.normalNumbersAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with takeover', () => {
    expect(FAMILY).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('family-called');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'morphine', doseMg: 10 } });
    engine.apply({ tick: 0, type: 'transient-response-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'quiet-chest-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'quiet-chest-response', payload: { action: 'admit-her' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('quiet-chest-generic-action-refused');
    expect(ids).toContain('quiet-chest-action-refused');
    expect(frame.equipment.resuscitation.quietChest!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent, dose, or discharge date after ANY action', () => {
    const forbidden = ['morphine', 'paracetamol', 'ibuprofen', 'fentanyl', 'oxycodone',
      'mg/kg', 'milligram', 'discharge on'];
    for (const action of QUIET_CHEST_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'quiet-chest-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.quietChest!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  // The lesson only works while nobody knows whether anything will go wrong. Asserting the
  // complication would answer the question the learner is meant to act without an answer to.
  it('never asserts that she will develop a complication', () => {
    for (const action of QUIET_CHEST_ACTIONS) {
      const run = drive([[0, action]], FAMILY + 20);
      const text = (run.snapshot.choiceFeedback ?? '').toLowerCase();
      expect(text, action).not.toContain('she will develop');
      expect(text, action).not.toContain('she has pneumonia');
      expect(text, action).not.toContain('will get pneumonia');
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(QUIET_CHEST_ACTIONS).size).toBe(QUIET_CHEST_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
