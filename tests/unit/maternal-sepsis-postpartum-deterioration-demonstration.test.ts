/**
 * The worked example and observed-state tutor for an emergency that is already
 * fully assembled.
 *
 * Nothing here is waiting to be discovered, and the error this lesson refuses
 * is spending the next interval confirming what is already on the page — a
 * score, a culture, a named source. Both the tutor and the example separate the
 * fever from the failing organs, and both keep the noninfectious causes open
 * behind the name.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { MATERNAL_SEPSIS_POSTPARTUM_DETERIORATION as SCENARIO } from '../../src/modules/obstetrics/scenarios/maternal-sepsis-postpartum-deterioration';
import { MATERNAL_SEPSIS_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/maternal-sepsis-postpartum-deterioration-fixtures';
import {
  MATERNAL_SEPSIS_DEMONSTRATION_VERSION, maternalSepsisDemonstrationStep,
  supportsMaternalSepsisDemonstration,
} from '../../src/modules/obstetrics/demo/maternal-sepsis-postpartum-deterioration-demonstration';
import { maternalSepsisInlinePrompt } from '../../src/modules/obstetrics/tutor/maternal-sepsis-postpartum-deterioration-guidance';
import type { MaternalSepsisAction } from '../../src/modules/obstetrics/maternal-sepsis-postpartum-deterioration';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsMaternalSepsisAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: MaternalSepsisAction) => {
  engine.apply({ tick, type: 'maternal-sepsis-postpartum-deterioration-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = maternalSepsisDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'maternal-sepsis-postpartum-deterioration-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Wait To Be Sure', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(MATERNAL_SEPSIS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMaternalSepsisDemonstration(SCENARIO)).toBe(true);
    expect(supportsMaternalSepsisDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsMaternalSepsisDemonstration({
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

  it('separates the easy half of the picture from the urgent half', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('The infection is the easy half.');
    expect(opening).toContain('how little time there is');
    expect(opening).toContain('a creatinine that has doubled to 1.4');
  });

  it('refuses the score and the source, and closes nothing by naming it', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('do not wait for a score or a source');
    expect(recognition).toContain('compare populations rather than to permit treatment');
    expect(recognition).toContain('stay open behind the name');
    expect(patient.maternalSepsisEmergencyRecognized).toBe(true);
  });

  it('calls source control with everyone else rather than last', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('all start together rather than in sequence');
    expect(support).toContain('the one most often started last');
    expect(support).toContain('rather than courtesies added to it');
    expect(beats.indexOf('support')).toBeLessThan(beats.indexOf('evidence'));
    expect(patient.qualifiedSupportActive).toBe(true);
  });

  it('reads the supplied evidence as a boundary rather than an answer', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('None of that identifies the source');
    expect(evidence).toContain('no single value here is a decision');
    expect(patient.infectiousNoninfectiousPerfusionOrganAndSourceEvidenceReviewed).toBe(true);
  });

  it('reads the better numbers as an uncontrolled source', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('none of which proves the antimicrobials are working');
    expect(narration).toContain('This ends the example, not the sepsis.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.organRecoveryProven).toBe(false);
    expect(patient.sourceControlProven).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.responseStateAuthored).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the source is the uterus', 'the infection is under control', 'she is out of danger', 'this is not an embolism']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('scores nothing, acquires nothing, and selects no treatment', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.sepsisScoreCalculatedByLearner).toBe(false);
    expect(patient.monitoringAcquiredByLearner).toBe(false);
    expect(patient.cultureAcquiredByLearner).toBe(false);
    expect(patient.bloodSampleAcquiredByLearner).toBe(false);
    expect(patient.imagingAcquiredByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.alternativeExcludedByLearner).toBe(false);
    expect(patient.antimicrobialSelectedByLearner).toBe(false);
    expect(patient.fluidSelectedByLearner).toBe(false);
    expect(patient.vasopressorSelectedByLearner).toBe(false);
    expect(patient.sourceControlSelectedByLearner).toBe(false);
    expect(patient.procedureSelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give piperacillin', 'start norepinephrine', 'calculate the qsofa', 'take her to theatre']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Does Not Wait To Be Sure', () => {
  it('opens by separating the infection from the failing organs', () => {
    const engine = create(); engine.step();
    const prompt = maternalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalSepsis: snapshot(engine) })!;
    expect(prompt.id).toBe('sepsis-trajectory');
    expect(prompt.suggestion).toContain('in the same view before anything else');
    expect(prompt.because).toContain('The infection is the easy half.');
  });

  it('refuses the score and the source together', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = maternalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalSepsis: snapshot(engine) })!;
    expect(prompt.id).toBe('sepsis-recognition');
    expect(prompt.suggestion).toContain('do not wait for a score or a source');
    expect(prompt.because).toContain('compare populations rather than to permit treatment');
    expect(prompt.because).toContain('stay open behind the name');
  });

  it('calls source control and microbiology with everyone else', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = maternalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalSepsis: snapshot(engine) })!;
    expect(prompt.id).toBe('sepsis-support');
    expect(prompt.suggestion).toContain('Bring every owner at once');
    expect(prompt.because).toContain('the one most often started last');
  });

  it('keeps the noninfectious causes open during the evidence review', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = maternalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalSepsis: snapshot(engine) })!;
    expect(prompt.id).toBe('sepsis-evidence');
    expect(prompt.because).toContain('none of it excludes the noninfectious causes');
    expect(prompt.because).toContain('no single value here is a decision');
  });

  it('never names the source, declares the infection controlled, or picks an antimicrobial', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = maternalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalSepsis: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the source is the uterus', 'the infection is under control', 'give piperacillin', 'she is out of danger']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(maternalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalSepsis: patient })!.id).toBe('sepsis-reassess');
    expect(maternalSepsisInlinePrompt('coached', { scenarioVersion: '0.1.0', maternalSepsis: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(maternalSepsisInlinePrompt('unassisted', { scenarioVersion: '0.1.0', maternalSepsis: patient })).toBeNull();
    expect(maternalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.1', maternalSepsis: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(maternalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalSepsis: snapshot(engine) })).toBeNull();
  });
});
