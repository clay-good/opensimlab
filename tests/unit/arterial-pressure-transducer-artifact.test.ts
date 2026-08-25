import { describe, expect, it } from 'vitest';
import {
  AnesthesiaEngine, ARTERIAL_HYDROSTATIC_MMHG_PER_CM, ARTERIAL_MISLEVELING_CM,
  NIBP_CYCLE_SECONDS,
} from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT as SCENARIO } from '@anesthesia/scenarios/arterial-pressure-transducer-artifact';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent } from '@platform/kernel/protocol';

const ONSET = 600;
const makeEngine = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: 2026, practiceRegion: 'US' });

function advanceTo(sim: AnesthesiaEngine, tick: number) {
  let result = sim.step();
  while (sim.tick <= tick) result = sim.step();
  return result;
}

describe('Requirement: invasive pressure display remains separate from patient state', () => {
  it('validates, registers, maps every objective, and declares both sensor faults', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(29);
    expect(SCENARIO.timeline.filter((event) => event.atTick === ONSET && event.type === 'artifact')
      .map((event) => event.target)).toEqual([
        'arterial-transducer-misleveled', 'arterial-damping',
      ]);
    const mapped = new Set(SCENARIO_MAPPINGS
      .filter((entry) => entry.scenarioId === SCENARIO.metadata.id)
      .flatMap((entry) => entry.objectiveIds));
    for (const objective of SCENARIO.metadata.objectives) expect(mapped).toContain(objective.id);
  });

  it('applies the hydrostatic offset to display only and exposes over-damped morphology', () => {
    const sim = makeEngine();
    const before = advanceTo(sim, ONSET - 1);
    const affected = sim.step();
    const line = affected.equipment.arterialLine!;
    expect(affected.state.meanArterialMmHg).toBeCloseTo(before.state.meanArterialMmHg, 0);
    expect(line.displayedMeanArterialMmHg).toBeCloseTo(
      affected.state.meanArterialMmHg
        - ARTERIAL_MISLEVELING_CM * ARTERIAL_HYDROSTATIC_MMHG_PER_CM, 6,
    );
    expect(line).toMatchObject({ mislevelingCm: 20, dynamicResponse: 'overdamped' });
    expect(affected.equipment.artifactParameters).toContain('meanArterialMmHg');
    expect(affected.equipment.waveformArtifacts).not.toContain('arterial');
    expect(affected.waveforms.arterial.samples.some((value) => value > 0)).toBe(true);
  });

  it('does not invent an invasive-pressure display in scenarios without an arterial line', () => {
    const result = new AnesthesiaEngine({
      scenario: ROUTINE_INDUCTION, seed: 2, practiceRegion: 'US',
    }).step();
    expect(result.equipment.arterialLine?.displayedMeanArterialMmHg).toBeNull();
  });

  it('keeps corrections independent and returns a delayed canonical cuff sample', () => {
    const sim = makeEngine();
    advanceTo(sim, ONSET);
    sim.apply({ tick: sim.tick, type: 'arterial-line', payload: { action: 'cycle-cuff' } });
    let result = sim.step();
    expect(result.equipment.arterialLine?.cuff.status).toBe('cycling');
    sim.apply({ tick: sim.tick, type: 'arterial-line', payload: { action: 'level-zero' } });
    result = sim.step();
    expect(result.equipment.arterialLine).toMatchObject({ mislevelingCm: 0, dynamicResponse: 'overdamped' });
    sim.apply({ tick: sim.tick, type: 'arterial-line', payload: { action: 'assess-waveform' } });
    sim.step();
    sim.apply({ tick: sim.tick, type: 'arterial-line', payload: { action: 'restore-dynamic-response' } });
    result = sim.step();
    expect(result.equipment.arterialLine).toMatchObject({ dynamicResponse: 'normal', waveformAssessed: true });
    for (let index = 0; index < NIBP_CYCLE_SECONDS * 10; index += 1) result = sim.step();
    expect(result.equipment.arterialLine?.cuff).toMatchObject({ status: 'complete' });
    expect(result.equipment.arterialLine?.cuff.meanArterialMmHg)
      .toBeCloseTo(result.state.meanArterialMmHg, 0);
  });

  it('refuses dynamic-response correction before waveform assessment', () => {
    const sim = makeEngine();
    advanceTo(sim, ONSET);
    sim.apply({ tick: sim.tick, type: 'arterial-line', payload: { action: 'restore-dynamic-response' } });
    const result = sim.step();
    expect(result.equipment.arterialLine?.dynamicResponse).toBe('overdamped');
    expect(result.events.some((event) => event.eventId.startsWith('arterial-response-restoration-refused-')))
      .toBe(true);
  });
});

describe('Requirement: debrief scores only accepted arterial-system evidence', () => {
  const history = [{ tick: 1200, state: { meanArterialMmHg: 78 }, concentrations: [], attribution: [], alarms: [] }] as never;
  const event = (tick: number, eventId: string, data?: EngineEvent['data']): EngineEvent => ({
    tick, eventId, data, severity: 'info', category: 'equipment', message: eventId,
  });

  it('credits the complete ordered verification sequence', () => {
    const findings = objectiveFindings(SCENARIO, history, 0, 0, [], [
      event(650, 'arterial-waveform-assessed-650'),
      event(660, 'arterial-level-zero-660'),
      event(800, 'nibp-result-800', { meanArterialMmHg: 78 }),
      event(810, 'arterial-response-restored-810'),
    ]);
    expect(findings.map((finding) => finding.outcome)).toEqual(['met', 'met', 'met']);
  });

  it('does not infer verification from correction buttons or requested actions', () => {
    const findings = objectiveFindings(SCENARIO, history, 0, 0, [{
      tick: 610, type: 'arterial-line', payload: { action: 'cycle-cuff' },
    }], [event(620, 'arterial-level-zero-620')]);
    expect(findings.map((finding) => finding.outcome)).toEqual(['not-met', 'met', 'not-met']);
  });
});
