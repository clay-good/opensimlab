/**
 * Reference transcripts for the delayed-vasopressor-delivery lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that the classification is gated behind
 * the trace, so a well-fitting answer cannot be reached before the 0.6 mL of
 * drug-free downstream volume it rests on has been reviewed.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { DELAYED_VASOPRESSOR_DELIVERY as SCENARIO } from '../../src/modules/critical-care/scenarios/delayed-vasopressor-delivery';
import { DELAYED_VASOPRESSOR_DELIVERY_FIXTURES as FIXTURES } from '../../src/modules/critical-care/delayed-vasopressor-delivery-fixtures';
import {
  DELAYED_VASOPRESSOR_DELIVERY_ACTIONS, supportsDelayedVasopressorDelivery,
  type DelayedVasopressorDeliveryAction,
} from '../../src/modules/critical-care/delayed-vasopressor-delivery';
import { delayedVasopressorDeliveryCompletionEvidence } from '../../src/modules/critical-care/delayed-vasopressor-delivery-completion';
import { delayedVasopressorDeliveryInlinePrompt } from '../../src/modules/critical-care/tutor/delayed-vasopressor-delivery-guidance';

type Choices = readonly (readonly [number, DelayedVasopressorDeliveryAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: DelayedVasopressorDeliveryAction): LearnerAction => ({ tick, type: 'delayed-vasopressor-delivery-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.delayedVasopressorDeliveryAssessment);
    const prompt = delayedVasopressorDeliveryInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.delayedVasopressorDeliveryAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.delayedVasopressorDeliveryAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.delayedVasopressorDeliveryAssessment! };
}

describe('Delayed vasopressor delivery transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(DELAYED_VASOPRESSOR_DELIVERY_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...DELAYED_VASOPRESSOR_DELIVERY_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsDelayedVasopressorDelivery(SCENARIO)).toBe(true);
    expect(supportsDelayedVasopressorDelivery({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'delayed-vasopressor-delivery-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(delayedVasopressorDeliveryCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(delayedVasopressorDeliveryCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(delayedVasopressorDeliveryCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(delayedVasopressorDeliveryCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(idle.patient.discordanceAtTick).toBeNull();
  });

  it('refuses the classification when the path was never traced', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.discordanceAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      pathAtTick: null, classifiedAtTick: null,
      protocolAtTick: null, reassessedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Trace the full declared source-to-patient path before classifying the delay');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review command-versus-delivery discordance before tracing or correcting the infusion path');
    expect(transcript).toContain('Classify the fixed delivery pattern while preserving alternatives before activating a correction plan');
    expect(recovered.patient.discordanceAtTick).toBeLessThan(recovered.patient.pathAtTick!);
    expect(recovered.patient.pathAtTick).toBeLessThan(recovered.patient.classifiedAtTick!);
    expect(recovered.patient.classifiedAtTick).toBeLessThan(recovered.patient.protocolAtTick!);
    expect(recovered.patient.protocolAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every later step before the discordance is reconciled', () => {
    for (const action of DELAYED_VASOPRESSOR_DELIVERY_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review command-versus-delivery discordance before tracing or correcting the infusion path');
      expect(refused.patient.discordanceAtTick).toBeNull();
    }
  });

  it('refuses the reassessment until the safe-start plan is on the record', () => {
    const short = run([[0, 'review-vasopressor-command-delivery-discordance'],
      [1, 'trace-vasopressor-source-to-patient-path'],
      [2, 'classify-vasopressor-dead-space-startup-delay'],
      [3, 'reassess-vasopressor-delivery-and-perfusion']], 5);
    expect(JSON.stringify(short.events))
      .toContain('Activate the bounded safe-start or changeover plan before reassessing delivery and perfusion');
    expect(short.patient.reassessedAtTick).toBeNull();
  });
});
