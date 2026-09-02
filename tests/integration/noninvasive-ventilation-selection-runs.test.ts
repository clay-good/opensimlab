/**
 * Reference transcripts for the support-selection lesson, replayed through
 * the real engine.
 *
 * This is the only lesson in the module whose authored error is a clinical
 * choice rather than an ordering mistake. CPAP alone is offered at exactly
 * the right point in the sequence, is refused, and leaves the patient
 * unchanged.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { NONINVASIVE_VENTILATION_SELECTION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/noninvasive-ventilation-selection';
import { NIV_SELECTION_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/noninvasive-ventilation-selection-fixtures';
import type { NoninvasiveVentilationSelectionAction } from '../../src/modules/respiratory-medicine/noninvasive-ventilation-selection';
import { noninvasiveVentilationSelectionCompletionEvidence } from '../../src/modules/respiratory-medicine/noninvasive-ventilation-selection-completion';
import { noninvasiveVentilationSelectionInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/noninvasive-ventilation-selection-guidance';

type Choices = readonly (readonly [number, NoninvasiveVentilationSelectionAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: NoninvasiveVentilationSelectionAction): LearnerAction => ({ tick, type: 'noninvasive-ventilation-selection-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.noninvasiveVentilationSelectionAssessment);
    const prompt = noninvasiveVentilationSelectionInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.noninvasiveVentilationSelectionAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.noninvasiveVentilationSelectionAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.noninvasiveVentilationSelectionAssessment! };
}

describe('Support-selection transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'respiratory-medicine', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    // Six objectives rather than five, so the shared objectives cap stays
    // outstanding alongside the two runtime requirements.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(noninvasiveVentilationSelectionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toHaveLength(10);
    expect(noninvasiveVentilationSelectionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(noninvasiveVentilationSelectionCompletionEvidence(SCENARIO, 'changed', 'respiratory-medicine')).toEqual([]);
    expect(noninvasiveVentilationSelectionCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
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

  it('answers CPAP alone without moving the patient', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    // The sequence was correct. The clinical choice was not.
    expect(errored.patient.trajectoryAtTick).not.toBeNull();
    expect(errored.patient.suitabilityAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      selectionAtTick: null, responseAtTick: null,
      failureGuardsAtTick: null, handoffAtTick: null,
      lastUnsupportedChoice: 'cpap',
    });
    expect(errored.patient.bilevelNivSelectedByLearner).toBe(false);
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('modality-not-selected');
    expect(JSON.stringify(errored.events)).toContain('The patient did not change.');
  });

  it('lets the same run recover after two wrong goals, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    // The counterfactual: both refusals stay visible after the correct choice,
    // and the correct choice clears the record of the last wrong one.
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('modality-not-selected');
    expect(transcript).toContain('CPAP provides continuous distending pressure');
    expect(transcript).toContain('current guidance favors an NIV trial first');
    expect(recovered.patient.lastUnsupportedChoice).toBeNull();
    expect(recovered.patient.bilevelNivSelectedByLearner).toBe(true);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.bloodGasAcquiredByLearner).toBe(false);
    expect(recovered.patient.bloodGasInterpretedByLearner).toBe(false);
    expect(recovered.patient.imagingAcquiredByLearner).toBe(false);
    expect(recovered.patient.oxygenSelectedByLearner).toBe(false);
    expect(recovered.patient.interfaceSelectedByLearner).toBe(false);
    expect(recovered.patient.pressureSelectedByLearner).toBe(false);
    expect(recovered.patient.backupRateSelectedByLearner).toBe(false);
    expect(recovered.patient.deviceOperatedByLearner).toBe(false);
    expect(recovered.patient.ventilationDeliveredByLearner).toBe(false);
    expect(recovered.patient.drugSelectedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
    expect(recovered.patient.intubationPerformedByLearner).toBe(false);
    expect(recovered.patient.durableNivSuccessProven).toBe(false);
    expect(recovered.patient.dispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
