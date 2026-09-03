/**
 * Reference transcripts for the emergency intracranial-hemorrhage lesson,
 * replayed through the real engine.
 *
 * The assertion this file exists for is that the pressure strategy is gated
 * behind the reversal intent, so nobody spends the next several minutes
 * titrating a blood pressure while a bleeding brain stays anticoagulated.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { INTRACRANIAL_HEMORRHAGE_DETERIORATION as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/intracranial-hemorrhage-deterioration';
import { INTRACRANIAL_HEMORRHAGE_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/intracranial-hemorrhage-deterioration-fixtures';
import {
  INTRACRANIAL_HEMORRHAGE_ACTIONS, INTRACRANIAL_HEMORRHAGE_OBJECTIVES,
  supportsIntracranialHemorrhage, type IntracranialHemorrhageAction,
} from '../../src/modules/emergency-medicine/intracranial-hemorrhage-deterioration';
import { intracranialHemorrhageCompletionEvidence } from '../../src/modules/emergency-medicine/intracranial-hemorrhage-deterioration-completion';
import { intracranialHemorrhageInlinePrompt } from '../../src/modules/emergency-medicine/tutor/intracranial-hemorrhage-deterioration-guidance';

type Choices = readonly (readonly [number, IntracranialHemorrhageAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
// The engine action type is shorter than the scenario id.
const choice = (tick: number, action: IntracranialHemorrhageAction): LearnerAction => ({ tick, type: 'intracranial-hemorrhage-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.intracranialHemorrhageAssessment);
    const prompt = intracranialHemorrhageInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.intracranialHemorrhageAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.intracranialHemorrhageAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.intracranialHemorrhageAssessment! };
}

describe('Emergency intracranial hemorrhage transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(INTRACRANIAL_HEMORRHAGE_ACTIONS).toHaveLength(6);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsIntracranialHemorrhage(SCENARIO)).toBe(true);
    expect(supportsIntracranialHemorrhage({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'intracranial-hemorrhage-deterioration-boundary'),
    })).toBe(false);
    expect(intracranialHemorrhageCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(intracranialHemorrhageCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(intracranialHemorrhageCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(intracranialHemorrhageCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...INTRACRANIAL_HEMORRHAGE_OBJECTIVES]);
    expect([...INTRACRANIAL_HEMORRHAGE_OBJECTIVES]).not.toEqual([...INTRACRANIAL_HEMORRHAGE_ACTIONS.slice(0, 5)]);
    expect(supportsIntracranialHemorrhage({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: INTRACRANIAL_HEMORRHAGE_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: INTRACRANIAL_HEMORRHAGE_ACTIONS[index]!,
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
    expect(expert.patient.escalatedAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.deteriorationReviewedAtTick).toBeNull();
  });

  it('records both reversal agents and a pressure range with a floor', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const reversal = expert.events.find(({ eventId }) => eventId.startsWith('ich-reversal-'))!;
    expect(reversal.data).toMatchObject({
      anticoagulant: 'warfarin', reversal: '4f-pcc-plus-iv-vitamin-k', authoredInr: 3.2,
    });
    expect(JSON.stringify(reversal)).toContain('without waiting for another coagulation result');
    const pressure = expert.events.find(({ eventId }) => eventId.startsWith('ich-pressure-control-'))!;
    expect(pressure.data).toMatchObject({
      targetSystolicMmHg: 140, lowerBoundSystolicMmHg: 130, upperBoundSystolicMmHg: 150,
    });
  });

  it('refuses the pressure strategy while the warfarin is still working', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.findingsReviewedAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      reversalAtTick: null, pressureControlAtTick: null, escalatedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Record urgent warfarin-reversal intent before completing the parallel pressure strategy.');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.escalatedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review the serial neurologic change, airway, breathing, circulation, glucose, and pressure first.');
    expect(transcript).toContain('Review the authored CT, anticoagulant, last-dose timing, and INR before treatment intent.');
    expect(recovered.patient.deteriorationReviewedAtTick).toBeLessThan(recovered.patient.pathwayActivatedAtTick!);
    expect(recovered.patient.findingsReviewedAtTick).toBeLessThan(recovered.patient.reversalAtTick!);
    expect(recovered.patient.reversalAtTick).toBeLessThan(recovered.patient.pressureControlAtTick!);
    expect(recovered.patient.pressureControlAtTick).toBeLessThan(recovered.patient.escalatedAtTick!);
  });

  it('refuses every later step before the deterioration is reviewed', () => {
    for (const action of INTRACRANIAL_HEMORRHAGE_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review the serial neurologic change, airway, breathing, circulation, glucose, and pressure first.');
      expect(refused.patient.deteriorationReviewedAtTick).toBeNull();
    }
  });

  it('refuses the imaging review until the pathway is activated', () => {
    const short = run([
      [0, 'review-ich-deterioration'],
      [1, 'review-ich-findings-and-coagulopathy'],
    ], 3);
    expect(short.patient.findingsReviewedAtTick).toBeNull();
    expect(JSON.stringify(short.events))
      .toContain('Activate immediate support and the intracranial-hemorrhage pathway before reviewing fixed CT and coagulopathy findings.');
  });

  it('refuses the escalation until the pressure plan is recorded', () => {
    const short = run([
      [0, 'review-ich-deterioration'],
      [1, 'activate-ich-pathway'],
      [2, 'review-ich-findings-and-coagulopathy'],
      [3, 'record-warfarin-reversal-intent'],
      [4, 'escalate-ich-neurocritical-care'],
    ], 6);
    expect(short.patient.escalatedAtTick).toBeNull();
    expect(JSON.stringify(short.events))
      .toContain('Record the parallel pressure-control intent before closing the urgent escalation and handoff.');
  });
});
