import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { LOW_SCORE_WHAT_THE_THRESHOLD_DOES_NOT_EXCLUDE as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/low-score-what-the-threshold-does-not-exclude';
import { LOW_SCORE_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/low-score-fixtures';
import { LowScore, LOW_SCORE_FAMILY_CONCERN_TICKS as CONCERN,
  LOW_SCORE_REVIEW_TICKS as REVIEW, LOW_SCORE_TAKEOVER_TICKS as STOP,
  LOW_SCORE_ACTIONS, type LowScoreAction } from '../../src/modules/medical-surgical-nursing/low-score';

type Choices = readonly (readonly [number, LowScoreAction])[];

function drive(actions: Choices, until: number) {
  const model = new LowScore();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Nursing low early-warning score contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'medical-surgical-nursing', 'ward', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The lesson only works if the score never rises. A drifting score would trigger the threshold
  // and make this an ordinary escalation drill.
  it('holds the score below its threshold in every state', () => {
    for (const until of [10, CONCERN + 10, REVIEW + 10, STOP - 10]) {
      const run = drive([[0, 'check-observations']], until);
      expect(run.snapshot.aggregateScore).toBe(2);
      expect(run.snapshot.belowEscalationThreshold).toBe(true);
      expect(run.snapshot.observationRecord!.aggregateScore).toBe(2);
      expect(run.snapshot.observationRecord!.respiratoryRateBpm).toBe(18);
    }
  });

  it('states plainly that nothing was done incorrectly', () => {
    const text = drive([[0, 'record-observations-and-score']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('it is 2 correctly');
    expect(text).toContain('Nothing here is a documentation failure');
  });

  it('records what the score does not exclude, with the study authors\' own claim', () => {
    const text = drive([[0, 'record-what-the-score-excludes']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('cannot definitively rule out sepsis');
    expect(text).toContain('one in eight');
    expect(text).toContain('is not a test that clears this one');
  });

  it('keeps the family report in its own words rather than as a number', () => {
    const run = drive([[0, 'record-the-family-report']], 10);
    expect(run.ids).toContain('family-report-recorded');
    const text = run.snapshot.choiceFeedback!;
    expect(text).toContain('she is not herself');
    expect(text).toContain('It is not converted into a number');
    // The snapshot must not invent a score for something the instrument does not collect.
    expect(JSON.stringify(run.snapshot)).not.toContain('familyScore');
  });

  it('never sends a review that nobody requested', () => {
    // The failure being taught is that nobody called, so nothing may arrive on its own.
    const idle = drive([[0, 'record-observations-and-score']], REVIEW + 6000);
    expect(idle.ids).not.toContain('review-arrived');
    expect(idle.snapshot.reviewArrived).toBe(false);
    const called = drive([[0, 'escalate-on-concern']], REVIEW + 10);
    expect(called.ids).toContain('review-arrived');
    expect(called.snapshot.reviewArrived).toBe(true);
  });

  it('raises the family concern again without moving the numbers', () => {
    const run = drive([[0, 'record-observations-and-score']], CONCERN + 10);
    expect(run.ids).toContain('family-concern');
    expect(run.snapshot.familyConcernRaised).toBe(true);
    expect(run.snapshot.aggregateScore).toBe(2);
  });

  it('refuses the four shortcuts with sourced reasons', () => {
    const recheck = drive([[0, 'score-is-low-so-recheck-later']], 10);
    expect(recheck.ids).toContain('recheck-refused');
    expect(recheck.snapshot.choiceFeedback).toContain('cannot definitively rule out sepsis');
    const fever = drive([[0, 'no-fever-so-not-infection']], 10);
    expect(fever.ids).toContain('fever-refused');
    expect(fever.snapshot.choiceFeedback).toContain('a third of older adults');
    const qsofa = drive([[0, 'use-qsofa-instead']], 10);
    expect(qsofa.ids).toContain('qsofa-refused');
    expect(qsofa.snapshot.choiceFeedback).toContain('strong recommendation');
    const documented = drive([[0, 'document-and-move-on']], 10);
    expect(documented.ids).toContain('documentation-refused');
    expect(documented.snapshot.choiceFeedback).toContain('under control in about half of cases');
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-observations-and-score'], [1, 'record-what-the-score-excludes'],
      [2, 'record-the-family-report'], [3, 'escalate-on-concern'], [4, 'review-boundaries'],
      [5, 'monitor'], [6, 'reassess'], [REVIEW + 20, 'handoff']];
    expect(drive(stale, REVIEW + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 66030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.reviewObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 66040);
    expect(recovered.snapshot.recheckAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'record-observations-and-score'], [CONCERN + 20, 'record-observations-and-score']], CONCERN + 30);
    expect(twice.ids.filter((id) => id === 'observations-recorded')).toHaveLength(1);
    expect(twice.snapshot.observationsRecordedAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover', () => {
    expect(CONCERN).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('family-concern');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'piperacillin-tazobactam', doseMg: 4500 } });
    engine.apply({ tick: 0, type: 'possible-sepsis-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'low-score-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'low-score-response', payload: { action: 'start-antibiotics' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('low-score-generic-action-refused');
    expect(ids).toContain('low-score-action-refused');
    expect(frame.equipment.resuscitation.lowScore!.monitoringAtTick).toBeNull();
  });

  it('names no agent or dose after ANY action', () => {
    const forbidden = ['piperacillin', 'ceftriaxone', 'vancomycin', 'paracetamol', 'mg/kg', 'milligram'];
    for (const action of LOW_SCORE_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'low-score-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.lowScore!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(LOW_SCORE_ACTIONS).size).toBe(LOW_SCORE_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
