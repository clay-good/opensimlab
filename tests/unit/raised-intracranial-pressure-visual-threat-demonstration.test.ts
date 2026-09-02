/**
 * The worked example and observed-state tutor for an eye that reads 20/20 while
 * it is being lost.
 *
 * Acuity is the last measure to fail here: 20/20 with full colour and no
 * afferent defect while the fields already show early depression, and at
 * twenty-four hours the fields are constricted with the acuity unchanged. Both
 * the tutor and the example treat the visual field as the clock.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { RAISED_INTRACRANIAL_PRESSURE_VISUAL_THREAT as SCENARIO } from '../../src/modules/neurology/scenarios/raised-intracranial-pressure-visual-threat';
import { RAISED_ICP_FIXTURES as FIXTURES } from '../../src/modules/neurology/raised-intracranial-pressure-visual-threat-fixtures';
import {
  RAISED_ICP_DEMONSTRATION_VERSION, raisedIcpDemonstrationStep,
  supportsRaisedIcpDemonstration,
} from '../../src/modules/neurology/demo/raised-intracranial-pressure-visual-threat-demonstration';
import { raisedIcpInlinePrompt } from '../../src/modules/neurology/tutor/raised-intracranial-pressure-visual-threat-guidance';
import type { RaisedIcpAction } from '../../src/modules/neurology/raised-intracranial-pressure-visual-threat';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyRaisedIcpAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: RaisedIcpAction) => {
  engine.apply({ tick, type: 'raised-intracranial-pressure-visual-threat-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = raisedIcpDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'raised-intracranial-pressure-visual-threat-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Reads The Field, Not The Chart', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(RAISED_ICP_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsRaisedIcpDemonstration(SCENARIO)).toBe(true);
    expect(supportsRaisedIcpDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsRaisedIcpDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'ownership', 'eyes', 'diagnostics', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.ownershipAtTick!);
    expect(patient.ownershipAtTick).toBeLessThan(patient.eyesAtTick!);
    expect(patient.eyesAtTick).toBeLessThan(patient.diagnosticsAtTick!);
    expect(patient.diagnosticsAtTick).toBeLessThan(patient.laterAtTick!);
    expect(patient.laterAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('names the sixth-nerve palsy as a false localizing sign', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('false localizing sign');
    expect(opening).toContain('not where anything is');
  });

  it('treats neuro-ophthalmology as urgent rather than a follow-up', () => {
    const ownership = narrations[beats.indexOf('ownership')]!;
    expect(ownership).toContain('not a follow-up appointment');
    expect(ownership).toContain('in hours rather than in clinic');
    expect(beats.indexOf('ownership')).toBeLessThan(beats.indexOf('eyes'));
  });

  it('refuses to be reassured by the acuity', () => {
    const eyes = narrations[beats.indexOf('eyes')]!;
    expect(eyes).toContain('acuity is the last thing to go');
    expect(eyes).toContain('the field is the clock');
    expect(eyes).toContain('rather than pseudopapilledema');
    expect(beats.indexOf('eyes')).toBeLessThan(beats.indexOf('diagnostics'));
    expect(patient.confirmedPapilledemaReviewed).toBe(true);
  });

  it('makes the venogram the gate on the word idiopathic', () => {
    const diagnostics = narrations[beats.indexOf('diagnostics')]!;
    expect(diagnostics).toContain('before the word idiopathic is allowed near this');
    expect(diagnostics).toContain('demographics plus a number is not a diagnosis');
    expect(patient.qualifiedDiagnosticsReviewed).toBe(true);
    expect(patient.qualifiedOwnershipActive).toBe(true);
  });

  it('names what moved and what did not', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the acuity is still 20/20');
    expect(handoff).toContain('the measures people watch did not move and the one that matters did');
    expect(narration).toContain('seeing less of the room');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.visualRescueProven).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.herniationAuthored).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.prognosisPredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.laterVisualFieldDeteriorationAuthored).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is idiopathic intracranial hypertension', 'her vision is safe', 'the acuity is reassuring', 'the pressure confirms it']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('examines no eyes and selects no drug or procedure anywhere', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.patientHistoryTakenByLearner).toBe(false);
    expect(patient.ophthalmicTestInterpretedByLearner).toBe(false);
    expect(patient.imagingInterpretedByLearner).toBe(false);
    expect(patient.lumbarPuncturePerformedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.procedureSelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['start acetazolamide', 'do the lumbar puncture yourself', 'grade the papilledema', 'refer for shunting']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Watches The Field', () => {
  it('opens on the change rather than the five-week background', () => {
    const engine = create(); engine.step();
    const prompt = raisedIcpInlinePrompt('guided', {
      scenarioVersion: '0.1.0', raisedIcp: snapshot(engine),
    })!;
    expect(prompt.id).toBe('raised-icp-trajectory');
    expect(prompt.because).toContain('false localizing sign');
  });

  it('treats neuro-ophthalmology as urgent rather than a clinic referral', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = raisedIcpInlinePrompt('guided', {
      scenarioVersion: '0.1.0', raisedIcp: snapshot(engine),
    })!;
    expect(prompt.id).toBe('raised-icp-ownership');
    expect(prompt.suggestion).toContain('neuro-ophthalmology, imaging and procedure ownership');
    expect(prompt.because).toContain('not a follow-up appointment');
    expect(prompt.because).toContain('in hours rather than in clinic');
  });

  it('refuses to be reassured by the acuity', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = raisedIcpInlinePrompt('guided', {
      scenarioVersion: '0.1.0', raisedIcp: snapshot(engine),
    })!;
    expect(prompt.id).toBe('raised-icp-eyes');
    expect(prompt.because).toContain('acuity is the last thing to go');
    expect(prompt.because).toContain('the field is the clock');
  });

  it('gates the word idiopathic on the venogram', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = raisedIcpInlinePrompt('guided', {
      scenarioVersion: '0.1.0', raisedIcp: snapshot(engine),
    })!;
    expect(prompt.id).toBe('raised-icp-diagnostics');
    expect(prompt.because).toContain('before the word idiopathic is allowed near this');
    expect(prompt.because).toContain('demographics plus a number is not a diagnosis');
  });

  it('never calls it idiopathic, calls the vision safe, or picks a procedure', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = raisedIcpInlinePrompt('guided', {
        scenarioVersion: '0.1.0', raisedIcp: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is idiopathic intracranial hypertension', 'her vision is safe', 'the acuity is reassuring', 'start acetazolamide']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(raisedIcpInlinePrompt('guided', { scenarioVersion: '0.1.0', raisedIcp: patient })!.id)
      .toBe('raised-icp-later');
    expect(raisedIcpInlinePrompt('coached', { scenarioVersion: '0.1.0', raisedIcp: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(raisedIcpInlinePrompt('unassisted', { scenarioVersion: '0.1.0', raisedIcp: patient })).toBeNull();
    expect(raisedIcpInlinePrompt('guided', { scenarioVersion: '0.1.1', raisedIcp: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(raisedIcpInlinePrompt('guided', { scenarioVersion: '0.1.0', raisedIcp: snapshot(engine) })).toBeNull();
  });
});
