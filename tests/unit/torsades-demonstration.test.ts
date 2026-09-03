/**
 * The worked example and observed-state tutor for a rhythm whose name is the
 * thing that slows people down.
 *
 * The reflex both work against is recognition itself: knowing the word
 * torsades pulls straight towards magnesium and the QT, and both are the
 * second half of this lesson.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { TORSADES_DE_POINTES as SCENARIO } from '../../src/modules/cardiology/scenarios/torsades-de-pointes';
import { TORSADES_FIXTURES as FIXTURES } from '../../src/modules/cardiology/torsades-fixtures';
import {
  TORSADES_DEMONSTRATION_VERSION, torsadesDemonstrationStep, supportsTorsadesDemonstration,
} from '../../src/modules/cardiology/demo/torsades-demonstration';
import { torsadesInlinePrompt } from '../../src/modules/cardiology/tutor/torsades-guidance';
import type { TorsadesAction } from '../../src/modules/cardiology/torsades';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.torsadesAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: TorsadesAction) => {
  engine.apply({ tick, type: 'torsades-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = torsadesDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'torsades-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Shocks Before It Explains', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(TORSADES_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsTorsadesDemonstration(SCENARIO)).toBe(true);
    expect(supportsTorsadesDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsTorsadesDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'rhythm-change'),
    })).toBe(false);
  });

  it('takes all six recorded steps, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(6);
    expect(beats).toEqual(['recognition', 'shock', 'postshock', 'parallel', 'recurrence', 'handoff']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.shockIntentAtTick!);
    expect(patient.shockIntentAtTick).toBeLessThan(patient.postShockAtTick!);
    expect(patient.postShockAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.recurrenceIntentAtTick!);
    expect(patient.recurrenceIntentAtTick).toBeLessThan(patient.handoffAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('asks for the pattern and the pulse together, and says what each changes', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('not the uniform beats of monomorphic VT');
    expect(recognition).toContain('She has a pulse, which is what keeps this out of the arrest algorithm');
    expect(recognition).toContain('If the pulse goes, the pathway changes immediately');
  });

  it('gives the mechanical reason unsynchronized is not a preference', () => {
    const shock = narrations[beats.indexOf('shock')]!;
    expect(shock).toContain('the machine has nothing consistent to synchronize to');
    expect(shock).toContain('the delay is the harm');
  });

  it('says the team delivered the shock and the substrate is unchanged', () => {
    const postshock = narrations[beats.indexOf('postshock')]!;
    expect(postshock).toContain('the treating team delivered the shock, not you');
    expect(postshock).toContain('a slow rate with a long QT is the exact substrate that produced the arrhythmia');
    expect(postshock).toContain('rescued, not fixed');
    expect(patient.shockDeliveredByLearner).toBe(false);
  });

  it('says the two closing lanes may go in either order, and takes the cause first', () => {
    const parallel = narrations[beats.indexOf('parallel')]!;
    expect(parallel).toContain('The emergency is over');
    expect(parallel).toContain('either can go first');
    expect(parallel).toContain('there is now time to think, and that is the only reason these come second');
    // The example never reaches the beat for the lane it took, so the refusal
    // to pick a single cause has to survive here.
    expect(parallel).toContain('every one of which contributes and none of which is the cause');
  });

  it('holds the boundary that makes magnesium appropriate here and not everywhere', () => {
    const recurrence = narrations[beats.indexOf('recurrence')]!;
    expect(recurrence).toContain('bounded to recurrent polymorphic VT with a long QT');
    expect(recurrence).toContain('not a general antiarrhythmic for a normal QT');
    expect(patient.treatmentDeliveredByLearner).toBe(false);
  });

  it('refuses to call one quiet interval a result', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('one quiet interval proves nothing about the next one');
    expect(narration).toContain('a QT nobody has shortened');
    expect(narration).toContain('The shock was the easy part and somebody else delivered it.');
  });

  it('never names an energy, a dose, a sedative, or one proven cause', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['shock at 200 j', 'give 2 g of magnesium', 'give midazolam',
      'the dofetilide caused this', 'pace her at 90', 'start isoproterenol']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Will Not Let The Name Come First', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = torsadesInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['tdp-recognition', 'tdp-shock', 'tdp-postshock', 'tdp-parallel', 'tdp-recurrence', 'tdp-handoff']);
  });

  it('stays on the shock when the magnesium is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-torsades-pulse-and-pattern');
    advance(engine, 1, 'record-torsades-recurrence-suppression-intent');
    expect(snapshot(engine)!.recurrenceIntentAtTick).toBeNull();
    const prompt = torsadesInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('tdp-shock');
    expect(prompt.suggestion).toContain('before anything else you are tempted to do');
  });

  it('lists the contributors and refuses to pick one', () => {
    const engine = create(); engine.step();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    advance(engine, 3, 'record-torsades-recurrence-suppression-intent');
    const prompt = torsadesInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.because).toContain('Every one of those contributes and none of them is the cause');
    expect(prompt.because).toContain('picks none');
  });

  it('names the remaining lane after the suppression intent went first', () => {
    const engine = create(); engine.step();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    advance(engine, 3, 'record-torsades-recurrence-suppression-intent');
    const prompt = torsadesInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('tdp-context');
    expect(prompt.suggestion).toContain('do not settle on one answer');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'record-torsades-unsynchronized-shock-intent');
    expect(snapshot(engine)!.shockIntentAtTick).toBeNull();
    expect(torsadesInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('tdp-recognition');
  });

  it('never names an energy, a dose, or one proven cause', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = torsadesInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['shock at 200 j', 'give 2 g of magnesium', 'the dofetilide caused this']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(torsadesInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(torsadesInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(torsadesInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(torsadesInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(torsadesInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
