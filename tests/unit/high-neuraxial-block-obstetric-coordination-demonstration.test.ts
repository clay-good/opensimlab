/**
 * The worked example and observed-state tutor for a block that is still
 * climbing.
 *
 * Ninety seconds took her from a working epidural to a weak voice, failing
 * hands and a sensory level at C6, so any level established is the one it has
 * already passed — and she is awake through all of it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { HIGH_NEURAXIAL_BLOCK_OBSTETRIC_COORDINATION as SCENARIO } from '../../src/modules/obstetrics/scenarios/high-neuraxial-block-obstetric-coordination';
import { HIGH_NEURAXIAL_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/high-neuraxial-block-obstetric-coordination-fixtures';
import {
  HIGH_NEURAXIAL_DEMONSTRATION_VERSION, highNeuraxialDemonstrationStep,
  supportsHighNeuraxialDemonstration,
} from '../../src/modules/obstetrics/demo/high-neuraxial-block-obstetric-coordination-demonstration';
import { highNeuraxialInlinePrompt } from '../../src/modules/obstetrics/tutor/high-neuraxial-block-obstetric-coordination-guidance';
import type { HighNeuraxialAction } from '../../src/modules/obstetrics/high-neuraxial-block-obstetric-coordination';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsHighNeuraxialAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: HighNeuraxialAction) => {
  engine.apply({ tick, type: 'high-neuraxial-block-obstetric-coordination-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = highNeuraxialDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'high-neuraxial-block-obstetric-coordination-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Calls Before It Measures', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(HIGH_NEURAXIAL_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsHighNeuraxialDemonstration(SCENARIO)).toBe(true);
    expect(supportsHighNeuraxialDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsHighNeuraxialDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'uncertainty', 'readiness', 'reassess', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.uncertaintyAtTick!);
    expect(patient.uncertaintyAtTick).toBeLessThan(patient.readinessAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('calls for airway help and puts someone at her head, and says why', () => {
    expect(beats[0]).toBe('support');
    const support = narrations[0]!;
    expect(support).toContain('have someone stay at her head');
    expect(support).toContain('any level you establish is the one it has already passed');
    expect(support).toContain('she can feel herself losing the ability to breathe');
  });

  it('reads the clock, the level and the arms as one ascending line', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('The arms are the useful sign');
    expect(context).toContain('the level that runs the diaphragm');
    expect(context).toContain('Every one of those is the same event.');
  });

  it('holds the high block as leading without letting it close the rest', () => {
    const uncertainty = narrations[beats.indexOf('uncertainty')]!;
    expect(uncertainty).toContain('without letting it close the rest');
    expect(uncertainty).toContain('present into this same picture and stay open');
    expect(uncertainty).toContain('part of the presentation rather than a detail beside it');
  });

  it('runs the airway, circulation and birth readiness at once and raises awareness early', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('the same moment rather than a sequence');
    expect(readiness).toContain('an anesthetic she can no longer tell you about');
    expect(readiness).toContain('raised now rather than afterwards');
  });

  it('ends on a block that has not receded and a birth that has not happened', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('or that she was unaware of any of it');
    expect(handoff).toContain('what she has just experienced while fully conscious');
    expect(narration).toContain('still blocked, still frightened');
    expect(narration).toContain('This ends the example, not the emergency.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.blockRecessionProven).toBe(false);
    expect(patient.fetalRecoveryProven).toBe(false);
    expect(patient.newbornSafetyProven).toBe(false);
    expect(patient.awarenessExcluded).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.authoredHighNeuraxialPattern).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the block is receding', 'she is not aware', 'this is only a high block', 'the fetus has recovered']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('touches nothing, assesses no block, and secures no airway', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.blockAssessedByLearner).toBe(false);
    expect(patient.monitoringInterpretedByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.injectionOrInfusionChangedByLearner).toBe(false);
    expect(patient.positionChangedByLearner).toBe(false);
    expect(patient.airwayManagedByLearner).toBe(false);
    expect(patient.oxygenDeliveredByLearner).toBe(false);
    expect(patient.ventilationDeliveredByLearner).toBe(false);
    expect(patient.circulationSupportedByLearner).toBe(false);
    expect(patient.drugDoseConcentrationRouteRateTargetSelectedByLearner).toBe(false);
    expect(patient.anesthesiaSelectedByLearner).toBe(false);
    expect(patient.birthPlanSelectedByLearner).toBe(false);
    expect(patient.deliveryPerformedByLearner).toBe(false);
    expect(patient.newbornAssessedByLearner).toBe(false);
    expect(patient.procedurePerformedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['test the block level', 'intubate her', 'give ephedrine', 'sit her up']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Calls Before It Measures', () => {
  it('opens by calling for airway help with someone at her head', () => {
    const engine = create(); engine.step();
    const prompt = highNeuraxialInlinePrompt('guided', { scenarioVersion: '0.1.0', highNeuraxial: snapshot(engine) })!;
    expect(prompt.id).toBe('neuraxial-support');
    expect(prompt.suggestion).toContain('have someone stay at her head');
    expect(prompt.because).toContain('any level you establish is the one it has already passed');
  });

  it('reads the ascending line once the response is running', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = highNeuraxialInlinePrompt('guided', { scenarioVersion: '0.1.0', highNeuraxial: snapshot(engine) })!;
    expect(prompt.id).toBe('neuraxial-context');
    expect(prompt.suggestion).toContain('as one ascending line');
    expect(prompt.because).toContain('the level that runs the diaphragm');
  });

  it('keeps the alternatives alive behind the obvious reading', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = highNeuraxialInlinePrompt('guided', { scenarioVersion: '0.1.0', highNeuraxial: snapshot(engine) })!;
    expect(prompt.id).toBe('neuraxial-uncertainty');
    expect(prompt.suggestion).toContain('without letting it close the rest');
    expect(prompt.because).toContain('present into this same picture and stay open');
  });

  it('raises the awareness question before an airway is secured', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = highNeuraxialInlinePrompt('guided', { scenarioVersion: '0.1.0', highNeuraxial: snapshot(engine) })!;
    expect(prompt.id).toBe('neuraxial-readiness');
    expect(prompt.because).toContain('an anesthetic she can no longer tell you about');
    expect(prompt.because).toContain('raised now rather than afterwards');
  });

  it('never claims recession, excludes awareness, or picks an airway', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = highNeuraxialInlinePrompt('guided', { scenarioVersion: '0.1.0', highNeuraxial: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the block is receding', 'she is not aware', 'intubate her', 'the fetus has recovered']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(highNeuraxialInlinePrompt('guided', { scenarioVersion: '0.1.0', highNeuraxial: patient })!.id).toBe('neuraxial-reassess');
    expect(highNeuraxialInlinePrompt('coached', { scenarioVersion: '0.1.0', highNeuraxial: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(highNeuraxialInlinePrompt('unassisted', { scenarioVersion: '0.1.0', highNeuraxial: patient })).toBeNull();
    expect(highNeuraxialInlinePrompt('guided', { scenarioVersion: '0.1.1', highNeuraxial: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(highNeuraxialInlinePrompt('guided', { scenarioVersion: '0.1.0', highNeuraxial: snapshot(engine) })).toBeNull();
  });
});
