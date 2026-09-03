/**
 * Reference transcripts for the emergency obstructive-shock lesson, replayed
 * through the real engine.
 *
 * This is the only emergency-medicine lab scored on elapsed time rather than
 * on order, so the assertion this file exists for is that a run which records
 * all four steps in a defensible order and reaches the chest at two minutes
 * scores worse than one that does the same things quickly.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { OBSTRUCTIVE_SHOCK_TENSION_PNEUMOTHORAX as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/obstructive-shock-tension-pneumothorax';
import { OBSTRUCTIVE_PLEURAL_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/obstructive-shock-tension-pneumothorax-fixtures';
import {
  OBSTRUCTIVE_PLEURAL_SHOCK_OBJECTIVES, OBSTRUCTIVE_PLEURAL_SHOCK_WINDOWS,
  obstructivePleuralShockProgress, supportsObstructivePleuralShock,
} from '../../src/modules/emergency-medicine/obstructive-shock-tension-pneumothorax';
import { obstructivePleuralShockCompletionEvidence } from '../../src/modules/emergency-medicine/obstructive-shock-tension-pneumothorax-completion';
import { obstructivePleuralShockInlinePrompt } from '../../src/modules/emergency-medicine/tutor/obstructive-shock-tension-pneumothorax-guidance';

type Plan = readonly (readonly [number, Omit<LearnerAction, 'tick'>])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });

function run(plan: Plan, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256');
  const events: EngineEvent[] = []; const history: HistorySample[] = []; const actions: LearnerAction[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (plan[next]?.[0] === tick) {
      const action = { tick, ...plan[next]![1] } as LearnerAction;
      engine.apply(action); actions.push(action); next += 1;
    }
    const frame = engine.step(); events.push(...frame.events);
    history.push({ tick, state: frame.state as unknown as Record<string, number>, concentrations: [] });
    hash.update(JSON.stringify(frame));
    const patient = obstructivePleuralShockProgress(frame.equipment);
    const before = JSON.stringify(patient);
    const prompt = obstructivePleuralShockInlinePrompt(level, {
      scenarioVersion: SCENARIO.metadata.version, patient });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(obstructivePleuralShockProgress(frame.equipment))).toBe(before);
  }
  expect(next).toBe(plan.length);
  return {
    events, actions, history, hash: hash.digest('hex'),
    patient: obstructivePleuralShockProgress(engine.equipment()),
    findings: objectiveFindings(SCENARIO, history, 0, 0, actions, events),
  };
}

describe('Emergency obstructive pleural shock transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsObstructivePleuralShock(SCENARIO)).toBe(true);
    expect(supportsObstructivePleuralShock({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'tension-pneumothorax'),
    })).toBe(false);
    expect(obstructivePleuralShockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(obstructivePleuralShockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(obstructivePleuralShockCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(obstructivePleuralShockCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives and on the facemask this lesson assumes', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...OBSTRUCTIVE_PLEURAL_SHOCK_OBJECTIVES]);
    expect(supportsObstructivePleuralShock({
      ...SCENARIO,
      equipment: { ...SCENARIO.equipment, airwayDevice: 'tracheal-tube' },
    })).toBe(false);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across guidance levels and regions', (path) => {
    const plan: Plan = FIXTURES[path];
    const until = (plan.at(-1)?.[0] ?? 0) + 2;
    const reference = run(plan, until);
    for (const level of ['guided', 'coached'] as const) {
      expect(run(plan, until, level).hash).toBe(reference.hash);
    }
    expect(run(plan, until, 'unassisted', 'GB').hash).toBe(reference.hash);
  });

  it('meets every objective on the expert path and none with no action', () => {
    const expert = run(FIXTURES.expert, 900);
    expect(expert.findings.map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(expert.patient).toMatchObject({
      assessedAtTick: 1, helpRequestedAtTick: 2, highConcentrationOxygen: true, decompressedAtTick: 4,
    });
    const idle = run(FIXTURES.noAction, 900);
    expect(idle.findings.map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.assessedAtTick).toBeNull();
  });

  it('drives four different engine action types rather than one control list', () => {
    const expert = run(FIXTURES.expert, 900);
    expect([...new Set(expert.actions.map(({ type }) => type))].sort())
      .toEqual(['call-for-help', 'pneumothorax-response', 'ventilator']);
    const ids = expert.events.map(({ eventId }) => eventId);
    expect(ids.some((id) => id.startsWith('pneumothorax-assessed-'))).toBe(true);
    expect(ids.some((id) => id.startsWith('airway-help-requested-'))).toBe(true);
    expect(ids.some((id) => id.startsWith('pneumothorax-decompressed-'))).toBe(true);
  });

  it('fails a correct run purely for being late, which no other lesson here does', () => {
    const late = run(FIXTURES.commonError, 1400);
    // Every step was recorded, and in a defensible order.
    expect(late.patient).toMatchObject({
      assessedAtTick: 1, helpRequestedAtTick: 2, highConcentrationOxygen: true,
    });
    expect(late.patient.decompressedAtTick).toBe(1300);
    const seconds = 1300 / TICKS_PER_SECOND;
    expect(seconds).toBeGreaterThan(OBSTRUCTIVE_PLEURAL_SHOCK_WINDOWS.decompressionSeconds * 2);
    const outcomes = late.findings.map(({ outcome }) => outcome);
    expect(outcomes[0]).toBe('met');
    expect(outcomes[1]).toBe('met');
    expect(outcomes[2]).toBe('met');
    expect(outcomes[3]).toBe('not-met');
    expect(JSON.stringify(late.findings[3])).toContain('130 seconds after the modeled event');
  });

  it('refuses the assessment and the help request before the pleural event is active', () => {
    const recovered = run(FIXTURES.recovery, 900);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('No active modeled pleural event is available for this bounded response.');
    expect(transcript).toContain('No active modeled pleural event is available for this help request.');
    // The same two actions succeed one tick later, once the event has fired.
    expect(recovered.patient.assessedAtTick).toBe(1);
    expect(recovered.patient.helpRequestedAtTick).toBe(2);
  });

  it('refuses a duplicate decompression rather than double-counting it', () => {
    const recovered = run(FIXTURES.recovery, 900);
    expect(recovered.patient.decompressedAtTick).toBe(4);
    expect(JSON.stringify(recovered.events))
      .toContain('Left-chest decompression intent has already been accepted.');
    expect(recovered.findings.map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('credits recovery only after an accepted decompression', () => {
    const noDecompression = run([
      [1, { type: 'pneumothorax-response', payload: { action: 'assess-bilateral-ventilation' } }],
      [2, { type: 'call-for-help', payload: { context: 'tension-pneumothorax' } }],
      [3, { type: 'ventilator', payload: { fio2: 1 } }],
    ], 900);
    expect(noDecompression.patient.decompressedAtTick).toBeNull();
    expect(noDecompression.findings.map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'not-met']);
    expect(JSON.stringify(noDecompression.findings[4]))
      .toContain('Recovery was not credited because no accepted decompression intent preceded it.');
  });
});
