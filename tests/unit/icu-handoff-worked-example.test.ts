/**
 * The worked example and observed-state tutor for a sentence the numbers
 * contradict.
 *
 * "Stable septic shock on low-dose support" was true when someone last said it.
 * A conclusion is the part of a handover nobody re-derives.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ICU_HANDOFF_WITH_HIDDEN_DETERIORATION as SCENARIO } from '../../src/modules/critical-care/scenarios/icu-handoff-with-hidden-deterioration';
import { ICU_HANDOFF_FIXTURES as FIXTURES } from '../../src/modules/critical-care/icu-handoff-fixtures';
import {
  ICU_HANDOFF_DEMONSTRATION_VERSION, icuHandoffDemonstrationStep,
  supportsIcuHandoffDemonstration,
} from '../../src/modules/critical-care/demo/icu-handoff-demonstration';
import { icuHandoffInlinePrompt } from '../../src/modules/critical-care/tutor/icu-handoff-guidance';
import type { IcuHandoffAction } from '../../src/modules/critical-care/icu-handoff';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.icuHiddenDeteriorationHandoffAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: IcuHandoffAction) => {
  engine.apply({ tick, type: 'icu-hidden-deterioration-handoff-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = icuHandoffDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'icu-hidden-deterioration-handoff-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Refuses To Inherit A Conclusion', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(ICU_HANDOFF_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsIcuHandoffDemonstration(SCENARIO)).toBe(true);
    expect(supportsIcuHandoffDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsIcuHandoffDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'icu-handoff-with-hidden-deterioration-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['readiness', 'content', 'crosscheck', 'escalate', 'accept']);
    expect(patient.readinessAtTick).toBeLessThan(patient.contentAtTick!);
    expect(patient.contentAtTick).toBeLessThan(patient.crossCheckAtTick!);
    expect(patient.crossCheckAtTick).toBeLessThan(patient.escalationAtTick!);
    expect(patient.escalationAtTick).toBeLessThan(patient.acceptanceAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('says why the least interesting step is first', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('is where the sentence you are about to be told stops being examined');
    expect(readiness).toContain('pretending otherwise would be the wrong lesson');
  });

  it('frames the handover as claims without blaming the outgoing clinician', () => {
    const content = narrations[beats.indexOf('content')]!;
    expect(content).toContain('you cannot cross-check what you did not hear');
    expect(content).toContain('a trend is invisible from the inside');
  });

  it('reads the pressure and the EtCO2 the hard way', () => {
    const crosscheck = narrations[beats.indexOf('crosscheck')]!;
    expect(crosscheck).toContain('is worse than a pressure that fell, because the number was held up');
    expect(crosscheck).toContain('cardiac output leaving, not a lung problem');
    expect(crosscheck).toContain('looks exactly like a vasopressor that is not working');
  });

  it('puts names on the tasks', () => {
    const escalate = narrations[beats.indexOf('escalate')]!;
    expect(escalate).toContain("other people's knowledge rather than yours");
    expect(escalate).toContain('Unowned tasks at shift change are the ones that do not happen');
  });

  it('is careful about what the bridge proved', () => {
    const accept = narrations[beats.indexOf('accept')]!;
    expect(accept).toContain('accepting a patient you have not summarised is how a handover becomes a formality');
    expect(narration).toContain('refuse to inherit a conclusion');
  });

  it('never titrates, orders, blames, or claims the shock is controlled', () => {
    // Guard the instruction voice, not the nouns: the closing beat exists to say the
    // bridge proved little, so a bare noun match would fail on the lesson's point.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['increase the noradrenaline to', 'give a 500 ml bolus',
      'the outgoing team was negligent', 'the shock is under control', 'the source is controlled']) {
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
      const prompt = icuHandoffInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['ich-readiness', 'ich-content', 'ich-crosscheck', 'ich-escalate', 'ich-accept']);
  });

  it('stays on the cross-check when escalation is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'establish-icu-handoff-readiness');
    advance(engine, 1, 'receive-icu-handoff-content');
    advance(engine, 2, 'escalate-icu-handoff-deterioration');
    expect(snapshot(engine)!.escalationAtTick).toBeNull();
    const prompt = icuHandoffInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ich-crosscheck');
    expect(prompt.suggestion).toContain('They disagree');
  });

  it('stays on the content when the cross-check is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'establish-icu-handoff-readiness');
    advance(engine, 1, 'cross-check-hidden-deterioration');
    expect(snapshot(engine)!.crossCheckAtTick).toBeNull();
    expect(icuHandoffInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ich-content');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'receive-icu-handoff-content');
    expect(snapshot(engine)!.contentAtTick).toBeNull();
    expect(icuHandoffInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ich-readiness');
  });

  it('never titrates or orders anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = icuHandoffInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['increase the noradrenaline to', 'give a 500 ml bolus', 'the outgoing team was negligent']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after acceptance', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(icuHandoffInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(icuHandoffInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(icuHandoffInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.acceptanceAtTick).not.toBeNull();
    expect(icuHandoffInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(icuHandoffInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
