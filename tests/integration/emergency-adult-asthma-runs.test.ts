/**
 * Reference transcripts for the emergency adult-asthma lesson, replayed through
 * the real engine.
 *
 * The assertion this file exists for is that the three initial treatments are
 * gated against nothing at all — any order is accepted — while the reassessment
 * is gated behind all three, so the corticosteroid cannot be saved for after
 * the bronchodilators have been judged.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ADULT_ASTHMA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/adult-asthma';
import { ADULT_ASTHMA_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/adult-asthma-fixtures';
import {
  ADULT_ASTHMA_ACTIONS, ADULT_ASTHMA_OBJECTIVES, ADULT_ASTHMA_PARALLEL_ACTIONS,
  supportsAdultAsthma, type AdultAsthmaAction,
} from '../../src/modules/emergency-medicine/adult-asthma';
import { adultAsthmaCompletionEvidence } from '../../src/modules/emergency-medicine/adult-asthma-completion';
import { adultAsthmaInlinePrompt } from '../../src/modules/emergency-medicine/tutor/adult-asthma-guidance';

type Choices = readonly (readonly [number, AdultAsthmaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: AdultAsthmaAction): LearnerAction => ({ tick, type: 'adult-asthma-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.adultAsthmaAssessment);
    const prompt = adultAsthmaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.adultAsthmaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.adultAsthmaAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.adultAsthmaAssessment! };
}

describe('Emergency adult asthma transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(ADULT_ASTHMA_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsAdultAsthma(SCENARIO)).toBe(true);
    expect(supportsAdultAsthma({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'obstruction'),
    })).toBe(false);
    expect(adultAsthmaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(adultAsthmaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
    expect(adultAsthmaCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(adultAsthmaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...ADULT_ASTHMA_OBJECTIVES]);
    expect([...ADULT_ASTHMA_OBJECTIVES]).not.toEqual([...ADULT_ASTHMA_ACTIONS.slice(0, 4)]);
    expect(supportsAdultAsthma({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: ADULT_ASTHMA_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: ADULT_ASTHMA_ACTIONS[index]!,
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
    expect(expert.patient.corticosteroidIntentAtTick)
      .toBeLessThan(expert.patient.bronchodilatorBundleAtTick!);
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.severityReviewedAtTick).toBeNull();
  });

  it('refuses the reassessment when the corticosteroid was saved for after the verdict', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.bronchodilatorBundleAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      corticosteroidIntentAtTick: null, reassessedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Record controlled oxygen, inhaled bronchodilators, and early corticosteroid intent');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met']);
  });

  it('refuses the skipped review and the too-early reassessment, and still completes', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review severity and immediate alternative causes before recording treatment.');
    expect(transcript).toContain('then allow the next engine tick before reassessment');
    expect(recovered.patient.severityReviewedAtTick).toBeLessThan(recovered.patient.bronchodilatorBundleAtTick!);
    expect(recovered.patient.corticosteroidIntentAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every treatment and the reassessment before severity is reviewed', () => {
    for (const action of ADULT_ASTHMA_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review severity and immediate alternative causes before recording treatment.');
      expect(refused.patient.severityReviewedAtTick).toBeNull();
    }
  });

  it('accepts the three initial treatments in any order, because none gates another', () => {
    const orders: readonly (readonly AdultAsthmaAction[])[] = [
      ['record-controlled-oxygen', 'give-fixed-inhaled-bronchodilators', 'record-early-corticosteroid-intent'],
      ['record-early-corticosteroid-intent', 'record-controlled-oxygen', 'give-fixed-inhaled-bronchodilators'],
      ['give-fixed-inhaled-bronchodilators', 'record-early-corticosteroid-intent', 'record-controlled-oxygen'],
      ['record-early-corticosteroid-intent', 'give-fixed-inhaled-bronchodilators', 'record-controlled-oxygen'],
    ];
    for (const order of orders) {
      const actions: Choices = [
        [0, 'review-severity-and-mimics'],
        ...order.map((action, index) => [index + 1, action] as const),
        [4, 'reassess-after-initial-treatment'],
      ];
      const done = run(actions, 6);
      expect(done.patient.reassessedAtTick, order.join(' → ')).not.toBeNull();
      expect(JSON.stringify(done.events), order.join(' → ')).not.toContain('order-refused');
      expect(findings(done.events).map(({ outcome }) => outcome))
        .toEqual(['met', 'met', 'met', 'met']);
    }
    expect(ADULT_ASTHMA_PARALLEL_ACTIONS).toHaveLength(3);
  });

  it('refuses a reassessment recorded on the same tick as the last treatment', () => {
    const early = run([
      [0, 'review-severity-and-mimics'],
      [1, 'record-controlled-oxygen'],
      [2, 'record-early-corticosteroid-intent'],
      [3, 'give-fixed-inhaled-bronchodilators'],
      [3, 'reassess-after-initial-treatment'],
    ], 5);
    expect(early.patient.reassessedAtTick).toBeNull();
    expect(JSON.stringify(early.events))
      .toContain('then allow the next engine tick before reassessment');
  });
});
