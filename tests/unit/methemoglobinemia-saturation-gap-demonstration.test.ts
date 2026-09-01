/**
 * The worked example and observed-state tutor for a bedside where the
 * reassuring number is the unreliable one.
 *
 * The saturation gap is not a disagreement to be settled: the oximeter, the
 * blood gas and the calculated saturation are each right about what they
 * measure, and none of them measures what her hemoglobin is carrying. Both the
 * tutor and the example keep the gap as the finding rather than picking a
 * winner, and both refuse the shortcut this bedside invites — reaching for
 * methylene blue the moment the blood looks brown.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { METHEMOGLOBINEMIA_SATURATION_GAP as SCENARIO } from '../../src/modules/toxicology/scenarios/methemoglobinemia-saturation-gap';
import { METHEMOGLOBINEMIA_FIXTURES as FIXTURES } from '../../src/modules/toxicology/methemoglobinemia-saturation-gap-fixtures';
import {
  METHEMOGLOBINEMIA_DEMONSTRATION_VERSION, methemoglobinemiaDemonstrationStep,
  supportsMethemoglobinemiaDemonstration,
} from '../../src/modules/toxicology/demo/methemoglobinemia-saturation-gap-demonstration';
import { methemoglobinemiaInlinePrompt } from '../../src/modules/toxicology/tutor/methemoglobinemia-saturation-gap-guidance';
import type { MethemoglobinemiaAction } from '../../src/modules/toxicology/methemoglobinemia-saturation-gap';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologyMethemoglobinemiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: MethemoglobinemiaAction) => {
  engine.apply({ tick, type: 'methemoglobinemia-saturation-gap-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = methemoglobinemiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'methemoglobinemia-saturation-gap-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Keeps The Gap As The Finding', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(METHEMOGLOBINEMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMethemoglobinemiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsMethemoglobinemiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsMethemoglobinemiaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognize', 'support', 'hazards', 'report', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.hazardsAtTick!);
    expect(patient.hazardsAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('refuses to settle the gap by picking a winner', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('are not arguing');
    expect(opening).toContain('right about themselves');
    expect(opening.toLowerCase()).not.toContain('the pulse oximeter is wrong');
  });

  it('names the two antidote hazards before any intent is recorded', () => {
    const hazards = narrations[beats.indexOf('hazards')]!;
    expect(hazards).toContain('G6PD');
    expect(hazards).toContain('serotonin-toxicity risk');
    expect(beats.indexOf('hazards')).toBeLessThan(beats.indexOf('report'));
  });

  it('confirms nothing, attributes nothing, and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.reboundExcluded).toBe(false);
    expect(patient.hemolysisExcluded).toBe(false);
    expect(patient.serotoninSyndromeExcluded).toBe(false);
    expect(patient.ongoingExposureExcluded).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the diagnosis is confirmed', 'the antidote worked', 'she is stable now', 'the methemoglobinemia is resolved']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('finishes on a level that fell without a reason it fell', () => {
    expect(narration).toContain('Nothing was resolved');
    expect(narrations[beats.indexOf('handoff')]).toContain('is not evidence the treatment is why');
  });

  it('selects no product, dose, route, or eligibility result anywhere', () => {
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.rescuePerformedByLearner).toBe(false);
    expect(patient.rescueEligibilityDetermined).toBe(false);
    expect(patient.saturationGapCalculatedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['1 mg/kg', 'give methylene blue', 'intravenously over', 'start an exchange transfusion']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Refuses The Antidote Shortcut', () => {
  it('opens by putting both oxygen numbers next to the patient', () => {
    const engine = create(); engine.step();
    const prompt = methemoglobinemiaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', methemoglobinemia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('methemoglobinemia-trajectory');
    expect(prompt.because).toContain('are not arguing');
    expect(prompt.because).toContain('right about themselves');
  });

  it('keeps the alternatives open in the same breath as the urgency', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = methemoglobinemiaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', methemoglobinemia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('methemoglobinemia-recognize');
    expect(prompt.because).toContain('all stay open');
    expect(prompt.because).toContain('the gap is the finding');
  });

  it('puts the co-oximetry and both hazards in one look', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = methemoglobinemiaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', methemoglobinemia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('methemoglobinemia-hazards');
    expect(prompt.because).toContain('G6PD');
    expect(prompt.because).toContain('serotonin-toxicity risk');
    expect(prompt.because).toContain('selects no product, dose, route or eligibility result');
  });

  it('never diagnoses her, doses her, or reads the oximeter as the answer', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = methemoglobinemiaInlinePrompt('guided', {
        scenarioVersion: '0.1.0', methemoglobinemia: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['confirmed methemoglobinemia', 'give methylene blue', '1 mg/kg', 'the saturation has recovered']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(methemoglobinemiaInlinePrompt('guided', { scenarioVersion: '0.1.0', methemoglobinemia: patient })!.id)
      .toBe('methemoglobinemia-observe');
    expect(methemoglobinemiaInlinePrompt('coached', { scenarioVersion: '0.1.0', methemoglobinemia: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(methemoglobinemiaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', methemoglobinemia: patient })).toBeNull();
    expect(methemoglobinemiaInlinePrompt('guided', { scenarioVersion: '0.1.1', methemoglobinemia: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(methemoglobinemiaInlinePrompt('guided', { scenarioVersion: '0.1.0', methemoglobinemia: snapshot(engine) })).toBeNull();
  });
});
