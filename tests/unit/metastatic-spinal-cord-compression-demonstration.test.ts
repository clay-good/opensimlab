/**
 * The worked example and observed-state tutor for a window measured in how far
 * he can walk.
 *
 * The pain is three weeks old and the emergency is forty-eight hours old, and
 * he has not walked since the assessment. Both the tutor and the example name
 * the emergency before imaging confirms it, and treat the referral chain as the
 * slow part rather than the decision.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { METASTATIC_SPINAL_CORD_COMPRESSION as SCENARIO } from '../../src/modules/neurology/scenarios/metastatic-spinal-cord-compression';
import { MSCC_FIXTURES as FIXTURES } from '../../src/modules/neurology/metastatic-spinal-cord-compression-fixtures';
import {
  MSCC_DEMONSTRATION_VERSION, msccDemonstrationStep,
  supportsMsccDemonstration,
} from '../../src/modules/neurology/demo/metastatic-spinal-cord-compression-demonstration';
import { msccInlinePrompt } from '../../src/modules/neurology/tutor/metastatic-spinal-cord-compression-guidance';
import type { MsccAction } from '../../src/modules/neurology/metastatic-spinal-cord-compression';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyMsccAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: MsccAction) => {
  engine.apply({ tick, type: 'metastatic-spinal-cord-compression-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = msccDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'metastatic-spinal-cord-compression-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Arranges As Well As Decides', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(MSCC_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMsccDemonstration(SCENARIO)).toBe(true);
    expect(supportsMsccDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsMsccDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'ownership', 'boundary', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.ownershipAtTick!);
    expect(patient.ownershipAtTick).toBeLessThan(patient.boundaryAtTick!);
    expect(patient.boundaryAtTick).toBeLessThan(patient.laterAtTick!);
    expect(patient.laterAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('separates three weeks of pain from forty-eight hours of function', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('that is the warning');
    expect(opening).toContain('is a cord level, not a root');
  });

  it('names the emergency before imaging confirms it', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('before any scan confirms it');
    expect(recognition).toContain('no single one of those is sufficient on its own');
    expect(recognition).toContain('how much he can do when treatment starts');
    expect(patient.emergencyRecognizedBeforeImaging).toBe(true);
  });

  it('treats the referral chain as the slow part', () => {
    const ownership = narrations[beats.indexOf('ownership')]!;
    expect(ownership).toContain('longer here than almost anywhere');
    expect(ownership).toContain('not the same as arranging for it to happen');
    expect(beats.indexOf('recognition')).toBeLessThan(beats.indexOf('ownership'));
    expect(patient.qualifiedOwnershipActive).toBe(true);
  });

  it('requires the whole spine rather than the level that hurts', () => {
    const boundary = narrations[beats.indexOf('boundary')]!;
    expect(boundary).toContain('imaging only the level that hurts is how a second lesion gets missed');
    expect(boundary).toContain('he is not moved');
    expect(patient.qualifiedCareBoundaryReviewed).toBe(true);
  });

  it('shows why the whole spine was imaged, and calls none of it recovery', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('separate lumbar metastases that are not compressing anything');
    expect(handoff).toContain('call none of it recovery');
    expect(narration).toContain('legs that have not changed');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.neurologicRecoveryProven).toBe(false);
    expect(patient.definitiveTreatmentProven).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.prognosisPredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.laterQualifiedMriAuthored).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['he will walk again', 'the steroids fixed it', 'wait for the mri to confirm', 'image the thoracic spine only']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('moves nobody and orders no imaging or procedure anywhere', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.patientHistoryTakenByLearner).toBe(false);
    expect(patient.patientMovedByLearner).toBe(false);
    expect(patient.imagingOrderedByLearner).toBe(false);
    expect(patient.imagingInterpretedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.procedureSelectedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 16 mg of dexamethasone', 'sit him up', 'book the operating room', 'order the mri yourself']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Watches The Function', () => {
  it('opens by separating the pain from the function', () => {
    const engine = create(); engine.step();
    const prompt = msccInlinePrompt('guided', {
      scenarioVersion: '0.1.0', mscc: snapshot(engine),
    })!;
    expect(prompt.id).toBe('mscc-trajectory');
    expect(prompt.because).toContain('is a cord level, not a root');
  });

  it('names the emergency before any scan confirms it', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = msccInlinePrompt('guided', {
      scenarioVersion: '0.1.0', mscc: snapshot(engine),
    })!;
    expect(prompt.id).toBe('mscc-recognition');
    expect(prompt.suggestion).toContain('before any scan confirms it');
    expect(prompt.because).toContain('no single one of those is sufficient on its own');
    expect(prompt.because).toContain('That is why this cannot wait for imaging');
  });

  it('starts the referral chain and names it the slow part', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = msccInlinePrompt('guided', {
      scenarioVersion: '0.1.0', mscc: snapshot(engine),
    })!;
    expect(prompt.id).toBe('mscc-ownership');
    expect(prompt.because).toContain('before anyone knows which one it is');
    expect(prompt.because).toContain('the arranging is the slow part');
  });

  it('requires the whole spine', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = msccInlinePrompt('guided', {
      scenarioVersion: '0.1.0', mscc: snapshot(engine),
    })!;
    expect(prompt.id).toBe('mscc-boundary');
    expect(prompt.because).toContain('how a second lesion gets missed');
    expect(prompt.because).toContain('you are not moving him');
  });

  it('never promises walking, waits for the MRI, or picks a dose', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = msccInlinePrompt('guided', {
        scenarioVersion: '0.1.0', mscc: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['he will walk again', 'the steroids fixed it', 'wait for the mri to confirm', 'give 16 mg of dexamethasone']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(msccInlinePrompt('guided', { scenarioVersion: '0.1.0', mscc: patient })!.id)
      .toBe('mscc-later');
    expect(msccInlinePrompt('coached', { scenarioVersion: '0.1.0', mscc: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(msccInlinePrompt('unassisted', { scenarioVersion: '0.1.0', mscc: patient })).toBeNull();
    expect(msccInlinePrompt('guided', { scenarioVersion: '0.1.1', mscc: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(msccInlinePrompt('guided', { scenarioVersion: '0.1.0', mscc: snapshot(engine) })).toBeNull();
  });
});
