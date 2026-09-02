/**
 * The worked example and observed-state tutor for an emergency that arrives
 * after everyone has gone home.
 *
 * She is six days past a term birth with no antepartum hypertension. Both the
 * tutor and the example start from what she has been reporting for four hours,
 * and both refuse the wait — for the urine protein and for the rest of the
 * laboratory.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { POSTPARTUM_SEVERE_PREECLAMPSIA_WARNING_SIGNS as SCENARIO } from '../../src/modules/obstetrics/scenarios/postpartum-severe-preeclampsia-warning-signs';
import { POSTPARTUM_PREECLAMPSIA_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/postpartum-severe-preeclampsia-warning-signs-fixtures';
import {
  POSTPARTUM_PREECLAMPSIA_DEMONSTRATION_VERSION, postpartumPreeclampsiaDemonstrationStep,
  supportsPostpartumPreeclampsiaDemonstration,
} from '../../src/modules/obstetrics/demo/postpartum-severe-preeclampsia-warning-signs-demonstration';
import { postpartumPreeclampsiaInlinePrompt } from '../../src/modules/obstetrics/tutor/postpartum-severe-preeclampsia-warning-signs-guidance';
import type { PostpartumPreeclampsiaAction } from '../../src/modules/obstetrics/postpartum-severe-preeclampsia-warning-signs';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsPostpartumPreeclampsiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PostpartumPreeclampsiaAction) => {
  engine.apply({ tick, type: 'postpartum-severe-preeclampsia-warning-signs-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = postpartumPreeclampsiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'postpartum-severe-preeclampsia-warning-signs-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Wait For The Urine', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(POSTPARTUM_PREECLAMPSIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPostpartumPreeclampsiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsPostpartumPreeclampsiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPostpartumPreeclampsiaDemonstration({
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

  it('starts from her own four-hour account rather than the monitor', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('Start from what she has been telling you for four hours.');
    expect(opening).toContain('the supplied history does not account for');
    expect(opening).toContain('none of which makes this less urgent');
  });

  it('refuses the urine protein and the wait, and closes nothing by naming it', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('do not wait for the urine protein');
    expect(recognition).toContain('sixty minutes from the first of them');
    expect(recognition).toContain('Proteinuria is not required');
    expect(recognition).toContain('stay open behind the name');
    expect(patient.severePostpartumHypertensiveEmergencyRecognized).toBe(true);
  });

  it('runs the cause work beside the protocol rather than before it', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('Start the protocol now');
    expect(support).toContain('continues in parallel');
    expect(support).toContain('allowed to move the treatment later');
    expect(support).toContain('rather than courtesies added to it');
    expect(beats.indexOf('support')).toBeLessThan(beats.indexOf('evidence'));
    expect(patient.qualifiedSupportActive).toBe(true);
  });

  it('reads the organ evidence as severe features rather than a pending workup', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('four organs speaking at once');
    expect(evidence).toContain('pending and stay pending');
    expect(evidence).toContain('excludes the alternatives');
    expect(patient.neurologicPulmonaryHematologicRenalHepaticMedicationAndDifferentialEvidenceReviewed).toBe(true);
  });

  it('reads a no-longer-severe pressure as no evidence of control', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('out of the severe range and still hypertensive');
    expect(handoff).toContain('no durable control, no target and no treatment effect');
    expect(narration).toContain('This ends the example, not the emergency.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durablePressureControlProven).toBe(false);
    expect(patient.symptomResolutionProven).toBe(false);
    expect(patient.seizureExcluded).toBe(false);
    expect(patient.organRecoveryProven).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.fertilityOutcomePredicted).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.responseStateAuthored).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['her pressure is controlled', 'the headache has resolved', 'she is out of danger', 'she will not seize']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('measures nothing, asks nothing, and selects no treatment', () => {
    expect(patient.bloodPressureMeasuredByLearner).toBe(false);
    expect(patient.cuffSelectedByLearner).toBe(false);
    expect(patient.patientInterviewedByLearner).toBe(false);
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.reflexesOrClonusAssessedByLearner).toBe(false);
    expect(patient.urineAssessedByLearner).toBe(false);
    expect(patient.laboratoryAcquiredByLearner).toBe(false);
    expect(patient.laboratoryInterpretedByLearner).toBe(false);
    expect(patient.scoreOrRatioCalculatedByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.alternativeExcludedByLearner).toBe(false);
    expect(patient.antihypertensiveSelectedByLearner).toBe(false);
    expect(patient.magnesiumSelectedByLearner).toBe(false);
    expect(patient.airwayOrSeizureCareSelectedByLearner).toBe(false);
    expect(patient.newbornSeparatedByLearner).toBe(false);
    expect(patient.feedingPlanSelectedByLearner).toBe(false);
    expect(patient.followUpSelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give labetalol', 'start magnesium', 'check her reflexes', 'send the urine']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Does Not Wait For The Urine', () => {
  it('opens on her own account rather than the monitor', () => {
    const engine = create(); engine.step();
    const prompt = postpartumPreeclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', postpartumPreeclampsia: snapshot(engine) })!;
    expect(prompt.id).toBe('preeclampsia-trajectory');
    expect(prompt.suggestion).toContain('Start from what she has been telling you for four hours.');
    expect(prompt.because).toContain('none of which makes this less urgent');
  });

  it('refuses the urine protein and names the sixty-minute clock', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = postpartumPreeclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', postpartumPreeclampsia: snapshot(engine) })!;
    expect(prompt.id).toBe('preeclampsia-recognition');
    expect(prompt.suggestion).toContain('do not wait for the urine protein');
    expect(prompt.because).toContain('sixty minutes from the first of them');
    expect(prompt.because).toContain('Proteinuria is not required');
  });

  it('starts the protocol with the cause work running beside it', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = postpartumPreeclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', postpartumPreeclampsia: snapshot(engine) })!;
    expect(prompt.id).toBe('preeclampsia-support');
    expect(prompt.suggestion).toContain('beside it rather than before it');
    expect(prompt.because).toContain('allowed to move the treatment later');
  });

  it('reads four organs at once and keeps the causes open', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = postpartumPreeclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', postpartumPreeclampsia: snapshot(engine) })!;
    expect(prompt.id).toBe('preeclampsia-evidence');
    expect(prompt.because).toContain('four organs speaking at once');
    expect(prompt.because).toContain('excludes the alternatives');
  });

  it('never declares control, resolution, or a chosen drug', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = postpartumPreeclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', postpartumPreeclampsia: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['her pressure is controlled', 'the headache has resolved', 'give labetalol', 'she is out of danger']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(postpartumPreeclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', postpartumPreeclampsia: patient })!.id).toBe('preeclampsia-reassess');
    expect(postpartumPreeclampsiaInlinePrompt('coached', { scenarioVersion: '0.1.0', postpartumPreeclampsia: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(postpartumPreeclampsiaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', postpartumPreeclampsia: patient })).toBeNull();
    expect(postpartumPreeclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.1', postpartumPreeclampsia: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(postpartumPreeclampsiaInlinePrompt('guided', { scenarioVersion: '0.1.0', postpartumPreeclampsia: snapshot(engine) })).toBeNull();
  });
});
