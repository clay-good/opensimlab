/**
 * The worked example and observed-state tutor for anaphylaxis without a rash.
 *
 * Two things to get right: the absent skin findings are a known presentation
 * rather than an argument against, and the second dose does not wait for the
 * thinking.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEDIATRIC_ANAPHYLAXIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-anaphylaxis';
import { PEDIATRIC_ANAPHYLAXIS_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-anaphylaxis-fixtures';
import {
  PEDIATRIC_ANAPHYLAXIS_DEMONSTRATION_VERSION, pediatricAnaphylaxisDemonstrationStep,
  supportsPediatricAnaphylaxisDemonstration,
} from '../../src/modules/pediatrics/demo/pediatric-anaphylaxis-demonstration';
import { pediatricAnaphylaxisInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-anaphylaxis-guidance';
import type { PediatricAnaphylaxisAction } from '../../src/modules/pediatrics/pediatric-anaphylaxis';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pediatricAnaphylaxisAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PediatricAnaphylaxisAction) => {
  engine.apply({ tick, type: 'pediatric-anaphylaxis-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pediatricAnaphylaxisDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pediatric-anaphylaxis-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Wait For The Rash', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_ANAPHYLAXIS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricAnaphylaxisDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricAnaphylaxisDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPediatricAnaphylaxisDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the one available order', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'firstLine', 'safety', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.firstLineAtTick!);
    // The strict line: the review cannot precede the repeat dose.
    expect(patient.firstLineAtTick).toBeLessThan(patient.safetyAtTick!);
    expect(patient.safetyAtTick).toBeLessThan(patient.laterResponseAtTick!);
    expect(patient.laterResponseAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('opens on the missing hives and the deliberate positioning', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('Do not let that be the finding you weigh most');
    expect(trajectory).toContain('standing a child up in this state is its own harm');
    expect(patient.plausibleExposureAuthored).toBe(true);
    expect(patient.positioningPerformedByLearner).toBe(false);
  });

  it('names the absent skin findings as a known presentation', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('Sudden onset, more than one system, after a plausible exposure');
    expect(recognition).toContain('one of the reasons the diagnosis gets missed');
    expect(patient.multisystemCompromiseAuthored).toBe(true);
    expect(patient.classificationMadeByLearner).toBe(false);
  });

  it('says why the second dose comes before the thinking', () => {
    const firstLine = narrations[beats.indexOf('firstLine')]!;
    expect(firstLine).toContain('The second one does not wait for anything else');
    expect(firstLine).toContain('the interval is the treatment');
    expect(patient.qualifiedFirstLineOwnershipActive).toBe(true);
    expect(patient.epinephrineSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
  });

  it('names the asthma trap', () => {
    const safety = narrations[beats.indexOf('safety')]!;
    expect(safety).toContain('invites the comfortable explanation');
    expect(safety).toContain('none of them has excluded anything');
    expect(patient.qualifiedSafetyReviewActive).toBe(true);
  });

  it('treats improvement after epinephrine as the dangerous moment', () => {
    const later = narrations[beats.indexOf('later')]!;
    expect(later).toContain('where this diagnosis is most dangerous');
    expect(later).toContain('does not exclude a biphasic reaction');
    expect(later).toContain('still on oxygen and still wheezing');
    expect(patient.laterReportAuthored).toBe(true);
    expect(patient.biphasicReactionExcluded).toBe(false);
    expect(patient.shockResolved).toBe(false);
  });

  it('attributes the autoinjector conversation to a prescriber', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('belongs to a prescriber rather than to you');
    expect(narration).toContain('he never had a rash at all');
    expect(narration).toContain('This ends the example, not the evaluation.');
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
  });

  it('verifies nothing, gives nothing, and concludes nothing', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.exposureVerifiedByLearner).toBe(false);
    expect(patient.drugDeliveredByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 0.15 mg', 'give 0.3 mg', 'use the 1:1000', 'give salbutamol', 'give chlorphenamine', 'he can go home', 'the reaction has resolved']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Enforces The Order It Argues For', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = pediatricAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['pana-trajectory', 'pana-recognition', 'pana-first-line', 'pana-safety', 'pana-later', 'pana-handoff']);
  });

  it('stays on the dose when the review is attempted first', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    advance(engine, 2, 'review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary');
    expect(snapshot(engine)!.safetyAtTick).toBeNull();
    expect(snapshot(engine)!.firstLineAtTick).toBeNull();
    const prompt = pediatricAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pana-first-line');
    expect(prompt.suggestion).toContain('The second one does not wait for anything else');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-pediatric-anaphylaxis-persistent-abc-compromise');
    expect(snapshot(engine)!.trajectoryAtTick).toBeNull();
    expect(snapshot(engine)!.recognitionAtTick).toBeNull();
    expect(pediatricAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pana-trajectory');
  });

  it('does not move on when the later report is refused for time', () => {
    // The gate reads the engine's clock, not the tick on the action, so the
    // refusal only happens when both are dispatched before the next step.
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    engine.apply({ tick: 3, type: 'pediatric-anaphylaxis-response', payload: { action: 'review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary' } });
    engine.apply({ tick: 3, type: 'pediatric-anaphylaxis-response', payload: { action: 'review-pediatric-anaphylaxis-later-response' } });
    engine.step();
    expect(snapshot(engine)!.safetyAtTick).not.toBeNull();
    expect(snapshot(engine)!.laterResponseAtTick).toBeNull();
    expect(pediatricAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pana-later');
  });

  it('never names a dose, a device, or a resolution', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pediatricAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['give 0.15 mg', 'use the 1:1000', 'he can go home', 'the reaction has resolved']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pediatricAnaphylaxisInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pediatricAnaphylaxisInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pediatricAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pediatricAnaphylaxisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pediatricAnaphylaxisInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
