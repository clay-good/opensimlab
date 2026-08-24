import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION as SCENARIO } from '@anesthesia/scenarios/capnography-sampling-line-obstruction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

const ONSET = 1200;

const event = (tick: number, eventId: string): EngineEvent => ({
  tick, eventId, severity: 'artifact', category: 'artifact', message: eventId,
});

const sample = (tick: number, values: Partial<Record<string, number>> = {}) => ({
  tick,
  state: {
    etco2MmHg: 38, respiratoryRateBpm: 12, tidalVolumeMl: 480,
    spo2Percent: 98, perfusionIndex: 1, ...values,
  },
  concentrations: [], attribution: [], alarms: [],
}) as never;

describe('Requirement: capnography sampling-line obstruction is a distinct bounded scenario', () => {
  it('validates, registers, maps every objective, and declares the display-only boundary', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(22);
    expect(SCENARIO.timeline).toContainEqual(expect.objectContaining({
      type: 'artifact', target: 'sampling-line-obstruction', atTick: ONSET,
    }));
    expect(SCENARIO.metadata.limitations).toContain(
      'capnography-sampling-line-obstruction-is-display-only',
    );

    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const mapped = new Set(mappings.flatMap((entry) => entry.objectiveIds));
    for (const objective of SCENARIO.metadata.objectives) expect(mapped).toContain(objective.id);
  });

  it('removes only the sampled display while canonical ventilation stays stable', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 18, practiceRegion: 'US' });
    let before = engine.step();
    while (engine.tick < ONSET) before = engine.step();
    const trueEtco2 = before.state.etco2MmHg;
    const trueSaturation = before.state.spo2Percent;
    const trueTidalVolume = before.state.tidalVolumeMl;
    const affected = engine.step();

    expect(affected.equipment.capnographyLine).toMatchObject({
      obstructed: true, ventilationCrossChecked: false,
    });
    expect(affected.equipment.invalidParameters).toContain('etco2MmHg');
    expect(affected.equipment.artifactParameters).toContain('etco2MmHg');
    expect(affected.equipment.waveformArtifacts).toContain('capno');
    expect(affected.waveforms.capno.samples.every((value) => value === 0)).toBe(true);
    expect(affected.state.etco2MmHg).toBeCloseTo(trueEtco2, 0);
    expect(affected.state.spo2Percent).toBeCloseTo(trueSaturation, 0);
    expect(affected.state.tidalVolumeMl).toBe(trueTidalVolume);
  });

  it('records the cross-check, restores the sample path, refuses duplicates, and replays exactly', () => {
    const actions: LearnerAction[] = [
      { tick: ONSET + 1, type: 'capnography-line', payload: { action: 'cross-check-ventilation' } },
      { tick: ONSET + 2, type: 'capnography-line', payload: { action: 'reconnect' } },
      { tick: ONSET + 3, type: 'capnography-line', payload: { action: 'reconnect' } },
    ];
    const run = () => {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 81, practiceRegion: 'US' });
      const events: EngineEvent[] = [];
      let result = engine.step();
      while (engine.tick <= ONSET + 3) {
        for (const action of actions.filter((entry) => entry.tick === engine.tick)) engine.apply(action);
        result = engine.step();
        events.push(...result.events);
      }
      return { result, events };
    };
    const first = run();
    const replay = run();

    expect(first.events.map((entry) => entry.eventId)).toContain(`capnography-cross-check-${ONSET + 1}`);
    expect(first.events.map((entry) => entry.eventId)).toContain(`capnography-line-restored-${ONSET + 2}`);
    expect(first.events.map((entry) => entry.eventId))
      .toContain(`capnography-line-reconnect-refused-${ONSET + 3}`);
    expect(first.result.equipment.capnographyLine).toMatchObject({
      obstructed: false, ventilationCrossChecked: true,
    });
    expect(first.result.equipment.invalidParameters).not.toContain('etco2MmHg');
    expect(first.result.waveforms.capno.samples.some((value) => value > 0)).toBe(true);
    expect(replay.result).toEqual(first.result);
  });

  it('requires a fresh cross-check when a later authored obstruction is injected', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 82, practiceRegion: 'US' });
    while (engine.tick <= ONSET) engine.step();
    engine.apply({
      tick: engine.tick, type: 'capnography-line', payload: { action: 'cross-check-ventilation' },
    });
    engine.step();
    engine.apply({ tick: engine.tick, type: 'capnography-line', payload: { action: 'reconnect' } });
    engine.step();
    expect(engine.equipment().capnographyLine.ventilationCrossChecked).toBe(true);

    engine.apply({
      tick: engine.tick, type: 'artifact',
      payload: { artifactId: 'sampling-line-obstruction', active: true },
    });
    const reinjected = engine.step();
    expect(reinjected.equipment.capnographyLine).toEqual({
      obstructed: true, ventilationCrossChecked: false,
    });
  });
});

describe('Requirement: equipment-signal diagnosis is scored from accepted evidence', () => {
  const actions: LearnerAction[] = [
    { tick: ONSET + 100, type: 'capnography-line', payload: { action: 'cross-check-ventilation' } },
    { tick: ONSET + 200, type: 'capnography-line', payload: { action: 'reconnect' } },
  ];
  const log = [
    event(ONSET, `artifact-sampling-line-obstruction-${ONSET}`),
    event(ONSET + 100, `capnography-cross-check-${ONSET + 100}`),
    event(ONSET + 200, `capnography-line-restored-${ONSET + 200}`),
  ];
  const history = [sample(ONSET - 1), sample(ONSET + 100), sample(ONSET + 201)];

  it('credits a timely cross-check and restoration without claiming a physical examination', () => {
    const findings = objectiveFindings(SCENARIO, history, 0, 0, actions, log);
    expect(findings.find((entry) => entry.objectiveId === 'cross-check-capnography-loss')).toMatchObject({ outcome: 'met' });
    expect(findings.find((entry) => entry.objectiveId === 'restore-capnography-sampling')).toMatchObject({ outcome: 'met' });
    expect(findings.find((entry) => entry.objectiveId === 'preserve-stable-ventilation')?.finding)
      .toContain('screen evidence');
  });

  it('does not infer diagnostic discrimination from reconnection alone', () => {
    const premature = objectiveFindings(
      SCENARIO, history, 0, 0,
      [actions[1]!], [log[0]!, log[2]!],
    );
    expect(premature.find((entry) => entry.objectiveId === 'cross-check-capnography-loss')?.outcome)
      .toBe('not-met');
    expect(premature.find((entry) => entry.objectiveId === 'restore-capnography-sampling')?.outcome)
      .toBe('partly-met');
  });
});
