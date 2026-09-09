/**
 * Reference transcripts for the paediatric inhalational-induction lesson, the
 * thirty-ninth and last in the module, replayed through the real engine and
 * scored by the real debrief.
 *
 * The assertion this file exists for is about WHEN rather than whether: the
 * scored sixty seconds are the sixty immediately after the reduction, so the
 * recovery path ends at the expert path's settled numbers to the digit and is
 * still scored lower.
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
import { ROUTINE_PEDIATRIC_INHALATIONAL_INDUCTION as SCENARIO } from '@anesthesia/scenarios/routine-pediatric-inhalational-induction';
import { ROUTINE_PEDIATRIC_IV_INDUCTION } from '@anesthesia/scenarios/routine-pediatric-iv-induction';
import { ROUTINE_PEDIATRIC_INHALATIONAL_INDUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/routine-pediatric-inhalational-induction-fixtures';
import {
  ROUTINE_PEDIATRIC_INHALATIONAL_INDUCTION_OBJECTIVES,
  supportsRoutinePediatricInhalationalInduction,
} from '../../src/modules/anesthesia/routine-pediatric-inhalational-induction';
import { routinePediatricInhalationalInductionCompletionEvidence } from '../../src/modules/anesthesia/routine-pediatric-inhalational-induction-completion';

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
/** Where the child ends up, which is not what the third objective reads. */
const settled = (result: ReturnType<typeof run>) => {
  const state = result.history[4100]!.state as Readonly<Record<string, number>>;
  return {
    depth: Math.round(state.depthIndex!),
    map: Math.round(state.meanArterialMmHg!),
  };
};

const VENTILATOR = (tick: number, payload: Readonly<Record<string, string | number | boolean>>): LearnerAction =>
  ({ tick, type: 'ventilator', payload });

describe('Paediatric inhalational-induction transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(3);
    expect(supportsRoutinePediatricInhalationalInduction(SCENARIO)).toBe(true);
    // The other paediatric induction lesson: same-sized child, different route.
    expect(supportsRoutinePediatricInhalationalInduction(ROUTINE_PEDIATRIC_IV_INDUCTION)).toBe(false);
    expect(supportsRoutinePediatricInhalationalInduction({
      ...SCENARIO, patient: { ...SCENARIO.patient, ageYears: 42 },
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(routinePediatricInhalationalInductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(routinePediatricInhalationalInductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toEqual([]);
    expect(routinePediatricInhalationalInductionCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(routinePediatricInhalationalInductionCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...ROUTINE_PEDIATRIC_INHALATIONAL_INDUCTION_OBJECTIVES]);
    expect(supportsRoutinePediatricInhalationalInduction({
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

  it('meets every objective when the vaporizer comes down promptly', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met']);
    expect(expert.findings[0]!.finding).toContain('oxygen 100%, fresh-gas flow 6.0 L/min, and sevoflurane 0.0%');
    expect(expert.findings[2]!.finding).toContain('The next 60 seconds kept predicted depth 40–60');
    expect(settled(expert)).toEqual({ depth: 49, map: 60 });
  });

  it('scores the sixty seconds after the reduction, not the best sixty', () => {
    // The reason this lesson is worth binding. The recovery ends exactly where
    // the expert ends and is still scored lower.
    const expert = run(FIXTURES.expert);
    const recovered = run(FIXTURES.recovery);
    expect(settled(recovered)).toEqual(settled(expert));
    expect(outcomes(recovered)).toEqual(['met', 'met', 'partly-met']);
    expect(recovered.findings[2]!.outcome).not.toBe(expert.findings[2]!.outcome);
    expect(recovered.findings[2]!.finding).toContain('did not sustain 60 seconds');
    // At the moment it reduced, the child was far too deep.
    const atReduction = recovered.history[1800]!.state as Readonly<Record<string, number>>;
    expect(Math.round(atReduction.depthIndex!)).toBeLessThan(40);
  });

  it('leaves the child deep when the vaporizer never comes down', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['met', 'met', 'not-met']);
    expect(errored.findings[2]!.finding).toContain('No accepted 0.5–3% reduction');
    expect(settled(errored)).toEqual({ depth: 16, map: 34 });
    // The recovery is the error path with one action appended.
    expect(FIXTURES.recovery.slice(0, FIXTURES.commonError.length))
      .toEqual([...FIXTURES.commonError]);
  });

  it('loses the preparation objective to a vaporizer turned on too soon', () => {
    // The restraint clause: raising oxygen and flow WITH the vaporizer already
    // on records the preparation as the machine defaults instead.
    const together = run([
      VENTILATOR(100, { delivering: true, fio2: 1, freshGasFlowLPerMin: 6, sevofluranePercent: 6 }),
      VENTILATOR(500, { sevofluranePercent: 2 }),
    ]);
    expect(together.findings[0]!.outcome).toBe('not-met');
    expect(together.findings[0]!.finding)
      .toContain('oxygen 21%, fresh-gas flow 2.0 L/min');
    expect(SCENARIO.equipment.ventilator.freshGasFlowLPerMin).toBe(2);
  });

  it('reads the end-tidal concentration rather than the dial', () => {
    const expert = run(FIXTURES.expert);
    expect(expert.findings[1]!.finding).toContain('The first positive vaporizer setting was 6.0%');
    expect(expert.findings[1]!.finding).toContain('0.8 age-adjusted MAC was reached at 48.7 seconds');
    expect(expert.findings[1]!.finding)
      .toContain('Machine delivery and end-tidal concentration are not interchangeable');
  });

  it('exercises nothing when no volatile is delivered', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-exercised', 'not-exercised', 'not-exercised']);
    expect(idle.findings[1]!.finding).toContain('No positive sevoflurane delivery was recorded');
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations).toContain('pediatric-case-is-one-bounded-profile');
    expect(SCENARIO.metadata.limitations).toContain('depth-index-is-a-drug-model-not-an-eeg');
    expect(SCENARIO.formulary).toEqual([]);
  });
});
