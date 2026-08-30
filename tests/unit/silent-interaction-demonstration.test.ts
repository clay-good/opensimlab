/**
 * The worked example and observed-state tutor for a harm with nothing to find.
 *
 * Nothing becomes abnormal in this lesson at any point, however long it runs. A
 * demonstration is the wrong shape for that by default — it wants a moment where
 * the warned-about thing appears and vindicates the beat before it — so the tests
 * assert the absence, rather than assuming a payoff arrives.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SILENT_INTERACTION_A_HARM_WITH_NOTHING_TO_FIND as SCENARIO } from '../../src/modules/oncology/scenarios/silent-interaction-a-harm-with-nothing-to-find';
import { SILENT_INTERACTION_FIXTURES as FIXTURES } from '../../src/modules/oncology/silent-interaction-fixtures';
import {
  SILENT_INTERACTION_DEMONSTRATION_VERSION, silentInteractionDemonstrationStep,
  supportsSilentInteractionDemonstration,
} from '../../src/modules/oncology/demo/silent-interaction-demonstration';
import { silentInteractionInlinePrompt } from '../../src/modules/oncology/silent-interaction-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.silentInteraction;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  let everAbnormal = false;
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = silentInteractionDemonstrationStep(snapshot(engine));
    if (snapshot(engine)?.anyAbnormalFinding) everAbnormal = true;
    if (step.finished) return { beats, everAbnormal, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) beats.push(step.id);
    if (step.action) engine.apply({ tick, type: 'silent-interaction-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Acts On A Patient Who Stays Normal', () => {
  const { beats, everAbnormal, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(SILENT_INTERACTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsSilentInteractionDemonstration(SCENARIO)).toBe(true);
    expect(supportsSilentInteractionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('never has anything abnormal to point at, from first tick to handoff', () => {
    // The whole difficulty of the lesson, asserted rather than assumed: there is
    // no vindicating moment, and the example still has to be worth watching.
    expect(everAbnormal).toBe(false);
    expect(patient.anyAbnormalFinding).toBe(false);
    expect(patient.ended).toBe('handoff');
  });

  it('reconciles what she takes before recording the interaction', () => {
    expect(beats[0]).toBe('reconcile');
    expect(beats.indexOf('reconcile')).toBeLessThan(beats.indexOf('direction'));
    expect(beats.indexOf('direction')).toBeLessThan(beats.indexOf('escalate'));
  });

  it('never instructs her to stop a tablet somebody else prescribed', () => {
    expect(patient.stopInstructionAttempted).toBe(false);
    expect(patient.nothingToDoAttempted).toBe(false);
    expect(patient.theoreticalAttempted).toBe(false);
    expect(patient.notesOnlyAttempted).toBe(false);
  });
});

describe('Requirement: Nothing Appears However Long It Runs', () => {
  it('stays entirely normal through a run with no actions at all', () => {
    const engine = create();
    for (let tick = 0; tick <= 80_000; tick += 1) engine.step();
    const patient = snapshot(engine)!;
    expect(patient.anyAbnormalFinding).toBe(false);
    // And the lists still disagree, which is the only thing that ever arrives.
    expect(patient.pharmacyRecordArrived).toBe(true);
  });
});

describe('Requirement: The Tutor Reads Absence As The Situation', () => {
  it('opens on reconciling what she actually takes', () => {
    const engine = create(); engine.step();
    const prompt = silentInteractionInlinePrompt('guided', {
      scenarioVersion: '0.1.0', silentInteraction: snapshot(engine),
    })!;
    expect(prompt.id).toBe('silent-interaction-reconcile');
    expect(prompt.because).toContain('answerable by asking her');
  });

  it('never tells the learner to stop or change her medication', () => {
    const engine = create();
    const seen: string[] = [];
    for (const action of ['reconcile-what-she-is-actually-taking',
      'record-the-interaction-and-its-direction', 'escalate-to-the-treating-team-now',
      'record-bounded-treatment-intent'] as const) {
      const prompt = silentInteractionInlinePrompt('guided', {
        scenarioVersion: '0.1.0', silentInteraction: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      engine.apply({ tick: 0, type: 'silent-interaction-response', payload: { action } });
      engine.step();
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['tell her to stop', 'stop the acid', 'she should stop', 'switch her to']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted and bound to the exact content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(silentInteractionInlinePrompt('unassisted', { scenarioVersion: '0.1.0', silentInteraction: patient })).toBeNull();
    expect(silentInteractionInlinePrompt('guided', { scenarioVersion: '0.1.1', silentInteraction: patient })).toBeNull();
  });
});
