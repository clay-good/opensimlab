/**
 * The worked example and observed-state tutor for the DKA resolution lesson.
 *
 * The trap here is a number that has moved. Glucose is down, the pH is up, the
 * anion gap has closed, and none of those is the criterion. So both the tutor
 * and the example are held to two restraints: neither says whether this patient
 * has resolved before the learner's own recognition step records it, and the
 * example finishes with the criteria met and the case still open.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { DKA_RESOLUTION_TRANSITION as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/dka-resolution-transition';
import { DKA_RESOLUTION_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/dka-resolution-fixtures';
import {
  DKA_RESOLUTION_DEMONSTRATION_VERSION, dkaResolutionDemonstrationStep,
  supportsDkaResolutionDemonstration,
} from '../../src/modules/endocrine-metabolic/demo/dka-resolution-demonstration';
import { dkaResolutionInlinePrompt } from '../../src/modules/endocrine-metabolic/tutor/dka-resolution-guidance';
import type { DkaResolutionAction } from '../../src/modules/endocrine-metabolic/dka-resolution';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.endocrineDkaResolutionAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: DkaResolutionAction) => {
  engine.apply({ tick, type: 'dka-resolution-transition-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = dkaResolutionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'dka-resolution-transition-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Ends With The Case Open', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(DKA_RESOLUTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsDkaResolutionDemonstration(SCENARIO)).toBe(true);
    expect(supportsDkaResolutionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsDkaResolutionDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches every recorded step in the order the engine enforces', () => {
    expect(beats).toEqual(['support', 'context', 'recognize', 'readiness', 'report', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('reads the criteria only at the step that records them', () => {
    // Before the recognition beat, nothing has told the learner what to conclude.
    for (const earlier of narrations.slice(0, beats.indexOf('recognize'))) {
      expect(earlier).not.toContain('0.6');
      expect(earlier.toLowerCase()).not.toContain('unresolved');
    }
    expect(narrations[beats.indexOf('recognize')]).toContain('below 0.6 mmol/L');
  });

  it('finishes with the criteria met and the case still open', () => {
    expect(patient.biochemicalResolutionReported).toBe(true);
    expect(patient.dischargeReadinessProven).toBe(false);
    expect(patient.durableGlucoseOrPotassiumStabilityProven).toBe(false);
    expect(patient.precipitantResolved).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(narration).toContain('not closed');
    for (const forbidden of ['recovered', 'discharge', 'safe to go home', 'cured']) {
      expect(narration.toLowerCase(), forbidden).not.toContain(forbidden);
    }
  });

  it('claims no treatment of its own anywhere in the example', () => {
    expect(patient.fluidElectrolyteDextroseInsulinBicarbonateOrDrugSelectedOrDeliveredByLearner).toBe(false);
    expect(patient.doseConcentrationRateRouteOrAccessSelectedByLearner).toBe(false);
    expect(patient.medicationOrTransitionPerformedByLearner).toBe(false);
    expect(narrations.join(' ')).toContain('selects no drug, dose, rate, or fluid');
  });
});

describe('Requirement: The Tutor Names The Measurement, Not The Verdict', () => {
  it('opens on ownership of the transition rather than the biochemistry', () => {
    const engine = create(); engine.step();
    const prompt = dkaResolutionInlinePrompt('guided', {
      scenarioVersion: '0.1.0', dkaResolution: snapshot(engine),
    })!;
    expect(prompt.id).toBe('dka-resolution-support');
    expect(prompt.because).toContain('fails at the seams');
  });

  it('sends the reader to the ketone and the bicarbonate, not the glucose', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    advance(engine, 1, FIXTURES.expert[1][1]);
    const prompt = dkaResolutionInlinePrompt('guided', {
      scenarioVersion: '0.1.0', dkaResolution: snapshot(engine),
    })!;
    expect(prompt.id).toBe('dka-resolution-recognize');
    expect(prompt.suggestion).toContain('not the glucose');
    expect(prompt.because).toContain('hyperchloremic explanation open');
  });

  it('never announces whether this patient has resolved', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = dkaResolutionInlinePrompt('guided', {
        scenarioVersion: '0.1.0', dkaResolution: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['dka has resolved', 'still has dka', 'is resolved', 'stop the insulin']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(dkaResolutionInlinePrompt('guided', { scenarioVersion: '0.1.0', dkaResolution: patient })!.id)
      .toBe('dka-resolution-observe');
    expect(dkaResolutionInlinePrompt('coached', { scenarioVersion: '0.1.0', dkaResolution: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(dkaResolutionInlinePrompt('unassisted', { scenarioVersion: '0.1.0', dkaResolution: patient })).toBeNull();
    expect(dkaResolutionInlinePrompt('guided', { scenarioVersion: '0.1.1', dkaResolution: patient })).toBeNull();
    expect(dkaResolutionInlinePrompt('guided', { scenarioVersion: '0.1.0', dkaResolution: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(dkaResolutionInlinePrompt('guided', { scenarioVersion: '0.1.0', dkaResolution: snapshot(engine) })).toBeNull();
  });
});
