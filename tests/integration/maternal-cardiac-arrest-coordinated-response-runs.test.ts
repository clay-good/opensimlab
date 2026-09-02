/**
 * Reference transcripts for the maternal-cardiac-arrest lesson, replayed
 * through the real engine.
 *
 * Like the amniotic-fluid-embolism lesson, the response comes before the
 * understanding, so the error path is the ordinary instinct: read the arrest
 * before activating the prepared response and starting the clock. It is an
 * ordering error rather than a treatment error, because this lesson performs
 * no resuscitation. What it skips is the activation, and in this arrest the
 * clock is the intervention that everything else is timed against.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { MATERNAL_CARDIAC_ARREST_COORDINATED_RESPONSE as SCENARIO } from '../../src/modules/obstetrics/scenarios/maternal-cardiac-arrest-coordinated-response';
import { MATERNAL_ARREST_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/maternal-cardiac-arrest-coordinated-response-fixtures';
import type { MaternalArrestAction } from '../../src/modules/obstetrics/maternal-cardiac-arrest-coordinated-response';
import { maternalArrestCompletionEvidence } from '../../src/modules/obstetrics/maternal-cardiac-arrest-coordinated-response-completion';
import { maternalArrestInlinePrompt } from '../../src/modules/obstetrics/tutor/maternal-cardiac-arrest-coordinated-response-guidance';

type Choices = readonly (readonly [number, MaternalArrestAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: MaternalArrestAction): LearnerAction => ({ tick, type: 'maternal-cardiac-arrest-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.obstetricsMaternalArrestAssessment);
    const prompt = maternalArrestInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      maternalArrest: frame.equipment.resuscitation.obstetricsMaternalArrestAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.obstetricsMaternalArrestAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.obstetricsMaternalArrestAssessment! };
}

describe('Maternal-cardiac-arrest transcripts through the real engine and debrief', () => {
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
    expect(maternalArrestCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toHaveLength(9);
    expect(maternalArrestCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(maternalArrestCompletionEvidence(SCENARIO, 'changed', 'obstetrics')).toEqual([]);
    expect(maternalArrestCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'obstetrics')).toEqual([]);
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
    expect(idle.patient.supportAtTick).toBeNull();
  });

  it('refuses every later step before the coordinated response has been activated', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      supportAtTick: null, contextAtTick: null, modificationsAtTick: null,
      readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null,
    });
    // Reading the arrest is not the failure. Reading it before the prepared
    // response and the clock are running is, because the delivery decision in
    // a maternal arrest is timed from the arrest rather than from anyone
    // arriving.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('support-order-refused');
  });

  it('lets the same run recover, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    // The counterfactual is that the early error stays visible after the correction.
    expect(JSON.stringify(recovered.events)).toContain('support-order-refused');
    expect(recovered.patient.learnerAssessedResponsivenessBreathingOrPulse).toBe(false);
    expect(recovered.patient.learnerInterpretedRhythmOrMonitoring).toBe(false);
    expect(recovered.patient.cprPerformedByLearner).toBe(false);
    expect(recovered.patient.uterineDisplacementPerformedByLearner).toBe(false);
    expect(recovered.patient.airwayOrVentilationSelectedByLearner).toBe(false);
    expect(recovered.patient.accessSelectedByLearner).toBe(false);
    expect(recovered.patient.drugDoseRouteOrTargetSelectedByLearner).toBe(false);
    expect(recovered.patient.shockOrPacingSelectedByLearner).toBe(false);
    expect(recovered.patient.fetalMonitorOperatedByLearner).toBe(false);
    expect(recovered.patient.causeDiagnosedByLearner).toBe(false);
    expect(recovered.patient.causeExcludedByLearner).toBe(false);
    expect(recovered.patient.deliveryEligibilityDeterminedByLearner).toBe(false);
    expect(recovered.patient.deliverySelectedByLearner).toBe(false);
    expect(recovered.patient.deliveryPerformedByLearner).toBe(false);
    expect(recovered.patient.deliveryCompleted).toBe(false);
    expect(recovered.patient.roscOccurred).toBe(false);
    expect(recovered.patient.treatmentEffectProven).toBe(false);
    expect(recovered.patient.terminationDecisionMade).toBe(false);
    expect(recovered.patient.safetyDispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
