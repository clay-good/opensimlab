/**
 * Reference transcripts for the high-spinal lesson, replayed through the real
 * engine and scored by the real debrief.
 *
 * The assertion this file exists for is a treatment done correctly that saves
 * nobody. The error path earns the circulation objective outright — 500 mL and a
 * listed 12 mg of ephedrine, both inside the window — and its saturation reaches
 * 0%, because it never starts breath delivery. A path that ventilates and gives
 * neither holds 97%, and loses only that objective.
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
import { HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP as SCENARIO } from '@anesthesia/scenarios/high-spinal-after-epidural-top-up';
import { HYPOTENSION_AFTER_INDUCTION } from '@anesthesia/scenarios/hypotension-after-induction';
import { HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/high-spinal-after-epidural-top-up-fixtures';
import {
  HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP_OBJECTIVES, supportsHighSpinalAfterEpiduralTopUp,
} from '../../src/modules/anesthesia/high-spinal-after-epidural-top-up';
import { highSpinalAfterEpiduralTopUpCompletionEvidence } from '../../src/modules/anesthesia/high-spinal-after-epidural-top-up-completion';

/** The scripted event, from which every objective is timed. */
const ONSET = 600;

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
const lowestSaturation = (result: ReturnType<typeof run>) =>
  Math.round(Math.min(...result.history.slice(ONSET).map(({ state }) => state.spo2Percent ?? 100)));
const settledMeanArterial = (result: ReturnType<typeof run>) =>
  Math.round(result.history[3900]!.state.meanArterialMmHg ?? 0);

const HELP: LearnerAction = { tick: 700, type: 'call-for-help', payload: { context: 'high-spinal' } };
const BREATHE = (tick: number): LearnerAction => ({
  tick, type: 'ventilator',
  payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 },
});

describe('High-spinal transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsHighSpinalAfterEpiduralTopUp(SCENARIO)).toBe(true);
    // The module's other lesson about a pressure falling after an intervention.
    expect(supportsHighSpinalAfterEpiduralTopUp(HYPOTENSION_AFTER_INDUCTION)).toBe(false);
    expect(supportsHighSpinalAfterEpiduralTopUp({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(highSpinalAfterEpiduralTopUpCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(highSpinalAfterEpiduralTopUpCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(highSpinalAfterEpiduralTopUpCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(highSpinalAfterEpiduralTopUpCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP_OBJECTIVES]);
    expect(supportsHighSpinalAfterEpiduralTopUp({
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
    expect(expert.findings[0]!.finding).toContain('10 seconds after the modeled event');
    expect(expert.findings[2]!.finding).toContain('500 mL crystalloid was accepted');
    expect(expert.findings[2]!.finding).toContain('12 mg IV ephedrine was accepted');
    expect(lowestSaturation(expert)).toBe(97);
  });

  it('earns the circulation objective on a path that reaches 0% saturation', () => {
    // The reason this lesson is worth binding. Nothing on this path is done
    // carelessly: help is prompt, the fluid and the dose are correct and timely.
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['met', 'not-met', 'met', 'not-met']);
    expect(errored.findings[2]!.outcome).toBe('met');
    expect(lowestSaturation(errored)).toBe(0);
    expect(errored.findings[3]!.finding).toContain('lowest post-event oxygen saturation was 0%');
  });

  it('loses only the objective when the circulation treatment is omitted entirely', () => {
    // The mirror. Ventilate and give neither the fluid nor the ephedrine: the
    // patient is indistinguishable from the expert path.
    const breathingOnly = run([HELP, BREATHE(800)]);
    expect(outcomes(breathingOnly)).toEqual(['met', 'met', 'not-met', 'met']);
    expect(lowestSaturation(breathingOnly)).toBe(lowestSaturation(run(FIXTURES.expert)));
    expect(lowestSaturation(breathingOnly)).toBe(97);
  });

  it('does not restore the pressure on any path, including the expert one', () => {
    // Worth pinning so no reader infers the circulation treatment fixed a
    // number. It calibrates a bounded response; the pressure settles regardless.
    for (const path of ['expert', 'recovery'] as const) {
      expect(settledMeanArterial(run(FIXTURES[path]))).toBe(35);
    }
    expect(settledMeanArterial(run([HELP, BREATHE(800)]))).toBe(35);
  });

  it('recovers all four when breathing arrives at the last accepted moment', () => {
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['met', 'met', 'met', 'met']);
    expect(recovered.findings[1]!.finding).toContain('60 seconds after the modeled event');
    expect(lowestSaturation(recovered)).toBe(93);
    // The recovery is the error path with one action appended.
    expect(FIXTURES.recovery.slice(0, FIXTURES.commonError.length))
      .toEqual([...FIXTURES.commonError]);
  });

  it('records no gradient between a saved patient and a dead one', () => {
    // Twenty seconds later than the recovery: the patient lives and reaches
    // 87%, and the objective fails exactly as the 0% path fails it.
    const late = run([...FIXTURES.commonError, BREATHE(1400)]);
    expect(lowestSaturation(late)).toBe(87);
    expect(late.findings[3]!.outcome).toBe('not-met');
    expect(late.findings[3]!.outcome).toBe(run(FIXTURES.commonError).findings[3]!.outcome);
    expect(outcomes(late)).toEqual(outcomes(run(FIXTURES.commonError)));
  });

  it('does nothing and loses everything when the block is not recognised', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    expect(lowestSaturation(idle)).toBe(0);
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations).toContain('high-spinal-injector-is-a-teaching-trajectory');
    expect(SCENARIO.metadata.limitations).toContain('peep-not-modelled');
  });
});
