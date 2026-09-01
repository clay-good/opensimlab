import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hyperkalemia-cardioprotection-and-rebound';
import { RENAL_HYPERKALEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hyperkalemia-fixtures';
import { RENAL_HYPERKALEMIA_CALCIUM_TICKS as CALCIUM, RENAL_HYPERKALEMIA_SHIFT_TICKS as SHIFT,
  RENAL_HYPERKALEMIA_REMOVAL_TICKS as REMOVAL, RENAL_HYPERKALEMIA_REBOUND_TICKS as REBOUND,
  RENAL_HYPERKALEMIA_TAKEOVER_TICKS as STOP, type RenalHyperkalemiaAction } from '../../src/modules/renal-electrolyte/hyperkalemia';
import { renalHyperkalemiaCompletionEvidence } from '../../src/modules/renal-electrolyte/hyperkalemia-completion';
import { renalHyperkalemiaInlinePrompt } from '../../src/modules/renal-electrolyte/renal-hyperkalemia-tutor';
import { HYPERKALEMIA_WITH_ECG_CHANGE as EM_SCENARIO } from '../../src/modules/emergency-medicine/scenarios/hyperkalemia-with-ecg-change';

type Choices = readonly (readonly [number, RenalHyperkalemiaAction])[];
type Frame = ReturnType<AnesthesiaEngine['step']>;
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: RenalHyperkalemiaAction): LearnerAction => ({ tick, type: 'renal-hyperkalemia-response', payload: { action } });
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
    // Include all engine fields and waveform samples, not only the observed final potassium.
    if (options.hash) hash.update(JSON.stringify(frame));
    if (capture.has(tick) || tick % 600 === 0) {
      const before = JSON.stringify(frame);
      const prompt = renalHyperkalemiaInlinePrompt(options.level ?? 'unassisted', {
        scenarioVersion: SCENARIO.metadata.version, renalHyperkalemia: frame.equipment.resuscitation.renalHyperkalemia,
      });
      if (prompt) prompts.add(prompt.id);
      expect(JSON.stringify(frame)).toBe(before);
    }
    if (capture.has(tick)) frames.set(tick, frame);
  }
  expect(next).toBe(actions.length);
  return { engine, events, frames, prompts, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.renalHyperkalemia! };
}

