/**
 * The worked example and observed-state tutor for the one lesson in this module
 * where the compression threshold is met.
 *
 * The neighbouring lessons teach restraint, and this one would be wrong to.
 * Both halves of the threshold are satisfied, so neither the tutor nor the
 * example argues against the branch. They insist on the evidence that opens it,
 * and then decline the inference that would close it: a newborn who improves
 * after a treatment is not evidence the treatment is why.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { NEONATAL_BRADYCARDIA as SCENARIO } from '../../src/modules/neonatology/scenarios/neonatal-bradycardia';
import { NEONATAL_BRADYCARDIA_FIXTURES as FIXTURES } from '../../src/modules/neonatology/neonatal-bradycardia-fixtures';
import {
  NEONATAL_BRADYCARDIA_DEMONSTRATION_VERSION, neonatalBradycardiaDemonstrationStep,
  supportsNeonatalBradycardiaDemonstration,
} from '../../src/modules/neonatology/demo/neonatal-bradycardia-demonstration';
import { neonatalBradycardiaInlinePrompt } from '../../src/modules/neonatology/tutor/neonatal-bradycardia-guidance';
import type { NeonatalBradycardiaAction } from '../../src/modules/neonatology/neonatal-bradycardia';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neonatologyBradycardiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: NeonatalBradycardiaAction) => {
  engine.apply({ tick, type: 'neonatal-bradycardia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = neonatalBradycardiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'neonatal-bradycardia-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Opens The Branch And Declines The Inference', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(NEONATAL_BRADYCARDIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsNeonatalBradycardiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsNeonatalBradycardiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsNeonatalBradycardiaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'recognize', 'readiness', 'report', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('names both halves of the threshold in the order they were met', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('ventilation is optimized first');
    expect(recognize).toContain('Being right about the number still requires having established the ventilation');
  });

  it('keeps epinephrine on the far side of a later branch', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('preparing it is not the same as reaching it');
  });

  it('refuses the post-hoc reading of the improvement', () => {
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableCirculationProven).toBe(false);
    expect(patient.durableBreathingProven).toBe(false);
    expect(patient.causeDetermined).toBe(false);
    expect(patient.neurologicSafetyProven).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.parentOutcomePredicted).toBe(false);
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('not evidence the treatment is why');
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the compressions worked', 'he is stable now', 'the abruption caused', 'compressions are effective in']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('performs no compression, ventilation, airway, or drug', () => {
    expect(patient.compressionPerformedByLearner).toBe(false);
    expect(patient.oxygenOrVentilationDeliveredByLearner).toBe(false);
    expect(patient.airwayPlacedOrVerifiedByLearner).toBe(false);
    expect(patient.accessFluidBloodGlucoseOrDrugDeliveredByLearner).toBe(false);
    expect(patient.maskOrDeviceHandledByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give epinephrine', 'start compressions at', 'place the umbilical', 'increase the oxygen to']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('finishes on an improvement with no explanation attached', () => {
    expect(narration).toContain('no account of why it improved');
  });
});

describe('Requirement: The Tutor Insists On The Evidence And Refuses The Inference', () => {
  it('opens on compressions and ventilation staffed as two jobs', () => {
    const engine = create(); engine.step();
    const prompt = neonatalBradycardiaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', neonatalBradycardia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('neonatal-bradycardia-support');
    expect(prompt.because).toContain('neither half is done between other tasks');
  });

  it('requires the ventilation evidence before the threshold', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    advance(engine, 1, FIXTURES.expert[1][1]);
    const prompt = neonatalBradycardiaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', neonatalBradycardia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('neonatal-bradycardia-recognize');
    expect(prompt.because).toContain('Ventilation is optimized first');
    expect(prompt.because).toContain('only needed a better seal');
  });

  it('never claims the compressions worked nor delivers any of them', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = neonatalBradycardiaInlinePrompt('guided', {
        scenarioVersion: '0.1.0', neonatalBradycardia: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the compressions worked', 'he is stable now', 'give epinephrine', 'start compressions at']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(neonatalBradycardiaInlinePrompt('guided', { scenarioVersion: '0.1.0', neonatalBradycardia: patient })!.id)
      .toBe('neonatal-bradycardia-observe');
    expect(neonatalBradycardiaInlinePrompt('coached', { scenarioVersion: '0.1.0', neonatalBradycardia: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(neonatalBradycardiaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', neonatalBradycardia: patient })).toBeNull();
    expect(neonatalBradycardiaInlinePrompt('guided', { scenarioVersion: '0.1.1', neonatalBradycardia: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(neonatalBradycardiaInlinePrompt('guided', { scenarioVersion: '0.1.0', neonatalBradycardia: snapshot(engine) })).toBeNull();
  });
});
