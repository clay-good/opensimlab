/**
 * The worked example and observed-state tutor for two pathways that are not a
 * sequence.
 *
 * Thrombolysis reads like the treatment and thrombectomy like the fallback,
 * which turns two parallel tracks into a queue against a running clock.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ACUTE_ISCHEMIC_STROKE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/acute-ischemic-stroke';
import { ACUTE_ISCHEMIC_STROKE_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/acute-ischemic-stroke-fixtures';
import {
  ACUTE_ISCHEMIC_STROKE_DEMONSTRATION_VERSION, acuteIschemicStrokeDemonstrationStep,
  supportsAcuteIschemicStrokeDemonstration,
} from '../../src/modules/emergency-medicine/demo/acute-ischemic-stroke-demonstration';
import { acuteIschemicStrokeInlinePrompt } from '../../src/modules/emergency-medicine/tutor/acute-ischemic-stroke-guidance';
import type { AcuteIschemicStrokeAction } from '../../src/modules/emergency-medicine/acute-ischemic-stroke';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.acuteIschemicStrokeAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: AcuteIschemicStrokeAction) => {
  engine.apply({ tick, type: 'acute-ischemic-stroke-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = acuteIschemicStrokeDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'acute-ischemic-stroke-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Runs Both Pathways In Parallel', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(ACUTE_ISCHEMIC_STROKE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAcuteIschemicStrokeDemonstration(SCENARIO)).toBe(true);
    expect(supportsAcuteIschemicStrokeDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsAcuteIschemicStrokeDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'acute-ischemic-stroke-boundary'),
    })).toBe(false);
  });

  it('takes all six recorded steps in the only order the engine accepts', () => {
    expect(beats).toEqual(['presentation', 'activate', 'imaging', 'thrombolysis', 'thrombectomy', 'handoff']);
    expect(patient.presentationReviewedAtTick).toBeLessThan(patient.systemActivatedAtTick!);
    expect(patient.systemActivatedAtTick).toBeLessThan(patient.imagingReviewedAtTick!);
    expect(patient.imagingReviewedAtTick).toBeLessThan(patient.tenecteplaseAtTick!);
    expect(patient.tenecteplaseAtTick).toBeLessThan(patient.thrombectomyActivatedAtTick!);
    expect(patient.thrombectomyActivatedAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('makes witnessed onset a fact and names the mimic', () => {
    const presentation = narrations[beats.indexOf('presentation')]!;
    expect(presentation).toContain('a fact rather than an estimate');
    expect(presentation).toContain('the mimic you must not miss');
  });

  it('says how the race is lost', () => {
    const activate = narrations[beats.indexOf('activate')]!;
    expect(activate).toContain('as one trip rather than two');
    expect(activate).toContain('each sensible step waiting politely for the one before it');
  });

  it('treats the noncontrast CT as a permission rather than a diagnosis', () => {
    const imaging = narrations[beats.indexOf('imaging')]!;
    expect(imaging).toContain('a permission rather than a diagnosis');
    expect(imaging).toContain('a two-pathway problem rather than a one-drug problem');
  });

  it('points at the cap where weight-based dosing stops being weight-based', () => {
    const thrombolysis = narrations[beats.indexOf('thrombolysis')]!;
    expect(thrombolysis).toContain('where weight-based dosing stops being weight-based');
  });

  it('names the step people wait to take, and why waiting costs', () => {
    const thrombectomy = narrations[beats.indexOf('thrombectomy')]!;
    expect(thrombectomy).toContain('This is the lesson');
    expect(thrombectomy).toContain('often too big for a drug to clear');
    expect(narration).toContain('without waiting to see whether the drug worked');
  });

  it('explains why the deficits are deliberately not re-scored', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('invites reading noise as a response');
    expect(handoff).toContain('cannot reconstruct any of it from a label');
  });

  it('never pushes the drug, reads the images, lowers the pressure, or claims reperfusion', () => {
    // Guard the instruction voice, not the nouns: the lesson names a drug and a
    // dose as a recorded intent, so a bare noun match would fail on its own point.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['push the tenecteplase', 'give the bolus now',
      'i can see the hypodensity', 'drop her pressure to', 'the vessel is open',
      'her deficits are improving']) {
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
      const prompt = acuteIschemicStrokeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['ais-presentation', 'ais-activate', 'ais-imaging', 'ais-thrombolysis', 'ais-thrombectomy', 'ais-handoff']);
  });

  it('stays on the imaging review when the thrombolysis intent is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-stroke-presentation');
    advance(engine, 1, 'activate-stroke-system');
    advance(engine, 2, 'record-tenecteplase-20-mg-intent');
    expect(snapshot(engine)!.tenecteplaseAtTick).toBeNull();
    const prompt = acuteIschemicStrokeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ais-imaging');
    expect(prompt.suggestion).toContain('what the two scans each rule in and out');
  });

  it('stays on the transfer when the handoff is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-stroke-presentation');
    advance(engine, 1, 'activate-stroke-system');
    advance(engine, 2, 'review-stroke-imaging-and-eligibility');
    advance(engine, 3, 'record-tenecteplase-20-mg-intent');
    advance(engine, 4, 'reassess-and-handoff-stroke');
    expect(snapshot(engine)!.reassessedAtTick).toBeNull();
    expect(acuteIschemicStrokeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ais-thrombectomy');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'activate-stroke-system');
    expect(snapshot(engine)!.systemActivatedAtTick).toBeNull();
    expect(acuteIschemicStrokeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ais-presentation');
  });

  it('never delivers a drug or reads an image anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = acuteIschemicStrokeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['push the tenecteplase', 'give the bolus now', 'i can see the hypodensity']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(acuteIschemicStrokeInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(acuteIschemicStrokeInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(acuteIschemicStrokeInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(acuteIschemicStrokeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(acuteIschemicStrokeInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
