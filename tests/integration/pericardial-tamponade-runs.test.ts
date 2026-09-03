/**
 * Reference transcripts for the pericardial-tamponade lesson, replayed through
 * the real engine.
 *
 * The assertion this file exists for is that a comfortable patient is not a
 * finished review: the handoff refuses until both the etiology and the
 * surveillance lanes have landed, whichever order they came in.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PERICARDIAL_TAMPONADE as SCENARIO } from '../../src/modules/cardiology/scenarios/pericardial-tamponade';
import { PERICARDIAL_TAMPONADE_FIXTURES as FIXTURES } from '../../src/modules/cardiology/pericardial-tamponade-fixtures';
import {
  PERICARDIAL_TAMPONADE_ACTIONS, supportsPericardialTamponade,
  type PericardialTamponadeAction,
} from '../../src/modules/cardiology/pericardial-tamponade';
import { pericardialTamponadeCompletionEvidence } from '../../src/modules/cardiology/pericardial-tamponade-completion';
import { pericardialTamponadeInlinePrompt } from '../../src/modules/cardiology/tutor/pericardial-tamponade-guidance';

type Choices = readonly (readonly [number, PericardialTamponadeAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PericardialTamponadeAction): LearnerAction => ({ tick, type: 'pericardial-tamponade-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.pericardialTamponadeAssessment);
    const prompt = pericardialTamponadeInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pericardialTamponadeAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pericardialTamponadeAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.pericardialTamponadeAssessment;
    if (patient) {
      expect(patient.initialPulsePresent).toBe(true);
      expect(patient.treatmentDeliveredByLearner).toBe(false);
      expect(patient.imageAcquiredByLearner).toBe(false);
      expect(patient.procedurePerformedByLearner).toBe(false);
      expect(patient.catheterManipulatedByLearner).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pericardialTamponadeAssessment! };
}

describe('Pericardial tamponade transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(PERICARDIAL_TAMPONADE_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...PERICARDIAL_TAMPONADE_ACTIONS]);
    // No rhythm-change event: two narratives share the reassessment target.
    expect(SCENARIO.timeline.every((event) => event.type === 'narrative')).toBe(true);
    expect(supportsPericardialTamponade(SCENARIO)).toBe(true);
    expect(supportsPericardialTamponade({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.id !== 'pericardial-tamponade-current-state'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'clinic', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(pericardialTamponadeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(9);
    expect(pericardialTamponadeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(pericardialTamponadeCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(pericardialTamponadeCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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

  it('refuses the handoff when a comfortable patient is treated as a finished review', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.drainageResponseAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      etiologyAtTick: null, surveillanceAtTick: null, handoffAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Complete both the etiology and recurrence-surveillance lanes before the later reassessment handoff');
  });

  it('accepts the closing pair in the other order and clears the time gate', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the clinical, hemodynamic, and fixed echo trajectory before reviewing drainage, cause, or surveillance');
    expect(transcript).toContain('Review the reported drainage and current response before opening cause and recurrence-surveillance work');
    expect(transcript).toContain('Allow a later simulated tick before reviewing the authored follow-up and handing off open work');
    expect(recovered.patient.surveillanceAtTick).toBeLessThan(recovered.patient.etiologyAtTick!);
    expect(recovered.patient.drainageResponseAtTick).toBeLessThan(recovered.patient.surveillanceAtTick!);
    expect(recovered.patient.etiologyAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('refuses every later step before the trajectory is reconciled', () => {
    for (const action of PERICARDIAL_TAMPONADE_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Reconcile the clinical, hemodynamic, and fixed echo trajectory before reviewing drainage, cause, or surveillance');
      expect(refused.patient.trajectoryAtTick).toBeNull();
    }
  });

  it('leaves the drainage as somebody else’s prior care and never touches the catheter', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.procedurePerformedByLearner).toBe(false);
    expect(expert.patient.catheterManipulatedByLearner).toBe(false);
    expect(expert.patient.imageAcquiredByLearner).toBe(false);
  });
});
