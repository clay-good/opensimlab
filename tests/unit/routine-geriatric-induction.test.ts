import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { ROUTINE_GERIATRIC_INDUCTION as SCENARIO } from '@anesthesia/scenarios/routine-geriatric-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

const engine = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: 616, practiceRegion: 'US' });

function run(mode: 'expert' | 'none' | 'single-bolus') {
  const subject = engine();
  const actions: LearnerAction[] = [];
  const events: EngineEvent[] = [];
  const history: { tick: number; state: Readonly<Record<string, number>>;
    concentrations: never[]; attribution: never[]; alarms: never[] }[] = [];
  let result = subject.step();
  for (let index = 1; index < 4800; index += 1) {
    const apply = (action: LearnerAction) => { actions.push(action); subject.apply(action); };
    if (subject.tick === 1 && mode !== 'none') {
      apply({ tick: subject.tick, type: 'ventilator', payload: { fio2: 1 } });
    }
    if (mode === 'expert' && [1200, 1400, 1600, 1800, 2000].includes(subject.tick)) {
      apply({ tick: subject.tick, type: 'bolus', payload: {
        drugId: 'propofol', amount: 20, unit: 'mg',
      } });
    }
    if (mode === 'single-bolus' && subject.tick === 1200) {
      apply({ tick: subject.tick, type: 'bolus', payload: {
        drugId: 'propofol', amount: 2, unit: 'mg/kg',
      } });
    }
    if (subject.tick === 2200 && mode !== 'none') {
      apply({ tick: subject.tick, type: 'ventilator', payload: {
        delivering: true, tidalVolumeMl: 450, respiratoryRateBpm: 12,
      } });
    }
    result = subject.step();
    events.push(...result.events);
    if (subject.tick % 10 === 0) {
      history.push({
        tick: subject.tick, state: result.state,
        concentrations: [], attribution: [], alarms: [],
      });
    }
  }
  return { result, actions, events, history };
}

describe('Requirement: routine geriatric induction is incremental and bounded', () => {
  it('validates, registers, maps every objective, and starts awake on room air', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(38);
    const subject = engine();
    expect(subject.equipment()).toMatchObject({
      ventilator: { delivering: false, fio2: 0.21, sevofluranePercent: 0 },
    });
    const initial = subject.step();
    expect(initial.state.depthIndex).toBe(93);
    expect(initial.state.meanArterialMmHg).toBeCloseTo(92, 6);
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const mapped = new Set(mappings.flatMap((entry) => entry.objectiveIds));
    for (const objective of SCENARIO.metadata.objectives) expect(mapped).toContain(objective.id);
  });

  it('produces a deterministic expert trajectory within the declared boundaries', () => {
    const first = run('expert');
    const replay = run('expert');
    const postDose = first.history.filter((entry) => entry.tick >= 1200);
    expect(first.events.map((entry) => entry.eventId)).toEqual(expect.arrayContaining([
      'bolus-propofol-1200', 'bolus-propofol-2000', 'ventilator-2200',
    ]));
    expect(Math.min(...postDose.map((entry) => Number(entry.state.depthIndex)))).toBeCloseTo(49.691, 3);
    expect(Math.min(...postDose.map((entry) => Number(entry.state.meanArterialMmHg)))).toBeCloseTo(73.185, 3);
    expect(Math.min(...postDose.map((entry) => Number(entry.state.spo2Percent)))).toBeGreaterThan(99.99);
    expect(replay.result).toEqual(first.result);
    expect(replay.events).toEqual(first.events);
  });

  it('credits the expert transcript and distinguishes no action and one large dose', () => {
    const findings = (mode: 'expert' | 'none' | 'single-bolus') => {
      const session = run(mode);
      return objectiveFindings(
        SCENARIO, session.history as never, 0, 0, session.actions, session.events,
      );
    };
    expect(findings('expert').map((entry) => entry.outcome)).toEqual([
      'met', 'met', 'met', 'met',
    ]);
    expect(findings('none').map((entry) => entry.outcome)).toEqual([
      'not-met', 'not-met', 'not-met', 'not-met',
    ]);
    expect(findings('single-bolus').find((entry) => entry.objectiveId === 'titrate-geriatric-propofol')?.outcome)
      .toBe('not-met');
  });
});
