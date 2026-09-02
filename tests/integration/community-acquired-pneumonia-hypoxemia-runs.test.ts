/**
 * Reference transcripts for the hypoxemic-pneumonia lesson, replayed through
 * the real engine.
 *
 * The error path is the one a clear chest film invites: go to the evidence and
 * the severity score before corroborating and supporting the hypoxemia. It is
 * an ordering error rather than a treatment error, because this lesson
 * delivers no oxygen. What it skips is the step where a saturation of 85% is
 * confirmed as real and answered.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { COMMUNITY_ACQUIRED_PNEUMONIA_HYPOXEMIA_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/community-acquired-pneumonia-hypoxemia-reassessment';
import { CAP_HYPOXEMIA_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/community-acquired-pneumonia-hypoxemia-reassessment-fixtures';
import type { CapHypoxemiaAction } from '../../src/modules/respiratory-medicine/community-acquired-pneumonia-hypoxemia-reassessment';
import { capHypoxemiaCompletionEvidence } from '../../src/modules/respiratory-medicine/community-acquired-pneumonia-hypoxemia-reassessment-completion';
import { capHypoxemiaInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/community-acquired-pneumonia-hypoxemia-reassessment-guidance';

type Choices = readonly (readonly [number, CapHypoxemiaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: CapHypoxemiaAction): LearnerAction => ({ tick, type: 'community-acquired-pneumonia-hypoxemia-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.capHypoxemiaAssessment);
    const prompt = capHypoxemiaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      capHypoxemia: frame.equipment.resuscitation.capHypoxemiaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.capHypoxemiaAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.capHypoxemiaAssessment! };
}

describe('Hypoxemic-pneumonia transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'respiratory-medicine', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    // Five objectives rather than six, so the cap is not outstanding here and
    // only the two runtime requirements remain.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(capHypoxemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toHaveLength(9);
    expect(capHypoxemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(capHypoxemiaCompletionEvidence(SCENARIO, 'changed', 'respiratory-medicine')).toEqual([]);
    expect(capHypoxemiaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
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
    expect(expert.patient.handoffAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.supportAtTick).toBeNull();
  });

  it('refuses the evidence review before the hypoxemia has been answered', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      supportAtTick: null, evidenceAtTick: null, severityAtTick: null,
      treatmentIntentAtTick: null, handoffAtTick: null,
    });
    // Reasoning about the pneumonia is not the failure. Reasoning before a
    // saturation of 85% is confirmed and supported is.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('order-refused');
  });

  it('lets the same run recover, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    // The counterfactual is that the early error stays visible after the correction.
    expect(JSON.stringify(recovered.events)).toContain('order-refused');
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.supportDeviceSelected).toBe(false);
    expect(recovered.patient.antimicrobialSelected).toBe(false);
    expect(recovered.patient.testAcquiredByLearner).toBe(false);
    expect(recovered.patient.dispositionDetermined).toBe(false);
    expect(recovered.patient.hypoxemiaAuthored).toBe(true);
    expect(recovered.patient.pneumoniaPatternAuthored).toBe(true);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
