/**
 * Reference transcripts for the hypotension-after-induction lesson, replayed
 * through the real engine and scored by the real debrief.
 *
 * The assertion this file exists for is that the recovery path loses. It gives
 * more crystalloid than the expert path and starts it within a minute of the
 * pressure falling, and the pressure objective still fails. Volume is the right
 * treatment for this patient and it cannot undo a dose that was wrong before it
 * was given, and the only honest way to show that is to run both and report the
 * numbers the solver produces.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { findStacking } from '@anesthesia/debrief/analysis';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { promptFor } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { HYPOTENSION_AFTER_INDUCTION as SCENARIO } from '@anesthesia/scenarios/hypotension-after-induction';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { HYPOTENSION_AFTER_INDUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/hypotension-after-induction-fixtures';
import {
  HYPOTENSION_AFTER_INDUCTION_OBJECTIVES, supportsHypotensionAfterInduction,
} from '../../src/modules/anesthesia/hypotension-after-induction';
import { hypotensionAfterInductionCompletionEvidence } from '../../src/modules/anesthesia/hypotension-after-induction-completion';

const PEAKS = { propofol: 100, remifentanil: 90 };

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
  const stacking = findStacking(actions, history, PEAKS);
  return {
    hash: hash.digest('hex'), history, events, stacking,
    findings: objectiveFindings(
      SCENARIO, history, stacking.length, engine.equipment().preoxygenationSeconds, actions, events,
    ),
    crystalloidTotalMl: engine.equipment().resuscitation.crystalloidTotalMl,
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const lowestPressure = (result: ReturnType<typeof run>) =>
  Math.min(...result.history.map((sample) => sample.state.meanArterialMmHg ?? Infinity));
const lowestSaturation = (result: ReturnType<typeof run>) =>
  Math.min(...result.history.map((sample) => sample.state.spo2Percent ?? Infinity));
const secondsBelow = (result: ReturnType<typeof run>, threshold: number) =>
  result.history.filter((sample) => (sample.state.meanArterialMmHg ?? Infinity) < threshold).length / 10;
const vasopressorDoses = (result: ReturnType<typeof run>) =>
  result.events.filter((event) => event.eventId.startsWith('vasopressor-')).length;

describe('Hypotension-after-induction transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsHypotensionAfterInduction(SCENARIO)).toBe(true);
    // The lesson that teaches the other mechanism shares the same two syringes
    // and one objective id, and must not be read as this patient.
    expect(supportsHypotensionAfterInduction(ROUTINE_INDUCTION)).toBe(false);
    expect(supportsHypotensionAfterInduction({
      ...SCENARIO,
      patient: {
        ...SCENARIO.patient,
        baseline: { ...SCENARIO.patient.baseline, bloodVolumeMl: 3600 },
      },
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(hypotensionAfterInductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(hypotensionAfterInductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(hypotensionAfterInductionCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(hypotensionAfterInductionCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...HYPOTENSION_AFTER_INDUCTION_OBJECTIVES]);
    expect(supportsHypotensionAfterInduction({
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
    expect(secondsBelow(expert, 65)).toBe(0);
    expect(lowestPressure(expert)).toBeGreaterThanOrEqual(65);
    // A third of the textbook dose, and the vasopressor used once as a bridge
    // rather than as the plan.
    expect(expert.stacking).toHaveLength(0);
    expect(vasopressorDoses(expert)).toBe(1);
    expect(expert.crystalloidTotalMl).toBe(4000);
  });

  it('shows what treating the number costs when the tank is the problem', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['not-met', 'not-met', 'not-met', 'met']);
    expect(errored.crystalloidTotalMl).toBe(0);
    expect(vasopressorDoses(errored)).toBe(4);
    // Not an authored number: it falls out of a circulation 15% short, an
    // elderly baroreflex, and 240 mL a minute still leaving.
    expect(lowestPressure(errored)).toBeLessThan(35);
    expect(secondsBelow(errored, 55)).toBeGreaterThan(500);
  });

  it('halves the exposure on more fluid than the expert path, and still fails', () => {
    const recovered = run(FIXTURES.recovery);
    const errored = run(FIXTURES.commonError);
    // This is the assertion the lesson exists for. The recovery path reads the
    // mechanism correctly, treats it within a minute, and gives 500 mL MORE
    // crystalloid than the path that met every objective — and the pressure
    // objective still fails, because the dose was wrong before the bag was hung.
    expect(outcomes(recovered)).toEqual(['partly-met', 'not-met', 'met', 'met']);
    expect(recovered.crystalloidTotalMl).toBeGreaterThan(run(FIXTURES.expert).crystalloidTotalMl);
    expect(secondsBelow(recovered, 65)).toBeLessThan(secondsBelow(errored, 65) / 2);
    expect(lowestPressure(recovered) - lowestPressure(errored)).toBeGreaterThan(15);
    expect(vasopressorDoses(recovered)).toBe(1);
  });

  it('fails the pressure objective even when nothing is done, and says so', () => {
    // The modelled losses run whether or not anyone induces, so this objective
    // is not a test of the induction alone. The evidence does not claim it is.
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-exercised', 'not-met', 'not-met', 'met']);
    expect(secondsBelow(idle, 65)).toBeGreaterThan(60);
  });

  it('never stresses the saturation, on any path, which is the point of the patient', () => {
    // She is not the desaturating patient and the lesson does not pretend she
    // is. The objective is exercised; it is not the one under threat.
    for (const path of ['expert', 'commonError', 'recovery', 'noAction'] as const) {
      expect(lowestSaturation(run(FIXTURES[path])), path).toBeGreaterThan(95);
    }
  });
});
