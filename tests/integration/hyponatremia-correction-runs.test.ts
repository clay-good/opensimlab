import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import {
  HYPONATREMIA_CORRECTION_AQUARESIS_TICKS as AQUARESIS,
  HYPONATREMIA_CORRECTION_OVERCORRECTION_TICKS as BREACH,
  HYPONATREMIA_CORRECTION_RESPONSE_TICKS as RESPONSE,
  HYPONATREMIA_CORRECTION_TAKEOVER_TICKS as TAKEOVER,
  HYPONATREMIA_CORRECTION_SESSION_TICKS as SESSION,
  type HyponatremiaCorrectionAction,
} from '../../src/modules/endocrine-metabolic/hyponatremia-correction';
import { HYPONATREMIA_CORRECTION_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/hyponatremia-correction-fixtures';
import { HYPONATREMIA_AQUARESIS_AND_OVERCORRECTION as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hyponatremia-aquaresis-and-overcorrection';
import { hyponatremiaCorrectionCompletionEvidence } from '../../src/modules/endocrine-metabolic/hyponatremia-correction-completion';
import { hyponatremiaCorrectionInlinePrompt } from '../../src/modules/endocrine-metabolic/hyponatremia-correction-tutor';

type Frame = ReturnType<AnesthesiaEngine['step']>;
type Choices = readonly (readonly [number, HyponatremiaCorrectionAction])[];
const OBJECTIVES = ['sodium-correction-risk', 'sodium-correction-surveillance', 'sodium-correction-response',
  'sodium-correction-reassessment', 'sodium-correction-handoff'];
const newEngine = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: HyponatremiaCorrectionAction): LearnerAction => ({ tick, type: 'hyponatremia-correction-response', payload: { action } });

function run(actions: Choices, until: number, level: 'guided' | 'unassisted', checkpoints: readonly number[] = [], region: 'US' | 'GB' = 'US') {
  const engine = newEngine(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  const frames = new Map<number, Frame>(); const prompts = new Set<string>();
  const capture = new Set([0, until, ...actions.map(([tick]) => tick), ...checkpoints]); let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify({ tick: frame.tick, state: frame.state, patient: frame.equipment.resuscitation.hyponatremiaCorrection, events: frame.events }));
    if (capture.has(tick)) {
      frames.set(tick, frame); const before = JSON.stringify(frame);
      const prompt = hyponatremiaCorrectionInlinePrompt(level, {
        scenarioVersion: SCENARIO.metadata.version, hyponatremiaCorrection: frame.equipment.resuscitation.hyponatremiaCorrection,
      });
      if (prompt) prompts.add(prompt.id);
      expect(JSON.stringify(frame)).toBe(before);
    }
  }
  return { engine, events, frames, prompts, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.hyponatremiaCorrection! };
}

