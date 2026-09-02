/**
 * The worked example and observed-state tutor for a patient whose body size
 * is the least useful fact about her.
 *
 * A BMI of 43.3, a bicarbonate of 30 and an AHI of 48 are each striking
 * enough to end the thinking early. None of them diagnoses anything here.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { OBESITY_HYPOVENTILATION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/obesity-hypoventilation-reassessment';
import { OBESITY_HYPOVENTILATION_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/obesity-hypoventilation-reassessment-fixtures';
import {
  OBESITY_HYPOVENTILATION_DEMONSTRATION_VERSION, obesityHypoventilationDemonstrationStep,
  supportsObesityHypoventilationDemonstration,
} from '../../src/modules/respiratory-medicine/demo/obesity-hypoventilation-reassessment-demonstration';
import { obesityHypoventilationInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/obesity-hypoventilation-reassessment-guidance';
import type { ObesityHypoventilationAction } from '../../src/modules/respiratory-medicine/obesity-hypoventilation-reassessment';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obesityHypoventilationAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: ObesityHypoventilationAction) => {
  engine.apply({ tick, type: 'obesity-hypoventilation-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = obesityHypoventilationDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'obesity-hypoventilation-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Diagnose From One Number', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(OBESITY_HYPOVENTILATION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsObesityHypoventilationDemonstration(SCENARIO)).toBe(true);
    expect(supportsObesityHypoventilationDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsObesityHypoventilationDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the enforced order', () => {
    expect(beats).toEqual(['phenotype', 'awake', 'sleep', 'recognition', 'plan', 'handoff']);
    expect(patient.phenotypeAtTick).toBeLessThan(patient.awakeEvidenceAtTick!);
    expect(patient.phenotypeAtTick).toBeLessThan(patient.sleepEvidenceAtTick!);
    // Recognition waits for both lanes; the handoff waits for a later tick still.
    expect(patient.awakeEvidenceAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.sleepEvidenceAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.coordinatedPlanAtTick!);
    expect(patient.coordinatedPlanAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('starts with her symptoms and her day rather than her body size', () => {
    const phenotype = narrations[beats.indexOf('phenotype')]!;
    expect(phenotype).toContain('not her body size');
    expect(phenotype).toContain('most likely to be mistaken for the whole assessment');
    expect(patient.obesityAuthored).toBe(true);
    expect(patient.acuteRespiratoryFailureAuthored).toBe(false);
  });

  it('will not let a raised bicarbonate stand in for a diagnosis', () => {
    const awake = narrations[beats.indexOf('awake')]!;
    expect(awake).toContain('a reasonable prompt to measure PaCO₂');
    expect(awake).toContain('it is not a diagnosis of obesity hypoventilation');
    expect(patient.daytimeHypercapniaAuthored).toBe(true);
    expect(patient.serumBicarbonateAcquiredByLearner).toBe(false);
  });

  it('notices how much the clean results do not exclude', () => {
    const sleep = narrations[beats.indexOf('sleep')]!;
    expect(sleep).toContain('Those narrow the field');
    expect(sleep).toContain('do not permanently exclude');
    expect(patient.sleepDisorderedBreathingAuthored).toBe(true);
    expect(patient.otherCausesExcludedByLearner).toBe(false);
  });

  it('records a convergent pattern rather than a diagnosis', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('do not diagnose from any single number');
    expect(recognition).toContain('however striking');
    expect(recognition).toContain('not a diagnosis of obesity hypoventilation syndrome');
    expect(patient.diagnosisDeterminedByLearner).toBe(false);
    expect(patient.obesityCausalityProven).toBe(false);
  });

  it('keeps the respect in the plan', () => {
    const plan = narrations[beats.indexOf('plan')]!;
    expect(plan).toContain('what she can actually access');
    expect(plan).toContain('a plan she does not recognize herself in is not a plan');
    expect(patient.patientPreferenceInferred).toBe(false);
  });

  it('ends on a pattern with its work still open', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('what each one does and does not establish');
    expect(handoff).toContain('a name against each part of it');
    expect(narration).toContain('two independent lanes of evidence agree on');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('delivers nothing, selects nothing, and predicts nothing', () => {
    expect(patient.examinationPerformedByLearner).toBe(false);
    expect(patient.bmiCalculatedByLearner).toBe(false);
    expect(patient.bloodGasAcquiredByLearner).toBe(false);
    expect(patient.sleepStudyAcquiredByLearner).toBe(false);
    expect(patient.sleepStudyScoredByLearner).toBe(false);
    expect(patient.sleepStudyInterpretedByLearner).toBe(false);
    expect(patient.testInterpretedByLearner).toBe(false);
    expect(patient.oxygenSelectedByLearner).toBe(false);
    expect(patient.supportDeviceSelectedByLearner).toBe(false);
    expect(patient.deviceOperatedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.weightInterventionSelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she has obesity hypoventilation syndrome', 'the obesity is causing', 'her bmi explains', 'she needs to lose']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    for (const forbidden of ['start cpap', 'start niv', 'set the pressure', 'refer for bariatric surgery']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Does Not Diagnose From One Number', () => {
  it('opens on her symptoms and her day', () => {
    const engine = create(); engine.step();
    const prompt = obesityHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ohs-phenotype');
    expect(prompt.suggestion).toContain('not her body size');
    expect(prompt.because).toContain('most likely to be mistaken for the whole assessment');
  });

  it('names whichever evidence lane is still empty', () => {
    // Reading the sleep study first is legitimate here, so the tutor should
    // then ask for the awake gas rather than repeating the sleep beat.
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    expect(obesityHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!.id).toBe('ohs-awake');
    const other = create();
    advance(other, 0, 'reconcile-obesity-hypoventilation-phenotype-and-trajectory');
    advance(other, 1, 'review-obesity-hypoventilation-sleep-evidence-and-open-causes');
    const prompt = obesityHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(other) })!;
    expect(prompt.id).toBe('ohs-awake');
    expect(prompt.suggestion).toContain('be careful what you let the bicarbonate mean');
  });

  it('refuses to conclude from any single number', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = obesityHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ohs-recognition');
    expect(prompt.suggestion).toContain('do not diagnose from any single number');
    expect(prompt.because).toContain('however striking');
  });

  it('keeps the respect in the plan', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const prompt = obesityHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ohs-plan');
    expect(prompt.suggestion).toContain('keep the respect in it');
    expect(prompt.because).toContain('is not a plan');
  });

  it('never diagnoses, selects a device, or predicts an outcome', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = obesityHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['she has obesity hypoventilation syndrome', 'start cpap', 'start niv', 'she needs to lose']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(obesityHypoventilationInlinePrompt('unassisted', { scenarioVersion: '0.1.0', patient })).toBeNull();
    expect(obesityHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(obesityHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(obesityHypoventilationInlinePrompt(level, { scenarioVersion: '0.1.0', patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
