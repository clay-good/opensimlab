import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { NEGATIVE_SCAN_A_SCAN_THAT_CANNOT_SAY_NO as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/negative-scan-a-scan-that-cannot-say-no';
import { NEGATIVE_SCAN_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/negative-scan-fixtures';
import { NegativeScan } from '../../src/modules/surgery-trauma/negative-scan';
import { NEGATIVE_SCAN_ROUND_TICKS as ROUND, NEGATIVE_SCAN_TEAM_TICKS as TEAM, NEGATIVE_SCAN_TAKEOVER_TICKS as STOP, NEGATIVE_SCAN_ACTIONS, type NegativeScanAction } from '../../src/modules/surgery-trauma/negative-scan';

type Choices = readonly (readonly [number, NegativeScanAction])[];

function drive(actions: Choices, until: number) {
  const model = new NegativeScan();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Surgery and trauma negative-scan contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'surgery-trauma', 'ward', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
    // The lesson now carries observed-state guidance and a learner-paused example, and the
    // audit claims it only because the product actually offers one.
    expect(audit.requirements.find((entry) => entry.id === 'guidance-and-demonstration')?.status)
      .toBe('satisfied');
  });

  // The lesson only works while the operation stays the reference and the scan stays reported as
  // negative. Either one drifting would dissolve the problem being taught.
  it('holds the operation, the day, and the reported scan constant in every state', () => {
    for (const until of [10, ROUND + 10, TEAM + 10, STOP - 10]) {
      const run = drive([[0, 'check-operative-record']], until);
      expect(run.snapshot.postoperativeDay).toBe(5);
      expect(run.snapshot.imagingReportedNegative).toBe(true);
      expect(run.snapshot.flatusPassed).toBe(false);
      expect(run.snapshot.operativeRecord!.diverted).toBe(false);
      expect(run.snapshot.operativeRecord!.imagingReport).toContain('no evidence of an anastomotic leak');
    }
  });

  it('records the operation as the course the observations are read against', () => {
    const text = drive([[0, 'record-the-operative-course']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('the frame everything else is read against');
    expect(text).toContain('the reference the observations mean nothing without');
  });

  it('records a trajectory with a duration rather than a reading', () => {
    const text = drive([[0, 'record-the-failure-to-progress']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('36 hours');
    expect(text).toContain('4 to 11 percent');
    expect(text).toContain('stopped following his own operation');
  });

  it('states what the report says rather than what it is heard to say', () => {
    const text = drive([[0, 'record-what-the-scan-excludes']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('not the same sentence as no leak');
    expect(text).toContain('0.59');
    expect(text).toContain('0.70');
    // Both published sensitivities are carried; neither is presented as the value.
    expect(text).toContain('73 percent');
  });

  it('carries both literatures without turning either into a decision rule', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('452');
    expect(text).toContain('not a licence to ignore a patient');
    expect(text).toContain('62.5 percent');
    expect(text).toContain('none of them tells you what is happening in this abdomen');
  });

  it('never sends an operating team that nobody contacted', () => {
    const idle = drive([[0, 'record-the-operative-course']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    expect(idle.snapshot.teamResponded).toBe(false);
    const called = drive([[0, 'escalate-to-the-operating-team']], TEAM + 10);
    expect(called.ids).toContain('team-responded');
    expect(called.snapshot.teamResponded).toBe(true);
  });

  it('advances the clock without letting the observations rescue the learner', () => {
    const run = drive([[0, 'record-the-operative-course'], [ROUND + 10, 'check-observations']], ROUND + 20);
    expect(run.ids).toContain('round-completed');
    expect(run.snapshot.tachycardiaHours).toBe(37);
    const before = new NegativeScan().vitals();
    expect(run.model.vitals()).toEqual(before);
    expect(run.snapshot.observationRecord!.heartRateBpm).toBe(110);
  });

  it('refuses both reflexes and both ways of deferring', () => {
    const exclusion = drive([[0, 'the-scan-was-negative-so-it-is-not-a-leak']], 10);
    expect(exclusion.ids).toContain('scan-exclusion-refused');
    expect(exclusion.snapshot.choiceFeedback).toContain('says no evidence of one rather than none');
    // The dismissal is refused on its inference, not on its premise, which is correct.
    const routine = drive([[0, 'abnormal-vitals-are-routine-after-bowel-surgery']], 10);
    expect(routine.ids).toContain('routine-dismissal-refused');
    expect(routine.snapshot.choiceFeedback).toContain('The premise is right and the conclusion does not follow');
    const rescan = drive([[0, 'repeat-the-scan-tomorrow-and-review-then']], 10);
    expect(rescan.ids).toContain('rescan-deferral-refused');
    expect(rescan.snapshot.choiceFeedback).toContain('the harm being avoided is measured in the delay itself');
    const numbers = drive([[0, 'treat-the-numbers-and-watch-overnight']], 10);
    expect(numbers.ids).toContain('treat-the-numbers-refused');
    expect(numbers.snapshot.choiceFeedback).toContain('harder to read');
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-the-operative-course'], [1, 'record-the-failure-to-progress'],
      [2, 'record-what-the-scan-excludes'], [3, 'escalate-to-the-operating-team'],
      [4, 'record-bounded-surgical-intent'], [5, 'review-boundaries'], [6, 'reassess'],
      [TEAM + 20, 'handoff']];
    expect(drive(stale, TEAM + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 63030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 63040);
    expect(recovered.snapshot.scanExclusionAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('hands off honestly when the operating team has not answered', () => {
    const unanswered: Choices = [[0, 'record-the-operative-course'], [1, 'record-the-failure-to-progress'],
      [2, 'record-what-the-scan-excludes'], [3, 'escalate-to-the-operating-team'],
      [4, 'record-bounded-surgical-intent'], [5, 'review-boundaries'], [6, 'reassess'], [7, 'handoff']];
    const run = drive(unanswered, 8);
    expect(run.snapshot.ended).toBe('handoff');
    expect(run.snapshot.choiceFeedback).toContain('has not yet answered');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'record-the-operative-course'], [ROUND + 20, 'record-the-operative-course']], ROUND + 30);
    expect(twice.ids.filter((id) => id === 'operative-course-recorded')).toHaveLength(1);
    expect(twice.snapshot.operativeCourseRecordedAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover', () => {
    expect(ROUND).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('round-completed');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'piperacillin', doseMg: 4500 } });
    engine.apply({ tick: 0, type: 'low-score-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'negative-scan-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'negative-scan-response', payload: { action: 'book-theatre' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('negative-scan-generic-action-refused');
    expect(ids).toContain('negative-scan-action-refused');
    expect(frame.equipment.resuscitation.negativeScan!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent, dose, or operation after ANY action', () => {
    const forbidden = ['piperacillin', 'tazobactam', 'metronidazole', 'gentamicin', 'meropenem',
      'laparotomy', 'hartmann', 'mg/kg', 'milligram'];
    for (const action of NEGATIVE_SCAN_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'negative-scan-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.negativeScan!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(NEGATIVE_SCAN_ACTIONS).size).toBe(NEGATIVE_SCAN_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
