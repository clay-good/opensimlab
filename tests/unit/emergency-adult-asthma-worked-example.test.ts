/**
 * The worked example and observed-state tutor for three treatments on three
 * different clocks.
 *
 * The slowest of the three is the one whose entire advantage is being given
 * early, so it is the one held back until the fast treatment has been judged.
 * Because the lanes are unordered, the example only ever passes through the
 * beat for the state where none of them has been recorded — so that is where
 * the claim lives, and the assertions below check it on the joined narration.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ADULT_ASTHMA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/adult-asthma';
import { ADULT_ASTHMA_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/adult-asthma-fixtures';
import {
  ADULT_ASTHMA_DEMONSTRATION_VERSION, adultAsthmaDemonstrationStep,
  supportsAdultAsthmaDemonstration,
} from '../../src/modules/emergency-medicine/demo/adult-asthma-demonstration';
import { adultAsthmaInlinePrompt } from '../../src/modules/emergency-medicine/tutor/adult-asthma-guidance';
import type { AdultAsthmaAction } from '../../src/modules/emergency-medicine/adult-asthma';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.adultAsthmaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: AdultAsthmaAction) => {
  engine.apply({ tick, type: 'adult-asthma-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = adultAsthmaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'adult-asthma-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Records The Slow Drug First', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(ADULT_ASTHMA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAdultAsthmaDemonstration(SCENARIO)).toBe(true);
    expect(supportsAdultAsthmaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsAdultAsthmaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'obstruction'),
    })).toBe(false);
  });

  it('records the hours-away drug before the minutes-away one', () => {
    expect(beats).toEqual(['severity', 'oxygen', 'corticosteroid', 'bronchodilator', 'reassess']);
    expect(patient.severityReviewedAtTick).toBeLessThan(patient.controlledOxygenAtTick!);
    expect(patient.controlledOxygenAtTick).toBeLessThan(patient.corticosteroidIntentAtTick!);
    expect(patient.corticosteroidIntentAtTick).toBeLessThan(patient.bronchodilatorBundleAtTick!);
    expect(patient.bronchodilatorBundleAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('names the two findings that grade it', () => {
    const severity = narrations[beats.indexOf('severity')]!;
    expect(severity).toContain('Speech and peak flow are the two that grade it');
    expect(severity).toContain('a quiet chest in this picture would be worse rather than better');
  });

  it('carries the load-bearing claim on the path the example actually takes', () => {
    // The lanes are unordered, so the per-lane oxygen beat is never reached
    // here. The claim has to survive on the "none of the three yet" beat.
    expect(beats).not.toContain('aa-oxygen');
    expect(everything).toContain('They are unordered on purpose');
    expect(everything).toContain('they act on three different clocks');
    expect(everything).toContain('it is the entire advantage the drug has');
    expect(everything).toContain('the only deferral here you cannot recover later in the same visit');
  });

  it('treats early as the corticosteroid’s only lever', () => {
    const corticosteroid = narrations[beats.indexOf('corticosteroid')]!;
    expect(corticosteroid).toContain('only if the decision was made hours earlier');
    expect(corticosteroid).toContain('already answered that');
  });

  it('says why a spacer is not the budget option', () => {
    const bronchodilator = narrations[beats.indexOf('bronchodilator')]!;
    expect(bronchodilator).toContain('The spacer is not the budget option');
    expect(bronchodilator).toContain('rather than in every one');
  });

  it('says a second cycle follows a second look rather than a clock', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('follows a second look rather than a clock');
    expect(reassess).toContain('authored rather than modelled');
    expect(narration).toContain('none of the three waits on another');
  });

  it('never teaches technique, names a dose, opens the oxygen, or claims it worked', () => {
    // Guard the instruction voice, not the nouns: the lesson names a fixed puff
    // count and an oxygen target as recorded content, so a bare noun match
    // would fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['shake the inhaler', 'seal her lips around',
      'give 40 mg of prednisolone', 'run it at 15 l', 'oxygen wide open',
      'her peak flow has recovered', 'she can be discharged']) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds The Two Gates And Nothing Else', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = adultAsthmaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['aa-severity', 'aa-initial', 'aa-corticosteroid', 'aa-bronchodilator', 'aa-reassess']);
  });

  it('reaches the per-lane oxygen beat only when a learner treats out of the example order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-severity-and-mimics');
    advance(engine, 1, 'give-fixed-inhaled-bronchodilators');
    const prompt = adultAsthmaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('aa-oxygen');
    expect(prompt.because).toContain('a target you can miss in both directions');
  });

  it('stays on the reassessment while the engine clock has not moved on', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-severity-and-mimics');
    advance(engine, 1, 'record-controlled-oxygen');
    advance(engine, 2, 'record-early-corticosteroid-intent');
    engine.apply({ tick: 3, type: 'adult-asthma-response', payload: { action: 'give-fixed-inhaled-bronchodilators' } });
    engine.apply({ tick: 3, type: 'adult-asthma-response', payload: { action: 'reassess-after-initial-treatment' } });
    engine.step();
    expect(snapshot(engine)!.reassessedAtTick).toBeNull();
    expect(adultAsthmaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('aa-reassess');
  });

  it('does not move on when a treatment is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'record-early-corticosteroid-intent');
    expect(snapshot(engine)!.corticosteroidIntentAtTick).toBeNull();
    expect(adultAsthmaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('aa-severity');
  });

  it('never teaches technique or names a dose anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = adultAsthmaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['shake the inhaler', 'give 40 mg of prednisolone', 'run it at 15 l']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(adultAsthmaInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(adultAsthmaInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(adultAsthmaInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(adultAsthmaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(adultAsthmaInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
