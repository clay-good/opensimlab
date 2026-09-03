/**
 * The worked example and observed-state tutor for a diagnosis everybody has
 * already made.
 *
 * The reflexes both work against are the obvious answer — active cancer plus
 * serosanguineous fluid — and the reassurance of a patient who was drained two
 * hours ago and now looks well.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PERICARDIAL_TAMPONADE as SCENARIO } from '../../src/modules/cardiology/scenarios/pericardial-tamponade';
import { PERICARDIAL_TAMPONADE_FIXTURES as FIXTURES } from '../../src/modules/cardiology/pericardial-tamponade-fixtures';
import {
  PERICARDIAL_TAMPONADE_DEMONSTRATION_VERSION, pericardialTamponadeDemonstrationStep,
  supportsPericardialTamponadeDemonstration,
} from '../../src/modules/cardiology/demo/pericardial-tamponade-demonstration';
import { pericardialTamponadeInlinePrompt } from '../../src/modules/cardiology/tutor/pericardial-tamponade-guidance';
import type { PericardialTamponadeAction } from '../../src/modules/cardiology/pericardial-tamponade';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pericardialTamponadeAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PericardialTamponadeAction) => {
  engine.apply({ tick, type: 'pericardial-tamponade-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pericardialTamponadeDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pericardial-tamponade-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Keeps The Cause Open', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PERICARDIAL_TAMPONADE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPericardialTamponadeDemonstration(SCENARIO)).toBe(true);
    expect(supportsPericardialTamponadeDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPericardialTamponadeDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.id !== 'pericardial-tamponade-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['trajectory', 'drainage', 'parallel', 'surveillance', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.drainageResponseAtTick!);
    expect(patient.drainageResponseAtTick).toBeLessThan(patient.etiologyAtTick!);
    expect(patient.etiologyAtTick).toBeLessThan(patient.surveillanceAtTick!);
    expect(patient.surveillanceAtTick).toBeLessThan(patient.handoffAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('says the emergency was over before the learner arrived', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('The emergency was over before you arrived');
    expect(trajectory).toContain('It was the whole picture that established tamponade in this case');
    expect(trajectory).toContain('a pulsus of 16 does not diagnose anything on its own');
  });

  it('names the three things a good drainage response does not establish', () => {
    const drainage = narrations[beats.indexOf('drainage')]!;
    expect(drainage).toContain('this lesson infers no procedure skill from an outcome');
    expect(drainage).toContain('the only thing wrong with her');
    expect(drainage).toContain('can fill it again');
    expect(patient.procedurePerformedByLearner).toBe(false);
  });

  it('says the two closing lanes may go in either order', () => {
    const parallel = narrations[beats.indexOf('parallel')]!;
    expect(parallel).toContain('in either order');
    expect(parallel).toContain('easy to leave to somebody else');
    // The lesson's headline caution has to survive on the example's own path,
    // which never reaches the beat for the lane the example itself took.
    expect(parallel).toContain('everybody in the room has already decided is her cancer');
    expect(parallel).toContain('the alternatives include one that is curable');
  });

  it('watches the catheter without touching it', () => {
    const surveillance = narrations[beats.indexOf('surveillance')]!;
    expect(surveillance).toContain('you do not touch, flush, reposition or remove the catheter');
    expect(surveillance).toContain('Recurrence is the expected thing to watch for');
    expect(patient.catheterManipulatedByLearner).toBe(false);
  });

  it('asks for two owners and refuses to call two quiet hours a result', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('is not durable resolution');
    expect(handoff).toContain('needs both');
    expect(narration).toContain('none of the questions has been answered');
    expect(narration).toContain('a written reason to keep looking at a patient who now looks fine');
  });

  it('never diagnoses the etiology, touches the catheter, or sets a threshold', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is malignant pericardial effusion', 'remove the drain',
      'flush the catheter', 'pull it when output is under 25 ml', 'start chemotherapy']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds The Diagnosis Open', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = pericardialTamponadeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['pct-trajectory', 'pct-drainage', 'pct-parallel', 'pct-surveillance', 'pct-handoff']);
  });

  it('names the etiology lane when the surveillance went first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-pericardial-tamponade-trajectory');
    advance(engine, 1, 'review-pericardial-tamponade-drainage-response');
    advance(engine, 2, 'review-pericardial-tamponade-surveillance');
    const prompt = pericardialTamponadeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pct-etiology');
    expect(prompt.suggestion).toContain('Everyone has already decided this is her cancer');
    expect(prompt.because).toContain('a first cytology can be negative in disease that is really there');
    expect(prompt.because).toContain('one of them is curable');
  });

  it('holds on the open lane when the handoff is attempted with one done', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-pericardial-tamponade-trajectory');
    advance(engine, 1, 'review-pericardial-tamponade-drainage-response');
    advance(engine, 2, 'review-pericardial-tamponade-etiology');
    advance(engine, 3, 'handoff-pericardial-tamponade-reassessment');
    expect(snapshot(engine)!.handoffAtTick).toBeNull();
    expect(pericardialTamponadeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pct-surveillance');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-pericardial-tamponade-etiology');
    expect(snapshot(engine)!.etiologyAtTick).toBeNull();
    expect(pericardialTamponadeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pct-trajectory');
  });

  it('never diagnoses the etiology or touches the catheter', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pericardialTamponadeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['this is malignant pericardial effusion', 'remove the drain', 'flush the catheter']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pericardialTamponadeInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pericardialTamponadeInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pericardialTamponadeInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pericardialTamponadeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pericardialTamponadeInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
