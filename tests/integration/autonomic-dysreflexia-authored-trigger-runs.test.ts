/**
 * Reference transcripts for the autonomic-dysreflexia lesson, replayed through
 * the real engine.
 *
 * The error path is the one a findable cause invites: recognize the syndrome
 * and go straight to hunting the trigger. It is an ordering error rather than a
 * treatment error, because the only physical act exposed here is freeing one
 * visible kink — what it skips is sitting him up, the intervention that costs
 * nothing and works in every version of this emergency including the ones where
 * no trigger is found. The recovery path starts from exactly that refusal.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { AUTONOMIC_DYSREFLEXIA_AUTHORED_TRIGGER as SCENARIO } from '../../src/modules/neurology/scenarios/autonomic-dysreflexia-authored-trigger';
import { DYSREFLEXIA_FIXTURES as FIXTURES } from '../../src/modules/neurology/autonomic-dysreflexia-authored-trigger-fixtures';
import type { DysreflexiaAction } from '../../src/modules/neurology/autonomic-dysreflexia-authored-trigger';
import { dysreflexiaCompletionEvidence } from '../../src/modules/neurology/autonomic-dysreflexia-authored-trigger-completion';
import { dysreflexiaInlinePrompt } from '../../src/modules/neurology/tutor/autonomic-dysreflexia-authored-trigger-guidance';

type Choices = readonly (readonly [number, DysreflexiaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: DysreflexiaAction): LearnerAction => ({ tick, type: 'autonomic-dysreflexia-authored-trigger-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.neurologyAutonomicDysreflexiaAssessment);
    const prompt = dysreflexiaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      dysreflexia: frame.equipment.resuscitation.neurologyAutonomicDysreflexiaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.neurologyAutonomicDysreflexiaAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.neurologyAutonomicDysreflexiaAssessment! };
}

describe('Autonomic-dysreflexia transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'neurology', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    // The objectives cap is a content-design decision across several modules,
    // and the two runtime requirements need people and hardware. Nothing else
    // remains.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(dysreflexiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toHaveLength(9);
    expect(dysreflexiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'toxicology')).toEqual([]);
    expect(dysreflexiaCompletionEvidence(SCENARIO, 'changed', 'neurology')).toEqual([]);
    expect(dysreflexiaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'neurology')).toEqual([]);
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
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.trajectoryAtTick).toBeNull();
  });

  it('refuses the trigger survey before he has been sat upright', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      supportAtTick: null, triggerAtTick: null, reassessmentAtTick: null, handoffAtTick: null,
    });
    // Hunting the trigger is not the failure. Hunting it before the
    // positioning that works whether or not the trigger is ever found is.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('support-order-refused');
  });

  it('lets the same run recover, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    // The counterfactual is that the early error stays visible after the correction.
    expect(JSON.stringify(recovered.events)).toContain('support-order-refused');
    expect(recovered.patient.drugSelectedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.catheterManipulatedByLearner).toBe(false);
    expect(recovered.patient.bowelCarePerformedByLearner).toBe(false);
    expect(recovered.patient.procedurePerformedByLearner).toBe(false);
    expect(recovered.patient.soleCauseProven).toBe(false);
    expect(recovered.patient.durableResolutionProven).toBe(false);
    expect(recovered.patient.complicationsExcluded).toBe(false);
    expect(recovered.patient.recurrenceExcluded).toBe(false);
    // The one physical act this lesson exposes did happen on the expert path.
    expect(recovered.patient.externalTubingKinkReleased).toBe(true);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
