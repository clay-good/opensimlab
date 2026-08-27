import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RENAL_HYPONATREMIA_SYMPTOMS_AND_REASSESSMENT as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hyponatremia-symptoms-and-reassessment';
import { RENAL_HYPONATREMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hyponatremia-fixtures';
import { RENAL_HYPONATREMIA_RESCUE_TICKS as RESPONSE,
  RENAL_HYPONATREMIA_ADDITIONAL_RESCUE_TICKS as ADDITIONAL,
  RENAL_HYPONATREMIA_TAKEOVER_TICKS as STOP,
  type RenalHyponatremiaAction } from '../../src/modules/renal-electrolyte/hyponatremia';
import { renalHyponatremiaCompletionEvidence } from '../../src/modules/renal-electrolyte/hyponatremia-completion';
import { renalHyponatremiaInlinePrompt } from '../../src/modules/renal-electrolyte/renal-hyponatremia-tutor';
import { RENAL_HYPOKALEMIA_MAGNESIUM_AND_ONGOING_LOSSES as ADJACENT } from '../../src/modules/renal-electrolyte/scenarios/hypokalemia-magnesium-and-ongoing-losses';

type Choices = readonly (readonly [number, RenalHyponatremiaAction])[];
type Frame = ReturnType<AnesthesiaEngine['step']>;
const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const choice = (tick: number, action: RenalHyponatremiaAction): LearnerAction => ({ tick, type: 'renal-hyponatremia-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);
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
    // Hash every state field and waveform sample, not a reduced endpoint projection.
    if (options.hash) hash.update(JSON.stringify(frame));
    if (capture.has(tick) || tick % 600 === 0) {
      const before = JSON.stringify(frame);
      const prompt = renalHyponatremiaInlinePrompt(options.level ?? 'unassisted', {
        scenarioVersion: SCENARIO.metadata.version, renalHyponatremia: frame.equipment.resuscitation.renalHyponatremia,
      });
      if (prompt) prompts.add(prompt.id);
      expect(JSON.stringify(frame)).toBe(before);
    }
    if (capture.has(tick)) frames.set(tick, frame);
  }
  expect(next).toBe(actions.length);
  return { engine, events, frames, prompts, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.renalHyponatremia! };
}

describe('Renal hyponatremia through the real engine and event-bound debrief', () => {
  it('binds exact preview evidence without upgrading clinical, inclusive, or production validation', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview', estimatedMinutes: 90 });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES).toMatchObject({ scenarioId: SCENARIO.metadata.id, contentVersion: '0.1.0', seed: 4961 });
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'renal-electrolyte', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(renalHyponatremiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'renal-electrolyte')).toHaveLength(9);
    expect(renalHyponatremiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(renalHyponatremiaCompletionEvidence(SCENARIO, 'changed', 'renal-electrolyte')).toEqual([]);
    for (const changed of [{ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } },
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 59 } }]) {
      expect(renalHyponatremiaCompletionEvidence(changed, ENGINE_VERSION, 'renal-electrolyte')).toEqual([]);
    }
    const frame = create().step();
    expect(frame.state).toMatchObject({ systolicMmHg: 132, diastolicMmHg: 78, meanArterialMmHg: 96,
      heartRateBpm: 92, respiratoryRateBpm: 18, spo2Percent: 98, coreTemperatureC: 36.7 });
    expect(frame.equipment.rhythmId).toBe('sinus');
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining(['etco2MmHg', 'fio2']));
    expect(frame.equipment.resuscitation.renalHyponatremia).toMatchObject({ observation: null,
      sodiumObservation: null, neurologicObservation: null, durableRecoveryProven: false, doseModelAvailable: false });
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
      initialResponseObserved: complete, additionalResponseObserved: complete, persistentSymptomsObserved: complete,
      sodiumNormalizationAttempted: path === 'commonError' || path === 'recovery',
      numberOnlyRecoveryAttempted: path === 'commonError' || path === 'recovery',
      siadhLabelAttempted: path === 'commonError' || path === 'recovery', durableRecoveryProven: false });
    expect(findings(first.events).map(({ outcome }) => outcome)).toEqual(Array(5).fill(complete ? 'met' : 'not-met'));
    if (complete) {
      expect(first.patient.observation).toMatchObject({ sodiumMmolL: 124, changeFromBaselineMmolL: 6,
        alertness: 'awake but confused', headache: true, nausea: true });
      expect(first.events.find(({ eventId }) => eventId === `renal-hyponatremia-handoff-${actions.at(-1)![0]}`)?.message)
        .toContain('not a clinical stopping rule');
    }
    if (path === 'noAction') expect(first.patient.observation).toBeNull();
    const snapshot = first.patient;
    first.engine.apply(choice(999999, 'reassess')); first.engine.step();
    expect(first.engine.equipment().resuscitation.renalHyponatremia).toEqual(snapshot);
  }, 120000);

  it('allows rescue and neurologic investigation independently while not inventing observations or new baseline labs', () => {
    const result = run([[0, 'rescue'], [0, 'evaluate-neurology']], RESPONSE,
      { checkpoints: [RESPONSE - 1] });
    expect(result.patient).toMatchObject({ rescueAtTick: 0, neurologicReviewAtTick: 0, supportActive: false,
      contextReviewedAtTick: null, monitoringAtTick: null, observation: null, sodiumObservation: null,
      neurologicObservation: null, initialResponseObserved: false, persistentSymptomsObserved: false });
    expect(result.frames.get(RESPONSE - 1)?.state.heartRateBpm).toBe(92);
    expect(result.frames.get(RESPONSE)?.state.heartRateBpm).toBe(88);
    expect(result.frames.get(RESPONSE)?.equipment.rhythmId).toBe('sinus');
    expect(JSON.stringify(result.patient)).not.toMatch(/sodiumMmolL|osmolality|potassiumMmolL|glucoseMgDl|123|124/);
    expect(result.events.filter(({ tick }) => tick > 0).map(({ message }) => message).join(' ')).not.toMatch(/123|124|460|250/);
    expect(findings(result.events).find(({ objectiveId }) => objectiveId === 'renal-hyponatremia-reassessment')?.outcome).toBe('not-met');
  }, 120000);

  it('does not combine newer sodium-only and neurologic-only checks into a full response or additional-rescue permission', () => {
    const result = run([[0, 'reassess'], [0, 'rescue'], [RESPONSE, 'check-sodium'],
      [RESPONSE + 1, 'check-neurology'], [RESPONSE + 2, 'additional-rescue']], RESPONSE + 2);
    expect(result.patient).toMatchObject({ observation: { atTick: 0, sodiumMmolL: 118 },
      sodiumObservation: { atTick: RESPONSE, sodiumMmolL: 123 },
      neurologicObservation: { atTick: RESPONSE + 1, alertness: 'awake but confused' },
      additionalRescueAtTick: null, initialResponseObserved: false, persistentSymptomsObserved: false });
    expect(findings(result.events).find(({ objectiveId }) => objectiveId === 'renal-hyponatremia-reassessment')?.outcome).toBe('not-met');
    expect(result.events.some(({ eventId }) => eventId === `renal-hyponatremia-additional-rescue-refused-${RESPONSE + 2}`)).toBe(true);
  }, 120000);

  it('requires fresh full later findings rather than a newer sodium or neurologic panel for unresolved handoff', () => {
    const final = RESPONSE + ADDITIONAL;
    const result = run([[0, 'rescue'], [0, 'call-support'], [0, 'monitor'], [0, 'review-context'],
      [0, 'evaluate-neurology'], [RESPONSE, 'reassess'], [RESPONSE, 'additional-rescue'],
      [final, 'check-sodium'], [final, 'check-neurology'], [final, 'handoff']], final,
    { checkpoints: [final - 2, final - 1] });
    expect(result.frames.get(final - 2)?.equipment.resuscitation.renalHyponatremia?.additionalRescueDueInSeconds).toBe(1);
    // Equipment uses the next clock tick; zero remains pending until the model advances the boundary.
    expect(result.frames.get(final - 1)?.equipment.resuscitation.renalHyponatremia?.additionalRescueDueInSeconds).toBe(0);
    expect(result.patient).toMatchObject({ ended: null, additionalRescueDueInSeconds: null,
      observation: { atTick: RESPONSE, sodiumMmolL: 123 },
      sodiumObservation: { atTick: final, sodiumMmolL: 124 }, neurologicObservation: { atTick: final },
      initialResponseObserved: true, additionalResponseObserved: false });
    result.engine.apply(choice(final + 1, 'reassess')); result.engine.apply(choice(final + 1, 'handoff'));
    expect(result.engine.equipment().resuscitation.renalHyponatremia).toMatchObject({ ended: 'handoff',
      additionalResponseObserved: true, observation: { sodiumMmolL: 124, headache: true, nausea: true }, durableRecoveryProven: false });
  }, 120000);

  it('uses actual care then full-assessment log order even when both events share a tick', () => {
    const events = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0]).events;
    const event = (id: string) => events.find(({ eventId }) => new RegExp(`^renal-hyponatremia-${id}-\\d+$`).test(eventId))!;
    for (const [careId, assessmentId, objectiveId] of [
      ['rescue', 'persistent-symptoms-reassessment', 'renal-hyponatremia-rescue'],
      ['additional-rescue', 'additional-response-reassessment', 'renal-hyponatremia-persistent'],
    ] as const) {
      const full = event(assessmentId);
      // Reorder genuine event evidence at one timestamp to exercise imported-log chronology.
      const care = { ...event(careId), tick: full.tick, eventId: `renal-hyponatremia-${careId}-${full.tick}` };
      const prerequisites = [event('monitoring'), event('neurologic-review')];
      for (const careFirst of [false, true]) {
        const ordered = [...prerequisites, ...(careFirst ? [care, full] : [full, care])];
        expect(findings(ordered).find((finding) => finding.objectiveId === objectiveId)?.outcome)
          .toBe(careFirst ? 'met' : 'not-met');
      }
      expect(findings([...prerequisites, { ...care, tick: full.tick + 1 }, full])
        .find((finding) => finding.objectiveId === objectiveId)?.outcome).toBe('not-met');
    }
  }, 120000);

  it('does not credit additional rescue from a full reassessment while its response is still pending', () => {
    const early = RESPONSE + 3; const late = RESPONSE + 1 + ADDITIONAL;
    const result = run([[0, 'rescue'], [0, 'call-support'], [0, 'review-context'], [0, 'monitor'],
      [RESPONSE, 'reassess'], [RESPONSE + 1, 'additional-rescue'], [RESPONSE + 2, 'evaluate-neurology'],
      [early, 'reassess'], [late, 'reassess']], late);
    const pending = result.frames.get(early)!.equipment.resuscitation.renalHyponatremia!;
    expect(pending).toMatchObject({ observation: { atTick: early, sodiumMmolL: 123 },
      initialResponseObserved: true, additionalResponseObserved: false });
    expect(pending.additionalRescueDueInSeconds).toBeGreaterThan(0);
    expect(findings(result.events.filter(({ tick }) => tick <= early))
      .find(({ objectiveId }) => objectiveId === 'renal-hyponatremia-persistent')?.outcome).toBe('not-met');
    expect(result.patient).toMatchObject({ observation: { atTick: late, sodiumMmolL: 124 },
      additionalResponseObserved: true, additionalRescueDueInSeconds: null });
    expect(findings(result.events).find(({ objectiveId }) => objectiveId === 'renal-hyponatremia-persistent')?.outcome).toBe('met');
  }, 120000);

  it('rejects malformed and generic actions without invoking payload getters or trusting caller ticks', () => {
    const engine = create(); engine.step(); const before = engine.equipment().resuscitation.renalHyponatremia!;
    const getter = vi.fn(() => 'rescue');
    for (const payload of [{ action: 'rescue', dose: 100 }, { action: 'rescue', [Symbol('private')]: 1 },
      Object.defineProperty({}, 'action', { enumerable: true, get: getter }),
      Object.defineProperty({}, 'action', { value: 'rescue' }), Object.create({ action: 'rescue' }) as object,
      { action: 'unknown' }]) {
      engine.apply({ tick: 0, type: 'renal-hyponatremia-response', payload: payload as LearnerAction['payload'] });
      const { choiceFeedback: _beforeFeedback, ...initial } = before;
      const { choiceFeedback: _afterFeedback, ...after } = engine.equipment().resuscitation.renalHyponatremia!;
      expect(after).toEqual(initial);
    }
    expect(getter).not.toHaveBeenCalled();
    const equipmentBeforeGeneric = engine.equipment();
    for (const type of ['set-ventilator', 'bolus', 'renal-hypokalemia-response'] as const) {
      engine.apply({ tick: 0, type, payload: { action: 'potassium', fio2: 1, dose: 100 } });
    }
    expect(engine.equipment()).toEqual(equipmentBeforeGeneric);
    expect(engine.equipment().resuscitation.renalHyponatremia).toMatchObject({ rescueAtTick: null, observation: null });
    engine.apply(choice(999999, 'rescue'));
    expect(engine.equipment().resuscitation.renalHyponatremia?.rescueAtTick).toBe(1);
  });

  it('does not activate or score a lookalike identity and leaves the adjacent renal lesson unchanged', () => {
    const lookalike = { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'lookalike-hyponatremia' } };
    const evidence = run([[0, 'rescue'], [0, 'monitor'], [0, 'reassess']], 0).events;
    expect(objectiveFindings(lookalike, [], 0, 0, [], evidence).map(({ outcome }) => outcome)).toEqual(Array(5).fill('not-exercised'));
    for (const scenario of [lookalike, { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }, ADJACENT]) {
      const engine = new AnesthesiaEngine({ scenario, seed: FIXTURES.seed, practiceRegion: 'US' });
      expect(engine.step().equipment.resuscitation.renalHyponatremia).toBeUndefined();
      const before = engine.equipment().resuscitation.renalHypokalemia;
      engine.apply(choice(0, 'rescue'));
      expect(engine.equipment().resuscitation.renalHypokalemia).toEqual(before);
    }
  });
});
