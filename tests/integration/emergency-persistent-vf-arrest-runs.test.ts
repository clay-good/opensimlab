/**
 * Reference transcripts for the emergency persistent-VF lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that the conversion has three
 * conditions and needs all of them. A shock missing any one is delivered and
 * does nothing, which is what makes both wrong paths here shocks that were
 * given rather than shocks that were withheld.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent } from '@platform/kernel/protocol';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import { PERSISTENT_VF_ARREST as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/persistent-vf-arrest';
import { PEA_ARREST } from '../../src/modules/emergency-medicine/scenarios/pea-arrest';
import { PERSISTENT_VF_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/persistent-vf-arrest-fixtures';
import {
  PERSISTENT_VF_ACTIONS, PERSISTENT_VF_DISPATCH, PERSISTENT_VF_OBJECTIVES,
  supportsPersistentVfArrest, type PersistentVfAction,
} from '../../src/modules/emergency-medicine/persistent-vf-arrest';
import { persistentVfArrestCompletionEvidence } from '../../src/modules/emergency-medicine/persistent-vf-arrest-completion';
import { persistentVfInlinePrompt } from '../../src/modules/emergency-medicine/tutor/persistent-vf-arrest-guidance';

type Choices = readonly (readonly [number, PersistentVfAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(
  SCENARIO, [{ tick: 1, state: {}, concentrations: [] }] as never, 0, 0, [], events,
);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) {
      engine.apply({ tick, ...PERSISTENT_VF_DISPATCH[actions[next]![1]] }); next += 1;
    }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must not change what the engine publishes.
    const before = JSON.stringify(frame.equipment.resuscitation);
    const prompt = persistentVfInlinePrompt(level, {
      scenarioVersion: SCENARIO.metadata.version, patient: frame.equipment.resuscitation,
    });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation };
}

describe('Emergency persistent VF transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(PERSISTENT_VF_ACTIONS).toHaveLength(4);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(SCENARIO.timeline).toHaveLength(3);
    expect(supportsPersistentVfArrest(SCENARIO)).toBe(true);
    // The sibling arrest lesson shares every control and must not be read as this one.
    expect(supportsPersistentVfArrest(PEA_ARREST)).toBe(false);
    expect(supportsPersistentVfArrest({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'ventricular-fibrillation'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(persistentVfArrestCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(persistentVfArrestCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(persistentVfArrestCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(persistentVfArrestCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...PERSISTENT_VF_OBJECTIVES]);
    expect([...PERSISTENT_VF_OBJECTIVES]).not.toEqual([...PERSISTENT_VF_ACTIONS]);
    expect(supportsPersistentVfArrest({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: PERSISTENT_VF_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: PERSISTENT_VF_ACTIONS[index]!,
        })),
      },
    })).toBe(false);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across guidance levels and regions', (path) => {
    const actions: Choices = FIXTURES[path];
    const until = (actions.at(-1)?.[0] ?? 0) + 2;
    const reference = run(actions, until);
    for (const level of ['guided', 'coached'] as const) {
      expect(run(actions, until, level).hash).toBe(reference.hash);
    }
    expect(run(actions, until, 'unassisted', 'GB').hash).toBe(reference.hash);
  });

  it('meets every objective on the expert path and none of the first three with no action', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(findings(expert.events).map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met']);
    expect(expert.patient).toMatchObject({
      cardiacArrestActive: false, arrestEpinephrineTotalMg: 1,
      defibrillationShockCount: 1, lastDefibrillationEnergyJ: 200,
    });
    expect(expert.patient.roscAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    // The fourth objective is scored on a thing not done, so idling meets it.
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'met']);
    expect(idle.patient.roscAtTick).toBeNull();
  });

  it('delivers the under-energy shock and does not convert on it', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      defibrillationShockCount: 1, lastDefibrillationEnergyJ: 120, roscAtTick: null,
      cardiacArrestActive: true,
    });
    // Everything else in the cycle was right; the one wrong choice is the setting.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'partly-met', 'met']);
    expect(JSON.stringify(errored.events))
      .toContain('the case requires recent preceding compressions, accepted 1 mg IV/IO epinephrine, and the declared 200 J device setting');
  });

  it('delivers the declared shock before the dose, fails, and converts on the identical repeat', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.defibrillationShockCount).toBe(2);
    expect(recovered.patient.roscAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met']);
    const shocks = recovered.events.filter((event) => event.eventId.startsWith('defibrillation-'));
    expect(shocks.map((event) => event.data?.converted)).toEqual([false, true]);
    expect(shocks.map((event) => event.data?.energyJ)).toEqual([200, 200]);
  });

  it('does not convert when compressions have been paused past the ten-second window', () => {
    const engine = create(); engine.step();
    engine.apply({ tick: engine.tick, ...PERSISTENT_VF_DISPATCH['start-compressions'] });
    engine.step();
    engine.apply({ tick: engine.tick, ...PERSISTENT_VF_DISPATCH['give-one-milligram-epinephrine'] });
    engine.step();
    engine.apply({ tick: engine.tick, type: 'chest-compressions', payload: { active: false } });
    for (let tick = 0; tick <= 11 * TICKS_PER_SECOND; tick += 1) engine.step();
    engine.apply({ tick: engine.tick, ...PERSISTENT_VF_DISPATCH['deliver-declared-shock'] });
    const frame = engine.step();
    expect(frame.equipment.resuscitation).toMatchObject({
      defibrillationShockCount: 1, lastDefibrillationEnergyJ: 200, roscAtTick: null,
    });
  });
});
