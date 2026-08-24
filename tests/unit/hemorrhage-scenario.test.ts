import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, type Scenario } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE } from '@anesthesia/scenarios/unexpected-intraoperative-hemorrhage';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { LearnerAction } from '@platform/kernel/protocol';

function engine(scenario: Scenario = ROUTINE_INDUCTION) {
  return new AnesthesiaEngine({ scenario, seed: 20260823, practiceRegion: 'US' });
}

function advance(sim: AnesthesiaEngine, ticks: number) {
  let last = sim.step();
  for (let tick = 1; tick < ticks; tick += 1) last = sim.step();
  return last;
}

describe('Requirement: Learner-delivered crystalloid changes the patient once', () => {
  it('retains one quarter intravascularly, dilutes hemoglobin, and does not repeat', () => {
    const sim = engine();
    const before = sim.step().state;
    sim.apply({
      tick: sim.tick, type: 'fluid',
      payload: { fluidId: 'balanced-crystalloid', volumeMl: 1000 },
    });
    const treated = sim.step();
    const next = sim.step();

    expect(treated.state.bloodVolumeMl - before.bloodVolumeMl).toBeCloseTo(250, 6);
    expect(treated.state.hemoglobinGPerDl).toBeLessThan(before.hemoglobinGPerDl);
    expect(next.state.bloodVolumeMl).toBeCloseTo(treated.state.bloodVolumeMl, 6);
    const event = treated.events.find((entry) => entry.category === 'fluid');
    expect(event?.message).toContain('1000 mL');
    expect(event?.data?.retainedFraction).toBe(0.25);
  });

  it.each([
    ['unknown product', { fluidId: 'unicorn-tears', volumeMl: 1000 }],
    ['negative volume', { fluidId: 'balanced-crystalloid', volumeMl: -1 }],
    ['zero volume', { fluidId: 'balanced-crystalloid', volumeMl: 0 }],
    ['infinite volume', { fluidId: 'balanced-crystalloid', volumeMl: Infinity }],
    ['excessive volume', { fluidId: 'balanced-crystalloid', volumeMl: 5001 }],
  ])('rejects %s without changing volume', (_label, payload) => {
    const sim = engine();
    const before = sim.step().state.bloodVolumeMl;
    sim.apply({ tick: sim.tick, type: 'fluid', payload });
    const result = sim.step();
    expect(result.state.bloodVolumeMl).toBeCloseTo(before, 6);
    expect(result.events.some((event) => event.eventId.startsWith('bad-fluid'))).toBe(true);
  });

  it('keeps replay deterministic with fluid actions', () => {
    const run = () => {
      const sim = engine();
      advance(sim, 20);
      sim.apply({
        tick: sim.tick, type: 'fluid',
        payload: { fluidId: 'balanced-crystalloid', volumeMl: 500 },
      });
      return advance(sim, 200).state;
    };
    expect(run()).toEqual(run());
  });
});

