import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, type Scenario } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP as SCENARIO } from '@anesthesia/scenarios/high-spinal-after-epidural-top-up';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

const ONSET = 600;

function engine(scenario: Scenario = SCENARIO) {
  return new AnesthesiaEngine({ scenario, seed: 20260824, practiceRegion: 'US' });
}

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let tick = 1; tick < ticks; tick += 1) result = subject.step();
  return result;
}

describe('bounded high-spinal scenario', () => {
  it('validates, registers, cites OAA, and maps every objective', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIO.metadata.clinicalReview.sources.join(' ')).toContain('section 2-7');
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const mapped = new Set(mappings.flatMap((entry) => entry.objectiveIds));
    expect(mapped).toEqual(new Set(SCENARIO.metadata.objectives.map((entry) => entry.id)));
  });

  it('drives progressive cardiovascular and respiratory compromise from the authored timeline', () => {
    const controlScenario: Scenario = {
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.type !== 'high-spinal'),
    };
    const affected = advance(engine(), 1800);
    const control = advance(engine(controlScenario), 1800);
    expect(affected.equipment.resuscitation.highSpinalFraction).toBeGreaterThan(0.99);
    expect(affected.state.heartRateBpm).toBeLessThan(control.state.heartRateBpm * 0.6);
    expect(affected.state.meanArterialMmHg).toBeLessThan(control.state.meanArterialMmHg * 0.5);
    expect(affected.state.respiratoryRateBpm).toBeLessThan(control.state.respiratoryRateBpm * 0.5);
  });

  it('accepts the bounded initial-response bundle and protects oxygenation', () => {
    const subject = engine();
    advance(subject, ONSET + 1);
    const actions: LearnerAction[] = [
      { tick: subject.tick, type: 'call-for-help', payload: { context: 'high-spinal' } },
      { tick: subject.tick, type: 'ventilator', payload: {
        fio2: 1, delivering: true, tidalVolumeMl: 450, respiratoryRateBpm: 12,
      } },
      { tick: subject.tick, type: 'fluid', payload: {
        fluidId: 'balanced-crystalloid', volumeMl: 500,
      } },
      { tick: subject.tick, type: 'ephedrine', payload: { route: 'iv', doseMg: 12 } },
    ];
    for (const action of actions) subject.apply(action);
    const accepted = subject.step();
    const final = advance(subject, 900);
    expect(accepted.equipment.airway.helpRequestedAtTick).not.toBeNull();
    expect(accepted.equipment.resuscitation.ephedrineTotalMg).toBe(12);
    expect(accepted.equipment.resuscitation.crystalloidTotalMl).toBe(500);
    expect(final.state.spo2Percent).toBeGreaterThanOrEqual(92);
    expect(accepted.events.some((entry) => entry.eventId.startsWith('ephedrine-iv-'))).toBe(true);
  });

  it('rejects ephedrine before onset, unsupported doses, and totals above 30 mg', () => {
    const subject = engine();
    subject.step();
    subject.apply({ tick: subject.tick, type: 'ephedrine', payload: { route: 'iv', doseMg: 12 } });
    expect(subject.step().equipment.resuscitation.ephedrineTotalMg).toBe(0);
    advance(subject, ONSET);
    for (const doseMg of [12, 12, 6]) {
      subject.apply({ tick: subject.tick, type: 'ephedrine', payload: { route: 'iv', doseMg } });
      subject.step();
    }
    subject.apply({ tick: subject.tick, type: 'ephedrine', payload: { route: 'iv', doseMg: 6 } });
    const overCap = subject.step();
    expect(overCap.equipment.resuscitation.ephedrineTotalMg).toBe(30);
    expect(overCap.events.some((entry) => entry.eventId.startsWith('bad-ephedrine-'))).toBe(true);
    subject.apply({ tick: subject.tick, type: 'ephedrine', payload: { route: 'iv', doseMg: 8 } });
    expect(subject.step().equipment.resuscitation.ephedrineTotalMg).toBe(30);
  });

  it('replays the same high-spinal response deterministically', () => {
    const run = () => {
      const subject = engine();
      advance(subject, ONSET + 1);
      subject.apply({ tick: subject.tick, type: 'ephedrine', payload: { route: 'iv', doseMg: 12 } });
      subject.apply({ tick: subject.tick, type: 'ventilator', payload: {
        fio2: 1, delivering: true, tidalVolumeMl: 450, respiratoryRateBpm: 12,
      } });
      return advance(subject, 900).state;
    };
    expect(run()).toEqual(run());
  });
});

const history = [
  { tick: ONSET, state: { spo2Percent: 99 }, concentrations: [] },
  { tick: ONSET + 600, state: { spo2Percent: 96 }, concentrations: [] },
] as never;

function event(
  eventId: string, tick: number, category: string, data?: EngineEvent['data'],
): EngineEvent {
  return { tick, eventId, category, data, severity: 'warning', message: eventId };
}

function finding(
  objectiveId: string, actions: readonly LearnerAction[], log: readonly EngineEvent[],
) {
  return objectiveFindings(SCENARIO, history, 0, 0, actions, log)
    .find((entry) => entry.objectiveId === objectiveId)!;
}

describe('high-spinal debrief uses accepted actions and observed state', () => {
  const actions: LearnerAction[] = [
    { tick: 650, type: 'ventilator', payload: { fio2: 1 } },
    { tick: 660, type: 'ventilator', payload: {
      delivering: true, tidalVolumeMl: 450, respiratoryRateBpm: 12,
    } },
  ];
  const log: EngineEvent[] = [
    event('airway-help-requested-620', 620, 'airway', { context: 'high-spinal' }),
    event('fluid-balanced-crystalloid-630', 630, 'fluid', { volumeMl: 500 }),
    event('ephedrine-iv-640', 640, 'drug', { doseMg: 12 }),
  ];

  it('scores prompt escalation, breathing support, circulation, and oxygenation', () => {
    for (const objectiveId of SCENARIO.metadata.objectives.map((entry) => entry.id)) {
      expect(finding(objectiveId, actions, log).outcome, objectiveId).toBe('met');
    }
  });

  it('does not credit raw fluid or ephedrine requests without accepted engine events', () => {
    const hostile: LearnerAction[] = [
      { tick: 630, type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: 500 } },
      { tick: 640, type: 'ephedrine', payload: { route: 'iv', doseMg: 12 } },
    ];
    expect(finding('support-high-spinal-circulation', hostile, []).outcome).toBe('not-met');
  });
});
