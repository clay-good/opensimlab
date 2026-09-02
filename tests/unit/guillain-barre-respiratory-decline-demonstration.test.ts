/**
 * The worked example and observed-state tutor for a story so typical it stops
 * people looking.
 *
 * It shares the saturation trap with the myasthenic lesson and adds two things
 * that one does not have: a cord lesion that must be argued against before the
 * obvious answer closes, and dysautonomia as a third axis where the instruction
 * is to monitor rather than chase.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { GUILLAIN_BARRE_RESPIRATORY_DECLINE as SCENARIO } from '../../src/modules/neurology/scenarios/guillain-barre-respiratory-decline';
import { GBS_FIXTURES as FIXTURES } from '../../src/modules/neurology/guillain-barre-respiratory-decline-fixtures';
import {
  GBS_DEMONSTRATION_VERSION, gbsDemonstrationStep,
  supportsGbsDemonstration,
} from '../../src/modules/neurology/demo/guillain-barre-respiratory-decline-demonstration';
import { gbsInlinePrompt } from '../../src/modules/neurology/tutor/guillain-barre-respiratory-decline-guidance';
import type { GbsAction } from '../../src/modules/neurology/guillain-barre-respiratory-decline';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyGbsAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: GbsAction) => {
  engine.apply({ tick, type: 'guillain-barre-respiratory-decline-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = gbsDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'guillain-barre-respiratory-decline-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Asks What Else Does This', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(GBS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsGbsDemonstration(SCENARIO)).toBe(true);
    expect(supportsGbsDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsGbsDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'evidence', 'recognition', 'ownership', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.evidenceAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.ownershipAtTick!);
    expect(patient.ownershipAtTick).toBeLessThan(patient.laterAtTick!);
    expect(patient.laterAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('measures the ascent in days rather than in findings', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('the speed is the risk');
    expect(opening).toContain('what predicts where it goes next');
  });

  it('argues against the cord lesion before the obvious answer closes', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('what else does this');
    expect(evidence).toContain('The mimic that matters is a cord lesion');
    expect(evidence).toContain('no sensory level, no extensor plantar');
    expect(beats.indexOf('evidence')).toBeLessThan(beats.indexOf('recognition'));
  });

  it('calls the decline on the slope while the saturation is still 98%', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('while the saturation is still 98%');
    expect(recognition).toContain('normal until it is not');
    expect(recognition).toContain('No score and no single cutoff carries this decision');
    expect(patient.highRiskRespiratoryDeclineRecognized).toBe(true);
  });

  it('brings cardiac monitoring in and refuses to chase each value', () => {
    const ownership = narrations[beats.indexOf('ownership')]!;
    expect(ownership).toContain('The cardiac piece is the part that gets left off');
    expect(ownership).toContain('rather than a set of readings to correct one by one');
    expect(ownership).toContain('is the failure mode');
    expect(patient.qualifiedCardiacMonitoringOwnershipActive).toBe(true);
    expect(patient.qualifiedAirwayOwnershipActive).toBe(true);
  });

  it('hands off three problems rather than one', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('three live problems');
    expect(handoff).toContain('still probable rather than proven');
    expect(narration).toContain('three problems running at once');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.diagnosisProven).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.respiratoryArrestAuthored).toBe(false);
    expect(patient.durableNeurologicRecoveryProven).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.prognosisPredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is definitely guillain-barré', 'a cord lesion is excluded', 'treat each blood pressure', 'his saturation is reassuring']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('measures nothing and treats no rhythm, pressure, airway, or ventilation anywhere', () => {
    expect(patient.respiratoryMechanicsAcquiredByLearner).toBe(false);
    expect(patient.bloodGasAcquiredByLearner).toBe(false);
    expect(patient.csfAcquiredByLearner).toBe(false);
    expect(patient.cardiacMonitoringInterpretedByLearner).toBe(false);
    expect(patient.rhythmTreatmentDeliveredByLearner).toBe(false);
    expect(patient.pressureTreatmentDeliveredByLearner).toBe(false);
    expect(patient.oxygenSelectedByLearner).toBe(false);
    expect(patient.ventilationSelectedByLearner).toBe(false);
    expect(patient.airwayProcedurePerformedByLearner).toBe(false);
    expect(patient.medicationDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['intubate him now', 'give atropine for the bradycardia', 'start plasma exchange', 'treat the hypertension']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Excludes Before It Concludes', () => {
  it('opens on the speed of the ascent', () => {
    const engine = create(); engine.step();
    const prompt = gbsInlinePrompt('guided', {
      scenarioVersion: '0.1.0', gbs: snapshot(engine),
    })!;
    expect(prompt.id).toBe('gbs-trajectory');
    expect(prompt.because).toContain('what predicts where it goes next');
  });

  it('names the mimic and what argues against it', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = gbsInlinePrompt('guided', {
      scenarioVersion: '0.1.0', gbs: snapshot(engine),
    })!;
    expect(prompt.id).toBe('gbs-evidence');
    expect(prompt.suggestion).toContain('what else does this');
    expect(prompt.because).toContain('The mimic that matters is a cord lesion');
    expect(prompt.because).toContain('no sensory level, no extensor plantar');
  });

  it('calls the decline on the slope rather than a cutoff', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = gbsInlinePrompt('guided', {
      scenarioVersion: '0.1.0', gbs: snapshot(engine),
    })!;
    expect(prompt.id).toBe('gbs-recognition');
    expect(prompt.because).toContain('it is normal until it is not');
    expect(prompt.because).toContain('what carries it is the slope');
  });

  it('brings cardiac monitoring in and refuses to chase each value', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = gbsInlinePrompt('guided', {
      scenarioVersion: '0.1.0', gbs: snapshot(engine),
    })!;
    expect(prompt.id).toBe('gbs-ownership');
    expect(prompt.because).toContain('The cardiac piece is the part that gets left off');
    expect(prompt.because).toContain('rather than a set of readings to correct one by one');
  });

  it('never proves the diagnosis, excludes the mimic, or treats a value', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = gbsInlinePrompt('guided', {
        scenarioVersion: '0.1.0', gbs: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is definitely guillain-barré', 'a cord lesion is excluded', 'treat each blood pressure', 'intubate him now']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(gbsInlinePrompt('guided', { scenarioVersion: '0.1.0', gbs: patient })!.id)
      .toBe('gbs-later');
    expect(gbsInlinePrompt('coached', { scenarioVersion: '0.1.0', gbs: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(gbsInlinePrompt('unassisted', { scenarioVersion: '0.1.0', gbs: patient })).toBeNull();
    expect(gbsInlinePrompt('guided', { scenarioVersion: '0.1.1', gbs: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(gbsInlinePrompt('guided', { scenarioVersion: '0.1.0', gbs: snapshot(engine) })).toBeNull();
  });
});
