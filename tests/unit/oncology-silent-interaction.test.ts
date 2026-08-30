import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { SILENT_INTERACTION_A_HARM_WITH_NOTHING_TO_FIND as SCENARIO } from '../../src/modules/oncology/scenarios/silent-interaction-a-harm-with-nothing-to-find';
import { SILENT_INTERACTION_FIXTURES as FIXTURES } from '../../src/modules/oncology/silent-interaction-fixtures';
import { SilentInteraction } from '../../src/modules/oncology/silent-interaction';
import { SILENT_INTERACTION_PHARMACY_TICKS as PHARMACY, SILENT_INTERACTION_TEAM_TICKS as TEAM, SILENT_INTERACTION_TAKEOVER_TICKS as STOP, SILENT_INTERACTION_ACTIONS, type SilentInteractionAction } from '../../src/modules/oncology/silent-interaction';

type Choices = readonly (readonly [number, SilentInteractionAction])[];

function drive(actions: Choices, until: number) {
  const model = new SilentInteraction();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Oncology medicines-reconciliation contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'oncology', 'clinic', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The whole lesson: there is nothing to find by looking, in any state, ever.
  it('never produces an abnormal finding in any state', () => {
    for (const until of [10, PHARMACY + 10, TEAM + 10, STOP - 10]) {
      const run = drive([[0, 'check-observations']], until);
      expect(run.snapshot.anyAbnormalFinding).toBe(false);
      expect(run.snapshot.observationRecord!.symptomAccount).toContain('feeling well');
      expect(run.snapshot.observationRecord!.spo2Percent).toBe(98);
    }
  });

  it('changes the records rather than the patient when the pharmacy list arrives', () => {
    const before = drive([[0, 'check-the-supplied-records'], [1, 'check-observations']], 10);
    expect(before.snapshot.pharmacyRecordArrived).toBe(false);
    expect(before.snapshot.recordCheck!.pharmacyListAvailable).toBe(false);

    const after = drive([[PHARMACY + 10, 'check-the-supplied-records'], [PHARMACY + 11, 'check-observations']], PHARMACY + 20);
    expect(after.ids).toContain('pharmacy-record-arrives');
    expect(after.snapshot.recordCheck!.pharmacyListAvailable).toBe(true);
    expect(after.snapshot.recordCheck!.pharmacyListItems).toBeGreaterThan(after.snapshot.recordCheck!.practiceListItems);
    // The patient is byte-identical across the arrival; only the record moved.
    expect(after.snapshot.observationRecord).toEqual({
      ...before.snapshot.observationRecord!, atTick: PHARMACY + 11,
    });
  });

  it('marks a reconciliation done before the pharmacy list as incomplete', () => {
    const early = drive([[0, 'reconcile-what-she-is-actually-taking']], 10).snapshot.choiceFeedback!;
    expect(early).toContain('still outstanding and the reconciliation therefore incomplete');
    const late = drive([[PHARMACY + 10, 'reconcile-what-she-is-actually-taking']], PHARMACY + 20).snapshot.choiceFeedback!;
    expect(late).toContain('the remedy she buys herself');
    expect(late).toContain('It is what she swallows');
  });

  it('records that the harm runs towards less treatment rather than toxicity', () => {
    const text = drive([[0, 'record-the-interaction-and-its-direction']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('less of the drug is absorbed');
    expect(text).toContain('the harm is less treatment, not more');
    expect(text).toContain('cannot be caught by looking harder at the patient');
  });

  it('refuses the four shortcuts, including the record without a person', () => {
    const stop = drive([[0, 'tell-her-to-stop-the-acid-tablets-today']], 10);
    expect(stop.ids).toContain('stop-refused');
    expect(stop.snapshot.choiceFeedback).toContain('may still need them');
    expect(stop.snapshot.choiceFeedback).toContain('The change is not yours to make');
    const nothing = drive([[0, 'nothing-is-wrong-so-there-is-nothing-to-do']], 10);
    expect(nothing.ids).toContain('nothing-refused');
    expect(nothing.snapshot.choiceFeedback).toContain('the most understandable answer in this lesson');
    expect(nothing.snapshot.choiceFeedback).toContain('the presentation, not the reassurance');
    const theoretical = drive([[0, 'the-interaction-is-only-theoretical']], 10);
    expect(theoretical.ids).toContain('theoretical-refused');
    expect(theoretical.snapshot.choiceFeedback).toContain('more than theory and less than proof');
    const notes = drive([[0, 'write-it-in-the-notes-and-move-on']], 10);
    expect(notes.ids).toContain('notes-refused');
    expect(notes.snapshot.choiceFeedback).toContain('documents one');
    expect(notes.snapshot.choiceFeedback).toContain('a route that ends with a person');
  });

  it('reads the association without converting it into her lost benefit', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('1.42 to 1.76');
    expect(text).toContain('association rather than causation');
    expect(text).toContain('the mechanism is understood');
    expect(text).toContain('does not support is telling this woman');
  });

  it('never sends a team that nobody called', () => {
    const idle = drive([[0, 'reconcile-what-she-is-actually-taking']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    const called = drive([[0, 'escalate-to-the-treating-team-now']], TEAM + 10);
    expect(called.ids).toContain('team-responded');
  });

  it('gates handoff on an assessment taken after the pharmacy list, and recovers', () => {
    const stale: Choices = [[0, 'reconcile-what-she-is-actually-taking'],
      [1, 'record-the-interaction-and-its-direction'], [2, 'escalate-to-the-treating-team-now'],
      [3, 'record-bounded-treatment-intent'], [4, 'review-boundaries'], [5, 'reassess'],
      [TEAM + 20, 'handoff']];
    expect(drive(stale, TEAM + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 40030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    expect(done.snapshot.pharmacyRecordArrived).toBe(true);
    expect(done.snapshot.choiceFeedback).toContain('nothing will look wrong later either');
    const recovered = drive(FIXTURES.recovery, 40040);
    expect(recovered.snapshot.notesOnlyAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
    expect(recovered.snapshot.choiceFeedback).toContain('recording it without telling anyone was considered and not taken');
  });

  it('bounds an abandoned run later than every other lesson in this module', () => {
    expect(STOP).toBe(240 * 60 * 10);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('pharmacy-record-arrives');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'omeprazole', doseMg: 20 } });
    engine.apply({ tick: 0, type: 'trial-rule-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'silent-interaction-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'silent-interaction-response', payload: { action: 'stop-the-tablet' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('silent-interaction-generic-action-refused');
    expect(ids).toContain('silent-interaction-action-refused');
    expect(frame.equipment.resuscitation.silentInteraction!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent or dose after ANY action', () => {
    const forbidden = ['omeprazole', 'lansoprazole', 'ranitidine', 'famotidine', 'gefitinib',
      'erlotinib', 'mg/kg', 'milligram'];
    for (const action of SILENT_INTERACTION_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'silent-interaction-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.silentInteraction!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(SILENT_INTERACTION_ACTIONS).size).toBe(SILENT_INTERACTION_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
