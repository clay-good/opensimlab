/**
 * The worked example and observed-state tutor for a monitor that has nothing
 * useful to say and says it confidently.
 *
 * Two refusals run the length of this lesson: a conventional pulse oximeter
 * cannot rule out carbon-monoxide poisoning, and a carboxyhemoglobin value does
 * not grade it. Both the tutor and the example carry them together, keep the
 * co-exposed partner in view as a second patient, and treat hyperbaric review
 * as an individualized consultation rather than a threshold.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { CARBON_MONOXIDE_REASSURING_MONITOR as SCENARIO } from '../../src/modules/toxicology/scenarios/carbon-monoxide-reassuring-monitor';
import { CARBON_MONOXIDE_FIXTURES as FIXTURES } from '../../src/modules/toxicology/carbon-monoxide-reassuring-monitor-fixtures';
import {
  CARBON_MONOXIDE_DEMONSTRATION_VERSION, carbonMonoxideDemonstrationStep,
  supportsCarbonMonoxideDemonstration,
} from '../../src/modules/toxicology/demo/carbon-monoxide-reassuring-monitor-demonstration';
import { carbonMonoxideInlinePrompt } from '../../src/modules/toxicology/tutor/carbon-monoxide-reassuring-monitor-guidance';
import type { CarbonMonoxideAction } from '../../src/modules/toxicology/carbon-monoxide-reassuring-monitor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologyCarbonMonoxideAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: CarbonMonoxideAction) => {
  engine.apply({ tick, type: 'carbon-monoxide-reassuring-monitor-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = carbonMonoxideDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'carbon-monoxide-reassuring-monitor-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Refuses Both Reassuring Numbers', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(CARBON_MONOXIDE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCarbonMonoxideDemonstration(SCENARIO)).toBe(true);
    expect(supportsCarbonMonoxideDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCarbonMonoxideDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognize', 'support', 'severity', 'report', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.severityAtTick!);
    expect(patient.severityAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('says the oximeter cannot rule the poisoning out', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('cannot rule out carbon-monoxide poisoning');
    expect(recognize).toContain('stay open');
  });

  it('reads the carboxyhemoglobin with its timing rather than as a grade', () => {
    const severity = narrations[beats.indexOf('severity')]!;
    expect(severity).toContain('after removal and after oxygen had already started');
    expect(severity).toContain('does not reliably grade severity');
  });

  it('acts on the scene and the second exposed person before the severity argument', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('a second patient rather than a line in his history');
    expect(beats.indexOf('support')).toBeLessThan(beats.indexOf('severity'));
  });

  it('confirms nothing, attributes nothing, and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableNeurologicRecoveryProven).toBe(false);
    expect(patient.delayedNeurologicComplicationsExcluded).toBe(false);
    expect(patient.cardiacComplicationsExcluded).toBe(false);
    expect(patient.coexposureExcluded).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['he is fine now', 'the poisoning is cleared', 'safe to discharge', 'mild poisoning']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('finishes with the delayed half of the poisoning still ahead of him', () => {
    expect(narration).toContain('Nothing was excluded');
    expect(narrations[beats.indexOf('handoff')]).toContain('days to weeks');
  });

  it('names no chamber, pressure, duration, threshold, or eligibility result', () => {
    expect(patient.hyperbaricTreatmentSelectedByLearner).toBe(false);
    expect(patient.hyperbaricEligibilityDetermined).toBe(false);
    expect(patient.transportSelectedByLearner).toBe(false);
    expect(patient.oxygenSelectedByLearner).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['2.8 ata', 'three sessions', 'cohb above 25% requires', 'transfer him to the chamber']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Will Not Let The Monitor Reassure Anyone', () => {
  it('opens by putting the exposure, the clock and the syncope ahead of the monitor', () => {
    const engine = create(); engine.step();
    const prompt = carbonMonoxideInlinePrompt('guided', {
      scenarioVersion: '0.1.0', carbonMonoxide: snapshot(engine),
    })!;
    expect(prompt.id).toBe('carbon-monoxide-trajectory');
    expect(prompt.because).toContain('a finding to be explained');
  });

  it('says why a normal reading is not evidence against the poisoning', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = carbonMonoxideInlinePrompt('guided', {
      scenarioVersion: '0.1.0', carbonMonoxide: snapshot(engine),
    })!;
    expect(prompt.id).toBe('carbon-monoxide-recognize');
    expect(prompt.because).toContain('cannot rule out carbon-monoxide poisoning');
    expect(prompt.because).toContain('stay open');
  });

  it('sends the room outside before it sends anyone to a chamber', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = carbonMonoxideInlinePrompt('guided', {
      scenarioVersion: '0.1.0', carbonMonoxide: snapshot(engine),
    })!;
    expect(prompt.id).toBe('carbon-monoxide-support');
    expect(prompt.because).toContain('a second patient rather than a line in his history');
  });

  it('refuses to let one number grade him', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = carbonMonoxideInlinePrompt('guided', {
      scenarioVersion: '0.1.0', carbonMonoxide: snapshot(engine),
    })!;
    expect(prompt.id).toBe('carbon-monoxide-severity');
    expect(prompt.because).toContain('does not reliably grade severity');
  });

  it('never diagnoses him, grades him, or picks a chamber', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = carbonMonoxideInlinePrompt('guided', {
        scenarioVersion: '0.1.0', carbonMonoxide: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['severe poisoning', 'confirmed carbon-monoxide poisoning', '2.8 ata', 'safe to discharge']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(carbonMonoxideInlinePrompt('guided', { scenarioVersion: '0.1.0', carbonMonoxide: patient })!.id)
      .toBe('carbon-monoxide-observe');
    expect(carbonMonoxideInlinePrompt('coached', { scenarioVersion: '0.1.0', carbonMonoxide: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(carbonMonoxideInlinePrompt('unassisted', { scenarioVersion: '0.1.0', carbonMonoxide: patient })).toBeNull();
    expect(carbonMonoxideInlinePrompt('guided', { scenarioVersion: '0.1.1', carbonMonoxide: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(carbonMonoxideInlinePrompt('guided', { scenarioVersion: '0.1.0', carbonMonoxide: snapshot(engine) })).toBeNull();
  });
});
