import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { ROUTINE_PEDIATRIC_INHALATIONAL_INDUCTION as SCENARIO } from '@anesthesia/scenarios/routine-pediatric-inhalational-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

type Mode = 'expert' | 'none' | 'unprepared' | 'no-reduction' | 'hostile';

function run(mode: Mode) {
  const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 929, practiceRegion: 'US' });
  const actions: LearnerAction[] = [];
  const events: EngineEvent[] = [];
  const history: { tick: number; state: Readonly<Record<string, number>>;
    concentrations: never[]; attribution: never[]; alarms: never[] }[] = [];
  let result = subject.step();
  let minMap = result.state.meanArterialMmHg;
  let minSpo2 = result.state.spo2Percent;
  let peakEndTidal = 0;
  const apply = (action: LearnerAction) => { actions.push(action); subject.apply(action); };
  for (let index = 1; index < 4200; index += 1) {
    if (subject.tick === 100 && !['none', 'unprepared'].includes(mode)) {
      apply({ tick: subject.tick, type: 'ventilator', payload: {
        fio2: 1, freshGasFlowLPerMin: 6, sevofluranePercent: 0,
      } });
    }
    if (subject.tick === 200 && mode !== 'none') {
      apply({ tick: subject.tick, type: 'ventilator', payload: {
        sevofluranePercent: mode === 'hostile' ? 99 : 8,
      } });
    }
    if (subject.tick === 280 && !['none', 'no-reduction'].includes(mode)) {
      apply({ tick: subject.tick, type: 'ventilator', payload: { sevofluranePercent: 2.5 } });
    }
    result = subject.step();
    events.push(...result.events);
    minMap = Math.min(minMap, result.state.meanArterialMmHg);
    minSpo2 = Math.min(minSpo2, result.state.spo2Percent);
    peakEndTidal = Math.max(peakEndTidal, result.state.endTidalSevofluranePercent);
    if (subject.tick % 10 === 0) {
      history.push({ tick: subject.tick, state: result.state, concentrations: [], attribution: [], alarms: [] });
    }
  }
  return { result, actions, events, history, minMap, minSpo2, peakEndTidal };
}

describe('Requirement: bounded routine pediatric inhalational induction', () => {
  it('validates a device-only formulary, registers the 26th scenario, and maps every objective', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.formulary).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(33);
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const mapped = new Set(mappings.flatMap((entry) => entry.objectiveIds));
    for (const objective of SCENARIO.metadata.objectives) expect(mapped).toContain(objective.id);
  });

  it('produces the declared deterministic wash-in and settled expert trajectory', () => {
    const first = run('expert');
    const replay = run('expert');
    const target = first.history.find((sample) => Number(sample.state.macFraction) >= 0.8)!;
    expect(target.tick).toBe(270);
    expect(target.state.endTidalSevofluranePercent).toBeCloseTo(1.95373, 4);
    expect(target.state.depthIndex).toBeCloseTo(50.4375, 3);
    expect(first.peakEndTidal).toBeCloseTo(2.5, 4);
    expect(first.minMap).toBeGreaterThan(56.27);
    expect(first.minSpo2).toBeGreaterThan(96.93);
    expect(first.result.state.depthIndex).toBeGreaterThanOrEqual(40);
    expect(first.result.state.depthIndex).toBeLessThanOrEqual(60);
    expect(first.result).toEqual(replay.result);
    expect(first.events).toEqual(replay.events);
    expect(first.events.some((event) => event.message.includes('sevoflurane 8.0%'))).toBe(true);
  });

  it('scores expert, no-action, unprepared, no-reduction, and hostile-setting paths distinctly', () => {
    const findings = (mode: Mode) => {
      const session = run(mode);
      return objectiveFindings(
        SCENARIO, session.history as never, 0, 0, session.actions, session.events,
      );
    };
    expect(findings('expert').map((entry) => entry.outcome)).toEqual(['met', 'met', 'met']);
    expect(findings('none').map((entry) => entry.outcome)).toEqual([
      'not-exercised', 'not-exercised', 'not-exercised',
    ]);
    expect(findings('unprepared').find((entry) =>
      entry.objectiveId === 'prepare-pediatric-inhalational-circuit')?.outcome).toBe('not-met');
    expect(findings('no-reduction').find((entry) =>
      entry.objectiveId === 'settle-pediatric-volatile-depth')?.outcome).toBe('not-met');
    expect(findings('hostile').find((entry) =>
      entry.objectiveId === 'follow-pediatric-end-tidal-wash-in')?.outcome).toBe('not-met');
  });
});
