/**
 * The worked example and observed-state tutor for a bundle that is not a queue.
 *
 * Source control is gated by the first review alone. A run that completes every
 * enforced chain faultlessly and never escalates the obstructed source is
 * refused by nothing — which is exactly the trap the lesson exists for.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SEPTIC_SHOCK as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/septic-shock';
import { SEPTIC_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/septic-shock-fixtures';
import {
  SEPTIC_SHOCK_DEMONSTRATION_VERSION, septicShockDemonstrationStep,
  supportsSepticShockDemonstration,
} from '../../src/modules/emergency-medicine/demo/septic-shock-demonstration';
import { septicShockInlinePrompt } from '../../src/modules/emergency-medicine/tutor/septic-shock-guidance';
import type { SepticShockAction } from '../../src/modules/emergency-medicine/septic-shock';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.septicShockAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: SepticShockAction) => {
  engine.apply({ tick, type: 'septic-shock-assessment', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  // The sepsis pattern is not active before the first step, like every
  // reference transcript, so the example begins at tick 1.
  engine.step();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 1; tick <= limit; tick += 1) {
    const step = septicShockDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'septic-shock-assessment', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Ends On The Step Nothing Gated', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(SEPTIC_SHOCK_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsSepticShockDemonstration(SCENARIO)).toBe(true);
    expect(supportsSepticShockDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsSepticShockDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'sepsis-pattern'),
    })).toBe(false);
  });

  it('takes all seven recorded steps without a refusal', () => {
    expect(beats).toEqual(['review', 'cultures', 'antimicrobial', 'fluid', 'reassess', 'norepinephrine', 'source']);
    expect(patient.culturesAndLactateAtTick).toBeLessThan(patient.antimicrobialIntentAtTick!);
    expect(patient.initialCrystalloidAtTick).toBeLessThan(patient.postFluidReassessmentAtTick!);
    expect(patient.postFluidReassessmentAtTick).toBeLessThan(patient.norepinephrineIntentAtTick!);
    expect(patient.sourceControlEscalationAtTick).not.toBeNull();
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('reads sepsis as a conjunction and picks out the flank tenderness', () => {
    const review = narrations[beats.indexOf('review')]!;
    expect(review).toContain('Sepsis is that conjunction rather than either half');
    expect(review).toContain('an obstructed system rather than a simple one');
  });

  it('says why before is not instead', () => {
    const cultures = narrations[beats.indexOf('cultures')]!;
    expect(cultures).toContain('can sterilise a bottle within minutes');
    expect(cultures).toContain('only conflict if drawing cultures is slow');
  });

  it('gives the honest reason reassessment is not a formality', () => {
    const fluid = narrations[beats.indexOf('fluid')]!;
    expect(fluid).toContain('three-quarters of what you give is going somewhere that does not raise a blood pressure');
    expect(fluid).toContain('rather than a tap left running');
  });

  it('reads persistent shock after an adequate course as tone rather than volume', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('the problem is vascular tone rather than volume');
    expect(reassess).toContain('more litres buy oedema instead of pressure');
  });

  it('aims the vasopressor at the lowest pressure that perfuses', () => {
    const norepinephrine = narrations[beats.indexOf('norepinephrine')]!;
    expect(norepinephrine).toContain('rather than at normality');
    expect(norepinephrine).toContain('what it does not force');
  });

  it('closes on the step antimicrobials cannot substitute for', () => {
    const source = narrations[beats.indexOf('source')]!;
    expect(source).toContain('never waits for the fluid or the pressor');
    expect(source).toContain('stays septic on perfect antibiotics until somebody drains it');
    expect(narration).toContain('the one the engine never made wait');
    expect(narration).toContain('refused by nothing at all');
  });

  it('never waits for a culture, names an agent, or pours more fluid after the panel', () => {
    // Guard the instruction voice, not the nouns: the lesson argues about
    // cultures and about further fluid by naming them, so a bare noun match
    // would fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['wait for the culture result', 'hold antibiotics until',
      'start piperacillin', 'give another litre', 'the infection is treated',
      'he can go to the ward']) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Follows The Partial Order', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = septicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['sepsis-review', 'sepsis-cultures', 'sepsis-antimicrobial',
      'sepsis-fluid', 'sepsis-reassess', 'sepsis-norepinephrine', 'sepsis-source']);
  });

  it('stays on the cultures when the antimicrobial is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 1, 'review-infection-and-organ-dysfunction');
    advance(engine, 2, 'record-immediate-antimicrobial-intent');
    expect(snapshot(engine)!.antimicrobialIntentAtTick).toBeNull();
    const prompt = septicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('sepsis-cultures');
    expect(prompt.suggestion).toContain('note the word before, not instead');
  });

  it('goes quiet as soon as source control is recorded, however early', () => {
    const engine = create(); engine.step();
    advance(engine, 1, 'review-infection-and-organ-dysfunction');
    advance(engine, 2, 'escalate-source-control');
    expect(snapshot(engine)!.sourceControlEscalationAtTick).not.toBeNull();
    // Nothing else has been done, and the tutor still stops: the lesson's
    // closing condition is the step the engine never gated.
    expect(septicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 1, 'obtain-cultures-and-lactate');
    expect(snapshot(engine)!.culturesAndLactateAtTick).toBeNull();
    expect(septicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('sepsis-review');
  });

  it('never names an agent or waits for a culture on the recovery path', () => {
    const engine = create(); engine.step(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = septicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['wait for the culture result', 'start piperacillin', 'give another litre']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after source control', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(septicShockInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(septicShockInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(septicShockInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.sourceControlEscalationAtTick).not.toBeNull();
    expect(septicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(septicShockInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
