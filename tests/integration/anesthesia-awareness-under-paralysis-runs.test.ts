/**
 * Reference transcripts for the awareness-under-paralysis lesson, replayed
 * through the real engine and scored by the real debrief.
 *
 * Two assertions this file exists for. The first is that a late reconnection
 * does not lower the peak the patient was exposed to: the error and recovery
 * paths both reach a predicted depth of 78, and what the looking buys is the
 * length of the interval rather than its depth. The second is the finding that
 * decides how this lesson can be run at all — a generous maintenance infusion
 * hides the failure for longer than a light one, so the objective's own
 * threshold is only reachable in a light anaesthetic or a long interruption.
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
import { AWARENESS_UNDER_PARALYSIS as SCENARIO } from '@anesthesia/scenarios/awareness-under-paralysis';
import { RAPID_SEQUENCE_INDUCTION } from '@anesthesia/scenarios/rapid-sequence-induction';
import { AWARENESS_UNDER_PARALYSIS_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/awareness-under-paralysis-fixtures';
import {
  AWARENESS_UNDER_PARALYSIS_OBJECTIVES, supportsAwarenessUnderParalysis,
} from '../../src/modules/anesthesia/awareness-under-paralysis';
import { awarenessUnderParalysisCompletionEvidence } from '../../src/modules/anesthesia/awareness-under-paralysis-completion';

const PEAKS = { propofol: 100, remifentanil: 90 };
const FAILURE_TICK = 1800;

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
    hash: hash.digest('hex'), history, events,
    findings: objectiveFindings(
      SCENARIO, history, stacking.length, engine.equipment().preoxygenationSeconds, actions, events,
    ),
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const peakDepth = (result: ReturnType<typeof run>) => Math.max(...result.history
  .filter((sample) => sample.tick >= FAILURE_TICK)
  .map((sample) => sample.state.depthIndex ?? 0));
const secondsAboveSixty = (result: ReturnType<typeof run>) => result.history
  .filter((sample) => sample.tick >= FAILURE_TICK && (sample.state.depthIndex ?? 0) > 60).length / 10;
const events = (result: ReturnType<typeof run>, prefix: string) =>
  result.events.filter((event) => event.eventId.startsWith(prefix));

describe('Awareness-under-paralysis transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsAwarenessUnderParalysis(SCENARIO)).toBe(true);
    // The lesson that raises this harm and leaves it unscored shares the same
    // three syringes and both monitors, and must not be read as this patient.
    expect(supportsAwarenessUnderParalysis(RAPID_SEQUENCE_INDUCTION)).toBe(false);
    expect(supportsAwarenessUnderParalysis({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'hypnotic-line-disconnection'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(awarenessUnderParalysisCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(awarenessUnderParalysisCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(awarenessUnderParalysisCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(awarenessUnderParalysisCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...AWARENESS_UNDER_PARALYSIS_OBJECTIVES]);
    expect(supportsAwarenessUnderParalysis({
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
    expect(events(expert, 'hypnotic-line-inspect-')).toHaveLength(1);
    expect(events(expert, 'hypnotic-line-reconnect-')).toHaveLength(1);
    // The warning it acted on is real and brief.
    expect(peakDepth(expert)).toBeGreaterThan(60);
    // The interval is real and it is the shortest of any path by a wide margin.
    expect(secondsAboveSixty(expert)).toBeLessThan(200);
  });

  it('fails silently: nothing but the predicted depth reports the disconnection', () => {
    const errored = run(FIXTURES.commonError);
    const before = errored.history.filter((s) => s.tick > FAILURE_TICK - 300 && s.tick <= FAILURE_TICK);
    const after = errored.history.filter((s) => s.tick > FAILURE_TICK + 600 && s.tick <= FAILURE_TICK + 900);
    // The ordinary vital signs do not move, which is the whole mechanism.
    for (const key of ['spo2Percent', 'meanArterialMmHg', 'heartRateBpm', 'etco2MmHg'] as const) {
      const start = before.at(-1)!.state[key] ?? 0;
      const end = after.at(-1)!.state[key] ?? 0;
      expect(Math.abs(end - start), key).toBeLessThan(6);
    }
    // And the depth index does.
    expect(peakDepth(errored)).toBeGreaterThan(70);
  });

  it('shows what a late but complete response buys, and what it does not', () => {
    const errored = run(FIXTURES.commonError);
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(errored)).toEqual(['not-met', 'not-met', 'not-met', 'met']);
    expect(outcomes(recovered)).toEqual(['not-met', 'partly-met', 'partly-met', 'met']);
    // It takes ten points off the peak the patient was exposed to.
    expect(peakDepth(errored) - peakDepth(recovered)).toBeGreaterThan(5);
    // And it barely shortens the interval at all, because eighty seconds had
    // already been spent before anyone looked and the infusion takes time to
    // reach an effect site that emptied while the pump reported success.
    const shortenedBy = secondsAboveSixty(errored) - secondsAboveSixty(recovered);
    expect(shortenedBy).toBeGreaterThan(0);
    expect(shortenedBy).toBeLessThan(30);
    // And the order cannot be un-given: it fails on both.
    expect(recovered.findings[0]!.finding).toContain('Rocuronium was given before propofol');
  });

  it('scores a reconnection that restores nothing, and the patient is unchanged', () => {
    // The sharpest thing this lesson has to say about a rubric. Inspecting and
    // reconnecting a line that was never feeding an infusion moves two
    // objectives from not met to partly met, and leaves the trace bit-identical
    // to the path that never looked at all.
    const errored = run(FIXTURES.commonError);
    const gesture = run(([...FIXTURES.commonError,
      { tick: 2600, type: 'hypnotic-line', payload: { action: 'inspect' } },
      { tick: 2900, type: 'hypnotic-line', payload: { action: 'reconnect' } },
    ] as LearnerAction[]).sort((a, b) => a.tick - b.tick));
    expect(outcomes(gesture)).toEqual(['not-met', 'partly-met', 'partly-met', 'met']);
    expect(peakDepth(gesture)).toBe(peakDepth(errored));
    expect(secondsAboveSixty(gesture)).toBe(secondsAboveSixty(errored));
  });

  it('does not treat the hazard marker as a performance measure', () => {
    // recognize-paralysis-risk is met when the trace SHOWS the pattern, so the
    // error path meets it by letting the harm happen, and the idle path fails it
    // because nobody ever gave a relaxant. The evidence claims the pattern was
    // exercised and nothing more.
    const errored = run(FIXTURES.commonError);
    const idle = run(FIXTURES.noAction);
    expect(errored.findings[3]!.outcome).toBe('met');
    expect(outcomes(idle)).toEqual(['not-exercised', 'not-met', 'not-met', 'not-met']);
    // The idle path is the lightest of all and still fails it, because the
    // marker needs the block as well as the depth.
    expect(peakDepth(idle)).toBeGreaterThan(peakDepth(errored));
  });

  it('shows that a generous infusion hides the failure for longer than a light one', () => {
    // The finding that decides how this lesson can be run at all. The expert
    // transcript's light maintenance rate is what makes the disconnection
    // visible in time to act; a rate a generous anaesthetist would choose never
    // crosses the objective's threshold at all.
    const generous = run(FIXTURES.expert.map((action) => (
      action.type === 'infusion'
        ? { ...action, payload: { ...action.payload, rate: 0.15 } }
        : action
    )));
    expect(peakDepth(generous)).toBeLessThan(60);
    expect(generous.findings[3]!.outcome).toBe('not-met');
    // Everything else about the run is identical and still passes.
    expect(outcomes(generous).slice(0, 3)).toEqual(['met', 'met', 'met']);
  });
});
