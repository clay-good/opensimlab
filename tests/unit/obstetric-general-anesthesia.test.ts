import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { OBSTETRIC_GENERAL_ANESTHESIA as SCENARIO } from '@anesthesia/scenarios/obstetric-general-anesthesia';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

type Mode = 'expert' | 'none' | 'unprepared' | 'paralysis-first' | 'failed-airway';

function run(mode: Mode) {
  const subject = new AnesthesiaEngine({
    scenario: SCENARIO, seed: mode === 'failed-airway' ? 3030 : 1, practiceRegion: 'US',
  });
  const actions: LearnerAction[] = [];
  const events: EngineEvent[] = [];
  const history: { tick: number; state: Readonly<Record<string, number>>;
    concentrations: never[]; attribution: never[]; alarms: never[] }[] = [];
  const apply = (action: LearnerAction) => { actions.push(action); subject.apply(action); };
  let result = subject.step();
  let attempted = false;
  let ventilated = false;
  let minSpo2 = result.state.spo2Percent;
  for (let index = 1; index < 2400; index += 1) {
    if (subject.tick === 100 && !['none', 'unprepared'].includes(mode)) {
      apply({ tick: subject.tick, type: 'ventilator', payload: {
        fio2: 1, freshGasFlowLPerMin: 10,
      } });
    }
    if (subject.tick === 900 && mode !== 'none') {
      apply({ tick: subject.tick, type: 'bolus', payload: {
        drugId: mode === 'paralysis-first' ? 'rocuronium' : 'propofol',
        amount: mode === 'paralysis-first' ? 1.2 : 2, unit: 'mg/kg',
      } });
    }
    if (subject.tick === 910 && mode !== 'none') {
      apply({ tick: subject.tick, type: 'bolus', payload: {
        drugId: mode === 'paralysis-first' ? 'propofol' : 'rocuronium',
        amount: mode === 'paralysis-first' ? 2 : 1.2, unit: 'mg/kg',
      } });
    }
    if (!attempted && mode !== 'none' && result.state.trainOfFourCount === 0) {
      apply({ tick: subject.tick, type: 'laryngoscopy', payload: { technique: 'video' } });
      attempted = true;
    }
    if (!ventilated && events.some((event) => event.eventId === 'laryngoscopy-1')) {
      apply({ tick: subject.tick, type: 'ventilator', payload: {
        mode: 'volume-control', delivering: true, fio2: 1,
        tidalVolumeMl: 470, respiratoryRateBpm: 12,
      } });
      ventilated = true;
    }
    result = subject.step();
    events.push(...result.events);
    minSpo2 = Math.min(minSpo2, result.state.spo2Percent);
    history.push({
      tick: subject.tick, state: result.state,
      concentrations: [], attribution: [], alarms: [],
    });
  }
  return { result, actions, events, history, minSpo2 };
}

describe('Requirement: bounded obstetric general anesthesia', () => {
  it('validates, registers the 27th scenario, and maps every objective', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(38);
    expect(SCENARIO.patient.respiratory.profile).toBe('term-pregnancy');
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const mapped = new Set(mappings.flatMap((entry) => entry.objectiveIds));
    for (const objective of SCENARIO.metadata.objectives) expect(mapped).toContain(objective.id);
  });

  it('produces a deterministic expert airway and gas-exchange trajectory', () => {
    const first = run('expert');
    const replay = run('expert');
    expect(first.events.find((event) => event.eventId === 'laryngoscopy-1')?.data?.intubated)
      .toBe(true);
    expect(first.events.some((event) => event.eventId.startsWith('ventilator-'))).toBe(true);
    expect(first.minSpo2).toBeGreaterThan(96.7);
    expect(first.result.state.etco2MmHg).toBeGreaterThanOrEqual(20);
    expect(first.result).toEqual(replay.result);
    expect(first.events).toEqual(replay.events);
  });

  it('gives the fixed term-pregnancy profile less apnea margin than the healthy profile', () => {
    const timeBelow90 = (profile: 'term-pregnancy' | 'healthy') => {
      const scenario = { ...SCENARIO, patient: { ...SCENARIO.patient, respiratory: { profile } } };
      const subject = new AnesthesiaEngine({ scenario, seed: 1, practiceRegion: 'US' });
      subject.apply({ tick: 0, type: 'ventilator', payload: {
        fio2: 1, freshGasFlowLPerMin: 10,
      } });
      let result = subject.step();
      while (subject.tick < 1200) result = subject.step();
      subject.apply({ tick: subject.tick, type: 'bolus', payload: {
        drugId: 'propofol', amount: 2, unit: 'mg/kg',
      } });
      subject.apply({ tick: subject.tick, type: 'bolus', payload: {
        drugId: 'rocuronium', amount: 1.2, unit: 'mg/kg',
      } });
      while (subject.tick < 7200 && result.state.spo2Percent >= 90) result = subject.step();
      return subject.tick - 1200;
    };
    expect(timeBelow90('term-pregnancy')).toBe(3528);
    expect(timeBelow90('healthy')).toBe(5251);
  });

  it('scores expert, absent, unprepared, reversed-order, and failed-airway paths distinctly', () => {
    const findings = (mode: Mode) => {
      const session = run(mode);
      return objectiveFindings(
        SCENARIO, session.history as never, 0, 0, session.actions, session.events,
      );
    };
    expect(findings('expert').map((entry) => entry.outcome)).toEqual(['met', 'met', 'met', 'met']);
    expect(findings('none').map((entry) => entry.outcome)).toEqual([
      'not-exercised', 'not-exercised', 'not-exercised', 'not-exercised',
    ]);
    expect(findings('unprepared').find((entry) =>
      entry.objectiveId === 'prepare-obstetric-oxygen-reserve')?.outcome).toBe('not-met');
    expect(findings('paralysis-first').find((entry) =>
      entry.objectiveId === 'wait-for-intubating-block')?.outcome).toBe('not-met');
    expect(findings('failed-airway').find((entry) =>
      entry.objectiveId === 'confirm-obstetric-ventilation')?.outcome).toBe('not-met');
  });
});
