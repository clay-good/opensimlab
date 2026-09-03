/**
 * The worked example and observed-state tutor for a diagnosis that has not
 * arrived yet.
 *
 * A hypertensive man with crushing chest pain is an acute coronary syndrome by
 * default, and the default is the drug you would least like to have given a
 * dissecting aorta.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ACUTE_AORTIC_SYNDROME as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/acute-aortic-syndrome';
import { ACUTE_AORTIC_SYNDROME_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/acute-aortic-syndrome-fixtures';
import {
  ACUTE_AORTIC_SYNDROME_DEMONSTRATION_VERSION, acuteAorticSyndromeDemonstrationStep,
  supportsAcuteAorticSyndromeDemonstration,
} from '../../src/modules/emergency-medicine/demo/acute-aortic-syndrome-demonstration';
import { acuteAorticSyndromeInlinePrompt } from '../../src/modules/emergency-medicine/tutor/acute-aortic-syndrome-guidance';
import type { AcuteAorticSyndromeAction } from '../../src/modules/emergency-medicine/acute-aortic-syndrome';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.acuteAorticSyndromeAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: AcuteAorticSyndromeAction) => {
  engine.apply({ tick, type: 'acute-aortic-syndrome-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = acuteAorticSyndromeDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'acute-aortic-syndrome-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Re-Examines Rather Than Trusting The First Exam', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(ACUTE_AORTIC_SYNDROME_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAcuteAorticSyndromeDemonstration(SCENARIO)).toBe(true);
    expect(supportsAcuteAorticSyndromeDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsAcuteAorticSyndromeDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'acute-aortic-syndrome-boundary'),
    })).toBe(false);
  });

  it('takes all six recorded steps in the only order the engine accepts', () => {
    expect(beats).toEqual(['initial', 'evolution', 'escalate', 'impulse', 'imaging', 'handoff']);
    expect(patient.initialReviewedAtTick).toBeLessThan(patient.evolutionReviewedAtTick!);
    expect(patient.evolutionReviewedAtTick).toBeLessThan(patient.escalatedAtTick!);
    expect(patient.escalatedAtTick).toBeLessThan(patient.antiImpulseAtTick!);
    expect(patient.antiImpulseAtTick).toBeLessThan(patient.imagingAtTick!);
    expect(patient.imagingAtTick).toBeLessThan(patient.handedOffAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('picks out the word that separates this from most cardiac pain', () => {
    const initial = narrations[beats.indexOf('initial')]!;
    expect(initial).toContain('which builds');
    expect(initial).toContain('the drug you would least like to have given');
  });

  it('calls a symmetric exam a fact about a moment', () => {
    const evolution = narrations[beats.indexOf('evolution')]!;
    expect(evolution).toContain('a fact about a moment and not a promise');
    expect(evolution).toContain('one process at a branch point');
    expect(evolution).toContain('removes the cheapest explanation for the drift');
  });

  it('distinguishes pausing a pathway from ruling it out', () => {
    const escalate = narrations[beats.indexOf('escalate')]!;
    expect(escalate).toContain('Pausing is not the same as ruling out');
  });

  it('explains why rate comes before pressure, and caps the chase', () => {
    const impulse = narrations[beats.indexOf('impulse')]!;
    expect(impulse).toContain('increases the force of each ejection');
    expect(impulse).toContain('is not a better number');
  });

  it('says the scan has not resulted', () => {
    const imaging = narrations[beats.indexOf('imaging')]!;
    expect(imaging).toContain('the scan is not yet available');
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('more useful handover than a confident label');
    expect(narration).toContain('The example ends without a diagnosis');
  });

  it('never gives an antithrombotic, names a dose, reads the CT, or states the diagnosis', () => {
    // Guard the instruction voice, not the nouns: the lesson exists to keep the
    // diagnosis open, so a bare noun match would fail on its own point.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give aspirin', 'start heparin', 'give the thrombolytic',
      'start esmolol at', 'the ct shows', 'this is a type a dissection']) {
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
      const prompt = acuteAorticSyndromeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['aas-initial', 'aas-evolution', 'aas-escalate', 'aas-impulse', 'aas-imaging', 'aas-handoff']);
  });

  it('stays on the repeat examination when the pathway is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-aortic-initial-pattern');
    advance(engine, 1, 'activate-aortic-pathway');
    expect(snapshot(engine)!.escalatedAtTick).toBeNull();
    const prompt = acuteAorticSyndromeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('aas-evolution');
    expect(prompt.suggestion).toContain('Examine him again');
  });

  it('stays on the anti-impulse intent when imaging is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-aortic-initial-pattern');
    advance(engine, 1, 'repeat-aortic-asymmetry-exam');
    advance(engine, 2, 'activate-aortic-pathway');
    advance(engine, 3, 'prioritize-aortic-imaging');
    expect(snapshot(engine)!.imagingAtTick).toBeNull();
    expect(acuteAorticSyndromeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('aas-impulse');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'repeat-aortic-asymmetry-exam');
    expect(snapshot(engine)!.evolutionReviewedAtTick).toBeNull();
    expect(acuteAorticSyndromeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('aas-initial');
  });

  it('never gives an antithrombotic or names a dose anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = acuteAorticSyndromeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['give aspirin', 'start heparin', 'start esmolol at']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(acuteAorticSyndromeInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(acuteAorticSyndromeInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(acuteAorticSyndromeInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handedOffAtTick).not.toBeNull();
    expect(acuteAorticSyndromeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(acuteAorticSyndromeInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
