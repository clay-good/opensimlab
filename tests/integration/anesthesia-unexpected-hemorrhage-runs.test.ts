/**
 * Reference transcripts for the unexpected-hemorrhage lesson, replayed through
 * the real engine and scored by the real debrief.
 *
 * The assertion this file exists for is a controlled comparison. The expert and
 * recovery paths share one array of actions and differ in a single element — the
 * induction dose — so whatever separates their outcomes can be attributed to it
 * and to nothing else. A test asserts that they really are otherwise identical
 * rather than merely similar.
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
import { UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE as SCENARIO } from '@anesthesia/scenarios/unexpected-intraoperative-hemorrhage';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { UNEXPECTED_HEMORRHAGE_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/unexpected-intraoperative-hemorrhage-fixtures';
import {
  UNEXPECTED_HEMORRHAGE_OBJECTIVES, supportsUnexpectedHemorrhage,
} from '../../src/modules/anesthesia/unexpected-intraoperative-hemorrhage';
import { unexpectedHemorrhageCompletionEvidence } from '../../src/modules/anesthesia/unexpected-intraoperative-hemorrhage-completion';

const ONSET = 2400;
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
    hash: hash.digest('hex'), history, events,
    findings: objectiveFindings(
      SCENARIO, history, stacking.length, engine.equipment().preoxygenationSeconds, actions, events,
    ),
    crystalloidTotalMl: engine.equipment().resuscitation.crystalloidTotalMl,
    redCellUnits: engine.equipment().resuscitation.packedRedBloodCellUnits ?? 0,
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const nadir = (result: ReturnType<typeof run>) => Math.min(...result.history
  .filter((sample) => sample.tick >= ONSET)
  .map((sample) => sample.state.meanArterialMmHg ?? Infinity));
const secondsBelow = (result: ReturnType<typeof run>, threshold: number) => result.history
  .filter((sample) => (sample.state.meanArterialMmHg ?? Infinity) < threshold).length / 10;
const events = (result: ReturnType<typeof run>, prefix: string) =>
  result.events.filter((event) => event.eventId.startsWith(prefix));

describe('Unexpected-hemorrhage transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsUnexpectedHemorrhage(SCENARIO)).toBe(true);
    expect(supportsUnexpectedHemorrhage(ROUTINE_INDUCTION)).toBe(false);
    // The temporizing objective counts crystalloid against the moment of
    // control, so that event is part of the identity rather than the setting.
    expect(supportsUnexpectedHemorrhage({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.id !== 'hemorrhage-controlled'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(unexpectedHemorrhageCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(unexpectedHemorrhageCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(unexpectedHemorrhageCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(unexpectedHemorrhageCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...UNEXPECTED_HEMORRHAGE_OBJECTIVES]);
    expect(supportsUnexpectedHemorrhage({
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

  it('differs from the recovery path in exactly one action', () => {
    // The controlled comparison this lesson is built on. If these two ever drift
    // apart anywhere else, the attribution below stops being valid.
    const expert = FIXTURES.expert;
    const recovery = FIXTURES.recovery;
    expect(expert).toHaveLength(recovery.length);
    const differing = expert.filter((action, index) =>
      JSON.stringify(action) !== JSON.stringify(recovery[index]));
    expect(differing).toHaveLength(1);
    expect(differing[0]!.payload.drugId).toBe('propofol');
    expect(differing[0]!.payload.amount).toBe(0.5);
    expect(recovery[expert.indexOf(differing[0]!)]!.payload.amount).toBe(2);
  });

  it('meets every objective on the expert path', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(secondsBelow(expert, 65)).toBe(0);
    expect(expert.crystalloidTotalMl).toBe(5000);
    expect(expert.redCellUnits).toBe(2);
    expect(events(expert, 'bad-')).toHaveLength(0);
  });

  it('attributes fourteen millimetres of mercury to one syringe', () => {
    // Everything else about these two runs is identical, so nothing else can be
    // credited with the difference.
    const expert = run(FIXTURES.expert);
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['met', 'met', 'not-met', 'not-met']);
    expect(recovered.crystalloidTotalMl).toBe(expert.crystalloidTotalMl);
    expect(recovered.redCellUnits).toBe(expert.redCellUnits);
    expect(nadir(expert) - nadir(recovered)).toBeGreaterThan(12);
    expect(secondsBelow(recovered, 65)).toBeGreaterThan(200);
    expect(secondsBelow(expert, 65)).toBe(0);
  });

  it('shows a vasopressor treated as the answer to a volume problem', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    // Not an absence of effort: two vasopressor doses and no fluid at all.
    expect(events(errored, 'vasopressor-')).toHaveLength(2);
    expect(errored.crystalloidTotalMl).toBe(0);
    expect(nadir(errored)).toBeLessThan(40);
    expect(secondsBelow(errored, 55)).toBeGreaterThan(200);
  });

  it('fails the pressure objective even when nothing is done, and says so', () => {
    // She bleeds whether or not anyone induces her, so this objective is not a
    // test of the induction alone and the evidence does not claim it is.
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-exercised', 'not-met']);
    expect(secondsBelow(idle, 65)).toBeGreaterThan(120);
  });

  it('refuses a blood-bank request when no modeled hemorrhage is running', () => {
    const early = run(([
      { tick: 60, type: 'blood-bank-request', payload: {} },
      ...FIXTURES.expert,
    ] as LearnerAction[]).sort((a, b) => a.tick - b.tick));
    expect(events(early, 'bad-blood-bank-request-')).toHaveLength(1);
    // And the accepted one later in the run still works.
    expect(early.redCellUnits).toBe(2);
  });
});
