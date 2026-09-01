/**
 * The worked example and observed-state tutor for a question the evidence
 * declines to answer.
 *
 * Everyone asks whether to rewarm quickly or slowly, and the evidence does not
 * support prescribing one optimal rate. Saying so is harder than picking. The
 * second hard thing here is refusing the explanation the lesson hands over: a
 * warming-continuity gap accounts for the cold so neatly that the illness
 * underneath stops being looked for.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { THERMOREGULATION_FAILURE as SCENARIO } from '../../src/modules/neonatology/scenarios/thermoregulation-failure';
import { THERMOREGULATION_FIXTURES as FIXTURES } from '../../src/modules/neonatology/thermoregulation-failure-fixtures';
import {
  THERMOREGULATION_DEMONSTRATION_VERSION, thermoregulationDemonstrationStep,
  supportsThermoregulationDemonstration,
} from '../../src/modules/neonatology/demo/thermoregulation-failure-demonstration';
import { thermoregulationInlinePrompt } from '../../src/modules/neonatology/tutor/thermoregulation-failure-guidance';
import type { ThermoregulationAction } from '../../src/modules/neonatology/thermoregulation-failure';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neonatologyThermoregulationAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: ThermoregulationAction) => {
  engine.apply({ tick, type: 'neonatal-thermoregulation-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = thermoregulationDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'neonatal-thermoregulation-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Declines The Rate And Keeps Looking', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(THERMOREGULATION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsThermoregulationDemonstration(SCENARIO)).toBe(true);
    expect(supportsThermoregulationDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsThermoregulationDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'recognize', 'readiness', 'report', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('treats the neat explanation as a reason to keep looking', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('an explanation that neat is the reason to keep looking rather than to stop');
  });

  it('declines the rate the question is really asking for', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('does not support prescribing one optimal rate');
    expect(recognize).toContain('saying so is more useful than picking');
    expect(recognize).toContain('not the therapeutic-hypothermia pathway');
  });

  it('names the harm on the other side of the treatment', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('avoiding hyperthermia');
    expect(readiness).toContain('part of the treatment rather than a check on it');
  });

  it('prescribes nothing, performs nothing, excludes nothing', () => {
    expect(patient.prescribedRewarmingRateClaimed).toBe(false);
    expect(patient.setPointOrRewarmingRateSelectedByLearner).toBe(false);
    expect(patient.warmingCoolingSkinToSkinOrDeviceCarePerformedByLearner).toBe(false);
    expect(patient.temperatureGlucoseOrTestsObtainedOrInterpretedByLearner).toBe(false);
    expect(patient.feedingPerformedByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.causeDetermined).toBe(false);
    expect(patient.infectionOrOtherIllnessExcluded).toBe(false);
    expect(patient.durableThermalStabilityProven).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['rewarm at 0.5', 'she is warm now', 'she is stable now', 'the cause was the transfer', 'infection is excluded', 'set the incubator to']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('finishes on a temperature that is rising and has not arrived', () => {
    expect(narrations[beats.indexOf('handoff')]).toContain('still below the normal range');
    expect(narration).toContain('warmer and not yet warm');
  });
});

describe('Requirement: The Tutor Says The Evidence Does Not Settle It', () => {
  it('treats the cold, the glucose and the feed as one problem', () => {
    const engine = create(); engine.step();
    const prompt = thermoregulationInlinePrompt('guided', {
      scenarioVersion: '0.1.0', thermoregulation: snapshot(engine),
    })!;
    expect(prompt.id).toBe('thermoregulation-support');
    expect(prompt.because).toContain('how the second one gets missed');
  });

  it('declines the rate while requiring the rewarming', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    advance(engine, 1, FIXTURES.expert[1][1]);
    const prompt = thermoregulationInlinePrompt('guided', {
      scenarioVersion: '0.1.0', thermoregulation: snapshot(engine),
    })!;
    expect(prompt.id).toBe('thermoregulation-recognize');
    expect(prompt.because).toContain('requires immediate qualified rewarming');
    expect(prompt.because).toContain('does not support prescribing one optimal rate');
  });

  it('names hyperthermia as the harm in the direction of the treatment', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = thermoregulationInlinePrompt('guided', {
      scenarioVersion: '0.1.0', thermoregulation: snapshot(engine),
    })!;
    expect(prompt.id).toBe('thermoregulation-readiness');
    expect(prompt.because).toContain('avoiding hyperthermia');
  });

  it('never prescribes a rate, names a cause, or calls her warm', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = thermoregulationInlinePrompt('guided', {
        scenarioVersion: '0.1.0', thermoregulation: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['rewarm at 0.5', 'she is warm now', 'she is stable now', 'the cause was the transfer', 'set the incubator to']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(thermoregulationInlinePrompt('guided', { scenarioVersion: '0.1.0', thermoregulation: patient })!.id)
      .toBe('thermoregulation-observe');
    expect(thermoregulationInlinePrompt('coached', { scenarioVersion: '0.1.0', thermoregulation: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(thermoregulationInlinePrompt('unassisted', { scenarioVersion: '0.1.0', thermoregulation: patient })).toBeNull();
    expect(thermoregulationInlinePrompt('guided', { scenarioVersion: '0.1.1', thermoregulation: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(thermoregulationInlinePrompt('guided', { scenarioVersion: '0.1.0', thermoregulation: snapshot(engine) })).toBeNull();
  });
});
