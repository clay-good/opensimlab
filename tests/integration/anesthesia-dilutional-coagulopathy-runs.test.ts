/**
 * Reference transcripts for the dilutional-coagulopathy lesson, replayed through
 * the real engine and scored by the real debrief.
 *
 * The assertion this file exists for is that the lesson's argument is enforced
 * rather than merely scored. Plasma is refused outright until a coagulation
 * panel has been reported, so a learner who reaches for it on the strength of
 * the oozing gets a refusal — and the seventy seconds that refusal costs are
 * what fails the first objective on both of the paths that make the mistake.
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
import { DILUTIONAL_COAGULOPATHY as SCENARIO } from '@anesthesia/scenarios/dilutional-coagulopathy';
import { UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE } from '@anesthesia/scenarios/unexpected-intraoperative-hemorrhage';
import { DILUTIONAL_COAGULOPATHY_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/dilutional-coagulopathy-fixtures';
import {
  DILUTIONAL_COAGULOPATHY_OBJECTIVES, supportsDilutionalCoagulopathy,
} from '../../src/modules/anesthesia/dilutional-coagulopathy';
import { dilutionalCoagulopathyCompletionEvidence } from '../../src/modules/anesthesia/dilutional-coagulopathy-completion';

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
    plasmaUnits: engine.equipment().resuscitation.freshFrozenPlasmaUnits ?? 0,
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const events = (result: ReturnType<typeof run>, prefix: string) =>
  result.events.filter((event) => event.eventId.startsWith(prefix));

describe('Dilutional-coagulopathy transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(3);
    expect(supportsDilutionalCoagulopathy(SCENARIO)).toBe(true);
    // The lesson this one is the sequel to shares the blood-bank workflow.
    expect(supportsDilutionalCoagulopathy(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE)).toBe(false);
    expect(supportsDilutionalCoagulopathy({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.id !== 'diffuse-oozing'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(dilutionalCoagulopathyCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(dilutionalCoagulopathyCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(dilutionalCoagulopathyCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(dilutionalCoagulopathyCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...DILUTIONAL_COAGULOPATHY_OBJECTIVES]);
    expect(supportsDilutionalCoagulopathy({
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
    expect(outcomes(expert)).toEqual(['met', 'met', 'met']);
    expect(events(expert, 'bad-')).toHaveLength(0);
    expect(events(expert, 'coagulation-labs-')).toHaveLength(2);
    expect(expert.plasmaUnits).toBe(4);
  });

  it('enforces the argument rather than only scoring it', () => {
    // This is what the lesson is for. Reaching for plasma on the strength of the
    // oozing is refused by the engine, not merely marked down afterwards.
    const errored = run(FIXTURES.commonError);
    const refusal = events(errored, 'bad-blood-product-')[0];
    expect(refusal).toBeDefined();
    expect(refusal!.tick).toBe(700);
    expect(refusal!.message).toContain('coagulation panel');
    // And the refusal is a refusal: no plasma reached the patient at that point.
    const beforePanel = events(errored, 'blood-product-')
      .filter((event) => event.tick < 1300);
    expect(beforePanel).toHaveLength(0);
  });

  it('costs the seventy seconds the first objective is counting', () => {
    const errored = run(FIXTURES.commonError);
    const recovered = run(FIXTURES.recovery);
    const identify = errored.findings[0]!;
    expect(identify.outcome).toBe('partly-met');
    expect(identify.finding).toContain('70 seconds');
    // Unrecoverable, and identical on both paths that make the mistake.
    expect(recovered.findings[0]!.outcome).toBe('partly-met');
    expect(recovered.findings[0]!.finding).toBe(identify.finding);
  });

  it('differs from the recovery path in exactly one action', () => {
    const errored = FIXTURES.commonError;
    const recovered = FIXTURES.recovery;
    expect(recovered).toHaveLength(errored.length + 1);
    expect(recovered.slice(0, errored.length)).toEqual(errored);
    expect(recovered.at(-1)!.type).toBe('coagulation-labs');
    // And that single action is the whole of the third objective.
    expect(outcomes(run(errored))).toEqual(['partly-met', 'met', 'not-met']);
    expect(outcomes(run(recovered))).toEqual(['partly-met', 'met', 'met']);
  });

  it('credits the error path for a panel-guided product, and says nothing more', () => {
    // By the time it gives plasma it does have an abnormal panel. The objective
    // asks whether the lab guided the product, not whether the learner reached
    // for it first, and the evidence does not claim the error path was careful.
    const errored = run(FIXTURES.commonError);
    expect(errored.findings[1]!.outcome).toBe('met');
    expect(errored.plasmaUnits).toBe(4);
  });

  it('distinguishes a step skipped from a step never reached', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-exercised']);
    expect(idle.findings[2]!.finding).toContain('No accepted plasma response');
  });

  it('refuses a panel when no modeled bleeding is running', () => {
    // The bound is mechanical, not decorative: every action in this lesson
    // requires active modelled haemorrhage.
    const engine = new AnesthesiaEngine({
      scenario: {
        ...SCENARIO,
        timeline: SCENARIO.timeline.filter((event) => event.type !== 'blood-loss'),
      },
      seed: FIXTURES.seed,
      practiceRegion: 'US',
    });
    engine.step();
    engine.apply({ tick: 1, type: 'coagulation-labs', payload: {} });
    const frame = engine.step();
    expect(frame.events.some((event) => event.eventId.startsWith('bad-coagulation-labs-'))).toBe(true);
  });
});
