/**
 * Reference transcripts for the post-PE dyspnea lesson, replayed through the
 * real engine.
 *
 * The error path is the one an abnormal scan invites: go straight to the echo
 * and the perfusion defects before establishing that she is safe right now. It
 * is an ordering error rather than a treatment error, because this lesson
 * prescribes nothing. What it skips is the step that separates a chronic
 * limitation from a recurrence.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { POST_PULMONARY_EMBOLISM_PERSISTENT_DYSPNEA as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/post-pulmonary-embolism-persistent-dyspnea';
import { POST_PE_DYSPNEA_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/post-pulmonary-embolism-persistent-dyspnea-fixtures';
import type { PostPeDyspneaAction } from '../../src/modules/respiratory-medicine/post-pulmonary-embolism-persistent-dyspnea';
import { postPeDyspneaCompletionEvidence } from '../../src/modules/respiratory-medicine/post-pulmonary-embolism-persistent-dyspnea-completion';
import { postPeDyspneaInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/post-pulmonary-embolism-persistent-dyspnea-guidance';

type Choices = readonly (readonly [number, PostPeDyspneaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PostPeDyspneaAction): LearnerAction => ({ tick, type: 'post-pulmonary-embolism-persistent-dyspnea-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.postPeDyspneaAssessment);
    const prompt = postPeDyspneaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      postPeDyspnea: frame.equipment.resuscitation.postPeDyspneaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.postPeDyspneaAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.postPeDyspneaAssessment! };
}

describe('Post-PE dyspnea transcripts through the real engine and debrief', () => {
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
    expect(postPeDyspneaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toHaveLength(9);
    expect(postPeDyspneaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(postPeDyspneaCompletionEvidence(SCENARIO, 'changed', 'respiratory-medicine')).toEqual([]);
    expect(postPeDyspneaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
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
    expect(idle.patient.trajectoryAtTick).toBeNull();
  });

  it('refuses the evidence review before current safety has been established', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      safetyAtTick: null, evidenceAtTick: null, referralAtTick: null, handoffAtTick: null,
    });
    // Reading the imaging is not the failure. Reading it before establishing
    // that she is safe today is, because that is what separates a chronic
    // limitation from a recurrence.
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
    expect(recovered.patient.anticoagulationDeliveredByLearner).toBe(false);
    expect(recovered.patient.testAcquiredByLearner).toBe(false);
    expect(recovered.patient.ctepdDiagnosed).toBe(false);
    expect(recovered.patient.treatmentSelected).toBe(false);
    expect(recovered.patient.procedurePerformedByLearner).toBe(false);
    expect(recovered.patient.dispositionDetermined).toBe(false);
    expect(recovered.patient.acutePeConfirmedAuthored).toBe(true);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
