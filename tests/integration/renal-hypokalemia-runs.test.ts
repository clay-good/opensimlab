import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RENAL_HYPOKALEMIA_MAGNESIUM_AND_ONGOING_LOSSES as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypokalemia-magnesium-and-ongoing-losses';
import { RENAL_HYPOKALEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypokalemia-fixtures';
import { RENAL_HYPOKALEMIA_POTASSIUM_TICKS as PARTIAL, RENAL_HYPOKALEMIA_RESPONSE_TICKS as RESPONSE,
  RENAL_HYPOKALEMIA_RECURRENCE_TICKS as RECURRENCE, RENAL_HYPOKALEMIA_TAKEOVER_TICKS as STOP,
  RENAL_HYPOKALEMIA_SESSION_TICKS as SESSION, type RenalHypokalemiaAction } from '../../src/modules/renal-electrolyte/hypokalemia';
import { renalHypokalemiaCompletionEvidence } from '../../src/modules/renal-electrolyte/hypokalemia-completion';
import { renalHypokalemiaInlinePrompt } from '../../src/modules/renal-electrolyte/renal-hypokalemia-tutor';
import { RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND as ADJACENT } from '../../src/modules/renal-electrolyte/scenarios/hyperkalemia-cardioprotection-and-rebound';

type Choices = readonly (readonly [number, RenalHypokalemiaAction])[];
type Frame = ReturnType<AnesthesiaEngine['step']>;
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: RenalHypokalemiaAction): LearnerAction => ({ tick, type: 'renal-hypokalemia-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);
function run(actions: Choices, until: number, options: {
  level?: GuidanceLevel; region?: 'US' | 'GB'; hash?: boolean; checkpoints?: readonly number[];
} = {}) {
  const engine = create(options.region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  const frames = new Map<number, Frame>(); const prompts = new Set<string>();
  const capture = new Set([0, until, ...actions.map(([tick]) => tick), ...(options.checkpoints ?? [])]);
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    // Every field and waveform sample participates; guidance is a read-only consumer.
    if (options.hash) hash.update(JSON.stringify(frame));
    if (capture.has(tick) || tick % 600 === 0) {
      const before = JSON.stringify(frame);
      const prompt = renalHypokalemiaInlinePrompt(options.level ?? 'unassisted', {
        scenarioVersion: SCENARIO.metadata.version, renalHypokalemia: frame.equipment.resuscitation.renalHypokalemia,
      });
      if (prompt) prompts.add(prompt.id);
      expect(JSON.stringify(frame)).toBe(before);
    }
    if (capture.has(tick)) frames.set(tick, frame);
  }
  expect(next).toBe(actions.length);
  return { engine, events, frames, prompts, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.renalHypokalemia! };
}

describe('Renal hypokalemia through the real engine and event-bound debrief', () => {
  it('binds exact preview content without upgrading clinical, inclusive, or production evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview', estimatedMinutes: 60 });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES).toMatchObject({ scenarioId: SCENARIO.metadata.id, contentVersion: '0.1.0', seed: 4951 });
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'renal-electrolyte', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(renalHypokalemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'renal-electrolyte')).toHaveLength(9);
    expect(renalHypokalemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(renalHypokalemiaCompletionEvidence(SCENARIO, 'changed', 'renal-electrolyte')).toEqual([]);
    for (const changed of [{ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } },
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 65 } }]) {
      expect(renalHypokalemiaCompletionEvidence(changed, ENGINE_VERSION, 'renal-electrolyte')).toEqual([]);
    }
    const frame = create().step();
    expect(frame.state).toMatchObject({ systolicMmHg: 106, diastolicMmHg: 66, meanArterialMmHg: 79,
      heartRateBpm: 96, respiratoryRateBpm: 18, spo2Percent: 98, coreTemperatureC: 36.7 });
    expect(frame.equipment.rhythmId).toBe('hypokalemic-repolarization');
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining(['etco2MmHg', 'fio2']));
    expect(frame.equipment.resuscitation.renalHypokalemia).toMatchObject({ observation: null,
      ecgObservation: null, potassiumObservation: null, durableRecoveryProven: false, doseModelAvailable: false });
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across three guidance modes', (path) => {
    const actions: Choices = FIXTURES[path]; const corrected = path === 'expert' || path === 'recovery';
    const hasPotassium = actions.some(([, action]) => action === 'potassium');
    const until = corrected ? actions.at(-1)![0] + 1 : (hasPotassium ? SESSION : STOP) + 1;
    const first = run(actions, until, { level: 'guided', hash: true });
    for (const level of ['coached', 'unassisted'] as const) {
      const other = run(actions, until, { level, hash: true });
      expect(other.hash).toBe(first.hash); expect(other.patient).toEqual(first.patient);
      if (level === 'unassisted') expect(other.prompts.size).toBe(0);
      else expect(other.prompts.size).toBeGreaterThan(0);
    }
    expect(first.prompts.size).toBeGreaterThan(0);
    expect(first.patient).toMatchObject({ ended: corrected ? 'handoff' : 'instructor-takeover',
      responseObserved: corrected, recurrenceObserved: path === 'recovery', durableRecoveryProven: false,
      rapidPotassiumAttempted: path === 'commonError' || path === 'recovery',
      monitoringStopAttempted: path === 'commonError' || path === 'recovery' });
    expect(findings(first.events).map(({ outcome }) => outcome)).toEqual(Array(5).fill(corrected ? 'met' : 'not-met'));
    if (corrected) expect(first.patient.observation).toMatchObject({ potassiumMmolL: 3.1, magnesiumMmolL: 0.62, rhythm: 'sinus' });
    if (path === 'noAction') expect(first.patient.observation).toBeNull();
    if (path === 'recovery') expect(findings(first.events).map(({ finding }) => finding).join(' ')).toMatch(/observed recurren/i);
    const snapshot = first.patient;
    first.engine.apply(choice(999999, 'reassess')); first.engine.step();
    expect(first.engine.equipment().resuscitation.renalHypokalemia).toEqual(snapshot);
  });

  it.each(['potassium', 'magnesium'] as const)('allows independent %s care and partial response without support or review clicks', (action) => {
    const result = run([[0, action], [PARTIAL, 'reassess']], PARTIAL);
    expect(result.patient).toMatchObject({ supportActive: false, contextReviewedAtTick: null, lossManagementAtTick: null,
      observation: { potassiumMmolL: action === 'potassium' ? 2.7 : 2.3, magnesiumMmolL: action === 'magnesium' ? 0.58 : 0.40 },
      responseObserved: false });
    expect(result.frames.get(PARTIAL)?.equipment.rhythmId).toBe('hypokalemic-repolarization');
  });

  it('changes the qualitative ECG after combined care and recurrence without exposing unrequested electrolytes', () => {
    const result = run([[0, 'potassium'], [0, 'magnesium'], [PARTIAL, 'reassess']], RECURRENCE,
      { checkpoints: [RESPONSE - 1, RESPONSE, RECURRENCE - 1] });
    expect(result.frames.get(RESPONSE - 1)?.equipment.rhythmId).toBe('hypokalemic-repolarization');
    expect(result.frames.get(RESPONSE)?.equipment.rhythmId).toBe('sinus');
    expect(result.frames.get(RECURRENCE - 1)?.equipment.rhythmId).toBe('sinus');
    expect(result.frames.get(RECURRENCE)?.equipment.rhythmId).toBe('hypokalemic-repolarization');
    expect(result.patient).toMatchObject({ observation: { atTick: PARTIAL, potassiumMmolL: 2.7, magnesiumMmolL: 0.58 },
      responseObserved: false, recurrenceObserved: false });
    expect(JSON.stringify(result.patient)).not.toMatch(/"magnesiumMmolL":0\.46|"potassiumMmolL":2\.5/);
    expect(result.events.filter(({ tick }) => tick >= RESPONSE).map(({ message }) => message).join(' ')).not.toMatch(/0\.46|potassium 2\.5/);
    result.engine.apply(choice(RECURRENCE + 1, 'reassess'));
    expect(result.engine.equipment().resuscitation.renalHypokalemia).toMatchObject({ recurrenceObserved: true,
      observation: { atTick: RECURRENCE + 1, potassiumMmolL: 2.5, magnesiumMmolL: 0.46 } });
  });

  it('preserves older magnesium and full-assessment age after newer potassium-only and ECG-only checks', () => {
    const result = run([[0, 'reassess'], [0, 'potassium'], [0, 'magnesium'], [0, 'manage-losses'],
      [RESPONSE, 'check-potassium'], [RESPONSE, 'check-ecg']], RESPONSE);
    expect(result.patient).toMatchObject({ observation: { atTick: 0, potassiumMmolL: 2.3, magnesiumMmolL: 0.40 },
      potassiumObservation: { atTick: RESPONSE, potassiumMmolL: 3.1 },
      ecgObservation: { atTick: RESPONSE, rhythm: 'sinus' }, responseObserved: false });
    expect(findings(result.events).find(({ objectiveId }) => objectiveId === 'renal-hypokalemia-reassessment')?.outcome).toBe('not-met');
  });

  it.each(['potassium', 'magnesium'] as const)('requires %s before full observation in event order even at one tick', (care) => {
    for (const careFirst of [false, true]) {
      const earlier = care === 'potassium' ? 'magnesium' : 'potassium';
      const actions: Choices = [[0, earlier], [0, 'monitor'],
        ...(careFirst ? [[PARTIAL, care], [PARTIAL, 'reassess']] : [[PARTIAL, 'reassess'], [PARTIAL, care]]) as Choices];
      const result = run(actions, PARTIAL);
      expect(findings(result.events).slice(0, 2).map(({ outcome }) => outcome))
        .toEqual(careFirst ? ['met', 'met'] : care === 'potassium' ? ['not-met', 'met'] : ['met', 'not-met']);
    }
  });

  it('rejects malformed, accessor, symbol, inherited, and generic payloads without invoking getters', () => {
    const engine = create(); engine.step(); const before = engine.equipment().resuscitation.renalHypokalemia!;
    const getter = vi.fn(() => 'potassium');
    for (const payload of [{ action: 'potassium', dose: 100 }, { action: 'potassium', [Symbol('private')]: 1 },
      Object.defineProperty({}, 'action', { enumerable: true, get: getter }),
      Object.defineProperty({}, 'action', { value: 'potassium' }), Object.create({ action: 'potassium' }) as object,
      { action: 'unknown' }]) {
      engine.apply({ tick: 0, type: 'renal-hypokalemia-response', payload: payload as LearnerAction['payload'] });
      const { choiceFeedback: _beforeFeedback, ...initial } = before;
      const { choiceFeedback: _afterFeedback, ...after } = engine.equipment().resuscitation.renalHypokalemia!;
      expect(after).toEqual(initial);
    }
    expect(getter).not.toHaveBeenCalled();
    for (const type of ['set-ventilator', 'bolus', 'renal-hyperkalemia-response'] as const) {
      engine.apply({ tick: 0, type, payload: { action: 'calcium', fio2: 1, dose: 100 } });
    }
    expect(engine.equipment().resuscitation.renalHypokalemia).toMatchObject({ potassiumAtTick: null,
      magnesiumAtTick: null, lossManagementAtTick: null, observation: null });
    engine.apply(choice(999999, 'potassium'));
    expect(engine.equipment().resuscitation.renalHypokalemia?.potassiumAtTick).toBe(1);
  });

  it('does not activate or score a lookalike identity and leaves the adjacent renal lesson unchanged', () => {
    const lookalike = { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'lookalike-hypokalemia' } };
    const evidence = run([[0, 'potassium'], [0, 'magnesium'], [0, 'monitor'], [0, 'reassess']], 0).events;
    expect(objectiveFindings(lookalike, [], 0, 0, [], evidence).map(({ outcome }) => outcome)).toEqual(Array(5).fill('not-exercised'));
    for (const scenario of [lookalike, { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }, ADJACENT]) {
      const engine = new AnesthesiaEngine({ scenario, seed: FIXTURES.seed, practiceRegion: 'US' });
      expect(engine.step().equipment.resuscitation.renalHypokalemia).toBeUndefined();
      const before = engine.equipment().resuscitation.renalHyperkalemia;
      engine.apply(choice(0, 'potassium'));
      expect(engine.equipment().resuscitation.renalHyperkalemia).toEqual(before);
    }
  });
});
