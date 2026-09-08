/**
 * Reference transcripts for the perioperative-anaphylaxis lesson, replayed
 * through the real engine and scored by the real debrief.
 *
 * The assertion this file exists for is a controlled substitution: the error and
 * recovery paths share an opening and differ in one action, a second vasopressor
 * against 50 micrograms of epinephrine. It is worth 7.3 mmHg of pressure nadir
 * and two objectives, and nothing else differs between them.
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
import { PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC as SCENARIO } from '@anesthesia/scenarios/perioperative-anaphylaxis-after-antibiotic';
import { HYPOTENSION_AFTER_INDUCTION } from '@anesthesia/scenarios/hypotension-after-induction';
import { PERIOPERATIVE_ANAPHYLAXIS_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/perioperative-anaphylaxis-fixtures';
import {
  PERIOPERATIVE_ANAPHYLAXIS_OBJECTIVES, supportsPerioperativeAnaphylaxis,
} from '../../src/modules/anesthesia/perioperative-anaphylaxis';
import { perioperativeAnaphylaxisCompletionEvidence } from '../../src/modules/anesthesia/perioperative-anaphylaxis-completion';

const EXPOSURE = 1800;

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
    epinephrineTotal: engine.equipment().resuscitation.epinephrineTotalMicrograms,
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const nadir = (result: ReturnType<typeof run>) => Math.min(...result.history
  .filter((sample) => sample.tick >= EXPOSURE)
  .map((sample) => sample.state.meanArterialMmHg ?? Infinity));

describe('Perioperative-anaphylaxis transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsPerioperativeAnaphylaxis(SCENARIO)).toBe(true);
    // The other lesson about a pressure that collapses for a mechanism reason.
    expect(supportsPerioperativeAnaphylaxis(HYPOTENSION_AFTER_INDUCTION)).toBe(false);
    expect(supportsPerioperativeAnaphylaxis({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.type !== 'anaphylaxis'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(perioperativeAnaphylaxisCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(perioperativeAnaphylaxisCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(perioperativeAnaphylaxisCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(perioperativeAnaphylaxisCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...PERIOPERATIVE_ANAPHYLAXIS_OBJECTIVES]);
    expect(supportsPerioperativeAnaphylaxis({
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

  it('differs from the recovery path in exactly one action', () => {
    const errored = FIXTURES.commonError;
    const recovered = FIXTURES.recovery;
    expect(errored).toHaveLength(recovered.length);
    const differing = errored.filter((action, index) =>
      JSON.stringify(action) !== JSON.stringify(recovered[index]));
    expect(differing).toHaveLength(1);
    expect(differing[0]!.type).toBe('vasopressor');
    expect(recovered.at(-1)!.type).toBe('epinephrine');
    expect(differing[0]!.tick).toBe(recovered.at(-1)!.tick);
  });

  it('meets every objective on the expert path', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(expert.epinephrineTotal).toBe(50);
    expect(expert.findings[0]!.finding).toContain('10 seconds after cefazolin exposure');
  });

  it('attributes seven millimetres of mercury to the drug, not the dose count', () => {
    // Everything else about these two runs is identical, so nothing else can be
    // credited with the difference.
    const errored = run(FIXTURES.commonError);
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(errored)).toEqual(['not-met', 'not-met', 'met', 'met']);
    expect(outcomes(recovered)).toEqual(['partly-met', 'partly-met', 'met', 'met']);
    expect(nadir(recovered) - nadir(errored)).toBeGreaterThan(5);
    expect(errored.epinephrineTotal).toBe(0);
    expect(recovered.epinephrineTotal).toBe(50);
  });

  it('credits volume on the error path, and claims nothing more for it', () => {
    // The objective asks whether volume was given, not whether the right drug
    // accompanied it. The evidence does not claim the error path resuscitated
    // well — it claims a litre went in inside the window, which it did.
    const errored = run(FIXTURES.commonError);
    expect(errored.findings[2]!.outcome).toBe('met');
    expect(errored.findings[2]!.finding).toContain('1000 mL');
  });

  it('lets a setting made before the exposure earn an objective', () => {
    // support-anaphylaxis-oxygenation is met on the error path entirely by a
    // ventilator setting at tick 120, before the exposure existed. The measure
    // explicitly counts settings established beforehand.
    const errored = run(FIXTURES.commonError);
    expect(errored.findings[3]!.outcome).toBe('met');
    expect(FIXTURES.commonError[0]!.tick).toBeLessThan(EXPOSURE);
    expect(SCENARIO.metadata.objectives[3]!.measure).toContain('before or after exposure');
  });

  it('leaves the oxygenation objective partly met when nothing is prepared', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'partly-met']);
    expect(idle.findings[3]!.finding).toContain('21%');
  });
});
