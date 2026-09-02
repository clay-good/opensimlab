/**
 * The worked example and observed-state tutor for a man who is well because of
 * a tube.
 *
 * Everything good about his current state is being produced by a drain, and a
 * drain can stop working while the patient still looks fine.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SPONTANEOUS_TENSION_PNEUMOTHORAX_POST_DRAINAGE_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/spontaneous-tension-pneumothorax-post-drainage-reassessment';
import { POST_TENSION_PNEUMOTHORAX_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/spontaneous-tension-pneumothorax-post-drainage-reassessment-fixtures';
import {
  POST_TENSION_PNEUMOTHORAX_DEMONSTRATION_VERSION, postTensionPneumothoraxDemonstrationStep,
  supportsPostTensionPneumothoraxDemonstration,
} from '../../src/modules/respiratory-medicine/demo/spontaneous-tension-pneumothorax-post-drainage-reassessment-demonstration';
import { postTensionPneumothoraxInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/spontaneous-tension-pneumothorax-post-drainage-reassessment-guidance';
import type { PostTensionPneumothoraxAction } from '../../src/modules/respiratory-medicine/spontaneous-tension-pneumothorax-post-drainage-reassessment';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.postTensionPneumothoraxAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PostTensionPneumothoraxAction) => {
  engine.apply({ tick, type: 'spontaneous-tension-pneumothorax-post-drainage-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = postTensionPneumothoraxDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'spontaneous-tension-pneumothorax-post-drainage-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Reads The Drain As A System', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(POST_TENSION_PNEUMOTHORAX_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPostTensionPneumothoraxDemonstration(SCENARIO)).toBe(true);
    expect(supportsPostTensionPneumothoraxDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPostTensionPneumothoraxDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all five recorded steps in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'drainage-response', 'system', 'etiology', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.drainageResponseAtTick!);
    expect(patient.drainageResponseAtTick).toBeLessThan(patient.systemAtTick!);
    expect(patient.systemAtTick).toBeLessThan(patient.etiologyAtTick!);
    expect(patient.etiologyAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('credits the decision to treat the pattern rather than confirm it', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('treated the pattern rather than waiting to confirm it');
    expect(trajectory).toContain('why there is a patient to reassess');
    expect(patient.priorTensionPhysiologyAuthored).toBe(true);
    expect(patient.experiencedTeamDrainageAuthored).toBe(true);
  });

  it('credits the response without upgrading it into a resolution', () => {
    const response = narrations[beats.indexOf('drainage-response')]!;
    expect(response).toContain('Partial is the word that matters');
    expect(response).toContain('neither durable drain function nor complete re-expansion');
    expect(response).toContain('true at a point in time rather than settled');
  });

  it('pairs each drain observation with what its failure would look like', () => {
    const system = narrations[beats.indexOf('system')]!;
    expect(system).toContain('The swing says the drain is communicating with the pleural space');
    expect(system).toContain('the bubbling says the air leak has not sealed');
    expect(system).toContain('a thing that can stop being true');
    expect(system).toContain('fine right up until he is not');
  });

  it('reads the emphysema as making this a secondary pneumothorax', () => {
    const etiology = narrations[beats.indexOf('etiology')]!;
    expect(etiology).toContain('a secondary spontaneous pneumothorax rather than a primary one');
    expect(etiology).toContain('the threshold for a definitive pleural procedure');
    expect(etiology).toContain('urgent rather than elective');
    // Either lane may be opened first; the example reads the drain system
    // first because a failing drain is the more time-critical of the two.
    expect(beats.indexOf('system')).toBeLessThan(beats.indexOf('etiology'));
  });

  it('ends on a drain that is working now', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('what each would look like if it failed');
    expect(handoff).toContain('decisions nobody has made yet');
    expect(narration).toContain('dependent on a piece of equipment nobody has promised will keep working');
    expect(narration).toContain('This ends the example, not the admission.');
  });

  it('delivers nothing, selects nothing, and predicts nothing', () => {
    expect(patient.decompressionPerformedByLearner).toBe(false);
    expect(patient.chestDrainPlacedByLearner).toBe(false);
    expect(patient.drainManipulatedByLearner).toBe(false);
    expect(patient.suctionOrClampSelected).toBe(false);
    expect(patient.deviceOrSiteSelected).toBe(false);
    expect(patient.oxygenDeliveredByLearner).toBe(false);
    expect(patient.medicationDeliveredByLearner).toBe(false);
    expect(patient.testAcquiredByLearner).toBe(false);
    expect(patient.procedurePerformedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.recurrencePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the lung is up', 'the leak has sealed', 'he can go home', 'it will recur']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    for (const forbidden of ['clamp the drain', 'put it on suction', 'pull the tube', 'book a pleurodesis']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Reads The Drain As A System', () => {
  it('opens on how close this was', () => {
    const engine = create(); engine.step();
    const prompt = postTensionPneumothoraxInlinePrompt('guided', { scenarioVersion: '0.1.0', postTensionPneumothorax: snapshot(engine) })!;
    expect(prompt.id).toBe('ptx-trajectory');
    expect(prompt.suggestion).toContain('how close this was six hours ago');
    expect(prompt.because).toContain('why there is a patient to reassess');
  });

  it('credits the response without resolving it next', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = postTensionPneumothoraxInlinePrompt('guided', { scenarioVersion: '0.1.0', postTensionPneumothorax: snapshot(engine) })!;
    expect(prompt.id).toBe('ptx-drainage-response');
    expect(prompt.suggestion).toContain('without upgrading it into a resolution');
    expect(prompt.because).toContain('Partial is the word that matters');
  });

  it('reads the drain as a system before the planning', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = postTensionPneumothoraxInlinePrompt('guided', { scenarioVersion: '0.1.0', postTensionPneumothorax: snapshot(engine) })!;
    expect(prompt.id).toBe('ptx-system');
    expect(prompt.suggestion).toContain('before you plan anything long-term');
    expect(prompt.because).toContain('fine right up until he is not');
  });

  it('names the secondary etiology and whose decisions these are', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = postTensionPneumothoraxInlinePrompt('guided', { scenarioVersion: '0.1.0', postTensionPneumothorax: snapshot(engine) })!;
    expect(prompt.id).toBe('ptx-etiology');
    expect(prompt.suggestion).toContain('none of them are yours to settle');
    expect(prompt.because).toContain('a secondary spontaneous pneumothorax rather than a primary one');
  });

  it('never claims re-expansion, a sealed leak, or touches the drain', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = postTensionPneumothoraxInlinePrompt('guided', { scenarioVersion: '0.1.0', postTensionPneumothorax: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['the lung is up', 'the leak has sealed', 'clamp the drain', 'put it on suction']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(postTensionPneumothoraxInlinePrompt('unassisted', { scenarioVersion: '0.1.0', postTensionPneumothorax: patient })).toBeNull();
    expect(postTensionPneumothoraxInlinePrompt('guided', { scenarioVersion: '0.1.1', postTensionPneumothorax: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(postTensionPneumothoraxInlinePrompt('guided', { scenarioVersion: '0.1.0', postTensionPneumothorax: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(postTensionPneumothoraxInlinePrompt(level, { scenarioVersion: '0.1.0', postTensionPneumothorax: snapshot(engine) })).not.toBeNull();
    }
  });
});
