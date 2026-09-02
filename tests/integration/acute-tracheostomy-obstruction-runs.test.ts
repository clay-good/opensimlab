/**
 * Reference transcripts for the tracheostomy-patency lesson, replayed through
 * the real engine.
 *
 * The four refusable choices are not reflexes but harms: imaging while he is
 * at 82%, positive pressure down an unverified path, a catheter forced past
 * resistance, and a correctly sited outer tube given up first.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ACUTE_TRACHEOSTOMY_OBSTRUCTION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/acute-tracheostomy-obstruction';
import { ACUTE_TRACHEOSTOMY_OBSTRUCTION_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/acute-tracheostomy-obstruction-fixtures';
import type { AcuteTracheostomyObstructionAction } from '../../src/modules/respiratory-medicine/acute-tracheostomy-obstruction';
import { acuteTracheostomyObstructionCompletionEvidence } from '../../src/modules/respiratory-medicine/acute-tracheostomy-obstruction-completion';
import { acuteTracheostomyObstructionInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/acute-tracheostomy-obstruction-guidance';

type Choices = readonly (readonly [number, AcuteTracheostomyObstructionAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: AcuteTracheostomyObstructionAction): LearnerAction => ({ tick, type: 'acute-tracheostomy-obstruction-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.acuteTracheostomyObstructionAssessment);
    const prompt = acuteTracheostomyObstructionInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.acuteTracheostomyObstructionAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.acuteTracheostomyObstructionAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.acuteTracheostomyObstructionAssessment! };
}

describe('Tracheostomy-patency transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'respiratory-medicine', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(acuteTracheostomyObstructionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toHaveLength(10);
    expect(acuteTracheostomyObstructionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(acuteTracheostomyObstructionCompletionEvidence(SCENARIO, 'changed', 'respiratory-medicine')).toEqual([]);
    expect(acuteTracheostomyObstructionCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
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

  it('refuses positive pressure down an unverified tracheostomy', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    // The anatomy was read correctly. Ventilating through it was the harm.
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      supportAtTick: null, devicePathwayAtTick: null, innerCannulaAtTick: null,
      restorationAtTick: null, handoffAtTick: null,
      lastUnsupportedChoice: 'unverified-ventilation',
    });
    expect(errored.patient.dualRouteOxygenIntentRecorded).toBe(false);
    expect(errored.patient.ventilationDeliveredByLearner).toBe(false);
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('Do not trial positive pressure through an unverified tracheostomy path');
    expect(JSON.stringify(errored.events)).toContain('Nothing changed.');
  });

  it('lets the same run recover from all four harms, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Do not trial positive pressure through an unverified tracheostomy path');
    expect(transcript).toContain('cannot wait for imaging');
    expect(transcript).toContain('Do not force a catheter past resistance');
    expect(transcript).toContain('not the first bounded branch');
    expect(recovered.patient.lastUnsupportedChoice).toBeNull();
    expect(recovered.patient.dualRouteOxygenIntentRecorded).toBe(true);
    expect(recovered.patient.expertDevicePathwayRecorded).toBe(true);
    expect(recovered.patient.innerCannulaObstructionAuthored).toBe(true);
    // Nothing about this patient was ever touched by the learner.
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.monitorInterpretedByLearner).toBe(false);
    expect(recovered.patient.deviceInspectedByLearner).toBe(false);
    expect(recovered.patient.catheterPassedByLearner).toBe(false);
    expect(recovered.patient.suctionPerformedByLearner).toBe(false);
    expect(recovered.patient.innerCannulaHandledByLearner).toBe(false);
    expect(recovered.patient.tracheostomyTubeHandledByLearner).toBe(false);
    expect(recovered.patient.cuffChangedByLearner).toBe(false);
    expect(recovered.patient.oxygenSelectedByLearner).toBe(false);
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.ventilationDeliveredByLearner).toBe(false);
    expect(recovered.patient.intubationPerformedByLearner).toBe(false);
    expect(recovered.patient.procedurePerformedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
    expect(recovered.patient.durablePatencyProven).toBe(false);
    expect(recovered.patient.dispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });

  it('keeps the authored anatomy from being generalized', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    // The whole branch depends on these being true, and none of them is
    // something the learner established.
    expect(expert.patient.tracheostomyPresentAuthored).toBe(true);
    expect(expert.patient.laryngectomyAuthored).toBe(false);
    expect(expert.patient.patentUpperAirwayAuthored).toBe(true);
    expect(expert.patient.matureStomaAuthored).toBe(true);
    expect(expert.patient.removableInnerCannulaAuthored).toBe(true);
    expect(expert.patient.initialPulsePresent).toBe(true);
    expect(expert.patient.spontaneousBreathingAuthored).toBe(true);
  });
});
