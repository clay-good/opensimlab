/**
 * Reference transcripts for the postpartum-preeclampsia lesson, replayed
 * through the real engine.
 *
 * The error path is the one a pending laboratory invites: go and read the
 * supplied organ evidence — the platelets, the transaminases, the creatinine —
 * before calling two severe readings an emergency and starting the protocol
 * clock. It is an ordering error rather than a treatment error, because this
 * lesson delivers no treatment. What it skips is the naming and the
 * activation, and the sixty minutes are already running.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { POSTPARTUM_SEVERE_PREECLAMPSIA_WARNING_SIGNS as SCENARIO } from '../../src/modules/obstetrics/scenarios/postpartum-severe-preeclampsia-warning-signs';
import { POSTPARTUM_PREECLAMPSIA_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/postpartum-severe-preeclampsia-warning-signs-fixtures';
import type { PostpartumPreeclampsiaAction } from '../../src/modules/obstetrics/postpartum-severe-preeclampsia-warning-signs';
import { postpartumPreeclampsiaCompletionEvidence } from '../../src/modules/obstetrics/postpartum-severe-preeclampsia-warning-signs-completion';
import { postpartumPreeclampsiaInlinePrompt } from '../../src/modules/obstetrics/tutor/postpartum-severe-preeclampsia-warning-signs-guidance';

type Choices = readonly (readonly [number, PostpartumPreeclampsiaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PostpartumPreeclampsiaAction): LearnerAction => ({ tick, type: 'postpartum-severe-preeclampsia-warning-signs-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.obstetricsPostpartumPreeclampsiaAssessment);
    const prompt = postpartumPreeclampsiaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      postpartumPreeclampsia: frame.equipment.resuscitation.obstetricsPostpartumPreeclampsiaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.obstetricsPostpartumPreeclampsiaAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.obstetricsPostpartumPreeclampsiaAssessment! };
}

describe('Postpartum-preeclampsia transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'obstetrics', 'delivery-room', 'state_transition');
    expect(audit.complete).toBe(false);
    // The objectives cap is a content-design decision across several modules,
    // and the two runtime requirements need people and hardware. Nothing else
    // remains.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(postpartumPreeclampsiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toHaveLength(9);
    expect(postpartumPreeclampsiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(postpartumPreeclampsiaCompletionEvidence(SCENARIO, 'changed', 'obstetrics')).toEqual([]);
    expect(postpartumPreeclampsiaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'obstetrics')).toEqual([]);
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

  it('refuses the evidence review before the emergency has been named and the protocol started', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null,
      reassessmentAtTick: null, handoffAtTick: null,
    });
    // Reading the supplied evidence is not the failure. Reading it before
    // naming the emergency and starting the protocol, while the sixty minutes
    // from the first severe reading are already running, is.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('recognition-order-refused');
  });

  it('lets the same run recover, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    // The counterfactual is that the early error stays visible after the correction.
    expect(JSON.stringify(recovered.events)).toContain('recognition-order-refused');
    expect(recovered.patient.bloodPressureMeasuredByLearner).toBe(false);
    expect(recovered.patient.patientInterviewedByLearner).toBe(false);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.reflexesOrClonusAssessedByLearner).toBe(false);
    expect(recovered.patient.laboratoryAcquiredByLearner).toBe(false);
    expect(recovered.patient.laboratoryInterpretedByLearner).toBe(false);
    expect(recovered.patient.scoreOrRatioCalculatedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.alternativeExcludedByLearner).toBe(false);
    expect(recovered.patient.antihypertensiveSelectedByLearner).toBe(false);
    expect(recovered.patient.magnesiumSelectedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
    expect(recovered.patient.newbornSeparatedByLearner).toBe(false);
    expect(recovered.patient.followUpSelectedByLearner).toBe(false);
    expect(recovered.patient.durablePressureControlProven).toBe(false);
    expect(recovered.patient.symptomResolutionProven).toBe(false);
    expect(recovered.patient.seizureExcluded).toBe(false);
    expect(recovered.patient.organRecoveryProven).toBe(false);
    expect(recovered.patient.safetyDispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
