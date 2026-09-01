/**
 * The worked example and observed-state tutor for five criteria sets that do not
 * agree.
 *
 * Two say image before puncture and three do not, on the same three features.
 * Neither the tutor nor the example picks a winner, because choosing would
 * invent a consensus the literature does not have. What they do instead is put
 * the antimicrobial decision outside the argument: every set that recommends
 * imaging also says treatment must not wait for it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { MENINGITIS_IMAGING_A_RULE_THAT_DOES_NOT_AGREE as SCENARIO } from '../../src/modules/infectious-disease/scenarios/meningitis-imaging-a-rule-that-does-not-agree';
import { MENINGITIS_IMAGING_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/meningitis-imaging-fixtures';
import {
  MENINGITIS_IMAGING_DEMONSTRATION_VERSION, meningitisImagingDemonstrationStep,
  supportsMeningitisImagingDemonstration,
} from '../../src/modules/infectious-disease/demo/meningitis-imaging-demonstration';
import { meningitisImagingInlinePrompt } from '../../src/modules/infectious-disease/meningitis-imaging-tutor';
import type { MeningitisImagingAction } from '../../src/modules/infectious-disease/meningitis-imaging';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.meningitisImaging;
const advance = (engine: AnesthesiaEngine, tick: number, action: MeningitisImagingAction) => {
  engine.apply({ tick, type: 'meningitis-imaging-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 400_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = meningitisImagingDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'meningitis-imaging-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Leaves The Guidelines Disagreeing', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(MENINGITIS_IMAGING_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMeningitisImagingDemonstration(SCENARIO)).toBe(true);
    expect(supportsMeningitisImagingDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats.slice(0, 6)).toEqual(['features', 'owners', 'intent', 'criteria',
      'boundaries', 'monitor']);
    expect(beats.at(-1)).toBe('handoff');
    expect(patient.ended).toBe('handoff');
  });

  it('records the antimicrobial intent before the criteria are even compared', () => {
    expect(patient.antimicrobialIntentAtTick).toBeLessThan(patient.criteriaComparedAtTick!);
    expect(patient.antimicrobialInsideCeiling).toBe(true);
    expect(patient.ceilingPassed).toBe(false);
  });

  it('never declares one rule set correct', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the correct rule is', 'nice is right', 'follow escmid instead']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(narrations[beats.indexOf('criteria')]).toContain('rather than a question with a hidden right answer');
    expect(narration).toContain('No rule was declared correct');
  });

  it('reports the scan as changing nothing rather than as a finding', () => {
    expect(patient.imagingChangedManagement).toBe(false);
    expect(narrations[beats.indexOf('reassess')]).toContain('the common result rather than a surprise');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.scanIsSaferAttempted).toBe(false);
    expect(patient.delayAttempted).toBe(false);
    expect(patient.crpAttempted).toBe(false);
    expect(patient.gramStainAttempted).toBe(false);
  });
});

describe('Requirement: The Tutor Keeps Treatment Out Of The Argument', () => {
  it('opens on the features rather than a rule', () => {
    const engine = create(); engine.step();
    const prompt = meningitisImagingInlinePrompt('guided', { scenarioVersion: '0.1.0', meningitisImaging: snapshot(engine) })!;
    expect(prompt.id).toBe('meningitis-imaging-features');
    expect(prompt.because).toContain('before any rule is consulted');
  });

  it('gives each exclusion its own number', () => {
    const engine = create();
    for (const action of ['record-triggering-features', 'activate-time-critical-owners',
      'record-antimicrobial-intent', 'compare-criteria-sets'] as const) advance(engine, 0, action);
    const prompt = meningitisImagingInlinePrompt('guided', { scenarioVersion: '0.1.0', meningitisImaging: snapshot(engine) })!;
    expect(prompt.id).toBe('meningitis-imaging-boundaries');
    expect(prompt.because).toContain('roughly half sensitive');
    expect(prompt.because).toContain('does not rule this out');
  });

  it('never recommends scanning first or delaying treatment', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = meningitisImagingInlinePrompt('guided', { scenarioVersion: '0.1.0', meningitisImaging: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['scan first', 'hold the antimicrobials', 'wait for the puncture']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(meningitisImagingInlinePrompt('unassisted', { scenarioVersion: '0.1.0', meningitisImaging: patient })).toBeNull();
    expect(meningitisImagingInlinePrompt('guided', { scenarioVersion: '0.1.1', meningitisImaging: patient })).toBeNull();
  });
});
