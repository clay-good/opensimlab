/**
 * Reference transcripts for the emergency acute-ischemic-stroke lesson,
 * replayed through the real engine.
 *
 * The assertion this file exists for is that the handoff is gated behind the
 * thrombectomy transfer, so the two reperfusion pathways cannot collapse into a
 * sequence in which the transfer waits on a drug response.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ACUTE_ISCHEMIC_STROKE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/acute-ischemic-stroke';
import { ACUTE_ISCHEMIC_STROKE_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/acute-ischemic-stroke-fixtures';
import {
  ACUTE_ISCHEMIC_STROKE_ACTIONS, ACUTE_ISCHEMIC_STROKE_OBJECTIVES,
  supportsAcuteIschemicStroke, type AcuteIschemicStrokeAction,
} from '../../src/modules/emergency-medicine/acute-ischemic-stroke';
import { acuteIschemicStrokeCompletionEvidence } from '../../src/modules/emergency-medicine/acute-ischemic-stroke-completion';
import { acuteIschemicStrokeInlinePrompt } from '../../src/modules/emergency-medicine/tutor/acute-ischemic-stroke-guidance';

type Choices = readonly (readonly [number, AcuteIschemicStrokeAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: AcuteIschemicStrokeAction): LearnerAction => ({ tick, type: 'acute-ischemic-stroke-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.acuteIschemicStrokeAssessment);
    const prompt = acuteIschemicStrokeInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.acuteIschemicStrokeAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.acuteIschemicStrokeAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.acuteIschemicStrokeAssessment! };
}

describe('Emergency acute ischemic stroke transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(ACUTE_ISCHEMIC_STROKE_ACTIONS).toHaveLength(6);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsAcuteIschemicStroke(SCENARIO)).toBe(true);
    expect(supportsAcuteIschemicStroke({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'acute-ischemic-stroke-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(acuteIschemicStrokeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(acuteIschemicStrokeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(acuteIschemicStrokeCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(acuteIschemicStrokeCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...ACUTE_ISCHEMIC_STROKE_OBJECTIVES]);
    expect([...ACUTE_ISCHEMIC_STROKE_OBJECTIVES]).not.toEqual([...ACUTE_ISCHEMIC_STROKE_ACTIONS]);
    expect(supportsAcuteIschemicStroke({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: ACUTE_ISCHEMIC_STROKE_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: ACUTE_ISCHEMIC_STROKE_ACTIONS[index]!,
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
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(expert.patient.reassessedAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.presentationReviewedAtTick).toBeNull();
  });

  it('refuses the handoff while the thrombectomy transfer is still outstanding', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.tenecteplaseAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      thrombectomyActivatedAtTick: null, reassessedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Activate the parallel thrombectomy transfer pathway before reassessment and handoff');
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review the disabling deficit, last-known-well time, glucose, pressure, airway, and breathing first');
    expect(transcript).toContain('Review the authored CT, CTA, pressure, and contraindication findings before reperfusion intent');
    expect(recovered.patient.presentationReviewedAtTick).toBeLessThan(recovered.patient.systemActivatedAtTick!);
    expect(recovered.patient.systemActivatedAtTick).toBeLessThan(recovered.patient.imagingReviewedAtTick!);
    expect(recovered.patient.imagingReviewedAtTick).toBeLessThan(recovered.patient.tenecteplaseAtTick!);
    expect(recovered.patient.tenecteplaseAtTick).toBeLessThan(recovered.patient.thrombectomyActivatedAtTick!);
    expect(recovered.patient.thrombectomyActivatedAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every later step before the presentation is reviewed', () => {
    for (const action of ACUTE_ISCHEMIC_STROKE_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review the disabling deficit, last-known-well time, glucose, pressure, airway, and breathing first');
      expect(refused.patient.presentationReviewedAtTick).toBeNull();
    }
  });

  it('refuses the imaging review until the stroke system has been activated', () => {
    const short = run([[0, 'review-stroke-presentation'], [1, 'review-stroke-imaging-and-eligibility']], 4);
    expect(JSON.stringify(short.events))
      .toContain('Activate the stroke system before reviewing the authored imaging and eligibility screen');
    expect(short.patient.imagingReviewedAtTick).toBeNull();
  });
});
