/**
 * The worked example and observed-state tutor for the part of a handoff that
 * gets dropped.
 *
 * What happened is the half people rehearse. The half that goes missing is
 * everything that did not happen, the results nobody has yet, and the ownership
 * boundary that runs until someone says the words rather than until the NICU
 * accepted her. A correct read-back is evidence that words were repeated, not
 * that understanding is shared.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { DELIVERY_ROOM_TO_NICU_HANDOFF as SCENARIO } from '../../src/modules/neonatology/scenarios/delivery-room-to-nicu-handoff';
import { NICU_HANDOFF_FIXTURES as FIXTURES } from '../../src/modules/neonatology/delivery-room-to-nicu-handoff-fixtures';
import {
  NICU_HANDOFF_DEMONSTRATION_VERSION, nicuHandoffDemonstrationStep,
  supportsNicuHandoffDemonstration,
} from '../../src/modules/neonatology/demo/delivery-room-to-nicu-handoff-demonstration';
import { nicuHandoffInlinePrompt } from '../../src/modules/neonatology/tutor/delivery-room-to-nicu-handoff-guidance';
import type { NicuHandoffAction } from '../../src/modules/neonatology/delivery-room-to-nicu-handoff';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neonatologyNicuHandoffAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: NicuHandoffAction) => {
  engine.apply({ tick, type: 'delivery-room-to-nicu-handoff-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = nicuHandoffDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'delivery-room-to-nicu-handoff-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Carries The Half That Gets Dropped', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(NICU_HANDOFF_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsNicuHandoffDemonstration(SCENARIO)).toBe(true);
    expect(supportsNicuHandoffDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsNicuHandoffDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'content', 'readiness', 'report', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('names both ends of the transfer and the parent who is not in the room', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('has had no complete update');
    expect(support).toContain('a story told to nobody in particular');
  });

  it('treats the pending results as facts to hand over', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('Pending is a fact to hand over, not a gap to apologise for');
  });

  it('carries the absent interventions with the same weight as the events', () => {
    const content = narrations[beats.indexOf('content')]!;
    expect(content).toContain('No compressions, no epinephrine, no access, no fluid, no blood, no alternative airway');
    expect(content).toContain('set what a deterioration would mean');
    expect(content).toContain('response and nonresponse both');
  });

  it('keeps ownership with the sender until an explicit transfer', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('accepting her is not the transfer');
    expect(readiness).toContain('where continuity is usually lost');
  });

  it('refuses the read-back as proof of shared understanding', () => {
    expect(patient.sharedUnderstandingProven).toBe(false);
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('evidence that words were repeated rather than that understanding is shared');
  });

  it('performs no transport, communication, or care', () => {
    expect(patient.transportPositioningOrSupportPerformedByLearner).toBe(false);
    expect(patient.communicationDocumentationCounselingOrCheckBackPerformedByLearner).toBe(false);
    expect(patient.warmingCoolingCpapOxygenOrDeviceOperatedByLearner).toBe(false);
    expect(patient.respiratorySupportVentilationOrAirwayManagedByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.diagnosisOrCauseDetermined).toBe(false);
    expect(patient.durableStabilityProven).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the handoff is complete', 'she is stable now', 'they understood', 'i told the parent', 'the cord gas showed']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('finishes with everything that was open still open', () => {
    expect(narration).toContain('including the parts of it that are absences');
    expect(narration).toContain('it does not settle anything');
  });
});

describe('Requirement: The Tutor Keeps Asking For The Negatives', () => {
  it('names both ends of the transfer at the support beat', () => {
    const engine = create(); engine.step();
    const prompt = nicuHandoffInlinePrompt('guided', {
      scenarioVersion: '0.1.0', nicuHandoff: snapshot(engine),
    })!;
    expect(prompt.id).toBe('nicu-handoff-support');
    expect(prompt.because).toContain('a story told to nobody in particular');
  });

  it('asks for the absent interventions by name', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    advance(engine, 1, FIXTURES.expert[1][1]);
    const prompt = nicuHandoffInlinePrompt('guided', {
      scenarioVersion: '0.1.0', nicuHandoff: snapshot(engine),
    })!;
    expect(prompt.id).toBe('nicu-handoff-content');
    expect(prompt.because).toContain('No compressions, no epinephrine, no access, no fluid, no blood, no alternative airway');
    expect(prompt.because).toContain('the ones the receiving team needs most');
  });

  it('keeps continuity with the sender until an explicit transfer', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = nicuHandoffInlinePrompt('guided', {
      scenarioVersion: '0.1.0', nicuHandoff: snapshot(engine),
    })!;
    expect(prompt.id).toBe('nicu-handoff-readiness');
    expect(prompt.because).toContain('accepting her is not the transfer');
  });

  it('never calls the handoff complete nor the newborn stable', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = nicuHandoffInlinePrompt('guided', {
        scenarioVersion: '0.1.0', nicuHandoff: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the handoff is complete', 'she is stable now', 'they understood', 'the cord gas showed']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(nicuHandoffInlinePrompt('guided', { scenarioVersion: '0.1.0', nicuHandoff: patient })!.id)
      .toBe('nicu-handoff-observe');
    expect(nicuHandoffInlinePrompt('coached', { scenarioVersion: '0.1.0', nicuHandoff: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(nicuHandoffInlinePrompt('unassisted', { scenarioVersion: '0.1.0', nicuHandoff: patient })).toBeNull();
    expect(nicuHandoffInlinePrompt('guided', { scenarioVersion: '0.1.1', nicuHandoff: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(nicuHandoffInlinePrompt('guided', { scenarioVersion: '0.1.0', nicuHandoff: snapshot(engine) })).toBeNull();
  });
});
