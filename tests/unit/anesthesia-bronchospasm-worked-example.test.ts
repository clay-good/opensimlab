/**
 * The anaesthesia module's sixth observed-state worked example, driven through
 * the real engine.
 *
 * It is the first gated on a shape rather than a threshold: it triggers on the
 * engine's modelled obstruction severity rather than on end-tidal carbon
 * dioxide, because gating on the number would reproduce the delay the lesson
 * exists to argue against. Three of its beats are conditional on the state it is
 * handed, and this file drives it from two handovers to prove each of them.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { BRONCHOSPASM as SCENARIO } from '@anesthesia/scenarios/bronchospasm';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { LARYNGOSPASM_AFTER_AIRWAY_STIMULATION } from '@anesthesia/scenarios/laryngospasm-after-airway-stimulation';
import { BRONCHOSPASM_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/bronchospasm-fixtures';
import {
  BRONCHOSPASM_DEMONSTRATION_VERSION, bronchospasmDemonstrationStep,
  supportsBronchospasmDemonstration, type BronchospasmProgress,
} from '@anesthesia/demo/bronchospasm-demonstration';

/** The same assembly the cockpit does, from the same sources. */
function progress(
  engine: AnesthesiaEngine, frame: ReturnType<AnesthesiaEngine['step']>,
): BronchospasmProgress {
  const equipment = engine.equipment();
  const state = frame.state as Readonly<Record<string, number>>;
  return {
    inspiredOxygenFraction: equipment.ventilator.fio2,
    endTidalOxygenFraction: state.endTidalO2Fraction ?? 0,
    ventilatorDelivering: equipment.ventilator.delivering,
    bronchospasmSeverity: equipment.airway.bronchospasmSeverity,
    etco2MmHg: state.etco2MmHg ?? 0,
    depthIndex: state.depthIndex ?? 100,
    helpRequested: equipment.airway.helpRequestedAtTick !== null,
    salbutamolTotalMg: equipment.resuscitation.salbutamolTotalMg ?? 0,
    remifentanilPlasma: frame.concentrations.find((drug) => drug.drugId === 'remifentanil')?.plasma ?? 0,
    propofolPlasma: frame.concentrations.find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
    intubated: equipment.airway.intubated,
    airwayAttempts: equipment.airway.attempts,
    airwayAttemptInProgress: equipment.airway.attemptInProgress,
  };
}

function runExample(opening: readonly LearnerAction[] = [], limit = 14_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = bronchospasmDemonstrationStep(progress(engine, frame));
    if (step.finished) {
      return { beats, narrations, events, closing: step.narration, engine, tick };
    }
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.dispatch && !submitted.has(step.id)) {
      submitted.add(step.id);
      engine.apply({ tick, ...step.dispatch });
    }
    frame = engine.step();
    events.push(...frame.events);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Obstruction Example Reads The Shape, Not The Number', () => {
  const fresh = runExample();
  // A learner who intubated on room air with a plane that is far too light, and
  // hands the case over as the obstruction begins.
  const roomAir = runExample([
    { tick: 1400, type: 'bolus', payload: { drugId: 'remifentanil', amount: 30, unit: 'µg' } },
    { tick: 1450, type: 'bolus', payload: { drugId: 'propofol', amount: 0.6, unit: 'mg/kg' } },
    { tick: 1900, type: 'laryngoscopy', payload: { technique: 'video' } },
    { tick: 2000, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } },
  ]);

  it('binds to this exact scenario version and no other', () => {
    expect(BRONCHOSPASM_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsBronchospasmDemonstration(SCENARIO)).toBe(true);
    expect(supportsBronchospasmDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The upper-airway lesson is a different obstruction and must not run this.
    expect(supportsBronchospasmDemonstration(LARYNGOSPASM_AFTER_AIRWAY_STIMULATION)).toBe(false);
    expect(supportsBronchospasmDemonstration(ROUTINE_INDUCTION)).toBe(false);
  });

  it('advances every beat on physiology, in order, to a nebulized dose', () => {
    expect(fresh.beats).toEqual([
      'oxygen', 'filling', 'opioid', 'hypnotic', 'airway', 'attempt-1',
      'watching', 'escalate', 'nebulize',
    ]);
    expect(fresh.engine.equipment().resuscitation.salbutamolTotalMg).toBe(5);
    expect(fresh.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
    expect(fresh.events.filter((event) => event.eventId.includes('refused'))).toHaveLength(0);
  });

  it('triggers on the obstruction rather than on the end-tidal number', () => {
    // The whole premise. Had the example waited for the figure to alarm it would
    // have reproduced the delay the lesson argues against.
    expect(fresh.closing).toContain('which is inside its alarm limits');
    expect(fresh.closing).toContain('A number tells you where a value is');
  });

  it('names the induction as the half of the case decided in advance', () => {
    const hypnotic = fresh.narrations[fresh.beats.indexOf('hypnotic')]!;
    expect(hypnotic).toContain('1.5 mg/kg rather than the 2');
    expect(hypnotic).toContain('four minutes before anything goes wrong');
    expect(fresh.closing).toContain('not in the last two minutes at all');
  });

  it('escalates while the problem is still small, and says why', () => {
    expect(fresh.beats.indexOf('escalate')).toBeLessThan(fresh.beats.indexOf('nebulize'));
    const escalate = fresh.narrations[fresh.beats.indexOf('escalate')]!;
    expect(escalate).toContain('while this is still an inconvenience');
    // And it declines to claim the model does something it does not.
    expect(escalate).toContain('are not modelled here at all');
  });

  it('excludes the light plane rather than assuming it, when it is already deep', () => {
    const nebulize = fresh.narrations[fresh.beats.indexOf('nebulize')]!;
    expect(nebulize).toContain('already excluded rather than assumed');
    expect(fresh.beats.some((id) => id.startsWith('deepen-'))).toBe(false);
    // And it states the bound rather than implying a dosing claim.
    expect(nebulize).toContain('teaching decision rather than a dosing claim');
  });

  it('titrates the plane when it is handed a light one, rather than dosing once', () => {
    // A single fixed id stalls the example on exactly the patient who needs it:
    // 30 mg is not always enough to bring a light plane back into range.
    const deepening = roomAir.beats.filter((id) => id.startsWith('deepen-'));
    expect(deepening.length).toBeGreaterThan(1);
    expect(new Set(deepening).size).toBe(deepening.length);
    expect(roomAir.beats).toContain('nebulize');
  });

  it('turns the flowmeter up when it is handed a case on room air', () => {
    expect(roomAir.beats).toContain('oxygen-up');
    expect(fresh.beats).not.toContain('oxygen-up');
    expect(roomAir.narrations[roomAir.beats.indexOf('oxygen-up')]!)
      .toContain('cheap now and expensive later');
    expect(roomAir.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...roomAir.narrations].join(' ').toLowerCase();
    for (const forbidden of ['she did well', 'she recovered', 'she was fine', 'the operation went',
      'no harm came', 'she survived']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = bronchospasmDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
