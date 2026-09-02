/**
 * The worked example and observed-state tutor for a diagnosis that only the
 * operation can make.
 *
 * Nothing at the bedside will confirm a uterine rupture, so waiting to be sure
 * means waiting for the laparotomy — which is exactly the thing the waiting
 * delays.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SUSPECTED_UTERINE_RUPTURE_RECOGNITION as SCENARIO } from '../../src/modules/obstetrics/scenarios/suspected-uterine-rupture-recognition';
import { UTERINE_RUPTURE_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/suspected-uterine-rupture-recognition-fixtures';
import {
  UTERINE_RUPTURE_DEMONSTRATION_VERSION, uterineRuptureDemonstrationStep,
  supportsUterineRuptureDemonstration,
} from '../../src/modules/obstetrics/demo/suspected-uterine-rupture-recognition-demonstration';
import { uterineRuptureInlinePrompt } from '../../src/modules/obstetrics/tutor/suspected-uterine-rupture-recognition-guidance';
import type { UterineRuptureAction } from '../../src/modules/obstetrics/suspected-uterine-rupture-recognition';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsUterineRuptureAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: UterineRuptureAction) => {
  engine.apply({ tick, type: 'suspected-uterine-rupture-recognition-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = uterineRuptureDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'suspected-uterine-rupture-recognition-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Acts On The Suspicion', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(UTERINE_RUPTURE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsUterineRuptureDemonstration(SCENARIO)).toBe(true);
    expect(supportsUterineRuptureDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsUterineRuptureDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'uncertainty', 'readiness', 'reassess', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.uncertaintyAtTick!);
    expect(patient.uncertaintyAtTick).toBeLessThan(patient.readinessAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('calls for theatre on the suspicion, and says why nothing will upgrade it', () => {
    expect(beats[0]).toBe('support');
    const support = narrations[0]!;
    expect(support).toContain('on the suspicion, because nothing here will upgrade it');
    expect(support).toContain('confirmed by opening the abdomen and not before');
    expect(support).toContain('waiting for the operation that the waiting is delaying');
  });

  it('reads the findings as one coupled pattern rather than a list', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('as one coupled pattern rather than a list');
    expect(context).toContain('Any one of those has other explanations.');
    expect(context).toContain('appearing together twelve minutes ago');
  });

  it('keeps the diagnosis suspected while acting at full urgency', () => {
    const uncertainty = narrations[beats.indexOf('uncertainty')]!;
    expect(uncertainty).toContain('The classic triad is neither necessary nor reliable');
    expect(uncertainty).toContain('even it is not specific');
    expect(uncertainty).toContain('the same posture here rather than opposite ones');
  });

  it('runs the readiness in parallel and puts fertility before theatre', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('in parallel rather than in sequence');
    expect(readiness).toContain('costs the same minutes');
    expect(readiness).toContain('decided while she is asleep');
  });

  it('ends with the abdomen open and nothing settled', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('The abdomen is open and nothing is settled');
    expect(handoff).toContain('no operative confirmation');
    expect(narration).toContain('the suspicion still a suspicion');
    expect(narration).toContain('This ends the example, not the emergency.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.ruptureOperativelyConfirmed).toBe(false);
    expect(patient.hemostasisProven).toBe(false);
    expect(patient.fetalRecoveryProven).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.fertilityOutcomePredicted).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.authoredSuspectedUterineRupture).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the uterus has ruptured', 'the bleeding is controlled', 'this is not an abruption', 'she will keep her uterus']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('touches nothing, confirms nothing, and chooses no operation', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.fetalMonitoringInterpretedByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.infusionChangedByLearner).toBe(false);
    expect(patient.resuscitationDeliveredByLearner).toBe(false);
    expect(patient.drugDoseRouteTargetSelectedByLearner).toBe(false);
    expect(patient.anesthesiaSelectedByLearner).toBe(false);
    expect(patient.deliveryPerformedByLearner).toBe(false);
    expect(patient.surgeryPerformedByLearner).toBe(false);
    expect(patient.repairSelectedByLearner).toBe(false);
    expect(patient.hysterectomyDeterminedByLearner).toBe(false);
    expect(patient.newbornCarePerformedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['perform a hysterectomy', 'repair the scar', 'give a general anaesthetic', 'stop the oxytocin']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Acts On The Suspicion', () => {
  it('opens by calling for theatre on the suspicion', () => {
    const engine = create(); engine.step();
    const prompt = uterineRuptureInlinePrompt('guided', { scenarioVersion: '0.1.0', uterineRupture: snapshot(engine) })!;
    expect(prompt.id).toBe('rupture-support');
    expect(prompt.suggestion).toContain('nothing here will upgrade it');
    expect(prompt.because).toContain('confirmed by opening the abdomen and not before');
  });

  it('couples the findings once the response is running', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = uterineRuptureInlinePrompt('guided', { scenarioVersion: '0.1.0', uterineRupture: snapshot(engine) })!;
    expect(prompt.id).toBe('rupture-context');
    expect(prompt.suggestion).toContain('as one coupled pattern rather than a list');
    expect(prompt.because).toContain('Any one of those has other explanations.');
  });

  it('refuses the classic triad and keeps the alternatives alive', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = uterineRuptureInlinePrompt('guided', { scenarioVersion: '0.1.0', uterineRupture: snapshot(engine) })!;
    expect(prompt.id).toBe('rupture-uncertainty');
    expect(prompt.suggestion).toContain('keep the alternatives alive while you act on it');
    expect(prompt.because).toContain('The classic triad is neither necessary nor reliable');
  });

  it('puts the fertility conversation before theatre', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = uterineRuptureInlinePrompt('guided', { scenarioVersion: '0.1.0', uterineRupture: snapshot(engine) })!;
    expect(prompt.id).toBe('rupture-readiness');
    expect(prompt.because).toContain('costs the same minutes');
    expect(prompt.because).toContain('decided while she is asleep');
  });

  it('never confirms the rupture, claims hemostasis, or chooses an operation', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = uterineRuptureInlinePrompt('guided', { scenarioVersion: '0.1.0', uterineRupture: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the uterus has ruptured', 'the bleeding is controlled', 'perform a hysterectomy', 'she will keep her uterus']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(uterineRuptureInlinePrompt('guided', { scenarioVersion: '0.1.0', uterineRupture: patient })!.id).toBe('rupture-reassess');
    expect(uterineRuptureInlinePrompt('coached', { scenarioVersion: '0.1.0', uterineRupture: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(uterineRuptureInlinePrompt('unassisted', { scenarioVersion: '0.1.0', uterineRupture: patient })).toBeNull();
    expect(uterineRuptureInlinePrompt('guided', { scenarioVersion: '0.1.1', uterineRupture: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(uterineRuptureInlinePrompt('guided', { scenarioVersion: '0.1.0', uterineRupture: snapshot(engine) })).toBeNull();
  });
});
