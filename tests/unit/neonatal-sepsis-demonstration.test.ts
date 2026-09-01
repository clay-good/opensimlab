/**
 * The worked example and observed-state tutor for the moment an instrument
 * stops being the answer.
 *
 * The maternal record here is exactly what a risk calculator takes, and the
 * newborn is clinically ill, which is the finding that ends the calculation
 * rather than feeding it. Both the tutor and the example refuse two instruments
 * while escalating on neither: the calculator cannot overrule a sick infant,
 * and no isolated laboratory result can diagnose or exclude early-onset sepsis.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { NEONATAL_SEPSIS as SCENARIO } from '../../src/modules/neonatology/scenarios/neonatal-sepsis';
import { NEONATAL_SEPSIS_FIXTURES as FIXTURES } from '../../src/modules/neonatology/neonatal-sepsis-fixtures';
import {
  NEONATAL_SEPSIS_DEMONSTRATION_VERSION, neonatalSepsisDemonstrationStep,
  supportsNeonatalSepsisDemonstration,
} from '../../src/modules/neonatology/demo/neonatal-sepsis-demonstration';
import { neonatalSepsisInlinePrompt } from '../../src/modules/neonatology/tutor/neonatal-sepsis-guidance';
import type { NeonatalSepsisAction } from '../../src/modules/neonatology/neonatal-sepsis';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neonatologySepsisAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: NeonatalSepsisAction) => {
  engine.apply({ tick, type: 'neonatal-sepsis-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = neonatalSepsisDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'neonatal-sepsis-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Lets The Infant End The Calculation', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(NEONATAL_SEPSIS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsNeonatalSepsisDemonstration(SCENARIO)).toBe(true);
    expect(supportsNeonatalSepsisDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsNeonatalSepsisDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'recognize', 'readiness', 'report', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('names the detail most likely to make a room relax', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('maternal antibiotics are the detail most likely to make a room relax');
  });

  it('refuses both instruments at the recognition beat', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('cannot overrule a clinically ill infant');
    expect(recognize).toContain('can diagnose or exclude early-onset sepsis');
    expect(recognize).toContain('not the same as having diagnosed him');
  });

  it('points the culture clause at the treatment', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('protects the antibiotics rather than the specimen');
    expect(readiness).toContain('selects no agent and names no dose');
  });

  it('calculates nothing, diagnoses nothing, excludes nothing', () => {
    expect(patient.riskCalculatedByLearner).toBe(false);
    expect(patient.historyTakenByLearner).toBe(false);
    expect(patient.monitoringOrTestsObtainedOrInterpretedByLearner).toBe(false);
    expect(patient.accessFluidGlucoseAntimicrobialOrDrugDeliveredByLearner).toBe(false);
    expect(patient.sepsisDiagnosed).toBe(false);
    expect(patient.bacteremiaMeningitisOrInfectionExcluded).toBe(false);
    expect(patient.otherCauseExcluded).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.antimicrobialDurationDetermined).toBe(false);
    expect(patient.durableStabilityProven).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['he has sepsis', 'infection is excluded', 'the score is', 'start ampicillin', 'he is stable now', 'the antibiotics worked']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('finishes on a partial response with the culture pending', () => {
    expect(narrations[beats.indexOf('handoff')]).toContain('better and nothing is settled');
    expect(narration).toContain('his culture pending');
  });
});

describe('Requirement: The Tutor Refuses The Calculator And The Laboratory', () => {
  it('staffs the laboratory and the pharmacy with the clinicians', () => {
    const engine = create(); engine.step();
    const prompt = neonatalSepsisInlinePrompt('guided', {
      scenarioVersion: '0.1.0', neonatalSepsis: snapshot(engine),
    })!;
    expect(prompt.id).toBe('neonatal-sepsis-support');
    expect(prompt.because).toContain('staffing fact before it is a sequencing one');
  });

  it('refuses both instruments while escalating', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    advance(engine, 1, FIXTURES.expert[1][1]);
    const prompt = neonatalSepsisInlinePrompt('guided', {
      scenarioVersion: '0.1.0', neonatalSepsis: snapshot(engine),
    })!;
    expect(prompt.id).toBe('neonatal-sepsis-recognize');
    expect(prompt.because).toContain('cannot overrule a clinically ill infant');
    expect(prompt.because).toContain('can diagnose or exclude early-onset sepsis');
  });

  it('points the culture clause at the treatment', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = neonatalSepsisInlinePrompt('guided', {
      scenarioVersion: '0.1.0', neonatalSepsis: snapshot(engine),
    })!;
    expect(prompt.id).toBe('neonatal-sepsis-readiness');
    expect(prompt.because).toContain('protects the antibiotics, not the specimen');
  });

  it('never diagnoses, excludes, scores, or prescribes', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = neonatalSepsisInlinePrompt('guided', {
        scenarioVersion: '0.1.0', neonatalSepsis: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['he has sepsis', 'infection is excluded', 'start ampicillin', 'he is stable now', 'the antibiotics worked']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(neonatalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', neonatalSepsis: patient })!.id)
      .toBe('neonatal-sepsis-observe');
    expect(neonatalSepsisInlinePrompt('coached', { scenarioVersion: '0.1.0', neonatalSepsis: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(neonatalSepsisInlinePrompt('unassisted', { scenarioVersion: '0.1.0', neonatalSepsis: patient })).toBeNull();
    expect(neonatalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.1', neonatalSepsis: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(neonatalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', neonatalSepsis: snapshot(engine) })).toBeNull();
  });
});
