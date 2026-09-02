/**
 * The worked example and observed-state tutor for a child whose respiratory
 * rate is about to fall for the wrong reason.
 *
 * This is the first pediatrics lesson to get either, and it refuses at three
 * separate moments. The tutor answers all four refusals by name.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEDIATRIC_RESPIRATORY_DISTRESS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-respiratory-distress';
import { PEDIATRIC_RESPIRATORY_DISTRESS_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-respiratory-distress-fixtures';
import {
  PEDIATRIC_RESPIRATORY_DISTRESS_DEMONSTRATION_VERSION, pediatricRespiratoryDistressDemonstrationStep,
  supportsPediatricRespiratoryDistressDemonstration,
} from '../../src/modules/pediatrics/demo/pediatric-respiratory-distress-demonstration';
import { pediatricRespiratoryDistressInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-respiratory-distress-guidance';
import type { PediatricRespiratoryDistressAction } from '../../src/modules/pediatrics/pediatric-respiratory-distress';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pediatricRespiratoryDistressAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PediatricRespiratoryDistressAction) => {
  engine.apply({ tick, type: 'pediatric-respiratory-distress-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pediatricRespiratoryDistressDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pediatric-respiratory-distress-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Reads The Whole Child', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_RESPIRATORY_DISTRESS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricRespiratoryDistressDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricRespiratoryDistressDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPediatricRespiratoryDistressDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the enforced order', () => {
    expect(beats).toEqual(['recognition', 'support', 'early', 'later', 'rescue', 'handoff']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.supportAtTick!);
    // Three time gates: the early review, the later panel, and the handoff.
    expect(patient.supportAtTick).toBeLessThan(patient.earlyResponseAtTick!);
    expect(patient.earlyResponseAtTick).toBeLessThan(patient.laterPanelAtTick!);
    expect(patient.laterPanelAtTick).toBeLessThan(patient.rescueAtTick!);
    expect(patient.rescueAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('takes none of the four refusable readings', () => {
    expect(patient.lastUnsupportedChoice).toBeNull();
    expect(patient.experiencedSupportActivated).toBe(true);
    expect(patient.rescueReadinessActivated).toBe(true);
  });

  it('lets no single number speak for her', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('let no single number speak for her');
    expect(recognition).toContain('as much work in that picture as the 87% is');
    expect(patient.patientExaminedByLearner).toBe(false);
  });

  it('treats help and oxygenation as one step because in a child it is', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('as one step, because in a child this is one step');
    expect(support).toContain('None of the specifics are yours');
    expect(patient.oxygenSelectedByLearner).toBe(false);
    expect(patient.oxygenDeliveredByLearner).toBe(false);
  });

  it('warns in advance that a comfortable reading is coming', () => {
    const early = narrations[beats.indexOf('early')]!;
    expect(early).toContain('notice what the comfortable reading leaves out');
  });

  it('asks which direction the findings move as a group', () => {
    const later = narrations[beats.indexOf('later')]!;
    expect(later).toContain('as a group rather than one at a time');
    expect(later).toContain('running out of strength can produce some of the same numbers');
  });

  it('escalates on the pattern rather than on an arrest', () => {
    const rescue = narrations[beats.indexOf('rescue')]!;
    expect(rescue).toContain('activated on the pattern rather than on an arrest that has not happened');
    expect(rescue).toContain('Activating the pathway is not performing it');
    expect(patient.intubationPerformedByLearner).toBe(false);
  });

  it('hands off a child who is still deteriorating', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the fatigue that the falling rate actually represents');
    expect(narration).toContain('named as fatigue rather than filed as improvement');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('delivers nothing, diagnoses nothing, and predicts nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.testAcquiredByLearner).toBe(false);
    expect(patient.deviceSelectedByLearner).toBe(false);
    expect(patient.flowSelectedByLearner).toBe(false);
    expect(patient.fio2SelectedByLearner).toBe(false);
    expect(patient.ventilationDeliveredByLearner).toBe(false);
    expect(patient.airwayManeuverPerformedByLearner).toBe(false);
    expect(patient.drugDeliveredByLearner).toBe(false);
    expect(patient.fluidDeliveredByLearner).toBe(false);
    expect(patient.procedurePerformedByLearner).toBe(false);
    expect(patient.durableRecoveryProven).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she has pneumonia', 'give salbutamol', 'start high-flow at', 'intubate her', 'she is improving', 'she will be fine', 'safe to observe']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Answers All Four Readings', () => {
  const V = '0.1.0';
  const atSupport = () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    return engine;
  };
  const afterEarly = () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    return engine;
  };
  const afterLater = () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    return engine;
  };

  it('opens on the whole child', () => {
    const engine = create(); engine.step();
    const prompt = pediatricRespiratoryDistressInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('prd-recognition');
    expect(prompt.suggestion).toContain('Look at the whole child');
  });

  it('answers completing the history first without dismissing the history', () => {
    const engine = atSupport();
    advance(engine, 1, 'complete-pediatric-respiratory-distress-history-first');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('history-first');
    const prompt = pediatricRespiratoryDistressInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('prd-history-refused');
    expect(prompt.suggestion).toContain('Just not instead of this');
    expect(prompt.because).toContain('genuinely matters here');
  });

  it('answers waiting for imaging', () => {
    const engine = atSupport();
    advance(engine, 1, 'wait-for-pediatric-respiratory-distress-imaging');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('imaging-first');
    const prompt = pediatricRespiratoryDistressInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('prd-imaging-refused');
    expect(prompt.because).toContain('moving a child in distress away from the people who can help her');
  });

  it('answers an improved saturation read as an improved child', () => {
    const engine = afterEarly();
    advance(engine, 3, 'reassure-pediatric-respiratory-distress-saturation-alone');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('single-number');
    const prompt = pediatricRespiratoryDistressInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('prd-single-number-refused');
    expect(prompt.suggestion).toContain('The number moved. The child did not.');
    expect(prompt.because).toContain('how a tiring child gets left alone with it');
  });

  it('answers the falling rate with what it actually is', () => {
    const engine = afterLater();
    advance(engine, 4, 'treat-pediatric-respiratory-distress-falling-rate-as-recovery');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('falling-rate');
    const prompt = pediatricRespiratoryDistressInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('prd-falling-rate-refused');
    expect(prompt.suggestion).toContain('That is her running out');
    expect(prompt.because).toContain('the most dangerous reassuring number in pediatrics');
  });

  it('falls through to the ordinary beat when the stale choice belongs to an earlier step', () => {
    // The engine does not clear lastUnsupportedChoice when the later panel is
    // reviewed, so a 'single-number' refusal is still recorded at the rescue
    // step. Each branch matches only its own key, so the rescue prompt shows.
    const engine = afterEarly();
    advance(engine, 3, 'reassure-pediatric-respiratory-distress-saturation-alone');
    advance(engine, 4, 'review-pediatric-respiratory-distress-later-panel');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('single-number');
    expect(snapshot(engine)!.laterPanelAtTick).not.toBeNull();
    const prompt = pediatricRespiratoryDistressInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('prd-rescue');
  });

  it('never diagnoses, delivers, or declares her improving', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pediatricRespiratoryDistressInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['she has pneumonia', 'give salbutamol', 'intubate her', 'she is improving', 'safe to observe']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pediatricRespiratoryDistressInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pediatricRespiratoryDistressInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pediatricRespiratoryDistressInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pediatricRespiratoryDistressInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
