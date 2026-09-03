/**
 * Reference transcripts for the emergency hyperkalemia lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is the pairing the lesson is built
 * around: after calcium the authored report brings the QRS from 140 ms to
 * 104 ms while the potassium reads exactly 7.1 mmol/L, unchanged — and the
 * engine refuses the final panel to anyone who treats that tracing as the end.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { HYPERKALEMIA_WITH_ECG_CHANGE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/hyperkalemia-with-ecg-change';
import { HYPERKALEMIA_WITH_ECG_CHANGE_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/hyperkalemia-with-ecg-change-fixtures';
import {
  HYPERKALEMIA_WITH_ECG_CHANGE_ACTIONS, HYPERKALEMIA_WITH_ECG_CHANGE_OBJECTIVES,
  HYPERKALEMIA_WITH_ECG_CHANGE_PARALLEL_ACTIONS, supportsHyperkalemiaWithEcgChange,
  type HyperkalemiaWithEcgChangeAction,
} from '../../src/modules/emergency-medicine/hyperkalemia-with-ecg-change';
import { hyperkalemiaWithEcgChangeCompletionEvidence } from '../../src/modules/emergency-medicine/hyperkalemia-with-ecg-change-completion';
import { hyperkalemiaWithEcgChangeInlinePrompt } from '../../src/modules/emergency-medicine/tutor/hyperkalemia-with-ecg-change-guidance';

type Choices = readonly (readonly [number, HyperkalemiaWithEcgChangeAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
// The engine action type is shorter than the scenario id.
const choice = (tick: number, action: HyperkalemiaWithEcgChangeAction): LearnerAction => ({ tick, type: 'hyperkalemia-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.hyperkalemiaAssessment);
    const prompt = hyperkalemiaWithEcgChangeInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.hyperkalemiaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.hyperkalemiaAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.hyperkalemiaAssessment! };
}

describe('Emergency hyperkalemia transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(HYPERKALEMIA_WITH_ECG_CHANGE_ACTIONS).toHaveLength(7);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsHyperkalemiaWithEcgChange(SCENARIO)).toBe(true);
    expect(supportsHyperkalemiaWithEcgChange({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'hyperkalemia-with-ecg-change-boundary'),
    })).toBe(false);
    expect(hyperkalemiaWithEcgChangeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(hyperkalemiaWithEcgChangeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'renal-electrolyte')).toEqual([]);
    expect(hyperkalemiaWithEcgChangeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(hyperkalemiaWithEcgChangeCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(hyperkalemiaWithEcgChangeCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...HYPERKALEMIA_WITH_ECG_CHANGE_OBJECTIVES]);
    expect([...HYPERKALEMIA_WITH_ECG_CHANGE_OBJECTIVES]).not.toEqual([...HYPERKALEMIA_WITH_ECG_CHANGE_ACTIONS.slice(0, 5)]);
    expect(supportsHyperkalemiaWithEcgChange({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: HYPERKALEMIA_WITH_ECG_CHANGE_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: HYPERKALEMIA_WITH_ECG_CHANGE_ACTIONS[index]!,
        })),
      },
    })).toBe(false);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across guidance levels and regions', (path) => {
    const actions: Choices = FIXTURES[path];
    const until = (actions.at(-1)?.[0] ?? 0) + 2;
    const reference = run(actions, until);
    for (const level of ['guided', 'coached'] as const) {
      expect(run(actions, until, level).hash).toBe(reference.hash);
    }
    expect(run(actions, until, 'unassisted', 'GB').hash).toBe(reference.hash);
  });

  it('meets every objective on the expert path and none with no action', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(findings(expert.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(expert.patient.reassessedAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.patternReviewedAtTick).toBeNull();
  });

  it('improves the tracing while the potassium does not move at all', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const calcium = expert.events.find(({ eventId }) => eventId.startsWith('hyperkalemia-calcium-'))!;
    expect(calcium.data).toMatchObject({
      potassiumMmolPerL: 7.1, treatmentDeliveredByLearner: false, ecgChanged: false,
    });
    const report = expert.events.find(({ eventId }) => eventId.startsWith('hyperkalemia-post-calcium-ecg-'))!;
    expect(report.data).toMatchObject({
      potassiumMmolPerL: 7.1, repeatQrsMs: 104, treatmentDeliveredByLearner: false,
    });
    const panel = expert.events.find(({ eventId }) => eventId.startsWith('hyperkalemia-reassessed-'))!;
    expect(panel.data).toMatchObject({ potassiumMmolPerL: 5.8, glucoseMgPerDl: 92, qrsMs: 98 });
    expect(JSON.stringify(panel)).toContain('rebound risk');
  });

  it('refuses the final panel to a run that stopped at the better tracing', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.postCalciumEcgAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      insulinGlucoseAtTick: null, betaAgonistAtTick: null, removalAtTick: null,
      reassessedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('complete both shifting lanes plus removal and cause control before final reassessment');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses the skipped review and both too-early reads, and still completes', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review ABCDE, the confirmed potassium, ECG toxicity, glucose, renal function, and drivers first.');
    expect(transcript).toContain('Intent alone does not change conduction.');
    expect(transcript).toContain('Allow a later simulated tick before reviewing the authored 1-hour potassium, glucose, and ECG panel.');
    expect(recovered.patient.patternReviewedAtTick).toBeLessThan(recovered.patient.calciumAtTick!);
    expect(recovered.patient.calciumAtTick).toBeLessThan(recovered.patient.postCalciumEcgAtTick!);
    expect(recovered.patient.removalAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every later step before the pattern is reviewed', () => {
    for (const action of HYPERKALEMIA_WITH_ECG_CHANGE_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review ABCDE, the confirmed potassium, ECG toxicity, glucose, renal function, and drivers first.');
      expect(refused.patient.patternReviewedAtTick).toBeNull();
    }
  });

  it('refuses every lane before the calcium intent is recorded', () => {
    for (const action of HYPERKALEMIA_WITH_ECG_CHANGE_PARALLEL_ACTIONS) {
      const refused = run([[0, 'review-hyperkalemia-pattern'], [1, action]], 3);
      expect(JSON.stringify(refused.events), action)
        .toContain('Protect the myocardium for the authored ECG toxicity before recording potassium-shifting intent.');
      expect(refused.patient.calciumAtTick).toBeNull();
    }
    expect(HYPERKALEMIA_WITH_ECG_CHANGE_PARALLEL_ACTIONS).toHaveLength(4);
  });

  it('accepts the four lanes in any order once calcium is recorded', () => {
    const orders: readonly (readonly HyperkalemiaWithEcgChangeAction[])[] = [
      ['record-hyperkalemia-removal-and-cause-control', 'record-hyperkalemia-beta-agonist', 'record-hyperkalemia-insulin-glucose', 'review-hyperkalemia-post-calcium-ecg'],
      ['record-hyperkalemia-insulin-glucose', 'review-hyperkalemia-post-calcium-ecg', 'record-hyperkalemia-removal-and-cause-control', 'record-hyperkalemia-beta-agonist'],
      ['record-hyperkalemia-beta-agonist', 'record-hyperkalemia-removal-and-cause-control', 'review-hyperkalemia-post-calcium-ecg', 'record-hyperkalemia-insulin-glucose'],
    ];
    for (const order of orders) {
      const actions: Choices = [
        [0, 'review-hyperkalemia-pattern'],
        [1, 'record-hyperkalemia-calcium-intent'],
        ...order.map((action, index) => [index + 2, action] as const),
        [6, 'reassess-hyperkalemia'],
      ];
      const done = run(actions, 8);
      expect(done.patient.reassessedAtTick, order.join(' → ')).not.toBeNull();
      expect(JSON.stringify(done.events), order.join(' → ')).not.toContain('order-refused');
      expect(findings(done.events).map(({ outcome }) => outcome))
        .toEqual(['met', 'met', 'met', 'met', 'met']);
    }
  });
});
