/**
 * The worked example and observed-state tutor for a pressure that answers and will not hold.
 *
 * The failure this example must not model is calling only once the patient has fallen again.
 * It is held here to calling while the last thing that happened was an improvement, and to
 * never naming an injury, because nothing available in the lesson can establish one.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { TRANSIENT_RESPONSE_A_PATIENT_WHO_WILL_NOT_STAY_UP as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/transient-response-a-patient-who-will-not-stay-up';
import { TRANSIENT_RESPONSE_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/transient-response-fixtures';
import {
  TRANSIENT_RESPONSE_DEMONSTRATION_VERSION, transientResponseDemonstrationStep, supportsTransientResponseDemonstration,
} from '../../src/modules/surgery-trauma/demo/transient-response-demonstration';
import { transientResponseInlinePrompt } from '../../src/modules/surgery-trauma/transient-response-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.transientResponse;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = transientResponseDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'transient-response-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Calls Before The Next Fall', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(TRANSIENT_RESPONSE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsTransientResponseDemonstration(SCENARIO)).toBe(true);
    expect(supportsTransientResponseDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('runs to a handoff through the real engine, in the taught order', () => {
    expect(patient.ended).toBe('handoff');
    expect(beats).toEqual(['mechanism', 'shape', 'picture', 'escalate', 'intent', 'boundaries',
      'hold', 'fallen', 'reassess', 'handoff']);
  });

  // The failure mode is treating the next deterioration as the thing that licenses the call,
  // so the example must call while the most recent news was good.
  it('calls the team before the third fall, not after it', () => {
    expect(beats.indexOf('escalate')).toBeLessThan(beats.indexOf('fallen'));
    expect(narrations[beats.indexOf('escalate')]).toContain('nothing has just happened');
  });

  it('starts with the clock rather than with the blood pressure', () => {
    expect(beats[0]).toBe('mechanism');
    expect(narrations[0]).toContain('Start with the clock');
  });

  // Forbid the assertion, not the subject: the example must be able to talk about bleeding as
  // the reason for the call while refusing to say what is bleeding or what will be found.
  it('never names an injury and never predicts the operation, in any beat', () => {
    const joined = narrations.join(' ').toLowerCase();
    for (const claim of ['ruptured spleen', 'splenic', 'liver laceration', 'will find',
      'the surgeon will', 'proves', 'diagnosed with']) {
      expect(joined, `the example asserted "${claim}"`).not.toContain(claim);
    }
    expect(joined).toContain('the pattern on the chart was already enough');
  });

  it('says that the fall is not new information', () => {
    const hold = narrations[beats.indexOf('hold')]!;
    expect(hold).toContain('Nothing new is coming to make this decision for you');
    const fallen = narrations[beats.indexOf('fallen')]!;
    expect(fallen).toContain('This is not new information');
  });

  it('keeps the half of the evidence that argues for scanning', () => {
    const boundaries = narrations[beats.indexOf('boundaries')]!;
    expect(boundaries).toContain('almost threefold');
    expect(boundaries).toContain('read the ratio, not the sentence');
    const picture = narrations[beats.indexOf('picture')]!;
    expect(picture).toContain('not an argument against scanning trauma patients');
  });

  it('ends with the decision owned by the team and nothing about the injury settled', () => {
    expect(patient.teamObserved).toBe(true);
    expect(narrations.at(-1)).toContain('nobody waited for a better reason');
  });

  it('says nothing at all on the unassisted setting', () => {
    const engine = create();
    engine.step();
    expect(transientResponseInlinePrompt('unassisted', { scenarioVersion: '0.1.0', transientResponse: snapshot(engine) }))
      .toBeNull();
  });

  it('withholds exactly the two non-urgent beats when coached', () => {
    const engine = create();
    const guided: (string | null)[] = []; const coached: (string | null)[] = [];
    for (let tick = 0; tick <= 200_000; tick += 1) {
      const patientNow = snapshot(engine);
      const step = transientResponseDemonstrationStep(patientNow);
      if (step.finished) break;
      const input = { scenarioVersion: '0.1.0', transientResponse: patientNow };
      guided.push(transientResponseInlinePrompt('guided', input)?.id ?? null);
      coached.push(transientResponseInlinePrompt('coached', input)?.id ?? null);
      if (step.action) engine.apply({ tick, type: 'transient-response-response', payload: { action: step.action } });
      engine.step();
    }
    const withheld = [...new Set(guided.filter((id, index) => id !== null && coached[index] === null))];
    expect(withheld.sort()).toEqual(['transient-response-handoff', 'transient-response-hold']);
    expect(new Set(guided.filter((id): id is string => id !== null)).size).toBeGreaterThan(5);
  });

  it('is silent on a version it was not written for, and after the run ends', () => {
    const engine = create();
    engine.step();
    expect(transientResponseInlinePrompt('guided', { scenarioVersion: '0.1.1', transientResponse: snapshot(engine) }))
      .toBeNull();
    expect(transientResponseInlinePrompt('guided', { scenarioVersion: '0.1.0', transientResponse: patient })).toBeNull();
  });
});
