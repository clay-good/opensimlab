/**
 * Reference transcripts for the perioperative-hyperglycemia lesson, replayed
 * through the real engine and scored by the real debrief.
 *
 * The most important assertion here is a limit: the repeat glucose is AUTHORED
 * at 174 mg/dL on every path that obtains it, and 174 is inside the declared
 * target — so the third objective grades whether the check was made, never what
 * it found. The counterfactual is impatience: refused at fifteen minutes.
 *
 * These are 19,200-tick replays, the longest in the module, so each fixture path
 * is run once at describe scope and reused.
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
import { PERIOPERATIVE_HYPERGLYCEMIA as SCENARIO } from '@anesthesia/scenarios/perioperative-hyperglycemia';
import { HYPOTHERMIA_AND_REWARMING } from '@anesthesia/scenarios/hypothermia-and-rewarming';
import { PERIOPERATIVE_HYPERGLYCEMIA_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/perioperative-hyperglycemia-fixtures';
import {
  PERIOPERATIVE_HYPERGLYCEMIA_OBJECTIVES, supportsPerioperativeHyperglycemia,
} from '../../src/modules/anesthesia/perioperative-hyperglycemia';
import { perioperativeHyperglycemiaCompletionEvidence } from '../../src/modules/anesthesia/perioperative-hyperglycemia-completion';

/** The authored values this lesson reports, which no learner action changes. */
const CONFIRMED_GLUCOSE = 238;
const REPEAT_GLUCOSE = 174;

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
    glycemic: engine.equipment().resuscitation.glycemicResponse,
    findings: objectiveFindings(
      SCENARIO, history, 0, engine.equipment().preoxygenationSeconds, actions, events,
    ),
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);

const GLYCEMIC = (tick: number, response: string): LearnerAction =>
  ({ tick, type: 'glycemic-response', payload: { response } });

describe('Perioperative-hyperglycemia transcripts through the real engine and debrief', () => {
  // 19,200 ticks a path: run each once and share.
  const expert = run(FIXTURES.expert);
  const errored = run(FIXTURES.commonError);
  const recovered = run(FIXTURES.recovery);
  const idle = run(FIXTURES.noAction);

  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    // The module's only 0.1.1 lesson: every version pin here follows it.
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.1', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(3);
    expect(supportsPerioperativeHyperglycemia(SCENARIO)).toBe(true);
    // The module's other slow metabolic lesson.
    expect(supportsPerioperativeHyperglycemia(HYPOTHERMIA_AND_REWARMING)).toBe(false);
    expect(supportsPerioperativeHyperglycemia({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(perioperativeHyperglycemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(perioperativeHyperglycemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(perioperativeHyperglycemiaCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(perioperativeHyperglycemiaCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...PERIOPERATIVE_HYPERGLYCEMIA_OBJECTIVES]);
    expect(supportsPerioperativeHyperglycemia({
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
    expect(outcomes(expert)).toEqual(['met', 'met', 'met']);
    expect(expert.findings[0]!.finding).toContain(`${CONFIRMED_GLUCOSE} mg/dL`);
    expect(expert.findings[2]!.finding).toContain(`${REPEAT_GLUCOSE} mg/dL`);
    expect(expert.glycemic?.repeatPointOfCareAtTick).toBe(18_800);
  });

  it('reports an authored repeat that no learner action can change', () => {
    // The most important limit in this lesson. The third objective grades the
    // act, never the finding: 174 is fixed, and 174 is inside the target.
    for (const result of [expert, recovered]) {
      expect(result.glycemic?.repeatPointOfCareGlucoseMgPerDl).toBe(REPEAT_GLUCOSE);
      expect(result.findings[2]!.outcome).toBe('met');
    }
    expect(REPEAT_GLUCOSE).toBeGreaterThanOrEqual(100);
    expect(REPEAT_GLUCOSE).toBeLessThanOrEqual(180);
    // The confirmed value is authored too, and identical on every path.
    for (const result of [expert, errored, recovered, idle]) {
      expect(result.glycemic?.pointOfCareGlucoseMgPerDl).toBe(CONFIRMED_GLUCOSE);
    }
  });

  it('loses the objective to impatience rather than to neglect', () => {
    expect(outcomes(errored)).toEqual(['met', 'met', 'not-met']);
    expect(errored.events.some(({ eventId }) =>
      eventId.startsWith('repeat-glucose-too-early-'))).toBe(true);
    expect(errored.glycemic?.repeatPointOfCareAtTick).toBeNull();
    // Everything before the repeat was done correctly.
    expect(errored.findings.slice(0, 2).map(({ outcome }) => outcome)).toEqual(['met', 'met']);
    expect(errored.glycemic?.insulinProtocolIntentAtTick).toBe(700);
  });

  it('costs nothing to be refused once the learner waits', () => {
    expect(outcomes(recovered)).toEqual(['met', 'met', 'met']);
    expect(recovered.events.some(({ eventId }) =>
      eventId.startsWith('repeat-glucose-too-early-'))).toBe(true);
    expect(recovered.glycemic?.repeatPointOfCareAtTick).toBe(18_800);
    expect(FIXTURES.recovery.slice(0, FIXTURES.commonError.length))
      .toEqual([...FIXTURES.commonError]);
  });

  it('refuses the insulin response before confirmation, and forgives it', () => {
    const outOfOrder = run([
      GLYCEMIC(700, 'record-insulin-protocol-intent'),
      GLYCEMIC(800, 'confirm-point-of-care-glucose'),
      GLYCEMIC(900, 'record-insulin-protocol-intent'),
      GLYCEMIC(19_000, 'repeat-point-of-care-glucose'),
    ]);
    expect(outOfOrder.events.some(({ eventId }) =>
      eventId.startsWith('glycemic-order-refused-'))).toBe(true);
    expect(outcomes(outOfOrder)).toEqual(['met', 'met', 'met']);
  });

  it('moves no monitored physiological variable on any path', () => {
    // A documentation lesson. Said here rather than left to be inferred.
    const sampled = (result: ReturnType<typeof run>, key: string) => [0, 9000, 19_100]
      .map((tick) => Math.round((result.history[tick]!.state as Readonly<Record<string, number>>)[key] ?? 0));
    for (const key of ['meanArterialMmHg', 'heartRateBpm', 'spo2Percent']) {
      expect(sampled(expert, key)).toEqual(sampled(idle, key));
      expect(sampled(errored, key)).toEqual(sampled(idle, key));
    }
  });

  it('confirms nothing when the elevated value is ignored', () => {
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met']);
    expect(idle.glycemic?.pointOfCareConfirmedAtTick).toBeNull();
    expect(idle.findings[0]!.finding).toContain('No accepted point-of-care glucose confirmation');
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations).toContain('insulin-action-is-intent-without-dose-or-delivery');
    expect(SCENARIO.metadata.limitations)
      .toContain('perioperative-glucose-results-are-fixed-teaching-values');
  });
});
