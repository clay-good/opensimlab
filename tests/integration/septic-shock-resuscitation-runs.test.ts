/**
 * Reference transcripts for the persistent septic-shock lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is the chain: the plan is gated behind
 * both the perfusion review and the dynamic test, so the sequence that ends in
 * another bolus cannot be walked.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { SEPTIC_SHOCK_RESUSCITATION as SCENARIO } from '../../src/modules/critical-care/scenarios/septic-shock-resuscitation';
import { SEPTIC_SHOCK_RESUSCITATION_FIXTURES as FIXTURES } from '../../src/modules/critical-care/septic-shock-resuscitation-fixtures';
import {
  SEPTIC_SHOCK_RESUSCITATION_ACTIONS, supportsSepticShockResuscitation,
  type SepticShockResuscitationAction,
} from '../../src/modules/critical-care/septic-shock-resuscitation';
import { septicShockResuscitationCompletionEvidence } from '../../src/modules/critical-care/septic-shock-resuscitation-completion';
import { septicShockResuscitationInlinePrompt } from '../../src/modules/critical-care/tutor/septic-shock-resuscitation-guidance';

type Choices = readonly (readonly [number, SepticShockResuscitationAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: SepticShockResuscitationAction): LearnerAction => ({ tick, type: 'septic-shock-resuscitation-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.septicShockResuscitationAssessment);
    const prompt = septicShockResuscitationInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.septicShockResuscitationAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.septicShockResuscitationAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.septicShockResuscitationAssessment;
    if (patient) {
      expect(patient.passiveLegRaiseStrokeVolumeChangePercent).toBe(2);
      expect(patient.blindRepeatFluidOffered).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.septicShockResuscitationAssessment! };
}

describe('Persistent septic-shock transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SEPTIC_SHOCK_RESUSCITATION_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...SEPTIC_SHOCK_RESUSCITATION_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsSepticShockResuscitation(SCENARIO)).toBe(true);
    expect(supportsSepticShockResuscitation({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'septic-shock-resuscitation-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(septicShockResuscitationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(septicShockResuscitationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(septicShockResuscitationCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(septicShockResuscitationCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(expert.patient.reassessedAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.contextAtTick).toBeNull();
  });

  it('puts two steps in the way of the plan, which is where another bolus would come from', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.contextAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      perfusionAtTick: null, fluidResponseAtTick: null, planAtTick: null, reassessedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review serial tissue perfusion before testing whether further fluid has a target');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile prior resuscitation claims before reassessing or changing the plan');
    expect(transcript).toContain('Review serial tissue perfusion before testing whether further fluid has a target');
    expect(recovered.patient.contextAtTick).toBeLessThan(recovered.patient.perfusionAtTick!);
    expect(recovered.patient.perfusionAtTick).toBeLessThan(recovered.patient.fluidResponseAtTick!);
    expect(recovered.patient.fluidResponseAtTick).toBeLessThan(recovered.patient.planAtTick!);
    expect(recovered.patient.planAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every later step before the prior claims are separated', () => {
    for (const action of SEPTIC_SHOCK_RESUSCITATION_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Reconcile prior resuscitation claims before reassessing or changing the plan');
      expect(refused.patient.contextAtTick).toBeNull();
    }
  });

  it('never offers a blind repeat bolus and keeps the dynamic finding fixed', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.blindRepeatFluidOffered).toBe(false);
    expect(expert.patient.passiveLegRaiseStrokeVolumeChangePercent).toBe(2);
    const transcript = JSON.stringify(expert.events);
    expect(transcript).toContain('48 to 49 mL');
    expect(transcript).toContain('MAP 68 mmHg');
  });
});
