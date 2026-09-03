/**
 * Reference transcripts for the emergency STEMI lesson, replayed through the
 * real engine.
 *
 * The assertion this file exists for is that the handoff is gated behind the
 * pathway activation as well as the two drug intents, so nobody hands over to a
 * reperfusion team that has not been called.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { STEMI as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/stemi';
import { STEMI_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/stemi-fixtures';
import {
  STEMI_ACTIONS, STEMI_OBJECTIVES, STEMI_PARALLEL_ACTIONS,
  supportsStemi, type StemiAction,
} from '../../src/modules/emergency-medicine/stemi';
import { stemiCompletionEvidence } from '../../src/modules/emergency-medicine/stemi-completion';
import { stemiInlinePrompt } from '../../src/modules/emergency-medicine/tutor/stemi-guidance';

type Choices = readonly (readonly [number, StemiAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: StemiAction): LearnerAction => ({ tick, type: 'stemi-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.stemiAssessment);
    const prompt = stemiInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.stemiAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.stemiAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.stemiAssessment! };
}

describe('Emergency STEMI transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(STEMI_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(SCENARIO.timeline).toHaveLength(1);
    expect(supportsStemi(SCENARIO)).toBe(true);
    expect(supportsStemi({ ...SCENARIO, timeline: [] })).toBe(false);
    expect(stemiCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(stemiCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(stemiCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(stemiCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...STEMI_OBJECTIVES]);
    expect([...STEMI_OBJECTIVES]).not.toEqual([...STEMI_ACTIONS.slice(0, 4)]);
    expect(supportsStemi({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: STEMI_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: STEMI_ACTIONS[index]!,
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
      .toEqual(['met', 'met', 'met', 'met']);
    expect(expert.patient.reassessedAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.patternReviewedAtTick).toBeNull();
  });

  it('activates without a biomarker and leaves routine oxygen unselected', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const pathway = expert.events.find(({ eventId }) => eventId.startsWith('stemi-pathway-activated-'))!;
    expect(pathway.data).toMatchObject({ intentOnly: true, strategy: 'primary-pci' });
    expect(JSON.stringify(pathway)).toContain('without waiting for biomarker results');
    const aspirin = expert.events.find(({ eventId }) => eventId.startsWith('stemi-aspirin-'))!;
    expect(aspirin.data).toMatchObject({ loadingDoseMinimumMg: 162, loadingDoseMaximumMg: 325 });
    const handoff = expert.events.find(({ eventId }) => eventId.startsWith('stemi-reassessed-'))!;
    expect(JSON.stringify(handoff)).toContain('Routine oxygen remains unselected because saturation is at least 90%');
  });

  it('refuses the handoff when nobody called the cath lab', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.aspirinAtTick).not.toBeNull();
    expect(errored.patient.additionalAntithromboticsAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({ pathwayActivatedAtTick: null, reassessedAtTick: null });
    expect(JSON.stringify(errored.events))
      .toContain('Activate the reperfusion pathway and record both antithrombotic intents');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'met', 'not-met']);
  });

  it('refuses the skipped review and the too-early handoff, and still completes', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review symptom timing, the fixed 12-lead ECG, hemodynamics, oxygenation, and immediate alternatives first.');
    expect(transcript).toContain('then allow the next engine tick before reassessment');
    expect(recovered.patient.patternReviewedAtTick).toBeLessThan(recovered.patient.pathwayActivatedAtTick!);
    expect(recovered.patient.additionalAntithromboticsAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every later step before the twelve-lead is read', () => {
    for (const action of STEMI_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review symptom timing, the fixed 12-lead ECG, hemodynamics, oxygenation, and immediate alternatives first.');
      expect(refused.patient.patternReviewedAtTick).toBeNull();
    }
  });

  it('accepts the three lanes in any order, because none gates another', () => {
    const orders: readonly (readonly StemiAction[])[] = [
      ['activate-stemi-pathway', 'record-aspirin-load', 'record-p2y12-anticoagulation-intent'],
      ['record-aspirin-load', 'record-p2y12-anticoagulation-intent', 'activate-stemi-pathway'],
      ['record-p2y12-anticoagulation-intent', 'activate-stemi-pathway', 'record-aspirin-load'],
    ];
    for (const order of orders) {
      const actions: Choices = [
        [0, 'review-stemi-pattern'],
        ...order.map((action, index) => [index + 1, action] as const),
        [4, 'reassess-and-handoff'],
      ];
      const done = run(actions, 6);
      expect(done.patient.reassessedAtTick, order.join(' → ')).not.toBeNull();
      expect(JSON.stringify(done.events), order.join(' → ')).not.toContain('order-refused');
      expect(findings(done.events).map(({ outcome }) => outcome))
        .toEqual(['met', 'met', 'met', 'met']);
    }
    expect(STEMI_PARALLEL_ACTIONS).toHaveLength(3);
  });

  it('refuses a handoff recorded on the same tick as the last lane', () => {
    const early = run([
      [0, 'review-stemi-pattern'],
      [1, 'activate-stemi-pathway'],
      [2, 'record-aspirin-load'],
      [3, 'record-p2y12-anticoagulation-intent'],
      [3, 'reassess-and-handoff'],
    ], 5);
    expect(early.patient.reassessedAtTick).toBeNull();
    expect(JSON.stringify(early.events))
      .toContain('then allow the next engine tick before reassessment');
  });
});