describe('Post-rescue sodium correction through the real engine and causal debrief', () => {
  it('keeps exact content/capability evidence separate from pending completion and unsupported monitor fields', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(OBJECTIVES);
    expect(SCENARIO.metadata.estimatedMinutes).toBe(90);
    expect(FIXTURES).toMatchObject({ scenarioId: SCENARIO.metadata.id, contentVersion: '0.1.0', seed: 4907 });
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(hyponatremiaCorrectionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic')).toHaveLength(9);
    expect(hyponatremiaCorrectionCompletionEvidence({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(hyponatremiaCorrectionCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 999 } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(hyponatremiaCorrectionCompletionEvidence(SCENARIO, `${ENGINE_VERSION}-changed`, 'endocrine-metabolic')).toEqual([]);
    expect(hyponatremiaCorrectionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    const frame = newEngine().step();
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining(['etco2MmHg', 'fio2']));
    expect(frame.equipment.resuscitation.hyponatremiaCorrection).toMatchObject({ observation: null, peakObservedSodiumMmolL: 111 });
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays each real %s tick identically across guidance levels with retained learning evidence', (path) => {
    const actions: Choices = FIXTURES[path]; const corrected = path === 'expert' || path === 'recovery';
    const until = corrected ? actions.at(-1)![0] + 1 : TAKEOVER + 1;
    const guided = run(actions, until, 'guided'); const unassisted = run(actions, until, 'unassisted');
    expect(guided.hash).toBe(unassisted.hash);
    expect(guided.patient).toEqual(unassisted.patient);
    expect(guided.prompts.size).toBeGreaterThan(0); expect(unassisted.prompts.size).toBe(0);
    expect(guided.patient).toMatchObject({ ended: corrected ? 'handoff' : 'instructor-takeover',
      responseObserved: corrected, peakObservedSodiumMmolL: path === 'noAction' ? 111 : path === 'expert' ? 112 : 115,
      overcorrectionObserved: path === 'commonError' || path === 'recovery',
      normalizationAttempted: path === 'commonError' || path === 'recovery',
      symptomWaitChosen: path === 'commonError' || path === 'recovery', durableRecoveryProven: false });
    if (corrected) expect(guided.patient.observation).toMatchObject({ sodiumMmolL: 112, urineOutputMlPerHour: 100 });
    if (path === 'noAction') expect(guided.patient.observation).toBeNull();
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], guided.events);
    expect(findings.map(({ objectiveId }) => objectiveId)).toEqual(OBJECTIVES);
    expect(findings.map(({ outcome }) => outcome)).toEqual(path === 'expert' ? Array(5).fill('met')
      : path === 'recovery' ? ['met', 'not-met', 'not-met', 'met', 'met'] : Array(5).fill('not-met'));
    const supplied = { systolicMmHg: 118, diastolicMmHg: 70, meanArterialMmHg: 86, heartRateBpm: 84,
      respiratoryRateBpm: 16, spo2Percent: 98, coreTemperatureC: 36.8 };
    expect(guided.frames.get(0)!.state).toMatchObject(supplied);
    expect(guided.frames.get(until)!.state).toMatchObject(supplied);
    const ended = guided.patient; guided.engine.apply(choice(999999, 'reassess')); guided.engine.step();
    expect(guided.engine.equipment().resuscitation.hyponatremiaCorrection).toEqual(ended);
  });

  it('keeps hidden branch values and peak out of live snapshots and automatic engine events until requested', () => {
    const result = run([[0, 'monitor'], [0, 'reassess'], [BREACH + 1, 'reassess']], BREACH + 1, 'guided', [AQUARESIS, BREACH]);
    for (const tick of [AQUARESIS, BREACH]) {
      const patient = result.frames.get(tick)!.equipment.resuscitation.hyponatremiaCorrection!;
      expect(patient).toMatchObject({ observation: { atTick: 0, sodiumMmolL: 111, urineOutputMlPerHour: 75 },
        peakObservedSodiumMmolL: 111, aquaresisObserved: false, overcorrectionObserved: false });
    }
    expect(result.events.filter(({ tick }) => tick > 0 && tick <= BREACH).map(({ message }) => message).join(' '))
      .not.toMatch(/115|350|total rise 9|excessive correction has|limit crossed/i);
    expect(result.patient).toMatchObject({ observation: { atTick: BREACH + 1, sodiumMmolL: 115, urineOutputMlPerHour: 350 },
      peakObservedSodiumMmolL: 115, aquaresisObserved: true, overcorrectionObserved: true });
  });

  it('bounds a stale-observation control branch without awarding unobserved prevention or a fresh result', () => {
    const actions: Choices = [[0, 'review-risk'], [0, 'call-support'], [0, 'monitor'],
      [AQUARESIS, 'reassess'], [BREACH, 'control-water-loss'], [BREACH + RESPONSE, 'handoff']];
    const result = run(actions, SESSION, 'unassisted', [BREACH + RESPONSE, SESSION - 1]);
    expect(result.frames.get(BREACH + RESPONSE)!.equipment.resuscitation.hyponatremiaCorrection)
      .toMatchObject({ observation: { atTick: AQUARESIS, sodiumMmolL: 112, urineOutputMlPerHour: 350 }, responseObserved: false, ended: null });
    expect(result.events.some(({ eventId }) => eventId === `sodium-correction-handoff-refused-${BREACH + RESPONSE}`)).toBe(true);
    expect(result.frames.get(SESSION - 1)!.equipment.resuscitation.hyponatremiaCorrection?.ended).toBeNull();
    expect(result.patient.ended).toBe('instructor-takeover');
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], result.events);
    expect(findings.map(({ outcome }) => outcome)).toEqual(['met', 'met', 'not-met', 'not-met', 'not-met']);
    expect(findings.find(({ objectiveId }) => objectiveId === 'sodium-correction-response')?.finding)
      .not.toMatch(/successful prevention/i);
  });

  it('uses the same declared high-risk pathway in GB without claiming region-specific prescribing', () => {
    const result = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0], 'unassisted', [], 'GB');
    expect(result.patient).toMatchObject({ ended: 'handoff', reloweringAtTick: null, peakObservedSodiumMmolL: 112 });
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], result.events).map(({ outcome }) => outcome)).toEqual(Array(5).fill('met'));
  });

  it('refuses generic, adjacent, malformed, and extra-field actions without trusting caller timestamps or echoing payloads', () => {
    const engine = newEngine(); const control = newEngine();
    for (const [type, payload] of [['bolus', { drugId: 'propofol', amount: 999, unit: 'mg' }],
      ['fluid-bolus', { amountMl: 999 }], ['ventilator', { fio2: 1 }], ['laryngoscopy', {}],
      ['hypocalcemia-response', { action: 'calcium-rescue' }]] as const) {
      engine.apply({ tick: 999999, type, payload } as LearnerAction);
    }
    for (const payload of [null, [], {}, { action: null }, { action: '__proto__' },
      { action: 'private-value' }, { action: 'relower', dose: 999 }, { action: 'monitor', notes: 'private-value' }]) {
      engine.apply({ tick: 999999, type: 'hyponatremia-correction-response', payload } as LearnerAction);
    }
    const frame = engine.step(); expect(frame.state).toEqual(control.step().state);
    expect(frame.equipment.resuscitation.hyponatremiaCorrection).toMatchObject({ monitoringAtTick: null,
      waterLossControlAtTick: null, reloweringAtTick: null, observation: null });
    expect(JSON.stringify(frame.events)).not.toContain('private-value');
    engine.apply(choice(999999, 'monitor')); engine.apply(choice(-100, 'review-risk'));
    expect(engine.equipment().resuscitation.hyponatremiaCorrection).toMatchObject({ monitoringAtTick: 1, riskReviewedAtTick: 1 });
  });
});
