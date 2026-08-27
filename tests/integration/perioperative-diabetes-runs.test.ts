import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PERIOPERATIVE_DIABETES_INSULIN_CONTINUITY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/perioperative-diabetes-insulin-continuity';
import { PERIOPERATIVE_DIABETES_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/perioperative-diabetes-fixtures';
import { PERIOPERATIVE_DIABETES_EARLY_TICKS as EARLY, PERIOPERATIVE_DIABETES_RESPONSE_TICKS as LATER,
  PERIOPERATIVE_DIABETES_TAKEOVER_TICKS as STOP, type PerioperativeDiabetesAction } from '../../src/modules/endocrine-metabolic/perioperative-diabetes';
import { perioperativeDiabetesCompletionEvidence } from '../../src/modules/endocrine-metabolic/perioperative-diabetes-completion';
import { perioperativeDiabetesInlinePrompt } from '../../src/modules/endocrine-metabolic/perioperative-diabetes-tutor';

type Choices = readonly (readonly [number, PerioperativeDiabetesAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PerioperativeDiabetesAction): LearnerAction => ({ tick, type: 'perioperative-diabetes-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);
function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US', hashFrames = false) {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    if (hashFrames) hash.update(JSON.stringify(frame));
    if (tick % 600 === 0 || actions.some(([at]) => at === tick)) {
      const before = JSON.stringify(frame.equipment.resuscitation.perioperativeDiabetes);
      const prompt = perioperativeDiabetesInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
        perioperativeDiabetes: frame.equipment.resuscitation.perioperativeDiabetes });
      if (level === 'unassisted') expect(prompt).toBeNull();
      expect(JSON.stringify(frame.equipment.resuscitation.perioperativeDiabetes)).toBe(before);
    }
  }
  expect(next).toBe(actions.length);
  return { engine, events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.perioperativeDiabetes! };
}

describe('Perioperative insulin continuity through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview', estimatedMinutes: 60 });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(perioperativeDiabetesCompletionEvidence(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic')).toHaveLength(9);
    expect(perioperativeDiabetesCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(perioperativeDiabetesCompletionEvidence(SCENARIO, 'changed', 'endocrine-metabolic')).toEqual([]);
    expect(perioperativeDiabetesCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 69 } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    const frame = create().step();
    expect(frame.state).toMatchObject({ systolicMmHg: 118, diastolicMmHg: 72, meanArterialMmHg: 87,
      heartRateBpm: 88, respiratoryRateBpm: 16, spo2Percent: 98, coreTemperatureC: 36.7 });
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining(['etco2MmHg', 'fio2']));
    expect(frame.equipment.resuscitation.perioperativeDiabetes).toMatchObject({ observation: null, glucoseObservation: null, durableRecoveryProven: false });
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across guidance levels', (path) => {
    const actions: Choices = FIXTURES[path]; const corrected = path === 'expert' || path === 'recovery';
    const until = corrected ? actions.at(-1)![0] + 1 : STOP + 1;
    const first = run(actions, until, 'guided', 'US', true);
    for (const level of ['coached', 'unassisted'] as const) expect(run(actions, until, level, 'US', true).hash).toBe(first.hash);
    expect(first.patient).toMatchObject({ ended: corrected ? 'handoff' : 'instructor-takeover', responseObserved: corrected,
      omitInsulinAttempted: path === 'commonError' || path === 'recovery',
      cgmOnlyAttempted: path === 'commonError' || path === 'recovery',
      clearanceAttempted: path === 'commonError' || path === 'recovery', deteriorationObserved: path === 'recovery' });
    expect(findings(first.events).map(({ outcome }) => outcome)).toEqual(Array(5).fill(corrected ? 'met' : 'not-met'));
    if (corrected) expect(first.patient.observation).toMatchObject(path === 'expert'
      ? { glucoseMgDl: 144, ketonesMmolL: 0.3 } : { glucoseMgDl: 162, ketonesMmolL: 0.4 });
    if (path === 'noAction' || path === 'commonError') expect(first.patient.observation).toBeNull();
    if (path === 'recovery') expect(findings(first.events).map(({ finding }) => finding).join(' '))
      .toMatch(/Attempted insulin omission.*Earlier observed deterioration.*Attempted automatic surgical clearance/);
    const snapshot = first.patient;
    first.engine.apply(choice(999999, 'reassess')); first.engine.step();
    expect(first.engine.equipment().resuscitation.perioperativeDiabetes).toEqual(snapshot);
  });

  it('makes insulin response independent of planning and does not let planning alone treat interruption', () => {
    const treated = run([[0, 'restore-insulin']], LATER);
    expect(treated.patient).toMatchObject({ fastingPlanAtTick: null, monitoringAtTick: null, supportActive: false, observation: null });
    treated.engine.apply(choice(LATER + 1, 'reassess'));
    expect(treated.engine.equipment().resuscitation.perioperativeDiabetes?.observation).toMatchObject({ glucoseMgDl: 144, ketonesMmolL: 0.3 });
    const planned = run([[0, 'plan-fasting'], [0, 'monitor'], [LATER, 'reassess']], LATER);
    expect(planned.patient.observation).toMatchObject({ glucoseMgDl: 280, ketonesMmolL: 2 });
    expect(planned.patient.insulinAtTick).toBeNull();
  });

  it('preserves full-observation age when later glucose improves and does not award full response credit', () => {
    const result = run([[0, 'restore-insulin'], [EARLY, 'reassess'], [LATER, 'check-glucose']], LATER);
    expect(result.patient.observation).toMatchObject({ atTick: EARLY, glucoseMgDl: 162, ketonesMmolL: 0.4 });
    expect(result.patient.glucoseObservation).toEqual({ atTick: LATER, glucoseMgDl: 144 });
    expect(result.patient.responseObserved).toBe(false);
    expect(findings(result.events).find(({ objectiveId }) => objectiveId === 'perioperative-diabetes-reassessment')?.outcome).toBe('not-met');
    expect(findings(result.events).map(({ finding }) => finding).join(' ')).toContain('valid partial information');
  });

  it('describes delay on both sides of an authored boundary without making it a grading deadline', () => {
    for (const start of [EARLY - 1, EARLY]) {
      const result = run([[start, 'restore-insulin'], [start + EARLY, 'reassess']], start + EARLY);
      const finding = findings(result.events).find(({ objectiveId }) => objectiveId === 'perioperative-diabetes-insulin')!;
      expect(finding.outcome).toBe('met');
      expect(finding.finding).toContain(start === EARLY ? '1,800.0 simulated seconds' : '1,799.9 simulated seconds');
    }
  });

  it('uses the declared GB pathway without claiming a completed regional validation matrix', () => {
    expect(run(FIXTURES.expert, FIXTURES.expert.at(-1)![0], 'unassisted', 'GB').patient.ended).toBe('handoff');
  });

  it('rejects generic and extra-field care and uses the engine clock rather than an injected tick', () => {
    const engine = create(); engine.step();
    const before = engine.equipment().resuscitation.perioperativeDiabetes;
    engine.apply({ tick: 0, type: 'perioperative-diabetes-response', payload: { action: 'restore-insulin', dose: 100 } });
    engine.apply({ tick: 0, type: 'set-ventilator', payload: { fio2: 1 } });
    expect(engine.equipment().resuscitation.perioperativeDiabetes).toEqual(before);
    engine.apply(choice(999999, 'restore-insulin'));
    expect(engine.equipment().resuscitation.perioperativeDiabetes?.insulinAtTick).toBe(1);
  });
});
