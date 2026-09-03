/**
 * The worked example and observed-state tutor for a number that asks to be
 * corrected.
 *
 * A pH of 7.09 invites a treatment. The arithmetic is what turns it into a
 * diagnosis, and the engine will not let a stabilization choice happen first.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SEVERE_ACIDEMIA as SCENARIO } from '../../src/modules/critical-care/scenarios/severe-acidemia';
import { SEVERE_ACIDEMIA_FIXTURES as FIXTURES } from '../../src/modules/critical-care/severe-acidemia-fixtures';
import {
  SEVERE_ACIDEMIA_DEMONSTRATION_VERSION, severeAcidemiaDemonstrationStep,
  supportsSevereAcidemiaDemonstration,
} from '../../src/modules/critical-care/demo/severe-acidemia-demonstration';
import { severeAcidemiaInlinePrompt } from '../../src/modules/critical-care/tutor/severe-acidemia-guidance';
import type { SevereAcidemiaAction } from '../../src/modules/critical-care/severe-acidemia';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.severeAcidemiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: SevereAcidemiaAction) => {
  engine.apply({ tick, type: 'severe-acidemia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = severeAcidemiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'severe-acidemia-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Diagnoses The pH Before Treating It', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(SEVERE_ACIDEMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsSevereAcidemiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsSevereAcidemiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsSevereAcidemiaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'severe-acidemia-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['recognize', 'analyze', 'ventilate', 'cause', 'reassess']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.analysisAtTick!);
    expect(patient.analysisAtTick).toBeLessThan(patient.ventilationAtTick!);
    expect(patient.ventilationAtTick).toBeLessThan(patient.causePlanAtTick!);
    expect(patient.causePlanAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('reads the values as different organs saying the same thing', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('a different organ telling you the same thing');
    expect(recognize).toContain('an arrhythmia risk that currently has no ECG signature');
  });

  it('does the compensation arithmetic out loud', () => {
    const analyze = narrations[beats.indexOf('analyze')]!;
    expect(analyze).toContain('the expected PaCO2 is about 29, plus or minus 2. His is 48');
    expect(analyze).toContain('a superimposed respiratory acidosis');
    expect(analyze).toContain('an uncorrected gap would understate the acid');
  });

  it('makes "safe" the constraint on the fastest available fix', () => {
    const ventilate = narrations[beats.indexOf('ventilate')]!;
    expect(ventilate).toContain('The word "safe" is the constraint');
    expect(ventilate).toContain('stacking breaths in a patient who cannot exhale');
    expect(ventilate).toContain('Normalization by force is not the goal');
  });

  it('declines to pick a side on bicarbonate, because the evidence does not', () => {
    const cause = narrations[beats.indexOf('cause')]!;
    expect(cause).toContain('the lesson does not pick a side, because the evidence does not');
    expect(cause).toContain('BICARICU-2 found no 90-day mortality benefit');
    expect(cause).toContain('No dose, no agent, no target and no modality is selected here');
  });

  it('is careful about what an improved pH is evidence of', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('consistent with better ventilation alone');
    expect(narration).toContain('nobody gave him bicarbonate');
    expect(narration).toContain('Correcting a number was never going to be the treatment');
  });

  it('never gives bicarbonate, names a dose or a setting, or claims the acid is cleared', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    // Guard the instruction voice, not the nouns: the closing beat exists to say
    // the acid has NOT been cleared, so a bare noun match would fail on its own point.
    for (const forbidden of ['give an amp of bicarbonate', 'push 100 mmol', 'set the rate to 30',
      'start dialysis now', 'the acid is now cleared', 'his source is controlled']) {
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
      const prompt = severeAcidemiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['sac-recognize', 'sac-analyze', 'sac-ventilate', 'sac-cause', 'sac-reassess']);
  });

  it('stays on the analysis when the ventilation plan is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-severe-acidemia');
    advance(engine, 1, 'protect-severe-acidemia-ventilation');
    expect(snapshot(engine)!.ventilationAtTick).toBeNull();
    const prompt = severeAcidemiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('sac-analyze');
    expect(prompt.suggestion).toContain('Do the compensation arithmetic');
  });

  it('stays on the ventilation when the cause plan is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-severe-acidemia');
    advance(engine, 1, 'analyze-severe-acidemia-context');
    advance(engine, 2, 'activate-severe-acidemia-cause-plan');
    expect(snapshot(engine)!.causePlanAtTick).toBeNull();
    expect(severeAcidemiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('sac-ventilate');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'analyze-severe-acidemia-context');
    expect(snapshot(engine)!.analysisAtTick).toBeNull();
    expect(severeAcidemiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('sac-recognize');
  });

  it('never gives bicarbonate or names a dose anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = severeAcidemiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['give an amp of bicarbonate', 'push 100 mmol', 'start dialysis now']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(severeAcidemiaInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(severeAcidemiaInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(severeAcidemiaInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(severeAcidemiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(severeAcidemiaInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
