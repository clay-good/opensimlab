/**
 * Reference transcripts for the post-drainage pneumothorax lesson, replayed
 * through the real engine.
 *
 * The error path is the one a striking radiograph invites: skip the aspiration
 * intent and go straight to reviewing a drainage response that has not
 * happened. It is an ordering error rather than a treatment error, because
 * this lesson performs no procedure. What it skips is the record of what the
 * pleural team is being asked to do and on what terms.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { LARGE_UNILATERAL_PLEURAL_EFFUSION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/large-unilateral-pleural-effusion-reassessment';
import { LARGE_PLEURAL_EFFUSION_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/large-unilateral-pleural-effusion-reassessment-fixtures';
import type { LargePleuralEffusionAction } from '../../src/modules/respiratory-medicine/large-unilateral-pleural-effusion-reassessment';
import { largePleuralEffusionCompletionEvidence } from '../../src/modules/respiratory-medicine/large-unilateral-pleural-effusion-reassessment-completion';
import { largePleuralEffusionInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/large-unilateral-pleural-effusion-reassessment-guidance';

type Choices = readonly (readonly [number, LargePleuralEffusionAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: LargePleuralEffusionAction): LearnerAction => ({ tick, type: 'large-unilateral-pleural-effusion-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.largePleuralEffusionAssessment);
    const prompt = largePleuralEffusionInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      largePleuralEffusion: frame.equipment.resuscitation.largePleuralEffusionAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.largePleuralEffusionAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.largePleuralEffusionAssessment! };
}

describe('Large-effusion transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'respiratory-medicine', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    // Six objectives rather than five here, so unlike the first six lessons in
    // this module the shared objectives cap stays outstanding.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(largePleuralEffusionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toHaveLength(9);
    expect(largePleuralEffusionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(largePleuralEffusionCompletionEvidence(SCENARIO, 'changed', 'respiratory-medicine')).toEqual([]);
    expect(largePleuralEffusionCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
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
    expect(idle.patient.trajectoryAtTick).toBeNull();
  });

  it('refuses the response review before the aspiration intent is recorded', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      intentAtTick: null, responseAtTick: null, fluidAtTick: null,
      evaluationAtTick: null, handoffAtTick: null,
    });
    // Reviewing the checkpoint is not the failure. Reviewing it before
    // recording what the pleural team was asked to do, and on what terms, is.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
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
    expect(recovered.patient.imagingAcquiredByLearner).toBe(false);
    expect(recovered.patient.ultrasoundPerformedByLearner).toBe(false);
    expect(recovered.patient.pleuralFluidAcquiredByLearner).toBe(false);
    expect(recovered.patient.fluidInterpretedByLearner).toBe(false);
    expect(recovered.patient.thoracentesisPerformedByLearner).toBe(false);
    expect(recovered.patient.deviceOrSiteSelected).toBe(false);
    expect(recovered.patient.drainageVolumeSelected).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
    expect(recovered.patient.diagnosisDetermined).toBe(false);
    expect(recovered.patient.dispositionDetermined).toBe(false);
    expect(recovered.patient.largeUnilateralEffusionAuthored).toBe(true);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
