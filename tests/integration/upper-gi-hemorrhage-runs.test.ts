/**
 * Reference transcripts for the recurrent upper-GI-hemorrhage lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that the resuscitation is gated behind
 * the pattern review, so the airway, the coagulation and the alternate sources
 * are still open when the obvious answer arrives.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { UPPER_GI_HEMORRHAGE as SCENARIO } from '../../src/modules/critical-care/scenarios/upper-gi-hemorrhage';
import { UPPER_GI_HEMORRHAGE_FIXTURES as FIXTURES } from '../../src/modules/critical-care/upper-gi-hemorrhage-fixtures';
import {
  UPPER_GI_HEMORRHAGE_ACTIONS, supportsUpperGiHemorrhage, type UpperGiHemorrhageAction,
} from '../../src/modules/critical-care/upper-gi-hemorrhage';
import { upperGiHemorrhageCompletionEvidence } from '../../src/modules/critical-care/upper-gi-hemorrhage-completion';
import { upperGiHemorrhageInlinePrompt } from '../../src/modules/critical-care/tutor/upper-gi-hemorrhage-guidance';

type Choices = readonly (readonly [number, UpperGiHemorrhageAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: UpperGiHemorrhageAction): LearnerAction => ({ tick, type: 'upper-gi-hemorrhage-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.upperGiHemorrhageAssessment);
    const prompt = upperGiHemorrhageInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.upperGiHemorrhageAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.upperGiHemorrhageAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.upperGiHemorrhageAssessment! };
}

describe('Recurrent upper GI hemorrhage transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(UPPER_GI_HEMORRHAGE_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...UPPER_GI_HEMORRHAGE_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsUpperGiHemorrhage(SCENARIO)).toBe(true);
    expect(supportsUpperGiHemorrhage({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'upper-gi-hemorrhage-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(upperGiHemorrhageCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(upperGiHemorrhageCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(upperGiHemorrhageCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(upperGiHemorrhageCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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

  it('refuses the resuscitation record when nobody said what else could be bleeding', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      patternAtTick: null, resuscitationAtTick: null,
      hemostasisAtTick: null, reassessmentAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the fixed bleeding, perfusion, airway, medication, and alternate-source context before recording resuscitation');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessmentAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Recognize the recurrent bleeding and impaired-perfusion trajectory and activate experienced help first');
    expect(transcript).toContain('Record individualized resuscitation and transfusion review before definitive-hemostasis escalation');
    expect(recovered.patient.recognitionAtTick).toBeLessThan(recovered.patient.patternAtTick!);
    expect(recovered.patient.patternAtTick).toBeLessThan(recovered.patient.resuscitationAtTick!);
    expect(recovered.patient.resuscitationAtTick).toBeLessThan(recovered.patient.hemostasisAtTick!);
    expect(recovered.patient.hemostasisAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
  });

  it('refuses every later step before the recurrence is recognized', () => {
    for (const action of UPPER_GI_HEMORRHAGE_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Recognize the recurrent bleeding and impaired-perfusion trajectory and activate experienced help first');
      expect(refused.patient.recognitionAtTick).toBeNull();
    }
  });

  it('refuses the reassessment until the endoscopy pathway is on the record', () => {
    const short = run([[0, 'recognize-recurrent-upper-gi-hemorrhage'],
      [1, 'review-upper-gi-hemorrhage-pattern'],
      [2, 'record-upper-gi-hemorrhage-resuscitation'],
      [3, 'reassess-upper-gi-hemorrhage-trajectory']], 5);
    expect(JSON.stringify(short.events))
      .toContain('Activate repeat endoscopy and preserve failure pathways before reviewing the fixed response');
    expect(short.patient.reassessmentAtTick).toBeNull();
  });
});
