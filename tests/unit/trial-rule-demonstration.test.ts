/**
 * The worked example and observed-state tutor for a rule written for a database.
 *
 * Both refused shortcuts accept the same framing — that a response category
 * licenses a decision — and then differ only in direction. So the example is held
 * to never claiming a category at all, which is a stronger property than avoiding
 * the two named wrong answers.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { TRIAL_RULE_A_RULE_WRITTEN_FOR_A_DATABASE as SCENARIO } from '../../src/modules/oncology/scenarios/trial-rule-a-rule-written-for-a-database';
import { TRIAL_RULE_FIXTURES as FIXTURES } from '../../src/modules/oncology/trial-rule-fixtures';
import { TRIAL_RULE_DOCUMENT_TICKS as DOCUMENT } from '../../src/modules/oncology/trial-rule';
import {
  TRIAL_RULE_DEMONSTRATION_VERSION, trialRuleDemonstrationStep, supportsTrialRuleDemonstration,
} from '../../src/modules/oncology/demo/trial-rule-demonstration';
import { trialRuleInlinePrompt } from '../../src/modules/oncology/trial-rule-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.trialRule;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  let escalatedAtTick: number | null = null;
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = trialRuleDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, escalatedAtTick, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) {
      engine.apply({ tick, type: 'trial-rule-response', payload: { action: step.action } });
      if (step.action === 'escalate-to-the-treating-team-now' && escalatedAtTick === null) escalatedAtTick = tick;
    }
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Claims No Category', () => {
  const { beats, narrations, escalatedAtTick, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(TRIAL_RULE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsTrialRuleDemonstration(SCENARIO)).toBe(true);
    expect(supportsTrialRuleDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('takes neither direction of the same framing', () => {
    expect(patient.continueAttempted).toBe(false);
    expect(patient.stopAttempted).toBe(false);
    expect(patient.scanOnlyAttempted).toBe(false);
    expect(patient.waitAttempted).toBe(false);
    expect(patient.ended).toBe('handoff');
  });

  it('never asserts pseudoprogression or progression in its own narration', () => {
    // Naming the category is the move both wrong answers share.
    const text = narrations.join(' ').toLowerCase();
    for (const claim of ['this is pseudoprogression', 'it is pseudoprogression',
      'this is progression', 'it is progression', 'the treatment has failed']) {
      expect(text, claim).not.toContain(claim);
    }
    // The last collected beat is the handoff, which leaves the category unclaimed.
    expect(narrations.at(-1)!.toLowerCase()).toContain('the category unclaimed');
  });

  it('tells her team before writing the rest up', () => {
    expect(beats[0]).toBe('trajectory');
    expect(beats[1]).toBe('escalate');
    expect(escalatedAtTick).not.toBeNull();
    expect(escalatedAtTick!).toBeLessThan(DOCUMENT);
  });

  it('reads the quoted document and finds it narrower than it was cited as saying', () => {
    expect(patient.documentRead).toBe(true);
    const hold = narrations[beats.indexOf('hold')]!;
    expect(hold).toContain('narrower than it was quoted');
    // The colleague is not the target.
    expect(hold).toContain('not a fault in the colleague');
  });
});

describe('Requirement: The Tutor Argues Trajectory, Not Category', () => {
  it('opens on the clinical trajectory', () => {
    const engine = create(); engine.step();
    const prompt = trialRuleInlinePrompt('guided', {
      scenarioVersion: '0.1.0', trialRule: snapshot(engine),
    })!;
    expect(prompt.id).toBe('trial-rule-trajectory');
    expect(prompt.because).toContain('never measuring');
  });

  it('never tells the learner which category she is in', () => {
    const engine = create();
    const seen: string[] = [];
    for (const action of ['record-the-clinical-trajectory-not-just-the-scan',
      'escalate-to-the-treating-team-now', 'record-what-the-criteria-do-and-do-not-govern',
      'record-bounded-treatment-intent'] as const) {
      const prompt = trialRuleInlinePrompt('guided', {
        scenarioVersion: '0.1.0', trialRule: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      engine.apply({ tick: 0, type: 'trial-rule-response', payload: { action } });
      engine.step();
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['is pseudoprogression', 'is progression', 'continue the immunotherapy',
        'stop the immunotherapy']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted and bound to the exact content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(trialRuleInlinePrompt('unassisted', { scenarioVersion: '0.1.0', trialRule: patient })).toBeNull();
    expect(trialRuleInlinePrompt('guided', { scenarioVersion: '0.1.1', trialRule: patient })).toBeNull();
  });
});
