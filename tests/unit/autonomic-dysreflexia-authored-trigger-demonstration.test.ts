/**
 * The worked example and observed-state tutor for a blood pressure that is only
 * alarming if you know the usual one.
 *
 * 178/106 looks unremarkable until his verified seated baseline of 98/62 and a
 * complete T4 lesion are beside it. Both the tutor and the example sit him up
 * before hunting anything, and both bound the physical act to one visible kink.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { AUTONOMIC_DYSREFLEXIA_AUTHORED_TRIGGER as SCENARIO } from '../../src/modules/neurology/scenarios/autonomic-dysreflexia-authored-trigger';
import { DYSREFLEXIA_FIXTURES as FIXTURES } from '../../src/modules/neurology/autonomic-dysreflexia-authored-trigger-fixtures';
import {
  DYSREFLEXIA_DEMONSTRATION_VERSION, dysreflexiaDemonstrationStep,
  supportsDysreflexiaDemonstration,
} from '../../src/modules/neurology/demo/autonomic-dysreflexia-authored-trigger-demonstration';
import { dysreflexiaInlinePrompt } from '../../src/modules/neurology/tutor/autonomic-dysreflexia-authored-trigger-guidance';
import type { DysreflexiaAction } from '../../src/modules/neurology/autonomic-dysreflexia-authored-trigger';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyAutonomicDysreflexiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: DysreflexiaAction) => {
  engine.apply({ tick, type: 'autonomic-dysreflexia-authored-trigger-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = dysreflexiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'autonomic-dysreflexia-authored-trigger-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Sits Him Up First', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(DYSREFLEXIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsDysreflexiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsDysreflexiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsDysreflexiaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'support', 'trigger', 'reassess', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.supportAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.triggerAtTick!);
    expect(patient.triggerAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('reads the pressure against his own baseline', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('eighty millimetres above his own systolic');
    expect(opening).toContain('would look unremarkable on anyone else');
    expect(opening).toContain('part of the reflex rather than a separate problem');
  });

  it('names the pattern urgent while leaving the alternatives open', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('enough to act on immediately');
    expect(recognition).toContain('not a diagnosis that closes anything');
    expect(patient.syndromePatternRecognized).toBe(true);
  });

  it('sits him up before going looking for anything', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('before going looking for anything');
    expect(support).toContain('including the ones where no trigger is ever found');
    expect(support).toContain('most often skipped');
    expect(beats.indexOf('support')).toBeLessThan(beats.indexOf('trigger'));
    expect(patient.qualifiedSupportActive).toBe(true);
  });

  it('starts at the bladder and frees only what is visible', () => {
    const trigger = narrations[beats.indexOf('trigger')]!;
    expect(trigger).toContain('that absence is the finding');
    expect(trigger).toContain('the entire physical act available here');
    expect(patient.externalTubingKinkReleased).toBe(true);
  });

  it('reads the two-step improvement as suggestive rather than proof', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('That sequence is suggestive');
    expect(handoff).toContain('does not prove the kink was the sole cause');
    expect(narration).toContain('still able to happen again');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.soleCauseProven).toBe(false);
    expect(patient.individualizedResponsePredicted).toBe(false);
    expect(patient.durableResolutionProven).toBe(false);
    expect(patient.complicationsExcluded).toBe(false);
    expect(patient.recurrenceExcluded).toBe(false);
    expect(patient.prognosisPredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.responseStateAuthored).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the kink was the cause', 'this is resolved', 'his pressure is normal now', 'it will not happen again']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('touches nothing but the kink anywhere', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.patientHistoryTakenByLearner).toBe(false);
    expect(patient.monitoringAcquiredByLearner).toBe(false);
    expect(patient.catheterManipulatedByLearner).toBe(false);
    expect(patient.bowelCarePerformedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.procedurePerformedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give nifedipine', 'flush the catheter', 'perform a rectal examination', 'replace the suprapubic tube']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Reads The Baseline First', () => {
  it('opens by putting his usual pressure beside this one', () => {
    const engine = create(); engine.step();
    const prompt = dysreflexiaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', dysreflexia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('dysreflexia-trajectory');
    expect(prompt.because).toContain('eighty millimetres above his own systolic');
  });

  it('names the pattern urgent without closing anything', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = dysreflexiaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', dysreflexia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('dysreflexia-recognition');
    expect(prompt.suggestion).toContain('leave the alternatives open');
    expect(prompt.because).toContain('enough to act on immediately');
    expect(prompt.because).toContain('not a diagnosis that closes anything');
  });

  it('sits him up before the search', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = dysreflexiaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', dysreflexia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('dysreflexia-support');
    expect(prompt.suggestion).toContain('before you go looking for anything');
    expect(prompt.because).toContain('including the ones where no trigger is ever found');
  });

  it('bounds the physical act to the visible kink', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = dysreflexiaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', dysreflexia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('dysreflexia-trigger');
    expect(prompt.because).toContain('that absence is the finding');
    expect(prompt.because).toContain('the entire physical act available here');
  });

  it('never names the sole cause, declares resolution, or picks a drug', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = dysreflexiaInlinePrompt('guided', {
        scenarioVersion: '0.1.0', dysreflexia: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the kink was the cause', 'this is resolved', 'it will not happen again', 'give nifedipine']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(dysreflexiaInlinePrompt('guided', { scenarioVersion: '0.1.0', dysreflexia: patient })!.id)
      .toBe('dysreflexia-reassess');
    expect(dysreflexiaInlinePrompt('coached', { scenarioVersion: '0.1.0', dysreflexia: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(dysreflexiaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', dysreflexia: patient })).toBeNull();
    expect(dysreflexiaInlinePrompt('guided', { scenarioVersion: '0.1.1', dysreflexia: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(dysreflexiaInlinePrompt('guided', { scenarioVersion: '0.1.0', dysreflexia: snapshot(engine) })).toBeNull();
  });
});
