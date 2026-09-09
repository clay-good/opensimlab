/**
 * Reference transcripts for the blood-bank-handoff lesson, replayed through the
 * real engine and scored by the real debrief.
 *
 * Two assertions. Crystalloid alone buys nearly the whole pressure — 67 mmHg
 * against 68 transfused and 60 untreated — by diluting the haemoglobin from 10.2
 * to 9.1. And, uniquely in this module, a REFUSED action is itself the penalty:
 * reaching for blood before the release caps the second objective permanently.
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
import { BLOOD_BANK_HANDOFF as SCENARIO } from '@anesthesia/scenarios/blood-bank-handoff';
import { UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE } from '@anesthesia/scenarios/unexpected-intraoperative-hemorrhage';
import { BLOOD_BANK_HANDOFF_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/blood-bank-handoff-fixtures';
import {
  BLOOD_BANK_HANDOFF_OBJECTIVES, supportsBloodBankHandoff,
} from '../../src/modules/anesthesia/blood-bank-handoff';
import { bloodBankHandoffCompletionEvidence } from '../../src/modules/anesthesia/blood-bank-handoff-completion';

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
/** The two numbers the lesson sets against each other, at the end of the case. */
const settled = (result: ReturnType<typeof run>) => {
  const state = result.history[3500]!.state as Readonly<Record<string, number>>;
  return {
    map: Math.round(state.meanArterialMmHg!),
    hemoglobin: Number(state.hemoglobinGPerDl!.toFixed(1)),
  };
};

const RELEASE = (tick: number): LearnerAction =>
  ({ tick, type: 'blood-bank-request', payload: {} });
const RED_CELLS = (tick: number): LearnerAction =>
  ({ tick, type: 'blood-product', payload: { productId: 'packed-red-blood-cells', units: 2 } });

describe('Blood-bank-handoff transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(3);
    expect(supportsBloodBankHandoff(SCENARIO)).toBe(true);
    // The module's other hemorrhage lesson, which this must never answer for.
    expect(supportsBloodBankHandoff(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE)).toBe(false);
    expect(supportsBloodBankHandoff({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(bloodBankHandoffCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(bloodBankHandoffCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(bloodBankHandoffCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(bloodBankHandoffCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...BLOOD_BANK_HANDOFF_OBJECTIVES]);
    expect(supportsBloodBankHandoff({
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
    expect(outcomes(expert)).toEqual(['met', 'met', 'met']);
    expect(expert.findings[0]!.finding).toContain('10.0 seconds after hemorrhage onset');
    expect(expert.findings[2]!.finding).toContain('calculated oxygen delivery');
    expect(settled(expert)).toEqual({ map: 68, hemoglobin: 11.4 });
  });

  it('buys the pressure by diluting the carrier', () => {
    // The reason this lesson is worth binding. One millimetre off the
    // transfused pressure, and the haemoglobin has gone the wrong way.
    const errored = run(FIXTURES.commonError);
    const idle = run(FIXTURES.noAction);
    const expert = run(FIXTURES.expert);
    expect(outcomes(errored)).toEqual(['not-met', 'not-met', 'partly-met']);
    expect(settled(errored)).toEqual({ map: 67, hemoglobin: 9.1 });
    expect(settled(idle)).toEqual({ map: 60, hemoglobin: 10.2 });
    // The pressure is nearly the transfused one...
    expect(settled(expert).map - settled(errored).map).toBe(1);
    // ...and the haemoglobin is below where it started, and below untreated.
    expect(settled(errored).hemoglobin).toBeLessThan(settled(idle).hemoglobin);
    expect(settled(errored).hemoglobin).toBeLessThan(settled(expert).hemoglobin);
  });

  it('remembers a refusal, which no other lesson in this module does', () => {
    // Grab blood early, be declined, then do everything right: capped anyway.
    const grabbedFirst = run([
      RED_CELLS(700), RELEASE(800), RED_CELLS(1000),
    ] as LearnerAction[]);
    expect(grabbedFirst.events.some(({ eventId }) =>
      eventId.startsWith('bad-blood-product-'))).toBe(true);
    expect(grabbedFirst.findings[1]!.outcome).toBe('partly-met');
    expect(grabbedFirst.findings[1]!.finding)
      .toContain('A blood-product action was refused before release');
    // The transfusion itself still worked: only the objective is capped.
    expect(settled(grabbedFirst).hemoglobin).toBe(settled(run(FIXTURES.expert)).hemoglobin);
    expect(grabbedFirst.findings[2]!.outcome).toBe('met');
  });

  it('carries the dilution to the end of the case on the recovery path', () => {
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['partly-met', 'met', 'met']);
    expect(recovered.findings[0]!.finding).toContain('80.0 seconds after hemorrhage onset');
    // Same two units as the expert path, half a gram per decilitre short.
    expect(settled(recovered).hemoglobin).toBe(10.9);
    expect(settled(recovered).hemoglobin).toBeLessThan(settled(run(FIXTURES.expert)).hemoglobin);
    expect(settled(recovered).map).toBe(68);
  });

  it('reaches neither objective when the hemorrhage is ignored', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met']);
    expect(idle.findings[0]!.finding).toContain('No bounded blood-bank release was accepted');
    expect(settled(idle).map).toBe(60);
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations).toContain('prbc-fixed-unit-model');
    expect(SCENARIO.metadata.limitations).toContain('blood-bank-handoff-is-instantaneous');
    expect(SCENARIO.metadata.limitations).toContain('crystalloid-volume-model');
  });
});
