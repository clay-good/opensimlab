/**
 * Reference transcripts for the extubation-readiness lesson, replayed through
 * the real engine and scored by the real debrief.
 *
 * The assertion this file exists for is that over-caution is an error here, and
 * an error only because of the numbers. The same four reviews in the
 * residual-blockade lesson, at a ratio of 0.72, make deferring correct.
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
import { EXTUBATION_READINESS as SCENARIO } from '@anesthesia/scenarios/extubation-readiness';
import { EMERGENCE_WITH_RESIDUAL_BLOCKADE } from '@anesthesia/scenarios/emergence-with-residual-blockade';
import { EXTUBATION_READINESS_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/extubation-readiness-fixtures';
import {
  EXTUBATION_READINESS_OBJECTIVES, supportsExtubationReadiness,
} from '../../src/modules/anesthesia/extubation-readiness';
import { extubationReadinessCompletionEvidence } from '../../src/modules/anesthesia/extubation-readiness-completion';

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
    assessment: engine.equipment().resuscitation.extubationReadinessAssessment,
    intubated: engine.equipment().airway.intubated,
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const refusals = (result: ReturnType<typeof run>) =>
  result.events.filter((event) => event.eventId.includes('refused'));
const CHOOSE = (tick: number, action: string): LearnerAction =>
  ({ tick, type: 'extubation-readiness-assessment', payload: { action } });

describe('Extubation-readiness transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(supportsExtubationReadiness(SCENARIO)).toBe(true);
    // The lesson this one mirrors: same reviews, lower ratio, opposite answer.
    expect(supportsExtubationReadiness(EMERGENCE_WITH_RESIDUAL_BLOCKADE)).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(extubationReadinessCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(extubationReadinessCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(extubationReadinessCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(extubationReadinessCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...EXTUBATION_READINESS_OBJECTIVES]);
    expect(supportsExtubationReadiness({
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

  it('meets every objective on the expert path, and removes no tube', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(expert.assessment?.decision).toBe('ready-for-planned-awake-extubation');
    expect(refusals(expert)).toHaveLength(0);
    // The lesson stops at the decision, which its own measure says.
    expect(expert.intubated).toBe(true);
    expect(SCENARIO.metadata.objectives[4]!.measure).toContain('without simulating tube removal');
  });

  it('refuses a decision taken before the reviews', () => {
    const errored = run(FIXTURES.commonError);
    expect(refusals(errored)).toHaveLength(1);
    expect(errored.assessment?.decision).toBeNull();
    expect(outcomes(errored)).toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('costs nothing once the refusal is heeded', () => {
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(refusals(recovered)).toHaveLength(1);
    expect(FIXTURES.recovery.slice(0, FIXTURES.commonError.length))
      .toEqual([...FIXTURES.commonError]);
  });

  it('scores four of five for a complete workup that then waits', () => {
    // Over-caution is an error here, and it is an error only because of the
    // numbers. The four reviews were done correctly; only the decision was wrong.
    const waited = run([
      CHOOSE(300, 'review-quantitative-recovery'),
      CHOOSE(600, 'review-awake-airway-protection'),
      CHOOSE(900, 'review-spontaneous-gas-exchange'),
      CHOOSE(1200, 'review-airway-risk-and-rescue'),
      CHOOSE(1500, 'continue-support-and-reassess'),
    ]);
    expect(outcomes(waited)).toEqual(['met', 'met', 'met', 'met', 'not-met']);
    expect(waited.assessment?.decision).toBe('continue-support-and-reassess');
    expect(refusals(waited)).toHaveLength(0);
    expect(waited.findings[4]!.finding).toContain('continued support');
  });

  it('is the mirror of the residual-blockade lesson, and the ratio is why', () => {
    // Same four reviews, a ratio above rather than below the threshold, and the
    // opposite correct decision.
    const start = run(FIXTURES.noAction).history[0]!.state;
    expect(Number(start.trainOfFourRatio)).toBeGreaterThan(0.9);
    expect(run(FIXTURES.expert).findings[0]!.finding).toContain('above 0.90');
  });

  it('fails everything when nothing is chosen', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.intubated).toBe(true);
  });
});
