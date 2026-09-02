/**
 * The worked example and observed-state tutor for a woman whose own clearance
 * routine has stopped working.
 *
 * The secretions have not changed location; her ability to move them has. The
 * treatment is a physiotherapist supporting her routine, not a new one.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { BRONCHIECTASIS_MUCUS_PLUGGING_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/bronchiectasis-mucus-plugging-reassessment';
import { BRONCHIECTASIS_MUCUS_PLUGGING_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/bronchiectasis-mucus-plugging-reassessment-fixtures';
import {
  BRONCHIECTASIS_MUCUS_PLUGGING_DEMONSTRATION_VERSION, bronchiectasisMucusPluggingDemonstrationStep,
  supportsBronchiectasisMucusPluggingDemonstration,
} from '../../src/modules/respiratory-medicine/demo/bronchiectasis-mucus-plugging-reassessment-demonstration';
import { bronchiectasisMucusPluggingInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/bronchiectasis-mucus-plugging-reassessment-guidance';
import type { BronchiectasisMucusPluggingAction } from '../../src/modules/respiratory-medicine/bronchiectasis-mucus-plugging-reassessment';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.bronchiectasisMucusPluggingAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: BronchiectasisMucusPluggingAction) => {
  engine.apply({ tick, type: 'bronchiectasis-mucus-plugging-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = bronchiectasisMucusPluggingDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'bronchiectasis-mucus-plugging-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Supports Her Own Routine', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(BRONCHIECTASIS_MUCUS_PLUGGING_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsBronchiectasisMucusPluggingDemonstration(SCENARIO)).toBe(true);
    expect(supportsBronchiectasisMucusPluggingDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsBronchiectasisMucusPluggingDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all five recorded steps in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'evidence', 'intent', 'response', 'escalation', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.evidenceAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.clearanceIntentAtTick!);
    expect(patient.clearanceIntentAtTick).toBeLessThan(patient.responseAtTick!);
    expect(patient.responseAtTick).toBeLessThan(patient.escalationAtTick!);
    expect(patient.escalationAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('names the weak cough as the mechanism rather than the collapse', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('the routine that normally works');
    expect(trajectory).toContain('The weak cough is the mechanism');
    expect(patient.mucusImpactionWorkingPatternAuthored).toBe(true);
    expect(patient.focalCollapseAuthored).toBe(true);
  });

  it('lets the imaging support the pattern without closing it', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('It is not a diagnosis');
    expect(evidence).toContain('is not the same as no lesion');
    expect(patient.mucusPlugEtiologyProven).toBe(false);
  });

  it('supports her individualized routine rather than replacing it', () => {
    const intent = narrations[beats.indexOf('intent')]!;
    expect(intent).toContain('Individualized is the operative word');
    expect(intent).toContain('not somebody else’s protocol');
    expect(intent).toContain('belong to the physiotherapist');
  });

  it('reads the response as real and incomplete', () => {
    const response = narrations[beats.indexOf('response')]!;
    expect(response).toContain('a genuine response to the right treatment');
    expect(response).toContain('proves neither complete clearance nor complete re-expansion');
    expect(response).toContain('still needs explaining');
  });

  it('escalates the residual collapse rather than filing it under bronchiectasis', () => {
    const escalation = narrations[beats.indexOf('escalation')]!;
    expect(escalation).toContain('should not be filed under bronchiectasis');
    expect(escalation).toContain('a partial response fails to exclude');
    expect(escalation).toContain('the easiest patient in the department to stop thinking about');
  });

  it('ends on an improvement with an unexplained remainder', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('her normal routine and why it failed');
    expect(handoff).toContain('the evaluation of what is still there');
    expect(narration).toContain('still partly down for a reason nobody has established');
    expect(narration).toContain('This ends the example, not the investigation.');
  });

  it('delivers nothing, selects nothing, and predicts nothing', () => {
    expect(patient.examinationPerformedByLearner).toBe(false);
    expect(patient.imagingAcquiredByLearner).toBe(false);
    expect(patient.sputumAssessedByLearner).toBe(false);
    expect(patient.airwayClearancePerformedByLearner).toBe(false);
    expect(patient.suctionPerformedByLearner).toBe(false);
    expect(patient.bronchoscopyPerformedByLearner).toBe(false);
    expect(patient.deviceOrTechniqueSelected).toBe(false);
    expect(patient.oxygenDeliveredByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.diagnosisDetermined).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the lobe is clear', 'this is just mucus', 'she has a tumour', 'the plug has gone']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    for (const forbidden of ['suction her', 'do a bronchoscopy', 'use a flutter valve', 'give nebulised saline']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Supports Her Own Routine', () => {
  it('opens on the routine that has stopped working', () => {
    const engine = create(); engine.step();
    const prompt = bronchiectasisMucusPluggingInlinePrompt('guided', { scenarioVersion: '0.1.0', bronchiectasisMucusPlugging: snapshot(engine) })!;
    expect(prompt.id).toBe('plugging-trajectory');
    expect(prompt.suggestion).toContain('the routine that normally works');
    expect(prompt.because).toContain('her ability to move them has');
  });

  it('reads the imaging without closing it next', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = bronchiectasisMucusPluggingInlinePrompt('guided', { scenarioVersion: '0.1.0', bronchiectasisMucusPlugging: snapshot(engine) })!;
    expect(prompt.id).toBe('plugging-evidence');
    expect(prompt.suggestion).toContain('without closing it');
    expect(prompt.because).toContain('is not the same as no lesion');
  });

  it('asks for a physiotherapist and supports her own routine', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = bronchiectasisMucusPluggingInlinePrompt('guided', { scenarioVersion: '0.1.0', bronchiectasisMucusPlugging: snapshot(engine) })!;
    expect(prompt.id).toBe('plugging-intent');
    expect(prompt.suggestion).toContain('rather than replacing it');
    expect(prompt.because).toContain('Individualized is the operative word');
  });

  it('reads the response as real and incomplete', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = bronchiectasisMucusPluggingInlinePrompt('guided', { scenarioVersion: '0.1.0', bronchiectasisMucusPlugging: snapshot(engine) })!;
    expect(prompt.id).toBe('plugging-response');
    expect(prompt.suggestion).toContain('real and incomplete');
    expect(prompt.because).toContain('proves neither complete clearance nor complete re-expansion');
  });

  it('never clears the lobe, names a tumour, or performs a technique', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = bronchiectasisMucusPluggingInlinePrompt('guided', { scenarioVersion: '0.1.0', bronchiectasisMucusPlugging: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['the lobe is clear', 'this is just mucus', 'suction her', 'do a bronchoscopy']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(bronchiectasisMucusPluggingInlinePrompt('unassisted', { scenarioVersion: '0.1.0', bronchiectasisMucusPlugging: patient })).toBeNull();
    expect(bronchiectasisMucusPluggingInlinePrompt('guided', { scenarioVersion: '0.1.1', bronchiectasisMucusPlugging: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(bronchiectasisMucusPluggingInlinePrompt('guided', { scenarioVersion: '0.1.0', bronchiectasisMucusPlugging: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(bronchiectasisMucusPluggingInlinePrompt(level, { scenarioVersion: '0.1.0', bronchiectasisMucusPlugging: snapshot(engine) })).not.toBeNull();
    }
  });
});
