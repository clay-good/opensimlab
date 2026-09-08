/**
 * Reference transcripts for the aspiration-risk lesson, replayed through the
 * real engine and scored by the real debrief.
 *
 * The assertion this file exists for is the fourth objective. It is not earned
 * by any action a learner can take — there is no click for it — and it is met on
 * the expert path alone. A learner who deferred every GLP-1 user on principle
 * would reach the same disposition and fail it.
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
import { ASPIRATION_RISK_RECOGNITION as SCENARIO } from '@anesthesia/scenarios/aspiration-risk-recognition';
import { EMERGENCE_WITH_RESIDUAL_BLOCKADE } from '@anesthesia/scenarios/emergence-with-residual-blockade';
import { ASPIRATION_RISK_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/aspiration-risk-recognition-fixtures';
import {
  ASPIRATION_RISK_OBJECTIVES, supportsAspirationRiskRecognition,
} from '../../src/modules/anesthesia/aspiration-risk-recognition';
import { aspirationRiskCompletionEvidence } from '../../src/modules/anesthesia/aspiration-risk-recognition-completion';

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
    assessment: engine.equipment().resuscitation.aspirationRiskAssessment,
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const refusals = (result: ReturnType<typeof run>) =>
  result.events.filter((event) => event.eventId.includes('refused'));

describe('Aspiration-risk transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsAspirationRiskRecognition(SCENARIO)).toBe(true);
    // The module's other ordered decision vignette, with the same action shape.
    expect(supportsAspirationRiskRecognition(EMERGENCE_WITH_RESIDUAL_BLOCKADE)).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(aspirationRiskCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(aspirationRiskCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(aspirationRiskCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(aspirationRiskCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...ASPIRATION_RISK_OBJECTIVES]);
    expect(supportsAspirationRiskRecognition({
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
    expect(expert.assessment?.classification).toBe('elevated');
    expect(expert.assessment?.plan).toBe('defer-and-replan');
    expect(refusals(expert)).toHaveLength(0);
  });

  it('enforces the order, refusing a classification before a cue review', () => {
    const skipped = run([
      { tick: 300, type: 'aspiration-risk-assessment', payload: { action: 'classify-routine' } },
      { tick: 600, type: 'aspiration-risk-assessment', payload: { action: 'proceed-routine' } },
    ] as LearnerAction[]);
    expect(refusals(skipped)).toHaveLength(2);
    expect(skipped.assessment?.classification).toBeNull();
    expect(skipped.assessment?.plan).toBeNull();
  });

  it('differs from the recovery path in exactly one action', () => {
    const errored = FIXTURES.commonError;
    const recovered = FIXTURES.recovery;
    expect(errored).toHaveLength(recovered.length);
    const differing = errored.filter((action, index) =>
      JSON.stringify(action) !== JSON.stringify(recovered[index]));
    expect(differing).toHaveLength(1);
    expect(differing[0]!.payload.action).toBe('proceed-routine');
    expect(recovered.at(-1)!.payload.action).toBe('defer-and-replan');
  });

  it('gives partial credit for the cautious disposition after the wrong reading', () => {
    const errored = run(FIXTURES.commonError);
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(errored)).toEqual(['met', 'not-met', 'not-met', 'not-met']);
    expect(outcomes(recovered)).toEqual(['met', 'not-met', 'partly-met', 'not-met']);
    expect(recovered.findings[2]!.finding).toContain('did not identify');
  });

  it('cannot be earned directly: the fourth objective has no action of its own', () => {
    // There is no click for it. It is met on the expert path alone, and a path
    // that defers on principle rather than on this patient fails it.
    const deferredAnyway = run(FIXTURES.recovery);
    expect(deferredAnyway.assessment?.plan).toBe('defer-and-replan');
    expect(deferredAnyway.findings[3]!.outcome).toBe('not-met');
    expect(run(FIXTURES.expert).findings[3]!.outcome).toBe('met');
    // And no bounded choice names it.
    for (const action of [...FIXTURES.expert, ...FIXTURES.commonError, ...FIXTURES.recovery]) {
      expect(String(action.payload.action)).not.toContain('glp1');
    }
  });

  it('fails everything when the list is never opened', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
  });
});
