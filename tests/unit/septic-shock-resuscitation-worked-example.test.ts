/**
 * The worked example and observed-state tutor for a patient every instinct says
 * to give fluid to.
 *
 * The reflexes both work against are the next bolus and the MAP: a stroke
 * volume that rose two per cent, lungs that have started to fill, and a
 * pressure that went from 64 to 68 while nothing else about her moved.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SEPTIC_SHOCK_RESUSCITATION as SCENARIO } from '../../src/modules/critical-care/scenarios/septic-shock-resuscitation';
import { SEPTIC_SHOCK_RESUSCITATION_FIXTURES as FIXTURES } from '../../src/modules/critical-care/septic-shock-resuscitation-fixtures';
import {
  SEPTIC_SHOCK_RESUSCITATION_DEMONSTRATION_VERSION, septicShockResuscitationDemonstrationStep,
  supportsSepticShockResuscitationDemonstration,
} from '../../src/modules/critical-care/demo/septic-shock-resuscitation-demonstration';
import { septicShockResuscitationInlinePrompt } from '../../src/modules/critical-care/tutor/septic-shock-resuscitation-guidance';
import type { SepticShockResuscitationAction } from '../../src/modules/critical-care/septic-shock-resuscitation';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.septicShockResuscitationAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: SepticShockResuscitationAction) => {
  engine.apply({ tick, type: 'septic-shock-resuscitation-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = septicShockResuscitationDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'septic-shock-resuscitation-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Give The Fourth Bolus', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(SEPTIC_SHOCK_RESUSCITATION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsSepticShockResuscitationDemonstration(SCENARIO)).toBe(true);
    expect(supportsSepticShockResuscitationDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsSepticShockResuscitationDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'septic-shock-resuscitation-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['context', 'perfusion', 'fluid', 'plan', 'trajectory']);
    expect(patient.contextAtTick).toBeLessThan(patient.perfusionAtTick!);
    expect(patient.perfusionAtTick).toBeLessThan(patient.fluidResponseAtTick!);
    expect(patient.fluidResponseAtTick).toBeLessThan(patient.planAtTick!);
    expect(patient.planAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('separates the three claims a resuscitation record blurs', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('are three separate claims');
    expect(context).toContain('believing a patient has had treatment she has not had');
    expect(context).toContain('which of those are commands and which are findings');
  });

  it('makes the pressure one of six signals rather than the result', () => {
    const perfusion = narrations[beats.indexOf('perfusion')]!;
    expect(perfusion).toContain('a lactate going up is not a resuscitation that is nearly there');
    expect(perfusion).toContain('the sixth is the one a MAP target invites you to fix');
    expect(perfusion).toContain('a pressure taken alone will always argue for more of it');
  });

  it('pairs the dynamic finding with the lungs and refuses to make either a cutoff', () => {
    const fluid = narrations[beats.indexOf('fluid')]!;
    expect(fluid).toContain('Two per cent');
    expect(fluid).toContain('started going somewhere that does not help her');
    expect(fluid).toContain('two per cent is not a threshold');
    expect(patient.passiveLegRaiseStrokeVolumeChangePercent).toBe(2);
    expect(patient.blindRepeatFluidOffered).toBe(false);
  });

  it('says why the source control is the half that changes her outcome', () => {
    const plan = narrations[beats.indexOf('plan')]!;
    expect(plan).toContain('antimicrobials cannot reach what is not draining');
    expect(plan).toContain('a way to feel busy while the actual problem waits');
  });

  it('refuses to read the ten-minute response as a response', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('the kidney did not move at all');
    expect(trajectory).toContain('would be reading two of eight figures');
    expect(narration).toContain('her biliary tree is still obstructed');
    expect(narration).toContain('stop a fourth bolus');
  });

  it('never names a fluid volume, a pressure target, a vasopressor dose, or a procedure', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give another 500 ml', 'aim for a map of 65', 'increase the noradrenaline to',
      'take her for ercp', 'start dobutamine', 'give albumin']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds The Chain', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = septicShockResuscitationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['ssr-context', 'ssr-perfusion', 'ssr-fluid', 'ssr-plan', 'ssr-trajectory']);
  });

  it('stays on the perfusion review when the plan is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-septic-shock-resuscitation-so-far');
    advance(engine, 1, 'individualize-septic-shock-support-and-source-control');
    expect(snapshot(engine)!.planAtTick).toBeNull();
    const prompt = septicShockResuscitationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ssr-perfusion');
    expect(prompt.suggestion).toContain('one of six things, not as the result');
  });

  it('stays on the dynamic test when the plan is reached for after the perfusion', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-septic-shock-resuscitation-so-far');
    advance(engine, 1, 'reassess-septic-shock-perfusion');
    advance(engine, 2, 'individualize-septic-shock-support-and-source-control');
    expect(snapshot(engine)!.planAtTick).toBeNull();
    const prompt = septicShockResuscitationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ssr-fluid');
    expect(prompt.suggestion).toContain('Before another bolus');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reassess-septic-shock-perfusion');
    expect(snapshot(engine)!.perfusionAtTick).toBeNull();
    expect(septicShockResuscitationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ssr-context');
  });

  it('never names a fluid volume, a target, or a dose', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = septicShockResuscitationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['give another 500 ml', 'aim for a map of 65', 'increase the noradrenaline to']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(septicShockResuscitationInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(septicShockResuscitationInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(septicShockResuscitationInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(septicShockResuscitationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(septicShockResuscitationInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
