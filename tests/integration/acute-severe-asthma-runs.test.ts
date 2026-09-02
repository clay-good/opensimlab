/**
 * Reference transcripts for the acute-severe-asthma lesson, replayed through
 * the real engine.
 *
 * The error path is the one a differential invites: review the alternatives
 * and the ventilation risks before calling critical care. It is an ordering
 * error rather than a treatment error, because this lesson delivers no
 * treatment. What it skips is the escalation, and the objective it belongs to
 * says why: escalation does not wait for another treatment cycle, a complete
 * differential, or further deterioration.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ACUTE_SEVERE_ASTHMA as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/acute-severe-asthma';
import { ACUTE_SEVERE_ASTHMA_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/acute-severe-asthma-fixtures';
import type { AcuteSevereAsthmaAction } from '../../src/modules/respiratory-medicine/acute-severe-asthma';
import { acuteSevereAsthmaCompletionEvidence } from '../../src/modules/respiratory-medicine/acute-severe-asthma-completion';
import { acuteSevereAsthmaInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/acute-severe-asthma-guidance';

type Choices = readonly (readonly [number, AcuteSevereAsthmaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: AcuteSevereAsthmaAction): LearnerAction => ({ tick, type: 'acute-severe-asthma-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.acuteSevereAsthmaAssessment);
    const prompt = acuteSevereAsthmaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      acuteSevereAsthma: frame.equipment.resuscitation.acuteSevereAsthmaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.acuteSevereAsthmaAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.acuteSevereAsthmaAssessment! };
}

describe('Acute-severe-asthma transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'respiratory-medicine', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    // This module declares five objectives rather than six, so unlike the
    // finished obstetrics, toxicology and neurology labs the objectives cap is
    // not outstanding. Only the two runtime requirements remain.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(acuteSevereAsthmaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toHaveLength(8);
    expect(acuteSevereAsthmaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(acuteSevereAsthmaCompletionEvidence(SCENARIO, 'changed', 'respiratory-medicine')).toEqual([]);
    expect(acuteSevereAsthmaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
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
    expect(idle.patient.treatmentAtTick).toBeNull();
  });

  it('refuses the alternatives review before critical care has been called', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      escalationAtTick: null, risksAtTick: null, handoffAtTick: null,
    });
    // Reviewing the differential is not the failure. Reviewing it before
    // critical care is called is, because escalation here does not wait for
    // the differential to be finished.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('escalation-order-refused');
  });

  it('lets the same run recover, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    // The counterfactual is that the early error stays visible after the correction.
    expect(JSON.stringify(recovered.events)).toContain('escalation-order-refused');
    expect(recovered.patient.medicationDeliveredByLearner).toBe(false);
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.airwayProcedurePerformedByLearner).toBe(false);
    expect(recovered.patient.ventilatorSettingSelected).toBe(false);
    expect(recovered.patient.dispositionDetermined).toBe(false);
    expect(recovered.patient.respiratoryFailureAuthored).toBe(true);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
