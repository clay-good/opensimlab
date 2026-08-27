import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { collectReportEquipmentContext } from '@routes/AnesthesiaRoute';
import { HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS, HYPOCALCEMIA_RESPONSE_TICKS,
  HYPOCALCEMIA_DELAY_TICKS, HYPOCALCEMIA_RECURRENCE_TICKS, HYPOCALCEMIA_TAKEOVER_TICKS,
  HYPOCALCEMIA_SESSION_TICKS, type HypocalcemiaAction } from '../../src/modules/endocrine-metabolic/hypocalcemia';
import { HYPOCALCEMIA_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/hypocalcemia-fixtures';
import { HYPOCALCEMIC_TETANY_RESCUE_AND_RECURRENCE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hypocalcemic-tetany-rescue-and-recurrence';
import { hypocalcemiaInlinePrompt } from '../../src/modules/endocrine-metabolic/tutor/hypocalcemia-guidance';
import { hypocalcemiaCompletionEvidence } from '../../src/modules/endocrine-metabolic/hypocalcemia-completion';

type Frame = ReturnType<AnesthesiaEngine['step']>;
type Choices = readonly (readonly [number, HypocalcemiaAction])[];
const OBJECTIVES = ['hypocalcemia-rescue', 'hypocalcemia-risk', 'hypocalcemia-cause', 'hypocalcemia-reassessment', 'hypocalcemia-handoff'];
const newEngine = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const choice = (tick: number, action: HypocalcemiaAction): LearnerAction => ({ tick, type: 'hypocalcemia-response', payload: { action } });
const PACKAGE: Choices = [[0, 'calcium-rescue'], [0, 'assess-risk'], [0, 'review-cause'],
  [0, 'magnesium'], [0, 'continuing-care'], [0, 'call-support']];

/** Every real tick contributes patient state, model snapshot, and event evidence. */
function run(actions: Choices, until: number, level: 'guided' | 'unassisted', checkpoints: readonly number[] = []) {
  const engine = newEngine(); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  const frames = new Map<number, Frame>(); const prompts = new Set<string>();
  const capture = new Set([0, until, ...actions.map(([tick]) => tick), ...checkpoints]); let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify({ tick: frame.tick, state: frame.state, patient: frame.equipment.resuscitation.hypocalcemia, events: frame.events }));
    if (capture.has(tick)) {
      frames.set(tick, frame); const before = JSON.stringify(frame);
      const prompt = hypocalcemiaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version, hypocalcemia: frame.equipment.resuscitation.hypocalcemia });
      if (prompt) prompts.add(prompt.id);
      expect(JSON.stringify(frame)).toBe(before);
    }
  }
  return { engine, frames, events, prompts, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.hypocalcemia! };
}

