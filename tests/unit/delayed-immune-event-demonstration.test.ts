/**
 * The worked example and the observed-state tutor for the delayed immune event.
 *
 * The example is driven here through the real engine rather than asserted as a
 * script, because a demonstration that cannot actually reach handoff is worse
 * than none: it teaches a sequence the scenario would refuse.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { DELAYED_IMMUNE_EVENT_A_DRUG_THAT_STOPPED_MONTHS_AGO as SCENARIO } from '../../src/modules/oncology/scenarios/delayed-immune-event-a-drug-that-stopped-months-ago';
import { DELAYED_IMMUNE_EVENT_FIXTURES as FIXTURES } from '../../src/modules/oncology/delayed-immune-event-fixtures';
import {
  DELAYED_IMMUNE_EVENT_DEMONSTRATION_VERSION, delayedImmuneEventDemonstrationStep,
  supportsDelayedImmuneEventDemonstration,
} from '../../src/modules/oncology/demo/delayed-immune-event-demonstration';
import { delayedImmuneEventInlinePrompt } from '../../src/modules/oncology/delayed-immune-event-tutor';

const create = () => new AnesthesiaEngine({
  scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US',
});
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.delayedImmuneEvent;

/** Step the engine, letting the example choose every action, exactly as the learner would see it. */
function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = delayedImmuneEventDemonstrationStep(snapshot(engine));
    if (step.finished) return { engine, beats, patient: snapshot(engine)! };
    if (step.action) {
      if (beats.at(-1) !== step.id) beats.push(step.id);
      engine.apply({ tick, type: 'delayed-immune-event-response', payload: { action: step.action } });
    } else if (beats.at(-1) !== step.id) beats.push(step.id);
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Worked Example Reaches Handoff Through The Real Engine', () => {
  const { beats, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(DELAYED_IMMUNE_EVENT_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsDelayedImmuneEventDemonstration(SCENARIO)).toBe(true);
    expect(supportsDelayedImmuneEventDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('ends in handoff rather than instructor takeover', () => {
    expect(patient.ended).toBe('handoff');
  });

  it('records the exposure before anything that depends on it', () => {
    expect(beats[0]).toBe('exposure');
    expect(beats.indexOf('exposure')).toBeLessThan(beats.indexOf('escalate'));
    expect(beats.indexOf('course')).toBeLessThan(beats.indexOf('escalate'));
    expect(beats.indexOf('infection')).toBeLessThan(beats.indexOf('escalate'));
  });

  it('assesses again after the service answers rather than handing over a stale picture', () => {
    expect(beats.indexOf('reassess')).toBeGreaterThan(beats.indexOf('observe-service'));
    expect(beats.at(-1)).toBe('handoff');
    expect(patient.serviceObserved).toBe(true);
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.attributionExclusionAttempted).toBe(false);
    expect(patient.motilityAttempted).toBe(false);
    expect(patient.waitForResultsAttempted).toBe(false);
    expect(patient.dischargeAttempted).toBe(false);
  });

  it('narrates both waits as authored contrasts rather than as clinical waiting', () => {
    // The scenario refuses waiting for results before escalating. An example that
    // made waiting look virtuous would teach the thing the lesson refuses.
    const engine = create();
    engine.apply({ tick: 0, type: 'delayed-immune-event-response', payload: { action: 'record-the-completed-exposure' } });
    engine.apply({ tick: 0, type: 'delayed-immune-event-response', payload: { action: 'record-the-symptom-course' } });
    engine.apply({ tick: 0, type: 'delayed-immune-event-response', payload: { action: 'record-infection-evaluation-in-parallel' } });
    engine.step();
    const waiting = delayedImmuneEventDemonstrationStep(snapshot(engine));
    expect(waiting.id).toBe('observe-course');
    expect(waiting.narration).toContain('authored, not a required clinical wait');
    expect(waiting.action).toBeUndefined();
  });
});

describe('Requirement: The Tutor Does Not Hand Over The Exposure', () => {
  it('says nothing at all in unassisted mode', () => {
    const engine = create(); engine.step();
    expect(delayedImmuneEventInlinePrompt('unassisted', {
      scenarioVersion: '0.1.0', delayedImmuneEvent: snapshot(engine),
    })).toBeNull();
  });

  it('never supplies the diagnosis, the grade, or the treatment', () => {
    // The tray states the exposure from the first screen; this lesson is not a hunt
    // for a hidden fact. What must stay open is the far end, which belongs to the
    // qualified team — so no prompt may name a diagnosis, a grade, or a drug.
    const engine = create();
    const seen: string[] = [];
    for (const action of ['record-the-completed-exposure', 'record-the-symptom-course',
      'record-infection-evaluation-in-parallel', 'escalate-to-the-treating-service',
      'record-bounded-treatment-intent', 'review-boundaries'] as const) {
      const prompt = delayedImmuneEventInlinePrompt('guided', {
        scenarioVersion: '0.1.0', delayedImmuneEvent: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`);
      engine.apply({ tick: 0, type: 'delayed-immune-event-response', payload: { action } });
      engine.step();
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['colitis', 'corticosteroid', 'steroid', 'grade 2', 'mg', 'diagnosis is']) {
        expect(text.toLowerCase(), forbidden).not.toContain(forbidden.toLowerCase());
      }
    }
  });

  it('binds to the exact content version and falls silent once the branch ends', () => {
    const engine = create(); engine.step();
    expect(delayedImmuneEventInlinePrompt('guided', {
      scenarioVersion: '0.1.1', delayedImmuneEvent: snapshot(engine),
    })).toBeNull();
  });

  it('withholds the non-urgent prompts at the coached level', () => {
    const engine = create();
    for (const action of ['record-the-completed-exposure', 'record-the-symptom-course',
      'record-infection-evaluation-in-parallel'] as const) {
      engine.apply({ tick: 0, type: 'delayed-immune-event-response', payload: { action } });
    }
    engine.step();
    const patient = snapshot(engine);
    // The waiting beat is not urgent, so coached stays quiet while guided speaks.
    expect(delayedImmuneEventInlinePrompt('coached', { scenarioVersion: '0.1.0', delayedImmuneEvent: patient })).toBeNull();
    expect(delayedImmuneEventInlinePrompt('guided', { scenarioVersion: '0.1.0', delayedImmuneEvent: patient })?.id)
      .toBe('delayed-immune-event-observe-course');
  });
});
