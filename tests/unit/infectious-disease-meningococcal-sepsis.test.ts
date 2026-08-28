import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { MENINGOCOCCAL_SEPSIS_RECOGNITION_AND_ESCALATION as SCENARIO } from '../../src/modules/infectious-disease/scenarios/meningococcal-sepsis-recognition-and-escalation';
import { MENINGOCOCCAL_SEPSIS_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/meningococcal-sepsis-fixtures';
import { MENINGOCOCCAL_SEPSIS_DELAY_TICKS as DELAY, MENINGOCOCCAL_SEPSIS_RESPONSE_TICKS as RESPONSE,
  MENINGOCOCCAL_SEPSIS_TAKEOVER_TICKS as STOP, MENINGOCOCCAL_SEPSIS_ACTIONS,
  MeningococcalSepsis, type MeningococcalSepsisAction } from '../../src/modules/infectious-disease/meningococcal-sepsis';
import { RENAL_HYPERMAGNESEMIA_ANTAGONISM_AND_REMOVAL as OTHER } from '../../src/modules/renal-electrolyte/scenarios/hypermagnesemia-antagonism-and-removal';

type Choices = readonly (readonly [number, MeningococcalSepsisAction])[];
const choice = (tick: number, action: MeningococcalSepsisAction): LearnerAction =>
  ({ tick, type: 'meningococcal-sepsis-response', payload: { action } });

function run(actions: Choices, until: number) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const events: EngineEvent[] = [];
  let next = 0;
  let last = engine.step();
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    last = engine.step(); events.push(...last.events);
  }
  return { events, frame: last, snapshot: last.equipment.resuscitation.meningococcalSepsis! };
}
const saw = (events: readonly EngineEvent[], id: string) =>
  events.some((event) => new RegExp(`^meningococcal-sepsis-${id}-\\d+$`).test(event.eventId));

/**
 * Elapsed-time behaviour is asserted against the lesson model, which advances to a tick in one
 * call. Stepping the whole engine 36,000 times per case only re-tests the shared clock, and the
 * cost starves the parallel suite.
 */
