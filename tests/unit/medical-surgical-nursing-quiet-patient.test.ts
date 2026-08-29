import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { QUIET_PATIENT_A_SCREEN_THAT_WAS_NEVER_DONE as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/quiet-patient-a-screen-that-was-never-done';
import { QUIET_PATIENT_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/quiet-patient-fixtures';
import { QuietPatient, QUIET_PATIENT_CHARTED_IMPRESSIONS as IMPRESSIONS,
  QUIET_PATIENT_HANDOVER_TICKS as HANDOVER, QUIET_PATIENT_REVIEW_TICKS as REVIEW,
  QUIET_PATIENT_TAKEOVER_TICKS as STOP,
  QUIET_PATIENT_ACTIONS, type QuietPatientAction } from '../../src/modules/medical-surgical-nursing/quiet-patient';

type Choices = readonly (readonly [number, QuietPatientAction])[];

function drive(actions: Choices, until: number) {
  const model = new QuietPatient();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Nursing delirium screening contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'medical-surgical-nursing', 'ward', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // Zero is the finding. An impression must never be countable as a screening result.
  it('counts no screening result until one is actually recorded', () => {
    expect(IMPRESSIONS).toHaveLength(3);
    expect(drive([], 100).snapshot.recordedScreenResults).toBe(0);
    expect(drive([[0, 'review-the-charted-impression']], 10).snapshot.recordedScreenResults).toBe(0);
    // Screening alone is not recording; the count moves only when the result is written down.
    expect(drive([[0, 'screen-for-arousal']], 10).snapshot.recordedScreenResults).toBe(0);
    const recorded = drive([[0, 'screen-for-arousal'], [1, 'record-the-screen-result']], 10);
    expect(recorded.snapshot.recordedScreenResults).toBe(1);
  });

  it('names the record as holding no screen rather than a negative one', () => {
    const text = drive([[0, 'review-the-charted-impression']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('there is no screen in this record');
    expect(text).toContain('Absence of a positive finding is not the same as a negative finding');
  });

  it('refuses recording or escalating before any screen is performed', () => {
    const early = drive([[0, 'record-the-screen-result'], [1, 'escalate-on-the-positive-screen']], 20);
    expect(early.ids).toContain('result-refused');
    expect(early.ids).toContain('escalation-refused');
    expect(early.snapshot.resultRecordedAtTick).toBeNull();
    expect(early.snapshot.escalationAtTick).toBeNull();
    expect(early.snapshot.choiceFeedback).toContain('Escalating on an impression is the pattern this lesson is about');
  });

  it('leaves the earlier impressions untouched when the result is recorded', () => {
    const run = drive([[0, 'screen-for-arousal'], [1, 'record-the-screen-result']], 10);
    expect(run.snapshot.chartedImpressions).toEqual([...IMPRESSIONS]);
    expect(run.snapshot.choiceFeedback).toContain('rather than replacing them');
  });

  it('refuses the four shortcuts with sourced reasons', () => {
    const defer = drive([[0, 'let-them-sleep-and-screen-later']], 10);
    expect(defer.ids).toContain('deferral-refused');
    expect(defer.snapshot.choiceFeedback).toContain('Impaired arousal is a scoreable component');
    const quiet = drive([[0, 'quiet-is-settled']], 10);
    expect(quiet.ids).toContain('quiet-refused');
    expect(quiet.snapshot.choiceFeedback).toContain('most frequently missed');
    const earlier = drive([[0, 'negative-earlier-screen-excludes']], 10);
    expect(earlier.ids).toContain('earlier-screen-refused');
    expect(earlier.snapshot.choiceFeedback).toContain('there is no earlier screen to rely on');
    const mood = drive([[0, 'call-it-low-mood']], 10);
    expect(mood.ids).toContain('mood-refused');
    expect(mood.snapshot.choiceFeedback).toContain('misread as depression');
  });

  it('repeats the handover in the same words while nothing is screened', () => {
    const run = drive([[0, 'review-the-charted-impression']], HANDOVER + 10);
    expect(run.ids).toContain('handover-repeated');
    expect(run.snapshot.handoverRepeated).toBe(true);
    expect(run.snapshot.recordedScreenResults).toBe(0);
  });

  it('never sends a review that nobody requested', () => {
    const idle = drive([[0, 'screen-for-arousal']], REVIEW + 6000);
    expect(idle.ids).not.toContain('review-arrived');
    const called = drive([[0, 'screen-for-arousal'], [1, 'escalate-on-the-positive-screen']], REVIEW + 20);
    expect(called.ids).toContain('review-arrived');
    expect(called.snapshot.reviewArrived).toBe(true);
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    // Screening changes what is known, so a reassessment before it cannot satisfy handoff.
    const stale: Choices = [[0, 'review-the-charted-impression'], [1, 'reassess'],
      [2, 'screen-for-arousal'], [3, 'record-the-screen-result'],
      [4, 'escalate-on-the-positive-screen'], [5, 'review-boundaries'], [6, 'monitor'], [7, 'handoff']];
    expect(drive(stale, 20).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 36030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.reviewObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 36040);
    expect(recovered.snapshot.deferralAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'review-the-charted-impression'], [5000, 'review-the-charted-impression']], 5010);
    expect(twice.ids.filter((id) => id === 'impressions-reviewed')).toHaveLength(1);
    expect(twice.snapshot.impressionsReviewedAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover and no screen', () => {
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('handover-repeated');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.recordedScreenResults).toBe(0);
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and sibling lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'haloperidol', doseMg: 1 } });
    engine.apply({ tick: 0, type: 'afferent-limb-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'quiet-patient-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'quiet-patient-response', payload: { action: 'sedate' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('quiet-patient-generic-action-refused');
    expect(ids).toContain('quiet-patient-action-refused');
    expect(frame.equipment.resuscitation.quietPatient!.monitoringAtTick).toBeNull();
  });

  it('names no agent or dose after ANY action', () => {
    // Antipsychotics are the obvious wrong turn in a delirium lesson; none may appear.
    const forbidden = ['haloperidol', 'olanzapine', 'lorazepam', 'quetiapine', 'mg/kg', 'milligram'];
    for (const action of QUIET_PATIENT_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'quiet-patient-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.quietPatient!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(QUIET_PATIENT_ACTIONS).size).toBe(QUIET_PATIENT_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
