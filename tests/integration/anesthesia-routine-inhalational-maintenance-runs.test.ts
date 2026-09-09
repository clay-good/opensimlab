/**
 * Reference transcripts for the routine-inhalational-maintenance lesson,
 * replayed through the real engine and scored by the real debrief.
 *
 * The assertion this file exists for is counter-intuitive and exact: take the
 * expert path's four actions, move the volatile step 550 ticks EARLIER, and the
 * measured pressure rise goes from 19.5% to 29.6% — worse than the 27.3% of a
 * run that does nothing. The rise is measured from the immediate pre-stimulus
 * pressure, so deepening early lowers its own denominator.
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
import { ROUTINE_INHALATIONAL_MAINTENANCE as SCENARIO } from '@anesthesia/scenarios/routine-inhalational-maintenance';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { ROUTINE_INHALATIONAL_MAINTENANCE_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/routine-inhalational-maintenance-fixtures';
import {
  ROUTINE_INHALATIONAL_MAINTENANCE_OBJECTIVES, supportsRoutineInhalationalMaintenance,
} from '../../src/modules/anesthesia/routine-inhalational-maintenance';
import { routineInhalationalMaintenanceCompletionEvidence } from '../../src/modules/anesthesia/routine-inhalational-maintenance-completion';

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
  // Guards the fixture ordering: a later-tick action placed earlier in the
  // array is silently never applied by this single-index replay.
  expect(next).toBe(actions.length);
  return {
    hash: hash.digest('hex'), history, events, engine,
    findings: objectiveFindings(
      SCENARIO, history, 0, engine.equipment().preoxygenationSeconds, actions, events,
    ),
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
/** The percentage the second objective is scored on. */
const pressureRise = (result: ReturnType<typeof run>) =>
  Number(/mean arterial pressure rose ([\d.]+)%/.exec(result.findings[1]!.finding)![1]);
/** How much of the scored window the depth trace spent in band. */
const depthWindow = (result: ReturnType<typeof run>) =>
  Number(/for (\d+)% of the recorded/.exec(result.findings[0]!.finding)![1]);
const endState = (result: ReturnType<typeof run>) => {
  const state = result.history[5300]!.state as Readonly<Record<string, number>>;
  return { map: Math.round(state.meanArterialMmHg!), depth: Math.round(state.depthIndex!) };
};

const REMIFENTANIL = (tick: number, rate: number): LearnerAction =>
  ({ tick, type: 'infusion', payload: { drugId: 'remifentanil', rate } });
const SEVOFLURANE = (tick: number, percent: number): LearnerAction =>
  ({ tick, type: 'ventilator', payload: { sevofluranePercent: percent } });

describe('Routine-inhalational-maintenance transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(3);
    expect(supportsRoutineInhalationalMaintenance(SCENARIO)).toBe(true);
    expect(supportsRoutineInhalationalMaintenance(ROUTINE_INDUCTION)).toBe(false);
    expect(supportsRoutineInhalationalMaintenance({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(routineInhalationalMaintenanceCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(routineInhalationalMaintenanceCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(routineInhalationalMaintenanceCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(routineInhalationalMaintenanceCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...ROUTINE_INHALATIONAL_MAINTENANCE_OBJECTIVES]);
    expect(supportsRoutineInhalationalMaintenance({
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

  it('meets all three from a narrow titration window', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met']);
    expect(depthWindow(expert)).toBe(100);
    expect(pressureRise(expert)).toBe(19.5);
    expect(endState(expert)).toEqual({ map: 68, depth: 53 });
  });

  it('scores worse for acting earlier, and worse than not acting at all', () => {
    // The reason this lesson is worth binding. Identical actions, one moved.
    const expert = run(FIXTURES.expert);
    const early = run([
      REMIFENTANIL(1800, 0.2), SEVOFLURANE(1800, 4),
      SEVOFLURANE(2600, 1.4), REMIFENTANIL(3700, 0),
    ]);
    const idle = run(FIXTURES.noAction);
    expect(pressureRise(expert)).toBe(19.5);
    expect(pressureRise(early)).toBe(29.6);
    expect(pressureRise(idle)).toBe(27.3);
    expect(pressureRise(early)).toBeGreaterThan(pressureRise(idle));
    // And it costs the depth objective too.
    expect(outcomes(early)).toEqual(['partly-met', 'partly-met', 'met']);
    expect(depthWindow(early)).toBe(68);
  });

  it('reads an infusion as present rather than as a dose', () => {
    // A sixteen-fold dose range moves the scored rise by a tenth of a point.
    const low = run([REMIFENTANIL(1800, 0.05), SEVOFLURANE(2350, 4),
      SEVOFLURANE(2600, 1.4), REMIFENTANIL(3700, 0)]);
    const high = run([REMIFENTANIL(1800, 0.8), SEVOFLURANE(2350, 4),
      SEVOFLURANE(2600, 1.4), REMIFENTANIL(3700, 0)]);
    expect(Math.abs(pressureRise(low) - pressureRise(high))).toBeLessThanOrEqual(0.2);
    expect(low.findings[1]!.outcome).toBe(high.findings[1]!.outcome);
    // For scale: the expert-versus-early TIMING difference is 10.1 points.
    expect(pressureRise(low)).toBeLessThan(25);
  });

  it('handles the stimulus and finishes the case badly', () => {
    // The error path earns the stimulus objective and abandons the patient
    // deep and hypotensive.
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['not-met', 'met', 'partly-met']);
    expect(errored.findings[1]!.outcome).toBe('met');
    expect(depthWindow(errored)).toBe(33);
    expect(endState(errored)).toEqual({ map: 43, depth: 20 });
  });

  it('recovers the case when the volatile is withdrawn late', () => {
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['partly-met', 'met', 'met']);
    expect(depthWindow(recovered)).toBe(74);
    expect(endState(recovered)).toEqual({ map: 67, depth: 51 });
    // Same first two actions as the error path; only the withdrawal differs.
    expect(FIXTURES.recovery.slice(0, 2)).toEqual([...FIXTURES.commonError.slice(0, 2)]);
  });

  it('earns the depth objective by leaving the baseline alone', () => {
    // Doing nothing holds the depth index at the top of the band all case.
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['met', 'not-met', 'partly-met']);
    expect(depthWindow(idle)).toBe(100);
    expect(endState(idle).depth).toBe(60);
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations).toContain('depth-index-is-a-drug-model-not-an-eeg');
    expect(SCENARIO.metadata.limitations).toContain('volatile-circulatory-effect-is-a-teaching-model');
    expect(SCENARIO.metadata.limitations).toContain('opioid-alone-hypnosis');
  });
});
