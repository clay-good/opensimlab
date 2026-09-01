/**
 * The worked example and observed-state tutor for acting decisively on a
 * disputed threshold.
 *
 * No single glucose concentration universally defines clinically important
 * neonatal hypoglycemia or predicts brain injury, and abnormal signs with a
 * confirmed 32 mg/dL still support immediate qualified escalation. Both are
 * true, and neither is allowed to cancel the other. The signs are nonspecific
 * too, so treating the glucose explains nothing.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { NEONATAL_HYPOGLYCEMIA as SCENARIO } from '../../src/modules/neonatology/scenarios/neonatal-hypoglycemia';
import { NEONATAL_HYPOGLYCEMIA_FIXTURES as FIXTURES } from '../../src/modules/neonatology/neonatal-hypoglycemia-fixtures';
import {
  NEONATAL_HYPOGLYCEMIA_DEMONSTRATION_VERSION, neonatalHypoglycemiaDemonstrationStep,
  supportsNeonatalHypoglycemiaDemonstration,
} from '../../src/modules/neonatology/demo/neonatal-hypoglycemia-demonstration';
import { neonatalHypoglycemiaInlinePrompt } from '../../src/modules/neonatology/tutor/neonatal-hypoglycemia-guidance';
import type { NeonatalHypoglycemiaAction } from '../../src/modules/neonatology/neonatal-hypoglycemia';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neonatologyHypoglycemiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: NeonatalHypoglycemiaAction) => {
  engine.apply({ tick, type: 'neonatal-hypoglycemia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = neonatalHypoglycemiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'neonatal-hypoglycemia-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Escalates Without Adopting A Threshold', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(NEONATAL_HYPOGLYCEMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsNeonatalHypoglycemiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsNeonatalHypoglycemiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsNeonatalHypoglycemiaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'recognize', 'readiness', 'report', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('reads the risk and the signs before the value', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('Read first, it becomes the whole assessment');
  });

  it('holds both statements together at the recognition beat', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('No single glucose concentration universally defines');
    expect(recognize).toContain('still support immediate qualified escalation');
    expect(recognize).toContain('Both of those are true at once');
    expect(recognize).toContain('stay open');
  });

  it('reviews the pathway instead of choosing a treatment', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('names no gel, no bolus and no dose');
    expect(readiness).toContain('local-protocol work');
  });

  it('claims no threshold, no treatment effect, and no cause', () => {
    expect(patient.universalInjuryThresholdClaimed).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.causeDetermined).toBe(false);
    expect(patient.infectionExcluded).toBe(false);
    expect(patient.endocrineOrMetabolicDiseaseExcluded).toBe(false);
    expect(patient.durableGlucoseStabilityProven).toBe(false);
    expect(patient.neurologicSafetyProven).toBe(false);
    expect(patient.feedingSuccessProven).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['below 40 mg/dl is hypoglycemia', 'she is stable now', 'the cause was', 'give 200 mg/kg', 'infection is excluded']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('obtains no glucose, feeds nobody, and gives nothing', () => {
    expect(patient.historyTakenByLearner).toBe(false);
    expect(patient.monitoringGlucoseOrTestsObtainedOrInterpretedByLearner).toBe(false);
    expect(patient.feedingPerformedByLearner).toBe(false);
    expect(patient.glucoseGelIvDextroseFluidOrDrugDeliveredByLearner).toBe(false);
    expect(patient.accessObtainedByLearner).toBe(false);
  });

  it('finishes on a corrected number over an unexplained newborn', () => {
    expect(narrations[beats.indexOf('handoff')]).toContain('not evidence of a universal treatment effect');
    expect(narration).toContain('an unexplained set of signs');
  });
});

describe('Requirement: The Tutor Refuses The Threshold And Escalates Anyway', () => {
  it('treats feeding as treatment at the support beat', () => {
    const engine = create(); engine.step();
    const prompt = neonatalHypoglycemiaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', neonatalHypoglycemia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('neonatal-hypoglycemia-support');
    expect(prompt.because).toContain('Feeding is treatment here');
  });

  it('holds both statements together at the recognition beat', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    advance(engine, 1, FIXTURES.expert[1][1]);
    const prompt = neonatalHypoglycemiaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', neonatalHypoglycemia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('neonatal-hypoglycemia-recognize');
    expect(prompt.because).toContain('No single glucose concentration universally defines');
    expect(prompt.because).toContain('Both are true');
    expect(prompt.because).toContain('stay open');
  });

  it('never states a threshold, names a dose, or claims a cause', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = neonatalHypoglycemiaInlinePrompt('guided', {
        scenarioVersion: '0.1.0', neonatalHypoglycemia: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['below 40 mg/dl is hypoglycemia', 'she is stable now', 'give 200 mg/kg', 'infection is excluded']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(neonatalHypoglycemiaInlinePrompt('guided', { scenarioVersion: '0.1.0', neonatalHypoglycemia: patient })!.id)
      .toBe('neonatal-hypoglycemia-observe');
    expect(neonatalHypoglycemiaInlinePrompt('coached', { scenarioVersion: '0.1.0', neonatalHypoglycemia: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(neonatalHypoglycemiaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', neonatalHypoglycemia: patient })).toBeNull();
    expect(neonatalHypoglycemiaInlinePrompt('guided', { scenarioVersion: '0.1.1', neonatalHypoglycemia: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(neonatalHypoglycemiaInlinePrompt('guided', { scenarioVersion: '0.1.0', neonatalHypoglycemia: snapshot(engine) })).toBeNull();
  });
});
