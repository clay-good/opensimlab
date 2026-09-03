/**
 * The worked example and observed-state tutor for three lanes of which only one
 * opens the artery.
 *
 * Aspirin and a P2Y12 inhibitor stop a clot getting bigger; a wire reopens an
 * artery, and the only thing on the screen that brings the wire closer is the
 * phone call. The three lanes are unordered, so that claim lives in the beat
 * for the state where none of them has been recorded.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { STEMI as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/stemi';
import { STEMI_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/stemi-fixtures';
import {
  STEMI_DEMONSTRATION_VERSION, stemiDemonstrationStep, supportsStemiDemonstration,
} from '../../src/modules/emergency-medicine/demo/stemi-demonstration';
import { stemiInlinePrompt } from '../../src/modules/emergency-medicine/tutor/stemi-guidance';
import type { StemiAction } from '../../src/modules/emergency-medicine/stemi';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.stemiAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: StemiAction) => {
  engine.apply({ tick, type: 'stemi-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = stemiDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'stemi-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Makes The Call First', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(STEMI_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsStemiDemonstration(SCENARIO)).toBe(true);
    expect(supportsStemiDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsStemiDemonstration({ ...SCENARIO, timeline: [] })).toBe(false);
  });

  it('takes all five recorded steps with the pathway first among the three lanes', () => {
    expect(beats).toEqual(['pattern', 'pathway', 'aspirin', 'antithrombotics', 'handoff']);
    expect(patient.patternReviewedAtTick).toBeLessThan(patient.pathwayActivatedAtTick!);
    expect(patient.pathwayActivatedAtTick).toBeLessThan(patient.aspirinAtTick!);
    expect(patient.additionalAntithromboticsAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('says the bedside monitor is not the diagnostic tracing', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('a monitor lead is for rhythm');
    expect(pattern).toContain('safe rather than catastrophic');
  });

  it('carries the load-bearing claim on the path the example actually takes', () => {
    // The three lanes are unordered, so the per-lane pathway beat is never
    // reached here. The claim has to survive on the "none of the three" beat.
    expect(beats).not.toContain('stemi-pathway');
    expect(everything).toContain('Only one of them opens the artery');
    expect(everything).toContain('a wire does');
    expect(everything).toContain('which is exactly why the call is the one that gets made third');
    expect(everything).toContain('the necrosis has not had time to be measurable');
  });

  it('says why aspirin is chewed', () => {
    const aspirin = narrations[beats.indexOf('aspirin')]!;
    expect(aspirin).toContain('Chewed matters');
    expect(aspirin).toContain('the whole point of a loading dose is speed');
  });

  it('pairs the P2Y12 and the anticoagulant to the pathway rather than the diagnosis', () => {
    const antithrombotics = narrations[beats.indexOf('antithrombotics')]!;
    expect(antithrombotics).toContain('belong to the primary-PCI pathway rather than to the diagnosis on its own');
    expect(antithrombotics).toContain('This records intents, not a prescription');
  });

  it('treats the absent oxygen mask as a deliberate choice', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('a deliberate choice rather than an omission');
    expect(handoff).toContain('larger infarcts rather than smaller ones');
    expect(narration).toContain('The oxygen mask stayed off');
  });

  it('never waits for a troponin, names an agent or dose, or claims reperfusion', () => {
    // Guard the instruction voice, not the nouns: the lesson names the troponin
    // and the oxygen precisely in order to argue about them, so a bare noun
    // match would fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['wait for the troponin', 'send a troponin first',
      'give ticagrelor 180', 'start heparin at', 'put him on 15 litres',
      'we have reperfused him', 'reperfusion achieved']) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds The Gate And The Clock', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = stemiInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['stemi-pattern', 'stemi-initial', 'stemi-aspirin',
      'stemi-antithrombotics', 'stemi-handoff']);
  });

  it('reaches the per-lane pathway beat only when a learner gives the drugs first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-stemi-pattern');
    advance(engine, 1, 'record-aspirin-load');
    const prompt = stemiInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('stemi-pathway');
    expect(prompt.because).toContain('measured from when they were told');
  });

  it('stays on the handoff while the engine clock has not moved on', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-stemi-pattern');
    advance(engine, 1, 'activate-stemi-pathway');
    advance(engine, 2, 'record-aspirin-load');
    engine.apply({ tick: 3, type: 'stemi-response', payload: { action: 'record-p2y12-anticoagulation-intent' } });
    engine.apply({ tick: 3, type: 'stemi-response', payload: { action: 'reassess-and-handoff' } });
    engine.step();
    expect(snapshot(engine)!.reassessedAtTick).toBeNull();
    expect(stemiInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('stemi-handoff');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'activate-stemi-pathway');
    expect(snapshot(engine)!.pathwayActivatedAtTick).toBeNull();
    expect(stemiInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('stemi-pattern');
  });

  it('never waits for a troponin or names an agent anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = stemiInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['wait for the troponin', 'give ticagrelor 180', 'put him on 15 litres']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(stemiInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(stemiInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(stemiInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(stemiInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(stemiInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
