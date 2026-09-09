/**
 * Reference transcripts for the pacemaker-and-cautery planning lesson, replayed
 * through the real engine and scored by the real debrief.
 *
 * Two assertions this file exists for. A wrong plan voids a correctly documented
 * restoration, so the shortcut costs two objectives rather than one. And a
 * recorded plan cannot be replaced within an attempt — the module's usual rule
 * that a heeded refusal costs nothing holds for the ordering refusal at the
 * front of the sequence and does NOT hold for the plan itself.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { promptFor } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { PACEMAKER_AND_CAUTERY_PLANNING as SCENARIO } from '@anesthesia/scenarios/pacemaker-and-cautery-planning';
import { POSTOPERATIVE_HANDOFF } from '@anesthesia/scenarios/postoperative-handoff';
import { PACEMAKER_AND_CAUTERY_PLANNING_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/pacemaker-and-cautery-planning-fixtures';
import {
  PACEMAKER_AND_CAUTERY_PLANNING_OBJECTIVES, supportsPacemakerAndCauteryPlanning,
} from '../../src/modules/anesthesia/pacemaker-and-cautery-planning';
import { pacemakerAndCauteryPlanningCompletionEvidence } from '../../src/modules/anesthesia/pacemaker-and-cautery-planning-completion';

function run(
  actions: readonly LearnerAction[],
  level: GuidanceLevel = 'unassisted',
  region: 'US' | 'GB' = 'US',
) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
  const hash = createHash('sha256');
  const history: HistorySample[] = [];
  const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= FIXTURES.ticks; tick += 1) {
    while (actions[next]?.tick === tick) { engine.apply(actions[next]!); next += 1; }
    const frame = engine.step();
    hash.update(JSON.stringify(frame));
    history.push({ tick: frame.tick, state: frame.state, concentrations: frame.concentrations } as HistorySample);
    events.push(...frame.events);
    const prompt = promptFor(level, {
      scenarioId: SCENARIO.metadata.id, scenarioVersion: SCENARIO.metadata.version,
      tick, state: frame.state as Readonly<Record<string, number>>,
      actions: actions.slice(0, next), ventilating: false, alarmCount: 0,
    }, new Map());
    if (level === 'unassisted') expect(prompt).toBeNull();
  }
  expect(next).toBe(actions.length);
  return {
    hash: hash.digest('hex'), history, events, engine,
    findings: objectiveFindings(
      SCENARIO, history, 0, engine.equipment().preoxygenationSeconds, actions, events,
    ),
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const refusals = (result: ReturnType<typeof run>) => result.events
  .filter((event) => event.eventId.includes('refused')).map(({ eventId }) => eventId);
const plan = (result: ReturnType<typeof run>) =>
  (result.engine.equipment().resuscitation as Readonly<Record<string, unknown>>)
    .ciedPlanningAssessment as Readonly<Record<string, string | number | null>>;

describe('Pacemaker-and-cautery-planning transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsPacemakerAndCauteryPlanning(SCENARIO)).toBe(true);
    // The module's other bounded planning conversation.
    expect(supportsPacemakerAndCauteryPlanning(POSTOPERATIVE_HANDOFF)).toBe(false);
    // The engine gates on the narrative target, which is not the scenario id.
    expect(supportsPacemakerAndCauteryPlanning({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(pacemakerAndCauteryPlanningCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(pacemakerAndCauteryPlanningCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(pacemakerAndCauteryPlanningCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(pacemakerAndCauteryPlanningCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...PACEMAKER_AND_CAUTERY_PLANNING_OBJECTIVES]);
    expect(supportsPacemakerAndCauteryPlanning({
      ...SCENARIO,
      metadata: { ...SCENARIO.metadata, objectives: [...SCENARIO.metadata.objectives].reverse() },
    })).toBe(false);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across guidance levels and regions', (path) => {
    const actions = FIXTURES[path];
    const reference = run(actions);
    for (const level of ['guided', 'coached'] as const) {
      expect(run(actions, level).hash).toBe(reference.hash);
    }
    expect(run(actions, 'unassisted', 'GB').hash).toBe(reference.hash);
  });

  it('meets every objective on the expert path', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(refusals(expert)).toEqual([]);
    expect(plan(expert).plan).toBe('coordinate-asynchronous-pacing');
    expect(expert.findings[2]!.finding).toContain('without claiming universal magnet behavior');
  });

  it('voids a correctly documented restoration when the plan was a shortcut', () => {
    // The reason this lesson is worth binding. The magnet costs TWO objectives,
    // and the second is work the learner actually did: the documentation is in
    // the sidecar at tick 1,200 and earns nothing, because the rubric credits
    // documentation that follows a COORDINATED plan.
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['met', 'met', 'not-met', 'not-met']);
    const recorded = plan(errored);
    expect(recorded.plan).toBe('apply-unverified-magnet');
    expect(recorded.backupAndRestorationDocumentedAtTick).toBe(1200);
    expect(errored.findings[3]!.finding).toContain('not completed after the coordinated plan');
    // Both reviews were done properly. This is not a careless run.
    expect(errored.findings.slice(0, 2).map(({ outcome }) => outcome)).toEqual(['met', 'met']);
  });

  it('costs nothing to be refused for planning before reading', () => {
    // The module's usual rule, still holding at the front of the sequence.
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['met', 'met', 'met', 'met']);
    expect(refusals(recovered)).toEqual(['cied-plan-order-refused-300']);
    expect(plan(recovered).plan).toBe('coordinate-asynchronous-pacing');
    expect(plan(recovered).planAtTick).toBe(1200);
  });

  it('refuses to replace a plan once it is recorded, and scores the first answer', () => {
    // The exception, and the first decision in the module a learner cannot
    // correct within an attempt. Recognising the shortcut changes nothing.
    const reconsidered = run([
      ...FIXTURES.commonError.slice(0, 3),
      { tick: 1200, type: 'cied-planning-assessment', payload: { action: 'coordinate-asynchronous-pacing' } },
      { tick: 1500, type: 'cied-planning-assessment', payload: { action: 'document-backup-and-restoration' } },
    ] as LearnerAction[]);
    expect(refusals(reconsidered)).toEqual(['cied-plan-refused-1200']);
    expect(plan(reconsidered).plan).toBe('apply-unverified-magnet');
    expect(outcomes(reconsidered)).toEqual(outcomes(run(FIXTURES.commonError)));
  });

  it('treats the no-change plan as the same class of shortcut as the magnet', () => {
    const noChange = run([
      ...FIXTURES.expert.slice(0, 2),
      { tick: 900, type: 'cied-planning-assessment', payload: { action: 'proceed-no-change' } },
      { tick: 1200, type: 'cied-planning-assessment', payload: { action: 'document-backup-and-restoration' } },
    ] as LearnerAction[]);
    expect(outcomes(noChange)).toEqual(['met', 'met', 'not-met', 'not-met']);
    expect(plan(noChange).plan).toBe('proceed-no-change');
  });

  it('plans nothing when nothing is read', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    expect(plan(idle).plan).toBeNull();
    expect(idle.findings[2]!.finding).toContain('No CIED plan was recorded');
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations)
      .toContain('no-device-programming-magnet-or-electrosurgery-model');
    expect(SCENARIO.metadata.limitations)
      .toContain('cied-record-and-procedure-are-fixed-vignette-facts');
    expect(SCENARIO.formulary).toEqual([]);
  });
});
