/**
 * The worked example and observed-state tutor for a screen that looks like it
 * is working.
 *
 * The reflex both work against is the monitor: paced complexes at 70/min in a
 * patient with no pulse, and the minutes a team spends adjusting a pacer that
 * is already capturing.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { TRANSCUTANEOUS_PACING_MECHANICAL_CAPTURE_REASSESSMENT as SCENARIO } from '../../src/modules/cardiology/scenarios/transcutaneous-pacing-mechanical-capture-reassessment';
import { TRANSCUTANEOUS_PACING_CAPTURE_FIXTURES as FIXTURES } from '../../src/modules/cardiology/transcutaneous-pacing-capture-fixtures';
import {
  TRANSCUTANEOUS_PACING_CAPTURE_DEMONSTRATION_VERSION, transcutaneousPacingCaptureDemonstrationStep,
  supportsTranscutaneousPacingCaptureDemonstration,
} from '../../src/modules/cardiology/demo/transcutaneous-pacing-capture-demonstration';
import { transcutaneousPacingCaptureInlinePrompt } from '../../src/modules/cardiology/tutor/transcutaneous-pacing-capture-guidance';
import type { TranscutaneousPacingCaptureAction } from '../../src/modules/cardiology/transcutaneous-pacing-capture';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.transcutaneousPacingCaptureAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: TranscutaneousPacingCaptureAction) => {
  engine.apply({ tick, type: 'transcutaneous-pacing-capture-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = transcutaneousPacingCaptureDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'transcutaneous-pacing-capture-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Read A Patient Off A Screen', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(TRANSCUTANEOUS_PACING_CAPTURE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsTranscutaneousPacingCaptureDemonstration(SCENARIO)).toBe(true);
    expect(supportsTranscutaneousPacingCaptureDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsTranscutaneousPacingCaptureDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'rhythm-change'),
    })).toBe(false);
  });

  it('takes all four recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(beats).toEqual(['recognition', 'pulseless', 'causes', 'handoff']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.pulselessResponseAtTick!);
    expect(patient.pulselessResponseAtTick).toBeLessThan(patient.causesBridgeAtTick!);
    expect(patient.causesBridgeAtTick).toBeLessThan(patient.handoffAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('counts the signals and states the physiology in one line', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('Four independent signals say there is no circulation');
    expect(recognition).toContain('says nothing about whether it ejected');
    expect(recognition).toContain('not a bradycardia that still needs tuning');
    expect(patient.electricalCaptureAuthored).toBe(true);
    expect(patient.mechanicalCaptureAbsent).toBe(true);
  });

  it('names the specific harm the lesson is built around', () => {
    const pulseless = narrations[beats.indexOf('pulseless')]!;
    expect(pulseless).toContain('are minutes without compressions');
    expect(pulseless).toContain('The paced QRS complexes are not circulation');
    expect(patient.nonshockableArrestPathwayActivated).toBe(true);
    expect(patient.cprDeliveredByLearner).toBe(false);
  });

  it('keeps the review alongside the arrest rather than instead of it', () => {
    const causes = narrations[beats.indexOf('causes')]!;
    expect(causes).toContain('The word that matters is while');
    expect(causes).toContain('never pauses it');
    expect(causes).toContain('a question rather than a plan');
  });

  it('says the missing ending is a choice', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('that is a choice rather than an omission');
    expect(handoff).toContain('should not close by telling you how the patient did');
    expect(narration).toContain('a resuscitation that is still running');
    expect(narration).toContain('not reading an ending off a screen');
    expect(patient.roscReported).toBe(false);
  });

  it('never names an output, a current, a pad placement, a drug, or a return of circulation', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['turn the output up to 120 ma', 'move the pads', 'give adrenaline',
      'she regained a pulse', 'pace at 80', 'she survived']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds The Only Order There Is', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = transcutaneousPacingCaptureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['tpc-recognition', 'tpc-pulseless', 'tpc-causes', 'tpc-handoff']);
  });

  it('stays on the arrest when the causes are reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-transcutaneous-pacing-electrical-and-mechanical-capture');
    advance(engine, 1, 'review-transcutaneous-pacing-open-causes-and-bridge');
    expect(snapshot(engine)!.causesBridgeAtTick).toBeNull();
    const prompt = transcutaneousPacingCaptureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('tpc-pulseless');
    expect(prompt.suggestion).toContain('Nothing else happens until that is recorded');
  });

  it('does not move on when the arrest is attempted before the recognition', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'activate-transcutaneous-pacing-pulseless-response');
    expect(snapshot(engine)!.pulselessResponseAtTick).toBeNull();
    expect(transcutaneousPacingCaptureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('tpc-recognition');
  });

  it('never names an output, a pad placement, or a return of circulation', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = transcutaneousPacingCaptureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['turn the output up to 120 ma', 'move the pads', 'she regained a pulse']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(transcutaneousPacingCaptureInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(transcutaneousPacingCaptureInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(transcutaneousPacingCaptureInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(transcutaneousPacingCaptureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(transcutaneousPacingCaptureInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
