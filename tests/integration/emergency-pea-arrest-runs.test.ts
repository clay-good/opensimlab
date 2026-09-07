/**
 * Reference transcripts for the emergency PEA-arrest lesson, replayed through
 * the real engine.
 *
 * The assertion this file exists for is that the shock is available and wrong.
 * A tray that hid the button would teach nothing: what the transcript has to
 * show is that the engine accepted 200 J into pulseless electrical activity,
 * did not convert it, and put that in the debrief.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent } from '@platform/kernel/protocol';
import { PEA_ARREST as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/pea-arrest';
import { PERSISTENT_VF_ARREST } from '../../src/modules/emergency-medicine/scenarios/persistent-vf-arrest';
import {
  PEA_ARREST_FIXTURES as FIXTURES, PEA_ARREST_REFUSAL_DISPATCH, type PeaArrestRefusal,
} from '../../src/modules/emergency-medicine/pea-arrest-fixtures';
import {
  PEA_ARREST_ACTIONS, PEA_ARREST_DISPATCH, PEA_ARREST_OBJECTIVES,
  supportsPeaArrest, type PeaArrestAction,
} from '../../src/modules/emergency-medicine/pea-arrest';
import { peaArrestCompletionEvidence } from '../../src/modules/emergency-medicine/pea-arrest-completion';
import { peaArrestInlinePrompt } from '../../src/modules/emergency-medicine/tutor/pea-arrest-guidance';

type Step = PeaArrestAction | PeaArrestRefusal;
type Choices = readonly (readonly [number, Step])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const dispatch = (step: Step) => (step in PEA_ARREST_DISPATCH
  ? PEA_ARREST_DISPATCH[step as PeaArrestAction]
  : PEA_ARREST_REFUSAL_DISPATCH[step as PeaArrestRefusal]);
const findings = (events: readonly EngineEvent[]) => objectiveFindings(
  SCENARIO, [{ tick: 1, state: {}, concentrations: [] }] as never, 0, 0, [], events,
);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) {
      engine.apply({ tick, ...dispatch(actions[next]![1]) }); next += 1;
    }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must not change what the engine publishes.
    const before = JSON.stringify(frame.equipment.resuscitation);
    const prompt = peaArrestInlinePrompt(level, {
      scenarioVersion: SCENARIO.metadata.version, patient: frame.equipment.resuscitation,
    });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation };
}

describe('Emergency PEA arrest transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(PEA_ARREST_ACTIONS).toHaveLength(3);
    expect(SCENARIO.metadata.objectives).toHaveLength(3);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsPeaArrest(SCENARIO)).toBe(true);
    // The sibling arrest lesson shares every control and must not be read as this one.
    expect(supportsPeaArrest(PERSISTENT_VF_ARREST)).toBe(false);
    expect(supportsPeaArrest({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'pea'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(peaArrestCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(peaArrestCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(peaArrestCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(peaArrestCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...PEA_ARREST_OBJECTIVES]);
    expect([...PEA_ARREST_OBJECTIVES]).not.toEqual([...PEA_ARREST_ACTIONS]);
    expect(supportsPeaArrest({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: PEA_ARREST_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: PEA_ARREST_ACTIONS[index]!,
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

  it('meets every objective on the expert path and none with no action', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(findings(expert.events).map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met']);
    expect(expert.patient).toMatchObject({
      cardiacArrestActive: true, chestCompressionsActive: true,
      arrestEpinephrineTotalMg: 1, defibrillationShockCount: 0, roscAtTick: null,
    });
    const idle = run(FIXTURES.noAction, 8);
    // The shock objective is scored on a thing not done, so idling meets it.
    expect(findings(idle.events).map(({ outcome }) => outcome)).toEqual(['not-met', 'not-met', 'met']);
    expect(idle.patient.chestCompressionSeconds).toBe(0);
  });

  it('delivers the shock the tray does not offer, and does not convert the rhythm', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      defibrillationShockCount: 1, lastDefibrillationEnergyJ: 200, roscAtTick: null,
    });
    // The rest of the run was done correctly; the shock is still in the transcript.
    expect(findings(errored.events).map(({ outcome }) => outcome)).toEqual(['met', 'met', 'not-met']);
    const transcript = JSON.stringify(errored.events);
    expect(transcript).toContain('The non-shockable rhythm did not convert.');
    expect(transcript).toContain('"rhythmBefore":"pea"');
  });

  it('refuses every malformed arrest dose and accepts exactly one', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.arrestEpinephrineTotalMg).toBe(1);
    expect(findings(recovered.events).map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met']);
    const refusals = recovered.events.filter((event) => event.eventId.startsWith('bad-arrest-epinephrine-'));
    // The wrong route, the wrong dose, and the second dose.
    expect(refusals).toHaveLength(3);
    expect(recovered.events.filter((event) => event.eventId.startsWith('cardiac-arrest-epinephrine-')))
      .toHaveLength(1);
  });

  it('scores the dose given without compressions as partly met, and cannot be retaken', () => {
    const early = run([[1, 'give-one-milligram-epinephrine'], [2, 'start-compressions'],
      [3, 'give-one-milligram-epinephrine']], 6);
    expect(early.patient.arrestEpinephrineTotalMg).toBe(1);
    expect(findings(early.events).map(({ outcome }) => outcome)).toEqual(['met', 'partly-met', 'met']);
  });

  it('refuses compressions and the arrest dose before the arrest is active', () => {
    const engine = create();
    engine.apply({ tick: 0, ...PEA_ARREST_DISPATCH['start-compressions'] });
    engine.apply({ tick: 0, ...PEA_ARREST_DISPATCH['give-one-milligram-epinephrine'] });
    const frame = engine.step();
    const transcript = JSON.stringify(frame.events);
    expect(transcript).toContain('Chest compressions require an active scripted cardiac arrest');
    expect(transcript).toContain('This bounded cardiac-arrest action requires an active scripted arrest');
    expect(frame.equipment.resuscitation).toMatchObject({
      chestCompressionsActive: false, arrestEpinephrineTotalMg: 0,
    });
  });
});
