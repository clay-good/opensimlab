/**
 * The worked example and observed-state tutor for an emergency whose hardest
 * instruction is to stop doing two things.
 *
 * The head is out and the shoulder will not come. Almost everything that makes
 * this worse is something a person does under pressure — pulling harder,
 * pushing on the fundus, letting her keep pushing — so the boundaries are the
 * teaching rather than the maneuvers.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SHOULDER_DYSTOCIA_COGNITIVE_SEQUENCE as SCENARIO } from '../../src/modules/obstetrics/scenarios/shoulder-dystocia-cognitive-sequence';
import { SHOULDER_DYSTOCIA_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/shoulder-dystocia-cognitive-sequence-fixtures';
import {
  SHOULDER_DYSTOCIA_DEMONSTRATION_VERSION, shoulderDystociaDemonstrationStep,
  supportsShoulderDystociaDemonstration,
} from '../../src/modules/obstetrics/demo/shoulder-dystocia-cognitive-sequence-demonstration';
import { shoulderDystociaInlinePrompt } from '../../src/modules/obstetrics/tutor/shoulder-dystocia-cognitive-sequence-guidance';
import type { ShoulderDystociaAction } from '../../src/modules/obstetrics/shoulder-dystocia-cognitive-sequence';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsShoulderDystociaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: ShoulderDystociaAction) => {
  engine.apply({ tick, type: 'shoulder-dystocia-cognitive-sequence-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = shoulderDystociaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'shoulder-dystocia-cognitive-sequence-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Says The Word First', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(SHOULDER_DYSTOCIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsShoulderDystociaDemonstration(SCENARIO)).toBe(true);
    expect(supportsShoulderDystociaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsShoulderDystociaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'safety', 'escalation', 'reassess', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.safetyAtTick!);
    expect(patient.safetyAtTick).toBeLessThan(patient.escalationAtTick!);
    expect(patient.escalationAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('says the word out loud and starts the clock at the head', () => {
    expect(beats[0]).toBe('support');
    const support = narrations[0]!;
    expect(support).toContain('Say the word out loud');
    expect(support).toContain('is what brings the extra hands');
    expect(support).toContain('from the delivery of the head rather than from the moment anyone realized');
  });

  it('takes the failed traction as the diagnosis rather than something to repeat', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('That failed attempt is the diagnosis and does not need repeating.');
    expect(context).toContain('neither predicted this nor rule it out');
  });

  it('makes the first two instructions things to stop', () => {
    const safety = narrations[beats.indexOf('safety')]!;
    expect(safety).toContain('The first two instructions are things to stop, not things to do.');
    expect(safety).toContain('drives the shoulder harder into the pubic bone');
    expect(safety).toContain('the specific mechanism by which a brachial plexus is stretched');
  });

  it('holds the escalation as a menu and bounds the episiotomy', () => {
    const escalation = narrations[beats.indexOf('escalation')]!;
    expect(escalation).toContain('as a menu rather than a script');
    expect(escalation).toContain('room for hands rather than for the shoulder');
    expect(escalation).toContain('cutting soft tissue does not move bone');
    expect(escalation).toContain('the only version of these two minutes that will survive');
  });

  it('ends on a birth that happened and two people nobody has examined', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('that establishes no injury status for either of them');
    expect(handoff).toContain('the debrief she is owed and will remember');
    expect(narration).toContain('nobody has examined either of them yet');
    expect(narration).toContain('This ends the example, not the care.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.maternalInjuryDetermined).toBe(false);
    expect(patient.newbornInjuryDetermined).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.authoredShoulderDystocia).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the baby is unharmed', 'she is uninjured', 'no injury occurred', 'this always works']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('touches nothing, pulls on nothing, and performs no maneuver', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.tractionAppliedByLearner).toBe(false);
    expect(patient.pushingDirectedByLearner).toBe(false);
    expect(patient.positionChangedByLearner).toBe(false);
    expect(patient.pressureAppliedByLearner).toBe(false);
    expect(patient.maneuverPerformedByLearner).toBe(false);
    expect(patient.episiotomySelectedByLearner).toBe(false);
    expect(patient.deliveryPerformedByLearner).toBe(false);
    expect(patient.newbornCarePerformedByLearner).toBe(false);
    expect(patient.drugDoseRouteSelectedByLearner).toBe(false);
    expect(patient.procedureSelectedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['pull harder', 'press on the fundus', 'cut an episiotomy', 'perform mcroberts']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Says The Word First', () => {
  it('opens on saying the word and starting the head clock', () => {
    const engine = create(); engine.step();
    const prompt = shoulderDystociaInlinePrompt('guided', { scenarioVersion: '0.1.0', shoulderDystocia: snapshot(engine) })!;
    expect(prompt.id).toBe('dystocia-support');
    expect(prompt.suggestion).toContain('start the clock at the head');
    expect(prompt.because).toContain('is what brings the extra hands');
  });

  it('takes the birth facts as given once the emergency is called', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = shoulderDystociaInlinePrompt('guided', { scenarioVersion: '0.1.0', shoulderDystocia: snapshot(engine) })!;
    expect(prompt.id).toBe('dystocia-context');
    expect(prompt.suggestion).toContain('rather than re-testing them');
    expect(prompt.because).toContain('That failed attempt is the diagnosis and does not need repeating.');
  });

  it('names the two things to stop before anything to do', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = shoulderDystociaInlinePrompt('guided', { scenarioVersion: '0.1.0', shoulderDystocia: snapshot(engine) })!;
    expect(prompt.id).toBe('dystocia-safety');
    expect(prompt.suggestion).toContain('things to stop, not things to do');
    expect(prompt.because).toContain('the specific mechanism by which a brachial plexus is stretched');
  });

  it('bounds the episiotomy to access rather than to the shoulder', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = shoulderDystociaInlinePrompt('guided', { scenarioVersion: '0.1.0', shoulderDystocia: snapshot(engine) })!;
    expect(prompt.id).toBe('dystocia-escalation');
    expect(prompt.because).toContain('room for hands rather than for the shoulder');
    expect(prompt.because).toContain('cutting soft tissue does not move bone');
  });

  it('never claims an uninjured outcome, a universal sequence, or a maneuver', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = shoulderDystociaInlinePrompt('guided', { scenarioVersion: '0.1.0', shoulderDystocia: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the baby is unharmed', 'she is uninjured', 'this always works', 'perform mcroberts']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(shoulderDystociaInlinePrompt('guided', { scenarioVersion: '0.1.0', shoulderDystocia: patient })!.id).toBe('dystocia-reassess');
    expect(shoulderDystociaInlinePrompt('coached', { scenarioVersion: '0.1.0', shoulderDystocia: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(shoulderDystociaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', shoulderDystocia: patient })).toBeNull();
    expect(shoulderDystociaInlinePrompt('guided', { scenarioVersion: '0.1.1', shoulderDystocia: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(shoulderDystociaInlinePrompt('guided', { scenarioVersion: '0.1.0', shoulderDystocia: snapshot(engine) })).toBeNull();
  });
});
