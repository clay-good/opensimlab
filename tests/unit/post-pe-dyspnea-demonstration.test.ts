/**
 * The worked example and observed-state tutor for the clinic visit that gets
 * dismissed.
 *
 * She walked two miles before the embolism and stops at 150 metres now, four
 * months later, and looks entirely comfortable sitting still.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { POST_PULMONARY_EMBOLISM_PERSISTENT_DYSPNEA as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/post-pulmonary-embolism-persistent-dyspnea';
import { POST_PE_DYSPNEA_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/post-pulmonary-embolism-persistent-dyspnea-fixtures';
import {
  POST_PE_DYSPNEA_DEMONSTRATION_VERSION, postPeDyspneaDemonstrationStep,
  supportsPostPeDyspneaDemonstration,
} from '../../src/modules/respiratory-medicine/demo/post-pulmonary-embolism-persistent-dyspnea-demonstration';
import { postPeDyspneaInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/post-pulmonary-embolism-persistent-dyspnea-guidance';
import type { PostPeDyspneaAction } from '../../src/modules/respiratory-medicine/post-pulmonary-embolism-persistent-dyspnea';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.postPeDyspneaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PostPeDyspneaAction) => {
  engine.apply({ tick, type: 'post-pulmonary-embolism-persistent-dyspnea-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = postPeDyspneaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'post-pulmonary-embolism-persistent-dyspnea-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Makes The Referral', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(POST_PE_DYSPNEA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPostPeDyspneaDemonstration(SCENARIO)).toBe(true);
    expect(supportsPostPeDyspneaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPostPeDyspneaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all five recorded steps in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'safety', 'evidence', 'referral', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.safetyAtTick!);
    expect(patient.safetyAtTick).toBeLessThan(patient.evidenceAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.referralAtTick!);
    expect(patient.referralAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('compares her old exercise tolerance with her current one', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('take the anticoagulation as given');
    expect(trajectory).toContain('verified history rather than something to prescribe');
    expect(trajectory).toContain('why someone properly treated is still this limited');
    expect(patient.acutePeConfirmedAuthored).toBe(true);
  });

  it('establishes current safety before interpreting anything', () => {
    const safety = narrations[beats.indexOf('safety')]!;
    expect(safety).toContain('a chronic limitation rather than an emergency');
    expect(safety).toContain('permanently excludes a recurrence');
    expect(safety).toContain('established rather than assumed');
  });

  it('reads the two reports as a reason to refer rather than a diagnosis', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('a reason to refer, not as a diagnosis');
    expect(evidence).toContain('what makes the perfusion scan the right test');
    expect(evidence).toContain('It does not diagnose CTEPD or CTEPH');
  });

  it('makes the referral and names who holds the anticoagulation', () => {
    const referral = narrations[beats.indexOf('referral')]!;
    expect(referral).toContain('the step the lesson exists for');
    expect(referral).toContain('the way it gets missed is that nobody makes the referral');
    expect(referral).toContain('when ownership goes missing');
  });

  it('ends on a limitation nobody has explained yet', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('what they raise rather than settle');
    expect(handoff).toContain('who is chasing it');
    expect(narration).toContain('no explanation yet for why she stops at 150 metres');
    expect(narration).toContain('This ends the example, not the investigation.');
  });

  it('delivers nothing, selects nothing, and predicts nothing', () => {
    expect(patient.anticoagulationDeliveredByLearner).toBe(false);
    expect(patient.testAcquiredByLearner).toBe(false);
    expect(patient.ctepdDiagnosed).toBe(false);
    expect(patient.treatmentSelected).toBe(false);
    expect(patient.procedurePerformedByLearner).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she has ctepd', 'this is deconditioning', 'her embolism has recurred', 'she is cured']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    for (const forbidden of ['stop the anticoagulant', 'order a ct', 'book a catheterisation', 'switch her to warfarin']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Makes The Referral', () => {
  it('opens by comparing before and after', () => {
    const engine = create(); engine.step();
    const prompt = postPeDyspneaInlinePrompt('guided', { scenarioVersion: '0.1.0', postPeDyspnea: snapshot(engine) })!;
    expect(prompt.id).toBe('post-pe-trajectory');
    expect(prompt.suggestion).toContain('take the anticoagulation as given');
    expect(prompt.because).toContain('why someone properly treated is still this limited');
  });

  it('establishes current safety next', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = postPeDyspneaInlinePrompt('guided', { scenarioVersion: '0.1.0', postPeDyspnea: snapshot(engine) })!;
    expect(prompt.id).toBe('post-pe-safety');
    expect(prompt.suggestion).toContain('before you interpret anything');
    expect(prompt.because).toContain('a chronic limitation rather than an emergency');
  });

  it('reads the reports as a reason to refer', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = postPeDyspneaInlinePrompt('guided', { scenarioVersion: '0.1.0', postPeDyspnea: snapshot(engine) })!;
    expect(prompt.id).toBe('post-pe-evidence');
    expect(prompt.suggestion).toContain('a reason to refer, not as a diagnosis');
    expect(prompt.because).toContain('It does not diagnose CTEPD or CTEPH');
  });

  it('names the referral as the step the lesson exists for', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = postPeDyspneaInlinePrompt('guided', { scenarioVersion: '0.1.0', postPeDyspnea: snapshot(engine) })!;
    expect(prompt.id).toBe('post-pe-referral');
    expect(prompt.because).toContain('the step the lesson exists for');
    expect(prompt.because).toContain('when ownership goes missing');
  });

  it('never diagnoses, blames deconditioning, or changes a drug', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = postPeDyspneaInlinePrompt('guided', { scenarioVersion: '0.1.0', postPeDyspnea: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['she has ctepd', 'this is deconditioning', 'stop the anticoagulant', 'she is cured']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(postPeDyspneaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', postPeDyspnea: patient })).toBeNull();
    expect(postPeDyspneaInlinePrompt('guided', { scenarioVersion: '0.1.1', postPeDyspnea: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(postPeDyspneaInlinePrompt('guided', { scenarioVersion: '0.1.0', postPeDyspnea: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(postPeDyspneaInlinePrompt(level, { scenarioVersion: '0.1.0', postPeDyspnea: snapshot(engine) })).not.toBeNull();
    }
  });
});
