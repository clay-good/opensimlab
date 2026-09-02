/**
 * Reference transcripts for the clinic-STEMI lesson, replayed through the real
 * engine.
 *
 * The assertion this file exists for is the setting: a clinic without a
 * catheter laboratory never delivers a drug, never selects a downstream
 * therapy, and never chooses a destination.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { STEMI_RECOGNITION_AND_FIRST_ACTIONS as SCENARIO } from '../../src/modules/cardiology/scenarios/stemi-recognition-and-first-actions';
import { CLINIC_STEMI_FIXTURES as FIXTURES } from '../../src/modules/cardiology/clinic-stemi-fixtures';
import type { ClinicStemiAction } from '../../src/modules/cardiology/clinic-stemi';
import { clinicStemiCompletionEvidence } from '../../src/modules/cardiology/clinic-stemi-completion';
import { clinicStemiInlinePrompt } from '../../src/modules/cardiology/tutor/clinic-stemi-guidance';

type Choices = readonly (readonly [number, ClinicStemiAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: ClinicStemiAction): LearnerAction => ({ tick, type: 'clinic-stemi-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.clinicStemiAssessment);
    const prompt = clinicStemiInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.clinicStemiAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.clinicStemiAssessment)).toBe(before);
    // The setting never changes and nothing downstream is ever chosen here.
    const patient = frame.equipment.resuscitation.clinicStemiAssessment;
    if (patient) {
      expect(patient.pciCapableSetting).toBe(false);
      expect(patient.biomarkerDelayUsed).toBe(false);
      expect(patient.downstreamTherapySelected).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.clinicStemiAssessment! };
}

describe('Clinic-STEMI transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.1', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(clinicStemiCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(9);
    expect(clinicStemiCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(clinicStemiCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(clinicStemiCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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
    expect(idle.patient.patternAtTick).toBeNull();
  });

  it('refuses the bridge while the route has never been opened', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.dangerAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      transferAtTick: null, bridgeAtTick: null, handoffAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Activate EMS and the receiving reperfusion pathway before recording the clinic bridge');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('accepts the unordered pair screen-first and clears the handoff gate', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    // The pair really was taken in the opposite order from the expert path.
    expect(recovered.patient.dangerAtTick).toBeLessThan(recovered.patient.transferAtTick!);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the time-sensitive symptom and fixed ECG trajectory before recording the response');
    expect(transcript).toContain('Activate EMS and the receiving reperfusion pathway before recording the clinic bridge');
    expect(transcript).toContain('allow the next engine tick before reassessment and handoff');
    expect(recovered.patient.transferAtTick).toBeLessThan(recovered.patient.bridgeAtTick!);
    expect(recovered.patient.bridgeAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('keeps the clinic a clinic and gives nothing away downstream', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.pciCapableSetting).toBe(false);
    expect(expert.patient.biomarkerDelayUsed).toBe(false);
    expect(expert.patient.downstreamTherapySelected).toBe(false);
    const transcript = JSON.stringify(expert.events);
    expect(transcript).toContain('Private transport and biomarker delay were rejected');
    expect(transcript).toContain('the regional system retains individualized destination and reperfusion selection');
    expect(transcript).toContain('No drug was delivered');
    expect(transcript).toContain('The ECG was not acquired or interpreted in this lab');
  });
});
