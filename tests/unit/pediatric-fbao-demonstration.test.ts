/**
 * The worked example and observed-state tutor for a child going down a ladder.
 *
 * Three rungs, three different right answers, and the first one is to do
 * nothing to him. The example has to hold that restraint as deliberately as it
 * holds the escalation at the bottom.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEDIATRIC_FOREIGN_BODY_AIRWAY_OBSTRUCTION as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-foreign-body-airway-obstruction';
import { PEDIATRIC_FBAO_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-fbao-fixtures';
import {
  PEDIATRIC_FBAO_DEMONSTRATION_VERSION, pediatricFbaoDemonstrationStep,
  supportsPediatricFbaoDemonstration,
} from '../../src/modules/pediatrics/demo/pediatric-fbao-demonstration';
import { pediatricFbaoInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-fbao-guidance';
import type { PediatricFbaoAction } from '../../src/modules/pediatrics/pediatric-foreign-body-airway-obstruction';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pediatricForeignBodyAirwayObstructionAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PediatricFbaoAction) => {
  engine.apply({ tick, type: 'pediatric-foreign-body-airway-obstruction-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pediatricFbaoDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pediatric-foreign-body-airway-obstruction-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Holds Its Hands Off At The Top', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_FBAO_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricFbaoDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricFbaoDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPediatricFbaoDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('descends all three rungs of the ladder in order', () => {
    expect(beats).toEqual(['reconcile', 'effectiveCough', 'severe', 'responsive', 'unresponsive', 'handoff']);
    expect(patient.reconciledAtTick).toBeLessThan(patient.effectiveCoughAtTick!);
    expect(patient.effectiveCoughAtTick).toBeLessThan(patient.severeResponsiveAtTick!);
    expect(patient.severeResponsiveAtTick).toBeLessThan(patient.responsivePathwayAtTick!);
    expect(patient.responsivePathwayAtTick).toBeLessThan(patient.unresponsivePathwayAtTick!);
    expect(patient.unresponsivePathwayAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('makes the sound the triage', () => {
    const reconcile = narrations[beats.indexOf('reconcile')]!;
    expect(reconcile).toContain('Listen before you touch him');
    expect(reconcile).toContain('air is moving past the obstruction');
    expect(patient.witnessedAbruptChokingAuthored).toBe(true);
    expect(patient.coughAssessedByLearner).toBe(false);
  });

  it('names the restraint as the hardest instruction and forbids the sweep by name', () => {
    const cough = narrations[beats.indexOf('effectiveCough')]!;
    expect(cough).toContain('the hardest instruction in the lesson');
    expect(cough).toContain('convert a partial obstruction into a complete one');
    expect(cough).toContain('no blind finger sweep');
    expect(patient.continuousSurveillanceAuthored).toBe(true);
    expect(patient.backBlowsPerformedByLearner).toBe(false);
    expect(patient.blindFingerSweepPerformedByLearner).toBe(false);
  });

  it('reads silence as loss rather than as improvement', () => {
    const severe = narrations[beats.indexOf('severe')]!;
    expect(severe).toContain('Silence in a choking child is not improvement');
    expect(severe).toContain('changes the answer from restraint to intervention');
    expect(patient.severeResponsiveTransitionAuthored).toBe(true);
    expect(patient.severeResponsivePulsePresent).toBe(true);
  });

  it('hands every maneuver to the qualified team', () => {
    const responsive = narrations[beats.indexOf('responsive')]!;
    expect(responsive).toContain('the hands are not yours');
    expect(patient.qualifiedResponsivePathwayActive).toBe(true);
    expect(patient.abdominalThrustsPerformedByLearner).toBe(false);
    expect(patient.laryngoscopyPerformedByLearner).toBe(false);
  });

  it('refuses to read an ECG trace as a pulse or an arrest', () => {
    const unresponsive = narrations[beats.indexOf('unresponsive')]!;
    expect(unresponsive).toContain('That trace is not a pulse');
    expect(unresponsive).toContain('does not make this a declared cardiac arrest');
    expect(unresponsive).toContain('still no blind sweep from anyone');
    expect(patient.unresponsivePulseStatusUnavailable).toBe(true);
    expect(patient.cardiacArrestDeclared).toBe(false);
    expect(patient.pulseLossProven).toBe(false);
  });

  it('ends with the object never seen and nothing declared', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('none was visible at any point');
    expect(narration).toContain('the grape is still somewhere nobody can see');
    expect(narration).toContain('This ends the example, not the evaluation.');
    expect(patient.objectClearanceReported).toBe(false);
    expect(patient.aspirationExcluded).toBe(false);
  });

  it('performs nothing, removes nothing, and reports no outcome', () => {
    expect(patient.objectRemovedByLearner).toBe(false);
    expect(patient.suctionPerformedByLearner).toBe(false);
    expect(patient.forcepsUsedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give five back blows', 'do abdominal thrusts', 'sweep his mouth', 'he is in cardiac arrest', 'the grape came out', 'he has rosc']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds Each Rung Until Its Gate Opens', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = pediatricFbaoInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['pfb-reconcile', 'pfb-effective-cough', 'pfb-severe', 'pfb-responsive', 'pfb-unresponsive', 'pfb-handoff']);
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance');
    expect(snapshot(engine)!.reconciledAtTick).toBeNull();
    expect(snapshot(engine)!.effectiveCoughAtTick).toBeNull();
    expect(pediatricFbaoInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pfb-reconcile');
  });

  it('holds the first deterioration gate', () => {
    // The gate reads the engine's clock, not the tick on the action, so the
    // refusal only happens when both are dispatched before the next step.
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    engine.apply({ tick: 1, type: 'pediatric-foreign-body-airway-obstruction-response', payload: { action: 'preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance' } });
    engine.apply({ tick: 1, type: 'pediatric-foreign-body-airway-obstruction-response', payload: { action: 'recognize-pediatric-foreign-body-airway-obstruction-severe-responsive-transition' } });
    engine.step();
    expect(snapshot(engine)!.effectiveCoughAtTick).not.toBeNull();
    expect(snapshot(engine)!.severeResponsiveAtTick).toBeNull();
    expect(pediatricFbaoInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pfb-severe');
  });

  it('holds the second deterioration gate', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    engine.apply({ tick: 3, type: 'pediatric-foreign-body-airway-obstruction-response', payload: { action: 'activate-pediatric-foreign-body-airway-obstruction-qualified-responsive-pathway' } });
    engine.apply({ tick: 3, type: 'pediatric-foreign-body-airway-obstruction-response', payload: { action: 'activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway' } });
    engine.step();
    expect(snapshot(engine)!.responsivePathwayAtTick).not.toBeNull();
    expect(snapshot(engine)!.unresponsivePathwayAtTick).toBeNull();
    expect(pediatricFbaoInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pfb-unresponsive');
  });

  it('never names a maneuver, a sweep, or an arrest', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pediatricFbaoInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['give five back blows', 'do abdominal thrusts', 'sweep his mouth', 'he is in cardiac arrest']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pediatricFbaoInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pediatricFbaoInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pediatricFbaoInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pediatricFbaoInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pediatricFbaoInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
