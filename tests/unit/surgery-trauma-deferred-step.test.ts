import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { DEFERRED_STEP_A_DECISION_ATTACHED_TO_A_PERSON as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/deferred-step-a-decision-attached-to-a-person';
import { DEFERRED_STEP_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/deferred-step-fixtures';
import { DeferredStep } from '../../src/modules/surgery-trauma/deferred-step';
import { DEFERRED_STEP_SLIP_TICKS as SLIP, DEFERRED_STEP_TEAM_TICKS as TEAM, DEFERRED_STEP_TAKEOVER_TICKS as STOP, DEFERRED_STEP_ACTIONS, type DeferredStepAction } from '../../src/modules/surgery-trauma/deferred-step';

type Choices = readonly (readonly [number, DeferredStepAction])[];

function drive(actions: Choices, until: number) {
  const model = new DeferredStep();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Surgery and trauma deferred-step contract', () => {
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

  it('holds every observation normal while only the two clocks move', () => {
    for (const until of [10, SLIP + 10, TEAM + 10, STOP - 10]) {
      const run = drive([[0, 'check-observations']], until);
      expect(run.snapshot.observationRecord).toMatchObject({
        heartRateBpm: 88, systolicMmHg: 124, respiratoryRateBpm: 16, spo2Percent: 98,
      });
    }
    expect(drive([], SLIP + 20).model.vitals()).toEqual(new DeferredStep().vitals());
    const before = drive([], 10).snapshot;
    expect([before.minutesSinceInjury, before.minutesSinceArrival]).toEqual([47, 28]);
    const after = drive([], SLIP + 20).snapshot;
    expect([after.minutesSinceInjury, after.minutesSinceArrival]).toEqual([55, 36]);
  });

  // The two clocks differ by nineteen minutes throughout. Using the wrong one is the quiet
  // arithmetic error the lesson exists to expose, so the gap is pinned.
  it('keeps the injury clock and the arrival clock nineteen minutes apart in every state', () => {
    for (const until of [10, SLIP + 10, TEAM + 10]) {
      const snapshot = drive([], until).snapshot;
      expect(snapshot.minutesSinceInjury - snapshot.minutesSinceArrival).toBe(19);
    }
  });

  // Nothing is ever given, nobody ever objects, and the limb itself is never the problem.
  it('never gives the step and never acquires an objection', () => {
    for (const until of [10, SLIP + 10, TEAM + 10, STOP - 10]) {
      const snapshot = drive([[0, 'check-wound-record']], until).snapshot;
      expect(snapshot.antibioticGiven).toBe(false);
      expect(snapshot.objectionRecorded).toBe(false);
      expect(snapshot.pulsesPresent).toBe(true);
      expect(snapshot.woundRecord!.allergyDocumented).toBe(false);
    }
  });

  it('records the outstanding step as outstanding rather than as a plan', () => {
    const text = drive([[0, 'record-the-step-that-is-waiting']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('she has had no antibiotic');
    expect(text).toContain('as an outstanding step rather than as part of a plan');
  });

  // The finding is the attachment, and the engine must say nobody is at fault while naming it.
  it('records the attachment as the finding and blames nobody', () => {
    const text = drive([[0, 'record-what-the-interval-is-attached-to']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('the moment a particular person becomes free');
    expect(text).toContain('nobody in the sentence is doing anything wrong');
  });

  it('keeps both thresholds and says they are measured from different moments', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('66 minutes from injury');
    expect(text).toContain('120 minutes from arrival');
    expect(text).toContain('p equals 0.053');
    expect(text).toContain('there is no stopwatch here');
  });

  it('refuses the review gate, the stability, the morning chart, and theatre', () => {
    const review = drive([[0, 'orthopaedics-will-give-them-when-they-review-her']], 10);
    expect(review.ids).toContain('review-gate-refused');
    expect(review.snapshot.choiceFeedback).toContain('The review is worth having and it is theirs to do');
    const hurry = drive([[0, 'she-is-stable-so-there-is-no-hurry']], 10);
    expect(hurry.ids).toContain('no-hurry-refused');
    expect(hurry.snapshot.choiceFeedback).toContain('the reason this delay is comfortable, not evidence that it is safe');
    const chart = drive([[0, 'it-can-go-on-the-morning-drug-chart']], 10);
    expect(chart.ids).toContain('morning-chart-refused');
    expect(chart.snapshot.choiceFeedback).toContain('converts an outstanding step into a completed piece of administration');
    const theatre = drive([[0, 'wait-until-she-is-in-theatre-anyway']], 10);
    expect(theatre.ids).toContain('theatre-refused');
    expect(theatre.snapshot.choiceFeedback).toContain('the same error as attaching it to the review');
  });

  it('never sends a team that nobody called, and answers fastest in the module when called', () => {
    const idle = drive([[0, 'record-the-injury-and-the-clock']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    const called = drive([[0, 'escalate-to-the-team-that-can-prescribe']], TEAM + 10);
    expect(called.ids).toContain('team-responded');
    // Six minutes, and a thirty-minute takeover: both the fastest in the module, because what
    // is asked for is a telephone decision inside a window measured in minutes. The slip has
    // to come first, or the reply would arrive before the lesson's authored beat could land.
    expect(TEAM).toBe(6 * 60 * 10);
    expect(STOP).toBe(30 * 60 * 10);
    expect(SLIP).toBeLessThan(TEAM);
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-the-injury-and-the-clock'], [1, 'record-the-step-that-is-waiting'],
      [2, 'record-what-the-interval-is-attached-to'], [3, 'escalate-to-the-team-that-can-prescribe'],
      [4, 'record-bounded-prescribing-intent'], [5, 'review-boundaries'], [6, 'reassess'],
      [SLIP + 20, 'handoff']];
    expect(drive(stale, SLIP + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 4830);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 4840);
    expect(recovered.snapshot.reviewGateAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with takeover', () => {
    expect(SLIP).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('review-slipped');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'morphine', doseMg: 10 } });
    engine.apply({ tick: 0, type: 'third-attendance-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'deferred-step-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'deferred-step-response', payload: { action: 'give-the-antibiotic' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('deferred-step-generic-action-refused');
    expect(ids).toContain('deferred-step-action-refused');
    expect(frame.equipment.resuscitation.deferredStep!.boundariesReviewedAtTick).toBeNull();
  });

  // The whole lesson is about an antibiotic and it must never name one, or a dose, or a route.
  it('names no agent, dose, route, or dressing after ANY action', () => {
    const forbidden = ['co-amoxiclav', 'cefazolin', 'cefuroxime', 'gentamicin', 'flucloxacillin',
      'vancomycin', 'mg/kg', 'milligram', 'intravenously at', 'grams'];
    for (const action of DEFERRED_STEP_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'deferred-step-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.deferredStep!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  // Two things would ruin the lesson: predicting the infection, and blaming the registrar.
  it('never predicts an infection and never blames the registrar', () => {
    for (const action of DEFERRED_STEP_ACTIONS) {
      const text = (drive([[0, action]], SLIP + 20).snapshot.choiceFeedback ?? '').toLowerCase();
      expect(text, action).not.toContain('she will become infected');
      expect(text, action).not.toContain('will get infected');
      expect(text, action).not.toContain('the registrar should have');
      expect(text, action).not.toContain('orthopaedics failed');
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(DEFERRED_STEP_ACTIONS).size).toBe(DEFERRED_STEP_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
