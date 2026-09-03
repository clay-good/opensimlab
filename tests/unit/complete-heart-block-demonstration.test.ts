/**
 * The worked example and observed-state tutor for a patient who looks well
 * because of the rhythm that might stop.
 *
 * The reflex both work against is stability. The module's own bradycardia
 * lesson rewards exactly the observation that a well-looking patient can be
 * evaluated as an outpatient; here the same observation is a reason to move
 * faster.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { COMPLETE_HEART_BLOCK as SCENARIO } from '../../src/modules/cardiology/scenarios/complete-heart-block';
import { COMPLETE_HEART_BLOCK_FIXTURES as FIXTURES } from '../../src/modules/cardiology/complete-heart-block-fixtures';
import {
  COMPLETE_HEART_BLOCK_DEMONSTRATION_VERSION, completeHeartBlockDemonstrationStep,
  supportsCompleteHeartBlockDemonstration,
} from '../../src/modules/cardiology/demo/complete-heart-block-demonstration';
import { completeHeartBlockInlinePrompt } from '../../src/modules/cardiology/tutor/complete-heart-block-guidance';
import type { CompleteHeartBlockAction } from '../../src/modules/cardiology/complete-heart-block';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.completeHeartBlockAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: CompleteHeartBlockAction) => {
  engine.apply({ tick, type: 'complete-heart-block-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = completeHeartBlockDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'complete-heart-block-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Escalates Before It Explains', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(COMPLETE_HEART_BLOCK_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCompleteHeartBlockDemonstration(SCENARIO)).toBe(true);
    expect(supportsCompleteHeartBlockDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCompleteHeartBlockDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'rhythm-change'),
    })).toBe(false);
  });

  it('takes all five recorded steps, escalating before the cause review', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['stability', 'parallel', 'context', 'reassessment', 'handoff']);
    expect(patient.stabilityAtTick).toBeLessThan(patient.pathwayAtTick!);
    expect(patient.pathwayAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('separates complete block from a slow sinus rhythm at the opening beat', () => {
    const stability = narrations[beats.indexOf('stability')]!;
    expect(stability).toContain('That is not a slow sinus rhythm');
    expect(stability).toContain('what is keeping her perfused is an escape rhythm');
    expect(stability).toContain('Recording that is not the same as calling the block low risk');
  });

  it('says the two lanes do not queue', () => {
    const parallel = narrations[beats.indexOf('parallel')]!;
    expect(parallel).toContain('Two things need doing and they do not queue');
    expect(parallel).toContain('the escalation is not a reward for finishing the workup');
  });

  it('treats an unremarkable panel as the trap it is', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('the mistake available here is to read it as an answer');
    expect(context).toContain('Lyme disease');
    expect(context).toContain('The panel did not prove absence');
  });

  it('says why an uneventful hour is dangerous rather than reassuring', () => {
    const reassessment = narrations[beats.indexOf('reassessment')]!;
    expect(reassessment).toContain('most likely to talk a team out of the urgency it correctly felt');
    expect(reassessment).toContain('persistence, not resolution');
    expect(patient.pacingDelivered).toBe(false);
    expect(patient.captureAssessed).toBe(false);
  });

  it('hands off an evaluation and reaches no conclusion', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('no eligibility adjudication, no device, no mode, no lead');
    expect(narration).toContain('no cause found and nothing paced');
    expect(narration).toContain('Stability was never the reassuring part.');
  });

  it('never paces, names a device, claims capture, or declares a cause', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['pace her at 70', 'implant a dual-chamber', 'we have capture',
      'this is lyme disease', 'give atropine', 'start an isoprenaline infusion']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Follows Whichever Lane Is Open', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = completeHeartBlockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['chb-stability', 'chb-parallel', 'chb-context', 'chb-reassessment', 'chb-handoff']);
  });

  it('names the escalation when the cause was reviewed first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-complete-heart-block-stability');
    advance(engine, 1, 'review-complete-heart-block-context');
    const prompt = completeHeartBlockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('chb-pathway');
    expect(prompt.suggestion).toContain('Do not let that hold up the escalation');
  });

  it('holds on the open lane when the reassessment is attempted with one done', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-complete-heart-block-stability');
    advance(engine, 1, 'review-complete-heart-block-context');
    advance(engine, 2, 'reassess-complete-heart-block-trajectory');
    expect(snapshot(engine)!.reassessmentAtTick).toBeNull();
    expect(completeHeartBlockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('chb-pathway');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-complete-heart-block-context');
    expect(snapshot(engine)!.contextAtTick).toBeNull();
    expect(completeHeartBlockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('chb-stability');
  });

  it('never paces, names a device, or claims capture', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = completeHeartBlockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['pace her at 70', 'implant a dual-chamber', 'we have capture', 'give atropine']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(completeHeartBlockInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(completeHeartBlockInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(completeHeartBlockInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(completeHeartBlockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(completeHeartBlockInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
