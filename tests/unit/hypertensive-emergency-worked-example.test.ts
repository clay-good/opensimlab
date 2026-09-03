/**
 * The worked example and observed-state tutor for a number that has to be
 * earned twice.
 *
 * The reflex both work against is 238/134: a pressure that large asks to be
 * treated on sight, and the emergency is the organ injury rather than the
 * number.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { HYPERTENSIVE_EMERGENCY as SCENARIO } from '../../src/modules/cardiology/scenarios/hypertensive-emergency';
import { HYPERTENSIVE_EMERGENCY_FIXTURES as FIXTURES } from '../../src/modules/cardiology/hypertensive-emergency-fixtures';
import {
  HYPERTENSIVE_EMERGENCY_DEMONSTRATION_VERSION, hypertensiveEmergencyDemonstrationStep,
  supportsHypertensiveEmergencyDemonstration,
} from '../../src/modules/cardiology/demo/hypertensive-emergency-demonstration';
import { hypertensiveEmergencyInlinePrompt } from '../../src/modules/cardiology/tutor/hypertensive-emergency-guidance';
import type { HypertensiveEmergencyAction } from '../../src/modules/cardiology/hypertensive-emergency';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.hypertensiveEmergencyAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: HypertensiveEmergencyAction) => {
  engine.apply({ tick, type: 'hypertensive-emergency-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = hypertensiveEmergencyDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'hypertensive-emergency-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Earns The Number Twice', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(HYPERTENSIVE_EMERGENCY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsHypertensiveEmergencyDemonstration(SCENARIO)).toBe(true);
    expect(supportsHypertensiveEmergencyDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsHypertensiveEmergencyDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.id !== 'hypertensive-emergency-boundary'),
    })).toBe(false);
  });

  it('takes all six recorded steps, treating before finishing the review', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(6);
    expect(beats).toEqual(['measurement', 'organ', 'parallel', 'phenotype', 'panel', 'handoff']);
    expect(patient.measurementAtTick).toBeLessThan(patient.organInjuryAtTick!);
    expect(patient.organInjuryAtTick).toBeLessThan(patient.reductionIntentAtTick!);
    expect(patient.reductionIntentAtTick).toBeLessThan(patient.phenotypeAtTick!);
    expect(patient.phenotypeAtTick).toBeLessThan(patient.laterPanelAtTick!);
    expect(patient.laterPanelAtTick).toBeLessThan(patient.handoffAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('says why the measurement conditions are not administrative', () => {
    const measurement = narrations[beats.indexOf('measurement')]!;
    expect(measurement).toContain('the commonest way a patient gets treated for an emergency they do not have');
    expect(measurement).toContain('a pressure difference that would change the whole pathway');
    expect(measurement).toContain('A marked pressure on its own is still not an emergency');
  });

  it('makes the organ injury rather than the pressure the emergency', () => {
    const organ = narrations[beats.indexOf('organ')]!;
    expect(organ).toContain('it — not the 236 — is what makes this a hypertensive emergency');
    expect(organ).toContain('a patient with the same numbers and no organ injury does not');
    expect(patient.acuteTargetOrganDamage).toBe(true);
  });

  it('carries the controlled-reduction argument on the path the example takes', () => {
    const parallel = narrations[beats.indexOf('parallel')]!;
    expect(parallel).toContain('either order');
    // The example never reaches the beat for the lane it took, so the reason a
    // fast fall is its own injury has to survive here.
    expect(parallel).toContain('Rapid normalization is the harm, not the goal');
    expect(parallel).toContain('lose perfusion at pressures that would be unremarkable in somebody else');
    expect(patient.rapidNormalizationSelected).toBe(false);
  });

  it('names the emergency by naming the ones it is not, without closing them', () => {
    const phenotype = narrations[beats.indexOf('phenotype')]!;
    expect(phenotype).toContain('each of which has its own pathway and its own pressure targets');
    expect(phenotype).toContain('a snapshot and a change trigger rather than a permanent exclusion');
    expect(phenotype).toContain('still on the table rather than closed by it');
  });

  it('notices the symptom that has not moved', () => {
    const panel = narrations[beats.indexOf('panel')]!;
    expect(panel).toContain('the shape of a controlled reduction rather than a rescue');
    expect(panel).toContain('the symptom most likely to reassure and the least specific');
    expect(panel).toContain('they are the reason nobody is finished');
  });

  it('reads the urine output and the creatinine together', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('has not cost her kidneys their perfusion');
    expect(handoff).toContain('Vision not worse is not vision better');
    expect(narration).toContain('The number was never the emergency');
  });

  it('never names a drug, a dose, a rate, a percentage, or a target', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['start a labetalol infusion', 'give 20 mg', 'run it at 2 mg/min',
      'drop it by 25%', 'aim for 140/90', 'normalise the pressure']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Will Not Treat The Number', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = hypertensiveEmergencyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['hte-measurement', 'hte-organ', 'hte-parallel', 'hte-phenotype', 'hte-panel', 'hte-handoff']);
  });

  it('stays on the organ injury when the treatment is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-hypertensive-emergency-measurement-and-trajectory');
    advance(engine, 1, 'record-hypertensive-emergency-controlled-reduction-intent');
    expect(snapshot(engine)!.reductionIntentAtTick).toBeNull();
    const prompt = hypertensiveEmergencyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('hte-organ');
    expect(prompt.suggestion).toContain('because the pressure is not it');
  });

  it('names the reduction lane when the phenotype went first', () => {
    const engine = create(); engine.step();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    advance(engine, 2, 'review-hypertensive-emergency-phenotype-and-causes');
    const prompt = hypertensiveEmergencyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('hte-reduction');
    expect(prompt.suggestion).toContain('no numbers of any kind');
    expect(prompt.because).toContain('rapid normalization is the harm and not the goal');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-hypertensive-emergency-organ-injury');
    expect(snapshot(engine)!.organInjuryAtTick).toBeNull();
    expect(hypertensiveEmergencyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('hte-measurement');
  });

  it('never names a drug, a dose, or a target', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = hypertensiveEmergencyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['start a labetalol infusion', 'give 20 mg', 'aim for 140/90']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(hypertensiveEmergencyInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(hypertensiveEmergencyInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(hypertensiveEmergencyInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(hypertensiveEmergencyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(hypertensiveEmergencyInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
