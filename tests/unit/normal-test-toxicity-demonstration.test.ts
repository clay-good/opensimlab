/**
 * The worked example and observed-state tutor for a normal test and a dose in his bag.
 *
 * What makes this lesson different is that the order is load-bearing. The supply
 * is with the patient and the next dose falls due inside the lesson, so an example
 * that documented first and stopped the drug second would read as thorough and
 * would still let him take it. These tests hold the order, not just the outcome.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { NORMAL_TEST_TOXICITY_THE_DOSE_IN_HIS_BAG as SCENARIO } from '../../src/modules/oncology/scenarios/normal-test-toxicity-the-dose-in-his-bag';
import { NORMAL_TEST_TOXICITY_FIXTURES as FIXTURES } from '../../src/modules/oncology/normal-test-toxicity-fixtures';
import { NORMAL_TEST_TOXICITY_NEXT_DOSE_TICKS as NEXT_DOSE } from '../../src/modules/oncology/normal-test-toxicity';
import {
  NORMAL_TEST_TOXICITY_DEMONSTRATION_VERSION, normalTestToxicityDemonstrationStep,
  supportsNormalTestToxicityDemonstration,
} from '../../src/modules/oncology/demo/normal-test-toxicity-demonstration';
import { normalTestToxicityInlinePrompt } from '../../src/modules/oncology/normal-test-toxicity-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.normalTestToxicity;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  let withheldAtTick: number | null = null;
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = normalTestToxicityDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, withheldAtTick, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) beats.push(step.id);
    if (step.action) {
      engine.apply({ tick, type: 'normal-test-toxicity-response', payload: { action: step.action } });
      if (step.action === 'withhold-the-drug-now' && withheldAtTick === null) withheldAtTick = tick;
    }
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Stops The Drug Before It Documents Anything', () => {
  const { beats, withheldAtTick, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(NORMAL_TEST_TOXICITY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsNormalTestToxicityDemonstration(SCENARIO)).toBe(true);
    expect(supportsNormalTestToxicityDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('withholds first, ahead of recording, escalating, and every other beat', () => {
    expect(beats[0]).toBe('withhold');
    for (const later of ['toxicity', 'exclusions', 'escalate', 'intent', 'boundaries']) {
      expect(beats.indexOf('withhold'), later).toBeLessThan(beats.indexOf(later));
    }
  });

  it('withholds long before the dose falls due, which is the point of the lesson', () => {
    expect(withheldAtTick).not.toBeNull();
    expect(withheldAtTick!).toBeLessThan(NEXT_DOSE);
    // He picks the box up and puts it back rather than taking it.
    expect(patient.nextDoseDue).toBe(true);
    expect(patient.nextDoseTaken).toBe(false);
  });

  it('reaches handoff and takes none of the four refused shortcuts', () => {
    expect(patient.ended).toBe('handoff');
    expect(patient.testExclusionAttempted).toBe(false);
    expect(patient.waitForServiceAttempted).toBe(false);
    expect(patient.doseAdviceAttempted).toBe(false);
    expect(patient.symptomaticOnlyAttempted).toBe(false);
  });
});

describe('Requirement: The Tutor Leads With Stopping The Drug', () => {
  it('opens on withholding rather than on documentation', () => {
    const engine = create(); engine.step();
    const prompt = normalTestToxicityInlinePrompt('guided', {
      scenarioVersion: '0.1.0', normalTestToxicity: snapshot(engine),
    })!;
    expect(prompt.id).toBe('normal-test-toxicity-withhold');
    expect(prompt.because).toContain('next dose is due');
  });

  it('treats withholding as urgent, so even the coached level says it', () => {
    const engine = create(); engine.step();
    expect(normalTestToxicityInlinePrompt('coached', {
      scenarioVersion: '0.1.0', normalTestToxicity: snapshot(engine),
    })?.id).toBe('normal-test-toxicity-withhold');
  });

  it('is silent when unassisted and bound to the exact content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(normalTestToxicityInlinePrompt('unassisted', { scenarioVersion: '0.1.0', normalTestToxicity: patient })).toBeNull();
    expect(normalTestToxicityInlinePrompt('guided', { scenarioVersion: '0.1.1', normalTestToxicity: patient })).toBeNull();
  });

  it('never tells the learner to change his dose, which the scenario refuses', () => {
    const engine = create();
    const seen: string[] = [];
    for (const action of ['withhold-the-drug-now', 'record-the-toxicity-and-its-severity',
      'record-what-the-normal-test-does-not-exclude', 'escalate-to-acute-oncology'] as const) {
      const prompt = normalTestToxicityInlinePrompt('guided', {
        scenarioVersion: '0.1.0', normalTestToxicity: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      engine.apply({ tick: 0, type: 'normal-test-toxicity-response', payload: { action } });
      engine.step();
    }
    for (const text of seen) {
      for (const forbidden of ['halve', 'reduce the dose', 'lower the dose', 'mg']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });
});
