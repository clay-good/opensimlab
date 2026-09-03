/**
 * Reference transcripts for the escalating-hypoxemia lesson, replayed through
 * the real engine.
 *
 * The assertion this file exists for is that the bedside pattern is gated
 * behind the delivery-path review, so a sick lung cannot explain a
 * desaturation before anybody has checked the circuit and the tube.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ESCALATING_HYPOXEMIA as SCENARIO } from '../../src/modules/critical-care/scenarios/escalating-hypoxemia';
import { ESCALATING_HYPOXEMIA_FIXTURES as FIXTURES } from '../../src/modules/critical-care/escalating-hypoxemia-fixtures';
import {
  ESCALATING_HYPOXEMIA_ACTIONS, ESCALATING_HYPOXEMIA_OBJECTIVES,
  supportsEscalatingHypoxemia, type EscalatingHypoxemiaAction,
} from '../../src/modules/critical-care/escalating-hypoxemia';
import { escalatingHypoxemiaCompletionEvidence } from '../../src/modules/critical-care/escalating-hypoxemia-completion';
import { escalatingHypoxemiaInlinePrompt } from '../../src/modules/critical-care/tutor/escalating-hypoxemia-guidance';

type Choices = readonly (readonly [number, EscalatingHypoxemiaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: EscalatingHypoxemiaAction): LearnerAction => ({ tick, type: 'escalating-hypoxemia-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.escalatingHypoxemiaAssessment);
    const prompt = escalatingHypoxemiaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.escalatingHypoxemiaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.escalatingHypoxemiaAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.escalatingHypoxemiaAssessment! };
}

describe('Escalating-hypoxemia transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(ESCALATING_HYPOXEMIA_ACTIONS).toHaveLength(5);
    // The action the engine accepts and the objective it satisfies are not the
    // same string for the third step, so the guard compares objectives.
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...ESCALATING_HYPOXEMIA_OBJECTIVES]);
    expect(ESCALATING_HYPOXEMIA_ACTIONS[2]).toBe('trace-hypoxemia-delivery-path');
    expect(ESCALATING_HYPOXEMIA_OBJECTIVES[2]).toBe('trace-oxygen-delivery-path');
    expect(supportsEscalatingHypoxemia({
      ...SCENARIO,
      metadata: { ...SCENARIO.metadata, objectives: SCENARIO.metadata.objectives.map((objective, index) =>
        (index === 2 ? { ...objective, id: 'trace-hypoxemia-delivery-path' } : objective)) },
    })).toBe(false);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsEscalatingHypoxemia(SCENARIO)).toBe(true);
    expect(supportsEscalatingHypoxemia({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'escalating-hypoxemia-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(escalatingHypoxemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(escalatingHypoxemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(escalatingHypoxemiaCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(escalatingHypoxemiaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(expert.patient.escalationAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.signalAtTick).toBeNull();
  });

  it('refuses the chest before the oxygen path has been traced', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.signalAtTick).not.toBeNull();
    expect(errored.patient.supportAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      deliveryPathAtTick: null, bedsidePatternAtTick: null, escalationAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Trace the oxygen source, circuit, tube, capnography, and suction path before narrowing the differential');
    expect(findings(errored.events).filter(({ outcome }) => outcome === 'met')).toHaveLength(2);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.escalationAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Corroborate the urgent saturation decline before narrowing the problem');
    expect(transcript).toContain('Trace the oxygen source, circuit, tube, capnography, and suction path before narrowing the differential');
    expect(recovered.patient.signalAtTick).toBeLessThan(recovered.patient.supportAtTick!);
    expect(recovered.patient.supportAtTick).toBeLessThan(recovered.patient.deliveryPathAtTick!);
    expect(recovered.patient.deliveryPathAtTick).toBeLessThan(recovered.patient.bedsidePatternAtTick!);
    expect(recovered.patient.bedsidePatternAtTick).toBeLessThan(recovered.patient.escalationAtTick!);
  });

  it('refuses every later step before the signal is corroborated', () => {
    for (const action of ESCALATING_HYPOXEMIA_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Corroborate the urgent saturation decline before narrowing the problem');
      expect(refused.patient.signalAtTick).toBeNull();
    }
  });

  it('keeps the delivery path ahead of the bedside pattern on the expert path', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.deliveryPathAtTick).toBeLessThan(expert.patient.bedsidePatternAtTick!);
  });
});
