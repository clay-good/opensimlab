/**
 * Reference transcripts for the ARDS lung-protective lesson, replayed through
 * the real engine.
 *
 * The assertion this file exists for is that the tidal-volume intent is gated
 * behind the predicted-body-weight basis, so a volume is never chosen first and
 * justified afterwards.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ARDS_LUNG_PROTECTIVE_VENTILATION as SCENARIO } from '../../src/modules/critical-care/scenarios/ards-lung-protective-ventilation';
import { ARDS_LUNG_PROTECTIVE_FIXTURES as FIXTURES } from '../../src/modules/critical-care/ards-lung-protective-fixtures';
import {
  ARDS_LUNG_PROTECTIVE_ACTIONS, ARDS_LUNG_PROTECTIVE_OBJECTIVES,
  supportsArdsLungProtective, type ArdsLungProtectiveAction,
} from '../../src/modules/critical-care/ards-lung-protective';
import { ardsLungProtectiveCompletionEvidence } from '../../src/modules/critical-care/ards-lung-protective-completion';
import { ardsLungProtectiveInlinePrompt } from '../../src/modules/critical-care/tutor/ards-lung-protective-guidance';

type Choices = readonly (readonly [number, ArdsLungProtectiveAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: ArdsLungProtectiveAction): LearnerAction => ({ tick, type: 'ards-lung-protective-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.ardsLungProtectiveAssessment);
    const prompt = ardsLungProtectiveInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.ardsLungProtectiveAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.ardsLungProtectiveAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.ardsLungProtectiveAssessment! };
}

describe('ARDS lung-protective transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(ARDS_LUNG_PROTECTIVE_ACTIONS).toHaveLength(5);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsArdsLungProtective(SCENARIO)).toBe(true);
    expect(supportsArdsLungProtective({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'ards-lung-protective-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(ardsLungProtectiveCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(ardsLungProtectiveCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
    expect(ardsLungProtectiveCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(ardsLungProtectiveCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    // The two vocabularies diverge in all five positions here. Comparing the action
    // array would let the guard pass on a scenario the engine cannot actually run.
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...ARDS_LUNG_PROTECTIVE_OBJECTIVES]);
    expect([...ARDS_LUNG_PROTECTIVE_OBJECTIVES]).not.toEqual([...ARDS_LUNG_PROTECTIVE_ACTIONS]);
    for (const [index, objective] of ARDS_LUNG_PROTECTIVE_OBJECTIVES.entries()) {
      expect(objective, `position ${index}`).not.toBe(ARDS_LUNG_PROTECTIVE_ACTIONS[index]);
    }
    expect(supportsArdsLungProtective({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: ARDS_LUNG_PROTECTIVE_ACTIONS.map((id, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id,
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
    expect(expert.patient.escalationAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.baselineAtTick).toBeNull();
  });

  it('refuses a tidal-volume intent with no predicted-body-weight basis under it', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.baselineAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      pbwAtTick: null, protectionAtTick: null,
      reassessmentAtTick: null, escalationAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Establish the height-and-sex predicted-body-weight basis before setting tidal volume');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.escalationAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review oxygenation, mechanics, support, synchrony, and circulation first');
    expect(transcript).toContain('Reassess mechanics, gas exchange, synchrony, and circulation before escalating support');
    expect(recovered.patient.baselineAtTick).toBeLessThan(recovered.patient.pbwAtTick!);
    expect(recovered.patient.pbwAtTick).toBeLessThan(recovered.patient.protectionAtTick!);
    expect(recovered.patient.protectionAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
    expect(recovered.patient.reassessmentAtTick).toBeLessThan(recovered.patient.escalationAtTick!);
  });

  it('refuses every later step before the baseline is reviewed', () => {
    for (const action of ARDS_LUNG_PROTECTIVE_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review oxygenation, mechanics, support, synchrony, and circulation first');
      expect(refused.patient.baselineAtTick).toBeNull();
    }
  });

  it('refuses the reassessment until the protective settings are on the record', () => {
    const short = run([[0, 'review-ards-baseline'], [1, 'calculate-ards-pbw'],
      [2, 'reassess-ards-protection']], 5);
    expect(JSON.stringify(short.events))
      .toContain('Record predicted-body-weight lung protection before reassessment');
    expect(short.patient.reassessmentAtTick).toBeNull();
  });
});
