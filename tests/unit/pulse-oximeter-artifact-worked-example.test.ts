/**
 * The worked example and observed-state tutor for a number nobody should treat
 * and nobody should dismiss.
 *
 * Everything before the arterial panel is a persuasive case that the signal is
 * bad, and a persuasive case is what makes a real desaturation easy to explain
 * away.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PULSE_OXIMETER_MOTION_ARTIFACT as SCENARIO } from '../../src/modules/critical-care/scenarios/pulse-oximeter-motion-artifact';
import { PULSE_OXIMETER_ARTIFACT_FIXTURES as FIXTURES } from '../../src/modules/critical-care/pulse-oximeter-artifact-fixtures';
import {
  PULSE_OXIMETER_ARTIFACT_DEMONSTRATION_VERSION, pulseOximeterArtifactDemonstrationStep,
  supportsPulseOximeterArtifactDemonstration,
} from '../../src/modules/critical-care/demo/pulse-oximeter-artifact-demonstration';
import { pulseOximeterArtifactInlinePrompt } from '../../src/modules/critical-care/tutor/pulse-oximeter-artifact-guidance';
import type { PulseOximeterArtifactAction } from '../../src/modules/critical-care/pulse-oximeter-artifact';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pulseOximeterArtifactAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PulseOximeterArtifactAction) => {
  engine.apply({ tick, type: 'pulse-oximeter-artifact-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pulseOximeterArtifactDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pulse-oximeter-artifact-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Neither Treats Nor Dismisses The Number', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PULSE_OXIMETER_ARTIFACT_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPulseOximeterArtifactDemonstration(SCENARIO)).toBe(true);
    expect(supportsPulseOximeterArtifactDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPulseOximeterArtifactDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'artifact'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['discordance', 'pleth', 'probe', 'corroborate', 'reassess']);
    expect(patient.discordanceAtTick).toBeLessThan(patient.plethAtTick!);
    expect(patient.plethAtTick).toBeLessThan(patient.probePerfusionAtTick!);
    expect(patient.probePerfusionAtTick).toBeLessThan(patient.corroboratedAtTick!);
    expect(patient.corroboratedAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('makes the pulse-rate mismatch the first evidence and names the other reflex', () => {
    const discordance = narrations[beats.indexOf('discordance')]!;
    expect(discordance).toContain('is not in a position to tell you what the blood is carrying');
    expect(discordance).toContain('Recognising the discordance is not the same as deciding it is artifact');
  });

  it('sizes the pleth claim honestly', () => {
    const pleth = narrations[beats.indexOf('pleth')]!;
    expect(pleth).toContain('this lowers confidence, and it does not diagnose artifact');
    expect(pleth).toContain('also has a bad pleth');
  });

  it('supplies a mechanism and states the limit', () => {
    const probe = narrations[beats.indexOf('probe')]!;
    expect(probe).toContain('having a mechanism is what separates');
    expect(probe).toContain('has not been excluded by any of it');
  });

  it('makes the independent measurement the point of the chain', () => {
    const corroborate = narrations[beats.indexOf('corroborate')]!;
    expect(corroborate).toContain('This is the step the whole chain exists for');
    expect(corroborate).toContain('is not an oxygenation measurement');
    expect(corroborate).toContain('support and escalation do not wait');
  });

  it('is careful with the verb at the end', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('supported, which is a different word from proven');
    expect(narration).toContain('Nobody treated the 82% and nobody dismissed it either');
  });

  it('never gives oxygen, moves the probe, intubates, or declares artifact', () => {
    // Guard the instruction voice, not the nouns: the closing beat exists to say
    // artifact is supported and not proven, so a bare noun match would fail on it.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['put her on 15 litres', 'move the probe to her ear',
      'call for the airway trolley', 'this is definitely artifact', 'she is not hypoxaemic']) {
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
      const prompt = pulseOximeterArtifactInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['pox-discordance', 'pox-pleth', 'pox-probe', 'pox-corroborate', 'pox-reassess']);
  });

  it('stays on the probe path when corroboration is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-pulse-oximeter-discordance');
    advance(engine, 1, 'inspect-pleth-and-pulse-rate-coherence');
    advance(engine, 2, 'corroborate-oxygenation-independently');
    expect(snapshot(engine)!.corroboratedAtTick).toBeNull();
    const prompt = pulseOximeterArtifactInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pox-probe');
    expect(prompt.suggestion).toContain('the probe, the movement, the temperature, the finger');
  });

  it('stays on corroboration when the clean-site reading is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-pulse-oximeter-discordance');
    advance(engine, 1, 'inspect-pleth-and-pulse-rate-coherence');
    advance(engine, 2, 'review-probe-motion-and-perfusion');
    advance(engine, 3, 'reassess-pulse-oximeter-signal');
    expect(snapshot(engine)!.reassessedAtTick).toBeNull();
    expect(pulseOximeterArtifactInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pox-corroborate');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'inspect-pleth-and-pulse-rate-coherence');
    expect(snapshot(engine)!.plethAtTick).toBeNull();
    expect(pulseOximeterArtifactInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pox-discordance');
  });

  it('never gives oxygen or moves a probe anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pulseOximeterArtifactInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['put her on 15 litres', 'move the probe to her ear', 'call for the airway trolley']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pulseOximeterArtifactInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pulseOximeterArtifactInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pulseOximeterArtifactInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(pulseOximeterArtifactInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pulseOximeterArtifactInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