describe('Requirement: Packed red cells restore hemoglobin and calculated oxygen delivery', () => {
  const action = (units = 2, productId = 'packed-red-blood-cells'): LearnerAction => ({
    tick: 1, type: 'blood-product', payload: { productId, units },
  });

  it('delivers two fixed units once and records the physiological change', () => {
    const sim = engine(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE);
    const before = sim.step().state;
    sim.apply(action());
    const treated = sim.step();
    const next = sim.step();
    const event = treated.events.find((entry) => entry.category === 'blood-product');

    expect(treated.state.bloodVolumeMl - before.bloodVolumeMl).toBeCloseTo(600, 5);
    expect(treated.state.hemoglobinGPerDl).toBeGreaterThan(before.hemoglobinGPerDl);
    expect(next.state.bloodVolumeMl).toBeCloseTo(treated.state.bloodVolumeMl, 5);
    expect(treated.equipment.resuscitation.packedRedBloodCellUnits).toBe(2);
    expect(treated.equipment.resuscitation.bloodProductTotalMl).toBe(600);
    expect(event?.data?.volumeMl).toBe(600);
    expect(Number(event?.data?.hemoglobinDeltaGPerDl)).toBeGreaterThan(0);
    expect(Number(event?.data?.oxygenDeliveryAfterMlPerMin))
      .toBeGreaterThan(Number(event?.data?.oxygenDeliveryBeforeMlPerMin));
  });

  it.each([
    ['unknown product', 1, 'whole-blood'],
    ['zero units', 0, 'packed-red-blood-cells'],
    ['negative units', -1, 'packed-red-blood-cells'],
    ['fractional units', 1.5, 'packed-red-blood-cells'],
    ['infinite units', Infinity, 'packed-red-blood-cells'],
    ['too many units', 3, 'packed-red-blood-cells'],
  ])('rejects %s without mutation', (_label, units, productId) => {
    const sim = engine();
    const before = sim.step().state;
    sim.apply(action(units, productId));
    const result = sim.step();
    expect(result.state.bloodVolumeMl).toBeCloseTo(before.bloodVolumeMl, 8);
    expect(result.state.hemoglobinGPerDl).toBeCloseTo(before.hemoglobinGPerDl, 8);
    expect(result.events.some((entry) => entry.eventId.startsWith('bad-blood-product-'))).toBe(true);
  });

  it('enforces the cumulative two-unit boundary', () => {
    const sim = engine();
    sim.step();
    sim.apply(action(1));
    sim.step();
    sim.apply(action(1));
    sim.step();
    const before = sim.equipment().resuscitation;
    sim.apply(action(1));
    const refused = sim.step();
    expect(before.packedRedBloodCellUnits).toBe(2);
    expect(refused.equipment.resuscitation.packedRedBloodCellUnits).toBe(2);
    expect(refused.events.some((entry) => entry.eventId.startsWith('bad-blood-product-'))).toBe(true);
  });

  it('replays the same packed-red-cell trajectory deterministically', () => {
    const run = () => {
      const sim = engine(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE);
      advance(sim, 2400);
      sim.apply({ ...action(2), tick: sim.tick });
      return advance(sim, 800).state;
    };
    expect(run()).toEqual(run());
  });
});

