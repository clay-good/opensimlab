/**
 * Reference transcripts for the cardiogenic-shock lesson, replayed through the
 * real engine.
 *
 * The assertion this file exists for is the position of the bridge in the
 * chain: it is gated behind the phenotype review, so a vasopressor cannot be
 * chosen for a heart nobody has looked at.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { CARDIOGENIC_SHOCK as SCENARIO } from '../../src/modules/critical-care/scenarios/cardiogenic-shock';
import { CARDIOGENIC_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/critical-care/cardiogenic-shock-fixtures';
import {
  CARDIOGENIC_SHOCK_ACTIONS, supportsCardiogenicShock, type CardiogenicShockAction,
} from '../../src/modules/critical-care/cardiogenic-shock';
import { cardiogenicShockCompletionEvidence } from '../../src/modules/critical-care/cardiogenic-shock-completion';
import { cardiogenicShockInlinePrompt } from '../../src/modules/critical-care/tutor/cardiogenic-shock-guidance';

type Choices = readonly (readonly [number, CardiogenicShockAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: CardiogenicShockAction): LearnerAction => ({ tick, type: 'cardiogenic-shock-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.cardiogenicShockAssessment);
    const prompt = cardiogenicShockInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.cardiogenicShockAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.cardiogenicShockAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.cardiogenicShockAssessment! };
}

describe('Cardiogenic-shock transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(CARDIOGENIC_SHOCK_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...CARDIOGENIC_SHOCK_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsCardiogenicShock(SCENARIO)).toBe(true);
    expect(supportsCardiogenicShock({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'cardiogenic-shock-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(cardiogenicShockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(cardiogenicShockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(cardiogenicShockCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(cardiogenicShockCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(expert.patient.reassessmentAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.recognitionAtTick).toBeNull();
  });

  it('refuses a bridge chosen for a heart nobody has looked at', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      phenotypeAtTick: null, bridgeAtTick: null, causeControlAtTick: null, reassessmentAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the cause, phenotype, congestion, and dangerous alternatives before recording a bridge');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessmentAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Recognize the perfusion trajectory and activate experienced shock help first');
    expect(transcript).toContain('Record a phenotype-linked bridge before definitive cause control');
    expect(recovered.patient.recognitionAtTick).toBeLessThan(recovered.patient.phenotypeAtTick!);
    expect(recovered.patient.phenotypeAtTick).toBeLessThan(recovered.patient.bridgeAtTick!);
    expect(recovered.patient.bridgeAtTick).toBeLessThan(recovered.patient.causeControlAtTick!);
    expect(recovered.patient.causeControlAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
  });

  it('refuses every later step before the shock is named', () => {
    for (const action of CARDIOGENIC_SHOCK_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Recognize the perfusion trajectory and activate experienced shock help first');
      expect(refused.patient.recognitionAtTick).toBeNull();
    }
  });

  it('activates the teams off the trajectory rather than the pressure', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const transcript = JSON.stringify(expert.events);
    expect(transcript).toContain('not pressure alone');
    expect(transcript).toContain('lactate rising from 3.1 to 4.8 mmol/L');
  });
});
