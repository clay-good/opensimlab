/**
 * The worked example and observed-state tutor for the number you cannot see.
 *
 * A systolic of 202 is on the monitor and has a target; the INR of 3.2 is the
 * thing enlarging the haematoma. The engine refuses the pressure step until the
 * reversal is recorded.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { INTRACRANIAL_HEMORRHAGE_DETERIORATION as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/intracranial-hemorrhage-deterioration';
import { INTRACRANIAL_HEMORRHAGE_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/intracranial-hemorrhage-deterioration-fixtures';
import {
  INTRACRANIAL_HEMORRHAGE_DEMONSTRATION_VERSION, intracranialHemorrhageDemonstrationStep,
  supportsIntracranialHemorrhageDemonstration,
} from '../../src/modules/emergency-medicine/demo/intracranial-hemorrhage-deterioration-demonstration';
import { intracranialHemorrhageInlinePrompt } from '../../src/modules/emergency-medicine/tutor/intracranial-hemorrhage-deterioration-guidance';
import type { IntracranialHemorrhageAction } from '../../src/modules/emergency-medicine/intracranial-hemorrhage-deterioration';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.intracranialHemorrhageAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: IntracranialHemorrhageAction) => {
  engine.apply({ tick, type: 'intracranial-hemorrhage-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = intracranialHemorrhageDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'intracranial-hemorrhage-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Reverses Before It Titrates', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(INTRACRANIAL_HEMORRHAGE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsIntracranialHemorrhageDemonstration(SCENARIO)).toBe(true);
    expect(supportsIntracranialHemorrhageDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsIntracranialHemorrhageDemonstration({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'intracranial-hemorrhage-deterioration-boundary'),
    })).toBe(false);
  });

  it('takes all six recorded steps in the only order the engine accepts', () => {
    expect(beats).toEqual(['deterioration', 'pathway', 'findings', 'reversal', 'pressure', 'escalation']);
    expect(patient.deteriorationReviewedAtTick).toBeLessThan(patient.pathwayActivatedAtTick!);
    expect(patient.findingsReviewedAtTick).toBeLessThan(patient.reversalAtTick!);
    expect(patient.reversalAtTick).toBeLessThan(patient.pressureControlAtTick!);
    expect(patient.pressureControlAtTick).toBeLessThan(patient.escalatedAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('makes the change rather than the deficit the finding', () => {
    const deterioration = narrations[beats.indexOf('deterioration')]!;
    expect(deterioration).toContain('two snapshots fifteen minutes apart tell you almost everything');
    expect(deterioration).toContain('the airway is a trajectory rather than a status');
  });

  it('argues for head elevation precisely because it is trivial', () => {
    const pathway = narrations[beats.indexOf('pathway')]!;
    expect(pathway).toContain('none of them costs anything to be wrong about');
    expect(pathway).toContain('a rare combination in this disease');
  });

  it('reads the scan and the drug chart as one document', () => {
    const findings = narrations[beats.indexOf('findings')]!;
    expect(findings).toContain('the haematoma is not a finished event');
    expect(findings).toContain('a ventricle that is filling can be drained');
  });

  it('says why both reversal agents rather than one', () => {
    const reversal = narrations[beats.indexOf('reversal')]!;
    expect(reversal).toContain('the engine will not let you skip');
    expect(reversal).toContain('different halves of the same clock');
    expect(narration).toContain('the thing actually enlarging the haematoma is an INR of 3.2 that nobody can see');
  });

  it('says the manner of the lowering is itself the treatment', () => {
    const pressure = narrations[beats.indexOf('pressure')]!;
    expect(pressure).toContain('the manner of the lowering is itself the treatment');
    expect(pressure).toContain('an agent you can hold still beats a bolus');
  });

  it('names the three specific reasons for escalation', () => {
    const escalation = narrations[beats.indexOf('escalation')]!;
    expect(escalation).toContain('rather than a general sense of severity');
    expect(escalation).toContain('only a set of times answers it');
  });

  it('never names a product dose, waits for a repeat INR, or claims the bleed stopped', () => {
    // Guard the instruction voice, not the nouns: the lesson names the products
    // and the INR precisely in order to argue about them, so a bare noun match
    // would fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['give 2000 units', 'wait for the repeat inr',
      'recheck the inr first', 'drop the systolic to 120', 'the bleeding has stopped',
      'the haematoma is stable', 'he can go to the ward']) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds The Chain', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = intracranialHemorrhageInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['ich-deterioration', 'ich-pathway', 'ich-findings',
      'ich-reversal', 'ich-pressure', 'ich-escalation']);
  });

  it('stays on the reversal when the pressure strategy is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-ich-deterioration');
    advance(engine, 1, 'activate-ich-pathway');
    advance(engine, 2, 'review-ich-findings-and-coagulopathy');
    advance(engine, 3, 'record-smooth-ich-pressure-control');
    expect(snapshot(engine)!.pressureControlAtTick).toBeNull();
    const prompt = intracranialHemorrhageInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ich-reversal');
    expect(prompt.suggestion).toContain('Reverse now, and give both agents');
  });

  it('stays on the findings when the reversal is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-ich-deterioration');
    advance(engine, 1, 'activate-ich-pathway');
    advance(engine, 2, 'record-warfarin-reversal-intent');
    expect(snapshot(engine)!.reversalAtTick).toBeNull();
    expect(intracranialHemorrhageInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ich-findings');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'activate-ich-pathway');
    expect(snapshot(engine)!.pathwayActivatedAtTick).toBeNull();
    expect(intracranialHemorrhageInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ich-deterioration');
  });

  it('never names a dose or waits for a repeat INR anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = intracranialHemorrhageInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['give 2000 units', 'wait for the repeat inr', 'drop the systolic to 120']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the escalation', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(intracranialHemorrhageInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(intracranialHemorrhageInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(intracranialHemorrhageInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.escalatedAtTick).not.toBeNull();
    expect(intracranialHemorrhageInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(intracranialHemorrhageInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
