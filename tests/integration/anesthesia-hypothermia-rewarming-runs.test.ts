/**
 * Reference transcripts for the hypothermia lesson, replayed through the real
 * engine and scored by the real debrief.
 *
 * The assertion this file exists for is exact rather than approximate. Surface
 * warming alone reproduces the expert path's temperatures to the digit; warmed
 * fluids alone reproduce the untreated patient's. Of the two warming objectives,
 * one carries the whole trajectory and the other moves the model by zero.
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
import { HYPOTHERMIA_AND_REWARMING as SCENARIO } from '@anesthesia/scenarios/hypothermia-and-rewarming';
import { EARLY_MALIGNANT_HYPERTHERMIA_DURING_VOLATILE_ANESTHESIA } from '@anesthesia/scenarios/early-malignant-hyperthermia-during-volatile-anesthesia';
import { HYPOTHERMIA_AND_REWARMING_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/hypothermia-and-rewarming-fixtures';
import {
  HYPOTHERMIA_AND_REWARMING_OBJECTIVES, supportsHypothermiaAndRewarming,
} from '../../src/modules/anesthesia/hypothermia-and-rewarming';
import { hypothermiaAndRewarmingCompletionEvidence } from '../../src/modules/anesthesia/hypothermia-and-rewarming-completion';

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
const temperatureAt = (result: ReturnType<typeof run>, tick: number) =>
  Number((result.history[tick]!.state as Readonly<Record<string, number>>).coreTemperatureC!.toFixed(2));
const nadir = (result: ReturnType<typeof run>) =>
  Number(Math.min(...result.history.map(({ state }) => state.coreTemperatureC ?? 99)).toFixed(2));

const THERMAL = (tick: number, response: string): LearnerAction =>
  ({ tick, type: 'thermal-response', payload: { response } });
/** The ticks the exactness assertions sample. */
const SAMPLES = [1000, 2400, 4000, 6000, 8900];

describe('Hypothermia-and-rewarming transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsHypothermiaAndRewarming(SCENARIO)).toBe(true);
    // The module's other temperature lesson, in the opposite direction.
    expect(supportsHypothermiaAndRewarming(EARLY_MALIGNANT_HYPERTHERMIA_DURING_VOLATILE_ANESTHESIA)).toBe(false);
    expect(supportsHypothermiaAndRewarming({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(hypothermiaAndRewarmingCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(hypothermiaAndRewarmingCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(hypothermiaAndRewarmingCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(hypothermiaAndRewarmingCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...HYPOTHERMIA_AND_REWARMING_OBJECTIVES]);
    expect(supportsHypothermiaAndRewarming({
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

  it('meets every objective on the expert path and rewarms the patient', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(expert.findings[3]!.finding).toContain('reached 36.5°C after active warming');
    expect(temperatureAt(expert, 8900)).toBe(36.6);
    expect(nadir(expert)).toBe(36.36);
  });

  it('reproduces the untreated patient exactly when only the fluids are warmed', () => {
    // The reason this lesson is worth binding. The objective is earned and the
    // temperature is the untreated one, tick for tick.
    const errored = run(FIXTURES.commonError);
    const idle = run(FIXTURES.noAction);
    expect(outcomes(errored)).toEqual(['met', 'not-met', 'met', 'not-met']);
    expect(errored.findings[2]!.outcome).toBe('met');
    for (const tick of SAMPLES) {
      expect(temperatureAt(errored, tick)).toBe(temperatureAt(idle, tick));
    }
    expect(nadir(errored)).toBe(nadir(idle));
    expect(nadir(errored)).toBe(35.51);
  });

  it('reproduces the expert trajectory exactly from surface warming alone', () => {
    // The mirror: the other warming objective carries the whole thing.
    const surfaceOnly = run([
      THERMAL(600, 'confirm-core-temperature'), THERMAL(700, 'start-forced-air-warming'),
    ]);
    const expert = run(FIXTURES.expert);
    expect(outcomes(surfaceOnly)).toEqual(['met', 'met', 'not-met', 'met']);
    for (const tick of SAMPLES) {
      expect(temperatureAt(surfaceOnly, tick)).toBe(temperatureAt(expert, tick));
    }
    expect(nadir(surfaceOnly)).toBe(nadir(expert));
  });

  it('meets all four whether the warming is early or late, at different nadirs', () => {
    // The score cannot tell these apart; the temperature floor differs by half
    // a degree.
    const recovered = run(FIXTURES.recovery);
    const expert = run(FIXTURES.expert);
    expect(outcomes(recovered)).toEqual(outcomes(expert));
    expect(outcomes(recovered)).toEqual(['met', 'met', 'met', 'met']);
    expect(nadir(recovered)).toBe(35.83);
    expect(nadir(expert) - nadir(recovered)).toBeCloseTo(0.53, 2);
    // Both end in the same place.
    expect(temperatureAt(recovered, 8900)).toBe(temperatureAt(expert, 8900));
  });

  it('refuses warming before confirmation, and forgives it once heeded', () => {
    const outOfOrder = run([
      THERMAL(500, 'start-forced-air-warming'),
      THERMAL(600, 'confirm-core-temperature'),
      THERMAL(700, 'start-forced-air-warming'),
      THERMAL(800, 'record-warmed-bulk-fluids'),
    ]);
    expect(outOfOrder.events.some(({ eventId }) =>
      eventId.startsWith('thermal-order-refused-'))).toBe(true);
    expect(outcomes(outOfOrder)).toEqual(['met', 'met', 'met', 'met']);
  });

  it('cools and stays cool when the trend is never read', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    expect(temperatureAt(idle, 8900)).toBe(35.51);
    expect(idle.findings[0]!.finding).toContain('No accepted core-temperature confirmation');
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations)
      .toContain('warming-actions-have-no-device-or-heat-transfer-model');
    expect(SCENARIO.metadata.limitations)
      .toContain('perioperative-temperature-course-is-a-fixed-teaching-target');
  });
});
