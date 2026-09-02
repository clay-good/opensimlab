/**
 * The worked example and observed-state tutor for an emergency where
 * everything at the bedside is only a bridge.
 *
 * The elevation, the position and the minimal handling all buy time and none
 * of them fixes anything. The only treatment is the birth, so the thing that
 * has to be arranged first is the room it happens in.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { UMBILICAL_CORD_PROLAPSE_URGENT_BIRTH_COORDINATION as SCENARIO } from '../../src/modules/obstetrics/scenarios/umbilical-cord-prolapse-urgent-birth-coordination';
import { CORD_PROLAPSE_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/umbilical-cord-prolapse-urgent-birth-coordination-fixtures';
import {
  CORD_PROLAPSE_DEMONSTRATION_VERSION, cordProlapseDemonstrationStep,
  supportsCordProlapseDemonstration,
} from '../../src/modules/obstetrics/demo/umbilical-cord-prolapse-urgent-birth-coordination-demonstration';
import { cordProlapseInlinePrompt } from '../../src/modules/obstetrics/tutor/umbilical-cord-prolapse-urgent-birth-coordination-guidance';
import type { CordProlapseAction } from '../../src/modules/obstetrics/umbilical-cord-prolapse-urgent-birth-coordination';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsCordProlapseAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: CordProlapseAction) => {
  engine.apply({ tick, type: 'umbilical-cord-prolapse-urgent-birth-coordination-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = cordProlapseDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'umbilical-cord-prolapse-urgent-birth-coordination-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Opens A Theatre First', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(CORD_PROLAPSE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCordProlapseDemonstration(SCENARIO)).toBe(true);
    expect(supportsCordProlapseDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCordProlapseDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'bridge', 'birth-plan', 'reassess', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.bridgeAtTick!);
    expect(patient.bridgeAtTick).toBeLessThan(patient.birthPlanAtTick!);
    expect(patient.birthPlanAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('opens a theatre before anything else, and says why', () => {
    expect(beats[0]).toBe('support');
    const support = narrations[0]!;
    expect(support).toContain('get a theatre opened now');
    expect(support).toContain('the only treatment for a cord prolapse with a compromised fetus is the birth'.replace('the only', 'The only'));
    expect(support).toContain('the slowest thing to arrange is the room it happens in');
  });

  it('reads the supplied examination for what it implies', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('Take the supplied examination as the diagnosis');
    expect(context).toContain('the cord is being compressed');
    expect(context).toContain('not going to be born vaginally in the next few minutes');
  });

  it('treats the bedside measures as a bridge rather than the treatment', () => {
    const bridge = narrations[beats.indexOf('bridge')]!;
    expect(bridge).toContain('as a bridge rather than as the treatment');
    expect(bridge).toContain('None of them relieves the compression permanently');
    expect(bridge).toContain('none of them is a reason to spend another minute at the bedside');
    expect(bridge).toContain('on the way to theatre, not instead of going');
  });

  it('makes the urgency this case rather than a remembered number', () => {
    const plan = narrations[beats.indexOf('birth-plan')]!;
    expect(plan).toContain('audit standards rather than a deadline');
    expect(plan).toContain('Her safety is not traded for speed');
    expect(plan).toContain('before the birth rather than after');
  });

  it('ends in theatre with the birth still ahead', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the transfer is done and the birth is not');
    expect(handoff).toContain('nothing here establishes fetal recovery');
    expect(narration).toContain('a hand still relieving the cord');
    expect(narration).toContain('This ends the example, not the emergency.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.fetalRecoveryProven).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.authoredCordProlapse).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the fetus has recovered', 'the baby is safe now', 'the compression is relieved', 'she has been delivered']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('touches nothing, handles no cord, and chooses no birth', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.fetalMonitoringInterpretedByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.cordHandledByLearner).toBe(false);
    expect(patient.cordReplacementAttemptedByLearner).toBe(false);
    expect(patient.presentingPartElevatedByLearner).toBe(false);
    expect(patient.bladderFilledByLearner).toBe(false);
    expect(patient.positionChangedByLearner).toBe(false);
    expect(patient.drugDoseRouteSelectedByLearner).toBe(false);
    expect(patient.anesthesiaSelectedByLearner).toBe(false);
    expect(patient.birthModeSelectedByLearner).toBe(false);
    expect(patient.deliveryPerformedByLearner).toBe(false);
    expect(patient.newbornCarePerformedByLearner).toBe(false);
    expect(patient.procedureSelectedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['push the cord back', 'fill her bladder', 'lift the presenting part', 'take her for a spinal']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Opens A Theatre First', () => {
  it('opens on opening a theatre', () => {
    const engine = create(); engine.step();
    const prompt = cordProlapseInlinePrompt('guided', { scenarioVersion: '0.1.0', cordProlapse: snapshot(engine) })!;
    expect(prompt.id).toBe('cord-support');
    expect(prompt.suggestion).toContain('get a theatre opened now');
    expect(prompt.because).toContain('the slowest thing to arrange is the room it happens in');
  });

  it('reads the examination for what it implies once the room is booked', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = cordProlapseInlinePrompt('guided', { scenarioVersion: '0.1.0', cordProlapse: snapshot(engine) })!;
    expect(prompt.id).toBe('cord-context');
    expect(prompt.suggestion).toContain('read what it implies');
    expect(prompt.because).toContain('not going to be born vaginally in the next few minutes');
  });

  it('names the bedside measures as a bridge', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = cordProlapseInlinePrompt('guided', { scenarioVersion: '0.1.0', cordProlapse: snapshot(engine) })!;
    expect(prompt.id).toBe('cord-bridge');
    expect(prompt.suggestion).toContain('as a bridge rather than as the treatment');
    expect(prompt.because).toContain('none of them is a reason to spend another minute at the bedside');
  });

  it('bounds the time target to an audit standard', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = cordProlapseInlinePrompt('guided', { scenarioVersion: '0.1.0', cordProlapse: snapshot(engine) })!;
    expect(prompt.id).toBe('cord-birth-plan');
    expect(prompt.because).toContain('audit standards rather than a deadline');
    expect(prompt.because).toContain('Her safety is not traded for speed');
  });

  it('never claims recovery, a completed birth, or a chosen anesthetic', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = cordProlapseInlinePrompt('guided', { scenarioVersion: '0.1.0', cordProlapse: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the fetus has recovered', 'the baby is safe now', 'she has been delivered', 'take her for a spinal']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(cordProlapseInlinePrompt('guided', { scenarioVersion: '0.1.0', cordProlapse: patient })!.id).toBe('cord-reassess');
    expect(cordProlapseInlinePrompt('coached', { scenarioVersion: '0.1.0', cordProlapse: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(cordProlapseInlinePrompt('unassisted', { scenarioVersion: '0.1.0', cordProlapse: patient })).toBeNull();
    expect(cordProlapseInlinePrompt('guided', { scenarioVersion: '0.1.1', cordProlapse: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(cordProlapseInlinePrompt('guided', { scenarioVersion: '0.1.0', cordProlapse: snapshot(engine) })).toBeNull();
  });
});
