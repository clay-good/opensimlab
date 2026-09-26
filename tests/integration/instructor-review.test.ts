/**
 * Acceptance tests for learning/curriculum → Instructor Mode Without Surveillance.
 *
 * The whole hand-in path, end to end: a learner runs a session, exports it, and
 * an instructor's browser turns that file back into findings by REPLAYING the
 * engine over the recorded inputs. Nothing is read out of the file except what
 * the learner did.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { RAPID_DESATURATION } from '@anesthesia/scenarios/rapid-desaturation';
import { TranscriptRecorder, type Transcript } from '@platform/transcript/transcript';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import {
  UnreadableTranscript, analyseTranscript, parseTranscript, summariseCohort,
} from '@anesthesia/debrief/analyse-transcript';
import { replayWithEvents } from '@anesthesia/debrief/replay-engine';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { POSTOPERATIVE_HANDOFF } from '@anesthesia/scenarios/postoperative-handoff';
import { ASPIRATION_RISK_RECOGNITION } from '@anesthesia/scenarios/aspiration-risk-recognition';
import { RAPID_SEQUENCE_INDUCTION } from '@anesthesia/scenarios/rapid-sequence-induction';
import { BRONCHOSPASM } from '@anesthesia/scenarios/bronchospasm';
import { POSTOPERATIVE_HANDOFF_FIXTURES } from '../../src/modules/anesthesia/postoperative-handoff-fixtures';
import { ASPIRATION_RISK_FIXTURES } from '../../src/modules/anesthesia/aspiration-risk-recognition-fixtures';
import { RAPID_SEQUENCE_INDUCTION_FIXTURES } from '../../src/modules/anesthesia/rapid-sequence-induction-fixtures';
import { BRONCHOSPASM_FIXTURES } from '../../src/modules/anesthesia/bronchospasm-fixtures';

const VERSIONS = { engine: 'test', content: '0.1.0', modelSet: 'test', scenario: '0.1.0' };

/**
 * Run a session the way the application does — engine and recorder fed the same
 * actions at the same ticks — and export what the learner would export.
 */
function runSession(options: {
  scenario: typeof ROUTINE_INDUCTION;
  seed: number;
  actions: readonly { atSecond: number; action: Omit<LearnerAction, 'tick'> }[];
  seconds: number;
}): Transcript {
  const engine = new AnesthesiaEngine({
    scenario: options.scenario as never, seed: options.seed, practiceRegion: 'US',
  });
  const recorder = new TranscriptRecorder({
    moduleId: 'anesthesia',
    scenarioId: options.scenario.metadata.id,
    versions: VERSIONS,
    practiceRegion: 'US',
    seed: options.seed,
    guidanceLevel: 'coached',
  });
  const pending = [...options.actions].sort((a, b) => a.atSecond - b.atSecond);
  let next = 0;
  const totalTicks = options.seconds * TICKS_PER_SECOND;
  for (let tick = 0; tick < totalTicks; tick += 1) {
    while (next < pending.length && pending[next]!.atSecond * TICKS_PER_SECOND <= tick) {
      const full: LearnerAction = { ...pending[next]!.action, tick };
      engine.apply(full);
      recorder.record(full);
      next += 1;
    }
    engine.step();
  }
  recorder.setTicks(totalTicks);
  return recorder.build('unchecked');
}

