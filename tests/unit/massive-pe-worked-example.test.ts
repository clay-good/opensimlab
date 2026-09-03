/**
 * The worked example and observed-state tutor for a bridge that is not a
 * treatment.
 *
 * Two reflexes: the urge to keep diagnosing a patient whose diagnosis is
 * already in his notes, and the ease of relaxing once a machine carries his
 * circulation as though the clot had been treated.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { MASSIVE_PULMONARY_EMBOLISM as SCENARIO } from '../../src/modules/critical-care/scenarios/massive-pulmonary-embolism';
import { MASSIVE_PE_FIXTURES as FIXTURES } from '../../src/modules/critical-care/massive-pe-fixtures';
import {
  MASSIVE_PE_DEMONSTRATION_VERSION, massivePeDemonstrationStep, supportsMassivePeDemonstration,
} from '../../src/modules/critical-care/demo/massive-pe-demonstration';
import { massivePeInlinePrompt } from '../../src/modules/critical-care/tutor/massive-pe-guidance';
import type { MassivePeAction } from '../../src/modules/critical-care/massive-pe';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.massivePulmonaryEmbolismAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: MassivePeAction) => {
  engine.apply({ tick, type: 'massive-pulmonary-embolism-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = massivePeDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'massive-pulmonary-embolism-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Bridges Without Claiming Treatment', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(MASSIVE_PE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMassivePeDemonstration(SCENARIO)).toBe(true);
    expect(supportsMassivePeDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsMassivePeDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'massive-pulmonary-embolism-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['recognition', 'pattern', 'support', 'bridge', 'reassessment']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.patternAtTick!);
    expect(patient.patternAtTick).toBeLessThan(patient.supportAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.ecmoAtTick!);
    expect(patient.ecmoAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('says why the teams are called before the review', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('the people who can help him take time to assemble and he does not have any');
    expect(recognition).toContain('a patient already on the treatment');
  });

  it('refuses to re-diagnose a diagnosis already in the notes', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('the most expensive thing anybody could do now is order another study to be sure');
    expect(pattern).toContain('the bleeding risk');
  });

  it('sharpens the fluid argument and adds the ventilation one', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('obstructed at its outflow');
    expect(support).toContain('the pressures that recruit a lung are the pressures that raise the afterload');
  });

  it('is exact about what a bridge is not', () => {
    const bridge = narrations[beats.indexOf('bridge')]!;
    expect(bridge).toContain('It does not touch the clot');
    expect(bridge).toContain('resource- and candidacy-dependent rather than a rule');
    expect(bridge).toContain('stops the bridge being discussed rather than arranged');
  });

  it('names the moment the distinction is easiest to lose', () => {
    const reassessment = narrations[beats.indexOf('reassessment')]!;
    expect(reassessment).toContain('a circulation being carried rather than a clot being treated');
    expect(reassessment).toContain('its usefulness in a patient already on VA-ECMO is not established');
    expect(narration).toContain('the saddle embolus is exactly where it was');
  });

  it('never cannulates, names a dose or an anticoagulant, or claims the clot is treated', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['cannulate the femoral', 'give alteplase', 'give 100 mg',
      'the clot is gone', 'start heparin at', 'perform embolectomy']) {
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
      const prompt = massivePeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['mpe-recognition', 'mpe-pattern', 'mpe-support', 'mpe-ecmo', 'mpe-reassessment']);
  });

  it('stays on the pattern review when the bridge is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-refractory-pe-shock');
    advance(engine, 1, 'activate-pe-ecmo-bridge');
    expect(snapshot(engine)!.ecmoAtTick).toBeNull();
    const prompt = massivePeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('mpe-pattern');
    expect(prompt.suggestion).toContain('Do not go looking for a diagnosis you have');
  });

  it('stays on the support when the bridge is reached for after the review', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-refractory-pe-shock');
    advance(engine, 1, 'review-refractory-pe-pattern');
    advance(engine, 2, 'activate-pe-ecmo-bridge');
    expect(snapshot(engine)!.ecmoAtTick).toBeNull();
    expect(massivePeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('mpe-support');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-refractory-pe-pattern');
    expect(snapshot(engine)!.patternAtTick).toBeNull();
    expect(massivePeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('mpe-recognition');
  });

  it('never cannulates, names a dose, or claims the clot is treated', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = massivePeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['cannulate the femoral', 'give alteplase', 'the clot is gone']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(massivePeInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(massivePeInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(massivePeInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(massivePeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(massivePeInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
