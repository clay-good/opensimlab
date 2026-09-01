/**
 * The worked example and observed-state tutor for a frightening room.
 *
 * Two habits go wrong at this bedside and they pull in opposite directions:
 * treating the pressure and the rate as numbers to be lowered on their own, and
 * treating a frightened man as a problem to be controlled. Both the tutor and
 * the example name the pattern before the room mobilizes and put de-escalation,
 * sedation and cooling in one beat, because they are one intervention.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SYMPATHOMIMETIC_HYPERADRENERGIC_HYPERTHERMIA as SCENARIO } from '../../src/modules/toxicology/scenarios/sympathomimetic-hyperadrenergic-hyperthermia';
import { SYMPATHOMIMETIC_FIXTURES as FIXTURES } from '../../src/modules/toxicology/sympathomimetic-hyperadrenergic-hyperthermia-fixtures';
import {
  SYMPATHOMIMETIC_DEMONSTRATION_VERSION, sympathomimeticDemonstrationStep,
  supportsSympathomimeticDemonstration,
} from '../../src/modules/toxicology/demo/sympathomimetic-hyperadrenergic-hyperthermia-demonstration';
import { sympathomimeticInlinePrompt } from '../../src/modules/toxicology/tutor/sympathomimetic-hyperadrenergic-hyperthermia-guidance';
import type { SympathomimeticAction } from '../../src/modules/toxicology/sympathomimetic-hyperadrenergic-hyperthermia';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologySympathomimeticAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: SympathomimeticAction) => {
  engine.apply({ tick, type: 'sympathomimetic-hyperadrenergic-hyperthermia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = sympathomimeticDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'sympathomimetic-hyperadrenergic-hyperthermia-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Names It Before The Room Mobilizes', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(SYMPATHOMIMETIC_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsSympathomimeticDemonstration(SCENARIO)).toBe(true);
    expect(supportsSympathomimeticDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsSympathomimeticDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognize', 'support', 'evidence', 'report', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.supportAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('reads one surge rather than three numbers', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('they are one surge');
    expect(opening).toContain('rather than a separate behavior');
  });

  it('refuses all five early closures and keeps the skin and the gut as discriminators', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('no toxicology screen, pupil, pressure, temperature, pulse or behavior');
    expect(recognize).toContain('between the serotonergic bedside and the dry, quiet anticholinergic one');
    expect(recognize).toContain('exclude nothing on their own');
  });

  it('treats de-escalation, sedation and cooling as one intervention', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('one intervention here rather than three');
    expect(support).toContain('A frightened man is not a security problem');
    expect(beats.indexOf('recognize')).toBeLessThan(beats.indexOf('support'));
  });

  it('keeps the pressure attached to the surge and determines no eligibility', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('The pressure belongs to the catecholamines');
    expect(evidence).toContain('not a number to be attacked on its own');
    expect(patient.adjunctEligibilityDetermined).toBe(false);
  });

  it('hands off the man rather than the improved observations', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('Hand off the man rather than the improved observations');
    expect(handoff).toContain('none of this proves the sedation did it');
    expect(narration).toContain('still ahead of him');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.alternativeExcludedByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableTemperatureControlProven).toBe(false);
    expect(patient.durablePressureControlProven).toBe(false);
    expect(patient.psychiatricSafetyProven).toBe(false);
    expect(patient.cardiacSafetyProven).toBe(false);
    expect(patient.renalSafetyProven).toBe(false);
    expect(patient.rhabdomyolysisExcluded).toBe(false);
    expect(patient.seizureExcluded).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['he is stable now', 'the pressure is controlled', 'this is not serotonin toxicity', 'the sedation worked']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('selects no restraint, cooling method, sedative, antihypertensive, dose, or route anywhere', () => {
    expect(patient.restraintSelectedByLearner).toBe(false);
    expect(patient.coolingSelectedByLearner).toBe(false);
    expect(patient.fluidSelectedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    expect(patient.cardiovascularTherapySelectedByLearner).toBe(false);
    expect(patient.temperatureMeasuredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['put him in four-point restraints', 'give 5 mg of midazolam', 'start a nitroglycerin infusion', 'ice packs to the groin']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Reads One Surge', () => {
  it('opens on the surge rather than the numbers', () => {
    const engine = create(); engine.step();
    const prompt = sympathomimeticInlinePrompt('guided', {
      scenarioVersion: '0.1.0', sympathomimetic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('sympathomimetic-trajectory');
    expect(prompt.because).toContain('They are one surge');
  });

  it('refuses the five closures and names the discriminators', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = sympathomimeticInlinePrompt('guided', {
      scenarioVersion: '0.1.0', sympathomimetic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('sympathomimetic-recognize');
    expect(prompt.because).toContain('no toxicology screen, pupil, pressure, temperature, pulse or behavior');
    expect(prompt.because).toContain('they exclude nothing on their own');
  });

  it('names the calm as the intervention rather than a courtesy', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = sympathomimeticInlinePrompt('guided', {
      scenarioVersion: '0.1.0', sympathomimetic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('sympathomimetic-support');
    expect(prompt.because).toContain('one intervention here rather than three');
    expect(prompt.because).toContain('A frightened man is not a security problem');
  });

  it('keeps the pressure attached to the surge and the acidosis his own work', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = sympathomimeticInlinePrompt('guided', {
      scenarioVersion: '0.1.0', sympathomimetic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('sympathomimetic-evidence');
    expect(prompt.because).toContain('what a fighting, hot patient is putting into the blood');
    expect(prompt.because).toContain('not a number to be attacked on its own');
  });

  it('never excludes an alternative, determines eligibility, restrains him, or doses him', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = sympathomimeticInlinePrompt('guided', {
        scenarioVersion: '0.1.0', sympathomimetic: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is not serotonin toxicity', 'put him in four-point restraints', 'give 5 mg of midazolam', 'the pressure is controlled']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(sympathomimeticInlinePrompt('guided', { scenarioVersion: '0.1.0', sympathomimetic: patient })!.id)
      .toBe('sympathomimetic-observe');
    expect(sympathomimeticInlinePrompt('coached', { scenarioVersion: '0.1.0', sympathomimetic: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(sympathomimeticInlinePrompt('unassisted', { scenarioVersion: '0.1.0', sympathomimetic: patient })).toBeNull();
    expect(sympathomimeticInlinePrompt('guided', { scenarioVersion: '0.1.1', sympathomimetic: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(sympathomimeticInlinePrompt('guided', { scenarioVersion: '0.1.0', sympathomimetic: snapshot(engine) })).toBeNull();
  });
});
