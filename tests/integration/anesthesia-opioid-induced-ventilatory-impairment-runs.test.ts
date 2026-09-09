/**
 * Reference transcripts for the opioid-induced ventilatory-impairment lesson,
 * replayed through the real engine and scored by the real debrief.
 *
 * The assertion this file exists for is a comparison between two traces at the
 * same tick. Turning the oxygen up without delivering breaths reads 100%
 * saturation; doing nothing at all reads 96%, with the same respiratory rate and
 * the same carbon dioxide. The intervention improves the monitored number and
 * treats nothing, which is the briefing's warning made measurable.
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
import { OPIOID_INDUCED_VENTILATORY_IMPAIRMENT as SCENARIO } from '@anesthesia/scenarios/opioid-induced-ventilatory-impairment';
import { RAPID_DESATURATION } from '@anesthesia/scenarios/rapid-desaturation';
import { OPIOID_INDUCED_VENTILATORY_IMPAIRMENT_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/opioid-induced-ventilatory-impairment-fixtures';
import {
  OPIOID_INDUCED_VENTILATORY_IMPAIRMENT_OBJECTIVES, supportsOpioidInducedVentilatoryImpairment,
} from '../../src/modules/anesthesia/opioid-induced-ventilatory-impairment';
import { opioidInducedVentilatoryImpairmentCompletionEvidence } from '../../src/modules/anesthesia/opioid-induced-ventilatory-impairment-completion';

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
/** The four numbers this lesson is about, at one tick, as the debrief rounds them. */
const monitor = (result: ReturnType<typeof run>, tick: number) => {
  const state = result.history[tick]!.state as Readonly<Record<string, number>>;
  return {
    spo2: Math.round(state.spo2Percent!),
    rate: Math.round(state.respiratoryRateBpm!),
    etco2: Math.round(state.etco2MmHg!),
  };
};

describe('Opioid-ventilatory-impairment transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(supportsOpioidInducedVentilatoryImpairment(SCENARIO)).toBe(true);
    // The module's other lesson about a saturation that is about to matter.
    expect(supportsOpioidInducedVentilatoryImpairment(RAPID_DESATURATION)).toBe(false);
    // Without the scripted onset there is no clock for any timed objective.
    expect(supportsOpioidInducedVentilatoryImpairment({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(opioidInducedVentilatoryImpairmentCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(opioidInducedVentilatoryImpairmentCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(opioidInducedVentilatoryImpairmentCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(opioidInducedVentilatoryImpairmentCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...OPIOID_INDUCED_VENTILATORY_IMPAIRMENT_OBJECTIVES]);
    expect(supportsOpioidInducedVentilatoryImpairment({
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
    expect(expert.findings[0]!.finding).toContain('10 seconds after the pattern began');
    expect(expert.findings[1]!.finding).toContain('20 seconds after onset');
    expect(expert.findings[4]!.finding).toContain('Spontaneous rate recovered to 14/min');
  });

  it('measures the reassurance the oxygen manufactures', () => {
    // The reason this lesson is worth binding. Both runs have the same
    // ventilation; the one that intervened has the better number on the screen.
    const errored = run(FIXTURES.commonError);
    const idle = run(FIXTURES.noAction);
    expect(monitor(errored, 2900)).toEqual({ spo2: 100, rate: 4, etco2: 50 });
    expect(monitor(idle, 2900)).toEqual({ spo2: 96, rate: 4, etco2: 50 });
    expect(monitor(errored, 2900).spo2).toBeGreaterThan(monitor(idle, 2900).spo2);
    expect(monitor(errored, 2900).rate).toBe(monitor(idle, 2900).rate);
    expect(monitor(errored, 2900).etco2).toBe(monitor(idle, 2900).etco2);
    // And the saturation never drops far enough to raise the alarm itself.
    expect(Math.min(...errored.history.map(({ state }) =>
      state.spo2Percent ?? 100))).toBeGreaterThanOrEqual(94);
    // Nothing is credited. Turning the oxygen up is not supporting ventilation.
    expect(outcomes(errored)).toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(errored.findings[1]!.finding).toContain('did not establish active breath delivery');
  });

  it('grades recognition as a gradient rather than a pass', () => {
    // All three bands appear across the bound transcripts.
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['not-met', 'partly-met', 'met', 'met', 'met']);
    expect(recovered.findings[1]!.finding).toContain('90 seconds after onset');
    const middling = run([
      { tick: 600, type: 'call-for-help', payload: { context: 'airway' } },
      { tick: 700, type: 'ventilator', payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 } },
    ] as LearnerAction[]);
    expect(middling.findings[0]!.outcome).toBe('partly-met');
    expect(middling.findings[1]!.outcome).toBe('partly-met');
    expect(run(FIXTURES.expert).findings[0]!.outcome).toBe('met');
  });

  it('cannot read spontaneous recovery while the machine is breathing', () => {
    // A rubric behaviour rather than a physiological one: the rate and breath
    // size on the screen belong to the ventilator until delivery is stopped.
    const unweaned = run(FIXTURES.expert.slice(0, 4));
    expect(outcomes(unweaned)).toEqual(['met', 'met', 'met', 'met', 'not-met']);
    expect(unweaned.findings[4]!.finding).toContain('No supported-to-spontaneous reassessment');
    // The patient is not worse for it — the objective simply cannot be read.
    expect(monitor(unweaned, 2900).rate).toBe(12);
  });

  it('refuses reversal intent before further opioid is held', () => {
    const outOfOrder = run([
      { tick: 200, type: 'call-for-help', payload: { context: 'airway' } },
      { tick: 300, type: 'ventilator', payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 } },
      { tick: 400, type: 'opioid-ventilatory-response', payload: { response: 'record-naloxone-titration' } },
    ] as LearnerAction[]);
    expect(outOfOrder.events.some(({ eventId }) =>
      eventId.startsWith('naloxone-order-refused-'))).toBe(true);
    expect(outOfOrder.findings[3]!.outcome).toBe('not-met');
  });

  it('exercises nothing when the pattern is never recognised', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.findings[0]!.finding).toContain('No accepted help request');
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations).toContain('naloxone-is-intent-not-dose-or-pharmacology');
    expect(SCENARIO.metadata.limitations)
      .toContain('no-pain-withdrawal-recurrence-or-monitoring-workflow');
    expect(SCENARIO.formulary).toEqual([]);
  });
});
