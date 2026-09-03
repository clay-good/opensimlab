/**
 * Reference transcripts for the emergency copd-exacerbation lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that the four initial treatments are
 * gated against nothing at all — any order is accepted — while the reassessment
 * is gated behind all four, so nobody reaches the repeat gas without having
 * named what the antibiotic is for.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { COPD_EXACERBATION as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/copd-exacerbation';
import { COPD_EXACERBATION_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/copd-exacerbation-fixtures';
import {
  COPD_EXACERBATION_ACTIONS, COPD_EXACERBATION_OBJECTIVES,
  COPD_EXACERBATION_PARALLEL_ACTIONS, supportsCopdExacerbation,
  type CopdExacerbationAction,
} from '../../src/modules/emergency-medicine/copd-exacerbation';
import { copdExacerbationCompletionEvidence } from '../../src/modules/emergency-medicine/copd-exacerbation-completion';
import { copdExacerbationInlinePrompt } from '../../src/modules/emergency-medicine/tutor/copd-exacerbation-guidance';

type Choices = readonly (readonly [number, CopdExacerbationAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: CopdExacerbationAction): LearnerAction => ({ tick, type: 'copd-exacerbation-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.copdExacerbationAssessment);
    const prompt = copdExacerbationInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.copdExacerbationAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.copdExacerbationAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.copdExacerbationAssessment! };
}

describe('Emergency COPD exacerbation transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(COPD_EXACERBATION_ACTIONS).toHaveLength(6);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsCopdExacerbation(SCENARIO)).toBe(true);
    expect(supportsCopdExacerbation({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'obstruction'),
    })).toBe(false);
    expect(copdExacerbationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(copdExacerbationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
    expect(copdExacerbationCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(copdExacerbationCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...COPD_EXACERBATION_OBJECTIVES]);
    expect([...COPD_EXACERBATION_OBJECTIVES]).not.toEqual([...COPD_EXACERBATION_ACTIONS.slice(0, 5)]);
    expect(supportsCopdExacerbation({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: COPD_EXACERBATION_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: COPD_EXACERBATION_ACTIONS[index]!,
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
    expect(idle.patient.severityReviewedAtTick).toBeNull();
  });

  it('records the antibiotic against its authored indication rather than a drug', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const antibiotic = expert.events.find(({ eventId }) => eventId.startsWith('copd-exacerbation-antibiotic-'))!;
    expect(antibiotic.data).toMatchObject({ indication: 'purulent-sputum', intentOnly: true });
    const corticosteroid = expert.events.find(({ eventId }) => eventId.startsWith('copd-exacerbation-corticosteroid-'))!;
    expect(corticosteroid.data).toMatchObject({ prednisoneEquivalentMgPerDay: 40, durationDays: 5 });
    const bronchodilators = expert.events.find(({ eventId }) => eventId.startsWith('copd-exacerbation-bronchodilators-'))!;
    expect(bronchodilators.data).toMatchObject({ route: 'air-driven-inhaled-bundle' });
  });

  it('refuses the reassessment when nobody named an antibiotic indication', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.corticosteroidIntentAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      antibioticIntentAtTick: null, reassessedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Record controlled oxygen, bronchodilators, corticosteroid intent, and the antibiotic indication');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'not-met']);
  });

  it('refuses the skipped review and the too-early reassessment, and still completes', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review severity, immediate mimics, and the fixed blood gas before treatment.');
    expect(transcript).toContain('then allow the next engine tick before reassessment');
    expect(recovered.patient.severityReviewedAtTick).toBeLessThan(recovered.patient.controlledOxygenAtTick!);
    expect(recovered.patient.corticosteroidIntentAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every treatment and the reassessment before severity and the gas are reviewed', () => {
    for (const action of COPD_EXACERBATION_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review severity, immediate mimics, and the fixed blood gas before treatment.');
      expect(refused.patient.severityReviewedAtTick).toBeNull();
    }
  });

  it('accepts the four initial treatments in any order, because none gates another', () => {
    const orders: readonly (readonly CopdExacerbationAction[])[] = [
      ['record-controlled-oxygen', 'give-air-driven-bronchodilators', 'record-five-day-corticosteroid-intent', 'record-antibiotic-indication'],
      ['record-antibiotic-indication', 'record-five-day-corticosteroid-intent', 'give-air-driven-bronchodilators', 'record-controlled-oxygen'],
      ['record-five-day-corticosteroid-intent', 'record-controlled-oxygen', 'record-antibiotic-indication', 'give-air-driven-bronchodilators'],
      ['give-air-driven-bronchodilators', 'record-antibiotic-indication', 'record-controlled-oxygen', 'record-five-day-corticosteroid-intent'],
    ];
    for (const order of orders) {
      const actions: Choices = [
        [0, 'review-severity-and-mimics'],
        ...order.map((action, index) => [index + 1, action] as const),
        [5, 'reassess-and-review-ventilatory-support'],
      ];
      const done = run(actions, 7);
      expect(done.patient.reassessedAtTick, order.join(' → ')).not.toBeNull();
      expect(JSON.stringify(done.events), order.join(' → ')).not.toContain('order-refused');
      expect(findings(done.events).map(({ outcome }) => outcome))
        .toEqual(['met', 'met', 'met', 'met', 'met']);
    }
    expect(COPD_EXACERBATION_PARALLEL_ACTIONS).toHaveLength(4);
  });

  it('refuses a reassessment recorded on the same tick as the last treatment', () => {
    const early = run([
      [0, 'review-severity-and-mimics'],
      [1, 'record-controlled-oxygen'],
      [2, 'give-air-driven-bronchodilators'],
      [3, 'record-five-day-corticosteroid-intent'],
      [4, 'record-antibiotic-indication'],
      [4, 'reassess-and-review-ventilatory-support'],
    ], 6);
    expect(early.patient.reassessedAtTick).toBeNull();
    expect(JSON.stringify(early.events))
      .toContain('then allow the next engine tick before reassessment');
  });
});
