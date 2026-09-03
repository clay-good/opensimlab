/**
 * The worked example and observed-state tutor for a lesson that ends with the
 * patient no better.
 *
 * Every other lesson quietly teaches that recording the right action is what
 * moves the numbers. Here the engine keeps the arrival obstruction running
 * after the accepted escalation and says so on the reassessment event, because
 * a click mobilises a team and does not open a pericardium.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { CARDIAC_TAMPONADE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/cardiac-tamponade';
import { CARDIAC_TAMPONADE_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/cardiac-tamponade-fixtures';
import {
  CARDIAC_TAMPONADE_DEMONSTRATION_VERSION, cardiacTamponadeDemonstrationStep,
  supportsCardiacTamponadeDemonstration,
} from '../../src/modules/emergency-medicine/demo/cardiac-tamponade-demonstration';
import { cardiacTamponadeInlinePrompt } from '../../src/modules/emergency-medicine/tutor/cardiac-tamponade-guidance';
import type { CardiacTamponadeAction } from '../../src/modules/emergency-medicine/cardiac-tamponade';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.cardiacTamponadeAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: CardiacTamponadeAction) => {
  engine.apply({ tick, type: 'cardiac-tamponade-assessment', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  // The arrival tamponade event fires on the first step, and the engine refuses
  // these controls outright until it is active — so the example, like every
  // reference transcript, begins at tick 1.
  engine.step();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 1; tick <= limit; tick += 1) {
    const step = cardiacTamponadeDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'cardiac-tamponade-assessment', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Ends With The Patient No Better', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(CARDIAC_TAMPONADE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCardiacTamponadeDemonstration(SCENARIO)).toBe(true);
    expect(supportsCardiacTamponadeDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCardiacTamponadeDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'cardiac-tamponade'),
    })).toBe(false);
  });

  it('takes all four recorded steps in the only order the engine accepts', () => {
    expect(beats).toEqual(['context', 'pocus', 'control', 'reassess']);
    expect(patient.contextReviewedAtTick).toBeLessThan(patient.pocusReviewedAtTick!);
    expect(patient.pocusReviewedAtTick).toBeLessThan(patient.definitiveControlAtTick!);
    expect(patient.definitiveControlAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('makes the preserved bilateral air entry do the work', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('rather than a tension pneumothorax');
    expect(context).toContain('the thing an obstructed ventricle cannot produce');
  });

  it('says why the focused finding comes second', () => {
    const pocus = narrations[beats.indexOf('pocus')]!;
    expect(pocus).toContain('an effusion is only tamponade when the circulation says it is');
    expect(pocus).toContain('a diagnosis it has not earned');
  });

  it('explains why there is no procedure on the screen', () => {
    const control = narrations[beats.indexOf('control')]!;
    expect(control).toContain('a journey, not a treatment');
    expect(control).toContain('not something a needle empties');
    expect(control).toContain('compress the interval before it starts');
  });

  it('tells the learner to expect nothing better, and why that is the point', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('expect it to be no better');
    expect(reassess).toContain('every habit built on a simulator pushes the other way');
    expect(narration).toContain('the patient is no better');
    expect(narration).toContain('it did not open a pericardium');
  });

  it('never performs the procedure, relieves the obstruction, or reports improvement', () => {
    // Guard the instruction voice, not the nouns: the lesson names
    // pericardiocentesis and thoracotomy in order to argue about them, so a
    // bare noun match would fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['put the needle in', 'drain the pericardium now',
      'open the chest here', 'the pressure is coming up', 'the obstruction is relieved',
      'perfusion has improved', 'he is stabilising']) {
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
      const prompt = cardiacTamponadeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['tam-context', 'tam-pocus', 'tam-control', 'tam-reassess']);
  });

  it('stays on the whole-patient review when the picture is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 1, 'review-fixed-pocus');
    expect(snapshot(engine)!.pocusReviewedAtTick).toBeNull();
    const prompt = cardiacTamponadeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('tam-context');
    expect(prompt.suggestion).toContain('before you reach for anything');
  });

  it('stays on the focused finding when the escalation is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 1, 'review-context-and-perfusion');
    advance(engine, 2, 'record-definitive-control-intent');
    expect(snapshot(engine)!.definitiveControlAtTick).toBeNull();
    expect(cardiacTamponadeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('tam-pocus');
  });

  it('stays on the reassessment while the engine clock has not moved on', () => {
    const engine = create(); engine.step();
    advance(engine, 1, 'review-context-and-perfusion');
    advance(engine, 2, 'review-fixed-pocus');
    engine.apply({ tick: 3, type: 'cardiac-tamponade-assessment', payload: { action: 'record-definitive-control-intent' } });
    engine.apply({ tick: 3, type: 'cardiac-tamponade-assessment', payload: { action: 'reassess-perfusion' } });
    engine.step();
    expect(snapshot(engine)!.reassessedAtTick).toBeNull();
    expect(cardiacTamponadeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('tam-reassess');
  });

  it('never performs a procedure or claims relief anywhere on the recovery path', () => {
    const engine = create(); engine.step(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = cardiacTamponadeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['put the needle in', 'drain the pericardium now', 'the obstruction is relieved']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(cardiacTamponadeInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(cardiacTamponadeInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(cardiacTamponadeInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(cardiacTamponadeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(cardiacTamponadeInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
