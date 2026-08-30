/**
 * The worked example and observed-state tutor for a base rate that is not a threshold.
 *
 * The scenario makes the monitoring beat literal: conduction only progresses where
 * somebody arranged a monitor. So an example that skipped it would run to handoff
 * having seen nothing and would look exactly as complete — which is why the
 * counterfactual is tested rather than the checklist.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { RARE_EARLY_MYOCARDITIS_A_BASE_RATE_IS_NOT_A_THRESHOLD as SCENARIO } from '../../src/modules/oncology/scenarios/rare-early-myocarditis-a-base-rate-is-not-a-threshold';
import { RARE_EARLY_MYOCARDITIS_FIXTURES as FIXTURES } from '../../src/modules/oncology/rare-early-myocarditis-fixtures';
import {
  RARE_EARLY_MYOCARDITIS_DEMONSTRATION_VERSION, rareEarlyMyocarditisDemonstrationStep,
  supportsRareEarlyMyocarditisDemonstration,
} from '../../src/modules/oncology/demo/rare-early-myocarditis-demonstration';
import { rareEarlyMyocarditisInlinePrompt } from '../../src/modules/oncology/rare-early-myocarditis-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.rareEarlyMyocarditis;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = rareEarlyMyocarditisDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) beats.push(step.id);
    if (step.action) engine.apply({ tick, type: 'rare-early-myocarditis-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Watches, And That Is What It Demonstrates', () => {
  const { beats, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(RARE_EARLY_MYOCARDITIS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsRareEarlyMyocarditisDemonstration(SCENARIO)).toBe(true);
    expect(supportsRareEarlyMyocarditisDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('arranges monitoring before escalating, and sees the conduction move', () => {
    expect(beats.indexOf('monitor')).toBeLessThan(beats.indexOf('escalate'));
    expect(patient.monitoringAtTick).not.toBeNull();
    expect(patient.conductionProgressed).toBe(true);
    expect(patient.ended).toBe('handoff');
  });

  it('calls both teams rather than one', () => {
    expect(patient.teamsResponded).toBe(true);
    expect(patient.teamsObserved).toBe(true);
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.rarityDismissalAttempted).toBe(false);
    expect(patient.troponinDismissalAttempted).toBe(false);
    expect(patient.deferralAttempted).toBe(false);
    expect(patient.coronaryOnlyAttempted).toBe(false);
  });
});

describe('Requirement: Without The Monitor, Nothing Is Seen', () => {
  it('never progresses the conduction for a run that skipped monitoring', () => {
    // The same lesson, same duration, everything else recorded — and the part that
    // moves first is simply never observed. This is what the monitoring beat buys.
    const engine = create();
    for (const action of ['record-the-exposure-interval', 'record-what-is-present-that-is-not-cardiac',
      'escalate-to-both-teams', 'record-bounded-treatment-intent', 'review-boundaries'] as const) {
      engine.apply({ tick: 0, type: 'rare-early-myocarditis-response', payload: { action } });
    }
    for (let tick = 0; tick <= 60_000; tick += 1) engine.step();
    const patient = snapshot(engine)!;
    expect(patient.monitoringAtTick).toBeNull();
    expect(patient.conductionProgressed).toBe(false);
    // The teams still answer, so the run looks otherwise complete.
    expect(patient.teamsResponded).toBe(true);
  });
});

describe('Requirement: The Tutor Argues Intervals, Not Base Rates', () => {
  it('opens on the exposure interval rather than on how rare this is', () => {
    const engine = create(); engine.step();
    const prompt = rareEarlyMyocarditisInlinePrompt('guided', {
      scenarioVersion: '0.1.0', rareEarlyMyocarditis: snapshot(engine),
    })!;
    expect(prompt.id).toBe('rare-early-myocarditis-interval');
    expect(prompt.because).toContain('interval is decidable and the base rate is not');
  });

  it('never quotes an incidence as a reason to act or not to', () => {
    const engine = create();
    const seen: string[] = [];
    for (const action of ['record-the-exposure-interval', 'record-what-is-present-that-is-not-cardiac',
      'arrange-continuous-rhythm-monitoring', 'escalate-to-both-teams'] as const) {
      const prompt = rareEarlyMyocarditisInlinePrompt('guided', {
        scenarioVersion: '0.1.0', rareEarlyMyocarditis: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      engine.apply({ tick: 0, type: 'rare-early-myocarditis-response', payload: { action } });
      engine.step();
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      expect(text, 'no percentage').not.toMatch(/\d\s*(%|percent|per cent)/);
      expect(text, 'no per-thousand rate').not.toMatch(/per \d+/);
    }
  });

  it('is silent when unassisted and bound to the exact content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(rareEarlyMyocarditisInlinePrompt('unassisted', { scenarioVersion: '0.1.0', rareEarlyMyocarditis: patient })).toBeNull();
    expect(rareEarlyMyocarditisInlinePrompt('guided', { scenarioVersion: '0.1.1', rareEarlyMyocarditis: patient })).toBeNull();
  });
});
