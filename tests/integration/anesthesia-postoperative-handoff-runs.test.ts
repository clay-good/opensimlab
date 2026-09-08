/**
 * Reference transcripts for the postoperative-handoff lesson, replayed through
 * the real engine and scored by the real debrief.
 *
 * The assertion this file exists for is that the read-back is load-bearing on
 * the ACCEPTANCE rather than on itself. A handoff that shares every content
 * block and then skips the synthesis does not merely lose a mark: the engine
 * refuses the acceptance, responsibility stays where it was, and the debrief
 * reports three objectives met on a handoff in which nothing was handed over.
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
import { POSTOPERATIVE_HANDOFF as SCENARIO } from '@anesthesia/scenarios/postoperative-handoff';
import { BLOOD_BANK_HANDOFF } from '@anesthesia/scenarios/blood-bank-handoff';
import { POSTOPERATIVE_HANDOFF_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/postoperative-handoff-fixtures';
import {
  POSTOPERATIVE_HANDOFF_OBJECTIVES, supportsPostoperativeHandoff,
} from '../../src/modules/anesthesia/postoperative-handoff';
import { postoperativeHandoffCompletionEvidence } from '../../src/modules/anesthesia/postoperative-handoff-completion';

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
  .filter((event) => event.eventId?.includes('refused')).map(({ eventId }) => eventId);
const steps = (result: ReturnType<typeof run>) =>
  (result.engine.equipment().resuscitation as Readonly<Record<string, unknown>>)
    .postoperativeHandoffAssessment as Readonly<Record<string, number | null>>;

describe('Postoperative-handoff transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsPostoperativeHandoff(SCENARIO)).toBe(true);
    // The other lesson in this module whose subject is a handoff.
    expect(supportsPostoperativeHandoff(BLOOD_BANK_HANDOFF)).toBe(false);
    expect(supportsPostoperativeHandoff({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(postoperativeHandoffCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(postoperativeHandoffCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(postoperativeHandoffCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(postoperativeHandoffCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...POSTOPERATIVE_HANDOFF_OBJECTIVES]);
    expect(supportsPostoperativeHandoff({
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

  it('meets every objective on the expert path, with the read-back before the acceptance', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(refusals(expert)).toEqual([]);
    const recorded = steps(expert);
    expect(recorded.receiverReadbackAtTick).toBe(1500);
    expect(recorded.transferAcceptedAtTick).toBe(1800);
    expect(expert.findings[3]!.finding)
      .toContain('Receiver synthesis preceded explicit acknowledgment');
  });

  it('refuses the acceptance itself when the read-back is skipped', () => {
    // The reason this lesson is worth binding. The omitted step does not cost a
    // mark for being omitted: it blocks the transfer, and responsibility never
    // moves. Every content block was shared and nothing was handed over.
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['met', 'met', 'met', 'not-met']);
    expect(refusals(errored)).toEqual(['handoff-acceptance-order-refused-1500']);
    const recorded = steps(errored);
    expect(recorded.risksActionsOwnershipAtTick).toBe(1200);
    expect(recorded.receiverReadbackAtTick).toBeNull();
    expect(recorded.transferAcceptedAtTick).toBeNull();
    expect(errored.events.find(({ eventId }) => eventId === 'handoff-acceptance-order-refused-1500')!
      .message).toContain('read-back is required');
  });

  it('completes the transfer once the refusal is taken seriously', () => {
    // The identical five actions, plus the two that follow from reading the
    // refusal. The refusal stays in the log; the objectives are all met.
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['met', 'met', 'met', 'met']);
    expect(refusals(recovered)).toEqual(['handoff-acceptance-order-refused-1500']);
    expect(steps(recovered).transferAcceptedAtTick).toBe(2100);
    expect(FIXTURES.recovery.slice(0, FIXTURES.commonError.length))
      .toEqual([...FIXTURES.commonError]);
  });

  it('credits nothing when the conversation never happens', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    expect(Object.values(steps(idle)).every((tick) => tick === null)).toBe(true);
    expect(idle.findings[0]!.finding).toContain('without an accepted receiver-readiness event');
  });

  it('refuses content shared into a room that was never confirmed ready', () => {
    // The order is enforced at the front of the sequence as well as the back:
    // beginning the handoff without confirming the receiver refuses the first
    // content block, and every objective after it fails for want of an input.
    const spoken = run(FIXTURES.expert.slice(1).map((action, index) =>
      ({ ...action, tick: 300 + index * 300 })) as LearnerAction[]);
    expect(refusals(spoken)[0]).toContain('refused');
    expect(steps(spoken).receiverReadyAtTick).toBeNull();
    expect(outcomes(spoken)[0]).toBe('not-met');
  });

  it('states the limit it cannot measure', () => {
    // Worth pinning because the rubric text could be read as a quality claim and
    // is not one: every finding here reports that a block was accepted, never
    // that anybody understood it. The scenario declares this in its metadata.
    expect(SCENARIO.metadata.limitations)
      .toContain('handoff-controls-record-events-not-communication-quality');
    expect(SCENARIO.formulary).toEqual([]);
  });
});
