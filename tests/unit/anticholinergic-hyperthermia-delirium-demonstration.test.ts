/**
 * The worked example and observed-state tutor for a syndrome that is more
 * interesting than it is urgent, next to a temperature that is the reverse.
 *
 * The dilated pupils, the dry flushed skin, the picking at the air and the
 * palpable bladder are the clues. The emergency is 40.3°C. Both the tutor and
 * the example say the temperature first, give cooling an owner before the
 * diagnosis gets any more attention, and leave physostigmine as a
 * toxicologist-led eligibility question rather than a decision.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ANTICHOLINERGIC_HYPERTHERMIA_DELIRIUM as SCENARIO } from '../../src/modules/toxicology/scenarios/anticholinergic-hyperthermia-delirium';
import { ANTICHOLINERGIC_FIXTURES as FIXTURES } from '../../src/modules/toxicology/anticholinergic-hyperthermia-delirium-fixtures';
import {
  ANTICHOLINERGIC_DEMONSTRATION_VERSION, anticholinergicDemonstrationStep,
  supportsAnticholinergicDemonstration,
} from '../../src/modules/toxicology/demo/anticholinergic-hyperthermia-delirium-demonstration';
import { anticholinergicInlinePrompt } from '../../src/modules/toxicology/tutor/anticholinergic-hyperthermia-delirium-guidance';
import type { AnticholinergicAction } from '../../src/modules/toxicology/anticholinergic-hyperthermia-delirium';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologyAnticholinergicAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: AnticholinergicAction) => {
  engine.apply({ tick, type: 'anticholinergic-hyperthermia-delirium-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = anticholinergicDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'anticholinergic-hyperthermia-delirium-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Cools Before It Studies', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(ANTICHOLINERGIC_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAnticholinergicDemonstration(SCENARIO)).toBe(true);
    expect(supportsAnticholinergicDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsAnticholinergicDemonstration({
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

  it('says the temperature ahead of the more interesting findings', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('Say the temperature first');
    expect(opening).toContain('the part doing harm while you read it');
  });

  it('refuses all four early closures and keeps the absent sweating a discriminator', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('no single mnemonic, temperature, pupil or dry surface');
    expect(recognize).toContain('separates this from the sympathomimetic bedside next door');
    expect(recognize).toContain('excludes nothing on its own');
  });

  it('gives cooling an owner before the workup, and says why', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('time-dependent in a way the workup is not');
    expect(support).toContain('while a patient stays hot');
    expect(beats.indexOf('support')).toBeLessThan(beats.indexOf('evidence'));
  });

  it('leaves the antidote an eligibility question owned by a toxicologist', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('rather than answering it');
    expect(evidence).toContain('eligibility is toxicologist-led');
    expect(patient.antidoteEligibilityDetermined).toBe(false);
  });

  it('finishes on a lower temperature and an unfinished patient', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the urinary retention has not resolved');
    expect(handoff).toContain('that the temperature will stay down');
    expect(narration).toContain('still not passing urine');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.alternativeExcludedByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableTemperatureControlProven).toBe(false);
    expect(patient.renalSafetyProven).toBe(false);
    expect(patient.rhabdomyolysisExcluded).toBe(false);
    expect(patient.seizureExcluded).toBe(false);
    expect(patient.exposurePurityProven).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she is stable now', 'the temperature is controlled', 'this is not serotonin toxicity', 'the cooling worked']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('selects no cooling method, sedative, restraint, catheter, dose, or route anywhere', () => {
    expect(patient.coolingSelectedByLearner).toBe(false);
    expect(patient.restraintSelectedByLearner).toBe(false);
    expect(patient.catheterSelectedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    expect(patient.temperatureMeasuredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['ice packs to the groin', 'give 2 mg of lorazepam', 'pass a urinary catheter', 'give physostigmine']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Puts The Temperature First', () => {
  it('opens on the temperature rather than the syndrome', () => {
    const engine = create(); engine.step();
    const prompt = anticholinergicInlinePrompt('guided', {
      scenarioVersion: '0.1.0', anticholinergic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('anticholinergic-trajectory');
    expect(prompt.because).toContain('doing harm while you read it');
  });

  it('refuses the four closures and names the discriminator', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = anticholinergicInlinePrompt('guided', {
      scenarioVersion: '0.1.0', anticholinergic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('anticholinergic-recognize');
    expect(prompt.because).toContain('no single mnemonic, temperature, pupil or dry surface');
    expect(prompt.because).toContain('it excludes nothing on its own');
  });

  it('names the ordering as the shape of the lesson', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = anticholinergicInlinePrompt('guided', {
      scenarioVersion: '0.1.0', anticholinergic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('anticholinergic-support');
    expect(prompt.because).toContain('time-dependent in a way that the workup is not');
    expect(prompt.because).toContain('is the shape this lesson is about');
  });

  it('keeps physostigmine a question and the CK a risk', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = anticholinergicInlinePrompt('guided', {
      scenarioVersion: '0.1.0', anticholinergic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('anticholinergic-evidence');
    expect(prompt.because).toContain('rather than an answer to it');
    expect(prompt.because).toContain('a renal risk rather than a number');
  });

  it('never excludes an alternative, determines eligibility, or doses her', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = anticholinergicInlinePrompt('guided', {
        scenarioVersion: '0.1.0', anticholinergic: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is not serotonin toxicity', 'she is eligible for physostigmine', 'give 2 mg of lorazepam', 'the temperature is controlled']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(anticholinergicInlinePrompt('guided', { scenarioVersion: '0.1.0', anticholinergic: patient })!.id)
      .toBe('anticholinergic-observe');
    expect(anticholinergicInlinePrompt('coached', { scenarioVersion: '0.1.0', anticholinergic: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(anticholinergicInlinePrompt('unassisted', { scenarioVersion: '0.1.0', anticholinergic: patient })).toBeNull();
    expect(anticholinergicInlinePrompt('guided', { scenarioVersion: '0.1.1', anticholinergic: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(anticholinergicInlinePrompt('guided', { scenarioVersion: '0.1.0', anticholinergic: snapshot(engine) })).toBeNull();
  });
});