describe('Renal hyperkalemia through the real engine and event-bound debrief', () => {
  it('binds exact preview content and capability without upgrading outstanding validation', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview', estimatedMinutes: 60 });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES).toMatchObject({ scenarioId: SCENARIO.metadata.id, contentVersion: '0.1.0', seed: 4941 });
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'renal-electrolyte', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(renalHyperkalemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'renal-electrolyte')).toHaveLength(9);
    expect(renalHyperkalemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(renalHyperkalemiaCompletionEvidence(SCENARIO, 'changed', 'renal-electrolyte')).toEqual([]);
    for (const changed of [{ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } },
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 79 } }]) {
      expect(renalHyperkalemiaCompletionEvidence(changed, ENGINE_VERSION, 'renal-electrolyte')).toEqual([]);
    }
    const frame = create().step();
    expect(frame.state).toMatchObject({ systolicMmHg: 110, diastolicMmHg: 64, meanArterialMmHg: 79,
      heartRateBpm: 48, respiratoryRateBpm: 18, spo2Percent: 98, coreTemperatureC: 36.7 });
    expect(frame.equipment.rhythmId).toBe('hyperkalemic-conduction');
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining(['etco2MmHg', 'fio2']));
    expect(frame.equipment.resuscitation.renalHyperkalemia).toMatchObject({ observation: null,
      ecgObservation: null, glucoseObservation: null, durableRecoveryProven: false, doseModelAvailable: false });
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across all three guidance levels', (path) => {
    const actions: Choices = FIXTURES[path]; const corrected = path === 'expert' || path === 'recovery';
    const until = corrected ? actions.at(-1)![0] + 1 : STOP + 1;
    const first = run(actions, until, { level: 'guided', hash: true });
    for (const level of ['coached', 'unassisted'] as const) {
      const other = run(actions, until, { level, hash: true });
      expect(other.hash).toBe(first.hash); expect(other.patient).toEqual(first.patient);
      if (level === 'unassisted') expect(other.prompts.size).toBe(0);
      else expect(other.prompts.size).toBeGreaterThan(0);
    }
    expect(first.prompts.size).toBeGreaterThan(0);
    expect(first.patient).toMatchObject({ ended: corrected ? 'handoff' : 'instructor-takeover',
      shiftResponseObserved: corrected, removalResponseObserved: corrected, reboundObserved: path === 'recovery',
      ecgResolvedAttempted: path === 'commonError' || path === 'recovery',
      glucoseMonitoringStopAttempted: path === 'commonError' || path === 'recovery', durableRecoveryProven: false });
    expect(findings(first.events).map(({ outcome }) => outcome)).toEqual(corrected ? Array(5).fill('met')
      : path === 'commonError' ? ['met', 'not-met', 'not-met', 'not-met', 'not-met'] : Array(5).fill('not-met'));
    if (corrected) expect(first.patient.observation).toMatchObject({ potassiumMmolL: 5.1, glucoseMgDl: 100, rhythm: 'sinus' });
    else expect(first.patient.observation).toBeNull();
    if (path === 'recovery') expect(findings(first.events).map(({ finding }) => finding).join(' '))
      .toContain('Earlier observed rebound remains part of this run');
    const snapshot = first.patient;
    first.engine.apply(choice(999999, 'reassess')); first.engine.step();
    expect(first.engine.equipment().resuscitation.renalHyperkalemia).toEqual(snapshot);
  });

  it('renders temporary calcium protection in the live rhythm without inventing potassium lowering', () => {
    const result = run([[0, 'calcium'], [0, 'reassess'], [CALCIUM, 'check-ecg']], CALCIUM,
      { checkpoints: [CALCIUM - 1] });
    expect(result.frames.get(0)?.equipment.rhythmId).toBe('sinus');
    expect(result.frames.get(CALCIUM - 1)?.equipment.rhythmId).toBe('sinus');
    expect(result.frames.get(CALCIUM)?.equipment.rhythmId).toBe('hyperkalemic-conduction');
    expect(result.patient).toMatchObject({ observation: { atTick: 0, potassiumMmolL: 6.9, rhythm: 'sinus' },
      ecgObservation: { atTick: CALCIUM, rhythm: 'hyperkalemic-conduction' }, calciumRequests: 1 });
    result.engine.apply(choice(999999, 'calcium'));
    expect(result.engine.equipment().rhythmId).toBe('sinus');
    expect(result.engine.equipment().resuscitation.renalHyperkalemia).toMatchObject({ calciumRequests: 2,
      lastCalciumAtTick: CALCIUM + 1, observation: result.patient.observation });
  });

  it('keeps partial observations historical and planning separate from actual elimination through rebound', () => {
    const result = run([[0, 'calcium'], [0, 'shift'], [0, 'plan-removal'], [0, 'monitor'],
      [SHIFT, 'reassess'], [REBOUND, 'check-glucose'], [REBOUND, 'check-ecg']], REBOUND);
    expect(result.patient).toMatchObject({ removalPlanAtTick: 0, removalAtTick: null, reboundObserved: false,
      observation: { atTick: SHIFT, potassiumMmolL: 5.6, glucoseMgDl: 104, rhythm: 'sinus' },
      glucoseObservation: { atTick: REBOUND, glucoseMgDl: 104 },
      ecgObservation: { atTick: REBOUND, rhythm: 'hyperkalemic-conduction' } });
    expect(JSON.stringify(result.patient)).not.toContain('6.6');
    expect(result.events.filter(({ tick }) => tick === REBOUND).map(({ message }) => message).join(' ')).not.toContain('6.6');
    result.engine.apply(choice(REBOUND + 1, 'reassess'));
    expect(result.engine.equipment().resuscitation.renalHyperkalemia).toMatchObject({ reboundObserved: true,
      observation: { atTick: REBOUND + 1, potassiumMmolL: 6.6 } });
  });

  it('accepts qualified delivered removal independently of administrative acknowledgments and shifting', () => {
    const result = run([[0, 'deliver-removal'], [REMOVAL, 'reassess']], REMOVAL);
    expect(result.patient).toMatchObject({ supportActive: false, contextReviewedAtTick: null, removalPlanAtTick: null,
      calciumAtTick: null, shiftAtTick: null, removalAtTick: 0, removalResponseObserved: true,
      observation: { potassiumMmolL: 5.1, glucoseMgDl: 100 } });
    expect(findings(result.events).map(({ outcome }) => outcome)).toEqual(['not-met', 'not-met', 'not-met', 'met', 'not-met']);
  });

  it('requires assessment after care in event order even when both actions share one engine tick', () => {
    const result = run([[0, 'deliver-removal'], [0, 'monitor'], [REMOVAL, 'reassess'],
      [REMOVAL, 'calcium'], [REMOVAL, 'shift']], REMOVAL);
    expect(findings(result.events).slice(0, 2).map(({ outcome }) => outcome)).toEqual(['not-met', 'not-met']);
    // These same-tick actions preserve order: calcium, shifting, then a new full assessment.
    const engine = create(); const events: EngineEvent[] = [];
    for (let tick = 0; tick < REMOVAL; tick += 1) {
      if (tick === 0) { engine.apply(choice(tick, 'deliver-removal')); engine.apply(choice(tick, 'monitor')); }
      events.push(...engine.step().events);
    }
    for (const action of ['calcium', 'shift', 'reassess'] as const) engine.apply(choice(REMOVAL, action));
    events.push(...engine.step().events);
    expect(findings(events).slice(0, 2).map(({ outcome }) => outcome)).toEqual(['met', 'met']);
  });

  it('rejects generic, adjacent, extra-field, symbol, and accessor payloads without invoking getters', () => {
    const engine = create(); engine.step(); const before = engine.equipment().resuscitation.renalHyperkalemia;
    const getter = vi.fn(() => 'calcium');
    const accessor = Object.defineProperty({}, 'action', { enumerable: true, get: getter });
    const nonenumerable = Object.defineProperty({}, 'action', { value: 'calcium' });
    const inherited = Object.create({ action: 'calcium' }) as Record<string, unknown>;
    for (const payload of [{ action: 'calcium', dose: 100 }, { action: 'calcium', [Symbol('private')]: true },
      accessor, nonenumerable, inherited, { action: 'unknown-choice' }]) {
      engine.apply({ tick: 0, type: 'renal-hyperkalemia-response', payload });
      const { choiceFeedback: _feedback, ...after } = engine.equipment().resuscitation.renalHyperkalemia!;
      const { choiceFeedback: _initialFeedback, ...initial } = before!;
      expect(after).toEqual(initial);
    }
    // Unknown choices may produce bounded feedback, but no treatment or observation is accepted.
    expect(getter).not.toHaveBeenCalled();
    for (const type of ['set-ventilator', 'bolus', 'hyperkalemia-response'] as const) {
      engine.apply({ tick: 0, type, payload: { action: 'record-hyperkalemia-calcium-intent', fio2: 1, dose: 100 } });
    }
    expect(engine.equipment().resuscitation.renalHyperkalemia).toMatchObject({ calciumAtTick: null, shiftAtTick: null,
      removalAtTick: null, observation: null, ecgObservation: null, glucoseObservation: null });
    engine.apply(choice(999999, 'calcium'));
    expect(engine.equipment().resuscitation.renalHyperkalemia?.calciumAtTick).toBe(1);
  });

  it('leaves the adjacent emergency-medicine pathway active and rejects renal actions there', () => {
    const engine = new AnesthesiaEngine({ scenario: EM_SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    expect(engine.step().equipment.resuscitation.renalHyperkalemia).toBeUndefined();
    const before = engine.equipment().resuscitation.hyperkalemiaAssessment;
    engine.apply(choice(0, 'calcium'));
    expect(engine.equipment().resuscitation.hyperkalemiaAssessment).toEqual(before);
    engine.apply({ tick: 0, type: 'hyperkalemia-response', payload: { action: 'review-hyperkalemia-pattern' } });
    expect(engine.equipment().resuscitation.hyperkalemiaAssessment?.patternReviewedAtTick).toBe(1);
    expect(engine.equipment().resuscitation.renalHyperkalemia).toBeUndefined();
  });

  it('runs the declared GB pathway without claiming completion of a regional validation matrix', () => {
    expect(run(FIXTURES.expert, FIXTURES.expert.at(-1)![0], { region: 'GB' }).patient.ended).toBe('handoff');
  });
});
