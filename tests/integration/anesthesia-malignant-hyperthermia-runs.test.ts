/**
 * Reference transcripts for the early-MH lesson, replayed through the real
 * engine and scored by the real debrief.
 *
 * Two assertions this file exists for. The crisis is LATENT — it fires on
 * genuine end-tidal volatile exposure rather than at a tick — so a session that
 * never delivers volatile has no malignant hyperthermia in it at all. And the
 * expert path meets the reassessment objective on a trace where nothing changed,
 * because treating within two seconds leaves nothing to reverse; it is the
 * recovery path that actually demonstrates the response.
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
import { EARLY_MALIGNANT_HYPERTHERMIA_DURING_VOLATILE_ANESTHESIA as SCENARIO } from '@anesthesia/scenarios/early-malignant-hyperthermia-during-volatile-anesthesia';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { EARLY_MH_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/early-malignant-hyperthermia-fixtures';
import { EARLY_MH_OBJECTIVES, supportsEarlyMalignantHyperthermia } from '../../src/modules/anesthesia/early-malignant-hyperthermia';
import { earlyMalignantHyperthermiaCompletionEvidence } from '../../src/modules/anesthesia/early-malignant-hyperthermia-completion';

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
const peak = (result: ReturnType<typeof run>, field: string) =>
  Math.max(...result.history.map((sample) => Number(sample.state[field] ?? 0)));
const firstRigidity = (result: ReturnType<typeof run>) =>
  result.history.find((sample) => Number(sample.state.muscleRigidityFraction ?? 0) > 0)?.tick;

describe('Early-MH transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsEarlyMalignantHyperthermia(SCENARIO)).toBe(true);
    expect(supportsEarlyMalignantHyperthermia(ROUTINE_INDUCTION)).toBe(false);
    // Without the latent trigger the scenario has no crisis at all.
    expect(supportsEarlyMalignantHyperthermia({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.type !== 'malignant-hyperthermia'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(earlyMalignantHyperthermiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(earlyMalignantHyperthermiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(earlyMalignantHyperthermiaCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(earlyMalignantHyperthermiaCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...EARLY_MH_OBJECTIVES]);
    expect(supportsEarlyMalignantHyperthermia({
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

  it('has no crisis at all in a patient who was never given a trigger', () => {
    // The correct reading rather than a gap: this event is latent.
    const idle = run(FIXTURES.noAction);
    expect(firstRigidity(idle)).toBeUndefined();
    expect(outcomes(idle))
      .toEqual(['not-exercised', 'not-exercised', 'not-exercised', 'not-exercised']);
    expect(idle.findings[0]!.finding).toContain('requires genuine end-tidal volatile exposure');
  });

  it('meets every objective on the expert path', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(firstRigidity(expert)).toBe(2400);
    expect(expert.findings[1]!.finding).toContain('fresh-gas flow 15.0 L/min');
  });

  it('shows the pattern read as an ordinary light plane', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    // Not authored: it falls out of the hypermetabolic model.
    expect(peak(errored, 'etco2MmHg')).toBeGreaterThan(100);
    expect(peak(errored, 'muscleRigidityFraction')).toBeGreaterThan(0.85);
  });

  it('makes the argument the objectives are built on: temperature is late', () => {
    // The error path never recognises anything, and its temperature is still
    // under 39°C while its carbon dioxide is over 100. A clinician waiting for a
    // fever would still be waiting.
    const errored = run(FIXTURES.commonError);
    expect(peak(errored, 'coreTemperatureC')).toBeLessThan(39);
    expect(peak(errored, 'etco2MmHg')).toBeGreaterThan(peak(errored, 'coreTemperatureC') * 2);
    expect(SCENARIO.metadata.objectives[3]!.measure).toContain('late sign');
  });

  it('recovers two objectives on an identical opening, seventy seconds later', () => {
    const recovered = run(FIXTURES.recovery);
    const errored = run(FIXTURES.commonError);
    expect(outcomes(recovered)).toEqual(['partly-met', 'not-met', 'partly-met', 'met']);
    expect(peak(recovered, 'etco2MmHg')).toBeLessThan(peak(errored, 'etco2MmHg') / 1.5);
    expect(peak(recovered, 'muscleRigidityFraction'))
      .toBeLessThan(peak(errored, 'muscleRigidityFraction'));
  });

  it('shows the recovery, not the expert, actually demonstrating a response', () => {
    // Treating within two seconds leaves nothing to reverse: the expert path
    // meets the reassessment objective on a trace where the carbon dioxide never
    // moved. The evidence says so rather than implying a response it did not need.
    const expert = run(FIXTURES.expert);
    const recovered = run(FIXTURES.recovery);
    expect(expert.findings[3]!.outcome).toBe('met');
    expect(expert.findings[3]!.finding).toContain('from 39 to 39 mmHg');
    expect(recovered.findings[3]!.outcome).toBe('met');
    expect(recovered.findings[3]!.finding).toContain('from 53 to 49 mmHg');
  });
});
