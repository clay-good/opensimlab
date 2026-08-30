/**
 * The worked example and observed-state tutor for an emergency that mostly is not one.
 *
 * The hard beat here is a refusal, and the scenario puts it on the clock: a
 * radiation oncology registrar rings back with a slot tonight and a willingness to
 * use it. Declining is harder than accepting, so an example that finished before
 * the offer arrived would have demonstrated nothing about this lesson.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { INHERITED_URGENCY_AN_EMERGENCY_THAT_MOSTLY_IS_NOT_ONE as SCENARIO } from '../../src/modules/oncology/scenarios/inherited-urgency-an-emergency-that-mostly-is-not-one';
import { INHERITED_URGENCY_FIXTURES as FIXTURES } from '../../src/modules/oncology/inherited-urgency-fixtures';
import {
  INHERITED_URGENCY_DEMONSTRATION_VERSION, inheritedUrgencyDemonstrationStep,
  supportsInheritedUrgencyDemonstration,
} from '../../src/modules/oncology/demo/inherited-urgency-demonstration';
import { inheritedUrgencyInlinePrompt } from '../../src/modules/oncology/inherited-urgency-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.inheritedUrgency;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = inheritedUrgencyDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'inherited-urgency-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Passes Through The Offer And Declines It', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(INHERITED_URGENCY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsInheritedUrgencyDemonstration(SCENARIO)).toBe(true);
    expect(supportsInheritedUrgencyDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches the offer rather than finishing before it', () => {
    // An example that ended early would never have to decline anything.
    expect(patient.treatmentOffered).toBe(true);
    expect(beats).toContain('hold');
    expect(patient.ended).toBe('handoff');
  });

  it('declines the slot without declining the help', () => {
    expect(patient.treatBeforeTissueAttempted).toBe(false);
    const hold = narrations[beats.indexOf('hold')]!;
    expect(hold).toContain('without declining the help');
    expect(hold).toContain('upstream of the tissue');
  });

  it('secures the pathway before the offer ever arrives', () => {
    expect(beats.indexOf('pathway')).toBeLessThan(beats.indexOf('observe-offer'));
    expect(patient.pathwaySecuredAtTick).not.toBeNull();
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.swellingOnlyAttempted).toBe(false);
    expect(patient.treatBeforeTissueAttempted).toBe(false);
    expect(patient.sendHomeAttempted).toBe(false);
    expect(patient.diureticAttempted).toBe(false);
  });
});

describe('Requirement: The Tutor Asks What Would Make It One', () => {
  it('opens on the findings rather than on whether this is serious', () => {
    const engine = create(); engine.step();
    const prompt = inheritedUrgencyInlinePrompt('guided', {
      scenarioVersion: '0.1.0', inheritedUrgency: snapshot(engine),
    })!;
    expect(prompt.id).toBe('inherited-urgency-findings');
    expect(prompt.because).toContain('question with an answer');
  });

  it('treats declining the slot as urgent, so the coached level says it too', () => {
    const engine = create();
    for (const action of ['record-the-findings-that-would-make-it-an-emergency',
      'record-that-the-tissue-decides-the-treatment', 'secure-the-diagnostic-pathway',
      'record-bounded-treatment-intent', 'review-boundaries'] as const) {
      engine.apply({ tick: 0, type: 'inherited-urgency-response', payload: { action } });
    }
    for (let tick = 0; tick <= 16_000; tick += 1) engine.step();
    const patient = snapshot(engine);
    expect(patient!.treatmentOffered).toBe(true);
    expect(inheritedUrgencyInlinePrompt('coached', { scenarioVersion: '0.1.0', inheritedUrgency: patient })?.id)
      .toBe('inherited-urgency-hold');
  });

  it('never quotes a proportion as the reason to treat or not to', () => {
    const engine = create();
    const seen: string[] = [];
    for (const action of ['record-the-findings-that-would-make-it-an-emergency',
      'record-that-the-tissue-decides-the-treatment', 'secure-the-diagnostic-pathway'] as const) {
      const prompt = inheritedUrgencyInlinePrompt('guided', {
        scenarioVersion: '0.1.0', inheritedUrgency: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      engine.apply({ tick: 0, type: 'inherited-urgency-response', payload: { action } });
      engine.step();
    }
    for (const text of seen) {
      expect(text, 'no percentage').not.toMatch(/\d\s*(%|percent|per cent)/);
    }
  });

  it('is silent when unassisted and bound to the exact content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(inheritedUrgencyInlinePrompt('unassisted', { scenarioVersion: '0.1.0', inheritedUrgency: patient })).toBeNull();
    expect(inheritedUrgencyInlinePrompt('guided', { scenarioVersion: '0.1.1', inheritedUrgency: patient })).toBeNull();
  });
});
