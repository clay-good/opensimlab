import { describe, expect, it } from 'vitest';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIOS } from '@anesthesia/scenarios';
import { DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE as SCENARIO } from '@anesthesia/scenarios/difficult-airway-supraglottic-rescue';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

const event = (
  tick: number, eventId: string, data: EngineEvent['data'] = undefined,
): EngineEvent => ({
  tick, eventId, data, severity: 'warning', category: 'airway', message: eventId,
});

const sample = (tick: number, values: Partial<Record<string, number>> = {}) => ({
  tick,
  state: { endTidalO2Fraction: 0.92, etco2MmHg: 40, spo2Percent: 98, ...values },
  concentrations: [], attribution: [], alarms: [],
}) as never;

const COMPETENT_LOG: EngineEvent[] = [
  event(100, 'bolus-propofol-100'),
  event(200, 'laryngoscopy-start-1', { attempt: 1, technique: 'direct', durationSeconds: 32 }),
  event(520, 'laryngoscopy-1', { grade: 2, attempt: 1, intubated: false, teachingModel: true }),
  event(530, 'airway-help-requested-530', { context: 'airway' }),
  event(540, 'sga-insertion-start-540', { device: 'supraglottic-airway', durationSeconds: 15 }),
  event(690, 'sga-insertion-complete-690', { device: 'supraglottic-airway', teachingModel: true }),
];

const COMPETENT_ACTIONS: LearnerAction[] = [
  { tick: 10, type: 'ventilator', payload: { fio2: 1 } },
  { tick: 100, type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' } },
  { tick: 200, type: 'laryngoscopy', payload: { technique: 'direct' } },
  { tick: 530, type: 'call-for-help', payload: { context: 'airway' } },
  { tick: 540, type: 'airway-device', payload: { device: 'supraglottic-airway' } },
  { tick: 700, type: 'ventilator', payload: { delivering: true } },
];

const HISTORY = [
  sample(100), sample(690, { etco2MmHg: 0 }), sample(700), sample(1000),
];

function finding(
  objectiveId: string,
  actions: readonly LearnerAction[] = COMPETENT_ACTIONS,
  log: readonly EngineEvent[] = COMPETENT_LOG,
) {
  return objectiveFindings(SCENARIO, HISTORY, 0, 0, actions, log)
    .find((entry) => entry.objectiveId === objectiveId)!;
}

function stepUntil(
  engine: AnesthesiaEngine,
  predicate: (result: ReturnType<AnesthesiaEngine['step']>) => boolean,
  maximumTicks = 2000,
) {
  let result = engine.step();
  for (let count = 0; count < maximumTicks && !predicate(result); count += 1) {
    result = engine.step();
  }
  expect(predicate(result)).toBe(true);
  return result;
}

describe('Requirement: difficult-airway supraglottic rescue is a complete bounded scenario', () => {
  it('validates, is registered, and does not announce the hidden failure course', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(33);
    expect(SCENARIO.metadata.estimatedMinutes).toBeLessThan(20);
    expect(SCENARIO.timeline).toContainEqual(expect.objectContaining({
      type: 'difficult-airway', target: 'failed-intubation-with-marginal-mask', value: 0.35,
    }));
    const hidden = SCENARIO.timeline.find((entry) => entry.type === 'difficult-airway')!;
    expect(hidden.message).toBeUndefined();
  });

  it('cites both airway guidelines and states the oxygenation-only boundary', () => {
    const sources = SCENARIO.metadata.clinicalReview.sources.join(' ');
    expect(sources).toContain('PMID 34762729');
    expect(sources).toContain('PMID 26556848');
    expect(SCENARIO.timeline[1]?.message).toContain('does not model a complete difficult-airway pathway');
    expect(SCENARIO.metadata.limitations).toEqual(expect.arrayContaining([
      'difficult-airway-failure-and-mask-ventilation-are-teaching-bounds',
      'supraglottic-airway-placement-is-an-abstraction',
      'airway-help-request-does-not-model-a-team',
      'no-cico-or-front-of-neck-airway',
      'no-post-supraglottic-airway-plan',
    ]));
  });

  it('maps its objectives into every supported framework', () => {
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const objectiveIds = new Set(SCENARIO.metadata.objectives.map((entry) => entry.id));
    for (const mapping of mappings) {
      for (const objectiveId of mapping.objectiveIds) expect(objectiveIds).toContain(objectiveId);
    }
  });

  it('runs through deterministic failed intubation and a timed supraglottic oxygenation rescue', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 20260819, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: engine.tick, type: 'ventilator', payload: {
      fio2: 1, tidalVolumeMl: 480, respiratoryRateBpm: 12, delivering: true,
    } });
    engine.apply({ tick: engine.tick, type: 'bolus', payload: {
      drugId: 'propofol', amount: 2, unit: 'mg/kg',
    } });
    engine.apply({ tick: engine.tick, type: 'bolus', payload: {
      drugId: 'rocuronium', amount: 0.6, unit: 'mg/kg',
    } });
    stepUntil(engine, (result) => result.state.trainOfFourCount === 0);
    engine.apply({ tick: engine.tick, type: 'laryngoscopy', payload: { technique: 'direct' } });
    const failed = stepUntil(engine, (result) => result.events.some(
      (entry) => entry.eventId === 'laryngoscopy-1',
    ));
    expect(failed.equipment.airway).toMatchObject({
      device: 'facemask', intubated: false, attempts: 1,
    });

    engine.apply({ tick: engine.tick, type: 'call-for-help', payload: { context: 'airway' } });
    engine.apply({ tick: engine.tick, type: 'airway-device', payload: { device: 'supraglottic-airway' } });
    const inserting = engine.step();
    expect(inserting.equipment.airway.supraglotticInsertionSecondsRemaining).toBeGreaterThan(0);
    expect(inserting.state.tidalVolumeMl).toBe(0);
    const placed = stepUntil(engine, (result) =>
      result.equipment.airway.device === 'supraglottic-airway');
    expect(placed.equipment.airway.intubated).toBe(false);
    engine.apply({ tick: engine.tick, type: 'ventilator', payload: { delivering: true } });
    const ventilated = stepUntil(engine, (result) =>
      result.state.etco2MmHg > 25 && result.state.tidalVolumeMl === 480, 1200);
    expect(ventilated.state.spo2Percent).toBeGreaterThanOrEqual(92);
  });
});

