/**
 * The worked example and observed-state tutor for the HHS trajectory lesson.
 *
 * This lesson can be failed twice with the same error. At the start, ketones of
 * 1.1 and a pH of 7.36 read as a mild illness. At the report, a lower glucose,
 * a better pressure and a falling osmolality read as recovery. Both the tutor
 * and the example are held to naming what is still moving instead.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { HHS_OSMOLALITY_TRAJECTORY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hhs-osmolality-trajectory';
import { HHS_OSMOLALITY_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/hhs-osmolality-fixtures';
import {
  HHS_OSMOLALITY_DEMONSTRATION_VERSION, hhsOsmolalityDemonstrationStep,
  supportsHhsOsmolalityDemonstration,
} from '../../src/modules/endocrine-metabolic/demo/hhs-osmolality-demonstration';
import { hhsOsmolalityInlinePrompt } from '../../src/modules/endocrine-metabolic/tutor/hhs-osmolality-guidance';
import type { HhsOsmolalityAction } from '../../src/modules/endocrine-metabolic/hhs-osmolality';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.endocrineHhsAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: HhsOsmolalityAction) => {
  engine.apply({ tick, type: 'hhs-osmolality-trajectory-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = hhsOsmolalityDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'hhs-osmolality-trajectory-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Ends On What Is Still Moving', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(HHS_OSMOLALITY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsHhsOsmolalityDemonstration(SCENARIO)).toBe(true);
    expect(supportsHhsOsmolalityDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsHhsOsmolalityDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches every recorded step in the order the engine enforces', () => {
    expect(beats).toEqual(['support', 'context', 'recognize', 'readiness', 'report', 'handoff']);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('refuses the reassurance at both places it is offered', () => {
    // The low ketones at the start...
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('not whether it is serious');
    // ...and the three improved values at the report.
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('still hyperosmolar');
    expect(handoff).toContain('0.4 mL/kg/h');
    expect(narration).toContain('none of them closed the case');
    for (const forbidden of ['resolved', 'recovered', 'discharge', 'out of danger']) {
      expect(`${handoff} ${narration}`.toLowerCase(), forbidden).not.toContain(forbidden);
    }
  });

  it('treats the quoted average rates as a description, not a target', () => {
    const report = narrations[beats.indexOf('report')]!;
    expect(report).toContain('not a target');
    expect(report).toContain('not a safe interval');
  });

  it('claims no treatment of its own anywhere in the example', () => {
    expect(patient.fluidInsulinDextroseElectrolyteOrDrugSelectedOrDeliveredByLearner).toBe(false);
    expect(patient.doseRateRouteOrAccessSelectedByLearner).toBe(false);
    expect(patient.hhsResolutionProven).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(narrations.join(' ')).toContain('selects no fluid, insulin, dose, or rate');
  });
});

describe('Requirement: The Tutor Couples The Numbers Rather Than Grading Them', () => {
  it('opens on ownership of a judgement several people share', () => {
    const engine = create(); engine.step();
    const prompt = hhsOsmolalityInlinePrompt('guided', {
      scenarioVersion: '0.1.0', hhsOsmolality: snapshot(engine),
    })!;
    expect(prompt.id).toBe('hhs-support');
    expect(prompt.because).toContain('several people’s judgement');
  });

  it('reads the osmolality, the dehydration and the cognition as one finding', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    advance(engine, 1, FIXTURES.expert[1][1]);
    const prompt = hhsOsmolalityInlinePrompt('guided', {
      scenarioVersion: '0.1.0', hhsOsmolality: snapshot(engine),
    })!;
    expect(prompt.id).toBe('hhs-recognize');
    expect(prompt.because).toContain('not whether it is serious');
  });

  it('never says whether she is improving', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = hhsOsmolalityInlinePrompt('guided', {
        scenarioVersion: '0.1.0', hhsOsmolality: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['she is improving', 'is recovering', 'is resolving', 'give hypotonic']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(hhsOsmolalityInlinePrompt('guided', { scenarioVersion: '0.1.0', hhsOsmolality: patient })!.id)
      .toBe('hhs-observe');
    expect(hhsOsmolalityInlinePrompt('coached', { scenarioVersion: '0.1.0', hhsOsmolality: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(hhsOsmolalityInlinePrompt('unassisted', { scenarioVersion: '0.1.0', hhsOsmolality: patient })).toBeNull();
    expect(hhsOsmolalityInlinePrompt('guided', { scenarioVersion: '0.1.1', hhsOsmolality: patient })).toBeNull();
    expect(hhsOsmolalityInlinePrompt('guided', { scenarioVersion: '0.1.0', hhsOsmolality: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(hhsOsmolalityInlinePrompt('guided', { scenarioVersion: '0.1.0', hhsOsmolality: snapshot(engine) })).toBeNull();
  });
});
