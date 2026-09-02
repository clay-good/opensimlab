/**
 * The worked example and observed-state tutor for a seizure that got quieter
 * without stopping.
 *
 * The room feels better after the rescue care and that feeling is the hazard.
 * Both the tutor and the example say that quieter is not stopped before
 * anything else moves, and both escalate on visible movement rather than on an
 * EEG that does not exist here.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { FOCAL_MOTOR_STATUS_EPILEPTICUS_ESCALATION as SCENARIO } from '../../src/modules/neurology/scenarios/focal-motor-status-epilepticus-escalation';
import { FOCAL_MOTOR_STATUS_FIXTURES as FIXTURES } from '../../src/modules/neurology/focal-motor-status-epilepticus-escalation-fixtures';
import {
  FOCAL_MOTOR_STATUS_DEMONSTRATION_VERSION, focalMotorStatusDemonstrationStep,
  supportsFocalMotorStatusDemonstration,
} from '../../src/modules/neurology/demo/focal-motor-status-epilepticus-escalation-demonstration';
import { focalMotorStatusInlinePrompt } from '../../src/modules/neurology/tutor/focal-motor-status-epilepticus-escalation-guidance';
import type { FocalMotorStatusAction } from '../../src/modules/neurology/focal-motor-status-epilepticus-escalation';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyFocalMotorStatusAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: FocalMotorStatusAction) => {
  engine.apply({ tick, type: 'focal-motor-status-epilepticus-escalation-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = focalMotorStatusDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'focal-motor-status-epilepticus-escalation-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Says Quieter Is Not Stopped', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(FOCAL_MOTOR_STATUS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsFocalMotorStatusDemonstration(SCENARIO)).toBe(true);
    expect(supportsFocalMotorStatusDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsFocalMotorStatusDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'ownership', 'safety', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.ownershipAtTick!);
    expect(patient.ownershipAtTick).toBeLessThan(patient.safetyAtTick!);
    expect(patient.safetyAtTick).toBeLessThan(patient.laterAtTick!);
    expect(patient.laterAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('counts one continuous event rather than episodes', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('Not three episodes');
    expect(opening).toContain('one event, still running');
  });

  it('says quieter is not stopped before anything else moves', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('Less dramatic movement is not seizure resolution');
    expect(recognition).toContain('the room relaxes and the clock keeps running');
    expect(beats.indexOf('recognition')).toBeLessThan(beats.indexOf('ownership'));
  });

  it('escalates on visible movement without waiting for an EEG', () => {
    const ownership = narrations[beats.indexOf('ownership')]!;
    expect(ownership).toContain('without waiting for an EEG to agree');
    expect(ownership).toContain('converts a visible emergency into a scheduling problem');
    expect(patient.eegAcquiredByLearner).toBe(false);
  });

  it('runs the airway, glucose and cause alongside rather than instead', () => {
    const safety = narrations[beats.indexOf('safety')]!;
    expect(safety).toContain('alongside — not instead');
    expect(safety).toContain('removes one fast reversible cause and nothing else');
    expect(patient.qualifiedSeizureOwnershipActive).toBe(true);
    expect(patient.qualifiedAirwayOwnershipActive).toBe(true);
  });

  it('hands off a seizure that is still going', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the visible left face and arm clonus continues');
    expect(handoff).toContain('nothing here is a claim that anything worked');
    expect(narration).toContain('still seizing');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.nonconvulsiveStatusDiagnosedByLearner).toBe(false);
    expect(patient.causeProven).toBe(false);
    expect(patient.movementCessationProven).toBe(false);
    expect(patient.electrographicControlProven).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableNeurologicRecoveryProven).toBe(false);
    expect(patient.durableAirwayProtectionProven).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the seizure has stopped', 'she is postictal now', 'the movements have settled', 'this is nonepileptic']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('times nothing and selects no drug, dose, oxygen, or airway anywhere', () => {
    expect(patient.seizureTimedByLearner).toBe(false);
    expect(patient.eegInterpretedByLearner).toBe(false);
    expect(patient.glucoseAcquiredByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    expect(patient.oxygenSelectedByLearner).toBe(false);
    expect(patient.airwayDeviceSelectedByLearner).toBe(false);
    expect(patient.airwayProcedurePerformedByLearner).toBe(false);
    expect(patient.medicationDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 4 mg of lorazepam', 'load with levetiracetam', 'intubate her now', 'start a propofol infusion']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Names The Seizure Still Running', () => {
  it('opens by counting one continuous event', () => {
    const engine = create(); engine.step();
    const prompt = focalMotorStatusInlinePrompt('guided', {
      scenarioVersion: '0.1.0', focalMotorStatus: snapshot(engine),
    })!;
    expect(prompt.id).toBe('focal-motor-status-trajectory');
    expect(prompt.because).toContain('one event, still running');
  });

  it('says quieter is not stopped', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = focalMotorStatusInlinePrompt('guided', {
      scenarioVersion: '0.1.0', focalMotorStatus: snapshot(engine),
    })!;
    expect(prompt.id).toBe('focal-motor-status-recognition');
    expect(prompt.suggestion).toContain('quieter is not stopped');
    expect(prompt.because).toContain('Less dramatic movement is not seizure resolution');
    expect(prompt.because).toContain('the room relaxes and the clock keeps running');
  });

  it('escalates on visible movement without an EEG', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = focalMotorStatusInlinePrompt('guided', {
      scenarioVersion: '0.1.0', focalMotorStatus: snapshot(engine),
    })!;
    expect(prompt.id).toBe('focal-motor-status-ownership');
    expect(prompt.because).toContain('none is needed to act');
    expect(prompt.because).toContain('converts a visible emergency into a scheduling problem');
  });

  it('runs the safety review alongside rather than instead', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = focalMotorStatusInlinePrompt('guided', {
      scenarioVersion: '0.1.0', focalMotorStatus: snapshot(engine),
    })!;
    expect(prompt.id).toBe('focal-motor-status-safety');
    expect(prompt.because).toContain('removes one fast reversible cause and nothing else');
    expect(prompt.because).toContain('in parallel with the escalation');
  });

  it('never calls the seizure stopped, excludes a cause, or picks a drug', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = focalMotorStatusInlinePrompt('guided', {
        scenarioVersion: '0.1.0', focalMotorStatus: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the seizure has stopped', 'she is postictal now', 'this is nonepileptic', 'give 4 mg of lorazepam']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(focalMotorStatusInlinePrompt('guided', { scenarioVersion: '0.1.0', focalMotorStatus: patient })!.id)
      .toBe('focal-motor-status-later');
    expect(focalMotorStatusInlinePrompt('coached', { scenarioVersion: '0.1.0', focalMotorStatus: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(focalMotorStatusInlinePrompt('unassisted', { scenarioVersion: '0.1.0', focalMotorStatus: patient })).toBeNull();
    expect(focalMotorStatusInlinePrompt('guided', { scenarioVersion: '0.1.1', focalMotorStatus: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(focalMotorStatusInlinePrompt('guided', { scenarioVersion: '0.1.0', focalMotorStatus: snapshot(engine) })).toBeNull();
  });
});
