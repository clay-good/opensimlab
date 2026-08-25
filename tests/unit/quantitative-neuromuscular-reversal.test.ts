import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { QUANTITATIVE_NEUROMUSCULAR_REVERSAL as SCENARIO } from '@anesthesia/scenarios/quantitative-neuromuscular-reversal';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

const engine = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: 818, practiceRegion: 'US' });

function run(mode: 'expert' | 'none' | 'onset' | 'wrong-depth', endTick = 6000) {
  const subject = engine();
  const actions: LearnerAction[] = [];
  const events: EngineEvent[] = [];
  const history: { tick: number; state: Readonly<Record<string, number>>;
    concentrations: never[]; attribution: never[]; alarms: never[] }[] = [];
  let result = subject.step();
  for (let index = 1; index < endTick; index += 1) {
    const apply = (action: LearnerAction) => { actions.push(action); subject.apply(action); };
    if (subject.tick === 300 && mode !== 'none') {
      apply({ tick: subject.tick, type: 'bolus', payload: {
        drugId: 'rocuronium', amount: 0.6, unit: 'mg/kg',
      } });
    }
    if (subject.tick === 450 && mode === 'onset') {
      apply({ tick: subject.tick, type: 'neuromuscular-reversal', payload: {
        agent: 'sugammadex', route: 'iv', doseMgPerKg: 2,
      } });
    }
    if (subject.tick === 3300 && (mode === 'expert' || mode === 'wrong-depth')) {
      apply({ tick: subject.tick, type: 'neuromuscular-reversal', payload: {
        agent: 'sugammadex', route: 'iv', doseMgPerKg: mode === 'expert' ? 4 : 2,
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

describe('Requirement: quantitative reversal uses a measured recovery phase', () => {
  it('validates, registers, maps every objective, and starts in stable established anesthesia', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(33);
    const subject = engine();
    expect(subject.equipment()).toMatchObject({
      airway: { intubated: true, device: 'tracheal-tube' },
      ventilator: { delivering: true, sevofluranePercent: 1.25 },
    });
    const initial = subject.step();
    expect(initial.state.trainOfFourCount).toBe(4);
    expect(initial.state.trainOfFourRatio).toBe(1);
    expect(initial.state.depthIndex).toBeGreaterThanOrEqual(40);
    expect(initial.state.depthIndex).toBeLessThanOrEqual(60);
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const mapped = new Set(mappings.flatMap((entry) => entry.objectiveIds));
    for (const objective of SCENARIO.metadata.objectives) expect(mapped).toContain(objective.id);
  });

  it('accepts the deep recovery branch and replays its response exactly', () => {
    const first = run('expert');
    const replay = run('expert');
    const bolus = first.events.find((entry) => entry.eventId === 'bolus-rocuronium-300');
    expect(bolus?.data).toMatchObject({
      preDoseTrainOfFourCount: 4, preDoseTrainOfFourRatio: 1,
    });
    const reversal = first.events.find((entry) => entry.eventId === 'sugammadex-3300');
    expect(reversal?.data).toMatchObject({
      doseMgPerKg: 4, trainOfFourCount: 0, postTetanicCount: 1, recoveryPhase: true,
    });
    expect(first.result.state.trainOfFourRatio).toBeGreaterThanOrEqual(0.9);
    expect(first.result.state.depthIndex).toBeGreaterThanOrEqual(40);
    expect(first.result.state.depthIndex).toBeLessThanOrEqual(60);
    expect(first.result.state.spo2Percent).toBeGreaterThan(99.9);
    expect(replay.result).toEqual(first.result);
    expect(replay.events).toEqual(first.events);
  });

  it('scores the expert transcript and refuses onset-phase and wrong-depth shortcuts', () => {
    const findings = (mode: 'expert' | 'none' | 'onset' | 'wrong-depth') => {
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
    expect(findings('onset').find((entry) => entry.objectiveId === 'reverse-recovering-block')?.outcome)
      .toBe('not-met');
    expect(findings('wrong-depth').find((entry) => entry.objectiveId === 'reverse-recovering-block')?.outcome)
      .toBe('not-met');
  });

  it('attributes the visible baseline at the bolus boundary even when history starts post-dose', () => {
    const session = run('expert');
    const postDoseOnly = session.history.filter((sample) => sample.tick >= 300).map((sample, index) => (
      index === 0
        ? { ...sample, state: { ...sample.state, trainOfFourRatio: 0 } }
        : sample
    ));
    const baseline = objectiveFindings(
      SCENARIO, postDoseOnly as never, 0, 0, session.actions, session.events,
    ).find((entry) => entry.objectiveId === 'establish-quantitative-baseline');
    expect(baseline).toMatchObject({ outcome: 'met' });
    expect(baseline?.finding).toContain('pre-dose train-of-four ratio was 1.00');
  });
});
