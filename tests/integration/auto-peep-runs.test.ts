/**
 * Reference transcripts for the auto-PEEP lesson, replayed through the real
 * engine.
 *
 * The assertion this file exists for is that the correction is gated behind
 * both the expiratory hold and the classification, so a setting cannot be
 * changed for a trapping nobody has measured or explained.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { AUTO_PEEP as SCENARIO } from '../../src/modules/critical-care/scenarios/auto-peep';
import { AUTO_PEEP_FIXTURES as FIXTURES } from '../../src/modules/critical-care/auto-peep-fixtures';
import { AUTO_PEEP_ACTIONS, supportsAutoPeep, type AutoPeepAction } from '../../src/modules/critical-care/auto-peep';
import { autoPeepCompletionEvidence } from '../../src/modules/critical-care/auto-peep-completion';
import { autoPeepInlinePrompt } from '../../src/modules/critical-care/tutor/auto-peep-guidance';

type Choices = readonly (readonly [number, AutoPeepAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: AutoPeepAction): LearnerAction => ({ tick, type: 'auto-peep-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.autoPeepAssessment);
    const prompt = autoPeepInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.autoPeepAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.autoPeepAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.autoPeepAssessment! };
}

describe('Auto-PEEP transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(AUTO_PEEP_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...AUTO_PEEP_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsAutoPeep(SCENARIO)).toBe(true);
    expect(supportsAutoPeep({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'auto-peep-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(autoPeepCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(autoPeepCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(autoPeepCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(autoPeepCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(expert.patient.reassessmentAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.flowAtTick).toBeNull();
  });

  it('refuses a correction for a trapping nobody has measured', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.flowAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      measurementAtTick: null, classificationAtTick: null,
      correctionAtTick: null, reassessmentAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the valid passive expiratory-hold panel before classifying the pattern');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessmentAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review the patient, expiratory flow, timing, pressures, gas exchange, and circulation first');
    expect(transcript).toContain('Classify the observed and measured pattern before recording a correction');
    expect(recovered.patient.flowAtTick).toBeLessThan(recovered.patient.measurementAtTick!);
    expect(recovered.patient.measurementAtTick).toBeLessThan(recovered.patient.classificationAtTick!);
    expect(recovered.patient.classificationAtTick).toBeLessThan(recovered.patient.correctionAtTick!);
    expect(recovered.patient.correctionAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
  });

  it('refuses every later step before the flow and the patient are read together', () => {
    for (const action of AUTO_PEEP_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review the patient, expiratory flow, timing, pressures, gas exchange, and circulation first');
      expect(refused.patient.flowAtTick).toBeNull();
    }
  });

  it('reports the three PEEPs as separate numbers', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const transcript = JSON.stringify(expert.events);
    expect(transcript).toContain('16');
    expect(transcript).toContain('11');
    expect(expert.patient.measurementAtTick).not.toBeNull();
  });
});