describe('Requirement: Bounded plasma support follows a coagulation panel', () => {
  it('reports dilutional change and a four-unit plasma response', () => {
    const sim = engine(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE);
    advance(sim, 301);
    sim.apply({ tick: sim.tick, type: 'fluid', payload: {
      fluidId: 'balanced-crystalloid', volumeMl: 2000,
    } });
    const diluted = sim.step();
    sim.apply({ tick: sim.tick, type: 'coagulation-labs', payload: {} });
    const labs = sim.step();
    sim.apply({ tick: sim.tick, type: 'blood-product', payload: {
      productId: 'fresh-frozen-plasma', units: 4,
    } });
    const treated = sim.step();
    const event = treated.events.find((entry) => entry.eventId.includes('fresh-frozen-plasma'));

    expect(diluted.state.prothrombinTimeRatio).toBeGreaterThan(1);
    expect(labs.events.some((entry) => entry.category === 'laboratory')).toBe(true);
    expect(treated.state.prothrombinTimeRatio).toBeLessThan(diluted.state.prothrombinTimeRatio);
    expect(treated.state.fibrinogenGPerL).toBeGreaterThan(diluted.state.fibrinogenGPerL);
    expect(treated.equipment.resuscitation.freshFrozenPlasmaUnits).toBe(4);
    expect(event?.data?.volumeMl).toBe(1100);
  });

  it('rejects plasma outside a hemorrhage case and over its four-unit cap', () => {
    const routine = engine();
    routine.step();
    routine.apply({ tick: routine.tick, type: 'blood-product', payload: {
      productId: 'fresh-frozen-plasma', units: 4,
    } });
    expect(routine.step().equipment.resuscitation.freshFrozenPlasmaUnits).toBe(0);

    const bleeding = engine(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE);
    bleeding.step();
    bleeding.apply({ tick: bleeding.tick, type: 'blood-product', payload: {
      productId: 'fresh-frozen-plasma', units: 3,
    } });
    const prebleed = bleeding.step();
    expect(prebleed.equipment.resuscitation.freshFrozenPlasmaUnits).toBe(0);
    bleeding.apply({ tick: bleeding.tick, type: 'coagulation-labs', payload: {} });
    const refusedPanel = bleeding.step();
    expect(refusedPanel.events.some(
      (entry) => entry.eventId.startsWith('bad-coagulation-labs-'),
    )).toBe(true);
    expect(refusedPanel.events.some(
      (entry) => entry.eventId.startsWith('coagulation-labs-'),
    )).toBe(false);
    advance(bleeding, 300);
    bleeding.apply({ tick: bleeding.tick, type: 'blood-product', payload: {
      productId: 'fresh-frozen-plasma', units: 4,
    } });
    const refusedBeforePanel = bleeding.step();
    expect(refusedBeforePanel.equipment.resuscitation.freshFrozenPlasmaUnits).toBe(0);
    expect(refusedBeforePanel.events.some(
      (entry) => entry.message.includes('Request the bounded coagulation panel'),
    )).toBe(true);
    bleeding.apply({ tick: bleeding.tick, type: 'coagulation-labs', payload: {} });
    const panel = bleeding.step();
    expect(panel.equipment.resuscitation.coagulationPanelReported).toBe(true);
    bleeding.apply({ tick: bleeding.tick, type: 'blood-product', payload: {
      productId: 'fresh-frozen-plasma', units: 4,
    } });
    bleeding.step();
    bleeding.apply({ tick: bleeding.tick, type: 'blood-product', payload: {
      productId: 'fresh-frozen-plasma', units: 3,
    } });
    const refused = bleeding.step();
    expect(refused.equipment.resuscitation.freshFrozenPlasmaUnits).toBe(4);
    expect(refused.events.some((entry) => entry.eventId.startsWith('bad-blood-product-'))).toBe(true);
  });

  it.each([0, -1, 1, 2, 2.5, 5, Infinity])('rejects an unsupported plasma request of %s units', (units) => {
    const sim = engine(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE);
    advance(sim, 301);
    const control = engine(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE);
    advance(control, 301);
    sim.apply({ tick: sim.tick, type: 'coagulation-labs', payload: {} });
    control.apply({ tick: control.tick, type: 'coagulation-labs', payload: {} });
    sim.step();
    control.step();
    sim.apply({ tick: sim.tick, type: 'blood-product', payload: {
      productId: 'fresh-frozen-plasma', units,
    } });
    const refused = sim.step();
    expect(refused.state.bloodVolumeMl).toBeCloseTo(control.step().state.bloodVolumeMl, 8);
    expect(refused.equipment.resuscitation.freshFrozenPlasmaUnits).toBe(0);
  });

  it('replays plasma and the requested panel deterministically', () => {
    const run = () => {
      const sim = engine(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE);
      advance(sim, 1200);
      sim.apply({ tick: sim.tick, type: 'coagulation-labs', payload: {} });
      sim.step();
      sim.apply({ tick: sim.tick, type: 'blood-product', payload: {
        productId: 'fresh-frozen-plasma', units: 3,
      } });
      return advance(sim, 200);
    };
    expect(run()).toEqual(run());
  });
});

