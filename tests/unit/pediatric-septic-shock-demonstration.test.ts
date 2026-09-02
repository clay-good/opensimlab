/**
 * The worked example and observed-state tutor for a child two aliquots did
 * not fix.
 *
 * The thing to get right here is the unordered pair. Rescue and source
 * control can be recorded in either order, so the tutor needs a beat for each
 * of the three ways that pair can be half done, and the example has to be one
 * valid order rather than the required one.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEDIATRIC_SEPTIC_SHOCK as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-septic-shock';
import { PEDIATRIC_SEPTIC_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-septic-shock-fixtures';
import {
  PEDIATRIC_SEPTIC_SHOCK_DEMONSTRATION_VERSION, pediatricSepticShockDemonstrationStep,
  supportsPediatricSepticShockDemonstration,
} from '../../src/modules/pediatrics/demo/pediatric-septic-shock-demonstration';
import { pediatricSepticShockInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-septic-shock-guidance';
import type { PediatricSepticShockAction } from '../../src/modules/pediatrics/pediatric-septic-shock';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pediatricSepticShockAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PediatricSepticShockAction) => {
  engine.apply({ tick, type: 'pediatric-septic-shock-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pediatricSepticShockDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pediatric-septic-shock-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Starts Both Jobs at Once', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_SEPTIC_SHOCK_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricSepticShockDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricSepticShockDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPediatricSepticShockDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps, taking the pair rescue-first', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'rescue', 'source', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.rescueAtTick!);
    // One valid order of the unordered pair, not the required one.
    expect(patient.rescueAtTick).toBeLessThan(patient.sourceAtTick!);
    // The later report waits for whichever half landed second.
    expect(patient.sourceAtTick).toBeLessThan(patient.laterResponseAtTick!);
    expect(patient.laterResponseAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('reads the direction rather than the numbers on their own', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('which is not the same as a confirmed one');
    expect(trajectory).toContain('Everything reasonable has been done, and she is going the wrong way');
    expect(patient.impairedPerfusionAuthored).toBe(true);
  });

  it('refuses the third aliquot without dismissing the shock', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('not proof that the fluid caused them');
    expect(recognition).toContain('not permission to ignore the shock');
    expect(recognition).toContain('Phoenix classifies overt organ dysfunction rather than screening for it early');
    expect(patient.congestionWarningsAuthored).toBe(true);
    expect(patient.fluidDeliveredByLearner).toBe(false);
    expect(patient.scoreCalculatedByLearner).toBe(false);
  });

  it('starts the rescue without waiting for central access, and chooses nothing', () => {
    const rescue = narrations[beats.indexOf('rescue')]!;
    expect(rescue).toContain('neither can wait for the other');
    expect(rescue).toContain('without waiting for central access');
    expect(rescue).toContain('and none is universal');
    expect(patient.qualifiedVasoactiveOwnershipActive).toBe(true);
    expect(patient.vasoactiveSelectedByLearner).toBe(false);
    expect(patient.accessPlacedByLearner).toBe(false);
  });

  it('escalates the source in parallel rather than after the shock resolves', () => {
    const source = narrations[beats.indexOf('source')]!;
    expect(source).toContain('The source will not clarify itself');
    expect(source).toContain('in parallel with the rescue rather than after it succeeds');
    expect(patient.qualifiedSourceControlOwnershipActive).toBe(true);
    expect(patient.sourceControlPerformedByLearner).toBe(false);
  });

  it('separates real movement from resolution', () => {
    const later = narrations[beats.indexOf('later')]!;
    expect(later).toContain('Real movement, and worth naming');
    expect(later).toContain('This is partial stabilization with active shock');
    expect(patient.laterReportAuthored).toBe(true);
    expect(patient.persistentShockAuthored).toBe(true);
    expect(patient.treatmentEffectProven).toBe(false);
  });

  it('ends with the cause still in place and everything owned', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('why no third aliquot was given');
    expect(narration).toContain('Nothing here was fixed. Everything here has an owner.');
    expect(narration).toContain('This ends the example, not the evaluation.');
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
  });

  it('examines nothing, treats nothing, and predicts nothing', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.imagingInterpretedByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.infusionOperatedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give another bolus', 'start epinephrine', 'start norepinephrine', 'take her to theatre', 'she can go home', 'the shock has resolved', 'mcg/kg']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Covers Both Halves of the Unordered Pair', () => {
  const V = '0.1.0';
  const atRecognized = () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    return engine;
  };

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = pediatricSepticShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['pss-trajectory', 'pss-recognition', 'pss-parallel', 'pss-source', 'pss-later', 'pss-handoff']);
  });

  it('asks for both when neither has started', () => {
    const prompt = pediatricSepticShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(atRecognized()) })!;
    expect(prompt.id).toBe('pss-parallel');
    expect(prompt.suggestion).toContain('neither can wait for the other');
    expect(prompt.because).toContain('Sequencing them is how children in this state lose an hour');
  });

  it('names the missing owner for her pressure when the source went first', () => {
    const engine = atRecognized();
    advance(engine, 2, 'escalate-pediatric-septic-shock-source-control');
    expect(snapshot(engine)!.sourceAtTick).not.toBeNull();
    expect(snapshot(engine)!.rescueAtTick).toBeNull();
    const prompt = pediatricSepticShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pss-rescue');
    expect(prompt.suggestion).toContain('Her pressure still has no owner');
    expect(prompt.because).toContain('does nothing for the next thirty minutes of her perfusion');
  });

  it('names the abdomen when the rescue went first', () => {
    const engine = atRecognized();
    advance(engine, 2, 'activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership');
    expect(snapshot(engine)!.rescueAtTick).not.toBeNull();
    expect(snapshot(engine)!.sourceAtTick).toBeNull();
    const prompt = pediatricSepticShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pss-source');
    expect(prompt.because).toContain('the reason she is in shock is still in her abdomen');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-pediatric-septic-shock-after-fluid-reassessment');
    expect(snapshot(engine)!.trajectoryAtTick).toBeNull();
    expect(snapshot(engine)!.recognitionAtTick).toBeNull();
    expect(pediatricSepticShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pss-trajectory');
  });

  it('does not move on when the later report is refused for time', () => {
    // The gate reads the engine's clock, not the tick on the action, so the
    // refusal only happens when both are dispatched before the next step.
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    engine.apply({ tick: 3, type: 'pediatric-septic-shock-response', payload: { action: 'escalate-pediatric-septic-shock-source-control' } });
    engine.apply({ tick: 3, type: 'pediatric-septic-shock-response', payload: { action: 'review-pediatric-septic-shock-later-response' } });
    engine.step();
    expect(snapshot(engine)!.sourceAtTick).not.toBeNull();
    expect(snapshot(engine)!.laterResponseAtTick).toBeNull();
    expect(pediatricSepticShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pss-later');
  });

  it('never reaches for another bolus, an agent, or a discharge', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pediatricSepticShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['give another bolus', 'start epinephrine', 'she can go home', 'the shock has resolved']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pediatricSepticShockInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pediatricSepticShockInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pediatricSepticShockInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pediatricSepticShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pediatricSepticShockInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
