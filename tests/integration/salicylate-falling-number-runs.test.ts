/**
 * Reference transcripts for the salicylate lesson, replayed through the real
 * engine.
 *
 * The error path is an ordering error rather than a treatment error, because
 * this lesson delivers no treatment. Committing on the concentration alone —
 * before the acid-base, volume, potassium and airway picture that decides what
 * any of it means — is the shape it refuses, and the recovery path starts from
 * exactly that refusal.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { SALICYLATE_FALLING_NUMBER as SCENARIO } from '../../src/modules/toxicology/scenarios/salicylate-falling-number';
import { SALICYLATE_FIXTURES as FIXTURES } from '../../src/modules/toxicology/salicylate-falling-number-fixtures';
import type { SalicylateAction } from '../../src/modules/toxicology/salicylate-falling-number';
import { salicylateCompletionEvidence } from '../../src/modules/toxicology/salicylate-falling-number-completion';
import { salicylateInlinePrompt } from '../../src/modules/toxicology/tutor/salicylate-falling-number-guidance';

type Choices = readonly (readonly [number, SalicylateAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: SalicylateAction): LearnerAction => ({ tick, type: 'salicylate-falling-number-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.toxicologySalicylateAssessment);
    const prompt = salicylateInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      salicylate: frame.equipment.resuscitation.toxicologySalicylateAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.toxicologySalicylateAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.toxicologySalicylateAssessment! };
}

describe('Salicylate transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'toxicology', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    // The objectives cap is a content-design decision across several modules,
    // and the two runtime requirements need people and hardware. Nothing else
    // remains.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(salicylateCompletionEvidence(SCENARIO, ENGINE_VERSION, 'toxicology')).toHaveLength(9);
    expect(salicylateCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(salicylateCompletionEvidence(SCENARIO, 'changed', 'toxicology')).toEqual([]);
    expect(salicylateCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'toxicology')).toEqual([]);
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

  it('refuses the alkalinization and dialysis intent before the acid-base picture is read', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null,
    });
    // Recognizing the mixed pattern and calling the owners are not the failure.
    // Committing before the evidence that decides what to commit to is.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('evidence-order-refused');
  });

  it('lets the same run recover, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    // The counterfactual is that the early error stays visible after the correction.
    expect(JSON.stringify(recovered.events)).toContain('evidence-order-refused');
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.treatmentEffectProven).toBe(false);
    expect(recovered.patient.tissueConcentrationProven).toBe(false);
    expect(recovered.patient.ongoingAbsorptionExcluded).toBe(false);
    expect(recovered.patient.dialysisEligibilityDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
