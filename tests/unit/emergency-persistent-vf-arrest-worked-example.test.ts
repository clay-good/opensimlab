/**
 * The worked example and observed-state tutor for the shock that has already
 * failed twice.
 *
 * The example never takes the under-energy shock, so the argument for the
 * declared setting is asserted on the tutor's correction beat, which a learner
 * reaches only by making the mistake, and on the closing narration, which
 * every path reaches.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import { PERSISTENT_VF_ARREST as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/persistent-vf-arrest';
import { PERSISTENT_VF_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/persistent-vf-arrest-fixtures';
import {
  PERSISTENT_VF_DEMONSTRATION_VERSION, persistentVfDemonstrationStep,
  supportsPersistentVfArrestDemonstration,
} from '../../src/modules/emergency-medicine/demo/persistent-vf-arrest-demonstration';
import { persistentVfInlinePrompt } from '../../src/modules/emergency-medicine/tutor/persistent-vf-arrest-guidance';
import { PERSISTENT_VF_DISPATCH } from '../../src/modules/emergency-medicine/persistent-vf-arrest';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation;

function runDemonstration(limit = 5_000) {
  const engine = create(); engine.step();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 1; tick <= limit; tick += 1) {
    const step = persistentVfDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine), narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.dispatch) engine.apply({ tick, ...step.dispatch });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Earns The Shock Before It Takes It', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PERSISTENT_VF_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPersistentVfArrestDemonstration(SCENARIO)).toBe(true);
    expect(supportsPersistentVfArrestDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPersistentVfArrestDemonstration({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'ventricular-fibrillation'),
    })).toBe(false);
  });

  it('takes all three recorded steps in order and converts on the first shock it delivers', () => {
    expect(beats).toEqual(['compressions', 'epinephrine', 'shock']);
    expect(patient).toMatchObject({
      arrestEpinephrineTotalMg: 1, defibrillationShockCount: 1, lastDefibrillationEnergyJ: 200,
    });
    expect(patient.roscAtTick).not.toBeNull();
    expect(events.some((eventId) => /^bad-/.test(eventId))).toBe(false);
  });

  it('carries the argument for each step it takes', () => {
    const compressions = narrations[beats.indexOf('compressions')]!;
    expect(compressions).toContain('not a third shock');
    expect(compressions).toContain('nothing has changed about the muscle in between');
    const epinephrine = narrations[beats.indexOf('epinephrine')]!;
    expect(epinephrine).toContain('after shocks have failed rather than before them');
    const shock = narrations[beats.indexOf('shock')]!;
    expect(shock).toContain('what makes this attempt different from the two that failed');
  });

  it('says the conversion is a property of the model, not a prediction', () => {
    expect(narration).toContain('what its stated conditions say it does');
    expect(narration).toContain('not a prediction about any person');
    expect(narration).toContain('post-arrest care, which is entirely outside this vignette');
  });

  it('never predicts an outcome for a person or claims the case ends well', () => {
    const everything = [...narrations, narration].join(' ').toLowerCase();
    for (const forbidden of ['she survived', 'she did not survive', 'she will recover',
      'a good neurological outcome', 'the resuscitation succeeded', 'she is out of danger']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('never demonstrates the under-energy shock', () => {
    expect(events.filter((eventId) => eventId.startsWith('defibrillation-'))).toHaveLength(1);
    expect(patient.lastDefibrillationEnergyJ).toBe(200);
  });
});

describe('Requirement: The Tutor Names What The Shock Was Missing', () => {
  it('says nothing before the arrest, and nothing on the unassisted setting', () => {
    const engine = create();
    expect(persistentVfInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, patient: snapshot(engine),
    })).toBeNull();
    engine.step();
    expect(persistentVfInlinePrompt('unassisted', {
      scenarioVersion: SCENARIO.metadata.version, patient: snapshot(engine),
    })).toBeNull();
    expect(persistentVfInlinePrompt('guided', {
      scenarioVersion: '0.1.1', patient: snapshot(engine),
    })).toBeNull();
    expect(persistentVfInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, patient: undefined,
    })).toBeNull();
  });

  it('names the setting when the last shock went out below it', () => {
    const engine = create(); engine.step();
    for (const step of ['start-compressions', 'give-one-milligram-epinephrine',
      'deliver-under-energy-shock'] as const) {
      engine.apply({ tick: engine.tick, ...PERSISTENT_VF_DISPATCH[step] });
      engine.step();
    }
    const prompt = persistentVfInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, patient: snapshot(engine),
    })!;
    expect(prompt.id).toBe('vf-energy');
    expect(prompt.because).toContain('120 J and did not convert');
    expect(prompt.because).toContain('not a measure of how hard the case is being tried');
  });

  it('asks for compressions to be restarted before the next shock', () => {
    const engine = create(); engine.step();
    engine.apply({ tick: engine.tick, ...PERSISTENT_VF_DISPATCH['start-compressions'] });
    engine.step();
    engine.apply({ tick: engine.tick, type: 'chest-compressions', payload: { active: false } });
    for (let tick = 0; tick <= 11 * TICKS_PER_SECOND; tick += 1) engine.step();
    const prompt = persistentVfInlinePrompt('coached', {
      scenarioVersion: SCENARIO.metadata.version, patient: snapshot(engine),
    })!;
    expect(prompt.id).toBe('vf-resume-compressions');
    expect(prompt.because).toContain('charge while compressions continue');
  });

  it('changes what it says after a declared shock that did not convert', () => {
    const engine = create(); engine.step();
    engine.apply({ tick: engine.tick, ...PERSISTENT_VF_DISPATCH['start-compressions'] });
    engine.step();
    engine.apply({ tick: engine.tick, ...PERSISTENT_VF_DISPATCH['deliver-declared-shock'] });
    engine.step();
    const missing = persistentVfInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, patient: snapshot(engine),
    })!;
    expect(missing.id).toBe('vf-epinephrine');
    engine.apply({ tick: engine.tick, ...PERSISTENT_VF_DISPATCH['give-one-milligram-epinephrine'] });
    engine.step();
    const again = persistentVfInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, patient: snapshot(engine),
    })!;
    expect(again.id).toBe('vf-shock-again');
    expect(again.because).toContain('one of the three things this case checks was missing');
  });

  it('falls silent once the bounded case has converted', () => {
    const engine = create(); engine.step();
    for (const step of ['start-compressions', 'give-one-milligram-epinephrine',
      'deliver-declared-shock'] as const) {
      engine.apply({ tick: engine.tick, ...PERSISTENT_VF_DISPATCH[step] });
      engine.step();
    }
    expect(snapshot(engine).roscAtTick).not.toBeNull();
    expect(persistentVfInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, patient: snapshot(engine),
    })).toBeNull();
  });
});
