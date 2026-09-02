/**
 * The worked example and observed-state tutor for a child who does not look
 * like the emergency he is.
 *
 * There is no wrong-turn prose to check here, because this engine case
 * authors no refusable choice. What the tutor has to get right instead is the
 * two-directional boundary: no current shock means no routine bolus, and a
 * normal blood pressure is not low risk.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEDIATRIC_SEPSIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-sepsis';
import { PEDIATRIC_SEPSIS_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-sepsis-fixtures';
import {
  PEDIATRIC_SEPSIS_DEMONSTRATION_VERSION, pediatricSepsisDemonstrationStep,
  supportsPediatricSepsisDemonstration,
} from '../../src/modules/pediatrics/demo/pediatric-sepsis-demonstration';
import { pediatricSepsisInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-sepsis-guidance';
import type { PediatricSepsisAction } from '../../src/modules/pediatrics/pediatric-sepsis';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pediatricSepsisAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PediatricSepsisAction) => {
  engine.apply({ tick, type: 'pediatric-sepsis-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pediatricSepsisDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pediatric-sepsis-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Reads the Quiet Emergency', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_SEPSIS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricSepsisDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricSepsisDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPediatricSepsisDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the enforced order', () => {
    expect(beats).toEqual(['pattern', 'shockBoundary', 'care', 'source', 'later', 'handoff']);
    expect(patient.patternAtTick).toBeLessThan(patient.shockBoundaryAtTick!);
    expect(patient.shockBoundaryAtTick).toBeLessThan(patient.careAtTick!);
    expect(patient.careAtTick).toBeLessThan(patient.sourceReviewAtTick!);
    // Two time gates: the later report and the handoff.
    expect(patient.sourceReviewAtTick).toBeLessThan(patient.laterResponseAtTick!);
    expect(patient.laterResponseAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('separates what makes this sepsis from the fever it arrived with', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('does not look like the emergency his blood results say he is');
    expect(pattern).toContain('the context you read that finding in, not a shortcut to it');
    expect(patient.suspectedInfectionAuthored).toBe(true);
    expect(patient.coagulationDysfunctionAuthored).toBe(true);
  });

  it('draws the shock boundary in both directions at once', () => {
    const boundary = narrations[beats.indexOf('shockBoundary')]!;
    expect(boundary).toContain('a bolus given to a child who is not shocked buys nothing and costs something');
    expect(boundary).toContain('do not establish low risk');
    expect(boundary).toContain('Phoenix is not an early screening tool');
    expect(patient.sepsisWithoutShockAuthored).toBe(true);
    expect(patient.phoenixCardiovascularSubscoreAuthored).toBe(0);
    expect(patient.scoreCalculatedByLearner).toBe(false);
  });

  it('names the owners of care that is already running', () => {
    const care = narrations[beats.indexOf('care')]!;
    expect(care).toContain('Care that nobody owns is care that quietly stops');
    expect(patient.qualifiedCareOwnershipConfirmed).toBe(true);
    expect(patient.antimicrobialSelectedByLearner).toBe(false);
  });

  it('holds pending source work and organ trends together', () => {
    const source = narrations[beats.indexOf('source')]!;
    expect(source).toContain('how a wrong source survives the afternoon');
    expect(source).toContain('how the alternative gets missed');
    expect(patient.sourceConfirmed).toBe(false);
    expect(patient.pathogenIdentified).toBe(false);
  });

  it('says that the physiology improved and the organ dysfunction did not', () => {
    const later = narrations[beats.indexOf('later')]!;
    expect(later).toContain('The physiology got better and the organ dysfunction did not');
    expect(patient.laterReportAuthored).toBe(true);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableRecoveryProven).toBe(false);
  });

  it('ends with both columns handed to the people taking over', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('better and still actively at risk');
    expect(narration).toContain('exactly where it was two hours ago');
    expect(narration).toContain('This ends the example, not the evaluation.');
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
  });

  it('examines nothing, treats nothing, and predicts nothing', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.cultureAcquiredByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.fluidDeliveredByLearner).toBe(false);
    expect(patient.vasoactiveSelectedByLearner).toBe(false);
    expect(patient.procedurePerformedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give ceftriaxone', 'start vancomycin', 'give 20 ml/kg', 'start norepinephrine', 'he can go home', 'he is over the worst', 'the source is confirmed', 'escherichia coli']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Reads Only the Recorded Steps', () => {
  const V = '0.1.0';

  it('walks the six beats in order, one per recorded step', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = pediatricSepsisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['psep-pattern', 'psep-shock-boundary', 'psep-care', 'psep-source', 'psep-later', 'psep-handoff']);
  });

  it('opens on the gap between how he looks and what his results say', () => {
    const engine = create(); engine.step();
    const prompt = pediatricSepsisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('psep-pattern');
    expect(prompt.because).toContain('platelets of 82,000 and an INR of 1.5');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    // Care ownership before there is a pattern to own changes nothing, so the
    // tutor is still on the opening beat.
    advance(engine, 0, 'confirm-pediatric-sepsis-qualified-care-ownership');
    expect(snapshot(engine)!.patternAtTick).toBeNull();
    expect(snapshot(engine)!.careAtTick).toBeNull();
    expect(pediatricSepsisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('psep-pattern');
  });

  it('does not move on when the later report is refused for time', () => {
    // The gate is the engine's own clock, not the tick on the action, so the
    // refusal only happens when both are dispatched before the next step.
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    engine.apply({ tick: 3, type: 'pediatric-sepsis-response', payload: { action: 'review-pediatric-sepsis-source-organs-and-alternatives' } });
    engine.apply({ tick: 3, type: 'pediatric-sepsis-response', payload: { action: 'review-pediatric-sepsis-later-response' } });
    engine.step();
    expect(snapshot(engine)!.sourceReviewAtTick).not.toBeNull();
    expect(snapshot(engine)!.laterResponseAtTick).toBeNull();
    expect(pediatricSepsisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('psep-later');
  });

  it('never reaches for a bolus, an antimicrobial, or a discharge', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pediatricSepsisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['give a bolus', 'give ceftriaxone', 'he can go home', 'he is over the worst']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pediatricSepsisInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pediatricSepsisInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pediatricSepsisInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pediatricSepsisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pediatricSepsisInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
