/**
 * Reference transcripts for the pediatric respiratory-distress lesson,
 * replayed through the real engine.
 *
 * The four refusable choices are readings rather than ordering slips, and
 * they arrive at three separate moments. The last one is what the lesson
 * exists for: a respiratory rate falling from 46 to 28 in a child who is
 * tiring is not recovery.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_RESPIRATORY_DISTRESS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-respiratory-distress';
import { PEDIATRIC_RESPIRATORY_DISTRESS_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-respiratory-distress-fixtures';
import type { PediatricRespiratoryDistressAction } from '../../src/modules/pediatrics/pediatric-respiratory-distress';
import { pediatricRespiratoryDistressCompletionEvidence } from '../../src/modules/pediatrics/pediatric-respiratory-distress-completion';
import { pediatricRespiratoryDistressInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-respiratory-distress-guidance';

type Choices = readonly (readonly [number, PediatricRespiratoryDistressAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PediatricRespiratoryDistressAction): LearnerAction => ({ tick, type: 'pediatric-respiratory-distress-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.pediatricRespiratoryDistressAssessment);
    const prompt = pediatricRespiratoryDistressInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pediatricRespiratoryDistressAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pediatricRespiratoryDistressAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pediatricRespiratoryDistressAssessment! };
}

describe('Pediatric respiratory-distress transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pediatricRespiratoryDistressCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    // The first lesson in a new module, so the module guard matters here.
    expect(pediatricRespiratoryDistressCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
    expect(pediatricRespiratoryDistressCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(pediatricRespiratoryDistressCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
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

  it('refuses to read a falling respiratory rate as recovery', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    // Everything up to the reading was done correctly. The reading is the error.
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient.supportAtTick).not.toBeNull();
    expect(errored.patient.earlyResponseAtTick).not.toBeNull();
    expect(errored.patient.laterPanelAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      rescueAtTick: null, handoffAtTick: null, lastUnsupportedChoice: 'falling-rate',
    });
    expect(errored.patient.rescueReadinessActivated).toBe(false);
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'not-met', 'not-met']);
    const transcript = JSON.stringify(errored.events);
    expect(transcript).toContain('A lower respiratory rate is not recovery when mentation, effort, air movement, rhythm, and oxygenation worsen together');
    expect(transcript).toContain('reflect fatigue and evolving inadequate breathing with a pulse, not recovery');
  });

  it('lets the same run recover from all four readings, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('should continue in parallel rather than delay support');
    expect(transcript).toContain('should not delay support for this whole-child pattern');
    expect(transcript).toContain('Reassess the whole child');
    expect(transcript).toContain('A lower respiratory rate is not recovery');
    expect(recovered.patient.lastUnsupportedChoice).toBeNull();
    expect(recovered.patient.experiencedSupportActivated).toBe(true);
    expect(recovered.patient.rescueReadinessActivated).toBe(true);
    // Nothing about this child was ever touched by the learner.
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.monitorInterpretedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.testAcquiredByLearner).toBe(false);
    expect(recovered.patient.oxygenSelectedByLearner).toBe(false);
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.deviceSelectedByLearner).toBe(false);
    expect(recovered.patient.flowSelectedByLearner).toBe(false);
    expect(recovered.patient.fio2SelectedByLearner).toBe(false);
    expect(recovered.patient.oxygenTargetSelectedByLearner).toBe(false);
    expect(recovered.patient.ventilationDeliveredByLearner).toBe(false);
    expect(recovered.patient.airwayManeuverPerformedByLearner).toBe(false);
    expect(recovered.patient.intubationPerformedByLearner).toBe(false);
    expect(recovered.patient.drugDeliveredByLearner).toBe(false);
    expect(recovered.patient.fluidDeliveredByLearner).toBe(false);
    expect(recovered.patient.procedurePerformedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
    expect(recovered.patient.durableRecoveryProven).toBe(false);
    expect(recovered.patient.dispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });

  it('keeps the child breathing with a pulse throughout, which is what makes rescue preventive', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.initialPulsePresent).toBe(true);
    expect(expert.patient.spontaneousBreathingAuthored).toBe(true);
    expect(expert.patient.hypoxemiaAuthored).toBe(true);
    expect(expert.patient.pulseSignalCoherentAuthored).toBe(true);
    expect(expert.patient.progressiveInadequateBreathingAuthored).toBe(true);
  });
});
