/**
 * The worked example and observed-state tutor for the right answer reached the
 * long way round.
 *
 * The reflex is not the wrong decision but arriving at the right one without
 * looking — and its opposite, renting time from noninvasive support in a
 * failing airway.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { UNPLANNED_EXTUBATION as SCENARIO } from '../../src/modules/critical-care/scenarios/unplanned-extubation';
import { UNPLANNED_EXTUBATION_FIXTURES as FIXTURES } from '../../src/modules/critical-care/unplanned-extubation-fixtures';
import {
  UNPLANNED_EXTUBATION_DEMONSTRATION_VERSION, unplannedExtubationDemonstrationStep,
  supportsUnplannedExtubationDemonstration,
} from '../../src/modules/critical-care/demo/unplanned-extubation-demonstration';
import { unplannedExtubationInlinePrompt } from '../../src/modules/critical-care/tutor/unplanned-extubation-guidance';
import type { UnplannedExtubationAction } from '../../src/modules/critical-care/unplanned-extubation';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.unplannedExtubationAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: UnplannedExtubationAction) => {
  engine.apply({ tick, type: 'unplanned-extubation-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = unplannedExtubationDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'unplanned-extubation-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Establishes The Answer Rather Than Assuming It', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(UNPLANNED_EXTUBATION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsUnplannedExtubationDemonstration(SCENARIO)).toBe(true);
    expect(supportsUnplannedExtubationDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsUnplannedExtubationDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'unplanned-extubation-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['support', 'assess', 'classify', 'plan', 'reassess']);
    expect(patient.supportAtTick).toBeLessThan(patient.assessmentAtTick!);
    expect(patient.assessmentAtTick).toBeLessThan(patient.failureAtTick!);
    expect(patient.failureAtTick).toBeLessThan(patient.airwayPlanAtTick!);
    expect(patient.airwayPlanAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('treats announcing the event as a step and names what was lost with the tube', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('a step rather than a courtesy');
    expect(support).toContain('cannot infer it from an alarm');
    expect(support).toContain('no continuous exhaled carbon dioxide without one');
  });

  it('defends the assessment step against the reflex that would skip it', () => {
    const assess = narrations[beats.indexOf('assess')]!;
    expect(assess).toContain('This is the step worth defending');
    expect(assess).toContain('will also reintubate the ones who would have been fine');
    expect(assess).toContain('an answer rather than an assumption');
  });

  it('counts the converging axes and makes the trajectory decisive', () => {
    const classify = narrations[beats.indexOf('classify')]!;
    expect(classify).toContain('Four separate axes converge');
    expect(classify).toContain('none of this is improving');
    expect(classify).toContain('a decision rather than a panic');
  });

  it('refuses noninvasive support here without dismissing it generally', () => {
    const plan = narrations[beats.indexOf('plan')]!;
    expect(plan).toContain('the time it buys is taken from the intubation that is going to happen anyway');
    expect(plan).toContain('different from noninvasive support having no place');
  });

  it('puts placement evidence first and keeps the prevention review', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('reported rather than assumed');
    expect(reassess).toContain('a correctly placed tube in a patient who is not improving is still a problem');
    expect(narration).toContain('most unplanned extubations do not end here');
  });

  it('never intubates, names a drug or a blade, or dismisses noninvasive support', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give ketamine', 'give rocuronium', 'use a size 3 mac',
      'intubate him now yourself', 'noninvasive support is never appropriate']) {
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
      const prompt = unplannedExtubationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['uex-support', 'uex-assess', 'uex-classify', 'uex-plan', 'uex-reassess']);
  });

  it('stays on the tolerance panel when the airway plan is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'support-unplanned-extubation-and-call-help');
    advance(engine, 1, 'record-unplanned-extubation-airway-plan');
    expect(snapshot(engine)!.airwayPlanAtTick).toBeNull();
    const prompt = unplannedExtubationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('uex-assess');
    expect(prompt.suggestion).toContain('not every unplanned extubation needs the tube back');
  });

  it('stays on the classification when the plan is reached for after the panel', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'support-unplanned-extubation-and-call-help');
    advance(engine, 1, 'assess-unplanned-extubation-tolerance');
    advance(engine, 2, 'record-unplanned-extubation-airway-plan');
    expect(snapshot(engine)!.airwayPlanAtTick).toBeNull();
    expect(unplannedExtubationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('uex-classify');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'assess-unplanned-extubation-tolerance');
    expect(snapshot(engine)!.assessmentAtTick).toBeNull();
    expect(unplannedExtubationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('uex-support');
  });

  it('never intubates or names a drug', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = unplannedExtubationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['give ketamine', 'give rocuronium', 'intubate him now yourself']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(unplannedExtubationInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(unplannedExtubationInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(unplannedExtubationInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(unplannedExtubationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(unplannedExtubationInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
