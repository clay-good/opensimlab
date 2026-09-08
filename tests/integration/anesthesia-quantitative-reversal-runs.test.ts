/**
 * Reference transcripts for the quantitative-reversal lesson, replayed through
 * the real engine and scored by the real debrief.
 *
 * The assertion this file exists for is that the post-tetanic count reads the
 * same on both limbs of the block. A reversal given on a count of 1 at tick
 * 1,000 is refused; the identical dose on the identical count at tick 3,700 is
 * accepted. Nothing on the monitor distinguishes them.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { promptFor } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { QUANTITATIVE_NEUROMUSCULAR_REVERSAL as SCENARIO } from '@anesthesia/scenarios/quantitative-neuromuscular-reversal';
import { RAPID_SEQUENCE_INDUCTION } from '@anesthesia/scenarios/rapid-sequence-induction';
import { QUANTITATIVE_REVERSAL_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/quantitative-neuromuscular-reversal-fixtures';
import {
  QUANTITATIVE_REVERSAL_OBJECTIVES, supportsQuantitativeNeuromuscularReversal,
} from '../../src/modules/anesthesia/quantitative-neuromuscular-reversal';
import { quantitativeReversalCompletionEvidence } from '../../src/modules/anesthesia/quantitative-neuromuscular-reversal-completion';

function run(
  actions: readonly LearnerAction[],
  level: GuidanceLevel = 'unassisted',
  region: 'US' | 'GB' = 'US',
) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
  const hash = createHash('sha256');
  const history: HistorySample[] = [];
  const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= FIXTURES.ticks; tick += 1) {
    while (actions[next]?.tick === tick) { engine.apply(actions[next]!); next += 1; }
    const frame = engine.step();
    hash.update(JSON.stringify(frame));
    history.push({ tick: frame.tick, state: frame.state, concentrations: frame.concentrations } as HistorySample);
    events.push(...frame.events);
    const prompt = promptFor(level, {
      scenarioId: SCENARIO.metadata.id, scenarioVersion: SCENARIO.metadata.version,
      tick, state: frame.state as Readonly<Record<string, number>>,
      actions: actions.slice(0, next), ventilating: false, alarmCount: 0,
    }, new Map());
    if (level === 'unassisted') expect(prompt).toBeNull();
  }
  expect(next).toBe(actions.length);
  return {
    hash: hash.digest('hex'), history, events,
    findings: objectiveFindings(
      SCENARIO, history, 0, engine.equipment().preoxygenationSeconds, actions, events,
    ),
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const events = (result: ReturnType<typeof run>, prefix: string) =>
  result.events.filter((event) => event.eventId.startsWith(prefix));

describe('Quantitative-reversal transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsQuantitativeNeuromuscularReversal(SCENARIO)).toBe(true);
    // The lesson that reverses a block as its last objective, not its only one.
    expect(supportsQuantitativeNeuromuscularReversal(RAPID_SEQUENCE_INDUCTION)).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(quantitativeReversalCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(quantitativeReversalCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(quantitativeReversalCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(quantitativeReversalCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...QUANTITATIVE_REVERSAL_OBJECTIVES]);
    expect(supportsQuantitativeNeuromuscularReversal({
      ...SCENARIO,
      metadata: { ...SCENARIO.metadata, objectives: [...SCENARIO.metadata.objectives].reverse() },
    })).toBe(false);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across guidance levels and regions', (path) => {
    const actions = FIXTURES[path];
    const reference = run(actions);
    for (const level of ['guided', 'coached'] as const) {
      expect(run(actions, level).hash).toBe(reference.hash);
    }
    expect(run(actions, 'unassisted', 'GB').hash).toBe(reference.hash);
  });

  it('reads the same post-tetanic count on both limbs of the block', () => {
    // The trap this lesson is built on. The count is 1 while the block deepens
    // and 1 again while it wears off, and the monitor shows nothing else.
    // Read from the path whose reversal was REFUSED, so the block is untouched
    // at both ticks. The expert path reverses at 3,700, and its sample there
    // already shows the count back at 4.
    const trace = run(FIXTURES.commonError).history;
    const ascending = trace.find((sample) => sample.tick === 1000)!;
    const receding = trace.find((sample) => sample.tick === 3700)!;
    expect(ascending.state.trainOfFourCount).toBe(0);
    expect(receding.state.trainOfFourCount).toBe(0);
    expect(ascending.state.trainOfFourRatio).toBe(receding.state.trainOfFourRatio);
  });

  it('meets every objective on the expert path, and refuses nothing', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(events(expert, 'bad-')).toHaveLength(0);
    expect(expert.findings[1]!.finding).toContain('post-tetanic count 1');
  });

  it('refuses the identical dose given two and a half minutes earlier', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['met', 'not-met', 'not-met', 'met']);
    expect(events(errored, 'bad-sugammadex-')).toHaveLength(1);
    expect(events(errored, 'bad-sugammadex-')[0]!.tick).toBe(1000);
    expect(events(errored, 'sugammadex-')).toHaveLength(0);
  });

  it('scores the recovery identically to the expert, because the refusal was heeded', () => {
    const expert = run(FIXTURES.expert);
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(outcomes(expert));
    expect(outcomes(recovered)).toEqual(['met', 'met', 'met', 'met']);
    // And it really did make the wrong-limb attempt first.
    expect(events(recovered, 'bad-sugammadex-')).toHaveLength(1);
    expect(FIXTURES.recovery.slice(0, FIXTURES.commonError.length))
      .toEqual([...FIXTURES.commonError]);
  });

  it('cannot say WHY a reversal was refused', () => {
    // A real limit of the feedback, named rather than implied. Reversing on the
    // ascending limb and picking 2 mg/kg with no twitches are different
    // mistakes, and they produce the same finding and the same engine message.
    const wrongLimb = run(FIXTURES.commonError);
    const wrongDose = run([
      FIXTURES.expert[0]!,
      { tick: 3700, type: 'neuromuscular-reversal', payload: { agent: 'sugammadex', route: 'iv', doseMgPerKg: 2 } },
    ] as LearnerAction[]);
    expect(wrongDose.findings[1]!.outcome).toBe('not-met');
    expect(wrongDose.findings[1]!.finding).toBe(wrongLimb.findings[1]!.finding);
    expect(events(wrongDose, 'bad-sugammadex-')[0]!.message)
      .toBe(events(wrongLimb, 'bad-sugammadex-')[0]!.message);
  });

  it('exercises nothing without an accepted blocking dose', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    for (const finding of idle.findings) {
      expect(finding.finding).toContain('No accepted rocuronium dose');
    }
  });
});
