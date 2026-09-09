/**
 * Reference transcripts for the capnography-sampling-line lesson, replayed
 * through the real engine and scored by the real debrief.
 *
 * The sharpest assertion in this file is that a run doing NOTHING earns the
 * middle objective in full, while a run reaching for a laryngoscope loses it and
 * drives the spontaneous respiratory rate to zero. The harm here is caused
 * entirely by the response.
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
import { CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION as SCENARIO } from '@anesthesia/scenarios/capnography-sampling-line-obstruction';
import { CIRCLE_SYSTEM_REBREATHING } from '@anesthesia/scenarios/circle-system-rebreathing';
import { CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/capnography-sampling-line-obstruction-fixtures';
import {
  CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION_OBJECTIVES, supportsCapnographySamplingLineObstruction,
} from '../../src/modules/anesthesia/capnography-sampling-line-obstruction';
import { capnographySamplingLineObstructionCompletionEvidence } from '../../src/modules/anesthesia/capnography-sampling-line-obstruction-completion';

/** The scripted sampling-line fault, from which both timed objectives run. */
const FAULT = 1200;

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
/** What the patient is doing while the trace is flat. */
const duringFault = (result: ReturnType<typeof run>) => {
  const window = result.history.slice(FAULT, 1800);
  return {
    lowestRate: Math.round(Math.min(...window.map(({ state }) => state.respiratoryRateBpm ?? 0))),
    lowestSaturation: Math.round(Math.min(...window.map(({ state }) => state.spo2Percent ?? 100))),
  };
};

const CROSS_CHECK = (tick: number): LearnerAction =>
  ({ tick, type: 'capnography-line', payload: { action: 'cross-check-ventilation' } });
const RECONNECT = (tick: number): LearnerAction =>
  ({ tick, type: 'capnography-line', payload: { action: 'reconnect' } });

describe('Capnography-sampling-line transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(3);
    expect(supportsCapnographySamplingLineObstruction(SCENARIO)).toBe(true);
    // The module's other capnography lesson, bound alongside this one.
    expect(supportsCapnographySamplingLineObstruction(CIRCLE_SYSTEM_REBREATHING)).toBe(false);
    expect(supportsCapnographySamplingLineObstruction({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(capnographySamplingLineObstructionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(capnographySamplingLineObstructionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(capnographySamplingLineObstructionCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(capnographySamplingLineObstructionCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION_OBJECTIVES]);
    expect(supportsCapnographySamplingLineObstruction({
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

  it('meets every objective on the expert path without touching the patient', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met']);
    expect(expert.findings[1]!.finding).toContain('No airway instrumentation or commanded-breath change');
    expect(duringFault(expert)).toEqual({ lowestRate: 14, lowestSaturation: 98 });
    // Identical to the patient nobody touched.
    expect(duringFault(expert)).toEqual(duringFault(run(FIXTURES.noAction)));
  });

  it('credits the passive run with the objective that rewards restraint', () => {
    // The sharpest reading in the lesson. Doing nothing earns exactly one
    // objective, and it is the one about not acting.
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'met', 'not-met']);
    expect(idle.findings[1]!.outcome).toBe('met');
    expect(duringFault(idle)).toEqual({ lowestRate: 14, lowestSaturation: 98 });
  });

  it('causes the apnoea it feared when the airway is instrumented', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['met', 'not-met', 'met']);
    expect(errored.findings[1]!.finding).toContain('patient-changing laryngoscopy action');
    expect(duringFault(errored).lowestRate).toBe(0);
    expect(duringFault(errored).lowestSaturation).toBe(96);
    // The untouched patient never lost either.
    expect(duringFault(run(FIXTURES.noAction)).lowestRate).toBe(14);
  });

  it('grades commandeering the ventilator below instrumenting the airway', () => {
    // A gradient inside the objective that its statement does not describe.
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['met', 'partly-met', 'met']);
    expect(recovered.findings[1]!.finding).toContain('patient-changing ventilator action');
    expect(recovered.findings[1]!.outcome).not.toBe(run(FIXTURES.commonError).findings[1]!.outcome);
    expect(duringFault(recovered).lowestRate).toBeGreaterThan(0);
    expect(duringFault(recovered).lowestSaturation).toBe(98);
  });

  it('loses the cross-check permanently when the line is reconnected first', () => {
    // An irreversibility: clearing the fault removes the thing to check against.
    const outOfOrder = run([RECONNECT(1300), CROSS_CHECK(1400)]);
    expect(outOfOrder.events.some(({ eventId }) =>
      eventId.startsWith('capnography-cross-check-refused-'))).toBe(true);
    expect(outOfOrder.findings[0]!.outcome).toBe('not-met');
    expect(outcomes(outOfOrder)).toEqual(['not-met', 'met', 'partly-met']);
  });

  it('leaves the patient unchanged whatever is done to the monitor', () => {
    // The premise of the lesson, held across every path that does not
    // instrument: the fault is display-only.
    for (const path of ['expert', 'noAction'] as const) {
      expect(duringFault(run(FIXTURES[path])).lowestSaturation).toBe(98);
      expect(duringFault(run(FIXTURES[path])).lowestRate).toBe(14);
    }
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations)
      .toContain('capnography-sampling-line-obstruction-is-display-only');
    expect(SCENARIO.metadata.limitations).toContain('capnography-cross-check-is-screen-intent');
  });
});
