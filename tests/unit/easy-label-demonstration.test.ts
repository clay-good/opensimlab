/**
 * The worked example and observed-state tutor for a label that fits too easily.
 *
 * The label may well be right, and that is the trap rather than a complication of
 * it. A demonstration is unusually exposed here, because the form is expected to
 * arrive somewhere — so this example is held to finishing with the label
 * unconfirmed and the competing causes still open.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { EASY_LABEL_A_LABEL_THAT_FITS_TOO_EASILY as SCENARIO } from '../../src/modules/oncology/scenarios/easy-label-a-label-that-fits-too-easily';
import { EASY_LABEL_FIXTURES as FIXTURES } from '../../src/modules/oncology/easy-label-fixtures';
import {
  EASY_LABEL_DEMONSTRATION_VERSION, easyLabelDemonstrationStep, supportsEasyLabelDemonstration,
} from '../../src/modules/oncology/demo/easy-label-demonstration';
import { easyLabelInlinePrompt } from '../../src/modules/oncology/easy-label-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.easyLabel;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = easyLabelDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'easy-label-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Ends With The Label Unconfirmed', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(EASY_LABEL_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsEasyLabelDemonstration(SCENARIO)).toBe(true);
    expect(supportsEasyLabelDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('hands off without having excluded the competing causes', () => {
    // A diagnosis of exclusion, handed on before anything came back. The
    // demonstration form wants to arrive somewhere; this one deliberately does not.
    expect(patient.ended).toBe('handoff');
    expect(patient.competingCausesExcluded).toBe(false);
    expect(narrations.at(-1)).toContain('unconfirmed');
  });

  it('records the label as one of exclusion before anything else', () => {
    expect(beats[0]).toBe('exclusion');
    expect(beats.indexOf('exclusion')).toBeLessThan(beats.indexOf('outstanding'));
  });

  it('escalates so both can start together rather than queueing them', () => {
    expect(beats[1]).toBe('escalate');
    const escalate = narrations[1]!;
    expect(escalate).toContain('not a queue');
  });

  it('finds the unopened history and adds it rather than dismissing it', () => {
    expect(patient.historySurfaced).toBe(true);
    const hold = narrations[beats.indexOf('hold')]!;
    expect(hold).toContain('never opened in this clinic');
    // The history does not overturn the label; it makes it one of at least two.
    expect(hold).toContain('one of at least two things');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.fourCyclesAttempted).toBe(false);
    expect(patient.noFeverAttempted).toBe(false);
    expect(patient.immunosuppressionAttempted).toBe(false);
    expect(patient.waitForAllAttempted).toBe(false);
  });
});

describe('Requirement: The Tutor Asks What Is Left, Not How Likely', () => {
  it('opens on the label being a diagnosis of exclusion', () => {
    const engine = create(); engine.step();
    const prompt = easyLabelInlinePrompt('guided', {
      scenarioVersion: '0.1.0', easyLabel: snapshot(engine),
    })!;
    expect(prompt.id).toBe('easy-label-exclusion');
    expect(prompt.because).toContain('checking is the definition');
  });

  it('demands names rather than a pending category', () => {
    const engine = create();
    for (const action of ['record-that-the-label-is-a-diagnosis-of-exclusion',
      'escalate-so-both-can-start-together'] as const) {
      engine.apply({ tick: 0, type: 'easy-label-response', payload: { action } });
    }
    engine.step();
    const prompt = easyLabelInlinePrompt('guided', {
      scenarioVersion: '0.1.0', easyLabel: snapshot(engine),
    })!;
    expect(prompt.id).toBe('easy-label-outstanding');
    expect(prompt.because).toContain('checkable and a category is not');
  });

  it('never argues the label is likely or unlikely', () => {
    const engine = create();
    const seen: string[] = [];
    for (const action of ['record-that-the-label-is-a-diagnosis-of-exclusion',
      'escalate-so-both-can-start-together', 'record-what-has-not-been-excluded',
      'record-bounded-treatment-intent'] as const) {
      const prompt = easyLabelInlinePrompt('guided', {
        scenarioVersion: '0.1.0', easyLabel: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      engine.apply({ tick: 0, type: 'easy-label-response', payload: { action } });
      engine.step();
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['most likely', 'probably is', 'unlikely to be', 'start immunosuppression']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted and bound to the exact content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(easyLabelInlinePrompt('unassisted', { scenarioVersion: '0.1.0', easyLabel: patient })).toBeNull();
    expect(easyLabelInlinePrompt('guided', { scenarioVersion: '0.1.1', easyLabel: patient })).toBeNull();
  });
});
