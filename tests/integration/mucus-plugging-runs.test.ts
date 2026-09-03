/**
 * Reference transcripts for the mucus-plugging lesson, replayed through the
 * real engine.
 *
 * The assertion this file exists for is that the suction intent is gated behind
 * the indicator review, so visible secretion cannot become the whole diagnosis,
 * and that the escalation is gated behind the response that justifies it.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { MUCUS_PLUGGING as SCENARIO } from '../../src/modules/critical-care/scenarios/mucus-plugging';
import { MUCUS_PLUGGING_FIXTURES as FIXTURES } from '../../src/modules/critical-care/mucus-plugging-fixtures';
import { MUCUS_PLUGGING_ACTIONS, supportsMucusPlugging, type MucusPluggingAction } from '../../src/modules/critical-care/mucus-plugging';
import { mucusPluggingCompletionEvidence } from '../../src/modules/critical-care/mucus-plugging-completion';
import { mucusPluggingInlinePrompt } from '../../src/modules/critical-care/tutor/mucus-plugging-guidance';

type Choices = readonly (readonly [number, MucusPluggingAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: MucusPluggingAction): LearnerAction => ({ tick, type: 'mucus-plugging-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.mucusPluggingAssessment);
    const prompt = mucusPluggingInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.mucusPluggingAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.mucusPluggingAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.mucusPluggingAssessment! };
}

describe('Mucus-plugging transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(MUCUS_PLUGGING_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...MUCUS_PLUGGING_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsMucusPlugging(SCENARIO)).toBe(true);
    expect(supportsMucusPlugging({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'mucus-plugging-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(mucusPluggingCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(mucusPluggingCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(mucusPluggingCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(mucusPluggingCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(expert.patient.escalationAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.supportAtTick).toBeNull();
  });

  it('refuses suction chosen because the secretion is visible', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.supportAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      indicatorsAtTick: null, suctionAtTick: null,
      reassessmentAtTick: null, escalationAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the patient, airway, graphics, mechanics, gas exchange, and circulation before suction intent');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.escalationAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Support oxygenation and call experienced help before airway-clearance intent');
    expect(transcript).toContain('Record indicated airway-clearance intent before reviewing a response');
    expect(recovered.patient.supportAtTick).toBeLessThan(recovered.patient.indicatorsAtTick!);
    expect(recovered.patient.indicatorsAtTick).toBeLessThan(recovered.patient.suctionAtTick!);
    expect(recovered.patient.suctionAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
    expect(recovered.patient.reassessmentAtTick).toBeLessThan(recovered.patient.escalationAtTick!);
  });

  it('refuses every later step before oxygen and help are arranged', () => {
    for (const action of MUCUS_PLUGGING_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Support oxygenation and call experienced help before airway-clearance intent');
      expect(refused.patient.supportAtTick).toBeNull();
    }
  });

  it('keeps the escalation after a response that only partly improved', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.reassessmentAtTick).toBeLessThan(expert.patient.escalationAtTick!);
  });
});
