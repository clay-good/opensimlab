/**
 * Reference transcripts for the high-flow escalation lesson, replayed through
 * the real engine.
 *
 * The authored error is a clinical choice rather than an ordering mistake,
 * and this lesson asks twice: once before the support goal is selected, and
 * again after thirty minutes when the patient looks better and the wrong
 * answers are more tempting than they were the first time.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { HIGH_FLOW_NASAL_OXYGEN_ESCALATION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/high-flow-nasal-oxygen-escalation';
import { HIGH_FLOW_OXYGEN_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/high-flow-nasal-oxygen-escalation-fixtures';
import type { HighFlowOxygenEscalationAction } from '../../src/modules/respiratory-medicine/high-flow-nasal-oxygen-escalation';
import { highFlowOxygenEscalationCompletionEvidence } from '../../src/modules/respiratory-medicine/high-flow-nasal-oxygen-escalation-completion';
import { highFlowOxygenEscalationInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/high-flow-nasal-oxygen-escalation-guidance';

type Choices = readonly (readonly [number, HighFlowOxygenEscalationAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: HighFlowOxygenEscalationAction): LearnerAction => ({ tick, type: 'high-flow-nasal-oxygen-escalation-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.highFlowOxygenEscalationAssessment);
    const prompt = highFlowOxygenEscalationInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.highFlowOxygenEscalationAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.highFlowOxygenEscalationAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.highFlowOxygenEscalationAssessment! };
}

describe('High-flow escalation transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'respiratory-medicine', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(highFlowOxygenEscalationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toHaveLength(10);
    expect(highFlowOxygenEscalationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(highFlowOxygenEscalationCompletionEvidence(SCENARIO, 'changed', 'respiratory-medicine')).toEqual([]);
    expect(highFlowOxygenEscalationCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
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
    expect(expert.patient.lastUnsupportedChoice).toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.trajectoryAtTick).toBeNull();
  });

  it('answers staying on conventional oxygen without moving the patient', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    // The sequence was correct. Staying put was the decision.
    expect(errored.patient.trajectoryAtTick).not.toBeNull();
    expect(errored.patient.suitabilityAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      selectionAtTick: null, responseAtTick: null,
      guardsAtTick: null, handoffAtTick: null,
      lastUnsupportedChoice: 'conventional',
    });
    expect(errored.patient.highFlowTrialIntentRecorded).toBe(false);
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('support-not-selected');
    expect(JSON.stringify(errored.events)).toContain('The patient did not change.');
  });

  it('lets the same run recover from all four wrong choices, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    // Both decision points refused, and both refusals survive the correction.
    expect(transcript).toContain('support-not-selected');
    expect(transcript).toContain('continuation-not-selected');
    expect(transcript).toContain('Oxygenation and work remain inadequate');
    expect(transcript).toContain('NIV or CPAP can be reasonable in selected acute hypoxemic failure');
    expect(transcript).toContain('The early response is partial');
    expect(recovered.patient.lastUnsupportedChoice).toBeNull();
    expect(recovered.patient.highFlowTrialIntentRecorded).toBe(true);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.bloodGasAcquiredByLearner).toBe(false);
    expect(recovered.patient.bloodGasInterpretedByLearner).toBe(false);
    expect(recovered.patient.imagingAcquiredByLearner).toBe(false);
    expect(recovered.patient.deviceInspectedByLearner).toBe(false);
    expect(recovered.patient.deviceSelectedByLearner).toBe(false);
    expect(recovered.patient.cannulaSelectedByLearner).toBe(false);
    expect(recovered.patient.flowSelectedByLearner).toBe(false);
    expect(recovered.patient.fio2SelectedByLearner).toBe(false);
    expect(recovered.patient.oxygenTargetSelectedByLearner).toBe(false);
    expect(recovered.patient.deviceOperatedByLearner).toBe(false);
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
    expect(recovered.patient.intubationPerformedByLearner).toBe(false);
    expect(recovered.patient.durableSuccessProven).toBe(false);
    expect(recovered.patient.dispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
