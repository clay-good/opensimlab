/**
 * Reference transcripts for the emergency diabetic-ketoacidosis lesson,
 * replayed through the real engine.
 *
 * The assertion this file exists for is the potassium gate: the insulin intent
 * is locked while potassium is 3.2 mmol/L, and it is insulin that moves
 * potassium into cells. The mirror assertion sits at the other end, where the
 * resolution transition is gated behind continuing insulin through an improved
 * glucose.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { DIABETIC_KETOACIDOSIS as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/diabetic-ketoacidosis';
import { DIABETIC_KETOACIDOSIS_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/diabetic-ketoacidosis-fixtures';
import {
  DIABETIC_KETOACIDOSIS_ACTIONS, DIABETIC_KETOACIDOSIS_OBJECTIVES,
  supportsDiabeticKetoacidosis, type DiabeticKetoacidosisAction,
} from '../../src/modules/emergency-medicine/diabetic-ketoacidosis';
import { diabeticKetoacidosisCompletionEvidence } from '../../src/modules/emergency-medicine/diabetic-ketoacidosis-completion';
import { diabeticKetoacidosisInlinePrompt } from '../../src/modules/emergency-medicine/tutor/diabetic-ketoacidosis-guidance';

type Choices = readonly (readonly [number, DiabeticKetoacidosisAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: DiabeticKetoacidosisAction): LearnerAction => ({ tick, type: 'diabetic-ketoacidosis-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.diabeticKetoacidosisAssessment);
    const prompt = diabeticKetoacidosisInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.diabeticKetoacidosisAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.diabeticKetoacidosisAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.diabeticKetoacidosisAssessment! };
}

describe('Emergency diabetic ketoacidosis transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(DIABETIC_KETOACIDOSIS_ACTIONS).toHaveLength(6);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsDiabeticKetoacidosis(SCENARIO)).toBe(true);
    expect(supportsDiabeticKetoacidosis({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'diabetic-ketoacidosis-boundary'),
    })).toBe(false);
    expect(diabeticKetoacidosisCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(diabeticKetoacidosisCompletionEvidence(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(diabeticKetoacidosisCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(diabeticKetoacidosisCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...DIABETIC_KETOACIDOSIS_OBJECTIVES]);
    expect([...DIABETIC_KETOACIDOSIS_OBJECTIVES]).not.toEqual([...DIABETIC_KETOACIDOSIS_ACTIONS.slice(0, 5)]);
    expect(supportsDiabeticKetoacidosis({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: DIABETIC_KETOACIDOSIS_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: DIABETIC_KETOACIDOSIS_ACTIONS[index]!,
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
    expect(expert.patient.transitionAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.presentationReviewedAtTick).toBeNull();
  });

  it('publishes the authored panels as constants rather than a modelled response', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const potassium = expert.events.find(({ eventId }) => eventId.startsWith('dka-potassium-'))!;
    expect(potassium.data).toMatchObject({
      initialPotassiumMmolPerL: 3.2, repeatPotassiumMmolPerL: 3.7,
    });
    const dextrose = expert.events.find(({ eventId }) => eventId.startsWith('dka-dextrose-'))!;
    expect(dextrose.data).toMatchObject({
      glucoseMgPerDl: 238, betaHydroxybutyrateMmolPerL: 2.2, venousPh: 7.24,
    });
    const transition = expert.events.find(({ eventId }) => eventId.startsWith('dka-transition-'))!;
    expect(transition.data).toMatchObject({
      glucoseMgPerDl: 186, betaHydroxybutyrateMmolPerL: 0.4, venousPh: 7.32,
      bicarbonateMmolPerL: 19,
    });
    expect(JSON.stringify(transition))
      .toContain('anion gap and urine ketones were not used alone');
  });

  it('locks insulin while potassium is 3.2, and names the potassium in the refusal', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.fluidsAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      potassiumAtTick: null, insulinAtTick: null, dextroseAtTick: null, transitionAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Potassium is 3.2 mmol/L. Record replacement and a repeat above 3.5 mmol/L before insulin intent.');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.transitionAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review diabetes or hyperglycemia, ketones, acidosis, severity, potassium, volume status, and precipitants first.');
    expect(transcript).toContain('Record insulin intent only after the potassium gate before reviewing the fixed treatment panel.');
    expect(recovered.patient.presentationReviewedAtTick).toBeLessThan(recovered.patient.fluidsAtTick!);
    expect(recovered.patient.fluidsAtTick).toBeLessThan(recovered.patient.potassiumAtTick!);
    expect(recovered.patient.potassiumAtTick).toBeLessThan(recovered.patient.insulinAtTick!);
    expect(recovered.patient.insulinAtTick).toBeLessThan(recovered.patient.dextroseAtTick!);
    expect(recovered.patient.dextroseAtTick).toBeLessThan(recovered.patient.transitionAtTick!);
  });

  it('refuses every later step before the presentation is reviewed', () => {
    for (const action of DIABETIC_KETOACIDOSIS_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review diabetes or hyperglycemia, ketones, acidosis, severity, potassium, volume status, and precipitants first.');
      expect(refused.patient.presentationReviewedAtTick).toBeNull();
    }
  });

  it('refuses the resolution transition until insulin has continued through the interval panel', () => {
    const short = run([
      [0, 'review-dka-presentation'],
      [1, 'record-dka-fluids-and-monitoring'],
      [2, 'record-dka-potassium-replacement'],
      [3, 'record-dka-insulin-intent'],
      [4, 'confirm-dka-resolution-and-transition'],
    ], 6);
    expect(short.patient.insulinAtTick).not.toBeNull();
    expect(short.patient).toMatchObject({ dextroseAtTick: null, transitionAtTick: null });
    expect(JSON.stringify(short.events))
      .toContain('Add dextrose and continue insulin through the unresolved fixed panel before transition.');
  });

  it('refuses fluids before the presentation, and potassium before fluids', () => {
    const noFluids = run([
      [0, 'review-dka-presentation'],
      [1, 'record-dka-potassium-replacement'],
    ], 3);
    expect(noFluids.patient.potassiumAtTick).toBeNull();
    expect(JSON.stringify(noFluids.events))
      .toContain('Record initial fluid resuscitation and serial monitoring before electrolyte and insulin intent.');
  });
});
