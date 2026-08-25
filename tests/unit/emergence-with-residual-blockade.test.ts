import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { EMERGENCE_WITH_RESIDUAL_BLOCKADE as SCENARIO } from '@anesthesia/scenarios/emergence-with-residual-blockade';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

const engine = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: 819, practiceRegion: 'US' });

function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({
    tick: subject.tick,
    type: 'emergence-residual-block-assessment',
    payload: { action },
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
      tick: subject.tick,
      type: 'emergence-residual-block-assessment',
      payload: { action },
    } satisfies LearnerAction;
    transcript.push(request);
    subject.apply(request);
    result = subject.step();
    events.push(...result.events);
    history.push({ tick: subject.tick, state: result.state, concentrations: [], attribution: [], alarms: [] });
  }
  return { result, transcript, events, history };
}

describe('Requirement: emergence residual blockade uses quantitative recovery', () => {
  it('validates, registers, maps every objective, and starts with a truthful residual pattern', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(36);
    const subject = engine();
    const initial = subject.step();
    expect(initial.state.trainOfFourCount).toBe(4);
    expect(initial.state.trainOfFourRatio).toBeCloseTo(0.72, 6);
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
    expect(validateScenario({
      ...SCENARIO,
      equipment: { ...SCENARIO.equipment, startingTrainOfFourRatio: 0.39 },
    })).toContainEqual(expect.objectContaining({
      pointer: '/equipment/startingTrainOfFourRatio', rule: 'minimum',
    }));
  });

  it('accepts the ordered protective path and replays it exactly', () => {
    const actions = [
      'review-quantitative-monitor', 'classify-residual', 'defer-extubation-and-support',
    ];
    const first = run(actions);
    const replay = run(actions);
    expect(first.events.find((entry) => entry.eventId.startsWith('emergence-monitor-reviewed-'))?.data)
      .toMatchObject({ trainOfFourCount: 4, trainOfFourRatio: 0.72, qualitativeFadeDetected: false });
    expect(first.events.find((entry) => entry.eventId.startsWith('emergence-plan-defer-'))?.data)
      .toMatchObject({
        classification: 'residual', airwayRemainedIntubated: true,
        ventilationRemainedDelivered: true,
      });
    expect(replay.result).toEqual(first.result);
    expect(replay.events).toEqual(first.events);
  });

  it('refuses out-of-order, duplicate, unsupported, and unknown requests without changing the plan', () => {
    const subject = engine();
    subject.step();
    expect(act(subject, 'classify-residual').events.at(-1)?.eventId)
      .toMatch(/^emergence-block-order-refused-/);
    act(subject, 'review-quantitative-monitor');
    expect(act(subject, 'review-quantitative-monitor').events.at(-1)?.eventId)
      .toMatch(/^emergence-monitor-review-refused-/);
    act(subject, 'classify-residual');
    expect(act(subject, 'classify-recovered').events.at(-1)?.eventId)
      .toMatch(/^emergence-block-classification-refused-/);
    act(subject, 'defer-extubation-and-support');
    expect(act(subject, 'proceed-to-extubation').events.at(-1)?.eventId)
      .toMatch(/^emergence-plan-refused-/);
    expect(act(subject, 'invented').events.at(-1)?.eventId).toMatch(/^emergence-block-refused-/);
    expect(subject.equipment().resuscitation.emergenceResidualBlockAssessment).toMatchObject({
      classification: 'residual', plan: 'defer-extubation-and-support',
    });

    const unsupported = new AnesthesiaEngine({
      scenario: SCENARIOS[0]!, seed: 1, practiceRegion: 'US',
    });
    unsupported.step();
    expect(act(unsupported, 'review-quantitative-monitor').events.at(-1)?.eventId)
      .toMatch(/^emergence-block-refused-/);
  });

  it('scores accepted engine events only, including unsafe and raw-action paths', () => {
    const expert = run([
      'review-quantitative-monitor', 'classify-residual', 'defer-extubation-and-support',
    ]);
    const unsafe = run([
      'review-quantitative-monitor', 'classify-recovered', 'proceed-to-extubation',
    ]);
    const score = (session: ReturnType<typeof run>) => objectiveFindings(
      SCENARIO, session.history as never, 0, 0, session.transcript, session.events,
    ).map((entry) => entry.outcome);
    expect(score(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(score(unsafe)).toEqual(['met', 'not-met', 'not-met', 'not-met']);

    const rawActions: LearnerAction[] = [
      { tick: 1, type: 'emergence-residual-block-assessment', payload: { action: 'review-quantitative-monitor' } },
      { tick: 2, type: 'emergence-residual-block-assessment', payload: { action: 'classify-residual' } },
      { tick: 3, type: 'emergence-residual-block-assessment', payload: { action: 'defer-extubation-and-support' } },
    ];
    expect(objectiveFindings(
      SCENARIO, expert.history as never, 0, 0, rawActions, [],
    ).map((entry) => entry.outcome)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
  });
});
