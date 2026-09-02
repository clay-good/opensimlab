/**
 * The worked example and observed-state tutor for a child who gets worse if
 * you upset her.
 *
 * Two refusals would distress her — a bronchodilator delivered by mask, and a
 * neck film in a cold room — and two misread what the treatment bought her.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { CROUP as SCENARIO } from '../../src/modules/pediatrics/scenarios/croup';
import { CROUP_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/croup-fixtures';
import {
  CROUP_DEMONSTRATION_VERSION, croupDemonstrationStep, supportsCroupDemonstration,
} from '../../src/modules/pediatrics/demo/croup-demonstration';
import { croupInlinePrompt } from '../../src/modules/pediatrics/tutor/croup-guidance';
import type { CroupAction } from '../../src/modules/pediatrics/croup';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.croupAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: CroupAction) => {
  engine.apply({ tick, type: 'croup-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = croupDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'croup-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Never Moves Her', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(CROUP_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCroupDemonstration(SCENARIO)).toBe(true);
    expect(supportsCroupDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCroupDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the enforced order', () => {
    expect(beats).toEqual(['pattern', 'severity', 'treatment', 'early', 'recurrence', 'handoff']);
    expect(patient.patternAtTick).toBeLessThan(patient.severityAtTick!);
    expect(patient.severityAtTick).toBeLessThan(patient.treatmentIntentAtTick!);
    // Three time gates: the early response, the recurrence review, and the handoff.
    expect(patient.treatmentIntentAtTick).toBeLessThan(patient.earlyResponseAtTick!);
    expect(patient.earlyResponseAtTick).toBeLessThan(patient.recurrenceAtTick!);
    expect(patient.recurrenceAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('takes none of the four refusable choices', () => {
    expect(patient.lastUnsupportedChoice).toBeNull();
    expect(patient.experiencedTreatmentAuthored).toBe(true);
  });

  it('names the caregiver’s arms as treatment', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('that position is treatment, not sentiment');
    expect(pattern).toContain('would cost more than it could possibly tell you');
    expect(patient.stridorAtRestAuthored).toBe(true);
  });

  it('grades her without touching her, and keeps alternatives open', () => {
    const severity = narrations[beats.indexOf('severity')]!;
    expect(severity).toContain('all of it observable from across the room');
    expect(severity).toContain('do not permanently exclude foreign body, anaphylaxis, epiglottitis');
    expect(patient.patientExaminedByLearner).toBe(false);
  });

  it('records treatment as intent and chooses none of it', () => {
    const treatment = narrations[beats.indexOf('treatment')]!;
    expect(treatment).toContain('none of them are yours');
    expect(treatment).toContain('nobody is going to upset her to look busy');
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.nebulizerOperatedByLearner).toBe(false);
  });

  it('reads the early response as a direction rather than a verdict', () => {
    const early = narrations[beats.indexOf('early')]!;
    expect(early).toContain('a direction, not a verdict');
  });

  it('keeps the readiness outlasting the improvement', () => {
    const recurrence = narrations[beats.indexOf('recurrence')]!;
    expect(recurrence).toContain('the readiness has to outlast the improvement');
  });

  it('ends on an airway that is better for now', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('that she was kept calm and why');
    expect(narration).toContain('never left her caregiver’s arms');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('examines nothing, treats nothing, and discharges nobody', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.testAcquiredByLearner).toBe(false);
    expect(patient.imagingAcquiredByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    expect(patient.airwayManeuverPerformedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['look in her throat', 'give dexamethasone', 'nebulize adrenaline', 'she can go home', 'she is fine now']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Protects Her Calm', () => {
  const V = '0.1.0';
  const atSeverity = () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    return engine;
  };
  const atRecurrence = () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    return engine;
  };

  it('opens by leaving her where she is', () => {
    const engine = create(); engine.step();
    const prompt = croupInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('croup-pattern');
    expect(prompt.suggestion).toContain('Leave her where she is');
  });

  it('answers the bronchodilator by locating the noise', () => {
    const engine = atSeverity();
    advance(engine, 1, 'select-croup-albuterol-for-stridor');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('albuterol');
    const prompt = croupInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('croup-albuterol-refused');
    expect(prompt.suggestion).toContain('above the vocal cords');
    expect(prompt.because).toContain('tightens the airway you are trying to open');
  });

  it('answers the neck film with what getting it would cost', () => {
    const engine = atSeverity();
    advance(engine, 1, 'wait-for-croup-neck-radiograph');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('radiograph');
    const prompt = croupInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('croup-radiograph-refused');
    expect(prompt.suggestion).toContain('a child who will scream');
    expect(prompt.because).toContain('narrows further every time she cries');
  });

  it('answers discharging on the early effect', () => {
    const engine = atRecurrence();
    advance(engine, 4, 'discharge-croup-after-early-response');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('discharge-early');
    const prompt = croupInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('croup-discharge-refused');
    expect(prompt.because).toContain('back at three in the morning');
  });

  it('answers the normal saturation with when hypoxemia arrives', () => {
    const engine = atRecurrence();
    advance(engine, 4, 'treat-croup-normal-saturation-as-low-risk');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('normal-saturation');
    const prompt = croupInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('croup-saturation-refused');
    expect(prompt.suggestion).toContain('the saturation falls last');
    expect(prompt.because).toContain('how much airway she has left');
  });

  it('returns to the ordinary beat once the engine clears the wrong turn', () => {
    const engine = atSeverity();
    advance(engine, 1, 'select-croup-albuterol-for-stridor');
    advance(engine, 2, 'review-croup-severity-and-alternative-red-flags');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBeNull();
    expect(croupInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('croup-treatment-intent');
  });

  it('never examines, treats, or sends her home', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = croupInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['look in her throat', 'give dexamethasone', 'she can go home', 'she is fine now']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(croupInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(croupInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(croupInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(croupInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
