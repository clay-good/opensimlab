/**
 * The worked example and observed-state tutor for an illness that gets
 * treated too much.
 *
 * Five refusals across three moments, and every one of them is something a
 * reasonable person does: a film, a monitor, a bronchodilator, an antibiotic,
 * and a discharge decided by a number.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { BRONCHIOLITIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/bronchiolitis';
import { BRONCHIOLITIS_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/bronchiolitis-fixtures';
import {
  BRONCHIOLITIS_DEMONSTRATION_VERSION, bronchiolitisDemonstrationStep,
  supportsBronchiolitisDemonstration,
} from '../../src/modules/pediatrics/demo/bronchiolitis-demonstration';
import { bronchiolitisInlinePrompt } from '../../src/modules/pediatrics/tutor/bronchiolitis-guidance';
import type { BronchiolitisAction } from '../../src/modules/pediatrics/bronchiolitis';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.bronchiolitisAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: BronchiolitisAction) => {
  engine.apply({ tick, type: 'bronchiolitis-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = bronchiolitisDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'bronchiolitis-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Less On Purpose', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(BRONCHIOLITIS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsBronchiolitisDemonstration(SCENARIO)).toBe(true);
    expect(supportsBronchiolitisDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsBronchiolitisDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the enforced order', () => {
    expect(beats).toEqual(['recognition', 'pattern', 'support', 'feeding', 'later', 'handoff']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.patternAtTick!);
    expect(patient.patternAtTick).toBeLessThan(patient.supportAtTick!);
    // Three time gates: feeding, the later response, and the handoff.
    expect(patient.supportAtTick).toBeLessThan(patient.feedingHydrationAtTick!);
    expect(patient.feedingHydrationAtTick).toBeLessThan(patient.laterResponseAtTick!);
    expect(patient.laterResponseAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('takes none of the five refusable choices', () => {
    expect(patient.lastUnsupportedChoice).toBeNull();
    expect(patient.experiencedSupportActivated).toBe(true);
  });

  it('treats feeding as a vital sign', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('how he is feeding is a vital sign');
    expect(recognition).toContain('easy to leave out of the summary');
    expect(patient.poorIntakeAuthored).toBe(true);
  });

  it('names the illness as one that gets worse with enthusiasm', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('worse with enthusiasm');
    expect(pattern).toContain('do not permanently exclude another diagnosis or a bacterial coinfection');
    expect(patient.bronchiolitisWorkingPatternAuthored).toBe(true);
  });

  it('activates support without choosing any of it', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('none of the details are yours here');
    expect(patient.oxygenSelectedByLearner).toBe(false);
    expect(patient.suctionPerformedByLearner).toBe(false);
  });

  it('names the loop that support interrupts', () => {
    const feeding = narrations[beats.indexOf('feeding')]!;
    expect(feeding).toContain('is on a loop that support interrupts');
    expect(feeding).toContain('decides where this infant spends tonight');
    expect(patient.feedingDeliveredByLearner).toBe(false);
  });

  it('reads the later report as a whole infant again', () => {
    const later = narrations[beats.indexOf('later')]!;
    expect(later).toContain('ask which way the group is moving');
    expect(later).toContain('rather than a verdict on where he ends up');
    expect(patient.dischargeReadinessProven).toBe(false);
  });

  it('ends on an illness that has probably not peaked', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the day-four timing and what that means for the days after it');
    expect(narration).toContain('may not have peaked yet');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('delivers nothing, diagnoses nothing, and discharges nobody', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.testAcquiredByLearner).toBe(false);
    expect(patient.drugDeliveredByLearner).toBe(false);
    expect(patient.fluidDeliveredByLearner).toBe(false);
    expect(patient.ventilationDeliveredByLearner).toBe(false);
    expect(patient.procedurePerformedByLearner).toBe(false);
    expect(patient.durableRecoveryProven).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give albuterol', 'start amoxicillin', 'order a chest x-ray', 'he can go home', 'this is rsv', 'he has pneumonia']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Answers All Five', () => {
  const V = '0.1.0';
  const atPattern = () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    return engine;
  };
  const atSupport = () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    return engine;
  };
  const atLater = () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    return engine;
  };

  it('opens on the whole infant and the feeding history', () => {
    const engine = create(); engine.step();
    const prompt = bronchiolitisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('bronch-recognition');
    expect(prompt.suggestion).toContain('the feeding history with it');
  });

  it('answers the routine radiograph with what it tends to cause', () => {
    const engine = atPattern();
    advance(engine, 1, 'wait-for-bronchiolitis-routine-radiograph');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('radiograph-first');
    const prompt = bronchiolitisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('bronch-radiograph-refused');
    expect(prompt.because).toContain('atelectasis that gets read as pneumonia');
    expect(prompt.because).toContain('causing the next mistake rather than preventing one');
  });

  it('answers watching the saturation alone', () => {
    const engine = atPattern();
    advance(engine, 1, 'observe-bronchiolitis-saturation-alone');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('single-saturation');
    const prompt = bronchiolitisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('bronch-saturation-refused');
    expect(prompt.because).toContain('can stop feeding long before anything on the monitor says so');
  });

  it('answers the bronchodilator by naming what the wheeze actually is', () => {
    const engine = atSupport();
    advance(engine, 2, 'select-routine-bronchiolitis-albuterol');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('routine-albuterol');
    const prompt = bronchiolitisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('bronch-albuterol-refused');
    expect(prompt.because).toContain('small airways full of debris and edema, not bronchospasm');
    expect(prompt.because).toContain('a false sense that something has been done');
  });

  it('answers the antibiotic without claiming coinfection is excluded', () => {
    const engine = atSupport();
    advance(engine, 2, 'start-routine-bronchiolitis-antibiotic');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('routine-antibiotic');
    const prompt = bronchiolitisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('bronch-antibiotic-refused');
    expect(prompt.because).toContain('different from bacterial coinfection being excluded, which it is not');
  });

  it('answers discharge on a number with what discharge actually rests on', () => {
    const engine = atLater();
    advance(engine, 4, 'discharge-bronchiolitis-on-saturation-alone');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('discharge-on-saturation');
    const prompt = bronchiolitisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('bronch-discharge-refused');
    expect(prompt.because).toContain('whether his family can get back quickly');
    expect(prompt.because).toContain('around when this illness tends to peak');
  });

  it('never treats, diagnoses, or sends him home', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = bronchiolitisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(9);
    for (const text of seen) {
      for (const forbidden of ['give albuterol', 'start amoxicillin', 'he can go home', 'this is rsv']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(bronchiolitisInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(bronchiolitisInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(bronchiolitisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(bronchiolitisInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
