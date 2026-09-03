/**
 * Reference transcripts for the right-ventricular infarction lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is structural: the reperfusion lane is a
 * prerequisite for nothing except the ending, so a learner can do every piece
 * of right-sided thinking correctly and still fail to close, which is exactly
 * the failure the lesson is about.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RIGHT_VENTRICULAR_INFARCTION as SCENARIO } from '../../src/modules/cardiology/scenarios/right-ventricular-infarction';
import { RIGHT_VENTRICULAR_INFARCTION_FIXTURES as FIXTURES } from '../../src/modules/cardiology/right-ventricular-infarction-fixtures';
import {
  RIGHT_VENTRICULAR_INFARCTION_ACTIONS, supportsRightVentricularInfarction,
  type RightVentricularInfarctionAction,
} from '../../src/modules/cardiology/right-ventricular-infarction';
import { rightVentricularInfarctionCompletionEvidence } from '../../src/modules/cardiology/right-ventricular-infarction-completion';
import { rightVentricularInfarctionInlinePrompt } from '../../src/modules/cardiology/tutor/right-ventricular-infarction-guidance';

type Choices = readonly (readonly [number, RightVentricularInfarctionAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: RightVentricularInfarctionAction): LearnerAction => ({ tick, type: 'right-ventricular-infarction-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.rightVentricularInfarctionAssessment);
    const prompt = rightVentricularInfarctionInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.rightVentricularInfarctionAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.rightVentricularInfarctionAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.rightVentricularInfarctionAssessment;
    if (patient) {
      expect(patient.initialPulsePresent).toBe(true);
      expect(patient.nitrateSelected).toBe(false);
      expect(patient.diureticSelected).toBe(false);
      expect(patient.blindFluidLoading).toBe(false);
      expect(patient.fixedFluidVolumeSelected).toBe(false);
      expect(patient.pciPerformed).toBe(false);
      expect(patient.reperfusionCompleted).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.rightVentricularInfarctionAssessment! };
}

describe('Right-ventricular infarction transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(RIGHT_VENTRICULAR_INFARCTION_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...RIGHT_VENTRICULAR_INFARCTION_ACTIONS]);
    expect(SCENARIO.timeline.every((event) => event.type === 'narrative')).toBe(true);
    expect(supportsRightVentricularInfarction(SCENARIO)).toBe(true);
    expect(supportsRightVentricularInfarction({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.id !== 'right-ventricular-infarction-phenotype'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'clinic', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(rightVentricularInfarctionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(9);
    expect(rightVentricularInfarctionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(rightVentricularInfarctionCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(rightVentricularInfarctionCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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
    expect(expert.patient.handoffAtTick).not.toBeNull();
    // The reperfusion lane lands before the phenotype, and nothing objects.
    expect(expert.patient.reperfusionAtTick).toBeLessThan(expert.patient.phenotypeAtTick!);
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.reconciledAtTick).toBeNull();
  });

  it('lets every right-sided step be correct and still refuses the ending', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.phenotypeAtTick).not.toBeNull();
    expect(errored.patient.supportAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({ reperfusionAtTick: null, handoffAtTick: null });
    expect(JSON.stringify(errored.events))
      .toContain('Complete both the reperfusion-readiness and individualized-support lanes before the later reassessment handoff');
    // Three of five: the clock ran while everything else was done correctly.
    expect(findings(errored.events).filter(({ outcome }) => outcome === 'met')).toHaveLength(3);
  });

  it('accepts the pair the other way round and clears the time gate', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review the fixed right-sided ECG and echo phenotype before opening individualized support');
    expect(transcript).toContain('Allow a later simulated tick before handing off the unresolved RV-infarction trajectory');
    expect(recovered.patient.phenotypeAtTick).toBeLessThan(recovered.patient.reperfusionAtTick!);
    expect(recovered.patient.reperfusionAtTick).toBeLessThan(recovered.patient.supportAtTick!);
    expect(recovered.patient.supportAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('refuses every later step before the trajectory is reconciled', () => {
    for (const action of RIGHT_VENTRICULAR_INFARCTION_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Reconcile the whole ischemic and hemodynamic trajectory before reviewing the fixed RV phenotype or support');
      expect(refused.patient.reconciledAtTick).toBeNull();
    }
  });

  it('selects no nitrate, no diuretic, no fluid volume, and completes no reperfusion', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.nitrateSelected).toBe(false);
    expect(expert.patient.diureticSelected).toBe(false);
    expect(expert.patient.fixedFluidVolumeSelected).toBe(false);
    expect(expert.patient.reperfusionCompleted).toBe(false);
    expect(JSON.stringify(expert.events)).toContain('no nitrate or reflex diuretic was sel');
  });
});
