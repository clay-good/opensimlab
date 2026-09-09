/**
 * Reference transcripts for the venous-air-embolism lesson, replayed through the
 * real engine and scored by the real debrief.
 *
 * The assertion this file exists for is that an earned objective buys nothing.
 * The error path establishes 100% oxygen with active delivery — scored met — and
 * ends indistinguishable from a run that does nothing. One source-control
 * action, scoring two of four, returns the patient nearly to baseline.
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
import { VENOUS_AIR_EMBOLISM_DURING_LINE_REMOVAL as SCENARIO } from '@anesthesia/scenarios/venous-air-embolism-during-line-removal';
import { PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE } from '@anesthesia/scenarios/pneumothorax-under-positive-pressure';
import { VENOUS_AIR_EMBOLISM_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/venous-air-embolism-fixtures';
import {
  VENOUS_AIR_EMBOLISM_OBJECTIVES, supportsVenousAirEmbolism,
} from '../../src/modules/anesthesia/venous-air-embolism-during-line-removal';
import { venousAirEmbolismCompletionEvidence } from '../../src/modules/anesthesia/venous-air-embolism-completion';

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
/** The two numbers that carry the signal, at the settled end of the run. */
const settled = (result: ReturnType<typeof run>) => {
  const state = result.history[3900]!.state as Readonly<Record<string, number>>;
  return { etco2: Math.round(state.etco2MmHg!), map: Math.round(state.meanArterialMmHg!) };
};
const saturationRange = (result: ReturnType<typeof run>) => {
  const values = result.history.slice(ONSET).map(({ state }) => state.spo2Percent ?? 100);
  return { low: Math.round(Math.min(...values)), high: Math.round(Math.max(...values)) };
};

const STOP_ENTRY = (tick: number): LearnerAction =>
  ({ tick, type: 'control-venous-air-entry', payload: { method: 'stop-entry' } });

describe('Venous-air-embolism transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsVenousAirEmbolism(SCENARIO)).toBe(true);
    // The module's other abrupt cardiopulmonary collapse under anaesthesia.
    expect(supportsVenousAirEmbolism(PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE)).toBe(false);
    expect(supportsVenousAirEmbolism({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(venousAirEmbolismCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(venousAirEmbolismCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(venousAirEmbolismCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(venousAirEmbolismCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...VENOUS_AIR_EMBOLISM_OBJECTIVES]);
    expect(supportsVenousAirEmbolism({
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
    expect(expert.findings[1]!.finding).toContain('accepted 15 seconds after the modeled event');
    expect(expert.findings[3]!.finding).toContain('recovered to 28 mmHg after accepted source control');
    expect(settled(expert)).toEqual({ etco2: 37, map: 88 });
  });

  it('earns the oxygen objective on a path indistinguishable from doing nothing', () => {
    // The reason this lesson is worth binding. Recognised, escalated,
    // oxygenated — and the source left open.
    const errored = run(FIXTURES.commonError);
    const idle = run(FIXTURES.noAction);
    expect(outcomes(errored)).toEqual(['met', 'not-met', 'met', 'not-met']);
    expect(errored.findings[2]!.outcome).toBe('met');
    expect(settled(errored)).toEqual({ etco2: 17, map: 53 });
    expect(settled(idle)).toEqual({ etco2: 16, map: 55 });
    // Within a millimetre or two of each other on both numbers.
    expect(Math.abs(settled(errored).etco2 - settled(idle).etco2)).toBeLessThanOrEqual(2);
    expect(Math.abs(settled(errored).map - settled(idle).map)).toBeLessThanOrEqual(2);
  });

  it('recovers nearly everything from source control alone', () => {
    // One action, two of four objectives, and the patient comes back.
    const sourceOnly = run([STOP_ENTRY(750)]);
    expect(outcomes(sourceOnly)).toEqual(['not-met', 'met', 'not-met', 'met']);
    expect(settled(sourceOnly).etco2).toBeGreaterThanOrEqual(35);
    expect(settled(sourceOnly).map).toBeGreaterThanOrEqual(90);
    // Pre-event baseline, for the comparison the evidence makes.
    const preEvent = run(FIXTURES.noAction).history[599]!.state as Readonly<Record<string, number>>;
    expect(Math.round(preEvent.meanArterialMmHg!)).toBe(92);
    expect(settled(sourceOnly).map).toBeGreaterThanOrEqual(Math.round(preEvent.meanArterialMmHg!));
  });

  it('shows the saturation carrying almost no signal', () => {
    // The oximeter barely moves on any path while the capnogram falls twenty.
    for (const path of ['expert', 'commonError', 'noAction'] as const) {
      const range = saturationRange(run(FIXTURES[path]));
      expect(range.low).toBeGreaterThanOrEqual(91);
      expect(range.high).toBeLessThanOrEqual(100);
    }
    expect(saturationRange(run(FIXTURES.noAction)).low).toBe(91);
    // Against a capnogram that falls from 37 to 17.
    const idle = run(FIXTURES.noAction);
    const preEvent = idle.history[599]!.state as Readonly<Record<string, number>>;
    expect(Math.round(preEvent.etco2MmHg!) - settled(idle).etco2).toBeGreaterThanOrEqual(20);
  });

  it('costs the score and not the patient when source control is late', () => {
    // The opposite arrangement from the high-spinal lesson: there a missed
    // window was fatal, here it is only unscored.
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['met', 'not-met', 'met', 'met']);
    expect(recovered.findings[1]!.finding).toContain('accepted 80 seconds after the modeled event');
    expect(settled(recovered).etco2).toBeGreaterThanOrEqual(35);
    expect(settled(recovered).map).toBeGreaterThanOrEqual(85);
    expect(FIXTURES.recovery.slice(0, FIXTURES.commonError.length))
      .toEqual([...FIXTURES.commonError]);
  });

  it('credits nothing when the abrupt change is never acted on', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.findings[3]!.finding).toContain('no accepted source-control intent preceded it');
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations)
      .toContain('venous-air-embolism-injector-is-a-teaching-trajectory');
    expect(SCENARIO.metadata.limitations).toContain('peep-not-modelled');
    // A single-drug formulary: nothing here is a pharmacological answer.
    expect(SCENARIO.formulary.map(({ drugId }) => drugId)).toEqual(['propofol']);
  });
});
