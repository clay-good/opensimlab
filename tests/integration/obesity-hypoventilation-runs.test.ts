/**
 * Reference transcripts for the obesity-hypoventilation lesson, replayed
 * through the real engine.
 *
 * The awake gas and the sleep-plus-open-causes review are two parallel lanes,
 * so the order between them is not the failure. The error path is recording
 * the convergent working pattern with only one lane read.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { OBESITY_HYPOVENTILATION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/obesity-hypoventilation-reassessment';
import { OBESITY_HYPOVENTILATION_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/obesity-hypoventilation-reassessment-fixtures';
import type { ObesityHypoventilationAction } from '../../src/modules/respiratory-medicine/obesity-hypoventilation-reassessment';
import { obesityHypoventilationCompletionEvidence } from '../../src/modules/respiratory-medicine/obesity-hypoventilation-reassessment-completion';
import { obesityHypoventilationInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/obesity-hypoventilation-reassessment-guidance';

type Choices = readonly (readonly [number, ObesityHypoventilationAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: ObesityHypoventilationAction): LearnerAction => ({ tick, type: 'obesity-hypoventilation-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.obesityHypoventilationAssessment);
    const prompt = obesityHypoventilationInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.obesityHypoventilationAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.obesityHypoventilationAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.obesityHypoventilationAssessment! };
}

describe('Obesity-hypoventilation transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'respiratory-medicine', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    // Six objectives rather than five, so the shared objectives cap stays
    // outstanding alongside the two runtime requirements.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(obesityHypoventilationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toHaveLength(10);
    expect(obesityHypoventilationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(obesityHypoventilationCompletionEvidence(SCENARIO, 'changed', 'respiratory-medicine')).toEqual([]);
    expect(obesityHypoventilationCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
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
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    expect(expert.patient.handoffAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.phenotypeAtTick).toBeNull();
  });

  it('refuses the convergent pattern while only one evidence lane has been read', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      awakeEvidenceAtTick: null, recognitionAtTick: null,
      coordinatedPlanAtTick: null, handoffAtTick: null,
    });
    // Reading the sleep study first is not the failure — the two lanes are
    // order-free. Concluding from it alone, without ever seeing what her
    // carbon dioxide does awake, is.
    expect(errored.patient.sleepEvidenceAtTick).not.toBeNull();
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('order-refused');
  });

  it('lets the same run recover, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    // The counterfactual is that the early error stays visible after the correction.
    expect(JSON.stringify(recovered.events)).toContain('order-refused');
    expect(recovered.patient.examinationPerformedByLearner).toBe(false);
    expect(recovered.patient.bmiCalculatedByLearner).toBe(false);
    expect(recovered.patient.serumBicarbonateAcquiredByLearner).toBe(false);
    expect(recovered.patient.bloodGasAcquiredByLearner).toBe(false);
    expect(recovered.patient.sleepStudyAcquiredByLearner).toBe(false);
    expect(recovered.patient.sleepStudyScoredByLearner).toBe(false);
    expect(recovered.patient.sleepStudyInterpretedByLearner).toBe(false);
    expect(recovered.patient.testInterpretedByLearner).toBe(false);
    expect(recovered.patient.otherCausesExcludedByLearner).toBe(false);
    expect(recovered.patient.diagnosisDeterminedByLearner).toBe(false);
    expect(recovered.patient.obesityCausalityProven).toBe(false);
    expect(recovered.patient.oxygenSelectedByLearner).toBe(false);
    expect(recovered.patient.supportDeviceSelectedByLearner).toBe(false);
    expect(recovered.patient.deviceOperatedByLearner).toBe(false);
    expect(recovered.patient.drugSelectedByLearner).toBe(false);
    expect(recovered.patient.weightInterventionSelectedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
    expect(recovered.patient.patientPreferenceInferred).toBe(false);
    expect(recovered.patient.dispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
