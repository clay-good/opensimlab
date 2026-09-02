/**
 * The worked example and observed-state tutor for the one lesson that responds
 * before it understands.
 *
 * There is no confirmatory test for amniotic fluid embolism, so the interval
 * spent working it out is the interval she does not have. Both the tutor and
 * the example call the room first and only then read the order of events — the
 * breathing and the circulation failed before the bleeding, which is the
 * reverse of a hemorrhage.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SUSPECTED_AMNIOTIC_FLUID_EMBOLISM_PATTERN as SCENARIO } from '../../src/modules/obstetrics/scenarios/suspected-amniotic-fluid-embolism-pattern';
import { AFE_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/suspected-amniotic-fluid-embolism-pattern-fixtures';
import {
  AFE_DEMONSTRATION_VERSION, afeDemonstrationStep,
  supportsAfeDemonstration,
} from '../../src/modules/obstetrics/demo/suspected-amniotic-fluid-embolism-pattern-demonstration';
import { afeInlinePrompt } from '../../src/modules/obstetrics/tutor/suspected-amniotic-fluid-embolism-pattern-guidance';
import type { AfeAction } from '../../src/modules/obstetrics/suspected-amniotic-fluid-embolism-pattern';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsAfeAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: AfeAction) => {
  engine.apply({ tick, type: 'suspected-amniotic-fluid-embolism-pattern-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = afeDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'suspected-amniotic-fluid-embolism-pattern-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Calls The Room First', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(AFE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAfeDemonstration(SCENARIO)).toBe(true);
    expect(supportsAfeDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsAfeDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'trajectory', 'recognition', 'evidence', 'reassess', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.trajectoryAtTick!);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.evidenceAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('calls everyone before the understanding, and says why', () => {
    expect(beats[0]).toBe('support');
    const support = narrations[0]!;
    expect(support).toContain('Call everyone first, before you have worked out what this is.');
    expect(support).toContain('the teaching rather than an accident of ordering');
    expect(support).toContain('There is no confirmatory test');
    expect(patient.qualifiedSupportActive).toBe(true);
  });

  it('then puts the events in the order they happened', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('the order they actually happened');
    expect(opening).toContain('the major visible bleeding started after that');
    expect(opening).toContain('The sequence is the finding.');
  });

  it('names the pattern by its order and refuses to close it', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('in a hemorrhage the order runs the other way');
    expect(recognition).toContain('do not explain a pressure of 74/42');
    expect(recognition).toContain('suspicion is not closure');
    expect(patient.suspectedAfePatternRecognizedWithoutClosure).toBe(true);
  });

  it('reads the coagulation as the second act of one event', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('is not dilution and is not consumption from bleeding');
    expect(evidence).toContain('that much fibrinogen has gone somewhere else');
    expect(evidence).toContain('rather than to a separate problem');
    expect(patient.cardiopulmonaryHemorrhageCoagulationAndDifferentialEvidenceReviewed).toBe(true);
  });

  it('ends on someone who is still collapsing', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('nothing here establishes treatment effect');
    expect(handoff).toContain('coagulopathy that is still progressing');
    expect(narration).toContain('which has no confirmatory test');
    expect(narration).toContain('This ends the example, not the event.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.respiratoryRecoveryProven).toBe(false);
    expect(patient.hemodynamicRecoveryProven).toBe(false);
    expect(patient.bleedingControlProven).toBe(false);
    expect(patient.coagulopathyControlProven).toBe(false);
    expect(patient.cardiacArrestOccurred).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.pulsePresentCardiorespiratoryCollapsePrecedingCoagulopathyPatternAuthored).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is an amniotic fluid embolism', 'the bleeding explains', 'she is out of danger', 'this is not anaphylaxis']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('touches nothing, measures nothing, and selects no treatment', () => {
    expect(patient.pulseAssessedByLearner).toBe(false);
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.bloodLossMeasuredByLearner).toBe(false);
    expect(patient.uterusOrGenitalTractAssessedByLearner).toBe(false);
    expect(patient.monitoringInterpretedByLearner).toBe(false);
    expect(patient.laboratoryAcquiredByLearner).toBe(false);
    expect(patient.laboratoryInterpretedByLearner).toBe(false);
    expect(patient.dicScoreCalculatedByLearner).toBe(false);
    expect(patient.imagingOrEchoAcquiredByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.alternativeExcludedByLearner).toBe(false);
    expect(patient.oxygenOrVentilationSelectedByLearner).toBe(false);
    expect(patient.fluidOrVasoactiveSelectedByLearner).toBe(false);
    expect(patient.bloodOrCoagulationProductSelectedByLearner).toBe(false);
    expect(patient.cprOrDefibrillationPerformedByLearner).toBe(false);
    expect(patient.ecmoSelectedByLearner).toBe(false);
    expect(patient.deliveryOrProcedureSelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give cryoprecipitate', 'start compressions', 'intubate her', 'weigh the swabs']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Calls The Room First', () => {
  it('opens by calling everyone before the understanding', () => {
    const engine = create(); engine.step();
    const prompt = afeInlinePrompt('guided', { scenarioVersion: '0.1.0', afe: snapshot(engine) })!;
    expect(prompt.id).toBe('afe-support');
    expect(prompt.suggestion).toContain('Call everyone first, before you have worked out what this is.');
    expect(prompt.because).toContain('There is no confirmatory test');
  });

  it('reads the order of events once the room is called', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = afeInlinePrompt('guided', { scenarioVersion: '0.1.0', afe: snapshot(engine) })!;
    expect(prompt.id).toBe('afe-trajectory');
    expect(prompt.suggestion).toContain('the order they actually happened');
    expect(prompt.because).toContain('The sequence is the finding.');
  });

  it('names the collapse-then-coagulopathy pattern without closing it', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = afeInlinePrompt('guided', { scenarioVersion: '0.1.0', afe: snapshot(engine) })!;
    expect(prompt.id).toBe('afe-recognition');
    expect(prompt.suggestion).toContain('without closing the diagnosis');
    expect(prompt.because).toContain('in a hemorrhage the order runs the other way');
  });

  it('reads the fibrinogen as part of the same event', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = afeInlinePrompt('guided', { scenarioVersion: '0.1.0', afe: snapshot(engine) })!;
    expect(prompt.id).toBe('afe-evidence');
    expect(prompt.because).toContain('that much fibrinogen has gone somewhere else');
    expect(prompt.because).toContain('excludes the alternatives');
  });

  it('never closes the diagnosis, blames the bleeding, or picks a product', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = afeInlinePrompt('guided', { scenarioVersion: '0.1.0', afe: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is an amniotic fluid embolism', 'the bleeding explains', 'give cryoprecipitate', 'she is out of danger']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(afeInlinePrompt('guided', { scenarioVersion: '0.1.0', afe: patient })!.id).toBe('afe-reassess');
    expect(afeInlinePrompt('coached', { scenarioVersion: '0.1.0', afe: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(afeInlinePrompt('unassisted', { scenarioVersion: '0.1.0', afe: patient })).toBeNull();
    expect(afeInlinePrompt('guided', { scenarioVersion: '0.1.1', afe: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(afeInlinePrompt('guided', { scenarioVersion: '0.1.0', afe: snapshot(engine) })).toBeNull();
  });
});
