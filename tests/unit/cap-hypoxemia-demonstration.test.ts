/**
 * The worked example and observed-state tutor for a patient who is sicker than
 * her blood pressure suggests.
 *
 * She is alert, warm and normotensive with a room-air saturation of 85% and a
 * PaO₂ of 51. The reassuring half of the picture is what makes this lesson
 * necessary.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { COMMUNITY_ACQUIRED_PNEUMONIA_HYPOXEMIA_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/community-acquired-pneumonia-hypoxemia-reassessment';
import { CAP_HYPOXEMIA_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/community-acquired-pneumonia-hypoxemia-reassessment-fixtures';
import {
  CAP_HYPOXEMIA_DEMONSTRATION_VERSION, capHypoxemiaDemonstrationStep,
  supportsCapHypoxemiaDemonstration,
} from '../../src/modules/respiratory-medicine/demo/community-acquired-pneumonia-hypoxemia-reassessment-demonstration';
import { capHypoxemiaInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/community-acquired-pneumonia-hypoxemia-reassessment-guidance';
import type { CapHypoxemiaAction } from '../../src/modules/respiratory-medicine/community-acquired-pneumonia-hypoxemia-reassessment';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.capHypoxemiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: CapHypoxemiaAction) => {
  engine.apply({ tick, type: 'community-acquired-pneumonia-hypoxemia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = capHypoxemiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'community-acquired-pneumonia-hypoxemia-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Answers The Hypoxemia First', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(CAP_HYPOXEMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCapHypoxemiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsCapHypoxemiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCapHypoxemiaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all five recorded steps in the enforced order', () => {
    expect(beats).toEqual(['support', 'evidence', 'severity', 'treatment', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.evidenceAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.severityAtTick!);
    expect(patient.severityAtTick).toBeLessThan(patient.treatmentIntentAtTick!);
    expect(patient.treatmentIntentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('corroborates the hypoxemia and refuses the reassuring pressure', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('the same finding twice, so it is not an artifact');
    expect(support).toContain('nothing about a pressure of 116/70 makes 85% acceptable');
    expect(support).toContain('while she is being supported rather than before');
    expect(patient.hypoxemiaAuthored).toBe(true);
  });

  it('reads the evidence as consistent rather than conclusive', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('consistent, not as conclusive');
    expect(evidence).toContain('viral and bacterial causes are both unresolved');
    expect(evidence).toContain('have to stay on the list');
    expect(patient.pneumoniaPatternAuthored).toBe(true);
  });

  it('counts the criteria without letting them decide where she goes', () => {
    const severity = narrations[beats.indexOf('severity')]!;
    expect(severity).toContain('do not let them decide where she goes');
    expect(severity).toContain('does not independently determine a location of care');
    expect(severity).toContain('a score has never been able to');
  });

  it('records the intent and narrows the empiric question by what is absent', () => {
    const treatment = narrations[beats.indexOf('treatment')]!;
    expect(treatment).toContain('as intent rather than selected');
    expect(treatment).toContain('What narrows the empiric question is what is absent');
    expect(treatment).toContain('Absent risk factors are a reason not to broaden');
  });

  it('ends on hypoxemia that is supported and unresolved', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the judgment they support rather than make');
    expect(handoff).toContain('the alternatives still open');
    expect(narration).toContain('a location of care nobody in this lesson decided');
    expect(narration).toContain('This ends the example, not the pneumonia.');
  });

  it('delivers nothing, selects nothing, and predicts nothing', () => {
    expect(patient.oxygenDeliveredByLearner).toBe(false);
    expect(patient.supportDeviceSelected).toBe(false);
    expect(patient.antimicrobialSelected).toBe(false);
    expect(patient.testAcquiredByLearner).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is bacterial', 'she needs the icu', 'the organism is', 'she can go to the ward']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    for (const forbidden of ['start ceftriaxone', 'put her on high-flow', 'send a pcr', 'give 15 litres']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Answers The Hypoxemia First', () => {
  it('opens by corroborating the hypoxemia', () => {
    const engine = create(); engine.step();
    const prompt = capHypoxemiaInlinePrompt('guided', { scenarioVersion: '0.1.0', capHypoxemia: snapshot(engine) })!;
    expect(prompt.id).toBe('cap-support');
    expect(prompt.suggestion).toContain('before anything else');
    expect(prompt.because).toContain('the same finding twice, so it is not an artifact');
  });

  it('reads the evidence as consistent next', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = capHypoxemiaInlinePrompt('guided', { scenarioVersion: '0.1.0', capHypoxemia: snapshot(engine) })!;
    expect(prompt.id).toBe('cap-evidence');
    expect(prompt.suggestion).toContain('consistent, not as conclusive');
    expect(prompt.because).toContain('viral and bacterial causes are both unresolved');
  });

  it('refuses to let the score choose a location of care', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = capHypoxemiaInlinePrompt('guided', { scenarioVersion: '0.1.0', capHypoxemia: snapshot(engine) })!;
    expect(prompt.id).toBe('cap-severity');
    expect(prompt.suggestion).toContain('do not let them decide where she goes');
    expect(prompt.because).toContain('a score has never been able to');
  });

  it('narrows the empiric question by what is absent', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = capHypoxemiaInlinePrompt('guided', { scenarioVersion: '0.1.0', capHypoxemia: snapshot(engine) })!;
    expect(prompt.id).toBe('cap-treatment');
    expect(prompt.because).toContain('What narrows the empiric question is what is absent');
    expect(prompt.because).toContain('Absent risk factors are a reason not to broaden');
  });

  it('never names an organism, a location, or a drug', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = capHypoxemiaInlinePrompt('guided', { scenarioVersion: '0.1.0', capHypoxemia: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['this is bacterial', 'she needs the icu', 'the organism is', 'start ceftriaxone']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(capHypoxemiaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', capHypoxemia: patient })).toBeNull();
    expect(capHypoxemiaInlinePrompt('guided', { scenarioVersion: '0.1.1', capHypoxemia: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(capHypoxemiaInlinePrompt('guided', { scenarioVersion: '0.1.0', capHypoxemia: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(capHypoxemiaInlinePrompt(level, { scenarioVersion: '0.1.0', capHypoxemia: snapshot(engine) })).not.toBeNull();
    }
  });
});
