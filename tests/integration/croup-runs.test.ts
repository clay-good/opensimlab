/**
 * Reference transcripts for the croup lesson, replayed through the real
 * engine.
 *
 * Two of the four refusable choices would upset a child whose airway narrows
 * when she cries; the other two misread what the treatment bought her. Unlike
 * the first two pediatrics lessons, this engine case clears the recorded
 * wrong turn when a correct step lands.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { CROUP as SCENARIO } from '../../src/modules/pediatrics/scenarios/croup';
import { CROUP_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/croup-fixtures';
import type { CroupAction } from '../../src/modules/pediatrics/croup';
import { croupCompletionEvidence } from '../../src/modules/pediatrics/croup-completion';
import { croupInlinePrompt } from '../../src/modules/pediatrics/tutor/croup-guidance';

type Choices = readonly (readonly [number, CroupAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: CroupAction): LearnerAction => ({ tick, type: 'croup-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.croupAssessment);
    const prompt = croupInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.croupAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.croupAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.croupAssessment! };
}

describe('Croup transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(croupCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(croupCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
    expect(croupCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(croupCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 40 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
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
    expect(expert.patient.lastUnsupportedChoice).toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.patternAtTick).toBeNull();
  });

  it('refuses the two choices that would upset her', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.patternAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      severityAtTick: null, treatmentIntentAtTick: null,
      earlyResponseAtTick: null, handoffAtTick: null,
      lastUnsupportedChoice: 'radiograph',
    });
    expect(errored.patient.drugSelectedByLearner).toBe(false);
    expect(errored.patient.imagingAcquiredByLearner).toBe(false);
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    const transcript = JSON.stringify(errored.events);
    expect(transcript).toContain('not a lower-airway bronchospasm response');
    expect(transcript).toContain('Routine imaging should not delay calm whole-child support');
  });

  it('clears the recorded wrong turn when a correct step lands', () => {
    // This engine case differs from the first two pediatrics lessons, where a
    // stale value survives into a later beat.
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.lastUnsupportedChoice).toBeNull();
    expect(recovered.patient.severityAtTick).not.toBeNull();
    expect(recovered.patient.recurrenceAtTick).not.toBeNull();
  });

  it('lets the same run recover from all four, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('not a lower-airway bronchospasm response');
    expect(transcript).toContain('Routine imaging should not delay calm whole-child support');
    expect(transcript).toContain('is not durable recovery or discharge readiness');
    expect(transcript).toContain('Normal saturation does not establish low upper-airway risk');
    // Nothing about this child was ever touched by the learner.
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.testAcquiredByLearner).toBe(false);
    expect(recovered.patient.imagingAcquiredByLearner).toBe(false);
    expect(recovered.patient.drugSelectedByLearner).toBe(false);
    expect(recovered.patient.doseSelectedByLearner).toBe(false);
    expect(recovered.patient.routeSelectedByLearner).toBe(false);
    expect(recovered.patient.concentrationSelectedByLearner).toBe(false);
    expect(recovered.patient.oxygenSelectedByLearner).toBe(false);
    expect(recovered.patient.deviceSelectedByLearner).toBe(false);
    expect(recovered.patient.flowSelectedByLearner).toBe(false);
    expect(recovered.patient.nebulizerOperatedByLearner).toBe(false);
    expect(recovered.patient.airwayManeuverPerformedByLearner).toBe(false);
  });

  it('keeps preserved oxygenation from being read as mild', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.croupWorkingPatternAuthored).toBe(true);
    expect(expert.patient.stridorAtRestAuthored).toBe(true);
    // The saturation is preserved throughout, which is exactly the trap.
    expect(expert.patient.preservedRoomAirOxygenationAuthored).toBe(true);
    expect(expert.patient.abruptChokingAuthored).toBe(false);
    expect(expert.patient.lowerAirwayPatternAuthored).toBe(false);
    expect(expert.patient.droolingOrToxicAppearanceAuthored).toBe(false);
  });
});
