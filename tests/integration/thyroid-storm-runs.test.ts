import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import { collectReportEquipmentContext } from '@routes/AnesthesiaRoute';
import {
  supportsThyroidStorm, THYROID_DELAY_TICKS, THYROID_IODINE_WAIT_TICKS,
  THYROID_RESPONSE_TICKS, THYROID_SESSION_TICKS, THYROID_TAKEOVER_TICKS,
  type ThyroidStormAction,
} from '../../src/modules/endocrine-metabolic/thyroid-storm';
import { THYROID_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/thyroid-storm-fixtures';
import { THYROID_STORM_HEMODYNAMIC_RISK as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/thyroid-storm-hemodynamic-risk';
import { thyroidInlinePrompt } from '../../src/modules/endocrine-metabolic/tutor/thyroid-guidance';
import { thyroidCompletionEvidence } from '../../src/modules/endocrine-metabolic/thyroid-completion';

type Frame = ReturnType<AnesthesiaEngine['step']>;
type Choices = readonly (readonly [number, ThyroidStormAction])[];
const OBJECTIVES = ['thyroid-urgent-treatment', 'thyroid-circulation', 'thyroid-sequence', 'thyroid-reassessment', 'thyroid-handoff'];
const newEngine = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const choice = (tick: number, action: ThyroidStormAction): LearnerAction => ({ tick, type: 'thyroid-storm-response', payload: { action } });

/** Real solver ticks, with complete patient state in the digest, not selected vital signs.
 * Guidance is read-only and sampled at decision/checkpoint frames to bound test cost.
 */
function run(actions: Choices, until: number, level: 'guided' | 'unassisted', checkpoints: readonly number[] = []) {
  const engine = newEngine();
  const hash = createHash('sha256');
  const events: EngineEvent[] = [];
  const frames = new Map<number, Frame>();
  const prompts = new Set<string>();
  const capture = new Set([0, THYROID_DELAY_TICKS - 1, THYROID_DELAY_TICKS, until, ...actions.map(([tick]) => tick), ...checkpoints]);
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) {
      const action = choice(tick, actions[next]![1]);
      engine.apply(action); next += 1;
    }
    const frame = engine.step();
    events.push(...frame.events);
    hash.update(JSON.stringify({ tick: frame.tick, state: frame.state,
      patient: frame.equipment.resuscitation.thyroidStorm, events: frame.events }));
    if (capture.has(tick)) {
      frames.set(tick, frame);
      const before = JSON.stringify(frame);
      const prompt = thyroidInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
        thyroidStorm: frame.equipment.resuscitation.thyroidStorm });
      if (prompt) prompts.add(prompt.id);
      expect(JSON.stringify(frame)).toBe(before);
    }
  }
  return { engine, frames, events, prompts, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.thyroidStorm! };
}

function expectMonitor(frame: Frame, expected: Record<string, number>) {
  expect(frame.state).toMatchObject(expected);
  const observation = frame.equipment.resuscitation.thyroidStorm!.observation;
  if (observation?.atTick === frame.tick) {
    for (const key of ['systolicMmHg', 'diastolicMmHg', 'meanArterialMmHg', 'heartRateBpm', 'respiratoryRateBpm', 'spo2Percent', 'coreTemperatureC'] as const) {
      expect(frame.state[key]).toBe(observation[key]);
    }
  }
}

