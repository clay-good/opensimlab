import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RENAL_HYPERNATREMIA_WATER_ACCESS_AND_LOSSES as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypernatremia-water-access-and-losses';
import { RENAL_HYPERNATREMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypernatremia-fixtures';
import { RENAL_HYPERNATREMIA_VOLUME_TICKS as VOLUME, RENAL_HYPERNATREMIA_WATER_TICKS as WATER,
  RENAL_HYPERNATREMIA_COMBINED_TICKS as COMBINED, RENAL_HYPERNATREMIA_RECURRENCE_TICKS as RECURRENCE,
  RENAL_HYPERNATREMIA_TAKEOVER_TICKS as STOP, type RenalHypernatremiaAction } from '../../src/modules/renal-electrolyte/hypernatremia';
import { renalHypernatremiaCompletionEvidence } from '../../src/modules/renal-electrolyte/hypernatremia-completion';
import { renalHypernatremiaInlinePrompt } from '../../src/modules/renal-electrolyte/renal-hypernatremia-tutor';
import { HYPERNATREMIC_DEHYDRATION_AVP_DEFICIENCY as ADJACENT } from '../../src/modules/endocrine-metabolic/scenarios/hypernatremic-dehydration-avp-deficiency';

type Choices = readonly (readonly [number, RenalHypernatremiaAction])[];
type Frame = ReturnType<AnesthesiaEngine['step']>;
const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const choice = (tick: number, action: RenalHypernatremiaAction): LearnerAction => ({ tick, type: 'renal-hypernatremia-response', payload: { action } });
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
    // Full-frame hashes include every solver field and waveform sample.
    if (options.hash) hash.update(JSON.stringify(frame));
    if (capture.has(tick) || tick % 600 === 0) {
      const before = JSON.stringify(frame);
      const prompt = renalHypernatremiaInlinePrompt(options.level ?? 'unassisted', {
        scenarioVersion: SCENARIO.metadata.version, renalHypernatremia: frame.equipment.resuscitation.renalHypernatremia,
      });
      if (prompt) prompts.add(prompt.id);
      expect(JSON.stringify(frame)).toBe(before);
    }
    if (capture.has(tick)) frames.set(tick, frame);
  }
  expect(next).toBe(actions.length);
  return { engine, events, frames, prompts, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.renalHypernatremia! };
}

