/**
 * The worked example and observed-state tutor for a breath that looked modest
 * against the wrong weight.
 *
 * Lung size tracks height. Against 92 kg a 500 mL breath looks careful; against
 * the 61.5 kg her 170 cm predicts it is 8.1 mL/kg.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ARDS_LUNG_PROTECTIVE_VENTILATION as SCENARIO } from '../../src/modules/critical-care/scenarios/ards-lung-protective-ventilation';
import { ARDS_LUNG_PROTECTIVE_FIXTURES as FIXTURES } from '../../src/modules/critical-care/ards-lung-protective-fixtures';
import {
  ARDS_LUNG_PROTECTIVE_DEMONSTRATION_VERSION, ardsLungProtectiveDemonstrationStep,
  supportsArdsLungProtectiveDemonstration,
} from '../../src/modules/critical-care/demo/ards-lung-protective-demonstration';
import { ardsLungProtectiveInlinePrompt } from '../../src/modules/critical-care/tutor/ards-lung-protective-guidance';
import type { ArdsLungProtectiveAction } from '../../src/modules/critical-care/ards-lung-protective';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.ardsLungProtectiveAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: ArdsLungProtectiveAction) => {
  engine.apply({ tick, type: 'ards-lung-protective-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = ardsLungProtectiveDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'ards-lung-protective-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Sizes The Breath To The Lung', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(ARDS_LUNG_PROTECTIVE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsArdsLungProtectiveDemonstration(SCENARIO)).toBe(true);
    expect(supportsArdsLungProtectiveDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsArdsLungProtectiveDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'ards-lung-protective-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['baseline', 'pbw', 'protect', 'reassess', 'escalate']);
    expect(patient.baselineAtTick).toBeLessThan(patient.pbwAtTick!);
    expect(patient.pbwAtTick).toBeLessThan(patient.protectionAtTick!);
    expect(patient.protectionAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.escalationAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('explains what a plateau of 32 actually is', () => {
    const baseline = narrations[beats.indexOf('baseline')]!;
    expect(baseline).toContain('the pressure the alveoli actually see at the end of a breath');
    expect(baseline).toContain('the oxygen is going in and not arriving');
  });

  it('makes height the number that matters and says why the order is the mistake', () => {
    const pbw = narrations[beats.indexOf('pbw')]!;
    expect(pbw).toContain('fat does not add alveoli');
    expect(pbw).toContain('the basis becomes a justification');
  });

  it('insists on both halves and explains the delegated rate', () => {
    const protect = narrations[beats.indexOf('protect')]!;
    expect(protect).toContain('volume alone is not protection');
    expect(protect).toContain('has to go somewhere');
  });

  it('names the trade and refuses to undo it', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('the injury you removed');
    expect(reassess).toContain('trades a number you can see for lung injury you cannot');
  });

  it('keeps the escalation about oxygenation and prices the PEEP', () => {
    const escalate = narrations[beats.indexOf('escalate')]!;
    expect(escalate).toContain('rather than about undoing the protection');
    expect(escalate).toContain('more PEEP is not free');
    expect(narration).toContain('One number ran this example and it was her height');
  });

  it('never programs the ventilator, sets a PEEP, paralyses, or claims improvement', () => {
    // Guard the instruction voice, not the nouns: the closing beat exists to say she
    // is still hypoxaemic, so a bare noun match would fail on the lesson's own point.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['set the peep to 14', 'dial the rate to 30', 'start a paralytic',
      'turn her prone yourself', 'the ards is improving', 'her lung is recovering']) {
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
      const prompt = ardsLungProtectiveInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['ards-baseline', 'ards-pbw', 'ards-protect', 'ards-reassess', 'ards-escalate']);
  });

  it('stays on the predicted body weight when the settings are reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-ards-baseline');
    advance(engine, 1, 'record-ards-protective-settings');
    expect(snapshot(engine)!.protectionAtTick).toBeNull();
    const prompt = ardsLungProtectiveInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ards-pbw');
    expect(prompt.suggestion).toContain('work out whose lung you are ventilating');
  });

  it('stays on the reassessment when the escalation is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-ards-baseline');
    advance(engine, 1, 'calculate-ards-pbw');
    advance(engine, 2, 'record-ards-protective-settings');
    advance(engine, 3, 'record-ards-peep-prone-escalation');
    expect(snapshot(engine)!.escalationAtTick).toBeNull();
    expect(ardsLungProtectiveInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ards-reassess');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'calculate-ards-pbw');
    expect(snapshot(engine)!.pbwAtTick).toBeNull();
    expect(ardsLungProtectiveInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ards-baseline');
  });

  it('never sets a PEEP or a rate anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = ardsLungProtectiveInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['set the peep to 14', 'dial the rate to 30', 'start a paralytic']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the escalation', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(ardsLungProtectiveInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(ardsLungProtectiveInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(ardsLungProtectiveInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.escalationAtTick).not.toBeNull();
    expect(ardsLungProtectiveInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(ardsLungProtectiveInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
