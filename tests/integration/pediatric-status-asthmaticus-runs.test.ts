/**
 * Reference transcripts for the status-asthmaticus lesson, replayed through
 * the real engine.
 *
 * Unlike bronchiolitis, none of the four refusable choices is over-treatment.
 * Every one of them spends time this child does not have.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_STATUS_ASTHMATICUS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-status-asthmaticus';
import { PEDIATRIC_STATUS_ASTHMATICUS_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-status-asthmaticus-fixtures';
import type { PediatricStatusAsthmaticusAction } from '../../src/modules/pediatrics/pediatric-status-asthmaticus';
import { pediatricStatusAsthmaticusCompletionEvidence } from '../../src/modules/pediatrics/pediatric-status-asthmaticus-completion';
import { pediatricStatusAsthmaticusInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-status-asthmaticus-guidance';

type Choices = readonly (readonly [number, PediatricStatusAsthmaticusAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PediatricStatusAsthmaticusAction): LearnerAction => ({ tick, type: 'pediatric-status-asthmaticus-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.pediatricStatusAsthmaticusAssessment);
    const prompt = pediatricStatusAsthmaticusInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pediatricStatusAsthmaticusAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pediatricStatusAsthmaticusAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pediatricStatusAsthmaticusAssessment! };
}

describe('Status-asthmaticus transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pediatricStatusAsthmaticusCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(pediatricStatusAsthmaticusCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
    expect(pediatricStatusAsthmaticusCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(pediatricStatusAsthmaticusCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
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
    expect(idle.patient.trajectoryAtTick).toBeNull();
  });

  it('refuses to delay the second-line plan for a trigger review', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    // Escalation was already activated. The delay is the error.
    expect(errored.patient.nonresponseAtTick).not.toBeNull();
    expect(errored.patient.escalationAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      secondLineIntentAtTick: null, laterResponseAtTick: null,
      handoffAtTick: null, lastUnsupportedChoice: 'trigger-review-delay',
    });
    expect(errored.patient.experiencedSecondLineCareAuthored).toBe(false);
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('lets the same run recover from all four, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('this child cannot perform it comfortably and reliably now');
    expect(transcript).toContain('Routine imaging should not delay recognition and escalation');
    // The handoff does not clear the recorded wrong turn — only recognizing
    // nonresponse and recording the second-line intent do — so the last
    // refusal in this path is still on the snapshot at the end.
    expect(recovered.patient.lastUnsupportedChoice).toBe('saturation-discharge');
    // Nothing about this child was ever touched by the learner.
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.pefMeasuredByLearner).toBe(false);
    expect(recovered.patient.scoreCalculatedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.testAcquiredByLearner).toBe(false);
    expect(recovered.patient.imagingAcquiredByLearner).toBe(false);
    expect(recovered.patient.drugSelectedByLearner).toBe(false);
    expect(recovered.patient.doseSelectedByLearner).toBe(false);
    expect(recovered.patient.routeSelectedByLearner).toBe(false);
    expect(recovered.patient.concentrationSelectedByLearner).toBe(false);
    expect(recovered.patient.oxygenSelectedByLearner).toBe(false);
    expect(recovered.patient.nebulizerOperatedByLearner).toBe(false);
    expect(recovered.patient.ivAccessPlacedByLearner).toBe(false);
    expect(recovered.patient.infusionOperatedByLearner).toBe(false);
  });

  it('clears the recorded wrong turn at exactly two of its correct steps', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    // Recognizing nonresponse clears the peak-flow and radiograph refusals,
    // and recording the second-line intent clears the trigger-review delay.
    expect(recovered.patient.nonresponseAtTick).not.toBeNull();
    expect(recovered.patient.secondLineIntentAtTick).not.toBeNull();
    // But the handoff does not clear, which is why the run ends carrying one.
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(recovered.patient.lastUnsupportedChoice).toBe('saturation-discharge');
  });

  it('keeps what is reassuring from being read as safe', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.asthmaHistoryAuthored).toBe(true);
    expect(expert.patient.treatmentRecordAuthored).toBe(true);
    expect(expert.patient.persistentSevereNonresponseAuthored).toBe(true);
    // She has not arrived at respiratory failure — which is not the same as
    // being safe from it, and is exactly why escalation happens now.
    expect(expert.patient.quietChestAuthored).toBe(false);
    expect(expert.patient.respiratoryFailureAuthored).toBe(false);
    expect(expert.patient.anaphylaxisPatternAuthored).toBe(false);
    expect(expert.patient.upperAirwayPatternAuthored).toBe(false);
    expect(expert.patient.foreignBodyPatternAuthored).toBe(false);
    expect(expert.patient.initialPulsePresent).toBe(true);
    expect(expert.patient.spontaneousBreathingAuthored).toBe(true);
  });
});
