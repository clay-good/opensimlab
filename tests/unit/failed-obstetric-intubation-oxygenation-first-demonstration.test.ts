/**
 * The worked example and observed-state tutor for an airway that is working
 * and not secured.
 *
 * Two attempts have failed and a supraglottic device is ventilating her with
 * sustained capnography, so the crisis is stable rather than over. The tube was
 * never the goal; oxygen is.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { FAILED_OBSTETRIC_INTUBATION_OXYGENATION_FIRST as SCENARIO } from '../../src/modules/obstetrics/scenarios/failed-obstetric-intubation-oxygenation-first';
import { FAILED_INTUBATION_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/failed-obstetric-intubation-oxygenation-first-fixtures';
import {
  FAILED_INTUBATION_DEMONSTRATION_VERSION, failedIntubationDemonstrationStep,
  supportsFailedIntubationDemonstration,
} from '../../src/modules/obstetrics/demo/failed-obstetric-intubation-oxygenation-first-demonstration';
import { failedIntubationInlinePrompt } from '../../src/modules/obstetrics/tutor/failed-obstetric-intubation-oxygenation-first-guidance';
import type { FailedIntubationAction } from '../../src/modules/obstetrics/failed-obstetric-intubation-oxygenation-first';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsFailedIntubationAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: FailedIntubationAction) => {
  engine.apply({ tick, type: 'failed-obstetric-intubation-oxygenation-first-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = failedIntubationDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'failed-obstetric-intubation-oxygenation-first-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Declares Before It Assesses', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(FAILED_INTUBATION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsFailedIntubationDemonstration(SCENARIO)).toBe(true);
    expect(supportsFailedIntubationDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsFailedIntubationDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'safety', 'decision', 'reassess', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.safetyAtTick!);
    expect(patient.safetyAtTick).toBeLessThan(patient.decisionAtTick!);
    expect(patient.decisionAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('declares the failure out loud first, and says why that is an action', () => {
    expect(beats[0]).toBe('support');
    const support = narrations[0]!;
    expect(support).toContain('Declaring it is what stops a third attempt');
    expect(support).toContain('how a manageable airway becomes an unmanageable one');
    expect(support).toContain('an action rather than an admission');
  });

  it('reads the airway as working and the situation as still open', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('That is adequate oxygenation, which is what matters');
    expect(context).toContain('the tube was never the goal');
    expect(context).toContain('cannot take part in any of this');
  });

  it('lets the oxygenation reassure without closing anything', () => {
    const safety = narrations[beats.indexOf('safety')]!;
    expect(safety).toContain('a rescue rather than a solution');
    expect(safety).toContain('remain live while the saturation reads 97%');
    expect(safety).toContain('The attempt limit exists because attempts cause the harm');
  });

  it('holds wake-or-proceed as an individual judgment no protocol makes', () => {
    const decision = narrations[beats.indexOf('decision')]!;
    expect(decision).toContain('an individual judgment rather than a rule');
    expect(decision).toContain('no answer that is correct for every case');
    expect(decision).toContain('and neither does any protocol');
  });

  it('ends on an airway that is working and not safe', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('establishes airway safety');
    expect(handoff).toContain('she cannot answer and will have to be asked about afterwards');
    expect(narration).toContain('a device nobody is calling secure');
    expect(narration).toContain('This ends the example, not the airway.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.airwaySafetyProven).toBe(false);
    expect(patient.aspirationExcluded).toBe(false);
    expect(patient.awarenessExcluded).toBe(false);
    expect(patient.fetalRecoveryProven).toBe(false);
    expect(patient.newbornSafetyProven).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.authoredFailedIntubationPattern).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the airway is secure', 'she has not aspirated', 'she is not aware', 'wake her up']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('touches nothing, manages no airway, and makes no decision', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.monitoringInterpretedByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.airwayManagedByLearner).toBe(false);
    expect(patient.oxygenDeliveredByLearner).toBe(false);
    expect(patient.ventilationDeliveredByLearner).toBe(false);
    expect(patient.airwayDeviceSelectedOrManipulatedByLearner).toBe(false);
    expect(patient.positionChangedByLearner).toBe(false);
    expect(patient.suctionOrFrontOfNeckAccessPerformedByLearner).toBe(false);
    expect(patient.drugDoseDeviceAnesthesiaOrBirthPlanSelectedByLearner).toBe(false);
    expect(patient.wakeOrProceedDecisionMadeByLearner).toBe(false);
    expect(patient.surgeryPerformedByLearner).toBe(false);
    expect(patient.deliveryPerformedByLearner).toBe(false);
    expect(patient.newbornAssessedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['try again with', 'cut the neck', 'suction her', 'proceed with the caesarean']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Declares Before It Assesses', () => {
  it('opens by declaring the failure out loud', () => {
    const engine = create(); engine.step();
    const prompt = failedIntubationInlinePrompt('guided', { scenarioVersion: '0.1.0', failedIntubation: snapshot(engine) })!;
    expect(prompt.id).toBe('intubation-support');
    expect(prompt.suggestion).toContain('before you take stock of anything');
    expect(prompt.because).toContain('Declaring it is what stops a third attempt');
  });

  it('reads the working airway once the failure is declared', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = failedIntubationInlinePrompt('guided', { scenarioVersion: '0.1.0', failedIntubation: snapshot(engine) })!;
    expect(prompt.id).toBe('intubation-context');
    expect(prompt.suggestion).toContain('the situation as still open');
    expect(prompt.because).toContain('the tube was never the goal');
  });

  it('keeps the risks live behind an adequate saturation', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = failedIntubationInlinePrompt('guided', { scenarioVersion: '0.1.0', failedIntubation: snapshot(engine) })!;
    expect(prompt.id).toBe('intubation-safety');
    expect(prompt.suggestion).toContain('without letting it close anything');
    expect(prompt.because).toContain('remain live while the saturation reads 97%');
  });

  it('refuses to make the wake-or-proceed decision', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = failedIntubationInlinePrompt('guided', { scenarioVersion: '0.1.0', failedIntubation: snapshot(engine) })!;
    expect(prompt.id).toBe('intubation-decision');
    expect(prompt.because).toContain('no answer that is correct for every case');
    expect(prompt.because).toContain('and neither does any protocol');
  });

  it('never claims a secure airway, excludes awareness, or decides', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = failedIntubationInlinePrompt('guided', { scenarioVersion: '0.1.0', failedIntubation: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the airway is secure', 'she is not aware', 'wake her up', 'proceed with the caesarean']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(failedIntubationInlinePrompt('guided', { scenarioVersion: '0.1.0', failedIntubation: patient })!.id).toBe('intubation-reassess');
    expect(failedIntubationInlinePrompt('coached', { scenarioVersion: '0.1.0', failedIntubation: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(failedIntubationInlinePrompt('unassisted', { scenarioVersion: '0.1.0', failedIntubation: patient })).toBeNull();
    expect(failedIntubationInlinePrompt('guided', { scenarioVersion: '0.1.1', failedIntubation: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(failedIntubationInlinePrompt('guided', { scenarioVersion: '0.1.0', failedIntubation: snapshot(engine) })).toBeNull();
  });
});
