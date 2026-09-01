/**
 * The worked example and observed-state tutor for the moment before the next
 * intervention.
 *
 * A newborn who is not responding invites escalation, and the guidance says to
 * correct first. The compression threshold has two halves — under 60 and
 * despite adequate ventilation after corrective steps — and the second half is
 * the one that gets dropped, so both keep the clause attached to the number.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { INEFFECTIVE_VENTILATION_CORRECTION as SCENARIO } from '../../src/modules/neonatology/scenarios/ineffective-ventilation-correction';
import { INEFFECTIVE_VENTILATION_FIXTURES as FIXTURES } from '../../src/modules/neonatology/ineffective-ventilation-correction-fixtures';
import {
  INEFFECTIVE_VENTILATION_DEMONSTRATION_VERSION, ineffectiveVentilationDemonstrationStep,
  supportsIneffectiveVentilationDemonstration,
} from '../../src/modules/neonatology/demo/ineffective-ventilation-correction-demonstration';
import { ineffectiveVentilationInlinePrompt } from '../../src/modules/neonatology/tutor/ineffective-ventilation-correction-guidance';
import type { IneffectiveVentilationAction } from '../../src/modules/neonatology/ineffective-ventilation-correction';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neonatologyIneffectiveVentilationAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: IneffectiveVentilationAction) => {
  engine.apply({ tick, type: 'ineffective-ventilation-correction-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = ineffectiveVentilationDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'ineffective-ventilation-correction-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Corrects Before It Escalates', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(INEFFECTIVE_VENTILATION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsIneffectiveVentilationDemonstration(SCENARIO)).toBe(true);
    expect(supportsIneffectiveVentilationDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsIneffectiveVentilationDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'recognize', 'readiness', 'report', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('ranks the heart rate above the chest and the saturation', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('chest movement is secondary and the saturation is neither');
    expect(recognize).toContain('stays open');
  });

  it('keeps the compression threshold attached to its second half', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('despite adequate ventilation after corrective steps');
    expect(readiness).toContain('neither half of that is true');
  });

  it('touches nothing and excludes nothing', () => {
    expect(patient.maskOrDeviceHandledByLearner).toBe(false);
    expect(patient.pressureRatePeepOrOxygenSelectedByLearner).toBe(false);
    expect(patient.airwayPlacedByLearner).toBe(false);
    expect(patient.ventilationCorrectiveStepsPerformedByLearner).toBe(false);
    expect(patient.compressionsAccessFluidGlucoseOrDrugDeliveredByLearner).toBe(false);
    expect(patient.airwayOrLungDiseaseExcluded).toBe(false);
    expect(patient.durableBreathingProven).toBe(false);
    expect(patient.causeDetermined).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.parentOutcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['start compressions', 'intubate her', 'reseat the mask', 'increase the pressure to', 'her lungs are clear', 'the leak was at']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('finishes on a correction that explained nothing', () => {
    expect(narrations[beats.indexOf('handoff')]).toContain('nobody has excluded');
    expect(narration).toContain('Nothing here established that it was enough');
  });
});

describe('Requirement: The Tutor Keeps The Clause Attached To The Number', () => {
  it('opens on the airway help called before it is needed', () => {
    const engine = create(); engine.step();
    const prompt = ineffectiveVentilationInlinePrompt('guided', {
      scenarioVersion: '0.1.0', ineffectiveVentilation: snapshot(engine),
    })!;
    expect(prompt.id).toBe('ineffective-ventilation-support');
    expect(prompt.because).toContain('arrives later than help called at the start of one');
  });

  it('reads the absent heart-rate rise as the primary sign', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    advance(engine, 1, FIXTURES.expert[1][1]);
    const prompt = ineffectiveVentilationInlinePrompt('guided', {
      scenarioVersion: '0.1.0', ineffectiveVentilation: snapshot(engine),
    })!;
    expect(prompt.id).toBe('ineffective-ventilation-recognize');
    expect(prompt.because).toContain('chest movement is secondary and the saturation is neither');
    expect(prompt.because).toContain('stays open');
  });

  it('refuses the compression shortcut at the readiness beat', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = ineffectiveVentilationInlinePrompt('guided', {
      scenarioVersion: '0.1.0', ineffectiveVentilation: snapshot(engine),
    })!;
    expect(prompt.id).toBe('ineffective-ventilation-readiness');
    expect(prompt.because).toContain('despite adequate ventilation after corrective steps');
    expect(prompt.because).toContain('neither half of that is true');
  });

  it('never handles the device nor clears the airway and lungs', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = ineffectiveVentilationInlinePrompt('guided', {
        scenarioVersion: '0.1.0', ineffectiveVentilation: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['start compressions', 'intubate her', 'reseat the mask', 'increase the pressure to', 'her lungs are clear']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(ineffectiveVentilationInlinePrompt('guided', { scenarioVersion: '0.1.0', ineffectiveVentilation: patient })!.id)
      .toBe('ineffective-ventilation-observe');
    expect(ineffectiveVentilationInlinePrompt('coached', { scenarioVersion: '0.1.0', ineffectiveVentilation: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(ineffectiveVentilationInlinePrompt('unassisted', { scenarioVersion: '0.1.0', ineffectiveVentilation: patient })).toBeNull();
    expect(ineffectiveVentilationInlinePrompt('guided', { scenarioVersion: '0.1.1', ineffectiveVentilation: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(ineffectiveVentilationInlinePrompt('guided', { scenarioVersion: '0.1.0', ineffectiveVentilation: snapshot(engine) })).toBeNull();
  });
});
