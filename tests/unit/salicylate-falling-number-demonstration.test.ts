/**
 * The worked example and observed-state tutor for a poisoning where the number
 * going down is the bad news.
 *
 * Three findings read backwards here: the near-normal pH is two disorders
 * cancelling, the fast breathing is the compensation rather than the distress,
 * and the fallen nine-hour concentration arrives with a worse pH, a worse
 * potassium and new confusion. Both the tutor and the example say so each time,
 * and both name the airway as this lesson's hazard without turning it into
 * never.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SALICYLATE_FALLING_NUMBER as SCENARIO } from '../../src/modules/toxicology/scenarios/salicylate-falling-number';
import { SALICYLATE_FIXTURES as FIXTURES } from '../../src/modules/toxicology/salicylate-falling-number-fixtures';
import {
  SALICYLATE_DEMONSTRATION_VERSION, salicylateDemonstrationStep,
  supportsSalicylateDemonstration,
} from '../../src/modules/toxicology/demo/salicylate-falling-number-demonstration';
import { salicylateInlinePrompt } from '../../src/modules/toxicology/tutor/salicylate-falling-number-guidance';
import type { SalicylateAction } from '../../src/modules/toxicology/salicylate-falling-number';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologySalicylateAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: SalicylateAction) => {
  engine.apply({ tick, type: 'salicylate-falling-number-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = salicylateDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'salicylate-falling-number-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Reads Three Findings Backwards', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(SALICYLATE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsSalicylateDemonstration(SCENARIO)).toBe(true);
    expect(supportsSalicylateDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsSalicylateDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognize', 'support', 'evidence', 'report', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.evidenceAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('calls the fast breathing the compensation rather than the distress', () => {
    expect(narrations[beats.indexOf('trajectory')]).toContain('the compensation she is running on');
    expect(narrations[beats.indexOf('trajectory')]).toContain('not a treatment guide');
  });

  it('says what the near-normal pH is made of', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('at the same time, not a patient compensating well');
    expect(recognize).toContain('stay coupled');
  });

  it('names the airway as a hazard without turning it into never', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('removes the hyperventilation holding her pH up');
    expect(evidence).toContain('rather than a default');
    expect(patient.airwayPlanSelectedByLearner).toBe(false);
    expect(patient.ventilationSelectedByLearner).toBe(false);
  });

  it('reads the fallen concentration as deterioration', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('down from 52');
    expect(handoff).toContain('ominous rather than improvement');
    expect(narration).toContain('worse than she arrived');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.tissueConcentrationProven).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.ongoingAbsorptionExcluded).toBe(false);
    expect(patient.pulmonaryComplicationsExcluded).toBe(false);
    expect(patient.dialysisEligibilityDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she is improving', 'the level is coming down nicely', 'the alkalinization is working', 'the drug has moved into tissue']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('selects no fluid, dose, route, dialysis threshold, or modality anywhere', () => {
    expect(patient.decontaminationSelectedByLearner).toBe(false);
    expect(patient.fluidSelectedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    expect(patient.dialysisSelectedByLearner).toBe(false);
    expect(patient.acidBaseCalculatedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['sodium bicarbonate 150', 'target a urine ph of', 'dialyse above 100', 'intubate her now']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Watches The pH Rather Than The Number', () => {
  it('opens on the breathing as a finding', () => {
    const engine = create(); engine.step();
    const prompt = salicylateInlinePrompt('guided', {
      scenarioVersion: '0.1.0', salicylate: snapshot(engine),
    })!;
    expect(prompt.id).toBe('salicylate-trajectory');
    expect(prompt.because).toContain('the compensation she is running on');
    expect(prompt.because).toContain('none of that is the same as stable');
  });

  it('decomposes the near-normal pH', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = salicylateInlinePrompt('guided', {
      scenarioVersion: '0.1.0', salicylate: snapshot(engine),
    })!;
    expect(prompt.id).toBe('salicylate-recognize');
    expect(prompt.because).toContain('at the same time, not a patient who is compensating well');
    expect(prompt.because).toContain('stay coupled');
  });

  it('gets nephrology in before the point of decision', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = salicylateInlinePrompt('guided', {
      scenarioVersion: '0.1.0', salicylate: snapshot(engine),
    })!;
    expect(prompt.id).toBe('salicylate-support');
    expect(prompt.because).toContain('getting them late is the failure mode');
  });

  it('names the potassium and the airway before anything is committed to', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = salicylateInlinePrompt('guided', {
      scenarioVersion: '0.1.0', salicylate: snapshot(engine),
    })!;
    expect(prompt.id).toBe('salicylate-evidence');
    expect(prompt.because).toContain('limits what urinary alkalinization can achieve');
    expect(prompt.because).toContain('does not make it never right');
  });

  it('never calls the falling number improvement, and never doses or intubates', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = salicylateInlinePrompt('guided', {
        scenarioVersion: '0.1.0', salicylate: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['she is improving', 'sodium bicarbonate 150', 'intubate her now', 'dialyse above 100']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(salicylateInlinePrompt('guided', { scenarioVersion: '0.1.0', salicylate: patient })!.id)
      .toBe('salicylate-observe');
    expect(salicylateInlinePrompt('coached', { scenarioVersion: '0.1.0', salicylate: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(salicylateInlinePrompt('unassisted', { scenarioVersion: '0.1.0', salicylate: patient })).toBeNull();
    expect(salicylateInlinePrompt('guided', { scenarioVersion: '0.1.1', salicylate: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(salicylateInlinePrompt('guided', { scenarioVersion: '0.1.0', salicylate: snapshot(engine) })).toBeNull();
  });
});
