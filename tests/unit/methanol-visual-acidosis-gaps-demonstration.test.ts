/**
 * The worked example and observed-state tutor for two numbers that look like an
 * answer.
 *
 * The gaps are the most satisfying thing at this bedside and the least
 * conclusive: a pair on a clock, moving in opposite directions. The vision is
 * the part that is not a clue. Both the tutor and the example date the visual
 * injury by the clock, find the antidote and extracorporeal owners before any
 * concentration arrives, and determine no eligibility for either.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { METHANOL_VISUAL_ACIDOSIS_GAPS as SCENARIO } from '../../src/modules/toxicology/scenarios/methanol-visual-acidosis-gaps';
import { METHANOL_FIXTURES as FIXTURES } from '../../src/modules/toxicology/methanol-visual-acidosis-gaps-fixtures';
import {
  METHANOL_DEMONSTRATION_VERSION, methanolDemonstrationStep,
  supportsMethanolDemonstration,
} from '../../src/modules/toxicology/demo/methanol-visual-acidosis-gaps-demonstration';
import { methanolInlinePrompt } from '../../src/modules/toxicology/tutor/methanol-visual-acidosis-gaps-guidance';
import type { MethanolAction } from '../../src/modules/toxicology/methanol-visual-acidosis-gaps';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologyMethanolAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: MethanolAction) => {
  engine.apply({ tick, type: 'methanol-visual-acidosis-gaps-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = methanolDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'methanol-visual-acidosis-gaps-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Keeps The Gaps Clues', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(METHANOL_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMethanolDemonstration(SCENARIO)).toBe(true);
    expect(supportsMethanolDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsMethanolDemonstration({
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

  it('dates the visual injury by the clock rather than observing a symptom', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('one dates the other');
    expect(opening).toContain('injury that is already happening');
  });

  it('reads the two gaps as a pair that moves in opposite directions', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('shrinks as it is metabolized');
    expect(recognize).toContain('a narrow osmolar gap later would exclude nothing');
    expect(recognize).toContain('Neither the source report, the vision, the anion gap, the osmolar gap nor a concentration');
  });

  it('finds the owners before the number, and says why that matters', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('two different jobs with two different owners');
    expect(support).toContain('the interval in which the acid is still being produced');
    expect(beats.indexOf('support')).toBeLessThan(beats.indexOf('evidence'));
  });

  it('names the acid nobody is measuring and determines no eligibility', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('the acid is not lactate and is not being measured');
    expect(evidence).toContain('this example determines neither');
    expect(patient.antidoteEligibilityDetermined).toBe(false);
    expect(patient.extracorporealEligibilityDetermined).toBe(false);
  });

  it('finishes on a better pH beside an eye that has not changed', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('A partially corrected acidosis is not cleared toxin');
    expect(handoff).toContain('exactly where they were');
    expect(narration).toContain('the same blurred vision');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.alternativeExcludedByLearner).toBe(false);
    expect(patient.gapCalculatedByLearner).toBe(false);
    expect(patient.laboratoryInterpretedByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.toxinClearanceProven).toBe(false);
    expect(patient.durableAcidBaseControlProven).toBe(false);
    expect(patient.visualRecoveryProven).toBe(false);
    expect(patient.neurologicRecoveryProven).toBe(false);
    expect(patient.renalSafetyProven).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is methanol poisoning', 'the toxin has been cleared', 'this is not ethylene glycol', 'his vision will recover']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('calculates no gap and selects no product, dose, route, or modality anywhere', () => {
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    expect(patient.airwaySelectedByLearner).toBe(false);
    expect(patient.extracorporealTreatmentSelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.bloodSampleAcquiredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['load 15 mg/kg of fomepizole', 'start haemodialysis now', 'give an amp of bicarbonate', 'the anion gap is sodium minus']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Puts The Clock On The Vision', () => {
  it('opens on the vision and the clock together', () => {
    const engine = create(); engine.step();
    const prompt = methanolInlinePrompt('guided', {
      scenarioVersion: '0.1.0', methanol: snapshot(engine),
    })!;
    expect(prompt.id).toBe('methanol-trajectory');
    expect(prompt.because).toContain('injury that is already happening');
  });

  it('refuses the five closures and keeps the pair on a clock', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = methanolInlinePrompt('guided', {
      scenarioVersion: '0.1.0', methanol: snapshot(engine),
    })!;
    expect(prompt.id).toBe('methanol-recognize');
    expect(prompt.because).toContain('Neither the source report, the vision, the anion gap, the osmolar gap nor a concentration');
    expect(prompt.because).toContain('a narrow osmolar gap later would exclude nothing');
  });

  it('refuses to let the concentration become the next step', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = methanolInlinePrompt('guided', {
      scenarioVersion: '0.1.0', methanol: snapshot(engine),
    })!;
    expect(prompt.id).toBe('methanol-support');
    expect(prompt.because).toContain('two different jobs with two different owners');
    expect(prompt.because).toContain('the interval in which the acid is still being produced');
  });

  it('names which acid this is not', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = methanolInlinePrompt('guided', {
      scenarioVersion: '0.1.0', methanol: snapshot(engine),
    })!;
    expect(prompt.id).toBe('methanol-evidence');
    expect(prompt.because).toContain('the acid is not lactate and is not being measured');
    expect(prompt.because).toContain('this lesson determines neither');
  });

  it('never excludes an alternative, determines eligibility, or calculates a gap', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = methanolInlinePrompt('guided', {
        scenarioVersion: '0.1.0', methanol: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is not ethylene glycol', 'he meets the criteria for dialysis', 'load 15 mg/kg of fomepizole', 'the toxin has been cleared']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(methanolInlinePrompt('guided', { scenarioVersion: '0.1.0', methanol: patient })!.id)
      .toBe('methanol-observe');
    expect(methanolInlinePrompt('coached', { scenarioVersion: '0.1.0', methanol: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(methanolInlinePrompt('unassisted', { scenarioVersion: '0.1.0', methanol: patient })).toBeNull();
    expect(methanolInlinePrompt('guided', { scenarioVersion: '0.1.1', methanol: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(methanolInlinePrompt('guided', { scenarioVersion: '0.1.0', methanol: snapshot(engine) })).toBeNull();
  });
});
