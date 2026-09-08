/**
 * Reference transcripts for the laryngospasm lesson, replayed through the real
 * engine and scored by the real debrief.
 *
 * Two assertions this file exists for, and both are about what the rubric
 * cannot see. The response objectives read the timing of an action and not its
 * size, so an identical maneuver with a token dose scores the same and opens
 * nothing. And the oxygenation objective is carried by preoxygenation rather
 * than by the response: a preoxygenated patient who is given no treatment at all
 * does not desaturate across this whole window.
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
import { LARYNGOSPASM_AFTER_AIRWAY_STIMULATION as SCENARIO } from '@anesthesia/scenarios/laryngospasm-after-airway-stimulation';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { LARYNGOSPASM_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/laryngospasm-after-airway-stimulation-fixtures';
import {
  LARYNGOSPASM_OBJECTIVES, supportsLaryngospasmAfterAirwayStimulation,
} from '../../src/modules/anesthesia/laryngospasm-after-airway-stimulation';
import { laryngospasmCompletionEvidence } from '../../src/modules/anesthesia/laryngospasm-after-airway-stimulation-completion';

const CLOSURE_TICK = 2400;

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
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const nadir = (result: ReturnType<typeof run>) => Math.min(...result.history
  .filter((sample) => sample.tick >= CLOSURE_TICK)
  .map((sample) => sample.state.spo2Percent ?? 100));

describe('Laryngospasm transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsLaryngospasmAfterAirwayStimulation(SCENARIO)).toBe(true);
    expect(supportsLaryngospasmAfterAirwayStimulation(ROUTINE_INDUCTION)).toBe(false);
    // Without the scripted closure three of the four objectives have nothing to
    // measure against, so it is part of the identity rather than of the setting.
    expect(supportsLaryngospasmAfterAirwayStimulation({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.type !== 'laryngospasm'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(laryngospasmCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(laryngospasmCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(laryngospasmCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(laryngospasmCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...LARYNGOSPASM_OBJECTIVES]);
    expect(supportsLaryngospasmAfterAirwayStimulation({
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

  it('stops before the point the engine says is no longer physiology', () => {
    // Load-bearing rather than tidy. Past roughly 4,600 ticks the unreserved
    // paths reach a modelled hypoxic arrest, and the engine states there that it
    // models no resuscitation and that nothing after it is simulated.
    expect(FIXTURES.ticks).toBe(4200);
    for (const path of ['expert', 'commonError', 'recovery', 'noAction'] as const) {
      const result = run(FIXTURES[path]);
      expect(result.events.filter((event) => event.eventId.startsWith('hypoxic-arrest')), path)
        .toHaveLength(0);
      expect(result.events.filter((event) => event.eventId.startsWith('arrest-beyond-model')), path)
        .toHaveLength(0);
    }
  });

  it('meets every objective on the expert path', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(nadir(expert)).toBeGreaterThanOrEqual(92);
  });

  it('shows the same measures ninety seconds late with nothing behind them', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['not-met', 'partly-met', 'partly-met', 'not-met']);
    expect(nadir(errored)).toBeLessThan(70);
  });

  it('gains twenty-two points on the same missing reserve, and still fails', () => {
    const recovered = run(FIXTURES.recovery);
    const errored = run(FIXTURES.commonError);
    expect(outcomes(recovered)).toEqual(['not-met', 'met', 'met', 'not-met']);
    expect(nadir(recovered) - nadir(errored)).toBeGreaterThan(20);
    // The reserve is not recoverable and the objective stays failed.
    expect(nadir(recovered)).toBeLessThan(92);
  });

  it('cannot see whether the deepening dose was big enough to work', () => {
    // The sharpest thing this lesson has to say about its own rubric. The engine
    // relieves the closure only at a depth of 60 or below, so a token dose given
    // at exactly the right moment scores identically and opens nothing.
    const token = run(FIXTURES.recovery.map((action) => (
      action.type === 'bolus'
        ? { ...action, payload: { ...action.payload, amount: 0.5 } }
        : action
    )));
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(token).slice(1, 3)).toEqual(outcomes(recovered).slice(1, 3));
    // Identical to doing nothing at all, to the last decimal place.
    expect(nadir(token)).toBe(nadir(run(FIXTURES.noAction)));
    // And the dose is worth more than the timing: 34 points against the 22 that
    // responding immediately rather than ninety seconds late is worth. The
    // rubric scores the timing and cannot see the dose.
    const doseWorth = nadir(recovered) - nadir(token);
    const timingWorth = nadir(recovered) - nadir(run(FIXTURES.commonError));
    expect(doseWorth).toBeGreaterThan(timingWorth);
    expect(doseWorth).toBeGreaterThan(30);
  });

  it('shows the oxygenation objective is carried by the preparation, not the response', () => {
    // A preoxygenated patient given no treatment whatever does not desaturate
    // across this window, and the objective is met while both response
    // objectives fail outright.
    const untreated = run([FIXTURES.expert[0]!]);
    expect(outcomes(untreated)).toEqual(['met', 'not-met', 'not-met', 'met']);
    expect(nadir(untreated)).toBeGreaterThan(99.9);
  });

  it('fails everything when nothing is done', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
  });
});
