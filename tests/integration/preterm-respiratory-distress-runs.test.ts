/**
 * Reference transcripts for the preterm respiratory distress lesson, replayed
 * through the real engine.
 *
 * The error path names the support branch from the gestation. Twenty-nine
 * weeks with grunting and retractions makes the answer feel automatic, and the
 * shape refused here is choosing it before the CPAP-capable team, the thermal
 * plan and the breathing itself have been established — because it is the
 * spontaneous breathing, not the gestation, that decides this branch. The
 * recovery path starts from exactly that refusal.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PRETERM_RESPIRATORY_DISTRESS as SCENARIO } from '../../src/modules/neonatology/scenarios/preterm-respiratory-distress';
import { PRETERM_RESPIRATORY_DISTRESS_FIXTURES as FIXTURES } from '../../src/modules/neonatology/preterm-respiratory-distress-fixtures';
import type { PretermRespiratoryDistressAction } from '../../src/modules/neonatology/preterm-respiratory-distress';
import { pretermRespiratoryDistressCompletionEvidence } from '../../src/modules/neonatology/preterm-respiratory-distress-completion';
import { pretermRespiratoryDistressInlinePrompt } from '../../src/modules/neonatology/tutor/preterm-respiratory-distress-guidance';

type Choices = readonly (readonly [number, PretermRespiratoryDistressAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PretermRespiratoryDistressAction): LearnerAction => ({ tick, type: 'preterm-respiratory-distress-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.neonatologyPretermRespiratoryDistressAssessment);
    const prompt = pretermRespiratoryDistressInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      pretermRespiratoryDistress: frame.equipment.resuscitation.neonatologyPretermRespiratoryDistressAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.neonatologyPretermRespiratoryDistressAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.neonatologyPretermRespiratoryDistressAssessment! };
}

describe('Preterm respiratory distress transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.1', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'neonatology', 'delivery-room', 'state_transition');
    expect(audit.complete).toBe(false);
    // The objectives cap is a content-design decision across four modules, and
    // the two runtime requirements need people and hardware. Nothing else remains.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pretermRespiratoryDistressCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neonatology')).toHaveLength(9);
    expect(pretermRespiratoryDistressCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(pretermRespiratoryDistressCompletionEvidence(SCENARIO, 'changed', 'neonatology')).toEqual([]);
    expect(pretermRespiratoryDistressCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'neonatology')).toEqual([]);
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

  it('refuses a branch chosen from the gestation before the team and the breathing are connected', () => {
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
    expect(recovered.patient.durableStabilityProven).toBe(false);
    expect(recovered.patient.adequateVentilationProven).toBe(false);
    expect(recovered.patient.respiratoryDiseaseExcluded).toBe(false);
    expect(recovered.patient.infectionExcluded).toBe(false);
    expect(recovered.patient.airLeakExcluded).toBe(false);
    expect(recovered.patient.congenitalDiseaseExcluded).toBe(false);
    expect(recovered.patient.newbornOutcomePredicted).toBe(false);
  });
});
