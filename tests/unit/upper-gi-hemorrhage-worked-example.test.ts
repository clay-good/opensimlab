/**
 * The worked example and observed-state tutor for a number that arrives last.
 *
 * The haemoglobin is what everyone reaches for in a bleed and the slowest thing
 * in the room, and a better pressure at the end is a bridge rather than an
 * answer.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { UPPER_GI_HEMORRHAGE as SCENARIO } from '../../src/modules/critical-care/scenarios/upper-gi-hemorrhage';
import { UPPER_GI_HEMORRHAGE_FIXTURES as FIXTURES } from '../../src/modules/critical-care/upper-gi-hemorrhage-fixtures';
import {
  UPPER_GI_HEMORRHAGE_DEMONSTRATION_VERSION, upperGiHemorrhageDemonstrationStep,
  supportsUpperGiHemorrhageDemonstration,
} from '../../src/modules/critical-care/demo/upper-gi-hemorrhage-demonstration';
import { upperGiHemorrhageInlinePrompt } from '../../src/modules/critical-care/tutor/upper-gi-hemorrhage-guidance';
import type { UpperGiHemorrhageAction } from '../../src/modules/critical-care/upper-gi-hemorrhage';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.upperGiHemorrhageAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: UpperGiHemorrhageAction) => {
  engine.apply({ tick, type: 'upper-gi-hemorrhage-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = upperGiHemorrhageDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'upper-gi-hemorrhage-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Wait For The Haemoglobin', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(UPPER_GI_HEMORRHAGE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsUpperGiHemorrhageDemonstration(SCENARIO)).toBe(true);
    expect(supportsUpperGiHemorrhageDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsUpperGiHemorrhageDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'upper-gi-hemorrhage-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['recognize', 'pattern', 'resuscitate', 'hemostasis', 'reassess']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.patternAtTick!);
    expect(patient.patternAtTick).toBeLessThan(patient.resuscitationAtTick!);
    expect(patient.resuscitationAtTick).toBeLessThan(patient.hemostasisAtTick!);
    expect(patient.hemostasisAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('reads the presenting list in order of who spoke first', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('the last to arrive and the easiest to argue with');
    expect(recognize).toContain('the treated lesion has failed');
  });

  it('says why absent varices matter and keeps the airway open', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('a variceal bleed is a different pathway entirely');
    expect(pattern).toContain('a number in a tube');
  });

  it('makes the transfusion threshold a default rather than a rule', () => {
    const resuscitate = narrations[beats.indexOf('resuscitate')]!;
    expect(resuscitate).toContain('comes from trials of stable patients');
    expect(resuscitate).toContain('a default to reason from, not a rule to hide behind');
  });

  it('runs the endoscopy alongside and names the doors past it', () => {
    const hemostasis = narrations[beats.indexOf('hemostasis')]!;
    expect(hemostasis).toContain('the bleeding is why she is unstable');
    expect(hemostasis).toContain('is how a delay happens');
  });

  it('separates a bridge signal from hemostasis at the end', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('will look exactly like this until it does not');
    expect(narration).toContain('Two numbers ran this example and neither was the haemoglobin');
  });

  it('never orders units, scopes, embolizes, or claims the bleeding stopped', () => {
    // Guard the instruction voice, not the nouns: the closing beat exists to say
    // hemostasis is NOT proven, so a bare noun match would fail on its own point.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['transfuse two units now', 'transfuse to a haemoglobin of 7',
      'scope her yourself', 'embolize the gastroduodenal', 'the bleeding has stopped',
      'hemostasis is achieved']) {
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
      const prompt = upperGiHemorrhageInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['ugi-recognize', 'ugi-pattern', 'ugi-resuscitate', 'ugi-hemostasis', 'ugi-reassess']);
  });

  it('stays on the pattern review when the resuscitation is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-recurrent-upper-gi-hemorrhage');
    advance(engine, 1, 'record-upper-gi-hemorrhage-resuscitation');
    expect(snapshot(engine)!.resuscitationAtTick).toBeNull();
    const prompt = upperGiHemorrhageInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ugi-pattern');
    expect(prompt.suggestion).toContain('what else could be');
  });

  it('stays on the resuscitation when the endoscopy pathway is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-recurrent-upper-gi-hemorrhage');
    advance(engine, 1, 'review-upper-gi-hemorrhage-pattern');
    advance(engine, 2, 'activate-repeat-endoscopy-pathway');
    expect(snapshot(engine)!.hemostasisAtTick).toBeNull();
    expect(upperGiHemorrhageInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ugi-resuscitate');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-upper-gi-hemorrhage-pattern');
    expect(snapshot(engine)!.patternAtTick).toBeNull();
    expect(upperGiHemorrhageInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ugi-recognize');
  });

  it('never orders units or performs a procedure anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = upperGiHemorrhageInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['transfuse two units now', 'scope her yourself', 'embolize the gastroduodenal']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(upperGiHemorrhageInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(upperGiHemorrhageInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(upperGiHemorrhageInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(upperGiHemorrhageInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(upperGiHemorrhageInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
