import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { CIRCLE_SYSTEM_REBREATHING as SCENARIO } from '@anesthesia/scenarios/circle-system-rebreathing';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

const ONSET = 1800;
const engine = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: 404, practiceRegion: 'US' });
const advance = (subject: AnesthesiaEngine, ticks: number) => {
  let result = subject.step();
  for (let index = 1; index < ticks; index += 1) result = subject.step();
  return result;
};
const event = (tick: number, eventId: string, data?: EngineEvent['data']): EngineEvent => ({
  tick, eventId, data, severity: 'warning', category: 'equipment', message: eventId,
});
const sample = (tick: number, etco2MmHg: number) => ({
  tick, state: { etco2MmHg, respiratoryRateBpm: 12, spo2Percent: 98 },
  concentrations: [], attribution: [], alarms: [],
}) as never;

describe('Requirement: exhausted circle-system absorbent produces bounded rebreathing', () => {
  it('validates, registers, maps every objective, and starts established maintenance settings', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(38);
    expect(SCENARIO.timeline).toContainEqual(expect.objectContaining({
      type: 'equipment-failure', target: 'co2-absorbent-exhaustion', atTick: ONSET,
    }));
    const subject = engine();
    expect(subject.equipment().ventilator).toMatchObject({
      delivering: true, freshGasFlowLPerMin: 1, sevofluranePercent: 1.6,
    });
    expect(subject.equipment().airway).toMatchObject({ intubated: true, device: 'tracheal-tube' });
    const initial = subject.step();
    expect(initial.state.endTidalSevofluranePercent).toBeCloseTo(1.6, 2);
    expect(initial.state.depthIndex).toBeGreaterThanOrEqual(40);
    expect(initial.state.depthIndex).toBeLessThanOrEqual(60);
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const mapped = new Set(mappings.flatMap((entry) => entry.objectiveIds));
    for (const objective of SCENARIO.metadata.objectives) expect(mapped).toContain(objective.id);
  });

  it('raises inspired and end-tidal carbon dioxide without losing delivered breaths', () => {
    const subject = engine();
    const before = advance(subject, ONSET);
    expect(before.state.depthIndex).toBeLessThan(60);
    const baselineEtco2 = before.state.etco2MmHg;
    const affected = advance(subject, 601);

    expect(affected.equipment.breathingCircuit).toMatchObject({
      co2Absorbent: 'exhausted', capnogramAssessed: false, absorbentReplaced: false,
    });
    expect(affected.equipment.breathingCircuit?.inspiredCo2MmHg).toBeGreaterThan(5);
    expect(affected.state.etco2MmHg).toBeGreaterThan(baselineEtco2 + 5);
    expect(affected.equipment.ventilator.delivering).toBe(true);
    expect(affected.equipment.invalidParameters).not.toContain('etco2MmHg');
    expect(affected.equipment.artifactParameters).not.toContain('etco2MmHg');
  });

  it('makes high fresh-gas flow a bridge, not a repair', () => {
    const lowFlow = engine();
    const highFlow = engine();
    advance(lowFlow, ONSET + 1);
    advance(highFlow, ONSET + 1);
    highFlow.apply({
      tick: highFlow.tick, type: 'ventilator', payload: { freshGasFlowLPerMin: 15 },
    });
    const low = advance(lowFlow, 600);
    const high = advance(highFlow, 600);

    expect(high.equipment.breathingCircuit?.inspiredCo2MmHg)
      .toBeLessThan(Number(low.equipment.breathingCircuit?.inspiredCo2MmHg));
    expect(high.equipment.breathingCircuit).toMatchObject({ co2Absorbent: 'exhausted' });
  });

  it('requires assessment before replacement, washes out, refuses duplicates, and replays exactly', () => {
    const run = () => {
      const subject = engine();
      advance(subject, ONSET + 301);
      const actions: LearnerAction[] = [
        { tick: subject.tick, type: 'breathing-circuit', payload: { action: 'replace-absorbent' } },
        { tick: subject.tick, type: 'breathing-circuit', payload: { action: 'assess-capnogram' } },
        { tick: subject.tick, type: 'breathing-circuit', payload: { action: 'replace-absorbent' } },
        { tick: subject.tick, type: 'breathing-circuit', payload: { action: 'replace-absorbent' } },
      ];
      const events: EngineEvent[] = [];
      for (const action of actions) {
        subject.apply(action);
        events.push(...subject.step().events);
      }
      const result = advance(subject, 300);
      return { result, events };
    };
    const first = run();
    const replay = run();

    expect(first.events.map((entry) => entry.eventId)).toEqual(expect.arrayContaining([
      `circuit-absorbent-replacement-refused-${ONSET + 301}`,
      `circuit-capnogram-assessed-${ONSET + 302}`,
      `circuit-absorbent-replaced-${ONSET + 303}`,
      `circuit-absorbent-replacement-refused-${ONSET + 304}`,
    ]));
    expect(first.result.equipment.breathingCircuit).toMatchObject({
      co2Absorbent: 'normal', capnogramAssessed: true, absorbentReplaced: true,
    });
    expect(first.result.equipment.breathingCircuit?.inspiredCo2MmHg).toBeLessThan(1);
    expect(replay.result).toEqual(first.result);
  });
});

describe('Requirement: circle-system objectives are scored from accepted evidence', () => {
  const assessed = event(ONSET + 100, `circuit-capnogram-assessed-${ONSET + 100}`);
  const flow: LearnerAction = {
    tick: ONSET + 200, type: 'ventilator', payload: { freshGasFlowLPerMin: 10 },
  };
  const flowEvent = event(ONSET + 200, `ventilator-${ONSET + 200}`, { freshGasFlowLPerMin: 10 });
  const replaced = event(ONSET + 300, `circuit-absorbent-replaced-${ONSET + 300}`);
  const history = [sample(ONSET - 1, 39), sample(ONSET + 300, 44), sample(ONSET + 600, 39.5)];

  it('credits timely recognition, bridge flow, and confirmed washout', () => {
    const findings = objectiveFindings(
      SCENARIO, history, 0, 0, [flow], [assessed, flowEvent, replaced],
    );
    expect(findings.map((entry) => [entry.objectiveId, entry.outcome])).toEqual([
      ['recognize-inspired-carbon-dioxide', 'met'],
      ['bridge-with-fresh-gas-flow', 'met'],
      ['replace-exhausted-absorbent', 'met'],
    ]);
  });

  it('does not infer diagnosis or definitive correction from flow alone', () => {
    const findings = objectiveFindings(SCENARIO, history, 0, 0, [flow], [flowEvent]);
    expect(findings.find((entry) => entry.objectiveId === 'recognize-inspired-carbon-dioxide')?.outcome)
      .toBe('not-met');
    expect(findings.find((entry) => entry.objectiveId === 'replace-exhausted-absorbent')?.outcome)
      .toBe('not-met');
  });
});
