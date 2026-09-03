/**
 * The worked example and observed-state tutor for a mechanism question this
 * patient cannot afford.
 *
 * A regular narrow-complex tachycardia at 188 invites a mechanism question, and
 * a pressure of 76/48 with a drowsy patient makes it a luxury. There is no
 * adenosine on the screen, and the absence is the teaching.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { UNSTABLE_NARROW_COMPLEX_TACHYCARDIA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/unstable-narrow-complex-tachycardia';
import { UNSTABLE_NARROW_TACHYCARDIA_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/unstable-narrow-complex-tachycardia-fixtures';
import {
  UNSTABLE_NARROW_TACHYCARDIA_DEMONSTRATION_VERSION, unstableNarrowTachycardiaDemonstrationStep,
  supportsUnstableNarrowTachycardiaDemonstration,
} from '../../src/modules/emergency-medicine/demo/unstable-narrow-complex-tachycardia-demonstration';
import { unstableNarrowTachycardiaInlinePrompt } from '../../src/modules/emergency-medicine/tutor/unstable-narrow-complex-tachycardia-guidance';
import type { UnstableNarrowTachycardiaAction } from '../../src/modules/emergency-medicine/unstable-narrow-complex-tachycardia';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.unstableNarrowTachycardiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: UnstableNarrowTachycardiaAction) => {
  engine.apply({ tick, type: 'unstable-narrow-tachycardia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = unstableNarrowTachycardiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'unstable-narrow-tachycardia-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Skips The Mechanism Question', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(UNSTABLE_NARROW_TACHYCARDIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsUnstableNarrowTachycardiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsUnstableNarrowTachycardiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsUnstableNarrowTachycardiaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'rhythm-change'),
    })).toBe(false);
  });

  it('takes all four recorded steps in the only order the engine accepts', () => {
    expect(beats).toEqual(['review', 'prepare', 'cardiovert', 'reassess']);
    expect(patient.reviewedAtTick).toBeLessThan(patient.preparedAtTick!);
    expect(patient.preparedAtTick).toBeLessThan(patient.cardiovertedAtTick!);
    expect(patient.cardiovertedAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('frames it as two questions of which only one must be answered now', () => {
    const review = narrations[beats.indexOf('review')]!;
    expect(review).toContain('only one of them has to be answered now');
    expect(review).toContain('is not a diagnostic strip');
  });

  it('says why the preparation gate exists', () => {
    const prepare = narrations[beats.indexOf('prepare')]!;
    expect(prepare).toContain('preparation is where synchronised cardioversion actually goes wrong');
    expect(prepare).toContain('while the machine is still in its bag');
  });

  it('treats the sedation clause honestly and names the absent adenosine', () => {
    const cardiovert = narrations[beats.indexOf('cardiovert')]!;
    expect(cardiovert).toContain('a judgement about the next thirty seconds');
    expect(cardiovert).toContain('the vagal manoeuvre and the drug are the detour');
    expect(narration).toContain('which is why there is no adenosine on this screen');
  });

  it('reads perfusion before rate and names what stays open', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('the rate is the mechanism and the mentation and the skin are the result');
    expect(reassess).toContain('what the mechanism actually was');
  });

  it('never gives adenosine, tries a vagal manoeuvre, shocks early, or names a mechanism', () => {
    // Guard the instruction voice, not the nouns: the lesson names adenosine and
    // the vagal manoeuvre precisely in order to exclude them, so a bare noun
    // match would fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['give adenosine', 'try a valsalva', 'try carotid massage',
      'shock at 100 joules', 'this is avnrt', 'this is atrial flutter',
      'he can be discharged']) {
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
      const prompt = unstableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['svt-review', 'svt-prepare', 'svt-cardiovert', 'svt-reassess']);
  });

  it('stays on the preparation when the shock is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-rhythm-and-instability');
    advance(engine, 1, 'record-synchronized-cardioversion-intent');
    expect(snapshot(engine)!.cardiovertedAtTick).toBeNull();
    const prompt = unstableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('svt-prepare');
    expect(prompt.suggestion).toContain('before you decide to shock');
  });

  it('stays on the reassessment while the engine clock has not moved on', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-rhythm-and-instability');
    advance(engine, 1, 'prepare-synchronized-cardioversion');
    engine.apply({ tick: 2, type: 'unstable-narrow-tachycardia-response', payload: { action: 'record-synchronized-cardioversion-intent' } });
    engine.apply({ tick: 2, type: 'unstable-narrow-tachycardia-response', payload: { action: 'reassess-rhythm-and-perfusion' } });
    engine.step();
    expect(snapshot(engine)!.reassessedAtTick).toBeNull();
    expect(unstableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('svt-reassess');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'prepare-synchronized-cardioversion');
    expect(snapshot(engine)!.preparedAtTick).toBeNull();
    expect(unstableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('svt-review');
  });

  it('never offers adenosine or a vagal manoeuvre anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = unstableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['give adenosine', 'try a valsalva', 'shock at 100 joules']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(unstableNarrowTachycardiaInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(unstableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(unstableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(unstableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(unstableNarrowTachycardiaInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
