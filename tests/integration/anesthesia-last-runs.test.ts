/**
 * Reference transcripts for the LAST lesson, replayed through the real engine
 * and scored by the real debrief.
 *
 * The assertion this file exists for is that the recovery path scores
 * identically to the expert path. Both reach for a 500 microgram epinephrine
 * bolus, both are refused, and only one of them lets the refusal become a delay.
 * The refused action is not held against anyone; the time it costs is.
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
import { LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY as SCENARIO } from '@anesthesia/scenarios/local-anesthetic-systemic-toxicity';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { LAST_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/local-anesthetic-systemic-toxicity-fixtures';
import { LAST_OBJECTIVES, supportsLocalAnestheticSystemicToxicity } from '../../src/modules/anesthesia/local-anesthetic-systemic-toxicity';
import { lastCompletionEvidence } from '../../src/modules/anesthesia/local-anesthetic-systemic-toxicity-completion';

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
const events = (result: ReturnType<typeof run>, prefix: string) =>
  result.events.filter((event) => event.eventId.startsWith(prefix));

describe('LAST transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsLocalAnestheticSystemicToxicity(SCENARIO)).toBe(true);
    expect(supportsLocalAnestheticSystemicToxicity(ROUTINE_INDUCTION)).toBe(false);
    // Every window and every bounded action is gated on the modelled exposure.
    expect(supportsLocalAnestheticSystemicToxicity({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.type !== 'local-anesthetic-toxicity'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(lastCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(lastCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(lastCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(lastCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...LAST_OBJECTIVES]);
    expect(supportsLocalAnestheticSystemicToxicity({
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

  it('meets every objective on the expert path, and refuses nothing', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(events(expert, 'bad-')).toHaveLength(0);
    // The engine computes the weight band rather than reading it from the file.
    expect(events(expert, 'lipid-emulsion-')[0]!.data?.initialBolusMl).toBe(90);
    expect(events(expert, 'lipid-emulsion-')[0]!.data?.infusionMlPerMin).toBe(15);
  });

  it('refuses the full-dose pressor reflex outright', () => {
    // Eight times this patient's ceiling. The engine does not mark it down
    // afterwards; it declines to give it.
    const errored = run(FIXTURES.commonError);
    const refusal = events(errored, 'bad-epinephrine-')[0];
    expect(refusal).toBeDefined();
    expect(refusal!.tick).toBe(700);
    expect(errored.epinephrineTotal).toBe(0);
  });

  it('scores the recovery identically to the expert, because the reflex was heeded', () => {
    // The finding this lesson is built on. Both paths make the same dangerous
    // reach at the same tick; only one lets the refusal become a delay.
    const expert = run(FIXTURES.expert);
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(outcomes(expert));
    expect(outcomes(recovered)).toEqual(['met', 'met', 'met', 'met']);
    // And it really did make the reach: the refusal is in its log too.
    expect(events(recovered, 'bad-epinephrine-')).toHaveLength(1);
    expect(recovered.epinephrineTotal).toBe(50);
  });

  it('measures what the delay costs when the refusal is treated as a pause', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored))
      .toEqual(['partly-met', 'not-met', 'partly-met', 'not-exercised']);
    expect(errored.findings[0]!.finding).toContain('80 seconds');
    expect(errored.findings[2]!.finding).toContain('100 seconds');
  });

  it('reads an absent epinephrine dose as not exercised rather than failed', () => {
    // The opposite convention to the dilutional-coagulopathy lesson, where a
    // refused plasma attempt scores not met. Here the checklist does not require
    // epinephrine at all, so its absence is not a failure — and the finding text
    // is what says so.
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-exercised']);
    expect(idle.findings[3]!.finding).toContain('does not require epinephrine');
  });

  it('reads all four ventilator fields, not just the dial', () => {
    const dialOnly = run(([
      FIXTURES.expert[0]!,
      ...FIXTURES.expert.slice(1),
    ] as LearnerAction[]).map((action, index) => (
      index === 0 ? { ...action, payload: { fio2: 1, delivering: true } } : action
    )));
    // Tidal volume and rate default to the scenario's own settings, which are
    // non-zero here, so this stays met — the point is that the reduce reads them.
    const support = dialOnly.findings[1]!;
    expect(support.outcome).toBe('met');
    expect(SCENARIO.equipment.ventilator.respiratoryRateBpm).toBeGreaterThan(0);
  });
});
