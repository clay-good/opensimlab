import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { DELAYED_EMERGENCE_DIFFERENTIAL as SCENARIO } from '@anesthesia/scenarios/delayed-emergence-differential';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

const ordered = [
  'review-support', 'review-exposure-and-block', 'check-metabolic-causes',
  'perform-focused-neurologic-exam', 'urgent-neurologic-evaluation',
] as const;

const engine = (scenario = SCENARIO) => new AnesthesiaEngine({
  scenario, seed: 824, practiceRegion: 'US',
});

function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({
    tick: subject.tick, type: 'delayed-emergence-assessment', payload: { action },
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
      tick: subject.tick, type: 'delayed-emergence-assessment', payload: { action },
    } satisfies LearnerAction;
    transcript.push(request);
    subject.apply(request);
    result = subject.step();
    events.push(...result.events);
    history.push({ tick: subject.tick, state: result.state, concentrations: [], attribution: [], alarms: [] });
  }
  return { result, transcript, events, history };
}

describe('Requirement: delayed emergence uses an ordered differential', () => {
  it('validates, registers, maps every objective, and starts with supported physiology', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(34);
    const subject = engine();
    expect(subject.step().state.trainOfFourRatio).toBeCloseTo(0.95, 6);
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

  it('accepts the ordered expert path and replays its fixed findings exactly', () => {
    const first = run(ordered);
    const replay = run(ordered);
    expect(first.events.find((entry) => entry.eventId.startsWith(
      'delayed-emergence-metabolic-reviewed-',
    ))?.data).toMatchObject({
      glucoseMgPerDl: 102, arterialCarbonDioxideMmHg: 41,
      sodiumMEqPerL: 139, temperatureC: 36.7,
    });
    expect(first.events.find((entry) => entry.eventId.startsWith(
      'delayed-emergence-neurologic-exam-',
    ))?.data).toMatchObject({
      rightArmResponse: 'absent', leftArmResponse: 'localizes',
      gazePreference: 'left', diagnosisEstablished: false,
    });
    expect(first.events.find((entry) => entry.eventId.startsWith(
      'delayed-emergence-escalation-urgent-',
    ))?.data).toMatchObject({
      escalation: 'urgent-neurologic-evaluation', airwayRemainedIntubated: true,
      ventilationRemainedDelivered: true,
    });
    expect(replay.result).toEqual(first.result);
    expect(replay.events).toEqual(first.events);
  });

  it('refuses out-of-order, duplicate, unsupported, and unknown requests', () => {
    const subject = engine();
    subject.step();
    expect(act(subject, 'check-metabolic-causes').events.at(-1)?.eventId)
      .toMatch(/^delayed-emergence-order-refused-/);
    act(subject, 'review-support');
    expect(act(subject, 'review-support').events.at(-1)?.eventId)
      .toMatch(/^delayed-emergence-support-refused-/);
    act(subject, 'review-exposure-and-block');
    act(subject, 'check-metabolic-causes');
    act(subject, 'perform-focused-neurologic-exam');
    act(subject, 'urgent-neurologic-evaluation');
    expect(act(subject, 'continue-routine-recovery').events.at(-1)?.eventId)
      .toMatch(/^delayed-emergence-escalation-refused-/);
    expect(act(subject, 'invented').events.at(-1)?.eventId)
      .toMatch(/^delayed-emergence-refused-/);
    expect(subject.equipment().resuscitation.delayedEmergenceAssessment).toMatchObject({
      escalation: 'urgent-neurologic-evaluation',
    });

    const unsupported = engine(SCENARIOS[0]!);
    unsupported.step();
    expect(act(unsupported, 'review-support').events.at(-1)?.eventId)
      .toMatch(/^delayed-emergence-refused-/);
  });

  it('scores accepted engine events only, including unsafe and raw-action paths', () => {
    const expert = run(ordered);
    const unsafe = run([...ordered.slice(0, 4), 'continue-routine-recovery']);
    const score = (session: ReturnType<typeof run>) => objectiveFindings(
      SCENARIO, session.history as never, 0, 0, session.transcript, session.events,
    ).map((entry) => entry.outcome);
    expect(score(expert)).toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(score(unsafe)).toEqual(['met', 'met', 'met', 'met', 'not-met']);

    const raw = ordered.map((action, tick) => ({
      tick, type: 'delayed-emergence-assessment', payload: { action },
    } satisfies LearnerAction));
    expect(objectiveFindings(
      SCENARIO, expert.history as never, 0, 0, raw, [],
    ).map((entry) => entry.outcome)).toEqual([
      'not-met', 'not-met', 'not-met', 'not-met', 'not-met',
    ]);
  });
});
