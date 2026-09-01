/**
 * The worked example and observed-state tutor for two negatives that are not
 * the same negative.
 *
 * Routine suctioning is not indicated solely because the fluid is meconium
 * stained, and declining it excludes nothing. "She does not need suctioning"
 * and "she is fine" are different sentences, and both the tutor and the example
 * keep them apart while a parent who asked for the suction directly is owed an
 * answer.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { MECONIUM_STAINED_TRANSITION as SCENARIO } from '../../src/modules/neonatology/scenarios/meconium-stained-transition';
import { MECONIUM_TRANSITION_FIXTURES as FIXTURES } from '../../src/modules/neonatology/meconium-stained-transition-fixtures';
import {
  MECONIUM_TRANSITION_DEMONSTRATION_VERSION, meconiumTransitionDemonstrationStep,
  supportsMeconiumTransitionDemonstration,
} from '../../src/modules/neonatology/demo/meconium-stained-transition-demonstration';
import { meconiumTransitionInlinePrompt } from '../../src/modules/neonatology/tutor/meconium-stained-transition-guidance';
import type { MeconiumTransitionAction } from '../../src/modules/neonatology/meconium-stained-transition';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neonatologyMeconiumTransitionAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: MeconiumTransitionAction) => {
  engine.apply({ tick, type: 'meconium-stained-transition-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = meconiumTransitionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'meconium-stained-transition-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Declines The Suction And Excludes Nothing', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(MECONIUM_TRANSITION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMeconiumTransitionDemonstration(SCENARIO)).toBe(true);
    expect(supportsMeconiumTransitionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsMeconiumTransitionDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'recognize', 'readiness', 'report', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('says what the meconium actually changes at the support beat', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('does not call for a suction');
    expect(support).toContain('someone present who could clear an airway');
  });

  it('separates the declined intervention from the excluded disease', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('That declines an intervention');
    expect(recognize).toContain('does not exclude meconium aspiration');
    expect(recognize).toContain('does not make her well');
  });

  it('names the trigger that would change the answer', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('reserved for apparent obstruction');
    expect(readiness).toContain('something other than a habit');
  });

  it('performs nothing and excludes nothing', () => {
    expect(patient.suctionPerformedByLearner).toBe(false);
    expect(patient.deviceHandledByLearner).toBe(false);
    expect(patient.airwayPlacedOrManagedByLearner).toBe(false);
    expect(patient.positioningDryingWarmingOrStimulationPerformedByLearner).toBe(false);
    expect(patient.meconiumAspirationExcluded).toBe(false);
    expect(patient.otherRespiratoryDiseaseExcluded).toBe(false);
    expect(patient.durableSafetyProven).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.parentOutcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she is fine', 'her airway is clear', 'aspiration is excluded', 'suction her mouth', 'she does not have meconium aspiration']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('finishes with the aspiration still open', () => {
    expect(narrations[beats.indexOf('handoff')]).toContain('Hand off the two negatives separately');
    expect(narration).toContain('settled only the suction');
  });
});

describe('Requirement: The Tutor Keeps The Two Negatives Apart', () => {
  it('opens on airway-ready attendance rather than on a rule', () => {
    const engine = create(); engine.step();
    const prompt = meconiumTransitionInlinePrompt('guided', {
      scenarioVersion: '0.1.0', meconiumTransition: snapshot(engine),
    })!;
    expect(prompt.id).toBe('meconium-support');
    expect(prompt.because).toContain('does not call for a suction');
  });

  it('declines the intervention without closing the newborn', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    advance(engine, 1, FIXTURES.expert[1][1]);
    const prompt = meconiumTransitionInlinePrompt('guided', {
      scenarioVersion: '0.1.0', meconiumTransition: snapshot(engine),
    })!;
    expect(prompt.id).toBe('meconium-recognize');
    expect(prompt.because).toContain('does not exclude meconium aspiration');
    expect(prompt.because).toContain('does not make her well');
  });

  it('never suctions, and never calls her clear', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = meconiumTransitionInlinePrompt('guided', {
        scenarioVersion: '0.1.0', meconiumTransition: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['she is fine', 'her airway is clear', 'aspiration is excluded', 'suction her mouth']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(meconiumTransitionInlinePrompt('guided', { scenarioVersion: '0.1.0', meconiumTransition: patient })!.id)
      .toBe('meconium-observe');
    expect(meconiumTransitionInlinePrompt('coached', { scenarioVersion: '0.1.0', meconiumTransition: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(meconiumTransitionInlinePrompt('unassisted', { scenarioVersion: '0.1.0', meconiumTransition: patient })).toBeNull();
    expect(meconiumTransitionInlinePrompt('guided', { scenarioVersion: '0.1.1', meconiumTransition: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(meconiumTransitionInlinePrompt('guided', { scenarioVersion: '0.1.0', meconiumTransition: snapshot(engine) })).toBeNull();
  });
});
