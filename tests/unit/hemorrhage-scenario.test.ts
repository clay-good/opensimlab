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
    return objectiveFindings(
      UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE, history, 0, 0, actions,
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
});
