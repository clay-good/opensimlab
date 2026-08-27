import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RENAL_HYPERMAGNESEMIA_ANTAGONISM_AND_REMOVAL as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypermagnesemia-antagonism-and-removal';
import { RENAL_HYPERMAGNESEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypermagnesemia-fixtures';
import { RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS as CALCIUM, RENAL_HYPERMAGNESEMIA_REMOVAL_TICKS as REMOVAL,
  RENAL_HYPERMAGNESEMIA_TAKEOVER_TICKS as STOP, type RenalHypermagnesemiaAction } from '../../src/modules/renal-electrolyte/hypermagnesemia';
import { renalHypermagnesemiaCompletionEvidence } from '../../src/modules/renal-electrolyte/hypermagnesemia-completion';
import { renalHypermagnesemiaInlinePrompt } from '../../src/modules/renal-electrolyte/renal-hypermagnesemia-tutor';
import { MAGNESIUM_SULFATE_TOXICITY_RECOGNITION as OBSTETRIC } from '../../src/modules/obstetrics/scenarios/magnesium-sulfate-toxicity-recognition';
import { RENAL_HYPOCALCEMIA_IONIZED_CALCIUM_AND_CKD as HYPOCALCEMIA } from '../../src/modules/renal-electrolyte/scenarios/hypocalcemia-ionized-calcium-and-ckd';

type Choices = readonly (readonly [number, RenalHypermagnesemiaAction])[];
type Frame = ReturnType<AnesthesiaEngine['step']>;
const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const choice = (tick: number, action: RenalHypermagnesemiaAction): LearnerAction => ({ tick, type: 'renal-hypermagnesemia-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);
const ownership: Choices = [[0, 'stop-magnesium'], [0, 'call-support'], [0, 'review-context'], [0, 'monitor']];
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
    // Compare every solver field and waveform sample, not only the lesson snapshot.
    if (options.hash) hash.update(JSON.stringify(frame));
    if (capture.has(tick) || tick % 600 === 0) {
      const before = JSON.stringify(frame);
      const prompt = renalHypermagnesemiaInlinePrompt(options.level ?? 'unassisted', {
        scenarioVersion: SCENARIO.metadata.version, renalHypermagnesemia: frame.equipment.resuscitation.renalHypermagnesemia,
      });
      if (prompt) prompts.add(prompt.id);
      expect(JSON.stringify(frame)).toBe(before);
    }
    if (capture.has(tick)) frames.set(tick, frame);
  }
  expect(next).toBe(actions.length);
  return { engine, events, frames, prompts, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.renalHypermagnesemia! };
}

describe('Renal hypermagnesemia full-engine replay and phase-aware debrief', () => {
  it('binds exact preview evidence without upgrading pending clinical, inclusive, or production gates', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview', estimatedMinutes: 60 });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES).toMatchObject({ scenarioId: SCENARIO.metadata.id, contentVersion: '0.1.0', seed: 4999 });
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'renal-electrolyte', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(renalHypermagnesemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'renal-electrolyte')).toHaveLength(9);
    expect(renalHypermagnesemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(renalHypermagnesemiaCompletionEvidence(SCENARIO, 'changed', 'renal-electrolyte')).toEqual([]);
    for (const changed of [{ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } },
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: SCENARIO.patient.weightKg + 1 } }]) {
      expect(renalHypermagnesemiaCompletionEvidence(changed, ENGINE_VERSION, 'renal-electrolyte')).toEqual([]);
    }
    const frame = create().step();
    expect(frame.state).toMatchObject({ systolicMmHg: 86, diastolicMmHg: 48, meanArterialMmHg: 61,
      heartRateBpm: 44, respiratoryRateBpm: 8, spo2Percent: 90, coreTemperatureC: 36.3 });
    expect(frame.equipment.rhythmId).toBe('sinus');
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining(['etco2MmHg', 'fio2']));
    expect(frame.equipment.resuscitation.renalHypermagnesemia).toMatchObject({ observation: null,
      magnesiumObservation: null, neuromuscularObservation: null, durableRecoveryProven: false, doseModelAvailable: false });
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
      calciumResponseObserved: complete, removalResponseObserved: complete, recurrenceObserved: complete,
      durableRecoveryProven: false, calciumClearanceAttempted: path === 'commonError' || path === 'recovery',
      routineDiuresisAttempted: path === 'commonError' || path === 'recovery' });
    expect(findings(first.events).map(({ outcome }) => outcome)).toEqual(Array(5).fill(complete ? 'met' : 'not-met'));
    if (complete) {
      expect(first.patient.observation).toMatchObject({ magnesiumMmolL: 2.4, reflexesPresent: true, severeWeakness: false,
        respiratoryRateBpm: 14, spo2Percent: 96, alertness: 'awake with residual weakness' });
      expect(findings(first.events).map(({ finding }) => finding).join(' ')).toContain('not a measured magnesium rebound');
    }
    if (path === 'commonError') expect(first.patient).toMatchObject({ calciumAtTick: null, removalAtTick: null,
      observation: null, magnesiumObservation: { atTick: 9000, magnesiumMmolL: 4.6 } });
    if (path === 'noAction') expect(first.patient.observation).toBeNull();
    const snapshot = first.patient;
    first.engine.apply(choice(999999, 'reassess')); first.engine.step();
    expect(first.engine.equipment().resuscitation.renalHypermagnesemia).toEqual(snapshot);
  }, 120000);

  it('separates independent calcium circulation support, supported breathing, and unchanged magnesium through recurrence', () => {
    const result = run([[0, 'calcium'], [0, 'reassess'], [1, 'support-breathing'], [1, 'stop-magnesium'],
      [1, 'reassess'], [CALCIUM, 'reassess']], CALCIUM, { checkpoints: [CALCIUM - 1] });
    expect(result.frames.get(0)?.state).toMatchObject({ heartRateBpm: 62, meanArterialMmHg: 75,
      respiratoryRateBpm: 8, spo2Percent: 90 });
    expect(result.frames.get(0)?.equipment.resuscitation.renalHypermagnesemia?.observation)
      .toMatchObject({ magnesiumMmolL: 4.6, reflexesPresent: false, severeWeakness: true });
    expect(result.frames.get(1)?.state).toMatchObject({ respiratoryRateBpm: 14, spo2Percent: 96 });
    expect(result.frames.get(CALCIUM - 1)?.state.meanArterialMmHg).toBe(75);
    expect(result.patient).toMatchObject({ contextReviewedAtTick: null, supportActive: false, removalAtTick: null,
      recurrenceObserved: true, observation: { magnesiumMmolL: 4.6, meanArterialMmHg: 61,
        respiratoryRateBpm: 14, spo2Percent: 96, reflexesPresent: false, severeWeakness: true } });
    expect(result.events.filter(({ tick }) => tick > 1 && tick < CALCIUM).map(({ message }) => message).join(' '))
      .not.toMatch(/2\.4|reflexes present/);
  });

  it('allows removal-first response and subsequent breathing support without requiring unnecessary late calcium', () => {
    const originalScenario = JSON.stringify(SCENARIO);
    const result = run([[0, 'deliver-removal'], [REMOVAL, 'reassess'], [REMOVAL + 1, 'support-breathing'],
      [REMOVAL + 1, 'stop-magnesium'], [REMOVAL + 1, 'call-support'], [REMOVAL + 1, 'review-context'],
      [REMOVAL + 1, 'monitor'], [REMOVAL + 1, 'handoff'], [REMOVAL + 2, 'reassess'],
      [REMOVAL + 2, 'handoff']], REMOVAL + 2, { checkpoints: [REMOVAL - 1] });
    expect(result.frames.get(REMOVAL - 1)?.equipment.resuscitation.renalHypermagnesemia).toMatchObject({
      observation: null, magnesiumObservation: null, neuromuscularObservation: null, removalResponseObserved: false });
    expect(result.frames.get(REMOVAL)?.state).toMatchObject({ heartRateBpm: 68, respiratoryRateBpm: 10, spo2Percent: 92 });
    expect(result.frames.get(REMOVAL + 1)?.equipment.resuscitation.renalHypermagnesemia?.ended).toBeNull();
    expect(result.patient).toMatchObject({ calciumAtTick: null, calciumRequests: 0, calciumResponseObserved: false,
      removalResponseObserved: true, recurrenceObserved: false, ended: 'handoff',
      observation: { atTick: REMOVAL + 2, magnesiumMmolL: 2.4, respiratoryRateBpm: 14, spo2Percent: 96 } });
    expect(findings(result.events).map(({ outcome }) => outcome)).toEqual(Array(5).fill('met'));
    expect(findings(result.events)[0]?.finding).toContain('does not require unnecessary late calcium');
    expect(Object.keys(result.patient.observation!).sort()).toEqual(['alertness', 'atTick', 'coreTemperatureC',
      'diastolicMmHg', 'heartRateBpm', 'magnesiumMmolL', 'meanArterialMmHg', 'reflexesPresent',
      'respiratoryRateBpm', 'severeWeakness', 'spo2Percent', 'systolicMmHg'].sort());
    expect(JSON.stringify(SCENARIO)).toBe(originalScenario);
  }, 120000);

  it('does not combine partial magnesium and neuromuscular results into current full response or handoff', () => {
    const result = run([...ownership, [0, 'support-breathing'], [0, 'calcium'], [0, 'deliver-removal'], [0, 'reassess'],
      [REMOVAL, 'check-magnesium'], [REMOVAL + 1, 'check-neuromuscular'], [REMOVAL + 2, 'handoff']], REMOVAL + 2);
    expect(result.patient).toMatchObject({ observation: { atTick: 0, magnesiumMmolL: 4.6, reflexesPresent: false },
      magnesiumObservation: { atTick: REMOVAL, magnesiumMmolL: 2.4 },
      neuromuscularObservation: { atTick: REMOVAL + 1, reflexesPresent: true, severeWeakness: false },
      removalResponseObserved: false, ended: null });
    expect(findings(result.events).map(({ outcome }) => outcome)).toEqual(['met', 'met', 'not-met', 'met', 'not-met']);
    result.engine.apply(choice(999999, 'reassess')); result.engine.apply(choice(999999, 'handoff'));
    expect(result.engine.equipment().resuscitation.renalHypermagnesemia).toMatchObject({ ended: 'handoff',
      removalResponseObserved: true, observation: { magnesiumMmolL: 2.4 } });
  }, 120000);

  it('can hand off current recurrent toxicity with newly delivered removal pending without crediting elimination', () => {
    const result = run([...ownership, [0, 'support-breathing'], [0, 'calcium'], [0, 'reassess'],
      [CALCIUM, 'reassess'], [CALCIUM + 1, 'deliver-removal'], [CALCIUM + 2, 'reassess'],
      [CALCIUM + 3, 'handoff']], CALCIUM + 3);
    expect(result.frames.get(CALCIUM + 2)?.equipment.resuscitation.renalHypermagnesemia?.removalDueInSeconds).toBeGreaterThan(0);
    expect(result.patient).toMatchObject({ ended: 'handoff', recurrenceObserved: true, removalResponseObserved: false,
      observation: { atTick: CALCIUM + 2, magnesiumMmolL: 4.6, severeWeakness: true, meanArterialMmHg: 61 } });
    expect(findings(result.events).map(({ outcome }) => outcome)).toEqual(['met', 'met', 'not-met', 'met', 'met']);
    expect(findings(result.events)[2]?.finding).toContain('incomplete or pending');
  });

  it('requires care-before-full log order and the actual removal phase, including same-tick actions', () => {
    const events = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0]).events;
    const event = (id: string) => events.find(({ eventId }) => new RegExp(`^renal-hypermagnesemia-${id}-\\d+$`).test(eventId))!;
    for (const careId of ['calcium-antagonism', 'breathing-support', 'removal-care'] as const) {
      const full = event(careId === 'removal-care' ? 'removal-reassessment' : 'calcium-reassessment');
      const care = { ...event(careId), tick: full.tick, eventId: `renal-hypermagnesemia-${careId}-${full.tick}` };
      const prerequisites = careId === 'removal-care' ? [event('monitoring')]
        : [event(careId === 'breathing-support' ? 'calcium-antagonism' : 'breathing-support')];
      const objectiveId = careId === 'removal-care' ? 'renal-hypermagnesemia-removal' : 'renal-hypermagnesemia-support';
      for (const careFirst of [false, true]) {
        expect(findings([...prerequisites, ...(careFirst ? [care, full] : [full, care])])
          .find((finding) => finding.objectiveId === objectiveId)?.outcome).toBe(careFirst ? 'met' : 'not-met');
      }
      expect(findings([...prerequisites, { ...care, tick: full.tick + 1 }, full])
        .find((finding) => finding.objectiveId === objectiveId)?.outcome).toBe('not-met');
    }
    for (const id of ['calcium-reassessment', 'recurrence-reassessment', 'magnesium-check', 'neuromuscular-check']) {
      const wrongPhase = { ...event('removal-reassessment'), eventId: `renal-hypermagnesemia-${id}-36002` };
      expect(findings([event('removal-care'), event('monitoring'), wrongPhase])
        .find(({ objectiveId }) => objectiveId === 'renal-hypermagnesemia-removal')?.outcome).toBe('not-met');
    }
  }, 120000);

  it('rejects malformed and generic actions without invoking accessors or trusting caller ticks', () => {
    const engine = create(); engine.step(); const before = engine.equipment().resuscitation.renalHypermagnesemia!;
    const getter = vi.fn(() => 'calcium');
    for (const payload of [{ action: 'calcium', dose: 100 }, { action: 'calcium', [Symbol('private')]: 1 },
      Object.defineProperty({}, 'action', { enumerable: true, get: getter }), Object.defineProperty({}, 'action', { value: 'calcium' }),
      Object.create({ action: 'calcium' }) as object, { action: 'unknown' }]) {
      engine.apply({ tick: 0, type: 'renal-hypermagnesemia-response', payload: payload as LearnerAction['payload'] });
      const { choiceFeedback: _beforeFeedback, ...initial } = before;
      const { choiceFeedback: _afterFeedback, ...after } = engine.equipment().resuscitation.renalHypermagnesemia!;
      expect(after).toEqual(initial);
    }
    expect(getter).not.toHaveBeenCalled();
    const equipmentBeforeGeneric = engine.equipment();
    for (const type of ['set-ventilator', 'bolus', 'renal-hypocalcemia-response'] as const) {
      engine.apply({ tick: 0, type, payload: { action: 'rescue-calcium', fio2: 1, dose: 100 } });
    }
    expect(engine.equipment()).toEqual(equipmentBeforeGeneric);
    engine.apply(choice(999999, 'calcium')); engine.apply(choice(999999, 'calcium'));
    expect(engine.equipment().resuscitation.renalHypermagnesemia).toMatchObject({ calciumAtTick: 1, calciumRequests: 1 });
  });

  it('does not activate or score lookalikes or interfere with obstetric toxicity and renal hypocalcemia', () => {
    const lookalike = { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'lookalike-hypermagnesemia' } };
    const evidence: EngineEvent[] = [{ tick: 0, eventId: 'renal-hypermagnesemia-handoff-0', message: 'Synthetic isolation probe',
      severity: 'info', category: 'renal-hypermagnesemia' }];
    expect(objectiveFindings(lookalike, [], 0, 0, [], evidence).map(({ outcome }) => outcome)).toEqual(Array(5).fill('not-exercised'));
    for (const scenario of [lookalike, { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }, OBSTETRIC, HYPOCALCEMIA]) {
      const engine = new AnesthesiaEngine({ scenario, seed: FIXTURES.seed, practiceRegion: 'US' });
      expect(engine.step().equipment.resuscitation.renalHypermagnesemia).toBeUndefined();
      const before = engine.equipment().resuscitation;
      engine.apply(choice(0, 'calcium'));
      expect(engine.equipment().resuscitation).toEqual(before);
    }
  });
});
