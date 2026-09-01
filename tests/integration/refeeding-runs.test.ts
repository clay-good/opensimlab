import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REFEEDING_ELECTROLYTE_SHIFT as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/refeeding-electrolyte-shift';
import { REFEEDING_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/refeeding-fixtures';
import { REFEEDING_ELECTROLYTE_TICKS as EARLY, REFEEDING_RESPONSE_TICKS as LATER,
  REFEEDING_TAKEOVER_TICKS as STOP, type RefeedingAction } from '../../src/modules/endocrine-metabolic/refeeding';
import { refeedingCompletionEvidence } from '../../src/modules/endocrine-metabolic/refeeding-completion';
import { refeedingInlinePrompt } from '../../src/modules/endocrine-metabolic/refeeding-tutor';

type Choices = readonly (readonly [number, RefeedingAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: RefeedingAction): LearnerAction => ({ tick, type: 'refeeding-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);
function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US', hashFrames = false) {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    if (hashFrames) hash.update(JSON.stringify(frame));
    if (tick % 600 === 0 || actions.some(([at]) => at === tick)) {
      const before = JSON.stringify(frame.equipment.resuscitation.refeeding);
      const prompt = refeedingInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version, refeeding: frame.equipment.resuscitation.refeeding });
      if (level === 'unassisted') expect(prompt).toBeNull();
      expect(JSON.stringify(frame.equipment.resuscitation.refeeding)).toBe(before);
    }
  }
  expect(next).toBe(actions.length);
  return { engine, events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.refeeding! };
}

describe('Refeeding decisions through the real engine and causal debrief', () => {
  it('binds exact content, protocol state, and pending evidence without upgrading clinical status', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview', estimatedMinutes: 60 });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(refeedingCompletionEvidence(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic')).toHaveLength(9);
    expect(refeedingCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(refeedingCompletionEvidence(SCENARIO, 'changed', 'endocrine-metabolic')).toEqual([]);
    expect(refeedingCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 47 } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    const frame = create().step();
    expect(frame.state).toMatchObject({ systolicMmHg: 102, diastolicMmHg: 64, meanArterialMmHg: 77,
      heartRateBpm: 112, respiratoryRateBpm: 22, spo2Percent: 97, coreTemperatureC: 36.7 });
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining(['etco2MmHg', 'fio2']));
    expect(frame.equipment.resuscitation.refeeding).toMatchObject({ observation: null, durableRecoveryProven: false });
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across guidance levels', (path) => {
    const actions: Choices = FIXTURES[path]; const corrected = path === 'expert' || path === 'recovery';
    const until = corrected ? actions.at(-1)![0] + 1 : STOP + 1;
    const first = run(actions, until, 'guided', 'US', true);
    for (const level of ['coached', 'unassisted'] as const) expect(run(actions, until, level, 'US', true).hash).toBe(first.hash);
    expect(first.patient).toMatchObject({ ended: corrected ? 'handoff' : 'instructor-takeover', responseObserved: corrected,
      feedingAdvanceAttempted: path === 'commonError' || path === 'recovery',
      monitoringStopAttempted: path === 'commonError' || path === 'recovery', recurrentDeclineObserved: path === 'recovery' });
    expect(findings(first.events).map(({ outcome }) => outcome)).toEqual(Array(5).fill(corrected ? 'met' : 'not-met'));
    if (corrected) expect(first.patient.observation).toMatchObject({ phosphateMmolL: 0.55, potassiumMmolL: 3.3, magnesiumMmolL: 0.65 });
    if (path === 'noAction') expect(first.patient.observation).toBeNull();
    if (path === 'recovery') expect(findings(first.events).map(({ finding }) => finding).join(' '))
      .toMatch(/Attempted automatic feeding advancement.*observed recurrent decline/);
    const snapshot = first.patient;
    first.engine.apply(choice(999999, 'reassess')); first.engine.step();
    expect(first.engine.equipment().resuscitation.refeeding).toEqual(snapshot);
  }); // Three complete long-course replays also run under concurrent CI load.

  it('accepts nutrition, vitamin, and replacement in either order without an administrative or laboratory gate', () => {
    for (const order of [['replace-electrolytes', 'review-nutrition', 'thiamine'],
      ['review-nutrition', 'thiamine', 'replace-electrolytes']] as const) {
      const result = run(order.map((action) => [0, action] as const), LATER);
      expect(result.patient).toMatchObject({ completeElectrolytesAtTick: 0, nutritionPlanAtTick: 0, thiamineAtTick: 0,
        supportActive: false, contextReviewedAtTick: null, monitoringAtTick: null, observation: null, responseObserved: false });
      result.engine.apply(choice(LATER + 1, 'reassess'));
      expect(result.engine.equipment().resuscitation.refeeding?.observation).toMatchObject({ phosphateMmolL: 0.55 });
    }
  });

  it('does not credit a phosphate-only observation as a fresh comprehensive response', () => {
    const result = run([[0, 'phosphate-only'], [EARLY, 'reassess'], [EARLY + 1, 'replace-electrolytes'],
      [EARLY + 1, 'reassess']], EARLY + 1);
    expect(result.patient.observation).toMatchObject({ phosphateMmolL: 0.45, potassiumMmolL: 2.7, magnesiumMmolL: 0.48 });
    expect(findings(result.events).find(({ objectiveId }) => objectiveId === 'refeeding-electrolytes')?.outcome).toBe('not-met');
    expect(findings(result.events).map(({ finding }) => finding).join(' ')).toContain('valid partial step');
  });

  it('keeps both sides of an authored delay boundary equivalent for observed comprehensive-care credit', () => {
    for (const start of [EARLY - 1, EARLY]) {
      const result = run([[start, 'replace-electrolytes'], [start + EARLY, 'reassess']], start + EARLY);
      const finding = findings(result.events).find(({ objectiveId }) => objectiveId === 'refeeding-electrolytes')!;
      expect(finding.outcome).toBe('met');
      expect(finding.finding).toContain(start === EARLY ? '1,800.0 simulated seconds' : '1,799.9 simulated seconds');
      expect(finding.finding.includes('untreated deterioration remains')).toBe(start === EARLY);
    }
  });

  it('uses the declared GB pathway without claiming a complete regional matrix', () => {
    expect(run(FIXTURES.expert, FIXTURES.expert.at(-1)![0], 'unassisted', 'GB').patient.ended).toBe('handoff');
  });

  it('rejects generic and extra-field interventions and uses engine-authoritative ticks', () => {
    const engine = create(); engine.step();
    const before = engine.equipment().resuscitation.refeeding;
    engine.apply({ tick: 0, type: 'refeeding-response', payload: { action: 'replace-electrolytes', dose: 100 } });
    engine.apply({ tick: 0, type: 'set-ventilator', payload: { fio2: 1 } });
    expect(engine.equipment().resuscitation.refeeding).toEqual(before);
    engine.apply(choice(999999, 'replace-electrolytes'));
    expect(engine.equipment().resuscitation.refeeding?.completeElectrolytesAtTick).toBe(1);
  });
});
