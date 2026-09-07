/**
 * The worked example and observed-state tutor for the arrest that looks like it
 * wants a shock.
 *
 * The third objective is a thing not done, so the example has no beat for it
 * and the claim is asserted on the closing narration, which every path reaches.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEA_ARREST as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/pea-arrest';
import { PEA_ARREST_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/pea-arrest-fixtures';
import {
  PEA_ARREST_DEMONSTRATION_VERSION, peaArrestDemonstrationStep,
  supportsPeaArrestDemonstration,
} from '../../src/modules/emergency-medicine/demo/pea-arrest-demonstration';
import { peaArrestInlinePrompt } from '../../src/modules/emergency-medicine/tutor/pea-arrest-guidance';
import { PEA_ARREST_DISPATCH } from '../../src/modules/emergency-medicine/pea-arrest';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation;

function runDemonstration(limit = 5_000) {
  const engine = create(); engine.step();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 1; tick <= limit; tick += 1) {
    const step = peaArrestDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine), narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.dispatch) engine.apply({ tick, ...step.dispatch });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Never Reaches For The Defibrillator', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEA_ARREST_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPeaArrestDemonstration(SCENARIO)).toBe(true);
    expect(supportsPeaArrestDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPeaArrestDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'pea'),
    })).toBe(false);
  });

  it('takes both recorded steps in order without a single refusal', () => {
    expect(beats).toEqual(['compressions', 'epinephrine']);
    expect(patient).toMatchObject({
      chestCompressionsActive: true, arrestEpinephrineTotalMg: 1, defibrillationShockCount: 0,
    });
    expect(events.some((eventId) => /^bad-/.test(eventId))).toBe(false);
  });

  it('puts the shock claim where every path reaches it', () => {
    // No beat can demonstrate a shock that was never delivered, so the argument
    // lives in the close rather than in a step a learner might not see.
    expect(narration).toContain('the one you cannot see');
    expect(narration).toContain('there is nothing here for it to stop');
    expect(narration).toContain('the shock is available and the engine will deliver it');
  });

  it('carries the argument for each step it does take', () => {
    const compressions = narrations[beats.indexOf('compressions')]!;
    expect(compressions).toContain('The monitor is not the patient');
    expect(compressions).toContain('a finding about the muscle, not the wiring');
    const epinephrine = narrations[beats.indexOf('epinephrine')]!;
    expect(epinephrine).toContain('there is no shock to wait for');
    expect(epinephrine).toContain('a drug sitting in a peripheral vein is not a drug that has reached the heart');
  });

  it('asks the tutor for its narration rather than storing a copy', () => {
    const engine = create(); engine.step();
    const prompt = peaArrestInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, patient: snapshot(engine),
    })!;
    expect(narrations[0]).toBe(`${prompt.suggestion} ${prompt.because}`);
  });

  it('never claims a conversion, names a cause, or reports an outcome', () => {
    const everything = [...narrations, narration].join(' ').toLowerCase();
    for (const forbidden of ['the rhythm converted', 'he has a pulmonary embolism',
      'this is hypovolemia', 'rosc was achieved', 'he survived', 'he did not survive',
      'the cause was']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Reads Only What Was Done', () => {
  it('says nothing before the arrest, and nothing on the unassisted setting', () => {
    const engine = create();
    // Tick 0: the rhythm event has not been applied yet.
    expect(peaArrestInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, patient: snapshot(engine),
    })).toBeNull();
    engine.step();
    expect(peaArrestInlinePrompt('unassisted', {
      scenarioVersion: SCENARIO.metadata.version, patient: snapshot(engine),
    })).toBeNull();
    expect(peaArrestInlinePrompt('guided', {
      scenarioVersion: '0.1.1', patient: snapshot(engine),
    })).toBeNull();
    expect(peaArrestInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, patient: undefined,
    })).toBeNull();
  });

  it('displaces the current beat with the correction once a shock is delivered', () => {
    const engine = create(); engine.step();
    engine.apply({ tick: engine.tick, ...PEA_ARREST_DISPATCH['deliver-biphasic-shock'] });
    engine.step();
    const prompt = peaArrestInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, patient: snapshot(engine),
    })!;
    expect(prompt.id).toBe('pa-nonshockable');
    expect(prompt.because).toContain('There is nothing here to stop');
  });

  it('asks for compressions to be restarted before it asks for the dose', () => {
    const engine = create(); engine.step();
    engine.apply({ tick: engine.tick, ...PEA_ARREST_DISPATCH['start-compressions'] });
    engine.step();
    engine.apply({ tick: engine.tick, type: 'chest-compressions', payload: { active: false } });
    engine.step();
    const prompt = peaArrestInlinePrompt('coached', {
      scenarioVersion: SCENARIO.metadata.version, patient: snapshot(engine),
    })!;
    expect(prompt.id).toBe('pa-resume-compressions');
    expect(prompt.because).toContain('goes as far as the vein it was injected into');
  });

  it('falls silent once compressions are running with the dose given', () => {
    const engine = create(); engine.step();
    for (const step of ['start-compressions', 'give-one-milligram-epinephrine'] as const) {
      engine.apply({ tick: engine.tick, ...PEA_ARREST_DISPATCH[step] });
      engine.step();
    }
    expect(peaArrestInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, patient: snapshot(engine),
    })).toBeNull();
  });
});
