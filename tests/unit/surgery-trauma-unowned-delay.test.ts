import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { UNOWNED_DELAY_A_WAIT_THAT_NOBODY_DECIDED as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/unowned-delay-a-wait-that-nobody-decided';
import { UNOWNED_DELAY_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/unowned-delay-fixtures';
import { UnownedDelay } from '../../src/modules/surgery-trauma/unowned-delay';
import { UNOWNED_DELAY_LIST_TICKS as LIST, UNOWNED_DELAY_TEAM_TICKS as TEAM, UNOWNED_DELAY_TAKEOVER_TICKS as STOP, UNOWNED_DELAY_ACTIONS, type UnownedDelayAction } from '../../src/modules/surgery-trauma/unowned-delay';

type Choices = readonly (readonly [number, UnownedDelayAction])[];

function drive(actions: Choices, until: number) {
  const model = new UnownedDelay();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Surgery and trauma unowned-delay contract', () => {
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

  // The observations are the admission observations and they never move. That is the
  // mechanism of the case: there was never a number for anybody to react to.
  it('holds every observation at the admission values while only the clock moves', () => {
    for (const until of [10, LIST + 10, TEAM + 10, STOP - 10]) {
      const run = drive([[0, 'check-observations']], until);
      expect(run.snapshot.observationRecord).toMatchObject({
        heartRateBpm: 92, systolicMmHg: 132, respiratoryRateBpm: 18, spo2Percent: 95,
      });
    }
    expect(drive([], LIST + 10).model.vitals()).toEqual(new UnownedDelay().vitals());
    const before = drive([], 10).snapshot;
    expect([before.hoursSinceAdmission, before.cancellations, before.fastedHours]).toEqual([42, 2, 13]);
    const after = drive([], LIST + 20).snapshot;
    expect([after.hoursSinceAdmission, after.cancellations, after.fastedHours]).toEqual([48, 3, 19]);
  });

  // The investigation is never booked and no clinical question is ever documented, in any
  // state. If either changed, the lesson would become a case about clinical uncertainty.
  it('never books the investigation and never acquires an outstanding clinical question', () => {
    for (const until of [10, LIST + 10, TEAM + 10, STOP - 10]) {
      const snapshot = drive([[0, 'check-delay-record']], until).snapshot;
      expect(snapshot.echoRequested).toBe(true);
      expect(snapshot.echoBooked).toBe(false);
      expect(snapshot.echoRequesterNamed).toBe(false);
      expect(snapshot.medicalQuestionOutstanding).toBe(false);
      expect(snapshot.delayRecord!.echoBooked).toBe(false);
    }
  });

  it('records the missing authors as missing', () => {
    const text = drive([[0, 'record-what-each-delay-was-for']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('by nobody the record names');
    expect(text).toContain('not one of them has an author');
  });

  it('separates what is outstanding from what is merely still written down', () => {
    const text = drive([[0, 'record-what-is-still-being-waited-for']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('What remains is a slot');
    expect(text).toContain('two different telephone calls');
  });

  // The randomised trial is the half that undercuts the lesson's own urgency, and it is kept.
  it('keeps the randomised result that contradicts the observational signal', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('42,230');
    expect(text).toContain('0.81');
    expect(text).toContain('found no significant difference in mortality at 90 days');
    expect(text).toContain('accelerating an already prompt pathway has not been shown to help');
  });

  it('refuses the gate, the shrug, the one more night, and the speculative fast', () => {
    const echo = drive([[0, 'she-is-not-fit-until-the-echo-is-done']], 10);
    expect(echo.ids).toContain('echo-gate-refused');
    expect(echo.snapshot.choiceFeedback).toContain('not a gate; it is a delay with a clinical-sounding label');
    // The constraint is real; what is refused is filing the wait under nobody.
    const list = drive([[0, 'the-list-is-full-so-it-is-out-of-our-hands']], 10);
    expect(list.ids).toContain('list-full-refused');
    expect(list.snapshot.choiceFeedback).toContain('not to the constraint, which is real');
    const night = drive([[0, 'one-more-night-will-not-make-a-difference']], 10);
    expect(night.ids).toContain('one-more-night-refused');
    expect(night.snapshot.choiceFeedback).toContain('the sentence that produced the first two nights');
    const fasted = drive([[0, 'keep-her-fasted-in-case-a-slot-appears']], 10);
    expect(fasted.ids).toContain('keep-fasted-refused');
    expect(fasted.snapshot.choiceFeedback).toContain('a cost paid by the patient to preserve somebody else’s option');
  });

  it('never sends a list team that nobody asked, and answers quickly when asked', () => {
    const idle = drive([[0, 'record-the-fracture-and-the-clock']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    const asked = drive([[0, 'escalate-to-the-team-that-owns-the-list']], TEAM + 10);
    expect(asked.ids).toContain('team-responded');
    // Twelve minutes, on purpose: the uncomfortable finding is that nobody was refusing.
    expect(TEAM).toBe(12 * 60 * 10);
    expect(STOP).toBe(60 * 60 * 10);
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-the-fracture-and-the-clock'], [1, 'record-what-each-delay-was-for'],
      [2, 'record-what-is-still-being-waited-for'], [3, 'escalate-to-the-team-that-owns-the-list'],
      [4, 'record-bounded-scheduling-intent'], [5, 'review-boundaries'], [6, 'reassess'],
      [LIST + 20, 'handoff']];
    expect(drive(stale, LIST + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 7230);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 7240);
    expect(recovered.snapshot.echoGateAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with takeover', () => {
    expect(LIST).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('list-lost');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'morphine', doseMg: 10 } });
    engine.apply({ tick: 0, type: 'quiet-chest-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'unowned-delay-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'unowned-delay-response', payload: { action: 'book-the-slot' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('unowned-delay-generic-action-refused');
    expect(ids).toContain('unowned-delay-action-refused');
    expect(frame.equipment.resuscitation.unownedDelay!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent, dose, theatre time, or technique after ANY action', () => {
    const forbidden = ['morphine', 'propofol', 'spinal anaesthetic', 'hemiarthroplasty',
      'mg/kg', 'milligram', 'nil by mouth from'];
    for (const action of UNOWNED_DELAY_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'unowned-delay-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.unownedDelay!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  // The randomised evidence in this lesson would not support a claim of harm, so the engine
  // must never make one. What it asserts is only that the wait has no author.
  it('never asserts that the delay has harmed her', () => {
    for (const action of UNOWNED_DELAY_ACTIONS) {
      const run = drive([[0, action]], LIST + 20);
      const text = (run.snapshot.choiceFeedback ?? '').toLowerCase();
      expect(text, action).not.toContain('the delay has harmed');
      expect(text, action).not.toContain('she has been harmed');
      expect(text, action).not.toContain('will die');
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(UNOWNED_DELAY_ACTIONS).size).toBe(UNOWNED_DELAY_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
