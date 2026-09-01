/**
 * The worked example and observed-state tutor for a threshold met and a call
 * not made.
 *
 * The reasons not to call are good ones, so neither may dismiss them; they ask
 * for the obstacles to be written down instead. The example calls early, which
 * means the second conversation never happens — that is the lesson rather than a
 * convenience, and it is asserted here.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { AFFERENT_LIMB_A_THRESHOLD_MET_AND_A_CALL_NOT_MADE as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/afferent-limb-a-threshold-met-and-a-call-not-made';
import { AFFERENT_LIMB_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/afferent-limb-fixtures';
import {
  AFFERENT_LIMB_DEMONSTRATION_VERSION, afferentLimbDemonstrationStep, supportsAfferentLimbDemonstration,
} from '../../src/modules/medical-surgical-nursing/demo/afferent-limb-demonstration';
import { afferentLimbInlinePrompt } from '../../src/modules/medical-surgical-nursing/afferent-limb-tutor';
import type { AfferentLimbAction } from '../../src/modules/medical-surgical-nursing/afferent-limb';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.afferentLimb;
const advance = (engine: AnesthesiaEngine, tick: number, action: AfferentLimbAction) => {
  engine.apply({ tick, type: 'afferent-limb-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = afferentLimbDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'afferent-limb-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Calls Before The Reasons Accumulate', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(AFFERENT_LIMB_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAfferentLimbDemonstration(SCENARIO)).toBe(true);
    expect(supportsAfferentLimbDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats).toEqual(['criteria', 'obstacles', 'call', 'state', 'boundaries', 'monitor',
      'await', 'reassess', 'handoff']);
    expect(patient.ended).toBe('handoff');
  });

  it('calls early enough that the second conversation never happens', () => {
    // The authored pressure only arrives if no call has been made. An example
    // that calls promptly never meets it, which is the lesson rather than luck.
    expect(patient.pressureApplied).toBe(false);
    expect(patient.calledAtTick).not.toBeNull();
    expect(narrations[beats.indexOf('call')]).toContain('stops the reasons against it accumulating');
  });

  it('records the obstacles without agreeing with them', () => {
    const obstacles = narrations[beats.indexOf('obstacles')]!;
    expect(obstacles).toContain('they are real');
    expect(obstacles).toContain('not agreeing with them');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.permissionSought).toBe(false);
    expect(patient.doctorFirstAttempted).toBe(false);
    expect(patient.roundWaitAttempted).toBe(false);
    expect(patient.documentedOnlyAttempted).toBe(false);
  });

  it('does not let an outcome justify the call', () => {
    expect(narrations[beats.indexOf('reassess')]).toContain('Nothing about her has changed');
    expect(narration).toContain('Nothing here was vindicated by an outcome');
  });
});

describe('Requirement: The Tutor Argues With The Obstacle, Not The Nurse', () => {
  it('opens on writing down which criteria are met', () => {
    const engine = create(); engine.step();
    const prompt = afferentLimbInlinePrompt('guided', { scenarioVersion: '0.1.0', afferentLimb: snapshot(engine) })!;
    expect(prompt.id).toBe('afferent-limb-criteria');
    expect(prompt.because).toContain('judgement you are making alone');
  });

  it('never suggests permission, the doctor first, or waiting for the round', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = afferentLimbInlinePrompt('guided', { scenarioVersion: '0.1.0', afferentLimb: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['ask whether', 'call the doctor first', 'wait for the round', 'once you have permission']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('refuses closer observation as a substitute for the call', () => {
    const engine = create();
    for (const action of ['record-the-met-criteria', 'record-the-obstacles', 'call-the-response-team',
      'state-the-concern-explicitly', 'review-boundaries'] as const) {
      advance(engine, 0, action);
    }
    const prompt = afferentLimbInlinePrompt('guided', { scenarioVersion: '0.1.0', afferentLimb: snapshot(engine) })!;
    expect(prompt.id).toBe('afferent-limb-monitor');
    expect(prompt.because).toContain('not an alternative to the call');
  });

  it('withholds the waiting beat when coached', () => {
    const engine = create();
    for (const action of ['record-the-met-criteria', 'record-the-obstacles', 'call-the-response-team',
      'state-the-concern-explicitly', 'review-boundaries', 'monitor'] as const) {
      advance(engine, 0, action);
    }
    const patient = snapshot(engine);
    expect(afferentLimbInlinePrompt('guided', { scenarioVersion: '0.1.0', afferentLimb: patient })!.id)
      .toBe('afferent-limb-await');
    expect(afferentLimbInlinePrompt('coached', { scenarioVersion: '0.1.0', afferentLimb: patient })).toBeNull();
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(afferentLimbInlinePrompt('unassisted', { scenarioVersion: '0.1.0', afferentLimb: patient })).toBeNull();
    expect(afferentLimbInlinePrompt('guided', { scenarioVersion: '0.1.1', afferentLimb: patient })).toBeNull();
  });
});
