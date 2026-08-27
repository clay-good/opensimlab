import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { collectReportEquipmentContext } from '@routes/AnesthesiaRoute';
import {
  HYPERCALCEMIA_FLUID_RESPONSE_TICKS, HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS,
  HYPERCALCEMIA_DELAY_TICKS, HYPERCALCEMIA_TAKEOVER_TICKS, HYPERCALCEMIA_SESSION_TICKS,
  type HypercalcemiaAction,
} from '../../src/modules/endocrine-metabolic/hypercalcemia';
import { HYPERCALCEMIA_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/hypercalcemia-fixtures';
import { HYPERCALCEMIC_CRISIS_VOLUME_AND_BRIDGE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hypercalcemic-crisis-volume-and-bridge';
import { hypercalcemiaInlinePrompt } from '../../src/modules/endocrine-metabolic/tutor/hypercalcemia-guidance';
import { hypercalcemiaCompletionEvidence } from '../../src/modules/endocrine-metabolic/hypercalcemia-completion';

type Frame = ReturnType<AnesthesiaEngine['step']>;
type Choices = readonly (readonly [number, HypercalcemiaAction])[];
const OBJECTIVES = ['hypercalcemia-volume', 'hypercalcemia-bridge', 'hypercalcemia-renal', 'hypercalcemia-reassessment', 'hypercalcemia-handoff'];
const newEngine = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const choice = (tick: number, action: HypercalcemiaAction): LearnerAction => ({ tick, type: 'hypercalcemia-response', payload: { action } });
const PACKAGE: Choices = [[0, 'tailored-fluids'], [0, 'calcitonin'], [0, 'assess-cardiorenal'], [0, 'antiresorptive'], [0, 'call-support']];

/** Every real solver tick contributes full patient state, snapshot, and events. */
function run(actions: Choices, until: number, level: 'guided' | 'unassisted', checkpoints: readonly number[] = []) {
  const engine = newEngine(); const hash = createHash('sha256');
  const events: EngineEvent[] = []; const frames = new Map<number, Frame>(); const prompts = new Set<string>();
  const capture = new Set([0, until, ...actions.map(([tick]) => tick), ...checkpoints]);
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify({ tick: frame.tick, state: frame.state, patient: frame.equipment.resuscitation.hypercalcemia, events: frame.events }));
    if (capture.has(tick)) {
      frames.set(tick, frame); const before = JSON.stringify(frame);
      const prompt = hypercalcemiaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version, hypercalcemia: frame.equipment.resuscitation.hypercalcemia });
      if (prompt) prompts.add(prompt.id);
      expect(JSON.stringify(frame)).toBe(before);
    }
  }
  return { engine, frames, events, prompts, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.hypercalcemia! };
}

function expectMonitor(frame: Frame, expected: Record<string, number>) {
  expect(frame.state).toMatchObject(expected);
  const observation = frame.equipment.resuscitation.hypercalcemia!.observation;
  if (observation?.atTick === frame.tick) {
    for (const key of ['systolicMmHg', 'diastolicMmHg', 'meanArterialMmHg', 'heartRateBpm', 'respiratoryRateBpm', 'spo2Percent', 'coreTemperatureC'] as const) {
      expect(frame.state[key]).toBe(observation[key]);
    }
  }
}

