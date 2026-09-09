/**
 * Reference transcripts for the circle-system-rebreathing lesson, replayed
 * through the real engine and scored by the real debrief.
 *
 * Two assertions cut in opposite directions. The flow bridge is a real partial
 * mitigation — 8.0 mmHg untreated, 2.86 bridged — and it is not a repair. And a
 * run that skips the bridge to go straight to the absorbent loses that objective
 * while producing a patient indistinguishable from the expert path.
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
import { CIRCLE_SYSTEM_REBREATHING as SCENARIO } from '@anesthesia/scenarios/circle-system-rebreathing';
import { CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION } from '@anesthesia/scenarios/capnography-sampling-line-obstruction';
import { CIRCLE_SYSTEM_REBREATHING_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/circle-system-rebreathing-fixtures';
import {
  CIRCLE_SYSTEM_REBREATHING_OBJECTIVES, supportsCircleSystemRebreathing,
} from '../../src/modules/anesthesia/circle-system-rebreathing';
import { circleSystemRebreathingCompletionEvidence } from '../../src/modules/anesthesia/circle-system-rebreathing-completion';

/** The scripted absorbent failure, from which every objective is timed. */
const FAILURE = 1800;

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
/** The modelled rebreathed load at the end of the run, to two decimals. */
const settledInspiredCo2 = (result: ReturnType<typeof run>) =>
  Number((result.engine.equipment().breathingCircuit?.inspiredCo2MmHg ?? 0).toFixed(2));
const etco2At = (result: ReturnType<typeof run>, tick: number) =>
  (result.history[tick]!.state as Readonly<Record<string, number>>).etco2MmHg!;

const ASSESS = (tick: number): LearnerAction =>
  ({ tick, type: 'breathing-circuit', payload: { action: 'assess-capnogram' } });
const REPLACE = (tick: number): LearnerAction =>
  ({ tick, type: 'breathing-circuit', payload: { action: 'replace-absorbent' } });

describe('Circle-system-rebreathing transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(3);
    expect(supportsCircleSystemRebreathing(SCENARIO)).toBe(true);
    // The module's other capnography lesson, which this must never answer for.
    expect(supportsCircleSystemRebreathing(CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION)).toBe(false);
    expect(supportsCircleSystemRebreathing({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(circleSystemRebreathingCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(circleSystemRebreathingCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(circleSystemRebreathingCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(circleSystemRebreathingCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...CIRCLE_SYSTEM_REBREATHING_OBJECTIVES]);
    expect(supportsCircleSystemRebreathing({
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

  it('meets every objective on the expert path and washes the circuit out', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met']);
    expect(expert.findings[1]!.finding).toContain('before definitive correction');
    expect(settledInspiredCo2(expert)).toBe(0);
  });

  it('measures the bridge as a partial mitigation and not a repair', () => {
    // Two thirds of the rebreathed load, and then it simply stays there.
    const bridged = run(FIXTURES.commonError);
    const idle = run(FIXTURES.noAction);
    expect(outcomes(bridged)).toEqual(['met', 'met', 'not-met']);
    expect(settledInspiredCo2(idle)).toBe(8);
    expect(settledInspiredCo2(bridged)).toBe(2.86);
    expect(settledInspiredCo2(bridged)).toBeLessThan(settledInspiredCo2(idle));
    expect(settledInspiredCo2(bridged)).toBeGreaterThan(0);
    // It never resolves: the same value fifty simulated minutes later.
    expect(Number((bridged.engine.equipment().breathingCircuit?.inspiredCo2MmHg ?? 0).toFixed(2)))
      .toBe(2.86);
  });

  it('produces the expert patient from a run that skips the bridge entirely', () => {
    // The reading a learner is least likely to expect. Straight to the repair:
    // the objective is lost and the patient is identical.
    const straightToRepair = run([ASSESS(1900), REPLACE(2000)]);
    expect(outcomes(straightToRepair)).toEqual(['met', 'not-met', 'met']);
    expect(settledInspiredCo2(straightToRepair)).toBe(0);
    const expert = run(FIXTURES.expert);
    for (const tick of [2400, 3600, 5300]) {
      expect(Math.round(etco2At(straightToRepair, tick))).toBe(Math.round(etco2At(expert, tick)));
    }
  });

  it('resolves the circuit when the replacement arrives inside the window', () => {
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['met', 'met', 'met']);
    expect(recovered.findings[2]!.finding).toContain('80 seconds after onset');
    expect(settledInspiredCo2(recovered)).toBe(0);
    expect(FIXTURES.recovery.slice(0, FIXTURES.commonError.length))
      .toEqual([...FIXTURES.commonError]);
  });

  it('refuses a replacement made before the capnogram is assessed', () => {
    // The module's usual rule: refused, and free once heeded.
    const outOfOrder = run([REPLACE(1900), ASSESS(2000),
      { tick: 2100, type: 'ventilator', payload: { freshGasFlowLPerMin: 10 } },
      REPLACE(2300)] as LearnerAction[]);
    expect(outOfOrder.events.some(({ eventId }) =>
      eventId.startsWith('circuit-absorbent-replacement-refused-'))).toBe(true);
    expect(outcomes(outOfOrder)).toEqual(['met', 'met', 'met']);
  });

  it('leaves the saturation uninformative on every path', () => {
    // The only instrument that moves here is the inspired baseline.
    for (const path of ['expert', 'commonError', 'noAction'] as const) {
      const result = run(FIXTURES[path]);
      const saturations = result.history.slice(FAILURE)
        .map(({ state }) => Math.round(state.spo2Percent ?? 0));
      expect(Math.min(...saturations)).toBe(100);
    }
  });

  it('reads nothing when the rising baseline is ignored', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met']);
    expect(idle.findings[0]!.finding).toContain('No accepted capnogram assessment');
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations).toContain('breathing-circuit-actions-are-screen-intent');
    expect(SCENARIO.metadata.limitations)
      .toContain('circle-system-rebreathing-is-a-bounded-teaching-trajectory');
  });
});
