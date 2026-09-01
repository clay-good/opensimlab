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
  supportsMyxedema, MYXEDEMA_VENTILATION_TICKS, MYXEDEMA_RESPIRATORY_DELAY_TICKS,
  MYXEDEMA_ENDOCRINE_DELAY_TICKS, MYXEDEMA_RESPONSE_TICKS, MYXEDEMA_TAKEOVER_TICKS,
  MYXEDEMA_SESSION_TICKS, type MyxedemaAction,
} from '../../src/modules/endocrine-metabolic/myxedema';
import { MYXEDEMA_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/myxedema-fixtures';
import { MYXEDEMA_COMA_VENTILATION_AND_STEROID_SEQUENCE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/myxedema-coma-ventilation-and-steroid-sequence';
import { myxedemaInlinePrompt } from '../../src/modules/endocrine-metabolic/tutor/myxedema-guidance';
import { myxedemaCompletionEvidence } from '../../src/modules/endocrine-metabolic/myxedema-completion';

type Frame = ReturnType<AnesthesiaEngine['step']>;
type Choices = readonly (readonly [number, MyxedemaAction])[];
const OBJECTIVES = ['myxedema-ventilation', 'myxedema-steroid-sequence', 'myxedema-parallel-care', 'myxedema-reassessment', 'myxedema-handoff'];
const newEngine = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const choice = (tick: number, action: MyxedemaAction): LearnerAction => ({ tick, type: 'myxedema-response', payload: { action } });
const PACKAGE: Choices = [[0, 'ventilate'], [0, 'hydrocortisone'], [0, 'levothyroxine'], [0, 'supportive-care'], [0, 'call-support']];

/** Hash complete solver states and emitted evidence at every real engine tick.
 * Guidance is read-only and sampled at decision/checkpoint frames, not every tick.
 */
function run(actions: Choices, until: number, level: 'guided' | 'unassisted', checkpoints: readonly number[] = []) {
  const engine = newEngine(); const hash = createHash('sha256');
  const events: EngineEvent[] = []; const frames = new Map<number, Frame>(); const prompts = new Set<string>();
  const capture = new Set([0, MYXEDEMA_RESPIRATORY_DELAY_TICKS - 1, MYXEDEMA_RESPIRATORY_DELAY_TICKS,
    MYXEDEMA_ENDOCRINE_DELAY_TICKS - 1, MYXEDEMA_ENDOCRINE_DELAY_TICKS, until, ...actions.map(([tick]) => tick), ...checkpoints]);
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify({ tick: frame.tick, state: frame.state, patient: frame.equipment.resuscitation.myxedema, events: frame.events }));
    if (capture.has(tick)) {
      frames.set(tick, frame); const before = JSON.stringify(frame);
      const prompt = myxedemaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version, myxedema: frame.equipment.resuscitation.myxedema });
      if (prompt) prompts.add(prompt.id);
      expect(JSON.stringify(frame)).toBe(before);
    }
  }
  return { engine, frames, events, prompts, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.myxedema! };
}

function expectMonitor(frame: Frame, expected: Record<string, number>) {
  expect(frame.state).toMatchObject(expected);
  const observation = frame.equipment.resuscitation.myxedema!.observation;
  if (observation?.atTick === frame.tick) {
    for (const key of ['systolicMmHg', 'diastolicMmHg', 'meanArterialMmHg', 'heartRateBpm', 'respiratoryRateBpm',
      'spo2Percent', 'coreTemperatureC', 'paco2MmHg'] as const) expect(frame.state[key]).toBe(observation[key]);
  }
}

