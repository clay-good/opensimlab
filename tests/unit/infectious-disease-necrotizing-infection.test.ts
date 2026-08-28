import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { NECROTIZING_INFECTION_SCORE_CANNOT_EXCLUDE as SCENARIO } from '../../src/modules/infectious-disease/scenarios/necrotizing-infection-score-cannot-exclude';
import { NECROTIZING_INFECTION_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/necrotizing-infection-fixtures';
import { NecrotizingInfection, NECROTIZING_INFECTION_PROGRESSION_TICKS as PROGRESSION,
  NECROTIZING_INFECTION_TAKEOVER_TICKS as STOP, NECROTIZING_INFECTION_ACTIONS,
  type NecrotizingInfectionAction } from '../../src/modules/infectious-disease/necrotizing-infection';

type Choices = readonly (readonly [number, NecrotizingInfectionAction])[];

function drive(actions: Choices, until: number) {
  const model = new NecrotizingInfection();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Infectious disease necrotizing infection contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'infectious-disease', 'emergency-department', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  it('starts below the score cutoff so the reassuring number arrives first', () => {
    const start = drive([[0, 'check-labs']], 10);
    const labs = start.snapshot.labObservation!;
    expect(labs.riskScore).toBe(3);
    expect(labs.riskScore).toBeLessThan(6);
    // Every component sits in a band that keeps the score low; that is the trap.
    expect(labs.whiteCellsX109L).toBeLessThan(15);
    expect(labs.crpMgL).toBeLessThan(150);
    expect(labs.sodiumMmolL).toBeGreaterThanOrEqual(135);
  });

  it('progresses on its own clock whatever the learner records', () => {
    const idle = drive([], PROGRESSION + 10);
    const active = drive([[0, 'recognize-disproportionate-pain'], [1, 'mark-the-margin'],
      [2, 'call-surgery'], [3, 'record-antimicrobial-intent']], PROGRESSION + 10);
    expect(idle.ids).toContain('clinical-progression');
    expect(active.ids).toContain('clinical-progression');
    // Only an operation treats this, and it happens after the rehearsal.
    expect(idle.model.vitals()).toEqual(active.model.vitals());
    // What changes is whether the surgical team was mobilized in time.
    expect(idle.snapshot.surgeryRequestedBeforeProgression).toBe(false);
    expect(active.snapshot.surgeryRequestedBeforeProgression).toBe(true);
  });

  it('turns the score positive only after the interval in which acting mattered', () => {
    const after = drive([[PROGRESSION + 5, 'reassess']], PROGRESSION + 20);
    const view = after.snapshot.observation!;
    expect(view.riskScore).toBe(11);
    expect(view.beyondMarginCm).toBe(4);
    expect(view.dusky).toBe(true);
    expect(after.ids).toContain('progressed-reassessment');
    expect(after.snapshot.durableRecoveryProven).toBe(false);
  });

  it('refuses all four exclusion shortcuts without blocking a later handoff', () => {
    const result = drive(FIXTURES.recovery, PROGRESSION + 40);
    expect(result.ids).toContain('score-exclusion-refused');
    expect(result.ids).toContain('imaging-delay-refused');
    expect(result.snapshot.scoreExclusionAttempted).toBe(true);
    expect(result.snapshot.ended).toBe('handoff');
    const late = drive([[0, 'absent-crepitus-excludes'], [1, 'continue-oral-antibiotics']], 20);
    expect(late.ids).toContain('crepitus-exclusion-refused');
    expect(late.ids).toContain('oral-continuation-refused');
  });

  it('states the score and timing limits rather than implying a threshold', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('must not be used to exclude');
    expect(text).toContain('confounded by indication in both directions');
    expect(text).toContain('no validated hour threshold');
    expect(text).toContain('must never delay exploration');
  });

  it('gates handoff on the full bounded record', () => {
    const partial: Choices = [[0, 'recognize-disproportionate-pain'], [1, 'mark-the-margin'],
      [2, 'call-surgery'], [3, 'review-boundaries'], [4, 'monitor'], [5, 'reassess'], [6, 'handoff']];
    expect(drive(partial, 20).ids).toContain('handoff-refused');
    const complete: Choices = [...partial.slice(0, 3), [3, 'record-antimicrobial-intent'],
      [4, 'review-boundaries'], [5, 'monitor'], [6, 'reassess'], [7, 'handoff']];
    const done = drive(complete, 20);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with takeover after the progression', () => {
    expect(STOP).toBeGreaterThan(PROGRESSION);
    const result = drive([], STOP + 10);
    expect(result.ids).toContain('clinical-progression');
    expect(result.ids).toContain('instructor-takeover');
  });

  it('refuses generic actions, malformed payloads, and adjacent-lesson shortcuts', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'clindamycin', doseMg: 900 } });
    engine.apply({ tick: 0, type: 'febrile-neutropenia-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'necrotizing-infection-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'necrotizing-infection-response', payload: { action: 'debride-now' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('necrotizing-infection-generic-action-refused');
    expect(ids).toContain('necrotizing-infection-action-refused');
    expect(frame.equipment.resuscitation.necrotizingInfection!.surgeryAtTick).toBeNull();
  });

  it('names no antimicrobial and exposes no operative control', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 0, type: 'necrotizing-infection-response', payload: { action: 'call-surgery' } });
    const snapshot = engine.step().equipment.resuscitation.necrotizingInfection!;
    expect(snapshot.surgeryAtTick).not.toBeNull();
    expect(snapshot.doseModelAvailable).toBe(false);
    const serialized = JSON.stringify(snapshot).toLowerCase();
    // No agent is ever named and no dose form ever produced.
    for (const agent of ['clindamycin', 'vancomycin', 'piperacillin', 'mg/kg', 'ml/kg']) {
      expect(serialized).not.toContain(agent);
    }
    // Operative words appear only as explicit disclaimers of learner control.
    expect(snapshot.choiceFeedback).toContain('nothing here selects an incision, an extent, or a theatre time');
    expect(snapshot.choiceFeedback).not.toMatch(/\d+\s*(mg|mcg|mL)\b/i);
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(NECROTIZING_INFECTION_ACTIONS).size).toBe(NECROTIZING_INFECTION_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
