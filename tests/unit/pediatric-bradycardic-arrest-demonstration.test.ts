/**
 * The worked example and observed-state tutor for a child whose heart did not
 * follow her oxygen.
 *
 * Two refusals: do not wait for the pulse to go, and do not read organized
 * electrical activity as circulation. And one ending — there isn't one.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEDIATRIC_BRADYCARDIC_ARREST as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-bradycardic-arrest';
import { PEDIATRIC_BRADYCARDIC_ARREST_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-bradycardic-arrest-fixtures';
import {
  PEDIATRIC_BRADYCARDIC_ARREST_DEMONSTRATION_VERSION, pediatricBradycardicArrestDemonstrationStep,
  supportsPediatricBradycardicArrestDemonstration,
} from '../../src/modules/pediatrics/demo/pediatric-bradycardic-arrest-demonstration';
import { pediatricBradycardicArrestInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-bradycardic-arrest-guidance';
import type { PediatricBradycardicArrestAction } from '../../src/modules/pediatrics/pediatric-bradycardic-arrest';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pediatricBradycardicArrestAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PediatricBradycardicArrestAction) => {
  engine.apply({ tick, type: 'pediatric-bradycardic-arrest-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pediatricBradycardicArrestDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pediatric-bradycardic-arrest-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Wait For The Pulse To Go', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_BRADYCARDIC_ARREST_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricBradycardicArrestDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricBradycardicArrestDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The guard asserts the opening rhythm-change event, so dropping it fails closed.
    expect(supportsPediatricBradycardicArrestDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'rhythm-change'),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the one available order', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'resuscitation', 'safety', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.resuscitationAtTick!);
    // The strict line: the review cannot precede resuscitation ownership.
    expect(patient.resuscitationAtTick).toBeLessThan(patient.safetyAtTick!);
    expect(patient.safetyAtTick).toBeLessThan(patient.laterResponseAtTick!);
    expect(patient.laterResponseAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('reads the complete support record as the point rather than as background', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('The ventilation is working');
    expect(trajectory).toContain('you fixed the oxygen and the heart did not follow');
    expect(patient.effectiveAssistedVentilationAuthored).toBe(true);
    expect(patient.pulseAssessedByLearner).toBe(false);
  });

  it('states the threshold with its qualifier', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('despite effective ventilation');
    expect(recognition).toContain('bradycardia that responds to oxygen and ventilation is a different situation');
    expect(recognition).toContain('that is not a reason to wait');
    expect(patient.persistentBradycardiaWithCompromiseAuthored).toBe(true);
    expect(patient.causeAssignedByLearner).toBe(false);
  });

  it('says the sentence the lesson exists for', () => {
    const resuscitation = narrations[beats.indexOf('resuscitation')]!;
    expect(resuscitation).toContain('Do not wait for the pulse to go');
    expect(resuscitation).toContain('running a resuscitation rather than watching a rate');
    expect(patient.qualifiedResuscitationOwnershipActive).toBe(true);
    expect(patient.chestCompressionsDeliveredByLearner).toBe(false);
  });

  it('argues for naming the arrest boundary before crossing it', () => {
    const safety = narrations[beats.indexOf('safety')]!;
    expect(safety).toContain('rather than several minutes afterwards');
    expect(patient.qualifiedSafetyReviewActive).toBe(true);
  });

  it('refuses to read a rhythm as circulation, or a complex as shockable', () => {
    const later = narrations[beats.indexOf('later')]!;
    expect(later).toContain('A rhythm on a monitor is not circulation');
    expect(later).toContain('does not change to defibrillation because a complex is visible');
    expect(patient.laterPulseLossAuthored).toBe(true);
    expect(patient.laterPeaAuthored).toBe(true);
    expect(patient.shockDeliveredByLearner).toBe(false);
  });

  it('ends inside the resuscitation with nothing concluded', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('The next team is continuing this, not concluding it');
    expect(narration).toContain('This example stops here because the resuscitation does not');
    expect(narration).toContain('This ends the example, not the evaluation.');
    expect(patient.roscReported).toBe(false);
    expect(patient.deathDeclared).toBe(false);
    expect(patient.resuscitationTerminated).toBe(false);
  });

  it('never reports an outcome, in either direction', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 0.01 mg/kg', 'give epinephrine', 'shock her', 'defibrillate', 'start pacing', 'she has rosc', 'we should stop', 'she died', 'call it']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.defibrillationPerformedByLearner).toBe(false);
  });
});

describe('Requirement: The Tutor Enforces The Order It Argues For', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = pediatricBradycardicArrestInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['pba-trajectory', 'pba-recognition', 'pba-resuscitation', 'pba-safety', 'pba-later', 'pba-handoff']);
  });

  it('stays on the resuscitation when the review is attempted first', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    advance(engine, 2, 'review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary');
    expect(snapshot(engine)!.safetyAtTick).toBeNull();
    expect(snapshot(engine)!.resuscitationAtTick).toBeNull();
    const prompt = pediatricBradycardicArrestInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pba-resuscitation');
    expect(prompt.suggestion).toContain('Do not wait for the pulse to go');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-pediatric-bradycardia-with-persistent-compromise');
    expect(snapshot(engine)!.trajectoryAtTick).toBeNull();
    expect(snapshot(engine)!.recognitionAtTick).toBeNull();
    expect(pediatricBradycardicArrestInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pba-trajectory');
  });

  it('does not move on when the later report is refused for time', () => {
    // The gate reads the engine's clock, not the tick on the action, so the
    // refusal only happens when both are dispatched before the next step.
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    engine.apply({ tick: 3, type: 'pediatric-bradycardic-arrest-response', payload: { action: 'review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary' } });
    engine.apply({ tick: 3, type: 'pediatric-bradycardic-arrest-response', payload: { action: 'review-pediatric-bradycardic-arrest-pulse-loss-response' } });
    engine.step();
    expect(snapshot(engine)!.safetyAtTick).not.toBeNull();
    expect(snapshot(engine)!.laterResponseAtTick).toBeNull();
    expect(pediatricBradycardicArrestInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pba-later');
  });

  it('never names a drug, an energy, or an outcome', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pediatricBradycardicArrestInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['give epinephrine', 'shock her', 'she has rosc', 'we should stop']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pediatricBradycardicArrestInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pediatricBradycardicArrestInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pediatricBradycardicArrestInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pediatricBradycardicArrestInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pediatricBradycardicArrestInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
