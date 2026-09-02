/**
 * The worked example and observed-state tutor for an arrest where the
 * resuscitation is already someone else's job.
 *
 * Compressions have started and the pulse check is done, so what is left is
 * everything a pregnancy adds to a standard resuscitation: the clock, the
 * displacement, the airway priority, and a delivery prepared in the room rather
 * than somewhere she would have to be moved to.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { MATERNAL_CARDIAC_ARREST_COORDINATED_RESPONSE as SCENARIO } from '../../src/modules/obstetrics/scenarios/maternal-cardiac-arrest-coordinated-response';
import { MATERNAL_ARREST_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/maternal-cardiac-arrest-coordinated-response-fixtures';
import {
  MATERNAL_ARREST_DEMONSTRATION_VERSION, maternalArrestDemonstrationStep,
  supportsMaternalArrestDemonstration,
} from '../../src/modules/obstetrics/demo/maternal-cardiac-arrest-coordinated-response-demonstration';
import { maternalArrestInlinePrompt } from '../../src/modules/obstetrics/tutor/maternal-cardiac-arrest-coordinated-response-guidance';
import type { MaternalArrestAction } from '../../src/modules/obstetrics/maternal-cardiac-arrest-coordinated-response';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsMaternalArrestAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: MaternalArrestAction) => {
  engine.apply({ tick, type: 'maternal-cardiac-arrest-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = maternalArrestDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'maternal-cardiac-arrest-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Starts The Clock First', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(MATERNAL_ARREST_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMaternalArrestDemonstration(SCENARIO)).toBe(true);
    expect(supportsMaternalArrestDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsMaternalArrestDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'modifications', 'readiness', 'reassess', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.modificationsAtTick!);
    expect(patient.modificationsAtTick).toBeLessThan(patient.readinessAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('starts the prepared response and the clock before looking at anything', () => {
    expect(beats[0]).toBe('support');
    const support = narrations[0]!;
    expect(support).toContain('before you look at anything');
    expect(support).toContain('what this activation adds is everything a pregnancy adds');
    expect(support).toContain('timed from the arrest rather than from anyone arriving');
  });

  it('takes the arrest facts as given and adds the one that changes the response', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('None of that needs rechecking.');
    expect(context).toContain('fundal height above the umbilicus');
    expect(context).toContain('limits what compressions can return');
  });

  it('reviews the modifications as additions rather than a different resuscitation', () => {
    const modifications = narrations[beats.indexOf('modifications')]!;
    expect(modifications).toContain('displacement of the uterus to the patient’s left');
    expect(modifications).toContain('the same defibrillation energy as anyone else');
    expect(modifications).toContain('additions to a standard resuscitation rather than a different one');
    expect(modifications).toContain('none of them is a reason to pause compressions');
  });

  it('prepares the delivery in this room and keeps the causes open', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('part of the maternal resuscitation rather than a separate obstetric decision');
    expect(readiness).toContain('costs the minutes that make it worth doing');
    expect(readiness).toContain('The causes stay open in parallel');
  });

  it('ends on an arrest that is still happening', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('circulation has not returned');
    expect(handoff).toContain('or a decision to stop');
    expect(narration).toContain('a delivery nobody has performed');
    expect(narration).toContain('This ends the example, not the arrest.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.deliveryCompleted).toBe(false);
    expect(patient.roscOccurred).toBe(false);
    expect(patient.terminationDecisionMade).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.authoredMaternalCardiacArrest).toBe(true);
    expect(patient.qualifiedStandardResuscitationAuthored).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['circulation has returned', 'the cause is', 'she is out of danger', 'stop the resuscitation']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('checks nothing, performs nothing, and selects no treatment or delivery', () => {
    expect(patient.learnerAssessedResponsivenessBreathingOrPulse).toBe(false);
    expect(patient.learnerInterpretedRhythmOrMonitoring).toBe(false);
    expect(patient.cprPerformedByLearner).toBe(false);
    expect(patient.uterineDisplacementPerformedByLearner).toBe(false);
    expect(patient.airwayOrVentilationSelectedByLearner).toBe(false);
    expect(patient.accessSelectedByLearner).toBe(false);
    expect(patient.drugDoseRouteOrTargetSelectedByLearner).toBe(false);
    expect(patient.shockOrPacingSelectedByLearner).toBe(false);
    expect(patient.fetalMonitorOperatedByLearner).toBe(false);
    expect(patient.causeDiagnosedByLearner).toBe(false);
    expect(patient.causeExcludedByLearner).toBe(false);
    expect(patient.deliveryEligibilityDeterminedByLearner).toBe(false);
    expect(patient.deliverySelectedByLearner).toBe(false);
    expect(patient.deliveryPerformedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['take over compressions', 'check for a pulse', 'give adrenaline', 'deliver her now']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Starts The Clock First', () => {
  it('opens on the prepared response and the clock', () => {
    const engine = create(); engine.step();
    const prompt = maternalArrestInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalArrest: snapshot(engine) })!;
    expect(prompt.id).toBe('arrest-support');
    expect(prompt.suggestion).toContain('before you look at anything');
    expect(prompt.because).toContain('timed from the arrest rather than from anyone arriving');
  });

  it('takes the arrest facts as given once the response is running', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = maternalArrestInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalArrest: snapshot(engine) })!;
    expect(prompt.id).toBe('arrest-context');
    expect(prompt.suggestion).toContain('add the one that changes the response');
    expect(prompt.because).toContain('None of that needs rechecking.');
  });

  it('reviews the modifications without interrupting the resuscitation', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = maternalArrestInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalArrest: snapshot(engine) })!;
    expect(prompt.id).toBe('arrest-modifications');
    expect(prompt.suggestion).toContain('without letting it interrupt the resuscitation');
    expect(prompt.because).toContain('none of them is a reason to pause compressions');
  });

  it('prepares the delivery in the room rather than elsewhere', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = maternalArrestInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalArrest: snapshot(engine) })!;
    expect(prompt.id).toBe('arrest-readiness');
    expect(prompt.because).toContain('costs the minutes that make it worth doing');
    expect(prompt.because).toContain('The causes stay open in parallel');
  });

  it('never claims circulation, names a cause, or picks a delivery', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = maternalArrestInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalArrest: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['circulation has returned', 'the cause is', 'deliver her now', 'she is out of danger']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(maternalArrestInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalArrest: patient })!.id).toBe('arrest-reassess');
    expect(maternalArrestInlinePrompt('coached', { scenarioVersion: '0.1.0', maternalArrest: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(maternalArrestInlinePrompt('unassisted', { scenarioVersion: '0.1.0', maternalArrest: patient })).toBeNull();
    expect(maternalArrestInlinePrompt('guided', { scenarioVersion: '0.1.1', maternalArrest: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(maternalArrestInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalArrest: snapshot(engine) })).toBeNull();
  });
});
