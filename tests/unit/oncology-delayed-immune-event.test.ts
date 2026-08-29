import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { DELAYED_IMMUNE_EVENT_A_DRUG_THAT_STOPPED_MONTHS_AGO as SCENARIO } from '../../src/modules/oncology/scenarios/delayed-immune-event-a-drug-that-stopped-months-ago';
import { DELAYED_IMMUNE_EVENT_FIXTURES as FIXTURES } from '../../src/modules/oncology/delayed-immune-event-fixtures';
import { DelayedImmuneEvent } from '../../src/modules/oncology/delayed-immune-event';
import { DELAYED_IMMUNE_EVENT_COURSE_TICKS as COURSE, DELAYED_IMMUNE_EVENT_SERVICE_TICKS as SERVICE, DELAYED_IMMUNE_EVENT_TAKEOVER_TICKS as STOP, DELAYED_IMMUNE_EVENT_ACTIONS, type DelayedImmuneEventAction } from '../../src/modules/oncology/delayed-immune-event';

type Choices = readonly (readonly [number, DelayedImmuneEventAction])[];

function drive(actions: Choices, until: number) {
  const model = new DelayedImmuneEvent();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Oncology delayed immune-event contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'oncology', 'clinic', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The lesson only works while the exposure stays off the lists the clinician reads first and
  // the interval stays long. Either one drifting would dissolve the attribution problem.
  it('holds the completed exposure and its interval constant in every state', () => {
    for (const until of [10, COURSE + 10, SERVICE + 10, STOP - 10]) {
      const run = drive([[0, 'check-exposure-history']], until);
      expect(run.snapshot.checkpointInhibitorCycles).toBe(4);
      expect(run.snapshot.weeksSinceLastDose).toBe(22);
      expect(run.snapshot.absentFromCurrentMedicationList).toBe(true);
      expect(run.snapshot.exposureRecord!.onCurrentMedicationList).toBe(false);
      expect(run.snapshot.exposureRecord!.referralAttribution).toContain('infectious gastroenteritis');
    }
  });

  it('records the finished drug as current history rather than past history', () => {
    const text = drive([[0, 'record-the-completed-exposure']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('current history rather than past history');
    expect(text).toContain('A drug that finished is still an exposure');
  });

  it('carries the infection evaluation alongside rather than ahead', () => {
    const text = drive([[0, 'record-infection-evaluation-in-parallel']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('alongside, not ahead');
    expect(text).toContain('Clostridioides difficile');
    expect(text).toContain('rather than deferred until those results return');
  });

  it('states the series limits rather than converting 23 cases into a risk', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('23 cases');
    expect(text).toContain('a case series, not an incidence');
    // The anti-CTLA-4 fatality figure must never be left attached to this anti-PD-1 patient.
    expect(text).toContain('describes a class rather than this case');
  });

  it('never sends a treating service that nobody contacted', () => {
    const idle = drive([[0, 'record-the-completed-exposure']], SERVICE + 6000);
    expect(idle.ids).not.toContain('service-responded');
    expect(idle.snapshot.serviceResponded).toBe(false);
    const called = drive([[0, 'escalate-to-the-treating-service']], SERVICE + 10);
    expect(called.ids).toContain('service-responded');
    expect(called.snapshot.serviceResponded).toBe(true);
  });

  it('advances the stool count without letting the observations rescue the learner', () => {
    const run = drive([[0, 'record-the-completed-exposure'], [COURSE + 10, 'check-observations']], COURSE + 20);
    expect(run.ids).toContain('course-progressed');
    expect(run.snapshot.stoolsToday).toBe(8);
    const before = new DelayedImmuneEvent().vitals();
    expect(run.model.vitals()).toEqual(before);
    expect(run.snapshot.observationRecord!.heartRateBpm).toBe(104);
  });

  it('refuses the four shortcuts with sourced reasons', () => {
    const attribution = drive([[0, 'stopped-months-ago-so-not-the-drug']], 10);
    expect(attribution.ids).toContain('attribution-refused');
    expect(attribution.snapshot.choiceFeedback).toContain('An interval is not a defence');
    const motility = drive([[0, 'slow-the-gut-and-review-tomorrow']], 10);
    expect(motility.ids).toContain('motility-refused');
    expect(motility.snapshot.choiceFeedback).toContain('perforation and toxic megacolon');
    const wait = drive([[0, 'wait-for-stool-results-before-escalating']], 10);
    expect(wait.ids).toContain('wait-refused');
    expect(wait.snapshot.choiceFeedback).toContain('would not have excluded the second process');
    const discharge = drive([[0, 'discharge-with-oral-rehydration']], 10);
    expect(discharge.ids).toContain('discharge-refused');
    expect(discharge.snapshot.choiceFeedback).toContain('Disposition is not this learner’s to set');
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-the-completed-exposure'], [1, 'record-the-symptom-course'],
      [2, 'record-infection-evaluation-in-parallel'], [3, 'escalate-to-the-treating-service'],
      [4, 'record-bounded-treatment-intent'], [5, 'review-boundaries'], [6, 'reassess'],
      [SERVICE + 20, 'handoff']];
    expect(drive(stale, SERVICE + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 63030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.serviceObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 63040);
    expect(recovered.snapshot.attributionExclusionAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('hands off honestly when the service has not answered', () => {
    const unanswered: Choices = [[0, 'record-the-completed-exposure'], [1, 'record-the-symptom-course'],
      [2, 'record-infection-evaluation-in-parallel'], [3, 'escalate-to-the-treating-service'],
      [4, 'record-bounded-treatment-intent'], [5, 'review-boundaries'], [6, 'reassess'], [7, 'handoff']];
    const run = drive(unanswered, 8);
    expect(run.snapshot.ended).toBe('handoff');
    expect(run.snapshot.choiceFeedback).toContain('has not yet answered');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'record-the-completed-exposure'], [COURSE + 20, 'record-the-completed-exposure']], COURSE + 30);
    expect(twice.ids.filter((id) => id === 'exposure-recorded')).toHaveLength(1);
    expect(twice.snapshot.exposureRecordedAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover', () => {
    expect(COURSE).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('course-progressed');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'methylprednisolone', doseMg: 80 } });
    engine.apply({ tick: 0, type: 'low-score-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'delayed-immune-event-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'delayed-immune-event-response', payload: { action: 'start-steroids' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('delayed-immune-event-generic-action-refused');
    expect(ids).toContain('delayed-immune-event-action-refused');
    expect(frame.equipment.resuscitation.delayedImmuneEvent!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent or dose after ANY action', () => {
    const forbidden = ['prednisolone', 'prednisone', 'methylprednisolone', 'infliximab', 'vedolizumab',
      'loperamide', 'mg/kg', 'milligram'];
    for (const action of DELAYED_IMMUNE_EVENT_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'delayed-immune-event-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.delayedImmuneEvent!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(DELAYED_IMMUNE_EVENT_ACTIONS).size).toBe(DELAYED_IMMUNE_EVENT_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
