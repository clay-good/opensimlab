/**
 * The worked example and observed-state tutor for nine kilograms that arrived
 * one infusion at a time.
 *
 * The step that matters most is the free one, and it comes before the argument
 * about kidney support rather than after it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ACUTE_KIDNEY_INJURY_WITH_FLUID_OVERLOAD as SCENARIO } from '../../src/modules/critical-care/scenarios/acute-kidney-injury-with-fluid-overload';
import { AKI_FLUID_OVERLOAD_FIXTURES as FIXTURES } from '../../src/modules/critical-care/aki-fluid-overload-fixtures';
import {
  AKI_FLUID_OVERLOAD_DEMONSTRATION_VERSION, akiFluidOverloadDemonstrationStep,
  supportsAkiFluidOverloadDemonstration,
} from '../../src/modules/critical-care/demo/aki-fluid-overload-demonstration';
import { akiFluidOverloadInlinePrompt } from '../../src/modules/critical-care/tutor/aki-fluid-overload-guidance';
import type { AkiFluidOverloadAction } from '../../src/modules/critical-care/aki-fluid-overload';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.akiFluidOverloadAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: AkiFluidOverloadAction) => {
  engine.apply({ tick, type: 'aki-fluid-overload-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = akiFluidOverloadDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'aki-fluid-overload-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Stops The Intake Before Arguing About Dialysis', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(AKI_FLUID_OVERLOAD_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAkiFluidOverloadDemonstration(SCENARIO)).toBe(true);
    expect(supportsAkiFluidOverloadDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsAkiFluidOverloadDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'acute-kidney-injury-with-fluid-overload-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['recognize', 'context', 'fluid', 'support', 'reassess']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.fluidPlanAtTick!);
    expect(patient.fluidPlanAtTick).toBeLessThan(patient.supportAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('calls the weight the honest number and names the direction', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('the honest number');
    expect(recognize).toContain('tomorrow is worse than today by default');
  });

  it('names the cause that makes the fluid its own reason', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('the causes people stop looking for');
    expect(context).toContain('the fluid becomes its own reason for the fluid');
  });

  it('says where the litres came from and what a 40 mL response means', () => {
    const fluid = narrations[beats.indexOf('fluid')]!;
    expect(fluid).toContain('one reasonable decision at a time');
    expect(fluid).toContain('Restriction is not the same as under-resuscitation');
    expect(fluid).toContain('the fourth larger dose given because the third did nothing');
  });

  it('keeps one thing unambiguous and calls the rest a position', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('justifies urgent initiation regardless');
    expect(support).toContain('is a position rather than a rule');
  });

  it('separates fluid coming off from a kidney working', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('not because the kidney started working');
    expect(narration).toContain('the step that mattered most was the free one');
  });

  it('never names a diuretic dose, starts a circuit, or claims recovery', () => {
    // Guard the instruction voice, not the nouns: beats exist to say the kidney is
    // NOT recovering, so a bare noun match would fail on the lesson's own point.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 160 mg of furosemide', 'start cvvh at', 'remove 200 ml an hour',
      'place a dialysis catheter now', 'the kidney is recovering', 'her creatinine will fall']) {
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
      const prompt = akiFluidOverloadInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['aki-recognize', 'aki-context', 'aki-fluid', 'aki-support', 'aki-reassess']);
  });

  it('stays on the context when kidney support is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-aki-fluid-overload');
    advance(engine, 1, 'activate-individualized-kidney-support-pathway');
    expect(snapshot(engine)!.supportAtTick).toBeNull();
    const prompt = akiFluidOverloadInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('aki-context');
    expect(prompt.suggestion).toContain('before you plan around the fact that it has');
  });

  it('stays on the fluid plan when kidney support is reached for after the context', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-aki-fluid-overload');
    advance(engine, 1, 'review-aki-fluid-overload-context');
    advance(engine, 2, 'activate-individualized-kidney-support-pathway');
    expect(snapshot(engine)!.supportAtTick).toBeNull();
    expect(akiFluidOverloadInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('aki-fluid');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-aki-fluid-overload-context');
    expect(snapshot(engine)!.contextAtTick).toBeNull();
    expect(akiFluidOverloadInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('aki-recognize');
  });

  it('never names a dose or a circuit anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = akiFluidOverloadInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['give 160 mg of furosemide', 'start cvvh at', 'remove 200 ml an hour']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(akiFluidOverloadInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(akiFluidOverloadInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(akiFluidOverloadInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(akiFluidOverloadInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(akiFluidOverloadInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
