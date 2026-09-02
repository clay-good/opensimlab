/**
 * The worked example and observed-state tutor for a patient who has already had
 * naloxone and is still not awake.
 *
 * The whole lesson turns on which endpoint was ever in danger. It was the
 * breathing, not the wakefulness. Both the tutor and the example say the
 * end-tidal CO2 first, give ventilation an owner rather than a third dose, and
 * refuse to let persistent sedation stand as proof of an adulterant or a
 * resistance. No veterinary antagonist appears anywhere in either.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { OPIOID_XYLAZINE_PERSISTENT_SEDATION as SCENARIO } from '../../src/modules/toxicology/scenarios/opioid-xylazine-persistent-sedation';
import { OPIOID_XYLAZINE_FIXTURES as FIXTURES } from '../../src/modules/toxicology/opioid-xylazine-persistent-sedation-fixtures';
import {
  OPIOID_XYLAZINE_DEMONSTRATION_VERSION, opioidXylazineDemonstrationStep,
  supportsOpioidXylazineDemonstration,
} from '../../src/modules/toxicology/demo/opioid-xylazine-persistent-sedation-demonstration';
import { opioidXylazineInlinePrompt } from '../../src/modules/toxicology/tutor/opioid-xylazine-persistent-sedation-guidance';
import type { OpioidXylazineAction } from '../../src/modules/toxicology/opioid-xylazine-persistent-sedation';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologyOpioidXylazineAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: OpioidXylazineAction) => {
  engine.apply({ tick, type: 'opioid-xylazine-persistent-sedation-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = opioidXylazineDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'opioid-xylazine-persistent-sedation-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Treats The Breathing', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(OPIOID_XYLAZINE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsOpioidXylazineDemonstration(SCENARIO)).toBe(true);
    expect(supportsOpioidXylazineDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsOpioidXylazineDemonstration({
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

  it('names the emergency as the breathing rather than the sedation', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('it is not her level of consciousness');
    expect(opening).toContain('The sedation is the striking part and the breathing is the dangerous one');
  });

  it('refuses all four early closures and denies that the screen can settle it', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('Pupils, the naloxone response, a routine screen and a wound');
    expect(recognize).toContain('neither establishes nor excludes xylazine');
    expect(recognize).toContain('is not evidence that naloxone failed');
  });

  it('gives ventilation an owner instead of another dose, and says what that dose costs', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('treats the wakefulness, which was never the emergency');
    expect(support).toContain('still cannot protect her airway');
    expect(support).toContain('treat her as a person');
  });

  it('reads the skin survey as a finding rather than an absence to go looking for', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('a finding rather than an absence of one to go looking for');
    expect(evidence).toContain('takes hypoglycemia off the table');
  });

  it('records no veterinary antagonist and says why', () => {
    const report = narrations[beats.indexOf('report')]!;
    expect(report).toContain('No veterinary alpha-2 antagonist is recorded');
    expect(report).toContain('supportive care is what the sedative part gets');
    expect(patient.veterinaryAntagonistSelectedByLearner).toBe(false);
  });

  it('finishes on the breathing that moved and the sedation that did not', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the endpoint that mattered moved');
    expect(handoff).toContain('proves nothing about an agent, a resistance or an adulterant');
    expect(narration).toContain('the shape of a good outcome here');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.alternativeExcludedByLearner).toBe(false);
    expect(patient.adulterantConfirmedByLearner).toBe(false);
    expect(patient.naloxoneResistanceProven).toBe(false);
    expect(patient.streetProductIdentifiedByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableVentilationProven).toBe(false);
    expect(patient.neurologicRecoveryProven).toBe(false);
    expect(patient.aspirationExcluded).toBe(false);
    expect(patient.withdrawalSafetyProven).toBe(false);
    expect(patient.woundSafetyProven).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is xylazine', 'she is naloxone resistant', 'the naloxone failed', 'she is safe to discharge']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('selects no antagonist, oxygen setting, dose, route, or wound treatment anywhere', () => {
    expect(patient.opioidAntagonistSelectedByLearner).toBe(false);
    expect(patient.oxygenSelectedByLearner).toBe(false);
    expect(patient.ventilationSelectedByLearner).toBe(false);
    expect(patient.airwaySelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    expect(patient.woundCareSelectedByLearner).toBe(false);
    expect(patient.skinExaminedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 0.4 mg of naloxone', 'give atipamezole', 'yohimbine', 'intubate her now']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Says Which Endpoint Was Ever In Danger', () => {
  it('opens on the end-tidal rather than the level of consciousness', () => {
    const engine = create(); engine.step();
    const prompt = opioidXylazineInlinePrompt('guided', {
      scenarioVersion: '0.1.0', opioidXylazine: snapshot(engine),
    })!;
    expect(prompt.id).toBe('opioid-xylazine-trajectory');
    expect(prompt.because).toContain('that is what will kill her in the next few minutes');
  });

  it('refuses the four closures and the screen as a settler', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = opioidXylazineInlinePrompt('guided', {
      scenarioVersion: '0.1.0', opioidXylazine: snapshot(engine),
    })!;
    expect(prompt.id).toBe('opioid-xylazine-recognize');
    expect(prompt.because).toContain('neither establishes nor excludes xylazine');
    expect(prompt.because).toContain('is not evidence that naloxone failed');
  });

  it('names what another dose costs', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = opioidXylazineInlinePrompt('guided', {
      scenarioVersion: '0.1.0', opioidXylazine: snapshot(engine),
    })!;
    expect(prompt.id).toBe('opioid-xylazine-support');
    expect(prompt.because).toContain('treats the wakefulness, which was never the emergency');
    expect(prompt.because).toContain('still cannot protect her airway');
  });

  it('separates what the numbers rule out from what they cannot speak to', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = opioidXylazineInlinePrompt('guided', {
      scenarioVersion: '0.1.0', opioidXylazine: snapshot(engine),
    })!;
    expect(prompt.id).toBe('opioid-xylazine-evidence');
    expect(prompt.because).toContain('takes hypoglycemia off the table');
    expect(prompt.because).toContain('a finding rather than an absence of one to go looking for');
  });

  it('never confirms the adulterant, proves resistance, or reaches for a veterinary antagonist', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = opioidXylazineInlinePrompt('guided', {
        scenarioVersion: '0.1.0', opioidXylazine: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is xylazine', 'she is naloxone resistant', 'give atipamezole', 'yohimbine']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(opioidXylazineInlinePrompt('guided', { scenarioVersion: '0.1.0', opioidXylazine: patient })!.id)
      .toBe('opioid-xylazine-observe');
    expect(opioidXylazineInlinePrompt('coached', { scenarioVersion: '0.1.0', opioidXylazine: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(opioidXylazineInlinePrompt('unassisted', { scenarioVersion: '0.1.0', opioidXylazine: patient })).toBeNull();
    expect(opioidXylazineInlinePrompt('guided', { scenarioVersion: '0.1.1', opioidXylazine: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(opioidXylazineInlinePrompt('guided', { scenarioVersion: '0.1.0', opioidXylazine: snapshot(engine) })).toBeNull();
  });
});
