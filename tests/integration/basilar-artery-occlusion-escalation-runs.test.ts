/**
 * Reference transcripts for the basilar-occlusion lesson, replayed through the
 * real engine.
 *
 * The error path is an ordering error rather than a treatment error, because
 * this lesson delivers no treatment. Agreeing he meets the escalation boundary
 * and then waiting — for the thrombolysis review, or just to see which way he
 * goes — is the shape it refuses, and the recovery path starts from exactly
 * that refusal.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { BASILAR_ARTERY_OCCLUSION_ESCALATION as SCENARIO } from '../../src/modules/neurology/scenarios/basilar-artery-occlusion-escalation';
import { BASILAR_LVO_FIXTURES as FIXTURES } from '../../src/modules/neurology/basilar-artery-occlusion-escalation-fixtures';
import type { BasilarLvoAction } from '../../src/modules/neurology/basilar-artery-occlusion-escalation';
import { basilarLvoCompletionEvidence } from '../../src/modules/neurology/basilar-artery-occlusion-escalation-completion';
import { basilarLvoInlinePrompt } from '../../src/modules/neurology/tutor/basilar-artery-occlusion-escalation-guidance';

type Choices = readonly (readonly [number, BasilarLvoAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: BasilarLvoAction): LearnerAction => ({ tick, type: 'basilar-artery-occlusion-escalation-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.neurologyBasilarLvoAssessment);
    const prompt = basilarLvoInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      basilarLvo: frame.equipment.resuscitation.neurologyBasilarLvoAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.neurologyBasilarLvoAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.neurologyBasilarLvoAssessment! };
}

describe('Basilar-occlusion transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'neurology', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    // The objectives cap is a content-design decision across several modules,
    // and the two runtime requirements need people and hardware. Nothing else
    // remains.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(basilarLvoCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toHaveLength(9);
    expect(basilarLvoCompletionEvidence(SCENARIO, ENGINE_VERSION, 'toxicology')).toEqual([]);
    expect(basilarLvoCompletionEvidence(SCENARIO, 'changed', 'neurology')).toEqual([]);
    expect(basilarLvoCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'neurology')).toEqual([]);
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

  it('refuses the later review before the owners have been called', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      activationAtTick: null, laterAtTick: null, handoffAtTick: null,
    });
    // Recognizing the boundary is not the failure. Treating it as a
    // conclusion rather than the trigger for a phone call is.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('activation-order-refused');
  });

  it('lets the same run recover, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    // The counterfactual is that the early error stays visible after the correction.
    expect(JSON.stringify(recovered.events)).toContain('activation-order-refused');
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.treatmentEffectProven).toBe(false);
    expect(recovered.patient.scoreCalculatedByLearner).toBe(false);
    expect(recovered.patient.strokeMimicExcluded).toBe(false);
    expect(recovered.patient.eligibilityDeterminedByLearner).toBe(false);
    expect(recovered.patient.vesselPatencyProven).toBe(false);
    expect(recovered.patient.reperfusionProven).toBe(false);
    expect(recovered.patient.durableAirwayProtectionProven).toBe(false);
    expect(recovered.patient.durableNeurologicRecoveryProven).toBe(false);
    expect(recovered.patient.deteriorationExcluded).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
