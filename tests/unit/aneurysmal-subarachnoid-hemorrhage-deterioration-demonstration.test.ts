/**
 * The worked example and observed-state tutor for a diagnosis the imaging
 * cannot make.
 *
 * The narrowing and the delayed perfusion support delayed cerebral ischemia and
 * cannot establish it, and the one-hour duration in the research definition
 * exists so studies can count cases rather than so bedsides can wait. Both the
 * tutor and the example walk the alternatives first and refuse both shortcuts.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ANEURYSMAL_SUBARACHNOID_HEMORRHAGE_DETERIORATION as SCENARIO } from '../../src/modules/neurology/scenarios/aneurysmal-subarachnoid-hemorrhage-deterioration';
import { ASAH_FIXTURES as FIXTURES } from '../../src/modules/neurology/aneurysmal-subarachnoid-hemorrhage-deterioration-fixtures';
import {
  ASAH_DEMONSTRATION_VERSION, asahDemonstrationStep,
  supportsAsahDemonstration,
} from '../../src/modules/neurology/demo/aneurysmal-subarachnoid-hemorrhage-deterioration-demonstration';
import { asahInlinePrompt } from '../../src/modules/neurology/tutor/aneurysmal-subarachnoid-hemorrhage-deterioration-guidance';
import type { AsahAction } from '../../src/modules/neurology/aneurysmal-subarachnoid-hemorrhage-deterioration';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyAsahAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: AsahAction) => {
  engine.apply({ tick, type: 'aneurysmal-subarachnoid-hemorrhage-deterioration-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = asahDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'aneurysmal-subarachnoid-hemorrhage-deterioration-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Refuses Both Shortcuts', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(ASAH_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAsahDemonstration(SCENARIO)).toBe(true);
    expect(supportsAsahDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsAsahDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'evidence', 'boundary', 'ownership', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.evidenceAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.boundaryAtTick!);
    expect(patient.boundaryAtTick).toBeLessThan(patient.ownershipAtTick!);
    expect(patient.ownershipAtTick).toBeLessThan(patient.laterAtTick!);
    expect(patient.laterAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('says the day out loud as the reason this is expected', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('Day 7');
    expect(opening).toContain('the thing the whole week has been watched for');
  });

  it('walks the alternatives and keeps each negative attached to its window', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('assumed away');
    expect(evidence).toContain('that is this scan, not the next hour');
    expect(beats.indexOf('evidence')).toBeLessThan(beats.indexOf('boundary'));
  });

  it('refuses the imaging shortcut and the research clock', () => {
    const boundary = narrations[beats.indexOf('boundary')]!;
    expect(boundary).toContain('support this and cannot establish it');
    expect(boundary).toContain('so studies can count cases');
    expect(boundary).toContain('costs her the interval');
    expect(patient.dciDiagnosedByLearner).toBe(false);
  });

  it('activates ownership on a suspicion rather than a confirmation', () => {
    const ownership = narrations[beats.indexOf('ownership')]!;
    expect(ownership).toContain('while the deficit is still young');
    expect(ownership).toContain('rather than on a confirmed diagnosis');
    expect(patient.qualifiedNeurocriticalOwnershipActive).toBe(true);
    expect(patient.qualifiedNeurovascularOwnershipActive).toBe(true);
    expect(patient.qualifiedRescueOwnershipActive).toBe(true);
  });

  it('keeps the captured EEG window a window', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('a window, not a permanent exclusion');
    expect(handoff).toContain('the arm that drifted now falls to the bed');
    expect(narration).toContain('a suspicion that is still a suspicion');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.dciDiagnosedByLearner).toBe(false);
    expect(patient.dciFinallyProven).toBe(false);
    expect(patient.vasospasmProvenCausal).toBe(false);
    expect(patient.rebleedingExcluded).toBe(false);
    expect(patient.seizureExcluded).toBe(false);
    expect(patient.metabolicCauseExcluded).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableNeurologicRecoveryProven).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is delayed cerebral ischemia', 'the vasospasm caused it', 'wait an hour and reassess', 'a seizure has been ruled out']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('interprets nothing and selects no pressure, vasopressor, angioplasty, or airway anywhere', () => {
    expect(patient.imagingInterpretedByLearner).toBe(false);
    expect(patient.eegInterpretedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.fluidSelectedByLearner).toBe(false);
    expect(patient.bloodPressureTargetSelectedByLearner).toBe(false);
    expect(patient.vasopressorSelectedByLearner).toBe(false);
    expect(patient.angiographySelectedByLearner).toBe(false);
    expect(patient.angioplastySelectedByLearner).toBe(false);
    expect(patient.intraArterialTherapySelectedByLearner).toBe(false);
    expect(patient.airwayDeviceSelectedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['start induced hypertension', 'take her for angioplasty', 'give a fluid bolus of', 'target a pressure of']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Walks The Alternatives First', () => {
  it('opens on the day that makes this expected', () => {
    const engine = create(); engine.step();
    const prompt = asahInlinePrompt('guided', {
      scenarioVersion: '0.1.0', asah: snapshot(engine),
    })!;
    expect(prompt.id).toBe('asah-trajectory');
    expect(prompt.because).toContain('the thing the whole week has been watched for');
  });

  it('walks the alternatives before landing anywhere', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = asahInlinePrompt('guided', {
      scenarioVersion: '0.1.0', asah: snapshot(engine),
    })!;
    expect(prompt.id).toBe('asah-evidence');
    expect(prompt.suggestion).toContain('Walk the alternatives before you land anywhere');
    expect(prompt.because).toContain('rather than assumed away');
    expect(prompt.because).toContain('that is this scan, not the next hour');
  });

  it('refuses the imaging shortcut and the research clock', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = asahInlinePrompt('guided', {
      scenarioVersion: '0.1.0', asah: snapshot(engine),
    })!;
    expect(prompt.id).toBe('asah-boundary');
    expect(prompt.because).toContain('support this and cannot establish it');
    expect(prompt.because).toContain('so studies can count cases');
  });

  it('activates ownership on the word possible', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = asahInlinePrompt('guided', {
      scenarioVersion: '0.1.0', asah: snapshot(engine),
    })!;
    expect(prompt.id).toBe('asah-ownership');
    expect(prompt.because).toContain('The word this turns on is possible');
    expect(prompt.because).toContain('while the deficit is still young');
  });

  it('never diagnoses the ischemia, excludes a cause, or picks a rescue', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = asahInlinePrompt('guided', {
        scenarioVersion: '0.1.0', asah: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is delayed cerebral ischemia', 'the vasospasm caused it', 'wait an hour and reassess', 'take her for angioplasty']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(asahInlinePrompt('guided', { scenarioVersion: '0.1.0', asah: patient })!.id)
      .toBe('asah-later');
    expect(asahInlinePrompt('coached', { scenarioVersion: '0.1.0', asah: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(asahInlinePrompt('unassisted', { scenarioVersion: '0.1.0', asah: patient })).toBeNull();
    expect(asahInlinePrompt('guided', { scenarioVersion: '0.1.1', asah: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(asahInlinePrompt('guided', { scenarioVersion: '0.1.0', asah: snapshot(engine) })).toBeNull();
  });
});
