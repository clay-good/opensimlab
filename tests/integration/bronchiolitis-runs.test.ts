/**
 * Reference transcripts for the bronchiolitis lesson, replayed through the
 * real engine.
 *
 * Bronchiolitis is a disease people treat too much, so all five refusable
 * choices are ways of doing something instead of the right thing, offered at
 * three separate moments.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { BRONCHIOLITIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/bronchiolitis';
import { BRONCHIOLITIS_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/bronchiolitis-fixtures';
import type { BronchiolitisAction } from '../../src/modules/pediatrics/bronchiolitis';
import { bronchiolitisCompletionEvidence } from '../../src/modules/pediatrics/bronchiolitis-completion';
import { bronchiolitisInlinePrompt } from '../../src/modules/pediatrics/tutor/bronchiolitis-guidance';

type Choices = readonly (readonly [number, BronchiolitisAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: BronchiolitisAction): LearnerAction => ({ tick, type: 'bronchiolitis-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.bronchiolitisAssessment);
    const prompt = bronchiolitisInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.bronchiolitisAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.bronchiolitisAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.bronchiolitisAssessment! };
}

describe('Bronchiolitis transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(bronchiolitisCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(bronchiolitisCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
    expect(bronchiolitisCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(bronchiolitisCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 40 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
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
    expect(idle.patient.recognitionAtTick).toBeNull();
  });

  it('refuses the bronchodilator and the antibiotic this illness attracts', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    // The pattern was named correctly. The treatments are the error.
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient.patternAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      supportAtTick: null, feedingHydrationAtTick: null,
      laterResponseAtTick: null, handoffAtTick: null,
      lastUnsupportedChoice: 'routine-antibiotic',
    });
    expect(errored.patient.drugDeliveredByLearner).toBe(false);
    expect(errored.patient.experiencedSupportActivated).toBe(false);
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met', 'not-met']);
    const transcript = JSON.stringify(errored.events);
    expect(transcript).toContain('Wheeze alone does not establish asthma in this first infant episode');
    expect(transcript).toContain('Keep bacterial coinfection open without routine antibacterial treatment');
  });

  it('lets the same run recover from all five, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Routine imaging should not delay whole-infant support');
    expect(transcript).toContain('Oxygen saturation is one lane');
    expect(transcript).toContain('Wheeze alone does not establish asthma');
    expect(transcript).toContain('No bacterial focus is authored');
    expect(recovered.patient.experiencedSupportActivated).toBe(true);
    // Nothing about this infant was ever touched by the learner.
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.testAcquiredByLearner).toBe(false);
    expect(recovered.patient.oxygenSelectedByLearner).toBe(false);
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.deviceSelectedByLearner).toBe(false);
    expect(recovered.patient.feedingDeliveredByLearner).toBe(false);
    expect(recovered.patient.fluidRouteSelectedByLearner).toBe(false);
    expect(recovered.patient.fluidDeliveredByLearner).toBe(false);
    expect(recovered.patient.suctionPerformedByLearner).toBe(false);
    expect(recovered.patient.drugDeliveredByLearner).toBe(false);
    expect(recovered.patient.ventilationDeliveredByLearner).toBe(false);
    expect(recovered.patient.procedurePerformedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
    expect(recovered.patient.durableRecoveryProven).toBe(false);
    expect(recovered.patient.dischargeReadinessProven).toBe(false);
    expect(recovered.patient.dispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });

  it('keeps the authored pattern from being read as something it is not', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.bronchiolitisWorkingPatternAuthored).toBe(true);
    expect(expert.patient.hypoxemiaAuthored).toBe(true);
    expect(expert.patient.poorIntakeAuthored).toBe(true);
    expect(expert.patient.preservedPerfusionAuthored).toBe(true);
    // No apnea is authored now, which is not the same as apnea being excluded later.
    expect(expert.patient.currentApneaAuthored).toBe(false);
    expect(expert.patient.initialPulsePresent).toBe(true);
    expect(expert.patient.spontaneousBreathingAuthored).toBe(true);
  });
});
