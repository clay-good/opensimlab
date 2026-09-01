/**
 * The worked example and observed-state tutor for a suspicion that cannot wait
 * for its confirmation.
 *
 * The thing that would confirm the diagnosis takes longer than the diagnosis
 * allows, so both hold two statements together that sound contradictory and are
 * not: decompression should not wait for radiography, and this is still a
 * suspicion with several causes open. Neither is softened to make the other
 * easier, and the example finishes on improvement without resolution.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { NEONATAL_TENSION_PNEUMOTHORAX as SCENARIO } from '../../src/modules/neonatology/scenarios/neonatal-tension-pneumothorax';
import { TENSION_PNEUMOTHORAX_FIXTURES as FIXTURES } from '../../src/modules/neonatology/neonatal-tension-pneumothorax-fixtures';
import {
  TENSION_PNEUMOTHORAX_DEMONSTRATION_VERSION, tensionPneumothoraxDemonstrationStep,
  supportsTensionPneumothoraxDemonstration,
} from '../../src/modules/neonatology/demo/neonatal-tension-pneumothorax-demonstration';
import { tensionPneumothoraxInlinePrompt } from '../../src/modules/neonatology/tutor/neonatal-tension-pneumothorax-guidance';
import type { TensionPneumothoraxAction } from '../../src/modules/neonatology/neonatal-tension-pneumothorax';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neonatologyTensionPneumothoraxAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: TensionPneumothoraxAction) => {
  engine.apply({ tick, type: 'neonatal-tension-pneumothorax-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = tensionPneumothoraxDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'neonatal-tension-pneumothorax-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Acts On A Suspicion And Leaves It One', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(TENSION_PNEUMOTHORAX_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsTensionPneumothoraxDemonstration(SCENARIO)).toBe(true);
    expect(supportsTensionPneumothoraxDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsTensionPneumothoraxDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'recognize', 'readiness', 'report', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('holds both statements together at the recognition beat', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('stay open');
    expect(recognize).toContain('wait for a film');
  });

  it('confirms nothing and excludes nothing', () => {
    expect(patient.diagnosisConfirmed).toBe(false);
    expect(patient.alternativeCauseExcluded).toBe(false);
    expect(patient.airLeakResolved).toBe(false);
    expect(patient.durableOxygenationOrCirculationProven).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.parentOutcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['confirmed tension pneumothorax', 'the diagnosis is confirmed', 'the air leak is resolved', 'she is stable now']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('finishes on improvement without resolution', () => {
    expect(narration).toContain('Nothing here was resolved');
    expect(narrations[beats.indexOf('handoff')]).toContain('improvement without resolution');
  });

  it('selects no device, size, site, or analgesia anywhere', () => {
    expect(patient.pressureVolumeRateOxygenPeepEquipmentOrSiteSelectedByLearner).toBe(false);
    expect(patient.decompressionOrDrainPerformedByLearner).toBe(false);
    expect(patient.accessAnalgesiaFluidBloodOrDrugDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['second intercostal space', '18-gauge', 'a 20 ml syringe', 'give morphine']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Refuses To Resolve The Contradiction', () => {
  it('opens on a team that can decompress rather than only ventilate', () => {
    const engine = create(); engine.step();
    const prompt = tensionPneumothoraxInlinePrompt('guided', {
      scenarioVersion: '0.1.0', tensionPneumothorax: snapshot(engine),
    })!;
    expect(prompt.id).toBe('tension-pneumothorax-support');
    expect(prompt.because).toContain('expensive to discover missing');
  });

  it('names the open alternatives in the same breath as the urgency', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    advance(engine, 1, FIXTURES.expert[1][1]);
    const prompt = tensionPneumothoraxInlinePrompt('guided', {
      scenarioVersion: '0.1.0', tensionPneumothorax: snapshot(engine),
    })!;
    expect(prompt.id).toBe('tension-pneumothorax-recognize');
    expect(prompt.because).toContain('stay open');
    expect(prompt.because).toContain('wait for a film');
  });

  it('never confirms the diagnosis or selects the equipment', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = tensionPneumothoraxInlinePrompt('guided', {
        scenarioVersion: '0.1.0', tensionPneumothorax: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['confirmed tension pneumothorax', 'insert a needle at', 'wait for the chest film', 'the air leak has resolved']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(tensionPneumothoraxInlinePrompt('guided', { scenarioVersion: '0.1.0', tensionPneumothorax: patient })!.id)
      .toBe('tension-pneumothorax-observe');
    expect(tensionPneumothoraxInlinePrompt('coached', { scenarioVersion: '0.1.0', tensionPneumothorax: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(tensionPneumothoraxInlinePrompt('unassisted', { scenarioVersion: '0.1.0', tensionPneumothorax: patient })).toBeNull();
    expect(tensionPneumothoraxInlinePrompt('guided', { scenarioVersion: '0.1.1', tensionPneumothorax: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(tensionPneumothoraxInlinePrompt('guided', { scenarioVersion: '0.1.0', tensionPneumothorax: snapshot(engine) })).toBeNull();
  });
});
