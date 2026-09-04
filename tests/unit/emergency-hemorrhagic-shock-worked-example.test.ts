/**
 * The worked example and observed-state tutor for a resuscitation that never
 * stops the bleeding.
 *
 * Two lanes open at recognition and neither is a precondition for the other, so
 * the example's claim about parallelism cannot live in a beat that only one
 * path reaches. It lives in the recognition beat and in the closing narration,
 * and the assertions here read the joined narration rather than a single beat.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { HEMORRHAGIC_SHOCK as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/hemorrhagic-shock';
import { HEMORRHAGIC_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/hemorrhagic-shock-fixtures';
import {
  HEMORRHAGIC_SHOCK_DEMONSTRATION_VERSION, hemorrhagicShockDemonstrationStep,
  supportsHemorrhagicShockDemonstration,
} from '../../src/modules/emergency-medicine/demo/hemorrhagic-shock-demonstration';
import { hemorrhagicShockInlinePrompt } from '../../src/modules/emergency-medicine/tutor/hemorrhagic-shock-guidance';
import type { HemorrhagicShockAction } from '../../src/modules/emergency-medicine/hemorrhagic-shock';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.hemorrhagicShockAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: HemorrhagicShockAction) => {
  engine.apply({ tick, type: 'hemorrhagic-shock-assessment', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create(); engine.step();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 1; tick <= limit; tick += 1) {
    const step = hemorrhagicShockDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'hemorrhagic-shock-assessment', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Runs Control And Resuscitation Alongside Each Other', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(HEMORRHAGIC_SHOCK_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsHemorrhagicShockDemonstration(SCENARIO)).toBe(true);
    expect(supportsHemorrhagicShockDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsHemorrhagicShockDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'hemorrhagic-shock'),
    })).toBe(false);
  });

  it('takes all seven recorded steps without a single refusal', () => {
    expect(beats).toEqual(['recognize', 'stabilize', 'escalate', 'activate', 'red-cells', 'monitor', 'reassess']);
    expect(patient.mechanismAndPerfusionReviewedAtTick).toBeLessThan(patient.pelvicStabilizationAtTick!);
    expect(patient.pelvicStabilizationAtTick).toBeLessThan(patient.definitiveControlEscalatedAtTick!);
    expect(patient.majorHemorrhageActivatedAtTick).toBeLessThan(patient.redCellsAtTick!);
    expect(patient.redCellsAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('puts the claim about two lanes where every path passes through it', () => {
    // The example takes the control lane first. A learner who takes the blood
    // lane first never sees the stabilize beat, so the parallelism claim is
    // asserted on recognition and on the joined narration, not on one branch.
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('two lanes that run alongside each other');
    expect(recognize).toContain('neither waits for the other');
    expect(`${narrations.join(' ')} ${narration}`)
      .toContain('neither one is a precondition for the other');
  });

  it('names the absence of visible blood as the trap', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('waiting for a sign this injury does not produce');
    expect(recognize).toContain('large enough to hide a fatal volume');
  });

  it('argues the binder before the call on practical grounds', () => {
    const stabilize = narrations[beats.indexOf('stabilize')]!;
    expect(stabilize).toContain('a thing your hands can do in the meantime');
  });

  it('says plainly that there is nothing to stabilize towards', () => {
    const escalate = narrations[beats.indexOf('escalate')]!;
    expect(escalate).toContain('no stabilization to be had while the bleeding continues');
  });

  it('separates releasing products from giving them, and says what crystalloid costs', () => {
    const activate = narrations[beats.indexOf('activate')]!;
    expect(activate).toContain('one negotiated unit at a time');
    expect(activate).toContain('dilutes the clotting factors');
  });

  it('insists the bridge cannot touch the vessel that is emptying', () => {
    const redCells = narrations[beats.indexOf('red-cells')]!;
    expect(redCells).toContain('no effect whatsoever on the vessel that is emptying');
    expect(narration).toContain('the one that changes the monitor');
  });

  it('reads a better number as replacement keeping up rather than as control', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('means nothing at all about the source');
    expect(narration).toContain('she is still bleeding');
  });

  it('never places the binder, gives crystalloid, names a ratio, or claims control', () => {
    // Guard the instruction voice, not the nouns: the lesson names crystalloid,
    // a binder and a transfusion in order to argue about them, so a bare noun
    // match would fail on the lesson's own point.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['apply the binder now', 'run a litre of', 'give crystalloid',
      'one to one to one', 'the bleeding is controlled', 'she is stable now',
      'her lactate is falling']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds Both Lanes', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = hemorrhagicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['hs-recognize', 'hs-stabilize', 'hs-escalate', 'hs-activate',
      'hs-red-cells', 'hs-monitor', 'hs-reassess']);
  });

  it('keeps naming the missing lane when the learner has only run the other one', () => {
    const engine = create(); engine.step();
    advance(engine, 1, 'review-mechanism-and-perfusion');
    advance(engine, 2, 'activate-major-hemorrhage');
    advance(engine, 3, 'give-two-red-cell-units');
    advance(engine, 4, 'review-coagulation-and-temperature');
    // Everything in the blood lane is done, and the tutor is back on the binder.
    const prompt = hemorrhagicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('hs-stabilize');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 1, 'record-pelvic-stabilization');
    expect(snapshot(engine)!.pelvicStabilizationAtTick).toBeNull();
    expect(hemorrhagicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('hs-recognize');
  });

  it('never places a device or claims control anywhere on the recovery path', () => {
    const engine = create(); engine.step(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = hemorrhagicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(7);
    for (const text of seen) {
      for (const forbidden of ['apply the binder now', 'give crystalloid', 'the bleeding is controlled']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(hemorrhagicShockInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(hemorrhagicShockInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(hemorrhagicShockInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(hemorrhagicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(hemorrhagicShockInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
