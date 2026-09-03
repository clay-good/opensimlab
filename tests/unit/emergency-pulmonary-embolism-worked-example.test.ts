/**
 * The worked example and observed-state tutor for a category that turned out to
 * be a snapshot.
 *
 * The patient is normotensive when the example starts and in cardiogenic shock
 * when it ends, while everything recorded in between is correct. The two
 * initial intents are unordered, so the claim about not intubating lives in the
 * beat for the state where neither has been recorded.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PULMONARY_EMBOLISM_DETERIORATION as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/pulmonary-embolism-deterioration';
import { PULMONARY_EMBOLISM_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/pulmonary-embolism-deterioration-fixtures';
import {
  PULMONARY_EMBOLISM_DEMONSTRATION_VERSION, pulmonaryEmbolismDemonstrationStep,
  supportsPulmonaryEmbolismDemonstration,
} from '../../src/modules/emergency-medicine/demo/pulmonary-embolism-deterioration-demonstration';
import { pulmonaryEmbolismInlinePrompt } from '../../src/modules/emergency-medicine/tutor/pulmonary-embolism-deterioration-guidance';
import type { PulmonaryEmbolismAction } from '../../src/modules/emergency-medicine/pulmonary-embolism-deterioration';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pulmonaryEmbolismAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PulmonaryEmbolismAction) => {
  engine.apply({ tick, type: 'pulmonary-embolism-deterioration-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pulmonaryEmbolismDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pulmonary-embolism-deterioration-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Watches A Compensating Patient Stop Compensating', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(PULMONARY_EMBOLISM_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPulmonaryEmbolismDemonstration(SCENARIO)).toBe(true);
    expect(supportsPulmonaryEmbolismDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPulmonaryEmbolismDemonstration({ ...SCENARIO, timeline: [] })).toBe(false);
  });

  it('takes all five recorded steps without a refusal', () => {
    expect(beats).toEqual(['severity', 'oxygen', 'anticoagulation', 'reassess', 'escalation']);
    expect(patient.severityReviewedAtTick).toBeLessThan(patient.oxygenAtTick!);
    expect(patient.anticoagulationAtTick).toBeLessThan(patient.deteriorationAtTick!);
    expect(patient.deteriorationAtTick).toBeLessThan(patient.escalationAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('reads a normal pressure as compensation rather than health', () => {
    const severity = narrations[beats.indexOf('severity')]!;
    expect(severity).toContain('he is still compensating');
    expect(severity).toContain('a different and much more temporary statement');
  });

  it('carries the intubation claim on the path the example actually takes', () => {
    // The two intents are unordered, so the per-lane oxygen beat is never
    // reached here. The claim has to survive on the "neither yet" beat.
    expect(beats).not.toContain('pe-oxygen');
    expect(everything).toContain('the important part of the oxygen decision is what it rules out');
    expect(everything).toContain('can convert a compensating circulation into an arrest in under a minute');
    expect(everything).toContain('the airway intervention is the more dangerous choice');
  });

  it('separates stopping propagation from removing what is already there', () => {
    const anticoagulation = narrations[beats.indexOf('anticoagulation')]!;
    expect(anticoagulation).toContain('an interval in which more clot forms on the existing one');
    expect(anticoagulation).toContain('recording one does not commit you to the other');
  });

  it('names the trap in miniature at the reassessment', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('a serial finding needs two moments to exist');
    expect(reassess).toContain('the number you were watching got better and the patient got worse');
    expect(reassess).toContain('the observation is part of the treatment');
  });

  it('treats not choosing a reperfusion method as the point', () => {
    const escalation = narrations[beats.indexOf('escalation')]!;
    expect(escalation).toContain('The deliberate omission is which reperfusion');
    expect(escalation).toContain('usually in the assembling rather than in the procedure');
    expect(narration).toContain('no reperfusion method was preferred over another');
  });

  it('never intubates, names an agent or dose, or picks a reperfusion modality', () => {
    // Guard the instruction voice, not the nouns: the lesson names intubation
    // and every reperfusion modality precisely in order to bound them, so a
    // bare noun match would fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['intubate him now', 'induce and intubate',
      'start heparin at', 'give alteplase', 'send him for thrombectomy',
      'the embolism is treated', 'he is stable now']) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds The Gates', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = pulmonaryEmbolismInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['pe-severity', 'pe-initial', 'pe-anticoagulation', 'pe-reassess', 'pe-escalation']);
  });

  it('reaches the per-lane oxygen beat only when a learner anticoagulates first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-confirmed-pe-severity');
    advance(engine, 1, 'record-therapeutic-anticoagulation-intent');
    const prompt = pulmonaryEmbolismInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pe-oxygen');
    expect(prompt.because).toContain('not a reflex response to a saturation of 90%');
  });

  it('stays on the reassessment when the escalation is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-confirmed-pe-severity');
    advance(engine, 1, 'record-titrated-oxygen');
    advance(engine, 2, 'record-therapeutic-anticoagulation-intent');
    advance(engine, 3, 'activate-pert-and-record-reperfusion-intent');
    expect(snapshot(engine)!.escalationAtTick).toBeNull();
    expect(pulmonaryEmbolismInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pe-reassess');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'record-titrated-oxygen');
    expect(snapshot(engine)!.oxygenAtTick).toBeNull();
    expect(pulmonaryEmbolismInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pe-severity');
  });

  it('never intubates or names an agent anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pulmonaryEmbolismInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['intubate him now', 'start heparin at', 'give alteplase']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the escalation', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pulmonaryEmbolismInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pulmonaryEmbolismInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pulmonaryEmbolismInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.escalationAtTick).not.toBeNull();
    expect(pulmonaryEmbolismInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pulmonaryEmbolismInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
