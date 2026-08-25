import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { EXTUBATION_READINESS as SCENARIO } from '@anesthesia/scenarios/extubation-readiness';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

const reviews = [
  'review-quantitative-recovery', 'review-awake-airway-protection',
  'review-spontaneous-gas-exchange', 'review-airway-risk-and-rescue',
] as const;

const engine = (scenario = SCENARIO) => new AnesthesiaEngine({
  scenario, seed: 825, practiceRegion: 'US',
});

function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({
    tick: subject.tick, type: 'extubation-readiness-assessment', payload: { action },
  });
  return subject.step();
}

function run(actions: readonly string[]) {
  const subject = engine();
  const transcript: LearnerAction[] = [];
  const events: EngineEvent[] = [];
  const history: { tick: number; state: Readonly<Record<string, number>>;
    concentrations: never[]; attribution: never[]; alarms: never[] }[] = [];
  let result = subject.step();
  history.push({ tick: subject.tick, state: result.state, concentrations: [], attribution: [], alarms: [] });
  for (const action of actions) {
    const request = {
      tick: subject.tick, type: 'extubation-readiness-assessment', payload: { action },
    } satisfies LearnerAction;
    transcript.push(request);
    subject.apply(request);
    result = subject.step();
    events.push(...result.events);
    history.push({ tick: subject.tick, state: result.state, concentrations: [], attribution: [], alarms: [] });
  }
  return { result, transcript, events, history };
}

describe('Requirement: extubation readiness integrates more than train-of-four recovery', () => {
  it('validates, registers, maps every objective, and preserves the secured airway', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(38);
    const subject = engine();
    expect(subject.step().state.trainOfFourRatio).toBeCloseTo(0.93, 6);
    expect(subject.equipment()).toMatchObject({
      airway: { intubated: true, device: 'tracheal-tube' },
      ventilator: { delivering: true },
    });
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const mapped = new Set(mappings.flatMap((entry) => entry.objectiveIds));
    for (const objective of SCENARIO.metadata.objectives) expect(mapped).toContain(objective.id);
  });

  it('accepts the ordered expert path, keeps the tube in place, and replays exactly', () => {
    const actions = [...reviews, 'ready-for-planned-awake-extubation'];
    const first = run(actions);
    const replay = run(actions);
    expect(first.events.find((entry) => entry.eventId.startsWith(
      'extubation-gas-exchange-reviewed-',
    ))?.data).toMatchObject({
      spontaneousRespiratoryRateBpm: 14, averageTidalVolumeMl: 420,
      endTidalCarbonDioxideMmHg: 39, spo2Percent: 98, fio2: 0.4,
    });
    expect(first.events.find((entry) => entry.eventId.startsWith(
      'extubation-decision-ready-',
    ))?.data).toMatchObject({
      decision: 'ready-for-planned-awake-extubation', airwayRemainedIntubated: true,
      ventilationRemainedDelivered: true, tubeRemovalSimulated: false,
    });
    expect(replay.result).toEqual(first.result);
    expect(replay.events).toEqual(first.events);
  });

  it('refuses skipped, duplicate, unsupported, and unknown requests', () => {
    const subject = engine();
    subject.step();
    expect(act(subject, 'ready-for-planned-awake-extubation').events.at(-1)?.eventId)
      .toMatch(/^extubation-readiness-order-refused-/);
    act(subject, reviews[0]);
    expect(act(subject, reviews[0]).events.at(-1)?.eventId)
      .toMatch(/^extubation-recovery-refused-/);
    for (const action of reviews.slice(1)) act(subject, action);
    act(subject, 'ready-for-planned-awake-extubation');
    expect(act(subject, 'continue-support-and-reassess').events.at(-1)?.eventId)
      .toMatch(/^extubation-decision-refused-/);
    expect(act(subject, 'invented').events.at(-1)?.eventId)
      .toMatch(/^extubation-readiness-refused-/);

    const unsupported = engine(SCENARIOS[0]!);
    unsupported.step();
    expect(act(unsupported, reviews[0]).events.at(-1)?.eventId)
      .toMatch(/^extubation-readiness-refused-/);
  });

  it('scores accepted engine events only and distinguishes continued support', () => {
    const expert = run([...reviews, 'ready-for-planned-awake-extubation']);
    const incomplete = run([...reviews, 'continue-support-and-reassess']);
    const score = (session: ReturnType<typeof run>) => objectiveFindings(
      SCENARIO, session.history as never, 0, 0, session.transcript, session.events,
    ).map((entry) => entry.outcome);
    expect(score(expert)).toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(score(incomplete)).toEqual(['met', 'met', 'met', 'met', 'not-met']);
    const raw = [...reviews, 'ready-for-planned-awake-extubation'].map((action, tick) => ({
      tick, type: 'extubation-readiness-assessment', payload: { action },
    } satisfies LearnerAction));
    expect(objectiveFindings(
      SCENARIO, expert.history as never, 0, 0, raw, [],
    ).map((entry) => entry.outcome)).toEqual([
      'not-met', 'not-met', 'not-met', 'not-met', 'not-met',
    ]);
  });
});
