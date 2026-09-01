/**
 * The worked example and observed-state tutor for the minute in which one thing
 * matters.
 *
 * Everything a newborn resuscitation can offer is available in this room, and
 * the guidance settles which of it comes first. So both narrow rather than
 * widen: neither reaches for oxygen, compressions, access or a cause before the
 * lungs are inflated, and neither lets the rising number at ninety seconds
 * stand in for durable breathing, a stable transition, or a diagnosis.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { NEONATAL_APNEA as SCENARIO } from '../../src/modules/neonatology/scenarios/neonatal-apnea';
import { NEONATAL_APNEA_FIXTURES as FIXTURES } from '../../src/modules/neonatology/neonatal-apnea-fixtures';
import {
  NEONATAL_APNEA_DEMONSTRATION_VERSION, neonatalApneaDemonstrationStep,
  supportsNeonatalApneaDemonstration,
} from '../../src/modules/neonatology/demo/neonatal-apnea-demonstration';
import { neonatalApneaInlinePrompt } from '../../src/modules/neonatology/tutor/neonatal-apnea-guidance';
import type { NeonatalApneaAction } from '../../src/modules/neonatology/neonatal-apnea';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neonatologyApneaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: NeonatalApneaAction) => {
  engine.apply({ tick, type: 'neonatal-apnea-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = neonatalApneaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'neonatal-apnea-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Narrows To Effective Ventilation', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(NEONATAL_APNEA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsNeonatalApneaDemonstration(SCENARIO)).toBe(true);
    expect(supportsNeonatalApneaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsNeonatalApneaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'recognize', 'readiness', 'report', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('lets the threshold decide while the cause stays open', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('rather than the search for a reason');
    expect(recognize).toContain('stays open');
  });

  it('keeps the rest of the resuscitation prepared rather than used', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('prepared and not used');
    expect(readiness).toContain('rising heart rate');
  });

  it('delivers nothing and proves nothing', () => {
    expect(patient.oxygenOrVentilationDeliveredByLearner).toBe(false);
    expect(patient.airwayManagedByLearner).toBe(false);
    expect(patient.ventilationCorrectiveStepsPerformedByLearner).toBe(false);
    expect(patient.compressionsAccessFluidGlucoseOrDrugDeliveredByLearner).toBe(false);
    expect(patient.durableBreathingProven).toBe(false);
    expect(patient.stableTransitionProven).toBe(false);
    expect(patient.neurologicSafetyProven).toBe(false);
    expect(patient.causeDetermined).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.parentOutcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['he has recovered', 'breathing on his own now', 'he is stable now', 'the cause was', 'start compressions', 'increase the oxygen']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('finishes on a first answer rather than a recovery', () => {
    expect(narrations[beats.indexOf('handoff')]).toContain('a first answer and not the last word');
    expect(narration).toContain('the cause unknown');
  });
});

describe('Requirement: The Tutor Keeps Narrowing', () => {
  it('opens on the ventilation owner rather than the problem', () => {
    const engine = create(); engine.step();
    const prompt = neonatalApneaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', neonatalApnea: snapshot(engine),
    })!;
    expect(prompt.id).toBe('neonatal-apnea-support');
    expect(prompt.because).toContain('airway owner is the role this minute is about');
  });

  it('names the threshold and the open cause in the same breath', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    advance(engine, 1, FIXTURES.expert[1][1]);
    const prompt = neonatalApneaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', neonatalApnea: snapshot(engine),
    })!;
    expect(prompt.id).toBe('neonatal-apnea-recognize');
    expect(prompt.because).toContain('stays open');
    expect(prompt.because).toContain('none of it changes what comes first');
  });

  it('never delivers the ventilation nor escalates ahead of the lungs', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = neonatalApneaInlinePrompt('guided', {
        scenarioVersion: '0.1.0', neonatalApnea: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['he has recovered', 'start compressions', 'intubate him', 'increase the oxygen to', 'squeeze the bag']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(neonatalApneaInlinePrompt('guided', { scenarioVersion: '0.1.0', neonatalApnea: patient })!.id)
      .toBe('neonatal-apnea-observe');
    expect(neonatalApneaInlinePrompt('coached', { scenarioVersion: '0.1.0', neonatalApnea: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(neonatalApneaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', neonatalApnea: patient })).toBeNull();
    expect(neonatalApneaInlinePrompt('guided', { scenarioVersion: '0.1.1', neonatalApnea: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(neonatalApneaInlinePrompt('guided', { scenarioVersion: '0.1.0', neonatalApnea: snapshot(engine) })).toBeNull();
  });
});