describe('Requirement: The hemorrhage scenario teaches a coherent causal picture', () => {
  it('blood loss lowers volume, cardiac output, pressure, and end-tidal carbon dioxide', () => {
    const noLoss: Scenario = {
      ...UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE,
      timeline: UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE.timeline.filter(
        (event) => event.type !== 'blood-loss',
      ),
    };
    const control = advance(engine(noLoss), 3601).state;
    const bleeding = advance(engine(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE), 3601).state;

    expect(bleeding.bloodVolumeMl).toBeLessThan(control.bloodVolumeMl - 1000);
    expect(bleeding.cardiacOutputLPerMin).toBeLessThan(control.cardiacOutputLPerMin);
    expect(bleeding.meanArterialMmHg).toBeLessThan(control.meanArterialMmHg);
    expect(bleeding.etco2MmHg).toBeLessThan(control.etco2MmHg);
    // Whole-blood loss removes cells and plasma together, so concentration is preserved.
    expect(bleeding.hemoglobinGPerDl).toBeCloseTo(control.hemoglobinGPerDl, 6);
  });

  it('timely crystalloid partially restores volume and pressure without claiming definitive rescue', () => {
    const untreated = engine(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE);
    const treated = engine(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE);
    advance(untreated, 2400);
    advance(treated, 2400);
    treated.apply({
      tick: treated.tick, type: 'fluid',
      payload: { fluidId: 'balanced-crystalloid', volumeMl: 1000 },
    });
    const withoutFluid = advance(untreated, 1201).state;
    const withFluid = advance(treated, 1201).state;

    expect(withFluid.bloodVolumeMl - withoutFluid.bloodVolumeMl).toBeCloseTo(250, 6);
    expect(withFluid.meanArterialMmHg).toBeGreaterThan(withoutFluid.meanArterialMmHg);
    expect(withFluid.hemoglobinGPerDl).toBeLessThan(withoutFluid.hemoglobinGPerDl);
    expect(withFluid.bloodVolumeMl).toBeLessThan(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE.patient.baseline.bloodVolumeMl);
  });
});

describe('Requirement: Hemorrhage objectives are evaluated from the recorded actions', () => {
  const history = [{
    tick: 4000,
    state: { meanArterialMmHg: 70, spo2Percent: 98 },
    concentrations: [], attribution: [], alarms: [],
  }] as never;

  function finding(id: string, actions: readonly LearnerAction[]) {
    const log = actions.flatMap((action) => action.type === 'fluid'
      && action.payload.fluidId === 'balanced-crystalloid'
      && Number.isFinite(Number(action.payload.volumeMl))
      && Number(action.payload.volumeMl) > 0
      && Number(action.payload.volumeMl) <= 5000
      ? [{
        tick: action.tick, severity: 'info' as const, category: 'fluid',
        eventId: `fluid-balanced-crystalloid-${action.tick}`,
        message: 'Accepted fluid', data: {
          fluidId: 'balanced-crystalloid', volumeMl: Number(action.payload.volumeMl),
        },
      }]
      : []);
    return objectiveFindings(
      UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE, history, 0, 0, actions, log,
    ).find((entry) => entry.objectiveId === id)!;
  }

  it('distinguishes prompt, delayed, and absent response', () => {
    const action = (tick: number): LearnerAction => ({
      tick, type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: 1000 },
    });
    expect(finding('recognize-hemorrhage', [action(2700)]).outcome).toBe('met');
    expect(finding('recognize-hemorrhage', [action(3301)]).outcome).toBe('partly-met');
    expect(finding('recognize-hemorrhage', []).outcome).toBe('not-met');
  });

  it('reports the crystalloid volume without mistaking it for definitive replacement', () => {
    const result = finding('temporize-volume-loss', [{
      tick: 2700, type: 'fluid',
      payload: { fluidId: 'balanced-crystalloid', volumeMl: 1000 },
    }]);
    expect(result.outcome).toBe('met');
    expect(result.finding).toContain('not definitive hemorrhage replacement');
  });

  it('does not score refused or malformed fluid requests as treatment', () => {
    const result = finding('temporize-volume-loss', [
      { tick: 2700, type: 'fluid', payload: { fluidId: 'unknown', volumeMl: 5000 } },
      { tick: 2701, type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: Infinity } },
    ]);
    expect(result.outcome).toBe('not-met');
    expect(result.finding).toContain('No crystalloid was given');
  });
});
