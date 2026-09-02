/**
 * The worked example and observed-state tutor for a poisoning that is still
 * being delivered.
 *
 * Thirty-eight hours after the block nobody is thinking about local anesthetic,
 * and the quiet warnings were never going to be the loud part. The source is a
 * pump, so a room doing excellent resuscitation can leave it running. Both the
 * tutor and the example say the catheter first and give source cessation an
 * owner in the same breath as the airway and the lipid.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { DELAYED_LOCAL_ANESTHETIC_CNS_CARDIAC_TOXICITY as SCENARIO } from '../../src/modules/toxicology/scenarios/delayed-local-anesthetic-cns-cardiac-toxicity';
import { DELAYED_LAST_FIXTURES as FIXTURES } from '../../src/modules/toxicology/delayed-local-anesthetic-cns-cardiac-toxicity-fixtures';
import {
  DELAYED_LAST_DEMONSTRATION_VERSION, delayedLastDemonstrationStep,
  supportsDelayedLastDemonstration,
} from '../../src/modules/toxicology/demo/delayed-local-anesthetic-cns-cardiac-toxicity-demonstration';
import { delayedLastInlinePrompt } from '../../src/modules/toxicology/tutor/delayed-local-anesthetic-cns-cardiac-toxicity-guidance';
import type { DelayedLastAction } from '../../src/modules/toxicology/delayed-local-anesthetic-cns-cardiac-toxicity';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologyDelayedLastAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: DelayedLastAction) => {
  engine.apply({ tick, type: 'delayed-local-anesthetic-cns-cardiac-toxicity-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = delayedLastDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'delayed-local-anesthetic-cns-cardiac-toxicity-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Goes To The Pump', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(DELAYED_LAST_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsDelayedLastDemonstration(SCENARIO)).toBe(true);
    expect(supportsDelayedLastDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsDelayedLastDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognize', 'support', 'evidence', 'report', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.evidenceAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('says the catheter is still there before anything else', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('the catheter is still there');
    expect(opening).toContain('still being delivered is a different problem');
  });

  it('refuses all four early closures and distrusts the tidy sequence', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('No classic sequence, no clock, no single symptom, no seizure and no ECG interval');
    expect(recognize).toContain('the thing least worth relying on');
    expect(recognize).toContain('is the cardiac phase, not an incidental interval');
  });

  it('gives source cessation an owner, and says why it is the one that gets lost', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('is nobody’s by default');
    expect(support).toContain('the only step that changes how much drug she is still receiving');
    expect(beats.indexOf('support')).toBeLessThan(beats.indexOf('evidence'));
  });

  it('reads the conduction and the acidosis as one loop and determines no eligibility', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('a loop rather than a list');
    expect(evidence).toContain('an unverified pump is not a cleared one');
    expect(patient.rescueEligibilityDetermined).toBe(false);
  });

  it('finishes on a QRS that has not finished narrowing', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('keeps arriving after the pump stops');
    expect(handoff).toContain('prove none of it');
    expect(narration).toContain('still arriving');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.alternativeExcludedByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableSeizureControlProven).toBe(false);
    expect(patient.durableRhythmStabilityProven).toBe(false);
    expect(patient.durablePerfusionStabilityProven).toBe(false);
    expect(patient.neurologicRecoveryProven).toBe(false);
    expect(patient.sourceCompletenessProven).toBe(false);
    expect(patient.lipidSafetyProven).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the rhythm is stable now', 'the lipid worked', 'this is not a stroke', 'she will not seize again']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('handles no catheter and selects no lipid, sedative, dose, route, or circuit anywhere', () => {
    expect(patient.catheterHandledByLearner).toBe(false);
    expect(patient.lipidSelectedByLearner).toBe(false);
    expect(patient.seizureCareSelectedByLearner).toBe(false);
    expect(patient.oxygenSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    expect(patient.rhythmCareSelectedByLearner).toBe(false);
    expect(patient.eclsSelectedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['pull the catheter', 'give 1.5 ml/kg of lipid', 'push 2 mg of midazolam', 'cannulate for ecmo']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Says The Catheter First', () => {
  it('opens on a poisoning that is still being delivered', () => {
    const engine = create(); engine.step();
    const prompt = delayedLastInlinePrompt('guided', {
      scenarioVersion: '0.1.0', delayedLast: snapshot(engine),
    })!;
    expect(prompt.id).toBe('delayed-last-trajectory');
    expect(prompt.because).toContain('still being delivered is a different problem');
  });

  it('refuses the four closures and names the cardiac phase', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = delayedLastInlinePrompt('guided', {
      scenarioVersion: '0.1.0', delayedLast: snapshot(engine),
    })!;
    expect(prompt.id).toBe('delayed-last-recognize');
    expect(prompt.because).toContain('No classic sequence, no clock, no single symptom, no seizure and no ECG interval');
    expect(prompt.because).toContain('is the cardiac phase, not an incidental interval');
  });

  it('names the step that is nobody’s reflex', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = delayedLastInlinePrompt('guided', {
      scenarioVersion: '0.1.0', delayedLast: snapshot(engine),
    })!;
    expect(prompt.id).toBe('delayed-last-support');
    expect(prompt.because).toContain('is nobody’s by default');
    expect(prompt.because).toContain('the only step that changes how much drug she is still receiving');
  });

  it('keeps the pump unverified rather than cleared', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = delayedLastInlinePrompt('guided', {
      scenarioVersion: '0.1.0', delayedLast: snapshot(engine),
    })!;
    expect(prompt.id).toBe('delayed-last-evidence');
    expect(prompt.because).toContain('a loop rather than a list');
    expect(prompt.because).toContain('an unverified pump is not a cleared one');
  });

  it('never excludes an alternative, determines eligibility, or touches the catheter', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = delayedLastInlinePrompt('guided', {
        scenarioVersion: '0.1.0', delayedLast: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is not a stroke', 'she is eligible for lipid', 'pull the catheter', 'the rhythm is stable now']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(delayedLastInlinePrompt('guided', { scenarioVersion: '0.1.0', delayedLast: patient })!.id)
      .toBe('delayed-last-observe');
    expect(delayedLastInlinePrompt('coached', { scenarioVersion: '0.1.0', delayedLast: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(delayedLastInlinePrompt('unassisted', { scenarioVersion: '0.1.0', delayedLast: patient })).toBeNull();
    expect(delayedLastInlinePrompt('guided', { scenarioVersion: '0.1.1', delayedLast: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(delayedLastInlinePrompt('guided', { scenarioVersion: '0.1.0', delayedLast: snapshot(engine) })).toBeNull();
  });
});
