/**
 * The worked example and observed-state tutor for a screen that was never done.
 *
 * The example screens him while he is asleep, which is the whole move: impaired
 * arousal is a scoreable component rather than a reason to come back later. Both
 * stop at a positive screen and neither names the condition, because a screen
 * identifies who needs assessing rather than making the diagnosis.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { QUIET_PATIENT_A_SCREEN_THAT_WAS_NEVER_DONE as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/quiet-patient-a-screen-that-was-never-done';
import { QUIET_PATIENT_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/quiet-patient-fixtures';
import {
  QUIET_PATIENT_DEMONSTRATION_VERSION, quietPatientDemonstrationStep, supportsQuietPatientDemonstration,
} from '../../src/modules/medical-surgical-nursing/demo/quiet-patient-demonstration';
import { quietPatientInlinePrompt } from '../../src/modules/medical-surgical-nursing/quiet-patient-tutor';
import type { QuietPatientAction } from '../../src/modules/medical-surgical-nursing/quiet-patient';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.quietPatient;
const advance = (engine: AnesthesiaEngine, tick: number, action: QuietPatientAction) => {
  engine.apply({ tick, type: 'quiet-patient-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = quietPatientDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'quiet-patient-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Produces A Result, Not A Label', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(QUIET_PATIENT_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsQuietPatientDemonstration(SCENARIO)).toBe(true);
    expect(supportsQuietPatientDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats).toEqual(['impressions', 'screen', 'record', 'escalate', 'boundaries',
      'monitor', 'await', 'reassess', 'handoff']);
    expect(patient.ended).toBe('handoff');
  });

  it('screens rather than deferring, and records the result as a result', () => {
    expect(patient.deferralAttempted).toBe(false);
    expect(patient.screenedAtTick).toBeLessThan(patient.resultRecordedAtTick!);
    expect(patient.resultRecordedAtTick).toBeLessThan(patient.escalationAtTick!);
    expect(narrations[beats.indexOf('screen')]).toContain('scoreable component');
  });

  it('never names the condition anywhere in the example', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['he has delirium', 'the diagnosis is', 'this is delirium', 'he is delirious']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(narration).toContain('Nothing has been diagnosed here');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.deferralAttempted).toBe(false);
    expect(patient.quietReadAsSettled).toBe(false);
    expect(patient.earlierScreenTrusted).toBe(false);
    expect(patient.moodAttributed).toBe(false);
  });
});

describe('Requirement: The Tutor Asks For A Result, Not A Better Impression', () => {
  it('opens on what the three shifts actually contain', () => {
    const engine = create(); engine.step();
    const prompt = quietPatientInlinePrompt('guided', { scenarioVersion: '0.1.0', quietPatient: snapshot(engine) })!;
    expect(prompt.id).toBe('quiet-patient-impressions');
    expect(prompt.because).toContain('agreement rather than measurement');
  });

  it('refuses to let sleep defer the screen', () => {
    const engine = create();
    advance(engine, 0, 'review-the-charted-impression');
    const prompt = quietPatientInlinePrompt('guided', { scenarioVersion: '0.1.0', quietPatient: snapshot(engine) })!;
    expect(prompt.id).toBe('quiet-patient-screen');
    expect(prompt.because).toContain('rather than a reason to come back later');
  });

  it('never diagnoses, and never offers mood or quiet as an explanation', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = quietPatientInlinePrompt('guided', { scenarioVersion: '0.1.0', quietPatient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['he has delirium', 'it is low mood', 'he is just settled', 'probably depression']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds the waiting beat when coached', () => {
    const engine = create();
    for (const action of ['review-the-charted-impression', 'screen-for-arousal', 'record-the-screen-result',
      'escalate-on-the-positive-screen', 'review-boundaries', 'monitor'] as const) {
      advance(engine, 0, action);
    }
    const patient = snapshot(engine);
    expect(quietPatientInlinePrompt('guided', { scenarioVersion: '0.1.0', quietPatient: patient })!.id)
      .toBe('quiet-patient-await');
    expect(quietPatientInlinePrompt('coached', { scenarioVersion: '0.1.0', quietPatient: patient })).toBeNull();
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(quietPatientInlinePrompt('unassisted', { scenarioVersion: '0.1.0', quietPatient: patient })).toBeNull();
    expect(quietPatientInlinePrompt('guided', { scenarioVersion: '0.1.1', quietPatient: patient })).toBeNull();
  });
});
