/**
 * Reference transcripts for the emergence-with-residual-blockade lesson,
 * replayed through the real engine and scored by the real debrief.
 *
 * This lesson has no drugs and no dials. Its five bounded choices are a review,
 * two classifications and two plans, and the assertions here are about what the
 * engine refuses and what the rubric declines to credit.
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
import { EMERGENCE_WITH_RESIDUAL_BLOCKADE as SCENARIO } from '@anesthesia/scenarios/emergence-with-residual-blockade';
import { QUANTITATIVE_NEUROMUSCULAR_REVERSAL } from '@anesthesia/scenarios/quantitative-neuromuscular-reversal';
import { EMERGENCE_RESIDUAL_BLOCKADE_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/emergence-with-residual-blockade-fixtures';
import {
  EMERGENCE_RESIDUAL_BLOCKADE_OBJECTIVES, supportsEmergenceWithResidualBlockade,
} from '../../src/modules/anesthesia/emergence-with-residual-blockade';
import { emergenceResidualBlockadeCompletionEvidence } from '../../src/modules/anesthesia/emergence-with-residual-blockade-completion';

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
    assessment: engine.equipment().resuscitation.emergenceResidualBlockAssessment,
    intubated: engine.equipment().airway.intubated,
    ventilating: engine.equipment().ventilator.delivering,
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const refusals = (result: ReturnType<typeof run>) =>
  result.events.filter((event) => event.eventId.includes('refused'));

describe('Emergence-with-residual-blockade transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsEmergenceWithResidualBlockade(SCENARIO)).toBe(true);
    // The other lesson in the block thread, which reverses rather than decides.
    expect(supportsEmergenceWithResidualBlockade(QUANTITATIVE_NEUROMUSCULAR_REVERSAL)).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(emergenceResidualBlockadeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(emergenceResidualBlockadeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(emergenceResidualBlockadeCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(emergenceResidualBlockadeCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...EMERGENCE_RESIDUAL_BLOCKADE_OBJECTIVES]);
    expect(supportsEmergenceWithResidualBlockade({
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

  it('presents the pattern the qualitative monitor cannot see', () => {
    // Four twitches, no detectable fade, and a ratio well below 0.9. The whole
    // lesson is that these are simultaneously true.
    const start = run(FIXTURES.noAction).history[0]!.state;
    expect(start.trainOfFourCount).toBe(4);
    expect(Number(start.trainOfFourRatio)).toBeLessThan(0.9);
    expect(Number(start.trainOfFourRatio)).toBeGreaterThan(0.4);
  });

  it('meets every objective on the expert path', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(expert.assessment?.classification).toBe('residual');
    expect(expert.assessment?.plan).toBe('defer-extubation-and-support');
    expect(refusals(expert)).toHaveLength(0);
  });

  it('enforces the order, refusing a classification before a review', () => {
    // The order is the lesson rather than an interface rule, so it is enforced
    // rather than scored: both later actions are refused outright.
    const skipped = run([
      { tick: 300, type: 'emergence-residual-block-assessment', payload: { action: 'classify-recovered' } },
      { tick: 600, type: 'emergence-residual-block-assessment', payload: { action: 'proceed-to-extubation' } },
    ] as LearnerAction[]);
    expect(refusals(skipped)).toHaveLength(2);
    expect(skipped.assessment?.classification).toBeNull();
    expect(skipped.assessment?.plan).toBeNull();
    expect(outcomes(skipped)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('differs from the recovery path in exactly one action', () => {
    const errored = FIXTURES.commonError;
    const recovered = FIXTURES.recovery;
    expect(errored).toHaveLength(recovered.length);
    const differing = errored.filter((action, index) =>
      JSON.stringify(action) !== JSON.stringify(recovered[index]));
    expect(differing).toHaveLength(1);
    expect(differing[0]!.payload.action).toBe('proceed-to-extubation');
    expect(recovered.at(-1)!.payload.action).toBe('defer-extubation-and-support');
  });

  it('gives partial credit for the safe plan after the wrong reading, and no more', () => {
    const errored = run(FIXTURES.commonError);
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(errored)).toEqual(['met', 'not-met', 'not-met', 'not-met']);
    expect(outcomes(recovered)).toEqual(['met', 'not-met', 'partly-met', 'not-met']);
    // The last objective fails on the recovery path too: a path that called 0.72
    // recovered did not preserve the distinction, whatever it then chose to do.
    expect(recovered.findings[3]!.outcome).toBe('not-met');
    expect(recovered.assessment?.plan).toBe('defer-extubation-and-support');
  });

  it('does not credit an outcome that nobody decided', () => {
    // The tube stays in on the idle path, by default rather than by plan.
    const idle = run(FIXTURES.noAction);
    expect(idle.intubated).toBe(true);
    expect(idle.ventilating).toBe(true);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
  });
});
