/**
 * The worked example and observed-state tutor for a seizure that has already
 * stopped.
 *
 * Most eclamptic convulsions stop on their own, so this one ending is the
 * ordinary course rather than reassurance. Both the tutor and the example build
 * for the next seizure, and both refuse the differential as a precondition for
 * the maternal response.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ECLAMPSIA_FIRST_SEIZURE_RESPONSE as SCENARIO } from '../../src/modules/obstetrics/scenarios/eclampsia-first-seizure-response';
import { ECLAMPSIA_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/eclampsia-first-seizure-response-fixtures';
import {
  ECLAMPSIA_DEMONSTRATION_VERSION, eclampsiaDemonstrationStep,
  supportsEclampsiaDemonstration,
} from '../../src/modules/obstetrics/demo/eclampsia-first-seizure-response-demonstration';
import { eclampsiaInlinePrompt } from '../../src/modules/obstetrics/tutor/eclampsia-first-seizure-response-guidance';
import type { EclampsiaAction } from '../../src/modules/obstetrics/eclampsia-first-seizure-response';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsEclampsiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: EclampsiaAction) => {
  engine.apply({ tick, type: 'eclampsia-first-seizure-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = eclampsiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'eclampsia-first-seizure-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Builds For The Next Seizure', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(ECLAMPSIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsEclampsiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsEclampsiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsEclampsiaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'support', 'evidence', 'reassess', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.supportAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.evidenceAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('reads the stopped seizure inside five hours of warning symptoms', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('Read the stopped seizure inside five hours of warning symptoms.');
    expect(opening).toContain('stopped on its own three minutes ago');
    expect(opening).toContain('what a fetus does after a maternal seizure');
  });

  it('refuses the pending tests, and closes nothing by naming it', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('let the dangerous alternatives stay open behind it');
    expect(recognition).toContain('does not need the pending imaging');
    expect(recognition).toContain('Naming it excludes nothing');
    expect(recognition).toContain('why the imaging still matters afterwards');
    expect(patient.eclampsiaEmergencyPatternRecognized).toBe(true);
  });

  it('builds for the next seizure rather than the one that has ended', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('Build for the next seizure');
    expect(support).toContain('with the cause review running beside them');
    expect(support).toContain('rather than evidence that it is over');
    expect(support).toContain('recurrence is the specific thing');
    expect(beats.indexOf('support')).toBeLessThan(beats.indexOf('evidence'));
    expect(patient.qualifiedSupportActive).toBe(true);
  });

  it('couples the fetus and the alternatives to the recovery', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('follows the maternal seizure rather than standing apart from it');
    expect(evidence).toContain('stay pending');
    expect(evidence).toContain('excludes a stroke');
    expect(patient.neurologicAirwayAspirationOrganFetalMetabolicToxicInfectiousAndTraumaEvidenceReviewed).toBe(true);
  });

  it('reads a quiet twenty minutes as no evidence of control', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('none of which establishes treatment effect');
    expect(handoff).toContain('her headache and visual symptoms persist');
    expect(narration).toContain('still able to convulse again');
    expect(narration).toContain('This ends the example, not the emergency.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableSeizureControlProven).toBe(false);
    expect(patient.durablePressureControlProven).toBe(false);
    expect(patient.neurologicRecoveryProven).toBe(false);
    expect(patient.organRecoveryProven).toBe(false);
    expect(patient.fetalSafetyProven).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.responseStateAuthored).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the seizure is over', 'this is not a stroke', 'she is out of danger', 'she will not seize again']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('times nothing, touches nothing, and selects no treatment or birth', () => {
    expect(patient.seizureTimedByLearner).toBe(false);
    expect(patient.injuryProtectionPerformedByLearner).toBe(false);
    expect(patient.patientPositionedByLearner).toBe(false);
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.airwayOrAspirationAssessedByLearner).toBe(false);
    expect(patient.fetalStatusInterpretedByLearner).toBe(false);
    expect(patient.bloodPressureMeasuredByLearner).toBe(false);
    expect(patient.glucoseMeasuredByLearner).toBe(false);
    expect(patient.laboratoryAcquiredByLearner).toBe(false);
    expect(patient.imagingOrEegAcquiredByLearner).toBe(false);
    expect(patient.imagingOrEegInterpretedByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.alternativeExcludedByLearner).toBe(false);
    expect(patient.magnesiumSelectedByLearner).toBe(false);
    expect(patient.antihypertensiveSelectedByLearner).toBe(false);
    expect(patient.antiseizureDrugSelectedByLearner).toBe(false);
    expect(patient.airwayOrVentilationSelectedByLearner).toBe(false);
    expect(patient.anesthesiaSelectedByLearner).toBe(false);
    expect(patient.deliverySelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.deliveryPerformedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['start magnesium', 'roll her onto her side', 'get a ct', 'deliver her now']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Builds For The Next Seizure', () => {
  it('opens on the seizure inside its warning symptoms', () => {
    const engine = create(); engine.step();
    const prompt = eclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', eclampsia: snapshot(engine) })!;
    expect(prompt.id).toBe('eclampsia-trajectory');
    expect(prompt.suggestion).toContain('Read the stopped seizure inside five hours of warning symptoms.');
    expect(prompt.because).toContain('what a fetus does after a maternal seizure');
  });

  it('refuses the pending tests and keeps the alternatives live', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = eclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', eclampsia: snapshot(engine) })!;
    expect(prompt.id).toBe('eclampsia-recognition');
    expect(prompt.suggestion).toContain('let the dangerous alternatives stay open behind it');
    expect(prompt.because).toContain('does not need the pending imaging');
    expect(prompt.because).toContain('Naming it excludes nothing');
  });

  it('builds for the recurrence with the cause work running beside it', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = eclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', eclampsia: snapshot(engine) })!;
    expect(prompt.id).toBe('eclampsia-support');
    expect(prompt.suggestion).toContain('Build for the next seizure');
    expect(prompt.because).toContain('rather than evidence that it is over');
  });

  it('couples the fetal sample to the maternal seizure', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = eclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', eclampsia: snapshot(engine) })!;
    expect(prompt.id).toBe('eclampsia-evidence');
    expect(prompt.because).toContain('follows the maternal seizure rather than standing apart from it');
    expect(prompt.because).toContain('excludes a stroke');
  });

  it('never declares the seizure over, excludes a stroke, or picks a drug', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = eclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', eclampsia: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the seizure is over', 'this is not a stroke', 'start magnesium', 'she is out of danger']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(eclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', eclampsia: patient })!.id).toBe('eclampsia-reassess');
    expect(eclampsiaInlinePrompt('coached', { scenarioVersion: '0.1.0', eclampsia: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(eclampsiaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', eclampsia: patient })).toBeNull();
    expect(eclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.1', eclampsia: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(eclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', eclampsia: snapshot(engine) })).toBeNull();
  });
});
