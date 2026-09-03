/**
 * The worked example and observed-state tutor for a patient who stopped moving
 * and did not stop seizing.
 *
 * A still patient looks like a treated patient. That is the whole trap, and the
 * only thing that knows the difference is an EEG this surface does not read.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { STATUS_EPILEPTICUS as SCENARIO } from '../../src/modules/critical-care/scenarios/status-epilepticus';
import { STATUS_EPILEPTICUS_FIXTURES as FIXTURES } from '../../src/modules/critical-care/status-epilepticus-fixtures';
import {
  STATUS_EPILEPTICUS_DEMONSTRATION_VERSION, statusEpilepticusDemonstrationStep,
  supportsStatusEpilepticusDemonstration,
} from '../../src/modules/critical-care/demo/status-epilepticus-demonstration';
import { statusEpilepticusInlinePrompt } from '../../src/modules/critical-care/tutor/status-epilepticus-guidance';
import type { StatusEpilepticusAction } from '../../src/modules/critical-care/status-epilepticus';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.criticalCareStatusEpilepticusAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: StatusEpilepticusAction) => {
  engine.apply({ tick, type: 'critical-care-status-epilepticus-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = statusEpilepticusDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'critical-care-status-epilepticus-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Refuses To Read Stillness As Control', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(STATUS_EPILEPTICUS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsStatusEpilepticusDemonstration(SCENARIO)).toBe(true);
    expect(supportsStatusEpilepticusDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsStatusEpilepticusDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'critical-care-status-epilepticus-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['recognize', 'pattern', 'pathway', 'causes', 'reassess']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.patternAtTick!);
    expect(patient.patternAtTick).toBeLessThan(patient.pathwayAtTick!);
    expect(patient.pathwayAtTick).toBeLessThan(patient.causesAtTick!);
    expect(patient.causesAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('names the trap in the first sentence', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('a still patient looks like a treated patient');
    expect(recognize).toContain('refractory by definition');
  });

  it('reads the lactate and the oliguria as the seizure in other organs', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('organs that are not the brain');
    expect(pattern).toContain('a benzodiazepine that never arrived looks identical to one that failed');
  });

  it('makes the guardrails the content of the pathway step', () => {
    const pathway = narrations[beats.indexOf('pathway')]!;
    expect(pathway).toContain('titrating an anesthetic against seizures you cannot see is guessing');
    expect(pathway).toContain('a reason to have the team and the support ready rather than a reason to hesitate');
  });

  it('keeps the cause search open next to a plausible story', () => {
    const causes = narrations[beats.indexOf('causes')]!;
    expect(causes).toContain('a plausible story is the thing most likely to end the search early');
    expect(causes).toContain('not something you suppress your way past');
  });

  it('calls ten minutes a window rather than a trend', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('Ten minutes is a window, not a trend');
    expect(narration).toContain('the reason to worry rather than the reason to relax');
  });

  it('never names an anesthetic dose, reads the EEG, or claims the seizures are controlled', () => {
    // Guard the instruction voice, not the nouns: the closing beat exists to say
    // control is NOT proven, so a bare noun match would fail on its own point.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['start propofol at 2 mg/kg', 'titrate to burst suppression',
      'the eeg shows generalized', 'do the lumbar puncture now', 'the seizures are now controlled']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds The Chain', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = statusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['cse-recognize', 'cse-pattern', 'cse-pathway', 'cse-causes', 'cse-reassess']);
  });

  it('stays on the systemic review when the pathway is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-refractory-status-epilepticus');
    advance(engine, 1, 'activate-refractory-status-pathway');
    expect(snapshot(engine)!.pathwayAtTick).toBeNull();
    const prompt = statusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('cse-pattern');
    expect(prompt.suggestion).toContain('a brain seizing for an hour has a body attached');
  });

  it('stays on the pathway when the cause work is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-refractory-status-epilepticus');
    advance(engine, 1, 'review-refractory-status-pattern');
    advance(engine, 2, 'address-refractory-status-causes');
    expect(snapshot(engine)!.causesAtTick).toBeNull();
    expect(statusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('cse-pathway');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-refractory-status-pattern');
    expect(snapshot(engine)!.patternAtTick).toBeNull();
    expect(statusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('cse-recognize');
  });

  it('never names a dose or a burst-suppression target anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = statusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['start propofol at 2 mg/kg', 'titrate to burst suppression', 'do the lumbar puncture now']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(statusEpilepticusInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(statusEpilepticusInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(statusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(statusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(statusEpilepticusInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
