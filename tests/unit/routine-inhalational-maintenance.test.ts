import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { ROUTINE_INHALATIONAL_MAINTENANCE as SCENARIO } from '@anesthesia/scenarios/routine-inhalational-maintenance';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

const STIMULUS_ONSET = 2400;
const STIMULUS_OFFSET = 3600;
const engine = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: 404, practiceRegion: 'US' });

function run(expert: boolean, endTick = 5400) {
  const subject = engine();
  const actions: LearnerAction[] = [];
  const events: EngineEvent[] = [];
  const history: { tick: number; state: Readonly<Record<string, number>>;
    concentrations: never[]; attribution: never[]; alarms: never[] }[] = [];
  let result = subject.step();
  for (let index = 1; index < endTick; index += 1) {
    if (expert && subject.tick === 1200) {
      const action = {
        tick: subject.tick, type: 'infusion',
        payload: { drugId: 'remifentanil', rate: 0.2, unit: 'µg/kg/min' },
      } as const;
      actions.push(action); subject.apply(action);
    }
    if (expert && subject.tick === STIMULUS_OFFSET) {
      const action = {
        tick: subject.tick, type: 'infusion',
        payload: { drugId: 'remifentanil', rate: 0, unit: 'µg/kg/min' },
      } as const;
      actions.push(action); subject.apply(action);
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
  return { subject, result, actions, events, history };
}

describe('Requirement: routine inhalational maintenance is bounded and changing', () => {
  it('validates, registers, maps every objective, and starts alarm-safe established maintenance', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(28);
    const subject = engine();
    expect(subject.equipment()).toMatchObject({
      airway: { intubated: true, device: 'tracheal-tube' },
      ventilator: { delivering: true, sevofluranePercent: 1.2, freshGasFlowLPerMin: 2 },
    });
    const initial = subject.step();
    expect(initial.state.endTidalSevofluranePercent).toBeCloseTo(1.2, 2);
    expect(initial.state.depthIndex).toBeGreaterThanOrEqual(40);
    expect(initial.state.depthIndex).toBeLessThanOrEqual(60);
    expect(initial.state.meanArterialMmHg).toBeGreaterThanOrEqual(65);
    expect(initial.alarms).toEqual([]);
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const mapped = new Set(mappings.flatMap((entry) => entry.objectiveIds));
    for (const objective of SCENARIO.metadata.objectives) expect(mapped).toContain(objective.id);
  });

  it('makes anticipatory infusion change the response to the same deterministic stimulus', () => {
    const expert = run(true, STIMULUS_ONSET + 600);
    const noAction = run(false, STIMULUS_ONSET + 600);
    expect(expert.result.state.heartRateBpm).toBeLessThan(noAction.result.state.heartRateBpm);
    expect(expert.result.state.meanArterialMmHg).toBeLessThan(noAction.result.state.meanArterialMmHg);
    expect(expert.result.state.depthIndex).toBeGreaterThanOrEqual(40);
    expect(expert.result.state.depthIndex).toBeLessThanOrEqual(60);
  });

  it('rewards reassessment when stimulus falls and replays exactly', () => {
    const first = run(true);
    const replay = run(true);
    expect(first.events.map((entry) => entry.eventId)).toEqual(expect.arrayContaining([
      'infusion-remifentanil-1200', 'infusion-remifentanil-3600',
    ]));
    expect(first.result.state.meanArterialMmHg).toBeGreaterThanOrEqual(65);
    expect(first.result.state.depthIndex).toBeGreaterThanOrEqual(40);
    expect(first.result.state.depthIndex).toBeLessThanOrEqual(60);
    expect(replay.result).toEqual(first.result);
  });
});

describe('Requirement: maintenance objectives use accepted actions and observed state', () => {
  it('credits the expert fixture and distinguishes no action', () => {
    const expert = run(true);
    const expertFindings = objectiveFindings(
      SCENARIO, expert.history as never, 0, 0, expert.actions, expert.events,
    );
    expect(expertFindings.map((entry) => [entry.objectiveId, entry.outcome])).toEqual([
      ['maintain-bounded-depth', 'met'],
      ['anticipate-surgical-stimulus', 'met'],
      ['reassess-when-stimulus-falls', 'met'],
    ]);

    const noAction = run(false);
    const noActionFindings = objectiveFindings(
      SCENARIO, noAction.history as never, 0, 0, noAction.actions, noAction.events,
    );
    expect(noActionFindings.find((entry) => entry.objectiveId === 'anticipate-surgical-stimulus')?.outcome)
      .toBe('not-met');
    expect(noActionFindings.find((entry) => entry.objectiveId === 'reassess-when-stimulus-falls')?.outcome)
      .not.toBe('met');

    const stoppedBeforeStimulus = expert.events.map((entry) => entry.eventId === 'infusion-remifentanil-3600'
      ? { ...entry, tick: 1800, eventId: 'infusion-remifentanil-1800' }
      : entry);
    const stoppedFindings = objectiveFindings(
      SCENARIO, expert.history as never, 0, 0, expert.actions, stoppedBeforeStimulus,
    );
    expect(stoppedFindings.find((entry) => entry.objectiveId === 'anticipate-surgical-stimulus')?.outcome)
      .toBe('partly-met');
  });
});
