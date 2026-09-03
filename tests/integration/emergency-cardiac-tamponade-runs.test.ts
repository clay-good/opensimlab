/**
 * Reference transcripts for the emergency cardiac-tamponade lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is the inverse of every other lesson's:
 * the obstructive physiology declared at arrival is still running after every
 * accepted action, and the engine says so on the reassessment event rather
 * than leaving it to be inferred.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { CARDIAC_TAMPONADE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/cardiac-tamponade';
import { CARDIAC_TAMPONADE_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/cardiac-tamponade-fixtures';
import {
  CARDIAC_TAMPONADE_ACTIONS, CARDIAC_TAMPONADE_OBJECTIVES,
  supportsCardiacTamponade, type CardiacTamponadeAction,
} from '../../src/modules/emergency-medicine/cardiac-tamponade';
import { cardiacTamponadeCompletionEvidence } from '../../src/modules/emergency-medicine/cardiac-tamponade-completion';
import { cardiacTamponadeInlinePrompt } from '../../src/modules/emergency-medicine/tutor/cardiac-tamponade-guidance';

type Choices = readonly (readonly [number, CardiacTamponadeAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
// The engine action type here is `-assessment`, not the usual `-response`.
const choice = (tick: number, action: CardiacTamponadeAction): LearnerAction => ({ tick, type: 'cardiac-tamponade-assessment', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.cardiacTamponadeAssessment);
    const prompt = cardiacTamponadeInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.cardiacTamponadeAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.cardiacTamponadeAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.cardiacTamponadeAssessment! };
}

describe('Emergency cardiac tamponade transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(CARDIAC_TAMPONADE_ACTIONS).toHaveLength(4);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsCardiacTamponade(SCENARIO)).toBe(true);
    expect(supportsCardiacTamponade({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'cardiac-tamponade'),
    })).toBe(false);
    expect(cardiacTamponadeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(cardiacTamponadeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(cardiacTamponadeCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(cardiacTamponadeCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...CARDIAC_TAMPONADE_OBJECTIVES]);
    expect([...CARDIAC_TAMPONADE_OBJECTIVES]).not.toEqual([...CARDIAC_TAMPONADE_ACTIONS]);
    expect(supportsCardiacTamponade({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: CARDIAC_TAMPONADE_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: CARDIAC_TAMPONADE_ACTIONS[index]!,
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
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.contextReviewedAtTick).toBeNull();
  });

  it('leaves the obstruction unrelieved even on the fully correct path', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const reassessment = expert.events.find(({ eventId }) => eventId.startsWith('tamponade-perfusion-reassessed-'))!;
    expect(reassessment).toBeDefined();
    expect(reassessment.data).toMatchObject({
      definitiveControlIntentRecorded: true, treatmentDelivered: false, physiologyResolved: false,
    });
    expect(JSON.stringify(reassessment))
      .toContain('remains compatible with unresolved obstructive shock');
    const control = expert.events.find(({ eventId }) => eventId.startsWith('tamponade-control-recorded-'))!;
    expect(control.data).toMatchObject({ intentOnly: true, treatmentDelivered: false });
  });

  it('refuses the focused finding, and then the escalation, when the patient was not read first', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      contextReviewedAtTick: null, pocusReviewedAtTick: null,
      definitiveControlAtTick: null, reassessedAtTick: null,
    });
    const transcript = JSON.stringify(errored.events);
    expect(transcript).toContain('Review the mechanism and whole-patient perfusion evidence before the fixed POCUS finding.');
    expect(transcript).toContain('Review the fixed POCUS finding before recording immediate definitive-control intent.');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses the skipped finding and the too-early reassessment, and still completes', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review the fixed POCUS finding before recording immediate definitive-control intent.');
    expect(transcript).toContain('allow the next engine tick before reassessment');
    expect(recovered.patient.contextReviewedAtTick).toBeLessThan(recovered.patient.pocusReviewedAtTick!);
    expect(recovered.patient.pocusReviewedAtTick).toBeLessThan(recovered.patient.definitiveControlAtTick!);
    expect(recovered.patient.definitiveControlAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every later step before the whole-patient review', () => {
    for (const action of CARDIAC_TAMPONADE_ACTIONS.slice(1)) {
      const refused = run([[1, action]], 3);
      expect(refused.patient.contextReviewedAtTick, action).toBeNull();
      expect(JSON.stringify(refused.events), action).toMatch(/order-refused/);
    }
  });

  it('refuses every control outright before the arrival event is active', () => {
    for (const action of CARDIAC_TAMPONADE_ACTIONS) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('The bounded tamponade choices are available only while the declared event is active.');
      expect(refused.patient.contextReviewedAtTick, action).toBeNull();
    }
  });

  it('refuses a reassessment recorded on the same tick as the escalation', () => {
    const early = run([
      [1, 'review-context-and-perfusion'],
      [2, 'review-fixed-pocus'],
      [3, 'record-definitive-control-intent'],
      [3, 'reassess-perfusion'],
    ], 5);
    expect(early.patient.reassessedAtTick).toBeNull();
    expect(JSON.stringify(early.events))
      .toContain('allow the next engine tick before reassessment');
  });
});
