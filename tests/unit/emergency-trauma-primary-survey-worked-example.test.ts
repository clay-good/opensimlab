/**
 * The worked example and observed-state tutor for the letter in front of the
 * alphabet.
 *
 * Everyone starts at A. This patient has a leg that has not stopped bleeding
 * after direct pressure, and the engine refuses the airway review until the
 * tourniquet is recorded.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { TRAUMA_PRIMARY_SURVEY as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/trauma-primary-survey';
import { TRAUMA_PRIMARY_SURVEY_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/trauma-primary-survey-fixtures';
import {
  TRAUMA_PRIMARY_SURVEY_DEMONSTRATION_VERSION, traumaPrimarySurveyDemonstrationStep,
  supportsTraumaPrimarySurveyDemonstration,
} from '../../src/modules/emergency-medicine/demo/trauma-primary-survey-demonstration';
import { traumaPrimarySurveyInlinePrompt } from '../../src/modules/emergency-medicine/tutor/trauma-primary-survey-guidance';
import type { TraumaPrimarySurveyAction } from '../../src/modules/emergency-medicine/trauma-primary-survey';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.traumaPrimarySurveyAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: TraumaPrimarySurveyAction) => {
  engine.apply({ tick, type: 'trauma-primary-survey-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = traumaPrimarySurveyDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'trauma-primary-survey-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Stops The Bleeding Before It Looks At The Airway', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(TRAUMA_PRIMARY_SURVEY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsTraumaPrimarySurveyDemonstration(SCENARIO)).toBe(true);
    expect(supportsTraumaPrimarySurveyDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsTraumaPrimarySurveyDemonstration({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'trauma-primary-survey-boundary'),
    })).toBe(false);
  });

  it('takes all six recorded steps with the tourniquet ahead of the airway', () => {
    expect(beats).toEqual(['activation', 'hemorrhage', 'airway', 'circulation', 'exposure', 'repeat']);
    expect(patient.activatedAtTick).toBeLessThan(patient.catastrophicHemorrhageAtTick!);
    expect(patient.catastrophicHemorrhageAtTick).toBeLessThan(patient.airwayBreathingAtTick!);
    expect(patient.circulationAtTick).toBeLessThan(patient.disabilityExposureAtTick!);
    expect(patient.disabilityExposureAtTick).toBeLessThan(patient.repeatedAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('says a handoff interrupted is a handoff repeated', () => {
    const activation = narrations[beats.indexOf('activation')]!;
    expect(activation).toContain('A handoff interrupted is a handoff repeated');
    expect(activation).toContain('does not have to guess who is doing what');
  });

  it('carries the reason the C comes first', () => {
    const hemorrhage = narrations[beats.indexOf('hemorrhage')]!;
    expect(hemorrhage).toContain('the airway of a patient who has bled out is not a problem anyone gets to solve');
    expect(hemorrhage).toContain('the clock on a tourniquet starts the moment it is tight');
    expect(narration).toContain('The tourniquet went on before anybody looked at the airway');
  });

  it('reads coherent speech as the fastest airway assessment', () => {
    const airway = narrations[beats.indexOf('airway')]!;
    expect(airway).toContain('the fastest airway assessment there is');
    expect(airway).toContain('unfixable by circulation measures');
  });

  it('reads persistent shock after external control as internal bleeding', () => {
    const circulation = narrations[beats.indexOf('circulation')]!;
    expect(circulation).toContain('That means it is inside');
    expect(circulation).toContain('dilutes what little clotting capacity is left');
    expect(circulation).toContain('a pointer, not a clearance');
  });

  it('treats re-covering as treatment and the back as where a bleed hides', () => {
    const exposure = narrations[beats.indexOf('exposure')]!;
    expect(exposure).toContain('a patient nobody has turned over');
    expect(exposure).toContain('cold blood does not clot');
  });

  it('says a primary survey done once is a photograph', () => {
    const repeat = narrations[beats.indexOf('repeat')]!;
    expect(repeat).toContain('A primary survey done once is a photograph');
    expect(repeat).toContain('named rather than smoothed over');
  });

  it('never starts at the airway, gives clear fluid, or clears the abdomen', () => {
    // Guard the instruction voice, not the nouns: the lesson names crystalloid
    // and the eFAST precisely in order to argue about them, so a bare noun
    // match would fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['start with the airway', 'give two litres of crystalloid',
      'run saline wide open', 'the scan is negative so', 'the bleeding is stopped',
      'he is stable now', 'he can go to the ward']) {
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
      const prompt = traumaPrimarySurveyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['trauma-activation', 'trauma-hemorrhage', 'trauma-airway',
      'trauma-circulation', 'trauma-exposure', 'trauma-repeat']);
  });

  it('stays on the haemorrhage when the airway is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'activate-trauma-primary-survey');
    advance(engine, 1, 'review-trauma-airway-and-breathing');
    expect(snapshot(engine)!.airwayBreathingAtTick).toBeNull();
    const prompt = traumaPrimarySurveyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('trauma-hemorrhage');
    expect(prompt.suggestion).toContain('Stop the bleeding first');
  });

  it('stays on exposure when the repeat survey is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'activate-trauma-primary-survey');
    advance(engine, 1, 'control-trauma-catastrophic-hemorrhage');
    advance(engine, 2, 'review-trauma-airway-and-breathing');
    advance(engine, 3, 'record-trauma-circulation-response');
    advance(engine, 4, 'repeat-trauma-primary-survey');
    expect(snapshot(engine)!.repeatedAtTick).toBeNull();
    expect(traumaPrimarySurveyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('trauma-exposure');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'control-trauma-catastrophic-hemorrhage');
    expect(snapshot(engine)!.catastrophicHemorrhageAtTick).toBeNull();
    expect(traumaPrimarySurveyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('trauma-activation');
  });

  it('never starts at the airway or gives clear fluid anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = traumaPrimarySurveyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['start with the airway', 'give two litres of crystalloid', 'run saline wide open']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the repeat', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(traumaPrimarySurveyInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(traumaPrimarySurveyInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(traumaPrimarySurveyInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.repeatedAtTick).not.toBeNull();
    expect(traumaPrimarySurveyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(traumaPrimarySurveyInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
