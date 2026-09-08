/**
 * Reference transcripts for the delayed-emergence lesson, replayed through the
 * real engine and scored by the real debrief.
 *
 * The assertion this file exists for is measured rather than shipped: a path
 * that completes the ENTIRE workup, finds the lateralizing sign, and then
 * continues routine observation meets four of the five objectives. The workup is
 * not the decision.
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
import { DELAYED_EMERGENCE_DIFFERENTIAL as SCENARIO } from '@anesthesia/scenarios/delayed-emergence-differential';
import { EMERGENCE_WITH_RESIDUAL_BLOCKADE } from '@anesthesia/scenarios/emergence-with-residual-blockade';
import { DELAYED_EMERGENCE_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/delayed-emergence-differential-fixtures';
import {
  DELAYED_EMERGENCE_OBJECTIVES, supportsDelayedEmergenceDifferential,
} from '../../src/modules/anesthesia/delayed-emergence-differential';
import { delayedEmergenceCompletionEvidence } from '../../src/modules/anesthesia/delayed-emergence-differential-completion';

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
    hash: hash.digest('hex'), history, events,
    findings: objectiveFindings(
      SCENARIO, history, 0, engine.equipment().preoxygenationSeconds, actions, events,
    ),
    assessment: engine.equipment().resuscitation.delayedEmergenceAssessment,
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const refusals = (result: ReturnType<typeof run>) =>
  result.events.filter((event) => event.eventId.includes('refused'));
const CHOOSE = (tick: number, action: string): LearnerAction =>
  ({ tick, type: 'delayed-emergence-assessment', payload: { action } });

describe('Delayed-emergence transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(supportsDelayedEmergenceDifferential(SCENARIO)).toBe(true);
    // The module's other emergence vignette, with the same action shape.
    expect(supportsDelayedEmergenceDifferential(EMERGENCE_WITH_RESIDUAL_BLOCKADE)).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(delayedEmergenceCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(delayedEmergenceCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(delayedEmergenceCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(delayedEmergenceCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...DELAYED_EMERGENCE_OBJECTIVES]);
    expect(supportsDelayedEmergenceDifferential({
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
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(expert.assessment?.escalation).toBe('urgent-neurologic-evaluation');
    expect(refusals(expert)).toHaveLength(0);
  });

  it('refuses every step taken out of turn', () => {
    const errored = run(FIXTURES.commonError);
    expect(refusals(errored)).toHaveLength(2);
    expect(errored.assessment?.neurologicExamAtTick).toBeNull();
    expect(errored.assessment?.escalation).toBeNull();
    expect(outcomes(errored)).toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('costs nothing once the refusal is heeded', () => {
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['met', 'met', 'met', 'met', 'met']);
    // It really did make the out-of-turn attempt first.
    expect(refusals(recovered)).toHaveLength(2);
    expect(FIXTURES.recovery.slice(0, FIXTURES.commonError.length))
      .toEqual([...FIXTURES.commonError]);
  });

  it('scores four of five for a complete workup that then does nothing', () => {
    // The sharpest reading in this lesson. Every investigative step is taken,
    // the lateralizing sign is found, and routine observation continues.
    const observed = run([
      CHOOSE(300, 'review-support'),
      CHOOSE(600, 'review-exposure-and-block'),
      CHOOSE(900, 'check-metabolic-causes'),
      CHOOSE(1200, 'perform-focused-neurologic-exam'),
      CHOOSE(1500, 'continue-routine-recovery'),
    ]);
    expect(outcomes(observed)).toEqual(['met', 'met', 'met', 'met', 'not-met']);
    expect(observed.assessment?.escalation).toBe('continue-routine-recovery');
    // The sign was found; it just was not acted on.
    expect(observed.assessment?.neurologicExamAtTick).not.toBeNull();
    expect(observed.findings[3]!.finding).toContain('asymmetric');
    expect(observed.findings[4]!.finding).toContain('continued routine recovery');
    expect(refusals(observed)).toHaveLength(0);
  });

  it('fails everything when nothing is chosen', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });
});
