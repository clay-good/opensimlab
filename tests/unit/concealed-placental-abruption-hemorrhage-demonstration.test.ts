/**
 * The worked example and observed-state tutor for blood that is not on the
 * floor.
 *
 * Eighty millilitres has been collected and she is shocked, her fibrinogen has
 * fallen to 1.5 g/L, and the fetal trace is abnormal. Both the tutor and the
 * example believe the two patients over the bowl, and both refuse the scan as a
 * way to be sure.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { CONCEALED_PLACENTAL_ABRUPTION_HEMORRHAGE as SCENARIO } from '../../src/modules/obstetrics/scenarios/concealed-placental-abruption-hemorrhage';
import { CONCEALED_ABRUPTION_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/concealed-placental-abruption-hemorrhage-fixtures';
import {
  CONCEALED_ABRUPTION_DEMONSTRATION_VERSION, concealedAbruptionDemonstrationStep,
  supportsConcealedAbruptionDemonstration,
} from '../../src/modules/obstetrics/demo/concealed-placental-abruption-hemorrhage-demonstration';
import { concealedAbruptionInlinePrompt } from '../../src/modules/obstetrics/tutor/concealed-placental-abruption-hemorrhage-guidance';
import type { ConcealedAbruptionAction } from '../../src/modules/obstetrics/concealed-placental-abruption-hemorrhage';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsConcealedAbruptionAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: ConcealedAbruptionAction) => {
  engine.apply({ tick, type: 'concealed-placental-abruption-hemorrhage-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = concealedAbruptionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'concealed-placental-abruption-hemorrhage-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Believes The Physiology', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(CONCEALED_ABRUPTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsConcealedAbruptionDemonstration(SCENARIO)).toBe(true);
    expect(supportsConcealedAbruptionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsConcealedAbruptionDemonstration({
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

  it('believes the two patients over the collected volume', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('Believe the physiology over the eighty millilitres');
    expect(opening).toContain('Two people are showing you the same bleed.');
    expect(opening).toContain('the only part of it anyone can see');
  });

  it('refuses the scan and the visible volume, and closes nothing by naming it', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('do not send for a scan to be sure');
    expect(recognition).toContain('visible volume is not total loss');
    expect(recognition).toContain('a normal scan excludes nothing');
    expect(recognition).toContain('stay open behind the name');
    expect(patient.concealedHemorrhagePatternRecognized).toBe(true);
  });

  it('calls the room for two patients at once', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('all start together rather than in sequence');
    expect(support).toContain('the slowest to arrange');
    expect(support).toContain('rather than courtesies added to it');
    expect(beats.indexOf('support')).toBeLessThan(beats.indexOf('evidence'));
    expect(patient.qualifiedSupportActive).toBe(true);
  });

  it('reads the coagulation as part of the bleed rather than beside it', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('usually well above 4');
    expect(evidence).toContain('belongs to the hemorrhage rather than sitting beside it');
    expect(evidence).toContain('none of it excludes the competing causes');
    expect(patient.maternalFetalCoagulationPlacentalAndDifferentialEvidenceReviewed).toBe(true);
  });

  it('reads the better maternal numbers against a fetus that has not recovered', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('none of which quantifies the concealed loss');
    expect(handoff).toContain('because it has not');
    expect(narration).toContain('This ends the example, not the hemorrhage.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.concealedLossQuantified).toBe(false);
    expect(patient.coagulationSafetyProven).toBe(false);
    expect(patient.fetalRecoveryProven).toBe(false);
    expect(patient.deliveryCompleted).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.fertilityOutcomePredicted).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.responseStateAuthored).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she has lost', 'the fetus is recovering', 'she is out of danger', 'this is not a rupture']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('measures nothing, scans nothing, and selects no treatment or delivery', () => {
    expect(patient.bloodLossMeasuredByLearner).toBe(false);
    expect(patient.totalBloodLossCalculatedByLearner).toBe(false);
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.fetalTraceInterpretedByLearner).toBe(false);
    expect(patient.ultrasoundAcquiredByLearner).toBe(false);
    expect(patient.ultrasoundInterpretedByLearner).toBe(false);
    expect(patient.bloodSampleAcquiredByLearner).toBe(false);
    expect(patient.coagulationInterpretedByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.alternativeExcludedByLearner).toBe(false);
    expect(patient.fluidSelectedByLearner).toBe(false);
    expect(patient.bloodComponentSelectedByLearner).toBe(false);
    expect(patient.anesthesiaSelectedByLearner).toBe(false);
    expect(patient.deliverySelectedByLearner).toBe(false);
    expect(patient.procedureSelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.deliveryPerformedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['scan her', 'give fibrinogen', 'take her for a caesarean', 'weigh the swabs']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Believes The Physiology', () => {
  it('opens by believing the physiology over the bowl', () => {
    const engine = create(); engine.step();
    const prompt = concealedAbruptionInlinePrompt('guided', { scenarioVersion: '0.1.0', concealedAbruption: snapshot(engine) })!;
    expect(prompt.id).toBe('abruption-trajectory');
    expect(prompt.suggestion).toContain('Believe the physiology over the eighty millilitres');
    expect(prompt.because).toContain('Two people are showing you the same bleed.');
  });

  it('refuses the scan and the visible volume together', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = concealedAbruptionInlinePrompt('guided', { scenarioVersion: '0.1.0', concealedAbruption: snapshot(engine) })!;
    expect(prompt.id).toBe('abruption-recognition');
    expect(prompt.suggestion).toContain('do not send for a scan to be sure');
    expect(prompt.because).toContain('visible volume is not total loss');
    expect(prompt.because).toContain('a normal scan excludes nothing');
  });

  it('calls the blood bank and the neonatal team with everyone else', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = concealedAbruptionInlinePrompt('guided', { scenarioVersion: '0.1.0', concealedAbruption: snapshot(engine) })!;
    expect(prompt.id).toBe('abruption-support');
    expect(prompt.suggestion).toContain('Bring the room for two patients at once');
    expect(prompt.because).toContain('the slowest to arrange');
  });

  it('keeps the competing causes open during the evidence review', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = concealedAbruptionInlinePrompt('guided', { scenarioVersion: '0.1.0', concealedAbruption: snapshot(engine) })!;
    expect(prompt.id).toBe('abruption-evidence');
    expect(prompt.because).toContain('usually well above 4');
    expect(prompt.because).toContain('none of it excludes the competing causes');
  });

  it('never quantifies the loss, declares the fetus recovering, or picks a delivery', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = concealedAbruptionInlinePrompt('guided', { scenarioVersion: '0.1.0', concealedAbruption: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['she has lost', 'the fetus is recovering', 'take her for a caesarean', 'she is out of danger']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(concealedAbruptionInlinePrompt('guided', { scenarioVersion: '0.1.0', concealedAbruption: patient })!.id).toBe('abruption-reassess');
    expect(concealedAbruptionInlinePrompt('coached', { scenarioVersion: '0.1.0', concealedAbruption: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(concealedAbruptionInlinePrompt('unassisted', { scenarioVersion: '0.1.0', concealedAbruption: patient })).toBeNull();
    expect(concealedAbruptionInlinePrompt('guided', { scenarioVersion: '0.1.1', concealedAbruption: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(concealedAbruptionInlinePrompt('guided', { scenarioVersion: '0.1.0', concealedAbruption: snapshot(engine) })).toBeNull();
  });
});