/** A learner who preoxygenates properly and induces sensibly. */
function competentSession(seed = 20260819): Transcript {
  return runSession({
    scenario: ROUTINE_INDUCTION,
    seed,
    seconds: 420,
    actions: [
      { atSecond: 5, action: { type: 'ventilator', payload: { fio2: 1 } } },
      { atSecond: 240, action: { type: 'bolus', payload: { drugId: 'remifentanil', amount: 50, unit: 'µg' } } },
      { atSecond: 245, action: { type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' } } },
      { atSecond: 300, action: { type: 'laryngoscopy', payload: { technique: 'video' } } },
      { atSecond: 305, action: { type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } } },
    ],
  });
}

/** A learner who inducts on room air and never preoxygenates. */
function rushedSession(seed = 991): Transcript {
  return runSession({
    scenario: ROUTINE_INDUCTION,
    seed,
    seconds: 420,
    actions: [
      { atSecond: 5, action: { type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' } } },
      { atSecond: 40, action: { type: 'bolus', payload: { drugId: 'propofol', amount: 50, unit: 'mg' } } },
      { atSecond: 300, action: { type: 'laryngoscopy', payload: { technique: 'direct' } } },
    ],
  });
}

/**
 * The application reaches the engine through the solver worker; these tests run in
 * Node, where there is none, so they hand `analyseTranscript` the same replay the
 * worker itself runs. What is under test is the derivation, not the transport.
 */
const runReplay = (actions: Parameters<typeof replayWithEvents>[0], options: Parameters<typeof replayWithEvents>[1]) =>
  Promise.resolve(replayWithEvents(actions, options));

describe('Requirement: Instructor Mode Without Surveillance', () => {
  it('Scenario: An exported session can be read back and analysed', async () => {
    const transcript = competentSession();
    const text = JSON.stringify(transcript);
    const parsed = parseTranscript(text, 'student-a.json');
    const analysis = await analyseTranscript(parsed, 'student-a.json', runReplay);

    expect(analysis.scenarioTitle).toBe(ROUTINE_INDUCTION.metadata.title);
    expect(analysis.actionCount).toBe(transcript.actions.length);
    expect(analysis.simulatedMinutes).toBeCloseTo(7, 1);
    // Every objective the scenario declares is reported on.
    expect(analysis.findings.map((f) => f.objectiveId).sort())
      .toEqual(ROUTINE_INDUCTION.metadata.objectives.map((o) => o.id).sort());
  });

  it('Scenario: The findings are DERIVED, so a good session and a rushed one differ', async () => {
    const good = await analyseTranscript(competentSession(), 'good.json', runReplay);
    const rushed = await analyseTranscript(rushedSession(), 'rushed.json', runReplay);

    const outcome = (a: typeof good, id: string) =>
      a.findings.find((f) => f.objectiveId === id)?.outcome;

    // The learner who preoxygenated is credited for it; the one who did not is not.
    expect(outcome(good, 'preoxygenate')).toBe('met');
    expect(outcome(rushed, 'preoxygenate')).toBe('not-met');
    // And the one who stacked a second bolus is told so.
    expect(outcome(rushed, 'hysteresis')).toBe('not-met');
    expect(outcome(good, 'hysteresis')).toBe('met');
  });

  it('Scenario: Nothing in the file is trusted — the numbers come from a replay', async () => {
    const transcript = competentSession();
    // A file claiming a different story than its actions tell is analysed on its
    // ACTIONS. Editing the claim changes nothing.
    const doctored = { ...transcript, stateTraceHash: 'claims-everything-was-perfect' };
    const honest = await analyseTranscript(transcript, 'a.json', runReplay);
    const tampered = await analyseTranscript(doctored as Transcript, 'b.json', runReplay);
    expect(tampered.findings.map((f) => f.outcome)).toEqual(honest.findings.map((f) => f.outcome));
  });

  it('Scenario: An instructor reviews a class and sees where it is weak', async () => {
    const cohort = [
      await analyseTranscript(competentSession(1), 'a.json', runReplay),
      await analyseTranscript(competentSession(2), 'b.json', runReplay),
      await analyseTranscript(rushedSession(3), 'c.json', runReplay),
      await analyseTranscript(rushedSession(4), 'd.json', runReplay),
    ];
    const summary = summariseCohort(cohort);

    expect(summary.length).toBe(ROUTINE_INDUCTION.metadata.objectives.length);
    for (const row of summary) expect(row.total).toBe(4);
    // Weakest first, so the objective worth the next teaching hour is at the top.
    const rates = summary.map((row) => row.met / row.total);
    expect([...rates].sort((a, b) => a - b)).toEqual(rates);
    // And it counts sessions, never ranks learners: no per-learner field exists.
    expect(Object.keys(summary[0]!)).not.toContain('label');
  });

  it('Scenario: A file that is not a transcript is refused in plain language', () => {
    expect(() => parseTranscript('not json at all', 'notes.txt'))
      .toThrow(UnreadableTranscript);
    expect(() => parseTranscript(JSON.stringify({ hello: 'world' }), 'other.json'))
      .toThrow(/not an Open Sim Lab transcript/);
    // A transcript for a scenario this build does not have says so, and says why.
    const unknown = { ...competentSession(), scenarioId: 'a-scenario-from-the-future' };
    expect(() => parseTranscript(JSON.stringify(unknown), 'future.json'))
      .toThrow(/different version/);
  });

  it('Scenario: A session from another scenario analyses against ITS objectives', async () => {
    const transcript = runSession({
      scenario: RAPID_DESATURATION,
      seed: 7,
      seconds: 300,
      actions: [{ atSecond: 5, action: { type: 'ventilator', payload: { fio2: 1 } } }],
    });
    const analysis = await analyseTranscript(parseTranscript(JSON.stringify(transcript), 'x.json'), 'x.json', runReplay);
    expect(analysis.findings.map((f) => f.objectiveId).sort())
      .toEqual(RAPID_DESATURATION.metadata.objectives.map((o) => o.id).sort());
  });
});

describe('Requirement: the instructor sees the same findings the learner saw', () => {
  // The review page once replayed only the sampled history and dropped the engine's
  // events, so every objective scored from a recorded or refused step read as not
  // met. An expert handoff transcript showed four failures to its instructor.
  it.each([
    ['postoperative-handoff', POSTOPERATIVE_HANDOFF, POSTOPERATIVE_HANDOFF_FIXTURES],
    ['aspiration-risk-recognition', ASPIRATION_RISK_RECOGNITION, ASPIRATION_RISK_FIXTURES],
    ['rapid-sequence-induction', RAPID_SEQUENCE_INDUCTION, RAPID_SEQUENCE_INDUCTION_FIXTURES],
    ['bronchospasm', BRONCHOSPASM, BRONCHOSPASM_FIXTURES],
  ] as const)('scores the %s expert transcript exactly as the debrief does', async (_id, scenario, fixtures) => {
    const engine = new AnesthesiaEngine({ scenario, seed: fixtures.seed, practiceRegion: 'US' });
    const history: HistorySample[] = [];
    const events: EngineEvent[] = [];
    let next = 0;
    for (let tick = 0; tick <= fixtures.ticks; tick += 1) {
      while (fixtures.expert[next]?.tick === tick) { engine.apply(fixtures.expert[next]!); next += 1; }
      const frame = engine.step();
      history.push({ tick: frame.tick, state: frame.state, concentrations: frame.concentrations } as HistorySample);
      events.push(...frame.events);
    }
    const learner = objectiveFindings(scenario, history, 0, 0, fixtures.expert, events).map((f) => f.outcome);
    const transcript = {
      format: 'opensimlab.transcript', scenarioId: scenario.metadata.id, moduleId: 'anesthesia',
      seed: fixtures.seed, practiceRegion: 'US', ticks: fixtures.ticks, actions: fixtures.expert,
    } as unknown as Transcript;
    const instructor = (await analyseTranscript(transcript, 'expert.json', runReplay)).findings.map((f) => f.outcome);
    expect(learner.every((outcome) => outcome === 'met')).toBe(true);
    expect(instructor).toEqual(learner);
  });
});
