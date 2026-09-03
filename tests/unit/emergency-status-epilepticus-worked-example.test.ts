/**
 * The worked example and observed-state tutor for the thirty seconds before
 * the drug.
 *
 * Everyone knows the benzodiazepine. What gets skipped is the glucose, the
 * suction and the position — and one of those three is a treatment for the
 * seizure itself.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { STATUS_EPILEPTICUS as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/status-epilepticus';
import { STATUS_EPILEPTICUS_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/status-epilepticus-fixtures';
import {
  STATUS_EPILEPTICUS_DEMONSTRATION_VERSION, statusEpilepticusDemonstrationStep,
  supportsStatusEpilepticusDemonstration,
} from '../../src/modules/emergency-medicine/demo/status-epilepticus-demonstration';
import { statusEpilepticusInlinePrompt } from '../../src/modules/emergency-medicine/tutor/status-epilepticus-guidance';
import type { StatusEpilepticusAction } from '../../src/modules/emergency-medicine/status-epilepticus';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.statusEpilepticusAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: StatusEpilepticusAction) => {
  engine.apply({ tick, type: 'status-epilepticus-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = statusEpilepticusDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'status-epilepticus-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Checks A Glucose Before It Gives A Drug', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(STATUS_EPILEPTICUS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsStatusEpilepticusDemonstration(SCENARIO)).toBe(true);
    expect(supportsStatusEpilepticusDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsStatusEpilepticusDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'status-epilepticus'),
    })).toBe(false);
  });

  it('takes all four recorded steps in the only order the engine accepts', () => {
    expect(beats).toEqual(['review', 'stabilization', 'lorazepam', 'reassess']);
    expect(patient.reviewedAtTick).toBeLessThan(patient.supportedAtTick!);
    expect(patient.supportedAtTick).toBeLessThan(patient.lorazepamAtTick!);
    expect(patient.lorazepamAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('says why five minutes is an operational rather than a biological threshold', () => {
    const review = narrations[beats.indexOf('review')]!;
    expect(review).toContain('waiting for a biological answer costs neurons');
    expect(review).toContain('how long it has already been going');
  });

  it('carries the reason the bundle gates the drug', () => {
    const stabilization = narrations[beats.indexOf('stabilization')]!;
    expect(stabilization).toContain('stops fitting and stays hypoglycaemic');
    expect(stabilization).toContain('the worst kind of apparent success');
    expect(stabilization).toContain('holding a convulsing limb breaks it');
    expect(narration).toContain('the item that justifies the gate is the smallest one on it');
  });

  it('names the underdose as the commonest benzodiazepine error', () => {
    const lorazepam = narrations[beats.indexOf('lorazepam')]!;
    expect(lorazepam).toContain('giving too little of the right one and then waiting');
    expect(lorazepam).toContain('a patient who is now also sedated');
  });

  it('keeps surveillance running and holds the second-line boundary', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('when people are found apnoeic');
    expect(reassess).toContain('rather than a second dose of the same benzodiazepine');
  });

  it('never gives the drug first, restrains the patient, or claims a cure', () => {
    // Guard the instruction voice, not the nouns: the lesson names restraint
    // and a second benzodiazepine dose precisely in order to forbid them, so a
    // bare noun match would fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['give the lorazepam first', 'hold him down',
      'restrain the limbs', 'give a second dose of lorazepam and wait',
      'the seizure is cured', 'he can be discharged']) {
      expect(text, forbidden).not.toContain(forbidden);
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
    expect(seen).toEqual(['status-review', 'status-stabilization', 'status-lorazepam', 'status-reassess']);
  });

  it('stays on the bundle when the drug is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-convulsive-status');
    advance(engine, 1, 'give-lorazepam-4-mg-iv');
    expect(snapshot(engine)!.lorazepamAtTick).toBeNull();
    const prompt = statusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('status-stabilization');
    expect(prompt.suggestion).toContain('the glucose, which is treatment');
  });

  it('stays on the reassessment while the engine clock has not moved on', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-convulsive-status');
    advance(engine, 1, 'record-status-stabilization');
    engine.apply({ tick: 2, type: 'status-epilepticus-response', payload: { action: 'give-lorazepam-4-mg-iv' } });
    engine.apply({ tick: 2, type: 'status-epilepticus-response', payload: { action: 'reassess-after-lorazepam' } });
    engine.step();
    expect(snapshot(engine)!.reassessedAtTick).toBeNull();
    expect(statusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('status-reassess');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'record-status-stabilization');
    expect(snapshot(engine)!.supportedAtTick).toBeNull();
    expect(statusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('status-review');
  });

  it('never restrains the patient or repeats the benzodiazepine on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = statusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['hold him down', 'restrain the limbs', 'give a second dose of lorazepam and wait']) {
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
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(statusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(statusEpilepticusInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