describe('Hypocalcemia: real engine rescue, recurrence, continuing care, and replay', () => {
  it('binds exact scenario and completion identity without promoting pending review or unsupported monitor values', () => {
    expect(validateScenario(SCENARIO)).toEqual([]); expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(OBJECTIVES);
    expect(SCENARIO.metadata.estimatedMinutes).toBe(60);
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id); expect(FIXTURES.contentVersion).toBe(SCENARIO.metadata.version);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(hypocalcemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic')).toHaveLength(9);
    expect(hypocalcemiaCompletionEvidence({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(hypocalcemiaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 999 } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(hypocalcemiaCompletionEvidence(SCENARIO, `${ENGINE_VERSION}-changed`, 'endocrine-metabolic')).toEqual([]);
    expect(hypocalcemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(newEngine().step().equipment.invalidParameters).toEqual(expect.arrayContaining(['etco2MmHg', 'fio2']));
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every real tick of %s identically across guidance levels and retains earlier mistakes', (path) => {
    const actions: Choices = FIXTURES[path]; const corrected = path === 'expert' || path === 'recovery';
    const until = corrected ? actions.at(-1)![0] + 1 : HYPOCALCEMIA_TAKEOVER_TICKS + 1;
    const guided = run(actions, until, 'guided'); const unassisted = run(actions, until, 'unassisted');
    expect(guided.hash).toBe(unassisted.hash); expect(guided.patient).toEqual(unassisted.patient);
    expect(guided.prompts.size).toBeGreaterThan(0); expect(unassisted.prompts.size).toBe(0);
    expect(guided.patient).toMatchObject({ ended: corrected ? 'handoff' : 'instructor-takeover',
      calciumResponseObserved: corrected, responseObserved: corrected, urgentTreatmentDelayed: path !== 'expert',
      recurrenceOccurred: path === 'recovery', stopAfterReliefAttempted: path === 'recovery',
      oralOnlyChosen: path === 'commonError' || path === 'recovery',
      waitForLabsChosen: path === 'commonError' || path === 'recovery',
      waitForMagnesiumChosen: path === 'commonError' || path === 'recovery', durableRecoveryProven: false });
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], guided.events);
    expect(findings.map(({ objectiveId }) => objectiveId)).toEqual(OBJECTIVES);
    expect(findings.map(({ outcome }) => outcome)).toEqual(path === 'expert' ? Array(5).fill('met')
      : path === 'recovery' ? ['not-met', 'met', 'not-met', 'met', 'met'] : Array(5).fill('not-met'));
    expect(guided.frames.get(0)!.state).toMatchObject({ systolicMmHg: 112, diastolicMmHg: 68,
      meanArterialMmHg: 83, heartRateBpm: 98, respiratoryRateBpm: 20, spo2Percent: 98, coreTemperatureC: 36.8 });
    expect(guided.frames.get(until)!.state).toMatchObject({ heartRateBpm: corrected ? 86 : 110, respiratoryRateBpm: corrected ? 18 : 24 });
    if (corrected) expect(guided.patient.observation?.adjustedCalciumMgDl).toBe(7.2);
    if (path !== 'expert') expect(guided.events.find(({ eventId }) => eventId.startsWith('hypocalcemia-urgent-treatment-delay-'))?.tick).toBe(HYPOCALCEMIA_DELAY_TICKS);
    if (path === 'recovery') {
      const rescue = actions.find(([, action]) => action === 'calcium-rescue')![0];
      expect(guided.events.find(({ eventId }) => eventId.startsWith('hypocalcemia-recurrence-'))?.tick).toBe(rescue + HYPOCALCEMIA_RECURRENCE_TICKS);
      expect(guided.frames.get(rescue + HYPOCALCEMIA_RECURRENCE_TICKS)!.equipment.resuscitation.hypocalcemia?.observation?.adjustedCalciumMgDl).toBe(6.7);
    }
    const ended = guided.patient;
    guided.engine.apply(choice(999999, 'reassess')); guided.engine.apply(choice(-1, 'calcium-rescue'));
    guided.engine.step(); expect(guided.engine.equipment().resuscitation.hypocalcemia).toEqual(ended);
  }, 120_000);

  it('requires fresh observations after authored checkpoints and bounds an unfinished fully treated lesson at three hours', () => {
    const early = HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS; const later = HYPOCALCEMIA_RESPONSE_TICKS;
    const result = run([...PACKAGE, [early - 1, 'reassess'], [later + 1, 'handoff'], [later + 1, 'reassess']],
      HYPOCALCEMIA_SESSION_TICKS, 'unassisted', [early, later, HYPOCALCEMIA_SESSION_TICKS - 1]);
    const at = (tick: number) => result.frames.get(tick)!.equipment.resuscitation.hypocalcemia!;
    expect(at(0)).toMatchObject({ observation: null, calciumDueInSeconds: 900, responseDueInSeconds: 3600 });
    expect(at(early)).toMatchObject({ calciumResponseObserved: false, observation: { adjustedCalciumMgDl: 6.6 } });
    expect(result.frames.get(early)!.state.heartRateBpm).toBe(90);
    expect(at(later)).toMatchObject({ responseObserved: false, observation: { adjustedCalciumMgDl: 6.6 } });
    expect(result.frames.get(later)!.state.heartRateBpm).toBe(86);
    expect(collectReportEquipmentContext(result.frames.get(later)!.equipment))
      .toMatchObject({ 'resuscitation.hypocalcemia.observation.adjustedCalciumMgDl': 6.6 });
    expect(at(later + 1)).toMatchObject({ ended: null, calciumResponseObserved: false, responseObserved: true,
      observation: { atTick: later + 1, adjustedCalciumMgDl: 7.2, heartRateBpm: 86 } });
    expect(result.events.some(({ eventId }) => eventId === `hypocalcemia-handoff-refused-${later + 1}`)).toBe(true);
    expect(at(HYPOCALCEMIA_SESSION_TICKS - 1).ended).toBeNull();
    expect(result.patient.ended).toBe('instructor-takeover');
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], result.events).find(({ objectiveId }) => objectiveId === 'hypocalcemia-reassessment')?.outcome).toBe('not-met');
  }, 120_000);

  it('allows ongoing-care handoff after a late fresh assessment without fabricating the missed early observation', () => {
    const later = HYPOCALCEMIA_RESPONSE_TICKS;
    const result = run([...PACKAGE, [later, 'reassess'], [later + 1, 'handoff']], later + 1, 'unassisted');
    expect(result.patient).toMatchObject({ ended: 'handoff', calciumResponseObserved: false, responseObserved: true,
      observation: { adjustedCalciumMgDl: 7.2 } });
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], result.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'met']);
  }, 60_000);

  it('credits recurrence and later support observations without claiming that early relief was observed', () => {
    const rescueTick = FIXTURES.recovery.find(([, action]) => action === 'calcium-rescue')![0];
    const recurrenceTick = rescueTick + HYPOCALCEMIA_RECURRENCE_TICKS;
    const actions: Choices = FIXTURES.recovery.filter(([tick, action]) => action !== 'reassess' || tick >= recurrenceTick);
    const result = run(actions, actions.at(-1)![0] + 1, 'unassisted');
    expect(result.frames.get(recurrenceTick)!.equipment.resuscitation.hypocalcemia).toMatchObject({
      calciumResponseObserved: true, responseObserved: false, recurrenceOccurred: true,
      observation: { atTick: recurrenceTick, adjustedCalciumMgDl: 6.7, symptoms: expect.stringContaining('recurred') },
    });
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], result.events);
    const reassessment = findings.find(({ objectiveId }) => objectiveId === 'hypocalcemia-reassessment')!;
    expect(reassessment.outcome).toBe('met');
    expect(reassessment.finding).toContain('initial-rescue or recurrence phase');
    expect(reassessment.finding).not.toMatch(/early symptom relief/i);
    expect(findings.find(({ objectiveId }) => objectiveId === 'hypocalcemia-handoff')?.outcome).toBe('met');
    expect(result.patient.ended).toBe('handoff');
  }, 60_000);

  it('rejects generic, adjacent, injected, and malformed actions while using only the authoritative engine tick', () => {
    const engine = newEngine(); const control = newEngine();
    for (const [type, payload] of [['bolus', { drugId: 'propofol', amount: 999, unit: 'mg' }],
      ['fluid-bolus', { amountMl: 999 }], ['ventilator', { fio2: 1 }], ['laryngoscopy', {}],
      ['hypercalcemia-response', { action: 'tailored-fluids' }]] as const) {
      engine.apply({ tick: 999999, type, payload } as LearnerAction);
    }
    for (const payload of [null, [], {}, { action: null }, { action: '__proto__' },
      { action: 'private-value' }, { action: 'calcium-rescue', dose: 999 }, { action: 'magnesium', notes: 'private-value' }]) {
      engine.apply({ tick: 999999, type: 'hypocalcemia-response', payload } as LearnerAction);
    }
    const frame = engine.step(); expect(frame.state).toEqual(control.step().state);
    expect(frame.equipment.resuscitation.hypocalcemia?.calciumAtTick).toBeNull();
    expect(JSON.stringify(frame.events)).not.toContain('private-value');
    engine.apply(choice(999999, 'magnesium')); engine.apply(choice(-100, 'continuing-care'));
    const refused = engine.step();
    expect(refused.events.map(({ eventId }) => eventId)).toEqual(expect.arrayContaining([
      'hypocalcemia-magnesium-review-refused-1', 'hypocalcemia-continuing-care-review-refused-1']));
    engine.apply(choice(999999, 'calcium-rescue'));
    expect(engine.equipment().resuscitation.hypocalcemia).toMatchObject({ calciumAtTick: 2,
      riskAssessedAtTick: null, causeReviewedAtTick: null, magnesiumAtTick: null, supportActive: false });
    engine.apply(choice(-100, 'review-cause')); engine.apply(choice(999999, 'continuing-care')); engine.apply(choice(999999, 'magnesium'));
    expect(engine.equipment().resuscitation.hypocalcemia).toMatchObject({ causeReviewedAtTick: 2, continuingCareAtTick: 2, magnesiumAtTick: 2 });
  });

  it('exports only explicit observed calcium and bounded decision scalars, never symptoms, feedback, or invented magnesium/QT recovery', () => {
    const engine = newEngine(); engine.apply(choice(0, 'calcium-rescue'));
    expect(Object.keys(collectReportEquipmentContext(engine.equipment())).filter((key) => key.includes('adjustedCalcium'))).toEqual([]);
    engine.apply(choice(0, 'reassess')); const equipment = engine.equipment(); const patient = equipment.resuscitation.hypocalcemia!;
    const projected = collectReportEquipmentContext({ ...equipment, resuscitation: { ...equipment.resuscitation,
      hypocalcemia: { ...patient, symptoms: 'private-value', choiceFeedback: 'private-value',
        observation: { ...patient.observation!, symptoms: 'private-value' } },
    } });
    expect(Object.keys(projected)).toHaveLength(32);
    expect(projected).toMatchObject({ 'resuscitation.hypocalcemia.calciumAtTick': 0,
      'resuscitation.hypocalcemia.observation.atTick': 0, 'resuscitation.hypocalcemia.observation.adjustedCalciumMgDl': 6.6,
      'resuscitation.hypocalcemia.responseObserved': false, 'resuscitation.hypocalcemia.recurrenceOccurred': false });
    expect(JSON.stringify(projected)).not.toMatch(/private-value|choiceFeedback|symptoms|magnesiumMmol|qtc/i);
  });
});
