/**
 * The worked example and observed-state tutor for a shock whose most visible
 * number is not the one that matters.
 *
 * A rate of 42 invites a rate answer. Both the tutor and the example name the
 * presentation as shock rather than bradycardia, keep the glucose of 62 inside
 * the poisoning, read the failed atropine and first vasopressor as information,
 * and describe the 45-minute glucose and potassium as the therapy showing up in
 * the chart rather than as the patient improving.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { BETA_BLOCKER_CARDIOGENIC_SHOCK as SCENARIO } from '../../src/modules/toxicology/scenarios/beta-blocker-cardiogenic-shock';
import { BETA_BLOCKER_FIXTURES as FIXTURES } from '../../src/modules/toxicology/beta-blocker-cardiogenic-shock-fixtures';
import {
  BETA_BLOCKER_DEMONSTRATION_VERSION, betaBlockerDemonstrationStep,
  supportsBetaBlockerDemonstration,
} from '../../src/modules/toxicology/demo/beta-blocker-cardiogenic-shock-demonstration';
import { betaBlockerInlinePrompt } from '../../src/modules/toxicology/tutor/beta-blocker-cardiogenic-shock-guidance';
import type { BetaBlockerAction } from '../../src/modules/toxicology/beta-blocker-cardiogenic-shock';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologyBetaBlockerAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: BetaBlockerAction) => {
  engine.apply({ tick, type: 'beta-blocker-cardiogenic-shock-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = betaBlockerDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'beta-blocker-cardiogenic-shock-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Answers The Shock Rather Than The Rate', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(BETA_BLOCKER_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsBetaBlockerDemonstration(SCENARIO)).toBe(true);
    expect(supportsBetaBlockerDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsBetaBlockerDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognize', 'support', 'evidence', 'report', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.evidenceAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('refuses pulse-only and pacing-only closure', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('a pump that is not moving blood, not a clock running slow');
    expect(recognize).toContain('or on pacing');
  });

  it('keeps the low glucose inside the poisoning', () => {
    expect(narrations[beats.indexOf('recognize')])
      .toContain('belongs to this poisoning rather than sitting beside it');
    expect(narrations[beats.indexOf('trajectory')]).toContain('glucose 62');
  });

  it('reads the failed prior care as information', () => {
    expect(narrations[beats.indexOf('support')]).toContain('already been tried without success');
    expect(narrations[beats.indexOf('evidence')]).toContain('is information rather than a gap');
  });

  it('says what the treatment will do to the metabolic numbers', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('part of the treatment rather than a check on it');
    expect(narrations[beats.indexOf('handoff')])
      .toContain('the therapy showing up in the chart rather than the patient improving');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.ecgInterpretedByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durablePerfusionStabilityProven).toBe(false);
    expect(patient.glucoseStabilityProven).toBe(false);
    expect(patient.electrolyteStabilityProven).toBe(false);
    expect(patient.coingestionExcluded).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she is stable now', 'the shock has resolved', 'the insulin worked', 'no further risk']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('selects no pacing, dialysis, lipid, rescue, dose, or route anywhere', () => {
    expect(patient.pacingSelectedByLearner).toBe(false);
    expect(patient.dialysisSelectedByLearner).toBe(false);
    expect(patient.rescueSelectedByLearner).toBe(false);
    expect(patient.rescueEligibilityDetermined).toBe(false);
    expect(patient.airwaySelectedByLearner).toBe(false);
    expect(patient.glucoseOrElectrolyteSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['1 unit/kg/hour', 'pace her at', 'start lipid emulsion', 'give 5 mg of glucagon']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Will Not Answer The Rate', () => {
  it('opens on the pressure, the mentation and the glucose', () => {
    const engine = create(); engine.step();
    const prompt = betaBlockerInlinePrompt('guided', {
      scenarioVersion: '0.1.0', betaBlocker: snapshot(engine),
    })!;
    expect(prompt.id).toBe('beta-blocker-trajectory');
    expect(prompt.because).toContain('one of five findings here');
  });

  it('names the presentation as shock rather than bradycardia', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = betaBlockerInlinePrompt('guided', {
      scenarioVersion: '0.1.0', betaBlocker: snapshot(engine),
    })!;
    expect(prompt.id).toBe('beta-blocker-recognize');
    expect(prompt.because).toContain('not a clock running slow');
    expect(prompt.because).toContain('leaves the half that is killing her');
  });

  it('builds the room on the strength of what has already failed', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = betaBlockerInlinePrompt('guided', {
      scenarioVersion: '0.1.0', betaBlocker: snapshot(engine),
    })!;
    expect(prompt.id).toBe('beta-blocker-support');
    expect(prompt.because).toContain('rather than to try the next single thing');
  });

  it('names what the treatment does to the glucose and the potassium', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = betaBlockerInlinePrompt('guided', {
      scenarioVersion: '0.1.0', betaBlocker: snapshot(engine),
    })!;
    expect(prompt.id).toBe('beta-blocker-evidence');
    expect(prompt.because).toContain('part of the treatment rather than a check on it');
    expect(prompt.because).toContain('rather than at the arrest');
  });

  it('never calls her stable, doses her, or paces her', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = betaBlockerInlinePrompt('guided', {
        scenarioVersion: '0.1.0', betaBlocker: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['she is stable now', 'pace her at', '1 unit/kg/hour', 'the shock has resolved']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(betaBlockerInlinePrompt('guided', { scenarioVersion: '0.1.0', betaBlocker: patient })!.id)
      .toBe('beta-blocker-observe');
    expect(betaBlockerInlinePrompt('coached', { scenarioVersion: '0.1.0', betaBlocker: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(betaBlockerInlinePrompt('unassisted', { scenarioVersion: '0.1.0', betaBlocker: patient })).toBeNull();
    expect(betaBlockerInlinePrompt('guided', { scenarioVersion: '0.1.1', betaBlocker: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(betaBlockerInlinePrompt('guided', { scenarioVersion: '0.1.0', betaBlocker: snapshot(engine) })).toBeNull();
  });
});
