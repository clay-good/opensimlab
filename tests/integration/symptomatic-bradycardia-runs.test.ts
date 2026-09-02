/**
 * Reference transcripts for the symptomatic sinus-bradycardia lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is the unordered pair: two review lanes
 * the engine accepts in either order, a referral that refuses until both have
 * landed, and a patient whose rhythm and medication never change.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { SYMPTOMATIC_SINUS_BRADYCARDIA_REASSESSMENT as SCENARIO } from '../../src/modules/cardiology/scenarios/symptomatic-sinus-bradycardia-reassessment';
import { SYMPTOMATIC_BRADYCARDIA_FIXTURES as FIXTURES } from '../../src/modules/cardiology/symptomatic-bradycardia-fixtures';
import {
  SYMPTOMATIC_BRADYCARDIA_ACTIONS, supportsSymptomaticBradycardia,
  type SymptomaticBradycardiaAction,
} from '../../src/modules/cardiology/symptomatic-bradycardia';
import { symptomaticBradycardiaCompletionEvidence } from '../../src/modules/cardiology/symptomatic-bradycardia-completion';
import { symptomaticBradycardiaInlinePrompt } from '../../src/modules/cardiology/tutor/symptomatic-bradycardia-guidance';

type Choices = readonly (readonly [number, SymptomaticBradycardiaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: SymptomaticBradycardiaAction): LearnerAction => ({ tick, type: 'symptomatic-bradycardia-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.symptomaticBradycardiaAssessment);
    const prompt = symptomaticBradycardiaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.symptomaticBradycardiaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.symptomaticBradycardiaAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.symptomaticBradycardiaAssessment;
    if (patient) {
      expect(patient.hemodynamicallyStable).toBe(true);
      expect(patient.mechanismProven).toBe(false);
      expect(patient.treatmentDelivered).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.symptomaticBradycardiaAssessment! };
}

describe('Symptomatic bradycardia transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    // Five recorded steps, five declared objectives, and the same five ids.
    expect(SYMPTOMATIC_BRADYCARDIA_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...SYMPTOMATIC_BRADYCARDIA_ACTIONS]);
    expect(supportsSymptomaticBradycardia(SCENARIO)).toBe(true);
    expect(supportsSymptomaticBradycardia({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'symptomatic-sinus-bradycardia-reassessment-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'clinic', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(symptomaticBradycardiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(8);
    expect(symptomaticBradycardiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(symptomaticBradycardiaCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(symptomaticBradycardiaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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
    expect(idle.patient.stabilityAtTick).toBeNull();
  });

  it('refuses the referral when only one review lane has been taken', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.correlationAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      contextAtTick: null, pacingEvaluationAtTick: null, handoffAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Complete both reversible-context and symptom-rhythm correlation review before pacing evaluation');
    // Stability and correlation land; the referral, the context and the handoff do not.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'met', 'not-met', 'not-met']);
  });

  it('accepts the review lanes in the other order and still completes', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile rate, pulse, symptoms, and current stability before longitudinal review');
    expect(transcript).toContain('Record the shared pacing evaluation before closing the longitudinal plan');
    // The correlation precedes the context, and nothing objects to that.
    expect(recovered.patient.correlationAtTick).toBeLessThan(recovered.patient.contextAtTick!);
    expect(recovered.patient.stabilityAtTick).toBeLessThan(recovered.patient.correlationAtTick!);
    expect(recovered.patient.contextAtTick).toBeLessThan(recovered.patient.pacingEvaluationAtTick!);
    expect(recovered.patient.pacingEvaluationAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('refuses every longitudinal step before stability is reconciled', () => {
    for (const action of SYMPTOMATIC_BRADYCARDIA_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Reconcile rate, pulse, symptoms, and current stability before longitudinal review');
      expect(refused.patient.stabilityAtTick).toBeNull();
    }
  });

  it('changes no rhythm, no medication, and no certainty', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.hemodynamicallyStable).toBe(true);
    expect(expert.patient.mechanismProven).toBe(false);
    expect(expert.patient.treatmentDelivered).toBe(false);
  });
});
