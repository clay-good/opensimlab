/**
 * Reference transcripts for the emergency exertional-heat-stroke lesson,
 * replayed through the real engine.
 *
 * The assertion this file exists for is that nothing downstream of the support
 * bundle can be reached without recording cooling: the temperature here is the
 * thing to be treated, not the thing to be observed.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { EXERTIONAL_HEAT_STROKE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/exertional-heat-stroke';
import { EXERTIONAL_HEAT_STROKE_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/exertional-heat-stroke-fixtures';
import {
  EXERTIONAL_HEAT_STROKE_ACTIONS, EXERTIONAL_HEAT_STROKE_OBJECTIVES,
  supportsExertionalHeatStroke, type ExertionalHeatStrokeAction,
} from '../../src/modules/emergency-medicine/exertional-heat-stroke';
import { exertionalHeatStrokeCompletionEvidence } from '../../src/modules/emergency-medicine/exertional-heat-stroke-completion';
import { exertionalHeatStrokeInlinePrompt } from '../../src/modules/emergency-medicine/tutor/exertional-heat-stroke-guidance';

type Choices = readonly (readonly [number, ExertionalHeatStrokeAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
// The engine action type is shorter than the scenario id.
const choice = (tick: number, action: ExertionalHeatStrokeAction): LearnerAction => ({ tick, type: 'heat-stroke-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.heatStrokeAssessment);
    const prompt = exertionalHeatStrokeInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.heatStrokeAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.heatStrokeAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.heatStrokeAssessment! };
}

describe('Emergency exertional heat stroke transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(EXERTIONAL_HEAT_STROKE_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsExertionalHeatStroke(SCENARIO)).toBe(true);
    expect(supportsExertionalHeatStroke({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'exertional-heat-stroke-boundary'),
    })).toBe(false);
    expect(exertionalHeatStrokeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(exertionalHeatStrokeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(exertionalHeatStrokeCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(exertionalHeatStrokeCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...EXERTIONAL_HEAT_STROKE_OBJECTIVES]);
    expect([...EXERTIONAL_HEAT_STROKE_OBJECTIVES]).not.toEqual([...EXERTIONAL_HEAT_STROKE_ACTIONS]);
    expect(supportsExertionalHeatStroke({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: EXERTIONAL_HEAT_STROKE_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: EXERTIONAL_HEAT_STROKE_ACTIONS[index]!,
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
    expect(expert.patient.surveillanceAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.patternReviewedAtTick).toBeNull();
  });

  it('records the cooling threshold and excludes antipyretics and dantrolene by name', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const cooling = expert.events.find(({ eventId }) => eventId.startsWith('heat-stroke-cooling-'))!;
    expect(cooling.data).toMatchObject({ initialCoreTemperatureC: 41.3, stopBelowC: 39 });
    const target = expert.events.find(({ eventId }) => eventId.startsWith('heat-stroke-target-'))!;
    expect(target.data).toMatchObject({ coreTemperatureC: 38.9, elapsedMinutes: 14 });
    expect(JSON.stringify(target)).toContain('stopped below 39°C to limit overshoot');
    const surveillance = expert.events.find(({ eventId }) => eventId.startsWith('heat-stroke-surveillance-'))!;
    expect(JSON.stringify(surveillance))
      .toContain('Antipyretics and dantrolene were explicitly excluded');
  });

  it('refuses the cooling panel and the organ plan when no cooling was recorded', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.patternReviewedAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      supportAtTick: null, coolingAtTick: null, targetAtTick: null, surveillanceAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Record parallel support and prepare a safe rapid-cooling path before immersion intent.');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.surveillanceAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Record parallel support and prepare a safe rapid-cooling path before immersion intent.');
    expect(transcript).toContain('Review and stop at the fixed cooling target before closing the thermal rescue phase.');
    expect(recovered.patient.patternReviewedAtTick).toBeLessThan(recovered.patient.supportAtTick!);
    expect(recovered.patient.supportAtTick).toBeLessThan(recovered.patient.coolingAtTick!);
    expect(recovered.patient.coolingAtTick).toBeLessThan(recovered.patient.targetAtTick!);
    expect(recovered.patient.targetAtTick).toBeLessThan(recovered.patient.surveillanceAtTick!);
  });

  it('refuses every later step before the pattern is reviewed', () => {
    for (const action of EXERTIONAL_HEAT_STROKE_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review exertion, CNS dysfunction, rectal core temperature, ABCs, glucose, sodium, trauma, medications, and immediate mimics first.');
      expect(refused.patient.patternReviewedAtTick).toBeNull();
    }
  });

  it('refuses the cooling panel until immersion has been recorded', () => {
    const short = run([
      [0, 'review-heat-stroke-pattern'],
      [1, 'record-heat-stroke-support'],
      [2, 'reassess-heat-stroke-cooling-target'],
    ], 4);
    expect(short.patient.targetAtTick).toBeNull();
    expect(JSON.stringify(short.events))
      .toContain('Record rapid whole-body cooling before reviewing the authored target panel.');
  });
});
