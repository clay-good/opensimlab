/**
 * Reference transcripts for the pediatric septic-shock lesson, replayed
 * through the real engine.
 *
 * Two of the six steps are unordered against each other, so the paths here
 * exercise both orders of the rescue-and-source pair as well as the refusal
 * that fires when only one of them is active.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_SEPTIC_SHOCK as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-septic-shock';
import { PEDIATRIC_SEPTIC_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-septic-shock-fixtures';
import type { PediatricSepticShockAction } from '../../src/modules/pediatrics/pediatric-septic-shock';
import { pediatricSepticShockCompletionEvidence } from '../../src/modules/pediatrics/pediatric-septic-shock-completion';
import { pediatricSepticShockInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-septic-shock-guidance';

type Choices = readonly (readonly [number, PediatricSepticShockAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PediatricSepticShockAction): LearnerAction => ({ tick, type: 'pediatric-septic-shock-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.pediatricSepticShockAssessment);
    const prompt = pediatricSepticShockInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pediatricSepticShockAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pediatricSepticShockAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pediatricSepticShockAssessment! };
}

describe('Pediatric septic-shock transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pediatricSepticShockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(pediatricSepticShockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(pediatricSepticShockCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(pediatricSepticShockCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
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

  it('refuses the later report while only one half of the pair is active', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.rescueAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({ sourceAtTick: null, laterResponseAtTick: null, handoffAtTick: null });
    expect(errored.patient.qualifiedVasoactiveOwnershipActive).toBe(true);
    expect(errored.patient.qualifiedSourceControlOwnershipActive).toBe(false);
    expect(JSON.stringify(errored.events))
      .toContain('Keep qualified shock rescue and source-control escalation active in parallel');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('accepts the unordered pair source-first and still reaches a correct handoff', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    // The pair really was taken in the opposite order from the expert path.
    expect(recovered.patient.sourceAtTick).toBeLessThan(recovered.patient.rescueAtTick!);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the supplied care and worsening whole-child trajectory first');
    expect(transcript).toContain('Keep qualified shock rescue and source-control escalation active in parallel');
    expect(transcript).toContain('Allow elapsed simulated time after both rescue and source ownership are active');
    expect(transcript).toContain('Allow another simulated tick before handing off');
    // The later report still waits for whichever half landed second.
    expect(recovered.patient.rescueAtTick).toBeLessThan(recovered.patient.laterResponseAtTick!);
    expect(recovered.patient.laterResponseAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('keeps the congestion warnings from becoming either proof or permission', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.suspectedInfectionAuthored).toBe(true);
    expect(expert.patient.impairedPerfusionAuthored).toBe(true);
    expect(expert.patient.septicShockAuthored).toBe(true);
    expect(expert.patient.congestionWarningsAuthored).toBe(true);
    expect(expert.patient.phoenixScoreAuthored).toBe(2);
    expect(expert.patient.phoenixCardiovascularSubscoreAuthored).toBe(2);
    // Partial stabilization, and nothing that follows from it.
    expect(expert.patient.persistentShockAuthored).toBe(true);
    expect(expert.patient.sourceConfirmed).toBe(false);
    expect(expert.patient.pathogenIdentified).toBe(false);
    expect(expert.patient.treatmentEffectProven).toBe(false);
    expect(expert.patient.durableRecoveryProven).toBe(false);
    expect(expert.patient.dischargeReadinessProven).toBe(false);
    expect(expert.patient.dispositionDetermined).toBe(false);
    expect(expert.patient.outcomePredicted).toBe(false);
  });

  it('certifies that nothing about this child was ever touched by the learner', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.scoreCalculatedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.imagingInterpretedByLearner).toBe(false);
    expect(recovered.patient.cultureAcquiredByLearner).toBe(false);
    expect(recovered.patient.antimicrobialSelectedByLearner).toBe(false);
    expect(recovered.patient.fluidSelectedByLearner).toBe(false);
    expect(recovered.patient.fluidVolumeSelectedByLearner).toBe(false);
    expect(recovered.patient.fluidDeliveredByLearner).toBe(false);
    expect(recovered.patient.vasoactiveSelectedByLearner).toBe(false);
    expect(recovered.patient.vasoactiveRateSelectedByLearner).toBe(false);
    expect(recovered.patient.infusionOperatedByLearner).toBe(false);
    expect(recovered.patient.accessPlacedByLearner).toBe(false);
    expect(recovered.patient.sourceControlPerformedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
  });
});
