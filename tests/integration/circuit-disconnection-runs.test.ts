/**
 * Reference transcripts for the ventilator circuit-disconnection lesson,
 * replayed through the real engine.
 *
 * The assertion this file exists for is the position of the bridge: the
 * inspection is gated behind it, so the circuit cannot be traced while the
 * patient goes unoxygenated — even though tracing it leads to the right fix.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { VENTILATOR_CIRCUIT_DISCONNECTION as SCENARIO } from '../../src/modules/critical-care/scenarios/ventilator-circuit-disconnection';
import { CIRCUIT_DISCONNECTION_FIXTURES as FIXTURES } from '../../src/modules/critical-care/circuit-disconnection-fixtures';
import {
  CIRCUIT_DISCONNECTION_ACTIONS, supportsCircuitDisconnection, type CircuitDisconnectionAction,
} from '../../src/modules/critical-care/circuit-disconnection';
import { circuitDisconnectionCompletionEvidence } from '../../src/modules/critical-care/circuit-disconnection-completion';
import { circuitDisconnectionInlinePrompt } from '../../src/modules/critical-care/tutor/circuit-disconnection-guidance';

type Choices = readonly (readonly [number, CircuitDisconnectionAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: CircuitDisconnectionAction): LearnerAction => ({ tick, type: 'ventilator-circuit-disconnection-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.ventilatorCircuitDisconnectionAssessment);
    const prompt = circuitDisconnectionInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.ventilatorCircuitDisconnectionAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.ventilatorCircuitDisconnectionAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.ventilatorCircuitDisconnectionAssessment! };
}

describe('Circuit-disconnection transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(CIRCUIT_DISCONNECTION_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...CIRCUIT_DISCONNECTION_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsCircuitDisconnection(SCENARIO)).toBe(true);
    expect(supportsCircuitDisconnection({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'ventilator-circuit-disconnection-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(circuitDisconnectionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(circuitDisconnectionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(circuitDisconnectionCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(circuitDisconnectionCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(idle.patient.recognizedAtTick).toBeNull();
  });

  it('refuses the circuit trace while nobody is oxygenating him', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.recognizedAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      bridgedAtTick: null, inspectedAtTick: null,
      restoredAtTick: null, reassessedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Record immediate help and alternative oxygenation and ventilation intent before troubleshooting the circuit');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Recognize loss of delivered ventilation from the patient and independent signals before continuing');
    expect(transcript).toContain('Trace the patient, airway, circuit, ventilator, and gas source before recording restoration');
    expect(recovered.patient.recognizedAtTick).toBeLessThan(recovered.patient.bridgedAtTick!);
    expect(recovered.patient.bridgedAtTick).toBeLessThan(recovered.patient.inspectedAtTick!);
    expect(recovered.patient.inspectedAtTick).toBeLessThan(recovered.patient.restoredAtTick!);
    expect(recovered.patient.restoredAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every later step before the loss is recognised', () => {
    for (const action of CIRCUIT_DISCONNECTION_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Recognize loss of delivered ventilation from the patient and independent signals before continuing');
      expect(refused.patient.recognizedAtTick).toBeNull();
    }
  });

  it('keeps the bridge ahead of the inspection on the expert path', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.bridgedAtTick).toBeLessThan(expert.patient.inspectedAtTick!);
  });
});
