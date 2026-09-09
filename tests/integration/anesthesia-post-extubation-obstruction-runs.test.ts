/**
 * Reference transcripts for the post-extubation-obstruction lesson, replayed
 * through the real engine and scored by the real debrief.
 *
 * Two assertions this file exists for. Neither half of the airway bundle does
 * anything alone — the held maneuver without delivery and the delivery without
 * the maneuver each leave the airway exactly where the untreated run leaves it.
 * And the oxygen-alone path reads a BETTER saturation than doing nothing, over
 * an airway that is equally obstructed.
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
import { POST_EXTUBATION_OBSTRUCTION as SCENARIO } from '@anesthesia/scenarios/post-extubation-obstruction';
import { LARYNGOSPASM_AFTER_AIRWAY_STIMULATION } from '@anesthesia/scenarios/laryngospasm-after-airway-stimulation';
import { POST_EXTUBATION_OBSTRUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/post-extubation-obstruction-fixtures';
import {
  POST_EXTUBATION_OBSTRUCTION_OBJECTIVES, supportsPostExtubationObstruction,
} from '../../src/modules/anesthesia/post-extubation-obstruction';
import { postExtubationObstructionCompletionEvidence } from '../../src/modules/anesthesia/post-extubation-obstruction-completion';

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
/** What the airway is actually doing at the settled end of the run. */
const airway = (result: ReturnType<typeof run>) => {
  const state = result.history[2900]!.state as Readonly<Record<string, number>>;
  return {
    patency: Number((result.engine.equipment().airway.patencyFraction ?? 0).toFixed(2)),
    tidalVolumeMl: Math.round(state.tidalVolumeMl!),
    etco2: Math.round(state.etco2MmHg!),
    spo2: Math.round(state.spo2Percent!),
  };
};

const MANEUVER = (tick: number): LearnerAction =>
  ({ tick, type: 'airway-maneuver', payload: { maneuver: 'jaw-thrust-cpap' } });

describe('Post-extubation-obstruction transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(3);
    expect(supportsPostExtubationObstruction(SCENARIO)).toBe(true);
    // The module's other upper-airway closure lesson.
    expect(supportsPostExtubationObstruction(LARYNGOSPASM_AFTER_AIRWAY_STIMULATION)).toBe(false);
    expect(supportsPostExtubationObstruction({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(postExtubationObstructionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(postExtubationObstructionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(postExtubationObstructionCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(postExtubationObstructionCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...POST_EXTUBATION_OBSTRUCTION_OBJECTIVES]);
    expect(supportsPostExtubationObstruction({
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

  it('meets every objective on the expert path and opens the airway', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met']);
    expect(expert.findings[1]!.finding).toContain('began 25 seconds after onset');
    expect(airway(expert)).toEqual({ patency: 1, tidalVolumeMl: 500, etco2: 45, spo2: 100 });
  });

  it('reads a better saturation than doing nothing over an equally shut airway', () => {
    // The reason this lesson is worth binding. The oximeter ranks these two
    // runs in the wrong order.
    const errored = run(FIXTURES.commonError);
    const idle = run(FIXTURES.noAction);
    expect(outcomes(errored)).toEqual(['not-met', 'not-met', 'not-met']);
    expect(airway(errored).spo2).toBe(100);
    expect(airway(idle).spo2).toBe(97);
    expect(airway(errored).spo2).toBeGreaterThan(airway(idle).spo2);
    // And the airway itself is identical on both.
    expect(airway(errored).patency).toBe(airway(idle).patency);
    expect(airway(errored).tidalVolumeMl).toBe(airway(idle).tidalVolumeMl);
    expect(airway(errored).etco2).toBe(airway(idle).etco2);
  });

  it('does nothing with either half of the bundle alone', () => {
    // Not inferable from the objective text, and easy to assume otherwise.
    const idle = airway(run(FIXTURES.noAction));
    const maneuverAlone = airway(run([MANEUVER(350)]));
    const deliveryAlone = airway(run(FIXTURES.commonError));
    for (const alone of [maneuverAlone, deliveryAlone]) {
      expect(alone.patency).toBe(idle.patency);
      expect(alone.tidalVolumeMl).toBe(idle.tidalVolumeMl);
      expect(alone.etco2).toBe(idle.etco2);
    }
    expect(idle.patency).toBe(0.5);
    // Together they move everything.
    const together = airway(run([...FIXTURES.commonError, MANEUVER(350)]));
    expect(together.patency).toBe(1);
    expect(together.tidalVolumeMl).toBe(500);
  });

  it('opens the airway when the missing half arrives late', () => {
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['partly-met', 'partly-met', 'met']);
    expect(airway(recovered).patency).toBe(1);
    expect(airway(recovered).tidalVolumeMl).toBe(500);
    expect(FIXTURES.recovery.slice(0, FIXTURES.commonError.length))
      .toEqual([...FIXTURES.commonError]);
  });

  it('credits nothing when the pattern is never recognised', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met']);
    expect(idle.findings[2]!.finding).toContain('declared initial airway-support bundle was incomplete');
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations).toContain('soft-tissue-obstruction-only');
    expect(SCENARIO.metadata.limitations).toContain('no-refractory-post-extubation-airway-pathway');
    expect(SCENARIO.formulary).toEqual([]);
  });
});
