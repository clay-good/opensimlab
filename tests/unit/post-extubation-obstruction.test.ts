import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { stepUpperAirwayObstruction } from '@anesthesia/physiology';
import { POST_EXTUBATION_OBSTRUCTION as SCENARIO } from '@anesthesia/scenarios/post-extubation-obstruction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let tick = 1; tick < ticks; tick += 1) result = subject.step();
  return result;
}

function engine() {
  return new AnesthesiaEngine({ scenario: SCENARIO, seed: 37, practiceRegion: 'US' });
}

describe('post-extubation upper-airway obstruction', () => {
  it('is a distinct facemask event with reduced patency but no bronchospasm', () => {
    const result = advance(engine(), 101);
    expect(result.equipment.airway).toMatchObject({
      device: 'facemask', intubated: false,
      postExtubationObstructionSeverity: 0.5, bronchospasmSeverity: 0,
    });
    expect(result.equipment.airway.patencyFraction).toBeCloseTo(0.5);
    expect(result.state.tidalVolumeMl).toBeGreaterThan(0);
    expect(result.state.tidalVolumeMl).toBeLessThan(300);
    expect(result.state.etco2MmHg).toBeGreaterThan(0);
  });

  it('requires the complete declared support bundle and restores modeled gas flow', () => {
    const run = (omit?: 'oxygen' | 'pressure' | 'maneuver') => {
      const subject = engine();
      advance(subject, 101);
      subject.apply({ tick: subject.tick, type: 'call-for-help', payload: { context: 'airway' } });
      subject.apply({ tick: subject.tick, type: 'ventilator', payload: {
        mode: 'manual', fio2: omit === 'oxygen' ? 0.4 : 1,
        delivering: omit !== 'pressure', tidalVolumeMl: 500, respiratoryRateBpm: 12,
      } });
      if (omit !== 'maneuver') subject.apply({
        tick: subject.tick, type: 'airway-maneuver', payload: { maneuver: 'jaw-thrust-cpap' },
      });
      return advance(subject, 300);
    };

    const recovered = run();
    expect(recovered.equipment.airway).toMatchObject({
      helpRequestedAtTick: 101, patencyFraction: 1,
      postExtubationObstructionSeverity: 0,
    });
    expect(recovered.state.tidalVolumeMl).toBeGreaterThan(300);
    expect(recovered.state.etco2MmHg).toBeGreaterThan(0);
    for (const omitted of ['oxygen', 'pressure', 'maneuver'] as const) {
      expect(run(omitted).equipment.airway.patencyFraction, omitted).toBeCloseTo(0.5);
    }
  });

  it('keeps the teaching response deterministic, bounded, and separate from depth', () => {
    const support = { jawThrustCpap: true, positivePressure: true, fio2: 1 };
    expect(stepUpperAirwayObstruction(0.85, support, 10)).toBeCloseTo(0.45);
    expect(stepUpperAirwayObstruction(0.85, support, 30)).toBe(0);
    expect(stepUpperAirwayObstruction(0.85, { ...support, jawThrustCpap: false }, 30)).toBe(0.85);
    expect(stepUpperAirwayObstruction(Number.NaN, support, 1)).toBe(0);
  });

  it('debriefs the accepted engine trace as recognition, support, and recovery', () => {
    const subject = engine();
    const history: { tick: number; state: Readonly<Record<string, number>>;
      concentrations: never[] }[] = [];
    const events: EngineEvent[] = [];
    const actions: LearnerAction[] = [];
    const step = () => {
      const result = subject.step();
      history.push({ tick: result.tick, state: result.state, concentrations: [] });
      events.push(...result.events);
    };
    for (let tick = 0; tick < 101; tick += 1) step();
    const expertActions: LearnerAction[] = [
      { tick: subject.tick, type: 'call-for-help', payload: { context: 'airway' } },
      { tick: subject.tick, type: 'ventilator', payload: {
        mode: 'manual', fio2: 1, delivering: true, tidalVolumeMl: 500, respiratoryRateBpm: 12,
      } },
      { tick: subject.tick, type: 'airway-maneuver', payload: { maneuver: 'jaw-thrust-cpap' } },
    ];
    for (const action of expertActions) {
      actions.push(action);
      subject.apply(action);
    }
    for (let tick = 0; tick < 250; tick += 1) step();

    expect(objectiveFindings(
      SCENARIO, history, 0, 0, actions, events,
    ).map((finding) => finding.outcome)).toEqual(['met', 'met', 'met']);
  });

  it('rejects invalid severity and an event behind a tracheal tube', () => {
    for (const value of [undefined, Number.NaN, Number.POSITIVE_INFINITY, -0.1, 1.1]) {
      const hostile = {
        ...SCENARIO,
        timeline: [{ id: 'hostile', type: 'upper-airway-obstruction', atTick: 0, value }],
      };
      expect(validateScenario(hostile)).not.toEqual([]);
      const subject = new AnesthesiaEngine({ scenario: hostile as never, seed: 37, practiceRegion: 'US' });
      expect(subject.step().equipment.airway.patencyFraction).toBe(1);
    }

    const intubated = {
      ...SCENARIO,
      equipment: { ...SCENARIO.equipment, airwayDevice: 'tracheal-tube' },
      timeline: [{ id: 'behind-tube', type: 'upper-airway-obstruction', atTick: 0, value: 0.8 }],
    };
    const subject = new AnesthesiaEngine({ scenario: intubated as never, seed: 37, practiceRegion: 'US' });
    const result = subject.step();
    expect(result.equipment.airway.patencyFraction).toBe(1);
    expect(result.events.some((event) => event.eventId.startsWith('inapplicable-event-behind-tube')))
      .toBe(true);
  });
});
