/**
 * The worked example and observed-state tutor for numbers that look better and
 * mean worse.
 *
 * Her respiratory rate fell from 36 to 18 because she is tiring, and her
 * saturation rose from 89% to 93% because the oxygen went up. Both moved the
 * way you want them to move, and both are the wrong reading.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ACUTE_SEVERE_ASTHMA as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/acute-severe-asthma';
import { ACUTE_SEVERE_ASTHMA_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/acute-severe-asthma-fixtures';
import {
  ACUTE_SEVERE_ASTHMA_DEMONSTRATION_VERSION, acuteSevereAsthmaDemonstrationStep,
  supportsAcuteSevereAsthmaDemonstration,
} from '../../src/modules/respiratory-medicine/demo/acute-severe-asthma-demonstration';
import { acuteSevereAsthmaInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/acute-severe-asthma-guidance';
import type { AcuteSevereAsthmaAction } from '../../src/modules/respiratory-medicine/acute-severe-asthma';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.acuteSevereAsthmaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: AcuteSevereAsthmaAction) => {
  engine.apply({ tick, type: 'acute-severe-asthma-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = acuteSevereAsthmaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'acute-severe-asthma-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Reads Fatigue Rather Than Improvement', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(ACUTE_SEVERE_ASTHMA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAcuteSevereAsthmaDemonstration(SCENARIO)).toBe(true);
    expect(supportsAcuteSevereAsthmaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsAcuteSevereAsthmaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
    // The obstruction waveform cue is part of the identity, not incidental.
    expect(supportsAcuteSevereAsthmaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'obstruction'),
    })).toBe(false);
  });

  it('reaches handoff through all five recorded steps in the enforced order', () => {
    expect(beats).toEqual(['treatment', 'failure', 'escalation', 'risks', 'handoff']);
    expect(patient.treatmentAtTick).toBeLessThan(patient.failureAtTick!);
    expect(patient.failureAtTick).toBeLessThan(patient.escalationAtTick!);
    expect(patient.escalationAtTick).toBeLessThan(patient.risksAtTick!);
    expect(patient.risksAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('separates the delivered treatment from the response to it', () => {
    const treatment = narrations[beats.indexOf('treatment')]!;
    expect(treatment).toContain('it is somebody else’s work');
    expect(treatment).toContain('a full initial treatment, correctly given');
    expect(treatment).toContain('The treatment is not the question. The response to it is.');
  });

  it('refuses both numbers that moved the right way', () => {
    const failure = narrations[beats.indexOf('failure')]!;
    expect(failure).toContain('running out of the strength to breathe');
    expect(failure).toContain('now on 35% oxygen rather than room air');
    expect(failure).toContain('below what makes a wheeze');
    expect(failure).toContain('No single one of those numbers is a threshold');
    expect(patient.respiratoryFailureAuthored).toBe(true);
  });

  it('escalates before the differential is finished', () => {
    const escalation = narrations[beats.indexOf('escalation')]!;
    expect(escalation).toContain('before the review');
    expect(escalation).toContain('treated properly and is failing anyway');
    expect(escalation).toContain('before that becomes urgent rather than summoned when it does');
    expect(beats.indexOf('escalation')).toBeLessThan(beats.indexOf('risks'));
  });

  it('narrows the alternatives without closing them, and bounds the ventilation risks', () => {
    const risks = narrations[beats.indexOf('risks')]!;
    expect(risks).toContain('without permanently excluding any of them');
    expect(risks).toContain('planning concerns rather than controls');
    expect(risks).toContain('an asthmatic chest that cannot empty stacks breaths');
  });

  it('refuses a treatment-response panel at the end', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('There is no response panel coming');
    expect(handoff).toContain('narrowed rather than closed');
    expect(narration).toContain('This ends the example, not the attack.');
  });

  it('delivers nothing, selects nothing, and predicts nothing', () => {
    expect(patient.medicationDeliveredByLearner).toBe(false);
    expect(patient.oxygenDeliveredByLearner).toBe(false);
    expect(patient.airwayProcedurePerformedByLearner).toBe(false);
    expect(patient.ventilatorSettingSelected).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she is improving', 'the treatment worked', 'she needs intubating', 'this is not anaphylaxis']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    for (const forbidden of ['give another', 'start bipap', 'intubate her now', 'set the peep']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Reads Fatigue Rather Than Improvement', () => {
  it('opens by separating the record from the response', () => {
    const engine = create(); engine.step();
    const prompt = acuteSevereAsthmaInlinePrompt('guided', { scenarioVersion: '0.1.0', acuteSevereAsthma: snapshot(engine) })!;
    expect(prompt.id).toBe('asthma-treatment');
    expect(prompt.suggestion).toContain('Separate what was already done from how she has responded');
    expect(prompt.because).toContain('The treatment is not the question. The response to it is.');
  });

  it('names the falling rate as fatigue', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = acuteSevereAsthmaInlinePrompt('guided', { scenarioVersion: '0.1.0', acuteSevereAsthma: snapshot(engine) })!;
    expect(prompt.id).toBe('asthma-failure');
    expect(prompt.suggestion).toContain('as fatigue, not as improvement');
    expect(prompt.because).toContain('running out of the strength to breathe');
    expect(prompt.because).toContain('No single one of those numbers is a threshold');
  });

  it('calls critical care before the review', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = acuteSevereAsthmaInlinePrompt('guided', { scenarioVersion: '0.1.0', acuteSevereAsthma: snapshot(engine) })!;
    expect(prompt.id).toBe('asthma-escalation');
    expect(prompt.suggestion).toContain('before the review');
    expect(prompt.because).toContain('treated properly and is failing anyway');
  });

  it('holds the ventilation hazards as planning concerns', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = acuteSevereAsthmaInlinePrompt('guided', { scenarioVersion: '0.1.0', acuteSevereAsthma: snapshot(engine) })!;
    expect(prompt.id).toBe('asthma-risks');
    expect(prompt.because).toContain('without permanently excluding any of them');
    expect(prompt.because).toContain('planning concerns rather than controls');
  });

  it('never claims improvement, a worked treatment, or a chosen device', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = acuteSevereAsthmaInlinePrompt('guided', { scenarioVersion: '0.1.0', acuteSevereAsthma: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['she is improving', 'the treatment worked', 'intubate her now', 'start bipap']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(acuteSevereAsthmaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', acuteSevereAsthma: patient })).toBeNull();
    expect(acuteSevereAsthmaInlinePrompt('guided', { scenarioVersion: '0.1.1', acuteSevereAsthma: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(acuteSevereAsthmaInlinePrompt('guided', { scenarioVersion: '0.1.0', acuteSevereAsthma: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is urgent', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(acuteSevereAsthmaInlinePrompt(level, { scenarioVersion: '0.1.0', acuteSevereAsthma: snapshot(engine) })).not.toBeNull();
    }
  });
});
