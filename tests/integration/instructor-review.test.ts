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
import type { LearnerAction } from '@platform/kernel/protocol';

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

describe('Requirement: Instructor Mode Without Surveillance', () => {
  it('Scenario: An exported session can be read back and analysed', () => {
    const transcript = competentSession();
    const text = JSON.stringify(transcript);
    const parsed = parseTranscript(text, 'student-a.json');
    const analysis = analyseTranscript(parsed, 'student-a.json');

    expect(analysis.scenarioTitle).toBe(ROUTINE_INDUCTION.metadata.title);
    expect(analysis.actionCount).toBe(transcript.actions.length);
    expect(analysis.simulatedMinutes).toBeCloseTo(7, 1);
    // Every objective the scenario declares is reported on.
    expect(analysis.findings.map((f) => f.objectiveId).sort())
      .toEqual(ROUTINE_INDUCTION.metadata.objectives.map((o) => o.id).sort());
  });

  it('Scenario: The findings are DERIVED, so a good session and a rushed one differ', () => {
    const good = analyseTranscript(competentSession(), 'good.json');
    const rushed = analyseTranscript(rushedSession(), 'rushed.json');

    const outcome = (a: typeof good, id: string) =>
      a.findings.find((f) => f.objectiveId === id)?.outcome;

    // The learner who preoxygenated is credited for it; the one who did not is not.
    expect(outcome(good, 'preoxygenate')).toBe('met');
    expect(outcome(rushed, 'preoxygenate')).toBe('not-met');
    // And the one who stacked a second bolus is told so.
    expect(outcome(rushed, 'hysteresis')).toBe('not-met');
    expect(outcome(good, 'hysteresis')).toBe('met');
  });

  it('Scenario: Nothing in the file is trusted — the numbers come from a replay', () => {
    const transcript = competentSession();
    // A file claiming a different story than its actions tell is analysed on its
    // ACTIONS. Editing the claim changes nothing.
    const doctored = { ...transcript, stateTraceHash: 'claims-everything-was-perfect' };
    const honest = analyseTranscript(transcript, 'a.json');
    const tampered = analyseTranscript(doctored as Transcript, 'b.json');
    expect(tampered.findings.map((f) => f.outcome)).toEqual(honest.findings.map((f) => f.outcome));
  });

  it('Scenario: An instructor reviews a class and sees where it is weak', () => {
    const cohort = [
      analyseTranscript(competentSession(1), 'a.json'),
      analyseTranscript(competentSession(2), 'b.json'),
      analyseTranscript(rushedSession(3), 'c.json'),
      analyseTranscript(rushedSession(4), 'd.json'),
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

  it('Scenario: A session from another scenario analyses against ITS objectives', () => {
    const transcript = runSession({
      scenario: RAPID_DESATURATION,
      seed: 7,
      seconds: 300,
      actions: [{ atSecond: 5, action: { type: 'ventilator', payload: { fio2: 1 } } }],
    });
    const analysis = analyseTranscript(parseTranscript(JSON.stringify(transcript), 'x.json'), 'x.json');
    expect(analysis.findings.map((f) => f.objectiveId).sort())
      .toEqual(RAPID_DESATURATION.metadata.objectives.map((o) => o.id).sort());
  });
});