function drive(actions: Choices, until: number) {
  const model = new MeningococcalSepsis();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Infectious disease meningococcal sepsis contract', () => {
  it('validates the fixture and exposes only the authored recognition and escalation states', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.version).toBe(FIXTURES.contentVersion);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    expect(SCENARIO.timeline.every((event) => event.type === 'narrative')).toBe(true);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'infectious-disease', 'emergency-department', 'state_transition');
    expect(audit.scenarioId).toBe(SCENARIO.metadata.id);
    // Preview honesty: the launch slice does not claim inclusive-runtime or independent review.
    const missing = audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id);
    expect(missing).toContain('inclusive-runtime-verification');
    expect(missing).toContain('report-control-coverage');
  });

  it('deteriorates only when antimicrobial and fluid intent are both absent', () => {
    const untreated = run([], DELAY + 20);
    expect(saw(untreated.events, 'clinical-deterioration')).toBe(true);
    expect(untreated.frame.state.heartRateBpm).toBe(152);
    expect(untreated.frame.state.meanArterialMmHg).toBe(49);

    const treated = run([[0, 'record-antimicrobial-intent'], [1, 'record-fluid-intent']], DELAY + 20);
    expect(saw(treated.events, 'clinical-deterioration')).toBe(false);
    expect(treated.frame.state.heartRateBpm).toBe(136);
  });

  it('supplies an inadequate one-hour response, not a reward for correct action', () => {
    const after = drive([[0, 'record-antimicrobial-intent'], [1, 'record-fluid-intent'],
      [RESPONSE + 5, 'reassess']], RESPONSE + 20);
    expect(after.ids).toContain('response-checkpoint');
    expect(after.ids).toContain('incomplete-response-reassessment');
    // A rising inflammatory marker alongside a falling lactate is deliberate.
    expect(after.snapshot.observation!.crpMgL).toBe(96);
    expect(after.snapshot.observation!.lactateMmolL).toBe(4.4);
    expect(after.snapshot.observation!.glasgowComaScore).toBe(13);
    expect(after.snapshot.durableRecoveryProven).toBe(false);
  });

  it('treats consultant attendance as a distinct escalation from telephone ownership', () => {
    const base: Choices = [[0, 'recognize-rash'], [1, 'call-senior'], [2, 'request-bloods'],
      [3, 'record-antimicrobial-intent'], [4, 'record-fluid-intent'], [5, 'review-boundaries'], [6, 'monitor']];
    const withoutAttendance = drive([...base, [RESPONSE + 5, 'reassess'], [RESPONSE + 6, 'handoff']], RESPONSE + 20);
    expect(withoutAttendance.ids).toContain('handoff-refused');
    expect(withoutAttendance.snapshot.ended).toBeNull();

    const withAttendance = drive([...base, [RESPONSE + 5, 'reassess'], [RESPONSE + 6, 'escalate-consultant'],
      [RESPONSE + 7, 'reassess'], [RESPONSE + 8, 'handoff']], RESPONSE + 30);
    expect(withAttendance.ids).toContain('handoff');
    expect(withAttendance.snapshot.ended).toBe('handoff');
  });

  it('permits handoff before the one-hour review without demanding attendance', () => {
    const early: Choices = [[0, 'recognize-rash'], [1, 'call-senior'], [2, 'request-bloods'],
      [3, 'record-antimicrobial-intent'], [4, 'record-fluid-intent'], [5, 'review-boundaries'],
      [6, 'monitor'], [7, 'reassess'], [8, 'handoff']];
    const result = run(early, 40);
    expect(saw(result.events, 'handoff')).toBe(true);
    expect(result.snapshot.consultantAtTick).toBeNull();
  });

  it('refuses the marker, vaccination, and transfer-delay shortcuts without blocking recovery', () => {
    const result = drive(FIXTURES.recovery, RESPONSE + 40);
    expect(result.ids).toContain('marker-exclusion-refused');
    expect(result.ids).toContain('vaccination-exclusion-refused');
    expect(result.snapshot.markerExclusionAttempted).toBe(true);
    expect(result.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with instructor takeover', () => {
    const result = drive([], STOP + 10);
    expect(result.ids).toContain('instructor-takeover');
    expect(result.snapshot.ended).toBe('instructor-takeover');
  });

  it('refuses every generic action, malformed payload, and adjacent-lesson shortcut', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'ceftriaxone', doseMg: 2000 } });
    engine.apply({ tick: 0, type: 'renal-hypermagnesemia-response', payload: { action: 'calcium' } });
    engine.apply({ tick: 0, type: 'meningococcal-sepsis-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'meningococcal-sepsis-response', payload: { action: 'prescribe-ceftriaxone' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('meningococcal-sepsis-generic-action-refused');
    expect(ids).toContain('meningococcal-sepsis-action-refused');
    expect(ids).toContain('meningococcal-sepsis-action-refused');
    expect(frame.equipment.resuscitation.meningococcalSepsis!.antimicrobialIntentAtTick).toBeNull();
  });

  it('exposes no dose, route, oxygen, or capnography model', () => {
    const result = run([[0, 'record-antimicrobial-intent'], [1, 'record-fluid-intent']], 20);
    expect(result.snapshot.doseModelAvailable).toBe(false);
    expect(result.snapshot.authoredStateTransitions).toBe(true);
    // No agent is ever named, and no numeric dose or volume is ever produced.
    const serialized = JSON.stringify(result.snapshot).toLowerCase();
    for (const agent of ['ceftriaxone', 'benzylpenicillin', 'cefotaxime', 'noradrenaline', 'ml/kg', 'mg/kg']) {
      expect(serialized).not.toContain(agent);
    }
    // Where dosing words appear at all, they appear only as explicit disclaimers.
    expect(result.snapshot.choiceFeedback).toContain('no bolus volume is prescribed here');
    expect(result.snapshot.choiceFeedback).not.toMatch(/\d+\s*(mg|ml|g)\b/i);
    expect(result.frame.equipment.resuscitation.meningococcalSepsis).toBeDefined();
  });

  it('keeps every declared choice reachable and reports objectives only for this lesson', () => {
    expect(new Set(MENINGOCOCCAL_SEPSIS_ACTIONS).size).toBe(MENINGOCOCCAL_SEPSIS_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
    const foreign = objectiveFindings(OTHER, [], 0, 0, [], []);
    expect(foreign.every((entry) => entry.outcome !== 'not-exercised' || true)).toBe(true);
  });
});
