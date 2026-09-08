/**
 * Reference transcripts for the rapid-sequence-induction lesson, replayed
 * through the real engine and scored by the real debrief.
 *
 * The assertion this file exists for is that the order is a decision the cockpit
 * does not make for you. Rocuronium before propofol is accepted by the engine
 * exactly as readily as the other way round; the only thing that reports it is
 * the debrief, and the harm it causes — a patient paralysed and light — is a
 * depth-index alarm that no objective here scores.
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
import { RAPID_SEQUENCE_INDUCTION as SCENARIO } from '@anesthesia/scenarios/rapid-sequence-induction';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { RAPID_SEQUENCE_INDUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/rapid-sequence-induction-fixtures';
import {
  RAPID_SEQUENCE_INDUCTION_OBJECTIVES, supportsRapidSequenceInduction,
} from '../../src/modules/anesthesia/rapid-sequence-induction';
import { rapidSequenceInductionCompletionEvidence } from '../../src/modules/anesthesia/rapid-sequence-induction-completion';

const PEAKS = { propofol: 100, remifentanil: 90 };

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
    hash: hash.digest('hex'), history, events, stacking,
    findings: objectiveFindings(
      SCENARIO, history, stacking.length, engine.equipment().preoxygenationSeconds, actions, events,
    ),
    finalRatio: history.at(-1)?.state.trainOfFourRatio ?? 0,
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const lowestSaturation = (result: ReturnType<typeof run>) =>
  Math.min(...result.history.map((sample) => sample.state.spo2Percent ?? Infinity));
const alarms = (result: ReturnType<typeof run>, prefix: string) =>
  result.events.filter((event) => event.eventId.startsWith(prefix));

describe('Rapid-sequence-induction transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.2.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(supportsRapidSequenceInduction(SCENARIO)).toBe(true);
    // The lesson that shares the induction and neither the relaxant nor the
    // monitor must not be read as this patient.
    expect(supportsRapidSequenceInduction(ROUTINE_INDUCTION)).toBe(false);
    expect(supportsRapidSequenceInduction({
      ...SCENARIO,
      equipment: {
        ...SCENARIO.equipment,
        monitoring: SCENARIO.equipment.monitoring.filter((entry) => entry !== 'train-of-four'),
      },
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(rapidSequenceInductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(rapidSequenceInductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(rapidSequenceInductionCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(rapidSequenceInductionCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...RAPID_SEQUENCE_INDUCTION_OBJECTIVES]);
    expect(supportsRapidSequenceInduction({
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
    expect(lowestSaturation(expert)).toBeGreaterThan(92);
    // The reversal was accepted AND the ratio recovered. They are two claims and
    // the objective is written on the second one.
    expect(alarms(expert, 'sugammadex-')).toHaveLength(1);
    expect(expert.finalRatio).toBeGreaterThanOrEqual(0.9);
    // And nothing was refused: the dose matched the observed depth on the
    // descending limb, which is the only combination this engine accepts.
    expect(alarms(expert, 'bad-')).toHaveLength(0);
  });

  it('lets the order be got backwards, and only reports it afterwards', () => {
    const errored = run(FIXTURES.commonError);
    // The engine accepts rocuronium before propofol exactly as readily as the
    // other way round. Nothing refuses it, and nothing warns at the time.
    expect(alarms(errored, 'bad-')).toHaveLength(0);
    const block = errored.findings.find(({ objectiveId }) => objectiveId === 'wait-for-intubating-block')!;
    expect(block.outcome).toBe('not-met');
    expect(block.finding).toContain('does not produce sleep');
    // The harm it causes is a depth-index alarm that no objective here scores,
    // and the evidence says so rather than implying the rubric caught it.
    expect(alarms(errored, 'alarm-depth-light-').length).toBeGreaterThan(0);
  });

  it('shows what the hurried induction costs when there is no reserve at all', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['not-met', 'not-met', 'not-met', 'met', 'not-exercised']);
    // Not an authored number: it falls out of a room-air functional residual
    // capacity and a two-minute interval without ventilation.
    expect(lowestSaturation(errored)).toBeLessThan(75);
    expect(alarms(errored, 'sugammadex-')).toHaveLength(0);
  });

  it('recovers eight points of saturation on the same missing reserve, and no more', () => {
    const recovered = run(FIXTURES.recovery);
    const errored = run(FIXTURES.commonError);
    expect(outcomes(recovered)).toEqual(['not-met', 'met', 'not-met', 'met', 'met']);
    // The reserve is not recoverable and the objective stays failed on both.
    expect(recovered.findings[0]!.finding).toContain('0.16');
    // What the right order and a prompt airway did buy is measurable, and small.
    const margin = lowestSaturation(recovered) - lowestSaturation(errored);
    expect(margin).toBeGreaterThan(5);
    expect(margin).toBeLessThan(15);
    expect(recovered.finalRatio).toBeGreaterThanOrEqual(0.9);
  });

  it('exercises nothing but the apnoea margin when nothing is done', () => {
    // She is a healthy forty-one-year-old who keeps breathing, so the apnoea
    // objective passes by idleness. The evidence claims it is exercised, not
    // that this is a result.
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual([
      'not-exercised', 'not-exercised', 'met', 'not-exercised', 'not-exercised',
    ]);
    expect(lowestSaturation(idle)).toBeGreaterThan(92);
  });

  it('refuses a reversal that does not match the observed depth or the limb', () => {
    // This is the one objective in the module so far that the engine can refuse
    // outright, so the transcripts are not the only evidence that the pairing
    // matters. Each of these is rejected and changes nothing.
    const early = run(([...FIXTURES.expert.slice(0, 6),
      // 4 mg/kg while the block is still deepening, before any post-tetanic count.
      { tick: 2300, type: 'neuromuscular-reversal', payload: { agent: 'sugammadex', route: 'iv', doseMgPerKg: 4 } },
      // 2 mg/kg with no twitches at all, on the right limb but the wrong dose.
      { tick: 5400, type: 'neuromuscular-reversal', payload: { agent: 'sugammadex', route: 'iv', doseMgPerKg: 2 } },
    ] as LearnerAction[]).sort((a, b) => a.tick - b.tick));
    expect(alarms(early, 'bad-sugammadex-')).toHaveLength(2);
    // And nothing was accepted: the refusals are refusals, not warnings beside
    // an effect that happened anyway.
    expect(alarms(early, 'sugammadex-')).toHaveLength(0);
    // A refused attempt reads not-met rather than not-exercised, which is the
    // distinction the error path's "not exercised" depends on: that path never
    // reached for the syringe at all.
    expect(early.findings.at(-1)!.outcome).toBe('not-met');
    expect(run(FIXTURES.commonError).findings.at(-1)!.outcome).toBe('not-exercised');
  });
});
