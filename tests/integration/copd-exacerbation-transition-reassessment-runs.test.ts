/**
 * Reference transcripts for the COPD-transition lesson, replayed through the
 * real engine.
 *
 * The error path is the one a recovered blood gas invites: move to the
 * medication plan before looking at what she can actually do. It is an
 * ordering error rather than a treatment error, because this lesson delivers
 * no treatment. What it skips is the residual respiratory and oxygen review —
 * the step where the corridor walk says her numbers came back and her function
 * did not.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { COPD_EXACERBATION_TRANSITION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/copd-exacerbation-transition-reassessment';
import { COPD_TRANSITION_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/copd-exacerbation-transition-reassessment-fixtures';
import type { CopdTransitionAction } from '../../src/modules/respiratory-medicine/copd-exacerbation-transition-reassessment';
import { copdTransitionCompletionEvidence } from '../../src/modules/respiratory-medicine/copd-exacerbation-transition-reassessment-completion';
import { copdTransitionInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/copd-exacerbation-transition-reassessment-guidance';

type Choices = readonly (readonly [number, CopdTransitionAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: CopdTransitionAction): LearnerAction => ({ tick, type: 'copd-exacerbation-transition-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.copdTransitionAssessment);
    const prompt = copdTransitionInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      copdTransition: frame.equipment.resuscitation.copdTransitionAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.copdTransitionAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.copdTransitionAssessment! };
}

describe('COPD-transition transcripts through the real engine and debrief', () => {
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
    expect(copdTransitionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toHaveLength(8);
    expect(copdTransitionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(copdTransitionCompletionEvidence(SCENARIO, 'changed', 'respiratory-medicine')).toEqual([]);
    expect(copdTransitionCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
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
    expect(idle.patient.readinessAtTick).toBeNull();
  });

  it('refuses the medication plan before the function has been looked at', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      respiratoryNeedsAtTick: null, medicationAtTick: null, coordinationAtTick: null, handoffAtTick: null,
    });
    // Reviewing the medication is not the failure. Reviewing it before the
    // corridor walk is, because the walk is what decides whether home works.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('order-refused');
  });

  it('lets the same run recover, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    // The counterfactual is that the early error stays visible after the correction.
    expect(JSON.stringify(recovered.events)).toContain('order-refused');
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.longTermOxygenEligibilityDetermined).toBe(false);
    expect(recovered.patient.regimenSelected).toBe(false);
    expect(recovered.patient.techniquePerformedByLearner).toBe(false);
    expect(recovered.patient.rehabilitationEnrolled).toBe(false);
    expect(recovered.patient.appointmentGuaranteed).toBe(false);
    expect(recovered.patient.dispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
