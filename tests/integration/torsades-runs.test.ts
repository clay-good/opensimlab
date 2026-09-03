/**
 * Reference transcripts for the torsades lesson, replayed through the real
 * engine.
 *
 * The assertion this file exists for is the gate: the cause and magnesium work
 * is unavailable until the shock intent is recorded, which is exactly the
 * delay a learner who knows the word torsades is most likely to introduce.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { TORSADES_DE_POINTES as SCENARIO } from '../../src/modules/cardiology/scenarios/torsades-de-pointes';
import { TORSADES_FIXTURES as FIXTURES } from '../../src/modules/cardiology/torsades-fixtures';
import { TORSADES_ACTIONS, supportsTorsades, type TorsadesAction } from '../../src/modules/cardiology/torsades';
import { torsadesCompletionEvidence } from '../../src/modules/cardiology/torsades-completion';
import { torsadesInlinePrompt } from '../../src/modules/cardiology/tutor/torsades-guidance';

type Choices = readonly (readonly [number, TorsadesAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: TorsadesAction): LearnerAction => ({ tick, type: 'torsades-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.torsadesAssessment);
    const prompt = torsadesInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.torsadesAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.torsadesAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.torsadesAssessment;
    if (patient) {
      expect(patient.initialPulsePresent).toBe(true);
      expect(patient.shockDeliveredByLearner).toBe(false);
      expect(patient.treatmentDeliveredByLearner).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.torsadesAssessment! };
}

describe('Torsades transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(TORSADES_ACTIONS).toHaveLength(6);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...TORSADES_ACTIONS]);
    expect(supportsTorsades(SCENARIO)).toBe(true);
    expect(supportsTorsades({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'torsades-de-pointes-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'clinic', 'state_transition');
    expect(audit.complete).toBe(false);
    // Six objectives, so the observable-objectives cap stays outstanding too.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(torsadesCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(9);
    expect(torsadesCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(torsadesCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(torsadesCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.recognitionAtTick).toBeNull();
  });

  it('refuses the magnesium and the cause work while she is still in the rhythm', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      shockIntentAtTick: null, postShockAtTick: null,
      contextAtTick: null, recurrenceIntentAtTick: null, handoffAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Record immediate unsynchronized-shock intent before cause or magnesium work');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('accepts the closing pair in the other order and clears both time gates', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Confirm the fixed polymorphic rhythm, mechanical pulse, and compromise before recording the emergency response');
    expect(transcript).toContain('Allow a later simulated tick before reviewing the authored post-team report');
    expect(transcript).toContain('Allow a later simulated tick before the recurrence-risk handoff');
    expect(recovered.patient.recurrenceIntentAtTick).toBeLessThan(recovered.patient.contextAtTick!);
    expect(recovered.patient.postShockAtTick).toBeLessThan(recovered.patient.recurrenceIntentAtTick!);
    expect(recovered.patient.contextAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('refuses every later step before the pattern and the pulse are reconciled', () => {
    for (const action of TORSADES_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Confirm the fixed polymorphic rhythm, mechanical pulse, and compromise before recording the emergency response');
      expect(refused.patient.recognitionAtTick).toBeNull();
    }
  });

  it('lets the treating team deliver the shock and the learner deliver nothing', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.initialPulsePresent).toBe(true);
    expect(expert.patient.shockDeliveredByLearner).toBe(false);
    expect(expert.patient.treatmentDeliveredByLearner).toBe(false);
    expect(JSON.stringify(expert.events)).toContain('sinus bradycardia 52/min');
  });
});
