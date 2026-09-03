/**
 * Reference transcripts for the hypertensive-emergency lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is the gate after the opening: nothing at
 * all is available until the acute organ injury has been reviewed, because the
 * injury rather than the pressure is what makes this an emergency.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { HYPERTENSIVE_EMERGENCY as SCENARIO } from '../../src/modules/cardiology/scenarios/hypertensive-emergency';
import { HYPERTENSIVE_EMERGENCY_FIXTURES as FIXTURES } from '../../src/modules/cardiology/hypertensive-emergency-fixtures';
import {
  HYPERTENSIVE_EMERGENCY_ACTIONS, supportsHypertensiveEmergency,
  type HypertensiveEmergencyAction,
} from '../../src/modules/cardiology/hypertensive-emergency';
import { hypertensiveEmergencyCompletionEvidence } from '../../src/modules/cardiology/hypertensive-emergency-completion';
import { hypertensiveEmergencyInlinePrompt } from '../../src/modules/cardiology/tutor/hypertensive-emergency-guidance';

type Choices = readonly (readonly [number, HypertensiveEmergencyAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: HypertensiveEmergencyAction): LearnerAction => ({ tick, type: 'hypertensive-emergency-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.hypertensiveEmergencyAssessment);
    const prompt = hypertensiveEmergencyInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.hypertensiveEmergencyAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.hypertensiveEmergencyAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.hypertensiveEmergencyAssessment;
    if (patient) {
      expect(patient.initialPulsePresent).toBe(true);
      expect(patient.acuteTargetOrganDamage).toBe(true);
      expect(patient.drugSelected).toBe(false);
      expect(patient.doseSelected).toBe(false);
      expect(patient.infusionRateSelected).toBe(false);
      expect(patient.universalTargetSelected).toBe(false);
      expect(patient.rapidNormalizationSelected).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.hypertensiveEmergencyAssessment! };
}

describe('Hypertensive emergency transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(HYPERTENSIVE_EMERGENCY_ACTIONS).toHaveLength(6);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...HYPERTENSIVE_EMERGENCY_ACTIONS]);
    // Four narratives, no state event: three share the lesson target.
    expect(SCENARIO.timeline).toHaveLength(4);
    expect(SCENARIO.timeline.every((event) => event.type === 'narrative')).toBe(true);
    expect(supportsHypertensiveEmergency(SCENARIO)).toBe(true);
    expect(supportsHypertensiveEmergency({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.id !== 'hypertensive-emergency-phenotype'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'clinic', 'state_transition');
    expect(audit.complete).toBe(false);
    // Six objectives, so the observable-objectives cap stays outstanding too.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(hypertensiveEmergencyCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(9);
    expect(hypertensiveEmergencyCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(hypertensiveEmergencyCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(hypertensiveEmergencyCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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
    // The reduction intent lands before the phenotype review, and nothing objects.
    expect(expert.patient.reductionIntentAtTick).toBeLessThan(expert.patient.phenotypeAtTick!);
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.measurementAtTick).toBeNull();
  });

  it('refuses everything when the number is treated without finding the injury', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.measurementAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      organInjuryAtTick: null, phenotypeAtTick: null, reductionIntentAtTick: null,
      laterPanelAtTick: null, handoffAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the authored acute target-organ injury before opening phenotype, causes, or controlled-reduction intent');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('accepts the closing pair in the other order and clears both time gates', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the authored measurement conditions and whole-patient pressure trajectory before reviewing organ injury');
    expect(transcript).toContain('Allow a later simulated tick before reviewing the authored 45-minute panel');
    expect(transcript).toContain('Allow another later simulated tick before the 3-hour reassessment handoff');
    expect(recovered.patient.phenotypeAtTick).toBeLessThan(recovered.patient.reductionIntentAtTick!);
    expect(recovered.patient.reductionIntentAtTick).toBeLessThan(recovered.patient.laterPanelAtTick!);
    expect(recovered.patient.laterPanelAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('refuses every later step before the measurement is verified', () => {
    for (const action of HYPERTENSIVE_EMERGENCY_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Reconcile the authored measurement conditions and whole-patient pressure trajectory before reviewing organ injury');
      expect(refused.patient.measurementAtTick).toBeNull();
    }
  });

  it('keeps the emergency real and every recipe absent', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.acuteTargetOrganDamage).toBe(true);
    expect(expert.patient.rapidNormalizationSelected).toBe(false);
    expect(expert.patient.outcomePredicted).toBe(false);
    const transcript = JSON.stringify(expert.events);
    expect(transcript).toContain('BP 212/122 mmHg');
    expect(transcript).toContain('BP 188/106 mmHg');
  });
});