describe('Myxedema: real engine support, sequence, and replay', () => {
  it('binds evidence to exact content and engine identity without promoting pending validation', () => {
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(audit.requirements.find(({ id }) => id === 'guidance-and-demonstration')?.status).toBe('satisfied');
    expect(myxedemaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic').length).toBeGreaterThan(0);
    expect(myxedemaCompletionEvidence({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.2' } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(myxedemaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: SCENARIO.patient.weightKg + 1 } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(myxedemaCompletionEvidence(SCENARIO, `${ENGINE_VERSION}-changed`, 'endocrine-metabolic')).toEqual([]);
    expect(myxedemaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
  });

  it('binds schema, objectives, fixture version, and explicitly authored timing', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.version).toBe('0.1.1');
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(OBJECTIVES);
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id); expect(FIXTURES.contentVersion).toBe(SCENARIO.metadata.version);
    expect(supportsMyxedema(SCENARIO)).toBe(true);
    expect(supportsMyxedema({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) })).toBe(false);
    expect(supportsMyxedema({ ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] })).toBe(false);
    expect([MYXEDEMA_VENTILATION_TICKS, MYXEDEMA_RESPIRATORY_DELAY_TICKS, MYXEDEMA_ENDOCRINE_DELAY_TICKS,
      MYXEDEMA_RESPONSE_TICKS, MYXEDEMA_TAKEOVER_TICKS, MYXEDEMA_SESSION_TICKS].map((tick) => tick / TICKS_PER_SECOND / 60))
      .toEqual([5, 5, 15, 60, 30, 180]);
    const engine = newEngine();
    expect(engine.equipment().resuscitation.myxedema).toMatchObject({ ventilationAtTick: null, oxygenOnlyAtTick: null,
      hydrocortisoneAtTick: null, levothyroxineAtTick: null, supportiveCareAtTick: null, observation: null, ended: null,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false });
    expect(engine.invalidParameters()).toContain('etco2MmHg');
    expect(engine.invalidParameters()).toContain('fio2');
    expect(engine.step().equipment.invalidParameters).toContain('etco2MmHg');
  });

  it('advertises complete-care observation without adding the concurrent ventilation interval', () => {
    expect(SCENARIO.metadata.estimatedMinutes).toBe(60);
    expect(SCENARIO.metadata.estimatedMinutes).toBe(MYXEDEMA_RESPONSE_TICKS / TICKS_PER_SECOND / 60);
    const packageAt = Math.max(...FIXTURES.expert.filter(([, action]) => action !== 'reassess' && action !== 'handoff').map(([tick]) => tick));
    const assessments = FIXTURES.expert.filter(([, action]) => action === 'reassess');
    const handoff = FIXTURES.expert.find(([, action]) => action === 'handoff')![0];
    expect(assessments[0]![0]).toBe(MYXEDEMA_VENTILATION_TICKS);
    expect(assessments[1]![0] - packageAt).toBe(MYXEDEMA_RESPONSE_TICKS);
    expect(Math.round(handoff / TICKS_PER_SECOND / 60)).toBe(SCENARIO.metadata.estimatedMinutes);
    expect(handoff).toBeLessThan(MYXEDEMA_SESSION_TICKS);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays %s with identical whole-state hashes and retained objective evidence', (path) => {
    const actions: Choices = FIXTURES[path]; const corrected = path === 'expert' || path === 'recovery';
    const mistakes = path === 'commonError' || path === 'recovery';
    const until = corrected ? actions.at(-1)![0] + 1 : MYXEDEMA_TAKEOVER_TICKS + 1;
    const guided = run(actions, until, 'guided'); const unassisted = run(actions, until, 'unassisted');
    expect(guided.hash).toBe(unassisted.hash); expect(guided.patient).toEqual(unassisted.patient);
    expect(guided.prompts.size).toBeGreaterThan(0); expect(unassisted.prompts.size).toBe(0);
    expect(guided.patient).toMatchObject({ ended: corrected ? 'handoff' : 'instructor-takeover', responseObserved: corrected,
      respiratorySupportObserved: corrected, earlyThyroxineAttempted: mistakes, rapidRewarmingAttempted: mistakes,
      waitForLabsChosen: mistakes, ventilationDelayed: path !== 'expert', endocrineTreatmentDelayed: path !== 'expert', durableRecoveryProven: false });
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], guided.events);
    expect(findings.map(({ objectiveId }) => objectiveId)).toEqual(OBJECTIVES);
    expect(findings.map(({ outcome }) => outcome)).toEqual(path === 'expert' ? Array(5).fill('met')
      : path === 'recovery' ? ['not-met', 'not-met', 'not-met', 'met', 'met'] : Array(5).fill('not-met'));
    expectMonitor(guided.frames.get(0)!, { heartRateBpm: 42, meanArterialMmHg: 65, coreTemperatureC: 34, paco2MmHg: 68 });
    expectMonitor(guided.frames.get(until)!, corrected
      ? { heartRateBpm: 46, meanArterialMmHg: 71, coreTemperatureC: 34.2, spo2Percent: 94, paco2MmHg: 54 }
      : { heartRateBpm: 38, meanArterialMmHg: 57, coreTemperatureC: 33.8, spo2Percent: mistakes ? 94 : 86, paco2MmHg: 78 });
    if (path !== 'expert') {
      expectMonitor(guided.frames.get(MYXEDEMA_RESPIRATORY_DELAY_TICKS - 1)!, { paco2MmHg: 68 });
      expectMonitor(guided.frames.get(MYXEDEMA_RESPIRATORY_DELAY_TICKS)!, { paco2MmHg: 78 });
      expect(guided.events.find(({ eventId }) => eventId.startsWith('myxedema-respiratory-delay-'))?.tick).toBe(MYXEDEMA_RESPIRATORY_DELAY_TICKS);
      expect(guided.events.find(({ eventId }) => eventId.startsWith('myxedema-endocrine-delay-'))?.tick).toBe(MYXEDEMA_ENDOCRINE_DELAY_TICKS);
    }
    if (!corrected) expect(guided.events.find(({ eventId }) => eventId.startsWith('myxedema-instructor-takeover-'))?.tick).toBe(MYXEDEMA_TAKEOVER_TICKS);
    const ended = guided.patient;
    for (const action of ['ventilate', 'hydrocortisone', 'levothyroxine', 'reassess'] as const) guided.engine.apply(choice(999999, action));
    guided.engine.step(); expect(guided.engine.equipment().resuscitation.myxedema).toEqual(ended);
  // Full solver replays share CI resources; the hash still includes every tick.
  });

  it('does not confuse oxygen-only saturation with ventilation or erase a prior observation', () => {
    const ventilationAt = MYXEDEMA_RESPIRATORY_DELAY_TICKS + 1;
    const supportedAt = ventilationAt + MYXEDEMA_VENTILATION_TICKS;
    const result = run([[0, 'oxygen-only'], [0, 'reassess'], [ventilationAt, 'ventilate'],
      [supportedAt - 1, 'reassess'], [supportedAt + 1, 'reassess']], supportedAt + 1, 'unassisted', [supportedAt]);
    expectMonitor(result.frames.get(0)!, { spo2Percent: 94, paco2MmHg: 68, respiratoryRateBpm: 8 });
    expect(result.frames.get(0)!.equipment.invalidParameters).toContain('fio2');
    expectMonitor(result.frames.get(MYXEDEMA_RESPIRATORY_DELAY_TICKS)!, { spo2Percent: 94, paco2MmHg: 78, respiratoryRateBpm: 6 });
    expectMonitor(result.frames.get(supportedAt - 1)!, { spo2Percent: 94, paco2MmHg: 78 });
    expectMonitor(result.frames.get(supportedAt)!, { spo2Percent: 94, paco2MmHg: 54, respiratoryRateBpm: 12 });
    expect(result.frames.get(supportedAt)!.equipment.resuscitation.myxedema).toMatchObject({ responseObserved: false,
      respiratorySupportObserved: false, observation: { atTick: supportedAt - 1, paco2MmHg: 78 } });
    expect(result.patient).toMatchObject({ respiratorySupportObserved: true, responseObserved: false,
      observation: { atTick: supportedAt + 1, paco2MmHg: 54 }, ventilationDelayed: true });
    expectMonitor(result.frames.get(supportedAt + 1)!, { paco2MmHg: 54 });
  });

  it('accepts same-tick steroid-first order, requires fresh later reassessment, and bounds an unfinished lesson at three hours', () => {
    const result = run([...PACKAGE, [MYXEDEMA_VENTILATION_TICKS, 'reassess'], [MYXEDEMA_RESPONSE_TICKS - 1, 'reassess'],
      [MYXEDEMA_RESPONSE_TICKS + 1, 'handoff'], [MYXEDEMA_RESPONSE_TICKS + 1, 'reassess']], MYXEDEMA_SESSION_TICKS,
    'unassisted', [MYXEDEMA_RESPONSE_TICKS, MYXEDEMA_SESSION_TICKS - 1]);
    const patientAt = (tick: number) => result.frames.get(tick)!.equipment.resuscitation.myxedema!;
    expect(patientAt(0)).toMatchObject({ hydrocortisoneAtTick: 0, levothyroxineAtTick: 0, earlyThyroxineAttempted: false, responseDueInSeconds: 3600 });
    expect(patientAt(MYXEDEMA_VENTILATION_TICKS)).toMatchObject({ respiratorySupportObserved: true, responseObserved: false });
    expectMonitor(result.frames.get(MYXEDEMA_RESPONSE_TICKS - 1)!, { coreTemperatureC: 34, meanArterialMmHg: 65 });
    expectMonitor(result.frames.get(MYXEDEMA_RESPONSE_TICKS)!, { coreTemperatureC: 34.2, meanArterialMmHg: 71 });
    expect(patientAt(MYXEDEMA_RESPONSE_TICKS)).toMatchObject({ responseObserved: false,
      observation: { atTick: MYXEDEMA_RESPONSE_TICKS - 1, coreTemperatureC: 34, meanArterialMmHg: 65 } });
    expect(patientAt(MYXEDEMA_RESPONSE_TICKS + 1)).toMatchObject({ ended: null, responseObserved: true, durableRecoveryProven: false,
      observation: { atTick: MYXEDEMA_RESPONSE_TICKS + 1, coreTemperatureC: 34.2, meanArterialMmHg: 71 } });
    expect(result.events.some(({ eventId }) => eventId.startsWith('myxedema-handoff-refused-'))).toBe(true);
    expect(patientAt(MYXEDEMA_SESSION_TICKS - 1).ended).toBeNull(); expect(result.patient.ended).toBe('instructor-takeover');
    for (const event of ['ventilation-response', 'response', 'instructor-takeover']) {
      expect(result.events.filter(({ eventId }) => eventId.startsWith(`myxedema-${event}-`))).toHaveLength(1);
    }
  });

  it('retains an oxygen-only bridge in the debrief while crediting prompt ventilation', () => {
    const result = run([[0, 'oxygen-only'], ...PACKAGE, [MYXEDEMA_VENTILATION_TICKS, 'reassess'],
      [MYXEDEMA_RESPONSE_TICKS, 'reassess'], [MYXEDEMA_RESPONSE_TICKS + 1, 'handoff']],
    MYXEDEMA_RESPONSE_TICKS + 1, 'unassisted');
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], result.events);
    expect(findings.every(({ outcome }) => outcome === 'met')).toBe(true);
    expect(findings.find(({ objectiveId }) => objectiveId === 'myxedema-ventilation')?.finding)
      .toContain('Oxygen-only support was chosen first. It can be a bridge');
    expect(result.patient.ventilationDelayed).toBe(false);
  });

  it('rejects generic, malformed, and injected actions and uses engine time rather than forged ticks', () => {
    const engine = newEngine(); const control = newEngine();
    for (const type of ['bolus', 'fluid', 'inject-crisis', 'thyroid-storm-response', 'adrenal-crisis-response', 'severe-hypoglycemia-response']) {
      engine.apply({ tick: 999999, type, payload: { action: 'ventilate', notes: 'private-value' } });
    }
    for (const payload of [null, [], {}, { action: null }, { action: {} }, { action: '__proto__' }, { action: 'private-value' },
      { action: 'ventilate', dose: 999 }, { action: 'hydrocortisone', notes: 'private-value' }]) {
      engine.apply({ tick: 999999, type: 'myxedema-response', payload } as LearnerAction);
    }
    const frame = engine.step(); expect(frame.state).toEqual(control.step().state);
    expect(frame.equipment.resuscitation.myxedema).toMatchObject({ ventilationAtTick: null, hydrocortisoneAtTick: null, levothyroxineAtTick: null });
    expect(JSON.stringify(frame.events)).not.toContain('private-value');
    engine.apply(choice(999999, 'levothyroxine'));
    expect(engine.equipment().resuscitation.myxedema).toMatchObject({ earlyThyroxineAttempted: true, levothyroxineAtTick: null });
    engine.apply(choice(-100, 'hydrocortisone')); engine.apply(choice(999999, 'levothyroxine'));
    expect(engine.equipment().resuscitation.myxedema).toMatchObject({ hydrocortisoneAtTick: 1, levothyroxineAtTick: 1,
      earlyThyroxineAttempted: true, responseDueInSeconds: null });
  });

  it('keeps diagnostic scalars inside the opt-in report budget without feedback or alertness prose', () => {
    const engine = newEngine(); engine.apply(choice(0, 'hydrocortisone')); engine.apply(choice(0, 'reassess'));
    const equipment = engine.equipment(); const patient = equipment.resuscitation.myxedema!;
    const projected = collectReportEquipmentContext({ ...equipment, resuscitation: { ...equipment.resuscitation,
      myxedema: { ...patient, choiceFeedback: 'private-value', alertness: 'private-value',
        observation: { ...patient.observation!, alertness: 'private-value' } },
    } });
    expect(Object.keys(projected)).toHaveLength(32);
    expect(projected).toMatchObject({ 'resuscitation.myxedema.supportActive': false,
      'resuscitation.myxedema.ventilationAtTick': null, 'resuscitation.myxedema.oxygenOnlyAtTick': null,
      'resuscitation.myxedema.hydrocortisoneAtTick': 0, 'resuscitation.myxedema.levothyroxineAtTick': null,
      'resuscitation.myxedema.supportiveCareAtTick': null, 'resuscitation.myxedema.ventilationDueInSeconds': null,
      'resuscitation.myxedema.responseDueInSeconds': null, 'resuscitation.myxedema.respiratorySupportObserved': false,
      'resuscitation.myxedema.responseObserved': false, 'resuscitation.myxedema.ventilationDelayed': false,
      'resuscitation.myxedema.endocrineTreatmentDelayed': false, 'resuscitation.myxedema.waitForLabsChosen': false,
      'resuscitation.myxedema.earlyThyroxineAttempted': false, 'resuscitation.myxedema.rapidRewarmingAttempted': false,
      'resuscitation.myxedema.ended': null, 'resuscitation.myxedema.observation.atTick': 0,
      'resuscitation.myxedema.observation.meanArterialMmHg': 65, 'resuscitation.myxedema.observation.coreTemperatureC': 34,
      'resuscitation.myxedema.observation.spo2Percent': 90, 'resuscitation.myxedema.observation.paco2MmHg': 68 });
    expect(JSON.stringify(projected)).not.toMatch(/private-value|choiceFeedback|alertness/);
    expect(collectReportEquipmentContext(null)).toEqual({});
  });
});
