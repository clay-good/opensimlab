/**
 * Reference transcripts for the routine-induction lesson, replayed through the
 * real engine and scored by the real debrief.
 *
 * The assertion this file exists for is the clock. The scenario's own objective
 * says "End-tidal, not inspired", and the whole difference between the expert
 * path and the two wrong ones starts with which clock the induction was timed
 * against. Nothing here is authored: every number the objectives are scored on
 * comes out of the compartment solver and the haemodynamic model.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { findStacking } from '@anesthesia/debrief/analysis';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { promptFor } from '@anesthesia/tutor/guidance';
import { INDUCTION_DEMONSTRATION_VERSION } from '@anesthesia/demo/demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { ROUTINE_INDUCTION as SCENARIO } from '@anesthesia/scenarios/routine-induction';
import { RAPID_DESATURATION } from '@anesthesia/scenarios/rapid-desaturation';
import { ROUTINE_INDUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/routine-induction-fixtures';
import {
  ROUTINE_INDUCTION_OBJECTIVES, supportsRoutineInduction,
} from '../../src/modules/anesthesia/routine-induction';
import { routineInductionCompletionEvidence } from '../../src/modules/anesthesia/routine-induction-completion';

/** Time to peak effect, in seconds, for the two drugs this formulary carries. */
const PEAKS = { propofol: 100, remifentanil: 90 };

function run(
  actions: readonly LearnerAction[],
  level: GuidanceLevel = 'unassisted',
  region: 'US' | 'GB' = 'US',
) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
  const hash = createHash('sha256');
  const history: HistorySample[] = [];
  let next = 0;
  for (let tick = 0; tick <= FIXTURES.ticks; tick += 1) {
    while (actions[next]?.tick === tick) { engine.apply(actions[next]!); next += 1; }
    const frame = engine.step();
    hash.update(JSON.stringify(frame));
    history.push({ tick: frame.tick, state: frame.state, concentrations: frame.concentrations } as HistorySample);
    // Reading the tutor must not change what the engine produces.
    const prompt = promptFor(level, {
      scenarioId: SCENARIO.metadata.id, scenarioVersion: SCENARIO.metadata.version,
      tick, state: frame.state as Readonly<Record<string, number>>,
      actions: actions.slice(0, next), ventilating: false, alarmCount: 0,
    }, new Map());
    if (level === 'unassisted') expect(prompt).toBeNull();
  }
  expect(next).toBe(actions.length);
  const preoxygenationSeconds = engine.equipment().preoxygenationSeconds;
  const stacking = findStacking(actions, history, PEAKS);
  return {
    hash: hash.digest('hex'), history, preoxygenationSeconds, stacking,
    findings: objectiveFindings(SCENARIO, history, stacking.length, preoxygenationSeconds, actions),
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const lowest = (result: ReturnType<typeof run>, field: string) =>
  Math.min(...result.history.map((sample) => sample.state[field] ?? Infinity));

describe('Routine induction transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(supportsRoutineInduction(SCENARIO)).toBe(true);
    // A sibling anaesthesia scenario with the same shape must not be read as this one.
    expect(supportsRoutineInduction(RAPID_DESATURATION)).toBe(false);
    expect(supportsRoutineInduction({
      ...SCENARIO, formulary: SCENARIO.formulary.slice(0, 1),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(routineInductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(routineInductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(routineInductionCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(routineInductionCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia')).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...ROUTINE_INDUCTION_OBJECTIVES]);
    expect(supportsRoutineInduction({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: [...SCENARIO.metadata.objectives].reverse(),
      },
    })).toBe(false);
  });

  it('cites the worked example at the version whose beats were measured', () => {
    // The demonstration's induction moved from 190/195 s to 230/235 s, which is
    // what makes the preoxygenation claim in the evidence true. A change to the
    // beats has to move this number and the evidence that names it.
    expect(INDUCTION_DEMONSTRATION_VERSION).toBe('0.2.0');
    const evidence = routineInductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia');
    const guidance = evidence.find(({ id }) => id === 'guidance-and-demonstration')!;
    expect(guidance.evidence.join(' ')).toContain(INDUCTION_DEMONSTRATION_VERSION);
    // And it does not claim a rule that does not exist.
    expect(guidance.evidence.join(' ')).toContain('No rule covers blunt-incision');
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
    // The three minutes the objective asks for, on the clock it actually counts.
    expect(expert.preoxygenationSeconds).toBeGreaterThanOrEqual(180);
    expect(expert.stacking).toHaveLength(0);
    expect(lowest(expert, 'meanArterialMmHg')).toBeGreaterThanOrEqual(65);
  });

  it('fails the clock and the wait on the common-error path', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['partly-met', 'not-met', 'partly-met', 'met', 'met']);
    // Induced three minutes after the flowmeter moved, which is not three
    // minutes of the reserve the objective counts.
    expect(errored.preoxygenationSeconds).toBeLessThan(180);
    expect(errored.stacking).toHaveLength(1);
    expect(errored.stacking[0]).toMatchObject({ drugId: 'propofol', timeToPeakSeconds: 100 });
    expect(errored.stacking[0]!.secondsSincePrevious).toBeLessThan(10);
  });

  it('recovers the one decision that can be recovered, and not the seconds', () => {
    const recovered = run(FIXTURES.recovery);
    const errored = run(FIXTURES.commonError);
    expect(outcomes(recovered)).toEqual(['partly-met', 'met', 'partly-met', 'met', 'met']);
    // The same opening: the preoxygenation deficit is not recoverable, and the
    // two paths carry it equally.
    expect(recovered.preoxygenationSeconds).toBeLessThan(180);
    expect(recovered.stacking).toHaveLength(0);
    // The one difference, measured: not chasing the syringe is worth several
    // millimetres of mercury at the nadir.
    expect(lowest(recovered, 'meanArterialMmHg'))
      .toBeGreaterThan(lowest(errored, 'meanArterialMmHg'));
  });

  it('meets nothing it could have earned when nothing is done', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)[0]).toBe('not-met');
    expect(idle.preoxygenationSeconds).toBe(0);
    // She is never induced, so she never becomes hypotensive or hypoxic: two of
    // the five are met by having done nothing, which is why a score is not a
    // grade and the debrief says what happened rather than adding up.
    expect(outcomes(idle)).toContain('met');
  });
});
