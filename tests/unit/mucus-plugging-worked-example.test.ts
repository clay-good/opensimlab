/**
 * The worked example and observed-state tutor for a treatment that works and
 * does not work.
 *
 * Two reflexes: visible secretion making the obvious answer obviously right,
 * and a partial response being the most persuasive reason to stop looking.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { MUCUS_PLUGGING as SCENARIO } from '../../src/modules/critical-care/scenarios/mucus-plugging';
import { MUCUS_PLUGGING_FIXTURES as FIXTURES } from '../../src/modules/critical-care/mucus-plugging-fixtures';
import {
  MUCUS_PLUGGING_DEMONSTRATION_VERSION, mucusPluggingDemonstrationStep, supportsMucusPluggingDemonstration,
} from '../../src/modules/critical-care/demo/mucus-plugging-demonstration';
import { mucusPluggingInlinePrompt } from '../../src/modules/critical-care/tutor/mucus-plugging-guidance';
import type { MucusPluggingAction } from '../../src/modules/critical-care/mucus-plugging';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.mucusPluggingAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: MucusPluggingAction) => {
  engine.apply({ tick, type: 'mucus-plugging-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = mucusPluggingDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'mucus-plugging-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Stop When The Suction Works', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(MUCUS_PLUGGING_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMucusPluggingDemonstration(SCENARIO)).toBe(true);
    expect(supportsMucusPluggingDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsMucusPluggingDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'mucus-plugging-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['support', 'indicators', 'suction', 'reassess', 'escalate']);
    expect(patient.supportAtTick).toBeLessThan(patient.indicatorsAtTick!);
    expect(patient.indicatorsAtTick).toBeLessThan(patient.suctionAtTick!);
    expect(patient.suctionAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.escalationAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('justifies treatment before assessment in one line', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('oxygen does not require a diagnosis');
    expect(support).toContain('calling them while you look is free');
  });

  it('calls the visible secretion the most persuasive and least specific finding', () => {
    const indicators = narrations[beats.indexOf('indicators')]!;
    expect(indicators).toContain('the most persuasive item here and the least specific');
    expect(indicators).toContain('have been looked at rather than assumed');
  });

  it('holds the three suction boundaries', () => {
    const suction = narrations[beats.indexOf('suction')]!;
    expect(suction).toContain('As-needed rather than scheduled');
    expect(suction).toContain('the procedure itself desaturates people');
    expect(suction).toContain('a habit rather than a treatment');
  });

  it('names the partial response as the reason it is easy to stop', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('the most important sentence in this lesson');
    expect(reassess).toContain('makes it easy to stop');
    expect(reassess).toContain('never going to be a central plug');
  });

  it('escalates the finding that survived the treatment, list still open', () => {
    const escalate = narrations[beats.indexOf('escalate')]!;
    expect(escalate).toContain('survived the treatment for the diagnosis you assumed');
    expect(escalate).toContain('Routine bronchoscopy is not the default');
    expect(narration).toContain('the reason to keep looking is precisely that the suction worked');
  });

  it('never suctions, instils saline, names a catheter, or diagnoses the left base', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['pass a 14 french', 'instil 5 ml of saline', 'this is left lower lobe collapse',
      'perform bronchoscopy now', 'suction him for ten seconds']) {
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
      const prompt = mucusPluggingInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['mpl-support', 'mpl-indicators', 'mpl-suction', 'mpl-reassess', 'mpl-escalate']);
  });

  it('stays on the indicators when suction is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'support-mucus-plugging-and-call-help');
    advance(engine, 1, 'record-indicated-airway-suction-intent');
    expect(snapshot(engine)!.suctionAtTick).toBeNull();
    const prompt = mucusPluggingInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('mpl-indicators');
    expect(prompt.suggestion).toContain('notice none of them is proof');
  });

  it('stays on the reassessment when the escalation is reached for first', () => {
    const engine = create(); engine.step();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    advance(engine, 3, 'escalate-persistent-mucus-plugging');
    expect(snapshot(engine)!.escalationAtTick).toBeNull();
    expect(mucusPluggingInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('mpl-reassess');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-mucus-plugging-indicators');
    expect(snapshot(engine)!.indicatorsAtTick).toBeNull();
    expect(mucusPluggingInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('mpl-support');
  });

  it('never suctions, instils saline, or diagnoses the left base', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = mucusPluggingInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['pass a 14 french', 'instil 5 ml of saline', 'this is left lower lobe collapse']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the escalation', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(mucusPluggingInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(mucusPluggingInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(mucusPluggingInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.escalationAtTick).not.toBeNull();
    expect(mucusPluggingInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(mucusPluggingInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
