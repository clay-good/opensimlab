/**
 * The worked example and observed-state tutor for a hyperthermia the muscle is
 * making.
 *
 * The second serotonergic drug here is an antibiotic, which is why the
 * interaction gets missed, and the clonus is not only the diagnostic finding —
 * it is the furnace. Both the tutor and the example name the interaction first,
 * give cooling and sedation an owner before the antagonist gets a thought, and
 * leave serotonin-antagonist rescue a specialist-led eligibility question
 * rather than a decision.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SEROTONIN_TOXICITY_HYPERTHERMIA_CLONUS as SCENARIO } from '../../src/modules/toxicology/scenarios/serotonin-toxicity-hyperthermia-clonus';
import { SEROTONIN_FIXTURES as FIXTURES } from '../../src/modules/toxicology/serotonin-toxicity-hyperthermia-clonus-fixtures';
import {
  SEROTONIN_DEMONSTRATION_VERSION, serotoninDemonstrationStep,
  supportsSerotoninDemonstration,
} from '../../src/modules/toxicology/demo/serotonin-toxicity-hyperthermia-clonus-demonstration';
import { serotoninInlinePrompt } from '../../src/modules/toxicology/tutor/serotonin-toxicity-hyperthermia-clonus-guidance';
import type { SerotoninAction } from '../../src/modules/toxicology/serotonin-toxicity-hyperthermia-clonus';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologySerotoninAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: SerotoninAction) => {
  engine.apply({ tick, type: 'serotonin-toxicity-hyperthermia-clonus-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = serotoninDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'serotonin-toxicity-hyperthermia-clonus-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Cools Before It Reaches For The Antagonist', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(SEROTONIN_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsSerotoninDemonstration(SCENARIO)).toBe(true);
    expect(supportsSerotoninDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsSerotoninDemonstration({
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

  it('names the interaction whose second agent is an antibiotic', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('the second serotonergic drug is an antibiotic');
    expect(opening).toContain('monoamine oxidase inhibitor');
  });

  it('refuses all four early closures and keeps the gut and the legs as discriminators', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('no Hunter rule, clonus finding, temperature, pulse or medication list');
    expect(recognize).toContain('the opposite of the dry, quiet belly on the anticholinergic bedside next door');
    expect(recognize).toContain('exclude nothing on their own');
  });

  it('gives cooling and sedation an owner before the antagonist, and says why', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('the muscle is the furnace');
    expect(support).toContain('treats the name of the syndrome instead of the patient');
    expect(beats.indexOf('support')).toBeLessThan(beats.indexOf('evidence'));
  });

  it('leaves the rescue an eligibility question owned by a specialist', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('rather than in place of them');
    expect(evidence).toContain('does not determine her eligibility');
    expect(patient.rescueEligibilityDetermined).toBe(false);
  });

  it('finishes on a lower temperature and a clonus that is still there', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('still inducible');
    expect(handoff).toContain('the drugs outlast the half hour');
    expect(narration).toContain('with the clonus still inducible');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.alternativeExcludedByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableTemperatureControlProven).toBe(false);
    expect(patient.neuromuscularRecoveryProven).toBe(false);
    expect(patient.renalSafetyProven).toBe(false);
    expect(patient.rhabdomyolysisExcluded).toBe(false);
    expect(patient.seizureExcluded).toBe(false);
    expect(patient.exposureCompletenessProven).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she is stable now', 'the temperature is controlled', 'this is not neuroleptic malignant syndrome', 'the cooling worked']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('selects no cooling method, sedative, restraint, antagonist, dose, or route anywhere', () => {
    expect(patient.coolingSelectedByLearner).toBe(false);
    expect(patient.restraintSelectedByLearner).toBe(false);
    expect(patient.fluidSelectedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    expect(patient.neuromuscularBlockerSelectedByLearner).toBe(false);
    expect(patient.temperatureMeasuredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['ice packs to the groin', 'give 2 mg of lorazepam', 'give cyproheptadine', 'paralyse her']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Says The Interaction First', () => {
  it('opens on the antibiotic nobody reads as a serotonergic drug', () => {
    const engine = create(); engine.step();
    const prompt = serotoninInlinePrompt('guided', {
      scenarioVersion: '0.1.0', serotonin: snapshot(engine),
    })!;
    expect(prompt.id).toBe('serotonin-trajectory');
    expect(prompt.because).toContain('monoamine oxidase inhibitor');
  });

  it('refuses the four closures and names the discriminators', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = serotoninInlinePrompt('guided', {
      scenarioVersion: '0.1.0', serotonin: snapshot(engine),
    })!;
    expect(prompt.id).toBe('serotonin-recognize');
    expect(prompt.because).toContain('no Hunter rule, clonus finding, temperature, pulse or medication list');
    expect(prompt.because).toContain('they exclude nothing on their own');
  });

  it('names the ordering as the shape of the lesson', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = serotoninInlinePrompt('guided', {
      scenarioVersion: '0.1.0', serotonin: snapshot(engine),
    })!;
    expect(prompt.id).toBe('serotonin-support');
    expect(prompt.because).toContain('the muscle is the furnace');
    expect(prompt.because).toContain('treats the name of the syndrome instead of the patient');
  });

  it('keeps the antagonist an adjunct question and the CK muscle work', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = serotoninInlinePrompt('guided', {
      scenarioVersion: '0.1.0', serotonin: snapshot(engine),
    })!;
    expect(prompt.id).toBe('serotonin-evidence');
    expect(prompt.because).toContain('what the working muscle is putting into the blood');
    expect(prompt.because).toContain('rather than in place of them');
  });

  it('never excludes an alternative, determines eligibility, or doses her', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = serotoninInlinePrompt('guided', {
        scenarioVersion: '0.1.0', serotonin: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is not neuroleptic malignant syndrome', 'she is eligible for cyproheptadine', 'give 2 mg of lorazepam', 'the temperature is controlled']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(serotoninInlinePrompt('guided', { scenarioVersion: '0.1.0', serotonin: patient })!.id)
      .toBe('serotonin-observe');
    expect(serotoninInlinePrompt('coached', { scenarioVersion: '0.1.0', serotonin: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(serotoninInlinePrompt('unassisted', { scenarioVersion: '0.1.0', serotonin: patient })).toBeNull();
    expect(serotoninInlinePrompt('guided', { scenarioVersion: '0.1.1', serotonin: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(serotoninInlinePrompt('guided', { scenarioVersion: '0.1.0', serotonin: snapshot(engine) })).toBeNull();
  });
});
