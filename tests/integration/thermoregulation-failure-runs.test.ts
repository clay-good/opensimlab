/**
 * Reference transcripts for the neonatal thermoregulation lesson, replayed
 * through the real engine.
 *
 * The error path moves straight to warming her. A cold newborn with a
 * warming-continuity gap has an explanation sitting right there, and the shape
 * refused here is acting on it before the team, the trajectory and the rest of
 * the newborn have been connected — because the available explanation is what
 * makes an illness underneath easy to miss. The recovery path starts from
 * exactly that refusal.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { THERMOREGULATION_FAILURE as SCENARIO } from '../../src/modules/neonatology/scenarios/thermoregulation-failure';
import { THERMOREGULATION_FIXTURES as FIXTURES } from '../../src/modules/neonatology/thermoregulation-failure-fixtures';
import type { ThermoregulationAction } from '../../src/modules/neonatology/thermoregulation-failure';
import { thermoregulationCompletionEvidence } from '../../src/modules/neonatology/thermoregulation-failure-completion';
import { thermoregulationInlinePrompt } from '../../src/modules/neonatology/tutor/thermoregulation-failure-guidance';

type Choices = readonly (readonly [number, ThermoregulationAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: ThermoregulationAction): LearnerAction => ({ tick, type: 'neonatal-thermoregulation-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.neonatologyThermoregulationAssessment);
    const prompt = thermoregulationInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      thermoregulation: frame.equipment.resuscitation.neonatologyThermoregulationAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.neonatologyThermoregulationAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.neonatologyThermoregulationAssessment! };
}

describe('Neonatal thermoregulation transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'neonatology', 'delivery-room', 'state_transition');
    expect(audit.complete).toBe(false);
    // The objectives cap is a content-design decision across four modules, and
    // the two runtime requirements need people and hardware. Nothing else remains.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(thermoregulationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neonatology')).toHaveLength(9);
    expect(thermoregulationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(thermoregulationCompletionEvidence(SCENARIO, 'changed', 'neonatology')).toEqual([]);
    expect(thermoregulationCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'neonatology')).toEqual([]);
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
    expect(idle.patient.supportAtTick).toBeNull();
  });

  it('refuses a rewarming reached for before the team and the trajectory are connected', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      supportAtTick: null, recognitionAtTick: null, reassessmentAtTick: null, handoffAtTick: null,
    });
    expect(findings(errored.events).every(({ outcome }) => outcome === 'not-met')).toBe(true);
    expect(JSON.stringify(errored.events)).toContain('support-order-refused');
  });

  it('lets the same run recover, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    // The counterfactual is that the early error stays visible after the correction.
    expect(JSON.stringify(recovered.events)).toContain('support-order-refused');
    expect(recovered.patient.durableGlucoseStabilityProven).toBe(false);
    expect(recovered.patient.prescribedRewarmingRateClaimed).toBe(false);
    expect(recovered.patient.setPointOrRewarmingRateSelectedByLearner).toBe(false);
    expect(recovered.patient.treatmentEffectProven).toBe(false);
    expect(recovered.patient.causeDetermined).toBe(false);
    expect(recovered.patient.infectionOrOtherIllnessExcluded).toBe(false);
    expect(recovered.patient.durableThermalStabilityProven).toBe(false);
    expect(recovered.patient.newbornOutcomePredicted).toBe(false);
  });
});
