import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RENAL_HYPOCALCEMIA_IONIZED_CALCIUM_AND_CKD as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypocalcemia-ionized-calcium-and-ckd';
import { RENAL_HYPOCALCEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypocalcemia-fixtures';
import { RENAL_HYPOCALCEMIA_RESCUE_TICKS as RESCUE, RENAL_HYPOCALCEMIA_CONTINUING_TICKS as CONTINUING,
  RENAL_HYPOCALCEMIA_RECURRENCE_TICKS as RECURRENCE, RENAL_HYPOCALCEMIA_TAKEOVER_TICKS as STOP,
  type RenalHypocalcemiaAction } from '../../src/modules/renal-electrolyte/hypocalcemia';
import { renalHypocalcemiaCompletionEvidence } from '../../src/modules/renal-electrolyte/hypocalcemia-completion';
import { renalHypocalcemiaInlinePrompt } from '../../src/modules/renal-electrolyte/renal-hypocalcemia-tutor';
import { HYPOCALCEMIC_TETANY_RESCUE_AND_RECURRENCE as ADJACENT } from '../../src/modules/endocrine-metabolic/scenarios/hypocalcemic-tetany-rescue-and-recurrence';

type Choices = readonly (readonly [number, RenalHypocalcemiaAction])[];
type Frame = ReturnType<AnesthesiaEngine['step']>;
const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const choice = (tick: number, action: RenalHypocalcemiaAction): LearnerAction => ({ tick, type: 'renal-hypocalcemia-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);
const ownership: Choices = [[0, 'call-support'], [0, 'review-context'], [0, 'monitor'],
  [0, 'coordinate-mineral-care'], [0, 'arrange-follow-up']];
function run(actions: Choices, until: number, options: {
  level?: GuidanceLevel; hash?: boolean; checkpoints?: readonly number[];
} = {}) {
  const engine = create(); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  const frames = new Map<number, Frame>(); const prompts = new Set<string>();
  const capture = new Set([0, until, ...actions.map(([tick]) => tick), ...(options.checkpoints ?? [])]);
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    // Every solver field and waveform sample participates, not only the lesson snapshot.
    if (options.hash) hash.update(JSON.stringify(frame));
    if (capture.has(tick) || tick % 600 === 0) {
      const before = JSON.stringify(frame);
      const prompt = renalHypocalcemiaInlinePrompt(options.level ?? 'unassisted', {
        scenarioVersion: SCENARIO.metadata.version, renalHypocalcemia: frame.equipment.resuscitation.renalHypocalcemia,
      });
      if (prompt) prompts.add(prompt.id);
      expect(JSON.stringify(frame)).toBe(before);
    }
    if (capture.has(tick)) frames.set(tick, frame);
  }
  expect(next).toBe(actions.length);
  return { engine, events, frames, prompts, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.renalHypocalcemia! };
}

describe('Renal hypocalcemia through the real engine and event-bound debrief', () => {
  it('binds exact preview evidence without upgrading clinical, inclusive, or production validation', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview', estimatedMinutes: 60 });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES).toMatchObject({ scenarioId: SCENARIO.metadata.id, contentVersion: '0.1.0', seed: 4987 });
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'renal-electrolyte', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(renalHypocalcemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'renal-electrolyte')).toHaveLength(9);
    expect(renalHypocalcemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(renalHypocalcemiaCompletionEvidence(SCENARIO, 'changed', 'renal-electrolyte')).toEqual([]);
    for (const changed of [{ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } },
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 63 } }]) {
      expect(renalHypocalcemiaCompletionEvidence(changed, ENGINE_VERSION, 'renal-electrolyte')).toEqual([]);
    }
    const frame = create().step();
    expect(frame.state).toMatchObject({ systolicMmHg: 138, diastolicMmHg: 78, meanArterialMmHg: 98,
      heartRateBpm: 102, respiratoryRateBpm: 22, spo2Percent: 98, coreTemperatureC: 36.8 });
    expect(frame.equipment.rhythmId).toBe('sinus');
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining(['etco2MmHg', 'fio2']));
    expect(frame.equipment.resuscitation.renalHypocalcemia).toMatchObject({ observation: null,
      ionizedObservation: null, symptomObservation: null, durableRecoveryProven: false, doseModelAvailable: false });
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across three guidance modes', (path) => {
    const actions: Choices = FIXTURES[path]; const complete = path === 'expert' || path === 'recovery';
    const until = complete ? actions.at(-1)![0] + 1 : STOP + 1;
    const first = run(actions, until, { level: 'guided', hash: true });
    for (const level of ['coached', 'unassisted'] as const) {
      const other = run(actions, until, { level, hash: true });
      expect(other.hash).toBe(first.hash); expect(other.patient).toEqual(first.patient);
      expect(other.prompts.size > 0).toBe(level !== 'unassisted');
    }
    expect(first.prompts.size).toBeGreaterThan(0);
    expect(first.patient).toMatchObject({ ended: complete ? 'handoff' : 'instructor-takeover',
      rescueResponseObserved: complete, continuingResponseObserved: complete, recurrenceObserved: path === 'recovery',
      durableRecoveryProven: false, adjustedReassuranceAttempted: path === 'commonError' || path === 'recovery',
      oralOnlyAttempted: path === 'commonError' || path === 'recovery',
      stoppedAfterReliefAttempted: path === 'commonError' || path === 'recovery' });
    expect(findings(first.events).map(({ outcome }) => outcome)).toEqual(Array(5).fill(complete ? 'met' : 'not-met'));
    if (complete) expect(first.patient.observation).toMatchObject({ ionizedCalciumMmolL: 1.03,
      carpopedalSpasm: false, perioralTingling: true, alertness: 'awake' });
    if (path === 'recovery') expect(findings(first.events).map(({ finding }) => finding).join(' ')).toContain('Earlier observed recurrence remains');
    if (path === 'commonError') expect(first.patient).toMatchObject({ rescueAtTick: null, continuingAtTick: null,
      observation: null, ionizedObservation: { atTick: RESCUE, ionizedCalciumMmolL: 0.86 } });
    if (path === 'noAction') expect(first.patient.observation).toBeNull();
    const snapshot = first.patient;
    first.engine.apply(choice(999999, 'reassess')); first.engine.step();
    expect(first.engine.equipment().resuscitation.renalHypocalcemia).toEqual(snapshot);
  }, 120000);

  it('permits same-tick rescue and continuing calcium without administration, mineral, or follow-up gates', () => {
    const originalScenario = JSON.stringify(SCENARIO);
    const result = run([[0, 'rescue-calcium'], [0, 'continue-calcium'], [CONTINUING, 'reassess']], CONTINUING,
      { checkpoints: [RESCUE - 1, RESCUE, CONTINUING - 1] });
    expect(result.frames.get(RESCUE - 1)?.state.heartRateBpm).toBe(102);
    expect(result.frames.get(RESCUE)?.state.heartRateBpm).toBe(90);
    expect(result.frames.get(CONTINUING - 1)?.equipment.resuscitation.renalHypocalcemia).toMatchObject({
      // Equipment is sampled at the next engine tick; zero means due, not a requested response.
      continuingDueInSeconds: 0, continuingResponseObserved: false,
      observation: null, ionizedObservation: null, symptomObservation: null });
    expect(result.patient).toMatchObject({ supportActive: false, contextReviewedAtTick: null, monitoringAtTick: null,
      mineralCareAtTick: null, followUpAtTick: null, continuingResponseObserved: true, rescueResponseObserved: false,
      observation: { ionizedCalciumMmolL: 1.03, carpopedalSpasm: false, perioralTingling: true }, ended: null });
    expect(result.events.filter(({ tick }) => tick > 0 && tick < CONTINUING).map(({ message }) => message).join(' '))
      .not.toMatch(/0\.96|0\.88|1\.03/);
    expect(Object.keys(result.patient.observation!).sort()).toEqual(['alertness', 'atTick', 'carpopedalSpasm',
      'coreTemperatureC', 'diastolicMmHg', 'heartRateBpm', 'ionizedCalciumMmolL', 'meanArterialMmHg',
      'perioralTingling', 'respiratoryRateBpm', 'spo2Percent', 'systolicMmHg'].sort());
    expect(JSON.stringify(SCENARIO)).toBe(originalScenario);
    expect(findings(result.events).map(({ outcome }) => outcome)).toEqual(['not-met', 'not-met', 'not-met', 'met', 'not-met']);
    for (const [, action] of ownership) result.engine.apply(choice(999999, action));
    result.engine.apply(choice(999999, 'handoff'));
    expect(result.engine.equipment().resuscitation.renalHypocalcemia?.ended).toBe('handoff');
  }, 120000);

  it('does not combine partial ionized and symptom checks into fresh full response or handoff evidence', () => {
    const result = run([...ownership, [0, 'rescue-calcium'], [0, 'continue-calcium'], [0, 'reassess'],
      [CONTINUING, 'check-ionized'], [CONTINUING + 1, 'check-symptoms'], [CONTINUING + 2, 'handoff']], CONTINUING + 2);
    expect(result.patient).toMatchObject({ observation: { atTick: 0, ionizedCalciumMmolL: 0.86, carpopedalSpasm: true },
      ionizedObservation: { atTick: CONTINUING, ionizedCalciumMmolL: 1.03 },
      symptomObservation: { atTick: CONTINUING + 1, carpopedalSpasm: false, perioralTingling: true },
      continuingResponseObserved: false, rescueResponseObserved: false, ended: null });
    expect(findings(result.events).map(({ outcome }) => outcome)).toEqual(['not-met', 'met', 'not-met', 'not-met', 'not-met']);
    result.engine.apply(choice(999999, 'reassess')); result.engine.apply(choice(999999, 'handoff'));
    expect(result.engine.equipment().resuscitation.renalHypocalcemia).toMatchObject({ ended: 'handoff',
      continuingResponseObserved: true, observation: { ionizedCalciumMmolL: 1.03 } });
  }, 120000);

  it('allows unresolved recurrence handoff while the delivered continuing-calcium response remains pending', () => {
    const result = run([...ownership, [0, 'rescue-calcium'], [RESCUE, 'reassess'],
      [RECURRENCE, 'check-ionized'], [RECURRENCE + 1, 'check-symptoms'], [RECURRENCE + 2, 'reassess'],
      [RECURRENCE + 3, 'continue-calcium'], [RECURRENCE + 4, 'reassess'], [RECURRENCE + 5, 'handoff']], RECURRENCE + 5,
    { checkpoints: [RECURRENCE - 1] });
    expect(result.frames.get(RECURRENCE - 1)?.equipment.resuscitation.renalHypocalcemia).toMatchObject({
      observation: { atTick: RESCUE, ionizedCalciumMmolL: 0.96 }, recurrenceObserved: false });
    expect(result.frames.get(RECURRENCE + 1)?.equipment.resuscitation.renalHypocalcemia).toMatchObject({
      observation: { atTick: RESCUE, ionizedCalciumMmolL: 0.96 }, ionizedObservation: { ionizedCalciumMmolL: 0.88 },
      symptomObservation: { carpopedalSpasm: true }, recurrenceObserved: false });
    expect(result.frames.get(RECURRENCE + 4)?.equipment.resuscitation.renalHypocalcemia?.continuingDueInSeconds).toBeGreaterThan(0);
    expect(result.patient).toMatchObject({ ended: 'handoff', recurrenceObserved: true, continuingResponseObserved: false,
      observation: { atTick: RECURRENCE + 4, ionizedCalciumMmolL: 0.88, carpopedalSpasm: true, perioralTingling: true } });
    expect(findings(result.events).map(({ outcome }) => outcome)).toEqual(['met', 'met', 'not-met', 'met', 'met']);
  }, 120000);

  it('requires care-before-full log order and a continuing-specific response even at the same tick', () => {
    const events = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0]).events;
    const event = (id: string) => events.find(({ eventId }) => new RegExp(`^renal-hypocalcemia-${id}-\\d+$`).test(eventId))!;
    for (const careId of ['calcium-rescue', 'calcium-continuation'] as const) {
      const full = event(careId === 'calcium-rescue' ? 'rescue-reassessment' : 'continuing-reassessment');
      const care = { ...event(careId), tick: full.tick, eventId: `renal-hypocalcemia-${careId}-${full.tick}` };
      const prerequisites = careId === 'calcium-rescue' ? [event('monitoring')] : [event('mineral-care'), event('follow-up')];
      const objectiveId = careId === 'calcium-rescue' ? 'renal-hypocalcemia-rescue' : 'renal-hypocalcemia-continuity';
      for (const careFirst of [false, true]) {
        expect(findings([...prerequisites, ...(careFirst ? [care, full] : [full, care])])
          .find((finding) => finding.objectiveId === objectiveId)?.outcome).toBe(careFirst ? 'met' : 'not-met');
      }
      expect(findings([...prerequisites, { ...care, tick: full.tick + 1 }, full])
        .find((finding) => finding.objectiveId === objectiveId)?.outcome).toBe('not-met');
    }
    for (const id of ['rescue-reassessment', 'recurrence-reassessment', 'ionized-check', 'symptom-check']) {
      const wrongPhase = { ...event('continuing-reassessment'), eventId: `renal-hypocalcemia-${id}-36001` };
      expect(findings([event('calcium-continuation'), event('mineral-care'), event('follow-up'), wrongPhase])
        .find(({ objectiveId }) => objectiveId === 'renal-hypocalcemia-continuity')?.outcome).toBe('not-met');
    }
  }, 120000);

  it('rejects malformed and generic actions without invoking getters or trusting caller ticks', () => {
    const engine = create(); engine.step(); const before = engine.equipment().resuscitation.renalHypocalcemia!;
    const getter = vi.fn(() => 'rescue-calcium');
    for (const payload of [{ action: 'rescue-calcium', dose: 100 }, { action: 'rescue-calcium', [Symbol('private')]: 1 },
      Object.defineProperty({}, 'action', { enumerable: true, get: getter }),
      Object.defineProperty({}, 'action', { value: 'rescue-calcium' }), Object.create({ action: 'rescue-calcium' }) as object,
      { action: 'unknown' }]) {
      engine.apply({ tick: 0, type: 'renal-hypocalcemia-response', payload: payload as LearnerAction['payload'] });
      const { choiceFeedback: _beforeFeedback, ...initial } = before;
      const { choiceFeedback: _afterFeedback, ...after } = engine.equipment().resuscitation.renalHypocalcemia!;
      expect(after).toEqual(initial);
    }
    expect(getter).not.toHaveBeenCalled();
    const equipmentBeforeGeneric = engine.equipment();
    for (const type of ['set-ventilator', 'bolus', 'hypocalcemia-response'] as const) {
      engine.apply({ tick: 0, type, payload: { action: 'calcium-rescue', fio2: 1, dose: 100 } });
    }
    expect(engine.equipment()).toEqual(equipmentBeforeGeneric);
    engine.apply(choice(999999, 'rescue-calcium'));
    expect(engine.equipment().resuscitation.renalHypocalcemia?.rescueAtTick).toBe(1);
  });

  it('does not activate or score lookalikes or interfere with the separate postoperative lesson', () => {
    const lookalike = { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'lookalike-hypocalcemia' } };
    const evidence: EngineEvent[] = [{ tick: 0, eventId: 'renal-hypocalcemia-handoff-0', message: 'Synthetic isolation probe',
      severity: 'info', category: 'renal-hypocalcemia' }];
    expect(objectiveFindings(lookalike, [], 0, 0, [], evidence).map(({ outcome }) => outcome)).toEqual(Array(5).fill('not-exercised'));
    for (const scenario of [lookalike, { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }, ADJACENT]) {
      const engine = new AnesthesiaEngine({ scenario, seed: FIXTURES.seed, practiceRegion: 'US' });
      expect(engine.step().equipment.resuscitation.renalHypocalcemia).toBeUndefined();
      const before = engine.equipment().resuscitation.hypocalcemia;
      engine.apply(choice(0, 'rescue-calcium'));
      expect(engine.equipment().resuscitation.hypocalcemia).toEqual(before);
    }
  });
});