describe('Requirement: difficult-airway debrief uses accepted events and observable outcomes', () => {
  it('scores preoxygenation at the first accepted propofol dose', () => {
    expect(finding('prepare-rescue-oxygen-reserve').outcome).toBe('met');
    expect(finding('prepare-rescue-oxygen-reserve').finding).toContain('0.92');
  });

  it('scores early help and attempt limitation without claiming team performance', () => {
    const result = finding('limit-attempts-and-call-for-help');
    expect(result.outcome).toBe('met');
    expect(result.finding).toContain('1 completed tracheal attempt');
    expect(result.finding).toContain('team arrival and performance are not modeled');
  });

  it('ignores refused hostile actions and identifies an accepted extra attempt', () => {
    const refused = [
      ...COMPETENT_LOG.slice(0, 3),
      event(525, 'airway-help-refused-525'), event(526, 'sga-insertion-refused-526'),
      ...COMPETENT_LOG.slice(3),
    ];
    expect(finding('limit-attempts-and-call-for-help', COMPETENT_ACTIONS, refused).outcome).toBe('met');

    const repeated = [
      ...COMPETENT_LOG.slice(0, 3),
      event(525, 'laryngoscopy-start-2', { attempt: 2, technique: 'video', durationSeconds: 22 }),
      event(745, 'laryngoscopy-2', { grade: 1, attempt: 2, intubated: false, teachingModel: true }),
      event(750, 'airway-help-requested-750', { context: 'airway' }),
      event(760, 'sga-insertion-start-760', { device: 'supraglottic-airway', durationSeconds: 15 }),
      event(910, 'sga-insertion-complete-910', { device: 'supraglottic-airway', teachingModel: true }),
    ];
    expect(finding('place-supraglottic-rescue', COMPETENT_ACTIONS, repeated).outcome)
      .toBe('partly-met');
  });

  it('calls the device rescue oxygenation, never tracheal placement', () => {
    const result = finding('place-supraglottic-rescue');
    expect(result.outcome).toBe('met');
    expect(result.finding).toContain('modeled oxygenation route');
    expect(result.finding).toContain('not tracheal intubation');
  });

  it('requires a post-placement delivery action overlapping sustained capnography', () => {
    const result = finding('confirm-rescue-gas-exchange');
    expect(result.outcome).toBe('met');
    expect(result.finding).toContain('At least 30 seconds');
    expect(result.finding).toContain('not tracheal placement');

    const onlyPrePlacementDelivery = COMPETENT_ACTIONS.filter((entry) => entry.tick !== 700);
    expect(finding('confirm-rescue-gas-exchange', onlyPrePlacementDelivery).outcome)
      .not.toBe('met');
  });
});
