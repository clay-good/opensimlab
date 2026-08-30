import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { INHERITED_URGENCY_AN_EMERGENCY_THAT_MOSTLY_IS_NOT_ONE as SCENARIO } from '../../src/modules/oncology/scenarios/inherited-urgency-an-emergency-that-mostly-is-not-one';
import { INHERITED_URGENCY_FIXTURES as FIXTURES } from '../../src/modules/oncology/inherited-urgency-fixtures';
import { InheritedUrgency } from '../../src/modules/oncology/inherited-urgency';
import { INHERITED_URGENCY_OFFER_TICKS as OFFER, INHERITED_URGENCY_TEAM_TICKS as TEAM, INHERITED_URGENCY_TAKEOVER_TICKS as STOP, INHERITED_URGENCY_ACTIONS, type InheritedUrgencyAction } from '../../src/modules/oncology/inherited-urgency';

type Choices = readonly (readonly [number, InheritedUrgencyAction])[];

function drive(actions: Choices, until: number) {
  const model = new InheritedUrgency();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Oncology superior vena caval obstruction contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'oncology', 'clinic', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The deliberate inverse of this module's hyperleukocytosis lesson. There the patient moves and
  // the number cannot. Here nothing about the patient moves, and what arrives is a phone call.
  it('offers a treatment slot without changing anything about the patient', () => {
    const before = drive([[0, 'check-observations']], 10);
    expect(before.snapshot.treatmentOffered).toBe(false);
    expect(before.snapshot.observationRecord!.stridor).toBe(false);

    const after = drive([[OFFER + 10, 'check-observations']], OFFER + 20);
    expect(after.ids).toContain('treatment-offered');
    expect(after.snapshot.treatmentOffered).toBe(true);
    // Every observation is identical across the offer. Only the pressure changed.
    expect(after.snapshot.observationRecord).toEqual({
      ...before.snapshot.observationRecord!, atTick: OFFER + 10,
    });
  });

  it('keeps the grading findings absent in every state', () => {
    for (const until of [10, OFFER + 10, TEAM + 10, STOP - 10]) {
      const run = drive([[0, 'check-observations']], until);
      expect(run.snapshot.emergencyFindingsPresent).toBe(false);
      expect(run.snapshot.observationRecord!.stridor).toBe(false);
      expect(run.snapshot.observationRecord!.consciousLevel).toContain('fully alert');
    }
  });

  it('records the three findings as looked for rather than unmentioned', () => {
    const text = drive([[0, 'record-the-findings-that-would-make-it-an-emergency']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('no stridor');
    expect(text).toContain('no confusion or obtundation');
    expect(text).toContain('no haemodynamic compromise');
    expect(text).toContain('Absent and checked is a different record from absent and assumed');
  });

  it('records the diagnosis as the treatment decision rather than a delay before it', () => {
    const text = drive([[0, 'record-that-the-tissue-decides-the-treatment']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('preceding emergent therapeutic intervention in most cases');
    expect(text).toContain('It is the treatment decision.');
  });

  it('refuses the four shortcuts, radiotherapy for the sequence rather than the treatment', () => {
    const tonight = drive([[0, 'start-radiotherapy-tonight-before-the-biopsy']], 10);
    expect(tonight.ids).toContain('treat-first-refused');
    expect(tonight.snapshot.choiceFeedback).toContain('about the sequence rather than about radiotherapy');
    // Must not read as a claim that radiotherapy is wrong for him.
    expect(tonight.snapshot.choiceFeedback).toContain('may well be exactly what he needs tomorrow');
    const swelling = drive([[0, 'the-swelling-alone-makes-it-an-emergency']], 10);
    expect(swelling.ids).toContain('swelling-only-refused');
    expect(swelling.snapshot.choiceFeedback).toContain('including the grades that wait safely');
    const home = drive([[0, 'send-him-home-to-await-the-biopsy']], 10);
    expect(home.ids).toContain('send-home-refused');
    expect(home.snapshot.choiceFeedback).toContain('not the same as this being nothing');
    const diuretic = drive([[0, 'treat-the-distended-veins-with-a-diuretic']], 10);
    expect(diuretic.ids).toContain('diuretic-refused');
    expect(diuretic.snapshot.choiceFeedback).toContain('treats the appearance rather than the mechanism');
  });

  // The proportion must not collapse into either wrong reading.
  it('reads the proportion in both directions', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('5 percent');
    expect(text).toContain('indication for emergent intervention');
    expect(text).toContain('not this patient’s risk');
    expect(text).toContain('not a reason to stop looking');
  });

  it('never sends a team that nobody called', () => {
    const idle = drive([[0, 'record-the-findings-that-would-make-it-an-emergency']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    const called = drive([[0, 'secure-the-diagnostic-pathway']], TEAM + 10);
    expect(called.ids).toContain('team-responded');
    expect(drive([[0, 'secure-the-diagnostic-pathway'], [TEAM + 10, 'check-the-supplied-imaging']], TEAM + 20)
      .snapshot.imagingRecord!.biopsyBooked).toBe(true);
  });

  it('gates handoff on an assessment taken after the offer, and recovers from shortcuts', () => {
    // Findings recorded as absent before the phone call are not findings excluded after it.
    const stale: Choices = [[0, 'record-the-findings-that-would-make-it-an-emergency'],
      [1, 'record-that-the-tissue-decides-the-treatment'], [2, 'secure-the-diagnostic-pathway'],
      [3, 'record-bounded-treatment-intent'], [4, 'review-boundaries'], [5, 'reassess'],
      [TEAM + 20, 'handoff']];
    expect(drive(stale, TEAM + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 40030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    expect(done.snapshot.treatmentOffered).toBe(true);
    expect(done.snapshot.choiceFeedback).toContain('were absent when last checked');
    const recovered = drive(FIXTURES.recovery, 40040);
    expect(recovered.snapshot.treatBeforeTissueAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
    expect(recovered.snapshot.choiceFeedback).toContain('treatment before tissue was considered and not taken');
  });

  it('bounds an abandoned run later than this module’s hyperleukocytosis lesson', () => {
    // That lesson stops at 120 minutes because its presentation does not wait. This one does.
    expect(STOP).toBe(180 * 60 * 10);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('treatment-offered');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'dexamethasone', doseMg: 8 } });
    engine.apply({ tick: 0, type: 'lowering-the-count-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'inherited-urgency-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'inherited-urgency-response', payload: { action: 'start-radiotherapy' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('inherited-urgency-generic-action-refused');
    expect(ids).toContain('inherited-urgency-action-refused');
    expect(frame.equipment.resuscitation.inheritedUrgency!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent, dose, or fraction after ANY action', () => {
    const forbidden = ['dexamethasone', 'prednisolone', 'furosemide', 'heparin', 'cisplatin',
      'mg/kg', 'milligram', 'gray', ' gy'];
    for (const action of INHERITED_URGENCY_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'inherited-urgency-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.inheritedUrgency!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(INHERITED_URGENCY_ACTIONS).size).toBe(INHERITED_URGENCY_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
