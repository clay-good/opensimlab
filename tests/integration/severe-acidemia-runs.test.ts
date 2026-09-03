/**
 * Reference transcripts for the severe-acidemia lesson, replayed through the
 * real engine.
 *
 * The assertion this file exists for is that every stabilization choice is
 * gated behind the analysis, so a pH of 7.09 cannot be treated before the
 * compensation arithmetic has turned it into a diagnosis.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { SEVERE_ACIDEMIA as SCENARIO } from '../../src/modules/critical-care/scenarios/severe-acidemia';
import { SEVERE_ACIDEMIA_FIXTURES as FIXTURES } from '../../src/modules/critical-care/severe-acidemia-fixtures';
import {
  SEVERE_ACIDEMIA_ACTIONS, supportsSevereAcidemia, type SevereAcidemiaAction,
} from '../../src/modules/critical-care/severe-acidemia';
import { severeAcidemiaCompletionEvidence } from '../../src/modules/critical-care/severe-acidemia-completion';
import { severeAcidemiaInlinePrompt } from '../../src/modules/critical-care/tutor/severe-acidemia-guidance';

type Choices = readonly (readonly [number, SevereAcidemiaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: SevereAcidemiaAction): LearnerAction => ({ tick, type: 'severe-acidemia-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.severeAcidemiaAssessment);
    const prompt = severeAcidemiaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.severeAcidemiaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.severeAcidemiaAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.severeAcidemiaAssessment! };
}

describe('Severe acidemia transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SEVERE_ACIDEMIA_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...SEVERE_ACIDEMIA_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsSevereAcidemia(SCENARIO)).toBe(true);
    expect(supportsSevereAcidemia({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'severe-acidemia-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(severeAcidemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(severeAcidemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(severeAcidemiaCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(severeAcidemiaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(idle.patient.recognitionAtTick).toBeNull();
  });

  it('refuses the ventilation plan when the compensation arithmetic was never done', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      analysisAtTick: null, ventilationAtTick: null,
      causePlanAtTick: null, reassessmentAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Confirm the sample and map metabolic, respiratory, electrolyte, perfusion, kidney, and cause context before stabilization choices');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessmentAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Recognize the severe gas and organ trajectory and activate experienced help first');
    expect(transcript).toContain('Protect safe ventilatory compensation before reviewing the cause-directed and buffer or kidney-support plan');
    expect(recovered.patient.recognitionAtTick).toBeLessThan(recovered.patient.analysisAtTick!);
    expect(recovered.patient.analysisAtTick).toBeLessThan(recovered.patient.ventilationAtTick!);
    expect(recovered.patient.ventilationAtTick).toBeLessThan(recovered.patient.causePlanAtTick!);
    expect(recovered.patient.causePlanAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
  });

  it('refuses every later step before the severity is recognized', () => {
    for (const action of SEVERE_ACIDEMIA_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Recognize the severe gas and organ trajectory and activate experienced help first');
      expect(refused.patient.recognitionAtTick).toBeNull();
    }
  });

  it('refuses the reassessment until the cause plan is on the record', () => {
    const short = run([[0, 'recognize-severe-acidemia'], [1, 'analyze-severe-acidemia-context'],
      [2, 'protect-severe-acidemia-ventilation'], [3, 'reassess-severe-acidemia-trajectory']], 5);
    expect(JSON.stringify(short.events))
      .toContain('Activate cause-directed care and individualized buffer and kidney-support planning before reviewing the fixed response');
    expect(short.patient.reassessmentAtTick).toBeNull();
  });
});
