import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { TRIAL_RULE_A_RULE_WRITTEN_FOR_A_DATABASE as SCENARIO } from '../../src/modules/oncology/scenarios/trial-rule-a-rule-written-for-a-database';
import { TRIAL_RULE_FIXTURES as FIXTURES } from '../../src/modules/oncology/trial-rule-fixtures';
import { TrialRule } from '../../src/modules/oncology/trial-rule';
import { TRIAL_RULE_DOCUMENT_TICKS as DOCUMENT, TRIAL_RULE_TEAM_TICKS as TEAM, TRIAL_RULE_TAKEOVER_TICKS as STOP, TRIAL_RULE_ACTIONS, type TrialRuleAction } from '../../src/modules/oncology/trial-rule';

type Choices = readonly (readonly [number, TrialRuleAction])[];

function drive(actions: Choices, until: number) {
  const model = new TrialRule();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Oncology response-assessment contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'oncology', 'clinic', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // What moves here is neither the patient nor the pressure but the rule itself.
  it('delivers the cited criteria without changing anything about the patient', () => {
    const before = drive([[0, 'check-observations']], 10);
    expect(before.snapshot.documentRead).toBe(false);

    const after = drive([[DOCUMENT + 10, 'check-observations']], DOCUMENT + 20);
    expect(after.ids).toContain('document-arrives');
    expect(after.snapshot.documentRead).toBe(true);
    expect(after.snapshot.observationRecord).toEqual({
      ...before.snapshot.observationRecord!, atTick: DOCUMENT + 10,
    });
  });

  it('keeps the criterion’s own condition unmet in every state', () => {
    for (const until of [10, DOCUMENT + 10, TEAM + 10, STOP - 10]) {
      const run = drive([[0, 'check-the-supplied-imaging-report']], until);
      expect(run.snapshot.clinicallyStable).toBe(false);
      expect(run.snapshot.imagingRecord!.clinicallyStable).toBe(false);
      expect(run.snapshot.imagingRecord!.newLesions).toBe(true);
    }
  });

  it('records a slope rather than the moment the report describes', () => {
    const text = drive([[0, 'record-the-clinical-trajectory-not-just-the-scan']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('over three weeks');
    expect(text).toContain('A report describes a moment; what is being decided is about a slope');
  });

  it('separates what the criteria govern from what they were quoted as saying', () => {
    const early = drive([[0, 'record-what-the-criteria-do-and-do-not-govern']], 10).snapshot.choiceFeedback!;
    expect(early).toContain('data handling rather than patient management');
    expect(early).toContain('conditional on the patient being clinically stable');
    // Reading the document first changes what the record can say about it.
    const late = drive([[DOCUMENT + 10, 'record-what-the-criteria-do-and-do-not-govern']], DOCUMENT + 20).snapshot.choiceFeedback!;
    expect(late).toContain('she is not clinically stable');
  });

  it('refuses continuing and stopping as the same error, not as opposite risks', () => {
    const carryOn = drive([[0, 'call-it-pseudoprogression-and-continue']], 10);
    expect(carryOn.ids).toContain('pseudoprogression-refused');
    expect(carryOn.snapshot.choiceFeedback).toContain('about the condition rather than about the phenomenon');
    // Must not read as a claim that pseudoprogression is a myth.
    expect(carryOn.snapshot.choiceFeedback).toContain('Pseudoprogression is real');
    const stop = drive([[0, 'stop-the-immunotherapy-and-tell-her-it-failed']], 10);
    expect(stop.ids).toContain('stop-refused');
    expect(stop.snapshot.choiceFeedback).toContain('the opposite error rather than the safe one');
    const scanOnly = drive([[0, 'the-scan-alone-decides']], 10);
    expect(scanOnly.ids).toContain('scan-only-refused');
    expect(scanOnly.snapshot.choiceFeedback).toContain('in either direction');
    const wait = drive([[0, 'rescan-in-eight-weeks-and-review-then']], 10);
    expect(wait.ids).toContain('wait-refused');
    expect(wait.snapshot.choiceFeedback).toContain('a review date is not a decision');
  });

  it('reads both reported rates without letting either decide', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('do not exceed 10 percent');
    expect(text).toContain('between 4 and 29 percent');
    expect(text).toContain('13.8 percent');
    expect(text).toContain('premature discontinuation');
    expect(text).toContain('Either error alone is a complete failure to read this');
  });

  it('never sends a team that nobody called', () => {
    const idle = drive([[0, 'record-the-clinical-trajectory-not-just-the-scan']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    const called = drive([[0, 'escalate-to-the-treating-team-now']], TEAM + 10);
    expect(called.ids).toContain('team-responded');
  });

  it('gates handoff on an assessment taken after the document, and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-the-clinical-trajectory-not-just-the-scan'],
      [1, 'record-what-the-criteria-do-and-do-not-govern'], [2, 'escalate-to-the-treating-team-now'],
      [3, 'record-bounded-treatment-intent'], [4, 'review-boundaries'], [5, 'reassess'],
      [TEAM + 20, 'handoff']];
    expect(drive(stale, TEAM + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 40030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    expect(done.snapshot.documentRead).toBe(true);
    expect(done.snapshot.choiceFeedback).toContain('governs trial data rather than her management');
    const recovered = drive(FIXTURES.recovery, 40040);
    expect(recovered.snapshot.continueAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
    expect(recovered.snapshot.choiceFeedback).toContain('continuing on that criterion was considered and not taken');
  });

  it('bounds an abandoned run between this module’s other two escalation lessons', () => {
    expect(STOP).toBeGreaterThan(120 * 60 * 10);
    expect(STOP).toBeLessThan(180 * 60 * 10);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('document-arrives');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'pembrolizumab', doseMg: 200 } });
    engine.apply({ tick: 0, type: 'inherited-urgency-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'trial-rule-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'trial-rule-response', payload: { action: 'stop-treatment' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('trial-rule-generic-action-refused');
    expect(ids).toContain('trial-rule-action-refused');
    expect(frame.equipment.resuscitation.trialRule!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent, dose, or cycle after ANY action', () => {
    const forbidden = ['pembrolizumab', 'nivolumab', 'atezolizumab', 'docetaxel', 'carboplatin',
      'mg/kg', 'milligram'];
    for (const action of TRIAL_RULE_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'trial-rule-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.trialRule!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(TRIAL_RULE_ACTIONS).size).toBe(TRIAL_RULE_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
