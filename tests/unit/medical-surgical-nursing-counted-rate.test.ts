import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { COUNTED_RATE_A_NUMBER_NOBODY_COUNTED as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/counted-rate-a-number-nobody-counted';
import { COUNTED_RATE_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/counted-rate-fixtures';
import { CountedRate, COUNTED_RATE_CHARTED_TREND as CHARTED, COUNTED_RATE_COUNTED_VALUE as COUNTED,
  COUNTED_RATE_REVIEW_TICKS as REVIEW, COUNTED_RATE_TAKEOVER_TICKS as STOP,
  COUNTED_RATE_ACTIONS, type CountedRateAction } from '../../src/modules/medical-surgical-nursing/counted-rate';

type Choices = readonly (readonly [number, CountedRateAction])[];

function drive(actions: Choices, until: number) {
  const model = new CountedRate();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Nursing counted respiratory rate contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'medical-surgical-nursing', 'ward', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The clustering is the finding, so it has to be real in the data rather than only in the prose.
  it('charts six entries taking exactly two distinct values', () => {
    expect(CHARTED).toHaveLength(6);
    expect(new Set(CHARTED).size).toBe(2);
    expect([...new Set(CHARTED)].sort()).toEqual([18, 20]);
    expect(COUNTED).toBe(28);
  });

  it('withholds the counted rate until somebody counts', () => {
    expect(drive([], 100).snapshot.countedRate).toBeNull();
    expect(drive([[0, 'check-chart']], 10).snapshot.countedRate).toBeNull();
    expect(drive([[0, 'count-for-a-full-minute']], 10).snapshot.countedRate).toBe(COUNTED);
  });

  it('never changes the charted column, whatever happens', () => {
    for (const run of [drive([], 100), drive([[0, 'count-for-a-full-minute']], 100),
      drive(FIXTURES.expert, 36030), drive([], STOP + 10)]) {
      expect(run.snapshot.chartedEntries).toEqual([...CHARTED]);
    }
  });

  it('refuses a discrepancy or an escalation before anything is counted', () => {
    const early = drive([[0, 'record-the-discrepancy'], [1, 'escalate-on-the-counted-value']], 20);
    expect(early.ids).toContain('discrepancy-refused');
    expect(early.ids).toContain('escalation-refused');
    expect(early.snapshot.discrepancyRecordedAtTick).toBeNull();
    expect(early.snapshot.escalationAtTick).toBeNull();
    expect(early.snapshot.choiceFeedback).toContain('escalating on the estimate');
  });

  it('records both numbers without reconciling them', () => {
    const run = drive([[0, 'count-for-a-full-minute'], [1, 'record-the-discrepancy']], 10);
    const text = run.snapshot.choiceFeedback!;
    expect(text).toContain('does not reconcile them');
    expect(text).toContain('stay as they were written');
    expect(text).toContain('The discrepancy is the finding');
  });

  it('refuses the four shortcuts, including amending another clinician\'s entries', () => {
    const trend = drive([[0, 'trust-the-flat-trend']], 10);
    expect(trend.ids).toContain('trend-refused');
    expect(trend.snapshot.choiceFeedback).toContain('signature of estimation');
    const monitor = drive([[0, 'chart-the-monitor-value']], 10);
    expect(monitor.ids).toContain('monitor-refused');
    // The lesson must not overclaim: equivalence is unknown, not disproven.
    expect(monitor.snapshot.choiceFeedback).toContain('not established in the retrievable evidence');
    const rounded = drive([[0, 'round-to-the-previous-entry']], 10);
    expect(rounded.ids).toContain('rounding-refused');
    const edit = drive([[0, 'correct-the-earlier-entries']], 10);
    expect(edit.ids).toContain('retrospective-edit-refused');
    expect(edit.snapshot.choiceFeedback).toContain('destroy the only evidence');
    expect(edit.snapshot.retrospectiveEditAttempted).toBe(true);
    expect(edit.snapshot.chartedEntries).toEqual([...CHARTED]);
  });

  it('never sends a review that nobody requested', () => {
    const idle = drive([[0, 'count-for-a-full-minute']], REVIEW + 6000);
    expect(idle.ids).not.toContain('review-arrived');
    const called = drive([[0, 'count-for-a-full-minute'], [1, 'escalate-on-the-counted-value']], REVIEW + 10);
    expect(called.ids).toContain('review-arrived');
    expect(called.snapshot.reviewArrived).toBe(true);
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    // Counting changes what is known, so a reassessment taken before it cannot satisfy handoff.
    const stale: Choices = [[0, 'review-the-charted-trend'], [1, 'reassess'],
      [2, 'count-for-a-full-minute'], [3, 'record-the-discrepancy'],
      [4, 'escalate-on-the-counted-value'], [5, 'review-boundaries'], [6, 'monitor'], [7, 'handoff']];
    expect(drive(stale, 20).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 36030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.reviewObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 36040);
    expect(recovered.snapshot.trendTrusted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'review-the-charted-trend'], [5000, 'review-the-charted-trend']], 5010);
    expect(twice.ids.filter((id) => id === 'trend-reviewed')).toHaveLength(1);
    expect(twice.snapshot.trendReviewedAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover', () => {
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
    expect(run.snapshot.countedRate).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and the sibling lesson', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'oxygen', doseMg: 1 } });
    engine.apply({ tick: 0, type: 'low-score-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'counted-rate-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'counted-rate-response', payload: { action: 'give-oxygen' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('counted-rate-generic-action-refused');
    expect(ids).toContain('counted-rate-action-refused');
    expect(frame.equipment.resuscitation.countedRate!.monitoringAtTick).toBeNull();
  });

  it('names no agent or dose after ANY action', () => {
    const forbidden = ['salbutamol', 'morphine', 'naloxone', 'mg/kg', 'litres per minute'];
    for (const action of COUNTED_RATE_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'counted-rate-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.countedRate!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(COUNTED_RATE_ACTIONS).size).toBe(COUNTED_RATE_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