describe('Hypercalcemia: real engine volume support, bridge, and replay', () => {
  it('binds valid metadata and completion evidence to exact content, module, and engine without promoting pending validation', () => {
    expect(validateScenario(SCENARIO)).toEqual([]); expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(OBJECTIVES);
    expect(SCENARIO.metadata.estimatedMinutes).toBe(240);
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id); expect(FIXTURES.contentVersion).toBe(SCENARIO.metadata.version);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id)).toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(audit.requirements.find(({ id }) => id === 'guidance-and-demonstration')?.status).toBe('satisfied');
    expect(hypercalcemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic')).toHaveLength(9);
    expect(hypercalcemiaCompletionEvidence({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(hypercalcemiaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: SCENARIO.patient.weightKg + 1 } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(hypercalcemiaCompletionEvidence(SCENARIO, `${ENGINE_VERSION}-changed`, 'endocrine-metabolic')).toEqual([]);
    expect(hypercalcemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(newEngine().step().equipment.invalidParameters).toContain('etco2MmHg');
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every real tick of %s identically across guidance levels and preserves earlier errors', (path) => {
    const actions: Choices = FIXTURES[path]; const corrected = path === 'expert' || path === 'recovery';
    const mistakes = path === 'commonError' || path === 'recovery';
    const until = corrected ? actions.at(-1)![0] + 1 : HYPERCALCEMIA_TAKEOVER_TICKS + 1;
    const guided = run(actions, until, 'guided'); const unassisted = run(actions, until, 'unassisted');
    expect(guided.hash).toBe(unassisted.hash); expect(guided.patient).toEqual(unassisted.patient);
    expect(guided.prompts.size).toBeGreaterThan(0); expect(unassisted.prompts.size).toBe(0);
    expect(guided.patient).toMatchObject({ ended: corrected ? 'handoff' : 'instructor-takeover',
      fluidResponseObserved: corrected, bridgeResponseObserved: corrected, urgentTreatmentDelayed: path !== 'expert',
      unrestrictedFluidsAttempted: mistakes, routineDiureticAttempted: mistakes, waitForCauseChosen: mistakes, durableRecoveryProven: false });
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], guided.events);
    expect(findings.map(({ objectiveId }) => objectiveId)).toEqual(OBJECTIVES);
    expect(findings.map(({ outcome }) => outcome)).toEqual(path === 'expert' ? Array(5).fill('met')
      : path === 'recovery' ? ['not-met', 'not-met', 'not-met', 'met', 'met'] : Array(5).fill('not-met'));
    expectMonitor(guided.frames.get(0)!, { systolicMmHg: 96, meanArterialMmHg: 72, heartRateBpm: 108, respiratoryRateBpm: 20, spo2Percent: 96, coreTemperatureC: 36.8 });
    expectMonitor(guided.frames.get(until)!, corrected ? { systolicMmHg: 106, meanArterialMmHg: 78, heartRateBpm: 96, respiratoryRateBpm: 18 }
      : { systolicMmHg: 96, meanArterialMmHg: 72, heartRateBpm: 108, respiratoryRateBpm: 20 });
    if (corrected) expect(guided.patient.observation?.adjustedCalciumMgDl).toBe(14.8);
    if (path !== 'expert') expect(guided.events.find(({ eventId }) => eventId.startsWith('hypercalcemia-urgent-treatment-delay-'))?.tick).toBe(HYPERCALCEMIA_DELAY_TICKS);
    if (!corrected) expect(guided.events.find(({ eventId }) => eventId.startsWith('hypercalcemia-instructor-takeover-'))?.tick).toBe(HYPERCALCEMIA_TAKEOVER_TICKS);
    const ended = guided.patient;
    for (const action of ['tailored-fluids', 'calcitonin', 'antiresorptive', 'reassess'] as const) guided.engine.apply(choice(999999, action));
    guided.engine.step(); expect(guided.engine.equipment().resuscitation.hypercalcemia).toEqual(ended);
  // More than four simulated hours per successful fixture, with no compressed clock.
  }, 120_000);

  it('separates early circulation from fresh calcium, preserves historical results, and stops an unfinished lesson at six hours', () => {
    const responseAt = HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS;
    const result = run([...PACKAGE, [HYPERCALCEMIA_FLUID_RESPONSE_TICKS, 'reassess'], [responseAt - 1, 'reassess'],
      [responseAt + 1, 'handoff'], [responseAt + 1, 'reassess']], HYPERCALCEMIA_SESSION_TICKS, 'unassisted',
    [HYPERCALCEMIA_FLUID_RESPONSE_TICKS - 1, responseAt, HYPERCALCEMIA_SESSION_TICKS - 1]);
    const patientAt = (tick: number) => result.frames.get(tick)!.equipment.resuscitation.hypercalcemia!;
    expect(patientAt(0)).toMatchObject({ observation: null, fluidDueInSeconds: 900, bridgeDueInSeconds: 14400 });
    expectMonitor(result.frames.get(HYPERCALCEMIA_FLUID_RESPONSE_TICKS - 1)!, { systolicMmHg: 96 });
    expectMonitor(result.frames.get(HYPERCALCEMIA_FLUID_RESPONSE_TICKS)!, { systolicMmHg: 106 });
    expect(patientAt(HYPERCALCEMIA_FLUID_RESPONSE_TICKS)).toMatchObject({ fluidResponseObserved: true, bridgeResponseObserved: false,
      observation: { adjustedCalciumMgDl: 16.4 } });
    expect(patientAt(responseAt)).toMatchObject({ bridgeResponseObserved: false, observation: { atTick: responseAt - 1, adjustedCalciumMgDl: 16.4 } });
    const automaticBridgeEvents = result.events.filter(({ eventId }) => eventId.startsWith('hypercalcemia-bridge-response-'));
    expect(automaticBridgeEvents).toHaveLength(1); expect(JSON.stringify(automaticBridgeEvents)).not.toContain('14.8');
    const historical = collectReportEquipmentContext(result.frames.get(responseAt)!.equipment);
    expect(historical['resuscitation.hypercalcemia.observation.adjustedCalciumMgDl']).toBe(16.4);
    expect(patientAt(responseAt + 1)).toMatchObject({ ended: null, bridgeResponseObserved: true,
      observation: { atTick: responseAt + 1, adjustedCalciumMgDl: 14.8 }, durableRecoveryProven: false });
    expect(result.events.some(({ eventId }) => eventId.startsWith('hypercalcemia-handoff-refused-'))).toBe(true);
    expect(patientAt(HYPERCALCEMIA_SESSION_TICKS - 1).ended).toBeNull(); expect(result.patient.ended).toBe('instructor-takeover');
  }, 120_000);

  it('does not promote timer events or an unpaired reassessment label to observed response evidence', () => {
    const event = (id: string, tick: number): EngineEvent => ({ tick, eventId: `hypercalcemia-${id}-${tick}`, severity: 'warning', category: 'assessment', message: id });
    const log = [event('tailored-fluids', 0), event('calcitonin', 0), event('cardiorenal-assessment', 0),
      event('antiresorptive', 0), event('support', 0), event('early-reassessment', 1),
      event('fluid-response', HYPERCALCEMIA_FLUID_RESPONSE_TICKS), event('bridge-response', HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS)];
    const outcome = (events: EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events).find(({ objectiveId }) => objectiveId === 'hypercalcemia-reassessment')?.outcome;
    expect(outcome(log)).toBe('not-met');
    expect(outcome([...log, event('bridge-reassessment', HYPERCALCEMIA_FLUID_RESPONSE_TICKS)])).toBe('not-met');
    expect(outcome([...log, event('bridge-reassessment', HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS)])).toBe('met');
  });

  it('rejects injected or generic actions, classifies renal-review refusal, and ignores forged action clocks', () => {
    const engine = newEngine(); const control = newEngine();
    for (const type of ['bolus', 'fluid', 'inject-crisis', 'myxedema-response', 'thyroid-storm-response']) {
      engine.apply({ tick: 999999, type, payload: { action: 'calcitonin', notes: 'private-value' } });
    }
    for (const payload of [null, [], {}, { action: null }, { action: {} }, { action: '__proto__' }, { action: 'private-value' },
      { action: 'calcitonin', dose: 999 }, { action: 'tailored-fluids', notes: 'private-value' }]) {
      engine.apply({ tick: 999999, type: 'hypercalcemia-response', payload } as LearnerAction);
    }
    const frame = engine.step(); expect(frame.state).toEqual(control.step().state);
    expect(frame.equipment.resuscitation.hypercalcemia).toMatchObject({ fluidsAtTick: null, calcitoninAtTick: null, antiresorptiveAtTick: null });
    expect(JSON.stringify(frame.events)).not.toContain('private-value');
    engine.apply(choice(999999, 'antiresorptive'));
    const refusalFrame = engine.step();
    expect(refusalFrame.events.some(({ eventId }) => eventId === 'hypercalcemia-antiresorptive-review-refused-1')).toBe(true);
    expect(refusalFrame.events.some(({ tick, eventId }) => tick === 1 && eventId.includes('refused'))).toBe(true);
    expect(refusalFrame.equipment.resuscitation.hypercalcemia!.antiresorptiveAtTick).toBeNull();
    engine.apply(choice(-100, 'assess-cardiorenal')); engine.apply(choice(999999, 'antiresorptive'));
    engine.apply(choice(999999, 'tailored-fluids')); engine.apply(choice(999999, 'calcitonin'));
    expect(engine.equipment().resuscitation.hypercalcemia).toMatchObject({ cardiorenalAssessedAtTick: 2,
      antiresorptiveAtTick: 2, fluidsAtTick: 2, calcitoninAtTick: 2, fluidDueInSeconds: 900, bridgeDueInSeconds: 14400 });
  });

  it('prioritizes only observed calcium within the bounded report context and excludes private prose', () => {
    const engine = newEngine(); engine.apply(choice(0, 'calcitonin'));
    const unseen = collectReportEquipmentContext(engine.equipment());
    expect(Object.keys(unseen).filter((key) => key.includes('adjustedCalcium'))).toEqual([]);
    engine.apply(choice(0, 'assess-cardiorenal')); engine.apply(choice(0, 'reassess'));
    const equipment = engine.equipment(); const patient = equipment.resuscitation.hypercalcemia!;
    const projected = collectReportEquipmentContext({ ...equipment, resuscitation: { ...equipment.resuscitation,
      hypercalcemia: { ...patient, choiceFeedback: 'private-value', alertness: 'private-value',
        observation: { ...patient.observation!, alertness: 'private-value', fluidTolerance: 'private-value' } },
    } });
    expect(Object.keys(projected)).toHaveLength(32);
    expect(projected).toMatchObject({ 'resuscitation.hypercalcemia.calcitoninAtTick': 0,
      'resuscitation.hypercalcemia.cardiorenalAssessedAtTick': 0, 'resuscitation.hypercalcemia.fluidsAtTick': null,
      'resuscitation.hypercalcemia.antiresorptiveAtTick': null, 'resuscitation.hypercalcemia.observation.atTick': 0,
      'resuscitation.hypercalcemia.observation.adjustedCalciumMgDl': 16.4,
      'resuscitation.hypercalcemia.observation.systolicMmHg': 96, 'resuscitation.hypercalcemia.bridgeResponseObserved': false });
    expect(JSON.stringify(projected)).not.toMatch(/private-value|choiceFeedback|alertness|fluidTolerance/);
  });
});
