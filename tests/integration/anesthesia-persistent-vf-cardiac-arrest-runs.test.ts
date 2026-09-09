/**
 * Reference transcripts for the anaesthesia persistent-VF lesson, replayed
 * through the real engine and scored by the real debrief.
 *
 * Two assertions. The conversion is CONJUNCTIVE — 200 J exactly, epinephrine
 * given, compressions recently running — and dropping any one leaves the shock
 * delivered, counted and inert. And the fourth objective CANNOT BE FAILED: this
 * scenario contains no non-shockable rhythm to wrongly shock.
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
import { PERSISTENT_VF_CARDIAC_ARREST as SCENARIO } from '@anesthesia/scenarios/persistent-vf-cardiac-arrest';
import { PERSISTENT_VF_CARDIAC_ARREST_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/persistent-vf-cardiac-arrest-fixtures';
import {
  PERSISTENT_VF_CARDIAC_ARREST_OBJECTIVES, supportsPersistentVfCardiacArrest,
} from '../../src/modules/anesthesia/persistent-vf-cardiac-arrest';
import { persistentVfCardiacArrestCompletionEvidence } from '../../src/modules/anesthesia/persistent-vf-cardiac-arrest-completion';

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
    hash: hash.digest('hex'), history, events, engine,
    resuscitation: engine.equipment().resuscitation,
    findings: objectiveFindings(
      SCENARIO, history, 0, engine.equipment().preoxygenationSeconds, actions, events,
    ),
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);

const COMPRESSIONS = (tick: number, active = true): LearnerAction =>
  ({ tick, type: 'chest-compressions', payload: { active } });
const EPINEPHRINE = (tick: number): LearnerAction =>
  ({ tick, type: 'cardiac-arrest-epinephrine', payload: { doseMg: 1, route: 'iv' } });
const SHOCK = (tick: number, energyJ = 200): LearnerAction =>
  ({ tick, type: 'defibrillation', payload: { waveform: 'biphasic', energyJ } });

describe('Persistent-VF cardiac-arrest transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsPersistentVfCardiacArrest(SCENARIO)).toBe(true);
    // Emergency medicine's lesson of the same shape carries a different id.
    expect(supportsPersistentVfCardiacArrest({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'persistent-vf-arrest' },
    })).toBe(false);
    expect(supportsPersistentVfCardiacArrest({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(persistentVfCardiacArrestCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(persistentVfCardiacArrestCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(persistentVfCardiacArrestCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(persistentVfCardiacArrestCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...PERSISTENT_VF_CARDIAC_ARREST_OBJECTIVES]);
    expect(supportsPersistentVfCardiacArrest({
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

  it('meets every objective on the expert path and converts', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(expert.findings[0]!.finding).toContain('10 seconds after VF appeared');
    expect(expert.findings[2]!.finding).toContain('converted the bounded teaching case');
    expect(expert.resuscitation.roscAtTick).toBe(900);
    expect(expert.resuscitation.defibrillationShockCount).toBe(1);
  });

  it('delivers a correct-energy shock that does not convert without the drug', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['met', 'not-met', 'partly-met', 'met']);
    expect(errored.findings[2]!.finding).toContain('did not meet the declared conversion conditions');
    expect(errored.resuscitation.defibrillationShockCount).toBe(1);
    expect(errored.resuscitation.roscAtTick).toBeNull();
  });

  it('requires all three conditions together, not any two', () => {
    // Each failure exercised separately, so the conjunction is measured.
    const wrongEnergy = run([COMPRESSIONS(400), EPINEPHRINE(600), SHOCK(900, 360)]);
    const noDrug = run([COMPRESSIONS(400), SHOCK(900)]);
    const compressionsStopped = run([
      COMPRESSIONS(400), EPINEPHRINE(600), COMPRESSIONS(800, false), SHOCK(1500),
    ]);
    for (const result of [wrongEnergy, noDrug, compressionsStopped]) {
      expect(result.resuscitation.defibrillationShockCount).toBe(1);
      expect(result.resuscitation.roscAtTick).toBeNull();
      expect(result.findings[2]!.outcome).toBe('partly-met');
    }
    // And all three together do convert.
    expect(run(FIXTURES.expert).resuscitation.roscAtTick).toBe(900);
  });

  it('cannot fail the non-shockable objective, however many shocks are fired', () => {
    // The scenario holds no non-shockable rhythm to shock, and the engine
    // refuses defibrillation once conversion has ended the arrest.
    const spree = run([
      COMPRESSIONS(400), SHOCK(500), SHOCK(700), EPINEPHRINE(800),
      SHOCK(1000), SHOCK(1600), SHOCK(2200),
    ]);
    expect(spree.findings[3]!.outcome).toBe('met');
    expect(spree.resuscitation.roscAtTick).toBe(1000);
    // Three delivered before conversion; the last two refused outright.
    expect(spree.resuscitation.defibrillationShockCount).toBe(3);
    expect(spree.events.filter(({ eventId }) =>
      eventId.startsWith('bad-defibrillation-'))).toHaveLength(2);
    // Every bound path agrees, including the one that does nothing.
    for (const path of ['expert', 'commonError', 'recovery', 'noAction'] as const) {
      expect(run(FIXTURES[path]).findings[3]!.outcome).toBe('met');
    }
  });

  it('converts on the second shock once the drug is given', () => {
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['met', 'met', 'met', 'met']);
    expect(recovered.resuscitation.roscAtTick).toBe(1300);
    expect(recovered.resuscitation.defibrillationShockCount).toBe(2);
    expect(FIXTURES.recovery.slice(0, FIXTURES.commonError.length))
      .toEqual([...FIXTURES.commonError]);
  });

  it('answers nothing when the arrest is ignored', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'met']);
    expect(idle.resuscitation.roscAtTick).toBeNull();
    expect(idle.findings[0]!.finding).toContain('No accepted chest-compression start');
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations).toContain('cardiac-arrest-actions-are-screen-proxies');
    expect(SCENARIO.metadata.limitations).toContain('no-post-cardiac-arrest-care');
    // Not an empty formulary: emergency medicine's same-shape lesson requires
    // one and this scenario carries a syringe, which is a second reason the two
    // guards can never answer for each other.
    expect(SCENARIO.formulary.length).toBeGreaterThan(0);
  });
});
