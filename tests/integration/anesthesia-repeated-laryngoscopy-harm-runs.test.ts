/**
 * Reference transcripts for the repeated-laryngoscopy-harm lesson, replayed
 * through the real engine and scored by the real debrief.
 *
 * The assertion this file exists for contradicts the lesson's own title. In this
 * model repeated laryngoscopy does no measurable harm to a patient with a full
 * oxygen reserve: three attempts hold a minimum saturation of 100%, exactly as
 * one does. The same three attempts without that reserve reach 41%. The attempts
 * are how a reserve is spent; the injury is what happens when there was none.
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
import { REPEATED_LARYNGOSCOPY_HARM as SCENARIO } from '@anesthesia/scenarios/repeated-laryngoscopy-harm';
import { RAPID_DESATURATION } from '@anesthesia/scenarios/rapid-desaturation';
import { REPEATED_LARYNGOSCOPY_HARM_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/repeated-laryngoscopy-harm-fixtures';
import {
  REPEATED_LARYNGOSCOPY_HARM_OBJECTIVES, supportsRepeatedLaryngoscopyHarm,
} from '../../src/modules/anesthesia/repeated-laryngoscopy-harm';
import { repeatedLaryngoscopyHarmCompletionEvidence } from '../../src/modules/anesthesia/repeated-laryngoscopy-harm-completion';

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
/** The lowest saturation from a tick onward: the number the harm would show in. */
const lowestSaturationFrom = (result: ReturnType<typeof run>, tick: number) =>
  Math.round(Math.min(...result.history.slice(tick).map(({ state }) => state.spo2Percent ?? 100)));

describe('Repeated-laryngoscopy-harm transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(supportsRepeatedLaryngoscopyHarm(SCENARIO)).toBe(true);
    // The module's other lesson about a saturation falling during an airway.
    expect(supportsRepeatedLaryngoscopyHarm(RAPID_DESATURATION)).toBe(false);
    // Without the difficult-airway configuration every attempt would succeed.
    expect(supportsRepeatedLaryngoscopyHarm({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(repeatedLaryngoscopyHarmCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(repeatedLaryngoscopyHarmCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(repeatedLaryngoscopyHarmCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(repeatedLaryngoscopyHarmCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...REPEATED_LARYNGOSCOPY_HARM_OBJECTIVES]);
    expect(supportsRepeatedLaryngoscopyHarm({
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
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(expert.findings[0]!.finding).toContain('0.92 at the first accepted propofol dose');
    expect(expert.findings[1]!.finding).toContain('60 seconds before the first laryngoscopy');
    expect(expert.findings[2]!.finding).toContain('1 completed tracheal attempt');
    expect(expert.findings[3]!.finding).toContain('without another completed tracheal attempt');
  });

  it('measures no harm from three attempts when the reserve is full', () => {
    // The reason this lesson is worth binding, and it argues with the title.
    // Same three attempts, same ticks; only the preoxygenation differs.
    const withReserve = run(FIXTURES.recovery);
    const withoutReserve = run(FIXTURES.commonError);
    expect(lowestSaturationFrom(withReserve, 1500)).toBe(100);
    expect(lowestSaturationFrom(withoutReserve, 1500)).toBe(41);
    // And a single attempt with the reserve is no better than three with it.
    expect(lowestSaturationFrom(run(FIXTURES.expert), 1500))
      .toBe(lowestSaturationFrom(withReserve, 1500));
    // The attempts are marked down identically on both paths regardless.
    expect(outcomes(withReserve)[2]).toBe(outcomes(withoutReserve)[2]);
    expect(outcomes(withReserve)[3]).toBe(outcomes(withoutReserve)[3]);
    expect(outcomes(withReserve)).toEqual(['met', 'partly-met', 'not-met', 'partly-met', 'met']);
    expect(outcomes(withoutReserve)).toEqual(['not-met', 'partly-met', 'not-met', 'partly-met', 'partly-met']);
  });

  it('shows the two variables compounding rather than either acting alone', () => {
    // One attempt without reserve is bad; three without it are far worse. So
    // neither the missing preoxygenation nor the repetition explains the 41%.
    const oneAttemptNoReserve = run([
      { tick: 1200, type: 'call-for-help', payload: { context: 'airway' } },
      { tick: 1500, type: 'bolus', payload: { drugId: 'propofol', amount: 150, unit: 'mg' } },
      { tick: 1800, type: 'laryngoscopy', payload: { technique: 'video' } },
      { tick: 2600, type: 'airway-device', payload: { device: 'supraglottic-airway' } },
      { tick: 2900, type: 'ventilator', payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 } },
    ] as LearnerAction[]);
    expect(lowestSaturationFrom(oneAttemptNoReserve, 1500)).toBe(76);
    expect(lowestSaturationFrom(run(FIXTURES.commonError), 1500))
      .toBeLessThan(lowestSaturationFrom(oneAttemptNoReserve, 1500));
    expect(oneAttemptNoReserve.findings[0]!.outcome).toBe('not-met');
    expect(oneAttemptNoReserve.findings[0]!.finding).toContain('0.17');
  });

  it('isolates the preoxygenation as the only difference between the two', () => {
    // The recovery IS the error path with one action prepended, and that action
    // is worth 59 saturation points.
    expect(FIXTURES.recovery.slice(1)).toEqual([...FIXTURES.commonError]);
    expect(FIXTURES.recovery[0]!.type).toBe('ventilator');
    expect(FIXTURES.recovery[0]!.tick).toBeLessThan(FIXTURES.commonError[0]!.tick);
  });

  it('exercises nothing at all without an accepted induction dose', () => {
    // Not-exercised rather than not-met: the whole rubric is downstream of it.
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual([
      'not-exercised', 'not-exercised', 'not-exercised', 'not-exercised', 'not-exercised',
    ]);
    expect(idle.findings[0]!.finding).toContain('No accepted positive propofol induction dose');
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations).toContain('no-cico-or-front-of-neck-airway');
    expect(SCENARIO.metadata.limitations).toContain('supraglottic-airway-placement-is-an-abstraction');
    expect(SCENARIO.metadata.limitations).toContain('repeated-laryngoscopy-trauma-is-a-teaching-model');
  });
});
