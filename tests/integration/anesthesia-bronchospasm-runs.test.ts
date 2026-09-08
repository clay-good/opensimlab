/**
 * Reference transcripts for the bronchospasm lesson, replayed through the real
 * engine and scored by the real debrief.
 *
 * The assertion this file exists for is the premise: that the shape moves while
 * the number is still normal. At the moment the modelled obstruction reaches
 * 0.35 the end-tidal figure is 38 mmHg and nothing has alarmed, and the cost of
 * waiting for it is measured by the error path, whose every action lands after
 * both scoring windows have closed.
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
import { BRONCHOSPASM as SCENARIO } from '@anesthesia/scenarios/bronchospasm';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { BRONCHOSPASM_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/bronchospasm-fixtures';
import { BRONCHOSPASM_OBJECTIVES, supportsBronchospasm } from '../../src/modules/anesthesia/bronchospasm';
import { bronchospasmCompletionEvidence } from '../../src/modules/anesthesia/bronchospasm-completion';

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
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const at = (result: ReturnType<typeof run>, tick: number) =>
  result.history.find((sample) => sample.tick === tick)!.state;
const events = (result: ReturnType<typeof run>, prefix: string) =>
  result.events.filter((event) => event.eventId.startsWith(prefix));

describe('Bronchospasm transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(6);
    expect(supportsBronchospasm(SCENARIO)).toBe(true);
    expect(supportsBronchospasm(ROUTINE_INDUCTION)).toBe(false);
    // Every scoring window is measured from the first obstruction event, so it
    // is part of the identity rather than of the setting.
    expect(supportsBronchospasm({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.id !== 'bronchospasm-onset'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(bronchospasmCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(bronchospasmCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
    expect(bronchospasmCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(bronchospasmCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...BRONCHOSPASM_OBJECTIVES]);
    expect(supportsBronchospasm({
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

  it('moves the shape while the number is still normal, which is the premise', () => {
    const expert = run(FIXTURES.expert);
    // Four hundred ticks after onset the modelled obstruction is real and the
    // end-tidal figure has not moved out of its ordinary range.
    const during = at(expert, ONSET + 400);
    expect(Number(during.etco2MmHg)).toBeLessThan(45);
    // No capnography alarm fires because of the obstruction in its first forty
    // seconds. The one this scenario does produce is the apnoea during
    // laryngoscopy at tick 1,900, five hundred ticks before onset.
    expect(events(expert, 'alarm-etco2')
      .filter((event) => event.tick >= ONSET && event.tick <= ONSET + 400)).toHaveLength(0);
    expect(events(expert, 'alarm-etco2').every((event) => event.tick < ONSET)).toBe(true);
  });

  it('meets every objective on the expert path', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    expect(events(expert, 'salbutamol-nebulized-')).toHaveLength(1);
    expect(events(expert, 'airway-help-requested-')).toHaveLength(1);
    // Nothing was refused, and no vasopressor was needed or given.
    expect(events(expert, 'bad-')).toHaveLength(0);
    expect(events(expert, 'vasopressor-')).toHaveLength(0);
  });

  it('measures what waiting for the number costs', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored))
      .toEqual(['not-met', 'met', 'not-met', 'not-met', 'met', 'not-met']);
    // Every action lands after both scoring windows have closed.
    for (const action of FIXTURES.commonError.slice(5)) {
      expect(action.tick).toBeGreaterThan(ONSET + 1200);
    }
  });

  it('credits a plane that was already surgical, and says which it credited', () => {
    // deepen-before-reaching-for-anything-else is met on the error path WITHOUT
    // a deepening bolus, because the objective accepts a depth already at or
    // below 60. The finding text has to say which of the two it read.
    const errored = run(FIXTURES.commonError);
    const deepen = errored.findings.find(
      ({ objectiveId }) => objectiveId === 'deepen-before-reaching-for-anything-else',
    )!;
    expect(deepen.outcome).toBe('met');
    expect(deepen.finding).toContain('was already');
    expect(deepen.finding).not.toContain('accepted propofol bolus was recorded');
  });

  it('recovers four objectives on an identical opening, and not the pressure', () => {
    const recovered = run(FIXTURES.recovery);
    const errored = run(FIXTURES.commonError);
    expect(outcomes(recovered)).toEqual(['met', 'met', 'met', 'met', 'met', 'not-met']);
    // The induction dose is the one thing neither path can take back.
    expect(outcomes(recovered).at(-1)).toBe(outcomes(errored).at(-1));
    expect(recovered.findings.at(-1)!.finding).toContain('below 65 mmHg');
  });

  it('does not stress the saturation on any path that induces at all', () => {
    // A healthy twenty-nine-year-old with a full flowmeter. The objective is
    // exercised rather than stressed, and the evidence says so.
    for (const path of ['expert', 'commonError', 'recovery'] as const) {
      const result = run(FIXTURES[path]);
      const lowest = Math.min(...result.history
        .filter((sample) => sample.tick >= ONSET)
        .map((sample) => sample.state.spo2Percent ?? 100));
      expect(lowest, path).toBeGreaterThan(99);
    }
  });

  it('exercises nothing but the pressure when nothing is done', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'partly-met', 'met']);
  });

  it('refuses a bronchodilator outside the bounds the scenario declares', () => {
    const refused = run(([...FIXTURES.expert,
      // Ten milligrams at once, above the bounded single dose.
      { tick: 3000, type: 'inhaled-bronchodilator', payload: { agentId: 'salbutamol', route: 'nebulized', doseMg: 10 } },
      // And a second 5 mg after the ceiling is reached.
      { tick: 5900, type: 'inhaled-bronchodilator', payload: { agentId: 'salbutamol', route: 'nebulized', doseMg: 5 } },
    ] as LearnerAction[]).sort((a, b) => a.tick - b.tick));
    expect(events(refused, 'bronchodilator-refused-')).toHaveLength(2);
    expect(events(refused, 'salbutamol-nebulized-')).toHaveLength(1);
  });
});
