/**
 * Reference transcripts for the massive pulmonary-embolism lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that the bridge is gated behind both
 * the pattern review and the support review, so it cannot become the whole
 * response to a patient whose bleeding risk nobody has looked at.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { MASSIVE_PULMONARY_EMBOLISM as SCENARIO } from '../../src/modules/critical-care/scenarios/massive-pulmonary-embolism';
import { MASSIVE_PE_FIXTURES as FIXTURES } from '../../src/modules/critical-care/massive-pe-fixtures';
import { MASSIVE_PE_ACTIONS, supportsMassivePe, type MassivePeAction } from '../../src/modules/critical-care/massive-pe';
import { massivePeCompletionEvidence } from '../../src/modules/critical-care/massive-pe-completion';
import { massivePeInlinePrompt } from '../../src/modules/critical-care/tutor/massive-pe-guidance';

type Choices = readonly (readonly [number, MassivePeAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: MassivePeAction): LearnerAction => ({ tick, type: 'massive-pulmonary-embolism-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.massivePulmonaryEmbolismAssessment);
    const prompt = massivePeInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.massivePulmonaryEmbolismAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.massivePulmonaryEmbolismAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.massivePulmonaryEmbolismAssessment! };
}

describe('Massive pulmonary-embolism transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(MASSIVE_PE_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...MASSIVE_PE_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsMassivePe(SCENARIO)).toBe(true);
    expect(supportsMassivePe({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'massive-pulmonary-embolism-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(massivePeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(massivePeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(massivePeCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(massivePeCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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

  it('refuses a bridge that skips the review and the support', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      patternAtTick: null, supportAtTick: null, ecmoAtTick: null, reassessmentAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the fixed PE, RV, ventilation, perfusion, bleeding, and alternate-cause context before support');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessmentAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Recognize refractory PE cardiopulmonary failure and activate rescue teams first');
    expect(transcript).toContain('Record RV-sensitive support review before activating the rescue bridge');
    expect(recovered.patient.recognitionAtTick).toBeLessThan(recovered.patient.patternAtTick!);
    expect(recovered.patient.patternAtTick).toBeLessThan(recovered.patient.supportAtTick!);
    expect(recovered.patient.supportAtTick).toBeLessThan(recovered.patient.ecmoAtTick!);
    expect(recovered.patient.ecmoAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
  });

  it('refuses every later step before the failure state is named', () => {
    for (const action of MASSIVE_PE_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Recognize refractory PE cardiopulmonary failure and activate rescue teams first');
      expect(refused.patient.recognitionAtTick).toBeNull();
    }
  });

  it('keeps the bridge and the clot decision in separate recorded steps', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.ecmoAtTick).not.toBeNull();
    expect(expert.patient.reassessmentAtTick).toBeGreaterThan(expert.patient.ecmoAtTick!);
  });
});
