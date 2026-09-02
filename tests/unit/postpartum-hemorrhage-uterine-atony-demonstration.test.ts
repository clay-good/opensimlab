/**
 * The worked example and observed-state tutor for a number that has not
 * arrived yet.
 *
 * 650 mL is not a thousand, and waiting for a thousand is the error this lesson
 * refuses. Both the tutor and the example start from the heart rate and the
 * pressure rather than the volume, and both keep every competing cause open
 * behind the boggy uterus.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { POSTPARTUM_HEMORRHAGE_UTERINE_ATONY as SCENARIO } from '../../src/modules/obstetrics/scenarios/postpartum-hemorrhage-uterine-atony';
import { ATONY_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/postpartum-hemorrhage-uterine-atony-fixtures';
import {
  ATONY_DEMONSTRATION_VERSION, atonyDemonstrationStep, supportsAtonyDemonstration,
} from '../../src/modules/obstetrics/demo/postpartum-hemorrhage-uterine-atony-demonstration';
import { atonyInlinePrompt } from '../../src/modules/obstetrics/tutor/postpartum-hemorrhage-uterine-atony-guidance';
import type { AtonyAction } from '../../src/modules/obstetrics/postpartum-hemorrhage-uterine-atony';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsAtonyAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: AtonyAction) => {
  engine.apply({ tick, type: 'postpartum-hemorrhage-uterine-atony-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = atonyDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'postpartum-hemorrhage-uterine-atony-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Starts Before The Threshold', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(ATONY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAtonyDemonstration(SCENARIO)).toBe(true);
    expect(supportsAtonyDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsAtonyDemonstration({
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

  it('reads the physiology rather than the volume, and refuses the conversation as reassurance', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('Read the physiology rather than the volume');
    expect(opening).toContain('a heart rate of 118, a pressure of 94/58');
    expect(opening).toContain('compensates well and then stops compensating quickly');
  });

  it('refuses the threshold and the single cause in the same breath', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('a definition for counting cases, not a trigger for starting');
    expect(recognition).toContain('most likely without making it the only thing');
    expect(recognition).toContain('looked at rather than proven whole');
    expect(patient.postpartumHemorrhageAndAtonyPatternRecognized).toBe(true);
  });

  it('calls the whole room at once, dignity and newborn support included', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('all start together rather than in sequence');
    expect(support).toContain('the two slowest things to arrange');
    expect(support).toContain('rather than courtesies added to it');
    expect(beats.indexOf('support')).toBeLessThan(beats.indexOf('evidence'));
    expect(patient.qualifiedSupportActive).toBe(true);
  });

  it('keeps the competing causes alive while reviewing the evidence', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('treat the reassuring findings as reports');
    expect(evidence).toContain('None of it excludes concealed bleeding');
    expect(patient.uterinePlacentalTractCoagPerfusionAndDifferentialEvidenceReviewed).toBe(true);
  });

  it('reads the better numbers as an unfinished bleed', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('none of which proves the bundle did it');
    expect(narration).toContain('This ends the example, not the hemorrhage.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.durableHemostasisProven).toBe(false);
    expect(patient.coagulationSafetyProven).toBe(false);
    expect(patient.concealedBleedingExcluded).toBe(false);
    expect(patient.transfusionNeedDetermined).toBe(false);
    expect(patient.procedureNeedDetermined).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.fertilityOutcomePredicted).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.prognosisPredicted).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.responseStateAuthored).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the cause is atony', 'the bleeding has stopped', 'she is out of danger', 'her coagulation is fine']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('measures nothing, examines nothing, and selects no treatment', () => {
    expect(patient.bloodLossMeasuredByLearner).toBe(false);
    expect(patient.bloodLossCalculatedByLearner).toBe(false);
    expect(patient.patientHistoryTakenByLearner).toBe(false);
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.uterineToneExaminedByLearner).toBe(false);
    expect(patient.placentaExaminedByLearner).toBe(false);
    expect(patient.genitalTractExaminedByLearner).toBe(false);
    expect(patient.monitoringAcquiredByLearner).toBe(false);
    expect(patient.bloodSampleAcquiredByLearner).toBe(false);
    expect(patient.coagulationInterpretedByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.alternativeExcludedByLearner).toBe(false);
    expect(patient.massageSelectedByLearner).toBe(false);
    expect(patient.uterotonicSelectedByLearner).toBe(false);
    expect(patient.tranexamicAcidSelectedByLearner).toBe(false);
    expect(patient.bloodComponentSelectedByLearner).toBe(false);
    expect(patient.tamponadeSelectedByLearner).toBe(false);
    expect(patient.surgerySelectedByLearner).toBe(false);
    expect(patient.hysterectomySelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give oxytocin', 'start tranexamic acid', 'insert a balloon', 'weigh the swabs', 'examine the uterus']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Reads The Pulse Before The Volume', () => {
  it('opens on the physiology rather than the measured loss', () => {
    const engine = create(); engine.step();
    const prompt = atonyInlinePrompt('guided', { scenarioVersion: '0.1.0', atony: snapshot(engine) })!;
    expect(prompt.id).toBe('atony-trajectory');
    expect(prompt.suggestion).toContain('Read the physiology rather than the volume');
    expect(prompt.because).toContain('compensates well and then stops compensating quickly');
  });

  it('refuses the threshold and the single cause together', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = atonyInlinePrompt('guided', { scenarioVersion: '0.1.0', atony: snapshot(engine) })!;
    expect(prompt.id).toBe('atony-recognition');
    expect(prompt.suggestion).toContain('refuse both the threshold and the single cause');
    expect(prompt.because).toContain('a definition for counting cases, not a trigger for starting');
    expect(prompt.because).toContain('looked at rather than proven whole');
  });

  it('calls the blood bank and the theatre with everyone else', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = atonyInlinePrompt('guided', { scenarioVersion: '0.1.0', atony: snapshot(engine) })!;
    expect(prompt.id).toBe('atony-support');
    expect(prompt.suggestion).toContain('Bring the whole room at once');
    expect(prompt.because).toContain('the two slowest things to arrange');
  });

  it('keeps the causes coupled during the evidence review', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = atonyInlinePrompt('guided', { scenarioVersion: '0.1.0', atony: snapshot(engine) })!;
    expect(prompt.id).toBe('atony-evidence');
    expect(prompt.because).toContain('None of it excludes concealed bleeding');
    expect(prompt.because).toContain('no laboratory value here is a decision');
  });

  it('never names a sole cause, declares the bleeding stopped, or picks a uterotonic', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = atonyInlinePrompt('guided', { scenarioVersion: '0.1.0', atony: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the cause is atony', 'the bleeding has stopped', 'give oxytocin', 'she is out of danger']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(atonyInlinePrompt('guided', { scenarioVersion: '0.1.0', atony: patient })!.id).toBe('atony-reassess');
    expect(atonyInlinePrompt('coached', { scenarioVersion: '0.1.0', atony: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(atonyInlinePrompt('unassisted', { scenarioVersion: '0.1.0', atony: patient })).toBeNull();
    expect(atonyInlinePrompt('guided', { scenarioVersion: '0.1.1', atony: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(atonyInlinePrompt('guided', { scenarioVersion: '0.1.0', atony: snapshot(engine) })).toBeNull();
  });
});
