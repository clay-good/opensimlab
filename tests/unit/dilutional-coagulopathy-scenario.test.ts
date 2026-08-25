import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { DILUTIONAL_COAGULOPATHY as SCENARIO } from '@anesthesia/scenarios/dilutional-coagulopathy';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function engine() {
  return new AnesthesiaEngine({ scenario: SCENARIO, seed: 1901, practiceRegion: 'US' });
}

function advance(sim: AnesthesiaEngine, ticks: number) {
  let result = sim.step();
  for (let index = 1; index < ticks; index += 1) result = sim.step();
  return result;
}

describe('Requirement: dilutional coagulopathy is a distinct lab-guided scenario', () => {
  it('validates, registers, starts from the declared diluted state, and maps every objective', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(33);
    const initial = engine().step().state;
    expect(initial.prothrombinTimeRatio).toBeCloseTo(1 / 0.6, 2);
    expect(initial.fibrinogenGPerL).toBeCloseTo(1.8, 1);

    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    const mapped = new Set(mappings.flatMap((entry) => entry.objectiveIds));
    for (const objective of SCENARIO.metadata.objectives) expect(mapped).toContain(objective.id);
  });

  it('requires release and a panel, then improves both bounded teaching values once', () => {
    const sim = engine();
    advance(sim, 601);
    sim.apply({ tick: sim.tick, type: 'blood-bank-request', payload: {} });
    sim.step();
    sim.apply({ tick: sim.tick, type: 'coagulation-labs', payload: {} });
    const firstPanel = sim.step();
    const before = firstPanel.state;
    sim.apply({ tick: sim.tick, type: 'blood-product', payload: {
      productId: 'fresh-frozen-plasma', units: 4,
    } });
    const plasma = sim.step();
    const after = plasma.state;
    sim.apply({ tick: sim.tick, type: 'coagulation-labs', payload: {} });
    const repeated = sim.step();

    expect(firstPanel.events.find((event) => event.eventId.startsWith('coagulation-labs-'))?.data)
      .toMatchObject({ prothrombinTimeRatio: expect.any(Number), fibrinogenGPerL: expect.any(Number) });
    expect(after.prothrombinTimeRatio).toBeLessThan(before.prothrombinTimeRatio);
    expect(after.fibrinogenGPerL).toBeGreaterThan(before.fibrinogenGPerL);
    expect(plasma.equipment.resuscitation.freshFrozenPlasmaUnits).toBe(4);
    expect(repeated.events.some((event) => event.eventId.startsWith('coagulation-labs-'))).toBe(true);
    const unchanged = sim.step().state;
    expect(unchanged.prothrombinTimeRatio).toBeCloseTo(repeated.state.prothrombinTimeRatio, 6);
    expect(unchanged.fibrinogenGPerL).toBeCloseTo(repeated.state.fibrinogenGPerL, 6);
  });

  it('replays the same panel and plasma sequence exactly', () => {
    const run = () => {
      const sim = engine();
      const events: EngineEvent[] = [];
      advance(sim, 601);
      const actions: LearnerAction[] = [
        { tick: 0, type: 'blood-bank-request', payload: {} },
        { tick: 0, type: 'coagulation-labs', payload: {} },
        { tick: 0, type: 'blood-product', payload: { productId: 'fresh-frozen-plasma', units: 4 } },
        { tick: 0, type: 'coagulation-labs', payload: {} },
      ];
      for (const action of actions) {
        sim.apply({ ...action, tick: sim.tick });
        const result = sim.step();
        events.push(...result.events);
      }
      return { state: sim.step().state, events };
    };
    expect(run()).toEqual(run());
  });
});

describe('Requirement: coagulopathy objectives use accepted sequence evidence', () => {
  const history = [{
    tick: 1300,
    state: { meanArterialMmHg: 70, spo2Percent: 98 },
    concentrations: [], attribution: [], alarms: [],
  }] as never;
  const panel = (tick: number, ratio: number, fibrinogen: number): EngineEvent => ({
    tick, severity: 'info', category: 'laboratory', eventId: `coagulation-labs-${tick}`,
    message: 'Accepted panel', data: { prothrombinTimeRatio: ratio, fibrinogenGPerL: fibrinogen },
  });
  const plasma = (tick: number): EngineEvent => ({
    tick, severity: 'info', category: 'blood-product',
    eventId: `blood-product-fresh-frozen-plasma-${tick}`, message: 'Accepted plasma',
    data: {
      units: 4, prothrombinTimeRatioBefore: 1.67, prothrombinTimeRatioAfter: 1.49,
      fibrinogenBeforeGPerL: 1.8, fibrinogenAfterGPerL: 2,
    },
  });

  it('marks the complete panel, treatment, repeat-panel sequence met', () => {
    const findings = objectiveFindings(
      SCENARIO, history, 0, 0, [], [panel(650, 1.67, 1.8), plasma(700), panel(750, 1.49, 2)],
    );
    expect(findings.map((finding) => [finding.objectiveId, finding.outcome])).toEqual([
      ['identify-dilutional-coagulopathy', 'met'],
      ['give-lab-guided-plasma', 'met'],
      ['reassess-coagulation-response', 'met'],
    ]);
  });

  it('does not mistake an absent or out-of-order accepted sequence for completion', () => {
    const absent = objectiveFindings(SCENARIO, history, 0, 0, [], []);
    expect(absent.find((finding) => finding.objectiveId === 'identify-dilutional-coagulopathy')?.outcome)
      .toBe('not-met');
    const outOfOrder = objectiveFindings(
      SCENARIO, history, 0, 0, [], [plasma(620), panel(650, 1.67, 1.8)],
    );
    expect(outOfOrder.find((finding) => finding.objectiveId === 'give-lab-guided-plasma')?.outcome)
      .toBe('not-met');
    expect(outOfOrder.find((finding) => finding.objectiveId === 'reassess-coagulation-response')?.outcome)
      .toBe('not-met');
  });
});
