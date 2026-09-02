/**
 * The worked example and observed-state tutor for a patient who is comfortable
 * right now.
 *
 * The lesson is about inheritance: "pain-free" is a fact with a timestamp on
 * it, and the re-screen is the only thing that catches a change.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { NSTEMI_RISK_REASSESSMENT as SCENARIO } from '../../src/modules/cardiology/scenarios/nstemi-risk-reassessment';
import { NSTEMI_RISK_FIXTURES as FIXTURES } from '../../src/modules/cardiology/nstemi-risk-fixtures';
import {
  NSTEMI_RISK_DEMONSTRATION_VERSION, nstemiRiskDemonstrationStep,
  supportsNstemiRiskDemonstration,
} from '../../src/modules/cardiology/demo/nstemi-risk-demonstration';
import { nstemiRiskInlinePrompt } from '../../src/modules/cardiology/tutor/nstemi-risk-guidance';
import { supportsNstemiRisk, type NstemiRiskAction } from '../../src/modules/cardiology/nstemi-risk';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.nstemiRiskAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: NstemiRiskAction) => {
  engine.apply({ tick, type: 'nstemi-risk-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = nstemiRiskDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'nstemi-risk-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Never Inherits Stability', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(NSTEMI_RISK_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsNstemiRiskDemonstration(SCENARIO)).toBe(true);
    expect(supportsNstemiRiskDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsNstemiRiskDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('guards on the objective ids rather than the action ids, which differ here', () => {
    expect(supportsNstemiRisk(SCENARIO)).toBe(true);
    const renamed = {
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: SCENARIO.metadata.objectives.map((objective) => objective.id === 'classify-nstemi-invasive-strategy'
          ? { ...objective, id: 'record-nstemi-invasive-strategy' } : objective),
      },
    };
    expect(supportsNstemiRisk(renamed)).toBe(false);
  });

  it('reaches the handoff through all five recorded steps in order', () => {
    expect(beats).toEqual(['trajectory', 'verification', 'veryHighRisk', 'strategy', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.verificationAtTick!);
    expect(patient.verificationAtTick).toBeLessThan(patient.veryHighRiskAtTick!);
    expect(patient.veryHighRiskAtTick).toBeLessThan(patient.strategyAtTick!);
    expect(patient.strategyAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('reads the three findings together and dates her stability', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('No single one of those is the finding');
    expect(trajectory).toContain('a number without its assay means nothing');
    expect(trajectory).toContain('where she is, not where she has been');
  });

  it('states the conclusion and keeps the alternatives in the room', () => {
    const verification = narrations[beats.indexOf('verification')]!;
    expect(verification).toContain('myocardial infarction is one cause of myocardial injury rather than the only one');
    expect(verification).toContain('neither diagnosing nor excluding any of them');
  });

  it('says why re-screening is not repetition', () => {
    const veryHighRisk = narrations[beats.indexOf('veryHighRisk')]!;
    expect(veryHighRisk).toContain('Do not inherit her stability from an earlier note');
    expect(veryHighRisk).toContain('The word carrying the weight is "now"');
    expect(veryHighRisk).toContain('the only thing that catches a change');
    expect(patient.currentVeryHighRisk).toBe(false);
  });

  it('treats bleeding risk as load-bearing and leaves timing to the pathway', () => {
    const strategy = narrations[beats.indexOf('strategy')]!;
    expect(strategy).toContain('the same catheter that treats the first raises the second');
    expect(strategy).toContain('teaches none of them as the answer');
    expect(patient.procedurePerformed).toBe(false);
    expect(patient.exactScoreCalculated).toBe(false);
  });

  it('hands over a moving picture', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('not a snapshot');
    expect(narration).toContain('the same sentence as an hour ago and not the same fact');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('never scores, names an hour, or prescribes', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['her grace score', 'within 24 hours', 'within 2 hours', 'start ticagrelor', 'give heparin', 'this is not myocarditis']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Enforces The Re-screen', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = nstemiRiskInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['nst-trajectory', 'nst-verification', 'nst-very-high-risk', 'nst-strategy', 'nst-handoff']);
  });

  it('stays on the re-screen when a strategy is attempted first', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    advance(engine, 2, 'record-nstemi-invasive-strategy');
    expect(snapshot(engine)!.strategyAtTick).toBeNull();
    expect(snapshot(engine)!.veryHighRiskAtTick).toBeNull();
    const prompt = nstemiRiskInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('nst-very-high-risk');
    expect(prompt.suggestion).toContain('Screen again now');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'verify-nstemi-and-alternatives');
    expect(snapshot(engine)!.trajectoryAtTick).toBeNull();
    expect(snapshot(engine)!.verificationAtTick).toBeNull();
    expect(nstemiRiskInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('nst-trajectory');
  });

  it('never names a score, an hour, or a drug', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = nstemiRiskInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['her grace score', 'within 24 hours', 'start ticagrelor', 'this is not myocarditis']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(nstemiRiskInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(nstemiRiskInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(nstemiRiskInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(nstemiRiskInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(nstemiRiskInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