describe('Renal hypernatremia through the real engine and event-bound debrief', () => {
  it('binds exact preview content without upgrading clinical, inclusive, or production validation', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview', estimatedMinutes: 255 });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES).toMatchObject({ scenarioId: SCENARIO.metadata.id, contentVersion: '0.1.0', seed: 4973 });
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'renal-electrolyte', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(renalHypernatremiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'renal-electrolyte')).toHaveLength(9);
    expect(renalHypernatremiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(renalHypernatremiaCompletionEvidence(SCENARIO, 'changed', 'renal-electrolyte')).toEqual([]);
    for (const changed of [{ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } },
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 63 } }]) {
      expect(renalHypernatremiaCompletionEvidence(changed, ENGINE_VERSION, 'renal-electrolyte')).toEqual([]);
    }
    const frame = create().step();
    expect(frame.state).toMatchObject({ systolicMmHg: 88, diastolicMmHg: 52, meanArterialMmHg: 64,
      heartRateBpm: 112, respiratoryRateBpm: 20, spo2Percent: 98, coreTemperatureC: 37.1 });
    expect(frame.equipment.rhythmId).toBe('sinus');
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining(['etco2MmHg', 'fio2']));
    expect(frame.equipment.resuscitation.renalHypernatremia).toMatchObject({ observation: null,
      sodiumObservation: null, fluidBalanceObservation: null, durableRecoveryProven: false, doseModelAvailable: false });
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
      volumeObserved: complete, combinedResponseObserved: complete, recurrenceObserved: path === 'recovery',
      waterResponseObserved: path === 'recovery', durableRecoveryProven: false,
      empiricDesmopressinAttempted: path === 'commonError' || path === 'recovery',
      normalizationAttempted: path === 'commonError' || path === 'recovery' });
    expect(findings(first.events).map(({ outcome }) => outcome)).toEqual(Array(5).fill(complete ? 'met' : 'not-met'));
    if (complete) expect(first.patient.observation).toMatchObject({ sodiumMmolL: 162, changeFromBaselineMmolL: -2,
      urineOutputMlPerHour: 35, ongoingDiarrhea: true, alertness: 'awake, thirsty, and fatigued' });
    if (path === 'recovery') expect(findings(first.events).map(({ finding }) => finding).join(' ')).toContain('Earlier observed recurrence remains');
    if (path === 'commonError') expect(first.patient).toMatchObject({ waterAccessAtTick: 2,
      volumeAtTick: null, waterAtTick: null, sodiumObservation: { sodiumMmolL: 164 } });
    if (path === 'noAction') expect(first.patient.observation).toBeNull();
    const snapshot = first.patient;
    first.engine.apply(choice(999999, 'reassess')); first.engine.step();
    expect(first.engine.equipment().resuscitation.renalHypernatremia).toEqual(snapshot);
  }, 240000);

  it('allows delivered water and loss care after visible circulation without access, support, or new laboratory gates', () => {
    const result = run([[0, 'restore-volume'], [VOLUME, 'replace-water'], [VOLUME, 'manage-losses'],
      [VOLUME + COMBINED, 'reassess']], VOLUME + COMBINED, { checkpoints: [VOLUME - 1, VOLUME, VOLUME + WATER] });
    expect(result.frames.get(VOLUME - 1)?.state.meanArterialMmHg).toBe(64);
    expect(result.frames.get(VOLUME)?.state.meanArterialMmHg).toBe(80);
    expect(result.frames.get(VOLUME)?.equipment.resuscitation.renalHypernatremia).toMatchObject({ circulationRestored: true,
      observation: null, sodiumObservation: null, fluidBalanceObservation: null });
    expect(result.frames.get(VOLUME + WATER)?.equipment.resuscitation.renalHypernatremia).toMatchObject({
      waterResponseObserved: false, observation: null, sodiumObservation: null, fluidBalanceObservation: null });
    expect(result.patient).toMatchObject({ supportActive: false, contextReviewedAtTick: null, waterAccessAtTick: null,
      combinedResponseObserved: true, observation: { sodiumMmolL: 162, ongoingDiarrhea: true }, ended: null });
    expect(result.events.filter(({ tick }) => tick > 0 && tick < VOLUME + COMBINED)
      .map(({ message }) => message).join(' ')).not.toMatch(/sodium 163|sodium 162|urine output 35|850|348/);
    for (const action of ['call-support', 'review-context', 'monitor', 'handoff'] as const) {
      result.engine.apply(choice(999999, action));
    }
    expect(result.engine.equipment().resuscitation.renalHypernatremia?.ended).toBeNull();
    result.engine.apply(choice(999999, 'assist-water-access')); result.engine.apply(choice(999999, 'handoff'));
    expect(result.engine.equipment().resuscitation.renalHypernatremia).toMatchObject({ ended: 'handoff',
      combinedResponseObserved: true, observation: { sodiumMmolL: 162 } });
  }, 120000);

  it('does not credit newer separate sodium and fluid-balance checks as observed combined replacement or current handoff', () => {
    const final = VOLUME + COMBINED;
    const result = run([[0, 'restore-volume'], [0, 'call-support'], [0, 'review-context'], [0, 'monitor'],
      [0, 'assist-water-access'], [VOLUME, 'reassess'], [VOLUME, 'replace-water'], [VOLUME, 'manage-losses'],
      [final, 'check-sodium'], [final + 1, 'check-fluid-balance'], [final + 2, 'handoff']], final + 2);
    expect(result.patient).toMatchObject({ observation: { atTick: VOLUME, sodiumMmolL: 164 },
      sodiumObservation: { atTick: final, sodiumMmolL: 162 }, fluidBalanceObservation: { atTick: final + 1, urineOutputMlPerHour: 35 },
      combinedResponseObserved: false, ended: null });
    expect(findings(result.events).map(({ outcome }) => outcome)).toEqual(['met', 'met', 'not-met', 'not-met', 'not-met']);
    result.engine.apply(choice(final + 3, 'reassess')); result.engine.apply(choice(final + 3, 'handoff'));
    expect(result.engine.equipment().resuscitation.renalHypernatremia).toMatchObject({ ended: 'handoff',
      combinedResponseObserved: true, observation: { sodiumMmolL: 162, ongoingDiarrhea: true } });
  }, 120000);

  it('preserves historical water response and transfers current recurrence while combined replacement remains pending', () => {
    const recur = VOLUME + RECURRENCE;
    const result = run([[0, 'restore-volume'], [0, 'call-support'], [0, 'review-context'], [0, 'monitor'],
      [0, 'assist-water-access'], [VOLUME, 'replace-water'], [VOLUME + WATER, 'reassess'],
      [recur, 'check-sodium'], [recur + 1, 'check-fluid-balance'], [recur + 2, 'reassess'],
      [recur + 3, 'manage-losses'], [recur + 4, 'reassess'], [recur + 5, 'handoff']], recur + 5,
    { checkpoints: [recur - 1] });
    expect(result.frames.get(recur - 1)?.equipment.resuscitation.renalHypernatremia).toMatchObject({
      observation: { atTick: VOLUME + WATER, sodiumMmolL: 163 }, recurrenceObserved: false });
    expect(result.frames.get(recur + 1)?.equipment.resuscitation.renalHypernatremia).toMatchObject({
      observation: { atTick: VOLUME + WATER, sodiumMmolL: 163 }, sodiumObservation: { atTick: recur, sodiumMmolL: 164 },
      fluidBalanceObservation: { atTick: recur + 1 }, recurrenceObserved: false });
    expect(result.frames.get(recur + 4)?.equipment.resuscitation.renalHypernatremia?.combinedDueInSeconds).toBeGreaterThan(0);
    expect(result.patient).toMatchObject({ ended: 'handoff', waterResponseObserved: true, recurrenceObserved: true,
      combinedResponseObserved: false, observation: { atTick: recur + 4, sodiumMmolL: 164, ongoingDiarrhea: true } });
    expect(findings(result.events).map(({ outcome }) => outcome)).toEqual(['met', 'met', 'not-met', 'met', 'met']);
    expect(findings(result.events).find(({ objectiveId }) => objectiveId === 'renal-hypernatremia-replacement')?.finding)
      .toContain('incomplete or pending');
  }, 120000);

  it('requires care-before-assessment log order and matching response type even at the same tick', () => {
    const events = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0]).events;
    const event = (id: string) => events.find(({ eventId }) => new RegExp(`^renal-hypernatremia-${id}-\\d+$`).test(eventId))!;
    for (const careId of ['volume-restoration', 'water-replacement', 'losses-care'] as const) {
      const full = event(careId === 'volume-restoration' ? 'volume-reassessment' : 'combined-reassessment');
      const care = { ...event(careId), tick: full.tick, eventId: `renal-hypernatremia-${careId}-${full.tick}` };
      const prerequisites = careId === 'volume-restoration' ? [event('monitoring')]
        : [event(careId === 'water-replacement' ? 'losses-care' : 'water-replacement')];
      const objectiveId = careId === 'volume-restoration' ? 'renal-hypernatremia-volume' : 'renal-hypernatremia-replacement';
      for (const careFirst of [false, true]) {
        const ordered = [...prerequisites, ...(careFirst ? [care, full] : [full, care])];
        expect(findings(ordered).find((finding) => finding.objectiveId === objectiveId)?.outcome)
          .toBe(careFirst ? 'met' : 'not-met');
      }
      expect(findings([...prerequisites, { ...care, tick: full.tick + 1 }, full])
        .find((finding) => finding.objectiveId === objectiveId)?.outcome).toBe('not-met');
    }
  }, 120000);

  it('rejects malformed and generic actions without invoking getters or trusting caller ticks', () => {
    const engine = create(); engine.step(); const before = engine.equipment().resuscitation.renalHypernatremia!;
    const getter = vi.fn(() => 'restore-volume');
    for (const payload of [{ action: 'restore-volume', dose: 100 }, { action: 'restore-volume', [Symbol('private')]: 1 },
      Object.defineProperty({}, 'action', { enumerable: true, get: getter }),
      Object.defineProperty({}, 'action', { value: 'restore-volume' }), Object.create({ action: 'restore-volume' }) as object,
      { action: 'unknown' }]) {
      engine.apply({ tick: 0, type: 'renal-hypernatremia-response', payload: payload as LearnerAction['payload'] });
      const { choiceFeedback: _beforeFeedback, ...initial } = before;
      const { choiceFeedback: _afterFeedback, ...after } = engine.equipment().resuscitation.renalHypernatremia!;
      expect(after).toEqual(initial);
    }
    expect(getter).not.toHaveBeenCalled();
    const equipmentBeforeGeneric = engine.equipment();
    for (const type of ['set-ventilator', 'bolus', 'avp-deficiency-response'] as const) {
      engine.apply({ tick: 0, type, payload: { action: 'desmopressin', fio2: 1, dose: 100 } });
    }
    expect(engine.equipment()).toEqual(equipmentBeforeGeneric);
    engine.apply(choice(999999, 'restore-volume'));
    expect(engine.equipment().resuscitation.renalHypernatremia?.volumeAtTick).toBe(1);
  });

  it('does not activate or score a lookalike and leaves the separate AVP-deficiency lesson unchanged', () => {
    const lookalike = { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'lookalike-hypernatremia' } };
    const evidence = run([[0, 'restore-volume'], [0, 'monitor'], [VOLUME, 'reassess']], VOLUME).events;
    expect(objectiveFindings(lookalike, [], 0, 0, [], evidence).map(({ outcome }) => outcome)).toEqual(Array(5).fill('not-exercised'));
    for (const scenario of [lookalike, { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }, ADJACENT]) {
      const engine = new AnesthesiaEngine({ scenario, seed: FIXTURES.seed, practiceRegion: 'US' });
      expect(engine.step().equipment.resuscitation.renalHypernatremia).toBeUndefined();
      const before = engine.equipment().resuscitation.avpDeficiency;
      engine.apply(choice(0, 'restore-volume'));
      expect(engine.equipment().resuscitation.avpDeficiency).toEqual(before);
    }
  });
});
