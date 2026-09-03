/**
 * The worked example and observed-state tutor for a desaturation a sick lung
 * would explain.
 *
 * The reflex both work against is the assumption: a man with bilateral opacities
 * who drops after a turn will be assumed to have worsened, and several fixable
 * equipment causes give the same number on the same screen.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ESCALATING_HYPOXEMIA as SCENARIO } from '../../src/modules/critical-care/scenarios/escalating-hypoxemia';
import { ESCALATING_HYPOXEMIA_FIXTURES as FIXTURES } from '../../src/modules/critical-care/escalating-hypoxemia-fixtures';
import {
  ESCALATING_HYPOXEMIA_DEMONSTRATION_VERSION, escalatingHypoxemiaDemonstrationStep,
  supportsEscalatingHypoxemiaDemonstration,
} from '../../src/modules/critical-care/demo/escalating-hypoxemia-demonstration';
import { escalatingHypoxemiaInlinePrompt } from '../../src/modules/critical-care/tutor/escalating-hypoxemia-guidance';
import type { EscalatingHypoxemiaAction } from '../../src/modules/critical-care/escalating-hypoxemia';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.escalatingHypoxemiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: EscalatingHypoxemiaAction) => {
  engine.apply({ tick, type: 'escalating-hypoxemia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = escalatingHypoxemiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'escalating-hypoxemia-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Traces The Path Before Blaming The Lung', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(ESCALATING_HYPOXEMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsEscalatingHypoxemiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsEscalatingHypoxemiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsEscalatingHypoxemiaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'escalating-hypoxemia-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['signal', 'support', 'path', 'pattern', 'escalate']);
    expect(patient.signalAtTick).toBeLessThan(patient.supportAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.deliveryPathAtTick!);
    expect(patient.deliveryPathAtTick).toBeLessThan(patient.bedsidePatternAtTick!);
    expect(patient.bedsidePatternAtTick).toBeLessThan(patient.escalationAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('holds urgency and verification together rather than in tension', () => {
    const signal = narrations[beats.indexOf('signal')]!;
    expect(signal).toContain('Both, in that order');
    expect(signal).toContain('an independent measurement agreeing with the monitor');
    expect(signal).toContain('how a team ends up treating a probe');
  });

  it('says support and cause do not compete', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('those two facts do not compete');
    expect(support).toContain('he does not have a reserve to spend on them');
  });

  it('gives the direction of the trace and the reason for it', () => {
    const path = narrations[beats.indexOf('path')]!;
    expect(path).toContain('outside-in, in order');
    expect(path).toContain('the ones a sick-lung story makes invisible');
    expect(path).toContain('during the turn he just had');
  });

  it('marks the parenchymal conclusion as what remains rather than what was assumed', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('rather than what was assumed at the start');
    expect(pattern).toContain('It also does not exclude anything');
  });

  it('keeps the support protocolized at the moment somebody would improvise', () => {
    const escalate = narrations[beats.indexOf('escalate')]!;
    expect(escalate).toContain('invites somebody to reach for a setting');
    expect(narration).toContain('a finding rather than a formality');
    expect(narration).toContain('the turn is exactly why the tube depth was worth checking');
  });

  it('never names a PEEP or FiO2 setting, prones, recruits, or diagnoses the parenchyma', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['increase peep to 14', 'turn the fio2 up to 1.0', 'prone him',
      'perform a recruitment manoeuvre', 'this is ards progressing']) {
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
      const prompt = escalatingHypoxemiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['ehx-signal', 'ehx-support', 'ehx-path', 'ehx-pattern', 'ehx-escalate']);
  });

  it('stays on the delivery path when the chest is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'validate-hypoxemia-signal');
    advance(engine, 1, 'support-hypoxemia-and-call-help');
    advance(engine, 2, 'integrate-hypoxemia-bedside-pattern');
    expect(snapshot(engine)!.bedsidePatternAtTick).toBeNull();
    const prompt = escalatingHypoxemiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ehx-path');
    expect(prompt.suggestion).toContain('before you look at the lungs');
  });

  it('stays on support when the path is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'validate-hypoxemia-signal');
    advance(engine, 1, 'trace-hypoxemia-delivery-path');
    expect(snapshot(engine)!.deliveryPathAtTick).toBeNull();
    expect(escalatingHypoxemiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ehx-support');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'support-hypoxemia-and-call-help');
    expect(snapshot(engine)!.supportAtTick).toBeNull();
    expect(escalatingHypoxemiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ehx-signal');
  });

  it('never names a setting, prones, or diagnoses the parenchyma', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = escalatingHypoxemiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['increase peep to 14', 'prone him', 'this is ards progressing']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the escalation', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(escalatingHypoxemiaInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(escalatingHypoxemiaInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(escalatingHypoxemiaInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.escalationAtTick).not.toBeNull();
    expect(escalatingHypoxemiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(escalatingHypoxemiaInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
