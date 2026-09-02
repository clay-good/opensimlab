/**
 * The worked example and observed-state tutor for the moment conventional
 * oxygen runs out.
 *
 * This lesson asks the learner to choose twice, and both times the wrong
 * answers are reasonable-sounding. The tutor answers all four by name; the
 * worked example makes none of them.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { HIGH_FLOW_NASAL_OXYGEN_ESCALATION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/high-flow-nasal-oxygen-escalation';
import { HIGH_FLOW_OXYGEN_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/high-flow-nasal-oxygen-escalation-fixtures';
import {
  HIGH_FLOW_OXYGEN_DEMONSTRATION_VERSION, highFlowOxygenEscalationDemonstrationStep,
  supportsHighFlowOxygenEscalationDemonstration,
} from '../../src/modules/respiratory-medicine/demo/high-flow-nasal-oxygen-escalation-demonstration';
import { highFlowOxygenEscalationInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/high-flow-nasal-oxygen-escalation-guidance';
import type { HighFlowOxygenEscalationAction } from '../../src/modules/respiratory-medicine/high-flow-nasal-oxygen-escalation';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.highFlowOxygenEscalationAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: HighFlowOxygenEscalationAction) => {
  engine.apply({ tick, type: 'high-flow-nasal-oxygen-escalation-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = highFlowOxygenEscalationDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'high-flow-nasal-oxygen-escalation-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Escalates Before It Is Forced To', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(HIGH_FLOW_OXYGEN_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsHighFlowOxygenEscalationDemonstration(SCENARIO)).toBe(true);
    expect(supportsHighFlowOxygenEscalationDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsHighFlowOxygenEscalationDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'suitability', 'selection', 'response', 'guards', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.suitabilityAtTick!);
    expect(patient.suitabilityAtTick).toBeLessThan(patient.selectionAtTick!);
    // Two time gates: the thirty-minute review and the handoff each need a later tick.
    expect(patient.selectionAtTick).toBeLessThan(patient.responseAtTick!);
    expect(patient.responseAtTick).toBeLessThan(patient.guardsAtTick!);
    expect(patient.guardsAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('never reaches for any of the four refusable choices', () => {
    expect(patient.lastUnsupportedChoice).toBeNull();
    expect(patient.highFlowTrialIntentRecorded).toBe(true);
  });

  it('reads a working device and a failing patient', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('The oxygen is working. He is still not managing.');
    expect(trajectory).toContain('alkalotic from working hard, not acidotic');
    expect(trajectory).toContain('nothing left to turn up');
    expect(patient.conventionalOxygenFunctionAuthored).toBe(true);
    expect(patient.acuteHypercapnicAcidosisAuthored).toBe(false);
  });

  it('treats his interface preference as clinical rather than courteous', () => {
    const suitability = narrations[beats.indexOf('suitability')]!;
    expect(suitability).toContain('a clinical fact here rather than a courtesy');
    expect(suitability).toContain('tolerability of what you choose is part of whether it works');
    expect(patient.patientExaminedByLearner).toBe(false);
  });

  it('selects a goal and leaves every setting where it belongs', () => {
    const selection = narrations[beats.indexOf('selection')]!;
    expect(selection).toContain('none of those are yours to set');
    expect(selection).toContain('alongside the airway-capable rescue that was already active');
  });

  it('refuses to compute what the equipment never actually knew', () => {
    const response = narrations[beats.indexOf('response')]!;
    expect(response).toContain('no ROX index, no PaO₂/FiO₂ ratio');
    expect(response).toContain('never actually known');
  });

  it('names delayed intubation as the harm the guards prevent', () => {
    const guards = narrations[beats.indexOf('guards')]!;
    expect(guards).toContain('Delayed intubation is the specific harm this trial risks');
    expect(guards).toContain('a therapy that declares itself');
  });

  it('ends without resolving the cause or the outcome', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('why the alternatives were not it here');
    expect(narration).toContain('on the interface he said he wanted');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('delivers nothing, sets nothing, and predicts nothing', () => {
    expect(patient.bloodGasAcquiredByLearner).toBe(false);
    expect(patient.bloodGasInterpretedByLearner).toBe(false);
    expect(patient.imagingAcquiredByLearner).toBe(false);
    expect(patient.deviceInspectedByLearner).toBe(false);
    expect(patient.deviceSelectedByLearner).toBe(false);
    expect(patient.cannulaSelectedByLearner).toBe(false);
    expect(patient.flowSelectedByLearner).toBe(false);
    expect(patient.fio2SelectedByLearner).toBe(false);
    expect(patient.oxygenTargetSelectedByLearner).toBe(false);
    expect(patient.deviceOperatedByLearner).toBe(false);
    expect(patient.oxygenDeliveredByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.intubationPerformedByLearner).toBe(false);
    expect(patient.durableSuccessProven).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['set the flow', 'start at 60 l', 'the rox index is', 'intubate him', 'he is out of danger', 'he will recover', 'the pneumonia is']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Answers Both Decision Points', () => {
  const atSelection = () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    return engine;
  };
  const atGuards = () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    return engine;
  };

  it('opens on a working device and a failing patient', () => {
    const engine = create(); engine.step();
    const prompt = highFlowOxygenEscalationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('hfno-trajectory');
    expect(prompt.suggestion).toContain('He is still not managing');
  });

  it('answers staying on conventional oxygen as a decision, not a pause', () => {
    const engine = atSelection();
    advance(engine, 2, 'continue-conventional-oxygen');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('conventional');
    const prompt = highFlowOxygenEscalationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('hfno-conventional-refused');
    expect(prompt.suggestion).toContain('Staying is a decision too');
    expect(prompt.because).toContain('not a neutral pause');
  });

  it('answers the bilevel instinct without calling it wrong in general', () => {
    const engine = atSelection();
    advance(engine, 2, 'select-bilevel-niv-first');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('bilevel');
    const prompt = highFlowOxygenEscalationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('hfno-bilevel-refused');
    expect(prompt.suggestion).toContain('Not a bad instinct');
    expect(prompt.because).toContain('can be entirely reasonable in selected acute hypoxemic failure');
    expect(prompt.because).toContain('not a misunderstanding of the physiology');
  });

  it('answers calling the failure resolved', () => {
    const engine = atGuards();
    advance(engine, 4, 'mark-high-flow-respiratory-failure-resolved');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('resolved');
    const prompt = highFlowOxygenEscalationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('hfno-resolved-refused');
    expect(prompt.suggestion).toContain('Better is not resolved');
    expect(prompt.because).toContain('None of them was achieved on room air');
  });

  it('answers standing the monitoring down', () => {
    const engine = atGuards();
    advance(engine, 4, 'reduce-high-flow-monitoring');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('reduced-monitoring');
    const prompt = highFlowOxygenEscalationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('hfno-monitoring-refused');
    expect(prompt.suggestion).toContain('earns its keep');
    expect(prompt.because).toContain('the window in which delayed intubation happens');
  });

  it('stops answering the wrong choice once the right one is made', () => {
    const engine = atSelection();
    advance(engine, 2, 'continue-conventional-oxygen');
    advance(engine, 3, 'select-high-flow-nasal-oxygen-escalation');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBeNull();
    expect(highFlowOxygenEscalationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!.id).toBe('hfno-response');
  });

  it('never sets a flow, computes a ratio, or predicts an outcome', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = highFlowOxygenEscalationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(7);
    for (const text of seen) {
      for (const forbidden of ['set the flow', 'the rox index is', 'intubate him', 'he will recover', 'he is out of danger']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(highFlowOxygenEscalationInlinePrompt('unassisted', { scenarioVersion: '0.1.0', patient })).toBeNull();
    expect(highFlowOxygenEscalationInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(highFlowOxygenEscalationInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(highFlowOxygenEscalationInlinePrompt(level, { scenarioVersion: '0.1.0', patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
