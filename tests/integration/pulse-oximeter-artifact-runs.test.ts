/**
 * Reference transcripts for the pulse-oximeter artifact lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that the clean-site reading is gated
 * behind an independent oxygenation measurement, so "artifact" is never
 * concluded from a story that happened to fit.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PULSE_OXIMETER_MOTION_ARTIFACT as SCENARIO } from '../../src/modules/critical-care/scenarios/pulse-oximeter-motion-artifact';
import { PULSE_OXIMETER_ARTIFACT_FIXTURES as FIXTURES } from '../../src/modules/critical-care/pulse-oximeter-artifact-fixtures';
import {
  PULSE_OXIMETER_ARTIFACT_ACTIONS, supportsPulseOximeterArtifact,
  type PulseOximeterArtifactAction,
} from '../../src/modules/critical-care/pulse-oximeter-artifact';
import { pulseOximeterArtifactCompletionEvidence } from '../../src/modules/critical-care/pulse-oximeter-artifact-completion';
import { pulseOximeterArtifactInlinePrompt } from '../../src/modules/critical-care/tutor/pulse-oximeter-artifact-guidance';

type Choices = readonly (readonly [number, PulseOximeterArtifactAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PulseOximeterArtifactAction): LearnerAction => ({ tick, type: 'pulse-oximeter-artifact-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.pulseOximeterArtifactAssessment);
    const prompt = pulseOximeterArtifactInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pulseOximeterArtifactAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pulseOximeterArtifactAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pulseOximeterArtifactAssessment! };
}

describe('Pulse-oximeter artifact transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(PULSE_OXIMETER_ARTIFACT_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...PULSE_OXIMETER_ARTIFACT_ACTIONS]);
    // The one lab in this module with three timeline events: the artifact plus two narratives.
    expect(SCENARIO.timeline).toHaveLength(3);
    expect(supportsPulseOximeterArtifact(SCENARIO)).toBe(true);
    expect(supportsPulseOximeterArtifact({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pulse-oximeter-motion-artifact-boundary'),
    })).toBe(false);
    expect(supportsPulseOximeterArtifact({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.type !== 'artifact'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(pulseOximeterArtifactCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(pulseOximeterArtifactCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
    expect(pulseOximeterArtifactCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(pulseOximeterArtifactCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(expert.patient.reassessedAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.discordanceAtTick).toBeNull();
  });

  it('refuses the clean-site reading when oxygenation was never measured another way', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.discordanceAtTick).not.toBeNull();
    expect(errored.patient.plethAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      probePerfusionAtTick: null, corroboratedAtTick: null, reassessedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the declared probe, motion, temperature, and local perfusion before corroborating oxygenation');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Recognize the display-versus-patient discordance before interrogating the signal path');
    expect(transcript).toContain('Corroborate oxygenation before recording the clean-site reassessment');
    expect(recovered.patient.discordanceAtTick).toBeLessThan(recovered.patient.plethAtTick!);
    expect(recovered.patient.plethAtTick).toBeLessThan(recovered.patient.probePerfusionAtTick!);
    expect(recovered.patient.probePerfusionAtTick).toBeLessThan(recovered.patient.corroboratedAtTick!);
    expect(recovered.patient.corroboratedAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every later step before the discordance is recognized', () => {
    for (const action of PULSE_OXIMETER_ARTIFACT_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Recognize the display-versus-patient discordance before interrogating the signal path');
      expect(refused.patient.discordanceAtTick).toBeNull();
    }
  });

  it('keeps the displayed number authored until the clean site is recorded', () => {
    const before = run([[0, 'recognize-pulse-oximeter-discordance']], 3);
    expect(before.patient.displayedSpo2Percent).toBe(82);
    expect(before.patient.displayedPulseRateBpm).toBe(132);
    const after = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(after.patient.displayedSpo2Percent).toBe(97);
    expect(after.patient.displayedPulseRateBpm).toBe(86);
  });
});
