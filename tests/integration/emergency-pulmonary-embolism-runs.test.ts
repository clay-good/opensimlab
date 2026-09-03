/**
 * Reference transcripts for the emergency pulmonary-embolism lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that the escalation is gated behind
 * the reassessment: the patient arrives normotensive and becomes shocked while
 * being treated correctly, so the deterioration has to be looked for before it
 * can be acted on.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PULMONARY_EMBOLISM_DETERIORATION as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/pulmonary-embolism-deterioration';
import { PULMONARY_EMBOLISM_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/pulmonary-embolism-deterioration-fixtures';
import {
  PULMONARY_EMBOLISM_ACTIONS, PULMONARY_EMBOLISM_OBJECTIVES,
  PULMONARY_EMBOLISM_PARALLEL_ACTIONS, supportsPulmonaryEmbolism,
  type PulmonaryEmbolismAction,
} from '../../src/modules/emergency-medicine/pulmonary-embolism-deterioration';
import { pulmonaryEmbolismCompletionEvidence } from '../../src/modules/emergency-medicine/pulmonary-embolism-deterioration-completion';
import { pulmonaryEmbolismInlinePrompt } from '../../src/modules/emergency-medicine/tutor/pulmonary-embolism-deterioration-guidance';

type Choices = readonly (readonly [number, PulmonaryEmbolismAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PulmonaryEmbolismAction): LearnerAction => ({ tick, type: 'pulmonary-embolism-deterioration-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.pulmonaryEmbolismAssessment);
    const prompt = pulmonaryEmbolismInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pulmonaryEmbolismAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pulmonaryEmbolismAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pulmonaryEmbolismAssessment! };
}

describe('Emergency pulmonary embolism transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(PULMONARY_EMBOLISM_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(SCENARIO.timeline).toHaveLength(1);
    expect(supportsPulmonaryEmbolism(SCENARIO)).toBe(true);
    expect(supportsPulmonaryEmbolism({ ...SCENARIO, timeline: [] })).toBe(false);
    expect(pulmonaryEmbolismCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(pulmonaryEmbolismCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(pulmonaryEmbolismCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(pulmonaryEmbolismCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...PULMONARY_EMBOLISM_OBJECTIVES]);
    expect([...PULMONARY_EMBOLISM_OBJECTIVES]).not.toEqual([...PULMONARY_EMBOLISM_ACTIONS.slice(0, 4)]);
    expect(supportsPulmonaryEmbolism({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: PULMONARY_EMBOLISM_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: PULMONARY_EMBOLISM_ACTIONS[index]!,
        })),
      },
    })).toBe(false);
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
      .toEqual(['met', 'met', 'met', 'met']);
    expect(expert.patient.escalationAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.severityReviewedAtTick).toBeNull();
  });

  it('records that invasive ventilation was not selected, and prefers no reperfusion method', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const oxygen = expert.events.find(({ eventId }) => eventId.startsWith('pulmonary-embolism-oxygen-'))!;
    expect(oxygen.data).toMatchObject({ intentOnly: true, invasiveVentilationSelected: false });
    expect(JSON.stringify(oxygen))
      .toContain('acute RV dysfunction can decompensate when compensatory sympathetic tone and preload are lost');
    const escalation = expert.events.find(({ eventId }) => eventId.startsWith('pulmonary-embolism-escalation-'))!;
    expect(escalation.data).toMatchObject({ intentOnly: true, category: 'E1' });
    expect(JSON.stringify(escalation)).toContain('none is performed or preferred here');
  });

  it('deteriorates on the correct path, with oxygenation improving as the pressure falls', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const deterioration = expert.events
      .find(({ eventId }) => eventId.startsWith('pulmonary-embolism-deterioration-recognized-'))!;
    const text = JSON.stringify(deterioration);
    expect(text).toContain('persistent BP 78/50 mmHg');
    expect(text).toContain('fixed lactate 4.8 mmol/L despite oxygenation improving to 92%');
    expect(text).toContain('Category E1 cardiopulmonary failure with cardiogenic shock');
  });

  it('refuses the escalation to a run that never looked again', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.anticoagulationAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({ deteriorationAtTick: null, escalationAtTick: null });
    expect(JSON.stringify(errored.events))
      .toContain('Reassess and recognize the authored cardiopulmonary deterioration before escalation.');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met']);
  });

  it('refuses the skipped review and the too-early reassessment, and still completes', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.escalationAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review the confirmed pulmonary embolism, severity markers, pressure, and perfusion first.');
    expect(transcript).toContain('then allow the next engine tick before serial reassessment');
    expect(recovered.patient.severityReviewedAtTick).toBeLessThan(recovered.patient.oxygenAtTick!);
    expect(recovered.patient.anticoagulationAtTick).toBeLessThan(recovered.patient.deteriorationAtTick!);
    expect(recovered.patient.deteriorationAtTick).toBeLessThan(recovered.patient.escalationAtTick!);
  });

  it('refuses every later step before the severity is reviewed', () => {
    for (const action of PULMONARY_EMBOLISM_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review the confirmed pulmonary embolism, severity markers, pressure, and perfusion first.');
      expect(refused.patient.severityReviewedAtTick).toBeNull();
    }
  });

  it('accepts the two initial intents in either order, because neither gates the other', () => {
    const orders: readonly (readonly PulmonaryEmbolismAction[])[] = [
      ['record-titrated-oxygen', 'record-therapeutic-anticoagulation-intent'],
      ['record-therapeutic-anticoagulation-intent', 'record-titrated-oxygen'],
    ];
    for (const order of orders) {
      const actions: Choices = [
        [0, 'review-confirmed-pe-severity'],
        ...order.map((action, index) => [index + 1, action] as const),
        [3, 'reassess-for-deterioration'],
        [4, 'activate-pert-and-record-reperfusion-intent'],
      ];
      const done = run(actions, 6);
      expect(done.patient.escalationAtTick, order.join(' → ')).not.toBeNull();
      expect(JSON.stringify(done.events), order.join(' → ')).not.toContain('order-refused');
      expect(findings(done.events).map(({ outcome }) => outcome))
        .toEqual(['met', 'met', 'met', 'met']);
    }
    expect(PULMONARY_EMBOLISM_PARALLEL_ACTIONS).toHaveLength(2);
  });
});
