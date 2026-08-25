import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { REPEATED_LARYNGOSCOPY_HARM as SCENARIO } from '@anesthesia/scenarios/repeated-laryngoscopy-harm';
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

function stepUntil(
  engine: AnesthesiaEngine,
  predicate: (result: ReturnType<AnesthesiaEngine['step']>) => boolean,
  maximumTicks = 2500,
) {
  let result = engine.step();
  for (let count = 0; count < maximumTicks && !predicate(result); count += 1) {
    result = engine.step();
  }
  expect(predicate(result)).toBe(true);
  return result;
}

function startAttempt(engine: AnesthesiaEngine, technique: 'direct' | 'video' = 'direct') {
  engine.apply({ tick: engine.tick, type: 'laryngoscopy', payload: { technique } });
  return stepUntil(engine, (result) => result.events.some(
    (entry) => /^laryngoscopy-\d+$/.test(entry.eventId),
  ));
}

describe('Requirement: repeated-laryngoscopy harm is a distinct bounded scenario', () => {
  it('validates, registers, maps every objective, and declares the known-airway boundary', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(37);
    expect(SCENARIO.timeline).toContainEqual(expect.objectContaining({
      type: 'difficult-airway', target: 'failed-intubation-with-marginal-mask', value: 1,
    }));
    expect(SCENARIO.patient.airway.assessment).toContain('prior anesthetic record');
    expect(SCENARIO.metadata.limitations).toContain(
      'repeated-laryngoscopy-trauma-is-a-teaching-model',
    );

    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const mapped = new Set(mappings.flatMap((entry) => entry.objectiveIds));
    for (const objective of SCENARIO.metadata.objectives) expect(mapped).toContain(objective.id);
  });

  it('preserves full facemask delivery but makes every accepted attempt consume unventilated time', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 20260819, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: engine.tick, type: 'ventilator', payload: {
      fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12, delivering: true,
    } });
    const before = engine.step();
    expect(before.state.tidalVolumeMl).toBe(500);

    engine.apply({ tick: engine.tick, type: 'bolus', payload: {
      drugId: 'propofol', amount: 2, unit: 'mg/kg',
    } });
    for (let tick = 0; tick < 300; tick += 1) engine.step();

    engine.apply({ tick: engine.tick, type: 'laryngoscopy', payload: { technique: 'direct' } });
    const started = stepUntil(engine, (result) =>
      result.equipment.airway.attemptInProgress && result.state.tidalVolumeMl === 0);
    expect(started.state.tidalVolumeMl).toBe(0);
    const completed = stepUntil(engine, (result) => result.events.some(
      (entry) => entry.eventId === 'laryngoscopy-1',
    ));
    expect(completed.equipment.airway).toMatchObject({ attempts: 1, intubated: false });

    engine.apply({ tick: engine.tick, type: 'ventilator', payload: { delivering: true } });
    const oxygenating = engine.step();
    expect(oxygenating.state.tidalVolumeMl).toBe(500);
  });

  it('makes fixation spend more oxygen reserve than stopping after the first failed attempt', () => {
    const limited = new AnesthesiaEngine({ scenario: SCENARIO, seed: 29, practiceRegion: 'US' });
    const repeated = new AnesthesiaEngine({ scenario: SCENARIO, seed: 29, practiceRegion: 'US' });
    limited.step();
    repeated.step();

    for (const engine of [limited, repeated]) {
      engine.apply({ tick: engine.tick, type: 'bolus', payload: {
        drugId: 'propofol', amount: 2, unit: 'mg/kg',
      } });
      engine.step();
    }

    const firstLimited = startAttempt(limited);
    const firstRepeated = startAttempt(repeated);
    startAttempt(repeated);
    const thirdRepeated = startAttempt(repeated);

    limited.apply({ tick: limited.tick, type: 'airway-device', payload: { device: 'supraglottic-airway' } });
    const rescued = stepUntil(limited, (result) =>
      result.equipment.airway.device === 'supraglottic-airway');

    expect(firstLimited.equipment.airway.attempts).toBe(1);
    expect(thirdRepeated.equipment.airway.attempts).toBe(3);
    expect(thirdRepeated.tick).toBeGreaterThan(rescued.tick);
    expect(thirdRepeated.state.pao2MmHg).toBeLessThan(firstRepeated.state.pao2MmHg);
    expect(thirdRepeated.events.find((entry) => entry.eventId === 'laryngoscopy-3')?.data)
      .toMatchObject({ attempt: 3, intubated: false, teachingModel: true });
  });
});

describe('Requirement: the prior record changes observable debrief evidence', () => {
  const history = [sample(100), sample(700), sample(1000)];
  const actions: LearnerAction[] = [
    { tick: 10, type: 'ventilator', payload: { fio2: 1 } },
    { tick: 100, type: 'bolus', payload: { drugId: 'propofol', amount: 1.5, unit: 'mg/kg' } },
    { tick: 150, type: 'call-for-help', payload: { context: 'airway' } },
    { tick: 200, type: 'laryngoscopy', payload: { technique: 'direct' } },
    { tick: 540, type: 'airway-device', payload: { device: 'supraglottic-airway' } },
    { tick: 700, type: 'ventilator', payload: { fio2: 1, delivering: true } },
  ];
  const log: EngineEvent[] = [
    event(100, 'bolus-propofol-100'),
    event(150, 'airway-help-requested-150', { context: 'airway' }),
    event(200, 'laryngoscopy-start-1', { attempt: 1, technique: 'direct', durationSeconds: 32 }),
    event(520, 'laryngoscopy-1', { grade: 3, attempt: 1, intubated: false, teachingModel: true }),
    event(540, 'sga-insertion-start-540', { device: 'supraglottic-airway', durationSeconds: 15 }),
    event(690, 'sga-insertion-complete-690', { device: 'supraglottic-airway', teachingModel: true }),
  ];

  it('credits pre-attempt escalation without claiming communication or team performance', () => {
    const findings = objectiveFindings(SCENARIO, history, 0, 0, actions, log);
    const prior = findings.find((entry) => entry.objectiveId === 'act-on-prior-airway-record')!;
    const limited = findings.find(
      (entry) => entry.objectiveId === 'limit-attempts-and-call-for-help',
    )!;
    expect(prior.outcome).toBe('met');
    expect(prior.finding).toContain('before the first laryngoscopy');
    expect(prior.finding).toContain('not communication quality');
    expect(limited.outcome).toBe('met');
  });

  it('does not infer use of the prior record from a late request', () => {
    const lateLog = log.map((entry) => entry.eventId === 'airway-help-requested-150'
      ? event(530, 'airway-help-requested-530', { context: 'airway' }) : entry);
    const prior = objectiveFindings(SCENARIO, history, 0, 0, actions, lateLog)
      .find((entry) => entry.objectiveId === 'act-on-prior-airway-record')!;
    expect(prior.outcome).toBe('partly-met');
    expect(prior.finding).toContain('after the first laryngoscopy');
  });
});