describe('Thyroid storm: real engine decisions, time, and replay', () => {
  it('binds completion evidence to exact content and engine identity without promoting pending validation', () => {
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(audit.requirements.find(({ id }) => id === 'guidance-and-demonstration')?.status).toBe('satisfied');
    expect(thyroidCompletionEvidence(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic').length).toBeGreaterThan(0);
    expect(thyroidCompletionEvidence({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.2' } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(thyroidCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: SCENARIO.patient.weightKg + 1 } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(thyroidCompletionEvidence(SCENARIO, `${ENGINE_VERSION}-changed`, 'endocrine-metabolic')).toEqual([]);
    expect(thyroidCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
  });

  it('binds the schema, five objectives, exact fixture version, and authored time boundaries', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.version).toBe('0.1.1');
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(OBJECTIVES);
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(FIXTURES.contentVersion).toBe(SCENARIO.metadata.version);
    expect(supportsThyroidStorm(SCENARIO)).toBe(true);
    expect(supportsThyroidStorm({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) })).toBe(false);
    expect(supportsThyroidStorm({ ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] })).toBe(false);
    expect([THYROID_IODINE_WAIT_TICKS, THYROID_RESPONSE_TICKS, THYROID_SESSION_TICKS].map((tick) => tick / TICKS_PER_SECOND / 60))
      .toEqual([60, 120, 240]);
    expect(newEngine().equipment().resuscitation.thyroidStorm).toMatchObject({
      synthesisAtTick: null, supportiveCareAtTick: null, iodineAtTick: null,
      circulationRisk: 'unassessed', observation: null, ended: null,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    });
  });

  it('advertises the full sequential iodine and partial-support observation path', () => {
    const observationTicks = THYROID_IODINE_WAIT_TICKS + THYROID_RESPONSE_TICKS;
    expect(SCENARIO.metadata.estimatedMinutes).toBe(180);
    expect(SCENARIO.metadata.estimatedMinutes).toBe(observationTicks / TICKS_PER_SECOND / 60);
    const iodine = FIXTURES.expert.find(([, action]) => action === 'iodine')![0];
    const reassess = FIXTURES.expert.find(([, action]) => action === 'reassess')![0];
    const handoff = FIXTURES.expert.find(([, action]) => action === 'handoff')![0];
    expect(iodine).toBe(THYROID_IODINE_WAIT_TICKS);
    expect(reassess - iodine).toBe(THYROID_RESPONSE_TICKS);
    expect(Math.round(handoff / TICKS_PER_SECOND / 60)).toBe(SCENARIO.metadata.estimatedMinutes);
    expect(handoff).toBeLessThan(THYROID_SESSION_TICKS);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays %s with identical whole-state hashes and honest objective outcomes', (path) => {
    const actions: Choices = FIXTURES[path];
    const corrected = path === 'expert' || path === 'recovery';
    const until = corrected ? actions.at(-1)![0] + 1 : THYROID_TAKEOVER_TICKS + 1;
    const guided = run(actions, until, 'guided');
    const unassisted = run(actions, until, 'unassisted');
    expect(guided.hash).toBe(unassisted.hash);
    expect(guided.patient).toEqual(unassisted.patient);
    expect(unassisted.prompts.size).toBe(0);
    expect(guided.prompts.size).toBeGreaterThan(0);
    expect(guided.patient.ended).toBe(corrected ? 'handoff' : 'instructor-takeover');
    expect(guided.patient.durableRecoveryProven).toBe(false);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], guided.events);
    expect(findings.map(({ objectiveId }) => objectiveId)).toEqual(OBJECTIVES);
    expect(findings.map(({ outcome }) => outcome)).toEqual(path === 'expert' ? Array(5).fill('met')
      : path === 'recovery' ? ['not-met', 'not-met', 'not-met', 'met', 'met'] : Array(5).fill('not-met'));
    expectMonitor(guided.frames.get(0)!, { heartRateBpm: 148, meanArterialMmHg: 71, coreTemperatureC: 39.8, spo2Percent: 94 });
    expectMonitor(guided.frames.get(until)!, corrected
      ? { heartRateBpm: 132, meanArterialMmHg: 76, coreTemperatureC: 39.3, spo2Percent: 96 }
      : { heartRateBpm: 164, meanArterialMmHg: 58, coreTemperatureC: 40.2, spo2Percent: 92 });
    if (path !== 'expert') {
      expectMonitor(guided.frames.get(THYROID_DELAY_TICKS - 1)!, { meanArterialMmHg: 71 });
      expectMonitor(guided.frames.get(THYROID_DELAY_TICKS)!, { meanArterialMmHg: 58 });
      expect(guided.events.find(({ eventId }) => eventId.startsWith('thyroid-storm-incomplete-urgent-coverage-'))?.tick).toBe(THYROID_DELAY_TICKS);
    }
    if (!corrected) expect(guided.events.find(({ eventId }) => eventId.startsWith('thyroid-storm-instructor-takeover-'))?.tick).toBe(THYROID_TAKEOVER_TICKS);
    if (corrected) expectMonitor(guided.frames.get(actions.at(-2)![0])!, { meanArterialMmHg: 76 });
    const ended = guided.patient;
    guided.engine.apply(choice(999999, 'synthesis-blockade'));
    guided.engine.apply(choice(999999, 'reassess'));
    guided.engine.step();
    expect(guided.engine.equipment().resuscitation.thyroidStorm).toEqual(ended);
  // Two complete three-hour solver replays can exceed a minute under full-suite
  // contention. Keep every tick in the digest; this is not a performance budget.
  });

  it('enforces the hour interval, preserves stale observations at the two-hour checkpoint, and stops unfinished care at four hours', () => {
    const iodineAt = THYROID_IODINE_WAIT_TICKS;
    const responseAt = iodineAt + THYROID_RESPONSE_TICKS;
    const actions: Choices = [...FIXTURES.expert.slice(0, 5), [iodineAt - 1, 'iodine'], [iodineAt, 'iodine'],
      [responseAt - 1, 'reassess'], [responseAt + 1, 'reassess']];
    const result = run(actions, THYROID_SESSION_TICKS, 'unassisted', [responseAt, THYROID_SESSION_TICKS - 1]);
    const patientAt = (tick: number) => result.frames.get(tick)!.equipment.resuscitation.thyroidStorm!;
    expect(patientAt(iodineAt - 1)).toMatchObject({ iodineAtTick: null, earlyIodineAttempted: true });
    expect(patientAt(iodineAt)).toMatchObject({ iodineAtTick: iodineAt, responseDueInSeconds: 7200 });
    expect(patientAt(responseAt - 1)).toMatchObject({ responseObserved: false, observation: { atTick: responseAt - 1, meanArterialMmHg: 71 } });
    expectMonitor(result.frames.get(responseAt - 1)!, { meanArterialMmHg: 71 });
    expectMonitor(result.frames.get(responseAt)!, { meanArterialMmHg: 76 });
    expect(patientAt(responseAt)).toMatchObject({ responseObserved: false, observation: { atTick: responseAt - 1, meanArterialMmHg: 71 } });
    expect(patientAt(responseAt + 1)).toMatchObject({ responseObserved: true, observation: { atTick: responseAt + 1, meanArterialMmHg: 76 }, durableRecoveryProven: false });
    expectMonitor(result.frames.get(responseAt + 1)!, { meanArterialMmHg: 76 });
    expect(patientAt(THYROID_SESSION_TICKS - 1).ended).toBeNull();
    expect(result.patient.ended).toBe('instructor-takeover');
    expect(result.events.filter(({ eventId }) => eventId.startsWith('thyroid-storm-response-'))).toHaveLength(1);
    expect(result.events.filter(({ eventId }) => eventId.startsWith('thyroid-storm-instructor-takeover-'))).toHaveLength(1);
  // Four hours of whole-tick evidence shares CI workers with other long replays.
  });

  it('rejects generic, malformed, and injected payloads and never lets a forged tick advance care', () => {
    const engine = newEngine(); const control = newEngine();
    for (const type of ['bolus', 'fluid', 'inject-crisis', 'adrenal-crisis-response', 'severe-hypoglycemia-response']) {
      engine.apply({ tick: 999999, type, payload: { action: 'synthesis-blockade', notes: 'private-value' } });
    }
    for (const payload of [null, [], {}, { action: null }, { action: {} }, { action: '__proto__' }, { action: 'private-value' },
      { action: 'synthesis-blockade', dose: 999 }, { action: 'supportive-care', notes: 'private-value' }]) {
      engine.apply({ tick: 999999, type: 'thyroid-storm-response', payload } as LearnerAction);
    }
    const frame = engine.step();
    expect(frame.state).toEqual(control.step().state);
    expect(frame.equipment.resuscitation.thyroidStorm).toMatchObject({ synthesisAtTick: null, supportiveCareAtTick: null, iodineAtTick: null });
    expect(JSON.stringify(frame.events)).not.toContain('private-value');
    engine.apply(choice(999999, 'synthesis-blockade'));
    expect(engine.equipment().resuscitation.thyroidStorm!.synthesisAtTick).toBe(1);
    engine.apply(choice(999999, 'iodine'));
    expect(engine.equipment().resuscitation.thyroidStorm!.iodineAtTick).toBeNull();
    engine.apply(choice(-100, 'supportive-care'));
    expect(engine.equipment().resuscitation.thyroidStorm!.supportiveCareAtTick).toBe(1);
  });

  it('prioritizes thyroid scalars within the opt-in report budget and excludes feedback and alertness prose', () => {
    const engine = newEngine();
    engine.apply(choice(0, 'synthesis-blockade'));
    engine.apply(choice(0, 'assess-circulation'));
    engine.apply(choice(0, 'reassess'));
    const equipment = engine.equipment(); const thyroid = equipment.resuscitation.thyroidStorm!;
    const projected = collectReportEquipmentContext({ ...equipment, resuscitation: { ...equipment.resuscitation,
      thyroidStorm: { ...thyroid, choiceFeedback: 'private-value', alertness: 'private-value',
        observation: { ...thyroid.observation!, alertness: 'private-value' } },
    } });
    expect(Object.keys(projected)).toHaveLength(32);
    expect(projected).toMatchObject({
      'resuscitation.thyroidStorm.synthesisAtTick': 0,
      'resuscitation.thyroidStorm.supportiveCareAtTick': null,
      'resuscitation.thyroidStorm.circulationAssessedAtTick': 0,
      'resuscitation.thyroidStorm.circulationRisk': 'congested-poor-perfusion',
      'resuscitation.thyroidStorm.rateControlReviewedAtTick': null,
      'resuscitation.thyroidStorm.iodineAtTick': null,
      'resuscitation.thyroidStorm.iodineDueInSeconds': 3600,
      'resuscitation.thyroidStorm.responseDueInSeconds': null,
      'resuscitation.thyroidStorm.supportActive': false,
      'resuscitation.thyroidStorm.urgentCoverageDelayed': false,
      'resuscitation.thyroidStorm.waitForLabsChosen': false,
      'resuscitation.thyroidStorm.blanketBetaBlockadeChosen': false,
      'resuscitation.thyroidStorm.earlyIodineAttempted': false,
      'resuscitation.thyroidStorm.observation.atTick': 0,
      'resuscitation.thyroidStorm.observation.meanArterialMmHg': 71,
      'resuscitation.thyroidStorm.observation.coreTemperatureC': 39.8,
      'resuscitation.thyroidStorm.observation.spo2Percent': 94,
      'resuscitation.thyroidStorm.responseObserved': false,
      'resuscitation.thyroidStorm.ended': null,
    });
    expect(JSON.stringify(projected)).not.toMatch(/private-value|choiceFeedback|alertness/);
    expect(collectReportEquipmentContext(null)).toEqual({});
  });
});
