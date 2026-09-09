import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { THIRD_ATTENDANCE_A_QUESTION_TWO_PEOPLE_HAVE_ALREADY_ANSWERED as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/third-attendance-a-question-two-people-have-already-answered';
import { THIRD_ATTENDANCE_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/third-attendance-fixtures';
import { ThirdAttendance } from '../../src/modules/surgery-trauma/third-attendance';
import { THIRD_ATTENDANCE_COLLEAGUE_TICKS as COLLEAGUE, THIRD_ATTENDANCE_TEAM_TICKS as TEAM, THIRD_ATTENDANCE_TAKEOVER_TICKS as STOP, THIRD_ATTENDANCE_ACTIONS, type ThirdAttendanceAction } from '../../src/modules/surgery-trauma/third-attendance';

type Choices = readonly (readonly [number, ThirdAttendanceAction])[];

function drive(actions: Choices, until: number) {
  const model = new ThirdAttendance();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Surgery and trauma third-attendance contract', () => {
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

  it('holds every observation still, before and after the colleague speaks', () => {
    for (const until of [10, COLLEAGUE + 10, TEAM + 10, STOP - 10]) {
      const run = drive([[0, 'check-observations']], until);
      expect(run.snapshot.observationRecord).toMatchObject({
        heartRateBpm: 96, systolicMmHg: 118, respiratoryRateBpm: 16, coreTemperatureC: 37.4,
      });
    }
    expect(drive([], COLLEAGUE + 20).model.vitals()).toEqual(new ThirdAttendance().vitals());
  });

  // The authored beat makes the position harder and brings no new fact. That is the whole
  // difference between this holding lesson and the module's other three.
  it('changes only the pressure, never the patient', () => {
    const before = drive([], 10).snapshot;
    expect(before.colleagueSpoke).toBe(false);
    const run = drive([[0, 'record-the-attendances-and-what-each-found']], COLLEAGUE + 20);
    expect(run.ids).toContain('colleague-spoke');
    expect(run.snapshot.colleagueSpoke).toBe(true);
    expect(run.snapshot.attendances).toBe(before.attendances);
    expect(run.snapshot.painLocalised).toBe(before.painLocalised);
    expect(run.snapshot.imagingPerformed).toBe(false);
  });

  it('records what a previous assessment can and cannot say', () => {
    const text = drive([[0, 'record-what-a-previous-assessment-can-say']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('neither clinician did anything wrong');
    expect(text).toContain('does not lower the probability that something is there now');
  });

  it('records the comparison across three examinations rather than one state', () => {
    const text = drive([[0, 'record-what-has-changed-since-the-last-visit']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('as a comparison rather than as a snapshot');
    expect(text).toContain('no single one of them contains it');
  });

  it('keeps the source that argues against the instinct the case produces', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('6.0 percent');
    expect(text).toContain('1.85 percent against 2.48');
    expect(text).toContain('coming back is common, and it is not by itself evidence that anybody missed anything');
  });

  it('refuses the two answers, the label, the explanation, and the repeated advice', () => {
    const seen = drive([[0, 'she-has-been-seen-twice-already']], 10);
    expect(seen.ids).toContain('seen-twice-refused');
    expect(seen.snapshot.choiceFeedback).toContain('a fact about the department');
    const settling = drive([[0, 'the-notes-say-it-was-settling']], 10);
    expect(settling.ids).toContain('settling-claim-refused');
    expect(settling.snapshot.choiceFeedback).toContain('did not have Thursday');
    const anxious = drive([[0, 'she-is-anxious-and-keeps-coming-back']], 10);
    expect(anxious.ids).toContain('anxious-claim-refused');
    expect(anxious.snapshot.choiceFeedback).toContain('makes a fourth attendance harder for her');
    // The objection is to repeating an instruction she has already obeyed, not to discharge.
    const advice = drive([[0, 'discharge-her-with-the-same-advice-again']], 10);
    expect(advice.ids).toContain('same-advice-refused');
    expect(advice.snapshot.choiceFeedback).toContain('Going home may still be right and it is not the objection');
  });

  // Nothing in this lesson may read as blaming the two previous clinicians.
  it('never criticises either previous clinician, after any action', () => {
    for (const action of THIRD_ATTENDANCE_ACTIONS) {
      const text = (drive([[0, action]], COLLEAGUE + 20).snapshot.choiceFeedback ?? '').toLowerCase();
      for (const claim of ['should have', 'negligent', 'got it wrong', 'failed to', 'missed it']) {
        expect(text, `${action} carried "${claim}"`).not.toContain(claim);
      }
    }
  });

  it('never sends a surgical team that nobody asked, and answers slowly when asked', () => {
    const idle = drive([[0, 'record-the-attendances-and-what-each-found']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    const asked = drive([[0, 'escalate-to-the-surgical-team']], TEAM + 10);
    expect(asked.ids).toContain('team-responded');
    // Forty minutes, so that waiting for the reply is never the winning move.
    expect(TEAM).toBe(40 * 60 * 10);
    expect(STOP).toBe(150 * 60 * 10);
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-the-attendances-and-what-each-found'], [1, 'record-what-a-previous-assessment-can-say'],
      [2, 'record-what-has-changed-since-the-last-visit'], [3, 'escalate-to-the-surgical-team'],
      [4, 'record-bounded-assessment-intent'], [5, 'review-boundaries'], [6, 'reassess'],
      [COLLEAGUE + 20, 'handoff']];
    expect(drive(stale, COLLEAGUE + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 24030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 24040);
    expect(recovered.snapshot.seenTwiceAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with takeover', () => {
    expect(COLLEAGUE).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('colleague-spoke');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'morphine', doseMg: 10 } });
    engine.apply({ tick: 0, type: 'unowned-delay-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'third-attendance-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'third-attendance-response', payload: { action: 'order-a-scan' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('third-attendance-generic-action-refused');
    expect(ids).toContain('third-attendance-action-refused');
    expect(frame.equipment.resuscitation.thirdAttendance!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent, dose, score, or operation after ANY action', () => {
    const forbidden = ['morphine', 'paracetamol', 'alvarado', 'appendicectomy',
      'appendectomy', 'mg/kg', 'milligram'];
    for (const action of THIRD_ATTENDANCE_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'third-attendance-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.thirdAttendance!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  // Naming the diagnosis would answer the question the learner is meant to hold open, and
  // would also convert two reasonable colleagues into two people who were wrong.
  it('never asserts a diagnosis and never says one was missed', () => {
    for (const action of THIRD_ATTENDANCE_ACTIONS) {
      const text = (drive([[0, action]], COLLEAGUE + 20).snapshot.choiceFeedback ?? '').toLowerCase();
      expect(text, action).not.toContain('she has appendicitis');
      expect(text, action).not.toContain('was missed');
      expect(text, action).not.toContain('this is appendicitis');
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(THIRD_ATTENDANCE_ACTIONS).size).toBe(THIRD_ATTENDANCE_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
