/**
 * The worked example and observed-state tutor for a lesson scored on a clock.
 *
 * The engine gates none of these four steps against another, so the order the
 * example takes is defensible rather than enforced — and the example says so.
 * What the debrief grades is the interval from the modelled pleural event.
 *
 * This is also the first worked example in the module whose beats each carry
 * their own dispatch, because the four steps go through three different engine
 * action types.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { OBSTRUCTIVE_SHOCK_TENSION_PNEUMOTHORAX as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/obstructive-shock-tension-pneumothorax';
import { OBSTRUCTIVE_PLEURAL_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/obstructive-shock-tension-pneumothorax-fixtures';
import {
  OBSTRUCTIVE_PLEURAL_SHOCK_DEMONSTRATION_VERSION, obstructivePleuralShockDemonstrationStep,
  supportsObstructivePleuralShockDemonstration,
} from '../../src/modules/emergency-medicine/demo/obstructive-shock-tension-pneumothorax-demonstration';
import { obstructivePleuralShockInlinePrompt } from '../../src/modules/emergency-medicine/tutor/obstructive-shock-tension-pneumothorax-guidance';
import { obstructivePleuralShockProgress } from '../../src/modules/emergency-medicine/obstructive-shock-tension-pneumothorax';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => obstructivePleuralShockProgress(engine.equipment());
const advance = (engine: AnesthesiaEngine, tick: number, dispatch: Omit<LearnerAction, 'tick'>) => {
  engine.apply({ tick, ...dispatch } as LearnerAction);
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  // The pleural event is declared at tick 0 and is not active until the first
  // step, so the example begins at tick 1 like every reference transcript.
  engine.step();
  const beats: string[] = []; const narrations: string[] = [];
  const events: string[] = []; const dispatched: Omit<LearnerAction, 'tick'>[] = [];
  for (let tick = 1; tick <= limit; tick += 1) {
    const step = obstructivePleuralShockDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, dispatched, patient: snapshot(engine), narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.dispatch) {
      dispatched.push(step.dispatch);
      engine.apply({ tick, ...step.dispatch } as LearnerAction);
    }
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Is Graded On The Clock', () => {
  const { beats, narrations, dispatched, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(OBSTRUCTIVE_PLEURAL_SHOCK_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsObstructivePleuralShockDemonstration(SCENARIO)).toBe(true);
    expect(supportsObstructivePleuralShockDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsObstructivePleuralShockDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'tension-pneumothorax'),
    })).toBe(false);
  });

  it('takes all four beats and finishes well inside every declared window', () => {
    expect(beats).toEqual(['assess', 'help', 'oxygen', 'decompress']);
    expect(patient.assessedAtTick).not.toBeNull();
    expect(patient.helpRequestedAtTick).not.toBeNull();
    expect(patient.highConcentrationOxygen).toBe(true);
    // Ten ticks a second, so the sixty-second decompression window is 600.
    expect(patient.decompressedAtTick).toBeLessThan(600);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('drives three different engine action types, one dispatch per beat', () => {
    expect(dispatched.map(({ type }) => type)).toEqual([
      'pneumothorax-response', 'call-for-help', 'ventilator', 'pneumothorax-response',
    ]);
    expect(dispatched[1]!.payload).toMatchObject({ context: 'tension-pneumothorax' });
    expect(dispatched[2]!.payload).toMatchObject({ fio2: 1 });
  });

  it('tells the learner this lab measures duration rather than order', () => {
    const assess = narrations[beats.indexOf('assess')]!;
    expect(assess).toContain('this one asks how long you took');
    expect(assess).toContain('That asymmetry, in this context, is the whole diagnosis');
  });

  it('reads the shared credit window as evidence the call runs alongside', () => {
    const help = narrations[beats.indexOf('help')]!;
    expect(help).toContain('happening at the same time rather than next');
    expect(help).toContain('a request you can stand down costs nothing');
  });

  it('says the ceiling does not apply here, and that oxygen will not fix it', () => {
    const oxygen = narrations[beats.indexOf('oxygen')]!;
    expect(oxygen).toContain('the reflex ceiling does not apply');
    expect(oxygen).toContain('oxygen does not re-expand a lung');
  });

  it('gives the mechanical reason the windows are short, and names the asymmetry', () => {
    const decompress = narrations[beats.indexOf('decompress')]!;
    expect(decompress).toContain('the treatment reliably precedes the confirmation');
    expect(decompress).toContain('a request to spend the minute that mattered');
    expect(decompress).toContain('if you are right and slow, the cost is the arrest');
  });

  it('says the order it took was defensible rather than enforced', () => {
    expect(narration).toContain('the engine gates none of these four against another');
    expect(narration).toContain('scores worse than this one');
    expect(narration).toContain('a bounded teaching trajectory rather than a prognosis');
  });

  it('never waits for imaging, names a needle, or claims the lung is up', () => {
    // Guard the instruction voice, not the nouns: the lesson argues about
    // radiographs and about being wrong, so a bare noun match would fail on
    // the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['get a chest x-ray first', 'wait for the scan',
      'use a 14-gauge', 'second intercostal space', 'the lung is up',
      'the lung has re-expanded', 'she can be discharged']) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Reads Generic Engine State', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, dispatch] of FIXTURES.expert) {
      const prompt = obstructivePleuralShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, dispatch);
    }
    expect(seen).toEqual(['pleural-assess', 'pleural-help', 'pleural-oxygen', 'pleural-decompress']);
  });

  it('follows whichever step the learner actually left undone', () => {
    const engine = create(); engine.step();
    advance(engine, 1, FIXTURES.expert[0]![1]);
    // Oxygen before help: the tutor moves to help, because nothing is gated.
    advance(engine, 2, { type: 'ventilator', payload: { fio2: 1 } });
    expect(obstructivePleuralShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pleural-help');
  });

  it('reaches the decompression beat once the other three are recorded', () => {
    const engine = create(); engine.step();
    advance(engine, 1, { type: 'pneumothorax-response', payload: { action: 'assess-bilateral-ventilation' } });
    advance(engine, 2, { type: 'call-for-help', payload: { context: 'tension-pneumothorax' } });
    advance(engine, 3, { type: 'ventilator', payload: { fio2: 1 } });
    const prompt = obstructivePleuralShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pleural-decompress');
    expect(prompt.suggestion).toContain('without imaging and without waiting');
  });

  it('does not move on when an action is refused for an inactive event', () => {
    const engine = create();
    // No step yet, so the pleural event has not fired and both are refused.
    engine.apply({ tick: 0, type: 'pneumothorax-response', payload: { action: 'assess-bilateral-ventilation' } });
    engine.step();
    expect(snapshot(engine).assessedAtTick).toBeNull();
    expect(obstructivePleuralShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pleural-assess');
  });

  it('never waits for imaging or names a needle anywhere on the recovery path', () => {
    const engine = create(); engine.step(); const seen: string[] = [];
    for (const [tick, dispatch] of FIXTURES.recovery) {
      const prompt = obstructivePleuralShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, dispatch);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['get a chest x-ray first', 'use a 14-gauge', 'the lung is up']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after decompression', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(obstructivePleuralShockInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(obstructivePleuralShockInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(obstructivePleuralShockInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, dispatch] of FIXTURES.expert) advance(engine, tick, dispatch);
    expect(snapshot(engine).decompressedAtTick).not.toBeNull();
    expect(obstructivePleuralShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(obstructivePleuralShockInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
